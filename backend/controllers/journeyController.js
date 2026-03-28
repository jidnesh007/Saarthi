/**
 * SAARTHI - Journey Controller
 * 
 * Handles journey planning with integrated crowd estimation
 */

const Journey = require('../models/journey');
const { 
  estimateCrowdLevel, 
  estimateCrowdForSegments,
  getCrowdLevelExplanation 
} = require('../utils/crowdEstimation');

/**
 * Calculate confidence score based on journey characteristics
 * 
 * Factors that influence confidence:
 * - Number of segments (more segments = lower confidence)
 * - Crowd levels (high crowd = lower confidence)
 * - Journey complexity
 * 
 * @param {Array} segments - Journey segments with crowd levels
 * @returns {number} - Confidence score (0-100)
 */
const calculateConfidenceScore = (segments) => {
  let score = 100; // Start with perfect confidence
  
  // Deduct points for journey complexity
  const segmentCount = segments.length;
  
  // More segments = more transfers = lower confidence
  if (segmentCount > 1) {
    score -= (segmentCount - 1) * 5; // -5 points per additional segment
  }
  
  // Deduct points based on crowd levels
  segments.forEach(segment => {
    if (segment.crowdLevel === 'High') {
      score -= 15; // High crowd significantly reduces confidence
    } else if (segment.crowdLevel === 'Medium') {
      score -= 8; // Medium crowd moderately reduces confidence
    }
    // Low crowd: no deduction
  });
  
  // Ensure score stays within bounds
  return Math.max(0, Math.min(100, score));
};

/**
 * Determine overall risk level for the journey
 * 
 * @param {Array} segments - Journey segments
 * @param {number} confidenceScore - Journey confidence score
 * @returns {string} - Risk level: 'Low' | 'Medium' | 'High'
 */
const calculateRiskLevel = (segments, confidenceScore) => {
  const hasHighCrowd = segments.some(s => s.crowdLevel === 'High');
  const hasMediumCrowd = segments.some(s => s.crowdLevel === 'Medium');
  const manySegments = segments.length > 3;
  
  // High risk conditions
  if (hasHighCrowd && manySegments) return 'High';
  if (confidenceScore < 50) return 'High';
  
  // Medium risk conditions
  if (hasHighCrowd) return 'Medium';
  if (hasMediumCrowd && manySegments) return 'Medium';
  if (confidenceScore < 70) return 'Medium';
  
  // Default to low risk
  return 'Low';
};

/**
 * Plan a new journey
 * POST /api/journey/plan
 * 
 * @route POST /api/journey/plan
 * @access Private (requires authentication)
 */
