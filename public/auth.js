const tabs = document.querySelectorAll('.auth-tab');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const errorEl = document.getElementById('authError');

// Check if already logged in
fetch('/api/me', { credentials: 'include' })
  .then(r => { if (r.ok) location.href = '/dashboard.html'; })
  .catch(() => { });

(async () => {
  try {
    const r = await fetch('/api/health');
    const h = await r.json().catch(() => ({}));
    if (h && h.dbConnected === false) {
      errorEl.textContent = h.hint || 'Database not connected. Add MONGODB_URI to your Vercel environment variables.';
      loginForm.querySelector('button[type="submit"]').disabled = true;
      signupForm.querySelector('button[type="submit"]').disabled = true;
    }
  } catch { }
})();

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    errorEl.textContent = '';
    if (tab.dataset.tab === 'login') {
      loginForm.classList.remove('hidden');
      signupForm.classList.add('hidden');
    } else {
      loginForm.classList.add('hidden');
      signupForm.classList.remove('hidden');
    }
  });
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorEl.textContent = '';
  const fd = new FormData(loginForm);
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: fd.get('username').trim(),
      password: fd.get('password'),
    }),
    credentials: 'include',
  });
  const data = await res.json().catch(() => ({}));
  if (res.ok) location.href = '/dashboard.html';
  else errorEl.textContent = data.error || 'Login failed';
});

signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorEl.textContent = '';
  const fd = new FormData(signupForm);
  const res = await fetch('/api/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: fd.get('username').trim(),
      displayName: fd.get('displayName')?.trim() || undefined,
      password: fd.get('password'),
    }),
    credentials: 'include',
  });
  const data = await res.json().catch(() => ({}));
  if (res.ok) location.href = '/dashboard.html';
  else errorEl.textContent = data.error || 'Signup failed';
});
