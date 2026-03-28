import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
import { motion, AnimatePresence } from "framer-motion";
import "leaflet/dist/leaflet.css";

// ─── API Base ──────────────────────────────────────────────────
const API = "http://localhost:5001";
const POLL_MS = 5000;

// ─── Colour helpers ────────────────────────────────────────────
const levelStyle = {
  LOW:    { color: "#22c55e", glow: "0 0 12px #22c55e88", fill: "#22c55e" },
  MEDIUM: { color: "#f59e0b", glow: "0 0 16px #f59e0b88", fill: "#f59e0b" },
  HIGH:   { color: "#ef4444", glow: "0 0 24px #ef444499", fill: "#ef4444" },
};

const intensityRadius = (intensity) => Math.max(6, Math.min(28, 6 + intensity * 0.22));

// ─── Map auto-fit on first load ────────────────────────────────
function MapController({ stations }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (!fitted.current && stations.length > 0) {
      map.setView([19.076, 72.877], 11);
      fitted.current = true;
    }
  }, [stations, map]);
  return null;
}

// ─── Main Component ───────────────────────────────────────────
const CrowdDashboard = ({ onBack }) => {
  // Map / alerts / stats
  const [stations, setStations]     = useState([]);
  const [alerts, setAlerts]         = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

  // Chat state
  const [chatOpen, setChatOpen]     = useState(false);
  const [messages, setMessages]     = useState([]);
  const [inputText, setInputText]   = useState("");
  const [sending, setSending]       = useState(false);
  const chatEndRef                  = useRef(null);
  const inputRef                    = useRef(null);

  // ── Polling ────────────────────────────────────────────────
  const fetchHeatmap = useCallback(async () => {
    try {
      const r = await fetch(`${API}/heatmap`);
      const d = await r.json();
      setStations(d.stations || []);
    } catch { /* silent */ }
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      const r = await fetch(`${API}/alerts`);
      const d = await r.json();
      setAlerts(d.alerts || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchHeatmap();
    fetchAlerts();
    const id = setInterval(() => { fetchHeatmap(); fetchAlerts(); }, POLL_MS);
    return () => clearInterval(id);
  }, [fetchHeatmap, fetchAlerts]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatOpen]);

  // Focus input when chat opens
  useEffect(() => {
    if (chatOpen) setTimeout(() => inputRef.current?.focus(), 120);
  }, [chatOpen]);

  // ── Send Message ───────────────────────────────────────────
  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || sending) return;
    setSending(true);
    setInputText("");

    const userMsg = {
      id: Date.now(),
      role: "user",
      text,
      ts: new Date().toLocaleTimeString(),
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const r  = await fetch(`${API}/chat`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ text }),
      });
      const d = await r.json();

      const botMsg = {
        id:         Date.now() + 1,
        role:       "bot",
        prediction: d.prediction,
        station:    d.station,
        confidence: d.confidence,
        alert:      d.alert,
        message:    d.message,
        ts:         new Date().toLocaleTimeString(),
      };
      setMessages(prev => [...prev, botMsg]);

      // Immediately refresh data
      fetchHeatmap();
      fetchAlerts();
    } catch {
      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, role: "error", text: "Connection error. Is chatting.py running on port 5001?", ts: new Date().toLocaleTimeString() },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // ── Active alerts (not dismissed) ─────────────────────────
  const activeAlerts = alerts.filter(a => !dismissedAlerts.has(a.station));

  // ─────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#07090f] font-sans">

      {/* ── Top Navigation Bar ─────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-[1000] flex items-center justify-between px-5 py-3
                      bg-[#0d1117]/90 backdrop-blur-md border-b border-white/10">
        {/* Logo + title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600
                          flex items-center justify-center text-white text-lg shadow-lg">
            🚆
          </div>
          <div>
            <p className="text-white font-bold text-base leading-tight tracking-tight">SAARTHI</p>
            <p className="text-[#6b7de4] text-[11px] font-medium tracking-widest uppercase">Crowd Intelligence</p>
          </div>
        </div>

        {/* Centre — alert count pill */}
        <AnimatePresence>
          {activeAlerts.length > 0 && (
            <motion.div
              key="alert-pill"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              className="flex items-center gap-2 bg-red-500/20 border border-red-400/40
                         text-red-300 text-xs font-semibold px-4 py-1.5 rounded-full"
            >
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping inline-block" />
              {activeAlerts.length} Active Alert{activeAlerts.length > 1 ? "s" : ""}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right — Journey button + back */}
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                         bg-gradient-to-r from-blue-600 to-violet-600 text-white
                         hover:from-blue-500 hover:to-violet-500 transition-all shadow-lg
                         hover:shadow-blue-500/30"
            >
              🗺️ Journey Dashboard
            </button>
          )}
        </div>
      </div>

      {/* ── Alert Banners ──────────────────────────────────── */}
      <div className="absolute top-16 left-0 right-0 z-[999] px-4 pt-2 space-y-2 pointer-events-none">
        <AnimatePresence>
          {activeAlerts.slice(0, 3).map(a => (
            <motion.div
              key={a.station}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0,   scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="pointer-events-auto flex items-center justify-between
                         bg-[#1a0505]/90 backdrop-blur border border-red-500/50
                         rounded-xl px-5 py-3 shadow-[0_0_24px_rgba(239,68,68,0.25)]"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">⚠️</span>
                <div>
                  <p className="text-red-300 font-bold text-sm">{a.message}</p>
                  <p className="text-red-400/70 text-xs">
                    {a.crowd_count} reports · {Math.round(a.ratio * 100)}% crowd ratio
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDismissedAlerts(prev => new Set([...prev, a.station]))}
                className="text-red-400/60 hover:text-red-300 text-lg leading-none transition ml-4"
              >
                ×
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Map (full screen) ──────────────────────────────── */}
      <div className="absolute inset-0 z-0 pt-14">
        <MapContainer
          center={[19.076, 72.877]}
          zoom={11}
          zoomControl={false}
          style={{ width: "100%", height: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            className="osm-dark-tiles"
          />
          <MapController stations={stations} />

          {stations.map((st) => {
            const style = levelStyle[st.level] || levelStyle.LOW;
            const radius = intensityRadius(st.intensity);
            return (
              <CircleMarker
                key={st.station}
                center={[st.lat, st.lng]}
                radius={radius}
                pathOptions={{
                  color:       style.color,
                  fillColor:   style.fill,
                  fillOpacity: st.intensity > 0 ? 0.72 : 0.28,
                  weight:      st.alerted ? 2.5 : 1,
                  opacity:     1,
                }}
              >
                <Tooltip
                  direction="top"
                  offset={[0, -radius]}
                  className="crowd-tooltip"
                  permanent={false}
                >
                  <div className="text-white text-xs font-semibold">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span style={{ color: style.color }}>●</span>
                      {st.station}
                      {st.alerted && <span className="text-red-400 ml-1">⚠️</span>}
                    </div>
                    <div className="text-gray-300 font-normal">
                      Level: <span style={{ color: style.color }}>{st.level}</span>
                      {st.intensity > 0 && ` · ${st.intensity}%`}
                    </div>
                  </div>
                </Tooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {/* ── Legend (bottom left) ──────────────────────────── */}
      <div className="absolute bottom-6 left-5 z-[500]
                      bg-[#0d1117]/85 backdrop-blur border border-white/10
                      rounded-2xl px-4 py-3 space-y-2">
        <p className="text-[#8b9dcc] text-[10px] font-bold uppercase tracking-widest mb-2">
          Crowd Level
        </p>
        {Object.entries(levelStyle).map(([lv, s]) => (
          <div key={lv} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: s.color, boxShadow: s.glow }} />
            <span className="text-white/80 text-xs capitalize">
              {lv === "LOW" ? "Normal" : lv === "MEDIUM" ? "Moderate" : "High Crowd"}
            </span>
          </div>
        ))}
        <div className="mt-2 pt-2 border-t border-white/10 text-[10px] text-white/40">
          Updates every 5 s
        </div>
      </div>

      {/* ── Station count badge (top-left under nav) ─────── */}
      <div className="absolute top-[72px] left-5 z-[500]
                      bg-[#0d1117]/85 backdrop-blur border border-white/10
                      rounded-xl px-3 py-2 flex items-center gap-2">
        <span className="text-blue-400 text-lg">🚉</span>
        <div>
          <p className="text-white text-sm font-bold">{stations.length}</p>
          <p className="text-white/40 text-[10px]">Stations tracked</p>
        </div>
      </div>

      {/* ── Chat Floating Button ──────────────────────────── */}
      <motion.button
        id="chat-toggle-btn"
        onClick={() => setChatOpen(o => !o)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-[1100] w-14 h-14 rounded-full
                   bg-gradient-to-br from-blue-500 to-violet-600
                   shadow-[0_8px_32px_rgba(99,102,241,0.55)]
                   flex items-center justify-center text-white text-2xl
                   border border-white/20 hover:shadow-[0_8px_40px_rgba(99,102,241,0.75)]
                   transition-shadow"
        aria-label="Toggle chat"
      >
        <AnimatePresence mode="wait">
          {chatOpen ? (
            <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              ✕
            </motion.span>
          ) : (
            <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              💬
            </motion.span>
          )}
        </AnimatePresence>

        {/* Unread badge */}
        {!chatOpen && messages.filter(m => m.alert).length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full
                           text-white text-[10px] font-bold flex items-center justify-center
                           border-2 border-[#07090f]">
            {messages.filter(m => m.alert).length}
          </span>
        )}
      </motion.button>

      {/* ── Chat Drawer ───────────────────────────────────── */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 280, damping: 25 }}
            className="fixed bottom-24 right-6 z-[1050]
                       w-[340px] max-h-[520px] flex flex-col
                       bg-[#0d1117]/95 backdrop-blur-xl
                       border border-white/10 rounded-3xl
                       shadow-[0_24px_64px_rgba(0,0,0,0.7)]
                       overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3
                            bg-gradient-to-r from-blue-600/20 to-violet-600/20">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600
                              flex items-center justify-center text-lg">🤖</div>
              <div>
                <p className="text-white font-bold text-sm">Crowd Intelligence</p>
                <p className="text-green-400 text-[11px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                  NLP model live
                </p>
              </div>
              <div className="ml-auto text-[10px] text-white/30 text-right">
                <p>Port 5001</p>
                <p>TF-IDF + LR</p>
              </div>
            </div>

            {/* Message List */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin
                            scrollbar-thumb-white/10 scrollbar-track-transparent">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">🚉</div>
                  <p className="text-white/40 text-sm">
                    Report crowd status at any Mumbai local station
                  </p>
                  <p className="text-white/20 text-xs mt-1">
                    e.g. "Dadar is super crowded right now"
                  </p>
                </div>
              )}

              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {msg.role === "user" && (
                    <div className="flex justify-end">
                      <div className="max-w-[80%] bg-gradient-to-br from-blue-600 to-violet-600
                                      text-white text-sm px-4 py-2.5 rounded-2xl rounded-tr-sm
                                      shadow-lg">
                        <p>{msg.text}</p>
                        <p className="text-white/40 text-[10px] mt-1 text-right">{msg.ts}</p>
                      </div>
                    </div>
                  )}

                  {msg.role === "bot" && (
                    <div className="flex justify-start">
                      <div className={`max-w-[85%] text-sm px-4 py-2.5 rounded-2xl rounded-tl-sm shadow
                        ${msg.alert
                          ? "bg-red-500/15 border border-red-500/30 text-red-200"
                          : "bg-white/8 border border-white/10 text-white/80"
                        }`}>
                        {/* Prediction badge */}
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase
                            ${msg.prediction === "CROWD_ALERT"
                              ? "bg-red-500/30 text-red-300"
                              : "bg-green-500/20 text-green-400"
                            }`}>
                            {msg.prediction === "CROWD_ALERT" ? "⚠ CROWD ALERT" : "✓ NORMAL"}
                          </span>
                          <span className="text-white/30 text-[10px]">{msg.confidence}</span>
                        </div>
                        {msg.station && (
                          <p className="text-[11px] text-white/60 mb-1">
                            📍 Station: <span className="text-blue-300 font-medium">{msg.station}</span>
                          </p>
                        )}
                        {msg.message && (
                          <p className="text-red-300 font-semibold text-xs">{msg.message}</p>
                        )}
                        {!msg.station && (
                          <p className="text-white/40 text-[11px] italic">No station recognized</p>
                        )}
                        <p className="text-white/20 text-[10px] mt-1">{msg.ts}</p>
                      </div>
                    </div>
                  )}

                  {msg.role === "error" && (
                    <div className="text-center text-xs text-red-400/70 bg-red-500/10
                                    border border-red-400/20 rounded-xl px-3 py-2">
                      {msg.text}
                    </div>
                  )}
                </motion.div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-3 border-t border-white/10 bg-black/20">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10
                              rounded-2xl px-3 py-2 focus-within:border-blue-500/50 transition-colors">
                <input
                  ref={inputRef}
                  id="crowd-chat-input"
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="e.g. Andheri is very crowded..."
                  disabled={sending}
                  className="flex-1 bg-transparent text-white text-sm placeholder-white/25
                             outline-none disabled:opacity-50"
                />
                <button
                  id="crowd-chat-send-btn"
                  onClick={sendMessage}
                  disabled={!inputText.trim() || sending}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600
                             flex items-center justify-center text-white text-sm
                             disabled:opacity-30 disabled:cursor-not-allowed
                             hover:from-blue-400 hover:to-violet-500 transition-all
                             active:scale-95"
                >
                  {sending ? (
                    <span className="w-3 h-3 border-2 border-white/40 border-t-white
                                     rounded-full animate-spin" />
                  ) : "➤"}
                </button>
              </div>
              <p className="text-white/20 text-[10px] text-center mt-1.5">
                Press Enter to send · Reports update the map live
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline CSS for Leaflet tooltip */}
      <style>{`
        .crowd-tooltip {
          background: rgba(13,17,23,0.92) !important;
          border: 1px solid rgba(255,255,255,0.12) !important;
          border-radius: 12px !important;
          padding: 8px 12px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6) !important;
          color: white;
          font-family: inherit;
        }
        .crowd-tooltip::before { display: none; }
        .leaflet-control-attribution { display: none; }
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.10); border-radius: 4px; }
      `}</style>
    </div>
  );
};

export default CrowdDashboard;
