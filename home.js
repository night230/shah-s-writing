/* ============================================================
   HOME.JS — Sidebar + Auth Nav + Story Loading
============================================================ */

// --- SIDEBAR ELEMENTS ---
const menuBtn  = document.getElementById("menuBtn");
const closeBtn = document.getElementById("closeBtn");
const sidebar  = document.querySelector(".sidebar");
const overlay  = document.getElementById("overlay");
const year     = document.getElementById("year");

year.textContent = new Date().getFullYear();

menuBtn.addEventListener("click", () => {
  sidebar.classList.add("open");
  overlay.classList.add("show");
  menuBtn.setAttribute("aria-expanded", "true");
});

closeBtn.addEventListener("click", closeSidebar);
overlay.addEventListener("click", closeSidebar);
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeSidebar();
});

function closeSidebar() {
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
  menuBtn.setAttribute("aria-expanded", "false");
}

/* ============================================================
   AUTH-BASED NAV — Do Alag Navs
   Before login: Stories, About, Sign Up, Login
   After  login: Stories, Writing, Account, About, Logout
============================================================ */
const isLoggedIn = localStorage.getItem('sw_logged_in') === 'true';
const swUser     = JSON.parse(localStorage.getItem('sw_user') || '{}');
const navEl      = document.getElementById('sidebarNav');

function buildNav() {
  if (isLoggedIn) {
    // ── LOGGED IN NAV ──
    navEl.innerHTML = `
      <div class="nav-user-info">
        <div class="nav-username">${swUser.username || 'User'}</div>
        <div class="nav-email">${swUser.email || ''}</div>
      </div>
      <a href="../reading page/reading.html"><i class="fa-solid fa-book-open"></i><span>Stories</span></a>
      <a href="../writing page/writing.html"><i class="fa-solid fa-pen-nib"></i><span>Writing</span></a>
      <a href="../account/account.html"><i class="fa-solid fa-user"></i><span>Account</span></a>
      <a href="../about/about.html"><i class="fa-solid fa-circle-info"></i><span>About</span></a>
      <a href="#" class="logout-link" id="logoutLink"><i class="fa-solid fa-right-from-bracket"></i><span>Logout</span></a>
    `;

    document.getElementById('logoutLink').addEventListener('click', e => {
      e.preventDefault();
      if (confirm('Logout karna chahte ho?')) {
        localStorage.removeItem('sw_logged_in');
        localStorage.removeItem('sw_user');
        location.reload();
      }
    });

  } else {
    // ── LOGGED OUT NAV ──
    navEl.innerHTML = `
      <a href="../reading page/reading.html"><i class="fa-solid fa-book-open"></i><span>Stories</span></a>
      <a href="../about/about.html"><i class="fa-solid fa-circle-info"></i><span>About</span></a>
      <a href="../log in and sign page/sign in.html"><i class="fa-solid fa-user-plus"></i><span>Sign Up</span></a>
      <a href="../log in and sign page/login.html"><i class="fa-solid fa-right-to-bracket"></i><span>Login</span></a>
    `;
  }
}
buildNav();

/* ============================================================
   HERO — Welcome message based on login
============================================================ */
const heroTitle = document.getElementById('heroTitle');
const heroSub   = document.getElementById('heroSub');
const heroBtns  = document.getElementById('heroBtns');

if (isLoggedIn && swUser.username) {
  heroTitle.textContent = `Welcome back, ${swUser.username}! 👋`;
  heroSub.textContent   = 'Continue your story from where you left off.';
  heroBtns.innerHTML = `
    <a class="hero-btn primary" href="../reading page/reading.html">📖 Read Stories</a>
    <a class="hero-btn outline" href="../writing page/writing.html">✍️ My Writings</a>
  `;
} else {
  heroTitle.textContent = 'Welcome to Shah\'s Writing';
  heroSub.textContent   = 'Stories, novels, poems — your world in words.';
  heroBtns.innerHTML = `
    <a class="hero-btn primary" href="../log in and sign page/sign in.html">🚀 Get Started</a>
    <a class="hero-btn outline" href="../reading page/reading.html">📖 Browse Stories</a>
  `;
}

/* ============================================================
   LOAD STORIES FROM WRITING PAGE (localStorage)
============================================================ */
const LS_KEY        = 'writer_dashboard_items_v1';
const writingItems  = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
const homeStoryList = document.getElementById('homeStoryList');

if (writingItems.length > 0) {
  writingItems.slice(0, 6).forEach(it => {
    const card = document.createElement('div');
    card.className = 'home-story-card';
    card.innerHTML = `
      <h3>${it.title}</h3>
      <p>${capitalize(it.category)} &bull; ${it.status}</p>
      <a class="read-btn" href="../reading page/reading.html">Read</a>
    `;
    homeStoryList.appendChild(card);
  });
} else {
  homeStoryList.innerHTML = `
    <p class="home-empty">
      Abhi koi story nahi hai.
      <a href="${isLoggedIn ? '../writing page/writing.html' : '../log in and sign page/sign in.html'}">
        ${isLoggedIn ? 'Likhna shuru karo!' : 'Sign up karo aur likho!'}
      </a>
    </p>
  `;
}

/* ============================================================
   SEARCH BAR
============================================================ */
const searchBar = document.getElementById('search-bar');
searchBar.addEventListener('input', () => {
  const query = searchBar.value.toLowerCase();
  document.querySelectorAll('.home-story-card').forEach(card => {
    const title = card.querySelector('h3').textContent.toLowerCase();
    card.style.display = title.includes(query) ? 'block' : 'none';
  });
});

/* ============================================================
   MICROPHONE
============================================================ */
const micBtn = document.getElementById('micBtn');
if (micBtn && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const rec = new SR();
  micBtn.addEventListener('click', () => rec.start());
  rec.onresult = e => {
    searchBar.value = e.results[0][0].transcript;
    searchBar.dispatchEvent(new Event('input'));
  };
} else if (micBtn) {
  micBtn.style.opacity = '0.3';
  micBtn.title = 'Speech recognition supported nahi hai';
}

/* ============================================================
   HELPERS
============================================================ */
function capitalize(s) {
  return String(s || '').charAt(0).toUpperCase() + String(s || '').slice(1);
}