// Spoken + beep + popup reminders for medicines and follow-ups. They work while Careva is open in a browser tab.
import { listAll } from './storage.js';
import { today, daysTo, esc, fmt } from '../utils/format.js';
import { isActive, timeList, takenList, setTaken } from '../utils/schedule.js';
const ON = 'careva.alerts';
let ctx = null, timer = null, data = { meds: [], visits: [], members: [] }, loadedAt = 0, snooze = {};
export const alertsOn = () => localStorage.getItem(ON) === '1';
const audio = () => { try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); return ctx; } catch { return null; } };
document.addEventListener('pointerdown', () => { if (alertsOn()) audio()?.resume(); });

export async function enableAlerts() {
  const c = audio(); try { await c?.resume(); } catch {}
  let perm = 'unsupported'; if ('Notification' in window) perm = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  localStorage.setItem(ON, '1'); beep(); speak('Careva alerts are on'); await refreshReminders(); return perm;
}
export const disableAlerts = () => localStorage.setItem(ON, '0');
function beep(n = 3) {
  if (!ctx) return;
  for (let i = 0; i < n; i++) { const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + i * .45; o.frequency.value = 880; o.connect(g); g.connect(ctx.destination); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.4, t + .03); g.gain.exponentialRampToValueAtTime(.0001, t + .35); o.start(t); o.stop(t + .4); }
}
function speak(t) { try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = 'en-GB'; speechSynthesis.speak(u); } catch {} }
const firedGet = day => { try { const f = JSON.parse(localStorage.getItem('careva.fired')); return f && f.day === day ? f.keys : []; } catch { return []; } };
const firedAdd = (day, k) => localStorage.setItem('careva.fired', JSON.stringify({ day, keys: [...firedGet(day), k] }));
const firedDel = (day, k) => localStorage.setItem('careva.fired', JSON.stringify({ day, keys: firedGet(day).filter(x => x !== k) }));

export async function refreshReminders() { try { data = { meds: await listAll('medicines'), visits: await listAll('visits'), members: await listAll('members') }; loadedAt = Date.now(); } catch {} }
export async function startReminders() { if (timer) return; await refreshReminders(); timer = setInterval(tick, 20000); tick(); }

function fire({ day, key, title, text, dose }) {
  firedAdd(day, key);
  let box = document.getElementById('alerts'); if (!box) { box = document.createElement('div'); box.id = 'alerts'; box.className = 'alerts'; document.body.append(box); }
  const el = document.createElement('div'); el.className = 'alert'; el.setAttribute('role', 'alertdialog');
  el.innerHTML = `<b>🔔 ${esc(title)}</b><p>${esc(text)}</p>${ctx && ctx.state !== 'running' ? '<p class="sm">Sound is blocked. Click anywhere on the page to allow it.</p>' : ''}<div class="row">${dose ? '<button class="btn sm" data-ok>Taken</button><button class="btn sm ghost" data-snz>Snooze 10 min</button>' : ''}<button class="btn sm ghost" data-x>Dismiss</button></div>`;
  box.append(el);
  el.querySelector('[data-x]').onclick = () => el.remove();
  if (dose) {
    el.querySelector('[data-ok]').onclick = () => { setTaken(day, key, true); el.remove(); window.dispatchEvent(new Event('careva:taken')); };
    el.querySelector('[data-snz]').onclick = () => { snooze[key] = Date.now() + 600000; firedDel(day, key); el.remove(); };
  }
  beep(); speak(`${title}. ${text}`);
  try { if ('Notification' in window && Notification.permission === 'granted') new Notification(title, { body: text }); } catch {}
}
async function tick() {
  if (!alertsOn()) return;
  if (Date.now() - loadedAt > 120000) await refreshReminders();
  const now = new Date(), day = today(), mins = now.getHours() * 60 + now.getMinutes(), fired = firedGet(day), taken = takenList(day);
  const who = id => data.members.find(m => m.id === id)?.name || '';
  for (const m of data.meds) {
    if (!isActive(m, day)) continue;
    for (const t of timeList(m)) {
      const key = `${m.id}@${t}`, due = +t.slice(0, 2) * 60 + +t.slice(3);
      if (mins < due || mins > due + 90 || fired.includes(key) || taken.includes(key) || (snooze[key] && Date.now() < snooze[key])) continue;
      fire({ day, key, dose: true, title: `Time for ${m.name}${m.dose ? ' ' + m.dose : ''}`, text: `${who(m.member_id) ? who(m.member_id) + ': ' : ''}${m.frequency || 'scheduled'} (${t})` });
    }
  }
  for (const v of data.visits) {
    const d = daysTo(v.date), key = `v:${v.id}:${d}`; if (fired.includes(key)) continue;
    const place = [v.doctor, v.hospital].filter(Boolean).join(', ');
    if (d === 1 && mins >= 9 * 60) fire({ day, key, title: 'Follow-up tomorrow', text: `${who(v.member_id) ? who(v.member_id) + ': ' : ''}${v.reason} on ${fmt(v.date)}${place ? ' with ' + place : ''}` });
    else if (d === 0 && mins >= 8 * 60) fire({ day, key, title: 'Follow-up today', text: `${who(v.member_id) ? who(v.member_id) + ': ' : ''}${v.reason}${place ? ' with ' + place : ''}` });
  }
}
