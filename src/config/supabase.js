/**
 * Supabase client for billing auth (self-hosted GoTrue via Kong).
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://supabase.minaki.me';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  console.warn(
    'VITE_SUPABASE_ANON_KEY is missing — login will fail until Infisical/Vite env is set'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey || 'missing-anon-key', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});

export default supabase;
