/**
 * approvals.js — Universal Multi-Party Approval Routing
 * Tangram eQMS · Platform Infrastructure
 *
 * Wraps esign.js to support sequential multi-signer workflows defined in
 * qms_approval_routes. Falls back to single-signer if no route configured.
 *
 * API:
 *   Approvals.initiate({ recordType, recordId, recordSnapshot, meaning, onComplete, onCancel })
 *   Approvals.getStatus(recordType, recordId)          → { status, route, collected, next }
 *   Approvals.clearInstance(recordType, recordId)
 *   Approvals.renderStatusPanel(recordType, recordId, container)
 */

(function(global) {
  'use strict';

  var ROUTES_KEY    = 'qms_approval_routes';
  var INSTANCES_KEY = 'qms_approval_instances';

  // ── Persistence ─────────────────────────────────────────────────────────

  function loadRoutes() {
    try { return JSON.parse(localStorage.getItem(ROUTES_KEY) || '{}'); } catch(e) { return {}; }
  }

  function loadInstances() {
    try { return JSON.parse(localStorage.getItem(INSTANCES_KEY) || '{}'); } catch(e) { return {}; }
  }

  function saveInstances(instances) {
    try { localStorage.setItem(INSTANCES_KEY, JSON.stringify(instances)); } catch(e) {}
  }

  function instanceKey(recordType, recordId) {
    return recordType + '::' + recordId;
  }

  // ── Public: clearInstance ────────────────────────────────────────────────

  function clearInstance(recordType, recordId) {
    var instances = loadInstances();
    delete instances[instanceKey(recordType, recordId)];
    saveInstances(instances);
  }

  // ── Public: getStatus ────────────────────────────────────────────────────

  function getStatus(recordType, recordId) {
    var routes = loadRoutes();
    var route = routes[recordType] || [];
    var instances = loadInstances();
    var inst = instances[instanceKey(recordType, recordId)];

    if (!route.length) {
      // No route configured
      return { status: 'no-route', route: [], collected: [], next: null };
    }

    if (!inst || !inst.signatures || !inst.signatures.length) {
      return { status: 'pending', route: route, collected: [], next: route[0] || null };
    }

    var required = route.filter(function(r) { return r.required !== false; });
    var collectedRoles = inst.signatures.map(function(s) { return s.signerRole; });
    var remainingRequired = required.filter(function(r) { return !collectedRoles.includes(r.role); });

    if (!remainingRequired.length) {
      return { status: 'complete', route: route, collected: inst.signatures, next: null };
    }

    // Find the next uncollected step in order
    var next = null;
    for (var i = 0; i < route.length; i++) {
      if (!collectedRoles.includes(route[i].role)) { next = route[i]; break; }
    }

    return { status: 'pending', route: route, collected: inst.signatures, next: next };
  }

  // ── Public: renderStatusPanel ────────────────────────────────────────────

  function renderStatusPanel(recordType, recordId, container) {
    if (!container) return;
    var st = getStatus(recordType, recordId);
    if (st.status === 'no-route') { container.innerHTML = ''; return; }

    var stepsHTML = st.route.map(function(step, i) {
      var sig = st.collected.find(function(s) { return s.signerRole === step.role; });
      var icon, color;
      if (sig) {
        icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
        color = '#10B981';
      } else if (step === st.next) {
        icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
        color = '#F59E0B';
      } else {
        icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>';
        color = 'rgba(11,39,64,0.2)';
      }
      var sigMeta = sig ? ('<span style="color:rgba(11,39,64,0.4);font-size:0.68rem;margin-left:auto;">' + escHtml(sig.signerName) + ' · ' + new Date(sig.timestamp).toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) + '</span>') : '';
      return '<div style="display:flex;align-items:center;gap:0.5rem;padding:0.3rem 0;font-size:0.75rem;color:var(--primary,#0B2740);">' +
        '<span style="width:14px;height:14px;flex-shrink:0;display:flex;align-items:center;color:' + color + ';">' + icon + '</span>' +
        '<span style="font-weight:' + (sig ? '500' : step===st.next?'700':'400') + ';opacity:' + (sig||step===st.next?'1':'0.5') + ';">' + escHtml(step.role) + (step.required===false?' <span style="opacity:0.5;">(optional)</span>' : '') + '</span>' +
        sigMeta +
      '</div>';
    }).join('');

    var completedCount = st.collected.length;
    var totalRequired = st.route.filter(function(r) { return r.required !== false; }).length;
    var headerColor = st.status === 'complete' ? '#10B981' : '#F59E0B';
    var headerText = st.status === 'complete'
      ? 'All ' + totalRequired + ' signatures collected'
      : completedCount + ' of ' + totalRequired + ' signature' + (totalRequired !== 1 ? 's' : '') + ' collected';

    container.innerHTML =
      '<div style="background:white;border:1px solid rgba(11,39,64,0.1);border-radius:8px;padding:0.75rem 1rem;margin-top:0.75rem;">' +
        '<div style="display:flex;align-items:center;gap:0.45rem;margin-bottom:0.55rem;">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="' + headerColor + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;flex-shrink:0;"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>' +
          '<span style="font-size:0.68rem;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:' + headerColor + ';">Approval Route · ' + escHtml(headerText) + '</span>' +
        '</div>' +
        stepsHTML +
      '</div>';
  }

  // ── Public: initiate ─────────────────────────────────────────────────────

  /**
   * initiate({ recordType, recordId, recordSnapshot, meaning, onComplete, onCancel })
   *
   * Starts or resumes the approval workflow for a record.
   * - If no route configured: falls back to direct ESign.open
   * - If route configured: opens a multi-step signing modal
   *
   * onComplete(signatures) — called when all required signatures are collected
   * onCancel()             — called if user cancels at any step
   */
  function initiate(opts) {
    opts = opts || {};
    var recordType    = opts.recordType    || 'record';
    var recordId      = opts.recordId      || 'unknown';
    var recordSnapshot = opts.recordSnapshot || {};
    var meaning       = opts.meaning       || 'I approve this record as complete and accurate.';
    var onComplete    = opts.onComplete    || function() {};
    var onCancel      = opts.onCancel      || function() {};

    var routes = loadRoutes();
    var route  = routes[recordType] || [];

    if (!route.length) {
      // No route — single signer, fall through to ESign
      if (typeof ESign === 'undefined') { alert('ESign module not loaded.'); return; }
      if (!ESign.hasUserProfile()) { ESign.setupUserProfile(); return; }
      ESign.open({
        recordId: recordId,
        recordType: recordType,
        meaning: meaning,
        recordSnapshot: recordSnapshot,
        onSuccess: function(sig) { onComplete([sig]); },
        onCancel: onCancel,
      });
      return;
    }

    // Multi-step route
    _runMultiStep({
      route: route,
      recordType: recordType,
      recordId: recordId,
      recordSnapshot: recordSnapshot,
      meaning: meaning,
      onComplete: onComplete,
      onCancel: onCancel,
    });
  }

  // ── Multi-step modal ─────────────────────────────────────────────────────

  function _runMultiStep(ctx) {
    if (typeof ESign === 'undefined') { alert('ESign module not loaded.'); return; }
    if (!ESign.hasUserProfile()) { ESign.setupUserProfile(); return; }

    // Load or create instance
    var instances = loadInstances();
    var ikey = instanceKey(ctx.recordType, ctx.recordId);
    if (!instances[ikey]) {
      instances[ikey] = { recordType: ctx.recordType, recordId: ctx.recordId, startedAt: new Date().toISOString(), signatures: [] };
      saveInstances(instances);
    }

    _showMultiStepModal(ctx, ikey);
  }

  function _showMultiStepModal(ctx, ikey) {
    // Remove any existing modal
    var existing = document.getElementById('_approvals_modal');
    if (existing) existing.remove();

    var instances = loadInstances();
    var inst = instances[ikey] || { signatures: [] };
    var collected = inst.signatures || [];
    var route = ctx.route;

    // Figure out next step
    var collectedRoles = collected.map(function(s) { return s.signerRole; });
    var required = route.filter(function(r) { return r.required !== false; });
    var remainingRequired = required.filter(function(r) { return !collectedRoles.includes(r.role); });

    if (!remainingRequired.length) {
      // All done
      _destroyModal();
      ctx.onComplete(collected);
      return;
    }

    var nextStep = null;
    for (var i = 0; i < route.length; i++) {
      if (!collectedRoles.includes(route[i].role)) { nextStep = route[i]; break; }
    }

    var currentUser = ESign.getCurrentUser();
    var stepIndex = route.indexOf(nextStep);
    var totalRequired = required.length;
    var doneCount = collected.length;

    // Build step indicators
    var stepsHTML = route.map(function(step, i) {
      var sig = collected.find(function(s) { return s.signerRole === step.role; });
      var isCurrent = step === nextStep;
      var isDone = !!sig;
      var dotColor = isDone ? '#10B981' : isCurrent ? '#F59E0B' : 'rgba(11,39,64,0.15)';
      var dotContent = isDone
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width:9px;height:9px;"><polyline points="20 6 9 17 4 12"/></svg>'
        : (i + 1);
      var labelColor = isDone ? '#10B981' : isCurrent ? '#0B2740' : 'rgba(11,39,64,0.35)';
      var sigLine = isDone
        ? '<div style="font-size:0.63rem;color:#10B981;margin-top:0.1rem;">' + escHtml(sig.signerName) + '</div>'
        : isCurrent ? '<div style="font-size:0.63rem;color:#b45309;margin-top:0.1rem;">Next to sign</div>' : '';
      return '<div style="display:flex;flex-direction:column;align-items:center;gap:0.2rem;flex:1;">' +
        '<div style="width:22px;height:22px;border-radius:50%;background:' + dotColor + ';display:flex;align-items:center;justify-content:center;font-size:0.62rem;font-weight:800;color:' + (isDone?'white':'rgba(11,39,64,'+(isCurrent?'0.6':'0.3')+')') + ';">' + dotContent + '</div>' +
        '<div style="font-size:0.68rem;font-weight:' + (isCurrent?'700':'500') + ';color:' + labelColor + ';text-align:center;line-height:1.3;">' + escHtml(step.role) + '</div>' +
        sigLine +
      '</div>' +
      (i < route.length - 1 ? '<div style="flex:0 0 20px;height:1px;background:rgba(11,39,64,0.1);margin-top:11px;"></div>' : '');
    }).join('');

    // Role mismatch warning
    var roleMatch = currentUser && currentUser.role === nextStep.role;
    var roleMismatchHTML = (!roleMatch && nextStep.required !== false)
      ? '<div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25);border-radius:6px;padding:0.55rem 0.75rem;margin-bottom:1rem;font-size:0.75rem;color:#92400e;display:flex;gap:0.5rem;align-items:flex-start;">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="#b45309" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;flex-shrink:0;margin-top:1px;"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' +
          '<div>This step requires a <strong>' + escHtml(nextStep.role) + '</strong>. Your current role is <strong>' + escHtml(currentUser ? currentUser.role : 'Unknown') + '</strong>. In production, this step would be routed to the appropriate user.</div>' +
        '</div>'
      : '';

    var overlay = document.createElement('div');
    overlay.id = '_approvals_modal';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(2,25,47,0.55);backdrop-filter:blur(3px);z-index:9000;display:flex;align-items:center;justify-content:center;font-family:Inter,sans-serif;';

    overlay.innerHTML =
      '<div style="background:white;border-radius:14px;padding:2rem;width:460px;max-width:94vw;box-shadow:0 24px 64px rgba(2,25,47,0.28);">' +
        '<div style="margin-bottom:1.5rem;">' +
          '<div style="font-size:0.62rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(11,39,64,0.35);margin-bottom:0.3rem;">Approval Workflow · Step ' + (doneCount+1) + ' of ' + totalRequired + '</div>' +
          '<h3 style="font-size:1rem;font-weight:700;color:#0B2740;margin:0;">' + escHtml(nextStep.role) + ' signature required</h3>' +
        '</div>' +

        '<div style="display:flex;align-items:flex-start;gap:0;margin-bottom:1.5rem;padding:1rem;background:rgba(11,39,64,0.02);border-radius:8px;">' +
          stepsHTML +
        '</div>' +

        roleMismatchHTML +

        '<div style="font-size:0.78rem;color:rgba(11,39,64,0.55);margin-bottom:1.5rem;line-height:1.6;">' +
          'Step <strong>' + (doneCount+1) + '</strong>: <strong>' + escHtml(nextStep.role) + '</strong> must review and sign this record. After signing, ' +
          (remainingRequired.length > 1 ? (remainingRequired.length - 1) + ' more signature(s) will be required.' : 'the record will be fully approved.') +
        '</div>' +

        '<div style="display:flex;gap:0.75rem;">' +
          '<button id="_approvals_sign_btn" style="flex:1;background:#0B2740;color:white;font-family:Inter,sans-serif;font-weight:700;font-size:0.82rem;padding:0.6rem 1.2rem;border-radius:8px;border:none;cursor:pointer;transition:background 0.15s;" onmouseover="this.style.background=\'#304F6B\'" onmouseout="this.style.background=\'#0B2740\'">Sign this step →</button>' +
          '<button id="_approvals_cancel_btn" style="background:none;border:1.5px solid rgba(11,39,64,0.15);font-family:Inter,sans-serif;font-weight:600;font-size:0.8rem;color:rgba(11,39,64,0.5);padding:0.6rem 1rem;border-radius:8px;cursor:pointer;transition:all 0.15s;" onmouseover="this.style.borderColor=\'rgba(11,39,64,0.4)\';this.style.color=\'#0B2740\'" onmouseout="this.style.borderColor=\'rgba(11,39,64,0.15)\';this.style.color=\'rgba(11,39,64,0.5)\'">Cancel</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    document.getElementById('_approvals_sign_btn').addEventListener('click', function() {
      _destroyModal();
      ESign.open({
        recordId: ctx.recordId,
        recordType: ctx.recordType,
        meaning: ctx.meaning + ' (Step ' + (doneCount+1) + '/' + totalRequired + ': ' + nextStep.role + ')',
        recordSnapshot: ctx.recordSnapshot,
        onSuccess: function(sig) {
          // Append signature to instance
          var insts = loadInstances();
          if (!insts[ikey]) insts[ikey] = { signatures: [] };
          if (!insts[ikey].signatures) insts[ikey].signatures = [];
          insts[ikey].signatures.push(sig);
          saveInstances(insts);

          // Check if done
          var updatedCollected = insts[ikey].signatures;
          var updatedRoles = updatedCollected.map(function(s) { return s.signerRole; });
          var requiredSteps = ctx.route.filter(function(r) { return r.required !== false; });
          var remaining = requiredSteps.filter(function(r) { return !updatedRoles.includes(r.role); });

          if (!remaining.length) {
            ctx.onComplete(updatedCollected);
          } else {
            // Show next step
            _showMultiStepModal(ctx, ikey);
          }
        },
        onCancel: function() {
          ctx.onCancel();
        },
      });
    });

    document.getElementById('_approvals_cancel_btn').addEventListener('click', function() {
      _destroyModal();
      ctx.onCancel();
    });
  }

  function _destroyModal() {
    var m = document.getElementById('_approvals_modal');
    if (m) m.remove();
  }

  function escHtml(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── Export ───────────────────────────────────────────────────────────────

  global.Approvals = {
    initiate:           initiate,
    getStatus:          getStatus,
    clearInstance:      clearInstance,
    renderStatusPanel:  renderStatusPanel,
  };

})(window);
