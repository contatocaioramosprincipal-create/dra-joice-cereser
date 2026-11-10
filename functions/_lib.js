export const SB = 'https://phjhedoavxicpsvuxmls.supabase.co';
export const KEY = 'sb_publishable_3luHSKJnQcijOLhelysNxA_bYwnqTB1';
export async function rpc(fn, body) {
  const r = await fetch(`${SB}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {})
  });
  if (!r.ok) throw new Error('rpc ' + fn + ' ' + r.status);
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}
// Mantém só formatação simples (itálico, negrito, quebra de linha, etiqueta "Foco").
export function cleanHtml(s) {
  return String(s || '')
    .replace(/<(\/?)([a-zA-Z0-9]+)([^>]*)>/g, (m, sl, tag, attrs) => {
      tag = tag.toLowerCase();
      if (['em', 'strong', 'b', 'i'].includes(tag)) return `<${sl}${tag}>`;
      if (tag === 'br') return sl ? '' : '<br>';
      if (tag === 'span') return sl ? '</span>' : (/class="tag"/.test(attrs) ? '<span class="tag">' : '<span>');
      return '';
    })
    .replace(/<(?![\/a-z])/gi, '&lt;');
}
export const okImg = v => /^(\/api\/img\/[0-9a-f-]{36}|img\/[a-z0-9_-]+\.(jpg|jpeg|png|webp))$/i.test(v || '');
export const okHref = v => /^(https:\/\/|tel:|mailto:)[^\s"'<>]{3,300}$/i.test(v || '');
