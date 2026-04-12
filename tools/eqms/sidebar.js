// Shared sidebar for Tangram eQMS
// Usage: add id="sidebar-root" to <aside class="sidebar">, then call initSidebar({ activePage: '...' })
// activePage values: 'dashboard', 'quality-roadmap', 'quality-navigator', 'standards-library', 'user-needs', 'design-inputs-tool', 'design-outputs', 'trace-matrix', etc.

const SIDEBAR_PHASES = [
  {
    id: 'planning',
    label: 'Planning',
    color: '#0AC0E9',
    tools: [
      { id: 'user-needs', label: 'User Needs', href: 'user-needs.html' },
      { id: 'regulatory-assessment', label: 'Regulatory Assessment', href: '#', badge: 'Soon' },
      { id: 'dev-plan', label: 'Dev Plan Hub', href: '#', badge: 'Soon' },
    ],
  },
  {
    id: 'design-inputs',
    label: 'Design Inputs',
    color: '#304F6B',
    tools: [
      { id: 'design-inputs-tool', label: 'Design Inputs', href: 'design-inputs.html' },
      { id: 'trace-matrix', label: 'Traceability Matrix', href: 'trace-matrix.html' },
      { id: 'risk-hub', label: 'Risk Hub', href: '#', badge: 'Soon' },
    ],
  },
  {
    id: 'design-outputs',
    label: 'Design Outputs',
    color: '#f97316',
    tools: [
      { id: 'design-outputs', label: 'Design Outputs', href: 'design-outputs.html' },
      { id: 'dmr-builder', label: 'DMR Builder', href: '#', badge: 'Soon' },
    ],
  },
  {
    id: 'verification',
    label: 'Verification',
    color: '#6366f1',
    tools: [
      { id: 'vv-hub', label: 'V&V Hub', href: '#', badge: 'Soon' },
    ],
  },
  {
    id: 'validation',
    label: 'Validation',
    color: '#9333ea',
    tools: [
      { id: 'validation-hub', label: 'Validation Hub', href: '#', badge: 'Soon' },
    ],
  },
  {
    id: 'post-market',
    label: 'Post-Market',
    color: '#10B981',
    tools: [
      { id: 'post-market-hub', label: 'Post-Market Hub', href: '#', badge: 'Soon' },
    ],
  },
];

// Pages that belong to the System mode
const SIDEBAR_SYSTEM_PAGES = ['standards-library'];

// Pages that belong to the Governance section (Project mode)
const SIDEBAR_GOVERNANCE_PAGES = ['design-review', 'change-control'];

function getSidebarMode(activePage) {
  // Auto-switch to system mode for system pages
  if (SIDEBAR_SYSTEM_PAGES.indexOf(activePage) !== -1) return 'system';
  // Otherwise use stored preference, default to project
  return localStorage.getItem('qms_sidebar_mode') || 'project';
}

function setSidebarMode(mode) {
  localStorage.setItem('qms_sidebar_mode', mode);
  const nav = document.querySelector('#sidebar-root .sidebar-nav');
  if (nav) nav.setAttribute('data-mode', mode);
  const btnProject = document.getElementById('mode-btn-project');
  const btnSystem  = document.getElementById('mode-btn-system');
  if (btnProject) btnProject.classList.toggle('active', mode === 'project');
  if (btnSystem)  btnSystem.classList.toggle('active',  mode === 'system');
}

