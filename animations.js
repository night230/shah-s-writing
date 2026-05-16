/*!
 * PANCHTANTRA UNIVERSAL THEME ENGINE v2.0
 * 5 Sacred Elements | Godly & Demon Modes | Skeleton Animations
 * ─────────────────────────────────────────────────────────────
 * v2.0 — OPT-IN ONLY:
 *   Theme does NOT activate until user explicitly enables it from
 *   the account/settings page. Until then, zero styles are applied
 *   and existing page CSS/JS remains completely untouched.
 *
 *   localStorage keys used:
 *     pt_active  — "1" if user has enabled the theme
 *     pt_theme   — selected theme id (fire|water|earth|sky|life)
 *     pt_mode    — selected mode (normal|godly|demon)
 *
 * ─────────────────────────────────────────────────────────────
 * USAGE:
 *   Every page (just include both files — safe even when disabled):
 *     <link rel="stylesheet" href="panchtantra-theme.css">
 *     <script src="panchtantra-theme.js"></script>
 *
 *   Account/Settings page only (where you want the UI):
 *     PanchTantra.mountAccountSwitcher('#appearance-section');
 *
 * API:
 *   PanchTantra.mountAccountSwitcher(selector)  — mount UI
 *   PanchTantra.setTheme(theme, mode)           — change theme
 *   PanchTantra.enable()                        — enable theme
 *   PanchTantra.disable()                       — disable theme (restores page)
 *   PanchTantra.getState()                      — { theme, mode, active }
 *   PanchTantra.skelify(el, effect)             — add skeleton
 *   PanchTantra.unskelify(el)                   — remove skeleton
 *   PanchTantra.loadingFor(el, ms, effect)      — timed skeleton
 *   PanchTantra.enter(el, divine)               — entrance animation
 */

