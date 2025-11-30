import React, { useEffect, useState } from 'react';
import { Search, Filter, Download, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import api from '../services/api';
import { Transaction } from '../types';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { getCategoryLabel, getCategoryColor } from '../utils/categories';

const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await api.get('/api/transactions');
        setTransactions(response.data);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter(
    (tx) =>
      tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.counterparty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const response = await api.get('/api/export/csv', {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transaktioner_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Kunne ikke eksportere transaktioner');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Indlæser transaktioner...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transaktioner</h1>
          <p className="text-gray-500">Oversigt over alle dine transaktioner</p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={exporting}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2 disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {exporting ? 'Eksporterer...' : 'Eksporter CSV'}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Søg efter beskrivelse, modtager eller reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </div>

      {/* Transactions list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modtager/Afsender</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Beskrivelse</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dato</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Beløb</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                      tx.type === 'incoming' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {tx.type === 'incoming' ? (
                        <ArrowDownLeft className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{tx.counterparty}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600">{tx.description}</p>
                  </td>
                  <td className="px-6 py-4">
                    {tx.category && (
                      <span
                        className="inline-flex px-2 py-1 text-xs font-medium rounded-full"
                        style={{
                          backgroundColor: getCategoryColor(tx.category) + '20',
                          color: getCategoryColor(tx.category),
                        }}
                      >
                        {getCategoryLabel(tx.category)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-500 font-mono">{tx.reference || '-'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600">{formatDateTime(tx.createdAt)}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className={`font-semibold ${
                      tx.type === 'incoming' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tx.type === 'incoming' ? '+' : ''}{formatCurrency(tx.amount, tx.currency)}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      tx.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : tx.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {tx.status === 'completed' ? 'Gennemført' : tx.status === 'pending' ? 'Afventer' : 'Fejlet'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Ingen transaktioner fundet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
