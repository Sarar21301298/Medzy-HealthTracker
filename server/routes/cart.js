import express from 'express';
import User from '../models/User.js';
import Medicine from '../models/Medicine.js';
import ScrapedMedicine from '../models/ScrapedMedicine.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const normalizeText = (value = '') => {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const isMedicineNotExpired = (medicine) => {
  if (!medicine?.expiryDate) {
    return false;
  }

  return new Date(medicine.expiryDate).getTime() >= Date.now();
};

const calculateCurrentSubtotal = (cartItems = []) => {
  return cartItems.reduce((total, item) => {
    const price = Number(item?.medicine?.price || 0);
    const quantity = Number(item?.quantity || 0);
    return total + (price * quantity);
  }, 0);
};

const getMedicineMatchKey = (medicine = {}) => {
  const exactName = normalizeText(medicine.name);
  const genericName = normalizeText(medicine.genericName);
  const dosage = normalizeText(medicine.dosage);

  return {
    exactName,
    genericDosage: normalizeText(`${medicine.genericName || ''} ${medicine.dosage || ''}`),
    genericName,
    dosage,
    category: normalizeText(medicine.category)
  };
};

const formatVendorInfo = (vendor = {}) => ({
  _id: vendor?._id || null,
  firstName: vendor?.firstName || '',
  lastName: vendor?.lastName || '',
  email: vendor?.email || '',
  phone: vendor?.phone || '',
  businessInfo: vendor?.businessInfo || null,
  pharmacyName: vendor?.businessInfo?.pharmacyName || '',
  name: vendor?.businessInfo?.pharmacyName || `${vendor?.firstName || ''} ${vendor?.lastName || ''}`.trim() || 'Unknown Vendor'
});

