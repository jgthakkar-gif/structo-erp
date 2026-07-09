// Cloudflare Pages Function: /dxf-proxy?url=<encoded file URL>
// Fetches a file server-side (no browser CORS restrictions apply here) and
// relays the bytes back with permissive headers, so the ERP can pull CAD
// profiles from OneDrive/SharePoint/Drive share links.
//
// Install: place this file at  functions/dxf-proxy.js  in the structo-deploy
// repo root (create the functions/ folder if it doesn't exist). It deploys
// automatically with the normal `wrangler pages deploy dist` command — no
// extra configuration needed. Cloudflare picks up the functions/ folder
// alongside the dist/ output.

const ALLOWED_HOSTS = [
  "1drv.ms",
  "onedrive.live.com",
  "api.onedrive.com",
  "sharepoint.com",          // matches *.sharepoint.com via endsWith check
  "drive.google.com",
  "drive.usercontent.google.com",
];

export async function onRequest(context) {
  const { request } = context;
  const reqUrl = new URL(request.url);
  const target = reqUrl.searchParams.get("url");
  if (!target) return new Response("Missing url parameter", { status: 400 });

  let targetUrl;
  try { targetUrl = new URL(target); } catch { return new Response("Invalid url", { status: 400 }); }

  const host = targetUrl.hostname.toLowerCase();
  const allowed = ALLOWED_HOSTS.some(h => host === h || host.endsWith("." + h));
  if (!allowed) return new Response("Host not allowed", { status: 403 });

  const upstream = await fetch(targetUrl.toString(), {
    redirect: "follow",
    headers: { "User-Agent": "StructoERP-DXF-Proxy" },
  });
  if (!upstream.ok) return new Response("Upstream fetch failed: " + upstream.status, { status: 502 });

  const body = await upstream.arrayBuffer();
  // Hard cap 10 MB — DXF profiles are typically well under 1 MB.
  if (body.byteLength > 10 * 1024 * 1024) return new Response("File too large", { status: 413 });

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "private, max-age=300",
    },
  });
}
