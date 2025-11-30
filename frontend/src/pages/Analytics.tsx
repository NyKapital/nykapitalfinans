import React, { useEffect, useState, useCallback } from 'react';
import { TrendingUp, TrendingDown, DollarSign, FileText } from 'lucide-react';
import api from '../services/api';
import { Analytics as AnalyticsType } from '../types';
import { formatCurrency } from '../utils/formatters';
import { getCategoryLabel, getCategoryColor } from '../utils/categories';
import DateRangeFilter from '../components/DateRangeFilter';
import { DateRange } from '../utils/dateUtils';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const Analytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (dateRange?.startDate) params.startDate = dateRange.startDate;
      if (dateRange?.endDate) params.endDate = dateRange.endDate;

      const response = await api.get('/api/analytics', { params });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return <div className="text-center py-12">Indlæser statistik...</div>;
  }

  if (!analytics) {
    return <div className="text-center py-12">Ingen data tilgængelig</div>;
  }

  const invoiceData = [
    { name: 'Betalt', value: analytics.totalPaid, color: '#1b4030' },
    { name: 'Afventer', value: analytics.totalInvoiced - analytics.totalPaid - analytics.totalOverdue, color: '#657a8c' },
    { name: 'Forfalden', value: analytics.totalOverdue, color: '#c5a065' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Statistik & Indsigt</h1>
        <p className="text-gray-500">Oversigt over din forretnings præstation</p>
      </div>

      {/* Date Range Filter */}
      <DateRangeFilter onRangeChange={setDateRange} />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Balance</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(analytics.totalBalance)}
              </p>
            </div>
            <div className="bg-primary-100 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Månedlig Indkomst</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(analytics.monthlyIncome)}
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
              <p className="text-sm text-gray-600">Månedlige Udgifter</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {formatCurrency(analytics.monthlyExpenses)}
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
              <p className="text-sm text-gray-600">Total Faktureret</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(analytics.totalInvoiced)}
              </p>
            </div>
            <div className="bg-primary-100 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Income/Expenses */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Månedlig Oversigt (6 måneder)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Bar dataKey="income" name="Indkomst" fill="#c5a065" />
              <Bar dataKey="expenses" name="Udgifter" fill="#051c2c" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Invoice Status Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Faktura Fordeling</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={invoiceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {invoiceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        {analytics.categoryData && analytics.categoryData.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Udgifter per Kategori</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.categoryData.map((item) => ({
                    name: getCategoryLabel(item.category as any),
                    value: item.amount,
                    color: getCategoryColor(item.category as any),
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getCategoryColor(entry.category as any)} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Cash Flow Trend */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pengestrøm Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Line
                type="monotone"
                dataKey="income"
                name="Indkomst"
                stroke="#c5a065"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                name="Udgifter"
                stroke="#051c2c"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-green-700 text-white p-6 rounded-xl">
          <p className="text-green-50 text-sm mb-2">Nettoindkomst (måned)</p>
          <p className="text-3xl font-bold">
            {formatCurrency(analytics.monthlyIncome - analytics.monthlyExpenses)}
          </p>
          <p className="text-green-100 text-sm mt-2">
            {((analytics.monthlyIncome - analytics.monthlyExpenses) / analytics.monthlyIncome * 100).toFixed(1)}% margin
          </p>
        </div>

        <div className="bg-gradient-to-br from-primary-500 to-primary-700 text-white p-6 rounded-xl">
          <p className="text-primary-50 text-sm mb-2">Antal Konti</p>
          <p className="text-3xl font-bold">{analytics.accountCount}</p>
          <p className="text-primary-100 text-sm mt-2">Aktive konti</p>
        </div>

        <div className="bg-gradient-to-br from-gold-500 to-gold-700 text-white p-6 rounded-xl">
          <p className="text-gold-50 text-sm mb-2">Forfaldne Fakturaer</p>
          <p className="text-3xl font-bold">{analytics.overdueInvoiceCount}</p>
          <p className="text-gold-100 text-sm mt-2">
            {formatCurrency(analytics.totalOverdue)} i alt
          </p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
