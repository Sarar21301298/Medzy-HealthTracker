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
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import Modal from './Modal';

const OrderManagement = ({ onBack }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const { getAuthHeaders } = useAuth();
  const { error } = useNotification();

  useEffect(() => {
    fetchOrders();
  }, [currentPage]);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`/api/orders/my-orders?page=${currentPage}&limit=10`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
        setPagination(data.pagination);
      } else {
        throw new Error('Failed to fetch orders');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      error('Failed to load orders');
    } finally {
      setLoading(false);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-healthcare-green-100 text-healthcare-green-800';
      case 'processing':
        return 'bg-purple-100 text-purple-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-healthcare-green-100 text-healthcare-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const OrderCard = ({ order }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Order #{order.trackingId}
          </h3>
          <p className="text-sm text-gray-600">
            Placed on {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(order.status)}`}>
            {getStatusIcon(order.status)}
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
            Payment: {order.paymentStatus}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Items</p>
          <p className="font-medium">{order.items.length} items</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Total Amount</p>
          <p className="font-bold text-green-600 text-lg">৳{order.total.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Estimated Delivery</p>
          <p className="font-medium">
            {order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleDateString() : 'TBD'}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">Items:</p>
        <div className="flex flex-wrap gap-2">
          {order.items.slice(0, 3).map((item, index) => (
            <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
              {item.medicine.name} (×{item.quantity})
            </span>
          ))}
          {order.items.length > 3 && (
            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
              +{order.items.length - 3} more
            </span>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => fetchOrderDetails(order._id)}
          className="flex items-center gap-2 px-4 py-2 bg-healthcare-green-500 text-white rounded-lg hover:bg-healthcare-green-600 transition-colors"
        >
          <Eye className="w-4 h-4" />
          View Details
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-healthcare-green-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600">Track and manage your medicine orders</p>
        </div>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-600">You haven't placed any orders yet</p>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {orders.map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={!pagination.hasPrev}
                className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              
              <span className="text-sm text-gray-600">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={!pagination.hasNext}
                className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedOrder(null)}
          title={`Order #${selectedOrder.trackingId}`}
          size="xl"
        >
          <div className="space-y-6">
            {/* Order Status */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusIcon(selectedOrder.status)}
                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(selectedOrder.paymentStatus)}`}>
                    Payment: {selectedOrder.paymentStatus}
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">৳{selectedOrder.total.toFixed(2)}</p>
                <p className="text-sm text-gray-600">Total Amount</p>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Items Ordered</h3>
              <div className="space-y-3">
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg">
                    <div className="flex-shrink-0">
                      {item.medicine.imageUrl ? (
                        <img 
                          src={item.medicine.imageUrl} 
                          alt={item.medicine.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Package className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{item.medicine.name}</h4>
                      <p className="text-sm text-gray-600">{item.medicine.genericName}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-gray-500">Qty: {item.quantity}</span>
                        <span className="text-sm text-gray-500">Price: ৳{item.price.toFixed(2)}</span>
                        <span className="text-sm font-medium">Total: ৳{(item.quantity * item.price).toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <p>Vendor:</p>
                      <p className="font-medium">{item.vendor.firstName} {item.vendor.lastName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping & Payment Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Shipping Address</h3>
                <div className="p-4 border border-gray-200 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{selectedOrder.shippingAddress.fullName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{selectedOrder.shippingAddress.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{selectedOrder.shippingAddress.email}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p>{selectedOrder.shippingAddress.address}</p>
                      <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.postalCode}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Summary</h3>
                <div className="p-4 border border-gray-200 rounded-lg space-y-3">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>৳{selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>{selectedOrder.deliveryFee === 0 ? 'Free' : `৳${selectedOrder.deliveryFee.toFixed(2)}`}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span className="text-green-600">৳{selectedOrder.total.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">
                        Payment Method: {
                          selectedOrder.paymentMethod === 'card' ? 'Credit/Debit Card' :
                          selectedOrder.paymentMethod === 'mobile_banking' ? 'Mobile Banking' :
                          'Cash on Delivery'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Timeline */}
            {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Timeline</h3>
                <div className="space-y-3">
                  {selectedOrder.statusHistory.map((history, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(history.status).replace('text', 'bg')}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium capitalize">{history.status}</span>
                          <span className="text-sm text-gray-500">
                            {new Date(history.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {history.note && (
                          <p className="text-sm text-gray-600">{history.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {selectedOrder.notes && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Notes</h3>
                <p className="text-gray-700 p-3 bg-gray-50 rounded-lg">{selectedOrder.notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default OrderManagement;

