/**
 * SAARTHI - Journey Routes
 * 
 * API routes for journey planning with crowd estimation
 */

const express = require('express');
const router = express.Router();
const {
  planJourney,
  getAllJourneys,
  getJourneyById,
  updateJourneyStatus,
  deleteJourney,
  getHighCrowdJourneys
} = require('../controllers/journeyController');

// Import auth middleware (assumes it's already in your project)
const protect = require('../middleware/auth');


/**
 * All routes require authentication
 */
router.use(protect);

/**
 * @route   POST /api/journey/plan
 * @desc    Plan a new journey with crowd estimation
 * @access  Private
 */
router.post('/plan', planJourney);

/**
 * @route   GET /api/journey/all
 * @desc    Get all journeys for authenticated user
 * @access  Private
 * @query   status (optional) - Filter by status: planned | in-progress | completed | cancelled
 * @query   limit (optional) - Number of results per page (default: 50)
 * @query   page (optional) - Page number (default: 1)
 */
router.get('/all', getAllJourneys);

/**
 * @route   GET /api/journey/crowd/high
 * @desc    Get journeys with high crowd concerns
 * @access  Private
 */
router.get('/crowd/high', getHighCrowdJourneys);

/**
 * @route   GET /api/journey/:id
 * @desc    Get a specific journey by ID
 * @access  Private
 */
router.get('/:id', getJourneyById);

/**
 * @route   PATCH /api/journey/:id/status
 * @desc    Update journey status
 * @access  Private
 */
router.patch('/:id/status', updateJourneyStatus);

/**
 * @route   DELETE /api/journey/:id
 * @desc    Delete a journey
 * @access  Private
 */
router.delete('/:id', deleteJourney);

module.exports = router;