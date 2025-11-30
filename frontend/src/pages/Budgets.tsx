import React, { useEffect, useState } from 'react';
import { Plus, TrendingUp, AlertCircle, Check, Trash2, Edit, X } from 'lucide-react';
import api from '../services/api';
import { Budget, BudgetPerformance, TransactionCategory } from '../types';
import { formatCurrency } from '../utils/formatters';
import { useToast } from '../context/ToastContext';

const Budgets: React.FC = () => {
  const toast = useToast();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [performance, setPerformance] = useState<BudgetPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [formData, setFormData] = useState({
    category: '' as TransactionCategory | '',
    amount: '',
  });

  const categoryLabels: Record<TransactionCategory, string> = {
    salary: 'Løn',
    office: 'Kontor',
    marketing: 'Marketing',
    travel: 'Rejse',
    software: 'Software',
    equipment: 'Udstyr',
    rent: 'Husleje',
    utilities: 'Forsyning',
    insurance: 'Forsikring',
    tax: 'Skat',
    sales: 'Salg',
    services: 'Tjenester',
    consulting: 'Konsulentydelser',
    other: 'Andet',
  };

  const availableCategories: TransactionCategory[] = [
    'marketing',
    'salary',
    'software',
    'rent',
    'office',
    'travel',
    'equipment',
    'utilities',
    'insurance',
    'consulting',
    'other',
  ];

  useEffect(() => {
    fetchBudgets();
    fetchPerformance();
  }, []);

  const fetchBudgets = async () => {
    try {
      const response = await api.get('/api/budgets');
      setBudgets(response.data);
    } catch (error) {
      console.error('Error fetching budgets:', error);
      toast.error('Kunne ikke hente budgetter');
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformance = async () => {
    try {
      const response = await api.get('/api/budgets/performance');
      setPerformance(response.data.performance);
    } catch (error) {
      console.error('Error fetching performance:', error);
    }
  };

  const openAddModal = () => {
    setEditingBudget(null);
    setFormData({ category: '', amount: '' });
    setShowModal(true);
  };

  const openEditModal = (budget: Budget) => {
    setEditingBudget(budget);
    setFormData({
      category: budget.category,
      amount: budget.amount.toString(),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category || !formData.amount) {
      toast.error('Udfyld alle felter');
      return;
    }

    try {
      if (editingBudget) {
        await api.put(`/api/budgets/${editingBudget.id}`, {
          amount: parseFloat(formData.amount),
        });
        toast.success('Budget opdateret');
      } else {
        await api.post('/api/budgets', {
          category: formData.category,
          amount: parseFloat(formData.amount),
        });
        toast.success('Budget oprettet');
      }

      setShowModal(false);
      fetchBudgets();
      fetchPerformance();
    } catch (error: any) {
      console.error('Error saving budget:', error);
      const errorMessage = error.response?.data?.error || 'Kunne ikke gemme budget';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (budgetId: string) => {
    if (!window.confirm('Er du sikker på, at du vil slette dette budget?')) {
      return;
    }

    try {
      await api.delete(`/api/budgets/${budgetId}`);
      toast.success('Budget slettet');
      fetchBudgets();
      fetchPerformance();
    } catch (error) {
      console.error('Error deleting budget:', error);
      toast.error('Kunne ikke slette budget');
    }
  };

  const getPerformanceForBudget = (budgetId: string): BudgetPerformance | undefined => {
    return performance.find((p) => p.budgetId === budgetId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'danger':
        return 'bg-orange-500';
      case 'over':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-700';
      case 'warning':
        return 'text-yellow-700';
      case 'danger':
        return 'text-orange-700';
      case 'over':
        return 'text-red-700';
      default:
        return 'text-gray-700';
    }
  };

  const usedCategories = budgets.map((b) => b.category);
  const unusedCategories = availableCategories.filter((cat) => !usedCategories.includes(cat));

  if (loading) {
    return <div className="text-center py-12">Indlæser budgetter...</div>;
  }

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = performance.reduce((sum, p) => sum + p.spent, 0);
  const overBudgetCount = performance.filter((p) => p.status === 'over').length;
  const warningCount = performance.filter((p) => p.status === 'warning' || p.status === 'danger').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budgetter</h1>
          <p className="text-gray-500">Administrer dine månedlige budgetter</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nyt Budget
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Total Budget</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalBudget)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Total Forbrug</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(totalSpent)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Resterende</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {formatCurrency(totalBudget - totalSpent)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Advarsler</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">
            {warningCount + overBudgetCount}
          </p>
        </div>
      </div>

      {/* Alerts */}
      {overBudgetCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Over budget!</p>
            <p className="text-sm text-red-700">
              {overBudgetCount} kategori{overBudgetCount > 1 ? 'er' : ''} har overskredet budgettet.
            </p>
          </div>
        </div>
      )}

      {warningCount > 0 && overBudgetCount === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-900">Budget advarsel</p>
            <p className="text-sm text-yellow-700">
              {warningCount} kategori{warningCount > 1 ? 'er' : ''} nærmer sig budgetgrænsen.
            </p>
          </div>
        </div>
      )}

      {/* Budget List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Budgetoversigt</h2>
        </div>

        {budgets.length === 0 ? (
          <div className="text-center py-12">
            <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Ingen budgetter endnu</p>
            <p className="text-sm text-gray-400 mt-1">Opret dit første budget for at komme i gang</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {budgets.map((budget) => {
              const perf = getPerformanceForBudget(budget.id);
              return (
                <div key={budget.id} className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {categoryLabels[budget.category]}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Budget: {formatCurrency(budget.amount)} / måned
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(budget)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                        title="Rediger"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(budget.id)}
                        className="p-2 text-red-400 hover:text-red-600"
                        title="Slet"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {perf && (
                    <>
                      <div className="mb-2">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className={`font-medium ${getStatusTextColor(perf.status)}`}>
                            {formatCurrency(perf.spent)} / {formatCurrency(perf.budgetAmount)}
                          </span>
                          <span className={`font-semibold ${getStatusTextColor(perf.status)}`}>
                            {perf.percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full ${getStatusColor(perf.status)} transition-all duration-300`}
                            style={{ width: `${Math.min(perf.percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        Resterende: {formatCurrency(Math.max(perf.remaining, 0))}
                      </p>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingBudget ? 'Rediger Budget' : 'Nyt Budget'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategori *
                  </label>
                  {editingBudget ? (
                    <input
                      type="text"
                      value={categoryLabels[editingBudget.category]}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  ) : (
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value as TransactionCategory })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    >
                      <option value="">Vælg kategori</option>
                      {unusedCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {categoryLabels[cat]}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Månedligt Budget (DKK) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="5000.00"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                  >
                    {editingBudget ? 'Opdater' : 'Opret'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Annuller
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Budgets;
