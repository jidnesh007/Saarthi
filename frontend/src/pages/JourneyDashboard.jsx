import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../services/Api'

function JourneyDashboard() {
  const { user, logout, isProfileComplete } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [journeyInput, setJourneyInput] = useState({ source: '', destination: '' })
  const [journeyResult, setJourneyResult] = useState(null)
  const [loading, setLoading] = useState(false)

  // Redirect to setup if profile is not complete
  useEffect(() => {
    if (!isProfileComplete) {
      navigate('/setup', { replace: true })
    }
  }, [isProfileComplete, navigate])

  useEffect(() => {
    if (isProfileComplete) {
      fetchProfile()
    }
  }, [isProfileComplete])

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/api/profile/me')
      setProfile(data.profile)
      setJourneyInput({
        source: data.profile?.homeLocation?.name || '',
        destination: data.profile?.workLocation?.name || ''
      })
    } catch (error) {
      console.error('Profile fetch failed:', error)
    }
  }

  const handlePlanJourney = async () => {
    if (!journeyInput.source || !journeyInput.destination) {
      alert('Please enter both source and destination')
      return
    }
    
    setLoading(true)
    setJourneyResult(null) // Clear previous results
    try {
      const response = await api.post('/api/journey/plan', journeyInput)
      
      // Extract the actual journey data from the nested response
      const journeyData = response.data?.data || response.data
      
      // Validate response structure
      if (journeyData && journeyData.segments && Array.isArray(journeyData.segments)) {
        setJourneyResult(journeyData)
      } else {
        console.error('Invalid journey data structure:', response.data)
        alert('Received invalid journey data from server')
      }
    } catch (error) {
      console.error('Journey planning error:', error)
      alert('Journey planning failed: ' + (error.response?.data?.message || 'Please try again'))
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  // Don't render anything if profile is not complete
  if (!isProfileComplete) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* TOP HORIZONTAL NAVBAR - FIXED */}
      <nav className="bg-white/90 backdrop-blur-xl sticky top-0 z-50 border-b border-gray-200/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* LEFT: SAARTHI LOGO */}
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">S</span>
              </div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                SAARTHI
              </h1>
            </div>

            {/* RIGHT: USER INFO + LOGOUT */}
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">Hi, {user?.name}</p>
                <p className="text-sm text-gray-500">Your daily commute companion</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-2xl hover:from-red-600 hover:to-red-700 shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-6 py-16 lg:px-8 -mt-4">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 lg:gap-16">
          
          {/* SECTION 1: JOURNEY INPUT */}
          <div className="xl:col-span-1">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border border-white/50">
              <h2 className="text-4xl font-black text-gray-900 mb-2 flex items-center space-x-3">
                <span>🚀</span>
                <span>Plan Journey</span>
              </h2>
              <p className="text-xl text-gray-600 mb-10">Quick commute planning for today</p>
              
              <div className="space-y-8">
                {/* SOURCE INPUT */}
                <div className="space-y-3">
                  <label className="flex items-center space-x-2 text-lg font-bold text-gray-900">
                    <span>🏠</span>
                    <span>Source</span>
                  </label>
                  <input
                    type="text"
                    value={journeyInput.source}
                    onChange={(e) => setJourneyInput({...journeyInput, source: e.target.value})}
                    className="w-full px-6 py-5 text-lg border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 shadow-lg transition-all duration-200 hover:shadow-xl"
                    placeholder="e.g., Andheri Station"
                  />
                  {profile?.homeLocation?.name && (
                    <p className="text-sm text-blue-600 font-medium flex items-center space-x-1">
                      <span>📍</span>
                      <span>Auto-filled from profile: {profile.homeLocation.name}</span>
                    </p>
                  )}
                </div>
                
                {/* DESTINATION INPUT */}
                <div className="space-y-3">
                  <label className="flex items-center space-x-2 text-lg font-bold text-gray-900">
                    <span>🏢</span>
                    <span>Destination</span>
                  </label>
                  <input
                    type="text"
                    value={journeyInput.destination}
                    onChange={(e) => setJourneyInput({...journeyInput, destination: e.target.value})}
                    className="w-full px-6 py-5 text-lg border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 shadow-lg transition-all duration-200 hover:shadow-xl"
                    placeholder="e.g., BKC Bandra"
                  />
                  {profile?.workLocation?.name && (
                    <p className="text-sm text-green-600 font-medium flex items-center space-x-1">
                      <span>📍</span>
                      <span>Auto-filled from profile: {profile.workLocation.name}</span>
                    </p>
                  )}
                </div>

                {/* PLAN BUTTON */}
                <button
                  onClick={handlePlanJourney}
                  disabled={loading || !journeyInput.source || !journeyInput.destination}
                  className="w-full bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 text-white py-7 px-8 rounded-3xl font-black text-xl shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-4 group"
                >
                  <span className="text-2xl group-hover:rotate-12 transition-transform duration-300">
                    {loading ? '⏳' : '🚀'}
                  </span>
                  <span>{loading ? 'Planning your commute...' : 'Plan My Journey'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 2: JOURNEY OUTPUT (Vertical Timeline) */}
          {journeyResult && journeyResult.segments && journeyResult.segments.length > 0 && (
            <div className="xl:col-span-1">
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border border-white/50 sticky top-24 h-fit">
                <h2 className="text-4xl font-black text-gray-900 mb-2 flex items-center space-x-3">
                  <span>🗺️</span>
                  <span>Your Journey</span>
                </h2>
                
                {/* JOURNEY SUMMARY CARDS */}
                <div className="grid grid-cols-3 gap-6 mb-12 p-8 bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-100 rounded-3xl border-2 border-emerald-200/50">
                  <div className="text-center group">
                    <div className="text-3xl lg:text-4xl font-black text-emerald-800 mb-1">
                      {journeyResult.totalTime} min
                    </div>
                    <div className="text-sm uppercase tracking-widest font-bold text-emerald-700">
                      Total Time
                    </div>
                  </div>
                  <div className="text-center group">
                    <div className="text-3xl lg:text-4xl font-black text-blue-800 mb-1">
                      {journeyResult.transferCount || journeyResult.transfers || 0}
                    </div>
                    <div className="text-sm uppercase tracking-widest font-bold text-blue-700">
                      Transfers
                    </div>
                  </div>
                  <div className="text-center group">
                    <div className="text-3xl lg:text-4xl font-black text-orange-600 mb-1">
                      {journeyResult.riskPoints?.length || 0}
                    </div>
                    <div className="text-sm uppercase tracking-widest font-bold text-orange-600">
                      Risk Points
                    </div>
                  </div>
                </div>

                {/* VERTICAL TIMELINE */}
                <div className="relative">
                  {/* START LINE */}
                  <div className="flex items-center mb-10 pb-8 border-b-2 border-gray-200">
                    <div className="w-12 h-12 bg-emerald-500 border-8 border-white rounded-full shadow-xl flex items-center justify-center mx-2 flex-shrink-0">
                      <span className="text-2xl font-bold text-white">S</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900">START</h3>
                      <p className="text-xl text-gray-600 font-mono">{journeyResult.startTime}</p>
                    </div>
                  </div>

                  {/* JOURNEY SEGMENTS */}
                  <div className="space-y-10 mb-12">
                    {journeyResult.segments?.map((segment, index) => (
                      <div key={index} className="flex items-start group">
                        {/* Timeline Dot */}
                        <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full border-4 border-white shadow-lg -mt-3 flex-shrink-0 z-10 group-hover:scale-110 transition-all duration-200">
                          <span className="text-xs font-bold text-white block w-6 h-6 leading-6 text-center">{index + 1}</span>
                        </div>

                        {/* Segment Content */}
                        <div className="flex-1 ml-8 -mt-2 pb-8">
                          {/* Mode & Duration */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-3 rounded-2xl text-white font-bold text-xl shadow-xl flex items-center space-x-3">
                              <span className="text-2xl">{getModeIcon(segment.mode)}</span>
                              <span>{segment.mode.toUpperCase()}</span>
                              <span className="text-lg opacity-90">({segment.duration} min)</span>
                            </div>
                            {segment.riskNote && (
                              <div className="ml-4 px-4 py-2 bg-orange-100 border border-orange-200 text-orange-800 font-bold rounded-xl shadow-md flex items-center space-x-2">
                                <span>⚠️</span>
                                <span className="text-sm">{segment.riskNote}</span>
                              </div>
                            )}
                          </div>

                          {/* Route */}
                          <div className="bg-gray-50 rounded-2xl p-5 mb-4 border-l-4 border-blue-400">
                            <p className="text-lg font-semibold text-gray-900">
                              {segment.from} <span className="text-2xl mx-2">→</span> {segment.to}
                            </p>
                          </div>

                          {/* Timeline Line */}
                          {index < (journeyResult.segments?.length || 0) - 1 && (
                            <div className="absolute left-3 w-px h-full bg-gradient-to-b from-blue-400 to-transparent"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* END LINE */}
                  <div className="flex items-center pt-8 border-t-2 border-emerald-300">
                    <div className="w-12 h-12 bg-emerald-500 border-8 border-white rounded-full shadow-xl flex items-center justify-center mx-2 flex-shrink-0">
                      <span className="text-2xl font-bold text-white">E</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900">END</h3>
                      <p className="text-xl text-gray-600 font-mono">{journeyResult.endTime}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

// Helper function for mode icons
const getModeIcon = (mode) => {
  const icons = {
    walk: '🚶',
    train: '🚂',
    bus: '🚌',
    metro: '🚇'
  }
  return icons[mode.toLowerCase()] || '🚀'
}

export default JourneyDashboard