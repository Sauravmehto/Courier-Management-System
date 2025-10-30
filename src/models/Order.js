const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  courierPartner: {
    type: String,
    required: true
  },
  trackingId: String,
  pickupAddress: {
    name: String,
    phone: String,
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  deliveryAddress: {
    name: String,
    phone: String,
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  shipmentDetails: {
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    productType: String,
    numberOfItems: { type: Number, default: 1 }
  },
  shipmentStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled', 'returned'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['prepaid', 'cod'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  amount: {
    basePrice: Number,
    tax: Number,
    codCharges: Number,
    totalAmount: Number
  },
  labelUrl: String,
  awbNumber: String,
  estimatedDelivery: Date,
  deliveredAt: Date,
  notes: String
}, {
  timestamps: true
});

// Generate order number before saving
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    this.orderNumber = 'ORD' + Date.now().toString().slice(-9);
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);

