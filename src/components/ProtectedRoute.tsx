import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresOnboarding?: boolean;
  requiresAssessment?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiresOnboarding = false,
  requiresAssessment = false 
}) => {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-blue-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Not authenticated
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Requires onboarding but user hasn't completed it
  if (requiresOnboarding && userProfile && (!userProfile.name || userProfile.age === 0)) {
    return <Navigate to="/onboarding" replace />;
  }

  // Requires assessment but user hasn't completed it
  if (requiresAssessment && userProfile && !userProfile.current_level_id) {
    return <Navigate to="/assessment" replace />;
  }

  return <>{children}</>;
};