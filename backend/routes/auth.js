// backend/routes/auth.js - FIXED FOR BEARER TOKENS
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/auth');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or phone'
      });
    }

    const user = await User.create({
      name, email, phone, password, role: role || 'commuter'
    });

    // ✅ RETURN TOKEN IN RESPONSE (no cookies)
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token, // Frontend stores this
      user: { 
        _id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        profile: user.profile || null,
        isProfileComplete: false
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Email or phone is required'
      });
    }

    const user = await User.findOne({ $or: [{ email }, { phone }] }).select('+password');
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // ✅ RETURN TOKEN IN RESPONSE (no cookies)
    const token = generateToken(user._id);

    console.log('✅ Login success - Token generated:', token.substring(0, 20) + '...');

    res.status(200).json({
      success: true,
      token, // Frontend stores this in localStorage
      user: { 
        _id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        profile: user.profile || null,
        isProfileComplete: user.profile?.isProfileComplete || false
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user
  });
});

module.exports = router;
