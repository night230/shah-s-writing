/* ═══════════════════════════════════════════════════════════
   SIGN-UP.JS — Form validate → save pending user → go to OTP
═══════════════════════════════════════════════════════════ */

/* Entrance animation */
window.onload = () => {
  const box = document.querySelector('.signin-container');
  if (box) {
    box.style.opacity   = '0';
    box.style.transform = 'translateY(40px) scale(0.95)';
    setTimeout(() => {
      box.style.transition = '0.7s ease';
      box.style.opacity    = '1';
      box.style.transform  = 'translateY(0) scale(1)';
    }, 150);
  }

  /* Already logged in → home */
  if (localStorage.getItem('sw_logged_in') === 'true') {
    window.location.href = '../home page/home.html';
  }
};

/* Input glow */
document.querySelectorAll('input').forEach(inp => {
  inp.addEventListener('focus', () => inp.classList.add('input-focus'));
  inp.addEventListener('blur',  () => inp.classList.remove('input-focus'));
});

/* Error/success popup */
function showPopup(msg, isError = true) {
  const el = document.createElement('div');
  el.className = 'errorPopup';
  el.style.background = isError ? 'rgba(255,50,50,0.92)' : 'rgba(0,220,100,0.92)';
  el.textContent = msg;
  document.body.appendChild(el);

  if (isError) {
    const form = document.querySelector('form');
    if (form) {
      form.style.animation = 'shake 0.4s';
      setTimeout(() => form.style.animation = '', 400);
    }
  }
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
  }, 2500);
}

/* Generate 6-digit OTP */
function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/* ── FORM SUBMIT ── */
const signupForm = document.getElementById('signupForm');
const signupBtn  = document.getElementById('signupBtn');

if (signupForm) {
  signupForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const username = document.getElementById('su_username').value.trim();
    const mobile   = document.getElementById('su_mobile').value.trim();
    const email    = document.getElementById('su_email').value.trim();
    const password = document.getElementById('su_password').value.trim();
    const confirm  = document.getElementById('su_confirm').value.trim();

    /* Validations */
    if (!username || !mobile || !email || !password || !confirm) {
      showPopup('Saare fields bharein!'); return;
    }
    if (!/^[0-9]{10}$/.test(mobile)) {
      showPopup('Mobile number 10 digits ka hona chahiye!'); return;
    }
    if (password !== confirm) {
      showPopup('Passwords match nahi kar rahe!'); return;
    }
    if (password.length < 6) {
      showPopup('Password kam se kam 6 characters ka hona chahiye!'); return;
    }

    /* Disable button */
    signupBtn.textContent = 'Processing...';
    signupBtn.disabled = true;

    /* Generate OTP */
    const otp = generateOTP();

    /* Save pending user data + OTP to localStorage */
    const pendingUser = { username, mobile, email, password };
    localStorage.setItem('sw_pending_user', JSON.stringify(pendingUser));
    localStorage.setItem('sw_otp', otp);

    /* Show OTP to user (simulation — in production yeh email pe jayega) */
    showPopup(`OTP aapke email pe bheja gaya! (Demo: ${otp})`, false);

    /* Redirect to OTP page after 1.5 seconds */
    setTimeout(() => {
      window.location.href = 'otp.html';
    }, 1800);
  });
}

/* ── GOOGLE SIGN UP ── */
function handleGoogleLogin(response) {
  const base64 = response.credential.split('.')[1];
  const data   = JSON.parse(decodeURIComponent(
    atob(base64).split('').map(c => '%' + c.charCodeAt(0).toString(16).padStart(2,'0')).join('')
  ));

  const user = { username: data.name, email: data.email, mobile: '', photo: data.picture };
  localStorage.setItem('sw_user', JSON.stringify(user));
  localStorage.setItem('sw_logged_in', 'true');
  window.location.href = '../account/account.html';
}