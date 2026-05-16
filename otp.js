/* ═══════════════════════════════════════════════════════════
   OTP.JS — Verify → set sw_logged_in → go to account page
═══════════════════════════════════════════════════════════ */

const boxes     = document.querySelectorAll('.otp-box');
const verifyBtn = document.getElementById('verifyBtn');
const resendBtn = document.getElementById('resendBtn');
const otpError  = document.getElementById('otpError');
const subtitle  = document.getElementById('otpSubtitle');

/* Check if pending user exists */
const pendingUser = JSON.parse(localStorage.getItem('sw_pending_user') || 'null');
if (!pendingUser) {
  /* No pending sign-up → back to sign up */
  window.location.href = 'sign in.html';
}

/* Show email in subtitle */
if (pendingUser && pendingUser.email) {
  subtitle.textContent = `${pendingUser.email} pe bheja gaya 6-digit OTP enter karo`;
}

/* ── AUTO-FOCUS NEXT BOX ── */
boxes.forEach((box, i) => {
  box.addEventListener('input', e => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    box.value = val;

    if (val) {
      box.classList.add('filled');
      box.classList.remove('error-box');
      /* Move to next box */
      if (i < boxes.length - 1) boxes[i + 1].focus();
    } else {
      box.classList.remove('filled');
    }
  });

  box.addEventListener('keydown', e => {
    /* Backspace → go to previous box */
    if (e.key === 'Backspace' && !box.value && i > 0) {
      boxes[i - 1].focus();
      boxes[i - 1].value = '';
      boxes[i - 1].classList.remove('filled');
    }
    /* Allow only numbers */
    if (!/[0-9]/.test(e.key) && !['Backspace','Tab','ArrowLeft','ArrowRight'].includes(e.key)) {
      e.preventDefault();
    }
  });

  /* Paste support */
  box.addEventListener('paste', e => {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g,'');
    boxes.forEach((b, idx) => {
      b.value = pasted[idx] || '';
      if (b.value) b.classList.add('filled');
    });
    boxes[Math.min(pasted.length, boxes.length - 1)].focus();
  });
});

/* Focus first box on load */
boxes[0].focus();

/* ── GET ENTERED OTP ── */
function getEnteredOTP() {
  return Array.from(boxes).map(b => b.value).join('');
}

/* ── SHOW ERROR ── */
function showError(msg) {
  otpError.textContent = msg;
  boxes.forEach(b => b.classList.add('error-box'));
  setTimeout(() => boxes.forEach(b => b.classList.remove('error-box')), 600);
}

function clearError() {
  otpError.textContent = '';
}

/* ── VERIFY BUTTON ── */
verifyBtn.addEventListener('click', verifyOTP);

/* Also verify on Enter key */
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') verifyOTP();
});

function verifyOTP() {
  const entered  = getEnteredOTP();
  const savedOTP = localStorage.getItem('sw_otp');

  clearError();

  if (entered.length < 6) {
    showError('Poora 6-digit OTP enter karo!');
    return;
  }

  verifyBtn.disabled    = true;
  verifyBtn.textContent = 'Verifying...';

  /* Simulate slight delay */
  setTimeout(() => {
    if (entered === savedOTP) {
      /* ── SUCCESS ── */
      verifyBtn.classList.add('success');
      verifyBtn.textContent = '✅ Verified!';

      /* Move pending user to actual user */
      localStorage.setItem('sw_user', JSON.stringify(pendingUser));
      localStorage.setItem('sw_logged_in', 'true');

      /* Also set individual keys (account.js compatibility) */
      localStorage.setItem('name',     pendingUser.username);
      localStorage.setItem('email',    pendingUser.email);
      localStorage.setItem('username', pendingUser.username);

      /* Clean up */
      localStorage.removeItem('sw_pending_user');
      localStorage.removeItem('sw_otp');

      /* Redirect to account page */
      setTimeout(() => {
        window.location.href = '../account/account.html';
      }, 900);

    } else {
      /* ── WRONG OTP ── */
      showError('Galat OTP! Dobara try karo.');
      verifyBtn.disabled    = false;
      verifyBtn.textContent = 'Verify OTP';
      /* Clear boxes */
      boxes.forEach(b => { b.value = ''; b.classList.remove('filled'); });
      boxes[0].focus();
    }
  }, 600);
}

/* ── RESEND OTP ── */
let resendCountdown = 0;

function startResendTimer() {
  resendCountdown = 30;
  resendBtn.classList.add('disabled');

  const timer = document.createElement('div');
  timer.className = 'timer';
  timer.id = 'countdown';
  resendBtn.parentNode.appendChild(timer);

  const interval = setInterval(() => {
    resendCountdown--;
    const el = document.getElementById('countdown');
    if (el) el.textContent = `Resend in ${resendCountdown}s`;

    if (resendCountdown <= 0) {
      clearInterval(interval);
      resendBtn.classList.remove('disabled');
      if (el) el.remove();
    }
  }, 1000);
}

resendBtn.addEventListener('click', () => {
  if (resendBtn.classList.contains('disabled')) return;

  const newOTP = String(Math.floor(100000 + Math.random() * 900000));
  localStorage.setItem('sw_otp', newOTP);

  /* Show new OTP (demo) */
  otpError.style.color = '#00c853';
  otpError.textContent = `Naya OTP bheja gaya! (Demo: ${newOTP})`;
  setTimeout(() => {
    otpError.style.color = '#ff6b6b';
    otpError.textContent = '';
  }, 3000);

  /* Clear boxes */
  boxes.forEach(b => { b.value = ''; b.classList.remove('filled'); });
  boxes[0].focus();

  startResendTimer();
});

/* Start timer on page load */
startResendTimer();