import express, { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { payments, accounts, transactions } from '../data/mockData';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Payment, Transaction } from '../types';

const router = express.Router();

// Get all payments for user's accounts
router.get('/', authenticate, (req: AuthRequest, res: Response): void => {
  const userAccountIds = accounts
    .filter((acc) => acc.userId === req.userId)
    .map((acc) => acc.id);

  let userPayments = payments
    .filter((pay) => userAccountIds.includes(pay.accountId));

  // Apply filters
  const { startDate, endDate, search, category, status, accountId } = req.query;

  if (accountId) {
    userPayments = userPayments.filter((pay) => pay.accountId === accountId);
  }

  if (startDate) {
    const start = new Date(startDate as string);
    userPayments = userPayments.filter((pay) => pay.createdAt >= start);
  }

  if (endDate) {
    const end = new Date(endDate as string);
    end.setHours(23, 59, 59, 999);
    userPayments = userPayments.filter((pay) => pay.createdAt <= end);
  }

  if (search) {
    const searchLower = (search as string).toLowerCase();
    userPayments = userPayments.filter(
      (pay) =>
        pay.recipientName.toLowerCase().includes(searchLower) ||
        pay.description.toLowerCase().includes(searchLower) ||
        pay.reference.toLowerCase().includes(searchLower)
    );
  }

  if (category) {
    userPayments = userPayments.filter((pay) => pay.category === category);
  }

  if (status) {
    userPayments = userPayments.filter((pay) => pay.status === status);
  }

  // Sort by date descending
  userPayments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

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
    category: req.body.category,
    status: 'completed', // Process immediately for MVP
    createdAt: new Date(),
    scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
  };

  payments.push(newPayment);

  // Deduct from account balance
  account.balance -= amount;

  // Create corresponding transaction
  const transaction: Transaction = {
    id: uuidv4(),
    accountId,
    type: 'outgoing',
    amount: -amount,
    currency: currency || account.currency,
    description,
    counterparty: recipientName,
    reference,
    category: req.body.category,
    status: 'completed',
    createdAt: new Date(),
    completedAt: new Date(),
  };

  transactions.push(transaction);

  res.status(201).json(newPayment);
});

export default router;
