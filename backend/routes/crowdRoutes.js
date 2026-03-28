const express = require("express");
const router  = express.Router();
const { getStations, predictCrowd, getTimeline } = require("../controllers/crowdController");

// GET /api/crowd/stations
router.get("/stations", getStations);

// GET /api/crowd/predict?station=dadar&time=08:30&day=weekday
router.get("/predict", predictCrowd);

// GET /api/crowd/timeline?station=dadar&day=weekday
router.get("/timeline", getTimeline);

module.exports = router;
