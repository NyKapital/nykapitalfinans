export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  companyName: string;
  cvr: string; // Danish CVR number
  createdAt: Date;
}

export interface Account {
  id: string;
  userId: string;
  accountNumber: string;
  balance: number;
  currency: 'DKK' | 'EUR' | 'USD';
  type: 'business' | 'savings';
  status: 'active' | 'frozen' | 'closed';
  createdAt: Date;
}

export type TransactionCategory =
  | 'salary' // Løn
  | 'office' // Kontor
  | 'marketing' // Marketing
  | 'travel' // Rejse
  | 'software' // Software
  | 'equipment' // Udstyr
  | 'rent' // Husleje
  | 'utilities' // Forsyning
  | 'insurance' // Forsikring
  | 'tax' // Skat
  | 'sales' // Salg
  | 'services' // Tjenester
  | 'consulting' // Konsulentydelser
  | 'other'; // Andet

export interface Transaction {
  id: string;
  accountId: string;
  type: 'incoming' | 'outgoing';
  amount: number;
  currency: string;
  description: string;
  counterparty: string;
  reference?: string;
  category?: TransactionCategory;
  tags?: string[];
  status: 'completed' | 'pending' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

export interface Payment {
  id: string;
  accountId: string;
  recipientName: string;
  recipientAccount: string;
  amount: number;
  currency: string;
  description: string;
  reference: string;
  category?: TransactionCategory;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  scheduledFor?: Date;
}

export interface RecurringPayment {
  id: string;
  accountId: string;
  recipientName: string;
  recipientAccount: string;
  amount: number;
  currency: string;
  description: string;
  reference: string;
  category?: TransactionCategory;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
  nextPaymentDate: Date;
  endDate?: Date;
  status: 'active' | 'paused' | 'cancelled';
  createdAt: Date;
  lastPaymentId?: string;
}

export interface Invoice {
  id: string;
  userId: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  customerCVR?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: Date;
  createdAt: Date;
  paidAt?: Date;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Budget {
  id: string;
  userId: string;
  category: TransactionCategory;
  amount: number; // Monthly budget amount
  period: 'monthly';
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthRequest extends Express.Request {
  userId?: string;
}
