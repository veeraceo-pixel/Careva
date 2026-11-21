// Turns "how often" text into reminder times, and tracks which doses were taken (per device).
export const timesFor = (freq = '') => {
  const f = freq.toLowerCase();
  const p = f.match(/(\d(?:\.\d)?)\s*[-–]\s*(\d(?:\.\d)?)\s*[-–]\s*(\d(?:\.\d)?)/);
  if (p) return ['08:00', '14:00', '21:00'].filter((_, i) => +p[i + 1] > 0).join(',');
  if (/\b(sos|prn)\b|as needed/.test(f)) return '';
  if (/\b(qds|qid)\b|four times|\b4 times/.test(f)) return '08:00,12:00,16:00,20:00';
  if (/\b(tds|tid)\b|thrice|three times|\b3 times/.test(f)) return '08:00,14:00,20:00';
  if (/\b(bd|bid)\b|twice|two times|\b2 times/.test(f)) return '08:00,20:00';
  if (/\bhs\b|night|bedtime/.test(f)) return '21:00';
  if (/evening/.test(f)) return '18:00';
  if (/\bod\b|once|daily|morning/.test(f)) return '08:00';
  return '';
};
export const courseDays = (d = '') => { const m = String(d).toLowerCase().match(/(\d+)\s*(day|week|month)/); return m ? +m[1] * { day: 1, week: 7, month: 30 }[m[2]] : 0; };
export const addDays = (iso, n) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
export const endDate = (start, duration) => { const n = courseDays(duration); return start && n ? addDays(start, n - 1) : null; };
export const isActive = (m, day) => (!m.start_date || m.start_date <= day) && (!m.end_date || m.end_date >= day);
export const timeList = m => (m.times || '').split(',').map(s => s.trim()).filter(t => /^\d{1,2}:\d{2}$/.test(t)).map(t => t.padStart(5, '0'));
const TK = d => 'careva.taken.' + d;
export const takenList = d => { try { return JSON.parse(localStorage.getItem(TK(d))) || []; } catch { return []; } };
export const setTaken = (d, key, on) => { const a = takenList(d).filter(x => x !== key); if (on) a.push(key); localStorage.setItem(TK(d), JSON.stringify(a)); };
