/* ========== Simple localStorage-backed app state ========== */
const LS_USER_KEY = 'ws_user_v1';
const LS_POSTS_KEY = 'ws_posts_v1'; // array of posts
let state = {
  user: null,
  posts: []
};

function saveState(){
  if(state.user) localStorage.setItem(LS_USER_KEY, JSON.stringify(state.user));
  localStorage.setItem(LS_POSTS_KEY, JSON.stringify(state.posts));
}
function loadState(){
  const rawUser = localStorage.getItem(LS_USER_KEY);
  const rawPosts = localStorage.getItem(LS_POSTS_KEY);
  state.user = rawUser ? JSON.parse(rawUser) : null;
  state.posts = rawPosts ? JSON.parse(rawPosts) : [];
}
loadState();

/* ══ LOAD STORY FROM URL PARAM (from writing dashboard) ══ */
(function loadStoryFromURL() {
  const params = new URLSearchParams(window.location.search);
  const storyId = params.get('id');
  if (!storyId) return;

  const LS_DASHBOARD = 'writer_dashboard_items_v1';
  const LS_CONTENT   = 'writer_content_';

  const items = JSON.parse(localStorage.getItem(LS_DASHBOARD) || '[]');
  const story = items.find(it => it.id === storyId);
  if (!story) return;

  window.addEventListener('DOMContentLoaded', () => {
    // Set title
    const titleEl = document.getElementById('post-title');
    if (titleEl) titleEl.value = story.title;

    // Load saved content
    const saved = localStorage.getItem(LS_CONTENT + storyId);
    const editorEl = document.getElementById('editor');
    if (editorEl && saved) editorEl.innerHTML = saved;

    // Auto-save on every input
    if (editorEl) {
      editorEl.addEventListener('input', () => {
        localStorage.setItem(LS_CONTENT + storyId, editorEl.innerHTML);
      });
    }

    // Save draft button also saves to reading page key
    const saveDraftBtn = document.getElementById('save-draft');
    if (saveDraftBtn) {
      saveDraftBtn.addEventListener('click', () => {
        if (editorEl) localStorage.setItem(LS_CONTENT + storyId, editorEl.innerHTML);
        const flash = document.createElement('div');
        flash.textContent = '✓ Draft saved!';
        flash.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#00c853cc;color:#fff;padding:10px 24px;border-radius:10px;z-index:9999;font-weight:600;';
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 2000);
      });
    }

    // Back button
    const brand = document.querySelector('.brand');
    if (brand) {
      brand.style.cursor = 'pointer';
      brand.title = 'Back to Writing Dashboard';
      brand.addEventListener('click', () => {
        window.location.href = 'writing.html';
      });
    }
  });
})();


/* ========== Utilities ========== */
function uid(prefix='id'){
  return prefix + '_' + Math.random().toString(36).slice(2,9);
}
function el(tag, attrs={}, children=[]){
  const d = document.createElement(tag);
  for(const k in attrs) {
    if(k.startsWith('on') && typeof attrs[k] === 'function') d.addEventListener(k.slice(2), attrs[k]);
    else if(k === 'html') d.innerHTML = attrs[k];
    else d.setAttribute(k, attrs[k]);
  }
  children.forEach(c => typeof c === 'string' ? d.appendChild(document.createTextNode(c)) : d.appendChild(c));
  return d;
}

/* ========== UI References ========== */
const topControls = document.getElementById('top-controls');
const leftName = document.getElementById('left-name');
const leftEmail = document.getElementById('left-email');
const leftAvatar = document.getElementById('left-avatar');
const postsListEl = document.getElementById('posts-list');
const postsCountEl = document.getElementById('posts-count');
const postTitleEl = document.getElementById('post-title');
const editorEl = document.getElementById('editor');

/* ========== Auth UI ========== */
function renderTopControls(){
  topControls.innerHTML = '';
  if(state.user){
    const btnLogout = el('button',{class:'btn btn-ghost', onclick:() => { logout(); }}, ['Logout']);
    const userBtn = el('button',{class:'btn', onclick:()=>{ showProfile(); }}, [state.user.name || state.user.email || 'Me']);
    topControls.appendChild(userBtn);
    topControls.appendChild(btnLogout);
  } else {
    const btn = el('button',{class:'btn', onclick:()=>{ showAuthModal(); }}, ['Sign in / Sign up']);
    topControls.appendChild(btn);
  }
  renderLeftProfile();
}

/* update left profile */
function renderLeftProfile(){
  leftName.textContent = state.user ? (state.user.name || state.user.email) : 'Guest';
  leftEmail.textContent = state.user ? (state.user.email || '') : 'Not signed in';
  leftAvatar.textContent = state.user ? (state.user.name ? state.user.name[0].toUpperCase() : 'U') : 'W';
}

/* Basic modal */
function showModal(htmlContent){
  const root = document.getElementById('modal-root');
  root.innerHTML = '';
  root.style.display = 'flex';
  root.className = 'modal-back';
  const box = el('div',{class:'modal'});
  box.innerHTML = htmlContent;
  root.appendChild(box);
  root.addEventListener('click', (e)=> {
    if(e.target === root) root.style.display='none';
  });
}
function closeModal(){ document.getElementById('modal-root').style.display='none'; }

