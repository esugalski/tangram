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

Every page uses the same three-zone shell:

```
┌─────────────────────────────────────────────────┐
│  SIDEBAR (232px fixed)  │  MAIN                 │
│                         │  ┌─────────────────┐  │
│  dark navy (#071e31)    │  │ TOPBAR (58px)   │  │  white bg, search bar
│                         │  ├─────────────────┤  │
│  nav items              │  │ MODULE HEADER   │  │  navy bg, module name
│  active = aqua tint     │  ├─────────────────┤  │
│                         │  │ SUB-NAV (40px)  │  │  white bg, section tabs
│                         │  ├─────────────────┤  │
│                         │  │ CONTENT AREA    │  │
│                         │  │ (scrollable)    │  │
│                         │  └─────────────────┘  │
└─────────────────────────────────────────────────┘
```

```css
body { display: flex; height: 100vh; overflow: hidden; background: var(--light-gray); }
.sidebar { width: var(--sidebar-w); background: var(--sidebar-bg); flex-shrink: 0; }
.main { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
.topbar { height: 58px; background: white; border-bottom: 1px solid rgba(11,39,64,0.08); }
.content-area { flex: 1; overflow-y: auto; padding: 1.5rem; }
```

---

## 5. Topbar

### Structure
```
[ Search bar (flex: 1, max 360px) ]   [ Export ] [ Approve ] [ Guidance ]
```

The topbar-left holds the search bar + doc revision/status badges. The topbar-right holds action buttons.

### Search Bar
```css
.topbar-search { display: flex; align-items: center; gap: 0.6rem; background: var(--light-gray); border: 1.5px solid rgba(11,39,64,0.1); border-radius: 8px; padding: 0.42rem 0.9rem; max-width: 360px; flex: 1; transition: border-color 0.15s; }
.topbar-search:focus-within { border-color: rgba(10,192,233,0.4); }
```

### Revision / Status Badges (topbar-left)
```css
.ver-badge  { font-size: 0.68rem; font-weight: 700; background: rgba(11,39,64,0.07); border: 1px solid rgba(11,39,64,0.12); color: var(--mid-blue); padding: 0.2rem 0.6rem; border-radius: 5px; }
.status-pill.draft    { background: rgba(10,192,233,0.1); color: var(--aqua-dark); }
.status-pill.review   { background: rgba(245,158,11,0.12); color: #b45309; }
.status-pill.approved { background: rgba(16,185,129,0.12); color: #059669; }
```

---

## 6. Module Header Band

A full-width dark navy bar positioned immediately below the topbar and above the sub-nav on every hub/overview page. It displays the module name in white, providing a clear visual anchor that separates the global chrome (topbar) from the module-scoped chrome (sub-nav and content).

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

Place this div as a **direct child of `.app-main`**, immediately after the topbar div and before the sub-nav `<nav>`.

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

- **Always present** on hub/overview pages (Design Controls, Risk Management, CAPA, etc.)
- The module title must exactly match the sidebar nav label for that module
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

A 4 px full-width gradient stripe that anchors the top of every main content area. It runs edge-to-edge below the sub-nav and signals the visual boundary between navigation chrome and working content. The aqua→indigo gradient ties every page back to the platform's primary action color while providing forward motion (left-to-right energy).

```
┌─────────────────────────────────────────────────┐
│  TOPBAR (white, 58 px)                          │
├─────────────────────────────────────────────────┤
│  SUB-NAV (white, 40 px)                         │
├─────────────────────────────────────────────────┤  ← border-bottom 1px rgba(11,39,64,0.08)
│████████████████ accent band (4 px) ████████████ │  ← aqua → #6366f1 gradient
├─────────────────────────────────────────────────┤
│  CONTENT AREA                                   │
└─────────────────────────────────────────────────┘
```

### On hub / overview pages (Design Controls, Risk Management, etc.)

Add a dedicated `.page-accent-band` element as a **direct child of `.app-main`**, immediately after the sub-nav and before `.content-wrap`:

```html
<div class="page-accent-band"></div>
```

```css
.page-accent-band {
  height: 4px;
  background: linear-gradient(90deg, var(--aqua), #6366f1);
  flex-shrink: 0;
}
```

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

The sidebar is rendered by `sidebar.js` via `initSidebar({ activePage: 'page-id' })`. Do not hardcode sidebar HTML — call the JS initializer.

