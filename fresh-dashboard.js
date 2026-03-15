/* fresh-dashboard.js - restrict admin dashboard using session status */

async function getStatus() {
  try {
    const res = await fetch('/api/fresh-admin-status');
    if (!res.ok) throw new Error('Not authorized');
    const json = await res.json();
    return json;
  } catch (err) {
    console.warn('Admin status check failed', err);
    return { authenticated: false };
  }
}

async function requireAdmin() {
  const status = await getStatus();
  if (!status.authenticated) {
    window.location.href = '/fresh-index.html';
  }
}

async function logout() {
  await fetch('/fresh-logout');
  window.location.href = '/fresh-index.html';
}

window.addEventListener('DOMContentLoaded', async () => {
  await requireAdmin();
  document.getElementById('fresh-logout').addEventListener('click', logout);
});