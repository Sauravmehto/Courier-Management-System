const express = require('express');
const Order = require('../models/Order');
const Tracking = require('../models/Tracking');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Create order
router.post('/', auth, async (req, res) => {
  try {
    const {
      courierPartner,
      pickupAddress,
      deliveryAddress,
      shipmentDetails,
      paymentMethod,
      amount
    } = req.body;

    const order = new Order({
      userId: req.user.id,
      courierPartner,
      pickupAddress,
      deliveryAddress,
      shipmentDetails,
      paymentMethod,
      amount
    });

    await order.save();

    // Create initial tracking entry
    const tracking = new Tracking({
      orderId: order._id,
      status: 'pending',
      description: 'Order created and is awaiting confirmation',
      source: 'system'
    });
    await tracking.save();

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all orders for user
router.get('/', auth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .populate('userId', 'fullName email');
    
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single order
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('userId', 'fullName email phone');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user owns this order
    if (order.userId._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get tracking for order
router.get('/:id/tracking', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const tracking = await Tracking.find({ orderId: order._id })
      .sort({ timestamp: -1 });

    res.json(tracking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Cancel order
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (order.shipmentStatus === 'delivered' || order.shipmentStatus === 'in_transit') {
      return res.status(400).json({ message: 'Cannot cancel order that is in transit or delivered' });
    }

    order.shipmentStatus = 'cancelled';
    await order.save();

    // Create tracking entry
    const tracking = new Tracking({
      orderId: order._id,
      status: 'cancelled',
      description: 'Order cancelled by user',
      source: 'system'
    });
    await tracking.save();

    res.json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

