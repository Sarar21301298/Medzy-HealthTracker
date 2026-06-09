import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import Order from '../models/Order.js';
import Rider from '../models/Rider.js';
import User from '../models/User.js';
import { getPrivateUploadPath } from '../middleware/riderUploads.js';

const JWT_SECRET = process.env.JWT_SECRET || 'medsy_secret_key_2024';
const RIDER_IMAGE_SECRET = process.env.RIDER_IMAGE_SECRET || JWT_SECRET;

function createNidImageToken(payload, expiresIn = '24h') {
  return jwt.sign(payload, RIDER_IMAGE_SECRET, { expiresIn });
}

export function buildSecureNidImageUrl(riderId, imageId) {
  const token = createNidImageToken({ riderId: String(riderId), imageId: String(imageId), purpose: 'nid-preview' });
  return `/api/riders/${riderId}/nid-images/${imageId}/preview?token=${encodeURIComponent(token)}`;
}

function sanitizeRider(rider) {
  const riderObject = rider.toObject ? rider.toObject() : rider;

  return {
    ...riderObject,
    nidImages: (riderObject.nidImages || []).map((image) => ({
      ...image,
      secureUrl: buildSecureNidImageUrl(riderObject._id, image.imageKey || image._id)
    }))
  };
}

function notifyRider(user, message) {
  console.log(`[Rider Notification] ${user?.email || user?._id || 'unknown'}: ${message}`);
}

async function getNextAvailableRider(excludedRiderId = null) {
  const query = {
    verificationStatus: 'verified',
    liveStatus: 'active'
  };

  if (excludedRiderId) {
    query.userId = { $ne: excludedRiderId };
  }

  return Rider.findOne(query)
    .sort({ goLiveAt: 1, createdAt: 1 })
    .populate('userId', 'firstName lastName email phone role');
}

