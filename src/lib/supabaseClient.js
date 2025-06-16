import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iweylscfpsfcmfhorfmr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3ZXlsc2NmcHNmY21maG9yZm1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MTM0NzAsImV4cCI6MjA2NTA4OTQ3MH0.5Qf9YQZi2cnYYhbWhXvX2bVe3VkFEw31DMqwQjbXf0U';

// This is a failsafe for environments where the keys might not be provided.
const createSupabaseClient = () => {
  if (supabaseUrl && supabaseAnonKey) {
    try {
      return createClient(supabaseUrl, supabaseAnonKey);
    } catch (error) {
      console.error("Error creating Supabase client:", error);
    }
  }
  
  console.warn("Supabase URL or Anon Key not provided. Supabase is disconnected.");
  const mockClient = {
    auth: {
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      getSession: async () => ({ data: { session: null }, error: { message: "Supabase not configured" } }),
      signInWithPassword: async () => ({ error: { message: "Supabase not configured" } }),
      signOut: async () => ({ error: { message: "Supabase not configured" } }),
    },
    from: () => ({
      select: async () => ({ error: { message: "Supabase not configured" } }),
      insert: async () => ({ error: { message: "Supabase not configured" } }),
      update: async () => ({ error: { message: "Supabase not configured" } }),
      delete: async () => ({ error: { message: "Supabase not configured" } }),
    }),
    rpc: async () => ({ error: { message: "Supabase not configured" } })
  };
  return mockClient;
}

export const supabase = createSupabaseClient();