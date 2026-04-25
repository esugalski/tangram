// Shared sidebar for Tangram eQMS — flat nav edition
// Usage: add id="sidebar-root" to <aside class="sidebar">, then call initSidebar({ activePage: '...' })
// activePage accepts both old workflow keys and new hub keys (see ACTIVE_MAP).

const NAV_ITEMS = [
  {
    key: 'my-work',
    label: 'My Work',
    href: 'my-work.html',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
  },
  {
    key: 'library',
    label: 'Library',
    href: 'doc-library.html',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
  },
  {
    key: 'design-controls',
    label: 'Design Controls',
    href: 'design-controls.html',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="9" width="5" height="6" rx="1"/><rect x="9.5" y="9" width="5" height="6" rx="1"/><rect x="17" y="9" width="5" height="6" rx="1"/><line x1="7" y1="12" x2="9.5" y2="12"/><line x1="14.5" y1="12" x2="17" y2="12"/></svg>',
  },
  {
    key: 'risk-management',
    label: 'Risk Management',
    href: 'risk-management.html',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  },
  {
    key: 'capa-ncr',
    label: 'CAPA / NCR',
    href: 'capa-ncr.html',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>',
  },
  {
    key: 'suppliers',
    label: 'Suppliers',
    href: 'suppliers.html',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>',
  },
  {
    key: 'audits',
    label: 'Audits',
    href: 'audits.html',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
  },
  {
    key: 'training',
    label: 'Training',
    href: 'training-hub.html',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>',
  },
  {
    key: 'reports',
    label: 'Reports',
    href: 'reports.html',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  },
];

// Maps old activePage strings (from legacy workflow pages) → new nav key.
// Old pages need no code change — they keep calling initSidebar({ activePage: 'capa' })
// and this map resolves to 'capa-ncr'.
const ACTIVE_MAP = {
  // → My Work
  'dashboard':          'my-work',
  'quality-roadmap':    'my-work',
  'quality-navigator':  'my-work',
  'import-docs':        'my-work',
  // → Library
  'doc-library':        'library',
  'quality-manual':     'library',
  'process-library':    'library',
  'standards-library':  'library',
  'document-control':   'library',
  'design-review':      'library',
  // → Design Controls
  'products-mdf':               'design-controls',
  'user-needs':                 'design-controls',
  'regulatory-assessment':      'design-controls',
  'dev-plan':                   'design-controls',
  'design-inputs-tool':         'design-controls',
  'trace-matrix':               'design-controls',
  'design-outputs':             'design-controls',
  'dmr':                        'design-controls',
  'vv':                         'design-controls',
  'validation-hub':             'design-controls',
  'design-control':             'design-controls',
  // → Risk Management
  'risk-management-plan':       'risk-management',
  'risk-management-procedure':  'risk-management',
  // → CAPA / NCR
  'capa':             'capa-ncr',
  'nonconformance':   'capa-ncr',
  'complaints':       'capa-ncr',
  'change-control':   'capa-ncr',
  'post-market':      'capa-ncr',
  // → Suppliers
  'suppliers':  'suppliers',
  'equipment':  'suppliers',
  // → Audits
  'audit':        'audits',
  'audit-ready':  'audits',
  // → Training
  'team-training':  'training',
  'training':       'training',
  // → Reports
  'management-review':  'reports',
};

