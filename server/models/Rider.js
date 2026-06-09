import mongoose from 'mongoose';

const riderImageSchema = new mongoose.Schema({
  imageKey: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['nid_front', 'nid_back', 'selfie_with_nid'],
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  secureUrl: {
    type: String,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const riderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  nidNumber: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    index: true
  },
  nidImages: {
    type: [riderImageSchema],
    default: []
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending',
    index: true
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  goLiveAt: {
    type: Date,
    default: null
  },
  liveStatus: {
    type: String,
    enum: ['inactive', 'active', 'suspended'],
    default: 'inactive'
  },
  vehicleInfo: {
    vehicleType: {
      type: String,
      enum: ['bike', 'scooter', 'car', 'bicycle'],
      required: true
    },
    vehicleNumber: {
      type: String,
      default: '',
      trim: true
    }
  },
  onboardingCompletedAt: {
    type: Date,
    default: null
  },
  revenue: {
    totalCompleted: {
      type: Number,
      default: 0,
      min: 0
    },
    totalDeliveries: {
      type: Number,
      default: 0,
      min: 0
    },
    completedDeliveries: {
      type: Number,
      default: 0,
      min: 0
    },
    lastUpdated: {
      type: Date,
      default: null
    }
  }
}, { timestamps: true });

riderSchema.index({ verificationStatus: 1, createdAt: -1 });

export default mongoose.model('Rider', riderSchema);