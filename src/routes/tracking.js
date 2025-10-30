const express = require('express');
const Tracking = require('../models/Tracking');
const Order = require('../models/Order');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Track by order number
router.get('/order/:orderNumber', async (req, res) => {
  try {
    // Short-circuit to demo data if in MOCK_MODE
    if ((process.env.MOCK_MODE === 'true') && req.params.orderNumber.toLowerCase() === 'orddemo123') {
      return res.json({
        order: {
          orderNumber: 'ORDDEMO123',
          trackingId: 'yxzw2345',
          status: 'in_transit'
        },
        tracking: [
          { status: 'in_transit', description: 'Package departed from sorting facility', location: 'Mumbai, MH', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
          { status: 'picked_up', description: 'Package picked up by courier', location: 'Mumbai, MH', timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000) },
          { status: 'confirmed', description: 'Shipment confirmed', location: 'Mumbai, MH', timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000) },
          { status: 'pending', description: 'Order created and is awaiting confirmation', location: 'Mumbai, MH', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        ]
      });
    }

    const order = await Order.findOne({ orderNumber: req.params.orderNumber });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const tracking = await Tracking.find({ orderId: order._id })
      .sort({ timestamp: -1 });

    res.json({
      order: {
        orderNumber: order.orderNumber,
        trackingId: order.trackingId,
        status: order.shipmentStatus
      },
      tracking
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Track by tracking ID
router.get('/tracking/:trackingId', async (req, res) => {
  try {
    // Short-circuit to demo data if in MOCK_MODE
    if ((process.env.MOCK_MODE === 'true') && req.params.trackingId.toLowerCase() === 'yxzw2345') {
      return res.json({
        order: {
          orderNumber: 'ORDDEMO123',
          trackingId: 'yxzw2345',
          status: 'in_transit'
        },
        tracking: [
          { status: 'in_transit', description: 'Package departed from sorting facility', location: 'Mumbai, MH', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
          { status: 'picked_up', description: 'Package picked up by courier', location: 'Mumbai, MH', timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000) },
          { status: 'confirmed', description: 'Shipment confirmed', location: 'Mumbai, MH', timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000) },
          { status: 'pending', description: 'Order created and is awaiting confirmation', location: 'Mumbai, MH', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        ]
      });
    }

    const order = await Order.findOne({ trackingId: req.params.trackingId });

    if (!order) {
      return res.status(404).json({ message: 'Tracking ID not found' });
    }

    const tracking = await Tracking.find({ orderId: order._id })
      .sort({ timestamp: -1 });

    res.json({
      order: {
        orderNumber: order.orderNumber,
        trackingId: order.trackingId,
        status: order.shipmentStatus
      },
      tracking
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Update tracking status
router.post('/:orderId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status, location, description } = req.body;
    
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update order status
    order.shipmentStatus = status;
    await order.save();

    // Create tracking entry
    const tracking = new Tracking({
      orderId: order._id,
      status,
      location,
      description,
      source: 'manual'
    });
    await tracking.save();

    res.json({ message: 'Tracking updated successfully', tracking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

