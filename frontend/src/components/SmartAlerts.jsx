import React from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  Zap, 
  MapPin, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  Radio,
  ShieldCheck,
  TrafficCone,
  Navigation,
  Activity,
  ChevronRight // <--- Fixed: Added missing icon
} from 'lucide-react';

const SmartAlerts = () => {
  // --- MOCK DATA ARRAY ---
  const mockAlerts = [
    {
      id: 1,
      title: "Heavy Traffic Detected",
      message: "Congestion near Panvel Entry (Road). Consider taking Harbour Line train instead to save 20 mins.",
      location: "Panvel Entry",
      time: "8:50 AM",
      severity: "critical",
      action: "Switch to Railway",
      icon: <TrafficCone className="text-white" size={20} />,
      accent: "bg-red-600"
    },
    {
      id: 2,
      title: "Delayed Service",
      message: "Dadar–Panvel train running 10 mins slow. Suggest leaving 10 minutes later to avoid crowding.",
      location: "Dadar Platform 4",
      time: "8:55 AM",
      severity: "warning",
      action: "Delay Departure",
      icon: <Clock className="text-white" size={20} />,
      accent: "bg-amber-500"
    },
    {
      id: 3,
      title: "Road Incident",
      message: "Accident reported near Vashi bridge. Avoid road route for the next 45 minutes.",
      location: "Vashi Bridge",
      time: "9:10 AM",
      severity: "critical",
      action: "Reroute via Palm Beach",
      icon: <AlertTriangle className="text-white" size={20} />,
      accent: "bg-red-600"
    },
    {
      id: 4,
      title: "Optimal Route Found",
      message: "Alternate route via Sion-Panvel Highway currently has 15% less crowd than usual.",
      location: "Sion-Panvel Hwy",
      time: "9:15 AM",
      severity: "info",
      action: "Stay on Route",
      icon: <CheckCircle2 className="text-white" size={20} />,
      accent: "bg-emerald-500"
    }
  ];

  const containerVars = {
    animate: { transition: { staggerChildren: 0.1 } }
  };

  const itemVars = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 selection:bg-blue-100">
      {/* HEADER SECTION */}
      <motion.div 
        variants={containerVars}
        initial="initial"
        animate="animate"
        className="max-w-7xl mx-auto p-6 lg:p-12 space-y-12"
      >
        <motion.div variants={itemVars} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Smart Travel Alerts</h2>
            <div className="flex items-center gap-2 mt-2 text-slate-500 font-bold text-sm uppercase tracking-widest">
              <MapPin size={16} className="text-blue-600" />
              <span>Current Area: <span className="text-slate-900">Panvel Hub</span></span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-slate-600">Scanning City Nodes</span>
          </div>
        </motion.div>

        {/* FEATURED CRITICAL ALERT - Deep Slate Theme */}
        <motion.section variants={itemVars} className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-orange-600 rounded-[3rem] blur opacity-10"></div>
          <div className="relative bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden text-white border border-white/5">
            <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 blur-[100px]"></div>
            <div className="flex flex-col md:flex-row items-stretch">
              <div className="bg-red-600 p-12 flex items-center justify-center">
                <Zap size={48} className="fill-current animate-bounce" />
              </div>
              <div className="p-10 lg:p-14 flex-1 relative z-10">
                <div className="flex items-center gap-2 text-red-400 font-black text-[10px] uppercase tracking-[0.2em] mb-4">
                  <ShieldCheck size={14} />
                  Urgent Reroute Required
                </div>
                <h3 className="text-3xl font-black mb-4">Traffic Detected near Panvel Entry</h3>
                <p className="text-slate-400 font-medium text-lg leading-relaxed mb-8 max-w-2xl">
                  An unusual build-up is reported on the main road. Switching to the <span className="text-white font-bold underline decoration-blue-500">Harbour Line local</span> is advised to bypass 20 minutes of delay.
                </p>
                <div className="flex flex-wrap gap-4">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white font-black px-8 py-4 rounded-2xl transition-all shadow-xl active:scale-95 flex items-center gap-2">
                    Update My Route <ArrowRight size={18} />
                  </button>
                  <button className="bg-white/10 hover:bg-white/20 text-white font-black px-8 py-4 rounded-2xl transition-all">
                    Ignore
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* FEED SECTION */}
        <section className="space-y-6">
          <motion.div variants={itemVars} className="flex items-center gap-3 px-2">
            <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
            <h3 className="text-2xl font-black text-slate-800">Intelligence Feed</h3>
          </motion.div>

          <div className="grid grid-cols-1 gap-4">
            {mockAlerts.map((alert) => (
              <motion.div 
                key={alert.id}
                variants={itemVars}
                whileHover={{ x: 10 }}
                className="bg-white border border-slate-100 p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/30 flex flex-col md:flex-row md:items-center gap-6 group transition-all duration-300"
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shrink-0 ${alert.accent}`}>
                  {alert.icon}
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-black text-slate-800 text-xl group-hover:text-blue-600 transition-colors">{alert.title}</h4>
                    <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-full uppercase tracking-widest">{alert.time}</span>
                  </div>
                  <p className="text-slate-500 font-medium leading-relaxed mb-4">
                    {alert.message}
                  </p>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <MapPin size={12} className="text-blue-500" />
                      {alert.location}
                    </div>
                    <div className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${
                      alert.severity === 'critical' ? 'text-red-600 border-red-100 bg-red-50' : 
                      alert.severity === 'warning' ? 'text-amber-600 border-amber-100 bg-amber-50' : 
                      'text-emerald-600 border-emerald-100 bg-emerald-50'
                    }`}>
                      {alert.severity}
                    </div>
                  </div>
                </div>

                <div className="md:border-l border-slate-100 md:pl-8 flex shrink-0">
                  <button className="text-blue-600 font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2 group-hover:gap-4 transition-all">
                    {alert.action}
                    <ChevronRight size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* FOOTER QUOTE */}
        <motion.div variants={itemVars} className="pt-12">
          <div className="bg-blue-600 rounded-[2.5rem] p-10 text-center relative overflow-hidden shadow-2xl shadow-blue-200">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <p className="text-white font-bold text-lg leading-relaxed italic relative z-10 max-w-3xl mx-auto">
              “This smart alert system simulates location-based warnings using predefined conditions to demonstrate how real-time traffic and crowd data could proactively guide commuters.”
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SmartAlerts;