/**
 * SAARTHI - Crowd Estimation Tests
 * 
 * Test suite for crowd estimation utility functions
 */

const {
  estimateCrowdLevel,
  estimateCrowdForSegments,
  getCrowdLevelExplanation,
  getTimeBucket,
  getHourFromTime
} = require('../utils/crowdEstimation');

/**
 * Test: getHourFromTime
 */
describe('getHourFromTime', () => {
  test('should extract hour from valid time string', () => {
    expect(getHourFromTime('09:30')).toBe(9);
    expect(getHourFromTime('14:45')).toBe(14);
    expect(getHourFromTime('00:00')).toBe(0);
    expect(getHourFromTime('23:59')).toBe(23);
  });

  test('should throw error for invalid time format', () => {
    expect(() => getHourFromTime('9:30')).toThrow(); // Missing leading zero
    expect(() => getHourFromTime('25:00')).toThrow(); // Invalid hour
    expect(() => getHourFromTime('12')).toThrow(); // Missing minutes
    expect(() => getHourFromTime('')).toThrow(); // Empty string
    expect(() => getHourFromTime(null)).toThrow(); // Null
  });
});

/**
 * Test: getTimeBucket
 */
describe('getTimeBucket', () => {
  test('should identify peak hours correctly', () => {
    expect(getTimeBucket('08:00')).toBe('peak'); // Morning peak start
    expect(getTimeBucket('09:30')).toBe('peak'); // Morning peak middle
    expect(getTimeBucket('10:59')).toBe('peak'); // Morning peak end
    
    expect(getTimeBucket('17:00')).toBe('peak'); // Evening peak start
    expect(getTimeBucket('18:30')).toBe('peak'); // Evening peak middle
    expect(getTimeBucket('19:59')).toBe('peak'); // Evening peak end
  });

  test('should identify off-peak hours correctly', () => {
    expect(getTimeBucket('11:00')).toBe('off-peak'); // Off-peak start
    expect(getTimeBucket('13:30')).toBe('off-peak'); // Off-peak middle
    expect(getTimeBucket('16:59')).toBe('off-peak'); // Off-peak end
  });

  test('should identify low hours correctly', () => {
    expect(getTimeBucket('00:00')).toBe('low'); // Midnight
    expect(getTimeBucket('05:30')).toBe('low'); // Early morning
    expect(getTimeBucket('07:59')).toBe('low'); // Just before peak
    expect(getTimeBucket('20:00')).toBe('low'); // Just after peak
    expect(getTimeBucket('23:59')).toBe('low'); // Late night
  });
});

/**
 * Test: estimateCrowdLevel - Train
 */
describe('estimateCrowdLevel - Train', () => {
  test('should return High during peak hours', () => {
    expect(estimateCrowdLevel('train', '08:30')).toBe('High');
    expect(estimateCrowdLevel('train', '09:00')).toBe('High');
    expect(estimateCrowdLevel('train', '18:00')).toBe('High');
  });

  test('should return Medium during off-peak hours', () => {
    expect(estimateCrowdLevel('train', '12:00')).toBe('Medium');
    expect(estimateCrowdLevel('train', '14:30')).toBe('Medium');
  });

  test('should return Low during low hours', () => {
    expect(estimateCrowdLevel('train', '06:00')).toBe('Low');
    expect(estimateCrowdLevel('train', '22:00')).toBe('Low');
  });
});

/**
 * Test: estimateCrowdLevel - Bus
 */
describe('estimateCrowdLevel - Bus', () => {
  test('should return Medium during peak hours', () => {
    expect(estimateCrowdLevel('bus', '08:30')).toBe('Medium');
    expect(estimateCrowdLevel('bus', '18:00')).toBe('Medium');
  });

  test('should return Low during off-peak hours', () => {
    expect(estimateCrowdLevel('bus', '12:00')).toBe('Low');
    expect(estimateCrowdLevel('bus', '14:30')).toBe('Low');
  });

  test('should return Low during low hours', () => {
    expect(estimateCrowdLevel('bus', '06:00')).toBe('Low');
    expect(estimateCrowdLevel('bus', '22:00')).toBe('Low');
  });
});

