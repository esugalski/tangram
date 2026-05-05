# Tangram eQMS — Design System & Style Guide

Reference this file when building or modifying any eQMS page to maintain visual and interaction consistency.

---

## 1. Design Tokens (CSS Variables)

Declare these in `:root` on every page.

```css
:root {
  --primary:    #0B2740;   /* main text, headings, deep navy */
  --mid-blue:   #304F6B;   /* secondary text, ghost button labels */
  --dark-blue:  #02192F;   /* darkest surfaces */
  --sidebar-bg: #071e31;   /* sidebar background */
  --aqua:       #0AC0E9;   /* primary action color */
  --aqua-dark:  #089bbf;   /* aqua hover state */
  --gray:       #D2D2D2;   /* borders, dividers (rarely used directly) */
  --light-gray: #F7F8FA;   /* page background, input backgrounds */
  --white:      #FFFFFF;
  --sidebar-w:  232px;
  --green:      #10B981;   /* approved status */
  --amber:      #F59E0B;   /* under review / warning */
  --red:        #EF4444;   /* error / destructive */
  --indigo:     #6366f1;   /* accent (used in doc-cover gradient) */
}
```

---

## 2. Typography

**Font:** Inter (Google Fonts), weights 300–900.

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
```

### Scale

| Role | Size | Weight | Notes |
|------|------|--------|-------|
| Document title | `1.5rem` | 800 | `letter-spacing: -0.03em; line-height: 1.15` |
| Section heading | `0.88rem` | 700 | Table section title |
| Body / panel text | `0.88rem` | 400 | `line-height: 1.6` |
| Table cell | `0.8rem` | 400 | `color: var(--primary)` |
| Button label | `0.78rem` | 600–700 | |
| Status badge | `0.6rem` | 700 | `letter-spacing: 0.05em; text-transform: uppercase` |
| Column header | `0.67rem` | 700 | `letter-spacing: 0.08em; text-transform: uppercase; color: rgba(11,39,64,0.38)` |
| Field label | `0.65rem` | 700 | `letter-spacing: 0.08–0.1em; text-transform: uppercase; color: rgba(11,39,64,0.38)` |
| Company / section label | `0.65rem` | 700 | `letter-spacing: 0.12em; text-transform: uppercase; color: rgba(11,39,64,0.35)` |
| Small metadata | `0.7rem` | 400 | `color: rgba(11,39,64,0.4)` |

---

## 3. Color Usage Conventions

- **Backgrounds:** Page = `var(--light-gray)`. Cards/panels = white. Sidebar = `var(--sidebar-bg)`.
- **Borders:** Cards use `1px solid rgba(11,39,64,0.08)`. Dividers use `rgba(11,39,64,0.06–0.08)`.
- **Input backgrounds (resting):** `var(--light-gray)` with border `rgba(11,39,64,0.1)`.
- **Input backgrounds (focused):** White with border `var(--aqua)`.
- **Hover tints:** Aqua interactions use `rgba(10,192,233,0.04–0.08)`. Navy hover uses `rgba(11,39,64,0.02–0.06)`.
- **Status colors:**
  - Approved: `#059669` (text), `rgba(16,185,129,0.1)` (bg)
  - Under Review: `#b45309` (text), `rgba(245,158,11,0.12)` (bg)
  - Draft: `rgba(11,39,64,0.45)` (text), `rgba(11,39,64,0.07)` (bg)

---

## 4. Layout Structure

Every page uses the same shell, fully managed by `shell.js`. Pages own only their page-specific content.

```
y=0  ┌────────────┬──────────────────────────────────────────────────────────┐
     │ SIDEBAR    │ [🔍 Search…]  ·····  [FM  Founding Member]               │ ← TOPBAR (58px, white)
y=58 │ (220px,    ├──────────────────────────────────────────────────────────┤
     │  dark      │ ████  Design Controls  ████████████████████████████████  │ ← MODULE HEADER (46px, navy)
     │  navy)     ├─────────────────────────────────────┬────────────────────┤  every page
y=104│            │ Overview  Dev Plan  User Needs  …   │ AT A GLANCE (280px)│ ← SUB-NAV (40px, white)
     │            ├─────────────────────────────────────│                    │
     │            │ .page-scroll (content area)         │  panel body        │
     │            │ margin-right: 280px when open       │                    │
     └────────────┴─────────────────────────────────────┴────────────────────┘
```

### HTML root anchors (required on every shell page)

```html
<body>
  <aside class="sidebar" id="sidebar-root"></aside>
  <div class="main">
    <div id="topbar-root"></div>
    <div id="module-header-root"></div>
    <nav id="subnav-root"></nav>
    <div class="page-scroll">
      <!-- page-specific content only -->
    </div>
  </div>
  <div id="glance-root"></div>
</body>
```

### Shell init (bottom of `<body>`, after sidebar.js + shell.js)

