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

  const userTransactions = transactions
    .filter((tx) => userAccountIds.includes(tx.accountId))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

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
