'use strict';
// =====================================================================
//  A LENDA DE SIGMA — núcleo: constantes, matemática, aleatoriedade,
//  entrada (teclado/controle), temporizadores e partículas.
// =====================================================================
window.G = {};
(function (G) {
  G.W = 384; G.H = 216; G.TS = 16; G.DT = 1 / 60;
  G.time = 0;          // tempo de jogo (s)
  G.frame = 0;

  // ---------- matemática ----------
  G.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  G.lerp = (a, b, t) => a + (b - a) * t;
  G.approach = (v, t, s) => (v < t ? Math.min(v + s, t) : Math.max(v - s, t));
  G.sign = v => (v < 0 ? -1 : v > 0 ? 1 : 0);
  G.dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
  G.overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  G.DIRS = [{ x: 0, y: 1 }, { x: 0, y: -1 }, { x: -1, y: 0 }, { x: 1, y: 0 }]; // baixo, cima, esq, dir
  G.dirFrom = (dx, dy) => (Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : (dy < 0 ? 1 : 0));

  // ---------- aleatoriedade ----------
  G.ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  G.rf = (a, b) => a + Math.random() * (b - a);
  G.chance = p => Math.random() < p;
  G.pick = a => a[Math.floor(Math.random() * a.length)];
  G.shuffle = a => {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  };
  G.mulberry32 = function (seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  G.hash2 = (x, y, s = 0) => {
    let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1442695041)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
  // ruído de valor suave (determinístico)
  G.vnoise = (x, y, s = 0) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const sm = t => t * t * (3 - 2 * t);
    const a = G.hash2(xi, yi, s), b = G.hash2(xi + 1, yi, s), c = G.hash2(xi, yi + 1, s), d = G.hash2(xi + 1, yi + 1, s);
    const u = sm(xf), v = sm(yf);
    return G.lerp(G.lerp(a, b, u), G.lerp(c, d, u), v);
  };
  G.fbm = (x, y, s = 0) => (G.vnoise(x, y, s) * 0.6 + G.vnoise(x * 2.1, y * 2.1, s + 7) * 0.3 + G.vnoise(x * 4.3, y * 4.3, s + 13) * 0.1);

  // número em formato brasileiro
  G.fmt = (n, dec = 2) => {
    if (Number.isInteger(n)) return String(n);
    let s = n.toFixed(dec);
    if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    return s.replace('.', ',');
  };

  // ---------- entrada ----------
  const KEYMAP = {
    up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'], left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'],
    a: ['KeyZ', 'KeyJ', 'Space'], b: ['KeyX', 'KeyK'], c: ['KeyC', 'KeyL'], sw: ['KeyQ', 'ShiftLeft', 'ShiftRight', 'Tab'],
    start: ['Enter', 'Escape', 'KeyP'], map: ['KeyM'],
    confirm: ['KeyZ', 'KeyJ', 'Space', 'Enter'], cancel: ['KeyX', 'KeyK', 'Escape', 'Backspace']
  };
  G.KEYMAP = KEYMAP;
  const codeToActs = {};
  for (const a in KEYMAP) for (const c of KEYMAP[a]) (codeToActs[c] = codeToActs[c] || []).push(a);

  G.input = {
    codes: {}, hit: {}, pad: {}, anyHit: false,
    init() {
      addEventListener('keydown', e => {
        if (e.code === 'KeyV') { e.preventDefault(); if (!e.repeat && G.toggleMute) G.toggleMute(); return; }
        if (e.code === 'KeyF' && !e.repeat) { G.toggleFullscreen && G.toggleFullscreen(); }
        const acts = codeToActs[e.code];
        if (acts) {
          e.preventDefault();
          if (!e.repeat) { for (const a of acts) this.hit[a] = true; this.anyHit = true; }
        }
        this.codes[e.code] = true;
        if (G.audio) G.audio.init();
      });
      addEventListener('keyup', e => { this.codes[e.code] = false; });
      addEventListener('blur', () => { this.codes = {}; });
      addEventListener('mousedown', () => { if (G.audio) G.audio.init(); });
    },
    poll() {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      const p = {};
      for (const gp of pads) {
        if (!gp) continue;
        const b = i => gp.buttons[i] && gp.buttons[i].pressed;
        const ax = gp.axes || [];
        if (b(12) || ax[1] < -0.5) p.up = true;
        if (b(13) || ax[1] > 0.5) p.down = true;
        if (b(14) || ax[0] < -0.5) p.left = true;
        if (b(15) || ax[0] > 0.5) p.right = true;
        if (b(0)) { p.a = true; p.confirm = true; }
        if (b(1)) { p.b = true; p.cancel = true; }
        if (b(2)) p.c = true;
        if (b(3) || b(4) || b(5)) p.sw = true;
        if (b(9)) p.start = true;
        if (b(8)) p.map = true;
      }
      for (const a in p) if (p[a] && !this.pad[a]) { this.hit[a] = true; this.anyHit = true; if (G.audio) G.audio.init(); }
      this.pad = p;
    },
    down(a) { const l = KEYMAP[a]; for (let i = 0; i < l.length; i++) if (this.codes[l[i]]) return true; return !!this.pad[a]; },
    pressed(a) { return !!this.hit[a]; },
    endFrame() { this.hit = {}; this.anyHit = false; },
    consume() { this.hit = {}; this.anyHit = false; },
    // eixo de direção atual
    axis() {
      let x = 0, y = 0;
      if (this.down('left')) x -= 1; if (this.down('right')) x += 1;
      if (this.down('up')) y -= 1; if (this.down('down')) y += 1;
      return { x, y };
    }
  };

  // ---------- temporizadores (para scripts async) ----------
  G._waits = [];
  G.wait = s => new Promise(r => G._waits.push({ t: s, r }));
  G.updateWaits = dt => {
    for (let i = G._waits.length - 1; i >= 0; i--) {
      const w = G._waits[i]; w.t -= dt;
      if (w.t <= 0) { G._waits.splice(i, 1); w.r(); }
    }
  };

  // ---------- tremor de tela ----------
  G.shakeT = 0; G.shakeMag = 0; G.hitStop = 0;
  G.flashT = 0; G.flashMax = 0; G.flashColor = '#ffffff';
  G.flash = (color = '#ffffff', t = 0.25, a = 0.8) => { G.flashColor = color; G.flashT = G.flashMax = t; G.flashA = a; };
  G.shake = (mag, t) => { G.shakeMag = Math.max(G.shakeMag, mag); G.shakeT = Math.max(G.shakeT, t); };

  // ---------- partículas e textos flutuantes ----------
  G.fx = {
    parts: [], texts: [],
    spawn(p) {
      const o = { x: 0, y: 0, z: 0, vx: 0, vy: 0, life: 0.5, max: 0.5, color: '#fff', size: 2, grav: 0, drag: 0, room: G.curRoom };
      Object.assign(o, p); if (!p.max) o.max = o.life;
      this.parts.push(o);
    },
    burst(x, y, color, n = 8, spd = 60, opts = {}) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, s = spd * (0.35 + Math.random() * 0.8);
        const life = opts.life || G.rf(0.3, 0.6);
        this.spawn({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s + (opts.up || 0), life, max: life,
          color: Array.isArray(color) ? G.pick(color) : color, size: opts.size || 2, grav: opts.grav || 0, drag: opts.drag || 2 });
      }
    },
    text(x, y, str, color = '#fff', big = false) { this.texts.push({ x, y, str, color, life: big ? 1.3 : 0.85, max: big ? 1.3 : 0.85, vy: -38, big, room: G.curRoom }); },
    // anel de choque
    ring(x, y, r1, color = '#ffffff', life = 0.35, w = 2) { this.spawn({ x, y, kind: 'ring', r0: 2, r1, color, life, max: life, w }); },
    // fumaça (nuvem que cresce e some)
    smoke(x, y, n = 6, color = '#d8d0c8', spd = 30) { for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2; this.spawn({ x: x + Math.cos(a) * 3, y: y + Math.sin(a) * 2, vx: Math.cos(a) * spd * G.rf(0.4, 1), vy: Math.sin(a) * spd * 0.6 * G.rf(0.4, 1) - 8, kind: 'puff', size: G.rf(3, 5), color, life: G.rf(0.35, 0.6), drag: 3 }); } },
    // faísca de impacto (estrela)
    spark(x, y, color = '#ffffff', s = 7) { this.spawn({ x, y, kind: 'spark', size: s, color, life: 0.16, max: 0.16 }); },
    // corte: risco luminoso que atravessa o alvo
    cut(x, y, ang, len = 22, color = '#bfe8ff', life = 0.18) { this.spawn({ x, y, kind: 'cut', ang, len, color, life, max: life }); },
    // faíscas alongadas (riscos na direção do movimento)
    streaks(x, y, ang, n = 6, spd = 140, color = '#ffffff', spread = 0.9) { for (let i = 0; i < n; i++) { const a = ang + G.rf(-spread, spread), s = spd * G.rf(0.5, 1.1); this.spawn({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, kind: 'streak', color, life: G.rf(0.14, 0.26), drag: 5, w: G.rf(0.6, 1.1) }); } },
    // brilho aditivo flutuante
    // silhueta branca que estoura (morte de inimigo)
    ghost(spr, x, y, flip, life = 0.18) { if (spr) this.spawn({ x, y, kind: 'ghost', spr, flip, life, max: life }); },
    glow(x, y, o = {}) { this.spawn(Object.assign({ x, y, kind: 'glow', size: 3, color: '#7ae4ff', life: 0.5 }, o)); },
    // partículas que convergem para um ponto (carregamento)
    converge(tx, ty, r = 16, color = '#7ae4ff', n = 1, life = 0.28) { for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, rr = r * G.rf(0.7, 1.15); this.spawn({ x: tx + Math.cos(a) * rr, y: ty + Math.sin(a) * rr, vx: -Math.cos(a) * rr / life, vy: -Math.sin(a) * rr / life, kind: 'streak', color, life, max: life, w: 0.8, inward: true }); } },
    update(dt) {
      for (let i = this.parts.length - 1; i >= 0; i--) {
        const p = this.parts[i];
        p.life -= dt;
        if (p.life <= 0) { this.parts.splice(i, 1); continue; }
        p.vy += p.grav * dt;
        const d = Math.max(0, 1 - p.drag * dt);
        p.vx *= d; p.vy *= d;
        p.x += p.vx * dt; p.y += p.vy * dt;
      }
      for (let i = this.texts.length - 1; i >= 0; i--) {
        const t = this.texts[i];
        t.life -= dt; t.y += t.vy * dt; t.vy *= Math.max(0, 1 - 4 * dt);
        if (t.life <= 0) this.texts.splice(i, 1);
      }
    },
    draw(ctx, cam) {
      for (const p of this.parts) {
        const a = G.clamp(p.life / p.max, 0, 1), k = 1 - a;
        const x = p.x - cam.x, y = p.y - cam.y;
        if (p.kind === 'ring') {
          ctx.globalAlpha = a; ctx.strokeStyle = p.color; ctx.lineWidth = p.w * a + 0.5;
          const r = p.r0 + (p.r1 - p.r0) * (1 - a * a);
          ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.75, 0, 0, Math.PI * 2); ctx.stroke();
        } else if (p.kind === 'puff') {
          ctx.globalAlpha = a * 0.7; ctx.fillStyle = p.color;
          ctx.beginPath(); ctx.arc(x, y, p.size * (0.6 + k * 0.8), 0, Math.PI * 2); ctx.fill();
        } else if (p.kind === 'cut') {
          const g = Math.min(1, k * 5), L = p.len * (0.55 + 0.45 * g), W = 2.6 * a + 0.3, ca = Math.cos(p.ang), sa = Math.sin(p.ang);
          ctx.globalAlpha = a; ctx.fillStyle = p.color;
          ctx.beginPath(); ctx.moveTo(x - ca * L / 2, y - sa * L / 2); ctx.lineTo(x - sa * W * 1.6, y + ca * W * 1.6); ctx.lineTo(x + ca * L / 2, y + sa * L / 2); ctx.lineTo(x + sa * W * 1.6, y - ca * W * 1.6); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath(); ctx.moveTo(x - ca * L * 0.42, y - sa * L * 0.42); ctx.lineTo(x - sa * W * 0.6, y + ca * W * 0.6); ctx.lineTo(x + ca * L * 0.42, y + sa * L * 0.42); ctx.lineTo(x + sa * W * 0.6, y - ca * W * 0.6); ctx.closePath(); ctx.fill();
        } else if (p.kind === 'streak') {
          const sp = Math.hypot(p.vx, p.vy), l = Math.min(9, sp * 0.035 + 1);
          const ux = sp ? p.vx / sp : 1, uy = sp ? p.vy / sp : 0;
          ctx.globalAlpha = p.inward ? Math.min(1, k * 3) : a; ctx.strokeStyle = p.color; ctx.lineWidth = p.w || 1; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(x - ux * l, y - uy * l); ctx.lineTo(x, y); ctx.stroke(); ctx.lineCap = 'butt';
        } else if (p.kind === 'ghost') {
          const s = p.spr; ctx.globalAlpha = 1;
          G.draw(ctx, s, x - G.lw(s) / 2, y - G.lh(s), { white: true, alpha: a * 0.9, sx: 1 + k * 0.8, sy: 1 + k * 0.3, flip: p.flip });
        } else if (p.kind === 'glow') {
          const pc = ctx.globalCompositeOperation; ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 1; G.glow(ctx, x, y, p.size * (0.6 + 0.4 * a), p.color, a);
          ctx.globalCompositeOperation = pc;
        } else if (p.kind === 'spark') {
          ctx.globalAlpha = a; ctx.fillStyle = p.color; const s = p.size * (0.5 + a * 0.5);
          ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.22, y - s * 0.22); ctx.lineTo(x + s, y); ctx.lineTo(x + s * 0.22, y + s * 0.22); ctx.lineTo(x, y + s); ctx.lineTo(x - s * 0.22, y + s * 0.22); ctx.lineTo(x - s, y); ctx.lineTo(x - s * 0.22, y - s * 0.22); ctx.closePath(); ctx.fill();
        } else {
          ctx.globalAlpha = a < 0.5 ? a * 2 : 1;
          ctx.fillStyle = p.color;
          const s = Math.max(0.5, p.size * 0.75);
          ctx.fillRect(Math.round((x - s / 2) * 2) / 2, Math.round((y - s / 2) * 2) / 2, s, s);
        }
      }
      ctx.globalAlpha = 1;
      for (const t of this.texts) {
        const age = t.max - t.life, pop = age < 0.12 ? 0.6 + age / 0.12 * 0.6 : age < 0.2 ? 1.2 - (age - 0.12) / 0.08 * 0.2 : 1;
        ctx.globalAlpha = G.clamp(t.life * 3, 0, 1);
        ctx.save(); ctx.translate(t.x - cam.x, t.y - cam.y); ctx.scale(pop, pop);
        if (t.big) G.textBig(t.str, 0, -6, t.color, { align: 'center', scale: 1.5, outline: '#1a0a14', shadow: false });
        else G.text(t.str, 0, 0, t.color, { align: 'center', outline: '#1a0a14' });
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    },
    clear() { this.parts.length = 0; this.texts.length = 0; }
  };

  // ---------- utilidades de desenho ----------
  G.rect = (ctx, x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
  G.strokeRect = (ctx, x, y, w, h, c) => {
    ctx.fillStyle = c;
    x = Math.round(x); y = Math.round(y);
    ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y + h - 1, w, 1); ctx.fillRect(x, y, 1, h); ctx.fillRect(x + w - 1, y, 1, h);
  };
  // painel estilo RPG (borda dupla)
  G.panel = (ctx, x, y, w, h, opts = {}) => {
    x = Math.round(x); y = Math.round(y);
    ctx.fillStyle = opts.border || '#f4e9c8'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = opts.mid || '#3a2a5a'; ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
    ctx.fillStyle = opts.bg || '#151231'; ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
    if (opts.bg2 !== false) { ctx.fillStyle = opts.bg2 || '#1d1940'; ctx.fillRect(x + 2, y + 2, w - 4, Math.floor((h - 4) / 2)); }
    // cantos
    ctx.fillStyle = opts.corner || '#ffd84a';
    ctx.fillRect(x, y, 2, 2); ctx.fillRect(x + w - 2, y, 2, 2); ctx.fillRect(x, y + h - 2, 2, 2); ctx.fillRect(x + w - 2, y + h - 2, 2, 2);
  };
})(window.G);
