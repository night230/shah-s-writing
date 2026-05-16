// ═══════════════════════════════════════════════════════════════
// ABOUT.JS - PERFECT SIDEBAR + PANCHTANTRA SYNC
// ═══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    // ──────────────────────────────────────────────────────────────
    // 1. ELEMENTS
    // ──────────────────────────────────────────────────────────────
    const menuBtn = document.getElementById("menuBtn");
    const closeBtn = document.getElementById("closeBtn");
    const sidebar = document.querySelector(".sidebar");
    const overlay = document.getElementById("overlay");
    const year = document.getElementById("year");

    year.textContent = new Date().getFullYear();

    // ──────────────────────────────────────────────────────────────
    // 2. OPEN SIDEBAR (PERFECT HIDE)
    // ──────────────────────────────────────────────────────────────
    const openSidebar = () => {
        sidebar.classList.add("active");
        overlay.classList.add("active");
        document.body.style.overflow = 'hidden';
        menuBtn.classList.add('hidden'); // ✅ HIDE MENU BUTTON
        
        // PanchTantra sync
        if (typeof PanchTantra !== 'undefined') {
            PanchTantra.enter('.sidebar');
        }
    };

    // ──────────────────────────────────────────────────────────────
    // 3. CLOSE SIDEBAR (PERFECT SHOW)
    // ──────────────────────────────────────────────────────────────
    const closeSidebar = () => {
        sidebar.classList.remove("active");
        overlay.classList.remove("active");
        document.body.style.overflow = '';
        menuBtn.classList.remove('hidden'); // ✅ SHOW MENU BUTTON
    };

    // ──────────────────────────────────────────────────────────────
    // 4. EVENT LISTENERS
    // ──────────────────────────────────────────────────────────────
    menuBtn.addEventListener('click', openSidebar);
    closeBtn.addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);

    // ESC Key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('active')) {
            closeSidebar();
        }
    });

    // ──────────────────────────────────────────────────────────────
    // 5. PANCHTANTRA ENTRANCE (Safe Check)
    // ──────────────────────────────────────────────────────────────
    const entranceElements = document.querySelectorAll('.title, .text, .info-box, .btn');
    
    entranceElements.forEach((el, i) => {
        el.classList.add('pt-enter');
        el.style.animationDelay = `${i * 200}ms`;
    });

    // Safe PanchTantra calls
    if (typeof PanchTantra !== 'undefined') {
        PanchTantra.loadingFor?.('.info-box.skeleton-aura', 1000, 'shimmer');
        PanchTantra.enter?.('.title', true);
    }

    console.log("✅ About.js - Perfect Sidebar + PanchTantra Sync!");
});
