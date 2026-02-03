// Vercel Serverless Function: Delete Creation
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
    const { creationId, creatorEmail } = req.body || {};
    
    if (!creationId) {
      return res.status(400).json({ error: 'Missing creationId' });
    }
    
    // Verify the creation exists and belongs to this email (if provided)
    const { data: creation, error: fetchError } = await supabase
      .from('creations')
      .select('id, creator_email')
      .eq('id', creationId)
      .single();
    
    if (fetchError || !creation) {
      return res.status(404).json({ error: 'Creation not found' });
    }
    
    // Optional: verify ownership by email
    if (creatorEmail && creation.creator_email?.toLowerCase() !== creatorEmail.toLowerCase()) {
      return res.status(403).json({ error: 'Not authorized to delete this creation' });
    }
    
    // First delete associated votes
    const { error: votesError } = await supabase
      .from('votes')
      .delete()
      .eq('creation_id', creationId);
    
    if (votesError) {
      console.error('Error deleting votes:', votesError);
      // Continue anyway - votes might not exist
    }
    
    // Delete the creation
    const { error: deleteError } = await supabase
      .from('creations')
      .delete()
      .eq('id', creationId);
    
    if (deleteError) {
      console.error('Delete error:', deleteError);
      return res.status(500).json({ error: 'Failed to delete creation' });
    }
    
    return res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('Delete creation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
