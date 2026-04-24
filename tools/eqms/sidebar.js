// Shared sidebar for Tangram eQMS
// Usage: add id="sidebar-root" to <aside class="sidebar">, then call initSidebar({ activePage: '...' })
// activePage values: 'dashboard', 'quality-roadmap', 'quality-navigator', 'standards-library', 'user-needs', 'design-inputs-tool', 'design-outputs', 'trace-matrix', etc.

const SIDEBAR_PHASES = [
  {
    id: 'quality-system',
    label: 'Quality System',
    color: '#374151',
    tools: [
      { id: 'quality-manual',  label: 'Quality Manual',   href: 'quality-manual.html' },
      { id: 'process-library', label: 'Process Library',  href: 'process-library.html' },
      { id: 'doc-library',     label: 'Document Library', href: 'doc-library.html' },
    ],
  },
  {
    id: 'planning',
    label: 'Planning',
    color: '#0AC0E9',
    tools: [
      { id: 'user-needs', label: 'User Needs', href: 'user-needs.html' },
      { id: 'regulatory-assessment', label: 'Regulatory Assessment', href: 'regulatory-assessment.html' },
      { id: 'dev-plan', label: 'Dev Plan Hub', href: 'dev-plan.html' },
    ],
  },
  {
    id: 'design-inputs',
    label: 'Design Inputs',
    color: '#304F6B',
    tools: [
      { id: 'design-inputs-tool', label: 'Design Inputs', href: 'design-inputs.html' },
      { id: 'trace-matrix', label: 'Traceability Matrix', href: 'trace-matrix.html' },
      { id: 'risk-management-plan', label: 'Risk Management', href: 'risk-management-plan.html' },
    ],
  },
  {
    id: 'design-outputs',
    label: 'Design Outputs',
    color: '#f97316',
    tools: [
      { id: 'design-outputs', label: 'Design Outputs', href: 'design-outputs.html' },
      { id: 'dmr', label: 'Device Master Record', href: 'dmr.html' },
    ],
  },
  {
    id: 'verification',
    label: 'Verification',
    color: '#6366f1',
    tools: [
      { id: 'vv', label: 'V&V Hub', href: 'vv.html' },
    ],
  },
  {
    id: 'validation',
    label: 'Validation',
    color: '#9333ea',
    tools: [
      { id: 'validation-hub', label: 'Validation Hub', href: 'validation-hub.html' },
    ],
  },
  {
    id: 'post-market',
    label: 'Post-Market',
    color: '#10B981',
    tools: [
      { id: 'post-market', label: 'Post-Market Hub', href: 'post-market.html' },
      { id: 'complaints', label: 'Complaints & MDR', href: 'complaints.html' },
    ],
  },
];

// Pages that belong to the System mode
const SIDEBAR_SYSTEM_PAGES = ['standards-library', 'team-training', 'audit-ready', 'management-review', 'suppliers', 'equipment', 'change-control', 'capa', 'nonconformance'];

