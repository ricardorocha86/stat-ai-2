'use strict';
// =====================================================================
//  Masmorras: salas em grade (estilo Zelda), portas, chaves, travas,
//  quebra-cabeças estatísticos (G.PUZ) e salas de chefe. Cada masmorra
//  tem layout, roteiro e mecânicas próprias.
// =====================================================================
(function (G) {
  const T = G.T, TS = 16, RWt = 24, RHt = 13, RPW = RWt * TS, RPH = RHt * TS;
  const st = G.st, F = G.fmt;

  // ------------------------------------------------------------------
  //  Especificação das masmorras
  // ------------------------------------------------------------------
  // tipos de porta: open, locked (chave), boss (chave do guardião), oracle (pergunta),
  // bomb (parede rachada), beam (barreira de cristal), puzzle (abre ao resolver a sala A)
  const D = G.DUNGEONS = {
    // 1) TEMPLO DA MÉDIA — a grande balança central abre as alas; botas para pular o fosso do chefe
    d1: { name: 'Templo da Média', theme: 'd1', music: 'dungeon', topic: 'media', crystal: 'media', grid: [3, 3],
      rooms: {
        S: { at: [1, 2], type: 'start', lesson: 'media' },
        C: { at: [2, 2], type: 'combat', enemies: [['gosma', 2], ['cogumau', 2], ['barras', 1]], feat: 'pillars', clearReward: { type: 'key' } },
        Q: { at: [0, 2], type: 'bonus', qb: ['coins', 'heartPiece', 'coins', 'coin'], oracle: true, feat: 'pots' },
        H: { at: [1, 1], type: 'balance', opt: { blocks: 3 }, feat: 'pitN' },
        L: { at: [0, 1], type: 'level', reward: { chest: { type: 'key' } } },
        M: { at: [2, 1], type: 'plates', opt: { metric: 'mean' }, reward: { chest: { type: 'key' } } },
        K: { at: [0, 0], type: 'braziers', opt: { rule: 'acimaMedia' }, reward: { chest: { type: 'bossKey' } }, dark: true },
        I: { at: [2, 0], type: 'item', item: 'boots' },
        B: { at: [1, 0], type: 'boss' }
      },
      doors: [['S', 'H', 'open'], ['S', 'C', 'open'], ['S', 'Q', 'locked'], ['H', 'L', 'puzzle'], ['H', 'M', 'puzzle'], ['L', 'K', 'locked'], ['M', 'I', 'locked'], ['H', 'B', 'boss']] },
    // 2) BOSQUE DA MEDIANA — ponte de pedras no centro; ordenar estátuas; arena da moda
    d2: { name: 'Bosque da Mediana', theme: 'd2', music: 'dungeon', topic: 'd2', crystal: 'mediana', grid: [4, 3],
      rooms: {
        S: { at: [1, 2], type: 'start', lesson: 'mediana' },
        C: { at: [2, 2], type: 'combat', enemies: [['aranha', 2], ['cogumau', 2, { tier: 1.3 }], ['outlier', 1]], feat: 'pits' },
        P: { at: [3, 2], type: 'plates', opt: { metric: 'median' }, reward: { chest: { type: 'key' } } },
        H: { at: [1, 1], type: 'stonepath', opt: { rule: 'median', rows: [9, 7, 5, 3] } },
        I: { at: [0, 1], type: 'item', item: 'bombs' },
        Sr: { at: [2, 1], type: 'sortline', opt: { n: 5 }, lesson: 'moda', reward: { chest: { type: 'heartPiece' } } },
        K: { at: [2, 0], type: 'tally', reward: { chest: { type: 'bossKey' } } },
        Bv: { at: [0, 0], type: 'bonus', qb: ['coins', 'bombs', 'coins', 'potion'], oracle: true, feat: 'pots' },
        B: { at: [1, 0], type: 'boss' }
      },
      doors: [['S', 'H', 'open'], ['S', 'C', 'open'], ['C', 'P', 'open'], ['H', 'I', 'locked'], ['H', 'Sr', 'open'], ['Sr', 'K', 'bomb'], ['I', 'Bv', 'bomb'], ['H', 'B', 'boss']] },
    // 3) RUÍNAS DA DISPERSÃO — régua da amplitude abre o duelo dos arqueiros; raio quebra a barreira do chefe
    d3: { name: 'Ruínas da Dispersão', theme: 'd3', music: 'dungeon', topic: 'd3', crystal: 'dispersao', grid: [4, 3],
      rooms: {
        S: { at: [1, 2], type: 'start', lesson: 'dispersao' },
        C: { at: [2, 2], type: 'combat', enemies: [['escorpiao', 1], ['ruido', 2], ['gosma', 1, { variant: '_sand', tier: 1.6 }], ['cuspidor', 1, { tier: 1.6 }]], feat: 'pillars6' },
        Pl: { at: [3, 2], type: 'plates', opt: { metric: 'range' }, reward: { chest: { type: 'key' } } },
        I: { at: [3, 1], type: 'item', item: 'beam' },
        Bn: { at: [3, 0], type: 'bonus', qb: ['coins', 'coins', 'potion', 'heartPiece'], oracle: true, feat: 'pots' },
        H: { at: [1, 1], type: 'rangeline', feat: 'barrierN' },
        Ar: { at: [2, 1], type: 'archers', opt: { ask: 'sigma' }, reward: { chest: { type: 'bossKey' } } },
        Sd: { at: [0, 1], type: 'secret', reward: { chest: { type: 'heartPiece' } }, feat: 'pots' },
        B: { at: [1, 0], type: 'boss' }
      },
      doors: [['S', 'H', 'open'], ['S', 'C', 'open'], ['C', 'Pl', 'open'], ['Pl', 'I', 'locked'], ['I', 'Bn', 'beam'], ['H', 'Ar', 'puzzle'], ['H', 'Sd', 'bomb'], ['H', 'B', 'boss']] },
    // 4) ABISMO DO ACASO — descida ao fundo do vulcão: dados, urnas, ponte sobre a lava
    d4: { name: 'Abismo do Acaso', theme: 'd4', music: 'cave', topic: 'd4', crystal: 'prob', grid: [2, 5],
      rooms: {
        S: { at: [0, 0], type: 'start', lesson: 'prob', exit: 'N' },
        C: { at: [1, 0], type: 'combat', enemies: [['dado', 2], ['morcego', 1, { tier: 2 }], ['chama', 1]], feat: 'lavapools', dark: true },
        D: { at: [0, 1], type: 'dice', opt: { sum: 7 }, lesson: 'combinada', reward: { chest: { type: 'key' } } },
        U: { at: [1, 1], type: 'crystals', opt: { puzzle: 'urn' }, dark: true, reward: { chest: { type: 'key' } } },
        H: { at: [0, 2], type: 'stonepath', opt: { rule: 'prob', rows: [3, 5, 7, 9], lava: true, down: true } },
        I: { at: [1, 2], type: 'item', item: 'suit' },
        L: { at: [0, 3], type: 'hub', feat: 'lavaband', enemies: [['chama', 1], ['moeda', 2]] },
        K: { at: [1, 3], type: 'bigkey', enemies: [['esqueleto', 1, { tier: 1.5 }], ['dado', 2, { tier: 1.4 }], ['moeda', 1]], dark: true },
        X: { at: [1, 4], type: 'bonus', qb: ['coins', 'heartPiece', 'coins'], feat: 'pots' },
        B: { at: [0, 4], type: 'boss', feat: 'lavatop' }
      },
      doors: [['S', 'D', 'open'], ['S', 'C', 'open'], ['C', 'U', 'open'], ['D', 'H', 'open'], ['H', 'I', 'locked'], ['H', 'L', 'open'], ['L', 'K', 'open'], ['K', 'X', 'locked'], ['X', 'B', 'boss']] },
    // 5) TORRE DAS DISTRIBUIÇÕES — subida pela torre gelada: histograma no gelo, ponte do escore-z
    d5: { name: 'Torre das Distribuições', theme: 'd5', music: 'snow', topic: 'd5', crystal: 'distrib', grid: [2, 5],
      rooms: {
        S: { at: [0, 4], type: 'start', lesson: 'freq' },
        C: { at: [1, 4], type: 'combat', enemies: [['lobo', 2], ['gosma', 1, { variant: '_ice', tier: 2.2 }], ['barras', 1, { tier: 1.6 }]], feat: 'ice' },
        Hg: { at: [0, 3], type: 'hist', reward: { chest: { type: 'key' } } },
        Nm: { at: [1, 3], type: 'crystals', opt: { puzzle: 'normal' }, lesson: 'normal', reward: { chest: { type: 'key' } } },
        H: { at: [0, 2], type: 'stonepath', opt: { rule: 'z', rows: [9, 7, 5, 3] } },
        I: { at: [1, 2], type: 'item', item: 'spin' },
        G: { at: [0, 1], type: 'gates', opt: { puzzle: 'normalgate' }, reward: { chest: { type: 'heartPiece' } } },
        K: { at: [1, 1], type: 'bigkey', enemies: [['lobo', 1, { tier: 1.4 }], ['barras', 1, { tier: 1.8 }], ['cavaleiro', 1]], feat: 'ice' },
        Bn: { at: [1, 0], type: 'bonus', qb: ['coins', 'potion', 'coins', 'heartPiece'], oracle: true },
        B: { at: [0, 0], type: 'boss', feat: 'ice' }
      },
      doors: [['S', 'Hg', 'open'], ['S', 'C', 'open'], ['C', 'Nm', 'open'], ['Hg', 'H', 'open'], ['H', 'I', 'locked'], ['H', 'G', 'open'], ['G', 'K', 'open'], ['K', 'Bn', 'locked'], ['G', 'B', 'boss']] },
    // 6) CASTELO DO VIÉS — pesquisa por amostragem, gráfico de dispersão, revisão final
    d6: { name: 'Castelo do Viés', theme: 'd6', music: 'castle', topic: 'd6', crystal: 'amostra', grid: [3, 5],
      rooms: {
        S: { at: [1, 4], type: 'start', lesson: 'amostra' },
        C: { at: [1, 3], type: 'combat', enemies: [['cavaleiro', 1], ['fantasma', 1], ['pizza', 1, { tier: 1.6 }], ['moeda', 1, { tier: 1.8 }]], feat: 'pillars' },
        A: { at: [0, 3], type: 'survey', reward: { chest: { type: 'key' } } },
        Sc: { at: [2, 3], type: 'scatter', lesson: 'vies', reward: { chest: { type: 'key' } } },
        H: { at: [1, 2], type: 'combat', enemies: [['esqueleto', 2, { tier: 2 }], ['outlier', 2, { tier: 1.8 }], ['fantasma', 1]], feat: 'carpet' },
        Y: { at: [0, 2], type: 'bonus', qb: ['coins', 'potion', 'coins', 'bombs'], oracle: true, feat: 'pots' },
        Z: { at: [2, 2], type: 'crystals', opt: { puzzle: 'bias' }, reward: { chest: { type: 'potion' } } },
        X: { at: [1, 1], type: 'combat', enemies: [['cavaleiro', 1], ['pizza', 1, { tier: 2 }], ['ruido', 1, { tier: 2 }], ['esqueleto', 1, { tier: 2 }]], feat: 'pitband' },
        W: { at: [0, 1], type: 'stonepath', opt: { rule: 'mean', rows: [9, 7, 5, 3] }, reward: { chest: { type: 'heartPiece' } } },
        K: { at: [2, 1], type: 'braziers', opt: { rule: 'dentroSigma' }, reward: { chest: { type: 'bossKey' } } },
        B: { at: [1, 0], type: 'boss', feat: 'carpet' }
      },
      doors: [['S', 'C', 'open'], ['C', 'H', 'oracle'], ['C', 'A', 'open'], ['C', 'Sc', 'open'], ['H', 'X', 'locked'], ['H', 'Y', 'locked'], ['H', 'Z', 'open'], ['X', 'B', 'boss'], ['X', 'K', 'beam'], ['X', 'W', 'open']] }
  };

  // ------------------------------------------------------------------
  //  Entidades de masmorra
  // ------------------------------------------------------------------
  const wallRamp = () => (G.THEMES[G.map && G.map.theme] || G.THEMES.d1).wl;
  class Door extends G.Ent {
    get darkGlow() { return 30; }
    constructor(x, y, w, h, kind, flag, side) { super(x, y, w, h); this.kind = kind; this.flagKey = flag; this.solid = true; this.room = -1; this.side = side; this.open = 0; }
    interBox() { return { x: this.x - 4, y: this.y - 4, w: this.w + 8, h: this.h + 8 }; }
    interact() {
      const P = G.P, did = G.map.id;
      if (this.opening) return;
      if (this.kind === 'locked') {
        if ((P.keys[did] || 0) > 0) { P.keys[did]--; G.sfx('unlock'); this.openUp(); }
        else G.runScript(() => G.ui.say(null, 'A porta está ^ytrancada^0. Você precisa de uma ^ychave pequena^0.'));
      } else if (this.kind === 'boss') {
        if (P.bossKey[did]) { G.sfx('unlock'); this.openUp(); }
        else G.runScript(() => G.ui.say(null, 'Uma porta enorme com um selo. Precisa da ^pChave do Guardião^0.'));
      } else if (this.kind === 'oracle') {
        G.runScript(async () => {
          const r = await G.ui.ask('Porta Oráculo', 'Esta porta só se abre para quem demonstra conhecimento. Responder ao desafio?', ['Responder', 'Agora não'], { cancel: 1 });
          if (r !== 0) return;
          const ok = await G.ui.quiz(G.Q.gen(D[did].topic, 1), { title: 'PORTA ORÁCULO' });
          if (ok) { G.sfx('secret'); this.openUp(); }
          else { G.hurtPlayer(2, this.cx, this.cy, { force: true }); await G.ui.say('Porta Oráculo', 'A porta resiste... Leia a explicação e tente de novo!'); }
        });
      } else if (this.kind === 'puzzle') {
        G.runScript(() => G.ui.say(null, 'Uma porta mágica, selada por runas. Resolva o enigma desta sala para abri-la.'));
      }
    }
    openUp() { this.opening = true; G.setFlag(this.flagKey); G.sfx('door'); G.fx.burst(this.cx, this.cy, ['#c8b8a0', '#8a7a68'], 10, 40); }
    update(dt) {
      this.t += dt;
      if (this.kind === 'puzzle' && !this.opening && G.flag(this.flagKey)) this.openUp();
      if (this.opening) { this.open += dt * 2.5; if (this.open >= 1) this.dead = true; }
    }
    draw(ctx, cam) {
      const x = this.x - cam.x, y = this.y - cam.y, w = this.w, h = this.h;
      const wl = wallRamp();
      const k = Math.min(1, this.open), vert = this.side === 'v';
      ctx.save();
      ctx.fillStyle = wl[0]; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
      ctx.fillStyle = wl[3]; ctx.fillRect(x, y, w, h);
      ctx.beginPath(); ctx.rect(x + 2, y + 2, w - 4, h - 4); ctx.clip();
      const col = { locked: ['#7a4a22', '#a86a34', '#ffd23a'], boss: ['#4a1a6a', '#7a3aa0', '#ffd23a'], oracle: ['#1a3a6a', '#2a6aa8', '#7ae4ff'], puzzle: ['#3a2a4a', '#5a4a6a', '#ff9ae6'] }[this.kind] || ['#555', '#777', '#fff'];
      const sh = k * (vert ? h : h - 4);
      if (vert) {
        ctx.fillStyle = col[0]; ctx.fillRect(x + 2, y + 2 - sh, w - 4, h - 4);
        for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? col[1] : col[0]; ctx.fillRect(x + 3 + i * 4.5, y + 2 - sh, 3.5, h - 4); }
        ctx.fillStyle = '#2a2a3a'; ctx.fillRect(x + 2, y + 5 - sh, w - 4, 1.5); ctx.fillRect(x + 2, y + h - 7 - sh, w - 4, 1.5);
      } else {
        ctx.fillStyle = col[0]; ctx.fillRect(x + 2, y + 2 - sh, w - 4, h - 4);
        for (let i = 0; i < 9; i++) { ctx.fillStyle = i % 2 ? col[1] : col[0]; ctx.fillRect(x + 2, y + 3 + i * 5 - sh, w - 4, 4); }
        ctx.fillStyle = '#2a2a3a'; ctx.fillRect(x + 4, y + 2 - sh, 1.5, h - 4); ctx.fillRect(x + w - 5.5, y + 2 - sh, 1.5, h - 4);
      }
      const cx = x + w / 2, cy = y + h / 2 - sh;
      if (this.kind === 'locked') {
        ctx.fillStyle = '#3a2008'; G.rrPath(ctx, cx - 4.5, cy - 3, 9, 8, 1.5); ctx.fill();
        ctx.strokeStyle = '#c8a040'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(cx, cy - 3, 2.5, Math.PI, 0); ctx.stroke();
        ctx.fillStyle = col[2]; G.rrPath(ctx, cx - 3.5, cy - 2, 7, 6, 1); ctx.fill();
        ctx.fillStyle = '#3a2008'; ctx.fillRect(cx - 0.5, cy, 1, 2.5);
      } else if (this.kind === 'boss') {
        ctx.strokeStyle = '#8a8aa0'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 2, cy - 7); ctx.lineTo(x + w - 2, cy + 7); ctx.moveTo(x + w - 2, cy - 7); ctx.lineTo(x + 2, cy + 7); ctx.stroke();
        ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#7a1a3a'; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ff5a8a'; ctx.beginPath(); ctx.arc(cx - 1, cy - 1, 1.5, 0, Math.PI * 2); ctx.fill();
      } else if (this.kind === 'oracle') {
        ctx.fillStyle = '#0a1a3a'; ctx.beginPath(); ctx.ellipse(cx, cy, 6, 4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#7ae4ff'; ctx.beginPath(); ctx.ellipse(cx, cy, 4.5, 3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(cx, cy, 1.5 + Math.sin(this.t * 3) * 0.3, 0, Math.PI * 2); ctx.fill();
        G.light.add(cx, cy, 24, '#7ae4ff', 0.6);
      } else if (this.kind === 'puzzle') {
        const a = 0.6 + 0.4 * Math.sin(this.t * 4);
        ctx.globalAlpha = a; ctx.strokeStyle = col[2]; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.moveTo(cx, cy - 5); ctx.lineTo(cx, cy + 5); ctx.moveTo(cx - 5, cy); ctx.lineTo(cx + 5, cy); ctx.stroke();
        ctx.globalAlpha = 1;
        G.light.add(cx, cy, 22, '#ff9ae6', 0.5 * a);
      }
      ctx.restore();
    }
  }
  class Shutter extends G.Ent {
    constructor(x, y, w, h, room) { super(x, y, w, h); this.solid = true; this.room = room; this.closing = 0; this.opening = false; }
    update(dt) { this.t += dt; this.closing = Math.min(1, this.closing + dt * 5); if (this.opening) { this.closing -= dt * 8; if (this.closing <= 0) this.dead = true; } }
    draw(ctx, cam) {
      const x = this.x - cam.x, y = this.y - cam.y, k = Math.max(0, this.closing);
      ctx.save();
      ctx.beginPath(); ctx.rect(x, y, this.w, this.h); ctx.clip();
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(x, y, this.w, this.h);
      const horiz = this.w > this.h;
      const n = horiz ? 6 : 4;
      for (let i = 0; i < n; i++) {
        if (horiz) { const bx = x + 2 + i * (this.w - 4) / (n - 1) - 1.5, len = this.h * k; ctx.fillStyle = '#2a2a3a'; ctx.fillRect(bx, y, 3, len); ctx.fillStyle = '#9a9ab0'; ctx.fillRect(bx + 0.5, y, 1.5, len - 2); ctx.fillStyle = '#d8d8e8'; ctx.beginPath(); ctx.moveTo(bx - 0.5, y + len - 2); ctx.lineTo(bx + 1.5, y + len + 1.5); ctx.lineTo(bx + 3.5, y + len - 2); ctx.fill(); }
        else { const by = y + 3 + i * (this.h - 6) / (n - 1) - 1, len = this.w * k; ctx.fillStyle = '#2a2a3a'; ctx.fillRect(x, by, len, 3); ctx.fillStyle = '#9a9ab0'; ctx.fillRect(x, by + 0.5, len, 1.5); }
      }
      ctx.restore();
    }
  }
  class DataStone extends G.Ent { // pedestal com número
    get darkGlow() { return 30; }
    constructor(x, y, value) { super(x + 2, y + 6, 12, 10); this.solid = true; this.value = value; }
    draw(ctx, cam) {
      const x = this.x - 2 - cam.x, y = this.y - 6 - cam.y;
      G.shadow(ctx, x + 8, y + 16, 14, 0.3);
      ctx.save();
      const g = ctx.createLinearGradient(0, y + 2, 0, y + 16); g.addColorStop(0, '#d8d8f0'); g.addColorStop(1, '#7a7a98');
      ctx.fillStyle = '#1b1428'; G.rrPath(ctx, x + 1, y + 1, 14, 15, 2); ctx.fill();
      ctx.fillStyle = g; G.rrPath(ctx, x + 1.5, y + 1.5, 13, 14, 2); ctx.fill();
      ctx.restore();
      G.text(String(this.value), x + 8, y + 5, '#1b1428', { align: 'center', shadow: false });
    }
  }
  class Gem extends G.Ent {
    get darkGlow() { return 30; }
    constructor(x, y, color) { super(x, y, 8, 8); this.color = color; }
    get by() { return this.y - 50; }
    draw(ctx, cam) {
      const x = this.x - cam.x, y = this.y - cam.y, c = this.color;
      const bob = Math.sin(G.time * 3 + this.x) * 1;
      G.shadow(ctx, x + 4, y + 7, 6, 0.3);
      ctx.save(); ctx.fillStyle = '#1b1428'; ctx.beginPath(); ctx.moveTo(x + 4, y - 1 + bob); ctx.lineTo(x + 8.5, y + 2.5 + bob); ctx.lineTo(x + 4, y + 7 + bob); ctx.lineTo(x - 0.5, y + 2.5 + bob); ctx.fill();
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x + 4, y + bob); ctx.lineTo(x + 7.5, y + 2.5 + bob); ctx.lineTo(x + 4, y + 6 + bob); ctx.lineTo(x + 0.5, y + 2.5 + bob); ctx.fill();
      ctx.fillStyle = '#ffffffc0'; ctx.fillRect(x + 2.5, y + 1.5 + bob, 1.5, 1); ctx.restore();
    }
  }
  class Jar extends G.Ent {
    get darkGlow() { return 34; }
    constructor(x, y, gold, gray, label) { super(x, y + 8, 24, 16); this.solid = true; this.gold = gold; this.gray = gray; this.label = label; }
    draw(ctx, cam) {
      const x = this.x - cam.x, y = this.y - 16 - cam.y;
      G.shadow(ctx, x + 12, y + 32, 24, 0.3);
      ctx.save();
      ctx.fillStyle = '#1b1428'; G.rrPath(ctx, x - 0.5, y + 5.5, 25, 27, 5); ctx.fill();
      ctx.fillStyle = 'rgba(170,210,255,0.28)'; G.rrPath(ctx, x + 0.5, y + 6.5, 23, 25, 4.5); ctx.fill();
      ctx.fillStyle = '#c0c0e0'; G.rrPath(ctx, x + 4, y + 2, 16, 5, 1.5); ctx.fill();
      const balls = []; for (let i = 0; i < this.gold; i++) balls.push('#ffd23a'); for (let i = 0; i < this.gray; i++) balls.push('#8a8aa0');
      balls.forEach((c, i) => { const bx = x + 4.5 + (i % 4) * 5, by = y + 27.5 - Math.floor(i / 4) * 5; ctx.fillStyle = '#1b1428'; ctx.beginPath(); ctx.arc(bx, by, 2.4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = c; ctx.beginPath(); ctx.arc(bx, by, 1.9, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffffffa0'; ctx.fillRect(bx - 1, by - 1.2, 0.8, 0.6); });
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x + 2.5, y + 9, 1, 16);
      ctx.restore();
    }
    drawLate(ctx, cam) { G.puzTag(ctx, this.x + 12 - cam.x, this.y - 25 - cam.y, this.label); }
  }
  class Mural extends G.Ent {
    get darkGlow() { return 60; }
    constructor(x, y, w, h, fig, title) { super(x, y, w, h); this.solid = true; this.fig = fig; this.title = title; }
    get by() { return this.y - 100; }
    draw(ctx, cam) {
      const x = this.x - cam.x, y = this.y - cam.y;
      G.panel(ctx, x - 3, y - 3, this.w + 6, this.h + 6, { r: 2, border: '#c8904a', bgTop: '#2a1a10', bg: '#1a100a', corners: false, thin: true });
      G.ui.drawFig(ctx, this.fig, x, y, this.w, this.h);
      if (this.title) G.puzTag(ctx, x + this.w / 2, y + this.h + 4, this.title);
    }
  }
  class Gate extends G.Ent {
    get darkGlow() { return 34; }
    constructor(x, y, w, h, labelLines, correct, puzzle, side) { super(x, y, w, h); this.solid = true; this.lines = labelLines; this.correct = correct; this.puzzle = puzzle; this.side = side; }
    interBox() { return { x: this.x - 4, y: this.y - 4, w: this.w + 8, h: this.h + 8 }; }
    interact() { this.puzzle.choose(this); }
    onHit() { this.puzzle.choose(this); return false; }
    draw(ctx, cam) {
      const x = this.x - cam.x, y = this.y - cam.y;
      ctx.save();
      ctx.fillStyle = '#1b1428'; ctx.fillRect(x, y, this.w, this.h);
      const horiz = this.w > this.h;
      for (let i = 1; i < (horiz ? this.w : this.h); i += 4) { ctx.fillStyle = '#6a5a8a'; if (horiz) ctx.fillRect(x + i, y + 1, 2, this.h - 2); else ctx.fillRect(x + 1, y + i, this.w - 2, 2); ctx.fillStyle = '#b8a8d8'; if (horiz) ctx.fillRect(x + i, y + 1, 0.5, this.h - 2); else ctx.fillRect(x + 1, y + i, this.w - 2, 0.5); }
      ctx.restore();
      const lw = Math.max(...this.lines.map(l => G.textW(l))) + 10, lh = this.lines.length * 9 + 5;
      let px = x + this.w / 2 - lw / 2, py = y + this.h + 2;
      if (this.side === 'N') py = y - lh - 2;
      else if (this.side === 'E') { px = x + this.w + 3; py = y + this.h / 2 - lh / 2; }
      else if (this.side === 'W') { px = x - lw - 3; py = y + this.h / 2 - lh / 2; }
      this._lab = [px + cam.x, py + cam.y, lw, lh];
    }
    drawLate(ctx, cam) { if (!this._lab) return; const [px, py, lw, lh] = this._lab; G.panel(ctx, px - cam.x, py - cam.y, lw, lh, { r: 2, thin: true, corners: false }); this.lines.forEach((l, i) => G.text(l, px - cam.x + lw / 2, py - cam.y + 3 + i * 9, '#ffffff', { align: 'center', shadow: false })); }
  }
  // emblema entalhado no chão da arena do chefe (símbolo do tema da masmorra)
  const EMBLEMA = {
    d1: { sym: ['#...#', '#...#', '#...#', '#..##', '###.#', '#....', '#....'], cor: '#6aff9a' }, // μ
    d2: { sym: ['......#', '.....##', '....###', '...####', '..#####', '.######', '#######'], cor: '#b8ff6a' }, // dados ordenados
    d3: { sym: ['.####', '#..#.', '#...#', '#...#', '.###.'], cor: '#ffc86a' }, // σ
    d4: { sym: ['#######', '#.#.#.#', '#.....#', '#..#..#', '#.....#', '#.#.#.#', '#######'], cor: '#ff8a4a' }, // face de dado
    d5: { sym: ['....#....', '...#.#...', '..#...#..', '.#.....#.', '##.....##'], cor: '#7ad8ff' }, // sino de Gauss
    d6: { sym: ['#......', '##.....', '##.#...', '####...', '####.#.', '######.', '#######'], cor: '#d08aff' }, // barras enviesadas
    d7: { sym: ['#..#.###', '#..#.#.#', '####.#.#', '#..#.#.#', '#..#.###'], cor: '#8ab0ff' } // H0
  };
  const emblemArt = {};
  function makeEmblem(did) {
    if (emblemArt[did]) return emblemArt[did];
    const E = EMBLEMA[did], f = (G.THEMES[G.DUNGEONS[did].theme] || {}).f || ['#202020', '#404040', '#606060', '#808080', '#a0a0a0'];
    const p = new G.Paint(272, 128), gl = new G.Paint(272, 128), cx = 136, cy = 64, rx = 130, ry = 58;
    const groove = (x, y) => { p.px(x, y, G.col.mix(f[0], '#000000', 0.35) + 'e0'); };
    for (let y = 0; y < 128; y++) for (let x = 0; x < 272; x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = Math.hypot(dx, dy);
      if ((d > 0.95 && d <= 1) || (d > 0.63 && d <= 0.67)) groove(x, y);
      else if ((d > 0.91 && d <= 0.95 && dy > 0.1) || (d > 0.59 && d <= 0.63 && dy > 0.1)) p.px(x, y, f[4] + 'a0'); // aresta clara do sulco
      else if (d > 0.67 && d <= 0.91) p.px(x, y, f[1] + '50'); // faixa das runas, mais escura
      else if (d < 0.59 && d > 0.2 && G.fastNoise(x * 0.08, y * 0.16) > 0.68) p.px(x, y, f[3] + '30'); // desgaste
    }
    // runas entre os anéis
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2 + 0.13;
      for (let r = 0.72; r <= 0.86; r += 0.01) { const x = Math.round(cx + Math.cos(a) * rx * r), y = Math.round(cy + Math.sin(a) * ry * r); groove(x, y); groove(x + 1, y); gl.px(x, y, '#ffffff'); gl.px(x + 1, y, '#ffffff'); }
      const x = Math.round(cx + Math.cos(a) * rx * 0.79), y = Math.round(cy + Math.sin(a) * ry * 0.79);
      for (const [ox, oy] of [[-2, -1], [2, 1], [-2, 1], [2, -1]]) if ((i + ox) % 3 === 0) { groove(x + ox, y + oy); gl.px(x + ox, y + oy, '#ffffff'); }
    }
    // símbolo no centro
    const S = 4, sw = E.sym[0].length * S, sh = E.sym.length * S, sx = Math.round(cx - sw / 2), sy = Math.round(cy - sh / 2);
    E.sym.forEach((row, r) => [...row].forEach((ch, c) => { if (ch !== '#') return; for (let a = 0; a < S; a++) for (let b = 0; b < S; b++) { groove(sx + c * S + a, sy + r * S + b); gl.px(sx + c * S + a, sy + r * S + b, '#ffffff'); } }));
    return (emblemArt[did] = { img: p.toCanvas(), glow: gl.toCanvas(), cor: E.cor });
  }
  class ArenaEmblem extends G.Ent {
    constructor(x, y, did) { super(x - 68, y - 32, 136, 64); this.art = makeEmblem(did); }
    get by() { return -100000 + this.y; }
    draw(ctx, cam) {
      const A = this.art, x = this.x - cam.x, y = this.y - cam.y, B = G.boss;
      G.draw(ctx, A.img, x, y);
      // as runas pulsam durante a luta e brilham calmas depois do cristal recuperado
      const fight = B && !B.dead && B.room === this.room, a = fight ? (B.st === 'intro' ? 0.15 : 0.32 + 0.18 * Math.sin(this.t * 3)) : G.flag(G.map.id + '_crystalGot') ? 0.3 : 0.08;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; ctx.drawImage(G.tint(A.glow, A.cor), x, y, 136, 64); ctx.restore();
      if (a > 0.2) G.light.add(x + 68, y + 32, 70, A.cor, a * 0.8);
    }
  }
  class Portal extends G.Ent {
    constructor(x, y) { super(x - 12, y - 8, 24, 16); this.room = G.curRoom; }
    get by() { return this.y - 100; }
    update(dt) {
      this.t += dt;
      const p = G.player;
      if (p && p.state === 'normal' && this.t > 0.6 && G.overlap(p, this)) { this.dead = true; G.sfx('warp'); G.exitDungeon(); }
      if (Math.random() < 0.6) G.fx.spawn({ x: this.cx + G.rf(-10, 10), y: this.cy, vy: -40, life: 0.7, color: G.pick(['#7ae4ff', '#ffffff', '#ff9ae6']), size: 1, drag: 0 });
    }
    draw(ctx, cam) {
      const x = this.cx - cam.x, y = this.cy - cam.y;
      G.light.add(x, y, 60, '#c8a0ff', 0.9, 0.45);
      ctx.save();
      for (let i = 0; i < 4; i++) { const r = 12 - i * 3; ctx.fillStyle = ['#ff9ae6', '#7ae4ff', '#ffffff', '#c070ff'][(i + Math.floor(this.t * 8)) % 4]; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.5, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.globalAlpha = 0.5; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 0.5;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(x, y, 13, 6.5, 0, this.t * 3 + i * 2, this.t * 3 + i * 2 + 1.2); ctx.stroke(); }
      ctx.restore();
    }
  }
  class CrystalDrop extends G.Ent {
    constructor(x, y, cid) { super(x - 8, y - 8, 16, 16); this.cid = cid; this.z = 120; this.room = G.curRoom; }
    update(dt) {
      this.t += dt; this.z = Math.max(0, this.z - 60 * dt);
      if (Math.random() < 0.4) G.fx.spawn({ x: this.cx + G.rf(-8, 8), y: this.cy - this.z, vy: 20, life: 0.5, color: '#ffffff', size: 1 });
      const p = G.player;
      if (this.z <= 0 && p && p.state === 'normal' && G.overlap(p, { x: this.x - 4, y: this.y - 4, w: 24, h: 24 })) {
        this.dead = true;
        G.runScript(async () => { await G.give('crystal', this.cid); if (G.afterCrystal) await G.afterCrystal(this); });
      }
    }
    draw(ctx, cam) {
      G.light.add(this.cx - cam.x, this.cy - this.z - cam.y, 64, '#ffffff', 0.9, 0.5);
      G.shadow(ctx, this.cx - cam.x, this.cy + 6 - cam.y, 12, 0.3);
      const bob = this.z <= 0 ? Math.sin(this.t * 3) * 2 : 0;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, this.cx - cam.x, this.cy - this.z - cam.y + bob, 18, '#ffffff', 0.4 + 0.15 * Math.sin(this.t * 5)); ctx.restore();
      G.draw(ctx, 'crystal_' + this.cid, this.x - cam.x, this.y - this.z - cam.y + bob);
    }
  }
  // ------------------------------------------------------------------
  //  Santuário (sala do poder): altar, círculo rúnico, estandartes e guardiões
  // ------------------------------------------------------------------
  let pedSpr = null;
  function pedestalSprite() {
    if (pedSpr) return pedSpr;
    const A = G.artTools, p = new G.Paint(48, 60);
    const st = ['#3a3448', '#6a6480', '#9a94b0', '#c8c2dc', '#ece8f8'], gd = ['#6a4010', '#a87020', '#e0aa38', '#ffd86a', '#fff4c0'], vel = ['#4a0a1a', '#7a1a2a', '#b02a3a', '#d84a5a', '#f08a90'];
    p.curPart = 1; A.bevel(p, A.inRR(3, 50, 42, 9, 2), st, [2, 49, 46, 60]);
    p.curPart = 2; A.bevel(p, A.inRR(8, 44, 32, 7, 2), st, [7, 43, 41, 52]);
    p.curPart = 3; A.cyl(p, A.inRR(15, 18, 18, 27, 1), st, [14, 17, 34, 46], { hi: 0.3, sh: 0.7 });
    for (let x = 15; x < 33; x++) { p.px(x, 19, gd[3]); p.px(x, 20, gd[1]); p.px(x, 42, gd[2]); p.px(x, 43, gd[0]); }
    // Σ gravado
    const S = ['######', '.#....', '..#...', '...#..', '..#...', '.#....', '######'];
    for (let r = 0; r < S.length; r++) for (let c = 0; c < 6; c++) if (S[r][c] === '#') { p.px(21 + c, 26 + r, gd[2]); p.px(22 + c, 27 + r, st[0]); }
    for (let r = 0; r < S.length; r++) for (let c = 0; c < 6; c++) if (S[r][c] === '#') p.px(21 + c, 26 + r, r === 0 ? gd[4] : gd[2]);
    p.curPart = 4; A.bevel(p, A.inRR(9, 11, 30, 8, 2), st, [8, 10, 40, 20]);
    for (let x = 10; x < 38; x++) p.px(x, 13, gd[3]);
    p.curPart = 5; p.ell(24, 9, 10, 3.5, { ramp: vel, ambient: 0.4 });
    p.innerLines({ front: true, kf: -0.5 }); p.outline({ k: -0.75 });
    pedSpr = p.toCanvas();
    return pedSpr;
  }
  class Altar extends G.Ent {
    get darkGlow() { return 40; }
    constructor(cx, by, flag, item, o = {}) { super(cx - 10, by - 9, 20, 9); this.solid = true; this.flagKey = flag; this.item = item; this.o = o; this.flyT = -1; this.flare = 0; }
    get taken() { return G.flag(this.flagKey); }
    interBox() { return { x: this.x - 4, y: this.y - 10, w: this.w + 8, h: this.h + 16 }; }
    update(dt) {
      this.t += dt;
      if (this.flare > 0) this.flare = Math.max(0, this.flare - dt * 0.5);
      if ((!this.taken || this.flyT >= 0) && Math.random() < 0.35) G.fx.glow(this.cx + G.rf(-12, 12), this.y - G.rf(0, 36), { size: 2, color: '#fff2c0', vy: -18, life: 0.9 });
      if (this.flyT >= 0) { this.flyT += dt; if (this.flyT > 3) { this.flyT = -1; this.alwaysUpdate = false; } }
    }
    interact(p) {
      if (this.taken || this.flyT >= 0) return;
      G.setFlag(this.flagKey); this.flyT = 0; this.alwaysUpdate = true; this.flare = 1;
      G.runScript(async () => {
        p.dir = 1;
        G.sfx('crystal'); G.flash('#fff8e0', 0.5, 0.55); G.shake(2, 0.35);
        for (let i = 0; i < 26; i++) G.fx.converge(this.cx, this.y - 30, G.rf(30, 60), G.pick(['#ffffff', '#ffe27a', '#ffb84a']), 1, G.rf(0.3, 0.7));
        G.fx.ring(this.cx, this.y + 4, 50, '#ffe27a', 0.6, 3);
        await G.wait(1.0);
        await G.give('item', this.item);
        if (this.o.after) await this.o.after();
      });
    }
    itemPos(cam) {
      const ped = pedestalSprite(), top = this.y + this.h - cam.y - G.lh(ped) + 2;
      let x = this.cx - cam.x, y = top - 12 + Math.sin(this.t * 2.5) * 2;
      if (this.flyT >= 0) {
        // voa em arco até as mãos do herói
        const k = Math.min(1, this.flyT / 1.0), e = k * k * (3 - 2 * k), p = G.player;
        const tx = p.cx - cam.x, ty = p.y + p.h - cam.y - 34;
        x = G.lerp(x, tx, e); y = G.lerp(y, ty, e) - Math.sin(k * Math.PI) * 18;
      }
      return { x, y };
    }
    draw(ctx, cam) {
      const x = this.cx - cam.x, by = this.y + this.h - cam.y, on = !this.taken || this.flyT >= 0;
      const ped = pedestalSprite();
      G.lightBeam(ctx, x, by - 2, 30 + this.flare * 20, on ? 0.55 + 0.1 * Math.sin(this.t * 2) + this.flare * 0.5 : 0.15, '#fff0c8');
      G.shadow(ctx, x, by - 1, 22, 0.35);
      G.draw(ctx, ped, x - G.lw(ped) / 2, by - G.lh(ped) + 2);
      G.light.add(x, by - 30, on ? 90 : 40, '#fff0c8', on ? 1 : 0.4, 0.4);
      if (on && this.flyT < 0) this.drawItem(ctx, cam);
    }
    drawLate(ctx, cam) { if (this.flyT >= 0 && this.flyT < 1.0) this.drawItem(ctx, cam); }
    drawItem(ctx, cam) {
      {
        const it = G.spr[G.ITEMS[this.item][0]], q = this.itemPos(cam);
        G.lightRays(ctx, q.x, q.y, 28 + this.flare * 24, 0.65 + this.flare * 0.35, this.t, '#ffe8a0', 12);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, q.x, q.y, 14, '#fff6d0', 0.8); ctx.restore();
        if (it) G.draw(ctx, it, q.x - G.lw(it) / 2, q.y - G.lh(it) / 2);
      }
    }
  }
  class RuneCircle extends G.Ent {
    constructor(cx, cy, altar) { super(cx - 46, cy - 27, 92, 54); this.altar = altar; this.room = G.curRoom; }
    get by() { return this.y - 400; }
    update(dt) { this.t += dt; }
    draw(ctx, cam) {
      const A = this.altar, on = !A.taken || A.flyT >= 0, k = on ? 1 : 0.22;
      const x = this.cx - cam.x, y = this.cy - cam.y, rx = 44, ry = 25;
      const spin = this.t * 0.25 + (A.flyT >= 0 ? A.flyT * A.flyT * 2 : 0);
      ctx.save();
      ctx.strokeStyle = 'rgba(16,8,28,0.45)'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.globalCompositeOperation = 'lighter';
      const c = G.col.alpha('#ffd890', 0.55 * k + 0.35 * A.flare);
      ctx.strokeStyle = c; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(x, y, rx - 9, ry - 5, 0, 0, Math.PI * 2); ctx.stroke();
      // hexagrama girando
      for (let tri = 0; tri < 2; tri++) {
        ctx.beginPath();
        for (let i = 0; i <= 3; i++) { const an = -spin * 1.5 + tri * Math.PI / 3 + i * Math.PI * 2 / 3; const px = x + Math.cos(an) * (rx - 10), py = y + Math.sin(an) * (ry - 6); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
        ctx.stroke();
      }
      // símbolos estatísticos em volta
      const gl = ['Σ', 'μ', 'σ', 'n', 'p', 'x', 'Σ', 'μ', 'σ', 'n', 'p', 'x'];
      ctx.globalAlpha = 0.7 * k + 0.3 * A.flare;
      for (let i = 0; i < gl.length; i++) { const an = spin + i * Math.PI * 2 / gl.length; G.text(gl[i], x + Math.cos(an) * (rx - 4.5), y + Math.sin(an) * (ry - 2.5) - 3.5, '#ffe2a0', { align: 'center', shadow: false }); }
      ctx.restore();
      G.light.add(x, y, 70, '#ffd890', 0.45 * k + 0.4 * A.flare);
    }
  }
  class Banner extends G.Ent {
    constructor(x, y, color, sym) { super(x, y, 14, 28); this.color = color; this.sym = sym; this.room = G.curRoom; }
    get by() { return this.y - 60; }
    draw(ctx, cam) {
      const x = this.x - cam.x, y = this.y - cam.y, w = this.w, h = this.h, sw = Math.sin(G.time * 1.4 + this.x * 0.1) * 0.8;
      const R = G.col.ramp(this.color, 5, 1);
      ctx.save();
      const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, R[3]); g.addColorStop(0.5, R[2]); g.addColorStop(1, R[1]);
      ctx.fillStyle = '#1b1428';
      ctx.beginPath(); ctx.moveTo(x - 0.5, y + 1); ctx.lineTo(x + w + 0.5, y + 1); ctx.lineTo(x + w + 0.5 + sw, y + h + 0.5); ctx.lineTo(x + w / 2 + sw, y + h - 5.5); ctx.lineTo(x - 0.5 + sw, y + h + 0.5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(x, y + 1.5); ctx.lineTo(x + w, y + 1.5); ctx.lineTo(x + w + sw, y + h - 0.5); ctx.lineTo(x + w / 2 + sw, y + h - 6); ctx.lineTo(x + sw, y + h - 0.5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e8b84a'; ctx.fillRect(x + 1, y + 3, w - 2, 1); ctx.fillRect(x + 1 + sw * 0.6, y + h - 9, w - 2, 1);
      ctx.fillStyle = '#5a3a1a'; ctx.fillRect(x - 2, y, w + 4, 2); ctx.fillStyle = '#ffd86a'; ctx.fillRect(x - 3, y - 0.5, 2, 3); ctx.fillRect(x + w + 1, y - 0.5, 2, 3);
      ctx.restore();
      G.text(this.sym, x + w / 2 + sw * 0.4, y + 8, '#ffe8a0', { align: 'center', shadow: false });
    }
  }
  class GuardStatue extends G.Ent {
    constructor(x, y, flip) { super(x + 2, y + 8, 12, 8); this.solid = true; this.flip = flip; this.room = G.curRoom; }
    draw(ctx, cam) {
      const x = this.cx - cam.x, by = this.y + this.h - cam.y;
      G.shadow(ctx, x, by, 16, 0.35);
      ctx.save();
      ctx.fillStyle = '#1b1428'; G.rrPath(ctx, x - 9.5, by - 7.5, 19, 8, 1.5); ctx.fill();
      const g = ctx.createLinearGradient(0, by - 7, 0, by); g.addColorStop(0, '#b8b2cc'); g.addColorStop(1, '#6a6480');
      ctx.fillStyle = g; G.rrPath(ctx, x - 9, by - 7, 18, 7, 1.5); ctx.fill();
      ctx.restore();
      const s = G.spr.guardiao_down_stand;
      if (s) G.draw(ctx, s, x - G.lw(s) / 2, by - 6 - G.lh(s) + 1, { flip: this.flip });
      // espada de pedra apoiada à frente
      const sw = G.spr.swordBlade3;
      if (sw) { ctx.save(); ctx.translate(x + (this.flip ? -1 : 1) * 0.5, by - 9); ctx.rotate(Math.PI / 2); G.draw(ctx, sw, -14, -3, { tint: 'rgba(150,146,170,0.85)' }); ctx.restore(); }
    }
  }
  class TargetMark extends G.Ent {
    constructor(x, y, txt) { super(x, y, 64, 12); this.txt = txt; }
    get by() { return this.y - 100; }
    draw() { }
    drawLate(ctx, cam) { G.puzTag(ctx, this.x + 24 - cam.x, this.y - cam.y, this.txt); }
  }

  // ------------------------------------------------------------------
  //  Puzzles clássicos: placas, cristais de resposta, portões
  // ------------------------------------------------------------------
  const COLORS = [['Vermelho', 'Verm.', '#ff5a5a'], ['Azul', 'Azul', '#5a8aff'], ['Verde', 'Verde', '#5aff7a'], ['Amarelo', 'Amar.', '#ffd84a']];
  function crystalPuzzle(kind, ox, oy) {
    const objs = [];
    const pos = (lx, ly) => [ox + lx * TS, oy + ly * TS];
    if (kind === 'mode') {
      const counts = G.shuffle([5, 3, 2, 1]);
      const gems = [];
      counts.forEach((c, i) => { for (let k = 0; k < c; k++) gems.push(i); });
      G.shuffle(gems);
      gems.forEach((ci, k) => { const [x, y] = pos(5 + (k % 6) * 2.4, 4 + Math.floor(k / 6) * 2); objs.push(new Gem(x + G.ri(-3, 3), y + G.ri(-2, 2), COLORS[ci][2])); });
      const best = counts.indexOf(5);
      return { prompt: 'Conte as gemas no chão. Golpeie o cristal da cor que é a ^yMODA^0 (a cor mais frequente).', objs, opts: COLORS.map((c, i) => ({ label: c[1], ok: i === best, color: c[2] })) };
    }
    if (kind === 'urn') {
      let jars;
      do { jars = [0, 1, 2].map(() => { const g = G.ri(1, 5), s = G.ri(1, 7); return [g, s, g / (g + s)]; }); }
      while (new Set(jars.map(j => j[2].toFixed(3))).size < 3);
      const best = jars.reduce((b, j, i) => (j[2] > jars[b][2] ? i : b), 0);
      jars.forEach(([g, s], i) => { const [x, y] = pos(4 + i * 7, 3); objs.push(new Jar(x, y, g, s, 'ABC'[i])); });
      return { prompt: 'Cada pote tem bolas ^ydouradas^0 e cinzas. Golpeie o cristal do pote com ^yMAIOR probabilidade^0 de tirar uma bola dourada (douradas ÷ total).', objs, opts: [0, 1, 2].map(i => ({ label: 'ABC'[i], ok: i === best })), spread: 7, startX: 4.25 };
    }
    if (kind === 'dicesum') {
      const s = G.pick([2, 3, 4, 5, 6, 8, 9, 10, 11, 12]);
      const ways = 6 - Math.abs(7 - s);
      const correct = G.frac(ways, 36);
      const labels = [correct];
      for (const d of [G.frac(1, 6), G.frac(ways + 1, 36), G.frac(1, 11), G.frac(Math.max(1, ways - 1), 36), G.frac(1, 36)]) if (labels.length < 4 && !labels.includes(d)) labels.push(d);
      const [mx, my] = pos(6, 1);
      objs.push(new Mural(mx, my, 192, 50, { type: 'sums' }, 'Combinações de soma (36 no total)'));
      return { prompt: 'Lançando dois dados, qual a probabilidade de a SOMA ser ^y' + s + '^0? (Veja o mural!)', objs, opts: G.shuffle(labels).map(l => ({ label: l, ok: l === correct })) };
    }
    if (kind === 'normal') {
      const band = G.pick([1, 2]);
      const [mx, my] = pos(6, 1);
      objs.push(new Mural(mx, my, 192, 56, { type: 'normal', band }, 'Distribuição Normal'));
      const correct = band === 1 ? '68%' : '95%';
      return { prompt: 'Que porcentagem dos dados fica na faixa verde (entre μ-' + (band === 1 ? 'σ' : '2σ') + ' e μ+' + (band === 1 ? 'σ' : '2σ') + ')?', objs, opts: G.shuffle(['50%', '68%', '95%', '99,7%']).map(l => ({ label: l, ok: l === correct })) };
    }
    if (kind === 'bias') {
      const it = G.pick([
        ['Pesquisa: "Você gosta do rei?" feita SÓ dentro do palácio. O resultado tem...', ['Viés', 'Sem viés', 'Variância 0'], 0],
        ['Para estimar a média de idade da vila, a melhor amostra é:', ['Sorteio', 'Só crianças', 'Só amigos'], 0],
        ['Sorvete e afogamentos sobem juntos no verão. Sorvete CAUSA afogamento?', ['Não', 'Sim', 'Às vezes'], 0],
        ['Um gráfico de barras começa o eixo em 98, e não em 0. Isso...', ['Engana', 'É exato', 'Mede σ'], 0]
      ]);
      return { prompt: it[0], objs, opts: it[1].map((l, i) => ({ label: l, ok: i === it[2] })), spread: 6, startX: 5 };
    }
    let vals;
    if (kind === 'mean') { const m = G.ri(4, 9); vals = [m - 3, m + 1, m - 1, m + 3, m]; G.shuffle(vals); vals = vals.slice(0, 4); const s = st.sum(vals); vals[0] -= s % 4; }
    else { const set = new Set(); while (set.size < 5) set.add(G.ri(1, 19)); vals = G.shuffle([...set]); }
    vals.forEach((v, k) => { const [x, y] = pos(4 + k * 3.6, 4); objs.push(new DataStone(x, y, v)); });
    const correct = kind === 'median' ? st.median(vals) : kind === 'mean' ? st.mean(vals) : st.range(vals);
    const dist = kind === 'median' ? [vals[2], Math.round(st.mean(vals)), Math.max(...vals), Math.min(...vals), correct + 1] : kind === 'mean' ? [st.median(vals), correct + 1, correct - 1, st.sum(vals)] : [Math.max(...vals), Math.min(...vals), correct + 2, correct - 1];
    const labels = [correct];
    for (const d of dist) if (labels.length < 4 && !labels.includes(d)) labels.push(d);
    while (labels.length < 4) labels.push(correct + labels.length * 2);
    G.shuffle(labels);
    const name = { median: 'MEDIANA', mean: 'MÉDIA', range: 'AMPLITUDE' }[kind] || 'MEDIANA';
    return { prompt: 'Observe os números nas pedras. Golpeie o cristal com a ^y' + name + '^0 desses valores.', objs, opts: labels.map(l => ({ label: F(l), ok: l === correct })) };
  }
  function topicOf(p) { return { mode: 'moda', median: 'mediana', mean: 'media', range: 'amplitude', urn: 'prob', dicesum: 'combinada', normal: 'normal', bias: 'vies' }[p] || 'media'; }

  G.PUZ.crystals = (c) => {
    const { r, add, L } = c;
    const kind = c.opt.puzzle || 'median';
    if (c.solved) return { rewardPos: [11, 10] };
    const pz = crystalPuzzle(kind, r.px, r.py);
    for (const o of pz.objs) add(o, r.idx);
    const n = pz.opts.length, spread = pz.spread || (n === 4 ? 4 : 5), sx = pz.startX || (12 - (n - 1) * spread / 2 - 0.5);
    const crystals = [];
    pz.opts.forEach((op, i) => {
      crystals.push(add(new G.AnswerCrystal(...L(sx + i * spread, 8), op.label, op.ok, (cr) => {
        if (c.isSolved()) return;
        if (cr.correct) { G.sfx('correct'); cr.shatter(); for (const o of crystals) if (o !== cr && !o.dead) o.shatter(); G.recordQuiz(topicOf(kind), true); c.solve(); }
        else { G.sfx('shock'); G.hurtPlayer(2, cr.cx, cr.cy, { force: true }); cr.shatter(); G.recordQuiz(topicOf(kind), false); G.ui.toast('Errado! Pense de novo...', '#ff8a7a'); }
      }, { color: op.color }), r.idx));
    });
    add(new G.Sign(...L(20, 2), pz.prompt, { name: 'Enigma' }), r.idx);
    return { prompt: pz.prompt, rewardPos: [11, 10], sign: true };
  };

  G.PUZ.plates = (c) => {
    const { r, add, L } = c;
    const metric = c.opt.metric || 'mean';
    let vals, target;
    if (metric === 'mean') {
      for (;;) { const a = [G.ri(1, 9), G.ri(1, 9), G.ri(1, 9)]; if (st.sum(a) % 3 === 0 && new Set(a).size === 3) { target = st.sum(a) / 3; vals = a.concat([G.ri(1, 12), G.ri(1, 12)]); break; } }
    } else if (metric === 'range') {
      vals = []; while (vals.length < 5) { const v = G.ri(1, 15); if (!vals.includes(v)) vals.push(v); }
      const s = st.sorted(vals); target = s[3] - s[1]; if (target === 0) target = s[4] - s[0];
    } else {
      vals = []; while (vals.length < 5) { const v = G.ri(1, 12); if (!vals.includes(v)) vals.push(v); }
      target = st.sorted(vals)[2];
    }
    G.shuffle(vals);
    const name = { mean: 'MÉDIA', range: 'AMPLITUDE', median: 'MEDIANA' }[metric];
    const plates = [8, 11, 14].map(lx => add(new G.Plate(...L(lx, 4)), r.idx));
    const blocks = [];
    const bounds = { x: r.px + TS * 2, y: r.py + TS * 2, w: (RWt - 4) * TS, h: (RHt - 4) * TS };
    const check = () => {
      if (c.isSolved()) return;
      const on = plates.map(p => p.blockOn());
      if (on.some(b => !b)) return;
      const v = on.map(b => b.value);
      let res, expl;
      if (metric === 'mean') { res = st.mean(v); expl = '(' + v.join(' + ') + ') ÷ 3 = ' + F(res); }
      else if (metric === 'range') { res = st.range(v); expl = Math.max(...v) + ' - ' + Math.min(...v) + ' = ' + res; }
      else { res = st.median(v); expl = 'ordenando: ' + st.sorted(v).join(', ') + ' → ' + res; }
      if (Math.abs(res - target) < 1e-9) {
        G.ui.toast(name + ': ' + expl + '  ✓', '#7aff8a');
        for (const b of blocks) b.o.locked = true;
        G.recordQuiz(metric === 'mean' ? 'media' : metric === 'range' ? 'amplitude' : 'mediana', true); c.solve();
      } else { G.ui.toast(name + ': ' + expl + ' ≠ ' + target, '#ff8a7a'); G.sfx('wrong'); }
    };
    vals.forEach((v, i) => {
      const [bx, by] = L(5 + i * 3.5, 8);
      const b = add(new G.PushBlock(Math.round(bx / 16) * 16, by, v, { locked: c.solved, onMoved: check }), r.idx);
      b.bounds = bounds; blocks.push(b);
    });
    const prompt = '^yENIGMA DAS PLACAS^0: empurre 3 pedras numeradas para as placas. O tesouro surge quando a ^y' + name + '^0 dos 3 números for ^g' + target + '^0.' + (metric === 'mean' ? ' (média = soma ÷ 3)' : metric === 'range' ? ' (amplitude = maior - menor)' : ' (mediana = valor do meio, em ordem)') + '\nSe travar, golpeie o cristal ↺.';
    add(new G.Sign(...L(3, 2), prompt, { name: 'Enigma das Placas' }), r.idx);
    add(new G.AnswerCrystal(...L(20, 2), '↺', false, () => { if (c.isSolved()) return; for (const b of blocks) b.reset(); G.sfx('teleport'); }, { color: '#c8c8ff' }), r.idx);
    add(new TargetMark(...L(10, 2), name + ' = ' + target), r.idx);
    return { prompt, rewardPos: [11, 10], sign: true };
  };

  function gatePuzzle(kind) {
    if (kind === 'desvio') {
      const m = G.ri(5, 9);
      const A = G.shuffle([m, m + 1, m - 1, m]).slice(0, 4), B = G.shuffle([m - 4, m + 4, m - 3, m + 3]);
      const sets = G.chance(0.5) ? [A, B] : [B, A];
      return { prompt: 'Dois caminhos. Siga pelo portão cujos números têm o ^yMENOR DESVIO PADRÃO^0 (os mais concentrados perto da média).', gates: sets.map((s, i) => ({ lines: ['Portão ' + 'AB'[i], s.join(', ')], ok: s === A })) };
    }
    if (kind === 'normalgate') {
      const ok = G.chance(0.5) ? 0 : 1;
      const L = [['perto da', 'média μ'], ['a mais de', '3σ de μ']];
      return { prompt: 'Numa distribuição normal, onde é MAIS PROVÁVEL encontrar um valor? Escolha o portão certo.', gates: [0, 1].map(i => ({ lines: ok === 0 ? L[i] : L[1 - i], ok: ok === 0 ? i === 0 : i === 1 })) };
    }
    const ok = G.chance(0.5) ? 0 : 1;
    const good = ['60 soldados', 'SORTEADOS'], bad = ['60 da guarda', 'real (altos)'];
    return { prompt: 'Para estimar a ALTURA MÉDIA dos 600 soldados, qual amostra é melhor (sem viés)?', gates: [0, 1].map(i => ({ lines: i === ok ? good : bad, ok: i === ok })) };
  }
  G.PUZ.gates = (c) => {
    const { r, add, L, setL } = c;
    const kind = c.opt.puzzle || 'desvio';
    const entry = r.doors.S ? 'S' : r.doors.E ? 'E' : r.doors.W ? 'W' : 'N';
    const horiz = entry === 'S' || entry === 'N';
    const pz = { gates: [] };
    let gatePos;
    if (horiz) { for (let lx = 1; lx < RWt - 1; lx++) setL(lx, 6, T.WALL); gatePos = [[5, 6, 2, 1], [16, 6, 2, 1]]; }
    else { const cx = entry === 'E' ? 11 : 12; for (let ly = 1; ly < RHt - 1; ly++) setL(cx, ly, T.WALL); gatePos = [[cx, 2, 1, 2], [cx, 9, 1, 2]]; }
    for (const [lx, ly, w, h] of gatePos) for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) setL(lx + i, ly + j, T.FLOOR);
    const far = horiz ? (entry === 'S' ? [11, 3] : [11, 9]) : (entry === 'E' ? [5, 6] : [18, 6]);
    if (c.solved) return { rewardPos: far, visibleReward: true };
    const g = gatePuzzle(kind);
    pz.choose = (gate) => {
      if (c.isSolved()) return;
      if (gate.correct) {
        G.sfx('correct'); for (const gg of pz.gates) { gg.dead = true; G.fx.burst(gg.cx, gg.cy, ['#ffffff', '#c8c8ff'], 12, 60); }
        G.recordQuiz(kind === 'desvio' ? 'desvio' : kind === 'normalgate' ? 'normal' : 'amostra', true); c.solve();
      } else {
        G.recordQuiz(kind === 'desvio' ? 'desvio' : kind === 'normalgate' ? 'normal' : 'amostra', false);
        G.runScript(async () => {
          G.sfx('fall'); const p = G.player; p.state = 'fall'; p.fallT = 0; p.fallKind = 'pit';
          for (let i = 0; i < 20; i++) { p.fallT += 0.03; await G.wait(0.03); }
          const back = { S: [11.5, 10], N: [11.5, 2], E: [21, 6], W: [2, 6] }[entry];
          p.x = r.px + back[0] * TS; p.y = r.py + back[1] * TS; p.state = 'normal'; p.lastSafe = { x: p.x, y: p.y };
          G.hurtPlayer(4, undefined, undefined, { force: true, noKb: true });
          await G.ui.say(null, 'Um alçapão! Caminho errado... Os portões mudaram. Pense com calma!');
          for (const gg of pz.gates) gg.dead = true; pz.gates.length = 0; makeGates(true);
        });
      }
    };
    const makeGates = (live) => {
      const g2 = live ? gatePuzzle(kind) : g;
      gatePos.forEach(([lx, ly, w, h], i) => {
        const [x, y] = L(lx, ly);
        const gate = new Gate(x, y, w * TS, h * TS, g2.gates[i].lines, g2.gates[i].ok, pz, entry);
        gate.room = r.idx;
        if (live) G.addEnt(gate); else add(gate, r.idx);
        pz.gates.push(gate);
      });
    };
    makeGates(false);
    add(new G.Sign(...L(horiz ? 2 : (entry === 'E' ? 20 : 3), horiz ? (entry === 'S' ? 9 : 3) : 10), g.prompt, { name: 'Enigma dos Portões' }), r.idx);
    return { prompt: g.prompt, rewardPos: far, visibleReward: true, sign: true };
  };

  // ------------------------------------------------------------------
  //  Construção
  // ------------------------------------------------------------------
  function build(did) {
    const spec = D[did], [gw, gh] = spec.grid;
    const map = new G.GameMap(did, 'dungeon', gw * RWt, gh * RHt, T.VOID);
    map.theme = spec.theme;
    const rooms = [], byKey = {};
    for (const key in spec.rooms) {
      const r = Object.assign({ key }, spec.rooms[key]);
      r.cx = r.at[0]; r.cy = r.at[1]; r.idx = r.cy * gw + r.cx; r.doors = {};
      r.x0 = r.cx * RWt; r.y0 = r.cy * RHt; r.px = r.x0 * TS; r.py = r.y0 * TS;
      rooms.push(r); byKey[key] = r;
      for (let y = 0; y < RHt; y++) for (let x = 0; x < RWt; x++) {
        const wall = x === 0 || y === 0 || x === RWt - 1 || y === RHt - 1;
        map.tiles[(r.y0 + y) * map.w + r.x0 + x] = wall ? T.WALL : ((x * 7 + y * 3 + r.idx) % 23 === 0 ? T.FLOOR2 : T.FLOOR);
      }
    }
    map.rooms = rooms; map.byKey = byKey; map.spec = spec;
    const ents = [];
    const add = (e, room) => { e.room = room === undefined ? -1 : room; ents.push(e); return e; };
    spec.doors.forEach(([a, b, kind], i) => {
      const A = byKey[a], B = byKey[b];
      let side;
      if (A.cx === B.cx) side = A.cy < B.cy ? ['S', 'N'] : ['N', 'S'];
      else side = A.cx < B.cx ? ['E', 'W'] : ['W', 'E'];
      A.doors[side[0]] = { to: b, kind }; B.doors[side[1]] = { to: a, kind };
      const tiles = [];
      const carve = (R, s) => {
        if (s === 'N' || s === 'S') { const y = R.y0 + (s === 'N' ? 0 : RHt - 1); for (const x of [R.x0 + 11, R.x0 + 12]) tiles.push([x, y]); }
        else { const x = R.x0 + (s === 'W' ? 0 : RWt - 1); for (let y = R.y0 + 5; y <= R.y0 + 7; y++) tiles.push([x, y]); }
      };
      carve(A, side[0]); carve(B, side[1]);
      const fl = kind === 'puzzle' ? did + '_solved_' + a : did + '_door_' + i;
      const tileFor = kind === 'bomb' ? T.CRACKED : kind === 'beam' ? T.BARRIER : T.FLOOR;
      for (const [x, y] of tiles) map.tiles[y * map.w + x] = tileFor;
      if (['locked', 'boss', 'oracle', 'puzzle'].includes(kind) && !G.flag(fl)) {
        const xs = tiles.map(t => t[0]), ys = tiles.map(t => t[1]);
        const x0 = Math.min(...xs), y0 = Math.min(...ys), x1 = Math.max(...xs), y1 = Math.max(...ys);
        add(new Door(x0 * TS, y0 * TS, (x1 - x0 + 1) * TS, (y1 - y0 + 1) * TS, kind, fl, A.cx === B.cx ? 'v' : 'h'));
      }
    });
    for (const r of rooms) buildRoom(map, r, did, add);
    map.applyBroken();
    return { map, ents };
  }

  function roomRect(r) { return { x: r.px + TS, y: r.py + TS, w: (RWt - 2) * TS, h: (RHt - 2) * TS }; }
  function freeSpot(map, r, avoid = []) {
    for (let k = 0; k < 80; k++) {
      const lx = G.ri(3, RWt - 4), ly = G.ri(3, RHt - 4);
      const tx = r.x0 + lx, ty = r.y0 + ly;
      const t = map.get(tx, ty);
      if (t !== T.FLOOR && t !== T.FLOOR2 && t !== T.ICE && t !== T.CARPET) continue;
      if (avoid.some(([ax, ay]) => Math.abs(ax - lx) + Math.abs(ay - ly) < 3)) continue;
      return [tx * TS + 2, ty * TS + 4];
    }
    return [(r.x0 + 12) * TS, (r.y0 + 6) * TS];
  }

  // características de layout (deixam as salas diferentes entre si)
  function applyFeature(r, feat, setL, add, L) {
    const lava = T.LAVA;
    switch (feat) {
      case 'pillars': for (const [lx, ly] of [[5, 3], [18, 3], [5, 9], [18, 9]]) setL(lx, ly, T.PILLAR); break;
      case 'pillars6': for (const [lx, ly] of [[4, 3], [11, 3], [19, 3], [4, 9], [12, 9], [19, 9]]) setL(lx, ly, T.PILLAR); break;
      case 'pitband': for (let lx = 1; lx < RWt - 1; lx++) for (const ly of [8, 9]) setL(lx, ly, T.PIT); break;
      case 'pitN': for (let lx = 1; lx < RWt - 1; lx++) setL(lx, 2, T.PIT); break;
      case 'pits': for (const [lx, ly] of [[5, 4], [6, 4], [5, 5], [6, 5], [17, 7], [18, 7], [17, 8], [18, 8], [11, 9], [12, 9]]) setL(lx, ly, T.PIT); break;
      case 'barrierN': for (let lx = 1; lx < RWt - 1; lx++) setL(lx, 2, T.BARRIER); break;
      case 'lavaband': for (let lx = 1; lx < RWt - 1; lx++) for (let ly = 4; ly <= 9; ly++) setL(lx, ly, lava); break;
      case 'lavapools': for (const [lx, ly] of [[4, 3], [5, 3], [4, 4], [5, 4], [18, 8], [19, 8], [18, 9], [19, 9], [17, 3], [18, 3]]) setL(lx, ly, lava); break;
      case 'lavatop': for (let lx = 1; lx < RWt - 1; lx++) for (let ly = 1; ly <= 4; ly++) setL(lx, ly, lava); break;
      case 'ice': for (let ly = 2; ly < RHt - 2; ly++) for (let lx = 2; lx < RWt - 2; lx++) setL(lx, ly, T.ICE); break;
      case 'carpet': for (let ly = 1; ly < RHt - 1; ly++) for (let lx = 10; lx <= 13; lx++) setL(lx, ly, T.CARPET); break;
      case 'pots': for (const [lx, ly] of [[2, 2], [3, 2], [21, 2], [20, 2], [2, 10], [21, 10]]) add(new G.Pot(...L(lx, ly)), r.idx); break;
    }
  }

  // placa "Enigma" ao lado da porta de entrada, no primeiro ponto de chão livre
  function puzzleSign(r, text, add, L, getL) {
    const d = r.doors, cands = d.S ? [[14, 10], [9, 10], [15, 9], [8, 9]] : d.E ? [[21, 4], [21, 8], [20, 3], [20, 9]] : d.W ? [[2, 4], [2, 8], [3, 3], [3, 9]] : [[14, 2], [9, 2], [15, 3], [8, 3]];
    for (const [lx, ly] of cands) { const t = getL(lx, ly); if (t === T.FLOOR || t === T.FLOOR2 || t === T.CARPET) { add(new G.Sign(...L(lx, ly), text, { name: 'Enigma' }), r.idx); return; } }
  }
  function buildRoom(map, r, did, add) {
    const spec = D[did], ox = r.px, oy = r.py, L = (lx, ly) => [ox + lx * TS, oy + ly * TS];
    const setL = (lx, ly, t) => { const tx = r.x0 + lx, ty = r.y0 + ly; if (G.map === map) map.set(tx, ty, t); else map.tiles[ty * map.w + tx] = t; };
    const getL = (lx, ly) => map.get(r.x0 + lx, r.y0 + ly);
    for (const f of String(r.feat || '').split(',')) if (f) applyFeature(r, f, setL, add, L);
    r.dark = !!r.dark;
    const flagBase = did + '_';
    const solvedKey = flagBase + 'solved_' + r.key;
    if (!r.noTorch) for (const lx of [5, 18]) add(new G.Torch(ox + lx * TS, oy + 3, { room: r.idx, lit: !r.dark }), r.idx);
    if (r.lesson && r.type !== 'start') add(new G.Tablet(...L(r.lessonAt ? r.lessonAt[0] : 2, r.lessonAt ? r.lessonAt[1] : 10), r.lesson, { name: 'Tábua de ' + G.LESSONS[r.lesson].title }), r.idx);
    const ctx = {
      map, r, did, add, L, setL, getL, opt: r.opt || {}, spec,
      solved: G.flag(solvedKey),
      isSolved: () => G.flag(solvedKey),
      solve: () => solvePuzzle(r),
      lock: () => DUN.lock(r), unlock: () => DUN.unlock(r),
      addLive: (e) => { e.room = r.idx; return G.addEnt(e); }
    };
    switch (r.type) {
      case 'start': {
        const north = r.exit === 'N';
        if (north) {
          setL(11, 0, T.STAIRS); setL(12, 0, T.STAIRS);
          add(new G.Trigger(ox + 11 * TS, oy - 2, 32, 8, () => G.exitDungeon(), { room: r.idx }), r.idx);
        } else {
          setL(11, RHt - 1, T.STAIRS); setL(12, RHt - 1, T.STAIRS);
          add(new G.Trigger(ox + 11 * TS, oy + (RHt - 1) * TS + 6, 32, 10, () => G.exitDungeon(), { room: r.idx }), r.idx);
          for (const [lx, ly] of [[2, 1], [21, 1]]) setL(lx, ly, T.PILLAR);
        }
        add(new G.Tablet(...L(4, north ? 8 : 4), r.lesson, { name: 'Tábua de ' + G.LESSONS[r.lesson].title }), r.idx);
        add(new G.SavePad(...L(17, north ? 4 : 8), did), r.idx);
        add(new G.Brazier(...L(9, north ? 3 : 9), { lit: true }), r.idx); add(new G.Brazier(...L(14, north ? 3 : 9), { lit: true }), r.idx);
        break;
      }
      case 'combat': r.lockdown = true; break;
      case 'bigkey': {
        r.lockdown = true;
        add(new G.Chest(...L(11, 3), flagBase + 'bigkey', { type: 'bossKey' }), r.idx);
        for (const [lx, ly] of [[9, 2], [14, 2]]) setL(lx, ly, T.PILLAR);
        break;
      }
      case 'item': {
        // santuário: altar no centro, tapetes até as portas, círculo rúnico, guardiões
        r.shrine = true;
        const acx = ox + 12 * TS, aby = oy + 6 * TS + 6;
        const ds = Object.keys(r.doors);
        if (ds.includes('N')) for (let ly = 1; ly <= 4; ly++) for (const lx of [11, 12]) setL(lx, ly, T.CARPET);
        if (ds.includes('S')) for (let ly = 8; ly <= 11; ly++) for (const lx of [11, 12]) setL(lx, ly, T.CARPET);
        if (ds.includes('W')) for (let lx = 1; lx <= 8; lx++) for (const ly of [6, 7]) setL(lx, ly, T.CARPET);
        if (ds.includes('E')) for (let lx = 15; lx <= 22; lx++) for (const ly of [6, 7]) setL(lx, ly, T.CARPET);
        for (const [lx, ly] of [[3, 2], [20, 2], [3, 10], [20, 10]]) setL(lx, ly, T.PILLAR);
        const altar = new Altar(acx, aby, flagBase + 'item', r.item);
        add(new RuneCircle(acx, aby - 2, altar), r.idx);
        add(altar, r.idx);
        add(new GuardStatue(...L(8, 3)), r.idx); add(new GuardStatue(...L(15, 3), true), r.idx);
        for (const [lx, ly] of [[7, 8], [16, 8]]) add(new G.Brazier(...L(lx, ly), { lit: true }), r.idx);
        const crys = { d1: '#3aa86a', d2: '#3a8a3a', d3: '#c08a3a', d4: '#c03a2a', d5: '#3a7ac8', d6: '#7a3ac0' }[did] || '#7a3ac0';
        for (const lx of [7, 16]) add(new Banner(ox + lx * TS + 1, oy + 2, crys, 'Σ'), r.idx);
        break;
      }
      case 'bonus': {
        (r.qb || []).forEach((c, i) => add(new G.QBlock(...L(8 + i * 2, 3), flagBase + 'q_' + r.key + i, c), r.idx));
        if (r.oracle) add(new G.Oracle(...L(11, 7), flagBase + 'oracle_' + r.key, { topic: spec.topic, lv: 2, onWin: async () => { await G.ui.say('Pedra Oráculo', 'Sábia resposta! Tome este tesouro.'); await G.give('heartPiece'); } }), r.idx);
        break;
      }
      case 'secret': case 'hub': break;
      case 'boss': r.lockdown = false; r.isBoss = true; break;
      default: {
        const P = G.PUZ[r.type];
        if (P) {
          const pz = P(ctx) || {};
          r.puz = pz; r.prompt = pz.prompt;
          if (pz.noAutoEnemies) r.noAutoEnemies = true;
          // placa para reler o enigma a qualquer hora (a explicação também aparece ao entrar)
          if (pz.prompt && !pz.sign) puzzleSign(r, pz.prompt, add, L, getL);
        }
      }
    }
    // recompensa: escondida até resolver (ou visível do outro lado dos portões)
    if (r.reward && r.reward.chest) {
      if (r.type === 'secret') add(new G.Chest(...L(11, 6), flagBase + 'chest_' + r.key, r.reward.chest), r.idx);
      else {
        const rp = (r.puz && r.puz.rewardPos) || [11, 10];
        add(new G.Chest(...L(rp[0], rp[1]), flagBase + 'chest_' + r.key, r.reward.chest, { hidden: !(r.puz && r.puz.visibleReward) }), r.idx);
      }
    }
    if (r.clearReward) r.clearChest = add(new G.Chest(...L(11, 6), flagBase + 'chest_' + r.key, r.clearReward, { hidden: true }), r.idx);
  }

  function solvePuzzle(room) {
    const did = G.map.id;
    if (G.flag(did + '_solved_' + room.key)) return;
    G.setFlag(did + '_solved_' + room.key);
    G.sfx('secret'); G.addXP(14);
    G.flash('#ffffff', 0.3, 0.3);
    G.fx.text(room.px + 12 * TS, room.py + 5 * TS, 'ENIGMA RESOLVIDO!', '#7aff8a', true);
    for (const e of G.ents) if (e.room === room.idx && e instanceof G.Chest && e.hidden) e.reveal();
    if (Object.values(room.doors).some(d => d.kind === 'puzzle')) G.ui.toast('As runas se apagaram: uma porta se abriu!', '#7aff8a');
  }

  // ------------------------------------------------------------------
  //  Execução (entrar em salas, travas, chefes)
  // ------------------------------------------------------------------
  const DUN = G.dun = {
    build,
    load(did) {
      const { map, ents } = build(did);
      G.map = map; G.ents = []; G.fx.clear(); G.spawners = []; G.boss = null; G.trans = null;
      if (G.resetAmbient) G.resetAmbient();
      for (const e of ents) if (!G.ents.includes(e)) G.ents.push(e);
      const S = map.byKey.S;
      const p = G.player = new G.Player(S.px + 11.5 * TS - 5, S.py + (S.exit === 'N' ? 2 : 10) * TS);
      p.dir = S.exit === 'N' ? 0 : 1;
      G.addEnt(p);
      G.curRoom = -2;
      this.enterRoom(S.idx, true);
      G.music(map.spec.music);
      G.ui.regionBanner(map.spec.name, (G.P.flags['boss_' + did] ? 'conquistado' : 'masmorra'));
    },
    roomAt(px, py) {
      const m = G.map; const cx = Math.floor(px / RPW), cy = Math.floor(py / RPH);
      return m.rooms.find(r => r.cx === cx && r.cy === cy);
    },
    camFor(r) { return { x: r.px, y: r.py - 8 }; },
    enterRoom(idx, instant) {
      const m = G.map, r = m.rooms.find(rr => rr.idx === idx);
      if (!r) return;
      const prev = m.rooms.find(rr => rr.idx === G.curRoom);
      if (prev && prev !== r && prev.puz && prev.puz.leave) prev.puz.leave();
      G.curRoom = idx;
      const did = m.id, P = G.P;
      const seen = P.dunSeen[did] = P.dunSeen[did] || [];
      if (!seen.includes(r.key)) seen.push(r.key);
      for (const e of G.ents) if ((e.isEnemy && e.room !== idx && !e.isBoss) || e instanceof G.EShot || e instanceof G.Shot || e instanceof G.Bomb || e instanceof G.Thrown) e.dead = true;
      for (const e of G.ents) if (e instanceof Shutter) e.dead = true;
      if (instant) { const c = this.camFor(r); G.cam.x = c.x; G.cam.y = c.y; }
      const clearedKey = did + '_cleared_' + r.key;
      if (r.enemies && !G.flag(clearedKey) && !r.noAutoEnemies) {
        for (const [type, n, o] of r.enemies) for (let i = 0; i < n; i++) {
          const [x, y] = freeSpot(m, r, [[11, 11], [11, 1], [1, 6], [22, 6]]);
          G.addEnt(G.makeEnemy(type, x, y, Object.assign({ room: idx }, o || {})));
        }
        r.live = true;
        if (r.lockdown) this.lock(r);
      }
      r.shutters = r.shutters && r.shutters.filter(s => !s.dead).length ? r.shutters : null;
      if (r.puz && r.puz.enter) r.puz.enter();
      if (r.isBoss) this.bossRoom(r);
      if (r.prompt && !G.flag(did + '_solved_' + r.key) && !G.flag(did + '_read_' + r.key)) {
        G.setFlag(did + '_read_' + r.key);
        G.runScript(() => G.ui.say('Enigma', r.prompt));
      }
      if (r.type === 'start' && !G.flag(did + '_entered')) {
        G.setFlag(did + '_entered');
        G.runScript(async () => { await G.wait(0.4); await G.ui.say(null, 'Bem-{vindo|vinda} ao ^y' + m.spec.name + '^0. Leia a ^cTábua^0 para aprender a lição deste lugar!'); });
      }
    },
    lock(r) {
      if (r.shutters && r.shutters.length) return;
      const sh = [];
      for (const s in r.doors) {
        const d = r.doors[s];
        if (d.kind === 'boss' && !r.isBoss) continue;
        let rect;
        if (s === 'N') rect = [r.px + 11 * TS, r.py, 32, 16];
        else if (s === 'S') rect = [r.px + 11 * TS, r.py + (RHt - 1) * TS, 32, 16];
        else if (s === 'W') rect = [r.px, r.py + 5 * TS, 16, 48];
        else rect = [r.px + (RWt - 1) * TS, r.py + 5 * TS, 16, 48];
        sh.push(G.addEnt(new Shutter(rect[0], rect[1], rect[2], rect[3], r.idx)));
      }
      if (sh.length) G.sfx('shut');
      r.shutters = sh;
    },
    unlock(r) { if (r.shutters) { for (const s of r.shutters) s.opening = true; r.shutters = null; G.sfx('door'); } },
    bossRoom(r) {
      const did = G.map.id;
      if (EMBLEMA[did]) G.addEnt(new ArenaEmblem(r.px + 12 * TS, r.py + 7 * TS, did)).room = r.idx;
      if (G.P.flags['boss_' + did]) {
        if (!G.flag(did + '_hc') && did !== 'd6') { const hc = G.addEnt(new G.Pickup(r.px + 7 * TS, r.py + 7 * TS, 'heartContainer', 1, { persist: true, flag: did + '_hc' })); hc.room = r.idx; }
        if (!G.P.flags[did + '_crystalGot']) G.addEnt(new CrystalDrop(r.px + 12 * TS, r.py + 6 * TS, G.map.spec.crystal));
        else G.addEnt(new Portal(r.px + 12 * TS, r.py + 7 * TS));
        return;
      }
      const arena = roomRect(r);
      let bx = r.px + 12 * TS - 14, by = r.py + 4 * TS;
      if (did === 'd4') by = r.py + 2 * TS;
      const boss = G.makeBoss(did, bx, by, arena);
      boss.room = r.idx;
      G.addEnt(boss);
      G.boss = boss;
      this.lock(r);
      G.runScript(async () => {
        G.music(null);
        G.sfx('roar');
        G.ui.bossCard(boss.name, did === 'd6' ? 'SENHOR DAS DISTORÇÕES' : 'GUARDIÃO · ' + G.map.spec.name.toUpperCase());
        await G.wait(1.6);
        G.music(did === 'd6' ? 'vies' : G.bossMusic(boss));
        if (did === 'd6' && G.viesBossIntro) await G.viesBossIntro(boss);
        else if (did === 'd6') {
          await G.ui.say('Viés', 'Então você é {o pequeno estatístico|a pequena estatística} que anda recuperando meus cristais... Os números mentem, {garoto|garota}! Basta escolher QUAIS números mostrar!', { portrait: 'viesNPC_down0' });
          await G.ui.say('Viés', 'Vou distorcer sua visão como distorci o reino inteiro!', { portrait: 'viesNPC_down0' });
          G.music('boss');
        }
      });
    },
    update(dt) {
      const m = G.map; if (m.kind !== 'dungeon') return;
      const p = G.player; if (!p) return;
      if (!G.trans && p.state !== 'fall') {
        const r = this.roomAt(p.cx, p.cy);
        if (r && r.idx !== G.curRoom) {
          const from = m.rooms.find(rr => rr.idx === G.curRoom);
          const c0 = { x: G.cam.x, y: G.cam.y }, c1 = this.camFor(r);
          const dx = Math.sign(r.cx - from.cx), dy = Math.sign(r.cy - from.cy);
          G.trans = { t: 0, dur: 0.55, c0, c1, r, dx, dy, px0: p.x, py0: p.y };
          G.sfx('door');
        }
      }
      const cur = m.rooms.find(rr => rr.idx === G.curRoom);
      if (cur && cur.puz && cur.puz.update) cur.puz.update(dt);
      if (cur && cur.live) {
        const alive = G.ents.some(e => e.isEnemy && !e.dead && e.room === cur.idx && !e.isBoss && !e.tallyMob && !(e.constructor && e.constructor.name === 'ViesClone'));
        if (!alive) {
          cur.live = false;
          G.setFlag(m.id + '_cleared_' + cur.key);
          if (cur.shutters) this.unlock(cur);
          if (cur.clearChest && cur.clearChest.hidden) cur.clearChest.reveal();
          G.sfx('secret');
          if (cur.type === 'combat' || cur.type === 'bigkey' || cur.type === 'hub') G.fx.text(cur.px + 12 * TS, cur.py + 5 * TS, 'SALA LIMPA!', '#7aff8a', true);
        }
      }
    },
    updateTrans(dt) {
      const tr = G.trans, p = G.player;
      tr.t += dt;
      const k = Math.min(1, tr.t / tr.dur), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      G.cam.x = G.lerp(tr.c0.x, tr.c1.x, e); G.cam.y = G.lerp(tr.c0.y, tr.c1.y, e);
      p.x = tr.px0 + tr.dx * 26 * k; p.y = tr.py0 + tr.dy * 26 * k;
      p.walkT += dt; p.moving = true;
      if (k >= 1) { G.trans = null; p.lastSafe = { x: p.x, y: p.y }; this.enterRoom(tr.r.idx); }
    },
    drawMap(ctx, x, y, w, h) {
      const m = G.map, did = m.id, P = G.P, seen = P.dunSeen[did] || [];
      G.text('MAPA · ' + m.spec.name.toUpperCase(), x + w / 2, y, '#ffe27a', { align: 'center' });
      const [gw, gh] = m.spec.grid;
      const cw = Math.min(48, Math.floor((w - 20) / gw)), ch = Math.min(28, Math.floor((h - 46) / gh));
      const ox = Math.round(x + w / 2 - gw * cw / 2), oy = y + 13;
      for (const r of m.rooms) {
        const vis = seen.includes(r.key);
        const known = vis || Object.values(r.doors).some(d => seen.includes(d.to));
        if (!known) continue;
        const rx = ox + r.cx * cw, ry = oy + r.cy * ch;
        const cur = r.idx === G.curRoom;
        G.panel(ctx, rx + 2, ry + 2, cw - 4, ch - 4, { r: 3, thin: true, corners: false, border: cur ? '#ff9ae6' : vis ? '#7ae4ff' : '#4a4a7a', bgTop: vis ? (cur ? '#7a3a8a' : '#2a4a9a') : '#1e1e3a', bg: vis ? (cur ? '#4a1a5a' : '#142a5a') : '#14142a' });
        for (const s in r.doors) {
          const d = r.doors[s];
          ctx.fillStyle = d.kind === 'locked' ? '#ffd23a' : d.kind === 'boss' ? '#c060ff' : d.kind === 'puzzle' ? '#ff9ae6' : d.kind === 'bomb' ? '#c8a080' : d.kind === 'beam' ? '#7ae4ff' : '#9ad8ff';
          if (s === 'N') ctx.fillRect(rx + cw / 2 - 3, ry, 6, 3);
          if (s === 'S') ctx.fillRect(rx + cw / 2 - 3, ry + ch - 3, 6, 3);
          if (s === 'W') ctx.fillRect(rx, ry + ch / 2 - 3, 3, 6);
          if (s === 'E') ctx.fillRect(rx + cw - 3, ry + ch / 2 - 3, 3, 6);
        }
        if (vis) {
          let icon = '';
          if (r.type === 'boss') icon = P.flags['boss_' + did] ? '★' : '!';
          else if (r.type === 'item') icon = G.flag(did + '_item') ? '' : '?';
          else if (r.type === 'start') icon = 'E';
          else if (r.type === 'bigkey' || (r.reward && r.reward.chest && r.reward.chest.type === 'bossKey' && !P.bossKey[did])) icon = P.bossKey[did] ? '' : 'K';
          else if (G.PUZ[r.type]) icon = G.flag(did + '_solved_' + r.key) ? '✓' : '◆';
          if (icon) G.text(icon, rx + cw / 2, ry + ch / 2 - 3, icon === '✓' ? '#7aff8a' : '#ffffff', { align: 'center' });
        }
        if (cur && Math.floor(G.time * 4) % 2 === 0) { ctx.fillStyle = '#ff5a8a'; ctx.beginPath(); ctx.arc(rx + cw - 7, ry + 7, 2, 0, Math.PI * 2); ctx.fill(); }
      }
      const by = oy + gh * ch + 5;
      G.text('Chaves: ' + (P.keys[did] || 0) + '   Chave do Guardião: ' + (P.bossKey[did] ? 'SIM' : 'não'), x + w / 2, by, '#ffffff', { align: 'center' });
      G.text('E entrada · ◆ enigma · ✓ resolvido · ? tesouro · K guardião · ! chefe', x + w / 2, by + 11, '#9a98b0', { align: 'center' });
    }
  };

  // derrota do chefe
  G.onBossDefeated = async (boss) => {
    const did = G.map.id, r = G.map.rooms.find(rr => rr.idx === boss.room);
    G.setFlag('boss_' + did);
    G.boss = null;
    for (const e of G.ents) if (e.isEnemy && e.room === boss.room) e.dead = true;
    for (const e of G.ents) if (e instanceof G.EShot) e.dead = true;
    if (did === 'd6') { await G.finalVictory(); return; }
    G.sfx('fanfare');
    await G.wait(1);
    const hc = G.addEnt(new G.Pickup(r.px + 7 * TS, r.py + 7 * TS, 'heartContainer', 1, { persist: true, flag: did + '_hc' })); hc.room = r.idx;
    G.addEnt(new CrystalDrop(r.px + 12 * TS, r.py + 6 * TS, G.map.spec.crystal));
    DUN.unlock(r);
    G.music('village');
  };
  G.afterCrystal = async (cd) => {
    const did = G.map.id;
    G.setFlag(did + '_crystalGot');
    G.addXP(40);
    const msgs = {
      d1: ['A ^gMédia^0 voltou ao reino! Os mercadores já conseguem calcular preços justos.', 'Com as ^yBotas de Salto^0, o riacho a oeste da vila não é mais obstáculo. O ^gBosque Sombrio^0 espera!'],
      d2: ['A ^cMediana^0 e a ^cModa^0 retornaram. As pessoas param de se enganar com valores extremos.', 'As ^yBombas^0 podem abrir as rochas rachadas que bloqueiam o ^yDeserto^0, ao sul e a leste.'],
      d3: ['O equilíbrio da ^yDispersão^0 voltou: agora sabemos o quanto os dados variam!', 'O ^cRaio Amostral^0 quebra barreiras de cristal: o ^rVulcão^0 (norte do lago) e o ^pPlanalto^0 (norte da vila) estão abertos.'],
      d4: ['A ^rProbabilidade^0 foi restaurada! As chances voltam a fazer sentido.', 'Com o ^oTraje Térmico^0, você resiste ao frio dos ^cPicos Gaussianos^0 (norte do Bosque) e pode atravessar a ^rcrosta de magma^0 sem se queimar!'],
      d5: ['As ^bDistribuições^0 voltaram! O sino de Gauss ressoa por todo o reino.', 'Agora você tem 5 cristais. O selo do ^pCastelo do Viés^0 (norte da vila) vai se romper!']
    }[did];
    if (msgs) for (const m of msgs) await G.ui.say('Mestre Gauss (em pensamento)', m, { portrait: 'gauss_down0' });
    const r = G.map.rooms.find(rr => rr.idx === G.curRoom);
    G.addEnt(new Portal(r.px + 12 * TS, r.py + 9 * TS));
    G.ui.toast('Um portal surgiu! Entre nele para sair.', '#7ae4ff');
    G.saveGame();
  };
  G.dunClasses = { Door, Shutter, Portal, CrystalDrop, Mural, Gate };
})(window.G);
