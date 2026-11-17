/*
 * Robô espelho da agenda — Dra. Joice Cereser (Rede D'Or São Luiz)
 * Lê os horários livres no agendamento online da Rede D'Or e envia para o
 * sistema da Dra. Joice (Supabase). Só LÊ: não marca nem reserva nada.
 *
 * Uso:  node robo.js            -> roda sem parar (a cada X minutos)
 *       node robo.js --uma-vez  -> roda uma leitura e sai (para testar)
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const DIR = __dirname;
const CFG = JSON.parse(fs.readFileSync(path.join(DIR, 'config.json'), 'utf8'));
const DEBUG = path.join(DIR, 'debug');
fs.mkdirSync(DEBUG, { recursive: true });

const URL_INICIO = 'https://www.rededorsaoluiz.com.br/paciente/marcar-consulta';
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const UMA_VEZ = process.argv.includes('--uma-vez');
const VERSAO = '1.5';
const URL_ATUALIZACAO = 'https://drajoice.com.br/robo-agenda/robo.js';

function log(...a) {
  const linha = `[${new Date().toLocaleString('pt-BR')}] ` + a.join(' ');
  console.log(linha);
  try { fs.appendFileSync(path.join(DIR, 'robo.log'), linha + '\n'); } catch (e) {}
}
const espera = ms => new Promise(r => setTimeout(r, ms));
const hojeSP = () => { const d = new Date(Date.now() - 3 * 3600e3); return d.toISOString().slice(0, 10); };
const somaDias = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

async function foto(page, nome) {
  try { await page.screenshot({ path: path.join(DEBUG, nome + '.png'), fullPage: true }); } catch (e) {}
}

// guarda texto/estrutura da tela (inclusive dentro dos componentes) para diagnóstico
async function despejar(page, nome) {
  try {
    const txt = await page.evaluate(() => {
      const out = [];
      const walk = (root, d) => { for (const el of root.querySelectorAll('*')) {
        const t = (el.childElementCount === 0 ? (el.textContent || '').trim() : '');
        const at = ['role','placeholder','label','name','value','aria-label','class'].map(a => el.getAttribute && el.getAttribute(a) ? a + '="' + String(el.getAttribute(a)).slice(0,60) + '"' : '').filter(Boolean).join(' ');
        if (el.tagName.includes('-') || t || /^(SELECT|OPTION|LI|BUTTON|INPUT)$/.test(el.tagName)) out.push(el.tagName.toLowerCase() + ' ' + at + (t ? ' :: ' + t.slice(0,80) : ''));
        if (el.shadowRoot) { out.push('#shadow-root'); walk(el.shadowRoot, d + 1); }
      } };
      walk(document.querySelector('main') || document.body, 0);
      return out.join('\n');
    });
    fs.writeFileSync(path.join(DEBUG, nome + '.txt'), txt);
  } catch (e) {}
}

// abre um cura-select e escolhe a opção pelo texto (ou a primeira, se não achar)
async function escolherOpcao(page, campo, texto) {
  await campo.click();
  await espera(900);
  const ops = page.locator('cura-select-option').filter({ visible: true });
  const alvo = ops.filter({ hasText: new RegExp('^\\s*' + texto + '\\s*$', 'i') });
  if (await alvo.count()) await alvo.first().click();
  else if (await ops.count()) { await despejar(page, 'opcoes-' + texto); await ops.first().click(); }
  else throw new Error('Lista sem opções visíveis');
}

async function cliqueSeVisivel(loc, ms = 1200) {
  try { if (await loc.first().isVisible({ timeout: ms })) { await loc.first().click({ timeout: 3000 }); return true; } } catch (e) {}
  return false;
}

async function fecharAvisos(page) {
  await cliqueSeVisivel(page.getByText('Fechar', { exact: true }), 800);
  await cliqueSeVisivel(page.getByRole('button', { name: /rejeitar|recusar|somente necess/i }), 500);
}

async function botaoProssiga(page) {
  const b = page.getByRole('button', { name: /^(prossiga|continuar|avançar|avancar)$/i });
  if (await b.count()) { try { await b.last().click({ timeout: 5000 }); return true; } catch (e) {} }
  return false;
}

function etapa(page) {
  const p = new URL(page.url()).pathname.replace(/\/+$/, '');
  return p.split('/').pop();
}

/* ---------- passo a passo até a tela da agenda ---------- */
async function chegarNaAgenda(page) {
  await page.goto(URL_INICIO, { waitUntil: 'domcontentloaded', timeout: 90000 });
  const presencial = page.getByRole('button', { name: 'PRESENCIAL', exact: true }).last();
  await presencial.waitFor({ timeout: 90000 });
  await espera(1500);
  await fecharAvisos(page);
  await presencial.click();

  const busca = page.getByPlaceholder(/especialidade ou m[eé]dico/i).first();
  await busca.waitFor({ timeout: 20000 });
  await busca.click();
  await busca.pressSequentially(CFG.medica, { delay: 60 });
  const medica = page.getByRole('heading', { name: CFG.medica }).first();
  await medica.waitFor({ timeout: 20000 });
  await espera(600);
  await medica.click();

  for (let i = 0; i < 8; i++) {
    await page.waitForLoadState('domcontentloaded');
    await espera(2000);
    await fecharAvisos(page);
    const e = etapa(page);
    log('etapa:', e);
    await foto(page, 'entrou-' + e);
    await despejar(page, 'entrou-' + e);
    if (e === 'agendar-consulta') return;

    if (e === 'local') {
      await page.getByText(new RegExp(CFG.unidade, 'i')).first().click({ timeout: 15000 });
      await espera(800);
      await botaoProssiga(page);
    } else if (e === 'paciente') {
      // componentes do site (cura-*): clica no campo e digita pelo teclado
      const nasc = page.locator('cura-input-text[placeholder="dd/mm/aaaa"], [placeholder="dd/mm/aaaa"]').first();
      await nasc.click();
      await espera(300);
      await page.keyboard.type(CFG.nascimento_ficticio.replace(/\D/g, ''), { delay: 80 });
      await espera(500);
      await page.keyboard.press('Tab');
      await espera(500);
      // sexo: componente do site (cura-select / lista) ou <select>
      const campoSexo = page.locator('[placeholder*="sexo" i], [label*="sexo" i]').first();
      const sel = page.locator('select');
      if (await sel.count()) {
        await sel.first().selectOption({ label: CFG.sexo_ficticio }).catch(async () => { await sel.first().selectOption({ index: 1 }); });
      } else {
        if (await campoSexo.count()) await campoSexo.click(); else await page.getByText(/selecione o sexo/i).last().click();
        await espera(900);
        await despejar(page, 'opcoes-sexo');
        const opc = page.getByText(new RegExp('^\\s*' + CFG.sexo_ficticio + '\\s*$', 'i')).filter({ visible: true });
        if (await opc.count()) await opc.last().click();
        else { await page.keyboard.press('ArrowDown'); await espera(300); await page.keyboard.press('Enter'); }
      }
      await espera(800);
      await foto(page, 'passo-paciente');
      await botaoProssiga(page);
    } else if (e === 'pagamento') {
      await escolherOpcao(page, page.locator('cura-select[label="Forma de pagamento"]').first(), CFG.pagamento);
      // se aparecer mais uma lista (plano/convênio), escolhe "Particular" nela também
      for (let k = 0; k < 3; k++) {
        await espera(1200);
        const vazio = page.locator('cura-select[value="unset"]').filter({ visible: true });
        if (!(await vazio.count())) break;
        await escolherOpcao(page, vazio.first(), CFG.pagamento);
      }
      await espera(800);
      await foto(page, 'passo-pagamento');
      await botaoProssiga(page);
    } else {
      // etapa desconhecida: tenta só prosseguir
      if (!(await botaoProssiga(page))) throw new Error('Não sei o que fazer na etapa "' + e + '". Veja debug/etapa-desconhecida.png');
    }
  }
  if (etapa(page) !== 'agendar-consulta') throw new Error('Não cheguei na tela da agenda (parei em "' + etapa(page) + '").');
}

