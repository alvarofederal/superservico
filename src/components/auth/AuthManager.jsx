import React, { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { AUTH_STATES } from '@/hooks/useAuth'; // Corrected import path

const AuthManager = ({ onAuthStateChange, setAppState }) => {
  const fetchUserProfile = useCallback(async (userId) => {
    if (!userId) return null;
    try {
      const { data, error, status } = await supabase
        .from('profiles')
        .select('id, full_name, role, avatar_url')
        .eq('id', userId)
        .single();
      
      if (error && status === 406) { 
        console.warn(`AuthManager: Profile not found for user ${userId}. This is expected for new users before the trigger runs.`);
        return null; 
      }
      if (error) throw error; 
      return data;
    } catch (error) {
      console.error('AuthManager: Error fetching user profile:', error);
      if (error.status !== 406 && error.code !== 'PGRST116') { 
         toast({ title: "Erro ao buscar perfil", description: error.message, variant: "destructive" });
      }
      return null;
    }
  }, []);

  useEffect(() => {
    if (!supabase || !supabase.auth || typeof supabase.auth.onAuthStateChange !== 'function' || 
        (typeof supabase.auth.getSession === 'function' && supabase.auth.getSession.toString().includes("Supabase not configured"))
    ) {
      console.error("AuthManager: Supabase client not properly configured or disconnected.");
      onAuthStateChange(null, null, { message: "Cliente Supabase não configurado." });
      if (setAppState) setAppState(AUTH_STATES.SUPABASE_CONNECTION_ERROR); // Ensure state is updated
      return;
    }
    
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('AuthManager: onAuthStateChange event:', _event, 'Session:', !!session);
      let profile = null;
      if (session?.user) {
        profile = await fetchUserProfile(session.user.id);
        if (!profile && (_event === 'SIGNED_IN' || _event === 'INITIAL_SESSION' || _event === 'USER_UPDATED')) {
          console.log(`AuthManager: Profile not found for user ${session.user.id} on event ${_event}. Waiting for 'handle_new_user' trigger...`);
          await new Promise(resolve => setTimeout(resolve, 4500)); // Increased delay for trigger
          profile = await fetchUserProfile(session.user.id);
          if (profile) {
            console.log(`AuthManager: Profile successfully fetched after delay for user ${session.user.id}.`);
          } else {
            console.warn(`AuthManager: Profile STILL not found after delay for user ${session.user.id}. This might indicate an issue with the 'handle_new_user' trigger, RLS on 'profiles' table, or missing user_meta_data during signup.`);
             toast({ title: "Atenção", description: "Perfil do usuário não encontrado. Se você acabou de se registrar, pode levar um momento. Caso contrário, contate o suporte.", variant: "default", duration: 8000});
          }
        }
      }
      onAuthStateChange(session, profile, null);
    });

    const initializeAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          onAuthStateChange(null, null, sessionError); 
          return;
        }
        if (!session) {
            onAuthStateChange(null, null, null); 
        }
         // If session exists, onAuthStateChange will be triggered and handle profile fetching.
      } catch (e) {
        onAuthStateChange(null, null, e); 
      }
    };

    initializeAuth();

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [onAuthStateChange, fetchUserProfile, setAppState]); // Added setAppState to dependencies if it's used

  return null; 
};

export default AuthManager;