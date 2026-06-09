import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const PhotoViewerModal = ({ photos, initialIndex = 0, donationName, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  if (!photos || photos.length === 0) {
    return null;
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const getPhotoUrl = (photo) => {
    return photo.url?.startsWith('http') ? photo.url : `http://localhost:5000${photo.url}`;
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') goToPrevious();
    if (e.key === 'ArrowRight') goToNext();
    if (e.key === 'Escape') onClose();
  };

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 bg-white hover:bg-gray-200 text-black p-2 rounded-full transition-colors"
        aria-label="Close"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Main Image Container */}
      <div className="relative w-full max-w-4xl h-auto flex items-center justify-center px-4">
        <img
          src={getPhotoUrl(photos[currentIndex])}
          alt={`${donationName} - Photo ${currentIndex + 1}`}
          className="max-w-full max-h-[80vh] object-contain rounded-lg"
          onError={(e) => {
            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"%3E%3Cpath stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/%3E%3C/svg%3E';
          }}
        />

        {/* Previous Button */}
        {photos.length > 1 && (
          <button
            onClick={goToPrevious}
            className="absolute left-0 -translate-x-16 bg-white hover:bg-gray-200 text-black p-3 rounded-full transition-colors"
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Next Button */}
        {photos.length > 1 && (
          <button
            onClick={goToNext}
            className="absolute right-0 translate-x-16 bg-white hover:bg-gray-200 text-black p-3 rounded-full transition-colors"
            aria-label="Next photo"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Photo Counter and Thumbnails */}
      {photos.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 p-4">
          {/* Counter */}
          <div className="text-center mb-4 text-white text-sm font-semibold">
            {currentIndex + 1} / {photos.length}
          </div>

          {/* Thumbnails */}
          <div className="flex justify-center gap-2 overflow-x-auto pb-2">
            {photos.map((photo, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? 'border-white'
                    : 'border-gray-600 hover:border-gray-400'
                }`}
              >
                <img
                  src={getPhotoUrl(photo)}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.backgroundColor = '#374151';
                  }}
                />
              </button>
            ))}
          </div>

          {/* Keyboard Hint */}
          <div className="text-center text-gray-400 text-xs mt-2">
            Use Arrow Keys to navigate, ESC to close
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoViewerModal;