/**
 * Test: estimateCrowdLevel - Metro
 */
describe('estimateCrowdLevel - Metro', () => {
  test('should return Medium during peak hours', () => {
    expect(estimateCrowdLevel('metro', '08:30')).toBe('Medium');
    expect(estimateCrowdLevel('metro', '18:00')).toBe('Medium');
  });

  test('should return Low during off-peak and low hours', () => {
    expect(estimateCrowdLevel('metro', '12:00')).toBe('Low');
    expect(estimateCrowdLevel('metro', '22:00')).toBe('Low');
  });
});

/**
 * Test: estimateCrowdLevel - Personal Transport
 */
describe('estimateCrowdLevel - Personal Transport', () => {
  test('should always return Low for auto', () => {
    expect(estimateCrowdLevel('auto', '08:30')).toBe('Low');
    expect(estimateCrowdLevel('auto', '12:00')).toBe('Low');
    expect(estimateCrowdLevel('auto', '22:00')).toBe('Low');
  });

  test('should always return Low for cab', () => {
    expect(estimateCrowdLevel('cab', '08:30')).toBe('Low');
    expect(estimateCrowdLevel('cab', '12:00')).toBe('Low');
    expect(estimateCrowdLevel('cab', '22:00')).toBe('Low');
  });

  test('should always return Low for walk', () => {
    expect(estimateCrowdLevel('walk', '08:30')).toBe('Low');
    expect(estimateCrowdLevel('walk', '12:00')).toBe('Low');
    expect(estimateCrowdLevel('walk', '22:00')).toBe('Low');
  });
});

/**
 * Test: estimateCrowdLevel - Edge Cases
 */
describe('estimateCrowdLevel - Edge Cases', () => {
  test('should handle case-insensitive mode', () => {
    expect(estimateCrowdLevel('TRAIN', '08:30')).toBe('High');
    expect(estimateCrowdLevel('Train', '08:30')).toBe('High');
    expect(estimateCrowdLevel('BUS', '08:30')).toBe('Medium');
  });

  test('should handle modes with extra whitespace', () => {
    expect(estimateCrowdLevel(' train ', '08:30')).toBe('High');
    expect(estimateCrowdLevel('  bus  ', '08:30')).toBe('Medium');
  });

  test('should handle unknown modes gracefully', () => {
    expect(estimateCrowdLevel('bicycle', '08:30')).toBe('Low');
    expect(estimateCrowdLevel('unknown', '12:00')).toBe('Low');
  });

  test('should throw error for invalid inputs', () => {
    expect(() => estimateCrowdLevel('', '08:30')).toThrow();
    expect(() => estimateCrowdLevel('train', '')).toThrow();
    expect(() => estimateCrowdLevel(null, '08:30')).toThrow();
  });
});

/**
 * Test: estimateCrowdForSegments
 */
