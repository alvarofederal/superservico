import React from 'react';
import { Navigate } from 'react-router-dom';
import { AUTH_STATES } from '@/context/AuthProvider.jsx';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, authState, userProfile }) => {
  if (authState === AUTH_STATES.UNAUTHENTICATED) {
    return <Navigate to="/login" replace />;
  }

  if (authState === AUTH_STATES.LOADING) {
    return <div className="flex justify-center items-center min-h-screen bg-background"><Loader2 className="h-24 w-24 animate-spin text-primary" /></div>;
  }

  if ((authState === AUTH_STATES.AUTHENTICATED || authState === AUTH_STATES.COMPANY_SELECTION_PENDING) && userProfile) {
    return children;
  }

  return <div className="flex justify-center items-center min-h-screen bg-background"><Loader2 className="h-24 w-24 animate-spin text-primary" /></div>;
};

export default ProtectedRoute;