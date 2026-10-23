'use strict';
// =====================================================================
//  Inimigos comuns (overworld e masmorras)
// =====================================================================
(function (G) {
  const DEFS = {
    gosma: { hp: 3, dmg: 2, xp: 2, speed: 46, w: 12, h: 8 },
    cogumau: { hp: 4, dmg: 2, xp: 3, speed: 28, w: 12, h: 8 },
    cuspidor: { hp: 4, dmg: 2, xp: 4, speed: 30, w: 12, h: 10 },
    morcego: { hp: 2, dmg: 2, xp: 3, speed: 60, w: 12, h: 8, fly: true },
    esqueleto: { hp: 8, dmg: 3, xp: 6, speed: 42, w: 10, h: 8 },
    escorpiao: { hp: 9, dmg: 4, xp: 8, speed: 34, w: 14, h: 8 },
    lobo: { hp: 9, dmg: 4, xp: 8, speed: 66, w: 14, h: 8 },
    chama: { hp: 7, dmg: 4, xp: 7, speed: 36, w: 12, h: 8 },
    fantasma: { hp: 8, dmg: 4, xp: 9, speed: 30, w: 12, h: 10, fly: true },
    aranha: { hp: 3, dmg: 2, xp: 2, speed: 55, w: 12, h: 8 },
    cavaleiro: { hp: 22, dmg: 6, xp: 16, speed: 30, w: 10, h: 8 }
  };
  G.ENEMY_DEFS = DEFS;

  class Enemy extends G.Ent {
    constructor(x, y, type, o = {}) {
      const D = DEFS[type];
      super(x, y, D.w, D.h);
      this.type = type; this.D = D; this.tier = o.tier || 1;
      this.hp = this.maxHp = Math.round(D.hp * (1 + (this.tier - 1) * 0.6));
      this.dmg = Math.round(D.dmg * (1 + (this.tier - 1) * 0.5));
      this.xp = Math.round(D.xp * this.tier); this.speed = D.speed;
      this.isEnemy = true; this.flying = !!D.fly; this.stompable = true;
      this.variant = o.variant || ''; this.dir = G.ri(0, 3);
      this.st = 'idle'; this.stT = G.rf(0.3, 1.2); this.hurtT = 0; this.kbT = 0; this.kbx = 0; this.kby = 0;
      this.spawnT = o.noSpawnFx ? 0 : 0.35; this.alpha = 1;
      if (this.spawnT) G.fx.burst(this.cx, this.cy, ['#ffffff', '#c8c8ff'], 6, 30);
    }
    hurtbox() { return { x: this.x - 1, y: this.y - 7, w: this.w + 2, h: this.h + 7 }; }
    // aviso visual antes de atacar (treme, pisca e mostra "!")
    tell(t = 0.4) { this.tellT = t; G.sfx('tell'); }
    onHit(d, sx, sy, kind, crit) {
      if (this.dead || this.hurtT > 0 || this.spawnT > 0) return false;
      if (this.immune && this.immune(kind, sx, sy)) { G.sfx('tink'); G.fx.burst(this.cx, this.cy - 4, ['#ffffff'], 4, 40); return false; }
      if (kind === 'stomp' && this.type === 'cogumau') d = this.hp; // pisão esmaga cogumaus
      this.hp -= d; this.hurtT = 0.22; this.squashT = 0.16;
      if (!this.heavy && kind !== 'stomp') {
        const a = Math.atan2(this.cy - sy, this.cx - sx);
        this.kbx = Math.cos(a) * 170; this.kby = Math.sin(a) * 170; this.kbT = 0.13;
      }
      G.fx.text(this.cx, this.y - 12, (crit ? 'CRÍTICO! ' : '') + d, crit ? '#ffd84a' : '#ffffff');
      G.fx.spark(this.cx + G.rf(-3, 3), this.cy - 6 + G.rf(-3, 3), crit ? '#ffe27a' : '#ffffff', crit ? 10 : 7);
      if (kind === 'sword' || kind === 'spin' || kind === 'stomp') G.hitStop = Math.max(G.hitStop, crit ? 0.09 : 0.045);
      G.sfx('hit');
      if (this.hp <= 0) this.die(kind);
      return true;
    }
    die(kind) {
      this.dead = true; G.sfx('kill');
      { const s = G.spr[this.sprName()] || G.spr[this.type + '0']; if (s) G.fx.ghost(s, this.cx, this.y + this.h - (this.z || 0), this.flip); }
      const cols = { gosma: ['#7aff8a', '#2a8a3a'], chama: ['#ffd040', '#ff7a1a'], fantasma: ['#ffffff', '#b0a0d8'] }[this.type] || ['#ffffff', '#c8c8e0', '#9a98b0'];
      G.fx.burst(this.cx, this.cy - 4, cols, 12, 70);
      G.fx.burst(this.cx, this.cy - 6, cols, 7, 70, { grav: 300, up: -70, size: 2.5, life: 0.55, drag: 1 }); // pedaços que caem
      G.fx.smoke(this.cx, this.cy - 2, 7, '#e8e0f0', 34);
      G.fx.ring(this.cx, this.cy, 14, '#ffffff', 0.25, 1.5);
      if (kind === 'stomp' && this.type === 'cogumau') G.addEnt(new Flat(this.x, this.y));
      G.P.stats.kills++;
      G.addXP(this.xp);
      G.drop(this.cx, this.cy, this.dropTable);
      if (this.onDeath) this.onDeath(this);
      if (this.spawner) this.spawner.killed();
    }
    blocked(dx, dy) { return G.rectBlocked(this.x + dx, this.y + dy, this.w, this.h, this, { avoidHazard: !this.flying, fly: this.flying }); }
    move(dx, dy) { return G.moveEnt(this, dx, dy, { avoidHazard: !this.flying, fly: this.flying, ghostEnts: this.flying }); }
    toPlayer() { const p = G.player; return { dx: p.cx - this.cx, dy: p.cy - this.cy, d: G.dist(p.cx, p.cy, this.cx, this.cy) }; }
    update(dt) {
      this.t += dt;
      if (this.hurtT > 0) this.hurtT -= dt;
      if (this.squashT > 0) this.squashT -= dt;
      if (this.tellT > 0) this.tellT -= dt;
      if (this.spawnT > 0) { this.spawnT -= dt; return; }
      // primeira vez que o herói vê este tipo: cartão do bestiário
      if (!this.seenChecked && G.BESTIARY && G.BESTIARY[this.type] && G.P && G.cam) {
        const cam = G.cam;
        if (this.cx > cam.x + 8 && this.cx < cam.x + G.W - 8 && this.cy > cam.y + 8 && this.cy < cam.y + G.H - 8) {
          this.seenChecked = true;
          if (!G.P.flags['bst_' + this.type]) { G.P.flags['bst_' + this.type] = true; const b = G.BESTIARY[this.type]; G.ui.card({ title: b.name, text: b.text, color: b.color, icon: G.spr[this.sprName()] || G.spr[this.type + '0'] }); }
        }
      }
      if (this.kbT > 0) { this.kbT -= dt; this.move(this.kbx * dt, this.kby * dt); }
      else if (G.player && G.player.state !== 'dead') this.ai(dt);
      // dano por contato
      const p = G.player;
      if (p && !this.harmless && p.state !== 'dead' && p.state !== 'fall' && p.z < 3 && G.overlap(this.hurtbox(), { x: p.x, y: p.y - 6, w: p.w, h: p.h + 6 })) {
        if (p.starT > 0) this.onHit(999, p.cx, p.cy, 'star');
        else if (!this.noContact) G.hurtPlayer(this.dmg, this.cx, this.cy);
      }
    }
    sprName() { return this.type + this.variant + (Math.floor(this.t * 6) % 4); }
    draw(ctx, cam) {
      const s = G.spr[this.sprName()] || G.spr[this.type + this.variant + '0'] || G.spr[this.type + '0'];
      if (!s) return;
      const sx = Math.round(this.cx - G.lw(s) / 2 - cam.x), sy = Math.round(this.y + this.h - G.lh(s) - cam.y - (this.z || 0));
      if (!this.flying || this.z) G.shadow(ctx, this.cx - cam.x, this.y + this.h - 1 - cam.y, this.w, 0.3);
      else G.shadow(ctx, this.cx - cam.x, this.y + this.h + 6 - cam.y, 8, 0.2);
      if (this.spawnT > 0) {
        // surge esticando e assenta com um pequeno rebote
        const k = 1 - this.spawnT / 0.35, ssy = k < 0.7 ? 0.3 + k / 0.7 * 0.85 : 1.15 - (k - 0.7) / 0.3 * 0.15;
        G.draw(ctx, s, sx, sy, { alpha: Math.min(1, k * 1.6), white: true, sx: Math.max(0.6, 2 - ssy), sy: ssy }); return;
      }
      const o = { flip: this.flip !== undefined ? this.flip : false };
      // elasticidade própria (gosma) e achatamento ao levar golpe
      const sq = this.squish ? this.squish() : null;
      if (sq) { o.sx = sq.sx; o.sy = sq.sy; }
      if (this.squashT > 0) { const k = this.squashT / 0.16; o.sx = (o.sx || 1) * (1 + 0.28 * k); o.sy = (o.sy || 1) * (1 - 0.22 * k); }
      if (this.tellT > 0) { o.sx = (o.sx || 1) * 1.06; o.sy = (o.sy || 1) * 0.92; } // encolhe antes de atacar
      const bobY = sq && sq.dy ? sq.dy : 0;
      if (this.hurtT > 0 && Math.floor(this.t * 30) % 2 === 0) o.white = true;
      let jx = 0;
      if (this.tellT > 0) { jx = Math.sin(this.t * 90) * 0.75; if (Math.floor(this.t * 20) % 2 === 0) o.tint = 'rgba(255,60,60,0.55)'; }
      if (this.alpha < 1) o.alpha = this.alpha;
      G.draw(ctx, s, sx + jx, sy + bobY, o);
      if (this.drawExtra) this.drawExtra(ctx, sx, sy, s);
      if (this.tellT > 0) G.drawTell(ctx, sx + G.lw(s) / 2, sy - 6, this.t);
      if (this.maxHp >= 10 && this.hp < this.maxHp) { G.rect(ctx, sx + 2, sy - 3, G.lw(s) - 4, 2, '#3a0a10'); G.rect(ctx, sx + 2, sy - 3, Math.round((G.lw(s) - 4) * this.hp / this.maxHp), 2, '#ff4a5a'); }
    }
  }
  G.Enemy = Enemy;

  class Flat extends G.Ent { // cogumau esmagado
    constructor(x, y) { super(x, y, 12, 8); this.life = 0.6; }
    update(dt) { this.life -= dt; if (this.life <= 0) this.dead = true; }
    draw(ctx, cam) { G.draw(ctx, 'cogumau_flat', this.cx - 8 - cam.x, this.y + this.h - 16 - cam.y); }
  }

  // ------------------------- comportamentos -------------------------
  const GOSMA_COR = { '': ['#9aff8a', '#3aba3a'], _ice: ['#e0f6ff', '#7ac8f0'], _sand: ['#ffe8a0', '#c8a040'], _swamp: ['#d8a0ff', '#7a40b8'], _lava: ['#ffd06a', '#ff5a1a'], _dark: ['#b8a0ff', '#4a3a98'] };
  class Gosma extends Enemy {
    ai(dt) {
      this.stT -= dt; if (this.landT > 0) this.landT -= dt;
      if (this.st === 'hop') {
        this.move(this.vx * dt, this.vy * dt);
        this.z = Math.sin((1 - this.stT / 0.4) * Math.PI) * 6;
        if (this.stT <= 0) {
          this.st = 'idle'; this.stT = G.rf(0.6, 1.4); this.z = 0; this.landT = 0.14;
          // respingos ao cair
          const c = GOSMA_COR[this.variant] || GOSMA_COR[''];
          G.fx.burst(this.cx, this.y + this.h - 2, c, 5, 45, { grav: 240, up: -40, size: 1.5, life: 0.4, drag: 1 });
        }
      } else if (this.stT <= 0) {
        const t = this.toPlayer();
        let a = t.d < 130 ? Math.atan2(t.dy, t.dx) + G.rf(-0.4, 0.4) : Math.random() * Math.PI * 2;
        this.vx = Math.cos(a) * this.speed * 1.3; this.vy = Math.sin(a) * this.speed * 1.3;
        this.st = 'hop'; this.stT = 0.4;
      }
    }
    // estica no salto, achata ao preparar e ao cair, balança parada
    squish() {
      if (this.landT > 0) { const k = this.landT / 0.14; return { sx: 1 + 0.16 * k, sy: 1 - 0.14 * k }; }
      if (this.st === 'hop') { const k = 1 - this.stT / 0.4; return k < 0.25 ? { sx: 0.88, sy: 1.14 } : k > 0.8 ? { sx: 1.06, sy: 0.95 } : { sx: 0.94, sy: 1.07 }; }
      if (this.stT < 0.15) return { sx: 1.1, sy: 0.88 };
      const w = Math.sin(this.t * 5) * 0.045; return { sx: 1 + w, sy: 1 - w };
    }
    sprName() {
      if (this.st === 'hop') { const k = 1 - this.stT / 0.4; return 'gosma' + this.variant + (k < 0.12 || k > 0.85 ? 1 : 2); }
      if (this.stT < 0.12) return 'gosma' + this.variant + '1';
      return 'gosma' + this.variant + (Math.floor(this.t * 3) % 2 ? 0 : 3);
    }
  }
  class Cogumau extends Enemy {
    ai(dt) {
      this.stT -= dt;
      const t = this.toPlayer();
      if (this.stT <= 0) {
        this.stT = G.rf(1, 2.4);
        if (t.d < 90) this.dir = G.dirFrom(t.dx, t.dy); else this.dir = G.ri(0, 3);
      }
      const d = G.DIRS[this.dir];
      const r = this.move(d.x * this.speed * dt, d.y * this.speed * dt);
      if (r.hitX || r.hitY) { this.dir = [1, 0, 3, 2][this.dir]; }
      // vira para o lado em que anda (antes alternava a cada quarto de segundo)
      if (this.dir === 2) this.flip = true; else if (this.dir === 3) this.flip = false;
      // passinhos levantam poeira de esporos
      if (Math.floor(this.t * 7 / 2) !== Math.floor((this.t - dt) * 7 / 2)) G.fx.spawn({ x: this.cx + G.rf(-3, 3), y: this.y + this.h, vy: -8, kind: 'puff', size: 1.4, color: '#e8d8b0', life: 0.3, drag: 3 });
    }
    sprName() { return 'cogumau' + (Math.floor(this.t * 7) % 4); }
    squish() { const k = Math.sin(this.t * 14); return { sx: 1 + 0.04 * k, sy: 1 - 0.04 * k }; } // ginga ao andar
  }
  class Cuspidor extends Enemy {
    ai(dt) {
      this.stT -= dt;
      const t = this.toPlayer();
      if (this.st === 'walk') {
        const d = G.DIRS[this.dir];
        const r = this.move(d.x * this.speed * dt, d.y * this.speed * dt);
        if (r.hitX || r.hitY || this.stT <= 0) { this.st = 'idle'; this.stT = G.rf(0.5, 1); }
      } else if (this.st === 'aim') {
        if (this.stT <= 0) {
          const d = G.DIRS[this.dir];
          G.addEnt(new G.EShot(this.cx + d.x * 8, this.cy - 4 + d.y * 8, d.x * 125, d.y * 125, { spr: 'rock', dmg: this.dmg })).room = this.room;
          G.sfx('bombput'); G.fx.smoke(this.cx + d.x * 8, this.cy - 4 + d.y * 8, 3, '#e8d8c8', 20);
          this.st = 'idle'; this.stT = G.rf(1.2, 2.2);
        }
      } else if (this.stT <= 0) {
        if (t.d < 160 && Math.random() < 0.65) {
          this.dir = G.dirFrom(t.dx, t.dy);
          this.st = 'aim'; this.stT = 0.35; this.tell(0.35);
        } else { this.dir = G.ri(0, 3); this.st = 'walk'; this.stT = G.rf(0.5, 1.2); }
      }
    }
    sprName() { return 'cuspidor_' + this.dir + (this.st === 'walk' ? Math.floor(this.t * 6) % 2 : 0); }
  }
  class Morcego extends Enemy {
    constructor(x, y, t, o) { super(x, y, t, o); this.st = 'rest'; this.phase = Math.random() * 6; }
    ai(dt) {
      const t = this.toPlayer();
      if (this.st === 'rest') { if (t.d < 100) { this.st = 'fly'; this.stT = G.rf(2, 4); } return; }
      this.stT -= dt; this.phase += dt * 5;
      const a = Math.atan2(t.dy, t.dx) + Math.sin(this.phase) * 1.1;
      this.move(Math.cos(a) * this.speed * dt, Math.sin(a) * this.speed * dt);
      if (this.stT <= 0) { this.st = 'pause'; this.stT = 0.7; }
      if (this.st === 'pause' && this.stT <= 0) { this.st = 'fly'; this.stT = G.rf(2, 4); }
    }
    sprName() { return this.st === 'rest' ? 'morcego_rest' : 'morcego' + (Math.floor(this.t * 12) % 4); }
    squish() { if (this.st === 'rest') return null; const k = Math.sin(this.t * 24); return { sx: 1 + 0.06 * k, sy: 1 - 0.04 * k, dy: Math.sin(this.t * 5) * 1.5 }; } // bate as asas e balança
  }
  class Esqueleto extends Enemy {
    ai(dt) {
      this.stT -= dt;
      const t = this.toPlayer(), p = G.player;
      if (this.st === 'hop') {
        this.move(this.vx * dt, this.vy * dt); this.z = Math.sin((1 - this.stT / 0.35) * Math.PI) * 8;
        if (this.stT <= 0) { this.st = 'idle'; this.stT = 0.3; this.z = 0; }
        return;
      }
      if (p.state === 'attack' && t.d < 34 && Math.random() < 0.08) {
        const a = Math.atan2(-t.dy, -t.dx); this.vx = Math.cos(a) * 120; this.vy = Math.sin(a) * 120; this.st = 'hop'; this.stT = 0.35; return;
      }
      if (t.d < 150) {
        this.dir = G.dirFrom(t.dx, t.dy);
        const a = Math.atan2(t.dy, t.dx);
        this.move(Math.cos(a) * this.speed * dt, Math.sin(a) * this.speed * dt);
      } else if (this.stT <= 0) { this.stT = 1.5; this.dir = G.ri(0, 3); }
      if (this.type === 'esqueleto' && this.tier >= 2 && Math.random() < 0.004 && t.d < 140) {
        const a = Math.atan2(t.dy, t.dx);
        G.addEnt(new G.EShot(this.cx, this.cy - 6, Math.cos(a) * 110, Math.sin(a) * 110, { spr: 'rock', dmg: this.dmg })).room = this.room;
      }
    }
    sprName() { const dn = this.dir === 0 ? 'down' : this.dir === 1 ? 'up' : 'side'; return this.type + '_' + dn + (Math.floor(this.t * 14) % 8); }
    draw(ctx, cam) { this.flip = this.dir === 2; super.draw(ctx, cam); }
  }
  class Cavaleiro extends Esqueleto {
    constructor(x, y, t, o) { super(x, y, t, o); this.heavy = true; }
    immune(kind, sx, sy) {
      if (kind !== 'sword') return false;
      const d = G.DIRS[this.dir];
      const ax = sx - this.cx, ay = sy - this.cy;
      return (ax * d.x + ay * d.y) > 4; // ataque vindo da frente: bloqueado pelo escudo
    }
    ai(dt) {
      const t = this.toPlayer();
      this.stT -= dt;
      if (this.stT <= 0) { this.stT = 0.5; this.dir = G.dirFrom(t.dx, t.dy); }
      const d = G.DIRS[this.dir];
      if (t.d < 170) this.move(d.x * this.speed * dt, d.y * this.speed * dt);
    }
    drawExtra(ctx, sx, sy) {
      const d = G.DIRS[this.dir];
      ctx.fillStyle = '#3a2a6a'; const shx = sx + 5 + d.x * 7, shy = sy + 8 + d.y * 5;
      ctx.fillRect(shx, shy, 6, 7); ctx.fillStyle = '#c0a040'; ctx.fillRect(shx + 2, shy + 2, 2, 3);
    }
  }
  class Escorpiao extends Enemy {
    ai(dt) {
      this.stT -= dt;
      const t = this.toPlayer();
      if (this.st === 'dash') {
        const r = this.move(this.vx * dt, this.vy * dt);
        if (Math.random() < 0.5) G.fx.spawn({ x: this.cx, y: this.y + this.h, vy: -8, kind: 'puff', size: 2, color: '#e8d8b0', life: 0.3, drag: 3 });
        if (r.hitX || r.hitY || this.stT <= 0) { this.st = 'idle'; this.stT = G.rf(0.8, 1.4); }
        return;
      }
      if (this.st === 'aim') {
        if (this.stT <= 0) { const d = G.DIRS[this.dir]; this.vx = d.x * 170; this.vy = d.y * 170; this.st = 'dash'; this.stT = 0.6; }
        return;
      }
      const aligned = Math.abs(t.dx) < 10 || Math.abs(t.dy) < 10;
      if (aligned && t.d < 130 && this.stT <= 0) {
        this.dir = G.dirFrom(t.dx, t.dy);
        this.st = 'aim'; this.stT = 0.35; this.tell(0.35);
      } else {
        if (this.stT <= 0 && this.st !== 'walk') { this.st = 'walk'; this.stT = G.rf(0.8, 1.6); this.dir = G.ri(0, 3); }
        if (this.st === 'walk') { const d = G.DIRS[this.dir]; const r = this.move(d.x * this.speed * dt, d.y * this.speed * dt); if (r.hitX || r.hitY || this.stT <= 0) { this.st = 'idle'; this.stT = 0.4; } }
      }
      this.flip = this.dir === 3;
    }
    sprName() { return 'escorpiao' + (Math.floor(this.t * (this.st === 'dash' ? 16 : 6)) % 4); }
  }
  class Lobo extends Enemy {
    ai(dt) {
      this.stT -= dt;
      const t = this.toPlayer();
      if (this.st === 'run') {
        const a = Math.atan2(t.dy, t.dx);
        this.move(Math.cos(a) * this.speed * dt, Math.sin(a) * this.speed * dt);
        this.flip = t.dx < 0;
        if (this.stT <= 0) { this.st = 'idle'; this.stT = G.rf(0.6, 1.2); }
      } else if (this.st === 'aim') { this.flip = t.dx < 0; if (this.stT <= 0) { this.st = 'run'; this.stT = G.rf(1.2, 2); } }
      else if (this.stT <= 0 && t.d < 170) { this.st = 'aim'; this.stT = 0.35; this.tell(0.35); }
    }
    sprName() { return 'lobo' + (this.st === 'run' ? Math.floor(this.t * 12) % 4 : 0); }
    squish() { if (this.st === 'run') { const k = Math.sin(this.t * 24); return { sx: 1 + 0.07 * k, sy: 1 - 0.06 * k, dy: -Math.abs(k) * 1.2 }; } return { sx: 1, sy: 1 + Math.sin(this.t * 3) * 0.02 }; } // galope
  }
  class Chama extends Enemy {
    draw(ctx, cam) { G.light.add(this.cx - cam.x, this.y - 4 - cam.y, 44, '#ff9a3a', 0.85, 0.35); super.draw(ctx, cam); }
    ai(dt) {
      this.stT -= dt;
      const t = this.toPlayer();
      const a = Math.atan2(t.dy, t.dx) + Math.sin(this.t * 2) * 0.6;
      if (t.d < 140) this.move(Math.cos(a) * this.speed * dt, Math.sin(a) * this.speed * dt);
      if (this.stT <= 0.4 && !this.warned && t.d < 120) { this.warned = true; this.tell(0.4); }
      if (this.stT <= 0) {
        this.stT = G.rf(2, 3.5); this.warned = false;
        if (t.d < 120) for (let i = -1; i <= 1; i++) { const b = Math.atan2(t.dy, t.dx) + i * 0.35; G.addEnt(new G.EShot(this.cx, this.cy - 4, Math.cos(b) * 90, Math.sin(b) * 90, { spr: 'fireball', dmg: this.dmg, size: 8 })).room = this.room; }
      }
      if (Math.random() < 0.3) G.fx.spawn({ x: this.cx + G.rf(-4, 4), y: this.y - 8, vy: -30, life: 0.4, color: G.pick(['#ffd040', '#ff7a1a']), size: 2 });
    }
    sprName() { return 'chama' + (Math.floor(this.t * 8) % 4); }
    squish() { const k = Math.sin(this.t * 9), j = Math.sin(this.t * 23) * 0.03; return { sx: 1 - 0.05 * k + j, sy: 1 + 0.08 * k }; } // tremula
  }
  class Fantasma extends Enemy {
    immune() { return this.alpha < 0.6; }
    ai(dt) {
      const t = this.toPlayer();
      const vis = Math.sin(this.t * 1.3) > -0.3;
      this.alpha = G.approach(this.alpha, vis ? 1 : 0.25, dt * 2);
      this.noContact = this.alpha < 0.6;
      const a = Math.atan2(t.dy, t.dx);
      this.x += Math.cos(a) * this.speed * dt; this.y += Math.sin(a) * this.speed * dt + Math.sin(this.t * 3) * 0.3;
      this.flip = t.dx < 0;
    }
    sprName() { return 'fantasma' + (Math.floor(this.t * 5) % 4); }
    squish() { const k = Math.sin(this.t * 2.5); return { sx: 1 - 0.04 * k, sy: 1 + 0.05 * k, dy: k * 2 }; } // flutua
  }
  class Aranha extends Enemy {
    ai(dt) {
      this.stT -= dt;
      if (this.stT <= 0) { this.stT = G.rf(0.3, 0.8); const t = this.toPlayer(); const a = Math.atan2(t.dy, t.dx) + G.rf(-1, 1); this.vx = Math.cos(a) * this.speed; this.vy = Math.sin(a) * this.speed; }
      const r = this.move(this.vx * dt, this.vy * dt);
      if (r.hitX) this.vx = -this.vx; if (r.hitY) this.vy = -this.vy;
    }
    sprName() { return 'aranha' + (Math.floor(this.t * 10) % 4); }
    squish() { const k = Math.sin(this.t * 30); return { sx: 1 + 0.05 * k, sy: 1 - 0.05 * k }; } // corre
  }
  // ícone "!" de aviso sobre o inimigo
  G.drawTell = function (ctx, x, y, t) {
    const b = Math.abs(Math.sin(t * 14)) * 1.5;
    ctx.save(); ctx.fillStyle = '#1b0a10'; G.rrPath(ctx, x - 2.5, y - 9 - b, 5, 10, 2); ctx.fill();
    ctx.fillStyle = '#ff4a4a'; G.rrPath(ctx, x - 1.5, y - 8 - b, 3, 5.5, 1.2); ctx.fill(); ctx.beginPath(); ctx.arc(x, y - 0.5 - b, 1.3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  };
  const CLASSES = { gosma: Gosma, cogumau: Cogumau, cuspidor: Cuspidor, morcego: Morcego, esqueleto: Esqueleto, escorpiao: Escorpiao, lobo: Lobo, chama: Chama, fantasma: Fantasma, aranha: Aranha, cavaleiro: Cavaleiro };
  G.ENEMY_CLASSES = CLASSES;
  G.makeEnemy = (type, x, y, o = {}) => {
    const C = CLASSES[type] || Gosma;
    const e = new C(x, y, type, o);
    if (o.room !== undefined) e.room = o.room;
    return e;
  };

  // ------------------------------------------------------------------
  //  Spawners do overworld
  // ------------------------------------------------------------------
  G.spawners = [];
  class Spawner {
    constructor(x, y, type, o = {}) { this.x = x; this.y = y; this.type = type; this.o = o; this.ent = null; this.cool = 0; }
    killed() { this.ent = null; this.cool = 50; }
    update(dt) {
      const p = G.player; if (!p) return;
      if (this.cool > 0) { this.cool -= dt; return; }
      const d = G.dist(p.cx, p.cy, this.x, this.y);
      if (!this.ent) {
        const cam = G.cam;
        const onScreen = this.x > cam.x - 12 && this.x < cam.x + G.W + 12 && this.y > cam.y - 12 && this.y < cam.y + G.H + 12;
        if (d < 300 && d > 90 && !onScreen) {
          this.ent = G.makeEnemy(this.type, this.x - 6, this.y - 4, Object.assign({ noSpawnFx: true }, this.o));
          this.ent.spawner = this; this.ent.room = -1;
          G.addEnt(this.ent);
        }
      } else if (this.ent.dead) { this.ent = null; }
      else if (G.dist(p.cx, p.cy, this.ent.cx, this.ent.cy) > 420) { this.ent.dead = true; this.ent = null; }
    }
  }
  G.Spawner = Spawner;
})(window.G);
