// Edge function to serve creation pages with dynamic OG meta tags
export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const creationId = pathParts[pathParts.length - 1];
  
  if (!creationId || creationId === '[id]') {
    return Response.redirect(new URL('/', request.url));
  }
  
  try {
    // Fetch creation data
    const res = await fetch(`https://rpqbjfbkrkgnrebcysta.supabase.co/rest/v1/creations?id=eq.${creationId}&select=id,name,image_url,votes_count,primary_flavor,variant`, {
      headers: {
        'apikey': 'sb_publishable_6Fbwm3Fi3FQPdrSRl3E18g_agGdMHWr',
        'Authorization': 'Bearer sb_publishable_6Fbwm3Fi3FQPdrSRl3E18g_agGdMHWr',
      },
    });
    
    const data = await res.json();
    const creation = data?.[0];
    
    if (!creation) {
      return Response.redirect(new URL('/bestenliste', request.url));
    }
    
    const ogTitle = `JuiceBox Limited: ${creation.name}`;
    const ogDescription = `Vote für "${creation.name}" bei JuiceBox Limited! ${creation.votes_count || 0} Votes`;
    const ogImage = creation.image_url || 'https://cdn.shopify.com/s/files/1/0512/4289/3477/files/juicebox-limited-logo-white.png';
    const ogUrl = `https://create.juicebox.at/creation/${creation.id}`;
    
    // Fetch the main HTML and modify it
    const baseUrl = new URL('/', request.url).toString();
    const htmlRes = await fetch(baseUrl);
    let html = await htmlRes.text();
    
    // Replace meta tags
    html = html
      .replace(/<title>[^<]*<\/title>/, `<title>${ogTitle}</title>`)
      .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${escapeHtml(ogTitle)}">`)
      .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${escapeHtml(ogDescription)}">`)
      .replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${ogImage}">`)
      .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${ogUrl}">`)
      .replace(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${escapeHtml(ogTitle)}">`)
      .replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${escapeHtml(ogDescription)}">`)
      .replace(/<meta name="twitter:image" content="[^"]*">/, `<meta name="twitter:image" content="${ogImage}">`);
    
    return new Response(html, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=60',
      },
    });
  } catch (error) {
    console.error('Creation page error:', error);
    return Response.redirect(new URL('/bestenliste', request.url));
  }
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
