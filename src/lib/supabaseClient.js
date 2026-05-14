import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing required env var: REACT_APP_SUPABASE_URL. Check Vercel environment settings.');
}
if (!supabaseAnonKey) {
  throw new Error('Missing required env var: REACT_APP_SUPABASE_ANON_KEY. Check Vercel environment settings.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
