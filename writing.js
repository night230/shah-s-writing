/* ═══════════════════════════════════════════════════════════
   WRITING.JS — Dashboard logic + Sidebar
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
document.addEventListener("keydown", e => { if (e.key === "Escape") closeSidebar(); });

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

/* ═══════════════════════════════════════════════════════════
   DASHBOARD LOGIC
═══════════════════════════════════════════════════════════ */
const newWritingBtn   = document.getElementById('newWritingBtn');
const modal           = document.getElementById('modal');
const closeModal      = document.getElementById('closeModal');
const inputTitle      = document.getElementById('inputTitle');
const inputCategory   = document.getElementById('inputCategory');
const inputStatus     = document.getElementById('inputStatus');
const inputImage      = document.getElementById('inputImage');
const imgPreview      = document.getElementById('imgPreview');
const imgPreviewWrap  = document.getElementById('imgPreviewWrap');
const letterSubtypeWrap = document.getElementById('letterSubtypeWrap');
const pendingRow      = document.getElementById('pendingRow');
const continuedRow    = document.getElementById('continuedRow');
const completedRow    = document.getElementById('completedRow');
const cats            = document.querySelectorAll('.cat');

const LS_KEY = 'writer_dashboard_items_v1';
let items = JSON.parse(localStorage.getItem(LS_KEY) || '[]');

function uid(prefix='id'){ return prefix + '_' + Math.random().toString(36).slice(2,9); }

function openModal(){
  modal.setAttribute('aria-hidden','false');
  inputTitle.value = '';
  inputCategory.value = 'story';
  inputStatus.value = 'pending';
  inputImage.value = '';
  imgPreview.src = '';
  imgPreviewWrap.style.display = 'none';
  letterSubtypeWrap.style.display = 'none';
  uploadedDataURL = '';
}
function closeModalFn(){ modal.setAttribute('aria-hidden','true'); }

newWritingBtn.addEventListener('click', openModal);
closeModal.addEventListener('click', closeModalFn);
document.getElementById('cancelCreate').addEventListener('click', closeModalFn);

cats.forEach(b=>{
  b.addEventListener('click', ()=>{
    document.querySelector('.cat.active').classList.remove('active');
    b.classList.add('active');
    renderAll();
  });
});

inputCategory.addEventListener('change', ()=>{
  letterSubtypeWrap.style.display = inputCategory.value === 'letter' ? 'block' : 'none';
});

let uploadedDataURL = '';
inputImage.addEventListener('change', async (e)=>{
  const f = e.target.files[0];
  if(!f) return;
  const reader = new FileReader();
  reader.onload = () => {
    uploadedDataURL = reader.result;
    imgPreview.src = uploadedDataURL;
    imgPreviewWrap.style.display = 'block';
  };
  reader.readAsDataURL(f);
});

document.getElementById('saveItem').addEventListener('click', ()=>{
  const title    = inputTitle.value.trim() || 'Untitled';
  const category = inputCategory.value;
  const subtype  = document.getElementById('inputLetterType')?.value || '';
  const status   = inputStatus.value;
  const id       = uid('item');

  const item = { id, title, category, subtype, status, image: uploadedDataURL || '', createdAt: Date.now() };
  items.unshift(item);
  localStorage.setItem(LS_KEY, JSON.stringify(items));
  uploadedDataURL = '';
  closeModalFn();
  renderAll();
});

function buildAddCard(){
  const add = document.createElement('div');
  add.className = 'add-card';
  add.innerHTML = `<div class="plus">+</div><p>Add New</p>`;
  add.addEventListener('click', openModal);
  return add;
}

function buildStoryCard(it){
  const div = document.createElement('div');
  div.className = 'story-card';
  const img = document.createElement('img');
  img.className = 'story-thumb';
  img.src = it.image || createPlaceholderDataURL(it.title);

  const meta = document.createElement('div');
  meta.className = 'story-meta';
  const h = document.createElement('h3'); h.textContent = it.title;
  const p = document.createElement('p');
  p.textContent = (it.category === 'letter' && it.subtype)
    ? `${capitalize(it.subtype)} • ${it.status}`
    : `${capitalize(it.category)} • ${it.status}`;

  meta.appendChild(h); meta.appendChild(p);
  div.appendChild(img); div.appendChild(meta);
  return div;
}

function createPlaceholderDataURL(title){
  const w = 400, h = 240;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0,0,w,h);
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(12,12,w-24,h-24);
  ctx.fillStyle = '#8da3ab';
  ctx.font = 'bold 28px Inter, Arial';
  ctx.textAlign = 'center';
  ctx.fillText(title.length > 20 ? title.slice(0,20)+'…' : title, w/2, h/2+8);
  return canvas.toDataURL('image/png');
}

function capitalize(s){ return String(s||'').charAt(0).toUpperCase() + String(s||'').slice(1); }

function renderAll(){
  const currentCat = document.querySelector('.cat.active').dataset.type;
  pendingRow.innerHTML = '';
  continuedRow.innerHTML = '';
  completedRow.innerHTML = '';
  pendingRow.appendChild(buildAddCard());
  continuedRow.appendChild(buildAddCard());
  completedRow.appendChild(buildAddCard());

  const filtered = items.filter(it => it.category === currentCat);
  filtered.forEach(it=>{
    if(it.status === 'pending')   pendingRow.appendChild(buildStoryCard(it));
    if(it.status === 'continued') continuedRow.appendChild(buildStoryCard(it));
    if(it.status === 'completed') completedRow.appendChild(buildStoryCard(it));
  });
}

if(items.length === 0){
  const sample = [
    { id: uid('item'), title:'The Hidden Forest', category:'story', subtype:'', status:'pending',   image:'', createdAt:Date.now() },
    { id: uid('item'), title:'Dark Moon Rising',  category:'novel', subtype:'', status:'continued', image:'', createdAt:Date.now() },
    { id: uid('item'), title:'City of Mist',      category:'novel', subtype:'', status:'completed', image:'', createdAt:Date.now() }
  ];
  items = sample;
  localStorage.setItem(LS_KEY, JSON.stringify(items));
}

renderAll();

const quickNotes = document.getElementById('quickNotes');
quickNotes.value = localStorage.getItem('writer_quick_notes') || '';
quickNotes.addEventListener('input', ()=>{
  localStorage.setItem('writer_quick_notes', quickNotes.value);
});