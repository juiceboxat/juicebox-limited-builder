import { createClient } from '@supabase/supabase-js';

export const config = { runtime: 'edge' };

const supabaseUrl = 'https://rpqbjfbkrkgnrebcysta.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwcWJqZmJrcmtnbnJlYmN5c3RhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk0MzczMSwiZXhwIjoyMDg1NTE5NzMxfQ.07Ms9VfW5kY3tU2ZPRcQHEzwBARg5cffwTpOWa_G_VA';

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const { creationId, voterEmail } = await req.json();
    if (!creationId || !voterEmail) {
      return new Response(JSON.stringify({ success: false, error: 'Missing fields' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const email = voterEmail.toLowerCase().trim();

    // Check if already voted for this creation
    const { data: existing } = await supabase.from('votes').select('id').eq('creation_id', creationId).eq('voter_email', email).maybeSingle();
    if (existing) {
      return new Response(JSON.stringify({ success: false, error: 'ALREADY_VOTED' }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Check total votes (max 5)
    const { count } = await supabase.from('votes').select('*', { count: 'exact', head: true }).eq('voter_email', email);
    if (count >= 5) {
      return new Response(JSON.stringify({ success: false, error: 'MAX_VOTES_REACHED' }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Insert vote
    const { error: insertErr } = await supabase.from('votes').insert({ creation_id: creationId, voter_email: email });
    if (insertErr) throw insertErr;

    // Increment votes_count on creation
    const { data: creation } = await supabase.from('creations').select('votes_count').eq('id', creationId).single();
    await supabase.from('creations').update({ votes_count: (creation?.votes_count || 0) + 1 }).eq('id', creationId);

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
