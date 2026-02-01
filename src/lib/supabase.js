// Supabase Client
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rpqbjfbkrkgnrebcysta.supabase.co';
const supabaseKey = 'sb_publishable_6Fbwm3Fi3FQPdrSRl3E18g_agGdMHWr';

export const supabase = createClient(supabaseUrl, supabaseKey);

// API Functions

export async function getCreations(limit = 20, offset = 0) {
  const { data, error } = await supabase
    .from('creations')
    .select('*')
    .order('votes_count', { ascending: false })
    .range(offset, offset + limit - 1);
  
  if (error) throw error;
  return data;
}

export async function createCreation(creation) {
  const { data, error } = await supabase
    .from('creations')
    .insert([creation])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function voteForCreation(creationId, voterIp) {
  const { data, error } = await supabase
    .from('votes')
    .insert([{ creation_id: creationId, voter_ip: voterIp }]);
  
  if (error) {
    if (error.code === '23505') {
      throw new Error('Du hast bereits für diese Kreation gestimmt!');
    }
    throw error;
  }
  return data;
}

export async function hasVoted(creationId, voterIp) {
  const { data, error } = await supabase
    .from('votes')
    .select('id')
    .eq('creation_id', creationId)
    .eq('voter_ip', voterIp)
    .single();
  
  return !!data;
}

// Get visitor IP (simple method via external service)
export async function getVisitorIp() {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return data.ip;
  } catch {
    return 'unknown';
  }
}
