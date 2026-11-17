import { SB, KEY } from '../_lib.js';
const H = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
async function call(fn, body) {
  const r = await fetch(`${SB}/rest/v1/rpc/${fn}`, {
    method: 'POST', headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const t = await r.text();
  if (!r.ok) { let m = ''; try { m = JSON.parse(t).message; } catch (e) {} return { ok: false, error: m || 'erro' }; }
  return { ok: true, data: t ? JSON.parse(t) : null };
}
const okCode = c => /^[0-9a-f]{10,32}$/.test(c || '');
export async function onRequestGet(ctx) {
  const c = new URL(ctx.request.url).searchParams.get('c');
  if (!okCode(c)) return new Response(JSON.stringify({ ok: false }), { status: 404, headers: H });
  const r = await call('joice_confirm_get', { p_code: c });
  return new Response(JSON.stringify(r.ok && r.data ? { ok: true, appt: r.data } : { ok: false }), { status: r.ok && r.data ? 200 : 404, headers: H });
}
export async function onRequestPost(ctx) {
  let p; try { p = await ctx.request.json(); } catch (e) { p = {}; }
  if (!okCode(p.c) || !['confirmar', 'cancelar'].includes(p.acao)) return new Response(JSON.stringify({ ok: false }), { status: 400, headers: H });
  const r = await call('joice_confirm_set', { p_code: p.c, p_action: p.acao });
  return new Response(JSON.stringify(r.ok ? { ok: true, appt: r.data } : { ok: false, error: r.error }), { status: r.ok ? 200 : 400, headers: H });
}
