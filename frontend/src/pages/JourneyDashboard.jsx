import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Journey = () => {
  const [stations, setStations] = useState([]);
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [sourceDropdown, setSourceDropdown] = useState(false);
  const [destDropdown, setDestDropdown] = useState(false);
  const [filteredSourceStations, setFilteredSourceStations] = useState([]);
  const [filteredDestStations, setFilteredDestStations] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchMessage, setSearchMessage] = useState("");

  // Fetch all unique stations on component mount
  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/journey/stations",
      );
      const data = await response.json();
      setStations(data.stations);
    } catch (err) {
      console.error("Error fetching stations:", err);
    }
  };

  // Filter source stations based on input
  useEffect(() => {
    if (source.trim()) {
      const filtered = stations.filter((station) =>
        station.toLowerCase().includes(source.toLowerCase()),
      );
      setFilteredSourceStations(filtered);
    } else {
      setFilteredSourceStations([]);
    }
  }, [source, stations]);

  // Filter destination stations based on input
  useEffect(() => {
    if (destination.trim()) {
      const filtered = stations.filter((station) =>
        station.toLowerCase().includes(destination.toLowerCase()),
      );
      setFilteredDestStations(filtered);
    } else {
      setFilteredDestStations([]);
    }
  }, [destination, stations]);

  const handleSourceChange = (e) => {
    setSource(e.target.value);
    setSourceDropdown(true);
    setError("");
  };

  const handleDestChange = (e) => {
    setDestination(e.target.value);
    setDestDropdown(true);
    setError("");
  };

  const selectSource = (station) => {
    setSource(station);
    setSourceDropdown(false);
  };

  const selectDestination = (station) => {
    setDestination(station);
    setDestDropdown(false);
  };

  const searchRoutes = async () => {
    if (!source.trim() || !destination.trim()) {
      setError("Please enter both source and destination");
      return;
    }

    setLoading(true);
    setError("");
    setSearchMessage("");
    setRoutes([]);

    try {
      const response = await fetch("http://localhost:5000/api/journey/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source: source.trim(),
          destination: destination.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to find routes");
      }

      setRoutes(data.routes || []);
      if (data.message) {
        setSearchMessage(data.message);
      }
      if (data.directionHint) {
        setSearchMessage((prev) =>
          prev ? `${prev} ${data.directionHint}` : data.directionHint,
        );
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const swapStations = () => {
    const temp = source;
    setSource(destination);
    setDestination(temp);
  };

  const formatTime = (time) => {
    if (
      !time ||
      time === "--" ||
      time === "NOT ON" ||
      time.includes("SUN") ||
      time.includes("AC")
    ) {
      return time;
    }
    return time;
  };

  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime || startTime === "--" || endTime === "--")
      return "--";

    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);

    let totalMinutes = endHour * 60 + endMin - (startHour * 60 + startMin);

    // Handle overnight journeys
    if (totalMinutes < 0) {
      totalMinutes += 24 * 60;
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🚆 Mumbai Local Train Journey Planner
          </h1>
          <p className="text-gray-600">
            Find the best routes with timings and fares
          </p>
        </motion.div>

        {/* Search Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-6 mb-6"
        >
          <div className="space-y-4">
            {/* Source Input */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From (Source)
              </label>
              <input
                type="text"
                value={source}
                onChange={handleSourceChange}
                onFocus={() => setSourceDropdown(true)}
                placeholder="Enter source station..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />

              {/* Source Dropdown */}
              <AnimatePresence>
                {sourceDropdown && filteredSourceStations.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                  >
                    {filteredSourceStations.map((station, idx) => (
                      <div
                        key={idx}
                        onClick={() => selectSource(station)}
                        className="px-4 py-3 hover:bg-blue-50 cursor-pointer transition border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center">
                          <span className="text-blue-500 mr-2">📍</span>
                          <span className="text-gray-800">{station}</span>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <button
                onClick={swapStations}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
              >
                <svg
                  className="w-6 h-6 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                  />
                </svg>
              </button>
            </div>

            {/* Destination Input */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To (Destination)
              </label>
              <input
                type="text"
                value={destination}
                onChange={handleDestChange}
                onFocus={() => setDestDropdown(true)}
                placeholder="Enter destination station..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
              />

              {/* Destination Dropdown */}
              <AnimatePresence>
                {destDropdown && filteredDestStations.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                  >
                    {filteredDestStations.map((station, idx) => (
                      <div
                        key={idx}
                        onClick={() => selectDestination(station)}
                        className="px-4 py-3 hover:bg-purple-50 cursor-pointer transition border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center">
                          <span className="text-purple-500 mr-2">📍</span>
                          <span className="text-gray-800">{station}</span>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Search Button */}
            <button
              onClick={searchRoutes}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Searching..." : "Search Trains"}
            </button>
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6"
          >
            {error}
          </motion.div>
        )}

        {/* Results */}
        <AnimatePresence>
          {routes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Available Routes ({routes.length})
              </h2>

              {routes.map((route, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition"
                >
                  {/* Route Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {route.isDirect
                          ? "🚄 Direct Train"
                          : "🔄 Train with Change"}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {route.segments.length} segment
                        {route.segments.length > 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        ₹{route.totalFare}
                      </div>
                      <div className="text-sm text-gray-500">
                        {calculateDuration(
                          route.segments[0].departureTime,
                          route.segments[route.segments.length - 1].arrivalTime,
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Route Segments */}
                  {route.segments.map((segment, segIdx) => (
                    <div key={segIdx} className="mb-4 last:mb-0">
                      {segIdx > 0 && (
                        <div className="flex items-center my-3">
                          <div className="flex-1 border-t-2 border-dashed border-yellow-400"></div>
                          <span className="px-3 text-sm font-medium text-yellow-600 bg-yellow-50 rounded-full">
                            Change train at {segment.fromStation}
                          </span>
                          <div className="flex-1 border-t-2 border-dashed border-yellow-400"></div>
                        </div>
                      )}

                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-blue-600">
                            Train: {segment.trainId}
                          </span>
                          <span className="text-sm text-gray-500">
                            ₹{segment.fare}
                          </span>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="flex-1">
                            <div className="text-lg font-bold text-gray-800">
                              {formatTime(segment.departureTime)}
                            </div>
                            <div className="text-sm text-gray-600">
                              {segment.fromStation}
                            </div>
                          </div>

                          <div className="flex-1 flex items-center justify-center">
                            <div className="flex items-center space-x-2 text-gray-400">
                              <div className="h-px flex-1 bg-gray-300"></div>
                              <span className="text-xs">
                                {segment.stopsCount} stops
                              </span>
                              <div className="h-px flex-1 bg-gray-300"></div>
                            </div>
                          </div>

                          <div className="flex-1 text-right">
                            <div className="text-lg font-bold text-gray-800">
                              {formatTime(segment.arrivalTime)}
                            </div>
                            <div className="text-sm text-gray-600">
                              {segment.toStation}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* No Results */}
        {!loading && routes.length === 0 && source && destination && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-white rounded-xl shadow-lg"
          >
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No Routes Found
            </h3>
            <p className="text-gray-500">
              {searchMessage || "Try different stations or check spelling"}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Journey;
