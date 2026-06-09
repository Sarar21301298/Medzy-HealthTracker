import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'medium',
  showCloseButton = true,
  closable = true 
}) => {
  if (!isOpen) return null;

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'max-w-md';
      case 'large':
        return 'max-w-4xl';
      case 'xlarge':
        return 'max-w-6xl';
      case 'full':
        return 'max-w-screen-lg';
      default:
        return 'max-w-lg';
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && closable) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div 
        className={`
          bg-white dark:bg-gray-800 rounded-xl ${getSizeClasses()} w-full max-h-[90vh] overflow-hidden
          transform transition-all duration-300 ease-in-out animate-scale-in
          shadow-2xl border border-gray-200 dark:border-gray-700
        `}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-800">
            {title && (
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
            )}
            {showCloseButton && closable && (
              <button
                onClick={onClose}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-theme(spacing.24))]">
          {children}
        </div>
      </div>
    </div>
  );
};

// Specialized modals
export const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning'
}) => {
  const getButtonColors = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white';
      default:
        return 'bg-healthcare-green-600 hover:bg-healthcare-green-700 text-white';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="small">
      <div className="p-6">
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${getButtonColors()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export const InfoModal = ({ 
  isOpen, 
  onClose, 
  title, 
  message,
  buttonText = 'OK'
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="small">
    <div className="p-6">
      <p className="text-gray-600 mb-6">{message}</p>
      <div className="flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-healthcare-green-600 hover:bg-healthcare-green-700 text-white rounded-lg transition-colors font-medium"
        >
          {buttonText}
        </button>
      </div>
    </div>
  </Modal>
);

export default Modal;

