/* ═══════════════════════════════════════════════════════════
   ACCOUNT.JS — Auto-fill from sign-up + Sidebar + Backend
═══════════════════════════════════════════════════════════ */

/* ── SIDEBAR ── */
const menuBtn  = document.getElementById("menuBtn");
const closeBtn = document.getElementById("closeBtn");
const sidebar  = document.querySelector(".sidebar");
const overlay  = document.getElementById("overlay");
const year     = document.getElementById("year");

year.textContent = new Date().getFullYear();

menuBtn.addEventListener("click", () => {
  sidebar.classList.add("active");
  overlay.classList.add("active");
});

function closeSidebar() {
  sidebar.classList.remove("active");
  overlay.classList.remove("active");
}
closeBtn.addEventListener("click", closeSidebar);
overlay.addEventListener("click", closeSidebar);
document.addEventListener("keydown", e => { if (e.key === "Escape") closeSidebar(); });

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
    if (confirm('Logout karna chahte ho?')) {
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

/* ── PANCHTANTRA MOUNT ── */
window.addEventListener('load', function () {
  if (window.PanchTantra) {
    const target = document.querySelector('.pt-account-control');
    if (target) PanchTantra.mountAccountSwitcher(target);
  }
});

/* ── BACKEND CONFIG ── */
const API_URL = "http://localhost:5000/api/account";

/* ── ELEMENTS ── */
const upload      = document.getElementById("photoUpload");
const profileImg  = document.getElementById("profileImg");
const userNameEl  = document.getElementById("userName");
const editNameBtn = document.getElementById("editNameBtn");
const userEmailEl = document.getElementById("userEmail");

const selectedBox = document.getElementById("selectedStories");
const writtenBox  = document.getElementById("writtenStories");
const otherBox    = document.getElementById("otherWorks");

/* ── LOAD FROM SIGN-UP (sw_user) + FALLBACK ── */
function loadLocal() {
  /* Priority: sw_user (from sign-up/OTP flow) */
  const su = JSON.parse(localStorage.getItem('sw_user') || '{}');
  return {
    name:     su.username || localStorage.getItem("name")     || "Your Name",
    email:    su.email    || localStorage.getItem("email")    || "user@example.com",
    mobile:   su.mobile   || localStorage.getItem("mobile")   || "",
    photo:    su.photo    || localStorage.getItem("photo")    || "",
    selected: JSON.parse(localStorage.getItem("selected") || "[]"),
    written:  JSON.parse(localStorage.getItem("written")  || "[]"),
    other:    JSON.parse(localStorage.getItem("other")    || "[]")
  };
}

function saveLocal(data) {
  localStorage.setItem("name",     data.name);
  localStorage.setItem("email",    data.email);
  localStorage.setItem("photo",    data.photo || "");
  localStorage.setItem("selected", JSON.stringify(data.selected));
  localStorage.setItem("written",  JSON.stringify(data.written));
  localStorage.setItem("other",    JSON.stringify(data.other));

  /* Keep sw_user in sync */
  const su = JSON.parse(localStorage.getItem('sw_user') || '{}');
  su.username = data.name;
  su.email    = data.email;
  su.photo    = data.photo || "";
  localStorage.setItem('sw_user', JSON.stringify(su));
}

async function getData() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Backend error");
    return await res.json();
  } catch {
    return loadLocal();
  }
}

async function saveData(data) {
  try {
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
  } catch {
    saveLocal(data);
  }
}

let state = { name:"", email:"", mobile:"", photo:"", selected:[], written:[], other:[] };

async function init() {
  state = await getData();
  renderAll();
}
init();

/* Photo upload */
upload.addEventListener("change", function () {
  const file = this.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function () {
    state.photo = reader.result;
    profileImg.src = state.photo;
    saveData(state);
  };
  reader.readAsDataURL(file);
});

/* Edit name */
editNameBtn.addEventListener("click", async () => {
  const newName = prompt("Naya naam enter karo:", state.name);
  if (newName && newName.trim()) {
    state.name = newName.trim();
    await saveData(state);
    renderAll();
  }
});

function renderAll() {
  userNameEl.textContent = state.name   || "Your Name";
  userEmailEl.textContent = state.email || "user@example.com";
  if (state.photo) profileImg.src = state.photo;

  renderList(selectedBox, state.selected, "Story", val => {
    state.selected.push(val); saveData(state); renderAll();
  });
  renderList(writtenBox, state.written, "Writing", val => {
    state.written.push(val); saveData(state); renderAll();
  });
  renderList(otherBox, state.other, "Work", val => {
    state.other.push(val); saveData(state); renderAll();
  });
}

function renderList(container, arr, label, onAdd) {
  container.innerHTML = "";
  arr.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <div class="left">
        <span class="title">${item}</span>
      </div>
      <button class="icon-btn" title="Remove">❌</button>
    `;
    div.querySelector("button").onclick = () => {
      arr.splice(index, 1);
      saveData(state);
      renderAll();
    };
    container.appendChild(div);
  });

  const add = document.createElement("div");
  add.className = "add-card";
  add.innerHTML = `<div class="add-inner"><div class="plus-circle">+</div><p>Add ${label}</p></div>`;
  add.onclick = () => {
    const val = prompt(`Naya ${label} add karo:`);
    if (val && val.trim()) onAdd(val.trim());
  };
  container.appendChild(add);
}

document.getElementById("logoutBtn").addEventListener("click", () => {
  if (confirm("Logout karna chahte ho?")) {
    localStorage.removeItem('sw_logged_in');
    localStorage.removeItem('sw_user');
    localStorage.clear();
    window.location.href = '../home page/home.html';
  }
});