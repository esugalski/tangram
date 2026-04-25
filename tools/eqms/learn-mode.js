/**
 * learn-mode.js — Guided / Power dual-mode system for Tangram eQMS
 *
 * Two personas share one product:
 *   • Guided  — first-time medtech founder. Needs a guide.
 *     - Only journey-unlocked modules show in the sidebar
 *     - Persistent bottom-right guide panel: current step + next action
 *     - First-run welcome modal
 *     - Per-module intro cards with plain-English explainers
 *   • Power   — seasoned QA/RA consultant. Everything unlocked, no chrome.
 *
 * localStorage keys:
 *   qms_learn_mode                 'guided' | 'power'
 *   qms_welcome_seen               '1' if welcome dismissed
 *   qms_journey_skipped            JSON array of skipped step ids
 *   qms_guide_panel_minimized      '1' if collapsed
 *   qms_lm_intro_dismissed_{id}    per-module intro dismissal
 *
 * Public API:
 *   LearnMode.init()                   - auto; inject toggle + guide + CSS
 *   LearnMode.get() / isGuided()
 *   LearnMode.set('guided'|'power')
 *   LearnMode.introCard({...})         - module-level teaching banner
 *   LearnMode.teach(text)              - inline "?" chip with tooltip
 *   LearnMode.hint(text)               - guided-only field hint
 *   LearnMode.glossary(term,def)       - dashed-underline definition term
 *   LearnMode.emptyTutorial({...})     - empty-state CTA
 *   LearnMode.isUnlocked(pageId)       - journey gating for sidebar
 *   LearnMode.journeyState()           - current journey progress
 *   LearnMode.openJourneyMap()         - open full-map modal
 *   LearnMode.skipStep(stepId)
 *   LearnMode.markStepComplete(stepId) - override auto-detection
 *   LearnMode.resetWelcome()           - re-show welcome next load
 */

