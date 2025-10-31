const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/tracking', require('./routes/tracking'));
app.use('/api/couriers', require('./routes/couriers'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/kyc', require('./routes/kyc'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Courier Management API is running' });
});

// Database connection
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.warn('⚠️  MONGODB_URI not set. Running in MOCK_MODE. No database connection will be made.');
  process.env.MOCK_MODE = process.env.MOCK_MODE || 'true';
} else {
  mongoose.connect(mongoUri)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 API Documentation: http://localhost:${PORT}/api/health`);
});

module.exports = app;

