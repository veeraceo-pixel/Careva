import { add } from '../services/storage.js';
import { esc } from '../utils/format.js';
export default async function (root, { user }) {
  root.innerHTML = `<h2>Contact us</h2><p class="mut">Questions or feedback? Send us a message.</p>
  <form class="card" id="cf" style="margin-top:1rem;max-width:520px"><label>Name<input name="name" required value="${esc(user.name)}"></label><label>Email<input name="email" type="email" required value="${esc(user.email)}"></label><label>Message<textarea name="message" rows="5" required></textarea></label><p class="err" role="alert"></p><button class="btn" style="margin-top:1rem">Send message</button></form>`;
  root.querySelector('#cf').onsubmit = async e => {
    e.preventDefault(); const v = Object.fromEntries(new FormData(e.target));
    try { await add('messages', v); root.querySelector('form').innerHTML = '<h3>Thanks, your message is sent.</h3>'; } catch (er) { root.querySelector('.err').textContent = er.message; }
  };
}
