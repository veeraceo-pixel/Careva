import { crudPage } from '../utils/crud.js';
import { esc, fmt, today } from '../utils/format.js';
export default crudPage({
  table: 'reports', title: 'Test reports', intro: 'Blood tests, scans and other results.', noun: 'report',
  fields: [{ name: 'title', label: 'Title', required: true, placeholder: 'Full blood count' }, { name: 'type', label: 'Type', type: 'select', options: ['Blood test', 'Scan', 'X-ray', 'Other'] }, { name: 'date', label: 'Date', type: 'date', value: today(), required: true }, { name: 'file_path', label: 'File (image or PDF)', type: 'file' }, { name: 'notes', label: 'Notes' }],
  summary: r => `<h3>${esc(r.title)} <span class="chip">${esc(r.type)}</span></h3><p class="mut sm">${fmt(r.date)}${r.notes ? ' · ' + esc(r.notes) : ''}</p>${r.file_path ? `<button class="btn sm ghost" data-file="${esc(r.file_path)}">Open file</button>` : ''}`
});
