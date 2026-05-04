// shell.js — Tangram eQMS global shell injector
// Usage: add root anchor elements to page HTML, then call initShell(config)
// Requires sidebar.js to be loaded first.
//
// Root anchors needed in page <body>:
//   <aside class="sidebar" id="sidebar-root"></aside>
//   <div class="main">
//     <div id="topbar-root"></div>
//     <div id="module-header-root"></div>
//     <nav id="subnav-root"></nav>
//     ... page content ...
//   </div>
//   <div id="glance-root"></div>

// ─── MODULE SUBNAV REGISTRY ──────────────────────────────────────────────────
// Define the tab set for each sidebar module once here.
// Add a new tab to a module: one line here, zero HTML changes elsewhere.

var MODULE_SUBNAVS = {
  'design-controls': [
    { label: 'Overview',       href: 'design-controls-overview.html' },
    { label: 'Dev Plan',       href: 'dev-plan.html' },
    { label: 'User Needs',     href: 'user-needs.html' },
    { label: 'Design Inputs',  href: 'design-inputs.html' },
    { label: 'Design Outputs', href: 'design-outputs.html' },
    { label: 'Design Review',  href: 'design-review.html' },
    { label: 'V&V',            href: 'vv.html' },
    { label: 'Trace Matrix',   href: 'trace-matrix.html' },
  ],
  'risk-management': [
    { label: 'Overview',      href: 'risk-management-overview.html' },
    { label: 'RM Plan',       href: 'risk-management-plan.html' },
    { label: 'Hazard ID',     href: 'hazard-identification.html' },
    { label: 'Risk Analysis', href: 'risk-analysis.html' },
    { label: 'RM Report',     href: 'risk-management-report.html' },
  ],
  'capa-ncr': [
    { label: 'CAPAs',           href: 'capa-ncr.html' },
    { label: 'Nonconformances', href: 'nonconformance.html' },
    { label: 'Complaints',      href: 'complaints.html' },
    { label: 'Change Control',  href: 'change-control.html' },
  ],
  'audits': [
    { label: 'Active Audits', href: 'audits.html' },
    { label: 'Audit Ready',   href: 'audit-ready.html' },
  ],
  'training': [
    { label: 'Training Hub',  href: 'training-hub.html' },
    { label: 'Team Training', href: 'team-training.html' },
  ],
  'suppliers': [],
  'reports': [],
};

// ─── TOPBAR ICON LIBRARY ─────────────────────────────────────────────────────

