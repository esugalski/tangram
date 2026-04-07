// api/email-results.js
// POST { chartId, token, email }
// Generates a two-tab Excel (Aggregated + Your Scores) and emails it via Resend.

import * as XLSX from 'xlsx';

const SUPABASE_URL = 'https://nsyxprebeyvxiyumtqxw.supabase.co';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { chartId, token, email } = req.body || {};
  if (!chartId || !token || !email || !email.includes('@')) {
    return res.status(400).json({ error: 'Missing or invalid fields.' });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey  = process.env.RESEND_API_KEY;
  if (!serviceKey || !resendKey) {
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  const sbHeaders = {
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  };

  // ── Fetch chart ───────────────────────────────────────────────────────────
  const chartRes = await fetch(
    `${SUPABASE_URL}/rest/v1/charts?id=eq.${chartId}&select=*`,
    { headers: sbHeaders }
  );
  const charts = await chartRes.json();
  if (!charts?.length) return res.status(404).json({ error: 'Chart not found.' });
  const chart = charts[0];

  // ── Fetch responses ───────────────────────────────────────────────────────
  const respRes = await fetch(
    `${SUPABASE_URL}/rest/v1/responses?chart_id=eq.${chartId}&select=*`,
    { headers: sbHeaders }
  );
  const responses = await respRes.json();
  const responseMap = Object.fromEntries((responses || []).map(r => [r.token, r]));
  const myResponse = responseMap[token];

  const concepts = chart.concepts || [];
  const criteria = chart.criteria || [];
  const scale    = chart.scoring_scale || 'numeric';
  const respList = Object.values(responseMap);
  const n        = respList.length;

  // ── Calculate aggregated results ──────────────────────────────────────────
  const totalW = criteria.reduce((s, c) => s + (Number(c.weight) || 0), 0) || 1;

  // avg per concept+criterion
  const avgMatrix = {};
  concepts.forEach(concept => {
    avgMatrix[concept.id] = {};
    criteria.forEach(crit => {
      const vals = respList
        .map(r => r.scores?.[concept.id]?.[crit.id])
        .filter(v => v != null && v !== '');
      avgMatrix[concept.id][crit.id] = vals.length
        ? vals.reduce((a, b) => a + Number(b), 0) / vals.length
        : null;
    });
  });

  // weighted totals
  const totals = {};
  concepts.forEach(concept => {
    let sum = 0, usedW = 0;
    criteria.forEach(crit => {
      const avg = avgMatrix[concept.id][crit.id];
      if (avg != null) {
        sum   += (Number(crit.weight) / totalW) * avg;
        usedW += Number(crit.weight);
      }
    });
    totals[concept.id] = usedW > 0 ? sum : null;
  });

  // rank concepts
  const ranked = [...concepts].sort((a, b) => (totals[b.id] ?? -Infinity) - (totals[a.id] ?? -Infinity));

  // ── Build Excel workbook ──────────────────────────────────────────────────
  const wb = XLSX.utils.book_new();

  // ── Tab 1: Aggregated ─────────────────────────────────────────────────────
  const agg = [];
  agg.push([chart.title || 'Pugh Chart Results']);
  agg.push([`${n} participant${n !== 1 ? 's' : ''} · ${scale === 'pugh' ? '−1/0/+1 scale' : '1–5 scale'}`]);
  agg.push([]);

  // Header row
  agg.push(['Criterion', 'Weight %', ...concepts.map(c => c.name)]);

  // Data rows
  criteria.forEach(crit => {
    const pct = Math.round((Number(crit.weight) / totalW) * 100);
    agg.push([
      crit.name,
      pct + '%',
      ...concepts.map(c => {
        const v = avgMatrix[c.id][crit.id];
        return v != null ? Math.round(v * 100) / 100 : '—';
      })
    ]);
  });

  // Weighted total row
  agg.push([]);
  agg.push([
    'WEIGHTED TOTAL', '',
    ...concepts.map(c => totals[c.id] != null ? Math.round(totals[c.id] * 100) / 100 : '—')
  ]);

  // Rankings
  agg.push([]);
  agg.push(['RANKINGS']);
  ranked.forEach((c, i) => {
    agg.push([`${i + 1}. ${c.name}`, totals[c.id] != null ? Math.round(totals[c.id] * 100) / 100 : '—']);
  });

  const wsAgg = XLSX.utils.aoa_to_sheet(agg);

  // Column widths
  wsAgg['!cols'] = [
    { wch: 28 }, { wch: 10 },
    ...concepts.map(() => ({ wch: 18 }))
  ];

  XLSX.utils.book_append_sheet(wb, wsAgg, 'Aggregated');

  // ── Tab 2: Your Scores ────────────────────────────────────────────────────
  const mine = [];
  mine.push([chart.title || 'Pugh Chart Results']);
  mine.push(['Your individual scores']);
  mine.push([]);
  mine.push(['Criterion', ...concepts.map(c => c.name)]);

  criteria.forEach(crit => {
    mine.push([
      crit.name,
      ...concepts.map(c => {
        const v = myResponse?.scores?.[c.id]?.[crit.id];
        return v != null ? Number(v) : '—';
      })
    ]);
  });

  const wsMine = XLSX.utils.aoa_to_sheet(mine);
  wsMine['!cols'] = [
    { wch: 28 },
    ...concepts.map(() => ({ wch: 18 }))
  ];

  XLSX.utils.book_append_sheet(wb, wsMine, 'Your Scores');

  // ── Serialize to base64 ───────────────────────────────────────────────────
  const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  const xlsxBase64 = Buffer.from(xlsxBuffer).toString('base64');
  const fileName   = `pugh-results-${(chart.title || 'chart').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.xlsx`;

  // ── Winner for email summary ──────────────────────────────────────────────
  const winner = ranked[0];
  const winnerScore = totals[winner?.id] != null
    ? Math.round(totals[winner.id] * 100) / 100
    : null;

  // ── Send email via Resend ─────────────────────────────────────────────────
  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Tangram MedTech Tools <noreply@tangrammedtech.com>',
      to: [email],
      subject: `Pugh Chart Results: ${chart.title || 'Your Session'}`,
      html: buildEmailHtml(chart, winner, winnerScore, n, fileName),
      attachments: [
        { filename: fileName, content: xlsxBase64 }
      ]
    })
  });

  if (!emailRes.ok) {
    const err = await emailRes.text();
    console.error('Resend error:', err);
    return res.status(500).json({ error: 'Failed to send email.' });
  }

  return res.status(200).json({ ok: true });
}

