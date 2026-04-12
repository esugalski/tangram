/**
 * esign.js — Universal 21 CFR Part 11-compliant Electronic Signature Module
 * Tangram eQMS Platform Infrastructure
 *
 * Platform-wide, type-agnostic. Works for any record: design inputs, design outputs,
 * user needs, design reviews, change requests, SOPs, procedures, training records, etc.
 *
 * Production compliance note: This module implements the correct process
 * (re-authentication, signing meaning, timestamp, audit log, content hash).
 * Production Part 11 compliance requires replacing client-side password hash +
 * localStorage audit log with a server-side implementation. The public API surface
 * does not change when a backend is added.
 *
 * localStorage keys:
 *   qms_current_user      — active user profile object
 *   qms_signature_log     — append-only array of all signature events
 */

const ESign = (function () {
  'use strict';

  // ── CSS ──────────────────────────────────────────────────────────────────
  const CSS = `
    /* === ESign Overlay === */
    .esign-overlay {
      position: fixed; inset: 0; z-index: 2000;
      display: flex; align-items: center; justify-content: center;
      background: rgba(2, 25, 47, 0.55);
      backdrop-filter: blur(3px);
      opacity: 0; pointer-events: none;
      transition: opacity 0.2s ease;
    }
    .esign-overlay.open {
      opacity: 1; pointer-events: auto;
    }
    .esign-modal {
      background: #fff;
      border-radius: 14px;
      width: 420px; max-width: calc(100vw - 2rem);
      box-shadow: 0 24px 60px rgba(2,25,47,0.22), 0 4px 12px rgba(2,25,47,0.10);
      display: flex; flex-direction: column;
      transform: translateY(10px) scale(0.98);
      transition: transform 0.22s cubic-bezier(0.4,0,0.2,1);
      overflow: hidden;
    }
    .esign-overlay.open .esign-modal {
      transform: translateY(0) scale(1);
    }
    .esign-modal-head {
      padding: 1.2rem 1.4rem 1rem;
      border-bottom: 1px solid rgba(11,39,64,0.08);
      display: flex; align-items: center; gap: 0.75rem;
    }
    .esign-modal-icon {
      width: 34px; height: 34px; border-radius: 9px;
      background: rgba(10,192,233,0.10);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .esign-modal-icon svg { width: 16px; height: 16px; stroke: #0AC0E9; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
    .esign-modal-title { font-family: 'Inter', sans-serif; font-size: 0.95rem; font-weight: 700; color: #0B2740; letter-spacing: -0.01em; }
    .esign-modal-sub { font-family: 'Inter', sans-serif; font-size: 0.72rem; color: rgba(11,39,64,0.42); margin-top: 0.15rem; }
    .esign-modal-close {
      margin-left: auto; width: 28px; height: 28px; border-radius: 6px;
      border: none; background: rgba(11,39,64,0.06);
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: background 0.15s; flex-shrink: 0;
    }
    .esign-modal-close:hover { background: rgba(11,39,64,0.12); }
    .esign-modal-close svg { width: 13px; height: 13px; stroke: #0B2740; fill: none; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
    .esign-modal-body { padding: 1.25rem 1.4rem; display: flex; flex-direction: column; gap: 1rem; }

    /* Signer info block */
    .esign-signer-block {
      background: rgba(11,39,64,0.03); border: 1px solid rgba(11,39,64,0.08);
      border-radius: 9px; padding: 0.85rem 1rem;
      display: flex; flex-direction: column; gap: 0.3rem;
    }
    .esign-signer-row { display: flex; align-items: baseline; gap: 0.5rem; }
    .esign-signer-label { font-family: 'Inter', sans-serif; font-size: 0.62rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(11,39,64,0.38); min-width: 72px; }
    .esign-signer-value { font-family: 'Inter', sans-serif; font-size: 0.8rem; font-weight: 600; color: #0B2740; }
    .esign-signer-value.muted { font-weight: 400; color: rgba(11,39,64,0.55); }

    /* Meaning block */
    .esign-meaning-block {
      border-left: 3px solid rgba(10,192,233,0.45);
      padding: 0.6rem 0.85rem;
      background: rgba(10,192,233,0.04);
      border-radius: 0 7px 7px 0;
    }
    .esign-meaning-label { font-family: 'Inter', sans-serif; font-size: 0.62rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(11,39,64,0.38); margin-bottom: 0.3rem; }
    .esign-meaning-text { font-family: 'Inter', sans-serif; font-size: 0.8rem; color: #0B2740; font-style: italic; line-height: 1.5; }

    /* Password field */
    .esign-field-label { font-family: 'Inter', sans-serif; font-size: 0.72rem; font-weight: 600; color: #0B2740; margin-bottom: 0.35rem; }
    .esign-password-wrap { position: relative; }
    .esign-password-input {
      width: 100%; font-family: 'Inter', sans-serif; font-size: 0.85rem;
      color: #0B2740; border: 1.5px solid rgba(11,39,64,0.16);
      border-radius: 8px; padding: 0.55rem 2.5rem 0.55rem 0.75rem;
      outline: none; transition: border-color 0.15s, box-shadow 0.15s;
      box-sizing: border-box;
    }
    .esign-password-input:focus { border-color: #0AC0E9; box-shadow: 0 0 0 3px rgba(10,192,233,0.12); }
    .esign-password-input.error { border-color: #EF4444; box-shadow: 0 0 0 3px rgba(239,68,68,0.10); }
    .esign-pw-toggle {
      position: absolute; right: 0.6rem; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; padding: 0.2rem;
      color: rgba(11,39,64,0.35); transition: color 0.15s;
    }
    .esign-pw-toggle:hover { color: rgba(11,39,64,0.7); }
    .esign-pw-toggle svg { width: 15px; height: 15px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; display: block; }
    .esign-error-msg {
      font-family: 'Inter', sans-serif; font-size: 0.72rem; color: #EF4444;
      font-weight: 500; display: none; margin-top: 0.35rem;
    }
    .esign-error-msg.show { display: block; }

    /* Warning bar */
    .esign-warning-bar {
      display: flex; align-items: flex-start; gap: 0.5rem;
      background: rgba(245,158,11,0.07); border: 1px solid rgba(245,158,11,0.2);
      border-radius: 7px; padding: 0.6rem 0.75rem;
    }
    .esign-warning-bar svg { width: 14px; height: 14px; stroke: #b45309; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; flex-shrink: 0; margin-top: 1px; }
    .esign-warning-bar span { font-family: 'Inter', sans-serif; font-size: 0.72rem; color: #b45309; line-height: 1.5; }

    .esign-modal-foot {
      padding: 1rem 1.4rem 1.25rem;
      border-top: 1px solid rgba(11,39,64,0.07);
      display: flex; align-items: center; justify-content: flex-end; gap: 0.65rem;
    }
    .esign-btn-cancel {
      font-family: 'Inter', sans-serif; font-size: 0.78rem; font-weight: 600;
      color: rgba(11,39,64,0.55); background: transparent;
      border: 1.5px solid rgba(11,39,64,0.14); border-radius: 7px;
      padding: 0.5rem 1.1rem; cursor: pointer;
      transition: border-color 0.15s, color 0.15s, background 0.15s;
    }
    .esign-btn-cancel:hover { border-color: rgba(11,39,64,0.28); color: #0B2740; background: rgba(11,39,64,0.03); }
    .esign-btn-sign {
      font-family: 'Inter', sans-serif; font-size: 0.78rem; font-weight: 700;
      color: #0B2740; background: #0AC0E9;
      border: none; border-radius: 7px;
      padding: 0.5rem 1.25rem; cursor: pointer;
      box-shadow: 0 2px 8px rgba(10,192,233,0.30);
      transition: background 0.15s, transform 0.12s, box-shadow 0.15s;
      display: flex; align-items: center; gap: 0.4rem;
    }
    .esign-btn-sign:hover { background: #089bbf; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(10,192,233,0.35); }
    .esign-btn-sign:active { transform: translateY(0); }
    .esign-btn-sign svg { width: 13px; height: 13px; stroke: currentColor; fill: none; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
    .esign-btn-sign.loading { pointer-events: none; opacity: 0.75; }

    /* === Profile Setup Modal === */
    .esign-setup-overlay {
      position: fixed; inset: 0; z-index: 2100;
      display: flex; align-items: center; justify-content: center;
      background: rgba(2, 25, 47, 0.6);
      backdrop-filter: blur(4px);
      opacity: 0; pointer-events: none;
      transition: opacity 0.2s ease;
    }
    .esign-setup-overlay.open { opacity: 1; pointer-events: auto; }
    .esign-setup-modal {
      background: #fff; border-radius: 14px;
      width: 420px; max-width: calc(100vw - 2rem);
      box-shadow: 0 24px 60px rgba(2,25,47,0.25);
      transform: translateY(12px) scale(0.97);
      transition: transform 0.22s cubic-bezier(0.4,0,0.2,1);
      overflow: hidden;
    }
    .esign-setup-overlay.open .esign-setup-modal { transform: translateY(0) scale(1); }
    .esign-setup-head {
      padding: 1.4rem 1.4rem 1.1rem;
      border-bottom: 1px solid rgba(11,39,64,0.08);
    }
    .esign-setup-head-row { display: flex; align-items: center; gap: 0.7rem; margin-bottom: 0.5rem; }
    .esign-setup-icon {
      width: 38px; height: 38px; border-radius: 10px;
      background: linear-gradient(135deg, rgba(10,192,233,0.15), rgba(10,192,233,0.06));
      border: 1px solid rgba(10,192,233,0.2);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .esign-setup-icon svg { width: 18px; height: 18px; stroke: #0AC0E9; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
    .esign-setup-title { font-family: 'Inter', sans-serif; font-size: 1rem; font-weight: 800; color: #0B2740; letter-spacing: -0.02em; }
    .esign-setup-desc { font-family: 'Inter', sans-serif; font-size: 0.75rem; color: rgba(11,39,64,0.50); line-height: 1.55; }
    .esign-setup-body { padding: 1.25rem 1.4rem; display: flex; flex-direction: column; gap: 0.9rem; }
    .esign-setup-field { display: flex; flex-direction: column; gap: 0.3rem; }
    .esign-setup-label { font-family: 'Inter', sans-serif; font-size: 0.72rem; font-weight: 600; color: #0B2740; }
    .esign-setup-input {
      width: 100%; font-family: 'Inter', sans-serif; font-size: 0.85rem;
      color: #0B2740; border: 1.5px solid rgba(11,39,64,0.14);
      border-radius: 8px; padding: 0.55rem 0.75rem;
      outline: none; transition: border-color 0.15s, box-shadow 0.15s;
      box-sizing: border-box;
    }
    .esign-setup-input:focus { border-color: #0AC0E9; box-shadow: 0 0 0 3px rgba(10,192,233,0.12); }
    .esign-setup-input.error { border-color: #EF4444; }
    .esign-setup-hint { font-family: 'Inter', sans-serif; font-size: 0.65rem; color: rgba(11,39,64,0.38); }
    .esign-setup-pw-strength { height: 3px; border-radius: 2px; background: rgba(11,39,64,0.08); margin-top: 0.35rem; overflow: hidden; }
    .esign-setup-pw-strength-bar { height: 100%; border-radius: 2px; transition: width 0.25s, background 0.25s; }
    .esign-setup-error { font-family: 'Inter', sans-serif; font-size: 0.72rem; color: #EF4444; font-weight: 500; display: none; }
    .esign-setup-error.show { display: block; }
    .esign-setup-foot {
      padding: 1rem 1.4rem 1.25rem;
      border-top: 1px solid rgba(11,39,64,0.07);
      display: flex; justify-content: flex-end; gap: 0.65rem;
    }
    .esign-setup-btn-create {
      font-family: 'Inter', sans-serif; font-size: 0.78rem; font-weight: 700;
      color: #0B2740; background: #0AC0E9;
      border: none; border-radius: 7px;
      padding: 0.5rem 1.35rem; cursor: pointer;
      box-shadow: 0 2px 8px rgba(10,192,233,0.30);
      transition: background 0.15s, transform 0.12s;
    }
    .esign-setup-btn-create:hover { background: #089bbf; transform: translateY(-1px); }

    /* === Audit Log Modal === */
    .esign-audit-overlay {
      position: fixed; inset: 0; z-index: 2000;
      display: flex; align-items: center; justify-content: center;
      background: rgba(2,25,47,0.50);
      backdrop-filter: blur(3px);
      opacity: 0; pointer-events: none;
      transition: opacity 0.2s ease;
    }
    .esign-audit-overlay.open { opacity: 1; pointer-events: auto; }
    .esign-audit-modal {
      background: #fff; border-radius: 14px;
      width: 560px; max-width: calc(100vw - 2rem); max-height: 80vh;
      box-shadow: 0 24px 60px rgba(2,25,47,0.22);
      display: flex; flex-direction: column;
      transform: translateY(10px); transition: transform 0.22s cubic-bezier(0.4,0,0.2,1);
    }
    .esign-audit-overlay.open .esign-audit-modal { transform: translateY(0); }
    .esign-audit-head {
      padding: 1.1rem 1.4rem; border-bottom: 1px solid rgba(11,39,64,0.08);
      display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
    }
    .esign-audit-title { font-family: 'Inter', sans-serif; font-size: 0.9rem; font-weight: 700; color: #0B2740; }
    .esign-audit-count { font-family: 'Inter', sans-serif; font-size: 0.7rem; color: rgba(11,39,64,0.38); margin-left: 0.5rem; }
    .esign-audit-body { flex: 1; overflow-y: auto; padding: 1rem 1.4rem; display: flex; flex-direction: column; gap: 0.65rem; }
    .esign-audit-body::-webkit-scrollbar { width: 4px; }
    .esign-audit-body::-webkit-scrollbar-thumb { background: rgba(11,39,64,0.1); border-radius: 2px; }
    .esign-audit-entry {
      border: 1px solid rgba(11,39,64,0.08); border-radius: 9px;
      padding: 0.85rem 1rem; display: flex; flex-direction: column; gap: 0.35rem;
    }
    .esign-audit-entry-top { display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap; }
    .esign-audit-rec-badge {
      font-family: 'Inter', sans-serif; font-size: 0.6rem; font-weight: 700;
      letter-spacing: 0.06em; text-transform: uppercase;
      background: rgba(11,39,64,0.07); color: rgba(11,39,64,0.55);
      padding: 0.12rem 0.45rem; border-radius: 4px;
    }
    .esign-audit-signer { font-family: 'Inter', sans-serif; font-size: 0.8rem; font-weight: 600; color: #0B2740; }
    .esign-audit-role { font-family: 'Inter', sans-serif; font-size: 0.72rem; color: rgba(11,39,64,0.45); }
    .esign-audit-ts { font-family: 'Inter', sans-serif; font-size: 0.7rem; color: rgba(11,39,64,0.38); margin-left: auto; white-space: nowrap; }
    .esign-audit-meaning { font-family: 'Inter', sans-serif; font-size: 0.73rem; color: rgba(11,39,64,0.60); font-style: italic; line-height: 1.5; }
    .esign-audit-hash { font-family: 'Courier New', monospace; font-size: 0.62rem; color: rgba(11,39,64,0.25); word-break: break-all; }
    .esign-audit-empty { text-align: center; padding: 2.5rem 1rem; font-family: 'Inter', sans-serif; font-size: 0.8rem; color: rgba(11,39,64,0.35); }
  `;

  // ── DOM injection ─────────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('esign-styles')) return;
    const s = document.createElement('style');
    s.id = 'esign-styles';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function ensureSignModalDOM() {
    if (document.getElementById('esign-overlay')) return;
    const div = document.createElement('div');
    div.innerHTML = `
      <div class="esign-overlay" id="esign-overlay">
        <div class="esign-modal" role="dialog" aria-modal="true" aria-labelledby="esign-title">
          <div class="esign-modal-head">
            <div class="esign-modal-icon">
              <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div>
              <div class="esign-modal-title" id="esign-title">Electronic Signature</div>
              <div class="esign-modal-sub" id="esign-record-sub">—</div>
            </div>
            <button class="esign-modal-close" onclick="ESign._cancelSign()" aria-label="Cancel">
              <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="esign-modal-body" id="esign-modal-body">
            <!-- dynamic content -->
          </div>
          <div class="esign-modal-foot">
            <button class="esign-btn-cancel" onclick="ESign._cancelSign()">Cancel</button>
            <button class="esign-btn-sign" id="esign-btn-sign" onclick="ESign._submitSign()">
              <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
              Sign &amp; Confirm
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(div.firstElementChild);
  }

  function ensureSetupModalDOM() {
    if (document.getElementById('esign-setup-overlay')) return;
    const div = document.createElement('div');
    div.innerHTML = `
      <div class="esign-setup-overlay" id="esign-setup-overlay">
        <div class="esign-setup-modal" role="dialog" aria-modal="true">
          <div class="esign-setup-head">
            <div class="esign-setup-head-row">
              <div class="esign-setup-icon">
                <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div class="esign-setup-title">Create Your Signature Profile</div>
            </div>
            <div class="esign-setup-desc">Your e-signature identifies you on all signed records in this system. Set up your profile once — it is used for every signature action across the platform.</div>
          </div>
          <div class="esign-setup-body">
            <div class="esign-setup-field">
              <label class="esign-setup-label" for="esign-setup-name">Full Name</label>
              <input class="esign-setup-input" type="text" id="esign-setup-name" placeholder="e.g. Jane Smith" autocomplete="name">
              <div class="esign-setup-error" id="esign-setup-name-err">Name is required.</div>
            </div>
            <div class="esign-setup-field">
              <label class="esign-setup-label" for="esign-setup-role">Role / Title</label>
              <input class="esign-setup-input" type="text" id="esign-setup-role" placeholder="e.g. Systems Engineer" autocomplete="organization-title">
              <div class="esign-setup-error" id="esign-setup-role-err">Role is required.</div>
            </div>
            <div class="esign-setup-field">
              <label class="esign-setup-label" for="esign-setup-pw">Signature Password</label>
              <input class="esign-setup-input" type="password" id="esign-setup-pw" placeholder="Create a strong password" autocomplete="new-password">
              <div class="esign-setup-pw-strength"><div class="esign-setup-pw-strength-bar" id="esign-setup-pw-bar" style="width:0%;background:#EF4444;"></div></div>
              <div class="esign-setup-hint">Used to confirm your identity each time you sign a record.</div>
              <div class="esign-setup-error" id="esign-setup-pw-err">Password must be at least 8 characters.</div>
            </div>
            <div class="esign-setup-field">
              <label class="esign-setup-label" for="esign-setup-pw2">Confirm Password</label>
              <input class="esign-setup-input" type="password" id="esign-setup-pw2" placeholder="Re-enter your password" autocomplete="new-password">
              <div class="esign-setup-error" id="esign-setup-pw2-err">Passwords do not match.</div>
            </div>
          </div>
          <div class="esign-setup-foot">
            <button class="esign-setup-btn-create" onclick="ESign._submitSetup()">Create Profile</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(div.firstElementChild);

    // Wire up password strength indicator
    document.getElementById('esign-setup-pw').addEventListener('input', function () {
      const bar = document.getElementById('esign-setup-pw-bar');
      const v = this.value;
      let strength = 0;
      if (v.length >= 8) strength++;
      if (v.length >= 12) strength++;
      if (/[A-Z]/.test(v)) strength++;
      if (/[0-9]/.test(v)) strength++;
      if (/[^A-Za-z0-9]/.test(v)) strength++;
      const pct = Math.round((strength / 5) * 100);
      const colors = ['#EF4444', '#EF4444', '#F59E0B', '#10B981', '#10B981'];
      bar.style.width = pct + '%';
      bar.style.background = colors[Math.max(0, strength - 1)] || '#EF4444';
    });
  }

  function ensureAuditModalDOM() {
    if (document.getElementById('esign-audit-overlay')) return;
    const div = document.createElement('div');
    div.innerHTML = `
      <div class="esign-audit-overlay" id="esign-audit-overlay">
        <div class="esign-audit-modal" role="dialog" aria-modal="true">
          <div class="esign-audit-head">
            <div>
              <span class="esign-audit-title">Signature Audit Log</span>
              <span class="esign-audit-count" id="esign-audit-count"></span>
            </div>
            <button class="esign-modal-close" onclick="ESign._closeAudit()" aria-label="Close">
              <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="esign-audit-body" id="esign-audit-body"></div>
        </div>
      </div>
    `;
    document.body.appendChild(div.firstElementChild);
  }

  // ── SHA-256 (client-side only; server replaces in production) ─────────────
  async function sha256(message) {
    try {
      const msgBuffer = new TextEncoder().encode(message);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return 'sha256-' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      // Fallback for non-secure contexts
      return 'sha256-unavailable-' + Date.now();
    }
  }

  async function hashPassword(password) {
    return sha256('esign-pw-v1:' + password);
  }

  // ── localStorage helpers ──────────────────────────────────────────────────
  function getUser() {
    try { return JSON.parse(localStorage.getItem('qms_current_user')) || null; } catch (e) { return null; }
  }
  function setUser(u) {
    localStorage.setItem('qms_current_user', JSON.stringify(u));
  }
  function getLog() {
    try { return JSON.parse(localStorage.getItem('qms_signature_log')) || []; } catch (e) { return []; }
  }
  function appendLog(entry) {
    const log = getLog();
    log.push(entry);
    localStorage.setItem('qms_signature_log', JSON.stringify(log));
  }

  // ── Internal state ────────────────────────────────────────────────────────
  let _pendingConfig = null;   // { recordId, recordType, meaning, recordSnapshot, onSuccess, onCancel }
  let _setupPending = null;    // callback once profile is set up

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Open the signature modal to sign a record.
   * @param {Object} config
   * @param {string} config.recordId         — ID of the record being signed (e.g. "DI-001")
   * @param {string} config.recordType       — type string (e.g. "design-input", "design-review")
   * @param {string} config.meaning          — signing meaning text shown to signer
   * @param {*}      config.recordSnapshot   — current record state (used for content hash)
   * @param {Function} config.onSuccess      — called with signature object on successful sign
   * @param {Function} [config.onCancel]     — called if user cancels
   */
  function open(config) {
    injectStyles();
    if (!getUser()) {
      _setupPending = function () { open(config); };
      setupUserProfile();
      return;
    }
    _pendingConfig = config;
    ensureSignModalDOM();
    _renderSignModal();
    document.getElementById('esign-overlay').classList.add('open');
    setTimeout(function () {
      const pw = document.getElementById('esign-pw-input');
      if (pw) pw.focus();
    }, 250);
  }

  function _renderSignModal() {
    const user = getUser();
    const cfg = _pendingConfig;
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });

    document.getElementById('esign-record-sub').textContent = cfg.recordType + ' · ' + cfg.recordId;

    document.getElementById('esign-modal-body').innerHTML = `
      <div class="esign-signer-block">
        <div class="esign-signer-row"><span class="esign-signer-label">Signing as</span><span class="esign-signer-value">${_esc(user.name)}</span></div>
        <div class="esign-signer-row"><span class="esign-signer-label">Role</span><span class="esign-signer-value muted">${_esc(user.role)}</span></div>
        <div class="esign-signer-row"><span class="esign-signer-label">Date / Time</span><span class="esign-signer-value muted">${dateStr} &nbsp;${timeStr}</span></div>
      </div>

      <div class="esign-meaning-block">
        <div class="esign-meaning-label">Signing meaning</div>
        <div class="esign-meaning-text">"${_esc(cfg.meaning)}"</div>
      </div>

      <div>
        <div class="esign-field-label">Re-enter your password to confirm</div>
        <div class="esign-password-wrap">
          <input class="esign-password-input" type="password" id="esign-pw-input"
            placeholder="••••••••" autocomplete="current-password"
            onkeydown="if(event.key==='Enter'){ESign._submitSign();}">
          <button class="esign-pw-toggle" tabindex="-1" onclick="ESign._togglePwVisibility()">
            <svg id="esign-pw-eye" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>
        <div class="esign-error-msg" id="esign-pw-error">Incorrect password. Please try again.</div>
      </div>

      <div class="esign-warning-bar">
        <svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <span>This action is binding and cannot be undone without a formal change request.</span>
      </div>
    `;
  }

  async function _submitSign() {
    const cfg = _pendingConfig; if (!cfg) return;
    const user = getUser(); if (!user) return;
    const pwInput = document.getElementById('esign-pw-input');
    const errorEl = document.getElementById('esign-pw-error');
    const btn = document.getElementById('esign-btn-sign');
    if (!pwInput) return;
    const password = pwInput.value;
    if (!password) { _showPwError('Please enter your password.'); return; }

    btn.classList.add('loading');
    btn.textContent = 'Verifying…';

    const enteredHash = await hashPassword(password);
    if (enteredHash !== user.passwordHash) {
      btn.classList.remove('loading');
      btn.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> Sign &amp; Confirm';
      _showPwError('Incorrect password. Please try again.');
      pwInput.value = ''; pwInput.focus();
      return;
    }

    // Build signature object
    const timestamp = new Date().toISOString();
    const snapshotStr = JSON.stringify(cfg.recordSnapshot || {});
    const contentHash = await sha256(snapshotStr);

    const signature = {
      signerId:    user.id,
      signerName:  user.name,
      signerRole:  user.role,
      meaning:     cfg.meaning,
      timestamp:   timestamp,
      recordId:    cfg.recordId,
      recordType:  cfg.recordType,
      contentHash: contentHash,
    };

    appendLog(signature);
    _closeSignModal();

    if (typeof cfg.onSuccess === 'function') cfg.onSuccess(signature);
  }

  function _cancelSign() {
    const cfg = _pendingConfig;
    _closeSignModal();
    if (cfg && typeof cfg.onCancel === 'function') cfg.onCancel();
  }

  function _closeSignModal() {
    const overlay = document.getElementById('esign-overlay');
    if (overlay) overlay.classList.remove('open');
    _pendingConfig = null;
  }

  function _showPwError(msg) {
    const errEl = document.getElementById('esign-pw-error');
    const pwInput = document.getElementById('esign-pw-input');
    if (errEl) { errEl.textContent = msg; errEl.classList.add('show'); }
    if (pwInput) pwInput.classList.add('error');
  }

  function _togglePwVisibility() {
    const inp = document.getElementById('esign-pw-input');
    if (!inp) return;
    inp.type = inp.type === 'password' ? 'text' : 'password';
  }

  // ── Profile setup ─────────────────────────────────────────────────────────
  function setupUserProfile() {
    injectStyles();
    ensureSetupModalDOM();
    // Clear fields
    ['esign-setup-name','esign-setup-role','esign-setup-pw','esign-setup-pw2'].forEach(function(id) {
      const el = document.getElementById(id); if (el) { el.value = ''; el.classList.remove('error'); }
    });
    ['esign-setup-name-err','esign-setup-role-err','esign-setup-pw-err','esign-setup-pw2-err'].forEach(function(id) {
      const el = document.getElementById(id); if (el) el.classList.remove('show');
    });
    const bar = document.getElementById('esign-setup-pw-bar');
    if (bar) { bar.style.width = '0%'; }
    document.getElementById('esign-setup-overlay').classList.add('open');
    setTimeout(function () {
      const n = document.getElementById('esign-setup-name'); if (n) n.focus();
    }, 250);
  }

  async function _submitSetup() {
    let valid = true;
    const name = (document.getElementById('esign-setup-name').value || '').trim();
    const role = (document.getElementById('esign-setup-role').value || '').trim();
    const pw   = document.getElementById('esign-setup-pw').value;
    const pw2  = document.getElementById('esign-setup-pw2').value;

    function setErr(id, show) {
      const el = document.getElementById(id); if (el) el.classList.toggle('show', show);
      const inp = document.getElementById(id.replace('-err','').replace('esign-setup-','esign-setup-'));
    }
    function setFieldErr(inputId, errId, show) {
      const inp = document.getElementById(inputId); if (inp) inp.classList.toggle('error', show);
      const err = document.getElementById(errId);  if (err) err.classList.toggle('show', show);
    }

    setFieldErr('esign-setup-name', 'esign-setup-name-err', !name);  if (!name) valid = false;
    setFieldErr('esign-setup-role', 'esign-setup-role-err', !role);  if (!role) valid = false;
    setFieldErr('esign-setup-pw',   'esign-setup-pw-err',   pw.length < 8); if (pw.length < 8) valid = false;
    setFieldErr('esign-setup-pw2',  'esign-setup-pw2-err',  pw !== pw2);    if (pw !== pw2) valid = false;

    if (!valid) return;

    const passwordHash = await hashPassword(pw);
    const user = {
      id:           'user-' + Date.now(),
      name:         name,
      role:         role,
      passwordHash: passwordHash,
    };
    setUser(user);
    document.getElementById('esign-setup-overlay').classList.remove('open');

    // Update sidebar avatar/name if present
    _updateSidebarUser(user);

    if (typeof _setupPending === 'function') {
      const cb = _setupPending; _setupPending = null; cb();
    }
  }

  function _updateSidebarUser(user) {
    const avatarEl = document.querySelector('.sidebar-avatar');
    const nameEl   = document.querySelector('.sidebar-user-name');
    const roleEl   = document.querySelector('.sidebar-user-role');
    if (avatarEl) {
      const parts = user.name.split(' ');
      avatarEl.textContent = (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
    }
    if (nameEl) nameEl.textContent = user.name;
    if (roleEl) roleEl.textContent = user.role;
  }

  // ── Audit log viewer ──────────────────────────────────────────────────────
  function openAuditLog() {
    injectStyles();
    ensureAuditModalDOM();
    const log = getLog().slice().reverse();
    const countEl = document.getElementById('esign-audit-count');
    const bodyEl  = document.getElementById('esign-audit-body');
    if (countEl) countEl.textContent = '(' + log.length + ' entries)';
    if (!log.length) {
      bodyEl.innerHTML = '<div class="esign-audit-empty">No signatures have been recorded yet.</div>';
    } else {
      bodyEl.innerHTML = log.map(function (e) {
        const ts = e.timestamp ? new Date(e.timestamp).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
        return `<div class="esign-audit-entry">
          <div class="esign-audit-entry-top">
            <span class="esign-audit-rec-badge">${_esc(e.recordType || '')} · ${_esc(e.recordId || '')}</span>
            <span class="esign-audit-signer">${_esc(e.signerName || '—')}</span>
            <span class="esign-audit-role">${_esc(e.signerRole || '')}</span>
            <span class="esign-audit-ts">${ts}</span>
          </div>
          <div class="esign-audit-meaning">"${_esc(e.meaning || '')}"</div>
          <div class="esign-audit-hash">${_esc(e.contentHash || '')}</div>
        </div>`;
      }).join('');
    }
    document.getElementById('esign-audit-overlay').classList.add('open');
  }

  function _closeAudit() {
    const overlay = document.getElementById('esign-audit-overlay');
    if (overlay) overlay.classList.remove('open');
  }

  // ── Utilities ─────────────────────────────────────────────────────────────
  function _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Public surface ────────────────────────────────────────────────────────
  return {
    open:             open,
    getCurrentUser:   getUser,
    setupUserProfile: setupUserProfile,
    hasUserProfile:   function () { return !!getUser(); },
    getAuditLog:      getLog,
    openAuditLog:     openAuditLog,

    // Internal methods exposed for inline event handlers (onclick="ESign._...")
    _cancelSign:          _cancelSign,
    _submitSign:          _submitSign,
    _togglePwVisibility:  _togglePwVisibility,
    _submitSetup:         _submitSetup,
    _closeAudit:          _closeAudit,
  };

})();
