import React, { useState } from 'react';
import { motion } from 'framer-motion'; // Added missing import
import JourneyDashboard from './pages/JourneyDashboard';
import ProfileSetup from './components/ProfileSetup';

/**
 * SAARTHI - Unified Demo Entry Point
 */
function App() {
  // Demo State: 'profile' shows onboarding, 'dashboard' shows the main app
  // Set this to 'profile' if you want to start the demo from the very beginning
  const [currentView, setCurrentView] = useState('dashboard');

  return (
    <div className="min-h-screen bg-[#F8FAFC] selection:bg-blue-100">
      
      {/* DASHBOARD VIEW 
          Includes Integrated Community Hub & Smart Alerts
      */}
      {currentView === 'dashboard' && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <JourneyDashboard />
          
          {/* Demo Toggle for Judges */}
          <button 
            onClick={() => setCurrentView('profile')}
            className="fixed bottom-6 right-6 bg-white/80 backdrop-blur-md border border-slate-200 text-slate-400 text-[10px] font-black uppercase px-4 py-2 rounded-full shadow-lg hover:text-blue-600 transition-all z-[200]"
          >
            Restart Demo (Profile Setup)
          </button>
        </motion.div>
      )}

      {/* PROFILE SETUP VIEW 
          Onboarding Experience
      */}
      {currentView === 'profile' && (
        <ProfileSetup onComplete={() => setCurrentView('dashboard')} />
      )}

    </div>
  );
}

export default App;