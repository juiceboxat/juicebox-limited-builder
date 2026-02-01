// Vercel Serverless Function: Generate JuiceBox Limited Edition Image
// Uses OpenRouter API with Gemini 3 Pro Image (Nano Banana Pro)

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

    const prompt = `Generate an image: Professional product promotional poster for JuiceBox "${name}" Limited Edition.

Scene: elegant garden terrace, bright daylight, sun-drenched outdoor luxury atmosphere, vibrant natural light, refreshing premium exclusive summery mood.

Central subject: A tall faceted glass with ${beverageColor} "${name}" beverage with ice cubes, dynamic splash effect. Floating garnishes: ${garnishes} around the glass. Behind it, a tilted dark grey JuiceBox bag-in-box container with white branding.

Style: professional advertising photography, 4K quality, appetizing, premium feel, clean composition.`;

    console.log('Generating image with prompt:', prompt);

    // Call OpenRouter API with Gemini 3 Pro Image
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
            content: prompt
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
    
    // Extract image URL from response
    let imageUrl = null;
    const msg = data.choices?.[0]?.message;
    
    // Primary: Check for images array (Gemini 3 Pro Image format via OpenRouter)
    if (msg?.images && Array.isArray(msg.images) && msg.images.length > 0) {
      const img = msg.images[0];
      if (img.image_url?.url) {
        imageUrl = img.image_url.url;
      } else if (img.url) {
        imageUrl = img.url;
      }
    }
    
    // Fallback: Check content array
    if (!imageUrl && msg?.content) {
      const content = msg.content;
      if (Array.isArray(content)) {
        for (const part of content) {
          if (part.inline_data?.data && part.inline_data?.mime_type) {
            imageUrl = `data:${part.inline_data.mime_type};base64,${part.inline_data.data}`;
            break;
          }
          if (part.type === 'image_url' && part.image_url?.url) {
            imageUrl = part.image_url.url;
            break;
          }
          if (part.type === 'image' && part.url) {
            imageUrl = part.url;
            break;
          }
        }
      } else if (typeof content === 'string' && content.includes('data:image')) {
        const match = content.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
        if (match) {
          imageUrl = match[0];
        }
      }
    }
    
    console.log('Extracted image URL:', imageUrl ? `Found (length: ${imageUrl.length})` : 'Not found');
    
    return res.status(200).json({
      success: true,
      imageUrl: imageUrl,
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
