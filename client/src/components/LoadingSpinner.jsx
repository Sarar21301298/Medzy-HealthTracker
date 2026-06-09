import React from 'react';
import { Heart, Loader2 } from 'lucide-react';

const LoadingSpinner = ({ 
  size = 'medium', 
  message = 'Loading...', 
  overlay = false,
  variant = 'default'
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'h-4 w-4';
      case 'large':
        return 'h-8 w-8';
      case 'xlarge':
        return 'h-12 w-12';
      default:
        return 'h-6 w-6';
    }
  };

  const getContainerClasses = () => {
    if (overlay) {
      return 'fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50';
    }
    return 'flex items-center justify-center py-8';
  };

  const LoadingContent = () => (
    <div className="flex flex-col items-center space-y-3">
      {variant === 'heart' ? (
        <div className="relative">
          <Heart className={`${getSizeClasses()} text-healthcare-green-600 animate-pulse`} fill="currentColor" />
          <div className="absolute inset-0 rounded-full border-2 border-healthcare-green-200 border-t-healthcare-green-600 animate-spin"></div>
        </div>
      ) : (
        <Loader2 className={`${getSizeClasses()} text-healthcare-green-600 animate-spin`} />
      )}
      
      {message && (
        <p className="text-gray-600 font-medium text-sm animate-pulse">
          {message}
        </p>
      )}
    </div>
  );

  return (
    <div className={getContainerClasses()}>
      <LoadingContent />
    </div>
  );
};

// Full-page loading overlay
export const FullPageLoader = ({ message = 'Loading MedZy...' }) => (
  <div className="fixed inset-0 bg-gradient-to-br from-healthcare-green-50 via-white to-green-50 flex items-center justify-center z-50">
    <div className="text-center">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm mx-auto">
        <div className="relative mb-6">
          <div className="bg-gradient-to-r from-healthcare-green-600 to-green-500 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
            <Heart className="h-8 w-8 text-white animate-pulse" fill="currentColor" />
          </div>
          <div className="absolute inset-0 rounded-full border-4 border-healthcare-green-200 border-t-healthcare-green-600 animate-spin"></div>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">MedZy</h3>
        <p className="text-gray-600 animate-pulse">{message}</p>
        
        <div className="mt-4 flex justify-center space-x-1">
          <div className="w-2 h-2 bg-healthcare-green-600 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-healthcare-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-healthcare-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  </div>
);

// Inline button loading state
export const ButtonLoader = ({ size = 'small' }) => (
  <Loader2 className={`${getSizeClasses(size)} animate-spin`} />
);

// Card loading skeleton
export const CardSkeleton = ({ lines = 3 }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border animate-pulse">
    <div className="flex items-center space-x-3 mb-4">
      <div className="bg-gray-200 rounded-lg h-10 w-10"></div>
      <div className="flex-1">
        <div className="bg-gray-200 h-4 rounded mb-2"></div>
        <div className="bg-gray-200 h-3 rounded w-2/3"></div>
      </div>
    </div>
    
    {Array.from({ length: lines }).map((_, index) => (
      <div key={index} className="mb-2">
        <div className={`bg-gray-200 h-3 rounded ${index === lines - 1 ? 'w-1/2' : 'w-full'}`}></div>
      </div>
    ))}
  </div>
);

function getSizeClasses(size) {
  switch (size) {
    case 'small':
      return 'h-4 w-4';
    case 'large':
      return 'h-8 w-8';
    default:
      return 'h-6 w-6';
  }
}

export default LoadingSpinner;

