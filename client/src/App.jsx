import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Users, Pill, Phone, Mail, CreditCard, ShoppingCart, User, ChevronDown, LogOut, Settings, Store } from 'lucide-react';
import { useNotification } from './context/NotificationContext';
import ProfileManagement from './components/ProfileManagement';
import AuthForm from './components/AuthForm';
import EmailVerification from './components/EmailVerification';
import Dashboard from './components/Dashboard';
import HomepageTemplate from './components/HomepageTemplateTest';
import MedicineSearchTest from './components/MedicineSearchTest';
import PaymentStatus from './components/PaymentStatus';
import PaymentSuccess from './components/PaymentSuccess';
import PaymentFailed from './components/PaymentFailed';
import PaymentCancelled from './components/PaymentCancelled';
import DemoSSLCommerzPage from './components/DemoSSLCommerzPage';
import DarkModeToggle from './components/DarkModeToggle';
import LanguageSwitcher from './components/LanguageSwitcher';
import Modal from './components/Modal';
import Cart from './components/Cart';
import PaymentDemoPage from './components/PaymentDemoPage';
import MedicineReminderManager from './components/MedicineReminderManager';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { DarkModeProvider, useDarkMode } from './context/DarkModeContext';
import { TranslationProvider } from './context/TranslationContext';