/* ---------- leitura do calendário ---------- */
// funções que enxergam dentro dos componentes (shadow DOM) do site
const DEEP = `
  window.__deepAll = root => { const out = []; const st = [root]; while (st.length) { const r = st.pop();
    for (const el of r.querySelectorAll('*')) { out.push(el); if (el.shadowRoot) st.push(el.shadowRoot); } } return out; };
  window.__up = el => el.parentElement || (el.getRootNode && el.getRootNode().host) || null;
  window.__txt = el => { let t = el.textContent || ''; for (const x of window.__deepAll(el)) if (x.shadowRoot) t += ' ' + x.shadowRoot.textContent; return t.replace(/\s+/g, ' ').trim(); };
  true;
`;

async function marcarDias(page) {
  await page.evaluate(DEEP);
  return page.evaluate((MESES) => {
    const all = window.__deepAll(document);
    all.forEach(x => { x.removeAttribute && x.removeAttribute('data-robo-dia'); x.removeAttribute && x.removeAttribute('data-robo-prox'); });
    const reT = /^(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)[a-zç]*\.?,?\s+(de\s+)?\d{4}$/i;
    const titulo = all.find(el => el.children.length === 0 && reT.test((el.textContent || '').trim()));
    if (!titulo) return { erro: 'mes_nao_encontrado' };
    const m = titulo.textContent.trim().match(/^([a-z]{3})[a-zç]*\.?,?\s+(?:de\s+)?(\d{4})$/i);
    const mes = MESES.indexOf(m[1].toLowerCase()), ano = +m[2];
    const ehDia = el => el.children.length === 0 && /^\d{1,2}$/.test((el.textContent || '').trim());
    let box = window.__up(titulo), k = 0;
    while (box && k < 12 && window.__deepAll(box).filter(ehDia).length < 28) { box = window.__up(box); k++; }
    if (!box) return { erro: 'calendario_nao_encontrado' };
    let head = window.__up(titulo), prox = null;
    for (let i = 0; i < 4 && head && !prox; i++) { const bs = window.__deepAll(head).filter(x => x.tagName === 'BUTTON' || x.getAttribute('role') === 'button'); if (bs.length >= 2) prox = bs[bs.length - 1]; head = window.__up(head); }
    if (prox) prox.setAttribute('data-robo-prox', '1');
    const cells = window.__deepAll(box).filter(ehDia);
    let fase = -1, ult = 0; const dias = [];
    for (const el of cells) {
      const n = +el.textContent.trim();
      if (fase === -1 && n === 1) fase = 0; else if (fase === 0 && n < ult) fase = 1;
      ult = n;
      if (fase !== 0) continue;
      let alvo = el; for (let i = 0; i < 3; i++) { if (alvo.tagName === 'BUTTON' || alvo.getAttribute('role') === 'button' || alvo.tagName === 'TD') break; const u = window.__up(alvo); if (!u) break; alvo = u; }
      if (!(alvo.tagName === 'BUTTON' || alvo.getAttribute('role') === 'button' || alvo.tagName === 'TD')) alvo = el;
      const st = getComputedStyle(el), stA = getComputedStyle(alvo);
      const desabilitado = alvo.disabled || alvo.getAttribute('aria-disabled') === 'true' || stA.pointerEvents === 'none' || /disabled/i.test(alvo.className || '');
      const negrito = Math.max(+st.fontWeight || 400, +stA.fontWeight || 400) >= 600;
      const iso = ano + '-' + String(mes + 1).padStart(2, '0') + '-' + String(n).padStart(2, '0');
      alvo.setAttribute('data-robo-dia', iso);
      dias.push({ iso, desabilitado, negrito });
    }
    return { ano, mes, dias };
  }, MESES);
}

