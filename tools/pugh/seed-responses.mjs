// seed-responses.mjs — Pugh Chart test-data seeder
//
// MODE A — seed an existing chart:
//   node tools/pugh/seed-responses.mjs <chartId> [--count 80] [--clear]
//
// MODE B — create a demo chart from scratch, then seed it:
//   node tools/pugh/seed-responses.mjs --create --email you@example.com --password yourpw [--count 80]


const SUPABASE_URL  = 'https://nsyxprebeyvxiyumtqxw.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zeXhwcmViZXl2eGl5dW10cXh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MzQxNzEsImV4cCI6MjA5MTAxMDE3MX0.1F95Y4U3btJaTSrwP7UOsjLYF45ieQPjRTCzHRt1k24';

// --- Demo chart definition ---
const DEMO_CHART = {
  title:        'CGM Sensor Platform — Concept Selection',
  description:  'Evaluate four competing continuous glucose monitoring architectures across key development criteria. Each team member scores independently.',
  date:         new Date().toISOString().slice(0, 10),
  tags:         ['CGM', 'Sensor', 'Concept Selection'],
  status:       'active',
  scoring_scale: 'numeric',
  use_datum:    false,
  datum_concept_id: null,
  results_visible:  false,
  summary_visible:  true,
  summary_text:     null,
  concepts: [
    { id: 'c1', name: 'Enzymatic Electrochemical',  description: 'Glucose oxidase on a platinum working electrode. Well-understood regulatory pathway, proven manufacturing.' },
    { id: 'c2', name: 'Optical Fluorescence',        description: 'Boronic acid fluorophore bound to a fiber optic filament. Eliminates calibration drift but complex manufacturing.' },
    { id: 'c3', name: 'Microneedle Array',            description: 'Hollow microneedle patch pulling interstitial fluid to a lateral-flow biosensor. Minimal insertion pain.' },
    { id: 'c4', name: 'Implantable Microsensor',      description: '6-month implantable sensor with wireless telemetry. Best accuracy, PMA pathway required.' },
  ],
  criteria: [
    { id: 'r1', name: 'Measurement Accuracy (ISO 15197)',   weight: 30, description: 'MARD vs. YSI reference; ability to meet ≤10% MARD across glucose range.' },
    { id: 'r2', name: 'Wear Duration',                      weight: 25, description: 'Clinically useful wear time before sensor replacement (target: ≥14 days).' },
    { id: 'r3', name: 'Manufacturability & Scale-Up',       weight: 20, description: 'Readiness for high-volume manufacturing; yield, process complexity, COGS trajectory.' },
    { id: 'r4', name: 'Patient Comfort & Acceptance',       weight: 15, description: 'Insertion pain, on-body profile, adhesion reliability, and patient preference data.' },
    { id: 'r5', name: 'Regulatory Pathway Complexity',      weight: 10, description: 'Estimated path to clearance/approval: 510(k) vs. De Novo vs. PMA, and timeline risk.' },
  ],
};

// Score distributions per concept per persona (optimist / pessimist / spread)
// Shape: { conceptIndex: { criterionIndex: [p0_base, p1_base, p2_base] } }
// Base scores are on 1–5 scale; we add ±random noise
const SCORE_BASES = {
  c1: { r1: [4.2, 2.8, 3.6], r2: [3.4, 2.0, 2.8], r3: [4.8, 3.2, 4.1], r4: [3.6, 2.4, 3.0], r5: [4.5, 3.0, 3.8] },
  c2: { r1: [3.8, 2.2, 3.1], r2: [4.2, 2.8, 3.5], r3: [2.6, 1.4, 2.0], r4: [4.0, 2.6, 3.3], r5: [3.2, 2.0, 2.6] },
  c3: { r1: [3.0, 1.8, 2.5], r2: [3.6, 2.2, 3.0], r3: [3.4, 2.0, 2.8], r4: [4.6, 3.2, 4.0], r5: [3.8, 2.4, 3.2] },
  c4: { r1: [4.8, 3.4, 4.2], r2: [4.8, 3.5, 4.2], r3: [2.2, 1.2, 1.8], r4: [4.0, 2.6, 3.4], r5: [1.6, 1.0, 1.3] },
};

