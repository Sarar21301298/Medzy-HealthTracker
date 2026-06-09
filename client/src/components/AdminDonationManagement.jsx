import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, MapPin, Calendar, Pill, Trash2, Edit } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Modal from './Modal';
import PhotoSlideshow from './PhotoSlideshow';
import PhotoViewerModal from './PhotoViewerModal';

const AdminDonationManagement = () => {
  const { getAuthHeaders } = useAuth();
  const [donations, setDonations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', message: '', type: 'success' });
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [viewingPhotos, setViewingPhotos] = useState(null);
  const [photoViewerIndex, setPhotoViewerIndex] = useState(0);

  useEffect(() => {
    fetchDonations();
  }, [filterStatus]);

  const fetchDonations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/donations/admin?status=${filterStatus}`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();

      if (data.success) {
        console.log('📦 Fetched donations:', data.data);
        console.log('📷 First donation photos:', data.data?.[0]?.photos);
        setDonations(data.data || []);
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

  const handleApproveDonation = async (donationId) => {
    try {
      const response = await fetch(`/api/donations/admin/${donationId}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          comments: 'Approved by admin'
        })
      });

      const data = await response.json();

      if (data.success) {
        setModalContent({
          title: 'Success',
          message: 'Donation approved successfully',
          type: 'success'
        });
        setShowModal(true);
        setShowDetailModal(false);
        fetchDonations();
      } else {
        throw new Error(data.message || 'Failed to approve donation');
      }
    } catch (error) {
      console.error('Error approving donation:', error);
      setModalContent({
        title: 'Error',
        message: error.message || 'Failed to approve donation',
        type: 'error'
      });
      setShowModal(true);
    }
  };

  const handleRejectDonation = async (donationId) => {
    if (!rejectionReason.trim()) {
      setModalContent({
        title: 'Validation Error',
        message: 'Please provide a reason for rejection',
        type: 'error'
      });
      setShowModal(true);
      return;
    }

    try {
      const response = await fetch(`/api/donations/admin/${donationId}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          rejectionReason: rejectionReason
        })
      });

      const data = await response.json();

      if (data.success) {
        setModalContent({
          title: 'Success',
          message: 'Donation rejected successfully',
          type: 'success'
        });
        setShowModal(true);
        setShowDetailModal(false);
        setRejectionReason('');
        fetchDonations();
      } else {
        throw new Error(data.message || 'Failed to reject donation');
      }
    } catch (error) {
      console.error('Error rejecting donation:', error);
      setModalContent({
        title: 'Error',
        message: error.message || 'Failed to reject donation',
        type: 'error'
      });
      setShowModal(true);
    }
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
        setShowDetailModal(false);
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

  const viewDonationDetails = (donation) => {
    setSelectedDonation(donation);
    setShowDetailModal(true);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysUntilExpiry = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-healthcare-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalContent.title}
        message={modalContent.message}
        type={modalContent.type}
      />

      {/* Filter Tabs */}
      <div className="flex gap-4 mb-6">
        {['pending', 'approved', 'rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              filterStatus === status
                ? 'bg-healthcare-green-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Donations Table */}
      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {donations.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <Pill className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No {filterStatus} donations found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Medicine</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Donor</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Quantity</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Expiry</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Location</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Photos</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {donations.map((donation) => {
                const daysUntilExpiry = getDaysUntilExpiry(donation.expiryDate);
                return (
                  <tr key={donation._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{donation.medicineName}</p>
                        {donation.dosage && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">{donation.dosage}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900 dark:text-white">
                        {donation.donor?.firstName} {donation.donor?.lastName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{donation.donor?.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900 dark:text-white">
                        {donation.quantity} {donation.unit}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-gray-900 dark:text-white">{formatDate(donation.expiryDate)}</p>
                        <p
                          className={`text-sm font-semibold ${
                            daysUntilExpiry <= 30 ? 'text-red-600' : 'text-green-600'
                          }`}
                        >
                          {daysUntilExpiry} days
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900 dark:text-white">{donation.pickupLocation?.city}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-semibold">
                        {donation.photos?.length || 0} photos
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => viewDonationDetails(donation)}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition text-gray-600 dark:text-gray-400"
                          title="View details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        {filterStatus === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveDonation(donation._id)}
                              className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition text-green-600 dark:text-green-400"
                              title="Approve"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedDonation(donation);
                                setShowDetailModal(true);
                              }}
                              className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition text-red-600 dark:text-red-400"
                              title="Reject"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDeleteDonation(donation._id)}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition text-red-600 dark:text-red-400"
                          title="Delete donation"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedDonation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedDonation.medicineName}
              </h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setRejectionReason('');
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Photos */}
              {selectedDonation.photos && selectedDonation.photos.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Photos ({selectedDonation.photos.length})</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {selectedDonation.photos.map((photo, idx) => {
                      // Construct proper backend URL for images
                      const imageUrl = photo.url?.startsWith('http') 
                        ? photo.url 
                        : `http://localhost:5000${photo.url}`;
                      
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            setViewingPhotos(selectedDonation);
                            setPhotoViewerIndex(idx);
                          }}
                          className="relative group cursor-pointer rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all"
                        >
                          <img
                            src={imageUrl}
                            alt={`Donation photo ${idx + 1}`}
                            className="w-full h-32 object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              console.error(`Image failed to load: ${imageUrl}`);
                              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999" font-size="14"%3EImage not found%3C/text%3E%3C/svg%3E';
                            }}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                            <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate px-1">{photo.url}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {(!selectedDonation.photos || selectedDonation.photos.length === 0) && (
                <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg text-center">
                  <p className="text-gray-600 dark:text-gray-400">No photos uploaded</p>
                </div>
              )}

              {/* Medicine Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Brand</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedDonation.brand || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Generic Name</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedDonation.genericName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Dosage</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedDonation.dosage}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Form</p>
                  <p className="font-semibold text-gray-900 dark:text-white capitalize">{selectedDonation.form}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Quantity</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedDonation.quantity} {selectedDonation.unit}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Condition</p>
                  <p className="font-semibold text-gray-900 dark:text-white capitalize">{selectedDonation.condition}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Expiry Date</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{formatDate(selectedDonation.expiryDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Unopened</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedDonation.unopened ? 'Yes' : 'No'}</p>
                </div>
              </div>

              {/* Donor Details */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Donor Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {selectedDonation.donor?.firstName} {selectedDonation.donor?.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedDonation.donor?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedDonation.donorContact?.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">City</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedDonation.pickupLocation?.city}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedDonation.description && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Description</p>
                  <p className="text-gray-900 dark:text-white">{selectedDonation.description}</p>
                </div>
              )}

              {/* Rejection Reason (if pending) */}
              {filterStatus === 'pending' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Rejection Reason (if rejecting):
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    rows="3"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setRejectionReason('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-semibold transition"
                >
                  Close
                </button>
                {filterStatus === 'pending' && (
                  <>
                    <button
                      onClick={() => handleApproveDonation(selectedDonation._id)}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectDonation(selectedDonation._id)}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-5 h-5" />
                      Reject
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleDeleteDonation(selectedDonation._id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
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

export default AdminDonationManagement;
