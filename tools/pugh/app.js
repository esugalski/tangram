// =============================================================
// app.js — Pugh Chart · Shared logic (Supabase backend)
// =============================================================

const SUPABASE_URL  = 'https://nsyxprebeyvxiyumtqxw.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zeXhwcmViZXl2eGl5dW10cXh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MzQxNzEsImV4cCI6MjA5MTAxMDE3MX0.1F95Y4U3btJaTSrwP7UOsjLYF45ieQPjRTCzHRt1k24';

const _sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

// ------ Auth-ready gate -----------------------------------------
// Some pages read Auth.getUser() synchronously at top level.
// We resolve __authReady after Supabase populates the session cache,
// so requireHost() / redirectIfAuthed() always see the real session.

let _authReadyResolve;
const __authReady = new Promise(r => { _authReadyResolve = r; });

_sb.auth.getSession().then(({ data: { session } }) => {
  _syncUserCache(session);
  _authReadyResolve();
});

_sb.auth.onAuthStateChange((_event, session) => {
  _syncUserCache(session);
});

function _syncUserCache(session) {
  if (session?.user) {
    const u = session.user;
    localStorage.setItem('pugh_user', JSON.stringify({
      uid:      u.id,
      email:    u.email,
      name:     u.user_metadata?.full_name || u.email?.split('@')[0] || 'User',
      provider: u.app_metadata?.provider  || 'email',
      avatar:   (u.user_metadata?.full_name || u.email || 'U')[0].toUpperCase()
    }));
  } else {
    localStorage.removeItem('pugh_user');
  }
}

// ------ Utilities -----------------------------------------------

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function qs(sel, ctx = document) { return ctx.querySelector(sel); }
function qsa(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }

function showToast(msg, type = 'success') {
  const el = document.createElement('div');
  const colors = { success: '#3ECF8E', error: '#E05555', info: '#0AC0E9' };
  el.style.cssText = `
    position:fixed; bottom:24px; right:24px; z-index:9999;
    background:#031C2E; border:1px solid ${colors[type]}44;
    border-left:3px solid ${colors[type]};
    color:#E8ECF4; padding:12px 18px; border-radius:8px;
    font-family:'Inter',sans-serif; font-size:0.875rem;
    box-shadow:0 8px 32px rgba(0,0,0,0.4);
    transform:translateY(8px); opacity:0;
    transition:transform 0.2s ease, opacity 0.2s ease;
    max-width:320px;
  `;
  el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(() => { el.style.transform = 'translateY(0)'; el.style.opacity = '1'; });
  setTimeout(() => {
    el.style.transform = 'translateY(8px)'; el.style.opacity = '0';
    setTimeout(() => el.remove(), 200);
  }, 3000);
}

// ------ Auth ----------------------------------------------------

const Auth = {
  getUser() { return JSON.parse(localStorage.getItem('pugh_user') || 'null'); },

  // Await auth session resolution, then enforce host login.
  async requireHost() {
    await __authReady;
    const u = this.getUser();
    if (!u) { location.href = 'index.html'; return null; }
    return u;
  },

  // Await auth resolution, then redirect away if already signed in.
  async redirectIfAuthed(to = 'dashboard.html') {
    await __authReady;
    if (this.getUser()) location.href = to;
  },

  // Wait for auth to resolve without redirecting (for pages with mixed access).
  async waitReady() {
    await __authReady;
  },

  async googleSignIn() {
    const { error } = await _sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/tools/pugh/dashboard.html' }
    });
    if (error) throw new Error(error.message);
  },

  async emailSignIn(email, pw) {
    const { error } = await _sb.auth.signInWithPassword({ email, password: pw });
    if (error) {
      if (error.message.toLowerCase().includes('invalid')) throw new Error('Incorrect email or password.');
      throw new Error(error.message);
    }
    return this.getUser();
  },

  async emailSignUp(email, pw, name) {
    const { error } = await _sb.auth.signUp({
      email,
      password: pw,
      options: { data: { full_name: name.trim() || email.split('@')[0] } }
    });
    if (error) throw new Error(error.message);
    // Supabase sends a confirmation email by default.
    // To skip this during development, disable "Confirm email" in
    // Supabase → Authentication → Providers → Email.
    return this.getUser();
  },

  async signOut() {
    await _sb.auth.signOut();
    localStorage.removeItem('pugh_user');
    location.href = 'index.html';
  }
};

// ------ DB row mappers ------------------------------------------

function _chartFromDb(row) {
  if (!row) return null;
  return {
    id:             row.id,
    hostId:         row.host_id,
    title:          row.title,
    description:    row.description,
    date:           row.date,
    tags:           row.tags,
    status:         row.status,
    scoringScale:   row.scoring_scale,
    useDatum:       row.use_datum,
    datumConceptId: row.datum_concept_id,
    concepts:       row.concepts  || [],
    criteria:       row.criteria  || [],
    createdAt:      row.created_at,
    updatedAt:      row.updated_at,
    openedAt:        row.opened_at,
    resultsVisible:  row.results_visible ?? false,
  };
}

