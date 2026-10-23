'use strict';
// =====================================================================
//  Inimigos estatísticos: Dado Saltitante, Moeda Viciada, Outlier,
//  Ruído, Histograma Ambulante e Gráfico de Pizza. Cada um ensina um
//  conceito pelo próprio comportamento e ganha um cartão de bestiário
//  na primeira vez em que aparece.
// =====================================================================
(function (G) {
  const SPR = G.spr, C = G.col;
  const { bevel, inEll, inRR, inPoly, bboxOf } = G.artTools;
  const R5 = c => C.ramp(c, 5);
  const P = (lw, lh) => new G.Paint(lw * 2, lh * 2);
  const TAU = Math.PI * 2;

  Object.assign(G.ENEMY_DEFS, {
    dado: { hp: 6, dmg: 2, xp: 5, speed: 0, w: 14, h: 8 },
    moeda: { hp: 5, dmg: 2, xp: 5, speed: 40, w: 12, h: 8, fly: true },
    outlier: { hp: 7, dmg: 3, xp: 7, speed: 46, w: 12, h: 8 },
    ruido: { hp: 5, dmg: 2, xp: 5, speed: 0, w: 12, h: 8 },
    barras: { hp: 12, dmg: 3, xp: 10, speed: 18, w: 20, h: 8 },
    pizza: { hp: 10, dmg: 2, xp: 9, speed: 0, w: 22, h: 10 }
  });

  G.BESTIARY = {
    dado: { name: 'Dado Saltitante', color: '#ffffff', text: 'Cada face tem chance 1/6. Tirou ^r1^0? Fica tonto e leva dano dobrado. Tirou ^y6^0? Solta uma rajada de pontos!' },
    moeda: { name: 'Moeda Viciada', color: '#ffd84a', text: 'Cai ^yCARA^0 70% das vezes e ^cCOROA^0 só 30%. Com COROA fica blindada: ataque quando mostrar CARA!' },
    outlier: { name: 'Outlier', color: '#ff6a7a', text: 'Um valor extremo: fica longe de todos... e de repente avança. Repare no tremor antes do bote!' },
    ruido: { name: 'Ruído', color: '#c8c8d8', text: 'Anda em ^cpasseio aleatório^0: cada passo é sorteado. Derrotado, divide-se em ruídos menores.' },
    barras: { name: 'Histograma Ambulante', color: '#7ad8ff', text: 'Muda de forma! Cada barra dispara tantos projéteis quanto sua ^yfrequência^0 (altura).' },
    pizza: { name: 'Gráfico de Pizza', color: '#ff9a5a', text: 'Lança a fatia que brilha. Fatias maiores saem mais vezes: ^yprobabilidade = proporção^0 (40%, 30%, 20%, 10%).' }
  };

  // ------------------------------------------------------------------
  //  ARTE
  // ------------------------------------------------------------------
  const PIPS = { 1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [2, 0], [0, 2], [2, 2]], 5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]] };
  function dadoArt() {
    const face = ['#6a6690', '#bcb8d4', '#eceaf6', '#ffffff', '#ffffff'];
    for (let v = 1; v <= 6; v++) {
      const p = P(18, 18);
      const top = inPoly([[9, 5], [31, 5], [27, 12.5], [5, 12.5]]), side = inPoly([[26.5, 12.5], [31, 5], [31, 27], [26.5, 33]]);
      p.curPart = 1; p.mask(top, (x, y) => (y < 8 ? '#ffffff' : '#f0eef8'), [4, 4, 32, 14]);
      p.curPart = 2; p.mask(side, (x, y) => (x > 29 ? '#8a86a8' : '#a8a4c4'), [25, 4, 32, 34]);
      p.curPart = 3; bevel(p, inRR(5, 12, 22, 21, 3), face, [4, 11, 28, 34]);
      p.innerLines({ front: true, kf: -0.45 }); p.outline({ k: -0.75 });
      for (const [a, b] of PIPS[v]) { const px = 10 + a * 6, py = 17 + b * 6; p.ell(px, py, 2, 2, v === 1 ? '#d8283a' : '#2a1e3a'); p.px(px - 1, py - 1, v === 1 ? '#ff8a90' : '#6a5a8a'); }
      for (const ex of [14, 22]) { p.rect(ex - 1, 8, 3, 3, '#2a1e3a'); p.px(ex, 8, '#ffffff'); }
      p.line(12, 6, 16, 7, '#2a1e3a', 1); p.line(24, 6, 20, 7, '#2a1e3a', 1);
      SPR['dado' + v] = p.toCanvas();
    }
    for (let f = 0; f < 2; f++) {
      const p = P(18, 18), cx = 18, cy = 17, r = 14, a0 = f ? Math.PI / 4 + 0.35 : Math.PI / 4 - 0.35;
      const pts = []; for (let i = 0; i < 4; i++) pts.push([cx + Math.cos(a0 + i * Math.PI / 2) * r, cy + Math.sin(a0 + i * Math.PI / 2) * r]);
      bevel(p, inPoly(pts), face, bboxOf(pts));
      p.outline({ k: -0.75 });
      for (let i = -1; i <= 1; i++) p.ell(cx + Math.cos(a0) * i * 6, cy + Math.sin(a0) * i * 6, 1.8, 1.8, '#2a1e3a');
      SPR['dado_roll' + f] = p.toCanvas();
    }
    // projétil: ponto do dado
    const q = P(6, 6); q.ell(6, 6, 4.5, 4.5, { ramp: ['#5a5470', '#bcb8d4', '#f4f2fa', '#ffffff', '#ffffff'], ambient: 0.5 }); q.outline({ k: -0.8 }); q.ell(6, 6, 1.6, 1.6, '#d8283a');
    SPR.pip = q.toCanvas();
  }
  function moedaArt() {
    const gold = R5('#e8b030'), rim = R5('#b8781a');
    const views = { cara: 1, coroa: 1, mid: 0.55, edge: 0.14 };
    for (const v in views) for (let w = 0; w < 2; w++) {
      const p = P(22, 16), cx = 22, cy = 16, ry = 12, rx = Math.max(1.6, 12 * views[v]);
      p.curPart = 1;
      const wy = w ? 4 : -3;
      for (const sd of [-1, 1]) {
        const bx = cx + sd * (rx + 0.5);
        const pts = [[bx, cy - 3], [bx + sd * 11, cy - 8 + wy], [bx + sd * 9, cy + wy * 0.3], [bx + sd * 4, cy + 3]];
        p.mask(inPoly(pts), (x, y) => (y < cy - 3 + wy * 0.5 ? '#ffffff' : '#c8c8e0'), bboxOf(pts));
      }
      p.curPart = 2; p.ell(cx, cy, rx, ry, { ramp: rim, ambient: 0.45 });
      if (rx > 4) { p.curPart = 3; p.ell(cx, cy, rx - 2, ry - 2, { ramp: gold, ambient: 0.5 }); }
      p.innerLines({ front: true, kf: -0.4 }); p.outline({ k: -0.75 });
      if (v === 'cara') {
        p.rect(cx - 5, cy - 4, 2, 3, '#5a3408'); p.rect(cx + 3, cy - 4, 2, 3, '#5a3408');
        for (let i = -4; i <= 4; i++) p.px(cx + i, cy + 3 + (Math.abs(i) > 2 ? -1 : 0), '#7a4a10');
        p.px(cx - 7, cy + 1, '#ff9a6a'); p.px(cx + 6, cy + 1, '#ff9a6a');
      } else if (v === 'coroa') {
        const pts = [[cx - 6, cy + 4], [cx - 6, cy - 3], [cx - 3, cy], [cx, cy - 5], [cx + 3, cy], [cx + 6, cy - 3], [cx + 6, cy + 4]];
        p.mask(inPoly(pts), (x, y) => (y < cy - 1 ? '#a86414' : '#7a4408'), bboxOf(pts));
        for (const [x0, y0] of pts.slice(1, 6)) p.px(Math.round(x0), Math.round(y0), '#fff4c0');
        for (let x = cx - 6; x <= cx + 6; x++) p.px(x, cy + 5, '#5a3008');
        p.px(cx, cy - 6, '#ff5a6a');
      } else if (v === 'mid') { for (let y = cy - 6; y < cy + 6; y++) p.px(cx - 1, y, gold[4]); }
      SPR['moeda_' + v + w] = p.toCanvas();
    }
  }
  function outlierArt() {
    const R = R5('#e0384a');
    for (let f = 0; f < 4; f++) {
      const p = P(16, 16), cx = 16, cy = 16, sp = f % 2 ? 6.5 : 5;
      p.curPart = 1;
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4 + (f >= 2 ? Math.PI / 8 : 0), l = 9 + sp * (i % 2 ? 0.75 : 1);
        const pts = [[cx + Math.cos(a - 0.34) * 7, cy + Math.sin(a - 0.34) * 7], [cx + Math.cos(a) * l, cy + Math.sin(a) * l], [cx + Math.cos(a + 0.34) * 7, cy + Math.sin(a + 0.34) * 7]];
        p.mask(inPoly(pts), (x, y) => ((x + 0.5 - cx) * Math.cos(a + 1.3) + (y + 0.5 - cy) * Math.sin(a + 1.3) > 0 ? '#ffd0a0' : '#ff8a5a'), bboxOf(pts));
      }
      p.curPart = 2; p.ell(cx, cy, 8.5, 8.5, { ramp: R, ambient: 0.35, contrast: 1.2 });
      p.innerLines({ front: true, kf: -0.5 }); p.outline({ k: -0.8 });
      if (f === 3) p.rect(cx - 4, cy, 8, 1, '#3a0a10');
      else { p.ell(cx, cy, 4.2, 4.2, '#fff4f0'); p.ell(cx + 1, cy + 0.5, 2, 2.4, '#1a0a14'); p.px(cx, cy - 1, '#ffffff'); }
      SPR['outlier' + f] = p.toCanvas();
    }
  }
  function ruidoArt() {
    const N = ['#14141c', '#3a3a48', '#6a6a7a', '#a0a0b0', '#d8d8e4', '#ffffff'];
    for (let f = 0; f < 4; f++) {
      const p = P(16, 18), cx = 16;
      const inG = (x, y) => { const dx = (x + 0.5 - cx) / 11, dy = (y + 0.5 - 14) / 11; if (y < 14) return dx * dx + dy * dy <= 1; return Math.abs(x + 0.5 - cx) <= 11 && y <= 30 + Math.sin(x * 0.9 + f * 1.7) * 2.5; };
      for (let y = 0; y < 36; y++) {
        const sh = G.hash2(y, f, 7) > 0.84 ? (f % 2 ? 2 : -2) : 0;
        for (let x = 0; x < 32; x++) { if (!inG(x - sh, y)) continue; const h = G.hash2(x, y + f * 50, 3); p.px(x, y, N[Math.min(5, Math.floor(h * 5.2 + (y < 10 ? 0.6 : 0)))]); }
      }
      p.outline({ k: -0.85, color: '#0a0a12' });
      for (const ex of [cx - 5, cx + 3]) { p.rect(ex, 12, 3, 2, '#5affff'); p.px(ex + 1, 12, '#ffffff'); }
      SPR['ruido' + f] = p.toCanvas();
    }
  }
  const SLICES = [{ p: 0.4, c: '#e84a3a' }, { p: 0.3, c: '#f0c038' }, { p: 0.2, c: '#3a8ae8' }, { p: 0.1, c: '#48c860' }];
  const BOUNDS = (() => { const b = [0]; let acc = 0; for (const s of SLICES) { acc += s.p * TAU; b.push(acc); } return b; })();
  function pizzaArt() {
    const crust = R5('#c88a4a');
    for (let f = 0; f < 8; f++) {
      const p = P(22, 18), cx = 22, cy = 14, rx = 19, ry = 12, th = 6, rot = f * TAU / 8;
      p.curPart = 1;
      p.mask((x, y) => { const dx = (x + 0.5 - cx) / rx; if (Math.abs(dx) > 1) return false; const yb = cy + ry * Math.sqrt(1 - dx * dx); return y + 0.5 >= cy && y + 0.5 <= yb + th; },
        (x, y) => { const dx = (x + 0.5 - cx) / rx; return dx < -0.5 ? crust[3] : dx > 0.55 ? crust[1] : crust[2]; }, [0, cy - 1, 44, 36]);
      p.curPart = 2;
      const ramps = SLICES.map(s => R5(s.c));
      p.mask((x, y) => { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; return dx * dx + dy * dy <= 1; }, (x, y) => {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, r = Math.sqrt(dx * dx + dy * dy);
        if (r > 0.86) return crust[r > 0.95 ? 1 : 3];
        let a = Math.atan2(dy, dx) - rot; a = ((a % TAU) + TAU) % TAU;
        let k = 0; while (k < 3 && a >= BOUNDS[k + 1]) k++;
        let dmin = 9; for (const b of BOUNDS) { let d = Math.abs(a - b); d = Math.min(d, TAU - d); dmin = Math.min(dmin, d); }
        if (dmin * r * rx < 0.8 && r > 0.1) return '#5a2a1a';
        const R = ramps[k];
        return dy < -0.3 && dx < 0.2 ? R[3] : dx > 0.45 || dy > 0.5 ? R[1] : R[2];
      }, [0, 0, 44, 30]);
      p.outline({ k: -0.8 });
      for (const ex of [cx - 6, cx + 4]) { p.rect(ex, cy + ry + 1, 2, 3, '#2a140a'); p.px(ex, cy + ry + 1, '#ffffff'); }
      SPR['pizza' + f] = p.toCanvas();
    }
    SLICES.forEach((s, i) => {
      const p = P(10, 10), R = R5(s.c);
      const pts = [[3, 3], [17, 7], [7, 17]];
      p.mask(inPoly(pts), (x, y) => (x + y < 14 ? R[3] : R[2]), bboxOf(pts));
      for (let t = 0; t <= 1; t += 0.04) p.px(Math.round(17 + (7 - 17) * t), Math.round(7 + (17 - 7) * t), crust[3]);
      p.outline({ k: -0.8 });
      SPR['slice' + i] = p.toCanvas();
    });
  }
  function dataShotArt() {
    const p = P(6, 8), R = R5('#3ab0e8');
    bevel(p, inRR(2, 1, 8, 14, 2), R, [1, 0, 11, 16]);
    p.outline({ k: -0.8 }); p.rect(4, 3, 2, 6, '#e8fbff');
    SPR.dataShot = p.toCanvas();
    // ícone do histograma (bestiário)
    const q = P(14, 14), hs = [3, 8, 11, 8, 3];
    hs.forEach((h, i) => bevel(q, inRR(3 + i * 4.6, 24 - h * 1.8, 4, h * 1.8, 0.5), R, [2 + i * 4.6, 0, 9 + i * 4.6, 25]));
    for (let x = 1; x < 27; x++) q.px(x, 25, '#c8c4d8');
    q.outline({ k: -0.8 });
    SPR.barras_icon = q.toCanvas();
  }
  G.buildFoes = function () { dadoArt(); moedaArt(); outlierArt(); ruidoArt(); pizzaArt(); dataShotArt(); };

  // ------------------------------------------------------------------
  //  COMPORTAMENTOS
  // ------------------------------------------------------------------
  const shoot = (e, x, y, vx, vy, o) => { const s = G.addEnt(new G.EShot(x, y, vx, vy, Object.assign({ dmg: e.dmg }, o))); s.room = e.room; return s; };

  // DADO SALTITANTE: pula tombando; o número sorteado decide a ação
  class Dado extends G.Enemy {
    constructor(x, y, t, o) { super(x, y, t, o); this.v = G.ri(2, 5); this.stT = G.rf(0.6, 1.4); }
    ai(dt) {
      this.stT -= dt;
      const t = this.toPlayer();
      if (this.st === 'hop') {
        const k = Math.min(1, 1 - this.stT / 0.5);
        this.move(this.vx * dt, this.vy * dt); this.z = Math.sin(k * Math.PI) * 14;
        if (this.stT <= 0) this.land();
      } else if (this.st === 'dizzy') {
        if (this.stT <= 0) { this.st = 'idle'; this.stT = 0.4; }
      } else if (this.st === 'burst') {
        if (this.stT <= 0) {
          for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + this.t; shoot(this, this.cx, this.cy - 6, Math.cos(a) * 95, Math.sin(a) * 95, { spr: 'pip', size: 6 }); }
          G.sfx('bombput'); G.fx.ring(this.cx, this.cy - 6, 14, '#ffd84a', 0.25, 1.5);
          this.st = 'idle'; this.stT = 0.9;
        }
      } else if (this.stT <= 0) {
        const a = t.d < 150 ? Math.atan2(t.dy, t.dx) + G.rf(-0.3, 0.3) : Math.random() * TAU;
        this.vx = Math.cos(a) * 72; this.vy = Math.sin(a) * 72;
        this.st = 'hop'; this.stT = 0.5; G.sfx('jump');
      }
    }
    land() {
      this.z = 0; this.v = G.ri(1, 6);
      G.sfx('dice'); G.fx.smoke(this.cx, this.y + this.h, 3, '#d8d0c8', 20);
      G.fx.text(this.cx, this.y - 22, String(this.v), this.v === 1 ? '#ff6a6a' : this.v === 6 ? '#ffd84a' : '#ffffff');
      if (this.v === 1) { this.st = 'dizzy'; this.stT = 1.8; }
      else if (this.v === 6) { this.st = 'burst'; this.stT = 0.45; this.tell(0.45); }
      else { this.st = 'idle'; this.stT = 0.3 + this.v * 0.08; }
    }
    onHit(d, sx, sy, kind, crit) { if (this.st === 'dizzy') d *= 2; return super.onHit(d, sx, sy, kind, crit); }
    sprName() { return this.st === 'hop' ? 'dado_roll' + (Math.floor(this.t * 14) % 2) : 'dado' + this.v; }
    drawExtra(ctx, sx, sy, s) {
      if (this.st === 'dizzy') for (let i = 0; i < 3; i++) { const a = this.t * 5 + i * 2.1; G.draw(ctx, 'sparkle', sx + G.lw(s) / 2 + Math.cos(a) * 8 - 2, sy - 1 + Math.sin(a) * 3); }
    }
  }

  // MOEDA VICIADA: voa, gira e cai CARA (70%) ou COROA (30%)
  class Moeda extends G.Enemy {
    constructor(x, y, t, o) { super(x, y, t, o); this.face = 'cara'; this.stT = G.rf(1, 2); this.ph = Math.random() * 6; this.z = 8; this.flips = 0; this.heads = 0; }
    immune() { return this.face === 'coroa' || this.st === 'flip'; }
    ai(dt) {
      this.stT -= dt; this.ph += dt;
      const t = this.toPlayer();
      if (this.st === 'flip') {
        if (this.stT <= 0) {
          this.face = Math.random() < 0.7 ? 'cara' : 'coroa'; this.flips++; if (this.face === 'cara') this.heads++;
          G.sfx(this.face === 'cara' ? 'coin' : 'tink');
          G.fx.text(this.cx, this.y - 24, this.face === 'cara' ? 'CARA' : 'COROA', this.face === 'cara' ? '#ffd84a' : '#7ae4ff');
          if (this.face === 'cara') { this.st = 'aim'; this.stT = 0.4; this.tell(0.4); }
          else { this.st = 'float'; this.stT = G.rf(1.4, 2); }
        }
        return;
      }
      if (this.st === 'aim') { if (this.stT <= 0) { const a = Math.atan2(t.dy, t.dx); this.vx = Math.cos(a) * 160; this.vy = Math.sin(a) * 160; this.st = 'dash'; this.stT = 0.55; } return; }
      if (this.st === 'dash') {
        const r = this.move(this.vx * dt, this.vy * dt);
        if (Math.random() < 0.6) G.fx.glow(this.cx, this.cy - this.z, { size: 2, color: '#ffd84a', life: 0.3 });
        if (r.hitX || r.hitY || this.stT <= 0) { this.st = 'float'; this.stT = G.rf(1, 1.6); }
        return;
      }
      // flutua em volta do herói
      const want = 64, a = Math.atan2(t.dy, t.dx) + Math.PI + Math.sin(this.ph * 0.7) * 1.2;
      const gx = G.player.cx + Math.cos(a) * want - this.cx, gy = G.player.cy + Math.sin(a) * want * 0.7 - this.cy;
      const gl = Math.hypot(gx, gy) || 1;
      this.move(gx / gl * this.speed * dt, gy / gl * this.speed * dt);
      this.z = 8 + Math.sin(this.ph * 4) * 2;
      if (this.stT <= 0) { this.st = 'flip'; this.stT = 0.6; G.sfx('flip'); }
    }
    sprName() {
      const w = Math.floor(this.t * 10) % 2;
      if (this.st === 'flip') return 'moeda_' + ['cara', 'mid', 'edge', 'mid', 'coroa', 'mid', 'edge', 'mid'][Math.floor(this.t * 24) % 8] + w;
      return 'moeda_' + this.face + w;
    }
    drawExtra(ctx, sx, sy, s) {
      if (this.face === 'coroa' && this.st !== 'flip') { ctx.save(); ctx.globalAlpha = 0.5 + 0.2 * Math.sin(this.t * 8); ctx.strokeStyle = '#9ae8ff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(sx + G.lw(s) / 2, sy + G.lh(s) / 2, 10, 0, TAU); ctx.stroke(); ctx.restore(); }
      if (this.flips >= 3) G.puzTag && G.puzTag(ctx, sx + G.lw(s) / 2, sy - 9, 'cara ' + this.heads + '/' + this.flips, '#ffe27a');
    }
  }

  // OUTLIER: fica longe de todos e, de repente, avança em linha reta
  class Outlier extends G.Enemy {
    constructor(x, y, t, o) { super(x, y, t, o); this.stT = G.rf(2, 3.5); this.trail = []; }
    ai(dt) {
      this.stT -= dt;
      const p = G.player, t = this.toPlayer();
      if (this.st === 'aim') {
        if (this.stT <= 0) { const a = Math.atan2(t.dy, t.dx); this.vx = Math.cos(a) * 230; this.vy = Math.sin(a) * 230; this.st = 'dash'; this.stT = 0.7; this.bounces = 0; G.sfx('spin'); }
        return;
      }
      if (this.st === 'dash') {
        const r = this.move(this.vx * dt, this.vy * dt);
        this.trail.unshift([this.cx, this.cy]); if (this.trail.length > 7) this.trail.pop();
        if ((r.hitX || r.hitY) && this.bounces < 1) { this.bounces++; if (r.hitX) this.vx = -this.vx; if (r.hitY) this.vy = -this.vy; G.sfx('bump'); G.fx.spark(this.cx, this.cy, '#ffb0a0', 8); }
        if (this.stT <= 0) { this.st = 'idle'; this.stT = G.rf(2, 3.5); this.trail.length = 0; }
        return;
      }
      if (this.trail.length) this.trail.pop();
      // centro do "grupo": herói + outros inimigos; foge para o lado oposto
      let gx = p.cx, gy = p.cy, n = 1;
      for (const e of G.ents) if (e !== this && e.isEnemy && !e.dead && G.sameRoom(e)) { gx += e.cx; gy += e.cy; n++; }
      gx /= n; gy /= n;
      const away = Math.atan2(this.cy - gy, this.cx - gx), dist = Math.hypot(this.cx - gx, this.cy - gy);
      const sp = dist < 110 ? this.speed : dist > 150 ? -this.speed * 0.5 : 0;
      const wob = Math.sin(this.t * 1.7) * 0.8;
      this.move(Math.cos(away + wob) * sp * dt, Math.sin(away + wob) * sp * dt);
      if (this.stT <= 0 && t.d < 220) { this.st = 'aim'; this.stT = 0.55; this.tell(0.55); }
    }
    sprName() { return 'outlier' + (this.st === 'aim' ? 1 : Math.floor(this.t * 5) % 4); }
    draw(ctx, cam) {
      if (this.trail.length > 1) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        this.trail.forEach(([x, y], i) => G.glow(ctx, x - cam.x, y - 6 - cam.y, 8 - i, '#ff4a5a', 0.45 - i * 0.05));
        ctx.restore();
      }
      if (this.st === 'aim') {
        const p = G.player, a = Math.atan2(p.cy - this.cy, p.cx - this.cx);
        ctx.save(); ctx.globalAlpha = 0.5 + 0.3 * Math.sin(this.t * 30); ctx.strokeStyle = '#ff4a5a'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(this.cx - cam.x, this.cy - 6 - cam.y); ctx.lineTo(this.cx - cam.x + Math.cos(a) * 120, this.cy - 6 - cam.y + Math.sin(a) * 120); ctx.stroke(); ctx.restore();
      }
      G.light.add(this.cx - cam.x, this.cy - 6 - cam.y, 30, '#ff4a5a', 0.5);
      super.draw(ctx, cam);
    }
  }

  // RUÍDO: passeio aleatório; ao morrer divide-se em dois menores
  class Ruido extends G.Enemy {
    constructor(x, y, t, o = {}) {
      super(x, y, t, o); this.small = !!o.small; this.stT = G.rf(0.2, 0.4);
      if (this.small) { this.hp = this.maxHp = Math.max(2, Math.round(this.maxHp / 2)); }
    }
    ai(dt) {
      this.stT -= dt;
      if (this.stT <= 0) {
        this.stT = G.rf(0.18, 0.32);
        const t = this.toPlayer();
        const a = Math.random() < 0.3 && t.d < 160 ? Math.atan2(t.dy, t.dx) : Math.floor(Math.random() * 8) * TAU / 8;
        const step = G.rf(5, 10);
        const ox = this.cx, oy = this.cy;
        this.move(Math.cos(a) * step, Math.sin(a) * step);
        G.fx.spawn({ x: ox, y: oy - 6, kind: 'puff', size: 2.5, color: '#9a9aa8', life: 0.25, drag: 2 });
        if (Math.random() < 0.15) G.sfx('freeze');
      }
    }
    die(kind) {
      super.die(kind);
      if (!this.small) for (let i = 0; i < 2; i++) { const e = G.makeEnemy('ruido', this.x + (i ? 8 : -8), this.y, { room: this.room, small: true, tier: this.tier }); G.addEnt(e); }
    }
    sprName() { return 'ruido' + (Math.floor(this.t * 12) % 4); }
    draw(ctx, cam) {
      if (!this.small) { super.draw(ctx, cam); return; }
      const s = G.spr[this.sprName()];
      G.shadow(ctx, this.cx - cam.x, this.y + this.h - 1 - cam.y, 8, 0.3);
      ctx.save(); ctx.translate(this.cx - cam.x, this.y + this.h - cam.y); ctx.scale(0.65, 0.65);
      G.draw(ctx, s, -G.lw(s) / 2, -G.lh(s), this.hurtT > 0 && Math.floor(this.t * 30) % 2 === 0 ? { white: true } : undefined);
      ctx.restore();
    }
  }

  // HISTOGRAMA AMBULANTE: muda de forma; cada barra dispara conforme sua altura
  const SHAPES = { 'simétrica': [1, 3, 4, 3, 1], 'assimétrica à direita': [4, 3, 2, 1, 1], 'assimétrica à esquerda': [1, 1, 2, 3, 4], 'uniforme': [2, 2, 2, 2, 2], 'bimodal': [3, 1, 1, 1, 3] };
  const SHAPE_NAMES = Object.keys(SHAPES);
  class Barras extends G.Enemy {
    constructor(x, y, t, o) { super(x, y, t, o); this.heavy = true; this.shape = 'simétrica'; this.hs = SHAPES['simétrica'].slice(); this.stT = G.rf(1.5, 2.5); this.labelT = 0; }
    ai(dt) {
      this.stT -= dt; if (this.labelT > 0) this.labelT -= dt;
      const tgt = SHAPES[this.shape];
      // barras com mola: passam do ponto e balançam até assentar
      this.hv = this.hv || [0, 0, 0, 0, 0];
      for (let i = 0; i < 5; i++) { this.hv[i] += (140 * (tgt[i] - this.hs[i]) - 11 * this.hv[i]) * dt; this.hs[i] = Math.max(0, this.hs[i] + this.hv[i] * dt); }
      const t = this.toPlayer();
      if (this.st === 'aim') {
        if (this.stT <= 0) {
          const base = Math.atan2(t.dy, t.dx);
          tgt.forEach((h, i) => { for (let k = 0; k < h; k++) { const a = base + (i - 2) * 0.22 + G.rf(-0.06, 0.06); const sp = 80 + k * 18; shoot(this, this.x + 2 + i * 4, this.y - 4 - h * 3, Math.cos(a) * sp, Math.sin(a) * sp, { spr: 'dataShot', size: 6 }); } });
          G.sfx('beam'); this.st = 'walk'; this.stT = G.rf(2.2, 3);
        }
        return;
      }
      if (this.st === 'reshape') { if (this.stT <= 0) { this.st = 'aim'; this.stT = 0.5; this.tell(0.5); } return; }
      if (t.d > 40) { const a = Math.atan2(t.dy, t.dx); this.move(Math.cos(a) * this.speed * dt, Math.sin(a) * this.speed * dt); }
      if (this.stT <= 0) {
        let n; do { n = G.pick(SHAPE_NAMES); } while (n === this.shape);
        this.shape = n; this.labelT = 2; this.st = 'reshape'; this.stT = 0.6; G.sfx('switch');
      }
    }
    hurtbox() { return { x: this.x - 1, y: this.y - 16, w: this.w + 2, h: this.h + 16 }; }
    sprName() { return 'barras_icon'; }
    draw(ctx, cam) {
      const S = G.snap, x0 = S(this.x - cam.x), by = S(this.y + this.h - cam.y), cx = this.cx - cam.x;
      G.shadow(ctx, cx, by - 1, 24, 0.32);
      const white = this.hurtT > 0 && Math.floor(this.t * 30) % 2 === 0, tell = this.tellT > 0 && Math.floor(this.t * 20) % 2 === 0;
      const jx = this.tellT > 0 ? Math.sin(this.t * 90) * 0.75 : 0;
      const walking = this.st !== 'aim' && this.st !== 'reshape' && this.toPlayer().d > 40;
      const step = walking ? Math.sin(this.t * 12) : 0, bob = S(Math.abs(step) * -0.75);
      ctx.save();
      // achata ao levar golpe, ancorado no chão
      if (this.squashT > 0) { const k = this.squashT / 0.16; ctx.translate(cx, by); ctx.scale(1 + 0.22 * k, 1 - 0.2 * k); ctx.translate(-cx, -by); }
      // botinhas (levantam alternadas)
      for (const [fx, up] of [[x0 + 3, Math.max(0, step)], [x0 + 13, Math.max(0, -step)]]) {
        const fy = by - 3 - S(up * 1.5);
        ctx.fillStyle = '#140e22'; ctx.fillRect(fx + jx - 0.5, fy - 0.5, 5, 3.5);
        ctx.fillStyle = '#4a4466'; ctx.fillRect(fx + jx, fy, 4, 2.5);
        ctx.fillStyle = '#7a74a0'; ctx.fillRect(fx + jx, fy, 4, 0.5);
      }
      // eixo: placa metálica com marcas
      const ax = x0 - 1.5 + jx, ay = by - 6 + bob;
      ctx.fillStyle = '#140e22'; ctx.fillRect(ax - 0.5, ay - 0.5, 24, 4);
      ctx.fillStyle = '#8a86a6'; ctx.fillRect(ax, ay, 23, 3);
      ctx.fillStyle = '#e4e0f4'; ctx.fillRect(ax, ay, 23, 1);
      ctx.fillStyle = '#5a5678'; ctx.fillRect(ax, ay + 2.5, 23, 0.5);
      for (let i = 0; i <= 5; i++) { ctx.fillStyle = '#3a3658'; ctx.fillRect(ax + 1.5 + i * 4, ay + 1, 0.5, 1.5); }
      // barras com volume: luz à esquerda, sombra à direita, topo brilhante
      const cols = [['#9ae8ff', '#5ac8ff', '#2a8ac8'], ['#7ad8ff', '#3ab0e8', '#1a72b0'], ['#6ac8f8', '#2a98d8', '#145e9a'], ['#7ad8ff', '#3ab0e8', '#1a72b0'], ['#9ae8ff', '#5ac8ff', '#2a8ac8']];
      const aiming = this.st === 'aim';
      let top = 0, ti = 0;
      for (let i = 0; i < 5; i++) {
        const h = S(3 + this.hs[i] * 4.5), bx = x0 + i * 4 + jx, y = ay - h;
        if (h > top) { top = h; ti = i; }
        const [hi, md, lo] = white ? ['#ffffff', '#ffffff', '#ffffff'] : tell ? ['#ffb0b0', '#ff6a6a', '#c02a3a'] : cols[i];
        ctx.fillStyle = '#0e1a2a'; ctx.fillRect(bx - 0.5, y - 0.5, 4.5, h + 0.5);
        ctx.fillStyle = md; ctx.fillRect(bx, y, 3.5, h);
        ctx.fillStyle = lo; ctx.fillRect(bx + 2.5, y, 1, h); ctx.fillRect(bx, y + h - 1, 3.5, 1);
        ctx.fillStyle = hi; ctx.fillRect(bx, y, 1, h - 1); ctx.fillRect(bx, y, 3.5, 0.5);
        if (h > 6 && !white) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(bx + 1, y + 1.5, 0.5, Math.min(3, h - 3)); }
        // na mira, o topo de cada barra acende
        if (aiming) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, bx + 1.75, y, 3 + Math.sin(this.t * 30) * 0.8, '#7ad8ff', 0.7); ctx.restore(); }
      }
      // rosto na barra mais alta: olhos que seguem o herói
      const fx = x0 + ti * 4 + jx, fy = ay - top + 1.5, p = G.player, lx = p ? G.clamp((p.cx - this.cx) / 40, -1, 1) * 0.5 : 0, ly = p ? G.clamp((p.cy - this.cy) / 40, -1, 1) * 0.5 : 0;
      if (!white) {
        ctx.fillStyle = '#f4fbff'; ctx.fillRect(fx, fy, 1.5, 2); ctx.fillRect(fx + 2, fy, 1.5, 2);
        ctx.fillStyle = '#0e1a2a'; ctx.fillRect(S(fx + 0.5 + lx), S(fy + 0.5 + ly), 1, 1); ctx.fillRect(S(fx + 2.5 + lx), S(fy + 0.5 + ly), 1, 1);
        if (aiming || this.tellT > 0) { ctx.fillRect(fx - 0.5, fy - 1, 1.5, 0.5); ctx.fillRect(fx + 2.5, fy - 1, 1.5, 0.5); ctx.fillRect(fx + 1, fy - 0.5, 0.5, 0.5); ctx.fillRect(fx + 2, fy - 0.5, 0.5, 0.5); }
      }
      ctx.restore();
      if (aiming) G.light.add(cx, ay - top, 26, '#7ad8ff', 0.6);
      if (this.labelT > 0) G.puzTag(ctx, cx, ay - top - 10, this.shape, '#7ad8ff');
      if (this.tellT > 0) G.drawTell(ctx, cx + 14, ay - top, this.t);
      if (this.hp < this.maxHp) { G.rect(ctx, x0, by + 1, 20, 2, '#3a0a10'); G.rect(ctx, x0, by + 1, Math.round(20 * this.hp / this.maxHp), 2, '#ff4a5a'); }
    }
  }

  // GRÁFICO DE PIZZA: gira e lança a fatia sorteada (chance = tamanho da fatia)
  class Pizza extends G.Enemy {
    constructor(x, y, t, o) { super(x, y, t, o); this.heavy = true; this.rot = 0; this.stT = G.rf(1.2, 2); this.pickK = -1; }
    ai(dt) {
      this.stT -= dt; this.rot += dt * (this.st === 'aim' ? 0.2 : 0.9);
      const t = this.toPlayer();
      if (this.st === 'aim') {
        if (this.stT <= 0) {
          const a = Math.atan2(t.dy, t.dx), k = this.pickK;
          const fire = (an, sp, o) => shoot(this, this.cx, this.cy - 8, Math.cos(an) * sp, Math.sin(an) * sp, Object.assign({ spr: 'slice' + k, size: 8 }, o));
          if (k === 0) fire(a, 70, { dmg: this.dmg + 1, size: 10 });
          else if (k === 1) fire(a, 150);
          else if (k === 2) for (let i = -1; i <= 1; i++) fire(a + i * 0.32, 100);
          else fire(a, 75, { homing: 2.2, life: 3.5 });
          G.sfx('bombput'); this.st = 'idle'; this.stT = G.rf(1.4, 2.2); this.pickK = -1;
        }
        return;
      }
      if (this.stT <= 0) {
        // sorteio ponderado pelas fatias
        let r = Math.random(), k = 0; while (k < 3 && r >= SLICES[k].p) { r -= SLICES[k].p; k++; }
        this.pickK = k; this.st = 'aim'; this.stT = 0.6; this.tell(0.6);
      }
    }
    hurtbox() { return { x: this.x - 1, y: this.y - 14, w: this.w + 2, h: this.h + 14 }; }
    sprName() { return 'pizza' + (((Math.floor(this.rot / (TAU / 8)) % 8) + 8) % 8); }
    drawExtra(ctx, sx, sy, s) {
      if (this.pickK < 0) return;
      // fatia sorteada brilha
      const fr = ((Math.floor(this.rot / (TAU / 8)) % 8) + 8) % 8, rot = fr * TAU / 8;
      const mid = (BOUNDS[this.pickK] + BOUNDS[this.pickK + 1]) / 2 + rot;
      const cx = sx + 11, cy = sy + 7;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      G.glow(ctx, cx + Math.cos(mid) * 5, cy + Math.sin(mid) * 3.4, 9, SLICES[this.pickK].c, 0.6 + 0.4 * Math.sin(this.t * 30));
      ctx.restore();
      G.puzTag(ctx, sx + 11, sy - 24, Math.round(SLICES[this.pickK].p * 100) + '%', SLICES[this.pickK].c);
    }
  }

  Object.assign(G.ENEMY_CLASSES, { dado: Dado, moeda: Moeda, outlier: Outlier, ruido: Ruido, barras: Barras, pizza: Pizza });
})(window.G);
