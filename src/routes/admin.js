const express = require('express');
const Order = require('../models/Order');
const User = require('../models/User');
const Tracking = require('../models/Tracking');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);
router.use(adminAuth);

// Get all orders
router.get('/orders', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find()
      .populate('userId', 'fullName email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments();

    res.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ shipmentStatus: 'pending' });
    const deliveredOrders = await Order.countDocuments({ shipmentStatus: 'delivered' });
    const inTransitOrders = await Order.countDocuments({ shipmentStatus: 'in_transit' });
    
    const totalRevenue = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount.totalAmount' } } }
    ]);

    const totalUsers = await User.countDocuments({ role: 'user' });

    res.json({
      totalOrders,
      pendingOrders,
      deliveredOrders,
      inTransitOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      totalUsers
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({ role: 'user' })
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update order status
router.put('/orders/:id', async (req, res) => {
  try {
    const { shipmentStatus, trackingId, awbNumber } = req.body;
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { shipmentStatus, trackingId, awbNumber },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Create tracking entry
    const tracking = new Tracking({
      orderId: order._id,
      status: shipmentStatus,
      description: `Order status updated to ${shipmentStatus}`,
      source: 'manual'
    });
    await tracking.save();

    res.json({
      message: 'Order updated successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

