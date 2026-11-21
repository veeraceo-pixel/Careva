import './styles/theme.css'; import './styles/layout.css'; import './styles/components.css';
import { getUser, signIn, signUp, signOut, demo } from './services/auth.js';
import { configured } from './services/supabase.js';
import { list, add, member, fileUrl } from './services/storage.js';
import { startReminders, enableAlerts, disableAlerts, alertsOn } from './services/reminders.js';
import { sidebar } from './components/sidebar.js'; import { header } from './components/header.js';
import dashboard from './pages/dashboard.js'; import medicines from './pages/medicines.js'; import prescriptions from './pages/prescriptions.js';
import reports from './pages/reports.js'; import visits from './pages/doctor-visits.js'; import family from './pages/family.js'; import contact from './pages/contact.js';
const routes = { dashboard, medicines, prescriptions, reports, 'doctor-visits': visits, family, contact };
const app = document.getElementById('app'); let tab = 'in';
const feats = [['💊', 'Medicines & reminders', 'Track doses and daily routines'], ['📄', 'Health records', 'Keep prescriptions and reports together'], ['🩺', 'Doctor visits', 'Never miss a follow-up'], ['👨‍👩‍👧', 'Family workspace', 'Organise care for loved ones']];

function authView(msg = '') {
  app.innerHTML = `<div class="auth"><section><div class="logo"><b>+</b>Careva</div><h1>Better organised care starts with one place.</h1>
  <p class="mut lead">Keep your family’s medicines, prescriptions, test results and appointments organised in a simple, secure-feeling workspace.</p>
  <div class="feat">${feats.map(f => `<div><h3>${f[0]} ${f[1]}</h3><p class="mut sm">${f[2]}</p></div>`).join('')}</div></section>
  <section class="card"><h2>Welcome back</h2><p class="mut">Sign in to your Careva workspace.</p>
  <div class="tabs"><button data-tab="in" class="${tab === 'in' ? 'on' : ''}">Sign in</button><button data-tab="up" class="${tab === 'up' ? 'on' : ''}">Create account</button></div>
  <form id="af">${tab === 'up' ? '<label>Your name<input name="n" required></label>' : ''}<label>Email address<input name="e" type="email" required placeholder="you@example.com"></label><label>Password<input name="p" type="password" required minlength="8" placeholder="At least 8 characters"></label>
  <p class="err" role="alert"></p><button class="btn wide">${tab === 'in' ? 'Sign in' : 'Create account'}</button></form>
  ${configured ? '' : '<button class="btn ghost wide" id="demo" style="margin-top:.7rem">Explore demo without signing in</button><p class="mut sm" style="margin-top:1rem">Demo mode: no Supabase keys found, so nothing is authenticated and data stays in this browser.</p>'}</section></div>`;
  app.querySelector('.err').textContent = msg;
  app.querySelector('#af').onsubmit = async e => {
    e.preventDefault(); const g = Object.fromEntries(new FormData(e.target));
    try { tab === 'in' ? await signIn(g.e, g.p) : await signUp(g.e, g.p, g.n); render(); } catch (er) { authView(er.message); }
  };
  app.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; authView(); });
  const d = app.querySelector('#demo'); if (d) d.onclick = () => { demo(); render(); };
}
async function ensureMember() {
  let ms = await list('members'); if (!ms.length) ms = [await add('members', { name: 'Me' })];
  if (!ms.find(m => m.id === member.get())) member.set(ms[0].id); return ms;
}
async function render() {
  const user = await getUser(); if (!user) return authView();
  startReminders();
  const ms = await ensureMember(), route = location.hash.slice(2) || 'dashboard';
  app.innerHTML = `<div class="shell">${sidebar(route)}<div class="content">${header(user, ms, member.get())}<main id="view"></main></div></div>`;
  const view = document.getElementById('view');
  try { await (routes[route] || dashboard)(view, { user, members: ms, render }); } catch (e) { view.innerHTML = `<p class="err">${e.message}</p>`; }
}
document.addEventListener('click', async e => {
  if (e.target.closest('[data-alerts]')) { if (alertsOn()) disableAlerts(); else { const p = await enableAlerts(); if (p === 'denied') alert('Pop-up notifications are blocked in this browser, but sound and spoken alerts will still play.'); } render(); return; }
  if (e.target.closest('[data-out]')) { await signOut(); render(); }
  const f = e.target.closest('[data-file]'); if (f) { const u = await fileUrl(f.dataset.file); if (u) window.open(u, '_blank'); }
});
document.addEventListener('change', e => { if (e.target.id === 'who') { member.set(e.target.value); render(); } });
window.addEventListener('careva:taken', () => { if (!location.hash || location.hash === '#/dashboard') render(); });
window.addEventListener('hashchange', render); render();
