import { supabase, configured } from './supabase.js';
const ls = t => { try { return JSON.parse(localStorage.getItem('careva.' + t)) || []; } catch { return []; } };
const lw = (t, r) => localStorage.setItem('careva.' + t, JSON.stringify(r));
const scoped = t => !['members', 'messages'].includes(t);
const read = f => new Promise(r => { const x = new FileReader(); x.onload = () => r(x.result); x.readAsDataURL(f); });
export const member = { get: () => localStorage.getItem('careva.member'), set: id => localStorage.setItem('careva.member', id) };

export async function list(t) {
  let rows;
  if (configured) { const { data, error } = await supabase.from(t).select('*').order('created_at', { ascending: false }); if (error) throw error; rows = data; }
  else rows = ls(t);
  return scoped(t) && member.get() ? rows.filter(r => r.member_id === member.get()) : rows;
}
export async function add(t, row) {
  row = { ...row }; if (scoped(t)) row.member_id = member.get();
  if (configured) {
    const { data: { user } } = await supabase.auth.getUser(); row.user_id = user.id;
    const { data, error } = await supabase.from(t).insert(row).select().single(); if (error) throw error; return data;
  }
  row = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...row }; lw(t, [row, ...ls(t)]); return row;
}
export async function remove(t, id) {
  if (configured) { const { error } = await supabase.from(t).delete().eq('id', id); if (error) throw error; }
  else lw(t, ls(t).filter(r => r.id !== id));
}
export async function upload(file) {
  if (!file || !file.size) return null;
  if (configured) {
    const { data: { user } } = await supabase.auth.getUser();
    const path = `${user.id}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, '_')}`;
    const { error } = await supabase.storage.from('records').upload(path, file); if (error) throw error; return path;
  }
  return read(file);
}
export async function fileUrl(p) {
  if (!p || !configured || p.startsWith('data:')) return p || '';
  const { data } = await supabase.storage.from('records').createSignedUrl(p, 3600); return data?.signedUrl || '';
}
// Reads a prescription image. Tries the Supabase edge function first (if set up),
// then falls back to in-browser OCR so it works with no backend. Returns null if nothing could be read.
export async function extract(file, onProgress) {
  if (!file.type.startsWith('image/')) return null;
  if (configured) {
    try {
      const image = (await read(file)).split(',')[1];
      const { data, error } = await supabase.functions.invoke('extract-prescription', { body: { image, mediaType: file.type } });
      if (!error && data && (data.hospital || data.date || data.medicines?.length)) return data;
    } catch {}
  }
  try {
    const [{ ocr }, { parsePrescription }] = await Promise.all([import('../utils/ocr.js'), import('../utils/prescription-parser.js')]);
    return parsePrescription(await ocr(file, onProgress));
  } catch { return null; }
}
