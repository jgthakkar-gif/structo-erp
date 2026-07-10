// Cloudflare Pages Function: /dxf-proxy?url=<encoded file URL>
// v2 — follows redirects MANUALLY, carrying cookies between hops. SharePoint
// "anyone with the link" shares redeem through a redirect chain that sets
// session cookies; a plain fetch(redirect:"follow") drops them and receives
// an HTML page instead of the file. This version accumulates cookies per hop
// the way a browser does, which lands on the actual file stream.
//
// Install: replace functions/dxf-proxy.js in the structo-deploy repo root.
// Deploys automatically with the normal wrangler pages deploy command.

const ALLOWED_HOSTS = [
  "1drv.ms",
  "onedrive.live.com",
  "api.onedrive.com",
  "sharepoint.com",           // matches *.sharepoint.com via endsWith check
  "drive.google.com",
  "drive.usercontent.google.com",
];

const MAX_REDIRECTS = 8;
const MAX_BYTES = 10 * 1024 * 1024;

function hostAllowed(hostname) {
  const h = hostname.toLowerCase();
  return ALLOWED_HOSTS.some(a => h === a || h.endsWith("." + a));
}

function collectCookies(headers, jar) {
  // Workers runtime exposes getSetCookie(); fall back to the merged header.
  let cookies = [];
  if (typeof headers.getSetCookie === "function") cookies = headers.getSetCookie();
  else { const raw = headers.get("set-cookie"); if (raw) cookies = raw.split(/,(?=[^;]+?=)/); }
  cookies.forEach(c => {
    const pair = c.split(";")[0].trim();
    const eq = pair.indexOf("=");
    if (eq > 0) jar[pair.slice(0, eq)] = pair.slice(eq + 1);
  });
}

export async function onRequest(context) {
  const reqUrl = new URL(context.request.url);
  const target = reqUrl.searchParams.get("url");
  if (!target) return new Response("Missing url parameter", { status: 400 });

  let current;
  try { current = new URL(target); } catch { return new Response("Invalid url", { status: 400 }); }
  if (!hostAllowed(current.hostname)) return new Response("Host not allowed", { status: 403 });

  const jar = {};
  let upstream = null;

  for (let hop = 0; hop < MAX_REDIRECTS; hop++) {
    const cookieHeader = Object.entries(jar).map(([k, v]) => `${k}=${v}`).join("; ");
    upstream = await fetch(current.toString(), {
      redirect: "manual",
      headers: {
        "User-Agent": "Mozilla/5.0 (StructoERP-DXF-Proxy)",
        "Accept": "*/*",
        ...(cookieHeader ? { "Cookie": cookieHeader } : {}),
      },
    });

    collectCookies(upstream.headers, jar);

    if (upstream.status >= 300 && upstream.status < 400) {
      const loc = upstream.headers.get("location");
      if (!loc) break;
      const next = new URL(loc, current);
      if (!hostAllowed(next.hostname)) return new Response("Redirected to disallowed host", { status: 403 });
      current = next;
      continue;
    }
    break;
  }

  if (!upstream || !upstream.ok) {
    return new Response("Upstream fetch failed: " + (upstream ? upstream.status : "no response"), { status: 502 });
  }

  const body = await upstream.arrayBuffer();
  if (body.byteLength > MAX_BYTES) return new Response("File too large", { status: 413 });

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "private, max-age=300",
    },
  });
}
