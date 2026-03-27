const express = require("express");
const router = express.Router();
const timetable = require("../data/final_timetable_fixed.json");

// Convert "20:39" → minutes
function toMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// API: /api/trains?source=Thane&destination=Vashi
router.get("/", (req, res) => {
  const source = req.query.source?.trim().toUpperCase();
  const destination = req.query.destination?.trim().toUpperCase();

  if (!source || !destination) {
    return res.status(400).json({ error: "source and destination required" });
  }

  let results = [];

  for (const train_id in timetable) {
    const stops = timetable[train_id];

    // FIND MATCH BY station_code OR station_name
    const sIndex = stops.findIndex(
      s =>
        s.station_code.toUpperCase() === source ||
        s.station_name.toUpperCase() === source
    );

    const dIndex = stops.findIndex(
      s =>
        s.station_code.toUpperCase() === destination ||
        s.station_name.toUpperCase() === destination
    );

    // Must appear in correct order
    if (sIndex !== -1 && dIndex !== -1 && sIndex < dIndex) {
      const departure = stops[sIndex].time;
      const arrival = stops[dIndex].time;

      results.push({
        train_id,
        from: stops[sIndex].station_name,
        to: stops[dIndex].station_name,
        departure,
        arrival,
        duration_minutes: toMinutes(arrival) - toMinutes(departure),
      });
    }
  }

  res.json(results);
});

module.exports = router;
