import express, { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { transactions, accounts } from '../data/mockData';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Transaction } from '../types';

const router = express.Router();

// Get all transactions for user's accounts
router.get('/', authenticate, (req: AuthRequest, res: Response): void => {
  const userAccountIds = accounts
    .filter((acc) => acc.userId === req.userId)
    .map((acc) => acc.id);

  let userTransactions = transactions
    .filter((tx) => userAccountIds.includes(tx.accountId));

  // Apply filters
  const { startDate, endDate, search, category, minAmount, maxAmount, accountId } = req.query;

  if (accountId) {
    userTransactions = userTransactions.filter((tx) => tx.accountId === accountId);
  }

  if (startDate) {
    const start = new Date(startDate as string);
    userTransactions = userTransactions.filter((tx) => tx.createdAt >= start);
  }

  if (endDate) {
    const end = new Date(endDate as string);
    end.setHours(23, 59, 59, 999);
    userTransactions = userTransactions.filter((tx) => tx.createdAt <= end);
  }

  if (search) {
    const searchLower = (search as string).toLowerCase();
    userTransactions = userTransactions.filter(
      (tx) =>
        tx.counterparty.toLowerCase().includes(searchLower) ||
        tx.description.toLowerCase().includes(searchLower) ||
        (tx.reference && tx.reference.toLowerCase().includes(searchLower))
    );
  }

  if (category) {
    userTransactions = userTransactions.filter((tx) => tx.category === category);
  }

  if (minAmount) {
    userTransactions = userTransactions.filter((tx) => Math.abs(tx.amount) >= Number(minAmount));
  }

  if (maxAmount) {
    userTransactions = userTransactions.filter((tx) => Math.abs(tx.amount) <= Number(maxAmount));
  }

  // Sort by date descending
  userTransactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  res.json(userTransactions);
});

// Get transactions for specific account
router.get('/account/:accountId', authenticate, (req: AuthRequest, res: Response): void => {
  const account = accounts.find(
    (acc) => acc.id === req.params.accountId && acc.userId === req.userId
  );

  if (!account) {
    res.status(404).json({ error: 'Account not found' });
    return;
  }

  const accountTransactions = transactions
    .filter((tx) => tx.accountId === req.params.accountId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  res.json(accountTransactions);
});

// Receive payment (incoming transaction)
router.post('/receive', authenticate, (req: AuthRequest, res: Response): void => {
  const {
    accountId,
    amount,
    description,
    counterparty,
    reference,
    category,
  } = req.body;

  // Verify account belongs to user
  const account = accounts.find(
    (acc) => acc.id === accountId && acc.userId === req.userId
  );

  if (!account) {
    res.status(404).json({ error: 'Account not found' });
    return;
  }

  // Add to account balance
  account.balance += amount;

  // Create incoming transaction
  const transaction: Transaction = {
    id: uuidv4(),
    accountId,
    type: 'incoming',
    amount,
    currency: account.currency,
    description,
    counterparty,
    reference,
    category,
    status: 'completed',
    createdAt: new Date(),
    completedAt: new Date(),
  };

  transactions.push(transaction);

  res.status(201).json(transaction);
});

export default router;
