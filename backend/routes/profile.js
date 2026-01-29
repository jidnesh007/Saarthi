// backend/routes/profile.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// GET /api/profile/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    console.log('Fetching profile for user ID:', req.user.id);
    
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    console.log('Profile fetched successfully:', {
      userId: user._id,
      email: user.email,
      isProfileComplete: user.profile?.isProfileComplete || false
    });
    
    res.json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      profile: user.profile,
      isProfileComplete: user.profile?.isProfileComplete || false
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// POST /api/profile/setup
router.post('/setup', authMiddleware, async (req, res) => {
  try {
    console.log('=== Profile Setup Request ===');
    console.log('User ID from token:', req.user.id);
    console.log('Profile data received:', JSON.stringify(req.body, null, 2));
    
    const { homeLocation, workLocation, transportModes, commuteWindow } = req.body;

    // Validation
    if (!homeLocation || !homeLocation.name) {
      return res.status(400).json({
        success: false,
        message: 'Home location name is required'
      });
    }

    if (!workLocation || !workLocation.name) {
      return res.status(400).json({
        success: false,
        message: 'Work location name is required'
      });
    }

    if (!transportModes || !Array.isArray(transportModes) || transportModes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one transport mode is required'
      });
    }

    if (!commuteWindow || !commuteWindow.start || !commuteWindow.end) {
      return res.status(400).json({
        success: false,
        message: 'Commute window start and end times are required'
      });
    }

    // Find user first
    const existingUser = await User.findById(req.user.id);
    
    if (!existingUser) {
      console.error('User not found with ID:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('User found:', existingUser.email);

    // Update profile
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          'profile.homeLocation': {
            name: homeLocation.name,
            lat: homeLocation.lat || '',
            lng: homeLocation.lng || ''
          },
          'profile.workLocation': {
            name: workLocation.name,
            lat: workLocation.lat || '',
            lng: workLocation.lng || ''
          },
          'profile.transportModes': transportModes,
          'profile.commuteWindow': {
            start: commuteWindow.start,
            end: commuteWindow.end
          },
          'profile.isProfileComplete': true
        }
      },
      { 
        new: true, 
        runValidators: true,
        select: '-password'
      }
    );

    if (!user) {
      console.error('User update failed');
      return res.status(404).json({
        success: false,
        message: 'Failed to update user profile'
      });
    }

    console.log('Profile updated successfully for user:', user.email);
    console.log('Updated profile:', JSON.stringify(user.profile, null, 2));

    res.json({
      success: true,
      message: 'Profile setup completed successfully!',
      profile: user.profile,
      isProfileComplete: true
    });
  } catch (error) {
    console.error('Profile setup error:', error);
    console.error('Error stack:', error.stack);
    
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Profile setup failed'
    });
  }
});

// GET /api/profile - Get current user's profile
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      profile: user.profile
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// PUT /api/profile - Update user profile
router.put('/', authMiddleware, async (req, res) => {
  try {
    const { homeLocation, workLocation, transportModes, commuteWindow } = req.body;

    const updateData = {};
    
    if (homeLocation) updateData['profile.homeLocation'] = homeLocation;
    if (workLocation) updateData['profile.workLocation'] = workLocation;
    if (transportModes) updateData['profile.transportModes'] = transportModes;
    if (commuteWindow) updateData['profile.commuteWindow'] = commuteWindow;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: user.profile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;