import { add, remove, member } from '../services/storage.js';
import { esc } from '../utils/format.js';
import { openModal } from '../components/modal.js';
export default async function (root, { members, render }) {
  root.innerHTML = `<div class="row sp"><div><h2>Family workspace</h2><p class="mut">Each person has their own medicines, prescriptions, reports and visits.</p></div><button class="btn" id="add">Add person</button></div>
  <div class="card" style="margin-top:1rem">${members.map(m => `<div class="item"><h3>${esc(m.name)} ${m.id === member.get() ? '<span class="chip ok">Viewing</span>' : ''}</h3><div class="row">${m.id !== member.get() ? `<button class="btn sm ghost" data-view="${m.id}">View</button>` : ''}${members.length > 1 ? `<button class="btn del" data-rm="${m.id}">Remove</button>` : ''}</div></div>`).join('')}</div>`;
  root.querySelector('#add').onclick = () => openModal('Add person', [{ name: 'name', label: 'Name', required: true, placeholder: 'Mum, Dad, Sam…' }], async v => { const m = await add('members', v); member.set(m.id); render(); });
  root.querySelectorAll('[data-view]').forEach(b => b.onclick = () => { member.set(b.dataset.view); render(); });
  root.querySelectorAll('[data-rm]').forEach(b => b.onclick = async () => { if (confirm('Remove this person and all their records?')) { await remove('members', b.dataset.rm); render(); } });
}