const findBestSingleSourceVendor = async (cartItems = []) => {
  const regularItems = cartItems.filter(item => item.type === 'regular' && item.medicine);
  const currentSubtotal = calculateCurrentSubtotal(regularItems);

  const normalizedCartItems = regularItems.map((item) => ({
    cartItemId: item._id?.toString(),
    requestedMedicineId: item.medicine._id?.toString(),
    requestedMedicineName: item.medicine.name,
    genericName: item.medicine.genericName,
    dosage: item.medicine.dosage,
    category: item.medicine.category,
    quantity: Number(item.quantity || 0),
    currentPrice: Number(item.medicine.price || 0),
    currentVendorId: item.medicine.vendorId?._id?.toString?.() || item.medicine.vendorId?.toString?.() || null,
    matchKey: getMedicineMatchKey(item.medicine)
  }));

  const eligibleMedicines = await Medicine.find({
    isActive: true,
    stockQuantity: { $gt: 0 },
    expiryDate: { $gte: new Date() }
  })
    .populate({
      path: 'vendorId',
      select: 'firstName lastName email phone businessInfo'
    })
    .lean();

  const vendorBuckets = new Map();

  for (const requestedItem of normalizedCartItems) {
    const bestMatchesByVendor = new Map();

    for (const candidate of eligibleMedicines) {
      if (!candidate?.vendorId?._id) {
        continue;
      }

      if (!isMedicineNotExpired(candidate)) {
        continue;
      }

      if (Number(candidate.stockQuantity || 0) < requestedItem.quantity) {
        continue;
      }

      const candidateMatchKey = getMedicineMatchKey(candidate);
      const exactNameMatch = requestedItem.matchKey.exactName && candidateMatchKey.exactName === requestedItem.matchKey.exactName;
      const genericDosageMatch = !exactNameMatch && requestedItem.matchKey.genericName && requestedItem.matchKey.dosage && candidateMatchKey.genericName === requestedItem.matchKey.genericName && candidateMatchKey.dosage === requestedItem.matchKey.dosage;

      if (!exactNameMatch && !genericDosageMatch) {
        continue;
      }

      const vendorId = candidate.vendorId._id.toString();
      const existing = bestMatchesByVendor.get(vendorId);

      if (!existing || Number(candidate.price || 0) < Number(existing.price || 0)) {
        bestMatchesByVendor.set(vendorId, candidate);
      }
    }

    for (const [vendorId, candidate] of bestMatchesByVendor.entries()) {
      if (!vendorBuckets.has(vendorId)) {
        vendorBuckets.set(vendorId, {
          vendor: candidate.vendorId,
          selections: new Map()
        });
      }

      const bucket = vendorBuckets.get(vendorId);
      const currentSelection = bucket.selections.get(requestedItem.requestedMedicineId);

      if (!currentSelection || Number(candidate.price || 0) < Number(currentSelection.price || 0)) {
        bucket.selections.set(requestedItem.requestedMedicineId, {
          requestedMedicineId: requestedItem.requestedMedicineId,
          requestedMedicineName: requestedItem.requestedMedicineName,
          selectedMedicineId: candidate._id.toString(),
          selectedMedicineName: candidate.name,
          genericName: candidate.genericName,
          dosage: candidate.dosage,
          category: candidate.category,
          quantity: requestedItem.quantity,
          oldPrice: requestedItem.currentPrice,
          optimizedPrice: Number(candidate.price || 0),
          itemTotal: Number(candidate.price || 0) * requestedItem.quantity,
          vendorId
        });
      }
    }
  }

  let bestVendorResult = null;
  let bestPartialResult = null;

  for (const [vendorId, bucket] of vendorBuckets.entries()) {
    const optimizedItems = [];
    const missingItems = [];
    let optimizedSubtotal = 0;

    for (const requestedItem of normalizedCartItems) {
      const selection = bucket.selections.get(requestedItem.requestedMedicineId);

      if (!selection) {
        missingItems.push({
          requestedMedicineId: requestedItem.requestedMedicineId,
          requestedMedicineName: requestedItem.requestedMedicineName,
          genericName: requestedItem.genericName,
          dosage: requestedItem.dosage,
          category: requestedItem.category,
          quantity: requestedItem.quantity
        });
        continue;
      }

      optimizedItems.push(selection);
      optimizedSubtotal += selection.itemTotal;
    }

    const vendorResult = {
      vendorId,
      vendor: bucket.vendor,
      optimizedItems,
      optimizedSubtotal,
      missingItems,
      matchedCount: optimizedItems.length,
      totalItems: normalizedCartItems.length
    };

    if (missingItems.length === 0) {
      if (!bestVendorResult || optimizedSubtotal < bestVendorResult.optimizedSubtotal) {
        bestVendorResult = vendorResult;
      }
    } else if (!bestPartialResult
      || vendorResult.matchedCount > bestPartialResult.matchedCount
      || (vendorResult.matchedCount === bestPartialResult.matchedCount && vendorResult.optimizedSubtotal < bestPartialResult.optimizedSubtotal)) {
      bestPartialResult = vendorResult;
    }
  }

  return {
    canOptimize: Boolean(bestVendorResult),
    currentSubtotal,
    bestVendorResult,
    bestPartialResult,
    missingItems: bestVendorResult ? [] : (bestPartialResult?.missingItems || normalizedCartItems.map(item => ({
      requestedMedicineId: item.requestedMedicineId,
      requestedMedicineName: item.requestedMedicineName,
      genericName: item.genericName,
      dosage: item.dosage,
      category: item.category,
      quantity: item.quantity
    })))
  };
};

