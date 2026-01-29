const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

const User = require('./models/User');

dotenv.config();

const app = express();

/* =====================================================
   ✅ PROPER CORS FIX (DEV SAFE)
   ===================================================== */
app.use((req, res, next) => {
  const allowedOrigin = 'http://localhost:5173';

  res.header('Access-Control-Allow-Origin', allowedOrigin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.header(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  );

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

/* =====================================================
   Body Parsers
   ===================================================== */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* =====================================================
   JWT Middleware
   ===================================================== */
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

/* =====================================================
   Database
   ===================================================== */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB error:', err));

/* =====================================================
   Routes
   ===================================================== */
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/journey', require('./routes/journey'));

/* =====================================================
   Protected Example Route
   ===================================================== */
app.get('/api/profile/me', authMiddleware, async (req, res) => {
  res.json({ user: req.user });
});

/* =====================================================
   Error Handler (LAST)
   ===================================================== */
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ message: err.message });
});

/* =====================================================
   Server
   ===================================================== */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('🔥 SERVER FILE LOADED — CORS 5173 VERSION 🔥');

});
