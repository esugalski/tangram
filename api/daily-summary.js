// api/daily-summary.js
// Vercel cron function — runs daily at 9am ET (13:00 UTC)
// Queries Supabase and sends a usage summary email via Resend.

const SUPABASE_URL = 'https://nsyxprebeyvxiyumtqxw.supabase.co';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey  = process.env.RESEND_API_KEY;
  const toEmail    = process.env.SUMMARY_TO_EMAIL;

  if (!serviceKey || !resendKey || !toEmail) {
    console.error('Missing env vars');
    return res.status(500).json({ error: 'Missing environment variables' });
  }

  const sbHeaders = {
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  };

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  try {
    // ── New user signups ──────────────────────────────────────────────────
    const usersRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=1000`, {
      headers: sbHeaders,
    });
    const usersData = await usersRes.json();
    const allUsers  = usersData.users || [];
    const newUsers  = allUsers.filter(u => u.created_at >= since);
    const totalUsers = allUsers.length;

    // ── New charts created ────────────────────────────────────────────────
    const newChartsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/charts?select=id,title,created_at&created_at=gte.${encodeURIComponent(since)}&order=created_at.desc`,
      { headers: sbHeaders }
    );
    const newCharts = await newChartsRes.json();

    // ── New responses submitted ───────────────────────────────────────────
    const newRespRes = await fetch(
      `${SUPABASE_URL}/rest/v1/responses?select=id,name,chart_id,updated_at&updated_at=gte.${encodeURIComponent(since)}&order=updated_at.desc`,
      { headers: sbHeaders }
    );
    const newResponses = await newRespRes.json();

    // ── Running totals ────────────────────────────────────────────────────
    const totalChartsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/charts?select=id`,
      { headers: { ...sbHeaders, 'Prefer': 'count=exact', 'Range': '0-0' } }
    );
    const totalCharts = parseInt(totalChartsRes.headers.get('content-range')?.split('/')[1] ?? '0', 10);

    const totalRespRes = await fetch(
      `${SUPABASE_URL}/rest/v1/responses?select=id`,
      { headers: { ...sbHeaders, 'Prefer': 'count=exact', 'Range': '0-0' } }
    );
    const totalResponses = parseInt(totalRespRes.headers.get('content-range')?.split('/')[1] ?? '0', 10);

    // ── Build email ───────────────────────────────────────────────────────
    const date = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/New_York'
    });

    const hasActivity = newUsers.length > 0 || newCharts.length > 0 || newResponses.length > 0;

    const userRows = newUsers.length
      ? newUsers.map(u => `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#111827">${u.user_metadata?.full_name || '—'}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#374151">${u.email}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#6b7280">${new Date(u.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' })} ET</td>
          </tr>`).join('')
      : `<tr><td colspan="3" style="padding:12px;font-size:14px;color:#9ca3af;text-align:center">No new signups</td></tr>`;

    const chartRows = newCharts.length
      ? newCharts.map(c => `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#111827">${c.title}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#6b7280">${new Date(c.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' })} ET</td>
          </tr>`).join('')
      : `<tr><td colspan="2" style="padding:12px;font-size:14px;color:#9ca3af;text-align:center">No new charts</td></tr>`;

    const responseRows = newResponses.length
      ? newResponses.map(r => `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#111827">${r.name || 'Anonymous'}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#6b7280">${new Date(r.updated_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' })} ET</td>
          </tr>`).join('')
      : `<tr><td colspan="2" style="padding:12px;font-size:14px;color:#9ca3af;text-align:center">No new responses</td></tr>`;

    const statBox = (value, label) => `
      <td style="width:33%;text-align:center;padding:16px">
        <div style="font-size:28px;font-weight:700;color:#0B2740">${value}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:4px;text-transform:uppercase;letter-spacing:0.05em">${label}</div>
      </td>`;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Inter',Arial,sans-serif">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

    <!-- Header -->
    <div style="background:#0B2740;padding:28px 32px">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#0AC0E9;margin-bottom:6px">Tangram Tools</div>
      <div style="font-size:22px;font-weight:700;color:#ffffff">Daily Usage Summary</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.5);margin-top:4px">${date}</div>
    </div>

    ${!hasActivity ? `
    <!-- No activity -->
    <div style="padding:40px 32px;text-align:center">
      <div style="font-size:32px;margin-bottom:12px;opacity:0.2">◻</div>
      <div style="font-size:16px;font-weight:600;color:#374151">No activity in the last 24 hours</div>
      <div style="font-size:14px;color:#9ca3af;margin-top:6px">Check back tomorrow.</div>
    </div>
    ` : ''}

    ${hasActivity ? `
    <!-- Activity summary banner -->
    <div style="background:#f0fdf4;border-bottom:1px solid #d1fae5;padding:14px 32px;font-size:14px;color:#065f46">
      ${[
        newUsers.length    ? `<strong>${newUsers.length}</strong> new signup${newUsers.length !== 1 ? 's' : ''}` : '',
        newCharts.length   ? `<strong>${newCharts.length}</strong> new chart${newCharts.length !== 1 ? 's' : ''}` : '',
        newResponses.length ? `<strong>${newResponses.length}</strong> new response${newResponses.length !== 1 ? 's' : ''}` : '',
      ].filter(Boolean).join(' &nbsp;·&nbsp; ')}
      &nbsp;in the last 24 hours
    </div>
    ` : ''}

    <div style="padding:32px">

      <!-- New Signups -->
      <div style="margin-bottom:28px">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#6b7280;margin-bottom:10px">New Signups</div>
        <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
          <thead>
            <tr style="background:#f9fafb">
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;color:#6b7280;letter-spacing:0.04em;text-transform:uppercase">Name</th>
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;color:#6b7280;letter-spacing:0.04em;text-transform:uppercase">Email</th>
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;color:#6b7280;letter-spacing:0.04em;text-transform:uppercase">Time</th>
            </tr>
          </thead>
          <tbody>${userRows}</tbody>
        </table>
      </div>

      <!-- New Charts -->
      <div style="margin-bottom:28px">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#6b7280;margin-bottom:10px">New Charts Created</div>
        <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
          <thead>
            <tr style="background:#f9fafb">
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;color:#6b7280;letter-spacing:0.04em;text-transform:uppercase">Title</th>
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;color:#6b7280;letter-spacing:0.04em;text-transform:uppercase">Time</th>
            </tr>
          </thead>
          <tbody>${chartRows}</tbody>
        </table>
      </div>

      <!-- New Responses -->
      <div style="margin-bottom:32px">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#6b7280;margin-bottom:10px">New Scoring Responses</div>
        <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
          <thead>
            <tr style="background:#f9fafb">
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;color:#6b7280;letter-spacing:0.04em;text-transform:uppercase">Participant</th>
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;color:#6b7280;letter-spacing:0.04em;text-transform:uppercase">Time</th>
            </tr>
          </thead>
          <tbody>${responseRows}</tbody>
        </table>
      </div>

      <!-- Running totals -->
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
        <div style="padding:12px 16px;border-bottom:1px solid #e5e7eb">
          <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#6b7280">All-Time Totals</div>
        </div>
        <table style="width:100%;border-collapse:collapse">
          <tr>
            ${statBox(totalUsers, 'Total Users')}
            ${statBox(totalCharts, 'Total Charts')}
            ${statBox(totalResponses, 'Total Responses')}
          </tr>
        </table>
      </div>

    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 32px;text-align:center">
      <div style="font-size:12px;color:#9ca3af">Tangram MedTech · <a href="https://www.tangrammedtech.com/tools/pugh/dashboard.html" style="color:#0AC0E9;text-decoration:none">Open Dashboard</a></div>
    </div>

  </div>
</body>
</html>`;

    // ── Send via Resend ───────────────────────────────────────────────────
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Tangram Tools <onboarding@resend.dev>',
        to: toEmail,
        subject: `Tangram Tools Daily Summary — ${date}`,
        html,
      }),
    });

    if (!emailRes.ok) {
      const err = await emailRes.text();
      console.error('Resend error:', err);
      return res.status(500).json({ error: err });
    }

    return res.status(200).json({
      ok: true,
      newUsers: newUsers.length,
      newCharts: newCharts.length,
      newResponses: newResponses.length,
    });

  } catch (err) {
    console.error('daily-summary error:', err);
    return res.status(500).json({ error: err.message });
  }
}
