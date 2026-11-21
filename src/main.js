import './styles/theme.css'; import './styles/layout.css'; import './styles/components.css';
import { getUser, signIn, signUp, signOut, demo } from './services/auth.js';
import { configured, configProblem } from './services/supabase.js';
import { esc } from './utils/format.js';
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
  app.querySelector('.err').textContent = msg || configProblem;
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
async function draw() {
  const user = await getUser(); if (!user) return authView();
  startReminders();
  const ms = await ensureMember(), route = location.hash.startsWith('#/') ? location.hash.slice(2) : 'dashboard';
  app.innerHTML = `<div class="shell">${sidebar(route)}<div class="content">${header(user, ms, member.get())}<main id="view"></main></div></div>`;
  const view = document.getElementById('view');
  try { await (routes[route] || dashboard)(view, { user, members: ms, render }); } catch (e) { view.innerHTML = `<p class="err">${e.message}</p>`; }
}
async function render() {
  if (!app.innerHTML.trim()) app.innerHTML = '<p class="mut" style="padding:2rem">Loading Careva…</p>';
  try { await Promise.race([draw(), new Promise((_, no) => setTimeout(() => no(new Error('Loading took too long.')), 15000))]); } catch (e) {
    const m = String(e.message || e), hint = /relation|does not exist|schema cache|column/i.test(m) ? 'The database tables or columns are missing. In Supabase SQL Editor run supabase/schema.sql, policies.sql and migration-002.sql.' : /jwt|api key|apikey/i.test(m) ? 'The Supabase key looks wrong. Check the VITE_SUPABASE_ANON_KEY secret.' : 'If this keeps happening, click Reset saved login, then sign in again.';
    app.innerHTML = `<div class="auth"><section class="card"><h2>Something went wrong</h2><p class="err" style="margin:.6rem 0">${esc(m)}</p><p class="mut">${hint}</p><div class="row" style="margin-top:1rem"><button class="btn" id="re">Try again</button><button class="btn ghost" data-out>Sign out</button><button class="btn ghost" id="rs">Reset saved login</button></div></section></div>`;
    document.getElementById('re').onclick = render;
    document.getElementById('rs').onclick = () => { Object.keys(localStorage).filter(k => k.startsWith('sb-')).forEach(k => localStorage.removeItem(k)); location.reload(); };
  }
}
document.addEventListener('click', async e => {
  if (e.target.closest('[data-alerts]')) { if (alertsOn()) disableAlerts(); else { const p = await enableAlerts(); if (p === 'denied') alert('Pop-up notifications are blocked in this browser, but sound and spoken alerts will still play.'); } render(); return; }
  if (e.target.closest('[data-out]')) { await signOut(); render(); }
  const f = e.target.closest('[data-file]'); if (f) { const u = await fileUrl(f.dataset.file); if (u) window.open(u, '_blank'); }
});
document.addEventListener('change', e => { if (e.target.id === 'who') { member.set(e.target.value); render(); } });
window.addEventListener('careva:taken', () => { if (!location.hash || location.hash === '#/dashboard') render(); });
window.addEventListener('hashchange', render); render();
