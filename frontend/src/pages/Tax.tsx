import React, { useEffect, useState } from 'react';
import { FileText, Download, TrendingUp, TrendingDown, AlertCircle, Calendar } from 'lucide-react';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';
import { useToast } from '../context/ToastContext';

interface MomsReport {
  period: {
    quarter: number;
    year: number;
    startMonth: number;
    endMonth: number;
  };
  sales: {
    totalSales: number;
    momsOnSales: number;
    invoiceCount: number;
  };
  purchases: {
    totalPurchases: number;
    momsOnPurchases: number;
    transactionCount: number;
    categoryBreakdown: Array<{
      category: string;
      totalAmount: number;
      estimatedMoms: number;
      count: number;
    }>;
  };
  summary: {
    udgåendeMoms: number;
    indgåendeMoms: number;
    netMomsTilbetaling: number;
  };
}

interface AnnualSummary {
  year: number;
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    totalIncome: number;
    totalVATCollected: number;
    profit: number;
  };
  expensesByCategory: Record<string, number>;
  quarterlyData: Array<{
    quarter: number;
    revenue: number;
    expenses: number;
    income: number;
    profit: number;
  }>;
  invoiceStats: {
    total: number;
    paid: number;
    pending: number;
    overdue: number;
  };
}

const Tax: React.FC = () => {
  const toast = useToast();
  const [selectedQuarter, setSelectedQuarter] = useState(4);
  const [selectedYear, setSelectedYear] = useState(2024);
  const [momsReport, setMomsReport] = useState<MomsReport | null>(null);
  const [annualSummary, setAnnualSummary] = useState<AnnualSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'quarterly' | 'annual'>('quarterly');

  useEffect(() => {
    fetchMomsReport();
    fetchAnnualSummary();
  }, [selectedQuarter, selectedYear]);

  const fetchMomsReport = async () => {
    try {
      const response = await api.get('/api/tax/moms', {
        params: { quarter: selectedQuarter, year: selectedYear },
      });
      setMomsReport(response.data);
    } catch (error) {
      console.error('Error fetching moms report:', error);
      toast.error('Kunne ikke hente momsrapport');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnualSummary = async () => {
    try {
      const response = await api.get('/api/tax/annual-summary', {
        params: { year: selectedYear },
      });
      setAnnualSummary(response.data);
    } catch (error) {
      console.error('Error fetching annual summary:', error);
    }
  };

  const exportMomsReport = () => {
    if (!momsReport) return;

    const content = `
MOMSANGIVELSE - KVARTAL ${momsReport.period.quarter} ${momsReport.period.year}
================================================================================

SALG (Udgående moms):
Total omsætning (ekskl. moms): ${formatCurrency(momsReport.sales.totalSales)}
Moms af salg (25%): ${formatCurrency(momsReport.sales.momsOnSales)}
Antal fakturaer: ${momsReport.sales.invoiceCount}

KØB (Indgående moms):
Total indkøb (inkl. moms): ${formatCurrency(momsReport.purchases.totalPurchases)}
Fradragsberettiget moms: ${formatCurrency(momsReport.purchases.momsOnPurchases)}
Antal transaktioner: ${momsReport.purchases.transactionCount}

MOMSAFREGNING:
Udgående moms (salg): ${formatCurrency(momsReport.summary.udgåendeMoms)}
Indgående moms (køb): ${formatCurrency(momsReport.summary.indgåendeMoms)}
----------------------------------------
Moms til betaling til SKAT: ${formatCurrency(momsReport.summary.netMomsTilbetaling)}

${momsReport.summary.netMomsTilbetaling < 0 ? 'BEMÆRK: Negativt beløb betyder momstilbagebetaling fra SKAT' : ''}

Genereret: ${new Date().toLocaleDateString('da-DK')}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `momsangivelse-Q${momsReport.period.quarter}-${momsReport.period.year}.txt`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success('Momsrapport eksporteret');
  };

  if (loading) {
    return <div className="text-center py-12">Indlæser skattedata...</div>;
  }

  const quarters = [
    { value: 1, label: 'Q1 (Jan-Mar)', months: 'Januar - Marts' },
    { value: 2, label: 'Q2 (Apr-Jun)', months: 'April - Juni' },
    { value: 3, label: 'Q3 (Jul-Sep)', months: 'Juli - September' },
    { value: 4, label: 'Q4 (Okt-Dec)', months: 'Oktober - December' },
  ];

  const years = [2024, 2023, 2022];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Skat & Moms</h1>
          <p className="text-gray-500">Momsangivelse og skattedata til SKAT</p>
        </div>
      </div>

      {/* Period Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">År</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          {activeTab === 'quarterly' && (
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Kvartal</label>
              <select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                {quarters.map((q) => (
                  <option key={q.value} value={q.value}>
                    {q.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('quarterly')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'quarterly'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Kvartalsrapport
          </button>
          <button
            onClick={() => setActiveTab('annual')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'annual'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Årsopgørelse
          </button>
        </nav>
      </div>

      {/* Quarterly Report */}
      {activeTab === 'quarterly' && momsReport && (
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg p-8 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-primary-100 text-sm">Moms til betaling - {quarters.find((q) => q.value === selectedQuarter)?.months} {selectedYear}</p>
                <p className="text-4xl font-bold mt-2">{formatCurrency(momsReport.summary.netMomsTilbetaling)}</p>
              </div>
              <button
                onClick={exportMomsReport}
                className="bg-white text-primary-600 px-4 py-2 rounded-lg hover:bg-primary-50 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Eksporter
              </button>
            </div>
            {momsReport.summary.netMomsTilbetaling < 0 && (
              <div className="bg-primary-400 bg-opacity-30 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 mt-0.5" />
                <p className="text-sm">
                  Negativt beløb betyder momstilbagebetaling fra SKAT. Du får {formatCurrency(Math.abs(momsReport.summary.netMomsTilbetaling))} tilbage.
                </p>
              </div>
            )}
          </div>

          {/* Moms Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Udgående moms (Sales) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Udgående moms</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(momsReport.summary.udgåendeMoms)}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Omsætning (ekskl. moms)</span>
                  <span className="font-medium">{formatCurrency(momsReport.sales.totalSales)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Moms (25%)</span>
                  <span className="font-medium">{formatCurrency(momsReport.sales.momsOnSales)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-gray-600">Antal fakturaer</span>
                  <span className="font-medium">{momsReport.sales.invoiceCount}</span>
                </div>
              </div>
            </div>

            {/* Indgående moms (Purchases) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingDown className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Indgående moms</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(momsReport.summary.indgåendeMoms)}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Indkøb (inkl. moms)</span>
                  <span className="font-medium">{formatCurrency(momsReport.purchases.totalPurchases)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fradrag (estimeret)</span>
                  <span className="font-medium">{formatCurrency(momsReport.purchases.momsOnPurchases)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-gray-600">Antal transaktioner</span>
                  <span className="font-medium">{momsReport.purchases.transactionCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          {momsReport.purchases.categoryBreakdown && momsReport.purchases.categoryBreakdown.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Indkøb per kategori</h3>
              <div className="space-y-3">
                {momsReport.purchases.categoryBreakdown.map((cat) => (
                  <div key={cat.category} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 capitalize">{cat.category}</p>
                      <p className="text-xs text-gray-500">{cat.count} transaktioner</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(cat.totalAmount)}</p>
                      <p className="text-xs text-gray-500">Moms: {formatCurrency(cat.estimatedMoms)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Annual Summary */}
      {activeTab === 'annual' && annualSummary && (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <p className="text-sm text-gray-600">Total Omsætning</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(annualSummary.summary.totalRevenue)}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <p className="text-sm text-gray-600">Total Udgifter</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(annualSummary.summary.totalExpenses)}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <p className="text-sm text-gray-600">Samlet Moms</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(annualSummary.summary.totalVATCollected)}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <p className="text-sm text-gray-600">Resultat</p>
              <p className={`text-2xl font-bold mt-1 ${annualSummary.summary.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(annualSummary.summary.profit)}
              </p>
            </div>
          </div>

          {/* Quarterly Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Kvartalsvis fordeling</h3>
            <div className="space-y-4">
              {annualSummary.quarterlyData.map((q) => (
                <div key={q.quarter} className="border-b border-gray-100 pb-4 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">Q{q.quarter} - {quarters.find((qt) => qt.value === q.quarter)?.months}</h4>
                    <span className={`font-semibold ${q.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(q.profit)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Omsætning</p>
                      <p className="font-medium">{formatCurrency(q.revenue)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Udgifter</p>
                      <p className="font-medium">{formatCurrency(q.expenses)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Indtægter</p>
                      <p className="font-medium">{formatCurrency(q.income)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Invoice Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Fakturastatistik {selectedYear}</h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{annualSummary.invoiceStats.total}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Betalt</p>
                <p className="text-2xl font-bold text-green-600">{annualSummary.invoiceStats.paid}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Afventer</p>
                <p className="text-2xl font-bold text-blue-600">{annualSummary.invoiceStats.pending}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Forfalden</p>
                <p className="text-2xl font-bold text-red-600">{annualSummary.invoiceStats.overdue}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tax;