const planJourney = async (req, res) => {
  try {
    const {
      title,
      origin,
      destination,
      plannedDate,
      plannedTime,
      segments,
      notes
    } = req.body;
    
    // Validation
    if (!title || !origin || !destination || !plannedDate || !plannedTime) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, origin, destination, plannedDate, plannedTime'
      });
    }
    
    if (!segments || !Array.isArray(segments) || segments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one journey segment is required'
      });
    }
    
    // Validate each segment has required fields
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      if (!segment.mode || !segment.from || !segment.to || !segment.departureTime || !segment.duration) {
        return res.status(400).json({
          success: false,
          message: `Segment ${i + 1} is missing required fields`
        });
      }
    }
    
    // Apply crowd estimation to all segments
    const segmentsWithCrowd = estimateCrowdForSegments(segments);
    
    // Calculate total duration
    const totalDuration = segmentsWithCrowd.reduce((sum, segment) => {
      return sum + (segment.duration || 0);
    }, 0);
    
    // Calculate total distance (if provided)
    const totalDistance = segmentsWithCrowd.reduce((sum, segment) => {
      return sum + (segment.distance || 0);
    }, 0);
    
    // Calculate confidence score based on crowd levels and complexity
    const confidenceScore = calculateConfidenceScore(segmentsWithCrowd);
    
    // Determine risk level
    const riskLevel = calculateRiskLevel(segmentsWithCrowd, confidenceScore);
    
    // Generate risk notes
    const riskNotes = [];
    const highCrowdSegments = segmentsWithCrowd.filter(s => s.crowdLevel === 'High');
    const mediumCrowdSegments = segmentsWithCrowd.filter(s => s.crowdLevel === 'Medium');
    
    if (highCrowdSegments.length > 0) {
      riskNotes.push(`${highCrowdSegments.length} segment${highCrowdSegments.length > 1 ? 's' : ''} expected to have high crowd levels`);
    }
    
    if (mediumCrowdSegments.length > 0) {
      riskNotes.push(`${mediumCrowdSegments.length} segment${mediumCrowdSegments.length > 1 ? 's' : ''} expected to have moderate crowd levels`);
    }
    
    if (segmentsWithCrowd.length > 3) {
      riskNotes.push('Multiple transfers required - allow extra time');
    }
    
    // Create journey document
    const journey = new Journey({
      userId: req.user._id, // From JWT auth middleware
      title,
      origin,
      destination,
      plannedDate: new Date(plannedDate),
      plannedTime,
      segments: segmentsWithCrowd,
      totalDuration,
      totalDistance: totalDistance > 0 ? totalDistance : undefined,
      confidenceScore,
      riskLevel,
      riskNotes,
      notes: notes || '',
      status: 'planned'
    });
    
    // Save to database
    await journey.save();
    
    // Return response with crowd estimation details
    res.status(201).json({
      success: true,
      message: 'Journey planned successfully with crowd estimation',
      data: {
        journey: {
          id: journey._id,
          title: journey.title,
          origin: journey.origin,
          destination: journey.destination,
          plannedDate: journey.plannedDate,
          plannedTime: journey.plannedTime,
          segments: journey.segments,
          totalDuration: journey.totalDuration,
          totalDistance: journey.totalDistance,
          confidenceScore: journey.confidenceScore,
          riskLevel: journey.riskLevel,
          riskNotes: journey.riskNotes,
          hasHighCrowdSegments: journey.hasHighCrowdSegments,
          crowdSummary: journey.getCrowdSummary(),
          createdAt: journey.createdAt
        }
      }
    });
    
  } catch (error) {
    console.error('Error planning journey:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to plan journey',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get all journeys for the authenticated user
 * GET /api/journey/all
 * 
 * @route GET /api/journey/all
 * @access Private
 */
const getAllJourneys = async (req, res) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;
    
    // Build query
    const query = { userId: req.user._id };
    
    if (status) {
      query.status = status;
    }
    
    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const journeys = await Journey.find(query)
      .sort({ plannedDate: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();
    
    // Get total count for pagination
    const total = await Journey.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        journeys,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching journeys:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch journeys'
    });
  }
};

/**
 * Get a specific journey by ID
 * GET /api/journey/:id
 * 
 * @route GET /api/journey/:id
 * @access Private
 */
const getJourneyById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const journey = await Journey.findOne({
      _id: id,
      userId: req.user._id
    });
    
    if (!journey) {
      return res.status(404).json({
        success: false,
        message: 'Journey not found'
      });
    }
    
    // Add crowd summary
    const crowdSummary = journey.getCrowdSummary();
    
    res.json({
      success: true,
      data: {
        journey: {
          ...journey.toObject(),
          crowdSummary
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching journey:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch journey'
    });
  }
};

/**
 * Update journey status
 * PATCH /api/journey/:id/status
 * 
 * @route PATCH /api/journey/:id/status
 * @access Private
 */
const updateJourneyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['planned', 'in-progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    const journey = await Journey.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { status },
      { new: true }
    );
    
    if (!journey) {
      return res.status(404).json({
        success: false,
        message: 'Journey not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Journey status updated',
      data: { journey }
    });
    
  } catch (error) {
    console.error('Error updating journey status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update journey status'
    });
  }
};

/**
 * Delete a journey
 * DELETE /api/journey/:id
 * 
 * @route DELETE /api/journey/:id
 * @access Private
 */
const deleteJourney = async (req, res) => {
  try {
    const { id } = req.params;
    
    const journey = await Journey.findOneAndDelete({
      _id: id,
      userId: req.user._id
    });
    
    if (!journey) {
      return res.status(404).json({
        success: false,
        message: 'Journey not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Journey deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting journey:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete journey'
    });
  }
};

/**
 * Get journeys with high crowd concerns
 * GET /api/journey/crowd/high
 * 
 * @route GET /api/journey/crowd/high
 * @access Private
 */
const getHighCrowdJourneys = async (req, res) => {
  try {
    const journeys = await Journey.findHighCrowdJourneys(req.user._id);
    
    res.json({
      success: true,
      data: {
        journeys,
        count: journeys.length
      }
    });
    
  } catch (error) {
    console.error('Error fetching high crowd journeys:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch high crowd journeys'
    });
  }
};

module.exports = {
  planJourney,
  getAllJourneys,
  getJourneyById,
  updateJourneyStatus,
  deleteJourney,
  getHighCrowdJourneys
};