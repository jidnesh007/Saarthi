import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Crowd config ─────────────────────────────────────────── */
const CROWD = {
  LOW:    { color: "#22c55e", bg: "rgba(34,197,94,0.10)",  emoji: "🟢", label: "Low Crowd"    },
  MEDIUM: { color: "#f59e0b", bg: "rgba(245,158,11,0.10)", emoji: "🟡", label: "Moderate"     },
  HIGH:   { color: "#ef4444", bg: "rgba(239,68,68,0.10)",  emoji: "🔴", label: "High Crowd"   },
};

const ADVICE = {
  LOW:    "Great time to travel — comfortable journey expected.",
  MEDIUM: "Moderate crowd. Arrive a few minutes early.",
  HIGH:   "Peak hours! Expect heavy crowd. Consider alternate timings.",
};

/* Snap HH:MM to nearest dataset slot (30-min grid) */
function snapSlot(t) {
  if (!t || t === "--") return null;
  const [h, m] = t.split(":").map(Number);
  const snappedM = m < 15 ? 0 : m < 45 ? 30 : 0;
  const snappedH = m >= 45 ? (h + 1) % 24 : h;
  return `${String(snappedH).padStart(2, "0")}:${String(snappedM).padStart(2, "0")}`;
}

/* Pick best crowd station slug based on station name string */
function stationToSlug(name) {
  const n = (name || "").toLowerCase();
  if (n.includes("dadar"))    return "dadar";
  if (n.includes("panvel"))   return "panvel";
  if (n.includes("kurla"))    return "kurla";
  if (n.includes("csmt") || n.includes("cst") || n.includes("victoria")) return "csmt";
  if (n.includes("thane"))    return "thane";
  if (n.includes("borivali") || n.includes("borivli")) return "borivali";
  return "dadar"; // generic fallback
}

