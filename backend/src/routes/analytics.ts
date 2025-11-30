import express, { Response } from 'express';
import { transactions, accounts, invoices } from '../data/mockData';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get analytics overview
router.get('/', authenticate, (req: AuthRequest, res: Response): void => {
  const userAccounts = accounts.filter((acc) => acc.userId === req.userId);
  const userAccountIds = userAccounts.map((acc) => acc.id);
  let userTransactions = transactions.filter((tx) =>
    userAccountIds.includes(tx.accountId)
  );
  const userInvoices = invoices.filter((inv) => inv.userId === req.userId);

  // Apply date range filter if provided
  const { startDate, endDate } = req.query;
  let filteredTransactions = userTransactions;

  if (startDate) {
    const start = new Date(startDate as string);
    filteredTransactions = filteredTransactions.filter((tx) => tx.createdAt >= start);
  }

  if (endDate) {
    const end = new Date(endDate as string);
    end.setHours(23, 59, 59, 999);
    filteredTransactions = filteredTransactions.filter((tx) => tx.createdAt <= end);
  }

  // Calculate total balance (always current, not filtered)
  const totalBalance = userAccounts.reduce((sum, acc) => {
    if (acc.currency === 'DKK') return sum + acc.balance;
    // Simple conversion for demo (in production, use real exchange rates)
    if (acc.currency === 'EUR') return sum + acc.balance * 7.5;
    return sum;
  }, 0);

  // Calculate income and expenses for the filtered period
  const monthlyIncome = filteredTransactions
    .filter((tx) => tx.type === 'incoming')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const monthlyExpenses = Math.abs(
    filteredTransactions
      .filter((tx) => tx.type === 'outgoing')
      .reduce((sum, tx) => sum + tx.amount, 0)
  );

  // Invoice statistics
  const totalInvoiced = userInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const paidInvoices = userInvoices.filter((inv) => inv.status === 'paid');
  const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const overdueInvoices = userInvoices.filter((inv) => inv.status === 'overdue');
  const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + inv.total, 0);

  // Monthly transaction chart data (last 6 months)
  const now = new Date();
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const monthName = date.toLocaleDateString('da-DK', { month: 'short' });

    const monthTransactions = userTransactions.filter(
      (tx) => tx.createdAt >= date && tx.createdAt < nextMonth
    );

    const income = monthTransactions
      .filter((tx) => tx.type === 'incoming')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const expenses = Math.abs(
      monthTransactions
        .filter((tx) => tx.type === 'outgoing')
        .reduce((sum, tx) => sum + tx.amount, 0)
    );

    monthlyData.push({
      month: monthName,
      income,
      expenses,
    });
  }

  // Category breakdown (expenses by category) - use filtered transactions
  const categoryBreakdown: Record<string, number> = {};
  filteredTransactions
    .filter((tx) => tx.type === 'outgoing' && tx.category)
    .forEach((tx) => {
      const category = tx.category!;
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + Math.abs(tx.amount);
    });

  const categoryData = Object.entries(categoryBreakdown)
    .map(([category, amount]) => ({
      category,
      amount,
    }))
    .sort((a, b) => b.amount - a.amount);

  res.json({
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    totalInvoiced,
    totalPaid,
    totalOverdue,
    accountCount: userAccounts.length,
    overdueInvoiceCount: overdueInvoices.length,
    monthlyData,
    categoryData,
  });
});

export default router;
