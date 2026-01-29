const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    console.log('🔍 Raw auth header:', authHeader);
    
    // Fix malformed token check
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No Bearer token found');
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided. Format: Bearer <token>' 
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      console.log('❌ Empty token after Bearer');
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token format' 
      });
    }

    console.log('🔑 Token preview:', token.substring(0, 20) + '...');
    
    // Verify token with error details
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token decoded:', decoded);
    } catch (jwtError) {
      console.error('❌ JWT verify failed:', jwtError.name, jwtError.message);
      return res.status(401).json({ 
        success: false, 
        message: `Token verification failed: ${jwtError.message}` 
      });
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      console.log('❌ User not found:', decoded.id);
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);
    res.status(401).json({ 
      success: false, 
      message: 'Authorization failed' 
    });
  }
};

module.exports = authMiddleware;
