// API endpoint to serve Open Graph data for creation sharing
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rpqbjfbkrkgnrebcysta.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

export default async function handler(req, res) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ error: 'Missing creation ID' });
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: creation, error } = await supabase
      .from('creations')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !creation) {
      return res.status(404).json({ error: 'Creation not found' });
    }
    
    return res.status(200).json({
      title: `JuiceBox Limited: ${creation.name}`,
      description: `Vote für "${creation.name}" - eine Community-Kreation bei JuiceBox Limited!`,
      image: creation.image_url || 'https://cdn.shopify.com/s/files/1/0512/4289/3477/files/juicebox-limited-logo-white.png',
      url: `https://create.juicebox.at/creation/${creation.id}`,
    });
  } catch (err) {
    console.error('OG API error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
