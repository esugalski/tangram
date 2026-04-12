/**
 * governance.js — Universal Procedure Prerequisite Enforcement
 * Tangram eQMS Platform
 *
 * PURPOSE
 * -------
 * Before any record type is routed for formal approval, this module checks
 * qms_procedures to determine whether all governing SOPs have been approved.
 * If prerequisites are not met, it renders a blocking modal explaining which
 * procedures must be completed first.
 *
 * USAGE IN ANY TOOL
 * -----------------
 *   // 1. Include after esign.js:
 *   //    <script src="governance.js"></script>
 *
 *   // 2. At the start of any approval action:
 *   function finalizeDocument() {
 *     var check = Governance.checkProcedurePrereqs('di');
 *     if (!check.ok) { Governance.showBlocker(check); return; }
 *     // proceed with ESign.open(...)
 *   }
 *
 * PUBLIC API
 * ----------
 *   Governance.checkProcedurePrereqs(recordType)
 *     → { ok: true }
 *     → { ok: false, recordType, blocking: [{ id, title, status }] }
 *
 *   Governance.isRecordTypeUnlocked(recordType)
 *     → boolean (true = all governing procedures approved, or none defined)
 *
 *   Governance.showBlocker(check)
 *     → Appends a self-contained blocking modal to document.body.
 *        No per-tool container needed.
 *
 *   Governance.getGoverningProcedures(recordType)
 *     → [{ id, title, status, approvedAt }]  (all, regardless of status)
 *
 * DATA SOURCE
 * -----------
 * Reads qms_procedures from localStorage (written by process-library.html).
 * No configuration needed per tool — the check is fully data-driven.
 * Adding a new SOP with governedRecordTypes automatically gates the right
 * records without touching any tool code.
 *
 * PRODUCTION NOTE
 * ---------------
 * The same API surface works when backed by a server endpoint. Replace the
 * localStorage read in _getProcs() with a synchronous or async call to your
 * backend. Only that one function needs to change.
 */

