import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Smartphone, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Shield,
  DollarSign,
  RefreshCw,
  X,
  ExternalLink,
  Banknote,
  TestTube
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const EnhancedPaymentGateway = ({ 
  orderData, 
  onSuccess, 
  onCancel, 
  onError 
}) => {
  const [selectedMethod, setSelectedMethod] = useState('');
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [paymentUrl, setPaymentUrl] = useState('');
  const [paymentData, setPaymentData] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const { user, getAuthHeaders } = useAuth();
  const { success, error } = useNotification();

  const paymentMethods = [
    {
      id: 'cash_on_delivery',
      name: 'Cash on Delivery',
      icon: <Banknote className="h-6 w-6 text-green-500" />,
      description: 'Pay when you receive your order',
      processingFee: 0,
      type: 'local',
      color: 'bg-green-50 border-green-200 hover:bg-green-100'
    },
    {
      id: 'sslcommerz',
      name: 'SSLCommerz',
      icon: <Shield className="h-6 w-6 text-healthcare-green-500" />,
      description: 'All major payment methods (Cards, Mobile Banking, etc.)',
      processingFee: 2.5,
      type: 'production',
      color: 'bg-healthcare-green-50 border-healthcare-green-200 hover:bg-healthcare-green-100'
    }
  ];

  const calculateTotal = (method) => {
    const baseAmount = orderData.totalAmount || 0;
    const fee = (baseAmount * method.processingFee) / 100;
    return baseAmount + fee;
  };

  const initiatePayment = async () => {
    if (!selectedMethod) {
      error('Please select a payment method');
      return;
    }

    setProcessing(true);
    setPaymentStatus('processing');

    try {
      if (selectedMethod === 'cash_on_delivery') {
        // Handle Cash on Delivery - no payment processing needed
        setPaymentStatus('success');
        success('Order placed successfully! You will pay upon delivery.');
        onSuccess && onSuccess({
          paymentMethod: 'cash_on_delivery',
          amount: calculateTotal(paymentMethods.find(m => m.id === selectedMethod)),
          status: 'confirmed'
        });
        return;
      }

      // For SSLCommerz - use the unified payment endpoint
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          gateway: selectedMethod,
          amount: calculateTotal(paymentMethods.find(m => m.id === selectedMethod)),
          currency: 'BDT',
          customerName: `${user.firstName} ${user.lastName}`,
          itemCount: orderData.itemCount || 1
        })
      });

      const result = await response.json();

      if (result.success) {
        setPaymentData(result.data);
        
        if (result.data.redirectUrl) {
          setPaymentUrl(result.data.redirectUrl);
          // Open payment URL in popup for SSLCommerz
          const popup = window.open(result.data.redirectUrl, 'sslcommerz_payment', 'width=800,height=600,scrollbars=yes,resizable=yes');
          success('Payment initiated. Complete payment in the popup window.');
          setPaymentStatus('awaiting_completion');
        }
      } else {
        throw new Error(result.message || 'Payment initiation failed');
      }
    } catch (err) {
      console.error('Payment initiation error:', err);
      error(err.message || 'Failed to initiate payment');
      setPaymentStatus('failed');
      onError && onError(err);
    } finally {
      setProcessing(false);
    }
  };

  const verifyPayment = async () => {
    if (!paymentData) return;

    setProcessing(true);

    try {
      // For SSLCommerz, check if payment is completed
      const response = await fetch(`/api/payments/${paymentData.paymentId || paymentData.sessionkey}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });

      const result = await response.json();

      if (result.success && result.payment?.status === 'completed') {
        setPaymentStatus('success');
        success('Payment completed successfully!');
        onSuccess && onSuccess(result.payment);
      } else {
        error('Payment not yet completed. Please complete payment first.');
      }
    } catch (err) {
      console.error('Payment verification error:', err);
      error(err.message || 'Failed to verify payment');
    } finally {
      setProcessing(false);
    }
  };

  const renderPaymentStatus = () => {
    switch (paymentStatus) {
      case 'processing':
        return (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-healthcare-green-500 mx-auto mb-4 animate-pulse" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Processing Payment
            </h3>
            <p className="text-gray-600">
              Please wait while we initiate your payment...
            </p>
          </div>
        );
      
      case 'awaiting_completion':
        return (
          <div className="text-center py-8">
            <ExternalLink className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Complete Payment
            </h3>
            <p className="text-gray-600 mb-4">
              Please complete your payment in the opened popup window.
            </p>
            {paymentUrl && (
              <div className="space-y-3">
                <a
                  href={paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-healthcare-green-600 text-white rounded-lg hover:bg-healthcare-green-700 transition-colors"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Payment Page
                </a>
                <div className="text-sm text-gray-500">
                  After completing payment, the page will redirect automatically
                </div>
              </div>
            )}
            <button
              onClick={verifyPayment}
              disabled={processing}
              className="mt-4 w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {processing ? (
                <RefreshCw className="h-4 w-4 animate-spin mx-auto" />
              ) : (
                'Check Payment Status'
              )}
            </button>
          </div>
        );
      
      case 'success':
        return (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Payment Successful!
            </h3>
            <p className="text-gray-600">
              Your payment has been processed successfully.
            </p>
          </div>
        );
      
      case 'failed':
        return (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Payment Failed
            </h3>
            <p className="text-gray-600 mb-4">
              There was an issue processing your payment.
            </p>
            <button
              onClick={() => {
                setPaymentStatus('pending');
                setSelectedMethod('');
                setPaymentData(null);
                setPaymentUrl('');
              }}
              className="bg-healthcare-green-600 text-white py-2 px-4 rounded-lg hover:bg-healthcare-green-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (paymentStatus !== 'pending') {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Payment Status
          </h2>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </div>
        {renderPaymentStatus()}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          Choose Payment Method
        </h2>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Order Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-900 mb-2">Order Summary</h3>
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Subtotal:</span>
          <span>৳{orderData.totalAmount?.toFixed(2)}</span>
        </div>
        {selectedMethod && (
          <>
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Processing Fee ({paymentMethods.find(m => m.id === selectedMethod)?.processingFee}%):</span>
              <span>৳{((orderData.totalAmount * paymentMethods.find(m => m.id === selectedMethod)?.processingFee) / 100).toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between font-semibold text-gray-900">
                <span>Total:</span>
                <span>৳{calculateTotal(paymentMethods.find(m => m.id === selectedMethod)).toFixed(2)}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Payment Methods */}
      <div className="space-y-3 mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Payment Methods</h3>
        
        <div className="space-y-2">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedMethod === method.id
                  ? 'border-healthcare-green-500 bg-healthcare-green-50'
                  : method.color
              }`}
              onClick={() => setSelectedMethod(method.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {method.icon}
                  <div>
                    <div className="font-medium text-gray-900 flex items-center">
                      {method.name}
                      {method.type === 'local' && (
                        <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                          No Fees
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">{method.description}</div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {method.processingFee > 0 ? `${method.processingFee}% fee` : 'Free'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Button */}
      <button
        onClick={initiatePayment}
        disabled={!selectedMethod || processing}
        className="w-full bg-healthcare-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-healthcare-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
      >
        {processing ? (
          <RefreshCw className="h-5 w-5 animate-spin mr-2" />
        ) : (
          <DollarSign className="h-5 w-5 mr-2" />
        )}
        {processing ? 'Processing...' : `Pay ${selectedMethod ? '৳' + calculateTotal(paymentMethods.find(m => m.id === selectedMethod)).toFixed(2) : ''}`}
      </button>

      {/* Security Notice */}
      <div className="mt-4 flex items-center text-sm text-gray-500">
        <Shield className="h-4 w-4 mr-2" />
        Your payment information is encrypted and secure
      </div>
    </div>
  );
};

export default EnhancedPaymentGateway;

