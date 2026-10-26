'use strict';
// =====================================================================
//  Escudo de Confiança: prêmio da sala final do Núcleo do Amanhã. Usado
//  no lugar da espada (Enter → STATUS, linha da arma), bloqueia tudo o
//  que vem de frente e dos lados; só as costas ficam expostas, como as
//  caudas que um intervalo de confiança deixa de fora. O X dá um
//  empurrão com o escudo (meio golpe, que também corta arbustos);
//  segurar o X ergue a Égide e solta a Investida (investida.js).
// =====================================================================
(function (G) {
  const TS = 16;
  const P = () => G.P;
  const usando = () => !!(G.P && G.P.escudo && G.P.usaEscudo);

  // ------------------------------------------------------------------
  //  Desenho: escudo azul de borda dourada com um sino; o miolo do sino
  //  (95%) é claro e as caudas ficam de fora
  // ------------------------------------------------------------------
  function forma(ctx, s) {
    ctx.beginPath(); ctx.moveTo(-6 * s, -7 * s); ctx.lineTo(6 * s, -7 * s); ctx.lineTo(6 * s, -1 * s);
    ctx.quadraticCurveTo(6 * s, 5 * s, 0, 8 * s); ctx.quadraticCurveTo(-6 * s, 5 * s, -6 * s, -1 * s); ctx.closePath();
  }
  function desenhaEscudo(ctx, s, brilho = 0) {
    forma(ctx, s * 1.14); ctx.fillStyle = '#4a2a06'; ctx.fill();
    forma(ctx, s); ctx.fillStyle = '#e8b83a'; ctx.fill();
    forma(ctx, s * 0.8);
    const g = ctx.createLinearGradient(-6 * s, 0, 6 * s, 0); g.addColorStop(0, '#4a9aff'); g.addColorStop(1, '#1a3a8a');
    ctx.fillStyle = g; ctx.fill();
    const base = 2.6 * s, alt = 6.4 * s, px = i => i * 0.42 * s, py = i => { const u = i / 4; return base - alt * Math.exp(-u * u / 2); };
    ctx.beginPath(); ctx.moveTo(px(-8), base); for (let i = -8; i <= 8; i++) ctx.lineTo(px(i), py(i)); ctx.lineTo(px(8), base); ctx.closePath();
    ctx.fillStyle = 'rgba(200,236,255,0.75)'; ctx.fill();
    ctx.beginPath(); for (let i = -10; i <= 10; i++) { if (i === -10) ctx.moveTo(px(i), py(i)); else ctx.lineTo(px(i), py(i)); }
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(0.6, 0.5 * s); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(-4.4 * s, base, 8.8 * s, Math.max(0.5, 0.35 * s));
    if (brilho > 0) { forma(ctx, s * 1.14); ctx.fillStyle = 'rgba(255,255,255,' + brilho + ')'; ctx.fill(); }
  }
  // costas do escudo (quando o herói está de costas para a câmera)
  function desenhaCostas(ctx, s) {
    forma(ctx, s * 1.14); ctx.fillStyle = '#2a1608'; ctx.fill();
    forma(ctx, s); ctx.fillStyle = '#7a4a22'; ctx.fill();
    ctx.fillStyle = '#5a3414'; ctx.fillRect(-0.6 * s, -6 * s, 1.2 * s, 12 * s);
    ctx.fillStyle = '#c8a040'; ctx.fillRect(-6 * s, -2 * s, 12 * s, 1.2 * s);
  }
  G.artHooks = G.artHooks || [];
  G.artHooks.push(() => {
    const c = G.canvas(32, 32), x = c.getContext('2d');
    x.translate(16, 15); desenhaEscudo(x, 1.8);
    c.lw = 16; c.lh = 16; G.spr.escudoIcon = c; G.spr.espIcon6 = c;
  });

  // ------------------------------------------------------------------
  //  Item e equipamento
  // ------------------------------------------------------------------
  const give0 = G.give;
  G.give = async function (kind, n, o) {
    if (kind !== 'escudo') return give0.call(this, kind, n, o);
    const p = G.player;
    if (p) { p.state = 'hold'; p.holdItem = 'escudoIcon'; }
    G.cutscene++;
    try {
      P().escudo = true; G.sfx('fanfare'); await G.wait(0.3);
      await G.ui.banner('escudoIcon', 'ESCUDO DE CONFIANÇA!', 'Use no lugar da espada: Enter → STATUS → X na linha da arma. Bloqueia tudo o que vem de frente e dos lados; só as costas ficam expostas, como as caudas de um intervalo de confiança. SEGURE ^yX^0 para erguer a Égide e solte com o sino cheio para a ^cInvestida^0!', { color: '#7ae4ff' });
    } finally { G.cutscene--; if (p && p.state === 'hold') { p.state = 'normal'; p.holdItem = null; } }
  };
  const iconeBau = G.Chest.prototype.icon;
  G.Chest.prototype.icon = function () { return this.contents && this.contents.type === 'escudo' ? 'escudoIcon' : iconeBau.call(this); };

  // a troca da arma passa pelas espadas conquistadas e, depois delas, pelo escudo
  const trocar0 = G.equip.trocar, ganhar0 = G.equip.ganhar;
  G.equip.trocar = function (tipo) {
    const p = P();
    if (tipo !== 'espada' || !p.escudo) return trocar0.call(this, tipo);
    const l = this.espadas().concat(['E']), i = p.usaEscudo ? l.length - 1 : l.indexOf(p.swordLv), prox = l[(i + 1) % l.length];
    if (prox === 'E') p.usaEscudo = true; else { p.usaEscudo = false; p.swordLv = prox; }
    return true;
  };
  G.equip.ganhar = function (tipo, lv) { if (tipo === 'espada' && P()) P().usaEscudo = false; return ganhar0.call(this, tipo, lv); };

  // ------------------------------------------------------------------
  //  Bloqueio: de frente e dos lados (270°); só as costas (90°) tomam dano
  // ------------------------------------------------------------------
  const hurt0 = G.hurtPlayer;
  G.hurtPlayer = (dmg, sx, sy, o = {}) => {
    const p = G.player;
    if (usando() && p && sx !== undefined && !o.force && !o.raw && !(p.inv > 0) && !(p.starT > 0) && ['normal', 'attack', 'pull', 'hook'].includes(p.state)) {
      const vx = sx - p.cx, vy = sy - (p.cy - 4), d = Math.hypot(vx, vy) || 1, f = G.DIRS[p.dir];
      if ((vx * f.x + vy * f.y) / d > -Math.SQRT1_2) { bloquear(p, vx / d, vy / d); return false; }
    }
    return hurt0(dmg, sx, sy, o);
  };
  function bloquear(p, ux, uy) {
    p.escudoFlash = 0.18;
    const bx = p.cx + ux * 8, by = p.cy - 6 + uy * 6;
    if (!(p.bloqT > 0)) {
      p.bloqT = 0.25; G.sfx('tink');
      G.fx.spark(bx, by, '#bfe8ff', 8); G.fx.ring(bx, by, 10, '#ffffff', 0.2, 1.5);
      G.P.stats.bloqueios = (G.P.stats.bloqueios || 0) + 1;
    }
    if (p.state === 'normal' || p.state === 'attack') { p.kbx = -ux * 80; p.kby = -uy * 80; p.kbT = 0.07; }
    // o atacante é jogado para trás; tiros se desfazem no escudo
    for (const e of G.ents) {
      if (e.dead || e === p || Math.hypot(e.cx - p.cx, e.cy - p.cy) > 30) continue;
      if (e instanceof G.EShot) { e.dead = true; G.fx.spark(e.cx, e.cy, '#ffffff', 4); continue; }
      if (e.isEnemy && !e.isBoss) { const a = Math.atan2(e.cy - p.cy, e.cx - p.cx); e.kbx = Math.cos(a) * 200; e.kby = Math.sin(a) * 200; e.kbT = 0.16; }
    }
  }

  // ------------------------------------------------------------------
  //  Herói: empurrão com o escudo, sem giro, e o escudo sempre no braço
  // ------------------------------------------------------------------
  const PL = G.Player.prototype, upd0 = PL.update, atk0 = PL.startAttack, hits0 = PL.swordHits, ds0 = PL.drawSword;
  PL.update = function (dt) {
    if (this.bloqT > 0) this.bloqT -= dt;
    if (this.escudoFlash > 0) this.escudoFlash -= dt;
    upd0.call(this, dt);
    if (usando() && this.spinCharging) { this.spinCharging = false; this.spinCharge = 0; }
  };
  PL.startAttack = function () {
    if (!usando()) return atk0.call(this);
    this.state = 'attack'; this.atkT = 0; this.hitSet.clear(); G.sfx('push');
  };
  PL.swordHits = function (rect, mul, kind) {
    if (usando() && kind === 'sword') {
      const d = G.DIRS[this.dir];
      return hits0.call(this, { x: this.cx - 8 + d.x * 11, y: this.cy - 12 + d.y * 11, w: 16, h: 16 }, 0.5, kind);
    }
    return hits0.call(this, rect, mul, kind);
  };
  PL.drawSword = function (ctx, hx, hy) {
    if (!usando()) return ds0.call(this, ctx, hx, hy);
    if (['hold', 'dead', 'fall', 'pipe'].includes(this.state)) return;
    const cam = G.cam, d = G.DIRS[this.dir];
    const empurra = this.state === 'attack' ? Math.sin(Math.min(1, this.atkT / 0.22) * Math.PI) : 0;
    const cx = this.cx - cam.x, meio = this.y + this.h - 9 - this.z - cam.y;
    ctx.save();
    if (this.dir === 0) { ctx.translate(Math.round(cx + 3), Math.round(meio + 2 + empurra * 4)); desenhaEscudo(ctx, 0.62, this.escudoFlash > 0 ? 0.7 : 0); }
    else if (this.dir === 1) { ctx.translate(Math.round(cx - 3), Math.round(meio - 2 - empurra * 4)); desenhaCostas(ctx, 0.62); }
    else { ctx.translate(Math.round(cx + d.x * (6 + empurra * 5)), Math.round(meio + 1)); ctx.scale(0.5, 1); desenhaEscudo(ctx, 0.62, this.escudoFlash > 0 ? 0.7 : 0); }
    ctx.restore();
    if (this.escudoFlash > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, cx + d.x * 7, meio + d.y * 4, 12, '#bfe8ff', this.escudoFlash * 3); ctx.restore(); }
  };

  // ------------------------------------------------------------------
  //  O prêmio: depois que o Viés 2.0 foge, um baú desce no salão do Núcleo
  // ------------------------------------------------------------------
  const sala0 = G.dun.bossRoom;
  G.dun.bossRoom = function (r) {
    sala0.call(this, r);
    if (G.map.id !== 'd9' || !G.flag('boss_d9')) return;
    const c = G.addEnt(new G.Chest(r.px + 11.5 * TS, r.py + 3 * TS, 'd9_escudo', { type: 'escudo' }, { hidden: true }));
    c.room = r.idx;
    if (c.hidden) c.reveal();
  };
})(window.G);
