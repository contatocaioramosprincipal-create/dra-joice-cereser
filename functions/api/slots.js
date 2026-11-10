import { rpc } from '../_lib.js';
export async function onRequestGet() {
  let d = { enabled: false };
  try { d = await rpc('joice_slots', { p_days: null }); } catch (e) {}
  return new Response(JSON.stringify(d || { enabled: false }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}
