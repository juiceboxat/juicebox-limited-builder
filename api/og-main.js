// Edge function to serve main pages with dynamic OG meta (top creation image)
export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  try {
    // Fetch top creation
    const res = await fetch('https://rpqbjfbkrkgnrebcysta.supabase.co/rest/v1/creations?select=id,name,image_url&order=votes_count.desc&limit=1', {
      headers: {
        'apikey': 'sb_publishable_6Fbwm3Fi3FQPdrSRl3E18g_agGdMHWr',
        'Authorization': 'Bearer sb_publishable_6Fbwm3Fi3FQPdrSRl3E18g_agGdMHWr',
      },
    });
    
    const data = await res.json();
    const topCreation = data?.[0];
    
    const ogImage = topCreation?.image_url || 'https://cdn.shopify.com/s/files/1/0512/4289/3477/files/juicebox-limited-logo-white.png';
    const ogTitle = 'JuiceBox Limited - Kreiere deine Sorte!';
    const ogDescription = topCreation 
      ? `🏆 Aktuell #1: "${topCreation.name}" - Kreiere deine eigene Limited Edition und stimme ab!`
      : 'Kreiere deine eigene JuiceBox Limited Edition und stimme für deine Favoriten!';
    
    // Fetch the main HTML
    const baseUrl = new URL('/', request.url);
    // Get the static index.html directly from the origin
    const htmlRes = await fetch(`${baseUrl.origin}/index.html`);
    let html = await htmlRes.text();
    
    // Replace meta tags
    html = html
      .replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${ogImage}">`)
      .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${escapeHtml(ogDescription)}">`)
      .replace(/<meta name="twitter:image" content="[^"]*">/, `<meta name="twitter:image" content="${ogImage}">`)
      .replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${escapeHtml(ogDescription)}">`);
    
    return new Response(html, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=300', // Cache for 5 minutes
      },
    });
  } catch (error) {
    console.error('OG main error:', error);
    // Fallback: redirect to static page
    return Response.redirect(new URL('/index.html', request.url));
  }
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
