const express = require('express');
const axios = require('axios');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get available couriers
router.get('/available', async (req, res) => {
  try {
    // Mock data - replace with actual courier API call
    const couriers = [
      {
        id: 'delhivery',
        name: 'Delhivery',
        logo: 'https://images.delhivery.com/static/images/delhivery-logo.svg',
        description: 'Fast and reliable delivery across India'
      },
      {
        id: 'bluedart',
        name: 'BlueDart',
        logo: 'https://www.bluedart.com/images/logo.svg',
        description: 'Express delivery services'
      },
      {
        id: 'dtdc',
        name: 'DTDC',
        logo: 'https://www.dtdc.in/images/logo.svg',
        description: 'Cost-effective shipping solutions'
      },
      {
        id: 'fedex',
        name: 'FedEx',
        logo: 'https://www.fedex.com/images/fedex-logo.svg',
        description: 'Global shipping and logistics'
      }
    ];

    res.json(couriers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Calculate shipping rate
router.post('/calculate-rate', auth, async (req, res) => {
  try {
    const { pickupPincode, deliveryPincode, weight, courierPartner } = req.body;

    // Mock rate calculation - replace with actual API call
    const baseRate = Math.floor(Math.random() * 500) + 100;
    const tax = baseRate * 0.18;
    const totalAmount = baseRate + tax;

    const rate = {
      courierPartner,
      basePrice: baseRate,
      tax,
      codCharges: courierPartner === 'cod' ? 30 : 0,
      totalAmount,
      estimatedDays: Math.floor(Math.random() * 7) + 1,
      estimatedDelivery: new Date(Date.now() + (Math.floor(Math.random() * 7) + 1) * 24 * 60 * 60 * 1000)
    };

    res.json(rate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate label (mock)
router.post('/generate-label/:orderId', auth, async (req, res) => {
  try {
    // Mock label generation
    const labelUrl = `https://api.courierapp.com/labels/${req.params.orderId}.pdf`;
    
    res.json({
      message: 'Label generated successfully',
      labelUrl
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

