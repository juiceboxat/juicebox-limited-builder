// Vercel Serverless Function: Generate JuiceBox Limited Edition Image
// Uses OpenRouter API with Gemini 3 Pro Image (Nano Banana Pro)

import { createClient } from '@supabase/supabase-js';
import { JUICEBOX_PRODUCT, JUICEBOX_LOGO } from './reference-images.js';

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
    const { name, flavors, accent, baseType, variant } = req.body;
    
    if (!name || !flavors || flavors.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Build the prompt
    const flavorList = flavors.join(', ');
    const accentText = accent && accent !== 'none' ? ` with ${accent} accent` : '';
    const typeText = `${baseType === 'eistee' ? 'Iced Tea' : 'Classic'} ${variant === 'light' ? 'Light' : 'Original'}`;
    
    // Determine beverage color based on flavors
    const colorMap = {
      'erdbeere': 'vibrant red',
      'himbeere': 'deep raspberry pink',
      'kirsche': 'rich cherry red',
      'orange': 'bright orange',
      'mango': 'golden mango yellow',
      'ananas': 'tropical yellow',
      'apfel': 'light green-gold',
      'zitrone': 'pale yellow',
      'blaubeere': 'deep purple-blue',
      'traube': 'deep purple',
      'wassermelone': 'watermelon pink',
      'pfirsich': 'peachy orange',
      'banane': 'creamy yellow',
      'melone': 'light green',
      'maracuja': 'passion fruit orange',
      'holunder': 'light purple',
      'birne': 'pale golden',
      'grapefruit': 'pink-coral',
      'johannisbeere': 'deep red',
      'rhabarber': 'pink-red',
      'kokos': 'creamy white',
      'minze': 'fresh mint green',
      'vanille': 'creamy vanilla',
      'rose': 'soft pink',
    };
    
    const mainFlavor = flavors[0];
    const beverageColor = colorMap[mainFlavor] || 'vibrant colored';
    
    // Build garnish list from flavors
    const garnishMap = {
      'erdbeere': 'fresh strawberry slices',
      'himbeere': 'whole raspberries',
      'kirsche': 'fresh cherries',
      'orange': 'orange slices',
      'mango': 'mango cubes',
      'ananas': 'pineapple chunks',
      'apfel': 'apple slices',
      'zitrone': 'lemon wedges',
      'blaubeere': 'fresh blueberries',
      'traube': 'grapes',
      'wassermelone': 'watermelon pieces',
      'pfirsich': 'peach slices',
      'banane': 'banana slices',
      'melone': 'melon balls',
      'maracuja': 'passion fruit halves',
      'holunder': 'elderflower blossoms',
      'birne': 'pear slices',
      'grapefruit': 'grapefruit segments',
      'kokos': 'coconut flakes',
      'minze': 'fresh mint leaves',
    };
    
    const garnishes = flavors.map(f => garnishMap[f] || f).join(', ');

    const prompt = `Generate a professional product promotional poster for JuiceBox "${name}" Limited Edition.

I'm providing two reference images:
1. The JuiceBox bag-in-box product packaging (dark grey with white branding, red tap)
2. The "JuiceBox Limited" logo that should appear at the TOP of the generated image

Create an image with:
- The "JuiceBox Limited" logo at the TOP (use the provided logo as reference)
- A tall faceted glass with ${beverageColor} "${name}" beverage with ice cubes, dynamic splash effect
- Floating garnishes: ${garnishes} around the glass
- The JuiceBox bag-in-box container (use the provided product image as reference) tilted behind the glass
- Elegant garden terrace setting, bright daylight, premium summery mood
- Product name "${name}" at the bottom in bold elegant typography

Style: professional advertising photography, 4K quality, appetizing, premium feel.`;

    console.log('Generating image with reference images...');

    // Call OpenRouter API with Gemini 3 Pro Image (multimodal with reference images)
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
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${JUICEBOX_PRODUCT}` }
              },
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${JUICEBOX_LOGO}` }
              },
              {
                type: 'text',
                text: prompt
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter error:', response.status, errorText);
      return res.status(500).json({ 
        error: 'Image generation failed',
        details: errorText 
      });
    }

    const data = await response.json();
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
    
    const imageSizeKB = Math.round(base64Data.length * 0.75 / 1024);
    console.log(`Image size: ~${imageSizeKB}KB`);
    
    // Upload to Supabase Storage
    const imageBuffer = Buffer.from(base64Data, 'base64');
    const ext = mimeType.includes('png') ? 'png' : 'jpg';
    const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const filename = `creations/${safeName}-${Date.now()}.${ext}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(filename, imageBuffer, {
        contentType: mimeType,
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
      if (imageSizeKB > 500) {
        return res.status(200).json({
          success: true,
          imageUrl: null,
          prompt: prompt,
          warning: 'Image too large and upload failed',
        });
      }
      publicUrl = `data:${mimeType};base64,${base64Data}`;
    }
    
    return res.status(200).json({
      success: true,
      imageUrl: publicUrl,
      prompt: prompt,
    });

  } catch (error) {
    console.error('Generate image error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate image',
      details: error.message 
    });
  }
}