/* Auth modal with simple signup */
function showAuthModal(){
  showModal(`
    <h3 style="margin-top:0">Welcome to WriteSpace</h3>
    <div class="field">
      <label class="small">Name (optional)</label>
      <input id="auth-name" type="text" placeholder="Your name" />
    </div>
    <div class="field">
      <label class="small">Email</label>
      <input id="auth-email" type="email" placeholder="you@example.com" />
    </div>
    <div class="field">
      <label class="small">Password (min 4 chars)</label>
      <input id="auth-pass" type="password" placeholder="password" />
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px">
      <button class="btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn" onclick="authSubmit()">Continue</button>
    </div>
  `);
  // Attach functions to window so inline onclick works
  window.authSubmit = () => {
    const name = document.getElementById('auth-name').value.trim();
    const email = document.getElementById('auth-email').value.trim();
    const pass = document.getElementById('auth-pass').value;
    if(!email || pass.length < 4){ alert('Enter valid email and password (min 4 chars)'); return; }
    // create user object
    const user = { id: uid('u'), name: name || null, email, createdAt: Date.now() };
    state.user = user;
    saveState();
    closeModal();
    renderTopControls();
    renderPosts();
    alert('Signed in as ' + (name || email));
  };
}

/* logout */
function logout(){
  state.user = null;
  localStorage.removeItem(LS_USER_KEY);
  renderTopControls();
  renderPosts();
}

/* show profile */
function showProfile(){
  if(!state.user) { showAuthModal(); return; }
  showModal(`
    <h3>Profile</h3>
    <div class="field"><label class="small">Name</label><input id="pf-name" type="text" value="${escapeHtml(state.user.name||'')}" /></div>
    <div class="field"><label class="small">Email</label><input id="pf-email" type="email" value="${escapeHtml(state.user.email||'')}" /></div>
    <div style="display:flex;gap:8px;justify-content:flex-end">
      <button class="btn-ghost" onclick="closeModal()">Close</button>
      <button class="btn" onclick="saveProfile()">Save</button>
    </div>
  `);
  window.saveProfile = () => {
    const n = document.getElementById('pf-name').value.trim();
    const e = document.getElementById('pf-email').value.trim();
    state.user.name = n || state.user.name;
    state.user.email = e || state.user.email;
    saveState();
    renderTopControls();
    closeModal();
    alert('Profile updated');
  };
}