function AppContent() {
  const { user, getAuthHeaders, logout } = useAuth();
  const { success } = useNotification();
  const { isDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const location = useLocation();
  const isCustomerUser = user?.role === 'customer';
  const [showHomepage, setShowHomepage] = useState(!user); // Start with homepage if not logged in
  const [isGuest, setIsGuest] = useState(!user); // Track if user is browsing as guest
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [startWithSignup, setStartWithSignup] = useState(false); // Track if should start with sign-up form
  const [showPaymentDemo, setShowPaymentDemo] = useState(false); // Track if showing payment demo
  const [showCart, setShowCart] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    const fetchCartCount = async () => {
      if (!isCustomerUser) {
        setCartCount(0);
        return;
      }

      try {
        const headers = getAuthHeaders ? getAuthHeaders() : {};
        if (!headers || !headers.Authorization) {
          setCartCount(0);
          return;
        }

        const res = await fetch('/api/cart/count', { headers });
        if (res.ok) {
          const data = await res.json();
          setCartCount(data.count || 0);
        }
      } catch (err) {
        console.error('Error fetching cart count:', err);
      }
    };

    fetchCartCount();

    const handleCartUpdated = () => fetchCartCount();
    const handleOrderPlaced = () => fetchCartCount();

    window.addEventListener('cartUpdated', handleCartUpdated);
    window.addEventListener('orderPlaced', handleOrderPlaced);

    const handleClickOutside = (event) => {
      if (showProfileDropdown && !event.target.closest('.global-profile-dropdown')) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdated);
      window.removeEventListener('orderPlaced', handleOrderPlaced);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCustomerUser, getAuthHeaders, showProfileDropdown]);

  useEffect(() => {
    const scrapeWarmKey = 'medzy_scrape_warmup_started';
    if (sessionStorage.getItem(scrapeWarmKey)) {
      return;
    }

    sessionStorage.setItem(scrapeWarmKey, '1');

    fetch('/api/medicines/scrape/trigger?background=true', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      keepalive: true
    }).catch((warmupError) => {
      console.warn('Scraper warm-up request failed:', warmupError?.message || warmupError);
    });
  }, []);

  // Check for reset token in URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const resetToken = urlParams.get('token');
    const testMode = urlParams.get('test');
    const paymentDemo = urlParams.get('payment-demo');
    
    if (resetToken) {
      setShowResetPassword(true);
      setShowHomepage(false);
    }
    
    if (paymentDemo === 'true') {
      setShowPaymentDemo(true);
      setShowHomepage(false);
    }
    
    // Show test component if test=medicine in URL
    if (testMode === 'medicine') {
      return;
    }
  }, [location]);

  // Show test component if test=medicine in URL
  const urlParams = new URLSearchParams(location.search);
  if (urlParams.get('test') === 'medicine') {
    return <MedicineSearchTest />;
  }

  // Handle reset password completion
  const handleResetComplete = () => {
    setShowResetPassword(false);
    setShowHomepage(false);
    // Clear URL parameters
    navigate('/', { replace: true });
  };

  const handleVerificationRequired = (email) => {
    setVerificationEmail(email);
    setShowEmailVerification(true);
    setShowHomepage(false);
  };

  const handleVerificationBack = () => {
    setShowEmailVerification(false);
  };

  const handleVerificationComplete = () => {
    setShowEmailVerification(false);
    setStartWithSignup(false);
  };

  if (showEmailVerification) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <EmailVerification
          email={verificationEmail}
          onBack={handleVerificationBack}
          onVerified={handleVerificationComplete}
        />
      </div>
    );
  }

  // If showing reset password page
  if (showResetPassword) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="fixed top-4 right-4 z-50 flex items-center space-x-3">
          <LanguageSwitcher />
          <DarkModeToggle />
        </div>
        <AuthForm 
          setShowHomepage={setShowHomepage}
          onResetComplete={handleResetComplete}
          onVerificationRequired={handleVerificationRequired}
        />
      </div>
    );
  }

  // Show payment demo page if requested
  if (showPaymentDemo) {
    return (
      <div className={`min-h-screen transition-colors duration-200 ${
        isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
      }`}>
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">Payment Gateway Demo</h1>
              <div className="flex items-center space-x-3">
                <LanguageSwitcher />
                <button
                  onClick={() => {
                    setShowPaymentDemo(false);
                    setShowHomepage(true);
                  }}
                  className="text-healthcare-green-600 hover:text-healthcare-green-700 flex items-center space-x-2 font-semibold"
                >
                  <span>Back to Home</span>
                </button>
              </div>
            </div>
          </div>
        </header>
        <PaymentDemoPage />
      </div>
    );
  }

  // Always show homepage if showHomepage is true, regardless of login status
  if (showHomepage) {
    return (
      <HomepageTemplate 
        onGetStarted={() => {
          setShowHomepage(false);
          setIsGuest(false);
          setStartWithSignup(true); // Start with sign-up form
        }}
        onSignIn={() => {
          setShowHomepage(false);
          setIsGuest(false);
          setStartWithSignup(false); // Start with sign-in form
        }}
        user={user}
        onGoToDashboard={() => {
          if (user) {
            setShowHomepage(false);
            setIsGuest(false);
          } else {
            setShowHomepage(false);
          }
        }}
        isGuest={isGuest}
      />
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="fixed top-4 right-4 z-50 flex items-center space-x-3">
          <LanguageSwitcher />
          <DarkModeToggle />
        </div>
        <AuthForm 
          setShowHomepage={setShowHomepage} 
          startWithSignup={startWithSignup}
          onAuthComplete={() => setStartWithSignup(false)}
          onVerificationRequired={handleVerificationRequired}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button 
              onClick={() => {
                setShowHomepage(true);
                setIsGuest(user ? false : true); // If logged in, not a guest; if not logged in, is a guest
              }}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
              title="Go to Homepage"
            >
              <div className="bg-gradient-to-r from-healthcare-green-600 to-healthcare-green-500 p-2 rounded-lg">
                <Pill className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-healthcare-green-600 to-healthcare-green-500 bg-clip-text text-transparent">MedZy</h1>
            </button>
            
            <div className="flex items-center space-x-6">
              <nav className="flex items-center space-x-4">
                <button
                  onClick={() => setShowHomepage(true)}
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-healthcare-green-600 dark:hover:text-healthcare-green-400 transition-colors"
                >
                  Home
                </button>
                <button
                  onClick={() => {
                    // Dashboard is already shown by default when logged in
                    window.scrollTo(0, 0);
                  }}
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-healthcare-green-600 dark:hover:text-healthcare-green-400 transition-colors"
                >
                  Dashboard
                </button>
              </nav>
              <div className="flex items-center space-x-3">
                <LanguageSwitcher />
                <DarkModeToggle />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Global profile dropdown (compact) */}
              <div className="relative global-profile-dropdown">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="bg-gradient-to-r from-healthcare-green-500 to-purple-500 p-1 rounded-full">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium hidden sm:inline">
                    {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'MedZy Customer'}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700 z-50 p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="bg-gradient-to-r from-healthcare-green-500 to-purple-500 p-3 rounded-full">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{user?.firstName} {user?.lastName}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{user?.email}</p>
                        <p className="text-xs text-healthcare-green-600 dark:text-healthcare-green-400 font-medium">{(user?.role || 'user').replace('_',' ').toUpperCase()}</p>
                      </div>
                    </div>

                    <div className="flex space-x-2 mb-3">
                      <button
                        onClick={() => { setShowProfileModal(true); setShowProfileDropdown(false); }}
                        className="flex-1 flex items-center justify-center space-x-2 bg-healthcare-green-50 dark:bg-healthcare-green-900/20 text-healthcare-green-600 dark:text-healthcare-green-400 px-3 py-2 rounded-lg text-sm"
                      >
                        <Settings className="h-4 w-4" />
                        <span>Edit Profile</span>
                      </button>
                      <button
                        onClick={() => { logout(); success('Logged out successfully'); setShowProfileDropdown(false); }}
                        className="flex-1 flex items-center justify-center space-x-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-2 rounded-lg text-sm"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>

                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p>Quick access to your profile and account settings.</p>
                    </div>
                  </div>
                )}
              </div>

              {isCustomerUser && (
                <button
                  onClick={() => setShowCart(true)}
                  className="relative flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:opacity-90"
                  title="Open cart"
                >
                  <ShoppingCart className="h-6 w-6" />
                  <span className="hidden sm:inline text-sm font-medium">Cart</span>
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {isCustomerUser && showCart && (
        <Modal
          isOpen={true}
          onClose={() => {
            setShowCart(false);
            // trigger a global cart update event for other components
            window.dispatchEvent(new Event('cartUpdated'));
          }}
          title="Shopping Cart"
          size="full"
        >
          <Cart
            onClose={() => {
              setShowCart(false);
              window.dispatchEvent(new Event('cartUpdated'));
            }}
            onContinueShopping={() => {
              setShowCart(false);
              window.location.hash = '/';
            }}
          />
        </Modal>
      )}

      {showProfileModal && (
        <Modal isOpen={true} onClose={() => setShowProfileModal(false)} title="Profile Management" size="lg">
          <ProfileManagement />
        </Modal>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Dashboard />
      </main>
    </div>
  );
}

function VerifyEmailRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = new URLSearchParams(location.search).get('email') || '';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <EmailVerification
        email={email}
        onBack={() => navigate('/')}
        onVerified={() => navigate('/', { replace: true })}
      />
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Payment routes - these should always be accessible */}
      <Route path="/payment/success/:tranId" element={<PaymentSuccess />} />
      <Route path="/payment/success" element={<PaymentSuccess />} />
      <Route path="/payment/failed/:tranId" element={<PaymentFailed />} />
      <Route path="/payment/failed" element={<PaymentFailed />} />
      <Route path="/payment/cancelled/:tranId" element={<PaymentCancelled />} />
      <Route path="/payment/cancelled" element={<PaymentCancelled />} />
      <Route path="/payment/status" element={<PaymentStatus />} />
      
      {/* Demo SSL Commerce route */}
      <Route path="/payment/demo-sslcommerz" element={<DemoSSLCommerzPage />} />
      
      {/* Medicine Reminder Manager route */}
      <Route path="/medicine-reminders" element={<MedicineReminderManager />} />
      
      {/* Main app route */}
      <Route path="/" element={<AppContent />} />
      <Route path="/verify-email" element={<VerifyEmailRoute />} />
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <DarkModeProvider>
      <TranslationProvider>
        <AuthProvider>
          <NotificationProvider>
            <Router>
              <AppRoutes />
            </Router>
          </NotificationProvider>
        </AuthProvider>
      </TranslationProvider>
    </DarkModeProvider>
  );
}

export default App;