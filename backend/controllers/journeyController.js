const fs = require("fs");
const path = require("path");

const timetableData = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../data/final_timetable_fixed.json"),
    "utf8",
  ),
);

const STATION_ALIASES = {
  KHARGAR: "KHARGHAR",
};

// More flexible station matching
const normalizeStation = (stationName) => {
  if (!stationName) return "";
  const normalized = stationName
    .toString()
    .trim()
    .toUpperCase()
    .replace(/[^\w\s]/g, "") // Remove special chars
    .replace(/\s+/g, " "); // Normalize spaces

  return STATION_ALIASES[normalized] || normalized;
};

const normalizeTime = (timeValue) => {
  if (!timeValue) return null;
  const value = timeValue.toString().trim();
  const match = value.match(/^([01]?\d|2[0-3])[:.]([0-5]\d)$/);
  if (!match) return null;
  return `${match[1].padStart(2, "0")}:${match[2]}`;
};

const getEditDistance = (a, b) => {
  const matrix = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0),
  );

  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[a.length][b.length];
};

const stationMatches = (stationName, queryName) => {
  if (!stationName || !queryName) return false;
  if (
    stationName === queryName ||
    stationName.includes(queryName) ||
    queryName.includes(stationName)
  ) {
    return true;
  }

  // Accept small typos like KHARGHAR vs KHARGAR
  if (stationName.length >= 6 && queryName.length >= 6) {
    return getEditDistance(stationName, queryName) <= 1;
  }

  return false;
};

const getAllStations = () => {
  const stationsSet = new Set();

  Object.values(timetableData).forEach((trainSchedule) => {
    trainSchedule.forEach((stop) => {
      const stationName = normalizeStation(stop.station_name);
      if (
        stationName &&
        stationName.length > 2 &&
        !stationName.includes("STATIONS") &&
        !stationName.includes("NOT ON") &&
        !stationName.includes("SUN") &&
        !stationName.includes("AIR") &&
        !stationName.includes("#")
      ) {
        stationsSet.add(stationName);
      }
    });
  });

  return Array.from(stationsSet).sort();
};

// Realistic Mumbai fare slabs
const calculateFare = (stops, distanceType = "local") => {
  if (stops <= 3) return 10;
  if (stops <= 8) return 15;
  if (stops <= 15) return 20;
  if (stops <= 25) return 25;
  return 30;
};

// Enhanced direct route finder
const findDirectRoutes = (source, destination) => {
  const routes = [];
  const normalizedSource = normalizeStation(source);
  const normalizedDest = normalizeStation(destination);

  console.log(`🔍 Searching: "${normalizedSource}" → "${normalizedDest}"`);

  Object.entries(timetableData).forEach(([trainId, schedule]) => {
    let sourceStop = null;
    let destStop = null;
    let sourceIndex = -1;
    let destIndex = -1;

    // Find exact matches with flexible matching
    schedule.forEach((stop, index) => {
      const stationName = normalizeStation(stop.station_name);
      const time = normalizeTime(stop.time);

      // Source match
      if (
        !sourceStop &&
        time &&
        stationMatches(stationName, normalizedSource)
      ) {
        sourceStop = { ...stop, station_name: stop.station_name.trim(), index };
        sourceIndex = index;
      }

      // Destination match (only after source)
      if (
        sourceStop &&
        !destStop &&
        time &&
        stationMatches(stationName, normalizedDest)
      ) {
        destStop = { ...stop, station_name: stop.station_name.trim(), index };
        destIndex = index;
      }
    });

    // Valid route found
    if (sourceStop && destStop && sourceIndex < destIndex) {
      const stopsCount = destIndex - sourceIndex;

      console.log(
        `✅ Found: ${trainId} - ${sourceStop.station_name}(${sourceStop.time}) → ${destStop.station_name}(${destStop.time})`,
      );

      routes.push({
        trainId: trainId.substring(0, 10),
        isDirect: true,
        totalFare: calculateFare(stopsCount),
        segments: [
          {
            trainId: trainId.substring(0, 10),
            fromStation: sourceStop.station_name,
            toStation: destStop.station_name,
            departureTime: sourceStop.time,
            arrivalTime: destStop.time,
            stopsCount,
            fare: calculateFare(stopsCount),
            distance: `${stopsCount} stops`,
          },
        ],
      });
    }
  });

  return routes;
};

