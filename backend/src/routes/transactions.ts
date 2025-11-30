import express, { Response } from 'express';
import { transactions, accounts } from '../data/mockData';
import { authenticate, AuthRequest } from '../middleware/auth';

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

export default router;
