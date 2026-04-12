// Tangram eQMS — shared export utility
// Provides PDF (print) and Word (.doc) export for Quality System pages.

(function(win) {

  function getSettings() {
    try { return JSON.parse(localStorage.getItem('qms_settings') || '{}'); } catch(e) { return {}; }
  }

  function getCompanyName() {
    try {
      const ctx = JSON.parse(localStorage.getItem('qms_context') || '{}');
      if (ctx.companyName) return ctx.companyName;
    } catch(e) {}
    return getSettings().companyName || '';
  }

  function getCompanyLogo() {
    return getSettings().logoDataUrl || null;
  }

  // Build a complete HTML document string suitable for PDF print or Word download.
  // opts: { title, subtitle, company, meta: [{label,value}], sections: [{heading, content}] }
  function buildDocumentHTML(opts) {
    var company  = opts.company || getCompanyName();
    var logo     = opts.logo    || getCompanyLogo();
    var title    = opts.title   || 'Document';
    var date     = new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });

    var headerLogo = logo
      ? '<img src="' + logo + '" style="height:38px;max-width:140px;object-fit:contain;" alt="' + _esc(company) + '">'
      : '<span style="font-size:15pt;font-weight:800;color:#0B273F;letter-spacing:-0.02em;">' + _esc(company) + '</span>';

    var metaRows = (opts.meta || []).map(function(m) {
      return '<tr><td style="font-weight:700;color:#5a7a90;padding:0.25rem 1.5rem 0.25rem 0;white-space:nowrap;font-size:9.5pt;">' +
        _esc(m.label) + '</td><td style="padding:0.25rem 0;font-size:9.5pt;">' + (m.value || '—') + '</td></tr>';
    }).join('');

    var sectionHTML = (opts.sections || []).map(function(s, i) {
      return '<h2 style="font-size:13pt;font-weight:800;color:#0B273F;margin:2rem 0 0.6rem;padding-top:1.5rem;' +
        (i > 0 ? 'border-top:1.5px solid #e8edf2;' : '') + '">' + _esc(s.heading) + '</h2>' + (s.content || '');
    }).join('');

    return '<!DOCTYPE html>\n' +
      '<html xmlns:o="urn:schemas-microsoft-com:office:office" ' +
            'xmlns:w="urn:schemas-microsoft-com:office:word" ' +
            'xmlns="http://www.w3.org/TR/REC-html40">\n' +
      '<head><meta charset="utf-8"><title>' + _esc(title) + '</title>\n' +
      '<style>\n' +
      '  body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #0B273F; margin: 0; padding: 0; }\n' +
      '  .page { max-width: 750px; margin: 0 auto; padding: 2cm 2.2cm; }\n' +
      '  h1 { font-size: 20pt; font-weight: 800; color: #0B273F; letter-spacing: -0.02em; margin: 1.5rem 0 0.4rem; }\n' +
      '  p, pre { font-size: 10.5pt; line-height: 1.75; margin: 0.4rem 0; }\n' +
      '  pre { white-space: pre-wrap; font-family: Calibri, Arial, sans-serif; }\n' +
      '  table.data { width: 100%; border-collapse: collapse; margin: 0.75rem 0; font-size: 9.5pt; }\n' +
      '  table.data th { background: #f0f4f7; font-weight: 700; text-align: left; padding: 0.45rem 0.7rem; border: 1px solid #cdd8e0; }\n' +
      '  table.data td { padding: 0.4rem 0.7rem; border: 1px solid #cdd8e0; vertical-align: top; }\n' +
      '  .field-label { font-size: 8.5pt; font-weight: 700; color: #5a7a90; text-transform: uppercase; letter-spacing: 0.06em; margin: 1rem 0 0.2rem; }\n' +
      '  @media print { @page { margin: 1.8cm 2cm; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }\n' +
      '</style></head>\n' +
      '<body><div class="page">\n' +

      // Header
      '<div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:1rem;border-bottom:2.5px solid #0AC0E9;margin-bottom:1.75rem;">' +
        headerLogo +
        '<div style="text-align:right;">' +
          '<div style="font-size:9.5pt;font-weight:600;color:#5a7a90;">' + _esc(company) + '</div>' +
          '<div style="font-size:8.5pt;color:#9ab0bf;">Tangram eQMS</div>' +
        '</div>' +
      '</div>' +

      '<h1>' + _esc(title) + '</h1>' +
      (opts.subtitle ? '<div style="font-size:10pt;color:#5a7a90;line-height:1.5;margin-bottom:1rem;">' + _esc(opts.subtitle) + '</div>' : '') +

      (metaRows ? '<table style="border-collapse:collapse;margin-bottom:1.5rem;">' + metaRows + '</table>' : '') +

      sectionHTML +

      '<div style="margin-top:3rem;padding-top:0.9rem;border-top:1px solid #e8edf2;display:flex;justify-content:space-between;font-size:9pt;color:#9ab0bf;">' +
        '<span>' + _esc(company) + ' · ' + _esc(title) + '</span>' +
        '<span>Generated ' + date + '</span>' +
      '</div>' +

      '</div></body></html>';
  }

  function exportAsPDF(filename, htmlContent) {
    var w = window.open('', '_blank');
    if (!w) { alert('Please allow pop-ups to export as PDF, then try again.'); return; }
    w.document.write(htmlContent);
    w.document.close();
    w.focus();
    setTimeout(function() { w.print(); }, 600);
  }

  function exportAsWord(filename, htmlContent) {
    var blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href     = url;
    a.download = (filename || 'document') + '.doc';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function() { URL.revokeObjectURL(url); }, 1500);
  }

  // Inject dropdown styles once
  function _injectStyles() {
    if (document.getElementById('tgx-export-styles')) return;
    var s = document.createElement('style');
    s.id = 'tgx-export-styles';
    s.textContent = [
      '.tgx-export-wrap { position: relative; }',
      '.tgx-export-dd {',
      '  display: none; position: absolute; right: 0; top: calc(100% + 5px);',
      '  background: white; border: 1px solid rgba(11,39,64,0.1); border-radius: 10px;',
      '  box-shadow: 0 8px 28px rgba(11,39,64,0.13), 0 2px 6px rgba(11,39,64,0.06);',
      '  min-width: 170px; z-index: 2000; overflow: hidden;',
      '}',
      '.tgx-export-dd.open { display: block; }',
      '.tgx-export-dd-item {',
      '  display: flex; align-items: center; gap: 0.55rem; width: 100%;',
      '  padding: 0.62rem 0.9rem; background: none; border: none;',
      '  font-family: "Inter", sans-serif; font-size: 0.77rem; font-weight: 600;',
      '  color: rgba(11,39,64,0.7); cursor: pointer; text-align: left;',
      '  transition: background 0.12s, color 0.12s;',
      '}',
      '.tgx-export-dd-item:hover { background: rgba(11,39,64,0.04); color: #0B273F; }',
      '.tgx-export-dd-item svg { width: 13px; height: 13px; stroke: currentColor; fill: none;',
      '  stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; flex-shrink: 0; }',
      '.tgx-export-dd-sep { height: 1px; background: rgba(11,39,64,0.07); margin: 3px 0; }',
    ].join('\n');
    document.head.appendChild(s);
  }

  function toggleDropdown(ddId) {
    _injectStyles();
    var dd = document.getElementById(ddId);
    if (!dd) return;
    var wasOpen = dd.classList.contains('open');
    document.querySelectorAll('.tgx-export-dd.open').forEach(function(el) { el.classList.remove('open'); });
    if (!wasOpen) {
      dd.classList.add('open');
      setTimeout(function() {
        function outsideClick(e) {
          if (!dd.contains(e.target) && !e.target.closest('.tgx-export-wrap')) {
            dd.classList.remove('open');
            document.removeEventListener('click', outsideClick);
          }
        }
        document.addEventListener('click', outsideClick);
      }, 0);
    }
  }

  // Returns the HTML string for an export button + dropdown.
  // triggerClass: CSS class(es) to apply to the trigger button (e.g. 'btn-outline')
  // ddId: unique ID for the dropdown element
  // onPDF / onWord: JS expression strings called on click
  function exportButtonHTML(triggerClass, ddId, onPDF, onWord) {
    _injectStyles();
    return '<div class="tgx-export-wrap">' +
      '<button class="' + triggerClass + '" onclick="TangramExport.toggleDropdown(\'' + ddId + '\')" type="button">' +
        '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>' +
        'Export' +
        '<svg viewBox="0 0 24 24" style="width:10px;height:10px;margin-left:2px;"><polyline points="6 9 12 15 18 9"/></svg>' +
      '</button>' +
      '<div class="tgx-export-dd" id="' + ddId + '">' +
        '<button class="tgx-export-dd-item" onclick="' + onPDF + ';TangramExport.toggleDropdown(\'' + ddId + '\')">' +
          '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' +
          'Export as PDF' +
        '</button>' +
        '<div class="tgx-export-dd-sep"></div>' +
        '<button class="tgx-export-dd-item" onclick="' + onWord + ';TangramExport.toggleDropdown(\'' + ddId + '\')">' +
          '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>' +
          'Export as Word' +
        '</button>' +
      '</div>' +
    '</div>';
  }

  function _esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  win.TangramExport = {
    buildDocumentHTML : buildDocumentHTML,
    exportAsPDF       : exportAsPDF,
    exportAsWord      : exportAsWord,
    toggleDropdown    : toggleDropdown,
    exportButtonHTML  : exportButtonHTML,
    getCompanyName    : getCompanyName,
    getCompanyLogo    : getCompanyLogo,
  };

})(window);