async function lerHorariosDoDia(page) {
  await page.evaluate(DEEP);
  return page.evaluate(() => {
    const re = /^(\d{2}:\d{2})(\s*E)?$/;
    const vistos = new Map();
    for (const b of window.__deepAll(document.querySelector('main') || document.body)) {
      if (!(b.tagName === 'BUTTON' || b.getAttribute('role') === 'button')) continue;
      const m = window.__txt(b).match(re);
      if (m && !b.disabled && b.getAttribute('aria-disabled') !== 'true') vistos.set(m[1], vistos.get(m[1]) || !!m[2]);
    }
    return [...vistos.entries()].map(([h, e]) => ({ h, e }));
  });
}

// espera a busca terminar e, se aparecer a escolha de hospital, escolhe a unidade
async function prepararAgenda(page) {
  for (let i = 0; i < 3; i++) {
    await page.getByText(/sua busca pode demorar/i).first().waitFor({ state: 'hidden', timeout: 150000 }).catch(() => {});
    await espera(1500);
    const escolha = page.getByText(/selecione entre os hospitais/i).filter({ visible: true });
    if (!(await escolha.count())) return;
    log('escolhendo a unidade na lista de hospitais');
    await despejar(page, 'hospitais');
    const caixa = page.locator('cura-checkbox').filter({ hasText: new RegExp(CFG.unidade, 'i') });
    const caixa2 = page.locator('cura-checkbox[label*="' + CFG.unidade + '" i]');
    if (await caixa2.count()) await caixa2.first().click();
    else if (await caixa.count()) await caixa.first().click();
    else await page.locator('cura-checkbox[label="Selecionar Todos"]').first().click();
    await espera(800);
    await botaoProssiga(page);
    await espera(2000);
  }
}