function _chartToDb(chart) {
  const out = {};
  if (chart.id             !== undefined) out.id               = chart.id;
  if (chart.hostId         !== undefined) out.host_id          = chart.hostId;
  if (chart.title          !== undefined) out.title            = chart.title;
  if (chart.description    !== undefined) out.description      = chart.description;
  if (chart.date           !== undefined) out.date             = chart.date;
  if (chart.tags           !== undefined) out.tags             = chart.tags;
  if (chart.status         !== undefined) out.status           = chart.status;
  if (chart.scoringScale   !== undefined) out.scoring_scale    = chart.scoringScale;
  if (chart.useDatum       !== undefined) out.use_datum        = chart.useDatum;
  if (chart.datumConceptId !== undefined) out.datum_concept_id = chart.datumConceptId;
  if (chart.concepts       !== undefined) out.concepts         = chart.concepts;
  if (chart.criteria       !== undefined) out.criteria         = chart.criteria;
  if (chart.createdAt      !== undefined) out.created_at       = chart.createdAt;
  if (chart.updatedAt      !== undefined) out.updated_at       = chart.updatedAt;
  if (chart.openedAt       !== undefined) out.opened_at        = chart.openedAt;
  if (chart.resultsVisible !== undefined) out.results_visible  = chart.resultsVisible;
  return out;
}

// ------ Chart Store (Supabase) ----------------------------------

const DB = {

  async list(hostId) {
    const { data, error } = await _sb
      .from('charts')
      .select('*')
      .eq('host_id', hostId)
      .order('created_at', { ascending: false });
    if (error) { console.error('DB.list', error); return []; }
    return data.map(_chartFromDb);
  },

  async get(id) {
    const { data, error } = await _sb
      .from('charts')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return _chartFromDb(data);
  },

  async create(payload) {
    const now = new Date().toISOString();
    const row = _chartToDb({ id: uid(), status: 'draft', createdAt: now, updatedAt: now, ...payload });
    const { data, error } = await _sb.from('charts').insert([row]).select().single();
    if (error) throw error;
    return _chartFromDb(data);
  },

  async update(id, patch) {
    const row = _chartToDb({ ...patch, updatedAt: new Date().toISOString() });
    const { data, error } = await _sb.from('charts').update(row).eq('id', id).select().single();
    if (error) throw error;
    return _chartFromDb(data);
  },

  async remove(id) {
    await _sb.from('responses').delete().eq('chart_id', id);
    await _sb.from('charts').delete().eq('id', id);
  },

  // --- Responses ---

  async getResponses(chartId) {
    const { data, error } = await _sb
      .from('responses')
      .select('*')
      .eq('chart_id', chartId);
    if (error) { console.error('DB.getResponses', error); return {}; }
    return Object.fromEntries(data.map(r => [r.token, {
      token:       r.token,
      name:        r.name,
      scores:      r.scores,
      submittedAt: r.submitted_at,
      updatedAt:   r.updated_at,
    }]));
  },

  async setResponse(chartId, token, scores, name = '') {
    const { data, error } = await _sb
      .from('responses')
      .upsert(
        { chart_id: chartId, token, name, scores, updated_at: new Date().toISOString() },
        { onConflict: 'chart_id,token' }
      )
      .select()
      .single();
    if (error) throw error;
    return { token: data.token, name: data.name, scores: data.scores,
             submittedAt: data.submitted_at, updatedAt: data.updated_at };
  },

  getParticipantToken() {
    let t = localStorage.getItem('pugh_ptok');
    if (!t) { t = 'p_' + uid(); localStorage.setItem('pugh_ptok', t); }
    return t;
  },

  // --- Calculation (pure, no DB calls) ---

  calcResults(chart, responses, weightOverrides = {}) {
    const respList = Object.values(responses);
    const n = respList.length;
    if (!n) return null;

    const matrix = {};
    chart.concepts.forEach(concept => {
      matrix[concept.id] = {};
      chart.criteria.forEach(crit => {
        const vals = respList
          .map(r => r.scores?.[concept.id]?.[crit.id])
          .filter(v => v != null && v !== '');
        matrix[concept.id][crit.id] = {
          avg:   vals.length ? vals.reduce((a, b) => a + Number(b), 0) / vals.length : null,
          count: vals.length
        };
      });
    });

    const weights = {};
    chart.criteria.forEach(c => { weights[c.id] = weightOverrides[c.id] ?? Number(c.weight) ?? 1; });
    const totalW = Object.values(weights).reduce((a, b) => a + b, 0) || 1;

    const totals = {};
    chart.concepts.forEach(concept => {
      let sum = 0, usedW = 0;
      chart.criteria.forEach(crit => {
        const cell = matrix[concept.id][crit.id];
        if (cell.avg != null) {
          sum   += (weights[crit.id] / totalW) * cell.avg;
          usedW += weights[crit.id];
        }
      });
      totals[concept.id] = usedW > 0 ? sum : null;
    });

    return { matrix, totals, n };
  },

  cellColor(avg, scale) {
    if (avg == null) return { bg: 'transparent', text: '#4A5770' };
    if (scale === 'pugh') {
      if (avg < -0.33) return { bg: 'rgba(224,85,85,0.25)',   text: '#F08080' };
      if (avg >  0.33) return { bg: 'rgba(62,207,142,0.25)',  text: '#3ECF8E' };
      return                  { bg: 'rgba(74,87,112,0.3)',    text: '#8A97B0' };
    } else {
      if (avg < 2)   return { bg: 'rgba(224,85,85,0.25)',   text: '#E05555' };
      if (avg < 3)   return { bg: 'rgba(232,131,58,0.22)',  text: '#E8833A' };
      if (avg < 3.5) return { bg: 'rgba(236,201,75,0.22)',  text: '#ECC94B' };
      if (avg < 4.5) return { bg: 'rgba(126,200,122,0.22)', text: '#7EC87A' };
      return               { bg: 'rgba(62,207,142,0.25)',   text: '#3ECF8E' };
    }
  }
};
