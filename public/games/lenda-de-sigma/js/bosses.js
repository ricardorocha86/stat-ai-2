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
  class Golem extends Boss {
    constructor(x, y, arena) { super(x, y, 26, 14, { hp: 36, name: 'Golem Desequilibrado', topic: 'media', dmg: 4, arena }); this.armUp = 0; this.rings = []; this.cnt = 0; this.hasP2 = true; }
    vulnerable(kind) { if (this.stun > 0) return 1; return kind === 'bomb' ? 0.5 : 0.2; }
    next() { this.st = 'walk'; this.stT = this.p2 ? G.rf(1.1, 1.8) : G.rf(2, 3); }
    onStun() { this.st = 'stunned'; }
    ai(dt) {
      this.stT -= dt;
      const p = G.player;
      if (this.st === 'walk') {
        const a = Math.atan2(p.cy - this.cy, p.cx - this.cx), sp = this.p2 ? 38 : 26;
        G.moveEnt(this, Math.cos(a) * sp * dt, Math.sin(a) * sp * dt, { ghostEnts: true });
        this.clampArena(2);
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
          this.rings.push({ r: 8, x: this.cx, y: this.cy, hit: false });
          if (this.p2) this.ring2T = 0.4;
          G.fx.burst(this.cx, this.cy, ['#9a8a7a', '#ffffff'], 20, 90); G.fx.smoke(this.cx, this.cy, 8, '#a89a8a', 50);
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
          G.sfx('bombput');
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
      const A = G.bossArt, x = this.cx - cam.x, base = this.y + this.h - cam.y;
      G.shadow(ctx, x, base - 1, 44, 0.38);
      if (this.st === 'raise') { ctx.save(); ctx.strokeStyle = 'rgba(255,80,60,' + (0.3 + 0.3 * Math.sin(this.t * 20)) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, base - 4, 30 + this.armUp * 10, (30 + this.armUp * 10) * 0.75, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
      for (const rg of this.rings) {
        const rr = rg.r;
        ctx.save(); ctx.strokeStyle = 'rgba(255,240,200,0.85)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(rg.x - cam.x, rg.y - cam.y, rr, rr * 0.75, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = 'rgba(160,140,110,0.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(rg.x - cam.x, rg.y - cam.y, rr - 4, (rr - 4) * 0.75, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      }
      const o = this.flashOn() ? { white: true } : undefined;
      const bob = this.st === 'walk' ? Math.sin(this.t * 6) * 1.2 : 0, up = this.armUp * 14, wob = this.stun > 0 ? Math.sin(this.t * 22) * 0.8 : 0;
      G.draw(ctx, A.golemLeg, x - 15, base - 12 + (this.st === 'walk' ? Math.max(0, Math.sin(this.t * 6)) * -2 : 0), o);
      G.draw(ctx, A.golemLeg, x + 5, base - 12 + (this.st === 'walk' ? Math.max(0, -Math.sin(this.t * 6)) * -2 : 0), o);
      G.draw(ctx, A.golemArmSmall, x + 15 + wob, base - 38 + bob - up * 0.6, o);
      G.draw(ctx, A.golemTorso, x - 17 + wob, base - 40 + bob, o);
      // núcleo
      const gc = this.stun > 0 ? (Math.floor(this.t * 10) % 2 ? '#ffffff' : '#7aff8a') : this.enrage > 0 ? '#ff5a3a' : '#3aff6a';
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, x + wob, base - 24 + bob, 9, gc, 0.9); ctx.restore();
      ctx.fillStyle = gc; ctx.beginPath(); ctx.arc(x + wob, base - 24 + bob, 2.5, 0, Math.PI * 2); ctx.fill();
      G.light.add(x, base - 24 + bob, 46, gc, 0.8);
      G.draw(ctx, A.golemHead, x - 9 + wob, base - 52 + bob, o);
      const ec = this.enrage > 0 ? '#ff3a3a' : '#ffd84a';
      ctx.fillStyle = ec; ctx.fillRect(x - 5 + wob, base - 46 + bob, 3, 1.5); ctx.fillRect(x + 2 + wob, base - 46 + bob, 3, 1.5);
      G.draw(ctx, A.golemArmBig, x - 30 + wob, base - 42 + bob - up, o);
      G.text('10', x - 22.5 + wob, base - 32 + bob - up, '#2a3428', { align: 'center', shadow: false });
      G.text('2', x + 20 + wob, base - 30 + bob - up * 0.6, '#2a3428', { align: 'center', shadow: false });
      this.drawStunStars(ctx, x, base - 58);
    }
  }

  // ------------------------------------------------------------------
  // 2) ARANHA MEDIANA — Bosque da Mediana
  // ------------------------------------------------------------------
  class Aranha extends Boss {
    constructor(x, y, arena) { super(x, y, 26, 14, { hp: 50, name: 'Aranha Mediana', topic: 'd2', dmg: 4, arena }); this.z = 0; this.cnt = 0; this.hasP2 = true; this.fanT = 1.5; }
    vulnerable(kind) { if (this.z > 10) return 0; if (this.stun > 0) return 1; return kind === 'bomb' ? 1 : 0.5; }
    next() { this.st = 'crawl'; this.stT = G.rf(2.5, 3.5); this.noContact = false; }
    onStun() { this.st = 'stunned'; this.z = 0; }
    ai(dt) {
      this.stT -= dt;
      const p = G.player;
      if (this.st === 'crawl') {
        const a = Math.atan2(p.cy - this.cy, p.cx - this.cx) + Math.sin(this.t * 2) * 0.8;
        G.moveEnt(this, Math.cos(a) * (this.p2 ? 58 : 48) * dt, Math.sin(a) * (this.p2 ? 58 : 48) * dt, { ghostEnts: true }); this.clampArena(2);
        this.fanT -= dt;
        if (this.p2 && this.fanT <= 0) {
          // leque de 5 teias: a do meio (a "mediana") é mais rápida
          this.fanT = 1.7; const b = Math.atan2(p.cy - this.cy, p.cx - this.cx);
          for (let i = -2; i <= 2; i++) this.shot(this.cx, this.cy - 6, b + i * 0.28, i === 0 ? 125 : 80, { spr: 'web', dmg: 2 });
          G.sfx('beam');
        } else if (!this.p2 && Math.random() < dt * 0.9) { const b = Math.atan2(p.cy - this.cy, p.cx - this.cx); this.shot(this.cx, this.cy - 6, b, 80, { spr: 'web', dmg: 2 }); }
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
          G.sfx('explode'); G.shake(5, 0.4); this.noContact = false;
          G.fx.burst(this.cx, this.cy, ['#c8c0b0', '#ffffff'], 18, 90);
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
      G.shadow(ctx, x, base - 1, Math.max(10, 38 - z / 6), 0.38);
      const cy = base - 12 - z;
      if (z > 0) { ctx.fillStyle = 'rgba(232,232,240,0.8)'; ctx.fillRect(x - 0.25, -10, 0.5, cy - 14 + 10); }
      const o = this.flashOn() ? { white: true } : undefined;
      // pernas articuladas
      ctx.save(); ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) for (const sd of [-1, 1]) {
        const k = Math.sin(this.t * 12 + i * 1.3 + (sd > 0 ? 1.5 : 0)) * (this.st === 'crawl' ? 3 : 1);
        const ax = x + sd * 7, ay = cy - 2 + i * 2.5;
        const kx = x + sd * (20 + i * 1.5), ky = cy - 12 + i * 4 + k;
        const fx = x + sd * (30 + i), fy = cy + 2 + i * 4 - k * 0.5;
        ctx.strokeStyle = '#140a1e'; ctx.lineWidth = 3.2; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy); ctx.stroke();
        ctx.strokeStyle = o ? '#ffffff' : '#4a2a6a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy); ctx.stroke();
        ctx.fillStyle = '#7a4aa0'; ctx.fillRect(kx - 0.75, ky - 0.75, 1.5, 1.5);
      }
      ctx.restore();
      G.draw(ctx, A.spiderAbdomen, x - 16, cy - 10, o);
      G.draw(ctx, A.spiderHead, x - 10, cy - 20, o);
      for (const [ex, ey] of [[-6, -13], [-2.5, -15], [1.5, -15], [5, -13]]) { ctx.fillStyle = '#ff3a3a'; ctx.beginPath(); ctx.arc(x + ex, cy + ey, 1.4, 0, Math.PI * 2); ctx.fill(); G.light.add(x + ex, cy + ey, 10, '#ff3a3a', 0.4); }
      this.drawStunStars(ctx, x, cy - 26);
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
    constructor(x, y, arena) { super(x, y, 32, 14, { hp: 64, name: 'Escorpião Desvio-Padrão', topic: 'd3', dmg: 5, arena }); this.cnt = 0; this.sigma = 8; this.sigT = 0; this.face = 1; this.hasP2 = true; }
    vulnerable(kind) { if (this.st === 'burrow' || this.st === 'emerge') return 0; if (this.stun > 0) return 1; return kind === 'bigbeam' || kind === 'beam' ? 0.8 : 0.4; }
    next() { this.st = 'stalk'; this.stT = G.rf(1.5, 2.5); }
    onStun() { this.st = 'stunned'; }
    ai(dt) {
      this.stT -= dt; this.sigT -= dt;
      const p = G.player;
      this.sigma = Math.round(6 + (1 - this.hp / this.maxHp) * 28);
      if (this.st === 'stalk') {
        const a = Math.atan2(p.cy - this.cy, p.cx - this.cx);
        G.moveEnt(this, Math.cos(a) * 34 * dt, Math.sin(a) * 34 * dt, { ghostEnts: true }); this.clampArena(2);
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
        const r = G.moveEnt(this, this.vx * dt, this.vy * dt, { ghostEnts: true });
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
        ctx.save(); ctx.fillStyle = '#5a4020'; ctx.beginPath(); ctx.ellipse(x, base - 3, 18, 7, 0, 0, Math.PI * 2); ctx.fill();
        const g = ctx.createRadialGradient(x - 4, base - 8, 1, x, base - 4, 16); g.addColorStop(0, '#f0d8a0'); g.addColorStop(1, '#a8803a');
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, base - 4 + Math.sin(this.t * 20) * 0.5, 15, 6, 0, Math.PI, 0); ctx.fill(); ctx.restore();
        G.draw(ctx, G.bossArt.scSting, x - 5, base - 16 + Math.sin(this.t * 10) * 2, { rot: -0.6 });
        return;
      }
      if (this.st === 'aim' && this.aimA !== undefined) {
        ctx.save(); ctx.globalAlpha = 0.55 + 0.35 * Math.sin(this.t * 30); ctx.strokeStyle = '#ff3a3a'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.lineDashOffset = -this.t * 40;
        ctx.beginPath(); ctx.moveTo(x, base - 6); ctx.lineTo(x + Math.cos(this.aimA) * 300, base - 6 + Math.sin(this.aimA) * 300); ctx.stroke(); ctx.restore();
      }
      G.shadow(ctx, x, base - 1, 46, 0.38);
      const o = this.flashOn() ? { white: true } : undefined;
      const cy = base - 9;
      // pernas articuladas (4 pares)
      ctx.save(); ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) for (const sd of [-1, 1]) {
        const k = Math.sin(this.t * (this.st === 'dash' ? 26 : 9) + i * 1.4 + (sd > 0 ? 1.6 : 0)) * 2;
        const ax = x - f * (8 - i * 5), ay = cy + sd * 4;
        const kx = ax - f * 2 + k, ky = cy + sd * 12;
        const fx = kx - f * 3 + k * 0.5, fy = cy + sd * 15;
        ctx.strokeStyle = '#2a1004'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy); ctx.stroke();
        ctx.strokeStyle = o ? '#ffffff' : '#b06a2a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy); ctx.stroke();
      }
      // braços das pinças
      const snap = this.st === 'aim' || this.st === 'dash';
      for (const sd of [-1, 1]) { ctx.strokeStyle = '#2a1004'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(x + f * 10, cy + sd * 3); ctx.lineTo(x + f * 16, cy + sd * 9); ctx.lineTo(x + f * 21, cy + sd * 8); ctx.stroke(); ctx.strokeStyle = '#d07a2e'; ctx.lineWidth = 1.8; ctx.stroke(); }
      ctx.restore();
      G.draw(ctx, A.scBody, x - 15, cy - 9, Object.assign({ flip: f < 0 }, o || {}));
      const claw = A['scClaw' + (snap && Math.floor(this.t * 12) % 2 ? 0 : 1)];
      G.draw(ctx, claw, x + (f > 0 ? 18 : -36), cy - 15, Object.assign({ flip: f < 0 }, o || {}));
      G.draw(ctx, claw, x + (f > 0 ? 18 : -36), cy + 3, Object.assign({ flip: f < 0, flipY: true }, o || {}));
      // cauda: segmentos que afinam, curvando por cima do corpo
      let tx = x - f * 14, ty = cy - 2;
      for (let i = 0; i < 6; i++) {
        const th = 0.25 + i * 0.4 + Math.sin(this.t * 3) * 0.08;
        tx += f * Math.sin(th) * (5.5 - i * 0.4); ty -= Math.cos(th) * (5.5 - i * 0.4);
        const sc = 1 - i * 0.09;
        ctx.save(); ctx.translate(tx, ty); ctx.scale(sc, sc); G.draw(ctx, A.scTail, -4.5, -4.5, o); ctx.restore();
      }
      G.draw(ctx, A.scSting, tx - 5 + f * 3, ty - 3, { flip: f < 0, rot: f > 0 ? 0.9 : -0.9 });
      ctx.fillStyle = '#ff3030'; ctx.fillRect(x + f * 13 - 1, cy - 3, 1.5, 1.5); ctx.fillRect(x + f * 13 - 1, cy + 1.5, 1.5, 1.5);
      if (this.sigT > 0) G.puzTag(ctx, x, base - 52, 'σ = ' + this.sigma + '°', '#ffe27a');
      this.drawStunStars(ctx, x, cy - 20);
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
    draw(ctx, cam) {
      const A = G.bossArt, x = this.cx - cam.x, hy = this.y - cam.y + this.low * 30;
      const o = this.flashOn() ? { white: true } : undefined;
      for (let i = 4; i >= 0; i--) { const s = 1 - i * 0.12; ctx.save(); ctx.translate(x + Math.sin(this.t * 2 + i) * 3, hy + 26 - i * 7 + (1 - this.low) * 4); ctx.scale(s, s); G.draw(ctx, A.dragonNeck, -10, -6, o); ctx.restore(); }
      if (this.st === 'show' || this.st === 'atk') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, x, hy + 4, 14 + Math.sin(this.t * 20) * 2, '#ff7a1a', 0.6); ctx.restore(); }
      const open = this.st === 'atk' ? 1 : 0;
      G.draw(ctx, A['dragonHead' + open], x - 24, hy - 26, o);
      const ec = this.enrage > 0 ? '#ff3a3a' : '#ffe24a';
      for (const sx of [-9, 9]) { ctx.fillStyle = '#2a0606'; ctx.beginPath(); ctx.ellipse(x + sx, hy - 12, 3.2, 2.4, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = ec; ctx.beginPath(); ctx.ellipse(x + sx, hy - 12, 2.2, 1.6, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#2a0606'; ctx.fillRect(x + sx - 0.4, hy - 13.5, 0.8, 3); }
      G.light.add(x, hy - 4, 70, '#ff7a3a', 0.8, 0.25);
      if (open && Math.random() < 0.5) G.fx.spawn({ x: x + G.rf(-6, 6) + cam.x, y: hy + 6 + cam.y, vy: 20, vx: G.rf(-10, 10), life: 0.4, color: G.pick(['#ffd040', '#ff7a1a']), size: 1 });
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
    constructor(x, y, arena) { super(x, y, 30, 16, { hp: 96, name: 'Yeti Gaussiano', topic: 'd5', dmg: 6, arena }); this.cnt = 0; this.piles = {}; this.z = 0; this.face = 1; this.hasP2 = true; }
    vulnerable(kind) { if (this.z > 8) return 0; return this.stun > 0 ? 1 : 0.4; }
    next() { this.st = 'walk'; this.stT = G.rf(1.2, 2); }
    onStun() { this.st = 'stunned'; this.z = 0; }
    ai(dt) {
      this.stT -= dt;
      const p = G.player, a = this.arena;
      this.face = p.cx < this.cx ? -1 : 1;
      if (this.st === 'walk') {
        const ang = Math.atan2(p.cy - this.cy, p.cx - this.cx);
        G.moveEnt(this, Math.cos(ang) * 30 * dt, Math.sin(ang) * 30 * dt, { ghostEnts: true }); this.clampArena(2);
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
      G.shadow(ctx, x, base - 1, 40 - z / 6, 0.38);
      const o = this.flashOn() ? { white: true } : undefined;
      const by = base - z, arm = this.st === 'storm' ? Math.sin(this.t * 14) * 6 : 0, bob = this.st === 'walk' ? Math.sin(this.t * 6) : 0;
      ctx.save(); ctx.fillStyle = '#9aa8c8'; G.rrPath(ctx, x - 14, by - 6, 11, 6, 3); ctx.fill(); G.rrPath(ctx, x + 3, by - 6, 11, 6, 3); ctx.fill(); ctx.restore();
      G.draw(ctx, A.yetiArm, x - 31, by - 46 + arm + bob, Object.assign({ flip: true }, o || {}));
      G.draw(ctx, A.yetiArm, x + 17, by - 46 - arm + bob, o);
      G.draw(ctx, A.yetiBody, x - 20, by - 40 + bob, o);
      G.draw(ctx, A.yetiHead, x - 13, by - 58 + bob, o);
      const ec = this.enrage > 0 ? '#ff3a3a' : '#fff4a0';
      ctx.fillStyle = '#1b1428'; ctx.fillRect(x - 6, by - 47 + bob, 4, 3); ctx.fillRect(x + 2, by - 47 + bob, 4, 3);
      ctx.fillStyle = ec; ctx.fillRect(x - 5, by - 46.5 + bob, 2, 2); ctx.fillRect(x + 3, by - 46.5 + bob, 2, 2);
      ctx.fillStyle = '#3a4a6a'; ctx.fillRect(x - 7, by - 49 + bob, 5, 1); ctx.fillRect(x + 2, by - 49 + bob, 5, 1);
      if (this.enrage > 0) G.light.add(x, by - 45, 20, '#ff3a3a', 0.5);
      this.drawStunStars(ctx, x, by - 62);
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
      const x = this.cx - cam.x, base = this.y + this.h - cam.y;
      G.shadow(ctx, x, base - 1, 18, 0.4);
      drawVies(ctx, x, base, this.t, this.flashOn(), this.phase2, this.st === 'tele' ? 0.4 : 1);
      this.drawStunStars(ctx, x, base - 50);
    }
  }
  function drawVies(ctx, x, base, t, fl, big, alpha) {
    const A = G.bossArt;
    const pa = ctx.globalAlpha; ctx.globalAlpha = pa * alpha;
    const fy = Math.sin(t * 3) * 2;
    const spr = A['vies' + (big ? 1 : 0)];
    if (big) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, x, base - 26 + fy, 34, '#c050ff', 0.35 + 0.15 * Math.sin(t * 6)); ctx.restore(); }
    if (alpha >= 1) G.light.add(x, base - 26, big ? 70 : 50, '#c070ff', 0.7);
    G.draw(ctx, spr, x - G.lw(spr) / 2, base - G.lh(spr) - 4 + fy, fl ? { white: true } : undefined);
    const st = A.viesStaff, sx = x + (big ? 14 : 11);
    G.draw(ctx, st, sx - 5, base - G.lh(st) - 6 + fy + Math.sin(t * 2) * 1.5);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, sx, base - G.lh(st) + 0 + fy, 8, '#ffe27a', 0.5); ctx.restore();
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
