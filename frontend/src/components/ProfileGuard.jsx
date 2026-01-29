import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProfileGuard = ({ children }) => {
  const { isAuthenticated, isProfileComplete } = useAuth();
  
  // Not authenticated → Login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Profile incomplete → Profile Setup
  if (!isProfileComplete) {
    return <Navigate to="/profile-setup" replace />;
  }
  
  // Profile complete → Allow access
  return children;
};

export default ProfileGuard;
