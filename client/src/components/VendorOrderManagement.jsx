import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck, 
  Eye,
  Calendar,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  AlertCircle,
  ArrowLeft,
  Edit,
  Save,
  X,
  Filter,
  Search,
  TrendingUp,
  Users,
  DollarSign,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import Modal from './Modal';

const VendorOrderManagement = ({ onBack }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    paymentMethod: 'all',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [orderPayments, setOrderPayments] = useState({});
  const [loadingPayments, setLoadingPayments] = useState(false);
  const { getAuthHeaders } = useAuth();
  const { success, error } = useNotification();

  useEffect(() => {
    fetchOrders();
    
    // Set up real-time refresh every 2 minutes for order updates
    const ordersInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing vendor orders...');
      fetchOrders();
    }, 120000); // 2 minutes

    // Listen for order placement events to auto-refresh
    const handleOrderPlaced = () => {
      console.log('🔄 New order event received, refreshing vendor orders...');
      fetchOrders();
    };

    window.addEventListener('orderPlaced', handleOrderPlaced);

    return () => {
      clearInterval(ordersInterval);
      window.removeEventListener('orderPlaced', handleOrderPlaced);
    };
  }, [currentPage, filters]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        status: filters.status,
        paymentMethod: filters.paymentMethod,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });

      // Add search parameter if provided
      if (filters.search && filters.search.trim()) {
        params.append('search', filters.search.trim());
      }

      console.log('🔍 Fetching vendor orders with params:', Object.fromEntries(params));

      const response = await fetch(`/api/orders/vendor/orders?${params}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📦 Vendor Orders Response:', data);
        console.log('🌐 SSL Commerce Orders in Response:', data.orders.filter(order => order.paymentMethod === 'sslcommerz'));
        setOrders(data.orders);
        setPagination(data.pagination);
        
        // Fetch payment details for SSL orders
        fetchPaymentDetails(data.orders);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch orders');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentDetails = async (ordersList) => {
    try {
      setLoadingPayments(true);
      const sslOrders = ordersList.filter(order => 
        order.paymentMethod === 'sslcommerz' || order.paymentMethod === 'online'
      );
      
      if (sslOrders.length === 0) return;

      console.log(`🔍 Fetching payment details for ${sslOrders.length} SSL orders`);

      const paymentPromises = sslOrders.map(async (order) => {
        try {
          const response = await fetch(`/api/payments/order/${order._id}`, {
            headers: getAuthHeaders()
          });
          
          if (response.ok) {
            const paymentData = await response.json();
            return { orderId: order._id, payment: paymentData };
          }
        } catch (error) {
          console.error(`Failed to fetch payment for order ${order._id}:`, error);
        }
        return null;
      });

      const paymentResults = await Promise.all(paymentPromises);
      const paymentsMap = {};
      
      paymentResults.forEach(result => {
        if (result) {
          paymentsMap[result.orderId] = result.payment;
        }
      });

      setOrderPayments(paymentsMap);
      console.log('💳 Payment details fetched:', paymentsMap);
    } catch (error) {
      console.error('Error fetching payment details:', error);
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleStatusUpdate = async (orderId, status, notes = '') => {
    try {
      const response = await fetch(`/api/orders/vendor/${orderId}/status`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, notes })
      });

      if (response.ok) {
        success('Order status updated successfully');
        setEditingOrderId(null);
        setNewStatus('');
        setStatusNotes('');
        fetchOrders();
      } else {
        const data = await response.json();
        error(data.message || 'Failed to update order status');
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      error('Failed to update order status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-healthcare-green-100 text-healthcare-green-800 border-healthcare-green-200',
      processing: 'bg-purple-100 text-purple-800 border-purple-200',
      shipped: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      delivered: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="w-4 h-4" />,
      confirmed: <CheckCircle className="w-4 h-4" />,
      processing: <Package className="w-4 h-4" />,
      shipped: <Truck className="w-4 h-4" />,
      delivered: <CheckCircle className="w-4 h-4" />,
      cancelled: <XCircle className="w-4 h-4" />
    };
    return icons[status] || <Clock className="w-4 h-4" />;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  // Since we're using server-side filtering, just use orders directly
  const filteredOrders = orders;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-healthcare-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              Back
            </button>
          )}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🛒 Order Management</h1>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchOrders()}
            disabled={loading}
            className="flex items-center space-x-2 bg-healthcare-green-600 dark:bg-healthcare-green-700 text-white px-4 py-2 rounded-lg hover:bg-healthcare-green-700 dark:hover:bg-healthcare-green-600 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Auto-refresh: 2min
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="bg-healthcare-green-100 dark:bg-healthcare-green-900 p-3 rounded-lg">
              <Package className="h-6 w-6 text-healthcare-green-600 dark:text-healthcare-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{pagination.totalItems || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
              <CreditCard className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">SSL Orders</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {orders.filter(o => o.paymentMethod === 'sslcommerz' || o.paymentMethod === 'online').length}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">Online payments</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Pending</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {orders.filter(o => o.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Delivered</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {orders.filter(o => o.status === 'delivered').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ৳{orders.reduce((sum, order) => sum + (order.vendorSubtotal || 0), 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status Filter
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Orders</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Payment Method
            </label>
            <select
              value={filters.paymentMethod}
              onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Methods</option>
              <option value="sslcommerz">SSL Commerce</option>
              <option value="online">Online Payment</option>
              <option value="cash_on_delivery">Cash on Delivery</option>
              <option value="cash">Cash</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="createdAt">Order Date</option>
              <option value="total">Order Value</option>
              <option value="status">Status</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Order
            </label>
            <select
              value={filters.sortOrder}
              onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by customer name, email, phone, or order ID..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
              {filters.search && (
                <button
                  onClick={() => handleFilterChange('search', '')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Filter Buttons */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => handleFilterChange('paymentMethod', 'sslcommerz')}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              filters.paymentMethod === 'sslcommerz'
                ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700'
                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-green-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-green-900/30'
            }`}
          >
            🌐 SSL Commerce Orders
          </button>
          <button
            onClick={() => handleFilterChange('paymentMethod', 'cash_on_delivery')}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              filters.paymentMethod === 'cash_on_delivery'
                ? 'bg-healthcare-green-100 text-healthcare-green-800 border-healthcare-green-300 dark:bg-healthcare-green-900 dark:text-healthcare-green-200 dark:border-healthcare-green-700'
                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-healthcare-green-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-healthcare-green-900/30'
            }`}
          >
            💵 Cash on Delivery
          </button>
          <button
            onClick={() => handleFilterChange('status', 'pending')}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              filters.status === 'pending'
                ? 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700'
                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-yellow-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-yellow-900/30'
            }`}
          >
            ⏳ Pending Orders
          </button>
          <button
            onClick={() => handleFilterChange('status', 'delivered')}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              filters.status === 'delivered'
                ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700'
                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-green-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-green-900/30'
            }`}
          >
            ✅ Delivered Orders
          </button>
          <button
            onClick={() => setFilters({ status: 'all', paymentMethod: 'all', search: '', sortBy: 'createdAt', sortOrder: 'desc' })}
            className="px-3 py-1 text-xs rounded-full border bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            🔄 Clear All Filters
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No orders found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              No orders match your current filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Order Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="flex items-center space-x-2">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            #{order.trackingId}
                          </div>
                          {(order.paymentMethod === 'sslcommerz' || order.paymentMethod === 'online') && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700">
                              <CreditCard className="w-3 h-3 mr-1" />
                              SSL
                            </span>
                          )}
                          {order.paymentMethod === 'cash_on_delivery' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-healthcare-green-100 text-healthcare-green-800 border border-healthcare-green-200 dark:bg-healthcare-green-900 dark:text-healthcare-green-200 dark:border-healthcare-green-700">
                              💵 COD
                            </span>
                          )}
                          {order.paymentStatus === 'paid' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900 dark:text-emerald-200 dark:border-emerald-700">
                              ✅ Paid
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(order.createdAt)}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <div className="bg-healthcare-green-100 dark:bg-healthcare-green-900 rounded-full p-1">
                            <Users className="w-3 h-3 text-healthcare-green-600 dark:text-healthcare-green-400" />
                          </div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {order.customer?.firstName} {order.customer?.lastName}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                          <Mail className="w-3 h-3" />
                          <span>{order.customer?.email}</span>
                        </div>
                        {order.customer?.phone && (
                          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                            <Phone className="w-3 h-3" />
                            <span>{order.customer?.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {order.items?.length || 0} items
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Qty: {order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        ৳{(order.vendorSubtotal || 0).toFixed(2)}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingOrderId === order._id ? (
                        <div className="space-y-2">
                          <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                            className="block w-full px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value="">Select Status</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          <input
                            type="text"
                            placeholder="Notes (optional)"
                            value={statusNotes}
                            onChange={(e) => setStatusNotes(e.target.value)}
                            className="block w-full px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          />
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleStatusUpdate(order._id, newStatus, statusNotes)}
                              disabled={!newStatus}
                              className="flex items-center px-2 py-1 text-xs bg-green-600 dark:bg-green-700 text-white rounded hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50"
                            >
                              <Save className="w-3 h-3 mr-1" />
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingOrderId(null);
                                setNewStatus('');
                                setStatusNotes('');
                              }}
                              className="flex items-center px-2 py-1 text-xs bg-gray-500 dark:bg-gray-600 text-white rounded hover:bg-gray-600 dark:hover:bg-gray-500"
                            >
                              <X className="w-3 h-3 mr-1" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1 capitalize">{order.status}</span>
                        </span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowDetailsModal(true);
                          }}
                          className="text-healthcare-green-600 dark:text-healthcare-green-400 hover:text-healthcare-green-900 dark:hover:text-healthcare-green-300"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {order.status !== 'delivered' && order.status !== 'cancelled' && (
                          <button
                            onClick={() => {
                              setEditingOrderId(order._id);
                              setNewStatus(order.status);
                            }}
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                            title="Update Status"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 sm:px-6">
          <div className="flex justify-between flex-1 sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={!pagination.hasPrev}
              className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
              disabled={!pagination.hasNext}
              className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Showing{' '}
                <span className="font-medium">
                  {(currentPage - 1) * 10 + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * 10, pagination.totalItems)}
                </span>{' '}
                of{' '}
                <span className="font-medium">{pagination.totalItems}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={!pagination.hasPrev}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                  disabled={!pagination.hasNext}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedOrder(null);
          }}
          title={`Order Details - #${selectedOrder.trackingId}`}
        >
          <div className="space-y-6">
            {/* Order Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Order Information</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Order ID:</span> #{selectedOrder.trackingId}</p>
                  <p><span className="font-medium">Date:</span> {formatDate(selectedOrder.createdAt)}</p>
                  <p><span className="font-medium">Status:</span> 
                    <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusIcon(selectedOrder.status)}
                      <span className="ml-1 capitalize">{selectedOrder.status}</span>
                    </span>
                  </p>
                  <p><span className="font-medium">Payment Method:</span> 
                    <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      selectedOrder.paymentMethod === 'sslcommerz' || selectedOrder.paymentMethod === 'online'
                        ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700'
                        : selectedOrder.paymentMethod === 'cash_on_delivery'
                        ? 'bg-healthcare-green-100 text-healthcare-green-800 border-healthcare-green-200 dark:bg-healthcare-green-900 dark:text-healthcare-green-200 dark:border-healthcare-green-700'
                        : 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600'
                    }`}>
                      <CreditCard className="w-3 h-3 mr-1" />
                      <span className="capitalize">
                        {selectedOrder.paymentMethod === 'sslcommerz' 
                          ? 'SSL Commerce' 
                          : selectedOrder.paymentMethod === 'online'
                          ? 'Online Payment'
                          : selectedOrder.paymentMethod === 'cash_on_delivery'
                          ? 'Cash on Delivery'
                          : selectedOrder.paymentMethod || 'N/A'}
                      </span>
                    </span>
                  </p>
                  {selectedOrder.paymentStatus && (
                    <p><span className="font-medium">Payment Status:</span> 
                      <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        selectedOrder.paymentStatus === 'paid'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-200 dark:border-emerald-700'
                          : selectedOrder.paymentStatus === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700'
                          : 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700'
                      }`}>
                        {selectedOrder.paymentStatus === 'paid' ? '✅' : selectedOrder.paymentStatus === 'pending' ? '⏳' : '❌'}
                        <span className="ml-1 capitalize">{selectedOrder.paymentStatus}</span>
                      </span>
                    </p>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Users className="w-4 h-4 mr-2 text-healthcare-green-600" />
                  Customer Information
                </h4>
                <div className="bg-healthcare-green-50 p-4 rounded-lg space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="bg-healthcare-green-100 rounded-full p-2">
                      <Users className="w-4 h-4 text-healthcare-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {selectedOrder.customer?.firstName} {selectedOrder.customer?.lastName}
                      </p>
                      <p className="text-sm text-gray-600">Customer</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium text-gray-900">{selectedOrder.customer?.email}</span>
                    </div>
                    
                    {selectedOrder.customer?.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium text-gray-900">{selectedOrder.customer?.phone}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Order Date:</span>
                      <span className="font-medium text-gray-900">{formatDate(selectedOrder.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-green-600" />
                Delivery Address
              </h4>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="bg-green-100 rounded-full p-1">
                      <MapPin className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="font-semibold text-gray-900">{selectedOrder.shippingAddress?.fullName}</span>
                  </div>
                  
                  <div className="ml-6 space-y-1 text-sm text-gray-700">
                    <p className="font-medium">{selectedOrder.shippingAddress?.address}</p>
                    <p>{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.postalCode}</p>
                    
                    <div className="flex items-center space-x-4 mt-2 pt-2 border-t border-green-200">
                      <div className="flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-gray-400" />
                        <span>{selectedOrder.shippingAddress?.phone}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Mail className="w-3 h-3 text-gray-400" />
                        <span>{selectedOrder.shippingAddress?.email}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SSL Payment Details */}
            {(selectedOrder.paymentMethod === 'sslcommerz' || selectedOrder.paymentMethod === 'online') && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <CreditCard className="w-4 h-4 mr-2 text-purple-600" />
                    SSL Commerce Payment Details
                  </h4>
                  <button
                    onClick={() => fetchPaymentDetails([selectedOrder])}
                    disabled={loadingPayments}
                    className="inline-flex items-center px-3 py-1 border border-purple-300 text-sm font-medium rounded-md text-purple-700 bg-white hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingPayments ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600 mr-1"></div>
                        Refreshing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Refresh
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  {loadingPayments ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                      <span className="ml-2 text-purple-600">Loading payment details...</span>
                    </div>
                  ) : orderPayments[selectedOrder._id] ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Transaction ID:</p>
                          <p className="text-sm font-mono bg-white px-2 py-1 rounded border">
                            {orderPayments[selectedOrder._id].transactionId || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Payment Status:</p>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            orderPayments[selectedOrder._id].paymentStatus === 'Success'
                              ? 'bg-emerald-100 text-emerald-800'
                              : orderPayments[selectedOrder._id].paymentStatus === 'Processing'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {orderPayments[selectedOrder._id].paymentStatus === 'Success' ? '✅' : 
                             orderPayments[selectedOrder._id].paymentStatus === 'Processing' ? '⏳' : '❌'}
                            <span className="ml-1">{orderPayments[selectedOrder._id].paymentStatus}</span>
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Amount:</p>
                          <p className="text-lg font-bold text-purple-700">
                            ৳{orderPayments[selectedOrder._id].amount}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Gateway:</p>
                          <p className="text-sm font-semibold text-purple-600">
                            {orderPayments[selectedOrder._id].gateway || 'SSL Commerce'}
                          </p>
                        </div>
                      </div>
                      
                      {orderPayments[selectedOrder._id].gatewayTransactionId && (
                        <div>
                          <p className="text-sm font-medium text-gray-600">Gateway Transaction ID:</p>
                          <p className="text-sm font-mono bg-white px-2 py-1 rounded border">
                            {orderPayments[selectedOrder._id].gatewayTransactionId}
                          </p>
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500 pt-2 border-t border-purple-200">
                        Payment processed on: {new Date(orderPayments[selectedOrder._id].createdAt).toLocaleString()}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <CreditCard className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p>No payment details available</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Order Items */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Your Medicines in this Order</h4>
              <div className="space-y-3">
                {selectedOrder.items?.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.medicine?.name}</p>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">৳{(item.price * item.quantity).toFixed(2)}</p>
                      <p className="text-sm text-gray-600">৳{item.price}/unit</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">Your Total Revenue:</span>
                <span className="text-xl font-bold text-green-600">
                  ৳{(selectedOrder.vendorSubtotal || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default VendorOrderManagement;