export const submitRiderOnboarding = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'rider') {
      return res.status(403).json({ message: 'Access denied. Rider account required.' });
    }

    const { nidNumber, vehicleType, vehicleNumber, fullName, phone } = req.body;
    const files = req.files || {};

    if (!nidNumber || !vehicleType || !fullName || !phone) {
      return res.status(400).json({ message: 'Full name, phone, NID number, and vehicle type are required.' });
    }

    const front = files.nidFront?.[0];
    const back = files.nidBack?.[0];

    if (!front || !back) {
      return res.status(400).json({ message: 'NID front and back images are required.' });
    }

    const existingRider = await Rider.findOne({ userId: req.user.id });
    const riderRoot = getPrivateUploadPath('riders', String(req.user.id));

    const images = [
      { file: front, type: 'nid_front' },
      { file: back, type: 'nid_back' },
      ...(files.selfieWithNid?.[0] ? [{ file: files.selfieWithNid[0], type: 'selfie_with_nid' }] : [])
    ];

    const nidImages = images.map(({ file, type }) => {
      const filePath = path.relative(getPrivateUploadPath(), file.path).replace(/\\/g, '/');
      const imageKey = path.basename(file.path, path.extname(file.path));

      return {
        imageKey,
        type,
        originalName: file.originalname,
        mimeType: file.mimetype,
        filePath,
        secureUrl: buildSecureNidImageUrl(req.user.id, imageKey),
        uploadedAt: new Date()
      };
    });

    const riderData = {
      userId: req.user.id,
      fullName,
      phone,
      nidNumber,
      nidImages,
      verificationStatus: 'pending',
      rejectionReason: '',
      liveStatus: 'inactive',
      vehicleInfo: {
        vehicleType,
        vehicleNumber: vehicleNumber || ''
      },
      onboardingCompletedAt: new Date()
    };

    const rider = existingRider
      ? await Rider.findByIdAndUpdate(existingRider._id, riderData, { new: true, runValidators: true })
      : await Rider.create(riderData);

    await User.findByIdAndUpdate(req.user.id, {
      firstName: fullName.split(' ')[0] || req.user.firstName,
      lastName: fullName.split(' ').slice(1).join(' ') || req.user.lastName
    });

    notifyRider(req.user, 'Your rider onboarding documents were submitted and are awaiting admin review.');

    return res.json({
      success: true,
      message: 'Rider onboarding submitted successfully',
      rider: sanitizeRider(rider)
    });
  } catch (error) {
    console.error('submitRiderOnboarding error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const approveRider = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { riderId } = req.params;
    const rider = await Rider.findById(riderId).populate('userId', 'firstName lastName email role');

    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' });
    }

    rider.verificationStatus = 'verified';
    rider.liveStatus = 'active';
    rider.rejectionReason = '';
    rider.reviewedBy = req.user.id;
    rider.reviewedAt = new Date();
    rider.goLiveAt = new Date();

    await rider.save();

    notifyRider(rider.userId, 'Your rider account has been approved and is now live.');

    return res.json({
      success: true,
      message: 'Rider approved successfully',
      rider: sanitizeRider(rider)
    });
  } catch (error) {
    console.error('approveRider error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const rejectRider = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { riderId } = req.params;
    const { rejectionReason = '' } = req.body || {};

    const rider = await Rider.findById(riderId).populate('userId', 'firstName lastName email role');
    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' });
    }

    rider.verificationStatus = 'rejected';
    rider.liveStatus = 'inactive';
    rider.rejectionReason = rejectionReason;
    rider.reviewedBy = req.user.id;
    rider.reviewedAt = new Date();

    await rider.save();

    notifyRider(rider.userId, 'Your rider onboarding was rejected. Please review the feedback and resubmit.');

    return res.json({
      success: true,
      message: 'Rider rejected successfully',
      rider: sanitizeRider(rider)
    });
  } catch (error) {
    console.error('rejectRider error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getPendingRiders = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const riders = await Rider.find({ verificationStatus: 'pending' })
      .populate('userId', 'email role isActive createdAt')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      riders: riders.map(sanitizeRider)
    });
  } catch (error) {
    console.error('getPendingRiders error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getRiderProfile = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'rider') {
      return res.status(403).json({ message: 'Access denied. Rider only.' });
    }

    const rider = await Rider.findOne({ userId: req.user.id }).populate('userId', 'email role');
    if (!rider) {
      return res.status(404).json({ message: 'Rider profile not found' });
    }

    return res.json({
      success: true,
      rider: sanitizeRider(rider)
    });
  } catch (error) {
    console.error('getRiderProfile error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const serveRiderNidImage = async (req, res) => {
  try {
    const { riderId, imageId } = req.params;
    const { token } = req.query;

    const rider = await Rider.findById(riderId);
    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' });
    }

    const image = rider.nidImages.id(imageId) || rider.nidImages.find((item) => item.imageKey === imageId);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    const tokenPayload = token ? jwt.verify(String(token), RIDER_IMAGE_SECRET) : null;
    const isOwner = req.user?.id && String(req.user.id) === String(rider.userId);
    const isAdmin = req.user?.role === 'admin';
    const tokenMatches = tokenPayload && String(tokenPayload.riderId) === String(riderId) && String(tokenPayload.imageId) === String(image.imageKey || imageId);

    if (!isAdmin && !isOwner && !tokenMatches) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const absoluteFilePath = path.join(getPrivateUploadPath(), image.filePath);
    if (!fs.existsSync(absoluteFilePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.setHeader('Cache-Control', 'no-store');
    res.type(image.mimeType);
    return fs.createReadStream(absoluteFilePath).pipe(res);
  } catch (error) {
    console.error('serveRiderNidImage error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getRiderOffers = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'rider') {
      return res.status(403).json({ message: 'Access denied. Rider only.' });
    }

    console.log(`📦 Fetching offers for rider ${req.user.id}`);
    
    const orders = await Order.find({
      'deliveryAssignment.rider': req.user.id,
      'deliveryAssignment.status': 'pending'
    })
      .populate([
        { path: 'customer', select: 'firstName lastName email phone' },
        { path: 'items.medicine', select: 'name genericName imageUrl' }
      ])
      .sort({ 'deliveryAssignment.offeredAt': -1 });

    console.log(`✅ Found ${orders.length} pending offers for rider ${req.user.id}`);
    
    return res.json({
      success: true,
      offers: orders
    });
  } catch (error) {
    console.error('getRiderOffers error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getRiderDeliveries = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'rider') {
      return res.status(403).json({ message: 'Access denied. Rider only.' });
    }

    const orders = await Order.find({
      'deliveryAssignment.rider': req.user.id,
      'deliveryAssignment.status': { $in: ['accepted'] }
    })
      .populate([
        { path: 'customer', select: 'firstName lastName email phone' },
        { path: 'items.medicine', select: 'name genericName imageUrl' }
      ])
      .sort({ 'deliveryAssignment.respondedAt': -1 });

    return res.json({
      success: true,
      deliveries: orders
    });
  } catch (error) {
    console.error('getRiderDeliveries error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const acceptRiderOffer = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'rider') {
      return res.status(403).json({ message: 'Access denied. Rider only.' });
    }

    const { orderId } = req.params;
    const order = await Order.findOne({
      _id: orderId,
      'deliveryAssignment.rider': req.user.id,
      'deliveryAssignment.status': 'pending'
    });

    if (!order) {
      return res.status(404).json({ message: 'Delivery offer not found' });
    }

    order.deliveryAssignment.status = 'accepted';
    order.deliveryAssignment.respondedAt = new Date();
    order.deliveryAssignment.responseNote = 'Accepted by rider';
    if (order.status === 'pending' || order.status === 'confirmed' || order.status === 'processing') {
      order.status = 'shipped';
    }

    await order.save();

    notifyRider(req.user, `You accepted delivery for order ${order.trackingId}`);

    return res.json({
      success: true,
      message: 'Delivery offer accepted',
      order
    });
  } catch (error) {
    console.error('acceptRiderOffer error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const declineRiderOffer = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'rider') {
      return res.status(403).json({ message: 'Access denied. Rider only.' });
    }

    const { orderId } = req.params;
    const { reason = '' } = req.body || {};

    const order = await Order.findOne({
      _id: orderId,
      'deliveryAssignment.rider': req.user.id,
      'deliveryAssignment.status': 'pending'
    });

    if (!order) {
      return res.status(404).json({ message: 'Delivery offer not found' });
    }

    order.deliveryAssignment.status = 'declined';
    order.deliveryAssignment.respondedAt = new Date();
    order.deliveryAssignment.responseNote = reason || 'Declined by rider';
    await order.save();

    const nextRider = await getNextAvailableRider(req.user.id);
    if (nextRider) {
      order.deliveryAssignment = {
        rider: nextRider.userId._id,
        status: 'pending',
        offeredAt: new Date(),
        respondedAt: null,
        responseNote: ''
      };
      await order.save();
      notifyRider(nextRider.userId, `New delivery offer available for order ${order.trackingId}`);
    }

    return res.json({
      success: true,
      message: 'Delivery offer declined',
      order
    });
  } catch (error) {
    console.error('declineRiderOffer error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const completeDelivery = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'rider') {
      return res.status(403).json({ message: 'Access denied. Rider only.' });
    }

    const { orderId } = req.params;
    const order = await Order.findOne({
      _id: orderId,
      'deliveryAssignment.rider': req.user.id,
      'deliveryAssignment.status': 'accepted'
    });

    if (!order) {
      return res.status(404).json({ message: 'Active delivery not found' });
    }

    // Mark delivery as completed
    order.deliveryAssignment.status = 'completed';
    order.deliveryAssignment.respondedAt = new Date();
    order.deliveryAssignment.responseNote = 'Completed by rider';
    order.status = 'delivered';

    await order.save();

    // Update rider's revenue stats
    const rider = await Rider.findOne({ userId: req.user.id });
    if (rider) {
      const deliveryEarnings = 50; // Fixed 50 BDT per delivery
      rider.revenue.completedDeliveries = (rider.revenue.completedDeliveries || 0) + 1;
      rider.revenue.totalCompleted = (rider.revenue.totalCompleted || 0) + deliveryEarnings;
      rider.revenue.lastUpdated = new Date();
      await rider.save();
      
      console.log(`✅ Delivery completed. Rider earned +50 BDT`);
    }

    notifyRider(req.user, `Delivery completed for order ${order.trackingId}. Earned 50 BDT`);

    return res.json({
      success: true,
      message: 'Delivery marked as completed',
      order,
      riderRevenue: rider?.revenue || null
    });
  } catch (error) {
    console.error('completeDelivery error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getRiderRevenue = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'rider') {
      return res.status(403).json({ message: 'Access denied. Rider only.' });
    }

    const rider = await Rider.findOne({ userId: req.user.id });
    if (!rider) {
      return res.status(404).json({ message: 'Rider profile not found' });
    }

    // Get completed orders count for verification
    const completedOrders = await Order.countDocuments({
      'deliveryAssignment.rider': req.user.id,
      'deliveryAssignment.status': 'completed'
    });

    // Get accepted/active orders
    const activeOrders = await Order.countDocuments({
      'deliveryAssignment.rider': req.user.id,
      'deliveryAssignment.status': 'accepted'
    });

    // Get pending offers
    const pendingOffers = await Order.countDocuments({
      'deliveryAssignment.rider': req.user.id,
      'deliveryAssignment.status': 'pending'
    });

    return res.json({
      success: true,
      revenue: {
        totalEarned: rider.revenue.totalCompleted || 0,
        completedDeliveries: rider.revenue.completedDeliveries || 0,
        activeDeliveries: activeOrders,
        pendingOffers: pendingOffers,
        lastUpdated: rider.revenue.lastUpdated
      }
    });
  } catch (error) {
    console.error('getRiderRevenue error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
