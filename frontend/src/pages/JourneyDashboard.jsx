import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bus, 
  Train, 
  Car, 
  Navigation, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  Info,
  MapPin,
  ArrowRight,
  Bell,
  X,
  Users,
  Radio, 
} from 'lucide-react';

// Import your SmartAlerts component
import SmartAlerts from '../components/SmartAlerts'; 

const JourneyDashboard = () => {
  const [isCommunityOpen, setIsCommunityOpen] = useState(false);
  const [isSmartAlertsOpen, setIsSmartAlertsOpen] = useState(false);

  const options = [
    { title: "Low Cost", transport: "Bus + Train", cost: "₹40–₹60", time: "90 min", comfort: "Low", crowd: "High", gradient: "from-orange-500 to-red-600", desc: "Cheapest but crowded and tiring" },
    { title: "Balanced Option", transport: "Train + Auto", cost: "₹80–₹120", time: "75 min", comfort: "Medium", crowd: "Medium", gradient: "from-blue-600 to-indigo-700", recommended: true, desc: "Best balance of time and comfort" },
    { title: "High Comfort", transport: "Cab", cost: "₹400–₹600", time: "60 min", comfort: "High", crowd: "Low", gradient: "from-emerald-500 to-teal-600", desc: "Fastest and most comfortable but expensive" }
  ];

  const communityAlerts = [
    { id: 1, user: "Rahul M.", text: "⚠️ Dadar–Panvel local running slow.", side: "left", type: "delay" },
    { id: 2, user: "SAARTHI", text: "🚦 Traffic heavy at Vashi bridge.", side: "right", type: "warning" }
  ];

  const containerVars = { animate: { transition: { staggerChildren: 0.1 } } };
  const itemVars = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 selection:bg-blue-100">
      
      {/* ================= MODALS & OVERLAYS ================= */}
      <AnimatePresence>
        {/* 1. Community Hub Modal (WhatsApp Style) */}
        {isCommunityOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCommunityOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-xl h-[75vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
              <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20"><Users size={24} /></div>
                  <h2 className="text-2xl font-black tracking-tight">Community Hub</h2>
                </div>
                <button onClick={() => setIsCommunityOpen(false)} className="bg-white/10 p-3 rounded-full hover:bg-white/20"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/50">
                {communityAlerts.map((alert) => (
                  <div key={alert.id} className={`flex ${alert.side === 'right' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-[2rem] p-6 shadow-sm border ${alert.type === 'delay' ? 'bg-red-50 border-red-100' : 'bg-white border-slate-200'}`}>
                      <p className="text-sm font-bold text-slate-800">{alert.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* 2. Smart Alerts Center (Intelligence Layer) - CENTERED MODAL */}
        {isSmartAlertsOpen && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 md:p-10">
            {/* Background Blur */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsSmartAlertsOpen(false)} 
              className="absolute inset-0 bg-blue-900/20 backdrop-blur-xl" 
            />
            
            {/* Centered Intelligence Card */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 50 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.8, opacity: 0, y: 50 }} 
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-5xl h-[85vh] bg-white/90 rounded-[3.5rem] shadow-[0_32px_64px_-15px_rgba(0,0,0,0.3)] border border-white flex flex-col overflow-hidden"
            >
              {/* Floating Close Button */}
              <button 
                onClick={() => setIsSmartAlertsOpen(false)} 
                className="absolute top-8 right-8 z-[260] p-4 bg-slate-900 text-white rounded-full shadow-2xl hover:bg-red-600 hover:scale-110 transition-all duration-300"
              >
                <X size={24} />
              </button>

              {/* Internal Component Wrapper */}
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                <SmartAlerts />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg"><Navigation className="text-white fill-current" size={20} /></div>
            <div><h1 className="text-2xl font-black tracking-tighter">SAARTHI</h1><p className="text-[10px] uppercase font-bold text-blue-600 leading-none">Urban Companion</p></div>
          </div>
          <div className="flex items-center gap-3">
            {/* Smart Alerts Icon */}
            <button 
              onClick={() => setIsSmartAlertsOpen(true)} 
              className="p-3 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-2xl transition-all shadow-sm group"
            >
              <Radio size={20} className="group-hover:animate-pulse" />
            </button>

            {/* Community Icon */}
            <button 
              onClick={() => setIsCommunityOpen(true)} 
              className="p-3 bg-slate-100 hover:bg-blue-600 hover:text-white rounded-2xl transition-all shadow-sm relative"
            >
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-blue-600 font-bold text-xs shadow-sm">JD</div>
          </div>
        </div>
      </nav>

      {/* MAIN DASHBOARD CONTENT */}
      <motion.main variants={containerVars} initial="initial" animate="animate" className="max-w-7xl mx-auto p-6 lg:p-12 space-y-12">
        
        {/* HERO SECTION */}
        <motion.section variants={itemVars} className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2rem] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
          <div className="relative bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 p-8 lg:p-12">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-10">
              <div className="flex items-center justify-center gap-6 w-full lg:w-auto">
                <div className="text-center lg:text-left"><span className="text-[10px] font-black uppercase text-blue-500">Source</span><h2 className="text-4xl font-black text-slate-800">Dadar</h2></div>
                <div className="flex-1 lg:w-48 flex items-center gap-2"><div className="h-[2px] flex-1 bg-slate-200"></div><ArrowRight className="text-blue-600" size={20} /><div className="h-[2px] flex-1 bg-slate-200"></div></div>
                <div className="text-center lg:text-right"><span className="text-[10px] font-black uppercase text-blue-500">Destination</span><h2 className="text-4xl font-black text-slate-800">Panvel</h2></div>
              </div>
              <button className="w-full lg:w-auto bg-slate-900 hover:bg-blue-600 text-white font-bold py-5 px-12 rounded-2xl transition-all shadow-xl active:scale-95 flex items-center gap-3 justify-center">Check Live Journey <ChevronRight size={20}/></button>
            </div>
          </div>
        </motion.section>

        {/* OPTIONS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {options.map((opt, idx) => (
            <motion.div variants={itemVars} whileHover={{ y: -10 }} key={idx} className={`relative bg-white rounded-[2rem] p-8 border ${opt.recommended ? 'border-blue-600 ring-8 ring-blue-50' : 'border-slate-100'} shadow-xl flex flex-col`}>
              {opt.recommended && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black py-1.5 px-6 rounded-full uppercase ring-4 ring-white shadow-lg tracking-widest">Recommended</div>}
              <div className={`w-14 h-14 rounded-2xl mb-6 flex items-center justify-center bg-gradient-to-br ${opt.gradient} text-white shadow-lg shadow-blue-200`}>{idx === 0 ? <Bus size={28}/> : idx === 1 ? <Train size={28}/> : <Car size={28}/>}</div>
              <h3 className="text-2xl font-black text-slate-800 mb-1">{opt.title}</h3>
              <p className="text-slate-400 font-bold text-sm mb-8 uppercase tracking-widest"><Info size={14} className="inline mr-1 opacity-50"/> {opt.transport}</p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Est. Fare</p><p className="font-black text-slate-800">{opt.cost}</p></div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Total Time</p><p className="font-black text-slate-800">{opt.time}</p></div>
              </div>
              <div className="space-y-3 mb-8">
                 <div className="flex justify-between text-[10px] font-black uppercase tracking-widest"><span className="text-slate-400">Comfort</span><span className={opt.comfort === 'High' ? 'text-emerald-500' : 'text-blue-500'}>{opt.comfort}</span></div>
                 <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full bg-gradient-to-r ${opt.gradient} ${opt.comfort === 'High' ? 'w-full' : 'w-1/2'}`}></div></div>
              </div>
              <p className="text-sm font-medium text-slate-500 italic mt-auto border-t border-slate-50 pt-6">"{opt.desc}"</p>
            </motion.div>
          ))}
        </div>

        {/* TIMELINE SECTION */}
        <motion.section variants={itemVars} className="bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden text-white relative border border-white/5">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 blur-[120px]"></div>
          <div className="p-8 lg:p-16 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6">
              <div><h2 className="text-4xl font-black tracking-tight">Live Journey Track</h2><p className="text-slate-400 font-medium">Dadar → Panvel Junction</p></div>
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 px-8 py-5 rounded-[2rem] shadow-2xl text-center"><p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Live ETA</p><p className="text-3xl font-black">75m</p></div>
            </div>
            <div className="relative border-l-2 border-white/10 ml-8 space-y-12 pb-6">
              {[
                { label: "Start at Dadar", sub: "Platform 4", icon: <MapPin />, status: "active" },
                { label: "Dadar to Kurla", sub: "Central Line", icon: <Train />, isPrimary: true },
                { label: "Kurla to Panvel", sub: "Harbour Line", icon: <Train />, isPrimary: true },
                { label: "Arrive at Panvel", sub: "Terminal 2", icon: <CheckCircle2 />, status: "end" },
              ].map((step, i) => (
                <div key={i} className="relative pl-14 group">
                  <div className={`absolute -left-[17px] top-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 z-20 ${step.status === 'end' ? 'bg-emerald-500 scale-125 shadow-lg shadow-emerald-500/20' : step.status === 'active' ? 'bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'bg-slate-800 border border-white/20'}`}>
                    {step.status === 'end' ? <CheckCircle2 size={16} /> : step.status === 'active' ? <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" /> : <div className="w-2 h-2 bg-white/40 rounded-full" />}
                  </div>
                  <div className={`transition-all duration-300 ${step.isPrimary ? 'bg-white/5 border border-white/10 p-6 rounded-3xl' : ''}`}>
                    <h4 className={`text-2xl font-black ${step.status === 'end' ? 'text-emerald-400' : 'text-white'}`}>{step.label}</h4>
                    <p className="text-slate-400 font-bold text-base mt-1 uppercase tracking-widest text-xs">{step.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>
      </motion.main>
    </div>
  );
};

export default JourneyDashboard;