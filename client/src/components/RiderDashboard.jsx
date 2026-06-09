import React, { useEffect, useState } from 'react';
import { Truck, Upload, CheckCircle, Clock, AlertTriangle, Shield, MapPin, Phone, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const RiderDashboard = () => {
  const { user, getAuthHeaders } = useAuth();
  const { success, error } = useNotification();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [offerActionLoading, setOfferActionLoading] = useState(null);
  const [rider, setRider] = useState(null);
  const [offers, setOffers] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [formData, setFormData] = useState({
    fullName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
    phone: user?.phone || '',
    nidNumber: '',
    vehicleType: 'bike',
    vehicleNumber: ''
  });
  const [files, setFiles] = useState({ nidFront: null, nidBack: null, selfieWithNid: null });

  const fetchRiderProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/riders/me', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setRider(data.rider || null);
      } else {
        setRider(null);
      }
    } catch (err) {
      console.error('Failed to fetch rider profile:', err);
      setRider(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryOffers = async () => {
    try {
      console.log('📦 Fetching delivery offers...');
      const response = await fetch('/api/riders/offers', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Offers received:', data.offers?.length || 0);
        setOffers(data.offers || []);
      } else {
        console.error('❌ Failed to fetch offers. Status:', response.status);
        const errorData = await response.json().catch(() => ({}));
        console.error('Error:', errorData);
        setOffers([]);
      }
    } catch (err) {
      console.error('❌ Failed to fetch rider offers:', err);
      setOffers([]);
    }
  };

  const fetchDeliveries = async () => {
    try {
      const response = await fetch('/api/riders/deliveries', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setDeliveries(data.deliveries || []);
      } else {
        setDeliveries([]);
      }
    } catch (err) {
      console.error('Failed to fetch rider deliveries:', err);
      setDeliveries([]);
    }
  };

  const fetchRevenue = async () => {
    try {
      const response = await fetch('/api/riders/revenue', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setRevenue(data.revenue || null);
      } else {
        setRevenue(null);
      }
    } catch (err) {
      console.error('Failed to fetch rider revenue:', err);
      setRevenue(null);
    }
  };

  const refreshDashboard = async () => {
    await Promise.all([fetchRiderProfile(), fetchDeliveryOffers(), fetchDeliveries(), fetchRevenue()]);
  };

  const completeDelivery = async (orderId) => {
    setOfferActionLoading(orderId);
    try {
      const response = await fetch(`/api/riders/deliveries/${orderId}/complete`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to complete delivery');
      }

      success('Delivery completed! You earned 50 BDT');
      await refreshDashboard();
    } catch (err) {
      console.error('Complete delivery error:', err);
      error(err.message || 'Could not complete delivery');
    } finally {
      setOfferActionLoading(null);
    }
  };

  useEffect(() => {
    refreshDashboard();

    const interval = setInterval(() => {
      fetchDeliveryOffers();
      fetchDeliveries();
      fetchRevenue();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const acceptOffer = async (orderId) => {
    setOfferActionLoading(orderId);
    try {
      const response = await fetch(`/api/riders/offers/${orderId}/accept`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to accept delivery offer');
      }

      success('Delivery accepted. You can now deliver the order.');
      await refreshDashboard();
    } catch (err) {
      console.error('Accept offer error:', err);
      error(err.message || 'Could not accept delivery offer');
    } finally {
      setOfferActionLoading(null);
    }
  };

  const declineOffer = async (orderId) => {
    setOfferActionLoading(orderId);
    try {
      const response = await fetch(`/api/riders/offers/${orderId}/decline`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: 'Not available right now' })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to decline delivery offer');
      }

      success('Delivery offer declined.');
      await refreshDashboard();
    } catch (err) {
      console.error('Decline offer error:', err);
      error(err.message || 'Could not decline delivery offer');
    } finally {
      setOfferActionLoading(null);
    }
  };

  const handleFileChange = (event) => {
    const { name, files: selectedFiles } = event.target;
    setFiles((prev) => ({ ...prev, [name]: selectedFiles?.[0] || null }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const form = new FormData();
      Object.entries(formData).forEach(([key, value]) => form.append(key, value));
      Object.entries(files).forEach(([key, value]) => {
        if (value) form.append(key, value);
      });

      const response = await fetch('/api/riders/onboard', {
        method: 'POST',
        headers: {
          Authorization: getAuthHeaders().Authorization
        },
        body: form
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit rider onboarding');
      }

      success('Onboarding submitted. Awaiting admin review.');
      setRider(data.rider || null);
      await fetchRiderProfile();
    } catch (err) {
      console.error('Rider onboarding error:', err);
      error(err.message || 'Failed to submit rider onboarding');
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = rider?.verificationStatus || 'not_submitted';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-healthcare-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="bg-gradient-to-r from-healthcare-green-600 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 rounded-2xl p-3">
            <Truck className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-bold">Rider Dashboard</h2>
            <p className="text-healthcare-green-100 mt-1">Complete onboarding, upload NID, and wait for approval.</p>
          </div>
        </div>
      </div>

      {revenue && rider?.verificationStatus === 'verified' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
            <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Total Earned</div>
            <div className="text-3xl font-bold text-healthcare-green-600 dark:text-healthcare-green-400">{revenue.totalEarned || 0} BDT</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">Cumulative earnings</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
            <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Completed</div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{revenue.completedDeliveries || 0}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">Successful deliveries</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
            <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Active</div>
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{revenue.activeDeliveries || 0}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">In progress</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
            <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Pending</div>
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{revenue.pendingOffers || 0}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">Awaiting response</div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Delivery Offers</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Orders waiting for your response.</p>
          </div>
          <button
            onClick={fetchDeliveryOffers}
            className="rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Refresh offers
          </button>
        </div>

        {offers.length > 0 ? (
          <div className="space-y-4 mb-8">
            {offers.map((order) => (
              <div key={order._id} className="rounded-2xl border border-healthcare-green-200 dark:border-healthcare-green-900 bg-healthcare-green-50 dark:bg-healthcare-green-950/20 p-5">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-healthcare-green-700 dark:text-healthcare-green-300">
                      <UserCheck className="w-4 h-4" />
                      New delivery offer
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">Order {order.trackingId}</h4>
                    <div className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {order.shippingAddress?.address}, {order.shippingAddress?.city}</div>
                      <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> {order.shippingAddress?.phone}</div>
                      <div>Total: {order.total}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => acceptOffer(order._id)}
                      disabled={offerActionLoading === order._id}
                      className="rounded-xl bg-healthcare-green-600 px-4 py-2 font-semibold text-white hover:bg-healthcare-green-700 disabled:opacity-60"
                    >
                      {offerActionLoading === order._id ? 'Processing...' : 'Accept delivery'}
                    </button>
                    <button
                      onClick={() => declineOffer(order._id)}
                      disabled={offerActionLoading === order._id}
                      className="rounded-xl border border-red-300 px-4 py-2 font-semibold text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20 disabled:opacity-60"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mb-8 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-6 text-center text-gray-500 dark:text-gray-400">
            No delivery offers right now.
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Active Deliveries</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Orders you accepted and are currently handling.</p>
            </div>
          </div>

          {deliveries.length > 0 ? (
            <div className="space-y-4">
              {deliveries.map((order) => (
                <div key={order._id} className="rounded-2xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/20 p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-blue-700 dark:text-blue-300">In progress</div>
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white">Order {order.trackingId}</h4>
                      <div className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                        <div>{order.shippingAddress?.fullName}</div>
                        <div>{order.shippingAddress?.address}, {order.shippingAddress?.city}</div>
                        <div>Phone: {order.shippingAddress?.phone}</div>
                      </div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white mt-2">Total: {order.total} BDT</div>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="rounded-xl bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 border border-blue-200 dark:border-blue-900 text-center">
                        Status: {order.status}
                      </div>
                      <button
                        onClick={() => completeDelivery(order._id)}
                        disabled={offerActionLoading === order._id}
                        className="rounded-xl bg-healthcare-green-600 px-4 py-2 font-semibold text-white hover:bg-healthcare-green-700 disabled:opacity-60 whitespace-nowrap"
                      >
                        {offerActionLoading === order._id ? 'Completing...' : '✓ Mark as Delivered'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-6 text-center text-gray-500 dark:text-gray-400">
              No active deliveries.
            </div>
          )}
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Verification Status</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Current onboarding state for your rider account.</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            statusBadge === 'verified'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
              : statusBadge === 'pending'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                : statusBadge === 'rejected'
                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
          }`}> 
            {statusBadge === 'not_submitted' ? 'Not submitted' : statusBadge}
          </span>
        </div>

        {rider?.verificationStatus === 'verified' ? (
          <div className="rounded-2xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-5">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 mt-1" />
              <div>
                <h4 className="font-bold text-green-900 dark:text-green-200 text-lg">You are live</h4>
                <p className="text-green-800 dark:text-green-300 mt-1">Your rider account has been approved and can receive delivery assignments.</p>
              </div>
            </div>
          </div>
        ) : rider?.verificationStatus === 'pending' ? (
          <div className="rounded-2xl border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 p-5">
            <div className="flex items-start gap-3">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mt-1" />
              <div>
                <h4 className="font-bold text-yellow-900 dark:text-yellow-200 text-lg">Under review</h4>
                <p className="text-yellow-800 dark:text-yellow-300 mt-1">Your documents have been submitted. Admin approval is required before going live.</p>
              </div>
            </div>
          </div>
        ) : rider?.verificationStatus === 'rejected' ? (
          <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 mt-1" />
              <div>
                <h4 className="font-bold text-red-900 dark:text-red-200 text-lg">Rejected</h4>
                <p className="text-red-800 dark:text-red-300 mt-1">{rider.rejectionReason || 'Please review the feedback and resubmit.'}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-5 mb-6">
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-1" />
              <div>
                <h4 className="font-bold text-blue-900 dark:text-blue-200 text-lg">Start onboarding</h4>
                <p className="text-blue-800 dark:text-blue-300 mt-1">Complete your NID verification to become a live rider.</p>
              </div>
            </div>
          </div>
        )}

        {/* Uploaded Documents removed per request */}

        {(rider?.verificationStatus !== 'verified') && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">NID Number</label>
                <input
                  type="text"
                  value={formData.nidNumber}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nidNumber: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Vehicle Type</label>
                <select
                  value={formData.vehicleType}
                  onChange={(e) => setFormData((prev) => ({ ...prev, vehicleType: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white"
                  required
                >
                  <option value="bike">Bike</option>
                  <option value="scooter">Scooter</option>
                  <option value="car">Car</option>
                  <option value="bicycle">Bicycle</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Vehicle Number</label>
                <input
                  type="text"
                  value={formData.vehicleNumber}
                  onChange={(e) => setFormData((prev) => ({ ...prev, vehicleNumber: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {[
                { name: 'nidFront', label: 'NID Front' },
                { name: 'nidBack', label: 'NID Back' },
                { name: 'selfieWithNid', label: 'Selfie with NID' }
              ].map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{field.label}</label>
                  <input
                    type="file"
                    name={field.name}
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full text-sm text-gray-700 dark:text-gray-300 file:mr-4 file:rounded-xl file:border-0 file:bg-healthcare-green-600 file:px-4 file:py-2 file:text-white hover:file:bg-healthcare-green-700"
                    required={field.name !== 'selfieWithNid'}
                  />
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-healthcare-green-600 px-5 py-3 font-semibold text-white hover:bg-healthcare-green-700 disabled:opacity-60"
            >
              <Upload className="w-4 h-4" />
              {submitting ? 'Submitting...' : 'Submit for Verification'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default RiderDashboard;