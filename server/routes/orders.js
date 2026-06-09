import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Rider from '../models/Rider.js';
import Medicine from '../models/Medicine.js';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Helper function to map frontend payment methods to valid enum values
const getValidPaymentMethod = (paymentMethod) => {
  const paymentMethodMap = {
    'cash_on_delivery': 'cash',
    'credit_card': 'card', // Map credit_card to card for backward compatibility
    'debit_card': 'card',
    'mobile_banking': 'mobile_banking',
    'bank_transfer': 'bank_transfer',
    'bkash': 'bkash',
    'nagad': 'nagad',
    'rocket': 'rocket',
    'stripe': 'stripe',
    'sslcommerz': 'sslcommerz',
    'dummy': 'dummy'
  };
  
  return paymentMethodMap[paymentMethod] || paymentMethod || 'cash';
};

const buildRiderOfferQuery = (excludedRiderId = null) => {
  const query = {
    verificationStatus: 'verified',
    liveStatus: 'active'
  };

  if (excludedRiderId) {
    query.userId = { $ne: excludedRiderId };
  }

  return query;
};

const assignOrderToRider = async (order, excludedRiderId = null) => {
  const query = buildRiderOfferQuery(excludedRiderId);
  console.log('🔍 Searching for rider with query:', query);
  
  const riderProfile = await Rider.findOne(query)
    .sort({ goLiveAt: 1, createdAt: 1 })
    .populate('userId', 'firstName lastName email phone role');

  if (!riderProfile) {
    console.log('⚠️ No verified active riders found');
    order.deliveryAssignment = {
      rider: null,
      status: 'unassigned',
      offeredAt: null,
      respondedAt: null,
      responseNote: ''
    };

    await order.save();
    return null;
  }

  order.deliveryAssignment = {
    rider: riderProfile.userId._id,
    status: 'pending',
    offeredAt: new Date(),
    respondedAt: null,
    responseNote: ''
  };

  await order.save();

  return riderProfile;
};

// Helper function to update payment status when order is delivered
const updatePaymentForDeliveredOrder = async (order, vendorId) => {
  try {
    // Find existing payment for this order and vendor
    const payment = await Payment.findOne({
      orderId: order._id,
      vendorId: vendorId
    });

    if (!payment) {
      console.log(`⚠️ No payment found for order ${order._id} and vendor ${vendorId}`);
      // Create payment if it doesn't exist (fallback)
      return await createPaymentForDeliveredOrder(order, vendorId);
    }

    if (payment.status === 'completed') {
      console.log(`💰 Payment already completed for order ${order._id} and vendor ${vendorId}`);
      return payment;
    }

    // Update payment status to completed
    payment.status = 'completed';
    payment.paymentDetails = {
      ...payment.paymentDetails,
      deliveredAt: order.deliveredAt || new Date(),
      completedAt: new Date()
    };

    await payment.save();
    
    console.log(`✅ Payment status updated to completed:`, {
      transactionId: payment.transactionId,
      amount: payment.amount,
      vendorEarnings: payment.vendorEarnings,
      medzyRevenue: payment.medzyRevenue,
      status: payment.status
    });

    // Update order payment status
    order.paymentStatus = 'paid';
    await order.save();

    return payment;
  } catch (error) {
    console.error('❌ Error updating payment for delivered order:', error);
    throw error;
  }
};

// Helper function to create payment when order is delivered (fallback)
const createPaymentForDeliveredOrder = async (order, vendorId) => {
  try {
    // Calculate vendor's portion of the order
    const vendorItems = order.items.filter(item => item.vendor.toString() === vendorId.toString());
    const vendorAmount = vendorItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);

    if (vendorAmount <= 0) {
      console.log(`⚠️ No items found for vendor ${vendorId} in order ${order._id}`);
      return null;
    }

    // Create payment record
    const payment = new Payment({
      transactionId: `TXN_${order.trackingId}_${vendorId}_${Date.now()}`,
      userId: order.customer,
      vendorId: vendorId,
      orderId: order._id,
      amount: vendorAmount,
      status: 'completed', // Order is delivered, so payment is completed
      paymentMethod: order.paymentMethod === 'cash_on_delivery' ? 'cash' : order.paymentMethod || 'cash',
      paymentDetails: {
        orderNumber: order.orderNumber,
        trackingId: order.trackingId,
        deliveredAt: order.deliveredAt || new Date()
      }
      // vendorEarnings and medzyRevenue will be calculated by the pre-save hook
    });

    await payment.save();
    
    console.log(`✅ Fallback payment created successfully:`, {
      transactionId: payment.transactionId,
      amount: vendorAmount,
      vendorEarnings: payment.vendorEarnings,
      medzyRevenue: payment.medzyRevenue,
      orderId: order._id,
      vendorId: vendorId
    });

    return payment;
  } catch (error) {
    console.error('❌ Error creating fallback payment for delivered order:', error);
    throw error;
  }
};

