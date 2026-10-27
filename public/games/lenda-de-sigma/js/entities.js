'use strict';
// =====================================================================
//  Entidades: herói, itens, objetos interativos, projéteis, bombas.
// =====================================================================
(function (G) {
  G.ents = [];
  G.curRoom = -1;
  const CHARGE_T = 0.9; // tempo para carregar o raio
  const ATK_PREP = 0.033, ATK_SWING = 0.075; // tempos do golpe da espada (s)
  // cores do rastro por nível da espada
  const SWORD_FX = [{ body: '#fff6e0', edge: '#ffb84a' }, { body: '#e8f6ff', edge: '#6ac8ff' }, { body: '#eef0ff', edge: '#8a8aff' }, { body: '#e8fcff', edge: '#ffd23a' }, { body: '#e0fffa', edge: '#3affd8' }];
  G.SWORD_FX = SWORD_FX;
  G.addEnt = e => { G.ents.push(e); return e; };
  G.sameRoom = e => e.room === -1 || e.room === G.curRoom;
  G.flag = k => !!(G.P && G.P.flags[k]);
  G.setFlag = (k, v = true) => { if (G.P) G.P.flags[k] = v; };

  class Ent {
    constructor(x, y, w, h) {
      this.x = x; this.y = y; this.w = w; this.h = h; this.z = 0;
      this.vx = 0; this.vy = 0; this.dead = false; this.t = 0;
      this.room = G.curRoom; this.solid = false;
    }
    get cx() { return this.x + this.w / 2; }
    get cy() { return this.y + this.h / 2; }
    get by() { return this.y + this.h; } // base (para ordenação)
    update(dt) { this.t += dt; }
    draw(ctx, cam) { }
  }
  G.Ent = Ent;

  // ------------------------------------------------------------------
  //  Dano / cura / XP
  // ------------------------------------------------------------------
  G.xpNeeded = lv => Math.floor(18 * Math.pow(lv, 1.45));
  G.atk = () => { const P = G.P; return 1 + P.swordLv + Math.floor((P.level - 1) / 2) + (G.player && G.player.superT > 0 ? 2 : 0); };
  G.def = () => { const P = G.P; return P.armorLv + Math.floor(P.level / 3); };
  // equipamento: P.espadas/P.armaduras guardam o que já foi conquistado; swordLv/armorLv são os EQUIPADOS.
  // saves antigos não têm as listas: valem todas as peças até a equipada (a evolução era em sequência)
  const faixa = n => Array.from({ length: n + 1 }, (_, i) => i);
  G.equip = {
    espadas() { const P = G.P; if (!P.espadas) P.espadas = faixa(P.swordLv); return P.espadas; },
    armaduras() { const P = G.P; if (!P.armaduras) P.armaduras = faixa(P.armorLv); return P.armaduras; },
    melhorEspada() { return Math.max(...this.espadas()); },
    melhorArmadura() { return Math.max(...this.armaduras()); },
    ganhar(tipo, lv) { const l = tipo === 'espada' ? this.espadas() : this.armaduras(); if (!l.includes(lv)) { l.push(lv); l.sort((a, b) => a - b); } G.P[tipo === 'espada' ? 'swordLv' : 'armorLv'] = lv; },
    tem(tipo, lv) { return (tipo === 'espada' ? this.espadas() : this.armaduras()).includes(lv); },
    // peça que chega fora de ordem (comprada ou forjada depois de uma melhor): entra na coleção e só é
    // equipada se for melhor que a do corpo (com o escudo no braço, nenhuma espada o tira); devolve se equipou
    guardar(tipo, lv) {
      const escudo = tipo === 'espada' && G.P.escudo && G.P.usaEscudo;
      if (!escudo && lv > G.P[tipo === 'espada' ? 'swordLv' : 'armorLv']) { this.ganhar(tipo, lv); return true; }
      const l = tipo === 'espada' ? this.espadas() : this.armaduras();
      if (!l.includes(lv)) { l.push(lv); l.sort((a, b) => a - b); }
      return false;
    },
    trocar(tipo) { const l = tipo === 'espada' ? this.espadas() : this.armaduras(), k = tipo === 'espada' ? 'swordLv' : 'armorLv'; const i = l.indexOf(G.P[k]); G.P[k] = l[(i + 1) % l.length]; return l.length > 1; }
  };
  G.rollDamage = (mul = 1) => {
    let d = G.atk() + G.ri(0, 2);
    let crit = Math.random() < 0.04 + G.P.sab * 0.006;
    if (crit) d *= 2;
    d = Math.max(1, Math.round(d * mul));
    return { d, crit };
  };
  G.addXP = n => {
    const P = G.P; P.xp += n;
    let up = false;
    while (P.xp >= G.xpNeeded(P.level)) { P.xp -= G.xpNeeded(P.level); P.level++; up = true; }
    if (up) {
      P.hp = P.maxHp; G.sfx('levelup');
      G.ui.toast('NÍVEL ' + P.level + '! ATQ ' + G.atk() + '  DEF ' + G.def() + '  (vida restaurada)', '#7ae4ff');
      if (G.player) {
        const p = G.player; G.fx.text(p.cx, p.y - 18, 'NÍVEL ' + P.level + '!', '#7ae4ff', true);
        G.flash('#bff4ff', 0.3, 0.35); G.fx.ring(p.cx, p.cy - 4, 34, '#7ae4ff', 0.5, 3); G.fx.ring(p.cx, p.cy - 4, 20, '#ffffff', 0.35, 2);
        for (let i = 0; i < 18; i++) G.fx.glow(p.cx + G.rf(-10, 10), p.cy + G.rf(-4, 6), { size: 3, color: G.pick(['#7ae4ff', '#ffffff', '#ffe27a']), vy: -G.rf(30, 70), vx: G.rf(-15, 15), life: G.rf(0.6, 1.1) });
      }
    }
  };
  G.healPlayer = n => { const P = G.P; P.hp = Math.min(P.maxHp, P.hp + n); };
  G.hurtPlayer = (dmg, sx, sy, o = {}) => {
    const p = G.player, P = G.P;
    if (!p || p.state === 'dead' || p.state === 'hold' || p.state === 'pipe') return false;
    if (!o.force && (p.inv > 0 || p.starT > 0)) return false;
    const d = o.raw ? dmg : Math.max(1, dmg - G.def());
    P.hp = Math.max(0, P.hp - d);
    P.stats.hurt = (P.stats.hurt || 0) + d;
    p.inv = o.inv !== undefined ? o.inv : 1.0;
    p.hurtAnim = 0.3;
    if (sx !== undefined && !o.noKb) {
      const a = Math.atan2(p.cy - sy, p.cx - sx);
      p.kbx = Math.cos(a) * 170; p.kby = Math.sin(a) * 170; p.kbT = 0.14;
    }
    G.sfx('hurt'); G.shake(2, 0.15); G.flash('#ff2040', 0.18, 0.22); G.hitStop = Math.max(G.hitStop, 0.05);
    G.fx.spark(p.cx, p.cy - 8, '#ffb0b0', 9);
    G.fx.text(p.cx, p.y - 12, '-' + d, '#ff6a6a');
    if (P.hp <= 0) G.playerDie();
    return true;
  };
  G.recordQuiz = (topic, ok) => {
    const P = G.P; if (!P) return;
    const s = P.stats.quiz[topic] = P.stats.quiz[topic] || { c: 0, t: 0 };
    s.t++; if (ok) { s.c++; P.sab++; G.addXP(6); }
  };
  G.cycleSub = () => {
    const P = G.P, list = [];
    if (P.items.bombs) list.push('bomb');
    if (P.items.beam) list.push('beam');
    if (P.items.hook) list.push('hook');
    if (P.items.capelo) list.push('capelo');
    if (!list.length) return;
    const i = list.indexOf(P.sub);
    P.sub = list[(i + 1) % list.length];
    G.sfx('select');
  };

  // ------------------------------------------------------------------
  //  Concessão de itens
  // ------------------------------------------------------------------
  const ITEMS = {
    sword: ['swordIcon', 'ESPADA DE TREINO', 'Pressione ^yX^0 para atacar! Corte arbustos, quebre potes e golpeie blocos ^y?^0 para ganhar moedas.'],
    boots: ['boots', 'BOTAS DE SALTO', 'Agora seu pulo (^yZ^0) vai MAIS ALTO e MAIS LONGE: atravesse buracos e riachos estreitos, passe por cima de cercas e pedras e PISE nos inimigos para um ataque duplo.'],
    bombs: ['bomb', 'BOMBAS BINOMIAIS', 'Pressione ^yC^0 para colocar uma bomba. Explodem rochas e paredes rachadas. ^yQ^0 troca o item ativo.'],
    beam: ['beamItem', 'RAIO AMOSTRAL', 'Pressione ^yC^0 para atirar. SEGURE ^yC^0 para carregar um tiro poderoso! Quebra barreiras de cristal.'],
    suit: ['suit', 'TRAJE TÉRMICO', 'Protege do frio extremo das montanhas e do calor da crosta de magma: com ele, dá para atravessá-la!'],
    spin: ['scroll', 'GOLPE GIRATÓRIO', 'SEGURE ^yX^0 depois de um golpe até a espada brilhar e SOLTE para girar, acertando tudo ao redor!']
  };
  G.ITEMS = ITEMS;
  G.give = async function (kind, n, o = {}) {
    const P = G.P, p = G.player;
    switch (kind) {
      case 'coin': P.coins = Math.min(999, P.coins + n); P.stats.coinsTotal += n; G.sfx(n >= 5 ? 'bigcoin' : 'coin'); if (p) G.fx.text(p.cx, p.y - 14, '+' + n, '#ffd84a'); return;
      case 'heart': G.healPlayer(n || 4); G.sfx('heart'); return;
      case 'bombs':
        if (!P.items.bombs) return G.give('coin', 5); // ainda não tem as Bombas Binomiais
        P.bombs = Math.min(P.bombMax, P.bombs + (n || 3)); G.sfx('heart'); if (p) G.fx.text(p.cx, p.y - 14, '+' + (n || 3) + ' bombas', '#c8c8ff'); return;
      case 'xp': G.addXP(n); return;
      case 'mushroom': G.healPlayer(4); if (p) p.superT = 30; G.sfx('powerup'); G.ui.toast('SUPER COGUMELO! Ataque +2 por 30s', '#ff8a5a'); return;
      case 'star': if (p) p.starT = 10; G.sfx('star'); G.music('star'); G.ui.toast('ESTRELA! Invencível por 10s!', '#ffd84a'); return;
    }
    // itens com animação de "levantar"
    if (p) { p.state = 'hold'; p.holdItem = null; }
    G.cutscene++;
    try {
      if (kind === 'key') {
        const did = G.map.id; P.keys[did] = (P.keys[did] || 0) + 1;
        if (p) p.holdItem = 'key'; G.sfx('itemget');
        await G.ui.banner('key', 'CHAVE PEQUENA', 'Abre uma porta trancada desta masmorra.');
      } else if (kind === 'bossKey') {
        P.bossKey[G.map.id] = true; if (p) p.holdItem = 'bossKey'; G.sfx('fanfare');
        await G.ui.banner('bossKey', 'CHAVE DO GUARDIÃO', 'Abre a grande porta do chefe desta masmorra!');
      } else if (kind === 'heartPiece') {
        // o ícone mostra quanto do coração já está montado: um quarto, metade, três quartos ou inteiro
        P.heartPieces++; G.sfx('itemget');
        const k = P.heartPieces % 4;
        if (p) p.holdItem = k ? 'heartPiece' + k : 'heartContainer';
        if (k === 0) { P.maxHp += 4; P.hp = P.maxHp; await G.ui.banner('heartContainer', 'CORAÇÃO COMPLETO!', '4 fragmentos formaram um novo coração! Vida máxima aumentou.'); }
        else await G.ui.banner('heartPiece' + k, 'FRAGMENTO DE CORAÇÃO', 'Você já montou ' + ['', 'um quarto', 'metade', 'três quartos'][k] + ' de um coração (' + k + '/4). Com 4 fragmentos, ele fica inteiro e sua vida máxima aumenta.');
      } else if (kind === 'heartContainer') {
        P.maxHp += 4; P.hp = P.maxHp; if (p) p.holdItem = 'heartContainer'; G.sfx('fanfare');
        await G.ui.banner('heartContainer', 'CONTÊINER DE CORAÇÃO', 'Sua vida máxima aumentou em um coração!');
      } else if (kind === 'potion') {
        P.potions = Math.min(5, P.potions + (n || 1)); if (p) p.holdItem = 'potion'; G.sfx('itemget');
        await G.ui.banner('potion', 'POÇÃO VERMELHA', 'Restaura 4 corações. Use pelo menu (Enter → Status → Z). Você tem ' + P.potions + '.');
      } else if (kind === 'item') {
        const it = ITEMS[n]; P.items[n] = true;
        if (n === 'bombs') { P.bombs = P.bombMax; P.sub = 'bomb'; }
        if (n === 'beam') P.sub = 'beam';
        if (n === 'boots') P.flags.gotBoots = true;
        if (p) p.holdItem = it[0]; G.sfx('fanfare');
        await G.wait(0.3);
        await G.ui.banner(it[0], it[1] + ' ADQUIRIDO!', it[2], { color: '#7ae4ff' });
      } else if (kind === 'crystal') {
        if (!P.crystals.includes(n)) P.crystals.push(n);
        if (p) p.holdItem = 'crystal_' + n; G.sfx('crystal');
        const names = { media: 'DA MÉDIA', mediana: 'DA MEDIANA', dispersao: 'DA DISPERSÃO', prob: 'DO ACASO', distrib: 'DA DISTRIBUIÇÃO', amostra: 'DA AMOSTRA' };
        await G.wait(0.6);
        await G.ui.banner('crystal_' + n, 'CRISTAL ' + names[n] + '!', 'Você recuperou ' + P.crystals.length + ' de 6 Cristais da Razão. O equilíbrio do reino começa a voltar...', { color: '#ff9ae6' });
      } else if (kind === 'sword') {
        P.items.sword = true; if (p) p.holdItem = 'swordIcon'; G.sfx('fanfare');
        await G.ui.banner(ITEMS.sword[0], ITEMS.sword[1], ITEMS.sword[2], { color: '#7ae4ff' });
      }
    } finally {
      G.cutscene--;
      if (p && p.state === 'hold') { p.state = 'normal'; p.holdItem = null; }
    }
  };

  // ------------------------------------------------------------------
  //  HERÓI
  // ------------------------------------------------------------------
  class Player extends Ent {
    constructor(x, y) {
      super(x, y, 10, 8);
      this.room = -1;
      this.dir = 0; this.walkT = 0; this.state = 'normal';
      this.inv = 0; this.kbx = 0; this.kby = 0; this.kbT = 0;
      this.vz = 0; this.atkT = 0; this.hitSet = new Set();
      this.spinCharging = false; this.spinCharge = 0; this.charge = 0;
      this.starT = 0; this.superT = 0; this.pushT = 0;
      this.lastSafe = { x, y }; this.coldT = 0; this.cold = false; this.stompChain = 0;
      this.bombCD = 0; this.shotCD = 0; this.fallT = 0; this.moving = false; this.holdItem = null;
      this.alwaysUpdate = false;
    }
    get speed() { return 82; }
    update(dt) {
      const P = G.P, inp = G.input;
      this.t += dt;
      if (this.inv > 0) this.inv -= dt;
      if (this.starT > 0) { this.starT -= dt; if (this.starT <= 0) G.restoreMusic(); if (Math.random() < 0.5) G.fx.spawn({ x: this.cx + G.rf(-6, 6), y: this.y - 4 + G.rf(-8, 6), vy: -20, life: 0.4, color: G.pick(['#ffd84a', '#ff6aa0', '#7ae4ff', '#ffffff']), size: 1 }); }
      if (this.superT > 0) this.superT -= dt;
      this.bombCD -= dt; this.shotCD -= dt; if (this.liftT > 0) this.liftT -= dt;
      if (this.hurtAnim > 0) this.hurtAnim -= dt; if (this.landT > 0) this.landT -= dt;
      if (this.castT > 0) this.castT -= dt; if (this.chargeFlash > 0) this.chargeFlash -= dt;
      if (this.state === 'fall') { this.fallT += dt; if (this.fallT > 0.6) this.respawnSafe(); return; }
      if (this.state === 'hold' || this.state === 'dead' || this.state === 'pipe' || this.state === 'frozen') return;
      if (this.state === 'pull') { this.moving = true; this.walkT += dt; return; }

      // --- direção / movimento ---
      const canMove = this.state === 'normal';
      const ax = canMove ? inp.axis() : { x: 0, y: 0 };
      this.moving = !!(ax.x || ax.y);
      if (this.moving && !this.spinCharging) {
        if (ax.x && ax.y) {
          const c = this.dir;
          const ok = (c === 2 && ax.x < 0) || (c === 3 && ax.x > 0) || (c === 1 && ax.y < 0) || (c === 0 && ax.y > 0);
          if (!ok) this.dir = ax.y < 0 ? 1 : 0;
        } else this.dir = ax.x ? (ax.x < 0 ? 2 : 3) : (ax.y < 0 ? 1 : 0);
      }
      let spd = this.speed * (this.spinCharging ? 0.55 : this.charge > 0.12 ? 0.7 : 1);
      let tx = ax.x * spd, ty = ax.y * spd;
      if (ax.x && ax.y) { tx *= 0.7071; ty *= 0.7071; }
      const under = G.map.tileAtPx(this.cx, this.cy);
      this.onIce = this.z <= 0 && G.TP[under].ice;
      if (this.onIce) { this.vx = G.approach(this.vx, tx, 150 * dt); this.vy = G.approach(this.vy, ty, 150 * dt); }
      else { this.vx = tx; this.vy = ty; }
      let mx = this.vx, my = this.vy;
      if (this.kbT > 0) { this.kbT -= dt; mx = this.kbx; my = this.kby; }
      const r = G.moveEnt(this, mx * dt, my * dt, { nudge: true, low: this.z > 5 });
      if (this.moving) {
        this.walkT += dt;
        // a cada passada: poeirinha e o som do passo (o chão escolhe o timbre)
        if (Math.floor(this.walkT * 4.5) !== Math.floor((this.walkT - dt) * 4.5) && this.z <= 0) {
          if (!this.onIce) G.fx.spawn({ x: this.cx + G.rf(-2, 2), y: this.y + this.h, vx: -this.vx * 0.15, vy: -6, kind: 'puff', size: 1.6, color: G.map.kind === 'dungeon' ? '#a8a098' : '#d8d0b0', life: 0.3, drag: 3 });
          if (G.footstep) G.footstep(this);
        }
      } else this.walkT = 0;

      // --- empurrar blocos ---
      if (canMove && this.moving && !(ax.x && ax.y) && ((ax.x && r.hitX) || (ax.y && r.hitY))) {
        const pb = this.entInFront(e => e.pushable);
        if (pb) { this.pushT += dt; if (this.pushT > 0.3) { pb.push(this.dir); this.pushT = 0; } } else this.pushT = 0;
      } else this.pushT = 0;

      // --- pulo ---
      if (this.z > 0 || this.vz > 0) {
        this.z += this.vz * dt; this.vz -= 620 * dt;
        if (this.z <= 0) { this.z = 0; this.vz = 0; this.land(); }
      }

      // --- ações ---
      if (this.state === 'normal') {
        if (inp.pressed('a')) {
          if (this.carry) {
            const tgt = this.entInFront(e => e.acceptCarry && G.sameRoom(e));
            if (tgt && tgt.acceptCarry(this)) return;
            if (this.carry.throwable) { this.throwCarry(); return; }
            G.ui.toast('Coloque o caixote em outra pilha (fique de frente para ela).', '#ffd84a'); return;
          }
          const it = this.entInFront(e => e.interact && e.canInteract !== false && G.sameRoom(e));
          if (it) { it.interact(this); return; }
          const lf = this.entInFront(e => e.liftable && !e.dead && G.sameRoom(e));
          if (lf) { lf.dead = true; this.carry = { spr: lf.liftSpr || 'pot', throwable: true, ent: lf }; G.sfx('pot'); this.liftT = 0.15; return; }
          if (P.items.sword) this.startAttack();
        }
        if (this.spinCharging) {
          if (inp.down('a')) {
            const before = this.spinCharge; this.spinCharge += dt;
            const tip = this.swordTip();
            if (this.spinCharge < 0.75 && this.spinCharge > 0.1 && Math.random() < 0.6) G.fx.converge(tip.x, tip.y, 14, G.pick(['#ffe27a', '#ffffff', '#ffb84a']), 1, 0.22);
            if (before < 0.75 && this.spinCharge >= 0.75) { G.sfx('charge'); G.fx.ring(tip.x, tip.y, 12, '#ffe27a', 0.25, 1.5); G.fx.burst(tip.x, tip.y, ['#ffffff', '#ffe27a'], 8, 50); this.chargeFlash = 0.2; }
          }
          else { if (this.spinCharge >= 0.75) this.startSpin(); this.spinCharging = false; this.spinCharge = 0; }
        }
        // sem as botas, um pulinho: fica abaixo de 5 px (não cruza cercas nem pedras) e não vence um buraco de 1 tile
        if (inp.pressed('b') && this.z <= 0) { this.vz = P.items.boots ? 168 : 68; this.z = 0.01; G.sfx('jump'); }
        if (inp.pressed('sw')) G.cycleSub();
        if (P.sub === 'bomb' && P.items.bombs && inp.pressed('c')) this.placeBomb();
        if (P.sub === 'beam' && P.items.beam) {
          if (inp.down('c')) {
            if (inp.pressed('c')) { this.fireShot(false); this.charge = 0.001; }
            else if (this.charge > 0) {
              const b = this.charge; this.charge += dt;
              const h = this.handPos();
              if (this.charge > 0.15 && this.charge < CHARGE_T && Math.random() < 0.75) G.fx.converge(h.x, h.y, 20, G.pick(['#7ae4ff', '#bff4ff', '#ffffff']), 1, 0.24);
              if (b < 0.15 && this.charge >= 0.15) G.sfx('select');
              if (b < CHARGE_T && this.charge >= CHARGE_T) {
                G.sfx('charge'); this.chargeFlash = 0.25;
                G.fx.ring(h.x, h.y, 18, '#bff4ff', 0.3, 2); G.fx.burst(h.x, h.y, ['#ffffff', '#7ae4ff'], 12, 70);
                G.fx.text(this.cx, this.y - 30, 'PRONTO!', '#7ae4ff');
              }
              if (this.charge >= CHARGE_T && Math.random() < 0.4) G.fx.glow(h.x + G.rf(-5, 5), h.y + G.rf(-4, 4), { size: 2.5, color: '#7ae4ff', vy: -18, life: 0.45 });
            }
          } else { if (this.charge >= CHARGE_T) this.fireShot(true); this.charge = 0; }
        }
        if (inp.pressed('start')) { G.openPause(0); return; }
        if (inp.pressed('map')) { G.openPause(1); return; }
      }
      if (this.state === 'attack') {
        this.atkT += dt;
        if (this.atkT >= 0.03 && this.atkT <= 0.2) this.swordHits(this.swordRect(), 1, 'sword');
        if (this.atkT >= 0.26) {
          this.state = 'normal';
          if (P.items.spin && inp.down('a')) { this.spinCharging = true; this.spinCharge = 0; }
        }
      } else if (this.state === 'spin') {
        this.atkT += dt;
        this.swordHits({ x: this.cx - 24, y: this.cy - 26, w: 48, h: 44 }, 2, 'spin');
        if (this.atkT >= 0.42) this.state = 'normal';
      }

      // --- perigos do chão ---
      if (this.z <= 0) {
        const tp = G.TP[G.map.tileAtPx(this.cx, this.cy)];
        // na água, só cai quando passa da margem desenhada (pisar no barranco não derruba)
        if (tp.pit || (tp.water && (!G.inDeepWater || G.inDeepWater(this.cx, this.cy)))) { this.startFall(tp.water ? 'water' : 'pit'); return; }
        if (tp.lava && !P.items.suit) { this.startFall('lava'); return; }
        // com o traje, a crosta solta brasas sob os pés
        if (tp.lava && this.moving && Math.random() < 0.35) G.fx.spawn({ x: this.cx + G.rf(-4, 4), y: this.y + this.h, vy: -G.rf(15, 35), vx: G.rf(-8, 8), color: G.pick(['#ff9a3a', '#ffd040', '#ff5a1a']), size: 1, life: G.rf(0.3, 0.6) });
        if (this.allSafe()) this.lastSafe = { x: this.x, y: this.y };
      }
      // --- frio ---
      this.cold = G.map.kind === 'overworld' && G.world.biomeAt(Math.floor(this.cx / 16), Math.floor(this.cy / 16)) === 'montanha' && !P.items.suit;
      if (this.cold) {
        this.coldT += dt;
        if (Math.random() < 0.3) G.fx.spawn({ x: this.cx + G.rf(-8, 8), y: this.y - 10, vy: 15, vx: G.rf(-5, 5), life: 0.6, color: '#e8f8ff', size: 1 });
        if (this.coldT > 1.4) { this.coldT = 0; G.sfx('freeze'); G.hurtPlayer(1, undefined, undefined, { raw: true, inv: 0.2, noKb: true }); if (!P.flags.coldWarn) { P.flags.coldWarn = true; G.ui.toast('Frio extremo! Sem proteção você perde vida aqui.', '#c8f0ff'); } }
      } else this.coldT = 0;
    }
    allSafe() {
      const pts = [[this.x, this.y], [this.x + this.w - 1, this.y], [this.x, this.y + this.h - 1], [this.x + this.w - 1, this.y + this.h - 1]];
      for (const [px, py] of pts) { const tp = G.TP[G.map.tileAtPx(px, py)]; if (tp.hazard && !(tp.lava && G.P.items.suit)) return false; }
      return true;
    }
    unstick() {
      if (!G.rectBlocked(this.x, this.y, this.w, this.h, this, { ghostEnts: true })) return;
      for (let r = 2; r <= 24; r += 2) for (const [dx, dy] of [[0, r], [0, -r], [r, 0], [-r, 0], [r, r], [-r, r], [r, -r], [-r, -r]]) {
        if (!G.rectBlocked(this.x + dx, this.y + dy, this.w, this.h, this, { ghostEnts: true })) { this.x += dx; this.y += dy; return; }
      }
    }
    land() {
      G.sfx('land'); this.landT = 0.12;
      G.fx.smoke(this.cx, this.y + this.h, 4, G.map.kind === 'dungeon' ? '#c8c0b8' : '#e0d8c0', 22);
      this.unstick();
      // pisão (Mario!)
      let stomped = false;
      for (const e of G.ents) {
        if (!e.isEnemy || e.dead || !G.sameRoom(e) || e.flying && !e.stompable) continue;
        if (G.overlap({ x: this.x - 3, y: this.y - 2, w: this.w + 6, h: this.h + 4 }, e.hurtbox ? e.hurtbox() : e)) {
          const { d, crit } = G.rollDamage(2);
          if (e.onHit(d, this.cx, this.cy - 10, 'stomp', crit)) { stomped = true; G.P.stats.dmg.push(d); }
        }
      }
      if (stomped) {
        this.stompChain++; this.vz = 150; this.z = 0.01; G.sfx('stomp');
        if (this.stompChain >= 2) { G.give('coin', this.stompChain); G.fx.text(this.cx, this.y - 20, 'COMBO x' + this.stompChain, '#ffd84a'); }
      } else this.stompChain = 0;
    }
    startFall(kind) {
      if (this.carry && this.carry.puzzle && this.carry.from) this.carry.from.count++;
      this.carry = null;
      this.state = 'fall'; this.fallT = 0; this.fallKind = kind;
      G.sfx(kind === 'water' ? 'splash' : kind === 'lava' ? 'burn' : 'fall');
      if (kind === 'water') G.fx.burst(this.cx, this.cy, ['#ffffff', '#8ad0ff'], 10, 50);
      if (kind === 'lava') G.fx.burst(this.cx, this.cy, ['#ffd040', '#ff7a1a'], 12, 60);
    }
    respawnSafe() {
      this.x = this.lastSafe.x; this.y = this.lastSafe.y; this.state = 'normal'; this.z = 0; this.vz = 0;
      this.kbT = 0; this.vx = this.vy = 0;
      G.hurtPlayer(this.fallKind === 'lava' ? 4 : 2, undefined, undefined, { force: true, noKb: true });
    }
    probe(d = this.dir, reach = 12) {
      const c = this.cx, m = this.cy;
      if (d === 0) return { x: c - 6, y: this.y + this.h - 2, w: 12, h: reach };
      if (d === 1) return { x: c - 6, y: this.y - reach - 4, w: 12, h: reach + 2 };
      if (d === 2) return { x: this.x - reach, y: m - 8, w: reach, h: 12 };
      return { x: this.x + this.w, y: m - 8, w: reach, h: 12 };
    }
    entInFront(filter) {
      const pr = this.probe();
      let best = null, bd = 1e9;
      for (const e of G.ents) {
        if (e === this || e.dead || !G.sameRoom(e) || !filter(e)) continue;
        const box = e.interBox ? e.interBox() : e;
        if (G.overlap(pr, box)) { const d = G.dist(this.cx, this.cy, e.cx, e.cy); if (d < bd) { bd = d; best = e; } }
      }
      return best;
    }
    startAttack() { this.state = 'attack'; this.atkT = 0; this.hitSet.clear(); G.sfx('sword'); }
    atkEase() { const p = G.clamp((this.atkT - ATK_PREP) / ATK_SWING, 0, 1); return 1 - (1 - p) * (1 - p) * (1 - p); }
    // quadro do golpe: 0 preparo, 1 golpe, 2 continuação (giro e raio usam o 1)
    atkFrame() { if (this.state !== 'attack') return 1; return this.atkT < ATK_PREP ? 0 : this.atkEase() < 0.55 ? 1 : 2; }
    throwCarry() {
      const d = G.DIRS[this.dir];
      G.addEnt(new Thrown(this.cx - 7, this.y - 12, d.x * 190, d.y * 190, this.carry));
      this.carry = null; G.sfx('jump');
    }
    startSpin() {
      this.state = 'spin'; this.atkT = 0; this.hitSet.clear(); G.sfx('spin');
      G.fx.ring(this.cx, this.cy - 4, 30, '#ffe27a', 0.4, 2.5); G.fx.ring(this.cx, this.cy - 4, 20, '#ffffff', 0.25, 1.5);
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; G.fx.spawn({ x: this.cx + Math.cos(a) * 10, y: this.cy - 4 + Math.sin(a) * 8, vx: Math.cos(a + 1.2) * 120, vy: Math.sin(a + 1.2) * 90, kind: 'streak', color: '#fff4c0', life: 0.25, drag: 4, w: 0.8 }); }
    }
    // ponta da espada (mundo) na pose de ataque
    swordTip() { const h = this.handPos(true), a = [Math.PI / 2, -Math.PI / 2, Math.PI, 0][this.dir]; return { x: h.x + Math.cos(a) * 16, y: h.y + Math.sin(a) * 16 }; }
    // mão na pose de ataque/arremesso (mundo)
    handPos(raw) {
      const base = G.spriteHeroi();
      const view = this.dir === 0 ? 'down' : this.dir === 1 ? 'up' : 'side';
      const ref = G.spr[base + '_down0'], lw = G.lw(ref), lh = G.lh(ref);
      const sx = this.cx - lw / 2, sy = this.y + this.h + 1 - lh - this.z;
      const h = G.dollHand(base, view), flip = this.dir === 2, d = G.DIRS[this.dir];
      const k = raw ? 0 : 3;
      return { x: sx + (flip ? lw - h.x : h.x) + d.x * k, y: sy + h.y + d.y * k };
    }
    swordRect() {
      const x = this.x, y = this.y;
      switch (this.dir) {
        case 0: return { x: x - 5, y: y + 2, w: 20, h: 17 };
        case 1: return { x: x - 5, y: y - 22, w: 20, h: 20 };
        case 2: return { x: x - 17, y: y - 12, w: 19, h: 20 };
        default: return { x: x + 8, y: y - 12, w: 19, h: 20 };
      }
    }
    swordHits(rect, mul, kind) {
      for (const e of G.ents) {
        if (e === this || e.dead || !e.onHit || !G.sameRoom(e) || this.hitSet.has(e)) continue;
        const hb = e.hurtbox ? e.hurtbox() : e;
        if (G.overlap(rect, hb)) {
          this.hitSet.add(e);
          const { d, crit } = G.rollDamage(mul);
          const applied = e.onHit(d, this.cx, this.cy, kind, crit);
          if (applied && e.isEnemy) {
            G.P.stats.dmg.push(d);
            const ex = hb.x + hb.w / 2, ey = hb.y + hb.h / 2, away = Math.atan2(ey - this.cy, ex - this.cx);
            const pal = SWORD_FX[Math.min(5, G.P.swordLv)];
            const ang = kind === 'spin' ? away + Math.PI / 2 : (this.dir < 2 ? 0.25 : Math.PI / 2 - 0.35) * (Math.random() < 0.5 ? 1 : -1) + G.rf(-0.25, 0.25);
            G.fx.cut(ex, ey, ang, crit ? 34 : 26, crit ? '#ffe27a' : pal.edge);
            G.fx.streaks(ex, ey, away, crit ? 9 : 5, 160, crit ? '#ffe27a' : '#ffffff', 0.7);
            if (pal.fogo) G.fx.burst(ex, ey, pal.fogo, crit ? 12 : 7, 70);
            if (crit) { G.shake(3, 0.15); G.fx.ring(ex, ey, 18, '#ffe27a', 0.25, 2); }
          }
        }
      }
      // tiles cortáveis
      const tx0 = Math.floor(rect.x / 16), tx1 = Math.floor((rect.x + rect.w - 1) / 16);
      const ty0 = Math.floor(rect.y / 16), ty1 = Math.floor((rect.y + rect.h - 1) / 16);
      for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
        const id = G.map.get(tx, ty);
        if (G.TP[id].cut) {
          const key = tx + ',' + ty;
          if (this.hitSet.has(key)) continue;
          this.hitSet.add(key);
          G.cutTile(tx, ty);
        } else if ((id === G.T.CRACKED || id === G.T.BARRIER) && !this.hitSet.has('hint')) {
          this.hitSet.add('hint');
          G.sfx('tink');
          if (!G._hintT || G.time - G._hintT > 20) {
            G._hintT = G.time;
            const P = G.P;
            if (id === G.T.CRACKED) G.ui.toast(P.items.bombs ? 'Rachaduras! Coloque uma BOMBA aqui (tecla C).' : 'Está rachado... algo explosivo poderia abrir caminho.', '#ffd84a');
            else G.ui.toast(P.items.beam ? 'Cristal! Atire com o RAIO (tecla C).' : 'Um cristal duríssimo. A espada não o quebra... talvez um raio de energia?', '#7ae4ff');
          }
        }
      }
    }
    placeBomb() {
      const P = G.P;
      if (P.bombs <= 0) { G.sfx('wrong'); G.ui.toast('Sem bombas! Compre na loja ou procure nos arbustos.'); return; }
      if (this.bombCD > 0) return;
      if (G.ents.some(e => e instanceof Bomb && !e.dead)) return;
      const d = G.DIRS[this.dir];
      let bx = this.cx + d.x * 12 - 8, by = this.cy + d.y * 12 - 8;
      if (G.rectBlocked(bx + 3, by + 3, 10, 10, null)) { bx = this.cx - 8; by = this.cy - 8; }
      P.bombs--; this.bombCD = 0.3;
      G.addEnt(new Bomb(bx, by)); G.sfx('bombput');
    }
    fireShot(big) {
      if (!big && this.shotCD > 0) return;
      this.shotCD = 0.22; this.castT = big ? 0.24 : 0.16;
      const d = G.DIRS[this.dir], h = this.handPos();
      G.addEnt(new Shot(h.x, h.y, this.dir, big));
      G.sfx(big ? 'bigbeam' : 'beam');
      G.fx.spark(h.x, h.y, big ? '#e0faff' : '#fff6c0', big ? 13 : 8);
      G.fx.ring(h.x, h.y, big ? 16 : 7, big ? '#7ae4ff' : '#ffe07a', 0.22, big ? 2.5 : 1.2);
      if (big) {
        G.shake(2, 0.12); this.kbx = -d.x * 120; this.kby = -d.y * 120; this.kbT = 0.07;
        G.fx.streaks(h.x, h.y, Math.atan2(d.y, d.x), 9, 170, '#bff4ff', 0.45);
        G.fx.smoke(this.cx, this.y + this.h, 4, '#d8e8f0', 26);
      }
    }
    draw(ctx, cam) {
      const P = G.P;
      const base = G.spriteHeroi();
      const view = this.dir === 0 ? 'down' : this.dir === 1 ? 'up' : 'side';
      const ref = G.spr[base + '_down0'];
      const lw = G.lw(ref), lh = G.lh(ref);
      const sx = this.cx - lw / 2 - cam.x, sy = this.y + this.h + 1 - lh - cam.y - this.z;
      if (this.state !== 'fall') G.shadow(ctx, this.cx - cam.x, this.y + this.h - 0.5 - cam.y, this.z > 0 ? Math.max(6, 11 - this.z / 6) : 12, this.z > 0 ? 0.22 : 0.32);
      if (this.state === 'dead') { G.draw(ctx, base + '_down_stand', sx, sy, { tint: 'rgba(255,255,255,0.4)' }); return; }
      if (this.inv > 0 && this.state !== 'fall' && Math.floor(this.t * 24) % 2 === 0) return;
      let name, flip = this.dir === 2;
      const swinging = this.state === 'attack' || this.state === 'spin' || this.spinCharging;
      if (this.state === 'hold') { name = base + '_hold'; flip = false; }
      else if (swinging || this.castT > 0 || this.charge > 0.15) name = base + '_' + view + '_atk' + this.atkFrame();
      else if (this.hurtAnim > 0) name = base + '_' + view + '_hurt';
      else if (this.moving && (this.state === 'normal' || this.state === 'pull')) name = base + '_' + view + (Math.floor(this.walkT * 18) % 8);
      else name = base + '_' + view + ((this.t % 3.6) < 0.12 ? '_blink' : '_idle' + (Math.floor(this.t * 1.4) % 2)); // respira e pisca
      const o = { flip };
      if (this.starT > 0) o.tint = ['rgba(255,220,80,0.5)', 'rgba(255,100,160,0.5)', 'rgba(100,220,255,0.5)', 'rgba(120,255,140,0.5)'][Math.floor(G.time * 12) % 4];
      else if (this.chargeFlash > 0) o.white = Math.floor(G.time * 30) % 2 === 0;
      else if (this.charge >= CHARGE_T && Math.floor(G.time * 10) % 3 === 0) o.tint = 'rgba(122,228,255,0.45)';
      else if (this.spinCharging && this.spinCharge >= 0.75 && Math.floor(G.time * 10) % 3 === 0) o.tint = 'rgba(255,226,122,0.4)';
      else if (this.superT > 0 && Math.floor(G.time * 6) % 2 === 0) o.tint = 'rgba(255,140,80,0.35)';
      if (this.state === 'fall') {
        const s = Math.max(0, 1 - this.fallT / 0.5);
        if (s <= 0) return;
        o.scale = s;
        if (this.fallKind === 'lava') o.tint = 'rgba(255,80,0,0.6)';
      }
      // pulo: estica ao subir, achata ao pousar
      if (this.z > 0 && this.state !== 'fall') { o.sy = this.vz > 0 ? 1.06 : 0.97; o.sx = this.vz > 0 ? 0.95 : 1.03; }
      else if (this.landT > 0 && this.state !== 'fall') { const k = this.landT / 0.12; o.sy = 1 - 0.12 * k; o.sx = 1 + 0.1 * k; }
      const h = G.dollHand(base, view, swinging ? this.atkFrame() : undefined);
      const hx = sx + (flip ? lw - h.x : h.x), hy = sy + h.y;
      if (this.charge > 0.15) this.drawChargeRing(ctx, cam);
      const swordBehind = this.dir === 1;
      if (swordBehind) this.drawSword(ctx, hx, hy);
      G.draw(ctx, name, sx, sy, o);
      if (!swordBehind) this.drawSword(ctx, hx, hy);
      if (this.carry) { const cs = G.spr[this.carry.spr]; if (cs) G.draw(ctx, cs, sx + lw / 2 - G.lw(cs) / 2, sy - G.lh(cs) + 8 + (this.liftT > 0 ? this.liftT * 30 : 0) + (this.moving ? Math.abs(Math.sin(this.walkT * 9)) * 0.8 : 0)); }
      if (this.state === 'hold' && this.holdItem) {
        const it = G.spr[this.holdItem];
        if (it) {
          const iy = sy - G.lh(it) + 4 + Math.sin(G.time * 4) * 0.5;
          G.lightRays(ctx, sx + lw / 2, iy + G.lh(it) / 2, 30, 0.8, G.time, '#ffe8a0', 12);
          ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35 + 0.15 * Math.sin(G.time * 6);
          G.glow(ctx, sx + lw / 2, iy + G.lh(it) / 2, 18, '#fff2b0'); ctx.restore();
          G.draw(ctx, it, sx + lw / 2 - G.lw(it) / 2, iy);
        }
      }
      if (this.charge > 0.15) this.drawCharge(ctx, cam);
    }
    drawCharge(ctx, cam) {
      const h = this.handPos(), x = h.x - cam.x, y = h.y - cam.y;
      const k = Math.min(1, (this.charge - 0.15) / (CHARGE_T - 0.15)), full = this.charge >= CHARGE_T;
      const pulse = full ? Math.sin(G.time * 22) : 0;
      const r = 1.5 + 3.5 * k + pulse * 0.6;
      G.light.add(x, y, 20 + 30 * k, '#7ae4ff', 0.7 + 0.3 * k, 0.4);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      G.glow(ctx, x, y, r * 3, '#3ab8ff', 0.5 + 0.4 * k);
      if (full) for (let i = 0; i < 4; i++) { const a = G.time * 3 + i * Math.PI / 2; ctx.globalAlpha = 0.5; ctx.strokeStyle = '#bff4ff'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * (r + 1), y + Math.sin(a) * (r + 1)); ctx.lineTo(x + Math.cos(a) * (r + 6 + pulse * 2), y + Math.sin(a) * (r + 6 + pulse * 2)); ctx.stroke(); }
      ctx.restore();
      ctx.fillStyle = '#bff4ff'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.55, 0, Math.PI * 2); ctx.fill();
    }
    // anel de progresso da carga, no chão em volta do herói
    drawChargeRing(ctx, cam) {
      const k = Math.min(1, (this.charge - 0.15) / (CHARGE_T - 0.15)), full = this.charge >= CHARGE_T, pulse = full ? Math.sin(G.time * 22) : 0;
      const fx = this.cx - cam.x, fy = this.y + this.h - 1 - cam.y;
      ctx.save();
      ctx.globalAlpha = 0.5; ctx.strokeStyle = '#0a2a4a'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.ellipse(fx, fy, 13, 6.5, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = full ? 0.75 + 0.25 * pulse : 0.95; ctx.strokeStyle = full ? '#ffffff' : '#7ae4ff'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.ellipse(fx, fy, 13, 6.5, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); ctx.stroke();
      if (full) { ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, fx, fy, 16, '#3ab8ff', 0.25 + 0.15 * pulse); }
      ctx.restore();
    }
    drawSword(ctx, hx, hy) {
      let ang = null, len = 1;
      const base = [Math.PI / 2, -Math.PI / 2, Math.PI, 0][this.dir];
      const sgn = this.dir === 1 || this.dir === 2 ? -1 : 1;
      const sweep = 1.5;
      let a0 = null, fade = 1;
      if (this.state === 'attack') {
        // preparo curto (a lâmina recua), golpe rápido e continuação; a janela de acerto não muda
        const back = 0.35;
        if (this.atkT < ATK_PREP) ang = base - sgn * (sweep + back * this.atkT / ATK_PREP);
        else {
          const e = this.atkEase();
          ang = base - sgn * (sweep + back) + sgn * (sweep * 2 + back) * e;
          a0 = base - sgn * (sweep + back);
          // a cauda do rastro alcança a lâmina depois do golpe
          if (e >= 1) a0 += (ang - a0) * Math.min(1, (this.atkT - ATK_PREP - ATK_SWING) / 0.1);
        }
        fade = Math.min(1, (0.25 - this.atkT) / 0.06);
      } else if (this.state === 'spin') {
        const k = this.atkT / 0.42;
        ang = base + k * Math.PI * 2.2 * sgn; len = 1.1;
        a0 = ang - sgn * Math.min(Math.PI * 1.75, k * Math.PI * 2.2);
        fade = Math.min(1, (0.42 - this.atkT) / 0.1);
      } else if (this.spinCharging) { ang = base; }
      this.lamina = ang === null ? null : { ang, len, hx, hy }; // para efeitos presos à lâmina (chamas da Espada Fênix)
      if (ang === null) return;
      const P = G.P;
      const glow = this.spinCharging && this.spinCharge >= 0.75;
      // rastro do golpe (smear)
      const pal = SWORD_FX[Math.min(5, G.P.swordLv)];
      if (a0 !== null) {
        if (this.state === 'spin') G.smear(ctx, hx, hy, a0, ang, 7, 24, { alpha: fade, body: '#fff6d8', edge: '#ffc84a', tip: 9 });
        else G.smear(ctx, hx, hy, a0, ang, 5, 22, { alpha: fade, body: pal.body, edge: pal.edge });
      }
      const spr = G.spr[['swordBlade', 'swordBlade', 'swordBlade2', 'swordBlade3', 'swordBlade4', 'swordBlade5', 'swordBlade6'][Math.min(6, P.swordLv + 1)]] || G.spr.swordBlade;
      if (!spr) return;
      ctx.save();
      ctx.translate(G.snap(hx), G.snap(hy)); ctx.rotate(ang); ctx.scale(len, len);
      const w = G.lw(spr), h = G.lh(spr);
      ctx.drawImage(glow && Math.floor(G.time * 12) % 2 === 0 ? G.white(spr) : spr, -3, -h / 2, w, h);
      ctx.restore();
      if (glow) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, hx + Math.cos(ang) * 15, hy + Math.sin(ang) * 15, 5 + Math.sin(G.time * 18) * 1.5, '#ffe27a'); ctx.restore(); }
    }
  }
  G.Player = Player;

  // ------------------------------------------------------------------
  //  Coleta: moedas, corações...
  // ------------------------------------------------------------------
  class Pickup extends Ent {
    constructor(x, y, kind, value = 1, o = {}) {
      super(x - 5, y - 5, 10, 10);
      // bombas só aparecem depois de ganhar as Bombas Binomiais; antes, viram uma moeda azul
      if (kind === 'bombs' && G.P && !G.P.items.bombs) { kind = 'coin'; value = 5; }
      this.kind = kind; this.value = value; this.life = o.life !== undefined ? o.life : 9; this.vz = o.pop ? 90 : 0; this.z = o.pop ? 1 : 0;
      this.persist = o.persist; this.flagKey = o.flag; this.pvx = o.vx || 0; this.pvy = o.vy || 0;
    }
    update(dt) {
      this.t += dt;
      if (!this.persist) { this.life -= dt; if (this.life <= 0) { this.dead = true; return; } }
      if (this.z > 0 || this.vz > 0) { this.z += this.vz * dt; this.vz -= 400 * dt; if (this.z <= 0) { this.z = 0; this.vz = this.vz < -60 ? -this.vz * 0.4 : 0; } G.moveEnt(this, this.pvx * dt, this.pvy * dt, { ghostEnts: true }); }
      const p = G.player;
      if (p && this.t > 0.25 && p.state !== 'dead' && G.overlap(this, { x: p.x - 2, y: p.y - 10, w: p.w + 4, h: p.h + 12 })) {
        this.dead = true;
        if (this.flagKey) G.setFlag(this.flagKey);
        const k = this.kind;
        if (k === 'coin') G.give('coin', this.value);
        else if (k === 'heart') G.give('heart', 4);
        else if (k === 'bombs') G.give('bombs', this.value);
        else G.give(k, this.value);
      }
    }
    draw(ctx, cam) {
      if (!this.persist && this.life < 2 && Math.floor(this.t * 10) % 2 === 0) return;
      const sx = Math.round(this.x - cam.x), sy = Math.round(this.y - cam.y - this.z);
      G.shadow(ctx, this.cx - cam.x, this.y + this.h - cam.y, 8, 0.25);
      const bob = this.z > 0 ? 0 : Math.round(Math.sin(this.t * 5) * 1);
      if (this.kind === 'coin') {
        const spr = this.value >= 20 ? 'coinRed' : this.value >= 5 ? 'coinBlue' : 'coin' + (Math.floor(this.t * 8) % 4);
        G.draw(ctx, spr, sx, sy - 2 + bob);
      } else if (this.kind === 'heart') G.draw(ctx, 'heartFull', sx, sy + bob);
      else if (this.kind === 'bombs') G.draw(ctx, 'iconBomb', sx + 1, sy + bob);
      else { const s = { heartPiece: 'heartPiece', heartContainer: 'heartContainer', key: 'key', bossKey: 'bossKey', potion: 'potion', mushroom: 'mushroom', star: 'star' }[this.kind]; if (s) G.draw(ctx, s, sx - 3, sy - 6 + bob); }
    }
  }
  G.Pickup = Pickup;
  // queda aleatória ao derrotar inimigos / quebrar coisas
  G.drop = (x, y, table) => {
    const r = Math.random();
    const P = G.P;
    table = table || { coin: 0.4, heart: 0.15, bombs: P.items.bombs ? 0.08 : 0 };
    let acc = 0;
    for (const k in table) {
      acc += table[k];
      if (r < acc) {
        if (k === 'coin') { const v = Math.random() < 0.12 ? 5 : 1; G.addEnt(new Pickup(x, y, 'coin', v, { pop: true })); }
        else if (k === 'heart') G.addEnt(new Pickup(x, y, 'heart', 4, { pop: true }));
        else if (k === 'bombs') G.addEnt(new Pickup(x, y, 'bombs', 2, { pop: true }));
        return;
      }
    }
  };
  G.cutTile = (tx, ty) => {
    const id = G.map.get(tx, ty);
    const isGrass = G.TP[id].grass;
    G.map.set(tx, ty, isGrass ? G.T.GROUND : (G.map.kind === 'dungeon' ? G.T.FLOOR : G.T.GROUND));
    G.sfx('cut');
    const th = G.THEMES[G.map.themeAt(tx, ty)];
    const cols = th.bu || th.g || ['#5a5', '#383'];
    G.fx.burst(tx * 16 + 8, ty * 16 + 8, cols, 8, 50, { grav: 120 });
    G.drop(tx * 16 + 8, ty * 16 + 8, { coin: 0.18, heart: 0.08, bombs: G.P.items.bombs ? 0.05 : 0 });
    G.map.regrow && G.map.regrow(tx, ty, id);
  };

  // moeda que salta de blocos ? (estilo plataforma)
  class PopCoin extends Ent {
    constructor(x, y) { super(x - 5, y - 6, 10, 12); this.vy = -150; this.oy = y; }
    update(dt) { this.t += dt; this.y += this.vy * dt; this.vy += 500 * dt; if (this.t > 0.5) { this.dead = true; G.fx.burst(this.cx, this.cy, ['#ffd84a', '#ffffff'], 5, 40); } }
    draw(ctx, cam) { G.draw(ctx, 'coin' + (Math.floor(this.t * 16) % 4), this.x - cam.x, this.y - cam.y); }
    get by() { return 99999; }
  }
  G.PopCoin = PopCoin;

  // ------------------------------------------------------------------
  //  Objetos interativos
  // ------------------------------------------------------------------
  class NPC extends Ent {
    constructor(x, y, spr, name, script, o = {}) {
      super(x + 3, y + 8, 10, 8);
      this.spr = spr; this.name = name; this.script = script; this.solid = true; this.dir = o.dir || 0; this.o = o;
      this.homeX = this.x; this.homeY = this.y; this.wanderT = G.rf(1, 3); this.wvx = 0; this.wvy = 0; this.room = o.room !== undefined ? o.room : G.curRoom;
    }
    interBox() { return { x: this.x - 2, y: this.y - 8, w: this.w + 4, h: this.h + 10 }; }
    update(dt) {
      this.t += dt;
      if (this.o.wander) {
        this.wanderT -= dt;
        if (this.wanderT <= 0) {
          this.wanderT = G.rf(1.5, 3.5);
          if (Math.random() < 0.5) { this.wvx = 0; this.wvy = 0; }
          else { const d = G.ri(0, 3); this.dir = d; this.wvx = G.DIRS[d].x * 22; this.wvy = G.DIRS[d].y * 22; }
        }
        if (Math.abs(this.x + this.wvx * dt - this.homeX) > 24 || Math.abs(this.y + this.wvy * dt - this.homeY) > 24) { this.wvx = -this.wvx; this.wvy = -this.wvy; this.dir = G.dirFrom(this.wvx, this.wvy); }
        const p = G.player;
        if (p && G.dist(p.cx, p.cy, this.cx, this.cy) < 20) { this.wvx = 0; this.wvy = 0; }
        G.moveEnt(this, this.wvx * dt, this.wvy * dt, { avoidHazard: true });
      }
    }
    interact(p) {
      this.dir = G.dirFrom(p.cx - this.cx, p.cy - this.cy);
      this.wvx = this.wvy = 0;
      G.runScript(() => this.script(this));
    }
    draw(ctx, cam) {
      G.shadow(ctx, this.cx - cam.x, this.y + this.h - 0.5 - cam.y, 12, 0.3);
      const moving = this.wvx || this.wvy;
      let dn = this.dir === 0 ? 'down' : this.dir === 1 ? 'up' : 'side';
      let s;
      if (moving) s = G.spr[this.spr + '_' + dn + (Math.floor(this.t * 8) % 4)];
      else s = G.spr[this.spr + '_' + dn + '_stand'];
      // respiração: troca sutil entre parado e passo
      if (!moving && Math.floor(this.t * 1.2 + this.homeX) % 6 === 5) s = G.spr[this.spr + '_' + dn + '1'] || s;
      s = s || G.spr[this.spr + '_down0'] || G.spr[this.spr];
      if (!s) return;
      const sx = this.cx - G.lw(s) / 2 - cam.x, sy = this.y + this.h + 1 - G.lh(s) - cam.y;
      G.draw(ctx, s, sx, sy, { flip: this.dir === 2 && !!G.spr[this.spr + '_side0'] });
      const mk = this.o.marker && !G.flag(this.o.marker) ? 'markerBang' : (G.npcMarker ? G.npcMarker(this) : null);
      if (mk) { const bob = Math.round(Math.sin(this.t * 5) * 2); G.draw(ctx, mk, this.cx - 3 - cam.x, sy - 9 + bob); }
    }
  }
  G.NPC = NPC;

  class Sign extends Ent {
    get darkGlow() { return 18; }
    constructor(x, y, text, o = {}) { super(x + 1, y + 6, 14, 10); this.text = text; this.solid = true; this.o = o; }
    interact() {
      G.runScript(async () => {
        await G.ui.say(this.o.name || 'Placa', this.text);
        // placa de enigma: as dicas liberadas pelos erros ou pelo tempo na sala vêm em seguida
        const r = this.o.puz, d = r && G.dun.dicas(r);
        if (d && d.length) { for (let i = 0; i < d.length; i++) await G.ui.say('Dica ' + (i + 1), d[i]); r.dicaLida = d.length; }
      });
    }
    draw(ctx, cam) {
      G.draw(ctx, 'sign', this.x - 1 - cam.x, this.y - 6 - cam.y);
      if (this.o.puz && G.dun.dicaNova(this.o.puz)) G.text('?', this.cx - cam.x, this.y - 18 - cam.y + Math.sin(G.time * 5) * 1.5, '#9ad8ff', { align: 'center', outline: '#0a1430' });
    }
  }
  G.Sign = Sign;

  // coluna de luz vertical (surgimento de baús, itens sagrados)
  const beamCache = new Map();
  function beamTex(color) {
    let c = beamCache.get(color);
    if (c) return c;
    c = G.canvas(32, 128); const x = c.getContext('2d'), img = x.createImageData(32, 128), [r, g, b] = G.col.parse(color);
    for (let py = 0; py < 128; py++) for (let px = 0; px < 32; px++) {
      const u = (px + 0.5 - 16) / 16, v = py / 127;
      const prof = Math.exp(-u * u * 4.5) * 0.6 + Math.exp(-u * u * 40) * 0.4;
      const a = prof * Math.pow(v, 1.3);
      const i = (py * 32 + px) * 4;
      img.data[i] = Math.min(255, r + (255 - r) * Math.exp(-u * u * 40) * 0.6); img.data[i + 1] = Math.min(255, g + (255 - g) * Math.exp(-u * u * 40) * 0.6); img.data[i + 2] = Math.min(255, b + (255 - b) * Math.exp(-u * u * 40) * 0.6); img.data[i + 3] = Math.round(255 * Math.min(1, a));
    }
    x.putImageData(img, 0, 0); beamCache.set(color, c);
    return c;
  }
  G.lightBeam = function (ctx, x, baseY, w, a, color = '#fff2c0') {
    if (a <= 0) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, a); ctx.imageSmoothingEnabled = true;
    ctx.drawImage(beamTex(color), x - w, baseY - 150, w * 2, 150);
    ctx.translate(x, baseY); ctx.scale(1, 0.4); G.glow(ctx, 0, 0, w * 1.1, color, 0.9);
    ctx.restore();
  };
  // raios girando (baú aberto, item revelado)
  G.lightRays = function (ctx, x, y, r, a, t, color = '#ffe8a0', n = 10) {
    if (a <= 0) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const an = t * 0.8 + i * Math.PI * 2 / n, w = 0.13 + 0.05 * Math.sin(t * 3 + i * 1.7), rr = r * (0.75 + 0.25 * Math.sin(t * 2.3 + i * 2.1));
      const g = ctx.createRadialGradient(x, y, 0, x, y, rr);
      g.addColorStop(0, G.col.alpha(color, 0.55 * a)); g.addColorStop(1, G.col.alpha(color, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, rr, an - w, an + w); ctx.closePath(); ctx.fill();
    }
    G.glow(ctx, x, y, r * 0.45, color, 0.6 * a);
    ctx.restore();
  };
  const CHEST_LAND = 0.85;
  class Chest extends Ent {
    get darkGlow() { return this.hidden ? 0 : 22; }
    constructor(x, y, flag, contents, o = {}) {
      super(x + 1, y + 4, 14, 12); this.flagKey = flag; this.contents = contents; this.solid = true; this.o = o;
      this.hidden = !!o.hidden && !G.flag(flag) && !G.flag(flag + '_shown');
      if (this.hidden) { this.solid = false; this.canInteract = false; }
      this.appearT = -1; this.openT = -1;
    }
    get opened() { return G.flag(this.flagKey); }
    // o baú se materializa: coluna de luz, partículas convergem e ele cai do alto
    reveal() {
      if (!this.hidden) return;
      this.hidden = false; this.solid = true; this.canInteract = false; G.setFlag(this.flagKey + '_shown');
      this.appearT = 0; this.alwaysUpdate = true;
      G.sfx('secret');
      const p = G.player; if (p && G.overlap(p, this)) p.y = this.y + this.h + 1;
    }
    icon() {
      const c = this.contents;
      if (c.type === 'coins') return 'coinRed';
      if (c.type === 'bombs') return 'iconBomb';
      if (c.type === 'item') return G.ITEMS[c.item][0];
      return { key: 'key', bossKey: 'bossKey', heartPiece: 'heartPiece', heartContainer: 'heartContainer', potion: 'potion' }[c.type] || 'sparkle';
    }
    update(dt) {
      this.t += dt;
      if (this.appearT >= 0) {
        const prev = this.appearT; this.appearT += dt;
        if (this.appearT < 0.6 && Math.random() < 0.85) G.fx.converge(this.cx, this.cy - 2, 28, G.pick(['#ffffff', '#ffe27a', '#bff4ff']), 1, 0.3);
        if (prev < CHEST_LAND && this.appearT >= CHEST_LAND) {
          G.sfx('land'); G.shake(2, 0.15);
          G.fx.smoke(this.cx, this.y + this.h, 8, '#e8e0d0', 42);
          G.fx.ring(this.cx, this.y + this.h - 2, 24, '#ffe27a', 0.4, 2);
          G.fx.burst(this.cx, this.cy - 2, ['#ffffff', '#ffd84a'], 16, 80);
        }
        if (this.appearT > 1.4) { this.appearT = -1; this.canInteract = true; this.alwaysUpdate = false; }
      }
      if (this.openT >= 0) {
        const prev = this.openT; this.openT += dt;
        if (this.openT < 0.35 && Math.floor(this.openT * 12) !== Math.floor(prev * 12)) G.sfx('bump');
        if (prev < 0.35 && this.openT >= 0.35) {
          G.sfx('chest'); G.fx.burst(this.cx, this.y - 2, ['#ffffff', '#ffe27a', '#ffb84a'], 18, 90, { up: -40 });
          G.fx.ring(this.cx, this.y, 18, '#fff2b0', 0.3, 2);
        }
        if (this.openT > 0.35 && this.openT < 1.6 && Math.random() < 0.5) G.fx.glow(this.cx + G.rf(-6, 6), this.y - 2, { size: 2, color: '#ffe27a', vy: -40, life: 0.6 });
        if (this.openT > 2.4) { this.openT = -1; this.alwaysUpdate = false; }
      }
    }
    interact(p) {
      if (this.hidden || this.opened || this.openT >= 0 || this.appearT >= 0) return;
      G.setFlag(this.flagKey);
      this.openT = 0; this.alwaysUpdate = true;
      const c = this.contents;
      G.runScript(async () => {
        await G.wait(0.95);
        if (c.type === 'coins') {
          for (let i = 0; i < Math.min(8, c.n); i++) { const pc = G.addEnt(new PopCoin(this.cx + G.rf(-6, 6), this.y - 4)); pc.vy = G.rf(-200, -130); pc.t = -i * 0.05; }
          G.give('coin', c.n); await G.ui.say(null, 'Você encontrou ^y' + c.n + ' moedas^0!');
        }
        else if (c.type === 'bombs') { G.give('bombs', c.n); await G.ui.say(null, 'Você encontrou ^y' + c.n + ' bombas^0!'); }
        else if (c.type === 'item') await G.give('item', c.item);
        else await G.give(c.type, c.n);
        if (this.o.after) await this.o.after();
      });
    }
    draw(ctx, cam) {
      if (this.hidden) return;
      const x = this.x - 1 - cam.x, y = this.y - 4 - cam.y, bx = this.cx - cam.x, by = this.y + this.h - cam.y;
      let z = 0, o;
      if (this.appearT >= 0) {
        const t = this.appearT;
        const beamA = t < 0.6 ? t / 0.6 : Math.max(0, 1 - (t - 0.6) / 0.8);
        G.lightBeam(ctx, bx, by, 16 + 6 * beamA, beamA);
        G.light.add(bx, by - 8, 70, '#fff2c0', beamA, 0.4);
        if (t < 0.55) {
          // runa no chão marcando o lugar
          ctx.save(); ctx.globalAlpha = t / 0.55; ctx.strokeStyle = '#ffe27a'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.ellipse(bx, by - 2, 10, 5, 0, 0, Math.PI * 2); ctx.stroke();
          ctx.beginPath(); ctx.ellipse(bx, by - 2, 6 + Math.sin(t * 20), 3, 0, t * 6, t * 6 + 4); ctx.stroke(); ctx.restore();
          return;
        }
        if (t < CHEST_LAND) { const u = (t - 0.55) / (CHEST_LAND - 0.55); z = 90 * (1 - u * u); }
        else if (t < CHEST_LAND + 0.22) z = 5 * Math.sin(Math.PI * (t - CHEST_LAND) / 0.22);
        if (t >= CHEST_LAND && t < CHEST_LAND + 0.08) o = { sx: 1.2, sy: 0.8 };
        G.shadow(ctx, bx, by - 1, Math.max(6, 16 - z / 8), 0.3);
      }
      const opening = this.openT >= 0;
      let spr = this.opened ? 'chestOpen' : 'chest', jx = 0;
      if (opening && this.openT < 0.35) { spr = 'chest'; jx = Math.sin(this.openT * 70) * 0.8; o = { sx: 1 + Math.sin(this.openT * 40) * 0.04, sy: 1 - Math.sin(this.openT * 40) * 0.04 }; }
      if (opening && this.openT >= 0.35) {
        const k = this.openT - 0.35, ra = Math.min(1, k * 4) * Math.max(0, Math.min(1, (2.0 - k) / 0.6));
        G.lightRays(ctx, bx, y + 4, 34, ra, G.time);
        G.light.add(bx, y + 2, 64, '#ffe8a0', ra, 0.5);
      }
      G.draw(ctx, spr, x + jx, y - z, o);
      // o item sobe do baú
      if (opening && this.openT >= 0.35 && this.openT < 1.0) {
        const k = Math.min(1, (this.openT - 0.35) / 0.5), e = 1 - (1 - k) * (1 - k), it = G.spr[this.icon()];
        if (it) {
          ctx.save(); ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, bx, y - 4 - e * 14, 12, '#fff2b0', 0.7); ctx.restore();
          G.draw(ctx, it, bx - G.lw(it) / 2, y - G.lh(it) / 2 - 2 - e * 14, { alpha: Math.min(1, k * 3) });
        }
      }
    }
  }
  G.Chest = Chest;

  class QBlock extends Ent {
    constructor(x, y, flag, contents = 'coin', o = {}) {
      super(x, y, 16, 16); this.flagKey = flag; this.contents = contents; this.solid = true; this.bump = 0; this.hits = o.hits || (contents === 'coins' ? 5 : 1);
      this.used = flag ? G.flag(flag) : false;
    }
    onHit(d, sx, sy, kind) {
      if (this.used || this.bump > 0) { if (!this.used) return false; G.sfx('bump'); this.bump = 0.12; return false; }
      this.bump = 0.15; G.sfx('bump');
      this.hits--;
      const c = this.contents;
      if (c === 'coin' || c === 'coins') { G.addEnt(new PopCoin(this.cx, this.y - 8)); G.give('coin', 1); }
      else if (c === 'heartPiece' || c === 'potion') {
        G.addEnt(new PopCoin(this.cx, this.y - 8));
        G.runScript(() => G.give(c));
      } else {
        const pk = G.addEnt(new Pickup(this.cx, this.y - 4, c, c === 'bombs' ? 4 : 1, { pop: true, persist: true, vy: 30 }));
        pk.room = this.room;
        G.sfx(c === 'star' || c === 'mushroom' ? 'powerup' : 'secret');
      }
      if (this.hits <= 0) { this.used = true; if (this.flagKey) G.setFlag(this.flagKey); }
      return false;
    }
    update(dt) { this.t += dt; if (this.bump > 0) this.bump -= dt; }
    draw(ctx, cam) {
      const off = this.bump > 0 ? -Math.round(Math.sin((0.15 - this.bump) / 0.15 * Math.PI) * 4) : 0;
      G.draw(ctx, this.used ? 'qused' : (Math.floor(this.t * 3) % 3 === 0 ? 'qblock1' : 'qblock0'), this.x - cam.x, this.y - cam.y + off);
    }
  }
  G.QBlock = QBlock;

  class Brick extends Ent {
    constructor(x, y, o = {}) { super(x, y, 16, 16); this.solid = true; this.coin = o.coin; }
    onHit(d, sx, sy, kind) { this.breakIt(); return false; }
    breakIt() {
      this.dead = true; G.sfx('brick');
      for (let i = 0; i < 4; i++) G.fx.spawn({ x: this.x + 4 + (i % 2) * 8, y: this.y + 4 + (i >> 1) * 8, vx: (i % 2 ? 60 : -60), vy: -120 + (i >> 1) * 40, grav: 500, life: 0.7, color: '#e0703a', size: 4, drag: 0 });
      if (this.coin || Math.random() < 0.3) G.give('coin', 1);
    }
    draw(ctx, cam) { G.draw(ctx, 'brick', this.x - cam.x, this.y - cam.y); }
  }
  G.Brick = Brick;

  class Pot extends Ent {
    constructor(x, y) { super(x + 2, y + 4, 12, 12); this.solid = true; this.liftable = true; this.liftSpr = 'pot'; }
    onHit() { this.breakIt(); return false; }
    breakIt() {
      this.dead = true; G.sfx('pot');
      G.fx.burst(this.cx, this.cy, ['#c8784a', '#8a4a2a', '#f0b890'], 10, 70, { grav: 200 });
      G.drop(this.cx, this.cy, { coin: 0.45, heart: 0.25, bombs: G.P.items.bombs ? 0.15 : 0 });
    }
    draw(ctx, cam) { G.draw(ctx, 'pot', this.x - 2 - cam.x, this.y - 4 - cam.y); }
  }
  G.Pot = Pot;
  // objeto arremessado (pote): quebra ao bater e fere inimigos
  class Thrown extends Ent {
    constructor(x, y, vx, vy, carry) { super(x, y, 14, 12); this.vx = vx; this.vy = vy; this.carry = carry; this.z = 10; this.vz = 60; this.room = G.curRoom; }
    update(dt) {
      this.t += dt;
      this.x += this.vx * dt; this.y += this.vy * dt; this.z += this.vz * dt; this.vz -= 300 * dt;
      let hit = this.z <= 0;
      const tp = G.TP[G.map.tileAtPx(this.cx, this.cy)];
      if (tp.solid && !tp.low) hit = true;
      for (const e of G.ents) {
        if (e.dead || !e.isEnemy || !G.sameRoom(e)) continue;
        if (G.overlap(this, e.hurtbox ? e.hurtbox() : e)) { const d = Math.max(2, Math.round(G.atk() * 1.5)); if (e.onHit(d, this.cx, this.cy, 'throw')) G.P.stats.dmg.push(d); hit = true; break; }
      }
      if (hit) {
        this.dead = true; G.sfx('pot');
        G.fx.burst(this.cx, this.cy - this.z, ['#c8784a', '#8a4a2a', '#f0b890'], 12, 80, { grav: 220 });
        G.drop(this.cx, this.cy, { coin: 0.4, heart: 0.25, bombs: G.P.items.bombs ? 0.12 : 0 });
      }
    }
    get by() { return this.y + this.h; }
    draw(ctx, cam) { G.shadow(ctx, this.cx - cam.x, this.y + this.h - cam.y, 10, 0.3); G.draw(ctx, this.carry.spr, this.x - 1 - cam.x, this.y - 4 - this.z - cam.y, { rot: this.t * 10 }); }
  }
  G.Thrown = Thrown;

  class Pipe extends Ent {
    constructor(x, y, id, name) { super(x, y + 10, 32, 22); this.solid = true; this.pid = id; this.pname = name; }
    interBox() { return { x: this.x - 2, y: this.y - 12, w: this.w + 4, h: this.h + 14 }; }
    update(dt) {
      this.t += dt;
      const p = G.player;
      if (p && !G.P.pipes.includes(this.pid) && G.dist(p.cx, p.cy, this.cx, this.cy) < 40) {
        G.P.pipes.push(this.pid); G.sfx('secret'); G.ui.toast('Cano de Dobra descoberto: ' + this.pname, '#7aff8a');
      }
    }
    interact(p) { G.runScript(() => G.pipeMenu(this)); }
    draw(ctx, cam) { G.draw(ctx, 'pipe', this.x - cam.x, this.y - 10 - cam.y); }
  }
  G.Pipe = Pipe;

  class SavePad extends Ent {
    constructor(x, y, id) { super(x, y + 2, 32, 12); this.sid = id; this.armed = true; }
    get by() { return this.y - 100; } // desenhado no chão
    update(dt) {
      this.t += dt;
      const p = G.player; if (!p) return;
      const on = G.overlap({ x: p.x, y: p.y, w: p.w, h: p.h }, { x: this.x + 6, y: this.y + 1, w: this.w - 12, h: this.h - 2 });
      if (on && this.armed && p.state === 'normal' && p.z <= 0) {
        this.armed = false;
        G.runScript(async () => {
          G.sfx('save');
          for (let i = 0; i < 24; i++) G.fx.spawn({ x: this.cx + G.rf(-12, 12), y: this.cy, vy: G.rf(-80, -30), life: 0.8, color: G.pick(['#7ae4ff', '#ffffff', '#5ab0ff']), size: 2, drag: 1 });
          G.P.hp = G.P.maxHp;
          G.setSavePoint(this);
          G.saveGame();
          await G.ui.say('Estação de Salvamento', 'Vida restaurada. ^cProgresso salvo!^0');
        });
      }
      if (!on) this.armed = true;
    }
    draw(ctx, cam) {
      G.light.add(this.cx - cam.x, this.cy - 6 - cam.y, 46, '#7ae4ff', 0.7, 0.3);
      G.draw(ctx, 'savepad', this.x - cam.x, this.y - 2 - cam.y);
      const a = 0.25 + 0.2 * Math.sin(this.t * 4);
      ctx.fillStyle = 'rgba(120,220,255,' + a + ')';
      ctx.fillRect(Math.round(this.x + 10 - cam.x), Math.round(this.y - 18 - cam.y), 12, 22);
    }
  }
  G.SavePad = SavePad;

  class Statue extends Ent {
    constructor(x, y, flag, item, o = {}) { super(x, y + 8, 16, 8); this.solid = true; this.flagKey = flag; this.item = item; this.o = o; }
    interBox() { return { x: this.x - 2, y: this.y - 6, w: 20, h: 18 }; }
    interact(p) {
      if (G.flag(this.flagKey)) { G.runScript(() => G.ui.say(null, 'A estátua sábia descansa em silêncio.')); return; }
      G.setFlag(this.flagKey);
      G.runScript(async () => {
        if (this.o.pre) await this.o.pre();
        await G.give('item', this.item);
        if (this.o.after) await this.o.after();
      });
    }
    draw(ctx, cam) {
      const sx = Math.round(this.x - cam.x), sy = Math.round(this.y - 13 - cam.y);
      G.draw(ctx, 'statue', sx, sy);
      if (!G.flag(this.flagKey)) {
        const it = G.spr[G.ITEMS[this.item][0]];
        const bob = Math.round(Math.sin(this.t * 3) * 2);
        ctx.fillStyle = 'rgba(255,230,120,' + (0.25 + 0.15 * Math.sin(this.t * 5)) + ')'; ctx.fillRect(sx, sy - 14 + bob, 16, 16);
        G.draw(ctx, it, sx, sy - 14 + bob);
      }
    }
  }
  G.Statue = Statue;

  class Oracle extends Ent {
    get darkGlow() { return 28; }
    constructor(x, y, flag, o = {}) { super(x + 2, y + 8, 12, 8); this.solid = true; this.flagKey = flag; this.o = o; this.cd = 0; }
    interBox() { return { x: this.x - 2, y: this.y - 10, w: 16, h: 20 }; }
    update(dt) { this.t += dt; if (this.cd > 0) this.cd -= dt; }
    interact(p) {
      const o = this.o;
      if (o.custom) { G.runScript(() => o.custom(this)); return; }
      if (this.flagKey && G.flag(this.flagKey) && !o.repeatable) { G.runScript(() => G.ui.say('Pedra Oráculo', o.doneText || 'O oráculo já revelou seu segredo a você.')); return; }
      if (this.cd > 0) { G.runScript(() => G.ui.say('Pedra Oráculo', 'O oráculo está meditando... volte daqui a pouco.')); return; }
      G.runScript(async () => {
        const r = await G.ui.ask('Pedra Oráculo', o.intro || 'Responda ao meu desafio e serei generoso. Deseja tentar?', ['Aceitar o desafio', 'Agora não'], { cancel: 1 });
        if (r !== 0) return;
        const qq = G.Q.gen(o.topic || 'all', o.lv || 2);
        const ok = await G.ui.quiz(qq, { title: 'ORÁCULO' });
        if (ok) {
          if (this.flagKey) G.setFlag(this.flagKey);
          if (o.onWin) await o.onWin(); else { G.give('coin', o.coins || 10); await G.ui.say('Pedra Oráculo', 'Sábia resposta! Receba ^y' + (o.coins || 10) + ' moedas^0.'); }
          if (o.repeatable) this.cd = 20;
        } else {
          this.cd = 4;
          await G.ui.say('Pedra Oráculo', 'Reflita sobre a explicação e tente outra vez.');
        }
      });
    }
    draw(ctx, cam) {
      const sx = Math.round(this.x - 2 - cam.x), sy = Math.round(this.y - 11 - cam.y);
      G.shadow(ctx, this.cx - cam.x, this.y + this.h - cam.y, 14, 0.3);
      G.draw(ctx, 'oracle', sx, sy);
      if (!(this.flagKey && G.flag(this.flagKey)) || this.o.repeatable) { ctx.fillStyle = 'rgba(122,228,255,' + (0.2 + 0.2 * Math.sin(this.t * 4)) + ')'; ctx.fillRect(sx + 5, sy + 3, 6, 6); }
    }
  }
  G.Oracle = Oracle;

  class Tablet extends Ent {
    get darkGlow() { return 26; }
    constructor(x, y, lesson, o = {}) { super(x + 1, y + 6, 14, 10); this.solid = true; this.lesson = lesson; this.o = o; }
    interact() {
      G.runScript(async () => {
        const P = G.P, L = G.LESSONS[this.lesson];
        const isNew = !P.lessons.includes(this.lesson);
        if (isNew) { P.lessons.push(this.lesson); G.sfx('secret'); await G.ui.say(null, 'Você encontrou a ^y' + (this.o.name || 'Tábua do Conhecimento') + '^0! Nova lição no Grimório: ^c' + L.title + '^0.'); G.addXP(10); }
        await G.ui.lesson(this.lesson);
        if (this.o.after) await this.o.after(isNew);
      });
    }
    draw(ctx, cam) {
      G.draw(ctx, 'tablet', this.x - 1 - cam.x, this.y - 6 - cam.y);
      if (!G.P.lessons.includes(this.lesson) && Math.floor(this.t * 2) % 2 === 0) G.draw(ctx, 'sparkle', this.x + 10 - cam.x, this.y - 10 - cam.y);
    }
    update(dt) { this.t += dt; }
  }
  G.Tablet = Tablet;

  class PushBlock extends Ent {
    get darkGlow() { return 18; }
    constructor(x, y, value, o = {}) { super(x, y, 16, 16); this.solid = true; this.pushable = true; this.value = value; this.o = o; this.tx = x; this.ty = y; this.moving = false; this.home = { x, y }; }
    canGo(nx, ny, puller = null) {
      const b = this.bounds;
      if (b && (nx < b.x - 0.01 || ny < b.y - 0.01 || nx + 16 > b.x + b.w + 0.01 || ny + 16 > b.y + b.h + 0.01)) return false;
      const tp = G.TP[G.map.tileAtPx(nx + 8, ny + 8)];
      if (tp.solid || tp.hazard) return false;
      for (const e of G.ents) if (e !== this && e !== puller && e.solid && !e.dead && G.sameRoom(e) && G.overlap({ x: nx + 1, y: ny + 1, w: 14, h: 14 }, e)) return false;
      const p = G.player; if (p && p !== puller && G.overlap({ x: nx, y: ny, w: 16, h: 16 }, p)) return false;
      return true;
    }
    interact(player) {
      if (player.state !== 'normal' || player.z > 0 || player.vz > 0 || player.carry || player.kbT > 0) return;
      this.push([1, 0, 3, 2][player.dir], player);
    }
    push(dir, puller = null) {
      if (this.moving || this.o.locked) return;
      const d = G.DIRS[dir];
      const nx = this.x + d.x * 16, ny = this.y + d.y * 16;
      if (!this.canGo(nx, ny, puller)) return;
      if (puller) {
        const px = puller.x + d.x * 16, py = puller.y + d.y * 16;
        // Check the entire backward step, including walls, other blocks and pits.
        if (G.rectBlocked(Math.min(puller.x, px), Math.min(puller.y, py), puller.w + Math.abs(d.x * 16), puller.h + Math.abs(d.y * 16), puller, { avoidHazard: true })) return;
        if (G.overlap({ x: nx, y: ny, w: 16, h: 16 }, { x: px, y: py, w: puller.w, h: puller.h })) return;
        if (G.map.kind === 'dungeon' && G.dun.roomAt(px + puller.w / 2, py + puller.h / 2)?.idx !== G.curRoom) return;
        this.puller = puller; puller.state = 'pull'; puller.vx = puller.vy = 0;
        puller.spinCharging = false; puller.spinCharge = 0;
      }
      this.tx = nx; this.ty = ny; this.moving = true; this.lastDir = dir; G.sfx('push');
    }
    releasePuller() {
      if (this.puller?.state === 'pull') { this.puller.state = 'normal'; this.puller.moving = false; this.puller.lastSafe = { x: this.puller.x, y: this.puller.y }; }
      this.puller = null;
    }
    reset() { this.releasePuller(); this.x = this.tx = this.home.x; this.y = this.ty = this.home.y; this.moving = false; }
    update(dt) {
      this.t += dt;
      if (this.moving) {
        const ox = this.x, oy = this.y;
        this.x = G.approach(this.x, this.tx, 64 * dt); this.y = G.approach(this.y, this.ty, 64 * dt);
        if (this.puller?.state === 'pull') { this.puller.x += this.x - ox; this.puller.y += this.y - oy; }
        if (this.x === this.tx && this.y === this.ty) {
          this.moving = false;
          const pulled = !!this.puller; this.releasePuller();
          // no gelo, continua deslizando
          if (!pulled && this.o.slide && this.lastDir !== undefined && G.TP[G.map.tileAtPx(this.x + 8, this.y + 8)].ice) {
            const d = G.DIRS[this.lastDir], nx = this.x + d.x * 16, ny = this.y + d.y * 16;
            if (this.canGo(nx, ny)) { this.tx = nx; this.ty = ny; this.moving = true; return; }
            G.sfx('land');
          }
          if (this.o.onMoved) this.o.onMoved(this);
        }
      }
    }
    draw(ctx, cam) {
      const sx = this.x - cam.x, sy = this.y - cam.y;
      G.shadow(ctx, sx + 8, sy + 15, 16, 0.25);
      G.draw(ctx, 'block', sx, sy);
      if (this.o.dot) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, sx + 8, sy + 8, 9, '#ff9ae6', 0.8); ctx.restore(); ctx.fillStyle = '#ffd0f0'; ctx.beginPath(); ctx.arc(sx + 8, sy + 8, 2.5, 0, Math.PI * 2); ctx.fill(); }
      else if (this.o.weight) G.text('kg', sx + 8, sy + 5, this.fixed ? '#9a8aaa' : '#ffd84a', { align: 'center', shadow: false });
      if (this.fixed) { ctx.fillStyle = '#2a2430'; for (let i = 0; i < 6; i++) { ctx.fillRect(sx + 1 + i * 2.5, sy + 2 + i * 2.2, 2, 1.5); ctx.fillRect(sx + 14 - i * 2.5, sy + 2 + i * 2.2, 2, 1.5); } }
      if (this.value !== undefined && this.value !== null) G.text(String(this.value), sx + 8, sy + 5, '#ffd84a', { align: 'center' });
    }
  }
  G.PushBlock = PushBlock;

  class Plate extends Ent {
    constructor(x, y, o = {}) { super(x, y, 16, 16); this.o = o; this.on = false; }
    get by() { return this.y - 200; }
    blockOn() {
      for (const e of G.ents) if (e instanceof PushBlock && !e.dead && !e.moving && G.sameRoom(e) && Math.abs(e.x - this.x) < 4 && Math.abs(e.y - this.y) < 4) return e;
      return null;
    }
    update(dt) {
      const b = this.blockOn();
      const was = this.on; this.on = !!b; this.block = b;
      if (this.on && !was) G.sfx('plate');
    }
    draw(ctx, cam) { G.draw(ctx, this.on ? 'plateOn' : 'plate', this.x - cam.x, this.y - cam.y); }
  }
  G.Plate = Plate;

  // cristal de resposta (puzzle físico)
  // o cristal surge do pedestal e só aceita golpes depois de pronto: o golpe que respondeu uma
  // pergunta não responde a seguinte, cujos cristais nascem no mesmo lugar
  const SURGE = 0.6;
  class AnswerCrystal extends Ent {
    get darkGlow() { return 24; }
    constructor(x, y, label, correct, onAnswer, o = {}) { super(x + 2, y + 6, 12, 10); this.solid = true; this.label = label; this.correct = correct; this.onAnswer = onAnswer; this.o = o; this.color = o.color || '#7ae4ff'; this.flash = 0; }
    onHit(d, sx, sy, kind) {
      if (this.broken || this.flash > 0 || this.t < SURGE) return false;
      this.flash = 0.4;
      this.onAnswer(this);
      return false;
    }
    shatter() { this.broken = true; this.solid = false; this.dead = true; G.fx.burst(this.cx, this.cy - 6, ['#ffffff', this.color], 14, 70, { grav: 150 }); }
    update(dt) {
      if (!this.t) { G.fx.ring(this.cx, this.cy - 2, 9, this.color, 0.35, 1.5); G.fx.spark(this.cx, this.cy - 2, '#ffffff', 5); }
      this.t += dt; if (this.flash > 0) this.flash -= dt;
    }
    surgir() { const k = Math.min(1, this.t / SURGE); return 1 - (1 - k) * (1 - k) * (1 - k); }
    draw(ctx, cam) {
      const sx = Math.round(this.x - 2 - cam.x), sy = Math.round(this.y - 16 - cam.y), e = this.surgir();
      G.light.add(sx + 8, sy + 8, 30 * e, this.color, 0.6, 0.25);
      const bob = Math.round(Math.sin(this.t * 3 + this.x) * 1.5 * e + (1 - e) * 9);
      G.rect(ctx, sx + 2, sy + 18, 12, 4, '#3a3a5a'); G.rect(ctx, sx + 3, sy + 17, 10, 2, '#6a6a8a');
      G.shadow(ctx, sx + 8, sy + 19, 10 * e, 0.3);
      const c = this.color;
      ctx.save(); ctx.globalAlpha = e;
      for (let y = 0; y < 14; y++) { const hw = y < 5 ? y + 1 : Math.max(0, 6 - (y - 5) * 0.7); ctx.fillStyle = y < 5 ? '#ffffff' : c; ctx.fillRect(Math.round(sx + 8 - hw), sy + 1 + y + bob, Math.round(hw * 2), 1); }
      ctx.fillStyle = '#ffffff70'; ctx.fillRect(sx + 6, sy + 4 + bob, 2, 6);
      if (this.flash > 0 || e < 1) { ctx.fillStyle = 'rgba(255,255,255,' + Math.max(this.flash > 0 ? 0.6 : 0, (1 - e) * 0.8) + ')'; ctx.fillRect(sx + 2, sy + bob, 12, 16); }
      ctx.restore();
    }
    drawLate(ctx, cam) {
      const sx = Math.round(this.x - 2 - cam.x), sy = Math.round(this.y - 16 - cam.y);
      ctx.save(); ctx.globalAlpha = this.surgir(); G.puzTag(ctx, sx + 8, sy - 11, this.label, '#ffe27a'); ctx.restore();
    }
  }
  G.AnswerCrystal = AnswerCrystal;

  // tocha de parede (luz tremeluzente)
  class Torch extends Ent {
    constructor(x, y, o = {}) { super(x, y, 16, 16); this.phase = Math.random() * 6; this.lit = o.lit !== false; this.blue = o.blue; this.room = o.room !== undefined ? o.room : G.curRoom; }
    get by() { return this.y - 40; }
    update(dt) { this.t += dt; if (this.lit && Math.random() < 0.06) G.fx.spawn({ x: this.x + 8 + G.rf(-1, 1), y: this.y - 4, vy: -26, vx: G.rf(-4, 4), life: 0.6, color: this.blue ? '#9ad8ff' : '#ffc040', size: 0.5, drag: 0.5 }); }
    draw(ctx, cam) {
      const x = this.x - cam.x, y = this.y - cam.y;
      G.draw(ctx, 'torchSconce', x + 4, y + 1);
      if (!this.lit) return;
      const f = Math.floor(this.t * 11 + this.phase) % 4;
      G.draw(ctx, (this.blue ? 'flameBlue' : 'flame') + f, x + 5, y - 7);
      const fl = 0.92 + 0.08 * Math.sin(this.t * 13 + this.phase) + 0.04 * Math.sin(this.t * 31);
      G.light.add(x + 8, y - 1, 84 * fl, this.blue ? '#8ac8ff' : '#ffb060', 0.95, 0.45);
    }
  }
  G.Torch = Torch;
  // braseiro de chão (pode ser aceso por puzzles)
  class Brazier extends Ent {
    constructor(x, y, o = {}) { super(x + 2, y + 8, 12, 8); this.solid = true; this.lit = !!o.lit; this.o = o; this.phase = Math.random() * 6; }
    onHit(d, sx, sy, kind) { if (this.o.onHit) this.o.onHit(this, kind); return false; }
    update(dt) { this.t += dt; if (this.lit && Math.random() < 0.15) G.fx.spawn({ x: this.cx + G.rf(-3, 3), y: this.y - 14, vy: -30, vx: G.rf(-5, 5), life: 0.7, color: G.pick(['#ffc040', '#ff7a1a']), size: 0.5, drag: 0.5 }); }
    get darkGlow() { return this.lit ? 0 : 20; }
    draw(ctx, cam) {
      const x = this.x - 6 - cam.x, y = this.y - 16 - cam.y;
      G.draw(ctx, this.lit ? 'brazier' : 'brazierOff', x, y);
      if (this.lit) {
        const f = Math.floor(this.t * 12 + this.phase) % 4;
        G.draw(ctx, (this.o.blue ? 'flameBlue' : 'flameBig') + f, x + 2, y - 10);
        const fl = 0.92 + 0.08 * Math.sin(this.t * 11 + this.phase);
        G.light.add(x + 12, y + 2, 96 * fl, this.o.blue ? '#8ac8ff' : '#ffb060', 1, 0.5);
      }
    }
  }
  G.Brazier = Brazier;

  class Deco extends Ent {
    constructor(x, y, struct, o = {}) {
      const s = G.structs[struct];
      super(x, y, G.lw(s), G.lh(s)); this.struct = struct; this.o = o; this.room = o.room !== undefined ? o.room : -1;
    }
    get by() { return this.y + this.h - (this.o.baseOff || 0); }
    draw(ctx, cam) {
      const x = this.x - cam.x, y = this.y - cam.y;
      G.draw(ctx, G.structs[this.struct], x, y);
      const L = DECO_LIGHTS[this.struct];
      if (L) for (const [lx, ly, r, c] of L) G.light.add(x + lx, y + ly, r * (0.95 + 0.05 * Math.sin(G.time * 7 + this.x)), c, 0.8, 0.3);
    }
  }
  const DECO_LIGHTS = { lamp: [[8, 6, 54, '#ffd890']], castle: [[28, 30, 30, '#ffe08a'], [228, 30, 30, '#ffe08a'], [128, 23, 40, '#ff6a9a']], tower: [[48, 30, 28, '#ffe08a'], [48, 49, 28, '#ffe08a']], cave: [[64, 70, 40, '#ff8a3a']] };
  G.Deco = Deco; G.DECO_LIGHTS = DECO_LIGHTS;

  class Trigger extends Ent {
    constructor(x, y, w, h, fn, o = {}) { super(x, y, w, h); this.fn = fn; this.o = o; this.inside = false; this.room = o.room !== undefined ? o.room : G.curRoom; }
    update(dt) {
      const p = G.player; if (!p || p.state !== 'normal') return;
      const on = G.overlap(p, this);
      if (on && !this.inside) { this.inside = true; this.fn(this); if (this.o.once) this.dead = true; }
      else if (!on) this.inside = false;
    }
  }
  G.Trigger = Trigger;

  class Sheep extends Ent {
    constructor(x, y, color, bounds) { super(x, y, 14, 8); this.color = color; this.bounds = bounds; this.dir = 1; this.wt = G.rf(0.5, 2); this.vx = 0; this.vy = 0; }
    update(dt) {
      this.t += dt; this.wt -= dt;
      if (this.wt <= 0) { this.wt = G.rf(1, 3); const a = Math.random() * Math.PI * 2, s = Math.random() < 0.3 ? 0 : 18; this.vx = Math.cos(a) * s; this.vy = Math.sin(a) * s; if (this.vx) this.dir = this.vx < 0 ? -1 : 1; }
      const b = this.bounds;
      if (this.x + this.vx * dt < b.x || this.x + this.w + this.vx * dt > b.x + b.w) this.vx = -this.vx;
      if (this.y + this.vy * dt < b.y || this.y + this.h + this.vy * dt > b.y + b.h) this.vy = -this.vy;
      this.x += this.vx * dt; this.y += this.vy * dt;
      if (this.vx) this.dir = this.vx < 0 ? -1 : 1;
    }
    draw(ctx, cam) {
      const sx = Math.round(this.x - 1 - cam.x), sy = Math.round(this.y - 8 - cam.y);
      G.shadow(ctx, this.cx - cam.x, this.y + this.h - cam.y, 12, 0.25);
      const s = G.spr['ovelha' + ((this.vx || this.vy) ? Math.floor(this.t * 5) % 2 : 0)];
      const tint = { branca: null, preta: 'rgba(40,30,50,0.85)', marrom: 'rgba(150,90,40,0.6)' }[this.color];
      G.draw(ctx, s, sx, sy, { flip: this.dir < 0, tint: tint || undefined });
    }
  }
  G.Sheep = Sheep;

  // ------------------------------------------------------------------
  //  Bombas, explosões, tiros
  // ------------------------------------------------------------------
  class Bomb extends Ent {
    constructor(x, y) { super(x + 3, y + 6, 10, 8); this.fuse = 1.6; }
    update(dt) {
      this.t += dt; this.fuse -= dt;
      if (this.fuse <= 0) { this.dead = true; G.addEnt(new Explosion(this.cx, this.cy - 2)); }
    }
    draw(ctx, cam) {
      const flash = this.fuse < 0.6 ? Math.floor(this.t * 16) % 2 : Math.floor(this.t * 6) % 2;
      const s = 1 + (this.fuse < 0.4 ? 0.1 : 0);
      G.shadow(ctx, this.cx - cam.x, this.y + this.h - cam.y, 10, 0.3);
      G.draw(ctx, flash ? 'bombRed' : 'bomb', this.x - 3 - cam.x, this.y - 8 - cam.y, s !== 1 ? { scale: s } : undefined);
      if (Math.random() < 0.6) G.fx.spawn({ x: this.cx + 1, y: this.y - 8, vy: -20, vx: G.rf(-10, 10), life: 0.2, color: '#ffd84a', size: 1 });
    }
  }
  G.Bomb = Bomb;
  class Explosion extends Ent {
    constructor(cx, cy, o = {}) {
      super(cx - 20, cy - 20, 40, 40); this.r = o.r || 26; this.hitDone = false; this.hostile = o.hostile;
      G.sfx('explode'); G.fx.ring(cx, cy + 4, this.r + 10, '#fff0c0', 0.4, 3); G.fx.smoke(cx, cy, 10, '#8a807a', 40);
      for (let i = 0; i < 10; i++) G.fx.spawn({ x: cx, y: cy, vx: G.rf(-120, 120), vy: G.rf(-160, -40), grav: 420, life: G.rf(0.4, 0.8), color: G.pick(['#5a4a3a', '#8a7a6a', '#ffb050']), size: 1.6, drag: 0.5 });
    }
    get by() { return this.y + 40; }
    update(dt) {
      this.t += dt;
      if (!this.hitDone) {
        this.hitDone = true;
        const cx = this.cx, cy = this.cy, r = this.r;
        for (const e of G.ents) {
          if (e.dead || !G.sameRoom(e)) continue;
          if (G.dist(cx, cy, e.cx, e.cy) < r + 6) {
            if (e.onHit && e !== G.player) { const dmg = G.atk() * 2 + 4; const ok = e.onHit(dmg, cx, cy, 'bomb'); if (ok && e.isEnemy) G.P.stats.dmg.push(dmg); }
            if (e instanceof Pot || e instanceof Brick) e.breakIt();
          }
        }
        const p = G.player;
        if (p && G.dist(cx, cy, p.cx, p.cy) < r - 4 && p.z < 8) G.hurtPlayer(this.hostile ? 4 : 2, cx, cy);
        // tiles rachados
        const t0x = Math.floor((cx - r) / 16), t1x = Math.floor((cx + r) / 16), t0y = Math.floor((cy - r) / 16), t1y = Math.floor((cy + r) / 16);
        for (let ty = t0y; ty <= t1y; ty++) for (let tx = t0x; tx <= t1x; tx++) {
          const id = G.map.get(tx, ty);
          const near = G.dist(cx, cy, tx * 16 + 8, ty * 16 + 8) < r + 8;
          if (!near) continue;
          if (G.TP[id].bomb) { G.breakTile(tx, ty); }
          else if (G.TP[id].cut) G.cutTile(tx, ty);
        }
      }
      if (this.t > 0.4) this.dead = true;
    }
    draw(ctx, cam) {
      G.light.add(this.cx - cam.x, this.cy - cam.y, 96 * (1 - this.t / 0.5), '#ffb050', 1, 0.9);
      const f = Math.min(3, Math.floor(this.t / 0.1));
      G.draw(ctx, 'boom' + f, this.x - cam.x, this.y - cam.y);
    }
  }
  G.Explosion = Explosion;
  G.breakTile = (tx, ty) => {
    const id = G.map.get(tx, ty);
    const nid = G.map.kind === 'dungeon' ? G.T.FLOOR : G.T.GROUND;
    G.map.set(tx, ty, nid);
    G.map.markBroken && G.map.markBroken(tx, ty);
    G.fx.burst(tx * 16 + 8, ty * 16 + 8, id === G.T.BARRIER ? ['#e8ffff', '#7ae4ff', '#3a8ac0'] : ['#9a8670', '#5e4e3e', '#c8b8a0'], 12, 80, { grav: 200 });
    if (!G._secretT || G.time - G._secretT > 0.6) { G._secretT = G.time; G.sfx(id === G.T.BARRIER ? 'tink' : 'secret'); }
  };
  // destrói barreiras de cristal conectadas
  G.shatterBarrier = (tx, ty) => {
    const q = [[tx, ty]]; let n = 0;
    while (q.length && n < 40) {
      const [x, y] = q.pop();
      if (G.map.get(x, y) !== G.T.BARRIER) continue;
      G.breakTile(x, y); n++;
      q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    if (n) G.sfx('secret');
  };

  // Raio Amostral: tiro comum = "ponto amostral" com rastro de pontos;
  // tiro carregado = "Onda Normal", uma frente em forma de sino que atravessa inimigos
  class Shot extends Ent {
    constructor(cx, cy, dir, big) {
      const s = big ? 14 : 6;
      super(cx - s / 2, cy - s / 2, s, s); this.dir = dir; this.big = big;
      const d = G.DIRS[dir], sp = big ? 240 : 285;
      this.vx = d.x * sp; this.vy = d.y * sp; this.life = big ? 0.95 : 0.6; this.hitSet = new Set();
      this.trail = [];
    }
    get by() { return this.y + 20; }
    impact(wall) {
      this.dead = true;
      const c = this.big ? ['#ffffff', '#7ae4ff', '#3ab8ff'] : ['#ffffff', '#ffe07a', '#ffb84a'];
      G.fx.burst(this.cx, this.cy, c, this.big ? 14 : 6, this.big ? 90 : 55);
      G.fx.ring(this.cx, this.cy, this.big ? 20 : 8, this.big ? '#bff4ff' : '#fff2b0', 0.22, this.big ? 2.5 : 1.2);
      G.fx.spark(this.cx, this.cy, '#ffffff', this.big ? 12 : 7);
      if (this.big) G.shake(1.5, 0.1);
      if (wall) G.sfx('tink');
    }
    update(dt) {
      this.t += dt; this.life -= dt;
      this.trail.unshift([this.cx, this.cy]); if (this.trail.length > (this.big ? 8 : 6)) this.trail.pop();
      if (this.life <= 0) { this.dead = true; G.fx.burst(this.cx, this.cy, this.big ? '#7ae4ff' : '#ffe07a', 4, 30); return; }
      this.x += this.vx * dt; this.y += this.vy * dt;
      if (this.big && Math.random() < 0.8) G.fx.glow(this.cx + G.rf(-5, 5), this.cy + G.rf(-5, 5), { size: 3, color: '#3ab8ff', life: 0.35, vx: -this.vx * 0.1, vy: -this.vy * 0.1 });
      // tiles
      const tx = Math.floor(this.cx / 16), ty = Math.floor(this.cy / 16);
      const id = G.map.get(tx, ty), tp = G.TP[id];
      if (tp.beam) { G.shatterBarrier(tx, ty); this.impact(false); return; }
      if (tp.solid && !tp.low && !tp.water) { this.impact(true); return; }
      if (tp.cut && this.big) G.cutTile(tx, ty);
      for (const e of G.ents) {
        if (e.dead || !e.onHit || e === G.player || !G.sameRoom(e) || this.hitSet.has(e)) continue;
        const hb = e.hurtbox ? e.hurtbox() : e;
        if (G.overlap(this, hb)) {
          this.hitSet.add(e);
          const base = Math.max(1, Math.round(G.atk() * (this.big ? 2.5 : 0.75)));
          const ok = e.onHit(base, this.cx - this.vx * 0.05, this.cy - this.vy * 0.05, this.big ? 'bigbeam' : 'beam');
          if (ok && e.isEnemy) { G.P.stats.dmg.push(base); G.fx.streaks(this.cx, this.cy, Math.atan2(this.vy, this.vx), 5, 130, this.big ? '#bff4ff' : '#fff2b0', 0.6); }
          if (!this.big || e.solid) { this.impact(false); return; }
          G.fx.spark(this.cx, this.cy, '#ffffff', 10);
        }
      }
    }
    draw(ctx, cam) {
      const x = this.cx - cam.x, y = this.cy - cam.y;
      G.light.add(x, y, this.big ? 50 : 28, this.big ? '#7ae4ff' : '#ffe07a', 0.95, 0.5);
      if (this.big) { this.drawWave(ctx, cam); return; }
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 1; i < this.trail.length; i++) { const [tx, ty] = this.trail[i]; G.glow(ctx, tx - cam.x, ty - cam.y, 4.5 - i * 0.55, '#ffb84a', 0.65 - i * 0.09); }
      G.glow(ctx, x, y, 9, '#ffd84a', 0.9);
      ctx.restore();
      // pontos amostrais deixados para trás
      for (let i = 2; i < this.trail.length; i += 2) { const [tx, ty] = this.trail[i]; ctx.fillStyle = 'rgba(255,240,180,' + (0.9 - i * 0.12) + ')'; ctx.fillRect(tx - cam.x - 0.75, ty - cam.y - 0.75, 1.5, 1.5); }
      ctx.fillStyle = '#ffe9a0'; ctx.beginPath(); ctx.arc(x, y, 2.8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x - 0.4, y - 0.4, 1.6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,214,110,0.85)'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.arc(x, y, 4.2 + Math.sin(this.t * 40) * 0.5, 0, Math.PI * 2); ctx.stroke();
    }
    drawWave(ctx, cam) {
      const x = this.cx - cam.x, y = this.cy - cam.y;
      const d = G.DIRS[this.dir], px = -d.y, py = d.x; // eixo perpendicular
      const W = 12, H = 10 + Math.sin(this.t * 25) * 1.2, sg = W * 0.36;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 1; i < this.trail.length; i++) { const [tx, ty] = this.trail[i]; G.glow(ctx, tx - cam.x, ty - cam.y, 10 - i, '#3ab8ff', 0.5 - i * 0.05); }
      G.glow(ctx, x, y, 20, '#3ab8ff', 0.85);
      // a curva normal
      const pts = [];
      for (let i = 0; i <= 18; i++) { const u = -W + 2 * W * i / 18, f = H * Math.exp(-u * u / (2 * sg * sg)); pts.push([x + px * u + d.x * (f - 4), y + py * u + d.y * (f - 4)]); }
      ctx.fillStyle = 'rgba(122,228,255,0.6)';
      ctx.beginPath(); ctx.moveTo(x - px * W - d.x * 4, y - py * W - d.y * 4); for (const [a, b] of pts) ctx.lineTo(a, b); ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.lineJoin = 'round';
      ctx.beginPath(); pts.forEach(([a, b], i) => i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)); ctx.stroke();
      ctx.strokeStyle = 'rgba(191,244,255,0.95)'; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(x - px * W - d.x * 4, y - py * W - d.y * 4); ctx.lineTo(x + px * W - d.x * 4, y + py * W - d.y * 4); ctx.stroke();
      // linha da média (μ)
      ctx.setLineDash([1, 1]); ctx.beginPath(); ctx.moveTo(x - d.x * 4, y - d.y * 4); ctx.lineTo(x + d.x * (H - 4), y + d.y * (H - 4)); ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x + d.x, y + d.y, 2.6, 0, Math.PI * 2); ctx.fill();
    }
  }
  G.Shot = Shot;

  // projétil inimigo
  class EShot extends Ent {
    constructor(cx, cy, vx, vy, o = {}) {
      const s = o.size || 6;
      super(cx - s / 2, cy - s / 2, s, s); this.vx = vx; this.vy = vy; this.spr = o.spr || 'rock'; this.dmg = o.dmg || 2; this.life = o.life || 3;
      this.pierce = o.pierce; this.grav = o.grav || 0; this.z = o.z || 0; this.vz = o.vz || 0; this.onLand = o.onLand; this.slow = o.slow; this.homing = o.homing;
    }
    get by() { return this.y + 30; }
    update(dt) {
      this.t += dt; this.life -= dt;
      if (this.life <= 0) { this.dead = true; return; }
      if (this.homing && G.player) { const a = Math.atan2(G.player.cy - this.cy, G.player.cx - this.cx); const sp = Math.hypot(this.vx, this.vy); const cur = Math.atan2(this.vy, this.vx); let da = a - cur; while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2; const na = cur + G.clamp(da, -this.homing * dt, this.homing * dt); this.vx = Math.cos(na) * sp; this.vy = Math.sin(na) * sp; }
      this.x += this.vx * dt; this.y += this.vy * dt;
      if (this.vz || this.z > 0) { this.z += this.vz * dt; this.vz -= 300 * dt; if (this.z <= 0) { this.z = 0; if (this.onLand) { this.onLand(this); this.dead = true; return; } } }
      if (!this.pierce) { const tp = G.TP[G.map.tileAtPx(this.cx, this.cy)]; if (tp.solid && !tp.low) { this.dead = true; G.fx.burst(this.cx, this.cy, ['#9a8a7a', '#ffffff'], 4, 30); return; } }
      const p = G.player;
      if (p && this.z < 10 && G.overlap(this, { x: p.x, y: p.y - 8, w: p.w, h: p.h + 8 }) && p.z < 10) {
        // escudo: herói de frente e parado bloqueia pedras pequenas
        if (this.spr === 'rock' && p.state === 'normal' && !p.moving) {
          const facing = G.DIRS[p.dir]; const dot = -(this.vx * facing.x + this.vy * facing.y);
          if (dot > 0.6 * Math.hypot(this.vx, this.vy)) { this.dead = true; G.sfx('tink'); G.fx.burst(this.cx, this.cy, ['#ffffff'], 4, 40); return; }
        }
        if (G.hurtPlayer(this.dmg, this.cx - this.vx, this.cy - this.vy)) { if (this.slow) p.kbT = 0; this.dead = true; }
      }
    }
    draw(ctx, cam) {
      const s = G.spr[this.spr];
      if (this.spr === 'fireball') G.light.add(this.cx - cam.x, this.cy - cam.y - this.z, 30, '#ff8a3a', 0.8, 0.5);
      else if (this.spr === 'orb') G.light.add(this.cx - cam.x, this.cy - cam.y - this.z, 26, '#c070ff', 0.8, 0.5);
      if (this.z > 0) G.shadow(ctx, this.cx - cam.x, this.cy + 4 - cam.y, 6, 0.3);
      G.draw(ctx, s, this.cx - G.lw(s) / 2 - cam.x, this.cy - G.lh(s) / 2 - cam.y - this.z);
    }
  }
  G.EShot = EShot;
})(window.G);
