const mongoose = require('mongoose');

const trackingSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  status: {
    type: String,
    required: true
  },
  location: String,
  description: String,
  timestamp: {
    type: Date,
    default: Date.now
  },
  source: {
    type: String,
    enum: ['system', 'courier_api', 'manual'],
    default: 'courier_api'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Tracking', trackingSchema);

