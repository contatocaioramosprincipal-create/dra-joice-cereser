import { rpc } from '../_lib.js';
export async function onRequestGet(ctx) {
  const cache = caches.default, key = new Request('https://drajoice.com.br/__config_v1');
  const fresh = new URL(ctx.request.url).searchParams.has('nc');
  if (!fresh) { const hit = await cache.match(key); if (hit) return hit; }
  let d = {};
  try { d = await rpc('joice_public_settings'); } catch (e) {}
  const res = new Response(JSON.stringify(d || {}), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' } });
  ctx.waitUntil(cache.put(key, res.clone()));
  return res;
}