(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────
     CONFIG
  ───────────────────────────────────────────────────────── */
  const THEMES = [
    { id: 'fire',  icon: '🔥', label: 'Agni',    full: 'Agni — Fire'     },
    { id: 'water', icon: '💧', label: 'Jal',     full: 'Jal — Water'     },
    { id: 'earth', icon: '🪨', label: 'Prithvi', full: 'Prithvi — Earth' },
    { id: 'sky',   icon: '🌌', label: 'Akash',   full: 'Akash — Sky'     },
    { id: 'life',  icon: '🌿', label: 'Jeevan',  full: 'Jeevan — Life'   },
  ];
  const MODES = [
    { id: 'normal', icon: '⚖️',  label: 'Normal' },
    { id: 'godly',  icon: '✨', label: 'Godly'  },
    { id: 'demon',  icon: '💀', label: 'Demon'  },
  ];

  const KEY_ACTIVE = 'pt_active';
  const KEY_THEME  = 'pt_theme';
  const KEY_MODE   = 'pt_mode';

  /* ─────────────────────────────────────────────────────────
     STATE  — read from localStorage, never assume defaults
  ───────────────────────────────────────────────────────── */
  let isActive     = localStorage.getItem(KEY_ACTIVE) === '1';
  let currentTheme = localStorage.getItem(KEY_THEME)  || 'fire';
  let currentMode  = localStorage.getItem(KEY_MODE)   || 'normal';
  let particles    = [];
  let particleLoop = null;
  let canvas, ctx;

  /* ─────────────────────────────────────────────────────────
     ENABLE / DISABLE  — the main gate
  ───────────────────────────────────────────────────────── */
  function enable() {
    isActive = true;
    localStorage.setItem(KEY_ACTIVE, '1');
    document.documentElement.classList.add('pt-enabled');
    applyTheme(currentTheme, currentMode, /* save= */ false);
    updateToggleUI(true);
  }

  function disable() {
    isActive = false;
    localStorage.removeItem(KEY_ACTIVE);

    // Remove all PT attributes & class — page is fully restored
    const root = document.documentElement;
    root.classList.remove('pt-enabled');
    root.removeAttribute('data-theme');
    root.removeAttribute('data-mode');

    // Stop particles
    if (particleLoop) { cancelAnimationFrame(particleLoop); particleLoop = null; }
    if (canvas)       { canvas.remove(); canvas = null; ctx = null; }
    particles = [];

    updateToggleUI(false);
  }

  /* ─────────────────────────────────────────────────────────
     APPLY THEME  — only does visual work when active
  ───────────────────────────────────────────────────────── */
  function applyTheme(theme, mode, save = true) {
    currentTheme = theme;
    currentMode  = mode;

    if (save) {
      localStorage.setItem(KEY_THEME, theme);
      localStorage.setItem(KEY_MODE,  mode);
    }

    if (!isActive) return; // Theme disabled — touch nothing

    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    if (mode === 'normal') {
      root.removeAttribute('data-mode');
    } else {
      root.setAttribute('data-mode', mode);
    }

    triggerTransitionBurst();
    updateAllSwitcherUIs();
    restartParticles();
    applySkeletonTheme();
  }

  /* ─────────────────────────────────────────────────────────
     SKELETON AUTOMATION
  ───────────────────────────────────────────────────────── */
  function applySkeletonTheme() {
    if (!isActive) return;
    const effect = currentMode === 'demon' ? 'rattle' : 'shimmer';
    document.querySelectorAll('.skeleton:not(.pulse):not(.wave):not(.rattle)').forEach(el => {
      el.classList.remove('shimmer', 'pulse', 'wave', 'rattle');
      el.classList.add(effect);
    });
  }

  /* ─────────────────────────────────────────────────────────
     TRANSITION BURST
  ───────────────────────────────────────────────────────── */
  function triggerTransitionBurst() {
    if (!isActive) return;
    const burst = document.createElement('div');
    burst.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:99998', 'pointer-events:none',
      'background:radial-gradient(circle at 50% 50%,var(--pt-primary,#fff) 0%,transparent 70%)',
      'opacity:0.35', 'animation:ptBurstFade 0.5s ease-out forwards',
    ].join(';');
    document.body.appendChild(burst);
    setTimeout(() => burst.remove(), 500);
  }

  /* ─────────────────────────────────────────────────────────
     UPDATE ALL SWITCHER UIs
  ───────────────────────────────────────────────────────── */
  function updateAllSwitcherUIs() {
    document.querySelectorAll('.pt-theme-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.ptTheme === currentTheme);
    });
    document.querySelectorAll('.pt-mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.ptMode === currentMode);
    });
  }

  function updateToggleUI(active) {
    const checkbox = document.querySelector('#pt-account-switcher .pt-toggle input');
    if (checkbox) checkbox.checked = active;

    const controls = document.querySelector('#pt-account-switcher .pt-sw-controls');
    if (controls) controls.classList.toggle('visible', active);
  }

  /* ─────────────────────────────────────────────────────────
     ACCOUNT PAGE SWITCHER BUILDER
  ───────────────────────────────────────────────────────── */
  function mountAccountSwitcher(target) {
    const container = typeof target === 'string'
      ? document.querySelector(target)
      : target;

    if (!container) {
      console.warn('[PanchTantra] mountAccountSwitcher: target not found →', target);
      return;
    }
    if (document.getElementById('pt-account-switcher')) return;

    const wrap = document.createElement('div');
    wrap.id = 'pt-account-switcher';

    /* ── Section heading ── */
    const heading = document.createElement('div');
    heading.className = 'pt-sw-heading';
    heading.textContent = '⚡ Panchtantra Theme';
    wrap.appendChild(heading);

    /* ── Enable / Disable toggle row ── */
    const toggleRow = document.createElement('div');
    toggleRow.className = 'pt-sw-toggle-row';

    const toggleLabel = document.createElement('div');
    toggleLabel.className = 'pt-sw-toggle-label';
    toggleLabel.innerHTML = 'Theme enable karo<small>Sab pages pe apply hoga</small>';
    toggleRow.appendChild(toggleLabel);

    // Toggle switch HTML
    const toggleWrap = document.createElement('label');
    toggleWrap.className = 'pt-toggle';
    toggleWrap.title = 'Panchtantra theme on/off';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = isActive;
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) enable();
      else disable();
    });

    const track = document.createElement('span');
    track.className = 'pt-toggle-track';

    toggleWrap.appendChild(checkbox);
    toggleWrap.appendChild(track);
    toggleRow.appendChild(toggleWrap);
    wrap.appendChild(toggleRow);

    /* ── Collapsible controls (theme + mode) ── */
    const controls = document.createElement('div');
    controls.className = 'pt-sw-controls' + (isActive ? ' visible' : '');

    /* Theme sublabel */
    const themeLabel = document.createElement('div');
    themeLabel.className = 'pt-sw-sublabel';
    themeLabel.textContent = 'Apna element chunno';
    controls.appendChild(themeLabel);

    /* Theme grid */
    const grid = document.createElement('div');
    grid.className = 'pt-sw-theme-grid';
    THEMES.forEach(t => {
      const btn = document.createElement('button');
      btn.className = 'pt-theme-btn' + (currentTheme === t.id ? ' active' : '');
      btn.dataset.ptTheme = t.id;
      btn.title = t.full;
      btn.innerHTML = `<span class="pt-icon">${t.icon}</span><span>${t.label}</span>`;
      btn.addEventListener('click', () => applyTheme(t.id, currentMode));
      grid.appendChild(btn);
    });
    controls.appendChild(grid);

    /* Mode sublabel */
    const modeLabel = document.createElement('div');
    modeLabel.className = 'pt-sw-sublabel';
    modeLabel.textContent = 'Power mode';
    controls.appendChild(modeLabel);

    /* Mode row */
    const modeRow = document.createElement('div');
    modeRow.className = 'pt-sw-mode-row';
    MODES.forEach(m => {
      const btn = document.createElement('button');
      btn.className = 'pt-mode-btn' + (currentMode === m.id ? ' active' : '');
      btn.dataset.ptMode = m.id;
      btn.textContent = `${m.icon} ${m.label}`;
      btn.addEventListener('click', () => applyTheme(currentTheme, m.id));
      modeRow.appendChild(btn);
    });
    controls.appendChild(modeRow);

    wrap.appendChild(controls);

    /* ── Saved note ── */
    const note = document.createElement('p');
    note.className = 'pt-sw-note';
    note.textContent = '✓ Pasand save ho jaati hai — sab pages pe kaam karta hai. Disable karo toh page bilkul original rahega.';
    wrap.appendChild(note);

    container.appendChild(wrap);
  }

  /* ─────────────────────────────────────────────────────────
     FLOATING PARTICLES
  ───────────────────────────────────────────────────────── */
  function initParticleCanvas() {
    if (canvas) canvas.remove();
    canvas = document.createElement('canvas');
    canvas.id = 'pt-particles';
    canvas.style.cssText = 'position:fixed;inset:0;z-index:1;pointer-events:none;width:100%;height:100%;opacity:0.6;';
    document.body.insertBefore(canvas, document.body.firstChild);
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
  }

  function resizeCanvas() {
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  const PARTICLE_CONFIGS = {
    fire:  { color: '#ff6b35', shape: 'flame',   count: 30, speedY: 1.2,  speedX: 0.3,  size: 4 },
    water: { color: '#00e5ff', shape: 'bubble',  count: 25, speedY: 0.5,  speedX: 0.2,  size: 5 },
    earth: { color: '#d4993a', shape: 'crystal', count: 15, speedY: 0.4,  speedX: 0.15, size: 6 },
    sky:   { color: '#e0d0ff', shape: 'star',    count: 40, speedY: 0.3,  speedX: 0.1,  size: 3 },
    life:  { color: '#69ffb3', shape: 'leaf',    count: 20, speedY: 0.6,  speedX: 0.4,  size: 5 },
  };

  function spawnParticle(cfg) {
    return {
      x:     Math.random() * window.innerWidth,
      y:     window.innerHeight + 10,
      vx:    (Math.random() - 0.5) * cfg.speedX * 2,
      vy:    -cfg.speedY - Math.random() * 0.8,
      size:  cfg.size * (0.5 + Math.random()),
      alpha: 0.6 + Math.random() * 0.4,
      color: cfg.color,
      shape: cfg.shape,
      life:  1,
      decay: 0.004 + Math.random() * 0.003,
    };
  }

  function drawParticle(p) {
    if (!ctx) return;
    ctx.save();
    ctx.globalAlpha = p.alpha * p.life;
    ctx.fillStyle   = p.color;
    ctx.strokeStyle = p.color;
    ctx.translate(p.x, p.y);
    switch (p.shape) {
      case 'flame':
        ctx.beginPath();
        ctx.moveTo(0, p.size);
        ctx.bezierCurveTo(-p.size, p.size * 0.5, -p.size * 0.5, -p.size, 0, -p.size * 1.5);
        ctx.bezierCurveTo(p.size * 0.5, -p.size, p.size, p.size * 0.5, 0, p.size);
        ctx.fill(); break;
      case 'bubble':
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.lineWidth = 1; ctx.stroke(); break;
      case 'crystal':
        ctx.beginPath();
        ctx.moveTo(0, -p.size); ctx.lineTo(p.size * 0.6, 0);
        ctx.lineTo(0, p.size);  ctx.lineTo(-p.size * 0.6, 0);
        ctx.closePath(); ctx.fill(); break;
      case 'star':
        for (let i = 0; i < 5; i++) {
          const a = (i * Math.PI * 4) / 5 - Math.PI / 2;
          const b = a + Math.PI / 5;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * p.size, Math.sin(a) * p.size);
          ctx.lineTo(Math.cos(b) * p.size * 0.4, Math.sin(b) * p.size * 0.4);
          ctx.closePath(); ctx.fill();
        } break;
      case 'leaf':
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 0.5, p.size, 0, 0, Math.PI * 2);
        ctx.fill(); break;
    }
    ctx.restore();
  }

  function restartParticles() {
    if (!isActive) return;
    if (particleLoop) cancelAnimationFrame(particleLoop);
    particles = [];
    initParticleCanvas();
    const cfg = PARTICLE_CONFIGS[currentTheme] || PARTICLE_CONFIGS.fire;
    for (let i = 0; i < cfg.count; i++) {
      const p = spawnParticle(cfg);
      p.y = Math.random() * window.innerHeight;
      particles.push(p);
    }
    animateParticles(cfg);
  }

  function animateParticles(cfg) {
    if (!ctx || !isActive) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles = particles.filter(p => p.life > 0);
    while (particles.length < cfg.count) particles.push(spawnParticle(cfg));
    particles.forEach(p => {
      p.x    += p.vx;
      p.y    += p.vy;
      p.life -= p.decay;
      p.vx   += (Math.random() - 0.5) * 0.05;
      drawParticle(p);
    });
    particleLoop = requestAnimationFrame(() => animateParticles(cfg));
  }

  /* ─────────────────────────────────────────────────────────
     ENTRANCE ANIMATIONS (data-pt-enter attribute)
  ───────────────────────────────────────────────────────── */
  function observeEntrances() {
    if (!window.IntersectionObserver || !isActive) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('pt-enter');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('[data-pt-enter]').forEach(el => obs.observe(el));
  }

  /* ─────────────────────────────────────────────────────────
     PUBLIC API  — window.PanchTantra
  ───────────────────────────────────────────────────────── */
  window.PanchTantra = {
    /**
     * Mount the theme switcher UI inside a container on your account page.
     * @param {string|HTMLElement} target — CSS selector or element
     */
    mountAccountSwitcher(target) {
      mountAccountSwitcher(target);
    },

    /**
     * Enable the theme system.
     * Theme will now apply on all pages where the script is included.
     */
    enable() {
      enable();
    },

    /**
     * Disable the theme system.
     * Removes all PT classes/attributes — page returns to original state.
     */
    disable() {
      disable();
    },

    /**
     * Change theme programmatically.
     * Only works if theme is currently enabled.
     * @param {string} theme — 'fire'|'water'|'earth'|'sky'|'life'
     * @param {string} [mode] — 'normal'|'godly'|'demon'
     */
    setTheme(theme, mode) {
      applyTheme(theme || currentTheme, mode || currentMode);
    },

    /** Get current state */
    getState() {
      return { theme: currentTheme, mode: currentMode, active: isActive };
    },

    /**
     * Make any element a skeleton loader.
     * @param {HTMLElement|string} el
     * @param {'shimmer'|'pulse'|'wave'|'rattle'} [effect]
     */
    skelify(el, effect = 'shimmer') {
      const t = typeof el === 'string' ? document.querySelector(el) : el;
      if (t) t.classList.add('skeleton', effect);
    },

    /**
     * Remove skeleton state from element.
     * @param {HTMLElement|string} el
     */
    unskelify(el) {
      const t = typeof el === 'string' ? document.querySelector(el) : el;
      if (t) t.classList.remove('skeleton', 'shimmer', 'pulse', 'wave', 'rattle');
    },

    /**
     * Skelify an element for a duration, then restore it.
     * @param {HTMLElement|string} el
     * @param {number} [ms]
     * @param {'shimmer'|'pulse'|'wave'|'rattle'} [effect]
     */
    loadingFor(el, ms = 2000, effect = 'shimmer') {
      const t = typeof el === 'string' ? document.querySelector(el) : el;
      if (!t) return;
      const orig = t.innerHTML;
      this.skelify(t, effect);
      setTimeout(() => {
        this.unskelify(t);
        t.innerHTML = orig;
        if (isActive) t.classList.add('pt-enter');
      }, ms);
    },

    /**
     * Trigger entrance animation on any element.
     * @param {HTMLElement|string} el
     * @param {boolean} [divine] — true = divineDescend, false = riseFromAshes
     */
    enter(el, divine = false) {
      if (!isActive) return;
      const t = typeof el === 'string' ? document.querySelector(el) : el;
      if (!t) return;
      t.classList.remove('pt-enter', 'pt-enter-divine');
      void t.offsetWidth;
      t.classList.add(divine ? 'pt-enter-divine' : 'pt-enter');
    },
  };

  /* ─────────────────────────────────────────────────────────
     INIT  — runs on every page
     Only applies visual changes if pt_active === "1"
  ───────────────────────────────────────────────────────── */
  function init() {
    if (isActive) {
      // User has previously enabled — apply saved theme
      document.documentElement.classList.add('pt-enabled');
      applyTheme(currentTheme, currentMode, /* save= */ false);
      observeEntrances();

      // Auto-skelify elements marked with data-pt-skeleton
      document.querySelectorAll('[data-pt-skeleton]').forEach(el => {
        const effect = el.dataset.ptSkeleton || 'shimmer';
        window.PanchTantra.skelify(el, effect);
      });
    }
    // If NOT active: do absolutely nothing — page is untouched
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();