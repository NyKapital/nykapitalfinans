import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  CreditCard,
  FileText,
  AlertCircle,
  Send,
  Download,
  ArrowDownLeft,
  RefreshCw,
  Plus
} from 'lucide-react';
import api from '../services/api';
import { Account, Transaction, Analytics, Invoice, RecurringPayment } from '../types';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [overdueInvoices, setOverdueInvoices] = useState<Invoice[]>([]);
  const [upcomingRecurring, setUpcomingRecurring] = useState<RecurringPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accountsRes, transactionsRes, analyticsRes, invoicesRes, recurringRes] = await Promise.all([
          api.get('/api/accounts'),
          api.get('/api/transactions'),
          api.get('/api/analytics'),
          api.get('/api/invoices'),
          api.get('/api/recurring-payments'),
        ]);

        setAccounts(accountsRes.data);
        setRecentTransactions(transactionsRes.data.slice(0, 5));
        setAnalytics(analyticsRes.data);
        setOverdueInvoices(invoicesRes.data.filter((inv: Invoice) => inv.status === 'overdue'));
        setUpcomingRecurring(recurringRes.data.filter((rp: RecurringPayment) => rp.status === 'active').slice(0, 3));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Indlæser...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Velkommen tilbage til NyKapital</p>
      </div>

      {/* Overdue Invoices Alert */}
      {overdueInvoices.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <div className="flex-1">
              <p className="font-semibold text-orange-900">
                {overdueInvoices.length} forfalden{overdueInvoices.length > 1 ? 'e' : ''} faktura{overdueInvoices.length > 1 ? 'er' : ''}
              </p>
              <p className="text-sm text-orange-700">
                Samlet beløb: {formatCurrency(overdueInvoices.reduce((sum, inv) => sum + inv.total, 0))}
              </p>
            </div>
            <Link
              to="/invoices"
              className="text-sm font-medium text-orange-700 hover:text-orange-800"
            >
              Se fakturaer →
            </Link>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/payments')}
          className="bg-primary-600 hover:bg-primary-700 text-white p-4 rounded-lg flex items-center gap-3 transition-colors"
        >
          <Send className="w-5 h-5" />
          <div className="text-left">
            <p className="font-semibold">Send Betaling</p>
            <p className="text-sm text-primary-100">Overfør penge nu</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/invoices')}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg flex items-center gap-3 transition-colors"
        >
          <FileText className="w-5 h-5" />
          <div className="text-left">
            <p className="font-semibold">Opret Faktura</p>
            <p className="text-sm text-blue-100">Ny faktura til kunde</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/transactions')}
          className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg flex items-center gap-3 transition-colors"
        >
          <ArrowDownLeft className="w-5 h-5" />
          <div className="text-left">
            <p className="font-semibold">Modtag Betaling</p>
            <p className="text-sm text-green-100">Registrer indkomst</p>
          </div>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Samlet Balance</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(analytics?.totalBalance || 0)}
              </p>
            </div>
            <div className="bg-primary-100 p-3 rounded-lg">
              <CreditCard className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Indkomst (måned)</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(analytics?.monthlyIncome || 0)}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Udgifter (måned)</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {formatCurrency(analytics?.monthlyExpenses || 0)}
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Forfaldne Fakturaer</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {formatCurrency(analytics?.totalOverdue || 0)}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      {analytics?.monthlyData && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Månedlig Oversigt</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Bar dataKey="income" name="Indkomst" fill="#10b981" />
              <Bar dataKey="expenses" name="Udgifter" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accounts */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Dine Konti</h2>
            <Link to="/accounts" className="text-primary-600 text-sm hover:text-primary-700">
              Se alle
            </Link>
          </div>
          <div className="space-y-3">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{account.accountNumber}</p>
                  <p className="text-sm text-gray-500">{account.type === 'business' ? 'Erhvervskonto' : 'Opsparingskonto'}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(account.balance, account.currency)}
                  </p>
                  <p className="text-xs text-gray-500">{account.currency}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Seneste Transaktioner</h2>
            <Link to="/transactions" className="text-primary-600 text-sm hover:text-primary-700">
              Se alle
            </Link>
          </div>
          <div className="space-y-3">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{tx.counterparty}</p>
                    <p className="text-sm text-gray-500">{tx.description}</p>
                    <p className="text-xs text-gray-400">{formatDate(tx.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${tx.type === 'incoming' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'incoming' ? '+' : ''}{formatCurrency(tx.amount, tx.currency)}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded ${
                      tx.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {tx.status === 'completed' ? 'Gennemført' : 'Afventer'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">Ingen transaktioner endnu</p>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Recurring Payments */}
      {upcomingRecurring.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-gray-700" />
              <h2 className="text-lg font-semibold text-gray-900">Kommende Tilbagevendende Betalinger</h2>
            </div>
            <Link to="/recurring-payments" className="text-primary-600 text-sm hover:text-primary-700">
              Se alle
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {upcomingRecurring.map((rp) => (
              <div key={rp.id} className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{rp.recipientName}</p>
                    <p className="text-sm text-gray-500">{rp.description}</p>
                  </div>
                  <p className="font-semibold text-gray-900">{formatCurrency(rp.amount, rp.currency)}</p>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="capitalize">{
                    rp.frequency === 'weekly' ? 'Ugentlig' :
                    rp.frequency === 'monthly' ? 'Månedlig' :
                    rp.frequency === 'quarterly' ? 'Kvartalsvis' :
                    'Årlig'
                  }</span>
                  <span>Næste: {formatDate(rp.nextPaymentDate)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
