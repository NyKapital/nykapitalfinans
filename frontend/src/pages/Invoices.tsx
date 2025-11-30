import React, { useEffect, useState } from 'react';
import { Plus, FileText, Eye, Mail, Check, Download, X, CheckCircle, DollarSign, ChevronDown, ChevronRight } from 'lucide-react';
import api from '../services/api';
import { Invoice, InvoiceItem } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useToast } from '../context/ToastContext';

const Invoices: React.FC = () => {
  const toast = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerCVR: '',
    dueDate: '',
  });
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unitPrice: 0, total: 0 },
  ]);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    method: 'Bank Transfer',
    reference: '',
  });

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

  const downloadPDF = async (invoice: Invoice) => {
    try {
      const response = await api.get(`/api/invoices/${invoice.id}/pdf`, {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `faktura_${invoice.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Kunne ikke downloade PDF');
    }
  };

  const openPaymentModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    const remainingAmount = invoice.total - invoice.amountPaid;
    setPaymentData({
      amount: remainingAmount.toFixed(2),
      method: 'Bank Transfer',
      reference: '',
    });
    setShowPaymentModal(true);
  };

  const recordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    try {
      await api.post(`/api/invoices/${selectedInvoice.id}/payments`, {
        amount: parseFloat(paymentData.amount),
        method: paymentData.method,
        reference: paymentData.reference,
      });

      toast.success('Betaling registreret');
      setShowPaymentModal(false);
      setPaymentData({ amount: '', method: 'Bank Transfer', reference: '' });
      setSelectedInvoice(null);
      fetchInvoices();
    } catch (error: any) {
      console.error('Error recording payment:', error);
      const errorMessage = error.response?.data?.error || 'Kunne ikke registrere betaling';
      toast.error(errorMessage);
    }
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Recalculate total for this item
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
    }

    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.25; // 25% Danish VAT
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { subtotal, tax, total } = calculateTotals();

      // Calculate due date (30 days from now if not specified)
      const dueDate = formData.dueDate ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      await api.post('/api/invoices', {
        ...formData,
        items,
        dueDate,
      });

      setShowForm(false);
      setFormData({ customerName: '', customerEmail: '', customerCVR: '', dueDate: '' });
      setItems([{ description: '', quantity: 1, unitPrice: 0, total: 0 }]);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      fetchInvoices();
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Fejl ved oprettelse af faktura');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'partially_paid':
        return 'bg-yellow-100 text-yellow-700';
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
      case 'partially_paid':
        return 'Delvist Betalt';
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

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Success notification */}
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span>Faktura oprettet!</span>
        </div>
      )}

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

      {/* Invoice creation form */}
      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Opret Ny Faktura</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kunde Navn *
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kunde Email *
                </label>
                <input
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CVR (valgfri)
                </label>
                <input
                  type="text"
                  value={formData.customerCVR}
                  onChange={(e) => setFormData({ ...formData, customerCVR: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="12345678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Forfaldsdato
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Line items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">Linjeelementer *</label>
                <button
                  type="button"
                  onClick={addItem}
                  className="text-primary-600 text-sm hover:text-primary-700"
                >
                  + Tilføj element
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Beskrivelse"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        required
                      />
                    </div>
                    <div className="w-24">
                      <input
                        type="number"
                        placeholder="Antal"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        min="1"
                        required
                      />
                    </div>
                    <div className="w-32">
                      <input
                        type="number"
                        placeholder="Enhedspris"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="w-32">
                      <input
                        type="text"
                        value={formatCurrency(item.total)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        disabled
                      />
                    </div>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-2 text-red-400 hover:text-red-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="border-t pt-4">
              <div className="max-w-sm ml-auto space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Moms (25%):</span>
                  <span className="font-medium">{formatCurrency(totals.tax)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(totals.total)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
              >
                Opret Faktura
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
            {invoices.map((invoice) => {
              const remainingAmount = invoice.total - invoice.amountPaid;
              const isExpanded = expandedInvoice === invoice.id;
              return (
                <React.Fragment key={invoice.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {invoice.payments && invoice.payments.length > 0 && (
                          <button
                            onClick={() => setExpandedInvoice(isExpanded ? null : invoice.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        )}
                        <p className="font-mono font-medium text-gray-900">{invoice.invoiceNumber}</p>
                      </div>
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
                      <div>
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(invoice.total, invoice.currency)}
                        </p>
                        {invoice.status === 'partially_paid' && (
                          <p className="text-xs text-gray-500">
                            Betalt: {formatCurrency(invoice.amountPaid, invoice.currency)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                        {getStatusText(invoice.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => downloadPDF(invoice)}
                          className="p-1 text-primary-400 hover:text-primary-600"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
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
                        {(invoice.status === 'sent' || invoice.status === 'overdue' || invoice.status === 'partially_paid') && (
                          <button
                            onClick={() => openPaymentModal(invoice)}
                            className="p-1 text-green-400 hover:text-green-600"
                            title="Registrer betaling"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Payment history row */}
                  {isExpanded && invoice.payments && invoice.payments.length > 0 && (
                    <tr className="bg-gray-50">
                      <td colSpan={7} className="px-6 py-4">
                        <div className="ml-8">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Betalingshistorik</h4>
                          <div className="space-y-2">
                            {invoice.payments.map((payment) => (
                              <div key={payment.id} className="flex items-center justify-between text-sm bg-white px-4 py-2 rounded border border-gray-200">
                                <div className="flex items-center gap-4">
                                  <span className="text-gray-600">{formatDate(payment.date)}</span>
                                  <span className="font-medium text-green-600">
                                    {formatCurrency(payment.amount, invoice.currency)}
                                  </span>
                                  {payment.method && (
                                    <span className="text-gray-500">via {payment.method}</span>
                                  )}
                                </div>
                                {payment.reference && (
                                  <span className="font-mono text-xs text-gray-500">{payment.reference}</span>
                                )}
                              </div>
                            ))}
                          </div>
                          {remainingAmount > 0 && (
                            <div className="mt-2 text-sm text-gray-600">
                              Resterende beløb: <span className="font-semibold">{formatCurrency(remainingAmount, invoice.currency)}</span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>

        {invoices.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Ingen fakturaer endnu</p>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Registrer Betaling</h2>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Faktura #{selectedInvoice.invoiceNumber}</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {formatCurrency(selectedInvoice.total, selectedInvoice.currency)}
                </p>
                {selectedInvoice.amountPaid > 0 && (
                  <div className="mt-2 text-sm">
                    <p className="text-gray-600">
                      Betalt: <span className="font-medium">{formatCurrency(selectedInvoice.amountPaid, selectedInvoice.currency)}</span>
                    </p>
                    <p className="text-gray-600">
                      Resterende: <span className="font-medium text-red-600">{formatCurrency(selectedInvoice.total - selectedInvoice.amountPaid, selectedInvoice.currency)}</span>
                    </p>
                  </div>
                )}
              </div>

              <form onSubmit={recordPayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beløb *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                    max={selectedInvoice.total - selectedInvoice.amountPaid}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Betalingsmetode
                  </label>
                  <select
                    value={paymentData.method}
                    onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="MobilePay">MobilePay</option>
                    <option value="Credit Card">Kreditkort</option>
                    <option value="Cash">Kontant</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reference (valgfri)
                  </label>
                  <input
                    type="text"
                    value={paymentData.reference}
                    onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Transaktions ID eller note"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                  >
                    Registrer Betaling
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
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

export default Invoices;
