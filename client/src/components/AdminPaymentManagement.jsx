import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  Filter, 
  Search,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  AlertTriangle,
  MessageCircle,
  FileText,
  Award
} from 'lucide-react';
import BkashRefund from './BkashRefund';
import CustomerPointsPopup from './CustomerPointsPopup';

const AdminPaymentManagement = () => {
  const { getAuthHeaders } = useAuth();
  const { success, error } = useNotification();
  
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPointsPopup, setShowPointsPopup] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  
  const [filters, setFilters] = useState({
    status: '',
    vendorId: '',
    paymentMethod: '',
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, [filters, pagination.page]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });
      
      // Remove empty filters
      Object.keys(filters).forEach(key => {
        if (!filters[key]) queryParams.delete(key);
      });

      const response = await fetch(`/api/payments?${queryParams}`, {
        headers: getAuthHeaders()
      });

      const data = await response.json();
      
      if (response.ok) {
        setPayments(data.payments);
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages
        }));
      } else {
        error('Failed to fetch payments');
      }
    } catch (err) {
      error('Network error while fetching payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);

      console.log('🔍 Fetching payment stats from:', `/api/payments/stats?${queryParams}`);
      
      const response = await fetch(`/api/payments/stats?${queryParams}`, {
        headers: getAuthHeaders()
      });

      const data = await response.json();
      
      console.log('📊 Payment stats response:', data);
      
      if (response.ok) {
        console.log('✅ Stats updated successfully:', {
          totalAmount: data.totalAmount,
          totalMedzyRevenue: data.totalMedzyRevenue,
          totalPayments: data.totalPayments,
          totalRefunds: data.totalRefunds,
          totalPointsAwarded: data.totalPointsAwarded
        });
        setStats(data);
      } else {
        console.error('❌ Failed to fetch stats:', response.status, data);
        error('Failed to fetch payment statistics');
      }
    } catch (err) {
      console.error('🚨 Error fetching stats:', err);
      error('Error fetching payment statistics: ' + err.message);
    }
  };

  const updatePaymentStatus = async (paymentId, newStatus) => {
    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        success(`Payment ${newStatus} successfully`);
        fetchPayments();
        fetchStats();
      } else {
        error('Failed to update payment status');
      }
    } catch (err) {
      error('Network error while updating payment');
    }
  };

  const openPaymentModal = async (payment) => {
    try {
      // Fetch detailed payment information including refund eligibility
      const response = await fetch(`/api/payments/${payment._id}/refund-details`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedPayment(data.payment);
        setShowPaymentModal(true);
      } else {
        error('Failed to fetch payment details');
      }
    } catch (err) {
      error('Network error while fetching payment details');
    }
  };

  const processRefund = (payment) => {
    setSelectedPayment(payment);
    setShowRefundModal(true);
  };

  const handleRefundSuccess = (data) => {
    success(`Refund processed successfully! Amount: ৳${data.amount}`);
    setShowRefundModal(false);
    setSelectedPayment(null);
    fetchPayments();
    fetchStats();
  };

  const handleRefundError = (message) => {
    error(message);
  };

  const handleManualRefund = async (paymentId, refundData) => {
    try {
      const response = await fetch(`/api/payments/${paymentId}/manual-refund`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(refundData)
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        success('Manual refund processed successfully');
        setShowRefundModal(false);
        setSelectedPayment(null);
        fetchPayments();
        fetchStats();
      } else {
        error(result.message || 'Failed to process manual refund');
      }
    } catch (err) {
      error('Network error while processing manual refund');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'refunded': return 'text-healthcare-green-600 bg-healthcare-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPaymentMethodColor = (method) => {
    switch (method) {
      case 'sslcommerz': return 'text-healthcare-green-600 bg-healthcare-green-100';
      case 'cash_on_delivery': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT'
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Payment Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Track and manage all payments</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPointsPopup(true)}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            <Award className="h-4 w-4" />
            Customer Points
          </button>
          <button
            onClick={() => {
              console.log('🔄 Manual stats refresh triggered');
              fetchStats();
              success('Stats refreshed successfully!');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Stats
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-healthcare-green-600 text-white rounded-lg hover:bg-healthcare-green-700"
          >
            <Download className="h-4 w-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                {formatCurrency(stats.totalAmount || 0)}
              </p>
              {stats.totalRefundAmount > 0 && (
                <p className="text-xs text-red-600">-{formatCurrency(stats.totalRefundAmount)} refunded</p>
              )}
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Medzy Revenue</p>
              <p className="text-2xl font-bold text-healthcare-green-600">
                {formatCurrency(stats.totalMedzyRevenue || 0)}
              </p>
              {stats.originalMedzyRevenue && stats.originalMedzyRevenue !== stats.totalMedzyRevenue && (
                <p className="text-xs text-gray-500">Originally: {formatCurrency(stats.originalMedzyRevenue)}</p>
              )}
              {stats.totalPointsAwarded > 0 && (
                <p className="text-xs text-green-600">{stats.totalPointsAwarded} points awarded</p>
              )}
            </div>
            <TrendingUp className="h-8 w-8 text-healthcare-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Payments</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                {stats.totalPayments || 0}
              </p>
            </div>
            <CreditCard className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Success Rate</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.successRate ? `${stats.successRate}%` : '0%'}
              </p>
              <p className="text-xs text-gray-500">
                {stats.completedPayments || 0} of {stats.totalPayments || 0} completed
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div className="flex items-center gap-4 mb-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>

          <select
            value={filters.paymentMethod}
            onChange={(e) => setFilters(prev => ({ ...prev, paymentMethod: e.target.value }))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          >
            <option value="">All Methods</option>
            <option value="sslcommerz">SSLCommerz</option>
            <option value="cash_on_delivery">Cash on Delivery</option>
          </select>

          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            placeholder="Start Date"
          />

          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            placeholder="End Date"
          />

          <button
            onClick={() => setFilters({ status: '', vendorId: '', paymentMethod: '', startDate: '', endDate: '' })}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Payment Transactions</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Transaction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <RefreshCw className="h-6 w-6 animate-spin text-healthcare-green-600 mr-2" />
                      Loading payments...
                    </div>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No payments found
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {payment.transactionId}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Order: {payment.orderId?.orderNumber || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {payment.userId?.firstName} {payment.userId?.lastName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {payment.userId?.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {payment.vendorId?.businessName || 
                           `${payment.vendorId?.firstName} ${payment.vendorId?.lastName}`}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {payment.vendorId?.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {formatCurrency(payment.amount)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Vendor: {formatCurrency(payment.vendorEarnings)} | 
                          Medzy: {formatCurrency(payment.medzyRevenue)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentMethodColor(payment.paymentMethod)}`}>
                        {payment.paymentMethod.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        {payment.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updatePaymentStatus(payment._id, 'completed')}
                              className="text-green-600 hover:text-green-900"
                              title="Mark as Completed"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => updatePaymentStatus(payment._id, 'failed')}
                              className="text-red-600 hover:text-red-900"
                              title="Mark as Failed"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {payment.status === 'completed' && (
                          <>
                            <button
                              onClick={() => openPaymentModal(payment)}
                              className="text-healthcare-green-600 hover:text-healthcare-green-900"
                              title="View Payment Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => processRefund(payment)}
                              className="text-green-600 hover:text-green-900"
                              title="Process Refund"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {(payment.status === 'failed' || payment.status === 'cancelled') && (
                          <button
                            onClick={() => openPaymentModal(payment)}
                            className="text-healthcare-green-600 hover:text-healthcare-green-900"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Details Modal */}
      {showPaymentModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                Payment Details
              </h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Payment Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Transaction ID</label>
                  <p className="text-sm text-gray-800 dark:text-gray-200">{selectedPayment.transactionId}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
                  <p className="text-sm text-gray-800 dark:text-gray-200">{formatCurrency(selectedPayment.amount)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Method</label>
                  <p className="text-sm text-gray-800 dark:text-gray-200">{selectedPayment.paymentMethod?.toUpperCase()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedPayment.status)}`}>
                    {selectedPayment.status?.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Customer Info */}
              {selectedPayment.customer && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">Customer Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                      <p className="text-sm text-gray-800 dark:text-gray-200">
                        {selectedPayment.customer.firstName} {selectedPayment.customer.lastName}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                      <p className="text-sm text-gray-800 dark:text-gray-200">
                        {selectedPayment.customer.email}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Info */}
              {selectedPayment.order && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">Order Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Order Number</label>
                      <p className="text-sm text-gray-800 dark:text-gray-200">{selectedPayment.order.orderNumber}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Total Amount</label>
                      <p className="text-sm text-gray-800 dark:text-gray-200">
                        {formatCurrency(selectedPayment.order.totalAmount)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Details */}
              {selectedPayment.paymentDetails && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">Payment Details</h3>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {JSON.stringify(selectedPayment.paymentDetails, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Refund Details */}
              {selectedPayment.refundDetails && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">Refund Information</h3>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-green-700 dark:text-green-300">Refund Amount</label>
                        <p className="text-sm text-green-800 dark:text-green-200">
                          {formatCurrency(selectedPayment.refundDetails.refundAmount)}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-green-700 dark:text-green-300">Refund Date</label>
                        <p className="text-sm text-green-800 dark:text-green-200">
                          {new Date(selectedPayment.refundDetails.refundDate).toLocaleString()}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-green-700 dark:text-green-300">Reason</label>
                        <p className="text-sm text-green-800 dark:text-green-200">
                          {selectedPayment.refundDetails.refundReason}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Refund Eligibility */}
              <div className="border-t pt-4">
                <div className={`p-4 rounded-lg ${selectedPayment.isRefundable ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-700'}`}>
                  <div className="flex items-center gap-2">
                    {selectedPayment.isRefundable ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className={`font-medium ${selectedPayment.isRefundable ? 'text-green-800 dark:text-green-200' : 'text-gray-800 dark:text-gray-200'}`}>
                      {selectedPayment.isRefundable ? 'Eligible for Refund' : 'Not Eligible for Refund'}
                    </span>
                  </div>
                  {!selectedPayment.isRefundable && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Payment must be completed and use a supported payment method (bKash) for automatic refunds.
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Close
                </button>
                
                {selectedPayment.status === 'completed' && !selectedPayment.refundDetails && (
                  <button
                    onClick={() => {
                      setShowPaymentModal(false);
                      setShowRefundModal(true);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Process Refund
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          {selectedPayment.paymentMethod === 'bkash' && selectedPayment.paymentDetails?.bkashPaymentID ? (
            <BkashRefund
              payment={selectedPayment}
              onSuccess={handleRefundSuccess}
              onError={handleRefundError}
              onCancel={() => setShowRefundModal(false)}
            />
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-200">
                  Manual Refund Required
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  This payment cannot be automatically refunded
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Payment Method:</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {selectedPayment.paymentMethod?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {formatCurrency(selectedPayment.amount)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg mb-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                  <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Manual Processing Required
                  </span>
                </div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Please process this refund manually through the original payment method and mark as refunded.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => handleManualRefund(selectedPayment._id, {
                    amount: selectedPayment.amount,
                    reason: 'Manual refund processed by admin',
                    refundMethod: 'manual'
                  })}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg"
                >
                  Mark as Refunded
                </button>

                <button
                  onClick={() => setShowRefundModal(false)}
                  className="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Customer Points Popup */}
      <CustomerPointsPopup
        isOpen={showPointsPopup}
        onClose={() => setShowPointsPopup(false)}
        customerId={selectedCustomerId}
      />
    </div>
  );
};

export default AdminPaymentManagement;

