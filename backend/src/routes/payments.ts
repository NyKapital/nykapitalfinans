import express, { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { payments, accounts } from '../data/mockData';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Payment } from '../types';

const router = express.Router();

// Get all payments for user's accounts
router.get('/', authenticate, (req: AuthRequest, res: Response): void => {
  const userAccountIds = accounts
    .filter((acc) => acc.userId === req.userId)
    .map((acc) => acc.id);

  const userPayments = payments
    .filter((pay) => userAccountIds.includes(pay.accountId))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  res.json(userPayments);
});

// Create new payment
router.post('/', authenticate, (req: AuthRequest, res: Response): void => {
  const {
    accountId,
    recipientName,
    recipientAccount,
    amount,
    currency,
    description,
    reference,
    scheduledFor,
  } = req.body;

  // Verify account belongs to user
  const account = accounts.find(
    (acc) => acc.id === accountId && acc.userId === req.userId
  );

  if (!account) {
    res.status(404).json({ error: 'Account not found' });
    return;
  }

  // Check sufficient balance
  if (account.balance < amount) {
    res.status(400).json({ error: 'Insufficient balance' });
    return;
  }

  const newPayment: Payment = {
    id: uuidv4(),
    accountId,
    recipientName,
    recipientAccount,
    amount,
    currency: currency || account.currency,
    description,
    reference,
    status: 'pending',
    createdAt: new Date(),
    scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
  };

  payments.push(newPayment);

  res.status(201).json(newPayment);
});

export default router;
