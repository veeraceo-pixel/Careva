import { createClient } from '@supabase/supabase-js';
// Forgiving setup: trims spaces/quotes and never crashes the whole app if a value is wrong.
const clean = v => (v || '').trim().replace(/^["']|["']$/g, '');
const url = clean(import.meta.env.VITE_SUPABASE_URL), key = clean(import.meta.env.VITE_SUPABASE_ANON_KEY);
let client = null, problem = '';
if (url || key) {
  try { const u = new URL(url); if (u.protocol !== 'https:' || !key) throw new Error('bad'); client = createClient(u.origin, key); }
  catch { problem = 'Supabase settings look wrong (check VITE_SUPABASE_URL is like https://xxxx.supabase.co and the key is set). Running in demo mode.'; }
}
export const configured = !!client;
export const supabase = client;
export const configProblem = problem;
