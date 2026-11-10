import { rpc } from '../../_lib.js';
export async function onRequestGet(ctx) {
  const id = String(ctx.params.id || '');
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response('not found', { status: 404 });
  const cache = caches.default;
  const hit = await cache.match(ctx.request);
  if (hit) return hit;
  let d;
  try { d = await rpc('joice_image', { p_id: id }); } catch (e) { return new Response('erro', { status: 502 }); }
  if (!d || !d.b64) return new Response('not found', { status: 404 });
  const bin = Uint8Array.from(atob(d.b64.replace(/\s/g, '')), ch => ch.charCodeAt(0));
  const res = new Response(bin, { headers: { 'Content-Type': d.mime, 'Cache-Control': 'public, max-age=31536000, immutable' } });
  ctx.waitUntil(cache.put(ctx.request, res.clone()));
  return res;
}
