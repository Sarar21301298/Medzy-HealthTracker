import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { XCircle, RefreshCw, ShoppingCart, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PaymentFailed = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { tranId: urlTranId } = useParams(); // Get tranId from URL parameter
  const { token } = useAuth();
  const [failureReason, setFailureReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const reason = searchParams.get('reason') || searchParams.get('error');
    const gateway = searchParams.get('gateway');
    const queryTranId = searchParams.get('tranId');
    const orderId = searchParams.get('orderId');
    const isDemo = searchParams.get('demo') === 'true';
    
    // Use tranId from URL parameter first, then from query parameter
    const tranId = urlTranId || queryTranId;
    
    console.log('🔗 PaymentFailed URL params:', {
      reason,
      gateway,
      tranId,
      orderId,
      isDemo,
      urlTranId,
      queryTranId
    });
    
    if (isDemo) {
      // Handle demo failure - just show the failure message
      console.log('🎯 Demo SSL Commerce failure detected');
      setFailureReason(reason || 'Demo payment failed');
    } else if (gateway === 'sslcommerz' || tranId) {
      // Handle real SSLCommerz failure
      handleSSLCommerzFailure(tranId, reason);
    }
    
    setFailureReason(reason || 'Payment was declined or cancelled');
  }, [location.search, urlTranId]);

  const handleSSLCommerzFailure = async (tranId, reason) => {
    try {
      setLoading(true);
      console.log('🔄 Processing SSLCommerz failure callback:', { tranId, reason });

      if (token) {
        const response = await fetch('/api/payments/process-failure', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            gateway: 'sslcommerz',
            status: 'failed',
            sandbox: true,
            tranId: tranId || null, // Include transaction ID if available
            reason: reason || 'Payment failed'
          })
        });

        if (response.ok) {
          console.log('✅ SSLCommerz failure processed');
        } else {
          console.error('Failed to process SSLCommerz failure');
        }
      } else {
        console.log('⚠️ No auth token, skipping backend failure processing');
      }
    } catch (error) {
      console.error('Error processing SSLCommerz failure:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetryPayment = () => {
    navigate('/cart');
  };

  const handleContinueShopping = () => {
    navigate('/medicines');
  };

  const getErrorMessage = (reason) => {
    switch (reason) {
      case 'payment_not_found':
        return 'Payment record not found. Please try again.';
      case 'invalid_status':
        return 'Payment was not completed successfully.';
      case 'callback_error':
        return 'There was an error processing your payment.';
      default:
        return reason || 'Payment could not be completed.';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        {/* Failure Icon */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
          <XCircle className="h-8 w-8 text-red-600" />
        </div>

        {/* Failure Message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Failed
        </h1>
        <p className="text-gray-600 mb-6">
          Unfortunately, your payment could not be processed at this time.
        </p>

        {/* Error Details */}
        <div className="bg-red-50 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            <div className="text-left">
              <h3 className="font-medium text-red-800 mb-1">Error Details</h3>
              <p className="text-sm text-red-700">
                {getErrorMessage(failureReason)}
              </p>
            </div>
          </div>
        </div>

        {/* What to do next */}
        <div className="bg-yellow-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-yellow-800 mb-2">What can you do?</h3>
          <ul className="text-sm text-yellow-700 text-left space-y-1">
            <li>• Check your account balance or card details</li>
            <li>• Try a different payment method</li>
            <li>• Contact your bank if the issue persists</li>
            <li>• Retry the payment after some time</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleRetryPayment}
            className="w-full bg-healthcare-green-600 text-white py-3 px-4 rounded-lg hover:bg-healthcare-green-700 transition duration-200 flex items-center justify-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </button>
          
          <button
            onClick={handleContinueShopping}
            className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 transition duration-200 flex items-center justify-center"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Continue Shopping
          </button>
        </div>

        {/* Support Information */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">
            Need help? Contact our support team
          </p>
          <p className="text-xs text-healthcare-green-600">
            Email: support@medzy.com | Phone: +880-1234-567890
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed;

