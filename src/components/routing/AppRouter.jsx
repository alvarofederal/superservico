import React, { useState } from 'react';
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
import PricingPage from '@/pages/PricingPage'; 
import PaymentPage from '@/pages/PaymentPage';
import BlogPage from '@/pages/BlogPage';
import BlogPostEditor from '@/components/blog/BlogPostEditor';
import BlogManager from '@/components/blog/BlogManager';
import { Button } from '@/components/ui/button';


const AppRouter = () => {
  const { authState, userProfile, refreshAuthData } = useAuth();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    await refreshAuthData(false);
    setIsRetrying(false);
  };

  if (authState === AUTH_STATES.LOADING) {
    return <div className="flex justify-center items-center min-h-screen bg-background"><Loader2 className="h-24 w-24 animate-spin text-primary" /></div>;
  }

  if (authState === AUTH_STATES.SUPABASE_CONNECTION_ERROR) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-background text-foreground p-8 text-center">
        <WifiOff className="h-24 w-24 text-destructive mb-6" />
        <h1 className="text-3xl font-bold text-center mb-4">Erro de Conexão</h1>
        <p className="text-lg text-muted-foreground max-w-md mb-8">Não foi possível conectar aos nossos serviços. Verifique sua conexão com a internet e tente novamente.</p>
        <Button onClick={handleRetry} disabled={isRetrying} size="lg">
          {isRetrying ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
          Tentar Novamente
        </Button>
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
      <Route path="/pricing" element={<PricingPage />} />
      
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/blog/:slug" element={<BlogPage />} />

      <Route path="/payment" element={
          <ProtectedRoute authState={authState} userProfile={userProfile}>
            <PaymentPage />
          </ProtectedRoute>
        } 
      />


      <Route 
        path="/app/*"
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