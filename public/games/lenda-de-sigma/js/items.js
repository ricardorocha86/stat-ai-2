'use strict';
// =====================================================================
//  Itens, objetos interativos e efeitos em alta resolução.
// =====================================================================
(function (G) {
  const SPR = G.spr, C = G.col;
  const { cyl, bevel, inEll, inRR, inPoly, bboxOf } = G.artTools;
  const R5 = c => C.ramp(c, 5);
  const P = (lw, lh) => new G.Paint(Math.round(lw * 2), Math.round(lh * 2));
  const GOLD = ['#7a4a10', '#c08a1a', '#ffd23a', '#ffe98a', '#fffbe0'];
  const heartMask = (cx, cy, s) => (x, y) => { const X = (x + 0.5 - cx) / s, Y = -(y + 0.5 - cy) / s; const a = X * X + Y * Y - 1; return a * a * a - X * X * Y * Y * Y <= 0; };

  function coins() {
    const ws = [1, 0.7, 0.25, 0.7];
    const make = (ramp, f) => {
      const p = P(10, 12), wf = ws[f];
      const rx = Math.max(1, 8 * wf), cx = 10, cy = 12;
      p.ell(cx, cy, rx, 10, (nx, ny, x, y) => {
        if (wf < 0.35) return x < cx ? ramp[3] : ramp[1];
        const r = Math.hypot(nx, ny);
        if (r > 0.78) return nx < 0.2 && ny < 0.2 ? ramp[3] : ramp[1];
        if (r > 0.66) return ramp[2];
        return nx < -0.2 ? ramp[3] : ramp[2];
      });
      if (wf > 0.5) { for (let y = cy - 5; y <= cy + 5; y++) p.px(cx + (wf > 0.9 ? 0 : 0), y, ramp[1]); p.px(cx - 1, cy - 5, ramp[4]); }
      p.px(cx - rx * 0.5, cy - 6, ramp[4]); p.px(cx - rx * 0.5, cy - 5, ramp[4]);
      p.outline({ k: -0.7 });
      return p.toCanvas();
    };
    for (let f = 0; f < 4; f++) SPR['coin' + f] = make(GOLD, f);
    SPR.coinBlue = make(['#1a3a8a', '#2a6ad0', '#5aa8ff', '#a8d8ff', '#ffffff'], 0);
    SPR.coinRed = make(['#7a1010', '#c02a2a', '#ff5a5a', '#ffa8a8', '#ffffff'], 0);
    // ícone de moeda do HUD (8x8)
    const p = P(8, 8);
    p.ell(8, 8, 6.5, 7, (nx, ny) => (Math.hypot(nx, ny) > 0.75 ? (nx < 0 ? GOLD[3] : GOLD[1]) : nx < -0.1 ? GOLD[3] : GOLD[2]));
    for (let y = 5; y < 12; y++) p.px(8, y, GOLD[1]);
    p.outline({ k: -0.7 }); SPR.iconCoin = p.toCanvas();
  }
  function hearts() {
    const red = ['#5a0a1a', '#b81a30', '#ff3a4a', '#ff8a94', '#ffe0e4'];
    const mk = (lw, lh, s, empty, cy) => {
      const p = P(lw, lh), cx = lw;
      const m = heartMask(cx, cy, s);
      p.mask(m, (x, y) => {
        const nx = (x + 0.5 - cx) / s, ny = (y + 0.5 - cy) / s;
        if (empty) return ny < -0.2 ? '#4a2a3a' : '#3a1a2a';
        if (nx < -0.25 && ny < -0.15 && ny > -0.75) return red[3];
        if (nx > 0.35 || ny > 0.55) return red[1];
        return red[2];
      }, [0, 0, lw * 2, lh * 2]);
      if (!empty) { p.px(cx - s * 0.55, cy - s * 0.5, red[4]); p.px(cx - s * 0.45, cy - s * 0.6, red[4]); }
      p.outline({ color: '#1a0810' });
      return p.toCanvas();
    };
    SPR.heartFull = mk(9, 8, 6.6, false, 7.5);
    SPR.heartEmpty = mk(9, 8, 6.6, true, 7.5);
    SPR.heartPick = SPR.heartFull;
    // quartos do coração do HUD (alto-esq., alto-dir., baixo-dir., baixo-esq.) e a costura entre eles
    {
      const f = SPR.heartFull, w = f.width, h = f.height, mx = w / 2, my = h / 2;
      [[0, 0], [mx, 0], [mx, my], [0, my]].forEach(([x, y], q) => {
        const c = G.acanvas(G.lw(f), G.lh(f)); c.getContext('2d').drawImage(f, x, y, mx, my, x, y, mx, my); SPR['heartQ' + q] = c;
      });
      const c = G.acanvas(G.lw(f), G.lh(f)), g = c.getContext('2d');
      g.drawImage(f, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = 'rgba(26,8,16,0.8)';
      g.beginPath(); g.rect(mx - 1, 0, 1, h); g.rect(0, my, w, 1); g.fill();
      SPR.heartCostura = c;
    }
    // contêiner (grande, dourado)
    {
      const p = P(16, 16), cx = 16, cy = 15, s = 11.5;
      p.mask(heartMask(cx, cy, s), (x, y) => { const nx = (x + 0.5 - cx) / s, ny = (y + 0.5 - cy) / s; return nx < -0.25 && ny < -0.1 && ny > -0.75 ? red[3] : (nx > 0.35 || ny > 0.5) ? red[1] : red[2]; });
      p.ell(cx - 5, cy - 5, 2.5, 1.6, red[4]);
      p.outline({ color: '#ffe060' }); p.outline({ color: '#7a4a10' });
      SPR.heartContainer = p.toCanvas();
    }
    // fragmentos: k quartos acesos (1 = um quarto, 2 = metade, 3 = três quartos), na mesma ordem do HUD
    // (relógio a partir do alto à esquerda); os quartos que faltam ficam como vidro escuro, com costura
    for (let k = 1; k <= 3; k++) {
      const p = P(16, 16), cx = 16, cy = 15, s = 11.5, m = heartMask(cx, cy, s), cyq = cy + 1;
      const quarto = (x, y) => (y < cyq ? (x < cx ? 0 : 1) : (x < cx ? 3 : 2));
      p.mask((x, y) => m(x, y) && quarto(x, y) < k, (x, y) => { const nx = (x + 0.5 - cx) / s, ny = (y + 0.5 - cy) / s; return nx < -0.25 && ny < -0.1 && ny > -0.75 ? red[3] : (ny > 0.5) ? red[1] : red[2]; });
      p.mask((x, y) => m(x, y) && quarto(x, y) >= k, (x, y) => ((y + 0.5 - cy) / s < -0.2 ? '#6a4a6ae0' : '#523854e0'));
      p.mask((x, y) => m(x, y) && (x === cx - 1 || y === cyq - 1), '#3a0a18');
      p.outline({ color: '#ffe060' });
      SPR['heartPiece' + k] = p.toCanvas();
    }
    SPR.heartPiece = SPR.heartPiece1; // o fragmento solto no mundo é um quarto de coração
  }
  function keys() {
    const mkKey = (ramp, big) => {
      const p = P(16, 16);
      // argola
      p.ell(16, 9, big ? 7 : 6, big ? 7 : 6, { ramp, ambient: 0.4 });
      p.ell(16, 9, big ? 3.2 : 2.6, big ? 3.2 : 2.6, '#00000000');
      for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const d = Math.hypot(x + 0.5 - 16, y + 0.5 - 9); if (d < (big ? 3.2 : 2.6)) p.erase(x, y); }
      // haste
      cyl(p, (x, y) => x >= 14 && x <= 18 && y >= 14 && y <= 29, ramp, [13, 13, 19, 30]);
      // dentes
      for (const [ty, w] of [[22, 6], [26, 5]]) for (let y = ty; y < ty + 2; y++) for (let x = 19; x < 19 + w; x++) p.px(x, y, y === ty ? ramp[3] : ramp[1]);
      if (big) { p.ell(16, 9, 1.6, 1.6, '#ff3a5a'); }
      p.outline({ k: -0.75 });
      return p.toCanvas();
    };
    SPR.key = mkKey(GOLD);
    SPR.bossKey = mkKey(['#3a0a5a', '#7a2ab0', '#c060ff', '#e8b0ff', '#ffffff'], true);
    const p = P(8, 8);
    p.ell(8, 4.5, 3.5, 3.5, { ramp: GOLD, ambient: 0.4 });
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (Math.hypot(x + 0.5 - 8, y + 0.5 - 4.5) < 1.5) p.erase(x, y);
    p.rect(7, 7, 2, 8, GOLD[2]); p.rect(9, 11, 3, 1, GOLD[2]); p.rect(9, 13, 2, 1, GOLD[2]);
    p.outline({ k: -0.75 }); SPR.iconKey = p.toCanvas();
  }
  function bombs() {
    const body = ['#0e0e1c', '#1e1e34', '#34344e', '#5a5a7a', '#a8a8d0'];
    const mk = (lw, cx, cy, r, tint) => {
      const p = P(lw, lw);
      p.ell(cx, cy, r, r, { ramp: tint ? body.map(c => C.mix(c, '#ff3a2a', 0.5)) : body, ambient: 0.3, contrast: 1.2 });
      p.ell(cx - r * 0.4, cy - r * 0.45, r * 0.22, r * 0.16, '#d8d8ff');
      cyl(p, inRR(cx - 2.5, cy - r - 3, 5, 4, 1), ['#4a3a2a', '#6a5a4a', '#9a8a7a', '#c8b8a8', '#ffffff'], [cx - 4, cy - r - 4, cx + 4, cy - r + 2]);
      p.line(cx + 1, cy - r - 3, cx + 4, cy - r - 7, '#c8a878', 1);
      p.outline({ k: -0.6 });
      p.px(cx + 4, cy - r - 8, '#ffe060'); p.px(cx + 5, cy - r - 8, '#ff8a2a');
      return p.toCanvas();
    };
    SPR.bomb = mk(16, 16, 19, 9);
    SPR.bombRed = mk(16, 16, 19, 9, true);
    SPR.iconBomb = mk(8, 8, 9.5, 5);
  }
  function potions() {
    const mk = (lw, liquid) => {
      const p = P(lw, lw), s = lw / 16;
      const L = R5(liquid);
      const cx = 16 * s;
      // gargalo e rolha
      cyl(p, inRR(cx - 3 * s, 3 * s, 6 * s, 4 * s, 1), ['#4a2a10', '#7a4a20', '#a87040', '#d0a070', '#f0d0a0'], [0, 0, lw * 2, lw * 2]);
      cyl(p, inRR(cx - 3.5 * s, 7 * s, 7 * s, 4 * s, 1), ['#5a6a88', '#8a9ab8', '#c0d0e8', '#e8f0ff', '#ffffff'], [0, 0, lw * 2, lw * 2]);
      // bulbo
      p.ell(cx, 19 * s, 11 * s, 10 * s, (nx, ny, x, y) => {
        if (ny < -0.35) return C.alpha('#c8e0ff', 0.6);
        const r = Math.hypot(nx, ny);
        if (nx < -0.45 && ny < 0.1) return L[4];
        return r > 0.8 ? L[1] : ny > 0.4 ? L[1] : L[2];
      });
      p.ell(cx - 5 * s, 15 * s, 1.6 * s, 3 * s, '#ffffffcc');
      p.outline({ k: -0.8 });
      return p.toCanvas();
    };
    SPR.potion = mk(16, '#ff3a5a');
    SPR.iconPotion = mk(8, '#ff3a5a');
  }
  function powerups() {
    // cogumelos
    const mush = (capC) => {
      const p = P(16, 16), cap = R5(capC), stem = R5('#f8e4c0');
      cyl(p, inRR(10, 18, 12, 11, 3), stem, [9, 17, 23, 30]);
      p.mask((x, y) => { const dx = (x + 0.5 - 16) / 15, dy = (y + 0.5 - 17) / 14; return dy <= 0.12 && dx * dx + dy * dy <= 1; }, (x, y) => { const nx = (x + 0.5 - 16) / 15, ny = (y + 0.5 - 17) / 14; return p.lit({ ramp: cap, ambient: 0.35 }, nx, ny, Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)), x, y); }, [0, 0, 32, 20]);
      for (const [x, y, r] of [[9, 9, 3.5], [22, 8, 3], [16, 4, 2.4]]) p.ell(x, y, r, r * 0.9, (nx) => (nx < 0.2 ? '#ffffff' : '#e8e0d8'));
      p.outline({ k: -0.75 });
      p.rect(13, 21, 2, 4, '#1a1028'); p.rect(18, 21, 2, 4, '#1a1028');
      return p.toCanvas();
    };
    SPR.mushroom = mush('#e83a2a'); SPR.mushroomG = mush('#3ac04a');
    // estrela
    {
      const p = P(16, 16), Y = ['#a05a10', '#e0a020', '#ffd23a', '#fff08a', '#ffffff'];
      const pts = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 6 : 14; pts.push([16 + Math.cos(a) * r, 17 + Math.sin(a) * r]); }
      p.litMask(inPoly(pts), { ramp: Y, radius: 5, ambient: 0.4 }, [0, 0, 31, 31]);
      p.outline({ k: -0.7 });
      p.rect(12, 14, 2, 4, '#5a2a10'); p.rect(18, 14, 2, 4, '#5a2a10');
      SPR.star = p.toCanvas();
    }
  }
  function equipment() {
    // botas
    {
      const p = P(16, 16), B = R5('#c0602a');
      cyl(p, inRR(12, 4, 9, 18, 2), B, [11, 3, 22, 23]);
      cyl(p, inRR(8, 20, 16, 9, 3), B, [7, 19, 25, 30]);
      for (let x = 12; x < 21; x++) p.px(x, 14, '#ffd23a');
      // asinha
      p.poly([[12, 8], [4, 3], [6, 9], [3, 11], [12, 12]], '#ffffff');
      p.line(5, 6, 11, 9, '#c8d8f0');
      p.outline({ k: -0.75 });
      SPR.boots = p.toCanvas();
    }
    // canhão de raio
    {
      const p = P(16, 16), O = R5('#ff9a2a');
      cyl(p, inRR(4, 8, 20, 14, 5), O, [3, 7, 25, 23]);
      cyl(p, inRR(20, 11, 9, 8, 2), ['#2a2a3a', '#4a4a5a', '#7a7a8a', '#a8a8b8', '#e0e0f0'], [19, 10, 30, 20]);
      p.ell(28, 15, 2, 3, '#7ae4ff'); p.px(28, 14, '#ffffff');
      p.ell(10, 13, 3, 2, O[4]);
      p.outline({ k: -0.75 });
      SPR.beamItem = p.toCanvas();
    }
    // traje térmico
    {
      const p = P(16, 16), O = R5('#ff8a2a'), Gn = R5('#5aff8a');
      cyl(p, inPoly([[8, 6], [24, 6], [27, 12], [25, 29], [7, 29], [5, 12]]), O, [4, 5, 28, 30]);
      cyl(p, inRR(10, 9, 12, 8, 3), Gn, [9, 8, 23, 18]);
      p.rect(8, 20, 16, 2, '#ffd23a');
      cyl(p, inRR(1, 9, 6, 12, 2), O, [0, 8, 8, 22]); cyl(p, inRR(25, 9, 6, 12, 2), O, [24, 8, 32, 22]);
      p.outline({ k: -0.75 });
      p.px(13, 11, '#ffffff'); p.px(14, 11, '#ffffff');
      SPR.suit = p.toCanvas();
    }
    // pergaminho
    {
      const p = P(16, 16), Pp = ['#8a6a3a', '#c8a870', '#f0dca8', '#fff2cc', '#ffffff'];
      cyl(p, inRR(6, 8, 20, 16, 1), Pp, [5, 7, 27, 25], { noTop: true });
      for (const y of [6, 23]) cyl(p, inRR(3, y, 26, 5, 2.5), ['#4a2a10', '#7a4a20', '#a87040', '#d0a070', '#f0d0a0'], [2, y - 1, 30, y + 6]);
      for (const y of [12, 15, 18]) for (let x = 10; x < 22; x++) if ((x + y) % 5 !== 0) p.px(x, y, '#7a5a3a');
      p.outline({ k: -0.75 });
      SPR.scroll = p.toCanvas();
    }
    // espada (ícone diagonal)
    {
      const p = P(16, 16);
      const bl = ['#5a6a88', '#8a9ab8', '#c8d4e8', '#eef4ff', '#ffffff'];
      for (let i = 0; i < 20; i++) { const x = 8 + i, y = 23 - i; p.px(x, y, bl[3]); p.px(x + 1, y, bl[2]); p.px(x + 1, y + 1, bl[1]); p.px(x, y + 1, bl[2]); }
      p.line(4, 17, 13, 26, GOLD[2], 2.5);
      p.line(3, 29, 9, 23, '#7a4a2a', 2.5);
      p.ell(3, 29, 2, 2, GOLD[2]);
      p.outline({ k: -0.8 });
      SPR.swordIcon = p.toCanvas();
    }
    // armadura
    {
      const p = P(16, 16), A = R5('#a0a8c0');
      cyl(p, inPoly([[6, 5], [26, 5], [28, 11], [24, 14], [24, 26], [16, 29], [8, 26], [8, 14], [4, 11]]), A, [3, 4, 29, 30]);
      p.line(16, 8, 16, 26, A[4]); p.ell(16, 15, 2.5, 2.5, GOLD[2]);
      p.outline({ k: -0.75 });
      SPR.armorIcon = p.toCanvas();
    }
    // bolsa
    {
      const p = P(16, 16), B = R5('#a07a4a');
      p.ell(16, 20, 11, 10, { ramp: B, ambient: 0.35 });
      cyl(p, inRR(11, 5, 10, 6, 2), B, [10, 4, 22, 12]);
      p.rect(10, 10, 12, 2, GOLD[2]);
      p.outline({ k: -0.75 });
      SPR.bagIcon = p.toCanvas();
    }
  }
  function crystals() {
    const cc = { media: '#5aff7a', mediana: '#5ad8ff', dispersao: '#ffd84a', prob: '#ff6a5a', distrib: '#d0dcff', amostra: '#d080ff' };
    for (const k in cc) {
      const R = R5(cc[k]);
      const p = P(16, 16);
      const top = [[16, 1], [24, 9], [16, 30], [8, 9]];
      // facetas
      const facets = [
        [[[16, 1], [8, 9], [16, 11]], R[4]], [[[16, 1], [24, 9], [16, 11]], R[3]],
        [[[8, 9], [16, 11], [16, 30]], R[2]], [[[24, 9], [16, 11], [16, 30]], R[1]],
        [[[8, 9], [5, 12], [16, 30]], R[1]], [[[24, 9], [27, 12], [16, 30]], R[0]]
      ];
      for (const [pts, col] of facets) p.poly(pts, col);
      p.px(12, 6, '#ffffff'); p.px(13, 5, '#ffffff'); p.px(11, 7, '#ffffff');
      p.outline({ k: -0.8 });
      SPR['crystal_' + k] = p.toCanvas();
    }
  }
  function containers() {
    // baú
    const wood = ['#3a1a08', '#6a3a1a', '#a0602a', '#c8843e', '#e8a860'];
    const make = (open) => {
      const p = P(16, 16);
      if (open) {
        cyl(p, inRR(3, 2, 26, 9, 2), wood, [2, 1, 30, 12]);
        p.rect(3, 9, 26, 3, '#1a0a04');
        for (let x = 4; x < 28; x++) p.px(x, 11, '#2a1408');
      }
      cyl(p, inRR(3, open ? 12 : 4, 26, open ? 16 : 24, 2), wood, [2, 3, 30, 29]);
      if (!open) { for (let x = 3; x < 29; x++) { p.px(x, 13, GOLD[1]); p.px(x, 14, GOLD[3]); } }
      for (const x of [3, 4, 27, 28]) for (let y = open ? 12 : 4; y < 28; y++) p.px(x, y, x === 3 || x === 27 ? GOLD[3] : GOLD[1]);
      for (let x = 3; x < 29; x++) { p.px(x, 26, GOLD[1]); p.px(x, 25, GOLD[3]); }
      if (!open) { cyl(p, inRR(13, 11, 6, 7, 1.5), GOLD, [12, 10, 20, 19]); p.rect(15, 14, 2, 2, '#2a1408'); }
      p.outline({ k: -0.8 });
      return p.toCanvas();
    };
    SPR.chest = make(false); SPR.chestOpen = make(true);
    // pote de cerâmica
    {
      const p = P(16, 16), Cc = R5('#c8784a');
      p.ell(16, 19, 11, 10, { ramp: Cc, ambient: 0.35, contrast: 1.1 });
      cyl(p, inRR(10, 5, 12, 5, 2), Cc, [9, 4, 23, 11]);
      for (let x = 7; x < 26; x++) p.px(x, 16, Cc[1]);
      for (let x = 8; x < 25; x += 3) p.px(x, 15, Cc[3]);
      p.ell(11, 18, 2, 4, Cc[4]);
      p.outline({ k: -0.78 });
      p.rect(12, 5, 8, 2, '#2a1408');
      SPR.pot = p.toCanvas();
    }
  }
  function blocks() {
    // bloco "?"
    const Y = ['#7a4a08', '#c88a10', '#ffc02a', '#ffe08a', '#fff8d0'];
    for (let f = 0; f < 2; f++) {
      const p = P(16, 16);
      bevel(p, (x, y) => x >= 0 && y >= 0 && x < 32 && y < 32, f ? Y.map(c => C.mix(c, '#ffffff', 0.25)) : Y, [0, 0, 31, 31]);
      for (let y = 2; y < 30; y++) for (let x = 2; x < 30; x++) p.px(x, y, f ? C.mix(Y[2], '#ffffff', 0.25) : Y[2]);
      for (const [x, y] of [[4, 4], [27, 4], [4, 27], [27, 27]]) { p.px(x, y, Y[0]); p.px(x + 1, y, Y[1]); }
      // "?" com sombra
      const q = ['.####.', '##..##', '....##', '...##.', '..##..', '..##..', '......', '..##..'];
      for (let yy = 0; yy < q.length; yy++) for (let xx = 0; xx < 6; xx++) if (q[yy][xx] === '#') {
        for (const [dx, dy, c] of [[1, 1, Y[0]], [0, 0, '#ffffff']]) { p.px(10 + xx * 2 + dx, 8 + yy * 2 + dy, c); p.px(11 + xx * 2 + dx, 8 + yy * 2 + dy, c); p.px(10 + xx * 2 + dx, 9 + yy * 2 + dy, c); p.px(11 + xx * 2 + dx, 9 + yy * 2 + dy, c); }
      }
      p.outline({ color: '#3a2008' });
      SPR['qblock' + f] = p.toCanvas();
    }
    {
      const p = P(16, 16), B = ['#3a1a08', '#6a4020', '#a0703a', '#c08a50', '#d8a868'];
      bevel(p, (x, y) => x >= 0 && y >= 0 && x < 32 && y < 32, B, [0, 0, 31, 31]);
      for (let y = 2; y < 30; y++) for (let x = 2; x < 30; x++) p.px(x, y, B[2]);
      for (const [x, y] of [[4, 4], [27, 4], [4, 27], [27, 27]]) p.px(x, y, B[0]);
      p.outline({ color: '#2a1408' });
      SPR.qused = p.toCanvas();
    }
    // tijolo
    {
      const p = P(16, 16), B = ['#5a1a08', '#a04a20', '#d8703a', '#f0985a', '#ffc090'];
      for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
        const row = y >> 3, off = row & 1 ? 8 : 0, bx = (x + off) & 15, by = y & 7;
        p.px(x, y, by === 7 || bx === 15 ? B[0] : by === 0 ? B[3] : bx === 0 ? B[3] : by === 6 ? B[1] : B[2]);
      }
      SPR.brick = p.toCanvas();
    }
    // bloco empurrável (pedra lavrada com placa para número)
    {
      const p = P(16, 16), S = ['#2a2630', '#4a4452', '#6e6676', '#948a9c', '#bcb2c4'];
      p.rect(1, 1, 30, 30, S[2]);
      bevel(p, (x, y) => x >= 1 && y >= 1 && x < 31 && y < 31, S, [1, 1, 30, 30]);
      for (let y = 3; y < 29; y++) for (let x = 3; x < 29; x++) p.px(x, y, ((x * 7 + y * 3) % 23 === 0) ? S[1] : S[2]);
      // placa central
      for (let y = 8; y < 22; y++) for (let x = 7; x < 25; x++) p.px(x, y, y === 8 || x === 7 ? S[0] : y === 21 || x === 24 ? S[3] : '#3a3044');
      p.outline({ color: '#140e1a' });
      SPR.block = p.toCanvas();
    }
    // placa de pressão
    const plate = (on) => {
      const p = P(16, 16), B = on ? ['#6a4a10', '#a07a20', '#e0b040', '#ffd870', '#fff0b0'] : ['#3a2a18', '#5a4428', '#806444', '#a4865e', '#c8a87c'];
      p.rect(2, 2, 28, 28, B[1]);
      bevel(p, (x, y) => x >= 2 && y >= 2 && x < 30 && y < 30, B, [2, 2, 29, 29]);
      const inset = on ? 6 : 5;
      for (let y = inset; y < 32 - inset; y++) for (let x = inset; x < 32 - inset; x++) p.px(x, y, (x + y) % 6 === 0 ? B[3] : B[2]);
      if (!on) bevel(p, (x, y) => x >= 5 && y >= 5 && x < 27 && y < 27, B, [5, 5, 26, 26]);
      p.outline({ color: '#1a1008' });
      return p.toCanvas();
    };
    SPR.plate = plate(false); SPR.plateOn = plate(true);
  }
  function scenery() {
    // placa de madeira
    {
      const p = P(16, 16), Wd = ['#3a2410', '#6a4020', '#9a6434', '#c8904a', '#e8b870'];
      cyl(p, inRR(14, 18, 4, 13, 1), Wd, [13, 17, 19, 31]);
      cyl(p, inRR(2, 4, 28, 15, 2), Wd, [1, 3, 31, 20], { noTop: false });
      for (const y of [9, 13]) for (let x = 6; x < 26; x++) if ((x * 3 + y) % 7 !== 0) p.px(x, y, Wd[0]);
      p.outline({ k: -0.8 });
      SPR.sign = p.toCanvas();
    }
    // tábua de pedra (lição)
    {
      const p = P(16, 16), S = ['#3a4058', '#5a6280', '#8a94b0', '#b8c2dc', '#e0e8ff'];
      cyl(p, inRR(5, 2, 22, 24, 4), S, [4, 1, 28, 27]);
      for (let y = 7; y < 22; y += 3) for (let x = 9; x < 23; x++) if ((x * 5 + y) % 6 > 1) p.px(x, y, '#3a4a7a');
      cyl(p, inRR(2, 25, 28, 6, 2), ['#2a2a3a', '#44445a', '#6a6a82', '#9090a8', '#c0c0d0'], [1, 24, 31, 31]);
      p.outline({ k: -0.8 });
      p.px(10, 5, '#ffffff'); p.px(11, 5, '#ffffff');
      SPR.tablet = p.toCanvas();
    }
    // pedra oráculo
    {
      const p = P(16, 19), S = ['#2a2a48', '#4a4a70', '#7070a0', '#9a9ac8', '#c8c8f0'];
      cyl(p, inPoly([[16, 1], [25, 8], [26, 32], [6, 32], [7, 8]]), S, [5, 0, 27, 33]);
      p.ell(16, 13, 5, 5, { ramp: ['#1a3a6a', '#2a7ab0', '#7ae4ff', '#c8f8ff', '#ffffff'], ambient: 0.5 });
      cyl(p, inRR(3, 31, 26, 6, 2), ['#1a1a2a', '#34344a', '#545470', '#7a7a98', '#a0a0c0'], [2, 30, 30, 38]);
      for (let y = 21; y < 29; y += 3) for (let x = 10; x < 22; x++) if ((x + y) % 4) p.px(x, y, S[1]);
      p.outline({ k: -0.8 });
      SPR.oracle = p.toCanvas();
    }
    // estátua guardiã (pedestal de item)
    {
      const p = P(16, 21), S = ['#4a3a28', '#7a6448', '#a89070', '#cab494', '#ece0c8'];
      cyl(p, inRR(1, 32, 30, 10, 2), ['#2a2420', '#4a4038', '#6a5c50', '#8e7e70', '#b0a090'], [0, 31, 32, 42]);
      cyl(p, inPoly([[8, 14], [24, 14], [27, 32], [5, 32]]), S, [4, 13, 28, 33]);
      p.ell(16, 9, 7, 7, { ramp: S, ambient: 0.4 });
      p.ell(13, 9, 1, 1.5, '#ff5a5a'); p.ell(19, 9, 1, 1.5, '#ff5a5a');
      cyl(p, inRR(3, 18, 5, 12, 2), S, [2, 17, 9, 31]); cyl(p, inRR(24, 18, 5, 12, 2), S, [23, 17, 30, 31]);
      p.outline({ k: -0.8 });
      SPR.statue = p.toCanvas();
    }
    // estação de salvamento (32x16)
    {
      const p = P(32, 16);
      p.ell(32, 16, 30, 13, (nx, ny) => { const r = Math.hypot(nx, ny); return r > 0.88 ? '#2a3a6a' : r > 0.74 ? '#5a7ac0' : r > 0.62 ? '#9ae8ff' : r > 0.4 ? '#2a4a8a' : '#4a8ae8'; });
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; p.px(32 + Math.cos(a) * 23, 16 + Math.sin(a) * 10, '#ffffff'); }
      p.outline({ color: '#0e1430' });
      SPR.savepad = p.toCanvas();
    }
    // cano (32x32)
    {
      const p = P(32, 32), Gr = ['#0a3a14', '#1a7a2a', '#3ac04a', '#8af06a', '#d0ffc0'];
      cyl(p, inRR(5, 20, 54, 44, 2), Gr, [4, 19, 60, 64], { hi: 0.18, sh: 0.7 });
      cyl(p, inRR(1, 2, 62, 22, 3), Gr, [0, 1, 64, 25], { hi: 0.15, sh: 0.72 });
      p.rrect(8, 6, 48, 12, 4, '#062010'); p.rrect(10, 8, 44, 9, 3, '#020a04');
      p.outline({ color: '#041a08' });
      SPR.pipe = p.toCanvas();
    }
    // cursor
    {
      const p = new G.Paint(12, 14);
      p.poly([[1, 1], [11, 7], [1, 13]], (x, y) => (y < 6 ? '#fff4a0' : '#ffd84a'));
      p.outline({ color: '#3a2008' });
      SPR.cursor = p.toCanvas();
    }
  }
  function effects() {
    // explosão: 4 quadros com fumaça
    for (let f = 0; f < 4; f++) {
      const p = P(40, 40), cx = 40, cy = 40;
      const r = 12 + f * 8;
      const rnd = G.mulberry32(f * 91 + 3);
      const puffs = [];
      for (let i = 0; i < 9; i++) { const a = rnd() * Math.PI * 2, d = rnd() * r * 0.7; puffs.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.85, r * (0.35 + rnd() * 0.3)]); }
      for (const [x, y, rr] of puffs) {
        p.ell(x, y, rr, rr, (nx, ny) => {
          const k = Math.hypot(nx, ny) + f * 0.25 + (ny < 0 ? -0.15 : 0.1);
          if (f >= 2 && k > 0.95) return f === 3 ? '#5a5258' : '#8a7a72';
          if (k < 0.45) return f < 2 ? '#ffffff' : '#ffe890';
          if (k < 0.75) return f < 2 ? '#ffe070' : '#ff9a2a';
          if (k < 1.05) return f < 3 ? '#ff7a2a' : '#7a6a6a';
          return f < 2 ? '#d83a1a' : '#5a4a4a';
        });
      }
      if (f === 3) for (let y = 0; y < 80; y++) for (let x = 0; x < 80; x++) { const d = Math.hypot(x - cx, y - cy); if (d < r * 0.45) p.erase(x, y); }
      SPR['boom' + f] = p.toCanvas();
    }
    const orbS = (lw, cols, edge) => { const p = P(lw, lw), c = lw; p.ell(c, c, lw * 0.75, lw * 0.75, (nx, ny) => { const r = Math.hypot(nx, ny); return r < 0.4 ? cols[0] : r < 0.7 ? cols[1] : cols[2]; }); p.outline({ color: edge }); return p.toCanvas(); };
    SPR.shot = orbS(8, ['#ffffff', '#fff08a', '#ffb02a'], '#c05a10');
    SPR.bigshot = orbS(14, ['#ffffff', '#c0f4ff', '#4aa8ff'], '#1a3a9a');
    SPR.fireball = orbS(10, ['#ffffff', '#ffe07a', '#ff6a2a'], '#a01a10');
    SPR.orb = orbS(10, ['#ffffff', '#f0a0ff', '#a03ad0'], '#3a0a5a');
    SPR.snowball = orbS(10, ['#ffffff', '#f0f8ff', '#b8d4ec'], '#4a6a8a');
    {
      const p = P(8, 8); p.litMask(inEll(8, 8, 6.5, 6), { ramp: ['#3a2a28', '#6a5a50', '#9a8a7a', '#c8b8a8', '#f0e0d0'], radius: 4 }, [0, 0, 15, 15]); p.outline({ k: -0.7 }); SPR.rock = p.toCanvas();
    }
    {
      const p = P(10, 10);
      for (let a = 0; a < 8; a++) { const an = a * Math.PI / 4; p.line(10, 10, 10 + Math.cos(an) * 9, 10 + Math.sin(an) * 9, '#e8e8f4', 1); }
      for (const r of [3.5, 6.5]) for (let a = 0; a < 40; a++) { const an = a / 40 * Math.PI * 2; p.px(10 + Math.cos(an) * r, 10 + Math.sin(an) * r, '#ffffff'); }
      SPR.web = p.toCanvas();
    }
    {
      const p = new G.Paint(10, 10);
      p.line(5, 0, 5, 10, '#ffffff'); p.line(0, 5, 10, 5, '#ffffff');
      p.px(4, 4, '#fff6a0'); p.px(5, 4, '#ffffff'); p.px(4, 5, '#ffffff'); p.px(5, 5, '#ffe060');
      p.px(3, 5, '#ffd84a'); p.px(6, 5, '#ffd84a');
      SPR.sparkle = p.toCanvas();
    }
  }
  G.buildItems = function () { coins(); hearts(); keys(); bombs(); potions(); powerups(); equipment(); crystals(); containers(); blocks(); scenery(); effects(); };
})(window.G);
