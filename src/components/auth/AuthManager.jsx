import React, { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { AUTH_STATES } from '@/context/AuthProvider'; 

const AuthManager = ({ onAuthStateChange, setAppState }) => {
  const fetchUserProfile = useCallback(async (userId) => {
    if (!userId) return null;
    try {
      const { data, error, status } = await supabase
        .from('profiles')
        .select('id, full_name, role, avatar_url, current_company_id') // CRITICAL: Absolutely NO 'email' here
        .eq('id', userId)
        .single();
      
      if (error && status === 406) { 
        console.warn(`AuthManager: Profile not found for user ${userId} (PGRST116/406). This is expected for new users before the trigger creates the profile.`);
        return null; 
      }
      if (error && error.code !== 'PGRST116') { 
        console.error('AuthManager: Error fetching user profile:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('AuthManager: Catch block - Error fetching user profile:', error);
      if (error.status !== 406 && error.code !== 'PGRST116') { 
         toast({ title: "Erro ao buscar perfil (AuthManager)", description: error.message, variant: "destructive" });
      }
      return null;
    }
  }, []);

  useEffect(() => {
    const checkSupabaseConnection = async () => {
      if (!supabase || !supabase.auth || typeof supabase.auth.onAuthStateChange !== 'function') {
        console.error("AuthManager: Supabase client 'auth' module not properly configured or 'onAuthStateChange' is not a function.");
        onAuthStateChange(null, null, { message: "Cliente Supabase (auth) não configurado." });
        if (setAppState) setAppState(AUTH_STATES.SUPABASE_CONNECTION_ERROR);
        return false;
      }

      try {
        const { error } = await supabase.auth.getSession();
        if (error && error.message.toLowerCase().includes("supabase not configured")) {
          console.error("AuthManager: Supabase client getSession indicates not configured.");
          onAuthStateChange(null, null, { message: "Cliente Supabase não configurado (getSession)." });
          if (setAppState) setAppState(AUTH_STATES.SUPABASE_CONNECTION_ERROR);
          return false;
        }
      } catch (e) {
        console.error("AuthManager: Error during Supabase getSession check:", e);
        onAuthStateChange(null, null, { message: "Erro ao verificar sessão Supabase." });
        if (setAppState) setAppState(AUTH_STATES.SUPABASE_CONNECTION_ERROR);
        return false;
      }
      return true;
    };

    const initialize = async () => {
      const isConnected = await checkSupabaseConnection();
      if (!isConnected) return;

      const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        console.log('AuthManager: onAuthStateChange event:', _event, 'Session:', !!session);
        let profile = null;
        if (session?.user) {
          profile = await fetchUserProfile(session.user.id);
          if (!profile && (_event === 'SIGNED_IN' || _event === 'INITIAL_SESSION' || _event === 'USER_UPDATED')) {
            console.log(`AuthManager: Profile not found for user ${session.user.id} on event ${_event}. Waiting for 'handle_new_user' trigger...`);
            await new Promise(resolve => setTimeout(resolve, 4500));
            profile = await fetchUserProfile(session.user.id);
            if (profile) {
              console.log(`AuthManager: Profile successfully fetched after delay for user ${session.user.id}.`);
            } else {
              console.warn(`AuthManager: Profile STILL not found after delay for user ${session.user.id}. This might indicate an issue with the 'handle_new_user' trigger, RLS on 'profiles' table, or missing user_meta_data during signup.`);
               toast({ title: "Atenção", description: "Perfil do usuário não encontrado. Se você acabou de se registrar, pode levar um momento. Caso contrário, contate o suporte.", variant: "default", duration: 8000});
            }
          }
        }
        // Pass the raw user object from session and the fetched profile separately
        onAuthStateChange(session, profile, null); 
      });

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          onAuthStateChange(null, null, sessionError); 
          return;
        }
        if (!session) {
            onAuthStateChange(null, null, null); 
        }
      } catch (e) {
        onAuthStateChange(null, null, e); 
      }
      
      return () => {
        if (authListener && authListener.subscription) {
          authListener.subscription.unsubscribe();
        }
      };
    };

    let unsubscribeFunction;
    initialize().then(cleanup => {
      unsubscribeFunction = cleanup;
    });
    
    return () => {
      if (typeof unsubscribeFunction === 'function') {
        unsubscribeFunction();
      }
    };

  }, [onAuthStateChange, fetchUserProfile, setAppState]);

  return null; 
};

export default AuthManager;