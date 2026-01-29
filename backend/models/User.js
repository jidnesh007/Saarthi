const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, sparse: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['commuter', 'admin'], default: 'commuter' },
  
  // ✅ NEW PROFILE FIELDS
  profile: {
    homeLocation: {
      name: String,
      lat: Number,
      lng: Number
    },
    workLocation: {
      name: String,
      lat: Number,
      lng: Number
    },
    transportModes: [{
      type: String,
      enum: ['Train', 'Bus', 'Metro', 'Auto', 'Cab', 'Walk']
    }],
    commuteWindow: {
      start: String, // "09:00"
      end: String    // "18:00"
    },
    isProfileComplete: { type: Boolean, default: false }
  }
}, { timestamps: true });

// Hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);