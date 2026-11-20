import { crudPage } from '../utils/crud.js';
import { esc, fmt, when } from '../utils/format.js';
export default crudPage({
  table: 'visits', title: 'Doctor visits', intro: 'Past and upcoming appointments, including follow-ups from prescriptions.', noun: 'visit',
  fields: [{ name: 'reason', label: 'Reason', required: true, placeholder: 'Check-up' }, { name: 'doctor', label: 'Doctor' }, { name: 'hospital', label: 'Hospital or clinic' }, { name: 'date', label: 'Date', type: 'date', required: true }],
  summary: r => `<h3>${esc(r.reason)} ${when(r.date)}</h3><p class="mut sm">${fmt(r.date)}${r.doctor ? ' · ' + esc(r.doctor) : ''}${r.hospital ? ' · ' + esc(r.hospital) : ''}</p>`
});
