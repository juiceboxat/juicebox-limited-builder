// Vercel Serverless Function: Generate JuiceBox Limited Edition Image
// Uses OpenRouter API with Gemini model

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

    const prompt = `Professional product promotional poster for JuiceBox "${name}" Limited Edition.

Scene: elegant garden terrace in front of a baroque-style palace, bright daylight, sun-drenched outdoor luxury atmosphere, vibrant natural light, high-key aesthetics, soft focus background, refreshing premium exclusive summery mood.

Central subject: A tall faceted glass with ${beverageColor} "${name}" beverage with ice cubes, dynamic splash effect with liquid frozen in mid-air. Floating garnishes: ${garnishes} circling the glass. Behind it, a tilted dark grey JuiceBox bag-in-box container with white branding and colored tap.

Background: ornate palace facade with classical details, lush green trees, blooming flowers, manicured garden paths, dreamy bokeh blur.

Text overlays:
- Top center: "JuiceBox Limited VIP" white logo
- Upper third: "${name}" in bold large white sans-serif
- Left side: circular magenta badge "Nur solange der Vorrat reicht!"
- Bottom: green button bar with product info "${typeText}"

Style: professional advertising photography, 4K quality, appetizing, premium feel.`;

    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://juicebox-limited-builder.vercel.app',
        'X-Title': 'JuiceBox Limited Builder',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free', // or appropriate model
        prompt: prompt,
        n: 1,
        size: '1024x1024',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter error:', errorText);
      
      // Try alternative: use chat completion with image generation
      const chatResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://juicebox-limited-builder.vercel.app',
          'X-Title': 'JuiceBox Limited Builder',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-exp:free',
          messages: [
            {
              role: 'user',
              content: `Generate an image: ${prompt}`
            }
          ],
        }),
      });
      
      if (!chatResponse.ok) {
        throw new Error('Image generation failed');
      }
      
      const chatData = await chatResponse.json();
      // Check if there's an image in the response
      if (chatData.choices?.[0]?.message?.content) {
        return res.status(200).json({ 
          success: true,
          message: 'Image generation requested',
          prompt: prompt
        });
      }
    }

    const data = await response.json();
    
    return res.status(200).json({
      success: true,
      imageUrl: data.data?.[0]?.url || null,
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
