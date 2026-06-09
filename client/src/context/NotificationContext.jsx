import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  const showNotification = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    const notification = { id, message, type, duration };
    
    setNotifications(prev => [...prev, notification]);
    
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
    
    return id;
  }, []);

  const showConfirm = useCallback((title, message, options = {}) => {
    return new Promise((resolve) => {
      setConfirmDialog({
        title,
        message,
        onConfirm: () => {
          setConfirmDialog(null);
          resolve(true);
        },
        onCancel: () => {
          setConfirmDialog(null);
          resolve(false);
        },
        confirmText: options.confirmText || 'Yes',
        cancelText: options.cancelText || 'Cancel',
        type: options.type || 'warning'
      });
    });
  }, []);

  const success = useCallback((message, duration) => showNotification(message, 'success', duration), [showNotification]);
  const error = useCallback((message, duration) => showNotification(message, 'error', duration), [showNotification]);
  const warning = useCallback((message, duration) => showNotification(message, 'warning', duration), [showNotification]);
  const info = useCallback((message, duration) => showNotification(message, 'info', duration), [showNotification]);

  const value = useMemo(() => ({
    showNotification,
    success,
    error,
    warning,
    info,
    showConfirm,
    removeNotification
  }), [showNotification, success, error, warning, info, showConfirm, removeNotification]);

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5" />;
      case 'error':
        return <XCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getColors = (type) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getIconColors = (type) => {
    switch (type) {
      case 'success':
        return 'text-emerald-600';
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-amber-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`${getColors(notification.type)} border rounded-lg p-4 shadow-lg max-w-sm transform transition-all duration-300 ease-in-out animate-slide-in-right`}
          >
            <div className="flex items-start space-x-3">
              <div className={`flex-shrink-0 ${getIconColors(notification.type)}`}>
                {getIcon(notification.type)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{notification.message}</p>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 transform transition-all duration-300 ease-in-out animate-scale-in shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className={`flex-shrink-0 ${getIconColors(confirmDialog.type)}`}>
                {getIcon(confirmDialog.type)}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{confirmDialog.title}</h3>
            </div>
            
            <p className="text-gray-600 mb-6">{confirmDialog.message}</p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={confirmDialog.onCancel}
                className="px-4 py-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
              >
                {confirmDialog.cancelText}
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  confirmDialog.type === 'error' 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};