```javascript
// Hub / overview page:
initShell({
  activePage: 'design-controls',
  topbar: { searchPlaceholder: 'Search documents…' },
  moduleHeader: 'Design Controls',
  subNav: { module: 'design-controls', activeHref: 'design-controls-overview.html' }
});

// Detail / form page (wide-format pages default glance to closed):
initShell({
  activePage: 'risk-analysis',
  topbar: { searchPlaceholder: 'Search hazards…' },
  moduleHeader: 'Risk Management',
  subNav: { module: 'risk-management', activeHref: 'risk-analysis.html' },
  glancePanel: { defaultOpen: false }
});
```

`glancePanel` can be omitted entirely — it defaults to `{ defaultOpen: true }`. Only pass it to override the default.

### CSS
```css
body { display: flex; height: 100vh; overflow: hidden; background: var(--light-gray); }
.sidebar { width: 220px; background: var(--sidebar-bg); flex-shrink: 0; }
.main { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
.page-scroll { flex: 1; overflow-y: auto; }
```

---

## 5. Topbar

The topbar is a **global element** injected by `shell.js`. Pages do not render it directly.

### Structure
```
[ 🔍 Search input (flex: 1, max 420px) ]   ·····   [ FM  Founding Member / Early Access ]
```

Two fixed zones only: search (left-aligned) and user profile (right-aligned). No title, no project selector, no action buttons.

### Config
```javascript
topbar: { searchPlaceholder: 'Search documents…' }
// or simply: topbar: true  (uses default "Search…" placeholder)
```

### Key CSS classes (in qms-shared.css)
```css
.topbar              /* 58px white bar, flex row */
.topbar-search-wrap  /* search input container, max-width 420px */
.topbar-spacer       /* flex: 1 gap between search and user profile */
.topbar-user         /* flex row: avatar + name/role */
.topbar-user-avatar  /* 28px circle, aqua tint, FM monogram */
.topbar-user-name    /* 0.75rem, 600, --primary */
.topbar-user-role    /* 0.6rem, 500, muted */
```

### Revision / Status Badges (document pages only)
Used in document page headers (not the topbar). Kept here for reference:
```css
.ver-badge  { font-size: 0.68rem; font-weight: 700; background: rgba(11,39,64,0.07); border: 1px solid rgba(11,39,64,0.12); color: var(--mid-blue); padding: 0.2rem 0.6rem; border-radius: 5px; }
.status-pill.draft    { background: rgba(10,192,233,0.1); color: var(--aqua-dark); }
.status-pill.review   { background: rgba(245,158,11,0.12); color: #b45309; }
.status-pill.approved { background: rgba(16,185,129,0.12); color: #059669; }
```

---

## 6. Module Header Band

A full-width dark navy bar positioned immediately below the topbar on every shell page. It displays the module or section name in white, providing a clear visual anchor between the topbar and the content below it.

```
┌─────────────────────────────────────────────────┐
│  TOPBAR (white, 58 px)                          │
├─────────────────────────────────────────────────┤
│  MODULE HEADER (navy, 46 px)  "Design Controls" │  ← this element
├─────────────────────────────────────────────────┤
│  SUB-NAV (white, 40 px)                         │
├─────────────────────────────────────────────────┤
│  CONTENT AREA                                   │
└─────────────────────────────────────────────────┘
```

### HTML

```html
<div class="module-header">
  <span class="module-header-title">Module Name</span>
</div>
```

Shell.js injects this from `config.moduleHeader`. Pass the module or section name as a string.

### CSS

```css
.module-header {
  background: var(--primary);   /* #0B2740 deep navy */
  height: 46px;
  display: flex;
  align-items: center;
  padding: 0 1.5rem;
  flex-shrink: 0;
}
.module-header-title {
  font-size: 0.84rem;
  font-weight: 700;
  color: white;
  letter-spacing: -0.01em;
}
```

### Rules

- **Required on every shell page** — always pass `moduleHeader` in `initShell()`
- The module title must exactly match the sidebar nav label for that module (or the page title for cross-module pages like "My Work", "Document Library")
- No icons, badges, or actions inside the band — title only
- Never change the background color — it must always be `var(--primary)` to maintain the navy-to-white contrast rhythm with the sub-nav below it

---

## 7. Buttons

Four button variants used across the app. Never invent new button shapes — use one of these.

### Primary (Aqua Fill) — main action
```css
.btn-tbl-add, .btn-save, .btn-save-draft {
  display: inline-flex; align-items: center; gap: 0.4rem;
  background: var(--aqua); color: var(--primary);
  font-weight: 700; font-size: 0.75–0.78rem;
  padding: 0.42–0.55rem 0.85–1.25rem; border-radius: 7px; border: none;
  cursor: pointer; transition: background 0.15s;
  box-shadow: 0 2px 6px rgba(10,192,233,0.22);
}
/* hover */ background: var(--aqua-dark);
```

### Ghost (Outline) — secondary actions (Export, Guidance, AI Assist)
```css
.btn-export, .btn-guidance, .btn-tbl-ai {
  display: inline-flex; align-items: center; gap: 0.4rem;
  background: transparent; color: var(--mid-blue);
  font-weight: 600; font-size: 0.78rem;
  padding: 0.5rem 1rem; border-radius: 7px;
  border: 1.5px solid rgba(11,39,64,0.18); cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}
/* hover */ border-color: var(--aqua); color: var(--aqua-dark); background: rgba(10,192,233,0.04);
```

