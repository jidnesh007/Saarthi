import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, MapPin, Users, TrendingUp, AlertTriangle,
  CheckCircle, RefreshCw, ChevronDown
} from "lucide-react";

const API = "http://localhost:5000/api/crowd";

const CROWD_CONFIG = {
  LOW:    { color: "#22c55e", bg: "rgba(34,197,94,0.12)",  border: "#22c55e", label: "Low Crowd",    emoji: "✅", bar: "w-1/4"  },
  MEDIUM: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "#f59e0b", label: "Moderate",     emoji: "⚠️", bar: "w-2/4"  },
  HIGH:   { color: "#ef4444", bg: "rgba(239,68,68,0.12)",  border: "#ef4444", label: "High Crowd",   emoji: "🚨", bar: "w-full" },
};

export default function CrowdTimeline() {
  const [stations,       setStations]       = useState([]);
  const [selectedStation, setSelectedStation] = useState("dadar");
  const [selectedTime,   setSelectedTime]   = useState("");
  const [dayType,        setDayType]        = useState("weekday");
  const [prediction,     setPrediction]     = useState(null);
  const [timeline,       setTimeline]       = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [autoTime,       setAutoTime]       = useState(true);

  // Initialise time & day on mount
  useEffect(() => {
    const now  = new Date();
    const hh   = String(now.getHours()).padStart(2, "0");
    const mm   = now.getMinutes() < 30 ? "00" : "30";
    setSelectedTime(`${hh}:${mm}`);
    setDayType(now.getDay() === 0 || now.getDay() === 6 ? "weekend" : "weekday");
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      const r = await fetch(`${API}/stations`);
      const d = await r.json();
      if (d.success) setStations(d.stations);
    } catch (e) { /* silent */ }
  };

  const fetchPrediction = async () => {
    setLoading(true);
    try {
      const timeParam = autoTime ? "" : `&time=${selectedTime}`;
      const [predR, tlR] = await Promise.all([
        fetch(`${API}/predict?station=${selectedStation}&day=${dayType}${timeParam}`),
        fetch(`${API}/timeline?station=${selectedStation}&day=${dayType}`),
      ]);
      const pred = await predR.json();
      const tl   = await tlR.json();
      if (pred.success) setPrediction(pred);
      if (tl.success)   setTimeline(tl.timeline);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on mount and when selections change
  useEffect(() => { fetchPrediction(); }, [selectedStation, dayType]);

  const cfg = prediction ? CROWD_CONFIG[prediction.crowd] : null;

  // Build time options every 30 min from 05:00 to 22:30
  const timeOptions = [];
  for (let h = 5; h <= 22; h++) {
    for (const m of ["00", "30"]) {
      timeOptions.push(`${String(h).padStart(2, "0")}:${m}`);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1117] text-white font-sans p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            🚉 Crowd Predictor
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Select a station &amp; time to see predicted crowd levels
          </p>
        </div>

        {/* ── Controls ── */}
        <div className="bg-[#1a1d27] rounded-2xl p-5 border border-white/10 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            {/* Station picker */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <MapPin size={12} /> Station
              </label>
              <div className="relative">
                <select
                  value={selectedStation}
                  onChange={(e) => setSelectedStation(e.target.value)}
                  className="w-full bg-[#0f1117] border border-white/15 rounded-xl px-4 py-3 text-white text-sm appearance-none focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {stations.map((s) => (
                    <option key={s.slug} value={s.slug}>{s.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Time picker */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Clock size={12} /> Time
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <select
                    value={autoTime ? "auto" : selectedTime}
                    onChange={(e) => {
                      if (e.target.value === "auto") { setAutoTime(true); }
                      else { setAutoTime(false); setSelectedTime(e.target.value); }
                    }}
                    className="w-full bg-[#0f1117] border border-white/15 rounded-xl px-4 py-3 text-white text-sm appearance-none focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="auto">⏱ Now (auto)</option>
                    {timeOptions.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Day type */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <TrendingUp size={12} /> Day Type
              </label>
              <div className="flex gap-2 h-[46px]">
                {["weekday", "weekend"].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDayType(d)}
                    className={`flex-1 rounded-xl text-sm font-bold transition-all border ${
                      dayType === d
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-[#0f1117] border-white/15 text-slate-400 hover:border-blue-500"
                    }`}
                  >
                    {d === "weekday" ? "Weekday" : "Weekend"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={fetchPrediction}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            {loading ? "Checking..." : "Check Crowd"}
          </button>
        </div>

        {/* ── Prediction Result ── */}
        <AnimatePresence>
          {prediction && cfg && (
            <motion.div
              key={prediction.time + prediction.crowd}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl p-6 border-2"
              style={{ background: cfg.bg, borderColor: cfg.border }}
            >
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="text-6xl">{cfg.emoji}</div>
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: cfg.color }}>
                    {prediction.station} · {prediction.time} · {prediction.day}
                  </p>
                  <h2 className="text-4xl font-black text-white mb-2">{cfg.label}</h2>
                  <p className="text-slate-300 text-sm">{prediction.advice}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-400 font-bold uppercase mb-1">Crowd Level</p>
                  <div className="w-24 h-24 rounded-full border-4 flex items-center justify-center"
                    style={{ borderColor: cfg.color }}>
                    <span className="text-2xl font-black" style={{ color: cfg.color }}>
                      {prediction.crowd}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Full Day Timeline ── */}
        {timeline.length > 0 && (
          <div className="bg-[#1a1d27] rounded-2xl p-5 border border-white/10">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <TrendingUp size={14} /> Full Day Timeline
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {timeline.map((slot) => {
                const c   = CROWD_CONFIG[slot.crowd];
                const isNow = prediction && slot.time === prediction.time;
                return (
                  <motion.div
                    key={slot.time}
                    whileHover={{ scale: 1.04 }}
                    onClick={() => {
                      setAutoTime(false);
                      setSelectedTime(slot.time);
                      setPrediction({ ...prediction, time: slot.time, crowd: slot.crowd, advice: slot.advice });
                    }}
                    className={`rounded-xl p-3 cursor-pointer border transition-all ${
                      isNow ? "ring-2 ring-blue-500" : ""
                    }`}
                    style={{
                      background: c.bg,
                      borderColor: isNow ? "#3b82f6" : c.border + "55",
                    }}
                  >
                    <p className="text-xs font-black text-slate-300">{slot.time}</p>
                    <p className="text-sm font-extrabold mt-1" style={{ color: c.color }}>
                      {slot.crowd}
                    </p>
                    <div className="w-full h-1 rounded-full bg-white/10 mt-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: slot.crowd === "HIGH" ? "100%" : slot.crowd === "MEDIUM" ? "55%" : "25%",
                          background: c.color,
                        }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