describe('estimateCrowdForSegments', () => {
  test('should add crowd level to all segments', () => {
    const segments = [
      { mode: 'train', time: '08:30', from: 'A', to: 'B', duration: 30 },
      { mode: 'bus', time: '12:00', from: 'B', to: 'C', duration: 20 },
      { mode: 'walk', time: '18:00', from: 'C', to: 'D', duration: 10 }
    ];

    const result = estimateCrowdForSegments(segments);

    expect(result).toHaveLength(3);
    expect(result[0].crowdLevel).toBe('High'); // Train at peak
    expect(result[1].crowdLevel).toBe('Low'); // Bus at off-peak
    expect(result[2].crowdLevel).toBe('Low'); // Walk always low
    expect(result[0].crowdEstimationApplied).toBe(true);
  });

  test('should handle departureTime field', () => {
    const segments = [
      { mode: 'train', departureTime: '08:30', from: 'A', to: 'B', duration: 30 }
    ];

    const result = estimateCrowdForSegments(segments);
    expect(result[0].crowdLevel).toBe('High');
  });

  test('should handle errors gracefully', () => {
    const segments = [
      { mode: 'train', from: 'A', to: 'B', duration: 30 } // Missing time
    ];

    const result = estimateCrowdForSegments(segments);
    
    expect(result).toHaveLength(1);
    expect(result[0].crowdLevel).toBe('Low'); // Default on error
    expect(result[0].crowdEstimationApplied).toBe(false);
    expect(result[0].crowdEstimationError).toBeDefined();
  });

  test('should throw error for non-array input', () => {
    expect(() => estimateCrowdForSegments(null)).toThrow();
    expect(() => estimateCrowdForSegments('not an array')).toThrow();
  });
});

/**
 * Test: getCrowdLevelExplanation
 */
describe('getCrowdLevelExplanation', () => {
  test('should provide explanations for train', () => {
    const highExplanation = getCrowdLevelExplanation('High', 'train');
    expect(highExplanation).toContain('very crowded');
    
    const mediumExplanation = getCrowdLevelExplanation('Medium', 'train');
    expect(mediumExplanation).toContain('Moderate');
    
    const lowExplanation = getCrowdLevelExplanation('Low', 'train');
    expect(lowExplanation).toContain('Comfortable');
  });

  test('should provide explanations for other modes', () => {
    const busExplanation = getCrowdLevelExplanation('Medium', 'bus');
    expect(busExplanation).toBeDefined();
    
    const metroExplanation = getCrowdLevelExplanation('Low', 'metro');
    expect(metroExplanation).toBeDefined();
  });

  test('should handle unknown modes', () => {
    const explanation = getCrowdLevelExplanation('High', 'bicycle');
    expect(explanation).toBeDefined();
  });
});

/**
 * Integration Test: Complete Journey Scenario
 */
describe('Integration - Complete Journey Scenario', () => {
  test('should estimate crowd for typical morning commute', () => {
    const segments = [
      { mode: 'walk', departureTime: '07:45', from: 'Home', to: 'Station', duration: 10 },
      { mode: 'train', departureTime: '08:00', from: 'Station A', to: 'Station B', duration: 35 },
      { mode: 'bus', departureTime: '08:45', from: 'Station B', to: 'Office', duration: 15 }
    ];

    const result = estimateCrowdForSegments(segments);

    // Walk segment - always low
    expect(result[0].crowdLevel).toBe('Low');
    
    // Train during peak - high crowd
    expect(result[1].crowdLevel).toBe('High');
    
    // Bus during peak - medium crowd
    expect(result[2].crowdLevel).toBe('Medium');
  });

  test('should estimate crowd for midday journey', () => {
    const segments = [
      { mode: 'metro', departureTime: '13:00', from: 'A', to: 'B', duration: 20 },
      { mode: 'auto', departureTime: '13:30', from: 'B', to: 'C', duration: 15 }
    ];

    const result = estimateCrowdForSegments(segments);

    // Metro during off-peak - low crowd
    expect(result[0].crowdLevel).toBe('Low');
    
    // Auto - always low
    expect(result[1].crowdLevel).toBe('Low');
  });

  test('should estimate crowd for late night journey', () => {
    const segments = [
      { mode: 'train', departureTime: '22:30', from: 'A', to: 'B', duration: 40 },
      { mode: 'cab', departureTime: '23:20', from: 'B', to: 'Home', duration: 20 }
    ];

    const result = estimateCrowdForSegments(segments);

    // Train during low hours - low crowd
    expect(result[0].crowdLevel).toBe('Low');
    
    // Cab - always low
    expect(result[1].crowdLevel).toBe('Low');
  });
});

// Run tests with: npm test