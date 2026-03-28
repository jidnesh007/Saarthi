/**
 * SAARTHI - Crowd Estimation Utility
 * 
 * This module provides rule-based crowd level estimation for journey segments.
 * NO external APIs, NO ML models, NO real-time data.
 * 
 * Estimation is based purely on:
 * - Transport mode
 * - Time of day (journey time)
 * - Historical commuting patterns (rule-based)
 */

/**
 * Extracts hour from HH:MM format time string
 * @param {string} timeString - Time in HH:MM format (e.g., "09:30")
 * @returns {number} - Hour as integer (0-23)
 */
const getHourFromTime = (timeString) => {
  if (!timeString || typeof timeString !== 'string') {
    throw new Error('Invalid time format. Expected HH:MM');
  }
  
  const parts = timeString.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid time format. Expected HH:MM');
  }
  
  const hour = parseInt(parts[0], 10);
  
  if (isNaN(hour) || hour < 0 || hour > 23) {
    throw new Error('Invalid hour. Must be between 0 and 23');
  }
  
  return hour;
};

/**
 * Determines time bucket based on journey time
 * @param {string} journeyTime - Time in HH:MM format
 * @returns {string} - Time bucket: 'peak' | 'off-peak' | 'low'
 */
const getTimeBucket = (journeyTime) => {
  const hour = getHourFromTime(journeyTime);
  
  // Peak hours: 08:00-11:00 (morning rush) and 17:00-20:00 (evening rush)
  if ((hour >= 8 && hour < 11) || (hour >= 17 && hour < 20)) {
    return 'peak';
  }
  
  // Off-peak hours: 11:00-17:00 (midday)
  if (hour >= 11 && hour < 17) {
    return 'off-peak';
  }
  
  // Low hours: Everything else (early morning, late night)
  return 'low';
};

/**
 * Estimates crowd level for a journey segment
 * 
 * RULE-BASED LOGIC:
 * 
 * TRAIN (Local/Suburban trains):
 * - Peak hours → HIGH (packed trains during rush hour)
 * - Off-peak hours → MEDIUM (moderate occupancy)
 * - Low hours → LOW (comfortable seating available)
 * 
 * BUS:
 * - Peak hours → MEDIUM (busy but manageable)
 * - Off-peak hours → LOW (comfortable)
 * - Low hours → LOW (very comfortable)
 * 
 * METRO:
 * - Peak hours → MEDIUM (controlled but busy)
 * - Off-peak hours → LOW (comfortable)
 * - Low hours → LOW (very comfortable)
 * 
 * AUTO/CAB/WALK:
 * - Always → LOW (personal transport or no crowd)
 * 
 * @param {string} transportMode - Mode of transport: 'train' | 'bus' | 'metro' | 'auto' | 'cab' | 'walk'
 * @param {string} journeyTime - Time in HH:MM format (e.g., "09:30")
 * @returns {string} - Crowd level: 'Low' | 'Medium' | 'High'
 */
const estimateCrowdLevel = (transportMode, journeyTime) => {
  // Input validation
  if (!transportMode || typeof transportMode !== 'string') {
    throw new Error('Transport mode is required and must be a string');
  }
  
  if (!journeyTime) {
    throw new Error('Journey time is required');
  }
  
  // Normalize transport mode to lowercase for comparison
  const mode = transportMode.toLowerCase().trim();
  
  // Get time bucket for the journey
  const timeBucket = getTimeBucket(journeyTime);
  
  // Apply crowd estimation rules based on mode and time
  switch (mode) {
    case 'train':
      // Local/Suburban trains - highest crowd variation
      if (timeBucket === 'peak') return 'High';
      if (timeBucket === 'off-peak') return 'Medium';
      return 'Low';
    
    case 'bus':
      // Public buses - moderate crowd variation
      if (timeBucket === 'peak') return 'Medium';
      return 'Low'; // Both off-peak and low hours
    
    case 'metro':
      // Metro trains - controlled crowd but still busy during peak
      if (timeBucket === 'peak') return 'Medium';
      return 'Low'; // Both off-peak and low hours
    
    case 'auto':
    case 'cab':
    case 'walk':
      // Personal transport or walking - no crowd concerns
      return 'Low';
    
    default:
      // For unknown modes, assume low crowd as a safe default
      console.warn(`Unknown transport mode: ${mode}. Defaulting to Low crowd level.`);
      return 'Low';
  }
};

/**
 * Estimates crowd levels for multiple journey segments
 * @param {Array} segments - Array of journey segments
 * @returns {Array} - Segments with crowdLevel added
 */
const estimateCrowdForSegments = (segments) => {
  if (!Array.isArray(segments)) {
    throw new Error('Segments must be an array');
  }
  
  return segments.map(segment => {
    try {
      const crowdLevel = estimateCrowdLevel(segment.mode, segment.departureTime || segment.time);
      
      return {
        ...segment,
        crowdLevel,
        crowdEstimationApplied: true
      };
    } catch (error) {
      console.error(`Error estimating crowd for segment:`, error.message);
      
      // Return segment with default low crowd level on error
      return {
        ...segment,
        crowdLevel: 'Low',
        crowdEstimationApplied: false,
        crowdEstimationError: error.message
      };
    }
  });
};

/**
 * Gets a human-readable explanation for the crowd level
 * @param {string} crowdLevel - The estimated crowd level
 * @param {string} transportMode - Mode of transport
 * @returns {string} - Explanation text
 */
const getCrowdLevelExplanation = (crowdLevel, transportMode) => {
  const mode = transportMode.toLowerCase();
  
  const explanations = {
    train: {
      High: 'Expected to be very crowded during peak commute hours',
      Medium: 'Moderate crowd expected during off-peak hours',
      Low: 'Comfortable journey expected with available seating'
    },
    bus: {
      High: 'Expected to be busy',
      Medium: 'Moderate crowd expected during peak hours',
      Low: 'Comfortable journey expected'
    },
    metro: {
      High: 'Expected to be busy',
      Medium: 'Moderate crowd expected during peak hours',
      Low: 'Comfortable journey expected'
    },
    default: {
      High: 'Expected crowd level is high',
      Medium: 'Expected crowd level is moderate',
      Low: 'Expected crowd level is low'
    }
  };
  
  const modeExplanations = explanations[mode] || explanations.default;
  return modeExplanations[crowdLevel] || 'Crowd estimation available';
};

module.exports = {
  estimateCrowdLevel,
  estimateCrowdForSegments,
  getCrowdLevelExplanation,
  getTimeBucket,
  getHourFromTime
};