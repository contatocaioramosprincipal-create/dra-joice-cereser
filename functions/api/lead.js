import { SB, KEY } from '../_lib.js';
const MSG = { consentimento: 'Marque a autorização para podermos entrar em contato.', telefone_invalido: 'Confira o número de WhatsApp (com DDD).', nome_invalido: 'Escreva seu nome.', muitos_pedidos: 'Recebemos vários pedidos seguidos. Aguarde alguns minutos.', horario_indisponivel: 'Esse horário acabou de ser reservado. Escolha outro, por favor.' };
function device(ua) { return /iPad|Tablet/i.test(ua) ? 'tablet' : /Mobi|Android|iPhone/i.test(ua) ? 'celular' : 'computador'; }
export async function onRequestPost(ctx) {
  let p;
  try { p = await ctx.request.json(); } catch (e) { return Response.json({ ok: false, error: 'Dados inválidos.' }, { status: 400 }); }
  if (p.website) return Response.json({ ok: true }); // armadilha anti-robô
  if (p.kind === 'guia') {
    const n = String(p.phone || '').replace(/\D/g, '');
    const bad = (m) => Response.json({ ok: false, error: m }, { status: 400 });
    if (String(p.parent_name || '').trim().split(/\s+/).length < 2) return bad('Escreva seu nome e sobrenome.');
    if (n.length !== 11 || n[2] !== '9' || /^0/.test(n) || /^(\d)\1+$/.test(n.slice(2))) return bad('Confira o WhatsApp: celular com DDD, 11 números.');
    if (String(p.child_name || '').trim().length < 2) return bad('Escreva o nome da criança.');
    if (!String(p.child_age || '').trim()) return bad('Escolha a idade da criança.');
  }
  const cf = ctx.request.cf || {};
  p.city = cf.city ? cf.city + (cf.regionCode ? ', ' + cf.regionCode : '') : null;
  p.device = device(ctx.request.headers.get('user-agent') || '');
  const r = await fetch(`${SB}/rest/v1/rpc/joice_lead_create`, {
    method: 'POST', headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p })
  });
  const t = await r.text();
  if (!r.ok) { let m = ''; try { m = JSON.parse(t).message; } catch (e) {} return Response.json({ ok: false, error: MSG[m] || 'Não foi possível enviar agora. Tente de novo.' }, { status: 400 }); }
  return Response.json({ ok: true, id: JSON.parse(t) });
}
