import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, RefreshCw, Home, ShoppingBag } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

const PaymentStatus = () => {
  const [status, setStatus] = useState('processing');
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { success, error } = useNotification();

  useEffect(() => {
    // Parse URL parameters for payment status
    const urlParams = new URLSearchParams(location.search);
    const transId = urlParams.get('tran_id');
    const paymentStatus = urlParams.get('status');
    const gateway = urlParams.get('gateway');

    console.log('Payment status page loaded:', {
      transId,
      paymentStatus,
      gateway,
      fullUrl: window.location.href
    });

    if (transId) {
      // Verify payment status with backend
      verifyPaymentStatus(transId, gateway);
    } else {
      // No transaction ID, check for other status indicators
      if (paymentStatus === 'success') {
        setStatus('success');
        setPaymentData({
          message: 'Payment completed successfully!',
          transactionId: 'N/A',
          gateway: gateway || 'Unknown'
        });
      } else if (paymentStatus === 'failed') {
        setStatus('failed');
        setPaymentData({
          message: 'Payment failed. Please try again.',
          gateway: gateway || 'Unknown'
        });
      } else if (paymentStatus === 'cancelled') {
        setStatus('cancelled');
        setPaymentData({
          message: 'Payment was cancelled.',
          gateway: gateway || 'Unknown'
        });
      } else {
        setStatus('unknown');
        setPaymentData({
          message: 'Payment status unknown. Please contact support.',
          gateway: gateway || 'Unknown'
        });
      }
      setLoading(false);
    }
  }, [location]);

  const verifyPaymentStatus = async (transactionId, gateway) => {
    try {
      setLoading(true);
      console.log('Verifying payment status:', { transactionId, gateway });

      const response = await fetch(`/api/payments/verify/${transactionId}?gateway=${gateway}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Payment verification response:', data);

        setPaymentData(data);
        
        if (data.status === 'VALID' || data.status === 'success' || data.success) {
          setStatus('success');
          success('Payment verified successfully!');
        } else if (data.status === 'FAILED' || data.status === 'failed') {
          setStatus('failed');
          error('Payment verification failed');
        } else if (data.status === 'CANCELLED' || data.status === 'cancelled') {
          setStatus('cancelled');
        } else {
          setStatus('unknown');
        }
      } else {
        console.error('Failed to verify payment');
        setStatus('failed');
        setPaymentData({
          message: 'Failed to verify payment status',
          transactionId,
          gateway
        });
      }
    } catch (err) {
      console.error('Error verifying payment:', err);
      setStatus('failed');
      setPaymentData({
        message: 'Error verifying payment status',
        transactionId,
        gateway
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'failed':
        return <XCircle className="h-16 w-16 text-red-500" />;
      case 'cancelled':
        return <XCircle className="h-16 w-16 text-yellow-500" />;
      case 'processing':
        return <Clock className="h-16 w-16 text-healthcare-green-500 animate-pulse" />;
      default:
        return <RefreshCw className="h-16 w-16 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'failed':
        return 'text-red-600 dark:text-red-400';
      case 'cancelled':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'processing':
        return 'text-healthcare-green-600 dark:text-healthcare-green-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'success':
        return 'Payment Successful!';
      case 'failed':
        return 'Payment Failed';
      case 'cancelled':
        return 'Payment Cancelled';
      case 'processing':
        return 'Processing Payment...';
      default:
        return 'Payment Status Unknown';
    }
  };

  const getStatusDescription = () => {
    switch (status) {
      case 'success':
        return 'Your payment has been processed successfully. Your order has been confirmed.';
      case 'failed':
        return 'Your payment could not be processed. Please try again or contact support.';
      case 'cancelled':
        return 'You cancelled the payment process. You can try again anytime.';
      case 'processing':
        return 'We are verifying your payment. Please wait...';
      default:
        return 'We could not determine your payment status. Please contact support.';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <RefreshCw className="h-16 w-16 text-healthcare-green-500 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Verifying Payment
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please wait while we verify your payment status...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        {/* Status Icon */}
        <div className="flex justify-center mb-6">
          {getStatusIcon()}
        </div>

        {/* Status Title */}
        <h2 className={`text-2xl font-bold mb-4 ${getStatusColor()}`}>
          {getStatusTitle()}
        </h2>

        {/* Status Description */}
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {getStatusDescription()}
        </p>

        {/* Payment Details */}
        {paymentData && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Payment Details</h3>
            
            {paymentData.transactionId && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Transaction ID:</span>
                <span className="text-sm font-mono text-gray-900 dark:text-white">
                  {paymentData.transactionId}
                </span>
              </div>
            )}

            {paymentData.gateway && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Payment Method:</span>
                <span className="text-sm text-gray-900 dark:text-white capitalize">
                  {paymentData.gateway}
                </span>
              </div>
            )}

            {paymentData.amount && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Amount:</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  ৳{paymentData.amount}
                </span>
              </div>
            )}

            {paymentData.message && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {paymentData.message}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {status === 'success' && (
            <button
              onClick={() => navigate('/customer-dashboard')}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <ShoppingBag className="h-5 w-5" />
              <span>View My Orders</span>
            </button>
          )}

          {(status === 'failed' || status === 'cancelled') && (
            <button
              onClick={() => navigate('/')}
              className="w-full bg-healthcare-green-600 hover:bg-healthcare-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <RefreshCw className="h-5 w-5" />
              <span>Try Again</span>
            </button>
          )}

          <button
            onClick={() => navigate('/')}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <Home className="h-5 w-5" />
            <span>Back to Home</span>
          </button>
        </div>

        {/* Support Link */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Having issues?{' '}
            <button
              onClick={() => navigate('/support')}
              className="text-healthcare-green-600 dark:text-healthcare-green-400 hover:underline"
            >
              Contact Support
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentStatus;

