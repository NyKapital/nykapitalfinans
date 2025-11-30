import express, { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { invoices } from '../data/mockData';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Invoice } from '../types';

const router = express.Router();

// Get all invoices for user
router.get('/', authenticate, (req: AuthRequest, res: Response): void => {
  const userInvoices = invoices
    .filter((inv) => inv.userId === req.userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  res.json(userInvoices);
});

// Get specific invoice
router.get('/:id', authenticate, (req: AuthRequest, res: Response): void => {
  const invoice = invoices.find(
    (inv) => inv.id === req.params.id && inv.userId === req.userId
  );

  if (!invoice) {
    res.status(404).json({ error: 'Invoice not found' });
    return;
  }

  res.json(invoice);
});

// Create new invoice
router.post('/', authenticate, (req: AuthRequest, res: Response): void => {
  const {
    customerName,
    customerEmail,
    customerCVR,
    items,
    currency,
    dueDate,
  } = req.body;

  // Calculate totals
  const subtotal = items.reduce((sum: number, item: any) => sum + item.total, 0);
  const tax = subtotal * 0.25; // 25% Danish VAT (moms)
  const total = subtotal + tax;

  // Generate invoice number
  const invoiceCount = invoices.filter((inv) => inv.userId === req.userId).length;
  const invoiceNumber = `2024-${String(invoiceCount + 1).padStart(3, '0')}`;

  const newInvoice: Invoice = {
    id: uuidv4(),
    userId: req.userId!,
    invoiceNumber,
    customerName,
    customerEmail,
    customerCVR,
    items,
    subtotal,
    tax,
    total,
    currency: currency || 'DKK',
    status: 'draft',
    dueDate: new Date(dueDate),
    createdAt: new Date(),
  };

  invoices.push(newInvoice);

  res.status(201).json(newInvoice);
});

// Update invoice status
router.patch('/:id', authenticate, (req: AuthRequest, res: Response): void => {
  const invoice = invoices.find(
    (inv) => inv.id === req.params.id && inv.userId === req.userId
  );

  if (!invoice) {
    res.status(404).json({ error: 'Invoice not found' });
    return;
  }

  const { status } = req.body;

  if (status) {
    invoice.status = status;
    if (status === 'paid') {
      invoice.paidAt = new Date();
    }
  }

  res.json(invoice);
});

export default router;