const SIDEBAR_FLAT_CSS = [
  // Sidebar dimensions — override whatever the old page set
  '.sidebar { width: 220px !important; min-width: 220px !important; flex-shrink: 0 !important; }',
  // Nav item base
  '.sidebar-nav-item {',
  '  display: flex !important; align-items: center !important; gap: 0.65rem !important;',
  '  padding: 0.5rem 0.85rem !important; border-radius: 7px !important;',
  '  font-size: 0.82rem !important; font-weight: 500 !important;',
  '  color: rgba(255,255,255,0.62) !important; text-decoration: none !important;',
  '  transition: background 0.13s, color 0.13s !important;',
  '  margin: 1px 0.5rem !important; letter-spacing: 0 !important;',
  '  white-space: nowrap !important; overflow: hidden !important;',
  '}',
  '.sidebar-nav-item:hover { background: rgba(255,255,255,0.07) !important; color: rgba(255,255,255,0.9) !important; }',
  '.sidebar-nav-item.active { background: rgba(10,192,233,0.14) !important; color: #0AC0E9 !important; font-weight: 600 !important; }',
  '.sidebar-nav-item.active .sidebar-nav-icon { stroke: #0AC0E9; }',
  // Icon
  '.sidebar-nav-icon { width: 16px !important; height: 16px !important; flex-shrink: 0 !important; stroke: currentColor; fill: none; display: flex !important; }',
  '.sidebar-nav-icon svg { width: 16px; height: 16px; stroke: inherit; fill: none; }',
  // Hide old sidebar structural elements that old pages may have emitted
  '.sidebar-mode-toggle, .phase-group, .sidebar-section-label, .sidebar-section,',
  '.project-switcher-wrap, .sidebar-project-nav, .sidebar-system-nav, .sidebar-divider,',
  '.lm-journey-pill, .lm-journey-continue { display: none !important; }',
].join('\n');

function initSidebar(config) {
  config = config || {};
  var oldKey = config.activePage || '';
  var activeKey = ACTIVE_MAP[oldKey] || oldKey;

  // Inject flat-nav override CSS once per page
  if (!document.getElementById('sidebar-flat-styles')) {
    var flatStyle = document.createElement('style');
    flatStyle.id = 'sidebar-flat-styles';
    flatStyle.textContent = SIDEBAR_FLAT_CSS;
    document.head.appendChild(flatStyle);
  }

  // Inject mobile sidebar styles once
  if (!document.getElementById('sidebar-mobile-styles')) {
    var mStyle = document.createElement('style');
    mStyle.id = 'sidebar-mobile-styles';
    mStyle.textContent = [
      '.sidebar-mobile-toggle {',
      '  display: none;',
      '  position: fixed; top: 10px; left: 12px; z-index: 300;',
      '  width: 38px; height: 38px; padding: 0;',
      '  background: white; color: #0B2740;',
      '  border: 1px solid rgba(11,39,64,0.12); border-radius: 8px;',
      '  align-items: center; justify-content: center; cursor: pointer;',
      '  box-shadow: 0 1px 2px rgba(11,39,64,0.04);',
      '  transition: background 0.15s, border-color 0.15s, transform 0.12s;',
      '}',
      '.sidebar-mobile-toggle:hover { background: rgba(11,39,64,0.035); border-color: rgba(11,39,64,0.22); }',
      '.sidebar-mobile-toggle:active { transform: scale(0.96); }',
      '.sidebar-mobile-toggle svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }',
      '.sidebar-mobile-toggle:focus-visible { outline: 2px solid rgba(10,192,233,0.55); outline-offset: 2px; }',
      '.sidebar-mobile-backdrop {',
      '  display: none; position: fixed; inset: 0;',
      '  background: rgba(2,25,47,0.55); backdrop-filter: blur(2px);',
      '  z-index: 190; opacity: 0; transition: opacity 0.2s ease;',
      '}',
      '@media (max-width: 900px) {',
      '  .sidebar-mobile-toggle { display: inline-flex; }',
      '  .sidebar {',
      '    position: fixed !important; top: 0; left: 0; bottom: 0;',
      '    height: 100vh; z-index: 200;',
      '    transform: translateX(-100%);',
      '    transition: transform 0.24s cubic-bezier(0.4,0,0.2,1);',
      '    box-shadow: 0 18px 40px rgba(2,25,47,0.35);',
      '  }',
      '  body.sidebar-mobile-open .sidebar { transform: translateX(0); }',
      '  body.sidebar-mobile-open .sidebar-mobile-backdrop { display: block; opacity: 1; }',
      '  body.sidebar-mobile-open { overflow: hidden; }',
      '  .lm-step-footer { left: 0 !important; padding-left: 4rem !important; }',
      '}',
    ].join('\n');
    document.head.appendChild(mStyle);
  }

  // Build nav items HTML
  var navItemsHTML = NAV_ITEMS.map(function(item) {
    var isActive = item.key === activeKey;
    return '<a class="sidebar-nav-item' + (isActive ? ' active' : '') + '" href="' + item.href + '" id="nav-' + item.key + '">' +
      '<span class="sidebar-nav-icon">' + item.icon + '</span>' +
      item.label +
    '</a>';
  }).join('');

  var html =
    '<div class="sidebar-header">' +
      '<div class="sidebar-brand">' +
        '<img src="../../brand_assets/Tangram-T%20mark%20reverse_Square.png" alt="Tangram" class="sidebar-t-mark">' +
        '<div>' +
          '<div class="sidebar-brand-name">Tangram eQMS</div>' +
          '<div class="sidebar-brand-sub">Early Access</div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<nav class="sidebar-nav" style="padding:0.5rem 0;flex:1;overflow-y:auto;">' +
      navItemsHTML +
    '</nav>' +
    '<div class="sidebar-footer">' +
      '<div class="sidebar-user">' +
        '<div class="sidebar-avatar">FM</div>' +
        '<div>' +
          '<div class="sidebar-user-name">Founding Member</div>' +
          '<div class="sidebar-user-role">Early Access</div>' +
        '</div>' +
        '<div class="sidebar-sign-out"><a href="auth.html">Sign out</a></div>' +
      '</div>' +
    '</div>';

  var root = document.getElementById('sidebar-root') || document.getElementById('sidebar');
  if (root) root.innerHTML = html;

  injectMobileSidebarControls();
}

