export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const targetPath = url.pathname.replace('/nesting-api', '/nesting');
  const targetUrl = `https://api-nesting.nestingcenter.com${targetPath}${url.search}`;
  const headers = new Headers(request.headers);
  headers.set('Origin', 'https://webclient.nestingcenter.com');
  headers.set('Referer', 'https://webclient.nestingcenter.com/');
  headers.delete('host');
  const proxyRequest = new Request(targetUrl, {
    method: request.method,
    headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
  });
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    }});
  }
  const response = await fetch(proxyRequest);
  const newHeaders = new Headers(response.headers);
  newHeaders.set('Access-Control-Allow-Origin', '*');
  newHeaders.delete('Access-Control-Allow-Credentials');
  return new Response(response.body, { status: response.status, headers: newHeaders });
}
