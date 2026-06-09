import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';

const PhotoSlideshow = ({ photos, donationName, onPhotoClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!photos || photos.length === 0) {
    return (
      <div className="bg-gray-300 dark:bg-gray-800 h-48 flex items-center justify-center">
        <span className="text-gray-500 dark:text-gray-400">No photos</span>
      </div>
    );
  }

  const goToPrevious = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const goToNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const handlePhotoClick = () => {
    if (onPhotoClick) {
      onPhotoClick(currentIndex);
    }
  };

  const getPhotoUrl = (photo) => {
    return photo.url?.startsWith('http') ? photo.url : `http://localhost:5000${photo.url}`;
  };

  return (
    <div 
      className="relative bg-gray-200 dark:bg-gray-800 h-48 overflow-hidden group cursor-pointer"
      onClick={handlePhotoClick}
    >
      {/* Main Photo */}
      <img
        src={getPhotoUrl(photos[currentIndex])}
        alt={`${donationName} - Photo ${currentIndex + 1}`}
        className="w-full h-full object-cover transition-transform group-hover:scale-105"
        onError={(e) => {
          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"%3E%3Cpath stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/%3E%3C/svg%3E';
        }}
      />

      {/* View Icon on Hover */}
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
        <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Previous Button */}
      {photos.length > 1 && (
        <button
          onClick={goToPrevious}
          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full transition-all"
          aria-label="Previous photo"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {/* Next Button */}
      {photos.length > 1 && (
        <button
          onClick={goToNext}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full transition-all"
          aria-label="Next photo"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Photo Counter */}
      <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white px-3 py-1 rounded text-xs font-semibold">
        {currentIndex + 1} / {photos.length}
      </div>

      {/* Dot Indicators */}
      {photos.length > 1 && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
          {photos.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-white w-6'
                  : 'bg-white bg-opacity-50 hover:bg-opacity-75'
              }`}
              aria-label={`Go to photo ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotoSlideshow;
