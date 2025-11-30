import React, { useEffect, useState, useCallback } from 'react';
import { Search, Filter, Download, ArrowUpRight, ArrowDownLeft, X } from 'lucide-react';
import api from '../services/api';
import { Transaction, TransactionCategory } from '../types';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { getCategoryLabel, getCategoryColor, categoryLabels } from '../utils/categories';
import DateRangeFilter from '../components/DateRangeFilter';
import { DateRange } from '../utils/dateUtils';
import { useToast } from '../context/ToastContext';

const Transactions: React.FC = () => {
  const toast = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [exporting, setExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<TransactionCategory | ''>('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};

      if (searchTerm) params.search = searchTerm;
      if (dateRange?.startDate) params.startDate = dateRange.startDate;
      if (dateRange?.endDate) params.endDate = dateRange.endDate;
      if (selectedCategory) params.category = selectedCategory;
      if (minAmount) params.minAmount = minAmount;
      if (maxAmount) params.maxAmount = maxAmount;

      const response = await api.get('/api/transactions', { params });
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, dateRange, selectedCategory, minAmount, maxAmount]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchTransactions();
    }, 300);

    return () => clearTimeout(debounce);
  }, [fetchTransactions]);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const params: any = {};
      if (dateRange?.startDate) params.startDate = dateRange.startDate;
      if (dateRange?.endDate) params.endDate = dateRange.endDate;

      const response = await api.get('/api/export/csv', {
        params,
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transaktioner_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Transaktioner eksporteret som CSV');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Kunne ikke eksportere transaktioner');
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const params: any = {};
      if (dateRange?.startDate) params.startDate = dateRange.startDate;
      if (dateRange?.endDate) params.endDate = dateRange.endDate;

      const response = await api.get('/api/export/xlsx', {
        params,
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transaktioner_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Transaktioner eksporteret som Excel');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('Kunne ikke eksportere transaktioner');
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setMinAmount('');
    setMaxAmount('');
    setDateRange(null);
  };

  const activeFiltersCount = [
    searchTerm,
    selectedCategory,
    minAmount,
    maxAmount,
    dateRange,
  ].filter(Boolean).length;

  if (loading && transactions.length === 0) {
    return <div className="text-center py-12">Indlæser transaktioner...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transaktioner</h1>
          <p className="text-gray-500">Oversigt over alle dine transaktioner</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Eksporterer...' : 'CSV'}
          </button>
          <button
            onClick={handleExportExcel}
            disabled={exporting}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Eksporterer...' : 'Excel'}
          </button>
        </div>
      </div>

      {/* Search and Filter Toggle */}
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
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-lg flex items-center gap-2 ${
              showFilters || activeFiltersCount > 0
                ? 'bg-primary-50 border-primary-600 text-primary-700'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filter
            {activeFiltersCount > 0 && (
              <span className="bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filtrer transaktioner</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Ryd filtre
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Date Range Filter */}
            <div>
              <DateRangeFilter onRangeChange={setDateRange} />
            </div>

            {/* Category and Amount Filters */}
            <div className="space-y-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategori
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as TransactionCategory | '')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Alle kategorier</option>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beløb interval
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Min beløb"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Max beløb"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>{transactions.length} transaktion{transactions.length !== 1 ? 'er' : ''} fundet</span>
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
              {transactions.map((tx) => (
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

        {transactions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {activeFiltersCount > 0
                ? 'Ingen transaktioner matcher dine filtre'
                : 'Ingen transaktioner fundet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
