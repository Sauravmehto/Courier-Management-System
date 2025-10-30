const express = require('express');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { fullName, phone, address } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { fullName, phone, address },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get wallet balance
router.get('/wallet', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('wallet');
    res.json({ wallet: user.wallet });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