// Add item to cart (supports both regular and scraped medicines)
router.post('/add', authenticateToken, async (req, res) => {
  try {
    const { medicineId, scrapedMedicineId, scrapedMedicineData, quantity = 1 } = req.body;
    
    if (!medicineId && !scrapedMedicineId) {
      return res.status(400).json({ message: 'Either medicineId or scrapedMedicineId is required' });
    }

    let itemType;

    // Handle regular medicines
    if (medicineId) {
      const medicine = await Medicine.findById(medicineId);
      if (!medicine) {
        return res.status(404).json({ message: 'Medicine not found' });
      }

      if (!medicine.isActive) {
        return res.status(400).json({ message: 'Medicine is not available' });
      }

      if (medicine.stockQuantity < quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock. Only ${medicine.stockQuantity} units available` 
        });
      }
      itemType = 'regular';
    } 
    // Handle scraped medicines
    else if (scrapedMedicineId) {
      // Validate ID format (should be 32-char hex from MD5 hash)
      if (!/^[a-f0-9]{32}$/.test(scrapedMedicineId)) {
        return res.status(400).json({ message: 'Invalid scraped medicine ID format' });
      }
      
      if (!scrapedMedicineData) {
        return res.status(400).json({ message: 'Scraped medicine data is required' });
      }
      
      itemType = 'scraped';
    }

    // Get user and update cart
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if item already exists in cart
    let existingItemIndex = -1;
    if (itemType === 'regular') {
      existingItemIndex = user.cart.findIndex(
        item => item.type === 'regular' && item.medicine?.toString() === medicineId
      );
    } else {
      existingItemIndex = user.cart.findIndex(
        item => item.type === 'scraped' && item.scrapedMedicineId === scrapedMedicineId
      );
    }

    if (existingItemIndex > -1) {
      // Update quantity if item exists
      const newQuantity = user.cart[existingItemIndex].quantity + quantity;
      user.cart[existingItemIndex].quantity = newQuantity;
    } else {
      // Add new item to cart
      const newCartItem = {
        quantity: quantity,
        type: itemType,
        addedAt: new Date()
      };
      
      if (itemType === 'regular') {
        newCartItem.medicine = medicineId;
      } else {
        newCartItem.scrapedMedicineId = scrapedMedicineId;
        newCartItem.scrapedMedicineData = scrapedMedicineData;
      }
      
      user.cart.push(newCartItem);
    }

    await user.save();

    res.json({ 
      message: 'Item added to cart successfully',
      cartItemCount: user.cart.length
    });

  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get cart items
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate([
      {
        path: 'cart.medicine',
        populate: {
          path: 'vendorId',
          select: 'firstName lastName email phone businessInfo'
        }
      }
    ]);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Process cart items - both regular and scraped
    let subtotal = 0;
    const cartItems = user.cart.map(item => {
      let price = 0;
      let itemData = {
        _id: item._id,
        quantity: item.quantity,
        type: item.type,
        addedAt: item.addedAt
      };

      if (item.type === 'regular' && item.medicine) {
        price = item.medicine.price;
        const vendor = item.medicine.vendorId;
        itemData.medicine = {
          _id: item.medicine._id,
          name: item.medicine.name,
          genericName: item.medicine.genericName,
          price: item.medicine.price,
          stockQuantity: item.medicine.stockQuantity,
          isAvailable: item.medicine.stockQuantity > 0 && item.medicine.isActive,
          imageUrl: item.medicine.imageUrl,
          source: 'regular',
          vendorId: vendor?._id || null,
          vendor: vendor ? formatVendorInfo(vendor) : null
        };
      } else if (item.type === 'scraped' && item.scrapedMedicineData) {
        price = item.scrapedMedicineData.price;
        itemData.scrapedMedicine = {
          _id: item.scrapedMedicineId,
          ...item.scrapedMedicineData,
          isAvailable: true
        };
      }

      const itemTotal = price * item.quantity;
      subtotal += itemTotal;
      itemData.itemTotal = itemTotal;

      return itemData;
    });

    const deliveryFee = subtotal > 500 ? 0 : 50; // Free delivery for orders above ৳500
    const total = subtotal + deliveryFee;

    res.json({
      items: cartItems,
      summary: {
        itemCount: cartItems.length,
        subtotal,
        deliveryFee,
        total
      }
    });

  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Optimize basket to a single pharmacy/vendor
router.post('/optimize-single-source', authenticateToken, async (req, res) => {
  try {
    const apply = Boolean(req.body?.apply);

    const user = await User.findById(req.user.id).populate({
      path: 'cart.medicine',
      populate: {
        path: 'vendorId',
        select: 'firstName lastName email phone businessInfo'
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.cart || user.cart.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    if (user.cart.some(item => item.type === 'scraped')) {
      return res.status(400).json({
        success: false,
        message: 'Basket optimization is only available for regular medicines. Please remove external/scraped medicines first.'
      });
    }

    const optimizationResult = await findBestSingleSourceVendor(user.cart);

    if (!optimizationResult.canOptimize) {
      return res.json({
        success: false,
        canOptimize: false,
        message: 'No single pharmacy can fulfill the full basket',
        currentSubtotal: optimizationResult.currentSubtotal,
        missingItems: optimizationResult.missingItems
      });
    }

    const { bestVendorResult, currentSubtotal } = optimizationResult;
    const optimizedSubtotal = bestVendorResult.optimizedSubtotal;
    const savings = Math.max(0, currentSubtotal - optimizedSubtotal);

    if (apply) {
      const selectionMap = new Map(
        bestVendorResult.optimizedItems.map(item => [String(item.requestedMedicineId), String(item.selectedMedicineId)])
      );

      user.cart.forEach((item) => {
        if (item.type !== 'regular' || !item.medicine) {
          return;
        }

        const selectedMedicineId = selectionMap.get(item.medicine._id.toString());
        if (selectedMedicineId) {
          item.medicine = selectedMedicineId;
        }
      });

      await user.save();
    }

    return res.json({
      success: true,
      canOptimize: true,
      message: 'Best single pharmacy found',
      bestVendor: formatVendorInfo(bestVendorResult.vendor),
      currentSubtotal,
      optimizedSubtotal,
      savings,
      optimizedItems: bestVendorResult.optimizedItems,
      cartUpdated: apply
    });
  } catch (error) {
    console.error('Error optimizing basket:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while optimizing basket'
    });
  }
});

// Update cart item quantity
router.put('/update', authenticateToken, async (req, res) => {
  try {
    const { cartItemId, medicineId, scrapedMedicineId, quantity } = req.body;
    
    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: 'Valid quantity is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let cartItemIndex = -1;
    let itemType = null;

    // Find item by cartItemId or by medicine/scrapedMedicine ID
    if (cartItemId) {
      cartItemIndex = user.cart.findIndex(item => item._id.toString() === cartItemId);
      if (cartItemIndex > -1) {
        itemType = user.cart[cartItemIndex].type;
      }
    } else if (medicineId) {
      cartItemIndex = user.cart.findIndex(
        item => item.type === 'regular' && item.medicine?.toString() === medicineId
      );
      itemType = 'regular';
    } else if (scrapedMedicineId) {
      cartItemIndex = user.cart.findIndex(
        item => item.type === 'scraped' && item.scrapedMedicineId === scrapedMedicineId
      );
      itemType = 'scraped';
    }

    if (cartItemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    // Validate stock for regular medicines
    if (itemType === 'regular' && medicineId) {
      const medicine = await Medicine.findById(medicineId);
      if (!medicine) {
        return res.status(404).json({ message: 'Medicine not found' });
      }

      if (quantity > medicine.stockQuantity) {
        return res.status(400).json({ 
          message: `Insufficient stock. Only ${medicine.stockQuantity} units available` 
        });
      }
    }

    user.cart[cartItemIndex].quantity = quantity;
    await user.save();

    res.json({ message: 'Cart updated successfully' });

  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove item from cart (supports both regular and scraped medicines)
router.delete('/remove/:itemId', authenticateToken, async (req, res) => {
  try {
    const { itemId } = req.params;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove by cart item ID (supports both types)
    user.cart = user.cart.filter(item => item._id.toString() !== itemId);

    await user.save();

    res.json({ 
      message: 'Item removed from cart successfully',
      cartItemCount: user.cart.length
    });

  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Clear entire cart
router.delete('/clear', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.cart = [];
    await user.save();

    res.json({ message: 'Cart cleared successfully' });

  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get cart item count
router.get('/count', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ count: user.cart.length });

  } catch (error) {
    console.error('Error fetching cart count:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
