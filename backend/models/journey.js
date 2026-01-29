const mongoose = require('mongoose');

const journeySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  source: {
    type: String,
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  segments: [{
    mode: {
      type: String,
      enum: ['walk', 'bus', 'train', 'metro', 'auto', 'bike'],
      required: true
    },
    from: {
      type: String,
      required: true
    },
    to: {
      type: String,
      required: true
    },
    duration: {
      type: Number,
      required: true
    },
    crowdLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High']
    },
    riskNote: {
      type: String
    }
  }],
  totalTime: {
    type: Number,
    required: true
  },
  transferCount: {
    type: Number,
    default: 0
  },
  riskPoints: [{
    type: String
  }],
  startTime: {
    type: String
  },
  endTime: {
    type: String
  }
}, {
  timestamps: true
});

// ✅ FIX: Check if model exists before compiling
module.exports = mongoose.models.Journey || mongoose.model('Journey', journeySchema);