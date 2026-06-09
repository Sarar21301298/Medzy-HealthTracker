import React, { useState } from 'react';
import { 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  DollarSign, 
  Search,
  ArrowLeft 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BkashRefund = ({ payment, onSuccess, onError, onCancel }) => {
  const { token } = useAuth();
  const [refundAmount, setRefundAmount] = useState(payment?.amount || 0);
  const [refundReason, setRefundReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [refundStatus, setRefundStatus] = useState(null);

  const handleRefund = async () => {
    if (!refundAmount || refundAmount <= 0) {
      onError?.('Please enter a valid refund amount');
      return;
    }

    if (refundAmount > payment.amount) {
      onError?.('Refund amount cannot exceed the original payment amount');
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch('/api/payments/bkash/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          paymentID: payment.paymentDetails.bkashPaymentID,
          amount: refundAmount,
          trxID: payment.paymentDetails.bkashTransactionID,
          reason: refundReason || 'Customer request'
        })
      });

      const data = await response.json();

      if (data.success) {
        setRefundStatus({
          type: 'success',
          message: 'Refund processed successfully',
          data: data.data
        });
        onSuccess?.(data.data);
      } else {
        onError?.(data.message || 'Refund failed');
      }
    } catch (error) {
      console.error('Refund error:', error);
      onError?.('Failed to process refund. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const checkRefundStatus = async () => {
    try {
      const response = await fetch(
        `/api/payments/bkash/refund-status/${payment.paymentDetails.bkashPaymentID}/${payment.paymentDetails.bkashTransactionID}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (data.success) {
        setRefundStatus({
          type: 'info',
          message: 'Refund status retrieved',
          data: data.data
        });
      } else {
        onError?.(data.message || 'Failed to check refund status');
      }
    } catch (error) {
      console.error('Refund status check error:', error);
      onError?.('Failed to check refund status');
    }
  };

  if (refundStatus?.type === 'success') {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Refund Successful
          </h3>
          
          <p className="text-gray-600 mb-4">
            Your refund has been processed successfully.
          </p>

          <div className="bg-green-50 p-4 rounded-lg mb-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Refund Amount:</span>
                <span className="font-semibold text-green-600">
                  ৳{refundStatus.data.amount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Refund ID:</span>
                <span className="font-mono text-xs">
                  {refundStatus.data.refundTrxID}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onCancel}
            className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Process Refund
        </h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>

      {/* Payment Details */}
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <h4 className="font-semibold text-gray-800 mb-2">Payment Details</h4>
        <div className="space-y-1 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Original Amount:</span>
            <span className="font-semibold">৳{payment.amount}</span>
          </div>
          <div className="flex justify-between">
            <span>Payment ID:</span>
            <span className="font-mono text-xs">
              {payment.paymentDetails.bkashPaymentID}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Transaction ID:</span>
            <span className="font-mono text-xs">
              {payment.paymentDetails.bkashTransactionID}
            </span>
          </div>
        </div>
      </div>

      {/* Refund Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Refund Amount
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="number"
              value={refundAmount}
              onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
              max={payment.amount}
              min={0}
              step="0.01"
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500"
              placeholder="Enter refund amount"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Maximum refundable: ৳{payment.amount}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Refund Reason (Optional)
          </label>
          <textarea
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500"
            placeholder="Enter reason for refund..."
          />
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
            <span className="text-sm font-medium text-yellow-800">
              Important Notice
            </span>
          </div>
          <ul className="mt-1 text-sm text-yellow-700 space-y-1">
            <li>• Refunds are processed immediately</li>
            <li>• Refunded amount will be credited to customer's bKash account</li>
            <li>• This action cannot be undone</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleRefund}
            disabled={isProcessing || !refundAmount}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </div>
            ) : (
              `Refund ৳${refundAmount}`
            )}
          </button>

          <button
            onClick={checkRefundStatus}
            className="bg-healthcare-green-600 hover:bg-healthcare-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Status Display */}
      {refundStatus && refundStatus.type !== 'success' && (
        <div className={`mt-4 p-3 rounded-lg ${
          refundStatus.type === 'error' ? 'bg-red-50 border border-red-200' :
          'bg-healthcare-green-50 border border-healthcare-green-200'
        }`}>
          <p className={`text-sm font-medium ${
            refundStatus.type === 'error' ? 'text-red-800' : 'text-healthcare-green-800'
          }`}>
            {refundStatus.message}
          </p>
          {refundStatus.data && (
            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
              {JSON.stringify(refundStatus.data, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

export default BkashRefund;

