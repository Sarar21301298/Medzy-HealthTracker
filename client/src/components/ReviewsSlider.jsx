import React, { useState, useEffect } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';

const ReviewsSlider = () => {
  const [reviews, setReviews] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [autoSlide, setAutoSlide] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  useEffect(() => {
    if (autoSlide && reviews.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % reviews.length);
      }, 4000); // Change review every 4 seconds

      return () => clearInterval(interval);
    }
  }, [autoSlide, reviews.length]);

  const fetchReviews = async () => {
    try {
      // Fetch both service reviews and vendor reviews
      const [serviceResponse, vendorResponse] = await Promise.all([
        fetch('/api/service-reviews/public?limit=10'),
        fetch('/api/reviews/public?limit=10')
      ]);
      
      const allReviews = [];
      
      if (serviceResponse.ok) {
        const serviceData = await serviceResponse.json();
        const serviceReviews = (serviceData.reviews || []).map(review => ({
          ...review,
          type: 'service',
          displayName: 'MedZy Service'
        }));
        allReviews.push(...serviceReviews);
      }
      
      if (vendorResponse.ok) {
        const vendorData = await vendorResponse.json();
        const vendorReviews = (vendorData.reviews || []).map(review => ({
          ...review,
          type: 'vendor',
          displayName: `${review.vendor?.firstName || ''} ${review.vendor?.lastName || ''}`.trim() || 'Vendor'
        }));
        allReviews.push(...vendorReviews);
      }
      
      // Shuffle the combined reviews for variety
      const shuffledReviews = allReviews.sort(() => Math.random() - 0.5);
      setReviews(shuffledReviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextReview = () => {
    setAutoSlide(false);
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
    setTimeout(() => setAutoSlide(true), 10000); // Resume auto-slide after 10 seconds
  };

  const prevReview = () => {
    setAutoSlide(false);
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
    setTimeout(() => setAutoSlide(true), 10000); // Resume auto-slide after 10 seconds
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

  if (loading) {
    return (
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12">
              Customer Reviews
            </h2>
            <div className="flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-healthcare-green-600"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (reviews.length === 0) {
    return (
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12">
              Customer Reviews
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              No reviews available yet. Be the first to share your experience!
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="reviews" className="py-16 bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            What Our Customers Say About MedZy
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Real feedback about our delivery and service experience
          </p>
          <div className="mt-4 w-20 h-1 bg-gradient-to-r from-healthcare-green-500 to-purple-500 mx-auto rounded-full"></div>
        </div>

        <div className="relative">
          {/* Main Review Display */}
          <div className="flex justify-center mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-4xl w-full mx-4 transform transition-all duration-500 ease-in-out">
              <div className="text-center">
                {/* Quote Icon */}
                <div className="flex justify-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-healthcare-green-500 to-purple-500 rounded-full flex items-center justify-center">
                    <Quote className="h-6 w-6 text-white" />
                  </div>
                </div>

                {/* Rating */}
                <div className="flex justify-center mb-4">
                  {reviews[currentIndex]?.type === 'service' 
                    ? renderStars(reviews[currentIndex]?.ratings?.overallSatisfaction || 0)
                    : renderStars(reviews[currentIndex]?.rating || 0)}
                </div>

                {/* Review Title */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  {reviews[currentIndex]?.type === 'service' 
                    ? 'MedZy Service Experience'
                    : `Vendor: ${reviews[currentIndex]?.displayName}`}
                </h3>

                {/* Review Content */}
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  "{reviews[currentIndex]?.type === 'service' 
                    ? reviews[currentIndex]?.feedback?.overallFeedback
                    : reviews[currentIndex]?.comment}"
                </p>

                {/* Customer Info */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-healthcare-green-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {reviews[currentIndex]?.user?.firstName?.charAt(0)}
                        {reviews[currentIndex]?.user?.lastName?.charAt(0)}
                      </span>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {reviews[currentIndex]?.user?.firstName} {reviews[currentIndex]?.user?.lastName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Verified Customer 
                        {reviews[currentIndex]?.order?.trackingId && (
                          <span> • Order #{reviews[currentIndex]?.order?.trackingId}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-center items-center space-x-4 mb-8">
            <button
              onClick={prevReview}
              className="w-12 h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-lg"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            
            <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              {currentIndex + 1} of {reviews.length}
            </div>
            
            <button
              onClick={nextReview}
              className="w-12 h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-lg"
            >
              <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center space-x-2">
            {reviews.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setAutoSlide(false);
                  setCurrentIndex(index);
                  setTimeout(() => setAutoSlide(true), 10000);
                }}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-gradient-to-r from-healthcare-green-500 to-purple-500 w-8'
                    : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Additional Reviews Ticker */}
        <div className="mt-12 overflow-hidden">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
              Recent Reviews
            </h3>
            <div className="relative overflow-hidden">
              <div 
                className="flex space-x-6 animate-scroll"
                style={{
                  animation: 'scroll 30s linear infinite',
                  width: `${reviews.length * 300}px`
                }}
              >
                {[...reviews, ...reviews].map((review, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 w-72 bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-center mb-2">
                      {renderStars(review.averageRating)}
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                        {review.averageRating}/5
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2 mb-2">
                      {review.feedback?.overallFeedback}
                    </p>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {review.user?.firstName} {review.user?.lastName}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `
      }} />
    </section>
  );
};

export default ReviewsSlider;

