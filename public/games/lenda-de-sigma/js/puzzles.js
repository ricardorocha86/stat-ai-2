'use strict';
// =====================================================================
//  Quebra-cabeças estatísticos das masmorras. Cada tipo de sala
//  G.PUZ[tipo](c) monta entidades e regras; c traz o contexto da sala:
//  { map, r, did, add, L, setL, getL, solved, solve(), opt }.
// =====================================================================
(function (G) {
  const T = G.T, TS = 16, st = G.st, F = G.fmt;
  const ri = G.ri, pick = G.pick, shuffle = G.shuffle;
  const SPR = G.spr, C = G.col;
  const PUZ = G.PUZ = {};

  // ------------------------------------------------------------------
  //  Sprites próprios dos puzzles
  // ------------------------------------------------------------------
  G.buildPuzzle = function () {
    const { cyl, bevel, inRR, inPoly, bboxOf } = G.artTools;
    const R5 = c => C.ramp(c, 5);
    // caixote (pilhas)
    {
      const p = new G.Paint(32, 22), Wd = R5('#b07a40');
      for (let y = 0; y < 6; y++) for (let x = 2; x < 30; x++) p.px(x, y, y < 1 ? Wd[4] : Wd[3]);
      cyl(p, (x, y) => x >= 2 && x < 30 && y >= 6 && y < 21, Wd, [1, 5, 31, 22]);
      for (let x = 2; x < 30; x++) { p.px(x, 6, Wd[0]); p.px(x, 13, Wd[1]); }
      p.line(4, 8, 27, 19, Wd[1], 1.5); p.line(27, 8, 4, 19, Wd[1], 1.5);
      p.outline({ k: -0.8 });
      SPR.crate = p.toCanvas();
    }
    // alavanca (2 estados)
    for (const on of [0, 1]) {
      const p = new G.Paint(32, 32), S = R5('#7a7484'), Wd = R5('#8a5a2a');
      cyl(p, inRR(6, 20, 20, 9, 2), S, [5, 19, 27, 30]);
      const a = on ? 0.6 : -0.6, bx = 16, by = 22;
      const tx = bx + Math.sin(a) * 15, ty = by - Math.cos(a) * 15;
      p.line(bx, by, tx, ty, Wd[2], 2.5);
      p.ell(tx, ty, 3.5, 3.5, { ramp: R5(on ? '#ff5a5a' : '#5a8aff'), ambient: 0.4 });
      p.outline({ k: -0.8 });
      SPR['lever' + on] = p.toCanvas();
    }
    // estátua com placa (ordenação)
    {
      const p = new G.Paint(32, 40), S = R5('#9a92a8');
      cyl(p, inRR(4, 30, 24, 9, 2), R5('#5a5466'), [3, 29, 29, 40]);
      cyl(p, inPoly([[10, 14], [22, 14], [25, 31], [7, 31]]), S, [6, 13, 26, 32]);
      p.ell(16, 9, 6, 6, { ramp: S, ambient: 0.4 });
      cyl(p, inRR(2, 15, 28, 13, 2), R5('#d8c8a0'), [1, 14, 31, 29]);
      p.outline({ k: -0.8 });
      SPR.numStatue = p.toCanvas();
    }
    // torre de arqueiro (estátua com arco)
    {
      const p = new G.Paint(32, 40), S = R5('#8a8270');
      cyl(p, inRR(3, 30, 26, 9, 2), R5('#4a4438'), [2, 29, 30, 40]);
      cyl(p, inPoly([[9, 12], [23, 12], [25, 31], [7, 31]]), S, [6, 11, 26, 32]);
      p.ell(16, 8, 6, 6, { ramp: S, ambient: 0.4 });
      for (let i = 0; i < 18; i++) { const a = -0.9 + i * 0.1; p.px(23 + Math.cos(a) * 9, 20 + Math.sin(a) * 9, '#6a4020'); p.px(24 + Math.cos(a) * 9, 20 + Math.sin(a) * 9, '#a07040'); }
      p.line(26, 12, 26, 28, '#e8e0d0', 1);
      p.outline({ k: -0.8 });
      SPR.archer = p.toCanvas();
    }
    // flecha (horizontal)
    {
      const p = new G.Paint(20, 6);
      p.line(2, 3, 16, 3, '#c8a070', 1.5);
      p.poly([[15, 0], [20, 3], [15, 6]], '#d8d8e8');
      p.poly([[0, 0], [4, 3], [0, 6]], '#ff5a5a');
      SPR.arrow = p.toCanvas();
    }
    // armadura (pesquisa)
    {
      const p = new G.Paint(28, 44), S = ['#2a2a3a', '#4a4a60', '#7a7a94', '#aaaac4', '#dadaf0'];
      cyl(p, inRR(4, 36, 20, 7, 2), R5('#4a4438'), [3, 35, 25, 44]);
      cyl(p, inRR(7, 20, 14, 17, 3), S, [6, 19, 22, 38]);
      p.ell(14, 12, 7, 8, { ramp: S, ambient: 0.35, contrast: 1.2 });
      for (let x = 9; x < 20; x++) p.px(x, 12, '#140c20');
      cyl(p, inRR(1, 20, 6, 12, 2), S, [0, 19, 8, 33]); cyl(p, inRR(21, 20, 6, 12, 2), S, [20, 19, 28, 33]);
      p.outline({ k: -0.8 });
      SPR.armorStatue = p.toCanvas();
    }
  };

  // ------------------------------------------------------------------
  //  Entidades auxiliares
  // ------------------------------------------------------------------
  // desenho no chão (fica abaixo de tudo)
  class Decal extends G.Ent {
    constructor(x, y, w, h, fn) { super(x, y, w, h); this.fn = fn; this.late = true; }
    get by() { return -100000 + this.y; }
    draw(ctx, cam) { this.fn(ctx, this.x - cam.x, this.y - cam.y, this); }
  }
  G.Decal = Decal;
  // painel de informação acima (sempre visível, não sólido)
  class Board extends G.Ent {
    constructor(x, y, w, h, fn, o = {}) { super(x, y, w, h); this.fn = fn; this.o = o; this.late = true; }
    get by() { return this.o.front ? 100000 : -50000 + this.y; }
    draw(ctx, cam) { this.fn(ctx, this.x - cam.x, this.y - cam.y, this); }
  }
  G.Board = Board;
  // texto com caixinha
  function tag(ctx, x, y, txt, col = '#ffe27a', bg) {
    const w = G.textW(txt) + 8;
    ctx.save();
    ctx.fillStyle = bg || 'rgba(10,8,24,0.82)'; G.rrPath(ctx, x - w / 2, y - 1, w, 11, 3); ctx.fill();
    ctx.strokeStyle = 'rgba(255,216,74,0.45)'; ctx.lineWidth = 0.5; G.rrPath(ctx, x - w / 2 + 0.25, y - 0.75, w - 0.5, 10.5, 3); ctx.stroke();
    ctx.restore();
    G.text(txt, x, y + 1, col, { align: 'center', shadow: false });
  }
  G.puzTag = tag;
  // número gravado no chão
  function floorNum(ctx, x, y, txt, col = '#e8e0c8') {
    ctx.save(); ctx.globalAlpha = 0.85;
    G.text(txt, x, y, col, { align: 'center', shadowColor: 'rgba(0,0,0,0.6)', thin: true });
    ctx.restore();
  }

  // bloco empurrável restrito a uma faixa (trilho)
  function trackBlock(c, lx, ly, bounds, o = {}) {
    const [x, y] = c.L(lx, ly);
    const b = c.add(new G.PushBlock(x, y, o.value, Object.assign({ locked: c.solved || o.fixed }, o)), c.r.idx);
    b.bounds = bounds; b.fixed = o.fixed;
    return b;
  }

  // desenho no chão que não vai para a camada de cima (sombras de gráficos sob os marcos)
  class FloorDecal extends G.Ent {
    constructor(x, y, w, h, fn) { super(x, y, w, h); this.fn = fn; }
    get by() { return -100000 + this.y; }
    draw(ctx, cam) { this.fn(ctx, this.x - cam.x, this.y - cam.y, this); }
  }
  const valOfRail = (b, r, x0) => Math.round((b.x - r.px) / TS) - x0;
  // régua no chão com marcos empurráveis (boxplot, intervalo de confiança, sino)
  function rail(c, labels, init, x0, onCheck, drawExtra) {
    const { r, L, add } = c, row = 9, N = 20;
    const bounds = { x: r.px + (x0 + 1) * TS, y: r.py + row * TS, w: N * TS, h: TS };
    const blocks = labels.map((lab, i) => { const [x, y] = L(x0 + init[i], row); const b = add(new G.PushBlock(x, y, lab, { locked: c.solved, onMoved: onCheck }), r.idx); b.bounds = bounds; return b; });
    add(new Decal(r.px + (x0 + 1) * TS, r.py + (row + 1) * TS, N * TS, 12, (ctx, x, y) => {
      ctx.fillStyle = 'rgba(255,230,160,0.55)'; ctx.fillRect(x, y + 1, N * TS, 1);
      for (let v = 1; v <= N; v++) { const px = x + (v - 1) * TS + 8; ctx.fillRect(px, y, 0.5, 3); floorNum(ctx, px, y + 4, String(v)); }
    }), r.idx);
    if (drawExtra) add(new FloorDecal(r.px + (x0 + 1) * TS, r.py + (row + 1) * TS, N * TS, 12, (ctx, x, y) => drawExtra(ctx, x, y, blocks.map(b => valOfRail(b, r, x0)))), r.idx);
    return blocks;
  }
  G.puzRail = rail;

  // ------------------------------------------------------------------
  //  BALANÇA DA MÉDIA — a média das posições deve cair no ponto de apoio
  // ------------------------------------------------------------------
  PUZ.balance = (c) => {
    const { r, L } = c, x0 = 4, row = 8, N = 15;
    const nb = c.opt.blocks || 3, nf = c.opt.fixed || 0;
    let target, sol;
    for (let k = 0; k < 500; k++) {
      target = ri(4, 12);
      const vals = new Set(); while (vals.size < nb - 1) vals.add(ri(1, N));
      const arr = [...vals], last = nb * target - st.sum(arr);
      if (last >= 1 && last <= N && !vals.has(last)) { sol = arr.concat([last]); break; }
    }
    // posições iniciais: os fixos já na solução; os móveis espalhados
    const fixedVals = sol.slice(0, nf);
    let init;
    for (let k = 0; k < 200; k++) {
      const s = new Set(fixedVals); while (s.size < nb) s.add(ri(1, N));
      init = [...s];
      if (Math.abs(st.mean(init) - target) > 1.5) break;
    }
    const bounds = { x: r.px + x0 * TS, y: r.py + row * TS, w: N * TS, h: TS };
    const blocks = init.map((v, i) => trackBlock(c, x0 + v - 1, row, bounds, { fixed: i < nf, weight: true }));
    const valOf = b => Math.round((b.x - r.px) / TS) - x0 + 1;
    // régua no chão
    c.add(new Decal(r.px + x0 * TS, r.py + (row + 1) * TS, N * TS, 12, (ctx, x, y) => {
      ctx.fillStyle = 'rgba(255,230,160,0.55)'; ctx.fillRect(x, y + 1, N * TS, 1);
      for (let v = 1; v <= N; v++) { const px = x + (v - 1) * TS + 8; ctx.fillRect(px, y, 0.5, 3); floorNum(ctx, px, y + 4, String(v)); }
      const tx = x + (target - 1) * TS + 8;
      ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.moveTo(tx, y - 2); ctx.lineTo(tx + 4, y + 3); ctx.lineTo(tx - 4, y + 3); ctx.closePath(); ctx.fill();
    }), r.idx);
    // gangorra
    let ang = 0, done = c.solved;
    c.add(new Board(r.px + x0 * TS, r.py + (c.opt.linhaBalanca ?? 3) * TS, N * TS, 40, (ctx, x, y) => {
      const mean = st.mean(blocks.map(valOf));
      const want = done ? 0 : G.clamp((mean - target) * 0.06, -0.32, 0.32);
      ang = G.lerp(ang, want, 0.12);
      const px = x + (target - 1) * TS + 8, py = y + 22;
      // apoio
      ctx.fillStyle = '#5a4a3a'; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + 9, py + 16); ctx.lineTo(px - 9, py + 16); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#8a7458'; ctx.beginPath(); ctx.moveTo(px, py + 2); ctx.lineTo(px + 6, py + 14); ctx.lineTo(px - 2, py + 14); ctx.closePath(); ctx.fill();
      ctx.save(); ctx.translate(px, py); ctx.rotate(ang);
      const left = x + 4 - px, right = x + N * TS - 4 - px;
      ctx.fillStyle = '#3a2410'; ctx.fillRect(left - 1, -3, right - left + 2, 5);
      ctx.fillStyle = done ? '#ffd84a' : '#c8904a'; ctx.fillRect(left, -2, right - left, 3);
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(left, -2, right - left, 0.5);
      for (const b of blocks) { const bx = x + (valOf(b) - 1) * TS + 8 - px; ctx.fillStyle = b.fixed ? '#7a6a8a' : '#a8a0b8'; ctx.fillRect(bx - 4, -10, 8, 8); ctx.fillStyle = '#2a2430'; ctx.fillRect(bx - 4, -2.5, 8, 0.5); }
      ctx.restore();
      tag(ctx, x + N * TS / 2, y - 6, 'média = ' + F(mean, 2) + '   ·   apoio = ' + target, done ? '#7aff8a' : (Math.abs(mean - target) < 1e-9 ? '#7aff8a' : '#ffe27a'));
    }), r.idx);
    return {
      dicas: ['Se a gangorra pende para a direita, a média está alta demais: leve um peso para a esquerda (e vice-versa).', 'A soma das posições precisa ser ' + nb + ' × ' + target + ' = ' + nb * target + '. Ajuste os pesos até a soma chegar lá.'],
      prompt: '^yBALANÇA DA MÉDIA^0: empurre os pesos pela régua. A gangorra só fica reta quando a ^gMÉDIA das posições^0 dos pesos for igual ao ponto de apoio (▲ = ' + target + ').' + (nf ? ' Os pesos acorrentados não se movem!' : ''),
      update() {
        if (done || c.isSolved()) return;
        if (blocks.some(b => b.moving)) return;
        const vals = blocks.map(valOf);
        if (Math.abs(st.mean(vals) - target) < 1e-9) {
          done = true; for (const b of blocks) b.o.locked = true;
          G.ui.toast('(' + vals.join(' + ') + ') ÷ ' + nb + ' = ' + target + '  ✓  equilíbrio!', '#7aff8a');
          G.recordQuiz('media', true); c.solve();
        }
      },
      dbg: { target, blocks, x0 }, rewardPos: [11, 11]
    };
  };

  // ------------------------------------------------------------------
  //  NIVELAR AS PILHAS — média como divisão justa (carregar caixotes)
  // ------------------------------------------------------------------
  class Stack extends G.Ent {
    constructor(x, y, count, puz) { super(x + 2, y + 6, 12, 10); this.solid = true; this.count = count; this.puz = puz; this.bump = 0; }
    interBox() { return { x: this.x - 3, y: this.y - 10, w: this.w + 6, h: this.h + 14 }; }
    interact(p) { this.puz.take(this, p); }
    acceptCarry(p) { return this.puz.put(this, p); }
    update(dt) { this.t += dt; if (this.bump > 0) this.bump -= dt; }
    get darkGlow() { return 24; }
    draw(ctx, cam) {
      const x = this.x - 2 - cam.x, base = this.y + this.h - cam.y;
      G.shadow(ctx, x + 8, base, 16, 0.3);
      const b = this.bump > 0 ? Math.sin(this.bump * 30) * 0.8 : 0;
      for (let i = 0; i < this.count; i++) G.draw(ctx, 'crate', x, base - 11 - i * 7 + (i === this.count - 1 ? b : 0));
    }
    drawLate(ctx, cam) { tag(ctx, this.x + 6 - cam.x, this.y + this.h + 2 - cam.y, String(this.count), this.puz.done ? '#7aff8a' : '#ffffff'); }
  }
  PUZ.level = (c) => {
    const { r, L } = c;
    const n = c.opt.stacks || 4;
    let counts;
    for (;;) { const m = ri(3, 5); counts = []; for (let i = 0; i < n - 1; i++) counts.push(ri(1, 8)); const last = m * n - st.sum(counts); if (last >= 1 && last <= 8 && new Set(counts.concat([last])).size >= 3) { counts.push(last); break; } }
    shuffle(counts);
    const mean = st.mean(counts);
    const puz = { done: c.solved, stacks: [] };
    const xs = n === 4 ? [6, 10, 14, 18] : [5, 8, 11, 14, 17];
    xs.forEach((lx, i) => { const s = c.add(new Stack(...L(lx, 6), c.solved ? mean : counts[i], puz), r.idx); puz.stacks.push(s); });
    puz.take = (s, p) => {
      if (puz.done) { G.ui.toast('As pilhas já estão equilibradas: ' + mean + ' em cada!', '#7aff8a'); return; }
      if (p.carry) return;
      if (s.count <= 0) { G.sfx('wrong'); return; }
      s.count--; s.bump = 0.2; p.carry = { spr: 'crate', puzzle: true, from: s }; G.sfx('pot');
    };
    puz.put = (s, p) => {
      if (!p.carry || !p.carry.puzzle) return false;
      if (s.count >= 9) { G.ui.toast('Pilha alta demais!', '#ff8a7a'); return true; }
      s.count++; s.bump = 0.2; p.carry = null; G.sfx('push');
      if (puz.stacks.every(k => k.count === mean)) {
        puz.done = true;
        G.ui.toast('Soma ' + st.sum(counts) + ' ÷ ' + n + ' pilhas = ' + mean + ' em cada  ✓  essa é a MÉDIA!', '#7aff8a');
        G.recordQuiz('media', true); c.solve();
      }
      return true;
    };
    // caixote carregado não pode sair da sala: ao sair, volta à pilha de origem
    puz.leave = () => { const p = G.player; if (p && p.carry && p.carry.puzzle) { p.carry.from.count++; p.carry = null; } };
    return {
      dicas: ['Some todos os caixotes e divida pelo número de pilhas: essa é a altura que cada pilha deve ter.', 'Cada pilha deve ficar com ' + mean + ' caixotes. Tire das que têm mais e leve para as que têm menos.'],
      prompt: '^yPILHAS DESIGUAIS^0: pegue caixotes (X) das pilhas altas e coloque nas baixas até que ^gtodas fiquem com a mesma altura^0. Essa altura igual é justamente a ^yMÉDIA^0 das pilhas!',
      leave: puz.leave, dbg: { mean, puz }, rewardPos: [11, 10]
    };
  };

  // ------------------------------------------------------------------
  //  BRASEIROS — acenda os números que obedecem à regra
  // ------------------------------------------------------------------
  PUZ.braziers = (c) => {
    const { r, L } = c;
    const rule = c.opt.rule || 'acimaMedia';
    let vals, want;
    for (let k = 0; k < 300; k++) {
      vals = []; for (let i = 0; i < 6; i++) vals.push(ri(1, 20));
      const m = st.mean(vals), md = st.median(vals), sd = st.std(vals);
      if (rule === 'acimaMedia') { want = vals.map(v => v > m); if (vals.every(v => Math.abs(v - m) > 0.4) && want.filter(Boolean).length >= 2 && want.filter(Boolean).length <= 4) break; }
      else if (rule === 'abaixoMediana') { want = vals.map(v => v < md); if (new Set(vals).size === 6) break; }
      else if (rule === 'dentroSigma') { want = vals.map(v => Math.abs(v - m) <= sd); if (vals.every(v => Math.abs(Math.abs(v - m) - sd) > 0.6) && want.filter(Boolean).length >= 2 && want.filter(Boolean).length <= 5) break; }
    }
    const pos = [[5, 4], [9, 3], [14, 3], [18, 4], [7, 8], [16, 8]];
    const brs = [];
    let done = c.solved;
    const check = () => {
      if (done) return;
      if (brs.every((b, i) => b.lit === want[i])) {
        done = true;
        const m = st.mean(vals);
        G.ui.toast(rule === 'acimaMedia' ? 'Média = ' + F(m, 2) + ': acesas as chamas acima dela ✓' : rule === 'abaixoMediana' ? 'Mediana = ' + F(st.median(vals), 1) + ' ✓' : 'Média ' + F(m, 1) + ', σ ≈ ' + F(st.std(vals), 1) + ' ✓', '#7aff8a');
        G.recordQuiz(rule === 'dentroSigma' ? 'desvio' : rule === 'abaixoMediana' ? 'mediana' : 'media', true);
        c.solve();
      }
    };
    vals.forEach((v, i) => {
      const b = c.add(new G.Brazier(...L(pos[i][0], pos[i][1]), { lit: done ? want[i] : false, onHit: (br) => { if (done) return; br.lit = !br.lit; G.sfx(br.lit ? 'burn' : 'tink'); check(); } }), r.idx);
      b.value = v; brs.push(b);
      c.add(new Decal(b.x - 2, b.y + 12, 16, 10, (ctx, x, y) => tag(ctx, x + 8, y, String(v))), r.idx);
    });
    // no ritual do desvio, a habilidade é ler o intervalo μ ± σ: a placa já traz μ e σ calculados
    const mu = st.mean(vals), sd = st.std(vals);
    if (rule === 'dentroSigma') c.add(new Board(r.px + 7 * TS, r.py + 10 * TS + 6, 10 * TS, 12, (ctx, x, y) => tag(ctx, x + 80, y, 'μ = ' + F(mu, 1) + '    σ = ' + F(sd, 1), '#c8e0ff')), r.idx);
    const txt = { acimaMedia: 'Acenda (golpeando) só os braseiros cujos números são ^yMAIORES QUE A MÉDIA^0 de todos os seis.', abaixoMediana: 'Acenda só os números ^yMENORES QUE A MEDIANA^0 dos seis.', dentroSigma: 'Acenda os números que estão a ^yno máximo 1 DESVIO PADRÃO^0 da média: entre μ - σ e μ + σ. A placa no chão mostra μ e σ.' }[rule];
    const dicas = {
      acimaMedia: ['Some os seis números e divida por 6: essa é a média. Depois compare cada braseiro com ela.', 'A média é ' + F(mu, 2) + '. Acenda só os números maiores que isso.'],
      abaixoMediana: ['Coloque os seis números em ordem. Com 6 valores, a mediana fica entre o 3º e o 4º.', 'A mediana é ' + F(st.median(vals), 1) + '. Acenda os números menores que ela.'],
      dentroSigma: ['Calcule os limites: μ - σ e μ + σ. Acenda os números que ficam entre eles.', 'A faixa vai de ' + F(mu - sd, 1) + ' a ' + F(mu + sd, 1) + '.']
    }[rule];
    return { prompt: '^yRITUAL DO FOGO^0: ' + txt + ' Golpeie de novo para apagar.', dicas, dbg: { want, brs }, rewardPos: [11, 10] };
  };

  // ------------------------------------------------------------------
  //  ORDENAR ESTÁTUAS — alavancas trocam vizinhas (mediana = meio)
  // ------------------------------------------------------------------
  class NumStatue extends G.Ent {
    constructor(x, y, v) { super(x + 2, y + 8, 12, 8); this.solid = true; this.v = v; this.ox = 0; this.glow = false; }
    get darkGlow() { return 26; }
    draw(ctx, cam) {
      const x = this.x - 2 - cam.x + this.ox, y = this.y - 12 - cam.y;
      G.shadow(ctx, x + 8, this.y + this.h - cam.y, 14, 0.3);
      if (this.glow) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, x + 8, y + 8, 20, '#ffe27a', 0.6 + 0.2 * Math.sin(G.time * 5)); ctx.restore(); G.light.add(x + 8, y + 8, 40, '#ffe27a', 0.8); }
      G.draw(ctx, 'numStatue', x, y);
    }
    drawLate(ctx, cam) { const x = this.x - 2 - cam.x + this.ox, y = this.y - 12 - cam.y; G.text(String(this.v), x + 8, y + 9.5, this.glow ? '#5a2a00' : '#3a2a1a', { align: 'center', shadow: false }); }
  }
  class Lever extends G.Ent {
    constructor(x, y, fn) { super(x + 3, y + 8, 10, 8); this.solid = true; this.fn = fn; this.on = false; this.cd = 0; }
    get darkGlow() { return 20; }
    onHit() { if (this.cd > 0) return false; this.cd = 0.45; this.on = !this.on; G.sfx('switch'); this.fn(this); return false; }
    interact() { this.onHit(); }
    update(dt) { this.t += dt; if (this.cd > 0) this.cd -= dt; }
    draw(ctx, cam) { G.draw(ctx, this.on ? 'lever1' : 'lever0', this.x - 3 - cam.x, this.y - 8 - cam.y); }
  }
  G.Lever = Lever;
  PUZ.sortline = (c) => {
    const { r, L } = c;
    const n = c.opt.n || 5;
    let vals; do { const s = new Set(); while (s.size < n) s.add(ri(1, 30)); vals = [...s]; } while (vals.every((v, i) => i === 0 || v > vals[i - 1]));
    if (c.solved) vals.sort((a, b) => a - b);
    const xs = n === 5 ? [5, 8.5, 12, 15.5, 19] : [3.5, 6.5, 9.5, 12.5, 15.5, 18.5, 21.5].slice(0, n);
    const sts = vals.map((v, i) => c.add(new NumStatue(...L(xs[i], 4), v), r.idx));
    let done = c.solved, swaps = 0;
    // o menor número de trocas de vizinhas é o número de pares fora de ordem (inversões)
    let minTrocas = 0; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (vals[i] > vals[j]) minTrocas++;
    const mid = Math.floor(n / 2);
    if (done) sts[mid].glow = true;
    const check = () => {
      const ok = sts.every((s, i) => i === 0 || s.v > sts[i - 1].v);
      if (ok && !done) {
        done = true; sts[mid].glow = true;
        G.ui.toast('Em ordem! O valor do MEIO é a MEDIANA: ' + sts[mid].v + '   (' + swaps + ' trocas; o mínimo era ' + minTrocas + ')', '#7aff8a');
        if (swaps === minTrocas) G.runScript(async () => { await G.wait(1.6); G.sfx('coin'); G.give('coin', 5); G.ui.toast('Ordenação perfeita: nenhuma troca a mais! +5 moedas', '#ffd84a'); });
        G.recordQuiz('mediana', true); c.solve();
      }
    };
    for (let i = 0; i < n - 1; i++) {
      c.add(new Lever(...L((xs[i] + xs[i + 1]) / 2, 7), () => {
        if (done) { G.sfx('tink'); return; }
        const a = sts[i], b = sts[i + 1];
        const t = a.v; a.v = b.v; b.v = t; swaps++;
        // animação de troca
        a.ox = (xs[i + 1] - xs[i]) * TS; b.ox = -(xs[i + 1] - xs[i]) * TS;
        G.sfx('push');
        check();
      }), r.idx);
    }
    // seta "menor → maior"
    c.add(new Decal(r.px + xs[0] * TS, r.py + 9 * TS + 4, (xs[n - 1] - xs[0] + 1) * TS, 12, (ctx, x, y, d) => {
      floorNum(ctx, x + d.w / 2, y, 'menor  →  →  →  maior', '#e8d8a8');
    }), r.idx);
    return {
      prompt: '^yESTÁTUAS DA ORDEM^0: golpeie as ^calavancas^0 para trocar estátuas vizinhas. Coloque os números ^gem ordem crescente^0. Só assim a estátua do MEIO revela a ^yMEDIANA^0! Desafio: use o ^omínimo de trocas^0.',
      dicas: ['Cada alavanca troca as duas estátuas vizinhas a ela. Leve o maior número para a ponta direita, um passo de cada vez.', 'Compare as vizinhas da esquerda para a direita e troque sempre que a da esquerda for maior. Repita até não haver mais troca.'],
      update(dt) { for (const s of sts) s.ox = G.approach(s.ox, 0, 90 * dt); },
      dbg: { sts }, rewardPos: [11, 10]
    };
  };

  // ------------------------------------------------------------------
  //  PONTE DE PEDRAS — só a pedra certa de cada fileira aguenta peso
  // ------------------------------------------------------------------
  function genRow(rule) {
    if (rule === 'median') {
      const s = new Set(); while (s.size < 5) s.add(ri(1, 30));
      const vals = [...s]; const md = st.median(vals);
      return { labels: vals.map(String), ok: vals.indexOf(md), sign: 'mediana?' };
    }
    if (rule === 'z') {
      const mu = pick([20, 50, 100, 60]), sg = pick([2, 5, 10, 4]), z = pick([-2, -1, 1, 2, 0]);
      const ks = shuffle([-2, -1, 0, 1, 2]);
      return { labels: ks.map(k => String(mu + k * sg)), ok: ks.indexOf(z), sign: 'μ=' + mu + ' σ=' + sg + '  z=' + (z > 0 ? '+' : '') + z };
    }
    if (rule === 'prob') {
      const fr = shuffle([[1, 6], [1, 2], [2, 3], [1, 3], [5, 6], [1, 4], [3, 4], [2, 5], [1, 8]]).slice(0, 5);
      const vals = fr.map(([a, b]) => a / b);
      const hi = G.chance(0.5);
      const best = vals.indexOf(hi ? Math.max(...vals) : Math.min(...vals));
      return { labels: fr.map(([a, b]) => a + '/' + b), ok: best, sign: hi ? 'MAIOR chance?' : 'MENOR chance?' };
    }
    if (rule === 'mean') {
      let a; do { a = [ri(1, 9), ri(1, 9), ri(1, 9)]; } while (st.sum(a) % 3);
      const m = st.mean(a);
      const opts = shuffle([m, m + 1, m - 1, st.median(a) !== m ? st.median(a) : m + 2, st.sum(a)].filter((v, i, arr) => arr.indexOf(v) === i)).slice(0, 5);
      while (opts.length < 5) opts.push(m + opts.length + 2);
      if (!opts.includes(m)) opts[0] = m;
      return { labels: opts.map(String), ok: opts.indexOf(m), sign: 'média de ' + a.join(',') };
    }
    if (rule === 'corr') {
      // nuvem de 8 pontos cujo r amostral fica perto de um dos 5 valores das pedras
      const alvos = [-0.9, -0.5, 0, 0.5, 0.9], alvo = pick(alvos);
      let pts, rr;
      do {
        const X = [0, 1, 2, 3, 4, 5, 6, 7].map(i => i + G.rf(-0.3, 0.3)), mx = st.mean(X), sx = st.std(X);
        const Z = X.map(() => { const u = Math.max(1e-6, Math.random()), v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); });
        const Y = X.map((x, i) => alvo * (x - mx) / sx + Math.sqrt(1 - alvo * alvo) * Z[i]);
        rr = corrXY(X, Y);
        const y0 = Math.min(...Y), y1 = Math.max(...Y), x0 = Math.min(...X), x1 = Math.max(...X);
        pts = X.map((x, i) => [(x - x0) / (x1 - x0), (Y[i] - y0) / ((y1 - y0) || 1)]);
      } while (Math.abs(rr - alvo) > 0.07);
      const labs = shuffle(alvos.slice());
      return { labels: labs.map(v => (v > 0 ? '+' : '') + F(v, 1).replace('-', '−')), ok: labs.indexOf(alvo), sign: '', plot: pts };
    }
    return genRow('median');
  }
  function corrXY(X, Y) { const mx = st.mean(X), my = st.mean(Y); let sxy = 0, sxx = 0, syy = 0; for (let i = 0; i < X.length; i++) { sxy += (X[i] - mx) * (Y[i] - my); sxx += (X[i] - mx) ** 2; syy += (Y[i] - my) ** 2; } return sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0; }
  // mini gráfico de dispersão das placas da ponte da correlação
  function miniPlot(ctx, cx, y, pts) {
    const w = 40, h = 26, x = cx - w / 2;
    ctx.save();
    ctx.fillStyle = 'rgba(10,8,24,0.82)'; G.rrPath(ctx, x - 3, y - 2, w + 6, h + 5, 3); ctx.fill();
    ctx.strokeStyle = 'rgba(255,216,74,0.45)'; ctx.lineWidth = 0.5; G.rrPath(ctx, x - 2.75, y - 1.75, w + 5.5, h + 4.5, 3); ctx.stroke();
    ctx.fillStyle = 'rgba(255,230,160,0.6)'; ctx.fillRect(x, y, 0.5, h); ctx.fillRect(x, y + h, w, 0.5);
    ctx.fillStyle = '#ffe27a';
    for (const [px, py] of pts) { ctx.beginPath(); ctx.arc(x + 3 + px * (w - 6), y + h - 3 - py * (h - 6), 1.3, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
  class NumStone extends G.Ent {
    constructor(x, y, label) { super(x, y, 16, 16); this.label = label; this.crack = 0; }
    get by() { return -90000 + this.y; }
    draw(ctx, cam) {
      if (this.gone) return;
      const x = this.x - cam.x, y = this.y - cam.y;
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x + 1, y + 14, 14, 2);
      const g = ctx.createLinearGradient(0, y, 0, y + 15); g.addColorStop(0, '#a89a88'); g.addColorStop(1, '#6a5c50');
      ctx.fillStyle = g; G.rrPath(ctx, x + 1, y + 1, 14, 13, 2); ctx.fill();
      ctx.strokeStyle = '#2a2018'; ctx.lineWidth = 0.5; G.rrPath(ctx, x + 1.25, y + 1.25, 13.5, 12.5, 2); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x + 3, y + 2, 10, 0.5);
      if (this.crack > 0) { ctx.strokeStyle = '#1a1008'; ctx.beginPath(); ctx.moveTo(x + 4, y + 3); ctx.lineTo(x + 8, y + 8); ctx.lineTo(x + 6, y + 12); ctx.moveTo(x + 8, y + 8); ctx.lineTo(x + 12, y + 7); ctx.stroke(); }
      ctx.restore();
      // rótulos longos (ex.: −0,9) encolhem para caber na pedra
      const k = Math.min(1, 13 / G.textW(this.label));
      if (k < 1) { ctx.save(); ctx.translate(x + 8, y + 4.5 + (1 - k) * 4); ctx.scale(k, k); G.text(this.label, 0, 0, '#2a1a0a', { align: 'center', shadow: false }); ctx.restore(); }
      else G.text(this.label, x + 8, y + 4.5, '#2a1a0a', { align: 'center', shadow: false });
    }
  }
  PUZ.stonepath = (c) => {
    const { r, L, setL, map } = c;
    const rule = c.opt.rule || 'median';
    // sala com porta só à direita ou à esquerda: as fileiras viram colunas e a travessia é na horizontal
    const horiz = !r.doors.S && !r.doors.N && !!(r.doors.E || r.doors.W), fromE = horiz && !!r.doors.E;
    const rows = horiz ? (c.opt.rows || [7, 5, 3]).map((_, k) => fromE ? 17 - k * 3 : 6 + k * 3) : (c.opt.rows || [7, 5, 3]); // posição de cada fileira no eixo da travessia
    const cols = horiz ? [4, 5, 6, 7, 8] : [9, 10, 11, 12, 13]; // posições das 5 pedras no eixo transversal
    const at = (line, j) => (horiz ? [line, j] : [j, line]); // (lx, ly)
    const lava = !!c.opt.lava;
    const hole = lava ? T.LAVA : T.PIT;
    let done = c.solved;
    // área: fileiras de pedras (resto vira abismo) intercaladas com faixas firmes
    const top = Math.min(...rows) - 1, bot = Math.max(...rows) + 1;
    for (let a = top; a <= bot; a++) for (let b = 1; b < (horiz ? 12 : 23); b++) setL(...at(a, b), rows.includes(a) && !done && !cols.includes(b) ? hole : T.FLOOR);
    const state = rows.map(() => null);
    const stones = rows.map(() => []);
    const signs = [];
    const fill = (k) => {
      const row = genRow(rule); state[k] = row;
      for (const s of stones[k]) s.dead = true;
      stones[k] = cols.map((j, i) => { const s = new NumStone(...L(...at(rows[k], j)), row.labels[i]); s.room = r.idx; s.fake = i !== row.ok; return s; });
      for (const s of stones[k]) { if (G.map === map && G.curRoom === r.idx) G.addEnt(s); else c.add(s, r.idx); }
      if (signs[k]) { signs[k].txt = row.sign; signs[k].plot = row.plot; }
      for (const j of cols) setL(...at(rows[k], j), T.FLOOR);
    };
    rows.forEach((line, k) => {
      // placa da fileira: à esquerda dela (vertical) ou alternando em cima/embaixo da coluna (horizontal)
      const sx = horiz ? r.px + (line - 2) * TS : r.px + 3 * TS, sy = horiz ? r.py + (k % 2 ? 10 : 2) * TS + 3 : r.py + line * TS + 3;
      const sg = c.add(new Decal(sx, sy, 5 * TS, 10, (ctx, x, y, d) => { if (d.plot) miniPlot(ctx, x + d.w / 2 - 6, horiz && !(k % 2) ? y - 6 : y, d.plot); else tag(ctx, x + d.w / 2 - 6, y, d.txt || '', '#ffe27a'); }), r.idx);
      signs[k] = sg;
      if (!done) fill(k);
    });
    let regen = [];
    const topic = rule === 'z' ? 'normal' : rule === 'prob' ? 'prob' : rule === 'mean' ? 'media' : rule === 'corr' ? 'correlacao' : 'mediana';
    return {
      prompt: {
        median: '^yPONTE DA MEDIANA^0: em cada fileira só a pedra que é a ^gMEDIANA^0 dos cinco números aguenta o seu peso. As outras desabam! (Ordene de cabeça e pegue a do meio.)',
        z: '^yPONTE DO ESCORE-Z^0: cada placa diz a média μ, o desvio σ e um escore z. Pise na pedra com o valor ^gμ + z·σ^0. As outras desabam!',
        prob: '^yPONTE DO ACASO^0: pise na pedra com a ^gmaior^0 (ou ^gmenor^0) probabilidade, como diz a placa. As outras despencam!',
        mean: '^yPONTE DA MÉDIA^0: em cada fileira, pise na pedra que mostra a ^gMÉDIA^0 dos números da placa. As outras desabam!',
        corr: '^yPONTE DA CORRELAÇÃO^0: cada placa mostra um gráfico de dispersão. Pise na pedra com o coeficiente ^gr^0 que combina com ele. As outras desabam!'
      }[rule],
      dicas: {
        median: ['Coloque os cinco números em ordem crescente, de cabeça ou nos dedos.', 'Com 5 números em ordem, a mediana é o 3º: dois ficam abaixo dele e dois acima.'],
        z: ['O escore z diz quantos desvios padrão andar a partir da média. z positivo: para cima; negativo: para baixo.', 'Faça a conta μ + z·σ. Exemplo: μ = 50, σ = 5 e z = -2 dão 50 - 10 = 40.'],
        prob: ['Transforme cada fração em decimal (divida o de cima pelo de baixo) e compare.', 'Lembre: 1/2 = 0,5; 1/3 ≈ 0,33; 2/3 ≈ 0,67; 1/4 = 0,25; 3/4 = 0,75; 1/6 ≈ 0,17; 5/6 ≈ 0,83.'],
        mean: ['Some os três números da placa e divida por 3.', 'Cuidado com as pedras-armadilha: uma delas é a soma, outra é a mediana.'],
        corr: ['Pontos subindo da esquerda para a direita: r positivo. Descendo: r negativo. Nuvem sem direção: r perto de 0.', 'Quanto mais os pontos parecem uma reta fina, mais perto de 1 (ou −1) fica o r. Uma nuvem larga com alguma tendência fica perto de ±0,5.']
      }[rule],
      update(dt) {
        const p = G.player; if (!p || done) return;
        for (let i = regen.length - 1; i >= 0; i--) { regen[i].t -= dt; if (regen[i].t <= 0 && p.state !== 'fall') { fill(regen[i].k); regen.splice(i, 1); } }
        if (p.state === 'normal' && p.z <= 0) {
          const ltx = Math.floor(p.cx / TS) - r.x0, lty = Math.floor(p.cy / TS) - r.y0;
          const k = rows.indexOf(horiz ? ltx : lty), j = cols.indexOf(horiz ? lty : ltx);
          if (k >= 0 && j >= 0 && state[k]) {
            const s = stones[k][j];
            if (s && s.fake && !s.gone) {
              s.gone = true; setL(ltx, lty, hole);
              G.fx.burst(s.cx, s.cy, ['#a89a88', '#6a5c50'], 12, 60, { grav: 200 }); G.sfx('brick');
              G.recordQuiz(topic, false);
              G.ui.toast('A pedra desabou! Os números da fileira mudaram...', '#ff8a7a');
              regen.push({ k, t: 1.2 });
            } else if (s && !s.fake && !s.okd) { s.okd = true; G.sfx('correct'); G.recordQuiz(topic, true); }
          }
          const crossed = horiz ? (fromE ? ltx <= top : ltx >= bot) : (c.opt.down ? lty >= bot : lty <= top);
          if (crossed) {
            done = true;
            for (const line of rows) for (let b = 1; b < (horiz ? 12 : 23); b++) setL(...at(line, b), T.FLOOR);
            for (const row of stones) for (const s of row) s.dead = true;
            G.ui.toast('Travessia completa! Uma ponte firme se forma.', '#7aff8a');
            c.solve();
          }
        }
      },
      dbg: { stones, rows, cols, horiz }, rewardPos: horiz ? (fromE ? [3, 3] : [20, 3]) : c.opt.down ? [3, 11] : [3, 1]
    };
  };

  // ------------------------------------------------------------------
  //  ARENA DA MODA — derrote gosmas coloridas; placar ao vivo
  // ------------------------------------------------------------------
  const MODE_COLS = [['', 'Verde', '#5ad04a'], ['_ice', 'Azul', '#5aa8ff'], ['_lava', 'Vermelha', '#ff5a3a'], ['_sand', 'Amarela', '#ffd04a']];
  PUZ.tally = (c) => {
    const { r, L } = c;
    let counts = shuffle([5, 3, 2, 1].map(v => v + (c.opt.extra || 0)));
    const tally = [0, 0, 0, 0];
    let phase = c.solved ? 'done' : 'idle', queue = [], crystals = [];
    const board = c.add(new Board(r.px + 7 * TS, r.py + 1 * TS + 4, 10 * TS, 30, (ctx, x, y) => {
      ctx.save(); ctx.fillStyle = 'rgba(10,8,24,0.75)'; G.rrPath(ctx, x, y, 160, 28, 3); ctx.fill(); ctx.restore();
      // marcas de contagem (||||): o jogador conta, em vez de comparar barras prontas
      MODE_COLS.forEach(([, name, col], i) => {
        const bx = x + 6 + i * 38;
        ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(bx, y + 4, 34, 15);
        ctx.fillStyle = col;
        for (let k = 0; k < tally[i]; k++) {
          const g5 = Math.floor(k / 5), m = k % 5, gx = bx + 3 + g5 * 15;
          if (m < 4) ctx.fillRect(gx + m * 3, y + 6, 1, 11);
          else { ctx.save(); ctx.translate(gx - 1, y + 15); ctx.rotate(-0.55); ctx.fillRect(0, 0, 14, 1); ctx.restore(); }
        }
        G.text(name.slice(0, 4), bx + 17, y + 21, col, { align: 'center', shadow: false });
      });
    }), r.idx);
    const spawnWave = () => {
      const n = Math.min(4, queue.length);
      for (let i = 0; i < n; i++) {
        const ci = queue.shift();
        const [x, y] = L(G.rf(4, 19), G.rf(5, 9));
        const e = G.makeEnemy('gosma', x, y, { room: r.idx, variant: MODE_COLS[ci][0], tier: c.opt.tier || 1 });
        e.onDeath = () => { tally[ci]++; G.sfx('coin'); G.fx.text(e.cx, e.y - 14, '+1', MODE_COLS[ci][2]); };
        e.tallyMob = true;
        G.addEnt(e);
      }
    };
    return {
      prompt: '^yARENA DA MODA^0: derrote as gosmas. O placar marca um risco para cada gosma que cai (cinco riscos = um feixe). No fim, golpeie o cristal da cor que é a ^gMODA^0 (a mais frequente)!',
      dicas: ['Conte os riscos de cada cor no placar: cada feixe cortado vale 5.', 'A moda é a cor com MAIS riscos, não a última que caiu.'],
      enter() {
        if (phase === 'done') return;
        tally.fill(0); queue = []; counts.forEach((n, i) => { for (let k = 0; k < n; k++) queue.push(i); }); shuffle(queue);
        for (const k of crystals) k.dead = true; crystals = [];
        phase = 'fight'; c.lock(); spawnWave();
      },
      leave() { if (phase === 'fight' || phase === 'ask') phase = 'idle'; for (const e of G.ents) if (e.tallyMob) e.dead = true; },
      update() {
        if (phase !== 'fight') return;
        const alive = G.ents.some(e => e.tallyMob && !e.dead && e.room === r.idx);
        if (alive) return;
        if (queue.length) { spawnWave(); return; }
        phase = 'ask';
        const best = tally.indexOf(Math.max(...tally));
        crystals = MODE_COLS.map(([, name, col], i) => c.addLive(new G.AnswerCrystal(...L(6 + i * 4, 8), name, i === best, (cr) => {
          if (phase !== 'ask') return;
          if (cr.correct) { phase = 'done'; G.sfx('correct'); for (const k of crystals) k.shatter(); G.recordQuiz('moda', true); G.ui.toast('Moda = ' + name + ' (' + tally[i] + ' gosmas)  ✓', '#7aff8a'); c.unlock(); c.solve(); }
          else { G.sfx('shock'); G.hurtPlayer(2, cr.cx, cr.cy, { force: true }); cr.shatter(); G.recordQuiz('moda', false); G.ui.toast('Não! Compare as alturas do placar.', '#ff8a7a'); }
        }, { color: col })));
      },
      dbg: { tally }, rewardPos: [11, 10], noAutoEnemies: true
    };
  };

  // ------------------------------------------------------------------
  //  ARQUEIROS — dispersão observada nos alvos (desvio padrão)
  // ------------------------------------------------------------------
  class Arrow extends G.Ent {
    constructor(x, y, vx, target, dy, puz) { super(x, y, 10, 3); this.vx = vx; this.target = target; this.dy = dy; this.puz = puz; }
    update(dt) {
      this.t += dt; this.x += this.vx * dt;
      const p = G.player;
      if (p && p.state === 'normal' && p.z < 6 && G.overlap(this, { x: p.x, y: p.y - 10, w: p.w, h: p.h + 10 })) { G.hurtPlayer(2, this.cx - 10, this.cy); this.dead = true; return; }
      if (this.x + this.w >= this.target.x) { this.dead = true; this.target.hit(this.dy); G.sfx('tink'); }
    }
    get by() { return this.y + 6; }
    draw(ctx, cam) { G.draw(ctx, 'arrow', this.x - cam.x, this.y - cam.y); }
  }
  class TargetBoard extends G.Ent {
    constructor(x, y, label) { super(x, y - 16, 16, 48); this.solid = true; this.hits = []; this.label = label; }
    get darkGlow() { return 34; }
    hit(dy) { this.hits.push(dy); }
    get by() { return this.y + this.h; }
    draw(ctx, cam) {
      const x = this.x - cam.x, y = this.y - cam.y;
      ctx.save();
      ctx.fillStyle = '#3a2410'; ctx.fillRect(x + 2, y, 12, 48);
      const g = ctx.createLinearGradient(x, 0, x + 16, 0); g.addColorStop(0, '#f0e0c0'); g.addColorStop(1, '#c8b090');
      ctx.fillStyle = g; ctx.fillRect(x + 3, y + 1, 10, 46);
      for (const [k, col] of [[18, '#e03a3a'], [12, '#ffffff'], [6, '#e03a3a']]) { ctx.fillStyle = col; ctx.fillRect(x + 3, y + 24 - k, 10, k * 2); }
      ctx.fillStyle = '#ffd84a'; ctx.fillRect(x + 3, y + 23, 10, 2);
      // flechas cravadas: pontinhos empilhados à direita (gráfico de pontos)
      const bins = {};
      for (const dy of this.hits) {
        const b = Math.round(dy / 2) * 2; const k = bins[b] = (bins[b] || 0) + 1;
        ctx.fillStyle = '#1a1028'; ctx.fillRect(x + 1 - k * 2.5, y + 24 + b - 1, 2.5, 2);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 1.5 - k * 2.5, y + 24 + b - 0.5, 1.5, 1);
      }
      ctx.restore();
    }
    drawLate(ctx, cam) { tag(ctx, this.x + 8 - cam.x, this.y - 12 - cam.y, this.label); }
  }
  class ArcherStatue extends G.Ent {
    constructor(x, y, label) { super(x + 2, y + 8, 12, 8); this.solid = true; this.label = label; }
    get darkGlow() { return 26; }
    draw(ctx, cam) { const x = this.x - 2 - cam.x, y = this.y - 20 - cam.y; G.shadow(ctx, x + 8, this.y + this.h - cam.y, 14, 0.3); G.draw(ctx, 'archer', x, y); }
    drawLate(ctx, cam) { tag(ctx, this.x + 6 - cam.x, this.y - 30 - cam.y, this.label); }
  }
  // um arqueiro tem VIÉS (agrupa as flechas fora do centro), o outro tem VARIÂNCIA (espalha em volta
  // do centro); duas perguntas separam as duas ideias
  PUZ.archers = (c) => {
    const { r, L } = c;
    const turrets = [], boards = [];
    [3, 9].forEach((ly, i) => {
      const [tx, ty] = L(2, ly);
      const t = c.add(new ArcherStatue(tx, ty, 'AB'[i]), r.idx);
      turrets.push(t);
      boards.push(c.add(new TargetBoard(...L(21, ly), 'AB'[i]), r.idx));
    });
    let phase = c.solved ? 'done' : 'idle', shots = 0, cd = 0, crystals = [], vies = 0, desvio = 0;
    const N = 10;
    const fire = () => {
      if (phase === 'firing') return;
      for (const b of boards) b.hits = [];
      for (const k of crystals) k.dead = true; crystals = [];
      vies = ri(0, 1); desvio = (G.chance(0.5) ? 1 : -1) * G.rf(10, 13);
      phase = 'firing'; shots = 0; cd = 0.3; G.sfx('confirm');
    };
    c.add(new Lever(...L(11.5, 11), () => { if (phase !== 'done') fire(); else G.sfx('tink'); }), r.idx);
    const gauss = () => { const u = Math.max(1e-6, Math.random()), v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    const resumo = () => {
      const m = boards.map(b => st.mean(b.hits) / 2), s = boards.map(b => st.std(b.hits) / 2);
      return 'A: média ' + F(m[0], 1) + ', σ ≈ ' + F(s[0], 1) + '   B: média ' + F(m[1], 1) + ', σ ≈ ' + F(s[1], 1);
    };
    const PERG = {
      ask1: 'PERGUNTA 1/2: quem é mais CONSISTENTE (flechas mais juntas)?',
      ask2: 'PERGUNTA 2/2: quem acerta o centro EM MÉDIA (sem viés)?'
    };
    const perguntar = (fase) => {
      phase = fase;
      const okIdx = fase === 'ask1'
        ? (st.std(boards[0].hits) <= st.std(boards[1].hits) ? 0 : 1)
        : (Math.abs(st.mean(boards[0].hits)) <= Math.abs(st.mean(boards[1].hits)) ? 0 : 1);
      crystals = [0, 1].map(i => c.addLive(new G.AnswerCrystal(...L(9 + i * 5, 6), 'AB'[i], i === okIdx, (cr) => {
        if (phase !== fase) return;
        if (cr.correct) {
          G.sfx('correct'); for (const k of crystals) k.shatter(); crystals = [];
          if (fase === 'ask1') { G.ui.toast('Isso! ' + 'AB'[i] + ' tem a menor variância.', '#7aff8a'); perguntar('ask2'); return; }
          phase = 'done'; G.recordQuiz('desvio', true);
          const p = 'AB'[1 - i], s = 'AB'[i];
          G.ui.toast(p + ' é preciso, mas tem viés; ' + s + ' não tem viés, mas varia muito. O ideal: pouco viés E pouca variância.', '#7aff8a');
          c.solve();
        } else {
          G.sfx('shock'); G.hurtPlayer(2, cr.cx, cr.cy, { force: true }); for (const k of crystals) k.shatter(); crystals = []; phase = 'idle';
          G.recordQuiz('desvio', false); G.ui.toast('Errou! ' + resumo() + '. Atire de novo.', '#ff8a7a');
        }
      }, { color: i ? '#ffa040' : '#7ae4ff' })));
    };
    c.add(new Board(r.px + 5 * TS, r.py + 7 * TS + 12, 14 * TS, 12, (ctx, x, y) => { if (PERG[phase]) tag(ctx, x + 7 * TS, y, PERG[phase], '#ffe27a'); }, { front: true }), r.idx);
    return {
      prompt: '^yDUELO DOS ARQUEIROS^0: golpeie a alavanca para as estátuas A e B atirarem ' + N + ' flechas cada (cuidado!). Depois responda duas perguntas: quem é mais ^gCONSISTENTE^0 e quem acerta o centro ^gem média^0. Um deles tem ^rviés^0!',
      dicas: ['Consistente = flechas juntinhas, mesmo que longe do centro. Isso é ter pouca variância.', 'Em média no centro = sem viés: as flechas se espalham, mas equilibradas em volta da faixa dourada, tanto acima quanto abaixo.'],
      update(dt) {
        if (phase !== 'firing') return;
        cd -= dt;
        if (cd <= 0 && shots < N) {
          cd = 0.32; shots++;
          [3, 9].forEach((ly, i) => {
            const dy = G.clamp(i === vies ? desvio + gauss() * 2.5 : gauss() * 9, -20, 20);
            const [x, y] = L(3, ly);
            const a = new Arrow(x, y + 6, 230, boards[i], dy, null); a.room = r.idx;
            G.addEnt(a);
          });
          G.sfx('beam');
        }
        if (shots >= N && !G.ents.some(e => e instanceof Arrow && !e.dead)) perguntar('ask1');
      },
      leave() { if (phase !== 'done' && phase !== 'idle') { phase = 'idle'; for (const k of crystals) k.dead = true; crystals = []; } },
      dbg: { boards, fire, perguntar }, rewardPos: [11, 8]
    };
  };

  // ------------------------------------------------------------------
  //  RÉGUA DA AMPLITUDE — 3 pesos com amplitude E média pedidas
  // ------------------------------------------------------------------
  PUZ.rangeline = (c) => {
    const { r, L } = c, x0 = 4, row = 8, N = 15;
    let A, M, sol;
    for (;;) { const a = ri(1, 9), cc = a + ri(5, 9); if (cc > N) continue; const s3 = ri(Math.ceil((a + a + cc + 1) / 3), Math.floor((a + cc + cc - 1) / 3)); const b = 3 * s3 - a - cc; if (b > a && b < cc) { A = cc - a; M = s3; sol = [a, b, cc]; break; } }
    let init; do { const s = new Set(); while (s.size < 3) s.add(ri(1, N)); init = [...s]; } while (st.range(init) === A && st.mean(init) === M);
    const bounds = { x: r.px + x0 * TS, y: r.py + row * TS, w: N * TS, h: TS };
    const blocks = init.map(v => trackBlock(c, x0 + v - 1, row, bounds, { weight: true }));
    const valOf = b => Math.round((b.x - r.px) / TS) - x0 + 1;
    let done = c.solved;
    c.add(new Decal(r.px + x0 * TS, r.py + (row + 1) * TS, N * TS, 12, (ctx, x, y) => {
      ctx.fillStyle = 'rgba(255,230,160,0.55)'; ctx.fillRect(x, y + 1, N * TS, 1);
      for (let v = 1; v <= N; v++) { const px = x + (v - 1) * TS + 8; ctx.fillRect(px, y, 0.5, 3); floorNum(ctx, px, y + 4, String(v)); }
      const vals = blocks.map(valOf), lo = Math.min(...vals), hi = Math.max(...vals);
      ctx.fillStyle = 'rgba(255,160,64,0.8)'; ctx.fillRect(x + (lo - 1) * TS + 8, y - 22, (hi - lo) * TS, 1);
      ctx.fillRect(x + (lo - 1) * TS + 8, y - 25, 0.5, 6); ctx.fillRect(x + (hi - 1) * TS + 8, y - 25, 0.5, 6);
    }), r.idx);
    c.add(new Board(r.px + 6 * TS, r.py + 3 * TS, 12 * TS, 20, (ctx, x, y) => {
      const vals = blocks.map(valOf);
      const am = st.range(vals), mn = st.mean(vals);
      tag(ctx, x + 96, y - 6, 'amplitude = ' + am + '   (alvo ' + A + ')', am === A ? '#7aff8a' : '#ffa040');
      tag(ctx, x + 96, y + 7, 'média = ' + F(mn, 2) + '   (alvo ' + M + ')', Math.abs(mn - M) < 1e-9 ? '#7aff8a' : '#ffe27a');
    }), r.idx);
    return {
      dicas: ['Primeiro afaste o maior e o menor até a distância entre eles ser ' + A + '. Depois mova o peso do meio para ajustar a média.', 'A soma das três posições precisa ser 3 × ' + M + ' = ' + 3 * M + ', com o maior menos o menor igual a ' + A + '.'],
      prompt: '^yRÉGUA DA DISPERSÃO^0: posicione os 3 pesos na régua de modo que a ^oAMPLITUDE^0 (maior - menor) seja ^g' + A + '^0 e a ^yMÉDIA^0 seja ^g' + M + '^0 ao mesmo tempo.',
      update() {
        if (done || blocks.some(b => b.moving)) return;
        const vals = blocks.map(valOf);
        if (st.range(vals) === A && Math.abs(st.mean(vals) - M) < 1e-9) {
          done = true; for (const b of blocks) b.o.locked = true;
          G.ui.toast('Amplitude ' + Math.max(...vals) + ' - ' + Math.min(...vals) + ' = ' + A + ' e média ' + M + '  ✓', '#7aff8a');
          G.recordQuiz('amplitude', true); c.solve();
        }
      },
      dbg: { A, M, blocks, x0 }, rewardPos: [11, 11]
    };
  };

  // ------------------------------------------------------------------
  //  TABULEIRO DOS 36 — o espaço amostral de dois dados no chão
  // ------------------------------------------------------------------
  // coluna = dado vermelho, linha = dado azul; o herói pula (Z) numa casa para acendê-la
  class Casa extends G.Ent {
    constructor(x, y, a, b, puz) { super(x, y, 16, 16); this.a = a; this.b = b; this.puz = puz; this.flash = 0; this.glow = 0; }
    get by() { return -95000 + this.y; }
    update(dt) { this.t += dt; if (this.flash > 0) this.flash -= dt; if (this.glow > 0) this.glow -= dt; }
    draw(ctx, cam) {
      const x = this.x - cam.x, y = this.y - cam.y, P = this.puz, fora = P.fora(this), lit = P.acesas.has(this.a + ',' + this.b);
      ctx.save();
      ctx.fillStyle = '#1a1020'; ctx.fillRect(x, y, 16, 16);
      const g = ctx.createLinearGradient(0, y, 0, y + 16);
      if (lit) { g.addColorStop(0, '#ffe8a0'); g.addColorStop(1, '#e0a83a'); }
      else if (this.flash > 0) { g.addColorStop(0, '#ff8a7a'); g.addColorStop(1, '#a8302a'); }
      else { g.addColorStop(0, fora ? '#3a3040' : '#7a6a78'); g.addColorStop(1, fora ? '#241c2a' : '#4a3e4c'); }
      ctx.fillStyle = g; G.rrPath(ctx, x + 1, y + 1, 14, 14, 2); ctx.fill();
      ctx.fillStyle = lit ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.12)'; ctx.fillRect(x + 2.5, y + 1.5, 11, 0.5);
      // as casas do evento já achadas mostram a soma
      if (lit) G.text(String(this.a + this.b), x + 8, y + 4.5, '#5a2a00', { align: 'center', shadow: false });
      ctx.restore();
      if (lit || this.glow > 0) G.light.add(x + 8, y + 8, 22, '#ffd27a', lit ? 0.5 : this.glow);
    }
  }
  const TAB_DIE = { a: '#d03a3a', b: '#3a6ad0' };
  PUZ.tabuleiro = (c) => {
    const { r, L } = c, gx = 9, gy = 3; // canto da grade (casa 1,1)
    const k = ri(1, 6), v = ri(3, 5);
    const etapas = [
      { txt: 'SOMA = 7', pede: 'acenda as casas em que a ^ySOMA é 7^0', ok: (a, b) => a + b === 7,
        fim: 'Soma 7: 6 casas de 36 = 1/6. Nenhuma outra soma tem tantas casas!',
        dicas: ['Para cada número do vermelho (1 a 6) existe exatamente um azul que completa 7: 1+6, 2+5...', 'As casas da soma 7 formam uma diagonal inteira, de um canto ao outro do tabuleiro.'] },
      { txt: 'PELO MENOS UM ' + k, pede: 'acenda as casas com ^yPELO MENOS UM ' + k + '^0 (em qualquer dado)', ok: (a, b) => a === k || b === k,
        fim: 'Pelo menos um ' + k + ': 11 casas, e não 12! A casa (' + k + ',' + k + ') conta uma vez só. P = 11/36.',
        dicas: ['Vale o ' + k + ' no vermelho OU no azul: a coluna inteira do ' + k + ' e a linha inteira do ' + k + '.', 'Coluna (6 casas) + linha (6 casas) − a casa (' + k + ',' + k + '), que está nas duas = 11 casas.'] },
      { txt: 'VERMELHO = ' + v + '  →  SOMA ≥ 8', pede: 'o dado ^rVERMELHO caiu ' + v + '^0. Na coluna dele, acenda as casas com ^ySOMA 8 ou mais^0', univ: (a) => a === v, ok: (a, b) => a + b >= 8,
        fim: 'Sabendo que o vermelho caiu ' + v + ', só 6 casas contam: ' + (v - 1) + ' de 6. Sem essa informação, soma ≥ 8 seria 15 de 36.',
        dicas: ['Agora só a coluna do vermelho ' + v + ' importa: as outras casas saíram do universo. Quanto o azul precisa tirar para a soma chegar a 8?', 'O azul precisa ser pelo menos ' + (8 - v) + ': as casas ' + v + '+' + (8 - v) + ' até ' + v + '+6.'] }
    ];
    const P = { acesas: new Set(), etapa: c.solved ? 3 : 0, pausa: 0 };
    const E = () => etapas[Math.min(P.etapa, 2)];
    P.fora = (cs) => P.etapa < 3 && !!E().univ && !E().univ(cs.a);
    const alvo = () => { const e = E(), s = []; for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if ((!e.univ || e.univ(a)) && e.ok(a, b)) s.push(a + ',' + b); return s; };
    if (c.solved) for (let a = 1; a <= 6; a++) P.acesas.add(a + ',' + (7 - a));
    const casas = [];
    for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) casas.push(c.add(new Casa(...L(gx + a - 1, gy + b - 1), a, b, P), r.idx));
    const lamps = [0, 1, 2].map(i => c.add(new G.Torch(...L(9 + i * 3, 0), { room: r.idx, lit: c.solved, blue: true }), r.idx));
    // eixos: faces do dado vermelho em cima, do azul à esquerda
    c.add(new Decal(r.px + (gx - 1) * TS, r.py + (gy - 1) * TS, 7 * TS, 7 * TS, (ctx, x, y) => {
      for (let n = 1; n <= 6; n++) { G.dieFace(ctx, x + n * TS + 3, y + 4, n, 10, TAB_DIE.a); G.dieFace(ctx, x + 3, y + n * TS + 3, n, 10, TAB_DIE.b); }
    }), r.idx);
    // placar da etapa e leitura da casa sob o herói
    c.add(new Board(r.px + 6 * TS, r.py + 10 * TS, 12 * TS, 24, (ctx, x, y) => {
      if (P.etapa >= 3) { tag(ctx, x + 96, y, 'Tabuleiro completo: 36 resultados, todos igualmente prováveis', '#7aff8a'); return; }
      const n = [...P.acesas].length;
      tag(ctx, x + 96, y, 'ETAPA ' + (P.etapa + 1) + '/3:  ' + E().txt + '   ·   acesas: ' + n, P.pausa > 0 ? '#7aff8a' : '#ffe27a');
      const p = G.player, cs = p && casas.find(o => G.overlap({ x: p.cx - 1, y: p.cy - 1, w: 2, h: 2 }, o));
      if (cs) tag(ctx, x + 96, y + 12, 'vermelho ' + cs.a + ' + azul ' + cs.b + ' = ' + (cs.a + cs.b), '#c8e0ff');
    }, { front: true }), r.idx);
    let prevZ = 0;
    const pular = (cs) => {
      const key = cs.a + ',' + cs.b;
      if (P.acesas.has(key)) return;
      const e = E();
      if (e.univ && !e.univ(cs.a)) { G.sfx('tink'); G.ui.toast('Essa casa saiu do universo: o vermelho já caiu ' + v + '.', '#c8c8ff'); return; }
      if (e.ok(cs.a, cs.b)) {
        P.acesas.add(key); cs.glow = 0.6; G.sfx('switch'); G.fx.burst(cs.cx, cs.cy, ['#ffe8a0', '#ffffff'], 8, 40);
        const falta = alvo().filter(s => !P.acesas.has(s)).length;
        if (!falta) {
          G.sfx('secret'); lamps[P.etapa].lit = true; G.ui.toast(e.fim, '#7aff8a');
          P.pausa = 2.2;
        }
      } else {
        cs.flash = 0.5; G.sfx('shock'); c.erro();
        G.hurtPlayer(1, cs.cx, cs.cy, { force: true, noKb: true });
        G.ui.toast('vermelho ' + cs.a + ' + azul ' + cs.b + (e.txt.startsWith('PELO') ? ': nenhum dos dois é ' + k : ' = ' + (cs.a + cs.b) + (P.etapa === 0 ? ', não 7' : ', menos que 8')), '#ff8a7a');
      }
    };
    return {
      prompt: '^yTABULEIRO DOS 36^0: cada casa do chão é um resultado de dois dados (coluna = dado ^rvermelho^0, linha = dado ^cazul^0). ^gPule (Z)^0 nas casas pedidas para acendê-las. Ache TODAS para passar de etapa: são três.',
      dicas: () => E().dicas,
      update(dt) {
        if (P.etapa >= 3) return;
        if (P.pausa > 0) {
          P.pausa -= dt;
          if (P.pausa <= 0) {
            P.etapa++; P.acesas.clear();
            if (P.etapa >= 3) { for (let a = 1; a <= 6; a++) P.acesas.add(a + ',' + (7 - a)); G.recordQuiz('combinada', true); c.solve(); }
            else G.ui.toast('ETAPA ' + (P.etapa + 1) + ': ' + E().pede.replace(/\^./g, '') + '.', '#ffe27a');
          }
          return;
        }
        const p = G.player; if (!p) return;
        const landed = prevZ > 0 && p.z <= 0; prevZ = p.z;
        if (!landed || p.state !== 'normal') return;
        const cs = casas.find(o => p.cx >= o.x && p.cx < o.x + 16 && p.cy >= o.y && p.cy < o.y + 16);
        if (cs) pular(cs);
      },
      dbg: { P, casas, pular, alvo }, rewardPos: [19, 6]
    };
  };

  // ------------------------------------------------------------------
  //  HISTOGRAMA NO GELO — empurre blocos para as faixas certas
  // ------------------------------------------------------------------
  PUZ.hist = (c) => {
    const { r, L, setL } = c;
    const lanes = [4, 7, 16, 19], labs = ['0-9', '10-19', '20-29', '30-39'];
    let freq; do { freq = lanes.map(() => ri(1, 4)); } while (st.sum(freq) < 6 || st.sum(freq) > 8 || new Set(freq).size < 3);
    const data = []; freq.forEach((f, i) => { for (let k = 0; k < f; k++) data.push(i * 10 + ri(0, 9)); }); shuffle(data);
    // faixas de gelo separadas por paredes
    for (let ly = 1; ly <= 5; ly++) for (let lx = 3; lx <= 20; lx++) if (lx < 10 || lx > 13) setL(lx, ly, lanes.includes(lx) ? T.ICE : T.WALL);
    const total = st.sum(freq);
    const startPos = [];
    const blocks = [];
    let done = c.solved;
    if (!done) {
      const used = new Set();
      while (startPos.length < total) { const lx = ri(7, 20), ly = ri(8, 10); const k = lx + ',' + ly; if (used.has(k) || (lx >= 10 && lx <= 13 && ly === 8)) continue; used.add(k); startPos.push([lx, ly]); }
      for (const [lx, ly] of startPos) { const b = c.add(new G.PushBlock(...L(lx, ly), null, { slide: true }), r.idx); b.bounds = { x: r.px + TS, y: r.py + TS, w: 22 * TS, h: 10 * TS }; blocks.push(b); }
    } else freq.forEach((f, i) => { for (let k = 0; k < f; k++) c.add(new G.PushBlock(...L(lanes[i], 1 + k), null, { locked: true }), r.idx); });
    const naFaixa = (lx) => blocks.filter(b => Math.round((b.x - r.px) / TS) === lx && Math.round((b.y - r.py) / TS) <= 5).length;
    lanes.forEach((lx, i) => c.add(new Decal(r.px + lx * TS - 8, r.py + 6 * TS + 3, 32, 10, (ctx, x, y) => tag(ctx, x + 16, y, done ? labs[i] : labs[i] + ': ' + naFaixa(lx), '#c8f0ff')), r.idx));
    // quadro com os dados
    c.add(new Board(r.px + 1 * TS + 2, r.py + 7 * TS, 72, 60, (ctx, x, y) => {
      ctx.save(); ctx.fillStyle = 'rgba(10,14,34,0.85)'; G.rrPath(ctx, x, y, 72, 58, 3); ctx.fill(); ctx.strokeStyle = '#7ae4ff'; ctx.lineWidth = 0.5; G.rrPath(ctx, x + 0.25, y + 0.25, 71.5, 57.5, 3); ctx.stroke(); ctx.restore();
      G.text('IDADES', x + 36, y + 3, '#7ae4ff', { align: 'center', shadow: false });
      data.forEach((v, i) => G.text(String(v), x + 8 + (i % 4) * 16, y + 14 + Math.floor(i / 4) * 10, '#ffffff', { shadow: false }));
    }), r.idx);
    const reset = () => { blocks.forEach((b, i) => { b.x = b.tx = r.px + startPos[i][0] * TS; b.y = b.ty = r.py + startPos[i][1] * TS; b.moving = false; }); G.sfx('teleport'); };
    if (!done) c.add(new G.AnswerCrystal(...L(21, 10), '↺', false, () => { if (!done) reset(); }, { color: '#c8c8ff' }), r.idx);
    return {
      prompt: '^yHISTOGRAMA DE GELO^0: o quadro lista ' + total + ' idades. Empurre um bloco para cada idade na ^cfaixa da sua classe^0 (0-9, 10-19...). Os blocos deslizam no gelo e se empilham: as colunas formam o histograma! Use o cristal ↺ se travar.',
      dicas: ['Conte no quadro quantas idades caem em cada classe: de 0 a 9, de 10 a 19, e assim por diante.', 'Cada faixa precisa de um bloco por idade daquela classe. A etiqueta embaixo da faixa mostra quantos já estão lá.'],
      update() {
        if (done || blocks.some(b => b.moving)) return;
        const cnt = lanes.map(naFaixa);
        if (cnt.every((v, i) => v === freq[i])) {
          done = true; for (const b of blocks) b.o.locked = true;
          G.ui.toast('Histograma correto: ' + freq.join(', ') + '  ✓', '#7aff8a'); G.recordQuiz('freq', true); c.solve();
        }
      },
      dbg: { freq, lanes, blocks }, rewardPos: [11, 3]
    };
  };

  // ------------------------------------------------------------------
  //  PESQUISA NO SALÃO — amostragem (e viés de seleção)
  // ------------------------------------------------------------------
  class SurveyStatue extends G.Ent {
    constructor(x, y, traitor, puz) { super(x + 2, y + 8, 10, 8); this.solid = true; this.traitor = traitor; this.puz = puz; this.asked = false; }
    interBox() { return { x: this.x - 3, y: this.y - 14, w: this.w + 6, h: this.h + 18 }; }
    interact() { this.puz.ask(this); }
    onHit() { this.puz.ask(this); return false; }
    get darkGlow() { return 18; }
    draw(ctx, cam) {
      const x = this.x - 2 - cam.x, y = this.y - 14 - cam.y;
      G.shadow(ctx, x + 7, this.y + this.h - cam.y, 12, 0.3);
      G.draw(ctx, 'armorStatue', x, y, this.asked ? { tint: this.traitor ? 'rgba(255,60,80,0.45)' : 'rgba(80,140,255,0.45)' } : undefined);
      if (this.asked) G.light.add(x + 7, y + 6, 18, this.traitor ? '#ff4060' : '#4080ff', 0.5);
    }
    drawLate(ctx, cam) { if (this.asked) G.text(this.traitor ? 'V' : 'R', this.x + 5 - cam.x, this.y - 22 - cam.y, this.traitor ? '#ff6a7a' : '#7ab0ff', { align: 'center' }); }
  }
  PUZ.survey = (c) => {
    const { r, L } = c;
    const cols = [4, 7, 10, 13, 16, 19], rowsY = [3, 5, 7, 9];
    const pRow = [0.85, 0.6, 0.35, 0.1]; // perto do trono (norte) há mais traidores
    const MAXQ = c.opt.max || 8;
    let statues = [], asked = [], done = c.solved, trueP = 0;
    const puz = {};
    const build = () => {
      for (const s of statues) s.dead = true;
      statues = []; asked = [];
      rowsY.forEach((ly, k) => cols.forEach(lx => { const s = new SurveyStatue(...L(lx, ly), Math.random() < pRow[k], puz); s.room = r.idx; s.row = k; s.col = lx; statues.push(s); }));
      trueP = statues.filter(s => s.traitor).length / statues.length;
    };
    build();
    if (done) for (const s of statues) s.asked = true;
    for (const s of statues) c.add(s, r.idx);
    puz.ask = (s) => {
      if (done || s.asked) return;
      if (asked.length >= MAXQ) { G.ui.toast('Você já fez ' + MAXQ + ' perguntas! Vá ao Oráculo estimar.', '#ffd84a'); return; }
      s.asked = true; asked.push(s); G.sfx(s.traitor ? 'shock' : 'select');
      G.ui.toast((s.traitor ? 'Leal ao VIÉS!' : 'Leal ao Reino.') + '  Amostra: ' + asked.filter(a => a.traitor).length + '/' + asked.length + ' traidores', s.traitor ? '#ff8a9a' : '#8ab0ff');
    };
    c.add(new Board(r.px + 7 * TS, r.py + 11 * TS + 2, 10 * TS, 12, (ctx, x, y) => {
      const n = asked.length, k = asked.filter(a => a.traitor).length;
      tag(ctx, x + 80, y, done ? 'Estimativa aceita!' : 'Perguntas: ' + n + '/' + MAXQ + '   traidores na amostra: ' + k + (n ? ' (' + Math.round(k / n * 100) + '%)' : ''), done ? '#7aff8a' : '#ffe27a');
    }, { front: true }), r.idx);
    // oráculo para estimar
    c.add(new G.Oracle(...L(21, 10), null, { repeatable: true, custom: async () => {
      if (done) { await G.ui.say('Oráculo', 'Sua pesquisa foi impecável.'); return; }
      if (asked.length < Math.min(6, MAXQ)) { await G.ui.say('Oráculo', 'Pergunte a pelo menos 6 armaduras antes de estimar. Escolha bem QUEM perguntar!'); return; }
      const bins = ['0% a 20%', '20% a 40%', '40% a 60%', '60% a 80%', '80% a 100%'];
      const i = await G.ui.choose(bins.concat(['Ainda não']), { prompt: 'Que porcentagem das ' + statues.length + ' armaduras do salão é leal ao Viés?', cancel: 5, name: 'Oráculo' });
      if (i < 0 || i >= 5) return;
      // julga o MÉTODO: a amostra cobre o salão inteiro e a faixa bate com o que ela mostrou
      // (com só 8 perguntas, mesmo uma boa amostra erra a faixa real em mais da metade das vezes)
      const lo = i * 0.2, hi = lo + 0.2, dentro = v => v >= lo - 1e-9 && v <= hi + 1e-9;
      const k = asked.filter(a => a.traitor).length, est = k / asked.length, real = Math.round(trueP * 100);
      const rowsHit = new Set(asked.map(a => a.row)).size;
      const ok = rowsHit === 4 && (dentro(est) || dentro(trueP));
      G.recordQuiz('amostra', ok);
      if (ok) {
        done = true; for (const s of statues) s.asked = true; G.sfx('correct');
        await G.ui.say('Oráculo', 'Estimativa aceita! Sua amostra deu ' + k + ' de ' + asked.length + ' (' + Math.round(est * 100) + '%) e o salão inteiro tem ' + real + '%. Você perguntou em todas as fileiras: assim a amostra representa a população.');
        if (Math.abs(est - trueP) >= 0.1) await G.ui.say('Oráculo', 'A diferença de ' + Math.abs(Math.round(est * 100) - real) + ' pontos é o ^yerro amostral^0: com só ' + asked.length + ' perguntas, é normal a amostra se afastar um pouco da verdade.');
        c.solve();
      } else {
        G.hurtPlayer(2, undefined, undefined, { force: true, noKb: true });
        if (rowsHit < 4) await G.ui.say('Oráculo', 'Você só perguntou em ' + rowsHit + ' das 4 fileiras! Perto do trono há mais traidores, longe dele menos. Uma amostra que deixa grupos de fora tem ^rVIÉS DE SELEÇÃO^0, mesmo que acerte por sorte. (O salão tinha ' + real + '%.)');
        else await G.ui.say('Oráculo', 'Sua amostra deu ' + k + ' de ' + asked.length + ' = ' + Math.round(est * 100) + '%, mas você escolheu ' + bins[i] + '. Faça a conta: traidores ÷ perguntas. (O salão tinha ' + real + '%.)');
        await G.ui.say('Oráculo', 'As armaduras trocaram de lugar. Tente uma nova amostra.');
        build(); for (const s of statues) G.addEnt(s);
      }
    } }), r.idx);
    return {
      prompt: '^yPESQUISA NO SALÃO^0: algumas armaduras são leais ao ^rViés^0. Você só pode perguntar a ^y' + MAXQ + '^0 delas (golpeie ou fale). Depois estime, no Oráculo, a porcentagem de traidores no SALÃO INTEIRO. Quem você escolhe importa: o salão tem ^c4 fileiras^0!',
      dicas: ['Não pergunte só às armaduras mais perto de você: o salão muda do trono até a porta. Pergunte em TODAS as 4 fileiras.', 'Duas perguntas por fileira dão uma amostra equilibrada. No Oráculo, escolha a faixa da conta traidores ÷ perguntas.'],
      dbg: { statues: () => statues }, rewardPos: [2, 10]
    };
  };

  // ------------------------------------------------------------------
  //  DISPERSÃO NO CHÃO — monte uma correlação positiva/negativa
  // ------------------------------------------------------------------
  PUZ.scatter = (c) => {
    const { r, L } = c;
    const want = c.opt.want || pick(['pos', 'neg']);
    const xs = [6, 9, 12, 15, 18], top = 2, bot = 9;
    const blocks = [];
    let init; do { init = xs.map(() => ri(top, bot)); } while (Math.abs(corr(init)) > 0.35);
    xs.forEach((lx, i) => { const b = c.add(new G.PushBlock(...L(lx, init[i]), null, { locked: c.solved, dot: true }), r.idx); b.bounds = { x: r.px + lx * TS, y: r.py + top * TS, w: TS, h: (bot - top + 1) * TS }; blocks.push(b); });
    function corr(rowsArr) { const X = [1, 2, 3, 4, 5], Y = rowsArr.map(v => bot - v); const mx = st.mean(X), my = st.mean(Y); let sxy = 0, sxx = 0, syy = 0; for (let i = 0; i < 5; i++) { sxy += (X[i] - mx) * (Y[i] - my); sxx += (X[i] - mx) ** 2; syy += (Y[i] - my) ** 2; } return syy ? sxy / Math.sqrt(sxx * syy) : 0; }
    const rows = () => blocks.map(b => Math.round((b.y - r.py) / TS));
    // inclinação da reta de mínimos quadrados, em casas de altura por ponto
    function incl(rowsArr) { const X = [1, 2, 3, 4, 5], Y = rowsArr.map(v => bot - v), mx = st.mean(X), my = st.mean(Y); let sxy = 0, sxx = 0; for (let i = 0; i < 5; i++) { sxy += (X[i] - mx) * (Y[i] - my); sxx += (X[i] - mx) ** 2; } return sxy / sxx; }
    // fase 1: correlação forte; fase 2: a mesma força com a reta quase deitada (r mede alinhamento, não inclinação)
    const MAXB = 0.6, sgn = want === 'pos' ? 1 : -1;
    let done = c.solved, fase = c.solved ? 2 : 1;
    const meta = (rr, bb) => sgn * rr >= 0.9 && (fase === 1 || Math.abs(bb) <= MAXB + 1e-9);
    c.add(new Decal(r.px + 4 * TS, r.py + top * TS, 17 * TS, (bot - top + 2) * TS, (ctx, x, y) => {
      ctx.save();
      ctx.fillStyle = 'rgba(255,230,160,0.5)'; ctx.fillRect(x + 12, y, 1, (bot - top + 1) * TS + 2); ctx.fillRect(x + 12, y + (bot - top + 1) * TS + 1, 15 * TS, 1);
      xs.forEach((lx, i) => floorNum(ctx, x + (lx - 4) * TS + 8, y + (bot - top + 1) * TS + 4, String(i + 1)));
      floorNum(ctx, x + 6, y - 2, 'y'); floorNum(ctx, x + 15 * TS + 10, y + (bot - top + 1) * TS - 2, 'x');
      // reta de tendência (mínimos quadrados) ao vivo
      const R = rows(), X = [1, 2, 3, 4, 5], Y = R.map(v => bot - v), mx = st.mean(X), my = st.mean(Y);
      let sxy = 0, sxx = 0; for (let i = 0; i < 5; i++) { sxy += (X[i] - mx) * (Y[i] - my); sxx += (X[i] - mx) ** 2; }
      const b1 = sxy / sxx, b0 = my - b1 * mx;
      const px = v => x + (xs[0] - 4) * TS + 8 + (v - 1) * 3 * TS, py = v => y + (bot - v - top) * TS + 8;
      ctx.strokeStyle = done ? 'rgba(122,255,138,0.8)' : 'rgba(255,154,230,0.7)'; ctx.lineWidth = 1; ctx.setLineDash([3, 2]);
      ctx.beginPath(); ctx.moveTo(px(0.6), py(b0 + b1 * 0.6)); ctx.lineTo(px(5.4), py(b0 + b1 * 5.4)); ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
    }), r.idx);
    c.add(new Board(r.px + 7 * TS, r.py + 11 * TS + 2, 10 * TS, 12, (ctx, x, y) => {
      const R = rows(), rr = corr(R), bb = incl(R), alvoR = want === 'pos' ? 'r ≥ 0,9' : 'r ≤ -0,9';
      if (fase === 1) tag(ctx, x + 80, y, 'FASE 1/2   r = ' + F(rr, 2) + '   (meta: ' + alvoR + ')', meta(rr, bb) ? '#7aff8a' : '#ffe27a');
      else tag(ctx, x + 80, y, 'FASE 2/2   r = ' + F(rr, 2) + ' (meta ' + alvoR.slice(2) + ')   inclinação = ' + F(bb, 2) + ' (meta ±' + F(MAXB, 1) + ')', meta(rr, bb) ? '#7aff8a' : '#ffe27a');
    }, { front: true }), r.idx);
    return {
      prompt: '^yGRÁFICO DE DISPERSÃO^0: cada bloco é um ponto (x = coluna, y = altura). Empurre-os para cima ou para baixo e monte uma ^gcorrelação ' + (want === 'pos' ? 'POSITIVA^0 (quanto maior x, maior y)' : 'NEGATIVA^0 (quanto maior x, menor y)') + '. A reta pontilhada e o coeficiente ^cr^0 mostram o quanto você chegou perto. Depois vem uma ^ysegunda fase^0!',
      dicas: () => fase === 1
        ? ['Faça os pontos ' + (want === 'pos' ? 'subirem' : 'descerem') + ' da esquerda para a direita, quase em linha reta, como uma escada.', 'r perto de ' + (want === 'pos' ? '1' : '-1') + ' quer dizer pontos colados na reta pontilhada. Ajuste o ponto que estiver mais longe dela.']
        : ['O r mede o quanto os pontos se alinham, não o quanto a reta é inclinada. Uma escada bem baixinha também é uma reta!', 'Tente alturas como 0, 0, 1, 1, 2 (contando da linha de baixo): ' + (want === 'pos' ? 'subindo' : 'descendo') + ' meia casa por ponto.'],
      update() {
        if (done || blocks.some(b => b.moving)) return;
        const R = rows(), rr = corr(R), bb = incl(R);
        if (!meta(rr, bb)) return;
        if (fase === 1) {
          fase = 2; G.sfx('secret');
          G.ui.toast('r = ' + F(rr, 2) + ', inclinação ' + F(bb, 2) + ': correlação forte  ✓  FASE 2: mantenha r forte com a reta quase deitada!', '#7aff8a');
          return;
        }
        done = true; for (const b of blocks) b.o.locked = true;
        G.ui.toast('r = ' + F(rr, 2) + ' com inclinação de só ' + F(bb, 2) + ': r mede o alinhamento, não a inclinação  ✓', '#7aff8a');
        G.recordQuiz('correlacao', true); c.solve();
      },
      dbg: { want, blocks, xs, top, bot }, rewardPos: [21, 10]
    };
  };
  // ------------------------------------------------------------------
  //  SINO DE GELO — cercar 68% e 95% de uma normal com dois marcos
  // ------------------------------------------------------------------
  // Φ(z) pela aproximação de Abramowitz e Stegun (erro < 1,5e-7)
  const PHI = z => { const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2), e = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z / 2); return z >= 0 ? (1 + e) / 2 : (1 - e) / 2; };
  G.PHI = PHI;
  PUZ.sino = (c) => {
    const { r, add } = c, x0 = 1;
    const sg = pick([2, 3, 4]), mu = ri(Math.max(2 * sg + 1, 8), Math.min(20 - 2 * sg, 12));
    const ALVOS = [{ k: 1, pct: '68%' }, { k: 2, pct: '95%' }];
    let etapa = c.solved ? 2 : 0;
    const area = v => PHI((v[1] - mu) / sg) - PHI((v[0] - mu) / sg);
    const blocks = G.puzRail(c, ['INF', 'SUP'], c.solved ? [mu - 2 * sg, mu + 2 * sg] : [1, 20], x0, () => {
      if (etapa >= 2 || blocks.some(b => b.moving)) return;
      const v = blocks.map(b => valOfRail(b, r, x0)), k = ALVOS[etapa].k;
      if (v[0] !== mu - k * sg || v[1] !== mu + k * sg) return;
      G.sfx('secret');
      G.ui.toast('μ ± ' + (k === 1 ? '' : '2') + 'σ: de ' + v[0] + ' a ' + v[1] + ' ficam ' + F(area(v) * 100, 1) + '% dos dados  ✓', '#7aff8a');
      etapa++;
      if (etapa >= 2) { for (const b of blocks) b.o.locked = true; G.recordQuiz('normal', true); c.solve(); }
    }, (ctx, x, y, v) => {
      // o sino em cima da régua, com a área entre os marcos acesa
      const px = val => x + (val - 1) * TS + 8, base = y - 24, alt = 46;
      const h = val => alt * Math.exp(-((val - mu) ** 2) / (2 * sg * sg));
      ctx.save();
      const lo = Math.min(v[0], v[1]), hi = Math.max(v[0], v[1]);
      if (hi > lo) {
        ctx.fillStyle = etapa >= 2 ? 'rgba(122,255,138,0.35)' : 'rgba(122,228,255,0.35)';
        ctx.beginPath(); ctx.moveTo(px(lo), base);
        for (let t = lo; t <= hi + 1e-9; t += 0.1) ctx.lineTo(px(t), base - h(t));
        ctx.lineTo(px(hi), base); ctx.closePath(); ctx.fill();
      }
      ctx.strokeStyle = '#e8f8ff'; ctx.lineWidth = 1; ctx.beginPath();
      for (let t = 0.6; t <= 20.4; t += 0.1) { if (t === 0.6) ctx.moveTo(px(t), base - h(t)); else ctx.lineTo(px(t), base - h(t)); }
      ctx.stroke();
      ctx.fillStyle = 'rgba(232,248,255,0.5)'; ctx.fillRect(px(0.6), base, px(20.4) - px(0.6), 0.5);
      ctx.fillStyle = '#ffd84a'; ctx.fillRect(px(mu) - 0.25, base - alt - 2, 0.5, alt + 2);
      ctx.restore();
      G.text('μ', px(mu), base - alt - 10, '#ffd84a', { align: 'center', shadow: false });
      if (hi > lo) tag(ctx, px((lo + hi) / 2), base - alt * 0.45, F(area([lo, hi]) * 100, 1) + '%', etapa >= 2 ? '#7aff8a' : '#c8f0ff');
    });
    add(new Board(r.px + 6 * TS, r.py + 1 * TS + 2, 12 * TS, 14, (ctx, x, y) => {
      tag(ctx, x + 6 * TS, y, etapa >= 2 ? 'μ = ' + mu + '   σ = ' + sg + '   ·   68% e 95% cercados!' : 'μ = ' + mu + '   σ = ' + sg + '   ·   ETAPA ' + (etapa + 1) + '/2: cerque ' + ALVOS[etapa].pct + ' dos dados', etapa >= 2 ? '#7aff8a' : '#ffe27a');
    }, { front: true }), r.idx);
    return {
      prompt: '^ySINO DE GELO^0: o sino é uma distribuição normal (μ e σ no quadro). Empurre os marcos ^yINF^0 e ^ySUP^0 pela régua: a área entre eles acende e mostra a porcentagem. Cerque primeiro ^g68%^0 dos dados e depois ^g95%^0, de forma simétrica em volta de μ.',
      dicas: () => etapa === 0
        ? ['68% dos dados ficam a até 1 desvio padrão da média: de μ − σ até μ + σ.', 'Com μ = ' + mu + ' e σ = ' + sg + ', os marcos vão em ' + (mu - sg) + ' e ' + (mu + sg) + '.']
        : ['95% dos dados ficam a até 2 desvios padrão da média: de μ − 2σ até μ + 2σ.', 'Os marcos vão em ' + (mu - 2 * sg) + ' e ' + (mu + 2 * sg) + '.'],
      rewardPos: [11, 6], dbg: { mu, sg, blocks }
    };
  };

  // ------------------------------------------------------------------
  //  URNAS OPACAS — estimar proporções tirando bolas (com reposição)
  // ------------------------------------------------------------------
  class UrnaOpaca extends G.Ent {
    constructor(x, y, label, p, puz) { super(x + 1, y + 6, 14, 10); this.solid = true; this.label = label; this.p = p; this.puz = puz; this.g = 0; this.n = 0; this.cd = 0; this.shake = 0; }
    get darkGlow() { return 30; }
    interBox() { return { x: this.x - 3, y: this.y - 14, w: this.w + 6, h: this.h + 18 }; }
    interact() { this.puz.tirar(this); }
    onHit() { this.puz.tirar(this); return false; }
    update(dt) { this.t += dt; if (this.cd > 0) this.cd -= dt; if (this.shake > 0) this.shake -= dt; }
    draw(ctx, cam) {
      const sx = this.shake > 0 ? Math.sin(this.shake * 60) : 0, x = this.x - 1 - cam.x + sx, base = this.y + this.h - cam.y;
      G.shadow(ctx, x + 8, base, 16, 0.35);
      ctx.save();
      ctx.fillStyle = '#1b1428'; ctx.beginPath(); ctx.ellipse(x + 8, base - 9, 8.5, 10, 0, 0, Math.PI * 2); ctx.fill();
      const g = ctx.createLinearGradient(x, 0, x + 16, 0); g.addColorStop(0, '#c87a4a'); g.addColorStop(0.45, '#9a5a32'); g.addColorStop(1, '#5a3220');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x + 8, base - 9, 7.5, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3a2418'; ctx.fillRect(x + 4, base - 20, 8, 3);
      ctx.fillStyle = '#b89a6a'; ctx.fillRect(x + 5, base - 23, 6, 3); // rolha
      ctx.fillStyle = 'rgba(255,230,180,0.35)'; ctx.fillRect(x + 4, base - 14, 1, 6);
      ctx.restore();
      G.text(this.label, x + 8, base - 12, '#ffe8c0', { align: 'center', shadow: false });
    }
    drawLate(ctx, cam) {
      const x = this.x + 7 - cam.x, y = this.y - 34 - cam.y;
      tag(ctx, x, y, this.n ? this.g + '/' + this.n + ' = ' + Math.round(this.g / this.n * 100) + '%' : 'sem tiragens', this.n ? '#ffe27a' : '#9a98b0');
    }
  }
  PUZ.urnas = (c) => {
    const { r, L } = c;
    let done = c.solved;
    const ps = shuffle([0.2, 0.5, 0.8]), xs = [5, 11.5, 18];
    const puz = {}, urnas = ps.map((p, i) => c.add(new UrnaOpaca(...L(xs[i], 4), 'ABC'[i], p, puz), r.idx));
    const MIN = 3;
    puz.tirar = (u) => {
      if (done || u.cd > 0) return;
      u.cd = 0.35; u.shake = 0.25; u.n++;
      const ouro = Math.random() < u.p; if (ouro) u.g++;
      G.sfx(ouro ? 'coin' : 'tink');
      G.fx.text(u.cx, u.y - 20, ouro ? 'dourada!' : 'cinza', ouro ? '#ffd84a' : '#b8b8c8');
      G.fx.burst(u.cx, u.y - 14, ouro ? ['#ffd84a', '#fff0a0'] : ['#9a9aa8', '#d8d8e0'], 6, 40);
    };
    const best = ps.indexOf(Math.max(...ps));
    const crystals = [0, 1, 2].map(i => c.add(new G.AnswerCrystal(...L(xs[i], 8), 'ABC'[i], i === best, (cr) => {
      if (done) return;
      if (urnas.some(u => u.n < MIN)) { G.sfx('wrong'); G.ui.toast('Tire pelo menos ' + MIN + ' bolas de CADA pote antes de decidir.', '#ffd84a'); return; }
      if (cr.correct) {
        done = true; G.sfx('correct'); for (const k of crystals) if (!k.dead) k.shatter();
        G.ui.toast('Pote ' + 'ABC'[i] + ': ' + Math.round(ps[i] * 10) + ' douradas em 10 (' + Math.round(ps[i] * 100) + '%). Sua amostra: ' + urnas[i].g + '/' + urnas[i].n + '  ✓', '#7aff8a');
        G.recordQuiz('prob', true); c.solve();
      } else {
        G.sfx('shock'); G.hurtPlayer(2, cr.cx, cr.cy, { force: true }); cr.shatter();
        G.recordQuiz('prob', false);
        G.ui.toast('Não é esse! Poucas tiragens enganam: tire mais bolas dos potes que sobraram.', '#ff8a7a');
      }
    }, { color: '#ffd84a' }), r.idx));
    return {
      prompt: '^yURNAS OPACAS^0: os três potes estão lacrados. Golpeie um pote para tirar uma bola (ela volta para dentro). Descubra qual tem a ^gMAIOR proporção de bolas douradas^0 e golpeie o cristal embaixo dele. Quanto mais bolas você tirar, mais certeza terá!',
      dicas: ['Uma bola só não diz muito. Tire várias de cada pote e compare as proporções: douradas ÷ tiradas.', 'Se dois potes estão parecidos, tire mais bolas deles dois: com mais tiragens, a proporção da amostra se aproxima da verdadeira (Lei dos Grandes Números).'],
      rewardPos: [11, 10], dbg: { ps, urnas }
    };
  };

  // ------------------------------------------------------------------
  //  GALERIA DAS MENTIRAS — golpear só os gráficos que enganam
  // ------------------------------------------------------------------
  const QUADROS = {
    eixo: { lie: true, curto: 'VOTOS', leg: 'Votos de Ana e Bia. (Repare onde o eixo começa.)', why: 'O eixo começa em 98: meio ponto de diferença parece o dobro. Gráfico de barras tem que começar no zero!',
      draw(ctx, x, y, w, h) { eixoY(ctx, x, y, h, '98'); barra(ctx, x + 10, y, h, 0.25, '#7ae4ff'); barra(ctx, x + 24, y, h, 0.95, '#ff9ae6'); } },
    eixo0: { lie: false, curto: 'VOTOS', leg: 'Votos de Ana e Bia, com o eixo começando no zero.', why: 'Esse é honesto: o eixo começa no zero e a diferença pequena parece pequena.',
      draw(ctx, x, y, w, h) { eixoY(ctx, x, y, h, '0'); barra(ctx, x + 10, y, h, 0.9, '#7ae4ff'); barra(ctx, x + 24, y, h, 0.92, '#ff9ae6'); } },
    pizza: { lie: true, curto: 'PREFERÊNCIA', leg: 'Fruta preferida do reino: 50%, 40% e 30%.', why: 'As fatias somam 120%! Uma pizza de partes do todo tem que somar 100%.',
      draw(ctx, x, y, w, h) { pizza(ctx, x + w / 2, y + h / 2, [50, 40, 30]); } },
    pizza100: { lie: false, curto: 'PREFERÊNCIA', leg: 'Fruta preferida do reino: 50%, 30% e 20%.', why: 'Esse é honesto: as partes somam 100%.',
      draw(ctx, x, y, w, h) { pizza(ctx, x + w / 2, y + h / 2, [50, 30, 20]); } },
    causa: { lie: true, curto: 'SORVETE → AFOGA', leg: '"SORVETE CAUSA AFOGAMENTOS!" Mais sorvete vendido, mais afogamentos.', why: 'Os dois sobem juntos no verão, por causa do calor. Andar junto não prova que um causa o outro!',
      draw(ctx, x, y, w, h) { nuvem(ctx, x, y, w, h, 0.85); } },
    juntos: { lie: false, curto: 'SORVETE E CALOR', leg: 'Quanto mais calor, mais sorvete vendido. Os dois andam juntos.', why: 'Esse é honesto: ele só diz que andam juntos, sem inventar uma causa.',
      draw(ctx, x, y, w, h) { nuvem(ctx, x, y, w, h, 0.85); } },
    figura: { lie: true, curto: 'MOEDAS', leg: 'O tesouro dobrou: de 10 para 20 moedas.', why: 'O valor dobrou, mas a moeda desenhada dobrou de altura E de largura: parece 4 vezes maior!',
      draw(ctx, x, y, w, h) { moeda(ctx, x + 11, y + h - 6, 4); moeda(ctx, x + 28, y + h - 12, 8); } },
    figura2: { lie: false, curto: 'MOEDAS', leg: 'O tesouro dobrou: de 10 para 20 moedas, uma pilha ao lado da outra.', why: 'Esse é honesto: 20 moedas aparecem como o dobro de pilhas, não como uma moeda gigante.',
      draw(ctx, x, y, w, h) { for (let i = 0; i < 2; i++) moeda(ctx, x + 8, y + h - 5 - i * 7, 3); for (let i = 0; i < 4; i++) moeda(ctx, x + 26, y + h - 5 - i * 7, 3); } }
  };
  function eixoY(ctx, x, y, h, lab) { ctx.fillStyle = '#5a5070'; ctx.fillRect(x + 6, y + 2, 0.5, h - 4); ctx.fillRect(x + 6, y + h - 2, 32, 0.5); G.text(lab, x + 1, y + h - 8, '#3a3050', { shadow: false }); }
  function barra(ctx, x, y, h, k, col) { const bh = (h - 6) * k; ctx.fillStyle = col; ctx.fillRect(x, y + h - 2 - bh, 9, bh); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(x, y + h - 2 - bh, 9, 0.5); }
  function pizza(ctx, cx, cy, partes) {
    const tot = st.sum(partes), cores = ['#ff9ae6', '#7ae4ff', '#ffd84a'];
    let a = -Math.PI / 2;
    partes.forEach((v, i) => { const da = v / tot * Math.PI * 2; ctx.fillStyle = cores[i]; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, 10, a, a + da); ctx.closePath(); ctx.fill(); const m = a + da / 2; G.text(String(v), cx + Math.cos(m) * 15, cy + Math.sin(m) * 13 - 3, '#3a3050', { align: 'center', shadow: false }); a += da; });
  }
  function nuvem(ctx, x, y, w, h) { ctx.fillStyle = '#5a5070'; ctx.fillRect(x + 4, y + 2, 0.5, h - 4); ctx.fillRect(x + 4, y + h - 2, w - 8, 0.5); ctx.fillStyle = '#ff6a5a'; for (let i = 0; i < 8; i++) { const t = (i + 0.5) / 8, py = t * 0.8 + 0.1 * Math.sin(i * 2.3); ctx.beginPath(); ctx.arc(x + 7 + t * (w - 14), y + h - 5 - py * (h - 9), 1.2, 0, Math.PI * 2); ctx.fill(); } }
  function moeda(ctx, cx, by, rr) { ctx.fillStyle = '#a8781a'; ctx.beginPath(); ctx.ellipse(cx, by - rr, rr, rr, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.ellipse(cx - rr * 0.12, by - rr * 1.05, rr * 0.8, rr * 0.8, 0, 0, Math.PI * 2); ctx.fill(); }
  class Quadro extends G.Ent {
    constructor(x, y, id, puz) { super(x + 4, y + 26, 40, 8); this.solid = true; this.id = id; this.q = QUADROS[id]; this.puz = puz; this.cd = 0; this.falso = false; }
    get darkGlow() { return 30; }
    interBox() { return { x: this.x - 4, y: this.y - 30, w: this.w + 8, h: this.h + 34 }; }
    interact() { G.runScript(() => G.ui.say('Quadro: ' + this.q.curto, this.q.leg)); }
    onHit() { if (this.cd > 0) return false; this.cd = 0.5; this.puz.julgar(this); return false; }
    update(dt) { this.t += dt; if (this.cd > 0) this.cd -= dt; }
    draw(ctx, cam) {
      const x = this.x - 4 - cam.x, y = this.y - 30 - cam.y, w = 48, h = 32;
      G.shadow(ctx, x + 24, this.y + this.h - cam.y, 30, 0.35);
      ctx.save();
      ctx.fillStyle = '#4a3020'; ctx.fillRect(x + 8, y + h, 2, 8); ctx.fillRect(x + w - 10, y + h, 2, 8); // cavalete
      ctx.fillStyle = '#1b1428'; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
      const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#c89a4a'); g.addColorStop(1, '#8a6024');
      ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#f0e8d8'; ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
      this.q.draw(ctx, x + 4, y + 3, w - 8, h - 6);
      if (this.falso) { ctx.strokeStyle = '#e02a3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 4, y + 4); ctx.lineTo(x + w - 4, y + h - 4); ctx.moveTo(x + w - 4, y + 4); ctx.lineTo(x + 4, y + h - 4); ctx.stroke(); }
      ctx.restore();
    }
    drawLate(ctx, cam) { tag(ctx, this.x + 20 - cam.x, this.y - 44 - cam.y, this.falso ? 'ENGANA!' : this.q.curto, this.falso ? '#ff8a9a' : '#ffe27a'); }
  }
  PUZ.galeria = (c) => {
    const { r, L } = c;
    let done = c.solved;
    const pares = shuffle([['eixo', 'eixo0'], ['pizza', 'pizza100'], ['causa', 'juntos'], ['figura', 'figura2']]);
    // duas mentiras e dois honestos, de quatro famílias diferentes
    const ids = shuffle([pares[0][0], pares[1][0], pares[2][1], pares[3][1]]);
    const puz = {};
    const quadros = ids.map((id, i) => c.add(new Quadro(...L(4 + i * 5, 4), id, puz), r.idx));
    if (done) for (const q of quadros) q.falso = q.q.lie;
    puz.julgar = (q) => {
      if (done || q.falso) return;
      if (q.q.lie) {
        q.falso = true; G.sfx('correct'); G.fx.burst(q.cx, q.y - 14, ['#ff8a9a', '#ffffff'], 14, 70);
        G.recordQuiz('vies', true); G.ui.toast(q.q.why, '#7aff8a');
        if (quadros.every(o => o.falso || !o.q.lie)) { done = true; G.runScript(async () => { await G.wait(1.2); G.ui.toast('Galeria limpa: só os gráficos honestos ficaram de pé!', '#7aff8a'); c.solve(); }); }
      } else {
        G.sfx('shock'); G.hurtPlayer(2, q.cx, q.cy, { force: true }); G.recordQuiz('vies', false);
        G.ui.toast(q.q.why, '#ff8a7a');
      }
    };
    return {
      prompt: '^yGALERIA DAS MENTIRAS^0: o Viés pendurou gráficos pelo salão. Fale com um quadro para ler a legenda e ^rgolpeie só os que ENGANAM^0. Cuidado: alguns são honestos!',
      dicas: ['Confira: onde o eixo das barras começa, se a pizza soma 100%, se o desenho cresce só na altura e se a legenda afirma uma CAUSA.', 'Gráfico honesto: barras a partir do zero, partes que somam 100%, figuras do mesmo tamanho e "andam juntos" sem virar "causa".'],
      rewardPos: [11, 10], dbg: { quadros }
    };
  };
})(window.G);
