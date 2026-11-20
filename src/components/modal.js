import { esc } from '../utils/format.js';
const input = f => f.type === 'select' ? `<select name="${f.name}">${f.options.map(o => `<option>${esc(o)}</option>`).join('')}</select>`
  : f.type === 'textarea' ? `<textarea name="${f.name}" rows="5" placeholder="${esc(f.placeholder || '')}">${esc(f.value || '')}</textarea>`
  : `<input name="${f.name}" type="${f.type || 'text'}" ${f.required ? 'required' : ''} ${f.type === 'file' ? 'accept="image/*,application/pdf"' : ''} placeholder="${esc(f.placeholder || '')}" value="${esc(f.value || '')}">`;
export function openModal(title, fields, onSave, hint = '') {
  const d = document.createElement('dialog'); d.className = 'modal';
  d.innerHTML = `<form><h3>${esc(title)}</h3>${hint ? `<p class="mut sm">${hint}</p>` : ''}${fields.map(f => `<label>${esc(f.label)}${input(f)}</label>`).join('')}<p class="err" role="alert"></p><div class="row"><button class="btn">Save</button><button type="button" class="btn ghost" id="x">Cancel</button></div></form>`;
  document.body.append(d); d.showModal();
  const close = () => { d.close(); d.remove(); };
  d.querySelector('#x').onclick = close; d.addEventListener('cancel', close);
  d.querySelector('form').onsubmit = async e => {
    e.preventDefault(); const v = {}; new FormData(e.target).forEach((x, k) => v[k] = x);
    try { await onSave(v); close(); } catch (er) { d.querySelector('.err').textContent = er.message; }
  };
}
