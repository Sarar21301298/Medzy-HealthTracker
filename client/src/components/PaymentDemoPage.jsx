import React, { useState } from 'react';
import { CreditCard, ShoppingCart, Package, CheckCircle } from 'lucide-react';
import EnhancedPaymentGateway from './EnhancedPaymentGateway';
import { useNotification } from '../context/NotificationContext';

const PaymentDemoPage = () => {
  const [currentStep, setCurrentStep] = useState('order'); // order, payment, success
  const [demoOrder, setDemoOrder] = useState({
    _id: '6748a8f123456789abcdef01',
    orderNumber: 'ORD-2024-001',
    totalAmount: 1250.00,
    items: [
      { name: 'Paracetamol 500mg (10 tablets)', price: 25.00, quantity: 2 },
      { name: 'Vitamin D3 1000IU (30 tablets)', price: 450.00, quantity: 1 },
      { name: 'Omeprazole 20mg (14 capsules)', price: 350.00, quantity: 2 }
    ],
    customer: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+880171234567',
      address: 'House 123, Road 15, Dhanmondi, Dhaka-1205'
    }
  });
  const [paymentResult, setPaymentResult] = useState(null);
  const { success, error } = useNotification();

  const handlePaymentSuccess = (data) => {
    setPaymentResult(data);
    setCurrentStep('success');
    success('Payment completed successfully!');
  };

  const handlePaymentError = (err) => {
    error('Payment failed: ' + (err.message || 'Unknown error'));
  };

  const handlePaymentCancel = () => {
    setCurrentStep('order');
  };

  const renderOrderStep = () => (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-6">
        <ShoppingCart className="h-8 w-8 text-healthcare-green-600 mr-3" />
        <h1 className="text-2xl font-bold text-gray-900">
          Payment Gateway Demo
        </h1>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Order Summary
        </h2>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="font-medium">Order #{demoOrder.orderNumber}</span>
            <span className="text-sm text-gray-500">Demo Order</span>
          </div>
          
          <div className="space-y-2 mb-4">
            {demoOrder.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-700">
                  {item.name} × {item.quantity}
                </span>
                <span className="font-medium">
                  ৳{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          
          <div className="border-t pt-3">
            <div className="flex justify-between font-semibold text-lg">
              <span>Total Amount:</span>
              <span className="text-healthcare-green-600">৳{demoOrder.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Customer Information
        </h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium text-gray-700">Name:</span>
              <span className="ml-2 text-gray-600">{demoOrder.customer.name}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Email:</span>
              <span className="ml-2 text-gray-600">{demoOrder.customer.email}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Phone:</span>
              <span className="ml-2 text-gray-600">{demoOrder.customer.phone}</span>
            </div>
            <div className="md:col-span-2">
              <span className="font-medium text-gray-700">Address:</span>
              <span className="ml-2 text-gray-600">{demoOrder.customer.address}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-healthcare-green-50 border border-healthcare-green-200 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-healthcare-green-900 mb-2">
          Available Payment Methods:
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-pink-500 rounded-full mr-2"></div>
            <span>bKash (Live)</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-healthcare-green-500 rounded-full mr-2"></div>
            <span>Stripe (Live)</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span>SSLCommerz (Live)</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
            <span>Nagad (Demo)</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
            <span>Rocket (Demo)</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-gray-500 rounded-full mr-2"></div>
            <span>Test Payment</span>
          </div>
        </div>
      </div>

      <button
        onClick={() => setCurrentStep('payment')}
        className="w-full bg-healthcare-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-healthcare-green-700 transition-colors flex items-center justify-center"
      >
        <CreditCard className="h-5 w-5 mr-2" />
        Proceed to Payment
      </button>
    </div>
  );

  const renderPaymentStep = () => (
    <EnhancedPaymentGateway
      orderData={demoOrder}
      onSuccess={handlePaymentSuccess}
      onError={handlePaymentError}
      onCancel={handlePaymentCancel}
    />
  );

  const renderSuccessStep = () => (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Successful!
        </h2>
        <p className="text-gray-600 mb-6">
          Thank you for your purchase. Your order has been confirmed.
        </p>

        {paymentResult && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">Payment Details:</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Payment ID:</span>
                <span className="font-mono">{paymentResult.paymentId}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="text-green-600 font-medium">{paymentResult.status}</span>
              </div>
              {paymentResult.verificationData && (
                <div className="flex justify-between">
                  <span>Transaction ID:</span>
                  <span className="font-mono">{paymentResult.verificationData.transactionId}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => {
              setCurrentStep('order');
              setPaymentResult(null);
            }}
            className="w-full bg-healthcare-green-600 text-white py-2 px-4 rounded-lg hover:bg-healthcare-green-700 transition-colors"
          >
            Try Another Payment
          </button>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Reset Demo
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center ${currentStep === 'order' ? 'text-healthcare-green-600' : currentStep === 'payment' || currentStep === 'success' ? 'text-green-600' : 'text-gray-400'}`}>
              <Package className="h-6 w-6 mr-2" />
              <span className="font-medium">Order Review</span>
            </div>
            <div className={`w-8 h-0.5 ${currentStep === 'payment' || currentStep === 'success' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center ${currentStep === 'payment' ? 'text-healthcare-green-600' : currentStep === 'success' ? 'text-green-600' : 'text-gray-400'}`}>
              <CreditCard className="h-6 w-6 mr-2" />
              <span className="font-medium">Payment</span>
            </div>
            <div className={`w-8 h-0.5 ${currentStep === 'success' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center ${currentStep === 'success' ? 'text-healthcare-green-600' : 'text-gray-400'}`}>
              <CheckCircle className="h-6 w-6 mr-2" />
              <span className="font-medium">Confirmation</span>
            </div>
          </div>
        </div>

        {/* Step Content */}
        {currentStep === 'order' && renderOrderStep()}
        {currentStep === 'payment' && renderPaymentStep()}
        {currentStep === 'success' && renderSuccessStep()}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>This is a demonstration of integrated payment gateways.</p>
          <p className="mt-1">
            Live methods: bKash, Stripe, SSLCommerz | 
            Demo methods: Nagad, Rocket | 
            Test method: Dummy Payment
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentDemoPage;

