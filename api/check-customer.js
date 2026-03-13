export const config = { runtime: 'edge' };
export default async function handler(req) {
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  try {
    const { email } = await req.json();
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient('https://rpqbjfbkrkgnrebcysta.supabase.co', 'sb_publishable_6Fbwm3Fi3FQPdrSRl3E18g_agGdMHWr');
    const { data } = await supabase.from('creations').select('id,name').ilike('creator_email', email).maybeSingle();
    return new Response(JSON.stringify({ exists: !!data, creation: data }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ exists: false }), { headers: { 'Content-Type': 'application/json' } });
  }
}
