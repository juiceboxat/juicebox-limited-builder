// Vercel Serverless Function: Remove Vote
// Uses service_role key for database operations

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rpqbjfbkrkgnrebcysta.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { creationId, voterIp } = req.body || {};
    
    if (!creationId || !voterIp) {
      return res.status(400).json({ error: 'Missing creationId or voterIp' });
    }
    
    // Delete the vote
    const { error: deleteError } = await supabase
      .from('votes')
      .delete()
      .eq('creation_id', creationId)
      .eq('voter_ip', voterIp);
    
    if (deleteError) {
      console.error('Delete error:', deleteError);
      return res.status(500).json({ error: 'Failed to delete vote' });
    }
    
    // Decrement votes_count
    const { data: creation } = await supabase
      .from('creations')
      .select('votes_count')
      .eq('id', creationId)
      .single();
    
    const newCount = Math.max(0, (creation?.votes_count || 1) - 1);
    
    await supabase
      .from('creations')
      .update({ votes_count: newCount })
      .eq('id', creationId);
    
    return res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('Remove vote error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
