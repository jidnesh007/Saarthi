import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  MapPin, 
  Navigation, 
  Train, 
  Bus, 
  Clock, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2,
  Zap,
  Target
} from 'lucide-react';

const ProfileSetup = () => {
  // --- MOCK LOGIC FOR DEMO ---
  // In a real app, these come from your AuthContext
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    homeLocation: { name: '', lat: '', lng: '' },
    workLocation: { name: '', lat: '', lng: '' },
    transportModes: [],
    commuteWindow: { start: '', end: '' }
  });
  const [loading, setLoading] = useState(false);

  const transportOptions = [
    { mode: 'Train', icon: <Train size={20} /> },
    { mode: 'Bus', icon: <Bus size={20} /> },
    { mode: 'Metro', icon: <Navigation size={20} className="rotate-45" /> },
    { mode: 'Auto', icon: <Zap size={20} /> },
    { mode: 'Cab', icon: <Target size={20} /> },
    { mode: 'Walk', icon: <Navigation size={20} /> },
  ];

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleLocationChange = (locationType, field, value) => {
    setFormData(prev => ({
      ...prev,
      [locationType]: { ...prev[locationType], [field]: value }
    }));
  };

  const toggleTransport = (mode) => {
    setFormData(prev => ({
      ...prev,
      transportModes: prev.transportModes.includes(mode)
        ? prev.transportModes.filter(m => m !== mode)
        : [...prev.transportModes, mode]
    }));
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1: return formData.homeLocation.name.trim().length > 0;
      case 2: return formData.workLocation.name.trim().length > 0;
      case 3: return formData.transportModes.length > 0;
      case 4: return formData.commuteWindow.start && formData.commuteWindow.end;
      default: return false;
    }
  };

  // Animation variants
  const slideIn = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 selection:bg-blue-100 flex flex-col">
      {/* Navbar Matching Dashboard */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Navigation className="text-white fill-current" size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-slate-900 leading-none">SAARTHI</h1>
              <p className="text-[10px] uppercase tracking-widest font-bold text-blue-600 mt-1">Profile Setup</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live Personalization</span>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          
          {/* Progress Indicator */}
          <div className="mb-10 px-2">
            <div className="flex justify-between mb-4">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex flex-col items-center gap-2">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black transition-all duration-500 border-2 ${
                    step <= currentStep ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border-slate-200 text-slate-300'
                  }`}>
                    {step < currentStep ? <CheckCircle2 size={18} /> : step}
                  </div>
                </div>
              ))}
            </div>
            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-blue-600"
                initial={{ width: "25%" }}
                animate={{ width: `${(currentStep / 4) * 100}%` }}
              />
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="p-8 md:p-12">
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div key="step1" {...slideIn} className="space-y-8">
                    <div className="space-y-2">
                      <h2 className="text-3xl font-black tracking-tight text-slate-900">Set Home Base</h2>
                      <p className="text-slate-500 font-medium">Where does your daily journey typically begin?</p>
                    </div>

                    <div className="space-y-4">
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600">
                          <Home size={20} />
                        </div>
                        <input
                          type="text"
                          placeholder="Search Home Location (e.g. Dadar West)"
                          value={formData.homeLocation.name}
                          onChange={(e) => handleLocationChange('homeLocation', 'name', e.target.value)}
                          className="w-full pl-12 pr-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-600 focus:bg-white outline-none transition-all font-bold text-slate-700"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <input type="text" placeholder="Lat (Optional)" className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs font-bold" />
                         <input type="text" placeholder="Long (Optional)" className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs font-bold" />
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div key="step2" {...slideIn} className="space-y-8">
                    <div className="space-y-2">
                      <h2 className="text-3xl font-black tracking-tight text-slate-900">Your Destination</h2>
                      <p className="text-slate-500 font-medium">Where do you head to most frequently?</p>
                    </div>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-600">
                        <MapPin size={20} />
                      </div>
                      <input
                        type="text"
                        placeholder="Search Destination (e.g. Panvel Junction)"
                        value={formData.workLocation.name}
                        onChange={(e) => handleLocationChange('workLocation', 'name', e.target.value)}
                        className="w-full pl-12 pr-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all font-bold text-slate-700"
                      />
                    </div>
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div key="step3" {...slideIn} className="space-y-8">
                    <div className="space-y-2">
                      <h2 className="text-3xl font-black tracking-tight text-slate-900">Prefered Transit</h2>
                      <p className="text-slate-500 font-medium">Select modes you use for your commute.</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {transportOptions.map((item) => (
                        <button
                          key={item.mode}
                          onClick={() => toggleTransport(item.mode)}
                          className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 ${
                            formData.transportModes.includes(item.mode)
                              ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-lg shadow-blue-100'
                              : 'border-slate-50 bg-slate-50 text-slate-400 grayscale hover:grayscale-0'
                          }`}
                        >
                          {item.icon}
                          <span className="text-xs font-black uppercase tracking-widest">{item.mode}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {currentStep === 4 && (
                  <motion.div key="step4" {...slideIn} className="space-y-8">
                    <div className="space-y-2">
                      <h2 className="text-3xl font-black tracking-tight text-slate-900">Timing Window</h2>
                      <p className="text-slate-500 font-medium">When should SAARTHI start monitoring traffic for you?</p>
                    </div>
                    <div className="space-y-6">
                       <div className="bg-slate-900 rounded-3xl p-8 space-y-6">
                          <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Morning Departure</span>
                            <input 
                              type="time" 
                              className="bg-transparent text-white text-3xl font-black outline-none border-b-2 border-white/10 focus:border-blue-400 transition-colors"
                              onChange={(e) => setFormData({...formData, commuteWindow: {...formData.commuteWindow, start: e.target.value}})}
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Evening Return</span>
                            <input 
                              type="time" 
                              className="bg-transparent text-white text-3xl font-black outline-none border-b-2 border-white/10 focus:border-emerald-400 transition-colors"
                              onChange={(e) => setFormData({...formData, commuteWindow: {...formData.commuteWindow, end: e.target.value}})}
                            />
                          </div>
                       </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation Controls */}
              <div className="mt-12 flex gap-4">
                {currentStep > 1 && (
                  <button
                    onClick={prevStep}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-5 px-8 rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <ChevronLeft size={20} /> Back
                  </button>
                )}
                <button
                  onClick={currentStep === 4 ? () => console.log(formData) : nextStep}
                  disabled={!validateCurrentStep()}
                  className={`flex-[2] font-bold py-5 px-8 rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xl ${
                    validateCurrentStep() 
                    ? 'bg-slate-900 text-white hover:bg-blue-600 shadow-slate-200' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  {currentStep === 4 ? 'Complete Profile' : 'Continue'}
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>

          <p className="mt-8 text-center text-slate-400 text-sm font-medium">
            Step {currentStep} of 4 • Your data is stored locally for the demo.
          </p>
        </div>
      </main>
    </div>
  );
};

export default ProfileSetup;