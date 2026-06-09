import React from 'react';
import { AlertTriangle, Smartphone, Clock, Globe } from 'lucide-react';

const LoginConfirmationModal = ({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  existingDevice, 
  loginTime, 
  lastActivity 
}) => {
  if (!isOpen) return null;

  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return 'Unknown';
    }
  };

  const getDeviceInfo = (userAgent) => {
    if (!userAgent) return 'Unknown Device';
    
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      return 'Mobile Device';
    } else if (userAgent.includes('Chrome')) {
      return 'Chrome Browser';
    } else if (userAgent.includes('Firefox')) {
      return 'Firefox Browser';
    } else if (userAgent.includes('Safari')) {
      return 'Safari Browser';
    } else if (userAgent.includes('Edge')) {
      return 'Edge Browser';
    }
    return 'Desktop/Laptop';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-gray-100">
          <div className="bg-amber-100 p-2 rounded-full">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Already Logged In</h3>
            <p className="text-sm text-gray-500">Account access detected on another device</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Smartphone className="h-4 w-4 text-gray-500" />
              <span className="font-medium text-gray-700">Device:</span>
              <span className="text-gray-600">{getDeviceInfo(existingDevice)}</span>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="font-medium text-gray-700">Last Login:</span>
              <span className="text-gray-600">{formatTime(loginTime)}</span>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <Globe className="h-4 w-4 text-gray-500" />
              <span className="font-medium text-gray-700">Last Activity:</span>
              <span className="text-gray-600">{formatTime(lastActivity)}</span>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 mb-1">Security Notice</p>
                <p className="text-amber-700">
                  Continuing will automatically log out the other device for your security.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-gray-100">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-healthcare-green-600 hover:bg-healthcare-green-700 text-white rounded-lg font-medium transition-colors"
          >
            Continue Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginConfirmationModal;

