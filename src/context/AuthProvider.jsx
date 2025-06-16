import React, { useState, useEffect, useCallback, useContext, createContext } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';

export const AUTH_STATES = {
  LOADING: 'LOADING',
  AUTHENTICATED: 'AUTHENTICATED',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  PASSWORD_RECOVERY: 'PASSWORD_RECOVERY',
  SUPABASE_CONNECTION_ERROR: 'SUPABASE_CONNECTION_ERROR',
  COMPANY_SELECTION_PENDING: 'COMPANY_SELECTION_PENDING', 
};

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState(AUTH_STATES.LOADING);
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [userCompanies, setUserCompanies] = useState([]); 

  const fetchUserProfile = useCallback(async (userId) => {
    if (!userId) return null;
    try {
      const { data, error, status } = await supabase
        .from('profiles')
        .select('id, full_name, role, avatar_url, current_company_id, company_id') 
        .eq('id', userId)
        .single();
      
      if (error) {
        if (status === 406) return null; 
        throw error;
      }
      return data;
    } catch (error) {
      console.error("useAuth: Error fetching user profile:", error);
      if (error.status !== 406) {
          toast({ title: "Erro ao buscar perfil", description: `Falha: ${error.message || 'Erro desconhecido.'}`, variant: "destructive" });
      }
      setAuthError(error);
      return null;
    }
  }, []);

  const fetchUserCompanies = useCallback(async (userId) => {
    if (!userId) return [];
    try {
      const { data, error } = await supabase.rpc('get_user_companies_with_details', {
        user_id_param: userId
      });

      if (error) throw error;
      return (data || []).map(c => ({
        id: c.company_id,
        name: c.company_name,
        owner_id: c.company_owner_id,
        role_in_company: c.user_role_in_company
      }));
    } catch (error) {
      console.error("useAuth: Error fetching user companies via RPC:", error);
      toast({ title: "Erro ao buscar empresas do usuário", description: error.message, variant: "destructive" });
      return [];
    }
  }, []);

  const setCurrentCompanyInProfile = useCallback(async (userId, companyId) => {
    if (!userId) return false;
    try {
        const { error } = await supabase
            .from('profiles')
            .update({ current_company_id: companyId, updated_at: new Date().toISOString() })
            .eq('id', userId);
        if (error) throw error;
        setUserProfile(prev => prev ? { ...prev, current_company_id: companyId } : null);
        toast({ title: "Contexto da Empresa Atualizado!" });
        return true;
    } catch (error) {
        console.error("useAuth: Error setting current company:", error);
        toast({ title: "Erro ao definir empresa atual", description: error.message, variant: "destructive" });
        return false;
    }
  }, []);

  const handleLogout = async () => {
    setAuthState(AUTH_STATES.LOADING); 
    const { error } = await supabase.auth.signOut();
    setUserProfile(null); 
    setSession(null);
    setUserCompanies([]);
    if (error) {
      toast({ title: "Erro no Logout", description: error.message, variant: "destructive" });
      setAuthError(error);
    } else {
      toast({ title: "Logout realizado!"});
    }
    setAuthState(AUTH_STATES.UNAUTHENTICATED);
  };
  
  const selectCompany = async (companyId) => {
    if (userProfile && userProfile.id) {
      setAuthState(AUTH_STATES.LOADING); 
      const success = await setCurrentCompanyInProfile(userProfile.id, companyId);
      if (success) {
        const updatedProfile = await fetchUserProfile(userProfile.id); 
        setUserProfile(updatedProfile); 
        setAuthState(AUTH_STATES.AUTHENTICATED);
      } else {
        setAuthState(AUTH_STATES.AUTHENTICATED); 
        toast({title: "Falha ao trocar de empresa", variant: "destructive"});
      }
    }
  };

  const refreshAuthData = useCallback(async () => {
     if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setUserProfile(profile);
        if (profile) {
            const companies = await fetchUserCompanies(session.user.id);
            setUserCompanies(companies);
        }
     }
  }, [session, fetchUserProfile, fetchUserCompanies]);


  useEffect(() => {
    setAuthError(null);
    if (!supabase || !supabase.auth) {
        setAuthState(AUTH_STATES.SUPABASE_CONNECTION_ERROR);
        return;
    }
    
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      setSession(currentSession);
      setAuthError(null);

      if (_event === 'PASSWORD_RECOVERY') {
        setAuthState(AUTH_STATES.PASSWORD_RECOVERY);
        setUserProfile(null);
        setUserCompanies([]);
        return;
      }
      
      if (currentSession?.user) {
        let profile = await fetchUserProfile(currentSession.user.id);
        
        if (!profile && (_event === 'SIGNED_IN' || _event === 'INITIAL_SESSION')) {
            await new Promise(resolve => setTimeout(resolve, 4000));
            profile = await fetchUserProfile(currentSession.user.id);
        }
        
        setUserProfile(profile);

        if (profile) {
           const companies = await fetchUserCompanies(currentSession.user.id);
           setUserCompanies(companies);
           
           if (companies.length > 0 && !profile.current_company_id) {
             const companyToSet = companies[0]?.id; 
             const success = await setCurrentCompanyInProfile(profile.id, companyToSet);
             setAuthState(success ? AUTH_STATES.AUTHENTICATED : AUTH_STATES.COMPANY_SELECTION_PENDING);
           } else if (companies.length === 0 && (profile.role === 'technician' || profile.role === 'admin')) {
             setAuthState(AUTH_STATES.COMPANY_SELECTION_PENDING);
           } else {
             setAuthState(AUTH_STATES.AUTHENTICATED);
           }
        } else {
            if (_event !== 'SIGNED_OUT') { 
                toast({ title: "Erro de Perfil", description: "Não foi possível carregar seu perfil. Tente logar novamente.", variant: "destructive" });
                await supabase.auth.signOut();
            }
            setAuthState(AUTH_STATES.UNAUTHENTICATED);
        }
      } else { 
         setUserProfile(null);
         setUserCompanies([]);
         setAuthState(AUTH_STATES.UNAUTHENTICATED);
      }
    });

    return () => { authListener?.subscription.unsubscribe(); };
  }, [fetchUserProfile, fetchUserCompanies, setCurrentCompanyInProfile]);

  const value = {
    authState,
    session,
    userProfile,
    userCompanies,
    authError,
    handleLogout,
    selectCompany,
    refreshAuthData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};