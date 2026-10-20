'use strict';
// =====================================================================
//  Estruturas grandes (casas, templos, castelo...) em alta resolução.
//  Tamanho lógico = tiles × 16; a última linha contém a porta.
// =====================================================================
(function (G) {
  const C = G.col;
  const { cyl, bevel, inEll, inRR, inPoly, bboxOf } = G.artTools;
  const R5 = c => C.ramp(c, 5);
  const OUT = '#1a1020';

  function mkP(wt, ht) { return new G.Paint(wt * 32, ht * 32); }
  // telhado de telhas: retângulo com beiral; ramp 5 tons
  function roof(p, x0, y0, w, h, ramp, o = {}) {
    const rowH = o.rowH || 6, shW = o.shW || 8;
    for (let y = y0; y < y0 + h; y++) {
      const inset = o.gable ? Math.max(0, Math.round((y0 + h * 0.35 - y) * 0.9)) : 0;
      for (let x = x0 + inset; x < x0 + w - inset; x++) {
        const ry = y - y0, row = Math.floor(ry / rowH), ly = ry % rowH;
        const off = (row & 1) ? shW / 2 : 0, lx = (x - x0 + off) % shW;
        let i = 2;
        if (ly === 0) i = 3; else if (ly >= rowH - 2) i = 1;
        if (lx === 0) i = Math.max(0, i - 1);
        if (ly === rowH - 1) i = 0;
        // luz geral: topo mais claro, lado direito mais escuro
        if (x > x0 + w * 0.75 && i > 0) i--;
        if (ry < 3) i = 4;
        if (inset && x === x0 + inset) i = 0;
        p.px(x, y, ramp[Math.max(0, Math.min(4, i))]);
      }
    }
    // beiral (sombra sob o telhado)
    for (let x = x0; x < x0 + w; x++) { p.px(x, y0 + h, ramp[0]); p.px(x, y0 + h + 1, C.alpha('#000000', 0.25)); }
  }
  // parede de reboco com enxaimel opcional
  function plaster(p, x0, y0, w, h, base, o = {}) {
    const R = R5(base), Wd = R5(o.wood || '#6a4020');
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
      let c = R[2];
      if (G.hsh(x, y) > 0.93) c = R[1];
      if (x < x0 + 2) c = R[3];
      if (x > x0 + w - 3) c = R[1];
      p.px(x, y, c);
    }
    if (o.timber) {
      for (let x = x0; x < x0 + w; x++) { for (let k = 0; k < 2; k++) { p.px(x, y0 + k, k ? Wd[1] : Wd[3]); p.px(x, y0 + h - 2 + k, k ? Wd[0] : Wd[2]); } }
      for (const fx of [x0, x0 + w - 3, ...(o.posts || [])]) for (let y = y0; y < y0 + h; y++) for (let k = 0; k < 3; k++) p.px(fx + k, y, k === 0 ? Wd[3] : k === 2 ? Wd[0] : Wd[2]);
    }
    // base de pedras
    for (let y = y0 + h - 6; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
      const bx = (x + ((y - y0) > h - 3 ? 4 : 0)) % 8, by = (y - (y0 + h - 6)) % 3;
      p.px(x, y, bx === 0 || by === 2 ? '#3a3440' : (by === 0 ? '#9a94a0' : '#78727e'));
    }
  }
  function planks(p, x0, y0, w, h, base) {
    const R = R5(base);
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
      const lx = (x - x0) % 6;
      let c = lx === 0 ? R[0] : lx === 1 ? R[3] : R[2];
      if (((y * 7 + Math.floor((x - x0) / 6) * 13) % 23) === 0 && lx > 1) c = R[1];
      p.px(x, y, c);
    }
  }
  function stoneWall(p, x0, y0, w, h, base, bw = 12, bh = 7) {
    const R = R5(base);
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
      const row = Math.floor((y - y0) / bh), off = row & 1 ? bw / 2 : 0;
      const bx = (x - x0 + off) % bw, by = (y - y0) % bh;
      const tone = G.hsh(Math.floor((x - x0 + off) / bw), row);
      let c = tone > 0.6 ? R[3] : tone < 0.25 ? R[1] : R[2];
      if (by === 0 || bx === 0) c = R[0]; else if (by === 1) c = C.mix(c, R[4], 0.4);
      p.px(x, y, c);
    }
  }
  function windowAt(p, x, y, w = 12, h = 12, lit = false, frame = '#4a2a14') {
    const Fr = R5(frame);
    p.rect(x - 2, y - 2, w + 4, h + 4, Fr[1]);
    for (let i = -2; i < w + 2; i++) p.px(x + i, y - 2, Fr[3]);
    const g1 = lit ? '#ffe08a' : '#5aa0d8', g2 = lit ? '#fff4c0' : '#c0e8ff', g0 = lit ? '#e0a040' : '#2a5a9a';
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
      let c = yy > h * 0.55 ? g0 : g1;
      if (xx + yy < w * 0.5 && xx > 0 && yy > 0) c = g2;
      p.px(x + xx, y + yy, c);
    }
    p.rect(x + w / 2 - 1, y, 2, h, Fr[1]); p.rect(x, y + h / 2 - 1, w, 2, Fr[1]);
    // floreira
    p.rect(x - 3, y + h + 2, w + 6, 3, Fr[0]);
    for (let i = 0; i < w + 4; i += 3) { p.px(x - 2 + i, y + h + 1, G.hsh(i, x) > 0.5 ? '#ff6a8a' : '#ffe060'); p.px(x - 1 + i, y + h + 1, '#3a8a3a'); }
  }
  function doorAt(p, cx, by, w = 18, h = 26, col = '#6a3a1a', arch = true) {
    const D = R5(col);
    const x0 = Math.round(cx - w / 2), y0 = by - h;
    // moldura
    for (let y = y0 - 3; y < by; y++) for (let x = x0 - 3; x < x0 + w + 3; x++) {
      const dx = x + 0.5 - cx, inArch = !arch || y >= y0 + w / 2 - 3 || Math.hypot(dx, y - (y0 + w / 2 - 3)) <= w / 2 + 3;
      if (inArch) p.px(x, y, '#4a3a3a');
    }
    for (let y = y0; y < by; y++) for (let x = x0; x < x0 + w; x++) {
      const dx = x + 0.5 - cx, inArch = !arch || y >= y0 + w / 2 || Math.hypot(dx, y - (y0 + w / 2)) <= w / 2;
      if (!inArch) continue;
      const lx = (x - x0) % 5;
      p.px(x, y, lx === 0 ? D[0] : lx === 1 ? D[3] : D[2]);
    }
    for (let x = x0; x < x0 + w; x++) { p.px(x, y0 + Math.floor(h * 0.35), D[0]); p.px(x, y0 + Math.floor(h * 0.75), D[0]); }
    p.ell(cx + w * 0.28, by - h * 0.45, 1.5, 1.5, '#ffd23a');
    // degrau
    p.rect(x0 - 4, by - 2, w + 8, 2, '#8a8490');
  }
  function chimney(p, x, y, h) {
    stoneWall(p, x, y, 10, h, '#8a5a4a', 5, 4);
    p.rect(x - 1, y - 2, 12, 3, '#5a3a2a');
  }
  function finish(p) { p.outline({ color: OUT }); return p.toCanvas(); }

  // ------------------------------------------------------------------
  //  Casas
  // ------------------------------------------------------------------
  function house(wt, opt) {
    const p = mkP(wt, 3), W = wt * 32, H = 96;
    const roofH = opt.roofH || 50, wallTop = roofH - 4;
    const wallH = H - wallTop;
    // parede
    if (opt.planks) planks(p, 6, wallTop, W - 12, wallH, opt.wall);
    else if (opt.stone) stoneWall(p, 6, wallTop, W - 12, wallH, opt.wall);
    else plaster(p, 6, wallTop, W - 12, wallH, opt.wall, { timber: opt.timber !== false, wood: opt.wood, posts: opt.posts });
    if (opt.chimney) chimney(p, W - 26, 2, 22);
    roof(p, 0, 4, W, roofH - 6, R5(opt.roof), { gable: true });
    // janelas e porta
    if (W >= 96 + 32) { windowAt(p, 18, wallTop + 12, 14, 12, opt.lit); windowAt(p, W - 32, wallTop + 12, 14, 12, opt.lit); }
    else { windowAt(p, 14, wallTop + 12, 12, 12, opt.lit); windowAt(p, W - 26, wallTop + 12, 12, 12, opt.lit); }
    doorAt(p, W / 2, H, opt.doorW || 18, opt.doorH || 28, opt.door || '#6a3a1a', opt.arch !== false);
    if (opt.extra) opt.extra(p, W, H, wallTop);
    return finish(p);
  }
  function signBoard(p, cx, y, w, h, bg, fg, draw) {
    const B = R5(bg);
    cyl(p, inRR(cx - w / 2, y, w, h, 2), B, [cx - w / 2 - 1, y - 1, cx + w / 2 + 1, y + h + 1]);
    if (draw) draw(fg);
  }

  // ------------------------------------------------------------------
  //  Templos, caverna, torre, castelo
  // ------------------------------------------------------------------
  function temple(cols, gem) {
    const p = mkP(4, 3), W = 128, H = 96;
    const [c1, c2, c3, c4] = cols;
    const S = [c4, c3, c2, c1, C.shade(c1, 0.5)];
    // escadaria
    for (let i = 0; i < 3; i++) cyl(p, inRR(4 + i * 3, H - 8 + i * 3 - 6, W - 8 - i * 6, 4, 1), S, [0, 0, W, H]);
    // corpo
    stoneWall(p, 10, 30, W - 20, H - 40, c2, 16, 8);
    // porta
    for (let y = 40; y < H - 10; y++) for (let x = W / 2 - 18; x < W / 2 + 18; x++) {
      const inArch = y > 52 || Math.hypot(x + 0.5 - W / 2, y - 52) < 18;
      if (inArch) p.px(x, y, y < 45 ? '#1a1020' : '#05030a');
    }
    for (let y = 40; y < H - 10; y++) for (const x of [W / 2 - 20, W / 2 - 19, W / 2 + 18, W / 2 + 19]) if (y > 52 || Math.hypot(x + 0.5 - W / 2, y - 52) < 20) p.px(x, y, S[4]);
    for (let i = 0; i < 4; i++) p.ell(W / 2 - 9 + i * 6, 60, 1.2, 1.2, gem);
    // colunas
    for (const cx of [14, 30, W - 34, W - 18]) {
      cyl(p, inRR(cx - 5, 30, 10, H - 46, 1), S, [cx - 6, 29, cx + 6, H - 15]);
      for (let y = 32; y < H - 16; y++) p.px(cx, y, S[1]);
      cyl(p, inRR(cx - 7, 27, 14, 4, 1), S, [cx - 8, 26, cx + 8, 32]);
      cyl(p, inRR(cx - 7, H - 18, 14, 4, 1), S, [cx - 8, H - 19, cx + 8, H - 13]);
    }
    // frontão
    const pts = [[2, 28], [W - 2, 28], [W / 2, 4]];
    p.mask(inPoly(pts), (x, y) => (y > 24 ? S[1] : x < W / 2 ? S[3] : S[2]), bboxOf(pts));
    for (let x = 2; x < W - 2; x++) { p.px(x, 28, S[0]); p.px(x, 27, S[4]); }
    p.ell(W / 2, 18, 6, 6, { ramp: R5(gem), ambient: 0.5 });
    p.ell(W / 2 - 2, 16, 1.5, 1.5, '#ffffff');
    return finish(p);
  }
  function cave() {
    const p = mkP(4, 3), W = 128, H = 96;
    const R = ['#1a1214', '#3a2a2a', '#5a4444', '#7a6060', '#9a8080'];
    p.litMask((x, y) => { const d = Math.hypot((x + 0.5 - W / 2) / 64, (y + 0.5 - H) / 92); return d < 1 && y < H; }, { ramp: R, radius: 14, ambient: 0.3 }, [0, 0, W - 1, H - 1]);
    for (let i = 0; i < 40; i++) { const x = G.hsh(i, 1) * W, y = 10 + G.hsh(i, 2) * (H - 20); if (p.alphaAt(x | 0, y | 0)) p.ell(x, y, 3 + G.hsh(i, 3) * 4, 2 + G.hsh(i, 4) * 3, R[G.hsh(i, 5) > 0.5 ? 1 : 3]); }
    // boca
    for (let y = 40; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.hypot((x + 0.5 - W / 2) / 28, (y + 0.5 - H) / 54); if (d < 1) p.px(x, y, d > 0.9 ? '#2a1414' : '#05020a'); }
    p.outline({ color: OUT });
    return p.toCanvas();
  }
  function tower() {
    const p = mkP(3, 5), W = 96, H = 160;
    const S = ['#2a3a5a', '#5a7cb0', '#a8c0e0', '#d8e8ff', '#ffffff'];
    stoneWall(p, 8, 30, W - 16, H - 30, '#b8cce8', 12, 8);
    for (let x = 8; x < W - 8; x++) { p.px(x, 30, S[0]); }
    // ameias
    for (let i = 0; i < 7; i++) cyl(p, inRR(4 + i * 13, 18, 10, 14, 1), S, [3 + i * 13, 17, 15 + i * 13, 33]);
    // telhado pontudo
    p.poly([[W / 2 - 14, 22], [W / 2 + 14, 22], [W / 2, -1]], (x, y) => (x < W / 2 ? '#9a7ae0' : '#6a4ab0'));
    p.ell(W / 2, 2, 3, 3, '#ffd23a');
    windowAt(p, W / 2 - 6, 54, 12, 14, true, '#3a4a7a'); windowAt(p, W / 2 - 6, 92, 12, 14, true, '#3a4a7a');
    // gelo
    for (let i = 0; i < 12; i++) { const x = 10 + i * 6.5; const len = 4 + G.hsh(i, 9) * 8; for (let k = 0; k < len; k++) p.px(x, 31 + k, k < len - 2 ? '#e8f8ff' : '#a8d8ff'); }
    doorAt(p, W / 2, H, 20, 30, '#3a4a7a', true);
    return finish(p);
  }
  function castle() {
    const p = mkP(8, 6), W = 256, H = 192;
    const S = ['#1a1024', '#3a2a4a', '#5a4a6a', '#7a6a8a', '#9a8aaa'];
    stoneWall(p, 0, 60, W, H - 60, '#5a4a6a', 16, 8);
    for (let i = 0; i < 16; i++) cyl(p, inRR(i * 16 + 1, 48, 12, 14, 1), S, [i * 16, 47, i * 16 + 14, 63]);
    // torres laterais
    for (const tx of [0, W - 56]) {
      stoneWall(p, tx, 16, 56, H - 16, '#6a5a7a', 14, 8);
      for (let i = 0; i < 4; i++) cyl(p, inRR(tx + i * 14 + 1, 4, 11, 14, 1), S, [tx + i * 14, 3, tx + i * 14 + 13, 19]);
      windowAt(p, tx + 22, 50, 12, 18, true, '#2a1a3a'); windowAt(p, tx + 22, 100, 12, 18, true, '#2a1a3a');
      // estandarte
      for (let y = 22; y < 44; y++) for (let x = tx + 18; x < tx + 38; x++) { const tip = y > 38 && Math.abs(x - tx - 28) > (44 - y) * 1.6; if (!tip) p.px(x, y, x === tx + 18 || x === tx + 37 ? '#5a0a1a' : (y < 25 ? '#ffd23a' : '#a81a3a')); }
    }
    // torre central
    stoneWall(p, W / 2 - 40, 24, 80, H - 24, '#6a5a7a', 14, 8);
    for (let i = 0; i < 6; i++) cyl(p, inRR(W / 2 - 40 + i * 14, 12, 11, 14, 1), S, [W / 2 - 41 + i * 14, 11, W / 2 - 27 + i * 14, 27]);
    p.ell(W / 2, 46, 12, 12, { ramp: ['#5a0a2a', '#a81a4a', '#ff3a6a', '#ff9ab8', '#ffffff'], ambient: 0.5 });
    // portão
    for (let y = H - 64; y < H; y++) for (let x = W / 2 - 34; x < W / 2 + 34; x++) {
      const inArch = y > H - 40 || Math.hypot(x + 0.5 - W / 2, y - (H - 40)) < 34;
      if (inArch) p.px(x, y, Math.hypot(x + 0.5 - W / 2, y - (H - 40)) > 30 && y < H - 40 ? S[4] : '#05030a');
    }
    for (let i = 0; i < 6; i++) for (let y = H - 58; y < H; y++) { const x = W / 2 - 25 + i * 10; if (y > H - 40 || Math.hypot(x - W / 2, y - (H - 40)) < 30) p.px(x, y, '#3a3a4a'); }
    for (const yy of [H - 46, H - 28]) for (let x = W / 2 - 28; x < W / 2 + 28; x++) p.px(x, yy, '#3a3a4a');
    return finish(p);
  }

  // ------------------------------------------------------------------
  //  Pequenos
  // ------------------------------------------------------------------
  function well() {
    const p = mkP(2, 2), W = 64;
    stoneWall(p, 6, 34, W - 12, 26, '#a0a0a8', 10, 6);
    p.ell(W / 2, 34, 26, 7, '#3a3a4a'); p.ell(W / 2, 34, 22, 5, '#1a3a8a'); p.ell(W / 2 - 6, 33, 6, 1.5, '#5a8ae8');
    for (const x of [8, W - 12]) cyl(p, inRR(x, 4, 4, 32, 1), R5('#7a4a20'), [x - 1, 3, x + 5, 37]);
    roof(p, 2, 0, W - 4, 10, R5('#c03a3a'), { rowH: 5, shW: 6 });
    p.line(W / 2, 10, W / 2, 26, '#c8b890', 1); cyl(p, inRR(W / 2 - 3, 24, 6, 5, 1), R5('#8a5a2a'), [W / 2 - 4, 23, W / 2 + 4, 30]);
    return finish(p);
  }
  function tent() {
    const p = mkP(3, 3), W = 96, H = 96;
    p.mask(inPoly([[W / 2, 6], [W - 4, H - 2], [4, H - 2]]), (x, y) => { const stripe = Math.floor((x - W / 2) / 8 + 40) % 2; const shade = x > W / 2; return stripe ? (shade ? '#c8b088' : '#f0dcb0') : (shade ? '#a02a2a' : '#d83a3a'); }, [0, 0, W, H]);
    for (let y = H - 34; y < H; y++) for (let x = W / 2 - 12; x < W / 2 + 12; x++) if (Math.abs(x + 0.5 - W / 2) < (y - (H - 34)) * 0.45 + 6) p.px(x, y, '#2a1408');
    p.rect(W / 2 - 1, 0, 2, 8, '#5a3a1a'); p.poly([[W / 2 + 1, 0], [W / 2 + 12, 3], [W / 2 + 1, 6]], '#ffd23a');
    return finish(p);
  }
  function igloo() {
    const p = mkP(3, 3), W = 96, H = 96;
    for (let y = 16; y < H; y++) for (let x = 0; x < W; x++) {
      const d = Math.hypot(x + 0.5 - W / 2, (y + 0.5 - H) * 1.25);
      if (d > 46) continue;
      const row = Math.floor((H - y) / 10), off = row & 1 ? 8 : 0, bx = (x + off) % 16;
      let c = d < 30 && x < W / 2 - 10 ? '#ffffff' : '#e8f2fc';
      if ((H - y) % 10 === 0 || bx === 0) c = '#a8c4dc';
      if (d > 43) c = '#7a9ab8';
      p.px(x, y, c);
    }
    for (let y = H - 30; y < H; y++) for (let x = W / 2 - 14; x < W / 2 + 14; x++) { const d = Math.hypot(x + 0.5 - W / 2, (y - H) * 0.9); if (d < 14) p.px(x, y, d > 11 ? '#c0d8ec' : '#0a1424'); }
    return finish(p);
  }
  function galton() {
    const p = mkP(2, 2), W = 64;
    cyl(p, inRR(2, 2, W - 4, W - 4, 3), R5('#6a4020'), [1, 1, W - 1, W - 1]);
    p.rect(6, 6, W - 12, W - 12, '#f0e8d8');
    for (let r = 0; r < 6; r++) for (let i = 0; i <= r; i++) p.ell(W / 2 - r * 5 + i * 10, 12 + r * 7, 1.3, 1.3, '#5a3a20');
    for (let i = 0; i < 7; i++) p.rect(8 + i * 8, 50, 1, 8, '#5a3a20');
    const hts = [2, 5, 9, 11, 8, 4, 2];
    hts.forEach((h, i) => p.rect(10 + i * 8, 58 - h, 5, h, '#e03a3a'));
    return finish(p);
  }
  function coinStatue() {
    const p = mkP(2, 2), W = 64;
    cyl(p, inRR(8, 40, W - 16, 22, 2), R5('#8a8aa0'), [7, 39, W - 7, 63]);
    p.ell(W / 2, 22, 18, 18, (nx, ny) => { const r = Math.hypot(nx, ny); return r > 0.86 ? '#a06a10' : r > 0.74 ? '#e0a020' : nx < -0.2 ? '#fff0a0' : '#ffd23a'; });
    p.rect(W / 2 - 3, 12, 6, 20, '#c08a1a'); p.px(W / 2 - 2, 13, '#fff6c0');
    return finish(p);
  }
  function dock() {
    const p = mkP(3, 1), W = 96;
    planks(p, 0, 4, W, 24, '#9a6434');
    for (let x = 0; x < W; x += 24) cyl(p, inRR(x + 2, 22, 5, 10, 1), R5('#5a3a1a'), [x + 1, 21, x + 8, 32]);
    return finish(p);
  }
  function snowman() {
    const p = mkP(1, 2), W = 32;
    p.ell(16, 50, 13, 12, { ramp: ['#7a9ab8', '#b8d0e8', '#e8f2fc', '#ffffff', '#ffffff'], ambient: 0.4 });
    p.ell(16, 28, 10, 9.5, { ramp: ['#7a9ab8', '#b8d0e8', '#e8f2fc', '#ffffff', '#ffffff'], ambient: 0.4 });
    cyl(p, inRR(9, 8, 14, 12, 1), R5('#2a2a3a'), [8, 7, 24, 21]); p.rect(6, 18, 20, 3, '#1a1a24');
    p.rect(9, 19, 14, 1, '#c03a3a');
    p.px(12, 26, '#1a1028'); p.px(19, 26, '#1a1028'); p.poly([[16, 29], [24, 30], [16, 31]], '#ff8a2a');
    for (const y of [42, 48, 54]) p.ell(16, y, 1.3, 1.3, '#2a2a3a');
    p.line(5, 38, -1, 30, '#6a4020', 1); p.line(27, 38, 32, 31, '#6a4020', 1);
    return finish(p);
  }
  function grave() {
    const p = mkP(1, 1);
    cyl(p, inRR(5, 3, 22, 24, 6), R5('#8a8a98'), [4, 2, 28, 28]);
    p.rect(14, 8, 4, 14, '#4a4a58'); p.rect(10, 12, 12, 3, '#4a4a58');
    p.rect(3, 26, 26, 5, '#4a4a3a');
    for (let x = 4; x < 28; x += 3) p.px(x, 26, '#5a7a3a');
    return finish(p);
  }
  function lamp() {
    const p = mkP(1, 2);
    cyl(p, inRR(14, 16, 4, 44, 1), R5('#3a3a4a'), [13, 15, 19, 61]);
    cyl(p, inRR(9, 58, 14, 5, 1), R5('#3a3a4a'), [8, 57, 24, 64]);
    cyl(p, inRR(8, 6, 16, 12, 2), R5('#3a3a4a'), [7, 5, 25, 19]);
    p.rect(10, 8, 12, 8, '#ffe08a'); p.rect(11, 9, 4, 3, '#fff8d0');
    p.poly([[6, 6], [26, 6], [16, 0]], '#2a2a3a');
    return finish(p);
  }

  G.structs = {};
  G.buildStructs = function () {
    const S = G.structs;
    S.house_red = house(3, { wall: '#f0e0c0', roof: '#d84a3a', chimney: true });
    S.house_blue = house(3, { wall: '#e8e0d0', roof: '#4a7ad8', wood: '#5a3a2a' });
    S.house_green = house(3, { wall: '#f4ecd8', roof: '#4aa84a', chimney: true });
    S.house_gauss = house(4, { wall: '#e8dcf8', roof: '#8a4ad8', chimney: true, lit: true, wood: '#4a2a5a', extra: (p, W, H, wt) => {
      signBoard(p, W / 2, 8, 30, 16, '#ffd23a', '#3a1a6a', () => { const c = '#3a1a6a'; p.ell(W / 2, 16, 6, 4, c); p.ell(W / 2, 16, 3, 2, '#ffd23a'); p.rect(W / 2 - 8, 19, 16, 1, c); });
    } });
    S.shop = house(4, { wall: '#f8f0d8', roof: '#e09a3a', lit: true, extra: (p, W, H, wt) => {
      for (let i = 0; i < W - 8; i += 8) for (let y = wt - 2; y < wt + 8; y++) for (let x = 4 + i; x < 8 + i; x++) p.px(x, y, (i / 8) % 2 ? '#ffffff' : '#e03a3a');
      for (let i = 4; i < W - 4; i += 8) p.ell(i + 4, wt + 8, 4, 2, (i / 8) % 2 ? '#ffffff' : '#e03a3a');
      signBoard(p, W / 2, wt + 12, 26, 12, '#3a2418', '#ffd23a', () => { p.ell(W / 2, wt + 18, 4, 4, '#ffd23a'); p.rect(W / 2 - 1, wt + 15, 2, 6, '#3a2418'); });
    } });
    S.clinic = house(4, { wall: '#ffffff', roof: '#e8e8f4', wood: '#8a8aa0', extra: (p, W) => {
      p.rect(W / 2 - 4, 6, 8, 22, '#e03030'); p.rect(W / 2 - 11, 13, 22, 8, '#e03030');
      p.rect(W / 2 - 3, 7, 2, 20, '#ff7a7a');
    } });
    S.casino = house(4, { wall: '#4a2a5a', roof: '#c03a8a', lit: true, door: '#ffd23a', wood: '#2a0a3a', extra: (p, W, H, wt) => {
      for (let i = 0; i < 9; i++) p.ell(8 + i * 14, wt + 3, 2, 2, i % 2 ? '#ffd23a' : '#ff5aa0');
      signBoard(p, W / 2, 6, 26, 24, '#ffffff', '#1b1428', () => { const c = '#c02a3a'; for (const [x, y] of [[-6, 4], [6, 4], [0, 12], [-6, 20], [6, 20]]) p.ell(W / 2 + x, 7 + y, 2, 2, c); });
    } });
    S.barn = house(4, { wall: '#c83a2a', roof: '#7a5a3a', planks: true, door: '#5a2a1a', arch: false, doorW: 26, extra: (p, W, H) => { p.line(W / 2 - 13, H - 28, W / 2 + 13, H - 2, '#f4e8d8', 2); p.line(W / 2 + 13, H - 28, W / 2 - 13, H - 2, '#f4e8d8', 2); } });
    S.hut = house(3, { wall: '#a07a4a', roof: '#6a8a3a', planks: true, wood: '#4a3a1a' });
    S.tent = tent(); S.igloo = igloo(); S.well = well();
    S.temple_d1 = temple(['#a8c8a8', '#7a9a7a', '#4a6a4a', '#1e3a24'], '#ffd23a');
    S.temple_d2 = temple(['#c8a878', '#9a7a4a', '#6a5030', '#3a2a14'], '#7aff8a');
    S.temple_d3 = temple(['#f0d8a0', '#d0aa6a', '#9a7444', '#5a4020'], '#5a8aff');
    S.cave = cave(); S.tower = tower(); S.castle = castle();
    S.galton = galton(); S.coinStatue = coinStatue(); S.dock = dock(); S.snowman = snowman(); S.grave = grave(); S.lamp = lamp();
  };
})(window.G);
