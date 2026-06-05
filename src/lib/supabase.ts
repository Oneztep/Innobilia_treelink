/**
 * Supabase client — configured from Vite env vars.
 * VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env.local
 * and in Vercel Environment Variables.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[innobilia] Supabase env vars not set — running in offline mode (localStorage only).');
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '');
