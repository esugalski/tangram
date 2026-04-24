// filter-dropdown.js — shared filter dropdown for Tangram eQMS hub pages
// Usage on a button: onclick="openDropdown(event, this, 'filterKey', ['All X', 'Option A', 'Option B'])"
// Pages define: window.onFilterChange(key, value) — called when an option is selected.
// 'value' is always the raw option string. For the first (default) option, value === options[0].

(function () {
  var _panel = null;

  function _close() {
    if (_panel) { _panel.remove(); _panel = null; }
  }

  window.openDropdown = function (event, btn, key, options) {
    event.stopPropagation();

    // Capture the button's initial label text as the "default" label (reset target)
    if (btn._fdDefault === undefined) {
      var lbl = btn.querySelector('.filter-lbl');
      btn._fdDefault = lbl ? lbl.textContent.trim() : (options[0] || '');
    }

    // Toggle: clicking the same button again closes the panel
    if (_panel) {
      var same = _panel._btn === btn;
      _close();
      if (same) return;
    }

    var panel = document.createElement('div');
    panel._btn = btn;

    // Base panel styles
    panel.style.cssText = [
      'position:fixed',
      'z-index:9999',
      'background:#ffffff',
      'border:1.5px solid rgba(11,39,64,0.12)',
      'border-radius:9px',
      'box-shadow:0 8px 28px rgba(11,39,64,0.13),0 2px 6px rgba(11,39,64,0.07)',
      'min-width:172px',
      'padding:4px',
      'font-family:Inter,sans-serif',
      'overflow:hidden',
    ].join(';');

    // Determine which option is currently selected (by matching label text to options list)
    var lbl = btn.querySelector('.filter-lbl');
    var currentText = lbl ? lbl.textContent.trim() : '';
    var selectedOpt = options[0]; // default to first option
    if (currentText !== btn._fdDefault) {
      options.forEach(function (o) { if (o === currentText) selectedOpt = o; });
    }

    options.forEach(function (opt) {
      var isSelected = opt === selectedOpt && selectedOpt !== options[0];

      var row = document.createElement('div');
      row.style.cssText = [
        'display:flex',
        'align-items:center',
        'justify-content:space-between',
        'gap:0.5rem',
        'padding:0.42rem 0.75rem',
        'border-radius:6px',
        'font-size:0.78rem',
        'font-weight:' + (isSelected ? '600' : '400'),
        'color:' + (isSelected ? '#089bbf' : '#0B2740'),
        'cursor:pointer',
        'white-space:nowrap',
        'transition:background 0.1s',
        'user-select:none',
      ].join(';');

      var label = document.createElement('span');
      label.textContent = opt;
      row.appendChild(label);

      if (isSelected) {
        var check = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        check.setAttribute('viewBox', '0 0 24 24');
        check.style.cssText = 'width:12px;height:12px;stroke:#089bbf;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0;';
        var poly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        poly.setAttribute('points', '20 6 9 17 4 12');
        check.appendChild(poly);
        row.appendChild(check);
      }

      row.addEventListener('mouseenter', function () { row.style.background = 'rgba(10,192,233,0.07)'; });
      row.addEventListener('mouseleave', function () { row.style.background = ''; });

      row.addEventListener('click', function (e) {
        e.stopPropagation();
        _select(btn, key, opt, options);
        _close();
      });

      panel.appendChild(row);
    });

    document.body.appendChild(panel);
    _panel = panel;

    // Position: fixed, below the button. Adjust if it overflows the viewport.
    var r = btn.getBoundingClientRect();
    var panelH = panel.offsetHeight;
    var panelW = panel.offsetWidth;

    var top = r.bottom + 4;
    var left = r.left;

    // Flip upward if clipped at bottom
    if (top + panelH > window.innerHeight - 8) top = r.top - panelH - 4;
    // Shift left if clipped at right
    if (left + panelW > window.innerWidth - 8) left = Math.max(8, window.innerWidth - panelW - 8);

    panel.style.top = top + 'px';
    panel.style.left = left + 'px';
  };

  function _select(btn, key, value, options) {
    var isDefault = value === options[0];
    var lbl = btn.querySelector('.filter-lbl');
    if (lbl) lbl.textContent = isDefault ? btn._fdDefault : value;

    // Active / default button styling
    if (isDefault) {
      btn.style.borderColor = '';
      btn.style.color = '';
      btn.style.background = '';
    } else {
      btn.style.borderColor = 'rgba(10,192,233,0.5)';
      btn.style.color = '#089bbf';
      btn.style.background = 'rgba(10,192,233,0.04)';
    }

    if (typeof window.onFilterChange === 'function') {
      window.onFilterChange(key, value);
    }
  }

  // Close on outside click or Escape
  document.addEventListener('click', function (e) {
    if (_panel && !_panel.contains(e.target)) _close();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') _close();
  });
})();
