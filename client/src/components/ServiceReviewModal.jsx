import React, { useState } from 'react';
import { Star, X, Send, CheckCircle, Truck, Package, Headphones, Smartphone, Gift, Heart, User } from 'lucide-react';

const ServiceReviewModal = ({ isOpen, onClose, order, onSubmitReview }) => {
  const [ratings, setRatings] = useState({
    deliverySpeed: 0,
    deliveryQuality: 0,
    customerService: 0,
    appExperience: 0,
    packaging: 0,
    overallSatisfaction: 0
  });
  
  const [feedback, setFeedback] = useState({
    deliveryFeedback: '',
    customerServiceFeedback: '',
    appFeedback: '',
    overallFeedback: '',
    suggestions: ''
  });
  
  const [deliveryPersonRating, setDeliveryPersonRating] = useState(0);
  const [deliveryPersonName, setDeliveryPersonName] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const ratingCategories = [
    {
      key: 'deliverySpeed',
      label: 'Delivery Speed',
      icon: <Truck className="h-5 w-5" />,
      description: 'How fast was your order delivered?',
      color: 'blue'
    },
    {
      key: 'deliveryQuality',
      label: 'Delivery Quality',
      icon: <Package className="h-5 w-5" />,
      description: 'How was the delivery service quality?',
      color: 'green'
    },
    {
      key: 'customerService',
      label: 'Customer Service',
      icon: <Headphones className="h-5 w-5" />,
      description: 'How was our customer support?',
      color: 'purple'
    },
    {
      key: 'appExperience',
      label: 'App Experience',
      icon: <Smartphone className="h-5 w-5" />,
      description: 'How was your experience using MedZy?',
      color: 'indigo'
    },
    {
      key: 'packaging',
      label: 'Packaging',
      icon: <Gift className="h-5 w-5" />,
      description: 'How was the medicine packaging?',
      color: 'pink'
    },
    {
      key: 'overallSatisfaction',
      label: 'Overall Satisfaction',
      icon: <Heart className="h-5 w-5" />,
      description: 'Overall experience with MedZy',
      color: 'red'
    }
  ];

  const handleRatingChange = (category, rating) => {
    setRatings(prev => ({ ...prev, [category]: rating }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all ratings are provided
    const allRatingsProvided = Object.values(ratings).every(rating => rating > 0);
    if (!allRatingsProvided) {
      alert('Please rate all service aspects');
      return;
    }
    
    if (!feedback.overallFeedback.trim()) {
      alert('Please provide overall feedback');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmitReview({
        orderId: order._id,
        ratings,
        feedback: {
          ...feedback,
          deliveryFeedback: feedback.deliveryFeedback.trim(),
          customerServiceFeedback: feedback.customerServiceFeedback.trim(),
          appFeedback: feedback.appFeedback.trim(),
          overallFeedback: feedback.overallFeedback.trim(),
          suggestions: feedback.suggestions.trim()
        },
        deliveryPersonRating: deliveryPersonRating || undefined,
        deliveryPersonName: deliveryPersonName.trim() || undefined,
        wouldRecommend
      });
      
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
        resetForm();
      }, 500); // Quick success display then close
    } catch (error) {
      console.error('Error submitting service review:', error);
      // Try to get the actual error message from the response
      let errorMessage = 'Failed to submit review. Please try again.';
      if (error.message && error.message !== 'Failed to fetch') {
        errorMessage = error.message;
      }
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setRatings({
      deliverySpeed: 0,
      deliveryQuality: 0,
      customerService: 0,
      appExperience: 0,
      packaging: 0,
      overallSatisfaction: 0
    });
    setFeedback({
      deliveryFeedback: '',
      customerServiceFeedback: '',
      appFeedback: '',
      overallFeedback: '',
      suggestions: ''
    });
    setDeliveryPersonRating(0);
    setDeliveryPersonName('');
    setWouldRecommend(true);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      resetForm();
    }
  };

  const renderStars = (rating, onRatingChange, size = 'h-6 w-6') => {
    return Array.from({ length: 5 }, (_, i) => (
      <button
        key={i}
        type="button"
        onClick={() => onRatingChange(i + 1)}
        className="transition-transform hover:scale-110"
      >
        <Star
          className={`${size} ${
            i < rating
              ? 'text-yellow-400 fill-current'
              : 'text-gray-300 dark:text-gray-600'
          }`}
        />
      </button>
    ));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-healthcare-green-600 to-purple-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">Rate Your MedZy Experience</h3>
              <p className="text-healthcare-green-100 text-sm mt-1">
                Help us improve our service • Order #{order?.trackingId}
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-2 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {showSuccess ? (
          // Success State
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <h4 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Thank You for Your Feedback!
            </h4>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Your review helps us provide better service to all customers.
            </p>
          </div>
        ) : (
          // Review Form
          <form onSubmit={handleSubmit} className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
            {/* Service Ratings */}
            <div className="space-y-8">
              <div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                  Rate Our Service Aspects
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {ratingCategories.map((category) => (
                    <div key={category.key} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`p-2 bg-${category.color}-100 dark:bg-${category.color}-900/30 rounded-lg`}>
                          {category.icon}
                        </div>
                        <div>
                          <h5 className="font-semibold text-gray-900 dark:text-gray-100">
                            {category.label}
                          </h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {category.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-center space-x-1">
                        {renderStars(ratings[category.key], (rating) => handleRatingChange(category.key, rating))}
                      </div>
                      <div className="text-center mt-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {ratings[category.key] > 0 && (
                            <>
                              {ratings[category.key] === 1 && 'Poor'}
                              {ratings[category.key] === 2 && 'Fair'}
                              {ratings[category.key] === 3 && 'Good'}
                              {ratings[category.key] === 4 && 'Very Good'}
                              {ratings[category.key] === 5 && 'Excellent'}
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Person Rating */}
              <div className="bg-healthcare-green-50 dark:bg-healthcare-green-900/20 rounded-xl p-6">
                <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Delivery Person (Optional)
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Delivery Person Name
                    </label>
                    <input
                      type="text"
                      value={deliveryPersonName}
                      onChange={(e) => setDeliveryPersonName(e.target.value)}
                      placeholder="e.g., John Doe"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Delivery Person Rating
                    </label>
                    <div className="flex space-x-1">
                      {renderStars(deliveryPersonRating, setDeliveryPersonRating, 'h-5 w-5')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Written Feedback */}
              <div className="space-y-6">
                <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Share Your Experience
                </h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Overall Feedback *
                  </label>
                  <textarea
                    value={feedback.overallFeedback}
                    onChange={(e) => setFeedback(prev => ({ ...prev, overallFeedback: e.target.value }))}
                    placeholder="Tell us about your overall experience with MedZy..."
                    rows={4}
                    maxLength={500}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-healthcare-green-500 focus:border-transparent resize-none"
                    required
                  />
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {feedback.overallFeedback.length}/500 characters
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Delivery Feedback
                    </label>
                    <textarea
                      value={feedback.deliveryFeedback}
                      onChange={(e) => setFeedback(prev => ({ ...prev, deliveryFeedback: e.target.value }))}
                      placeholder="How was the delivery process?"
                      rows={3}
                      maxLength={300}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-healthcare-green-500 focus:border-transparent resize-none"
                    />
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {feedback.deliveryFeedback.length}/300 characters
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      App Experience Feedback
                    </label>
                    <textarea
                      value={feedback.appFeedback}
                      onChange={(e) => setFeedback(prev => ({ ...prev, appFeedback: e.target.value }))}
                      placeholder="How was using the MedZy app?"
                      rows={3}
                      maxLength={300}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-healthcare-green-500 focus:border-transparent resize-none"
                    />
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {feedback.appFeedback.length}/300 characters
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Suggestions for Improvement
                  </label>
                  <textarea
                    value={feedback.suggestions}
                    onChange={(e) => setFeedback(prev => ({ ...prev, suggestions: e.target.value }))}
                    placeholder="Any suggestions to help us improve?"
                    rows={3}
                    maxLength={400}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-healthcare-green-500 focus:border-transparent resize-none"
                  />
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {feedback.suggestions.length}/400 characters
                  </div>
                </div>
              </div>

              {/* Recommendation */}
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6">
                <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Would you recommend MedZy to others?
                </h5>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={wouldRecommend === true}
                      onChange={() => setWouldRecommend(true)}
                      className="mr-2"
                    />
                    <span className="text-green-600 dark:text-green-400 font-medium">Yes, definitely!</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={wouldRecommend === false}
                      onChange={() => setWouldRecommend(false)}
                      className="mr-2"
                    />
                    <span className="text-red-600 dark:text-red-400 font-medium">No, not really</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-6 border-t border-gray-200 dark:border-gray-600">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || Object.values(ratings).some(r => r === 0) || !feedback.overallFeedback.trim()}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-healthcare-green-600 to-purple-600 text-white rounded-lg hover:from-healthcare-green-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      <span>Submit Review</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ServiceReviewModal;

