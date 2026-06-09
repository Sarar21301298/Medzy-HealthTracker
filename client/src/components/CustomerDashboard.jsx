import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Send, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  HelpCircle, 
  Lightbulb, 
  Calendar, 
  Plus, 
  X, 
  Search, 
  Package,
  ShoppingCart,
  Truck,
  Heart,
  Brain,
  FolderOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useDarkMode } from '../context/DarkModeContext';
import { useTranslation } from '../context/TranslationContext';
import Modal from './Modal';
import CombinedMedicineSearch from './CombinedMedicineSearch';
import Cart from './Cart';
import OrderTracking from './OrderTracking';
import MedicineRequestForm from './MedicineRequestForm';
import RequestStatus from './RequestStatus';
import DailyUpdates from './DailyUpdates';
import MedicineDonation from './MedicineDonation';
import BrowseDonations from './BrowseDonations';
import MyDonations from './MyDonations';
import EnhancedSmartDoctorClean from './EnhancedSmartDoctorClean';
import PaymentHistory from './PaymentHistory';
import TopBar from './TopBar';

const CustomerDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [cartCount, setCartCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [userPayments, setUserPayments] = useState([]);
  const [userOrders, setUserOrders] = useState([]);
  const { user, getAuthHeaders } = useAuth();
  const { success, error } = useNotification();
  const { t } = useTranslation();
  const { isDarkMode } = useDarkMode();

  const [formData, setFormData] = useState({
    type: 'complaint',
    subject: '',
    message: '',
    priority: 'medium',
    category: 'general',
    relatedPaymentId: '',
    relatedOrderId: '',
    requestedRefundAmount: '',
    refundReason: ''
  });

  useEffect(() => {
    fetchTickets();
    fetchCartCount();
    fetchOrderCount();
    fetchUserPayments();
    fetchUserOrders();
    
    // Listen for cart updates
    const handleCartUpdate = () => {
      fetchCartCount();
    };
    
    // Listen for order placement
    const handleOrderPlaced = () => {
      fetchCartCount(); // Cart should be empty now
      fetchOrderCount(); // Order count should increase
    };
    
    window.addEventListener('cartUpdated', handleCartUpdate);
    window.addEventListener('orderPlaced', handleOrderPlaced);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('orderPlaced', handleOrderPlaced);
    };
  }, []);

  const fetchCartCount = async () => {
    if (!user || !localStorage.getItem('token')) {
      return;
    }
    
    try {
      const response = await fetch('/api/cart/count', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setCartCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching cart count:', error);
    }
  };

  const fetchOrderCount = async () => {
    if (!user || !localStorage.getItem('token')) {
      return;
    }
    
    try {
      const response = await fetch('/api/orders/my-orders?limit=1', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setOrderCount(data.pagination?.totalItems || 0);
      }
    } catch (error) {
      console.error('Error fetching order count:', error);
    }
  };

  const fetchTickets = async () => {
    if (!user || !localStorage.getItem('token')) {
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch('/api/support/my-tickets', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setTickets(data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setLoading(false);
    }
  };

  const fetchUserPayments = async () => {
    try {
      console.log('📡 Fetching user payments for support form...');
      const response = await fetch('/api/payments/history?limit=50&status=completed', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ User payments fetched:', data.data.payments.length);
        setUserPayments(data.data.payments || []);
      } else {
        console.error('❌ Failed to fetch user payments');
      }
    } catch (error) {
      console.error('❌ Error fetching user payments:', error);
    }
  };

  const fetchUserOrders = async () => {
    try {
      console.log('📡 Fetching user orders for support form...');
      const response = await fetch('/api/orders/my-orders', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ User orders fetched:', data.orders?.length || 0);
        setUserOrders(data.orders || []);
      } else {
        console.error('❌ Failed to fetch user orders');
      }
    } catch (error) {
      console.error('❌ Error fetching user orders:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🎫 Support form submitted:', formData);
    
    if (!user || !localStorage.getItem('token')) {
      error('Please log in to submit a support request');
      return;
    }

    if (!formData.subject.trim() || !formData.message.trim()) {
      error('Please fill in all required fields');
      return;
    }

    try {
      console.log('📡 Sending support request...');
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(formData)
      });

      console.log('📨 Support response status:', response.status);

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Support request success:', responseData);
        success('Support request submitted successfully!');
        setShowForm(false);
        setFormData({ 
          type: 'complaint', 
          subject: '', 
          message: '', 
          priority: 'medium',
          category: 'general',
          relatedPaymentId: '',
          relatedOrderId: '',
          requestedRefundAmount: '',
          refundReason: ''
        });
        fetchTickets();
      } else {
        const errorData = await response.json();
        console.error('❌ Support request failed:', errorData);
        error(errorData.message || 'Failed to submit support request');
      }
    } catch (error) {
      console.error('❌ Error submitting support request:', error);
      error('Failed to submit support request. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-healthcare-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Navigation Tabs */}
      <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border`}>
        <div className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-healthcare-green-500 text-healthcare-green-600 dark:text-healthcare-green-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
              }`}
            >
              {t('customerDashboard.dashboard')}
            </button>
            <button
              onClick={() => setActiveTab('medicines')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'medicines'
                  ? 'border-healthcare-green-500 text-healthcare-green-600 dark:text-healthcare-green-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
              }`}
            >
              {t('medicineSearch.searchMedicines')}
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'orders'
                  ? 'border-healthcare-green-500 text-healthcare-green-600 dark:text-healthcare-green-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
              }`}
            >
              {t('customerDashboard.myOrders')}
            </button>
            <button
              onClick={() => setActiveTab('support')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'support' || activeTab === 'request-medicine' || activeTab === 'request-status'
                  ? 'border-healthcare-green-500 text-healthcare-green-600 dark:text-healthcare-green-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
              }`}
            >
              Support
            </button>
            <button
              onClick={() => setActiveTab('daily-updates')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'daily-updates'
                  ? 'border-healthcare-green-500 text-healthcare-green-600 dark:text-healthcare-green-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
              }`}
            >
              {t('notifications.notifications')}
            </button>
            <button
              onClick={() => setActiveTab('donations')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'donations' || ['donate-medicine', 'browse-donations', 'my-donations'].includes(activeTab)
                  ? 'border-healthcare-green-500 text-healthcare-green-600 dark:text-healthcare-green-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
              }`}
            >
              Donations
            </button>
            <button
              onClick={() => setActiveTab('payment-history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'payment-history'
                  ? 'border-healthcare-green-500 text-healthcare-green-600 dark:text-healthcare-green-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
              }`}
            >
              {t('payments.paymentHistory')}
            </button>
            <button
              onClick={() => setActiveTab('smart-doctor')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'smart-doctor'
                  ? 'border-healthcare-green-500 text-healthcare-green-600 dark:text-healthcare-green-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
              }`}
            >
              {t('aiDoctor.aiDoctor')}
            </button>
            {/* cart moved to global header */}

          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Health Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div key="cart-stats" className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800 hover:shadow-lg transition-all duration-200 transform hover:scale-105">
              <div className="text-center">
                <div className="bg-green-100 dark:bg-green-900/40 p-3 rounded-full inline-block mb-2">
                  <ShoppingCart className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{cartCount}</p>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">{t('checkout.items')}</p>
              </div>
            </div>
            
            <div key="orders-stats" className="bg-gradient-to-br from-healthcare-green-50 to-cyan-100 dark:from-healthcare-green-900/20 dark:to-cyan-900/20 rounded-2xl p-6 border border-healthcare-green-200 dark:border-healthcare-green-800 hover:shadow-lg transition-all duration-200 transform hover:scale-105">
              <div className="text-center">
                <div className="bg-healthcare-green-100 dark:bg-healthcare-green-900/40 p-3 rounded-full inline-block mb-2">
                  <Package className="h-6 w-6 text-healthcare-green-600 dark:text-healthcare-green-400" />
                </div>
                <p className="text-2xl font-bold text-healthcare-green-700 dark:text-healthcare-green-300">{orderCount}</p>
                <p className="text-sm text-healthcare-green-600 dark:text-healthcare-green-400 font-medium">{t('order.orders')}</p>
              </div>
            </div>
            
            <div key="tickets-stats" className="bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all duration-200 transform hover:scale-105">
              <div className="text-center">
                <div className="bg-purple-100 dark:bg-purple-900/40 p-3 rounded-full inline-block mb-2">
                  <MessageCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{tickets.length}</p>
                <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Support Tickets</p>
              </div>
            </div>
            
            <div key="support-stats" className="bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl p-6 border border-orange-200 dark:border-orange-800 hover:shadow-lg transition-all duration-200 transform hover:scale-105">
              <div className="text-center">
                <div className="bg-orange-100 dark:bg-orange-900/40 p-3 rounded-full inline-block mb-2">
                  <Heart className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">24/7</p>
                <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Support Available</p>
              </div>
            </div>
          </div>

          {/* Health Tip of the Day */}
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-2xl p-6 border border-teal-200 dark:border-teal-800">
            <div className="flex items-start space-x-4">
              <div className="bg-teal-100 dark:bg-teal-900/40 p-3 rounded-full">
                <Lightbulb className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-teal-900 dark:text-teal-100 mb-2">Health Tip of the Day</h3>
                <p className="text-teal-800 dark:text-teal-200">
                  Remember to take your medications at the same time each day to maintain consistent levels in your body. 
                  Set reminders on your phone or use our AI Doctor to create a personalized medication schedule!
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <button
              key="find-medicines"
              onClick={() => setActiveTab('medicines')}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border dark:border-gray-700 hover:shadow-xl transition-all duration-300 group transform hover:scale-105 hover:border-green-300 dark:hover:border-green-600"
            >
              <div className="text-center">
                <div className="bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900/30 dark:to-emerald-900/30 p-4 rounded-2xl group-hover:from-green-200 group-hover:to-emerald-300 dark:group-hover:from-green-900/50 dark:group-hover:to-emerald-900/50 transition-all duration-300 inline-block mb-4">
                  <Search className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('medicineSearch.searchMedicines')}</h3>
                <p className="text-gray-600 dark:text-gray-300">Search from thousands of medicines and check real-time availability</p>
              </div>
            </button>

            {/* cart quick-action removed; cart is available in header */}

            <button
              key="my-orders"
              onClick={() => setActiveTab('orders')}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border dark:border-gray-700 hover:shadow-xl transition-all duration-300 group transform hover:scale-105 hover:border-healthcare-green-300 dark:hover:border-healthcare-green-600"
            >
              <div className="text-center">
                <div className="bg-gradient-to-br from-healthcare-green-100 to-cyan-200 dark:from-healthcare-green-900/30 dark:to-cyan-900/30 p-4 rounded-2xl group-hover:from-healthcare-green-200 group-hover:to-cyan-300 dark:group-hover:from-healthcare-green-900/50 dark:group-hover:to-cyan-900/50 transition-all duration-300 inline-block mb-4">
                  <Truck className="h-8 w-8 text-healthcare-green-600 dark:text-healthcare-green-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('customerDashboard.myOrders')}</h3>
                <p className="text-gray-600 dark:text-gray-300">Track your medicine orders and delivery status</p>
              </div>
            </button>

            <button
              key="donate-medicine"
              onClick={() => setActiveTab('donate-medicine')}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border dark:border-gray-700 hover:shadow-xl transition-all duration-300 group transform hover:scale-105 hover:border-purple-300 dark:hover:border-purple-600"
            >
              <div className="text-center">
                <div className="bg-gradient-to-br from-purple-100 to-pink-200 dark:from-purple-900/30 dark:to-pink-900/30 p-4 rounded-2xl group-hover:from-purple-200 group-hover:to-pink-300 dark:group-hover:from-purple-900/50 dark:group-hover:to-pink-900/50 transition-all duration-300 inline-block mb-4">
                  <Heart className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Donate Medicine</h3>
                <p className="text-gray-600 dark:text-gray-300">Share unused medicines with those in need</p>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('browse-donations')}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border dark:border-gray-700 hover:shadow-xl transition-all duration-300 group transform hover:scale-105 hover:border-teal-300 dark:hover:border-teal-600"
            >
              <div className="text-center">
                <div className="bg-gradient-to-br from-teal-100 to-cyan-200 dark:from-teal-900/30 dark:to-cyan-900/30 p-4 rounded-2xl group-hover:from-teal-200 group-hover:to-cyan-300 dark:group-hover:from-teal-900/50 dark:group-hover:to-cyan-900/50 transition-all duration-300 inline-block mb-4">
                  <Search className="h-8 w-8 text-teal-600 dark:text-teal-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('donations.browseAvailableDonations')}</h3>
                <p className="text-gray-600 dark:text-gray-300">Find donated medicines available in your area</p>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('request-medicine')}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border dark:border-gray-700 hover:shadow-xl transition-all duration-300 group transform hover:scale-105 hover:border-indigo-300 dark:hover:border-indigo-600"
            >
              <div className="text-center">
                <div className="bg-gradient-to-br from-indigo-100 to-healthcare-green-200 dark:from-indigo-900/30 dark:to-healthcare-green-900/30 p-4 rounded-2xl group-hover:from-indigo-200 group-hover:to-healthcare-green-300 dark:group-hover:from-indigo-900/50 dark:group-hover:to-healthcare-green-900/50 transition-all duration-300 inline-block mb-4">
                  <Package className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Request Medicine</h3>
                <p className="text-gray-600 dark:text-gray-300">Request medicines that are not available in our system</p>
              </div>
            </button>

            <button
              key="smart-doctor-ai"
              onClick={() => setActiveTab('smart-doctor')}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border dark:border-gray-700 hover:shadow-xl transition-all duration-300 group transform hover:scale-105 hover:border-purple-300 dark:hover:border-purple-600"
            >
              <div className="text-center">
                <div className="bg-gradient-to-br from-purple-100 to-healthcare-green-200 dark:from-purple-900/30 dark:to-healthcare-green-900/30 p-4 rounded-2xl group-hover:from-purple-200 group-hover:to-healthcare-green-300 dark:group-hover:from-purple-900/50 dark:group-hover:to-healthcare-green-900/50 transition-all duration-300 inline-block mb-4">
                  <Brain className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('aiDoctor.aiDoctor')}</h3>
                <p className="text-gray-600 dark:text-gray-300">Advanced AI-powered medical consultation and symptom analysis</p>
              </div>
            </button>
          </div>

          {/* Support and Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              key="help-support"
              onClick={() => {
                setFormData({ ...formData, type: 'help' });
                setShowForm(true);
              }}
              className="bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all duration-200 group transform hover:scale-105"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-purple-100 dark:bg-purple-900/40 p-4 rounded-2xl group-hover:bg-purple-200 dark:group-hover:bg-purple-900/60 transition-colors">
                  <HelpCircle className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="text-xl font-bold text-purple-900 dark:text-purple-100 mb-1">Get Help & Support</h3>
                  <p className="text-purple-700 dark:text-purple-300">Need assistance? Our support team is here to help you 24/7</p>
                </div>
              </div>
            </button>

            <button
              key="share-ideas"
              onClick={() => {
                setFormData({ ...formData, type: 'suggestion' });
                setShowForm(true);
              }}
              className="bg-gradient-to-br from-teal-50 to-green-100 dark:from-teal-900/20 dark:to-green-900/20 rounded-2xl p-6 border border-teal-200 dark:border-teal-800 hover:shadow-lg transition-all duration-200 group transform hover:scale-105"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-teal-100 dark:bg-teal-900/40 p-4 rounded-2xl group-hover:bg-teal-200 dark:group-hover:bg-teal-900/60 transition-colors">
                  <Lightbulb className="h-8 w-8 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="text-xl font-bold text-teal-900 dark:text-teal-100 mb-1">Share Your Ideas</h3>
                  <p className="text-teal-700 dark:text-teal-300">Help us improve MedZy with your valuable suggestions and feedback</p>
                </div>
              </div>
            </button>

            <button
              key="payment-issue"
              onClick={() => {
                setFormData({ 
                  ...formData, 
                  type: 'payment_issue',
                  category: 'payment',
                  priority: 'high'
                });
                setShowForm(true);
              }}
              className="bg-gradient-to-br from-red-50 to-orange-100 dark:from-red-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-red-200 dark:border-red-800 hover:shadow-lg transition-all duration-200 group transform hover:scale-105"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-red-100 dark:bg-red-900/40 p-4 rounded-2xl group-hover:bg-red-200 dark:group-hover:bg-red-900/60 transition-colors">
                  <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="text-xl font-bold text-red-900 dark:text-red-100 mb-1">Payment Issues</h3>
                  <p className="text-red-700 dark:text-red-300">Report payment problems, failed transactions, or refund requests</p>
                </div>
              </div>
            </button>
          </div>

          {/* Emergency Contact */}
          <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-red-100 dark:bg-red-900/40 p-3 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">Emergency Medical Help</h3>
                  <p className="text-red-700 dark:text-red-300">For medical emergencies, call 999 or visit your nearest hospital</p>
                </div>
              </div>
              <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors duration-200">
                Emergency: 999
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Medicine Search Tab */}
      {activeTab === 'medicines' && (
        <CombinedMedicineSearch />
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <OrderTracking onBack={() => setActiveTab('overview')} />
      )}

      {/* Support Hub */}
      {activeTab === 'support' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Support</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Choose an option below</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setActiveTab('support-center')}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border dark:border-gray-700 hover:shadow-xl transition-all duration-300 group text-left"
              >
                <div className="bg-gradient-to-br from-purple-100 to-indigo-200 dark:from-purple-900/30 dark:to-indigo-900/30 p-4 rounded-2xl inline-block mb-4 group-hover:scale-105 transition-transform">
                  <MessageCircle className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Support</h3>
                <p className="text-gray-600 dark:text-gray-300">Create or view your support requests</p>
              </button>

              <button
                onClick={() => setActiveTab('request-medicine')}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border dark:border-gray-700 hover:shadow-xl transition-all duration-300 group text-left"
              >
                <div className="bg-gradient-to-br from-indigo-100 to-healthcare-green-200 dark:from-indigo-900/30 dark:to-healthcare-green-900/30 p-4 rounded-2xl inline-block mb-4 group-hover:scale-105 transition-transform">
                  <Package className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Request Medicine</h3>
                <p className="text-gray-600 dark:text-gray-300">Submit a medicine request or prescription</p>
              </button>

              <button
                onClick={() => setActiveTab('request-status')}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border dark:border-gray-700 hover:shadow-xl transition-all duration-300 group text-left"
              >
                <div className="bg-gradient-to-br from-teal-100 to-cyan-200 dark:from-teal-900/30 dark:to-cyan-900/30 p-4 rounded-2xl inline-block mb-4 group-hover:scale-105 transition-transform">
                  <CheckCircle className="h-8 w-8 text-teal-600 dark:text-teal-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">My Tickets</h3>
                <p className="text-gray-600 dark:text-gray-300">Track support ticket status and history</p>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <button
              onClick={() => setActiveTab('overview')}
              className="text-sm font-medium text-healthcare-green-600 hover:text-healthcare-green-700 dark:text-healthcare-green-400 dark:hover:text-healthcare-green-300"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Support Center Tab */}
      {activeTab === 'support-center' && (
        <div className="space-y-4">
          <button
            onClick={() => setActiveTab('support')}
            className="text-sm font-medium text-healthcare-green-600 hover:text-healthcare-green-700 dark:text-healthcare-green-400 dark:hover:text-healthcare-green-300"
          >
            Back to Support
          </button>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Support Requests</h3>
              <button
                onClick={() => setShowForm(true)}
                className="bg-healthcare-green-500 text-white px-4 py-2 rounded-lg hover:bg-healthcare-green-600 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Request
              </button>
            </div>

            {tickets.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-300">No support requests yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket, index) => (
                  <div key={ticket._id || ticket.id || `ticket-${index}`} className="p-4 border dark:border-gray-700 rounded-lg">
                    <h4 className="font-semibold dark:text-white">{ticket.subject || 'No Subject'}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{ticket.message || 'No Message'}</p>
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : 'No Date'}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs bg-healthcare-green-100 text-healthcare-green-800">
                        {ticket.status ? ticket.status.toUpperCase() : 'UNKNOWN'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Medicine Request Tab */}
      {activeTab === 'request-medicine' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700">
          <MedicineRequestForm />
        </div>
      )}

      {/* Request Status Tab */}
      {activeTab === 'request-status' && (
        <div className="space-y-4">
          <button
            onClick={() => setActiveTab('support')}
            className="text-sm font-medium text-healthcare-green-600 hover:text-healthcare-green-700 dark:text-healthcare-green-400 dark:hover:text-healthcare-green-300"
          >
            Back to Support
          </button>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700">
            <RequestStatus />
          </div>
        </div>
      )}

      {/* Daily Updates Tab */}
      {activeTab === 'daily-updates' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-0">
          <DailyUpdates />
        </div>
      )}

      {/* Donations Hub */}
      {activeTab === 'donations' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Donations</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Choose what you want to do</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setActiveTab('donate-medicine')}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border dark:border-gray-700 hover:shadow-xl transition-all duration-300 group text-left"
              >
                <div className="bg-gradient-to-br from-purple-100 to-pink-200 dark:from-purple-900/30 dark:to-pink-900/30 p-4 rounded-2xl inline-block mb-4 group-hover:scale-105 transition-transform">
                  <Heart className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Donate Medicine</h3>
                <p className="text-gray-600 dark:text-gray-300">Share unused medicines with those in need</p>
              </button>

              <button
                onClick={() => setActiveTab('browse-donations')}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border dark:border-gray-700 hover:shadow-xl transition-all duration-300 group text-left"
              >
                <div className="bg-gradient-to-br from-teal-100 to-cyan-200 dark:from-teal-900/30 dark:to-cyan-900/30 p-4 rounded-2xl inline-block mb-4 group-hover:scale-105 transition-transform">
                  <Search className="h-8 w-8 text-teal-600 dark:text-teal-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Browse Available Donations</h3>
                <p className="text-gray-600 dark:text-gray-300">Find donated medicines available in your area</p>
              </button>

              <button
                onClick={() => setActiveTab('my-donations')}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border dark:border-gray-700 hover:shadow-xl transition-all duration-300 group text-left"
              >
                <div className="bg-gradient-to-br from-healthcare-green-100 to-cyan-200 dark:from-healthcare-green-900/30 dark:to-cyan-900/30 p-4 rounded-2xl inline-block mb-4 group-hover:scale-105 transition-transform">
                  <Package className="h-8 w-8 text-healthcare-green-600 dark:text-healthcare-green-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">My Donations</h3>
                <p className="text-gray-600 dark:text-gray-300">Review your submitted donation history</p>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <button
              onClick={() => setActiveTab('overview')}
              className="text-sm font-medium text-healthcare-green-600 hover:text-healthcare-green-700 dark:text-healthcare-green-400 dark:hover:text-healthcare-green-300"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Donate Medicine Tab */}
      {activeTab === 'donate-medicine' && (
        <div className="space-y-4">
          <button
            onClick={() => setActiveTab('donations')}
            className="text-sm font-medium text-healthcare-green-600 hover:text-healthcare-green-700 dark:text-healthcare-green-400 dark:hover:text-healthcare-green-300"
          >
            Back to Donations
          </button>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-0">
            <MedicineDonation />
          </div>
        </div>
      )}

      {/* Browse Donations Tab */}
      {activeTab === 'browse-donations' && (
        <div className="space-y-4">
          <button
            onClick={() => setActiveTab('donations')}
            className="text-sm font-medium text-healthcare-green-600 hover:text-healthcare-green-700 dark:text-healthcare-green-400 dark:hover:text-healthcare-green-300"
          >
            Back to Donations
          </button>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-0">
            <BrowseDonations />
          </div>
        </div>
      )}

      {/* My Donations Tab */}
      {activeTab === 'my-donations' && (
        <div className="space-y-4">
          <button
            onClick={() => setActiveTab('donations')}
            className="text-sm font-medium text-healthcare-green-600 hover:text-healthcare-green-700 dark:text-healthcare-green-400 dark:hover:text-healthcare-green-300"
          >
            Back to Donations
          </button>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-0">
            <MyDonations />
          </div>
        </div>
      )}

      {/* Payment History Tab */}
      {activeTab === 'payment-history' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-0">
          <PaymentHistory />
        </div>
      )}

      {/* Smart Doctor AI Tab */}
      {activeTab === 'smart-doctor' && (
        <EnhancedSmartDoctorClean 
          onNavigateToMedicines={(searchQuery) => {
            setActiveTab('medicines');
            // If there's a search query, we can store it in state or pass it to the medicine search component
            if (searchQuery) {
              // You can add logic here to pass the search query to the medicine search component
              console.log('Navigating to medicines with search query:', searchQuery);
            }
          }}
        />
      )}



      {/* Support Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        size="large"
      >
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Submit Support Request</h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Request Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  <HelpCircle className="inline w-4 h-4 mr-2" />
                  Request Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="complaint">Complaint</option>
                  <option value="help">Help Request</option>
                  <option value="suggestion">Suggestion</option>
                  <option value="payment_issue">Payment Issue</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  <AlertTriangle className="inline w-4 h-4 mr-2" />
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                <FolderOpen className="inline w-4 h-4 mr-2" />
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
              >
                <option value="general">General</option>
                <option value="payment">Payment</option>
                <option value="refund">Refund</option>
                <option value="order">Order</option>
                <option value="technical">Technical</option>
                <option value="billing">Billing</option>
              </select>
            </div>

            {/* Payment/Order Related Fields - Show only for payment issues */}
            {(formData.type === 'payment_issue' || formData.category === 'payment' || formData.category === 'refund') && (
              <div className="bg-healthcare-green-50 dark:bg-healthcare-green-900/20 border border-healthcare-green-200 dark:border-healthcare-green-800 rounded-xl p-6 space-y-4">
                <h4 className="text-lg font-semibold text-healthcare-green-900 dark:text-healthcare-green-100 mb-4">
                  Payment Information
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Related Payment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Related Payment
                    </label>
                    <select
                      value={formData.relatedPaymentId}
                      onChange={(e) => setFormData({ ...formData, relatedPaymentId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select Payment (Optional)</option>
                      {userPayments.map((payment) => (
                        <option key={payment._id} value={payment._id}>
                          ৳{payment.amount} - {payment.paymentMethod} - {new Date(payment.createdAt).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Related Order */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Related Order
                    </label>
                    <select
                      value={formData.relatedOrderId}
                      onChange={(e) => setFormData({ ...formData, relatedOrderId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select Order (Optional)</option>
                      {userOrders.map((order) => (
                        <option key={order._id} value={order._id}>
                          #{order.trackingId || order._id.slice(-8)} - ৳{order.total} - {order.status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Refund fields for refund category */}
                {formData.category === 'refund' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Requested Refund Amount (৳)
                      </label>
                      <input
                        type="number"
                        value={formData.requestedRefundAmount}
                        onChange={(e) => setFormData({ ...formData, requestedRefundAmount: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Enter refund amount"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Refund Reason
                      </label>
                      <select
                        value={formData.refundReason}
                        onChange={(e) => setFormData({ ...formData, refundReason: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">Select Reason</option>
                        <option value="duplicate_payment">Duplicate Payment</option>
                        <option value="wrong_amount">Wrong Amount Charged</option>
                        <option value="order_cancelled">Order Cancelled</option>
                        <option value="product_not_received">Product Not Received</option>
                        <option value="product_defective">Product Defective</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <MessageCircle className="inline w-4 h-4 mr-2" />
                Subject *
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500 transition-all duration-200"
                placeholder="Brief description of your request..."
                required
                minLength={5}
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.subject.length}/100 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <Send className="inline w-4 h-4 mr-2" />
                Detailed Message *
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={6}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500 resize-none transition-all duration-200"
                placeholder="Please provide detailed information about your request..."
                required
                minLength={10}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.message.length}/500 characters
              </p>
            </div>

            <div className="bg-healthcare-green-50 border border-healthcare-green-200 rounded-xl p-4">
              <div className="flex items-start">
                <Clock className="h-5 w-5 text-healthcare-green-600 mt-0.5 mr-3" />
                <div>
                  <h4 className="text-sm font-semibold text-healthcare-green-900">Response Time</h4>
                  <p className="text-sm text-healthcare-green-700">We typically respond within 24-48 hours.</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ 
                    type: 'complaint', 
                    subject: '', 
                    message: '', 
                    priority: 'medium',
                    category: 'general',
                    relatedPaymentId: '',
                    relatedOrderId: '',
                    requestedRefundAmount: '',
                    refundReason: ''
                  });
                }}
                className="px-6 py-3 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!formData.subject.trim() || !formData.message.trim()}
                className="px-8 py-3 bg-gradient-to-r from-healthcare-green-600 to-healthcare-green-700 text-white rounded-xl hover:from-healthcare-green-700 hover:to-healthcare-green-800 transition-all duration-200 flex items-center space-x-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
                <span>Submit Request</span>
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* cart modal removed from dashboard - now in global header */}
    </div>
  );
};

export default CustomerDashboard;

