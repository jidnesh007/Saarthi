import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import JourneyDashboard from './pages/JourneyDashboard';
import CrowdDashboard   from './pages/CrowdDashboard';
import ProfileSetup     from './components/ProfileSetup';

/* ─── Views ─────────────────────────────────────────────────── */
// 'home'      → landing / selector
// 'journey'   → existing JourneyDashboard (travel planner)
// 'crowd'     → new CrowdDashboard (map + chat + NLP alerts)
// 'profile'   → existing ProfileSetup

function App() {
  const [view, setView] = useState('home');

  return (
    <div className="min-h-screen bg-[#07090f] selection:bg-blue-900">
      <AnimatePresence mode="wait">

        {/* ── Home / Selector ─────────────────────────────── */}
        {view === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
          >
            {/* Animated background blobs */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px]
                              rounded-full bg-blue-500/10 blur-[120px] animate-pulse" />
              <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px]
                              rounded-full bg-violet-500/10 blur-[120px] animate-pulse"
                   style={{ animationDelay: "1s" }} />
            </div>

            {/* Logo */}
            <motion.div
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0,   opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              className="mb-10 text-center"
            >
              <div className="w-20 h-20 mx-auto rounded-3xl
                              bg-gradient-to-br from-blue-500 to-violet-600
                              flex items-center justify-center text-4xl
                              shadow-[0_16px_48px_rgba(99,102,241,0.45)] mb-5">
                🚆
              </div>
              <h1 className="text-5xl font-black text-white tracking-tight mb-2">
                SAARTHI
              </h1>
              <p className="text-[#8b9dcc] text-base font-medium">
                Smart Urban Commute Intelligence Platform
              </p>
            </motion.div>

            {/* ── Card Grid ─────────────────────────────────── */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0,  opacity: 1 }}
              transition={{ delay: 0.25, type: "spring", stiffness: 180 }}
              className="w-full max-w-md space-y-4"
            >

              {/* Journey / Travel button */}
              <motion.button
                id="journey-dashboard-btn"
                onClick={() => setView('journey')}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full group relative overflow-hidden rounded-3xl p-px
                           bg-gradient-to-r from-blue-500 to-violet-600
                           shadow-[0_8px_32px_rgba(99,102,241,0.35)]
                           hover:shadow-[0_12px_48px_rgba(99,102,241,0.55)]
                           transition-shadow"
              >
                <div className="w-full rounded-[calc(1.5rem-1px)] bg-[#0d1117]
                                hover:bg-[#0f1420] transition-colors px-6 py-5
                                flex items-center gap-5 text-left">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600
                                  flex items-center justify-center text-2xl flex-shrink-0
                                  group-hover:scale-110 transition-transform shadow-lg">
                    🗺️
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg leading-tight">
                      Journey Dashboard
                    </p>
                    <p className="text-[#8b9dcc] text-sm mt-0.5">
                      Plan routes · Live crowd levels · Fares
                    </p>
                  </div>
                  <span className="ml-auto text-white/20 group-hover:text-white/60
                                   text-2xl transition-colors">›</span>
                </div>
              </motion.button>

              {/* Crowd Intelligence button */}
              <motion.button
                id="crowd-dashboard-btn"
                onClick={() => setView('crowd')}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full group relative overflow-hidden rounded-3xl p-px
                           bg-gradient-to-r from-rose-500 to-orange-500
                           shadow-[0_8px_32px_rgba(239,68,68,0.25)]
                           hover:shadow-[0_12px_48px_rgba(239,68,68,0.45)]
                           transition-shadow"
              >
                <div className="w-full rounded-[calc(1.5rem-1px)] bg-[#0d1117]
                                hover:bg-[#14100d] transition-colors px-6 py-5
                                flex items-center gap-5 text-left">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500
                                  flex items-center justify-center text-2xl flex-shrink-0
                                  group-hover:scale-110 transition-transform shadow-lg">
                    🔴
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg leading-tight">
                      Crowd Intelligence
                    </p>
                    <p className="text-[#8b9dcc] text-sm mt-0.5">
                      NLP alerts · Live heatmap · Station reports
                    </p>
                  </div>
                  <span className="ml-auto text-white/20 group-hover:text-white/60
                                   text-2xl transition-colors">›</span>
                </div>
              </motion.button>

            </motion.div>

            {/* Footer */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="absolute bottom-6 text-white/20 text-xs tracking-wide"
            >
              Mumbai Local · NLP Powered · Real-time Intelligence
            </motion.p>
          </motion.div>
        )}

        {/* ── Journey Dashboard ─────────────────────────────── */}
        {view === 'journey' && (
          <motion.div
            key="journey"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35 }}
            className="relative"
          >
            <JourneyDashboard />
            {/* Back button */}
            <button
              id="journey-back-btn"
              onClick={() => setView('home')}
              className="fixed top-4 left-4 z-[2000] flex items-center gap-2 px-4 py-2
                         bg-white/10 hover:bg-white/20 backdrop-blur border border-white/15
                         text-white text-sm font-medium rounded-xl transition-all shadow-lg"
            >
              ← Back
            </button>
          </motion.div>
        )}

        {/* ── Crowd Dashboard ───────────────────────────────── */}
        {view === 'crowd' && (
          <motion.div
            key="crowd"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35 }}
          >
            <CrowdDashboard onBack={() => setView('journey')} />
            {/* Back to home */}
            <button
              id="crowd-back-btn"
              onClick={() => setView('home')}
              className="fixed top-[60px] left-5 z-[2000] flex items-center gap-2 px-3 py-1.5
                         bg-white/8 hover:bg-white/15 backdrop-blur border border-white/10
                         text-white/60 hover:text-white text-xs font-medium rounded-xl
                         transition-all"
            >
              ← Home
            </button>
          </motion.div>
        )}

        {/* ── Profile Setup ──────────────────────────────────── */}
        {view === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ProfileSetup onComplete={() => setView('home')} />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

export default App;