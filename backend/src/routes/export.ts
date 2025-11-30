import express, { Response } from 'express';
import { transactions, accounts } from '../data/mockData';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Export transactions as CSV
router.get('/csv', authenticate, (req: AuthRequest, res: Response): void => {
  const { startDate, endDate, accountId } = req.query;

  let userAccountIds = accounts
    .filter((acc) => acc.userId === req.userId)
    .map((acc) => acc.id);

  // Filter by specific account if provided
  if (accountId && typeof accountId === 'string') {
    if (!userAccountIds.includes(accountId)) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }
    userAccountIds = [accountId];
  }

  let filteredTransactions = transactions.filter((tx) =>
    userAccountIds.includes(tx.accountId)
  );

  // Filter by date range
  if (startDate && typeof startDate === 'string') {
    const start = new Date(startDate);
    filteredTransactions = filteredTransactions.filter(
      (tx) => tx.createdAt >= start
    );
  }

  if (endDate && typeof endDate === 'string') {
    const end = new Date(endDate);
    filteredTransactions = filteredTransactions.filter((tx) => tx.createdAt <= end);
  }

  // Sort by date
  filteredTransactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  // Generate CSV
  const headers = [
    'Dato',
    'Type',
    'Modtager/Afsender',
    'Beskrivelse',
    'Kategori',
    'Reference',
    'Beløb',
    'Valuta',
    'Status',
  ];

  const rows = filteredTransactions.map((tx) => [
    tx.createdAt.toISOString().split('T')[0],
    tx.type === 'incoming' ? 'Indgående' : 'Udgående',
    tx.counterparty,
    tx.description,
    tx.category || '',
    tx.reference || '',
    tx.amount.toString(),
    tx.currency,
    tx.status === 'completed' ? 'Gennemført' : tx.status === 'pending' ? 'Afventer' : 'Fejlet',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="transaktioner_${new Date().toISOString().split('T')[0]}.csv"`
  );

  // Add UTF-8 BOM for proper Excel opening
  res.send('\uFEFF' + csvContent);
});

export default router;
