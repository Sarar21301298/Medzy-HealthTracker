import express from 'express';
import { authenticateToken, requireAdmin, requireRole } from '../middleware/auth.js';
import { riderNidUpload } from '../middleware/riderUploads.js';
import Rider from '../models/Rider.js';
import {
  acceptRiderOffer,
  approveRider,
  completeDelivery,
  declineRiderOffer,
  getPendingRiders,
  getRiderDeliveries,
  getRiderOffers,
  getRiderProfile,
  getRiderRevenue,
  rejectRider,
  serveRiderNidImage,
  submitRiderOnboarding
} from '../controllers/riderController.js';

const router = express.Router();

router.post('/onboard', authenticateToken, requireRole(['rider']), riderNidUpload, submitRiderOnboarding);
router.get('/me', authenticateToken, requireRole(['rider']), getRiderProfile);
router.get('/offers', authenticateToken, requireRole(['rider']), getRiderOffers);
router.get('/deliveries', authenticateToken, requireRole(['rider']), getRiderDeliveries);
router.get('/revenue', authenticateToken, requireRole(['rider']), getRiderRevenue);
router.post('/offers/:orderId/accept', authenticateToken, requireRole(['rider']), acceptRiderOffer);
router.post('/offers/:orderId/decline', authenticateToken, requireRole(['rider']), declineRiderOffer);
router.post('/deliveries/:orderId/complete', authenticateToken, requireRole(['rider']), completeDelivery);
router.get('/admin/pending', authenticateToken, requireAdmin, getPendingRiders);
router.patch('/admin/:riderId/approve', authenticateToken, requireAdmin, approveRider);
router.patch('/admin/:riderId/reject', authenticateToken, requireAdmin, rejectRider);

// Test endpoint: Auto-approve all pending riders (for testing only)
router.post('/test/approve-all', async (req, res) => {
  try {
    const result = await Rider.updateMany(
      { verificationStatus: 'pending' },
      { 
        verificationStatus: 'verified',
        liveStatus: 'active',
        reviewedAt: new Date()
      }
    );
    console.log(`✅ Auto-approved ${result.modifiedCount} pending riders`);
    return res.json({
      success: true,
      message: `Approved ${result.modifiedCount} pending riders`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Test approve error:', error);
    return res.status(500).json({ message: 'Error approving riders', error: error.message });
  }
});

router.get('/:riderId/nid-images/:imageId/preview', serveRiderNidImage);

export default router;