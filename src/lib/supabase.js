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
  // Check if email already participated
  if (creation.creator_email) {
    const { data: emailExists } = await supabase
      .from('creations')
      .select('id, name')
      .ilike('creator_email', creation.creator_email)
      .single();
    
    if (emailExists) {
      const error = new Error(`Du hast bereits mit dieser E-Mail teilgenommen!`);
      error.code = 'EMAIL_EXISTS';
      error.existingCreation = emailExists.name;
      throw error;
    }
  }
  
  // Check if name already exists
  const { data: existing } = await supabase
    .from('creations')
    .select('id')
    .ilike('name', creation.name)
    .single();
  
  if (existing) {
    throw new Error(`Der Name "${creation.name}" ist bereits vergeben. Wähle einen anderen!`);
  }
  
  const { data, error } = await supabase
    .from('creations')
    .insert([creation])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateCreationImage(creationId, imageUrl) {
  console.log('Updating creation', creationId, 'with image URL length:', imageUrl?.length);
  
  const { data, error, count } = await supabase
    .from('creations')
    .update({ image_url: imageUrl })
    .eq('id', creationId)
    .select();
  
  console.log('Update result - data:', data, 'error:', error, 'count:', count);
  
  if (error) {
    console.error('Update error:', error);
    throw error;
  }
  return data;
}

export async function voteForCreation(creationId, voterIp) {
  // Use RPC function for atomic vote + increment
  const { data, error } = await supabase
    .rpc('submit_vote', { 
      p_creation_id: creationId, 
      p_voter_ip: voterIp 
    });
  
  if (error) {
    console.error('Vote RPC error:', error);
    throw new Error('Fehler beim Abstimmen. Bitte versuche es erneut.');
  }
  
  // Check RPC result
  if (data && !data.success) {
    if (data.error === 'ALREADY_VOTED') {
      throw new Error('Du hast bereits für diese Kreation gestimmt!');
    }
    throw new Error(data.error || 'Fehler beim Abstimmen.');
  }
  
  return data;
}

// Get all creation IDs this IP has voted for
export async function getVotedCreationIds(voterIp) {
  const { data, error } = await supabase
    .from('votes')
    .select('creation_id')
    .eq('voter_ip', voterIp);
  
  if (error) {
    console.error('Error fetching votes:', error);
    return [];
  }
  return data.map(v => v.creation_id);
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

// Generate image for creation (with extended timeout)
export async function generateCreationImage(creation) {
  console.log('Starting image generation for:', creation.name);
  
  // Create AbortController with 90 second timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000);
  
  try {
    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        creationId: creation.id, // Pass ID so API can update DB directly
        name: creation.name,
        flavors: creation.primary_flavor.split(','),
        accent: creation.accent,
        baseType: creation.base_type,
        variant: creation.variant,
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    console.log('Image generation response status:', response.status);
    
    // Read body as text first, then parse — avoids "body already read" error
    const responseText = await response.text();
    let data;
    
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response:', responseText.slice(0, 500));
      throw new Error(`Image generation failed: ${response.status} - Invalid JSON response`);
    }
    
    if (!response.ok) {
      console.error('Image generation failed:', response.status, data);
      throw new Error(`Image generation failed: ${response.status} - ${JSON.stringify(data)}`);
    }
    console.log('Image generation success:', data.imageUrl ? 'Got URL' : 'No URL');
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.error('Image generation timed out after 90 seconds');
    } else {
      console.error('Image generation error:', error);
    }
    return null;
  }
}
