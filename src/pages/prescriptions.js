import { list, add, upload, extract } from '../services/storage.js';
import { esc, fmt, today, when } from '../utils/format.js';
import { openModal } from '../components/modal.js';
const parse = t => (t || '').split('\n').map(l => l.split('|').map(s => s.trim())).filter(p => p[0]).map(([name, dose = '', frequency = '', duration = '']) => ({ name, dose, frequency, duration }));
const toText = m => (m || []).map(x => [x.name, x.dose, x.frequency, x.duration].join(' | ').replace(/(\s*\|\s*)+$/, '')).join('\n');

export default async function (root) {
  async function draw() {
    const rows = await list('prescriptions');
    root.innerHTML = `<h2>Prescriptions</h2>
    <div class="card drop"><h3>Upload a prescription</h3><p class="mut sm">Careva captures the date, hospital, medicines and next follow-up. You check them before saving.</p>
    <input id="up" type="file" accept="image/*,application/pdf" hidden><button class="btn" id="pick">Choose file</button><p class="mut sm" id="st" role="status"></p></div>
    <div class="grid" style="margin-top:1rem">${rows.length ? rows.map(r => `<div class="card"><div class="row sp"><h3>${esc(r.hospital || 'Unknown hospital')}</h3><span class="chip">${fmt(r.date)}</span></div>
      ${r.doctor ? `<p class="mut sm">${esc(r.doctor)}</p>` : ''}<p style="margin-top:.5rem"><b>Medicines:</b> ${(r.medicines || []).map(m => esc(m.name + (m.dose ? ' ' + m.dose : ''))).join(', ') || 'None listed'}</p>
      <p><b>Next follow-up:</b> ${r.follow_up ? fmt(r.follow_up) + ' ' + when(r.follow_up) : 'Not mentioned'}</p>
      ${r.file_path ? `<button class="btn sm ghost" data-file="${esc(r.file_path)}">Open file</button>` : ''}</div>`).join('') : '<p class="mut">No prescriptions yet.</p>'}</div>`;
    const up = root.querySelector('#up'), st = root.querySelector('#st');
    root.querySelector('#pick').onclick = () => up.click();
    up.onchange = async () => {
      const file = up.files[0]; if (!file) return;
      st.textContent = 'Reading your prescription… (the first time can take a minute)';
      const x = await extract(file, p => { st.textContent = `Reading your prescription… ${p}%`; });
      const found = x && (x.hospital || x.doctor || x.follow_up || x.medicines?.length);
      st.textContent = found ? 'Details found. Please check them before saving.' : 'We could not read this image. Try a clearer, printed prescription, or type the details.';
      const meds = Array.isArray(x?.medicines) ? x.medicines : [];
      openModal('Check prescription details', [
        { name: 'hospital', label: 'Hospital or clinic', value: x?.hospital }, { name: 'doctor', label: 'Doctor', value: x?.doctor },
        { name: 'date', label: 'Prescription date', type: 'date', required: true, value: x?.date || today() },
        { name: 'follow_up', label: 'Next follow-up', type: 'date', value: x?.follow_up },
        { name: 'medicines', label: 'Medicines (one per line: name | dose | how often | duration)', type: 'textarea', value: toText(meds) }
      ], async v => {
        const medicines = parse(v.medicines), file_path = await upload(file);
        await add('prescriptions', { hospital: v.hospital, doctor: v.doctor, date: v.date, follow_up: v.follow_up || null, medicines, file_path });
        for (const m of medicines) await add('medicines', m);
        if (v.follow_up) await add('visits', { reason: 'Follow-up', doctor: v.doctor, hospital: v.hospital, date: v.follow_up });
        draw();
      });
    };
  }
  await draw();
}