// --- Helpers ---
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }

const FIRST = ['Alex','Jordan','Morgan','Taylor','Casey','Riley','Drew','Sam',
               'Jamie','Quinn','Avery','Blake','Cameron','Dakota','Emery',
               'Finley','Hayden','Kendall','Logan','Marlowe','Noel','Parker',
               'Reagan','Sage','Skyler','Tatum','Wren','Zara','Cole','Devin'];
const LAST_I = ['A','B','C','D','E','F','G','H','J','K','L','M','N','P','R','S','T','W'];

function fakeName(i) {
  return `${FIRST[i % FIRST.length]} ${LAST_I[Math.floor(i / FIRST.length) % LAST_I.length]}.`;
}

function makeScores(concepts, criteria, persona) {
  const scores = {};
  for (const concept of concepts) {
    scores[concept.id] = {};
    for (const crit of criteria) {
      const bases = SCORE_BASES[concept.id]?.[crit.id];
      const base  = bases ? bases[persona] : 3.0;
      const noise = (Math.random() - 0.5) * 1.4;
      scores[concept.id][crit.id] = Math.round(clamp(base + noise, 1, 5));
    }
  }
  return scores;
}

// --- Supabase REST calls ---
function makeHeaders(jwt) {
  return {
    apikey:          SUPABASE_ANON,
    Authorization:   `Bearer ${jwt || SUPABASE_ANON}`,
    'Content-Type':  'application/json',
  };
}

