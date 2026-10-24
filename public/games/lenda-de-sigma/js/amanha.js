'use strict';
// =====================================================================
//  Pós-jogo. A formatura na Vila Gauss dá o CAPELO DE FORMATURA (arma de
//  arremesso que volta, acerta inimigos, aciona alavancas e busca itens
//  longe do alcance), com relíquias espalhadas que só ele alcança. O Poço
//  das Estrelas guarda um mistério que o Observatório revela. No canto do
//  Pântano de Bayes, a Coruja do Saber acorda com o capelo e leva Sigma às
//  TERRAS DO AMANHÃ: as grandes áreas da modelagem preditiva (Regressão,
//  Classificação, Séries Temporais, Aprendizado de Máquina e Inteligência
//  Artificial). No fim delas fica o Portão do Amanhã, fechado até
//  "A Lenda de Sigma 2" — o mesmo portão da cena depois dos créditos.
// =====================================================================
(function (G) {
  const T = G.T, TS = 16, TAU = Math.PI * 2, F = G.fmt, st = G.st;
  const P = () => G.P, C = G.col, R5 = c => C.ramp(c, 5);
  const say = (n, t, o) => G.ui.say(n, t, o), ask = (n, t, op, o) => G.ui.ask(n, t, op, o);
  const { cyl, inRR } = G.artTools;
  const CORUJA = 'Coruja do Saber';

  // ------------------------------------------------------------------
  //  Som e música
  // ------------------------------------------------------------------
  const A = G.audio;
  G.SFX.capelo = () => { A.noise({ d: 0.18, v: 0.05, ft: 'bandpass', f: 1800, f2: 900 }); A.tone({ f: 520, f2: 760, d: 0.12, type: 'triangle', v: 0.05 }); };
  G.SFX.coruja = () => { A.tone({ f: 392, f2: 370, d: 0.32, type: 'sine', v: 0.14, a: 0.04 }); A.tone({ f: 330, f2: 300, d: 0.5, type: 'sine', v: 0.12, a: 0.05, delay: 0.42 }); };
  G.SFX.zumbido = () => { A.tone({ f: 55, f2: 52, d: 1.2, type: 'sawtooth', v: 0.04, a: 0.3 }); A.tone({ f: 110, f2: 104, d: 1.2, type: 'sine', v: 0.05, a: 0.3 }); };
  {
    const TR = A.TRACKS;
    // arpejo de 4 passos por acorde: 16 acordes = 64 passos, como a melodia e o baixo
    const ac = { C: ['C4', 'E4', 'G4'], G: ['B3', 'D4', 'G4'], Am: ['C4', 'E4', 'A4'], Em: ['B3', 'E4', 'G4'], F: ['C4', 'F4', 'A4'] };
    const seq = ['C', 'G', 'Am', 'Em', 'F', 'C', 'G', 'G', 'C', 'G', 'Am', 'Em', 'F', 'G', 'C', 'C'];
    TR.amanha = { bpm: 84, spb: 2, ch: [
      { w: 'triangle', v: 0.15, s: 'E5:2 G5:2 C6:4 B5:2 G5:2 A5:4 F5:2 A5:2 C6:4 B5:2 A5:2 G5:4 E5:2 G5:2 C6:2 D6:2 E6:4 D6:2 C6:2 B5:2 G5:2 A5:2 B5:2 C6:8' },
      { w: 'triangle', v: 0.12, s: 'C3:4 G2:4 A2:4 E2:4 F2:4 C3:4 G2:4 G2:4 C3:4 G2:4 A2:4 E2:4 F2:4 G2:4 C3:8' },
      { w: 'square', v: 0.012, s: seq.map(k => { const [a, b, c] = ac[k]; return [a, b, c, b].join(' '); }).join(' ') },
      { w: 'noise', v: 0.012, s: 'x:4 x:4 x:4 x:4' }
    ] };
    TR.gancho = { bpm: 60, spb: 2, ch: [
      { w: 'sine', v: 0.12, s: 'A3:4 C4:4 B3:4 E3:4 A3:4 C4:4 D4:4 E4:4 F4:4 E4:4 D4:4 B3:4 C4:4 B3:4 A3:8' },
      { w: 'triangle', v: 0.12, s: 'A1:8 F1:8 D2:8 E2:8 A1:8 F1:8 E1:8 A1:8' },
      { w: 'noise', v: 0.01, s: 'x:8 x:8 x:8 x:8' }
    ] };
    for (const k of ['amanha', 'gancho']) for (const c of TR[k].ch) c.notes = A.parse(c.s);
  }

  // ------------------------------------------------------------------
  //  Temas visuais das Terras do Amanhã (cada área com o seu)
  // ------------------------------------------------------------------
  const tema = (k, o) => Object.assign({}, G.THEMES[k], o);
  Object.assign(G.THEMES, {
    // só dá a luz ambiente do mapa; o chão de cada sala vem de temaSala
    am_base: tema('lago', { amb: '#fbf6ee' }),
    am_porto: tema('lago', { g: ['#246a5c', '#33876e', '#4aa482', '#6cc096', '#a0dcb4'], tc: ['#5a1e3a', '#8a2e56', '#bc4a78', '#e07aa0', '#ffb8d0'], deco: ['#ffb8d0', '#ffffff', '#ffe060', '#8ad0ff'], w: ['#1e5aa8', '#2e88d8', '#62b8f0', '#d8f4ff'] }),
    am_vale: tema('planicie', {}),
    am_bosque: tema('floresta', {}),
    am_costa: tema('deserto', { w: ['#14629a', '#2096c8', '#58c8e8', '#e0fcff'], tree: 'oak', tc: G.THEMES.vila.tc, trunk: G.THEMES.vila.trunk }),
    am_oficina: tema('deserto', { g: ['#5a4632', '#765c42', '#927454', '#ae8e68', '#ccac84'], p: ['#3a3a44', '#55555f', '#70707c', '#8c8c98', '#aaaab4'], tree: 'dead' }),
    am_cidade: tema('castelo', { g: ['#141c34', '#1c2846', '#26365c', '#344a78', '#4e6aa0'], deco: ['#7ae4ff', '#ff9ae6', '#ffe27a', '#8affc0'], p: ['#2a3046', '#3a4260', '#4e587a', '#666f94', '#8a92b4'], tc: ['#0a1830', '#123060', '#1c4a8a', '#2a6ab8', '#6ab0f0'] }),
    am_portao: tema('castelo', {})
  });
  // luz ambiente por área (a do mapa é lida a cada quadro)
  const LUZ = { porto: '#fbf6ee', vale: '#fffaf0', bosque: '#d8e6d0', costa: '#fff8ec', praca: '#fbf6ee', oficina: '#f0e2d0', cidade: '#8a96c8', portao: '#6a4a7a' };
  const ta0 = G.GameMap.prototype.themeAt;
  G.GameMap.prototype.themeAt = function (tx, ty) {
    if (this.temaSala) { const t = this.temaSala[Math.floor(ty / 13) * 3 + Math.floor(tx / 24)]; if (t) return t; }
    return ta0.call(this, tx, ty);
  };

  // ------------------------------------------------------------------
  //  Arte
  // ------------------------------------------------------------------
  G.artHooks = G.artHooks || [];
  G.artHooks.push(() => {
    const SPR = G.spr;
    { // capelo de formatura (ícone e arremesso)
      const p = new G.Paint(32, 32), preto = ['#0a0810', '#1c1826', '#2e2a3c', '#46405a', '#6a6488'];
      cyl(p, inRR(8, 13, 16, 10, 3), preto, [7, 12, 25, 24]);
      p.poly([[16, 3], [31, 11], [16, 19], [1, 11]], (x, y) => (y < 11 ? preto[3] : preto[2]));
      p.line(4, 11, 16, 5, preto[4], 1);
      p.ell(16, 11, 1.6, 1.2, '#ffd84a');
      p.line(16, 11, 26, 14, '#e8b03a', 1.4); p.line(26, 14, 26, 23, '#e8b03a', 1.4);
      p.ell(26, 25, 2.2, 3, { ramp: R5('#ffd84a'), ambient: 0.5 });
      p.outline({ k: -0.8 }); SPR.capeloItem = p.toCanvas();
    }
    // coruja: de pedra (dormindo) e viva (acordada)
    for (const viva of [false, true]) {
      const p = new G.Paint(96, 112);
      const R = viva ? ['#3a2414', '#6a4426', '#9a6a3a', '#c8945a', '#f0c890'] : ['#2e2b34', '#4a4652', '#6a6674', '#8e8a98', '#bab6c4'];
      const Rd = R.map(c => C.mix(c, '#000000', 0.25));
      cyl(p, inRR(16, 96, 64, 14, 4), ['#26232c', '#3c3844', '#56525e', '#74707e', '#9a96a4'], [15, 95, 81, 111]); // pedestal
      p.ell(48, 66, 30, 34, { ramp: R, ambient: 0.4, contrast: 1.1 });
      p.ell(22, 70, 11, 25, { ramp: Rd, ambient: 0.35 }); p.ell(74, 70, 11, 25, { ramp: Rd, ambient: 0.35 });
      for (let k = 0; k < 4; k++) for (const s of [-1, 1]) p.line(48 + s * 4, 60 + k * 9, 48 + s * 12, 56 + k * 9, R[1], 1.2);
      p.ell(48, 32, 27, 22, { ramp: R, ambient: 0.45, contrast: 1.1 });
      p.poly([[24, 20], [18, 0], [36, 14]], R[2]); p.poly([[72, 20], [78, 0], [60, 14]], R[2]);
      p.ell(38, 34, 11, 10, R[4]); p.ell(58, 34, 11, 10, R[4]);
      if (viva) {
        for (const ex of [38, 58]) { p.ell(ex, 34, 7.5, 7.5, '#ffd84a'); p.ell(ex, 34, 3.6, 3.6, '#1a1008'); p.px(ex - 2, 31, '#ffffff'); p.px(ex - 1, 31, '#ffffff'); }
      } else for (const ex of [38, 58]) { p.line(ex - 7, 34, ex, 37, R[0], 2); p.line(ex, 37, ex + 7, 34, R[0], 2); }
      p.poly([[44, 40], [52, 40], [48, 50]], viva ? '#d8a440' : R[1]);
      p.ell(40, 99, 5, 3, viva ? '#d8a440' : R[1]); p.ell(56, 99, 5, 3, viva ? '#d8a440' : R[1]);
      p.outline({ k: -0.8 });
      SPR[viva ? 'corujaViva' : 'corujaPedra'] = p.toCanvas();
    }
  });

  // ------------------------------------------------------------------
  //  CAPELO DE FORMATURA — item, arremesso e relíquias
  // ------------------------------------------------------------------
  G.ITEMS.capelo = ['capeloItem', 'CAPELO DE FORMATURA', 'Selecione com ^yQ^0 e arremesse com ^yC^0! Ele voa por cima de água e cercas, acerta inimigos, aciona alavancas e ^gbusca itens^0 longe do seu alcance. Depois, volta para você.'];
  G.HEART_PIECES_TOTAL = (G.HEART_PIECES_TOTAL || 39) + 5; // 4 relíquias + o Poço das Estrelas
  const give0 = G.give;
  G.give = async function (kind, n, o) {
    if (kind === 'bolsaBombas') {
      const p = G.player, P0 = P();
      if (p) { p.state = 'hold'; p.holdItem = 'bomb'; }
      G.cutscene++;
      try {
        P0.bombMax += 5; P0.bombs = P0.bombMax; G.sfx('itemget');
        await G.ui.banner('bomb', 'BOLSA BINOMIAL', 'Uma bolsa maior para as Bombas Binomiais: agora cabem ' + P0.bombMax + ' bombas.', { color: '#c8c8ff' });
      } finally { G.cutscene--; if (p && p.state === 'hold') { p.state = 'normal'; p.holdItem = null; } }
      return;
    }
    const r = await give0.call(this, kind, n, o);
    if (kind === 'item' && n === 'capelo') P().sub = 'capelo';
    return r;
  };

  const ALCANCE = 6.5 * TS, V_IDA = 250, V_VOLTA = 290;
  class CapeloVoo extends G.Ent {
    constructor(p) {
      super(p.cx - 5, p.cy - 12, 10, 8);
      const d = G.DIRS[p.dir]; this.dx = d.x; this.dy = d.y;
      this.dono = p; this.fase = 'ida'; this.dist = 0; this.ang = 0; this.carga = null; this.acertos = new Set(); this.room = G.curRoom;
    }
    get by() { return this.y + 40; }
    bloqueado(x, y) { const tp = G.TP[G.map.tileAtPx(x, y)]; return tp.solid && !tp.low; }
    update(dt) {
      this.t += dt; this.ang += dt * 20;
      const p = this.dono;
      if (!p || G.player !== p || p.state === 'dead') { this.dead = true; return; }
      if (this.fase === 'ida') {
        const v = V_IDA * dt; this.x += this.dx * v; this.y += this.dy * v; this.dist += v;
        if (this.bloqueado(this.cx, this.cy)) { this.fase = 'volta'; G.sfx('tink'); G.fx.spark(this.cx, this.cy, '#ffffff', 4); }
        else if (this.dist >= ALCANCE) this.fase = 'volta';
        if (G.map.kind === 'dungeon') { const r = G.dun.roomAt(this.cx, this.cy); if (!r || r.idx !== G.curRoom) this.fase = 'volta'; }
      } else {
        const tx = p.cx, ty = p.cy - 10, dx = tx - this.cx, dy = ty - this.cy, d = Math.hypot(dx, dy), v = V_VOLTA * dt;
        if (d <= v + 4) { this.dead = true; this.entregar(); return; }
        this.x += dx / d * v; this.y += dy / d * v;
      }
      if (this.carga) { this.carga.x = this.cx - this.carga.w / 2; this.carga.y = this.cy - this.carga.h / 2; if (this.carga instanceof G.Pickup) { this.carga.z = 0; this.carga.t = Math.max(this.carga.t, 0.3); } }
      this.colidir();
      if (Math.random() < 0.5) G.fx.spawn({ x: this.cx + G.rf(-2, 2), y: this.cy, vy: -4, life: 0.25, color: '#ffd84a', size: 1 });
    }
    colidir() {
      const box = { x: this.x - 2, y: this.y - 2, w: this.w + 4, h: this.h + 4 };
      for (const e of G.ents) {
        if (e === this || e.dead || e === this.dono || e === this.carga || this.acertos.has(e) || !G.sameRoom(e)) continue;
        if (e.onCapelo) { if (G.overlap(box, e.capeloBox ? e.capeloBox() : e)) { this.acertos.add(e); e.onCapelo(this); this.fase = 'volta'; } continue; }
        if (e.isEnemy && G.overlap(box, e.hurtbox ? e.hurtbox() : e)) {
          this.acertos.add(e); this.fase = 'volta'; G.fx.spark(this.cx, this.cy, '#ffffff', 6);
          if (e.isBoss) G.sfx('tink'); else e.onHit(2 + (P().swordLv || 0), this.cx, this.cy, 'capelo', false);
          continue;
        }
        if (!this.carga && e instanceof G.Pickup && G.overlap(box, e)) { this.carga = e; this.fase = 'volta'; G.sfx('clink'); continue; }
        if ((e instanceof G.Lever || e instanceof G.Brazier || e instanceof G.Pot) && G.overlap(box, e)) { this.acertos.add(e); this.fase = 'volta'; if (e.onHit) e.onHit(1, this.cx, this.cy, 'capelo'); }
      }
    }
    entregar() {
      const c = this.carga, p = this.dono; if (!c) return;
      if (c.entregar) c.entregar(); else { c.x = p.cx - c.w / 2; c.y = p.cy - c.h / 2; }
    }
    draw(ctx, cam) {
      const x = this.cx - cam.x, y = this.cy - cam.y;
      G.shadow(ctx, x, y + 12, 9, 0.25);
      if (this.carga && this.carga.spr) G.draw(ctx, this.carga.spr, x - 8, y - 2);
      const s = Math.sin(this.ang);
      ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.75 + 0.25 * Math.abs(s)); ctx.rotate(s * 0.25);
      G.draw(ctx, 'capeloItem', -8, -8);
      ctx.restore();
      G.light.add(x, y, 16, '#ffe8a0', 0.4);
    }
  }
  G.CapeloVoo = CapeloVoo;
  const pup = G.Player.prototype.update;
  G.Player.prototype.update = function (dt) {
    // o herói continua andando enquanto o capelo voa
    if (this.state === 'normal' && G.P.sub === 'capelo' && G.P.items.capelo && G.input.pressed('c') && this.z <= 0 && !this.carry && !G.cutscene && !G.ents.some(e => e instanceof CapeloVoo && !e.dead)) {
      G.addEnt(new CapeloVoo(this)); this.castT = 0.2; G.sfx('capelo');
    }
    pup.call(this, dt);
  };

  // relíquia num pedestal fora do alcance do herói: só o capelo a busca
  const RELIQ = {
    heartPiece: { spr: 'heartPiece', dar: () => G.give('heartPiece') },
    potion: { spr: 'potion', dar: () => G.give('potion') },
    bolsaBombas: { spr: 'bomb', dar: () => G.give('bolsaBombas') },
    moedas: { spr: 'iconCoin', dar: () => G.give('coin', 50) }
  };
  class Reliquia extends G.Ent {
    constructor(x, y, flag, tipo) { super(x + 3, y + 8, 10, 7); this.solid = true; this.flag = flag; this.tipo = tipo; this.room = -1; this.levada = G.flag(flag); }
    get darkGlow() { return this.levada ? 0 : 26; }
    capeloBox() { return { x: this.x - 3, y: this.y - 22, w: this.w + 6, h: this.h + 24 }; }
    onCapelo(cap) {
      if (this.levada) return;
      this.levada = true; G.sfx('clink');
      const r = RELIQ[this.tipo], flag = this.flag;
      cap.carga = { x: 0, y: 0, w: 10, h: 10, spr: r.spr, entregar: () => { G.P.flags[flag] = true; G.runScript(() => r.dar()); } };
    }
    update(dt) { this.t += dt; }
    draw(ctx, cam) {
      const x = this.x - 3 - cam.x, base = this.y + this.h - cam.y;
      ctx.save();
      ctx.fillStyle = '#1b1428'; G.rrPath(ctx, x + 2, base - 12, 12, 13, 2); ctx.fill();
      const g = ctx.createLinearGradient(x, 0, x + 16, 0); g.addColorStop(0, '#b8b2c8'); g.addColorStop(1, '#6a6480');
      ctx.fillStyle = g; G.rrPath(ctx, x + 2.5, base - 11.5, 11, 12, 2); ctx.fill();
      ctx.fillStyle = '#ffd84a'; ctx.fillRect(x + 3, base - 11, 10, 1);
      ctx.restore();
      if (this.levada) return;
      const by = base - 26 + Math.sin(this.t * 2.5) * 1.5;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, x + 8, by + 8, 14, '#fff0b0', 0.35 + 0.15 * Math.sin(this.t * 4)); ctx.restore();
      G.draw(ctx, RELIQ[this.tipo].spr, x, by);
      G.light.add(x + 8, by + 8, 30, '#fff0b0', 0.6);
    }
  }

  // ------------------------------------------------------------------
  //  CORUJA DO SABER (canto sudoeste do Pântano de Bayes)
  // ------------------------------------------------------------------
  class Coruja extends G.Ent {
    constructor(x, y) { super(x + 2, y + 8, 28, 8); this.solid = true; this.room = -1; this.abre = P().flags.corujaAcordou ? 1 : 0; this.alvo = this.abre; }
    get darkGlow() { return 44; }
    interBox() { return { x: this.x - 12, y: this.y - 40, w: this.w + 92, h: this.h + 60 }; }
    capeloBox() { return { x: this.x - 2, y: this.y - 50, w: this.w + 4, h: 48 }; }
    interact() {
      G.runScript(async () => {
        if (P().flags.corujaAcordou) { await perguntaVoo(); return; }
        await say('Coruja de pedra', 'Uma coruja de pedra gigante, de olhos fechados, sozinha na ilhota. Na base está escrito: "Só passa quem se formou."');
        if (P().items.capelo) await say(null, 'Na formatura, todo mundo joga o capelo para o alto... E se ele parasse na cabeça dela?');
      });
    }
    onCapelo() { if (!P().flags.corujaAcordou) G.runScript(() => acordarCoruja(this)); }
    update(dt) { this.t += dt; this.abre = G.approach(this.abre, this.alvo, dt * 0.8); }
    draw(ctx, cam) {
      const x = this.cx - cam.x, base = this.y + this.h - cam.y, s = G.spr.corujaPedra;
      if (!s) return;
      G.shadow(ctx, x, base, 40, 0.35);
      const tr = this.tremor > 0 ? Math.sin(this.t * 70) * this.tremor : 0;
      G.draw(ctx, 'corujaPedra', x - G.lw(s) / 2 + tr, base - G.lh(s) + 4);
      if (this.abre > 0) G.draw(ctx, 'corujaViva', x - G.lw(s) / 2 + tr, base - G.lh(s) + 4, { alpha: this.abre });
      if (P().flags.corujaAcordou) {
        G.light.add(x - 5, base - 42, 22, '#ffd84a', 0.5 * this.abre); G.light.add(x + 5, base - 42, 22, '#ffd84a', 0.5 * this.abre);
        G.draw(ctx, 'capeloItem', x - 8, base - G.lh(s) - 2);
      }
    }
  }
  async function acordarCoruja(cor) {
    const p = G.player;
    P().flags.corujaAcordou = true;
    G.music(null); cor.tremor = 1.5; G.shake(2, 1.2); G.sfx('crackle');
    for (let i = 0; i < 6; i++) { G.fx.burst(cor.cx + G.rf(-14, 14), cor.y - G.rf(10, 44), ['#8e8a98', '#bab6c4', '#ffd84a'], 6, 50, { grav: 200 }); await G.wait(0.2); }
    cor.tremor = 0; cor.alvo = 1; G.flash('#fff0c0', 0.4, 0.6);
    await G.wait(1.2);
    G.sfx('coruja'); await G.wait(0.9);
    G.music('amanha');
    await say(CORUJA, 'Huuu... Um capelo! Então alguém finalmente se formou.');
    await say(CORUJA, 'Eu guardo o caminho para as ^cTerras do Amanhã^0. Lá, tudo o que você aprendeu serve para uma coisa: ^yprever^0.');
    await say(CORUJA, 'Média, variância, probabilidade, amostras... é o alfabeto. Nas Terras do Amanhã, usam esse alfabeto para escrever coisas enormes.');
    G.saveGame();
    if (p) p.dir = 2;
    await perguntaVoo(true);
  }
  async function perguntaVoo(primeira) {
    const r = await ask(CORUJA, primeira ? 'Suba nas minhas costas. Vamos?' : 'Voamos para as Terras do Amanhã?', ['Voar!', 'Ainda não'], { cancel: 1 });
    if (r === 0) await G.amanhaVoar('ida'); else G.restoreMusic();
  }

  // cena do voo (por cima de tudo, enquanto a tela escurece e clareia)
  class CenaVoo {
    constructor(res, sentido) { this.res = res; this.sentido = sentido; this.t = 0; this.isPause = false; }
    update(dt) {
      this.t += dt;
      if (this.t > 3 && !this.saindo) { this.saindo = true; G.ui.fade(1, 0.5); }
      if (this.t > 3.6) { this.done = true; this.res(); }
    }
    draw(ctx) {
      const W = G.W, H = G.H, t = this.t, ida = this.sentido === 'ida';
      const g = ctx.createLinearGradient(0, 0, 0, H);
      if (ida) { g.addColorStop(0, '#3a5ab8'); g.addColorStop(0.55, '#e88aa8'); g.addColorStop(1, '#ffd890'); } else { g.addColorStop(0, '#2a3a6a'); g.addColorStop(0.6, '#7a8a6a'); g.addColorStop(1, '#4a6a3a'); }
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, W * 0.78, H * 0.72, 70, '#ffe0a0', 0.5); ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      for (let i = 0; i < 9; i++) { const sp = 60 + (i % 3) * 50, x = ((G.hash2(i, 3, 7) * (W + 120) - t * sp) % (W + 120) + W + 120) % (W + 120) - 60, y = 20 + G.hash2(i, 5, 7) * (H - 60); ctx.beginPath(); ctx.ellipse(x, y, 22 + (i % 3) * 8, 6, 0, 0, TAU); ctx.fill(); }
      // coruja carregando Sigma
      const cx = W / 2 + Math.sin(t * 1.3) * 12, cy = H / 2 - 10 + Math.sin(t * 2.1) * 6, bat = Math.sin(t * 9);
      const hs = G.spr[G.spriteHeroi(false) + '_down0'];
      if (hs) G.draw(ctx, hs, cx - G.lw(hs) / 2, cy + 18);
      ctx.save(); ctx.fillStyle = '#6a4426';
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + s * 10, cy); ctx.quadraticCurveTo(cx + s * 40, cy - 14 - bat * 16, cx + s * 64, cy - 4 - bat * 22); ctx.quadraticCurveTo(cx + s * 36, cy + 10, cx + s * 10, cy + 12); ctx.fill(); }
      ctx.restore();
      const s = G.spr.corujaViva;
      if (s) { ctx.save(); ctx.translate(cx, cy); ctx.scale(0.6, 0.6); G.draw(ctx, s, -G.lw(s) / 2, -G.lh(s) * 0.6); ctx.restore(); }
      G.text(ida ? 'Rumo às Terras do Amanhã...' : 'De volta ao Pântano de Bayes...', W / 2, H - 22, '#ffffff', { align: 'center', outline: '#1a1028' });
    }
  }
  const origemRegiao = (nome) => { const W = G.world; for (let r = 0; r < W.REG.length; r++) for (let c = 0; c < W.REG[r].length; c++) if (W.REG[r][c] === nome) return [c * W.RW, r * W.RH]; return [0, 0]; };
  const voo = (sentido) => new Promise(res => G.ui.push(new CenaVoo(res, sentido)));
  const MARGEM = { reg: 'pantano', lx: 9, ly: 27 }; // onde o herói fica na volta
  G.amanhaVoar = async (sentido) => {
    G.sfx('coruja');
    await G.ui.fade(1, 0.4);
    const cena = voo(sentido);
    await G.ui.fade(0, 0.3);
    await cena;
    G.music(null);
    if (sentido === 'ida') {
      G.dun.load('d8');
      P().lastDungeon = 'd8';
    } else {
      const [ox, oy] = origemRegiao(MARGEM.reg);
      G.world.loadOverworld((ox + MARGEM.lx) * TS + 3, (oy + MARGEM.ly) * TS + 2);
      G.player.dir = 2; P().lastDungeon = null; P().lastPos = { x: G.player.x, y: G.player.y };
    }
    G.saveGame();
    await G.ui.fade(0, 0.6);
  };
  // a saída "normal" das Terras (morte, menu) também volta para a margem da coruja
  const exit0 = G.exitDungeon;
  G.exitDungeon = () => { if (G.map && G.map.id === 'd8') G.runScript(() => G.amanhaVoar('volta')); else exit0(); };

  // ------------------------------------------------------------------
  //  POÇO DAS ESTRELAS (Vila Gauss)
  // ------------------------------------------------------------------
  class Poco extends G.Ent {
    constructor(x, y) { super(x, y, 32, 32); this.solid = false; this.room = -1; }
    interBox() { return { x: this.x - 6, y: this.y - 6, w: this.w + 12, h: this.h + 14 }; }
    interact() {
      G.runScript(async () => {
        const P0 = P();
        if (P0.flags.pocoEstrelas) { await say('Poço das Estrelas', 'As estrelas continuam lá no fundo. A constelação da coruja aponta para o sudoeste.'); return; }
        if (!P0.flags.boss_d7) {
          await say('Poço', 'Você olha para o fundo... e vê ^cestrelas^0 refletidas na água, em pleno dia!');
          await say('Poço', P0.flags.pocoVisto ? 'Elas parecem formar um desenho, mas a água está turva demais. Quem entende de céu talvez saiba explicar.' : 'Que estranho. De onde vêm essas estrelas?');
          P0.flags.pocoVisto = true; return;
        }
        await say('Poço das Estrelas', 'Desde que o telescópio do Observatório voltou a funcionar, a água do poço ficou límpida...');
        await new Promise(res => G.ui.push(new CenaEstrelas(res)));
        await say('Poço das Estrelas', 'As estrelas formaram uma ^ycoruja^0, com os olhos voltados para o ^csudoeste^0... para o canto do Pântano de Bayes.');
        P0.flags.pocoEstrelas = true;
        await say(null, 'O balde sobe sozinho, trazendo alguma coisa que brilha.');
        await G.give('heartPiece');
      });
    }
  }
  // reflexo no poço: estrelas que se ligam numa coruja e uma seta para o sudoeste
  // tufos das orelhas, cabeça, ombros, quadris e pés; os olhos (9 e 10) brilham dourados
  const CONST = [[-16, -40], [-10, -28], [10, -28], [16, -40], [-20, -10], [20, -10], [-14, 10], [14, 10], [0, 18], [-7, -20], [7, -20], [0, -13]];
  const LIGA = [[0, 1], [1, 2], [2, 3], [0, 4], [3, 5], [4, 6], [5, 7], [6, 8], [7, 8], [9, 11], [10, 11]];
  class CenaEstrelas {
    constructor(res) { this.res = res; this.t = 0; this.isPause = false; }
    update(dt) { this.t += dt; if (this.t > 2.5 && (G.input.pressed('confirm') || G.input.pressed('cancel')) || this.t > 7) { this.done = true; this.res(); } }
    draw(ctx) {
      const W = G.W, H = G.H, t = this.t, cx = W / 2, cy = H / 2 + 6;
      ctx.fillStyle = 'rgba(2,2,10,' + Math.min(0.9, t * 1.5) + ')'; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.beginPath(); ctx.ellipse(cx, cy, 86, 70, 0, 0, TAU); ctx.clip();
      const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, 90); g.addColorStop(0, '#162048'); g.addColorStop(1, '#04060e'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 70; i++) { ctx.globalAlpha = 0.3 + 0.5 * Math.abs(Math.sin(t * 1.5 + i)); ctx.fillStyle = '#ffffff'; ctx.fillRect(cx - 86 + G.hash2(i, 1, 9) * 172, cy - 70 + G.hash2(i, 2, 9) * 140, 0.5, 0.5); }
      ctx.globalAlpha = 1;
      const k = Math.min(1, Math.max(0, (t - 1) / 2.2)), sc = 1.6;
      ctx.strokeStyle = 'rgba(255,230,160,0.8)'; ctx.lineWidth = 0.7;
      LIGA.forEach(([a, b], i) => { const kk = Math.min(1, Math.max(0, k * LIGA.length - i)); if (kk <= 0) return; const [x0, y0] = CONST[a], [x1, y1] = CONST[b]; ctx.beginPath(); ctx.moveTo(cx + x0 * sc, cy + y0 * sc); ctx.lineTo(cx + (x0 + (x1 - x0) * kk) * sc, cy + (y0 + (y1 - y0) * kk) * sc); ctx.stroke(); });
      for (const [i, [x, y]] of CONST.entries()) { const olho = i === 9 || i === 10; ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, cx + x * sc, cy + y * sc, olho ? 9 : 5, olho ? '#ffd84a' : '#fff0c0', olho ? 0.4 + 0.5 * k : 0.6); ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#ffffff'; ctx.fillRect(cx + x * sc - 0.75, cy + y * sc - 0.75, 1.5, 1.5); }
      if (t > 3.6) { const a = Math.min(1, (t - 3.6) * 2), fx = cx - 30 - Math.sin(t * 3) * 3; ctx.globalAlpha = a; ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.moveTo(fx - 24, cy + 40); ctx.lineTo(fx - 10, cy + 40); ctx.lineTo(fx - 22, cy + 28); ctx.closePath(); ctx.fill(); ctx.fillRect(fx - 20, cy + 28, 2, 1); ctx.strokeStyle = '#ffd84a'; ctx.beginPath(); ctx.moveTo(fx - 21, cy + 37); ctx.lineTo(fx - 4, cy + 20); ctx.stroke(); ctx.globalAlpha = 1; }
      ctx.restore();
      ctx.strokeStyle = '#6a5a4a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(cx, cy, 87, 71, 0, 0, TAU); ctx.stroke();
      if (t > 2.5) G.text('X: continuar', W - 8, H - 12, '#9a98b0', { align: 'right' });
    }
  }

  // ------------------------------------------------------------------
  //  No mundo: coruja, poço, relíquias e o que os moradores comentam
  // ------------------------------------------------------------------
  G.SPAWN = G.SPAWN || {};
  G.SPAWN.coruja = o => new Coruja(o.x, o.y);
  G.SPAWN.poco = o => new Poco(o.x, o.y);
  G.SPAWN.reliquia = o => new Reliquia(o.x, o.y, o.flag, o.tipo);
  // [região, x, y, conteúdo, laguinho cavado (true) ou água que já existe (false)]
  const RELIQUIAS = [
    ['lago', 26, 22, 'heartPiece', false], ['pantano', 30, 14, 'potion', false],
    ['planicie', 17, 5, 'bolsaBombas', true], ['floresta', 13, 16, 'heartPiece', true], ['deserto', 37, 10, 'moedas', true],
    ['montanha', 32, 7, 'heartPiece', true], ['castelo', 26, 21, 'bolsaBombas', true], ['vulcao', 30, 16, 'potion', true], ['vila', 40, 23, 'heartPiece', true]
  ];
  G.worldExtras = G.worldExtras || [];
  G.worldExtras.push(h => {
    const { regionOf, setT, protect, objects, nodes, wall, block, prot, idx } = h;
    // laguinho 5x5 com um pedestal no meio: o herói não alcança (nem pulando); o capelo, sim
    for (const [reg, lx, ly, tipo, cavar] of RELIQUIAS) {
      const R = regionOf(reg), cx = R.ox + lx, cy = R.oy + ly;
      if (cavar) {
        for (let y = cy - 3; y <= cy + 4; y++) for (let x = cx - 3; x <= cx + 3; x++) {
          const i = idx(x, y); wall[i] = 0; prot[i] = 1; block[i] = 1;
          setT(x, y, Math.abs(x - cx) <= 2 && Math.abs(y - cy) <= 2 ? T.WATER : T.GROUND);
        }
        for (let x = cx - 1; x <= cx + 1; x++) block[idx(x, cy + 4)] = 0;
        nodes[reg].push([cx, cy + 4]);
      }
      objects.push({ type: 'reliquia', x: cx * TS, y: cy * TS - 6, flag: 'cap_' + reg, tipo });
    }
    // a coruja numa ilhota no canto sudoeste do pântano, com a margem a leste
    {
      const R = regionOf('pantano');
      for (let y = 24; y <= 29; y++) for (let x = 2; x <= 10; x++) {
        const X = R.ox + x, Y = R.oy + y, i = idx(X, Y);
        wall[i] = 0; prot[i] = 1; block[i] = 1;
        const ilha = x >= 4 && x <= 5 && y >= 27 && y <= 28, margem = x >= 9 && y >= 26;
        setT(X, Y, ilha || margem ? T.GROUND : T.WATER);
      }
      for (const y of [27, 28]) block[idx(R.ox + 10, R.oy + y)] = 0;
      nodes.pantano.push([R.ox + 10, R.oy + 27]);
      protect(R.ox + 9, R.oy + 25, R.ox + 12, R.oy + 29);
      objects.push({ type: 'coruja', x: (R.ox + 3) * TS + 8, y: (R.oy + 27) * TS });
      objects.push({ type: 'sign', x: (R.ox + 11) * TS, y: (R.oy + 26) * TS, text: '^yCORUJA DO SABER^0\n"Só passa quem se formou."' });
    }
    // o poço da vila (2x2) vira interativo
    { const R = regionOf('vila'); objects.push({ type: 'poco', x: (R.ox + 23) * TS, y: (R.oy + 15) * TS }); }
  });

  // marcadores: Gauss chama para a formatura; "?" no mapa onde a coruja dorme
  const mk0 = G.npcMarker;
  G.npcMarker = n => (n.scriptId === 'gauss' && P() && P().flags.won && !P().flags.formatura ? 'markerBang' : mk0 ? mk0(n) : null);
  const mapa0 = G.drawMapExtra;
  G.drawMapExtra = (ctx, ox, oy, sc, seenAt) => {
    if (mapa0) mapa0(ctx, ox, oy, sc, seenAt);
    const P0 = P(); if (!P0 || P0.flags.corujaAcordou || !(P0.flags.pocoEstrelas || P0.flags.formatura) || Math.floor(G.time * 3) % 3 === 0) return;
    const o = G.world.ow.objects.find(ob => ob.type === 'coruja'); if (!o) return;
    G.text('?', Math.round(ox + o.x / 16 * sc) + 1, Math.round(oy + o.y / 16 * sc) - 7, '#7ae4ff', { align: 'center', outline: '#1a1028' });
  };
  const hint0 = G.nextHint;
  G.nextHint = function () {
    const P0 = P();
    if (P0.flags.won && !P0.flags.formatura) return 'Venha até a praça, Sigma: o reino preparou uma surpresa para você!';
    if (P0.flags.formatura && !P0.flags.corujaAcordou) return 'A ^yCoruja do Saber^0 dorme no canto sudoeste do ^cPântano de Bayes^0. Lembra o que se faz com o capelo numa formatura?';
    if (P0.flags.corujaAcordou && !P0.flags.amanhaPortao) return 'As ^cTerras do Amanhã^0 esperam por você. Fale com a coruja no Pântano de Bayes.';
    return hint0();
  };
  const N = G.NPCS;
  // o reino comenta os mistérios
  const kid0 = N.kid1;
  N.kid1 = async (n) => {
    const P0 = P();
    if (P0 && !P0.flags.tico_poco) { P0.flags.tico_poco = true; await say('Tico', 'Sabia que dá para ver ESTRELAS no fundo do poço, de dia? Minha mãe não acredita!'); return; }
    return kid0(n);
  };
  const bayes0 = N.bayes;
  N.bayes = async (n) => {
    const P0 = P();
    if (P0 && P0.flags.metBayes && !P0.flags.bayes_coruja) {
      P0.flags.bayes_coruja = true;
      await say('Sábio Bayes', 'Já viu a coruja de pedra no canto sudoeste deste pântano? Minha crença ^ya priori^0 é que um dia ela acorda... e cada herói que passa por aqui aumenta essa probabilidade.', { portrait: 'bayes_down0' });
    }
    return bayes0(n);
  };
  const gert0 = N.gertrude;
  if (gert0) N.gertrude = async (n) => {
    const P0 = P();
    if (P0 && P0.flags.boss_d7 && !P0.flags.gert_poco) {
      P0.flags.gert_poco = true;
      await say('Professora Gertrude', 'Sabia que o primeiro observatório de Datália foi o ^ypoço da Vila Gauss^0? Os antigos mediam o céu pelo reflexo na água. Agora que o telescópio voltou, vá dar uma olhada!', { portrait: 'gertrude_down0' });
      return;
    }
    return gert0(n);
  };

  // ------------------------------------------------------------------
  //  FORMATURA (Mestre Gauss, depois de vencer o Viés)
  // ------------------------------------------------------------------
  class CapeloFesta extends G.Ent {
    constructor(x, y) { super(x, y, 8, 8); this.room = -1; this.z = 0; this.vz = G.rf(150, 220); this.vx = G.rf(-20, 20); this.giro = G.rf(-8, 8); this.alwaysUpdate = true; }
    update(dt) { this.t += dt; this.z += this.vz * dt; this.vz -= 160 * dt; this.x += this.vx * dt; if (this.z < 0 && this.vz < 0) this.dead = true; }
    get by() { return this.y + 200; }
    draw(ctx, cam) { ctx.save(); ctx.translate(this.cx - cam.x, this.cy - this.z - cam.y); ctx.rotate(this.t * this.giro); G.draw(ctx, 'capeloItem', -8, -8); ctx.restore(); }
  }
  async function formatura() {
    const nm = 'Mestre Gauss', por = 'gauss_down0', p = G.player;
    await say(nm, 'Sigma! O reino inteiro veio até a praça. Hoje é dia de ^yformatura^0!', { portrait: por });
    G.music('ending');
    await say(nm, 'Média, mediana, dispersão, probabilidade, distribuições, amostras... e a coragem de procurar a verdade mesmo quando ela nos contraria.', { portrait: por });
    await say(nm, 'Você aprendeu tudo isso. Em nome de Datália: parabéns, {formado|formada}!', { portrait: por });
    await G.give('item', 'capelo');
    // o povo joga os capelos para o alto
    G.sfx('fanfare');
    for (let i = 0; i < 16; i++) { G.addEnt(new CapeloFesta(p.cx + G.rf(-90, 90), p.cy + G.rf(-30, 40))); if (i % 4 === 3) await G.wait(0.15); }
    await G.wait(2.2);
    await say(nm, 'Esse capelo voa longe e sempre volta para quem o lançou. Use-o bem!', { portrait: por });
    await say(nm, 'Ah, e dizem que a ^yCoruja do Saber^0, no canto sudoeste do ^cPântano de Bayes^0, só acorda para quem se formou...', { portrait: por });
    P().flags.formatura = true; G.saveGame(); G.restoreMusic();
  }
  const gauss0 = N.gauss;
  N.gauss = async (n) => { if (P().flags.won && !P().flags.formatura) return formatura(); return gauss0(n); };

  // ------------------------------------------------------------------
  //  TERRAS DO AMANHÃ — mapa de telas, como uma masmorra a céu aberto
  // ------------------------------------------------------------------
  const sala = (at, area, tema) => ({ at, type: 'amanha', area, tema, noTorch: true, semIcone: true });
  G.DUNGEONS.d8 = { name: 'Terras do Amanhã', theme: 'am_base', music: 'amanha', topic: 'd6', grid: [3, 3],
    rooms: {
      S: sala([1, 2], 'porto', 'am_porto'), V: sala([0, 2], 'vale', 'am_vale'), Bq: sala([0, 1], 'bosque', 'am_bosque'),
      Cs: sala([0, 0], 'costa', 'am_costa'), Pr: sala([1, 1], 'praca', 'am_porto'), Of: sala([2, 1], 'oficina', 'am_oficina'),
      Ci: sala([1, 0], 'cidade', 'am_cidade'), Pt: sala([2, 0], 'portao', 'am_portao')
    },
    doors: [['S', 'V', 'open'], ['S', 'Pr', 'open'], ['V', 'Bq', 'open'], ['Bq', 'Pr', 'open'], ['Bq', 'Cs', 'open'], ['Cs', 'Ci', 'open'], ['Pr', 'Ci', 'open'], ['Pr', 'Of', 'open'], ['Ci', 'Pt', 'open']] };
  const AREA = {
    porto: ['Porto dos Dados', 'onde chegam todos os dados'],
    vale: ['Vale das Medidas', 'Regressão'],
    bosque: ['Bosque das Decisões', 'Classificação'],
    costa: ['Costa das Marés', 'Séries Temporais'],
    praca: ['Praça do Horizonte', 'o centro das Terras do Amanhã'],
    oficina: ['Oficina dos Autômatos', 'Aprendizado de Máquina'],
    cidade: ['Cidade das Mentes', 'Inteligência Artificial'],
    portao: ['Portão do Amanhã', '???']
  };
  const load0 = G.dun.load;
  G.dun.load = function (did) {
    load0.call(this, did);
    if (did !== 'd8') return;
    const S = G.map.byKey.S, p = G.player;
    p.x = S.px + 6 * TS; p.y = S.py + 9 * TS; p.dir = 1; p.lastSafe = { x: p.x, y: p.y };
    G.ui.regionBanner('Terras do Amanhã', 'onde a Estatística vira previsão');
  };

  // chão a céu aberto: bordas de árvores, trilhas das portas até o centro
  function aoArLivre(c, o = {}) {
    const { r, setL, getL, map } = c, borda = o.borda || T.TREE;
    map.temaSala = map.temaSala || {}; map.temaSala[r.idx] = r.tema;
    const porta = (lx, ly) => (ly === 0 || ly === 12) ? (lx === 11 || lx === 12) && r.doors[ly === 0 ? 'N' : 'S'] : (lx === 0 || lx === 23) && ly >= 5 && ly <= 7 && r.doors[lx === 0 ? 'W' : 'E'];
    for (let ly = 0; ly < 13; ly++) for (let lx = 0; lx < 24; lx++) {
      const b = lx === 0 || ly === 0 || lx === 23 || ly === 12;
      if (b) setL(lx, ly, porta(lx, ly) ? (o.chao || T.PATH) : borda);
      else setL(lx, ly, (lx * 7 + ly * 13 + r.idx) % 11 === 0 ? T.GROUND2 : T.GROUND);
    }
    // segunda fileira irregular de árvores, longe das portas
    for (let ly = 1; ly < 12; ly++) for (let lx = 1; lx < 23; lx++) {
      if (!(lx === 1 || ly === 1 || lx === 22 || ly === 11)) continue;
      if (Math.abs(lx - 11.5) < 3 && (ly === 1 || ly === 11)) continue;
      if (ly >= 4 && ly <= 8 && (lx === 1 || lx === 22)) continue;
      if (G.hash2(r.idx * 31 + lx, ly, 4) < 0.5) setL(lx, ly, borda);
    }
    // trilhas
    const trilha = (x0, y0, x1, y1) => { for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) if (getL(x, y) !== borda) setL(x, y, o.chao || T.PATH); };
    if (r.doors.N) trilha(11, 1, 12, 7); if (r.doors.S) trilha(11, 5, 12, 11);
    if (r.doors.W) trilha(1, 6, 12, 7); if (r.doors.E) trilha(11, 6, 22, 7);
  }
  const placaCoruja = (c, lx, ly, txt) => c.add(new G.Sign(...c.L(lx, ly), txt, { name: CORUJA }), c.r.idx);
  const npc = (c, lx, ly, spr, nome, fn) => c.add(new G.NPC(...c.L(lx, ly), spr, nome, fn, { room: c.r.idx }), c.r.idx);
  const quadro = (c, lx, ly, w, h, fn) => c.add(new G.Board(...c.L(lx, ly), w, h, fn), c.r.idx);
  function lousa(ctx, x, y, w, h, titulo) {
    ctx.save();
    ctx.fillStyle = '#4a3020'; ctx.fillRect(x + 6, y + h, 2, 8); ctx.fillRect(x + w - 8, y + h, 2, 8);
    ctx.fillStyle = '#1b1428'; G.rrPath(ctx, x - 1, y - 1, w + 2, h + 2, 2); ctx.fill();
    ctx.fillStyle = '#2a4a3a'; G.rrPath(ctx, x, y, w, h, 2); ctx.fill();
    ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 1; G.rrPath(ctx, x + 0.5, y + 0.5, w - 1, h - 1, 2); ctx.stroke();
    ctx.restore();
    if (titulo) G.text(titulo, x + w / 2, y + 2, '#e8f0d8', { align: 'center', shadow: false });
  }

  G.PUZ.amanha = (c) => {
    const area = c.r.area, f = AREAS[area];
    const pz = f ? f(c) || {} : {};
    const enter0 = pz.enter;
    pz.enter = () => {
      G.THEMES.am_base.amb = LUZ[area] || '#fbf6ee';
      const fl = 'am_visto_' + area;
      if (!G.flag(fl)) { G.setFlag(fl); G.ui.regionBanner(AREA[area][0], AREA[area][1]); }
      if (enter0) enter0();
    };
    return pz;
  };
  const AREAS = {};

  // ---------- PORTO DOS DADOS (chegada) ----------
  class RioDeDados extends G.Ent { // "bits" brilhantes descendo o rio
    constructor(x, y, w, h) { super(x, y, w, h); this.room = G.curRoom; }
    get by() { return -90000 + this.y; }
    update(dt) { this.t += dt; }
    draw(ctx, cam) {
      for (let i = 0; i < 26; i++) {
        const v = 14 + (i % 5) * 6, x = this.x - cam.x + ((G.hash2(i, 1, 3) * this.w + this.t * v) % this.w), y = this.y - cam.y + 4 + G.hash2(i, 2, 3) * (this.h - 8);
        G.text(i % 3 ? '1' : '0', x, y, i % 2 ? 'rgba(160,240,255,0.7)' : 'rgba(255,240,160,0.7)', { shadow: false });
      }
    }
  }
  class CorujaPorto extends G.Ent {
    constructor(x, y) { super(x + 2, y + 8, 28, 8); this.solid = true; this.room = G.curRoom; }
    get darkGlow() { return 40; }
    interact() {
      G.runScript(async () => {
        const r = await ask(CORUJA, 'Quer voltar ao Pântano de Bayes?', ['Voltar', 'Ainda não', 'O que são estas terras?'], { cancel: 1 });
        if (r === 0) await G.amanhaVoar('volta');
        else if (r === 2) await falaChegada();
      });
    }
    update(dt) { this.t += dt; }
    draw(ctx, cam) {
      const s = G.spr.corujaViva; if (!s) return;
      const x = this.cx - cam.x, base = this.y + this.h - cam.y, pis = Math.floor(this.t * 0.7) % 7 === 0;
      G.shadow(ctx, x, base, 40, 0.35);
      G.draw(ctx, pis ? 'corujaPedra' : 'corujaViva', x - G.lw(s) / 2, base - G.lh(s) + 4);
      G.draw(ctx, 'capeloItem', x - 8, base - G.lh(s) - 2);
    }
  }
  async function falaChegada() {
    await say(CORUJA, 'Estas são as ^cTerras do Amanhã^0. Aqui, as pessoas usam dados para ^yPREVER^0: o tempo, as marés, as colheitas, até as palavras de uma conversa.');
    await say(CORUJA, 'Cada canto destas terras é uma grande área da ^ymodelagem preditiva^0. E todas foram construídas com o que você já sabe.');
    await say(CORUJA, 'Explore à vontade: aqui não há monstros. Só curiosidade.');
  }
  AREAS.porto = (c) => {
    const { r, setL } = c;
    aoArLivre(c);
    for (let lx = 1; lx < 23; lx++) for (const ly of [2, 3]) setL(lx, ly, lx === 11 || lx === 12 ? T.BRIDGE : T.WATER);
    c.add(new RioDeDados(r.px + TS, r.py + 2 * TS, 22 * TS, 2 * TS), r.idx);
    c.add(new CorujaPorto(...c.L(4, 6)), r.idx);
    placaCoruja(c, 15, 8, '^yTERRAS DO AMANHÃ^0\nTudo o que você aprendeu é o chão destas terras. Siga as trilhas e conheça cada área!');
    return { enter() { if (!G.flag('am_chegou')) { G.setFlag('am_chegou'); G.runScript(async () => { await G.wait(0.8); await falaChegada(); }); } } };
  };

  // ---------- VALE DAS MEDIDAS (Regressão) ----------
  AREAS.vale = (c) => {
    const { r, setL } = c;
    aoArLivre(c);
    for (let ly = 3; ly <= 9; ly += 2) for (let lx = 3; lx <= 8; lx++) setL(lx, ly, T.TALLGRASS);
    // dados do lavrador: horas de sol x altura das mudas (gerados uma vez por visita)
    const X = [1, 2, 3, 3, 4, 5, 6, 6, 7, 8], Y = X.map(x => 6 + 5 * x + G.rf(-4, 4));
    const mx = st.mean(X), my = st.mean(Y); let sxy = 0, sxx = 0; X.forEach((x, i) => { sxy += (x - mx) * (Y[i] - my); sxx += (x - mx) ** 2; });
    const b1 = sxy / sxx, b0 = my - b1 * mx, res = st.std(Y.map((y, i) => y - (b0 + b1 * X[i])));
    const muda = { altura: 0, alvo: 0, plantada: false };
    quadro(c, 13, 2, 7 * TS, 60, (ctx, x, y) => {
      lousa(ctx, x, y, 7 * TS, 56, 'altura × horas de sol');
      const px = v => x + 10 + (v / 9) * (7 * TS - 18), py = v => y + 50 - (v / 55) * 38;
      ctx.fillStyle = 'rgba(232,240,216,0.6)'; ctx.fillRect(x + 8, y + 12, 0.5, 38); ctx.fillRect(x + 8, y + 50, 7 * TS - 14, 0.5);
      ctx.fillStyle = '#ffe27a'; X.forEach((xx, i) => { ctx.beginPath(); ctx.arc(px(xx), py(Y[i]), 1.3, 0, TAU); ctx.fill(); });
      ctx.strokeStyle = 'rgba(122,228,255,0.9)'; ctx.beginPath(); ctx.moveTo(px(0.5), py(b0 + b1 * 0.5)); ctx.lineTo(px(8.6), py(b0 + b1 * 8.6)); ctx.stroke();
    });
    const lavr = 'Lavradora Ana';
    npc(c, 17, 8, 'villager2', lavr, async () => {
      await say(lavr, 'Anotei quanto cada muda cresceu e quantas horas de sol ela pegou. Os pontos quase formam uma ^creta^0!');
      await say(lavr, 'Com a reta, eu ^yprevejo^0 o tamanho de uma muda nova antes mesmo de ela crescer. Plante uma no canteiro ali e veja!');
    });
    class Canteiro extends G.Ent {
      constructor(x, y) { super(x, y + 4, 16, 10); this.solid = true; this.room = r.idx; }
      interact() {
        G.runScript(async () => {
          if (muda.plantada && muda.altura < muda.alvo - 0.5) return;
          const k = await ask(lavr, 'Quantas horas de sol esta muda vai pegar?', ['2 horas', '5 horas', '8 horas', 'Deixa para depois'], { cancel: 3 });
          if (k === 3) return;
          const x = [2, 5, 8][k], prev = b0 + b1 * x, real = Math.max(4, prev + res * (Math.sqrt(-2 * Math.log(Math.max(1e-6, Math.random()))) * Math.cos(TAU * Math.random())));
          await say(lavr, 'Pela reta: altura ≈ ' + F(b0, 1) + ' + ' + F(b1, 1) + ' × ' + x + ' = ^y' + F(prev, 0) + ' cm^0. Vamos ver!');
          Object.assign(muda, { plantada: true, altura: 0, alvo: real, prev });
          G.sfx('heal');
          await G.wait(3.2);
          await say(lavr, 'Cresceu ' + F(real, 0) + ' cm. ' + (Math.abs(real - prev) < 1 ? 'Na mosca!' : 'Errei por ' + F(Math.abs(real - prev), 0) + ' cm.') + ' Toda previsão tem um erro, mas a reta acerta perto. Isso é ^yregressão^0!');
        });
      }
      update(dt) { this.t += dt; if (muda.plantada) muda.altura = G.approach(muda.altura, muda.alvo, dt * muda.alvo / 3); }
      draw(ctx, cam) {
        const x = this.x - cam.x, y = this.y - cam.y;
        ctx.fillStyle = '#4a3020'; G.rrPath(ctx, x, y, 16, 10, 2); ctx.fill(); ctx.fillStyle = '#6a4a30'; ctx.fillRect(x + 2, y + 2, 12, 2);
        if (!muda.plantada) return;
        const h = muda.altura * 0.6, sw = Math.sin(this.t * 2) * 1.5;
        ctx.strokeStyle = '#3a8a3a'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x + 8, y + 3); ctx.quadraticCurveTo(x + 8 + sw, y + 3 - h / 2, x + 8 + sw, y + 3 - h); ctx.stroke();
        ctx.fillStyle = '#6ad04a'; for (let k = 1; k <= Math.min(5, Math.floor(h / 6)); k++) { const yy = y + 3 - k * 6; ctx.beginPath(); ctx.ellipse(x + 8 + (k % 2 ? 3 : -3) + sw * k / 5, yy, 3, 1.5, k % 2 ? -0.4 : 0.4, 0, TAU); ctx.fill(); }
        if (muda.prev) { const yy = y + 3 - muda.prev * 0.6; ctx.fillStyle = 'rgba(122,228,255,0.8)'; ctx.fillRect(x + 1, yy, 14, 0.5); }
      }
    }
    c.add(new Canteiro(...c.L(14, 9)), r.idx);
    placaCoruja(c, 4, 10, '^yREGRESSÃO^0: prever uma QUANTIDADE a partir de outras. Horas de sol → altura da planta; tamanho da casa → preço; chuva → colheita. A reta (ou a curva) que passa perto dos pontos faz a previsão.');
  };

  // ---------- BOSQUE DAS DECISÕES (Classificação) ----------
  const CARTAS = [
    ['GANHE 1000 MOEDAS GRÁTIS! Clique já', true], ['Reunião do conselho da vila amanhã cedo', false],
    ['Você foi sorteado! Envie seus dados', true], ['Sua encomenda de sementes chegou', false]
  ];
  const NOVAS = [
    ['Envie seus dados e ganhe um prêmio', true], ['A feira de abóboras começa amanhã', false], ['Ganhe tempo: a feira mudou para sábado', false],
    ['Moedas novas na loja do Quetelet', false], ['Clique aqui para ver seu prêmio', true], ['Lembrete: devolva o livro na biblioteca', false]
  ];
  const palavras = s => s.toLowerCase().replace(/[^a-záàâãéêíóôõúç0-9 ]/g, ' ').split(/\s+/).filter(w => w.length >= 4);
  AREAS.bosque = (c) => {
    const { r, setL } = c;
    aoArLivre(c);
    for (const [lx, ly] of [[4, 3], [6, 9], [8, 4], [16, 3], [18, 9], [20, 4], [5, 5], [19, 6]]) setL(lx, ly, T.TREE);
    const cart = 'Carteiro Tobias';
    const maquina = { mostrando: 0, linhas: [] };
    npc(c, 9, 9, 'villager1', cart, async () => {
      await say(cart, 'Chega tanta carta que eu não dou conta! Algumas são ^rspam^0 (golpes e propaganda), outras são de verdade. Me ajuda a separar umas?');
      const rot = [];
      for (const [txt] of CARTAS) { const k = await ask(cart, '"' + txt + '"', ['É spam', 'Não é spam']); rot.push(k === 0); }
      // a máquina aprende: palavras que só aparecem nas cartas marcadas como spam
      const sp = new Set(), ok = new Set();
      CARTAS.forEach(([txt], i) => palavras(txt).forEach(w => (rot[i] ? sp : ok).add(w)));
      const susp = [...sp].filter(w => !ok.has(w));
      await say(cart, 'Pronto! A ^cmáquina de triagem^0 olhou os seus exemplos e aprendeu que estas palavras aparecem nos spams: ^y' + (susp.slice(0, 6).join(', ') || 'nenhuma') + '^0. Agora ela separa sozinha as cartas novas...');
      maquina.linhas = NOVAS.map(([txt, verdade]) => { const prev = palavras(txt).some(w => susp.includes(w)); return { txt, prev, ok: prev === verdade }; });
      maquina.mostrando = 0.01;
      G.sfx('switch');
      await G.wait(NOVAS.length * 0.6 + 0.4);
      const ac = maquina.linhas.filter(l => l.ok).length;
      const errG = maquina.linhas.some(l => !l.ok && palavras(l.txt).includes('ganhe') && susp.includes('ganhe'));
      await say(cart, 'A máquina acertou ^y' + ac + ' de ' + NOVAS.length + '^0. ' + (ac < NOVAS.length ? 'Errou algumas porque aprendeu com poucos exemplos' + (errG ? ': "ganhe" também aparece em carta honesta!' : '.') + ' Com mais exemplos, ela melhora.' : 'Perfeito! Mas, com cartas mais difíceis, até ela erraria.'));
      await say(cart, 'Isso é ^yclassificação^0: prever em que CATEGORIA uma coisa cai.');
    });
    quadro(c, 13, 8, 9 * TS, 48, (ctx, x, y) => {
      lousa(ctx, x, y, 9 * TS, 46, 'MÁQUINA DE TRIAGEM');
      if (!maquina.mostrando) { G.text('(ajude o carteiro primeiro)', x + 72, y + 22, '#a8c0a0', { align: 'center', shadow: false }); return; }
      maquina.mostrando += G.DT;
      maquina.linhas.slice(0, Math.floor(maquina.mostrando / 0.6) + 1).forEach((l, i) => {
        G.text((l.prev ? 'SPAM  ' : 'CAIXA ') + (l.txt.length > 24 ? l.txt.slice(0, 23) + '…' : l.txt), x + 4, y + 11 + i * 5.6, l.ok ? '#c8f0c8' : '#ff9a8a', { shadow: false, max: 9 * TS - 8 });
      });
    });
    placaCoruja(c, 3, 10, '^yCLASSIFICAÇÃO^0: prever uma CATEGORIA. Spam ou não? Doente ou saudável? Que espécie de planta é esta? O classificador aprende com exemplos já rotulados.');
    c.add(new G.Sign(...c.L(15, 4), 'Tem asas? ^gSim^0 → ave ou morcego.  ^rNão^0 → siga a trilha.', { name: 'Placa de decisão' }), r.idx);
    c.add(new G.Sign(...c.L(7, 6), 'Bota ovo? ^gSim^0 → ave.  ^rNão^0 → morcego.', { name: 'Placa de decisão' }), r.idx);
  };

  // ---------- COSTA DAS MARÉS (Séries Temporais) ----------
  const PER = 16; // período da maré, em segundos
  const mare = t => 0.5 + 0.5 * Math.sin(TAU * t / PER); // 0 = baixa, 1 = alta
  class Mare extends G.Ent { // água subindo e descendo sobre a areia
    constructor(x, y, w) { super(x, y, w, 3 * TS); this.room = G.curRoom; }
    get by() { return -90000 + this.y; }
    draw(ctx, cam) {
      const h = mare(G.time) * 3 * TS, x = this.x - cam.x, y = this.y - cam.y;
      ctx.save();
      ctx.fillStyle = 'rgba(40,150,200,0.55)';
      ctx.beginPath(); ctx.moveTo(x, y);
      for (let k = 0; k <= this.w; k += 4) ctx.lineTo(x + k, y + h + Math.sin(k * 0.12 + G.time * 2) * 2);
      ctx.lineTo(x + this.w, y); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1; ctx.beginPath();
      for (let k = 0; k <= this.w; k += 4) { const yy = y + h + Math.sin(k * 0.12 + G.time * 2) * 2; if (k) ctx.lineTo(x + k, yy); else ctx.moveTo(x, yy); }
      ctx.stroke(); ctx.restore();
    }
  }
  class Farol extends G.Ent {
    constructor(x, y) { super(x, y, 24, 16); this.solid = true; this.room = G.curRoom; }
    get darkGlow() { return 50; }
    draw(ctx, cam) {
      const x = this.x - cam.x, b = this.y + this.h - cam.y;
      G.shadow(ctx, x + 12, b, 24, 0.3);
      ctx.save();
      ctx.fillStyle = '#1b1428'; ctx.beginPath(); ctx.moveTo(x + 3, b); ctx.lineTo(x + 7, b - 52); ctx.lineTo(x + 17, b - 52); ctx.lineTo(x + 21, b); ctx.fill();
      for (let k = 0; k < 5; k++) { ctx.fillStyle = k % 2 ? '#e84a4a' : '#f4f0e8'; const y0 = b - k * 10 - 10, w0 = 16 - k * 1.6; ctx.fillRect(x + 12 - w0 / 2, y0, w0, 10); }
      ctx.fillStyle = '#2a2a3a'; ctx.fillRect(x + 6, b - 62, 12, 10); ctx.fillStyle = '#ffe890'; ctx.fillRect(x + 8, b - 60, 8, 6);
      ctx.fillStyle = '#3a2a4a'; ctx.beginPath(); ctx.moveTo(x + 4, b - 62); ctx.lineTo(x + 12, b - 70); ctx.lineTo(x + 20, b - 62); ctx.fill();
      ctx.restore();
      const a = G.time * 1.2; G.light.add(x + 12 + Math.cos(a) * 30, b - 57 + Math.sin(a) * 8, 30, '#fff0b0', 0.5);
    }
  }
  AREAS.costa = (c) => {
    const { r, setL } = c;
    aoArLivre(c, { chao: T.GROUND2 });
    for (let lx = 1; lx < 23; lx++) for (let ly = 1; ly <= 3; ly++) setL(lx, ly, T.WATER);
    for (let ly = 1; ly <= 11; ly++) for (let lx = 1; lx <= 3; lx++) setL(lx, ly, T.WATER);
    c.add(new Mare(r.px + 4 * TS, r.py + 4 * TS, 19 * TS), r.idx);
    for (const [lx, ly] of [[19, 4], [20, 4]]) setL(lx, ly, T.BLOCK);
    c.add(new Farol(...c.L(19, 4)), r.idx);
    // gráfico das marés: o passado (linha cheia) e a previsão (pontilhada)
    quadro(c, 6, 8, 7 * TS, 40, (ctx, x, y) => {
      lousa(ctx, x, y, 7 * TS, 38, 'marés: passado e previsão');
      const w = 7 * TS - 12, x0 = x + 6, yb = y + 34, hh = 20, agora = x0 + w * 0.7;
      ctx.strokeStyle = 'rgba(232,240,216,0.5)'; ctx.beginPath(); ctx.moveTo(agora, y + 11); ctx.lineTo(agora, yb); ctx.stroke();
      for (const fut of [false, true]) {
        ctx.strokeStyle = fut ? 'rgba(122,228,255,0.9)' : '#ffe27a'; ctx.setLineDash(fut ? [2, 2] : []); ctx.beginPath();
        for (let k = 0; k <= w; k += 2) { const xx = x0 + k; if (fut ? xx < agora : xx > agora) continue; const tt = G.time + (xx - agora) / w * 3 * PER, yy = yb - mare(tt) * hh; if (xx === x0 || (fut && Math.abs(xx - agora) < 2)) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy); }
        ctx.stroke();
      }
      ctx.setLineDash([]);
    });
    const far = 'Faroleira Marina';
    npc(c, 16, 8, 'florence', far, async () => {
      const fase = (G.time % PER) / PER, falta = ((0.25 - fase + 1) % 1) * PER;
      await say(far, 'Eu anoto a altura da maré há anos. Repare no gráfico: ela sobe e desce sempre no mesmo ritmo, a cada ' + PER + ' segundos aqui na costa.');
      await say(far, 'Então dá para ^yprever^0: a próxima maré alta chega em ^c' + Math.round(falta) + ' segundos^0. Conte comigo!');
      await G.wait(Math.max(0.5, falta));
      G.sfx('heal');
      await say(far, 'Viu? Maré alta, na hora prevista. Isso é ^ysérie temporal^0: o passado tem um ritmo, e o ritmo ajuda a prever o futuro.');
    });
    placaCoruja(c, 8, 5, '^ySÉRIES TEMPORAIS^0: prever o FUTURO a partir do passado. Marés, estações do ano, vendas do mercado, a temperatura de amanhã: tudo que se mede ao longo do tempo tem tendências e ritmos.');
  };

  // ---------- PRAÇA DO HORIZONTE ----------
  class Fonte extends G.Ent {
    constructor(x, y) { super(x, y, 32, 24); this.solid = true; this.room = G.curRoom; }
    draw(ctx, cam) {
      const x = this.x - cam.x, y = this.y - cam.y;
      G.shadow(ctx, x + 16, y + 24, 34, 0.3);
      ctx.save();
      ctx.fillStyle = '#5a5470'; ctx.beginPath(); ctx.ellipse(x + 16, y + 16, 16, 9, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#3a8ae8'; ctx.beginPath(); ctx.ellipse(x + 16, y + 15, 13, 6.5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#a8a2bc'; ctx.fillRect(x + 14, y + 2, 4, 13);
      for (let i = 0; i < 6; i++) { const a = G.time * 2 + i; ctx.fillStyle = 'rgba(200,240,255,0.8)'; ctx.fillRect(x + 16 + Math.cos(a) * 6, y + 4 + ((G.time * 20 + i * 7) % 10), 1, 1.5); }
      ctx.restore();
      G.text('Σ', x + 16, y - 6, '#ffd84a', { align: 'center' });
    }
  }
  AREAS.praca = (c) => {
    const { r, setL } = c;
    aoArLivre(c);
    for (let ly = 3; ly <= 9; ly++) for (let lx = 7; lx <= 16; lx++) setL(lx, ly, T.PLAZA);
    c.add(new Fonte(...c.L(10.5, 4)), r.idx);
    c.add(new G.Sign(...c.L(14, 8), '↑ Cidade das Mentes (Inteligência Artificial)\n← Bosque das Decisões (Classificação)\n→ Oficina dos Autômatos (Aprendizado de Máquina)\n↓ Porto dos Dados', { name: 'Placa da praça' }), r.idx);
    const via = 'Viajante';
    npc(c, 8, 9, 'villager1', via, async () => {
      await say(via, 'Vim de longe para ver as Terras do Amanhã. Sabe o que mais me impressiona?');
      await say(via, 'Tudo aqui usa o que se aprende em Datália: ^ymédias, variância, probabilidade, amostras, inferência^0. Sem Estatística, nenhuma destas máquinas funcionaria.');
    });
  };

  // ---------- OFICINA DOS AUTÔMATOS (Aprendizado de Máquina) ----------
  class Automato extends G.Ent {
    constructor(x, y, puz) { super(x + 2, y + 6, 14, 10); this.solid = true; this.room = G.curRoom; this.puz = puz; }
    get darkGlow() { return 30; }
    interact() { this.puz.falar(); }
    update(dt) { this.t += dt; }
    draw(ctx, cam) {
      const x = this.x - 2 - cam.x, b = this.y + this.h - cam.y, bob = Math.sin(this.t * 3) * 0.6;
      G.shadow(ctx, x + 9, b, 16, 0.3);
      ctx.save();
      ctx.fillStyle = '#1b1428'; G.rrPath(ctx, x + 1, b - 22 + bob, 16, 20, 3); ctx.fill();
      const g = ctx.createLinearGradient(x, 0, x + 18, 0); g.addColorStop(0, '#e0b060'); g.addColorStop(1, '#8a5a24'); ctx.fillStyle = g; G.rrPath(ctx, x + 2, b - 21 + bob, 14, 18, 3); ctx.fill();
      ctx.fillStyle = '#20283a'; G.rrPath(ctx, x + 4, b - 18 + bob, 10, 6, 1.5); ctx.fill();
      ctx.fillStyle = '#7ae4ff'; ctx.fillRect(x + 6, b - 16 + bob, 2, 2); ctx.fillRect(x + 10, b - 16 + bob, 2, 2);
      ctx.fillStyle = '#8a5a24'; ctx.fillRect(x + 8.5, b - 26 + bob, 1, 4); ctx.fillStyle = '#ff6a5a'; ctx.fillRect(x + 7.5, b - 27 + bob, 3, 2);
      ctx.restore();
    }
  }
  AREAS.oficina = (c) => {
    const { r, L } = c;
    aoArLivre(c, { chao: T.GROUND2 });
    const S = { tent: [], f: 0, alvo: 0, bola: null, ensinando: false };
    const novoAlvo = () => { S.alvo = G.ri(7, 12) * TS; S.f = S.alvo * (G.chance(0.5) ? G.rf(0.4, 0.65) : G.rf(1.35, 1.6)); S.tent = []; };
    novoAlvo();
    const [ax, ay] = L(4, 6);
    const puz = { falar: () => G.runScript(async () => {
      if (S.ensinando) return;
      await say('Autômato A-7', 'BIP. Minha tarefa: acertar a bola no cesto. Ninguém me deu a fórmula: eu aprendo com os meus ERROS. Puxe a alavanca para eu tentar.');
    }) };
    c.add(new Automato(ax, ay, puz), r.idx);
    c.add(new G.Lever(...L(4, 9), () => {
      if (S.bola) return;
      if (S.tent.length && Math.abs(S.tent[S.tent.length - 1]) < 4) novoAlvo();
      S.bola = { t: 0, d: S.f };
      G.sfx('jump');
    }), r.idx);
    class Cesto extends G.Ent {
      constructor() { super(ax, ay, 16, 12); this.room = r.idx; }
      update(dt) {
        this.x = ax + S.alvo; this.t += dt;
        const B = S.bola; if (!B) return;
        B.t += dt;
        if (B.t >= 1.1) {
          const e = B.d - S.alvo; S.tent.push(e); S.bola = null;
          if (Math.abs(e) < 4) { G.sfx('correct'); G.ui.toast('Tentativa ' + S.tent.length + ': ACERTOU! O autômato aprendeu com os próprios erros.', '#7aff8a'); }
          else { G.sfx('tink'); G.ui.toast('Tentativa ' + S.tent.length + ': caiu ' + F(Math.abs(e) / TS, 1) + ' casa(s) ' + (e > 0 ? 'depois' : 'antes') + ' do cesto. Ajustando a força...', '#ffd84a'); }
          S.f -= 0.6 * e; // passo de aprendizado: corrige uma parte do erro
        }
      }
      draw(ctx, cam) {
        const x = this.x - cam.x, y = this.y - cam.y;
        ctx.save(); ctx.fillStyle = '#6a4a2a'; ctx.beginPath(); ctx.moveTo(x, y + 2); ctx.lineTo(x + 16, y + 2); ctx.lineTo(x + 13, y + 14); ctx.lineTo(x + 3, y + 14); ctx.fill();
        ctx.strokeStyle = '#a07a4a'; for (let k = 4; k < 14; k += 3) { ctx.beginPath(); ctx.moveTo(x + 2, y + k); ctx.lineTo(x + 14, y + k); ctx.stroke(); } ctx.restore();
        const B = S.bola; if (!B) return;
        const k = Math.min(1, B.t / 1.1), bx = ax - cam.x + 12 + B.d * k, by = ay - cam.y + 2 - Math.sin(Math.PI * k) * 40;
        ctx.fillStyle = '#ff6a5a'; ctx.beginPath(); ctx.arc(bx, by, 3, 0, TAU); ctx.fill();
      }
    }
    c.add(new Cesto(), r.idx);
    quadro(c, 14, 8, 7 * TS, 48, (ctx, x, y) => {
      lousa(ctx, x, y, 7 * TS, 46, 'tentativas  ·  erro');
      S.tent.slice(-5).forEach((e, i) => { const n = S.tent.length - Math.min(5, S.tent.length) + i + 1; G.text(n + 'ª  ' + (Math.abs(e) < 4 ? 'acertou!' : F(Math.abs(e) / TS, 1) + ' casa(s)'), x + 8, y + 12 + i * 6.5, Math.abs(e) < 4 ? '#7aff8a' : '#e8f0d8', { shadow: false }); });
    });
    const mes = 'Mestra Engrenagem';
    npc(c, 18, 5, 'quetelet', mes, async () => {
      await say(mes, 'Antigamente, a gente escrevia cada regra à mão. O A-7 é diferente: ele ^yaprende com exemplos^0 e corrige um pouco a cada erro.');
      await say(mes, 'Isso é ^yaprendizado de máquina^0. Veja o quadro: o erro vai encolhendo a cada tentativa, até ele acertar.');
    });
    placaCoruja(c, 8, 10, '^yAPRENDIZADO DE MÁQUINA^0: em vez de escrever todas as regras, deixamos a máquina aprender com exemplos e com os próprios erros. Ela ajusta seus números até as previsões ficarem boas.');
  };

  // ---------- CIDADE DAS MENTES (Inteligência Artificial) ----------
  class Skyline extends G.Ent {
    constructor(x, y, w) { super(x, y, w, 3 * TS); this.room = G.curRoom; }
    get by() { return this.y + this.h - 6; }
    draw(ctx, cam) {
      const x0 = this.x - cam.x, b = this.y + this.h - cam.y;
      for (let i = 0; i < 11; i++) {
        const w = 18 + G.hash2(i, 1, 5) * 14, h = 26 + G.hash2(i, 2, 5) * 30, x = x0 + i * (this.w / 11);
        ctx.fillStyle = '#0a1024'; ctx.fillRect(x, b - h - 1, w + 1, h + 1);
        ctx.fillStyle = i % 2 ? '#1c2a4e' : '#22325a'; ctx.fillRect(x + 0.5, b - h, w, h);
        for (let wy = b - h + 4; wy < b - 4; wy += 6) for (let wx = x + 3; wx < x + w - 3; wx += 5) {
          const on = G.hash2(Math.floor(wx), Math.floor(wy), 7 + Math.floor(G.time / 3 + i)) > 0.45;
          ctx.fillStyle = on ? (G.hash2(wx, wy, 2) > 0.7 ? '#7ae4ff' : '#ffe27a') : '#141c34'; ctx.fillRect(wx, wy, 2, 3);
        }
        if (i % 3 === 1) { ctx.fillStyle = '#ff9ae6'; ctx.fillRect(x + w / 2 - 0.5, b - h - 6, 1, 6); G.light.add(x + w / 2, b - h - 6, 10, '#ff9ae6', 0.6 + 0.4 * Math.sin(G.time * 3 + i)); }
      }
    }
  }
  class Robo extends G.Ent {
    constructor(x, y, cor, fala) { super(x + 2, y + 6, 12, 10); this.solid = true; this.room = G.curRoom; this.cor = cor; this.fala = fala; }
    get darkGlow() { return 30; }
    interact() { G.runScript(this.fala); }
    update(dt) { this.t += dt; }
    draw(ctx, cam) {
      const x = this.x - 2 - cam.x, b = this.y + this.h - cam.y, fl = Math.sin(this.t * 2.5) * 1.5;
      G.shadow(ctx, x + 8, b, 12, 0.3);
      ctx.save();
      ctx.fillStyle = '#1b1428'; ctx.beginPath(); ctx.ellipse(x + 8, b - 12 + fl, 7.5, 9, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#d8dcec'; ctx.beginPath(); ctx.ellipse(x + 8, b - 12 + fl, 6.5, 8, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#141c34'; G.rrPath(ctx, x + 3, b - 18 + fl, 10, 6, 2); ctx.fill();
      ctx.fillStyle = this.cor; ctx.fillRect(x + 5, b - 16 + fl, 2, 2); ctx.fillRect(x + 9, b - 16 + fl, 2, 2);
      ctx.restore();
      G.light.add(x + 8, b - 15 + fl, 14, this.cor, 0.5);
    }
  }
  // "livro falante": modelo de bigramas treinado com o texto das lições do próprio jogo
  let BIG = null;
  function bigramas() {
    if (BIG) return BIG;
    const prox = new Map(), inicios = [];
    for (const id in G.LESSONS) for (const pg of G.LESSONS[id].pages) {
      const txt = String(pg.t).replace(/\^./g, '').replace(/\n+/g, ' ');
      for (const frase of txt.split(/(?<=[.!?])\s+/)) {
        const w = frase.split(/\s+/).filter(Boolean); if (w.length < 4) continue;
        inicios.push(w[0]);
        for (let i = 0; i < w.length - 1; i++) { const a = w[i].toLowerCase(); if (!prox.has(a)) prox.set(a, []); prox.get(a).push(w[i + 1]); }
      }
    }
    return (BIG = { prox, inicios });
  }
  function falarBigramas() {
    const { prox, inicios } = bigramas();
    let out = [];
    for (let k = 0; k < 12 && out.length < 7; k++) { // frases curtas demais: sorteia de novo
      out = [G.pick(inicios)];
      while (out.length < 16) {
        const ult = out[out.length - 1]; if (/[.!?]$/.test(ult)) break;
        const op = prox.get(ult.toLowerCase()); if (!op) break;
        out.push(G.pick(op));
      }
    }
    let s = out.join(' '); if (!/[.!?]$/.test(s)) s += '...';
    return s;
  }
  class Cavalete extends G.Ent { // a pintora pinta um quadro novo a cada conversa
    constructor(x, y) { super(x, y + 6, 20, 10); this.solid = true; this.room = G.curRoom; this.semente = 1; }
    draw(ctx, cam) {
      const x = this.x - cam.x, b = this.y + this.h - cam.y, y = b - 30;
      ctx.save();
      ctx.fillStyle = '#5a3a1a'; ctx.fillRect(x + 3, y + 22, 1.5, 8); ctx.fillRect(x + 16, y + 22, 1.5, 8);
      ctx.fillStyle = '#1b1428'; ctx.fillRect(x - 1, y - 1, 22, 24); ctx.fillStyle = '#f4ecdc'; ctx.fillRect(x, y, 20, 22);
      const s = this.semente, cores = ['#ff9ae6', '#7ae4ff', '#ffd84a', '#8affc0', '#ff6a5a', '#8aa6ff'];
      ctx.beginPath(); ctx.rect(x + 1, y + 1, 18, 20); ctx.clip();
      for (let i = 0; i < 7; i++) { ctx.fillStyle = cores[Math.floor(G.hash2(s, i, 1) * cores.length)]; ctx.globalAlpha = 0.75; const cx = x + G.hash2(s, i, 2) * 20, cy = y + G.hash2(s, i, 3) * 22, rr = 2 + G.hash2(s, i, 4) * 7; if (i % 2) ctx.fillRect(cx - rr, cy - rr / 2, rr * 2, rr); else { ctx.beginPath(); ctx.arc(cx, cy, rr, 0, TAU); ctx.fill(); } }
      ctx.restore();
    }
  }
  AREAS.cidade = (c) => {
    const { r, setL } = c;
    aoArLivre(c, { borda: T.TREE });
    for (let lx = 1; lx < 23; lx++) for (let ly = 1; ly <= 3; ly++) setL(lx, ly, T.BLOCK);
    for (let ly = 4; ly <= 10; ly++) for (let lx = 3; lx <= 20; lx++) if ((lx + ly) % 2 === 0) setL(lx, ly, T.PATH);
    c.add(new Skyline(r.px + TS, r.py + TS, 22 * TS), r.idx);
    c.add(new Robo(...c.L(5, 6), '#7ae4ff', async () => {
      await say('Robô Tradutor', 'Diga uma frase e eu traduzo! Por exemplo: "Bom dia, reino!"');
      await say('Robô Tradutor', 'Inglês: ^c"Good morning, kingdom!"^0  Espanhol: ^c"Buenos días, reino!"^0  Francês: ^c"Bonjour, royaume!"^0');
      await say('Robô Tradutor', 'Ninguém me ensinou regras de gramática uma por uma: eu aprendi vendo milhões de frases já traduzidas e calculando qual tradução é a mais ^yprovável^0.');
    }), r.idx);
    const cav = c.add(new Cavalete(...c.L(12.5, 8)), r.idx);
    c.add(new Robo(...c.L(10.5, 8), '#ff9ae6', async () => {
      cav.semente = G.ri(1, 9999); G.sfx('select');
      await say('Robô Pintora', 'Pronto, um quadro novo! Eu vi milhares de pinturas e aprendi os padrões delas. Nunca pinto o mesmo quadro duas vezes.');
    }), r.idx);
    c.add(new Robo(...c.L(17, 6), '#ffe27a', async () => {
      await say('Livro Falante', 'Eu li todas as lições de Datália. Agora escolho cada palavra olhando qual costuma vir DEPOIS da anterior. Escute:');
      await say('Livro Falante', '^c"' + falarBigramas() + '"^0');
      await say('Livro Falante', 'Às vezes faz sentido... às vezes não! As máquinas que conversam de verdade fazem algo parecido, só que olhando para MUITO mais palavras de uma vez.');
    }), r.idx);
    placaCoruja(c, 20, 9, '^yINTELIGÊNCIA ARTIFICIAL^0: máquinas que fazem tarefas que pareciam exigir inteligência: traduzir, conversar, enxergar, criar. Por baixo de tudo: probabilidade e muitos, muitos dados.');
  };

  // ---------- PORTÃO DO AMANHÃ (fechado até Sigma 2) ----------
  const CACOS = [[-28, 6], [-12, -18], [6, 14], [22, -6], [30, 22], [-20, 30]];
  function desenhaPortao(ctx, x, b, t, brilho) {
    // x = centro, b = base; o mesmo desenho aparece na cena depois dos créditos
    ctx.save();
    ctx.fillStyle = '#0a0612'; ctx.fillRect(x - 64, b - 92, 128, 92);
    const g = ctx.createLinearGradient(0, b - 92, 0, b); g.addColorStop(0, '#3a2a4a'); g.addColorStop(1, '#1a1024'); ctx.fillStyle = g; ctx.fillRect(x - 62, b - 90, 124, 90);
    ctx.fillStyle = '#05030a'; ctx.beginPath(); ctx.moveTo(x - 40, b); ctx.lineTo(x - 40, b - 56); ctx.quadraticCurveTo(x, b - 88, x + 40, b - 56); ctx.lineTo(x + 40, b); ctx.fill();
    // luz vermelha atrás das grades
    ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, x, b - 44, 40, '#ff2a3a', brilho * (0.55 + 0.25 * Math.sin(t * 1.3))); ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#ff3a4a'; ctx.globalAlpha = brilho; ctx.beginPath(); ctx.ellipse(x, b - 44, 5 + 2 * Math.sin(t * 1.3), 2.2, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = '#2a2236'; for (let k = -36; k <= 36; k += 8) ctx.fillRect(x + k - 1, b - 76 + Math.abs(k) * 0.5, 2.5, 76 - Math.abs(k) * 0.5);
    ctx.fillStyle = '#1a1424'; ctx.fillRect(x - 40, b - 30, 80, 2);
    // cacos da máscara do Viés presos nas frestas
    for (const [dx, dy] of CACOS) { ctx.fillStyle = '#f0e8f8'; ctx.beginPath(); ctx.moveTo(x + dx, b - 60 + dy); ctx.lineTo(x + dx + 4, b - 62 + dy); ctx.lineTo(x + dx + 2, b - 56 + dy); ctx.fill(); ctx.fillStyle = '#c86aff'; ctx.fillRect(x + dx + 1, b - 60 + dy, 1, 1); }
    ctx.restore();
  }
  class Portao extends G.Ent {
    constructor(x, y) { super(x, y, 8 * TS, 16); this.solid = true; this.room = G.curRoom; }
    get darkGlow() { return 60; }
    interBox() { return { x: this.x, y: this.y - 8, w: this.w, h: this.h + 20 }; }
    interact() {
      G.runScript(async () => {
        G.sfx('zumbido');
        await say(null, 'Um portão gigantesco, sem fechadura nem maçaneta. Cacos da ^pmáscara do Viés^0 estão presos nas frestas.');
        await say(null, 'Do outro lado, uma luz vermelha pisca devagar... como quem está ^raprendendo^0.');
        await say('???', 'D A D O S   R E C E B I D O S . . .');
        if (!P().flags.amanhaPortao) {
          P().flags.amanhaPortao = true;
          await say(CORUJA + ' (de longe)', 'Nem eu sei o que há do outro lado, Sigma. Algo ali dentro está aprendendo... com o que o Viés deixou para trás.');
        }
        await say(null, 'O portão não se move. ^y(Continua em A Lenda de Sigma 2.)^0');
      });
    }
    update(dt) { this.t += dt; }
    draw(ctx, cam) { desenhaPortao(ctx, this.cx - cam.x, this.y + this.h - cam.y, this.t, 1); G.light.add(this.cx - cam.x, this.y - 30 - cam.y, 60, '#ff3a4a', 0.5); }
  }
  AREAS.portao = (c) => {
    const { r, setL } = c;
    aoArLivre(c, { borda: T.CLIFF });
    for (let ly = 1; ly <= 6; ly++) for (let lx = 7; lx <= 16; lx++) setL(lx, ly, T.BLOCK);
    c.add(new Portao(...c.L(8, 6)), r.idx);
    return { enter() { G.sfx('zumbido'); } };
  };

  // ------------------------------------------------------------------
  //  Depois dos créditos: o gancho para "A Lenda de Sigma 2"
  // ------------------------------------------------------------------
  const CARTAO = 17;
  G.ganchoInicio = () => { G.state = 'gancho'; G.ganchoT = 0; G.ui.clear(); G.music('gancho'); };
  G.ganchoUpdate = (dt) => {
    G.ganchoT += dt;
    if (G.input.pressed('confirm') || G.input.pressed('start')) {
      if (G.ganchoT < CARTAO) { G.ganchoT = CARTAO; } else if (G.ganchoT > CARTAO + 1.5) G.toTitle();
    }
  };
  G.ganchoDraw = (ctx) => {
    const W = G.W, H = G.H, t = G.ganchoT;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    if (t < 9.5) {
      // noite no pântano: um caco da máscara voa com o vento e afunda na névoa
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#04030c'); g.addColorStop(0.6, '#14142a'); g.addColorStop(1, '#1a2a24'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 60; i++) { ctx.globalAlpha = 0.3 + 0.6 * Math.abs(Math.sin(t + i)); ctx.fillStyle = '#ffffff'; ctx.fillRect(G.hash2(i, 1, 2) * W, G.hash2(i, 2, 2) * 110, 0.5, 0.5); }
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#0a120e'; for (let i = 0; i < 14; i++) { const x = i * 30 - 10, h = 40 + G.hash2(i, 3, 2) * 40; ctx.beginPath(); ctx.moveTo(x, H - 40); ctx.lineTo(x + 15, H - 40 - h); ctx.lineTo(x + 30, H - 40); ctx.fill(); }
      ctx.fillStyle = '#0c1a1a'; ctx.fillRect(0, H - 42, W, 42);
      const s = G.spr.corujaPedra; if (s) G.draw(ctx, s, 250, H - 42 - G.lh(s) + 6, { alpha: 0.85, tint: 'rgba(10,10,30,0.6)' });
      const k = Math.min(1, t / 8), cx = 30 + k * 300, cy = 40 + Math.sin(k * Math.PI) * -10 + k * k * 120 + Math.sin(t * 3) * 4;
      if (k < 1) {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 2);
        ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, 0, 0, 14, '#c86aff', 0.6); ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#f0e8f8'; ctx.beginPath(); ctx.moveTo(-4, -3); ctx.lineTo(5, -1); ctx.lineTo(-1, 5); ctx.fill(); ctx.restore();
      }
      for (let i = 0; i < 5; i++) { ctx.fillStyle = 'rgba(200,220,220,' + (0.05 + 0.03 * Math.sin(t + i)) + ')'; ctx.fillRect(0, H - 54 + i * 5, W, 6); }
      if (t > 8 && t < 9.5) { const a = (t - 8) / 1.5; ctx.strokeStyle = 'rgba(200,106,255,' + (1 - a) + ')'; ctx.beginPath(); ctx.ellipse(330, H - 30, 10 + a * 30, 3 + a * 8, 0, 0, TAU); ctx.stroke(); }
      G.text('Enquanto isso, no canto mais escuro do Pântano de Bayes...', W / 2, 12, '#9a98b0', { align: 'center' });
    } else if (t < CARTAO) {
      const k = Math.min(1, (t - 10) / 3);
      desenhaPortao(ctx, W / 2, H - 40, t, k);
      const msg = 'DADOS RECEBIDOS... APRENDENDO.', n = Math.max(0, Math.floor((t - 12) * 10));
      if (n) G.text(msg.slice(0, n), W / 2, H - 26, '#ff6a6a', { align: 'center' });
    } else {
      const k = Math.min(1, (t - CARTAO) / 1.2);
      ctx.globalAlpha = k;
      G.textBig('A LENDA DE SIGMA 2', W / 2, H / 2 - 24, '#ffffff', { align: 'center', gradient: ['#ffffff', '#ff8aa0'], outline: '#1a0a2a' });
      G.text('em breve', W / 2, H / 2 + 6, '#ffd84a', { align: 'center' });
      if (t > CARTAO + 1.5) G.text('Pressione X', W / 2, H - 20, '#9a98b0', { align: 'center' });
      ctx.globalAlpha = 1;
    }
  };
})(window.G);