var TOPBAR_ICONS = {
  scope:   '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>',
  edit:    '<svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  export:  '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  help:    '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  filter:  '<svg viewBox="0 0 24 24"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>',
  plus:    '<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  report:  '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
  refresh: '<svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>',
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function _esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function(c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

// ─── TOPBAR BUILDER ──────────────────────────────────────────────────────────

function _buildTopbarHTML(cfg) {
  if (!cfg) return '';
  var h = '<div class="topbar">';

  if (cfg.showProjectSelect) {
    h += '<select class="project-select" id="project-select">'
       + '<option>Loading project…</option>'
       + '</select>';
    h += '<button class="project-new-btn" id="btn-project-new" title="Add a new project">+ New</button>';
  } else if (cfg.title) {
    h += '<span class="topbar-title">' + _esc(cfg.title) + '</span>';
  }

  if (cfg.showSearch) {
    h += '<div class="topbar-search-wrap">'
       + '<svg class="topbar-search-icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>'
       + '<input type="text" id="topbar-search-input" placeholder="' + _esc(cfg.searchPlaceholder || 'Search…') + '">'
       + '</div>';
  }

  h += '<span class="topbar-spacer"></span>';

  if (cfg.rightActions && cfg.rightActions.length) {
    cfg.rightActions.forEach(function(action) {
      var icon = TOPBAR_ICONS[action.icon] || '';
      h += '<button class="topbar-btn" id="' + _esc(action.id) + '" title="' + _esc(action.label) + '">'
         + icon + _esc(action.label)
         + '</button>';
    });
  }

  h += '</div>';
  return h;
}

// ─── MODULE HEADER BUILDER ───────────────────────────────────────────────────

function _buildModuleHeaderHTML(title) {
  return '<div class="module-header">'
       + '<span class="module-header-title">' + _esc(title) + '</span>'
       + '</div>';
}

// ─── SUBNAV BUILDER ──────────────────────────────────────────────────────────

function _buildSubnavHTML(cfg) {
  if (!cfg) return '';

  var items;
  if (cfg.module) {
    items = MODULE_SUBNAVS[cfg.module] || [];
  } else if (cfg.items) {
    items = cfg.items;
  } else {
    return '';
  }

  if (!items.length) return '';

  var activeHref = cfg.activeHref || '';
  // Normalise: compare just the filename portion so relative paths match
  var activeName = activeHref.split('/').pop();

  var links = items.map(function(item) {
    var itemName = (item.href || '').split('/').pop();
    var isActive = itemName && itemName === activeName;
    return '<a class="module-subnav-link' + (isActive ? ' active' : '') + '" href="' + _esc(item.href) + '">'
         + _esc(item.label)
         + '</a>';
  }).join('');

  return '<nav class="module-subnav">' + links + '</nav>';
}

// ─── AT A GLANCE PANEL BUILDER ───────────────────────────────────────────────

function _buildGlancePanelHTML() {
  return '<div class="glance-tab" onclick="toggleGlance()">At a glance</div>'
       + '<div id="glance-panel" class="glance-panel">'
       +   '<div class="glance-panel-head">'
       +     '<span class="glance-panel-label">At a glance</span>'
       +     '<button class="glance-panel-close" onclick="toggleGlance()" aria-label="Close panel">'
       +       '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
       +     '</button>'
       +   '</div>'
       +   '<div class="glance-panel-body" id="glance-body"></div>'
       + '</div>';
}

// ─── TOGGLE FUNCTION (global — called by panel chrome) ───────────────────────

function toggleGlance() {
  var panel = document.getElementById('glance-panel');
  if (!panel) return;
  var open = panel.classList.toggle('open');
  document.documentElement.classList.toggle('glance-open', open);
}

// ─── MAIN ENTRY POINT ────────────────────────────────────────────────────────

function initShell(config) {
  config = config || {};

  // 1. Sidebar — delegate to sidebar.js (must be loaded before shell.js)
  if (typeof initSidebar === 'function') {
    initSidebar({ activePage: config.activePage || '' });
  }

  // 2. Topbar
  var topbarRoot = document.getElementById('topbar-root');
  if (topbarRoot && config.topbar) {
    topbarRoot.innerHTML = _buildTopbarHTML(config.topbar);
  }

  // 3. Module header (only when config.moduleHeader is provided)
  var moduleHeaderRoot = document.getElementById('module-header-root');
  if (moduleHeaderRoot) {
    moduleHeaderRoot.innerHTML = config.moduleHeader
      ? _buildModuleHeaderHTML(config.moduleHeader)
      : '';
  }

  // 4. Sub-nav (only when config.subNav is provided)
  var subnavRoot = document.getElementById('subnav-root');
  if (subnavRoot) {
    subnavRoot.innerHTML = config.subNav
      ? _buildSubnavHTML(config.subNav)
      : '';
  }

  // 5. At a Glance panel — always rendered
  var glanceRoot = document.getElementById('glance-root');
  if (glanceRoot) {
    glanceRoot.innerHTML = _buildGlancePanelHTML();
    // Determine initial open/closed state
    var defaultOpen = !(config.glancePanel && config.glancePanel.defaultOpen === false);
    if (defaultOpen) {
      var panel = document.getElementById('glance-panel');
      if (panel) panel.classList.add('open');
      document.documentElement.classList.add('glance-open');
    } else {
      document.documentElement.classList.remove('glance-open');
    }
  }
}
