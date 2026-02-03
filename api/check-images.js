// Vercel Serverless Function: Check and regenerate missing images
// Runs through all creations and regenerates images where missing

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rpqbjfbkrkgnrebcysta.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to call the generate-image endpoint
async function generateImageForCreation(creation, baseUrl) {
  const flavors = creation.primary_flavor ? creation.primary_flavor.split(',') : [];
  
  const response = await fetch(`${baseUrl}/api/generate-image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creationId: creation.id,
      name: creation.name,
      flavors: flavors,
      accent: creation.accent,
      baseType: creation.base_type,
      variant: creation.variant,
    }),
  });
  
  const result = await response.json();
  return result;
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Optional: Simple auth check
  const authHeader = req.headers.authorization;
  const expectedToken = process.env.ADMIN_TOKEN || 'juicebox-admin-2026';
  
  if (authHeader !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('Checking for creations without images...');
    
    // Fetch all creations without images
    const { data: creations, error } = await supabase
      .from('creations')
      .select('*')
      .or('image_url.is.null,image_url.eq.');
    
    if (error) {
      console.error('Error fetching creations:', error);
      return res.status(500).json({ error: 'Failed to fetch creations' });
    }
    
    console.log(`Found ${creations?.length || 0} creations without images`);
    
    if (!creations || creations.length === 0) {
      return res.status(200).json({ 
        success: true, 
        message: 'All creations have images',
        processed: 0 
      });
    }
    
    // Get base URL for calling generate-image endpoint
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const baseUrl = `${protocol}://${host}`;
    
    const results = [];
    
    // Process each creation (one at a time to avoid rate limits)
    for (const creation of creations) {
      console.log(`Generating image for: ${creation.name} (${creation.id})`);
      
      try {
        const result = await generateImageForCreation(creation, baseUrl);
        results.push({
          id: creation.id,
          name: creation.name,
          success: result.success || !!result.imageUrl,
          imageUrl: result.imageUrl,
          error: result.error,
        });
        
        // Small delay between generations to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (err) {
        console.error(`Error generating image for ${creation.name}:`, err);
        results.push({
          id: creation.id,
          name: creation.name,
          success: false,
          error: err.message,
        });
      }
    }
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    return res.status(200).json({
      success: true,
      message: `Processed ${creations.length} creations`,
      processed: creations.length,
      successful,
      failed,
      results,
    });

  } catch (error) {
    console.error('Check images error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