// Pages that belong to the Governance section (Project mode)
const SIDEBAR_GOVERNANCE_PAGES = ['design-review'];

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

  // Inject mobile sidebar styles + hamburger toggle (once per page)
  if (!document.getElementById('sidebar-mobile-styles')) {
    const style = document.createElement('style');
    style.id = 'sidebar-mobile-styles';
    style.textContent = [
      '.sidebar-mobile-toggle {',
      '  display: none;',
      '  position: fixed; top: 10px; left: 12px; z-index: 300;',
      '  width: 38px; height: 38px; padding: 0;',
      '  background: white; color: #0B2740;',
      '  border: 1px solid rgba(11,39,64,0.12);',
      '  border-radius: 8px;',
      '  align-items: center; justify-content: center;',
      '  cursor: pointer;',
      '  box-shadow: 0 1px 2px rgba(11,39,64,0.04);',
      '  transition: background 0.15s, border-color 0.15s, transform 0.12s;',
      '}',
      '.sidebar-mobile-toggle:hover { background: rgba(11,39,64,0.035); border-color: rgba(11,39,64,0.22); }',
      '.sidebar-mobile-toggle:active { transform: scale(0.96); }',
      '.sidebar-mobile-toggle svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }',
      '.sidebar-mobile-toggle:focus-visible { outline: 2px solid rgba(10,192,233,0.55); outline-offset: 2px; }',
      'body.sidebar-mobile-open .sidebar-mobile-toggle { background: rgba(11,39,64,0.06); border-color: rgba(11,39,64,0.22); }',
      '.sidebar-mobile-backdrop {',
      '  display: none; position: fixed; inset: 0;',
      '  background: rgba(2,25,47,0.55);',
      '  backdrop-filter: blur(2px);',
      '  z-index: 190; opacity: 0;',
      '  transition: opacity 0.2s ease;',
      '}',
      '@media (max-width: 900px) {',
      '  .sidebar-mobile-toggle { display: inline-flex; }',
      '  .sidebar {',
      '    position: fixed !important; top: 0; left: 0; bottom: 0;',
      '    height: 100vh; z-index: 200;',
      '    transform: translateX(-100%);',
      '    transition: transform 0.24s cubic-bezier(0.4, 0, 0.2, 1);',
      '    box-shadow: 0 18px 40px rgba(2,25,47,0.35);',
      '  }',
      '  body.sidebar-mobile-open .sidebar { transform: translateX(0); }',
      '  body.sidebar-mobile-open .sidebar-mobile-backdrop { display: block; opacity: 1; }',
      '  body.sidebar-mobile-open { overflow: hidden; }',
      // Nudge the fixed bottom "Next step" footer so it spans the full width on mobile (normally offset by sidebar width)
      '  .lm-step-footer { left: 0 !important; padding-left: 4rem !important; }',
      // Topbar already reserves room for the hamburger at <=900px via qms-shared.css;
      // nothing to add here.
      '}',
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
  const isCAPAActive          = activePage === 'capa';
  const isNCActive            = activePage === 'nonconformance';
  const isTeamTrainActive     = activePage === 'team-training';
  const isAuditActive         = activePage === 'audit';
  const isMgmtReviewActive    = activePage === 'management-review';
  const isSuppliersActive     = activePage === 'suppliers';
  const isEquipmentActive     = activePage === 'equipment';

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
          '<span class="project-switcher-name" id="sidebar-project-name">' + _getActiveProjectName() + '</span>' +
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
          '<a class="sidebar-nav-item' + (isDocLibraryActive ? ' active' : '') + '" href="doc-library.html" id="nav-doc-library">' +
            '<svg class="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>' +
            'Document Library' +
          '</a>' +
        '</div>' +

        '<div class="sidebar-section">' +
          '<div class="sidebar-section-label">Governance</div>' +
          '<a class="sidebar-nav-item' + (isDesignReviewActive ? ' active' : '') + '" href="design-review.html" id="nav-design-review">' +
            '<svg class="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>' +
            'Design Reviews' +
          '</a>' +
        '</div>' +

        '<div class="sidebar-divider"></div>' +

        '<div class="sidebar-section">' +
          '<div class="sidebar-section-label">Phases</div>' +
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
          '<a class="sidebar-nav-item' + (isMgmtReviewActive ? ' active' : '') + '" href="management-review.html" id="nav-management-review">' +
            '<svg class="sidebar-nav-icon" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>' +
            'Management Review' +
          '</a>' +
        '</div>' +

        '<div class="sidebar-section">' +
          '<div class="sidebar-section-label">Quality Events</div>' +
          '<a class="sidebar-nav-item' + (isChangeControlActive ? ' active' : '') + '" href="change-control.html" id="nav-change-control">' +
            '<svg class="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 012 2v7"/><path d="M11 18H8a2 2 0 01-2-2V9"/></svg>' +
            'Change Control' +
          '</a>' +
          '<a class="sidebar-nav-item' + (isNCActive ? ' active' : '') + '" href="nonconformance.html" id="nav-nonconformance">' +
            '<svg class="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' +
            'Nonconformances' +
          '</a>' +
          '<a class="sidebar-nav-item' + (isCAPAActive ? ' active' : '') + '" href="capa.html" id="nav-capa">' +
            '<svg class="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>' +
            'CAPA' +
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
          '<a class="sidebar-nav-item' + (isTeamTrainActive ? ' active' : '') + '" href="team-training.html" id="nav-team-training">' +
            '<svg class="sidebar-nav-icon" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>' +
            'Team &amp; Training' +
          '</a>' +
          '<a class="sidebar-nav-item' + (isSuppliersActive ? ' active' : '') + '" href="suppliers.html" id="nav-suppliers">' +
            '<svg class="sidebar-nav-icon" viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>' +
            'Suppliers' +
          '</a>' +
          '<a class="sidebar-nav-item' + (isEquipmentActive ? ' active' : '') + '" href="equipment.html" id="nav-equipment">' +
            '<svg class="sidebar-nav-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>' +
            'Equipment & Calibration' +
          '</a>' +
          '<a class="sidebar-nav-item' + (isAuditActive ? ' active' : '') + '" href="audit.html" id="nav-audit">' +
            '<svg class="sidebar-nav-icon" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>' +
            'Audit Center' +
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

  // ── Learn-mode guided gating ─────────────────────────────────────────
  applyGuidedGating();
  // Expose so LearnMode can refresh when mode toggles
  window.refreshSidebarGating = applyGuidedGating;
  document.addEventListener('qms-learn-mode-changed', applyGuidedGating);

  // ── Mobile hamburger + backdrop ──────────────────────────────────────
  injectMobileSidebarControls();
}

function injectMobileSidebarControls() {
  if (!document.getElementById('sidebar-mobile-toggle')) {
    const btn = document.createElement('button');
    btn.id = 'sidebar-mobile-toggle';
    btn.className = 'sidebar-mobile-toggle';
    btn.setAttribute('aria-label', 'Open navigation');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<svg viewBox="0 0 24 24"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>';
    btn.addEventListener('click', toggleMobileSidebar);
    document.body.appendChild(btn);
  }
  if (!document.getElementById('sidebar-mobile-backdrop')) {
    const bd = document.createElement('div');
    bd.id = 'sidebar-mobile-backdrop';
    bd.className = 'sidebar-mobile-backdrop';
    bd.addEventListener('click', closeMobileSidebar);
    document.body.appendChild(bd);
  }
  // Close the drawer when a nav link is tapped on mobile
  const root = document.getElementById('sidebar-root');
  if (root && !root.dataset.mobileHandlersBound) {
    root.addEventListener('click', function(e) {
      const link = e.target.closest('a.sidebar-nav-item, a');
      if (!link) return;
      if (window.matchMedia('(max-width: 900px)').matches) closeMobileSidebar();
    });
    root.dataset.mobileHandlersBound = '1';
  }
  // Close on Escape
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
  const btn = document.getElementById('sidebar-mobile-toggle');
  if (btn) btn.setAttribute('aria-expanded', 'true');
}

function closeMobileSidebar() {
  document.body.classList.remove('sidebar-mobile-open');
  const btn = document.getElementById('sidebar-mobile-toggle');
  if (btn) btn.setAttribute('aria-expanded', 'false');
}

// Map filename → pageId used in LearnMode JOURNEY / isUnlocked
const HREF_TO_PAGE_ID = {
  'dashboard.html': 'dashboard',
  'import.html': 'import-docs',
  'quality-navigator.html': 'quality-navigator',
  'quality-roadmap.html': 'quality-roadmap',
  'doc-library.html': 'doc-library',
  'design-review.html': 'design-review',
  'change-control.html': 'change-control',
  'nonconformance.html': 'nonconformance',
  'capa.html': 'capa',
  'user-needs.html': 'user-needs',
  'regulatory-assessment.html': 'regulatory-assessment',
  'dev-plan.html': 'dev-plan',
  'design-inputs.html': 'design-inputs-tool',
  'trace-matrix.html': 'trace-matrix',
  'risk-management-plan.html': 'risk-management-plan',
  'design-outputs.html': 'design-outputs',
  'dmr.html': 'dmr',
  'vv.html': 'vv',
  'validation-hub.html': 'validation-hub',
  'post-market.html': 'post-market',
  'complaints.html': 'complaints',
  'quality-manual.html': 'quality-manual',
  'management-review.html': 'management-review',
  'process-library.html': 'process-library',
  'doc-library.html': 'doc-library',
  'standards-library.html': 'standards-library',
  'team-training.html': 'team-training',
  'suppliers.html': 'suppliers',
  'equipment.html': 'equipment',
  'audit.html': 'audit',
  'settings.html': 'settings',
  'document-control.html': 'document-control',
  'training.html': 'training',
  'design-control.html': 'design-control',
  'risk-management-procedure.html': 'risk-management-procedure',
};

function _sbPageIdFromHref(href) {
  if (!href) return null;
  const m = href.match(/([a-z0-9-]+\.html)/i);
  if (!m) return null;
  return HREF_TO_PAGE_ID[m[1]] || null;
}

function _sbEsc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; });
}

