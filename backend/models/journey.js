/**
 * SAARTHI - Journey Model
 * 
 * MongoDB schema for storing journey plans with crowd estimation data
 */

const mongoose = require('mongoose');

/**
 * Journey Segment Schema
 * Represents a single leg of a journey (e.g., train from A to B)
 */
const segmentSchema = new mongoose.Schema({
  mode: {
    type: String,
    required: true,
    enum: ['train', 'bus', 'metro', 'auto', 'cab', 'walk'],
    trim: true,
    lowercase: true
  },
  from: {
    type: String,
    required: true,
    trim: true
  },
  to: {
    type: String,
    required: true,
    trim: true
  },
  departureTime: {
    type: String, // HH:MM format
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  arrivalTime: {
    type: String, // HH:MM format
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  duration: {
    type: Number, // in minutes
    required: true,
    min: 0
  },
  distance: {
    type: Number, // in kilometers
    min: 0
  },
  // Crowd Estimation Fields
  crowdLevel: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    required: true,
    default: 'Low'
  },
  crowdEstimationApplied: {
    type: Boolean,
    default: true
  },
  // Optional: Store the time bucket used for estimation
  timeBucket: {
    type: String,
    enum: ['peak', 'off-peak', 'low']
  }
}, {
  _id: true,
  timestamps: false
});

/**
 * Main Journey Schema
 */
const journeySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  origin: {
    type: String,
    required: true,
    trim: true
  },
  destination: {
    type: String,
    required: true,
    trim: true
  },
  plannedDate: {
    type: Date,
    required: true,
    index: true
  },
  plannedTime: {
    type: String, // HH:MM format
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  // Journey segments with crowd estimation
  segments: {
    type: [segmentSchema],
    required: true,
    validate: {
      validator: function(segments) {
        return segments && segments.length > 0;
      },
      message: 'At least one journey segment is required'
    }
  },
  // Total journey metrics
  totalDuration: {
    type: Number, // in minutes
    required: true,
    min: 0
  },
  totalDistance: {
    type: Number, // in kilometers
    min: 0
  },
  // Confidence Score (0-100)
  // Influenced by crowd levels, journey complexity, etc.
  confidenceScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 75
  },
  // Risk Assessment
  riskLevel: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Low'
  },
  riskNotes: [{
    type: String,
    trim: true
  }],
  // Crowd-specific risk flags
  hasHighCrowdSegments: {
    type: Boolean,
    default: false
  },
  highCrowdSegmentCount: {
    type: Number,
    default: 0,
    min: 0
  },
  // Journey status
  status: {
    type: String,
    enum: ['planned', 'in-progress', 'completed', 'cancelled'],
    default: 'planned',
    index: true
  },
  // User notes
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  // Favorites/bookmarks
  isFavorite: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Virtual: Average crowd level across all segments
 */
journeySchema.virtual('averageCrowdLevel').get(function() {
  if (!this.segments || this.segments.length === 0) {
    return 'Low';
  }
  
  const crowdValues = {
    'Low': 1,
    'Medium': 2,
    'High': 3
  };
  
  const totalCrowdValue = this.segments.reduce((sum, segment) => {
    return sum + (crowdValues[segment.crowdLevel] || 1);
  }, 0);
  
  const averageValue = totalCrowdValue / this.segments.length;
  
  if (averageValue <= 1.5) return 'Low';
  if (averageValue <= 2.5) return 'Medium';
  return 'High';
});

/**
 * Virtual: Check if journey has any medium or high crowd segments
 */
journeySchema.virtual('hasCrowdConcerns').get(function() {
  if (!this.segments || this.segments.length === 0) {
    return false;
  }
  
  return this.segments.some(segment => 
    segment.crowdLevel === 'Medium' || segment.crowdLevel === 'High'
  );
});

/**
 * Pre-save middleware: Calculate crowd-based risk metrics
 */
journeySchema.pre('save', function(next) {
  if (!this.segments || this.segments.length === 0) {
    return next();
  }
  
  // Count high crowd segments
  const highCrowdCount = this.segments.filter(
    segment => segment.crowdLevel === 'High'
  ).length;
  
  this.highCrowdSegmentCount = highCrowdCount;
  this.hasHighCrowdSegments = highCrowdCount > 0;
  
  // Update risk notes based on crowd levels
  const crowdRisks = [];
  
  if (highCrowdCount > 0) {
    crowdRisks.push(`${highCrowdCount} segment${highCrowdCount > 1 ? 's' : ''} expected to have high crowd levels`);
  }
  
  const mediumCrowdCount = this.segments.filter(
    segment => segment.crowdLevel === 'Medium'
  ).length;
  
  if (mediumCrowdCount > 0) {
    crowdRisks.push(`${mediumCrowdCount} segment${mediumCrowdCount > 1 ? 's' : ''} expected to have moderate crowd levels`);
  }
  
  // Add crowd risks to riskNotes if not already present
  crowdRisks.forEach(risk => {
    if (!this.riskNotes.includes(risk)) {
      this.riskNotes.push(risk);
    }
  });
  
  next();
});

/**
 * Index for efficient querying
 */
journeySchema.index({ userId: 1, plannedDate: -1 });
journeySchema.index({ userId: 1, status: 1 });
journeySchema.index({ createdAt: -1 });

/**
 * Instance method: Get crowd summary
 */
journeySchema.methods.getCrowdSummary = function() {
  const summary = {
    low: 0,
    medium: 0,
    high: 0,
    total: this.segments.length
  };
  
  this.segments.forEach(segment => {
    const level = segment.crowdLevel.toLowerCase();
    if (summary.hasOwnProperty(level)) {
      summary[level]++;
    }
  });
  
  return summary;
};

/**
 * Static method: Find journeys with high crowd concerns
 */
journeySchema.statics.findHighCrowdJourneys = function(userId, limit = 10) {
  return this.find({
    userId,
    hasHighCrowdSegments: true,
    status: { $in: ['planned', 'in-progress'] }
  })
  .sort({ plannedDate: 1 })
  .limit(limit);
};

const Journey = mongoose.model('Journey', journeySchema);

module.exports = Journey;