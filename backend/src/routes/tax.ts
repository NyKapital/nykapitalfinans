import express, { Response } from 'express';
import { transactions, invoices, accounts } from '../data/mockData';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get VAT/Moms report for a specific period
router.get('/moms', authenticate, (req: AuthRequest, res: Response): void => {
  const { quarter, year } = req.query;

  if (!quarter || !year) {
    res.status(400).json({ error: 'Quarter and year are required' });
    return;
  }

  const q = parseInt(quarter as string);
  const y = parseInt(year as string);

  if (q < 1 || q > 4) {
    res.status(400).json({ error: 'Quarter must be between 1 and 4' });
    return;
  }

  // Calculate quarter start and end months
  const startMonth = (q - 1) * 3;
  const endMonth = startMonth + 2;

  // Get user's accounts
  const userAccounts = accounts.filter((acc) => acc.userId === req.userId);
  const userAccountIds = userAccounts.map((acc) => acc.id);

  // Get user's invoices for the period
  const userInvoices = invoices.filter((inv) => {
    if (inv.userId !== req.userId) return false;
    const invDate = new Date(inv.createdAt);
    return (
      invDate.getFullYear() === y &&
      invDate.getMonth() >= startMonth &&
      invDate.getMonth() <= endMonth
    );
  });

  // Calculate sales (udgående moms - VAT on sales)
  const totalSales = userInvoices
    .filter((inv) => inv.status === 'paid' || inv.status === 'partially_paid')
    .reduce((sum, inv) => sum + inv.subtotal, 0);

  const momsOnSales = userInvoices
    .filter((inv) => inv.status === 'paid' || inv.status === 'partially_paid')
    .reduce((sum, inv) => sum + inv.tax, 0);

  // Calculate purchases (indgående moms - VAT on purchases)
  // For MVP, we'll estimate 25% VAT on outgoing transactions
  const purchases = transactions
    .filter((tx) => {
      if (!userAccountIds.includes(tx.accountId)) return false;
      if (tx.type !== 'outgoing') return false;

      const txDate = new Date(tx.createdAt);
      return (
        txDate.getFullYear() === y &&
        txDate.getMonth() >= startMonth &&
        txDate.getMonth() <= endMonth
      );
    });

  const totalPurchases = purchases.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  // Calculate VAT on purchases (assuming 25% VAT included in prices)
  const momsOnPurchases = totalPurchases * 0.20; // 20% of total amount (since 25% VAT means 80% is base, 20% is VAT)

  // Net VAT to pay to SKAT
  const netMoms = momsOnSales - momsOnPurchases;

  // Breakdown by category
  const categoryBreakdown = purchases.reduce((acc, tx) => {
    if (!tx.category) return acc;

    const category = tx.category;
    if (!acc[category]) {
      acc[category] = {
        category,
        totalAmount: 0,
        estimatedMoms: 0,
        count: 0,
      };
    }

    const amount = Math.abs(tx.amount);
    acc[category].totalAmount += amount;
    acc[category].estimatedMoms += amount * 0.20;
    acc[category].count += 1;

    return acc;
  }, {} as Record<string, any>);

  res.json({
    period: {
      quarter: q,
      year: y,
      startMonth: startMonth + 1,
      endMonth: endMonth + 1,
    },
    sales: {
      totalSales,
      momsOnSales,
      invoiceCount: userInvoices.filter((inv) => inv.status === 'paid' || inv.status === 'partially_paid').length,
    },
    purchases: {
      totalPurchases,
      momsOnPurchases,
      transactionCount: purchases.length,
      categoryBreakdown: Object.values(categoryBreakdown),
    },
    summary: {
      udgåendeMoms: momsOnSales, // VAT collected from customers
      indgåendeMoms: momsOnPurchases, // VAT paid on purchases
      netMomsTilbetaling: netMoms, // Net VAT to pay to SKAT (can be negative for refund)
    },
  });
});

// Get annual tax summary
router.get('/annual-summary', authenticate, (req: AuthRequest, res: Response): void => {
  const { year } = req.query;

  if (!year) {
    res.status(400).json({ error: 'Year is required' });
    return;
  }

  const y = parseInt(year as string);

  // Get user's accounts
  const userAccounts = accounts.filter((acc) => acc.userId === req.userId);
  const userAccountIds = userAccounts.map((acc) => acc.id);

  // Get all invoices for the year
  const yearInvoices = invoices.filter((inv) => {
    if (inv.userId !== req.userId) return false;
    const invDate = new Date(inv.createdAt);
    return invDate.getFullYear() === y;
  });

  // Get all transactions for the year
  const yearTransactions = transactions.filter((tx) => {
    if (!userAccountIds.includes(tx.accountId)) return false;
    const txDate = new Date(tx.createdAt);
    return txDate.getFullYear() === y;
  });

  // Calculate totals
  const totalRevenue = yearInvoices
    .filter((inv) => inv.status === 'paid' || inv.status === 'partially_paid')
    .reduce((sum, inv) => sum + inv.subtotal, 0);

  const totalVATCollected = yearInvoices
    .filter((inv) => inv.status === 'paid' || inv.status === 'partially_paid')
    .reduce((sum, inv) => sum + inv.tax, 0);

  const totalExpenses = yearTransactions
    .filter((tx) => tx.type === 'outgoing')
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const totalIncome = yearTransactions
    .filter((tx) => tx.type === 'incoming')
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Expenses by category
  const expensesByCategory = yearTransactions
    .filter((tx) => tx.type === 'outgoing' && tx.category)
    .reduce((acc, tx) => {
      const category = tx.category!;
      acc[category] = (acc[category] || 0) + Math.abs(tx.amount);
      return acc;
    }, {} as Record<string, number>);

  // Quarterly breakdown
  const quarterlyData = [];
  for (let q = 1; q <= 4; q++) {
    const startMonth = (q - 1) * 3;
    const endMonth = startMonth + 2;

    const quarterInvoices = yearInvoices.filter((inv) => {
      const invDate = new Date(inv.createdAt);
      return invDate.getMonth() >= startMonth && invDate.getMonth() <= endMonth;
    });

    const quarterTransactions = yearTransactions.filter((tx) => {
      const txDate = new Date(tx.createdAt);
      return txDate.getMonth() >= startMonth && txDate.getMonth() <= endMonth;
    });

    const quarterRevenue = quarterInvoices
      .filter((inv) => inv.status === 'paid' || inv.status === 'partially_paid')
      .reduce((sum, inv) => sum + inv.subtotal, 0);

    const quarterExpenses = quarterTransactions
      .filter((tx) => tx.type === 'outgoing')
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    const quarterIncome = quarterTransactions
      .filter((tx) => tx.type === 'incoming')
      .reduce((sum, tx) => sum + tx.amount, 0);

    quarterlyData.push({
      quarter: q,
      revenue: quarterRevenue,
      expenses: quarterExpenses,
      income: quarterIncome,
      profit: quarterRevenue - quarterExpenses,
    });
  }

  res.json({
    year: y,
    summary: {
      totalRevenue,
      totalExpenses,
      totalIncome,
      totalVATCollected,
      profit: totalRevenue - totalExpenses,
    },
    expensesByCategory,
    quarterlyData,
    invoiceStats: {
      total: yearInvoices.length,
      paid: yearInvoices.filter((inv) => inv.status === 'paid').length,
      pending: yearInvoices.filter((inv) => inv.status === 'sent').length,
      overdue: yearInvoices.filter((inv) => inv.status === 'overdue').length,
    },
  });
});

export default router;