const LearnMode = (function () {
  'use strict';

  const KEY = 'qms_learn_mode';
  const DEFAULT_MODE = 'guided';
  const VALID = ['guided', 'power'];

  // ── JOURNEY DEFINITION ────────────────────────────────────────────────
  // The linear journey for a first-time medtech builder.
  // pageId matches sidebar.js `activePage` values (which don't always
  // match filenames — e.g. 'design-inputs-tool' maps to design-inputs.html).

  const JOURNEY = [
    { id: 'setup',             pageId: 'qms-setup',                  file: 'qms-setup.html',
      roles: ['all'],
      title: 'Tell us about your project',
      summary: 'Enter your company name, device name, and a one-line description. This anchors every other record in the QMS.',
      why: 'Without a project context, every document you create is orphaned. Every deliverable, signature, and audit trail ties back to the company + device you name here.',
      checkKey: 'qms_context', checkField: 'deviceName'
    },
    { id: 'quality-manual',    pageId: 'quality-manual',             file: 'quality-manual.html',
      roles: ['quality'],
      title: 'Set up your Quality Manual',
      summary: 'Draft and approve the top-level document that frames your entire QMS — company scope, applicable standards, and how your procedures interrelate.',
      why: 'The Quality Manual is the constitution of your QMS. FDA and ISO auditors look for it first. Start with a skeleton — scope, quality policy, and a list of planned procedures — and fill it in as each procedure is written.',
      checkKey: 'qms_quality_manual', checkField: 'approved'
    },
    { id: 'doc-control-sop',   pageId: 'document-control',           file: 'document-control.html',
      roles: ['quality'],
      title: 'Write your Document Control Procedure',
      summary: 'Define how documents are created, reviewed, approved, revised, and retired — including Part 11 electronic signature requirements.',
      why: '21 CFR 820.40 requires documented procedures for document control. Every other controlled document in your QMS is governed by this procedure. It must exist before any other controlled documents are generated.',
      checkKey: 'qms_proc_doc_control', checkField: 'approved'
    },
    { id: 'training-sop',      pageId: 'training',                   file: 'training.html',
      roles: ['quality'],
      title: 'Write your Training Procedure',
      summary: 'Define competency requirements by role, how training is delivered and documented, and what triggers retraining.',
      why: 'Training records are among the first things FDA inspectors request. A training procedure must exist before training records are valid — otherwise you have records with no procedural authority.',
      checkKey: 'qms_proc_training', checkField: 'approved'
    },
    { id: 'design-control-sop', pageId: 'design-control',            file: 'design-control.html',
      roles: ['quality'],
      title: 'Write your Design Control Procedure',
      summary: 'Define design phases, gate criteria, required deliverables, and approval authorities.',
      why: 'Every user need, design input, and design review record is generated under the authority of this procedure. Without it, your design control records have no procedural basis — a classic 483 finding at early-stage companies.',
      checkKey: 'qms_proc_design_control', checkField: 'approved'
    },
    { id: 'training-records-1', pageId: 'team-training',             file: 'team-training.html',
      roles: ['quality'],
      title: 'Generate training records',
      summary: 'Document who is trained on the Quality Manual, Document Control Procedure, and Design Control Procedure before records are generated under those SOPs.',
      why: 'A design control record is only valid if the person who created it was trained on the governing procedure. Training records must be created before the first design control record.',
      checkKey: 'qms_team_people'
    },
    { id: 'design-controls-hub', pageId: 'design-controls',          file: 'design-controls.html',
      roles: ['design'],
      title: 'Orient to Design Controls',
      summary: 'Review the seven design control sections, how they connect, and where you currently stand before creating any records.',
      why: 'Design controls are the most scrutinized section of any 510(k). Seeing the full chain before creating records helps you avoid the traceability gaps that cost months to fix at submission time.',
      checkKey: null
    },
    { id: 'plan',              pageId: 'dev-plan',                   file: 'dev-plan.html',
      roles: ['design'],
      title: 'Write your development plan',
      summary: 'Define phases, deliverables, owners, and when you\'ll review them.',
      why: 'FDA explicitly requires a written plan — it\'s one of the first documents an auditor asks for. This is the first design control record, created under the Design Control Procedure.',
      checkKey: 'qms_dev_plan', checkField: 'project'
    },
    { id: 'user-needs',        pageId: 'user-needs',                 file: 'user-needs.html',
      roles: ['design'],
      title: 'Write down your users and their needs',
      summary: 'Who uses the device? On whom? For what condition? In what setting?',
      why: 'User needs are the clinical and human factors foundation of design controls. Ground them in observation of real users — regulatory requirements fold in at design inputs, not here.',
      checkKey: null
    },
    { id: 'classify',          pageId: 'regulatory-assessment',      file: 'regulatory-assessment.html',
      roles: ['regulatory'],
      title: 'Classify your device',
      summary: 'Figure out if your device is Class I, II, or III, and which FDA pathway applies.',
      why: 'Regulatory pathway drives design input obligations. Classification informs how user needs translate into design inputs — especially software safety class (IEC 62304) and applicable testing standards.',
      checkKey: 'qms_regulatory_assessment', checkField: 'pathway'
    },
    { id: 'inputs',            pageId: 'design-inputs-tool',         file: 'design-inputs.html',
      roles: ['design'],
      title: 'Turn user needs into design inputs',
      summary: 'Write the technical requirements your device must meet — numeric where possible. Each must trace to a user need, a regulatory standard, or a risk control.',
      why: 'Inputs are what you\'ll verify against later. Vague inputs = unprovable design. Regulatory requirements fold in here, not at user needs.',
      checkKey: null
    },
    { id: 'risk-mgmt-sop',    pageId: 'risk-management-procedure',  file: 'risk-management-procedure.html',
      roles: ['quality'],
      title: 'Write your Risk Management Procedure',
      summary: 'Define the risk management team, probability and severity scales, and risk acceptability criteria.',
      why: 'ISO 14971 §4.2 requires a defined risk management process. Your acceptability criteria must be established before you can make accept/reject decisions in the risk analysis.',
      checkKey: 'qms_proc_risk_mgmt', checkField: 'approved'
    },
    { id: 'training-records-2', pageId: 'team-training',            file: 'team-training.html',
      roles: ['quality'],
      title: 'Update training records',
      summary: 'Document team training on the Risk Management Procedure before the risk analysis is started.',
      why: 'Risk management records are only valid if the responsible team members are documented as trained on the governing procedure.',
      checkKey: 'qms_training_records'
    },
    { id: 'risk-mgmt-plan',   pageId: 'risk-management-plan',       file: 'risk-management-plan.html',
      roles: ['design'],
      title: 'Write your Risk Management Plan',
      summary: 'Define scope, team, and risk file structure for this specific device per ISO 14971.',
      why: 'The Risk Management Plan is the first risk record — it must exist before any risk analysis. It documents the criteria and approach governing the entire risk management file.',
      checkKey: 'qms_risk_mgmt_plan', checkField: 'approved'
    },
    { id: 'risk-analysis',    pageId: 'risk-management-plan',       file: 'risk-management-plan.html',
      roles: ['design'],
      title: 'Draft your risk analysis',
      summary: 'Identify hazards, estimate severity and probability, specify risk controls. Flag controls that should become design inputs.',
      why: 'Risk analysis isn\'t a one-time artifact — it starts now and updates through post-market. Risk controls identified here must feed back into design inputs.',
      checkKey: 'qms_risks'
    },
    { id: 'review-1',         pageId: 'design-review',              file: 'design-review.html',
      roles: ['design'],
      title: 'Hold your first design review',
      summary: 'Get independent eyes on the design. Document attendees, outcome, and action items.',
      why: 'FDA 820.30(e) requires design reviews at planned intervals with at least one reviewer independent of the design. This closes out the design inputs phase.',
      checkKey: 'qms_design_reviews'
    },
    { id: 'outputs',          pageId: 'design-outputs',             file: 'design-outputs.html',
      roles: ['design'],
      title: 'Document your design outputs',
      summary: 'Drawings, specs, software — the "how" of your device.',
      why: 'Each output must trace to an input. This is where "we built what we said we would" lives.',
      checkKey: null
    },
    { id: 'trace',            pageId: 'trace-matrix',               file: 'trace-matrix.html',
      roles: ['design'],
      title: 'Build the traceability matrix',
      summary: 'Link every user need → design input → design output → V&V test.',
      why: 'When an auditor picks any requirement and asks "where\'s the proof?", the trace matrix answers in seconds.',
      checkKey: null
    },
    { id: 'dmr',              pageId: 'dmr',                        file: 'dmr.html',
      roles: ['design'],
      title: 'Assemble the Device Master Record',
      summary: 'List every document needed to manufacture the device.',
      why: 'The DMR is what lets production build to spec. It\'s also what auditors pull first to check design transfer.',
      checkKey: 'qms_dmr', checkField: 'name'
    },
    { id: 'review-2',         pageId: 'design-review',              file: 'design-review.html',
      roles: ['design'],
      title: 'Hold a Phase 2 design review',
      summary: 'Review design outputs and DMR for completeness before verification begins.',
      why: 'FDA 820.30(e) requires reviews at planned intervals. This gate confirms outputs are complete and the DMR is ready before V&V testing begins.',
      checkKey: 'qms_design_reviews'
    },
    { id: 'vv',               pageId: 'vv',                         file: 'vv.html',
      roles: ['design'],
      title: 'Plan verification and validation',
      summary: 'Write a protocol for each design output test (verification) and each user need (validation).',
      why: 'Without V&V evidence, you can\'t submit a 510(k) or CE tech file. This is where most of the testing dollars go.',
      checkKey: 'qms_vv_items'
    },
    { id: 'audit',            pageId: 'audit',                      file: 'audit.html',
      roles: ['quality'],
      title: 'Run an internal audit',
      summary: 'Check your audit readiness score, then schedule your first internal audit.',
      why: 'Internal audits find problems before external auditors do. Running them well is a regulatory requirement.',
      checkKey: 'qms_internal_audits'
    },
    { id: 'pms',              pageId: 'post-market',                file: 'post-market.html',
      roles: ['quality'],
      title: 'Plan for post-market',
      summary: 'Draft the PMS plan: what you\'ll monitor, how often, and what triggers action.',
      why: 'The EU MDR mandates a PMS plan for every class. FDA requires complaint handling and MDR reporting. Plan this before first shipment.',
      checkKey: 'qms_post_market', checkField: 'scope'
    },
  ];

  // Support pages are always unlocked in Guided mode — reference material
  // (quality-manual, process-library, doc-library removed: now journey steps / sidebar section)
  const SUPPORT_PAGES = [
    'dashboard',
    'quality-navigator', 'quality-roadmap',
    'standards-library',
    'import-docs', 'settings', 'qms-setup'
  ];

  // Advanced / reactive pages unlock after the user completes the first design review
  const ADVANCED_PAGES = [
    'capa', 'nonconformance', 'complaints', 'suppliers', 'equipment',
    'management-review', 'validation-hub'
  ];
  const ADVANCED_UNLOCK_AFTER = 'review-1';  // step id after which advanced pages unlock

  // ── MODE ──────────────────────────────────────────────────────────────
  function get() {
    const m = localStorage.getItem(KEY);
    return VALID.indexOf(m) !== -1 ? m : DEFAULT_MODE;
  }
  function isGuided() { return get() === 'guided'; }

  function set(mode) {
    if (VALID.indexOf(mode) === -1) return;
    localStorage.setItem(KEY, mode);
    applyMode(mode);
    syncGuideUI();
    document.dispatchEvent(new CustomEvent('qms-learn-mode-changed', { detail: { mode } }));
  }

  function applyMode(mode) {
    document.body.setAttribute('data-learn-mode', mode);
    const gBtn = document.getElementById('lm-btn-guided');
    const pBtn = document.getElementById('lm-btn-power');
    if (gBtn) gBtn.classList.toggle('active', mode === 'guided');
    if (pBtn) pBtn.classList.toggle('active', mode === 'power');
  }

  // ── ROLE SELECTION ───────────────────────────────────────────────────
  function getSelectedRoles() {
    try {
      const ctx = JSON.parse(localStorage.getItem('qms_context'));
      if (ctx && Array.isArray(ctx.roles) && ctx.roles.length > 0) return ctx.roles;
    } catch (e) {}
    return ['all']; // default until role is set at setup
  }

  function visibleJourney() {
    const roles = getSelectedRoles();
    const allRoles = roles.indexOf('all') !== -1;
    return JOURNEY.filter(function(s) {
      return s.roles.indexOf('all') !== -1 || allRoles ||
             s.roles.some(function(r) { return roles.indexOf(r) !== -1; });
    });
  }

  // ── JOURNEY STATE ─────────────────────────────────────────────────────
  function getSkipped() {
    try { return JSON.parse(localStorage.getItem('qms_journey_skipped')) || []; }
    catch (e) { return []; }
  }
  function isSkipped(stepId) { return getSkipped().indexOf(stepId) !== -1; }

  function getManualComplete() {
    try { return JSON.parse(localStorage.getItem('qms_journey_manual_complete')) || []; }
    catch (e) { return []; }
  }
  function isManuallyComplete(stepId) { return getManualComplete().indexOf(stepId) !== -1; }

  function isStepComplete(step) {
    if (!step) return false;
    if (isManuallyComplete(step.id)) return true;
    if (isSkipped(step.id)) return true;
    // If demo data was seeded, the user hasn't actually "done" anything yet —
    // they're on a tour. Require explicit Mark-done on each step so they
    // see the success popup and can Next-Next through the journey.
    if (localStorage.getItem('qms_demo_seeded') === '1') return false;
    if (!step.checkKey) {
      // No data key — user must click "Mark step done" explicitly.
      return false;
    }
    try {
      const raw = localStorage.getItem(step.checkKey);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data) return false;
      if (step.checkField) return !!data[step.checkField];
      if (typeof data === 'object' && !Array.isArray(data)) return Object.keys(data).length > 0;
      if (Array.isArray(data)) return data.length > 0;
      return !!data;
    } catch (e) { return false; }
  }

  function hasVisited(pageId) {
    const visits = getVisits();
    return visits.indexOf(pageId) !== -1;
  }
  function getVisits() {
    try { return JSON.parse(localStorage.getItem('qms_journey_visits')) || []; }
    catch (e) { return []; }
  }
  function recordVisit(pageId) {
    if (!pageId) return;
    const v = getVisits();
    if (v.indexOf(pageId) === -1) {
      v.push(pageId);
      localStorage.setItem('qms_journey_visits', JSON.stringify(v));
    }
  }

  function journeyState() {
    const visible = visibleJourney();
    const steps = visible.map(function (s) { return { step: s, done: isStepComplete(s) }; });
    let currentIdx = steps.findIndex(function (s) { return !s.done; });
    if (currentIdx === -1) currentIdx = visible.length; // all done
    const doneCount = steps.filter(function (s) { return s.done; }).length;
    return { steps: steps, currentIdx: currentIdx, doneCount: doneCount, total: visible.length };
  }

  function currentStep() {
    const st = journeyState();
    return st.currentIdx < st.steps.length ? st.steps[st.currentIdx].step : null;
  }

  function getCurrentPageId() {
    if (window.__qmsPage) return window.__qmsPage;
    // Try pathname first — most reliable
    let m = (window.location.pathname || '').match(/([a-z0-9_-]+)\.html/i);
    // Fallback to full href if path failed (file:// URLs, weird browser states)
    if (!m) m = (window.location.href || '').match(/\/([a-z0-9_-]+)\.html/i);
    // Last resort: use the last path segment (no .html extension)
    if (!m) m = (window.location.pathname || '').match(/\/([a-z0-9_-]+)\/?$/i);
    if (!m) return '';
    const file = m[1].toLowerCase();
    if (file === 'design-inputs') return 'design-inputs-tool';
    if (file === 'import') return 'import-docs';
    return file;
  }

  function isUnlocked(pageId) {
    if (!isGuided()) return true;
    if (!pageId) return true;
    if (SUPPORT_PAGES.indexOf(pageId) !== -1) return true;

    // Pages belonging only to roles the user hasn't selected are always accessible
    const inVisible = visibleJourney().some(function(s) { return s.pageId === pageId; });
    const inFull    = JOURNEY.some(function(s) { return s.pageId === pageId; });
    if (inFull && !inVisible) return true;

    const st = journeyState();
    // All steps up through current are unlocked
    for (let i = 0; i <= st.currentIdx && i < st.steps.length; i++) {
      if (st.steps[i].step.pageId === pageId) return true;
    }
    // Advanced pages unlock after first design review
    if (ADVANCED_PAGES.indexOf(pageId) !== -1) {
      const reviewIdx = st.steps.findIndex(function(s) { return s.step.id === ADVANCED_UNLOCK_AFTER; });
      return reviewIdx !== -1 && st.currentIdx > reviewIdx;
    }
    return false;
  }

  function unlockReason(pageId) {
    if (ADVANCED_PAGES.indexOf(pageId) !== -1) {
      return 'Unlocks after your first design review. These modules handle quality events after the device exists — you don\'t need them yet.';
    }
    const visible = visibleJourney();
    const idx = visible.findIndex(function (s) { return s.pageId === pageId; });
    if (idx > -1) {
      const prior = visible[idx - 1];
      return 'Unlocks after you reach: "' + (prior ? prior.title : 'previous step') + '".';
    }
    return 'This module becomes relevant later in the journey.';
  }

  function skipStep(stepId) {
    const arr = getSkipped();
    if (arr.indexOf(stepId) === -1) arr.push(stepId);
    localStorage.setItem('qms_journey_skipped', JSON.stringify(arr));
    syncGuideUI();
  }
  function unskipStep(stepId) {
    const arr = getSkipped().filter(function (x) { return x !== stepId; });
    localStorage.setItem('qms_journey_skipped', JSON.stringify(arr));
    syncGuideUI();
  }
  function markStepComplete(stepId) {
    const arr = getManualComplete();
    if (arr.indexOf(stepId) === -1) arr.push(stepId);
    localStorage.setItem('qms_journey_manual_complete', JSON.stringify(arr));
    syncGuideUI();
  }
  // Keys that store journey progress markers (safe to always clear)
  const PROGRESS_KEYS = [
    'qms_journey_skipped', 'qms_journey_manual_complete', 'qms_journey_visits',
    'qms_welcome_seen', 'qms_guide_panel_minimized',
  ];

  // Data keys the journey reads from (wiping these restores blank state)
  const DATA_KEYS = [
    'qms_context', 'qms_regulatory_assessment', 'qms_dev_plan',
    'qms_quality_manual',
    'qms_proc_doc_control', 'qms_proc_training', 'qms_proc_design_control', 'qms_proc_risk_mgmt',
    'qms_risk_mgmt_plan', 'qms_risks', 'qms_risk_plan', 'qms_design_reviews',
    'qms_change_requests', 'qms_vv_items', 'qms_dmr',
    'qms_team_people', 'qms_team_courses', 'qms_training_records',
    'qms_internal_audits', 'qms_post_market', 'qms_capas', 'qms_nonconformances',
    'qms_complaints', 'qms_suppliers', 'qms_equipment', 'qms_management_reviews',
    'qms_validations', 'qms_settings',
  ];

  function resetJourney() {
    PROGRESS_KEYS.forEach(function(k){ localStorage.removeItem(k); });
    // Also clear per-module intro dismissals so teaching cards reappear
    Object.keys(localStorage).forEach(function(k){ if (k.indexOf('qms_lm_intro_dismissed_') === 0) localStorage.removeItem(k); });
    syncGuideUI();
  }

  function resetAllData() {
    PROGRESS_KEYS.forEach(function(k){ localStorage.removeItem(k); });
    DATA_KEYS.forEach(function(k){ localStorage.removeItem(k); });
    Object.keys(localStorage).forEach(function(k){ if (k.indexOf('qms_lm_intro_dismissed_') === 0) localStorage.removeItem(k); });
    syncGuideUI();
  }

  // ── CSS ───────────────────────────────────────────────────────────────
  const CSS = `
    body[data-learn-mode="power"]  .learn-only  { display: none !important; }
    body[data-learn-mode="guided"] .power-only  { display: none !important; }

    /* Topbar toggle */
    .lm-toggle { display: inline-flex; align-items: center; padding: 3px; background: rgba(11,39,64,0.06); border-radius: 8px; gap: 2px; margin-right: 0.4rem; }
    .lm-toggle-btn { font-family: 'Inter', sans-serif; font-size: 0.68rem; font-weight: 600; color: rgba(11,39,64,0.48); background: transparent; border: none; padding: 0.32rem 0.7rem; border-radius: 6px; cursor: pointer; letter-spacing: 0.02em; display: inline-flex; align-items: center; gap: 0.35rem; transition: color 0.15s, background 0.15s; }
    .lm-toggle-btn svg { width: 12px; height: 12px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
    .lm-toggle-btn:hover:not(.active) { color: rgba(11,39,64,0.72); }
    .lm-toggle-btn.active { background: white; color: #0B2740; box-shadow: 0 1px 3px rgba(11,39,64,0.09); }

    /* Intro teaching card */
    .lm-intro { background: linear-gradient(135deg, rgba(10,192,233,0.06), rgba(99,102,241,0.05)); border: 1px solid rgba(10,192,233,0.22); border-radius: 12px; padding: 1.1rem 1.25rem; margin-top: 1.25rem; margin-bottom: 1.25rem; position: relative; text-align: left; }
    .lm-intro-head { display: flex; align-items: flex-start; gap: 0.85rem; margin-bottom: 0.7rem; }
    .lm-intro-icon { width: 34px; height: 34px; border-radius: 9px; background: rgba(10,192,233,0.18); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .lm-intro-icon svg { width: 16px; height: 16px; stroke: #089bbf; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
    .lm-intro-title { font-size: 0.95rem; font-weight: 700; color: #0B2740; margin-bottom: 0.15rem; letter-spacing: -0.01em; }
    .lm-intro-tag { font-size: 0.6rem; font-weight: 700; color: #089bbf; letter-spacing: 0.1em; text-transform: uppercase; }
    .lm-intro-close { margin-left: auto; width: 26px; height: 26px; border: none; background: rgba(11,39,64,0.05); border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.15s; flex-shrink: 0; }
    .lm-intro-close:hover { background: rgba(11,39,64,0.11); }
    .lm-intro-close svg { width: 11px; height: 11px; stroke: #0B2740; fill: none; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
    .lm-intro-body { font-size: 0.8rem; color: #304F6B; line-height: 1.55; }
    .lm-intro-body p { margin-bottom: 0.55rem; max-width: none; }
    .lm-intro-body p:last-child { margin-bottom: 0; }
    .lm-intro-body strong { color: #0B2740; font-weight: 700; }
    .lm-intro-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.6rem; margin-top: 0.85rem; }
    .lm-intro-fact { background: rgba(255,255,255,0.6); border: 1px solid rgba(11,39,64,0.06); border-radius: 8px; padding: 0.6rem 0.75rem; min-width: 0; }
    .lm-intro-fact-label { font-size: 0.58rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(11,39,64,0.42); margin-bottom: 0.25rem; }
    .lm-intro-fact-value { font-size: 0.76rem; color: #0B2740; font-weight: 600; line-height: 1.35; overflow-wrap: break-word; word-break: normal; hyphens: auto; }
    .lm-intro-checklist { margin-top: 0.85rem; display: flex; flex-direction: column; gap: 0.35rem; }
    .lm-intro-checklist-item { display: flex; align-items: flex-start; gap: 0.55rem; font-size: 0.76rem; color: #304F6B; line-height: 1.5; }
    .lm-intro-checklist-item::before { content: ''; width: 6px; height: 6px; background: #0AC0E9; border-radius: 50%; flex-shrink: 0; margin-top: 0.45rem; }
    .lm-intro-refs { margin-top: 0.85rem; display: flex; flex-wrap: wrap; gap: 0.4rem; }
    .lm-intro-ref { font-size: 0.66rem; font-weight: 600; letter-spacing: 0.02em; background: rgba(11,39,64,0.06); color: #0B2740; padding: 0.2rem 0.55rem; border-radius: 4px; }

    /* Inline teach chip */
    .lm-teach { display: inline-flex; align-items: center; justify-content: center; width: 15px; height: 15px; margin-left: 0.25rem; vertical-align: middle; background: rgba(10,192,233,0.12); color: #089bbf; border-radius: 50%; font-size: 0.6rem; font-weight: 700; cursor: help; position: relative; flex-shrink: 0; }
    .lm-teach:hover { background: rgba(10,192,233,0.22); }
    .lm-teach-tip { position: absolute; bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%); background: #0B2740; color: white; font-size: 0.7rem; font-weight: 400; letter-spacing: 0; padding: 0.55rem 0.75rem; border-radius: 7px; white-space: normal; width: 240px; text-align: left; line-height: 1.45; pointer-events: none; opacity: 0; transition: opacity 0.15s; z-index: 500; box-shadow: 0 6px 18px rgba(2,25,47,0.25); }
    .lm-teach-tip::after { content: ''; position: absolute; top: 100%; left: 50%; transform: translateX(-50%); border: 5px solid transparent; border-top-color: #0B2740; }
    .lm-teach:hover .lm-teach-tip, .lm-teach:focus .lm-teach-tip { opacity: 1; }

    .lm-term { border-bottom: 1px dashed rgba(10,192,233,0.45); cursor: help; color: inherit; position: relative; }
    .lm-term:hover { color: #089bbf; }

    .lm-hint { display: block; font-size: 0.7rem; color: rgba(48,79,107,0.78); font-weight: 400; line-height: 1.45; margin-top: 0.2rem; margin-bottom: 0.35rem; }

    .lm-empty-tutorial { background: white; border: 1.5px dashed rgba(10,192,233,0.35); border-radius: 14px; padding: 2rem 1.75rem; text-align: center; max-width: 560px; margin: 2rem auto; }
    .lm-empty-tutorial-icon { width: 52px; height: 52px; border-radius: 14px; background: rgba(10,192,233,0.1); display: flex; align-items: center; justify-content: center; margin: 0 auto 0.85rem; }
    .lm-empty-tutorial-icon svg { width: 22px; height: 22px; stroke: #089bbf; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
    .lm-empty-tutorial h3 { font-size: 1.05rem; font-weight: 700; color: #0B2740; margin-bottom: 0.4rem; letter-spacing: -0.01em; }
    .lm-empty-tutorial p { font-size: 0.82rem; color: #304F6B; line-height: 1.55; margin-bottom: 0.75rem; }

    body[data-learn-mode="power"] .lm-density .section-card-body { padding-top: 0.7rem; padding-bottom: 0.7rem; }

    /* Keep room for bottom-right guide pill in Guided mode */
    body[data-learn-mode="guided"] .page-scroll,
    body[data-learn-mode="guided"] .content-area,
    body[data-learn-mode="guided"] .content-inner,
    body[data-learn-mode="guided"] .detail-col { padding-bottom: 72px !important; }

    /* Sidebar locked items (Guided mode only) */
    body[data-learn-mode="guided"] .sidebar-nav-item.lm-locked { opacity: 0.32; pointer-events: auto; }
    body[data-learn-mode="guided"] .sidebar-nav-item.lm-locked:hover { background: rgba(255,255,255,0.03); cursor: help; }
    body[data-learn-mode="guided"] .sidebar-nav-item.lm-locked .sidebar-nav-icon { opacity: 0.7; }
    body[data-learn-mode="guided"] .sidebar-nav-item.lm-locked::after {
      content: ''; display: inline-block; width: 11px; height: 11px; margin-left: auto; flex-shrink: 0;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-opacity='0.45' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='11' width='18' height='11' rx='2'/%3E%3Cpath d='M7 11V7a5 5 0 0110 0v4'/%3E%3C/svg%3E");
      background-size: contain; background-repeat: no-repeat;
    }
    body[data-learn-mode="guided"] .sidebar-nav-item.lm-locked .sidebar-badge { display: none; }
    body[data-learn-mode="guided"] .sidebar-nav-item.lm-current {
      background: rgba(10,192,233,0.18) !important; color: #8FE4F7 !important;
    }
    body[data-learn-mode="guided"] .sidebar-nav-item.lm-current::before {
      content: ''; position: absolute; left: 0; top: 5px; bottom: 5px; width: 2.5px;
      background: #0AC0E9; border-radius: 0 2px 2px 0;
    }
    body[data-learn-mode="guided"] .sidebar-nav-item.lm-current::after {
      content: 'NOW'; font-size: 0.52rem; font-weight: 800; letter-spacing: 0.08em;
      background: rgba(10,192,233,0.2); color: #0AC0E9;
      padding: 0.12rem 0.38rem; border-radius: 3px; margin-left: auto; flex-shrink: 0;
    }

    /* Journey context card in sidebar (Guided only) — shows last/current/next */
    body[data-learn-mode="power"] .lm-journey-pill { display: none; }
    body[data-learn-mode="power"] .lm-journey-continue { display: none; }
    .lm-journey-pill {
      margin: 0 0.75rem 0.55rem; padding: 0.65rem 0.75rem;
      background: rgba(10,192,233,0.08); border: 1px solid rgba(10,192,233,0.18);
      border-radius: 10px; cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
    }
    .lm-journey-pill:hover { background: rgba(10,192,233,0.12); border-color: rgba(10,192,233,0.3); }
    .lm-journey-card-head {
      display: flex; align-items: baseline; justify-content: space-between;
      margin-bottom: 0.4rem;
    }
    .lm-journey-card-label { font-size: 0.55rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(10,192,233,0.7); }
    .lm-journey-card-pct { font-size: 0.64rem; font-weight: 700; color: #8FE4F7; }
    .lm-journey-card-bar { height: 3px; background: rgba(255,255,255,0.08); border-radius: 2px; margin-bottom: 0.6rem; overflow: hidden; }
    .lm-journey-card-bar-fill { height: 100%; background: linear-gradient(90deg,#10B981,#0AC0E9); transition: width 0.3s; }
    .lm-journey-card-rows { display: flex; flex-direction: column; gap: 0.28rem; margin-bottom: 0.45rem; }
    .lm-journey-row {
      display: flex; align-items: flex-start; gap: 0.45rem;
      padding: 0.4rem 0.45rem;
      border-radius: 6px;
      position: relative;
    }
    .lm-journey-row:hover[data-journey-row] { background: rgba(255,255,255,0.04); }
    .lm-journey-row-dot {
      width: 15px; height: 15px; border-radius: 50%;
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 0.58rem; font-weight: 700;
      flex-shrink: 0; margin-top: 0.05rem;
    }
    .lm-journey-row-dot.done { background: #10B981; color: white; }
    .lm-journey-row-dot.current { background: #0AC0E9; color: #0B2740; font-size: 0.5rem; box-shadow: 0 0 0 3px rgba(10,192,233,0.28); }
    .lm-journey-row-dot.next { background: transparent; border: 1.5px dashed rgba(255,255,255,0.28); }
    .lm-journey-row-body { flex: 1; min-width: 0; }
    .lm-journey-row-label { font-size: 0.5rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.4); margin-bottom: 0.1rem; }
    .lm-journey-row-title { font-size: 0.72rem; font-weight: 600; color: rgba(255,255,255,0.78); line-height: 1.3; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
    .lm-journey-row.done .lm-journey-row-title { color: rgba(255,255,255,0.5); }
    .lm-journey-row.done .lm-journey-row-label { color: rgba(16,185,129,0.75); }
    .lm-journey-row.current .lm-journey-row-title { color: white; font-weight: 700; }
    .lm-journey-row.current .lm-journey-row-label { color: #8FE4F7; }
    .lm-journey-row.next .lm-journey-row-title { color: rgba(255,255,255,0.55); }
    .lm-journey-row-empty { opacity: 0.4; }
    .lm-journey-row-empty .lm-journey-row-title { color: rgba(255,255,255,0.3); font-style: italic; }
    .lm-journey-row-empty .lm-journey-row-dot { background: rgba(255,255,255,0.1); border: none; }
    .lm-journey-row-here {
      font-weight: 700; color: #8FE4F7;
      letter-spacing: 0.08em;
    }
    .lm-journey-card-foot { font-size: 0.58rem; font-weight: 600; letter-spacing: 0.04em; color: rgba(255,255,255,0.35); text-align: center; padding-top: 0.35rem; border-top: 1px dashed rgba(255,255,255,0.08); }
    .lm-journey-card-foot:hover { color: rgba(255,255,255,0.55); }

    /* Continue button beneath journey pill */
    .lm-journey-continue {
      display: flex; align-items: center; justify-content: center; gap: 0.4rem;
      margin: 0 0.75rem 0.65rem; padding: 0.5rem 0.75rem;
      background: #0AC0E9; color: #0B2740;
      border: none; border-radius: 8px; cursor: pointer;
      font-family: 'Inter', sans-serif; font-size: 0.74rem; font-weight: 700;
      letter-spacing: -0.005em; width: calc(100% - 1.5rem);
      box-shadow: 0 3px 10px rgba(10,192,233,0.32);
      transition: background 0.15s, transform 0.12s;
    }
    .lm-journey-continue:hover { background: #14d0f9; transform: translateY(-1px); }
    .lm-journey-continue.lm-journey-hint {
      background: rgba(16,185,129,0.12); color: #6FE2C2;
      box-shadow: none; cursor: default;
      font-size: 0.66rem; font-weight: 500; line-height: 1.45; text-align: left;
      padding: 0.55rem 0.7rem; letter-spacing: 0;
      display: flex; align-items: flex-start; gap: 0.4rem;
    }
    .lm-journey-continue.lm-journey-hint svg { flex-shrink: 0; margin-top: 0.15rem; }
    .lm-journey-continue.lm-journey-hint:hover { background: rgba(16,185,129,0.12); transform: none; }
    .lm-journey-continue.lm-journey-hint b { color: #B1F3DC; font-weight: 700; }

    /* ── GUIDE PANEL (compact pill, bottom-left to avoid content overlap) ── */
    #lm-guide-panel {
      position: fixed; z-index: 1600; left: calc(var(--sidebar-w, 232px) + 16px); bottom: 16px;
      font-family: 'Inter', sans-serif;
    }
    body[data-learn-mode="power"] #lm-guide-panel { display: none; }
    /* Expanded card — floats above from bottom-left */
    .lm-gp-card { position: relative; }

    /* Step banner — compact strip at top of current-step page */
    .lm-step-banner {
      background: linear-gradient(135deg, #0B2740 0%, #132F4C 70%, #0f2a42 100%);
      color: white; display: flex !important; align-items: center; gap: 0.65rem;
      padding: 0.55rem 1.1rem;
      position: relative; flex-shrink: 0;
      font-family: 'Inter', sans-serif;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .lm-step-banner-num {
      display: inline-flex; align-items: center; justify-content: center;
      height: 20px; padding: 0 0.6rem; flex-shrink: 0;
      background: rgba(10,192,233,0.18); color: #8FE4F7;
      border: 1px solid rgba(10,192,233,0.28); border-radius: 100px;
      font-size: 0.58rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;
    }
    .lm-step-banner-title {
      flex: 1; font-size: 1rem; font-weight: 700; color: white;
      letter-spacing: -0.01em; line-height: 1.2;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0;
    }
    .lm-step-banner-toggle {
      font-family: inherit; font-size: 0.66rem; font-weight: 600;
      color: rgba(255,255,255,0.6); flex-shrink: 0;
      background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12);
      border-radius: 5px; padding: 0.22rem 0.5rem; cursor: pointer;
      display: inline-flex; align-items: center; gap: 0.28rem;
      transition: background 0.15s, color 0.15s;
    }
    .lm-step-banner-toggle:hover { background: rgba(255,255,255,0.14); color: white; }
    .lm-step-banner-toggle svg { width: 10px; height: 10px; stroke: currentColor; fill: none; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; transition: transform 0.2s; }
    html.lm-ctx-open .lm-step-banner-toggle svg { transform: rotate(180deg); }
    .lm-step-banner-bar { position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: rgba(255,255,255,0.1); }
    .lm-step-banner-bar-fill { height: 100%; background: #0AC0E9; }

    /* Right context panel */
    .lm-ctx-panel {
      position: fixed; top: var(--lm-topbar-h, 56px); right: 0; bottom: 0; width: 280px;
      background: white;
      border-left: 1px solid rgba(11,39,64,0.09);
      box-shadow: -4px 0 24px rgba(11,39,64,0.08);
      overflow-y: auto; overflow-x: hidden;
      z-index: 120;
      transform: translateX(100%);
      transition: transform 0.25s cubic-bezier(0.4,0,0.2,1);
      font-family: 'Inter', sans-serif;
    }
    .lm-ctx-panel.open { transform: translateX(0); }
    .lm-ctx-panel-head {
      position: sticky; top: 0;
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.7rem 0.9rem 0.6rem;
      background: white; border-bottom: 1px solid rgba(11,39,64,0.08);
      z-index: 1;
    }
    .lm-ctx-panel-label {
      flex: 1; font-size: 0.6rem; font-weight: 800; letter-spacing: 0.1em;
      text-transform: uppercase; color: rgba(11,39,64,0.38);
    }
    .lm-ctx-panel-close {
      width: 24px; height: 24px; border: none; background: rgba(11,39,64,0.05);
      border-radius: 5px; cursor: pointer; display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; transition: background 0.15s;
    }
    .lm-ctx-panel-close:hover { background: rgba(11,39,64,0.1); }
    .lm-ctx-panel-close svg { width: 11px; height: 11px; stroke: rgba(11,39,64,0.55); fill: none; stroke-width: 2.5; stroke-linecap: round; }
    .lm-ctx-panel-body { padding: 1rem 1.1rem; }
    .lm-ctx-panel-summary {
      font-size: 0.82rem; color: #304F6B; line-height: 1.6; margin-bottom: 0.9rem;
    }
    .lm-ctx-panel-why {
      font-size: 0.77rem; color: rgba(11,39,64,0.58); line-height: 1.6; font-style: italic;
      padding-top: 0.75rem; border-top: 1px solid rgba(11,39,64,0.07); margin-bottom: 1rem;
    }
    .lm-ctx-panel-why strong { color: #304F6B; font-style: normal; font-weight: 600; }
    /* Intro card content inside the panel gets tighter styling */
    .lm-ctx-panel-body .lm-intro {
      margin-top: 0.75rem; margin-bottom: 0;
      border-radius: 8px; padding: 0.9rem 1rem;
    }
    .lm-ctx-panel-body .lm-intro-close { display: none; }

    /* Tab affordance — shows when panel is closed */
    .lm-ctx-tab {
      position: fixed; right: 0; top: 50%; transform: translateY(-50%);
      width: 28px; height: 110px;
      background: white; border: 1px solid rgba(11,39,64,0.09); border-right: none;
      border-radius: 8px 0 0 8px;
      box-shadow: -2px 0 10px rgba(11,39,64,0.06);
      display: flex; align-items: center; justify-content: center;
      writing-mode: vertical-rl; text-orientation: mixed;
      font-size: 0.6rem; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase;
      color: rgba(11,39,64,0.35); cursor: pointer; user-select: none;
      z-index: 119; font-family: 'Inter', sans-serif;
      transition: color 0.15s, background 0.15s, opacity 0.2s;
    }
    .lm-ctx-tab:hover { color: #0B2740; background: rgba(11,39,64,0.02); }
    html.lm-ctx-open .lm-ctx-tab { opacity: 0; pointer-events: none; }

    /* Main content margin when panel is open */
    .main { transition: margin-right 0.25s cubic-bezier(0.4,0,0.2,1); }
    html.lm-ctx-open .main { margin-right: 280px; }
    html.lm-ctx-open .lm-step-footer { right: 280px; transition: right 0.25s; }

    /* Mobile: hide panel and tab */
    @media (max-width: 1000px) {
      .lm-ctx-panel, .lm-ctx-tab { display: none !important; }
      html.lm-ctx-open .main { margin-right: 0; }
      html.lm-ctx-open .lm-step-footer { right: 0; }
    }

    /* Fixed bottom "Next step" footer — always visible when on current step */
    .lm-step-footer {
      position: fixed; bottom: 0;
      left: var(--sidebar-w, 232px); right: 0;
      z-index: 150;
      background: white;
      border-top: 1px solid rgba(11,39,64,0.1);
      box-shadow: 0 -8px 24px rgba(2,25,47,0.1);
      padding: 0.9rem 1.75rem;
      display: flex; align-items: center; gap: 1rem;
      font-family: 'Inter', sans-serif;
    }
    /* Extra bottom padding on content so footer doesn't cover the last row */
    body[data-learn-mode="guided"] .page-scroll,
    body[data-learn-mode="guided"] .content-area,
    body[data-learn-mode="guided"] .content-inner,
    body[data-learn-mode="guided"] .detail-col { padding-bottom: 90px !important; }
    .lm-step-footer-text { flex: 1; min-width: 0; font-size: 0.82rem; color: rgba(11,39,64,0.65); line-height: 1.4; }
    .lm-step-footer-text strong { color: #0B2740; font-weight: 700; }
    .lm-step-footer-progress { color: rgba(11,39,64,0.42); font-weight: 500; white-space: nowrap; margin-left: 0.25rem; }
    .lm-step-footer-skip {
      font-family: inherit; font-size: 0.74rem; font-weight: 600;
      color: rgba(11,39,64,0.5); background: transparent; border: none;
      cursor: pointer; padding: 0.5rem 0.75rem; border-radius: 7px;
    }
    .lm-step-footer-skip:hover { color: #dc2626; background: rgba(239,68,68,0.05); }
    .lm-step-footer-next {
      font-family: inherit; font-size: 0.9rem; font-weight: 700;
      padding: 0.75rem 1.5rem; border-radius: 10px; border: none; cursor: pointer;
      background: linear-gradient(135deg, #10B981, #0AC0E9);
      color: white;
      display: inline-flex; align-items: center; gap: 0.45rem;
      box-shadow: 0 4px 16px rgba(16,185,129,0.35);
      transition: transform 0.12s, box-shadow 0.15s;
    }
    .lm-step-footer-next:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(16,185,129,0.45);
    }
    .lm-step-footer-next svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
    body[data-learn-mode="power"] .lm-step-footer { display: none; }

    /* Pill (default) */
    .lm-gp-pill {
      display: inline-flex; align-items: center; gap: 0.4rem;
      background: white; color: #0B2740;
      border: 1px solid rgba(11,39,64,0.1);
      border-radius: 100px;
      padding: 0.38rem 0.7rem 0.38rem 0.42rem;
      box-shadow: 0 6px 22px rgba(2,25,47,0.14), 0 2px 6px rgba(2,25,47,0.06);
      cursor: pointer; user-select: none;
      transition: transform 0.15s, box-shadow 0.15s;
      font-size: 0.72rem; font-weight: 600;
    }
    .lm-gp-pill:hover { transform: translateY(-1px); box-shadow: 0 10px 28px rgba(2,25,47,0.18), 0 3px 8px rgba(2,25,47,0.08); }
    .lm-gp-pill-icon {
      width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg, #0AC0E9, #089bbf);
      display: flex; align-items: center; justify-content: center;
    }
    .lm-gp-pill-icon svg { width: 10px; height: 10px; stroke: white; fill: none; stroke-width: 2.8; stroke-linecap: round; stroke-linejoin: round; }
    .lm-gp-pill-label { font-size: 0.72rem; font-weight: 600; color: #0B2740; letter-spacing: 0; }
    .lm-gp-pill-arrow { width: 11px; height: 11px; flex-shrink: 0; opacity: 0.6; }
    .lm-gp-pill.here .lm-gp-pill-icon { background: linear-gradient(135deg, #10B981, #047857); }
    .lm-gp-pill.done .lm-gp-pill-icon { background: linear-gradient(135deg, #047857, #10B981); }

    /* Expanded card */
    .lm-gp-card {
      background: white; border-radius: 14px;
      box-shadow: 0 18px 50px rgba(2,25,47,0.22), 0 4px 12px rgba(2,25,47,0.08);
      border: 1px solid rgba(11,39,64,0.08);
      width: 340px; max-width: calc(100vw - 2rem);
      overflow: hidden;
      transform-origin: bottom right;
    }
    .lm-gp-head {
      background: linear-gradient(135deg, #0AC0E9, #089bbf);
      padding: 0.75rem 1rem; display: flex; align-items: center; gap: 0.55rem;
    }
    .lm-gp-card.here .lm-gp-head { background: linear-gradient(135deg, #10B981, #047857); }
    .lm-gp-tag { font-size: 0.56rem; font-weight: 800; letter-spacing: 0.14em; color: rgba(255,255,255,0.9); text-transform: uppercase; }
    .lm-gp-step { font-size: 0.68rem; font-weight: 600; color: rgba(255,255,255,0.96); margin-left: auto; margin-right: 0.25rem; }
    .lm-gp-icon { width: 22px; height: 22px; border-radius: 6px; background: rgba(255,255,255,0.22); display: flex; align-items: center; justify-content: center; }
    .lm-gp-icon svg { width: 12px; height: 12px; stroke: white; fill: none; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
    .lm-gp-min { border: none; background: rgba(255,255,255,0.2); color: white; width: 22px; height: 22px; border-radius: 5px; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; }
    .lm-gp-min:hover { background: rgba(255,255,255,0.32); }
    .lm-gp-min svg { width: 10px; height: 10px; stroke: white; fill: none; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
    .lm-gp-body { padding: 1rem 1.1rem; }
    .lm-gp-title { font-size: 0.92rem; font-weight: 700; color: #0B2740; letter-spacing: -0.01em; margin-bottom: 0.35rem; line-height: 1.3; }
    .lm-gp-summary { font-size: 0.76rem; color: #304F6B; line-height: 1.55; margin-bottom: 0.5rem; }
    .lm-gp-why { font-size: 0.7rem; color: rgba(11,39,64,0.55); line-height: 1.5; margin-bottom: 0.85rem; font-style: italic; }
    .lm-gp-why strong { font-style: normal; color: #0B2740; }
    .lm-gp-actions { display: flex; gap: 0.4rem; flex-wrap: wrap; }
    .lm-gp-btn {
      font-family: inherit; font-size: 0.74rem; font-weight: 700;
      padding: 0.45rem 0.85rem; border-radius: 7px; border: none; cursor: pointer;
      display: inline-flex; align-items: center; gap: 0.3rem;
    }
    .lm-gp-btn.primary { background: #0AC0E9; color: #0B2740; box-shadow: 0 2px 6px rgba(10,192,233,0.3); }
    .lm-gp-btn.primary:hover { background: #089bbf; color: white; }
    .lm-gp-btn.secondary { background: rgba(11,39,64,0.06); color: rgba(11,39,64,0.75); }
    .lm-gp-btn.secondary:hover { background: rgba(11,39,64,0.12); color: #0B2740; }
    .lm-gp-btn svg { width: 11px; height: 11px; stroke: currentColor; fill: none; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
    .lm-gp-progress { padding: 0.6rem 1.1rem; border-top: 1px solid rgba(11,39,64,0.06); background: rgba(11,39,64,0.02); display: flex; align-items: center; gap: 0.55rem; font-size: 0.68rem; color: rgba(11,39,64,0.55); }
    .lm-gp-progress-bar { flex: 1; height: 4px; background: rgba(11,39,64,0.08); border-radius: 2px; overflow: hidden; }
    .lm-gp-progress-fill { height: 100%; background: #0AC0E9; transition: width 0.25s; }
    .lm-gp-progress-link { font-size: 0.68rem; color: #089bbf; text-decoration: none; font-weight: 600; cursor: pointer; }
    .lm-gp-progress-link:hover { text-decoration: underline; }
    .lm-gp-done { text-align: center; padding: 1.5rem 1rem; }
    .lm-gp-done svg { width: 48px; height: 48px; stroke: #10B981; fill: none; stroke-width: 2; margin-bottom: 0.5rem; }
    .lm-gp-done-title { font-size: 0.95rem; font-weight: 700; color: #047857; margin-bottom: 0.25rem; }
    .lm-gp-done-body { font-size: 0.75rem; color: rgba(11,39,64,0.55); line-height: 1.5; }

    /* ── DASHBOARD HERO (Guided only, on dashboard) ── */
    #lm-dashboard-hero {
      margin-bottom: 1.5rem;
    }
    .lm-hero-card {
      background: linear-gradient(135deg, #0B2740 0%, #304F6B 100%);
      color: white; border-radius: 16px;
      padding: 1.75rem 2rem;
      position: relative; overflow: hidden;
      box-shadow: 0 10px 30px rgba(2,25,47,0.15);
    }
    .lm-hero-card::before {
      content: ''; position: absolute; top: 0; right: 0; width: 260px; height: 260px;
      background: radial-gradient(circle at center, rgba(10,192,233,0.25), transparent 70%);
      pointer-events: none;
    }
    .lm-hero-tag {
      display: inline-flex; align-items: center; gap: 0.4rem;
      font-size: 0.58rem; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase;
      background: rgba(10,192,233,0.2); color: #8FE4F7;
      padding: 0.25rem 0.6rem; border-radius: 4px;
      margin-bottom: 0.85rem;
    }
    .lm-hero-title { font-size: 1.45rem; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 0.45rem; line-height: 1.2; position: relative; }
    .lm-hero-summary { font-size: 0.88rem; color: rgba(255,255,255,0.78); line-height: 1.55; margin-bottom: 1rem; max-width: 560px; position: relative; }
    .lm-hero-why { font-size: 0.76rem; color: rgba(255,255,255,0.62); line-height: 1.55; margin-bottom: 1.25rem; max-width: 560px; position: relative; font-style: italic; }
    .lm-hero-why strong { font-style: normal; color: rgba(255,255,255,0.85); font-weight: 600; }
    .lm-hero-actions { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; position: relative; }
    .lm-hero-btn {
      font-family: 'Inter', sans-serif; font-size: 0.82rem; font-weight: 700;
      padding: 0.65rem 1.1rem; border-radius: 8px; border: none; cursor: pointer;
      display: inline-flex; align-items: center; gap: 0.4rem;
    }
    .lm-hero-btn.primary { background: #0AC0E9; color: #0B2740; box-shadow: 0 3px 10px rgba(10,192,233,0.35); }
    .lm-hero-btn.primary:hover { background: white; }
    .lm-hero-btn.ghost { background: rgba(255,255,255,0.1); color: white; }
    .lm-hero-btn.ghost:hover { background: rgba(255,255,255,0.18); }
    .lm-hero-btn svg { width: 13px; height: 13px; stroke: currentColor; fill: none; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
    .lm-hero-progress {
      margin-top: 1.25rem; display: flex; align-items: center; gap: 0.7rem;
      position: relative; font-size: 0.7rem; color: rgba(255,255,255,0.55);
    }
    .lm-hero-progress-bar { flex: 1; max-width: 320px; height: 5px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; }
    .lm-hero-progress-fill { height: 100%; background: #0AC0E9; transition: width 0.35s; }
    .lm-hero-done {
      background: linear-gradient(135deg, #047857 0%, #10B981 100%);
    }
    .lm-hero-done .lm-hero-tag { background: rgba(255,255,255,0.18); color: white; }

    /* ── WELCOME MODAL ── */
    #lm-welcome-backdrop {
      position: fixed; inset: 0; z-index: 1900;
      background: rgba(2, 25, 47, 0.55); backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center;
      opacity: 0; transition: opacity 0.2s;
      pointer-events: none;
    }
    #lm-welcome-backdrop.open { opacity: 1; pointer-events: auto; }
    .lm-welcome-modal {
      background: white; border-radius: 18px;
      width: 520px; max-width: calc(100vw - 2rem); max-height: calc(100vh - 2rem);
      box-shadow: 0 30px 80px rgba(2,25,47,0.3);
      overflow: hidden;
      transform: translateY(16px) scale(0.96);
      transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    #lm-welcome-backdrop.open .lm-welcome-modal { transform: none; }
    .lm-welcome-hero {
      background: linear-gradient(135deg, #0AC0E9 0%, #6366f1 100%);
      padding: 2rem 2rem 1.5rem; color: white;
    }
    .lm-welcome-hero-tag { font-size: 0.62rem; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; opacity: 0.85; margin-bottom: 0.6rem; }
    .lm-welcome-hero h1 { font-size: 1.55rem; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 0.45rem; line-height: 1.2; }
    .lm-welcome-hero p { font-size: 0.88rem; line-height: 1.55; opacity: 0.95; }
    .lm-welcome-body { padding: 1.5rem 2rem; }
    .lm-welcome-body > p { font-size: 0.84rem; color: #304F6B; line-height: 1.6; margin-bottom: 1.1rem; }
    .lm-welcome-option {
      display: flex; align-items: flex-start; gap: 0.85rem;
      padding: 0.85rem 1rem; margin-bottom: 0.55rem;
      background: white; border: 1.5px solid rgba(11,39,64,0.1); border-radius: 10px;
      cursor: pointer; width: 100%; text-align: left; font-family: inherit;
      transition: all 0.15s;
    }
    .lm-welcome-option:hover { border-color: #0AC0E9; background: rgba(10,192,233,0.04); }
    .lm-welcome-option-icon {
      width: 36px; height: 36px; border-radius: 9px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      background: rgba(10,192,233,0.1);
    }
    .lm-welcome-option-icon svg { width: 16px; height: 16px; stroke: #089bbf; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
    .lm-welcome-option.power .lm-welcome-option-icon { background: rgba(99,102,241,0.1); }
    .lm-welcome-option.power .lm-welcome-option-icon svg { stroke: #4338ca; }
    .lm-welcome-option-title { font-size: 0.88rem; font-weight: 700; color: #0B2740; margin-bottom: 0.15rem; letter-spacing: -0.01em; }
    .lm-welcome-option-desc { font-size: 0.74rem; color: rgba(11,39,64,0.55); line-height: 1.5; }
    .lm-welcome-foot { padding: 0.85rem 2rem 1.1rem; font-size: 0.68rem; color: rgba(11,39,64,0.4); text-align: center; border-top: 1px solid rgba(11,39,64,0.06); }

    /* ── JOURNEY MAP MODAL ── */
    #lm-map-backdrop {
      position: fixed; inset: 0; z-index: 1800;
      background: rgba(2, 25, 47, 0.5); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      opacity: 0; transition: opacity 0.18s; pointer-events: none;
    }
    #lm-map-backdrop.open { opacity: 1; pointer-events: auto; }
    .lm-map-modal {
      background: white; border-radius: 14px;
      width: 620px; max-width: calc(100vw - 2rem); max-height: calc(100vh - 2rem);
      display: flex; flex-direction: column;
      box-shadow: 0 24px 60px rgba(2,25,47,0.25);
      overflow: hidden;
    }
    .lm-map-head { padding: 1.15rem 1.5rem; border-bottom: 1px solid rgba(11,39,64,0.08); display: flex; align-items: center; gap: 0.65rem; }
    .lm-map-head h2 { font-size: 1rem; font-weight: 700; color: #0B2740; letter-spacing: -0.01em; flex: 1; }
    .lm-map-close { border: none; background: rgba(11,39,64,0.06); width: 28px; height: 28px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .lm-map-close svg { width: 12px; height: 12px; stroke: #0B2740; fill: none; stroke-width: 2.5; }
    .lm-map-body { padding: 1.2rem 1.5rem 1.5rem; overflow-y: auto; }
    .lm-map-step { display: grid; grid-template-columns: 32px 1fr auto; gap: 0.85rem; align-items: flex-start; padding: 0.7rem; border-radius: 8px; transition: background 0.15s; }
    .lm-map-step:not(.locked) { cursor: pointer; }
    .lm-map-step:not(.locked):hover { background: rgba(11,39,64,0.03); }
    .lm-map-step-dot { width: 26px; height: 26px; border-radius: 50%; background: rgba(11,39,64,0.08); color: rgba(11,39,64,0.5); font-size: 0.7rem; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 0.1rem; }
    .lm-map-step.done .lm-map-step-dot { background: #10B981; color: white; }
    .lm-map-step.current .lm-map-step-dot { background: #0AC0E9; color: white; box-shadow: 0 0 0 4px rgba(10,192,233,0.18); }
    .lm-map-step.locked .lm-map-step-dot { background: rgba(11,39,64,0.05); color: rgba(11,39,64,0.32); }
    .lm-map-step-body-title { font-size: 0.85rem; font-weight: 700; color: #0B2740; letter-spacing: -0.01em; margin-bottom: 0.15rem; }
    .lm-map-step.locked .lm-map-step-body-title { color: rgba(11,39,64,0.42); }
    .lm-map-step-body-sum { font-size: 0.72rem; color: rgba(11,39,64,0.58); line-height: 1.5; }
    .lm-map-step-status { font-size: 0.58rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; padding: 0.14rem 0.42rem; border-radius: 3px; flex-shrink: 0; margin-top: 0.15rem; }
    .lm-map-step.done .lm-map-step-status { background: rgba(16,185,129,0.14); color: #047857; }
    .lm-map-step.current .lm-map-step-status { background: rgba(10,192,233,0.16); color: #089bbf; }
    .lm-map-step.locked .lm-map-step-status { background: rgba(11,39,64,0.06); color: rgba(11,39,64,0.45); }
    .lm-map-step.lm-map-step-other-role { opacity: 0.42; cursor: default !important; }
    .lm-map-step.lm-map-step-other-role .lm-map-step-dot { background: rgba(11,39,64,0.08) !important; color: rgba(11,39,64,0.38) !important; }
  `;

  function injectCSS() {
    if (document.getElementById('learn-mode-styles')) return;
    const style = document.createElement('style');
    style.id = 'learn-mode-styles';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  // ── TOPBAR TOGGLE ─────────────────────────────────────────────────────
  function injectToggle() {
    const right = document.querySelector('.topbar-right');
    if (!right) return false;
    if (document.getElementById('lm-toggle-root')) return true;

    const wrap = document.createElement('div');
    wrap.id = 'lm-toggle-root';
    wrap.className = 'lm-toggle';
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', 'Learning mode');
    wrap.innerHTML = [
      '<button type="button" class="lm-toggle-btn" id="lm-btn-guided" title="Guided — step-by-step with explanations">',
        '<svg viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>',
        'Guided',
      '</button>',
      '<button type="button" class="lm-toggle-btn" id="lm-btn-power" title="Power — compact, everything unlocked">',
        '<svg viewBox="0 0 24 24"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
        'Power',
      '</button>',
    ].join('');
    right.insertBefore(wrap, right.firstChild);

    document.getElementById('lm-btn-guided').addEventListener('click', function () { set('guided'); });
    document.getElementById('lm-btn-power').addEventListener('click', function () { set('power'); });
    // Apply active state now that buttons exist
    applyMode(get());
    return true;
  }

  // ── HELPERS ───────────────────────────────────────────────────────────
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]; }); }

  function introCard(opts) {
    opts = opts || {};
    const id = opts.id || ('intro-' + (opts.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'));
    const dismissedKey = 'qms_lm_intro_dismissed_' + id;
    if (localStorage.getItem(dismissedKey) === '1') return '';

    let factsHTML = '';
    if (opts.facts && opts.facts.length) {
      factsHTML = '<div class="lm-intro-grid">' + opts.facts.map(function (f) {
        return '<div class="lm-intro-fact"><div class="lm-intro-fact-label">' + esc(f.label) + '</div><div class="lm-intro-fact-value">' + esc(f.value) + '</div></div>';
      }).join('') + '</div>';
    }
    let checklistHTML = '';
    if (opts.checklist && opts.checklist.length) {
      checklistHTML = '<div class="lm-intro-checklist">' + opts.checklist.map(function (c) {
        return '<div class="lm-intro-checklist-item">' + esc(c) + '</div>';
      }).join('') + '</div>';
    }
    let refsHTML = '';
    if (opts.standards && opts.standards.length) {
      refsHTML = '<div class="lm-intro-refs">' + opts.standards.map(function (s) {
        return '<span class="lm-intro-ref">' + esc(s) + '</span>';
      }).join('') + '</div>';
    }
    const whyHTML = opts.why ? '<p><strong>Why it matters:</strong> ' + esc(opts.why) + '</p>' : '';
    const whatHTML = opts.what ? '<p>' + esc(opts.what) + '</p>' : '';

    return '<div class="lm-intro learn-only" id="lm-intro-' + esc(id) + '">' +
      '<div class="lm-intro-head">' +
        '<div class="lm-intro-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></div>' +
        '<div style="flex:1;">' +
          (opts.tag ? '<div class="lm-intro-tag">' + esc(opts.tag) + '</div>' : '') +
          '<div class="lm-intro-title">' + esc(opts.title || 'About this module') + '</div>' +
        '</div>' +
        '<button type="button" class="lm-intro-close" title="Dismiss" onclick="LearnMode._dismissIntro(\'' + esc(id) + '\')"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' +
      '</div>' +
      '<div class="lm-intro-body">' + whatHTML + whyHTML + '</div>' +
      factsHTML + checklistHTML + refsHTML +
    '</div>';
  }

  function _dismissIntro(id) {
    localStorage.setItem('qms_lm_intro_dismissed_' + id, '1');
    const el = document.getElementById('lm-intro-' + id);
    if (el) el.remove();
  }

  function teach(text) { return '<span class="lm-teach learn-only" tabindex="0">?<span class="lm-teach-tip">' + esc(text) + '</span></span>'; }
  function hint(text) { return '<span class="lm-hint learn-only">' + esc(text) + '</span>'; }
  function glossary(term, def) { return '<span class="lm-term" tabindex="0" title="' + esc(def) + '">' + esc(term) + '</span>'; }
  function emptyTutorial(opts) {
    opts = opts || {};
    return '<div class="lm-empty-tutorial learn-only">' +
      '<div class="lm-empty-tutorial-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>' +
      '<h3>' + esc(opts.title || 'Nothing here yet') + '</h3>' +
      '<p>' + esc(opts.body || '') + '</p>' +
      (opts.buttonHTML || '') +
    '</div>';
  }

  // ── GUIDE PANEL ───────────────────────────────────────────────────────
  // Default: a small pill showing current step. Click to expand to a card.
  let _panelExpanded = false;

  function injectGuidePanel() {
    // Guide panel removed — the sidebar covers journey navigation, and the
    // step banner + footer cover per-page progress. Any lingering panel from
    // a prior session is cleaned up here.
    removeGuidePanel();
  }

  function renderGuidePanel() {
    const panel = document.getElementById('lm-guide-panel');
    if (!panel) return;
    const st = journeyState();
    const pageId = getCurrentPageId();
    const current = currentStep();
    const onTheStep = current && current.pageId === pageId;

    // When the user is on the current step, the step banner at the top
    // of the page carries the Mark-done affordance — hide the pill to
    // avoid redundant UI.
    if (onTheStep && !_panelExpanded) {
      panel.style.display = 'none';
      panel.innerHTML = '';
      return;
    }
    panel.style.display = '';

    if (_panelExpanded) {
      panel.innerHTML = renderExpandedCard(current, st, pageId);
    } else {
      panel.innerHTML = renderPill(current, st, pageId);
    }
  }

  function renderPill(current, st, pageId) {
    if (!current) {
      return '<div class="lm-gp-pill done" onclick="LearnMode._toggleExpand()" title="Journey complete — click for details">' +
        '<div class="lm-gp-pill-icon"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>' +
        '<span class="lm-gp-pill-label">Complete</span>' +
      '</div>';
    }
    const onTheStep = current.pageId === pageId;
    const cls = onTheStep ? 'here' : '';
    const iconSvg = onTheStep
      ? '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>'
      : '<path d="M3 11l19-9-9 19-2-8-8-2z"/>';
    const label = onTheStep
      ? '✓ Mark done'
      : 'Step ' + (st.currentIdx + 1) + '/' + st.total;
    const arrow = '<svg class="lm-gp-pill-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      (onTheStep ? '<polyline points="9 18 15 12 9 6"/>' : '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>') +
    '</svg>';
    const titleAttr = onTheStep
      ? 'You are on: ' + current.title + ' — click for details'
      : 'Next: ' + current.title + ' — click for details';
    return '<div class="lm-gp-pill ' + cls + '" onclick="LearnMode._toggleExpand()" title="' + esc(titleAttr) + '">' +
      '<div class="lm-gp-pill-icon"><svg viewBox="0 0 24 24">' + iconSvg + '</svg></div>' +
      '<span class="lm-gp-pill-label">' + esc(label) + '</span>' +
      arrow +
    '</div>';
  }

  function renderExpandedCard(current, st, pageId) {
    if (!current) {
      return '<div class="lm-gp-card">' +
        '<div class="lm-gp-head">' +
          '<div class="lm-gp-icon"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>' +
          '<span class="lm-gp-tag">Journey</span>' +
          '<span class="lm-gp-step">' + st.doneCount + ' / ' + st.total + '</span>' +
          '<button class="lm-gp-min" title="Collapse" onclick="LearnMode._toggleExpand(event)"><svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></button>' +
        '</div>' +
        '<div class="lm-gp-body lm-gp-done">' +
          '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="8 12 11 15 16 10"/></svg>' +
          '<div class="lm-gp-done-title">Journey complete!</div>' +
          '<div class="lm-gp-done-body">You\'ve touched every required module. Open the Audit Center to check overall readiness.</div>' +
          '<div style="margin-top:0.85rem;display:flex;gap:0.4rem;justify-content:center;">' +
            '<button class="lm-gp-btn primary" onclick="window.location.href=\'audit.html\'">Audit Center</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }

    const onTheStep = current.pageId === pageId;
    const pct = Math.round(100 * st.doneCount / st.total);
    let actions = '';
    if (onTheStep) {
      actions =
        '<button class="lm-gp-btn primary" onclick="LearnMode._completeAndAdvance(\'' + esc(current.id) + '\')"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>Mark done</button>' +
        '<button class="lm-gp-btn secondary" onclick="LearnMode.skipStep(\'' + esc(current.id) + '\')">Skip</button>' +
        '<button class="lm-gp-btn secondary" onclick="LearnMode.openJourneyMap()">Map</button>';
    } else {
      actions =
        '<button class="lm-gp-btn primary" onclick="window.location.href=\'' + esc(current.file) + '\'">Take me there →</button>' +
        '<button class="lm-gp-btn secondary" onclick="LearnMode.openJourneyMap()">Map</button>';
    }

    return '<div class="lm-gp-card ' + (onTheStep ? 'here' : '') + '">' +
      '<div class="lm-gp-head">' +
        '<div class="lm-gp-icon"><svg viewBox="0 0 24 24">' + (onTheStep ? '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>' : '<path d="M3 11l19-9-9 19-2-8-8-2z"/>') + '</svg></div>' +
        '<span class="lm-gp-tag">' + (onTheStep ? 'You are here' : 'Next step') + '</span>' +
        '<span class="lm-gp-step">' + (st.currentIdx + 1) + ' / ' + st.total + '</span>' +
        '<button class="lm-gp-min" title="Collapse" onclick="LearnMode._toggleExpand(event)"><svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></button>' +
      '</div>' +
      '<div class="lm-gp-body">' +
        '<div class="lm-gp-title">' + esc(current.title) + '</div>' +
        '<div class="lm-gp-summary">' + esc(current.summary) + '</div>' +
        '<div class="lm-gp-why"><strong>Why:</strong> ' + esc(current.why) + '</div>' +
        '<div class="lm-gp-actions">' + actions + '</div>' +
      '</div>' +
      '<div class="lm-gp-progress">' +
        '<span>Progress</span>' +
        '<div class="lm-gp-progress-bar"><div class="lm-gp-progress-fill" style="width:' + pct + '%;"></div></div>' +
        '<span>' + pct + '%</span>' +
      '</div>' +
    '</div>';
  }

  function _toggleExpand(e) {
    if (e) e.stopPropagation();
    _panelExpanded = !_panelExpanded;
    renderGuidePanel();
  }

  // Legacy alias — callers elsewhere may use _minimize
  function _minimize(e) { if (_panelExpanded) _toggleExpand(e); }

  function removeGuidePanel() {
    const panel = document.getElementById('lm-guide-panel');
    if (panel) panel.remove();
  }

  // ── STEP BANNER (compact strip) + CONTEXT PANEL ──────────────────────
  function syncStepBanner() {
    const existing = document.getElementById('lm-step-banner');
    const existingFooter = document.getElementById('lm-step-footer');
    if (!isGuided()) {
      if (existing) existing.remove();
      if (existingFooter) existingFooter.remove();
      removeCtxPanel();
      return;
    }
    const pageId = getCurrentPageId();
    const visible = visibleJourney();
    const pageStepIdx = visible.findIndex(function (s) { return s.pageId === pageId; });
    const pageStep = pageStepIdx >= 0 ? visible[pageStepIdx] : null;
    const cur = currentStep();
    const onTheStep = cur && cur.pageId === pageId;

    if (!pageStep) {
      if (existing) existing.remove();
      if (existingFooter) existingFooter.remove();
      removeCtxPanel();
      return;
    }
    if (!onTheStep && existingFooter) existingFooter.remove();
    if (existing) return;  // strip already present; panel already injected

    const st = journeyState();
    const pct = Math.round(100 * (pageStepIdx) / Math.max(1, visible.length - 1));

    const banner = document.createElement('div');
    banner.id = 'lm-step-banner';
    banner.className = 'lm-step-banner';
    banner.innerHTML =
      '<div class="lm-step-banner-title">' + esc(pageStep.title) + '</div>' +
      '<button class="lm-step-banner-toggle" onclick="LearnMode._toggleCtxPanel(\'' + esc(pageStep.id) + '\')">' +
        '<svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>' +
        'Context' +
      '</button>';

    const main = document.querySelector('main.main, main, div.main');
    if (main) {
      const topbar = main.querySelector(':scope > .topbar');
      const anchor = topbar ? topbar.nextSibling : main.firstChild;
      if (anchor) main.insertBefore(banner, anchor);
      else main.insertBefore(banner, main.firstChild);
      // Set panel top to match actual topbar height
      const tbH = topbar ? topbar.offsetHeight : 56;
      document.documentElement.style.setProperty('--lm-topbar-h', tbH + 'px');
    }

    // Inject context panel (after a tick so #intro-slot is fully populated)
    setTimeout(function() { injectCtxPanel(pageStep); }, 0);

    syncStepFooter(cur);
  }

  function injectCtxPanel(step) {
    // Remove stale tab from a previous page visit
    var oldTab = document.getElementById('lm-ctx-tab');
    if (oldTab) oldTab.remove();

    var panel = document.getElementById('lm-ctx-panel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'lm-ctx-panel';
      panel.className = 'lm-ctx-panel';
      document.body.appendChild(panel);
    }

    // Read topbar height for panel offset
    var tbH = getComputedStyle(document.documentElement).getPropertyValue('--lm-topbar-h').trim() || '56px';
    panel.style.top = tbH;

    // Is this the first visit to this step? Default open; closed if user previously dismissed.
    var isClosed = localStorage.getItem('qms_banner_ctx_closed_' + step.id) === '1';
    panel.classList.toggle('open', !isClosed);
    document.documentElement.classList.toggle('lm-ctx-open', !isClosed);

    // Grab intro card content if already populated (inline script runs before DOMContentLoaded)
    var introSlot = document.getElementById('intro-slot');
    var introHTML = introSlot ? introSlot.innerHTML : '';
    // Hide intro slot from the scroll area — its content lives in the panel
    if (introSlot && introHTML) introSlot.style.display = 'none';

    panel.innerHTML =
      '<div class="lm-ctx-panel-head">' +
        '<span class="lm-ctx-panel-label">Step context</span>' +
        '<button class="lm-ctx-panel-close" onclick="LearnMode._toggleCtxPanel(\'' + esc(step.id) + '\')" title="Close panel">' +
          '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
        '</button>' +
      '</div>' +
      '<div class="lm-ctx-panel-body">' +
        '<div class="lm-ctx-panel-summary">' + esc(step.summary) + '</div>' +
        '<div class="lm-ctx-panel-why"><strong>Why this matters:</strong> ' + esc(step.why) + '</div>' +
        (introHTML ? '<div class="lm-ctx-panel-intro">' + introHTML + '</div>' : '') +
      '</div>';

    // Inject the tab affordance (visible when panel is closed)
    var tab = document.createElement('div');
    tab.id = 'lm-ctx-tab';
    tab.className = 'lm-ctx-tab';
    tab.textContent = 'Context';
    tab.setAttribute('onclick', 'LearnMode._toggleCtxPanel(\'' + esc(step.id) + '\')');
    tab.style.top = 'calc(' + tbH + ' + (100vh - ' + tbH + ') / 2)';
    tab.style.transform = 'translateY(-50%)';
    document.body.appendChild(tab);
  }

  function removeCtxPanel() {
    var panel = document.getElementById('lm-ctx-panel');
    if (panel) panel.remove();
    var tab = document.getElementById('lm-ctx-tab');
    if (tab) tab.remove();
    document.documentElement.classList.remove('lm-ctx-open');
    // Restore any hidden intro slot
    var introSlot = document.getElementById('intro-slot');
    if (introSlot) introSlot.style.display = '';
  }

  function _toggleCtxPanel(stepId) {
    var panel = document.getElementById('lm-ctx-panel');
    if (!panel) return;
    var opening = !panel.classList.contains('open');
    panel.classList.toggle('open', opening);
    document.documentElement.classList.toggle('lm-ctx-open', opening);
    if (opening) {
      localStorage.removeItem('qms_banner_ctx_closed_' + stepId);
    } else {
      localStorage.setItem('qms_banner_ctx_closed_' + stepId, '1');
    }
  }

  function syncStepFooter(cur) {
    const existing = document.getElementById('lm-step-footer');
    if (existing) existing.remove();
    if (!cur) return;
    const isDemo = localStorage.getItem('qms_demo_seeded') === '1';
    const st = journeyState();
    const isLast = st.currentIdx >= st.total - 1;
    const nextLabel = isLast ? 'Finish tour' : (isDemo ? 'Next step' : 'Mark done & continue');
    const iconSvg = isLast
      ? '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>'
      : '<svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
    const footer = document.createElement('div');
    footer.id = 'lm-step-footer';
    footer.className = 'lm-step-footer';
    footer.innerHTML =
      '<div class="lm-step-footer-text">Done exploring this page? Next up: <strong>' + esc(cur.title) + '</strong></div>' +
      '<button class="lm-step-footer-next" onclick="LearnMode._completeAndAdvance(\'' + esc(cur.id) + '\')">' + esc(nextLabel) + iconSvg + '</button>';
    document.body.appendChild(footer);
  }

  // ── DASHBOARD HERO ────────────────────────────────────────────────────
  function renderDashboardHero() {
    const host = document.getElementById('lm-dashboard-hero');
    if (!host) return;
    if (!isGuided()) { host.innerHTML = ''; return; }
    const st = journeyState();
    const cur = currentStep();
    const pct = Math.round(100 * st.doneCount / Math.max(1, st.total));

    if (!cur) {
      host.innerHTML =
        '<div class="lm-hero-card lm-hero-done">' +
          '<div class="lm-hero-tag">✓ Journey complete</div>' +
          '<div class="lm-hero-title">You\'ve walked the whole journey.</div>' +
          '<div class="lm-hero-summary">Every required step is done. The Audit Center is the natural next place to check overall readiness.</div>' +
          '<div class="lm-hero-actions"><a href="audit.html" class="lm-hero-btn primary">Open Audit Center →</a></div>' +
        '</div>';
      return;
    }

    host.innerHTML =
      '<div class="lm-hero-card">' +
        '<div class="lm-hero-tag">Your journey · Step ' + (st.currentIdx + 1) + ' of ' + st.total + '</div>' +
        '<div class="lm-hero-title">' + esc(cur.title) + '</div>' +
        '<div class="lm-hero-summary">' + esc(cur.summary) + '</div>' +
        '<div class="lm-hero-why"><strong>Why:</strong> ' + esc(cur.why) + '</div>' +
        '<div class="lm-hero-actions">' +
          '<a href="' + esc(cur.file) + '" class="lm-hero-btn primary">Start this step →</a>' +
          '<button class="lm-hero-btn ghost" onclick="LearnMode.openJourneyMap()">See full map</button>' +
        '</div>' +
        '<div class="lm-hero-progress">' +
          '<span>' + st.doneCount + ' of ' + st.total + ' complete</span>' +
          '<div class="lm-hero-progress-bar"><div class="lm-hero-progress-fill" style="width:' + pct + '%;"></div></div>' +
          '<span>' + pct + '%</span>' +
        '</div>' +
      '</div>';
  }

  function _completeAndAdvance(stepId) {
    const completedStep = JOURNEY.find(function(s){ return s.id === stepId; });
    markStepComplete(stepId);
    renderGuidePanel();
    syncStepBanner();
    renderDashboardHero();
    if (typeof window.refreshSidebarGating === 'function') window.refreshSidebarGating();
    const next = currentStep();
    _showSuccessPopup(completedStep, next);
  }

  function _showSuccessPopup(completedStep, next) {
    const existing = document.getElementById('lm-success');
    if (existing) existing.remove();
    const st = journeyState();
    const back = document.createElement('div');
    back.id = 'lm-success';
    back.style.cssText = 'position:fixed;inset:0;z-index:2100;background:rgba(2,25,47,0.5);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;font-family:"Inter",sans-serif;opacity:0;transition:opacity 0.22s;';

    const stepTitle = completedStep ? completedStep.title : 'Step';
    const completedIdx = completedStep ? JOURNEY.findIndex(function(s){ return s.id === completedStep.id; }) : -1;
    const completedNum = completedIdx + 1;
    const nextAvailable = next && next.file && next.pageId !== getCurrentPageId();
    const isJourneyDone = !next;

    const checkSvg = '<svg viewBox="0 0 24 24" style="width:14px;height:14px;stroke:white;fill:none;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;"><polyline points="20 6 9 17 4 12"/></svg>';

    // Compact confirmation banner for the just-completed step
    const completedBanner =
      '<div style="display:flex;align-items:center;gap:0.65rem;padding:0.7rem 1rem;background:linear-gradient(135deg,#10B981,#059669);color:white;">' +
        '<span style="width:22px;height:22px;border-radius:50%;background:rgba(255,255,255,0.22);display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">' + checkSvg + '</span>' +
        '<div style="font-size:0.76rem;line-height:1.35;min-width:0;">' +
          '<span style="font-weight:800;letter-spacing:0.02em;">Step ' + completedNum + ' complete</span>' +
          '<span style="opacity:0.75;"> · ' + esc(stepTitle) + '</span>' +
        '</div>' +
      '</div>';

    let nextSection = '';
    if (isJourneyDone) {
      nextSection =
        '<div style="text-align:center;padding:0.25rem 0 0.4rem;">' +
          '<div style="font-size:0.62rem;font-weight:800;color:#047857;letter-spacing:0.14em;text-transform:uppercase;margin-bottom:0.55rem;">🎉 Journey complete</div>' +
          '<div style="font-size:1.3rem;font-weight:800;color:#0B2740;letter-spacing:-0.02em;line-height:1.2;margin-bottom:0.55rem;">All 15 steps walked</div>' +
          '<div style="font-size:0.85rem;color:#304F6B;line-height:1.55;">Head to the Audit Center to see your overall readiness across all QMS domains.</div>' +
        '</div>';
    } else if (next) {
      nextSection =
        '<div>' +
          '<div style="font-size:0.62rem;font-weight:800;color:#089bbf;letter-spacing:0.14em;text-transform:uppercase;margin-bottom:0.55rem;">Up next · Step ' + (st.currentIdx + 1) + ' of ' + st.total + '</div>' +
          '<div style="font-size:1.3rem;font-weight:800;color:#0B2740;letter-spacing:-0.02em;line-height:1.2;margin-bottom:0.6rem;">' + esc(next.title) + '</div>' +
          '<div style="font-size:0.88rem;color:#304F6B;line-height:1.55;"><strong style="color:#0B2740;font-weight:700;">We\'re about to:</strong> ' + esc(next.summary) + '</div>' +
        '</div>';
    }

    const pct = Math.round(100 * st.doneCount / Math.max(1, st.total));

    let actions = '';
    if (isJourneyDone) {
      actions =
        '<button onclick="window.location.href=\'audit.html\'" style="flex:1;min-width:150px;font-family:inherit;font-size:0.88rem;font-weight:700;padding:0.75rem 1rem;border:none;background:#0AC0E9;color:#0B2740;border-radius:8px;cursor:pointer;box-shadow:0 3px 10px rgba(10,192,233,0.32);">Audit Center →</button>' +
        '<button onclick="document.getElementById(\'lm-success\').remove()" style="font-family:inherit;font-size:0.82rem;font-weight:600;padding:0.75rem 1rem;border:1.5px solid rgba(11,39,64,0.12);background:white;color:#0B2740;border-radius:8px;cursor:pointer;">Close</button>';
    } else if (nextAvailable) {
      actions =
        '<button onclick="window.location.href=\'' + esc(next.file) + '\'" style="flex:1;min-width:170px;font-family:inherit;font-size:0.88rem;font-weight:700;padding:0.75rem 1rem;border:none;background:#0AC0E9;color:#0B2740;border-radius:8px;cursor:pointer;box-shadow:0 3px 10px rgba(10,192,233,0.32);">Go to next step →</button>' +
        '<button onclick="document.getElementById(\'lm-success\').remove()" style="font-family:inherit;font-size:0.82rem;font-weight:600;padding:0.75rem 1rem;border:1.5px solid rgba(11,39,64,0.12);background:white;color:#0B2740;border-radius:8px;cursor:pointer;">Stay here</button>';
    } else {
      actions =
        '<button onclick="document.getElementById(\'lm-success\').remove()" style="flex:1;font-family:inherit;font-size:0.88rem;font-weight:700;padding:0.75rem 1rem;border:none;background:#0AC0E9;color:#0B2740;border-radius:8px;cursor:pointer;box-shadow:0 3px 10px rgba(10,192,233,0.32);">Continue</button>';
    }

    back.innerHTML =
      '<div style="background:white;border-radius:16px;width:480px;max-width:calc(100vw - 2rem);box-shadow:0 30px 80px rgba(2,25,47,0.35);overflow:hidden;transform:translateY(12px) scale(0.96);transition:transform 0.24s cubic-bezier(0.34,1.56,0.64,1);">' +
        completedBanner +
        '<div style="padding:1.5rem 1.75rem 1.5rem;">' +
          nextSection +
          '<div style="display:flex;align-items:center;gap:0.55rem;margin:1.25rem 0 1rem;font-size:0.7rem;color:rgba(11,39,64,0.55);">' +
            '<span>Progress</span>' +
            '<div style="flex:1;height:5px;background:rgba(11,39,64,0.08);border-radius:3px;overflow:hidden;"><div style="height:100%;background:linear-gradient(90deg,#10B981,#0AC0E9);width:' + pct + '%;transition:width 0.4s;"></div></div>' +
            '<span style="font-weight:700;color:#0B2740;">' + pct + '%</span>' +
          '</div>' +
          '<div style="display:flex;gap:0.5rem;flex-wrap:wrap;">' + actions + '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(back);
    requestAnimationFrame(function(){
      back.style.opacity = '1';
      const modal = back.firstElementChild;
      if (modal) modal.style.transform = 'translateY(0) scale(1)';
    });
    back.addEventListener('click', function(e){ if (e.target === back) back.remove(); });
  }

  // ── JOURNEY MAP ───────────────────────────────────────────────────────
  function openJourneyMap() {
    let back = document.getElementById('lm-map-backdrop');
    if (!back) {
      back = document.createElement('div');
      back.id = 'lm-map-backdrop';
      back.addEventListener('click', function (e) { if (e.target === back) closeJourneyMap(); });
      document.body.appendChild(back);
    }

    const st = journeyState();
    // Build lookup by step id for the visible (role-filtered) journey
    const visibleIds = {};
    const currentStepId = st.currentIdx < st.steps.length ? st.steps[st.currentIdx].step.id : null;
    st.steps.forEach(function(entry) {
      visibleIds[entry.step.id] = { done: entry.done };
    });

    const ROLE_LABELS = { quality: 'Quality', design: 'Design', regulatory: 'Regulatory', all: 'All roles' };
    let stepsHTML = '';
    JOURNEY.forEach(function (s, i) {
      var inVisible = Object.prototype.hasOwnProperty.call(visibleIds, s.id);
      var roleTag = '';
      if (!inVisible) {
        var roleStr = (s.roles || []).map(function(r){ return ROLE_LABELS[r] || r; }).join(', ');
        roleTag = '<span style="font-size:0.58rem;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;padding:0.12rem 0.38rem;border-radius:3px;background:rgba(11,39,64,0.06);color:rgba(11,39,64,0.38);flex-shrink:0;">' + esc(roleStr) + '</span>';
      }
      var done = inVisible ? visibleIds[s.id].done : false;
      var isCurrent = inVisible && s.id === currentStepId;
      var isOtherRole = !inVisible;
      var locked = inVisible && !done && !isCurrent;
      var cls = isOtherRole ? 'locked' : (done ? 'done' : (isCurrent ? 'current' : 'locked'));
      var statusLabel = isOtherRole ? 'Other role' : (done ? 'Done' : (isCurrent ? 'Next' : 'Locked'));
      var onClick = (done || isCurrent) ? ('window.location.href=\'' + esc(s.file) + '\';LearnMode._closeMap()') : 'void(0)';
      stepsHTML += '<div class="lm-map-step ' + cls + (isOtherRole ? ' lm-map-step-other-role' : '') + '" onclick="' + onClick + '">' +
        '<div class="lm-map-step-dot">' + (done ? '<svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:3;"><polyline points="20 6 9 17 4 12"/></svg>' : (i + 1)) + '</div>' +
        '<div style="flex:1;min-width:0;">' +
          '<div class="lm-map-step-body-title">' + esc(s.title) + '</div>' +
          '<div class="lm-map-step-body-sum">' + esc(s.summary) + '</div>' +
        '</div>' +
        (roleTag || '<div class="lm-map-step-status">' + statusLabel + '</div>') +
      '</div>';
    });

    back.innerHTML =
      '<div class="lm-map-modal">' +
        '<div class="lm-map-head">' +
          '<h2>Your QMS journey</h2>' +
          '<span class="subtle" style="font-size:0.72rem;color:rgba(11,39,64,0.52);">' + st.doneCount + ' of ' + st.total + ' complete</span>' +
          '<button class="lm-map-close" onclick="LearnMode._closeMap()"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' +
        '</div>' +
        '<div class="lm-map-body">' + stepsHTML + '</div>' +
        '<div style="padding:0.85rem 1.5rem;border-top:1px solid rgba(11,39,64,0.08);display:flex;align-items:center;justify-content:space-between;gap:0.5rem;font-size:0.7rem;flex-wrap:wrap;">' +
          '<span style="color:rgba(11,39,64,0.48);font-size:0.66rem;">Start fresh to wipe everything, or replay to reset progress markers only.</span>' +
          '<div style="display:flex;gap:0.4rem;align-items:center;">' +
            '<a onclick="if(confirm(\'Replay tour? Keeps your data but resets all Done/Skip markers so every step shows as not-done.\')) { LearnMode.resetJourney(); LearnMode._closeMap(); location.reload(); }" style="color:#0B2740;cursor:pointer;font-weight:600;padding:0.32rem 0.6rem;border-radius:5px;border:1px solid rgba(11,39,64,0.12);">Replay tour</a>' +
            '<a onclick="if(confirm(\'Start fresh? This wipes ALL data in the app (every module, every record) so you can begin with a blank project. Cannot be undone.\')) { LearnMode.resetAllData(); LearnMode._closeMap(); location.reload(); }" style="color:#dc2626;cursor:pointer;font-weight:700;padding:0.32rem 0.6rem;border-radius:5px;border:1px solid rgba(239,68,68,0.22);">Start fresh (wipe all)</a>' +
          '</div>' +
        '</div>' +
      '</div>';
    requestAnimationFrame(function () { back.classList.add('open'); });
  }
  function closeJourneyMap() {
    const back = document.getElementById('lm-map-backdrop');
    if (back) back.classList.remove('open');
  }

  // ── WELCOME MODAL ─────────────────────────────────────────────────────
  function shouldShowWelcome() {
    if (!isGuided()) return false;
    if (localStorage.getItem('qms_welcome_seen') === '1') return false;
    // Also skip if any real journey work exists (user has been using the app)
    const st = journeyState();
    if (st.doneCount > 1) return false;  // dashboard visit alone doesn't count as "started"
    return true;
  }

  function showWelcome() {
    if (document.getElementById('lm-welcome-backdrop')) return;
    const back = document.createElement('div');
    back.id = 'lm-welcome-backdrop';
    back.innerHTML =
      '<div class="lm-welcome-modal">' +
        '<div class="lm-welcome-hero">' +
          '<div class="lm-welcome-hero-tag">Welcome</div>' +
          '<h1>You\'re about to build a medical device.</h1>' +
          '<p>That means navigating ~24 distinct quality processes — regulatory classification, risk, design controls, complaints, audits, and more. It\'s a lot. So we\'re going to go one step at a time.</p>' +
        '</div>' +
        '<div class="lm-welcome-body">' +
          '<p>Everything in this app is locked until you reach it. The sidebar will un-dim as you progress, and you\'ll always see your next step in the journey pill at the top of the sidebar.</p>' +
          '<p style="font-weight:600;color:#0B2740;margin-top:1.1rem;">Where would you like to start?</p>' +
          '<button class="lm-welcome-option" onclick="LearnMode._welcomeChoice(\'start\')">' +
            '<div class="lm-welcome-option-icon"><svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg></div>' +
            '<div><div class="lm-welcome-option-title">Guide me from the beginning</div><div class="lm-welcome-option-desc">Start with naming your company and device — takes a minute.</div></div>' +
          '</button>' +
          '<button class="lm-welcome-option" onclick="LearnMode._welcomeChoice(\'map\')">' +
            '<div class="lm-welcome-option-icon"><svg viewBox="0 0 24 24"><polyline points="3 6 3 20 8 17 16 20 21 18 21 4 16 7 8 4 3 6"/><line x1="8" y1="4" x2="8" y2="17"/><line x1="16" y1="7" x2="16" y2="20"/></svg></div>' +
            '<div><div class="lm-welcome-option-title">Show me the whole journey first</div><div class="lm-welcome-option-desc">See the 15-step map, then start from step 1.</div></div>' +
          '</button>' +
          '<button class="lm-welcome-option" onclick="LearnMode._welcomeChoice(\'import\')">' +
            '<div class="lm-welcome-option-icon"><svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></div>' +
            '<div><div class="lm-welcome-option-title">I have existing QMS documents</div><div class="lm-welcome-option-desc">Import what you have — we\'ll slot it into the right places.</div></div>' +
          '</button>' +
          '<button class="lm-welcome-option power" onclick="LearnMode._welcomeChoice(\'power\')">' +
            '<div class="lm-welcome-option-icon"><svg viewBox="0 0 24 24"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div>' +
            '<div><div class="lm-welcome-option-title">I\'m a QMS pro — unlock everything</div><div class="lm-welcome-option-desc">Switch to Power mode. No hand-holding, no gating.</div></div>' +
          '</button>' +
        '</div>' +
        '<div class="lm-welcome-foot">You can change mode any time from the top-right toggle.</div>' +
      '</div>';
    document.body.appendChild(back);
    requestAnimationFrame(function () { back.classList.add('open'); });
  }

  function _welcomeChoice(choice) {
    localStorage.setItem('qms_welcome_seen', '1');

    // Seed demo data for the two guided tour paths so every module pre-fills
    if ((choice === 'start' || choice === 'map') && typeof SeedDemo !== 'undefined') {
      SeedDemo.seed();
      // Refresh UI to pick up the new state (journey pill, sidebar, hero)
      syncGuideUI();
    }

    dismissWelcome();
    if (choice === 'start') {
      // Go to step 1 (qms-setup) so the user can see it pre-filled and Mark done
      window.location.href = JOURNEY[0].file;
    } else if (choice === 'map') {
      setTimeout(openJourneyMap, 250);
    } else if (choice === 'import') {
      window.location.href = 'import.html';
    } else if (choice === 'power') {
      set('power');
    }
  }

  function dismissWelcome() {
    const back = document.getElementById('lm-welcome-backdrop');
    if (back) { back.classList.remove('open'); setTimeout(function () { back.remove(); }, 200); }
  }
  function resetWelcome() { localStorage.removeItem('qms_welcome_seen'); }

  // ── UI SYNC ───────────────────────────────────────────────────────────
  function syncGuideUI() {
    if (isGuided()) {
      injectGuidePanel();
      renderGuidePanel();
      renderDashboardHero();
      syncStepBanner();
      if (typeof window.refreshSidebarGating === 'function') window.refreshSidebarGating();
    } else {
      removeGuidePanel();
      renderDashboardHero();  // clears hero content in power mode
      const banner = document.getElementById('lm-step-banner');
      if (banner) banner.remove();
      const footer = document.getElementById('lm-step-footer');
      if (footer) footer.remove();
      if (typeof window.refreshSidebarGating === 'function') window.refreshSidebarGating();
    }
  }

  function plainLabel(powerLabel, guidedLabel) { return isGuided() ? guidedLabel : powerLabel; }

  function resetDismissedIntros() {
    Object.keys(localStorage).forEach(function (k) { if (k.indexOf('qms_lm_intro_dismissed_') === 0) localStorage.removeItem(k); });
  }

  // ── INIT ──────────────────────────────────────────────────────────────
  function init() {
    injectCSS();
    applyMode(get());

    // Record this page visit (for steps without a data key)
    recordVisit(getCurrentPageId());

    // If demo was previously seeded, re-seed to pick up any new sample data
    // entries added in later versions (idempotent — only adds missing keys).
    if (typeof SeedDemo !== 'undefined' && localStorage.getItem('qms_demo_seeded') === '1') {
      try { SeedDemo.seed(); } catch(e) {}
    }

    // Topbar toggle — wait for topbar if needed, bounded to 5s so we don't leak
    if (!injectToggle()) {
      const mo = new MutationObserver(function () { if (injectToggle()) mo.disconnect(); });
      mo.observe(document.body, { childList: true, subtree: true });
      setTimeout(function () { mo.disconnect(); }, 5000);
    }

    // Guide panel — only in Guided mode
    if (isGuided()) {
      injectGuidePanel();
      renderDashboardHero();
      syncStepBanner();
      if (shouldShowWelcome()) setTimeout(showWelcome, 150);
    }

    // Poll for journey state changes (user filling forms on the current page)
    // Lightweight: just re-render if the currentStep changed or doneCount changed.
    let lastSignature = signatureOfState();
    setInterval(function () {
      if (!isGuided()) return;
      const sig = signatureOfState();
      if (sig !== lastSignature) {
        lastSignature = sig;
        renderGuidePanel();
        renderDashboardHero();
        syncStepBanner();
        if (typeof window.refreshSidebarGating === 'function') window.refreshSidebarGating();
      }
    }, 2000);
  }

  function signatureOfState() {
    const st = journeyState();
    return st.doneCount + '/' + st.total + '@' + st.currentIdx;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    init: init,
    get: get,
    set: set,
    isGuided: isGuided,
    introCard: introCard,
    teach: teach,
    hint: hint,
    glossary: glossary,
    plainLabel: plainLabel,
    emptyTutorial: emptyTutorial,
    isUnlocked: isUnlocked,
    unlockReason: unlockReason,
    journeyState: journeyState,
    currentStep: currentStep,
    openJourneyMap: openJourneyMap,
    skipStep: skipStep,
    unskipStep: unskipStep,
    markStepComplete: markStepComplete,
    resetJourney: resetJourney,
    resetAllData: resetAllData,
    resetWelcome: resetWelcome,
    resetDismissedIntros: resetDismissedIntros,
    _dismissIntro: _dismissIntro,
    _minimize: _minimize,
    _toggleExpand: _toggleExpand,
    _currentPageId: getCurrentPageId,
    _closeMap: closeJourneyMap,
    _welcomeChoice: _welcomeChoice,
    _completeAndAdvance: _completeAndAdvance,
    _toggleCtxPanel: _toggleCtxPanel,
    _journey: JOURNEY,
  };
})();