var Governance = (function () {

  var LS_PROCS = 'qms_procedures';

  // ── PRIVATE HELPERS ──────────────────────────────────────────────────────

  function _getProcs() {
    try { return JSON.parse(localStorage.getItem(LS_PROCS) || '{}'); } catch (e) { return {}; }
  }

  function _esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var STATUS_LABEL = {
    planned:  'Planned',
    draft:    'Draft',
    review:   'Under Review',
    approved: 'Approved',
    superseded: 'Superseded',
  };

  var STATUS_COLOR = {
    planned:  '#6b7280',
    draft:    '#0891b2',
    review:   '#b45309',
    approved: '#059669',
    superseded: '#dc2626',
  };

  // ── PUBLIC: checkProcedurePrereqs ────────────────────────────────────────

  /**
   * Scans all qms_procedures for any procedure whose governedRecordTypes
   * includes recordType and whose status is not 'approved'.
   *
   * @param  {string} recordType  e.g. 'un', 'di', 'do', 'risk', 'capa', etc.
   * @returns {{ ok: boolean, recordType: string, blocking: Array }}
   */
  function checkProcedurePrereqs(recordType) {
    var procs = _getProcs();
    var blocking = [];

    Object.keys(procs).forEach(function (id) {
      var p = procs[id];
      var governs = Array.isArray(p.governedRecordTypes) ? p.governedRecordTypes : [];
      if (governs.indexOf(recordType) !== -1 && p.status !== 'approved') {
        blocking.push({
          id:         id,
          title:      p.title || id,
          status:     p.status || 'planned',
          approvedAt: p.approvedAt || null,
        });
      }
    });

    // Sort blocking list: planned → draft → review
    blocking.sort(function (a, b) {
      var order = ['planned', 'draft', 'review', 'superseded'];
      return order.indexOf(a.status) - order.indexOf(b.status);
    });

    return {
      ok:         blocking.length === 0,
      recordType: recordType,
      blocking:   blocking,
    };
  }

  // ── PUBLIC: isRecordTypeUnlocked ─────────────────────────────────────────

  /**
   * Boolean convenience wrapper around checkProcedurePrereqs.
   * Returns true if no governing procedures are defined OR all are approved.
   */
  function isRecordTypeUnlocked(recordType) {
    return checkProcedurePrereqs(recordType).ok;
  }

  // ── PUBLIC: getGoverningProcedures ───────────────────────────────────────

  /**
   * Returns all procedures (any status) that govern the given record type.
   * Useful for UI hints — e.g. showing a badge of "governed by SOP-001, SOP-002".
   */
  function getGoverningProcedures(recordType) {
    var procs = _getProcs();
    var result = [];
    Object.keys(procs).forEach(function (id) {
      var p = procs[id];
      var governs = Array.isArray(p.governedRecordTypes) ? p.governedRecordTypes : [];
      if (governs.indexOf(recordType) !== -1) {
        result.push({ id: id, title: p.title || id, status: p.status || 'planned', approvedAt: p.approvedAt || null });
      }
    });
    return result;
  }

  // ── PUBLIC: showBlocker ──────────────────────────────────────────────────

  /**
   * Renders a self-contained blocking modal explaining which procedures must
   * be approved before the record can be signed off. Appends to document.body —
   * no per-tool container or HTML changes required.
   *
   * @param {{ ok: boolean, recordType: string, blocking: Array }} check
   *   The result of checkProcedurePrereqs().
   */
  function showBlocker(check) {
    // Remove any existing blocker
    var existing = document.getElementById('_govBlockerOverlay');
    if (existing) existing.remove();

    // ── Procedure rows ────────────────────────────────────────────────────
    var rows = check.blocking.map(function (p) {
      var statusLabel = STATUS_LABEL[p.status] || p.status;
      var statusColor = STATUS_COLOR[p.status] || '#6b7280';
      var statusBg = {
        planned:  'rgba(107,114,128,0.1)',
        draft:    'rgba(8,145,178,0.1)',
        review:   'rgba(180,83,9,0.1)',
        superseded: 'rgba(220,38,38,0.1)',
      }[p.status] || 'rgba(107,114,128,0.1)';

      return '<div style="display:flex;align-items:center;gap:0.65rem;padding:0.55rem 0;border-bottom:1px solid rgba(11,39,64,0.07);">' +
        '<span style="font-family:monospace;font-size:0.67rem;font-weight:800;color:rgba(11,39,64,0.38);flex-shrink:0;min-width:54px;">' + _esc(p.id) + '</span>' +
        '<span style="font-size:0.79rem;font-weight:500;color:#0b2740;flex:1;line-height:1.3;">' + _esc(p.title) + '</span>' +
        '<span style="font-size:0.62rem;font-weight:700;padding:0.14rem 0.55rem;border-radius:20px;background:' + statusBg + ';color:' + statusColor + ';flex-shrink:0;">' + _esc(statusLabel) + '</span>' +
      '</div>';
    }).join('');

    // ── Record type display name ──────────────────────────────────────────
    var RT_LABELS = {
      un: 'User Needs Specification',
      di: 'Design Inputs Specification',
      'do': 'Design Outputs Specification',
      'design-review': 'Design Review',
      'change-request': 'Change Request',
      risk: 'Risk Record',
      capa: 'CAPA',
      training: 'Training Record',
    };
    var rtLabel = RT_LABELS[check.recordType] || check.recordType;

    // ── Resolve relative path to process-library.html ────────────────────
    // Works whether the calling page is in tools/eqms/ or any subdirectory
    var procLibPath = (function () {
      var path = window.location.pathname;
      var depth = (path.match(/\//g) || []).length - 1; // segments below root
      // tools/eqms pages are 2 levels deep: /tools/eqms/foo.html
      // Just link relatively — all eQMS tools live in the same directory
      return 'process-library.html';
    })();

    // ── Modal HTML ────────────────────────────────────────────────────────
    var overlay = document.createElement('div');
    overlay.id = '_govBlockerOverlay';
    overlay.style.cssText = [
      'position:fixed',
      'inset:0',
      'background:rgba(2,25,47,0.6)',
      'backdrop-filter:blur(4px)',
      '-webkit-backdrop-filter:blur(4px)',
      'z-index:99999',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'padding:1.5rem',
      'font-family:Inter,system-ui,sans-serif',
    ].join(';');

    overlay.innerHTML = [
      '<div style="background:white;border-radius:14px;width:100%;max-width:520px;box-shadow:0 24px 64px rgba(2,25,47,0.28),0 4px 16px rgba(2,25,47,0.1);overflow:hidden;">',

        // ── Header ──────────────────────────────────────────────────────
        '<div style="padding:1.35rem 1.5rem 1.1rem;border-bottom:1px solid rgba(11,39,64,0.09);">',
          '<div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.5rem;">',
            '<div style="width:36px;height:36px;border-radius:9px;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.25);display:flex;align-items:center;justify-content:center;flex-shrink:0;">',
              '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
                '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>',
                '<path d="M7 11V7a5 5 0 0110 0v4"/>',
              '</svg>',
            '</div>',
            '<div>',
              '<div style="font-size:0.9rem;font-weight:800;color:#0b2740;letter-spacing:-0.01em;">Approval Blocked</div>',
              '<div style="font-size:0.7rem;color:rgba(11,39,64,0.45);margin-top:0.1rem;">' + _esc(rtLabel) + '</div>',
            '</div>',
            '<button onclick="document.getElementById(\'_govBlockerOverlay\').remove()" style="margin-left:auto;width:30px;height:30px;border-radius:7px;background:rgba(11,39,64,0.05);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:rgba(11,39,64,0.4);transition:background 0.15s;" onmouseover="this.style.background=\'rgba(11,39,64,0.1)\'" onmouseout="this.style.background=\'rgba(11,39,64,0.05)\'">',
              '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
            '</button>',
          '</div>',
          '<p style="font-size:0.78rem;color:rgba(11,39,64,0.6);line-height:1.6;margin:0;">',
            'This record cannot be formally approved until all governing procedures are approved in the Process Library. The following ' + (check.blocking.length === 1 ? 'procedure requires' : check.blocking.length + ' procedures require') + ' approval:',
          '</p>',
        '</div>',

        // ── Procedure list ───────────────────────────────────────────────
        '<div style="padding:0.25rem 1.5rem 0.5rem;">',
          '<div style="border-top:1px solid rgba(11,39,64,0.07);">',
            rows,
          '</div>',
        '</div>',

        // ── Footer ───────────────────────────────────────────────────────
        '<div style="padding:0.9rem 1.5rem;border-top:1px solid rgba(11,39,64,0.08);background:rgba(11,39,64,0.02);display:flex;align-items:center;justify-content:space-between;gap:1rem;">',
          '<p style="font-size:0.7rem;color:rgba(11,39,64,0.4);line-height:1.5;margin:0;">',
            'Approve the listed procedures first, then return here to complete this document\'s approval.',
          '</p>',
          '<a href="' + _esc(procLibPath) + '" style="display:inline-flex;align-items:center;gap:0.4rem;background:#0b2740;color:white;font-size:0.75rem;font-weight:700;padding:0.5rem 1rem;border-radius:7px;text-decoration:none;flex-shrink:0;transition:background 0.15s;" onmouseover="this.style.background=\'#304f6b\'" onmouseout="this.style.background=\'#0b2740\'">',
            'Go to Process Library',
            '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
          '</a>',
        '</div>',

      '</div>',
    ].join('');

    // Close on backdrop click
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) overlay.remove();
    });

    document.body.appendChild(overlay);
  }

  // ── EXPORT ────────────────────────────────────────────────────────────────

  return {
    checkProcedurePrereqs:   checkProcedurePrereqs,
    isRecordTypeUnlocked:    isRecordTypeUnlocked,
    getGoverningProcedures:  getGoverningProcedures,
    showBlocker:             showBlocker,
  };

})();
