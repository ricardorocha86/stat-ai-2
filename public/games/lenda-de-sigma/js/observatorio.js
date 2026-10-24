'use strict';
// =====================================================================
//  Observatório da Inferência: a 7ª masmorra (opcional), o Gancho da
//  Regressão e as Argolas da Média, enigmas novos (Máquina das Médias,
//  Triângulo de Pascal, Boxplot de Pedra, Régua da Confiança, Tribunal da
//  Hipótese, Abismo das Argolas), mini-chefes (Rei Dado, Histograma
//  Colossal, Sentinela Boxplot) e o chefe Hipótese Nula. No mundo: o
//  prédio do observatório e três ilhotas que só o gancho alcança.
// =====================================================================
(function (G) {
  const T = G.T, TS = 16, TAU = Math.PI * 2, st = G.st, F = G.fmt;
  const C = G.col, R5 = c => C.ramp(c, 5);
  const P = () => G.P;
  const { cyl, bevel, inEll, inRR, inPoly, bboxOf } = G.artTools;
  const HOOK_RANGE = 7 * TS, HOOK_SPD = 300, PULL_SPD = 250;
  G.HEART_PIECES_TOTAL = 39;

  // ------------------------------------------------------------------
  //  Som e música
  // ------------------------------------------------------------------
  const A = G.audio;
  G.SFX.hook = () => { A.tone({ f: 420, f2: 980, d: 0.16, type: 'square', v: 0.05 }); for (let i = 0; i < 4; i++) A.noise({ d: 0.03, v: 0.07, ft: 'bandpass', f: 3200, delay: i * 0.035 }); };
  G.SFX.clink = () => { A.tone({ f: 1500, f2: 2000, d: 0.08, type: 'triangle', v: 0.13 }); A.tone({ f: 2400, d: 0.05, type: 'square', v: 0.035, delay: 0.03 }); };
  G.SFX.orb = () => { A.tone({ f: 1800, f2: 300, d: 0.25, type: 'sine', v: 0.16 }); A.noise({ d: 0.2, v: 0.15, ft: 'highpass', f: 2500 }); };
  {
    const TR = A.TRACKS;
    TR.observatory = { bpm: 92, spb: 2, ch: [
      { w: 'triangle', v: 0.16, s: 'D5:2 F5:2 A5:4 G5:2 F5:2 E5:4 C5:2 E5:2 G5:4 F5:2 E5:2 D5:4 A4:2 D5:2 F5:2 A5:2 C6:2 Bb5:2 A5:4 G5:2 F5:2 E5:2 C5:2 D5:8' },
      { w: 'triangle', v: 0.13, s: 'D2:4 D3:4 C2:4 C3:4 Bb1:4 Bb2:4 A1:4 A2:4 D2:4 D3:4 F2:4 F3:4 G2:4 A2:4 D2:8' },
      { w: 'square', v: 0.014, s: 'D4 F4 A4 F4 D4 F4 A4 F4 D4 F4 A4 F4 D4 F4 A4 F4 C4 E4 G4 E4 C4 E4 G4 E4 C4 E4 G4 E4 C4 E4 G4 E4 Bb3 D4 F4 D4 Bb3 D4 F4 D4 Bb3 D4 F4 D4 Bb3 D4 F4 D4 A3 C#4 E4 C#4 A3 C#4 E4 C#4 A3 C#4 E4 C#4 A3 C#4 E4 C#4' },
      { w: 'noise', v: 0.02, s: 'x:4 x:4 x:4 x:4' }
    ] };
    for (const c of TR.observatory.ch) c.notes = A.parse(c.s);
  }

  // ------------------------------------------------------------------
  //  Tema visual da masmorra (céu noturno, latão e dourado)
  // ------------------------------------------------------------------
  G.THEMES.d7 = { dun: true, floor: 'tiles', wall: 'bricks', f: ['#121a34', '#1a2644', '#243456', '#30466c', '#486290'], wl: ['#05070f', '#0e1630', '#1a2848', '#2a3e66', '#4a6494'], acc: '#ffd84a', moss: '#3a4a8a', ca: ['#2a3a9a', '#ffd84a'], w: ['#24306a', '#3a4a8a', '#6a7ac0', '#b0c0f0'], amb: '#7080b0' };

  // ------------------------------------------------------------------
  //  Arte
  // ------------------------------------------------------------------
  G.artHooks = G.artHooks || [];
  G.artHooks.push(() => {
    const SPR = G.spr, Pn = (lw, lh) => new G.Paint(lw * 2, lh * 2);
    const brass = ['#5a3a10', '#9a6a24', '#d8a440', '#ffd87a', '#fff4c8'];
    { // ícone do gancho
      const p = Pn(16, 16);
      for (let i = 0; i < 5; i++) p.ell(7 + i * 3, 23 - i * 3, 2.4, 1.6, { ramp: R5('#a8b0c8'), ambient: 0.5 });
      cyl(p, inRR(20, 5, 6, 9, 2), brass, [19, 4, 27, 15]);
      p.poly([[18, 6], [23, 0], [28, 6], [25, 5], [23, 3], [21, 5]], brass[3]);
      p.ell(23, 9, 1.5, 1.5, '#ff5a6a');
      p.outline({ k: -0.8 }); SPR.hookItem = p.toCanvas();
    }
    { // ponta do gancho (aponta para a direita)
      const p = Pn(8, 8);
      p.poly([[2, 5], [10, 2], [15, 8], [10, 14], [2, 11]], (x, y) => (y < 8 ? brass[3] : brass[2]));
      p.poly([[9, 1], [15, 0], [12, 5]], brass[4]); p.poly([[9, 15], [15, 16], [12, 11]], brass[1]);
      p.outline({ k: -0.8 }); SPR.hookHead = p.toCanvas();
    }
    { // argola da média (no chão)
      const p = Pn(16, 16);
      p.ell(16, 18, 13, 9, { ramp: ['#1a1a2a', '#3a3a52', '#5a5a76', '#7a7a98', '#a0a0bc'], ambient: 0.4 });
      p.ell(16, 16, 9, 7, { ramp: brass, ambient: 0.5, contrast: 1.2 });
      p.ell(16, 16, 6, 4.5, '#2a2440');
      p.outline({ k: -0.8 }); SPR.hookRing = p.toCanvas();
    }
    { // projéteis
      const s = Pn(8, 8); s.poly([[8, 0], [10, 6], [16, 8], [10, 10], [8, 16], [6, 10], [0, 8], [6, 6]], (x, y) => (x + y < 14 ? '#ffffff' : '#bfe8ff')); s.outline({ color: '#2a4a8a' }); SPR.starShot = s.toCanvas();
      const o = Pn(8, 8); o.ell(8, 8, 6, 6, { ramp: R5('#ff4a5a'), ambient: 0.5, contrast: 1.2 }); o.outline({ k: -0.8 }); SPR.outBall = o.toCanvas();
    }
    { // cristal secreto da inferência
      const R = R5('#7ae4ff'), p = Pn(16, 16);
      const facets = [[[[16, 1], [8, 9], [16, 11]], '#ffffff'], [[[16, 1], [24, 9], [16, 11]], R[3]], [[[8, 9], [16, 11], [16, 30]], R[2]], [[[24, 9], [16, 11], [16, 30]], R[1]], [[[8, 9], [5, 12], [16, 30]], '#ffd84a'], [[[24, 9], [27, 12], [16, 30]], '#c08a1a']];
      for (const [pts, col] of facets) p.poly(pts, col);
      p.px(12, 6, '#ffffff'); p.px(13, 5, '#ffffff'); p.outline({ k: -0.8 });
      SPR.crystal_inferencia = p.toCanvas();
    }
  });
  // prédio do observatório (5x5 tiles)
  G.EXTRA_STRUCTS = Object.assign(G.EXTRA_STRUCTS || {}, { observatory: [5, 5] });
  G.structHooks = G.structHooks || [];
  G.structHooks.push(() => {
    const p = new G.Paint(160, 160), S = ['#1e2236', '#3a4060', '#5a6488', '#828cb0', '#b0b8d8'], Dm = ['#142a5a', '#24448a', '#3a64b8', '#6a94e0', '#b0d0ff'];
    const brass = ['#5a3a10', '#9a6a24', '#d8a440', '#ffd87a', '#fff4c8'];
    // torre
    cyl(p, inRR(18, 70, 124, 90, 3), S, [17, 69, 143, 160]);
    for (let y = 78; y < 158; y += 10) for (let x = 18; x < 142; x++) p.px(x, y, S[1]);
    for (let y = 78; y < 158; y += 10) for (let x = 22 + ((y / 10) % 2) * 9; x < 140; x += 18) for (let k = 0; k < 10; k++) p.px(x, y + k, S[1]);
    // cúpula com fenda e telescópio
    p.litMask((x, y) => { const dx = (x + 0.5 - 80) / 66, dy = (y + 0.5 - 76) / 62; return dx * dx + dy * dy <= 1 && y < 76; }, { ramp: Dm, radius: 18, ambient: 0.4, contrast: 1.15 }, [14, 14, 146, 76]);
    for (const k of [-44, -22, 22, 44]) for (let y = 18; y < 76; y++) { const x = 80 + k * Math.sqrt(Math.max(0, 1 - ((y - 76) / 62) ** 2)); if (p.alphaAt(x | 0, y)) p.px(x, y, Dm[1]); }
    for (let y = 16; y < 74; y++) for (let x = 74; x < 86; x++) if (p.alphaAt(x, y)) p.px(x, y, y < 22 ? '#0a0a1a' : '#050510');
    for (let i = 0; i < 40; i++) { const x = 74 + G.hsh(i, 3) * 12, y = 22 + G.hsh(i, 4) * 50; p.px(x, y, G.hsh(i, 5) > 0.6 ? '#ffffff' : '#7a8ac8'); }
    p.line(82, 40, 128, 4, brass[1], 9); p.line(82, 40, 128, 4, brass[2], 6); p.line(82, 38, 128, 2, brass[3], 2);
    cyl(p, inRR(124, 0, 10, 10, 2), brass, [123, 0, 135, 11]);
    for (let x = 14; x < 146; x++) { p.px(x, 74, brass[3]); p.px(x, 75, brass[2]); p.px(x, 76, brass[1]); }
    // porta em arco com moldura dourada
    for (let y = 118; y < 160; y++) for (let x = 66; x < 94; x++) { const inA = y > 132 || Math.hypot(x + 0.5 - 80, y - 132) < 14; if (inA) p.px(x, y, '#05030a'); }
    for (let y = 116; y < 160; y++) for (const x of [64, 65, 94, 95]) if (y > 132 || Math.hypot(x + 0.5 - 80, y - 132) < 16) p.px(x, y, brass[2]);
    // placa com μ e σ, janelas iluminadas
    cyl(p, inRR(62, 92, 36, 16, 2), brass, [61, 91, 99, 109]);
    for (const [wx, wy] of [[34, 96], [116, 96]]) { cyl(p, inRR(wx, wy, 12, 16, 5), ['#3a2a10', '#7a5a20', '#ffd060', '#fff0a0', '#ffffff'], [wx - 1, wy - 1, wx + 13, wy + 17]); }
    p.outline({ color: '#0a0818' });
    G.structs.observatory = p.toCanvas();
    if (G.DECO_LIGHTS) G.DECO_LIGHTS.observatory = [[20, 52, 24, '#ffd890'], [61, 52, 24, '#ffd890'], [40, 50, 30, '#9ab8ff'], [64, 2, 18, '#ffe08a']];
  });

  // ------------------------------------------------------------------
  //  Gancho da Regressão
  // ------------------------------------------------------------------
  G.ITEMS.hook = ['hookItem', 'GANCHO DA REGRESSÃO', 'Selecione com ^yQ^0 e lance com ^yC^0! Ele se prende nas ^cArgolas da Média^0 (μ) e puxa você até elas, por cima de buracos e água: uma ^gregressão à média^0! Também atordoa inimigos e puxa moedas.'];
  const give0 = G.give;
  G.give = async function (kind, n, o) {
    if (kind === 'item' && n === 'hook') { P().sub = 'hook'; }
    if (kind === 'crystal' && n === 'inferencia') {
      const p = G.player, P0 = P();
      if (p) { p.state = 'hold'; p.holdItem = 'crystal_inferencia'; }
      G.cutscene++;
      try {
        P0.flags.inferencia = true; G.sfx('crystal'); await G.wait(0.6);
        await G.ui.banner('crystal_inferencia', 'CRISTAL DA INFERÊNCIA!', 'Um sétimo cristal, secreto! Ele não estava entre os seis roubados: é o poder de tirar conclusões a partir dos dados.', { color: '#7ae4ff' });
      } finally { G.cutscene--; if (p && p.state === 'hold') { p.state = 'normal'; p.holdItem = null; } }
      return;
    }
    return give0.call(this, kind, n, o);
  };
  function hookTip(p) { const o = p.handPos(), d = G.DIRS[p.hook.dir]; return { x: o.x + d.x * p.hook.len, y: o.y + d.y * p.hook.len }; }
  function startHook(p) { p.state = 'hook'; p.hook = { dir: p.dir, len: 6, phase: 'out', t: 0 }; p.castT = 0.2; G.sfx('hook'); }
  function endHook(p, land) {
    p.state = 'normal'; p.hook = null;
    if (land) { p.z = 0; p.vz = 0; G.sfx('land'); G.fx.smoke(p.cx, p.y + p.h, 4, '#d8d0c0', 22); if (p.allSafe()) p.lastSafe = { x: p.x, y: p.y }; }
  }
  function hookUpdate(p, dt) {
    const H = p.hook; H.t += dt; p.t += dt; p.castT = 0.12;
    if (p.inv > 0) p.inv -= dt;
    if (H.phase === 'out') {
      const n = Math.max(1, Math.ceil(HOOK_SPD * dt / 4));
      for (let i = 0; i < n && H.phase === 'out'; i++) {
        H.len += HOOK_SPD * dt / n;
        const tip = hookTip(p), box = { x: tip.x - 3, y: tip.y - 3, w: 6, h: 6 };
        for (const e of G.ents) {
          if (e === p || e.dead || !G.sameRoom(e)) continue;
          if (e.hookable && G.overlap(box, e.hookBox ? e.hookBox() : e)) {
            G.fx.spark(tip.x, tip.y, '#ffe8a0', 8);
            if (e.onHooked) { e.onHooked(p, tip); H.phase = 'back'; G.sfx('clink'); break; }
            H.phase = 'pull'; H.target = e; H.tx = tip.x; H.ty = tip.y; G.sfx('clink'); break;
          }
          if (e.isEnemy && !e.isBoss && !e.dead && G.overlap(box, e.hurtbox ? e.hurtbox() : e)) {
            e.onHit(1, p.cx, p.cy, 'hook', false); e.hookStun = 1.5; e.kbT = 0; H.phase = 'back'; G.fx.spark(tip.x, tip.y, '#ffffff', 6); break;
          }
          if (e.isBoss && G.overlap(box, e.hurtbox())) { if (e.onHook) e.onHook(p, tip); else { G.sfx('tink'); G.fx.spark(tip.x, tip.y, '#ffffff', 5); } H.phase = 'back'; break; }
          if (e instanceof G.Pickup && G.overlap(box, e)) { H.carry = e; H.phase = 'back'; G.sfx('clink'); break; }
        }
        if (H.phase !== 'out') break;
        const tp = G.TP[G.map.tileAtPx(tip.x, tip.y)];
        if (tp.solid && !tp.low) { H.phase = 'back'; G.sfx('tink'); G.fx.spark(tip.x, tip.y, '#ffffff', 5); break; }
        if (H.len >= HOOK_RANGE) H.phase = 'back';
      }
    } else if (H.phase === 'back') {
      H.len -= HOOK_SPD * 1.5 * dt;
      if (H.carry && !H.carry.dead) { const tip = hookTip(p); H.carry.x = tip.x - 5; H.carry.y = tip.y - 5; H.carry.z = 0; H.carry.t = Math.max(H.carry.t, 0.3); }
      if (H.len <= 0) endHook(p, false);
    } else if (H.phase === 'pull') {
      // puxado até a argola, voando por cima de buracos, água e lava
      const goalX = H.target.cx, goalY = H.target.cy;
      const dx = goalX - p.cx, dy = goalY - p.cy, dist = Math.hypot(dx, dy), stp = PULL_SPD * dt;
      p.z = Math.min(7, p.z + 60 * dt);
      if (Math.random() < 0.6) G.fx.spawn({ x: p.cx + G.rf(-3, 3), y: p.y + p.h, vy: -8, life: 0.25, color: '#ffe8a0', size: 1 });
      if (dist <= stp + 0.5) { p.x += dx; p.y += dy; endHook(p, true); return; }
      const bx = p.x, by = p.y;
      G.moveEnt(p, dx / dist * stp, dy / dist * stp, { low: true, ghostEnts: true });
      if (Math.abs(p.x - bx) + Math.abs(p.y - by) < 0.01) endHook(p, true);
      const o = p.handPos(); H.len = Math.hypot(H.tx - o.x, H.ty - o.y);
    }
  }
  const pup = G.Player.prototype.update, pdraw = G.Player.prototype.draw;
  G.Player.prototype.update = function (dt) {
    if (this.state === 'hook') { hookUpdate(this, dt); return; }
    if (this.state === 'normal' && G.P.sub === 'hook' && G.P.items.hook && G.input.pressed('c') && this.z <= 0 && !this.carry && !G.cutscene) { startHook(this); return; }
    pup.call(this, dt);
  };
  G.Player.prototype.draw = function (ctx, cam) {
    pdraw.call(this, ctx, cam);
    const H = this.hook; if (!H) return;
    const o = this.handPos(); let tx, ty;
    if (H.phase === 'pull') { tx = H.tx; ty = H.ty; } else { const t = hookTip(this); tx = t.x; ty = t.y; }
    const len = Math.hypot(tx - o.x, ty - o.y), n = Math.max(1, Math.floor(len / 3.5));
    ctx.save();
    for (let i = 0; i <= n; i++) {
      const k = i / n, x = o.x + (tx - o.x) * k - cam.x, y = o.y + (ty - o.y) * k - cam.y;
      ctx.fillStyle = '#1b1428'; ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
      ctx.fillStyle = i % 2 ? '#d8a440' : '#ffe08a'; ctx.fillRect(x - 1, y - 1, 2, 2);
    }
    ctx.restore();
    const rot = [Math.PI / 2, -Math.PI / 2, Math.PI, 0][H.dir];
    G.draw(ctx, 'hookHead', tx - 4 - cam.x, ty - 4 - cam.y, { rot });
    G.light.add(tx - cam.x, ty - cam.y, 18, '#ffe8a0', 0.6);
  };
  // inimigos atordoados pelo gancho
  const eup = G.Enemy.prototype.update, edraw = G.Enemy.prototype.draw;
  G.Enemy.prototype.update = function (dt) {
    if (this.hookStun > 0) { this.hookStun -= dt; this.t += dt; if (this.hurtT > 0) this.hurtT -= dt; this.tellT = 0; return; }
    return eup.call(this, dt);
  };
  G.Enemy.prototype.draw = function (ctx, cam) {
    edraw.call(this, ctx, cam);
    if (this.hookStun > 0) for (let i = 0; i < 3; i++) { const a = this.t * 5 + i * 2.1; G.draw(ctx, 'sparkle', this.cx + Math.cos(a) * 8 - 2 - cam.x, this.y - 16 + Math.sin(a) * 3 - cam.y); }
  };

  class HookRing extends G.Ent {
    constructor(x, y, room) { super(x + 2, y + 2, 12, 12); this.hookable = true; this.room = room === undefined ? G.curRoom : room; }
    get by() { return this.y - 100000; }
    hookBox() { return { x: this.x - 2, y: this.y - 2, w: 16, h: 16 }; }
    get darkGlow() { return 24; }
    update(dt) { this.t += dt; }
    draw(ctx, cam) {
      const x = this.cx - cam.x, y = this.cy - cam.y, k = 0.5 + 0.5 * Math.sin(this.t * 3);
      G.draw(ctx, 'hookRing', x - 8, y - 9);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, x, y - 1, 10, '#ffd87a', 0.25 + 0.2 * k); ctx.restore();
      G.light.add(x, y, 26, '#ffd87a', 0.5);
    }
  }
  G.HookRing = HookRing;

  // ------------------------------------------------------------------
  //  Avisos em colunas (ataques do chefe)
  // ------------------------------------------------------------------
  class WarnCol extends G.Ent {
    constructor(x, y, w, h, t, safe, room, onDone) { super(x, y, w, h); this.life = t; this.max = t; this.safe = safe; this.room = room; this.onDone = onDone; }
    get by() { return this.y - 600; }
    update(dt) { this.t += dt; this.life -= dt; if (this.life <= 0) { this.dead = true; if (this.onDone) this.onDone(this); } }
    draw(ctx, cam) {
      const x = this.x - cam.x, y = this.y - cam.y, c = this.safe ? '#5aff8a' : '#ff3a6a', k = 1 - this.life / this.max;
      ctx.save();
      ctx.globalAlpha = this.safe ? 0.14 : 0.12 + 0.18 * k + 0.08 * Math.sin(this.t * (10 + k * 30)); ctx.fillStyle = c; ctx.fillRect(x + 1, y + 1, this.w - 2, this.h - 2);
      ctx.globalAlpha = 0.8; ctx.strokeStyle = c; ctx.lineWidth = 1; ctx.setLineDash([4, 3]); ctx.lineDashOffset = -this.t * 20; ctx.strokeRect(x + 1.5, y + 1.5, this.w - 3, this.h - 3);
      ctx.restore();
    }
    drawLate(ctx, cam) { if (this.safe) G.text('SEGURO', this.x - cam.x + this.w / 2, this.y - cam.y + this.h * 0.55, '#7aff8a', { align: 'center', outline: '#0a2a10' }); }
  }

  // ------------------------------------------------------------------
  //  CHEFE: HIPÓTESE NULA, a Esfinge do Acaso
  // ------------------------------------------------------------------
  class Orbe extends G.Ent {
    constructor(boss, i) { super(0, 0, 10, 10); this.boss = boss; this.i = i; this.hookable = true; this.room = boss.room; this.val = G.ri(1, 9); this.spawnT = 0.5; }
    hookBox() { return { x: this.x - 4, y: this.y - 4, w: 18, h: 18 }; }
    onHooked(p) { if (this.yank) return; this.yank = 0.3; this.hookable = false; this.tx0 = this.cx; this.ty0 = this.cy; this.p = p; G.sfx('clink'); }
    update(dt) {
      this.t += dt; if (this.spawnT > 0) this.spawnT -= dt;
      const B = this.boss;
      if (B.dead || B.dying) { this.dead = true; return; }
      if (this.yank) {
        this.yank -= dt; const k = 1 - Math.max(0, this.yank) / 0.3, p = this.p;
        this.x = G.lerp(this.tx0, p.cx, k * 0.7) - 5; this.y = G.lerp(this.ty0, p.cy - 10, k * 0.7) - 5;
        if (this.yank <= 0) { this.dead = true; G.sfx('orb'); G.fx.burst(this.cx, this.cy, ['#ffffff', '#7ae4ff', '#c8a0ff'], 16, 90); G.fx.ring(this.cx, this.cy, 16, '#bff4ff', 0.3, 2); G.fx.text(this.cx, this.cy - 12, 'amostra ' + this.val + '!', '#7ae4ff'); B.orbLost(); }
        return;
      }
      const a = B.orbA + this.i * TAU / B.orbN, R = B.orbR;
      this.x = B.cx + Math.cos(a) * R - 5; this.y = B.cy - B.z + Math.sin(a) * R * 0.62 - 5 + 8;
      const p = G.player;
      if (p && this.spawnT <= 0 && p.z < 6 && G.overlap({ x: this.x + 1, y: this.y + 1, w: 8, h: 8 }, { x: p.x, y: p.y - 8, w: p.w, h: p.h + 8 })) G.hurtPlayer(2, this.cx, this.cy);
    }
    get by() { return this.y + 40; }
    draw(ctx, cam) {
      const x = this.cx - cam.x, y = this.cy - cam.y, k = this.spawnT > 0 ? 1 - this.spawnT / 0.5 : 1;
      ctx.save(); ctx.globalAlpha = k;
      ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, x, y, 11, '#7ae4ff', 0.5 + 0.2 * Math.sin(this.t * 6)); ctx.globalCompositeOperation = 'source-over';
      const g = ctx.createRadialGradient(x - 1.5, y - 1.5, 0.5, x, y, 5.5); g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#9ae8ff'); g.addColorStop(1, '#3a6ac8');
      ctx.fillStyle = '#0a1430'; ctx.beginPath(); ctx.arc(x, y, 5.6, 0, TAU); ctx.fill(); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 5, 0, TAU); ctx.fill();
      ctx.restore();
      G.text(String(this.val), x, y - 3.5, '#0a1430', { align: 'center', shadow: false });
      G.light.add(x, y, 22, '#7ae4ff', 0.6);
    }
  }
  class HipoteseNula extends G.Boss {
    constructor(x, y, arena) {
      super(x, y, 30, 14, { hp: 110, name: 'Hipótese Nula', topic: 'd7', dmg: 5, arena, xp: 120 });
      this.z = 30; this.baseY = y; this.hasP2 = true; this.orbs = []; this.orbA = 0; this.orbR = 34; this.orbN = 5; this.orbDir = 1; this.cnt = 0; this.cool = 2;
    }
    hurtbox() { return { x: this.x, y: this.y - this.z - 16, w: this.w, h: 30 }; }
    contactBox() { return { x: this.x + 4, y: this.y - this.z - 6, w: this.w - 8, h: 16 }; }
    vulnerable(kind) { return this.stun > 0 ? (kind === 'hook' ? 0 : 1) : 0; }
    onHit(d, sx, sy, kind, crit) {
      const r = super.onHit(d, sx, sy, kind, crit);
      if (!r && this.stun <= 0 && !this.dying && this.st !== 'intro' && (!G._h0T || G.time - G._h0T > 6)) { G._h0T = G.time; G.ui.toast(this.orbs.length ? 'As AMOSTRAS protegem H₀! Arranque-as com o Gancho (C).' : 'H₀ está no alto: espere ela cair!', '#7ae4ff'); }
      return r;
    }
    spawnOrbs() {
      for (const o of this.orbs) o.dead = true;
      this.orbs = []; this.orbN = this.p2 ? 7 : 5;
      for (let i = 0; i < this.orbN; i++) { const o = new Orbe(this, i); this.orbs.push(o); G.addEnt(o); }
      G.sfx('teleport');
    }
    orbLost() {
      this.orbs = this.orbs.filter(o => !o.dead);
      if (!this.orbs.length && this.stun <= 0 && !this.dying) {
        // escudo rompido: H₀ é rejeitada e despenca
        this.stun = 4.2; this.st = 'down'; this.fall = 1;
        G.flash('#ffffff', 0.3, 0.5); G.shake(4, 0.4); G.sfx('explode');
        G.fx.text(this.cx, this.y - this.z - 24, 'p < 0,05: H₀ REJEITADA!', '#ffd84a', true);
        for (const e of G.ents) if (e instanceof WarnCol) e.dead = true;
      }
    }
    onStun() { this.st = 'down'; }
    next() {
      if (this.dying) return;
      if (this.st === 'intro' || this.st === 'down' || !this.orbs.length) this.spawnOrbs();
      this.st = 'float'; this.stT = this.p2 ? G.rf(1.2, 1.8) : G.rf(1.8, 2.6);
    }
    enterP2() { super.enterP2(); this.orbDir = -this.orbDir; }
    columns(dangerFn, msg) {
      const a = this.arena, n = 7, w = a.w / n;
      G.fx.text(a.x + a.w / 2, a.y + 24, msg, '#ffd84a', true);
      const room = this.room;
      for (let i = 0; i < n; i++) {
        const danger = dangerFn(i);
        G.addEnt(new WarnCol(a.x + i * w, a.y, w, a.h, 1.3, !danger, room, danger ? (wc) => {
          G.fx.burst(wc.cx, wc.y + wc.h / 2, ['#ff6a8a', '#ffffff', '#c8a0ff'], 12, 90); G.shake(2, 0.15);
          for (let k = 0; k < 3; k++) G.fx.ring(wc.cx, wc.y + 20 + k * 50, 14, '#ff8aa0', 0.3, 1.5);
          const p = G.player; if (p && p.z < 6 && p.cx >= wc.x && p.cx < wc.x + wc.w) G.hurtPlayer(this.dmg, wc.cx, p.cy);
        } : null));
      }
      G.sfx('tell');
    }
    ai(dt) {
      this.stT -= dt; this.orbA += dt * (this.p2 ? 1.9 : 1.2) * this.orbDir;
      if (this.p2 && Math.floor(this.t / 6) !== Math.floor((this.t - dt) / 6)) this.orbDir = -this.orbDir;
      const a = this.arena, p = G.player;
      if (this.st === 'float') {
        this.z = G.approach(this.z, 30, 40 * dt);
        const tx = G.clamp(p.cx + Math.sin(this.t * 0.7) * 60, a.x + 40, a.x + a.w - 40), ty = a.y + 56;
        this.x += G.clamp(tx - this.cx, -40 * dt, 40 * dt); this.y += G.clamp(ty - this.y, -30 * dt, 30 * dt);
        if (this.stT <= 0) {
          const moves = this.p2 ? ['stars', 'bell', 'tails', 'dive', 'stars', 'summon'] : ['stars', 'bell', 'dive', 'stars'];
          const m = moves[this.cnt++ % moves.length];
          if (m === 'stars') {
            const n = this.p2 ? 12 : 9;
            for (let ring = 0; ring < (this.p2 ? 2 : 1); ring++) for (let i = 0; i < n; i++) { const an = i * TAU / n + ring * TAU / n / 2; const s = this.shot(this.cx, this.cy - this.z, an, 62 + ring * 22, { spr: 'starShot', size: 7, life: 4 }); s.z = 0; }
            G.sfx('beam'); this.st = 'float'; this.stT = this.p2 ? 1.4 : 2;
          } else if (m === 'bell') {
            this.columns(i => i >= 2 && i <= 4, '68% dos dados ficam perto da média!'); this.st = 'wait'; this.stT = 1.8;
          } else if (m === 'tails') {
            this.columns(i => i <= 1 || i >= 5, 'Teste bicaudal: as CAUDAS explodem!'); this.st = 'wait'; this.stT = 1.8;
          } else if (m === 'dive') {
            this.st = 'aim'; this.stT = 0.8; this.aimX = p.cx; this.aimY = p.cy; G.sfx('tell');
          } else {
            for (let i = 0; i < 2; i++) G.addEnt(G.makeEnemy('ruido', a.x + 50 + i * (a.w - 100), a.y + a.h - 40, { room: this.room, tier: 1.6 }));
            G.sfx('teleport'); this.st = 'float'; this.stT = 1.6;
          }
        }
      } else if (this.st === 'wait') {
        this.z = G.approach(this.z, 30, 40 * dt);
        if (this.stT <= 0) this.next();
      } else if (this.st === 'aim') {
        if (this.stT <= 0) { this.st = 'dive'; this.stT = 0.55; this.dx0 = this.cx; this.dy0 = this.y; G.sfx('spin'); }
      } else if (this.st === 'dive') {
        const k = 1 - this.stT / 0.55;
        this.x = G.lerp(this.dx0, this.aimX, Math.min(1, k * 1.6)) - this.w / 2; this.y = G.lerp(this.dy0, this.aimY - 6, Math.min(1, k * 1.6));
        this.z = Math.abs(Math.cos(k * Math.PI)) * 30;
        this.clampArena(4);
        if (this.stT <= 0) { this.st = 'float'; this.stT = 1.2; G.fx.ring(this.cx, this.cy, 26, '#c8a0ff', 0.35, 2); G.shake(2, 0.2); }
      }
      this.clampArena(4);
    }
    update(dt) {
      if (this.stun > 0) { this.z = G.approach(this.z, 0, 70 * dt); if (Math.random() < 0.3) G.fx.spawn({ x: this.cx + G.rf(-12, 12), y: this.y - 10, vy: -20, life: 0.5, color: '#ffe8a0', size: 1 }); }
      super.update(dt);
    }
    draw(ctx, cam) {
      const x = this.cx - cam.x, gy = this.y + this.h - cam.y, y = this.cy - this.z - cam.y - 8, t = this.t;
      G.shadow(ctx, x, gy, Math.max(10, 26 - this.z * 0.35), 0.35);
      if (this.st === 'aim') { ctx.save(); ctx.strokeStyle = '#ff5a7a'; ctx.globalAlpha = 0.7; ctx.setLineDash([4, 3]); ctx.lineDashOffset = -t * 30; ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(this.aimX - cam.x, this.aimY - cam.y); ctx.stroke(); ctx.restore(); }
      // amarras de luz até as amostras
      if (this.orbs.length && this.stun <= 0) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(122,228,255,' + (0.25 + 0.15 * Math.sin(t * 5)) + ')'; ctx.lineWidth = 1;
        for (const o of this.orbs) if (!o.yank) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(o.cx - cam.x, o.cy - cam.y); ctx.stroke(); }
        ctx.beginPath(); ctx.ellipse(x, y + 8, this.orbR + 4, this.orbR * 0.62 + 3, 0, 0, TAU); ctx.stroke();
        ctx.restore();
      }
      const fl = this.flashOn(), tilt = this.stun > 0 ? Math.sin(t * 3) * 0.25 : Math.sin(t * 1.3) * 0.05;
      ctx.save(); ctx.translate(x, y); ctx.rotate(tilt); ctx.scale(1.3, 1.3);
      // manto de nebulosa
      const mg = ctx.createLinearGradient(0, -6, 0, 26); mg.addColorStop(0, '#5a3aa8'); mg.addColorStop(1, 'rgba(40,20,90,0)');
      ctx.fillStyle = mg; ctx.beginPath(); ctx.moveTo(-16, 4); ctx.quadraticCurveTo(-22, 22 + Math.sin(t * 3) * 2, -6, 28); ctx.lineTo(6, 28); ctx.quadraticCurveTo(22, 22 + Math.cos(t * 3) * 2, 16, 4); ctx.closePath(); ctx.fill();
      for (let i = 0; i < 9; i++) { const sx = Math.sin(i * 2.7) * 12, sy = 8 + (i * 7.3) % 18, tw = 0.4 + 0.6 * Math.abs(Math.sin(t * 2 + i)); ctx.fillStyle = 'rgba(255,255,255,' + (tw * 0.8) + ')'; ctx.fillRect(sx, sy, 0.6, 0.6); } // estrelas no manto
      // auréola em forma de sino
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 1.5; ctx.beginPath();
      for (let i = -24; i <= 24; i++) { const yy = -16 - 12 * Math.exp(-(i * i) / 90); if (i === -24) ctx.moveTo(i, yy); else ctx.lineTo(i, yy); }
      ctx.stroke(); G.glow(ctx, 0, -22, 16, '#ffd84a', 0.25); ctx.restore();
      // máscara de pedra
      ctx.fillStyle = '#140c24'; ctx.beginPath(); ctx.ellipse(0, 0, 15, 16, 0, 0, TAU); ctx.fill();
      const sg = ctx.createLinearGradient(-12, -14, 10, 14); sg.addColorStop(0, fl ? '#ffffff' : '#ece6fa'); sg.addColorStop(0.6, fl ? '#ffffff' : '#a89cc8'); sg.addColorStop(1, fl ? '#ffffff' : '#6a5a90');
      ctx.fillStyle = sg; ctx.beginPath(); ctx.ellipse(0, 0, 14, 15, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(40,20,70,0.5)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(6, -12); ctx.lineTo(3, -5); ctx.lineTo(7, 1); ctx.stroke();
      const angry = this.st === 'aim' || this.st === 'dive' || this.p2;
      if (this.stun > 0) { ctx.strokeStyle = '#2a1a40'; ctx.lineWidth = 1.2; for (const ex of [-6, 6]) { ctx.beginPath(); ctx.moveTo(ex - 2.5, -3); ctx.lineTo(ex + 2.5, 2); ctx.moveTo(ex + 2.5, -3); ctx.lineTo(ex - 2.5, 2); ctx.stroke(); } }
      else for (const ex of [-6, 6]) { ctx.fillStyle = '#1a0a2a'; ctx.beginPath(); ctx.ellipse(ex, -1, 3.4, 2.2, ex < 0 ? 0.2 : -0.2, 0, TAU); ctx.fill(); ctx.fillStyle = angry ? '#ff4a6a' : '#7ae4ff'; ctx.beginPath(); ctx.ellipse(ex, -1, 2.2, 1.3, 0, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#2a1a40'; ctx.fillRect(-5, 7, 10, 1.2);
      ctx.restore();
      G.text('H₀', x, y - 17, '#c08a1a', { align: 'center', shadow: false });
      G.light.add(x, y, 60, this.stun > 0 ? '#ffd84a' : '#a08aff', 0.8);
      this.drawStunStars(ctx, x, y - 20);
    }
  }

  // ------------------------------------------------------------------
  //  MINI-CHEFES
  // ------------------------------------------------------------------
  Object.assign(G.ENEMY_DEFS, {
    reidado: { hp: 46, dmg: 4, xp: 45, speed: 0, w: 26, h: 12 },
    histocolosso: { hp: 54, dmg: 4, xp: 50, speed: 16, w: 40, h: 12 },
    boxsentinela: { hp: 50, dmg: 4, xp: 55, speed: 24, w: 30, h: 12 }
  });
  Object.assign(G.BESTIARY, {
    reidado: { name: 'Rei Dado', color: '#ffffff', text: 'O soberano do acaso! Cada pulo sorteia uma face de 1 a 6, e cada face é um ataque. Tirou ^r1^0? Fica tonto e vulnerável!' },
    histocolosso: { name: 'Histograma Colossal', color: '#7ad8ff', text: 'Um histograma gigante. Cada barra atira tantas vezes quanto a sua ^yfrequência^0. Leia a forma antes que ela dispare!' },
    boxsentinela: { name: 'Sentinela Boxplot', color: '#ffd84a', text: 'Só a ^yMEDIANA^0 sustenta esta caixa de pedra. Arranque-a com o ^cGancho^0 (C) e ataque enquanto ela se desmonta!' }
  });
  const { part } = G.rig;
  class MiniBoss extends G.Enemy {
    constructor(x, y, type, o) { super(x, y, type, o); this.heavy = true; this.isMini = true; this.stompable = false; this.spawnT = 0.6; }
    // o corpo desenhado é alto: a espada acerta o corpo, o contato continua só na base
    contactBox() { return { x: this.x - 1, y: this.y - 7, w: this.w + 2, h: this.h + 7 }; }
    flashOn() { return this.hurtT > 0 && Math.floor(this.t * 30) % 2 === 0; }
    look() { return { white: this.flashOn(), alpha: this.spawnT > 0 ? G.clamp(1 - this.spawnT / 0.6, 0, 1) : 1 }; }
    shot(ang, sp, o = {}) { const e = G.addEnt(new G.EShot(this.cx, this.cy - 10, Math.cos(ang) * sp, Math.sin(ang) * sp, Object.assign({ dmg: this.dmg, size: 7, spr: 'pip', life: 4 }, o))); e.room = this.room; return e; }
    die(kind) {
      G.hitStop = 0.25; G.flash('#ffffff', 0.4, 0.6); G.shake(5, 0.5);
      for (let i = 0; i < 6; i++) G.fx.burst(this.cx + G.rf(-16, 16), this.cy - G.rf(0, 20), ['#ffffff', '#ffd84a', '#ff8a5a'], 10, 90);
      G.fx.ring(this.cx, this.cy - 8, 50, '#ffffff', 0.5, 3); G.sfx('explode');
      super.die(kind);
    }
  }
  // REI DADO — cada pulo sorteia um ataque
  class ReiDado extends MiniBoss {
    constructor(x, y, type, o) { super(x, y, type, o); this.name = 'Rei Dado'; this.face = 6; this.st = 'idle'; this.stT = 1.2; this.hops = 0; this.landT = 0; }
    sprName() { return 'reidado_icon'; }
    hurtbox() { return { x: this.cx - 19, y: this.y + this.h - 40 - this.z, w: 38, h: 40 }; }
    immune() { return this.z > 6; }
    onHit(d, sx, sy, kind, crit) { if (this.st === 'dizzy') d *= 2; return super.onHit(d, sx, sy, kind, crit); }
    ai(dt) {
      this.stT -= dt; const p = G.player;
      if (this.landT > 0) this.landT -= dt;
      if (this.later > 0) { this.later -= dt; if (this.later <= 0) { for (let i = 0; i < 4; i++) this.shot(i * TAU / 4 + TAU / 8, 90); G.sfx('beam'); } }
      if (this.st === 'idle') { if (this.stT <= 0) this.hop(p.cx, p.cy); }
      else if (this.st === 'hop') {
        const k = 1 - this.stT / this.hopT; this.x = G.lerp(this.hx0, this.hx1, k); this.y = G.lerp(this.hy0, this.hy1, k); this.z = Math.sin(k * Math.PI) * 40;
        if (this.stT <= 0) {
          this.z = 0; this.landT = 0.22; G.sfx('stomp'); G.shake(3, 0.2); G.fx.smoke(this.cx, this.y + this.h, 8, '#c8b8a0', 34); G.fx.ring(this.cx, this.cy, 26, '#ffffff', 0.3, 2);
          if (p.z < 6 && G.dist(p.cx, p.cy, this.cx, this.cy) < 28) G.hurtPlayer(this.dmg, this.cx, this.cy);
          if (this.hops > 0) { this.hops--; this.hop(p.cx, p.cy, 0.5); return; }
          this.st = 'roll'; this.stT = 0.7; G.sfx('dice');
        }
      } else if (this.st === 'roll') {
        this.face = G.ri(1, 6);
        if (this.stT <= 0) { this.face = G.ri(1, 6); this.act(); }
      } else if (this.st === 'dizzy') { if (this.stT <= 0) { this.st = 'idle'; this.stT = 0.6; } }
      else if (this.st === 'act') { if (this.stT <= 0) { this.st = 'idle'; this.stT = 0.8; } }
    }
    hop(tx, ty, t = 0.75) {
      const a = this.room >= 0 ? G.map.rooms.find(r => r.idx === this.room) : null;
      if (a) { tx = G.clamp(tx, a.px + 40, a.px + 23 * TS - 40); ty = G.clamp(ty, a.py + 40, a.py + 12 * TS - 30); }
      this.st = 'hop'; this.hopT = t; this.stT = t; this.hx0 = this.x; this.hy0 = this.y; this.hx1 = tx - this.w / 2; this.hy1 = ty - this.h / 2;
      const w = G.addEnt(new G.Warn(tx, ty, 22, t)); w.room = this.room; G.sfx('jump');
    }
    act() {
      const p = G.player, f = this.face, aim = Math.atan2(p.cy - this.cy, p.cx - this.cx);
      G.fx.text(this.cx, this.y - 34, String(f) + '!', f === 1 ? '#ff6a6a' : f === 6 ? '#ffd84a' : '#ffffff', true);
      this.st = 'act'; this.stT = 0.9;
      if (f === 1) { this.st = 'dizzy'; this.stT = 2.6; G.sfx('wrong'); G.fx.text(this.cx, this.y - 46, 'TONTO! dano x2', '#ff8a8a'); }
      else if (f === 2) { for (const s of [-0.18, 0.18]) this.shot(aim + s, 120, { size: 9 }); G.sfx('beam'); }
      else if (f === 3) { this.hops = 2; this.hop(p.cx, p.cy, 0.55); }
      else if (f === 4) { for (let i = 0; i < 4; i++) this.shot(i * TAU / 4, 90); this.later = 0.35; G.sfx('beam'); }
      else if (f === 5) { for (let i = 0; i < 5; i++) this.shot(aim + (i - 2) * 0.5, 55, { homing: 1.3, life: 5 }); G.sfx('teleport'); }
      else { for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) this.shot(i * TAU / 6 + r * TAU / 12, 80 + r * 25); G.sfx('explode'); G.shake(2, 0.2); }
    }
    // pose: agacha antes do pulo, estica no ar, achata ao cair; a coroa e as mãos vêm atrasadas
    pose() {
      const s = this.st, t = this.t, br = Math.sin(t * 3) * 0.014;
      const k = { dx: 0, dy: 0, rot: 0, sx: 1 - br, sy: 1 + br, cape: Math.sin(t * 2.4) * 0.03, crY: 0, crR: Math.sin(t * 1.7) * 0.04, hl: Math.sin(t * 3) * 1.5, hr: Math.sin(t * 3 + 1.4) * 1.5, hx: 0, scep: -0.35, eyes: (t % 3.4) < 0.12 ? 'Blink' : '' };
      if (s === 'hop') {
        const q = G.clamp(1 - this.stT / this.hopT, 0, 1), dir = Math.sign(this.hx1 - this.hx0) || 1, up = Math.sin(q * Math.PI);
        if (q < 0.12) { k.sx = 1.14; k.sy = 0.86; } else { k.sx = 0.93; k.sy = 1.08; }
        k.rot = Math.sin(q * Math.PI * 2) * 0.07 * dir; k.crY = -Math.max(0, q - 0.45) * 12; k.crR = Math.sin(q * Math.PI * 2) * 0.14 * dir;
        k.hl = k.hr = -9 * up; k.hx = 3 * up; k.cape = -0.1 * up; k.scep = -0.35 - 0.5 * up; k.eyes = 'Mad';
      } else if (s === 'roll') {
        k.rot = Math.sin(t * 40) * 0.16; k.dy = -Math.abs(Math.sin(t * 20)) * 3; k.crY = -Math.abs(Math.sin(t * 20)) * 4;
        k.hl = -7 + Math.sin(t * 30) * 3; k.hr = -7 - Math.sin(t * 30) * 3; k.hx = 2; k.scep = -0.35 + Math.sin(t * 25) * 0.6; k.eyes = 'Mad';
      } else if (s === 'act') {
        const q = G.clamp(1 - this.stT / 0.9, 0, 1); k.scep = -1.5 + q * 1.1; k.hr = -12 + q * 12; k.eyes = 'Mad';
      } else if (s === 'dizzy') {
        k.rot = Math.sin(t * 3) * 0.1; k.crR = 0.38 + Math.sin(t * 3) * 0.1; k.crY = 2; k.hl = k.hr = 7; k.hx = -2; k.scep = 0.9; k.eyes = 'Dizzy';
      }
      if (this.landT > 0) { const l = this.landT / 0.22; k.sx *= 1 + 0.22 * l; k.sy *= 1 - 0.2 * l; k.crY += 5 * l; k.hl += 4 * l; k.hr += 4 * l; }
      if (this.squashT > 0) { const q = this.squashT / 0.16; k.sx *= 1 + 0.12 * q; k.sy *= 1 - 0.1 * q; }
      if (this.tellT > 0) k.dx = Math.sin(t * 90) * 0.8;
      return k;
    }
    draw(ctx, cam) {
      const A = G.bossArt, k = this.pose(), o = this.look(), x = this.cx - cam.x, base = this.y + this.h - cam.y;
      G.shadow(ctx, x + 2, base - 1, 42 - Math.min(18, this.z * 0.35), 0.38);
      ctx.save(); ctx.translate(x + k.dx, base - this.z + k.dy); ctx.rotate(k.rot); ctx.scale(k.sx, k.sy);
      part(ctx, A.rdCape, 0, -39, 26, 1, k.cape, o);
      part(ctx, A['rdBody' + this.face], 0, 0, 19, 41.5, 0, o);
      part(ctx, A.rdCrown, 3.5, -36.5 + k.crY, 13, 15.5, k.crR, Object.assign({ glow: A.rdCrownGlow, glowA: 0.45 + 0.25 * Math.sin(this.t * 4), glowC: '#fff0c0' }, o));
      part(ctx, A['rdEyes' + k.eyes], 0, -32.5, 12, 4.75, 0, k.eyes === 'Mad' ? Object.assign({ glow: A.rdEyesMadGlow, glowA: 0.8, glowC: '#ff4a5a' }, o) : o);
      // mãos flutuando; a direita segura o cetro
      part(ctx, A.rdGlove, -24 - k.hx, -13 + k.hl, 5.5, 5, 0, o);
      part(ctx, A.rdScepter, 24 + k.hx, -13 + k.hr, 4, 20, k.scep, Object.assign({ glow: A.rdScepterGlow, glowA: 0.6, glowC: '#ff6a7a' }, o));
      part(ctx, A.rdGloveF, 24 + k.hx, -13 + k.hr, 5.5, 5, 0, o);
      ctx.restore();
      const cx = x, cy = base - this.z - 46;
      if (this.st === 'dizzy') for (let i = 0; i < 3; i++) { const a = this.t * 5 + i * 2.1; G.draw(ctx, 'sparkle', cx + Math.cos(a) * 15 - 2, cy + Math.sin(a) * 4); }
      G.light.add(cx, cy + 14, 80, '#fff4d8', 0.85);
    }
  }
  // HISTOGRAMA COLOSSAL — barras que disparam conforme a frequência
  const SHAPES = [['simétrica', [2, 4, 6, 4, 2]], ['assimétrica à direita', [6, 5, 3, 2, 1]], ['assimétrica à esquerda', [1, 2, 3, 5, 6]], ['uniforme', [4, 4, 4, 4, 4]], ['bimodal', [5, 2, 1, 2, 5]]];
  class HistoColosso extends MiniBoss {
    constructor(x, y, type, o) { super(x, y, type, o); this.name = 'Histograma Colossal'; this.h5 = [3, 3, 3, 3, 3]; this.shape = 0; this.target = SHAPES[0][1]; this.st = 'walk'; this.stT = 1.5; }
    sprName() { return 'histocolosso_icon'; }
    hurtbox() { const mx = Math.max(...this.h5), by = this.y + this.h; return { x: this.cx - 23, y: by - 18 - mx * 6.5, w: 46, h: 18 + mx * 6.5 }; }
    ai(dt) {
      this.stT -= dt; const p = G.player;
      for (let i = 0; i < 5; i++) this.h5[i] = G.approach(this.h5[i], this.target[i], dt * 8);
      if (this.st === 'walk') {
        const a = Math.atan2(p.cy - this.cy, p.cx - this.cx); this.move(Math.cos(a) * this.speed * dt, Math.sin(a) * this.speed * dt);
        if (this.stT <= 0) { this.shape = (this.shape + G.ri(1, 4)) % 5; this.target = SHAPES[this.shape][1]; this.st = 'morph'; this.stT = 0.8; G.sfx('switch'); }
      } else if (this.st === 'morph') {
        if (this.stT <= 0) { this.tell(0.45); this.st = 'tell'; this.stT = 0.45; }
      } else if (this.st === 'tell') {
        if (this.stT <= 0) { this.fire(); this.st = 'walk'; this.stT = this.hp < this.maxHp / 2 ? 1.6 : 2.4; }
      }
    }
    fire() {
      const p = G.player, aim = Math.atan2(p.cy - this.cy, p.cx - this.cx);
      this.target.forEach((hh, i) => { for (let k = 0; k < hh; k++) { const a = aim + (i - 2) * 0.28 + (k - (hh - 1) / 2) * 0.07; const e = G.addEnt(new G.EShot(this.x + 4 + i * 8, this.y - 10 - hh * 3, Math.cos(a) * (70 + k * 9), Math.sin(a) * (70 + k * 9), { dmg: this.dmg, size: 6, spr: 'dataShot', life: 4 })); e.room = this.room; } });
      G.sfx('beam');
      if (this.hp < this.maxHp / 2) {
        // chuva de frequências: colunas de pedras conforme a altura das barras
        const r = G.map.rooms.find(rr => rr.idx === this.room); if (!r) return;
        this.target.forEach((hh, i) => { for (let k = 0; k < Math.ceil(hh / 2); k++) G.dropRock(this, r.px + (3 + i * 4.3) * TS + G.rf(-8, 8), r.py + G.rf(2.5, 10.5) * TS, { r: 10, dmg: this.dmg }); });
      }
    }
    draw(ctx, cam) {
      const A = G.bossArt, o = this.look(), x = this.cx - cam.x, by = this.y + this.h - cam.y, walk = this.st === 'walk', ph = this.t * 6;
      const jx = this.tellT > 0 ? Math.sin(this.t * 90) * 0.8 : 0, red = this.tellT > 0 && Math.floor(this.t * 20) % 2 === 0;
      G.shadow(ctx, x, by - 1, 54, 0.38);
      // pés alternados e a base (eixo x) balançando com o passo
      for (const s of [-1, 1]) { const lift = walk ? Math.max(0, Math.sin(ph + (s > 0 ? Math.PI : 0))) * 3 : 0; part(ctx, A.hcFoot, x + s * 14 + jx, by - lift, 5, 7, 0, o); }
      const bob = walk ? Math.abs(Math.sin(ph)) * 1.2 : 0, baseY = by - 5 - bob, floor = baseY - 7;
      // barras: haste de gelo recortada pela altura (os sulcos marcam cada unidade de frequência) e a tampa facetada
      const mx = Math.max(...this.h5), mi = this.h5.indexOf(mx), COL = [0, 1, 2, 1, 0], tops = [];
      ctx.save(); if (o.alpha < 1) ctx.globalAlpha *= o.alpha;
      this.h5.forEach((hh, i) => {
        const sh0 = A['hcShaft' + COL[i]], sh = o.white ? G.white(sh0) : red ? G.tint(sh0, 'rgba(255,70,90,0.55)') : sh0;
        const bh = hh * 6.5, bx = x - 22 + i * 9 + jx, wob = this.st === 'morph' ? Math.sin(this.t * 24 + i) * 0.6 : 0, top = floor - bh + wob;
        ctx.drawImage(sh, 0, sh.height - bh * 2, sh.width, bh * 2, bx, top, 8, bh);
        tops.push([bx + 4, top]);
      });
      ctx.restore();
      tops.forEach(([bx, top], i) => part(ctx, A['hcCap' + COL[i]], bx, top + 1.5, 4.5, 5, 0, red && !o.white ? Object.assign({ glow: A['hcCap' + COL[i]], glowA: 0.5, glowC: '#ff4a5a' }, o) : o));
      part(ctx, A.hcBase, x + jx, baseY, 24, 9.5, 0, o);
      // olhos na barra mais alta: a moda é quem enxerga
      const mad = this.tellT > 0 || this.hp < this.maxHp / 2, [ex, ey] = tops[mi];
      part(ctx, A['hcEyes' + (mad ? 'Mad' : '')], ex, ey + 6, 4, 2, 0, Object.assign({ glow: A['hcEyes' + (mad ? 'Mad' : '') + 'Glow'], glowA: 0.7 + 0.3 * Math.sin(this.t * 6), glowC: mad ? '#ff4a5a' : '#7af0ff' }, o));
      // frequência de cada barra enquanto ela troca de forma e mira
      if (this.st !== 'walk') tops.forEach(([bx, top], i) => G.text(String(this.target[i]), bx, top - 11, '#e8f8ff', { align: 'center' }));
      if (this.tellT > 0) G.drawTell(ctx, x, floor - mx * 6.5 - 20, this.t);
      G.light.add(x, floor - mx * 3, 80, mad ? '#ff8a9a' : '#9ae4ff', 0.7);
    }
    drawLate(ctx, cam) { if (this.st !== 'walk') G.puzTag(ctx, this.cx - cam.x, this.y + this.h - cam.y + 4, SHAPES[this.shape][0], '#9ad8ff'); }
  }
  // SENTINELA BOXPLOT — a mediana sustenta a caixa
  class BoxSentinela extends MiniBoss {
    constructor(x, y, type, o) { super(x, y, type, o); this.name = 'Sentinela Boxplot'; this.hookable = true; this.open = 0; this.wl = 20; this.ang = 0; this.st = 'walk'; this.stT = 1.6; this.cnt = 0; }
    sprName() { return 'boxsentinela_icon'; }
    hookBox() { return { x: this.cx - 6, y: this.y - 22, w: 12, h: 18 }; }
    hurtbox() { return { x: this.cx - 16, y: this.y + this.h - 34, w: 32, h: 34 }; }
    immune(kind) { return this.open <= 0; }
    onHit(d, sx, sy, kind, crit) { const r = super.onHit(d, sx, sy, kind, crit); if (!r && this.open <= 0 && !this.dead && (!G._bsT || G.time - G._bsT > 6)) { G._bsT = G.time; G.ui.toast('A caixa é firme demais! Arranque a MEDIANA com o Gancho (C).', '#ffd84a'); } return r; }
    onHooked() {
      if (this.open > 0 || this.dead) return;
      this.open = 3.6; this.st = 'open'; this.hookable = false; G.sfx('crumble'); G.shake(3, 0.3);
      G.fx.text(this.cx, this.y - 34, 'MEDIANA ARRANCADA!', '#ffd84a', true); G.fx.burst(this.cx, this.y - 12, ['#ffd84a', '#ffffff'], 14, 80);
    }
    ai(dt) {
      this.stT -= dt; const p = G.player;
      if (this.open > 0) { this.open -= dt; this.wl = G.approach(this.wl, 4, dt * 30); if (this.open <= 0) { this.st = 'walk'; this.stT = 1; this.hookable = true; G.sfx('teleport'); } return; }
      if (this.st === 'walk') {
        const a = Math.atan2(p.cy - this.cy, p.cx - this.cx); this.move(Math.cos(a) * this.speed * dt, Math.sin(a) * this.speed * dt);
        this.wl = G.approach(this.wl, 20, dt * 20); this.ang = G.approach(this.ang, 0, dt * 3);
        if (this.stT <= 0) {
          const m = this.cnt++ % 3;
          if (m === 2) { this.st = 'throw'; this.stT = 0.5; this.tell(0.5); }
          else { this.st = 'extend'; this.stT = 0.7; this.tell(0.6); }
        }
      } else if (this.st === 'extend') {
        this.wl = G.approach(this.wl, 46, dt * 70);
        if (this.stT <= 0) { this.st = 'sweep'; this.stT = 1.3; this.dirS = Math.random() < 0.5 ? 1 : -1; G.sfx('spin'); }
      } else if (this.st === 'sweep') {
        this.ang += dt * this.dirS * Math.PI / 1.3;
        // dano nos bigodes
        const cx = this.cx, cy = this.y - 6;
        for (const s of [-1, 1]) for (let k = 18; k <= this.wl; k += 6) {
          const wx = cx + Math.cos(this.ang) * k * s, wy = cy + Math.sin(this.ang) * k * s * 0.6;
          if (p.z < 6 && G.overlap({ x: wx - 3, y: wy - 3, w: 6, h: 6 }, { x: p.x, y: p.y - 8, w: p.w, h: p.h + 8 })) G.hurtPlayer(this.dmg, cx, cy);
        }
        if (this.stT <= 0) { this.st = 'walk'; this.stT = this.hp < this.maxHp / 2 ? 1.2 : 1.8; }
      } else if (this.st === 'throw') {
        if (this.stT <= 0) {
          const n = this.hp < this.maxHp / 2 ? 5 : 3;
          for (let i = 0; i < n; i++) { const a = Math.random() * TAU, d = G.rf(50, 90); G.dropRock(this, G.clamp(p.cx + Math.cos(a) * d * 0.6, this.cx - 150, this.cx + 150), p.cy + Math.sin(a) * d * 0.4, { r: 11, spr: 'outBall', cols: ['#ff5a6a', '#ffffff'] }); }
          G.fx.text(this.cx, this.y - 30, 'OUTLIERS!', '#ff8a9a'); G.sfx('beam');
          this.st = 'walk'; this.stT = 1.4;
        }
      }
    }
    draw(ctx, cam) {
      const A = G.bossArt, o = this.look(), x = this.cx - cam.x, by = this.y + this.h - cam.y, op = this.open > 0, walk = this.st === 'walk', ph = this.t * 5;
      const jx = this.tellT > 0 ? Math.sin(this.t * 90) * 0.8 : 0, red = this.tellT > 0 && Math.floor(this.t * 20) % 2 === 0;
      G.shadow(ctx, x, by - 1, 42, 0.38);
      // pernas: passo alternado; aberta, a caixa afunda e as pernas abrem
      for (const s of [-1, 1]) { const lift = walk ? Math.max(0, Math.sin(ph + (s > 0 ? Math.PI : 0))) * 2.5 : 0; part(ctx, A.bsLeg, x + s * (op ? 10 : 8) + jx, by - lift, 3.5, 11, op ? s * 0.12 : 0, o); }
      const cy = by - 19.5 - (walk ? Math.abs(Math.sin(ph)) : 0) + (op ? 2 : 0) + (this.squashT > 0 ? this.squashT * 8 : 0);
      // bigodes atrás da caixa (giram durante a varredura); a haste é recortada no comprimento
      ctx.save(); ctx.translate(x + jx, cy); ctx.rotate(this.ang);
      const rod = o.white ? G.white(A.bsRod) : this.st === 'sweep' ? G.tint(A.bsRod, 'rgba(255,90,110,0.5)') : A.bsRod, L = Math.max(0, this.wl - 8);
      for (const s of [-1, 1]) {
        ctx.save(); ctx.scale(s, 1); if (o.alpha < 1) ctx.globalAlpha *= o.alpha;
        if (L > 0) ctx.drawImage(rod, 0, 0, Math.min(rod.width, L * 2), rod.height, 8, -1.5, Math.min(48, L), 3);
        part(ctx, A.bsCap, this.wl, 0, 2, 6, 0, o); ctx.restore();
      }
      ctx.restore();
      // as duas metades (Q1 e Q3); sem a mediana elas se separam e tombam
      const gap = op ? 4 + Math.sin(this.t * 20) : 0, tilt = op ? 0.1 + Math.sin(this.t * 7) * 0.05 : 0;
      const eye = { glowA: op ? 0.12 : 0.65 + 0.3 * Math.sin(this.t * 5), glowC: op ? '#8a8aff' : '#ff4a5a' };
      const half = (side, s) => part(ctx, A['bsHalf' + side], x + jx + s * (0.5 + gap), cy, s < 0 ? 14.5 : 0.5, 10.5, s * tilt, Object.assign({ glow: A['bsHalf' + side + 'Glow'] }, eye, o));
      half('L', -1); half('R', 1);
      if (red && !o.white) for (const s of [-1, 1]) part(ctx, G.tint(A['bsHalf' + (s < 0 ? 'L' : 'R')], 'rgba(255,70,90,0.45)'), x + jx + s * 0.5, cy, s < 0 ? 14.5 : 0.5, 10.5, 0, { alpha: o.alpha });
      if (!op) part(ctx, A.bsMedian, x + jx, cy, 2, 12, 0, Object.assign({ glow: A.bsMedianGlow, glowA: 0.35 + 0.2 * Math.sin(this.t * 6), glowC: '#ffd84a' }, o));
      part(ctx, A.bsDome, x + jx, cy - 9.5 - (op ? Math.abs(Math.sin(this.t * 10)) * 3 : 0), 6, 6, op ? Math.sin(this.t * 9) * 0.2 : 0, Object.assign({ glow: A.bsDomeGlow, glowA: op ? 0.2 : 0.6, glowC: '#7ae4ff' }, o));
      if (this.tellT > 0) G.drawTell(ctx, x, cy - 26, this.t);
      if (op) for (let i = 0; i < 3; i++) { const a = this.t * 5 + i * 2.1; G.draw(ctx, 'sparkle', x + Math.cos(a) * 15 - 2, cy - 20 + Math.sin(a) * 4); }
      G.light.add(x, cy, 50, op ? '#8a8aff' : '#ffd84a', 0.6);
    }
  }
  Object.assign(G.ENEMY_CLASSES, { reidado: ReiDado, histocolosso: HistoColosso, boxsentinela: BoxSentinela });

  // ------------------------------------------------------------------
  //  ENIGMAS NOVOS
  // ------------------------------------------------------------------
  const PUZ = G.PUZ, tag = G.puzTag;
  const floorNum = (ctx, x, y, txt, col = '#e8e0c8') => { ctx.save(); ctx.globalAlpha = 0.9; G.text(txt, x, y, col, { align: 'center', shadowColor: 'rgba(0,0,0,0.6)', thin: true }); ctx.restore(); };
  const valOfRail = (b, r, x0) => Math.round((b.x - r.px) / TS) - x0;
  class FloorDecal extends G.Ent {
    constructor(x, y, w, h, fn) { super(x, y, w, h); this.fn = fn; }
    get by() { return -100000 + this.y; }
    draw(ctx, cam) { this.fn(ctx, this.x - cam.x, this.y - cam.y, this); }
  }

  // MÁQUINA DAS MÉDIAS (Teorema Central do Limite)
  class BigMachine extends G.Ent {
    constructor(x, y, S) { super(x, y + 20, 64, 14); this.solid = true; this.S = S; }
    get darkGlow() { return 50; }
    draw(ctx, cam) {
      const x = this.x - cam.x, y = this.y - 20 - cam.y, S = this.S;
      G.shadow(ctx, x + 32, this.y + this.h - cam.y, 60, 0.35);
      ctx.save();
      const bg = ctx.createLinearGradient(0, y, 0, y + 34); bg.addColorStop(0, '#6a7ab8'); bg.addColorStop(1, '#2a3460');
      ctx.fillStyle = '#0a0a18'; G.rrPath(ctx, x - 1, y - 1, 66, 36, 4); ctx.fill(); ctx.fillStyle = bg; G.rrPath(ctx, x, y, 64, 34, 4); ctx.fill();
      ctx.fillStyle = '#070a18'; G.rrPath(ctx, x + 4, y + 3, 56, 24, 2); ctx.fill();
      // funil de dados
      ctx.fillStyle = '#c8a050'; ctx.beginPath(); ctx.moveTo(x + 22, y); ctx.lineTo(x + 42, y); ctx.lineTo(x + 38, y - 8); ctx.lineTo(x + 26, y - 8); ctx.closePath(); ctx.fill();
      ctx.restore();
      // histograma na tela
      const n = S.n, nb = 5 * n + 1, cnt = new Array(nb).fill(0);
      for (const m of S.samples) cnt[Math.round(m * n) - n]++;
      const mx = Math.max(4, ...cnt), slot = 52 / nb;
      cnt.forEach((c, i) => { const h = c / mx * 18; ctx.fillStyle = n >= 5 ? '#7aff8a' : '#5ad8ff'; ctx.fillRect(x + 6 + i * slot, y + 25 - h, Math.max(0.8, slot - 0.4), h); });
      G.text('n = ' + n + (n === 1 ? ' dado' : ' dados'), x + 32, y + 28, '#ffe27a', { align: 'center', shadow: false });
      if (S.running > 0) for (let i = 0; i < Math.min(5, n); i++) G.dieFace(ctx, x + 18 + i * 6 - Math.min(5, n) * 3 + 12, y - 16 + Math.sin(G.time * 20 + i) * 2, G.ri(1, 6), 6);
      G.light.add(x + 32, y + 14, 60, n >= 5 ? '#7aff8a' : '#5ad8ff', 0.7);
    }
  }
  PUZ.cltmachine = (c) => {
    const { r, L, add } = c; let done = c.solved;
    const S = { n: done ? 5 : 1, ni: 0, samples: [], running: 0 }, NS = [1, 2, 5];
    const roll = () => { let s = 0; for (let i = 0; i < S.n; i++) s += G.ri(1, 6); S.samples.push(s / S.n); };
    if (done) for (let i = 0; i < 150; i++) roll();
    add(new BigMachine(...L(10, 2), S), r.idx);
    add(new G.Lever(...L(7, 7), () => { if (done || S.running > 0) return; S.ni = (S.ni + 1) % 3; S.n = NS[S.ni]; S.samples = []; G.ui.toast('Dados em cada média: ' + S.n, '#9ad8ff'); }), r.idx);
    add(new G.AnswerCrystal(...L(16, 7), 'GIRAR', false, () => { if (done || S.running > 0) return; S.samples = []; S.running = 2.4; G.sfx('dice'); }, { color: '#7aff8a' }), r.idx);
    add(new G.Sign(...L(3, 9), 'A alavanca troca quantos dados entram em CADA média (1, 2 ou 5). O cristal GIRA a máquina e desenha o histograma das médias.', { name: 'Placa' }), r.idx);
    return {
      dicas: ['Experimente: gire a máquina com 1 dado, depois com 2. Compare o formato dos histogramas.', 'Quanto mais dados entram em cada média, mais o histograma vira um sino. Use o máximo.'],
      prompt: '^yMÁQUINA DAS MÉDIAS^0: a porta norte só abre quando a tela mostrar um ^gSINO^0. Use a ^calavanca^0 para escolher quantos dados entram em cada média e golpeie o cristal para ^yGIRAR^0.',
      update(dt) {
        if (S.running <= 0) return;
        S.running -= dt;
        for (let i = 0; i < Math.ceil(dt * 75) && S.samples.length < 180; i++) roll();
        if (Math.random() < 0.3) G.sfx('flip');
        if (S.running <= 0 && !done) {
          if (S.n === 5) { done = true; G.ui.toast('Um SINO! Médias de 5 dados formam a curva normal: Teorema Central do Limite!', '#7aff8a'); G.recordQuiz('tcl', true); c.solve(); }
          else if (S.n === 1) G.ui.toast('Com 1 dado por média o histograma fica PLANO. Ainda não é um sino...', '#ffd84a');
          else G.ui.toast('Com 2 dados vira um TRIÂNGULO. Quase! Precisa de mais dados em cada média.', '#ffd84a');
        }
      },
      rewardPos: [11, 10]
    };
  };

  // TRIÂNGULO DE PASCAL (binomial)
  PUZ.pascal = (c) => {
    const { r, L, add } = c; let done = c.solved;
    const comb = st.comb, plates = [8, 10, 12, 14, 16].map(lx => add(new G.Plate(...L(lx, 9)), r.idx));
    add(new G.Decal(r.px, r.py, 24 * TS, 13 * TS, (ctx, x, y) => {
      for (let row = 0; row <= 4; row++) for (let k = 0; k <= row; k++) {
        const lx = 12 - row + 2 * k, ly = 1 + 2 * row, px = x + lx * TS + 8, py = y + ly * TS + 8;
        if (row < 4) {
          ctx.save(); ctx.fillStyle = 'rgba(10,14,40,0.55)'; ctx.beginPath(); ctx.arc(px, py, 7, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,216,74,0.6)'; ctx.lineWidth = 0.7; ctx.stroke();
          if (row < 3) { ctx.strokeStyle = 'rgba(255,216,74,0.25)'; ctx.beginPath(); ctx.moveTo(px - 3, py + 6); ctx.lineTo(px - 12, py + 26); ctx.moveTo(px + 3, py + 6); ctx.lineTo(px + 12, py + 26); ctx.stroke(); }
          ctx.restore();
          floorNum(ctx, px, py - 3.5, String(comb(row, k)), '#ffe8a0');
        }
      }
      G.text('linha 0', x + 4 * TS, y + 1 * TS + 4, '#6a78a8', { shadow: false }); G.text('linha 4 →', x + 4 * TS, y + 9 * TS + 4, '#ffd84a', { shadow: false });
    }), r.idx);
    const vals = G.shuffle([1, 1, 4, 4, 6, 3, 5, 2]), spots = [3, 5, 7, 9, 15, 17, 19, 21];
    // pedras nas linhas 8–10 e colunas 2–21: sempre sobra chão (linhas 7 e 11, colunas 1 e 22) para o herói empurrar de qualquer lado
    const bounds = { x: r.px + 2 * TS, y: r.py + 8 * TS, w: 20 * TS, h: 3 * TS };
    const blocks = [];
    const check = () => {
      if (done) return;
      const on = plates.map(p => p.blockOn());
      if (on.some(b => !b)) return;
      const v = on.map(b => b.value);
      if (v.join(' ') === '1 4 6 4 1') {
        done = true; for (const b of blocks) b.o.locked = true;
        G.ui.toast('1 4 6 4 1: os jeitos de tirar 0, 1, 2, 3 e 4 caras em 4 moedas (16 no total)!', '#7aff8a'); G.recordQuiz('binomial', true); c.solve();
      } else { G.ui.toast('Linha 4 = ' + v.join(' ') + '? Cada número é a SOMA dos dois de cima!', '#ff8a7a'); G.sfx('wrong'); c.erro(); }
    };
    if (done) [1, 4, 6, 4, 1].forEach((v, i) => c.add(new G.PushBlock(...L(8 + i * 2, 9), v, { locked: true }), r.idx));
    else spots.forEach((lx, i) => { const b = add(new G.PushBlock(...L(lx, 10), vals[i], { onMoved: check }), r.idx); b.bounds = bounds; blocks.push(b); });
    if (!done) add(new G.AnswerCrystal(...L(20, 3), '↺', false, () => { if (done) return; for (const b of blocks) b.reset(); G.sfx('teleport'); }, { color: '#c8c8ff' }), r.idx);
    return {
      dicas: ['A linha 3 é 1 3 3 1. Some cada par vizinho para achar a linha de baixo.', 'A linha 4 é 1, 1+3, 3+3, 3+1, 1 = 1 4 6 4 1.'],
      prompt: '^yTRIÂNGULO DE PASCAL^0: complete a ^ylinha 4^0 empurrando as pedras numeradas para as placas. Cada número é a ^gsoma dos dois de cima^0. Se travar, golpeie o cristal ↺.',
      rewardPos: [3, 4]
    };
  };

  const rail = G.puzRail;
  // BOXPLOT DE PEDRA (quartis)
  PUZ.boxrail = (c) => {
    const { r, add } = c; let done = c.solved;
    let data; do { const s = new Set(); while (s.size < 7) s.add(G.ri(2, 20)); data = G.shuffle([...s]); } while (false);
    const s = st.sorted(data), target = [s[1], s[3], s[5]];
    const x0 = 1;
    const blocks = rail(c, ['Q1', 'Md', 'Q3'], done ? target : [2, 10, 19], x0, () => {
      if (done || blocks.some(b => b.moving)) return;
      const v = blocks.map(b => valOfRail(b, r, x0));
      if (v.every((x, i) => x === target[i])) { done = true; for (const b of blocks) b.o.locked = true; G.ui.toast('Q1 = ' + target[0] + ', mediana = ' + target[1] + ', Q3 = ' + target[2] + '  ✓', '#7aff8a'); G.recordQuiz('quartis', true); c.solve(); }
    }, (ctx, x, y, v) => {
      const px = val => x + (val - 1) * TS + 8, by = y - 30;
      if (v[0] < v[2]) { ctx.save(); ctx.fillStyle = 'rgba(90,168,255,0.35)'; ctx.fillRect(px(v[0]), by - 6, px(v[2]) - px(v[0]), 12); ctx.strokeStyle = '#9ac8ff'; ctx.lineWidth = 0.8; ctx.strokeRect(px(v[0]), by - 6, px(v[2]) - px(v[0]), 12); ctx.fillStyle = '#ffd84a'; ctx.fillRect(px(v[1]) - 0.75, by - 6, 1.5, 12); ctx.restore(); }
    });
    add(new G.Board(r.px + 6 * TS, r.py + 2 * TS, 12 * TS, 30, (ctx, x, y) => {
      ctx.save(); ctx.fillStyle = 'rgba(10,14,34,0.85)'; G.rrPath(ctx, x, y, 12 * TS, 28, 3); ctx.fill(); ctx.strokeStyle = '#7ae4ff'; ctx.lineWidth = 0.5; G.rrPath(ctx, x + 0.25, y + 0.25, 12 * TS - 0.5, 27.5, 3); ctx.stroke(); ctx.restore();
      G.text('MEDIDAS DAS ESTRELAS (anos-luz)', x + 6 * TS, y + 3, '#7ae4ff', { align: 'center', shadow: false });
      G.text(data.join('   '), x + 6 * TS, y + 15, '#ffffff', { align: 'center', shadow: false });
    }), r.idx);
    return { dicas: ['Ordene as 7 medidas. A mediana é a 4ª.', 'Em ordem: ' + s.join(', ') + '. Q1 é a 2ª, a mediana a 4ª e Q3 a 6ª.'], prompt: '^yBOXPLOT DE PEDRA^0: o quadro mostra 7 medidas. Empurre os marcos ^yQ1^0, ^yMd^0 (mediana) e ^yQ3^0 para os valores certos da régua. (Ordene os dados; Q1 e Q3 são as medianas das metades.)', rewardPos: [11, 6], dbg: { target, blocks } };
  };
  // RÉGUA DA CONFIANÇA (intervalo de confiança)
  PUZ.cirail = (c) => {
    const { r, add } = c; let done = c.solved;
    let sample, m, e;
    for (;;) { m = G.ri(8, 13); e = G.pick([2, 3, 4]); sample = [m + G.ri(-3, 3), m + G.ri(-3, 3), m + G.ri(-3, 3)]; const last = 4 * m - st.sum(sample); if (last >= 2 && last <= 20) { sample.push(last); break; } }
    const target = [m - e, m + e], truth = m + G.ri(-e + 1, e - 1), x0 = 1;
    // depois de resolver: 20 amostras novas de 4 valores, cada uma com seu intervalo média ± margem.
    // σ vem da própria margem (e = 1,96·σ/√4), então cada intervalo acerta μ com 95% de chance
    const sims = [], NS = 20, sdMedia = e / 1.96;
    let simT = 0;
    const simular = () => { sims.length = 0; for (let i = 0; i < NS; i++) { const u = Math.max(1e-6, Math.random()), w = Math.random(); sims.push(truth + Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * w) * sdMedia); } };
    const pegaram = () => sims.filter(mm => Math.abs(mm - truth) <= e).length;
    if (done) { simular(); simT = 99; }
    const blocks = rail(c, ['INF', 'SUP'], done ? target : [3, 18], x0, () => {
      if (done || blocks.some(b => b.moving)) return;
      const v = blocks.map(b => valOfRail(b, r, x0));
      if (v[0] === target[0] && v[1] === target[1]) {
        done = true; for (const b of blocks) b.o.locked = true; G.ui.toast('Intervalo ' + target[0] + ' a ' + target[1] + ' ✓  O valor verdadeiro era ' + truth + ': capturado!', '#7aff8a'); G.recordQuiz('confianca', true); c.solve();
        simular(); simT = 0;
        G.runScript(async () => { await G.wait(NS * 0.12 + 1); G.ui.toast('Mais 20 amostras: ' + pegaram() + ' de 20 intervalos pegaram μ. É isso que "95% de confiança" quer dizer: o MÉTODO acerta cerca de 95% das vezes.', '#9ad8ff'); });
      }
    }, (ctx, x, y, v) => {
      const px = val => x + (val - 1) * TS + 8, by = y - 30;
      const vis = Math.min(NS, Math.floor(simT / 0.12));
      for (let i = 0; i < vis; i++) {
        const mm = sims[i], ok = Math.abs(mm - truth) <= e, yy = y - 84 + i * 2;
        ctx.fillStyle = ok ? 'rgba(122,228,255,0.85)' : '#ff6a5a'; ctx.fillRect(px(mm - e), yy, px(mm + e) - px(mm - e), 1);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(px(mm) - 0.25, yy - 0.5, 0.5, 2);
      }
      if (vis) { ctx.fillStyle = 'rgba(255,216,74,0.7)'; ctx.fillRect(px(truth) - 0.25, y - 86, 0.5, vis * 2 + 3); }
      if (v[0] < v[1]) { ctx.save(); const g = ctx.createLinearGradient(px(v[0]), 0, px(v[1]), 0); g.addColorStop(0, 'rgba(122,228,255,0.15)'); g.addColorStop(0.5, 'rgba(122,228,255,0.45)'); g.addColorStop(1, 'rgba(122,228,255,0.15)'); ctx.fillStyle = g; ctx.fillRect(px(v[0]), by - 4, px(v[1]) - px(v[0]), 8); ctx.restore(); }
      if (done) { ctx.fillStyle = '#ffd84a'; ctx.fillRect(px(truth) - 0.5, by - 10, 1, 20); G.text('μ', px(truth), by - 19, '#ffd84a', { align: 'center', shadow: false }); }
    });
    add(new G.Board(r.px + 5 * TS, r.py + 2 * TS, 14 * TS, 40, (ctx, x, y) => {
      ctx.save(); ctx.fillStyle = 'rgba(10,14,34,0.85)'; G.rrPath(ctx, x, y, 14 * TS, 38, 3); ctx.fill(); ctx.strokeStyle = '#7ae4ff'; ctx.lineWidth = 0.5; G.rrPath(ctx, x + 0.25, y + 0.25, 14 * TS - 0.5, 37.5, 3); ctx.stroke(); ctx.restore();
      G.text('AMOSTRA: ' + sample.join(', '), x + 7 * TS, y + 3, '#ffffff', { align: 'center', shadow: false });
      G.text('margem de erro (95%): ±' + e, x + 7 * TS, y + 14, '#ffe27a', { align: 'center', shadow: false });
      if (done && simT >= NS * 0.12) G.text('20 amostras novas: ' + pegaram() + ' de 20 intervalos pegaram μ', x + 7 * TS, y + 25, '#7aff8a', { align: 'center', shadow: false });
      else G.text('intervalo = média da amostra ± margem', x + 7 * TS, y + 25, '#9ac8ff', { align: 'center', shadow: false });
    }), r.idx);
    return {
      prompt: '^yRÉGUA DA CONFIANÇA^0: calcule a média da amostra do quadro e monte o ^gintervalo de confiança^0: empurre ^yINF^0 para média - margem e ^ySUP^0 para média + margem.',
      dicas: ['Some os 4 valores da amostra e divida por 4: essa é a média da amostra.', 'A média da amostra é ' + m + '. Os marcos vão em ' + m + ' − ' + e + ' = ' + (m - e) + ' e ' + m + ' + ' + e + ' = ' + (m + e) + '.'],
      update(dt) { if (sims.length && simT < 99) simT += dt; },
      rewardPos: [11, 6], dbg: { target, blocks, sims }
    };
  };
  // TRIBUNAL DA HIPÓTESE (valor-p)
  const CLAIMS = ['a moeda é honesta', 'o dado não é viciado', 'o remédio não faz efeito', 'o treino não melhora a mira', 'a ração não muda o peso das galinhas', 'a poção não acelera a cura', 'a chuva não depende da lua', 'o amuleto não traz sorte'];
  class Reu extends G.Ent {
    constructor(x, y, i, claim, pv, puz) { super(x + 2, y + 8, 12, 8); this.solid = true; this.i = i; this.claim = claim; this.pv = pv; this.puz = puz; this.cd = 0; }
    get darkGlow() { return 24; }
    interBox() { return { x: this.x - 3, y: this.y - 14, w: this.w + 6, h: this.h + 18 }; }
    interact() { G.runScript(() => G.ui.say('Réu nº ' + (this.i + 1), 'H₀: "' + this.claim + '". O experimento deu ^yvalor-p = ' + F(this.pv, 3) + '^0.')); }
    onHit() { if (this.cd > 0) return false; this.cd = 0.5; this.puz.judge(this); return false; }
    update(dt) { this.t += dt; if (this.cd > 0) this.cd -= dt; }
    draw(ctx, cam) {
      const x = this.x - 2 - cam.x, y = this.y - 12 - cam.y;
      G.shadow(ctx, x + 8, this.y + this.h - cam.y, 14, 0.3);
      if (this.guilty) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, x + 8, y + 8, 18, '#ff6a7a', 0.5); ctx.restore(); }
      G.draw(ctx, 'numStatue', x, y, this.guilty ? { tint: 'rgba(255,70,90,0.45)' } : undefined);
    }
    drawLate(ctx, cam) { const x = this.x + 6 - cam.x, y = this.y - 26 - cam.y; tag(ctx, x, y, 'p=' + F(this.pv, 3), this.guilty ? '#ff8a9a' : '#ffe27a'); if (this.guilty) G.text('REJEITADA', x, y - 10, '#ff8a9a', { align: 'center', outline: '#2a0a10' }); }
  }
  PUZ.tribunal = (c) => {
    const { r, L, add } = c; let done = c.solved;
    const nRej = G.ri(2, 3), rej = G.shuffle([0.001, 0.01, 0.02, 0.04]).slice(0, nRej), keep = G.shuffle([0.07, 0.12, 0.3, 0.45, 0.8]).slice(0, 5 - nRej);
    const pvs = G.shuffle(rej.concat(keep)), claims = G.shuffle(CLAIMS.slice());
    const puz = {};
    const reus = pvs.map((pv, i) => add(new Reu(...L(4 + i * 4, 5), i, claims[i], pv, puz), r.idx));
    if (done) for (const u of reus) if (u.pv < 0.05) u.guilty = true;
    puz.judge = (u) => {
      if (done || u.guilty) return;
      if (u.pv < 0.05) {
        u.guilty = true; G.sfx('correct'); G.fx.burst(u.cx, u.y - 10, ['#ff8a9a', '#ffffff'], 12, 70); G.recordQuiz('hipotese', true);
        G.ui.toast('p = ' + F(u.pv, 3) + ' < 0,05: H₀ rejeitada!', '#7aff8a');
        if (reus.every(x => x.guilty || x.pv >= 0.05)) { done = true; G.ui.toast('Veredito justo! Só as hipóteses com p < 0,05 foram rejeitadas.', '#7aff8a'); c.solve(); }
      } else {
        G.sfx('shock'); G.hurtPlayer(2, u.cx, u.cy, { force: true }); G.recordQuiz('hipotese', false);
        G.ui.toast('p = ' + F(u.pv, 3) + ' ≥ 0,05: não há evidência para rejeitar H₀!', '#ff8a7a');
      }
    };
    return { dicas: ['Fale com cada estátua para ver o valor-p dela. Só condene se p for MENOR que 0,05.', 'p = 0,07 parece pequeno, mas é maior que 0,05: não há evidência suficiente para rejeitar H₀.'], prompt: '^yTRIBUNAL DA HIPÓTESE^0: cada estátua defende uma hipótese nula H₀ (fale com ela para ouvir). ^rCondene^0 com a espada só as que devem ser REJEITADAS: ^yvalor-p menor que 0,05^0.', rewardPos: [11, 9] };
  };
  // ABISMO DAS ARGOLAS (gancho)
  PUZ.chasm = (c) => {
    const { r, L, add, setL } = c;
    for (let ly = 1; ly <= 11; ly++) for (let lx = 1; lx <= 22; lx++) {
      const floor = ly >= 10 || ly <= 2 || (ly === 6 && lx >= 8 && lx <= 15) || (lx >= 20 && ly >= 1 && ly <= 6);
      setL(lx, ly, floor ? T.FLOOR : T.PIT);
    }
    for (const [lx, ly] of [[11, 10], [11, 6], [15, 6], [11, 2], [21, 6]]) add(new HookRing(...L(lx, ly), r.idx), r.idx);
    add(new G.Sign(...L(5, 10), 'Argolas da Média (μ): quem tem o ^yGancho da Regressão^0 é puxado até elas, por cima do abismo.', { name: 'Placa' }), r.idx);
    return {};
  };
  // MINI-CHEFE
  PUZ.miniboss = (c) => {
    const { r, L } = c; let mb = null, done = c.solved;
    const TYPES = { reidado: 'reidado', histograma: 'histocolosso', boxplot: 'boxsentinela' };
    return {
      noAutoEnemies: true, rewardPos: [11, 6],
      enter() {
        if (done || (mb && !mb.dead)) return;
        const [x, y] = L(11, 4);
        mb = G.makeEnemy(TYPES[r.boss] || 'reidado', x, y, { room: r.idx }); c.addLive(mb);
        G.boss = mb; c.lock();
        G.runScript(async () => { G.music(null); G.sfx('roar'); G.ui.regionBanner(mb.name, 'MINI-CHEFE'); await G.wait(1.0); G.music('miniboss'); });
      },
      update() {
        if (done || !mb || !mb.dead) return;
        done = true; G.boss = null;
        G.setFlag(c.did + '_solved_' + r.key); G.addXP(20);
        G.fx.text(r.px + 12 * TS, r.py + 5 * TS, 'MINI-CHEFE DERROTADO!', '#7aff8a', true);
        for (const e of G.ents) if (e.room === r.idx && e instanceof G.Chest && e.hidden) e.reveal();
        c.unlock(); G.restoreMusic();
      }
    };
  };

  // ------------------------------------------------------------------
  //  A 7ª masmorra
  // ------------------------------------------------------------------
  G.DUNGEONS.d7 = { name: 'Observatório da Inferência', theme: 'd7', music: 'observatory', topic: 'd7', crystal: 'inferencia', grid: [3, 4],
    rooms: {
      S: { at: [1, 3], type: 'start', lesson: 'binomial' },
      C: { at: [2, 3], type: 'combat', enemies: [['ruido', 2, { tier: 1.8 }], ['moeda', 2, { tier: 1.8 }], ['outlier', 1, { tier: 1.8 }]], feat: 'pillars', clearReward: { type: 'key' } },
      Bn: { at: [0, 3], type: 'bonus', qb: ['coins', 'potion', 'coins', 'bombs'], oracle: true, feat: 'pots' },
      H: { at: [1, 2], type: 'cltmachine', lesson: 'tcl', lessonAt: [2, 3] },
      Pa: { at: [0, 2], type: 'pascal', reward: { chest: { type: 'key' } } },
      Bx: { at: [2, 2], type: 'boxrail', lesson: 'quartis', lessonAt: [2, 2], reward: { chest: { type: 'heartPiece' } } },
      I: { at: [0, 1], type: 'item', item: 'hook' },
      P: { at: [1, 1], type: 'chasm', enemies: [['morcego', 1, { tier: 1.5 }]] },
      Ci: { at: [2, 1], type: 'cirail', lesson: 'confianca', lessonAt: [2, 2] },
      T: { at: [0, 0], type: 'tribunal', lesson: 'hipotese', lessonAt: [2, 9], reward: { chest: { type: 'heartPiece' } } },
      K: { at: [2, 0], type: 'miniboss', boss: 'boxplot', reward: { chest: { type: 'bossKey' } } },
      B: { at: [1, 0], type: 'boss' }
    },
    doors: [['S', 'H', 'open'], ['S', 'C', 'open'], ['S', 'Bn', 'locked'], ['H', 'Pa', 'open'], ['H', 'Bx', 'open'], ['H', 'P', 'puzzle'], ['Pa', 'I', 'locked'], ['I', 'T', 'open'], ['P', 'B', 'boss'], ['P', 'Ci', 'open'], ['Ci', 'K', 'puzzle']] };
  // mini-chefes nas masmorras antigas (no lugar das salas da chave do guardião)
  {
    const K4 = G.DUNGEONS.d4.rooms.K; delete K4.enemies; Object.assign(K4, { type: 'miniboss', boss: 'reidado', reward: { chest: { type: 'bossKey' } } });
    const K5 = G.DUNGEONS.d5.rooms.K; delete K5.enemies; Object.assign(K5, { type: 'miniboss', boss: 'histograma', reward: { chest: { type: 'bossKey' } } });
  }
  const mkBoss0 = G.makeBoss;
  G.makeBoss = (id, x, y, arena) => (id === 'd7' ? new HipoteseNula(x, y, arena) : mkBoss0(id, x, y, arena));
  G.dungeonGate = (did) => {
    if (did !== 'd7' || P().flags.obsOpen) return false;
    G.runScript(async () => {
      await G.ui.say(null, 'O portão do observatório está selado. No centro há um encaixe vazio para ^ycinco lentes^0.');
      if (!G.quest.st('lentes')) await G.ui.say(null, 'Talvez a ^yProfessora Gertrude^0, aqui ao lado, saiba como abri-lo.');
      G.player.y += 8;
    });
    return true;
  };
  const after0 = G.afterCrystal;
  G.afterCrystal = async (cd) => {
    if (G.map.id === 'd7') {
      await G.ui.say('Professora Gertrude (em pensamento)', 'Você rejeitou a ^yHipótese Nula^0! O telescópio voltou a funcionar: agora o reino consegue tirar ^gconclusões^0 a partir dos dados.', { portrait: 'gertrude_down0' });
      await G.ui.say('Professora Gertrude (em pensamento)', 'E esse cristal... um sétimo Cristal da Razão! Com ele, Viés não conseguirá esconder a verdade de você.', { portrait: 'gertrude_down0' });
    }
    return after0(cd);
  };

  // ------------------------------------------------------------------
  //  No mundo: observatório, Gertrude e as ilhotas do gancho
  // ------------------------------------------------------------------
  G.SPAWN = G.SPAWN || {};
  G.SPAWN.hookRing = o => new HookRing(o.x, o.y, -1);
  G.worldExtras = G.worldExtras || [];
  G.worldExtras.push(h => {
    const { struct, obj, objects, nodes, regionOf, setT, protect, wall, block, prot, idx } = h;
    struct('planicie', 'observatory', 37, 2, { door: 'd7' });
    obj('planicie', 35, 8, { type: 'npc', spr: 'gertrude', name: 'Professora Gertrude', script: 'gertrude' });
    obj('planicie', 43, 8, { type: 'sign', text: '^cOBSERVATÓRIO DA INFERÊNCIA^0\n"Das amostras às conclusões."' });
    const moat = (reg, lx, ly, flag) => {
      const R = regionOf(reg), cx = R.ox + lx, cy = R.oy + ly;
      for (let y = cy - 4; y <= cy + 4; y++) for (let x = cx - 4; x <= cx + 4; x++) { const i = idx(x, y); wall[i] = 0; prot[i] = 1; block[i] = 1; setT(x, y, Math.max(Math.abs(x - cx), Math.abs(y - cy)) <= 1 ? T.GROUND : T.WATER); }
      for (let y = cy + 5; y <= cy + 6; y++) for (let x = cx - 2; x <= cx + 2; x++) { const i = idx(x, y); wall[i] = 0; block[i] = 0; setT(x, y, T.GROUND); }
      protect(cx - 2, cy + 5, cx + 2, cy + 7); nodes[reg].push([cx, cy + 7]);
      objects.push({ type: 'chest', x: cx * TS, y: (cy - 1) * TS, flag, contents: { type: 'heartPiece' } });
      objects.push({ type: 'hookRing', x: cx * TS, y: (cy + 1) * TS });
      objects.push({ type: 'hookRing', x: cx * TS, y: (cy + 5) * TS });
      objects.push({ type: 'sign', x: (cx + 2) * TS, y: (cy + 5) * TS, text: 'Uma ^yargola com μ^0 brilha na ilhota. Se algo pudesse te puxar até lá...' });
    };
    moat('lago', 41, 20, 'ow_lago_hook');
    moat('montanha', 41, 5, 'ow_mont_hook');
    moat('deserto', 14, 14, 'ow_des_hook');
  });

  // dica do Mestre Gauss depois dos cristais
  const hint0 = G.nextHint;
  G.nextHint = function () {
    const p = P();
    if (p.flags.obsOpen && !p.flags.boss_d7 && p.crystals.length >= 3) return hint0() + ' E não se esqueça: o ^cObservatório da Inferência^0, nos Campos de Pascal, está aberto!';
    return hint0();
  };
})(window.G);
