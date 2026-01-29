import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ProfileSetup = () => {
  const { completeProfileSetup, isAuthenticated, checkAuth } = useAuth();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    homeLocation: { name: '', lat: '', lng: '' },
    workLocation: { name: '', lat: '', lng: '' },
    transportModes: [],
    commuteWindow: { start: '', end: '' }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const transportOptions = ['Train', 'Bus', 'Metro', 'Auto', 'Cab', 'Walk'];

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleLocationChange = (locationType, field, value) => {
    setFormData(prev => ({
      ...prev,
      [locationType]: { ...prev[locationType], [field]: value }
    }));
    if (error) setError('');
  };

  const toggleTransport = (mode) => {
    setFormData(prev => ({
      ...prev,
      transportModes: prev.transportModes.includes(mode)
        ? prev.transportModes.filter(m => m !== mode)
        : [...prev.transportModes, mode]
    }));
    if (error) setError('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Only submit on final step
    if (currentStep !== 4) {
      if (validateCurrentStep()) {
        nextStep();
      } else {
        setError('Please fill required fields');
      }
      return;
    }

    // Full form validation
    const isComplete = formData.homeLocation.name && 
      formData.workLocation.name && 
      formData.transportModes.length > 0 && 
      formData.commuteWindow.start && 
      formData.commuteWindow.end;

    if (!isComplete) {
      setError('Please complete all fields');
      return;
    }

    setLoading(true);
    console.log('🚀 Submitting profile:', formData);

    try {
      const result = await completeProfileSetup(formData);
      console.log('✅ Profile result:', result);
      
      if (result.success) {
        // Refresh auth state to update isProfileComplete
        await checkAuth();
        
        // Navigate to dashboard
        setTimeout(() => {
          navigate('/journey-dashboard', { replace: true });
        }, 500);
      } else {
        setError(result.message || 'Setup failed');
      }
    } catch (error) {
      console.error('❌ Submit error:', error);
      setError('Setup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                <span className="text-3xl">🏠</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Where do you start your journey?</h3>
              <p className="text-gray-600 text-sm">This is typically your home or residence</p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-100">
              <label className="block text-sm font-semibold text-gray-800 mb-3">
                📍 Starting Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Andheri West, Mumbai"
                value={formData.homeLocation.name}
                onChange={(e) => handleLocationChange('homeLocation', 'name', e.target.value)}
                className="w-full p-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium transition-all"
              />
              <div className="mt-4 pt-4 border-t border-blue-200">
                <p className="text-xs text-gray-600 mb-3 font-medium">📌 Optional coordinates</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Latitude</label>
                    <input
                      type="number"
                      placeholder="19.0662"
                      value={formData.homeLocation.lat}
                      onChange={(e) => handleLocationChange('homeLocation', 'lat', e.target.value)}
                      step="any"
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Longitude</label>
                    <input
                      type="number"
                      placeholder="72.8258"
                      value={formData.homeLocation.lng}
                      onChange={(e) => handleLocationChange('homeLocation', 'lng', e.target.value)}
                      step="any"
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={nextStep}
              disabled={!validateCurrentStep()}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-xl mt-6 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Continue to Destination →
            </button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-4">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Where do you usually go?</h3>
              <p className="text-gray-600 text-sm">Your frequent destination</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border-2 border-purple-100">
              <label className="block text-sm font-semibold text-gray-800 mb-3">
                🚩 Destination Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., BKC, Powai, Churchgate"
                value={formData.workLocation.name}
                onChange={(e) => handleLocationChange('workLocation', 'name', e.target.value)}
                className="w-full p-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg font-medium transition-all"
              />
              <div className="mt-4 pt-4 border-t border-purple-200">
                <p className="text-xs text-gray-600 mb-3 font-medium">📌 Optional coordinates</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Latitude</label>
                    <input
                      type="number"
                      placeholder="19.0661"
                      value={formData.workLocation.lat}
                      onChange={(e) => handleLocationChange('workLocation', 'lat', e.target.value)}
                      step="any"
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Longitude</label>
                    <input
                      type="number"
                      placeholder="72.8258"
                      value={formData.workLocation.lng}
                      onChange={(e) => handleLocationChange('workLocation', 'lng', e.target.value)}
                      step="any"
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={prevStep}
                className="flex-1 bg-gray-200 text-gray-700 p-4 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={nextStep}
                disabled={!validateCurrentStep()}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white p-4 rounded-xl hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Next: Transport →
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <span className="text-3xl">🚍</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">How do you prefer to travel?</h3>
              <p className="text-gray-600 text-sm">Select all modes you use</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-teal-50 p-6 rounded-xl border-2 border-green-100">
              <p className="text-sm font-semibold text-gray-800 mb-4">
                ✅ Choose at least one <span className="text-red-500">*</span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                {transportOptions.map(mode => {
                  const icons = {
                    'Train': '🚆', 'Bus': '🚌', 'Metro': '🚇', 
                    'Auto': '🛺', 'Cab': '🚖', 'Walk': '🚶'
                  };
                  return (
                    <label key={mode} className={`flex items-center p-4 rounded-xl cursor-pointer transition-all border-2 ${
                      formData.transportModes.includes(mode)
                        ? 'bg-white border-green-500 shadow-md transform scale-105'
                        : 'bg-white border-gray-200 hover:border-green-300 hover:shadow-sm'
                    }`}>
                      <input
                        type="checkbox"
                        checked={formData.transportModes.includes(mode)}
                        onChange={() => toggleTransport(mode)}
                        className="mr-3 h-5 w-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-2xl mr-2">{icons[mode]}</span>
                      <span className="text-sm font-semibold text-gray-900">{mode}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex space-x-4">
              <button 
                type="button"
                onClick={prevStep} 
                className="flex-1 bg-gray-200 text-gray-700 p-4 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={nextStep}
                disabled={formData.transportModes.length === 0}
                className="flex-1 bg-gradient-to-r from-green-500 to-teal-600 text-white p-4 rounded-xl hover:from-green-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Next: Travel Times →
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 mb-4">
                <span className="text-3xl">⏰</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">When do you usually travel?</h3>
              <p className="text-gray-600 text-sm">We'll send you personalized alerts</p>
            </div>
            
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-xl border-2 border-orange-100 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="text-xl mr-2">🌅</span>
                  Departure Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={formData.commuteWindow.start}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    commuteWindow: { ...prev.commuteWindow, start: e.target.value }
                  }))}
                  className="w-full p-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-xl font-bold text-center transition-all"
                />
              </div>

              <div className="flex items-center justify-center">
                <div className="h-12 w-0.5 bg-gradient-to-b from-orange-300 to-amber-300"></div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="text-xl mr-2">🌆</span>
                  Return Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={formData.commuteWindow.end}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    commuteWindow: { ...prev.commuteWindow, end: e.target.value }
                  }))}
                  className="w-full p-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-xl font-bold text-center transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-xl flex items-center">
                <span className="text-xl mr-3">⚠️</span>
                {error}
              </div>
            )}

            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading || !validateCurrentStep()}
                className="w-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 text-white p-5 rounded-xl font-bold text-lg hover:from-green-600 hover:via-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Setting up your profile...
                  </span>
                ) : (
                  '🎉 Complete Setup & Go to Dashboard'
                )}
              </button>
              <button
                type="button"
                onClick={prevStep}
                disabled={loading}
                className="w-full bg-gray-200 text-gray-700 p-4 rounded-xl hover:bg-gray-300 transition-colors font-semibold disabled:opacity-50"
              >
                ← Back
              </button>
            </div>
          </div>
        );

      default:
        return <div>Invalid step</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-12 p-6 bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 -z-10">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 transition-all duration-500 rounded-full"
                style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
              />
            </div>
            {[
              { num: 1, label: 'Start', icon: '🏠', color: 'blue' },
              { num: 2, label: 'Destination', icon: '🎯', color: 'purple' },
              { num: 3, label: 'Transport', icon: '🚍', color: 'green' },
              { num: 4, label: 'Timing', icon: '⏰', color: 'orange' }
            ].map((step) => {
              const isActive = step.num === currentStep;
              const isCompleted = step.num < currentStep;
              return (
                <div key={step.num} className="flex flex-col items-center z-10 bg-white px-2">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold shadow-md transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white scale-110' 
                      : isActive 
                        ? `bg-gradient-to-br from-${step.color}-500 to-${step.color}-600 text-white ring-4 ring-${step.color}-200 scale-110` 
                        : 'bg-gray-100 text-gray-400'
                  }`}>
                    {isCompleted ? '✓' : step.icon}
                  </div>
                  <span className={`text-xs mt-2 font-semibold transition-colors ${
                    isActive ? `text-${step.color}-600` : 'text-gray-500'
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white p-8 md:p-10 rounded-3xl shadow-2xl border border-gray-100">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-3">
              Welcome to Urban Commuter! 🚀
            </h1>
            <p className="text-gray-600 max-w-xl mx-auto text-lg">
              Let's personalize your commute experience in 4 simple steps
            </p>
          </div>
          
          <form onSubmit={handleSubmit}>
            {renderStep()}
          </form>
        </div>

        <div className="mt-8 text-center">
          <div className="inline-flex items-center space-x-2 bg-white px-6 py-3 rounded-full shadow-md border border-gray-200">
            <span className="text-sm font-semibold text-gray-700">Step {currentStep} of 4</span>
            <span className="text-gray-400">•</span>
            <span className="text-sm text-gray-600">
              {currentStep === 4 ? 'Almost there! 🎯' : 'Keep going! 💪'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;