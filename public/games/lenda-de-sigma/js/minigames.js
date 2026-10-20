'use strict';
// =====================================================================
//  Minijogos: Desafio de Bernoulli (Lei dos Grandes Números),
//  Dados de Pascal (valor esperado), Tabuleiro de Galton (normal),
//  Pesca Amostral (estimativa por amostragem).
// =====================================================================
(function (G) {
  const I = G.input, W = G.W, H = G.H;
  const frame = (ctx, title) => {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0e0a24'); g.addColorStop(1, '#1c0e32');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(122,160,255,0.05)'; for (let x = 0; x < W; x += 8) ctx.fillRect(x, 0, 0.5, H); for (let y = 0; y < H; y += 8) ctx.fillRect(0, y, W, 0.5);
    G.panel(ctx, 4, 4, W - 8, H - 8, { r: 5 });
    G.headerBar(ctx, 8, 8, W - 16, 13, '#4a3a9a');
    G.text(title, 14, 11, '#ffe27a', { outline: '#1a0a30' });
    G.draw(ctx, 'iconCoin', W - 56, 11); G.text(String(G.P.coins), W - 44, 11, '#ffd84a');
  };
  // fundo de gráfico com grade
  const plot = (ctx, x, y, w, h) => {
    ctx.save(); ctx.fillStyle = '#070612'; G.rrPath(ctx, x - 1, y - 1, w + 2, h + 2, 3); ctx.fill();
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#16143c'); g.addColorStop(1, '#0a0a1e'); ctx.fillStyle = g; G.rrPath(ctx, x, y, w, h, 2.5); ctx.fill();
    ctx.strokeStyle = 'rgba(122,160,255,0.09)'; ctx.lineWidth = 0.5;
    for (let i = 1; i < 10; i++) { ctx.beginPath(); ctx.moveTo(x + w * i / 10, y); ctx.lineTo(x + w * i / 10, y + h); ctx.stroke(); }
    for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x, y + h * i / 4); ctx.lineTo(x + w, y + h * i / 4); ctx.stroke(); }
    ctx.restore();
  };
  const menuList = (ctx, items, sel, x, y, w, t, lh = 10) => items.forEach((l, i) => {
    const yy = y + i * lh;
    if (i === sel) { G.selBar(ctx, x, yy - 1.5, w, lh, t); G.draw(ctx, 'cursor', x + 3 + Math.sin(t * 8) * 0.6, yy - 0.5); }
    G.text(l, x + 14, yy, i === sel ? '#ffe27a' : '#e8e4f4');
  });
  // barra com volume (gradiente, contorno e brilho)
  const niceBar = (ctx, x, y, w, h, c, glow) => {
    if (h <= 0.2) return;
    ctx.save();
    const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, G.col.shade(c, 0.35)); g.addColorStop(0.5, c); g.addColorStop(1, G.col.shade(c, -0.3));
    ctx.fillStyle = '#0a0614'; G.rrPath(ctx, x - 0.5, y - 0.5, w + 1, h + 1, Math.min(2, w / 2)); ctx.fill();
    ctx.fillStyle = g; G.rrPath(ctx, x, y, w, h, Math.min(1.8, w / 2)); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(x + 1, y + 0.5, Math.max(0, w - 2), 0.5);
    if (glow) { ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, x + w / 2, y, w * 1.2, c, 0.55); }
    ctx.restore();
  };
  // moeda grande (cara/coroa) vista de frente, achatada em sx durante o giro
  function bigCoin(ctx, cx, cy, r, sx, heads) {
    const rx = Math.max(1, r * sx);
    ctx.save();
    ctx.fillStyle = '#4a2a08'; ctx.beginPath(); ctx.ellipse(cx, cy, rx + 1, r + 1, 0, 0, Math.PI * 2); ctx.fill();
    const g = ctx.createRadialGradient(cx - rx * 0.35, cy - r * 0.4, 1, cx, cy, r * 1.1); g.addColorStop(0, '#fff6c0'); g.addColorStop(0.5, heads ? '#f0c040' : '#d8d8e8'); g.addColorStop(1, heads ? '#b87818' : '#8a8aa8');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy, rx, r, 0, 0, Math.PI * 2); ctx.fill();
    if (sx > 0.4) {
      ctx.strokeStyle = heads ? 'rgba(122,74,16,0.7)' : 'rgba(80,80,110,0.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(cx, cy, rx * 0.8, r * 0.8, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.translate(cx, cy); ctx.scale(sx, 1);
      ctx.fillStyle = heads ? '#7a4a10' : '#4a4a6a';
      if (heads) { ctx.fillRect(-7, -6, 3, 4); ctx.fillRect(4, -6, 3, 4); ctx.lineWidth = 1.6; ctx.strokeStyle = '#7a4a10'; ctx.beginPath(); ctx.arc(0, 0, 8, 0.3, Math.PI - 0.3); ctx.stroke(); }
      else { ctx.beginPath(); ctx.moveTo(-9, 6); ctx.lineTo(-9, -4); ctx.lineTo(-4.5, 1); ctx.lineTo(0, -8); ctx.lineTo(4.5, 1); ctx.lineTo(9, -4); ctx.lineTo(9, 6); ctx.closePath(); ctx.fill(); }
    }
    ctx.restore();
  }
  function dieFace(ctx, x, y, n, s = 24, col = '#c03a3a') {
    const pips = { 1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [2, 0], [0, 2], [2, 2]], 5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]] }[n];
    ctx.save();
    ctx.fillStyle = '#1b1428'; G.rrPath(ctx, x - 1, y - 1, s + 2, s + 2, s * 0.22); ctx.fill();
    const g = ctx.createLinearGradient(x, y, x + s, y + s); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#c8c0dc');
    ctx.fillStyle = g; G.rrPath(ctx, x, y, s, s, s * 0.2); ctx.fill();
    ctx.fillStyle = 'rgba(120,100,160,0.35)'; G.rrPath(ctx, x + 1, y + s * 0.8, s - 2, s * 0.18, s * 0.08); ctx.fill();
    const pr = Math.max(1.1, s / 10);
    for (const [a, b] of pips) {
      const px = x + s * 0.25 + a * s * 0.25, py = y + s * 0.25 + b * s * 0.25;
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.arc(px - pr * 0.3, py - pr * 0.3, pr * 0.35, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
  G.dieFace = dieFace;

  // ------------------------------------------------------------------
  //  BERNOULLI
  // ------------------------------------------------------------------
  class LLN {
    constructor(res) { this.res = res; this.st = 'choose'; this.i = 0; this.t = 0; this.msg = ''; }
    opts() { return [['10 lançamentos', 10, 30], ['100 lançamentos', 100, 13], ['1000 lançamentos', 1000, 11], ['Sair', 0, 0]]; }
    update(dt) {
      this.t += dt;
      if (this.st === 'choose') {
        const o = this.opts();
        if (I.pressed('up')) { this.i = (this.i + 3) % 4; G.sfx('select'); }
        if (I.pressed('down')) { this.i = (this.i + 1) % 4; G.sfx('select'); }
        if (I.pressed('cancel') || (I.pressed('confirm') && this.i === 3)) { this.done = true; this.res(); return; }
        if (I.pressed('confirm')) {
          if (G.P.coins < 10) { G.sfx('wrong'); this.msg = 'Você precisa de 10 moedas para apostar!'; return; }
          G.P.coins -= 10; G.sfx('coin');
          const [, n, pay] = o[this.i];
          this.n = n; this.pay = pay; this.flips = []; this.heads = 0; this.props = []; this.st = 'flip'; this.acc = 0;
          this.rate = n / (n === 10 ? 2.2 : n === 100 ? 2.4 : 2.8);
        }
      } else if (this.st === 'flip') {
        this.acc += dt * this.rate;
        while (this.acc >= 1 && this.flips.length < this.n) {
          this.acc -= 1;
          const h = Math.random() < 0.5; this.flips.push(h); if (h) this.heads++;
          this.props.push(this.heads / this.flips.length);
          if (this.n === 10 || this.flips.length % 25 === 0) G.sfx('flip');
        }
        if (this.flips.length >= this.n) {
          const p = this.heads / this.n;
          this.win = p >= 0.45 && p <= 0.55;
          this.st = 'result'; this.t = 0;
          if (this.win) { G.give('coin', this.pay); G.sfx('correct'); } else G.sfx('wrong');
          if (this.win && this.n === 1000 && !G.P.flags.llnHP) this.hp = true;
        }
      } else if (this.st === 'result') {
        if (this.t > 0.5 && (I.pressed('confirm') || I.pressed('cancel'))) {
          if (this.hp) { this.hp = false; G.P.flags.llnHP = true; this.done = true; G.runScript(async () => { await G.ui.say('Estátua de Bernoulli', 'Você comprovou a Lei dos Grandes Números! Com 1000 lançamentos o resultado fica muito previsível. Receba minha recompensa!'); await G.give('heartPiece'); }); this.res(); return; }
          this.st = 'choose'; this.msg = '';
        }
      }
    }
    draw(ctx) {
      frame(ctx, 'DESAFIO DE BERNOULLI · Lei dos Grandes Números');
      // gráfico
      const gx = 150, gy = 30, gw = 220, gh = 120;
      plot(ctx, gx, gy, gw, gh);
      const py = v => gy + gh - v * gh;
      ctx.save(); const bg = ctx.createLinearGradient(0, py(0.55), 0, py(0.45)); bg.addColorStop(0, 'rgba(122,255,138,0.08)'); bg.addColorStop(0.5, 'rgba(122,255,138,0.28)'); bg.addColorStop(1, 'rgba(122,255,138,0.08)');
      ctx.fillStyle = bg; ctx.fillRect(gx + 1, py(0.55), gw - 2, py(0.45) - py(0.55)); ctx.restore();
      ctx.fillStyle = 'rgba(122,255,138,0.6)'; ctx.fillRect(gx + 1, py(0.5), gw - 2, 0.5);
      G.text('100%', gx - 3, gy - 2, '#9a98b0', { align: 'right', shadow: false }); G.text('50%', gx - 3, py(0.5) - 3, '#7aff8a', { align: 'right', shadow: false }); G.text('0%', gx - 3, gy + gh - 7, '#9a98b0', { align: 'right', shadow: false });
      G.text('faixa vencedora: 45% a 55%', gx + gw / 2, gy + gh + 4, '#7aff8a', { align: 'center', shadow: false });
      if (this.props && this.props.length) {
        const n = this.n, pts = [];
        const step = Math.max(1, Math.floor(this.props.length / 400));
        for (let i = 0; i < this.props.length; i += step) pts.push([gx + 1 + (i + 1) / n * (gw - 3), py(this.props[i])]);
        const last = pts[pts.length - 1];
        ctx.save();
        const ag = ctx.createLinearGradient(0, gy, 0, gy + gh); ag.addColorStop(0, 'rgba(255,216,74,0.25)'); ag.addColorStop(1, 'rgba(255,216,74,0)');
        ctx.fillStyle = ag; ctx.beginPath(); ctx.moveTo(pts[0][0], gy + gh); for (const [x, y] of pts) ctx.lineTo(x, y); ctx.lineTo(last[0], gy + gh); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 1; ctx.lineJoin = 'round'; ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
        ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, last[0], last[1], 6, '#ffd84a', 0.9);
        ctx.restore();
      }
      // moeda
      const cx = 70, cy = 66;
      const spin = this.st === 'flip' ? Math.cos(this.t * 25) : 1;
      const last = this.flips && this.flips.length ? this.flips[this.flips.length - 1] : true;
      G.shadow(ctx, cx, cy + 32, 22, 0.35);
      bigCoin(ctx, cx, cy - (this.st === 'flip' ? Math.abs(Math.sin(this.t * 12.5)) * 6 : 0), 24, Math.abs(spin), spin >= 0 ? last : !last);
      const showH = spin >= 0 ? last : !last;
      G.text('CARA', cx - 20, 100, showH ? '#ffd84a' : '#6a6890', { align: 'center' }); G.text('COROA', cx + 20, 100, showH ? '#6a6890' : '#e8e8ff', { align: 'center' });
      if (this.flips && this.flips.length) {
        const n = this.flips.length;
        G.text('Lançamentos: ' + n, 14, 114, '#ffffff');
        G.text('Caras: ' + this.heads + '  (' + G.fmt(this.heads / n * 100, 1) + '%)', 14, 125, '#ffd84a');
      }
      if (this.st === 'choose') {
        G.text('Aposta: 10 moedas. Vence se a proporção', 14, 150, '#c8c8e0');
        G.text('de caras ficar entre 45% e 55%.', 14, 160, '#c8c8e0');
        menuList(ctx, this.opts().map(([l, n, pay]) => l + (pay ? '  → prêmio ' + pay : '')), this.i, 150, 168, 220, this.t, 9.5);
        if (this.msg) G.text(this.msg, 14, 196, '#ff8a7a');
      } else if (this.st === 'result') {
        const p = this.heads / this.n;
        G.text(this.win ? '★ VENCEU! +' + this.pay + ' moedas' : 'Perdeu... ' + G.fmt(p * 100, 1) + '% ficou fora da faixa.', W / 2, 167, this.win ? '#7aff8a' : '#ff8a7a', { align: 'center' });
        const L = { 10: 'Com só 10 lançamentos, o acaso domina: a proporção varia MUITO.', 100: 'Com 100 lançamentos a proporção já fica mais estável.', 1000: 'Com 1000 lançamentos quase sempre fica perto de 50%: Lei dos Grandes Números!' }[this.n];
        G.wrap(L, 340).forEach((l, i) => G.text(l, W / 2, 179 + i * 10, '#c8c8e0', { align: 'center' }));
        G.text('Z: continuar', W / 2, 200, '#ffd84a', { align: 'center' });
      }
    }
  }

  // ------------------------------------------------------------------
  //  DADOS DE PASCAL
  // ------------------------------------------------------------------
  const WAYS = s => 6 - Math.abs(7 - s);
  const MULT = s => Math.floor(36 / WAYS(s) * 0.85);
  class Dice {
    constructor(res) { this.res = res; this.st = 'bet'; this.sum = 7; this.t = 0; this.hist = {}; this.d = [3, 4]; this.rolls = 0; this.net = 0; }
    update(dt) {
      this.t += dt;
      if (this.st === 'bet') {
        if (I.pressed('left') && this.sum > 2) { this.sum--; G.sfx('select'); }
        if (I.pressed('right') && this.sum < 12) { this.sum++; G.sfx('select'); }
        if (I.pressed('cancel')) { this.done = true; this.res(); return; }
        if (I.pressed('confirm')) {
          if (G.P.coins < 5) { G.sfx('wrong'); this.msg = 'Precisa de 5 moedas!'; return; }
          G.P.coins -= 5; this.net -= 5; this.st = 'roll'; this.t = 0; G.sfx('dice'); this.msg = '';
        }
      } else if (this.st === 'roll') {
        if (Math.floor(this.t * 14) !== Math.floor((this.t - dt) * 14)) { this.d = [G.ri(1, 6), G.ri(1, 6)]; if (Math.random() < 0.3) G.sfx('dice'); }
        if (this.t > 1.1) {
          this.d = [G.ri(1, 6), G.ri(1, 6)];
          const s = this.d[0] + this.d[1];
          this.hist[s] = (this.hist[s] || 0) + 1; this.rolls++;
          this.win = s === this.sum;
          if (this.win) { const w = 5 * MULT(this.sum); G.give('coin', w); this.net += w; G.sfx('correct'); } else G.sfx('wrong');
          this.st = 'result'; this.t = 0;
        }
      } else if (this.st === 'result') {
        if (this.t > 0.3 && (I.pressed('confirm') || I.pressed('cancel'))) this.st = 'bet';
      }
    }
    draw(ctx) {
      frame(ctx, 'DADOS DE PASCAL · Valor Esperado');
      // tabela de somas
      const x0 = 14, y0 = 26;
      G.text('Escolha a SOMA (← →). Aposta: 5 moedas.', x0, y0, '#c8c8e0');
      for (let s = 2; s <= 12; s++) {
        const bx = x0 + (s - 2) * 32, by = y0 + 14, sel = s === this.sum;
        const h = WAYS(s) * 7;
        ctx.save(); ctx.fillStyle = sel ? 'rgba(90,90,200,0.55)' : 'rgba(20,18,50,0.85)'; G.rrPath(ctx, bx, by, 30, 62, 3); ctx.fill();
        if (sel) { ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 0.75; G.rrPath(ctx, bx + 0.5, by + 0.5, 29, 61, 3); ctx.stroke(); }
        ctx.restore();
        niceBar(ctx, bx + 8, by + 44 - h, 14, h, sel ? '#ffd84a' : '#5ac8ff', sel);
        G.text(String(s), bx + 15, by + 46, sel ? '#ffd84a' : '#ffffff', { align: 'center' });
        G.text(WAYS(s) + '/36', bx + 15, by + 2, '#9a98b0', { align: 'center', shadow: false });
        G.text(MULT(s) + 'x', bx + 15, by + 54, '#7aff8a', { align: 'center', shadow: false });
      }
      const s = this.sum, ev = 5 * MULT(s) * WAYS(s) / 36;
      G.text('P(soma ' + s + ') = ' + WAYS(s) + '/36 ≈ ' + G.fmt(WAYS(s) / 36 * 100, 1) + '%   Prêmio: ' + (5 * MULT(s)) + ' moedas', x0, y0 + 82, '#ffffff');
      G.text('Valor esperado: ' + 5 * MULT(s) + ' × ' + WAYS(s) + '/36 = ' + G.fmt(ev, 2) + ' moedas (você paga 5)', x0, y0 + 93, ev < 5 ? '#ff8a7a' : '#7aff8a');
      // dados
      const jig = this.st === 'roll' ? 2 : 0;
      G.shadow(ctx, 54, 171, 18, 0.3); G.shadow(ctx, 92, 171, 18, 0.3);
      dieFace(ctx, 40 + G.rf(-jig, jig), 140 + G.rf(-jig, jig), this.d[0], 28); dieFace(ctx, 78 + G.rf(-jig, jig), 140 + G.rf(-jig, jig), this.d[1], 28);
      if (this.st === 'result') {
        const sum = this.d[0] + this.d[1];
        G.text('Soma: ' + sum, 76, 176, '#ffffff', { align: 'center' });
        G.text(this.win ? '★ GANHOU ' + 5 * MULT(this.sum) + '!' : 'Não foi dessa vez.', 76, 188, this.win ? '#7aff8a' : '#ff8a7a', { align: 'center' });
      } else if (this.st === 'bet') G.text('Z: rolar   X: sair', 76, 182, '#ffd84a', { align: 'center' });
      if (this.msg) G.text(this.msg, 76, 196, '#ff8a7a', { align: 'center' });
      // histograma da sessão
      const vals = [], labs = [];
      for (let k = 2; k <= 12; k++) { vals.push(this.hist[k] || 0); labs.push(String(k)); }
      G.ui.drawFig(ctx, { type: 'bars', labels: labs, values: vals }, 150, 132, 222, 66);
      G.text('Suas rolagens: ' + this.rolls + '   Saldo: ' + (this.net >= 0 ? '+' : '') + this.net, 261, 202, '#9a98b0', { align: 'center' });
    }
  }

  // ------------------------------------------------------------------
  //  TABULEIRO DE GALTON
  // ------------------------------------------------------------------
  const ROWS = 8, BINS = 9, NBALLS = 60;
  function comb(n, k) { let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return r; }
  class Galton {
    constructor(res) { this.res = res; this.st = 'pick'; this.pick = 4; this.t = 0; this.balls = []; this.bins = Array(BINS).fill(0); this.spawned = 0; this.acc = 0; }
    pegX(row, k) { return W / 2 + (k - row / 2) * 22; }
    update(dt) {
      this.t += dt;
      if (this.st === 'pick') {
        if (I.pressed('left') && this.pick > 0) { this.pick--; G.sfx('select'); }
        if (I.pressed('right') && this.pick < BINS - 1) { this.pick++; G.sfx('select'); }
        if (I.pressed('cancel')) { this.done = true; this.res(); return; }
        if (I.pressed('confirm')) { this.st = 'drop'; this.bins.fill(0); this.balls = []; this.spawned = 0; G.sfx('confirm'); }
      } else if (this.st === 'drop') {
        this.acc += dt;
        while (this.acc > 0.07 && this.spawned < NBALLS) { this.acc -= 0.07; this.spawned++; this.balls.push({ r: 0, k: 0, t: 0, dir: Math.random() < 0.5 ? 0 : 1, x: W / 2, y: 30, done: false }); }
        for (const b of this.balls) {
          if (b.done) continue;
          b.t += dt * 7;
          if (b.t >= 1) {
            b.t = 0; b.k += b.dir; b.r++;
            if (b.r >= ROWS) { b.done = true; this.bins[b.k]++; continue; }
            b.dir = Math.random() < 0.5 ? 0 : 1; G.sfx('ball');
          }
          b.x = W / 2 + (b.k - b.r / 2) * 22 + (b.dir ? 11 : -11) * b.t;
          b.y = 26 + (b.r + b.t) * 10;
        }
        if (this.spawned >= NBALLS && this.balls.every(b => b.done)) {
          const mx = Math.max(...this.bins);
          this.win = this.bins[this.pick] === mx;
          this.st = 'result'; this.t = 0;
          if (this.win) { G.sfx('correct'); if (!G.P.flags.galtonHP) this.hp = true; else G.give('coin', 10); } else G.sfx('wrong');
        }
      } else if (this.st === 'result') {
        if (this.t > 0.5 && (I.pressed('confirm') || I.pressed('cancel'))) {
          if (this.hp) { this.hp = false; G.P.flags.galtonHP = true; this.done = true; G.runScript(async () => { await G.ui.say('Professor Galton', 'Excelente previsão! O centro é onde há MAIS caminhos possíveis. Tome esta recompensa!', { portrait: 'galton_down0' }); await G.give('heartPiece'); }); this.res(); return; }
          this.st = 'pick';
        }
      }
    }
    draw(ctx) {
      frame(ctx, 'TABULEIRO DE GALTON · O acaso forma um sino');
      // funil e pinos
      ctx.save(); ctx.fillStyle = '#3a2a5a'; ctx.beginPath(); ctx.moveTo(W / 2 - 16, 24); ctx.lineTo(W / 2 + 16, 24); ctx.lineTo(W / 2 + 3, 30); ctx.lineTo(W / 2 - 3, 30); ctx.closePath(); ctx.fill(); ctx.restore();
      for (let r = 0; r < ROWS; r++) for (let k = 0; k <= r; k++) {
        const px = this.pegX(r, k) + 0.5, py = 32.5 + r * 10;
        ctx.fillStyle = '#4a2a10'; ctx.beginPath(); ctx.arc(px, py + 0.4, 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#e8b060'; ctx.beginPath(); ctx.arc(px, py, 1.6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff0c0'; ctx.fillRect(px - 0.9, py - 0.9, 0.7, 0.7);
      }
      const binY = 31 + ROWS * 10 + 2, bw = 22, BH = 70;
      plot(ctx, this.pegX(ROWS, 0) - bw / 2, binY, bw * BINS, BH);
      for (let k = 0; k < BINS; k++) {
        const bx = this.pegX(ROWS, k) - bw / 2;
        if (k) { ctx.fillStyle = 'rgba(160,150,200,0.35)'; ctx.fillRect(bx, binY, 0.75, BH); }
        const h = Math.min(BH, this.bins[k] * 3);
        niceBar(ctx, bx + 3, binY + BH - h, bw - 6, h, k === this.pick ? '#ffd84a' : '#5ac8ff', k === this.pick && this.st === 'result');
        const exp = NBALLS * comb(ROWS, k) / 256;
        ctx.save(); ctx.fillStyle = '#ff6aa0'; ctx.fillRect(bx + 2, binY + BH - exp * 3 - 0.5, bw - 4, 1); ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, bx + bw / 2, binY + BH - exp * 3, 6, '#ff6aa0', 0.4); ctx.restore();
        if (this.st !== 'pick' || k === this.pick) G.text(String(this.bins[k]), bx + bw / 2 + 1, binY + BH + 2, k === this.pick ? '#ffd84a' : '#9a98b0', { align: 'center', shadow: false });
      }
      if (this.st === 'pick') {
        const bx = this.pegX(ROWS, this.pick);
        G.text('▼', bx, binY - 8, '#ffd84a', { align: 'center' });
        G.text('Em qual casa cairão MAIS bolinhas? (← →, Z)', 12, 200, '#c8c8e0');
      }
      for (const b of this.balls) if (!b.done) { ctx.fillStyle = '#2a2a4a'; ctx.beginPath(); ctx.arc(b.x, b.y, 2.3, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#e8f4ff'; ctx.beginPath(); ctx.arc(b.x, b.y, 1.8, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.fillRect(b.x - 1, b.y - 1, 0.8, 0.8); }
      G.text('linha rosa =', W - 12, 150, '#ff6aa0', { align: 'right' }); G.text('valor esperado', W - 12, 160, '#ff6aa0', { align: 'right' });
      if (this.st === 'result') {
        G.panel(ctx, 16, 26, 148, 74, { r: 4, thin: true, border: this.win ? '#7aff8a' : '#ff8a7a' });
        G.text(this.win ? '★ ACERTOU!' : 'Errou!', 90, 32, this.win ? '#7aff8a' : '#ff8a7a', { align: 'center' });
        G.wrap('Cada bolinha faz 8 escolhas. Há C(8,4)=70 caminhos até o centro, mas só 1 até cada ponta!', 128).forEach((l, i) => G.text(l, 26, 46 + i * 10, '#c8c8e0'));
      }
    }
  }

  // ------------------------------------------------------------------
  //  PESCA AMOSTRAL
  // ------------------------------------------------------------------
  class Fishing {
    constructor(res) {
      this.res = res; this.t = 0; this.st = 'menu'; this.i = 0; this.sample = []; this.queue = 0; this.catchT = 0;
      this.k = G.ri(1, 6); this.p = (this.k + 0.5) / 10 + G.rf(-0.025, 0.025);
      this.fish = []; for (let i = 0; i < 18; i++) this.fish.push({ x: G.rf(30, 350), y: G.rf(40, 130), vx: G.rf(-20, 20), gold: Math.random() < this.p });
    }
    menu() { return ['Pescar 1 peixe', 'Pescar 5 peixes', 'Estimar a proporção', 'Desistir']; }
    update(dt) {
      this.t += dt;
      for (const f of this.fish) { f.x += f.vx * dt; if (f.x < 20 || f.x > 364) f.vx = -f.vx; }
      if (this.st === 'menu') {
        const n = this.menu().length;
        if (I.pressed('up')) { this.i = (this.i + n - 1) % n; G.sfx('select'); }
        if (I.pressed('down')) { this.i = (this.i + 1) % n; G.sfx('select'); }
        if (I.pressed('cancel')) { this.done = true; this.res(); return; }
        if (I.pressed('confirm')) {
          if (this.i === 3) { this.done = true; this.res(); return; }
          if (this.i === 2) {
            if (this.sample.length < 3) { G.sfx('wrong'); this.msg = 'Pesque pelo menos 3 peixes antes de estimar!'; return; }
            this.st = 'guess'; this.gi = 0;
            const k = this.k, cand = [k - 2, k - 1, k, k + 1, k + 2].filter(v => v >= 0 && v <= 9);
            while (cand.length > 4) { if (Math.abs(cand[0] - k) >= Math.abs(cand[cand.length - 1] - k)) cand.shift(); else cand.pop(); }
            this.cands = cand; return;
          }
          if (this.sample.length >= 40) { this.msg = 'O pescador diz: chega, os peixes estão cansados!'; return; }
          this.queue = this.i === 0 ? 1 : Math.min(5, 40 - this.sample.length); this.st = 'cast'; this.catchT = 0; G.sfx('plop'); this.msg = '';
        }
      } else if (this.st === 'cast') {
        this.catchT += dt;
        const step = this.queue > 1 ? 0.35 : 0.8;
        if (this.catchT >= step) {
          this.catchT = 0; const gold = Math.random() < this.p;
          this.sample.push(gold); this.lastGold = gold; this.pop = 0.5; G.sfx(gold ? 'coin' : 'reel');
          this.queue--; if (this.queue <= 0) this.st = 'menu';
        }
      } else if (this.st === 'guess') {
        const n = this.cands.length;
        if (I.pressed('up')) { this.gi = (this.gi + n - 1) % n; G.sfx('select'); }
        if (I.pressed('down')) { this.gi = (this.gi + 1) % n; G.sfx('select'); }
        if (I.pressed('cancel')) { this.st = 'menu'; return; }
        if (I.pressed('confirm')) {
          this.ok = this.cands[this.gi] === this.k; this.st = 'result'; this.t = 0;
          G.recordQuiz('amostra', this.ok);
          if (this.ok) { G.sfx('correct'); const bonus = Math.min(20, this.sample.length); G.give('coin', 10 + Math.floor(bonus / 2)); if (!G.P.flags.fishHP) this.hp = true; } else G.sfx('wrong');
        }
      } else if (this.st === 'result') {
        if (this.t > 0.5 && (I.pressed('confirm') || I.pressed('cancel'))) {
          this.done = true;
          if (this.hp) { G.P.flags.fishHP = true; G.runScript(async () => { await G.ui.say('Pescador Neyman', 'Que estimativa boa! Você entendeu o poder da amostragem. Achei isto no fundo do lago, é seu!'); await G.give('heartPiece'); }); }
          this.res();
        }
      }
      if (this.pop > 0) this.pop -= dt;
    }
    draw(ctx) {
      frame(ctx, 'PESCA AMOSTRAL · Estime a proporção de peixes dourados');
      ctx.save();
      ctx.fillStyle = '#06142a'; G.rrPath(ctx, 9, 25, W - 18, 118, 4); ctx.fill();
      const wg = ctx.createLinearGradient(0, 26, 0, 142); wg.addColorStop(0, '#2a7ac8'); wg.addColorStop(0.35, '#1a5aa0'); wg.addColorStop(1, '#0a2a5a');
      ctx.fillStyle = wg; G.rrPath(ctx, 10, 26, W - 20, 116, 3.5); ctx.fill();
      ctx.beginPath(); G.rrPath(ctx, 10, 26, W - 20, 116, 3.5); ctx.clip();
      // raios de luz e ondinhas
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 6; i++) { const x = 30 + i * 62 + Math.sin(this.t * 0.6 + i) * 10; ctx.fillStyle = 'rgba(160,220,255,0.05)'; ctx.beginPath(); ctx.moveTo(x, 26); ctx.lineTo(x + 18, 26); ctx.lineTo(x + 40, 142); ctx.lineTo(x + 10, 142); ctx.closePath(); ctx.fill(); }
      ctx.globalCompositeOperation = 'source-over';
      for (let y = 30; y < 140; y += 8) for (let x = 14; x < W - 14; x += 26) { const o = Math.sin(this.t * 2 + x * 0.05 + y * 0.3) * 3; ctx.fillStyle = 'rgba(180,230,255,' + (0.12 + 0.08 * Math.sin(this.t * 3 + x + y)) + ')'; ctx.fillRect(x + o, y, 10, 0.75); }
      for (const f of this.fish) { ctx.globalAlpha = 0.5; G.draw(ctx, 'peixe', f.x - 8, f.y - 6 + Math.sin(this.t * 3 + f.x) * 1, { flip: f.vx < 0, tint: 'rgba(6,16,40,0.8)' }); ctx.globalAlpha = 1; }
      ctx.restore();
      const bx = W / 2, by = 84 + (this.st === 'cast' ? Math.sin(this.t * 20) * 2 : Math.sin(this.t * 2) * 1);
      ctx.save();
      ctx.strokeStyle = 'rgba(240,240,255,0.85)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(bx, 26); ctx.quadraticCurveTo(bx + 3, (26 + by) / 2, bx, by - 3); ctx.stroke();
      for (let i = 0; i < 2; i++) { const k = ((this.t * 0.8 + i * 0.5) % 1); ctx.globalAlpha = (1 - k) * 0.6; ctx.strokeStyle = '#d8f0ff'; ctx.beginPath(); ctx.ellipse(bx, by + 2, 4 + k * 14, (4 + k * 14) * 0.35, 0, 0, Math.PI * 2); ctx.stroke(); }
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#1b0a10'; ctx.beginPath(); ctx.ellipse(bx, by, 3.6, 4.3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff3a3a'; ctx.beginPath(); ctx.ellipse(bx, by - 0.5, 3, 3.6, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(bx, by - 0.5, 3, 3.6, 0, 0, Math.PI); ctx.fill();
      ctx.restore();
      if (this.pop > 0) { const fy = by - (0.5 - this.pop) * 60; G.draw(ctx, this.lastGold ? 'peixe_ouro' : 'peixe', bx - 8, fy - 8); G.text(this.lastGold ? 'DOURADO!' : 'azul', bx, fy - 20, this.lastGold ? '#ffd84a' : '#7ae4ff', { align: 'center' }); }
      const n = this.sample.length, g = this.sample.filter(Boolean).length;
      G.text('Amostra: n = ' + n + '   dourados: ' + g + '   proporção: ' + (n ? G.fmt(g / n * 100, 1) + '%' : '-'), 14, 147, '#ffffff');
      // tira de amostra
      this.sample.slice(-40).forEach((s, i) => niceBar(ctx, 14 + i * 9, 157, 7, 6, s ? '#ffd84a' : '#5a8aff'));
      if (this.st === 'menu') {
        menuList(ctx, this.menu(), this.i, 12, 169, 154, this.t, 9.5);
        G.wrap('Cada peixe é observado e devolvido. Amostras maiores = estimativas mais confiáveis (erro ≈ 1/√n).', 196).forEach((l, i) => G.text(l, 176, 170 + i * 9, '#9a98b0'));
        if (this.msg) G.text(this.msg, W / 2, 205, '#ff8a7a', { align: 'center' });
      } else if (this.st === 'guess') {
        G.text('Qual a % de dourados no LAGO INTEIRO?', 14, 170, '#ffd84a');
        menuList(ctx, this.cands.map(k => k * 10 + '% a ' + (k + 1) * 10 + '%'), this.gi, 214, 179, 150, this.t, 8);
      } else if (this.st === 'result') {
        G.text(this.ok ? '★ BOA ESTIMATIVA!' : 'Estimativa fora da faixa...', W / 2, 168, this.ok ? '#7aff8a' : '#ff8a7a', { align: 'center' });
        G.text('Proporção real: ' + G.fmt(this.p * 100, 1) + '%   Sua amostra: ' + G.fmt(g / Math.max(1, n) * 100, 1) + '% (n=' + n + ')', W / 2, 180, '#ffffff', { align: 'center' });
        G.text(n < 15 ? 'Dica: com amostras maiores o acaso atrapalha menos!' : 'A amostra representa bem a população quando é aleatória.', W / 2, 192, '#c8c8e0', { align: 'center' });
      }
    }
  }

  const MAP = { lln: LLN, dice: Dice, galton: Galton, fishing: Fishing };
  G.mini = {
    MAP,
    run(name) {
      const C = MAP[name];
      const prevMusic = G.audio.cur;
      G.music('minigame');
      return new Promise(res => G.ui.push(new C(() => { G.music(prevMusic); res(); })));
    }
  };
})(window.G);