// General orders route - redirects based on user role
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role === 'pharmacy_vendor') {
      // For vendors, get orders that contain their medicines
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const orders = await Order.find({
        'items.vendor': req.user.id
      })
      .populate([
        {
          path: 'customer',
          select: 'firstName lastName email phone'
        },
        {
          path: 'items.medicine',
          select: 'name genericName imageUrl price'
        }
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

      const total = await Order.countDocuments({
        'items.vendor': req.user.id
      });

      res.json({
        success: true,
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } else {
      // For customers, get their orders
      // Validate user ID
      if (!req.user.id || req.user.id === 'customer' || req.user.id === 'admin' || req.user.id === 'vendor') {
        return res.status(400).json({ message: 'Invalid user authentication' });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const orders = await Order.find({ customer: req.user.id })
        .populate([
          {
            path: 'items.medicine',
            select: 'name genericName imageUrl price'
          },
          {
            path: 'items.vendor',
            select: 'firstName lastName email phone'
          }
        ])
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Order.countDocuments({ customer: req.user.id });

      res.json({
        success: true,
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    }
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create order from cart
router.post('/create', authenticateToken, async (req, res) => {
  try {
    console.log('🛒 Order creation request received from user:', req.user.id);
    console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
    
    const { 
      paymentMethod, 
      shippingAddress, 
      notes 
    } = req.body;

    if (!paymentMethod || !shippingAddress) {
      console.log('❌ Missing required fields: paymentMethod or shippingAddress');
      return res.status(400).json({ message: 'Payment method and shipping address are required' });
    }

    // Validate shipping address
    const requiredFields = ['fullName', 'phone', 'email', 'address', 'city', 'postalCode'];
    for (const field of requiredFields) {
      if (!shippingAddress[field]) {
        console.log(`❌ Missing shipping address field: ${field}`);
        return res.status(400).json({ message: `${field} is required in shipping address` });
      }
    }

    // Get user with cart
    console.log('👤 Fetching user and cart...');

    if (!req.user.id || req.user.id === 'customer' || req.user.id === 'admin' || req.user.id === 'vendor') {
      console.log('❌ Invalid user ID detected:', req.user.id);
      return res.status(400).json({ message: 'Invalid user authentication' });
    }

    const user = await User.findById(req.user.id).populate({
      path: 'cart.medicine',
      populate: {
        path: 'vendorId',
        select: 'firstName lastName email phone businessInfo'
      }
    });
    if (!user) {
      console.log('❌ User not found:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`🛒 User cart contains ${user.cart?.length || 0} items`);
    if (!user.cart || user.cart.length === 0) {
      console.log('❌ Cart is empty');
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const regularItems = user.cart.filter(item => item.type === 'regular');
    const scrapedItems = user.cart.filter(item => item.type === 'scraped');

    if (scrapedItems.length > 0) {
      console.log('❌ Scraped medicines found in checkout cart');
      return res.status(400).json({
        message: 'Checkout does not support scraped medicines. Please remove external items first.'
      });
    }

    // Validate cart items and calculate totals
    const orderItems = [];
    let subtotal = 0;
    const vendorIds = new Set();
    const normalizedItems = [];

    console.log('🔍 Validating cart items...');
    for (const cartItem of regularItems) {
      const medicine = cartItem.medicine;
      console.log(`📋 Processing cart item: ${medicine?.name || 'Unknown'} (${cartItem.quantity}x)`);
      
      if (!medicine || !medicine.isActive) {
        console.log(`❌ Medicine unavailable: ${medicine ? medicine.name : 'unknown'}`);
        return res.status(400).json({ 
          message: `Medicine ${medicine ? medicine.name : 'unknown'} is no longer available` 
        });
      }

      if (medicine.stockQuantity < cartItem.quantity) {
        console.log(`❌ Insufficient stock for ${medicine.name}: need ${cartItem.quantity}, have ${medicine.stockQuantity}`);
        return res.status(400).json({ 
          message: `Insufficient stock for ${medicine.name}. Only ${medicine.stockQuantity} units available` 
        });
      }

      if (!medicine.expiryDate || new Date(medicine.expiryDate) <= new Date()) {
        console.log(`❌ Medicine expired for ${medicine.name}`);
        return res.status(400).json({
          message: `Medicine ${medicine.name} is expired and cannot be ordered`
        });
      }

      const vendorId = medicine.vendorId?._id || medicine.vendorId || medicine.vendor || null;
      if (!vendorId) {
        console.log(`❌ Missing vendor for medicine ${medicine.name}`);
        return res.status(400).json({
          message: `Medicine ${medicine.name} is missing vendor information`
        });
      }

      vendorIds.add(vendorId.toString());
      normalizedItems.push({ cartItem, medicine, vendorId });

      const itemTotal = medicine.price * cartItem.quantity;
      subtotal += itemTotal;

      orderItems.push({
        medicine: medicine._id,
        quantity: cartItem.quantity,
        price: medicine.price,
        vendor: vendorId
      });
    }

    if (vendorIds.size > 1) {
      console.log('❌ Multiple vendors detected in checkout cart:', Array.from(vendorIds));
      return res.status(400).json({
        message: 'Your cart contains medicines from multiple pharmacies. Please optimize your basket to a single pharmacy before checkout.',
        requiresOptimization: true
      });
    }

    const singleVendorId = vendorIds.size === 1 ? Array.from(vendorIds)[0] : null;

    // Calculate delivery fee and total
    const deliveryFee = subtotal > 500 ? 0 : 50;
    const total = subtotal + deliveryFee;

    // Calculate estimated delivery (3-5 business days)
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 4);

    console.log('🛒 Creating order with data:', {
      customer: req.user.id,
      paymentMethod,
      shippingAddress: shippingAddress.fullName,
      subtotal,
      deliveryFee,
      total,
      itemsCount: orderItems.length,
      vendorId: singleVendorId
    });

    // Create order
    const order = new Order({
      customer: req.user.id,
      items: orderItems,
      paymentMethod,
      shippingAddress,
      subtotal,
      deliveryFee,
      total,
      notes,
      estimatedDelivery,
      vendorId: singleVendorId
    });

    console.log('💾 Saving order to database...');
    await order.save();
    console.log('✅ Order saved successfully with ID:', order._id);
    console.log('🏷️ Order tracking ID:', order.trackingId);

    // Offer the new order to one verified active rider
    try {
      const riderProfile = await assignOrderToRider(order);
      if (riderProfile) {
        console.log(`🚴 Order ${order.trackingId} offered to rider ${riderProfile.fullName}`);
      } else {
        console.log(`⚠️ No available rider found for order ${order.trackingId}`);
      }
    } catch (assignmentError) {
      console.error('❌ Failed to assign order to rider:', assignmentError);
    }

    // Update medicine stock quantities and create a single vendor payment record
    console.log('📦 Updating medicine stock quantities and creating single vendor payment...');
    for (const item of normalizedItems) {
      const medicine = item.medicine;
      console.log(`📉 Reducing stock for ${medicine.name}: ${medicine.stockQuantity} - ${item.cartItem.quantity}`);
      await medicine.updateStock(item.cartItem.quantity, 'out', `Order #${order.trackingId}`);
    }

    try {
      if (singleVendorId) {
        const payment = new Payment({
          transactionId: `TXN_${order.trackingId}_${singleVendorId}_${Date.now()}`,
          userId: order.customer,
          vendorId: singleVendorId,
          orderId: order._id,
          amount: subtotal,
          status: 'pending',
          paymentMethod: getValidPaymentMethod(paymentMethod),
          paymentDetails: {
            orderNumber: order.orderNumber,
            trackingId: order.trackingId,
            orderCreatedAt: order.createdAt,
            items: orderItems
          }
        });

        await payment.save();

        console.log('✅ Single vendor payment created successfully:', {
          transactionId: payment.transactionId,
          amount: payment.amount,
          vendorId: singleVendorId,
          status: payment.status
        });
      }
    } catch (paymentError) {
      console.error('❌ Failed to create single vendor payment:', paymentError);
    }

    // Clear user cart
    console.log('🧹 Clearing user cart...');
    user.cart = [];
    await user.save();
    console.log('✅ Cart cleared successfully');

    // Populate order for response
    console.log('🔄 Populating order data for response...');
    await order.populate([
      {
        path: 'items.medicine',
        select: 'name genericName imageUrl'
      },
      {
        path: 'items.vendor',
        select: 'firstName lastName email phone'
      }
    ]);

    console.log('🎉 Order creation completed successfully!');
    console.log('📧 Order will be available in:');
    console.log('   - Customer "My Orders" section');
    console.log('   - Vendor "Order Management" section');

    res.status(201).json({
      message: 'Order created successfully',
      order: {
        _id: order._id,
        trackingId: order.trackingId,
        status: order.status,
        paymentStatus: order.paymentStatus,
        total: order.total,
        estimatedDelivery: order.estimatedDelivery,
        createdAt: order.createdAt,
        deliveryAssignment: order.deliveryAssignment,
        items: order.items
      }
    });

  } catch (error) {
    console.error('❌ Error creating order:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Request body:', JSON.stringify(req.body, null, 2));
    console.error('❌ User ID:', req.user?.id);
    
    res.status(500).json({ 
      message: 'Server error while creating order',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get user orders
router.get('/my-orders', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ customer: req.user.id })
      .populate([
        {
          path: 'items.medicine',
          select: 'name genericName imageUrl'
        },
        {
          path: 'items.vendor',
          select: 'firstName lastName email phone'
          },
          {
            path: 'deliveryAssignment.rider',
            select: 'firstName lastName email phone'
        }
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments({ customer: req.user.id });

    res.json({
      orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get order by ID
router.get('/:orderId', authenticateToken, async (req, res) => {
  try {
    // Validate user ID
    if (!req.user.id || req.user.id === 'customer' || req.user.id === 'admin' || req.user.id === 'vendor') {
      return res.status(400).json({ message: 'Invalid user authentication' });
    }

    // Validate orderId param to avoid Mongoose CastError when invalid strings are passed
    if (!mongoose.Types.ObjectId.isValid(req.params.orderId)) {
      console.warn('Invalid orderId parameter provided:', req.params.orderId);
      return res.status(400).json({ message: 'Invalid order ID' });
    }

    const order = await Order.findOne({
      _id: req.params.orderId,
      customer: req.user.id
    }).populate([
      {
        path: 'items.medicine',
        select: 'name genericName imageUrl manufacturer category dosage'
      },
      {
        path: 'items.vendor',
        select: 'firstName lastName email phone'
      },
      {
        path: 'deliveryAssignment.rider',
        select: 'firstName lastName email phone'
      }
    ]);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ order });

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Track order by tracking ID
router.get('/track/:trackingId', async (req, res) => {
  try {
    const order = await Order.findOne({ 
      trackingId: req.params.trackingId 
    }).populate([
      {
        path: 'items.medicine',
        select: 'name genericName'
      }
    ]);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({
      order: {
        trackingId: order.trackingId,
        status: order.status,
        paymentStatus: order.paymentStatus,
        total: order.total,
        estimatedDelivery: order.estimatedDelivery,
        statusHistory: order.statusHistory,
        items: order.items.map(item => ({
          name: item.medicine.name,
          quantity: item.quantity,
          price: item.price
        }))
      }
    });

  } catch (error) {
    console.error('Error tracking order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel order (only if pending)
router.put('/:orderId/cancel', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      customer: req.user.id
    }).populate('items.medicine');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Order cannot be cancelled' });
    }

    // Restore medicine stock
    for (const item of order.items) {
      const medicine = await Medicine.findById(item.medicine._id);
      if (medicine) {
        await medicine.updateStock(item.quantity, 'in', `Order cancellation #${order.trackingId}`);
      }
    }

    order.status = 'cancelled';
    await order.save();

    res.json({ message: 'Order cancelled successfully' });

  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get order statistics (for customer dashboard)
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const stats = await Order.aggregate([
      { $match: { customer: req.user.id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$total' }
        }
      }
    ]);

    const summary = {
      totalOrders: 0,
      totalSpent: 0,
      pending: 0,
      delivered: 0,
      cancelled: 0
    };

    stats.forEach(stat => {
      summary.totalOrders += stat.count;
      summary.totalSpent += stat.totalAmount;
      summary[stat._id] = stat.count;
    });

    res.json({ summary });

  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============ VENDOR ORDER MANAGEMENT ROUTES ============

// Get vendor orders (orders containing vendor's medicines)
router.get('/vendor/orders', authenticateToken, async (req, res) => {
  try {
    console.log('🏥 Vendor Orders Request:', {
      vendorId: req.user.id,
      userRole: req.user.role,
      query: req.query
    });

    const { status, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search, paymentMethod } = req.query;
    
    // Only allow pharmacy vendors to access this endpoint
    if (req.user.role !== 'pharmacy_vendor') {
      console.log('❌ Access denied: User role is not pharmacy_vendor, got:', req.user.role);
      return res.status(403).json({ message: 'Access denied. Pharmacy vendor role required.' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const vendorObjectId = new mongoose.Types.ObjectId(req.user.id);

    console.log('🔍 Searching for orders with vendor:', vendorObjectId);

    // Build aggregation pipeline for vendor's orders with customer search
    const pipeline = [
      // Match orders with vendor's medicines
      {
        $match: {
          'items.vendor': vendorObjectId
        }
      },
      
      // Populate customer data
      {
        $lookup: {
          from: 'users',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer'
        }
      },
      {
        $unwind: '$customer'
      },
      
      // Populate medicine data for items
      {
        $lookup: {
          from: 'medicines',
          localField: 'items.medicine',
          foreignField: '_id',
          as: 'medicineData'
        }
      }
    ];

    // Add search filter if provided
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      pipeline.push({
        $match: {
          $or: [
            { 'customer.firstName': searchRegex },
            { 'customer.lastName': searchRegex },
            { 'customer.email': searchRegex },
            { trackingId: searchRegex },
            { 'shippingAddress.fullName': searchRegex },
            { 'shippingAddress.phone': searchRegex }
          ]
        }
      });
    }

    // Add status filter if provided
    if (status && status !== 'all') {
      pipeline.push({
        $match: {
          status: status
        }
      });
    }

    // Add payment method filter if provided
    if (paymentMethod && paymentMethod !== 'all') {
      pipeline.push({
        $match: {
          paymentMethod: paymentMethod
        }
      });
    }

    // Filter items to only show vendor's medicines and recalculate totals
    pipeline.push({
      $addFields: {
        items: {
          $filter: {
            input: '$items',
            cond: { $eq: ['$$this.vendor', vendorObjectId] }
          }
        }
      }
    });

    // Calculate vendor subtotal
    pipeline.push({
      $addFields: {
        vendorSubtotal: {
          $sum: {
            $map: {
              input: '$items',
              as: 'item',
              in: { $multiply: ['$$item.price', '$$item.quantity'] }
            }
          }
        }
      }
    });

    // Add medicine details to items
    pipeline.push({
      $addFields: {
        items: {
          $map: {
            input: '$items',
            as: 'item',
            in: {
              $mergeObjects: [
                '$$item',
                {
                  medicine: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: '$medicineData',
                          cond: { $eq: ['$$this._id', '$$item.medicine'] }
                        }
                      },
                      0
                    ]
                  }
                }
              ]
            }
          }
        }
      }
    });

    // Remove medicineData field and sensitive customer data
    pipeline.push({
      $project: {
        medicineData: 0,
        'customer.password': 0,
        'customer.cart': 0
      }
    });

    // Add sorting
    pipeline.push({ $sort: sort });

    console.log('📊 Executing aggregation pipeline with stages:', pipeline.length);

    // Execute aggregation with pagination
    const orders = await Order.aggregate([
      ...pipeline,
      { $skip: skip },
      { $limit: parseInt(limit) }
    ]);

    // Get total count for pagination
    const totalCount = await Order.aggregate([
      ...pipeline.slice(0, -2), // Remove skip and limit
      { $count: 'total' }
    ]);

    const total = totalCount.length > 0 ? totalCount[0].total : 0;

    // Count SSL orders specifically
    const sslOrdersCount = orders.filter(order => 
      order.paymentMethod === 'sslcommerz' || 
      order.paymentMethod === 'online'
    ).length;

    console.log(`📦 Found ${orders.length} orders for vendor ${req.user.id} (page ${page}, total: ${total})`);
    console.log(`🌐 SSL Commerce orders in this batch: ${sslOrdersCount}`);

    res.json({
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        hasNext: page < Math.ceil(total / parseInt(limit)),
        hasPrev: page > 1
      },
      sslOrdersCount
    });

  } catch (error) {
    console.error('❌ Error fetching vendor orders:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update order status (vendor only)
router.put('/vendor/:orderId/status', authenticateToken, async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    if (req.user.role !== 'pharmacy_vendor') {
      return res.status(403).json({ message: 'Access denied. Pharmacy vendor role required.' });
    }

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if vendor has items in this order
    const hasVendorItems = order.items.some(item => item.vendor.toString() === req.user.id);
    if (!hasVendorItems) {
      return res.status(403).json({ message: 'You can only update orders containing your medicines' });
    }

    // Add status update to order history
    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({
      status: order.status,
      timestamp: new Date(),
      updatedBy: req.user.id,
      notes: notes || `Status updated to ${status}`
    });

    order.status = status;
    if (status === 'delivered') {
      order.deliveredAt = new Date();
      
      // Update payment status when order is delivered
      try {
        const payment = await updatePaymentForDeliveredOrder(order, req.user.id);
        if (payment) {
          console.log(`💰 Payment status updated for delivered order: ${payment.transactionId}`);
        }
      } catch (paymentError) {
        console.error('❌ Failed to update payment for delivered order:', paymentError);
        // Don't fail the status update if payment update fails
      }
    }

    await order.save();

    res.json({ 
      message: 'Order status updated successfully',
      order: {
        _id: order._id,
        status: order.status,
        trackingId: order.trackingId,
        updatedAt: order.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Alternative route for updating order status (matches frontend call)
router.put('/vendor/update-status', authenticateToken, async (req, res) => {
  try {
    const { orderId, status, note } = req.body;
    
    if (req.user.role !== 'pharmacy_vendor') {
      return res.status(403).json({ message: 'Access denied. Pharmacy vendor role required.' });
    }

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if vendor has items in this order
    const hasVendorItems = order.items.some(item => item.vendor.toString() === req.user.id);
    if (!hasVendorItems) {
      return res.status(403).json({ message: 'You can only update orders containing your medicines' });
    }

    // Add status update to order history
    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({
      status: order.status,
      timestamp: new Date(),
      updatedBy: req.user.id,
      notes: note || `Status updated to ${status}`
    });

    order.status = status;
    if (status === 'delivered') {
      order.deliveredAt = new Date();
      
      // Update payment status when order is delivered
      try {
        const payment = await updatePaymentForDeliveredOrder(order, req.user.id);
        if (payment) {
          console.log(`💰 Payment status updated for delivered order: ${payment.transactionId}`);
        }
      } catch (paymentError) {
        console.error('❌ Failed to update payment for delivered order:', paymentError);
        // Don't fail the status update if payment update fails
      }
    }

    await order.save();

    res.json({ 
      message: 'Order status updated successfully',
      order: {
        _id: order._id,
        status: order.status,
        trackingId: order.trackingId,
        updatedAt: order.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get vendor dashboard statistics
router.get('/vendor/stats', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Vendor Stats Request:', {
      vendorId: req.user.id,
      userRole: req.user.role,
      timeframe: req.query.timeframe
    });

    if (req.user.role !== 'pharmacy_vendor') {
      console.log('❌ Access denied: User role is not pharmacy_vendor, got:', req.user.role);
      return res.status(403).json({ message: 'Access denied. Pharmacy vendor role required.' });
    }

    const vendorObjectId = new mongoose.Types.ObjectId(req.user.id);
    const { timeframe = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (timeframe) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    console.log(`📅 Fetching stats from ${startDate} to ${now} for vendor ${vendorObjectId}`);

    // Get order statistics with payment method breakdown
    const orderStats = await Order.aggregate([
      {
        $match: {
          'items.vendor': vendorObjectId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $unwind: '$items'
      },
      {
        $match: {
          'items.vendor': vendorObjectId
        }
      },
      {
        $group: {
          _id: {
            status: '$status',
            paymentMethod: '$paymentMethod'
          },
          count: { $sum: 1 },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          totalQuantity: { $sum: '$items.quantity' }
        }
      }
    ]);

    console.log('📈 Order Stats with Payment Methods:', orderStats);

    // Get SSL orders specifically
    const sslOrderStats = await Order.aggregate([
      {
        $match: {
          'items.vendor': vendorObjectId,
          createdAt: { $gte: startDate },
          $or: [
            { paymentMethod: 'sslcommerz' },
            { paymentMethod: 'online' }
          ]
        }
      },
      {
        $unwind: '$items'
      },
      {
        $match: {
          'items.vendor': vendorObjectId
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          avgOrderValue: { $avg: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      }
    ]);

    console.log('🌐 SSL Order Stats:', sslOrderStats);

    // Get daily sales for chart
    const dailySales = await Order.aggregate([
      {
        $match: {
          'items.vendor': vendorObjectId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $unwind: '$items'
      },
      {
        $match: {
          'items.vendor': vendorObjectId
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            paymentMethod: '$paymentMethod'
          },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          orders: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);

    console.log('📊 Daily Sales with Payment Methods:', dailySales.length, 'entries');

    // Get top selling medicines
    const topMedicines = await Order.aggregate([
      {
        $match: {
          'items.vendor': vendorObjectId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $unwind: '$items'
      },
      {
        $match: {
          'items.vendor': vendorObjectId
        }
      },
      {
        $lookup: {
          from: 'medicines',
          localField: 'items.medicine',
          foreignField: '_id',
          as: 'medicineInfo'
        }
      },
      {
        $unwind: '$medicineInfo'
      },
      {
        $group: {
          _id: '$items.medicine',
          name: { $first: '$medicineInfo.name' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          orderCount: { $sum: 1 },
          sslOrders: {
            $sum: {
              $cond: [
                { $in: ['$paymentMethod', ['sslcommerz', 'online']] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      },
      {
        $limit: 10
      }
    ]);

    console.log('🏆 Top Medicines with SSL breakdown:', topMedicines.length, 'medicines');

    // Get top customers
    const topCustomers = await Order.aggregate([
      {
        $match: {
          'items.vendor': vendorObjectId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'customer',
          foreignField: '_id',
          as: 'customerInfo'
        }
      },
      {
        $unwind: '$customerInfo'
      },
      {
        $unwind: '$items'
      },
      {
        $match: {
          'items.vendor': vendorObjectId
        }
      },
      {
        $group: {
          _id: '$customer',
          customerName: { $first: { $concat: ['$customerInfo.firstName', ' ', '$customerInfo.lastName'] } },
          customerEmail: { $first: '$customerInfo.email' },
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          sslOrders: {
            $sum: {
              $cond: [
                { $in: ['$paymentMethod', ['sslcommerz', 'online']] },
                1,
                0
              ]
            }
          },
          lastOrderDate: { $max: '$createdAt' }
        }
      },
      {
        $sort: { totalSpent: -1 }
      },
      {
        $limit: 10
      }
    ]);

    console.log('👥 Top Customers with SSL breakdown:', topCustomers.length, 'customers');

    // Calculate summary statistics
    const summary = {
      totalOrders: 0,
      totalRevenue: 0,
      totalCustomers: 0,
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      sslOrders: 0,
      sslRevenue: 0,
      codOrders: 0,
      codRevenue: 0
    };

    orderStats.forEach(stat => {
      summary.totalOrders += stat.count;
      summary.totalRevenue += stat.totalRevenue;
      summary[stat._id.status] += stat.count;

      // Track SSL vs COD breakdown
      if (stat._id.paymentMethod === 'sslcommerz' || stat._id.paymentMethod === 'online') {
        summary.sslOrders += stat.count;
        summary.sslRevenue += stat.totalRevenue;
      } else if (stat._id.paymentMethod === 'cash_on_delivery' || stat._id.paymentMethod === 'cash') {
        summary.codOrders += stat.count;
        summary.codRevenue += stat.totalRevenue;
      }
    });

    // Get unique customers count
    const uniqueCustomers = await Order.aggregate([
      {
        $match: {
          'items.vendor': vendorObjectId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$customer'
        }
      },
      {
        $count: 'uniqueCustomers'
      }
    ]);

    if (uniqueCustomers.length > 0) {
      summary.totalCustomers = uniqueCustomers[0].uniqueCustomers;
    }

    console.log('📋 Summary Stats with Payment Breakdown:', summary);

    const response = {
      summary,
      sslOrderStats,
      dailySales,
      topMedicines,
      topCustomers,
      timeframe,
      dateRange: {
        start: startDate,
        end: now
      }
    };

    console.log('✅ Sending enhanced stats response with SSL breakdown for vendor:', req.user.id);
    res.json(response);

  } catch (error) {
    console.error('❌ Error fetching vendor stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;