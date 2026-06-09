import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const BkashPayment = ({ orderId, amount, onSuccess, onError, onCancel }) => {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [paymentWindow, setPaymentWindow] = useState(null);

  const createPayment = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/payments/bkash/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId,
          amount
        })
      });

      const data = await response.json();

      if (data.success) {
        setPaymentData(data.data);
        // Open bKash payment window
        openPaymentWindow(data.data.bkashURL);
      } else {
        onError?.(data.message || 'Failed to create payment');
      }
    } catch (error) {
      console.error('Payment creation error:', error);
      onError?.('Failed to create payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const openPaymentWindow = (url) => {
    const popup = window.open(
      url,
      'bkash_payment',
      'width=400,height=600,scrollbars=yes,resizable=yes'
    );
    
    setPaymentWindow(popup);

    // Listen for window close
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        setPaymentWindow(null);
        // Check payment status when window closes
        checkPaymentStatus();
      }
    }, 1000);
  };

  const checkPaymentStatus = async () => {
    if (!paymentData?.bkashPaymentID) return;

    try {
      const response = await fetch(`/api/payments/bkash/status/${paymentData.bkashPaymentID}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        const status = data.data.localStatus;
        
        if (status === 'completed') {
          onSuccess?.(data.data);
        } else if (status === 'failed') {
          onError?.('Payment failed. Please try again.');
        } else {
          // Payment still pending, might need manual verification
          onError?.('Payment status unclear. Please contact support if payment was completed.');
        }
      }
    } catch (error) {
      console.error('Payment status check error:', error);
      onError?.('Failed to verify payment status.');
    }
  };

  const executePayment = async (paymentID) => {
    try {
      const response = await fetch('/api/payments/bkash/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ paymentID })
      });

      const data = await response.json();

      if (data.success) {
        onSuccess?.(data.data);
      } else {
        onError?.(data.message || 'Payment execution failed');
      }
    } catch (error) {
      console.error('Payment execution error:', error);
      onError?.('Failed to execute payment');
    }
  };

  // Listen for messages from payment window
  useEffect(() => {
    const handleMessage = (event) => {
      // Verify origin for security
      if (event.origin !== window.location.origin) return;

      const { type, paymentID, status } = event.data;

      if (type === 'BKASH_PAYMENT_SUCCESS' && paymentID) {
        if (paymentWindow) {
          paymentWindow.close();
          setPaymentWindow(null);
        }
        executePayment(paymentID);
      } else if (type === 'BKASH_PAYMENT_FAILED') {
        if (paymentWindow) {
          paymentWindow.close();
          setPaymentWindow(null);
        }
        onError?.('Payment failed or was cancelled');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [paymentWindow]);

  const handleCancel = () => {
    if (paymentWindow) {
      paymentWindow.close();
      setPaymentWindow(null);
    }
    onCancel?.();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="text-center">
        <div className="mb-4">
          <img 
            src="https://download.logo.wine/logo/BKash/BKash-Logo.wine.png" 
            alt="bKash" 
            className="h-12 mx-auto"
          />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Pay with bKash
        </h3>
        
        <div className="bg-pink-50 p-3 rounded-lg mb-4">
          <p className="text-sm text-gray-600">Amount to Pay:</p>
          <p className="text-2xl font-bold text-pink-600">
            ৳{amount?.toLocaleString()}
          </p>
        </div>

        {!paymentData ? (
          <button
            onClick={createPayment}
            disabled={isLoading}
            className="w-full bg-pink-500 hover:bg-pink-600 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Creating Payment...
              </div>
            ) : (
              'Pay Now'
            )}
          </button>
        ) : (
          <div className="space-y-3">
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-green-600">
                Payment session created successfully!
              </p>
            </div>
            
            <button
              onClick={() => openPaymentWindow(paymentData.bkashURL)}
              className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Open bKash Payment
            </button>
            
            <button
              onClick={handleCancel}
              className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
            >
              Cancel Payment
            </button>
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500">
          <p>Secure payment powered by bKash</p>
          <p>Your payment information is encrypted and secure</p>
        </div>
      </div>
    </div>
  );
};

export default BkashPayment;

