import express, { Response } from 'express';
import * as XLSX from 'xlsx';
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

// Export transactions as Excel (XLSX)
router.get('/xlsx', authenticate, (req: AuthRequest, res: Response): void => {
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

  // Prepare data for Excel
  const transactionData = filteredTransactions.map((tx) => ({
    Dato: tx.createdAt.toISOString().split('T')[0],
    Type: tx.type === 'incoming' ? 'Indgående' : 'Udgående',
    'Modtager/Afsender': tx.counterparty,
    Beskrivelse: tx.description,
    Kategori: tx.category || '',
    Reference: tx.reference || '',
    Beløb: tx.amount,
    Valuta: tx.currency,
    Status: tx.status === 'completed' ? 'Gennemført' : tx.status === 'pending' ? 'Afventer' : 'Fejlet',
  }));

  // Calculate summary
  const totalIncoming = filteredTransactions
    .filter((tx) => tx.type === 'incoming')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalOutgoing = Math.abs(
    filteredTransactions
      .filter((tx) => tx.type === 'outgoing')
      .reduce((sum, tx) => sum + tx.amount, 0)
  );

  const summaryData = [
    { Beskrivelse: 'Total Indgående', Beløb: totalIncoming },
    { Beskrivelse: 'Total Udgående', Beløb: totalOutgoing },
    { Beskrivelse: 'Netto', Beløb: totalIncoming - totalOutgoing },
  ];

  // Create workbook with multiple sheets
  const wb = XLSX.utils.book_new();

  // Add Transactions sheet
  const ws1 = XLSX.utils.json_to_sheet(transactionData);

  // Set column widths
  ws1['!cols'] = [
    { wch: 12 }, // Dato
    { wch: 12 }, // Type
    { wch: 25 }, // Modtager/Afsender
    { wch: 30 }, // Beskrivelse
    { wch: 15 }, // Kategori
    { wch: 15 }, // Reference
    { wch: 12 }, // Beløb
    { wch: 8 },  // Valuta
    { wch: 12 }, // Status
  ];

  XLSX.utils.book_append_sheet(wb, ws1, 'Transaktioner');

  // Add Summary sheet
  const ws2 = XLSX.utils.json_to_sheet(summaryData);
  ws2['!cols'] = [
    { wch: 20 },
    { wch: 15 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, 'Oversigt');

  // Generate Excel file
  const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="transaktioner_${new Date().toISOString().split('T')[0]}.xlsx"`
  );

  res.send(excelBuffer);
});

export default router;
