import { rpc } from '../_lib.js';
const BOT = /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|whatsapp\/|curl|python|monitor/i;
function device(ua) { return /iPad|Tablet|Tab\b/i.test(ua) ? 'tablet' : /Mobi|Android|iPhone/i.test(ua) ? 'celular' : 'computador'; }
function browser(ua) {
  if (/Instagram/i.test(ua)) return 'Instagram';
  if (/FBAN|FBAV/i.test(ua)) return 'Facebook';
  if (/Edg\//.test(ua)) return 'Edge';
  if (/SamsungBrowser/.test(ua)) return 'Samsung';
  if (/Chrome\//.test(ua)) return 'Chrome';
  if (/Safari\//.test(ua)) return 'Safari';
  if (/Firefox\//.test(ua)) return 'Firefox';
  return 'Outro';
}
function os(ua) { return /iPhone|iPad|Mac OS X/.test(ua) ? (/iPhone|iPad/.test(ua) ? 'iOS' : 'macOS') : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : 'Outro'; }
export async function onRequestPost(ctx) {
  const ua = ctx.request.headers.get('user-agent') || '';
  if (BOT.test(ua)) return new Response(null, { status: 204 });
  let body;
  try { body = JSON.parse(await ctx.request.text()); } catch (e) { return new Response(null, { status: 400 }); }
  const list = Array.isArray(body) ? body.slice(0, 60) : [];
  const cf = ctx.request.cf || {};
  const base = { device: device(ua), browser: browser(ua), os: os(ua), city: cf.city || null, region: cf.regionCode || null, country: cf.country || null };
  const ev = list.map(e => Object.assign({}, e, base));
  if (ev.length) ctx.waitUntil(rpc('joice_track', { p_events: ev }).catch(() => {}));
  return new Response(null, { status: 204 });
}
