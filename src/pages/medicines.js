import { crudPage } from '../utils/crud.js';
import { esc, fmt, today } from '../utils/format.js';
import { timesFor, endDate, timeList } from '../utils/schedule.js';
export default crudPage({
  table: 'medicines', title: 'Medicines & reminders', intro: 'Reminder times drive the sound alerts. They are set from “how often”, and you can change them.', noun: 'medicine',
  fields: [{ name: 'name', label: 'Medicine', required: true }, { name: 'dose', label: 'Dose', placeholder: '500 mg' }, { name: 'frequency', label: 'How often', placeholder: '1-0-1 after food' }, { name: 'duration', label: 'Duration', placeholder: '7 days' },
    { name: 'times', label: 'Reminder times (24h, e.g. 08:00,21:00. Leave blank to set automatically, or type none)', placeholder: '08:00,21:00' }, { name: 'start_date', label: 'Start date (blank = today)', type: 'date' }],
  prepare: v => { if (!v.times?.trim() && v.frequency) v.times = timesFor(v.frequency); v.start_date = v.start_date || today(); v.end_date = endDate(v.start_date, v.duration); },
  summary: r => { const ended = r.end_date && r.end_date < today(), tl = timeList(r); return `<h3>${esc(r.name)} <span class="mut sm">${esc(r.dose)}</span> ${ended ? '<span class="chip">Course ended</span>' : r.end_date ? `<span class="chip ok">Until ${fmt(r.end_date)}</span>` : ''}</h3><p class="mut sm">${esc(r.frequency || 'Daily')}${r.duration ? ' · ' + esc(r.duration) : ''}</p><p class="sm">${tl.length ? '⏰ ' + tl.join(', ') : 'No reminder times set'}</p>`; }
});
