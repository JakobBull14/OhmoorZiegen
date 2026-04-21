/**
 * SCHULZIEGEN — nav.js
 * Baut den gemeinsamen Header und die Navigation auf jeder Seite auf.
 * Wird NACH data.js eingebunden.
 *
 * Nutzung in jeder HTML-Seite:
 *   <div id="nav-root"></div>
 *   <script src="data.js"></script>
 *   <script src="nav.js"></script>
 *   <script> buildNav('gallery'); </script>   ← aktuelle Seite angeben
 */

function buildNav(activePage) {
  const isAdmin = isAdminLoggedIn();

  const pages = [
    { id:'gallery',    href:'/OhmoorZiegen/index.html',      icon:'🐐', label:'Ziegen'    },
    { id:'monat',     href:'/OhmoorZiegen/monat.html',       icon:'⭐', label:'Monat'     },
    { id:'quiz',      href:'/OhmoorZiegen/quiz.html',        icon:'🧠', label:'Quiz'      },
    { id:'memory',    href:'/OhmoorZiegen/memory.html',      icon:'🃏', label:'Memory'    },
    { id:'rangliste', href:'/OhmoorZiegen/rangliste.html',   icon:'🏆', label:'Rangliste' },
    { id:'fakten',    href:'/OhmoorZiegen/fakten.html',      icon:'💡', label:'Fakten'    },
  ];

  // Alle Seiten-Links (Desktop-Tabs + Drawer)
  const tabsHtml = pages.map(p => `
    <a class="nav-tab${p.id === activePage ? ' active' : ''}" href="${p.href}" data-page="${p.id}">
      <span class="nav-tab-icon">${p.icon}</span> ${p.label}
    </a>`).join('');

  // Bottom Nav (Handy) — nur die 5 wichtigsten
  const bottomPages = [
    { id:'gallery',   href:'/OhmoorZiegen/index.html',    icon:'🐐', label:'Ziegen'   },
    { id:'quiz',      href:'/OhmoorZiegen/quiz.html',     icon:'🧠', label:'Quiz'     },
    { id:'memory',    href:'/OhmoorZiegen/memory.html',   icon:'🃏', label:'Memory'   },
    { id:'rangliste', href:'/OhmoorZiegen/rangliste.html',icon:'🏆', label:'Rangliste'},
    { id:'fakten',    href:'/OhmoorZiegen/fakten.html',   icon:'💡', label:'Fakten'   },
  ];

  const bottomHtml = bottomPages.map(p => `
    <a class="bottom-nav-item${p.id === activePage ? ' active' : ''}" href="${p.href}" data-page="${p.id}">
      <span class="bottom-nav-icon">${p.icon}</span>${p.label}
    </a>`).join('');

  const drawerItems = pages.map(p => `
    <a class="drawer-item" href="${p.href}">
      <span class="drawer-item-icon">${p.icon}</span>${p.label}
    </a>`).join('');

  const html = `
    <!-- Header -->
    <header class="app-header">
      <a class="app-logo" href="index.html">
        <span class="app-logo-icon">🐐</span>
        Schul<span>ziegen</span>
      </a>

      <div class="header-right">
        ${isAdmin ? `<a href="admin.html" style="font-size:11px;font-weight:600;padding:5px 10px;background:var(--clr-yellow-light);color:var(--clr-yellow);border-radius:var(--radius-full);text-decoration:none;border:1px solid var(--clr-yellow)">● Admin</a>` : ''}
        <button class="icon-btn" onclick="toggleDrawerNav()" aria-label="Menü">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
            <rect y="2"  width="18" height="2" rx="1"/>
            <rect y="8"  width="18" height="2" rx="1"/>
            <rect y="14" width="18" height="2" rx="1"/>
          </svg>
        </button>
      </div>
    </header>

    <!-- Desktop-Tabs -->
    <nav class="nav-tabs">${tabsHtml}</nav>

    <!-- Handy Bottom Navigation -->
    <nav class="bottom-nav">${bottomHtml}</nav>

    <!-- Drawer Overlay -->
    <div class="drawer-overlay" id="nav-dov" onclick="closeDrawerNav()"></div>
    <div class="drawer" id="nav-drawer">
      <div class="drawer-header">
        <span class="drawer-title">🐐 Schulziegen</span>
        <button class="drawer-close" onclick="closeDrawerNav()">✕</button>
      </div>
      <div class="drawer-body">
        <div class="drawer-section-label">Seiten</div>
        ${drawerItems}
        ${isAdmin ? `<a class="drawer-item" href="admin.html"><span class="drawer-item-icon">🔐</span>Admin-Bereich</a>` : ''}
        <div class="drawer-section-label" style="margin-top:8px">Einstellungen</div>
        <div class="dark-mode-row">
          <div class="dark-mode-label"><span>🌙</span>Dark Mode</div>
          <label class="toggle">
            <input type="checkbox" id="dark-tog" onchange="toggleDark()">
            <span class="toggle-track"></span>
          </label>
        </div>
        ${isAdmin
          ? `<button class="drawer-item" onclick="adminLogout();location.href='index.html'"><span class="drawer-item-icon">🚪</span>Admin abmelden</button>`
          : `<a class="drawer-item" href="admin.html"><span class="drawer-item-icon">🔑</span>Admin-Login</a>`
        }
      </div>
    </div>`;


  const root = document.getElementById('nav-root');
  if (root) root.innerHTML = html;

  if (!document.getElementById('app-footer')) {
    document.body.insertAdjacentHTML('beforeend', `
      <footer id="app-footer" style="margin-top:28px;padding:18px 20px 28px;text-align:center;font-size:12px;color:var(--clr-text-muted);border-top:1px solid rgba(0,0,0,0.08)">
        <a href="/OhmoorZiegen/datenschutz.html" style="color:inherit;text-decoration:none">Datenschutz</a>
      </footer>
    `);
}

  // Dark Mode sofort anwenden
  applyDark();
}

function toggleDrawerNav() {
  document.getElementById('nav-dov').classList.toggle('open');
  document.getElementById('nav-drawer').classList.toggle('open');
}

function closeDrawerNav() {
  document.getElementById('nav-dov').classList.remove('open');
  document.getElementById('nav-drawer').classList.remove('open');
}
