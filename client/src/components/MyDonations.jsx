import React, { useState, useEffect } from 'react';
import { Trash2, Edit2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import Modal from './Modal';
import PhotoSlideshow from './PhotoSlideshow';
import PhotoViewerModal from './PhotoViewerModal';

const MyDonations = () => {
  const { getAuthHeaders } = useAuth();
  const [donations, setDonations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', message: '', type: 'success' });
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [viewingPhotos, setViewingPhotos] = useState(null);
  const [photoViewerIndex, setPhotoViewerIndex] = useState(0);

  useEffect(() => {
    fetchDonations();
  }, [filter, pagination.current]);

  const fetchDonations = async (page = 1) => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        status: filter
      });

      const response = await fetch(`/api/donations/my-donations?${queryParams}`, {
        headers: getAuthHeaders()
      });

      const data = await response.json();

      if (data.success) {
        setDonations(data.data.donations);
        setPagination(data.data.pagination);
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

  const viewDonationDetails = (donation) => {
    setSelectedDonation(donation);
    setShowDetailsModal(true);
  };

  const handleDeleteDonation = async (donationId) => {
    if (!window.confirm('Are you sure you want to delete this donation? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/donations/${donationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });

      const data = await response.json();

      if (data.success) {
        setModalContent({
          title: 'Success',
          message: 'Donation deleted successfully',
          type: 'success'
        });
        setShowModal(true);
        fetchDonations();
      } else {
        throw new Error(data.message || 'Failed to delete donation');
      }
    } catch (error) {
      console.error('Error deleting donation:', error);
      setModalContent({
        title: 'Error',
        message: error.message || 'Failed to delete donation',
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      case 'approved': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      case 'rejected': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      case 'claimed': return 'text-healthcare-green-600 bg-healthcare-green-100 dark:bg-healthcare-green-900 dark:text-healthcare-green-200';
      case 'completed': return 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getRequestStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      case 'approved': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      case 'rejected': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      case 'completed': return 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          My Medicine Donations
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Manage your donated medicines and view requests from others.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8">
            {['all', 'pending', 'approved', 'rejected', 'claimed', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setFilter(status);
                  setPagination(prev => ({ ...prev, current: 1 }));
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  filter === status
                    ? 'border-healthcare-green-500 text-healthcare-green-600 dark:text-healthcare-green-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {status === 'all' ? 'All Donations' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </nav>
        </div>
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
            {filter === 'all' 
              ? "You haven't donated any medicines yet. Start helping others by donating unused medicines!"
              : `No donations with status '${filter}' found.`
            }
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {donations.map((donation) => (
              <div key={donation._id} className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden shadow-md">
                {/* Photo Slideshow */}
                <div className="h-48">
                  <PhotoSlideshow
                    photos={donation.photos}
                    donationName={donation.medicineName}
                    onPhotoClick={(index) => {
                      setViewingPhotos(donation);
                      setPhotoViewerIndex(index);
                    }}
                  />
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
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
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(donation.status)}`}>
                      {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-gray-700 dark:text-gray-200">
                      <span className="font-medium">Dosage:</span> {donation.dosage}
                    </p>
                    <p className="text-gray-700 dark:text-gray-200">
                      <span className="font-medium">Form:</span> {donation.form.charAt(0).toUpperCase() + donation.form.slice(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-700 dark:text-gray-200">
                      <span className="font-medium">Quantity:</span> {donation.quantity} {donation.unit}
                    </p>
                    <p className="text-gray-700 dark:text-gray-200">
                      <span className="font-medium">Available:</span> {donation.availableQuantity} {donation.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-700 dark:text-gray-200">
                      <span className="font-medium">Expires:</span> {formatDate(donation.expiryDate)}
                    </p>
                    <p className="text-gray-700 dark:text-gray-200">
                      <span className="font-medium">Posted:</span> {formatDate(donation.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Requests Summary */}
                {donation.claims && donation.claims.length > 0 && (
                  <div className="mb-4 p-4 bg-white dark:bg-gray-600 rounded-lg">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Requests ({donation.claims.length})
                    </h4>
                    <div className="space-y-2">
                      {donation.claims.slice(0, 3).map((claim, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="text-gray-700 dark:text-gray-200">
                            {claim.requester.firstName} {claim.requester.lastName} - {claim.requestedQuantity} {donation.unit}
                          </span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRequestStatusColor(claim.status)}`}>
                            {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                          </span>
                        </div>
                      ))}
                      {donation.claims.length > 3 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          +{donation.claims.length - 3} more requests
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Admin Review */}
                {donation.adminReview && donation.adminReview.reviewedAt && (
                  <div className="mb-4 p-4 bg-healthcare-green-50 dark:bg-healthcare-green-900/20 rounded-lg">
                    <h4 className="font-semibold text-healthcare-green-900 dark:text-healthcare-green-100 mb-2">
                      Admin Review
                    </h4>
                    <p className="text-sm text-healthcare-green-800 dark:text-healthcare-green-200">
                      <span className="font-medium">Reviewed on:</span> {formatDate(donation.adminReview.reviewedAt)}
                    </p>
                    {donation.adminReview.comments && (
                      <p className="text-sm text-healthcare-green-800 dark:text-healthcare-green-200 mt-1">
                        <span className="font-medium">Comments:</span> {donation.adminReview.comments}
                      </p>
                    )}
                    {donation.adminReview.rejectionReason && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                        <span className="font-medium">Rejection Reason:</span> {donation.adminReview.rejectionReason}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => viewDonationDetails(donation)}
                    className="px-4 py-2 bg-healthcare-green-600 text-white rounded-lg hover:bg-healthcare-green-700 focus:outline-none focus:ring-2 focus:ring-healthcare-green-500 transition-colors"
                  >
                    View Details
                  </button>
                  {donation.status === 'pending' && (
                    <button
                      onClick={() => {
                        setSelectedDonation(donation);
                        setShowDetailsModal(true);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                  )}
                  {(donation.status === 'pending' || donation.claims?.length === 0) && (
                    <button
                      onClick={() => handleDeleteDonation(donation._id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  )}
                </div>
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

      {/* Donation Details Modal */}
      {showDetailsModal && selectedDonation && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title="Donation Details"
          type="info"
          size="large"
        >
          <div className="space-y-6">
            {/* Medicine Information */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Medicine Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Medicine Name</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedDonation.medicineName}</p>
                </div>
                {selectedDonation.genericName && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Generic Name</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedDonation.genericName}</p>
                  </div>
                )}
                {selectedDonation.brand && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Brand</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedDonation.brand}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Dosage</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedDonation.dosage}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Form</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedDonation.form}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Quantity</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedDonation.quantity} {selectedDonation.unit}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Condition</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedDonation.condition}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Expiry Date</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formatDate(selectedDonation.expiryDate)}</p>
                </div>
              </div>
              
              {selectedDonation.description && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300">Description</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedDonation.description}</p>
                </div>
              )}
            </div>

            {/* All Requests */}
            {selectedDonation.claims && selectedDonation.claims.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  All Requests ({selectedDonation.claims.length})
                </h4>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {selectedDonation.claims.map((claim, index) => (
                    <div key={index} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {claim.requester.firstName} {claim.requester.lastName}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {claim.requester.email}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRequestStatusColor(claim.status)}`}>
                          {claim.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Requested Quantity</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {claim.requestedQuantity} {selectedDonation.unit}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Urgency</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {claim.urgency.charAt(0).toUpperCase() + claim.urgency.slice(1)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Contact</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {claim.contact.phone}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Requested On</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {formatDate(claim.requestedAt)}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Reason</p>
                        <p className="font-medium text-gray-900 dark:text-white">{claim.reason}</p>
                      </div>
                      
                      {claim.message && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600 dark:text-gray-300">Message</p>
                          <p className="font-medium text-gray-900 dark:text-white">{claim.message}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
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

      {/* Photo Viewer Modal */}
      {viewingPhotos && (
        <PhotoViewerModal
          photos={viewingPhotos.photos}
          initialIndex={photoViewerIndex}
          donationName={viewingPhotos.medicineName}
          onClose={() => setViewingPhotos(null)}
        />
      )}
    </div>
  );
};

export default MyDonations;

