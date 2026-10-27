'use strict';
// =====================================================================
//  Investida de Confiança: com o Escudo de Confiança no braço, segurar o
//  X depois do empurrão ergue a guarda. O escudo projeta a Égide, um sino
//  de luz que se enche de ±1σ (68%) até ±2σ (95%) e rebate de volta os
//  tiros que chegam de frente. Soltar com o sino cheio lança o herói numa
//  arrancada que atropela tudo no caminho, sem tomar dano.
// =====================================================================
(function (G) {
  const A = G.audio;
  const CARGA = 0.8, DURA = 0.36, VEL = 250;
  const usando = () => !!(G.P && G.P.escudo && G.P.usaEscudo);

  G.SFX.guarda = () => { A.tone({ f: 220, f2: 330, d: 0.5, type: 'triangle', v: 0.05 }); A.noise({ d: 0.4, v: 0.03, ft: 'bandpass', f: 900, f2: 1800 }); };
  G.SFX.egide = () => { A.tone({ f: 880, d: 0.25, type: 'sine', v: 0.07 }); A.tone({ f: 1320, d: 0.35, type: 'sine', v: 0.05, delay: 0.06 }); A.tone({ f: 1760, d: 0.45, type: 'sine', v: 0.04, delay: 0.12 }); };
  G.SFX.rebate = () => { A.tone({ f: 1400, f2: 2200, d: 0.12, type: 'square', v: 0.04 }); A.tone({ f: 2600, d: 0.2, type: 'sine', v: 0.05, delay: 0.03 }); };
  G.SFX.investida = () => { A.noise({ d: 0.45, v: 0.12, ft: 'bandpass', f: 300, f2: 1800 }); A.tone({ f: 110, f2: 220, d: 0.3, type: 'sawtooth', v: 0.06 }); A.tone({ f: 660, f2: 990, d: 0.3, type: 'triangle', v: 0.05, delay: 0.05 }); };
  G.SFX.baque = () => { A.tone({ f: 120, f2: 50, d: 0.25, type: 'sine', v: 0.2 }); A.noise({ d: 0.15, v: 0.1, ft: 'lowpass', f: 800 }); };

  // Égide: sino de luz à frente do escudo, com a base no escudo e a crista para fora; k = carga (0 a 1)
  function egide(ctx, x, y, dir, W, H, k, a, t) {
    const f = G.DIRS[dir], sg = W / 3, m = k * 2 * sg, curva = u => H * Math.exp(-(u * u) / (2 * sg * sg));
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(-f.x, f.y));
    ctx.globalCompositeOperation = 'lighter';
    ctx.beginPath(); ctx.moveTo(-W, 0); for (let u = -W; u <= W; u++) ctx.lineTo(u, curva(u)); ctx.lineTo(W, 0);
    ctx.strokeStyle = 'rgba(160,220,255,' + 0.4 * a + ')'; ctx.lineWidth = 0.8; ctx.stroke();
    if (m > 0.5) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, 'rgba(122,228,255,' + 0.5 * a + ')'); g.addColorStop(1, 'rgba(230,250,255,' + 0.85 * a + ')');
      ctx.beginPath(); ctx.moveTo(-m, 0); for (let u = -m; u < m; u++) ctx.lineTo(u, curva(u)); ctx.lineTo(m, curva(m)); ctx.lineTo(m, 0); ctx.closePath();
      ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,' + 0.7 * a + ')'; ctx.lineWidth = 0.6;
      for (const s of [-2, -1, 1, 2]) { const u = s * sg; if (Math.abs(u) <= m + 0.1) { ctx.beginPath(); ctx.moveTo(u, 0); ctx.lineTo(u, curva(u)); ctx.stroke(); } }
      const cu = Math.sin(t * 5) * m; // um brilho corre pela crista
      G.glow(ctx, cu, curva(cu), 4, '#ffffff', 0.55 * a);
    }
    ctx.restore();
  }

  // ------------------------------------------------------------------
  //  Tiros rebatidos: voltam pelo caminho de onde vieram e ferem inimigos
  // ------------------------------------------------------------------
  const ES = G.EShot.prototype, tiro0 = ES.update, desenhoTiro0 = ES.draw;
  ES.update = function (dt) {
    if (!this.refletido) return tiro0.call(this, dt);
    this.t += dt; this.life -= dt;
    if (this.life <= 0) { this.dead = true; return; }
    this.x += this.vx * dt; this.y += this.vy * dt;
    const tp = G.TP[G.map.tileAtPx(this.cx, this.cy)];
    if (tp.solid && !tp.low) { this.dead = true; G.fx.burst(this.cx, this.cy, ['#bff4ff', '#ffffff'], 5, 40); return; }
    if (Math.random() < 0.6) G.fx.glow(this.cx, this.cy, { size: 1.5, color: '#bff4ff', life: 0.25 });
    for (const e of G.ents) {
      if (e.dead || !e.isEnemy || !e.onHit || !G.sameRoom(e) || !G.overlap(this, e.hurtbox ? e.hurtbox() : e)) continue;
      const { d, crit } = G.rollDamage(1.5);
      e.onHit(d, this.cx - this.vx, this.cy - this.vy, 'beam', crit);
      this.dead = true; G.fx.spark(this.cx, this.cy, '#ffffff', 8); G.fx.ring(this.cx, this.cy, 10, '#bff4ff', 0.2, 1.5);
      return;
    }
  };
  ES.draw = function (ctx, cam) {
    desenhoTiro0.call(this, ctx, cam);
    if (!this.refletido) return;
    G.light.add(this.cx - cam.x, this.cy - cam.y, 22, '#7ae4ff', 0.7, 0.4);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, this.cx - cam.x, this.cy - cam.y, 7, '#7ae4ff', 0.7); ctx.restore();
  };

  // ------------------------------------------------------------------
  //  Herói
  // ------------------------------------------------------------------
  const PL = G.Player.prototype, upd0 = PL.update, draw0 = PL.draw, ataque0 = PL.startAttack;
  const vel0 = Object.getOwnPropertyDescriptor(PL, 'speed').get;
  Object.defineProperty(PL, 'speed', { configurable: true, get() { return vel0.call(this) * (this.guarda ? 0.5 : 1); } });
  const P = () => G.P;

  PL.startAttack = function () {
    ataque0.call(this);
    if (usando() && !P().flags.dicaGuarda) { P().flags.dicaGuarda = true; G.ui.toast('Dica: SEGURE o X com o escudo para erguer a Égide.', '#7ae4ff'); }
  };
  PL.update = function (dt) {
    const st0 = this.state, d0 = this.dir;
    upd0.call(this, dt);
    if (this.state === 'investida') { this.investir(dt); return; }
    if (!usando()) { this.guarda = false; this.guardaT = 0; return; }
    if (!this.guarda && st0 === 'attack' && this.state === 'normal' && G.input.down('a') && !this.carry) {
      this.guarda = true; this.guardaT = 0; G.sfx('guarda');
      if (!P().flags.dicaInvestida) { P().flags.dicaInvestida = true; G.ui.toast('ÉGIDE! Segure até o sino encher e solte para a INVESTIDA. Tiros de frente voltam para quem atirou!', '#7ae4ff'); }
    }
    if (!this.guarda) return;
    if (this.state !== 'normal' || !G.input.down('a')) {
      const cheia = this.state === 'normal' && this.guardaT >= CARGA;
      this.guarda = false; this.guardaT = 0;
      if (cheia) this.comecaInvestida();
      return;
    }
    this.dir = d0; // de guarda, o herói anda de lado sem virar
    const antes = this.guardaT; this.guardaT += dt;
    const f = G.DIRS[this.dir], ex = this.cx + f.x * 10, ey = this.cy - 6 + f.y * 10;
    if (this.guardaT < CARGA && Math.random() < 0.6) G.fx.converge(ex, ey, 16, G.pick(['#7ae4ff', '#bff4ff', '#ffffff']), 1, 0.24);
    if (antes < CARGA / 2 && this.guardaT >= CARGA / 2) G.sfx('select');
    if (antes < CARGA && this.guardaT >= CARGA) { G.sfx('egide'); this.chargeFlash = 0.2; G.fx.ring(ex, ey, 14, '#bff4ff', 0.3, 2); G.fx.burst(ex, ey, ['#ffffff', '#7ae4ff'], 10, 60); }
    if (this.guardaT > 0.08) this.rebater(ex, ey, 13);
  };
  // tiros que chegam de frente perto da Égide voltam com mais força
  PL.rebater = function (ex, ey, raio) {
    const f = G.DIRS[this.dir];
    for (const e of G.ents) {
      if (!(e instanceof G.EShot) || e.dead || e.refletido || !G.sameRoom(e)) continue;
      if (Math.hypot(e.cx - ex, e.cy - e.z - ey) > raio || e.vx * f.x + e.vy * f.y >= 0) continue;
      const sp = Math.max(140, Math.hypot(e.vx, e.vy) * 1.4), a = Math.atan2(-e.vy, -e.vx);
      e.refletido = true; e.vx = Math.cos(a) * sp; e.vy = Math.sin(a) * sp; e.homing = 0; e.life = 2; e.vz = 0; e.z = 0; e.room = G.curRoom;
      G.sfx('rebate'); G.fx.spark(e.cx, e.cy, '#bff4ff', 8); G.fx.ring(e.cx, e.cy, 9, '#ffffff', 0.2, 1.5); this.escudoFlash = 0.15;
      P().stats.rebatidas = (P().stats.rebatidas || 0) + 1;
    }
  };
  PL.comecaInvestida = function () {
    const f = G.DIRS[this.dir];
    this.state = 'investida'; this.invT = 0; this.passoInv = 0; this.hitSet.clear(); this.rastro = [];
    G.sfx('investida'); G.shake(2, 0.15);
    G.fx.streaks(this.cx, this.cy - 4, Math.atan2(-f.y, -f.x), 8, 140, '#bff4ff', 0.4);
    G.fx.smoke(this.cx, this.y + this.h, 5, '#d8e8f0', 26);
    G.fx.ring(this.cx, this.cy - 6, 14, '#bff4ff', 0.25, 2);
  };
  PL.investir = function (dt) {
    const f = G.DIRS[this.dir], k = (this.invT += dt) / DURA, v = VEL * (k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3 * 0.7);
    const r = G.moveEnt(this, f.x * v * dt, f.y * v * dt, { avoidHazard: true });
    this.walkT = this.passoInv += dt * 1.6; this.moving = true;
    const view = this.dir === 0 ? 'down' : this.dir === 1 ? 'up' : 'side';
    this.rastro.push({ x: this.cx, y: this.y + this.h, nome: G.spriteHeroi() + '_' + view + (Math.floor(this.walkT * 18) % 8), flip: this.dir === 2, t: G.time });
    if (this.rastro.length > 9) this.rastro.shift();
    if (Math.random() < 0.7) G.fx.spawn({ x: this.cx + G.rf(-3, 3), y: this.y + this.h, vx: -f.x * 40, vy: -f.y * 40 - 6, kind: 'puff', size: 1.8, color: G.map.kind === 'dungeon' ? '#a8a098' : '#d8d0b0', life: 0.3, drag: 3 });
    const fx = this.cx + f.x * 12, fy = this.cy - 6 + f.y * 12;
    this.swordHits({ x: fx - 11, y: fy - 11, w: 22, h: 22 }, 2.5, 'spin');
    this.rebater(fx, fy, 16);
    const bateu = (f.x && r.hitX) || (f.y && r.hitY);
    if (bateu) {
      G.sfx('baque'); G.shake(3, 0.2); G.fx.spark(fx, fy, '#ffffff', 10); G.fx.burst(fx, fy, ['#bff4ff', '#ffffff'], 10, 60);
      this.kbx = -f.x * 90; this.kby = -f.y * 90; this.kbT = 0.08;
    }
    if (bateu || this.invT >= DURA) {
      this.state = 'normal'; this.moving = false;
      G.fx.ring(fx, fy, 20, '#bff4ff', 0.3, 2); G.fx.burst(fx, fy, ['#ffffff', '#7ae4ff'], 8, 50);
    }
  };
  // durante a arrancada, nada fere o herói
  const hurt0 = G.hurtPlayer;
  G.hurtPlayer = (dmg, sx, sy, o = {}) => {
    const p = G.player;
    if (p && p.state === 'investida' && !o.force) return false;
    return hurt0(dmg, sx, sy, o);
  };

  PL.draw = function (ctx, cam) {
    const base = G.spriteHeroi(), ref = G.spr[base + '_down0'], lw = G.lw(ref), lh = G.lh(ref);
    // rastro da arrancada: silhuetas azuis que se apagam
    for (const r of this.rastro || []) {
      const a = 1 - (G.time - r.t) / 0.24; if (a <= 0) continue;
      G.draw(ctx, r.nome, r.x - lw / 2 - cam.x, r.y + 1 - lh - cam.y, { flip: r.flip, alpha: a * 0.5, tint: 'rgba(122,228,255,0.75)' });
    }
    const inv = this.state === 'investida', guarda = this.guarda && this.guardaT > 0.05;
    if (!inv && !guarda) return draw0.call(this, ctx, cam);
    const f = G.DIRS[this.dir], ex = this.cx + f.x * 8 - cam.x, ey = this.cy - 6 + f.y * 8 - cam.y;
    const k = inv ? 1 : Math.min(1, this.guardaT / CARGA), cheia = inv || this.guardaT >= CARGA;
    const W = inv ? 15 : 11, H = inv ? 13 : 7 + 3 * k + (cheia ? Math.sin(G.time * 12) * 0.6 : 0);
    G.light.add(ex, ey, 24 + 18 * k, '#7ae4ff', 0.5 + 0.4 * k, 0.4);
    const sino = () => egide(ctx, ex, ey, this.dir, W, H, k, inv ? 1 : 0.55 + 0.45 * k, G.time);
    if (this.dir === 1) sino(); // de costas para a câmera, a Égide fica atrás do herói
    if (inv) { const m = this.moving; this.state = 'normal'; this.moving = true; try { draw0.call(this, ctx, cam); } finally { this.state = 'investida'; this.moving = m; } }
    else draw0.call(this, ctx, cam);
    if (this.dir !== 1) sino();
  };
})(window.G);
