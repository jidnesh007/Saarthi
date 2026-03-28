/**
 * Crowd Timeline Controller
 * GET /api/crowd/predict?station=<name>&time=HH:MM&day=weekday|weekend
 * GET /api/crowd/timeline?station=<name>&day=weekday|weekend
 * GET /api/crowd/stations  — list all available stations
 */

const path = require("path");
const fs   = require("fs");

// ── Load datasets ──────────────────────────────────────────────
const genericData = require("../data/crowd_timeline_dataset.json").data;

// Station-specific datasets (keyed by station slug)
const STATIONS = {
  "mumbai-local": {
    label: "Mumbai Local Station",
    file:  "crowd_dataset_mumbai.json",
  },
  "dadar": {
    label: "Dadar",
    file:  null,   // uses generic + light offset
    peakOffset: 0,
  },
  "panvel": {
    label: "Panvel Junction",
    file:  null,
    peakOffset: -1,  // slightly less crowded
  },
  "kurla": {
    label: "Kurla",
    file:  null,
    peakOffset: 1,   // slightly more crowded
  },
  "csmt": {
    label: "CSMT (Mumbai CST)",
    file:  null,
    peakOffset: 1,
  },
  "thane": {
    label: "Thane",
    file:  null,
    peakOffset: 0,
  },
  "borivali": {
    label: "Borivali",
    file:  null,
    peakOffset: 0,
  },
};

// ── Helpers ────────────────────────────────────────────────────

/**
 * Apply a peak-offset to crowd level for per-station variation
 * offset  1 → bump LOW→MEDIUM, MEDIUM→HIGH
 * offset -1 → reduce HIGH→MEDIUM, MEDIUM→LOW
 */
function applyOffset(crowd, offset) {
  const levels = ["LOW", "MEDIUM", "HIGH"];
  const idx    = levels.indexOf(crowd);
  const newIdx = Math.max(0, Math.min(2, idx + offset));
  return levels[newIdx];
}

/**
 * Get crowd data array for a station + day
 */
function getStationData(stationSlug, day) {
  const station = STATIONS[stationSlug];
  if (!station) return null;

  // Filter generic data by day
  const base = genericData.filter((d) => d.day === day);

  const offset = station.peakOffset ?? 0;
  return base.map((d) => ({
    ...d,
    crowd: applyOffset(d.crowd, offset),
    station: station.label,
  }));
}

/**
 * Snap a given HH:MM time to the nearest 30-min slot in the dataset
 */
function snapToSlot(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  const snapped = m < 15 ? 0 : m < 45 ? 30 : 0;
  const snappedH = m >= 45 ? (h + 1) % 24 : h;
  return `${String(snappedH).padStart(2, "0")}:${String(snapped).padStart(2, "0")}`;
}

/**
 * Determine day type from a JS Date
 */
function getDayType(date) {
  const dow = date.getDay(); // 0=Sun, 6=Sat
  return dow === 0 || dow === 6 ? "weekend" : "weekday";
}

// ── Crowd advice copy ──────────────────────────────────────────
const ADVICE = {
  LOW:    "✅ Great time to travel! Platform is comfortable.",
  MEDIUM: "⚠️ Moderate crowd. Arrive a few minutes early.",
  HIGH:   "🚨 Peak hours! Expect heavy crowds and delays. Consider alternate timings.",
};

// ── Controllers ────────────────────────────────────────────────

/**
 * GET /api/crowd/stations
 * Returns list of supported stations
 */
exports.getStations = (req, res) => {
  const list = Object.entries(STATIONS).map(([slug, s]) => ({
    slug,
    label: s.label,
  }));
  res.json({ success: true, stations: list });
};

/**
 * GET /api/crowd/predict?station=dadar&time=08:30&day=weekday
 * Returns crowd prediction for a specific time
 */
exports.predictCrowd = (req, res) => {
  let { station, time, day } = req.query;

  // Default: use current local time + auto day
  const now     = new Date();
  const autoDay = getDayType(now);
  const autoTime = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;

  station = (station || "dadar").toLowerCase();
  day     = (day || autoDay);
  time    = time || autoTime;

  const data = getStationData(station, day);
  if (!data) {
    return res.status(404).json({ success: false, message: "Station not found" });
  }

  const slot   = snapToSlot(time);
  const record = data.find((d) => d.time === slot) || data[0];

  const stationInfo = STATIONS[station];

  res.json({
    success:    true,
    station:    stationInfo?.label || station,
    time:       slot,
    day,
    crowd:      record.crowd,
    advice:     ADVICE[record.crowd],
    isAutoTime: !req.query.time,
  });
};

/**
 * GET /api/crowd/timeline?station=dadar&day=weekday
 * Returns full day timeline for a station
 */
exports.getTimeline = (req, res) => {
  let { station, day } = req.query;

  const now     = new Date();
  const autoDay = getDayType(now);

  station = (station || "dadar").toLowerCase();
  day     = day || autoDay;

  const data = getStationData(station, day);
  if (!data) {
    return res.status(404).json({ success: false, message: "Station not found" });
  }

  const stationInfo = STATIONS[station];

  res.json({
    success:  true,
    station:  stationInfo?.label || station,
    day,
    timeline: data.map((d) => ({
      time:   d.time,
      crowd:  d.crowd,
      advice: ADVICE[d.crowd],
    })),
  });
};