### Approve (Outline, Green Tint)
Same shape as Ghost but with green border/color:
```css
border-color: rgba(16,185,129,0.3); color: #047857;
/* hover */ border-color: #059669; background: rgba(16,185,129,0.04);
```

### Text/Inline — tertiary (Discard, Cancel, Edit)
```css
/* Edit button in table */
.btn-edit { font-size: 0.72rem; font-weight: 600; color: var(--aqua-dark); background: rgba(10,192,233,0.07); border: none; border-radius: 5px; padding: 0.28rem 0.65rem; }
/* Discard */
.btn-discard { color: rgba(11,39,64,0.4); background: none; border: none; }
.btn-discard:hover { color: var(--red); }
```

### Button SVG Icons
All button icons: `width: 12–14px; stroke: currentColor; fill: none; stroke-width: 2–2.5; stroke-linecap: round; stroke-linejoin: round`.

---

## 8. Document Page Card

The unified white card that wraps doc-cover metadata + table header + requirements table into one continuous surface.

```
┌──────────────────────────────────────────────┐
│▌▌▌ 4px gradient bar (aqua → indigo)          │  ← ::before pseudo
│  Company label · Doc title · Subtitle        │  ← doc-cover content
│  Metadata fields (grid)                      │
│──────────────────────────────────────────────│  ← border-bottom 0.08
│  Section title            [AI] [+ Add Item]  │  ← req-section-head
│──────────────────────────────────────────────│  ← border-bottom 0.06
│  ID  Statement  ...  Status                  │  ← table header
│  row · row · row                             │  ← table body
└──────────────────────────────────────────────┘
```

```css
.doc-page-card { background: white; border: 1px solid rgba(11,39,64,0.08); border-radius: 14px; overflow: hidden; margin-bottom: 1.5rem; }
.doc-page-card .doc-cover { background: transparent; border: none; border-radius: 0; margin-bottom: 0; border-bottom: 1px solid rgba(11,39,64,0.08); }
.doc-page-card .req-section-head { padding: 0.85rem 1.25rem; border-bottom: 1px solid rgba(11,39,64,0.06); margin-bottom: 0; }
.doc-page-card .list-table-wrap { border-radius: 0; border: none; }

/* Top color bar */
.doc-cover::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, var(--aqua), #6366f1); }
```

### Doc Cover Fields
```css
.doc-cover { padding: 2rem 2.25rem; position: relative; overflow: hidden; }
.doc-name { font-size: 1.5rem; font-weight: 800; letter-spacing: -0.03em; line-height: 1.15; }
.doc-subtitle { font-size: 0.82rem; color: rgba(11,39,64,0.5); line-height: 1.5; max-width: 480px; }
.doc-cover-fields { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; } /* use .cols-2 or .cols-1 as needed */
.doc-field-label { font-size: 0.6rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(11,39,64,0.3); }
.doc-field-input, .doc-field-textarea, .doc-field-select {
  font-size: 0.82rem; border: 1px solid rgba(11,39,64,0.1); border-radius: 7px;
  padding: 0.4rem 0.65rem; background: var(--light-gray); transition: border-color 0.15s;
}
/* focused */ border-color: var(--aqua); background: white;
```

---

## 9. Page Accent Band

A 4 px full-width gradient stripe used **only on document pages** (pages with `.doc-cover`). Do not add this element to hub/overview pages — those pages use the Module Header Band (§6) instead, and the accent band creates unwanted visual noise between the sub-nav and content.

### On document pages (pages with `.doc-cover`)

The band is implemented as a `::before` pseudo-element on `.doc-cover` — do **not** add a separate `.page-accent-band` div to those pages:

```css
.doc-cover::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--aqua), #6366f1);
}
```

### Gradient stops

| Stop | Value | Role |
|------|-------|------|
| Left (0%) | `var(--aqua)` = `#0AC0E9` | Primary action color |
| Right (100%) | `#6366f1` | Indigo accent |

Never change the direction or swap the stops — consistent directionality reinforces the platform's left-to-right reading flow.

---

## 10. Requirements Table

```css
.list-table-wrap { background: white; border: 1px solid rgba(11,39,64,0.08); border-radius: 12px; overflow: hidden; }
.list-table thead th { padding: 0.7rem 1rem; font-size: 0.67rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(11,39,64,0.38); background: #FAFBFC; border-bottom: 1px solid rgba(11,39,64,0.08); }
.list-table tbody tr { border-bottom: 1px solid rgba(11,39,64,0.06); cursor: pointer; transition: background 0.1s; }
.list-table tbody tr:hover { background: rgba(10,192,233,0.03); }
.list-table td { padding: 0.9rem 1rem; font-size: 0.8rem; vertical-align: middle; }
```

