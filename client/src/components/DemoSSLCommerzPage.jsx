import React, { useState, useEffect } from 'react';
import { CheckCircle, X, CreditCard, Shield, Clock } from 'lucide-react';

const DemoSSLCommerzPage = () => {
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [amount, setAmount] = useState('0');
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get parameters from URL
    const urlParams = new URLSearchParams(window.location.search);
    setAmount(urlParams.get('amount') || '0');
    setOrderId(urlParams.get('orderId') || '');
  }, []);

  const handlePayment = async (status) => {
    setLoading(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setPaymentStatus(status);
    setLoading(false);

    // Redirect back to main app after a delay
    setTimeout(() => {
      if (status === 'success') {
        // Create a transaction ID for the demo
        const tranId = `SSL_DEMO_${orderId}_${Date.now()}`;
        // Redirect to success with proper parameters
        window.location.href = `/payment/success/${tranId}?status=valid&amount=${amount}&orderId=${orderId}&gateway=sslcommerz&demo=true`;
      } else {
        // Create a transaction ID for the demo failure
        const tranId = `SSL_DEMO_${orderId}_${Date.now()}`;
        // Redirect to failure with proper parameters
        window.location.href = `/payment/failed/${tranId}?reason=Payment%20declined&orderId=${orderId}&gateway=sslcommerz&demo=true`;
      }
    }, 3000);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center py-8">
          <Clock className="h-16 w-16 text-healthcare-green-500 mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Processing Payment...
          </h2>
          <p className="text-gray-600">Please wait while we process your payment.</p>
        </div>
      );
    }

    if (paymentStatus === 'success') {
      return (
        <div className="text-center py-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Payment Successful!
          </h2>
          <p className="text-gray-600 mb-4">
            Your payment of ৳{amount} has been processed successfully.
          </p>
          <p className="text-sm text-gray-500">
            Redirecting you back to the application...
          </p>
        </div>
      );
    }

    if (paymentStatus === 'failed') {
      return (
        <div className="text-center py-8">
          <X className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Payment Failed
          </h2>
          <p className="text-gray-600 mb-4">
            There was an issue processing your payment.
          </p>
          <p className="text-sm text-gray-500">
            Redirecting you back to the application...
          </p>
        </div>
      );
    }

    return (
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <Shield className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            SSLCommerz Payment Gateway
          </h1>
          <p className="text-gray-600">Demo Mode</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Payment Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Order ID:</span>
              <span className="font-medium">{orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-medium text-lg">৳{amount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Currency:</span>
              <span className="font-medium">BDT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method:</span>
              <span className="font-medium">SSLCommerz Gateway</span>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-yellow-800 mb-2">Demo Mode Notice</h4>
          <p className="text-sm text-yellow-700">
            This is a demonstration of the SSLCommerz payment gateway. 
            No real money will be charged. Click below to simulate a payment result.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handlePayment('success')}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center"
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            Simulate Successful Payment
          </button>
          
          <button
            onClick={() => handlePayment('failed')}
            className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center"
          >
            <X className="h-5 w-5 mr-2" />
            Simulate Failed Payment
          </button>

          <button
            onClick={() => window.close()}
            className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel Payment
          </button>
        </div>

        <div className="mt-6 text-xs text-gray-500 text-center">
          <p>This is a demo implementation for testing purposes.</p>
          <p>For production, use real SSLCommerz credentials.</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default DemoSSLCommerzPage;

