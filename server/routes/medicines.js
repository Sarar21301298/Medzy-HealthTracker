import express from 'express';
import mongoose from 'mongoose';
import { GoogleGenAI } from '@google/genai';
import Medicine from '../models/Medicine.js';
import ScrapedMedicine from '../models/ScrapedMedicine.js';
import Review from '../models/Review.js';
import { authenticateToken } from '../middleware/auth.js';
import medicineScraperService from '../services/medicineScraperService.js';

const router = express.Router();
let genAIClient = null;

function getGenAIClient() {
  if (genAIClient) return genAIClient;

  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
  if (!hasGeminiKey) return null;

  genAIClient = new GoogleGenAI({});
  return genAIClient;
}

function extractJsonPayload(text = '') {
  const fencedMatch = String(text).match(/```json\s*([\s\S]*?)\s*```/i);
  if (fencedMatch) {
    return fencedMatch[1].trim();
  }

  const objectMatch = String(text).match(/\{[\s\S]*\}/);
  return objectMatch ? objectMatch[0].trim() : '';
}

function normalizeSearchText(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildSearchRegex(value = '') {
  const normalized = normalizeSearchText(value);
  if (!normalized) return null;

  return new RegExp(normalized.split(' ').map(escapeRegex).join('.*'), 'i');
}

function buildManualQueryPlan(query = '') {
  const normalized = normalizeSearchText(query);
  const searchText = normalized
    .replace(/\b(find|show|get|give|me|the|a|an|please|list|cheap|cheapest|lowest|price|priced|medicine|medicines|tablet|tablets|capsule|capsules|brand|brands)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const maxPriceMatch = normalized.match(/(?:under|below|less than|max(?:imum)? of)\s*([0-9]+(?:\.[0-9]+)?)/i);
  const minPriceMatch = normalized.match(/(?:above|over|more than|at least|min(?:imum)? of)\s*([0-9]+(?:\.[0-9]+)?)/i);
  const limitMatch = normalized.match(/(?:top|first|show)\s*([0-9]{1,2})/i);

  return {
    medicineName: searchText || query,
    sortBy: 'price',
    sortOrder: normalized.includes('expensive') || normalized.includes('highest') ? 'desc' : 'asc',
    limit: limitMatch ? Math.min(Math.max(parseInt(limitMatch[1], 10), 1), 20) : 10,
    inStockOnly: normalized.includes('in stock') || normalized.includes('available'),
    minPrice: minPriceMatch ? parseFloat(minPriceMatch[1]) : null,
    maxPrice: maxPriceMatch ? parseFloat(maxPriceMatch[1]) : null,
    sourcePreference: 'all'
  };
}

async function parseMedicineAgentQuery(query) {
  const fallback = buildManualQueryPlan(query);
  const genAI = getGenAIClient();

  if (!genAI) {
    return fallback;
  }

  try {
    const response = await genAI.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
      contents: `You are a medicine search agent for MedZy.

Translate the user query into JSON only.

User query: ${query}

Return this JSON shape:
{
  "medicineName": "main medicine or product name to search for",
  "sortBy": "price",
  "sortOrder": "asc or desc",
  "limit": 10,
  "inStockOnly": false,
  "minPrice": null,
  "maxPrice": null,
  "sourcePreference": "all"
}

Rules:
- If the user asks for the cheapest or lowest price, sortOrder must be "asc".
- If the user asks for the most expensive or highest price, sortOrder must be "desc".
- If the user gives a budget like "under 50", set maxPrice.
- If the user says "in stock", set inStockOnly to true.
- Keep the medicineName focused on the medicine itself.
- Return JSON only, without markdown or explanation.`,
      config: {
        temperature: 0.1,
        maxOutputTokens: 400
      }
    });

    const text = typeof response?.text === 'function' ? response.text() : (response?.text || '');
    const payload = extractJsonPayload(text);

    if (!payload) {
      return fallback;
    }

    const parsed = JSON.parse(payload);
    return {
      ...fallback,
      ...parsed,
      limit: Math.min(Math.max(parseInt(parsed.limit || fallback.limit, 10), 1), 20),
      sortBy: 'price',
      sortOrder: parsed.sortOrder === 'desc' ? 'desc' : 'asc'
    };
  } catch (error) {
    console.error('Failed to parse medicine query with Gemini:', error);
    return fallback;
  }
}

function buildMedicineMatchFilter(searchTerm, options = {}) {
  const regex = buildSearchRegex(searchTerm);
  const query = { isActive: true };

  if (options.expiryDateFilter) {
    query.expiryDate = { $gt: new Date() };
  }

  if (options.inStockOnly) {
    query.stockQuantity = { $gt: 0 };
  }

  if (typeof options.minPrice === 'number' || typeof options.maxPrice === 'number') {
    query.price = {};
    if (typeof options.minPrice === 'number') query.price.$gte = options.minPrice;
    if (typeof options.maxPrice === 'number') query.price.$lte = options.maxPrice;
  }

  if (regex) {
    query.$or = options.includeGenericName
      ? [
          { name: regex },
          { genericName: regex },
          { manufacturer: regex },
          { description: regex },
          { tags: regex }
        ]
      : [
          { name: regex },
          { manufacturer: regex },
          { description: regex }
        ];
  }

  return query;
}

