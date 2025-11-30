export interface User {
  id: string;
  email: string;
  name: string;
  companyName: string;
  cvr: string;
  createdAt: string;
}

export interface Account {
  id: string;
  userId: string;
  accountNumber: string;
  balance: number;
  currency: 'DKK' | 'EUR' | 'USD';
  type: 'business' | 'savings';
  status: 'active' | 'frozen' | 'closed';
  createdAt: string;
}

export type TransactionCategory =
  | 'salary'
  | 'office'
  | 'marketing'
  | 'travel'
  | 'software'
  | 'equipment'
  | 'rent'
  | 'utilities'
  | 'insurance'
  | 'tax'
  | 'sales'
  | 'services'
  | 'consulting'
  | 'other';

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
  createdAt: string;
  completedAt?: string;
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
  createdAt: string;
  scheduledFor?: string;
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
  startDate: string;
  nextPaymentDate: string;
  endDate?: string;
  status: 'active' | 'paused' | 'cancelled';
  createdAt: string;
  lastPaymentId?: string;
}

export interface InvoicePayment {
  id: string;
  amount: number;
  date: string;
  method?: string;
  reference?: string;
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
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'partially_paid';
  dueDate: string;
  createdAt: string;
  paidAt?: string;
  amountPaid: number;
  payments: InvoicePayment[];
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Analytics {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  totalInvoiced: number;
  totalPaid: number;
  totalOverdue: number;
  accountCount: number;
  overdueInvoiceCount: number;
  monthlyData: {
    month: string;
    income: number;
    expenses: number;
  }[];
  categoryData: {
    category: string;
    amount: number;
  }[];
}

export interface Budget {
  id: string;
  userId: string;
  category: TransactionCategory;
  amount: number;
  period: 'monthly';
  createdAt: string;
  updatedAt: string;
}

export interface BudgetPerformance {
  budgetId: string;
  category: TransactionCategory;
  budgetAmount: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: 'good' | 'warning' | 'danger' | 'over';
}
