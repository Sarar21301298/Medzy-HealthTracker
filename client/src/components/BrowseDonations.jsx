import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import Modal from './Modal';
import PhotoSlideshow from './PhotoSlideshow';
import PhotoViewerModal from './PhotoViewerModal';

const BrowseDonations = () => {
  const { getAuthHeaders, user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    city: '',
    form: 'all',
    priority: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });
  const [availableCities, setAvailableCities] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', message: '', type: 'success' });
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    requestedQuantity: '',
    reason: '',
    urgency: 'medium',
    contact: {
      phone: '',
      email: ''
    },
    pickupPreference: 'pickup',
    message: ''
  });
  const [viewingPhotos, setViewingPhotos] = useState(null);
  const [photoViewerIndex, setPhotoViewerIndex] = useState(0);

  useEffect(() => {
    fetchDonations();
  }, []); // Only fetch on mount

  // Handle filter and pagination changes
  useEffect(() => {
    if (pagination.current > 1 || Object.keys(filters).some(key => filters[key] !== '')) {
      fetchDonations(pagination.current);
    }
  }, [filters]); // Re-fetch when filters change

  const fetchDonations = async (page = 1) => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...filters
      });

      const response = await fetch(`/api/donations/browse?${queryParams}`, {
        headers: getAuthHeaders()
      });

      const data = await response.json();

      if (data.success) {
        setDonations(data.data.donations);
        setPagination(data.data.pagination);
        setAvailableCities(data.data.filters.cities);
      } else {
        throw new Error(data.message || 'Failed to fetch donations');
      }
    } catch (error) {
      console.error('Error fetching donations:', error);
      setModalContent({
        title: 'Error',
        message: error.message || 'Failed to load donations',
        type: 'error'
      });
      setShowModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleRequestDonation = async (donation) => {
    setSelectedDonation(donation);
    setRequestForm({
      requestedQuantity: '',
      reason: '',
      urgency: 'medium',
      contact: {
        phone: user.phone || '',
        email: user.email || ''
      },
      pickupPreference: 'pickup',
      message: ''
    });
    setShowRequestModal(true);
  };

  const submitRequest = async () => {
    try {
      if (!requestForm.requestedQuantity || !requestForm.reason) {
        setModalContent({
          title: 'Validation Error',
          message: 'Please fill in all required fields.',
          type: 'error'
        });
        setShowModal(true);
        return;
      }

      if (parseInt(requestForm.requestedQuantity) > selectedDonation.availableQuantity) {
        setModalContent({
          title: 'Invalid Quantity',
          message: 'Requested quantity exceeds available quantity.',
          type: 'error'
        });
        setShowModal(true);
        return;
      }

      const response = await fetch(`/api/donations/${selectedDonation._id}/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(requestForm)
      });

      const data = await response.json();

      if (data.success) {
        setModalContent({
          title: 'Request Submitted',
          message: 'Your request has been submitted successfully. The donor will be contacted.',
          type: 'success'
        });
        setShowModal(true);
        setShowRequestModal(false);
        fetchDonations(pagination.current); // Refresh the list
      } else {
        throw new Error(data.message || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      setModalContent({
        title: 'Error',
        message: error.message || 'Failed to submit request',
        type: 'error'
      });
      setShowModal(true);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysUntilExpiry = (expiryDate) => {
    const days = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      case 'normal': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Browse Medicine Donations
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Find and request medicine donations from verified donors in your area.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Medicine
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search by name, brand..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-healthcare-green-500 dark:bg-gray-600 dark:text-white dark:border-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              City
            </label>
            <select
              value={filters.city}
              onChange={(e) => handleFilterChange('city', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-healthcare-green-500 dark:bg-gray-600 dark:text-white dark:border-gray-500"
            >
              <option value="">All Cities</option>
              {availableCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Form
            </label>
            <select
              value={filters.form}
              onChange={(e) => handleFilterChange('form', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-healthcare-green-500 dark:bg-gray-600 dark:text-white dark:border-gray-500"
            >
              <option value="all">All Forms</option>
              <option value="tablet">Tablet</option>
              <option value="capsule">Capsule</option>
              <option value="syrup">Syrup</option>
              <option value="injection">Injection</option>
              <option value="cream">Cream</option>
              <option value="drops">Drops</option>
              <option value="inhaler">Inhaler</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sort By
            </label>
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                handleFilterChange('sortBy', sortBy);
                handleFilterChange('sortOrder', sortOrder);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-healthcare-green-500 dark:bg-gray-600 dark:text-white dark:border-gray-500"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="expiryDate-asc">Expiry Date (Soon)</option>
              <option value="expiryDate-desc">Expiry Date (Later)</option>
              <option value="priority-desc">Priority (High)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mb-4 flex justify-between items-center">
        <p className="text-gray-600 dark:text-gray-300">
          {pagination.total} donation{pagination.total !== 1 ? 's' : ''} found
        </p>
      </div>

      {donations.length === 0 ? (
        <div className="text-center py-12">
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-6.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-2.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 009.586 13H3" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No donations found
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Try adjusting your search filters to find more donations.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {donations.map((donation) => (
              <div key={donation._id} className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                {/* Photo Gallery */}
                <PhotoSlideshow
                  photos={donation.photos}
                  donationName={donation.medicineName}
                  onPhotoClick={(index) => {
                    setViewingPhotos(donation);
                    setPhotoViewerIndex(index);
                  }}
                />

                <div className="p-6">
                  {/* Priority Badge */}
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(donation.priority)}`}>
                      {donation.priority.charAt(0).toUpperCase() + donation.priority.slice(1)} Priority
                    </span>
                    {donation.unopened && (
                      <span className="px-2 py-1 text-xs font-semibold bg-healthcare-green-100 text-healthcare-green-800 rounded-full dark:bg-healthcare-green-900 dark:text-healthcare-green-200">
                        Unopened
                      </span>
                    )}
                  </div>

                  {/* Medicine Info */}
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {donation.medicineName}
                  </h3>
                  
                  {donation.genericName && (
                    <p className="text-gray-600 dark:text-gray-300 mb-1">
                      Generic: {donation.genericName}
                    </p>
                  )}
                  
                  {donation.brand && (
                    <p className="text-gray-600 dark:text-gray-300 mb-1">
                      Brand: {donation.brand}
                    </p>
                  )}

                <div className="space-y-2 mb-4">
                  <p className="text-gray-700 dark:text-gray-200">
                    <span className="font-medium">Dosage:</span> {donation.dosage}
                  </p>
                  <p className="text-gray-700 dark:text-gray-200">
                    <span className="font-medium">Form:</span> {donation.form.charAt(0).toUpperCase() + donation.form.slice(1)}
                  </p>
                  <p className="text-gray-700 dark:text-gray-200">
                    <span className="font-medium">Available:</span> {donation.availableQuantity} {donation.unit}
                  </p>
                  <p className="text-gray-700 dark:text-gray-200">
                    <span className="font-medium">Condition:</span> {donation.condition.charAt(0).toUpperCase() + donation.condition.slice(1)}
                  </p>
                  <p className="text-gray-700 dark:text-gray-200">
                    <span className="font-medium">Expires:</span> {formatDate(donation.expiryDate)}
                    <span className={`ml-2 text-sm ${getDaysUntilExpiry(donation.expiryDate) <= 30 ? 'text-red-600' : 'text-gray-500'}`}>
                      ({getDaysUntilExpiry(donation.expiryDate)} days)
                    </span>
                  </p>
                  <p className="text-gray-700 dark:text-gray-200">
                    <span className="font-medium">Location:</span> {donation.pickupLocation.city}
                  </p>
                </div>

                {donation.description && (
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                    {donation.description}
                  </p>
                )}

                {/* Donor Info */}
                <div className="mb-4 p-3 bg-white dark:bg-gray-600 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Donated by:</span> {donation.donor.firstName} {donation.donor.lastName}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Posted:</span> {formatDate(donation.createdAt)}
                  </p>
                </div>

                {/* Request Button */}
                <button
                  onClick={() => handleRequestDonation(donation)}
                  disabled={donation.availableQuantity === 0}
                  className="w-full py-2 px-4 bg-healthcare-green-600 text-white rounded-lg hover:bg-healthcare-green-700 focus:outline-none focus:ring-2 focus:ring-healthcare-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {donation.availableQuantity === 0 ? 'Not Available' : 'Request Medicine'}
                </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-8 flex justify-center">
              <div className="flex space-x-2">
                <button
                  onClick={() => fetchDonations(pagination.current - 1)}
                  disabled={pagination.current === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  Previous
                </button>
                
                <span className="px-3 py-2 text-gray-700 dark:text-gray-300">
                  Page {pagination.current} of {pagination.pages}
                </span>
                
                <button
                  onClick={() => fetchDonations(pagination.current + 1)}
                  disabled={pagination.current === pagination.pages}
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Photo Viewer Modal */}
      {viewingPhotos && (
        <PhotoViewerModal
          photos={viewingPhotos.photos}
          initialIndex={photoViewerIndex}
          donationName={viewingPhotos.medicineName}
          onClose={() => setViewingPhotos(null)}
        />
      )}

      {/* Request Modal */}
      {showRequestModal && selectedDonation && (
        <Modal
          isOpen={showRequestModal}
          onClose={() => setShowRequestModal(false)}
          title="Request Medicine Donation"
          type="info"
        >
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {selectedDonation.medicineName}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Available: {selectedDonation.availableQuantity} {selectedDonation.unit}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Requested Quantity *
              </label>
              <input
                type="number"
                min="1"
                max={selectedDonation.availableQuantity}
                value={requestForm.requestedQuantity}
                onChange={(e) => setRequestForm(prev => ({ ...prev, requestedQuantity: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-healthcare-green-500 dark:bg-gray-600 dark:text-white dark:border-gray-500"
                placeholder="Enter quantity needed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason for Request *
              </label>
              <textarea
                rows="3"
                value={requestForm.reason}
                onChange={(e) => setRequestForm(prev => ({ ...prev, reason: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-healthcare-green-500 dark:bg-gray-600 dark:text-white dark:border-gray-500"
                placeholder="Explain why you need this medicine"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Urgency Level
              </label>
              <select
                value={requestForm.urgency}
                onChange={(e) => setRequestForm(prev => ({ ...prev, urgency: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-healthcare-green-500 dark:bg-gray-600 dark:text-white dark:border-gray-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={requestForm.contact.phone}
                  onChange={(e) => setRequestForm(prev => ({ 
                    ...prev, 
                    contact: { ...prev.contact, phone: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-healthcare-green-500 dark:bg-gray-600 dark:text-white dark:border-gray-500"
                  placeholder="Your phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={requestForm.contact.email}
                  onChange={(e) => setRequestForm(prev => ({ 
                    ...prev, 
                    contact: { ...prev.contact, email: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-healthcare-green-500 dark:bg-gray-600 dark:text-white dark:border-gray-500"
                  placeholder="Your email address"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Additional Message
              </label>
              <textarea
                rows="2"
                value={requestForm.message}
                onChange={(e) => setRequestForm(prev => ({ ...prev, message: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-healthcare-green-500 dark:bg-gray-600 dark:text-white dark:border-gray-500"
                placeholder="Any additional information for the donor"
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button
                onClick={() => setShowRequestModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-healthcare-green-500 dark:border-gray-500 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={submitRequest}
                className="px-4 py-2 bg-healthcare-green-600 text-white rounded-lg hover:bg-healthcare-green-700 focus:outline-none focus:ring-2 focus:ring-healthcare-green-500"
              >
                Submit Request
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Success/Error Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={modalContent.title}
          type={modalContent.type}
        >
          <p className="text-gray-600 dark:text-gray-300">
            {modalContent.message}
          </p>
        </Modal>
      )}
    </div>
  );
};

export default BrowseDonations;

