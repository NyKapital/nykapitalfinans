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

export interface Transaction {
  id: string;
  accountId: string;
  type: 'incoming' | 'outgoing';
  amount: number;
  currency: string;
  description: string;
  counterparty: string;
  reference?: string;
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
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  scheduledFor?: string;
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
  dueDate: string;
  createdAt: string;
  paidAt?: string;
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
}
