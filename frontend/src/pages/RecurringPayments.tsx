import React, { useEffect, useState } from 'react';
import { Plus, RefreshCw, Pause, Play, Trash2, CheckCircle } from 'lucide-react';
import api from '../services/api';
import { RecurringPayment, Account, TransactionCategory } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { categoryLabels, getCategoryLabel } from '../utils/categories';

const RecurringPayments: React.FC = () => {
  const [recurringPayments, setRecurringPayments] = useState<RecurringPayment[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    accountId: '',
    recipientName: '',
    recipientAccount: '',
    amount: '',
    description: '',
    reference: '',
    category: '' as TransactionCategory | '',
    frequency: 'monthly' as 'weekly' | 'monthly' | 'quarterly' | 'yearly',
    startDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [paymentsRes, accountsRes] = await Promise.all([
        api.get('/api/recurring-payments'),
        api.get('/api/accounts'),
      ]);
      setRecurringPayments(paymentsRes.data);
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
      await api.post('/api/recurring-payments', {
        ...formData,
        amount: parseFloat(formData.amount),
        category: formData.category || undefined,
      });
      setShowForm(false);
      setFormData({
        accountId: accounts[0]?.id || '',
        recipientName: '',
        recipientAccount: '',
        amount: '',
        description: '',
        reference: '',
        category: '',
        frequency: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      fetchData();
    } catch (error: any) {
      console.error('Error creating recurring payment:', error);
      alert(error.response?.data?.error || 'Fejl ved oprettelse af tilbagevendende betaling');
    }
  };

  const updateStatus = async (id: string, status: 'active' | 'paused' | 'cancelled') => {
    try {
      await api.patch(`/api/recurring-payments/${id}`, { status });
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const deletePayment = async (id: string) => {
    if (confirm('Er du sikker på at du vil slette denne tilbagevendende betaling?')) {
      try {
        await api.delete(`/api/recurring-payments/${id}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting payment:', error);
      }
    }
  };

  const getFrequencyText = (frequency: string) => {
    switch (frequency) {
      case 'weekly': return 'Ugentlig';
      case 'monthly': return 'Månedlig';
      case 'quarterly': return 'Kvartalsvis';
      case 'yearly': return 'Årlig';
      default: return frequency;
    }
  };

  if (loading) {
    return <div className="text-center py-12">Indlæser tilbagevendende betalinger...</div>;
  }

  const activePayments = recurringPayments.filter(p => p.status === 'active');
  const totalMonthlyAmount = activePayments.reduce((sum, p) => {
    if (p.frequency === 'monthly') return sum + p.amount;
    if (p.frequency === 'quarterly') return sum + (p.amount / 3);
    if (p.frequency === 'yearly') return sum + (p.amount / 12);
    if (p.frequency === 'weekly') return sum + (p.amount * 4);
    return sum;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Success notification */}
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span>Tilbagevendende betaling oprettet!</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tilbagevendende Betalinger</h1>
          <p className="text-gray-500">Administrer automatiske betalinger</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Ny Tilbagevendende
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Aktive Betalinger</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{activePayments.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Estimeret Månedlig</p>
          <p className="text-2xl font-bold text-primary-600 mt-1">{formatCurrency(totalMonthlyAmount)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Total Betalinger</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{recurringPayments.length}</p>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Opret Tilbagevendende Betaling</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fra Konto</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Beløb</label>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Modtagers Navn</label>
                <input
                  type="text"
                  value={formData.recipientName}
                  onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kontonummer</label>
                <input
                  type="text"
                  value={formData.recipientAccount}
                  onChange={(e) => setFormData({ ...formData, recipientAccount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Beskrivelse</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Frekvens</label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="weekly">Ugentlig</option>
                  <option value="monthly">Månedlig</option>
                  <option value="quarterly">Kvartalsvis</option>
                  <option value="yearly">Årlig</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as TransactionCategory })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Vælg kategori...</option>
                  {Object.entries(categoryLabels)
                    .filter(([key]) => !['sales', 'services', 'consulting'].includes(key))
                    .map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Startdato</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
                Opret
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Annuller
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modtager</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Beskrivelse</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frekvens</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Næste Betaling</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Beløb</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Handlinger</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {recurringPayments.map((payment) => (
              <tr key={payment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900">{payment.recipientName}</p>
                  <p className="text-sm text-gray-500">{payment.recipientAccount}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-600">{payment.description}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">
                    {payment.category ? getCategoryLabel(payment.category) : '-'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                    {getFrequencyText(payment.frequency)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-600">{formatDate(payment.nextPaymentDate)}</p>
                </td>
                <td className="px-6 py-4 text-right">
                  <p className="font-semibold text-gray-900">{formatCurrency(payment.amount, payment.currency)}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    payment.status === 'active' ? 'bg-green-100 text-green-700' :
                    payment.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {payment.status === 'active' ? 'Aktiv' : payment.status === 'paused' ? 'Pauseret' : 'Annulleret'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {payment.status === 'active' ? (
                      <button
                        onClick={() => updateStatus(payment.id, 'paused')}
                        className="p-1 text-yellow-400 hover:text-yellow-600"
                        title="Pause"
                      >
                        <Pause className="w-4 h-4" />
                      </button>
                    ) : payment.status === 'paused' ? (
                      <button
                        onClick={() => updateStatus(payment.id, 'active')}
                        className="p-1 text-green-400 hover:text-green-600"
                        title="Genoptag"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    ) : null}
                    <button
                      onClick={() => deletePayment(payment.id)}
                      className="p-1 text-red-400 hover:text-red-600"
                      title="Slet"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {recurringPayments.length === 0 && (
          <div className="text-center py-12">
            <RefreshCw className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Ingen tilbagevendende betalinger endnu</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecurringPayments;