function initSidebar(config) {
  config = config || {};
  const activePage = config.activePage || '';

  // Inject phase-group CSS if not already present
  if (!document.getElementById('sidebar-phase-styles')) {
    const style = document.createElement('style');
    style.id = 'sidebar-phase-styles';
    style.textContent = [
      '.phase-group { margin-bottom: 0; }',
      '.phase-group-header {',
      '  display: flex; align-items: center; gap: 0.45rem;',
      '  padding: 0.3rem 0.75rem 0.3rem 0.65rem;',
      '  cursor: pointer; border-radius: 6px;',
      '  color: rgba(255,255,255,0.55);',
      '  font-size: 0.79rem; font-weight: 500;',
      '  letter-spacing: 0;',
      '  transition: color 0.15s, background 0.15s;',
      '  user-select: none;',
      '}',
      '.phase-group-header:hover { color: rgba(255,255,255,0.80); background: rgba(255,255,255,0.04); }',
      '.phase-group.open .phase-group-header { color: rgba(255,255,255,0.70); }',
      '.phase-group-dot {',
      '  width: 5px; height: 5px; border-radius: 50%;',
      '  flex-shrink: 0; opacity: 0.85;',
      '}',
      '.phase-group-chevron {',
      '  width: 10px; height: 10px; flex-shrink: 0; margin-left: auto;',
      '  transition: transform 0.2s ease; opacity: 0.4;',
      '}',
      '.phase-group.open .phase-group-chevron { transform: rotate(90deg); opacity: 0.65; }',
      '.phase-group-body {',
      '  overflow: hidden; max-height: 0;',
      '  transition: max-height 0.22s ease;',
      '}',
      '.phase-group.open .phase-group-body { max-height: 220px; }',
      '.phase-group-body .sidebar-nav-item {',
      '  padding-left: 1.65rem !important;',
      '  font-size: 0.75rem !important;',
      '  font-weight: 400 !important;',
      '}',
    ].join('\n');
    document.head.appendChild(style);
  }

  // Inject mode toggle CSS if not already present
  if (!document.getElementById('sidebar-mode-styles')) {
    const style = document.createElement('style');
    style.id = 'sidebar-mode-styles';
    style.textContent = [
      '.sidebar-mode-toggle {',
      '  display: flex; margin: 0 0.75rem 0.65rem; padding: 3px;',
      '  background: rgba(255,255,255,0.06); border-radius: 8px; gap: 2px;',
      '}',
      '.sidebar-mode-btn {',
      '  flex: 1; padding: 0.28rem 0;',
      '  font-size: 0.73rem; font-weight: 500; font-family: inherit;',
      '  color: rgba(255,255,255,0.40); background: transparent;',
      '  border: none; border-radius: 6px;',
      '  cursor: pointer; letter-spacing: 0;',
      '  transition: color 0.15s, background 0.15s;',
      '}',
      '.sidebar-mode-btn.active {',
      '  background: rgba(255,255,255,0.11);',
      '  color: rgba(255,255,255,0.88);',
      '}',
      '.sidebar-mode-btn:hover:not(.active) { color: rgba(255,255,255,0.62); }',
      // Mode visibility
      '.sidebar-nav[data-mode="system"] .sidebar-project-nav { display: none !important; }',
      '.sidebar-nav[data-mode="project"] .sidebar-system-nav { display: none !important; }',
    ].join('\n');
    document.head.appendChild(style);
  }

  // Build phase groups
  const phaseGroupsHTML = SIDEBAR_PHASES.map(function(phase) {
    const toolsHTML = phase.tools.map(function(tool) {
      const isActive = activePage === tool.id;
      const badge = tool.badge ? '<span class="sidebar-badge">' + tool.badge + '</span>' : '';
      return '<a class="sidebar-nav-item' + (isActive ? ' active' : '') + '" href="' + tool.href + '" id="nav-' + tool.id + '">' +
        '— ' + tool.label + badge + '</a>';
    }).join('');

    return '<div class="phase-group" id="phase-group-' + phase.id + '">' +
      '<div class="phase-group-header" onclick="togglePhaseGroup(\'' + phase.id + '\')">' +
        '<span class="phase-group-dot" style="background:' + phase.color + '"></span>' +
        phase.label +
        '<svg class="phase-group-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>' +
      '</div>' +
      '<div class="phase-group-body" id="phase-body-' + phase.id + '">' +
        toolsHTML +
      '</div>' +
    '</div>';
  }).join('');

  const isDashboardActive     = activePage === 'dashboard';
  const isRoadmapActive       = activePage === 'quality-roadmap';
  const isNavigatorActive     = activePage === 'quality-navigator';
  const isStandardsLibActive  = activePage === 'standards-library';
  const isImportActive        = activePage === 'import-docs';
  const isDesignReviewActive  = activePage === 'design-review';
  const isChangeControlActive = activePage === 'change-control';
  const isDocLibraryActive    = activePage === 'doc-library';
  const isQualityManualActive = activePage === 'quality-manual';
  const isProcessLibActive    = activePage === 'process-library';

  const initialMode = getSidebarMode(activePage);

  const modeToggleHTML =
    '<div class="sidebar-mode-toggle">' +
      '<button class="sidebar-mode-btn' + (initialMode === 'project' ? ' active' : '') + '" id="mode-btn-project" onclick="setSidebarMode(\'project\')">Project</button>' +
      '<button class="sidebar-mode-btn' + (initialMode === 'system' ? ' active' : '') + '" id="mode-btn-system" onclick="setSidebarMode(\'system\')">System</button>' +
    '</div>';

  const html =
    '<div class="sidebar-header">' +
      '<div class="sidebar-brand">' +
        '<img src="../../brand_assets/Tangram-T%20mark%20reverse_Square.png" alt="Tangram" class="sidebar-t-mark">' +
        '<div>' +
          '<div class="sidebar-brand-name">Tangram eQMS</div>' +
          '<div class="sidebar-brand-sub">Early Access</div>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<div class="project-switcher-wrap">' +
      '<div class="project-switcher">' +
        '<div class="project-switcher-dot"></div>' +
        '<div class="project-switcher-text">' +
          '<span class="project-switcher-label">Active project</span>' +
          '<span class="project-switcher-name">CardioSync Pro</span>' +
        '</div>' +
      '</div>' +
    '</div>' +

    modeToggleHTML +

    '<nav class="sidebar-nav" data-mode="' + initialMode + '">' +

      // ── PROJECT MODE ───────────────────────────────────────────────
      '<div class="sidebar-project-nav">' +

        '<div class="sidebar-section">' +
          '<div class="sidebar-section-label">Overview</div>' +
          '<a class="sidebar-nav-item' + (isDashboardActive ? ' active' : '') + '" id="nav-portfolio" href="dashboard.html">' +
            '<svg class="sidebar-nav-icon" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>' +
            'Dashboard' +
          '</a>' +
          '<a class="sidebar-nav-item' + (isImportActive ? ' active' : '') + '" href="import.html">' +
            '<svg class="sidebar-nav-icon" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' +
            'Import Documents<span class="sidebar-badge" style="background:rgba(10,192,233,0.15);color:var(--aqua)">New</span>' +
          '</a>' +
        '</div>' +

        '<div class="sidebar-section">' +
          '<div class="sidebar-section-label">Guidance</div>' +
          '<a class="sidebar-nav-item' + (isNavigatorActive ? ' active' : '') + '" href="quality-navigator.html">' +
            '<svg class="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>' +
            'Device Navigator' +
          '</a>' +
          '<a class="sidebar-nav-item' + (isRoadmapActive ? ' active' : '') + '" href="quality-roadmap.html">' +
            '<svg class="sidebar-nav-icon" viewBox="0 0 24 24"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>' +
            'Design Control Roadmap' +
          '</a>' +
        '</div>' +

        '<div class="sidebar-section">' +
          '<div class="sidebar-section-label">Governance</div>' +
          '<a class="sidebar-nav-item' + (isDocLibraryActive ? ' active' : '') + '" href="doc-library.html" id="nav-doc-library">' +
            '<svg class="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>' +
            'Document Library' +
          '</a>' +
          '<a class="sidebar-nav-item' + (isDesignReviewActive ? ' active' : '') + '" href="design-review.html" id="nav-design-review">' +
            '<svg class="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>' +
            'Design Reviews' +
          '</a>' +
          '<a class="sidebar-nav-item' + (isChangeControlActive ? ' active' : '') + '" href="change-control.html" id="nav-change-control">' +
            '<svg class="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 012 2v7"/><path d="M11 18H8a2 2 0 01-2-2V9"/></svg>' +
            'Change Control' +
          '</a>' +
        '</div>' +

        '<div class="sidebar-divider"></div>' +

        '<div class="sidebar-section">' +
          '<div class="sidebar-section-label">Design Controls</div>' +
          phaseGroupsHTML +
        '</div>' +

      '</div>' +

      // ── SYSTEM MODE ────────────────────────────────────────────────
      '<div class="sidebar-system-nav">' +

        '<div class="sidebar-section">' +
          '<div class="sidebar-section-label">Overview</div>' +
          '<a class="sidebar-nav-item' + (isQualityManualActive ? ' active' : '') + '" href="quality-manual.html" id="nav-quality-manual">' +
            '<svg class="sidebar-nav-icon" viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>' +
            'Quality Manual' +
          '</a>' +
          '<a class="sidebar-nav-item" href="#">' +
            '<svg class="sidebar-nav-icon" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>' +
            'Dashboard<span class="sidebar-badge">Soon</span>' +
          '</a>' +
        '</div>' +

        '<div class="sidebar-section">' +
          '<div class="sidebar-section-label">Quality System</div>' +
          '<a class="sidebar-nav-item' + (isProcessLibActive ? ' active' : '') + '" href="process-library.html" id="nav-process-library">' +
            '<svg class="sidebar-nav-icon" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>' +
            'Process Library' +
          '</a>' +
          '<a class="sidebar-nav-item' + (isStandardsLibActive ? ' active' : '') + '" href="standards-library.html" id="nav-standards-lib">' +
            '<svg class="sidebar-nav-icon" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>' +
            'Standards Library' +
          '</a>' +
          '<a class="sidebar-nav-item" href="#">' +
            '<svg class="sidebar-nav-icon" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>' +
            'Team &amp; Training<span class="sidebar-badge">Soon</span>' +
          '</a>' +
          '<a class="sidebar-nav-item" href="#">' +
            '<svg class="sidebar-nav-icon" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>' +
            'Audit Ready<span class="sidebar-badge">Soon</span>' +
          '</a>' +
        '</div>' +


      '</div>' +

      // ── ALWAYS VISIBLE ─────────────────────────────────────────────
      '<div class="sidebar-divider"></div>' +

      '<div class="sidebar-section">' +
        '<div class="sidebar-section-label">System</div>' +
        '<a class="sidebar-nav-item' + (activePage === 'settings' ? ' active' : '') + '" href="settings.html" id="nav-settings">' +
          '<svg class="sidebar-nav-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>' +
          'Settings' +
        '</a>' +
      '</div>' +

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

  const root = document.getElementById('sidebar-root');
  if (root) root.innerHTML = html;

  // Restore phase collapse state (default: planning + design-inputs open)
  const defaultOpen = ['planning', 'design-inputs'];
  const stored = localStorage.getItem('qms_sidebar_open_phases');
  const openPhases = stored ? JSON.parse(stored) : defaultOpen;
  openPhases.forEach(function(phaseId) {
    const group = document.getElementById('phase-group-' + phaseId);
    if (group) group.classList.add('open');
  });

  // Wire up page-specific handlers if the functions exist on the page
  const stdLib = document.getElementById('nav-standards-lib');
  if (stdLib) {
    stdLib.addEventListener('click', function(e) {
      if (typeof openStandardsLibrary === 'function') { e.preventDefault(); openStandardsLibrary(); }
    });
  }
  // Settings link goes directly to settings.html (no per-page override)
}

function togglePhaseGroup(phaseId) {
  const group = document.getElementById('phase-group-' + phaseId);
  if (!group) return;
  group.classList.toggle('open');

  // Persist open state
  const openPhases = SIDEBAR_PHASES
    .filter(function(p) {
      const el = document.getElementById('phase-group-' + p.id);
      return el && el.classList.contains('open');
    })
    .map(function(p) { return p.id; });
  localStorage.setItem('qms_sidebar_open_phases', JSON.stringify(openPhases));
}
