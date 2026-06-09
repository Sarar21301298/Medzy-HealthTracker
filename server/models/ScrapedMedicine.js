import mongoose from 'mongoose';

const scrapedMedicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  manufacturer: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Inhaler', 'Suppository', 'Other'],
    default: 'Other'
  },
  inStock: {
    type: Boolean,
    default: true
  },
  source: {
    type: String,
    required: true,
    enum: ['Arogga', 'OsudPotro', 'Unipharma', 'Medixo', 'OnlyMeds', 'Other'],
    index: true
  },
  sourceUrl: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
    trim: true
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  lastScrapedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date
  },
  stockQuantity: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
});

// Create compound index for common queries
scrapedMedicineSchema.index({ name: 'text', manufacturer: 'text', description: 'text' });
scrapedMedicineSchema.index({ source: 1, isActive: 1 });
scrapedMedicineSchema.index({ price: 1, isActive: 1 });

const ScrapedMedicine = mongoose.model('ScrapedMedicine', scrapedMedicineSchema);

export default ScrapedMedicine;
