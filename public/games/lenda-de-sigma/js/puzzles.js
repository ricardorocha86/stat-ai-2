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
    c.add(new Board(r.px + x0 * TS, r.py + 3 * TS, N * TS, 40, (ctx, x, y) => {
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
      prompt: '^yPILHAS DESIGUAIS^0: pegue caixotes (Z) das pilhas altas e coloque nas baixas até que ^gtodas fiquem com a mesma altura^0. Essa altura igual é justamente a ^yMÉDIA^0 das pilhas!',
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
    const txt = { acimaMedia: 'Acenda (golpeando) só os braseiros cujos números são ^yMAIORES QUE A MÉDIA^0 de todos os seis.', abaixoMediana: 'Acenda só os números ^yMENORES QUE A MEDIANA^0 dos seis.', dentroSigma: 'Acenda os números que estão a ^yno máximo 1 DESVIO PADRÃO^0 da média (entre μ-σ e μ+σ).' }[rule];
    return { prompt: '^yRITUAL DO FOGO^0: ' + txt + ' Golpeie de novo para apagar.', dbg: { want, brs }, rewardPos: [11, 10] };
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
    const mid = Math.floor(n / 2);
    if (done) sts[mid].glow = true;
    const check = () => {
      const ok = sts.every((s, i) => i === 0 || s.v > sts[i - 1].v);
      if (ok && !done) {
        done = true; sts[mid].glow = true;
        G.ui.toast('Em ordem! O valor do MEIO é a MEDIANA: ' + sts[mid].v + '   (' + swaps + ' trocas)', '#7aff8a');
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
      prompt: '^yESTÁTUAS DA ORDEM^0: golpeie as ^calavancas^0 para trocar estátuas vizinhas. Coloque os números ^gem ordem crescente^0. Só assim a estátua do MEIO revela a ^yMEDIANA^0!',
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
    return genRow('median');
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
      G.text(this.label, x + 8, y + 4.5, '#2a1a0a', { align: 'center', shadow: false });
    }
  }
  PUZ.stonepath = (c) => {
    const { r, L, setL, map } = c;
    const rule = c.opt.rule || 'median';
    const rows = c.opt.rows || [7, 5, 3];
    const cols = [9, 10, 11, 12, 13];
    const lava = !!c.opt.lava;
    const hole = lava ? T.LAVA : T.PIT;
    let done = c.solved;
    // área: fileiras de pedras (resto vira abismo) intercaladas com faixas firmes
    const top = Math.min(...rows) - 1, bot = Math.max(...rows) + 1;
    for (let ly = top; ly <= bot; ly++) for (let lx = 1; lx < 23; lx++) {
      if (rows.includes(ly)) setL(lx, ly, done || cols.includes(lx) ? T.FLOOR : hole);
      else setL(lx, ly, T.FLOOR);
    }
    const state = rows.map(() => null);
    const stones = rows.map(() => []);
    const signs = [];
    const fill = (k) => {
      const row = genRow(rule); state[k] = row;
      for (const s of stones[k]) s.dead = true;
      stones[k] = cols.map((lx, i) => { const s = new NumStone(...L(lx, rows[k]), row.labels[i]); s.room = r.idx; s.fake = i !== row.ok; return s; });
      for (const s of stones[k]) { if (G.map === map && G.curRoom === r.idx) G.addEnt(s); else c.add(s, r.idx); }
      if (signs[k]) signs[k].txt = row.sign;
      for (const lx of cols) setL(lx, rows[k], T.FLOOR);
    };
    rows.forEach((ly, k) => {
      const sg = c.add(new Decal(r.px + 3 * TS, r.py + ly * TS + 3, 5 * TS, 10, (ctx, x, y, d) => tag(ctx, x + d.w / 2 - 6, y, d.txt || '', '#ffe27a')), r.idx);
      signs[k] = sg;
      if (!done) fill(k);
    });
    let regen = [];
    return {
      prompt: {
        median: '^yPONTE DA MEDIANA^0: em cada fileira só a pedra que é a ^gMEDIANA^0 dos cinco números aguenta o seu peso. As outras desabam! (Ordene de cabeça e pegue a do meio.)',
        z: '^yPONTE DO ESCORE-Z^0: cada placa diz a média μ, o desvio σ e um escore z. Pise na pedra com o valor ^gμ + z·σ^0. As outras desabam!',
        prob: '^yPONTE DO ACASO^0: pise na pedra com a ^gmaior^0 (ou ^gmenor^0) probabilidade, como diz a placa. As outras despencam!',
        mean: '^yPONTE DA MÉDIA^0: pise na pedra que mostra a ^gMÉDIA^0 dos números da placa.'
      }[rule],
      update(dt) {
        const p = G.player; if (!p || done) return;
        for (let i = regen.length - 1; i >= 0; i--) { regen[i].t -= dt; if (regen[i].t <= 0 && p.state !== 'fall') { fill(regen[i].k); regen.splice(i, 1); } }
        if (p.state === 'normal' && p.z <= 0) {
          const ltx = Math.floor(p.cx / TS) - r.x0, lty = Math.floor(p.cy / TS) - r.y0;
          const k = rows.indexOf(lty);
          if (k >= 0 && cols.includes(ltx) && state[k]) {
            const s = stones[k][cols.indexOf(ltx)];
            if (s && s.fake && !s.gone) {
              s.gone = true; setL(ltx, lty, hole);
              G.fx.burst(s.cx, s.cy, ['#a89a88', '#6a5c50'], 12, 60, { grav: 200 }); G.sfx('brick');
              G.recordQuiz(rule === 'z' ? 'normal' : rule === 'prob' ? 'prob' : rule === 'mean' ? 'media' : 'mediana', false);
              G.ui.toast('A pedra desabou! Os números da fileira mudaram...', '#ff8a7a');
              regen.push({ k, t: 1.2 });
            } else if (s && !s.fake && !s.okd) { s.okd = true; G.sfx('correct'); G.recordQuiz(rule === 'z' ? 'normal' : rule === 'prob' ? 'prob' : rule === 'mean' ? 'media' : 'mediana', true); }
          }
          if (c.opt.down ? lty >= bot : lty <= top) {
            done = true;
            for (const ly of rows) for (let lx = 1; lx < 23; lx++) setL(lx, ly, T.FLOOR);
            for (const row of stones) for (const s of row) s.dead = true;
            G.ui.toast('Travessia completa! Uma ponte firme se forma.', '#7aff8a');
            c.solve();
          }
        }
      },
      dbg: { stones, rows, cols }, rewardPos: c.opt.down ? [3, 11] : [3, 1]
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
      const mx = Math.max(1, ...counts);
      MODE_COLS.forEach(([, name, col], i) => {
        const bx = x + 8 + i * 38, h = tally[i] / mx * 16;
        ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(bx, y + 4, 22, 16);
        ctx.fillStyle = col; ctx.fillRect(bx, y + 20 - h, 22, h);
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(bx, y + 20 - h, 22, 0.5);
        G.text(String(tally[i]), bx + 27, y + 12, '#ffffff', { shadow: false });
        G.text(name.slice(0, 4), bx + 11, y + 21, col, { align: 'center', shadow: false });
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
      prompt: '^yARENA DA MODA^0: derrote as gosmas. O placar conta quantas de cada cor caíram. No fim, golpeie o cristal da cor que é a ^gMODA^0 (a mais frequente)!',
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
  PUZ.archers = (c) => {
    const { r, L } = c;
    const ask = c.opt.ask || pick(['sigma', 'range']);
    const sig = shuffle([3, 11]);
    const turrets = [], boards = [];
    [3, 9].forEach((ly, i) => {
      const [tx, ty] = L(2, ly);
      const t = c.add(new ArcherStatue(tx, ty, 'AB'[i]), r.idx);
      turrets.push(t);
      boards.push(c.add(new TargetBoard(...L(21, ly), 'AB'[i]), r.idx));
    });
    let phase = c.solved ? 'done' : 'idle', shots = 0, cd = 0, crystals = [];
    const N = 10;
    const fire = () => {
      if (phase === 'firing') return;
      for (const b of boards) b.hits = [];
      for (const k of crystals) k.dead = true; crystals = [];
      phase = 'firing'; shots = 0; cd = 0.3; G.sfx('confirm');
    };
    c.add(new Lever(...L(11.5, 11), () => { if (phase !== 'done') fire(); else G.sfx('tink'); }), r.idx);
    const gauss = () => { const u = Math.max(1e-6, Math.random()), v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    return {
      prompt: '^yDUELO DOS ARQUEIROS^0: golpeie a alavanca para que as estátuas A e B atirem ' + N + ' flechas cada (cuidado!). Observe como as flechas se ^cespalham^0 nos alvos e golpeie o cristal do arqueiro ' + (ask === 'sigma' ? 'mais ^gCONSISTENTE^0 (menor desvio padrão)' : 'com ^gMAIOR AMPLITUDE^0 (mais espalhado)') + '.',
      update(dt) {
        if (phase !== 'firing') return;
        cd -= dt;
        if (cd <= 0 && shots < N) {
          cd = 0.32; shots++;
          [3, 9].forEach((ly, i) => {
            const dy = G.clamp(gauss() * sig[i], -20, 20);
            const [x, y] = L(3, ly);
            const a = new Arrow(x, y + 6 + dy * 0, 230, boards[i], dy, null); a.room = r.idx; a.y = y + 6;
            G.addEnt(a);
          });
          G.sfx('beam');
        }
        if (shots >= N && !G.ents.some(e => e instanceof Arrow && !e.dead)) {
          phase = 'ask';
          const sA = st.std(boards[0].hits), sB = st.std(boards[1].hits);
          const rA = st.range(boards[0].hits), rB = st.range(boards[1].hits);
          const okIdx = ask === 'sigma' ? (sA <= sB ? 0 : 1) : (rA >= rB ? 0 : 1);
          crystals = [0, 1].map(i => c.addLive(new G.AnswerCrystal(...L(9 + i * 5, 6), 'AB'[i], i === okIdx, (cr) => {
            if (phase !== 'ask') return;
            const info = 'σA ≈ ' + F(sA / 2, 1) + '  σB ≈ ' + F(sB / 2, 1) + '   amplitude A ' + F(rA / 2, 1) + ' · B ' + F(rB / 2, 1);
            if (cr.correct) { phase = 'done'; G.sfx('correct'); for (const k of crystals) k.shatter(); G.recordQuiz('desvio', true); G.ui.toast(info + '  ✓', '#7aff8a'); c.solve(); }
            else { G.sfx('shock'); G.hurtPlayer(2, cr.cx, cr.cy, { force: true }); for (const k of crystals) k.shatter(); crystals = []; phase = 'idle'; G.recordQuiz('desvio', false); G.ui.toast('Errou! ' + info + '. Atire de novo.', '#ff8a7a'); }
          }, { color: i ? '#ffa040' : '#7ae4ff' })));
        }
      },
      leave() { if (phase === 'firing' || phase === 'ask') { phase = 'idle'; for (const k of crystals) k.dead = true; crystals = []; } },
      dbg: { boards }, rewardPos: [11, 8]
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
  //  DADOS ROLANTES — soma 7 de três jeitos diferentes
  // ------------------------------------------------------------------
  const PIPS = { 1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [2, 0], [0, 2], [2, 2]], 5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]] };
  class DieBlock extends G.PushBlock {
    constructor(x, y, o) { super(x, y, null, o); this.top = ri(1, 6); const opts = [1, 2, 3, 4, 5, 6].filter(v => v !== this.top && v !== 7 - this.top); this.north = pick(opts); this.east = [1, 2, 3, 4, 5, 6].find(v => v !== this.top && v !== 7 - this.top && v !== this.north && v !== 7 - this.north); this.roll = 0; }
    get darkGlow() { return 22; }
    push(dir, puller = null) {
      const was = this.moving;
      super.push(dir, puller);
      if (!was && this.moving) {
        const t = this.top, n = this.north, e = this.east;
        if (dir === 3) { this.top = 7 - e; this.east = t; }
        else if (dir === 2) { this.top = e; this.east = 7 - t; }
        else if (dir === 0) { this.top = n; this.north = 7 - t; }
        else { this.top = 7 - n; this.north = t; }
        this.roll = 0.25; G.sfx('dice');
      }
    }
    update(dt) { super.update(dt); if (this.roll > 0) this.roll -= dt; }
    draw(ctx, cam) {
      const x = G.snap(this.x - cam.x), y = G.snap(this.y - cam.y), sq = this.roll > 0 ? Math.sin(this.roll / 0.25 * Math.PI) * 1.5 : 0;
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x + 1, y + 14, 15, 2.5);
      ctx.fillStyle = '#1a1028'; G.rrPath(ctx, x, y - 1 + sq, 16, 17 - sq, 3); ctx.fill();
      ctx.fillStyle = '#c8c0d8'; G.rrPath(ctx, x + 0.5, y + 9 + sq * 0.5, 15, 6.5 - sq * 0.5, 2); ctx.fill();
      const g = ctx.createLinearGradient(0, y, 0, y + 10); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#e8e2f2');
      ctx.fillStyle = g; G.rrPath(ctx, x + 0.5, y - 0.5 + sq, 15, 10.5, 2.5); ctx.fill();
      const pc = this.top === 1 ? '#e03a3a' : '#2a1a3a';
      for (const [a, b] of PIPS[this.top]) { ctx.fillStyle = pc; ctx.beginPath(); ctx.arc(x + 3.5 + a * 4.5, y + 1.6 + sq + b * 3.4, 1.2, 0, Math.PI * 2); ctx.fill(); }
      const s = 7 - this.north;
      for (let i = 0; i < Math.min(s, 6); i++) { ctx.fillStyle = '#5a4a6a'; ctx.fillRect(x + 2.5 + (i % 3) * 4.5, y + 10.5 + Math.floor(i / 3) * 2.5 + sq * 0.5, 1, 1); }
      ctx.restore();
    }
  }
  G.DieBlock = DieBlock;
  PUZ.dice = (c) => {
    const { r, L } = c;
    const target = c.opt.sum || 7;
    const combos = []; for (let a = 1; a <= 6; a++) for (let b = a; b <= 6; b++) if (a + b === target) combos.push(a + '+' + b);
    const need = Math.min(3, combos.length);
    const found = new Set(c.solved ? combos : []);
    const bounds = { x: r.px + 2 * TS, y: r.py + 2 * TS, w: 20 * TS, h: 9 * TS };
    const plates = [c.add(new G.Plate(...L(10, 5)), r.idx), c.add(new G.Plate(...L(13, 5)), r.idx)];
    const dice = [[7, 8], [16, 8]].map(([lx, ly]) => { const d = c.add(new DieBlock(...L(lx, ly), { locked: c.solved }), r.idx); d.bounds = bounds; return d; });
    const lamps = [];
    for (let i = 0; i < need; i++) lamps.push(c.add(new G.Torch(...L(9 + i * 3, 0), { room: r.idx, lit: c.solved, blue: true }), r.idx));
    let done = c.solved, last = '';
    c.add(new Board(r.px + 7 * TS, r.py + 1 * TS + 6, 10 * TS, 12, (ctx, x, y) => {
      const shown = combos.map(k => (found.has(k) ? '✓' + k : '?+?'));
      tag(ctx, x + 80, y, 'soma ' + target + ':   ' + shown.join('    '), found.size >= need ? '#7aff8a' : '#ffe27a');
    }), r.idx);
    return {
      prompt: '^yDADOS DO ACASO^0: role os dados gigantes empurrando-os (cada empurrão gira a face de cima!). Leve os dois às placas para formar a ^ySOMA ' + target + '^0 de ^g' + need + ' jeitos diferentes^0. Repare: ' + target + ' tem mais combinações que outras somas!',
      update() {
        if (done) return;
        const on = plates.map(p => p.blockOn());
        if (on.some(b => !b) || on[0] === on[1] || dice.some(d => d.moving)) { last = ''; return; }
        const a = on[0].top, b = on[1].top, key = Math.min(a, b) + '+' + Math.max(a, b);
        if (key === last) return;
        last = key;
        if (a + b === target) {
          if (!found.has(key)) { found.add(key); lamps[Math.min(lamps.length - 1, found.size - 1)].lit = true; G.sfx('secret'); G.ui.toast(a + ' + ' + b + ' = ' + target + '  ✓  (' + found.size + ' de ' + need + ')', '#7aff8a'); }
          else G.ui.toast('Essa combinação você já achou! Tente outra.', '#ffd84a');
          if (found.size >= need) { done = true; for (const d of dice) d.o.locked = true; G.recordQuiz('combinada', true); G.ui.toast('Soma ' + target + ': ' + combos.length + ' pares (' + (combos.length * 2 - (target % 2 ? 0 : 1)) + ' das 36 combinações ordenadas)!', '#7aff8a'); c.solve(); }
        } else { G.sfx('wrong'); G.ui.toast(a + ' + ' + b + ' = ' + (a + b) + ' ≠ ' + target, '#ff8a7a'); }
      },
      dbg: { dice, plates, combos }, rewardPos: [11, 10]
    };
  };

  // ------------------------------------------------------------------
  //  HISTOGRAMA NO GELO — empurre blocos para as faixas certas
  // ------------------------------------------------------------------
  PUZ.hist = (c) => {
    const { r, L, setL } = c;
    const lanes = [4, 7, 16, 19], labs = ['0-9', '10-19', '20-29', '30-39'];
    let freq; do { freq = lanes.map(() => ri(1, 5)); } while (st.sum(freq) < 9 || st.sum(freq) > 12 || new Set(freq).size < 3);
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
    lanes.forEach((lx, i) => c.add(new Decal(r.px + lx * TS - 8, r.py + 6 * TS + 3, 32, 10, (ctx, x, y) => tag(ctx, x + 16, y, labs[i], '#c8f0ff')), r.idx));
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
      update() {
        if (done || blocks.some(b => b.moving)) return;
        const cnt = lanes.map(lx => blocks.filter(b => Math.round((b.x - r.px) / TS) === lx && Math.round((b.y - r.py) / TS) <= 5).length);
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
      const lo = i * 0.2, hi = lo + 0.2, ok = trueP >= lo - 1e-9 && trueP <= hi + 1e-9;
      const rowsHit = new Set(asked.map(a => a.row)).size;
      G.recordQuiz('amostra', ok);
      if (ok) { done = true; for (const s of statues) s.asked = true; G.sfx('correct'); await G.ui.say('Oráculo', 'Correto! Na verdade eram ' + Math.round(trueP * 100) + '%. ' + (rowsHit >= 3 ? 'Você espalhou bem a amostra pelo salão: assim ela representa a população!' : 'Acertou, mas cuidado: sua amostra ficou concentrada.')); c.solve(); }
      else {
        G.hurtPlayer(2, undefined, undefined, { force: true, noKb: true });
        await G.ui.say('Oráculo', 'Errado: eram ' + Math.round(trueP * 100) + '%. ' + (rowsHit <= 2 ? 'Você só perguntou em ' + rowsHit + ' fileira(s)! Perto do trono há mais traidores, longe dele menos: isso é ^rVIÉS DE SELEÇÃO^0. Sorteie armaduras de todo o salão!' : 'Amostras pequenas variam bastante. Espalhe as perguntas por todas as fileiras.'));
        await G.ui.say('Oráculo', 'As armaduras trocaram de lugar. Tente uma nova amostra.');
        build(); for (const s of statues) G.addEnt(s);
      }
    } }), r.idx);
    return {
      prompt: '^yPESQUISA NO SALÃO^0: algumas armaduras são leais ao ^rViés^0. Você só pode perguntar a ^y' + MAXQ + '^0 delas (golpeie ou fale). Depois estime, no Oráculo, a porcentagem de traidores no SALÃO INTEIRO. Dica: quem você escolhe importa!',
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
    let done = c.solved;
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
      const rr = corr(rows());
      tag(ctx, x + 80, y, 'coeficiente r = ' + F(rr, 2) + (want === 'pos' ? '   (meta: r ≥ 0,9)' : '   (meta: r ≤ -0,9)'), (want === 'pos' ? rr >= 0.9 : rr <= -0.9) ? '#7aff8a' : '#ffe27a');
    }, { front: true }), r.idx);
    return {
      prompt: '^yGRÁFICO DE DISPERSÃO^0: cada bloco é um ponto (x = coluna, y = altura). Empurre-os para cima ou para baixo e monte uma ^gcorrelação ' + (want === 'pos' ? 'POSITIVA^0 (quanto maior x, maior y)' : 'NEGATIVA^0 (quanto maior x, menor y)') + '. A reta pontilhada e o coeficiente ^cr^0 mostram o quanto você chegou perto.',
      update() {
        if (done || blocks.some(b => b.moving)) return;
        const rr = corr(rows());
        if (want === 'pos' ? rr >= 0.9 : rr <= -0.9) { done = true; for (const b of blocks) b.o.locked = true; G.ui.toast('r = ' + F(rr, 2) + ': correlação ' + (want === 'pos' ? 'positiva' : 'negativa') + ' forte  ✓', '#7aff8a'); G.recordQuiz('correlacao', true); c.solve(); }
      },
      dbg: { want, blocks, xs, top, bot }, rewardPos: [21, 10]
    };
  };
})(window.G);
