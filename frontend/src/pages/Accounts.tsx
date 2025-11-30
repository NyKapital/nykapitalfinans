import React, { useEffect, useState } from 'react';
import { CreditCard, Eye, Download } from 'lucide-react';
import api from '../services/api';
import { Account } from '../types';
import { formatCurrency } from '../utils/formatters';

const Accounts: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await api.get('/api/accounts');
        setAccounts(response.data);
      } catch (error) {
        console.error('Error fetching accounts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  if (loading) {
    return <div className="text-center py-12">Indlæser konti...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Konti</h1>
          <p className="text-gray-500">Administrer dine erhvervskonti</p>
        </div>
        <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
          Opret Konto
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="bg-gradient-to-br from-primary-500 to-primary-700 text-white p-6 rounded-2xl shadow-lg"
          >
            <div className="flex items-start justify-between mb-8">
              <div>
                <p className="text-primary-100 text-sm mb-1">
                  {account.type === 'business' ? 'Erhvervskonto' : 'Opsparingskonto'}
                </p>
                <p className="text-2xl font-bold">{formatCurrency(account.balance, account.currency)}</p>
              </div>
              <CreditCard className="w-8 h-8 text-primary-100" />
            </div>

            <div className="space-y-2">
              <div>
                <p className="text-primary-100 text-xs">Kontonummer</p>
                <p className="font-mono text-lg">{account.accountNumber}</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-100 text-xs">Status</p>
                  <p className="text-sm capitalize">{account.status === 'active' ? 'Aktiv' : account.status}</p>
                </div>
                <div>
                  <p className="text-primary-100 text-xs">Valuta</p>
                  <p className="text-sm">{account.currency}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button className="flex-1 bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all">
                <Eye className="w-4 h-4 inline mr-1" />
                Detaljer
              </button>
              <button className="flex-1 bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all">
                <Download className="w-4 h-4 inline mr-1" />
                Eksport
              </button>
            </div>
          </div>
        ))}
      </div>

      {accounts.length === 0 && (
        <div className="text-center py-12">
          <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Ingen konti endnu</p>
        </div>
      )}
    </div>
  );
};

export default Accounts;
