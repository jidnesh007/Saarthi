/**
 * SAARTHI - Journey Planning Form Component
 * 
 * Form for creating new journeys with crowd estimation preview
 */

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

/**
 * Segment Form Component
 * Form for adding individual journey segments
 */
const SegmentForm = ({ segment, index, onChange, onRemove }) => {
  return (
    <div className="border border-gray-300 rounded-lg p-4 mb-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-800">Segment {index + 1}</h4>
        {index > 0 && (
          <button
            type="button"
            onClick={onRemove}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Remove
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Transport Mode *
          </label>
          <select
            value={segment.mode}
            onChange={(e) => onChange(index, 'mode', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select mode</option>
            <option value="train">🚆 Train</option>
            <option value="bus">🚌 Bus</option>
            <option value="metro">🚇 Metro</option>
            <option value="auto">🛺 Auto</option>
            <option value="cab">🚖 Cab</option>
            <option value="walk">🚶 Walk</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Departure Time (HH:MM) *
          </label>
          <input
            type="time"
            value={segment.departureTime}
            onChange={(e) => onChange(index, 'departureTime', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            From *
          </label>
          <input
            type="text"
            value={segment.from}
            onChange={(e) => onChange(index, 'from', e.target.value)}
            placeholder="Starting point"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            To *
          </label>
          <input
            type="text"
            value={segment.to}
            onChange={(e) => onChange(index, 'to', e.target.value)}
            placeholder="Destination"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Duration (minutes) *
          </label>
          <input
            type="number"
            value={segment.duration}
            onChange={(e) => onChange(index, 'duration', e.target.value)}
            placeholder="30"
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Distance (km, optional)
          </label>
          <input
            type="number"
            value={segment.distance}
            onChange={(e) => onChange(index, 'distance', e.target.value)}
            placeholder="10"
            min="0"
            step="0.1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Main Journey Planning Form Component
 */
const Planning = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    origin: '',
    destination: '',
    plannedDate: '',
    plannedTime: '',
    notes: ''
  });

  // Segments state - start with one empty segment
  const [segments, setSegments] = useState([
    {
      mode: '',
      from: '',
      to: '',
      departureTime: '',
      duration: '',
      distance: ''
    }
  ]);

  // Handle main form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle segment field changes
  const handleSegmentChange = (index, field, value) => {
    const updatedSegments = [...segments];
    updatedSegments[index] = {
      ...updatedSegments[index],
      [field]: value
    };
    setSegments(updatedSegments);
  };

  // Add new segment
  const addSegment = () => {
    setSegments([
      ...segments,
      {
        mode: '',
        from: '',
        to: '',
        departureTime: '',
        duration: '',
        distance: ''
      }
    ]);
  };

  // Remove segment
  const removeSegment = (index) => {
    if (segments.length > 1) {
      setSegments(segments.filter((_, i) => i !== index));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Prepare segments data
      const preparedSegments = segments.map(seg => ({
        mode: seg.mode,
        from: seg.from,
        to: seg.to,
        departureTime: seg.departureTime,
        duration: parseInt(seg.duration),
        distance: seg.distance ? parseFloat(seg.distance) : undefined
      }));

      // Submit to API
      const response = await axios.post('/api/journey/plan', {
        ...formData,
        segments: preparedSegments
      });

      if (response.data.success) {
        // Show success message
        alert('Journey planned successfully with crowd estimation!');
        
        // Navigate to dashboard
        navigate('/dashboard');
      } else {
        setError('Failed to plan journey');
      }
    } catch (err) {
      console.error('Error planning journey:', err);
      setError(err.response?.data?.message || 'Failed to plan journey. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Plan New Journey</h1>
          <p className="text-gray-600">Create a journey plan with crowd level estimation</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          {/* Basic Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Journey Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Daily Commute to Office"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Origin *
                  </label>
                  <input
                    type="text"
                    name="origin"
                    value={formData.origin}
                    onChange={handleChange}
                    placeholder="Starting location"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destination *
                  </label>
                  <input
                    type="text"
                    name="destination"
                    value={formData.destination}
                    onChange={handleChange}
                    placeholder="Final destination"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Planned Date *
                  </label>
                  <input
                    type="date"
                    name="plannedDate"
                    value={formData.plannedDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Planned Time *
                  </label>
                  <input
                    type="time"
                    name="plannedTime"
                    value={formData.plannedTime}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any additional notes about this journey..."
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Journey Segments */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Journey Segments</h3>
              <button
                type="button"
                onClick={addSegment}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Add Segment
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>📊 Crowd Estimation:</strong> Expected crowd levels will be automatically 
                calculated based on transport mode and departure time after you submit the form.
              </p>
            </div>

            {segments.map((segment, index) => (
              <SegmentForm
                key={index}
                segment={segment}
                index={index}
                onChange={handleSegmentChange}
                onRemove={() => removeSegment(index)}
              />
            ))}
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Planning Journey...' : 'Plan Journey with Crowd Estimation'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="py-3 px-6 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Information Panel */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            How Crowd Estimation Works
          </h3>
          <div className="space-y-2 text-sm text-gray-700">
            <p>
              <strong>🚆 Train:</strong> High crowd during peak hours (8-11 AM, 5-8 PM), 
              Medium during off-peak (11 AM-5 PM), Low otherwise
            </p>
            <p>
              <strong>🚌 Bus & 🚇 Metro:</strong> Medium crowd during peak hours, Low otherwise
            </p>
            <p>
              <strong>🛺 Auto, 🚖 Cab, 🚶 Walk:</strong> Always Low crowd (personal transport)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Planning;