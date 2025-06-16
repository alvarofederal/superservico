import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Loader2, WifiOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth.js';
import { AUTH_STATES } from '@/context/AuthProvider.jsx';
import AuthLayout from '@/components/auth/AuthLayout';
import LoginPage from '@/components/auth/LoginPage';
import RegisterPage from '@/components/auth/RegisterPage';
import ForgotPasswordPage from '@/components/auth/ForgotPasswordPage';
import UpdatePasswordPage from '@/components/auth/UpdatePasswordPage';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from './ProtectedRoute';
import LandingPage from '@/pages/LandingPage';

const AppRouter = () => {
  const { authState, userProfile } = useAuth();

  if (authState === AUTH_STATES.LOADING) {
    return <div className="flex justify-center items-center min-h-screen bg-background"><Loader2 className="h-24 w-24 animate-spin text-primary" /></div>;
  }

  if (authState === AUTH_STATES.SUPABASE_CONNECTION_ERROR) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-background text-foreground p-8">
        <WifiOff className="h-24 w-24 text-destructive mb-6" />
        <h1 className="text-3xl font-bold text-center mb-4">Erro de Conexão</h1>
        <p className="text-lg text-muted-foreground text-center max-w-md">Não foi possível conectar aos nossos serviços.</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={authState === AUTH_STATES.UNAUTHENTICATED ? <LandingPage /> : <Navigate to="/app" />} />
      <Route path="/login" element={authState === AUTH_STATES.UNAUTHENTICATED ? <AuthLayout><LoginPage /></AuthLayout> : <Navigate to="/app" />} />
      <Route path="/register" element={authState === AUTH_STATES.UNAUTHENTICATED ? <AuthLayout><RegisterPage /></AuthLayout> : <Navigate to="/app" />} />
      <Route path="/forgot-password" element={<AuthLayout><ForgotPasswordPage /></AuthLayout>} />
      <Route path="/update-password" element={<AuthLayout><UpdatePasswordPage /></AuthLayout>} />

      <Route 
        path="/app"
        element={
          <ProtectedRoute authState={authState} userProfile={userProfile}>
            <MainLayout />
          </ProtectedRoute>
        }
      />
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRouter;