import React, { useState, useEffect } from 'react';
import { Star, MessageCircle, User, Calendar, Package, Shield, Eye, EyeOff, Search, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [serviceReviews, setServiceReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [reviewType, setReviewType] = useState('vendor'); // 'vendor' or 'service'
  const { getAuthHeaders } = useAuth();
  const { error, success } = useNotification();

  useEffect(() => {
    fetchReviews();
  }, [currentPage, searchTerm, statusFilter, reviewType]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      });

      let allReviews = [];
      let allStats = { averageRating: 0, totalReviews: 0 };

      if (reviewType === 'vendor') {
        const response = await fetch(`/api/reviews/admin/all-reviews?${params}`, {
          headers: getAuthHeaders()
        });

        if (response.ok) {
          const data = await response.json();
          setReviews(data.reviews || []);
          setServiceReviews([]);
          setStats(data.stats || { averageRating: 0, totalReviews: 0 });
          setPagination(data.pagination || {});
        } else {
          throw new Error('Failed to fetch vendor reviews');
        }
      } else if (reviewType === 'service') {
        const response = await fetch(`/api/service-reviews/admin/all-reviews?${params}`, {
          headers: getAuthHeaders()
        });

        if (response.ok) {
          const data = await response.json();
          setReviews([]);
          setServiceReviews(data.reviews || []);
          setStats(data.stats || { averageRating: 0, totalReviews: 0 });
          setPagination(data.pagination || {});
        } else {
          throw new Error('Failed to fetch service reviews');
        }
      } else {
        // Fetch both types for "all" option
        const [vendorResponse, serviceResponse] = await Promise.all([
          fetch(`/api/reviews/admin/all-reviews?${params}`, {
            headers: getAuthHeaders()
          }),
          fetch(`/api/service-reviews/admin/all-reviews?${params}`, {
            headers: getAuthHeaders()
          })
        ]);

        if (vendorResponse.ok && serviceResponse.ok) {
          const vendorData = await vendorResponse.json();
          const serviceData = await serviceResponse.json();
          
          setReviews(vendorData.reviews || []);
          setServiceReviews(serviceData.reviews || []);
          
          // Combine stats
          const totalReviews = (vendorData.stats?.totalReviews || 0) + (serviceData.stats?.totalReviews || 0);
          const avgRating = totalReviews > 0 ? 
            ((vendorData.stats?.averageRating || 0) * (vendorData.stats?.totalReviews || 0) + 
             (serviceData.stats?.averageRating || 0) * (serviceData.stats?.totalReviews || 0)) / totalReviews : 0;
          
          setStats({
            averageRating: Math.round(avgRating * 10) / 10,
            totalReviews
          });
          
          // Use vendor pagination as primary (you might want to implement combined pagination)
          setPagination(vendorData.pagination || {});
        } else {
          throw new Error('Failed to fetch reviews');
        }
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const toggleReviewStatus = async (reviewId, currentStatus, isServiceReview = false) => {
    try {
      const endpoint = isServiceReview 
        ? `/api/service-reviews/${reviewId}/toggle-status`
        : `/api/reviews/${reviewId}/toggle-status`;
        
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        success(`Review ${currentStatus ? 'deactivated' : 'activated'} successfully`);
        fetchReviews();
      } else {
        throw new Error('Failed to update review status');
      }
    } catch (err) {
      console.error('Error updating review status:', err);
      error('Failed to update review status');
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300 dark:text-gray-600'
        }`}
      />
    ));
  };

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return 'text-green-600 dark:text-green-400';
    if (rating >= 3.5) return 'text-yellow-600 dark:text-yellow-400';
    if (rating >= 2.5) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-healthcare-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-healthcare-green-600 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Review Management</h2>
            <p className="text-healthcare-green-100">Monitor and manage platform reviews</p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
              <div className="text-healthcare-green-200 text-sm">Avg Rating</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.totalReviews}</div>
              <div className="text-healthcare-green-200 text-sm">Total Reviews</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search reviews by customer, medicine, or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-healthcare-green-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={reviewType}
                onChange={(e) => setReviewType(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="all">All Reviews</option>
                <option value="vendor">Vendor Reviews</option>
                <option value="service">Service Reviews</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
        <div className="p-6">
          {(() => {
            const currentReviews = reviewType === 'service' ? serviceReviews : 
                                 reviewType === 'all' ? [...reviews, ...serviceReviews] : reviews;
            
            return currentReviews.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Reviews Found
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  No reviews match your current filters
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {currentReviews.map((review) => {
                  const isServiceReview = !review.medicine && (review.ratings?.overallSatisfaction || review.feedback?.overallFeedback);
                  
                  return (
                    <div 
                      key={review._id} 
                      className={`border rounded-lg p-6 transition-all hover:shadow-md ${
                        review.isActive 
                          ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800' 
                          : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isServiceReview 
                              ? 'bg-gradient-to-r from-green-500 to-healthcare-green-500'
                              : 'bg-gradient-to-r from-healthcare-green-500 to-purple-500'
                          }`}>
                            {isServiceReview ? (
                              <MessageCircle className="h-5 w-5 text-white" />
                            ) : (
                              <User className="h-5 w-5 text-white" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {review.user?.firstName} {review.user?.lastName}
                            </h4>
                            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                              <span>{review.user?.email}</span>
                              <span>•</span>
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            {isServiceReview ? (
                              renderStars(review.ratings?.overallSatisfaction || 0)
                            ) : (
                              renderStars(review.rating || 0)
                            )}
                            <span className={`font-bold ${
                              isServiceReview 
                                ? getRatingColor(review.ratings?.overallSatisfaction || 0)
                                : getRatingColor(review.rating || 0)
                            }`}>
                              {isServiceReview 
                                ? `${review.ratings?.overallSatisfaction || 0}/5`
                                : `${review.rating || 0}/5`
                              }
                            </span>
                          </div>
                          <button
                            onClick={() => toggleReviewStatus(review._id, review.isActive, isServiceReview)}
                            className={`p-2 rounded-lg transition-colors ${
                              review.isActive
                                ? 'bg-red-100 hover:bg-red-200 text-red-600'
                                : 'bg-green-100 hover:bg-green-200 text-green-600'
                            }`}
                            title={review.isActive ? 'Deactivate Review' : 'Activate Review'}
                          >
                            {review.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="mb-4">
                        <h5 className="font-semibold text-gray-900 dark:text-white mb-2">
                          {isServiceReview ? 'Service Experience Review' : review.title}
                        </h5>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {isServiceReview 
                            ? review.feedback?.overallFeedback 
                            : review.comment}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        {isServiceReview ? (
                          <>
                            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                              <Star className="h-4 w-4" />
                              <span>Service Review</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                              <MessageCircle className="h-4 w-4" />
                              <span>Recommendation: {review.wouldRecommend ? 'Yes' : 'No'}</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                              <Star className="h-4 w-4" />
                              <span>Vendor Review</span>
                            </div>
                            {review.vendor && (
                              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                                <User className="h-4 w-4" />
                                <span>Vendor: {review.vendor?.firstName} {review.vendor?.lastName}</span>
                              </div>
                            )}
                          </>
                        )}
                        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                          <Shield className="h-4 w-4" />
                          <span>
                            {review.order ? `Order: #${review.order?.trackingId}` : 'General Review'}
                          </span>
                        </div>
                      </div>

                      {!review.isActive && (
                        <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                          <p className="text-red-700 dark:text-red-300 text-sm font-medium">
                            This review is currently inactive and not visible to customers
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center space-x-4 mt-8">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={!pagination.hasPrevPage}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                disabled={!pagination.hasNextPage}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReviews;

