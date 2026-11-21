import { list, add, upload, extract } from '../services/storage.js';
import { esc, fmt, today, when } from '../utils/format.js';
import { timesFor, endDate } from '../utils/schedule.js';
import { openModal } from '../components/modal.js';
import { refreshReminders } from '../services/reminders.js';
const parse = t => (t || '').split('\n').map(l => l.split('|').map(s => s.trim())).filter(p => p[0]).map(([name, dose = '', frequency = '', duration = '']) => ({ name, dose, frequency, duration }));
const toText = m => (m || []).map(x => [x.name, x.dose, x.frequency, x.duration].join(' | ').replace(/(\s*\|\s*)+$/, '')).join('\n');

export default async function (root) {
  async function draw() {
    const rows = (await list('prescriptions')).sort((a, b) => a.date < b.date ? 1 : -1);
    root.innerHTML = `<h2>Prescriptions</h2>
    <div class="card drop"><h3>Upload a prescription</h3><p class="mut sm">Hospital, doctor, date, medicines and follow-up are read for you. Check them, then save: medicines get reminders and the follow-up goes into Doctor visits.</p>
    <input id="up" type="file" accept="image/*,application/pdf" hidden><button class="btn" id="pick">Choose photo or PDF</button><p class="mut sm" id="st" role="status"></p></div>
    <div class="grid" style="margin-top:1rem">${rows.length ? rows.map(r => `<article class="card"><div class="row sp"><h3 class="big">${esc(r.hospital || 'Unknown hospital')}</h3><span class="chip">${fmt(r.date)}</span></div>
      <p class="mut">${r.doctor ? esc(r.doctor) : 'Doctor not recorded'}</p>
      <h4>Medicines</h4>${(r.medicines || []).length ? `<ul class="plain">${r.medicines.map(m => `<li><b>${esc(m.name)}</b> ${esc(m.dose)} <span class="mut sm">${esc(m.frequency)}${m.duration ? ' · ' + esc(m.duration) : ''}</span></li>`).join('')}</ul>` : '<p class="mut sm">None listed</p>'}
      <p style="margin-top:.6rem"><b>Next follow-up:</b> ${r.follow_up ? fmt(r.follow_up) + ' ' + when(r.follow_up) : 'Not mentioned'}</p>
      <div class="row" style="margin-top:.6rem">${r.file_path ? `<button class="btn sm ghost" data-file="${esc(r.file_path)}">View original</button>` : ''}</div></article>`).join('') : '<p class="mut">No prescriptions yet. Upload your first one above.</p>'}</div>`;
    const up = root.querySelector('#up'), st = root.querySelector('#st');
    root.querySelector('#pick').onclick = () => up.click();
    up.onchange = async () => {
      const file = up.files[0]; if (!file) return;
      st.textContent = 'Reading your prescription… (the first time can take a minute)';
      const x = await extract(file, p => { st.textContent = `Reading your prescription… ${p}%`; });
      const found = x && (x.hospital || x.doctor || x.follow_up || x.medicines?.length);
      st.textContent = found ? `Details found${x.source === 'claude' ? '' : ' (basic reading, so please check carefully)'}.` : 'We could not read this file. Type the details in, or try a clearer photo.';
      openModal('Check prescription details', [
        { name: 'hospital', label: 'Hospital or clinic', value: x?.hospital }, { name: 'doctor', label: 'Doctor', value: x?.doctor },
        { name: 'date', label: 'Prescription date', type: 'date', required: true, value: x?.date || today() },
        { name: 'follow_up', label: 'Next follow-up', type: 'date', value: x?.follow_up },
        { name: 'medicines', label: 'Medicines (one per line: name | dose | how often | duration)', type: 'textarea', value: toText(x?.medicines) }
      ], async v => {
        const medicines = parse(v.medicines), file_path = await upload(file);
        await add('prescriptions', { hospital: v.hospital, doctor: v.doctor, date: v.date, follow_up: v.follow_up || null, medicines, file_path });
        for (const m of medicines) await add('medicines', { ...m, times: timesFor(m.frequency), start_date: v.date, end_date: endDate(v.date, m.duration) });
        if (v.follow_up) await add('visits', { reason: 'Follow-up', doctor: v.doctor, hospital: v.hospital, date: v.follow_up });
        refreshReminders(); draw();
      });
    };
  }
  await draw();
}