function buildEmailHtml(chart, winner, winnerScore, n, fileName) {
  const title    = chart.title || 'Pugh Chart Results';
  const winLabel = winner ? `<strong style="color:#0AC0E9">${winner.name}</strong>` : '—';
  const scoreStr = winnerScore != null ? ` (${winnerScore})` : '';

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F4F6F9;font-family:Inter,Helvetica,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F6F9;padding:40px 0">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

      <!-- Header -->
      <tr><td style="background:#0B2740;border-radius:12px 12px 0 0;padding:32px 40px">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:rgba(10,192,233,.8)">Tangram MedTech Tools</p>
              <h1 style="margin:0;font-size:22px;font-weight:800;color:#E8ECF4;letter-spacing:-.03em;line-height:1.2">${escHtml(title)}</h1>
              <p style="margin:8px 0 0;font-size:13px;color:rgba(232,236,244,.5)">${n} participant${n !== 1 ? 's' : ''} scored</p>
            </td>
            <td align="right" valign="top">
              <div style="width:40px;height:40px;background:rgba(10,192,233,.12);border:1px solid rgba(10,192,233,.25);border-radius:8px;display:flex;align-items:center;justify-content:center">
                <table cellpadding="0" cellspacing="2" style="margin:auto">
                  <tr>
                    <td style="width:8px;height:8px;background:#0AC0E9;border-radius:2px;opacity:.9"></td>
                    <td style="width:8px;height:8px;background:#0AC0E9;border-radius:2px;opacity:.5"></td>
                  </tr>
                  <tr>
                    <td style="width:8px;height:8px;background:#0AC0E9;border-radius:2px;opacity:.5"></td>
                    <td style="width:8px;height:8px;background:#0AC0E9;border-radius:2px;opacity:.25"></td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- Body -->
      <tr><td style="background:#ffffff;padding:36px 40px">

        <p style="margin:0 0 24px;font-size:15px;color:#4A5770;line-height:1.65">
          Your Pugh Chart session has concluded. The full results are attached as an Excel file with two tabs:
          <strong style="color:#0B2740">Aggregated</strong> (all participants' scores) and
          <strong style="color:#0B2740">Your Scores</strong> (your individual responses).
        </p>

        ${winner ? `
        <!-- Winner callout -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
          <tr><td style="background:#F0FBF7;border:1px solid rgba(62,207,142,.3);border-left:4px solid #3ECF8E;border-radius:8px;padding:18px 20px">
            <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#3ECF8E">Top Ranked Concept</p>
            <p style="margin:0;font-size:18px;font-weight:700;color:#0B2740">${escHtml(winner.name)}${scoreStr}</p>
          </td></tr>
        </table>` : ''}

        <!-- File note -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
          <tr><td style="background:#F8F9FC;border:1px solid #E2E8F0;border-radius:8px;padding:16px 20px;display:flex;align-items:center;gap:12px">
            <p style="margin:0;font-size:13px;color:#4A5770;line-height:1.5">
              📎 <strong style="color:#0B2740">${escHtml(fileName)}</strong><br>
              <span style="font-size:12px">Open in Excel or Google Sheets for full detail.</span>
            </p>
          </td></tr>
        </table>

        <!-- Divider -->
        <hr style="border:none;border-top:1px solid #E2E8F0;margin:28px 0">

        <!-- Pugh Chart promo -->
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#8A97B0">About Tangram Pugh Chart</p>
        <p style="margin:0 0 20px;font-size:14px;color:#4A5770;line-height:1.65">
          The Tangram Pugh Chart tool helps medtech teams make structured, bias-free decisions — from design concept selection to regulatory pathway evaluation. Independent scoring means every voice carries equal weight, not just the loudest one in the room.
        </p>
        <a href="https://www.tangrammedtech.com/tools/pugh/" style="display:inline-block;padding:12px 24px;background:#0AC0E9;color:#0B2740;font-weight:700;font-size:14px;text-decoration:none;border-radius:7px;letter-spacing:.02em">Try Pugh Chart Free →</a>

      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#0B2740;border-radius:0 0 12px 12px;padding:24px 40px">
        <p style="margin:0 0 4px;font-size:12px;color:rgba(255,255,255,.35);line-height:1.6">
          © 2026 Tangram MedTech · <a href="https://www.tangrammedtech.com" style="color:rgba(10,192,233,.6);text-decoration:none">tangrammedtech.com</a>
        </p>
        <p style="margin:0;font-size:11px;color:rgba(255,255,255,.2)">You received this because you participated in a Pugh Chart session.</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
