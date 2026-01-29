import { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/Api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('🚫 No token found - user not authenticated');
        setLoading(false);
        return;
      }

      // Set token in API headers
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Fetch user profile to validate token
      const { data } = await api.get('/api/profile/me');
      
      console.log('📊 Profile data received:', data);
      
      setUser(data.user);
      setIsAuthenticated(true);
      
      // Check if profile is complete
      const profile = data.profile;
      const isComplete = Boolean(
        profile?.homeLocation?.name &&
        profile?.workLocation?.name &&
        profile?.transportModes?.length > 0 &&
        profile?.commuteWindow?.start &&
        profile?.commuteWindow?.end
      );
      
      setIsProfileComplete(isComplete);
      
      console.log('✅ Auth Check Success:', {
        user: data.user?.email,
        isAuthenticated: true,
        isProfileComplete: isComplete
      });
      
    } catch (error) {
      console.error('❌ Auth check failed:', error.response?.status, error.response?.data);
      
      // Token is invalid or expired - clear everything
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      setIsAuthenticated(false);
      setIsProfileComplete(false);
      
      console.log('🔄 Cleared invalid auth state');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      
      console.log('📥 Login response:', data);
      
      // Store token
      localStorage.setItem('token', data.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      
      // Set user state
      setUser(data.user);
      setIsAuthenticated(true);
      
      // Check profile completion
      const isComplete = Boolean(
        data.user?.profile?.homeLocation?.name &&
        data.user?.profile?.workLocation?.name &&
        data.user?.profile?.transportModes?.length > 0 &&
        data.user?.profile?.commuteWindow?.start &&
        data.user?.profile?.commuteWindow?.end
      );
      
      setIsProfileComplete(isComplete);
      
      console.log('✅ Login Success:', {
        user: data.user?.email,
        isProfileComplete: isComplete
      });
      
      return { success: true, isProfileComplete: isComplete };
      
    } catch (error) {
      console.error('❌ Login failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please try again.'
      };
    }
  };

  const register = async (userData) => {
    try {
      const { data } = await api.post('/api/auth/register', userData);
      
      console.log('✅ Registration successful');
      
      return {
        success: true,
        message: 'Registration successful! Please login.'
      };
      
    } catch (error) {
      console.error('❌ Registration failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed. Please try again.'
      };
    }
  };

  const completeProfileSetup = async (profileData) => {
    try {
      console.log('🚀 Starting profile setup...', profileData);
      
      const { data } = await api.post('/api/profile/setup', profileData);
      
      console.log('📥 Profile setup response:', data);
      
      // Update user with new profile
      setUser(prevUser => ({
        ...prevUser,
        profile: data.profile
      }));
      
      // Mark profile as complete
      setIsProfileComplete(true);
      
      console.log('✅ Profile setup complete');
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Profile setup failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Profile setup failed. Please try again.'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
    setIsProfileComplete(false);
    console.log('👋 Logged out');
  };

  const value = {
    user,
    isAuthenticated,
    isProfileComplete,
    loading,
    login,
    register,
    logout,
    completeProfileSetup,
    checkAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};