
import React, { createContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { getPlanLimits } from '@/config/planLimits.js';
import { fetchActiveLicenseDetails, fetchUserSessionData } from '@/services/authService.js';

export const AuthContext = createContext();

export const AUTH_STATES = {
  LOADING: 'LOADING',
  AUTHENTICATED: 'AUTHENTICATED',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  COMPANY_SELECTION_PENDING: 'COMPANY_SELECTION_PENDING',
  SUPABASE_CONNECTION_ERROR: 'SUPABASE_CONNECTION_ERROR',
};

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState(AUTH_STATES.LOADING);
  const [userProfile, setUserProfile] = useState(null);
  const [userCompanies, setUserCompanies] = useState([]);
  const [currentCompanyId, setCurrentCompanyId] = useState(null);
  const navigate = useNavigate();
  const isLoggingOut = useRef(false);
  
  const [activeLicense, setActiveLicense] = useState(null);
  const [isLoadingLicense, setIsLoadingLicense] = useState(true);
  const [errorLicense, setErrorLicense] = useState(null);
  const [isLoginFlowComplete, setIsLoginFlowComplete] = useState(false);

  const userProfileRef = useRef(userProfile);
  userProfileRef.current = userProfile;
  const userCompaniesRef = useRef(userCompanies);
  userCompaniesRef.current = userCompanies;

  const handleLogout = useCallback(async (messageType = "default", customMessage = null) => {
    if (isLoggingOut.current) return;
    isLoggingOut.current = true;

    const currentPath = window.location.pathname + window.location.search;
    if (!['/login', '/register', '/'].includes(window.location.pathname)) {
      localStorage.setItem('redirectPathOnLogin', currentPath);
    }
    
    // Always clean up client-side state regardless of server response
    const cleanupAndRedirect = () => {
      setUserProfile(null); 
      setUserCompanies([]); 
      setCurrentCompanyId(null); 
      setActiveLicense(null);
      setIsLoadingLicense(true); 
      setErrorLicense(null);
      setAuthState(AUTH_STATES.UNAUTHENTICATED);
      isLoggingOut.current = false;
      navigate('/login');
    };

    try {
      const { error } = await supabase.auth.signOut();
      
      if (error && error.message !== 'Session not found') {
        console.error("Error signing out:", error);
        toast({ title: "Erro no Logout", description: `Ocorreu um problema ao desconectar: ${error.message}`, variant: "destructive" });
      } else {
        if (customMessage) {
          toast({ title: "Sessão Encerrada", description: customMessage, variant: messageType });
        } else {
          toast({ title: "Logout Bem-Sucedido", description: "Você foi desconectado com segurança.", variant: "default" });
        }
      }
    } catch (e) {
      console.error("Unexpected error during signOut:", e);
      toast({ title: "Erro Inesperado no Logout", description: `Ocorreu um problema ao desconectar: ${e.message}`, variant: "destructive" });
    } finally {
      cleanupAndRedirect();
    }
  }, [navigate]); 

  const refreshLicenseData = useCallback(async (profile, companyId) => {
    setErrorLicense(null);
    const licenseDetails = await fetchActiveLicenseDetails(profile, companyId);
    setActiveLicense(licenseDetails.activeLicense);
    setErrorLicense(licenseDetails.errorLicense);
    setIsLoadingLicense(licenseDetails.isLoadingLicense);
    return licenseDetails;
  }, []);

  const refreshAuthData = useCallback(async (showToast = false, isBackground = false) => {
    if (!isBackground) {
      setAuthState(AUTH_STATES.LOADING);
      setIsLoadingLicense(true);
    }

    try {
      const { userProfile: newProfileData, userCompanies: newCompaniesData, currentCompanyId: newCurrentCompanyId } = await fetchUserSessionData();

      if (!newProfileData) {
        if (!isBackground) {
          setAuthState(AUTH_STATES.UNAUTHENTICATED);
          setUserProfile(null); setUserCompanies([]); setCurrentCompanyId(null); setActiveLicense(null); setIsLoadingLicense(false);
        }
        return;
      }

      if (isBackground) {
          const profileChanged = JSON.stringify(newProfileData) !== JSON.stringify(userProfileRef.current);
          const companiesChanged = JSON.stringify(newCompaniesData) !== JSON.stringify(userCompaniesRef.current);
          
          if (!profileChanged && !companiesChanged) {
              return;
          }
      }

      setUserProfile(newProfileData);
      setUserCompanies(newCompaniesData);
      setCurrentCompanyId(newCurrentCompanyId);
      await refreshLicenseData(newProfileData, newCurrentCompanyId);
      
      if (!isBackground) {
          let currentAuthState;
          if (newProfileData.role === 'admin') {
            currentAuthState = AUTH_STATES.AUTHENTICATED;
          } else if (newCurrentCompanyId) {
            currentAuthState = AUTH_STATES.AUTHENTICATED;
          } else {
            currentAuthState = newCompaniesData.length > 0 ? AUTH_STATES.COMPANY_SELECTION_PENDING : AUTH_STATES.AUTHENTICATED;
          }
          setAuthState(currentAuthState);
      }
      
      if (showToast) toast({ title: "Dados Sincronizados!", description: "Suas informações foram atualizadas."});
    
    } catch (error) {
      console.error("Auth Error:", error);

      const isInvalidTokenError = (error.message && (error.message.includes("Invalid Refresh Token") || 
                                   error.message.includes("Refresh Token Not Found") ||
                                   error.message.includes("Session from session_id claim in JWT does not exist"))) ||
                                   (error.error_code && (error.error_code === 'refresh_token_not_found' || error.error_code === 'session_not_found'));

      if (isInvalidTokenError) {
        handleLogout("destructive", "Sua sessão expirou ou é inválida. Por favor, faça o login novamente.");
        return;
      }
      
      setAuthState(currentAuthState => {
        if (error.message && (error.message.includes("Failed to fetch") || error.message.includes("network error"))) {
            toast({ title: "Erro de Conexão", description: "Não foi possível conectar ao servidor. Verifique sua internet.", variant: "destructive" });
            return AUTH_STATES.SUPABASE_CONNECTION_ERROR;
        }
        if (!isBackground) {
            toast({ title: "Aviso de Sessão", description: "Ocorreu um problema ao sincronizar sua sessão.", variant: "default" });
        }
        return currentAuthState;
      });
    } finally {
        if (!isBackground) {
            setIsLoadingLicense(false);
        }
    }
  }, [handleLogout, refreshLicenseData]);

  useEffect(() => {
    refreshAuthData(false, false);
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        await refreshAuthData(false, false);
        setIsLoginFlowComplete(true);
      } else if (event === 'SIGNED_OUT') {
        if (isLoggingOut.current) return;
        setUserProfile(null); 
        setUserCompanies([]); 
        setCurrentCompanyId(null); 
        setActiveLicense(null);
        setIsLoadingLicense(true); 
        setErrorLicense(null);
        setAuthState(AUTH_STATES.UNAUTHENTICATED);
      } else if (event === 'TOKEN_REFRESHED_ERROR' || event === 'USER_DELETED') {
        await handleLogout("destructive", "Sua sessão não pôde ser renovada ou sua conta foi alterada. Por favor, faça login novamente.");
      } else if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        await refreshAuthData(false, true);
      } else if (event === 'PASSWORD_RECOVERY') {
        navigate('/update-password');
      }
    });
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [refreshAuthData, handleLogout, navigate]);

  useEffect(() => {
    if (isLoginFlowComplete) {
      setIsLoginFlowComplete(false);

      const currentPath = window.location.pathname;
      const isAtPublicOrRootPage = ['/login', '/register', '/forgot-password', '/update-password', '/'].includes(currentPath);

      if (isAtPublicOrRootPage && (authState === AUTH_STATES.AUTHENTICATED || authState === AUTH_STATES.COMPANY_SELECTION_PENDING)) {
        const redirectPath = localStorage.getItem('redirectPathOnLogin');
        localStorage.removeItem('redirectPathOnLogin');
        
        const targetPath = (redirectPath && redirectPath !== '/') ? redirectPath : '/app';

        navigate(targetPath, { replace: true });
      }
    }
  }, [isLoginFlowComplete, authState, navigate]);

  const selectCompany = async (companyId) => {
    if (!userProfile) return;
    setAuthState(AUTH_STATES.LOADING);
    setIsLoadingLicense(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ current_company_id: companyId })
        .eq('id', userProfile.id);
      if (error) throw error;

      const selectedCompany = userCompanies.find(c => c.company_id === companyId);
      toast({ title: `Empresa Selecionada: ${selectedCompany?.company_name || 'Empresa'}`, description: "Os dados da empresa foram carregados." });
      
      setCurrentCompanyId(companyId); 
      const updatedProfile = { ...userProfile, current_company_id: companyId };
      setUserProfile(updatedProfile);
      
      await refreshLicenseData(updatedProfile, companyId);
      
      setAuthState(AUTH_STATES.AUTHENTICATED); 
      setIsLoadingLicense(false);

    } catch (error) {
      toast({ title: "Erro ao selecionar empresa", description: error.message, variant: "destructive" });
      setIsLoadingLicense(false); 
      if (userProfile?.role === 'admin') {
         setAuthState(AUTH_STATES.AUTHENTICATED);
      } else if (userProfile?.current_company_id) {
        setAuthState(AUTH_STATES.AUTHENTICATED);
      } else if (userCompanies && userCompanies.length > 0) {
        setAuthState(AUTH_STATES.COMPANY_SELECTION_PENDING);
      } else {
        setAuthState(AUTH_STATES.AUTHENTICATED); 
      }
    }
  };

  const hasAccess = useCallback((featureKey) => {
    if (isLoadingLicense) {
        return false;
    }
    if (userProfile?.role === 'admin' || (activeLicense?.features && activeLicense.features.includes('admin_full_access'))) {
      return true;
    }

    const planConfig = getPlanLimits(activeLicense?.planName);
    const planFeatures = planConfig?.features 
      ? Object.keys(planConfig.features).filter(key => planConfig.features[key] === true) 
      : [];

    const dbFeatures = (activeLicense?.features && Array.isArray(activeLicense.features)) 
      ? activeLicense.features 
      : [];

    const combinedFeatures = new Set([...planFeatures, ...dbFeatures]);

    return combinedFeatures.has(featureKey);
  }, [activeLicense, userProfile, isLoadingLicense]);

  const authContextValue = useMemo(() => ({
    authState,
    userProfile,
    userCompanies,
    currentCompanyId,
    selectCompany,
    refreshAuthData,
    logout: handleLogout,
    activeLicense,
    isLoadingLicense,
    errorLicense,
    hasAccess,
    refreshLicense: () => userProfile && (currentCompanyId || userProfile.role === 'admin') ? refreshLicenseData(userProfile, currentCompanyId) : Promise.resolve({ activeLicense: null, isLoadingLicense: false, errorLicense: null }),
  }), [
    authState, userProfile, userCompanies, currentCompanyId, selectCompany, 
    refreshAuthData, handleLogout, activeLicense, isLoadingLicense, errorLicense, 
    hasAccess, refreshLicenseData
  ]);

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};
