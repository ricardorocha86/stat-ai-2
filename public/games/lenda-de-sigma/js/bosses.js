'use strict';
// =====================================================================
//  Chefes. Cada um tem padrões próprios e "GOLPE CRÍTICO": ao perder
//  certa porcentagem de vida, o chefe fica atordoado e o herói pode
//  responder uma pergunta. Acertou? Dano enorme!
// =====================================================================
(function (G) {
  function R(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
  function ell(ctx, cx, cy, rx, ry, c, outline) {
    for (let y = -Math.ceil(ry); y <= Math.ceil(ry); y++) {
      const hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
      if (hw <= 0) continue;
      if (outline) R(ctx, cx - hw - 1, cy + y, hw * 2 + 2, 1, outline);
    }
    for (let y = -Math.ceil(ry); y <= Math.ceil(ry); y++) {
      const hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
      if (hw <= 0) continue;
      R(ctx, cx - hw, cy + y, hw * 2, 1, c);
    }
  }
  G.ell = ell;
  function line(ctx, x0, y0, x1, y1, c, w = 2) {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
    ctx.fillStyle = c;
    for (let i = 0; i <= n; i++) ctx.fillRect(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), w, w);
  }

  // aviso no chão: círculo vermelho pulsante antes de um impacto
  class Warn extends G.Ent {
    constructor(x, y, r, t, o = {}) { super(x - r, y - r * 0.7, r * 2, r * 1.4); this.r = r; this.life = t; this.max = t; this.color = o.color || '#ff3a3a'; this.onDone = o.onDone; this.room = G.curRoom; this.alwaysUpdate = false; }
    get by() { return this.y - 500; }
    update(dt) { this.t += dt; this.life -= dt; if (this.life <= 0) { this.dead = true; if (this.onDone) this.onDone(this); } }
    draw(ctx, cam) {
      const k = Math.min(1, 1 - this.life / this.max), x = this.cx - cam.x, y = this.cy - cam.y, r = this.r;
      ctx.save();
      ctx.globalAlpha = 0.18 + 0.12 * Math.sin(this.t * 24); ctx.fillStyle = this.color;
      ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.45; ctx.beginPath(); ctx.ellipse(x, y, r * k, r * 0.7 * k, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.9; ctx.strokeStyle = this.color; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.7, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
  }
  G.Warn = Warn;
  // aviso retangular (células do Viés)
  class WarnRect extends G.Ent {
    constructor(x, y, w, h, t, o = {}) { super(x, y, w, h); this.life = t; this.max = t; this.safe = o.safe; this.onDone = o.onDone; this.room = G.curRoom; }
    get by() { return this.y - 500; }
    update(dt) { this.t += dt; this.life -= dt; if (this.life <= 0) { this.dead = true; if (this.onDone) this.onDone(this); } }
    draw(ctx, cam) {
      const x = this.x - cam.x, y = this.y - cam.y, c = this.safe ? '#5aff8a' : '#ff3a5a', k = 1 - this.life / this.max;
      ctx.save();
      ctx.globalAlpha = this.safe ? 0.18 : 0.14 + 0.16 * k + 0.1 * Math.sin(this.t * (10 + k * 30)); ctx.fillStyle = c; ctx.fillRect(x + 1, y + 1, this.w - 2, this.h - 2);
      ctx.globalAlpha = 0.85; ctx.strokeStyle = c; ctx.lineWidth = 1; ctx.setLineDash([4, 3]); ctx.lineDashOffset = -this.t * 20; ctx.strokeRect(x + 1.5, y + 1.5, this.w - 3, this.h - 3);
      ctx.restore();
    }
    drawLate(ctx, cam) { if (this.safe) G.text('SEGURO', this.x - cam.x + this.w / 2, this.y - cam.y + this.h / 2 - 3, '#7aff8a', { align: 'center', outline: '#0a2a10' }); }
  }
  // pedra que cai do alto com aviso no chão
  G.dropRock = function (boss, x, y, o = {}) {
    const r = o.r || 12, dmg = o.dmg || boss.dmg;
    G.addEnt(new Warn(x, y, r, 0.86)).room = boss.room;
    const e = G.addEnt(new G.EShot(x, y, 0, 0, { spr: o.spr || 'rock', size: o.size || 10, z: 110, vz: 0, life: 4, pierce: true, onLand: s => {
      G.fx.burst(s.cx, s.cy, o.cols || ['#9a8a7a', '#ffffff', '#5a4a3a'], 10, 70, { grav: 200 }); G.fx.ring(s.cx, s.cy, r + 6, '#fff0c0', 0.25, 2); G.shake(2, 0.12);
      if (o.onLand) o.onLand(s);
      const p = G.player; if (p && G.dist(p.cx, p.cy, s.cx, s.cy) < r + 3 && p.z < 6) G.hurtPlayer(dmg, s.cx, s.cy);
    } }));
    e.room = boss.room; e.harmlessAir = true;
    return e;
  };

  class Boss extends G.Ent {
    constructor(x, y, w, h, o) {
      super(x, y, w, h);
      this.isEnemy = true; this.isBoss = true; this.heavy = true;
      this.hp = this.maxHp = o.hp; this.name = o.name; this.topic = o.topic; this.dmg = o.dmg || 4;
      this.st = 'intro'; this.stT = 1.2; this.hurtT = 0; this.enrage = 0; this.arena = o.arena;
      this.thresholds = (o.thr || [0.66, 0.33]).slice(); this.xp = o.xp || 60; this.stun = 0;
    }
    hurtbox() { return { x: this.x, y: this.y - this.h, w: this.w, h: this.h * 2 }; }
    vulnerable(kind) { return this.stun > 0 ? 1 : 0.5; }
    warn(x, y, r, t, o) { const w = G.addEnt(new Warn(x, y, r, t, o)); w.room = this.room; return w; }
    // segunda fase: rugido, onda de choque e padrões novos
    enterP2() {
      this.p2 = true; this.p2T = 1.5; this.stun = 0;
      G.flash('#ffffff', 0.4, 0.6); G.sfx('roar'); G.hitStop = Math.max(G.hitStop, 0.15);
      G.fx.ring(this.cx, this.cy - 8, 70, '#ffb0a0', 0.6, 4); G.fx.ring(this.cx, this.cy - 8, 40, '#ffffff', 0.4, 2);
      const p = G.player; if (p) { const a = Math.atan2(p.cy - this.cy, p.cx - this.cx); p.kbx = Math.cos(a) * 220; p.kby = Math.sin(a) * 220; p.kbT = 0.2; }
      for (const e of G.ents) if (e instanceof G.EShot) e.dead = true;
      G.ui.toast(this.name + ' entrou em FÚRIA: novos ataques!', '#ff9a5a');
    }
    onHit(d, sx, sy, kind, crit) {
      if (this.dead || this.dying || this.hurtT > 0 || this.st === 'intro' || this.p2T > 0) return false;
      const m = this.vulnerable(kind, sx, sy);
      if (m <= 0) { G.sfx('tink'); G.fx.burst(this.cx, this.cy - 8, ['#ffffff'], 4, 40); return false; }
      d = Math.max(1, Math.round(d * m));
      this.hp -= d; this.hurtT = 0.18;
      G.fx.text(this.cx, this.y - this.h - 6, (crit ? 'CRÍTICO! ' : '') + d, m >= 1 ? '#ffd84a' : '#ffffff');
      G.fx.spark(this.cx + G.rf(-8, 8), this.cy - this.h + G.rf(-6, 6), '#ffffff', 10);
      if (kind === 'sword' || kind === 'spin') G.hitStop = Math.max(G.hitStop, 0.06);
      G.sfx('hit');
      if (this.hp <= 0) this.defeat();
      else { this.checkThreshold(); if (this.hasP2 && !this.p2 && this.hp <= this.maxHp * 0.5) this.enterP2(); }
      return true;
    }
    checkThreshold() {
      if (this.thresholds.length && this.hp / this.maxHp <= this.thresholds[0]) { this.thresholds.shift(); this.critQuiz(); }
    }
    critQuiz() {
      const self = this;
      this.stun = Math.max(this.stun, 0.5);
      G.runScript(async () => {
        await G.wait(0.3);
        await G.ui.say(null, '^y' + self.name + '^0 cambaleou! Responda corretamente para desferir um ^oGOLPE CRÍTICO^0!');
        const ok = await G.ui.quiz(G.Q.gen(self.topic, 2), { title: 'GOLPE CRÍTICO', subtitle: self.name });
        if (ok) {
          const dmg = Math.round(self.maxHp * 0.16);
          self.hp -= dmg; G.shake(6, 0.5); G.sfx('explode');
          G.fx.text(self.cx, self.y - self.h - 10, 'GOLPE CRÍTICO! -' + dmg, '#ffd84a', true);
          G.fx.burst(self.cx, self.cy - 10, ['#ffd84a', '#ffffff', '#ff8a5a'], 30, 120);
          self.stun = 2.5; self.onStun && self.onStun();
          if (self.hp <= 0) self.defeat();
        } else {
          self.enrage = 8; G.ui.toast(self.name + ' ficou ENFURECIDO!', '#ff6a5a'); G.sfx('roar');
        }
      });
    }
    defeat() {
      if (this.dying) return;
      this.dying = true; this.hp = 0; this.dieT = 0; this.alwaysUpdate = true; this.noContact = true;
      const self = this;
      G.music(null); G.hitStop = 0.35; G.flash('#ffffff', 0.35, 0.7);
      for (const e of G.ents) if (e instanceof G.EShot || e instanceof Warn || e instanceof WarnRect) { e.dead = true; G.fx.burst(e.cx, e.cy, ['#ffffff'], 3, 30); }
      G.runScript(async () => {
        G.sfx('bossdie');
        await G.wait(0.3);
        for (let i = 0; i < 12; i++) {
          const ex = self.cx + G.rf(-self.w / 2 - 8, self.w / 2 + 8), ey = self.cy - self.h / 2 + G.rf(-22, 10);
          G.fx.burst(ex, ey, ['#ffffff', '#ffd84a', '#ff6a2a'], 10, 90); G.fx.ring(ex, ey, 16, '#fff0c0', 0.3, 2); G.fx.smoke(ex, ey, 3, '#8a807a', 30);
          if (i % 3 === 0) G.sfx('explode'); else G.sfx('kill');
          G.shake(3, 0.2);
          await G.wait(0.12);
        }
        G.flash('#ffffff', 0.9, 1); G.shake(7, 0.6);
        G.fx.ring(self.cx, self.cy - 8, 100, '#ffffff', 0.6, 4); G.fx.burst(self.cx, self.cy - 10, ['#ffffff', '#ffd84a', '#7ae4ff'], 40, 170);
        for (let i = 0; i < 26; i++) G.fx.glow(self.cx + G.rf(-22, 22), self.cy - G.rf(0, 34), { size: 4, color: '#ffe8a0', vy: -G.rf(20, 60), vx: G.rf(-20, 20), life: G.rf(0.8, 1.6) });
        self.dead = true;
        G.P.stats.kills++;
        G.addXP(self.xp);
        await G.wait(0.5);
        if (G.onBossDefeated) await G.onBossDefeated(self);
      });
    }
    contact() {
      const p = G.player;
      if (!p || this.dying || this.st === 'intro' || this.noContact) return;
      const hb = this.contactBox ? this.contactBox() : this.hurtbox();
      if (p.z < 4 && G.overlap(hb, { x: p.x, y: p.y - 6, w: p.w, h: p.h + 6 })) G.hurtPlayer(this.dmg, this.cx, this.cy);
    }
    update(dt) {
      this.t += dt;
      if (this.hurtT > 0) this.hurtT -= dt;
      if (this.enrage > 0) this.enrage -= dt;
      if (this.dying) { this.dieT += dt; return; }
      if (this.st === 'intro') { this.stT -= dt; if (this.stT <= 0) this.next(); return; }
      if (this.p2T > 0) { this.p2T -= dt; if (Math.random() < 0.5) G.fx.streaks(this.cx, this.cy - 10, Math.random() * Math.PI * 2, 1, 120, '#ffb0a0', 3); if (this.p2T <= 0) this.next(); return; }
      if (this.stun > 0) { this.stun -= dt; if (this.stun <= 0) this.next(); }
      else this.ai(dt * (this.enrage > 0 ? 1.4 : 1));
      this.contact();
    }
    clampArena(pad = 0) {
      const a = this.arena;
      this.x = G.clamp(this.x, a.x + pad, a.x + a.w - this.w - pad);
      this.y = G.clamp(this.y, a.y + pad, a.y + a.h - this.h - pad);
    }
    shot(cx, cy, ang, sp, o = {}) { const e = G.addEnt(new G.EShot(cx, cy, Math.cos(ang) * sp, Math.sin(ang) * sp, Object.assign({ dmg: this.dmg, size: 8, spr: 'fireball' }, o))); e.room = this.room; return e; }
    flashOn() { if (this.dying || this.p2T > 0) return Math.floor(this.t * 16) % 2 === 0; return this.hurtT > 0 && Math.floor(this.t * 30) % 2 === 0; }
    drawStunStars(ctx, x, y) {
      if (this.stun <= 0) return;
      for (let i = 0; i < 3; i++) { const a = this.t * 4 + i * 2.1; G.draw(ctx, 'sparkle', x + Math.cos(a) * 12 - 2, y + Math.sin(a) * 4 - 2); }
    }
  }
  G.Boss = Boss;

  // ------------------------------------------------------------------
  // 1) GOLEM DESEQUILIBRADO — Templo da Média
  // ------------------------------------------------------------------
  // desenha uma peça girando em torno do pivô (px, py em unidades lógicas do sprite)
  function part(ctx, img, x, y, px, py, rot, o) {
    if (!img) return;
    const src = o && o.white ? G.white(img) : img;
    ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot);
    if (o && o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
    ctx.drawImage(src, -px, -py, G.lw(img), G.lh(img));
    if (o && o.glow && o.glowA > 0.01) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= Math.min(1, o.glowA); ctx.drawImage(G.tint(o.glow, o.glowC), -px, -py, G.lw(img), G.lh(img)); }
    ctx.restore();
  }
  const rot = (x, y, a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
  // cinemática inversa de dois ossos: devolve o joelho mais alto na tela
  function ik(ax, ay, bx, by, L1, L2) {
    let dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy) || 0.001;
    if (d > L1 + L2 - 0.01) { const s = (L1 + L2 - 0.01) / d; dx *= s; dy *= s; d = L1 + L2 - 0.01; }
    const a = Math.atan2(dy, dx), b = Math.acos(G.clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
    const k1 = [ax + Math.cos(a - b) * L1, ay + Math.sin(a - b) * L1], k2 = [ax + Math.cos(a + b) * L1, ay + Math.sin(a + b) * L1];
    return k1[1] < k2[1] ? k1 : k2;
  }
  // segmento de membro de (ax, ay) até (bx, by); apontando para a esquerda usa a versão espelhada (luz continua por cima)
  function seg(ctx, name, ax, ay, bx, by, o) {
    const ang = Math.atan2(by - ay, bx - ax), img = G.bossArt[name + (Math.cos(ang) < 0 ? 'F' : '')];
    part(ctx, img, ax, ay, img.piv[0], img.piv[1], ang, o);
  }
  // perna completa (coxa + canela) com o joelho resolvido por IK
  function leg(ctx, nA, nB, L1, L2, hx, hy, fx, fy, o) { const k = ik(hx, hy, fx, fy, L1, L2); seg(ctx, nA, hx, hy, k[0], k[1], o); seg(ctx, nB, k[0], k[1], fx, fy, o); }

  class Golem extends Boss {
    constructor(x, y, arena) { super(x, y, 26, 14, { hp: 36, name: 'Golem Desequilibrado', topic: 'media', dmg: 4, arena }); this.armUp = 0; this.rings = []; this.cnt = 0; this.hasP2 = true; this.walkPh = 0; this.slamAt = -9; this.throwAt = -9; }
    // corpo maior que a base: a espada acerta o tronco; o contato continua só na base
    hurtbox() { return { x: this.cx - 17, y: this.y + this.h - 50, w: 34, h: 50 }; }
    contactBox() { return { x: this.x, y: this.y - this.h, w: this.w, h: this.h * 2 }; }
    vulnerable(kind) { if (this.stun > 0) return 1; return kind === 'bomb' ? 0.5 : 0.2; }
    next() { this.st = 'walk'; this.stT = this.p2 ? G.rf(1.1, 1.8) : G.rf(2, 3); }
    onStun() { this.st = 'stunned'; }
    update(dt) {
      // despertar: quando os olhos acendem, o templo treme e cai pó das pedras
      if (this.st === 'intro' && !this.awoke && this.stT < 0.75) {
        this.awoke = true; G.shake(3, 0.45); G.sfx('roar');
        G.fx.smoke(this.cx, this.y + this.h, 8, '#a89a8a', 40);
        G.fx.burst(this.cx, this.cy - 40, ['#8e9f87', '#677862', '#4e8f34'], 12, 50, { grav: 300, size: 2, life: 0.7, drag: 1 });
      }
      super.update(dt);
    }
    // pose do esqueleto (ângulos em rad; 0 = braço pendurado; positivo = horário)
    pose() {
      const s = this.st, t = this.t, k = { lean: -0.07, bob: 0, crouch: 0, bigA: 0.12, bigB: -0.15, smA: -0.12, smB: 0.22, hx: 0, hy: 0, hr: 0, liftL: 0, liftR: 0, jit: 0, glow: 0.18 + 0.08 * Math.sin(t * 3), fist: 0 };
      if (this.dying) { k.jit = this.dieT < 0.6 ? 1.4 : 0; k.glow = 1.2; k.crouch = Math.min(6, this.dieT * 6); return k; }
      if (s === 'intro') {
        const a = G.clamp(1 - this.stT / 1.2, 0, 1);
        k.crouch = (1 - a) * 7; k.hy = (1 - a) * 3; k.hr = (1 - a) * 0.15; k.glow = a * 0.6; k.jit = a > 0.3 && a < 0.8 ? 0.6 : 0; k.bigA = 0.3 * (1 - a) + 0.12 * a;
        return k;
      }
      if (this.p2T > 0) { k.bigA = 1.5 + Math.sin(t * 30) * 0.06; k.bigB = -0.4; k.smA = -1.5; k.smB = 0.4; k.hy = -2; k.lean = 0; k.jit = 0.9; k.glow = 1; return k; }
      if (this.stun > 0 || s === 'stunned') {
        const e = t - this.slamAt < 0.6 ? 1 : 0; // logo após a martelada o punho ainda está no chão
        k.lean = -0.18 + Math.sin(t * 3) * 0.04; k.crouch = 3; k.hy = 2.5; k.hr = -0.14 + Math.sin(t * 2.4) * 0.06;
        k.bigA = e ? -0.38 : -0.15; k.bigB = e ? 0 : 0.25; k.smA = -0.02; k.smB = 0.35; k.glow = 0.12 + (Math.floor(t * 10) % 2) * 0.3; k.fist = e;
        return k;
      }
      if (s === 'walk') {
        const w = Math.sin(this.walkPh);
        k.liftL = Math.max(0, w) * 3.5; k.liftR = Math.max(0, -w) * 3.5; k.bob = -Math.abs(w) * 1.6;
        k.lean += w * 0.04; k.bigA = 0.12 + w * 0.14; k.smA = -0.12 - w * 0.2; k.hx = w * 0.6;
        // continuação do arremesso
        const th = t - this.throwAt;
        if (th < 0.4) { const e = th / 0.4; k.bigA = G.lerp(-0.7, 0.12, e * e); k.bigB = G.lerp(-0.2, -0.15, e); k.lean = G.lerp(-0.16, k.lean, e); }
      } else if (s === 'raise') {
        const a = this.armUp;
        k.bigA = 0.12 + a * 2.55; k.bigB = -a * 0.9; k.lean = -0.07 + a * 0.15; k.hr = a * 0.08; k.hy = -a; k.crouch = a * 2.5; k.smA = -0.12 - a * 0.5;
        k.jit = a >= 1 ? 0.5 : 0; k.glow = 0.2 + a * 0.7; k.fist = a;
      } else if (s === 'slam') {
        const e = Math.min(1, (t - this.slamAt) / 0.08), back = Math.min(1, Math.max(0, (t - this.slamAt - 0.5) / 0.6));
        k.bigA = G.lerp(2.67, -0.38, e) + back * 0.15; k.bigB = G.lerp(-0.9, 0, e); k.lean = G.lerp(0.08, -0.2, e); k.crouch = G.lerp(2.5, 6, e) - back * 2; k.hy = 2 * e; k.smA = -0.5 + e * 0.4;
        k.glow = 0.9 - back * 0.5; k.fist = 1;
      } else if (s === 'rain') {
        const v = Math.sin(t * 20) * 0.16;
        k.bigA = 2.75 + v; k.bigB = -0.3; k.smA = -2.7 - v; k.smB = 0.3; k.hy = -1.5; k.hr = 0; k.lean = -0.02; k.jit = 0.4; k.glow = 0.5 + Math.abs(v) * 2;
      } else if (s === 'throw') {
        const a = G.clamp(1 - this.stT / 0.5, 0, 1);
        k.bigA = 0.12 + a * 1.7; k.bigB = -a * 1.1; k.lean = -0.07 + a * 0.1; k.hr = a * 0.05; k.fist = a * 0.6;
      }
      if (this.enrage > 0) k.glow = Math.max(k.glow, 0.7 + 0.3 * Math.sin(t * 12));
      return k;
    }
    // posições do esqueleto no mundo (efeitos de impacto usam a do punho)
    rig(k = this.pose()) {
      const hipX = this.cx + (k.jit ? Math.sin(this.t * 61) * k.jit : 0), base = this.y + this.h, hipY = base - 19 + k.crouch + k.bob;
      const at = (o, d) => [o[0] + d[0], o[1] + d[1]], hip = [hipX, hipY];
      const shL = at(hip, rot(-21, -28, k.lean)), shR = at(hip, rot(23, -27, k.lean));
      const elL = at(shL, rot(0, 12.5, k.lean + k.bigA)), elR = at(shR, rot(0, 8, k.lean + k.smA));
      return { base, hip, shL, shR, elL, elR, fistL: at(elL, rot(0, 17.5, k.lean + k.bigA + k.bigB)), neck: at(hip, rot(0, -36, k.lean)), core: at(hip, rot(0, -19, k.lean)) };
    }
    ai(dt) {
      this.stT -= dt;
      const p = G.player;
      if (this.st === 'walk') {
        const a = Math.atan2(p.cy - this.cy, p.cx - this.cx), sp = this.p2 ? 38 : 26;
        G.moveEnt(this, Math.cos(a) * sp * dt, Math.sin(a) * sp * dt, { ghostEnts: true });
        this.clampArena(2);
        // passos pesados: poeira e tremor a cada pisada
        const before = Math.sin(this.walkPh); this.walkPh += dt * (this.p2 ? 7.5 : 5.5);
        if (Math.sign(before) !== Math.sign(Math.sin(this.walkPh))) {
          const fx = this.cx + (before > 0 ? -9 : 9);
          G.fx.smoke(fx, this.y + this.h, 3, '#a89a8a', 18); G.shake(0.8, 0.06);
        }
        if (this.stT <= 0) {
          this.cnt++;
          this.st = this.p2 ? ['raise', 'rain', 'throw', 'raise', 'rain'][this.cnt % 5] : (this.cnt % 3 === 0 ? 'throw' : 'raise');
          this.stT = this.st === 'raise' ? 0.7 : this.st === 'rain' ? 1.4 : 0.5; this.k = 0;
          if (this.st === 'rain') { G.sfx('roar'); G.ui.toast('Chuva de pedras! Fuja dos círculos vermelhos.', '#ffb0a0'); }
        }
      } else if (this.st === 'rain') {
        // pedras caem em volta do herói (média das posições = o herói)
        this.armUp = 0.6 + Math.sin(this.t * 20) * 0.2;
        this.vol = (this.vol || 0) - dt;
        if (this.vol <= 0 && this.k < 7) { this.vol = 0.16; this.k++; const a = this.arena; G.dropRock(this, G.clamp(p.cx + G.rf(-44, 44), a.x + 8, a.x + a.w - 8), G.clamp(p.cy + G.rf(-30, 30), a.y + 8, a.y + a.h - 8)); }
        if (this.stT <= 0) { this.armUp = 0; this.next(); }
      } else if (this.st === 'raise') {
        this.armUp = Math.min(1, this.armUp + dt * 3);
        if (this.stT <= 0) {
          this.st = 'slam'; this.stT = this.p2 ? 1.5 : 1.2; this.armUp = 0; G.sfx('explode'); G.shake(5, 0.4);
          this.slamAt = this.t; G.hitStop = Math.max(G.hitStop, 0.07);
          this.rings.push({ r: 8, x: this.cx, y: this.cy, hit: false });
          if (this.p2) this.ring2T = 0.4;
          G.fx.burst(this.cx, this.cy, ['#9a8a7a', '#ffffff'], 20, 90); G.fx.smoke(this.cx, this.cy, 8, '#a89a8a', 50);
          // o punho afunda no chão: lascas de pedra e cratera
          const f = this.rig(Object.assign(this.pose(), { bigA: -0.38, bigB: 0, lean: -0.2, crouch: 6 })).fistL;
          this.crater = { x: f[0], y: this.y + this.h + 2, at: this.t };
          G.fx.burst(f[0], f[1] + 6, ['#8e9f87', '#677862', '#435241'], 14, 110, { grav: 380, up: -90, size: 2.5, life: 0.7, drag: 1 });
          G.fx.ring(f[0], this.y + this.h + 2, 22, '#fff0c0', 0.3, 2.5);
        }
      } else if (this.st === 'slam') {
        if (this.ring2T > 0) { this.ring2T -= dt; if (this.ring2T <= 0) { this.rings.push({ r: 8, x: this.cx, y: this.cy, hit: false }); G.sfx('explode'); G.shake(4, 0.3); } }
        if (this.stT <= 0) { this.st = 'stunned'; this.stun = 1.7; }
      } else if (this.st === 'throw') {
        if (this.stT <= 0) {
          for (let i = -1; i <= 1; i++) {
            const a = Math.atan2(p.cy - this.cy, p.cx - this.cx) + i * 0.4;
            const sh = this.shot(this.cx, this.cy - 14, a, 95, { spr: 'rock', size: 8, z: 20, vz: 60, life: 3, onLand: s => { G.fx.burst(s.cx, s.cy, ['#9a8a7a'], 6, 40); } });
            sh.pierce = true;
          }
          G.sfx('bombput'); this.throwAt = this.t;
          this.next();
        }
      }
      for (const rg of this.rings) {
        rg.r += 150 * dt;
        const d = Math.hypot(p.cx - rg.x, (p.cy - rg.y) / 0.75);
        if (!rg.hit && Math.abs(d - rg.r) < 7 && p.z < 4) { rg.hit = true; G.hurtPlayer(this.dmg, rg.x, rg.y); }
        if (Math.random() < 0.5) { const a = Math.random() * Math.PI * 2; G.fx.spawn({ x: rg.x + Math.cos(a) * rg.r, y: rg.y + Math.sin(a) * rg.r * 0.75, vy: -20, kind: 'puff', size: 2.5, color: '#b8a898', life: 0.35, drag: 2 }); }
      }
      this.rings = this.rings.filter(rg => rg.r <= 220);
    }
    draw(ctx, cam) {
      const A = G.bossArt, k = this.pose(), R = this.rig(k), ox = -cam.x, oy = -cam.y;
      const x = this.cx + ox, base = R.base + oy;
      // cratera deixada pela martelada
      if (this.crater) {
        const age = this.t - this.crater.at, cx = this.crater.x + ox, cy = this.crater.y + oy;
        if (age < 5) {
          ctx.save(); ctx.globalAlpha = Math.min(1, (5 - age) / 1.5);
          ctx.fillStyle = 'rgba(10,14,10,0.55)'; ctx.beginPath(); ctx.ellipse(cx, cy, 11, 4.5, 0, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = 'rgba(10,14,10,0.7)'; ctx.lineWidth = 0.75; ctx.beginPath();
          for (let i = 0; i < 6; i++) { const a = i * 1.05 + 0.3, r1 = 9 + (i % 3) * 4; ctx.moveTo(cx + Math.cos(a) * 8, cy + Math.sin(a) * 3.2); ctx.lineTo(cx + Math.cos(a + 0.15) * r1, cy + Math.sin(a + 0.15) * r1 * 0.42); }
          ctx.stroke(); ctx.restore();
        }
      }
      G.shadow(ctx, x, base - 1, 60, 0.4);
      if (this.st === 'raise') { ctx.save(); ctx.strokeStyle = 'rgba(255,80,60,' + (0.3 + 0.3 * Math.sin(this.t * 20)) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, base - 4, 30 + this.armUp * 10, (30 + this.armUp * 10) * 0.75, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
      for (const rg of this.rings) {
        const rr = rg.r;
        ctx.save(); ctx.strokeStyle = 'rgba(255,240,200,0.85)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(rg.x - cam.x, rg.y - cam.y, rr, rr * 0.75, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = 'rgba(160,140,110,0.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(rg.x - cam.x, rg.y - cam.y, rr - 4, (rr - 4) * 0.75, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      }
      const white = this.flashOn();
      const gc = this.dying ? '#ffffff' : this.stun > 0 ? (Math.floor(this.t * 10) % 2 ? '#ffffff' : '#7aff8a') : this.enrage > 0 || this.p2T > 0 ? '#ff5a3a' : '#3aff6a';
      const fade = this.dying ? G.clamp(1 - (this.dieT - 1.7) / 0.6, 0, 1) : 1;
      const o = (glow, extra) => ({ white, glow, glowA: k.glow * (extra || 1), glowC: gc, alpha: fade });
      // morte: as peças se soltam e caem
      const d = this.dying ? Math.max(0, this.dieT - 0.6) : 0;
      const fly = (p, vx, vy, sp) => { if (!d) return [p[0] + ox, p[1] + oy, 0]; const y = Math.min(p[1] + vy * d + 170 * d * d, R.base + 2); return [p[0] + vx * d + ox, y + oy, sp * Math.min(d, 1.2)]; };
      // pernas e bacia
      part(ctx, A.golemLeg, R.hip[0] - 9 + ox, base - 16 - k.liftL, 7.5, 1, 0, o(A.golemLegGlow));
      part(ctx, A.golemLeg, R.hip[0] + 9 + ox, base - 16 - k.liftR, 7.5, 1, 0, o(A.golemLegGlow));
      part(ctx, A.golemPelvis, R.hip[0] + ox, R.hip[1] + 2 + oy, 14, 5.5, k.lean * 0.5, o(A.golemPelvisGlow));
      // tronco e núcleo
      { const tp = fly(R.hip, 0, -8, -0.25); part(ctx, A.golemTorso, tp[0], tp[1], 24, 39, k.lean + tp[2], o(A.golemTorsoGlow, 1.3)); }
      if (!this.dying || this.dieT < 2.3) {
        const cx = R.core[0] + ox, cy = R.core[1] + oy, pulse = 1 + Math.sin(this.t * 6) * 0.12;
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, cx, cy, 11 * pulse, gc, 0.9); ctx.restore();
        ctx.fillStyle = gc; ctx.beginPath(); ctx.moveTo(cx, cy - 4.5); ctx.lineTo(cx + 3.5, cy); ctx.lineTo(cx, cy + 4.5); ctx.lineTo(cx - 3.5, cy); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.beginPath(); ctx.moveTo(cx, cy - 4.5); ctx.lineTo(cx, cy); ctx.lineTo(cx - 3.5, cy); ctx.closePath(); ctx.fill();
        G.light.add(cx, cy, 50 + k.glow * 20, gc, 0.85);
      }
      // braço pequeno ("2")
      { const f = fly(R.elR, 40, -55, 3.5), u = fly(R.shR, 40, -55, 3.5);
        part(ctx, A.golemSmallFore, f[0], f[1], 6.5, 1.5, k.lean + k.smA + k.smB + f[2], o(A.golemSmallForeGlow, 1 + k.fist * 0.3));
        part(ctx, A.golemSmallUpper, u[0], u[1], 6, 4, k.lean + k.smA + u[2], o(A.golemSmallUpperGlow)); }
      // cabeça (olha para o herói) e olhos acesos na fenda
      { const p = G.player, look = p && !this.dying ? G.clamp((p.cx - this.cx) / 70, -1, 1) * 1.5 : 0;
        const n = [R.neck[0] + k.hx + look, R.neck[1] + 3 + k.hy], h = fly(n, 12, -85, 2.6), hr = k.lean * 0.6 + k.hr + h[2];
        part(ctx, A.golemHead, h[0], h[1], 12, 16.5, hr, o(A.golemHeadGlow));
        if (!this.dying || this.dieT < 0.9) {
          const ec = this.enrage > 0 || this.p2T > 0 ? '#ff4a3a' : this.stun > 0 ? '#9aa890' : '#ffd84a', ea = this.st === 'intro' ? G.clamp((1 - this.stT / 1.2) * 2 - 0.6, 0, 1) : 1;
          ctx.save(); ctx.translate(h[0], h[1]); ctx.rotate(hr); ctx.globalAlpha = ea;
          for (const s of [-1, 1]) {
            const ex = s * 4 + look * 0.4 - 1.5, ey = this.stun > 0 ? -5 : -5.5;
            ctx.fillStyle = ec; ctx.fillRect(ex, ey, 3, this.stun > 0 ? 0.5 : 1.5);
            ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, ex + 1.5, ey + 0.75, 4, ec, 0.8); ctx.globalCompositeOperation = 'source-over';
          }
          ctx.restore();
        } }
      // braço grande ("10"), na frente
      { const f = fly(R.elL, -48, -40, -3), u = fly(R.shL, -48, -40, -3);
        part(ctx, A.golemBigFore, f[0], f[1], 12, 2.5, k.lean + k.bigA + k.bigB + f[2], o(A.golemBigForeGlow, 1 + k.fist));
        part(ctx, A.golemBigUpper, u[0], u[1], 10, 6.5, k.lean + k.bigA + u[2], o(A.golemBigUpperGlow)); }
      this.drawStunStars(ctx, R.neck[0] + ox, R.neck[1] + oy - 16 + k.hy);
    }
  }

  // ------------------------------------------------------------------
  // 2) ARANHA MEDIANA — Bosque da Mediana
  // ------------------------------------------------------------------
  class Aranha extends Boss {
    constructor(x, y, arena) { super(x, y, 26, 14, { hp: 50, name: 'Aranha Mediana', topic: 'd2', dmg: 4, arena }); this.z = 0; this.cnt = 0; this.hasP2 = true; this.fanT = 1.5; this.walkPh = 0; this.shotAt = -9; this.landAt = -9; }
    // o corpo grande recebe golpes; o contato continua na base original
    hurtbox() { return { x: this.cx - 20, y: this.y + this.h - 34 - this.z, w: 40, h: 34 }; }
    contactBox() { return { x: this.x, y: this.y - this.h - this.z, w: this.w, h: this.h * 2 }; }
    vulnerable(kind) { if (this.z > 10) return 0; if (this.stun > 0) return 1; return kind === 'bomb' ? 1 : 0.5; }
    next() { this.st = 'crawl'; this.stT = G.rf(2.5, 3.5); this.noContact = false; }
    onStun() { this.st = 'stunned'; this.z = 0; }
    ai(dt) {
      this.stT -= dt;
      const p = G.player;
      if (this.st === 'crawl') {
        const a = Math.atan2(p.cy - this.cy, p.cx - this.cx) + Math.sin(this.t * 2) * 0.8;
        G.moveEnt(this, Math.cos(a) * (this.p2 ? 58 : 48) * dt, Math.sin(a) * (this.p2 ? 58 : 48) * dt, { ghostEnts: true }); this.clampArena(2);
        this.walkPh += dt * (this.p2 ? 13 : 11);
        this.fanT -= dt;
        if (this.p2 && this.fanT <= 0) {
          // leque de 5 teias: a do meio (a "mediana") é mais rápida
          this.fanT = 1.7; const b = Math.atan2(p.cy - this.cy, p.cx - this.cx);
          for (let i = -2; i <= 2; i++) this.shot(this.cx, this.cy - 6, b + i * 0.28, i === 0 ? 125 : 80, { spr: 'web', dmg: 2 });
          G.sfx('beam'); this.shotAt = this.t;
        } else if (!this.p2 && Math.random() < dt * 0.9) { const b = Math.atan2(p.cy - this.cy, p.cx - this.cx); this.shot(this.cx, this.cy - 6, b, 80, { spr: 'web', dmg: 2 }); this.shotAt = this.t; }
        if (this.stT <= 0) { this.st = 'up'; this.stT = 0.8; this.noContact = true; G.sfx('jump'); }
      } else if (this.st === 'up') {
        this.z += 300 * dt;
        if (this.stT <= 0) { this.st = 'hang'; this.stT = 1.6; }
      } else if (this.st === 'hang') {
        // segue o herói e trava a mira no fim (o alvo fica vermelho)
        if (this.stT > 0.45) { this.x = G.approach(this.x, p.cx - this.w / 2, 120 * dt); this.y = G.approach(this.y, p.cy - this.h / 2, 120 * dt); this.clampArena(2); }
        else if (!this.locked) { this.locked = true; G.sfx('tell'); }
        if (this.stT <= 0) { this.st = 'drop'; this.stT = 0.5; this.locked = false; }
      } else if (this.st === 'drop') {
        this.z = Math.max(0, this.z - 600 * dt);
        if (this.z <= 0) {
          G.sfx('explode'); G.shake(5, 0.4); this.noContact = false; this.landAt = this.t;
          G.fx.burst(this.cx, this.cy, ['#c8c0b0', '#ffffff'], 18, 90);
          G.fx.smoke(this.cx, this.y + this.h, 10, '#8a7a5a', 45);
          this.cnt++;
          if (this.p2) { this.rings = [{ r: 8, x: this.cx, y: this.cy, hit: false }]; G.addEnt(new Egg(this.cx + G.rf(-60, 60), this.cy + G.rf(-20, 30), this)).room = this.room; }
          else if (this.cnt % 2 === 0) for (let i = 0; i < 2; i++) { const e = G.makeEnemy('aranha', this.cx + (i ? 20 : -30), this.cy, { room: this.room }); G.addEnt(e); }
          this.st = 'stunned'; this.stun = 1.8;
        }
      }
    }
    update(dt) {
      super.update(dt);
      if (this.rings && !this.dying) {
        const p = G.player;
        for (const rg of this.rings) { rg.r += 140 * dt; const d = Math.hypot(p.cx - rg.x, (p.cy - rg.y) / 0.75); if (!rg.hit && Math.abs(d - rg.r) < 6 && p.z < 4) { rg.hit = true; G.hurtPlayer(this.dmg, rg.x, rg.y); } }
        this.rings = this.rings.filter(rg => rg.r < 160);
      }
    }
    draw(ctx, cam) {
      const A = G.bossArt, x = this.cx - cam.x, base = this.y + this.h - cam.y, z = this.z;
      if (this.rings) for (const rg of this.rings) { ctx.save(); ctx.strokeStyle = 'rgba(232,232,240,0.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(rg.x - cam.x, rg.y - cam.y, rg.r, rg.r * 0.75, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
      if (this.st === 'hang' || this.st === 'drop') {
        const lk = this.st === 'drop' || this.locked;
        ctx.save(); ctx.globalAlpha = lk ? 0.75 + 0.25 * Math.sin(this.t * 40) : 0.45; ctx.strokeStyle = lk ? '#ff3a3a' : '#ffd0d0'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.ellipse(x, base - 2, 24, 15, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x - 28, base - 2); ctx.lineTo(x - 18, base - 2); ctx.moveTo(x + 18, base - 2); ctx.lineTo(x + 28, base - 2); ctx.moveTo(x, base - 19); ctx.lineTo(x, base - 12); ctx.moveTo(x, base + 8); ctx.lineTo(x, base + 15); ctx.stroke();
        if (lk) { ctx.globalAlpha = 0.18; ctx.fillStyle = '#ff3a3a'; ctx.beginPath(); ctx.ellipse(x, base - 2, 24, 15, 0, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
      }
      G.shadow(ctx, x, base - 1, Math.max(16, 62 - z / 4), 0.38);
      const k = this.pose(), white = this.flashOn();
      const cy = base - 14 - z - k.rear * 7 + k.bob, ax = x + k.sway;
      if (z > 0) { ctx.fillStyle = 'rgba(232,232,240,0.85)'; ctx.fillRect(ax - 0.25, -10, 0.5, cy - 30 + 10); }
      const eyeC = this.enrage > 0 || this.p2T > 0 ? '#ff2a2a' : '#ff4a5a', fade = this.dying ? G.clamp(1 - (this.dieT - 1.2) / 0.6, 0, 1) : 1;
      const o = { white, alpha: fade };
      // pernas: alvos no chão (passo alternado), recolhidas no fio, abertas na queda, erguidas na ameaça
      const FEET = [[26, 10], [37, 1], [37, -9], [27, -19]];
      const legsOf = (list) => { for (const i of list) for (const sd of [-1, 1]) {
        const hx = ax + sd * (8 - i * 0.6), hy = cy + 3 - i * 2.4;
        let fx = x + sd * FEET[i][0] * (1 + k.spread * 0.25), fy = base + FEET[i][1] * (1 + k.spread * 0.2) - (z > 0 && k.fold < 0.5 ? z : 0);
        const ph = this.walkPh + ((i + (sd > 0 ? 1 : 0)) % 2) * Math.PI;
        if (k.gait) { fy += Math.cos(ph) * 3 - Math.max(0, Math.sin(ph)) * 4; fx += sd * Math.max(0, Math.sin(ph)) * 1.5; }
        if (k.twitch) { fx += Math.sin(this.t * 31 + i * 2 + sd) * k.twitch; fy += Math.cos(this.t * 27 + i) * k.twitch; }
        if (k.rear && i < 2) { fx = G.lerp(fx, hx + sd * (14 + i * 6), k.rear); fy = G.lerp(fy, hy - 24 + i * 8 + Math.sin(this.t * 9 + i) * 2, k.rear); }
        if (k.fold) { fx = G.lerp(fx, hx + sd * (10 - i), k.fold); fy = G.lerp(fy, hy + 8 - i * 3, k.fold); }
        leg(ctx, 'spiderFemur', 'spiderTibia', 20, 24, hx, hy, fx, fy, o);
      } };
      legsOf([3, 2]);
      part(ctx, A.spiderAbdomen, ax + k.sway * 0.5, cy - 9 - k.rear * 3 + k.abd, 22, 17, k.lean * 0.6, Object.assign({ glow: A.spiderAbdomenGlow, glowA: 0.6 + 0.4 * Math.sin(this.t * 4), glowC: '#ffd84a' }, o));
      legsOf([1, 0]);
      part(ctx, A.spiderHead, ax, cy + 5, 14, 11, k.lean, Object.assign({ glow: A.spiderHeadGlow, glowA: k.eyes, glowC: eyeC }, o));
      // quelíceras abrem ao atacar
      for (const sd of [-1, 1]) {
        const fx = ax + sd * 4.5, fy = cy + 13;
        ctx.save(); ctx.translate(fx, fy); if (sd > 0) ctx.scale(-1, 1); part(ctx, A.spiderFang, 0, 0, 4.5, 2, -(0.1 + k.fang * 0.55), o); ctx.restore();
      }
      if (k.eyes > 0.1 && fade > 0) G.light.add(ax, cy + 4, 34, eyeC, 0.5 * k.eyes);
      this.drawStunStars(ctx, ax, cy - 22);
    }
    pose() {
      const s = this.st, t = this.t, k = { bob: 0, sway: 0, lean: 0, fold: 0, spread: 0, rear: 0, gait: 0, twitch: 0, fang: 0.15 + 0.1 * Math.sin(t * 7), eyes: 0.75 + 0.25 * Math.sin(t * 5), abd: Math.sin(t * 3) * 0.6 };
      if (this.dying) { const d = Math.min(1, this.dieT * 1.4); k.fold = d; k.bob = d * 6; k.eyes = Math.max(0, 1 - this.dieT * 2); k.twitch = d < 1 ? 1.5 : 0; return k; }
      if (s === 'intro') { const a = G.clamp(1 - this.stT / 1.2, 0, 1); k.fold = 1 - a; k.eyes = a; k.bob = (1 - a) * 4; return k; }
      if (this.p2T > 0) { k.rear = 1; k.fang = 1; k.eyes = 1.2; k.abd = Math.sin(t * 30) * 1.2; return k; }
      if (s === 'crawl') { k.gait = 1; k.bob = Math.abs(Math.sin(this.walkPh)) * -1; k.sway = Math.sin(this.walkPh * 0.5) * 1.2; k.lean = Math.sin(this.walkPh * 0.5) * 0.05; if (t - this.shotAt < 0.25) { k.fang = 1; k.abd = -2; } }
      else if (s === 'up') { k.fold = G.clamp(1 - this.stT / 0.8, 0, 1) * 0.9; k.lean = Math.sin(t * 6) * 0.05; }
      else if (s === 'hang') { k.fold = 0.9; k.lean = Math.sin(t * 2.2) * 0.14; k.sway = Math.sin(t * 2.2) * 3; k.fang = this.locked ? 1 : 0.4; k.eyes = this.locked ? 1.3 : 1; }
      else if (s === 'drop') { k.spread = 1; k.fang = 1; k.eyes = 1.2; }
      if (this.stun > 0 || s === 'stunned') {
        const land = G.clamp(1 - (t - this.landAt) / 0.35, 0, 1); // achata ao cair
        k.spread = land; k.bob = 3 + land * 3; k.twitch = 1.2; k.eyes = 0.25 + (Math.floor(t * 8) % 2) * 0.2; k.fang = 0.5;
      }
      if (this.enrage > 0) k.eyes = Math.max(k.eyes, 1.2);
      return k;
    }
  }

  // ovo da aranha: choca em filhotes se não for destruído
  class Egg extends G.Ent {
    constructor(x, y, boss) { super(x - 6, y - 4, 12, 8); this.boss = boss; this.hatch = 4.5; this.isEnemy = true; this.solid = false; }
    hurtbox() { return { x: this.x - 1, y: this.y - 8, w: this.w + 2, h: this.h + 8 }; }
    onHit() { this.dead = true; G.sfx('pot'); G.fx.burst(this.cx, this.cy - 4, ['#ffffff', '#e8e0d0', '#a8f0a0'], 12, 60); return true; }
    update(dt) {
      this.t += dt; this.hatch -= dt;
      if (this.hatch <= 0 || this.boss.dying) { this.dead = true; if (!this.boss.dying) { for (let i = 0; i < 2; i++) G.addEnt(G.makeEnemy('aranha', this.x + i * 8, this.y, { room: this.room })); G.sfx('pot'); G.fx.burst(this.cx, this.cy - 4, ['#ffffff', '#e8e0d0'], 10, 50); } }
    }
    draw(ctx, cam) {
      const x = this.cx - cam.x, y = this.y + this.h - cam.y, pul = this.hatch < 1.5 ? Math.sin(this.t * 30) * 1 : Math.sin(this.t * 4) * 0.4;
      G.shadow(ctx, x, y - 1, 10, 0.3);
      ctx.save(); ctx.fillStyle = '#1b1428'; ctx.beginPath(); ctx.ellipse(x, y - 6, 6.5 + pul, 7.5 - pul * 0.5, 0, 0, Math.PI * 2); ctx.fill();
      const g = ctx.createRadialGradient(x - 2, y - 9, 1, x, y - 6, 8); g.addColorStop(0, '#ffffff'); g.addColorStop(1, this.hatch < 1.5 ? '#c8f0b8' : '#d8d0c8');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y - 6, 5.5 + pul, 6.5 - pul * 0.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(x - 5, y - 8); ctx.lineTo(x + 5, y - 4); ctx.moveTo(x - 4, y - 3); ctx.lineTo(x + 4, y - 10); ctx.stroke();
      ctx.restore();
    }
  }

  // ------------------------------------------------------------------
  // 3) ESCORPIÃO DESVIO-PADRÃO — Ruínas da Dispersão
  // ------------------------------------------------------------------
  class Escorpiao extends Boss {
    constructor(x, y, arena) { super(x, y, 32, 14, { hp: 64, name: 'Escorpião Desvio-Padrão', topic: 'd3', dmg: 5, arena }); this.cnt = 0; this.sigma = 8; this.sigT = 0; this.face = 1; this.hasP2 = true; this.walkPh = 0; }
    // o corpo grande recebe golpes; o contato continua na base original
    hurtbox() { return { x: this.cx - 22, y: this.y + this.h - 26, w: 44, h: 26 }; }
    contactBox() { return { x: this.x, y: this.y - this.h, w: this.w, h: this.h * 2 }; }
    vulnerable(kind) { if (this.st === 'burrow' || this.st === 'emerge') return 0; if (this.stun > 0) return 1; return kind === 'bigbeam' || kind === 'beam' ? 0.8 : 0.4; }
    next() { this.st = 'stalk'; this.stT = G.rf(1.5, 2.5); }
    onStun() { this.st = 'stunned'; }
    ai(dt) {
      this.stT -= dt; this.sigT -= dt;
      const p = G.player;
      this.sigma = Math.round(6 + (1 - this.hp / this.maxHp) * 28);
      if (this.st === 'stalk') {
        const a = Math.atan2(p.cy - this.cy, p.cx - this.cx);
        G.moveEnt(this, Math.cos(a) * 34 * dt, Math.sin(a) * 34 * dt, { ghostEnts: true }); this.clampArena(2); this.walkPh += dt * 14;
        this.face = p.cx < this.cx ? -1 : 1;
        if (this.stT <= 0) {
          this.cnt++;
          this.st = this.p2 ? ['spread', 'aim', 'burrow'][this.cnt % 3] : (this.cnt % 2 ? 'spread' : 'aim');
          this.stT = this.st === 'burrow' ? 2.2 : 0.7;
          if (this.st === 'aim') { this.aimA = Math.atan2(p.cy - this.cy, p.cx - this.cx); G.sfx('tell'); }
          if (this.st === 'burrow') { this.noContact = true; G.sfx('crumble'); G.fx.smoke(this.cx, this.cy, 10, '#d8c090', 50); G.fx.burst(this.cx, this.cy, ['#c8a060', '#8a6a3a'], 14, 80, { grav: 200 }); }
        }
      } else if (this.st === 'burrow') {
        // monte de areia persegue o herói por baixo do chão
        const a = Math.atan2(p.cy - this.cy, p.cx - this.cx);
        if (this.stT > 0.6) { G.moveEnt(this, Math.cos(a) * 80 * dt, Math.sin(a) * 80 * dt, { ghostEnts: true }); this.clampArena(4); if (Math.random() < 0.6) G.fx.spawn({ x: this.cx + G.rf(-8, 8), y: this.cy, vy: -30, vx: G.rf(-20, 20), grav: 120, kind: 'puff', size: 2, color: '#d8c090', life: 0.4 }); }
        else if (!this.warned) { this.warned = true; this.warn(this.cx, this.cy, 26, 0.6); }
        if (this.stT <= 0) {
          this.warned = false; this.st = 'emerge'; this.stT = 0.3; this.noContact = false;
          G.sfx('explode'); G.shake(5, 0.4); G.fx.ring(this.cx, this.cy, 34, '#fff0c0', 0.35, 3); G.fx.burst(this.cx, this.cy, ['#c8a060', '#ffffff'], 20, 110, { grav: 200 });
          for (let i = 0; i < 10; i++) this.shot(this.cx, this.cy - 8, i * Math.PI / 5, 100, { spr: 'fireball', dmg: this.dmg - 1 });
          if (G.dist(p.cx, p.cy, this.cx, this.cy) < 26 && p.z < 6) G.hurtPlayer(this.dmg, this.cx, this.cy);
        }
      } else if (this.st === 'emerge') {
        if (this.stT <= 0) { this.st = 'stunned'; this.stun = 1.4; }
      } else if (this.st === 'spread') {
        if (this.stT <= 0) {
          const base = Math.atan2(p.cy - this.cy, p.cx - this.cx);
          for (let i = 0; i < 7; i++) {
            // ângulos com distribuição ~normal: soma de uniformes (Teorema do Limite Central!)
            const z = (Math.random() + Math.random() + Math.random() - 1.5) * 2;
            this.shot(this.cx, this.cy - 18, base + z * this.sigma * Math.PI / 180, 115, { spr: 'fireball', dmg: this.dmg - 1 });
          }
          this.sigT = 1.5; G.sfx('beam');
          this.st = 'rest'; this.stT = 0.6;
        }
      } else if (this.st === 'aim') {
        if (this.stT > 0.25) this.aimA = Math.atan2(p.cy - this.cy, p.cx - this.cx);
        if (this.stT <= 0) { const a = this.aimA; this.vx = Math.cos(a) * (this.p2 ? 240 : 210); this.vy = Math.sin(a) * (this.p2 ? 240 : 210); this.st = 'dash'; this.stT = 1.2; G.sfx('roar'); }
      } else if (this.st === 'dash') {
        const r = G.moveEnt(this, this.vx * dt, this.vy * dt, { ghostEnts: true }); this.walkPh += dt * 34;
        const a = this.arena;
        const hitWall = r.hitX || r.hitY || this.x <= a.x + 1 || this.x + this.w >= a.x + a.w - 1 || this.y <= a.y + 1 || this.y + this.h >= a.y + a.h - 1;
        this.clampArena(0);
        if (hitWall) { G.shake(5, 0.3); G.sfx('explode'); this.st = 'stunned'; this.stun = 2.0; }
        else if (this.stT <= 0) this.next();
      } else if (this.st === 'rest') { if (this.stT <= 0) this.next(); }
    }
    draw(ctx, cam) {
      const A = G.bossArt, x = this.cx - cam.x, base = this.y + this.h - cam.y, f = this.face;
      if (this.st === 'burrow') {
        // só o monte de areia aparece
        // ondas de areia em volta, monte que tremula e o ferrão espiando com veneno aceso
        ctx.save(); ctx.strokeStyle = '#f0dcb0'; ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) { const r = (this.t * 1.6 + i / 3) % 1; ctx.globalAlpha = (1 - r) * 0.4; ctx.beginPath(); ctx.ellipse(x, base - 3, 22 * (0.8 + r), 8 * (0.8 + r), 0, 0, Math.PI * 2); ctx.stroke(); }
        ctx.globalAlpha = 1; ctx.fillStyle = 'rgba(70,46,20,0.6)'; ctx.beginPath(); ctx.ellipse(x, base - 3, 24, 8.5, 0, 0, Math.PI * 2); ctx.fill();
        const g = ctx.createRadialGradient(x - 6, base - 10, 1, x, base - 4, 22); g.addColorStop(0, '#fbe8c0'); g.addColorStop(0.6, '#d8b070'); g.addColorStop(1, '#9a7230');
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, base - 4 + Math.sin(this.t * 20) * 0.6, 21, 8.5, 0, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#8a6428'; for (let i = 0; i < 6; i++) { const a = Math.PI + (i + 0.5) / 6 * Math.PI, rr = 0.55 + (i % 3) * 0.12; ctx.fillRect(x + Math.cos(a) * 21 * rr, base - 4 + Math.sin(a) * 8.5 * rr, 1.5, 1); }
        ctx.restore();
        part(ctx, G.bossArt.scSting, x - 2, base - 12 + Math.sin(this.t * 10) * 2, 5, 7, -1.25, { glow: G.bossArt.scStingGlow, glowA: 0.9, glowC: '#ffd84a' });
        G.light.add(x, base - 12, 22, '#ffd84a', 0.45);
        return;
      }
      if (this.st === 'aim' && this.aimA !== undefined) {
        ctx.save(); ctx.globalAlpha = 0.55 + 0.35 * Math.sin(this.t * 30); ctx.strokeStyle = '#ff3a3a'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.lineDashOffset = -this.t * 40;
        ctx.beginPath(); ctx.moveTo(x, base - 6); ctx.lineTo(x + Math.cos(this.aimA) * 300, base - 6 + Math.sin(this.aimA) * 300); ctx.stroke(); ctx.restore();
      }
      G.shadow(ctx, x, base - 1, 66, 0.38);
      const k = this.pose(), white = this.flashOn(), fade = this.dying ? G.clamp(1 - (this.dieT - 1.2) / 0.6, 0, 1) : 1, o = { white, alpha: fade };
      const eyeC = this.enrage > 0 || this.p2T > 0 ? '#ff2a2a' : '#ff5a3a';
      // tudo em coordenadas locais: origem no chão, virado para +x
      ctx.save(); ctx.translate(x, base + k.sink); ctx.scale(f, 1);
      const by = -11 + k.bob - k.rear * 5;
      const legs = far => { for (let i = 0; i < 4; i++) {
        const hx = -13 + i * 6.5, hy = by + (far ? -2 : 4);
        const ph = this.walkPh + ((i + (far ? 1 : 0)) % 2) * Math.PI;
        let fx = hx + (i - 1.5) * 4.5, fy = far ? -6 : 5;
        if (k.gait) { fx += Math.cos(ph) * 3; fy -= Math.max(0, Math.sin(ph)) * 3; }
        if (k.twitch) { fx += Math.sin(this.t * 29 + i * 3) * k.twitch; fy += Math.cos(this.t * 23 + i) * k.twitch * 0.6; }
        if (k.curl) { fx = G.lerp(fx, hx + 2, k.curl); fy = G.lerp(fy, hy + 3, k.curl); }
        leg(ctx, 'scLegA', 'scLegB', 8, 10, hx, hy, fx, fy, o);
      } };
      // pinça: braço em 2 segmentos e a pinça no punho (a de baixo é espelhada)
      const claw = (far) => {
        const s = far ? -1 : 1, sx = 22, sy = by + (far ? -3 : 5);
        const a1 = G.lerp(s * 0.95, s * 0.18, k.reach) + (k.rear ? -k.rear * (far ? 0.7 : 1.6) : 0), a2 = G.lerp(-s * 0.4, s * 0.04, k.reach) + (k.rear ? -k.rear * 0.8 : 0);
        const ex = sx + Math.cos(a1) * 10, ey = sy + Math.sin(a1) * 10, wx = ex + Math.cos(a2) * 8, wy = ey + Math.sin(a2) * 8;
        seg(ctx, 'scArmA', sx, sy, ex, ey, o); seg(ctx, 'scArmB', ex, ey, wx, wy, o);
        const img = A['scClaw' + (k.open ? 1 : 0)];
        ctx.save(); ctx.translate(wx, wy); ctx.rotate(a2 + (far ? -0.1 : 0.1)); if (!far) ctx.scale(1, -1);
        part(ctx, img, 0, 0, 2, 8.8, 0, o); ctx.restore();
      };
      legs(true); claw(true);
      part(ctx, A.scBody, -3, by, 20, 9, k.tilt, Object.assign({ glow: A.scBodyGlow, glowA: k.sig, glowC: '#ffd84a' }, o));
      part(ctx, A.scHead, 17, by + 1.5, 7, 7.5, k.tilt * 0.5, Object.assign({ glow: A.scHeadGlow, glowA: k.eyes, glowC: eyeC }, o));
      legs(false); claw(false);
      // cauda: corrente de gomos que se curva por cima do corpo até o ferrão
      let tx = -20, ty = by - 4, th = k.t0;
      const L = [8, 7.5, 7, 6.5, 6], S = ['scSegL', 'scSegL', 'scSegM', 'scSegM', 'scSegS'];
      for (let i = 0; i < 5; i++) {
        const img = A[S[i]]; part(ctx, img, tx, ty, G.lw(img) / 2, G.lh(img) / 2, th, o);
        tx += Math.cos(th) * L[i]; ty += Math.sin(th) * L[i]; th += k.curl2;
      }
      part(ctx, A.scSting, tx, ty, 5, 7, th - 0.2, Object.assign({ glow: A.scStingGlow, glowA: k.venom, glowC: '#ffd84a' }, o));
      const stingW = [x + tx * f, base + k.sink + ty];
      ctx.restore();
      if (k.venom > 0.4 && fade > 0) G.light.add(stingW[0], stingW[1], 26, '#ffd84a', k.venom * 0.6);
      if (k.eyes > 0.2) G.light.add(x + 22 * f, base + by, 24, eyeC, 0.35 * k.eyes);
      if (this.sigT > 0) G.puzTag(ctx, x, base - 58, 'σ = ' + this.sigma + '°', '#ffe27a');
      this.drawStunStars(ctx, x + 10 * f, base + by - 16);
    }
    pose() {
      const s = this.st, t = this.t, k = { bob: 0, sink: 0, tilt: 0, rear: 0, reach: 0, open: 0, t0: -2.25 + Math.sin(t * 2.5) * 0.08, curl2: 0.5 + Math.sin(t * 2.5 + 1) * 0.04, gait: 0, twitch: 0, curl: 0, eyes: 0.6 + 0.2 * Math.sin(t * 4), venom: 0.35 + 0.15 * Math.sin(t * 5), sig: this.sigT > 0 ? 0.9 : 0.3 };
      if (this.dying) { const d = Math.min(1, this.dieT * 1.3); k.curl = d; k.t0 = G.lerp(k.t0, -2.95, d); k.curl2 = G.lerp(0.5, 0.12, d); k.bob = d * 4; k.eyes = Math.max(0, 1 - this.dieT * 2); k.venom = 0; k.twitch = d < 1 ? 1.4 : 0; return k; }
      if (s === 'intro') { const a = G.clamp(1 - this.stT / 1.2, 0, 1); k.curl = 1 - a; k.t0 = G.lerp(-2.95, -2.25, a); k.curl2 = G.lerp(0.15, 0.5, a); k.eyes = a; k.bob = (1 - a) * 3; return k; }
      if (this.p2T > 0) { k.rear = 1; k.open = Math.floor(t * 14) % 2; k.t0 = -1.8 + Math.sin(t * 25) * 0.15; k.eyes = 1.2; k.venom = 1; k.sig = 1; return k; }
      if (this.stun > 0 || s === 'stunned') { k.t0 = -2.9; k.curl2 = 0.15 + Math.sin(t * 6) * 0.05; k.bob = 3; k.tilt = 0.08; k.twitch = 1; k.eyes = 0.2 + (Math.floor(t * 8) % 2) * 0.2; k.venom = 0.1; return k; }
      if (s === 'stalk') { k.gait = 1; k.bob = Math.abs(Math.sin(this.walkPh)) * -0.6; k.reach = 0.15; k.open = Math.sin(t * 3) > 0.7 ? 1 : 0; }
      else if (s === 'spread') { const a = G.clamp(1 - this.stT / 0.7, 0, 1); k.t0 = G.lerp(-2.25, -1.85, a); k.curl2 = 0.55; k.venom = 0.4 + a * 0.8 + Math.sin(t * 30) * 0.1 * a; k.open = 1; k.reach = 0.3; k.bob = a; }
      else if (s === 'rest') { k.t0 = -1.7; k.curl2 = 0.62; k.venom = 0.6; }
      else if (s === 'aim') { const a = G.clamp(1 - this.stT / 0.7, 0, 1); k.reach = a; k.open = Math.floor(t * 12) % 2; k.bob = 2 * a; k.t0 = -2.55; k.curl2 = 0.48; k.eyes = 1.1; k.tilt = 0.06 * a; }
      else if (s === 'dash') { k.gait = 1; k.reach = 1; k.open = 0; k.t0 = -2.75; k.curl2 = 0.3; k.bob = 2; k.eyes = 1.2; }
      else if (s === 'emerge') { k.sink = G.clamp(this.stT / 0.3, 0, 1) * 10; k.open = 1; k.reach = 0.5; k.t0 = -1.9; }
      if (this.enrage > 0) k.eyes = Math.max(k.eyes, 1.2);
      return k;
    }
  }

  // ------------------------------------------------------------------
  // 4) DRAGÃO DOS DADOS — Abismo do Acaso
  // ------------------------------------------------------------------
  const DRAGON_ATK = { 1: 'BOLAS DE FOGO', 2: 'BOLAS DE FOGO', 3: 'CHUVA DE FOGO', 4: 'CHUVA DE FOGO', 5: 'LACAIOS', 6: 'SOPRO' };
  // fase 2: soma de dois dados (2 a 12) — o 7 é o mais provável!
  const DRAGON_SUM = s => s <= 3 ? 'METEOROS' : s <= 6 ? 'BOLAS DE FOGO' : s === 7 ? 'SOPRO' : s <= 10 ? 'CHUVA DE FOGO' : 'LACAIOS';
  const SUM_WAYS = s => 6 - Math.abs(s - 7);
  class Dragao extends Boss {
    constructor(x, y, arena) {
      super(x, y, 40, 16, { hp: 80, name: 'Dragão dos Dados', topic: 'd4', dmg: 5, arena });
      this.homeY = y; this.die = 1; this.die2 = 1; this.rollT = 0; this.low = 0; this.vol = 0; this.cnt = 0; this.hasP2 = true;
    }
    hurtbox() { return { x: this.x, y: this.y - 26 + this.low * 30, w: this.w, h: 40 }; }
    contactBox() { return { x: this.x + 6, y: this.y - 10 + this.low * 30, w: this.w - 12, h: 20 }; }
    vulnerable(kind) { if (this.low > 0.7) return 1; return (kind === 'beam' || kind === 'bigbeam') ? 0.6 : 0; }
    next() { this.st = 'roll'; this.stT = 1.3; this.rollT = 0; G.sfx('dice'); }
    atkKind() { return this.p2 ? DRAGON_SUM(this.die + this.die2) : DRAGON_ATK[this.die]; }
    onStun() { this.st = 'tired'; this.stT = 2.5; }
    ai(dt) {
      this.stT -= dt;
      const p = G.player, a = this.arena;
      if (this.st !== 'tired') { this.low = G.approach(this.low, 0, dt * 2); this.x += Math.sin(this.t * 0.8) * 40 * dt; this.x = G.clamp(this.x, a.x + 20, a.x + a.w - this.w - 20); }
      if (this.st === 'roll') {
        this.rollT += dt; if (Math.floor(this.rollT * 12) !== Math.floor((this.rollT - dt) * 12)) { this.die = G.ri(1, 6); this.die2 = G.ri(1, 6); }
        if (this.stT <= 0) { this.st = 'show'; this.stT = 0.9; G.sfx('confirm'); }
      } else if (this.st === 'show') {
        if (this.stT <= 0) { this.st = 'atk'; this.stT = this.atkKind() === 'SOPRO' ? 2.2 : 1.6; this.vol = 0; this.cnt = 0; }
      } else if (this.st === 'atk') {
        const kind = this.atkKind();
        this.vol -= dt;
        if (kind === 'BOLAS DE FOGO' && this.vol <= 0) {
          this.vol = 0.45;
          const b = Math.atan2(p.cy - (this.y + 4), p.cx - this.cx);
          for (let i = -1; i <= 1; i++) this.shot(this.cx, this.y + 4, b + i * 0.25, 120);
          G.sfx('burn');
        } else if (kind === 'CHUVA DE FOGO' && this.vol <= 0) {
          this.vol = 0.18;
          const tx = G.rf(a.x + 10, a.x + a.w - 10), ty = G.rf(a.y + 70, a.y + a.h - 8);
          G.dropRock(this, tx, ty, { spr: 'fireball', size: 10, r: 11, cols: ['#ffd040', '#ff7a1a', '#ffffff'] });
        } else if (kind === 'METEOROS' && this.vol <= 0 && this.cnt < 5) {
          this.vol = 0.3; this.cnt++;
          G.dropRock(this, G.clamp(p.cx + G.rf(-30, 30), a.x + 12, a.x + a.w - 12), G.clamp(p.cy + G.rf(-20, 20), a.y + 60, a.y + a.h - 10), { r: 18, size: 14, dmg: this.dmg + 1 });
        } else if (kind === 'LACAIOS' && this.cnt === 0) {
          this.cnt = 1;
          for (let i = 0; i < 2; i++) G.addEnt(G.makeEnemy('chama', a.x + 60 + i * (a.w - 140), a.y + 100, { room: this.room }));
          G.sfx('roar');
        } else if (kind === 'SOPRO' && this.vol <= 0) {
          this.vol = 0.07;
          const sweep = Math.PI / 2 + Math.sin((1 - this.stT / 2.2) * Math.PI * 2) * 1.0;
          this.shot(this.cx, this.y + 6, sweep, 150, { size: 8 });
        }
        if (this.stT <= 0) { this.st = 'tired'; this.stT = 2.4; G.sfx('land'); }
      } else if (this.st === 'tired') {
        this.low = G.approach(this.low, 1, dt * 3);
        if (this.stT <= 0) this.next();
      }
    }
    pose() {
      const s = this.st, t = this.t, k = { hx: Math.sin(t * 1.3) * 3, hy: Math.sin(t * 2) * 1.5, hr: Math.sin(t * 1.3) * 0.05, bx: Math.sin(t * 0.9) * 5, jaw: 0, eyes: 0.8 + 0.2 * Math.sin(t * 5), pips: 0.15, wing: Math.sin(t * 2.4) * 0.12, sink: 0 };
      if (this.dying) { const d = G.clamp((this.dieT - 0.3) / 1.3, 0, 1); k.sink = d * d; k.jaw = 0.6; k.eyes = Math.max(0, 1 - this.dieT); k.wing = 0.4 * d; k.hx += Math.sin(t * 40) * 1.5 * (1 - d); return k; }
      if (s === 'intro') { const a = G.clamp(1 - this.stT / 1.2, 0, 1); k.sink = (1 - a) * (1 - a); k.eyes = a; k.wing = 0.5 * (1 - a) - 0.3 * a; return k; }
      if (this.p2T > 0) { k.jaw = 1; k.hy = -4; k.wing = -0.35 + Math.sin(t * 30) * 0.05; k.eyes = 1.3; k.hx += Math.sin(t * 40); k.pips = 1; return k; }
      if (s === 'roll') { k.pips = 0.5 + 0.5 * Math.abs(Math.sin(t * 12)); k.hr = Math.sin(t * 9) * 0.1; k.hy += Math.sin(t * 18); }
      else if (s === 'show') { k.hy = -3; k.jaw = 0.35; k.wing = -0.25; k.pips = 1; k.eyes = 1.1; }
      else if (s === 'atk') {
        k.jaw = 1; k.wing = -0.2 + Math.sin(t * 6) * 0.06; k.eyes = 1.1;
        if (this.atkKind() === 'SOPRO') { const sw = Math.sin((1 - this.stT / 2.2) * Math.PI * 2); k.hx = -sw * 7; k.hr = sw * 0.15; } // a cabeça acompanha o jato
      } else if (s === 'tired') { k.jaw = 0.25; k.eyes = 0.35; k.wing = 0.35; k.hy = 2 + Math.sin(t * 1.5); k.hr = 0.06; }
      if (this.stun > 0) k.eyes = 0.25 + (Math.floor(t * 8) % 2) * 0.2;
      if (this.enrage > 0) k.eyes = Math.max(k.eyes, 1.2);
      return k;
    }
    update(dt) {
      super.update(dt);
      const k = this.pose(), hx = this.cx + k.hx, hY = this.y + this.low * 30 - 6 + k.hy;
      if (k.jaw > 0.6 && Math.random() < 0.6) G.fx.spawn({ x: hx + G.rf(-6, 6), y: hY + 18, vy: 25, vx: G.rf(-12, 12), life: 0.4, color: G.pick(['#ffd040', '#ff7a1a']), size: 1 });
      if (this.st === 'tired' && Math.random() < dt * 3) for (const s of [-1, 1]) G.fx.spawn({ x: hx + s * 3, y: hY + 10, vy: -14, vx: s * 4, kind: 'puff', size: 2, color: '#8a7a7a', life: 0.8, drag: 1 });
      if (!this.dying && Math.random() < dt * 2.5) G.fx.ring(this.cx + k.bx + G.rf(-4, 4), this.y + this.low * 30 + 38, 16, '#ffb050', 0.6, 1); // ondas na lava
    }
    draw(ctx, cam) {
      const A = G.bossArt, x = this.cx - cam.x, hy = this.y - cam.y + this.low * 30;
      const k = this.pose(), o = { white: this.flashOn() };
      const ec = this.enrage > 0 || this.p2T > 0 ? '#ff3a3a' : '#ffe24a';
      // ao surgir e ao morrer, o corpo passa pela superfície da lava (recortado)
      const lavaY = hy + 40, oy = k.sink * 64;
      ctx.save();
      if (k.sink > 0) { ctx.beginPath(); ctx.rect(-50, -50, G.W + 100, lavaY + 50); ctx.clip(); }
      for (const s of [-1, 1]) { ctx.save(); ctx.translate(x + s * 9, hy + 22 + oy); ctx.scale(s, 1); part(ctx, A.dragonWing, 0, 0, 2, 31, k.wing, o); ctx.restore(); }
      // pescoço: 7 gomos da lava até a cabeça; as faces do dado (1 a 6) sobem pelo pescoço
      const hx = x + k.hx, hY = hy - 6 + k.hy + oy;
      for (let i = 0; i < 7; i++) {
        const u = i / 6, px = G.lerp(x + k.bx, hx, u) + Math.sin(u * Math.PI * 1.6 + this.t * 2) * 4 * (1 - u * 0.6), py = G.lerp(hy + 36 + oy, hY + 12, u);
        const nm = 'dragonNeck' + (i < 4 ? 'L' : 'S') + (i % 6 + 1), img = A[nm];
        part(ctx, img, px, py, G.lw(img) / 2, G.lh(img) / 2, Math.sin(u * 3 + this.t * 2) * 0.08, Object.assign({ glow: A[nm + 'Glow'], glowA: k.pips, glowC: '#ffe27a' }, o));
      }
      // boca: brasa atrás da mandíbula, que desce ao abrir
      if (k.jaw > 0.1) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, hx, hY + 12 + k.jaw * 3, 10 + k.jaw * 6 + Math.sin(this.t * 20) * 2, '#ff7a1a', 0.5 + k.jaw * 0.4); ctx.restore(); }
      part(ctx, A.dragonJaw, hx, hY + 11 + k.jaw * 7, 16, 3, k.hr, o);
      part(ctx, A.dragonHead, hx, hY, 22, 17, k.hr, Object.assign({ glow: A.dragonHeadGlow, glowA: k.eyes, glowC: ec }, o));
      // olhos de réptil: amarelos com pupila em fenda (fecham quando cansado)
      if (k.eyes > 0.05) {
        ctx.save(); ctx.translate(hx, hY); ctx.rotate(k.hr);
        const op = this.st === 'tired' ? 0.45 : 1;
        for (const s of [-1, 1]) {
          ctx.fillStyle = '#1a0404'; ctx.beginPath(); ctx.ellipse(s * 7.5, 0, 3.4, 2.4 * op, s * 0.25, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = o.white ? '#ffffff' : ec; ctx.beginPath(); ctx.ellipse(s * 7.5, 0, 2.5, 1.7 * op, s * 0.25, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#1a0404'; ctx.fillRect(s * 7.5 - 0.4, -1.5 * op, 0.8, 3 * op);
          ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, s * 7.5, 0, 5, ec, 0.5 * Math.min(1, k.eyes)); ctx.globalCompositeOperation = 'source-over';
        }
        ctx.restore();
      }
      ctx.restore();
      if (k.sink < 0.9) { G.light.add(hx, hY, 70, '#ff7a3a', 0.8, 0.25); if (k.eyes > 0.3) G.light.add(hx, hY, 30, ec, 0.4 * Math.min(1, k.eyes)); }
      // painel do dado
      const a = this.arena, px = a.x + 6 - cam.x, py = a.y + 6 - cam.y;
      const pw = this.p2 ? 168 : 128, ph = this.p2 ? 52 : 46;
      G.panel(ctx, px, py, pw, ph, { r: 3, thin: true, corners: false, bgTop: '#3a1a1a', bg: '#1a0a0a', border: this.p2 ? '#ff5a3a' : '#ff9a4a' });
      if (this.p2) {
        G.text('SOMA DE 2 DADOS', px + pw / 2, py + 25, '#ff9a6a', { align: 'center', shadow: false });
        G.text('2-3 Meteoro 4-6 Bolas  7 Sopro', px + 5, py + 34, '#e8c8b8', { shadow: false });
        G.text('8-10 Chuva  11-12 Lacaios', px + 5, py + 43, '#e8c8b8', { shadow: false });
      } else {
        G.text('1-2 Bolas   3-4 Chuva', px + 28, py + 26, '#e8c8b8', { shadow: false });
        G.text('5 Lacaios   6 Sopro', px + 28, py + 36, '#e8c8b8', { shadow: false });
      }
      if (this.st === 'roll' || this.st === 'show' || this.st === 'atk') {
        const drawDie = (dx, dy, v) => {
          ctx.save(); ctx.fillStyle = '#1b1428'; G.rrPath(ctx, dx - 1, dy - 1, 20, 20, 4); ctx.fill(); ctx.fillStyle = '#f8f4fc'; G.rrPath(ctx, dx, dy, 18, 18, 3.5); ctx.fill(); ctx.restore();
          const pips = { 1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [2, 0], [0, 2], [2, 2]], 5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]] }[v];
          for (const [aa, bb] of pips) { ctx.fillStyle = '#c03a2a'; ctx.beginPath(); ctx.arc(dx + 4.5 + aa * 4.5, dy + 4.5 + bb * 4.5, 1.6, 0, Math.PI * 2); ctx.fill(); }
        };
        const jig = this.st === 'roll' ? Math.sin(this.rollT * 20) * 2 : 0;
        drawDie(px + 5, py + 4 + jig, this.die);
        if (this.p2) drawDie(px + 27, py + 4 - jig, this.die2);
        const tx = px + (this.p2 ? 50 : 28);
        if (this.st !== 'roll') {
          const k = this.atkKind();
          if (this.p2) {
            const S = this.die + this.die2;
            G.text('S = ' + S + '  ' + k, tx, py + 4, '#ffe27a'); G.text('P(' + S + ') = ' + SUM_WAYS(S) + '/36', tx, py + 13, '#7aff8a');
          } else {
            const p1 = { 'BOLAS DE FOGO': '2/6', 'CHUVA DE FOGO': '2/6', 'LACAIOS': '1/6', 'SOPRO': '1/6' }[k];
            G.text(k, tx, py + 5, '#ffe27a'); G.text('P = ' + p1, tx, py + 14, '#7aff8a');
          }
        } else G.text('rolando...', tx, py + 9, '#ffffff');
      }
      if (this.st === 'tired') G.puzTag(ctx, x, hy + 14, 'cansado!', '#7aff8a');
    }
  }

  // ------------------------------------------------------------------
  // 5) YETI GAUSSIANO — Torre das Distribuições
  // ------------------------------------------------------------------
  class Yeti extends Boss {
    constructor(x, y, arena) { super(x, y, 30, 16, { hp: 96, name: 'Yeti Gaussiano', topic: 'd5', dmg: 6, arena }); this.cnt = 0; this.piles = {}; this.z = 0; this.face = 1; this.hasP2 = true; this.walkPh = 0; }
    // corpo grande recebe golpes; o contato continua na base original
    hurtbox() { return { x: this.cx - 20, y: this.y + this.h - 52 - (this.z || 0), w: 40, h: 52 }; }
    contactBox() { return { x: this.x, y: this.y - this.h, w: this.w, h: this.h * 2 }; }
    vulnerable(kind) { if (this.z > 8) return 0; return this.stun > 0 ? 1 : 0.4; }
    next() { this.st = 'walk'; this.stT = G.rf(1.2, 2); }
    onStun() { this.st = 'stunned'; this.z = 0; }
    ai(dt) {
      this.stT -= dt;
      const p = G.player, a = this.arena;
      this.face = p.cx < this.cx ? -1 : 1;
      if (this.st === 'walk') {
        const ang = Math.atan2(p.cy - this.cy, p.cx - this.cx);
        G.moveEnt(this, Math.cos(ang) * 30 * dt, Math.sin(ang) * 30 * dt, { ghostEnts: true }); this.clampArena(2); this.walkPh = (this.walkPh || 0) + dt * 8;
        if (this.stT <= 0) { this.cnt++; this.st = ['storm', 'leap', 'charge'][this.cnt % 3]; this.stT = this.st === 'storm' ? 2.2 : 0.6; this.vol = 0; this.tgt = { x: p.cx, y: p.cy }; if (this.st === 'storm') G.sfx('roar'); }
      } else if (this.st === 'storm') {
        this.vol -= dt;
        if (this.vol <= 0) {
          this.vol = 0.1;
          // posição ~ Normal(μ = herói, σ = 36px) (Box-Muller)
          const u = Math.max(1e-6, Math.random()), v = Math.random();
          const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
          const tx = G.clamp(this.tgt.x + z * 36, a.x + 8, a.x + a.w - 8), ty = G.clamp(this.tgt.y + G.rf(-10, 10), a.y + 10, a.y + a.h - 8);
          if (this.p2) this.warn(tx, ty, 9, 0.75, { color: '#7ad8ff' });
          const e = G.addEnt(new G.EShot(tx, ty, 0, 0, { spr: 'snowball', dmg: this.dmg - 2, z: 130, vz: -80, life: 4, size: 10, pierce: true, onLand: s => {
            G.fx.burst(s.cx, s.cy, ['#ffffff', '#c8e0f0'], 6, 40);
            const col = Math.floor((s.cx - a.x) / 16); this.piles[col] = (this.piles[col] || 0) + 1;
            const pl = G.player; if (pl && G.dist(pl.cx, pl.cy, s.cx, s.cy) < 13 && pl.z < 6) G.hurtPlayer(this.dmg - 2, s.cx, s.cy);
          } }));
          e.room = this.room;
        }
        if (this.stT <= 0) this.next();
      } else if (this.st === 'leap') {
        if (!this.leap) { this.leap = { sx: this.x, sy: this.y, tx: G.clamp(p.cx - this.w / 2, a.x + 2, a.x + a.w - this.w - 2), ty: G.clamp(p.cy - this.h / 2, a.y + 2, a.y + a.h - this.h - 2), t: 0 }; G.sfx('jump'); this.warn(this.leap.tx + this.w / 2, this.leap.ty + this.h / 2, 30, 1.0); }
        const L = this.leap; L.t += dt / 1.0;
        const k = Math.min(1, L.t);
        this.x = G.lerp(L.sx, L.tx, k); this.y = G.lerp(L.sy, L.ty, k); this.z = Math.sin(k * Math.PI) * 70;
        this.noContact = this.z > 8;
        if (k >= 1) { this.leap = null; this.z = 0; this.noContact = false; G.sfx('explode'); G.shake(6, 0.4); G.fx.burst(this.cx, this.cy, ['#ffffff', '#c8e0f0'], 20, 100); for (let i = 0; i < 8; i++) this.shot(this.cx, this.cy, i * Math.PI / 4, 90, { spr: 'snowball', dmg: this.dmg - 2 }); this.st = 'stunned'; this.stun = 1.2; }
      } else if (this.st === 'charge') {
        if (!this.ch) { if (!this.chT) { this.chT = 0.45; this.chA = Math.atan2(p.cy - this.cy, p.cx - this.cx); G.sfx('tell'); } this.chT -= dt; if (this.chT > 0) { this.chA = Math.atan2(p.cy - this.cy, p.cx - this.cx); return; } this.chT = 0; this.ch = { vx: Math.cos(this.chA) * 200, vy: Math.sin(this.chA) * 200 }; G.sfx('roar'); }
        const r = G.moveEnt(this, this.ch.vx * dt, this.ch.vy * dt, { ghostEnts: true });
        const hit = r.hitX || r.hitY || this.x <= a.x + 1 || this.x + this.w >= a.x + a.w - 1 || this.y <= a.y + 1 || this.y + this.h >= a.y + a.h - 1;
        this.clampArena(0);
        if (Math.random() < 0.7) G.fx.spawn({ x: this.cx + G.rf(-8, 8), y: this.y + this.h, vy: -20, vx: G.rf(-15, 15), kind: 'puff', size: 3, color: '#e8f4ff', life: 0.4, drag: 2 });
        if (hit) {
          G.shake(6, 0.4); G.sfx('explode'); G.fx.burst(this.cx, this.cy, ['#ffffff', '#c8e0f0'], 14, 90);
          // fase 2: ricocheteia nas paredes, soltando bolas de neve
          if (this.p2 && (this.ch.b || 0) < 2) {
            this.ch.b = (this.ch.b || 0) + 1;
            for (let i = 0; i < 6; i++) this.shot(this.cx, this.cy - 6, i * Math.PI / 3, 90, { spr: 'snowball', dmg: this.dmg - 2 });
            const ang = Math.atan2(p.cy - this.cy, p.cx - this.cx); this.ch.vx = Math.cos(ang) * 210; this.ch.vy = Math.sin(ang) * 210;
            G.moveEnt(this, this.ch.vx * 0.05, this.ch.vy * 0.05, { ghostEnts: true }); this.clampArena(2);
          } else { this.ch = null; this.st = 'stunned'; this.stun = 2.2; }
        }
      }
    }
    draw(ctx, cam) {
      const A = G.bossArt, a = this.arena;
      // montes de neve formando um histograma (curva normal)
      for (const col in this.piles) {
        const h = Math.min(32, this.piles[col] * 3), px = a.x + col * 16 - cam.x, py = a.y + a.h - cam.y;
        ctx.save(); const g = ctx.createLinearGradient(0, py - h, 0, py); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(184,208,232,0.8)');
        ctx.fillStyle = g; G.rrPath(ctx, px + 1, py - h, 14, h, 4); ctx.fill(); ctx.restore();
      }
      const x = this.cx - cam.x, base = this.y + this.h - cam.y, z = this.z || 0;
      if (this.st === 'charge' && !this.ch && this.chA !== undefined) {
        ctx.save(); ctx.globalAlpha = 0.55 + 0.35 * Math.sin(this.t * 30); ctx.strokeStyle = '#7ad8ff'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.lineDashOffset = -this.t * 40;
        ctx.beginPath(); ctx.moveTo(x, base - 6); ctx.lineTo(x + Math.cos(this.chA) * 300, base - 6 + Math.sin(this.chA) * 300); ctx.stroke(); ctx.restore();
      }
      G.shadow(ctx, x, base - 1, 58 - z / 5, 0.38);
      const k = this.pose(), white = this.flashOn(), fade = this.dying ? G.clamp(1 - (this.dieT - 1.2) / 0.6, 0, 1) : 1, o = { white, alpha: fade };
      const f = this.face, ec = this.enrage > 0 || this.p2T > 0 ? '#ff3a3a' : '#fff4a0';
      const bx = x + (k.jit ? Math.sin(this.t * 61) * k.jit : 0), by = base - z + k.bob, hip = [bx, by - 2 + k.crouch];
      for (const s of [-1, 1]) part(ctx, A.yetiFoot, bx + s * 12, by + 1 - (s < 0 ? k.liftL : k.liftR), 8, 9, 0, o);
      part(ctx, A.yetiBody, hip[0], hip[1], 26, 45, k.lean, Object.assign({ glow: A.yetiBodyGlow, glowA: k.glow, glowC: '#7ad8ff' }, o));
      // cabeça no topo do sino, virada para o herói
      const nk = rot(0, -38, k.lean), hx = hip[0] + nk[0] + f * 1.5 + k.hx, hy = hip[1] + nk[1] + k.hy, hr = k.lean + k.hr;
      part(ctx, A['yetiHead' + (k.roar ? 1 : 0)], hx, hy, 15, 22, hr, o);
      if (k.eyes > 0.05) {
        ctx.save(); ctx.translate(hx, hy); ctx.rotate(hr); ctx.globalAlpha *= fade;
        for (const s of [-1, 1]) { const ex = s * 4.5 + f * 0.6 - 1, ey = -6.5; ctx.fillStyle = '#10142a'; ctx.fillRect(ex - 0.5, ey - 0.5, 3, 2.5); ctx.fillStyle = white ? '#ffffff' : ec; ctx.fillRect(ex, ey, 2, this.stun > 0 ? 0.5 : 1.5); ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, ex + 1, ey + 0.7, 4, ec, 0.6 * Math.min(1, k.eyes)); ctx.globalCompositeOperation = 'source-over'; }
        ctx.restore();
      }
      // braços: ombro e antebraço (o direito espelhado: "para fora" é o ângulo negativo)
      for (const s of [-1, 1]) {
        const a1 = s < 0 ? k.aL : -k.aR, a2 = s < 0 ? k.bL : -k.bR, sh = rot(s * 16, -24, k.lean), sx = hip[0] + sh[0], sy = hip[1] + sh[1];
        const ex = sx - Math.sin(k.lean + a1) * 13, ey = sy + Math.cos(k.lean + a1) * 13;
        part(ctx, A.yetiFore, ex, ey, 9, 3, k.lean + a1 + a2, o);
        part(ctx, A.yetiArm, sx, sy, 8, 5, k.lean + a1, o);
      }
      if (this.enrage > 0) G.light.add(hx, hy - 6, 22, '#ff3a3a', 0.5);
      this.drawStunStars(ctx, hx, hy - 24);
    }
    pose() {
      const s = this.st, t = this.t, k = { bob: 0, crouch: 0, lean: 0, jit: 0, hx: 0, hy: 0, hr: 0, roar: 0, aL: 0.18, aR: 0.18, bL: -0.25, bR: -0.25, liftL: 0, liftR: 0, glow: 0.3 + 0.15 * Math.sin(t * 3), eyes: 1 };
      if (this.dying) { const d = Math.min(1, this.dieT * 1.2); k.crouch = d * 9; k.lean = d * 0.22; k.roar = this.dieT < 0.6 ? 1 : 0; k.eyes = Math.max(0, 1 - this.dieT * 1.5); k.glow = 0; k.aL = k.aR = 0.6 * (1 - d); k.jit = d < 1 ? 1.2 : 0; return k; }
      if (s === 'intro') { const a = G.clamp(1 - this.stT / 1.2, 0, 1); k.crouch = (1 - a) * 8; k.eyes = a; k.roar = a > 0.7 ? 1 : 0; k.aL = k.aR = 0.18 + (a > 0.7 ? 1.2 : 0); return k; }
      if (this.p2T > 0) { k.roar = 1; k.aL = k.aR = 1.9; k.bL = k.bR = -0.6; k.jit = 1; k.glow = 1; k.hy = -2; return k; }
      if (this.stun > 0 || s === 'stunned') { k.hr = Math.sin(t * 3) * 0.16; k.hx = Math.sin(t * 3) * 1.5; k.aL = k.aR = 0.04; k.bL = k.bR = 0.1; k.crouch = 3; k.eyes = 0.3; return k; }
      if (s === 'walk') { const w = Math.sin(this.walkPh); k.liftL = Math.max(0, w) * 4; k.liftR = Math.max(0, -w) * 4; k.bob = -Math.abs(w) * 1.5; k.lean = w * 0.05; k.aL = 0.18 + w * 0.25; k.aR = 0.18 - w * 0.25; }
      else if (s === 'storm') { const v = Math.sin(t * 14); k.aL = 2.45 + v * 0.35; k.aR = 2.45 - v * 0.35; k.bL = k.bR = -0.35; k.roar = 1; k.hy = -1; k.bob = Math.abs(v) * 1.5; k.glow = 0.85; }
      else if (s === 'leap') { const L = this.leap, p = L ? L.t : 0; if (p < 0.12) { k.crouch = 6; k.aL = k.aR = -0.3; } else { k.crouch = -2; k.aL = k.aR = 1.7; k.bL = k.bR = -0.9; k.liftL = k.liftR = 3; k.roar = 1; } }
      else if (s === 'charge') {
        if (!this.ch) { k.crouch = 5; k.aL = k.aR = 0.65; k.bL = k.bR = -1.3; k.eyes = 1.3; k.roar = 1; k.jit = 0.4; }
        else { const r = Math.sin(t * 20); k.bob = -Math.abs(r) * 2; k.liftL = Math.max(0, r) * 4; k.liftR = Math.max(0, -r) * 4; k.aL = k.aR = 1.0; k.bL = k.bR = -0.6; k.roar = 1; k.lean = r * 0.06; }
      }
      if (this.enrage > 0) k.eyes = Math.max(k.eyes, 1.2);
      return k;
    }
  }

  // ------------------------------------------------------------------
  // 6) VIÉS, O DISTORCEDOR — Castelo
  // ------------------------------------------------------------------
  class Vies extends Boss {
    constructor(x, y, arena) {
      super(x, y, 16, 10, { hp: 150, name: 'Viés, o Distorcedor', topic: 'd6', dmg: 6, arena, thr: [0.75, 0.5, 0.25], xp: 200 });
      this.clones = []; this.cnt = 0; this.phase2 = false; this.float = 0;
    }
    hurtbox() { return { x: this.x - 2, y: this.y - 24, w: this.w + 4, h: 32 }; }
    vulnerable(kind) { if (this.st === 'tele') return 0; return this.stun > 0 ? 1 : 0.6; }
    next() { this.st = 'cast'; this.stT = G.rf(1.2, 1.8); }
    onStun() { this.st = 'stunned'; this.clearClones(); }
    clearClones() { for (const c of this.clones) { c.dead = true; G.fx.burst(c.cx, c.cy - 10, ['#c070ff', '#ffffff'], 10, 50); } this.clones = []; }
    teleport() {
      const a = this.arena;
      const pts = [[a.x + 60, a.y + 40], [a.x + a.w - 76, a.y + 40], [a.x + 60, a.y + a.h - 50], [a.x + a.w - 76, a.y + a.h - 50], [a.x + a.w / 2 - 8, a.y + 36]];
      const [nx, ny] = G.pick(pts);
      G.fx.burst(this.cx, this.cy - 10, ['#c070ff', '#ffffff'], 14, 60);
      this.x = nx; this.y = ny; G.sfx('teleport');
    }
    ai(dt) {
      this.stT -= dt; this.float += dt;
      const p = G.player, a = this.arena;
      if (!this.phase2 && this.hp <= this.maxHp * 0.5) { this.phase2 = true; G.sfx('roar'); G.ui.toast('Viés revela sua verdadeira forma!', '#ff6aa0'); G.music('finalboss_furia'); if (G.viesPhase2) G.viesPhase2(this); }
      if (this.st === 'cast') {
        if (this.stT <= 0) {
          this.cnt++;
          const pat = this.phase2 ? ['ring', 'bias', 'homing', 'clones', 'bias', 'summon'][this.cnt % 6] : ['homing', 'clones', 'homing', 'bias', 'summon'][this.cnt % 5];
          this.st = pat; this.stT = 1.2; this.vol = 0; this.k = 0;
          if (pat === 'clones') {
            this.clearClones();
            const pts = [[a.x + 60, a.y + 50], [a.x + a.w - 76, a.y + 50], [a.x + 60, a.y + a.h - 50], [a.x + a.w - 76, a.y + a.h - 50]];
            G.shuffle(pts);
            this.x = pts[0][0]; this.y = pts[0][1];
            for (let i = 1; i < 4; i++) { const c = G.addEnt(new ViesClone(pts[i][0], pts[i][1], this)); c.room = this.room; this.clones.push(c); }
            G.sfx('teleport');
            G.ui.toast('Qual é o verdadeiro? O real projeta SOMBRA...', '#c8c8ff');
            this.stT = 4;
          }
          if (pat === 'bias') {
            // amostra enviesada: quase todas as células do lado do herói explodem
            const cw = a.w / 4, ch = a.h / 2, pc = Math.floor((p.cx - a.x) / cw), cells = [];
            for (let cy = 0; cy < 2; cy++) for (let cx = 0; cx < 4; cx++) cells.push({ cx, cy, w: Math.abs(cx - pc) });
            cells.sort((u, v) => v.w - u.w);
            const safe = new Set([cells[0], cells[1]].map(c => c.cx + ',' + c.cy));
            for (const c of cells) {
              const isSafe = safe.has(c.cx + ',' + c.cy), rx = a.x + c.cx * cw, ry = a.y + c.cy * ch;
              const wr = G.addEnt(new WarnRect(rx, ry, cw, ch, 1.3, { safe: isSafe, onDone: isSafe ? null : (w) => {
                for (let i = 0; i < 3; i++) G.fx.burst(w.x + G.rf(8, w.w - 8), w.y + G.rf(8, w.h - 8), ['#c070ff', '#ffffff', '#ff3a8a'], 8, 80);
                G.fx.ring(w.cx, w.cy, 30, '#ff8ad8', 0.3, 2);
                const pl = G.player; if (pl && G.overlap(pl, w) && pl.z < 6) G.hurtPlayer(this.dmg, w.cx, w.cy);
              } }));
              wr.room = this.room;
            }
            G.sfx('roar'); G.ui.toast('AMOSTRA ENVIESADA! Corra para as células SEGURAS.', '#ff9ae6');
            this.stT = 1.6; G.shake(3, 0.3);
            this._biasBoom = 1.3;
          }
          if (pat === 'summon') {
            for (let i = 0; i < (this.phase2 ? 2 : 1); i++) G.addEnt(G.makeEnemy(this.phase2 ? 'fantasma' : 'cavaleiro', a.x + 40 + i * (a.w - 100), a.y + a.h - 40, { room: this.room }));
            this.stT = 0.6;
          }
        }
      } else if (this.st === 'homing') {
        this.vol -= dt;
        if (this.vol <= 0 && this.k < (this.phase2 ? 5 : 3)) { this.vol = 0.35; this.k++; const b = Math.atan2(p.cy - this.cy, p.cx - this.cx); this.shot(this.cx, this.cy - 14, b + G.rf(-0.5, 0.5), 80, { spr: 'orb', homing: 1.6, life: 3.5 }); G.sfx('beam'); }
        if (this.stT <= 0) { this.st = 'tele'; this.stT = 0.4; }
      } else if (this.st === 'ring') {
        this.vol -= dt;
        if (this.vol <= 0 && this.k < 3) { this.vol = 0.4; this.k++; for (let i = 0; i < 12; i++) this.shot(this.cx, this.cy - 12, i * Math.PI / 6 + this.k * 0.25, 95, { spr: 'orb' }); G.sfx('bigbeam'); }
        if (this.stT <= 0) { this.st = 'tele'; this.stT = 0.4; }
      } else if (this.st === 'clones') {
        this.vol -= dt;
        if (this.vol <= 0) { this.vol = 1.1; const b = Math.atan2(p.cy - this.cy, p.cx - this.cx); this.shot(this.cx, this.cy - 14, b, 100, { spr: 'orb' }); for (const c of this.clones) if (!c.dead) { const bc = Math.atan2(p.cy - c.cy, p.cx - c.cx); this.shot(c.cx, c.cy - 14, bc, 100, { spr: 'orb', dmg: 2 }); } }
        if (this.stT <= 0) { this.clearClones(); this.st = 'tele'; this.stT = 0.4; }
      } else if (this.st === 'summon') {
        if (this.stT <= 0) { this.st = 'tele'; this.stT = 0.4; }
      } else if (this.st === 'bias') {
        if (this._biasBoom > 0) { this._biasBoom -= dt; if (this._biasBoom <= 0) { G.sfx('explode'); G.flash('#ff8ad8', 0.2, 0.3); } }
        if (this.stT <= 0) { this.st = 'tele'; this.stT = 0.4; }
      } else if (this.st === 'tele') {
        if (this.stT <= 0) { this.teleport(); this.next(); }
      } else if (this.st === 'stunned') { }
    }
    draw(ctx, cam) {
      const x = this.cx - cam.x, base = this.y + this.h - cam.y, p = G.player, s = this.st;
      G.shadow(ctx, x, base - 1, 18, 0.4);
      // pose dos braços conforme o feitiço; ao teleportar e ao levar golpe, a imagem "distorce"
      const ps = { arms: s === 'homing' ? 'point' : s === 'ring' ? 'spread' : s === 'bias' || s === 'summon' ? 'raise' : s === 'clones' || s === 'cast' ? 'cast' : this.stun > 0 || s === 'stunned' ? 'slump' : 'idle' };
      if (p) ps.aim = Math.atan2(p.cy - (this.cy - 20), p.cx - this.cx);
      ps.glitch = s === 'tele' ? 1 : this.hurtT > 0 ? 0.5 : this.dying ? Math.min(1, this.dieT) : 0;
      if (this.p2T > 0) { ps.arms = 'spread'; ps.glitch = 0.6; }
      drawVies(ctx, x, base, this.t, this.flashOn(), this.phase2, s === 'tele' ? 0.4 : 1, ps);
      this.drawStunStars(ctx, x, base - 50);
    }
  }
  // Viés: manto, mangas articuladas, cajado e efeito de distorção (fatias deslocadas com franjas de cor)
  function drawVies(ctx, x, base, t, fl, big, alpha, ps = {}) {
    const A = G.bossArt, s = big ? 1.3 : 1;
    const pa = ctx.globalAlpha; ctx.globalAlpha = pa * alpha;
    const fy = Math.sin(t * 3) * 2, arms = ps.arms || 'idle', slump = arms === 'slump';
    const body = A['vies' + (big ? 1 : 0) + '_' + (Math.floor(t * 8) % 4)] || A['vies' + (big ? 1 : 0)];
    if (!body) { ctx.globalAlpha = pa; return; }
    const bw = G.lw(body), bh = G.lh(body), bx = x - bw / 2, by = base - bh - 4 + fy + (slump ? 2 : 0);
    if (big) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, x, base - 26 + fy, 34, '#c050ff', 0.35 + 0.15 * Math.sin(t * 6)); ctx.restore(); }
    if (alpha >= 1) G.light.add(x, base - 26, big ? 70 : 50, '#c070ff', 0.7);
    // fiapos de sombra subindo do manto
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) { const k = (t * 0.5 + i / 5) % 1; G.glow(ctx, x + Math.sin(i * 2.3 + t) * 10 * s, base - 4 - k * 30 * s + fy, 3 * (1 - k) + 1, '#9a3ad0', 0.4 * (1 - k)); }
    ctx.restore();
    const o = fl ? { white: true } : {};
    const gl = ps.glitch || 0;
    if (gl > 0) {
      // distorção: o corpo em fatias deslocadas, com fantasmas vermelho e ciano
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= 0.45 * gl;
      ctx.drawImage(G.tint(body, '#ff2a5a'), bx - 2.5 * gl, by, bw, bh); ctx.drawImage(G.tint(body, '#2ad8ff'), bx + 2.5 * gl, by, bw, bh);
      ctx.restore();
      const n = 7, src = fl ? G.white(body) : body;
      for (let i = 0; i < n; i++) { const sy = i / n, off = Math.sin(t * 47 + i * 3.1) * 4 * gl * (i % 2 ? 1 : -0.6); ctx.drawImage(src, 0, sy * src.height, src.width, src.height / n + 1, bx + off, by + sy * bh, bw, bh / n + 0.5); }
    } else G.draw(ctx, body, bx, by, o);
    // brilho dos olhos e da rachadura da máscara (forte na forma verdadeira)
    if (A['vies' + (big ? 1 : 0) + 'Glow']) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= big ? 0.8 + 0.2 * Math.sin(t * 8) : 0.45; ctx.drawImage(G.tint(A['vies' + (big ? 1 : 0) + 'Glow'], '#ff3a6a'), bx, by, bw, bh); ctx.restore(); }
    // mangas: ângulo 0 = pendurada; "para fora" é positivo na esquerda e negativo na direita
    const shL = [x - 8.5 * s, by + 22 * s], shR = [x + 8.5 * s, by + 22 * s];
    let aL = 0.3 + Math.sin(t * 2) * 0.06, aR = -0.12;
    if (arms === 'cast') { aL = 1.9 + Math.sin(t * 10) * 0.08; aR = -1.9 - Math.sin(t * 10) * 0.08; }
    else if (arms === 'spread') { aL = 1.55; aR = -1.55; }
    else if (arms === 'raise') { aL = 2.5; aR = -2.85; }
    else if (arms === 'slump') { aL = 0.05; aR = -0.05; }
    else if (arms === 'point' && ps.aim !== undefined) aL = Math.atan2(-Math.cos(ps.aim), Math.sin(ps.aim));
    const sl = A['viesSleeve' + (big ? 1 : 0)], hand = (sh, a) => [sh[0] - Math.sin(a) * 15 * s, sh[1] + Math.cos(a) * 15 * s];
    const hR = hand(shR, aR), hL = hand(shL, aL);
    // cajado preso à mão direita (sobe junto no feitiço)
    const st = A.viesStaff, sa = arms === 'raise' ? -0.15 : arms === 'slump' ? 0.35 : Math.sin(t * 2) * 0.05;
    part(ctx, st, hR[0], hR[1], 6, 26, sa, Object.assign({ glow: A.viesStaffGlow, glowA: 0.6 + 0.4 * Math.sin(t * 5), glowC: '#ffe27a' }, o));
    if (sl) { part(ctx, sl, shL[0], shL[1], 5 * s, 1 * s, aL, o); part(ctx, sl, shR[0], shR[1], 5 * s, 1 * s, aR, o); }
    const tip = rot(0, -26, sa); ctx.save(); ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, hR[0] + tip[0], hR[1] + tip[1] + 3, 8, '#ffe27a', 0.5); ctx.restore();
    // energia nas mãos durante os feitiços
    if (arms === 'cast' || arms === 'point' || arms === 'spread') {
      const pts = arms === 'point' ? [hL] : arms === 'spread' ? [hL, hR] : [[(hL[0] + hR[0]) / 2, (hL[1] + hR[1]) / 2 - 4]];
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const [hx, hy] of pts) { G.glow(ctx, hx, hy, 9 + Math.sin(t * 20) * 2, '#c050ff', 0.8); G.glow(ctx, hx, hy, 4, '#ffffff', 0.7); }
      ctx.restore();
    }
    ctx.globalAlpha = pa;
  }
  G.drawVies = drawVies;
  class ViesClone extends G.Ent {
    constructor(x, y, boss) { super(x, y, 16, 10); this.boss = boss; this.isEnemy = true; }
    hurtbox() { return { x: this.x - 2, y: this.y - 24, w: this.w + 4, h: 32 }; }
    onHit() { this.dead = true; G.sfx('tink'); G.fx.burst(this.cx, this.cy - 10, ['#c070ff', '#ffffff'], 12, 50); G.fx.text(this.cx, this.y - 26, 'FALSO!', '#c8c8ff'); return false; }
    update(dt) { this.t += dt; }
    draw(ctx, cam) { G.shadow(ctx, this.cx - cam.x, this.y + this.h - 1 - cam.y, 18, 0.25); drawVies(ctx, this.cx - cam.x, this.y + this.h - cam.y, this.t + 0.7, false, this.boss.phase2, 0.95); }
  }

  for (const C of [Golem, Aranha, Escorpiao, Dragao, Yeti, Vies]) {
    const d = C.prototype.draw;
    C.prototype.draw = function (ctx, cam) {
      if (!this.dying && !(this.p2T > 0)) return d.call(this, ctx, cam);
      const amp = this.dying ? 1.6 : 1;
      ctx.save(); ctx.globalAlpha *= this.dying ? Math.max(0, 1 - Math.max(0, this.dieT - 1.45) / 0.45) : 1;
      d.call(this, ctx, { x: cam.x + G.rf(-amp, amp), y: cam.y + G.rf(-amp * 0.6, amp * 0.6) });
      ctx.restore();
      if (this.p2T > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, this.cx - cam.x, this.cy - 12 - cam.y, 40, '#ff6a4a', 0.4 + 0.3 * Math.sin(this.t * 20)); ctx.restore(); }
    };
  }
  G.makeBoss = (id, x, y, arena) => {
    const C = { d1: Golem, d2: Aranha, d3: Escorpiao, d4: Dragao, d5: Yeti, d6: Vies }[id];
    return new C(x, y, arena);
  };
})(window.G);
