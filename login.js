/* ═══════════════════════════════════════════
   LOGIN PAGE JS
   Depends on: ../shared/api.js
═══════════════════════════════════════════ */

/* -- Page entrance animation -- */
window.onload = () => {
  const box = document.querySelector('.loginbox') || document.querySelector('form');
  if (!box) return;
  box.style.opacity    = '0';
  box.style.transform  = 'translateY(40px) scale(0.95)';
  setTimeout(() => {
    box.style.transition = '0.7s ease';
    box.style.opacity    = '1';
    box.style.transform  = 'translateY(0) scale(1)';
  }, 150);

  /* Agar already logged in hai toh seedha home pe */
  if (window.API && API.isLoggedIn()) {
    window.location.href = '../home page/index.html';
  }
};

/* -- Input glow -- */
document.querySelectorAll('input').forEach(inp => {
  inp.addEventListener('focus', () => inp.classList.add('input-focus'));
  inp.addEventListener('blur',  () => inp.classList.remove('input-focus'));
});

/* -- Password toggle -- */
function togglePassword() {
  const pass = document.getElementById('password');
  const icon = document.getElementById('eyeIcon');
  if (!pass) return;
  if (pass.type === 'password') {
    pass.type = 'text';
    if (icon) icon.className = 'fa-solid fa-eye';
  } else {
    pass.type = 'password';
    if (icon) icon.className = 'fa-solid fa-eye-slash';
  }
}

/* -- Error popup -- */
function showError(msg) {
  const box = document.querySelector('.loginbox') || document.querySelector('form');
  if (box) {
    box.style.animation = 'shake 0.4s';
    setTimeout(() => box.style.animation = '', 400);
  }
  const el = document.createElement('div');
  el.className = 'errorPopup';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
  }, 2000);
}

/* -- Success -- */
function successLogin(name) {
  const box = document.querySelector('.loginbox') || document.querySelector('form');
  if (box) {
    box.style.transform = 'scale(1.04)';
    box.style.boxShadow = '0 0 40px #00ffea';
  }
  setTimeout(() => {
    window.location.href = '../home page/index.html';
  }, 700);
}

/* -- LOGIN FORM SUBMIT -- */
const loginForm = document.getElementById('loginForm');
const loginBtn  = loginForm?.querySelector('input[type="submit"], button[type="submit"], .btn-signin');

if (loginForm) {
  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const usernameEl = document.getElementById('username') || loginForm.querySelector('input[type="text"]');
    const passwordEl = document.getElementById('password') || loginForm.querySelector('input[type="password"]');

    const username = usernameEl?.value.trim();
    const password = passwordEl?.value.trim();

    if (!username || !password) {
      showError('Username aur password dono bharein!');
      return;
    }

    if (loginBtn) {
      loginBtn.value = 'Checking...';
      loginBtn.style.opacity = '0.7';
      loginBtn.style.pointerEvents = 'none';
    }

    const result = await API.login(username, password);

    if (loginBtn) {
      loginBtn.value = 'Login';
      loginBtn.style.opacity = '1';
      loginBtn.style.pointerEvents = 'auto';
    }

    if (result?.success) {
      successLogin(result.user.name || username);
    } else {
      showError(result?.error || 'Username ya password galat hai!');
    }
  });
}

/* -- GOOGLE LOGIN -- */
function handleGoogleLogin(response) {
  const base64 = response.credential.split('.')[1];
  const data   = JSON.parse(decodeURIComponent(
    atob(base64).split('').map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
  ));

  const user = {
    username: data.name,
    name:     data.name,
    email:    data.email,
    photo:    data.picture,
  };

  API.setCurrentUser(user);
  /* Google users ko backend mein bhi save karte hain */
  API.saveAccount(user).catch(() => {});
  successLogin(data.name);
}