// Transfer routes (Vashi → Dadar via common junction)
const findTransferRoutes = (source, destination) => {
  const transferPoints = [
    "DADAR",
    "ANDHERI",
    "KURLA",
    "THANE",
    "VASHI",
    "NERUL",
    "SEAWOODS DARAVE",
    "CBD BELAPUR",
    "BELAPUR",
    "PANVEL",
    "TURBHE",
    "SANPADA",
    "WADALA ROAD",
  ];
  const routes = [];
  const normalizedSource = normalizeStation(source);
  const normalizedDest = normalizeStation(destination);
  const seen = new Set();

  transferPoints.forEach((transfer) => {
    if (transfer === normalizedSource || transfer === normalizedDest) return;

    const toTransfer = findDirectRoutes(source, transfer);
    const fromTransfer = findDirectRoutes(transfer, destination);

    toTransfer.forEach((route1) => {
      fromTransfer.forEach((route2) => {
        if (route1.segments[0].trainId === route2.segments[0].trainId) return;

        const routeKey = `${route1.segments[0].trainId}|${transfer}|${route2.segments[0].trainId}`;
        if (seen.has(routeKey)) return;
        seen.add(routeKey);

        routes.push({
          trainId: `${route1.segments[0].trainId} → ${route2.segments[0].trainId}`,
          isDirect: false,
          totalFare: route1.totalFare + route2.totalFare,
          segments: [...route1.segments, ...route2.segments],
          transferStation: transfer,
        });
      });
    });
  });

  return routes;
};

const findTwoTransferRoutes = (source, destination) => {
  const transferPoints = [
    "DADAR",
    "ANDHERI",
    "KURLA",
    "THANE",
    "VASHI",
    "NERUL",
    "SEAWOODS DARAVE",
    "BELAPUR",
    "PANVEL",
    "TURBHE",
    "SANPADA",
    "WADALA ROAD",
  ];

  const normalizedSource = normalizeStation(source);
  const normalizedDest = normalizeStation(destination);
  const routes = [];
  const seen = new Set();
  const cache = new Map();

  const getCachedRoutes = (from, to) => {
    const key = `${from}__${to}`;
    if (!cache.has(key)) {
      cache.set(key, findDirectRoutes(from, to));
    }
    return cache.get(key);
  };

  transferPoints.forEach((firstTransfer) => {
    if (firstTransfer === normalizedSource || firstTransfer === normalizedDest) {
      return;
    }

    transferPoints.forEach((secondTransfer) => {
      if (
        secondTransfer === normalizedSource ||
        secondTransfer === normalizedDest ||
        secondTransfer === firstTransfer
      ) {
        return;
      }

      const leg1 = getCachedRoutes(source, firstTransfer);
      const leg2 = getCachedRoutes(firstTransfer, secondTransfer);
      const leg3 = getCachedRoutes(secondTransfer, destination);

      leg1.forEach((route1) => {
        leg2.forEach((route2) => {
          leg3.forEach((route3) => {
            const trainA = route1.segments[0].trainId;
            const trainB = route2.segments[0].trainId;
            const trainC = route3.segments[0].trainId;

            if (trainA === trainB || trainB === trainC || trainA === trainC) {
              return;
            }

            const routeKey = `${trainA}|${firstTransfer}|${trainB}|${secondTransfer}|${trainC}`;
            if (seen.has(routeKey)) return;
            seen.add(routeKey);

            routes.push({
              trainId: `${trainA} → ${trainB} → ${trainC}`,
              isDirect: false,
              totalFare: route1.totalFare + route2.totalFare + route3.totalFare,
              segments: [...route1.segments, ...route2.segments, ...route3.segments],
              transferStation: `${firstTransfer}, ${secondTransfer}`,
            });
          });
        });
      });
    });
  });

  return routes;
};

exports.getStations = (req, res) => {
  try {
    const stations = getAllStations();
    console.log(`📍 Total stations found: ${stations.length}`);
    console.log("Sample:", stations.slice(0, 5));
    res.json({ stations });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch stations" });
  }
};

exports.searchRoutes = (req, res) => {
  try {
    const { source, destination } = req.body;

    console.log("🔍 Route search:", source, "→", destination);

    if (!source || !destination) {
      return res.status(400).json({ error: "Source and destination required" });
    }

    // Direct routes first
    let routes = findDirectRoutes(source, destination);

    // If no direct, try transfers
    if (routes.length === 0) {
      console.log("No direct routes, trying transfers...");
      routes = findTransferRoutes(source, destination);
    }

    // If still no results, try 2-transfer paths
    if (routes.length === 0) {
      console.log("No 1-transfer routes, trying 2-transfer routes...");
      routes = findTwoTransferRoutes(source, destination);
    }

    // Sort by fare
    routes.sort((a, b) => {
      if (a.totalFare !== b.totalFare) return a.totalFare - b.totalFare;
      const aDeparture = a.segments?.[0]?.departureTime || "99:99";
      const bDeparture = b.segments?.[0]?.departureTime || "99:99";
      return aDeparture.localeCompare(bDeparture);
    });

    console.log(`✅ Final results: ${routes.length} routes found`);

    if (routes.length === 0) {
      const stations = getAllStations();
      const reverseRoutes = findDirectRoutes(destination, source);
      const directionHint =
        reverseRoutes.length > 0
          ? `Trains exist in reverse direction (${destination} → ${source}). Try swapping source and destination.`
          : null;

      res.json({
        routes: [],
        message:
          "No routes found. Try exact station names from the list below:",
        sampleStations: stations.slice(0, 15),
        directionHint,
      });
    } else {
      res.json({ routes });
    }
  } catch (error) {
    console.error("❌ Search error:", error);
    res.status(500).json({ error: error.message });
  }
};