function _getActiveProjectName() {
  // Prefer qms_regulatory_assessment.deviceName, then qms_context.deviceName, then qms_dev_plan.project.
  try {
    const ra = JSON.parse(localStorage.getItem('qms_regulatory_assessment'));
    if (ra && ra.deviceName) return _sbEsc(ra.deviceName);
  } catch (e) {}
  try {
    const ctx = JSON.parse(localStorage.getItem('qms_context'));
    if (ctx && ctx.deviceName) return _sbEsc(ctx.deviceName);
    if (ctx && ctx.companyName) return _sbEsc(ctx.companyName);
  } catch (e) {}
  try {
    const dp = JSON.parse(localStorage.getItem('qms_dev_plan'));
    if (dp && dp.project) return _sbEsc(dp.project);
  } catch (e) {}
  return 'No project yet';
}

function applyGuidedGating() {
  if (typeof LearnMode === 'undefined') return;
  const root = document.getElementById('sidebar-root');
  if (!root) return;

  // Remove any prior journey pill so we can re-render
  const priorPill = root.querySelector('.lm-journey-pill');
  if (priorPill) priorPill.remove();

  const isGuided = LearnMode.isGuided();
  const next = isGuided ? LearnMode.currentStep() : null;
  const nextPageId = next ? next.pageId : null;

  // Journey context card (Guided only) — shows Previous / Current / Next
  if (isGuided) {
    const st = LearnMode.journeyState();
    const pct = Math.round(100 * st.doneCount / Math.max(1, st.total));
    const journey = LearnMode._journey || [];
    const idx = st.currentIdx;
    const prevStep = idx > 0 ? journey[idx - 1] : null;
    const curStep = idx < journey.length ? journey[idx] : null;
    const nextStep = idx + 1 < journey.length ? journey[idx + 1] : null;
    const currentPageId = (typeof LearnMode !== 'undefined' && LearnMode._currentPageId) ? LearnMode._currentPageId() : null;
    const onCurrent = curStep && curStep.pageId === currentPageId;

    const card = document.createElement('div');
    card.className = 'lm-journey-pill lm-journey-card';
    card.onclick = function(e) {
      // Clicks on rows handle their own nav; card-level click opens the full map
      if (e.target.closest('[data-journey-row]')) return;
      LearnMode.openJourneyMap();
    };
    card.title = 'Click to see the full journey map';

    function row(label, step, state) {
      if (!step) return '<div class="lm-journey-row lm-journey-row-empty"><div class="lm-journey-row-body"><div class="lm-journey-row-label">' + label + '</div><div class="lm-journey-row-title">—</div></div></div>';
      const clickAttr = state === 'done' || state === 'current'
        ? 'data-journey-row onclick="event.stopPropagation();window.location.href=\'' + _sbEsc(step.file) + '\'"'
        : '';
      const cursor = clickAttr ? ';cursor:pointer' : '';
      const dot = state === 'done' ? '<span class="lm-journey-row-dot done">✓</span>'
        : state === 'current' ? '<span class="lm-journey-row-dot current"></span>'
        : '<span class="lm-journey-row-dot next"></span>';
      // Fold the "you are here" indicator into the label so it doesn't squeeze the title
      const displayLabel = (state === 'current' && onCurrent)
        ? label + ' <span class="lm-journey-row-here">· on this page</span>'
        : label;
      return '<div class="lm-journey-row ' + state + '" ' + clickAttr + ' style="' + cursor + '">' +
        dot +
        '<div class="lm-journey-row-body">' +
          '<div class="lm-journey-row-label">' + displayLabel + '</div>' +
          '<div class="lm-journey-row-title">' + _sbEsc(step.title) + '</div>' +
        '</div>' +
      '</div>';
    }

    let bodyHTML = '';
    if (!curStep) {
      // All steps complete
      bodyHTML = row('Previous', prevStep, 'done') +
        '<div class="lm-journey-row done all-done"><span class="lm-journey-row-dot done">✓</span><div class="lm-journey-row-body"><div class="lm-journey-row-label">Journey</div><div class="lm-journey-row-title">Complete!</div></div></div>';
    } else {
      bodyHTML = row('Last step', prevStep, 'done') +
        row('Current', curStep, 'current') +
        row('Next up', nextStep, 'next');
    }

    card.innerHTML =
      '<div class="lm-journey-card-head">' +
        '<span class="lm-journey-card-label">Your QMS journey</span>' +
        '<span class="lm-journey-card-pct">' + st.doneCount + ' / ' + st.total + '</span>' +
      '</div>' +
      '<div class="lm-journey-card-bar"><div class="lm-journey-card-bar-fill" style="width:' + pct + '%;"></div></div>' +
      '<div class="lm-journey-card-rows">' + bodyHTML + '</div>' +
      '<div class="lm-journey-card-foot">Click for full map →</div>';

    const nav = root.querySelector('.sidebar-nav');
    if (nav) nav.parentNode.insertBefore(card, nav);

    // If not on current step, add a prominent "Take me there" button
    const existingContinue = root.querySelector('.lm-journey-continue');
    if (existingContinue) existingContinue.remove();
    if (curStep && !onCurrent) {
      const btn = document.createElement('button');
      btn.className = 'lm-journey-continue';
      btn.onclick = function(e){ e.stopPropagation(); window.location.href = curStep.file; };
      btn.innerHTML = '<svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>Take me to step ' + (idx + 1);
      if (nav) nav.parentNode.insertBefore(btn, nav);
    }
  }

  // Gate each nav-item
  const items = root.querySelectorAll('.sidebar-nav-item');
  items.forEach(function(item) {
    item.classList.remove('lm-locked', 'lm-current');
    item.removeAttribute('data-lock-reason');

    const pageId = _sbPageIdFromHref(item.getAttribute('href'));
    if (pageId) item.setAttribute('data-page-id', pageId);
    if (!isGuided || !pageId) return;

    if (pageId === nextPageId) {
      item.classList.add('lm-current');
    } else if (!LearnMode.isUnlocked(pageId) && !item.classList.contains('active')) {
      // Don't lock the page the user is currently viewing
      item.classList.add('lm-locked');
      item.setAttribute('data-lock-reason', LearnMode.unlockReason(pageId));
      item.title = LearnMode.unlockReason(pageId);
    }

    if (!item._lmLockHandlerAttached) {
      item.addEventListener('click', function(e) {
        if (item.classList.contains('lm-locked')) {
          e.preventDefault();
          e.stopPropagation();
          showLockDialog(pageId, (item.textContent || '').trim().replace(/\s+/g, ' ').replace(/^—\s*/, ''));
        }
      }, true);
      item._lmLockHandlerAttached = true;
    }
  });

  // Auto-open phase group containing the current step
  if (isGuided && next) {
    SIDEBAR_PHASES.forEach(function(phase) {
      if (phase.tools.some(function(t) { return t.id === next.pageId; })) {
        const group = document.getElementById('phase-group-' + phase.id);
        if (group) group.classList.add('open');
      }
    });
  }
}

