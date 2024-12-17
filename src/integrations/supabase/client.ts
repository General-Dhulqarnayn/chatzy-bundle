import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ndznjiqqgswtnultlxkz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kem5qaXFxZ3N3dG51bHRseGt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDI4NDQ4MDAsImV4cCI6MjAxODQyMDgwMH0.qqzW_5yBs8a9v_L5YJ3rxvHl18qQaptJjzQXixJ9YAY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});