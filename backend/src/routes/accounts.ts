import express, { Response } from 'express';
import { accounts } from '../data/mockData';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all accounts for the authenticated user
router.get('/', authenticate, (req: AuthRequest, res: Response): void => {
  const userAccounts = accounts.filter((acc) => acc.userId === req.userId);
  res.json(userAccounts);
});

// Get specific account
router.get('/:id', authenticate, (req: AuthRequest, res: Response): void => {
  const account = accounts.find(
    (acc) => acc.id === req.params.id && acc.userId === req.userId
  );

  if (!account) {
    res.status(404).json({ error: 'Account not found' });
    return;
  }

  res.json(account);
});

export default router;