async function sbGet(path, jwt) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1${path}`, { headers: makeHeaders(jwt) });
  if (!r.ok) throw new Error(`GET ${path} → ${r.status}: ${await r.text()}`);
  return r.json();
}

async function sbPost(path, body, jwt, extra = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method:  'POST',
    headers: { ...makeHeaders(jwt), ...extra },
    body:    JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`POST ${path} → ${r.status}: ${await r.text()}`);
  const text = await r.text();
  return text ? JSON.parse(text) : null;
}

async function sbDelete(path, jwt) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method:  'DELETE',
    headers: makeHeaders(jwt),
  });
  if (!r.ok) throw new Error(`DELETE ${path} → ${r.status}: ${await r.text()}`);
}

// --- Auth ---
async function signIn(email, password) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method:  'POST',
    headers: { apikey: SUPABASE_ANON, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email, password }),
  });
  if (!r.ok) throw new Error(`Sign-in failed: ${await r.text()}`);
  const data = await r.json();
  return { jwt: data.access_token, userId: data.user.id };
}

// --- Seed responses ---
async function seedResponses(chartId, concepts, criteria, count, jwt) {
  const CHUNK = 20;
  let inserted = 0;
  const now = new Date().toISOString();

  for (let start = 0; start < count; start += CHUNK) {
    const chunk = [];
    for (let i = start; i < Math.min(start + CHUNK, count); i++) {
      const offset = Math.floor((i / count) * 15 * 60 * 1000);
      chunk.push({
        chart_id:     chartId,
        token:        'p_seed_' + uid(),
        name:         fakeName(i),
        scores:       makeScores(concepts, criteria, i % 3),
        submitted_at: new Date(Date.now() - 15 * 60 * 1000 + offset).toISOString(),
        updated_at:   now,
      });
    }
    await sbPost('/responses', chunk, jwt, { Prefer: 'resolution=merge-duplicates,return=minimal' });
    inserted += chunk.length;
    process.stdout.write(`\r  ${inserted}/${count} responses inserted…`);
  }
  console.log('');
}

// --- Main ---
async function main() {
  const args    = process.argv.slice(2);
  const createMode = args.includes('--create');
  const count   = parseInt(args[args.indexOf('--count') + 1]  || '80',  10);
  const clear   = args.includes('--clear');

  // ── MODE A: seed existing chart ──────────────────────────────────────────
  if (!createMode) {
    const chartId = args.find(a => !a.startsWith('--'));
    if (!chartId) {
      console.error('Usage:');
      console.error('  Seed existing:   node tools/pugh/seed-responses.mjs <chartId> [--count 80] [--clear]');
      console.error('  Create + seed:   node tools/pugh/seed-responses.mjs --create --email you@co.com --password pw [--count 80]');
      process.exit(1);
    }

    console.log(`\nFetching chart ${chartId}…`);
    const rows = await sbGet(`/charts?id=eq.${chartId}&select=*`);
    if (!rows.length) { console.error('Chart not found.'); process.exit(1); }
    const chart    = rows[0];
    const concepts = chart.use_datum && chart.datum_concept_id
      ? (chart.concepts || []).filter(c => c.id !== chart.datum_concept_id)
      : (chart.concepts || []);
    const criteria = chart.criteria || [];

    console.log(`Chart: "${chart.title}"  |  Status: ${chart.status}  |  Scale: ${chart.scoring_scale}`);
    console.log(`Concepts: ${concepts.length}  |  Criteria: ${criteria.length}`);

    if (clear) {
      process.stdout.write('Clearing existing responses… ');
      await sbDelete(`/responses?chart_id=eq.${chartId}`);
      console.log('done.');
    }

    console.log(`\nSeeding ${count} responses…`);
    await seedResponses(chartId, concepts, criteria, count, null);

    console.log(`\nDone.`);
    console.log(`Results: /tools/pugh/results.html?id=${chartId}`);
    console.log(`Manage:  /tools/pugh/manage.html?id=${chartId}\n`);
    return;
  }

  // ── MODE B: create chart from scratch, then seed ─────────────────────────
  const email    = args[args.indexOf('--email')    + 1];
  const password = args[args.indexOf('--password') + 1];

  if (!email || !password) {
    console.error('--create requires --email and --password flags.');
    console.error('  node tools/pugh/seed-responses.mjs --create --email you@co.com --password yourpw');
    process.exit(1);
  }

  console.log('\nSigning in…');
  const { jwt, userId } = await signIn(email.trim(), password.trim());
  console.log(`Authenticated as ${userId.slice(0, 8)}…`);

  // Build chart row
  const now     = new Date().toISOString();
  const chartId = uid();
  const chartRow = {
    id:               chartId,
    host_id:          userId,
    title:            DEMO_CHART.title,
    description:      DEMO_CHART.description,
    date:             DEMO_CHART.date,
    tags:             DEMO_CHART.tags,
    status:           DEMO_CHART.status,
    scoring_scale:    DEMO_CHART.scoring_scale,
    use_datum:        DEMO_CHART.use_datum,
    datum_concept_id: DEMO_CHART.datum_concept_id,
    concepts:         DEMO_CHART.concepts,
    criteria:         DEMO_CHART.criteria,
    results_visible:  DEMO_CHART.results_visible,
    summary_visible:  DEMO_CHART.summary_visible,
    summary_text:     DEMO_CHART.summary_text,
    created_at:       now,
    updated_at:       now,
    opened_at:        now,
  };

  process.stdout.write(`Creating chart "${DEMO_CHART.title}"… `);
  await sbPost('/charts', chartRow, jwt, { Prefer: 'return=minimal' });
  console.log('done.');

  const concepts = DEMO_CHART.concepts;
  const criteria = DEMO_CHART.criteria;
  console.log(`\nSeeding ${count} responses…`);
  await seedResponses(chartId, concepts, criteria, count, jwt);

  const base = 'https://www.tangrammedtech.com/tools/pugh';
  console.log(`\nDone. Chart created and seeded with ${count} responses.`);
  console.log(`\nChart ID: ${chartId}`);
  console.log(`Results:  ${base}/results.html?id=${chartId}`);
  console.log(`Manage:   ${base}/manage.html?id=${chartId}`);
  console.log(`Score:    ${base}/score.html?id=${chartId}\n`);
}

main().catch(e => { console.error('\n' + e.message); process.exit(1); });
