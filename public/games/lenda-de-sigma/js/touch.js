'use strict';
// =====================================================================
//  Controles de toque (celular e tablet): direcional flutuante na metade
//  esquerda da tela, botões X/Z/C/Q à direita (as mesmas teclas citadas
//  pelos textos do jogo), menu, mapa e tela cheia no topo. Tocar no lado
//  direito durante diálogos e menus confirma. Os estados entram em
//  G.input como se fossem um controle (pad), inclusive "segurar".
// =====================================================================
(function (G) {
  const I = G.input;
  const T = G.touch = { state: {}, tapped: {}, prev: {}, on: false, mode: 'auto', stickId: null, btnPtr: {} };
  const BTN = [
    { id: 'a', key: 'X', cap: 'ação', acts: ['a', 'confirm'] },
    { id: 'b', key: 'Z', cap: 'pular', acts: ['b', 'cancel'] },
    { id: 'c', key: 'C', cap: 'item', acts: ['c'] },
    { id: 'sw', key: 'Q', cap: 'trocar', acts: ['sw'] },
    { id: 'start', key: '☰', cap: 'menu', acts: ['start'] },
    { id: 'map', key: 'M', cap: 'mapa', acts: ['map'] },
    { id: 'fs', key: '⛶', cap: 'tela', acts: [] }
  ];

  // integra com a entrada do jogo (depois dos controles físicos)
  const poll0 = I.poll.bind(I);
  I.poll = function () {
    poll0();
    const t = T.state, tp = T.tapped;
    for (const a in t) if (t[a]) this.pad[a] = true;
    for (const a of new Set(Object.keys(t).concat(Object.keys(tp)))) {
      if ((t[a] || tp[a]) && !T.prev[a]) { this.hit[a] = true; this.anyHit = true; }
    }
    T.prev = Object.assign({}, t); T.tapped = {};
  };

  // ------------------------------------------------------------------
  //  DOM
  // ------------------------------------------------------------------
  const css = `
  #tc { position: fixed; inset: 0; z-index: 10; display: none; touch-action: none; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; }
  body.tc-on #tc { display: block; }
  body.tc-on { touch-action: none; }
  body.tc-on.tc-portrait { align-items: flex-start; }
  body.tc-on.tc-portrait canvas#game { margin-top: max(10px, env(safe-area-inset-top)); }
  .tc-b { position: absolute; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center;
    background: radial-gradient(circle at 35% 30%, rgba(160,150,255,0.30), rgba(40,30,90,0.30)); border: 2px solid rgba(220,215,255,0.45);
    color: rgba(255,255,255,0.92); font: bold 5.2vmin monospace; text-shadow: 0 1px 2px #000; box-shadow: 0 2px 10px rgba(0,0,0,0.35); }
  .tc-b small { font: 2.3vmin monospace; opacity: 0.8; margin-top: 0.2vmin; }
  .tc-b.on { background: radial-gradient(circle at 35% 30%, rgba(255,230,140,0.55), rgba(140,90,20,0.45)); border-color: rgba(255,230,140,0.9); transform: scale(0.94); }
  .tc-b.big { font-size: 7vmin; }
  .tc-top { position: relative !important; border-radius: 2.2vmin; font-size: 4vmin; width: 11vmin; height: 8vmin; margin: 0 1vmin; }
  #tc-topbar { position: absolute; display: flex; left: 50%; top: 2vmin; transform: translateX(-50%); }
  #tc-rot { position: absolute; left: 0; right: 0; text-align: center; color: rgba(200,195,240,0.45); font: 3vmin monospace; pointer-events: none; display: none; }
  body.tc-portrait #tc-rot { display: block; }
  #tc-stick { position: absolute; width: 28vmin; height: 28vmin; margin: -14vmin 0 0 -14vmin; border-radius: 50%; display: none;
    background: radial-gradient(circle, rgba(120,110,220,0.10), rgba(120,110,220,0.22)); border: 2px solid rgba(220,215,255,0.35); }
  #tc-knob { position: absolute; left: 50%; top: 50%; width: 12vmin; height: 12vmin; margin: -6vmin 0 0 -6vmin; border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, rgba(255,255,255,0.6), rgba(150,140,255,0.45)); border: 2px solid rgba(255,255,255,0.6); }
  #tc-hint { position: absolute; left: 6vmin; bottom: 8vmin; width: 22vmin; height: 22vmin; border-radius: 50%; border: 2px dashed rgba(220,215,255,0.22);
    color: rgba(220,215,255,0.35); font: 2.6vmin monospace; display: flex; align-items: center; justify-content: center; text-align: center; pointer-events: none; }
  `;
  const LAYOUT = {
    a: 'right:4vmin; bottom:9vmin; width:18vmin; height:18vmin;',
    b: 'right:24vmin; bottom:3vmin; width:14vmin; height:14vmin;',
    c: 'right:5vmin; bottom:30vmin; width:14vmin; height:14vmin;',
    sw: 'right:22vmin; bottom:20vmin; width:10.5vmin; height:10.5vmin;',
    start: '', map: '', fs: ''
  };
  let root, stick, knob, hint;
  const els = {};
  function build() {
    if (root) return;
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    root = document.createElement('div'); root.id = 'tc';
    hint = document.createElement('div'); hint.id = 'tc-hint'; hint.textContent = 'arraste para andar'; root.appendChild(hint);
    stick = document.createElement('div'); stick.id = 'tc-stick'; knob = document.createElement('div'); knob.id = 'tc-knob'; stick.appendChild(knob); root.appendChild(stick);
    const bar = document.createElement('div'); bar.id = 'tc-topbar'; root.appendChild(bar);
    const rot = document.createElement('div'); rot.id = 'tc-rot'; rot.textContent = 'dica: deite o aparelho para uma tela maior'; root.appendChild(rot);
    for (const b of ['fs', 'map', 'start'].map(id => BTN.find(q => q.id === id)).concat(BTN.filter(q => !['fs', 'map', 'start'].includes(q.id)))) {
      const e = document.createElement('div');
      e.className = 'tc-b' + (b.id === 'a' ? ' big' : '') + (['start', 'map', 'fs'].includes(b.id) ? ' tc-top' : '');
      e.style.cssText = LAYOUT[b.id]; e.dataset.id = b.id;
      e.innerHTML = b.key + '<small>' + b.cap + '</small>';
      (['start', 'map', 'fs'].includes(b.id) ? bar : root).appendChild(e); els[b.id] = e;
    }
    document.body.appendChild(root);
    root.addEventListener('pointerdown', down, { passive: false });
    root.addEventListener('pointermove', move, { passive: false });
    root.addEventListener('pointerup', up, { passive: false });
    root.addEventListener('pointercancel', up, { passive: false });
    root.addEventListener('contextmenu', e => e.preventDefault());
  }
  const btnAt = (x, y) => { const e = document.elementFromPoint(x, y); const b = e && e.closest && e.closest('.tc-b'); return b ? b.dataset.id : null; };
  function recompute() {
    const s = {};
    for (const pid in T.btnPtr) { const b = BTN.find(q => q.id === T.btnPtr[pid]); if (b) for (const a of b.acts) s[a] = true; }
    if (T.stickId !== null) Object.assign(s, T.dirs || {});
    T.state = s;
    for (const b of BTN) els[b.id] && els[b.id].classList.toggle('on', Object.values(T.btnPtr).includes(b.id));
  }
  function setStick(x, y) {
    const R = Math.min(innerWidth, innerHeight) * 0.13, dx = x - T.sx, dy = y - T.sy, d = Math.hypot(dx, dy), k = d > R ? R / d : 1;
    knob.style.transform = 'translate(' + dx * k + 'px,' + dy * k + 'px)';
    const th = R * 0.36;
    T.dirs = { left: dx < -th, right: dx > th, up: dy < -th, down: dy > th };
    // na diagonal fraca, fica só o eixo dominante (melhor para menus)
    if (Math.abs(dx) > Math.abs(dy) * 2.2) { T.dirs.up = T.dirs.down = false; } else if (Math.abs(dy) > Math.abs(dx) * 2.2) { T.dirs.left = T.dirs.right = false; }
  }
  function down(e) {
    e.preventDefault();
    if (G.audio) G.audio.init();
    const id = btnAt(e.clientX, e.clientY);
    if (id) {
      if (id === 'fs') { toggleFS(); return; }
      T.btnPtr[e.pointerId] = id;
      const b = BTN.find(q => q.id === id); for (const a of b.acts) T.tapped[a] = true;
      if (navigator.vibrate) try { navigator.vibrate(8); } catch (er) { }
      recompute(); return;
    }
    if (e.clientX < innerWidth * 0.5 && T.stickId === null) {
      T.stickId = e.pointerId; T.sx = e.clientX; T.sy = e.clientY;
      stick.style.left = T.sx + 'px'; stick.style.top = T.sy + 'px'; stick.style.display = 'block'; hint.style.display = 'none';
      setStick(e.clientX, e.clientY); recompute(); return;
    }
    // toque livre: confirma diálogos, menus e telas de título
    if (G.state !== 'play' || (G.ui && G.ui.blocking())) T.tapped.confirm = true;
  }
  function move(e) {
    if (e.pointerId === T.stickId) { e.preventDefault(); setStick(e.clientX, e.clientY); recompute(); return; }
    if (T.btnPtr[e.pointerId] !== undefined) {
      const id = btnAt(e.clientX, e.clientY);
      if (id && id !== 'fs' && id !== T.btnPtr[e.pointerId]) { T.btnPtr[e.pointerId] = id; const b = BTN.find(q => q.id === id); for (const a of b.acts) T.tapped[a] = true; recompute(); }
    }
  }
  function up(e) {
    if (e.pointerId === T.stickId) { T.stickId = null; T.dirs = {}; stick.style.display = 'none'; knob.style.transform = ''; }
    delete T.btnPtr[e.pointerId];
    recompute();
  }
  function toggleFS() {
    if (G.toggleFullscreen) G.toggleFullscreen();
    setTimeout(() => { try { if (document.fullscreenElement && screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => { }); } catch (er) { } }, 300);
  }
  function layout() {
    const portrait = innerHeight > innerWidth;
    document.body.classList.toggle('tc-portrait', !!portrait);
    requestAnimationFrame(() => {
      const bar = document.getElementById('tc-topbar'), rot = document.getElementById('tc-rot'); if (!bar || !G.canvasEl) return;
      const r = G.canvasEl.getBoundingClientRect();
      if (portrait) { bar.style.top = (r.bottom + 10) + 'px'; rot.style.top = (r.bottom + 10 + Math.min(innerWidth, innerHeight) * 0.11) + 'px'; }
      else bar.style.top = '2vmin';
    });
  }
  T.setMode = function (m) { T.mode = m; T.apply(); };
  T.apply = function () {
    build();
    const show = T.mode === 'on' || (T.mode === 'auto' && !!T.seenTouch);
    T.on = show; document.body.classList.toggle('tc-on', show); layout();
    if (!show) { T.btnPtr = {}; T.stickId = null; T.state = {}; }
    if (G.canvasEl) window.dispatchEvent(new Event('resize'));
  };
  T.modeLabel = () => ({ auto: 'automático', on: 'sempre', off: 'nunca' })[T.mode];
  T.cycle = () => { T.setMode({ auto: 'on', on: 'off', off: 'auto' }[T.mode]); };
  // descobre telas de toque
  addEventListener('pointerdown', e => { if (e.pointerType === 'touch' && !T.seenTouch) { T.seenTouch = true; if (T.mode === 'auto') T.apply(); if (G.audio) G.audio.init(); } }, true);
  addEventListener('touchstart', () => { if (!T.seenTouch) { T.seenTouch = true; if (T.mode === 'auto') T.apply(); } }, { passive: true, capture: true });
  addEventListener('resize', layout);
  addEventListener('load', () => {
    if (window.matchMedia && matchMedia('(pointer: coarse)').matches && (navigator.maxTouchPoints || 0) > 0) T.seenTouch = true;
    T.apply();
  });
})(window.G);
