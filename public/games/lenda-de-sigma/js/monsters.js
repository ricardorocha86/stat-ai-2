'use strict';
// =====================================================================
//  Monstros em alta resolução (pixels de arte = 1/2 pixel lógico).
//  Cada função gera quadros de animação em G.spr.
// =====================================================================
(function (G) {
  const SPR = G.spr, C = G.col;
  const { cyl, bevel, inEll, inRR, inPoly, bboxOf } = G.artTools;
  const R5 = c => C.ramp(c, 5);
  const P = (lw, lh) => new G.Paint(lw * 2, lh * 2);

  // olho "fofo": oval escuro com brilho
  function eye(p, x, y, w = 3, h = 5, col = '#1a1028', glint = true) {
    p.ell(x, y, w / 2, h / 2, col);
    if (glint) { p.px(x - w / 2 + 0.6, y - h / 2 + 1, '#ffffff'); if (w >= 3) p.px(x - w / 2 + 1.6, y - h / 2 + 1, '#ffffff'); }
  }

  // ------------------------------------------------------------------
  //  GOSMA (slime) — 4 quadros: normal, achatada, esticada, balanço
  // ------------------------------------------------------------------
  function slime(name, base) {
    const R = R5(base);
    const shapes = [[13, 12, 0], [15.5, 9.5, 0], [11, 14.5, 0], [13.5, 11.5, 1]];
    shapes.forEach(([rx, ry, wob], f) => {
      const p = P(20, 16);
      const cx = 20, by = 31, cy = by - ry * 0.55;
      const halfW = y => {
        if (y < cy) { const t = (y - cy) / (ry * 1.1); return t < -1 ? -1 : rx * Math.sqrt(1 - t * t); }
        const t = (y - cy) / (by - cy + 0.5); return rx * (1.02 - 0.28 * t * t * t);
      };
      for (let y = 0; y < 32; y++) for (let x = 0; x < 40; x++) {
        const yy = y + 0.5, hw = halfW(yy);
        if (hw <= 0 || y > by) continue;
        const ox = wob ? Math.sin(y * 0.45) * 0.7 : 0;
        const dx = x + 0.5 - cx - ox;
        if (Math.abs(dx) > hw) continue;
        const nx = dx / rx, ny = Math.max(-1, Math.min(1, (yy - cy) / (ry * 1.1)));
        let c = p.lit({ ramp: R, ambient: 0.35, contrast: 1.1 }, nx, ny * 0.9, Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny * 0.6)), x, y);
        // núcleo translúcido (luz atravessando)
        const ix = dx / (rx * 0.55), iy = (yy - (by - ry * 0.35)) / (ry * 0.35);
        if (ix * ix + iy * iy < 1 && nx > -0.4) c = R[3];
        if (y >= by - 1) c = R[0];
        else if (y >= by - 3 && Math.abs(nx) > 0.5) c = R[1];
        p.px(x, y, c);
      }
      // brilho especular
      p.ell(cx - rx * 0.45, by - ry * 1.15, rx * 0.2, ry * 0.14, '#ffffff');
      p.px(cx - rx * 0.15, by - ry * 1.38, '#ffffff');
      p.outline({ k: -0.75 });
      const ey = by - ry * 0.75, sep = rx * 0.36;
      eye(p, cx - sep, ey, 3, f === 1 ? 3 : 5); eye(p, cx + sep, ey, 3, f === 1 ? 3 : 5);
      p.px(cx - 1, ey + 4, C.shade(base, -0.7)); p.px(cx, ey + 4, C.shade(base, -0.7));
      SPR[name + f] = p.toCanvas();
    });
  }

  // ------------------------------------------------------------------
  //  COGUMAU
  // ------------------------------------------------------------------
  function cogumau() {
    const cap = R5('#c0482a'), stem = R5('#f0d8b0'), foot = R5('#4a2a18');
    const make = (f, flat) => {
      const p = P(18, 18);
      const cx = 18;
      if (flat) {
        p.ell(cx, 31, 15, 4, { ramp: cap, ambient: 0.4 });
        p.ell(cx, 34, 12, 2, stem[2]);
        p.outline({ k: -0.75 });
        eye(p, cx - 5, 31, 3, 2); eye(p, cx + 5, 31, 3, 2);
        return p.toCanvas();
      }
      const step = [0, 1, 0, -1][f];
      // pés
      p.ell(cx - 6 - step * 1.5, 33, 5, 2.6, { ramp: foot, ambient: 0.4 });
      p.ell(cx + 6 + step * 1.5, 33 - (f === 1 || f === 3 ? 1 : 0), 5, 2.6, { ramp: foot, ambient: 0.4 });
      // caule/rosto
      cyl(p, inRR(cx - 8, 18, 16, 14, 4), stem, [cx - 9, 17, cx + 9, 33]);
      // chapéu
      p.mask((x, y) => { const dx = (x + 0.5 - cx) / 17, dy = (y + 0.5 - 18) / 15; return dy <= 0.25 && dx * dx + dy * dy <= 1; }, (x, y) => {
        const nx = (x + 0.5 - cx) / 17, ny = (y + 0.5 - 18) / 15;
        return p.lit({ ramp: cap, ambient: 0.3, contrast: 1.1 }, nx, ny, Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)), x, y);
      }, [0, 0, 36, 24]);
      for (let x = cx - 16; x <= cx + 16; x++) { const y = 21; if (p.alphaAt(x, y)) p.px(x, y, cap[1]); }
      // pintas
      for (const [sx, sy, r] of [[cx - 8, 9, 3], [cx + 7, 7, 2.5], [cx, 3.5, 2], [cx + 12, 15, 1.8], [cx - 13, 15, 1.6]]) p.ell(sx, sy, r, r * 0.85, (nx) => (nx < 0 ? '#ffffff' : '#e8dcd0'));
      p.outline({ k: -0.75 });
      // rosto bravo
      const ey = 24;
      p.rect(cx - 6, ey - 2, 4, 1, '#2a1410'); p.rect(cx + 2, ey - 2, 4, 1, '#2a1410');
      p.px(cx - 6, ey - 3, '#2a1410'); p.px(cx + 5, ey - 3, '#2a1410');
      eye(p, cx - 4, ey + 1.5, 2.6, 4); eye(p, cx + 4, ey + 1.5, 2.6, 4);
      p.rect(cx - 3, ey + 5, 6, 1, '#4a1a10'); p.px(cx - 3, ey + 4, '#ffffff'); p.px(cx + 2, ey + 4, '#ffffff');
      return p.toCanvas();
    };
    for (let f = 0; f < 4; f++) SPR['cogumau' + f] = make(f);
    SPR.cogumau_flat = make(0, true);
  }

  // ------------------------------------------------------------------
  //  CUSPIDOR (polvo terrestre) — 4 direções × 2 quadros
  // ------------------------------------------------------------------
  function cuspidor() {
    const body = R5('#e0503e'), belly = R5('#ffb090'), dk = '#3a0a10';
    const dirs = [[0, 1], [0, -1], [-1, 0], [1, 0]];
    dirs.forEach(([dx, dy], d) => {
      for (let f = 0; f < 2; f++) {
        const p = P(18, 18);
        const cx = 18, cy = 17 + (f ? 1 : 0);
        // tentáculos
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * Math.PI + Math.PI * 0.12, lx = cx + Math.cos(a + Math.PI / 2 - Math.PI / 2) * 0, s = i < 2 ? -1 : 1;
          const tx = cx + (i - 1.5) * 6, ty = 30 + ((i + f) % 2) * 2;
          p.ell(tx, ty, 2.6, 3.4, { ramp: body, ambient: 0.4 });
        }
        // corpo
        p.ell(cx, cy, 12, 11, { ramp: body, ambient: 0.35, contrast: 1.1 });
        // focinho (tubo) na direção
        if (dy >= 0 || dx) {
          const sx = cx + dx * 11, sy = cy + 2 + dy * 8 + (dx ? 2 : 0);
          p.ell(sx, sy, dx ? 5 : 4.5, dx ? 4 : 4.5, { ramp: belly, ambient: 0.4 });
          p.ell(sx + dx * 1.5, sy + (dy > 0 ? 1.2 : 0), 2, 2, dk);
        }
        p.ell(cx - 4, cy - 5, 3, 2, body[4]);
        p.outline({ k: -0.78 });
        // olhos olhando para a direção
        if (dy >= 0) {
          for (const s of [-1, 1]) {
            if (dx && s === -dx) continue;
            const ex = cx + s * 5 + dx * 3, ey = cy - 2;
            p.ell(ex, ey, 3, 3.5, '#ffffff');
            p.ell(ex + dx * 1.2, ey + dy * 1.2 + 0.5, 1.6, 2, '#1a1028');
          }
        } else { // de costas: manchas
          p.ell(cx - 4, cy - 2, 2, 2, body[1]); p.ell(cx + 4, cy - 1, 2.2, 2.2, body[1]); p.ell(cx, cy + 3, 1.6, 1.6, body[1]);
          const sx = cx, sy = cy - 9; p.ell(sx, sy, 4, 3, { ramp: belly, ambient: 0.4 }); p.ell(sx, sy - 1, 1.6, 1.4, dk);
        }
        SPR['cuspidor_' + d + f] = p.toCanvas();
      }
    });
    SPR.cuspidor = SPR.cuspidor_00;
  }

  // ------------------------------------------------------------------
  //  MORCEGO — 4 quadros de batida de asa
  // ------------------------------------------------------------------
  function morcego() {
    const R = R5('#5a3a8a'), W = R5('#3a2460'), M = '#ff6a8a';
    const wingY = [-7, -1, 4, -1];
    for (let f = 0; f < 4; f++) {
      const p = P(22, 16);
      const cx = 22, cy = 16;
      const wy = wingY[f];
      for (const s of [-1, 1]) {
        const pts = [[cx + s * 4, cy - 2], [cx + s * 10, cy - 4 + wy * 0.6], [cx + s * 19, cy - 2 + wy], [cx + s * 17, cy + 4 + wy * 0.6], [cx + s * 13, cy + 2 + wy * 0.3], [cx + s * 10, cy + 6 + wy * 0.3], [cx + s * 6, cy + 4]];
        p.mask(inPoly(pts), (x, y) => { const u = Math.abs(x + 0.5 - cx) / 19; return y < cy - 1 + wy * 0.5 ? W[3] : u > 0.7 ? W[1] : W[2]; }, bboxOf(pts));
        // nervuras
        p.line(cx + s * 5, cy - 1, cx + s * 17, cy - 1 + wy, W[0]);
        p.line(cx + s * 9, cy - 2 + wy * 0.4, cx + s * 11, cy + 5 + wy * 0.3, W[0]);
      }
      p.ell(cx, cy, 6.5, 6, { ramp: R, ambient: 0.35 });
      // orelhas
      p.poly([[cx - 5, cy - 3], [cx - 2, cy - 4], [cx - 5, cy - 10]], R[3]);
      p.poly([[cx + 5, cy - 3], [cx + 2, cy - 4], [cx + 5, cy - 10]], R[2]);
      p.outline({ k: -0.75 });
      p.ell(cx - 2.5, cy - 1, 1.4, 1.6, M); p.ell(cx + 2.5, cy - 1, 1.4, 1.6, M);
      p.px(cx - 3, cy - 2, '#ffffff'); p.px(cx + 2, cy - 2, '#ffffff');
      p.px(cx - 2, cy + 3, '#ffffff'); p.px(cx + 1, cy + 3, '#ffffff');
      SPR['morcego' + f] = p.toCanvas();
    }
    // pousado (asas fechadas, de cabeça para baixo não; só encolhido)
    {
      const p = P(22, 16);
      const cx = 22, cy = 17;
      p.ell(cx, cy, 7, 8, { ramp: W, ambient: 0.35 });
      p.ell(cx, cy - 2, 5.5, 5, { ramp: R, ambient: 0.35 });
      p.poly([[cx - 4, cy - 5], [cx - 1, cy - 6], [cx - 4, cy - 12]], R[3]);
      p.poly([[cx + 4, cy - 5], [cx + 1, cy - 6], [cx + 4, cy - 12]], R[2]);
      p.outline({ k: -0.75 });
      p.px(cx - 2, cy - 3, M); p.px(cx + 2, cy - 3, M);
      SPR.morcego_rest = p.toCanvas();
    }
  }

  // ------------------------------------------------------------------
  //  ESCORPIÃO (vista lateral, virado à ESQUERDA)
  // ------------------------------------------------------------------
  function escorpiao() {
    const R = R5('#d8842e'), D = R5('#8a4a1a');
    for (let f = 0; f < 4; f++) {
      const p = P(22, 18);
      const by = 33;
      const leg = [0, 1, 0, -1][f];
      // pernas
      for (let i = 0; i < 4; i++) {
        const x0 = 14 + i * 5, k = ((i + f) % 2 ? 1 : -1) * leg;
        p.line(x0, by - 6, x0 - 2 + k, by - 2, D[1], 1.5); p.line(x0 - 2 + k, by - 2, x0 - 3 + k * 1.5, by, D[0], 1.5);
      }
      // corpo segmentado
      for (let i = 0; i < 4; i++) p.ell(16 + i * 5.5, by - 8 - i * 0.6, 5, 4.2, { ramp: R, ambient: 0.35 });
      // cauda curvada por cima
      let tx = 36, ty = by - 10;
      const segs = 6;
      const sway = Math.sin(f / 4 * Math.PI * 2) * 0.12;
      for (let i = 0; i < segs; i++) {
        const a = -Math.PI / 2 - 0.25 - i * 0.42 + sway;
        tx += Math.cos(a) * 4.2 * -1 * -1; ty += Math.sin(a) * 4.2;
        tx -= i > 2 ? 1.5 : 0;
        p.ell(tx, ty, 3.4 - i * 0.2, 3.2 - i * 0.2, { ramp: R, ambient: 0.35 });
      }
      // ferrão
      p.poly([[tx - 2, ty - 1], [tx + 2, ty - 2], [tx - 4, ty + 5]], '#ffd040');
      // cabeça e garras (à esquerda)
      p.ell(10, by - 8, 5, 4.5, { ramp: R, ambient: 0.35 });
      const cl = f % 2 ? 1 : 0;
      p.ell(4, by - 12 - cl, 4, 3, { ramp: R, ambient: 0.4 }); p.ell(4, by - 5 + cl, 4, 3, { ramp: R, ambient: 0.4 });
      p.poly([[1, by - 13 - cl], [-1, by - 10 - cl], [3, by - 11 - cl]], D[1]);
      p.poly([[1, by - 6 + cl], [-1, by - 3 + cl], [3, by - 4 + cl]], D[1]);
      p.outline({ k: -0.78 });
      p.px(8, by - 10, '#ff3030'); p.px(9, by - 10, '#ff3030'); p.px(8, by - 11, '#ffffff');
      SPR['escorpiao' + f] = p.toCanvas();
    }
  }

  // ------------------------------------------------------------------
  //  LOBO (vista lateral, virado à DIREITA) — galope em 4 quadros
  // ------------------------------------------------------------------
  function lobo() {
    const R = R5('#b8c4d8'), D = R5('#6a7690'), N = '#2a2030';
    const legs = [[6, -6, 4, -4], [2, -2, -2, 2], [-6, 6, -4, 4], [-2, 2, 2, -2]];
    for (let f = 0; f < 4; f++) {
      const p = P(22, 18);
      const by = 33, bob = f === 1 || f === 3 ? -1 : 0;
      const [a, b, c, d] = legs[f];
      const leg = (x, sw, far) => { const rr = far ? D : R; p.line(x, by - 10 + bob, x + sw * 0.6, by - 4, rr[1], 2.5); p.line(x + sw * 0.6, by - 4, x + sw, by - 0.5, rr[0], 2); };
      leg(14, a, true); leg(30, c, true);
      // cauda
      p.ell(8, by - 15 + bob + Math.sin(f) * 1, 6, 3, { ramp: R, ambient: 0.4 });
      // corpo
      p.ell(22, by - 13 + bob, 12, 6.5, { ramp: R, ambient: 0.35, contrast: 1.1 });
      p.ell(22, by - 10 + bob, 9, 3, R[1]);
      leg(17, b, false); leg(33, d, false);
      // cabeça
      p.ell(35, by - 18 + bob, 6, 5.5, { ramp: R, ambient: 0.35 });
      p.ell(40, by - 16 + bob, 4, 2.8, { ramp: R, ambient: 0.4 });
      p.poly([[32, by - 22 + bob], [35, by - 23 + bob], [33, by - 28 + bob]], R[3]);
      p.poly([[35, by - 22 + bob], [38, by - 22 + bob], [37, by - 27 + bob]], R[2]);
      p.outline({ k: -0.78 });
      p.px(43, by - 17 + bob, N); p.px(43, by - 16 + bob, N);
      p.px(37, by - 19 + bob, '#ff3a3a'); p.px(38, by - 19 + bob, '#ff3a3a'); p.px(37, by - 20 + bob, '#ffffff');
      p.px(41, by - 14 + bob, '#ffffff');
      SPR['lobo' + f] = p.toCanvas();
    }
  }

  // ------------------------------------------------------------------
  //  CHAMA (espírito de fogo)
  // ------------------------------------------------------------------
  function chama() {
    const cols = ['#a01a0a', '#e8401a', '#ff8a2a', '#ffd050', '#fff8c0'];
    for (let f = 0; f < 4; f++) {
      const p = P(18, 20);
      const cx = 18, base = 38;
      for (let y = 0; y < 40; y++) for (let x = 0; x < 36; x++) {
        const t = (base - y) / 34;
        if (t < 0 || t > 1.05) continue;
        const sway = Math.sin(t * 4 + f * 1.57) * t * 3;
        const half = 13 * Math.sin(Math.min(1, (1 - t) * 1.3) * Math.PI * 0.62 + 0.25) * (1 - t * 0.6);
        const dx = x + 0.5 - (cx + sway);
        if (Math.abs(dx) > half) continue;
        const u = Math.abs(dx) / Math.max(0.5, half);
        let c = cols[1];
        if (u < 0.78 && t < 0.85) c = cols[2];
        if (u < 0.5 && t < 0.6) c = cols[3];
        if (u < 0.25 && t < 0.35) c = cols[4];
        if (t > 0.8) c = cols[1];
        p.px(x, y, c);
      }
      // linguinhas soltas
      p.ell(cx - 7 + Math.sin(f) * 2, 8 - f % 2 * 2, 1.5, 2.5, cols[2]);
      p.ell(cx + 8, 12 + (f % 2) * 2, 1.2, 2, cols[2]);
      p.outline({ color: '#5a0a08' });
      // rosto
      eye(p, cx - 4, 27, 2.6, 4, '#3a0a08'); eye(p, cx + 4, 27, 2.6, 4, '#3a0a08');
      p.rect(cx - 2, 32, 4, 1, '#3a0a08');
      SPR['chama' + f] = p.toCanvas();
    }
  }

  // ------------------------------------------------------------------
  //  FANTASMA
  // ------------------------------------------------------------------
  function fantasma() {
    const R = ['#4a3a7a', '#8a80c0', '#c8c0f0', '#ece8ff', '#ffffff'];
    for (let f = 0; f < 4; f++) {
      const p = P(18, 20);
      const cx = 18, top = 4, hy = 15;
      const m = (x, y) => {
        const dx = (x + 0.5 - cx) / 12;
        if (y < hy) { const dy = (y + 0.5 - hy) / (hy - top); return dx * dx + dy * dy <= 1; }
        const wave = Math.sin((x + 0.5) * 0.7 + f * 1.57) * 2;
        return Math.abs(dx) <= 1 - (y - hy) * 0.012 && y < 34 + wave;
      };
      for (let y = 0; y < 40; y++) for (let x = 0; x < 36; x++) {
        if (!m(x, y)) continue;
        const nx = (x + 0.5 - cx) / 12, ny = Math.max(-1, Math.min(1, (y + 0.5 - hy) / 14));
        let c = p.lit({ ramp: R, ambient: 0.45 }, nx, ny, Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny * 0.5)), x, y);
        if (y > 28) c = R[1];
        p.px(x, y, c);
      }
      // bracinhos
      p.ell(cx - 12, 22 + (f % 2), 3, 2.2, R[2]); p.ell(cx + 12, 22 + ((f + 1) % 2), 3, 2.2, R[1]);
      p.outline({ color: '#2a1a4a' });
      p.ell(cx - 5, 14, 2.5, 3.5, '#1a0a2a'); p.ell(cx + 5, 14, 2.5, 3.5, '#1a0a2a');
      p.px(cx - 6, 12, '#a8a0ff'); p.px(cx + 4, 12, '#a8a0ff');
      p.ell(cx, 21, 2, 2.5 + (f % 2) * 0.5, '#1a0a2a');
      SPR['fantasma' + f] = p.toCanvas();
    }
  }

  // ------------------------------------------------------------------
  //  ARANHA (vista de cima)
  // ------------------------------------------------------------------
  function aranha() {
    const R = R5('#6a3a8a'), L = '#1e1028';
    for (let f = 0; f < 4; f++) {
      const p = P(20, 18);
      const cx = 20, cy = 19;
      for (let i = 0; i < 4; i++) for (const s of [-1, 1]) {
        const k = ((i + (s > 0 ? 1 : 0) + f) % 2 ? 1.5 : -1.5);
        const ax = cx + s * 5, ay = cy - 5 + i * 3.3;
        const kx = cx + s * (12 + i * 0.5), ky = ay - 5 + i * 1.5 + k;
        const fx = cx + s * (17 - Math.abs(i - 1.5)), fy = ay + 4 + i * 1.4 + k;
        p.line(ax, ay, kx, ky, L, 2); p.line(kx, ky, fx, fy, L, 1.5);
      }
      p.ell(cx, cy + 4, 9, 8, { ramp: R, ambient: 0.35, contrast: 1.15 });
      p.ell(cx, cy - 6, 6, 5, { ramp: R, ambient: 0.4 });
      // marca no abdômen
      p.poly([[cx, cy], [cx + 3, cy + 4], [cx, cy + 8], [cx - 3, cy + 4]], '#ffd23a');
      p.outline({ k: -0.8 });
      p.px(cx - 3, cy - 7, '#ff3030'); p.px(cx - 1, cy - 8, '#ff3030'); p.px(cx + 1, cy - 8, '#ff3030'); p.px(cx + 3, cy - 7, '#ff3030');
      p.px(cx - 1, cy - 2, '#e8e0f0'); p.px(cx + 1, cy - 2, '#e8e0f0');
      SPR['aranha' + f] = p.toCanvas();
    }
  }

  // ------------------------------------------------------------------
  //  OVELHA e PEIXE
  // ------------------------------------------------------------------
  function ovelha() {
    const Wl = ['#a8a090', '#d0c8b8', '#ece6da', '#f8f4ec', '#ffffff'], F = R5('#3a3040');
    for (let f = 0; f < 2; f++) {
      const p = P(18, 16);
      const by = 30;
      for (const [lx, ph] of [[10, 0], [15, 1], [22, 1], [27, 0]]) { const k = (f + ph) % 2 ? 1 : 0; p.rect(lx, by - 7, 2.5, 7 - k, F[1]); }
      for (const [x, y, r] of [[12, 15, 6], [19, 12, 7], [26, 15, 6], [15, 19, 6], [23, 19, 6], [19, 17, 7]]) p.ell(x, y, r, r * 0.9, { ramp: Wl, ambient: 0.45, dither: 0.5 });
      p.ell(31, 15, 4.5, 4, { ramp: F, ambient: 0.4 });
      p.ell(29, 11, 2, 1.5, F[2]);
      p.outline({ k: -0.6 });
      p.px(32, 14, '#ffffff'); p.px(33, 14, '#1a1028');
      SPR['ovelha' + f] = p.toCanvas();
    }
  }
  function peixe() {
    const make = (base) => {
      const R = R5(base);
      const p = P(16, 10);
      p.ell(14, 10, 10, 6, { ramp: R, ambient: 0.4 });
      p.poly([[4, 10], [-1, 5], [-1, 15]], R[1]);
      p.poly([[12, 5], [18, 1], [20, 5]], R[2]);
      p.outline({ k: -0.75 });
      p.ell(20, 9, 1.5, 1.5, '#1a1028'); p.px(19, 8, '#ffffff');
      for (let x = 9; x < 18; x += 3) p.px(x, 11, R[3]);
      return p.toCanvas();
    };
    SPR.peixe = make('#6aa8e0');
    SPR.peixe_ouro = make('#ffc030');
  }

  G.buildMonsters = function () {
    slime('gosma', '#5ad04a');
    slime('gosma_ice', '#8ad0f4');
    slime('gosma_sand', '#e0b850');
    slime('gosma_swamp', '#a060d8');
    slime('gosma_lava', '#ff6a2a');
    slime('gosma_dark', '#6a4ab8');
    cogumau(); cuspidor(); morcego(); escorpiao(); lobo(); chama(); fantasma(); aranha(); ovelha(); peixe();
  };
})(window.G);
