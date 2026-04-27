import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://xxxxxxxxxxxxxxxxxxxx.supabase.co'
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── AUTHENTICATION BOOTSTRAP ───────────────────────────
async function ensureSession() {
  if (supabaseUrl.includes('xxxxxxxxxxxxxxxxxxxx')) return;
  try {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) {
          console.warn("Anonymous auth not enabled or failed. Ensure you've disabled RLS or logged in if testing.", error.message);
      }
    }
  } catch (err) {
    console.warn("Supabase ensureSession failed:", err);
  }
}
ensureSession();
