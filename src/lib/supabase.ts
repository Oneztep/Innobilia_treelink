/**
 * Supabase client — configured from Vite env vars.
 * VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env.local
 * and in Vercel Environment Variables.
 */
import { createClient } from '@supabase/supabase-js';

let supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
// Clean the URL: strip /rest/v1/ suffix or trailing slash if present
supabaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');

const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseKey) {
  console.warn('[innobilia] Supabase env vars not set — running in offline mode (localStorage only).');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
