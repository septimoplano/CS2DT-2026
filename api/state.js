export default async function handler(req, res) {
  const { SUPABASE_URL, SUPABASE_SERVICE_KEY, ADMIN_KEY } = process.env;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/tournament_state?id=eq.1&select=data`,
      { headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` } }
    );
    const rows = await r.json();
    return res.status(200).json(rows[0]?.data || {});
  }

  if (req.method === 'POST') {
    if (req.headers['x-admin-key'] !== ADMIN_KEY)
      return res.status(401).json({ error: 'Unauthorized' });

    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/tournament_state?id=eq.1`,
      {
        method: 'PATCH',
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal'
        },
        body: JSON.stringify({ data: req.body, updated_at: new Date().toISOString() })
      }
    );
    if (!r.ok) return res.status(500).json({ error: 'Save failed' });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
