import { supabase, configured } from './supabase.js';
const L = 'careva.user';
export const demo = (email = 'demo@careva.app', name = 'Demo') => localStorage.setItem(L, JSON.stringify({ id: 'local', email, name }));
export async function getUser() {
  if (!configured) { try { return JSON.parse(localStorage.getItem(L)); } catch { return null; } }
  const { data } = await supabase.auth.getSession();
  const u = data.session?.user; return u ? { id: u.id, email: u.email, name: u.user_metadata?.name || u.email } : null;
}
export async function signIn(email, password) {
  if (!configured) return demo(email, email.split('@')[0]);
  const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw error;
}
export async function signUp(email, password, name) {
  if (!configured) return demo(email, name);
  const { error, data } = await supabase.auth.signUp({ email, password, options: { data: { name } } }); if (error) throw error;
  if (!data.session) throw new Error('Check your email to confirm your account, then sign in.');
}
export async function signOut() { if (configured) await supabase.auth.signOut(); localStorage.removeItem(L); }
