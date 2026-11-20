export const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const today = () => new Date().toISOString().slice(0, 10);
export const fmt = d => d ? new Date(d + 'T00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not set';
export const daysTo = d => Math.round((new Date(d + 'T00:00') - new Date(today() + 'T00:00')) / 864e5);
export const when = d => { const n = daysTo(d); return n < 0 ? `<span class="chip warn">${-n} days ago</span>` : n === 0 ? '<span class="chip warn">Today</span>' : `<span class="chip">In ${n} day${n > 1 ? 's' : ''}</span>`; };
