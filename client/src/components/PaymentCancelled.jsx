import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Ban, ShoppingCart, RotateCcw } from 'lucide-react';

const PaymentCancelled = () => {
  const { tranId: routeTranId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Get tranId from either route param or query param (for backward compatibility)
  const tranId = routeTranId || searchParams.get('tranId');
  const gateway = searchParams.get('gateway') || 'sslcommerz';
  
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPaymentInfo = async () => {
      if (!tranId) return;

      setLoading(true);
      try {
        const response = await fetch(`/api/payments/${tranId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setPaymentInfo(data);
        }
      } catch (err) {
        console.error('Error fetching payment info:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentInfo();
  }, [tranId]);

  const handleRetryPayment = () => {
    navigate('/cart');
  };

  const handleContinueShopping = () => {
    navigate('/medicines');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        {/* Cancelled Icon */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6">
          <Ban className="h-8 w-8 text-yellow-600" />
        </div>

        {/* Cancelled Message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Cancelled
        </h1>
        <p className="text-gray-600 mb-6">
          You have cancelled the payment process. No amount has been charged.
        </p>

        {/* Information */}
        <div className="bg-yellow-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-yellow-800 mb-2">What happened?</h3>
          <p className="text-sm text-yellow-700">
            The payment was cancelled before completion. Your cart items are still saved and you can try again whenever you're ready.
          </p>
          {tranId && (
            <p className="text-xs text-yellow-600 mt-2">
              Transaction ID: {tranId}
            </p>
          )}
        </div>

        {/* Payment Details */}
        {paymentInfo && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">Payment Details:</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p><span className="font-medium">Amount:</span> ৳{paymentInfo.amount}</p>
              <p><span className="font-medium">Gateway:</span> {gateway}</p>
              <p><span className="font-medium">Status:</span> 
                <span className="text-yellow-600 font-medium ml-1">Cancelled</span>
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleRetryPayment}
            className="w-full bg-healthcare-green-600 text-white py-3 px-4 rounded-lg hover:bg-healthcare-green-700 transition duration-200 flex items-center justify-center"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Complete Your Order
          </button>
          
          <button
            onClick={handleContinueShopping}
            className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 transition duration-200 flex items-center justify-center"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Continue Shopping
          </button>
        </div>

        {/* Additional Information */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Your cart items are still saved. You can continue shopping or complete your order at any time.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancelled;

