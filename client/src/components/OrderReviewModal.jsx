import React, { useState } from 'react';
import { Star, Package, X, CheckCircle, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import ReviewModal from './ReviewModal';

const OrderReviewModal = ({ isOpen, onClose, order, onReviewSubmitted }) => {
  const { getAuthHeaders } = useAuth();
  const { success, error } = useNotification();
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewedVendors, setReviewedVendors] = useState(new Set());

  const handleVendorSelect = (vendor, medicine) => {
    setSelectedVendor({ ...vendor, medicine });
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async (reviewData) => {
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          ...reviewData,
          orderId: order._id,
          vendorId: selectedVendor._id
        })
      });

      if (response.ok) {
        setReviewedVendors(prev => new Set([...prev, selectedVendor._id]));
        setShowReviewModal(false);
        
        // Show success notification
        success('Vendor review submitted successfully!');
        
        // Notify parent component that a review was submitted
        if (onReviewSubmitted) {
          onReviewSubmitted();
        }
      } else {
        const errorData = await response.json();
        console.error('Vendor review error:', errorData);
        throw new Error(errorData.message || 'Failed to submit vendor review');
      }
    } catch (err) {
      console.error('Error submitting vendor review:', err);
      error(err.message || 'Failed to submit vendor review. Please try again.');
      throw err; // Re-throw so ReviewModal can handle it
    }
  };

  if (!isOpen || !order) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-healthcare-green-600 to-purple-600 px-6 py-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Review Your Order</h3>
                <p className="text-healthcare-green-100 text-sm mt-1">
                  Order #{order.trackingId} • {order.items?.length} items
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Review the vendors from your order
            </p>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {/* Group items by vendor */}
              {Object.entries(
                order.items?.reduce((acc, item) => {
                  const vendorId = item.vendor?._id;
                  if (!acc[vendorId]) {
                    acc[vendorId] = {
                      vendor: item.vendor,
                      items: []
                    };
                  }
                  acc[vendorId].items.push(item);
                  return acc;
                }, {}) || {}
              ).map(([vendorId, group]) => {
                const isReviewed = reviewedVendors.has(vendorId);
                
                return (
                  <div 
                    key={vendorId}
                    className={`border border-gray-200 dark:border-gray-600 rounded-lg p-4 transition-all duration-200 ${
                      isReviewed 
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                        : 'hover:border-healthcare-green-300 dark:hover:border-healthcare-green-600 cursor-pointer'
                    }`}
                    onClick={() => !isReviewed && handleVendorSelect(group.vendor, group.items[0].medicine)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-healthcare-green-100 dark:bg-healthcare-green-900/30 rounded-lg flex items-center justify-center">
                          <User className="h-6 w-6 text-healthcare-green-600 dark:text-healthcare-green-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                            {group.vendor?.firstName} {group.vendor?.lastName}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {group.items.length} item{group.items.length > 1 ? 's' : ''} from this vendor
                          </p>
                          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {group.items.map(item => item.medicine?.name).join(', ')}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        {isReviewed ? (
                          <div className="flex items-center text-green-600 dark:text-green-400">
                            <CheckCircle className="h-5 w-5 mr-2" />
                            <span className="text-sm font-medium">Reviewed</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-healthcare-green-600 dark:text-healthcare-green-400">
                            <Star className="h-5 w-5 mr-2" />
                            <span className="text-sm font-medium">Review</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Vendor reviews completed: {reviewedVendors.size} of {Object.keys(
                    order.items?.reduce((acc, item) => {
                      const vendorId = item.vendor?._id;
                      if (!acc[vendorId]) acc[vendorId] = true;
                      return acc;
                    }, {}) || {}
                  ).length}
                </span>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        order={order}
        vendor={selectedVendor}
        onSubmitReview={handleReviewSubmit}
      />
    </>
  );
};

export default OrderReviewModal;

