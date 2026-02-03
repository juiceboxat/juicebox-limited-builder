// Vercel Serverless Function: Generate JuiceBox Limited Edition Image
// Uses OpenRouter API with Gemini 3 Pro Image (Nano Banana Pro)

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { JUICEBOX_LOGO } from './reference-images.js';

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
    // Check API key
    if (!process.env.OPENROUTER_API_KEY) {
      console.error('OPENROUTER_API_KEY not set!');
      return res.status(500).json({ error: 'Server misconfiguration: API key missing' });
    }
    
    console.log('Request body:', JSON.stringify(req.body));
    
    const { creationId, name, flavors, accent, baseType, variant } = req.body || {};
    
    if (!name || !flavors || flavors.length === 0) {
      console.error('Missing fields - name:', name, 'flavors:', flavors);
      return res.status(400).json({ error: 'Missing required fields', received: { name, flavors } });
    }
    
    console.log('Processing request for:', name, 'flavors:', flavors, 'creationId:', creationId);

    // Maps for colors, garnishes, and German names
    const flavorData = {
      'apfel': { color: 'light green-gold', garnish: 'apple slices', name: 'Apfel' },
      'birne': { color: 'pale golden', garnish: 'pear slices', name: 'Birne' },
      'orange': { color: 'bright orange', garnish: 'orange slices', name: 'Orange' },
      'zitrone': { color: 'pale yellow', garnish: 'lemon wedges', name: 'Zitrone' },
      'grapefruit': { color: 'pink-coral', garnish: 'grapefruit segments', name: 'Grapefruit' },
      'erdbeere': { color: 'vibrant red', garnish: 'fresh strawberry slices', name: 'Erdbeere' },
      'himbeere': { color: 'deep raspberry pink', garnish: 'whole raspberries', name: 'Himbeere' },
      'blaubeere': { color: 'deep purple-blue', garnish: 'fresh blueberries', name: 'Blaubeere' },
      'kirsche': { color: 'rich cherry red', garnish: 'fresh cherries', name: 'Kirsche' },
      'banane': { color: 'creamy yellow', garnish: 'banana slices', name: 'Banane' },
      'mango': { color: 'golden mango yellow', garnish: 'mango cubes', name: 'Mango' },
      'maracuja': { color: 'passion fruit orange', garnish: 'passion fruit halves', name: 'Maracuja' },
      'ananas': { color: 'tropical yellow', garnish: 'pineapple chunks', name: 'Ananas' },
      'wassermelone': { color: 'watermelon pink', garnish: 'watermelon pieces', name: 'Wassermelone' },
      'melone': { color: 'light green', garnish: 'melon balls', name: 'Melone' },
      'traube': { color: 'deep purple', garnish: 'grapes', name: 'Traube' },
      'johannisbeere': { color: 'deep red', garnish: 'red currants', name: 'Johannisbeere' },
      'holunder': { color: 'light purple', garnish: 'elderflower blossoms', name: 'Holunder' },
      'rhabarber': { color: 'pink-red', garnish: 'rhubarb stalks', name: 'Rhabarber' },
      'pfirsich': { color: 'peachy orange', garnish: 'peach slices', name: 'Pfirsich' },
      'kokos': { color: 'creamy white', garnish: 'coconut flakes', name: 'Kokos' },
      'minze': { color: 'fresh mint green', garnish: 'fresh mint leaves', name: 'Minze' },
      'vanille': { color: 'creamy vanilla', garnish: 'vanilla pods', name: 'Vanille' },
      'rose': { color: 'soft pink', garnish: 'rose petals', name: 'Rose' },
    };
    
    const accentData = {
      'cola': { name: 'Cola Bomb', emoji: '🥤' },
      'energy': { name: 'Energy', emoji: '⚡' },
      'eistee': { name: 'Eistee', emoji: '🧊' },
    };
    
    // Build display strings
    const mainFlavor = flavors[0];
    let beverageColor = flavorData[mainFlavor]?.color || 'vibrant colored';
    const garnishes = flavors.map(f => flavorData[f]?.garnish || f).join(', ');
    const flavorNames = flavors.map(f => flavorData[f]?.name || f);
    
    // Override color for special cases
    if (accent === 'cola') {
      beverageColor = 'dark cola brown with caramel tint';
    } else if (accent === 'energy') {
      beverageColor = 'neon yellow-green energy drink';
    } else if (accent === 'eistee') {
      beverageColor = `amber-tinted ${beverageColor} iced tea`;
    } else if (baseType === 'eistee') {
      // Eistee base: mix fruit color with amber tea
      beverageColor = `amber-tinted ${beverageColor} iced tea`;
    }
    
    // Build components list for text overlay
    const components = [...flavorNames];
    if (accent && accent !== 'none' && accentData[accent]) {
      components.push(accentData[accent].name);
    }
    const componentsText = components.join(' + ');
    
    // Type text
    const typeText = baseType === 'eistee' ? 'EISTEE' : 'CLASSIC';
    const variantText = variant === 'light' ? 'LIGHT' : 'ORIGINAL';

    const prompt = `Generate a SMALL 512x512 image: Product poster for JuiceBox "${name}" Limited Edition.

I'm attaching the JuiceBox Limited logo as a reference image. Please incorporate this logo prominently at the TOP of the generated image.

Simple composition:
- The attached "JuiceBox Limited" logo at TOP (use the exact logo design from reference)
- CENTER: Glass with ${beverageColor} beverage, ice cubes, splash
- Garnishes: ${garnishes}
- LARGE text below glass: "${name}"
- Smaller text: "${componentsText}"
- Blurred summery background

Keep it simple, clean typography, appetizing. Output size: 512x512 pixels.`;

    console.log('Generating image for:', name, '| Components:', componentsText);

    // Call OpenRouter API with Gemini 3 Pro Image (with logo reference)
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://juicebox-limited-builder.vercel.app',
        'X-Title': 'JuiceBox Limited Builder',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-pro-image-preview',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${JUICEBOX_LOGO}` } }
            ]
          }
        ],
      }),
    });

    console.log('OpenRouter response status:', response.status);
    
    // Read body as text first to avoid stream errors
    const responseText = await response.text();
    console.log('OpenRouter response body (first 500 chars):', responseText.slice(0, 500));
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse OpenRouter response:', responseText.slice(0, 500));
      return res.status(500).json({ 
        error: 'Invalid response from image API',
        details: responseText.slice(0, 500)
      });
    }
    
    if (!response.ok) {
      console.error('OpenRouter error:', response.status, data);
      return res.status(500).json({ 
        error: 'Image generation failed',
        status: response.status,
        details: data.error || data 
      });
    }
    console.log('OpenRouter response received');
    
    // Extract image data from response
    let base64Data = null;
    let mimeType = 'image/png';
    const msg = data.choices?.[0]?.message;
    
    // Primary: Check for images array (Gemini 3 Pro Image format via OpenRouter)
    if (msg?.images && Array.isArray(msg.images) && msg.images.length > 0) {
      const img = msg.images[0];
      if (img.image_url?.url) {
        const dataUrl = img.image_url.url;
        if (dataUrl.startsWith('data:')) {
          const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            mimeType = match[1];
            base64Data = match[2];
          }
        }
      }
    }
    
    // Fallback: Check content array
    if (!base64Data && msg?.content) {
      const content = msg.content;
      if (Array.isArray(content)) {
        for (const part of content) {
          if (part.inline_data?.data && part.inline_data?.mime_type) {
            base64Data = part.inline_data.data;
            mimeType = part.inline_data.mime_type;
            break;
          }
        }
      }
    }
    
    if (!base64Data) {
      console.error('No image data found in response');
      return res.status(500).json({ 
        error: 'No image generated',
        details: 'API response did not contain image data'
      });
    }
    
    console.log('Image data extracted, uploading to storage...');
    
    const originalSizeKB = Math.round(base64Data.length * 0.75 / 1024);
    console.log(`Original image size: ~${originalSizeKB}KB`);
    
    // Compress and convert to WebP
    const originalBuffer = Buffer.from(base64Data, 'base64');
    let imageBuffer;
    
    try {
      imageBuffer = await sharp(originalBuffer)
        .resize(600, 600, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
      
      const compressedSizeKB = Math.round(imageBuffer.length / 1024);
      console.log(`Compressed to WebP: ~${compressedSizeKB}KB (${Math.round((1 - compressedSizeKB/originalSizeKB) * 100)}% smaller)`);
    } catch (sharpError) {
      console.error('Sharp compression failed, using original:', sharpError.message);
      imageBuffer = originalBuffer;
    }
    
    // Upload to Supabase Storage
    const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const filename = `creations/${safeName}-${Date.now()}.webp`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(filename, imageBuffer, {
        contentType: 'image/webp',
        upsert: true,
      });
    
    let publicUrl = null;
    
    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(filename);
      publicUrl = urlData?.publicUrl;
      console.log('Image uploaded to Supabase:', publicUrl);
    } else {
      console.error('Supabase upload failed:', uploadError);
    }
    
    // Fallback: return base64 if upload failed
    if (!publicUrl) {
      const compressedSizeKB = Math.round(imageBuffer.length / 1024);
      if (compressedSizeKB > 500) {
        return res.status(200).json({
          success: true,
          imageUrl: null,
          prompt: prompt,
          warning: 'Image too large and upload failed',
        });
      }
      publicUrl = `data:image/webp;base64,${imageBuffer.toString('base64')}`;
    }
    
    // Update creation in database with image URL (server-side with service key)
    if (creationId && publicUrl && !publicUrl.startsWith('data:')) {
      console.log('Updating creation', creationId, 'with image URL');
      const { error: updateError } = await supabase
        .from('creations')
        .update({ image_url: publicUrl })
        .eq('id', creationId);
      
      if (updateError) {
        console.error('Failed to update creation:', updateError);
      } else {
        console.log('Creation updated successfully');
      }
    }
    
    return res.status(200).json({
      success: true,
      imageUrl: publicUrl,
      prompt: prompt,
    });

  } catch (error) {
    console.error('Generate image error:', error.message, error.stack);
    return res.status(500).json({ 
      error: 'Failed to generate image',
      details: error.message,
      stack: error.stack
    });
  }
}
