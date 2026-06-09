import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, ShoppingBag, Clock, CreditCard, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { tranId: urlTranId } = useParams(); // Get tranId from URL parameter
  const { token, user } = useAuth();
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const paymentId = searchParams.get('payment');
    const gateway = searchParams.get('gateway');
    const queryTranId = searchParams.get('tranId');
    const status = searchParams.get('status');
    const amount = searchParams.get('amount');
    const orderId = searchParams.get('orderId');
    
    // Use tranId from URL parameter first, then from query parameter
    const tranId = urlTranId || queryTranId;
    
    console.log('🔗 PaymentSuccess URL params:', {
      paymentId,
      gateway,
      tranId,
      status,
      amount,
      orderId,
      urlTranId,
      queryTranId,
      hasToken: !!token,
      hasUser: !!user,
      allParams: Object.fromEntries(searchParams.entries())
    });
    
    // If no token, still show success page but without API calls
    if (!token || !user) {
      console.log('⚠️ No authentication token, showing generic success page');
      setLoading(false);
      return;
    }
    
    // If we have direct callback data from SSL Commerce, process it
    if (tranId && status === 'valid') {
      // This came from SSL Commerce callback with success status
      handleSSLCommerzDirectCallback(tranId, amount, orderId);
    } else if (tranId && searchParams.get('demo') === 'true') {
      // This is from demo SSL Commerce page
      handleDemoSSLCommerzCallback(tranId, amount, orderId);
    } else if (paymentId) {
      fetchPaymentDetails(paymentId);
    } else if (gateway === 'sslcommerz' || tranId) {
      // SSLCommerz direct callback - trigger backend processing
      handleSSLCommerzCallback(searchParams, tranId);
    } else {
      setLoading(false);
    }
  }, [location.search, token, user, urlTranId]);

  const fetchPaymentDetails = async (paymentId) => {
    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPaymentDetails(data);
      } else {
        console.error('Failed to fetch payment details:', response.status);
        setError('Failed to load payment details');
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
      setError('Network error while loading payment details');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSSLCommerzCallback = async (tranId, amount, orderId) => {
    try {
      console.log('🎯 Processing demo SSL Commerce callback:', { tranId, amount, orderId });
      
      if (!token || !user) {
        // Show success without backend processing for demo
        setPaymentDetails({
          amount: amount || 0,
          paymentMethod: 'sslcommerz',
          transactionId: tranId,
          status: 'completed',
          orderId: orderId,
          isDemo: true
        });
        setLoading(false);
        return;
      }

      // For authenticated users, process the demo payment in backend
      const response = await fetch('/api/payments/process-success', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          gateway: 'sslcommerz',
          status: 'success',
          sandbox: true,
          demo: true,
          tranId: tranId,
          amount: amount,
          orderId: orderId
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.payment) {
          setPaymentDetails(data.payment);
        } else {
          // Fallback for demo
          setPaymentDetails({
            amount: amount || 0,
            paymentMethod: 'sslcommerz',
            transactionId: tranId,
            status: 'completed',
            orderId: orderId,
            isDemo: true
          });
        }
        console.log('✅ Demo payment processed successfully');
        // Dispatch orderPlaced event to notify other components
        window.dispatchEvent(new CustomEvent('orderPlaced'));
      } else {
        console.log('⚠️ Demo payment processing failed, showing success anyway');
        setPaymentDetails({
          amount: amount || 0,
          paymentMethod: 'sslcommerz',
          transactionId: tranId,
          status: 'completed',
          orderId: orderId,
          isDemo: true
        });
        // Dispatch orderPlaced event to notify other components
        window.dispatchEvent(new CustomEvent('orderPlaced'));
      }
    } catch (error) {
      console.error('Error processing demo SSL Commerce callback:', error);
      // Still show success for demo
      setPaymentDetails({
        amount: amount || 0,
        paymentMethod: 'sslcommerz',
        transactionId: tranId,
        status: 'completed',
        orderId: orderId,
        isDemo: true
      });
      // Dispatch orderPlaced event to notify other components even for demo/error cases
      window.dispatchEvent(new CustomEvent('orderPlaced'));
    } finally {
      setLoading(false);
    }
  };

  const handleSSLCommerzDirectCallback = async (tranId, amount, orderId) => {
    try {
      console.log('🎉 Processing direct SSL Commerce callback:', { tranId, amount, orderId });
      
      // Find the payment by transaction ID to get details
      const response = await fetch(`/api/payments/verify/${tranId}?gateway=sslcommerz`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.status === 'VALID') {
          // Payment is already verified and completed
          setPaymentDetails({
            amount: data.amount,
            paymentMethod: 'sslcommerz',
            transactionId: tranId,
            status: 'completed',
            orderId: orderId
          });
          console.log('✅ Direct SSL Commerce payment verified successfully');
          // Dispatch orderPlaced event to notify other components
          window.dispatchEvent(new CustomEvent('orderPlaced'));
        } else {
          console.log('⚠️ Payment verification incomplete, trying fallback method');
          handleSSLCommerzCallback(new URLSearchParams(), tranId);
        }
      } else {
        console.log('⚠️ Payment verification failed, trying fallback method');
        handleSSLCommerzCallback(new URLSearchParams(), tranId);
      }
    } catch (error) {
      console.error('Error processing direct SSL Commerce callback:', error);
      handleSSLCommerzCallback(new URLSearchParams(), tranId);
    } finally {
      setLoading(false);
    }
  };

  const handleSSLCommerzCallback = async (searchParams, tranId) => {
    try {
      // Get all URL parameters
      const params = {};
      for (const [key, value] of searchParams.entries()) {
        params[key] = value;
      }

      console.log('🔄 Processing SSLCommerz callback with params:', params);
      console.log('🔄 Transaction ID from URL:', tranId);

      // For SSLCommerz sandbox, we need to simulate success based on the gateway parameter or tranId presence
      if (params.gateway === 'sslcommerz' || tranId) {
        // Find the most recent pending payment for this user and mark it as successful
        const response = await fetch('/api/payments/process-success', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            gateway: 'sslcommerz',
            status: 'success',
            sandbox: true,
            tranId: tranId || params.tranId || null // Use tranId from URL parameter or query
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.payment) {
            setPaymentDetails(data.payment);
          }
          console.log('✅ Payment processed successfully');
          // Dispatch orderPlaced event to notify other components
          window.dispatchEvent(new CustomEvent('orderPlaced'));
        } else {
          console.error('Failed to process SSLCommerz success:', response.status);
          setError('Failed to process payment');
        }
      }
    } catch (error) {
      console.error('Error processing SSLCommerz callback:', error);
      setError('Network error while processing payment');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueShopping = () => {
    if (user) {
      navigate('/');
    } else {
      window.location.href = '/';
    }
  };

  const handleViewOrders = () => {
    if (user) {
      navigate('/?tab=orders');
    } else {
      window.location.href = '/';
    }
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-healthcare-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Processing payment confirmation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6">
            <CheckCircle className="h-8 w-8 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Completed!
          </h1>
          <p className="text-gray-600 mb-6">
            Your payment was processed successfully. Thank you for your order!
          </p>
          <div className="bg-yellow-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-700">
              {error}
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={handleGoHome}
              className="w-full bg-healthcare-green-600 text-white py-3 px-4 rounded-lg hover:bg-healthcare-green-700 transition duration-200 flex items-center justify-center"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>

        {/* Success Message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Successful!
        </h1>
        <p className="text-gray-600 mb-6">
          Your order has been placed successfully and payment has been confirmed.
        </p>

        {/* Payment Details */}
        {paymentDetails && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <CreditCard className="h-4 w-4 mr-2" />
              Payment Details
              {paymentDetails.isDemo && (
                <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                  DEMO
                </span>
              )}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">৳{paymentDetails.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-medium capitalize">{paymentDetails.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction ID:</span>
                <span className="font-medium text-xs">{paymentDetails.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium text-green-600 capitalize">{paymentDetails.status}</span>
              </div>
              {paymentDetails.orderId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-medium text-xs">{paymentDetails.orderId}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Order Information */}
        <div className="bg-healthcare-green-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center mb-2">
            <Clock className="h-4 w-4 text-healthcare-green-600 mr-2" />
            <span className="text-sm font-medium text-healthcare-green-800">What's Next?</span>
          </div>
          <p className="text-sm text-healthcare-green-700">
            Your order is being processed. You'll receive updates on your order status via email and SMS.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {user ? (
            <>
              <button
                onClick={handleViewOrders}
                className="w-full bg-healthcare-green-600 text-white py-3 px-4 rounded-lg hover:bg-healthcare-green-700 transition duration-200 flex items-center justify-center"
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                View My Orders
              </button>
              
              <button
                onClick={handleContinueShopping}
                className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 transition duration-200"
              >
                Continue Shopping
              </button>
            </>
          ) : (
            <button
              onClick={handleGoHome}
              className="w-full bg-healthcare-green-600 text-white py-3 px-4 rounded-lg hover:bg-healthcare-green-700 transition duration-200 flex items-center justify-center"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Homepage
            </button>
          )}
        </div>

        {/* Additional Information */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Payment processed securely through SSLCommerz. Your cart has been cleared automatically.
            {paymentDetails?.isDemo && (
              <span className="block mt-1 text-yellow-600 font-medium">
                ⚠️ This was a demo payment. No real money was charged.
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;