/* ========== Posts management ========== */
function createPost({title='',html='',status='draft',id=null} = {}){
  if(!state.user){ alert('Please sign in to save posts'); showAuthModal(); return; }
  const p = {
    id: id || uid('p'),
    authorId: state.user.id,
    title: title || 'Untitled',
    html: html || '',
    status, // draft or published
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  state.posts.unshift(p);
  saveState();
  renderPosts();
  return p;
}

function updatePost(id, updates){
  const idx = state.posts.findIndex(x=>x.id===id);
  if(idx === -1) return null;
  state.posts[idx] = {...state.posts[idx], ...updates, updatedAt: Date.now()};
  saveState();
  renderPosts();
  return state.posts[idx];
}

function deletePost(id){
  if(!confirm('Delete post permanently?')) return;
  state.posts = state.posts.filter(x=>x.id!==id);
  saveState();
  renderPosts();
}

/* ========== Render posts list ========== */
function renderPosts(filter=''){
  postsListEl.innerHTML = '';
  const userPosts = state.user ? state.posts.filter(p => p.authorId === state.user.id) : [];
  const toShow = userPosts.filter(p => p.title.toLowerCase().includes(filter.toLowerCase()) || (p.html||'').toLowerCase().includes(filter.toLowerCase()));
  postsCountEl.textContent = toShow.length;
  if(toShow.length === 0) {
    postsListEl.innerHTML = '<div class="muted">No posts yet. Create your first post!</div>';
    return;
  }
  toShow.forEach(p => {
    const box = el('div',{class:'post-row'});
    const left = el('div',{},[
      el('div',{},[ el('strong',{},[p.title]) ]),
      el('div',{class:'muted'},[ new Date(p.updatedAt).toLocaleString() + ' • ' + (p.status === 'published' ? 'Published' : 'Draft') ])
    ]);
    const actions = el('div',{},[]);
    const btnOpen = el('button',{class:'tool', onclick:()=>{ openPostToEditor(p.id); }}, ['Open']);
    const btnPublish = el('button',{class:'tool', onclick:()=>{ togglePublish(p.id); }}, [p.status==='published' ? 'Unpublish' : 'Publish']);
    const btnDelete = el('button',{class:'tool', onclick:()=>{ deletePost(p.id); }}, ['Delete']);
    actions.appendChild(btnOpen); actions.appendChild(btnPublish); actions.appendChild(btnDelete);
    box.appendChild(left); box.appendChild(actions);
    postsListEl.appendChild(box);
  });
}

/* open post into editor */
function openPostToEditor(id){
  const p = state.posts.find(x=>x.id===id);
  if(!p) return alert('Post not found');
  postTitleEl.value = p.title;
  editorEl.innerHTML = p.html;
  editorEl.dataset.editing = p.id;
  window.scrollTo({top:0,behavior:'smooth'});
}

/* publish / unpublish */
function togglePublish(id){
  const p = state.posts.find(x=>x.id===id);
  if(!p) return;
  const newStatus = p.status === 'published' ? 'draft' : 'published';
  updatePost(id, {status: newStatus});
  alert('Post ' + (newStatus==='published' ? 'published' : 'moved to drafts'));
}

/* ========== Editor toolbar actions ========== */
document.getElementById('toolbar').addEventListener('click', (e)=>{
  const btn = e.target.closest('button');
  if(!btn) return;
  const cmd = btn.dataset.cmd;
  if(cmd){
    if(cmd === 'h1') document.execCommand('formatBlock', false, 'h1');
    else if(cmd === 'h2') document.execCommand('formatBlock', false, 'h2');
    else document.execCommand(cmd, false, null);
    editorEl.focus();
  }
});
document.getElementById('insert-link').addEventListener('click', ()=>{
  const url = prompt('Enter URL');
  if(url) document.execCommand('createLink', false, url);
  editorEl.focus();
});
document.getElementById('insert-image').addEventListener('click', ()=>{
  const url = prompt('Image URL (or leave empty to paste image directly)');
  if(url){
    document.execCommand('insertImage', false, url);
  } else {
    alert('You can paste images directly (Ctrl+V) into the editor in many browsers.');
  }
});
document.getElementById('clear-format').addEventListener('click', ()=>{
  document.execCommand('removeFormat', false, null);
  alert('Cleared inline formatting for selection');
});

/* Save draft / publish actions */
document.getElementById('save-draft').addEventListener('click', ()=>{
  if(!state.user){ showAuthModal(); return; }
  const title = postTitleEl.value.trim() || 'Untitled';
  const html = editorEl.innerHTML.trim();
  const editingId = editorEl.dataset.editing;
  if(editingId){
    updatePost(editingId, {title, html, status:'draft'});
    alert('Draft updated');
  } else {
    createPost({title, html, status:'draft'});
    alert('Draft saved');
  }
});

document.getElementById('publish-post').addEventListener('click', ()=>{
  if(!state.user){ showAuthModal(); return; }
  const title = postTitleEl.value.trim() || 'Untitled';
  const html = editorEl.innerHTML.trim();
  const editingId = editorEl.dataset.editing;
  if(editingId){
    updatePost(editingId, {title, html, status:'published'});
    alert('Post published');
  } else {
    createPost({title, html, status:'published'});
    alert('Post published');
  }
  // clear editor after publish
  postTitleEl.value = '';
  editorEl.innerHTML = '';
  editorEl.dataset.editing = '';
});

/* search */
document.getElementById('search-posts').addEventListener('input', (e)=>{
  renderPosts(e.target.value);
});

/* left nav interactions */
document.querySelectorAll('#left-col nav .item').forEach(it=>{
  it.addEventListener('click', ()=> {
    const action = it.dataset.action;
    if(action === 'new'){
      postTitleEl.value = '';
      editorEl.innerHTML = '';
      editorEl.dataset.editing = '';
      window.scrollTo({top:0,behavior:'smooth'});
    } else if(action === 'drafts'){
      // filter to drafts only
      postsListEl.innerHTML = '';
      const userPosts = state.user ? state.posts.filter(p=>p.authorId===state.user.id && p.status==='draft') : [];
      if(userPosts.length===0) postsListEl.innerHTML = '<div class="muted">No drafts</div>';
      else {
        userPosts.forEach(p=>{
          const box = el('div',{class:'post-row'});
          box.innerHTML = `<div><strong>${escapeHtml(p.title)}</strong><div class="muted">${new Date(p.updatedAt).toLocaleString()}</div></div>
            <div><button class="tool" onclick="openPostToEditor('${p.id}')">Open</button></div>`;
          postsListEl.appendChild(box);
        });
      }
    } else if(action === 'published'){
      postsListEl.innerHTML = '';
      const userPosts = state.user ? state.posts.filter(p=>p.authorId===state.user.id && p.status==='published') : [];
      if(userPosts.length===0) postsListEl.innerHTML = '<div class="muted">No published posts</div>';
      else {
        userPosts.forEach(p=>{
          const box = el('div',{class:'post-row'});
          box.innerHTML = `<div><strong>${escapeHtml(p.title)}</strong><div class="muted">${new Date(p.updatedAt).toLocaleString()}</div></div>
            <div><button class="tool" onclick="openPostToEditor('${p.id}')">Open</button></div>`;
          postsListEl.appendChild(box);
        });
      }
    } else if(action === 'profile') showProfile();
    else alert('Not implemented yet');
  });
});

/* ========== Helpers for escaping & init ========== */
function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

/* init render */
renderTopControls();
renderPosts();

/* keyboard shortcut: Ctrl+S to save draft */
window.addEventListener('keydown', (e)=>{
  if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's'){
    e.preventDefault();
    document.getElementById('save-draft').click();
  }
});