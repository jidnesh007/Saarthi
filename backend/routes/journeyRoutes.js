const express = require("express");
const router = express.Router();
const journeyController = require("../controllers/journeyController");

router.get("/stations", journeyController.getStations);
router.post("/search", journeyController.searchRoutes);

module.exports = router;