### Status Row Stripe (left border on first `td`)
```css
.row-approved td:first-child { border-left: 3px solid var(--green); }
.row-review   td:first-child { border-left: 3px solid var(--amber); }
.row-draft    td:first-child { border-left: 3px solid rgba(11,39,64,0.18); }
.row-tentative td:first-child { border-left: 3px dashed rgba(11,39,64,0.18); }
```

### In-table Components
```css
/* ID pill */
.id-pill { font-size: 0.66rem; font-weight: 700; letter-spacing: 0.05em; color: rgba(11,39,64,0.45); background: rgba(11,39,64,0.06); padding: 0.15rem 0.5rem; border-radius: 4px; }

/* Status badge */
.status-badge { font-size: 0.6rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; padding: 0.12rem 0.45rem; border-radius: 4px; }
.status-badge.approved { background: rgba(16,185,129,0.1); color: #047857; }
.status-badge.review   { background: rgba(245,158,11,0.12); color: #b45309; }
.status-badge.draft    { background: rgba(11,39,64,0.07); color: rgba(11,39,64,0.45); }

/* Count badge (circular) */
.count-badge { width: 20px; height: 20px; border-radius: 50%; font-size: 0.65rem; font-weight: 700; background: rgba(11,39,64,0.07); color: rgba(11,39,64,0.5); }

/* Edit button */
.btn-edit { font-size: 0.72rem; font-weight: 600; color: var(--aqua-dark); background: rgba(10,192,233,0.07); border: none; border-radius: 5px; padding: 0.28rem 0.65rem; }
```

---

## 11. Slide-in Panels (420px)

All panels share the same overlay + slide-in infrastructure. Never create a full-page modal for detail views — use a panel.

### Overlay Shell
```css
.panel-overlay { position: fixed; inset: 0; z-index: 200; pointer-events: none; }
.panel-overlay.open { pointer-events: auto; }
.panel-backdrop { position: absolute; inset: 0; background: rgba(11,39,64,0.15); opacity: 0; transition: opacity 0.25s; }
.panel-overlay.open .panel-backdrop { opacity: 1; }
```

### Panel Container (reuse for detail, AI, help panels)
```css
.detail-panel, .ai-panel, .help-panel {
  position: absolute; top: 0; right: 0; bottom: 0; width: 420px;
  background: white; box-shadow: -8px 0 32px rgba(11,39,64,0.12);
  display: flex; flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}
/* open state — add a class to the overlay, not the panel directly */
.panel-overlay.open .detail-panel { transform: translateX(0); }
.panel-overlay.help-open .help-panel { transform: translateX(0); }
```

### Panel Header
```css
.panel-head { padding: 1.2rem 1.25rem 1rem; border-bottom: 1px solid rgba(11,39,64,0.08); flex-shrink: 0; }
.panel-type-badge { font-size: 0.6rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; padding: 0.2rem 0.6rem; border-radius: 4px; }
.panel-id { font-size: 0.95rem; font-weight: 800; letter-spacing: -0.01em; }
.panel-close { width: 28px; height: 28px; border-radius: 6px; background: rgba(11,39,64,0.06); display: flex; align-items: center; justify-content: center; }
.panel-close:hover { background: rgba(11,39,64,0.12); }
```

### Panel Body / Fields
```css
.panel-body { flex: 1; overflow-y: auto; padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; }
.panel-field-label { font-size: 0.65rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(11,39,64,0.38); }
.panel-field-value { font-size: 0.88rem; line-height: 1.6; padding: 0.5rem 0.7rem; border-radius: 6px; border: 1.5px solid transparent; background: rgba(11,39,64,0.03); transition: border-color 0.15s, background 0.15s; }
.panel-field-value:focus { border-color: var(--aqua); background: white; outline: none; }
```

### Panel Footer (dirty state)
The footer is hidden by default; shown with `.dirty` when unsaved changes exist.
```css
.panel-footer { padding: 1rem 1.25rem; border-top: 1px solid rgba(11,39,64,0.08); display: none; gap: 0.75rem; align-items: center; }
.panel-footer.dirty { display: flex; }
```

---

## 12. Sidebar

The sidebar is a **global element** injected by `shell.js` (which delegates to `sidebar.js` internally). Do not call `initSidebar()` directly on shell-enabled pages — `initShell()` handles it. Do not hardcode sidebar HTML.

