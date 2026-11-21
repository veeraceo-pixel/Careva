import { list, add, update, remove, upload } from '../services/storage.js';
import { openModal } from '../components/modal.js';
import { refreshReminders } from '../services/reminders.js';
export function crudPage({ table, title, intro, noun, fields, summary, prepare }) {
  return async function (root) {
    async function save(v, id) {
      for (const f of fields) {
        if (f.type === 'file') { const p = await upload(v[f.name]); if (p) v[f.name] = p; else delete v[f.name]; }
        if (f.type === 'date' && !v[f.name]) v[f.name] = null;
      }
      if (prepare) prepare(v);
      if (id) await update(table, id, v); else await add(table, v);
      refreshReminders(); draw();
    }
    async function draw() {
      const rows = await list(table);
      root.innerHTML = `<div class="row sp"><div><h2>${title}</h2><p class="mut">${intro}</p></div><button class="btn" id="add">Add ${noun}</button></div>
      <div class="card" style="margin-top:1rem">${rows.length ? rows.map(r => `<div class="item"><div>${summary(r)}</div><div class="row"><button class="btn sm ghost" data-edit="${r.id}">Edit</button><button class="btn del" data-id="${r.id}">Delete</button></div></div>`).join('') : '<p class="mut">Nothing here yet.</p>'}</div>`;
      root.querySelector('#add').onclick = () => openModal('Add ' + noun, fields, v => save(v));
      root.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => { const r = rows.find(x => x.id === b.dataset.edit); openModal('Edit ' + noun, fields.filter(f => f.type !== 'file').map(f => ({ ...f, value: r[f.name] ?? f.value })), v => save(v, r.id)); });
      root.querySelectorAll('[data-id]').forEach(b => b.onclick = async () => { if (confirm('Delete this?')) { await remove(table, b.dataset.id); refreshReminders(); draw(); } });
    }
    await draw();
  };
}
