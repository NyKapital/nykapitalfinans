import express, { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { invoices, users } from '../data/mockData';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Invoice } from '../types';
import { generateInvoicePDF } from '../utils/pdfGenerator';

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
    amountPaid: 0,
    payments: [],
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

// Record payment for invoice
router.post('/:id/payments', authenticate, (req: AuthRequest, res: Response): void => {
  const invoice = invoices.find(
    (inv) => inv.id === req.params.id && inv.userId === req.userId
  );

  if (!invoice) {
    res.status(404).json({ error: 'Invoice not found' });
    return;
  }

  const { amount, method, reference } = req.body;

  if (!amount || amount <= 0) {
    res.status(400).json({ error: 'Invalid payment amount' });
    return;
  }

  const remainingAmount = invoice.total - invoice.amountPaid;

  if (amount > remainingAmount) {
    res.status(400).json({
      error: 'Payment amount exceeds remaining balance',
      remainingAmount
    });
    return;
  }

  // Create payment record
  const payment = {
    id: uuidv4(),
    amount,
    date: new Date(),
    method: method || 'Bank Transfer',
    reference: reference || '',
  };

  // Add payment to invoice
  invoice.payments.push(payment);
  invoice.amountPaid += amount;

  // Update invoice status based on payment
  if (invoice.amountPaid >= invoice.total) {
    invoice.status = 'paid';
    invoice.paidAt = new Date();
  } else if (invoice.amountPaid > 0) {
    invoice.status = 'partially_paid';
  }

  res.status(201).json(invoice);
});

// Download invoice as PDF
router.get('/:id/pdf', authenticate, (req: AuthRequest, res: Response): void => {
  const invoice = invoices.find(
    (inv) => inv.id === req.params.id && inv.userId === req.userId
  );

  if (!invoice) {
    res.status(404).json({ error: 'Invoice not found' });
    return;
  }

  const user = users.find((u) => u.id === req.userId);

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="faktura_${invoice.invoiceNumber}.pdf"`
  );

  generateInvoicePDF(invoice, user, res);
});

export default router;
