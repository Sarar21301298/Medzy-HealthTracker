import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  Truck, 
  MapPin, 
  Phone, 
  Mail,
  Calendar,
  CreditCard,
  Search,
  Filter,
  RefreshCw,
  Eye,
  ArrowLeft,
  AlertCircle,
  Star,
  MessageCircle,
  X,
  User,
  Heart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import Modal from './Modal';
import OrderReviewModal from './OrderReviewModal';
import ServiceReviewModal from './ServiceReviewModal';

const OrderTracking = ({ onBack }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewOrder, setReviewOrder] = useState(null);
  const [showServiceReviewModal, setShowServiceReviewModal] = useState(false);
  const [serviceReviewOrder, setServiceReviewOrder] = useState(null);
  const [existingReviews, setExistingReviews] = useState({}); // Store existing reviews by orderId
  const { user, getAuthHeaders } = useAuth();
  const { error, success } = useNotification();

  useEffect(() => {
    fetchOrders();
  }, [currentPage, statusFilter, searchTerm]);

  // Listen for order placement events to auto-refresh
  useEffect(() => {
    const handleOrderPlaced = () => {
      console.log('🔄 Order placed event received, refreshing orders...');
      fetchOrders();
    };

    window.addEventListener('orderPlaced', handleOrderPlaced);
    return () => window.removeEventListener('orderPlaced', handleOrderPlaced);
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/orders/my-orders?${params}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
        setPagination(data.pagination || {});
        
        // Fetch existing reviews for these orders in background (non-blocking)
        fetchExistingReviews(data.orders || []).catch(err => 
          console.log('Background review fetch failed:', err)
        );
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API Error:', response.status, errorData);
        throw new Error(errorData.message || 'Failed to fetch orders');
      }
    } catch (err) {
      console.error('❌ Error fetching orders:', err);
      error(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
      console.log('✅ Finished fetching orders');
    }
  };

  const fetchExistingReviews = async (ordersList) => {
    try {
      console.log('🔍 Fetching existing reviews for orders...');
      const reviewsData = {};
      
      // For each order, check for existing vendor and service reviews
      for (const order of ordersList) {
        reviewsData[order._id] = {
          vendorReviews: [],
          serviceReview: null
        };
        
        // Fetch vendor reviews for this order
        try {
          const vendorReviewsResponse = await fetch(`/api/reviews/order/${order._id}`, {
            headers: getAuthHeaders()
          });
          if (vendorReviewsResponse.ok) {
            const vendorData = await vendorReviewsResponse.json();
            reviewsData[order._id].vendorReviews = vendorData.reviews || [];
            console.log(`📝 Vendor reviews for order ${order._id}:`, vendorData.reviews?.length || 0, vendorData.reviews);
          } else {
            console.log(`❌ Failed to fetch vendor reviews for order ${order._id}:`, vendorReviewsResponse.status);
          }
        } catch (err) {
          console.log('Could not fetch vendor reviews for order:', order._id, err);
        }
        
        // Fetch service review for this order
        try {
          const serviceReviewResponse = await fetch(`/api/service-reviews/order/${order._id}`, {
            headers: getAuthHeaders()
          });
          if (serviceReviewResponse.ok) {
            const serviceData = await serviceReviewResponse.json();
            reviewsData[order._id].serviceReview = serviceData.review || null;
          }
        } catch (err) {
          console.log('Could not fetch service review for order:', order._id);
        }
      }
      
      console.log('📝 Existing reviews data:', reviewsData);
      setExistingReviews(reviewsData);
    } catch (err) {
      console.error('❌ Error fetching existing reviews:', err);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedOrder(data.order);
      } else {
        throw new Error('Failed to fetch order details');
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
      error('Failed to load order details');
    }
  };

  const cancelOrder = async (orderId) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        success('Order cancelled successfully');
        // Refresh orders list
        fetchOrders();
        // Close modal if order details are open
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(null);
        }
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to cancel order');
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
      error(err.message || 'Failed to cancel order');
    }
  };

  const handleReviewOrder = (order) => {
    setReviewOrder(order);
    setShowReviewModal(true);
  };

  const handleReviewSubmitted = () => {
    // Refresh orders and existing reviews when a review is submitted
    console.log('🔄 Review submitted, refreshing orders...');
    setTimeout(() => {
      fetchOrders();
    }, 200); // Reduced delay for faster refresh
  };

  const handleServiceReview = (order) => {
    setServiceReviewOrder(order);
    setShowServiceReviewModal(true);
  };

  const handleServiceReviewSubmit = async (reviewData) => {
    try {
      const response = await fetch('/api/service-reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(reviewData)
      });

      if (response.ok) {
        success('Service review submitted successfully!');
        setShowServiceReviewModal(false);
        // Refresh orders to update review status
        console.log('🔄 Service review submitted, refreshing orders...');
        setTimeout(() => {
          fetchOrders();
        }, 200); // Reduced delay for faster refresh
      } else {
        const errorData = await response.json();
        console.error('Service review error:', errorData);
        throw new Error(errorData.message || 'Failed to submit service review');
      }
    } catch (error) {
      throw error;
    }
  };

  // Helper function to check if vendor reviews exist for an order
  const hasVendorReviews = (orderId) => {
    const reviews = existingReviews[orderId];
    const hasReviews = reviews && reviews.vendorReviews && reviews.vendorReviews.length > 0;
    console.log(`🔍 hasVendorReviews for order ${orderId}:`, hasReviews, 'Reviews data:', reviews);
    return hasReviews;
  };

  // Helper function to check if service review exists for an order
  const hasServiceReview = (orderId) => {
    const reviews = existingReviews[orderId];
    return reviews && reviews.serviceReview !== null;
  };

  // Helper function to get completed vendor count for an order
  const getCompletedVendorCount = (orderId) => {
    const reviews = existingReviews[orderId];
    return reviews && reviews.vendorReviews ? reviews.vendorReviews.length : 0;
  };

  // Helper function to get total vendor count for an order
  const getTotalVendorCount = (order) => {
    const vendorIds = new Set();
    order.items?.forEach(item => {
      if (item.vendor?._id) {
        vendorIds.add(item.vendor._id);
      }
    });
    return vendorIds.size;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      case 'confirmed':
        return 'bg-healthcare-green-100 dark:bg-healthcare-green-900/30 text-healthcare-green-800 dark:text-healthcare-green-300 border-healthcare-green-200 dark:border-healthcare-green-800';
      case 'processing':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'shipped':
        return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      case 'delivered':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800';
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  const getPaymentStatusColor = (paymentStatus) => {
    switch (paymentStatus) {
      case 'paid':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      case 'failed':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'refunded':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'confirmed':
      case 'processing':
        return <Package className="w-4 h-4" />;
      case 'shipped':
        return <Truck className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const getStatusProgress = (status) => {
    const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const currentIndex = statuses.indexOf(status);
    return currentIndex >= 0 ? ((currentIndex + 1) / statuses.length) * 100 : 0;
  };

  const getDeliveryEstimate = (order) => {
    if (order.status === 'delivered') {
      return 'Delivered';
    }
    
    if (order.estimatedDelivery) {
      const deliveryDate = new Date(order.estimatedDelivery);
      const today = new Date();
      const diffTime = deliveryDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return 'Overdue';
      } else if (diffDays === 0) {
        return 'Today';
      } else if (diffDays === 1) {
        return 'Tomorrow';
      } else {
        return `${diffDays} days`;
      }
    }
    
    return 'TBD';
  };

  const OrderStatusTimeline = ({ order }) => {
    const steps = [
      { status: 'pending', label: 'Order Placed', icon: Clock },
      { status: 'confirmed', label: 'Confirmed', icon: CheckCircle },
      { status: 'processing', label: 'Processing', icon: Package },
      { status: 'shipped', label: 'Shipped', icon: Truck },
      { status: 'delivered', label: 'Delivered', icon: CheckCircle }
    ];

    const currentStatusIndex = steps.findIndex(step => step.status === order.status);

    return (
      <div className="space-y-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index <= currentStatusIndex;
          const isCurrent = index === currentStatusIndex;
          
          return (
            <div key={step.status} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                isCompleted 
                  ? 'bg-healthcare-green-600 dark:bg-healthcare-green-500 border-healthcare-green-600 dark:border-healthcare-green-500 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="ml-4 flex-1">
                <div className={`font-medium ${isCompleted ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                  {step.label}
                </div>
                {isCurrent && (
                  <div className="text-sm text-healthcare-green-600 dark:text-healthcare-green-400">
                    Current status
                  </div>
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`absolute left-4 mt-8 w-0.5 h-6 ${
                  isCompleted ? 'bg-healthcare-green-600 dark:bg-healthcare-green-500' : 'bg-gray-300 dark:bg-gray-600'
                }`} style={{ marginLeft: '15px' }} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-healthcare-green-500 dark:text-healthcare-green-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-healthcare-green-50 via-purple-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Fancy Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="mr-6 p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl group"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300 group-hover:text-healthcare-green-600 dark:group-hover:text-healthcare-green-400 transition-colors" />
              </button>
              <div className="relative">
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-healthcare-green-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  My Orders
                </h1>
                <div className="absolute -bottom-2 left-0 w-20 h-1 bg-gradient-to-r from-healthcare-green-500 to-purple-500 rounded-full"></div>
                <p className="text-gray-600 dark:text-gray-300 mt-4 text-lg">
                  Track your medicine orders and delivery status
                </p>
              </div>
            </div>
            <button
              onClick={fetchOrders}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-healthcare-green-600 to-purple-600 text-white rounded-xl hover:from-healthcare-green-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by tracking ID or medicine name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500 dark:focus:border-healthcare-green-400 dark:focus:ring-healthcare-green-400 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                />
              </div>
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500 dark:focus:border-healthcare-green-400 dark:focus:ring-healthcare-green-400 dark:bg-gray-800 dark:text-white"
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
          </div>
        </div>

        {/* Orders List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.length === 0 ? (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 text-center py-16 backdrop-blur-sm">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-healthcare-green-500/10 to-purple-500/10 rounded-2xl"></div>
                <Package className="h-20 w-20 text-gray-400 dark:text-gray-500 mx-auto mb-6 relative z-10" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">No orders found</h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your filters to find your orders' 
                  : 'Your medicine orders will appear here once you make a purchase'}
              </p>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order._id} className="group bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-5 transition-all duration-200 hover:shadow-lg relative overflow-hidden">
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-healthcare-green-500/3 to-purple-500/3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative z-10">
                  {/* Top Row - Order Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">
                          Order #{order.trackingId}
                        </h3>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Info Grid - Compact */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {/* Total Amount */}
                    <div className="text-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Amount</div>
                      <div className="text-xl font-bold text-green-600 dark:text-green-400">
                        ৳{order.total?.toFixed(0)}
                      </div>
                    </div>

                    {/* Items Count */}
                    <div className="text-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Items</div>
                      <div className="text-xl font-bold text-gray-900 dark:text-white">
                        {order.items?.length || 0}
                      </div>
                    </div>

                    {/* Delivery Status */}
                    <div className="text-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Delivery</div>
                      <div className="text-sm font-bold text-healthcare-green-600 dark:text-healthcare-green-400">
                        {getDeliveryEstimate(order)}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Progress</span>
                      <span className="text-xs font-bold text-healthcare-green-600 dark:text-healthcare-green-400">{Math.round(getStatusProgress(order.status))}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-healthcare-green-500 to-purple-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${getStatusProgress(order.status)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => fetchOrderDetails(order._id)}
                      className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-healthcare-green-600 to-purple-600 text-white rounded-lg hover:from-healthcare-green-700 hover:to-purple-700 transition-all text-sm font-medium flex-1"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </button>
                    {order.status === 'pending' && (
                      <button
                        onClick={() => {
                          if (window.confirm('Cancel this order?')) {
                            cancelOrder(order._id);
                          }
                        }}
                        className="flex items-center justify-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all text-sm font-medium flex-1"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </button>
                    )}
                    {(order.status === 'delivered' || order.status === 'shipped') && (
                      <>
                        <button 
                          onClick={() => handleReviewOrder(order)}
                          disabled={hasVendorReviews(order._id) && getCompletedVendorCount(order._id) >= getTotalVendorCount(order)}
                          className={`flex items-center justify-center px-3 py-2 border rounded-lg transition-all text-xs font-medium flex-1 ${
                            hasVendorReviews(order._id) 
                              ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300'
                              : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/40'
                          }`}
                        >
                          <Star className={`h-3 w-3 mr-1 ${hasVendorReviews(order._id) ? 'fill-current' : ''}`} />
                          Review
                        </button>
                        
                        <button 
                          onClick={() => handleServiceReview(order)}
                          disabled={hasServiceReview(order._id)}
                          className={`flex items-center justify-center px-3 py-2 border rounded-lg transition-all text-xs font-medium flex-1 ${
                            hasServiceReview(order._id)
                              ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300'
                              : 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40'
                          }`}
                        >
                          <Heart className={`h-3 w-3 mr-1 ${hasServiceReview(order._id) ? 'fill-current' : ''}`} />
                          Service
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, pagination.totalItems)} of {pagination.totalItems} results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={!pagination.hasPrev}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                {currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!pagination.hasNext}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Order Details Modal */}
      {selectedOrder && (
        <Modal 
          isOpen={true}
          onClose={() => setSelectedOrder(null)}
          title={`Order Details - #${selectedOrder.trackingId}`}
          size="xlarge"
        >
          <div className="p-8 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
            {/* Modern Order Status Header */}
            <div className="mb-8 p-6 bg-gradient-to-br from-healthcare-green-50 to-emerald-50 dark:from-healthcare-green-900/30 dark:to-emerald-900/30 rounded-2xl border-2 border-healthcare-green-200 dark:border-healthcare-green-700">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <div className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusIcon(selectedOrder.status)}
                      {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                    </div>
                    <div className={`px-4 py-2 rounded-xl text-xs font-bold shadow-lg ${getPaymentStatusColor(selectedOrder.paymentStatus)}`}>
                      Payment: {selectedOrder.paymentStatus}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-healthcare-green-600" />
                    Placed on {new Date(selectedOrder.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <div className="lg:text-right">
                  <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                    ৳{selectedOrder.total?.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    {selectedOrder.items?.length || 0} item(s)
                  </div>
                </div>
              </div>
              
              {selectedOrder.status === 'pending' && (
                <div className="mt-6 pt-6 border-t-2 border-healthcare-green-200 dark:border-healthcare-green-700">
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to cancel this order?')) {
                        cancelOrder(selectedOrder._id);
                      }
                    }}
                    className="flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl transition-all duration-200 shadow-lg font-medium"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel Order
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Order Timeline */}
              <div>
                <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                  <div className="p-2 bg-healthcare-green-100 dark:bg-healthcare-green-900/50 rounded-lg">
                    <Clock className="h-5 w-5 text-healthcare-green-600 dark:text-healthcare-green-400" />
                  </div>
                  Order Status Timeline
                </h4>
                <OrderStatusTimeline order={selectedOrder} />
              </div>

              {/* Order Information */}
              <div className="space-y-8">
                {/* Order Details Card */}
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                      <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h4 className="font-bold text-lg text-gray-900 dark:text-white">Order Details</h4>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-100 dark:border-gray-700 space-y-5">
                    <div className="flex justify-between items-center pb-5 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Order Placed</span>
                      <div className="text-right">
                        <div className="font-bold text-gray-900 dark:text-gray-100">
                          {new Date(selectedOrder.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(selectedOrder.createdAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pb-5 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Order Status</span>
                      <span className={`px-4 py-2 rounded-xl text-xs font-bold shadow-md ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Total Amount</span>
                      <span className="font-bold text-lg text-green-600 dark:text-green-400">
                        ৳{selectedOrder.total?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Delivery Information Card */}
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                      <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h4 className="font-bold text-lg text-gray-900 dark:text-white">Delivery Address</h4>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-100 dark:border-gray-700 space-y-5">
                    <div className="flex gap-4">
                      <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl h-fit">
                        <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900 dark:text-gray-100 mb-1">{selectedOrder.shippingAddress?.fullName}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <p>{selectedOrder.shippingAddress?.address}</p>
                          <p>{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.postalCode}</p>
                        </div>
                      </div>
                    </div>
                    <div className="pt-5 border-t border-gray-100 dark:border-gray-700 space-y-4">
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        <span className="text-gray-900 dark:text-gray-100 font-medium">{selectedOrder.shippingAddress?.phone}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        <span className="text-gray-900 dark:text-gray-100 font-medium">{selectedOrder.shippingAddress?.email}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Information Card */}
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                      <CreditCard className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h4 className="font-bold text-lg text-gray-900 dark:text-white">Payment Details</h4>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-100 dark:border-gray-700 space-y-5">
                    <div className="flex justify-between items-center pb-5 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Payment Method</span>
                      <span className="font-bold text-gray-900 dark:text-gray-100 capitalize">
                        {selectedOrder.paymentMethod?.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Payment Status</span>
                      <span className={`px-4 py-2 rounded-xl text-xs font-bold shadow-md ${getPaymentStatusColor(selectedOrder.paymentStatus)}`}>
                        {selectedOrder.paymentStatus.charAt(0).toUpperCase() + selectedOrder.paymentStatus.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="mt-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                  <Package className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h4 className="font-bold text-lg text-gray-900 dark:text-white">Order Items ({selectedOrder.items?.length || 0})</h4>
              </div>
              <div className="space-y-4">
                {selectedOrder.items?.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-5 border-2 border-gray-100 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 hover:border-healthcare-green-300 dark:hover:border-healthcare-green-600 transition-colors duration-200">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mr-3">
                        <Package className="h-6 w-6 text-healthcare-green-600 dark:text-healthcare-green-400" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {item.medicine?.name || 'Medicine'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Qty: {item.quantity} × ৳{item.price?.toFixed(2)}
                        </div>
                        {item.vendor && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Vendor: {item.vendor.firstName} {item.vendor.lastName}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        ৳{(item.quantity * item.price).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="mt-10 pt-8">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 border-2 border-gray-200 dark:border-gray-700 max-w-lg ml-auto">
                  <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-6">Order Summary</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-4 border-b-2 border-gray-200 dark:border-gray-600">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Subtotal</span>
                      <span className="font-bold text-gray-900 dark:text-gray-100">৳{selectedOrder.subtotal?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b-2 border-gray-200 dark:border-gray-600">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Delivery Fee</span>
                      <span className="font-bold text-gray-900 dark:text-gray-100">৳{selectedOrder.deliveryFee?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">Total Amount</span>
                      <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">৳{selectedOrder.total?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Review Modal */}
      <OrderReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        order={reviewOrder}
        onReviewSubmitted={handleReviewSubmitted}
      />

      {/* Service Review Modal */}
      <ServiceReviewModal
        isOpen={showServiceReviewModal}
        onClose={() => setShowServiceReviewModal(false)}
        order={serviceReviewOrder}
        onSubmitReview={handleServiceReviewSubmit}
      />
    </div>
  );
};

export default OrderTracking;

