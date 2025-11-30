import React, { useEffect, useState } from 'react';
import { Plus, Send } from 'lucide-react';
import api from '../services/api';
import { Payment, Account } from '../types';
import { formatCurrency, formatDateTime } from '../utils/formatters';

const Payments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    accountId: '',
    recipientName: '',
    recipientAccount: '',
    amount: '',
    description: '',
    reference: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [paymentsRes, accountsRes] = await Promise.all([
        api.get('/api/payments'),
        api.get('/api/accounts'),
      ]);
      setPayments(paymentsRes.data);
      setAccounts(accountsRes.data);
      if (accountsRes.data.length > 0) {
        setFormData((prev) => ({ ...prev, accountId: accountsRes.data[0].id }));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/payments', {
        ...formData,
        amount: parseFloat(formData.amount),
      });
      setShowForm(false);
      setFormData({
        accountId: accounts[0]?.id || '',
        recipientName: '',
        recipientAccount: '',
        amount: '',
        description: '',
        reference: '',
      });
      fetchData();
    } catch (error) {
      console.error('Error creating payment:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Indlæser betalinger...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Betalinger</h1>
          <p className="text-gray-500">Send penge og administrer betalinger</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Ny Betaling
        </button>
      </div>

      {/* Payment form */}
      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Opret Ny Betaling</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fra Konto
                </label>
                <select
                  value={formData.accountId}
                  onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountNumber} ({formatCurrency(acc.balance, acc.currency)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beløb (DKK)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modtagers Navn
              </label>
              <input
                type="text"
                value={formData.recipientName}
                onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modtagers Kontonummer
              </label>
              <input
                type="text"
                value={formData.recipientAccount}
                onChange={(e) => setFormData({ ...formData, recipientAccount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="DK50 0040 0440 1162 43"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Beskrivelse
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reference (valgfri)
              </label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
              >
                Send Betaling
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuller
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Payments list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modtager</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kontonummer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Beskrivelse</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dato</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Beløb</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {payments.map((payment) => (
              <tr key={payment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900">{payment.recipientName}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-600 font-mono">{payment.recipientAccount}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-600">{payment.description}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-600">{formatDateTime(payment.createdAt)}</p>
                </td>
                <td className="px-6 py-4 text-right">
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(payment.amount, payment.currency)}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    payment.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : payment.status === 'processing'
                      ? 'bg-blue-100 text-blue-700'
                      : payment.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {payment.status === 'completed' ? 'Gennemført' :
                     payment.status === 'processing' ? 'Behandles' :
                     payment.status === 'pending' ? 'Afventer' : 'Fejlet'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {payments.length === 0 && (
          <div className="text-center py-12">
            <Send className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Ingen betalinger endnu</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payments;
