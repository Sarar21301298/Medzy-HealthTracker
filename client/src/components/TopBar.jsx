import React, { useState, useEffect } from 'react';
import { User, ChevronDown, LogOut, Settings, Pill, X, Shield, Store } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import ProfileManagement from './ProfileManagement';

const TopBar = ({ title, subtitle, hideProfile }) => {
  const { user, logout } = useAuth();
  const { success } = useNotification();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileDropdown && !event.target.closest('.profile-dropdown-container')) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown]);

  const handleOpenProfileModal = () => {
    setShowProfileModal(true);
    setShowProfileDropdown(false);
  };

  const handleLogout = () => {
    logout();
    success('Logged out successfully');
    setShowProfileDropdown(false);
  };

  const getRoleIcon = () => {
    switch (user?.role) {
      case 'admin':
        return Shield;
      case 'pharmacy_vendor':
        return Store;
      case 'customer':
        return User;
      default:
        return User;
    }
  };

  const RoleIcon = getRoleIcon();

  const getRoleLabel = () => {
    switch (user?.role) {
      case 'admin':
        return 'Administrator';
      case 'pharmacy_vendor':
        return 'Vendor';
      case 'customer':
        return 'Customer';
      default:
        return 'User';
    }
  };

  const getWelcomeMessage = () => {
    switch (user?.role) {
      case 'admin':
        return title || 'Admin Dashboard';
      case 'pharmacy_vendor':
        return title || 'Vendor Dashboard';
      case 'customer':
        return title || 'Customer Dashboard';
      default:
        return title || 'Dashboard';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-green-500 to-healthcare-green-500 p-2 rounded-lg">
              <Pill className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {getWelcomeMessage()}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {subtitle || `Welcome back, ${user?.firstName} ${user?.lastName}`}
              </p>
            </div>
          </div>
        </div>
        
        {/* Profile Section */}
        {!hideProfile && (
          <div className="flex items-center space-x-4">
          {/* Profile Dropdown */}
          <div className="relative profile-dropdown-container">
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
            >
              <div className="bg-gradient-to-r from-healthcare-green-500 to-purple-500 p-2 rounded-full">
                <RoleIcon className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {getRoleLabel()}
                </p>
              </div>
              <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Profile Dropdown Menu */}
            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700 z-50">
                {/* Quick Actions */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-600">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-gradient-to-r from-healthcare-green-500 to-purple-500 p-3 rounded-full">
                    <RoleIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {user?.firstName} {user?.lastName}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {user?.email}
                      </p>
                      <p className="text-xs text-healthcare-green-600 dark:text-healthcare-green-400 font-medium">
                        {getRoleLabel()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={handleOpenProfileModal}
                      className="flex-1 flex items-center justify-center space-x-2 bg-healthcare-green-50 dark:bg-healthcare-green-900/20 text-healthcare-green-600 dark:text-healthcare-green-400 px-3 py-2 rounded-lg hover:bg-healthcare-green-100 dark:hover:bg-healthcare-green-900/30 transition-colors text-sm"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Edit Profile</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex-1 flex items-center justify-center space-x-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>

                {/* Compact Profile Summary */}
                <div className="p-4">
                  <div className="space-y-3">
                    <div className="text-center">
                      <h4 className="font-medium text-gray-900 dark:text-white">Profile Settings</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Quick access to your profile</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-center">
                        <User className="h-5 w-5 mx-auto text-healthcare-green-600 dark:text-healthcare-green-400 mb-1" />
                        <p className="text-xs text-gray-600 dark:text-gray-400">Account Status</p>
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">Active</p>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-center">
                        <Settings className="h-5 w-5 mx-auto text-healthcare-green-600 dark:text-healthcare-green-400 mb-1" />
                        <p className="text-xs text-gray-600 dark:text-gray-400">Last Login</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Today</p>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                      <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                        Click "Edit Profile" above to access full profile management
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          </div>
        )}
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Profile Management
              </h2>
              <button
                onClick={() => setShowProfileModal(false)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <ProfileManagement />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopBar;

