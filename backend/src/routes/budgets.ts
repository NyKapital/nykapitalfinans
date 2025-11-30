import express, { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { budgets, transactions, accounts } from '../data/mockData';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Budget, TransactionCategory } from '../types';

const router = express.Router();

// Get all budgets for user
router.get('/', authenticate, (req: AuthRequest, res: Response): void => {
  const userBudgets = budgets
    .filter((budget) => budget.userId === req.userId)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  res.json(userBudgets);
});

// Get budget performance (budget vs actual spending)
router.get('/performance', authenticate, (req: AuthRequest, res: Response): void => {
  const { month, year } = req.query;

  // Default to current month/year if not provided
  const now = new Date();
  const targetMonth = month ? parseInt(month as string) : now.getMonth();
  const targetYear = year ? parseInt(year as string) : now.getFullYear();

  // Get user's accounts
  const userAccounts = accounts.filter((acc) => acc.userId === req.userId);
  const userAccountIds = userAccounts.map((acc) => acc.id);

  // Get user's budgets
  const userBudgets = budgets.filter((budget) => budget.userId === req.userId);

  // Calculate actual spending for each category in the target month
  const categorySpending: Record<TransactionCategory, number> = {} as Record<TransactionCategory, number>;

  transactions
    .filter((tx) => {
      if (!userAccountIds.includes(tx.accountId)) return false;
      if (tx.type !== 'outgoing') return false;
      if (!tx.category) return false;

      const txDate = new Date(tx.createdAt);
      return (
        txDate.getMonth() === targetMonth &&
        txDate.getFullYear() === targetYear
      );
    })
    .forEach((tx) => {
      if (tx.category) {
        categorySpending[tx.category] = (categorySpending[tx.category] || 0) + Math.abs(tx.amount);
      }
    });

  // Build performance data
  const performance = userBudgets.map((budget) => {
    const spent = categorySpending[budget.category] || 0;
    const remaining = budget.amount - spent;
    const percentage = (spent / budget.amount) * 100;

    let status: 'good' | 'warning' | 'danger' | 'over';
    if (percentage >= 100) {
      status = 'over';
    } else if (percentage >= 90) {
      status = 'danger';
    } else if (percentage >= 80) {
      status = 'warning';
    } else {
      status = 'good';
    }

    return {
      budgetId: budget.id,
      category: budget.category,
      budgetAmount: budget.amount,
      spent,
      remaining,
      percentage: Math.round(percentage * 10) / 10,
      status,
    };
  });

  res.json({
    month: targetMonth,
    year: targetYear,
    performance,
    totalBudget: userBudgets.reduce((sum, b) => sum + b.amount, 0),
    totalSpent: Object.values(categorySpending).reduce((sum, s) => sum + s, 0),
  });
});

// Create new budget
router.post('/', authenticate, (req: AuthRequest, res: Response): void => {
  const { category, amount } = req.body;

  if (!category || !amount || amount <= 0) {
    res.status(400).json({ error: 'Invalid budget data' });
    return;
  }

  // Check if budget for this category already exists
  const existingBudget = budgets.find(
    (b) => b.userId === req.userId && b.category === category
  );

  if (existingBudget) {
    res.status(400).json({ error: 'Budget for this category already exists' });
    return;
  }

  const newBudget: Budget = {
    id: uuidv4(),
    userId: req.userId!,
    category,
    amount,
    period: 'monthly',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  budgets.push(newBudget);
  res.status(201).json(newBudget);
});

// Update budget
router.put('/:id', authenticate, (req: AuthRequest, res: Response): void => {
  const budget = budgets.find(
    (b) => b.id === req.params.id && b.userId === req.userId
  );

  if (!budget) {
    res.status(404).json({ error: 'Budget not found' });
    return;
  }

  const { amount } = req.body;

  if (amount !== undefined) {
    if (amount <= 0) {
      res.status(400).json({ error: 'Budget amount must be positive' });
      return;
    }
    budget.amount = amount;
    budget.updatedAt = new Date();
  }

  res.json(budget);
});

// Delete budget
router.delete('/:id', authenticate, (req: AuthRequest, res: Response): void => {
  const budgetIndex = budgets.findIndex(
    (b) => b.id === req.params.id && b.userId === req.userId
  );

  if (budgetIndex === -1) {
    res.status(404).json({ error: 'Budget not found' });
    return;
  }

  budgets.splice(budgetIndex, 1);
  res.status(204).send();
});

export default router;
