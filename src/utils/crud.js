import { list, add, remove, upload } from '../services/storage.js';
import { openModal } from '../components/modal.js';
export function crudPage({ table, title, intro, noun, fields, summary }) {
  return async function (root) {
    async function draw() {
      const rows = await list(table);
      root.innerHTML = `<div class="row sp"><div><h2>${title}</h2><p class="mut">${intro}</p></div><button class="btn" id="add">Add ${noun}</button></div>
      <div class="card" style="margin-top:1rem">${rows.length ? rows.map(r => `<div class="item"><div>${summary(r)}</div><button class="btn del" data-id="${r.id}">Delete</button></div>`).join('') : '<p class="mut">Nothing here yet.</p>'}</div>`;
      root.querySelector('#add').onclick = () => openModal('Add ' + noun, fields, async v => {
        for (const f of fields) if (f.type === 'file') v[f.name] = await upload(v[f.name]);
        await add(table, v); draw();
      });
      root.querySelectorAll('[data-id]').forEach(b => b.onclick = async () => { if (confirm('Delete this?')) { await remove(table, b.dataset.id); draw(); } });
    }
    await draw();
  };
}
