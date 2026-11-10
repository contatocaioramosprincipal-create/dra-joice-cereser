/* Pedido de agendamento e guia gratuito — Dra. Joice Cereser */
(function () {
  'use strict';
  var D = document, W = window;
  var cfg = { whatsapp: '', instagram: 'dra.joicecereser', horarios: { dias: ['seg', 'ter', 'qua', 'qui', 'sex'], periodos: ['manhã', 'tarde'] } };
  fetch('/api/config').then(function (r) { return r.json(); }).then(function (c) {
    if (c && c.horarios) cfg.horarios = c.horarios;
    if (c && c.whatsapp) cfg.whatsapp = c.whatsapp;
    if (c && c.instagram) cfg.instagram = c.instagram;
  }).catch(function () {});

  var DIAS = { seg: 'Segunda', ter: 'Terça', qua: 'Quarta', qui: 'Quinta', sex: 'Sexta', sab: 'Sábado' };
  var IDADES = ['Até 6 meses', '6 a 12 meses', '1 a 2 anos', '2 a 3 anos', '3 a 5 anos', '5 a 10 anos', 'Acima de 10 anos'];
  var MOTIVOS = ['Consulta de rotina', 'Avaliação do desenvolvimento', 'Atraso na fala', 'Sinais de autismo (TEA)', 'Desatenção ou agitação (TDAH)', 'Comportamento', 'Sono ou alimentação', 'Outro motivo'];

  var css = '' +
    '.jm-ov{position:fixed;inset:0;z-index:90;background:rgba(47,33,26,.55);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:16px;opacity:0;transition:opacity .25s}' +
    '.jm-ov.on{opacity:1}' +
    '.jm{position:relative;width:min(560px,100%);max-height:calc(100dvh - 32px);overflow:auto;background:#F5EDE2;border-radius:28px;box-shadow:0 40px 90px -30px rgba(47,33,26,.7);color:#2F211A;font:300 16px/1.6 Jost,system-ui,sans-serif;transform:translateY(14px);transition:transform .3s cubic-bezier(.2,.8,.2,1)}' +
    '.jm-ov.on .jm{transform:none}' +
    '.jm-top{position:relative;padding:30px 30px 10px;background:#EADBC6;border-radius:28px 28px 0 0;overflow:hidden}' +
    '.jm-top svg.arc{position:absolute;right:-40px;top:-30px;width:220px;opacity:.5}' +
    '.jm-s{font:400 30px/1 "Pinyon Script",cursive;color:#A26B44}' +
    '.jm h2{font:400 32px/1.08 "Cormorant Garamond",Georgia,serif;margin:4px 0 0;color:#2F211A}.jm h2 em{color:#A26B44}' +
    '.jm-steps{display:flex;gap:6px;margin:18px 0 6px}.jm-steps i{flex:1;height:3px;border-radius:9px;background:rgba(47,33,26,.15)}.jm-steps i.on{background:#A26B44}' +
    '.jm-x{position:absolute;right:16px;top:16px;width:40px;height:40px;border-radius:50%;border:0;background:rgba(245,237,226,.8);color:#2F211A;font-size:22px;line-height:1;cursor:pointer;z-index:2}' +
    '.jm-b{padding:22px 30px 28px}' +
    '.jm-l{display:block;font:500 11px/1 Jost,sans-serif;letter-spacing:.24em;text-transform:uppercase;color:#8A7566;margin:18px 0 12px}' +
    '.jm-l:first-child{margin-top:0}' +
    '.jm-ch{display:flex;flex-wrap:wrap;gap:8px}' +
    '.jm-ch button{border:1px solid rgba(47,33,26,.2);background:#FBF6EF;border-radius:999px;padding:10px 15px;font:400 14px/1.2 Jost,sans-serif;color:#5A463A;cursor:pointer;transition:all .15s}' +
    '.jm-ch button:hover{border-color:#A26B44}.jm-ch button[aria-pressed="true"]{background:#2F211A;border-color:#2F211A;color:#F5EDE2}' +
    '.jm input[type=text],.jm input[type=tel],.jm textarea{width:100%;box-sizing:border-box;border:1px solid rgba(47,33,26,.2);background:#FBF6EF;border-radius:14px;padding:13px 15px;font:400 16px/1.4 Jost,sans-serif;color:#2F211A;resize:vertical}' +
    '.jm input:focus,.jm textarea:focus{outline:none;border-color:#A26B44;box-shadow:0 0 0 4px rgba(162,107,68,.14)}' +
    '.jm-f{margin-bottom:14px}.jm-f span{display:block;font:500 11px/1 Jost,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#8A7566;margin-bottom:8px}' +
    '.jm-ok{display:flex;gap:10px;align-items:flex-start;font-size:13.5px;line-height:1.5;color:#5A463A;margin:6px 0 4px}.jm-ok input{margin-top:3px;accent-color:#A26B44;width:18px;height:18px;flex:none}.jm-ok a{color:#A26B44}' +
    '.jm-act{display:flex;gap:10px;justify-content:space-between;align-items:center;margin-top:24px}' +
    '.jm-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;border:0;border-radius:999px;padding:15px 26px;font:500 12.5px/1 Jost,sans-serif;letter-spacing:.14em;text-transform:uppercase;cursor:pointer;text-decoration:none;transition:background .2s,opacity .2s}' +
    '.jm-btn.p{background:#2F211A;color:#F5EDE2}.jm-btn.p:hover{background:#A26B44}.jm-btn.p:disabled{opacity:.35;cursor:default;background:#2F211A}' +
    '.jm-btn.g{background:transparent;color:#5A463A;padding-left:0}.jm-btn.w{background:#A26B44;color:#fff}' +
    '.jm-err{color:#9B3B2E;font-size:14px;min-height:20px;margin-top:10px}' +
    '.jm-done{text-align:center;padding:10px 0 6px}.jm-done .ic{width:74px;height:74px;margin:0 auto 14px;border-radius:50%;background:#DCE0D0;display:grid;place-items:center;color:#5B5A3C}' +
    '.jm-done p{color:#5A463A;margin:10px auto 0;max-width:26em}.jm-done .jm-btn{margin-top:22px}' +
    '.jm-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}' +
    '.jm-note{font-size:13px;color:#8A7566;margin-top:10px}' +
    '@media(max-width:520px){.jm{border-radius:24px}.jm-top{padding:26px 22px 8px}.jm-b{padding:18px 22px 24px}.jm h2{font-size:28px}}';
  var st = D.createElement('style'); st.textContent = css; D.head.appendChild(st);

  var ARC = '<svg class="arc" viewBox="0 0 300 300" fill="none" stroke="#A26B44" stroke-width="1.2"><path d="M30 300V170a120 120 0 0 1 240 0V300"/><path d="M60 300V175a90 90 0 0 1 180 0V300" opacity=".6"/><path d="M90 300V180a60 60 0 0 1 120 0V300" opacity=".35"/></svg>';
  var CHECK = '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function chips(name, list, multi) { return '<div class="jm-ch" data-name="' + name + '"' + (multi ? ' data-multi="1"' : '') + '>' + list.map(function (x) { return '<button type="button" aria-pressed="false" data-v="' + esc(x) + '">' + esc(x) + '</button>'; }).join('') + '</div>'; }
  function maskPhone(v) { v = v.replace(/\D/g, '').slice(0, 11); if (v.length > 10) return '(' + v.slice(0, 2) + ') ' + v.slice(2, 7) + '-' + v.slice(7); if (v.length > 6) return '(' + v.slice(0, 2) + ') ' + v.slice(2, 6) + '-' + v.slice(6); if (v.length > 2) return '(' + v.slice(0, 2) + ') ' + v.slice(2); return v; }
  function track(label) { try { W.jcTrack && W.jcTrack(label, true); } catch (e) {} }
  function ids() { try { return W.jcIds ? W.jcIds() : {}; } catch (e) { return {}; } }
  function waLink(text) { var n = String(cfg.whatsapp || '').replace(/\D/g, ''); if (!n) return ''; if (n.length <= 11) n = '55' + n; return 'https://wa.me/' + n + '?text=' + encodeURIComponent(text); }

  var ov, box, lastFocus;
  function open(html, onReady) {
    close(true);
    lastFocus = D.activeElement;
    ov = D.createElement('div'); ov.className = 'jm-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
    ov.innerHTML = '<div class="jm"><button class="jm-x" aria-label="Fechar">×</button>' + html + '</div>';
    D.body.appendChild(ov); D.documentElement.style.overflow = 'hidden';
    box = ov.querySelector('.jm');
    requestAnimationFrame(function () { ov.classList.add('on'); });
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    ov.querySelector('.jm-x').onclick = function () { close(); };
    D.addEventListener('keydown', onKey);
    onReady && onReady(box);
  }
  function onKey(e) { if (e.key === 'Escape') close(); }
  function close(now) {
    if (!ov) return; var o = ov; ov = null; D.removeEventListener('keydown', onKey);
    D.documentElement.style.overflow = '';
    if (now) { o.remove(); return; }
    o.classList.remove('on'); setTimeout(function () { o.remove(); }, 250);
    if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) {}
  }
  function bindChips(root, state) {
    root.querySelectorAll('.jm-ch').forEach(function (g) {
      var name = g.dataset.name, multi = !!g.dataset.multi;
      g.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        if (multi) { b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); state[name] = [].slice.call(g.querySelectorAll('[aria-pressed="true"]')).map(function (x) { return x.dataset.v; }); }
        else { g.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); state[name] = b.dataset.v; }
        if (state._onchange) state._onchange();
      });
      var pre = state[name];
      if (pre) g.querySelectorAll('button').forEach(function (x) { if ((multi ? pre.indexOf(x.dataset.v) > -1 : x.dataset.v === pre)) x.setAttribute('aria-pressed', 'true'); });
    });
  }
  function post(data) {
    return fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { return r.json(); });
  }

  /* ---------------- AGENDAMENTO ---------------- */
  function agendar(opts) {
    opts = opts || {};
    var s = { idade: opts.idade || '', motivo: opts.motivo || '', dias: [], periodos: [], step: 1 };
    var dias = (cfg.horarios.dias || []).map(function (d) { return DIAS[d] || d; });
    var pers = (cfg.horarios.periodos || []).map(function (p) { return p.charAt(0).toUpperCase() + p.slice(1); });
    var html = '<div class="jm-top">' + ARC + '<div class="jm-s">Vamos cuidar juntos</div><h2 id="jmT">Pedir um <em>horário</em></h2><div class="jm-steps"><i class="on"></i><i></i><i></i></div></div><div class="jm-b"></div>';
    open(html, function (b) { render(b); });
    function render(b) {
      var body = b.querySelector('.jm-b'), bars = b.querySelectorAll('.jm-steps i');
      bars.forEach(function (x, i) { x.classList.toggle('on', i < s.step); });
      if (s.step === 1) {
        body.innerHTML = '<span class="jm-l">Idade da criança</span>' + chips('idade', IDADES) +
          '<span class="jm-l">Motivo da consulta</span>' + chips('motivo', MOTIVOS) +
          '<span class="jm-l">Quer contar um pouco mais? (opcional)</span><textarea id="jmDet" rows="2" maxlength="600" placeholder="Ex.: ele tem 2 anos e ainda fala poucas palavras">' + esc(s.det || '') + '</textarea>' +
          '<div class="jm-act"><span></span><button class="jm-btn p" id="jmN" disabled>Continuar</button></div>';
        s._onchange = function () { body.querySelector('#jmN').disabled = !(s.idade && s.motivo); };
        bindChips(body, s); s._onchange();
        body.querySelector('#jmN').onclick = function () { s.det = body.querySelector('#jmDet').value; s.step = 2; render(b); };
      } else if (s.step === 2) {
        body.innerHTML = '<span class="jm-l">Dias que ficam melhor para você</span>' + chips('dias', dias, true) +
          '<span class="jm-l">Período</span>' + chips('periodos', pers, true) +
          '<p class="jm-note">A equipe confirma com você o dia e o horário disponíveis. Se não tiver preferência, é só continuar.</p>' +
          '<div class="jm-act"><button class="jm-btn g" id="jmB">← Voltar</button><button class="jm-btn p" id="jmN">Continuar</button></div>';
        s._onchange = null; bindChips(body, s);
        body.querySelector('#jmB').onclick = function () { s.step = 1; render(b); };
        body.querySelector('#jmN').onclick = function () { s.step = 3; render(b); };
      } else if (s.step === 3) {
        body.innerHTML = '<label class="jm-f"><span>Seu nome</span><input type="text" id="jmNome" autocomplete="name" maxlength="80" value="' + esc(s.nome || '') + '"></label>' +
          '<label class="jm-f"><span>Seu WhatsApp</span><input type="tel" id="jmTel" autocomplete="tel" inputmode="tel" placeholder="(15) 99999-9999" value="' + esc(s.tel || '') + '"></label>' +
          '<input class="jm-hp" type="text" id="jmHp" tabindex="-1" autocomplete="off" aria-hidden="true">' +
          '<label class="jm-ok"><input type="checkbox" id="jmOk"><span>Autorizo a equipe da Dra. Joice a entrar em contato pelo WhatsApp sobre este pedido. Meus dados ficam protegidos, conforme a <a href="/privacidade" target="_blank">política de privacidade</a>.</span></label>' +
          '<div class="jm-err" id="jmErr" role="alert"></div>' +
          '<div class="jm-act"><button class="jm-btn g" id="jmB">← Voltar</button><button class="jm-btn p" id="jmN">Enviar pedido</button></div>';
        var tel = body.querySelector('#jmTel'); tel.addEventListener('input', function () { tel.value = maskPhone(tel.value); });
        body.querySelector('#jmB').onclick = function () { s.nome = body.querySelector('#jmNome').value; s.tel = tel.value; s.step = 2; render(b); };
        body.querySelector('#jmN').onclick = function () {
          var btn = this, err = body.querySelector('#jmErr'); err.textContent = '';
          s.nome = body.querySelector('#jmNome').value.trim(); s.tel = tel.value;
          if (s.nome.length < 2) { err.textContent = 'Escreva seu nome.'; return; }
          if (tel.value.replace(/\D/g, '').length < 10) { err.textContent = 'Confira o número de WhatsApp (com DDD).'; return; }
          if (!body.querySelector('#jmOk').checked) { err.textContent = 'Marque a autorização para podermos entrar em contato.'; return; }
          btn.disabled = true; btn.textContent = 'Enviando…';
          var i = ids(), pref = [s.dias.join(', '), s.periodos.join(', ')].filter(Boolean).join(' · ');
          post({ kind: 'agendamento', parent_name: s.nome, phone: tel.value, child_age: s.idade, reason: s.motivo, details: s.det, prefer: pref, consent: true, website: body.querySelector('#jmHp').value, vid: i.vid, sid: i.sid, source: i.source, data: opts.data || null })
            .then(function (r) {
              if (!r.ok) throw new Error(r.error);
              track('Pedido de agendamento enviado');
              s.step = 4; render(b);
            }).catch(function (e) { err.textContent = e.message || 'Não foi possível enviar agora. Tente de novo.'; btn.disabled = false; btn.textContent = 'Enviar pedido'; });
        };
      } else {
        b.querySelector('#jmT').innerHTML = 'Pedido <em>recebido</em>';
        var msg = 'Olá! Acabei de pedir um horário pelo site da Dra. Joice. Sou ' + s.nome + '. Criança: ' + s.idade + '. Motivo: ' + s.motivo + '.';
        var wa = waLink(msg);
        body.innerHTML = '<div class="jm-done"><div class="ic">' + CHECK + '</div><h2>Obrigada, <em>' + esc(s.nome.split(' ')[0]) + '</em>.</h2>' +
          '<p>A equipe da Dra. Joice vai chamar você no WhatsApp para confirmar o dia e o horário da consulta.</p>' +
          (wa ? '<a class="jm-btn w" href="' + wa + '" target="_blank" rel="noopener">Prefiro chamar agora no WhatsApp</a>' :
            '<a class="jm-btn w" href="https://www.instagram.com/' + esc(cfg.instagram) + '/" target="_blank" rel="noopener">Falar também pelo Instagram</a>') +
          '<div><button class="jm-btn g" id="jmC" style="margin:12px auto 0;padding-left:26px">Fechar</button></div></div>';
        body.querySelector('#jmC').onclick = function () { close(); };
      }
    }
  }

  /* ---------------- GUIA GRATUITO ---------------- */
  var GUIA = '/guia/os-primeiros-sinais.pdf';
  function guia() {
    var html = '<div class="jm-top">' + ARC + '<div class="jm-s">Guia gratuito</div><h2 id="jmT">Os primeiros <em>sinais</em></h2><p style="margin:8px 0 14px;color:#5A463A;max-width:24em">O que observar no desenvolvimento do seu filho, mês a mês, e quando vale conversar com a pediatra.</p></div><div class="jm-b">' +
      '<label class="jm-f"><span>Seu nome</span><input type="text" id="jmNome" autocomplete="name" maxlength="80"></label>' +
      '<label class="jm-f"><span>Seu WhatsApp</span><input type="tel" id="jmTel" autocomplete="tel" inputmode="tel" placeholder="(15) 99999-9999"></label>' +
      '<input class="jm-hp" type="text" id="jmHp" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<label class="jm-ok"><input type="checkbox" id="jmOk"><span>Quero receber o guia e conteúdos da Dra. Joice pelo WhatsApp. Posso pedir para sair quando quiser. <a href="/privacidade" target="_blank">Privacidade</a>.</span></label>' +
      '<div class="jm-err" id="jmErr" role="alert"></div><div class="jm-act"><span></span><button class="jm-btn p" id="jmN">Baixar o guia</button></div></div>';
    open(html, function (b) {
      var tel = b.querySelector('#jmTel'); tel.addEventListener('input', function () { tel.value = maskPhone(tel.value); });
      b.querySelector('#jmN').onclick = function () {
        var btn = this, err = b.querySelector('#jmErr'), nome = b.querySelector('#jmNome').value.trim(); err.textContent = '';
        if (nome.length < 2) { err.textContent = 'Escreva seu nome.'; return; }
        if (tel.value.replace(/\D/g, '').length < 10) { err.textContent = 'Confira o número de WhatsApp (com DDD).'; return; }
        if (!b.querySelector('#jmOk').checked) { err.textContent = 'Marque a autorização para receber o guia.'; return; }
        btn.disabled = true; btn.textContent = 'Enviando…';
        var i = ids();
        post({ kind: 'guia', parent_name: nome, phone: tel.value, reason: 'Guia: Os primeiros sinais', consent: true, website: b.querySelector('#jmHp').value, vid: i.vid, sid: i.sid, source: i.source })
          .then(function (r) {
            if (!r.ok) throw new Error(r.error);
            track('Guia gratuito baixado');
            b.querySelector('#jmT').innerHTML = 'Seu guia está <em>pronto</em>';
            b.querySelector('.jm-b').innerHTML = '<div class="jm-done"><div class="ic">' + CHECK + '</div><p>Obrigada, ' + esc(nome.split(' ')[0]) + '! O download começou. Se não abrir, toque no botão abaixo.</p><a class="jm-btn w" href="' + GUIA + '" download>Baixar o guia (PDF)</a><div><button class="jm-btn g" id="jmA" style="margin:14px auto 0;padding-left:26px">Quero agendar uma consulta</button></div></div>';
            b.querySelector('#jmA').onclick = function () { agendar(); };
            var a = D.createElement('a'); a.href = GUIA; a.download = ''; D.body.appendChild(a); a.click(); a.remove();
          }).catch(function (e) { err.textContent = e.message || 'Não foi possível enviar agora.'; btn.disabled = false; btn.textContent = 'Baixar o guia'; });
      };
    });
  }

  W.jcAgendar = agendar; W.jcGuia = guia;
  D.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-agendar],a[href="#agendar"],a[href="/#agendar"],[data-guia]');
    if (!a) return;
    if (a.closest('[contenteditable="true"]')) return;
    if (W.self !== W.top) return; // dentro do painel
    e.preventDefault();
    if (a.hasAttribute('data-guia')) guia();
    else agendar({ motivo: a.getAttribute('data-motivo') || '', idade: a.getAttribute('data-idade') || '' });
  });
  if (/[?&]agendar=1/.test(location.search)) setTimeout(function () { agendar(); }, 400);
})();
