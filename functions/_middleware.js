import { rpc, cleanHtml, okImg, okHref } from './_lib.js';

async function getContent(ctx, fresh) {
  const cache = caches.default;
  const key = new Request('https://drajoice.com.br/__content_cache_v1');
  if (!fresh) {
    const hit = await cache.match(key);
    if (hit) return hit.json();
  }
  const data = await rpc('joice_site_content');
  ctx.waitUntil(cache.put(key, new Response(JSON.stringify(data || {}), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' }
  })));
  return data || {};
}

export async function onRequest(ctx) {
  const url = new URL(ctx.request.url);
  const isHome = url.pathname === '/' || url.pathname === '/index.html';
  if (!isHome || ctx.request.method !== 'GET') return ctx.next();

  // sem 304: o HTML é montado com o conteúdo editado
  const h = new Headers(ctx.request.headers);
  h.delete('If-None-Match'); h.delete('If-Modified-Since');
  const res = await ctx.next(new Request(ctx.request, { headers: h }));
  if (!(res.headers.get('content-type') || '').includes('text/html') || url.searchParams.has('original')) return res;

  let c;
  try { c = await getContent(ctx, url.searchParams.has('nc')); } catch (e) { return res; }
  const out = new Headers(res.headers);
  out.delete('ETag'); out.set('Cache-Control', 'no-cache');
  if (!c || !Object.keys(c).length) return new Response(res.body, { status: res.status, headers: out });

  const heroImg = c['inicio-foto1'] && okImg(c['inicio-foto1'].v) ? c['inicio-foto1'].v : null;
  const rw = new HTMLRewriter()
    .on('[data-edit]', { element(el) {
      const it = c[el.getAttribute('data-edit')];
      if (it && it.k === 'text') el.setInnerContent(cleanHtml(it.v), { html: true });
    }})
    .on('[data-edit-img]', { element(el) {
      const it = c[el.getAttribute('data-edit-img')];
      if (it && it.k === 'img' && okImg(it.v)) el.setAttribute('src', '/' + it.v.replace(/^\//, ''));
    }})
    .on('[data-edit-href]', { element(el) {
      const it = c[el.getAttribute('data-edit-href')];
      if (it && it.k === 'href' && okHref(it.v)) el.setAttribute('href', it.v);
    }})
    .on('meta[property="og:image"]', { element(el) {
      if (heroImg) el.setAttribute('content', 'https://drajoice.com.br/' + heroImg.replace(/^\//, ''));
    }});
  return rw.transform(new Response(res.body, { status: res.status, headers: out }));
}