function showLockDialog(pageId, title) {
  const existing = document.getElementById('lm-lock-dialog');
  if (existing) existing.remove();
  const reason = (typeof LearnMode !== 'undefined') ? LearnMode.unlockReason(pageId) : 'This module is not yet available.';
  const current = (typeof LearnMode !== 'undefined') ? LearnMode.currentStep() : null;

  const back = document.createElement('div');
  back.id = 'lm-lock-dialog';
  back.style.cssText = 'position:fixed;inset:0;z-index:1700;background:rgba(2,25,47,0.5);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;font-family:"Inter",sans-serif;opacity:0;transition:opacity 0.18s;';
  back.innerHTML =
    '<div style="background:white;border-radius:14px;padding:1.5rem 1.75rem;width:440px;max-width:calc(100vw - 2rem);box-shadow:0 24px 60px rgba(2,25,47,0.25);transform:translateY(8px);transition:transform 0.2s cubic-bezier(0.34,1.56,0.64,1);">' +
      '<div style="display:flex;align-items:center;gap:0.7rem;margin-bottom:0.85rem;">' +
        '<div style="width:36px;height:36px;border-radius:9px;background:rgba(245,158,11,0.14);display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
          '<svg viewBox="0 0 24 24" style="width:17px;height:17px;stroke:#b45309;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>' +
        '</div>' +
        '<div style="flex:1;"><div style="font-size:0.98rem;font-weight:700;color:#0B2740;letter-spacing:-0.01em;line-height:1.25;">' + _sbEsc(title) + ' isn\'t unlocked yet</div><div style="font-size:0.68rem;color:rgba(11,39,64,0.48);font-weight:500;letter-spacing:0.04em;text-transform:uppercase;margin-top:0.15rem;">Guided mode</div></div>' +
      '</div>' +
      '<div style="font-size:0.82rem;color:#304F6B;line-height:1.6;margin-bottom:1rem;">' + _sbEsc(reason) + '</div>' +
      (current ? '<div style="background:rgba(10,192,233,0.06);border:1px solid rgba(10,192,233,0.18);border-radius:8px;padding:0.7rem 0.9rem;margin-bottom:1.1rem;"><div style="font-size:0.6rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#089bbf;margin-bottom:0.2rem;">Continue your journey</div><div style="font-size:0.8rem;font-weight:600;color:#0B2740;">' + _sbEsc(current.title) + '</div><div style="font-size:0.72rem;color:#304F6B;margin-top:0.15rem;line-height:1.5;">' + _sbEsc(current.summary) + '</div></div>' : '') +
      '<div style="display:flex;gap:0.5rem;flex-wrap:wrap;">' +
        (current ? '<button onclick="window.location.href=\'' + _sbEsc(current.file) + '\'" style="flex:1;min-width:140px;font-family:inherit;font-size:0.78rem;font-weight:700;padding:0.6rem 0.9rem;border:none;background:#0AC0E9;color:#0B2740;border-radius:7px;cursor:pointer;box-shadow:0 2px 6px rgba(10,192,233,0.28);">Go to next step →</button>' : '') +
        '<button onclick="LearnMode.set(\'power\');document.getElementById(\'lm-lock-dialog\').remove();" style="flex:1;min-width:140px;font-family:inherit;font-size:0.78rem;font-weight:600;padding:0.6rem 0.9rem;border:1.5px solid rgba(11,39,64,0.12);background:white;color:#0B2740;border-radius:7px;cursor:pointer;">Unlock all (Power mode)</button>' +
        '<button onclick="document.getElementById(\'lm-lock-dialog\').remove()" style="font-family:inherit;font-size:0.78rem;font-weight:500;padding:0.6rem 0.9rem;border:none;background:transparent;color:rgba(11,39,64,0.55);border-radius:7px;cursor:pointer;">Cancel</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(back);
  requestAnimationFrame(function() {
    back.style.opacity = '1';
    const modal = back.firstElementChild;
    if (modal) modal.style.transform = 'translateY(0)';
  });
  back.addEventListener('click', function(e) { if (e.target === back) back.remove(); });
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
