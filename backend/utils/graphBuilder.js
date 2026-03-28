const timetable = require("../data/final_timetable_fixed.json");

function buildGraph() {
  const graph = {};

  for (const trainId in timetable) {
    const stops = timetable[trainId];

    for (let i = 0; i < stops.length - 1; i++) {
      const from = stops[i].station_name.trim().toLowerCase();
      const to = stops[i + 1].station_name.trim().toLowerCase();

      const [fh, fm] = stops[i].time.split(":").map(Number);
      const [th, tm] = stops[i + 1].time.split(":").map(Number);

      const weight = th * 60 + tm - (fh * 60 + fm);
      if (weight <= 0 || weight > 120) continue;

      if (!graph[from]) graph[from] = [];

      graph[from].push({ to, weight, trainId });
    }
  }

  return graph;
}

module.exports = buildGraph;
