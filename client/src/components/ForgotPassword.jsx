import React, { useState } from 'react';
import { Mail, ArrowLeft, Send, Lock } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

const ForgotPassword = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { showNotification } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setEmailSent(true);
        showNotification('Password reset link sent! Check your email 📧', 'success');
      } else {
        showNotification(data.message || 'Failed to send reset email', 'error');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      showNotification('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-healthcare-green-50 via-white to-green-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-healthcare-green-600 to-green-500 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">MedZy</h1>
            <p className="text-gray-600 mt-2">Password Reset Email Sent</p>
          </div>

          {/* Success Message */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
              <div className="bg-green-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Send className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Check Your Email! 📧
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                We've sent a password reset link to:<br/>
                <span className="font-medium text-healthcare-green-600">{email}</span>
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-healthcare-green-50 border border-healthcare-green-200 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-healthcare-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-healthcare-green-700 mb-1">What's Next?</h3>
                    <ul className="text-sm text-healthcare-green-600 space-y-1">
                      <li>• Check your email inbox (and spam folder)</li>
                      <li>• Click the reset link in the email</li>
                      <li>• Create a new secure password</li>
                      <li>• Sign in with your new password</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-amber-700">
                      <strong>⏰ Important:</strong> The reset link will expire in 1 hour for your security.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={onBack}
                className="w-full bg-gradient-to-r from-healthcare-green-600 to-green-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-healthcare-green-700 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-healthcare-green-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Sign In
              </button>

              <button
                onClick={() => {
                  setEmailSent(false);
                  setEmail('');
                }}
                className="w-full text-healthcare-green-600 hover:text-healthcare-green-700 font-medium py-2 px-4 rounded-lg border border-healthcare-green-200 hover:border-healthcare-green-300 hover:bg-healthcare-green-50 transition-all duration-200 flex items-center justify-center"
              >
                Send to Different Email
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-healthcare-green-50 via-white to-green-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-healthcare-green-600 to-green-500 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">MedZy</h1>
          <p className="text-gray-600 mt-2">Reset Your Password</p>
        </div>

        {/* Forgot Password Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sign In
          </button>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Forgot Your Password? 🔒
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              No worries! Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-healthcare-green-500 focus:border-transparent"
                  placeholder="Enter your email address"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                We'll send a password reset link to this email
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-healthcare-green-600 to-green-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-healthcare-green-700 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-healthcare-green-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending Reset Link...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  Send Reset Link
                </>
              )}
            </button>
          </form>

          <div className="mt-6 p-4 bg-healthcare-green-50 border border-healthcare-green-200 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-healthcare-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-healthcare-green-700 mb-1">Security Note</h3>
                <p className="text-sm text-healthcare-green-600">
                  For your security, password reset links expire after 1 hour. If you don't receive an email, check your spam folder.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Remember your password?{' '}
              <button
                onClick={onBack}
                className="text-healthcare-green-600 hover:text-healthcare-green-700 font-medium"
              >
                Sign in instead
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

