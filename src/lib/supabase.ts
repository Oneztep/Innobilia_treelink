/**
 * Supabase client — configured from Vite env vars.
 * VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env.local
 * and in Vercel / GitHub Actions environment variables.
 *
 * Si las vars no están disponibles en el entorno de build, se usa un cliente
 * "noop" que nunca lanza excepción — la app corre en modo offline (localStorage).
 */
import { createClient } from '@supabase/supabase-js';

let supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
// Clean the URL: strip /rest/v1/ suffix or trailing slash if present
supabaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');

const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

const OFFLINE_MODE = !supabaseUrl || !supabaseAnonKey;

if (OFFLINE_MODE) {
  console.warn('[innobilia] Supabase env vars not set — running in offline mode (localStorage only).');
}

// Fallback URL/key válidos para evitar que createClient() lance excepción
// cuando las variables de entorno no están configuradas en el servidor.
const SAFE_URL = supabaseUrl || 'https://placeholder.supabase.co';
const SAFE_KEY = supabaseAnonKey || 'placeholder-anon-key-that-will-not-be-used';

export const supabase = createClient(SAFE_URL, SAFE_KEY);
export { OFFLINE_MODE };
