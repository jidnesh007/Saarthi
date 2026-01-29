const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');

const {
  planJourney,
  getJourneyHistory,
  getJourneyById
} = require('../controllers/journeyController');


// All routes are protected
router.post('/plan', protect, planJourney);
router.get('/history', protect, getJourneyHistory);
router.get('/:id', protect, getJourneyById);

module.exports = router;