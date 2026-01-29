const Journey = require('../models/journey');

// RULE-BASED JOURNEY GENERATOR
const generateJourney = (source, destination) => {
  const rules = {
    'Andheri Station': {
      'BKC Bandra': [
        { 
          mode: 'walk', 
          from: 'Home', 
          to: 'Andheri Station', 
          duration: 6, 
          crowdLevel: 'Low',
          riskNote: null 
        },
        { 
          mode: 'train', 
          from: 'Andheri', 
          to: 'Bandra', 
          duration: 28, 
          crowdLevel: 'High',
          riskNote: 'Peak hour overcrowding' 
        },
        { 
          mode: 'walk', 
          from: 'Bandra Station', 
          to: 'BKC Office', 
          duration: 7, 
          crowdLevel: 'Low',
          riskNote: null 
        }
      ]
    }
  };

  const segments = rules[source]?.[destination] || [
    { mode: 'walk', from: 'Home', to: `${source} Station`, duration: 8, crowdLevel: 'Low', riskNote: null },
    { mode: 'train', from: source, to: destination, duration: 35, crowdLevel: 'Medium', riskNote: 'Moderate crowd' },
    { mode: 'walk', from: `${destination} Station`, to: 'Office', duration: 9, crowdLevel: 'Low', riskNote: null }
  ];

  const totalTime = segments.reduce((sum, seg) => sum + seg.duration, 0);
  const transferCount = segments.length > 2 ? segments.length - 2 : 0;
  const riskPoints = segments.filter(s => s.riskNote).map(s => s.riskNote);

  const startHour = 8, startMin = 20;
  const endMin = startMin + totalTime;
  const endHour = startHour + Math.floor(endMin / 60);
  const finalMin = endMin % 60;

  return {
    segments,
    totalTime,
    transferCount,
    riskPoints,
    startTime: '8:20 AM',
    endTime: `${endHour}:${finalMin.toString().padStart(2, '0')} AM`
  };
};

// PLAN JOURNEY
const planJourney = async (req, res) => {
  try {
    const { source, destination } = req.body;

    if (!source || !destination) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both source and destination'
      });
    }

    const journeyData = generateJourney(source, destination);

    const journey = new Journey({
      userId: req.user.id || req.user._id,
      source,
      destination,
      segments: journeyData.segments,
      totalTime: journeyData.totalTime,
      transferCount: journeyData.transferCount,
      riskPoints: journeyData.riskPoints,
      startTime: journeyData.startTime,
      endTime: journeyData.endTime
    });

    await journey.save();

    res.status(201).json({
      success: true,
      data: journey
    });

  } catch (error) {
    console.error('Journey planning error:', error);
    res.status(500).json({
      success: false,
      message: 'Journey planning failed'
    });
  }
};

// GET JOURNEY HISTORY
const getJourneyHistory = async (req, res) => {
  try {
    const journeys = await Journey.find({
      userId: req.user.id || req.user._id
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: journeys
    });

  } catch (error) {
    console.error('Journey history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching journey history'
    });
  }
};

// GET JOURNEY BY ID
const getJourneyById = async (req, res) => {
  try {
    const journey = await Journey.findById(req.params.id);

    if (!journey) {
      return res.status(404).json({
        success: false,
        message: 'Journey not found'
      });
    }

    const userId = req.user.id || req.user._id;
    if (journey.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    res.status(200).json({
      success: true,
      data: journey
    });

  } catch (error) {
    console.error('Get journey error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching journey'
    });
  }
};

// ✅ ONE clean export — no ambiguity
module.exports = {
  planJourney,
  getJourneyHistory,
  getJourneyById
};
