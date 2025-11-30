import express, { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { recurringPayments, accounts } from '../data/mockData';
import { authenticate, AuthRequest } from '../middleware/auth';
import { RecurringPayment } from '../types';

const router = express.Router();

// Get all recurring payments for user's accounts
router.get('/', authenticate, (req: AuthRequest, res: Response): void => {
  const userAccountIds = accounts
    .filter((acc) => acc.userId === req.userId)
    .map((acc) => acc.id);

  const userRecurringPayments = recurringPayments
    .filter((rp) => userAccountIds.includes(rp.accountId))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  res.json(userRecurringPayments);
});

// Get specific recurring payment
router.get('/:id', authenticate, (req: AuthRequest, res: Response): void => {
  const userAccountIds = accounts
    .filter((acc) => acc.userId === req.userId)
    .map((acc) => acc.id);

  const recurringPayment = recurringPayments.find(
    (rp) => rp.id === req.params.id && userAccountIds.includes(rp.accountId)
  );

  if (!recurringPayment) {
    res.status(404).json({ error: 'Recurring payment not found' });
    return;
  }

  res.json(recurringPayment);
});

// Create new recurring payment
router.post('/', authenticate, (req: AuthRequest, res: Response): void => {
  const {
    accountId,
    recipientName,
    recipientAccount,
    amount,
    currency,
    description,
    reference,
    category,
    frequency,
    startDate,
  } = req.body;

  // Verify account belongs to user
  const account = accounts.find(
    (acc) => acc.id === accountId && acc.userId === req.userId
  );

  if (!account) {
    res.status(404).json({ error: 'Account not found' });
    return;
  }

  const start = new Date(startDate);
  const newRecurringPayment: RecurringPayment = {
    id: uuidv4(),
    accountId,
    recipientName,
    recipientAccount,
    amount,
    currency: currency || account.currency,
    description,
    reference,
    category,
    frequency,
    startDate: start,
    nextPaymentDate: start,
    status: 'active',
    createdAt: new Date(),
  };

  recurringPayments.push(newRecurringPayment);

  res.status(201).json(newRecurringPayment);
});

// Update recurring payment (pause/cancel)
router.patch('/:id', authenticate, (req: AuthRequest, res: Response): void => {
  const userAccountIds = accounts
    .filter((acc) => acc.userId === req.userId)
    .map((acc) => acc.id);

  const recurringPayment = recurringPayments.find(
    (rp) => rp.id === req.params.id && userAccountIds.includes(rp.accountId)
  );

  if (!recurringPayment) {
    res.status(404).json({ error: 'Recurring payment not found' });
    return;
  }

  const { status } = req.body;

  if (status) {
    recurringPayment.status = status;
  }

  res.json(recurringPayment);
});

// Delete recurring payment
router.delete('/:id', authenticate, (req: AuthRequest, res: Response): void => {
  const userAccountIds = accounts
    .filter((acc) => acc.userId === req.userId)
    .map((acc) => acc.id);

  const index = recurringPayments.findIndex(
    (rp) => rp.id === req.params.id && userAccountIds.includes(rp.accountId)
  );

  if (index === -1) {
    res.status(404).json({ error: 'Recurring payment not found' });
    return;
  }

  recurringPayments.splice(index, 1);

  res.status(204).send();
});

export default router;