function normalizeMedicineResult(item, sourceType) {
  if (sourceType === 'vendor') {
    const vendor = item.vendorId || {};
    return {
      id: item._id,
      sourceType,
      sourceLabel: 'Pharmacy Partner',
      name: item.name,
      manufacturer: item.manufacturer,
      category: item.category,
      price: item.price,
      stockQuantity: item.stockQuantity,
      inStock: item.stockQuantity > 0,
      imageUrl: item.imageUrl,
      description: item.description,
      prescriptionRequired: item.prescriptionRequired,
      dosage: item.dosage,
      vendorName: vendor.businessInfo?.businessName || `${vendor.firstName || ''} ${vendor.lastName || ''}`.trim() || 'Pharmacy Partner',
      sourceUrl: null
    };
  }

  return {
    id: item._id,
    sourceType,
    sourceLabel: item.source || 'Online Pharmacy',
    name: item.name,
    manufacturer: item.manufacturer,
    category: item.category,
    price: item.price,
    stockQuantity: item.stockQuantity || 0,
    inStock: item.inStock !== false,
    imageUrl: item.imageUrl,
    description: item.description,
    prescriptionRequired: false,
    dosage: null,
    vendorName: item.source || 'Online Pharmacy',
    sourceUrl: item.sourceUrl || null
  };
}

