const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const router = express.Router();

const KYC_API_URL = 'https://apiuat.paisalo.in:4015/PDLadmin/api/IdentityVerification/Get';
const KYC_AUTH_URL = process.env.KYC_AUTH_URL || 'https://apiuat.paisalo.in:4015/PDLadmin/api/auth/login';

// Generate a fresh JWT token for KYC API
const generateKYCToken = () => {
  try {
    // Token payload structure based on the example token provided
    const now = Math.floor(Date.now() / 1000);
    const expirationTime = now + (24 * 60 * 60); // 24 hours from now
    const expirationDate = new Date(expirationTime * 1000);
    
    // Format expiration date as "MMM DD YYYY HH:MM:SS AM/PM"
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[expirationDate.getMonth()];
    const day = expirationDate.getDate();
    const year = expirationDate.getFullYear();
    let hours = expirationDate.getHours();
    const minutes = expirationDate.getMinutes().toString().padStart(2, '0');
    const seconds = expirationDate.getSeconds().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    hours = hours.toString().padStart(2, '0');
    const formattedExpiration = `${month} ${day.toString().padStart(2)} ${year} ${hours}:${minutes}:${seconds} ${ampm}`;

    const payload = {
      Id: process.env.KYC_USER_ID || "159",
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name": process.env.KYC_USER_NAME || "SATISH MAURYA",
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress": process.env.KYC_USER_EMAIL || "dotnetdev1@paisalo.in",
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier": process.env.KYC_USER_ID || "159",
      Creator: process.env.KYC_CREATOR || "Agra",
      EmpCode: process.env.KYC_EMP_CODE || "PDLA000101",
      tokenVersion: "1",
      "http://schemas.microsoft.com/ws/2008/06/identity/claims/expiration": formattedExpiration,
      nbf: now,
      exp: expirationTime,
      iss: "https://localhost:7188",
      aud: "https://localhost:7188"
    };

    // Use a secret key (you'll need to get this from KYC API provider or use the same one)
    const secret = process.env.KYC_JWT_SECRET || 'your-secret-key-here';
    
    // Generate JWT token
    const token = jwt.sign(payload, secret, { algorithm: 'HS256' });
    
    return token;
  } catch (error) {
    console.error('Error generating KYC token:', error);
    // Fallback to environment variable or default token
    return process.env.KYC_BEARER_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJJZCI6IjE1OSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWUiOiJTQVRJU0ggTUFVUllBIiwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvZW1haWxhZGRyZXNzIjoiZG90bmV0ZGV2MUBwYWlzYWxvLmluIiwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvbmFtZWlkZW50aWZpZXIiOiIxNTkiLCJDcmVhdG9yIjoiQWdyYSIsIkVtcENvZGUiOiJQRExBMDAwMTAxIiwidG9rZW5WZXJzaW9uIjoiMSIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvZXhwaXJhdGlvbiI6Ik5vdiBTYXQgMDEgMjAyNSAwNjoyMzowNCBBTSIsIm5iZiI6MTc2MTg5MTc4NCwiZXhwIjoxNzYxODk4OTg0LCJpc3MiOiJodHRwczovL2xvY2FsaG9zdDo3MTg4IiwiYXVkIjoiaHR0cHM6Ly9sb2NhbGhvc3Q6NzE4OCJ9.TNVF09mG2tqlpbppiXRkS-1EJ0JR0XKAbwZUcoaUniE';
  }
};

// Get fresh token endpoint
router.get('/token', async (req, res) => {
  try {
    const freshToken = generateKYCToken();
    res.json({
      success: true,
      token: freshToken,
      expiresIn: '24 hours',
      message: 'Fresh token generated successfully'
    });
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate token',
      error: error.message
    });
  }
});

// KYC Verification endpoint
router.post('/verify', async (req, res) => {
  try {
    const { panNumber } = req.body;

    if (!panNumber || panNumber.trim().length === 0) {
      return res.status(400).json({ 
        message: 'PAN number is required',
        success: false 
      });
    }

    // Generate a fresh token for each verification
    const bearerToken = generateKYCToken();

    // Prepare payload for KYC API
    const kycPayload = {
      ifsc: "",
      key: "1",
      txtnumber: panNumber.toUpperCase().trim(),
      type: "pancard",
      userdob: ""
    };

    // Call KYC API with fresh Bearer token
    const response = await axios.post(KYC_API_URL, kycPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bearerToken}`,
        'Accept': 'application/json'
      },
      timeout: 30000 // 30 seconds timeout
    });

    // Return the response from KYC API directly (preserving structure)
    res.json(response.data);

  } catch (error) {
    console.error('KYC Verification Error:', error.response?.data || error.message);
    
    // Handle different error scenarios
    if (error.response) {
      // API responded with error status
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data?.message || 'KYC verification failed',
        error: error.response.data
      });
    } else if (error.request) {
      // Request made but no response received
      return res.status(503).json({
        success: false,
        message: 'KYC service is currently unavailable. Please try again later.'
      });
    } else {
      // Something else happened
      return res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }
});

module.exports = router;

