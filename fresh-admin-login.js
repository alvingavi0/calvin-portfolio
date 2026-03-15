/* fresh-admin-login.js
 * Hidden admin trigger + Google signin flow
 */

const ADMIN_KEYWORD = 'admin';
const GOOGLE_CLIENT_ID = '454858553626-rfivpo10lb79anb7ft4mc4ig11h8ab5d.apps.googleusercontent.com';
const ALLOWED_ADMIN_EMAIL = 'wanyamacalvinotieno254@gmail.com';

const modal = document.getElementById('fresh-admin-modal');
const closeBtn = document.getElementById('fresh-admin-close');
const googleBtn = document.getElementById('fresh-google-signin');
const infoEl = document.getElementById('fresh-admin-info');
const errorEl = document.getElementById('fresh-admin-error');

function showModal() {
  modal.classList.remove('hidden');
  infoEl.textContent = 'Click continue with Google to authenticate as admin.';
  errorEl.classList.add('hidden');
}

function hideModal() {
  modal.classList.add('hidden');
  errorEl.classList.add('hidden');
}

function setError(message) {
  errorEl.textContent = message;
  errorEl.classList.remove('hidden');
}

closeBtn.addEventListener('click', hideModal);
modal.addEventListener('click', (e) => {
  if (e.target === modal) hideModal();
});

let keyBuffer = '';
window.addEventListener('keydown', (e) => {
  keyBuffer += e.key;
  if (keyBuffer.toLowerCase().includes(ADMIN_KEYWORD.toLowerCase())) {
    keyBuffer = '';
    showModal();
  }
  if (keyBuffer.length > 20) keyBuffer = keyBuffer.slice(-20);
});

// Initialize Google Identity Services
function initGoogleLogin() {
  if (!window.google || !google.accounts || !google.accounts.id) {
    setError('Google Identity script failed to load. Refresh and try again.');
    return;
  }

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: async (response) => {
      if (!response || !response.credential) {
        setError('Google login failed. Check your credentials.');
        return;
      }
      try {
        const res = await fetch('/api/fresh-google-login', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ credential: response.credential })
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.error || `Google auth failed (${res.status})`);
          return;
        }

        window.location.href = '/fresh-admin-dashboard.html';
      } catch (err) {
        setError('Server error during google login.');
        console.error(err);
      }
    },
    auto_select: false,
    cancel_on_tap_outside: true
  });
}

// Event attached to the custom button
googleBtn.addEventListener('click', () => {
  if (!window.google || !google.accounts || !google.accounts.id) {
    setError('Google Identity not ready yet. Wait 1 sec and retry.');
    return;
  }
  google.accounts.id.prompt();
});

window.addEventListener('DOMContentLoaded', () => {
  initGoogleLogin();
});