'use strict';
// =====================================================================
//  Pós-jogo. A formatura na Vila Gauss dá o CAPELO DE FORMATURA (arma de
//  arremesso que volta, acerta inimigos, aciona alavancas e busca itens
//  longe do alcance), com relíquias espalhadas que só ele alcança. O Poço
//  das Estrelas guarda um mistério que o Observatório revela. No canto do
//  Pântano de Bayes, a Coruja do Saber acorda com o capelo e leva Sigma às
//  TERRAS DO AMANHÃ: uma cidade aberta e tecnológica em dia de feira, com
//  moradores e barracas de minijogos das grandes áreas da modelagem
//  preditiva (Regressão, Classificação, Séries Temporais, Aprendizado de
//  Máquina e Inteligência Artificial), cada um com um prêmio único. No fim
//  da avenida fica o Portão do Amanhã, fechado até "A Lenda de Sigma 2" —
//  o mesmo portão da cena depois dos créditos.
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
    // só dá a luz ambiente do mapa; o chão de cada bairro vem de temaFn
    am_base: tema('lago', { amb: '#fbf6ee' }),
    am_porto: tema('lago', { g: ['#246a5c', '#33876e', '#4aa482', '#6cc096', '#a0dcb4'], tc: ['#5a1e3a', '#8a2e56', '#bc4a78', '#e07aa0', '#ffb8d0'], deco: ['#ffb8d0', '#ffffff', '#ffe060', '#8ad0ff'], w: ['#1e5aa8', '#2e88d8', '#62b8f0', '#d8f4ff'] }),
    am_vale: tema('planicie', {}),
    am_bosque: tema('floresta', {}),
    am_costa: tema('deserto', { w: ['#14629a', '#2096c8', '#58c8e8', '#e0fcff'], tree: 'oak', tc: G.THEMES.vila.tc, trunk: G.THEMES.vila.trunk }),
    am_oficina: tema('deserto', { g: ['#5a4632', '#765c42', '#927454', '#ae8e68', '#ccac84'], p: ['#3a3a44', '#55555f', '#70707c', '#8c8c98', '#aaaab4'], tree: 'dead' }),
    // cidade: grama azul-esverdeada, asfalto, praça de pedra azulada e árvores floridas
    am_cidade: tema('vila', { g: ['#1c5a52', '#26705f', '#328a70', '#48a684', '#74c8a2'], p: ['#262a3c', '#30354a', '#3e445a', '#50576e', '#666e88'], cob: ['#3a4462', '#4a5678', '#5c6a90', '#7482a8', '#98a6c6'], tc: ['#5a1e3a', '#8a2e56', '#bc4a78', '#e07aa0', '#ffb8d0'], deco: ['#7ae4ff', '#ff9ae6', '#ffe27a', '#8affc0'], w: ['#14629a', '#2096c8', '#58c8e8', '#e0fcff'] }),
    am_portao: tema('castelo', {})
  });
  const ta0 = G.GameMap.prototype.themeAt;
  G.GameMap.prototype.themeAt = function (tx, ty) {
    if (this.temaFn) return this.temaFn(tx, ty);
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
      SPR.capeloOuro = G.tint(SPR.capeloItem, 'rgba(255,190,40,0.55)');
    }
    // prêmios únicos das barracas das Terras do Amanhã
    SPR.swordBlade5 = G.tint(SPR.swordBlade4, 'rgba(60,255,220,0.5)');
    SPR.espadaAmanhaIcon = G.tint(SPR.swordIcon, 'rgba(60,255,220,0.55)');
    SPR.armorSilicio = G.tint(SPR.armorIcon, 'rgba(90,170,255,0.6)');
    SPR.tenisFibra = G.tint(SPR.boots, 'rgba(60,220,255,0.6)');
    // ícones de cada espada e armadura (menu de equipamento), na cor de cada peça
    ['rgba(170,110,50,0.6)', 'rgba(150,160,180,0.55)', 'rgba(235,240,255,0.5)', 'rgba(120,230,255,0.5)', 'rgba(60,255,220,0.55)'].forEach((c, i) => { SPR['espIcon' + i] = G.tint(SPR.swordIcon, c); });
    ['rgba(47,127,224,0.55)', 'rgba(138,90,42,0.6)', 'rgba(200,208,224,0.5)', 'rgba(60,140,232,0.6)'].forEach((c, i) => { SPR['armIcon' + i] = G.tint(SPR.armorIcon, c); });
    { // amuleto das marés: gota azul com uma onda
      const p = new G.Paint(32, 32);
      p.line(16, 2, 16, 8, '#d8a440', 1.5);
      p.ell(16, 19, 10, 11, { ramp: R5('#3aa0e8'), ambient: 0.45, contrast: 1.2 });
      p.poly([[16, 4], [9, 14], [23, 14]], R5('#3aa0e8')[3]);
      for (let x = 9; x <= 23; x++) p.px(x, 20 + Math.round(Math.sin((x - 9) * 0.9) * 2), '#e0fcff');
      p.outline({ k: -0.8 }); SPR.amuletoIcon = p.toCanvas();
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
    const PREM = {
      capeloDourado: ['capeloOuro', 'CAPELO DOURADO', 'Seu capelo voa mais longe e bate mais forte, soltando faíscas douradas.', P0 => { P0.flags.capeloDourado = true; }],
      amuleto: ['amuletoIcon', 'AMULETO DAS MARÉS', 'Como as marés, sua vida volta no ritmo certo: meio coração a cada 15 segundos.', P0 => { P0.flags.amuletoMares = true; }],
      armaduraSilicio: ['armorSilicio', 'ARMADURA DE SILÍCIO', 'Leve como um chip e resistente como um servidor: a melhor defesa do reino.', () => G.equip.ganhar('armadura', 3)],
      espadaAmanha: ['espadaAmanhaIcon', 'ESPADA DO AMANHÃ', 'Uma lâmina de luz das Terras do Amanhã: o ataque mais forte do jogo.', () => G.equip.ganhar('espada', 4)],
      tenisFibra: ['tenisFibra', 'TÊNIS DE FIBRA ÓTICA', 'Seus passos viajam como dados na fibra ótica: você anda 20% mais rápido.', P0 => { P0.flags.fibraOtica = true; }]
    };
    if (PREM[kind]) {
      const [spr, tit, txt, aplicar] = PREM[kind], p = G.player, P0 = P();
      if (p) { p.state = 'hold'; p.holdItem = spr; }
      G.cutscene++;
      try { aplicar(P0); G.sfx('fanfare'); await G.wait(0.3); await G.ui.banner(spr, tit + '!', txt, { color: '#7ae4ff' }); }
      finally { G.cutscene--; if (p && p.state === 'hold') { p.state = 'normal'; p.holdItem = null; } }
      return;
    }
    const r = await give0.call(this, kind, n, o);
    if (kind === 'item' && n === 'capelo') P().sub = 'capelo';
    return r;
  };

  const V_IDA = 250, V_VOLTA = 290;
  const dourado = () => G.flag('capeloDourado');
  const alcance = () => (dourado() ? 9 : 6.5) * TS;
  class CapeloVoo extends G.Ent {
    constructor(p) {
      super(p.cx - 5, p.cy - 12, 10, 8);
      const d = G.DIRS[p.dir]; this.dx = d.x; this.dy = d.y;
      this.dono = p; this.fase = 'ida'; this.dist = 0; this.ang = 0; this.carga = null; this.acertos = new Set(); this.room = G.curRoom;
    }
    get by() { return this.y + 40; }
    bloqueado(x, y) { const tp = G.TP[G.map.tileAtPx(x, y)]; return tp.solid && !tp.low; }
    update(dt) {
      this.t += dt; this.ang += dt * 22;
      const p = this.dono;
      if (!p || G.player !== p || p.state === 'dead') { this.dead = true; return; }
      if (this.fase === 'ida') {
        const v = V_IDA * dt; this.x += this.dx * v; this.y += this.dy * v; this.dist += v;
        if (this.bloqueado(this.cx, this.cy)) { this.fase = 'volta'; G.sfx('tink'); G.fx.spark(this.cx, this.cy, '#ffffff', 4); }
        else if (this.dist >= alcance()) this.fase = 'volta';
        if (G.map.kind === 'dungeon') { const r = G.dun.roomAt(this.cx, this.cy); if (!r || r.idx !== G.curRoom) this.fase = 'volta'; }
      } else {
        const tx = p.cx, ty = p.cy - 10, dx = tx - this.cx, dy = ty - this.cy, d = Math.hypot(dx, dy), v = V_VOLTA * dt;
        if (d <= v + 4) { this.dead = true; this.entregar(); return; }
        this.x += dx / d * v; this.y += dy / d * v;
      }
      if (this.carga) { this.carga.x = this.cx - this.carga.w / 2; this.carga.y = this.cy - this.carga.h / 2; if (this.carga instanceof G.Pickup) { this.carga.z = 0; this.carga.t = Math.max(this.carga.t, 0.3); } }
      this.colidir();
      // faíscas saindo das pontas do capelo enquanto ele gira
      const cores = dourado() ? ['#ffd84a', '#fff4c0', '#ffb030'] : ['#ffd84a', '#ffffff', '#7ae4ff'];
      for (let k = 0; k < 2; k++) {
        const a = this.ang + k * Math.PI;
        G.fx.glow(this.cx + Math.cos(a) * 7, this.cy + Math.sin(a) * 4, { size: G.rf(0.8, 1.6), color: G.pick(cores), vx: Math.cos(a) * G.rf(20, 45) - this.dx * 30, vy: Math.sin(a) * G.rf(10, 25) - 8, life: G.rf(0.18, 0.35) });
      }
    }
    colidir() {
      const box = { x: this.x - 2, y: this.y - 2, w: this.w + 4, h: this.h + 4 };
      for (const e of G.ents) {
        if (e === this || e.dead || e === this.dono || e === this.carga || this.acertos.has(e) || !G.sameRoom(e)) continue;
        if (e.onCapelo) { if (G.overlap(box, e.capeloBox ? e.capeloBox() : e)) { this.acertos.add(e); e.onCapelo(this); this.fase = 'volta'; } continue; }
        if (e.isEnemy && G.overlap(box, e.hurtbox ? e.hurtbox() : e)) {
          this.acertos.add(e); this.fase = 'volta'; G.fx.spark(this.cx, this.cy, '#ffffff', 6);
          // chefes só fazem "tim", menos os que reagem ao capelo (o escudo do Viés 2.0)
          if (e.isBoss && !e.senteCapelo) G.sfx('tink'); else e.onHit(2 + (P().swordLv || 0) + (dourado() ? 2 : 0), this.cx, this.cy, 'capelo', false);
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
      // gira no próprio plano, achatado em perspectiva, com um rastro de brilho
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, x - this.dx * 6, y - this.dy * 4, 10, dourado() ? '#ffc040' : '#ffe8a0', 0.45); ctx.restore();
      ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.7); ctx.rotate(this.ang);
      G.draw(ctx, dourado() ? 'capeloOuro' : 'capeloItem', -8, -8);
      ctx.restore();
      G.light.add(x, y, 18, dourado() ? '#ffc040' : '#ffe8a0', 0.55);
    }
  }
  G.CapeloVoo = CapeloVoo;
  // Tênis de Fibra Ótica: 20% mais rápido
  const vel0 = Object.getOwnPropertyDescriptor(G.Player.prototype, 'speed');
  Object.defineProperty(G.Player.prototype, 'speed', { configurable: true, get() { return vel0.get.call(this) * (G.flag('fibraOtica') ? 1.2 : 1); } });
  const pup = G.Player.prototype.update;
  G.Player.prototype.update = function (dt) {
    // o herói continua andando enquanto o capelo voa
    if (this.state === 'normal' && G.P.sub === 'capelo' && G.P.items.capelo && G.input.pressed('c') && this.z <= 0 && !this.carry && !G.cutscene && !G.ents.some(e => e instanceof CapeloVoo && !e.dead)) {
      G.addEnt(new CapeloVoo(this)); this.castT = 0.2; G.sfx('capelo');
    }
    if (G.flag('amuletoMares') && this.state === 'normal' && !G.cutscene) {
      this.amuT = (this.amuT || 0) + dt;
      if (this.amuT >= 15) { this.amuT = 0; if (G.P.hp < G.P.maxHp) { G.healPlayer(2); G.fx.glow(this.cx, this.y - 6, { size: 3, color: '#7ae4ff', vy: -20, life: 0.6 }); } }
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
    onCapelo() {
      if (P().flags.corujaAcordou) return;
      // de longe (da margem), o capelo só bate na pedra: a coruja precisa ver o herói na ilhota
      const p = G.player;
      if (!p || G.dist(p.cx, p.cy, this.cx, this.cy) > 6 * TS) { G.sfx('tink'); G.ui.toast('O capelo bate na pedra e volta. A coruja parece precisar ver você de perto.', '#ffe27a'); return; }
      G.runScript(() => acordarCoruja(this));
    }
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
  const MARGEM = { reg: 'pantano', lx: 7, ly: 27 }; // na volta, o herói desce na ilhota da coruja
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
    // a coruja numa ilhota no canto sudoeste do pântano: dá para vê-la da margem desde o começo,
    // mas chegar perto pede tudo o que o reino ensina. Parede rachada (bombas) → barreira de
    // cristal (raio) → riacho (botas) → argola da média do outro lado do lago (gancho).
    {
      const R = regionOf('pantano');
      const PLANTA = [ // x de 2 a 21, y de 19 a 29
        'T...................',
        'T...................',
        'T~~~~~~~~~~~####C###',
        'T~~~~~~~~~~~##.....#',
        'T~~~~~~~~~~~##.....#',
        'T~~~~~~~~~~~#####X##',
        'T~~~~~~~~~~~..~~...#',
        'T.......~~~~..~~...#',
        'T.......~~~~..~~...#',
        'T.......~~~~..~~...#',
        'TTTTTTTTTTTTTTTTTTTT'];
      const LEG = { 'T': T.TREE, '#': T.CLIFF, '~': T.WATER, '.': T.GROUND, 'C': T.CRACKED, 'X': T.BARRIER };
      PLANTA.forEach((l, j) => { for (let i = 0; i < l.length; i++) { const X = R.ox + 2 + i, Y = R.oy + 19 + j, k = idx(X, Y); wall[k] = 0; prot[k] = 1; block[k] = 1; setT(X, Y, LEG[l[i]]); } });
      nodes.pantano.push([R.ox + 17, R.oy + 18]);
      // o fragmento de coração da antiga ilhota do pântano agora fica no fim da trilha de pedra
      // (fileira 27: a copa das árvores da borda cobre a fileira 28)
      const bau = objects.find(o => o.flag === 'ow_pant_hp'); if (bau) { bau.x = (R.ox + 20) * TS; bau.y = (R.oy + 27) * TS; }
      objects.push({ type: 'hookRing', x: (R.ox + 14) * TS, y: (R.oy + 26) * TS });
      objects.push({ type: 'hookRing', x: (R.ox + 9) * TS, y: (R.oy + 27) * TS });
      objects.push({ type: 'coruja', x: (R.ox + 3) * TS + 8, y: (R.oy + 27) * TS });
      objects.push({ type: 'sign', x: (R.ox + 8) * TS, y: (R.oy + 20) * TS, text: '^yCORUJA DO SABER^0\n"Só passa quem se formou."' });
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
    if (P0.flags.corujaAcordou && nTotens() < 4) return 'Na Cidade do Amanhã, acenda os quatro ^cTotens de Dados^0 com o capelo: eles abrem o Portão do Amanhã. (' + nTotens() + ' de 4)';
    if (P0.flags.corujaAcordou && !P0.flags.boss_d9) return 'O ^rNúcleo do Amanhã^0, atrás do portão aberto, esconde quem está aprendendo com os dados do Viés.';
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
  //  TERRAS DO AMANHÃ — a Cidade do Amanhã: uma feira de tecnologia a céu
  //  aberto. Mapa livre (a câmera acompanha o herói, como no reino), com
  //  moradores, barracas de minijogos das grandes áreas da modelagem
  //  preditiva e o Portão do Amanhã no fim da avenida.
  // ------------------------------------------------------------------
  const CW = 56, CH = 36;
  G.DUNGEONS.d8 = { name: 'Terras do Amanhã', theme: 'am_base', music: 'amanha', topic: 'd6', grid: [1, 1], rooms: { S: { at: [0, 0], type: 'cidade' } }, doors: [] };
  // bairros: cada um com o seu chão
  const zonaTema = (tx, ty) => (ty <= 4 && tx >= 21 && tx <= 34) ? 'am_portao'
    : (tx <= 12 && ty <= 20) ? 'am_vale' : (tx >= 43 && ty <= 20) ? 'am_oficina' : (tx <= 13 && ty >= 24) ? 'am_costa' : 'am_cidade';

  // ---------- peças da cidade ----------
  class Predio extends G.Ent { // prédio com janelas acesas e letreiro; a base fica sobre tiles BLOCK
    constructor(x, y, w, alt, cor, letreiro) { super(x, y, w, 2 * TS); this.alt = alt; this.cor = cor; this.letreiro = letreiro; this.room = 0; this.sem = G.ri(1, 999); }
    get by() { return this.y + this.h; }
    draw(ctx, cam) {
      const x = this.x - cam.x, b = this.y + this.h - cam.y, w = this.w, h = this.alt, R = R5(this.cor);
      ctx.save();
      ctx.fillStyle = '#0a0c18'; ctx.fillRect(x - 1, b - h - 1, w + 2, h + 1);
      const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, R[3]); g.addColorStop(0.6, R[2]); g.addColorStop(1, R[1]);
      ctx.fillStyle = g; ctx.fillRect(x, b - h, w, h);
      ctx.fillStyle = R[4]; ctx.fillRect(x, b - h, w, 1.5);
      for (let wy = b - h + 6; wy < b - 14; wy += 7) for (let wx = x + 4; wx < x + w - 4; wx += 6) {
        const on = G.hash2(Math.floor(wx - x) + this.sem, Math.floor(wy - b), Math.floor(G.time / 4 + this.sem)) > 0.4;
        ctx.fillStyle = on ? (G.hash2(wx, wy, this.sem) > 0.75 ? '#7ae4ff' : '#ffe8a0') : '#1a2034'; ctx.fillRect(wx, wy, 3, 4);
      }
      ctx.fillStyle = '#141a2c'; ctx.fillRect(x + w / 2 - 5, b - 12, 10, 12); ctx.fillStyle = '#7ae4ff'; ctx.fillRect(x + w / 2 - 4, b - 11, 8, 1);
      ctx.fillStyle = '#5a6080'; ctx.fillRect(x + w - 8, b - h - 8, 1, 8);
      ctx.restore();
      G.light.add(x + w - 7.5, b - h - 8, 8, '#ff5a6a', Math.floor(G.time * 2 + this.sem) % 2 ? 0.8 : 0.2);
      // prédios com função (café, escola) mostram só um ícone na plaquinha da porta
      if (this.letreiro) {
        const px = x + w / 2 + 9, py = b - 22;
        ctx.save(); ctx.fillStyle = '#0a0c18'; G.rrPath(ctx, px - 0.5, py - 0.5, 13, 11, 2); ctx.fill(); ctx.fillStyle = '#1e2a48'; G.rrPath(ctx, px, py, 12, 10, 2); ctx.fill();
        if (this.letreiro === 'cafe') { ctx.fillStyle = '#f4ecdc'; ctx.fillRect(px + 3, py + 4, 5, 4); ctx.fillRect(px + 8, py + 5, 1.5, 2); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(px + 4, py + 1.5 + Math.sin(G.time * 3) * 0.5, 0.6, 2); ctx.fillRect(px + 6, py + 1 + Math.cos(G.time * 3) * 0.5, 0.6, 2); }
        else { ctx.fillStyle = '#ffd84a'; ctx.fillRect(px + 2, py + 3, 4, 5); ctx.fillStyle = '#7ae4ff'; ctx.fillRect(px + 6, py + 3, 4, 5); ctx.fillStyle = '#0a0c18'; ctx.fillRect(px + 5.7, py + 3, 0.6, 5); }
        ctx.restore();
        G.light.add(px + 6, py + 5, 16, '#ffe8a0', 0.5);
      }
    }
  }
  const ICONES = {
    reta(ctx, x, y) { ctx.strokeStyle = '#7ae4ff'; ctx.beginPath(); ctx.moveTo(x - 6, y + 4); ctx.lineTo(x + 6, y - 4); ctx.stroke(); ctx.fillStyle = '#ffe27a'; for (const [a, b] of [[-5, 2], [-2, 2], [1, -2], [4, -2]]) ctx.fillRect(x + a, y + b, 1.5, 1.5); },
    carta(ctx, x, y) { ctx.fillStyle = '#f4ecdc'; ctx.fillRect(x - 6, y - 4, 12, 8); ctx.strokeStyle = '#ff6a5a'; ctx.beginPath(); ctx.moveTo(x - 6, y - 4); ctx.lineTo(x, y + 1); ctx.lineTo(x + 6, y - 4); ctx.stroke(); },
    onda(ctx, x, y) { ctx.strokeStyle = '#7ae4ff'; ctx.beginPath(); for (let k = -7; k <= 7; k++) { const yy = y + Math.sin(k * 0.8 + G.time * 3) * 3; if (k === -7) ctx.moveTo(x + k, yy); else ctx.lineTo(x + k, yy); } ctx.stroke(); },
    engrenagem(ctx, x, y) { ctx.save(); ctx.translate(x, y); ctx.rotate(G.time); ctx.fillStyle = '#e0b060'; for (let k = 0; k < 8; k++) { ctx.rotate(Math.PI / 4); ctx.fillRect(-1, -6, 2, 3); } ctx.beginPath(); ctx.arc(0, 0, 4, 0, TAU); ctx.fill(); ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.arc(0, 0, 1.5, 0, TAU); ctx.fill(); ctx.restore(); },
    chip(ctx, x, y) { ctx.fillStyle = '#2a3a5a'; ctx.fillRect(x - 5, y - 5, 10, 10); ctx.fillStyle = '#7ae4ff'; for (let k = -4; k <= 4; k += 4) { ctx.fillRect(x + k, y - 7, 1, 2); ctx.fillRect(x + k, y + 5, 1, 2); ctx.fillRect(x - 7, y + k, 2, 1); ctx.fillRect(x + 5, y + k, 2, 1); } ctx.fillStyle = '#ff9ae6'; ctx.fillRect(x - 2, y - 2, 4, 4); }
  };
  // painel holográfico sobre cada barraca: mostra a área em imagem, sem nome escrito
  function painel(ctx, cx, top, tipo, cor) {
    const w = 46, h = 26, x = cx - w / 2, y = top + Math.sin(G.time * 2 + cx * 0.1) * 1.2, t = G.time;
    ctx.save();
    ctx.fillStyle = C.alpha(cor, 0.3); ctx.fillRect(cx - 0.5, y + h, 1, 10);
    ctx.fillStyle = 'rgba(6,12,30,0.88)'; G.rrPath(ctx, x, y, w, h, 3); ctx.fill();
    ctx.strokeStyle = C.alpha(cor, 0.95); ctx.lineWidth = 1; G.rrPath(ctx, x + 0.5, y + 0.5, w - 1, h - 1, 3); ctx.stroke();
    ctx.beginPath(); ctx.rect(x + 2, y + 2, w - 4, h - 4); ctx.clip();
    const X = x + 3, Y = y + 3, PW = w - 6, PH = h - 6;
    if (tipo === 'reta') { // pontos e uma reta que procura o melhor ajuste
      ctx.fillStyle = '#ffe27a';
      for (const [a, b] of [[0.06, 0.85], [0.2, 0.7], [0.34, 0.66], [0.5, 0.45], [0.64, 0.42], [0.8, 0.22], [0.94, 0.18]]) ctx.fillRect(X + a * PW - 1, Y + b * PH - 1, 2, 2);
      const g = Math.sin(t * 1.4) * 0.12 * (0.5 + 0.5 * Math.sin(t * 0.3));
      ctx.strokeStyle = cor; ctx.beginPath(); ctx.moveTo(X, Y + (0.9 + g) * PH); ctx.lineTo(X + PW, Y + (0.12 - g) * PH); ctx.stroke();
    } else if (tipo === 'carta') { // cartas caindo em duas caixas: lixo (×) e entrada (✓)
      ctx.fillStyle = '#5a2a3a'; ctx.fillRect(X + 2, Y + PH - 6, 14, 6); ctx.fillStyle = '#2a5a3a'; ctx.fillRect(X + PW - 16, Y + PH - 6, 14, 6);
      G.text('×', X + 9, Y + PH - 15, '#ff8a7a', { align: 'center', shadow: false }); G.text('✓', X + PW - 9, Y + PH - 15, '#7aff8a', { align: 'center', shadow: false });
      const k = (t % 1.3) / 1.3, lado = Math.floor(t / 1.3) % 3 === 1 ? -1 : 1;
      const ex = cx + lado * 14 * k, ey = Y + 1 + k * (PH - 9);
      ctx.fillStyle = '#f4ecdc'; ctx.fillRect(ex - 3, ey, 6, 4); ctx.strokeStyle = '#c84a4a'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(ex - 3, ey); ctx.lineTo(ex, ey + 2); ctx.lineTo(ex + 3, ey); ctx.stroke();
    } else if (tipo === 'onda') { // o passado (linha cheia) e a previsão (pontilhada)
      ctx.strokeStyle = '#ffe27a'; ctx.lineWidth = 1; ctx.beginPath();
      for (let k = 0; k <= 26; k++) { const yy = Y + PH / 2 - Math.sin((k + t * 6) * 0.38) * PH * 0.35 - k * 0.12; if (k) ctx.lineTo(X + k, yy); else ctx.moveTo(X, yy); }
      ctx.stroke();
      ctx.fillStyle = cor; for (let k = 28; k <= PW; k += 2) ctx.fillRect(X + k, Y + PH / 2 - Math.sin((k + t * 6) * 0.38) * PH * 0.35 - k * 0.12, 1, 1);
    } else if (tipo === 'engrenagem') { // curva de aprendizado: o erro encolhe a cada tentativa
      const hs = [0.95, 0.62, 0.4, 0.26, 0.17, 0.1], vis = 1 + Math.floor(t * 1.5) % 7;
      hs.slice(0, vis).forEach((v, i) => { ctx.fillStyle = i === hs.length - 1 ? '#7aff8a' : cor; ctx.fillRect(X + 2 + i * 7, Y + PH - v * PH, 5, v * PH); });
    } else if (tipo === 'dados') { // colunas de dados descendo
      for (let c = 0; c < 9; c++) for (let r = 0; r < 5; r++) { const a = (Math.sin(c * 7.3 + Math.floor(t * 6 - r + c * 0.7)) + 1) / 2; ctx.fillStyle = C.alpha(cor, 0.25 + 0.7 * a); ctx.fillRect(X + 1 + c * 4.6, Y + 1 + r * 3.8, 2.6, 2.6); }
    }
    ctx.restore();
  }
  class Barraca extends G.Ent { // barraca da feira: toldo listrado, balcão e painel holográfico
    constructor(x, y, titulo, cor, icone) { super(x, y, 3 * TS, TS); this.titulo = titulo; this.cor = cor; this.icone = icone; this.room = 0; }
    get by() { return this.y + this.h; }
    get darkGlow() { return 40; }
    draw(ctx, cam) {
      const x = this.x - cam.x, b = this.y + this.h - cam.y, w = this.w;
      ctx.save();
      ctx.fillStyle = '#3a2a1a'; ctx.fillRect(x + 2, b - 30, 2, 30); ctx.fillRect(x + w - 4, b - 30, 2, 30);
      ctx.fillStyle = '#1b1428'; ctx.fillRect(x - 1, b - 13, w + 2, 13);
      const g = ctx.createLinearGradient(0, b - 12, 0, b); g.addColorStop(0, '#8a6a4a'); g.addColorStop(1, '#5a4030'); ctx.fillStyle = g; ctx.fillRect(x, b - 12, w, 12);
      ctx.fillStyle = '#c8a070'; ctx.fillRect(x, b - 12, w, 1.5);
      for (let k = 0; k < 6; k++) { ctx.fillStyle = k % 2 ? '#f4ecdc' : this.cor; ctx.beginPath(); ctx.moveTo(x - 2 + k * (w + 4) / 6, b - 34); ctx.lineTo(x - 2 + (k + 1) * (w + 4) / 6, b - 34); ctx.lineTo(x - 2 + (k + 1) * (w + 4) / 6, b - 27); ctx.quadraticCurveTo(x - 2 + (k + 0.5) * (w + 4) / 6, b - 23, x - 2 + k * (w + 4) / 6, b - 27); ctx.fill(); }
      ctx.restore();
      ICONES[this.icone](ctx, x + w / 2, b - 6);
      painel(ctx, x + w / 2, b - 64, this.icone, this.cor);
      G.light.add(x + w / 2, b - 50, 34, this.cor, 0.55);
    }
  }
  class Poste extends G.Ent {
    constructor(x, y, cor) { super(x + 6, y + 10, 4, 4); this.solid = true; this.cor = cor || '#7ae4ff'; this.room = 0; }
    draw(ctx, cam) {
      const x = this.cx - cam.x, b = this.y + this.h - cam.y;
      ctx.fillStyle = '#2a2e44'; ctx.fillRect(x - 1, b - 26, 2, 26); ctx.fillRect(x - 3, b - 1, 6, 1.5);
      ctx.fillStyle = this.cor; ctx.fillRect(x - 3, b - 29, 6, 3);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, x, b - 27, 8, this.cor, 0.5); ctx.restore();
      G.light.add(x, b - 22, 40, this.cor, 0.6);
    }
  }
  // ---------- Totens de Dados: adormecidos no meio da água; o capelo os acende ----------
  // os quatro juntos abrem o Portão do Amanhã
  const TOTENS = {
    yhat: { cor: '#7ae4ff', sim: 'ŷ', txt: '^cŷ^0 (lê-se "y-chapéu") é o valor PREVISTO por um modelo, como a altura que a reta da Lavradora Ana prevê.' },
    soma: { cor: '#ffd84a', sim: 'Σ', txt: '^yΣ^0 manda SOMAR todos os valores: é o primeiro passo de toda média.' },
    sigma: { cor: '#ff9ae6', sim: 'σ', txt: '^pσ^0 é o desvio padrão: mede o quanto os dados se ESPALHAM em volta da média.' },
    r: { cor: '#8affc0', sim: 'r', txt: '^gr^0 é o coeficiente de correlação: mede o quanto duas variáveis andam JUNTAS.' }
  };
  const nTotens = () => Object.keys(TOTENS).filter(k => G.flag('totem_' + k)).length;
  let portaoEnt = null;
  class RaioTotem extends G.Ent { // feixe de luz do totem até o portão
    constructor(x0, y0, x1, y1, cor) { super(x0, y0, 2, 2); this.p = [x0, y0, x1, y1]; this.cor = cor; this.room = 0; this.alwaysUpdate = true; }
    get by() { return 999999; }
    update(dt) { this.t += dt; if (this.t > 1.6) this.dead = true; }
    draw(ctx, cam) {
      const [x0, y0, x1, y1] = this.p, k = Math.min(1, this.t / 0.6), a = this.t < 1 ? 1 : Math.max(0, 1 - (this.t - 1) / 0.6);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; ctx.strokeStyle = this.cor; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x0 - cam.x, y0 - cam.y); ctx.lineTo(x0 + (x1 - x0) * k - cam.x, y0 + (y1 - y0) * k - cam.y); ctx.stroke();
      ctx.lineWidth = 0.7; ctx.strokeStyle = '#ffffff'; ctx.stroke(); ctx.restore();
    }
  }
  class Totem extends G.Ent {
    constructor(x, y, id) { super(x + 3, y + 6, 10, 8); this.solid = true; this.id = id; this.room = 0; }
    get aceso() { return G.flag('totem_' + this.id); }
    get darkGlow() { return 30; }
    interBox() { return { x: this.x - 44, y: this.y - 44, w: this.w + 88, h: this.h + 88 }; }
    capeloBox() { return { x: this.x - 4, y: this.y - 26, w: this.w + 8, h: this.h + 30 }; }
    interact() { G.runScript(() => say('Totem de Dados', this.aceso ? TOTENS[this.id].txt : 'Um totem adormecido no meio da água, com um símbolo apagado. Longe demais para tocar... mas algo que voe e volte talvez o desperte.')); }
    onCapelo() {
      if (this.aceso) return;
      G.setFlag('totem_' + this.id); G.sfx('secret'); G.flash(TOTENS[this.id].cor, 0.25, 0.4);
      G.fx.burst(this.cx, this.y - 16, [TOTENS[this.id].cor, '#ffffff'], 16, 70);
      if (portaoEnt) G.addEnt(new RaioTotem(this.cx, this.y - 16, portaoEnt.cx, portaoEnt.y - 40, TOTENS[this.id].cor));
      const n = nTotens(), self = this;
      G.runScript(async () => {
        await say('Totem de Dados', TOTENS[self.id].txt);
        if (n < 4) await say(null, 'Um feixe de luz voou até o ^rPortão do Amanhã^0. Totens acesos: ^y' + n + ' de 4^0.');
        else { G.shake(3, 1.2); G.sfx('zumbido'); await say(null, 'O quarto feixe acerta o portão. Ao longe, um ronco grave: o ^rPortão do Amanhã^0 se abriu!'); }
      });
    }
    update(dt) { this.t += dt; }
    draw(ctx, cam) {
      const T0 = TOTENS[this.id], x = this.cx - cam.x, b = this.y + this.h - cam.y, on = this.aceso, fl = Math.sin(this.t * 2 + this.x) * 1.5;
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(x, b, 9, 3, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#1b1428'; G.rrPath(ctx, x - 6.5, b - 13, 13, 13, 2); ctx.fill();
      const g = ctx.createLinearGradient(x - 6, 0, x + 6, 0); g.addColorStop(0, on ? '#8a96c8' : '#6a6680'); g.addColorStop(1, on ? '#3a4678' : '#3a3648'); ctx.fillStyle = g; G.rrPath(ctx, x - 6, b - 12.5, 12, 12, 2); ctx.fill();
      // cristal flutuante com o símbolo
      const cy = b - 24 + fl;
      ctx.fillStyle = on ? C.alpha(T0.cor, 0.85) : 'rgba(110,108,130,0.7)';
      ctx.beginPath(); ctx.moveTo(x, cy - 9); ctx.lineTo(x + 7, cy); ctx.lineTo(x, cy + 9); ctx.lineTo(x - 7, cy); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = on ? '#ffffff' : '#4a4860'; ctx.lineWidth = 0.6; ctx.stroke();
      ctx.restore();
      G.text(T0.sim, x, cy - 4, on ? '#0a1430' : '#3a3850', { align: 'center', shadow: false });
      if (on) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, x, cy, 14, T0.cor, 0.45 + 0.15 * Math.sin(this.t * 4)); ctx.restore(); G.light.add(x, cy, 38, T0.cor, 0.7); }
    }
  }
  class Drone extends G.Ent { // voa em laço por cima da feira
    constructor(cx, cy, rx, ry, fase) { super(cx, cy, 8, 6); this.c0 = [cx, cy]; this.rx = rx; this.ry = ry; this.fase = fase; this.room = 0; this.alwaysUpdate = true; }
    get by() { return this.y + 9999; }
    update(dt) { this.t += dt; const a = this.t * 0.5 + this.fase; this.x = this.c0[0] + Math.cos(a) * this.rx; this.y = this.c0[1] + Math.sin(a) * this.ry; }
    draw(ctx, cam) {
      const x = this.x - cam.x, y = this.y - cam.y, alt = 34 + Math.sin(this.t * 2) * 3;
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(x, y, 6, 2.5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#1b1428'; ctx.fillRect(x - 5, y - alt - 2, 10, 4);
      ctx.fillStyle = '#c8cce0'; ctx.fillRect(x - 4, y - alt - 1.5, 8, 3);
      const h = Math.sin(this.t * 60) * 3;
      ctx.fillStyle = 'rgba(220,230,255,0.7)'; ctx.fillRect(x - 7 - h / 2, y - alt - 3, 4 + h, 0.6); ctx.fillRect(x + 3 - h / 2, y - alt - 3, 4 + h, 0.6);
      G.light.add(x, y - alt, 8, Math.floor(this.t * 3) % 2 ? '#ff5a6a' : '#5aff8a', 0.7);
    }
  }
  class Pouso extends G.Ent { // pista de pouso da coruja
    constructor(cx, cy) { super(cx - 40, cy - 22, 80, 44); this.room = 0; }
    get by() { return -90000 + this.y; }
    draw(ctx, cam) {
      const x = this.cx - cam.x, y = this.cy - cam.y;
      ctx.save();
      ctx.fillStyle = 'rgba(20,24,40,0.55)'; ctx.beginPath(); ctx.ellipse(x, y, 40, 22, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(x, y, 36, 19, 0, 0, TAU); ctx.stroke();
      ctx.setLineDash([3, 3]); ctx.lineDashOffset = -G.time * 8; ctx.strokeStyle = '#7ae4ff'; ctx.beginPath(); ctx.ellipse(x, y, 30, 15, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
      // emblema da coruja pintado no chão: orelhas, olhos e bico
      ctx.save(); ctx.strokeStyle = 'rgba(255,216,74,0.85)'; ctx.fillStyle = 'rgba(255,216,74,0.85)'; ctx.lineWidth = 1;
      for (const s of [-1, 1]) {
        ctx.beginPath(); ctx.ellipse(x + s * 7, y - 1, 5, 3.6, 0, 0, TAU); ctx.stroke();
        ctx.beginPath(); ctx.arc(x + s * 7, y - 1, 1.5, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x + s * 3, y - 4.5); ctx.lineTo(x + s * 11, y - 9); ctx.lineTo(x + s * 11.5, y - 3.5); ctx.stroke();
      }
      ctx.beginPath(); ctx.moveTo(x - 2, y + 3); ctx.lineTo(x + 2, y + 3); ctx.lineTo(x, y + 6); ctx.closePath(); ctx.fill();
      ctx.restore();
      for (let k = 0; k < 8; k++) { const a = k * TAU / 8; G.light.add(x + Math.cos(a) * 36, y + Math.sin(a) * 19, 8, '#ffd84a', (Math.floor(G.time * 4) + k) % 8 === 0 ? 0.9 : 0.3); }
    }
  }
  class Pavilhao extends G.Ent { // Pavilhão da Inteligência Artificial: cúpula de vidro com circuitos
    constructor(x, y, w) { super(x, y, w, 2 * TS); this.room = 0; }
    get by() { return this.y + this.h; }
    draw(ctx, cam) {
      const x = this.x - cam.x, b = this.y + this.h - cam.y, w = this.w, cx = x + w / 2;
      ctx.save();
      ctx.fillStyle = '#0a0c18'; ctx.fillRect(x - 1, b - 30, w + 2, 30);
      ctx.fillStyle = '#2a3456'; ctx.fillRect(x, b - 29, w, 29); ctx.fillStyle = '#3a4a78'; ctx.fillRect(x, b - 29, w, 2);
      const g = ctx.createRadialGradient(cx, b - 30, 4, cx, b - 30, w / 2); g.addColorStop(0, 'rgba(160,230,255,0.75)'); g.addColorStop(1, 'rgba(60,110,200,0.55)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, b - 30, w / 2 - 4, 44, 0, Math.PI, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 0.6;
      for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.ellipse(cx, b - 30, Math.abs(k) * (w / 2 - 4) / 3.2, 44, 0, Math.PI, TAU); ctx.stroke(); }
      // "cérebro" de luz pulsando dentro da cúpula
      const pu = 0.6 + 0.4 * Math.sin(G.time * 2.5);
      ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, cx, b - 50, 18, '#ff9ae6', 0.5 * pu); ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = C.alpha('#ff9ae6', 0.8); ctx.lineWidth = 1;
      for (let k = 0; k < 6; k++) { const a = k * TAU / 6 + G.time * 0.4; ctx.beginPath(); ctx.moveTo(cx, b - 50); ctx.lineTo(cx + Math.cos(a) * 12, b - 50 + Math.sin(a) * 8); ctx.stroke(); }
      for (let wx = x + 6; wx < x + w - 6; wx += 9) { ctx.fillStyle = '#ffe8a0'; ctx.fillRect(wx, b - 22, 5, 6); }
      ctx.fillStyle = '#141a2c'; ctx.fillRect(cx - 8, b - 14, 16, 14); ctx.fillStyle = '#7ae4ff'; ctx.fillRect(cx - 7, b - 13, 14, 1);
      ctx.restore();
      G.light.add(cx, b - 50, 70, '#ff9ae6', 0.5 * pu);
    }
  }
  class Datacenter extends G.Ent { // o Big Data: fachada com fileiras de servidores, ventoinhas e cabos de luz
    constructor(x, y, w) { super(x, y, w, 2 * TS); this.room = 0; }
    get by() { return this.y + this.h; }
    draw(ctx, cam) {
      const x = this.x - cam.x, b = this.y + this.h - cam.y, w = this.w, cx = x + w / 2, h = 70, t = G.time;
      ctx.save();
      ctx.fillStyle = '#05060e'; ctx.fillRect(x - 1, b - h - 1, w + 2, h + 1);
      const g = ctx.createLinearGradient(0, b - h, 0, b); g.addColorStop(0, '#2a3046'); g.addColorStop(1, '#161a2a'); ctx.fillStyle = g; ctx.fillRect(x, b - h, w, h);
      ctx.fillStyle = '#3a4260'; ctx.fillRect(x, b - h, w, 2);
      // ventoinhas no telhado
      for (let k = 0; k < 4; k++) { const fx = x + 16 + k * (w - 32) / 3, fy = b - h - 5; ctx.fillStyle = '#2a2e44'; ctx.fillRect(fx - 7, fy - 4, 14, 8); ctx.save(); ctx.translate(fx, fy); ctx.rotate(t * 8 + k); ctx.fillStyle = '#8a92b0'; ctx.fillRect(-5, -0.7, 10, 1.4); ctx.fillRect(-0.7, -3, 1.4, 6); ctx.restore(); }
      // janelões com racks de servidores e luzinhas piscando
      const nj = 5, jw = (w - 12) / nj;
      for (let j = 0; j < nj; j++) {
        const jx = x + 6 + j * jw, jy = b - h + 8, jh = h - 26;
        ctx.fillStyle = '#0a1020'; ctx.fillRect(jx + 1, jy, jw - 2, jh);
        for (let rk = 0; rk < 3; rk++) {
          const rx = jx + 3 + rk * (jw - 4) / 3; ctx.fillStyle = '#1c2236'; ctx.fillRect(rx, jy + 2, (jw - 4) / 3 - 1.5, jh - 3);
          for (let u = 0; u < 7; u++) { const on = Math.sin(t * (3 + rk) + u * 1.7 + j * 2.3) > 0.2; ctx.fillStyle = on ? (u % 3 ? '#5aff8a' : '#7ae4ff') : '#203040'; ctx.fillRect(rx + 1, jy + 4 + u * 5, 1.5, 1.5); }
        }
        ctx.fillStyle = 'rgba(122,228,255,0.08)'; ctx.fillRect(jx + 1, jy, jw - 2, jh);
      }
      // porta e o símbolo da nuvem com um banco de dados
      ctx.fillStyle = '#0a0c18'; ctx.fillRect(cx - 9, b - 15, 18, 15); ctx.fillStyle = '#7ae4ff'; ctx.fillRect(cx - 8, b - 14, 16, 1);
      ctx.fillStyle = '#d8ecff'; for (const [dx, dy, r] of [[-6, -h - 14, 5], [0, -h - 17, 7], [7, -h - 14, 5]]) { ctx.beginPath(); ctx.arc(cx + dx, b + dy, r, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#3a8ae8'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(cx, b - h - 12 + k * 3, 4, 1.4, 0, 0, TAU); ctx.fill(); }
      ctx.restore();
      // cabos de luz subindo com pacotes de dados
      for (let k = 0; k < 3; k++) { const px = x + 10 + k * (w - 20) / 2, py = b - h - ((t * 40 + k * 30) % 40); G.light.add(px, py, 8, '#7ae4ff', 0.8); }
      G.light.add(cx, b - 40, 70, '#5aff8a', 0.35);
    }
  }
  class Engrenagem extends G.Ent { // engrenagens decorativas da oficina (girando)
    constructor(x, y, r, v) { super(x, y, 2, 2); this.r = r; this.v = v; this.room = 0; }
    get by() { return -90000 + this.y; }
    draw(ctx, cam) {
      const x = this.x - cam.x, y = this.y - cam.y, n = Math.round(this.r * 1.2);
      ctx.save(); ctx.translate(x, y); ctx.rotate(G.time * this.v);
      ctx.fillStyle = 'rgba(80,60,40,0.85)'; for (let k = 0; k < n; k++) { ctx.rotate(TAU / n); ctx.fillRect(-1.5, -this.r - 2, 3, 3); }
      ctx.beginPath(); ctx.arc(0, 0, this.r, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(160,120,70,0.9)'; ctx.beginPath(); ctx.arc(0, 0, this.r - 2, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(40,30,20,0.9)'; ctx.beginPath(); ctx.arc(0, 0, this.r * 0.35, 0, TAU); ctx.fill();
      ctx.restore();
    }
  }
  class RioDeDados extends G.Ent { // "bits" brilhantes descendo o canal
    constructor(x, y, w, h) { super(x, y, w, h); this.room = 0; }
    get by() { return -90000 + this.y; }
    draw(ctx, cam) {
      for (let i = 0; i < 46; i++) {
        const v = 14 + (i % 5) * 6, x = this.x - cam.x + ((G.hash2(i, 1, 3) * this.w + G.time * v) % this.w), y = this.y - cam.y + 4 + G.hash2(i, 2, 3) * (this.h - 8);
        G.text(i % 3 ? '1' : '0', x, y, i % 2 ? 'rgba(160,240,255,0.75)' : 'rgba(255,240,160,0.75)', { shadow: false });
      }
    }
  }
  class Farol extends G.Ent {
    constructor(x, y) { super(x, y, 24, 16); this.solid = true; this.room = 0; }
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
  class Automato extends G.Ent { // o A-7 treina sozinho na oficina: arremessa, erra, corrige
    constructor(x, y) { super(x + 2, y + 6, 14, 10); this.solid = true; this.room = 0; this.f = 0; this.alvo = 0; this.bola = 0; this.novo(); }
    novo() { this.alvo = G.ri(6, 9) * TS; this.f = this.alvo * G.rf(0.45, 0.6); this.pausa = 1.5; }
    get darkGlow() { return 30; }
    interact() { G.runScript(() => say('Autômato A-7', 'BIP. Estou treinando: a cada arremesso eu meço o meu erro e corrijo uma parte dele. Quer ver de perto? Fale com a Mestra Engrenagem, na feira.')); }
    update(dt) {
      this.t += dt;
      if (this.pausa > 0) { this.pausa -= dt; return; }
      this.bola += dt;
      if (this.bola >= 1) { const e = this.f - this.alvo; this.bola = 0; this.pausa = 0.6; if (Math.abs(e) < 4) { G.fx.burst(this.x + 12 + this.alvo, this.y, ['#7aff8a', '#ffffff'], 8, 40); this.novo(); } else this.f -= 0.6 * e; }
    }
    draw(ctx, cam) {
      const x = this.x - 2 - cam.x, b = this.y + this.h - cam.y, bob = Math.sin(this.t * 3) * 0.6;
      G.shadow(ctx, x + 9, b, 16, 0.3);
      ctx.save();
      ctx.fillStyle = '#1b1428'; G.rrPath(ctx, x + 1, b - 22 + bob, 16, 20, 3); ctx.fill();
      const g = ctx.createLinearGradient(x, 0, x + 18, 0); g.addColorStop(0, '#e0b060'); g.addColorStop(1, '#8a5a24'); ctx.fillStyle = g; G.rrPath(ctx, x + 2, b - 21 + bob, 14, 18, 3); ctx.fill();
      ctx.fillStyle = '#20283a'; G.rrPath(ctx, x + 4, b - 18 + bob, 10, 6, 1.5); ctx.fill();
      ctx.fillStyle = '#7ae4ff'; ctx.fillRect(x + 6, b - 16 + bob, 2, 2); ctx.fillRect(x + 10, b - 16 + bob, 2, 2);
      ctx.fillStyle = '#8a5a24'; ctx.fillRect(x + 8.5, b - 26 + bob, 1, 4); ctx.fillStyle = '#ff6a5a'; ctx.fillRect(x + 7.5, b - 27 + bob, 3, 2);
      // cesto e bola
      const cx = x + 12 + this.alvo; ctx.fillStyle = '#6a4a2a'; ctx.beginPath(); ctx.moveTo(cx - 6, b - 10); ctx.lineTo(cx + 6, b - 10); ctx.lineTo(cx + 4, b); ctx.lineTo(cx - 4, b); ctx.fill();
      if (this.bola > 0) { const k = this.bola, bx = x + 12 + this.f * k, by = b - 16 - Math.sin(Math.PI * k) * 36; ctx.fillStyle = '#ff6a5a'; ctx.beginPath(); ctx.arc(bx, by, 3, 0, TAU); ctx.fill(); }
      ctx.restore();
    }
  }
  class Robo extends G.Ent {
    constructor(x, y, cor, fala, o = {}) { super(x + 2, y + 6, 12, 10); this.solid = true; this.room = 0; this.cor = cor; this.fala = fala; this.anda = o.anda; this.casa = [this.x, this.y]; this.vx = 0; this.vy = 0; this.tm = 1; }
    get darkGlow() { return 30; }
    interact() { this.vx = this.vy = 0; G.runScript(this.fala); }
    update(dt) {
      this.t += dt;
      if (!this.anda) return;
      this.tm -= dt;
      if (this.tm <= 0) { this.tm = G.rf(1, 2.5); const a = Math.random() * TAU, longe = Math.hypot(this.x - this.casa[0], this.y - this.casa[1]) > 48; const ang = longe ? Math.atan2(this.casa[1] - this.y, this.casa[0] - this.x) : a; const v = G.chance(0.35) ? 0 : 22; this.vx = Math.cos(ang) * v; this.vy = Math.sin(ang) * v; }
      G.moveEnt(this, this.vx * dt, this.vy * dt, { avoidHazard: true });
    }
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
  class Cavalete extends G.Ent { // a pintora pinta um quadro novo a cada conversa
    constructor(x, y) { super(x, y + 6, 20, 10); this.solid = true; this.room = 0; this.semente = 1; }
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
  class CorujaPouso extends G.Ent { // a coruja espera no pouso para levar Sigma de volta
    constructor(x, y) { super(x + 2, y + 8, 28, 8); this.solid = true; this.room = 0; }
    get darkGlow() { return 40; }
    interact() {
      G.runScript(async () => {
        const r = await ask(CORUJA, 'Quer voltar ao Pântano de Bayes?', ['Voltar', 'Ainda não', 'O que é esta cidade?'], { cancel: 1 });
        if (r === 0) await G.amanhaVoar('volta'); else if (r === 2) await falaChegada();
      });
    }
    update(dt) { this.t += dt; }
    draw(ctx, cam) {
      const s = G.spr.corujaViva; if (!s) return;
      const x = this.cx - cam.x, base = this.y + this.h - cam.y, pis = this.t % 5 < 0.18; // pisca rápido a cada 5 s
      G.shadow(ctx, x, base, 40, 0.35);
      G.draw(ctx, pis ? 'corujaPedra' : 'corujaViva', x - G.lw(s) / 2, base - G.lh(s) + 4);
      G.draw(ctx, dourado() ? 'capeloOuro' : 'capeloItem', x - 8, base - G.lh(s) - 2);
    }
  }
  async function falaChegada() {
    await say(CORUJA, 'Bem-{vindo|vinda} à ^cCidade do Amanhã^0! Aqui as pessoas usam dados para ^yPREVER^0: o tempo, as marés, as colheitas, até as palavras de uma conversa.');
    await say(CORUJA, 'Hoje é dia de ^yfeira^0: na praça, cada barraca mostra uma grande área da ^ymodelagem preditiva^0, com um jogo e um prêmio único.');
    await say(CORUJA, 'E tudo foi construído com o que você já sabe. Explore à vontade! Quando quiser voltar, é só falar comigo aqui no pouso.');
  }

  // ---------- Portão do Amanhã (fechado até Sigma 2) ----------
  const CACOS = [[-28, 6], [-12, -18], [6, 14], [22, -6], [30, 22], [-20, 30]];
  function desenhaPortao(ctx, x, b, t, brilho, o = {}) {
    // x = centro, b = base; o mesmo desenho aparece na cena depois dos créditos.
    // o.luzes = quantos totens estão acesos; o.abre = 0 (fechado) a 1 (grades recolhidas)
    const abre = o.abre || 0;
    ctx.save();
    ctx.fillStyle = '#0a0612'; ctx.fillRect(x - 64, b - 92, 128, 92);
    const g = ctx.createLinearGradient(0, b - 92, 0, b); g.addColorStop(0, '#3a2a4a'); g.addColorStop(1, '#1a1024'); ctx.fillStyle = g; ctx.fillRect(x - 62, b - 90, 124, 90);
    ctx.fillStyle = '#05030a'; ctx.beginPath(); ctx.moveTo(x - 40, b); ctx.lineTo(x - 40, b - 56); ctx.quadraticCurveTo(x, b - 88, x + 40, b - 56); ctx.lineTo(x + 40, b); ctx.fill();
    ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, x, b - 44, 40, '#ff2a3a', brilho * (0.55 + 0.25 * Math.sin(t * 1.3))); ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#ff3a4a'; ctx.globalAlpha = brilho; ctx.beginPath(); ctx.ellipse(x, b - 44, 5 + 2 * Math.sin(t * 1.3), 2.2, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
    // grades: se recolhem para os lados quando o portão abre
    ctx.fillStyle = '#2a2236'; for (let k = -36; k <= 36; k += 8) { const dx = Math.sign(k || -1) * abre * 34; if (Math.abs(k + dx) > 42) continue; ctx.fillRect(x + k + dx - 1, b - 76 + Math.abs(k) * 0.5, 2.5, 76 - Math.abs(k) * 0.5); }
    if (abre < 0.5) { ctx.fillStyle = '#1a1424'; ctx.fillRect(x - 40, b - 30, 80, 2); }
    for (const [dx, dy] of CACOS) { ctx.fillStyle = '#f0e8f8'; ctx.beginPath(); ctx.moveTo(x + dx, b - 60 + dy); ctx.lineTo(x + dx + 4, b - 62 + dy); ctx.lineTo(x + dx + 2, b - 56 + dy); ctx.fill(); ctx.fillStyle = '#c86aff'; ctx.fillRect(x + dx + 1, b - 60 + dy, 1, 1); }
    // quatro encaixes nos pilares (dois de cada lado): um para cada Totem de Dados
    if (o.luzes !== undefined) {
      const cores = Object.values(TOTENS).map(T0 => T0.cor);
      for (let k = 0; k < 4; k++) {
        const lx = x + (k < 2 ? -52 : 52), ly = b - 52 + (k % 2) * 16, on = k < o.luzes;
        ctx.fillStyle = '#05030a'; ctx.beginPath(); ctx.arc(lx, ly, 4, 0, TAU); ctx.fill();
        ctx.fillStyle = on ? cores[k] : '#2a2236'; ctx.beginPath(); ctx.arc(lx, ly, 2.8, 0, TAU); ctx.fill();
        if (on) { ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, lx, ly, 8, cores[k], 0.6); ctx.globalCompositeOperation = 'source-over'; }
      }
    }
    ctx.restore();
  }
  class Portao extends G.Ent {
    constructor(x, y) { super(x, y, 8 * TS, 16); this.solid = true; this.room = 0; this.abre = nTotens() >= 4 ? 1 : 0; portaoEnt = this; }
    get darkGlow() { return 60; }
    interBox() { return { x: this.x, y: this.y - 8, w: this.w, h: this.h + 20 }; }
    interact() {
      G.runScript(async () => {
        if (nTotens() >= 4) {
          const r = await ask('Portão do Amanhã', G.flag('boss_d9') ? 'O Núcleo está quieto agora. Descer de novo?' : 'As grades se recolheram. Um corredor escuro desce para o ^rNúcleo do Amanhã^0. Entrar?', ['Entrar', 'Agora não'], { cancel: 1 });
          if (r === 0) await entrarNucleo();
          return;
        }
        G.sfx('zumbido');
        await say(null, 'Um portão gigantesco, sem fechadura nem maçaneta. Cacos da ^pmáscara do Viés^0 estão presos nas frestas, e do outro lado uma luz vermelha pisca devagar.');
        await say(null, 'No arco, quatro encaixes: ^y' + nTotens() + ' de 4^0 acesos. Os ^cTotens de Dados^0 espalhados pela cidade devem ter a ver com isso.');
        if (!P().flags.amanhaPortao) {
          P().flags.amanhaPortao = true;
          await say(CORUJA + ' (de longe)', 'Nem eu sei o que há do outro lado, Sigma. Algo ali dentro está aprendendo... com o que o Viés deixou para trás.');
        }
      });
    }
    update(dt) {
      this.t += dt; this.abre = G.approach(this.abre, nTotens() >= 4 ? 1 : 0, dt * 0.5);
      if (Math.random() < 0.05) G.fx.glow(this.cx + G.rf(-40, 40), this.y - G.rf(0, 60), { size: 1.5, color: '#ff3a4a', vy: -10, life: 0.8 });
    }
    draw(ctx, cam) { desenhaPortao(ctx, this.cx - cam.x, this.y + this.h - cam.y, this.t, 1, { luzes: nTotens(), abre: this.abre }); G.light.add(this.cx - cam.x, this.y - 30 - cam.y, 60, '#ff3a4a', 0.5); }
  }

  // ---------- barracas: conversa, minijogo e prêmio ----------
  const PREMIOS = {
    reta: { flag: 'mg_reta', nome: 'um ^yContêiner de Coração^0', dar: () => G.give('heartContainer') },
    triagem: { flag: 'mg_triagem', nome: 'o ^yCapelo Dourado^0', dar: () => G.give('capeloDourado') },
    mares: { flag: 'mg_mares', nome: 'o ^yAmuleto das Marés^0', dar: () => G.give('amuleto') },
    treino: { flag: 'mg_treino', nome: 'a ^yArmadura de Silício^0', dar: () => G.give('armaduraSilicio') },
    turing: { flag: 'mg_turing', nome: 'a ^yEspada do Amanhã^0', dar: () => G.give('espadaAmanha') },
    bigdata: { flag: 'mg_bigdata', nome: 'o ^yTênis de Fibra Ótica^0 (você corre mais rápido)', dar: () => G.give('tenisFibra') }
  };
  const jogar = (mg) => { const prev = G.audio.cur; G.music('minigame'); return new Promise(res => G.ui.push(new MG[mg](v => { G.music(prev); res(v); }))); };
  async function barraca(nome, spr, falas, mg) {
    const pr = PREMIOS[mg], ganhou = G.flag(pr.flag), o = { portrait: spr ? spr + '_down0' : undefined };
    if (!G.flag('mgv_' + mg)) { for (const f of falas) await say(nome, f, o); G.setFlag('mgv_' + mg); }
    const r = await ask(nome, ganhou ? 'Jogar de novo? Quem vence leva 20 moedas.' : 'Se você vencer, o prêmio é ' + pr.nome + ', que só existe aqui!', ['Jogar', 'Agora não', 'Explique de novo'], Object.assign({ cancel: 1 }, o));
    if (r === 2) { for (const f of falas) await say(nome, f, o); return; }
    if (r !== 0) return;
    const venceu = await jogar(mg);
    if (!venceu) { await say(nome, 'Quase! Tente de novo quando quiser.', o); return; }
    if (!ganhou) { G.setFlag(pr.flag); await say(nome, 'Parabéns! Esse prêmio é seu.', o); await pr.dar(); }
    else await G.give('coin', 20);
  }

  // ---------- minijogos ----------
  const I = G.input;
  const W = () => G.W, H = () => G.H;
  function moldura(ctx, titulo) {
    const w = G.W, h = G.H, g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#081428'); g.addColorStop(1, '#14082a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(122,228,255,0.05)'; for (let x = 0; x < w; x += 8) ctx.fillRect(x, 0, 0.5, h); for (let y = 0; y < h; y += 8) ctx.fillRect(0, y, w, 0.5);
    G.panel(ctx, 4, 4, w - 8, h - 8, { r: 5 });
    G.headerBar(ctx, 8, 8, w - 16, 13, '#2a5a9a');
    G.text(titulo, 14, 11, '#7ae4ff', { outline: '#0a1430' });
  }
  function grafico(ctx, x, y, w, h) {
    ctx.save(); ctx.fillStyle = '#060a16'; G.rrPath(ctx, x - 1, y - 1, w + 2, h + 2, 3); ctx.fill();
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#12203c'); g.addColorStop(1, '#0a0f20'); ctx.fillStyle = g; G.rrPath(ctx, x, y, w, h, 2.5); ctx.fill();
    ctx.strokeStyle = 'rgba(122,228,255,0.08)'; ctx.lineWidth = 0.5;
    for (let i = 1; i < 10; i++) { ctx.beginPath(); ctx.moveTo(x + w * i / 10, y); ctx.lineTo(x + w * i / 10, y + h); ctx.stroke(); }
    for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(x, y + h * i / 5); ctx.lineTo(x + w, y + h * i / 5); ctx.stroke(); }
    ctx.restore();
  }
  const gauss = () => { const u = Math.max(1e-6, Math.random()), v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); };
  const linhas = (ctx, txt, x, y, w, cor, lh = 9, centro) => G.wrap(txt, w).forEach((l, i) => G.text(l, x, y + i * lh, cor, centro ? { align: 'center' } : undefined));
  const MG = {};

  // 1) AJUSTE A RETA (Regressão): mover a reta até o erro total ficar perto do mínimo
  MG.reta = class {
    constructor(res) {
      this.res = res; this.t = 0; this.st = 'jogo'; this.msg = '';
      this.X = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const b1 = G.rf(3.5, 5.5), b0 = G.rf(4, 12);
      this.Y = this.X.map(x => Math.round((b0 + b1 * x + gauss() * 3.5) * 10) / 10);
      const mx = st.mean(this.X), my = st.mean(this.Y); let sxy = 0, sxx = 0; this.X.forEach((x, i) => { sxy += (x - mx) * (this.Y[i] - my); sxx += (x - mx) ** 2; });
      this.ob = sxy / sxx; this.oa = my - this.ob * mx; this.min = this.sse(this.oa, this.ob);
      this.a = my; this.b = 0;
    }
    sse(a, b) { return this.X.reduce((s, x, i) => s + (this.Y[i] - (a + b * x)) ** 2, 0); }
    update(dt) {
      this.t += dt;
      if (this.st === 'jogo') {
        if (I.pressed('cancel')) { this.done = true; this.res(false); return; }
        if (I.down('up')) this.a += 14 * dt; if (I.down('down')) this.a -= 14 * dt;
        if (I.down('right')) this.b += 1.6 * dt; if (I.down('left')) this.b -= 1.6 * dt;
        this.a = G.clamp(this.a, -20, 70); this.b = G.clamp(this.b, -3, 9);
        if (I.pressed('confirm')) {
          if (this.sse(this.a, this.b) <= this.min * 1.25) { this.st = 'fim'; this.t = 0; G.sfx('correct'); }
          else { G.sfx('wrong'); this.msg = 'Ainda dá para errar menos: deixe os traços vermelhos curtinhos dos dois lados da reta.'; }
        }
      } else if (this.t > 0.6 && (I.pressed('confirm') || I.pressed('cancel'))) { this.done = true; this.res(true); }
    }
    draw(ctx) {
      moldura(ctx, 'AJUSTE A RETA · Regressão');
      const gx = 30, gy = 28, gw = 220, gh = 140, px = x => gx + x / 10 * gw, py = y => gy + gh - y / 60 * gh;
      grafico(ctx, gx, gy, gw, gh);
      G.text('altura (cm)', gx, gy - 8, '#9a98b0', { shadow: false }); G.text('horas de sol →', gx + gw, gy + gh + 3, '#9a98b0', { align: 'right', shadow: false });
      ctx.save(); ctx.beginPath(); ctx.rect(gx, gy, gw, gh); ctx.clip();
      ctx.strokeStyle = 'rgba(255,106,90,0.85)'; ctx.lineWidth = 1;
      this.X.forEach((x, i) => { ctx.beginPath(); ctx.moveTo(px(x), py(this.Y[i])); ctx.lineTo(px(x), py(this.a + this.b * x)); ctx.stroke(); });
      ctx.strokeStyle = '#7ae4ff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(px(0), py(this.a)); ctx.lineTo(px(10), py(this.a + this.b * 10)); ctx.stroke();
      if (this.st === 'fim') { ctx.strokeStyle = '#7aff8a'; ctx.setLineDash([3, 2]); ctx.beginPath(); ctx.moveTo(px(0), py(this.oa)); ctx.lineTo(px(10), py(this.oa + this.ob * 10)); ctx.stroke(); ctx.setLineDash([]); }
      ctx.fillStyle = '#ffe27a'; this.X.forEach((x, i) => { ctx.beginPath(); ctx.arc(px(x), py(this.Y[i]), 2, 0, TAU); ctx.fill(); });
      ctx.restore();
      const e = this.sse(this.a, this.b), k = G.clamp(this.min / e, 0, 1);
      G.text('ŷ = ' + F(this.a, 1) + ' + ' + F(this.b, 2) + ' · x', 262, 30, '#7ae4ff');
      G.text('Erro total', 262, 46, '#c8c8e0'); G.text('(soma dos quadrados)', 262, 55, '#9a98b0');
      G.text(F(e, 0), 262, 66, k >= 0.8 ? '#7aff8a' : '#ffe27a');
      ctx.fillStyle = '#1a2034'; ctx.fillRect(262, 78, 100, 6); ctx.fillStyle = k >= 0.8 ? '#7aff8a' : '#ffd84a'; ctx.fillRect(262, 78, 100 * k, 6);
      G.text('quão perto do melhor', 262, 87, '#9a98b0', { shadow: false });
      if (this.st === 'jogo') {
        linhas(ctx, 'Os traços vermelhos são os ERROS da reta. A melhor reta deixa a soma dos quadrados dos erros a menor possível.', 262, 102, 110, '#c8c8e0');
        G.text('↑↓ sobe/desce  ←→ inclina', 30, 176, '#ffd84a'); G.text('X: confirmar   Z: sair', 30, 186, '#ffd84a');
        if (this.msg) linhas(ctx, this.msg, 30, 196, 320, '#ff8a7a');
      } else {
        G.text('★ ÓTIMA RETA!', 262, 104, '#7aff8a');
        linhas(ctx, 'A pontilhada verde é a reta de MÍNIMOS QUADRADOS (erro ' + F(this.min, 0) + '). Com ' + F(this.oa, 1) + ' + ' + F(this.ob, 2) + '·x, 10 horas de sol dão ŷ ≈ ' + F(this.oa + this.ob * 10, 0) + ' cm.', 262, 116, 110, '#c8c8e0');
        G.text('X: continuar', 30, 186, '#ffd84a');
      }
    }
  };

  // 2) TRIAGEM RELÂMPAGO (Classificação): spam ou caixa de entrada, contra o relógio
  const CARTAS_POOL = [
    ['PARABÉNS! Você ganhou um castelo. Envie 10 moedas.', true], ['Remédio milagroso cura tudo em 1 dia!!!', true], ['Clique aqui e dobre suas moedas agora', true],
    ['Último aviso: sua conta será bloqueada. Envie a senha.', true], ['Ganhe uma espada lendária GRÁTIS, só hoje!', true], ['Investimento secreto: 1000% de lucro garantido', true],
    ['Você foi sorteado para um prêmio misterioso', true], ['Promoção relâmpago!!! Responda em 5 minutos', true],
    ['Reunião do conselho amanhã às 9h na praça', false], ['Sua encomenda de sementes chegou ao correio', false], ['Lembrete: devolva o livro na biblioteca', false],
    ['A feira de abóboras começa no sábado', false], ['Convite: aniversário da Lia na casa azul', false], ['Relatório da colheita: 32 sacos de trigo', false],
    ['Mestre Gauss: a aula de estatística foi adiada', false], ['Conta de água do mês: 12 moedas', false]
  ];
  MG.triagem = class {
    constructor(res) {
      this.res = res; this.t = 0; this.st = 'jogo'; this.TEMPO = 4.5;
      const sp = G.shuffle(CARTAS_POOL.filter(c => c[1])).slice(0, 6), ok = G.shuffle(CARTAS_POOL.filter(c => !c[1])).slice(0, 6);
      this.cartas = G.shuffle(sp.concat(ok)); this.i = 0; this.tc = this.TEMPO; this.resp = []; this.flash = 0;
    }
    responder(spam) {
      const [, verdade] = this.cartas[this.i];
      this.resp.push({ spam, verdade }); this.flash = 0.45; this.ultOk = spam === verdade; G.sfx(this.ultOk ? 'coin' : 'wrong');
      this.i++; this.tc = this.TEMPO;
      if (this.i >= this.cartas.length) { this.st = 'fim'; this.t = 0; }
    }
    update(dt) {
      this.t += dt; if (this.flash > 0) this.flash -= dt;
      if (this.st === 'jogo') {
        if (I.pressed('cancel')) { this.done = true; this.res(false); return; }
        if (I.pressed('left')) this.responder(true); else if (I.pressed('right')) this.responder(false);
        else { this.tc -= dt; if (this.tc <= 0) this.responder(null); }
      } else if (this.t > 0.6 && (I.pressed('confirm') || I.pressed('cancel'))) { this.done = true; this.res(this.acertos() >= 10); }
    }
    acertos() { return this.resp.filter(r => r.spam === r.verdade).length; }
    draw(ctx) {
      moldura(ctx, 'TRIAGEM RELÂMPAGO · Classificação');
      const w = G.W;
      if (this.st === 'jogo') {
        const [txt] = this.cartas[this.i];
        G.text('Carta ' + (this.i + 1) + ' de ' + this.cartas.length, w / 2, 28, '#9a98b0', { align: 'center' });
        ctx.save(); ctx.fillStyle = '#1b1428'; G.rrPath(ctx, w / 2 - 91, 41, 182, 70, 4); ctx.fill(); ctx.fillStyle = '#f4ecdc'; G.rrPath(ctx, w / 2 - 90, 42, 180, 68, 4); ctx.fill();
        ctx.strokeStyle = '#c8a070'; ctx.beginPath(); ctx.moveTo(w / 2 - 90, 42); ctx.lineTo(w / 2, 70); ctx.lineTo(w / 2 + 90, 42); ctx.stroke(); ctx.restore();
        G.wrap(txt, 160).forEach((l, k) => G.text(l, w / 2, 76 + k * 10, '#2a1a0a', { align: 'center', shadow: false }));
        ctx.fillStyle = '#1a2034'; ctx.fillRect(w / 2 - 90, 116, 180, 4); ctx.fillStyle = this.tc < 1.5 ? '#ff6a5a' : '#7ae4ff'; ctx.fillRect(w / 2 - 90, 116, 180 * this.tc / this.TEMPO, 4);
        G.text('← SPAM', 60, 140, '#ff8a7a', { align: 'center' }); G.text('CAIXA DE ENTRADA →', w - 80, 140, '#7aff8a', { align: 'center' });
        G.text('Acertos: ' + this.acertos() + ' / ' + this.resp.length, w / 2, 140, '#ffe27a', { align: 'center' });
        if (this.flash > 0) G.text(this.ultOk ? 'CERTO!' : 'ERROU!', w / 2, 156, this.ultOk ? '#7aff8a' : '#ff8a7a', { align: 'center' });
        G.text('Separe as cartas antes que o tempo acabe. Vence quem acertar 10 de 12. Z: sair', w / 2, 192, '#9a98b0', { align: 'center' });
      } else {
        const vp = this.resp.filter(r => r.verdade && r.spam === true).length, fn = this.resp.filter(r => r.verdade && r.spam !== true).length;
        const fp = this.resp.filter(r => !r.verdade && r.spam === true).length, vn = this.resp.filter(r => !r.verdade && r.spam !== true).length;
        const ac = this.acertos(), x0 = 40, y0 = 40;
        G.text(ac >= 10 ? '★ ' + ac + ' de 12: VOCÊ VENCEU!' : ac + ' de 12: faltou pouco (precisa de 10).', w / 2, 28, ac >= 10 ? '#7aff8a' : '#ff8a7a', { align: 'center' });
        G.text('MATRIZ DE CONFUSÃO', x0, y0, '#7ae4ff');
        G.text('você disse: SPAM', x0 + 70, y0 + 12, '#9a98b0'); G.text('CAIXA', x0 + 160, y0 + 12, '#9a98b0');
        G.text('era spam', x0, y0 + 26, '#9a98b0'); G.text('era honesta', x0, y0 + 46, '#9a98b0');
        const cel = (v, x, y, cor) => { ctx.fillStyle = C.alpha(cor, 0.25); ctx.fillRect(x, y - 4, 50, 16); G.text(String(v), x + 25, y, cor, { align: 'center' }); };
        cel(vp, x0 + 80, y0 + 26, '#7aff8a'); cel(fn, x0 + 150, y0 + 26, '#ff8a7a'); cel(fp, x0 + 80, y0 + 46, '#ff8a7a'); cel(vn, x0 + 150, y0 + 46, '#7aff8a');
        linhas(ctx, 'Classificar tem DOIS tipos de erro: deixar um spam passar (' + fn + ') e jogar uma carta honesta no lixo (' + fp + '). A matriz de confusão mostra os dois separados, e cada um custa diferente.', 40, 116, 300, '#c8c8e0');
        G.text('X: continuar', w / 2, 192, '#ffd84a', { align: 'center' });
      }
    }
  };

  // 3) PREVISÃO DAS MARÉS (Séries Temporais): continuar tendência e ciclo
  MG.mares = class {
    constructor(res) {
      this.res = res; this.t = 0; this.st = 'jogo'; this.sel = 0;
      const base = G.rf(1.6, 2.2), tend = G.rf(0.03, 0.07), amp = G.rf(0.9, 1.3), per = 8, fase = G.rf(0, TAU);
      this.f = tt => base + tend * tt + amp * Math.sin(TAU * tt / per + fase);
      this.N = 18; this.K = 4;
      this.obs = []; for (let k = 0; k < this.N; k++) this.obs.push(this.f(k) + gauss() * 0.12);
      this.real = []; for (let k = this.N; k < this.N + this.K; k++) this.real.push(this.f(k) + gauss() * 0.12);
      const ult = this.obs[this.N - 1]; this.pred = new Array(this.K).fill(Math.round(ult * 10) / 10);
      this.rep = 0;
    }
    update(dt) {
      this.t += dt;
      if (this.st === 'jogo') {
        if (I.pressed('cancel')) { this.done = true; this.res(false); return; }
        if (I.pressed('left')) { this.sel = Math.max(0, this.sel - 1); G.sfx('select'); }
        if (I.pressed('right')) { this.sel = Math.min(this.K - 1, this.sel + 1); G.sfx('select'); }
        const v = (I.down('up') ? 1 : 0) - (I.down('down') ? 1 : 0);
        if (v) { this.rep -= dt; if (I.pressed('up') || I.pressed('down') || this.rep <= 0) { this.pred[this.sel] = G.clamp(Math.round((this.pred[this.sel] + v * 0.1) * 10) / 10, -1, 6); this.rep = I.pressed('up') || I.pressed('down') ? 0.3 : 0.06; } }
        if (I.pressed('confirm')) {
          this.mae = st.mean(this.pred.map((p, k) => Math.abs(p - this.real[k])));
          this.ingenuo = st.mean(this.real.map(r => Math.abs(this.obs[this.N - 1] - r)));
          this.st = 'fim'; this.t = 0; G.sfx(this.mae <= 0.35 ? 'correct' : 'wrong');
        }
      } else if (this.t > 0.6 && (I.pressed('confirm') || I.pressed('cancel'))) { this.done = true; this.res(this.mae <= 0.35); }
    }
    draw(ctx) {
      moldura(ctx, 'PREVISÃO DAS MARÉS · Séries Temporais');
      const gx = 24, gy = 28, gw = 336, gh = 120, n = this.N + this.K, px = k => gx + 6 + k / (n - 1) * (gw - 12), py = v => gy + gh - (v + 1) / 6 * gh;
      grafico(ctx, gx, gy, gw, gh);
      ctx.fillStyle = 'rgba(122,228,255,0.08)'; ctx.fillRect(px(this.N - 0.5), gy, px(n - 1) - px(this.N - 0.5) + 6, gh);
      G.text('futuro', px(this.N + 1.5), gy + 2, '#7ae4ff', { align: 'center', shadow: false });
      ctx.strokeStyle = '#ffe27a'; ctx.lineWidth = 1; ctx.beginPath(); this.obs.forEach((v, k) => (k ? ctx.lineTo(px(k), py(v)) : ctx.moveTo(px(k), py(v)))); ctx.stroke();
      ctx.fillStyle = '#ffe27a'; this.obs.forEach((v, k) => { ctx.beginPath(); ctx.arc(px(k), py(v), 1.6, 0, TAU); ctx.fill(); });
      this.pred.forEach((v, k) => { const x = px(this.N + k), y = py(v), s = k === this.sel && this.st === 'jogo'; ctx.fillStyle = s ? '#ffffff' : '#7ae4ff'; ctx.fillRect(x - 3, y - 1, 6, 2); if (s) { G.text('▲', x, y - 11, '#ffffff', { align: 'center', shadow: false }); G.text('▼', x, y + 3, '#ffffff', { align: 'center', shadow: false }); } });
      if (this.st === 'fim') { ctx.fillStyle = '#7aff8a'; this.real.forEach((v, k) => { ctx.beginPath(); ctx.arc(px(this.N + k), py(v), 2, 0, TAU); ctx.fill(); }); }
      G.text('altura da maré (m), uma medida por hora', gx, gy + gh + 4, '#9a98b0', { shadow: false });
      if (this.st === 'jogo') {
        linhas(ctx, 'Preveja as 4 próximas horas. Repare na TENDÊNCIA (a maré sobe um pouco a cada ciclo) e na SAZONALIDADE (o ciclo se repete).', 24, 162, 336, '#c8c8e0');
        G.text('←→ escolhe a hora   ↑↓ ajusta   X: confirmar   Z: sair', 24, 192, '#ffd84a');
      } else {
        const ok = this.mae <= 0.35;
        G.text(ok ? '★ PREVISÃO CERTEIRA!' : 'Previsão longe demais da maré real.', 24, 160, ok ? '#7aff8a' : '#ff8a7a');
        linhas(ctx, 'Seu erro médio: ' + F(this.mae, 2) + ' m (precisa de até 0,35). Quem só repete o último valor erraria ' + F(this.ingenuo, 2) + ' m. Pontos verdes: a maré que veio de verdade.', 24, 172, 336, '#c8c8e0');
        G.text('X: continuar', 300, 196, '#ffd84a');
      }
    }
  };

  // 4) TREINE O AUTÔMATO (Aprendizado de Máquina): escolher a taxa de aprendizado
  MG.treino = class {
    constructor(res) {
      this.res = res; this.t = 0; this.st = 'escolha'; this.sel = 0; this.r = 0;
      this.K = [1.6, 1.3, 2.0]; this.TAXAS = [['0,1 (passos curtos)', 0.1], ['0,5 (passos médios)', 0.5], ['1,2 (passos enormes)', 1.2]];
      this.novaRodada();
    }
    novaRodada() { this.alvo = G.ri(110, 170); this.f = this.alvo / this.K[this.r] * 0.5; this.erros = []; this.anim = 0; this.msg = ''; }
    update(dt) {
      this.t += dt;
      if (this.st === 'escolha') {
        if (I.pressed('cancel')) { this.done = true; this.res(false); return; }
        if (I.pressed('up')) { this.sel = (this.sel + 2) % 3; G.sfx('select'); }
        if (I.pressed('down')) { this.sel = (this.sel + 1) % 3; G.sfx('select'); }
        if (I.pressed('confirm')) { this.eta = this.TAXAS[this.sel][1]; this.novaRodada(); this.st = 'treino'; this.anim = 0; }
      } else if (this.st === 'treino') {
        this.anim += dt;
        if (this.anim >= 0.8) {
          this.anim = 0;
          const d = this.K[this.r] * this.f, e = d - this.alvo; this.erros.push(e);
          if (Math.abs(e) < 6) { G.sfx('correct'); this.st = 'acertou'; this.t = 0; }
          else if (this.erros.length >= 5 || Math.abs(e) > 400) { G.sfx('wrong'); this.st = 'falhou'; this.t = 0; this.msg = this.eta < 0.3 ? 'Passos curtos demais: o erro cai devagarinho e não deu tempo.' : Math.abs(e) > Math.abs(this.erros[0]) ? 'Passos enormes: o erro CRESCEU. O treino divergiu!' : 'Passos enormes: passa do ponto e fica indo e voltando.'; }
          else { this.f -= this.eta * e; G.sfx('tink'); }
        }
      } else if (this.t > 0.6 && (I.pressed('confirm') || I.pressed('cancel'))) {
        if (this.st === 'acertou') { this.r++; if (this.r >= 3) { this.done = true; this.res(true); return; } }
        this.st = 'escolha'; this.novaRodada();
      }
    }
    draw(ctx) {
      moldura(ctx, 'TREINE O AUTÔMATO · Aprendizado de Máquina');
      const gx = 16, gy = 30, gw = 210, gh = 100, chao = gy + gh - 8;
      grafico(ctx, gx, gy, gw, gh);
      const x0 = gx + 14, esc = (gw - 40) / 200;
      ctx.fillStyle = '#e0b060'; G.rrPath(ctx, x0 - 6, chao - 16, 12, 16, 2); ctx.fill(); ctx.fillStyle = '#7ae4ff'; ctx.fillRect(x0 - 3, chao - 12, 2, 2); ctx.fillRect(x0 + 1, chao - 12, 2, 2);
      const bx = x0 + this.alvo * esc; ctx.fillStyle = '#6a4a2a'; ctx.fillRect(bx - 6, chao - 8, 12, 8);
      if (this.st === 'treino' && this.erros.length < 5) { const k = this.anim / 0.8, d = this.K[this.r] * this.f; ctx.fillStyle = '#ff6a5a'; ctx.beginPath(); ctx.arc(x0 + d * esc * k, chao - 14 - Math.sin(Math.PI * k) * 60, 3, 0, TAU); ctx.fill(); }
      for (const e of this.erros) { ctx.fillStyle = 'rgba(255,106,90,0.5)'; ctx.fillRect(x0 + (this.alvo + e) * esc - 1, chao - 2, 2, 2); }
      // curva de aprendizado: |erro| a cada tentativa
      const cx = 238, cy = 30, cw = 130, ch = 100; grafico(ctx, cx, cy, cw, ch);
      G.text('|erro| por tentativa', cx + cw / 2, cy - 8, '#9a98b0', { align: 'center', shadow: false });
      const mx = Math.max(60, ...this.erros.map(Math.abs));
      this.erros.forEach((e, k) => { const h = Math.abs(e) / mx * (ch - 10); ctx.fillStyle = Math.abs(e) < 6 ? '#7aff8a' : '#ffd84a'; ctx.fillRect(cx + 8 + k * 24, cy + ch - h, 16, h); G.text(String(k + 1), cx + 16 + k * 24, cy + ch + 2, '#9a98b0', { align: 'center', shadow: false }); });
      G.text('Rodada ' + Math.min(3, this.r + 1) + ' de 3', 16, 138, '#ffe27a');
      if (this.st === 'escolha') {
        G.text('Escolha a TAXA DE APRENDIZADO (quanto o autômato corrige a cada erro):', 16, 150, '#c8c8e0');
        this.TAXAS.forEach(([l], i) => G.text((i === this.sel ? '▶ ' : '  ') + l, 30, 162 + i * 10, i === this.sel ? '#ffe27a' : '#e8e4f4'));
        G.text('↑↓ escolhe   X: treinar   Z: sair', 200, 192, '#ffd84a');
      } else if (this.st === 'treino') G.text('Taxa ' + F(this.eta, 1) + ': treinando...', 16, 150, '#7ae4ff');
      else if (this.st === 'acertou') { G.text('★ ACERTOU em ' + this.erros.length + ' tentativa(s)!', 16, 150, '#7aff8a'); linhas(ctx, 'O autômato corrigiu o erro um pouco de cada vez até acertar o cesto: isso é aprender com exemplos.', 16, 162, 350, '#c8c8e0'); G.text('X: continuar', 300, 192, '#ffd84a'); }
      else { G.text('Não acertou em 5 tentativas.', 16, 150, '#ff8a7a'); linhas(ctx, this.msg, 16, 162, 350, '#c8c8e0'); G.text('X: tentar de novo', 280, 192, '#ffd84a'); }
    }
  };

  // 5) HUMANO OU MÁQUINA? (Inteligência Artificial): frases das lições × frases do modelo de bigramas
  let BIG = null;
  function bigramas() {
    if (BIG) return BIG;
    const prox = new Map(), inicios = [], frases = [];
    for (const id in G.LESSONS) for (const pg of G.LESSONS[id].pages) {
      const txt = String(pg.t).replace(/\^./g, '').replace(/\n+/g, ' ');
      for (const fr of txt.split(/(?<=[.!?])\s+/)) {
        // só prosa: frases com fórmulas, setas ou listas ficam de fora (entregariam quem escreveu)
        const w = fr.split(/\s+/).filter(Boolean); if (w.length < 4 || /[=÷×()[\]:→•√σμΣ%/]/.test(fr)) continue;
        if (/^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(fr)) inicios.push(w[0]);
        if (w.length >= 6 && w.length <= 15 && /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(fr) && /[.!]$/.test(fr)) frases.push(fr.trim());
        for (let i = 0; i < w.length - 1; i++) { const a = w[i].toLowerCase(); if (!prox.has(a)) prox.set(a, []); prox.get(a).push(w[i + 1]); }
      }
    }
    return (BIG = { prox, inicios, frases });
  }
  function fraseMaquina(minimo = 7, ponto = false) {
    const { prox, inicios, frases } = bigramas();
    for (let k = 0; k < 60; k++) {
      const out = [G.pick(inicios)];
      while (out.length < 16) { const ult = out[out.length - 1]; if (/[.!?]$/.test(ult)) break; const op = prox.get(ult.toLowerCase()); if (!op) break; out.push(G.pick(op)); }
      const s = out.join(' ');
      if (out.length < minimo || out.length > 15 || (ponto && !/[.!]$/.test(s)) || frases.includes(s)) continue;
      return /[.!?]$/.test(s) ? s : s + '...';
    }
    return G.pick(inicios) + '...';
  }
  G.fraseMaquina = fraseMaquina;
  MG.turing = class {
    constructor(res) {
      this.res = res; this.t = 0; this.st = 'jogo'; this.i = 0; this.acertos = 0; this.fb = 0;
      const { frases } = bigramas();
      const hum = G.shuffle(frases.slice()).slice(0, 4).map(s => [s, false]), maq = [0, 1, 2, 3].map(() => [fraseMaquina(7, true), true]);
      this.itens = G.shuffle(hum.concat(maq));
    }
    update(dt) {
      this.t += dt; if (this.fb > 0) this.fb -= dt;
      if (this.st === 'jogo') {
        if (I.pressed('cancel')) { this.done = true; this.res(false); return; }
        if (this.fb > 0) return;
        const r = I.pressed('left') ? false : I.pressed('right') ? true : null;
        if (r === null) return;
        this.ultOk = r === this.itens[this.i][1]; if (this.ultOk) this.acertos++; G.sfx(this.ultOk ? 'coin' : 'wrong');
        this.fb = 1.4; this.ultEra = this.itens[this.i][1];
        this.i++; if (this.i >= this.itens.length) { this.st = 'fim'; this.t = -1.2; }
      } else if (this.t > 0.6 && (I.pressed('confirm') || I.pressed('cancel'))) { this.done = true; this.res(this.acertos >= 6); }
    }
    draw(ctx) {
      moldura(ctx, 'HUMANO OU MÁQUINA? · Inteligência Artificial');
      const w = G.W;
      if (this.st === 'jogo' || this.t < 0) {
        const idx = Math.min(this.i, this.itens.length - 1), mostra = this.fb > 0 ? this.itens[this.i - 1] : this.itens[idx];
        G.text('Frase ' + (Math.min(this.i + (this.fb > 0 ? 0 : 1), this.itens.length)) + ' de ' + this.itens.length + '   ·   acertos: ' + this.acertos, w / 2, 28, '#9a98b0', { align: 'center' });
        ctx.save(); ctx.fillStyle = '#1b1428'; G.rrPath(ctx, 31, 43, w - 62, 64, 6); ctx.fill(); ctx.fillStyle = '#e8f0ff'; G.rrPath(ctx, 32, 44, w - 64, 62, 6); ctx.fill(); ctx.restore();
        G.wrap('"' + mostra[0] + '"', w - 90).forEach((l, k) => G.text(l, w / 2, 52 + k * 10, '#1a1028', { align: 'center', shadow: false }));
        if (this.fb > 0) G.text((this.ultOk ? 'CERTO! ' : 'ERROU! ') + (this.ultEra ? 'Foi a MÁQUINA (modelo de bigramas).' : 'Foi um HUMANO (texto das lições).'), w / 2, 118, this.ultOk ? '#7aff8a' : '#ff8a7a', { align: 'center' });
        G.text('← HUMANO', 70, 140, '#ffd84a', { align: 'center' }); G.text('MÁQUINA →', w - 70, 140, '#ff9ae6', { align: 'center' });
        linhas(ctx, 'Quem escreveu? Algumas frases vieram das lições do jogo; outras, do Livro Falante, que escolhe cada palavra só pela anterior. Acerte 6 de 8. Z: sair', w / 2, 160, 330, '#9a98b0', 9, true);
      } else {
        const ok = this.acertos >= 6;
        G.text(ok ? '★ ' + this.acertos + ' de 8: VOCÊ VENCEU!' : this.acertos + ' de 8: precisa de 6.', w / 2, 40, ok ? '#7aff8a' : '#ff8a7a', { align: 'center' });
        linhas(ctx, 'Modelos de linguagem escolhem a próxima palavra pela PROBABILIDADE de ela aparecer depois das anteriores. O Livro Falante só olha UMA palavra para trás, por isso se perde no meio da frase.', w / 2, 62, 320, '#c8c8e0', 10, true);
        linhas(ctx, 'Os modelos de verdade olham centenas de palavras de contexto e aprenderam com bilhões de frases. Mesmo assim, ainda é estatística: palavras prováveis, não garantia de verdade.', w / 2, 112, 320, '#c8c8e0', 10, true);
        G.text('X: continuar', w / 2, 192, '#ffd84a', { align: 'center' });
      }
    }
  };

  // 6) SERVIDORES EM PARALELO (Big Data): dividir uma enxurrada de blocos entre quatro servidores
  MG.bigdata = class {
    constructor(res) {
      this.res = res; this.t = 0; this.st = 'jogo'; this.sel = 0;
      this.TOTAL = 40; this.MAX = 8; this.VEL = 0.9; // cada servidor processa 1 unidade a cada 0,9 s
      this.filas = [[], [], [], []]; this.espera = []; this.criados = 0; this.cheg = 0.5; this.unid = 0; this.tempo = 0; this.flash = [0, 0, 0, 0];
    }
    carga(i) { return this.filas[i].reduce((s, b) => s + b, 0); }
    acabar(ok, motivo) { this.st = 'fim'; this.ok = ok; this.motivo = motivo; this.t = 0; G.sfx(ok ? 'correct' : 'wrong'); }
    update(dt) {
      this.t += dt;
      if (this.st !== 'jogo') { if (this.t > 0.6 && (I.pressed('confirm') || I.pressed('cancel'))) { this.done = true; this.res(this.ok); } return; }
      if (I.pressed('cancel')) { this.done = true; this.res(false); return; }
      this.tempo += dt;
      if (I.pressed('left')) { this.sel = (this.sel + 3) % 4; G.sfx('select'); }
      if (I.pressed('right')) { this.sel = (this.sel + 1) % 4; G.sfx('select'); }
      if (I.pressed('confirm') && this.espera.length) { this.filas[this.sel].push(this.espera.shift()); this.flash[this.sel] = 0.2; G.sfx('switch'); }
      // chegada: cada vez mais rápida
      this.cheg -= dt;
      if (this.cheg <= 0 && this.criados < this.TOTAL) { const b = G.ri(1, 3); this.espera.push(b); this.unid += b; this.criados++; this.cheg = 0.9 - 0.45 * this.criados / this.TOTAL; }
      if (this.espera.length > 4) return this.acabar(false, 'A fila de entrada transbordou: os blocos chegaram mais rápido do que você distribuiu.');
      for (let i = 0; i < 4; i++) {
        if (this.flash[i] > 0) this.flash[i] -= dt;
        const f = this.filas[i]; if (!f.length) continue;
        f[0] -= dt / this.VEL;
        if (f[0] <= 0) { f.shift(); }
        if (this.carga(i) > this.MAX) return this.acabar(false, 'O servidor ' + (i + 1) + ' ficou sobrecarregado: muita coisa para uma máquina só.');
      }
      if (this.criados >= this.TOTAL && !this.espera.length && this.filas.every(f => !f.length)) this.acabar(true);
    }
    draw(ctx) {
      moldura(ctx, 'SERVIDORES EM PARALELO · Big Data');
      const w = G.W;
      // esteira de entrada
      G.text('chegando', 30, 30, '#9a98b0');
      ctx.fillStyle = '#1a2034'; ctx.fillRect(30, 40, 130, 14);
      this.espera.forEach((b, k) => { for (let u = 0; u < b; u++) { ctx.fillStyle = k === 0 ? '#ffe27a' : '#7ae4ff'; ctx.fillRect(34 + k * 30 + u * 7, 43, 6, 8); } });
      G.text('próximo bloco → servidor escolhido (X)', 170, 44, '#c8c8e0');
      // servidores
      for (let i = 0; i < 4; i++) {
        const sx = 40 + i * 80, sy = 70, sw = 56, sh = 96, c = this.carga(i);
        ctx.fillStyle = this.flash[i] > 0 ? '#3a5a8a' : '#141a2c'; G.rrPath(ctx, sx, sy, sw, sh, 3); ctx.fill();
        ctx.strokeStyle = i === this.sel ? '#ffe27a' : '#3a4260'; ctx.lineWidth = i === this.sel ? 1.5 : 1; G.rrPath(ctx, sx + 0.5, sy + 0.5, sw - 1, sh - 1, 3); ctx.stroke();
        ctx.fillStyle = '#ff6a5a'; ctx.fillRect(sx + 4, sy + sh - 6 - this.MAX * 10, sw - 8, 1);
        let yy = sy + sh - 6; for (const b of this.filas[i]) { const hb = b * 10; ctx.fillStyle = c > this.MAX - 2 ? '#ffb05a' : '#7ae4ff'; ctx.fillRect(sx + 8, yy - hb + 1, sw - 16, hb - 2); yy -= hb; }
        for (let u = 0; u < 4; u++) { ctx.fillStyle = (Math.floor(this.t * 6) + u + i) % 4 === 0 && this.filas[i].length ? '#5aff8a' : '#203040'; ctx.fillRect(sx + 6 + u * 5, sy + 4, 2, 2); }
        G.text('servidor ' + (i + 1), sx + sw / 2, sy + sh + 4, i === this.sel ? '#ffe27a' : '#9a98b0', { align: 'center' });
        if (i === this.sel) G.text('▼', sx + sw / 2, sy - 10, '#ffe27a', { align: 'center' });
      }
      if (this.st === 'jogo') {
        G.text('Blocos: ' + this.criados + ' / ' + this.TOTAL, 30, 182, '#ffe27a');
        G.text('←→ escolhe o servidor   X: envia   Z: sair', 150, 182, '#ffd84a');
        G.text('Não deixe nenhum servidor passar da linha vermelha!', w / 2, 194, '#9a98b0', { align: 'center' });
      } else {
        ctx.fillStyle = 'rgba(6,10,24,0.88)'; G.rrPath(ctx, 24, 60, w - 48, 120, 5); ctx.fill();
        G.text(this.ok ? '★ TODOS OS DADOS PROCESSADOS!' : 'Sobrecarga!', w / 2, 70, this.ok ? '#7aff8a' : '#ff8a7a', { align: 'center' });
        const linhasT = this.ok
          ? ['Foram ' + this.unid + ' unidades de trabalho. Os quatro servidores, juntos, levaram ' + F(this.tempo, 0) + ' s. Um servidor sozinho levaria ' + F(this.unid * this.VEL, 0) + ' s só para processar.', 'Isso é ^yBig Data^0: dados demais para uma máquina só. A saída é DIVIDIR o trabalho entre muitas, em paralelo, e depois juntar os resultados.']
          : [this.motivo, 'Dica: mande cada bloco para o servidor com a fila MENOR. Dividir bem o trabalho é o segredo do Big Data.'];
        let yy = 86; for (const l of linhasT) { G.wrap(l.replace(/\^./g, ''), w - 70).forEach(s => { G.text(s, w / 2, yy, '#c8c8e0', { align: 'center' }); yy += 10; }); yy += 4; }
        G.text('X: continuar', w / 2, 166, '#ffd84a', { align: 'center' });
      }
    }
  };

  // ---------- montagem da cidade ----------
  const MORADORES = [
    ['villager2', 'Dona Lúcia', 'A padaria da feira prevê quantos pães vai vender amanhã olhando as vendas de todos os dias. Quase não sobra pão!'],
    ['villager1', 'Seu Raimundo', 'Meu relógio conta meus passos e avisa quando fico parado demais. Ele aprendeu o MEU ritmo.'],
    ['kid1', 'Pedrinho', 'O jogo do meu tablet sabe quando eu vou desistir e fica mais fácil. Não é mágica: ele olha os dados de quem jogou antes!'],
    ['kid2', 'Bia', 'Quando eu tiro foto, a câmera acha os rostos sozinha. Ela aprendeu vendo milhões de fotos!'],
    ['eleitor3', 'Dona Neide', 'O médico daqui usa um programa que olha o raio-X e aponta onde olhar com mais cuidado. Mas quem decide é o médico.'],
    ['eleitor1', 'Seu Jorge', 'A previsão do tempo daqui erra pouco porque usa décadas de medições. Mesmo assim, eu levo guarda-chuva!'],
    ['eleitor5', 'Moça do Mapa', 'O mapa da cidade prevê o trânsito: ele sabe que, na hora da feira, a avenida enche.'],
    ['eleitor2', 'Seu Ademar', 'Cuidado com as previsões: um modelo só aprende com os dados que recebe. Dados enviesados, previsões enviesadas.'],
    ['eleitor4', 'Ana Clara', 'Estou estudando Ciência de Dados. Comecei por média, variância, probabilidade... igualzinho a você!'],
    ['villager1', 'Viajante', 'Tudo nesta cidade usa o que se aprende em Datália: médias, variância, probabilidade, amostras, inferência.']
  ];
  function montarCidade() {
    const m = new G.GameMap('d8', 'dungeon', CW, CH, T.GROUND);
    m.theme = 'am_base'; m.livre = true; m.spec = G.DUNGEONS.d8; m.temaFn = zonaTema;
    const room = { key: 'S', idx: 0, cx: 0, cy: 0, x0: 0, y0: 0, px: 0, py: 0, doors: {}, type: 'cidade', semIcone: true };
    m.rooms = [room]; m.byKey = { S: room };
    const set = (x, y, t) => { if (x >= 0 && y >= 0 && x < CW && y < CH) m.tiles[y * CW + x] = t; };
    const ret = (x0, y0, x1, y1, t) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, t); };
    const ents = [], add = (e) => { e.room = 0; ents.push(e); return e; };
    const L = (x, y) => [x * TS, y * TS];
    // borda dupla de árvores, irregular
    for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) { const b = Math.min(x, y, CW - 1 - x, CH - 1 - y); if (b === 0 || (b === 1 && G.hash2(x, y, 8) < 0.6)) set(x, y, T.TREE); }
    // ruas, praça e canal
    ret(2, 18, 53, 19, T.PATH); ret(8, 27, 50, 28, T.PATH); ret(26, 5, 29, 33, T.PATH);
    ret(13, 9, 42, 17, T.PLAZA);
    ret(2, 22, 53, 23, T.WATER); ret(26, 22, 29, 23, T.BRIDGE); ret(9, 22, 10, 23, T.BRIDGE); ret(45, 22, 46, 23, T.BRIDGE);
    // parque do vale (oeste): horta e laguinho
    for (const y of [4, 6, 8]) ret(3, y, 9, y, T.TALLGRASS);
    ret(4, 12, 7, 14, T.WATER);
    for (const [x, y] of [[11, 3], [3, 10], [10, 11], [2, 16], [11, 15]]) set(x, y, T.TREE);
    // costa (sudoeste): mar e farol
    ret(1, 29, 6, 34, T.WATER); ret(1, 26, 3, 28, T.WATER);
    ret(4, 25, 5, 25, T.BLOCK); add(new Farol(...L(4, 24.5)));
    // portão (norte), entre muralhas
    ret(21, 1, 34, 4, T.CLIFF); ret(24, 1, 31, 4, T.BLOCK); ret(26, 4, 29, 4, T.PATH);
    add(new Portao(...L(24, 3.5)));
    // pavilhão da IA e o datacenter do Big Data
    ret(14, 5, 23, 7, T.BLOCK); add(new Pavilhao(...L(14, 6), 10 * TS));
    ret(32, 5, 41, 7, T.BLOCK); add(new Datacenter(...L(32, 6), 10 * TS));
    { const n = add(new G.NPC(...L(36.5, 8), 'eleitor2', 'Engenheira Dara', () => barraca('Engenheira Dara', 'eleitor2', ['Este é o ^cdatacenter^0: milhares de servidores guardando e processando dados dia e noite.', '^yBig Data^0 é dado demais para uma máquina só. Meu jogo: divida a enxurrada de blocos entre quatro servidores, sem deixar nenhum sobrecarregar.'], 'bigdata'), { room: 0 })); n.scriptId = 'am_bigdata'; }
    // prédios do bairro sul e da oficina
    // prédios: só o café e a escola têm função (e um ícone na porta); os outros são casas e escritórios
    const predios = [[32, 24, 4, 54, '#3a4a7a', null], [38, 24, 5, 70, '#4a3a7a', null], [49, 24, 4, 60, '#3a3a6a', null],
      [33, 30, 5, 48, '#5a3a6a', 'livro'], [40, 30, 4, 64, '#2a4a6a', null], [46, 30, 6, 52, '#3a5a6a', null], [44, 4, 4, 40, '#6a4a2a', null], [49, 9, 4, 36, '#5a3a2a', null], [16, 30, 4, 40, '#3a5a5a', 'cafe']];
    for (const [x, y, w, alt, cor, nome] of predios) { ret(x, y, x + w - 1, y + 1, T.BLOCK); add(new Predio(...L(x, y), w * TS, alt, cor, nome)); }
    // oficina (leste): engrenagens e o A-7 treinando
    for (const [x, y, r, v] of [[46, 11, 7, 0.6], [51, 13, 5, -0.9], [44, 8, 4, -0.7]]) add(new Engrenagem(x * TS, y * TS, r, v));
    ret(47, 15, 50, 17, T.WATER); // tanque de resfriamento da oficina
    add(new Automato(...L(43.5, 13)));
    // canal com bits, pouso da coruja, hologramas, postes e drones
    add(new RioDeDados(2 * TS, 22 * TS, 52 * TS, 2 * TS));
    add(new Pouso(28 * TS, 31.5 * TS));
    add(new CorujaPouso(...L(21, 29.5)));
    // Totens de Dados no meio da água: laguinho do parque, canal, mar e tanque da oficina
    add(new Totem(...L(5, 12.6), 'yhat')); add(new Totem(...L(18, 22.2), 'soma')); add(new Totem(...L(3, 30.6), 'sigma')); add(new Totem(...L(48, 15.6), 'r'));
    for (const y of [6, 20, 26, 33]) { add(new Poste(...L(25, y), y % 4 ? '#ff9ae6' : '#7ae4ff')); add(new Poste(...L(30, y), y % 4 ? '#7ae4ff' : '#ff9ae6')); }
    for (const x of [6, 14, 38, 46, 52]) add(new Poste(...L(x, 17), '#ffe27a'));
    for (let i = 0; i < 4; i++) add(new Drone((14 + i * 9) * TS, (8 + (i % 2) * 18) * TS, G.rf(40, 90), G.rf(20, 40), i * 1.7));
    // barracas da feira (na beira norte da praça) e quem cuida delas
    const B = [
      [14, 13, 'REGRESSÃO', '#8affc0', 'reta', 'villager2', 'Lavradora Ana', 'reta', ['Lembra da minha horta? Agora eu ensino na feira! Com os pontos anotados (sol × altura), a gente traça uma ^creta^0 e ^yprevê^0 quantidades.', 'Meu jogo: ajuste a reta até os erros ficarem pequenininhos. Isso é ^yregressão^0: prever um NÚMERO a partir de outros.']],
      [20, 13, 'CLASSIFICAÇÃO', '#ff9ae6', 'carta', 'villager1', 'Carteiro Tobias', 'triagem', ['Na feira eu ensino a separar cartas: ^rspam^0 ou não? Isso é ^yclassificação^0: prever uma CATEGORIA.', 'É contra o relógio! No fim, mostro a ^cmatriz de confusão^0, com os dois tipos de erro.']],
      [32, 13, 'SÉRIES|TEMPORAIS', '#7ae4ff', 'onda', 'florence', 'Faroleira Marina', 'mares', ['Eu anoto as marés há anos. Elas têm ^ytendência^0 (sobem um pouco a cada ciclo) e ^ysazonalidade^0 (o ciclo se repete).', 'Meu jogo: veja as últimas horas e preveja as próximas. Isso é ^ysérie temporal^0: prever o futuro pelo passado.']],
      [38, 13, 'APRENDIZADO|DE MÁQUINA', '#ffd84a', 'engrenagem', 'quetelet', 'Mestra Engrenagem', 'treino', ['O A-7, lá na oficina, ^yaprende com os próprios erros^0: a cada arremesso, corrige uma parte do erro.', 'O segredo é a ^ctaxa de aprendizado^0: corrigir pouco demais é lento, corrigir demais desanda. Escolha bem!']]
    ];
    for (const [x, y, tit, cor, ic, spr, nome, mg, falas] of B) {
      ret(x, y, x + 2, y, T.BLOCK); add(new Barraca(...L(x, y), tit, cor, ic));
      const n = add(new G.NPC(...L(x + 1, y + 1), spr, nome, () => barraca(nome, spr, falas, mg), { room: 0 })); n.scriptId = 'am_' + mg;
    }
    // pavilhão da IA: robôs na frente
    add(new Robo(...L(16, 8), '#7ae4ff', async () => {
      await say('Robô Tradutor', 'Diga uma frase e eu traduzo! "Bom dia, reino!" vira ^c"Good morning, kingdom!"^0, ^c"Buenos días, reino!"^0 e ^c"Bonjour, royaume!"^0.');
      await say('Robô Tradutor', 'Ninguém me ensinou a gramática regra por regra: eu vi milhões de frases já traduzidas e escolho a tradução mais ^yprovável^0.');
    }));
    const cav = add(new Cavalete(...L(22, 7.6)));
    add(new Robo(...L(20.5, 8), '#ff9ae6', async () => { cav.semente = G.ri(1, 9999); G.sfx('select'); await say('Robô Pintora', 'Pronto, um quadro novo! Eu vi milhares de pinturas e aprendi os padrões delas. Nunca pinto o mesmo quadro duas vezes.'); }));
    add(new Robo(...L(18, 8), '#ffe27a', () => barraca('Livro Falante', null, ['Eu li todas as lições de Datália e agora escrevo frases escolhendo cada palavra pela anterior. Escute: ^c"' + fraseMaquina() + '"^0', 'Meu jogo: descubra quais frases vieram das lições (humanos) e quais eu inventei (máquina). Isso é ^yInteligência Artificial^0 de perto!'], 'turing')));
    add(new Robo(...L(28, 20), '#8affc0', async () => {
      await say('Robô Guia', 'BIP! Bem-{vindo|vinda} à ^cFeira do Amanhã^0. Cada barraca da praça, o Pavilhão da IA e o datacenter têm um jogo com prêmio ÚNICO.');
      await say('Robô Guia', nTotens() < 4 ? 'O portão no fim da avenida tem quatro encaixes apagados. Na Escola de Dados, a Professora Íris sabe mais sobre os ^cTotens^0.' : 'O portão no fim da avenida está ABERTO. Meus sensores não gostam do que tem lá embaixo.');
    }, { anda: true }));
    // moradores andando pela feira
    const spots = [[17, 20], [33, 20], [11, 19], [44, 19], [24, 11], [35, 11], [12, 33], [38, 28], [8, 30], [12, 6]];
    MORADORES.forEach(([spr, nome, fala], i) => { const [x, y] = spots[i]; const n = add(new G.NPC(...L(x, y), spr, nome, async () => say(nome, fala, { portrait: spr + '_down0' }), { room: 0, wander: true })); n.scriptId = 'am_morador'; });
    const vic = add(new G.NPC(...L(41, 15), 'vicente', 'Vicente', async () => {
      await say('Vicente', 'Sigma! Vim estudar como se constroem modelos HONESTOS. Depois de tudo o que eu fiz com os dados... é o mínimo.', { portrait: 'vicente_down0' });
      await say('Vicente', G.flag('boss_d9') ? 'Então era isso que estava atrás do portão... uma máquina aprendendo com as MINHAS mentiras. Eu vou ajudar a consertar isso, Sigma. Prometo.' : 'Mas aquele portão no fim da avenida me dá arrepios. Tem uns cacos da minha antiga máscara presos nele. Parece que ele está... me olhando.', { portrait: 'vicente_down0' });
    }, { room: 0 })); vic.scriptId = 'am_vicente';
    add(new G.Sign(...L(31, 29), '^yCIDADE DO AMANHÃ^0\n↑ Praça da Feira, Pavilhão da IA e Datacenter\n← Parque do Vale   → Oficina\n↑↑ Portão do Amanhã', { name: 'Placa' }));
    // café (recupera a vida) e escola (dicas sobre os totens e o Núcleo)
    { const n = add(new G.NPC(...L(19.5, 32), 'villager2', 'Barista Duda', async () => {
      const k = await ask('Barista Duda', 'Um café quentinho, coado com dados frescos? Recupera toda a sua vida. ^y10 moedas^0.', ['Quero!', 'Agora não'], { cancel: 1, portrait: 'villager2_down0' });
      if (k !== 0) return;
      if (G.P.coins < 10) { await say('Barista Duda', 'Ih, faltam moedas. As barracas da feira pagam prêmios!', { portrait: 'villager2_down0' }); return; }
      G.P.coins -= 10; G.P.hp = G.P.maxHp; G.sfx('heal'); await say('Barista Duda', 'Prontinho! Energia renovada.', { portrait: 'villager2_down0' });
    }, { room: 0 })); n.scriptId = 'am_cafe'; }
    { const n = add(new G.NPC(...L(36.5, 32), 'eleitor3', 'Professora Íris', async () => {
      const o = { portrait: 'eleitor3_down0' };
      if (nTotens() < 4) {
        await say('Professora Íris', 'Os ^cTotens de Dados^0 guardam quatro símbolos da Estatística: ŷ, Σ, σ e r. Dormem no meio da água: no laguinho do parque, no canal, no mar e no tanque da oficina.', o);
        await say('Professora Íris', 'Ninguém alcança a pé... mas algo que voe e volte talvez os desperte. Acesos, os quatro abrem o Portão do Amanhã. Você já acendeu ^y' + nTotens() + ' de 4^0.', o);
      } else if (!G.flag('boss_d9')) {
        await say('Professora Íris', 'O portão abriu! Lá embaixo fica o ^rNúcleo do Amanhã^0, cheio de servidores tomados pelo Viés. Leve poções.', o);
        await say('Professora Íris', 'Dizem que há alavancas do outro lado de um abismo, longe demais para um capelo comum. O ^yCapelo Dourado^0, prêmio do Carteiro Tobias, voa mais longe.', o);
      } else await say('Professora Íris', 'O que você encontrou no Núcleo mostra o maior perigo da era dos dados: um modelo treinado com dados enviesados aprende o viés junto.', o);
    }, { room: 0 })); n.scriptId = 'am_escola'; }
    return { map: m, ents };
  }

  // carregar a cidade no lugar da montagem por salas
  const load0 = G.dun.load;
  G.dun.load = function (did) {
    if (did !== 'd8') return load0.call(this, did);
    const { map, ents } = montarCidade();
    G.map = map; G.ents = []; G.fx.clear(); G.spawners = []; G.boss = null; G.trans = null;
    if (G.resetAmbient) G.resetAmbient();
    for (const e of ents) G.ents.push(e);
    const p = G.player = new G.Player(27.5 * TS - 5, 31 * TS); p.dir = 1; p.lastSafe = { x: p.x, y: p.y };
    G.addEnt(p);
    G.curRoom = -2; this.enterRoom(0, true);
    G.THEMES.am_base.amb = '#cdd2f0';
    camCidade(); G.music('amanha');
    G.ui.regionBanner('Terras do Amanhã', 'a Cidade do Amanhã');
    if (!G.flag('am_chegou')) { G.setFlag('am_chegou'); G.runScript(async () => { await G.wait(1); await falaChegada(); }); }
  };
  function camCidade() {
    const p = G.player; if (!p) return;
    G.cam.x = G.clamp(p.cx - G.W / 2, 0, CW * TS - G.W); G.cam.y = G.clamp(p.cy - 8 - G.H / 2, 0, CH * TS - G.H);
  }
  const upd0 = G.dun.update, roomAt0 = G.dun.roomAt, drawMap0 = G.dun.drawMap;
  G.dun.update = function (dt) { if (G.map && G.map.livre) { camCidade(); return; } return upd0.call(this, dt); };
  G.dun.roomAt = function (px, py) { return G.map && G.map.livre ? G.map.rooms[0] : roomAt0.call(this, px, py); };
  // mapa (M) da cidade: tiles em miniatura, barracas e o portão
  G.dun.drawMap = function (ctx, x, y, w, h) {
    const m = G.map; if (!m || !m.livre) return drawMap0.call(this, ctx, x, y, w, h);
    const sc = Math.min((w - 10) / CW, (h - 24) / CH), ox = x + (w - CW * sc) / 2, oy = y + 14;
    G.text('TERRAS DO AMANHÃ · Cidade do Amanhã', x, y, '#ffd84a');
    const cor = { [T.TREE]: '#1e4a3a', [T.WATER]: '#2a6ab8', [T.BRIDGE]: '#8a5a2a', [T.PATH]: '#4a4e66', [T.PLAZA]: '#6a76a0', [T.BLOCK]: '#2a2e44', [T.CLIFF]: '#3a2a4a', [T.TALLGRASS]: '#3a7a4a' };
    for (let ty = 0; ty < CH; ty++) for (let tx = 0; tx < CW; tx++) { ctx.fillStyle = cor[m.get(tx, ty)] || '#2e6a5a'; ctx.fillRect(ox + tx * sc, oy + ty * sc, sc + 0.3, sc + 0.3); }
    const marca = (tx, ty, txt, c) => G.text(txt, ox + tx * sc, oy + ty * sc - 3, c, { align: 'center', outline: '#0a0818' });
    marca(15, 13, 'R', '#8affc0'); marca(21, 13, 'C', '#ff9ae6'); marca(33, 13, 'S', '#7ae4ff'); marca(39, 13, 'A', '#ffd84a'); marca(19, 6, 'IA', '#ff9ae6'); marca(36.5, 6, 'BD', '#5aff8a'); marca(28, 2, 'X', '#ff5a6a'); marca(22, 29, 'coruja', '#ffd84a');
    for (const [id, tx, ty] of [['yhat', 5.5, 13], ['soma', 18.5, 22.5], ['sigma', 3.5, 31], ['r', 48.5, 16]]) { const on = G.flag('totem_' + id); ctx.fillStyle = on ? TOTENS[id].cor : '#5a5670'; ctx.beginPath(); ctx.arc(ox + tx * sc, oy + ty * sc, 2, 0, TAU); ctx.fill(); }
    const p = G.player;
    if (p && Math.floor(G.time * 4) % 2) { ctx.fillStyle = '#ffffff'; ctx.fillRect(ox + p.cx / TS * sc - 1.5, oy + p.cy / TS * sc - 1.5, 3, 3); }
  };
  // tema por bairro (o themeAt geral já consulta temaFn)

  // ------------------------------------------------------------------
  //  NÚCLEO DO AMANHÃ — mini-masmorra atrás do Portão: servidores tomados
  //  pelo Viés, inimigos fortes e enigmas que pedem os prêmios da feira.
  //  No fundo, o VIÉS 2.0: um modelo treinado com os dados da máscara.
  // ------------------------------------------------------------------
  G.THEMES.d9 = { dun: true, floor: 'tiles', wall: 'blocks', f: ['#0e0e1c', '#161a2c', '#20263c', '#2c344e', '#404a68'], wl: ['#04040a', '#0e101c', '#1a1e30', '#282e46', '#424c6c'], acc: '#ff3a4a', moss: '#3a1a2a', ca: ['#5a1a2a', '#ff3a4a'], w: ['#24306a', '#3a4a8a', '#6a7ac0', '#b0c0f0'], amb: '#a898c8' };
  G.DUNGEONS.d9 = { name: 'Núcleo do Amanhã', theme: 'd9', music: 'castle', topic: 'd6', crystal: 'amostra', grid: [3, 3],
    rooms: {
      S: { at: [1, 2], type: 'start', lesson: 'vies' },
      C1: { at: [0, 2], type: 'combat', enemies: [['ruido', 3, { tier: 3 }], ['outlier', 2, { tier: 3 }]], feat: 'pillars', clearReward: { type: 'key' } },
      K: { at: [2, 2], type: 'cofreDados', enemies: [['morcego', 3, { tier: 3 }]] },
      C2: { at: [0, 1], type: 'combat', enemies: [['cavaleiro', 2, { tier: 2.5 }], ['fantasma', 2, { tier: 3 }], ['pizza', 1, { tier: 3 }]], feat: 'pillars6', clearReward: { type: 'bossKey' } },
      P1: { at: [1, 1], type: 'ponteDados' },
      B: { at: [1, 0], type: 'boss' }
    },
    doors: [['S', 'C1', 'open'], ['S', 'K', 'open'], ['C1', 'C2', 'locked'], ['S', 'P1', 'locked'], ['P1', 'B', 'boss']] };

  // racks de servidores embutidos na parede de cima de cada sala, com luzes vermelhas
  class Rack extends G.Ent {
    constructor(x, y) { super(x, y, 14, 14); }
    get by() { return this.y - 100000; }
    draw(ctx, cam) {
      const x = this.x - cam.x, y = this.y - cam.y;
      ctx.fillStyle = '#05050c'; ctx.fillRect(x, y, 14, 13); ctx.fillStyle = '#1c2034'; ctx.fillRect(x + 1, y + 1, 12, 11);
      for (let u = 0; u < 4; u++) for (let k = 0; k < 3; k++) { const on = Math.sin(G.time * (2 + k) + u * 1.9 + this.x * 0.1) > 0.3; ctx.fillStyle = on ? (k === 2 ? '#ff3a4a' : '#ff8a5a') : '#2a1a24'; ctx.fillRect(x + 3 + k * 3, y + 2 + u * 2.5, 1.5, 1.2); }
      G.light.add(x + 7, y + 6, 14, '#ff3a4a', 0.35);
    }
  }
  const load1 = G.dun.load;
  G.dun.load = function (did) {
    load1.call(this, did);
    if (did === 'd9') for (const r of G.map.rooms) for (const lx of [3, 7, 16, 20]) { const e = G.addEnt(new Rack(r.px + lx * TS + 1, r.py + 2)); e.room = r.idx; }
  };

  // COFRE DE DADOS: a chave flutua numa ilha no meio do abismo; só o capelo a busca
  class PedestalChave extends G.Ent {
    constructor(x, y, c) { super(x + 3, y + 8, 10, 7); this.solid = true; this.c = c; this.levada = G.flag('d9_chaveK'); }
    capeloBox() { return { x: this.x - 3, y: this.y - 22, w: this.w + 6, h: this.h + 24 }; }
    get darkGlow() { return this.levada ? 0 : 28; }
    onCapelo(cap) {
      if (this.levada) return;
      this.levada = true; G.sfx('clink');
      const c = this.c;
      cap.carga = { x: 0, y: 0, w: 10, h: 10, spr: 'key', entregar: () => { G.setFlag('d9_chaveK'); c.solve(); G.runScript(() => G.give('key')); } };
    }
    update(dt) { this.t += dt; }
    draw(ctx, cam) {
      const x = this.x - 3 - cam.x, base = this.y + this.h - cam.y;
      ctx.fillStyle = '#1b1428'; G.rrPath(ctx, x + 2, base - 12, 12, 13, 2); ctx.fill(); ctx.fillStyle = '#3a4260'; G.rrPath(ctx, x + 2.5, base - 11.5, 11, 12, 2); ctx.fill();
      ctx.fillStyle = '#ff3a4a'; ctx.fillRect(x + 3, base - 11, 10, 1);
      if (this.levada) return;
      const by = base - 26 + Math.sin(this.t * 2.5) * 1.5;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, x + 8, by + 8, 14, '#ffd84a', 0.4); ctx.restore();
      G.draw(ctx, 'key', x, by); G.light.add(x + 8, by + 8, 30, '#ffd84a', 0.6);
    }
  }
  G.PUZ.cofreDados = (c) => {
    const { r, setL, L, add } = c;
    for (let ly = 2; ly <= 10; ly++) for (let lx = 7; lx <= 16; lx++) if (!(lx >= 11 && lx <= 12 && ly >= 5 && ly <= 7)) setL(lx, ly, T.PIT);
    add(new PedestalChave(...L(11.5, 5.6), c), r.idx);
    return {
      prompt: '^yCOFRE DE DADOS^0: uma chave flutua sobre o abismo, numa ilha no meio da sala. Longe demais para pular... mas não para um capelo.',
      dicas: ['Fique na beira do abismo, de frente para a ilha, e arremesse o capelo (C).', 'O capelo traz de volta o que ele toca: inclusive chaves.'],
      rewardPos: [3, 10]
    };
  };

  // ABISMO DE DADOS: duas alavancas do outro lado erguem a ponte; só o Capelo Dourado chega lá
  G.PUZ.ponteDados = (c) => {
    const { r, setL, L, add } = c, feito = c.solved;
    for (let ly = 2; ly <= 9; ly++) for (let lx = 1; lx <= 22; lx++) setL(lx, ly, feito && (lx === 11 || lx === 12) ? T.FLOOR2 : T.PIT);
    const alav = [];
    const conferir = () => {
      if (c.isSolved() || !alav.every(a => a.on)) return;
      for (let ly = 2; ly <= 9; ly++) for (const lx of [11, 12]) setL(lx, ly, T.FLOOR2);
      G.sfx('secret'); G.shake(2, 0.6); G.ui.toast('Uma ponte de luz atravessa o abismo!', '#7aff8a'); c.solve();
    };
    for (const lx of [5, 18]) { const a = add(new G.Lever(...L(lx, 1), () => conferir()), r.idx); if (feito) a.on = true; alav.push(a); }
    return {
      prompt: '^yABISMO DE DADOS^0: do outro lado, duas alavancas erguem uma ponte. Estão longe... MUITO longe.',
      dicas: ['Fique bem embaixo de uma alavanca, na beira do abismo, e arremesse o capelo para cima.', 'O capelo comum não chega tão longe. O ^yCapelo Dourado^0, prêmio do Carteiro Tobias na feira, voa mais.'],
      rewardPos: [11, 11]
    };
  };

  // ---------- VIÉS 2.0: um holograma treinado com os dados da máscara ----------
  // tem um escudo de dados que só o capelo quebra; depois da metade da vida, foge (gancho de Sigma 2)
  class Vies2 extends G.Boss {
    constructor(x, y, arena) {
      // sem golpe crítico com pergunta: o desafio dele é o escudo, e a fuga na metade da vida encerra a luta
      super(x, y, 28, 14, { hp: 90, name: 'VIÉS 2.0', topic: 'd6', dmg: 4, arena, thr: [], xp: 150 });
      this.escudo = true; this.fase = 0; this.alvo = [x, y]; this.senteCapelo = true;
    }
    hurtbox() { return { x: this.x - 4, y: this.y - 44, w: this.w + 8, h: 58 }; }
    contactBox() { return { x: this.x + 4, y: this.y - 6, w: this.w - 8, h: this.h + 6 }; }
    vulnerable() { return this.escudo ? 0 : 1; }
    onHit(d, sx, sy, kind, crit) {
      if (this.dead || this.dying || this.fugindo || this.st === 'intro') return false;
      if (this.escudo) {
        if (kind === 'capelo') { this.escudo = false; this.stun = 3.2; G.sfx('shock'); G.flash('#7ae4ff', 0.3, 0.4); G.fx.burst(this.cx, this.y - 20, ['#7ae4ff', '#ffffff'], 24, 90); G.ui.toast('O escudo de dados quebrou! Agora, a espada!', '#7aff8a'); return true; }
        // a primeira dica é um enigma; se o herói insistir com a espada, ela fica explícita
        if (!this.avisou) { this.avisou = true; this.avisoT = G.time; G.ui.toast('Um escudo de dados! A espada não passa... talvez algo que voe e volte.', '#ffd84a'); }
        else if (G.time - this.avisoT > 8) { this.avisoT = G.time; G.ui.toast('A espada não passa do escudo. Jogue o CAPELO nele (tecla C) e bata enquanto ele estiver tonto!', '#ffd84a'); }
      }
      const res = super.onHit(d, sx, sy, kind, crit);
      if (!this.fugindo && this.hp <= this.maxHp * 0.5) this.fugir();
      return res;
    }
    next() {
      this.escudo = true;
      this.st = G.pick(['rajada', 'mira', 'invoca', 'rajada', 'mira']); this.stT = 0; this.disparos = 0;
      const a = this.arena; this.alvo = [a.x + G.rf(30, a.w - 60), a.y + G.rf(20, a.h * 0.5)];
    }
    atirar(ang, v = 110) { const s = G.addEnt(new G.EShot(this.cx, this.y - 18, Math.cos(ang) * v, Math.sin(ang) * v, { spr: 'outBall', dmg: 4, life: 3, size: 6 })); s.room = this.room; }
    ai(dt) {
      if (this.fugindo) return;
      if (!this.falou) {
        this.falou = true;
        G.runScript(async () => {
          await say('VIÉS 2.0', 'Olá, Sigma. Eu sou o que sobrou da máscara... treinado com TODOS os dados que ele escolheu mostrar.');
          await say('VIÉS 2.0', 'Eu aprendi a prever o que vocês vão pensar. Quer ver como eu erro com toda a confiança do mundo?');
        });
      }
      // flutua em direção ao alvo, balançando
      this.x += (this.alvo[0] - this.x) * Math.min(1, dt * 1.2); this.y += (this.alvo[1] - this.y) * Math.min(1, dt * 1.2) + Math.sin(this.t * 3) * 0.3;
      this.clampArena(4);
      this.stT += dt;
      const p = G.player;
      if (this.st === 'rajada') { // anéis de pacotes de dados
        if (this.stT > 0.6 + this.disparos * 0.7 && this.disparos < 3) { const n = 10, off = this.disparos * 0.3; for (let k = 0; k < n; k++) this.atirar(off + k * TAU / n, 95); this.disparos++; G.sfx('beam'); }
        if (this.stT > 3) this.next();
      } else if (this.st === 'mira') { // previsões rápidas na direção do herói
        if (p && this.stT > 0.5 + this.disparos * 0.35 && this.disparos < 4) { const a = Math.atan2(p.cy - (this.y - 18), p.cx - this.cx); for (const d of [-0.18, 0, 0.18]) this.atirar(a + d, 150); this.disparos++; G.sfx('hook'); }
        if (this.stT > 2.6) this.next();
      } else if (this.st === 'invoca') { // chama bots de ruído
        if (this.stT > 0.6 && !this.disparos) {
          this.disparos = 1;
          const vivos = G.ents.filter(e => e.isEnemy && !e.isBoss && !e.dead && e.room === this.room).length;
          for (let k = 0; k < Math.max(0, 3 - vivos); k++) { const e = G.makeEnemy('ruido', this.arena.x + G.rf(30, this.arena.w - 40), this.arena.y + G.rf(40, this.arena.h - 30), { room: this.room, tier: 2.5 }); G.addEnt(e); }
          G.sfx('warp');
        }
        if (this.stT > 2) this.next();
      } else this.next();
    }
    fugir() {
      this.fugindo = true; this.noContact = true; this.alwaysUpdate = true; this.escudo = true; this.stun = 0;
      const self = this, r = G.map.rooms.find(rr => rr.idx === self.room);
      for (const e of G.ents) if (e instanceof G.EShot || (e.isEnemy && !e.isBoss && e.room === self.room)) e.dead = true;
      G.music(null);
      G.runScript(async () => {
        G.shake(4, 1); G.sfx('zumbido');
        await G.wait(0.8);
        await say('VIÉS 2.0', 'Interessante. Você aprende rápido, Sigma... eu também. Cada golpe seu virou um dado novo para mim.');
        await say('VIÉS 2.0', 'Esta versão foi só um teste. A próxima vai ser treinada com os dados do reino INTEIRO. E aí... quem vai prever quem?');
        self.sumindo = 0.001; G.sfx('warp');
        await G.wait(2.2);
        self.dead = true; G.boss = null; G.addXP(self.xp);
        G.setFlag('boss_d9'); G.setFlag('d9_hc'); G.setFlag('d9_crystalGot');
        G.dun.unlock(r);
        await say(null, 'O Viés 2.0 se desfez em pacotes de luz e escapou pelos cabos do Núcleo... para longe de Datália.');
        await new Promise(res => G.ui.push(new CartaoSigma2(res)));
        G.dun.bossRoom(r); // com a vitória marcada, aparece o portal de volta
        G.saveGame(); G.restoreMusic();
      });
    }
    update(dt) {
      super.update(dt);
      if (this.sumindo) { this.sumindo += dt; for (let k = 0; k < 2; k++) G.fx.glow(this.cx + G.rf(-16, 16), this.y - G.rf(0, 44), { size: 2, color: G.pick(['#ff3a4a', '#7ae4ff', '#ffffff']), vy: -G.rf(40, 90), life: 0.8 }); }
    }
    draw(ctx, cam) {
      const x = this.cx - cam.x, base = this.y + this.h - cam.y, t = this.t, a = this.sumindo ? Math.max(0, 1 - this.sumindo / 2) : 1;
      if (a <= 0) return;
      const jx = Math.random() < 0.08 ? G.rf(-3, 3) : 0;
      ctx.save(); ctx.globalAlpha = a;
      ctx.strokeStyle = 'rgba(255,58,74,0.6)'; ctx.lineWidth = 1; ctx.setLineDash([2, 3]); ctx.lineDashOffset = -t * 20; ctx.beginPath(); ctx.ellipse(x, base, 24, 7, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
      G.drawVies(ctx, x + jx, base - 6 + Math.sin(t * 2) * 3, t * 0.3, Math.random() < 0.1 || this.hurtT > 0, true, a);
      ctx.save(); ctx.globalAlpha = a;
      for (let k = 0; k < 6; k++) { const an = t * 1.5 + k * TAU / 6, ox = Math.cos(an) * 22, oy = Math.sin(an) * 8 - 26; ctx.fillStyle = k % 2 ? '#f0e8f8' : '#c86aff'; ctx.beginPath(); ctx.moveTo(x + ox, base + oy - 3); ctx.lineTo(x + ox + 3, base + oy); ctx.lineTo(x + ox - 1, base + oy + 2); ctx.fill(); }
      if (this.escudo && !this.fugindo && this.st !== 'intro') {
        ctx.strokeStyle = 'rgba(122,228,255,' + (0.45 + 0.2 * Math.sin(t * 5)) + ')'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(x, base - 22, 22, 28, 0, 0, TAU); ctx.stroke();
        for (let k = 0; k < 8; k++) { const an = k * TAU / 8 + t * 0.5; ctx.beginPath(); ctx.moveTo(x + Math.cos(an) * 14, base - 22 + Math.sin(an) * 18); ctx.lineTo(x + Math.cos(an) * 22, base - 22 + Math.sin(an) * 28); ctx.stroke(); }
      }
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,40,60,0.12)';
      for (let yy = base - 52; yy < base; yy += 3) ctx.fillRect(x - 18, yy + (t * 20) % 3, 36, 1);
      ctx.restore();
      G.light.add(x, base - 26, 50, '#ff3a4a', 0.6 * a);
    }
  }
  G.Vies2 = Vies2;
  const mkBossAntes = G.makeBoss;
  G.makeBoss = (id, x, y, arena) => (id === 'd9' ? new Vies2(x, y, arena) : mkBossAntes(id, x, y, arena));
  const musBoss0 = G.bossMusic;
  G.bossMusic = (b) => (b instanceof Vies2 ? 'vies' : musBoss0(b));

  // cartão "A Lenda de Sigma 2" depois da fuga
  class CartaoSigma2 {
    constructor(res) { this.res = res; this.t = 0; }
    update(dt) { this.t += dt; if (this.t > 1.5 && (G.input.pressed('confirm') || G.input.pressed('cancel')) || this.t > 7) { this.done = true; this.res(); } }
    draw(ctx) {
      const W = G.W, H = G.H, k = Math.min(1, this.t / 1.2);
      ctx.fillStyle = 'rgba(0,0,0,' + (0.85 * k) + ')'; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.globalAlpha = k;
      G.textBig('A LENDA DE SIGMA 2', W / 2, H / 2 - 24, '#ffffff', { align: 'center', gradient: ['#ffffff', '#ff8aa0'], outline: '#1a0a2a' });
      G.text('em breve', W / 2, H / 2 + 6, '#ffd84a', { align: 'center' });
      if (this.t > 1.5) G.text('X: continuar', W / 2, H - 20, '#9a98b0', { align: 'center' });
      ctx.restore();
    }
  }

  // entrar e sair do Núcleo
  async function entrarNucleo() {
    G.sfx('door');
    await G.ui.fade(1, 0.4);
    G.dun.load('d9'); P().lastDungeon = 'd9';
    G.saveGame();
    await G.ui.fade(0, 0.4);
    if (!G.flag('d9_entrou')) { G.setFlag('d9_entrou'); await say(null, 'Um corredor de servidores, quente e barulhento. Luzes vermelhas piscam no ritmo de uma respiração... e há cacos da máscara do Viés por toda parte.'); }
  }
  const exitAntes = G.exitDungeon;
  G.exitDungeon = () => {
    if (!(G.map && G.map.id === 'd9')) { exitAntes(); return; }
    G.runScript(async () => {
      await G.ui.fade(1, 0.35);
      G.dun.load('d8');
      const p = G.player; p.x = 27.5 * TS - 5; p.y = 6 * TS; p.dir = 0; p.lastSafe = { x: p.x, y: p.y };
      P().lastDungeon = 'd8'; G.saveGame();
      await G.ui.fade(0, 0.35);
    });
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
