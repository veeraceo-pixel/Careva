import { crudPage } from '../utils/crud.js';
import { esc } from '../utils/format.js';
export default crudPage({
  table: 'medicines', title: 'Medicines & reminders', intro: 'Everything taken regularly, in one list.', noun: 'medicine',
  fields: [{ name: 'name', label: 'Medicine', required: true }, { name: 'dose', label: 'Dose', placeholder: '500 mg' }, { name: 'frequency', label: 'How often', placeholder: 'Twice daily after food' }, { name: 'duration', label: 'Duration', placeholder: '7 days' }],
  summary: r => `<h3>${esc(r.name)} <span class="mut sm">${esc(r.dose)}</span></h3><p class="mut sm">${esc(r.frequency || 'Daily')}${r.duration ? ' · ' + esc(r.duration) : ''}</p>`
});