function injectMobileSidebarControls() {
  if (!document.getElementById('sidebar-mobile-toggle')) {
    var btn = document.createElement('button');
    btn.id = 'sidebar-mobile-toggle';
    btn.className = 'sidebar-mobile-toggle';
    btn.setAttribute('aria-label', 'Open navigation');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<svg viewBox="0 0 24 24"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>';
    btn.addEventListener('click', toggleMobileSidebar);
    document.body.appendChild(btn);
  }
  if (!document.getElementById('sidebar-mobile-backdrop')) {
    var bd = document.createElement('div');
    bd.id = 'sidebar-mobile-backdrop';
    bd.className = 'sidebar-mobile-backdrop';
    bd.addEventListener('click', closeMobileSidebar);
    document.body.appendChild(bd);
  }
  var root = document.getElementById('sidebar-root');
  if (root && !root.dataset.mobileHandlersBound) {
    root.addEventListener('click', function(e) {
      var link = e.target.closest('a.sidebar-nav-item, a');
      if (!link) return;
      if (window.matchMedia('(max-width: 900px)').matches) closeMobileSidebar();
    });
    root.dataset.mobileHandlersBound = '1';
  }
  if (!window._sbEscBound) {
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeMobileSidebar();
    });
    window._sbEscBound = true;
  }
}

function toggleMobileSidebar() {
  if (document.body.classList.contains('sidebar-mobile-open')) {
    closeMobileSidebar();
  } else {
    openMobileSidebar();
  }
}

function openMobileSidebar() {
  document.body.classList.add('sidebar-mobile-open');
  var btn = document.getElementById('sidebar-mobile-toggle');
  if (btn) btn.setAttribute('aria-expanded', 'true');
}

function closeMobileSidebar() {
  document.body.classList.remove('sidebar-mobile-open');
  var btn = document.getElementById('sidebar-mobile-toggle');
  if (btn) btn.setAttribute('aria-expanded', 'false');
}

function _sbEsc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function(c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function _getActiveProjectName() {
  try {
    var ra = JSON.parse(localStorage.getItem('qms_regulatory_assessment'));
    if (ra && ra.deviceName) return _sbEsc(ra.deviceName);
  } catch (e) {}
  try {
    var ctx = JSON.parse(localStorage.getItem('qms_context'));
    if (ctx && ctx.deviceName) return _sbEsc(ctx.deviceName);
    if (ctx && ctx.companyName) return _sbEsc(ctx.companyName);
  } catch (e) {}
  try {
    var dp = JSON.parse(localStorage.getItem('qms_dev_plan'));
    if (dp && dp.project) return _sbEsc(dp.project);
  } catch (e) {}
  return 'No project yet';
}
