/**
 * versions.js — Universal Version Control Utilities
 * Tangram eQMS Platform Infrastructure
 *
 * Type-agnostic. Works for any versionable document: design inputs, design outputs,
 * user needs, SOPs, procedures, training records, or any future record type.
 *
 * Version schema (fields added to every versionable item):
 *   version:           integer, starts at 1
 *   approvalSignature: esign.js signature object for THIS version
 *   changeRef:         CR ID that created this version (null for v1)
 *   history:           array of prior version snapshots
 *
 * History entry schema:
 *   {
 *     version:           integer
 *     frozenAt:          ISO timestamp
 *     changeRef:         CR ID (null for initial)
 *     changeReason:      human-readable reason string
 *     snapshot:          complete field-value copy at that version
 *     approvalSignature: esign.js signature object that approved that version
 *   }
 */

const Versions = (function () {
  'use strict';

  // ── CSS ──────────────────────────────────────────────────────────────────
  const CSS = `
    /* === Version History Panel === */
    .versions-panel {
      margin-top: 0.75rem;
      border-top: 1px solid rgba(11,39,64,0.08);
      padding-top: 0.75rem;
    }
    .versions-toggle-btn {
      display: flex; align-items: center; gap: 0.5rem;
      width: 100%; background: none; border: none;
      font-family: 'Inter', sans-serif; font-size: 0.73rem; font-weight: 600;
      color: rgba(11,39,64,0.50); padding: 0.3rem 0;
      cursor: pointer; text-align: left;
      transition: color 0.15s;
    }
    .versions-toggle-btn:hover { color: rgba(11,39,64,0.75); }
    .versions-toggle-btn svg.versions-toggle-icon { width: 13px; height: 13px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
    .versions-toggle-chevron {
      width: 11px; height: 11px; stroke: currentColor; fill: none; stroke-width: 2.5;
      stroke-linecap: round; stroke-linejoin: round; margin-left: auto;
      transition: transform 0.2s ease; opacity: 0.6;
    }
    .versions-toggle-btn.open .versions-toggle-chevron { transform: rotate(90deg); }
    .versions-entries { display: none; margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0; }
    .versions-entries.hidden { display: none; }

    /* Current version row */
    .versions-entry {
      border: 1px solid rgba(11,39,64,0.08);
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 0.5rem;
    }
    .versions-entry-head {
      display: flex; align-items: center; gap: 0.6rem;
      padding: 0.6rem 0.85rem;
      cursor: pointer;
      user-select: none;
      transition: background 0.12s;
    }
    .versions-entry-head:hover { background: rgba(11,39,64,0.02); }
    .versions-entry.current .versions-entry-head { background: rgba(10,192,233,0.04); }
    .versions-ver-dot {
      width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
      background: rgba(11,39,64,0.2);
    }
    .versions-entry.current .versions-ver-dot { background: #0AC0E9; }
    .versions-ver-label {
      font-family: 'Inter', sans-serif; font-size: 0.72rem; font-weight: 700;
      color: rgba(11,39,64,0.55); min-width: 24px;
    }
    .versions-entry.current .versions-ver-label { color: #0B2740; }
    .versions-current-badge {
      font-family: 'Inter', sans-serif; font-size: 0.58rem; font-weight: 700;
      letter-spacing: 0.06em; text-transform: uppercase;
      background: rgba(10,192,233,0.12); color: #089bbf;
      padding: 0.1rem 0.4rem; border-radius: 3px;
    }
    .versions-entry-date {
      font-family: 'Inter', sans-serif; font-size: 0.7rem;
      color: rgba(11,39,64,0.40); margin-left: auto; white-space: nowrap;
    }
    .versions-entry-cr {
      font-family: 'Inter', sans-serif; font-size: 0.68rem;
      color: rgba(11,39,64,0.40); white-space: nowrap; max-width: 110px;
      overflow: hidden; text-overflow: ellipsis;
    }
    .versions-expand-btn {
      font-family: 'Inter', sans-serif; font-size: 0.65rem; font-weight: 600;
      color: rgba(11,39,64,0.35); background: none; border: none;
      cursor: pointer; padding: 0; white-space: nowrap; margin-left: 0.35rem;
      transition: color 0.15s;
    }
    .versions-expand-btn:hover { color: rgba(11,39,64,0.65); }

    .versions-snapshot {
      display: none; padding: 0.75rem 0.85rem;
      border-top: 1px solid rgba(11,39,64,0.07);
      background: rgba(11,39,64,0.015);
      flex-direction: column; gap: 0.6rem;
    }
    .versions-snapshot.open { display: flex; }
    .versions-snap-field { display: flex; flex-direction: column; gap: 0.2rem; }
    .versions-snap-label {
      font-family: 'Inter', sans-serif; font-size: 0.62rem; font-weight: 700;
      letter-spacing: 0.07em; text-transform: uppercase; color: rgba(11,39,64,0.35);
    }
    .versions-snap-value {
      font-family: 'Inter', sans-serif; font-size: 0.78rem; color: rgba(11,39,64,0.75);
      line-height: 1.55;
    }
    .versions-snap-reason {
      font-family: 'Inter', sans-serif; font-size: 0.75rem;
      color: #b45309; font-style: italic; line-height: 1.5;
    }
    .versions-snap-sig {
      font-family: 'Inter', sans-serif; font-size: 0.7rem;
      color: rgba(11,39,64,0.45); line-height: 1.5;
      padding-top: 0.4rem; border-top: 1px dashed rgba(11,39,64,0.1);
    }
    .versions-snap-sig strong { color: rgba(11,39,64,0.65); }
    .versions-snap-cr-badge {
      display: inline-flex; align-items: center; gap: 0.3rem;
      font-family: 'Inter', sans-serif; font-size: 0.65rem; font-weight: 700;
      background: rgba(245,158,11,0.1); color: #b45309;
      padding: 0.12rem 0.45rem; border-radius: 4px;
    }

    /* Inline approval signature display in locked panel */
    .versions-approval-sig {
      display: flex; flex-direction: column; gap: 0.25rem;
      padding: 0.65rem 0.85rem;
      background: rgba(16,185,129,0.04);
      border: 1px solid rgba(16,185,129,0.15);
      border-radius: 8px; margin-top: 0.5rem;
    }
    .versions-approval-sig-header {
      display: flex; align-items: center; gap: 0.45rem;
    }
    .versions-approval-sig-icon { width: 13px; height: 13px; stroke: #047857; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
    .versions-approval-sig-title {
      font-family: 'Inter', sans-serif; font-size: 0.65rem; font-weight: 700;
      letter-spacing: 0.06em; text-transform: uppercase; color: #047857;
    }
    .versions-approval-sig-detail {
      font-family: 'Inter', sans-serif; font-size: 0.73rem; color: rgba(11,39,64,0.60);
      line-height: 1.5;
    }
    .versions-approval-sig-detail strong { color: #0B2740; font-weight: 600; }
    .versions-approval-sig-ts {
      font-family: 'Inter', sans-serif; font-size: 0.68rem; color: rgba(11,39,64,0.38);
    }
  `;

  function injectStyles() {
    if (document.getElementById('versions-styles')) return;
    const s = document.createElement('style');
    s.id = 'versions-styles';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  // ── Version lifecycle ─────────────────────────────────────────────────────

  /**
   * Freeze the current state of an item into its history array.
   * Increments item.version. Does NOT apply new field values.
   * Call this before applying new fields when a CR is approved.
   *
   * @param {Object} item             — the versionable document object (mutated in place)
   * @param {Object} [opts]
   * @param {string} [opts.changeRef]    — CR ID that triggered this change (null for initial)
   * @param {string} [opts.changeReason] — human-readable reason
   * @param {Object} [opts.approvalSignature] — esign.js signature that approved this version
   * @param {string[]} [opts.snapshotFields]  — explicit list of fields to snapshot; defaults to all own enumerable
   */
  function freeze(item, opts) {
    opts = opts || {};
    if (!item) return;
    if (!item.version) item.version = 1;
    if (!item.history) item.history = [];

    // Build snapshot of all current content fields
    const excluded = new Set(['version', 'history', 'approvalSignature', 'changeRef',
                              'type', 'typeBadge', 'typeCls', 'id', 'status']);
    const snapshot = {};
    const fields = opts.snapshotFields || Object.keys(item);
    fields.forEach(function (k) {
      if (!excluded.has(k)) {
        const v = item[k];
        snapshot[k] = Array.isArray(v) ? v.slice() : v;
      }
    });

    item.history.push({
      version:           item.version,
      frozenAt:          new Date().toISOString(),
      changeRef:         opts.changeRef         || item.changeRef || null,
      changeReason:      opts.changeReason      || '',
      snapshot:          snapshot,
      approvalSignature: opts.approvalSignature || item.approvalSignature || null,
    });

    item.version++;
  }

  /**
   * Freeze current state then apply new field values from an approved CR.
   * This is the primary mutation path: CR approved → version incremented.
   *
   * @param {Object} item        — the versionable document object (mutated in place)
   * @param {Object} newFields   — proposed field values from the CR
   * @param {Object} cr          — the change request object { id, changeReason, approvalSignature }
   */
  function applyChange(item, newFields, cr) {
    cr = cr || {};
    freeze(item, {
      changeRef:         cr.id         || null,
      changeReason:      cr.changeReason || cr.changeDescription || '',
      approvalSignature: cr.approvalSignature || null,
    });
    // Apply new field values
    Object.keys(newFields).forEach(function (k) {
      item[k] = newFields[k];
    });
    // Store the CR reference and new approval signature on the live item
    item.changeRef = cr.id || null;
    if (cr.approvalSignature) item.approvalSignature = cr.approvalSignature;
  }

  /**
   * Return the field values at a specific historical version.
   * Returns null if the version is not found in history.
   *
   * @param {Object} item     — the versionable document object
   * @param {number} version  — version number to retrieve
   * @returns {Object|null}
   */
  function getVersionSnapshot(item, version) {
    if (!item || !item.history) return null;
    const entry = item.history.find(function (h) { return h.version === version; });
    return entry ? entry.snapshot : null;
  }

  /**
   * Returns true if the item has any prior version history.
   * @param {Object} item
   * @returns {boolean}
   */
  function hasVersionHistory(item) {
    return !!(item && item.history && item.history.length > 0);
  }

  // ── Version History UI ────────────────────────────────────────────────────

  /**
   * Render version history HTML into a container element.
   * Handles both the "current version" display and all historical snapshots.
   *
   * @param {Object}      item       — the versionable document object
   * @param {HTMLElement} container  — DOM element to inject HTML into
   * @param {Object}      [opts]
   * @param {boolean}     [opts.showCurrentApproval=true] — show approval sig for current version
   */
  function renderHistoryPanel(item, container, opts) {
    if (!container) return;
    injectStyles();
    opts = opts || {};
    const showCurrentApproval = opts.showCurrentApproval !== false;

    container.innerHTML = buildHistoryPanelHTML(item, showCurrentApproval);

    // Wire up toggle buttons
    container.querySelectorAll('.versions-toggle-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        btn.classList.toggle('open');
        const entries = btn.nextElementSibling;
        if (entries) entries.classList.toggle('hidden');
      });
    });

    // Wire up snapshot expanders
    container.querySelectorAll('.versions-expand-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        const snapshot = btn.closest('.versions-entry').querySelector('.versions-snapshot');
        if (snapshot) snapshot.classList.toggle('open');
        btn.textContent = snapshot && snapshot.classList.contains('open') ? 'Hide ▴' : 'View ▸';
      });
    });

    // Entry head click also toggles snapshot (for prior versions)
    container.querySelectorAll('.versions-entry:not(.current) .versions-entry-head').forEach(function (head) {
      head.addEventListener('click', function () {
        const entry = head.closest('.versions-entry');
        const snapshot = entry.querySelector('.versions-snapshot');
        const btn = entry.querySelector('.versions-expand-btn');
        if (snapshot) {
          snapshot.classList.toggle('open');
          if (btn) btn.textContent = snapshot.classList.contains('open') ? 'Hide ▴' : 'View ▸';
        }
      });
    });
  }

  function buildHistoryPanelHTML(item, showCurrentApproval) {
    if (!item) return '';
    const version = item.version || 1;
    const history = (item.history || []).slice().reverse(); // newest first

    // Current version approval sig
    let currentApprovalHTML = '';
    if (showCurrentApproval && item.approvalSignature) {
      currentApprovalHTML = _buildSigHTML(item.approvalSignature);
    }

    const hasHistory = history.length > 0;
    const historyCount = hasHistory ? history.length : 0;
    const label = 'Version History' + (historyCount ? ' (' + historyCount + ' prior)' : '');

    let entriesHTML = '';

    // Prior version entries
    history.forEach(function (h) {
      const date = h.frozenAt ? new Date(h.frozenAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
      const crBadge = h.changeRef ? `<span class="versions-snap-cr-badge">via ${_esc(h.changeRef)}</span>` : '';
      const crLabel = h.changeRef ? `via ${_esc(h.changeRef)}` : 'Initial approval';
      const reasonHTML = h.changeReason ? `<div class="versions-snap-field"><div class="versions-snap-label">Reason for Change</div><div class="versions-snap-reason">${_esc(h.changeReason)}</div></div>` : '';
      const sigHTML = h.approvalSignature ? _buildSigHTMLInline(h.approvalSignature) : '';

      // Snapshot fields — show the main content fields
      let snapFieldsHTML = '';
      const snap = h.snapshot || {};
      const showFields = ['statement', 'description', 'source', 'category', 'regulatory', 'passFail', 'notes'];
      showFields.forEach(function (field) {
        if (snap[field]) {
          const labelMap = {
            statement: 'Statement',
            description: 'Description',
            source: 'Source',
            category: 'Category',
            regulatory: 'Regulatory Basis',
            passFail: 'Pass / Fail Condition',
            notes: 'Notes',
          };
          snapFieldsHTML += `<div class="versions-snap-field"><div class="versions-snap-label">${labelMap[field] || _cap(field)}</div><div class="versions-snap-value">${_esc(snap[field])}</div></div>`;
        }
      });

      entriesHTML += `
        <div class="versions-entry">
          <div class="versions-entry-head">
            <div class="versions-ver-dot"></div>
            <span class="versions-ver-label">v${h.version}</span>
            <span class="versions-entry-cr">${crLabel}</span>
            <span class="versions-entry-date">${date}</span>
            <button class="versions-expand-btn" onclick="">View ▸</button>
          </div>
          <div class="versions-snapshot">
            ${snapFieldsHTML}
            ${reasonHTML}
            ${sigHTML}
          </div>
        </div>
      `;
    });

    const currentDate = item.approvalSignature
      ? new Date(item.approvalSignature.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      : '—';

    const currentCrLabel = item.changeRef ? `via ${_esc(item.changeRef)}` : (version === 1 ? 'Initial' : '');

    const currentEntry = `
      <div class="versions-entry current">
        <div class="versions-entry-head">
          <div class="versions-ver-dot"></div>
          <span class="versions-ver-label">v${version}</span>
          <span class="versions-current-badge">current</span>
          <span class="versions-entry-cr">${currentCrLabel}</span>
          <span class="versions-entry-date">${currentDate}</span>
        </div>
        ${currentApprovalHTML ? `<div class="versions-snapshot open">${currentApprovalHTML}</div>` : ''}
      </div>
    `;

    return `
      <div class="versions-panel">
        <button class="versions-toggle-btn open">
          <svg class="versions-toggle-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 8 12 12 14 14"/></svg>
          ${_esc(label)}
          <svg class="versions-toggle-chevron" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <div class="versions-entries">
          ${currentEntry}
          ${entriesHTML}
        </div>
      </div>
    `;
  }

  function _buildSigHTML(sig) {
    if (!sig) return '';
    const ts = sig.timestamp ? new Date(sig.timestamp).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
    return `
      <div class="versions-approval-sig">
        <div class="versions-approval-sig-header">
          <svg class="versions-approval-sig-icon" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <span class="versions-approval-sig-title">Approved</span>
        </div>
        <div class="versions-approval-sig-detail">
          <strong>${_esc(sig.signerName || '—')}</strong> · ${_esc(sig.signerRole || '')}
        </div>
        <div class="versions-approval-sig-ts">${ts}</div>
      </div>
    `;
  }

  function _buildSigHTMLInline(sig) {
    if (!sig) return '';
    const ts = sig.timestamp ? new Date(sig.timestamp).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
    return `<div class="versions-snap-sig"><strong>Approved by:</strong> ${_esc(sig.signerName || '—')} · ${_esc(sig.signerRole || '')} · ${ts}</div>`;
  }

  function _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function _cap(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // ── Public surface ────────────────────────────────────────────────────────
  return {
    freeze:               freeze,
    applyChange:          applyChange,
    renderHistoryPanel:   renderHistoryPanel,
    getVersionSnapshot:   getVersionSnapshot,
    hasVersionHistory:    hasVersionHistory,

    // Exposed for direct HTML generation without DOM injection
    buildHistoryPanelHTML: buildHistoryPanelHTML,
    buildApprovalSigHTML:  _buildSigHTML,
  };

})();
