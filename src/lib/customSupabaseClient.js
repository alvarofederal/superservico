import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iweylscfpsfcmfhorfmr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3ZXlsc2NmcHNmY21maG9yZm1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MTM0NzAsImV4cCI6MjA2NTA4OTQ3MH0.5Qf9YQZi2cnYYhbWhXvX2bVe3VkFEw31DMqwQjbXf0U';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);