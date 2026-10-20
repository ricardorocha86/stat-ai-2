'use strict';
// =====================================================================
//  Forma final do Viés: VIÉS ABSOLUTO, a Grande Distorção.
//  Quando Viés é derrotado, a máscara abandona o corpo de Vicente, devora
//  a distorção da sala e vira um monstro: uma máscara gigante com coroa de
//  barras, corpo de redemoinho de números e duas mãos-histograma.
//  A máscara só fica vulnerável quando as duas mãos são destruídas, e as
//  mãos só podem ser feridas depois de baterem no chão (bombas acertam
//  sempre). Três fases, cada uma com ataques novos, e música própria.
// =====================================================================
(function (G) {
  const TS = 16, TAU = Math.PI * 2;
  const say = (n, t, o) => G.ui.say(n, t, o);
  const AP = { portrait: 'viesAbsPortrait' }, VP = { portrait: 'viesNPC_down0' }, HP = { portrait: 'hero_down0' };
  const cine = (on, tint) => { if (G.cineSet) G.cineSet(on, tint); };
  const GLYPHS = ['7', '%', 'σ', '?', 'μ', 'Σ', '3', '!', '0', 'x'];

  // ------------------------------------------------------------------
  //  Música: Viés Absoluto (A + B) e versão de fúria da última fase
  // ------------------------------------------------------------------
  {
    const A = G.audio, T = A.TRACKS;
    const lead = 'B4 D5 F5 B5 A#5:2 F5:2 G5 F5 E5 D5 C#5:4 B4 D5 F5 B5 C6:2 B5:2 A#5:2 F#5:2 G5:4 E5 G5 B5 E6 D6:2 C6:2 B5 A#5 G5 F#5 E5:4 D5 E5 F5 F#5 G5 A#5 B5 C6 B5:8' +
      ' F#5 F#5 G5 F#5 B5:2 A5:2 G5 F#5 E5 F#5 D5:4 E5 E5 F#5 E5 A5:2 G5:2 F#5:2 E5:2 C#5:4 D5 F#5 A5 D6 C#6:2 B5:2 A#5 B5 C#6 A#5 F#5:4 G5 F#5 E5 D5 C#5 D5 E5 F5 F#5:8';
    const bass = 'B1 B2 B1 B2 B1 B2 B1 B2 F1 F2 F1 F2 F1 F2 F1 F2 G1 G2 G1 G2 G1 G2 G1 G2 F#1 F#2 F#1 F#2 F#1 F#2 F#1 F#2 E1 E2 E1 E2 E1 E2 E1 E2 C2 C3 C2 C3 C2 C3 C2 C3 G1 G2 G1 G2 A#1 A#2 A#1 A#2 B1 B2 B1 B2 B1 B2 B1:2' +
      ' D2 D3 D2 D3 D2 D3 D2 D3 A1 A2 A1 A2 A1 A2 A1 A2 E1 E2 E1 E2 E1 E2 E1 E2 F#1 F#2 F#1 F#2 F#1 F#2 F#1 F#2 D2 D3 D2 D3 D2 D3 D2 D3 F#1 F#2 F#1 F#2 F#1 F#2 F#1 F#2 G1 G2 G1 G2 E1 E2 E1 E2 F#1 F#2 F#1 F#2 F#1 F#2 F#1:2';
    const ar = (c, n) => Array(n).fill(c).join(' ');
    const Bm = 'B4 D5 F#5 D5', Fm = 'F4 A4 C5 A4', Gm = 'G4 B4 D5 B4', Fs = 'F#4 A#4 C#5 A#4', Em = 'E4 G4 B4 G4', Cm = 'C5 E5 G5 E5', As = 'A#4 D5 F5 D5', Dm = 'D5 F#5 A5 F#5', Am = 'A4 C#5 E5 C#5';
    const arp = [ar(Bm, 2), ar(Fm, 2), ar(Gm, 2), ar(Fs, 2), ar(Em, 2), ar(Cm, 2), Gm, As, ar(Bm, 2), ar(Dm, 2), ar(Am, 2), ar(Em, 2), ar(Fs, 2), ar(Dm, 2), ar(Fs, 2), Gm, Em, ar(Fs, 2)].join(' ');
    const pad = 'B3:8 F3:8 G3:8 F#3:8 E3:8 C4:8 G3:4 A#3:4 B3:8 D4:8 A3:8 E3:8 F#3:8 D4:8 F#3:8 G3:4 E3:4 F#3:8';
    const mk = (bpm, drums) => { const tr = { bpm, spb: 2, ch: [
      { w: 'sawtooth', v: 0.032, s: lead }, { w: 'triangle', v: 0.17, s: bass }, { w: 'square', v: 0.015, s: arp }, { w: 'square', v: 0.01, s: pad }, { w: 'noise', v: 0.055, s: drums }
    ] }; for (const c of tr.ch) c.notes = A.parse(c.s); return tr; };
    T.absoluto = mk(170, 'K x S x K K S x K x S K K x S S');
    T.absoluto_furia = mk(190, 'K K S K K K S S K K S K K S S S');
  }
  G.SFX.megaroar = () => { const A = G.audio; A.tone({ f: 120, f2: 35, d: 1.4, type: 'sawtooth', v: 0.2 }); A.tone({ f: 180, f2: 50, d: 1.2, type: 'square', v: 0.08, delay: 0.1 }); A.noise({ d: 1.3, v: 0.35, f: 900, f2: 60 }); };
  G.SFX.beam2 = () => { const A = G.audio; A.tone({ f: 200, f2: 900, d: 0.5, type: 'sawtooth', v: 0.08 }); A.noise({ d: 0.5, v: 0.15, ft: 'bandpass', f: 1800 }); };

  // ------------------------------------------------------------------
  //  Desenho da máscara gigante e do corpo de redemoinho
  // ------------------------------------------------------------------
  const CRACKS = [[[2, -24], [5, -14], [1, -6], [6, 2]], [[-10, -20], [-14, -10], [-9, -2]], [[14, -6], [20, 2], [16, 12]], [[-4, 10], [-9, 18], [-5, 26]], [[8, 14], [12, 22]], [[-18, 4], [-22, 12]]];
  function facePath(ctx) {
    ctx.beginPath(); ctx.moveTo(0, -30); ctx.bezierCurveTo(26, -30, 30, -4, 22, 14); ctx.quadraticCurveTo(12, 30, 0, 34); ctx.quadraticCurveTo(-12, 30, -22, 14); ctx.bezierCurveTo(-30, -4, -26, -30, 0, -30); ctx.closePath();
  }
  function drawMask(ctx, x, y, s, t, o = {}) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(o.tilt || 0); ctx.scale(s, s);
    if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
    if (!o.noAura) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, 0, 0, 52, o.angry ? '#ff2a5a' : '#a040ff', 0.32 + 0.1 * Math.sin(t * 4)); ctx.restore(); }
    // coroa de barras (um histograma)
    [10, 16, 22, 28, 22, 16, 10].forEach((h, i) => {
      const hh = h + Math.sin(t * 3 + i * 0.9) * 3, bx = -21 + i * 6;
      ctx.fillStyle = '#1b0a24'; ctx.fillRect(bx - 0.5, -27 - hh - 0.5, 6, hh + 1);
      const g = ctx.createLinearGradient(0, -27 - hh, 0, -27); g.addColorStop(0, i === 3 ? '#ffe27a' : '#ff6ac0'); g.addColorStop(1, '#5a1a7a');
      ctx.fillStyle = g; ctx.fillRect(bx, -27 - hh, 5, hh); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(bx, -27 - hh, 5, 0.8);
    });
    // contorno e duas metades (uma sorri, a outra chora)
    facePath(ctx); ctx.lineWidth = 4; ctx.strokeStyle = '#12061c'; ctx.stroke();
    ctx.save(); facePath(ctx); ctx.clip();
    const gl = ctx.createLinearGradient(-26, -30, 0, 34); gl.addColorStop(0, '#fbf6ff'); gl.addColorStop(1, '#b8a6dc');
    const gr = ctx.createLinearGradient(0, -30, 26, 34); gr.addColorStop(0, '#b4a2d6'); gr.addColorStop(1, '#4e3e78');
    ctx.fillStyle = gl; ctx.fillRect(-32, -34, 32, 72); ctx.fillStyle = gr; ctx.fillRect(0, -34, 32, 72);
    ctx.fillStyle = 'rgba(40,10,60,0.35)'; ctx.fillRect(-0.6, -34, 1.2, 72);
    if (o.flash) { ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(-32, -34, 64, 72); }
    // olhos
    const eye = o.angry ? '#ff2a4a' : '#ff5a7a';
    ctx.fillStyle = '#12061c';
    ctx.beginPath(); ctx.ellipse(-10, -6, 7, o.angry ? 3.4 : 4.5, o.angry ? 0.35 : -0.15, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(10, -5, 7, o.angry ? 3.4 : 4.5, o.angry ? -0.35 : 0.25, 0, TAU); ctx.fill();
    if (!o.eyesOff) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, -10, -6, 9, eye, 0.6); G.glow(ctx, 10, -5, 9, eye, 0.6); ctx.restore();
      ctx.fillStyle = eye; ctx.beginPath(); ctx.arc(-10, -6, 2.4, 0, TAU); ctx.arc(10, -5, 2.4, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(-11, -7.5, 1.2, 1.2); ctx.fillRect(9, -6.5, 1.2, 1.2);
    } else { ctx.strokeStyle = '#ff5a7a'; ctx.lineWidth = 1.2; for (const ex of [-10, 10]) { ctx.beginPath(); ctx.moveTo(ex - 3, -8); ctx.lineTo(ex + 3, -3); ctx.moveTo(ex + 3, -8); ctx.lineTo(ex - 3, -3); ctx.stroke(); } }
    // lágrima do lado triste
    ctx.fillStyle = '#7ae4ff'; ctx.beginPath(); ctx.ellipse(13, 3 + (t * 8) % 10, 1.3, 2, 0, 0, TAU); ctx.fill();
    // boca: metade sorriso, metade tristeza (aberta com dentes quando ruge)
    ctx.strokeStyle = '#12061c'; ctx.lineWidth = 1.6;
    if (o.roar) {
      ctx.fillStyle = '#1a0010'; ctx.beginPath(); ctx.ellipse(0, 15, 12, 7, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#f4ecff'; for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(i * 2.6 - 1.2, 8.8); ctx.lineTo(i * 2.6 + 1.2, 8.8); ctx.lineTo(i * 2.6, 12); ctx.fill(); }
    } else {
      ctx.beginPath(); ctx.moveTo(-14, 11); ctx.quadraticCurveTo(-7, 19, 0, 14); ctx.quadraticCurveTo(7, 10, 14, 17); ctx.stroke();
    }
    // rachaduras (crescem com o dano)
    const nc = Math.floor((o.crack || 0) * CRACKS.length + 0.001);
    ctx.strokeStyle = 'rgba(18,6,28,0.85)'; ctx.lineWidth = 1;
    for (let i = 0; i < nc; i++) { const c = CRACKS[i]; ctx.beginPath(); ctx.moveTo(c[0][0], c[0][1]); for (const [a, b] of c.slice(1)) ctx.lineTo(a, b); ctx.stroke(); }
    ctx.restore();
    // brilho em cima
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(-12, -20, 6, 3, -0.4, 0, TAU); ctx.fill();
    ctx.restore();
  }
  G.drawViesMask = drawMask;
  function drawVortex(ctx, x, y, h, t, a = 1) {
    ctx.save(); ctx.globalAlpha *= a; ctx.lineCap = 'round';
    for (let k = 0; k < 4; k++) {
      ctx.strokeStyle = k % 2 ? 'rgba(255,74,154,0.55)' : 'rgba(122,42,168,0.75)';
      let px = x, py = y;
      for (let i = 1; i <= 16; i++) {
        const ang = t * 1.6 + k * TAU / 4 + i * 0.32, r = (17 - i) * 1.7, nx = x + Math.cos(ang) * r, ny = y + i * h / 16 + Math.sin(ang) * r * 0.3;
        ctx.lineWidth = Math.max(0.6, 5 - i * 0.28); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(nx, ny); ctx.stroke(); px = nx; py = ny;
      }
    }
    for (let i = 0; i < 7; i++) { const ang = t * 1.2 + i * TAU / 7, r = 26 + Math.sin(t * 2 + i) * 4; G.text(GLYPHS[i], x + Math.cos(ang) * r, y + h * 0.35 + Math.sin(ang) * r * 0.35 - 3, i % 2 ? '#ff8ad8' : '#c8a0ff', { align: 'center', shadow: false }); }
    ctx.restore();
  }

  // manto de distorção (dá a silhueta monstruosa) com olhos que piscam
  const EYES = [[-44, 6], [-30, 22], [-50, 30], [38, 8], [48, 26], [28, 34], [-16, 40], [14, 44], [-38, -4], [42, -6]];
  function drawCloak(ctx, x, y, t, k, fase) {
    if (k <= 0.02) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(0.35 + 0.65 * k, 0.35 + 0.65 * k);
    const W = 64, wob = i => Math.sin(t * 2.2 + i * 1.7) * 3;
    ctx.beginPath(); ctx.moveTo(0, -18);
    ctx.bezierCurveTo(30, -22, 52, -14, W, 2 + wob(1));
    for (let i = 0; i <= 8; i++) { const u = i / 8, px = W - u * W * 2, py = 46 + Math.sin(u * Math.PI) * 10 + wob(i + 2) + (i % 2 ? -6 : 4); ctx.lineTo(px, py); }
    ctx.bezierCurveTo(-52, -14, -30, -22, 0, -18); ctx.closePath();
    const g = ctx.createRadialGradient(0, 8, 4, 0, 14, 70); g.addColorStop(0, '#1a0628'); g.addColorStop(0.6, 'rgba(60,12,90,0.92)'); g.addColorStop(1, 'rgba(120,30,140,0.55)');
    ctx.fillStyle = g; ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = fase >= 3 ? 'rgba(255,60,110,0.8)' : 'rgba(220,90,255,0.7)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
    ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(160,60,220,0.35)'; ctx.lineWidth = 1.2;
    for (let s = 0; s < 3; s++) { ctx.beginPath(); for (let i = 0; i < 40; i++) { const a = t * (1 + s * 0.3) + i * 0.3 + s * 2, r = i * 1.6; const px = Math.cos(a) * r * 1.3, py = 14 + Math.sin(a) * r * 0.6; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); } ctx.stroke(); }
    ctx.restore();
    // olhos espalhados pelo manto: só enxergam o que querem
    EYES.forEach(([ex, ey], i) => { const open = Math.max(0, Math.sin(t * 1.3 + i * 2.1)); if (open < 0.15) return; ctx.fillStyle = '#12061c'; ctx.beginPath(); ctx.ellipse(ex, ey, 3.2, 2 * open, 0, 0, TAU); ctx.fill(); ctx.fillStyle = fase >= 3 ? '#ff3a5a' : '#ff6a9a'; ctx.beginPath(); ctx.ellipse(ex, ey, 1.6, 1.2 * open, 0, 0, TAU); ctx.fill(); });
    ctx.restore();
  }
  // retrato para os diálogos
  G.artHooks = G.artHooks || [];
  G.artHooks.push(() => {
    const c = G.acanvas(32, 32), x = c.getContext('2d');
    x.scale(G.AR, G.AR); drawMask(x, 16, 19, 0.4, 0.5, { noAura: false, angry: true });
    G.spr.viesAbsPortrait = c;
  });

  // ------------------------------------------------------------------
  //  Perigos
  // ------------------------------------------------------------------
  const hit = (dmg, sx, sy) => G.hurtPlayer(dmg, sx, sy);
  class NumShot extends G.EShot {
    constructor(cx, cy, vx, vy, o) { super(cx, cy, vx, vy, Object.assign({ spr: 'orb', size: 7, life: 4.5 }, o)); this.ch = G.pick(GLYPHS); }
    draw(ctx, cam) { super.draw(ctx, cam); G.text(this.ch, this.cx - cam.x, this.cy - cam.y - this.z - 3.5, '#ffffff', { align: 'center', shadow: false }); }
  }
  // onda de choque (dá para pular por cima)
  class ShockRing extends G.Ent {
    constructor(x, y, room, dmg) { super(x, y, 1, 1); this.r = 6; this.room = room; this.dmg = dmg; this.hitDone = false; }
    get by() { return this.y - 400; }
    update(dt) {
      this.t += dt; this.r += 150 * dt; if (this.r > 110) { this.dead = true; return; }
      const p = G.player; if (!p || this.hitDone) return;
      const d = Math.hypot((p.cx - this.x), (p.cy - this.y) / 0.6);
      if (Math.abs(d - this.r) < 6 && p.z < 6) { this.hitDone = true; hit(this.dmg, this.x, this.y); }
    }
    draw(ctx, cam) {
      const x = this.x - cam.x, y = this.y - cam.y, a = 1 - this.r / 110;
      ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = '#ff6ac0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y, this.r, this.r * 0.6, 0, 0, TAU); ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
    }
  }
  // gráfico de barras enganoso: barras brotam do chão
  class BarRise extends G.Ent {
    constructor(x, arena, h, delay, room, dmg) { super(x - 14, arena.y + arena.h - h, 28, h); this.arena = arena; this.delay = delay; this.room = room; this.dmg = dmg; this.k = 0; }
    get by() { return this.y + this.h - 300; }
    update(dt) {
      this.t += dt;
      const tt = this.t - this.delay;
      if (tt < 0) return;
      if (tt < 0.9) this.k = 0; else if (tt < 1.05) { if (!this.boom) { this.boom = true; G.sfx('brick'); G.shake(1.5, 0.1); } this.k = (tt - 0.9) / 0.15; } else if (tt < 1.6) this.k = 1; else if (tt < 1.9) this.k = 1 - (tt - 1.6) / 0.3; else { this.dead = true; return; }
      const p = G.player;
      if (p && this.k > 0.6 && !this.hitDone && p.cx > this.x && p.cx < this.x + this.w && p.cy > this.y + this.h * (1 - this.k)) { this.hitDone = true; hit(this.dmg, this.cx, p.cy); }
    }
    draw(ctx, cam) {
      const tt = this.t - this.delay; if (tt < 0) return;
      const x = this.x - cam.x, bot = this.y + this.h - cam.y, h = this.h;
      ctx.save();
      if (this.k <= 0) { ctx.globalAlpha = 0.25 + 0.2 * Math.sin(tt * 25); ctx.fillStyle = '#ff3a8a'; ctx.fillRect(x + 1, bot - h, this.w - 2, h); ctx.globalAlpha = 0.9; ctx.strokeStyle = '#ff6ac0'; ctx.setLineDash([3, 3]); ctx.strokeRect(x + 1.5, bot - h + 0.5, this.w - 3, h - 1); }
      else { const hh = h * this.k, g = ctx.createLinearGradient(x, 0, x + this.w, 0); g.addColorStop(0, '#ff9ad8'); g.addColorStop(0.5, '#e03a9a'); g.addColorStop(1, '#7a1a6a'); ctx.fillStyle = '#1b0a24'; ctx.fillRect(x - 0.5, bot - hh - 0.5, this.w + 1, hh + 1); ctx.fillStyle = g; ctx.fillRect(x, bot - hh, this.w, hh); ctx.fillStyle = '#ffffff'; ctx.fillRect(x, bot - hh, this.w, 1.5); ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, x + this.w / 2, bot - hh, 18, '#ff6ac0', 0.4); }
      ctx.restore();
    }
  }
  // eixo cortado: uma faixa horizontal da arena é "cortada"
  class CutBand extends G.Ent {
    constructor(arena, y, room, dmg) { super(arena.x, y - 14, arena.w, 28); this.room = room; this.dmg = dmg; this.life = 1.25; }
    get by() { return this.y - 500; }
    update(dt) {
      this.t += dt;
      if (this.t >= this.life && !this.cut) { this.cut = true; G.sfx('sword'); G.flash('#ffffff', 0.15, 0.3); G.shake(2.5, 0.15); const p = G.player; if (p && p.cy > this.y && p.cy < this.y + this.h) hit(this.dmg, p.cx, this.y - 10); }
      if (this.t > this.life + 0.35) this.dead = true;
    }
    draw(ctx, cam) {
      const x = this.x - cam.x, y = this.y - cam.y, k = Math.min(1, this.t / this.life);
      ctx.save();
      if (!this.cut) {
        ctx.globalAlpha = 0.18 + 0.2 * k; ctx.fillStyle = '#ff3a5a'; ctx.fillRect(x, y, this.w, this.h);
        ctx.globalAlpha = 0.9; ctx.strokeStyle = '#ff8aa0'; ctx.setLineDash([6, 4]); ctx.lineDashOffset = -this.t * 40;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + this.w, y); ctx.moveTo(x, y + this.h); ctx.lineTo(x + this.w, y + this.h); ctx.stroke();
      } else { const a = 1 - (this.t - this.life) / 0.35; ctx.globalAlpha = a; ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y + this.h / 2 - 1.5, this.w, 3); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,120,160,0.5)'; ctx.fillRect(x, y, this.w, this.h); }
      ctx.restore();
    }
    drawLate(ctx, cam) {
      if (this.cut) return;
      const x = this.x - cam.x, y = this.y - cam.y;
      // zigue-zague do eixo cortado nas pontas
      ctx.save(); ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 1.2; for (const ex of [x + 6, x + this.w - 18]) { ctx.beginPath(); ctx.moveTo(ex, y + this.h / 2); for (let i = 0; i < 4; i++) ctx.lineTo(ex + 3 + i * 3, y + this.h / 2 + (i % 2 ? -5 : 5)); ctx.stroke(); } ctx.restore();
      G.text('EIXO CORTADO', x + this.w / 2, y + this.h / 2 - 3, '#ffe27a', { align: 'center', outline: '#3a0a1a' });
    }
  }
  // dois raios girando a partir da máscara
  class TwinBeam extends G.Ent {
    constructor(boss) { super(boss.cx, boss.y, 1, 1); this.boss = boss; this.room = boss.room; this.ang = Math.random() * TAU; this.late = true; this.warn = 0.9; this.life = 4.6; this.spd = 1.55 * (Math.random() < 0.5 ? 1 : -1); }
    get by() { return 99999; }
    update(dt) {
      this.t += dt; const B = this.boss; if (B.dead || B.dying || B.stun > 0) { this.dead = true; return; }
      if (this.t > this.warn) { this.ang += this.spd * dt; if (!this.snd) { this.snd = true; G.sfx('beam2'); } }
      if (this.t > this.warn + this.life) { this.dead = true; return; }
      if (this.t > this.warn) {
        const p = G.player, ox = B.maskX, oy = B.maskY;
        if (p && p.inv <= 0) for (const k of [0, Math.PI]) {
          const dx = Math.cos(this.ang + k), dy = Math.sin(this.ang + k), px = p.cx - ox, py = (p.cy - 6) - oy, along = px * dx + py * dy;
          if (along > 10 && Math.abs(px * dy - py * dx) < 6) { hit(this.boss.dmg - 1, ox, oy); break; }
        }
      }
    }
    draw(ctx, cam) {
      const B = this.boss, ox = B.maskX - cam.x, oy = B.maskY - cam.y, on = this.t > this.warn;
      ctx.save(); ctx.lineCap = 'round';
      for (const k of [0, Math.PI]) {
        const ex = ox + Math.cos(this.ang + k) * 420, ey = oy + Math.sin(this.ang + k) * 420;
        if (!on) { ctx.globalAlpha = 0.4 + 0.4 * Math.sin(this.t * 30); ctx.strokeStyle = '#ff6a8a'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ex, ey); ctx.stroke(); ctx.setLineDash([]); }
        else { ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,60,140,0.55)'; ctx.lineWidth = 9 + Math.sin(this.t * 40) * 1.5; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ex, ey); ctx.stroke(); ctx.strokeStyle = '#ffe8f8'; ctx.lineWidth = 3; ctx.stroke(); ctx.globalCompositeOperation = 'source-over'; }
      }
      ctx.restore();
    }
  }
  // faixa de aviso da varredura da mão
  class WarnBand extends G.Ent {
    constructor(arena, y, t, room) { super(arena.x, y - 10, arena.w, 20); this.life = t; this.room = room; }
    get by() { return this.y - 500; }
    update(dt) { this.t += dt; if (this.t > this.life) this.dead = true; }
    draw(ctx, cam) { const x = this.x - cam.x, y = this.y - cam.y; ctx.save(); ctx.globalAlpha = 0.15 + 0.15 * Math.sin(this.t * 25); ctx.fillStyle = '#ff3a5a'; ctx.fillRect(x, y, this.w, this.h); ctx.globalAlpha = 0.8; ctx.strokeStyle = '#ff8aa0'; ctx.setLineDash([5, 3]); ctx.lineDashOffset = -this.t * 30; ctx.strokeRect(x + 0.5, y + 0.5, this.w - 1, this.h - 1); ctx.restore(); }
  }
  // piso distorcido sob o monstro
  class DistortFloor extends G.Ent {
    constructor(boss) { super(boss.arena.x, boss.arena.y, boss.arena.w, boss.arena.h); this.boss = boss; this.room = boss.room; }
    get by() { return -100000; }
    update(dt) { this.t += dt; if (this.boss.dead) this.dead = true; }
    draw(ctx, cam) {
      const B = this.boss, cx = B.cx - cam.x, cy = B.y + B.h - cam.y, f = B.fase || 1;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 5; i++) { const r = ((this.t * 30 + i * 36) % 180); ctx.globalAlpha = 0.12 * (1 - r / 180) * (0.7 + f * 0.25); ctx.strokeStyle = f >= 3 ? '#ff3a6a' : '#a040ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx, cy, r * 1.6, r * 0.8, 0, 0, TAU); ctx.stroke(); }
      ctx.restore();
      ctx.save(); ctx.globalAlpha = 0.18;
      for (let i = 0; i < 14; i++) { const gx = this.x - cam.x + (G.hash2(i, 7, 3) * this.w), gy = this.y - cam.y + this.h - ((this.t * (10 + i % 4 * 5) + G.hash2(i, 9, 3) * this.h) % this.h); G.text(GLYPHS[i % GLYPHS.length], gx, gy, '#c8a0ff', { shadow: false }); }
      ctx.restore();
    }
  }

  // ------------------------------------------------------------------
  //  As mãos-histograma
  // ------------------------------------------------------------------
  class MaoBarras extends G.Ent {
    constructor(boss, side) { super(0, 0, 28, 14); this.boss = boss; this.side = side; this.isEnemy = true; this.room = boss.room; this.st = 'hover'; this.stT = 0; this.z = 26; this.hurtT = 0; this.alwaysUpdate = false; this.regen(true); }
    regen(first) {
      this.hpMax = 16 + this.boss.fase * 6; this.hp = this.hpMax; this.st = 'hover'; this.z = 26; const h = this.homePos(); this.x = h.x - this.w / 2; this.y = h.y - this.h / 2;
      if (!first) { G.fx.burst(this.cx, this.cy - this.z, ['#ff6ac0', '#ffffff', '#a040ff'], 16, 70); G.sfx('teleport'); }
    }
    homePos() { const B = this.boss; return { x: B.cx + this.side * (78 + Math.sin(this.t * 1.3 + this.side) * 4), y: B.y + B.h - 4 }; }
    hurtbox() { return { x: this.x - 2, y: this.y - this.z - 14, w: this.w + 4, h: this.h + 16 }; }
    get vulnerable() { return this.st === 'rest'; }
    onHit(d, sx, sy, kind, crit) {
      if (this.st === 'broken' || this.hurtT > 0 || this.boss.dying || this.boss.st === 'intro') return false;
      if (!this.vulnerable && kind !== 'bomb') {
        G.sfx('tink'); G.fx.spark(this.cx, this.cy - this.z - 4, '#ffffff', 5);
        if (!G._absHint || G.time - G._absHint > 7) { G._absHint = G.time; G.ui.toast('Golpeie as MÃOS logo depois que baterem no chão! (bombas sempre acertam)', '#ff9ae6'); }
        return false;
      }
      this.hp -= d; this.hurtT = 0.14; G.sfx('hit'); G.hitStop = Math.max(G.hitStop, 0.05);
      G.fx.text(this.cx, this.y - this.z - 18, (crit ? 'CRÍTICO! ' : '') + d, crit ? '#ffd84a' : '#ffffff'); G.fx.spark(this.cx, this.cy - this.z - 4, '#ff9ad8', 9);
      if (this.hp <= 0) this.breakHand();
      return true;
    }
    breakHand() {
      this.st = 'broken'; G.sfx('explode'); G.shake(4, 0.3); G.flash('#ff6ac0', 0.2, 0.3);
      for (let i = 0; i < 5; i++) G.fx.burst(this.cx + G.rf(-10, 10), this.cy - this.z - G.rf(0, 14), ['#ff6ac0', '#a040ff', '#ffffff'], 10, 90, { grav: 160 });
      G.fx.text(this.cx, this.y - 30, 'MÃO DESTRUÍDA!', '#ff9ae6', true);
      this.boss.handBroken(this);
    }
    order(kind, o = {}) {
      if (this.st !== 'hover') return false;
      const B = this.boss, a = B.arena, p = G.player;
      if (kind === 'slam') { this.st = 'aim'; this.stT = o.aim || (B.fase >= 3 ? 0.55 : 0.75); G.sfx('tell'); }
      else if (kind === 'sweep') {
        this.st = 'sweepPrep'; this.stT = 0.85; this.row = G.clamp(p.cy, a.y + 40, a.y + a.h - 14);
        this.fromX = this.side < 0 ? a.x + 4 : a.x + a.w - this.w - 4; this.toX = this.side < 0 ? a.x + a.w - this.w - 4 : a.x + 4;
        const wb = G.addEnt(new WarnBand(a, this.row, 0.85, this.room)); void wb; G.sfx('tell');
      }
      return true;
    }
    update(dt) {
      this.t += dt; if (this.hurtT > 0) this.hurtT -= dt;
      const B = this.boss;
      if (B.dead) { this.dead = true; return; }
      if (B.dying || this.st === 'broken') return;
      if (this.hookStun > 0) { this.hookStun -= dt; return; }
      const p = G.player;
      this.stT -= dt;
      if (this.st === 'hover') {
        const h = this.homePos(); this.x = G.approach(this.x, h.x - this.w / 2, 140 * dt); this.y = G.approach(this.y, h.y - this.h / 2, 140 * dt); this.z = G.approach(this.z, 26 + Math.sin(this.t * 2.2 + this.side) * 3, 60 * dt);
      } else if (this.st === 'aim') {
        this.x = G.approach(this.x, p.cx - this.w / 2, 200 * dt); this.y = G.approach(this.y, p.cy - this.h / 2, 200 * dt); this.z = G.approach(this.z, 40, 80 * dt);
        if (this.stT <= 0) { this.st = 'slam'; this.stT = 0.13; }
      } else if (this.st === 'slam') {
        this.z = Math.max(0, this.z - 360 * dt);
        if (this.z <= 0) {
          this.st = 'rest'; this.stT = [0, 1.8, 1.5, 1.25][B.fase]; G.sfx('stomp'); G.shake(4, 0.25);
          G.fx.smoke(this.cx, this.cy, 10, '#c8a8d8', 40); G.fx.ring(this.cx, this.cy, 26, '#ff9ad8', 0.3, 2);
          if (p.z < 6 && G.dist(p.cx, p.cy, this.cx, this.cy) < 24) hit(B.dmg, this.cx, this.cy);
          if (B.fase >= 2) G.addEnt(new ShockRing(this.cx, this.cy, this.room, B.dmg - 2));
        }
      } else if (this.st === 'rest') {
        if (this.stT <= 0) { this.st = 'rise'; this.stT = 0.4; }
      } else if (this.st === 'rise') {
        this.z = G.approach(this.z, 26, 90 * dt); if (this.stT <= 0) this.st = 'hover';
      } else if (this.st === 'sweepPrep') {
        this.x = G.approach(this.x, this.fromX, 420 * dt); this.y = G.approach(this.y, this.row - this.h / 2, 420 * dt); this.z = G.approach(this.z, 3, 120 * dt);
        if (this.stT <= 0) { this.st = 'sweep'; G.sfx('spin'); }
      } else if (this.st === 'sweep') {
        const sp = B.fase >= 3 ? 300 : 240; this.x = G.approach(this.x, this.toX, sp * dt);
        if (Math.random() < 0.6) G.fx.spawn({ x: this.cx + G.rf(-6, 6), y: this.cy, vy: -10, life: 0.4, color: '#ff9ad8', size: 1.4 });
        if (p.z < 6 && G.overlap({ x: this.x, y: this.y - 6, w: this.w, h: this.h + 6 }, { x: p.x, y: p.y - 6, w: p.w, h: p.h + 6 })) hit(B.dmg, this.cx, this.cy);
        if (Math.abs(this.x - this.toX) < 1) { this.st = 'rest'; this.stT = 0.9; }
      }
    }
    get by() { return Math.max(this.y + this.h, this.boss.y + this.boss.h + 1); }
    draw(ctx, cam) {
      if (this.st === 'broken') return;
      const x = this.cx - cam.x, gy = this.y + this.h - cam.y, y = gy - this.z, B = this.boss, fl = this.hurtT > 0 && Math.floor(this.t * 30) % 2 === 0;
      if (this.st === 'aim') { ctx.save(); ctx.strokeStyle = '#ff3a5a'; ctx.globalAlpha = 0.6 + 0.4 * Math.sin(this.t * 30); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(x, gy, 18, 10, 0, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - 22, gy); ctx.lineTo(x + 22, gy); ctx.moveTo(x, gy - 13); ctx.lineTo(x, gy + 13); ctx.stroke(); ctx.restore(); }
      G.shadow(ctx, x, gy, Math.max(10, 24 - this.z * 0.25), 0.35);
      ctx.save(); ctx.translate(x, y); ctx.scale(this.side * 1.3, 1.3);
      const rest = this.st === 'rest', T0 = G.time;
      // manga de distorção subindo até o corpo
      ctx.fillStyle = 'rgba(40,10,60,0.9)'; ctx.beginPath(); ctx.moveTo(-9, -21); ctx.lineTo(-6, -34 + Math.sin(T0 * 5) * 2); ctx.lineTo(0, -30); ctx.lineTo(5, -36 + Math.cos(T0 * 5) * 2); ctx.lineTo(9, -21); ctx.closePath(); ctx.fill();
      if (rest) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, 0, -8, 22, '#ffd84a', 0.35 + 0.25 * Math.sin(this.t * 12)); ctx.restore(); }
      // palma
      ctx.fillStyle = '#12061c'; G.rrPath(ctx, -14, -22, 28, 14, 5); ctx.fill();
      const pg = ctx.createLinearGradient(0, -22, 0, -8); pg.addColorStop(0, fl ? '#ffffff' : '#8a4ac0'); pg.addColorStop(1, fl ? '#ffffff' : '#3a1a5a');
      ctx.fillStyle = pg; G.rrPath(ctx, -13, -21, 26, 12, 4.5); ctx.fill();
      // olho na palma
      ctx.fillStyle = '#f4ecff'; ctx.beginPath(); ctx.ellipse(0, -15, 4, 2.6, 0, 0, TAU); ctx.fill(); ctx.fillStyle = rest ? '#ffd84a' : '#ff2a4a'; ctx.beginPath(); ctx.arc(0, -15, 1.5, 0, TAU); ctx.fill();
      // dedos = barras de um histograma (pendem para baixo)
      const hs = [10, 14, 16, 12], spread = rest ? 0.32 : this.st === 'aim' ? 0.2 + Math.sin(T0 * 14) * 0.06 : 0.12;
      hs.forEach((h, i) => {
        ctx.save(); ctx.translate(-9.6 + i * 6.4, -10); ctx.rotate((i - 1.5) * spread);
        ctx.fillStyle = '#12061c'; ctx.fillRect(-2.7, 0, 5.4, h + 1); ctx.beginPath(); ctx.moveTo(-2.9, h); ctx.lineTo(0, h + 6); ctx.lineTo(2.9, h); ctx.fill();
        const g = ctx.createLinearGradient(-2.2, 0, 2.2, 0); g.addColorStop(0, fl ? '#ffffff' : '#ff9ad8'); g.addColorStop(1, fl ? '#ffffff' : '#c02a8a'); ctx.fillStyle = g; ctx.fillRect(-2.2, 0.5, 4.4, h);
        ctx.fillStyle = fl ? '#ffffff' : '#f4ecff'; ctx.beginPath(); ctx.moveTo(-2.2, h); ctx.lineTo(0, h + 5); ctx.lineTo(2.2, h); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(-2.2, 0.5, 4.4, 0.8); ctx.fillStyle = 'rgba(40,10,60,0.5)'; ctx.fillRect(-2.2, h * 0.5, 4.4, 0.8);
        ctx.restore();
      });
      // pulso com o zigue-zague do eixo cortado
      ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-12, -23); for (let i = 0; i < 6; i++) ctx.lineTo(-10 + i * 4, -23 + (i % 2 ? -3 : 0)); ctx.stroke();
      ctx.restore();
      // barra de vida da mão
      const k = Math.max(0, this.hp / this.hpMax); G.rect(ctx, x - 14, y - 50, 28, 2, '#2a0a1a'); G.rect(ctx, x - 14, y - 50, Math.round(28 * k), 2, rest ? '#ffd84a' : '#ff5aa8');
      if (rest) G.drawTell(ctx, x, y - 58, this.t);
      G.light.add(x, y - 10, 36, rest ? '#ffd84a' : '#c070ff', 0.6);
    }
  }

  // ------------------------------------------------------------------
  //  O chefe: VIÉS ABSOLUTO
  // ------------------------------------------------------------------
  class ViesAbsoluto extends G.Boss {
    constructor(x, y, arena) {
      super(x, y, 48, 18, { hp: 280, name: 'Viés Absoluto', topic: 'all', dmg: 7, arena, thr: [0.66, 0.33], xp: 300 });
      this.isAbsoluto = true; this.fase = 1; this.z = 20; this.cnt = 0; this.spawnK = 1; this.roarT = 0;
      this.homeX = arena.x + arena.w / 2; this.homeY = arena.y + 86;
      this.x = this.homeX - this.w / 2; this.y = this.homeY - this.h / 2;
      this.hands = [];
    }
    get maskX() { return this.cx + Math.sin(G.time * 0.8) * 3; }
    get maskY() { return this.y + this.h - this.z - 28 + (this.stun > 0 ? 6 : Math.sin(G.time * 1.6) * 2); }
    hurtbox() { return { x: this.cx - 26, y: this.maskY - 30, w: 52, h: 60 }; }
    contactBox() { return this.stun > 0 || this.spawnK < 1 ? { x: -9e9, y: 0, w: 0, h: 0 } : { x: this.cx - 18, y: this.maskY - 22, w: 36, h: 44 }; }
    vulnerable(kind) { if (this.stun <= 0) return 0; return kind === 'hook' ? 0 : kind === 'bomb' ? 1.4 : kind === 'bigbeam' ? 1.6 : 1; }
    onHit(d, sx, sy, kind, crit) {
      const r = super.onHit(d, sx, sy, kind, crit);
      if (!r && this.stun <= 0 && !this.dying && this.st !== 'intro' && (!G._absM || G.time - G._absM > 8)) { G._absM = G.time; G.ui.toast('A Distorção é protegida pelas MÃOS. Destrua as duas para derrubá-la!', '#ff9ae6'); }
      if (r) this.roarT = 0.25;
      return r;
    }
    start() {
      this.hands = [-1, 1].map(s => { const h = G.addEnt(new MaoBarras(this, s)); h.room = this.room; return h; });
      const df = G.addEnt(new DistortFloor(this)); df.room = this.room;
    }
    handBroken() {
      if (this.hands.every(h => h.st === 'broken') && this.stun <= 0 && !this.dying) {
        // sem as mãos, a máscara despenca: hora de atacar!
        this.stun = 4.6; this.st = 'down'; this.clearHazards();
        G.sfx('megaroar'); G.shake(6, 0.6); G.flash('#ffffff', 0.35, 0.5); G.hitStop = Math.max(G.hitStop, 0.2);
        G.fx.text(this.cx, this.y - 40, 'A DISTORÇÃO CAIU! ATAQUE!', '#ffd84a', true);
      }
    }
    clearHazards() { for (const e of G.ents) if (e instanceof TwinBeam || e instanceof NumShot || e instanceof CutBand || e instanceof BarRise || e instanceof WarnBand) e.dead = true; }
    onStun() { this.st = 'down'; }
    next() {
      if (this.dying) return;
      if (this.st === 'intro') { if (!this.hands.length) this.start(); this.st = 'float'; this.stT = 1.2; return; }
      if (this.st === 'down') {
        this.st = 'rise'; this.stT = 1.1; G.sfx('megaroar'); this.roarT = 0.8; G.shake(3, 0.5);
        for (const h of this.hands) if (h.st === 'broken') h.regen();
        return;
      }
      this.st = 'float'; this.stT = this.fase >= 3 ? G.rf(0.7, 1.1) : this.fase === 2 ? G.rf(1, 1.5) : G.rf(1.4, 2);
    }
    toFase(n) {
      this.fase = n; this.roarT = 1.2;
      G.sfx('megaroar'); G.flash(n >= 3 ? '#ff2a5a' : '#c050ff', 0.6, 0.6); G.shake(7, 0.8); G.hitStop = Math.max(G.hitStop, 0.25);
      G.fx.ring(this.maskX, this.maskY, 90, '#ff9ad8', 0.7, 4);
      G.fx.text(this.cx, this.y - 54, n >= 3 ? 'DISTORÇÃO TOTAL!' : 'A DISTORÇÃO SE ESPALHA!', n >= 3 ? '#ff6a8a' : '#ff9ae6', true);
      if (G.bubble) G.bubble(this, n >= 3 ? 'CHEGA! Eu vou distorcer até o último número deste reino!' : 'Você acha que entende gráficos? Veja ESTE!', 3.2);
      if (n >= 3) G.music('absoluto_furia');
    }
    attack(m) {
      const a = this.arena, p = G.player, alive = this.hands.filter(h => h.st !== 'broken');
      const free = alive.filter(h => h.st === 'hover');
      const room = this.room;
      if (m === 'slam') { const h = free.sort((u, v) => Math.abs(u.cx - p.cx) - Math.abs(v.cx - p.cx))[0]; if (h) h.order('slam'); this.st = 'wait'; this.stT = 1.4; }
      else if (m === 'double') { free.forEach((h, i) => setTimeout0(h, i * 0.45)); this.st = 'wait'; this.stT = 2.2; }
      else if (m === 'sweep') { const h = G.pick(free); if (h) h.order('sweep'); this.st = 'wait'; this.stT = 2.2; }
      else if (m === 'spiral') { this.st = 'spiral'; this.stT = this.fase >= 3 ? 2.6 : 2.0; this.vol = 0; this.sa = Math.random() * TAU; this.roarT = 0.6; G.sfx('roar'); }
      else if (m === 'bars') {
        const n = this.fase >= 3 ? 7 : 6, xs = G.shuffle(Array.from({ length: 11 }, (_, i) => a.x + 16 + i * 32)).slice(0, n);
        xs.forEach((x, i) => { const b = G.addEnt(new BarRise(x, a, G.rf(0.45, 1) * a.h, i * 0.22, room, this.dmg - 1)); b.room = room; });
        G.fx.text(a.x + a.w / 2, a.y + 28, 'GRÁFICO DE BARRAS ENGANOSO!', '#ff9ae6', true); G.sfx('glitch');
        this.st = 'wait'; this.stT = 2.6;
      }
      else if (m === 'cut') {
        const ys = this.fase >= 3 ? [G.clamp(p.cy, a.y + 40, a.y + a.h - 20), a.y + G.rf(40, a.h - 20)] : [G.clamp(p.cy, a.y + 40, a.y + a.h - 20)];
        ys.forEach((y, i) => { const c = G.addEnt(new CutBand(a, y + i * 2, room, this.dmg)); c.room = room; c.life += i * 0.35; });
        G.sfx('tell'); this.st = 'wait'; this.stT = 1.9;
      }
      else if (m === 'beams') { const b = G.addEnt(new TwinBeam(this)); b.room = room; G.sfx('tell'); this.roarT = 1; this.st = 'wait'; this.stT = 5.8; }
      else if (m === 'summon') { for (let i = 0; i < 2; i++) G.addEnt(G.makeEnemy(i ? 'outlier' : 'ruido', a.x + 40 + i * (a.w - 80), a.y + a.h - 30, { room, tier: 2 })); G.sfx('teleport'); this.st = 'wait'; this.stT = 1.2; }
    }
    ai(dt) {
      this.stT -= dt; if (this.roarT > 0) this.roarT -= dt;
      const f = this.hp / this.maxHp;
      if (this.fase === 1 && f <= 0.6) this.toFase(2);
      else if (this.fase === 2 && f <= 0.3) this.toFase(3);
      const p = G.player;
      if (this.st === 'float' || this.st === 'wait' || this.st === 'spiral' || this.st === 'rise') {
        this.z = G.approach(this.z, 20, 50 * dt);
        const tx = G.clamp(p.cx, this.homeX - 60, this.homeX + 60);
        this.x = G.approach(this.x, tx - this.w / 2, 22 * dt); this.y = G.approach(this.y, this.homeY - this.h / 2, 30 * dt);
      }
      if (this.pending) { this.pending.t -= dt; if (this.pending.t <= 0) { const h = this.pending.h; this.pending = this.pending.next; if (h && h.st === 'hover') h.order('slam', { aim: 0.6 }); } }
      if (this.st === 'float') {
        if (this.stT <= 0) {
          const L = this.fase === 1 ? ['slam', 'spiral', 'slam', 'sweep', 'double'] : this.fase === 2 ? ['double', 'bars', 'spiral', 'sweep', 'cut', 'slam', 'summon'] : ['beams', 'double', 'bars', 'spiral', 'cut', 'sweep', 'slam'];
          this.attack(L[this.cnt++ % L.length]);
        }
      } else if (this.st === 'wait') {
        if (this.stT <= 0) this.next();
      } else if (this.st === 'spiral') {
        this.vol -= dt;
        if (this.vol <= 0) {
          this.vol = this.fase >= 3 ? 0.07 : 0.09; this.sa += 0.48;
          for (const k of (this.fase >= 3 ? [0, Math.PI] : [0])) { const ang = this.sa + k, s = G.addEnt(new NumShot(this.maskX, this.maskY + 10, Math.cos(ang) * 78, Math.sin(ang) * 78, { dmg: this.dmg - 2 })); s.room = this.room; }
          if (Math.random() < 0.3) G.sfx('beam');
        }
        if (this.stT <= 0) this.next();
      } else if (this.st === 'rise') {
        if (this.stT <= 0) { this.st = 'float'; this.stT = 0.6; }
      }
    }
    update(dt) {
      if (this.spawnK < 1) this.spawnK = Math.min(1, this.spawnK + dt * 0.8);
      if (this.stun > 0 && !this.dying) { this.z = G.approach(this.z, 0, 90 * dt); if (Math.random() < 0.3) G.fx.spawn({ x: this.maskX + G.rf(-20, 20), y: this.maskY + G.rf(-10, 10), vy: -18, life: 0.6, color: '#ffe27a', size: 1 }); }
      super.update(dt);
    }
    defeat() {
      for (const h of this.hands) if (h.st !== 'broken') { h.st = 'broken'; G.fx.burst(h.cx, h.cy - h.z, ['#ff6ac0', '#ffffff'], 14, 80); }
      this.clearHazards();
      super.defeat();
    }
    draw(ctx, cam) {
      const x = this.maskX - cam.x, y = this.maskY - cam.y, gy = this.y + this.h - cam.y, k = this.spawnK, T0 = G.time;
      const dying = this.dying, jx = dying ? G.rf(-2, 2) : 0, fade = dying ? Math.max(0, 1 - Math.max(0, this.dieT - 1.45) / 0.45) : 1;
      G.shadow(ctx, x, gy, (34 - this.z * 0.3) * k, 0.4);
      ctx.save(); ctx.globalAlpha *= fade;
      if (this.stun <= 0) {
        drawCloak(ctx, x + jx, y + 6, T0, k, this.fase);
        // correntes de energia até as mãos
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(220,90,255,' + (0.35 + 0.15 * Math.sin(T0 * 6)) + ')'; ctx.lineWidth = 1.5;
        for (const h of this.hands) if (h.st !== 'broken' && !h.dead) { const hx = h.cx - cam.x, hy = h.y + h.h - h.z - cam.y - 22, sx = x + jx + Math.sign(hx - x) * 40 * k, sy = y + 10; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo((sx + hx) / 2, Math.min(sy, hy) - 14 + Math.sin(T0 * 4 + hx) * 4, hx, hy); ctx.stroke(); }
        ctx.restore();
        drawVortex(ctx, x + jx, y + 26 * k, Math.max(6, (gy - y - 26) * k), T0, 0.9 * k);
      } else { drawCloak(ctx, x + jx, y + 14, T0 * 0.3, 0.6, this.fase); drawVortex(ctx, x + jx, y + 20, 10, T0 * 0.4, 0.5); }
      const crack = 1 - this.hp / this.maxHp;
      const s = (0.4 + 0.6 * k) * (this.fase >= 3 ? 1.06 + Math.sin(this.t * 10) * 0.02 : 1);
      drawMask(ctx, x + jx, y, s, T0, { crack, angry: this.fase >= 2 || this.st === 'spiral', roar: this.roarT > 0 || this.st === 'spiral', tilt: this.stun > 0 ? 0.3 + Math.sin(T0 * 3) * 0.05 : Math.sin(T0 * 0.9) * 0.04, eyesOff: this.stun > 0, flash: this.flashOn() });
      ctx.restore();
      G.light.add(x, y, 90, this.fase >= 3 ? '#ff4a7a' : '#b070ff', 0.9);
      if (this.stun > 0) this.drawStunStars(ctx, x, y - 44);
    }
  }
  G.ViesAbsoluto = ViesAbsoluto;
  // golpe duplo: a segunda mão espera um pouco
  function setTimeout0(h, t) { const B = h.boss; if (t <= 0) { h.order('slam'); return; } const node = { t, h, next: null }; if (!B.pending) B.pending = node; else { let n = B.pending; while (n.next) n = n.next; n.next = node; } }

  // máscara que se solta do rosto e sobe (cena de transformação)
  class MaskRise extends G.Ent {
    constructor(x, y, tx, ty) { super(x, y, 1, 1); this.sx = x; this.sy = y; this.tx = tx; this.ty = ty; this.k = 0; this.grow = 0; this.room = G.curRoom; this.late = true; this.alwaysUpdate = true; }
    get by() { return 99999; }
    update(dt) { this.t += dt; this.k = Math.min(1, this.k + dt / 1.6); }
    draw(ctx, cam) {
      const e = this.k * this.k * (3 - 2 * this.k), x = G.lerp(this.sx, this.tx, e) - cam.x + (this.grow > 0.5 ? G.rf(-1, 1) * this.grow : 0), y = G.lerp(this.sy, this.ty, e) - cam.y - Math.sin(this.k * Math.PI) * 10;
      drawMask(ctx, x, y, 0.22 + 0.18 * e + this.grow * 0.45, this.t, { angry: this.grow > 0.3, roar: this.grow > 0.7, noAura: false });
    }
  }

  // ------------------------------------------------------------------
  //  Transformação: Viés derrotado → a máscara desperta
  // ------------------------------------------------------------------
  function arenaOf(r) { return { x: r.px + TS, y: r.py + TS, w: 22 * TS, h: 11 * TS }; }
  async function transform(b) {
    const r = G.map.rooms.find(rr => rr.idx === b.room) || G.map.rooms.find(rr => rr.idx === G.curRoom), P0 = G.P, p = G.player;
    G.boss = null;
    for (const e of G.ents) if ((e.isEnemy && e !== p) || e instanceof G.EShot) e.dead = true;
    G.setFlag('vies_f1');
    cine(true, true); G.music(null);
    const bx = G.clamp(b.cx, r.px + 4 * TS, r.px + 20 * TS), byy = G.clamp(b.y + b.h, r.py + 4 * TS, r.py + 9 * TS);
    const body = G.addEnt(new G.ViesFallen(bx, byy)); body.room = r.idx;
    await G.wait(1.0);
    await say('Viés', 'Não... NÃO! Eu não posso perder para uma amostra tão pequena!', VP);
    await say('Viés', 'Se este corpo fraco não aguenta... então eu não preciso mais dele!', VP);
    G.sfx('glitch'); G.shake(3, 0.6); G.flash('#a040ff', 0.3, 0.4);
    const a = arenaOf(r), home = { x: a.x + a.w / 2, y: a.y + 86 - 20 - 28 };
    body.unmask(); body.lying = true;
    G.fx.burst(bx, byy - 26, ['#c070ff', '#ffffff'], 18, 60);
    const mk = G.addEnt(new MaskRise(bx, byy - 28, home.x, home.y)); mk.room = r.idx;
    await G.wait(1.8);
    await say('Sigma', 'A máscara... está se movendo sozinha?!', HP);
    await say('Viés', 'Vicente era só a minha MARIONETE. Agora eu vou mostrar minha VERDADEIRA forma!', AP);
    G.sfx('thunder'); cine(true, true);
    for (let i = 0; i < 40; i++) {
      mk.grow = i / 40;
      for (let k = 0; k < 4; k++) G.fx.converge(home.x, home.y, G.rf(60, 170), G.pick(['#c070ff', '#ff4a9a', '#ffffff', '#7ae4ff']), 1, G.rf(0.4, 0.8));
      if (i % 6 === 0) { G.flash('#a040ff', 0.18, 0.25 + i / 120); G.sfx('glitch'); }
      if (i % 10 === 0) G.fx.text(home.x + G.rf(-80, 80), home.y + G.rf(10, 90), G.pick(['EIXO CORTADO', 'AMOSTRA VICIADA', 'MÉDIA ENGANOSA', 'SÓ OS MEUS DADOS']), '#ff8ad8');
      G.shake(1 + i / 10, 0.12);
      await G.wait(0.075);
    }
    G.flash('#ffffff', 1.1, 1); G.sfx('explode'); G.sfx('megaroar'); G.shake(9, 1.3); G.hitStop = 0.3;
    mk.dead = true;
    const boss = new ViesAbsoluto(a.x + a.w / 2 - 24, a.y + 86 - 9, a); boss.room = r.idx; boss.spawnK = 0; boss.roarT = 2;
    G.addEnt(boss); G.boss = boss; boss.start();
    for (let i = 0; i < 30; i++) G.fx.glow(home.x + G.rf(-50, 50), home.y + G.rf(-20, 60), { size: 4, color: G.pick(['#ff6ac0', '#c070ff', '#ffffff']), vy: -G.rf(20, 60), vx: G.rf(-30, 30), life: G.rf(0.6, 1.4) });
    G.ui.regionBanner('VIÉS ABSOLUTO', 'A FORMA VERDADEIRA DA DISTORÇÃO');
    for (let i = 0; i < 44; i++) { boss.spawnK = Math.min(1, boss.spawnK + 0.025); if (i % 11 === 0) G.shake(3, 0.2); await G.wait(0.05); }
    boss.spawnK = 1;
    await say('Viés Absoluto', 'Eu sou a distorção que mora em cada número mal contado!', AP);
    await say('Viés Absoluto', 'Eixos cortados, amostras escolhidas a dedo, médias que escondem tudo... EU SOU TODOS ELES!', AP);
    const k = await G.ui.ask('Sigma', 'O que responder?', ['Então vou desmascarar todos de uma vez!', 'Solte o Vicente, Distorção!'], HP);
    await say('Viés Absoluto', k === 0 ? 'Tente, pequeno estatístico. Eu tenho MUITAS faces!' : 'Ele não me serve mais. Agora EU sou a verdade de Datália!', AP);
    p.x = G.clamp(p.x, a.x + 8, a.x + a.w - 18); p.y = Math.max(p.y, a.y + 130);
    cine(false); G.music('absoluto');
    G.saveGame();
  }
  // checkpoint: se o herói cair na segunda forma, a luta recomeça nela
  async function reIntro(boss) {
    const r = G.map.rooms.find(rr => rr.idx === boss.room), a = arenaOf(r);
    if (!G.ents.some(e => e instanceof G.ViesFallen && !e.dead)) { const body = G.addEnt(new G.ViesFallen(a.x + 30, a.y + a.h - 18)); body.room = r.idx; body.unmask(); body.lying = true; }
    cine(true, true); boss.spawnK = 0; boss.roarT = 1.5; if (!boss.hands.length) boss.start();
    for (let i = 0; i < 30; i++) { boss.spawnK = Math.min(1, boss.spawnK + 0.035); await G.wait(0.04); }
    boss.spawnK = 1;
    await say('Viés Absoluto', 'Voltou para mais, pequeno estatístico? A distorção NUNCA desiste!', AP);
    cine(false); G.music('absoluto');
  }

  // ------------------------------------------------------------------
  //  Integração
  // ------------------------------------------------------------------
  const obd0 = G.onBossDefeated;
  G.onBossDefeated = async (boss) => {
    if (G.map && G.map.id === 'd6' && !boss.isAbsoluto) { await transform(boss); return; }
    return obd0(boss);
  };
  const mk0 = G.makeBoss;
  G.makeBoss = (id, x, y, arena) => {
    if (id === 'd6' && G.flag('vies_f1') && !G.flag('boss_d6')) return new ViesAbsoluto(arena.x + arena.w / 2 - 24, arena.y + 86 - 9, arena);
    return mk0(id, x, y, arena);
  };
  const intro0 = G.viesBossIntro;
  G.viesBossIntro = async (boss) => (boss.isAbsoluto ? reIntro(boss) : intro0(boss));
  const bm0 = G.bossMusic;
  G.bossMusic = (b) => (b && b.isAbsoluto ? (b.fase >= 3 ? 'absoluto_furia' : 'absoluto') : bm0(b));
})(window.G);
