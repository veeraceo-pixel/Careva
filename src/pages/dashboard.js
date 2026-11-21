import { listAll, member } from '../services/storage.js';
import { esc, fmt, today, daysTo, when } from '../utils/format.js';
import { isActive, timeList, takenList, setTaken } from '../utils/schedule.js';
import { alertsOn } from '../services/reminders.js';

export default async function (root, { user, members }) {
  const [meds, rx, visits] = await Promise.all([listAll('medicines'), listAll('prescriptions'), listAll('visits')]);
  const day = today(), nm = id => members.find(m => m.id === id)?.name || 'Unknown';
  const active = meds.filter(m => isActive(m, day));
  const doses = active.flatMap(m => timeList(m).map(t => ({ m, t, key: `${m.id}@${t}` }))).sort((a, b) => a.t < b.t ? -1 : 1);
  const upcoming = visits.filter(v => daysTo(v.date) >= 0).sort((a, b) => a.date < b.date ? -1 : 1);
  function draw() {
    const taken = takenList(day), nowM = new Date().getHours() * 60 + new Date().getMinutes();
    const status = d => taken.includes(d.key) ? '<span class="chip ok">Taken ✓</span>' : (+d.t.slice(0, 2) * 60 + +d.t.slice(3)) < nowM ? '<span class="chip warn">Due now or overdue</span>' : '<span class="chip">Later today</span>';
    const card = m => {
      const mm = active.filter(x => x.member_id === m.id), hist = rx.filter(x => x.member_id === m.id).sort((a, b) => a.date < b.date ? 1 : -1).slice(0, 5), nf = upcoming.find(v => v.member_id === m.id);
      return `<article class="card"><div class="row sp"><h3 class="big">${esc(m.name)}</h3><button class="btn sm ghost" data-open="${m.id}">Open records</button></div>
      <h4>Next follow-up</h4>${nf ? `<p><b>${fmt(nf.date)}</b> ${when(nf.date)}<br><span class="mut sm">${esc(nf.reason)}${nf.doctor ? ' · ' + esc(nf.doctor) : ''}${nf.hospital ? ' · ' + esc(nf.hospital) : ''}</span></p>` : '<p class="mut sm">None booked</p>'}
      <h4>Medicines now (${mm.length})</h4>${mm.length ? `<ul class="plain">${mm.map(x => `<li><b>${esc(x.name)}</b> ${esc(x.dose)}<br><span class="mut sm">${esc(x.frequency)}${timeList(x).length ? ' · ⏰ ' + timeList(x).join(', ') : ''}${x.end_date ? ' · until ' + fmt(x.end_date) : ''}</span></li>`).join('')}</ul>` : '<p class="mut sm">No active medicines</p>'}
      <h4>Prescription history</h4>${hist.length ? `<ul class="plain">${hist.map(r => `<li><b>${fmt(r.date)}</b> · ${esc(r.hospital || 'Unknown hospital')}${r.doctor ? ' · ' + esc(r.doctor) : ''}<br><span class="mut sm">${(r.medicines || []).map(x => esc(x.name)).join(', ') || 'No medicines listed'}</span></li>`).join('')}</ul>` : '<p class="mut sm">No prescriptions yet</p>'}</article>`;
    };
    root.innerHTML = `<h2>Hello, ${esc((user.name || '').split(' ')[0])}</h2><p class="mut">Everyone’s medicines, prescriptions and follow-ups in one place.</p>
    ${alertsOn() ? '' : '<div class="card banner" style="margin-top:1rem"><div><h3>Turn on sound alerts</h3><p class="mut sm">Get a beep, a spoken message and a pop-up when a dose or follow-up is due. Works while Careva is open in a browser tab.</p></div><button class="btn" data-alerts>Enable alerts</button></div>'}
    <div class="grid g4" style="margin:1rem 0"><div class="card tile"><b>${members.length}</b><span>Family members</span></div><div class="card tile"><b>${active.length}</b><span>Active medicines</span></div><div class="card tile"><b>${rx.length}</b><span>Prescriptions on record</span></div><div class="card tile"><b>${upcoming.length}</b><span>Upcoming follow-ups</span></div></div>
    <div class="card"><h3 class="big">Today’s doses</h3>${doses.length ? doses.map(d => `<div class="item"><div><b>${d.t}</b> · ${esc(d.m.name)} ${esc(d.m.dose)}<br><span class="mut sm">${esc(nm(d.m.member_id))}${d.m.frequency ? ' · ' + esc(d.m.frequency) : ''}</span></div><div class="row">${status(d)}<button class="btn sm ${taken.includes(d.key) ? 'ghost' : ''}" data-t="${d.key}">${taken.includes(d.key) ? 'Undo' : 'Mark taken'}</button></div></div>`).join('') : '<p class="mut">No doses scheduled today. Upload a prescription or add a medicine with reminder times.</p>'}</div>
    <h3 class="big" style="margin:1.6rem 0 .8rem">Family track record</h3><div class="grid g2">${members.map(card).join('')}</div>`;
    root.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { setTaken(day, b.dataset.t, !taken.includes(b.dataset.t)); draw(); });
    root.querySelectorAll('[data-open]').forEach(b => b.onclick = () => { member.set(b.dataset.open); location.hash = '#/prescriptions'; });
  }
  draw();
}
