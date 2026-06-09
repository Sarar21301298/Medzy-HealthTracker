import React, { useState, useEffect } from 'react';
import { Mail, ArrowLeft, RefreshCw, CheckCircle } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

const EmailVerification = ({ email, onBack, onVerified }) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes
  const { showNotification } = useNotification();

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (verificationCode.length !== 6) {
      showNotification('Please enter a valid 6-digit verification code', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          verificationCode
        })
      });

      const data = await response.json();

      if (response.ok) {
        showNotification('Email verified successfully! 🎉', 'success');
        onVerified();
      } else {
        showNotification(data.message || 'Verification failed', 'error');
      }
    } catch (error) {
      console.error('Verification error:', error);
      showNotification('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        showNotification('Verification code sent! Check your email 📧', 'success');
        setTimeLeft(900); // Reset timer
        setVerificationCode('');
      } else {
        showNotification(data.message || 'Failed to resend code', 'error');
      }
    } catch (error) {
      console.error('Resend error:', error);
      showNotification('Network error. Please try again.', 'error');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-healthcare-green-50 via-white to-green-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-healthcare-green-600 to-green-500 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">MedZy</h1>
          <p className="text-gray-600 mt-2">Verify Your Email Address</p>
        </div>

        {/* Verification Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sign In
          </button>

          <div className="text-center mb-6">
            <div className="bg-green-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Check Your Email! 📧
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              We've sent a 6-digit verification code to:<br/>
              <span className="font-medium text-healthcare-green-600">{email}</span>
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                Enter Verification Code
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setVerificationCode(value);
                }}
                className="w-full text-center text-2xl font-bold letter-spacing-wide py-4 px-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-healthcare-green-500 focus:border-transparent tracking-widest"
                placeholder="000000"
                maxLength={6}
                style={{ letterSpacing: '0.5em' }}
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                Enter the 6-digit code from your email
              </p>
            </div>

            {timeLeft > 0 ? (
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Code expires in: <span className="font-medium text-red-600">{formatTime(timeLeft)}</span>
                </p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-red-600 mb-2">
                  ⏰ Verification code has expired
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || verificationCode.length !== 6}
              className="w-full bg-gradient-to-r from-healthcare-green-600 to-green-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-healthcare-green-700 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-healthcare-green-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Verify Email
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Didn't receive the code?</span>
              </div>
            </div>
            
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading || timeLeft > 840} // Allow resend after 1 minute
              className="mt-4 w-full text-healthcare-green-600 hover:text-healthcare-green-700 font-medium py-2 px-4 rounded-lg border border-healthcare-green-200 hover:border-healthcare-green-300 hover:bg-healthcare-green-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {resendLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-healthcare-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Resend Code
                  {timeLeft > 840 && <span className="ml-1">({formatTime(900 - timeLeft)})</span>}
                </>
              )}
            </button>
          </div>

          <div className="mt-6 p-4 bg-healthcare-green-50 border border-healthcare-green-200 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-healthcare-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-healthcare-green-700">
                  <strong>💡 Pro tip:</strong> Check your spam folder if you don't see the email. The verification code is valid for 15 minutes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;

