/* ai-assist.js — Shared AI field generation for Tangram eQMS
 * API:
 *   AIAssist.ctx()                     — raw qms_context object
 *   AIAssist.ctxLines()                — formatted context string for prompts
 *   AIAssist.generate(id, prompt, opts)— call /api/anthropic and write result to #id
 *   AIAssist.register(id, fn)          — register a lazy prompt builder (called at click time)
 *   AIAssist.click(id)                 — onclick handler that calls the registered builder
 *   AIAssist.genBtn(id, expr, tokens)  — returns button HTML string (for JS-rendered forms)
 *   AIAssist.refreshButtons(container) — injects buttons for [data-ai] elements (static forms)
 */
var AIAssist = (function () {
  'use strict';

  var STAR_HTML = '&#10022; Generate';
  var SPIN_HTML = '<span style="display:inline-block;animation:ai-spin 0.8s linear infinite">&#8635;</span> Generating…';

  // ── Context helpers ────────────────────────────────────────────────────────

  function ctx() {
    try { return JSON.parse(localStorage.getItem('qms_context') || '{}'); } catch (e) { return {}; }
  }

  function ctxLines() {
    var c = ctx();
    var co   = c.companyName || 'the company';
    var dev  = c.deviceName  || 'the medical device';
    var cls  = { i: 'Class I', ii: 'Class II', iii: 'Class III', ivd: 'IVD' }[c.deviceClass] || 'Class II';
    var type = { hardware: 'hardware', samd: 'software (SaMD)', combination: 'hardware/software combination', ivd: 'IVD' }[c.deviceType] || 'hardware';
    var mkt  = (c.regulatoryMarkets || ['us']).map(function (m) {
      return ({ us: 'US FDA', eu: 'EU MDR', canada: 'Health Canada', apac: 'APAC' })[m] || m;
    }).join(', ');
    var size = ({ startup: 'a startup (<20 people)', small: 'a small company (20–100 people)', medium: 'a mid-size company (100–500 people)', large: 'a large company (500+ people)' })[c.companySize] || 'a company';
    var stage = ({ building: 'building its QMS for the first time', 'pre-sub': 'preparing for first regulatory submission', cleared: 'maintaining a cleared/approved device', 'post-market': 'in active post-market surveillance' })[c.companyStage] || 'building its QMS';
    var reg  = c.regulatoryBasis || 'ISO 13485:2016; 21 CFR Part 820';
    var acts = (c.scopeActivities || []).join(', ') || 'design and manufacturing';
    var lines = [
      'Company: ' + co + ' (' + size + ', ' + stage + ')',
      'Device: ' + dev + ' (' + cls + ' ' + type + ')',
    ];
    if (c.intendedUse)       lines.push('Intended use: ' + c.intendedUse);
    if (c.patientPopulation) lines.push('Patient population: ' + c.patientPopulation);
    lines.push('Markets: ' + mkt);
    lines.push('QMS activities in scope: ' + acts);
    lines.push('Regulatory basis: ' + reg);
    return lines.join('\n');
  }

  // ── Core generate ──────────────────────────────────────────────────────────

  async function generate(fieldId, prompt, opts) {
    opts = opts || {};
    var btn = document.getElementById('aibtn-' + fieldId);
    var el  = document.getElementById(fieldId);
    if (!el) return;
    if (btn) { btn.disabled = true; btn.innerHTML = SPIN_HTML; }
    try {
      var resp = await fetch('/api/anthropic', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: opts.maxTokens || 500,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (!resp.ok) {
        var err = await resp.json().catch(function () { return {}; });
        throw new Error((err.error && err.error.message) || 'API error ' + resp.status);
      }
      var data = await resp.json();
      var text = (data.content && data.content[0] && data.content[0].text) || '';
      el.value = text.trim();
      el.dispatchEvent(new Event('input'));
    } catch (e) {
      alert('Generation failed: ' + e.message);
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = STAR_HTML; }
    }
  }

  // ── Registry ───────────────────────────────────────────────────────────────

  var _reg = {};
  function register(fieldId, fn) { _reg[fieldId] = fn; }
  function click(fieldId) { if (_reg[fieldId]) { generate(fieldId, _reg[fieldId]()); } }

  // ── Button HTML (for JS-rendered forms) ───────────────────────────────────

  function genBtn(fieldId, promptExpr, maxTokens) {
    var call = promptExpr
      ? 'AIAssist.generate(\'' + fieldId + '\',' + promptExpr + (maxTokens ? ',{maxTokens:' + maxTokens + '}' : '') + ')'
      : 'AIAssist.click(\'' + fieldId + '\')';
    return '<button class="btn-generate" id="aibtn-' + fieldId + '" onclick="' + call + '">' + STAR_HTML + '</button>';
  }

  // ── Auto-inject for [data-ai] elements (static HTML forms) ────────────────

  function refreshButtons(container) {
    var root = container || document;
    root.querySelectorAll('[data-ai]').forEach(function (el) {
      if (!el.id || document.getElementById('aibtn-' + el.id)) return;
      var field = el.closest('.form-field');
      if (!field) return;
      var label = field.querySelector('label');
      if (!label) return;
      // Wrap label in .field-label-row if needed
      if (!label.parentElement.classList.contains('field-label-row')) {
        var row = document.createElement('div');
        row.className = 'field-label-row';
        label.parentNode.insertBefore(row, label);
        row.appendChild(label);
      }
      var btn = document.createElement('button');
      btn.className = 'btn-generate';
      btn.id = 'aibtn-' + el.id;
      btn.innerHTML = STAR_HTML;
      btn.addEventListener('click', function () { click(el.id); });
      label.parentElement.appendChild(btn);
    });
  }

  document.addEventListener('DOMContentLoaded', function () { refreshButtons(); });

  return {
    ctx: ctx,
    ctxLines: ctxLines,
    generate: generate,
    genBtn: genBtn,
    register: register,
    click: click,
    refreshButtons: refreshButtons,
  };
})();