function dedupeAndSortMedicineResults(results, sortOrder = 'asc') {
  const seen = new Set();
  const direction = sortOrder === 'desc' ? -1 : 1;

  return results
    .filter(item => {
      const key = normalizeSearchText(`${item.sourceType}:${item.name}:${item.manufacturer}`);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((left, right) => {
      const priceDiff = (left.price || 0) - (right.price || 0);
      if (priceDiff !== 0) return priceDiff * direction;
      return String(left.name || '').localeCompare(String(right.name || ''));
    });
}

// Upload medicine image (pharmacy vendor only)
router.post('/upload-image', authenticateToken, (req, res) => {
  if (req.user.role !== 'pharmacy_vendor') {
    return res.status(403).json({ message: 'Access denied. Only pharmacy vendors can upload medicine images.' });
  }

  const upload = req.app.locals.upload?.single('image');
  if (!upload) {
    return res.status(500).json({ message: 'Upload service is not available' });
  }

  upload(req, res, (error) => {
    if (error) {
      return res.status(400).json({ message: error.message || 'Failed to upload image' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Please select an image file' });
    }

    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    return res.json({
      message: 'Image uploaded successfully',
      imageUrl,
      filename: req.file.filename
    });
  });
});

// Get all active medicines (public route for browsing)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get all active, non-expired medicines
    const query = { 
      isActive: true,
      expiryDate: { $gt: new Date() },
      stockQuantity: { $gt: 0 }
    };

    const medicines = await Medicine.find(query)
      .populate('vendorId', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Medicine.countDocuments(query);

    res.json({
      success: true,
      medicines,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching medicines:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all medicines for a vendor
router.get('/vendor-medicines', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching medicines for vendor:', req.user);
    
    if (req.user.role !== 'pharmacy_vendor') {
      return res.status(403).json({ message: 'Access denied. Only pharmacy vendors can access this route.' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Build query
    let query = { vendorId: new mongoose.Types.ObjectId(req.user.id), isActive: true };
    
    console.log('Query for medicines:', query);
    console.log('User ID type:', typeof req.user.id, 'Value:', req.user.id);
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { genericName: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category) {
      query.category = category;
    }

    const medicines = await Medicine.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);

    const total = await Medicine.countDocuments(query);

    console.log('Found medicines:', medicines.length, 'Total:', total);

    // Get statistics
    const stats = await Medicine.aggregate([
      { $match: { vendorId: new mongoose.Types.ObjectId(req.user.id), isActive: true } },
      {
        $group: {
          _id: null,
          totalMedicines: { $sum: 1 },
          totalStock: { $sum: '$stockQuantity' },
          lowStockCount: {
            $sum: {
              $cond: [{ $lte: ['$stockQuantity', '$minStockLevel'] }, 1, 0]
            }
          },
          expiredCount: {
            $sum: {
              $cond: [{ $lt: ['$expiryDate', new Date()] }, 1, 0]
            }
          },
          expiringSoonCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lte: ['$expiryDate', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)] },
                    { $gt: ['$expiryDate', new Date()] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    res.json({
      medicines,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      },
      stats: stats[0] || {
        totalMedicines: 0,
        totalStock: 0,
        lowStockCount: 0,
        expiredCount: 0,
        expiringSoonCount: 0
      }
    });
  } catch (error) {
    console.error('Error fetching vendor medicines:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Public route for customers to search medicines with GPS/location support
router.get('/search', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';
    const minPrice = parseFloat(req.query.minPrice) || 0;
    const maxPrice = parseFloat(req.query.maxPrice) || Number.MAX_VALUE;
    const sortBy = req.query.sortBy || 'name';
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
    const inStockOnly = req.query.inStockOnly === 'true';
    const prescriptionFilter = req.query.prescriptionFilter;
    const minRating = parseFloat(req.query.minRating) || 0;
    
    // GPS/Location parameters
    const latitude = parseFloat(req.query.latitude);
    const longitude = parseFloat(req.query.longitude);
    const maxDistance = parseFloat(req.query.maxDistance) || 50; // Default 50km

    // Build query for active medicines only
    let query = { 
      isActive: true,
      expiryDate: { $gt: new Date() } // Only show non-expired medicines
    };
    
    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { genericName: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } },
        { tags: { $elemMatch: { $regex: search, $options: 'i' } } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }

    // Filter by price range
    if (minPrice > 0 || maxPrice < Number.MAX_VALUE) {
      query.price = { $gte: minPrice, $lte: maxPrice };
    }

    // Filter by stock availability
    if (inStockOnly) {
      query.stockQuantity = { $gt: 0 };
    }

    // Filter by prescription requirement
    if (prescriptionFilter && prescriptionFilter !== 'all') {
      query.prescriptionRequired = prescriptionFilter === 'required';
    }

    // Execute query with population of vendor details including location
    let medicines = await Medicine.find(query)
      .populate({
        path: 'vendorId',
        select: 'firstName lastName email phone businessInfo address',
        populate: {
          path: 'businessInfo',
          select: 'businessName businessAddress businessPhone'
        }
      })
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .select('-stockHistory'); // Exclude stock history for customer view

    const total = await Medicine.countDocuments(query);

    // Get vendor ratings for all vendors in this batch
    const vendorIds = medicines.map(m => m.vendorId?._id).filter(Boolean);
    const vendorRatings = await Review.aggregate([
      { $match: { vendor: { $in: vendorIds }, isActive: true } },
      {
        $group: {
          _id: '$vendor',
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    // Create a map for quick lookup
    const ratingsMap = vendorRatings.reduce((acc, rating) => {
      acc[rating._id.toString()] = {
        averageRating: Math.round(rating.averageRating * 10) / 10,
        totalReviews: rating.totalReviews
      };
      return acc;
    }, {});

    // Add location-based filtering and distance calculation if GPS coordinates provided
    if (latitude && longitude && !isNaN(latitude) && !isNaN(longitude)) {
      console.log(`🌍 GPS Search: lat=${latitude}, lon=${longitude}, maxDistance=${maxDistance}km`);
      console.log(`📍 Total medicines before location filter: ${medicines.length}`);
      
      medicines = medicines.filter(medicine => {
        if (!medicine.vendorId?.address?.coordinates) {
          console.log(`❌ No coordinates for vendor: ${medicine.vendorId?.businessInfo?.businessName || medicine.vendorId?.firstName}`);
          return false;
        }
        
        const [vendorLon, vendorLat] = medicine.vendorId.address.coordinates;
        const distance = calculateDistance(latitude, longitude, vendorLat, vendorLon);
        
        console.log(`📏 Distance to ${medicine.vendorId?.businessInfo?.businessName || medicine.vendorId?.firstName}: ${distance.toFixed(2)}km`);
        
        return distance <= maxDistance;
      }).map(medicine => {
        const [vendorLon, vendorLat] = medicine.vendorId.address.coordinates;
        const distance = calculateDistance(latitude, longitude, vendorLat, vendorLon);
        
        return {
          ...medicine.toObject(),
          distance: Math.round(distance * 10) / 10 // Round to 1 decimal place
        };
      });

      console.log(`📍 Medicines found within ${maxDistance}km: ${medicines.length}`);
      
      // Sort by distance if location-based search
      if (sortBy === 'distance') {
        medicines.sort((a, b) => {
          const distanceA = a.distance || Infinity;
          const distanceB = b.distance || Infinity;
          return sortOrder === 1 ? distanceA - distanceB : distanceB - distanceA;
        });
      }
    }

    // Calculate statistics
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    res.json({
      medicines: medicines.map(medicine => {
        const medicineObj = medicine.toObject ? medicine.toObject() : medicine;
        
        return {
          _id: medicineObj._id,
          name: medicineObj.name,
          genericName: medicineObj.genericName,
          manufacturer: medicineObj.manufacturer,
          category: medicineObj.category,
          description: medicineObj.description,
          price: medicineObj.price,
          stockQuantity: medicineObj.stockQuantity,
          stock: medicineObj.stockQuantity, // Alias for compatibility
          isAvailable: medicineObj.stockQuantity > 0,
          isLowStock: medicineObj.stockQuantity <= medicineObj.minStockLevel,
          expiryDate: medicineObj.expiryDate,
          prescriptionRequired: medicineObj.prescriptionRequired,
          dosage: medicineObj.dosage,
          strength: medicineObj.dosage, // Alias for strength
          form: medicineObj.category, // Use category as form
          imageUrl: medicineObj.imageUrl,
          tags: medicineObj.tags,
          rating: medicineObj.rating || 0,
          distance: medicineObj.distance,
          pharmacy: medicineObj.vendorId ? {
            _id: medicineObj.vendorId._id,
            name: medicineObj.vendorId.businessInfo?.businessName || 
                  `${medicineObj.vendorId.firstName} ${medicineObj.vendorId.lastName}`,
            address: medicineObj.vendorId.businessInfo?.businessAddress || 
                    (medicineObj.vendorId.address?.street && medicineObj.vendorId.address?.city 
                      ? `${medicineObj.vendorId.address.street}, ${medicineObj.vendorId.address.city}` 
                      : medicineObj.vendorId.address?.street || medicineObj.vendorId.address?.city || 'Address not available'),
            phone: medicineObj.vendorId.businessInfo?.businessPhone || 
                   medicineObj.vendorId.phone,
            email: medicineObj.vendorId.email,
            location: medicineObj.vendorId.address?.coordinates ? {
              type: 'Point',
              coordinates: medicineObj.vendorId.address.coordinates
            } : null,
            // Add vendor rating information
            rating: ratingsMap[medicineObj.vendorId._id.toString()]?.averageRating || 0,
            totalReviews: ratingsMap[medicineObj.vendorId._id.toString()]?.totalReviews || 0
          } : null,
          vendor: medicineObj.vendorId ? {
            id: medicineObj.vendorId._id,
            name: `${medicineObj.vendorId.firstName} ${medicineObj.vendorId.lastName}`,
            email: medicineObj.vendorId.email,
            phone: medicineObj.vendorId.phone
          } : {
            id: null,
            name: 'Unknown Vendor',
            email: null,
            phone: null
          }
        };
      }),
      totalMedicines: total,
      totalPages,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage,
        hasPreviousPage
      },
      filters: {
        search,
        category,
        minPrice,
        maxPrice,
        inStockOnly,
        prescriptionFilter,
        minRating,
        latitude,
        longitude,
        maxDistance,
        sortBy,
        sortOrder: sortOrder === 1 ? 'asc' : 'desc'
      }
    });
  } catch (error) {
    console.error('Error searching medicines:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

router.post('/ai-search', async (req, res) => {
  try {
    const query = String(req.body?.query || '').trim();

    if (!query) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    const parsedQuery = await parseMedicineAgentQuery(query);
    const searchTerm = parsedQuery.medicineName || query;
    const limit = Math.min(Math.max(parseInt(parsedQuery.limit || 10, 10), 1), 20);
    const sortOrder = parsedQuery.sortOrder === 'desc' ? 'desc' : 'asc';

    const vendorFilter = buildMedicineMatchFilter(searchTerm, {
      includeGenericName: true,
      expiryDateFilter: true,
      inStockOnly: Boolean(parsedQuery.inStockOnly),
      minPrice: typeof parsedQuery.minPrice === 'number' ? parsedQuery.minPrice : null,
      maxPrice: typeof parsedQuery.maxPrice === 'number' ? parsedQuery.maxPrice : null
    });

    const scrapedFilter = buildMedicineMatchFilter(searchTerm, {
      expiryDateFilter: false,
      inStockOnly: Boolean(parsedQuery.inStockOnly),
      minPrice: typeof parsedQuery.minPrice === 'number' ? parsedQuery.minPrice : null,
      maxPrice: typeof parsedQuery.maxPrice === 'number' ? parsedQuery.maxPrice : null
    });

    const vendorMedicines = await Medicine.find(vendorFilter)
      .populate('vendorId', 'firstName lastName email phone businessInfo address')
      .sort({ price: sortOrder === 'asc' ? 1 : -1, createdAt: -1 })
      .limit(limit * 3)
      .select('-stockHistory');

    const scrapedMedicines = await ScrapedMedicine.find(scrapedFilter)
      .sort({ price: sortOrder === 'asc' ? 1 : -1, createdAt: -1 })
      .limit(limit * 3)
      .lean();

    const mergedResults = dedupeAndSortMedicineResults(
      [
        ...vendorMedicines.map(item => normalizeMedicineResult(item, 'vendor')),
        ...scrapedMedicines.map(item => normalizeMedicineResult(item, 'scraped'))
      ],
      sortOrder
    );

    return res.json({
      success: true,
      query,
      parsedQuery,
      totalResults: mergedResults.length,
      results: mergedResults.slice(0, limit)
    });
  } catch (error) {
    console.error('Error performing AI medicine search:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to perform AI medicine search',
      error: error.message
    });
  }
});

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
}

// Get featured/popular medicines
router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    
    const featuredMedicines = await Medicine.find({ 
      isActive: true,
      stockQuantity: { $gt: 0 },
      expiryDate: { $gt: new Date() }
    })
    .populate('vendorId', 'firstName lastName')
    .sort({ createdAt: -1 }) // Show newest medicines first
    .limit(limit)
    .select('-stockHistory');

    res.json(featuredMedicines.map(medicine => ({
      _id: medicine._id,
      name: medicine.name,
      genericName: medicine.genericName,
      manufacturer: medicine.manufacturer,
      category: medicine.category,
      description: medicine.description,
      price: medicine.price,
      stockQuantity: medicine.stockQuantity,
      isAvailable: medicine.stockQuantity > 0,
      prescriptionRequired: medicine.prescriptionRequired,
      dosage: medicine.dosage,
      imageUrl: medicine.imageUrl,
      vendor: {
        name: `${medicine.vendorId.firstName} ${medicine.vendorId.lastName}`
      }
    })));
  } catch (error) {
    console.error('Error fetching featured medicines:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get medicine details by ID (public route)
router.get('/public/:id', async (req, res) => {
  try {
    const medicine = await Medicine.findOne({ 
      _id: req.params.id, 
      isActive: true,
      expiryDate: { $gt: new Date() }
    })
    .populate('vendorId', 'firstName lastName email phone')
    .select('-stockHistory');
    
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found or not available' });
    }

    res.json({
      _id: medicine._id,
      name: medicine.name,
      genericName: medicine.genericName,
      manufacturer: medicine.manufacturer,
      category: medicine.category,
      description: medicine.description,
      price: medicine.price,
      stockQuantity: medicine.stockQuantity,
      isAvailable: medicine.stockQuantity > 0,
      isLowStock: medicine.stockQuantity <= medicine.minStockLevel,
      expiryDate: medicine.expiryDate,
      prescriptionRequired: medicine.prescriptionRequired,
      dosage: medicine.dosage,
      sideEffects: medicine.sideEffects,
      imageUrl: medicine.imageUrl,
      tags: medicine.tags,
      vendor: medicine.vendorId ? {
        id: medicine.vendorId._id,
        name: `${medicine.vendorId.firstName} ${medicine.vendorId.lastName}`,
        email: medicine.vendorId.email,
        phone: medicine.vendorId.phone
      } : {
        id: null,
        name: 'Unknown Vendor',
        email: null,
        phone: null
      }
    });
  } catch (error) {
    console.error('Error fetching medicine details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get medicine categories (public route)
router.get('/categories', async (req, res) => {
  try {
    // Get categories from active medicines
    const categories = await Medicine.distinct('category', { 
      isActive: true,
      expiryDate: { $gt: new Date() }
    });
    
    // Add default categories if not present
    const defaultCategories = [
      'Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 
      'Drops', 'Inhaler', 'Suppository', 'Cream', 'Gel', 'Other'
    ];
    
    const allCategories = [...new Set([...categories, ...defaultCategories])];
    
    res.json({
      success: true,
      categories: allCategories.sort()
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get medicine categories (legacy endpoint)
router.get('/data/categories', (req, res) => {
  const categories = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Inhaler', 'Suppository', 'Other'];
  res.json(categories);
});

// Get a specific medicine by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    // Check if user has permission to view this medicine
    if (req.user.role === 'pharmacy_vendor' && medicine.vendorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(medicine);
  } catch (error) {
    console.error('Error fetching medicine:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create a new medicine
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('Creating medicine with user:', req.user);
    
    if (req.user.role !== 'pharmacy_vendor') {
      return res.status(403).json({ message: 'Access denied. Only pharmacy vendors can add medicines.' });
    }

    const {
      name,
      genericName,
      manufacturer,
      category,
      description,
      price,
      stockQuantity,
      minStockLevel,
      expiryDate,
      batchNumber,
      prescriptionRequired,
      dosage,
      sideEffects,
      imageUrl,
      tags
    } = req.body;

    // Validate required fields
    if (!name || !genericName || !manufacturer || !description || !price || !expiryDate || !batchNumber || !dosage) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if medicine with same name and batch number already exists for this vendor
    const existingMedicine = await Medicine.findOne({
      vendorId: new mongoose.Types.ObjectId(req.user.id),
      name: name.trim(),
      batchNumber: batchNumber.trim()
    });

    if (existingMedicine) {
      return res.status(400).json({ message: 'Medicine with this name and batch number already exists' });
    }

    console.log('Creating medicine with vendorId:', req.user.id);

    const medicine = new Medicine({
      name: name.trim(),
      genericName: genericName.trim(),
      manufacturer: manufacturer.trim(),
      category,
      description: description.trim(),
      price: parseFloat(price),
      stockQuantity: parseInt(stockQuantity) || 0,
      minStockLevel: parseInt(minStockLevel) || 10,
      expiryDate: new Date(expiryDate),
      batchNumber: batchNumber.trim(),
      prescriptionRequired: Boolean(prescriptionRequired),
      dosage: dosage.trim(),
      sideEffects: sideEffects?.trim() || '',
      vendorId: new mongoose.Types.ObjectId(req.user.id), // Ensure proper ObjectId
      imageUrl: imageUrl || null,
      tags: tags || []
    });

    // Add initial stock entry if stock quantity > 0
    if (parseInt(stockQuantity) > 0) {
      medicine.stockHistory.push({
        type: 'in',
        quantity: parseInt(stockQuantity),
        reason: 'Initial stock',
        previousStock: 0,
        newStock: parseInt(stockQuantity)
      });
    }

    const savedMedicine = await medicine.save();
    console.log('Medicine created successfully:', savedMedicine._id);
    
    res.status(201).json(savedMedicine);
  } catch (error) {
    console.error('Error creating medicine:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Update a medicine
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'pharmacy_vendor') {
      return res.status(403).json({ message: 'Access denied. Only pharmacy vendors can update medicines.' });
    }

    const medicine = await Medicine.findById(req.params.id);
    
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    if (medicine.vendorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You can only update your own medicines.' });
    }

    const {
      name,
      genericName,
      manufacturer,
      category,
      description,
      price,
      minStockLevel,
      expiryDate,
      batchNumber,
      prescriptionRequired,
      dosage,
      sideEffects,
      imageUrl,
      tags,
      isActive
    } = req.body;

    // Update fields
    if (name) medicine.name = name.trim();
    if (genericName) medicine.genericName = genericName.trim();
    if (manufacturer) medicine.manufacturer = manufacturer.trim();
    if (category) medicine.category = category;
    if (description) medicine.description = description.trim();
    if (price !== undefined) medicine.price = parseFloat(price);
    if (minStockLevel !== undefined) medicine.minStockLevel = parseInt(minStockLevel);
    if (expiryDate) medicine.expiryDate = new Date(expiryDate);
    if (batchNumber) medicine.batchNumber = batchNumber.trim();
    if (prescriptionRequired !== undefined) medicine.prescriptionRequired = Boolean(prescriptionRequired);
    if (dosage) medicine.dosage = dosage.trim();
    if (sideEffects !== undefined) medicine.sideEffects = sideEffects?.trim() || '';
    if (imageUrl !== undefined) medicine.imageUrl = imageUrl || null;
    if (tags) medicine.tags = tags;
    if (isActive !== undefined) medicine.isActive = Boolean(isActive);

    const updatedMedicine = await medicine.save();
    res.json(updatedMedicine);
  } catch (error) {
    console.error('Error updating medicine:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update stock (stock in/out)
router.patch('/:id/stock', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'pharmacy_vendor') {
      return res.status(403).json({ message: 'Access denied. Only pharmacy vendors can update stock.' });
    }

    const { quantity, type, reason } = req.body;

    if (!quantity || !type || !['in', 'out', 'expired', 'damaged'].includes(type)) {
      return res.status(400).json({ message: 'Invalid quantity or type. Type must be: in, out, expired, or damaged' });
    }

    const medicine = await Medicine.findById(req.params.id);
    
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    if (medicine.vendorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You can only update stock for your own medicines.' });
    }

    const parsedQuantity = parseInt(quantity);
    if (parsedQuantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be a positive number' });
    }

    // Check if there's enough stock for out/expired/damaged operations
    if ((type === 'out' || type === 'expired' || type === 'damaged') && medicine.stockQuantity < parsedQuantity) {
      return res.status(400).json({ message: 'Insufficient stock quantity' });
    }

    await medicine.updateStock(parsedQuantity, type, reason || '');
    
    res.json({
      message: 'Stock updated successfully',
      medicine
    });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete a medicine (soft delete)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'pharmacy_vendor') {
      return res.status(403).json({ message: 'Access denied. Only pharmacy vendors can delete medicines.' });
    }

    const medicine = await Medicine.findById(req.params.id);
    
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    if (medicine.vendorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You can only delete your own medicines.' });
    }

    medicine.isActive = false;
    await medicine.save();
    
    res.json({ message: 'Medicine deleted successfully' });
  } catch (error) {
    console.error('Error deleting medicine:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ============ WEB SCRAPING ROUTES ============

/**
 * Trigger web scraping from all sources
 * POST /api/medicines/scrape/trigger
 */
router.post('/scrape/trigger', async (req, res) => {
  try {
    console.log('🔍 Triggering medicine web scraping...');

    const shouldRunInBackground = req.query.background === 'true' || req.body?.background === true;
    const force = req.query.force === 'true' || req.body?.force === true;

    if (shouldRunInBackground) {
      const status = medicineScraperService.startBackgroundScrape({
        force,
        reason: 'api_trigger'
      });

      return res.status(202).json({
        success: true,
        message: status.started ? 'Scraping started in background' : 'Scraping already in progress',
        ...status
      });
    }
    
    const medicines = await medicineScraperService.scrapeAllSources({ force });
    
    console.log(`✅ Scraped ${medicines.length} medicines from all sources`);
    
    res.json({
      success: true,
      message: `Successfully scraped ${medicines.length} medicines from all sources`,
      count: medicines.length
    });
  } catch (error) {
    console.error('Error triggering scrape:', error);
    res.status(500).json({
      success: false,
      message: 'Error during scraping',
      error: error.message
    });
  }
});

/**
 * Get scraped medicines with search and filtering
 * GET /api/medicines/scrape/search?query=paracetamol&category=Tablet&minPrice=10&maxPrice=100&sortBy=price_asc
 */
router.get('/scrape/search', async (req, res) => {
  try {
    const query = req.query.query || '';
    const category = req.query.category || null;
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : null;
    const inStockOnly = req.query.inStockOnly === 'true';
    const sortBy = req.query.sortBy || 'name_asc';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;

    // Get medicines from scraper service
    let medicines = await medicineScraperService.searchScrapedMedicines(query, {
      category,
      minPrice,
      maxPrice,
      inStockOnly,
      sortBy
    });

    // Pagination
    const total = medicines.length;
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    const paginatedMedicines = medicines.slice(skip, skip + limit);

    res.json({
      success: true,
      medicines: paginatedMedicines,
      scraper: medicineScraperService.getScrapeStatus(),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error searching scraped medicines:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching scraped medicines',
      error: error.message
    });
  }
});

/**
 * Get all scraped medicines (without search)
 * GET /api/medicines/scrape/all?page=1&limit=20
 */
router.get('/scrape/all', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    console.log(`📦 Fetching all scraped medicines - page ${page}, limit ${limit}`);

    // Get all scraped medicines
    const medicines = await medicineScraperService.searchScrapedMedicines('', {});

    // Pagination
    const total = medicines.length;
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    const paginatedMedicines = medicines.slice(skip, skip + limit);

    res.json({
      success: true,
      medicines: paginatedMedicines,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching scraped medicines:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching scraped medicines',
      error: error.message
    });
  }
});

/**
 * Get scraped medicines from specific source
 * GET /api/medicines/scrape/source/:source?page=1&limit=20
 */
router.get('/scrape/source/:source', async (req, res) => {
  try {
    const source = req.params.source;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    console.log(`🏪 Fetching scraped medicines from source: ${source}`);

    // Get medicines from specific source
    let medicines = await medicineScraperService.searchScrapedMedicines('', {});
    medicines = medicines.filter(m => m.source === source);

    // Pagination
    const total = medicines.length;
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    const paginatedMedicines = medicines.slice(skip, skip + limit);

    res.json({
      success: true,
      source,
      medicines: paginatedMedicines,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error(`Error fetching scraped medicines from ${req.params.source}:`, error);
    res.status(500).json({
      success: false,
      message: `Error fetching medicines from ${req.params.source}`,
      error: error.message
    });
  }
});

const compareStopWords = new Set([
  'tablet', 'tab', 'capsule', 'cap', 'syrup', 'injection', 'drop', 'drops',
  'mg', 'mcg', 'ml', 'gm', 'g', 'iu', 'suspension', 'solution', 'cream', 'ointment'
]);

const normalizeCompareText = (text = '') => {
  return String(text)
    .toLowerCase()
    .replace(/\b\d+(?:\.\d+)?\s*(mg|mcg|ml|gm|g|iu|%|tablet|tab|capsule|cap|syrup|injection|drop|drops|cream|ointment)\b/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const tokenizeCompareText = (text = '') => {
  return normalizeCompareText(text)
    .split(' ')
    .filter(token => token && token.length > 1 && !compareStopWords.has(token));
};

const compareScore = (target, candidate) => {
  const targetText = normalizeCompareText(target);
  const candidateText = normalizeCompareText(candidate);

  if (!targetText || !candidateText) {
    return 0;
  }

  if (targetText === candidateText) {
    return 1.5;
  }

  const targetTokens = new Set(tokenizeCompareText(target));
  const candidateTokens = new Set(tokenizeCompareText(candidate));

  if (targetTokens.size === 0 || candidateTokens.size === 0) {
    return 0;
  }

  let shared = 0;
  for (const token of targetTokens) {
    if (candidateTokens.has(token)) shared += 1;
  }

  return shared / Math.max(targetTokens.size, candidateTokens.size);
};

/**
 * Compare a vendor medicine against scraped medicines.
 * POST /api/medicines/compare
 */
router.post('/compare', async (req, res) => {
  try {
    const { name = '', genericName = '', manufacturer = '', price = 0, limit = 8 } = req.body || {};
    // Get scraped medicines
    const allScrapedMedicines = await medicineScraperService.searchScrapedMedicines('', {});

    // Also search partner/vendor medicines from our DB
    let partnerMedicines = [];
    try {
      const searchTerm = name || genericName || '';
      if (searchTerm) {
        const regex = buildSearchRegex(searchTerm) || new RegExp(escapeRegex(searchTerm), 'i');
        partnerMedicines = await Medicine.find({
          isActive: true,
          $or: [ { name: regex }, { genericName: regex } ]
        }).limit(50).lean();
      }
    } catch (e) {
      console.warn('Failed to query partner medicines for compare:', e.message || e);
      partnerMedicines = [];
    }

    const scoredScraped = allScrapedMedicines.map((item) => {
      const score = Math.max(
        compareScore(name, item.name),
        genericName ? compareScore(genericName, item.name) : 0
      );

      return {
        ...item,
        matchScore: score,
        priceDifference: Number(item.price || 0) - Number(price || 0)
      };
    });

    // Resolve vendor names for partner medicines
    let vendorMap = new Map();
    try {
      const vendorIds = Array.from(new Set(partnerMedicines.map(p => String(p.vendorId)).filter(Boolean)));
      if (vendorIds.length > 0) {
        const User = (await import('../models/User.js')).default;
        const vendors = await User.find({ _id: { $in: vendorIds } }, 'businessInfo.pharmacyName firstName lastName').lean();
        for (const v of vendors) {
          const name = (v.businessInfo && v.businessInfo.pharmacyName) ? v.businessInfo.pharmacyName : `${v.firstName || ''} ${v.lastName || ''}`.trim() || 'Partner Pharmacy';
          vendorMap.set(String(v._id), name);
        }
      }
    } catch (e) {
      console.warn('Failed to load vendor names for compare:', e.message || e);
    }

    const scoredPartner = partnerMedicines.map((item) => {
      const score = Math.max(
        compareScore(name, item.name),
        genericName ? compareScore(genericName, item.name) : 0
      );

      const vendorIdStr = item.vendorId ? String(item.vendorId) : null;
      const vendorName = vendorIdStr ? (vendorMap.get(vendorIdStr) || 'Partner Pharmacy') : 'Partner Pharmacy';

      return {
        _id: item._id,
        name: item.name,
        genericName: item.genericName,
        manufacturer: item.manufacturer,
        price: item.price,
        source: vendorName,
        sourceId: item.vendorId || null,
        sourceUrl: item.vendorId ? `/vendors/${item.vendorId}` : null,
        matchScore: score,
        priceDifference: Number(item.price || 0) - Number(price || 0)
      };
    });

    // Combine both sources
    const allCandidates = [...scoredPartner, ...scoredScraped];

    let matches = allCandidates
      .filter(item => item.matchScore >= 0.3)
      .sort((a, b) => b.matchScore - a.matchScore || Number(a.price) - Number(b.price));

    if (matches.length === 0) {
      matches = allCandidates
        .sort((a, b) => b.matchScore - a.matchScore || Number(a.price) - Number(b.price))
        .slice(0, Math.min(Number(limit) || 8, 8));
    } else {
      matches = matches.slice(0, Math.min(Number(limit) || 8, 8));
    }

    // Deduplicate prefering cheapest per source (and prefer partner over scraped if same source label)
    const uniqueBySource = new Map();
    for (const item of matches) {
      const sourceKey = (item.source || (item.sourceId ? 'partner' : 'scraped') || 'unknown').toString().toLowerCase();
      const existing = uniqueBySource.get(sourceKey);
      if (!existing) {
        uniqueBySource.set(sourceKey, item);
      } else {
        // prefer lower price or prefer partner entries
        const existingIsPartner = (existing.source || '').toString().toLowerCase().includes('partner');
        const itemIsPartner = (item.source || '').toString().toLowerCase().includes('partner');
        if (itemIsPartner && !existingIsPartner) {
          uniqueBySource.set(sourceKey, item);
        } else if (Number(item.price || 0) < Number(existing.price || 0)) {
          uniqueBySource.set(sourceKey, item);
        }
      }
    }

    const finalMatches = Array.from(uniqueBySource.values())
      .sort((a, b) => b.matchScore - a.matchScore || Number(a.price) - Number(b.price))
      .slice(0, Math.min(Number(limit) || 8, 8));

    res.json({
      success: true,
      input: { name, genericName, manufacturer, price },
      matches: finalMatches
    });
  } catch (error) {
    console.error('Error comparing medicine prices:', error);
    res.status(500).json({
      success: false,
      message: 'Error comparing medicine prices',
      error: error.message
    });
  }
});

/**
 * Clear cache for scraped medicines
 * POST /api/medicines/scrape/clear-cache?source=Unipharma
 */
router.post('/scrape/clear-cache', async (req, res) => {
  try {
    const source = req.query.source || null;

    if (source) {
      medicineScraperService.clearCache(source);
      console.log(`🧹 Cache cleared for source: ${source}`);
      res.json({
        success: true,
        message: `Cache cleared for ${source}`
      });
    } else {
      medicineScraperService.clearCache();
      console.log(`🧹 All caches cleared`);
      res.json({
        success: true,
        message: 'All caches cleared'
      });
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing cache',
      error: error.message
    });
  }
});

/**
 * Get scraping statistics
 * GET /api/medicines/scrape/stats
 */
router.get('/scrape/stats', async (req, res) => {
  try {
    // Get all scraped medicines
    const allMedicines = await medicineScraperService.searchScrapedMedicines('', {});

    // Group by source
    const stats = {
      totalScraped: allMedicines.length,
      bySource: {},
      byCategory: {},
      priceStats: {
        min: 0,
        max: 0,
        average: 0
      }
    };

    // Calculate statistics
    allMedicines.forEach(medicine => {
      // By source
      if (!stats.bySource[medicine.source]) {
        stats.bySource[medicine.source] = 0;
      }
      stats.bySource[medicine.source]++;

      // By category
      if (!stats.byCategory[medicine.category]) {
        stats.byCategory[medicine.category] = 0;
      }
      stats.byCategory[medicine.category]++;
    });

    // Price statistics
    if (allMedicines.length > 0) {
      const prices = allMedicines.map(m => m.price);
      stats.priceStats.min = Math.min(...prices);
      stats.priceStats.max = Math.max(...prices);
      stats.priceStats.average = Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100;
    }

    res.json({
      success: true,
      stats,
      scraper: medicineScraperService.getScrapeStatus()
    });
  } catch (error) {
    console.error('Error fetching scraping stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

export default router;
