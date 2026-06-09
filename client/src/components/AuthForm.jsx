import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Pill, User, Mail, Phone, Calendar, UserCheck, ArrowRight, AlertTriangle, CheckCircle, Lock, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useDarkMode } from '../context/DarkModeContext';
import { useTranslation } from '../context/TranslationContext';
import EmailVerification from './EmailVerification';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import LoginConfirmationModal from './LoginConfirmationModal';

const AuthForm = ({ setShowHomepage, onResetComplete, startWithSignup = false, onAuthComplete, onVerificationRequired }) => {
  const { isDarkMode } = useDarkMode();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(!startWithSignup); // Start with sign-up if startWithSignup is true
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showLoginConfirmation, setShowLoginConfirmation] = useState(false);
  const [existingSessionData, setExistingSessionData] = useState(null);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const { login, signup, forceLogin } = useAuth();
  const { showNotification } = useNotification();

  // Check for reset token in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      setResetToken(token);
      setShowResetPassword(true);
    }
  }, []);

  // Handle startWithSignup prop
  useEffect(() => {
    if (startWithSignup) {
      setIsLogin(false); // Show sign-up form
    }
  }, [startWithSignup]);

  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    role: 'customer'
  });

  const handleCancelForceLogin = () => {
    setShowLoginConfirmation(false);
    setExistingSessionData(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await login({ email: formData.email, password: formData.password });
        if (result.success) {
          // After login, dashboard will be shown based on user role (handled in AppContent/Dashboard)
          if (setShowHomepage) setShowHomepage(false);
          if (onAuthComplete) onAuthComplete(result.user);
          setError('');
          setShowLoginConfirmation(false);
          setExistingSessionData(null);
        } else {
          if (result.errorType === 'EMAIL_NOT_VERIFIED') {
            setVerificationEmail(formData.email);
            setShowEmailVerification(true);
            showNotification('Please verify your email address to continue', 'warning');
          } else {
            setError(result.error);
            setShowLoginConfirmation(false);
          }
        }
      } else {
        result = await signup(formData);
        if (result.success) {
          if (result.requiresVerification) {
            if (onVerificationRequired) onVerificationRequired(formData.email);
            navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`);
            showNotification('Account created! Please verify your email to continue', 'success');
          } else {
            setIsLogin(true);
            setError('Signup successful! Please log in.');
            if (setShowHomepage) setShowHomepage(false); // Ensure login form is shown
          }
        } else {
          setError(result.error);
        }
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForceLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await forceLogin(formData.email, formData.password);
      if (result.success) {
        if (setShowHomepage) setShowHomepage(false);
        if (onAuthComplete) onAuthComplete(result.user);
        setShowLoginConfirmation(false);
        setExistingSessionData(null);
        setError('');
        showNotification('Login successful! Previous session terminated.', 'success');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Force login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleEmailVerified = () => {
    setShowEmailVerification(false);
    setIsLogin(true);
    showNotification('Email verified successfully! You can now sign in.', 'success');
  };

  const handleBackToAuth = () => {
    setShowEmailVerification(false);
    setShowForgotPassword(false);
    setShowResetPassword(false);
    setError('');
  };

  const handleResetSuccess = () => {
    setShowResetPassword(false);
    setIsLogin(true);
    showNotification('Password reset successfully! Please sign in with your new password.', 'success');
    // Clear URL parameters
    window.history.replaceState({}, document.title, window.location.pathname);
    
    // Call the parent's reset complete handler if provided
    if (onResetComplete) {
      onResetComplete();
    }
  };

  // Show email verification component
  if (showEmailVerification) {
    return (
      <EmailVerification
        email={verificationEmail}
        onBack={handleBackToAuth}
        onVerified={handleEmailVerified}
      />
    );
  }

  // Show forgot password component
  if (showForgotPassword) {
    return (
      <ForgotPassword
        onBack={handleBackToAuth}
      />
    );
  }

  // Show reset password component
  if (showResetPassword) {
    return (
      <ResetPassword
        token={resetToken}
        onSuccess={handleResetSuccess}
      />
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 transition-colors duration-300 ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-blue-50 via-white to-emerald-50'}`}>
      <div className="max-w-md w-full">
        {/* Logo and Header */}
        <div className="text-center mb-8 animate-fade-in">
          <button 
            onClick={() => setShowHomepage(true)}
            className="group mx-auto mb-6 flex items-center justify-center"
            title="Back to Homepage"
          >
            <div className={`bg-healthcare-green-600 p-3 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-healthcare-green-600/50 group-hover:shadow-2xl`}>
              <Pill className="h-8 w-8 text-white" />
            </div>
          </button>
          <button 
            onClick={() => setShowHomepage(true)}
            className="hover:opacity-80 transition-opacity"
            title="Back to Homepage"
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-healthcare-green-600 to-healthcare-green-500 bg-clip-text text-transparent">MedZy</h1>
          </button>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-3 text-sm font-medium tracking-wide`}>
            {isLogin ? 'Welcome back to your health companion' : 'Join MedZy - Your health companion'}
          </p>
        </div>

        {/* Form */}
        <div className={`${isDarkMode ? 'bg-gray-800/80 border-gray-700/50 backdrop-blur-xl' : 'bg-white/95 border-gray-200/50 backdrop-blur-xl'} rounded-3xl shadow-2xl p-8 border transition-all duration-300 hover:shadow-3xl`}>
          <div className="mb-7">
            <div className="flex items-center gap-3 mb-3">
              {isLogin ? <Lock className="h-7 w-7 text-healthcare-green-600" /> : <Shield className="h-7 w-7 text-healthcare-green-600" />}
              <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {isLogin ? 'Sign In' : 'Create Account'}
              </h2>
            </div>
          </div>

          {error && (
            <div className={`mb-5 p-4 rounded-xl border-l-4 backdrop-blur-sm ${
              error.includes('successful') 
                ? `${isDarkMode ? 'bg-green-900/30 border-green-400 shadow-green-500/10' : 'bg-green-50 border-green-400 shadow-green-200/30'} text-green-700 dark:text-green-300` 
                : `${isDarkMode ? 'bg-red-900/30 border-red-400 shadow-red-500/10' : 'bg-red-50 border-red-400 shadow-red-200/30'} text-red-700 dark:text-red-300`
            } animate-slide-in shadow-lg`}>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {error.includes('successful') ? (
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      <User className="h-4 w-4" />
                      First Name
                    </label>
                    <div className="relative group">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500 group-focus-within:text-healthcare-green-500 transition-colors" />
                      <input
                        type="text"
                        name="firstName"
                        required
                        value={formData.firstName}
                        onChange={handleChange}
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-healthcare-green-500 focus:border-transparent focus:outline-none transition-all duration-200 backdrop-blur-sm hover:border-healthcare-green-300 dark:hover:border-healthcare-green-600"
                        placeholder="John"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      <User className="h-4 w-4" />
                      Last Name
                    </label>
                    <div className="relative group">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500 group-focus-within:text-healthcare-green-500 transition-colors" />
                      <input
                        type="text"
                        name="lastName"
                        required
                        value={formData.lastName}
                        onChange={handleChange}
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-healthcare-green-500 focus:border-transparent focus:outline-none transition-all duration-200 backdrop-blur-sm hover:border-healthcare-green-300 dark:hover:border-healthcare-green-600"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </label>
                  <div className="relative group">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500 group-focus-within:text-healthcare-green-500 transition-colors" />
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-healthcare-green-500 focus:border-transparent focus:outline-none transition-all duration-200 backdrop-blur-sm hover:border-healthcare-green-300 dark:hover:border-healthcare-green-600"
                      placeholder="+880123456789"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar className="h-4 w-4" />
                    Date of Birth
                  </label>
                  <div className="relative group">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500 group-focus-within:text-healthcare-green-500 transition-colors" />
                    <input
                      type="date"
                      name="dateOfBirth"
                      required
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-healthcare-green-500 focus:border-transparent focus:outline-none transition-all duration-200 backdrop-blur-sm hover:border-healthcare-green-300 dark:hover:border-healthcare-green-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      <User className="h-4 w-4" />
                      Gender
                    </label>
                    <select
                      name="gender"
                      required
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-healthcare-green-500 focus:border-transparent focus:outline-none transition-all duration-200 backdrop-blur-sm hover:border-healthcare-green-300 dark:hover:border-healthcare-green-600"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      <Shield className="h-4 w-4" />
                      Role
                    </label>
                    <div className="relative group">
                      <UserCheck className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500 group-focus-within:text-healthcare-green-500 transition-colors pointer-events-none" />
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-healthcare-green-500 focus:border-transparent focus:outline-none transition-all duration-200 backdrop-blur-sm hover:border-healthcare-green-300 dark:hover:border-healthcare-green-600"
                      >
                        <option value="customer">Patient</option>
                        <option value="pharmacy_vendor">Vendor</option>
                        <option value="rider">Rider</option>
                      </select>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <Mail className="h-4 w-4" />
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500 group-focus-within:text-healthcare-green-500 transition-colors" />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-healthcare-green-500 focus:border-transparent focus:outline-none transition-all duration-200 backdrop-blur-sm hover:border-healthcare-green-300 dark:hover:border-healthcare-green-600 text-left"
                  placeholder="hello@example.com"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <Lock className="h-4 w-4" />
                Password
              </label>
              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-healthcare-green-500 focus:border-transparent focus:outline-none transition-all duration-200 backdrop-blur-sm hover:border-healthcare-green-300 dark:hover:border-healthcare-green-600"
                  placeholder={isLogin ? 'Enter your password' : 'Create a secure password'}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-healthcare-green-500 dark:hover:text-healthcare-green-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {!isLogin && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Minimum 6 characters</p>
              )}
            </div>

            {/* Forgot Password Link for Login */}
            {isLogin && (
              <div className="text-right pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-healthcare-green-600 hover:text-healthcare-green-700 dark:text-healthcare-green-400 dark:hover:text-healthcare-green-300 font-semibold hover:underline transition-colors"
                >
                  Forgot your password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-healthcare-green-600 to-healthcare-green-500 text-white py-3 px-4 rounded-xl font-bold hover:from-healthcare-green-700 hover:to-healthcare-green-600 focus:outline-none focus:ring-2 focus:ring-healthcare-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center shadow-lg hover:shadow-healthcare-green-500/30"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isLogin ? 'Signing In...' : 'Creating Account...'}
                </>
              ) : (
                <>
                  {isLogin ? 'Sign In to Your Account' : 'Create Your Account'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-7 text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className={`px-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} text-gray-500 dark:text-gray-400 font-medium`}>
                  {isLogin ? "Don't have an account?" : 'Already have an account?'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setShowLoginConfirmation(false);
                setExistingSessionData(null);
                setFormData({
                  email: '',
                  phone: '',
                  password: '',
                  firstName: '',
                  lastName: '',
                  dateOfBirth: '',
                  gender: '',
                  role: 'customer'
                });
              }}
              className="mt-5 w-full text-healthcare-green-600 hover:text-healthcare-green-700 dark:text-healthcare-green-400 dark:hover:text-healthcare-green-300 font-bold py-3 px-4 rounded-xl border-2 border-healthcare-green-200 hover:border-healthcare-green-300 dark:border-healthcare-green-600 dark:hover:border-healthcare-green-500 hover:bg-healthcare-green-50 dark:hover:bg-healthcare-green-900/20 transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg"
            >
              {isLogin ? 'Create New Account' : 'Sign In Instead'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Login Confirmation Modal */}
      <LoginConfirmationModal
        isOpen={showLoginConfirmation}
        onConfirm={handleForceLogin}
        onCancel={handleCancelForceLogin}
        existingDevice={existingSessionData?.existingDevice}
        loginTime={existingSessionData?.loginTime}
        lastActivity={existingSessionData?.lastActivity}
      />
    </div>
  );
};

export default AuthForm;
