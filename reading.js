/* ═══════════════════════════════════════════════════════════
   READING.JS — Stories list + in-page reader view
═══════════════════════════════════════════════════════════ */

/* ── SIDEBAR ── */
const menuBtn  = document.getElementById("menuBtn");
const closeBtn = document.getElementById("closeBtn");
const sidebar  = document.querySelector(".sidebar");
const overlay  = document.getElementById("overlay");
const year     = document.getElementById("year");

year.textContent = new Date().getFullYear();

menuBtn.addEventListener("click", () => {
  sidebar.classList.add("open");
  overlay.classList.add("show");
});
closeBtn.addEventListener("click", closeSidebar);
overlay.addEventListener("click", closeSidebar);
document.addEventListener("keydown", e => { if (e.key === "Escape") { closeSidebar(); closeReader(); } });

function closeSidebar() {
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
}

/* ── AUTH-BASED NAV ── */
const isLoggedIn = localStorage.getItem('sw_logged_in') === 'true';
const swUser     = JSON.parse(localStorage.getItem('sw_user') || '{}');
const navEl      = document.getElementById('sidebarNav');

if (isLoggedIn) {
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
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('sw_logged_in');
      localStorage.removeItem('sw_user');
      window.location.href = '../home page/home.html';
    }
  });
} else {
  navEl.innerHTML = `
    <a href="../reading page/reading.html"><i class="fa-solid fa-book-open"></i><span>Stories</span></a>
    <a href="../about/about.html"><i class="fa-solid fa-circle-info"></i><span>About</span></a>
    <a href="../log in and sign page/sign in.html"><i class="fa-solid fa-user-plus"></i><span>Sign Up</span></a>
    <a href="../log in and sign page/login.html"><i class="fa-solid fa-right-to-bracket"></i><span>Login</span></a>
  `;
}

/* ═══════════════════════════════════════════════════════════
   LOAD STORIES FROM WRITING PAGE
═══════════════════════════════════════════════════════════ */
const LS_KEY   = 'writer_dashboard_items_v1';
const LS_CONTENT = 'writer_content_'; // per-story content key
let   allItems = JSON.parse(localStorage.getItem(LS_KEY) || '[]');

const storyList = document.getElementById('story-list');

function getStatusClass(status) {
  if (status === 'completed') return 'completed';
  if (status === 'continued') return 'continued';
  return 'pending';
}

function capitalize(s) {
  return String(s || '').charAt(0).toUpperCase() + String(s || '').slice(1);
}

/* ─────────────────────────────────
   IN-PAGE READER
───────────────────────────────── */
function openReader(item) {
  const content = localStorage.getItem(LS_CONTENT + item.id) || '';
  const reader  = document.getElementById('readerModal');
  document.getElementById('readerTitle').textContent    = item.title;
  document.getElementById('readerCategory').textContent =
    item.subtype ? `${capitalize(item.category)} · ${capitalize(item.subtype)}` : capitalize(item.category);
  document.getElementById('readerStatus').textContent   = capitalize(item.status);
  document.getElementById('readerStatus').className     = 'reader-badge ' + getStatusClass(item.status);

  const body = document.getElementById('readerBody');
  if (content.trim()) {
    // Render stored HTML or plain text nicely
    body.innerHTML = content;
  } else {
    body.innerHTML = `
      <div class="reader-empty">
        <p>📝 No content written yet for this story.</p>
        ${isLoggedIn
          ? `<a href="../writing page/writing.html" class="reader-write-link">Go to Writing Page ✍️</a>`
          : `<a href="../log in and sign page/login.html" class="reader-write-link">Login to write</a>`
        }
      </div>`;
  }
  reader.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Reading progress
  const prog = document.getElementById('readProgress');
  body.addEventListener('scroll', () => {
    const pct = (body.scrollTop / (body.scrollHeight - body.clientHeight)) * 100;
    prog.style.width = Math.min(pct, 100) + '%';
  });
}

function closeReader() {
  document.getElementById('readerModal').classList.remove('open');
  document.body.style.overflow = '';
  document.getElementById('readProgress').style.width = '0%';
}

document.getElementById('closeReader').addEventListener('click', closeReader);
document.getElementById('readerModal').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeReader();
});

/* Font size controls */
let fontSize = 17;
document.getElementById('fontIncrease').addEventListener('click', () => {
  fontSize = Math.min(fontSize + 2, 28);
  document.getElementById('readerBody').style.fontSize = fontSize + 'px';
});
document.getElementById('fontDecrease').addEventListener('click', () => {
  fontSize = Math.max(fontSize - 2, 12);
  document.getElementById('readerBody').style.fontSize = fontSize + 'px';
});

/* ─────────────────────────────────
   RENDER STORY CARDS
───────────────────────────────── */
function renderStories(items) {
  storyList.innerHTML = '';

  if (items.length === 0) {
    storyList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <h2>No stories yet</h2>
        <p>Go to the Writing page and start your first story!</p>
        ${isLoggedIn
          ? `<a href="../writing page/writing.html">✍️ Go to Writing Page</a>`
          : `<a href="../log in and sign page/sign in.html">Sign Up and start writing</a>`
        }
      </div>
    `;
    return;
  }

  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'story';

    const statusClass = getStatusClass(item.status);
    const catLabel    = item.subtype
      ? `${capitalize(item.category)} (${capitalize(item.subtype)})`
      : capitalize(item.category);

    const thumb = item.image
      ? `<img class="story-thumb" src="${item.image}" alt="${item.title}" />`
      : `<div class="story-thumb-placeholder">${item.title.charAt(0).toUpperCase()}</div>`;

    div.innerHTML = `
      ${thumb}
      <div class="story-info">
        <div class="story-header">
          <h2>${item.title}</h2>
          <span class="story-badge ${statusClass}">${capitalize(item.status)}</span>
        </div>
        <div class="story-meta">${catLabel}</div>
        <p class="story-content">Click to read this ${catLabel.toLowerCase()}…</p>
        <button class="read-btn">📖 Read Now</button>
      </div>
    `;

    div.querySelector('.read-btn').addEventListener('click', () => openReader(item));
    div.addEventListener('click', e => {
      if (!e.target.classList.contains('read-btn')) openReader(item);
    });

    storyList.appendChild(div);
  });
}

renderStories(allItems);

/* ── SEARCH ── */
const searchInput = document.getElementById('storySearch');
searchInput.addEventListener('input', () => {
  const q = searchInput.value.toLowerCase();
  const filtered = allItems.filter(it => it.title.toLowerCase().includes(q));
  renderStories(filtered);
});
