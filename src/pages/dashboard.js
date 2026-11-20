import { list } from '../services/storage.js';
import { esc, fmt, today, daysTo, when } from '../utils/format.js';
export default async function (root, { user }) {
  const [meds, visits, rx] = await Promise.all([list('medicines'), list('visits'), list('prescriptions')]);
  const key = 'careva.taken.' + today(); let taken = []; try { taken = JSON.parse(localStorage.getItem(key)) || []; } catch {}
  const next = visits.filter(v => daysTo(v.date) >= 0).sort((a, b) => a.date < b.date ? -1 : 1).slice(0, 4);
  root.innerHTML = `<h2>Hello, ${esc((user.name || '').split(' ')[0])}</h2><p class="mut">Today at a glance.</p>
  <div class="grid g3" style="margin:1rem 0"><div class="card"><h3>${meds.length}</h3><p class="mut sm">Medicines</p></div><div class="card"><h3>${rx.length}</h3><p class="mut sm">Prescriptions</p></div><div class="card"><h3>${next.length}</h3><p class="mut sm">Upcoming visits</p></div></div>
  <div class="grid g2"><div class="card"><h3>Today’s medicines</h3>${meds.length ? meds.map(m => `<div class="item"><div><b>${esc(m.name)}</b> <span class="mut sm">${esc(m.dose)} ${esc(m.frequency)}</span></div><button class="btn sm ${taken.includes(m.id) ? '' : 'ghost'}" data-t="${m.id}">${taken.includes(m.id) ? 'Taken ✓' : 'Mark taken'}</button></div>`).join('') : '<p class="mut">No medicines yet. Upload a prescription to add them.</p>'}</div>
  <div class="card"><h3>Upcoming visits</h3>${next.length ? next.map(v => `<div class="item"><div><b>${esc(v.reason)}</b><p class="mut sm">${fmt(v.date)}${v.hospital ? ' · ' + esc(v.hospital) : ''}</p></div>${when(v.date)}</div>`).join('') : '<p class="mut">Nothing booked.</p>'}</div></div>`;
  root.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { const id = b.dataset.t; taken = taken.includes(id) ? taken.filter(x => x !== id) : [...taken, id]; localStorage.setItem(key, JSON.stringify(taken)); b.className = 'btn sm' + (taken.includes(id) ? '' : ' ghost'); b.textContent = taken.includes(id) ? 'Taken ✓' : 'Mark taken'; });
}
