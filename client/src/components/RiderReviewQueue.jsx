import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, RefreshCw, UserCheck, Clock, Eye, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const RiderReviewQueue = () => {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewReason, setReviewReason] = useState('');
  const [selectedRiderId, setSelectedRiderId] = useState(null);
  const { getAuthHeaders } = useAuth();
  const { success, error } = useNotification();

  const fetchPendingRiders = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/riders/admin/pending', {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pending riders');
      }

      const data = await response.json();
      setRiders(data.riders || []);
    } catch (err) {
      console.error('Error fetching riders:', err);
      error('Failed to load rider review queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRiders();
  }, []);

  const approveRider = async (riderId) => {
    try {
      const response = await fetch(`/api/riders/admin/${riderId}/approve`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Approval failed');
      }

      success('Rider approved successfully');
      setRiders((prev) => prev.filter((rider) => rider._id !== riderId));
    } catch (err) {
      console.error('Approve rider error:', err);
      error('Could not approve rider');
    }
  };

  const rejectRider = async (riderId) => {
    try {
      const response = await fetch(`/api/riders/admin/${riderId}/reject`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rejectionReason: reviewReason })
      });

      if (!response.ok) {
        throw new Error('Rejection failed');
      }

      success('Rider rejected');
      setRiders((prev) => prev.filter((rider) => rider._id !== riderId));
      setReviewReason('');
      setSelectedRiderId(null);
    } catch (err) {
      console.error('Reject rider error:', err);
      error('Could not reject rider');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-healthcare-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-healthcare-green-600 to-teal-600 rounded-2xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <UserCheck className="w-8 h-8" />
              Rider Verification Queue
            </h2>
            <p className="text-healthcare-green-100">Review NID documents and approve riders before they go live.</p>
          </div>
          <button
            onClick={fetchPendingRiders}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {riders.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-10 text-center">
          <CheckCircle className="mx-auto w-12 h-12 text-green-500 mb-3" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">No pending riders</h3>
          <p className="text-gray-600 dark:text-gray-400 mt-2">All rider applications have been reviewed.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {riders.map((rider) => (
            <div key={rider._id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{rider.fullName}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{rider.phone}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">NID: {rider.nidNumber}</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Pending
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                {rider.nidImages?.map((image) => (
                  <a
                    key={image.imageKey || image._id}
                    href={image.secureUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                  >
                    <img
                      src={image.secureUrl}
                      alt={image.type}
                      className="h-40 w-full object-cover group-hover:opacity-90 transition-opacity"
                    />
                    <div className="p-2 text-xs font-semibold text-gray-700 dark:text-gray-300 capitalize">
                      {image.type.replace('_', ' ')}
                    </div>
                  </a>
                ))}
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <AlertTriangle className="inline w-4 h-4 mr-2" />
                  Rejection reason
                </label>
                <textarea
                  value={selectedRiderId === rider._id ? reviewReason : ''}
                  onChange={(e) => {
                    setSelectedRiderId(rider._id);
                    setReviewReason(e.target.value);
                  }}
                  placeholder="Add a reason if rejecting this rider"
                  className="w-full min-h-[90px] rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-healthcare-green-500"
                />
              </div>

              <div className="flex flex-wrap gap-3 mt-5">
                <button
                  onClick={() => approveRider(rider._id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => rejectRider(rider._id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
                <button
                  onClick={() => window.open(imagePreviewUrl(rider), '_blank', 'noopener,noreferrer')}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Open Preview
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

function imagePreviewUrl(rider) {
  const firstImage = rider?.nidImages?.[0];
  return firstImage?.secureUrl || '#';
}

export default RiderReviewQueue;