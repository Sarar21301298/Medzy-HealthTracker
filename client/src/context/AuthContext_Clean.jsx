import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Heart } from 'lucide-react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  
  // Use refs for timers to avoid stale closures
  const inactivityTimerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const isInitializedRef = useRef(false);
  const notificationRef = useRef(null);

  // Professional timeout durations
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  const SCREEN_OFF_TIMEOUT = 5 * 60 * 1000; // 5 minutes when screen is off
  const AUTH_RETRY_DELAY = 1000; // 1 second between retries
  const MAX_AUTH_RETRIES = 2;

  // Professional notification system
  const addNotification = useCallback((type, message, duration = 4000) => {
    // Remove existing notification
    if (notificationRef.current && document.body.contains(notificationRef.current)) {
      document.body.removeChild(notificationRef.current);
    }

    const notification = document.createElement('div');
    const colors = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      warning: 'bg-yellow-500',
      info: 'bg-blue-500'
    };

    notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300 transform translate-x-full opacity-0`;
    notification.textContent = message;
    notificationRef.current = notification;
    document.body.appendChild(notification);

    // Animate in
    requestAnimationFrame(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(0)';
    });

    // Auto remove after duration
    setTimeout(() => {
      if (notification && document.body.contains(notification)) {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
          if (notificationRef.current === notification) {
            notificationRef.current = null;
          }
        }, 300);
      }
    }, duration);
  }, []);

  // Clear all timers and cleanup
  const clearTimers = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
  }, []);

  // Clear auth state utility function
  const clearAuthState = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('sessionId');
    setUser(null);
    setToken(null);
    setAuthError(null);
    clearTimers();
  }, [clearTimers]);

  // Auto logout function for professional session management
  const autoLogout = useCallback(async (reason = 'inactivity') => {
    clearTimers();
    clearAuthState();
    
    if (addNotification) {
      switch (reason) {
        case 'inactivity':
          addNotification('warning', 'Session expired due to inactivity.');
          break;
        case 'screen-off':
          addNotification('info', 'Session ended for security.');
          break;
        default:
          addNotification('info', 'Session expired.');
      }
    }
  }, [clearTimers, clearAuthState, addNotification]);

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    clearTimers();
    
    if (user && localStorage.getItem('token')) {
      inactivityTimerRef.current = setTimeout(() => {
        autoLogout('inactivity');
      }, INACTIVITY_TIMEOUT);
    }
  }, [user, autoLogout, clearTimers, INACTIVITY_TIMEOUT]);

  // Track user activity
  const trackActivity = useCallback(() => {
    if (user && localStorage.getItem('token')) {
      resetInactivityTimer();
    }
  }, [user, resetInactivityTimer]);

  // Activity monitoring setup
  useEffect(() => {
    if (!user) return;

    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    let throttleTimer = null;
    
    const throttledTrackActivity = () => {
      if (!throttleTimer) {
        throttleTimer = setTimeout(() => {
          trackActivity();
          throttleTimer = null;
        }, 1000); // Throttle to once per second
      }
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, throttledTrackActivity, { passive: true });
    });

    // Handle visibility changes (tab switching, screen lock)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Start shorter timeout when screen goes off
        if (user && localStorage.getItem('token')) {
          setTimeout(() => {
            if (document.hidden && user && localStorage.getItem('token')) {
              autoLogout('screen-off');
            }
          }, SCREEN_OFF_TIMEOUT);
        }
      } else if (!document.hidden && user && localStorage.getItem('token')) {
        // Reset timer when screen comes back on
        resetInactivityTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup function
    return () => {
      clearTimers();
      if (throttleTimer) clearTimeout(throttleTimer);
      
      activityEvents.forEach(event => {
        document.removeEventListener(event, throttledTrackActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (notificationRef.current && document.body.contains(notificationRef.current)) {
        document.body.removeChild(notificationRef.current);
      }
    };
  }, [user, trackActivity, resetInactivityTimer, autoLogout, clearTimers, SCREEN_OFF_TIMEOUT]);

  // Professional user fetching with proper error handling
  const fetchCurrentUser = async (token, retryCount = 0) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setAuthError(null);
        resetInactivityTimer();
        setLoading(false);
      } else if (response.status === 401) {
        // Token is invalid, clear auth state
        clearAuthState();
        setLoading(false);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      
      // Retry on network errors (not auth errors)
      if (retryCount < MAX_AUTH_RETRIES && 
          (error.message.includes('fetch') || error.name === 'TypeError' || error.message.includes('NetworkError'))) {
        
        console.log(`Retrying authentication in ${AUTH_RETRY_DELAY}ms (attempt ${retryCount + 1}/${MAX_AUTH_RETRIES + 1})`);
        setTimeout(() => {
          fetchCurrentUser(token, retryCount + 1);
        }, AUTH_RETRY_DELAY);
        return;
      }
      
      // If all retries failed or it's an auth error, clear state
      setAuthError('Failed to authenticate. Please login again.');
      clearAuthState();
      setLoading(false);
    }
  };

  // Initialize authentication on mount
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        await fetchCurrentUser(storedToken);
      } else {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Professional login function with enhanced UX
  const login = async (credentials) => {
    setLoading(true);
    setAuthError(null);
    
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Store token and session
        localStorage.setItem('token', data.token);
        localStorage.setItem('sessionId', data.sessionId);
        
        // Set user state
        setToken(data.token);
        setUser(data.user);
        setAuthError(null);
        setLoading(false);
        
        // Initialize session monitoring
        resetInactivityTimer();
        
        // Success notification
        if (addNotification) {
          addNotification('success', 'Welcome back! Login successful.');
        }
        
        return { success: true, user: data.user };
      } else {
        const errorMessage = data.message || 'Login failed. Please check your credentials.';
        setAuthError(errorMessage);
        setLoading(false);
        
        // Error notification
        if (addNotification) {
          addNotification('error', errorMessage);
        }
        
        return { success: false, message: errorMessage };
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = 'Network error. Please check your connection and try again.';
      setAuthError(errorMessage);
      setLoading(false);
      
      // Error notification
      if (addNotification) {
        addNotification('error', errorMessage);
      }
      
      return { success: false, message: errorMessage };
    }
  };

  // Force login function for seamless re-authentication
  const forceLogin = async (email, password) => {
    try {
      // Clear any existing auth state first
      clearAuthState();
      
      const response = await fetch('/api/auth/force-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('sessionId', data.sessionId);
        setToken(data.token);
        setUser(data.user);
        resetInactivityTimer();
        
        if (addNotification) {
          addNotification('success', 'Authentication successful!');
        }
        
        return { success: true, user: data.user };
      } else {
        const errorMessage = data.message || 'Authentication failed';
        if (addNotification) {
          addNotification('error', errorMessage);
        }
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('Force login error:', error);
      const errorMessage = 'Network error. Please try again.';
      if (addNotification) {
        addNotification('error', errorMessage);
      }
      return { success: false, error: errorMessage };
    }
  };

  // Professional signup function
  const signup = async (userData) => {
    setLoading(true);
    setAuthError(null);
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (response.ok) {
        setLoading(false);
        
        if (addNotification) {
          addNotification('success', 'Registration successful! Please check your email for verification.');
        }
        
        return { 
          success: true, 
          requiresVerification: data.requiresVerification || false 
        };
      } else {
        const errorMessage = data.message || 'Registration failed';
        setAuthError(errorMessage);
        setLoading(false);
        
        if (addNotification) {
          addNotification('error', errorMessage);
        }
        
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('Signup error:', error);
      const errorMessage = 'Network error. Please try again.';
      setAuthError(errorMessage);
      setLoading(false);
      
      if (addNotification) {
        addNotification('error', errorMessage);
      }
      
      return { success: false, error: errorMessage };
    }
  };

  // Professional logout with smooth UX
  const logout = async (reason = 'manual') => {
    // Clear timers immediately to prevent any interference
    clearTimers();
    
    // Set loading state for visual feedback
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const sessionId = localStorage.getItem('sessionId');
      
      // Notify server about logout (but don't wait for response to block UI)
      if (token && sessionId) {
        fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ sessionId })
        }).catch(error => {
          console.log('Logout notification failed (non-critical):', error);
        });
      }
      
    } catch (error) {
      console.log('Logout request error (non-critical):', error);
    }
    
    // Clear client state immediately (don't wait for server response)
    clearAuthState();
    
    // Show appropriate notification based on logout reason
    if (addNotification) {
      switch (reason) {
        case 'inactivity':
          addNotification('warning', 'You were automatically logged out due to inactivity.');
          break;
        case 'session-expired':
          addNotification('info', 'Your session has expired. Please login again.');
          break;
        case 'force':
          addNotification('warning', 'You were logged out due to a security check.');
          break;
        default:
          addNotification('success', 'You have been successfully logged out.');
      }
    }
    
    setLoading(false);
  };

  // Get auth headers for API calls
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    };
  };

  // Context value with all auth functions
  const value = {
    user,
    token,
    loading,
    authError,
    login,
    forceLogin,
    signup,
    logout,
    autoLogout,
    clearAuthState,
    getAuthHeaders,
    resetInactivityTimer
  };

  // Professional loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-gradient-to-r from-blue-600 to-green-500 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Heart className="h-8 w-8 text-white animate-pulse" />
          </div>
          <p className="text-gray-600">Loading MedZy...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
