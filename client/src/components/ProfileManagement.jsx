import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Building, 
  Shield, 
  Camera, 
  Save, 
  Eye, 
  EyeOff,
  Edit3,
  Lock,
  Star,
  MessageCircle,
  Award,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useDarkMode } from '../context/DarkModeContext';
import MapComponent from './MapComponent';
import LoadingSpinner from './LoadingSpinner';

const ProfileManagement = () => {
  const { isDarkMode } = useDarkMode();
  const { user, getAuthHeaders } = useAuth();
  const { showNotification } = useNotification();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [vendorReviews, setVendorReviews] = useState({ reviews: [], stats: { averageRating: 0, totalReviews: 0 } });
  
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    profilePicture: '',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Bangladesh',
      latitude: null,
      longitude: null
    },
    businessInfo: {
      pharmacyName: '',
      licenseNumber: '',
      businessType: 'pharmacy',
      yearsInOperation: null
    }
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Fetch profile data
  useEffect(() => {
    fetchProfile();
    if (user?.role === 'pharmacy_vendor') {
      fetchVendorReviews();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/profile', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setFormData({
          firstName: data.profile.firstName || '',
          lastName: data.profile.lastName || '',
          phone: data.profile.phone || '',
          dateOfBirth: data.profile.dateOfBirth ? data.profile.dateOfBirth.split('T')[0] : '',
          gender: data.profile.gender || '',
          profilePicture: data.profile.profilePicture || '',
          address: {
            street: data.profile.address?.street || '',
            city: data.profile.address?.city || '',
            state: data.profile.address?.state || '',
            postalCode: data.profile.address?.postalCode || '',
            country: data.profile.address?.country || 'Bangladesh',
            latitude: data.profile.address?.latitude || null,
            longitude: data.profile.address?.longitude || null
          },
          businessInfo: {
            pharmacyName: data.profile.businessInfo?.pharmacyName || '',
            licenseNumber: data.profile.businessInfo?.licenseNumber || '',
            businessType: data.profile.businessInfo?.businessType || 'pharmacy',
            yearsInOperation: data.profile.businessInfo?.yearsInOperation || null
          }
        });
      } else {
        throw new Error('Failed to fetch profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      showNotification('Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorReviews = async () => {
    try {
      const response = await fetch('/api/reviews/vendor/my-reviews', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setVendorReviews({
          reviews: data.reviews || [],
          stats: data.stats || { averageRating: 0, totalReviews: 0 }
        });
      } else {
        console.error('Failed to fetch vendor reviews');
      }
    } catch (error) {
      console.error('Error fetching vendor reviews:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleLocationSelect = (locationData) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        ...locationData
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setProfile(data.profile);
        showNotification('Profile updated successfully!', 'success');
      } else {
        throw new Error(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showNotification(error.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showNotification('New passwords do not match', 'error');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showNotification('New password must be at least 6 characters long', 'error');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/profile/change-password', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setShowPasswordForm(false);
        showNotification('Password changed successfully!', 'success');
      } else {
        throw new Error(data.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      showNotification(error.message || 'Failed to change password', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'address', label: 'Address', icon: MapPin },
    ...(user?.role === 'pharmacy_vendor' ? [
      { id: 'business', label: 'Business Info', icon: Building },
      { id: 'reviews', label: 'My Reviews', icon: Star }
    ] : []),
    { id: 'security', label: 'Security', icon: Shield }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-r from-healthcare-green-600 to-green-500 rounded-full flex items-center justify-center">
              {formData.profilePicture ? (
                <img 
                  src={formData.profilePicture} 
                  alt="Profile" 
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <User className="h-10 w-10 text-white" />
              )}
            </div>
            <button className="absolute -bottom-1 -right-1 bg-healthcare-green-600 text-white p-2 rounded-full hover:bg-healthcare-green-700 transition-colors">
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {profile?.firstName} {profile?.lastName}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">{profile?.email}</p>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-healthcare-green-100 text-healthcare-green-800 dark:bg-healthcare-green-900 dark:text-healthcare-green-300 mt-2">
              {profile?.role?.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm">
        <div className="border-b border-gray-200 dark:border-gray-600">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-healthcare-green-500 text-healthcare-green-600 dark:text-healthcare-green-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit}>
            {/* Personal Info Tab */}
            {activeTab === 'personal' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Personal Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      First Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-healthcare-green-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Last Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-healthcare-green-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-healthcare-green-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date of Birth
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-healthcare-green-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-healthcare-green-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        type="email"
                        value={profile?.email}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded-lg cursor-not-allowed"
                        disabled
                      />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Email address cannot be changed
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Address Tab */}
            {activeTab === 'address' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Address Information
                </h3>
                
                <div className="space-y-6">
                  {/* Map Component */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select Location on Map
                    </label>
                    <MapComponent
                      address={formData.address}
                      onLocationSelect={handleLocationSelect}
                      height="350px"
                    />
                  </div>

                  {/* Address Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Street Address
                      </label>
                      <input
                        type="text"
                        name="address.street"
                        value={formData.address.street}
                        onChange={handleInputChange}
                        placeholder="House number, street name"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-healthcare-green-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        name="address.city"
                        value={formData.address.city}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-healthcare-green-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        State/Division *
                      </label>
                      <input
                        type="text"
                        name="address.state"
                        value={formData.address.state}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-healthcare-green-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Postal Code *
                      </label>
                      <input
                        type="text"
                        name="address.postalCode"
                        value={formData.address.postalCode}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-healthcare-green-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Country
                      </label>
                      <input
                        type="text"
                        name="address.country"
                        value={formData.address.country}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-healthcare-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {formData.address.latitude && formData.address.longitude && (
                    <div className="bg-healthcare-green-50 dark:bg-healthcare-green-900/20 p-4 rounded-lg">
                      <p className="text-sm text-healthcare-green-800 dark:text-healthcare-green-200">
                        <MapPin className="inline h-4 w-4 mr-1" />
                        Location: {formData.address.latitude.toFixed(6)}, {formData.address.longitude.toFixed(6)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Business Info Tab (Vendors only) */}
            {activeTab === 'business' && user?.role === 'pharmacy_vendor' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Business Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Pharmacy Name
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        name="businessInfo.pharmacyName"
                        value={formData.businessInfo.pharmacyName}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-healthcare-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      License Number
                    </label>
                    <input
                      type="text"
                      name="businessInfo.licenseNumber"
                      value={formData.businessInfo.licenseNumber}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-healthcare-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Business Type
                    </label>
                    <select
                      name="businessInfo.businessType"
                      value={formData.businessInfo.businessType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-healthcare-green-500 focus:border-transparent"
                    >
                      <option value="pharmacy">Pharmacy</option>
                      <option value="medical_store">Medical Store</option>
                      <option value="hospital">Hospital</option>
                      <option value="clinic">Clinic</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Years in Operation
                    </label>
                    <input
                      type="number"
                      name="businessInfo.yearsInOperation"
                      value={formData.businessInfo.yearsInOperation || ''}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-healthcare-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Reviews Tab (Vendors only) */}
            {activeTab === 'reviews' && user?.role === 'pharmacy_vendor' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Customer Reviews & Ratings
                </h3>
                
                {/* Review Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-yellow-100 text-sm font-medium">Average Rating</p>
                        <p className="text-3xl font-bold">{vendorReviews.stats.averageRating?.toFixed(1) || '0.0'}</p>
                        <div className="flex items-center mt-2">
                          {[...Array(5)].map((_, index) => (
                            <Star
                              key={index}
                              className={`h-4 w-4 ${
                                index < Math.round(vendorReviews.stats.averageRating || 0)
                                  ? 'text-yellow-200 fill-current'
                                  : 'text-yellow-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <Award className="h-12 w-12 text-yellow-200" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-healthcare-green-500 to-healthcare-green-600 rounded-2xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-healthcare-green-100 text-sm font-medium">Total Reviews</p>
                        <p className="text-3xl font-bold">{vendorReviews.stats.totalReviews || 0}</p>
                        <p className="text-healthcare-green-200 text-sm">All time</p>
                      </div>
                      <MessageCircle className="h-12 w-12 text-healthcare-green-200" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm font-medium">Rating Trend</p>
                        <p className="text-3xl font-bold">
                          {vendorReviews.stats.averageRating >= 4 ? '↗️' : vendorReviews.stats.averageRating >= 3 ? '➡️' : '↘️'}
                        </p>
                        <p className="text-green-200 text-sm">
                          {vendorReviews.stats.averageRating >= 4 ? 'Excellent' : vendorReviews.stats.averageRating >= 3 ? 'Good' : 'Needs Improvement'}
                        </p>
                      </div>
                      <TrendingUp className="h-12 w-12 text-green-200" />
                    </div>
                  </div>
                </div>

                {/* Recent Reviews */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl shadow-lg">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-600">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Customer Reviews</h4>
                  </div>

                  {vendorReviews.reviews.length > 0 ? (
                    <div className="p-6 space-y-6">
                      {vendorReviews.reviews.slice(0, 5).map((review) => (
                        <div key={review._id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-600">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-healthcare-green-500 to-purple-500 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                  {review.user?.firstName} {review.user?.lastName}
                                </h4>
                                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                                  <Calendar className="h-4 w-4" />
                                  <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {[...Array(5)].map((_, index) => (
                                <Star
                                  key={index}
                                  className={`h-4 w-4 ${
                                    index < review.rating
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                              <span className="font-bold text-yellow-600 dark:text-yellow-400">
                                {review.rating}/5
                              </span>
                            </div>
                          </div>

                          <div className="mb-4">
                            <h5 className="font-semibold text-gray-900 dark:text-white mb-2">
                              {review.title}
                            </h5>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                              {review.comment}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
                            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                              <span>Medicine: {review.medicine?.name}</span>
                              <span>•</span>
                              <span>Order #{review.order?.trackingId}</span>
                            </div>
                            {review.isVerified && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                                ✓ Verified Purchase
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 text-center">
                      <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Reviews Yet</h4>
                      <p className="text-gray-600 dark:text-gray-400">
                        Start selling medicines to receive customer reviews and build your reputation.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Security Settings
                </h3>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          Password
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Last changed: {new Date(profile?.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPasswordForm(!showPasswordForm)}
                        className="px-4 py-2 bg-healthcare-green-600 text-white rounded-lg hover:bg-healthcare-green-700 transition-colors flex items-center gap-2"
                      >
                        <Lock className="h-4 w-4" />
                        Change Password
                      </button>
                    </div>
                  </div>

                  {showPasswordForm && (
                    <form onSubmit={handlePasswordChange} className="space-y-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Current Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <input
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                            className="w-full pl-10 pr-12 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-healthcare-green-500 focus:border-transparent"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                          >
                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          New Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                            className="w-full pl-10 pr-12 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-healthcare-green-500 focus:border-transparent"
                            required
                            minLength="6"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                          >
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <input
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-healthcare-green-500 focus:border-transparent"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                          {saving ? 'Changing...' : 'Change Password'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowPasswordForm(false);
                            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                          }}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* Save Button */}
            {activeTab !== 'security' && (
              <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-healthcare-green-600 text-white rounded-lg hover:bg-healthcare-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileManagement;