### Visual conventions
- Background: `var(--sidebar-bg)` (#071e31)
- Active item: `background: rgba(10,192,233,0.14); color: #0AC0E9`, `font-weight: 600`
- Inactive item: `color: rgba(255,255,255,0.62)`, hover `rgba(255,255,255,0.07)` tint
- Nav icons: `16×16px`, stroke-only, `stroke-width: 2`
- Footer: "Sign out" link only — user profile (avatar, name, role) lives in the **topbar**, not the sidebar

---

## 13. At a Glance Panel

A **global shell element**, always present on every shell-enabled page. Injected by `shell.js` into `#glance-root`. Pages never render the panel chrome themselves.

### Behavior
- Default state: **open** (`defaultOpen: true` is implicit — omit `glancePanel` from `initShell()` config entirely)
- Wide-format pages (tables, matrices): pass `glancePanel: { defaultOpen: false }` — panel starts collapsed as a right-edge pull-tab
- State always resets to the page's configured default on load (no localStorage persistence)
- Panel top: `58px` (topbar-only pages) or `104px` (pages with module header band) — set dynamically by `shell.js`

### Panel top positioning by page type

| Page type | `moduleHeader` | Panel top |
|-----------|---------------|-----------|
| Hub / overview | present | 104px |
| Detail / form | absent | 58px |

### Content

`shell.js` injects the panel **chrome** (header, close button, `#glance-body` container). Page JS is responsible for populating `#glance-body` with module-specific content after `initShell()` completes:

```javascript
initShell(config);
// Then populate content:
document.getElementById('glance-body').innerHTML = '...';
```

### CSS classes (in qms-shared.css)
```
.glance-panel       — 280px fixed right panel
.glance-panel.open  — slide-in state
.glance-panel-head  — sticky header with label + close button
.glance-panel-body  — scrollable content area (#glance-body target)
.glance-tab         — collapsed pull-tab on right viewport edge
```

### Widget content classes (lm-sw*)
Used inside `#glance-body` for summary stat layouts:
```
.lm-sw              — outer wrapper (padding, flex column)
.lm-sw-gauge-wrap   — centered big-number + subtitle
.lm-sw-big          — large stat number (1.6rem, 800)
.lm-sw-gauge-sub    — subtitle label below big number
.lm-sw-section      — grouped sub-section (border-top separator)
.lm-sw-section-title — section label (0.55rem, uppercase)
.lm-sw-stat-row     — key/value row
.lm-sw-bar-row / .lm-sw-bar-track / .lm-sw-bar-fill / .lm-sw-bar-val  — horizontal bar chart row
.lm-sw-ai           — AI Assist card (aqua tint bg, icon + text)
```

---

## 14. Shared JS Infrastructure

| File | Purpose |
|------|---------|
| `shell.js` | **Primary entry point.** Injects all global shell elements (sidebar, topbar, module header, sub-nav, At a Glance panel). Call `initShell(config)` — do not call `initSidebar()` directly on shell-enabled pages. |
| `sidebar.js` | Renders the left nav. Called internally by `shell.js`. Load before `shell.js`. |
| `seed-demo.js` | Populates demo data into `localStorage` on first load. |
| `approvals.js` | Approval workflow and e-signature logic. |
| `versions.js` | Document versioning / revision history. |
| `governance.js` | Change control and audit trail. |
| `esign.js` | Electronic signature modal. |

### Script load order (bottom of `<body>`)
```html
<script src="seed-demo.js?v=..."></script>
<script src="sidebar.js"></script>
<script src="shell.js"></script>
<script src="esign.js"></script>
<script src="versions.js"></script>
<script src="governance.js"></script>
<script src="approvals.js"></script>
<script>
  initShell({
    activePage: 'page-id',
    topbar: { searchPlaceholder: 'Search…' },
    moduleHeader: 'Module Name',          // required on every shell page
    subNav: { module: 'module-key', activeHref: 'current-page.html' }
  });
  // Populate At a Glance panel body after shell init:
  document.getElementById('glance-body').innerHTML = '...';
</script>
```

---

## 15. Interaction Conventions

| Pattern | Rule |
|---------|------|
| Transitions | `0.15s` for color/background/border. `0.25–0.28s cubic-bezier(0.4,0,0.2,1)` for panels. Never `transition: all`. |
| Hover lift | Only on primary CTA buttons: `transform: translateY(-1px)`. Not on ghost or text buttons. |
| Focus rings | Use `border-color: var(--aqua)` on inputs. No default browser outline (`outline: none` after setting border). |
| Panel open/close | Managed via CSS class on `#panelOverlay` (`open`, `help-open`). JS sets `transform` directly only when switching between panels (to avoid the transition firing on the outgoing panel). |
| Dirty state | Panel footer appears with `.dirty` class when unsaved edits exist. Save flash (`opacity: 1`) appears after save then fades. |
| Keyboard | `Escape` key closes all panels via `document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAllPanels(); })`. |
| Scrollbars | Hidden on sidebar nav, styled thin (4–5px) on panel bodies and content areas. |

---

## 16. Page-level Suppressions (Design Controls pages)

Add these to the `<style>` block on any Design Controls page to suppress guided-mode chrome that doesn't belong there:

```css
#lm-step-footer { display: none !important; }  /* guided-mode "done exploring" footer */
#lm-toggle-root { display: none !important; }  /* guided/power mode toggle */
#lm-step-banner { display: none !important; }  /* guided-mode step banner (dark band, injected between topbar and content) */
```

---

## 17. Guidance Panel Content Principle

**All page-level explanatory, educational, and regulatory context belongs in the Guidance panel — never inline on the page body.**

The Guidance button (topbar-right, ghost outline) opens a 420px slide-in panel that is the canonical home for:
- "What is this section?" explanations
- Regulatory context (which CFR/ISO clauses apply and why)
- Best practices and common pitfalls
- Video/tutorial placeholders
- Checklists for regulatory compliance

### What this replaces

| Old pattern | Correct pattern |
|-------------|-----------------|
| `.intro-panel` inline block | Guidance panel body |
| `#intro-slot` + `renderIntro()` / `LearnMode.introCard()` | Guidance panel body |
| `.learn-only` hardcoded explainer divs | Guidance panel body |
| Inline regulatory callouts | Guidance panel body |

### How to implement

Every page must have:
1. A `[ Guidance ]` button in topbar-right (ghost outline style — see Section 6)
2. A `#panelOverlay` + `#helpPanel` overlay structure (420px slide-in — see Section 9)
3. `openHelpPanel()` and `closeAllPanels()` JS functions
4. An Escape key listener: `document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAllPanels(); })`

### Guidance panel structure

```html
<div class="panel-overlay" id="panelOverlay">
  <div class="panel-backdrop" onclick="closeAllPanels()"></div>
  <div class="help-panel" id="helpPanel">
    <div class="panel-head">
      <div class="panel-head-row">
        <span class="panel-type-badge" style="background:rgba(10,192,233,0.1);color:#089bbf;">GUIDANCE</span>
        <span class="panel-id">Page Name</span>
        <button class="panel-close" onclick="closeAllPanels()"><!-- × svg --></button>
      </div>
    </div>
    <div class="panel-body">
      <!-- What it is / why it matters / regulatory context / checklist / video placeholder -->
      <!-- Video placeholder always at bottom: -->
      <div style="border:2px dashed rgba(11,39,64,0.12);border-radius:10px;background:rgba(11,39,64,0.025);aspect-ratio:16/9;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0.65rem;">
        <svg><!-- play icon --></svg>
        <span style="font-size:0.74rem;font-weight:500;color:rgba(11,39,64,0.28);">Video guide coming soon</span>
      </div>
    </div>
  </div>
</div>
```

### Suppressing legacy guided-mode content

Where `renderIntro()`, `LearnMode.introCard()`, or `.learn-only` elements exist in the page, suppress them with CSS:

```css
#intro-slot      { display: none !important; }
.learn-only      { display: none !important; }
```

Leave the JS functions in place (removing them risks errors if `learn-mode.js` still calls them). Suppress them visually and add equivalent content to the Guidance panel.

---

## 18. New Page Checklist

When creating a new eQMS tool page:

- [ ] Link `qms-shared.css` — do **not** copy `:root` variables inline (they live in the shared CSS)
- [ ] Add shell root anchors to `<body>`: `#sidebar-root`, `#topbar-root`, `#module-header-root`, `#subnav-root`, `.page-scroll`, `#glance-root` (see §4)
- [ ] Load `sidebar.js` then `shell.js` before page scripts
- [ ] Call `initShell({ activePage, topbar, moduleHeader?, subNav?, glancePanel? })` — do **not** call `initSidebar()` directly
- [ ] Always pass `moduleHeader` in `initShell()` — required on every shell page (see §6)
- [ ] Pass `glancePanel: { defaultOpen: false }` on wide-format pages (tables, matrices, multi-column layouts)
- [ ] Populate `#glance-body` after `initShell()` with module-specific summary widgets
- [ ] Add `btn-guidance` → opens `#helpPanel` with page-specific explanation (what it is, regulatory context, best practices, video placeholder)
- [ ] Guidance panel replaces any `#intro-slot`, `renderIntro()`, or `.learn-only` explainer elements — suppress those with CSS if present
- [ ] Wrap doc-cover + section-head + table in `.doc-page-card`
- [ ] Section head: title left, `[+ Add Item]` right (`.btn-tbl-add`)
- [ ] Table rows use `.row-approved / .row-review / .row-draft` for left border stripe
- [ ] Add page suppressions if `learn-mode.js` is present: `#lm-step-footer`, `#lm-toggle-root`, `#lm-step-banner { display: none !important }`

---

## 19. Index Page Type

An Index Page presents a collection of documents or records. It is the correct archetype for any page whose primary purpose is listing, filtering, and navigating a set of items — as opposed to editing a single document or displaying analytics.

**Reference implementation:** `index-page-demo.html` (demonstrates both variants with working filters, sorting, and At a Glance panel)

### Two variants

| Variant | Use when | Reference page |
|---------|----------|----------------|
| **Grouped Index** | Items have a meaningful hierarchical grouping (phases, modules, categories) and the group structure itself carries status | Design Controls Overview |
| **Table Index** | Items are a flat cross-cutting collection; grouping isn't meaningful or items span multiple modules | Document Library |

Both variants share the same filter bar, status badge system, At a Glance panel recipe, and shell config. They differ only in how rows are rendered.

---

### Shell config

Index pages default to the At a Glance panel **open** (omit `glancePanel` entirely):

```javascript
initShell({
  activePage: 'design-controls',
  topbar: { searchPlaceholder: 'Search documents…' },
  moduleHeader: 'Design Controls',
  subNav: { module: 'design-controls', activeHref: 'design-controls-overview.html' }
});
// Then populate #glance-body after init (see At a Glance recipe below)
```

Do **not** pass `glancePanel: { defaultOpen: false }` on Index pages — the summary panel is the primary companion view.

---

### Layout

Standard single-column `.page-scroll`. No scroll override needed:

```html
<div class="page-scroll">
  <div class="index-content">
    <!-- Filter bar (.filter-bar) -->
    <!-- Grouped variant: .phase-cards -->
    <!-- Table variant: .list-table-outer -->
  </div>
</div>
```

```css
.index-content {
  padding: 1.25rem 1.5rem;
  display: flex; flex-direction: column; gap: 1rem;
  max-width: 1100px;
}
```

---

### Filter Bar

The filter bar sits between the KPI row (if present) and the document list. Left: property dropdowns. Right: inline text search.

```css
.filter-bar { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap; }
.filter-bar-left { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.filter-bar-right { display: flex; align-items: center; }

.filter-dropdown-wrap { position: relative; }
.filter-dropdown {
  display: inline-flex; align-items: center; gap: 0.35rem;
  font-size: 0.75rem; font-weight: 600; color: var(--mid-blue);
  background: white; border: 1.5px solid rgba(11,39,64,0.14);
  border-radius: 7px; padding: 0.38rem 0.75rem; cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.filter-dropdown:hover, .filter-dropdown.has-value {
  border-color: var(--aqua); color: var(--aqua-dark);
}
.filter-dropdown.has-value { background: rgba(10,192,233,0.05); }
.filter-chevron { width: 11px; height: 11px; stroke: currentColor; fill: none; stroke-width: 2.5; transition: transform 0.15s; }
.filter-dropdown-wrap.open .filter-chevron { transform: rotate(180deg); }

.filter-dropdown-menu {
  position: absolute; top: calc(100% + 4px); left: 0; z-index: 50;
  background: white; border: 1px solid rgba(11,39,64,0.1);
  border-radius: 8px; padding: 0.35rem; min-width: 160px;
  box-shadow: 0 6px 20px rgba(11,39,64,0.1); display: none;
}
.filter-dropdown-wrap.open .filter-dropdown-menu { display: block; }

.filter-option {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.38rem 0.6rem; border-radius: 5px; cursor: pointer;
  font-size: 0.78rem; color: var(--primary); transition: background 0.1s;
}
.filter-option:hover { background: rgba(10,192,233,0.06); }
.filter-option.selected { background: rgba(10,192,233,0.08); color: var(--aqua-dark); font-weight: 600; }

.filter-search-inline {
  display: flex; align-items: center; gap: 0.4rem;
  background: white; border: 1.5px solid rgba(11,39,64,0.14);
  border-radius: 7px; padding: 0.38rem 0.75rem; transition: border-color 0.15s;
}
.filter-search-inline:focus-within { border-color: var(--aqua); }
.filter-search-icon { width: 13px; height: 13px; stroke: rgba(11,39,64,0.35); fill: none; stroke-width: 2; flex-shrink: 0; }
.filter-search-inline input {
  border: none; outline: none; background: transparent;
  font-size: 0.78rem; color: var(--primary); width: 180px;
}
.filter-search-inline input::placeholder { color: rgba(11,39,64,0.35); }
```

**Filter behavior:** All active filters apply simultaneously (AND logic). Text search matches title, ID, and owner. Grouped variant auto-expands phases with matches. Show a result count when fewer than total items are visible.

---

### Variant A — Grouped Index

Items are presented in collapsible phase/category cards. Each card shows the group name, a completion indicator, and the document rows within.

```css
.phase-card {
  background: white; border: 1px solid rgba(11,39,64,0.08);
  border-left: 3px solid rgba(11,39,64,0.18);
  border-radius: 12px; overflow: hidden;
}
.phase-card.phase-complete    { border-left-color: var(--green); }
.phase-card.phase-progress    { border-left-color: var(--amber); }
.phase-card.phase-not-started { border-left-color: rgba(11,39,64,0.18); }

.phase-hd {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.75rem 1rem; cursor: pointer; transition: background 0.1s;
}
.phase-hd:hover { background: rgba(11,39,64,0.02); }
.phase-hd-left { display: flex; align-items: center; gap: 0.6rem; }

.phase-chevron {
  width: 14px; height: 14px; stroke: rgba(11,39,64,0.4); fill: none;
  stroke-width: 2.5; transition: transform 0.18s;
}
.phase-card.collapsed .phase-chevron { transform: rotate(-90deg); }
.phase-card.collapsed .phase-body   { display: none; }

.phase-name  { font-size: 0.82rem; font-weight: 700; color: var(--primary); }
.phase-body  { border-top: 1px solid rgba(11,39,64,0.06); }

/* Phase status pill */
.phase-status-pill { font-size: 0.58rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 0.15rem 0.55rem; border-radius: 4px; }
.pill-complete    { background: rgba(16,185,129,0.1); color: #047857; }
.pill-progress    { background: rgba(245,158,11,0.12); color: #b45309; }
.pill-not-started { background: rgba(11,39,64,0.07); color: rgba(11,39,64,0.45); }

/* Document rows inside a phase */
.doc-row {
  display: grid; grid-template-columns: 1fr auto auto auto;
  align-items: center; gap: 1rem; padding: 0.65rem 1rem;
  border-bottom: 1px solid rgba(11,39,64,0.05); cursor: pointer; transition: background 0.1s;
}
.doc-row:last-child { border-bottom: none; }
.doc-row:hover { background: rgba(10,192,233,0.03); }
.doc-row-name  { display: flex; align-items: center; gap: 0.5rem; font-size: 0.82rem; font-weight: 500; }
.doc-row-rev   { font-size: 0.72rem; color: rgba(11,39,64,0.4); min-width: 36px; text-align: right; }
.doc-row-owner { font-size: 0.72rem; color: rgba(11,39,64,0.4); min-width: 90px; text-align: right; }
```

**Collapse toggle JS:**
```javascript
function togglePhase(hd) {
  hd.closest('.phase-card').classList.toggle('collapsed');
}
```

**Filter behavior for Grouped Index:** Auto-expand phases containing a search match. Hide phases where zero rows match (when a phase filter is active).

---

### Variant B — Table Index

Reuse `.list-table-wrap` / `.list-table` from §10. Additional patterns specific to Table Index pages:

**Sortable column headers:**
```css
.col-sortable { cursor: pointer; user-select: none; white-space: nowrap; }
.col-sortable:hover { color: rgba(11,39,64,0.7); }
.col-sortable.sort-active { color: var(--primary); }
.sort-arrow {
  width: 10px; height: 10px; stroke: currentColor; fill: none; stroke-width: 2.5;
  opacity: 0.2; margin-left: 3px; vertical-align: middle;
  transition: transform 0.15s, opacity 0.15s;
}
.col-sortable.sort-active .sort-arrow { opacity: 0.75; }
.col-sortable.sort-desc   .sort-arrow { transform: rotate(180deg); }
```

**Sort JS pattern:**
```javascript
var sortCol = 'title';
var sortDir = 'asc';

function setSort(col) {
  if (sortCol === col) { sortDir = sortDir === 'asc' ? 'desc' : 'asc'; }
  else { sortCol = col; sortDir = 'asc'; }
  renderTable(); // re-render with new sort
}
```

**Pagination bar (when count > PAGE_SIZE):**
```css
.pagination-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.7rem 1rem; border-top: 1px solid rgba(11,39,64,0.06);
  font-size: 0.75rem; color: rgba(11,39,64,0.4);
}
.btn-load-more {
  font-size: 0.75rem; font-weight: 600; color: var(--aqua-dark);
  background: rgba(10,192,233,0.07); border: none; border-radius: 6px;
  padding: 0.35rem 0.85rem; cursor: pointer; transition: background 0.15s;
}
.btn-load-more:hover { background: rgba(10,192,233,0.14); }
```

---

### At a Glance Panel — Index Page Recipe

Index pages should always populate `#glance-body` with this structure (adjust labels/values to the module):

```
┌──────────────────────────────┐
│  [Big Number]                │  ← total count or % complete (.lm-sw-big)
│  "Documents" / "Completeness"│  ← subtitle (.lm-sw-gauge-sub)
├──────────────────────────────┤
│  By Phase / By Category      │  ← progress bars (.lm-sw-bar-row) — GROUPED only
│  Phase A  ████████░░  80%    │     omit this section on flat Table Index pages
│  Phase B  █████░░░░░  50%    │
├──────────────────────────────┤
│  Status Breakdown            │  ← stat rows (.lm-sw-stat-row)
│  Approved          18        │     always present on both variants
│  Under Review       3        │
│  Draft              5        │
├──────────────────────────────┤
│  🤖 AI Assist                │  ← .lm-sw-ai — always present
│  Surface an actionable gap   │
│  or coverage issue here.     │
└──────────────────────────────┘
```

**Content guidelines:**
- **Big number:** Total item count for Table Index; completion % for Grouped Index
- **Progress bars:** Grouped Index only — one bar per group using `var(--green)` (≥80%), `var(--amber)` (<80%), `var(--red)` (<50%)
- **Status breakdown:** Always present — counts per status (Approved / Under Review / Draft / Not Started)
- **AI Assist:** One actionable insight — missing owner, stalled review, coverage gap, blocking dependency

---

### New Page Checklist additions (Index Page)

Additional checklist items when building a new Index page (append to the §18 checklist):

- [ ] Choose variant: Grouped (`.phase-cards`) or Table (`.list-table`)
- [ ] Add `.filter-bar` with one `.filter-dropdown-wrap` per filterable property + inline search input
- [ ] Wire `applyFilters()` to all filter inputs and search on `oninput` / `onchange`
- [ ] Grouped: collapse/expand on phase header click; auto-expand phases with search matches
- [ ] Table: `setSort(col)` on column headers; add `.pagination-bar` when item count > PAGE_SIZE
- [ ] At a Glance: big number + status breakdown + AI assist card; add phase progress bars for Grouped
- [ ] Do **not** pass `glancePanel: { defaultOpen: false }` — At a Glance stays open by default on Index pages
