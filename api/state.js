export const config = { runtime: 'edge' };

export default async function handler(req) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const ADMIN_KEY = process.env.ADMIN_KEY;

  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-key',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: cors });

  if (req.method === 'GET') {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/tournament_state?id=eq.1&select=data`,
      { headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` } }
    );
    const rows = await r.json();
    return new Response(JSON.stringify(rows[0]?.data || {}), { status: 200, headers: cors });
  }

  if (req.method === 'POST') {
    if (req.headers.get('x-admin-key') !== ADMIN_KEY)
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });

    const body = await req.json();
    const r = await fetch(`${SUPABASE_URL}/rest/v1/tournament_state?id=eq.1`, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({ data: body, updated_at: new Date().toISOString() })
    });
    if (!r.ok) return new Response(JSON.stringify({ error: 'Save failed' }), { status: 500, headers: cors });
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: cors });
  }

  return new Response(null, { status: 405, headers: cors });
}
