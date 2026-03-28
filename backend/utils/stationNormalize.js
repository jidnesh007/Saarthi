const timetable = require("../data/final_timetable_fixed.json");

// Extract unique station names (lowercase)
const stationNames = [
  ...new Set(
    Object.values(timetable)
      .flat()
      .map(stop => stop.station_name.trim().toLowerCase())
  )
];

function normalizeStation(input) {
  if (!input) return null;

  input = input.trim().toLowerCase();

  // exact match
  if (stationNames.includes(input)) return input;

  // partial match
  const match = stationNames.find(name => name.startsWith(input));
  if (match) return match;

  // fuzzy match (contains)
  const contains = stationNames.find(name => name.includes(input));
  if (contains) return contains;

  return null;
}

module.exports = normalizeStation;
