/* Estatísticas do site + aviso de cookies */
(function () {
  var CLARITY_ID = 'zb89u3m2s1';
  var W = window, D = document, N = navigator;
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function ssGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function ssSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  function rid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

  /* ---------- Clarity (somente com consentimento) ---------- */
  function loadClarity() {
    if (!CLARITY_ID || W.clarity) return;
    (function (c, l, a, r, i, t, y) { c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments) }; t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i; y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y); })(W, D, 'clarity', 'script', CLARITY_ID);
  }
  var inFrame = W.self !== W.top;
  var consent = lsGet('jc_consent');
  if (consent === '1' && !inFrame) loadClarity();
  if (!consent && !inFrame) {
    var css = '.ck{position:fixed;left:16px;bottom:16px;z-index:80;max-width:380px;background:#F5EDE2;color:#2F211A;border:1px solid rgba(162,107,68,.35);border-radius:18px;padding:18px 20px;box-shadow:0 24px 50px -20px rgba(47,33,26,.45);font:300 14px/1.55 Jost,system-ui,sans-serif;animation:ckIn .5s ease both}' +
      '.ck b{font:400 22px/1 "Pinyon Script",cursive;color:#A26B44;display:block;margin-bottom:6px}' +
      '.ck a{color:#A26B44}.ck .r{display:flex;gap:10px;margin-top:14px}.ck button{flex:1;border-radius:999px;padding:11px 14px;font:500 11px/1 Jost,sans-serif;letter-spacing:.14em;text-transform:uppercase;cursor:pointer;border:1px solid rgba(47,33,26,.3);background:transparent;color:#2F211A}' +
      '.ck button.y{background:#2F211A;color:#F5EDE2;border-color:#2F211A}@keyframes ckIn{from{opacity:0;transform:translateY(12px)}}@media(max-width:520px){.ck{left:12px;right:12px;bottom:84px;max-width:none}}';
    var st = D.createElement('style'); st.textContent = css; D.head.appendChild(st);
    var box = D.createElement('div'); box.className = 'ck'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Aviso de cookies');
    box.innerHTML = '<b>Cookies</b>Usamos cookies para entender como o site é usado e deixá-lo cada vez melhor. Saiba mais na <a href="/privacidade">política de privacidade</a>.<div class="r"><button type="button" class="n">Recusar</button><button type="button" class="y">Aceitar</button></div>';
    function close(v) { lsSet('jc_consent', v); box.remove(); if (v === '1') loadClarity(); }
    box.querySelector('.y').onclick = function () { close('1'); };
    box.querySelector('.n').onclick = function () { close('0'); };
    (D.body ? D.body.appendChild(box) : D.addEventListener('DOMContentLoaded', function () { D.body.appendChild(box); }));
  }

  /* ---------- estatísticas próprias (anônimas, sem cookies) ---------- */
  W.jcTrack = function () {};
  W.jcIds = function () { return { vid: lsGet('jc_v'), sid: ssGet('jc_s'), source: ssGet('jc_src') }; };
  if (inFrame || lsGet('jc_admin') === '1' || /bot|crawl|spider|headless/i.test(N.userAgent)) return;
  var vid = lsGet('jc_v'); if (!vid) { vid = rid(); lsSet('jc_v', vid); }
  var sid = ssGet('jc_s'); if (!sid) { sid = rid(); ssSet('jc_s', sid); }
  var q = [], sec = {}, dur = 0, depth = 0, last = Date.now();

  function source() {
    var p = new URLSearchParams(location.search), ua = N.userAgent, r = D.referrer || '';
    if (p.get('gclid') || p.get('gbraid') || p.get('wbraid') || /google/i.test(p.get('utm_source') || '') && /cpc|ads|paid/i.test(p.get('utm_medium') || '')) return 'google ads';
    var us = (p.get('utm_source') || '').toLowerCase();
    if (/instagram|ig/.test(us) || /Instagram/i.test(ua) || /instagram\.com/i.test(r)) return 'instagram';
    if (/facebook|fb/.test(us) || /FBAN|FBAV/i.test(ua) || /facebook\.com|fb\.me/i.test(r)) return 'facebook';
    if (/whatsapp/.test(us) || /whatsapp|wa\.me/i.test(r)) return 'whatsapp';
    if (/google\./i.test(r)) return 'google';
    if (/bing\.|yahoo\.|duckduckgo/i.test(r)) return 'outras buscas';
    if (us) return us.slice(0, 30);
    if (!r || r.indexOf(location.host) > -1) return 'direto';
    try { return new URL(r).hostname.replace(/^www\./, '').slice(0, 30); } catch (e) { return 'outros'; }
  }
  function send() {
    if (!q.length) return;
    var body = JSON.stringify(q.splice(0, q.length));
    if (!(N.sendBeacon && N.sendBeacon('/api/t', new Blob([body], { type: 'text/plain' })))) {
      try { fetch('/api/t', { method: 'POST', body: body, keepalive: true }); } catch (e) {}
    }
  }
  function base(t) { return { type: t, vid: vid, sid: sid, path: location.pathname }; }

  var v = base('view'); v.ref = (D.referrer || '').slice(0, 300); v.source = ssGet('jc_src') || source(); ssSet('jc_src', v.source);
  q.push(v); setTimeout(send, 1200);

  function secAt(y) {
    var el = D.elementFromPoint(W.innerWidth / 2, y);
    el = el && el.closest ? el.closest('[data-sec]') : null;
    return el ? el.getAttribute('data-sec') : null;
  }
  ['scroll', 'mousemove', 'touchstart', 'keydown', 'click'].forEach(function (e) { W.addEventListener(e, function () { last = Date.now(); }, { passive: true }); });
  setInterval(function () {
    if (D.visibilityState !== 'visible' || Date.now() - last > 30000) return;
    dur += 1000;
    var s = secAt(W.innerHeight * 0.45); if (s) sec[s] = (sec[s] || 0) + 1000;
    var h = Math.max(D.documentElement.scrollHeight, 1);
    depth = Math.max(depth, Math.min(100, Math.round((W.scrollY + W.innerHeight) / h * 100)));
  }, 1000);

  D.addEventListener('click', function (e) {
    var s = e.target.closest && e.target.closest('[data-sec]'); if (!s) return;
    var r = s.getBoundingClientRect(), a = e.target.closest('a,button');
    var ed = e.target.closest('[data-edit]'), label;
    if (a) label = (a.textContent || a.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
    else if (e.target.tagName === 'IMG') label = 'Foto: ' + (e.target.getAttribute('alt') || '').slice(0, 50);
    else if (ed) label = (ed.textContent || '').replace(/\s+/g, ' ').trim();
    var lead = !!(a && a.href && /instagram\.com|wa\.me|whatsapp|api\.whatsapp|tel:|doctoralia|agend/i.test(a.href) && a.href.indexOf(location.host) < 0);
    var c = base('click');
    c.section = s.getAttribute('data-sec');
    c.rx = Math.round((e.clientX - r.left) / r.width * 1000) / 1000;
    c.ry = Math.round((e.clientY - r.top) / r.height * 1000) / 1000;
    c.target = (label || '').slice(0, 80) || null; c.is_lead = lead;
    q.push(c);
    if (lead || q.length >= 10) { leave(); }
  }, true);

  W.jcTrack = function (label, isLead, secId) {
    var c = base('click'); c.section = secId || null; c.target = String(label || '').slice(0, 80); c.is_lead = !!isLead;
    q.push(c); leave();
  };
  function leave() {
    var l = base('leave'); l.dur_ms = dur; l.depth = depth; l.data = { sec: sec };
    q.push(l); send();
  }
  D.addEventListener('visibilitychange', function () { if (D.visibilityState === 'hidden') leave(); });
  W.addEventListener('pagehide', leave);
})();
