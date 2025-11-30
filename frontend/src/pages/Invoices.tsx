import React, { useEffect, useState } from 'react';
import { Plus, FileText, Eye, Mail, Check } from 'lucide-react';
import api from '../services/api';
import { Invoice } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await api.get('/api/invoices');
      setInvoices(response.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateInvoiceStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/api/invoices/${id}`, { status });
      fetchInvoices();
    } catch (error) {
      console.error('Error updating invoice:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'sent':
        return 'bg-blue-100 text-blue-700';
      case 'overdue':
        return 'bg-red-100 text-red-700';
      case 'draft':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Betalt';
      case 'sent':
        return 'Sendt';
      case 'overdue':
        return 'Forfalden';
      case 'draft':
        return 'Kladde';
      default:
        return status;
    }
  };

  if (loading) {
    return <div className="text-center py-12">Indlæser fakturaer...</div>;
  }

  const stats = {
    total: invoices.reduce((sum, inv) => sum + inv.total, 0),
    paid: invoices.filter((inv) => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0),
    overdue: invoices.filter((inv) => inv.status === 'overdue').reduce((sum, inv) => sum + inv.total, 0),
    pending: invoices.filter((inv) => inv.status === 'sent').reduce((sum, inv) => sum + inv.total, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fakturaer</h1>
          <p className="text-gray-500">Administrer dine fakturaer</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Ny Faktura
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Total Faktureret</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.total)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Betalt</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(stats.paid)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Afventer</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(stats.pending)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Forfalden</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(stats.overdue)}</p>
        </div>
      </div>

      {/* Invoices list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Faktura #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kunde</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Oprettet</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Forfald</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Beløb</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Handlinger</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="font-mono font-medium text-gray-900">{invoice.invoiceNumber}</p>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900">{invoice.customerName}</p>
                    <p className="text-sm text-gray-500">{invoice.customerEmail}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-600">{formatDate(invoice.createdAt)}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-600">{formatDate(invoice.dueDate)}</p>
                </td>
                <td className="px-6 py-4 text-right">
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(invoice.total, invoice.currency)}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                    {getStatusText(invoice.status)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <Eye className="w-4 h-4" />
                    </button>
                    {invoice.status === 'draft' && (
                      <button
                        onClick={() => updateInvoiceStatus(invoice.id, 'sent')}
                        className="p-1 text-blue-400 hover:text-blue-600"
                        title="Send faktura"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                    )}
                    {invoice.status === 'sent' && (
                      <button
                        onClick={() => updateInvoiceStatus(invoice.id, 'paid')}
                        className="p-1 text-green-400 hover:text-green-600"
                        title="Marker som betalt"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {invoices.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Ingen fakturaer endnu</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Invoices;