async function lerAgenda(page) {
  const inicio = hojeSP(), fim = somaDias(inicio, CFG.dias);
  const slots = [], diasLidos = [];
  for (let mesN = 0; mesN < 4; mesN++) {
    const cal = await marcarDias(page);
    if (cal.erro) { await foto(page, 'calendario'); throw new Error('Calendário: ' + cal.erro); }
    let alvo = cal.dias.filter(d => d.iso >= inicio && d.iso <= fim && !d.desabilitado);
    if (alvo.some(d => d.negrito)) alvo = alvo.filter(d => d.negrito);
    log(`mês ${MESES[cal.mes]}/${cal.ano}: ${alvo.length} dia(s) para ler`);
    for (const d of alvo) {
      await page.locator(`[data-robo-dia="${d.iso}"]`).first().click({ timeout: 8000 }).catch(() => {});
      await espera(1600);
      const hs = await lerHorariosDoDia(page);
      diasLidos.push(d.iso + ':' + hs.length);
      hs.forEach(x => slots.push({ t: d.iso + 'T' + x.h, e: x.e }));
    }
    const ultimoDoMes = new Date(Date.UTC(cal.ano, cal.mes + 1, 0)).toISOString().slice(0, 10);
    if (ultimoDoMes >= fim) break;
    const prox = page.locator('[data-robo-prox]');
    if (!(await prox.count())) break;
    await prox.first().click().catch(() => {});
    await espera(2200);
  }
  return { inicio, fim, slots, diasLidos };
}