/* ─── Component ─────────────────────────────────────────────── */
const Journey = () => {
  const [stations,              setStations]              = useState([]);
  const [source,                setSource]                = useState("");
  const [destination,           setDestination]           = useState("");
  const [sourceDropdown,        setSourceDropdown]        = useState(false);
  const [destDropdown,          setDestDropdown]          = useState(false);
  const [filteredSourceStations,setFilteredSourceStations]= useState([]);
  const [filteredDestStations,  setFilteredDestStations]  = useState([]);
  const [routes,                setRoutes]                = useState([]);
  const [crowdMap,              setCrowdMap]              = useState({});   // idx -> crowd info
  const [loading,               setLoading]               = useState(false);
  const [error,                 setError]                 = useState("");
  const [searchMessage,         setSearchMessage]         = useState("");

  useEffect(() => { fetchStations(); }, []);

  const fetchStations = async () => {
    try {
      const r = await fetch("http://localhost:5000/api/journey/stations");
      const d = await r.json();
      setStations(d.stations || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (source.trim()) {
      setFilteredSourceStations(stations.filter(s => s.toLowerCase().includes(source.toLowerCase())));
    } else {
      setFilteredSourceStations([]);
    }
  }, [source, stations]);

  useEffect(() => {
    if (destination.trim()) {
      setFilteredDestStations(stations.filter(s => s.toLowerCase().includes(destination.toLowerCase())));
    } else {
      setFilteredDestStations([]);
    }
  }, [destination, stations]);

  const selectSource      = (s) => { setSource(s);      setSourceDropdown(false); };
  const selectDestination = (s) => { setDestination(s); setDestDropdown(false);   };
  const swapStations      = ()  => { const t = source; setSource(destination); setDestination(t); };

  /* ─── Crowd fetch per route ─────────────────────────────── */
  const fetchCrowdForRoutes = async (fetchedRoutes) => {
    const now     = new Date();
    const dayType = now.getDay() === 0 || now.getDay() === 6 ? "weekend" : "weekday";
    const slug    = stationToSlug(source);

    const results = await Promise.all(
      fetchedRoutes.map(async (route, idx) => {
        const dept = route.segments?.[0]?.departureTime;
        const slot = snapSlot(dept);
        if (!slot) return [idx, null];
        try {
          const r = await fetch(
            `http://localhost:5000/api/crowd/predict?station=${slug}&time=${slot}&day=${dayType}`
          );
          const d = await r.json();
          return [idx, d.success ? d : null];
        } catch {
          return [idx, null];
        }
      })
    );

    const map = {};
    results.forEach(([idx, data]) => { if (data) map[idx] = data; });
    setCrowdMap(map);
  };

  /* ─── Search ────────────────────────────────────────────── */
  const searchRoutes = async () => {
    if (!source.trim() || !destination.trim()) {
      setError("Please enter both source and destination");
      return;
    }
    setLoading(true);
    setError("");
    setSearchMessage("");
    setRoutes([]);
    setCrowdMap({});

    try {
      const r = await fetch("http://localhost:5000/api/journey/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: source.trim(), destination: destination.trim() }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to find routes");

      const fetched = d.routes || [];
      setRoutes(fetched);
      if (d.message)       setSearchMessage(d.message);
      if (d.directionHint) setSearchMessage(p => p ? `${p} ${d.directionHint}` : d.directionHint);

      // Fetch crowd info for all routes in parallel
      if (fetched.length > 0) fetchCrowdForRoutes(fetched);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  /* ─── Helpers ───────────────────────────────────────────── */
  const calculateDuration = (start, end) => {
    if (!start || !end || start === "--" || end === "--") return "--";
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    let mins = eh * 60 + em - (sh * 60 + sm);
    if (mins < 0) mins += 1440;
    const h = Math.floor(mins / 60), m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  /* ─── Render ─────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🚆 Mumbai Local Train Journey Planner</h1>
          <p className="text-gray-600">Find the best routes with live crowd levels, timings & fares</p>
        </motion.div>

        {/* Search Card */}
        <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
          className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="space-y-4">

            {/* Source */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">From (Source)</label>
              <input type="text" value={source}
                onChange={e => { setSource(e.target.value); setSourceDropdown(true); setError(""); }}
                onFocus={() => setSourceDropdown(true)}
                placeholder="Enter source station..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
              <AnimatePresence>
                {sourceDropdown && filteredSourceStations.length > 0 && (
                  <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}
                    className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredSourceStations.map((s, i) => (
                      <div key={i} onClick={() => selectSource(s)}
                        className="px-4 py-3 hover:bg-blue-50 cursor-pointer transition border-b border-gray-100 last:border-b-0 flex items-center">
                        <span className="text-blue-500 mr-2">📍</span><span className="text-gray-800">{s}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Swap */}
            <div className="flex justify-center">
              <button onClick={swapStations} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
            </div>

            {/* Destination */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">To (Destination)</label>
              <input type="text" value={destination}
                onChange={e => { setDestination(e.target.value); setDestDropdown(true); setError(""); }}
                onFocus={() => setDestDropdown(true)}
                placeholder="Enter destination station..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
              />
              <AnimatePresence>
                {destDropdown && filteredDestStations.length > 0 && (
                  <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}
                    className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredDestStations.map((s, i) => (
                      <div key={i} onClick={() => selectDestination(s)}
                        className="px-4 py-3 hover:bg-purple-50 cursor-pointer transition border-b border-gray-100 last:border-b-0 flex items-center">
                        <span className="text-purple-500 mr-2">📍</span><span className="text-gray-800">{s}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Search button */}
            <button onClick={searchRoutes} disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? "Searching..." : "Search Trains 🔍"}
            </button>
          </div>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </motion.div>
        )}

        {/* Results */}
        <AnimatePresence>
          {routes.length > 0 && (
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="space-y-5">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                🛤️ Available Routes ({routes.length})
                {source && destination && (
                  <span className="text-base font-normal text-gray-500 ml-3">{source} → {destination}</span>
                )}
              </h2>

              {routes.map((route, idx) => {
                const crowd  = crowdMap[idx];
                const cfg    = crowd ? CROWD[crowd.crowd] : null;
                const dept   = route.segments?.[0]?.departureTime;
                const arr    = route.segments?.[route.segments.length - 1]?.arrivalTime;
                const dur    = calculateDuration(dept, arr);

                return (
                  <motion.div key={idx}
                    initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ delay: idx * 0.08 }}
                    className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition overflow-hidden">

                    {/* ── Crowd Banner ────────────────────────────────── */}
                    {cfg && (
                      <div className="flex items-center gap-3 px-6 py-3 font-semibold text-sm border-b"
                        style={{ background: cfg.bg, borderColor: cfg.color + "44", color: cfg.color }}>
                        <span className="text-lg">{cfg.emoji}</span>
                        <span className="font-black uppercase tracking-wide">{cfg.label}</span>
                        <span className="font-normal text-gray-600 text-xs">at {crowd.time}</span>
                        <span className="ml-auto text-xs text-gray-500 font-normal">{ADVICE[crowd.crowd]}</span>
                      </div>
                    )}
                    {!cfg && crowdMap[idx] === undefined && routes.length > 0 && (
                      <div className="px-6 py-2 text-xs text-gray-400 border-b border-gray-100 animate-pulse">
                        Loading crowd data…
                      </div>
                    )}

                    {/* ── Route Header ────────────────────────────────── */}
                    <div className="px-6 pt-4 pb-2 flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {route.isDirect ? "🚄 Direct Train" : "🔄 Train with Change"}
                        </h3>
                        <p className="text-sm text-gray-500">{route.segments.length} segment{route.segments.length > 1 ? "s" : ""}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">₹{route.totalFare}</div>
                        <div className="text-sm text-gray-500">{dur}</div>
                      </div>
                    </div>

                    {/* ── Segments ────────────────────────────────────── */}
                    <div className="px-6 pb-5 space-y-3">
                      {route.segments.map((seg, si) => (
                        <div key={si}>
                          {si > 0 && (
                            <div className="flex items-center my-2">
                              <div className="flex-1 border-t-2 border-dashed border-yellow-400" />
                              <span className="px-3 text-xs font-medium text-yellow-600 bg-yellow-50 rounded-full">
                                Change at {seg.fromStation}
                              </span>
                              <div className="flex-1 border-t-2 border-dashed border-yellow-400" />
                            </div>
                          )}

                          <div className="bg-gray-50 rounded-xl p-4">
                            {/* Train ID + fare */}
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                🚂 {seg.trainId}
                              </span>
                              <span className="text-sm font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded">
                                ₹{seg.fare}
                              </span>
                            </div>

                            {/* From → To timeline */}
                            <div className="flex items-center gap-3">
                              {/* Departure */}
                              <div className="text-center min-w-[70px]">
                                <div className="text-xl font-black text-gray-800">{seg.departureTime}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{seg.fromStation}</div>
                              </div>

                              {/* Line */}
                              <div className="flex-1 flex flex-col items-center gap-1">
                                <div className="flex items-center w-full gap-1">
                                  <div className="h-0.5 flex-1 bg-blue-300 rounded" />
                                  <span className="text-[10px] text-gray-400 whitespace-nowrap">{seg.stopsCount} stops</span>
                                  <div className="h-0.5 flex-1 bg-blue-300 rounded" />
                                </div>
                                <div className="text-[10px] text-gray-400">
                                  {calculateDuration(seg.departureTime, seg.arrivalTime)}
                                </div>
                              </div>

                              {/* Arrival */}
                              <div className="text-center min-w-[70px]">
                                <div className="text-xl font-black text-gray-800">{seg.arrivalTime}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{seg.toStation}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* No results */}
        {!loading && routes.length === 0 && source && destination && !error && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
            className="text-center py-12 bg-white rounded-xl shadow-lg">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Routes Found</h3>
            <p className="text-gray-500">{searchMessage || "Try different stations or check spelling"}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Journey;
