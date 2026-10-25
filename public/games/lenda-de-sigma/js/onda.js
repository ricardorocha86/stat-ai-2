'use strict';
// =====================================================================
//  Onda Sigma: ao soltar o golpe giratório carregado, um círculo mágico
//  se desenha no chão e três ondas de choque partem do herói, uma por
//  desvio-padrão (σ = 20 px): os anéis de 1σ, 2σ e 3σ guardam 68%, 95%
//  e 99,7% de uma normal. A magia alcança quem a lâmina não alcançou,
//  joga os inimigos para fora, desfaz tiros e corta o mato até 2σ.
// =====================================================================
(function (G) {
  const A = G.audio;
  const K = 0.75;                        // achatamento do chão (o mesmo dos anéis de choque)
  const SIG = 20, R = [SIG, 2 * SIG, 3 * SIG];
  const SAI = [0.04, 0.13, 0.22];        // quando cada onda parte (s)
  const VIAGEM = 0.2;                    // quanto cada onda leva até o seu anel
  const DANO = [2, 1.5, 1];              // multiplicador do dano em cada faixa (a lâmina dá 2)
  const DURA = 1.05;
  const ROTULOS = ['±1σ 68%', '±2σ 95%', '±3σ 99,7%'];
  const RUNAS = ['Σ', 'μ', 'σ', '√', 'χ', '±', 'σ', '≈'];
  const sai = u => 1 - Math.pow(1 - u, 3);
  const repique = u => { const c = 1.70158; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };

  // baque grave, sopro e um sino a cada anel que a onda alcança
  G.SFX.onda = () => {
    A.tone({ f: 180, f2: 45, d: 0.6, type: 'sine', v: 0.32 });
    A.noise({ d: 0.55, v: 0.2, ft: 'bandpass', f: 3200, f2: 300 });
    SAI.forEach((s, i) => {
      A.tone({ f: [784, 988, 1175][i], d: 0.42, type: 'triangle', v: 0.07, delay: s + VIAGEM });
      A.tone({ f: [1568, 1976, 2350][i], d: 0.26, type: 'sine', v: 0.035, delay: s + VIAGEM + 0.01 });
    });
  };

  class OndaSigma extends G.Ent {
    constructor(p) {
      const x = p.cx, y = p.y + p.h - 1;
      super(x - R[2] - 8, y - R[2] * K - 8, 2 * R[2] + 16, 2 * R[2] * K + 16);
      this.ox = x; this.oy = y;
      this.pal = G.SWORD_FX[Math.min(5, G.P.swordLv)];
      this.feitos = new Set(); this.pousou = [false, false, false];
      // mato até 2σ, do mais perto ao mais longe: a onda corta conforme passa (na masmorra, só na sala atual)
      this.matos = [];
      for (let ty = Math.floor((y - R[1] * K) / 16); ty <= Math.floor((y + R[1] * K) / 16); ty++)
        for (let tx = Math.floor((x - R[1]) / 16); tx <= Math.floor((x + R[1]) / 16); tx++) {
          const d = this.dist(tx * 16 + 8, ty * 16 + 8);
          if (d > R[1] || G.map.kind === 'dungeon' && G.dun.roomAt(tx * 16 + 8, ty * 16 + 8)?.idx !== G.curRoom) continue;
          this.matos.push({ tx, ty, d });
        }
      this.matos.sort((a, b) => a.d - b.d);
      G.sfx('onda'); G.flash(this.pal.body, 0.14, 0.2); G.shake(2, 0.2);
    }
    get by() { return -1e9; } // é chão: vem antes de tudo
    dist(px, py) { return Math.hypot(px - this.ox, (py - this.oy) / K); }
    // raio da frente da onda i (parte da borda dos pés, não do centro)
    frente(i) { return this.t < SAI[i] ? -1 : 6 + (R[i] - 6) * sai(G.clamp((this.t - SAI[i]) / VIAGEM, 0, 1)); }
    update(dt) {
      this.t += dt;
      if (this.t >= DURA) { this.dead = true; return; }
      const p = G.player, f = [this.frente(0), this.frente(1), this.frente(2)], fmax = Math.max(...f);
      for (const e of G.ents) {
        if (e.dead || !G.sameRoom(e)) continue;
        if (e instanceof G.EShot) {
          if (this.dist(e.cx, e.cy) <= fmax) { e.dead = true; G.fx.spark(e.cx, e.cy, '#ffffff', 6); G.fx.burst(e.cx, e.cy, [this.pal.body, '#ffffff'], 5, 50); }
          continue;
        }
        // cada inimigo pertence à faixa onde está e leva o golpe quando a onda dela passa
        if (!e.isEnemy || !e.onHit || this.feitos.has(e)) continue;
        if (p && p.hitSet.has(e)) { this.feitos.add(e); continue; } // a lâmina já pegou
        const hb = e.hurtbox ? e.hurtbox() : e;
        const d = this.dist(G.clamp(this.ox, hb.x, hb.x + hb.w), G.clamp(this.oy, hb.y, hb.y + hb.h));
        const i = d <= R[0] ? 0 : d <= R[1] ? 1 : d <= R[2] ? 2 : -1;
        if (i < 0 || f[i] < d) continue;
        this.feitos.add(e);
        const { d: dano, crit } = G.rollDamage(DANO[i]);
        if (e.onHit(dano, this.ox, this.oy, 'spin', crit)) {
          G.P.stats.dmg.push(dano);
          const ex = hb.x + hb.w / 2, ey = hb.y + hb.h / 2;
          G.fx.streaks(ex, ey, Math.atan2(ey - this.oy, ex - this.ox), crit ? 9 : 6, 170, crit ? '#ffe27a' : this.pal.body, 0.6);
          G.fx.ring(ex, ey, 14, this.pal.edge, 0.25, 1.5);
        }
      }
      const fm = Math.max(f[0], f[1]);
      while (this.matos.length && this.matos[0].d <= fm) {
        const { tx, ty } = this.matos.shift(), tp = G.TP[G.map.get(tx, ty)];
        if (tp && tp.cut) G.cutTile(tx, ty);
      }
      for (let i = 0; i < 3; i++) if (!this.pousou[i] && this.t >= SAI[i] + VIAGEM) { this.pousou[i] = true; this.pouso(i); }
    }
    // a onda chega ao seu anel: uma cortina de luz sobe dele (e a última levanta poeira)
    pouso(i) {
      const n = 10 + i * 6, r = R[i], pal = this.pal;
      for (let k = 0; k < n; k++) {
        const a = (k + Math.random() * 0.6) / n * Math.PI * 2, x = this.ox + Math.cos(a) * r, y = this.oy + Math.sin(a) * r * K;
        G.fx.spawn({ x, y, vx: Math.cos(a) * 12, vy: -G.rf(45, 95), kind: 'streak', color: G.pick([pal.edge, pal.body, '#ffffff']), life: G.rf(0.3, 0.5), drag: 2.5, w: G.rf(0.6, 1) });
        if (k % 2 === 0) G.fx.glow(x, y - 2, { size: G.rf(2, 3.2), color: pal.edge, vy: -G.rf(15, 30), life: G.rf(0.4, 0.6) });
      }
      if (i === 2) {
        const cor = G.map.kind === 'dungeon' ? '#c8c0b8' : '#e0d8c0';
        for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; G.fx.spawn({ x: this.ox + Math.cos(a) * r, y: this.oy + Math.sin(a) * r * K, vx: Math.cos(a) * 30, vy: Math.sin(a) * 20 - 6, kind: 'puff', size: G.rf(2.5, 4), color: cor, life: G.rf(0.35, 0.55), drag: 3 }); }
      }
    }
    brilhoAnel(i) { return this.pousou[i] ? Math.max(0, 1 - (this.t - SAI[i] - VIAGEM) / 0.3) : 0; }
    // o círculo no chão (embaixo de todos; ilumina as masmorras escuras)
    draw(ctx, cam) {
      const t = this.t, x = this.ox - cam.x, y = this.oy - cam.y, pal = this.pal;
      const some = t < 0.62 ? 1 : Math.max(0, 1 - (t - 0.62) / (DURA - 0.62));
      const esc = 0.55 + 0.45 * repique(G.clamp(t / 0.16, 0, 1));
      const risco = G.clamp(t / 0.2, 0, 1), a0 = -Math.PI / 2, a1 = a0 + risco * Math.PI * 2;
      const br = [this.brilhoAnel(0), this.brilhoAnel(1), this.brilhoAnel(2)];
      G.light.add(x, y, R[2] * 1.5 * esc, pal.edge, 0.8 * some, 0.35);
      ctx.save(); ctx.translate(x, y); ctx.globalCompositeOperation = 'lighter';
      ctx.save(); ctx.scale(esc, esc * K);
      G.glow(ctx, 0, 0, R[2] * 1.05, pal.edge, 0.3 * some);
      const anel = (r, w, cor, a) => { ctx.globalAlpha = a; ctx.strokeStyle = cor; ctx.lineWidth = w; ctx.beginPath(); ctx.arc(0, 0, r, a0, a1); ctx.stroke(); };
      // borda dupla de 3σ
      anel(R[2], 1.4 + 2 * br[2], pal.edge, some); anel(R[2] - 4, 0.6, pal.body, 0.8 * some);
      // 2σ tracejado, girando, com o hexagrama inscrito
      ctx.setLineDash([4, 3]); ctx.lineDashOffset = -t * 30; anel(R[1], 1 + 2 * br[1], pal.edge, 0.9 * some); ctx.setLineDash([]);
      ctx.globalAlpha = 0.7 * some * risco; ctx.strokeStyle = pal.body; ctx.lineWidth = 0.7;
      for (const fase of [0, Math.PI / 3]) {
        ctx.beginPath();
        for (let k = 0; k <= 3; k++) { const a = -t * 1.2 + fase + k * Math.PI * 2 / 3; ctx[k ? 'lineTo' : 'moveTo'](Math.cos(a) * (R[1] - 1), Math.sin(a) * (R[1] - 1)); }
        ctx.stroke();
      }
      // 1σ com os raios de um relógio
      anel(R[0], 1 + 2 * br[0], pal.body, some);
      ctx.globalAlpha = 0.8 * some * risco; ctx.strokeStyle = pal.edge; ctx.lineWidth = 0.8; ctx.beginPath();
      for (let k = 0; k < 12; k++) { const a = t * 2 + k * Math.PI / 6; ctx.moveTo(Math.cos(a) * R[0], Math.sin(a) * R[0]); ctx.lineTo(Math.cos(a) * (R[0] + 4), Math.sin(a) * (R[0] + 4)); }
      ctx.stroke();
      // o anel que a onda acabou de alcançar acende
      for (let i = 0; i < 3; i++) if (br[i] > 0) anel(R[i], 3 * br[i], '#ffffff', br[i] * some);
      // a ponta da pena que desenha os anéis
      if (risco < 1) for (const r of R) G.glow(ctx, Math.cos(a1) * r, Math.sin(a1) * r, 7, '#ffffff', 0.9);
      ctx.restore();
      // runas entre 2σ e 3σ, em pé, girando devagar; surgem conforme o círculo se desenha
      const rr = (R[1] + R[2]) / 2 * esc;
      for (let k = 0; k < RUNAS.length; k++) {
        const aparece = G.clamp(risco * RUNAS.length - k, 0, 1);
        if (aparece <= 0) continue;
        const a = t * 1.1 + k / RUNAS.length * Math.PI * 2;
        ctx.globalAlpha = aparece * some;
        G.text(RUNAS[k], Math.cos(a) * rr, Math.sin(a) * rr * K - 3, pal.body, { ctx, shadow: false, align: 'center' });
      }
      ctx.restore();
    }
    // depois da luz: coluna no herói, as três ondas e os rótulos
    drawLate(ctx, cam) {
      const t = this.t, x = this.ox - cam.x, y = this.oy - cam.y, pal = this.pal;
      ctx.save(); ctx.translate(x, y); ctx.globalCompositeOperation = 'lighter';
      if (t < 0.4) {
        const k = 1 - t / 0.4, w = 12 * (0.5 + 0.5 * k), h = 120;
        const g = ctx.createLinearGradient(0, 0, 0, -h); g.addColorStop(0, pal.edge); g.addColorStop(1, 'rgba(0,0,0,0)');
        // fraca o bastante para o herói continuar visível no meio dela
        ctx.globalAlpha = 0.55 * k; ctx.fillStyle = g; ctx.fillRect(-w / 2, -h, w, h);
        const g2 = ctx.createLinearGradient(0, 0, 0, -h * 0.8); g2.addColorStop(0, '#ffffff'); g2.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = 0.6 * k; ctx.fillStyle = g2; ctx.fillRect(-w * 0.18, -h * 0.8, w * 0.36, h * 0.8);
        ctx.globalAlpha = 1; G.glow(ctx, 0, 0, 6 + 16 * k, '#ffffff', 0.6 * k);
      }
      ctx.save(); ctx.scale(1, K);
      const circ = r => { ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke(); };
      for (let i = 0; i < 3; i++) {
        if (t < SAI[i]) continue;
        const u = G.clamp((t - SAI[i]) / VIAGEM, 0, 1), r = this.frente(i);
        const a = u < 1 ? Math.min(1, u * 4) : Math.max(0, 1 - (t - SAI[i] - VIAGEM) / 0.22);
        if (a <= 0) continue;
        const w = 1.2 + 4.5 * (1 - u);
        ctx.strokeStyle = pal.edge;
        ctx.globalAlpha = 0.28 * a; ctx.lineWidth = w + 6; circ(r);
        ctx.globalAlpha = 0.85 * a; ctx.lineWidth = w; circ(r);
        ctx.strokeStyle = '#ffffff'; ctx.globalAlpha = a; ctx.lineWidth = Math.max(0.6, w * 0.35); circ(r);
      }
      ctx.restore();
      ctx.globalCompositeOperation = 'source-over';
      for (let i = 0; i < 3; i++) {
        if (!this.pousou[i]) continue;
        const desde = t - SAI[i] - VIAGEM, a = Math.min(1, desde / 0.08) * (t < 0.82 ? 1 : Math.max(0, 1 - (t - 0.82) / 0.2));
        ctx.globalAlpha = a;
        G.text(ROTULOS[i], 0, R[i] * K + 2 - Math.min(1, desde / 0.15) * 3, i === 2 ? '#ffffff' : pal.body, { ctx, align: 'center', outline: '#1a0a14' });
      }
      ctx.restore();
    }
  }
  G.OndaSigma = OndaSigma;

  // o giro carregado solta a onda; enquanto carrega, o círculo vai se riscando no chão
  const PL = G.Player.prototype, spin0 = PL.startSpin, draw0 = PL.draw;
  PL.startSpin = function () { spin0.call(this); G.addEnt(new OndaSigma(this)); };
  PL.draw = function (ctx, cam) {
    if (this.spinCharging && this.spinCharge > 0.12) previa(ctx, cam, this);
    draw0.call(this, ctx, cam);
  };
  function previa(ctx, cam, p) {
    const pal = G.SWORD_FX[Math.min(5, G.P.swordLv)], pronto = p.spinCharge >= 0.75;
    const u = G.clamp((p.spinCharge - 0.12) / 0.63, 0, 1);
    ctx.save(); ctx.translate(p.cx - cam.x, p.y + p.h - 1 - cam.y); ctx.scale(1, K); ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = pal.edge; ctx.lineWidth = 1.1; ctx.setLineDash([3, 3]); ctx.lineDashOffset = -G.time * 20;
    ctx.globalAlpha = pronto ? 0.65 + 0.25 * Math.sin(G.time * 12) : 0.5;
    ctx.beginPath(); ctx.arc(0, 0, R[2], -Math.PI / 2, -Math.PI / 2 + u * Math.PI * 2); ctx.stroke();
    if (pronto) {
      ctx.setLineDash([]); ctx.globalAlpha *= 0.6;
      for (const r of [R[0], R[1]]) { ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke(); }
    }
    ctx.restore();
  }
})(window.G);