/* ---------- envio ---------- */
async function rpc(fn, body) {
  const r = await fetch(`${CFG.supabase_url}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: CFG.supabase_key, Authorization: `Bearer ${CFG.supabase_key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`${fn} ${r.status}: ${t.slice(0, 200)}`);
  return t ? JSON.parse(t) : null;
}

/* ---------- uma rodada ---------- */
let ctx;
async function rodada() {
  if (!ctx) {
    ctx = await chromium.launchPersistentContext(path.join(DIR, 'perfil'), {
      headless: !CFG.mostrar_navegador,
      viewport: { width: 1366, height: 860 },
      locale: 'pt-BR', timezoneId: 'America/Sao_Paulo',
      args: CFG.mostrar_navegador ? ['--start-minimized'] : []
    });
  }
  const page = await ctx.newPage();
  const frames = [];
  page.on('websocket', ws => ws.on('framereceived', f => { if (frames.length < 60) frames.push(String(f.payload).slice(0, 4000)); }));
  const t0 = Date.now();
  try {
    await chegarNaAgenda(page);
    await prepararAgenda(page);
    await foto(page, 'agenda');
    await despejar(page, 'agenda');
    const r = await lerAgenda(page);
    const res = await rpc('joice_ext_sync', { p_key: CFG.robo_key, p_from: r.inicio, p_to: r.fim, p_slots: r.slots, p_info: { versao: VERSAO, dias: r.diasLidos, seg: Math.round((Date.now() - t0) / 1000) } });
    log(`OK: ${r.slots.length} horário(s) livres de ${r.inicio} a ${r.fim} enviados (${res && res.slots} gravados).`);
    fs.writeFileSync(path.join(DEBUG, 'ultima-leitura.json'), JSON.stringify(r, null, 2));
  } catch (e) {
    log('ERRO:', e.message);
    await foto(page, 'erro-' + etapa(page));
    await despejar(page, 'erro-' + etapa(page));
    try { await rpc('joice_ext_error', { p_key: CFG.robo_key, p_error: e.message, p_info: { versao: VERSAO, etapa: etapa(page) } }); } catch (x) {}
  } finally {
    try { fs.writeFileSync(path.join(DEBUG, 'websocket.txt'), frames.join('\n\n----\n\n')); } catch (e) {}
    await page.close().catch(() => {});
  }
}

/* ---------- atualização automática ---------- */
async function atualizar() {
  try {
    const r = await fetch(URL_ATUALIZACAO + '?t=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) return false;
    const novo = await r.text();
    const atual = fs.readFileSync(__filename, 'utf8');
    if (!novo.includes('Robô espelho da agenda') || novo === atual) return false;
    const tmp = path.join(DIR, 'robo.novo.js');
    fs.writeFileSync(tmp, novo);
    const { spawnSync } = require('child_process');
    if (spawnSync(process.execPath, ['--check', tmp]).status !== 0) { fs.unlinkSync(tmp); return false; }
    fs.copyFileSync(__filename, path.join(DIR, 'robo.anterior.js'));
    fs.renameSync(tmp, __filename);
    const v = (novo.match(/const VERSAO = '([^']+)'/) || [])[1];
    log('Robô atualizado para a versão ' + v + '. Reiniciando...');
    const res = spawnSync(process.execPath, [__filename, ...process.argv.slice(2)], { stdio: 'inherit' });
    process.exit(res.status || 0);
  } catch (e) { return false; }
}

(async () => {
  await atualizar();
  log(`Robô da agenda iniciado (v${VERSAO}). Médica: ${CFG.medica} · ${CFG.unidade}`);
  if (!CFG.robo_key || /COLE/.test(CFG.robo_key)) { log('Falta a chave do robô no config.json.'); process.exit(1); }
  do {
    const h = +new Date().toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: 'America/Sao_Paulo' });
    if (UMA_VEZ || (h >= CFG.hora_inicio && h < CFG.hora_fim)) await rodada();
    else log('Fora do horário de leitura; aguardando.');
    if (UMA_VEZ) break;
    if (ctx) { await ctx.close().catch(() => {}); ctx = null; }
    await atualizar();
    await espera(CFG.intervalo_min * 60e3);
  } while (true);
  if (ctx) await ctx.close();
})();
