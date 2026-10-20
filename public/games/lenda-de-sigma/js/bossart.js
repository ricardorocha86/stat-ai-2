'use strict';
// =====================================================================
//  Arte dos chefes em alta resolução: partes pré-renderizadas (corpo,
//  cabeça, membros) compostas a cada quadro com animação.
// =====================================================================
(function (G) {
  const C = G.col;
  const { cyl, bevel, inEll, inRR, inPoly, bboxOf } = G.artTools;
  const R5 = c => C.ramp(c, 5);
  const P = (lw, lh) => new G.Paint(Math.round(lw * 2), Math.round(lh * 2));
  const B = G.bossArt = {};

  // textura de rocha sobre uma máscara
  function rock(p, mask, ramp, bbox, o = {}) {
    p.litMask(mask, { ramp, radius: o.radius || 8, ambient: 0.3, contrast: 1.1, dither: 0.5 }, bbox);
    for (let y = bbox[1]; y <= bbox[3]; y++) for (let x = bbox[0]; x <= bbox[2]; x++) {
      if (!mask(x, y)) continue;
      if (Math.abs(G.fastNoise(x * 0.18 + (o.seed || 0), y * 0.18) - 0.5) < 0.025) p.px(x, y, ramp[0]);
      if (o.moss && y < bbox[1] + (bbox[3] - bbox[1]) * 0.35 && G.fastNoise(x * 0.2 + 5, y * 0.2) > 0.6) p.px(x, y, G.hsh(x, y) > 0.5 ? '#5a9a3a' : '#3a7a2a');
    }
  }

  function golem() {
    const S = ['#2a3428', '#4a5a48', '#6e7e6a', '#94a48e', '#bccab4'];
    { const p = P(34, 28); rock(p, inEll(34, 30, 32, 26), S, [0, 0, 67, 55], { moss: true, radius: 12 }); p.ell(34, 32, 9, 9, '#1a2018'); p.ell(34, 32, 7, 7, '#0a0e0a'); p.outline({ k: -0.8 }); B.golemTorso = p.toCanvas(); }
    { const p = P(18, 14); rock(p, inRR(2, 2, 32, 24, 8), S, [0, 0, 35, 27], { moss: true, seed: 3 }); for (let x = 6; x < 30; x++) p.px(x, 10, S[0]); p.outline({ k: -0.8 }); B.golemHead = p.toCanvas(); }
    { const p = P(15, 24); rock(p, inRR(4, 0, 20, 30, 7), S, [0, 0, 29, 31], { seed: 7 }); rock(p, inEll(15, 36, 13, 11), S, [0, 24, 29, 47], { seed: 9 }); p.outline({ k: -0.8 }); B.golemArmBig = p.toCanvas(); }
    { const p = P(10, 16); rock(p, inRR(3, 0, 14, 20, 5), S, [0, 0, 19, 21], { seed: 11 }); rock(p, inEll(10, 25, 8, 7), S, [0, 17, 19, 31], { seed: 12 }); p.outline({ k: -0.8 }); B.golemArmSmall = p.toCanvas(); }
    { const p = P(10, 11); rock(p, inRR(2, 0, 16, 22, 5), S, [0, 0, 19, 21], { seed: 14 }); p.outline({ k: -0.8 }); B.golemLeg = p.toCanvas(); }
  }
  function spider() {
    const Bd = R5('#5a2a7a');
    { const p = P(32, 24); p.ell(32, 24, 30, 22, { ramp: Bd, ambient: 0.3, contrast: 1.2, dither: 0.5 });
      for (let y = 6; y < 44; y++) for (let x = 30; x < 34; x++) if (p.alphaAt(x, y)) p.px(x, y, x < 32 ? '#ffe27a' : '#e0b030');
      for (const [x, y] of [[18, 16], [46, 16], [16, 30], [48, 30]]) p.ell(x, y, 4, 3, '#2a0a3a');
      p.outline({ k: -0.85 }); B.spiderAbdomen = p.toCanvas(); }
    { const p = P(20, 15); p.ell(20, 15, 18, 13, { ramp: R5('#7a3aa0'), ambient: 0.35, contrast: 1.2 }); p.ell(14, 24, 3, 4, '#e8e0f0'); p.ell(26, 24, 3, 4, '#e8e0f0'); p.outline({ k: -0.85 }); B.spiderHead = p.toCanvas(); }
  }
  function scorpion() {
    const R = ['#4a1e08', '#8a4418', '#d07a2e', '#f0a858', '#ffd8a0'];
    // carapaça segmentada (vista de cima, cabeça à direita)
    { const p = P(30, 18);
      const m = (x, y) => { const dx = (x + 0.5 - 30) / 28, dy = (y + 0.5 - 18) / (14 - Math.abs(x - 30) * 0.08); return dx * dx + dy * dy <= 1; };
      p.litMask(m, { ramp: R, radius: 9, ambient: 0.35, contrast: 1.15 }, [0, 0, 59, 35]);
      for (const sx of [14, 23, 32, 41]) for (let y = 0; y < 36; y++) if (p.alphaAt(sx, y)) { p.px(sx, y, R[0]); p.px(sx + 1, y, R[3]); }
      for (let x = 6; x < 54; x++) if (p.alphaAt(x, 10)) p.px(x, 10, R[4]);
      p.outline({ k: -0.85 }); B.scBody = p.toCanvas(); }
    // pinça (aberta e fechada), apontando para a direita
    for (const open of [0, 1]) {
      const p = P(18, 12);
      p.ell(12, 12, 11, 8, { ramp: R, ambient: 0.35, contrast: 1.15 });
      const g = open ? 5 : 1.5;
      p.poly([[18, 10 - g], [36, 4 - g * 0.6], [30, 11 - g * 0.3]], R[3]);
      p.poly([[18, 14 + g], [36, 20 + g * 0.6], [30, 13 + g * 0.3]], R[2]);
      p.outline({ k: -0.85 }); B['scClaw' + open] = p.toCanvas();
    }
    { const p = P(9, 9); p.ell(9, 9, 8, 8, { ramp: R, ambient: 0.35, contrast: 1.15 }); p.ell(6, 6, 2, 1.5, R[4]); p.outline({ k: -0.85 }); B.scTail = p.toCanvas(); }
    { const p = P(10, 10); p.poly([[2, 6], [12, 2], [19, 10], [12, 18], [2, 14]], (x, y) => (y < 10 ? '#fff0a0' : '#e0a020')); p.poly([[14, 6], [20, 10], [14, 14]], '#ffffff'); p.outline({ color: '#5a2a08' }); B.scSting = p.toCanvas(); }
  }
  function dragon() {
    const R = R5('#c83a2a'), H = ['#5a1a10', '#8a2a1a', '#c83a2a', '#ff6a4a', '#ffa080'];
    for (const open of [0, 1]) {
      const p = P(48, 36);
      // chifres
      p.poly([[22, 26], [30, 24], [10, 0]], '#f0e0b0'); p.poly([[74, 26], [66, 24], [86, 0]], '#e0d0a0');
      p.ell(48, 34, 30, 22, { ramp: H, ambient: 0.35, contrast: 1.15, dither: 0.4 });
      // focinho
      p.ell(48, 50 + open * 2, 20, 12 + open * 2, { ramp: H, ambient: 0.4 });
      if (open) { p.ell(48, 56, 14, 8, '#3a0606'); for (let i = 0; i < 6; i++) { p.poly([[37 + i * 4.4, 50], [40 + i * 4.4, 50], [38.5 + i * 4.4, 55]], '#ffffff'); } }
      p.ell(42, 48, 1.5, 1.5, '#2a0606'); p.ell(54, 48, 1.5, 1.5, '#2a0606');
      // escamas no topo
      for (let i = 0; i < 5; i++) p.poly([[38 + i * 5, 14], [43 + i * 5, 14], [40.5 + i * 5, 8]], '#ffd84a');
      p.outline({ k: -0.85 });
      B['dragonHead' + open] = p.toCanvas();
    }
    { const p = P(20, 12); p.ell(20, 12, 18, 10, { ramp: R, ambient: 0.35 }); for (let x = 8; x < 33; x += 6) p.poly([[x, 3], [x + 4, 3], [x + 2, -1]], '#ffd84a'); p.outline({ k: -0.85 }); B.dragonNeck = p.toCanvas(); }
  }
  function yeti() {
    const F = ['#6a7a98', '#a8b8d4', '#dce6f4', '#f4f8ff', '#ffffff'];
    const shag = (cx, cy, rx, ry, seed) => (x, y) => { const ang = Math.atan2(y + 0.5 - cy, x + 0.5 - cx); const j = 1 + 0.09 * Math.sin(ang * 13 + seed) + 0.05 * Math.sin(ang * 7 + seed * 2); const dx = (x + 0.5 - cx) / (rx * j), dy = (y + 0.5 - cy) / (ry * j); return dx * dx + dy * dy <= 1; };
    { const p = P(40, 38);
      p.litMask(shag(40, 40, 36, 34, 1), { ramp: F, radius: 14, ambient: 0.45, dither: 0.6 }, [0, 0, 79, 75]);
      for (let i = 0; i < 90; i++) { const x = 6 + G.hsh(i, 1) * 68, y = 8 + G.hsh(i, 2) * 62; if (p.alphaAt(x | 0, y | 0) && p.alphaAt(x | 0, (y + 4) | 0)) p.line(x, y, x + (G.hsh(i, 3) - 0.5) * 2, y + 4, F[1]); }
      // peito com o sino de Gauss
      p.ell(40, 48, 20, 16, (nx, ny) => (ny < -0.5 ? '#b8c8e4' : '#c8d6ee'));
      for (let i = -14; i <= 14; i++) { const h = Math.exp(-(i * i) / 48) * 13; for (let k = 0; k < h; k++) p.px(40 + i, 56 - k, k > h - 1.5 ? '#3a5aa0' : '#6a8acc'); }
      p.outline({ k: -0.75 }); B.yetiBody = p.toCanvas(); }
    { const p = P(26, 22);
      p.litMask(shag(26, 22, 22, 19, 4), { ramp: F, radius: 10, ambient: 0.45, dither: 0.6 }, [0, 0, 51, 43]);
      // chifres
      p.poly([[8, 16], [14, 12], [2, 0]], '#e8d8b0'); p.poly([[44, 16], [38, 12], [50, 0]], '#d8c8a0');
      // rosto azul
      p.ell(26, 27, 14, 11, (nx, ny) => (ny < -0.3 ? '#8aa0c8' : '#6a82b0'));
      p.poly([[14, 33], [38, 33], [36, 38], [16, 38]], '#2a2040');
      for (const x of [17, 34]) p.poly([[x - 1.5, 33], [x + 1.5, 33], [x, 37]], '#ffffff');
      p.outline({ k: -0.75 }); B.yetiHead = p.toCanvas(); }
    { const p = P(14, 24);
      p.litMask(shag(14, 20, 11, 19, 7), { ramp: F, radius: 8, ambient: 0.45, dither: 0.6 }, [0, 0, 27, 47]);
      p.ell(14, 39, 9, 7, '#6a82b0'); for (const x of [9, 14, 19]) p.poly([[x - 1.5, 44], [x + 1.5, 44], [x, 48]], '#ffffff');
      p.outline({ k: -0.75 }); B.yetiArm = p.toCanvas(); }
  }
  function vies() {
    for (const big of [0, 1]) {
      const s = big ? 1.3 : 1;
      const p = P(30 * s, 40 * s), W = p.w, Hh = p.h;
      const robe = big ? R5('#4a1a6a') : R5('#3a1a5a');
      const pts = [[W / 2 - 7 * s, 18 * s], [W / 2 + 7 * s, 18 * s], [W / 2 + 22 * s, Hh - 2], [W / 2 - 22 * s, Hh - 2]];
      cyl(p, inPoly(pts), robe, bboxOf(pts), { hi: 0.25, sh: 0.62 });
      for (let y = 22 * s; y < Hh - 4; y += 7 * s) for (let x = 0; x < W; x++) if (p.alphaAt(x, y | 0) && ((x + y) % 6 < 2)) p.px(x, y, '#ff3a6a');
      // capuz
      p.ell(W / 2, 16 * s, 13 * s, 14 * s, { ramp: robe, ambient: 0.3 });
      // máscara: metade sorri, metade chora
      p.ell(W / 2, 18 * s, 8.5 * s, 9 * s, (nx) => (nx < 0 ? '#f0e8f8' : '#b8a8d0'));
      p.outline({ k: -0.85 });
      const mx = W / 2;
      p.ell(mx - 4 * s, 16 * s, 1.6 * s, 1.6 * s, '#ff2a3a'); p.ell(mx + 4 * s, 17 * s, 1.6 * s, 1.6 * s, '#ff2a3a');
      for (let i = -3; i <= 0; i++) p.px(mx + i * s - 1, 22 * s - (i === -3 || i === 0 ? 1 : 0), '#1b1428');
      for (let i = 1; i <= 4; i++) p.px(mx + i * s, 23 * s + (i === 1 || i === 4 ? 0 : 1), '#1b1428');
      p.px(mx + 5 * s, 20 * s, '#7ae4ff');
      B['vies' + big] = p.toCanvas();
    }
    // cajado com dado viciado
    { const p = P(10, 44); for (let y = 10; y < 88; y++) for (let x = 9; x < 12; x++) p.px(x, y, x === 9 ? '#a87a4a' : '#6a4a2a'); cyl(p, inRR(2, 0, 16, 16, 3), ['#a08a20', '#d8b830', '#ffd84a', '#fff0a0', '#ffffff'], [1, 0, 19, 17]); p.ell(7, 6, 1.6, 1.6, '#c02a3a'); p.ell(13, 11, 1.6, 1.6, '#c02a3a'); p.outline({ k: -0.8 }); B.viesStaff = p.toCanvas(); }
  }
  G.buildBossArt = function () { golem(); spider(); scorpion(); dragon(); yeti(); vies(); };
})(window.G);