### Visual conventions
- Background: `var(--sidebar-bg)` (#071e31)
- Active item: `background: rgba(10,192,233,0.12); color: #5DDAF5` + left border `2.5px solid var(--aqua)`
- Inactive item: `color: rgba(255,255,255,0.70)`, hover `rgba(255,255,255,0.05)` tint
- Section labels: `0.57rem`, 700, `letter-spacing: 0.12em`, `color: rgba(255,255,255,0.18)`
- Nav icons: `15×15px`, stroke-only, `stroke-width: 2`

---

## 13. At a Glance Widget (Sidebar Panel)

Rendered by `renderSidebarWidget()` on each page into `#lm-sidebar-widget`. The widget is copied into the guided-mode At a Glance panel by `learn-mode.js`.

### Structure
```
┌──────────────────────────────┐
│  [donut svg]  ● Approved 3   │  ← status breakdown
│               ● Draft 2      │
│──────────────────────────────│
│  5  user needs               │  ← big count + label
│──────────────────────────────│
│  ⚠ 2 needs with no linked…  │  ← conditional warning
└──────────────────────────────┘
```

The donut is generated as an inline SVG string using the `stroke-dasharray` technique:
- `r = 15.9155` → circumference ≈ 100 (makes percentage math trivial)
- Each segment: `stroke-dasharray="pct (100-pct)"`, `stroke-dashoffset="-cumulativeOffset"`
- Rotate the `<svg>` element `-90deg` to start segments at 12 o'clock
- Status colors: approved `#059669`, review `#b45309`, draft `rgba(11,39,64,0.22)`

### CSS classes used inside the widget (from `learn-mode.js`)
```
.lm-sw              — outer wrapper
.lm-sw-gauge-wrap   — big number row
.lm-sw-big          — large count number
.lm-sw-big-label    — "user needs" / "design inputs" label
.lm-sw-section      — grouped sub-section
.lm-sw-section-title
.lm-sw-pills        — flex row of status pills
.lm-sw-pill-green / -amber / -gray
.lm-sw-warn         — amber warning row with triangle icon
.lm-sw-bar-row / .lm-sw-bar-track / .lm-sw-bar-fill / .lm-sw-bar-val  — horizontal bar chart rows
```

---

## 14. Shared JS Infrastructure

| File | Purpose |
|------|---------|
| `sidebar.js` | Renders the left nav. Call `initSidebar({ activePage })` after DOM ready. |
| `learn-mode.js` | Guided/Power mode, At a Glance panel, step footer. Suppressed on Design Controls pages via CSS (`#lm-step-footer`, `#lm-toggle-root { display: none !important }`). |
| `seed-demo.js` | Populates demo data into `localStorage` on first load. |
| `approvals.js` | Approval workflow and e-signature logic. |
| `versions.js` | Document versioning / revision history. |
| `governance.js` | Change control and audit trail. |
| `esign.js` | Electronic signature modal. |

### Script load order (bottom of `<body>`)
```html
<script src="seed-demo.js?v=..."></script>
<script src="learn-mode.js?v=..."></script>
<script src="sidebar.js?v=..."></script>
<script src="esign.js"></script>
<script src="versions.js"></script>
<script src="governance.js"></script>
<script src="approvals.js"></script>
<script>
  initSidebar({ activePage: 'page-id' });
  renderSidebarWidget();
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

- [ ] Copy `:root` variables block verbatim
- [ ] Use the sidebar + main + topbar shell structure
- [ ] Topbar-right: `[ Export ] [ Approve ] [ Guidance ]` — nothing else
- [ ] Add `<div class="module-header"><span class="module-header-title">Module Name</span></div>` between topbar and sub-nav (hub/overview pages)
- [ ] Add `<div class="page-accent-band"></div>` between sub-nav and `.content-wrap` (hub/overview pages only; doc pages use `doc-cover::before`)
- [ ] Add `btn-guidance` → opens `#helpPanel` with page-specific explanation (what it is, regulatory context, best practices, video placeholder)
- [ ] Guidance panel replaces any `#intro-slot`, `renderIntro()`, or `.learn-only` explainer elements — suppress those with CSS if present
- [ ] Wrap doc-cover + section-head + table in `.doc-page-card`
- [ ] Section head: title left, `[+ Add Item]` right (`.btn-tbl-add`)
- [ ] Table rows use `.row-approved / .row-review / .row-draft` for left border stripe
- [ ] Implement `renderSidebarWidget()` — donut chart above big count number
- [ ] Add page suppressions (`#lm-step-footer`, `#lm-toggle-root`)
- [ ] Call `initSidebar({ activePage: 'your-page-id' })` + `renderSidebarWidget()` at init
