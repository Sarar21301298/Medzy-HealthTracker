import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Smartphone, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search,
  Filter,
  Calendar,
  Download,
  Eye,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PaymentHistory = () => {
  const { token } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    method: 'all',
    search: '',
    dateFrom: '',
    dateTo: ''
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });

  useEffect(() => {
    fetchPayments();
  }, [filters, pagination.current]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: pagination.current,
        limit: 10,
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.method !== 'all' && { method: filters.method }),
        ...(filters.search && { search: filters.search }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo })
      });

      const response = await fetch(`/api/payments/history?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPayments(data.data.payments);
        setPagination(data.data.pagination);
      } else {
        console.error('Failed to fetch payment history');
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'bkash':
        return <Smartphone className="h-5 w-5 text-pink-600" />;
      case 'card':
        return <CreditCard className="h-5 w-5 text-healthcare-green-600" />;
      case 'cash_on_delivery':
        return <DollarSign className="h-5 w-5 text-green-600" />;
      default:
        return <Smartphone className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatPaymentMethod = (method) => {
    switch (method) {
      case 'bkash':
        return 'bKash';
      case 'card':
        return 'Credit/Debit Card';
      case 'mobile_banking':
        return 'Mobile Banking';
      case 'cash_on_delivery':
        return 'Cash on Delivery';
      default:
        return method;
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      method: 'all',
      search: '',
      dateFrom: '',
      dateTo: ''
    });
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const exportPayments = () => {
    // Implementation for exporting payment history
    console.log('Exporting payment history...');
  };

  const handleRefund = (payment) => {
    if (payment.status !== 'completed') {
      alert('Only completed payments can be refunded');
      return;
    }
    setSelectedPayment(payment);
    setShowRefundModal(true);
  };

  const handleRefundSuccess = () => {
    setShowRefundModal(false);
    setSelectedPayment(null);
    fetchPayments(); // Refresh the list
  };

  const handleRefundError = (message) => {
    alert(`Refund failed: ${message}`);
  };

  if (loading && payments.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-healthcare-green-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Payment History</h2>
              <p className="text-sm text-gray-600">View all your payment transactions</p>
            </div>
            <button
              onClick={exportPayments}
              className="flex items-center px-4 py-2 bg-healthcare-green-600 text-white rounded-lg hover:bg-healthcare-green-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Order ID, Transaction ID..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Method Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Method
              </label>
              <select
                value={filters.method}
                onChange={(e) => handleFilterChange('method', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500"
              >
                <option value="all">All Methods</option>
                <option value="bkash">bKash</option>
                <option value="card">Credit/Debit Card</option>
                <option value="mobile_banking">Other Mobile Banking</option>
                <option value="cash_on_delivery">Cash on Delivery</option>
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <button
              onClick={clearFilters}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Clear Filters
            </button>
            <p className="text-sm text-gray-600">
              {pagination.total} payments found
            </p>
          </div>
        </div>

        {/* Payment List */}
        <div className="px-6 py-4">
          {payments.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No payments found</h3>
              <p className="text-gray-600">
                {Object.values(filters).some(f => f && f !== 'all') 
                  ? 'Try adjusting your filters' 
                  : 'You haven\'t made any payments yet'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div
                  key={payment._id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {getPaymentMethodIcon(payment.paymentMethod)}
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-gray-900">
                            {formatPaymentMethod(payment.paymentMethod)}
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Order: #{payment.orderId?.trackingId || payment.orderId?._id?.slice(-8) || 'N/A'}</p>
                          {payment.paymentDetails?.bkashTransactionID && (
                            <p>Transaction: {payment.paymentDetails.bkashTransactionID}</p>
                          )}
                          <p>{new Date(payment.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</p>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        ৳{payment.amount?.toLocaleString()}
                      </div>
                      <div className="flex items-center mt-1">
                        {getStatusIcon(payment.status)}
                        <span className="ml-1 text-sm text-gray-600">
                          {payment.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Additional Details for bKash */}
                  {payment.paymentMethod === 'bkash' && payment.paymentDetails && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {payment.paymentDetails.bkashPaymentID && (
                          <div>
                            <span className="text-gray-600">Payment ID:</span>
                            <p className="font-mono text-xs">{payment.paymentDetails.bkashPaymentID}</p>
                          </div>
                        )}
                        {payment.paymentDetails.customerMsisdn && (
                          <div>
                            <span className="text-gray-600">Mobile:</span>
                            <p>{payment.paymentDetails.customerMsisdn}</p>
                          </div>
                        )}
                        {payment.paymentDetails.paymentExecuteTime && (
                          <div>
                            <span className="text-gray-600">Executed:</span>
                            <p>{new Date(payment.paymentDetails.paymentExecuteTime).toLocaleString()}</p>
                          </div>
                        )}
                        <div className="flex justify-end">
                          <div className="flex space-x-2">
                            <button className="text-healthcare-green-600 hover:text-healthcare-green-800 text-sm font-medium">
                              <Eye className="h-4 w-4 inline mr-1" />
                              View Details
                            </button>
                            {payment.status === 'completed' && payment.paymentMethod === 'bkash' && (
                              <button 
                                onClick={() => handleRefund(payment)}
                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                              >
                                Refund
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-6 flex justify-center">
              <div className="flex space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
                  disabled={pagination.current === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const page = i + Math.max(1, pagination.current - 2);
                  return (
                    <button
                      key={page}
                      onClick={() => setPagination(prev => ({ ...prev, current: page }))}
                      className={`px-3 py-2 border rounded-lg ${
                        page === pagination.current
                          ? 'bg-healthcare-green-600 text-white border-healthcare-green-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
                  disabled={pagination.current === pagination.pages}
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Refund functionality temporarily disabled */}
      {showRefundModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4">Refund Request</h3>
              <p className="text-gray-600 mb-4">
                Refund functionality is currently being updated. Please contact support for refund requests.
              </p>
              <button
                onClick={() => {
                  setShowRefundModal(false);
                  setSelectedPayment(null);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;

