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

  // ------------------------------------------------------------------
  //  GOLEM DESEQUILIBRADO: peças articuladas (pivôs em bosses.js)
  //  Cada peça tem uma camada de brilho (runas e rachaduras) que acende
  //  com a cor do núcleo.
  // ------------------------------------------------------------------
  const DIG = { 0: ['.#.', '#.#', '#.#', '#.#', '.#.'], 1: ['.#.', '##.', '.#.', '.#.', '###'], 2: ['##.', '..#', '.#.', '#..', '###'] };
  function golem() {
    const S = ['#232c22', '#435241', '#677862', '#8e9f87', '#b8c8ae'];
    const MOSS = ['#2f6a26', '#4e8f34', '#7ab84a'];
    const glowOf = p => new G.Paint(p.w, p.h);
    // número entalhado (fundo escuro, borda clara embaixo à direita) e o mesmo número na camada de brilho
    const engrave = (p, gl, str, x0, y0) => {
      let x = x0;
      for (const ch of str) {
        const rows = DIG[ch];
        for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) if (rows[r][c] === '#') for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) { p.px(x + c * 2 + a, y0 + r * 2 + b, S[0]); gl.px(x + c * 2 + a, y0 + r * 2 + b, '#ffffff'); }
        for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) if (rows[r][c] === '#') { const on = (rr, cc) => rows[rr] && rows[rr][cc] === '#'; if (!on(r + 1, c)) for (let a = 0; a < 2; a++) p.px(x + c * 2 + a, y0 + r * 2 + 2, S[4]); if (!on(r, c + 1)) for (let b = 0; b < 2; b++) p.px(x + c * 2 + 2, y0 + r * 2 + b, S[3]); }
        x += 8;
      }
    };
    // junta de alvenaria: sulco escuro com aresta clara embaixo
    const seam = (p, mask, x0, y0, x1, y1, skip) => {
      const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
      for (let i = 0; i <= n; i++) {
        const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n);
        if (!mask(x, y) || (skip && skip(x, y))) continue;
        p.px(x, y, S[0]); if (mask(x, y + 1) && y1 === y0) p.px(x, y + 1, S[3]); if (mask(x + 1, y) && x1 === x0) p.px(x + 1, y, S[3]);
      }
    };
    // rachadura em zigue-zague (também na camada de brilho)
    const crack = (p, gl, mask, x, y, dx, dy, n, seed) => {
      for (let i = 0; i < n; i++) {
        if (!mask(Math.round(x), Math.round(y))) break;
        p.px(Math.round(x), Math.round(y), S[0]); gl.px(Math.round(x), Math.round(y), '#ffffff');
        const j = G.hash2(i, seed, 41) - 0.5;
        x += dx + j * 1.6; y += dy - j * 1.2;
      }
    };
    // musgo: tufos no alto da peça e fios pendurados
    const moss = (p, mask, bbox, top, seed) => {
      const [x0, y0, x1] = bbox;
      for (let y = y0; y < top; y++) for (let x = x0; x <= x1; x++) {
        if (!mask(x, y)) continue;
        const n = G.fastNoise(x * 0.22 + seed, y * 0.22) + (top - y) / (top - y0) * 0.35;
        if (n > 0.78) p.px(x, y, n > 0.95 ? MOSS[2] : G.hsh(x, y) > 0.5 ? MOSS[1] : MOSS[0]);
      }
      for (let i = 0; i < 5; i++) {
        const x = Math.round(x0 + (x1 - x0) * (0.15 + 0.7 * G.hash2(i, seed, 7))), len = 3 + Math.floor(G.hash2(i, seed, 8) * 6);
        let y = top - 2; while (y > y0 && !mask(x, y)) y++;
        for (let k = 0; k < len; k++) if (mask(x, y + k)) p.px(x, y + k, k === len - 1 ? MOSS[0] : MOSS[1]);
      }
    };
    const fin = (p, gl, name) => { p.outline({ k: -0.82 }); B[name] = p.toCanvas(); B[name + 'Glow'] = gl.toCanvas(); };

    // TRONCO (48×40): ombros largos, cintura estreita, soquete do núcleo
    {
      const p = P(48, 40), gl = glowOf(p), cx = 48, top = 6, bot = 78;
      const hw = y => { const v = (y - top) / (bot - top); let w = 46 - 12 * Math.pow(v, 1.3); const r = 18; if (y < top + r) { const d = top + r - y; w = w - r + Math.sqrt(Math.max(0, r * r - d * d)); } if (y > bot - 6) { const d = y - (bot - 6); w -= 6 - Math.sqrt(Math.max(0, 36 - d * d)); } return w; };
      const mask = (x, y) => y >= top && y <= bot && Math.abs(x + 0.5 - cx) <= hw(y + 0.5);
      const bb = [0, 0, 95, 79], co = [48, 40];
      rock(p, mask, S, bb, { radius: 16, seed: 2 });
      const nearCore = (x, y) => Math.hypot(x + 0.5 - co[0], y + 0.5 - co[1]) < 21;
      seam(p, mask, 0, 28, 95, 28, nearCore); seam(p, mask, 0, 56, 95, 56, nearCore);
      seam(p, mask, 26, 6, 26, 28); seam(p, mask, 70, 6, 70, 28); seam(p, mask, 18, 28, 18, 56); seam(p, mask, 78, 28, 78, 56); seam(p, mask, 36, 56, 36, 79); seam(p, mask, 60, 56, 60, 79);
      moss(p, mask, bb, 24, 3);
      // soquete: anel de pedra em relevo com 8 runas
      for (let y = 20; y < 62; y++) for (let x = 26; x < 70; x++) {
        const dx = x + 0.5 - co[0], dy = y + 0.5 - co[1], d = Math.hypot(dx, dy);
        if (d < 13) p.px(x, y, d < 11 ? '#0c120c' : S[0]);
        else if (d < 18.5) { const lt = (-dx * 0.6 - dy * 0.8) / d; p.px(x, y, lt > 0.45 ? S[4] : lt > -0.1 ? S[3] : lt > -0.6 ? S[2] : S[1]); }
      }
      for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + Math.PI / 8; for (let r = 14; r <= 17; r++) { const x = Math.round(co[0] + Math.cos(a) * r - 0.5), y = Math.round(co[1] + Math.sin(a) * r - 0.5); p.px(x, y, S[0]); gl.px(x, y, '#ffffff'); } }
      crack(p, gl, mask, 10, 34, 1.3, 0.6, 16, 1); crack(p, gl, mask, 86, 14, -1.1, 0.9, 14, 2); crack(p, gl, mask, 64, 76, 0.3, -1.4, 12, 3);
      fin(p, gl, 'golemTorso');
    }
    // CABEÇA (24×18): elmo com sobrancelha pesada e fenda dos olhos
    {
      const p = P(24, 18), gl = glowOf(p);
      const helm = inRR(4, 5, 40, 29, 9), brow = inRR(1, 11, 46, 8, 4);
      rock(p, helm, S, [0, 0, 47, 35], { radius: 9, seed: 5 });
      rock(p, brow, S, [0, 8, 47, 21], { radius: 3, seed: 6 });
      moss(p, helm, [0, 4, 47, 35], 11, 9);
      for (let x = 9; x <= 38; x++) for (let y = 20; y <= 24; y++) { const e = Math.min(x - 9, 38 - x); if (e < 2 && (y === 20 || y === 24)) continue; p.px(x, y, '#0a0f0a'); }
      for (let x = 10; x <= 37; x++) p.px(x, 25, S[3]);
      for (const x of [17, 24, 31]) for (let y = 28; y <= 31; y++) { p.px(x, y, S[0]); p.px(x + 1, y, S[3]); }
      crack(p, gl, helm, 38, 8, -0.7, 1.1, 7, 4);
      fin(p, gl, 'golemHead');
    }
    // BACIA (28×11)
    { const p = P(28, 11), gl = glowOf(p), m = inRR(2, 2, 52, 18, 7); rock(p, m, S, [0, 0, 55, 21], { radius: 7, seed: 8 }); seam(p, m, 28, 2, 28, 20); fin(p, gl, 'golemPelvis'); }
    // PERNA (15×17): coxa, joelheira e pé largo
    {
      const p = P(15, 17), gl = glowOf(p);
      rock(p, inRR(7, 0, 16, 22, 6), S, [0, 0, 29, 23], { radius: 6, seed: 11 });
      p.curPart = 2; rock(p, inEll(15, 15, 9, 6.5), S, [4, 7, 26, 23], { radius: 5, seed: 12 });
      p.curPart = 3; const foot = inRR(1, 21, 28, 12, 5); rock(p, foot, S, [0, 19, 29, 33], { radius: 5, seed: 13 }); seam(p, foot, 10, 21, 10, 33); seam(p, foot, 20, 21, 20, 33);
      p.innerLines({ k: -0.5 });
      fin(p, gl, 'golemLeg');
    }
    // BRAÇO GRANDE: ombreira + braço (20×20) e antebraço com o punho "10" (24×30)
    {
      const p = P(20, 20), gl = glowOf(p);
      rock(p, inRR(12, 16, 16, 24, 6), S, [8, 14, 31, 39], { radius: 6, seed: 15 });
      p.curPart = 2; const sh = inEll(20, 13, 18, 12.5); rock(p, sh, S, [0, 0, 39, 27], { radius: 11, seed: 16 }); moss(p, sh, [0, 0, 39, 27], 9, 17);
      crack(p, gl, sh, 30, 4, -0.4, 1.2, 9, 5);
      p.innerLines({ k: -0.5 }); fin(p, gl, 'golemBigUpper');
    }
    {
      const p = P(24, 30), gl = glowOf(p);
      rock(p, inRR(14, 0, 20, 26, 7), S, [12, 0, 35, 27], { radius: 7, seed: 18 });
      p.curPart = 2; const fist = inRR(2, 22, 44, 36, 9); rock(p, fist, S, [0, 20, 47, 59], { radius: 10, seed: 19 });
      for (const x of [13, 24, 35]) seam(p, fist, x, 22, x, 31);
      engrave(p, gl, '10', 17, 38);
      crack(p, gl, fist, 6, 50, 1.2, 0.3, 8, 6);
      p.innerLines({ k: -0.5 }); fin(p, gl, 'golemBigFore');
    }
    // BRAÇO PEQUENO (12×13) e punho "2" (13×17)
    {
      const p = P(12, 13), gl = glowOf(p);
      rock(p, inRR(7, 11, 10, 14, 4), S, [5, 9, 19, 25], { radius: 4, seed: 21 });
      p.curPart = 2; const sh = inEll(12, 8, 11, 8); rock(p, sh, S, [0, 0, 23, 17], { radius: 7, seed: 22 }); moss(p, sh, [0, 0, 23, 17], 6, 23);
      p.innerLines({ k: -0.5 }); fin(p, gl, 'golemSmallUpper');
    }
    {
      const p = P(13, 17), gl = glowOf(p);
      rock(p, inRR(8, 0, 10, 16, 4), S, [6, 0, 19, 17], { radius: 4, seed: 24 });
      p.curPart = 2; const fist = inRR(2, 13, 22, 20, 6); rock(p, fist, S, [0, 11, 25, 33], { radius: 6, seed: 25 });
      engrave(p, gl, '2', 10, 18);
      p.innerLines({ k: -0.5 }); fin(p, gl, 'golemSmallFore');
    }
  }
  // ------------------------------------------------------------------
  //  Peças genéricas: segmento de membro (aponta para +x a partir do pivô,
  //  em (2, h/2) lógicos) e a versão espelhada na vertical, para manter a
  //  luz por cima quando o membro aponta para a esquerda.
  // ------------------------------------------------------------------
  function limbSeg(name, len, w0, w1, ramp, o = {}) {
    const W = Math.round(len + 4), Hh = Math.ceil(Math.max(w0, w1) + 4), p = P(W, Hh), gl = new G.Paint(p.w, p.h), cy = Hh;
    const half = x => { const u = G.clamp((x - 4) / (len * 2), 0, 1); return (w0 + (w1 - w0) * u) * (o.tip && u > 0.8 ? 1 - (u - 0.8) / 0.2 * 0.85 : 1); };
    const mask = (x, y) => x >= 3 && x <= len * 2 + 4 && Math.abs(y + 0.5 - cy) <= half(x);
    cyl90(p, mask, ramp, [0, 0, p.w - 1, p.h - 1]);
    if (o.joint) p.ell(5, cy, w0 + 1, w0 + 1, { ramp, ambient: 0.35, contrast: 1.2 });
    if (o.knob) p.ell(len * 2 + 2, cy, w1 + 0.8, w1 + 0.8, { ramp, ambient: 0.35, contrast: 1.2 });
    if (o.band) for (let x = Math.round(len * 2 * o.band.at); x < Math.round(len * 2 * o.band.at) + 3; x++) for (let y = 0; y < p.h; y++) if (mask(x, y)) { p.px(x, y, y < cy ? o.band.c[1] : o.band.c[0]); if (o.band.glow) gl.px(x, y, '#ffffff'); }
    if (o.hair) for (let x = 8; x < len * 2; x += 5) { const h = half(x), y = Math.round(cy - h - 1); p.px(x, y, ramp[0]); p.px(x + 1, y - 1, ramp[0]); }
    p.outline({ k: -0.85 });
    const fl = P(W, Hh); for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) { const v = p.d[y * p.w + x]; if (v >>> 24) fl.px(x, p.h - 1 - y, v); }
    B[name] = p.toCanvas(); B[name + 'F'] = fl.toCanvas(); B[name].piv = [2, Hh / 2]; B[name + 'F'].piv = [2, Hh / 2];
    if (o.band && o.band.glow) B[name + 'Glow'] = gl.toCanvas();
  }
  // sombreamento de cilindro deitado (luz por cima)
  function cyl90(p, mask, ramp, bbox) {
    const [x0, y0, x1, y1] = bbox;
    for (let x = x0; x <= x1; x++) {
      let yt = -1, yb = -1; for (let y = y0; y <= y1; y++) if (mask(x, y)) { if (yt < 0) yt = y; yb = y; }
      if (yt < 0) continue; const span = Math.max(1, yb - yt);
      for (let y = yt; y <= yb; y++) { const u = (y - yt) / span; p.px(x, y, ramp[u < 0.18 ? 4 : u < 0.4 ? 3 : u < 0.72 ? 2 : u < 0.9 ? 1 : 0]); }
    }
  }
  // brilho especular (quitina): mancha clara no alto à esquerda
  function gloss(p, cx, cy, rx, ry, c = '#ffffff') {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy <= 1 && p.alphaAt(x, y)) p.px(x, y, c + (dx * dx + dy * dy < 0.35 ? 'd0' : '70'));
    }
  }
  G.bossArtTools = { limbSeg, cyl90, gloss, rock };

  // ------------------------------------------------------------------
  //  ARANHA MEDIANA: abdome com 7 "dados ordenados" (o do meio é a
  //  mediana, dourado), cefalotórax com 8 olhos, quelíceras e pernas
  //  em dois segmentos (posicionadas por cinemática inversa).
  // ------------------------------------------------------------------
  function spider() {
    const Bd = ['#140a20', '#2e1846', '#4a2a6a', '#6e4494', '#9a6ec0'], gold = ['#8a5a10', '#e0a020', '#ffe27a'];
    // abdome (44×34)
    {
      const p = P(44, 34), gl = new G.Paint(p.w, p.h), cx = 44, cy = 33;
      p.ell(cx, cy, 42, 31, { ramp: Bd, ambient: 0.28, contrast: 1.25, dither: 0.4 });
      // faixa central e chevrons
      p.ell(cx, cy + 1, 10, 27, (nx) => (Math.abs(nx) > 0.7 ? Bd[1] + 'c0' : Bd[0] + 'b0'));
      for (let k = 0; k < 4; k++) { const y = 14 + k * 12; for (let s = -1; s <= 1; s += 2) for (let i = 0; i < 12; i++) { const x = Math.round(cx + s * (13 + i)), yy = Math.round(y + i * 0.55 + Math.abs(i - 6) * 0.15); if (p.alphaAt(x, yy)) p.px(x, yy, Bd[3]); } }
      // 7 valores ordenados: o 4º (mediana) é dourado e brilha
      for (let i = 0; i < 7; i++) {
        const y = 10 + i * 7.6, r = 1.6 + i * 0.45, med = i === 3;
        p.ell(cx, y, r + 0.8, r + 0.8, Bd[0]);
        p.ell(cx, y, r, r, med ? { ramp: gold, ambient: 0.5 } : (nx, ny) => (nx + ny < -0.4 ? '#f0e4ff' : '#b8a4d8'));
        if (med) { gl.ell(cx, y, r + 2.5, r + 2.5, '#ffffff80'); gl.ell(cx, y, r, r, '#ffffff'); }
      }
      // cerdas na borda
      for (let i = 0; i < 46; i++) { const a = i / 46 * Math.PI * 2, x = cx + Math.cos(a) * 42, y = cy + Math.sin(a) * 31; if (Math.sin(a) > 0.75) continue; p.line(x, y, x + Math.cos(a) * 3, y + Math.sin(a) * 3, Bd[0]); }
      gloss(p, cx - 16, cy - 15, 9, 5);
      p.outline({ k: -0.85 }); B.spiderAbdomen = p.toCanvas(); B.spiderAbdomenGlow = gl.toCanvas();
    }
    // cefalotórax com os olhos (28×22)
    {
      const p = P(28, 22), gl = new G.Paint(p.w, p.h), cx = 28;
      p.ell(cx, 21, 26, 19, { ramp: Bd, ambient: 0.3, contrast: 1.2, dither: 0.3 });
      for (let x = 10; x < 46; x++) { const y = Math.round(9 + Math.pow((x - cx) / 18, 2) * 5); if (p.alphaAt(x, y)) p.px(x, y, Bd[1]); }
      const eyes = [[22, 27, 3.6], [34, 27, 3.6], [15.5, 23, 2.3], [40.5, 23, 2.3], [19, 18.5, 1.7], [37, 18.5, 1.7], [25, 15.5, 1.5], [31, 15.5, 1.5]];
      for (const [x, y, r] of eyes) { p.ell(x, y, r + 0.9, r + 0.9, '#0a0410'); p.ell(x, y, r, r, (nx, ny) => (ny < -0.2 ? '#5a0a14' : '#2a040a')); p.px(Math.round(x - r * 0.4), Math.round(y - r * 0.45), '#ffffff'); gl.ell(x, y, r, r, '#ffffff'); }
      gloss(p, cx - 9, 10, 7, 3.5);
      p.outline({ k: -0.85 }); B.spiderHead = p.toCanvas(); B.spiderHeadGlow = gl.toCanvas();
    }
    // quelícera com presa (9×12), pivô no alto
    {
      const p = P(9, 12);
      p.ell(9, 8, 7.5, 7.5, { ramp: Bd, ambient: 0.35, contrast: 1.2 });
      p.poly([[5, 12], [12, 12], [10, 20], [7, 23], [4, 22], [6, 18]], (x, y) => (x < 8 ? '#fff4e0' : '#c8b8a0'));
      p.outline({ k: -0.85 }); B.spiderFang = p.toCanvas();
    }
    limbSeg('spiderFemur', 21, 4.2, 3.2, Bd, { joint: true, knob: true, hair: true, band: { at: 0.82, c: gold } });
    limbSeg('spiderTibia', 25, 3.2, 1.6, Bd, { tip: true, hair: true, band: { at: 0.12, c: gold } });
  }
  // ------------------------------------------------------------------
  //  ESCORPIÃO DESVIO-PADRÃO (de lado, virado para a direita): placas com
  //  σ brilhante, pinças, cauda em 5 gomos com ferrão e pernas por IK.
  // ------------------------------------------------------------------
  const SIGMA = ['.####', '#..#.', '#..#.', '#..#.', '.##..'];
  function scorpion() {
    const R = ['#3a1606', '#7a3810', '#ba6a22', '#e8a048', '#ffd890'];
    // carapaça segmentada (40×18)
    {
      const p = P(40, 18), gl = new G.Paint(p.w, p.h);
      const m = (x, y) => { const dx = (x + 0.5 - 40) / 38, dy = (y + 0.5 - 19) / (15 - Math.abs(x + 0.5 - 44) * 0.07); return dx * dx + dy * dy <= 1; };
      p.litMask(m, { ramp: R, radius: 10, ambient: 0.32, contrast: 1.2, dither: 0.3 }, [0, 0, 79, 35]);
      // placas: aresta escura e borda clara, levemente curvas
      for (const sx of [14, 25, 36, 47, 58]) for (let y = 0; y < 36; y++) { const x = Math.round(sx + Math.pow((y - 19) / 14, 2) * 3); if (m(x, y)) { p.px(x, y, R[0]); if (m(x + 1, y)) p.px(x + 1, y, R[3]); } }
      for (let x = 4; x < 76; x++) for (const y of [9, 10]) if (m(x, y)) p.px(x, y, y === 9 ? R[4] : R[3]); // crista dorsal
      for (let x = 6; x < 74; x += 11) { p.px(x + 4, 7, R[4]); p.px(x + 5, 6, R[4]); } // espinhos
      // σ na placa do meio
      SIGMA.forEach((row, r) => [...row].forEach((c, k) => { if (c === '#') for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) { p.px(37 + k * 2 + a, 13 + r * 2 + b, R[0]); gl.px(37 + k * 2 + a, 13 + r * 2 + b, '#ffffff'); } }));
      gloss(p, 26, 11, 9, 3);
      p.outline({ k: -0.85 }); B.scBody = p.toCanvas(); B.scBodyGlow = gl.toCanvas();
    }
    // cabeça (18×15) com olhos
    {
      const p = P(18, 15), gl = new G.Paint(p.w, p.h);
      const m = (x, y) => { const dx = (x + 0.5 - 14) / 20, dy = (y + 0.5 - 15) / 13; return x >= 2 && dx * dx + dy * dy <= 1; };
      p.litMask(m, { ramp: R, radius: 8, ambient: 0.32, contrast: 1.2 }, [0, 0, 35, 29]);
      for (let y = 4; y < 27; y++) { const x = Math.round(10 + Math.abs(y - 15) * 0.25); if (m(x, y)) { p.px(x, y, R[0]); p.px(x + 1, y, R[3]); } }
      for (const [x, y, r] of [[24, 9, 2.4], [28.5, 10.5, 2], [31, 15, 1.3], [31, 18.5, 1.2]]) { p.ell(x, y, r + 0.8, r + 0.8, '#1a0604'); p.ell(x, y, r, r, '#3a0a08'); p.px(Math.round(x - r * 0.4), Math.round(y - r * 0.4), '#ffffff'); gl.ell(x, y, r, r, '#ffffff'); }
      gloss(p, 16, 7, 6, 3);
      p.outline({ k: -0.85 }); B.scHead = p.toCanvas(); B.scHeadGlow = gl.toCanvas();
    }
    // pinças: aberta (1) e fechada (0), apontando para a direita (17×13), pivô no punho
    for (const open of [0, 1]) {
      const s = 1.35, p = P(23, 18), Q = pts => pts.map(([x, y]) => [x * s, y * s]);
      p.ell(11 * s, 13 * s, 10 * s, 8.5 * s, { ramp: R, ambient: 0.32, contrast: 1.2, dither: 0.3 });
      const g = open ? 5.5 : 1;
      p.curPart = 2; p.poly(Q([[15, 10 - g * 0.3], [26, 4 - g], [33, 6 - g * 0.8], [26, 11 - g * 0.4]]), (x, y) => (y < (7 - g * 0.6) * s ? R[4] : R[3]));
      p.curPart = 3; p.poly(Q([[15, 16 + g * 0.3], [26, 22 + g], [32, 21 + g * 0.8], [24, 15 + g * 0.4]]), (x, y) => (y > 20 * s ? R[1] : R[2]));
      for (let x = 17; x < 30; x += 2.5) p.px(Math.round(x * s), Math.round((10 - g * 0.5 + (x - 17) * -0.3) * s), R[0]); // serrilhado
      for (let i = 0; i < 4; i++) p.px(Math.round((5 + i * 3) * s), Math.round((15 + (i % 2)) * s), R[1]); // textura
      gloss(p, 8 * s, 9 * s, 5 * s, 2.5 * s);
      p.innerLines({ k: -0.5 }); p.outline({ k: -0.85 }); B['scClaw' + open] = p.toCanvas();
    }
    // gomos da cauda (3 tamanhos) e ferrão com ponta de veneno brilhante
    for (const [name, s] of [['scSegL', 10], ['scSegM', 8.5], ['scSegS', 7]]) {
      const p = P(s, s), c = s;
      p.ell(c, c, s - 1, s - 1.6, { ramp: R, ambient: 0.32, contrast: 1.25, dither: 0.3 });
      for (let x = Math.round(c - s + 3); x < c + s - 3; x++) p.px(x, Math.round(c - 1), R[0]);
      p.ell(c - s * 0.35, c - s * 0.4, s * 0.25, s * 0.14, R[4]);
      p.outline({ k: -0.85 }); B[name] = p.toCanvas();
    }
    {
      const p = P(14, 14), gl = new G.Paint(p.w, p.h);
      p.ell(10, 14, 9, 8, { ramp: R, ambient: 0.32, contrast: 1.2 });
      p.curPart = 2; p.poly([[16, 9], [24, 12], [27, 19], [24, 25], [21, 19], [16, 17]], (x, y) => (x < 22 ? '#fff0b0' : '#d8a030'));
      gl.poly([[22, 18], [25, 21], [24, 25], [21, 21]], '#ffffff');
      gloss(p, 7, 10, 4, 2.5);
      p.innerLines({ k: -0.5 }); p.outline({ k: -0.85 }); B.scSting = p.toCanvas(); B.scStingGlow = gl.toCanvas();
    }
    limbSeg('scArmA', 11, 4.4, 3.6, R, { joint: true, knob: true });
    limbSeg('scArmB', 9, 3.6, 3.4, R, { knob: true });
    limbSeg('scLegA', 9, 2.2, 1.7, R, { joint: true, knob: true });
    limbSeg('scLegB', 11, 1.7, 0.8, R, { tip: true });
  }
  // ------------------------------------------------------------------
  //  DRAGÃO DOS DADOS (de frente): cabeça com testa em forma de dado,
  //  chifres de osso com pintas, mandíbula separada, pescoço em gomos
  //  com as faces 1–6 de um dado e asas de membrana.
  // ------------------------------------------------------------------
  const PIPS = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
  function dragon() {
    const H = ['#360a06', '#6a1810', '#ac2c1c', '#e65436', '#ff9a6a'], BL = ['#5a3216', '#965a26', '#d09040', '#f4c070', '#fff0c0'], BN = ['#4a3e30', '#9a8a6e', '#d8ccb0', '#f4ecd8', '#ffffff'];
    const pip = (p, gl, cx, cy, n, sp, r, c) => { for (const [a, b] of PIPS[n]) { p.ell(cx + a * sp, cy + b * sp, r, r, c); if (gl) gl.ell(cx + a * sp, cy + b * sp, r, r, '#ffffff'); } };
    // cabeça (44×34), sem a mandíbula
    {
      const p = P(44, 34), gl = new G.Paint(p.w, p.h);
      // chifres curvos de osso, com pintas de dado
      for (const s of [-1, 1]) {
        const pts = []; for (let i = 0; i <= 12; i++) { const u = i / 12, x = 44 + s * (14 + u * 30), y = 20 - u * 22 + u * u * 6; pts.push([x, y - (1 - u) * 6]); }
        const poly = pts.concat(pts.slice().reverse().map(([x, y], i) => [x, y + 2 + i / 12 * 10])); // afina na ponta
        p.curPart = 1; p.poly(poly, (x, y) => (y < 8 ? BN[4] : y < 16 ? BN[3] : BN[2]));
        for (let i = 2; i < 11; i += 3) { const u = i / 12; p.ell(44 + s * (14 + u * 30), 23 - u * 22 + u * u * 6, 1.3, 1.3, BN[0]); }
      }
      // babados laterais com espinhos
      for (const s of [-1, 1]) { p.curPart = 2; p.poly([[44 + s * 22, 26], [44 + s * 40, 30], [44 + s * 33, 36], [44 + s * 42, 42], [44 + s * 30, 44], [44 + s * 36, 52], [44 + s * 22, 48]], (x, y) => (y < 38 ? H[2] : H[1])); }
      p.curPart = 3; p.ell(44, 33, 29, 22, { ramp: H, ambient: 0.32, contrast: 1.2, dither: 0.35 });
      p.curPart = 4; p.ell(44, 50, 21, 13, { ramp: H, ambient: 0.4, contrast: 1.15 });
      // escamas: arcos pequenos
      for (let y = 16; y < 58; y += 5) for (let x = 18 + (y % 10); x < 72; x += 10) if (p.alphaAt(x, y) && Math.hypot(x - 44, y - 22) > 9) p.px(x, y, H[1]);
      // testa: placa de dado com 5 pintas (brilham ao rolar)
      p.curPart = 5; p.rrect(36, 10, 16, 15, 4, (x, y) => (x + y < 54 ? BN[3] : BN[2])); pip(p, gl, 44, 17.5, 5, 4, 1.4, '#a8201a');
      // sobrancelhas pesadas e olhos
      for (const s of [-1, 1]) {
        p.poly([[44 + s * 6, 27], [44 + s * 22, 24], [44 + s * 26, 29], [44 + s * 10, 31]], H[1]);
        p.ell(44 + s * 15, 34, 5.5, 3.6, '#1a0404'); p.ell(44 + s * 15, 34, 4.2, 2.4, '#5a0a06'); gl.ell(44 + s * 15, 34, 4.2, 2.4, '#ffffff');
        p.ell(44 + s * 6, 54, 1.8, 1.4, '#1a0404'); gl.ell(44 + s * 6, 54, 1.6, 1.2, '#ffffff80'); // narinas
      }
      // dentes de cima
      for (let i = 0; i < 7; i++) p.poly([[30.5 + i * 4, 60], [34 + i * 4, 60], [32.2 + i * 4, 65]], (x, y) => (y < 62 ? '#ffffff' : '#e0d8c8'));
      gloss(p, 34, 22, 8, 4, '#ffd8c0');
      p.innerLines({ k: -0.45 }); p.outline({ k: -0.85 }); B.dragonHead = p.toCanvas(); B.dragonHeadGlow = gl.toCanvas();
    }
    // mandíbula (32×14) com dentes para cima e boca escura
    {
      const p = P(32, 14);
      p.ell(32, 8, 26, 16, (nx, ny) => (ny < -0.15 ? '#2a0404' : ny < 0.4 ? H[2] : H[1]));
      for (let x = 10; x < 54; x++) for (let y = 0; y < 8; y++) if (p.alphaAt(x, y)) p.px(x, y, y < 5 ? '#2a0404' : '#5a0a08');
      for (let i = 0; i < 7; i++) p.poly([[17 + i * 4.6, 9], [20.5 + i * 4.6, 9], [18.7 + i * 4.6, 4]], '#f8f0e0');
      for (let x = 14; x < 50; x += 6) p.px(x, 18, BL[2]);
      p.outline({ k: -0.85 }); B.dragonJaw = p.toCanvas();
    }
    // gomos do pescoço: grande e pequeno, cada um com a face 1–6 de um dado na barriga
    for (const [nm, w, h] of [['L', 26, 16], ['S', 20, 13]]) for (let n = 1; n <= 6; n++) {
      const p = P(w, h), gl = new G.Paint(p.w, p.h), cx = w, cy = h;
      for (let i = 0; i < 3; i++) { const x = cx - w * 0.5 + i * w * 0.5; p.poly([[x - 3, cy - h + 4], [x + 3, cy - h + 4], [x, cy - h - 4 + (i === 1 ? -2 : 0)]], (xx, yy) => (yy < cy - h + 1 ? '#ffe27a' : '#e0a020')); }
      p.ell(cx, cy, w - 1, h - 2, { ramp: H, ambient: 0.32, contrast: 1.2, dither: 0.35 });
      p.ell(cx, cy + h * 0.25, w * 0.55, h * 0.55, { ramp: BL, ambient: 0.4 });
      pip(p, gl, cx, cy + h * 0.25, n, w * 0.17, Math.max(1.1, w * 0.06), '#7a1a10');
      for (let x = cx - w + 4; x < cx + w - 4; x += 5) if (p.alphaAt(x, cy - 2)) p.px(x, cy - 2, H[1]);
      p.outline({ k: -0.85 }); B['dragonNeck' + nm + n] = p.toCanvas(); B['dragonNeck' + nm + n + 'Glow'] = gl.toCanvas();
    }
    // asa direita (46×34): ossos em leque e membrana recortada; pivô no ombro (embaixo à esquerda)
    {
      const p = P(46, 34), sx = 4, sy = 62, tips = [[40, 6], [70, 10], [90, 30]], ends = [[30, 56], [56, 50], [80, 58]];
      const mem = [[sx, sy]].concat([tips[0], ends[0], tips[1], ends[1], tips[2], ends[2]]).concat([[34, 66]]);
      p.poly(mem, (x, y) => { const v = (x + y) / 160; return v < 0.45 ? '#a8382a' : v < 0.7 ? '#cc5038' : '#e8764a'; });
      for (let i = 0; i < 40; i++) { const x = Math.round(10 + G.hash2(i, 3, 5) * 75), y = Math.round(15 + G.hash2(i, 4, 5) * 45); if (p.alphaAt(x, y)) p.px(x, y, '#ff9a6a'); } // veias claras
      for (const [i, [tx, ty]] of tips.entries()) { p.line(sx, sy, tx, ty, H[0], 3); p.line(sx, sy - 1, tx, ty - 1, H[3], 1); if (i === 0) p.poly([[tx - 2, ty], [tx + 3, ty - 6], [tx + 3, ty + 1]], BN[3]); }
      for (const [ex, ey] of ends) p.line(ex, ey, ex - 3, ey - 6, '#5a1410', 1);
      p.outline({ k: -0.85 }); B.dragonWing = p.toCanvas();
    }
  }
  // ------------------------------------------------------------------
  //  YETI GAUSSIANO (de frente): o corpo tem a silhueta de um sino de
  //  Gauss, com a curva normal gravada no peito; chifres de gelo, rosto
  //  azul, braços em dois segmentos com mãos de garras e pés peludos.
  // ------------------------------------------------------------------
  function yeti() {
    const F = ['#435276', '#8090b8', '#c4d0ea', '#eaf0fc', '#ffffff'], SK = ['#2a3a64', '#4a62a0', '#6a86c4', '#90aee0', '#c0d8f8'], ICE = ['#2a5a8c', '#5a96cc', '#a0d0f4', '#e0f2ff', '#ffffff'];
    // pelagem: contorno desfiado e mechas
    const shag = (fn, seed, amp = 1.6) => (x, y) => fn(x + Math.sin(y * 0.9 + seed) * amp * 0.6, y + Math.sin(x * 1.3 + seed) * amp);
    const strands = (p, n, bb, seed) => { for (let i = 0; i < n; i++) { const x = bb[0] + G.hash2(i, seed, 1) * (bb[2] - bb[0]), y = bb[1] + G.hash2(i, seed, 2) * (bb[3] - bb[1]); if (p.alphaAt(x | 0, y | 0) && p.alphaAt(x | 0, (y + 5) | 0)) p.line(x, y, x + (G.hash2(i, seed, 3) - 0.5) * 2, y + 5, G.hash2(i, seed, 4) > 0.5 ? F[1] : F[2]); } };
    // corpo-sino (52×46): pivô embaixo no centro
    {
      const p = P(52, 46), gl = new G.Paint(p.w, p.h), cx = 52, bot = 90;
      const bell = (x, y) => { const z = (x + 0.5 - cx) / 26, h = Math.exp(-z * z / 2); return y <= bot && y >= bot - 4 - h * 82; };
      p.litMask(shag(bell, 1, 1.8), { ramp: F, radius: 16, ambient: 0.42, contrast: 1.1, dither: 0.6 }, [0, 0, 103, 91]);
      strands(p, 140, [8, 10, 96, 88], 2);
      // peito: a curva normal com a área preenchida e a linha da média
      p.ell(cx, 62, 26, 22, (nx, ny) => (ny < -0.6 ? '#c8d6ee' : '#dbe6f6'));
      for (let i = -24; i <= 24; i++) { const h = Math.exp(-(i * i) / 162) * 24; for (let k = 0; k < h; k++) { p.px(cx + i, 80 - k, k > h - 1.6 ? SK[1] : '#a8c0e8'); if (k > h - 1.6) gl.px(cx + i, 80 - k, '#ffffff'); } }
      for (let y = 52; y < 81; y += 2) { p.px(cx, y, SK[0]); gl.px(cx, y, '#ffffff'); } // μ
      for (let i = 0; i < 16; i++) { const x = 14 + G.hash2(i, 9, 1) * 76, y = 20 + G.hash2(i, 9, 2) * 60; if (p.alphaAt(x | 0, y | 0)) p.px(x, y, '#ffffff'); } // brilhos de gelo
      p.outline({ k: -0.86 }); B.yetiBody = p.toCanvas(); B.yetiBodyGlow = gl.toCanvas();
    }
    // cabeça (30×26), boca fechada (0) e rugindo (1)
    for (const roar of [0, 1]) {
      const p = P(30, 26), cx = 30;
      for (const s of [-1, 1]) { // chifres de gelo em espiral
        const pts = []; for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push([cx + s * (11 + 14 * Math.sin(u * 2.2)), 20 - 14 * Math.sin(u * 1.6) + u * u * 14]); } // arco de carneiro, para fora
        for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], w = 7 - i * 0.55; p.line(x0, y0, x1, y1, ICE[0], w + 2); }
        for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], w = 7 - i * 0.55; p.line(x0, y0, x1, y1, ICE[1], w); p.line(x0 - 0.5, y0 - 1, x1 - 0.5, y1 - 1, ICE[3], Math.max(1, w * 0.4)); if (i % 3 === 1) p.line(x0 - w * 0.5, y0, x0 + w * 0.5, y0 + 1, ICE[0], 1); }
      }
      const dome = (x, y) => { const dx = (x + 0.5 - cx) / 24, dy = (y + 0.5 - 28) / 22; return dx * dx + dy * dy <= 1 && y < 50; };
      p.litMask(shag(dome, 4, 1.4), { ramp: F, radius: 11, ambient: 0.42, dither: 0.6 }, [0, 0, 59, 51]);
      strands(p, 40, [10, 8, 50, 30], 5);
      // rosto azul com sobrancelha pesada
      p.ell(cx, 34, 15, 12, { ramp: SK, ambient: 0.45, contrast: 1.1 });
      p.poly([[cx - 15, 27], [cx - 2, 29], [cx - 1, 31], [cx - 14, 30]], F[1]); p.poly([[cx + 15, 27], [cx + 2, 29], [cx + 1, 31], [cx + 14, 30]], F[1]);
      p.ell(cx, 36, 3, 2, SK[0]); // nariz
      if (roar) { p.ell(cx, 42, 9, 6, '#1a1030'); p.ell(cx, 44, 6, 3, '#8a3a5a'); for (const x of [cx - 6, cx + 6]) p.poly([[x - 1.6, 37], [x + 1.6, 37], [x, 42]], '#ffffff'); for (const x of [cx - 5, cx + 5]) p.poly([[x - 1.4, 47], [x + 1.4, 47], [x, 43]], '#ffffff'); }
      else { p.poly([[cx - 9, 41], [cx + 9, 41], [cx + 7, 44], [cx - 7, 44]], '#1a1030'); for (const x of [cx - 6, cx + 6]) p.poly([[x - 1.5, 41], [x + 1.5, 41], [x, 45]], '#ffffff'); }
      p.outline({ k: -0.86 }); B['yetiHead' + roar] = p.toCanvas();
    }
    // braço (16×20): ombro peludo; antebraço (18×24): mão azul com garras e pingentes de gelo
    {
      const p = P(16, 20);
      p.litMask(shag(inEll(16, 18, 14, 17), 7, 1.5), { ramp: F, radius: 9, ambient: 0.42, dither: 0.6 }, [0, 0, 31, 39]);
      strands(p, 30, [4, 4, 28, 34], 8);
      for (const x of [8, 14, 22]) { const l = 3 + (x % 5); for (let k = 0; k < l; k++) p.px(x, 34 + k, k < l - 1 ? ICE[2] : ICE[4]); }
      p.outline({ k: -0.86 }); B.yetiArm = p.toCanvas();
    }
    {
      const p = P(18, 24);
      p.litMask(shag(inRR(6, 0, 24, 30, 9), 9, 1.4), { ramp: F, radius: 8, ambient: 0.42, dither: 0.6 }, [0, 0, 35, 31]);
      p.curPart = 2; p.ell(18, 36, 13, 9.5, { ramp: SK, ambient: 0.45, contrast: 1.15 });
      for (const x of [9, 15, 21, 27]) p.poly([[x - 2, 42], [x + 2, 42], [x, 48]], (xx, yy) => (yy < 45 ? '#ffffff' : '#c8d8f0'));
      p.innerLines({ k: -0.5 }); p.outline({ k: -0.86 }); B.yetiFore = p.toCanvas();
    }
    // pé (16×10)
    { const p = P(16, 10); p.litMask(shag(inRR(2, 2, 28, 16, 7), 11, 1.2), { ramp: F, radius: 6, ambient: 0.42, dither: 0.5 }, [0, 0, 31, 19]); for (const x of [8, 16, 24]) p.poly([[x - 2, 16], [x + 2, 16], [x, 20]], '#ffffff'); p.outline({ k: -0.86 }); B.yetiFoot = p.toCanvas(); }
  }
  // ------------------------------------------------------------------
  //  VIÉS, O DISTORCEDOR: manto com a barra ondulando (4 quadros) e uma
  //  faixa de "gráfico enviesado" na bainha, máscara meio sorriso / meio
  //  choro com rachadura, mangas separadas e cajado com dado viciado.
  // ------------------------------------------------------------------
  function vies() {
    const trim = ['#6a3a0a', '#b07a1a', '#ffd84a'];
    for (const big of [0, 1]) {
      const s = big ? 1.3 : 1, R = big ? ['#1c0828', '#381050', '#5a1c74', '#7e329c', '#a85ac6'] : ['#16082a', '#2e1048', '#4a1c68', '#6c2e8c', '#9450b4'];
      let glow = null;
      for (let f = 0; f < 4; f++) {
        const p = P(32 * s, 44 * s), gl = new G.Paint(p.w, p.h), W = p.w, Hh = p.h, cx = W / 2, ph = f * Math.PI / 2;
        const hem = (x, amp) => Hh - 3 - Math.abs(Math.sin(x * 0.16 / s + ph)) * amp * s;
        // capa atrás: mais larga, a barra balança
        p.curPart = 1;
        p.mask((x, y) => { const v = (y - 20 * s) / (Hh - 20 * s); return v >= 0 && Math.abs(x + 0.5 - cx - Math.sin(ph + v * 2) * v * 2 * s) <= 9 * s + v * 17 * s && y <= hem(x, 4); }, (x, y) => (Math.abs(x - cx) > 15 * s ? R[1] : R[0]), [0, 0, W - 1, Hh - 1]);
        // manto
        p.curPart = 2;
        const robe = (x, y) => { const v = (y - 20 * s) / (Hh - 20 * s); return v >= 0 && Math.abs(x + 0.5 - cx) <= 7 * s + v * 13 * s && y <= hem(x + 3, 2.5); };
        cyl(p, robe, R, [0, 0, W - 1, Hh - 1], { hi: 0.28, sh: 0.62 });
        // faixa da bainha: barras de alturas enviesadas (crescem para um lado)
        for (let x = 0; x < W; x++) { const b = Math.floor((x - (cx - 20 * s)) / (3 * s)); if (b < 0) continue; const hb = Math.min(8 * s, (2 + b * 0.55) * s); for (let y = Math.round(Hh - 5 * s - hb); y < Hh - 4 * s; y++) if (robe(x, y) && (x % Math.round(3 * s)) !== 0) { p.px(x, y, (b % 2) ? trim[1] : '#c0283a'); if (f === 0 && b % 2) gl.px(x, y, '#ffffff'); } }
        // costura dourada da frente e gola com espinhos
        for (let y = Math.round(22 * s); y < Hh - 5 * s; y++) { p.px(Math.round(cx) - 1, y, trim[1]); p.px(Math.round(cx), y, trim[2]); }
        for (let i = -3; i <= 3; i++) p.poly([[cx + i * 3 * s - 1.5 * s, 22 * s], [cx + i * 3 * s + 1.5 * s, 22 * s], [cx + i * 3.6 * s, (16 + Math.abs(i)) * s]], i % 2 ? R[3] : R[2]);
        // capuz e a escuridão de dentro
        p.curPart = 3; p.ell(cx, 16 * s, 13 * s, 14 * s, { ramp: R, ambient: 0.3, contrast: 1.15 });
        p.ell(cx, 19 * s, 10 * s, 10.5 * s, '#08030e');
        // máscara: metade sorri (clara), metade chora (lilás)
        p.curPart = 4; p.ell(cx, 19.5 * s, 8 * s, 9 * s, (nx, ny) => (nx < 0 ? (ny < -0.5 ? '#ffffff' : '#ece2f6') : (ny < -0.5 ? '#c8b8e0' : '#a898c4')));
        for (let y = Math.round(11 * s); y < 28 * s; y++) { const x = Math.round(cx + Math.sin(y * 0.9) * 1.2); p.px(x, y, '#3a2050'); if (f === 0) gl.px(x, y, '#ffffff'); } // rachadura
        p.innerLines({ k: -0.5 }); p.outline({ k: -0.88 });
        // olhos vermelhos, sorriso e choro
        for (const [ex, ey] of [[-3.8, 17], [3.8, 18]]) { p.ell(cx + ex * s, ey * s, 1.8 * s, 1.5 * s, '#ff2a3a'); if (f === 0) gl.ell(cx + ex * s, ey * s, 1.8 * s, 1.5 * s, '#ffffff'); }
        for (let i = -4; i <= -1; i++) p.px(cx + i * s, 23 * s - (i === -4 || i === -1 ? 1 : 0) * s, '#1b1428');
        for (let i = 1; i <= 4; i++) p.px(cx + i * s, 24 * s + (i === 1 || i === 4 ? 0 : 1) * s, '#1b1428');
        p.px(cx + 4.5 * s, 21 * s, '#7ae4ff'); p.px(cx + 4.5 * s, 22.5 * s, '#4ab8e8');
        B['vies' + big + '_' + f] = p.toCanvas();
        if (f === 0) glow = gl.toCanvas();
      }
      B['vies' + big] = B['vies' + big + '_0']; B['vies' + big + 'Glow'] = glow;
      // manga com mão de dedos longos (pivô no ombro)
      {
        const p = P(10 * s, 17 * s), cx = 10 * s;
        const m = (x, y) => { const v = y / (30 * s); return y >= 0 && y <= 30 * s && Math.abs(x + 0.5 - cx) <= 4 * s + v * 5 * s; };
        cyl(p, m, R, [0, 0, p.w - 1, p.h - 1], { hi: 0.3, sh: 0.6 });
        for (let x = 0; x < p.w; x++) for (let y = Math.round(27 * s); y <= 30 * s; y++) if (m(x, y)) p.px(x, y, y < 28.5 * s ? trim[2] : trim[1]);
        p.curPart = 2; p.ell(cx, 31 * s, 3.2 * s, 2.6 * s, { ramp: ['#5a4878', '#8a76a8', '#b8a6d4', '#d8ccec', '#f4eeff'], ambient: 0.4 });
        for (const dx of [-2, 0, 2]) p.line(cx + dx * s, 32 * s, cx + dx * 1.4 * s, 34 * s, '#b8a6d4', 1);
        p.innerLines({ k: -0.5 }); p.outline({ k: -0.88 }); B['viesSleeve' + big] = p.toCanvas();
      }
    }
    // cajado: vara escura com anéis dourados e um dado viciado preso numa garra
    {
      const p = P(12, 48), gl = new G.Paint(p.w, p.h);
      for (let y = 18; y < 94; y++) for (let x = 10; x < 14; x++) p.px(x, y, x === 10 ? '#7a5a3a' : x === 13 ? '#2a1a10' : '#4a3020');
      for (const y of [30, 52, 74]) for (let x = 9; x < 15; x++) { p.px(x, y, '#ffd84a'); p.px(x, y + 1, '#b07a1a'); }
      p.poly([[6, 18], [18, 18], [20, 10], [16, 14], [12, 9], [8, 14], [4, 10]], '#c09020');
      p.curPart = 2; cyl(p, inRR(5, 0, 14, 14, 3), ['#a8a0b8', '#d8d0e8', '#f4f0ff', '#ffffff', '#ffffff'], [3, 0, 21, 15]);
      for (const [x, y] of [[8.5, 3.5], [12, 7], [15.5, 10.5]]) { p.ell(x, y, 1.3, 1.3, '#c0283a'); gl.ell(x, y, 1.6, 1.6, '#ffffff'); }
      p.innerLines({ k: -0.5 }); p.outline({ k: -0.88 }); B.viesStaff = p.toCanvas(); B.viesStaffGlow = gl.toCanvas();
    }
  }
  // ------------------------------------------------------------------
  //  MINI-CHEFES: Rei Dado (dado em 3/4 com coroa, manto, olhos e luvas),
  //  Histograma Colossal (barras de gelo sobre o eixo x) e Sentinela
  //  Boxplot (blocos de pedra Q1 e Q3 presos pela mediana dourada)
  // ------------------------------------------------------------------
  const PIP9 = { 1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [2, 0], [0, 2], [2, 2]], 5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]] };
  const GOLD = ['#6a3a08', '#b07818', '#e8b030', '#ffd860', '#fff4b0'];
  // junta peças prontas num ícone (cartão do bestiário e fantasma da morte)
  function composite(lw, lh, list) {
    const c = G.canvas(lw * 2, lh * 2), x = c.getContext('2d');
    for (const [img, lx, ly] of list) if (img) x.drawImage(img, Math.round(lx * 2), Math.round(ly * 2));
    c.lw = lw; c.lh = lh; return c;
  }
  function reiDado() {
    const IV = ['#6e5e6c', '#b4a6b0', '#e4dad8', '#f8f2ec', '#ffffff'], SD = ['#3e3044', '#685a70', '#8a7c92', '#a89aae', '#c4b8c8'];
    const TOPC = ['#cfc4cc', '#e2d8dc', '#f2ecea', '#fdf8f4', '#ffffff'];
    // face vizinha que aparece na lateral (faces opostas somam 7, então nunca v nem 7 - v)
    const ADJ = { 1: 2, 2: 3, 3: 1, 4: 1, 5: 3, 6: 2 };
    // CORPO (40×42): frente 56×54 px de arte, tampo e lateral em perspectiva
    const front = inRR(3, 28, 56, 54, 8), top = inPoly([[3, 28.5], [59, 28.5], [73, 8], [17, 8]]), side = inPoly([[58.5, 28], [73, 8], [73, 62], [58.5, 82]]);
    for (let v = 1; v <= 6; v++) {
      const p = P(40, 42);
      p.curPart = 1;
      p.mask(side, (x, y) => {
        const u = (x + 0.5 - 58.5) / 14.5, yt = 28 - u * 20, yb = 82 - u * 20;
        if (u < 0.14 || y < yt + 2.5) return SD[3];
        if (u > 0.88 || y > yb - 3) return SD[1];
        return (G.bayer(x, y) > 0.5 && y > yb - 10) ? SD[1] : SD[2];
      }, [56, 6, 74, 84]);
      for (const [a, b] of PIP9[ADJ[v]]) {
        const u = 0.27 + a * 0.24, x = 58.5 + u * 14.5, y = 28 + (0.24 + b * 0.26) * 54 - u * 20;
        p.ell(x, y + 0.6, 1.9, 3.4, SD[4]); p.ell(x - 0.3, y, 1.7, 3.2, SD[0]);
      }
      p.curPart = 2;
      p.mask(top, (x, y) => { const k = (y + 0.5 - 8) / 20.5; return k > 0.86 ? TOPC[4] : k > 0.5 ? TOPC[3] : k > 0.18 ? TOPC[2] : TOPC[1]; }, [2, 6, 74, 30]);
      p.curPart = 3;
      p.litMask(front, { ramp: IV, radius: 9, ambient: 0.45, contrast: 1.05, dither: 0.35 }, [2, 27, 61, 83]);
      // pontos em baixo-relevo: parede de cima na sombra, borda de baixo iluminada
      const pip = (x, y, r, ace) => {
        const D = ace ? ['#5a0a18', '#a8182c', '#d8283a', '#ff8a90'] : ['#140c1e', '#2a1e3a', '#46385a', '#8a7aa0'];
        p.ell(x + 0.7, y + 0.8, r + 0.7, r + 0.7, IV[4]); p.ell(x - 0.4, y - 0.4, r + 0.4, r + 0.4, IV[1]);
        p.ell(x, y, r, r, (nx, ny) => (nx + ny < -0.45 ? D[0] : nx + ny < 0.4 ? D[1] : D[2]));
        p.px(Math.round(x + r * 0.3), Math.round(y + r * 0.35), D[3]);
      };
      for (const [a, b] of PIP9[v]) pip(31 + (a - 1) * 15.5, 55 + (b - 1) * 15, v === 1 ? 7.5 : 4.6, v === 1);
      p.innerLines({ k: -0.5 }); p.outline({ k: -0.82 });
      B['rdBody' + v] = p.toCanvas();
    }
    // OLHOS no tampo (24×8): severos, bravos (pupila vermelha), piscando e tontos
    for (const mode of ['', 'Mad', 'Blink', 'Dizzy']) {
      const p = P(24, 8), gl = new G.Paint(p.w, p.h);
      for (const s of [-1, 1]) {
        const ex = 24 + s * 11, ey = 9.5, ink = '#1a1028';
        if (mode === 'Blink') { for (let x = -6; x <= 6; x++) p.rect(ex + x, ey + Math.round((x * x) / 24), 1, 2, ink); }
        else {
          p.ell(ex, ey, 6.6, 4.7, ink); p.ell(ex, ey, 5.5, 3.7, (nx, ny) => (ny < -0.35 ? '#d4cce4' : '#ffffff'));
          if (mode === 'Dizzy') { for (let t = 0; t < Math.PI * 4; t += 0.15) { const r = t * 0.36; p.px(Math.round(ex + Math.cos(t * s) * r), Math.round(ey + Math.sin(t * s) * r * 0.72), ink); } }
          else {
            const pc = mode === 'Mad' ? ['#7a0a1a', '#e8203a'] : ['#1a1240', '#3a2a7a'];
            p.ell(ex - s * 0.8, ey + 0.8, 2.6, 3, (nx, ny) => (ny < 0 ? pc[0] : pc[1])); p.px(ex - s * 0.8 - 1.5, ey - 0.8, '#ffffff');
            if (mode === 'Mad') { gl.ell(ex - s * 0.8, ey + 0.8, 3.4, 3.6, '#ffffff'); }
          }
        }
        // sobrancelha grossa, mais baixa no meio (severa); brava, ainda mais inclinada
        const inY = mode === 'Mad' ? ey - 2.5 : ey - 4, outY = mode === 'Mad' ? ey - 8 : ey - 7.2;
        p.line(ex + s * 7.5, outY, ex - s * 2.5, inY, ink, 2.2);
      }
      p.outline({ k: -0.6 });
      B['rdEyes' + mode] = p.toCanvas(); if (mode === 'Mad') B.rdEyesMadGlow = gl.toCanvas();
    }
    // COROA (26×16): veludo vermelho por trás das pontas, pérolas e joias com brilho
    {
      const p = P(26, 16), gl = new G.Paint(p.w, p.h);
      p.curPart = 1; p.ell(26, 20, 19, 10, { ramp: ['#3a0614', '#6a1028', '#a01c38', '#c83a50', '#e86a70'], ambient: 0.35 });
      p.curPart = 2;
      const crown = inPoly([[4, 31], [4, 15], [8, 5], [12.5, 16], [17, 8], [21.5, 16], [26, 3], [30.5, 16], [35, 8], [39.5, 16], [44, 5], [48, 15], [48, 31]]);
      p.litMask(crown, { ramp: GOLD, radius: 4, ambient: 0.4, contrast: 1.1, dither: 0.3 }, [3, 2, 49, 32]);
      for (let x = 4; x < 48; x++) { if (crown(x, 21)) p.px(x, 21, GOLD[1]); if (crown(x, 22)) p.px(x, 22, GOLD[4]); if (crown(x, 30)) p.px(x, 30, GOLD[0]); }
      for (const [x, y] of [[8, 5], [17, 8], [26, 3], [35, 8], [44, 5]]) { p.ell(x, y, 2.3, 2.3, { ramp: ['#8a8098', '#c8c0d8', '#ece8f4', '#ffffff', '#ffffff'], ambient: 0.5 }); }
      for (const [x, r, c] of [[14, 2.4, ['#0a1a5a', '#2a5ae8', '#8ab8ff']], [26, 3.2, ['#5a0a14', '#d8202e', '#ff9a9a']], [38, 2.4, ['#0a1a5a', '#2a5ae8', '#8ab8ff']]]) {
        p.ell(x, 26.5, r + 0.8, r + 0.8, GOLD[0]); p.ell(x, 26.5, r, r, (nx, ny) => (nx + ny < -0.5 ? c[2] : nx + ny < 0.5 ? c[1] : c[0])); gl.ell(x, 26.5, r, r, '#ffffff');
      }
      p.innerLines({ k: -0.45 }); p.outline({ k: -0.85 });
      B.rdCrown = p.toCanvas(); B.rdCrownGlow = gl.toCanvas();
    }
    // MANTO (52×38): veludo com dobras, gola e barra de arminho
    {
      const p = P(52, 38), RED = ['#2a0410', '#5a0c20', '#8a1830', '#b82a40', '#e05a60'];
      const hw = y => 30 + (y / 76) * 21 + Math.sin(y * 0.09) * 1.5, hem = x => 70 + Math.sin(x * 0.26) * 2.6 + Math.sin(x * 0.11) * 1.4;
      const m = (x, y) => y >= 4 && y <= hem(x) && Math.abs(x + 0.5 - 52) <= hw(y);
      p.curPart = 1; p.litMask(m, { ramp: RED, radius: 12, ambient: 0.3, contrast: 1.15, dither: 0.4 }, [0, 3, 103, 76]);
      // dobras: faixas escuras que se abrem para baixo
      for (const fx of [-38, -22, 22, 38]) for (let y = 14; y < 76; y++) { const x = Math.round(52 + fx * (0.55 + y / 76 * 0.45)); for (const dx of [0, 1]) if (m(x + dx, y)) p.px(x + dx, y, dx ? RED[3] : RED[1]); }
      const ermine = (x, y) => p.px(x, y, (G.hash2(x, y, 3) > 0.93) ? '#1a1418' : (y % 3 === 0 ? '#e8e4ee' : '#ffffff'));
      p.curPart = 2;
      for (let x = 0; x < 104; x++) { const yb = hem(x); for (let y = Math.floor(yb - 7); y <= yb; y++) if (m(x, y)) ermine(x, y); }
      for (let y = 1; y <= 11; y++) for (let x = 0; x < 104; x++) { const dx = (x + 0.5 - 52) / 38, dy = (y + 0.5 - 6) / 5.5; if (dx * dx + dy * dy <= 1) ermine(x, y); }
      // caudinhas pretas do arminho
      for (let x = 10; x < 98; x += 9) { const yb = Math.round(hem(x)) - 4; p.rect(x, yb - 2, 2, 3, '#1a1418'); p.px(x - 1, yb + 1, '#1a1418'); p.px(x + 2, yb + 1, '#1a1418'); }
      for (let x = 20; x < 86; x += 11) { p.rect(x, 4, 2, 3, '#1a1418'); p.px(x - 1, 7, '#1a1418'); p.px(x + 2, 7, '#1a1418'); }
      p.innerLines({ k: -0.4 }); p.outline({ k: -0.85 });
      B.rdCape = p.toCanvas();
    }
    // LUVA (11×10): punho fechado com bainha dourada; e a espelhada
    {
      const p = P(11, 10), W = ['#7a7a98', '#bcbcd4', '#e6e6f2', '#ffffff', '#ffffff'];
      p.curPart = 1; p.ell(11, 11, 8, 7.4, { ramp: W, ambient: 0.4, contrast: 1.1 });
      p.curPart = 2; for (const x of [5.5, 10.5, 15.5]) p.ell(x, 5.5, 3.4, 3.4, { ramp: W, ambient: 0.45 });
      p.curPart = 3; p.ell(17.5, 12, 3, 3.4, { ramp: W, ambient: 0.45 });
      p.curPart = 4; p.rrect(5, 16, 12, 4, 1.5, (x, y) => (y < 17 ? GOLD[4] : y < 19 ? GOLD[2] : GOLD[1]));
      p.innerLines({ k: -0.35 }); p.outline({ k: -0.8 });
      B.rdGlove = p.toCanvas(); B.rdGloveF = p.flipX().toCanvas();
    }
    // CETRO (8×30): vara dourada com empunhadura e um dado vermelho na garra
    {
      const p = P(8, 30), gl = new G.Paint(p.w, p.h);
      p.curPart = 1; cyl(p, inRR(6, 13, 4, 46, 1.5), GOLD, [5, 12, 11, 60], { hi: 0.3, sh: 0.7 });
      for (const y of [24, 40, 52]) p.rect(5, y, 6, 2, GOLD[4]);
      for (let y = 30; y < 38; y += 2) p.rect(6, y, 4, 1, '#5a2a10');
      p.curPart = 2; p.poly([[2, 14], [14, 14], [15, 9], [12, 11], [8, 7], [4, 11], [1, 9]], GOLD[2]);
      p.curPart = 3; bevel(p, inRR(3, 1, 10, 10, 2.5), ['#5a0a14', '#a8182c', '#e0283a', '#ff8a90'], [2, 0, 14, 12]);
      for (const [x, y] of [[5.5, 3.5], [8, 6], [10.5, 8.5]]) { p.ell(x, y, 1.1, 1.1, '#ffffff'); }
      gl.rrect(3, 1, 10, 10, 2.5, '#ffffff');
      p.innerLines({ k: -0.45 }); p.outline({ k: -0.85 });
      B.rdScepter = p.toCanvas(); B.rdScepterGlow = gl.toCanvas();
    }
    G.spr.reidado_icon = composite(52, 52, [[B.rdCape, 0, 10], [B.rdBody6, 7, 10], [B.rdCrown, 16, 0], [B.rdEyes, 14, 15]]);
  }
  function histoColosso() {
    const RAMPS = [['#0e4a6a', '#1a7aa8', '#3ab4e0', '#7ae4ff', '#d8f8ff'], ['#12306e', '#2050b0', '#3a80e8', '#7ab4ff', '#d8ecff'], ['#24186e', '#3a2ab0', '#6050e0', '#9a8cff', '#e0dcff']];
    // HASTE de gelo (8×44): sulcos a cada unidade de frequência (13 px de arte), a partir da base
    RAMPS.forEach((R, k) => {
      const p = P(8, 44), m = (x, y) => x >= 1 && x <= 14;
      cyl(p, m, R, [0, 0, 15, 87], { hi: 0.28, sh: 0.68, noTop: true, noBottom: true });
      for (let x = 6; x <= 8; x++) for (let y = 0; y < 88; y++) if (G.bayer(x, y) > 0.55) p.px(x, y, R[3]);
      for (const y of [16, 44, 74]) p.line(3, y, 10, y - 10, R[4] + 'a0');
      for (let u = 1; u <= 6; u++) { const y = 87 - u * 13; for (let x = 1; x <= 14; x++) { p.px(x, y, R[1]); p.px(x, y + 1, R[4]); } }
      for (let y = 80; y < 88; y++) for (let x = 1; x <= 14; x++) if (G.hash2(x, y, 9) > 0.7 - (y - 80) * 0.05) p.px(x, y, '#f4fcff');
      p.outline({ k: -0.8 });
      B['hcShaft' + k] = p.toCanvas();
      // TAMPA facetada (9×5)
      const q = P(9, 5), cap = inPoly([[1, 10], [1, 5], [5, 1], [13, 1], [17, 5], [17, 10]]);
      q.litMask(cap, { ramp: R, radius: 3, ambient: 0.4, contrast: 1.1 }, [0, 0, 17, 10]);
      q.poly([[5.5, 1.5], [12.5, 1.5], [15, 4.5], [3, 4.5]], R[4]); q.line(1, 5, 17, 5, R[3]);
      q.outline({ k: -0.85 });
      B['hcCap' + k] = q.toCanvas();
    });
    // BASE: o eixo x (48×10), pedra gelada com marcas sob cada barra e a seta no fim
    {
      const p = P(48, 10), S = ['#1a2a44', '#2e4668', '#4a6a90', '#7898b8', '#b8d0e4'];
      const m = (x, y) => inRR(1, 4, 90, 14, 3)(x, y) || inPoly([[88, 3], [95, 11], [88, 19]])(x, y);
      p.litMask(m, { ramp: S, radius: 4, ambient: 0.35, contrast: 1.1, dither: 0.35 }, [0, 2, 95, 19]);
      for (let x = 2; x < 90; x++) for (let y = 4; y < 7; y++) if (m(x, y)) p.px(x, y, y === 4 ? '#ffffff' : '#e0f2ff');
      for (let x = 3; x < 88; x += 2) if (G.hash2(x, 1, 5) > 0.6) { const n = 1 + Math.floor(G.hash2(x, 2, 5) * 3); for (let y = 7; y < 7 + n; y++) p.px(x, y, '#d8eeff'); }
      for (let i = 0; i < 5; i++) { const x = 6 + i * 18 + 8; p.rect(x, 9, 2, 6, S[0]); p.rect(x + 2, 9, 1, 6, S[4]); }
      p.outline({ k: -0.85 });
      B.hcBase = p.toCanvas();
    }
    // PÉ de rocha com gelo (10×7)
    { const p = P(10, 7), m = inRR(1, 2, 18, 11, 4); rock(p, m, ['#1a2436', '#344660', '#526a88', '#7a92ae', '#a8bcd2'], [0, 1, 19, 13], { radius: 4, seed: 31 }); for (let x = 2; x < 18; x++) for (let y = 2; y < 5; y++) if (m(x, y)) p.px(x, y, y < 3 ? '#ffffff' : '#d8eeff'); p.outline({ k: -0.85 }); B.hcFoot = p.toCanvas(); }
    // OLHOS da moda (8×4): brilham na barra mais alta
    for (const mode of ['', 'Mad']) {
      const p = P(8, 4), gl = new G.Paint(p.w, p.h), c = mode ? ['#ff2a4a', '#ffb0b8'] : ['#7af0ff', '#ffffff'];
      for (const ex of [4.5, 11.5]) { p.ell(ex, 4, 3.2, 2.8, '#06101e'); p.ell(ex, 4.3, 1.7, 1.7, c[0]); p.px(ex - 1, 3, c[1]); gl.ell(ex, 4.3, 2.2, 2.2, '#ffffff'); }
      if (mode) for (const s of [-1, 1]) p.line(8 + s * 7, 0.5, 8 + s * 1.5, 2, '#06101e', 1.4);
      B['hcEyes' + mode] = p.toCanvas(); B['hcEyes' + mode + 'Glow'] = gl.toCanvas();
    }
    const bars = [2, 4, 6, 4, 2].map((h, i) => { const k = [0, 1, 2, 1, 0][i], sh = B['hcShaft' + k], c = G.canvas(16, h * 13 + 10), x = c.getContext('2d'); x.drawImage(sh, 0, sh.height - h * 13, 16, h * 13, 0, 10, 16, h * 13); x.drawImage(B['hcCap' + k], -1, 2); return [c, h]; });
    G.spr.histocolosso_icon = composite(52, 56, [[B.hcBase, 2, 46], ...bars.map(([c, h], i) => [c, 4 + i * 9, 46 - h * 6.5 - 5]), [B.hcEyes, 22, 12]]);
  }
  function boxSentinela() {
    const ST = ['#161a34', '#2a3058', '#424c80', '#6672a8', '#98a4d4'], STEEL = ['#2a2e44', '#5a6080', '#9aa2c0', '#d0d6ea', '#ffffff'];
    const GL = { Q: ['.##.', '#..#', '#..#', '#.##', '.###'], 1: ['.#', '##', '.#', '.#', '.#'], 3: ['##.', '..#', '.#.', '..#', '##.'] };
    // METADES da caixa (15×21): pedra com moldura entalhada, constelação dourada, Q1/Q3 e o olho
    for (const side of ['L', 'R']) {
      const p = P(15, 21), gl = new G.Paint(p.w, p.h), m = inRR(1, 1, 28, 40, 4), L = side === 'L';
      p.litMask(m, { ramp: ST, radius: 6, ambient: 0.35, contrast: 1.1, dither: 0.4 }, [0, 0, 29, 41]);
      for (let x = 5; x <= 24; x++) { p.px(x, 5, ST[0]); p.px(x, 6, ST[4]); p.px(x, 35, ST[0]); p.px(x, 36, ST[3]); }
      for (let y = 5; y <= 36; y++) { p.px(5, y, ST[0]); p.px(6, y, ST[3]); p.px(24, y, ST[0]); p.px(25, y, ST[2]); }
      for (const [x, y] of [[3, 3], [26, 3], [3, 38], [26, 38]]) { p.ell(x, y, 1.6, 1.6, ST[0]); p.px(x - 1, y - 1, ST[4]); }
      // olho: fenda do lado da mediana
      const ex = L ? 15 : 9;
      p.rect(ex, 11, 7, 4, '#06040e'); p.rect(ex + 1, 12, 5, 2, '#ff4a5a'); gl.rect(ex, 11, 7, 4, '#ffffff');
      // Q1 / Q3 entalhado em dourado
      const txt = L ? 'Q1' : 'Q3'; let tx = 9;
      for (const ch of txt) { const rows = GL[ch]; rows.forEach((r, yy) => { for (let xx = 0; xx < r.length; xx++) if (r[xx] === '#') { p.px(tx + xx + 1, 21 + yy, ST[0]); p.px(tx + xx, 20 + yy, GOLD[3]); } }); tx += rows[0].length + 1; }
      // constelação
      const stars = L ? [[9, 29], [14, 32], [19, 28], [21, 31]] : [[9, 30], [12, 27], [17, 31], [21, 28]];
      for (let i = 1; i < stars.length; i++) p.line(stars[i - 1][0], stars[i - 1][1], stars[i][0], stars[i][1], ST[3]);
      for (const [x, y] of stars) p.px(x, y, GOLD[4]);
      p.outline({ k: -0.85 });
      B['bsHalf' + side] = p.toCanvas(); B['bsHalf' + side + 'Glow'] = gl.toCanvas();
    }
    // MEDIANA (4×24): barra de ouro que sustenta a caixa
    { const p = P(4, 24), gl = new G.Paint(p.w, p.h), m = inRR(1, 1, 6, 46, 2); cyl(p, m, GOLD, [0, 0, 7, 47], { hi: 0.3, sh: 0.7 }); for (const y of [2, 45]) p.rect(1, y, 6, 1, GOLD[4]); p.outline({ k: -0.8 }); gl.mask(m, '#ffffff'); B.bsMedian = p.toCanvas(); B.bsMedianGlow = gl.toCanvas(); }
    // BIGODE: haste de aço (48×3) desenhada recortada no comprimento, e a ponta em T (4×12)
    { const p = P(48, 3); cyl90(p, (x, y) => y >= 1 && y <= 4, STEEL, [0, 0, 95, 5]); for (let x = 6; x < 96; x += 12) p.rect(x, 1, 1, 4, STEEL[1]); p.outline({ k: -0.85 }); B.bsRod = p.toCanvas(); }
    { const p = P(4, 12), m = inRR(1, 1, 6, 22, 2); cyl(p, m, STEEL, [0, 0, 7, 23], { hi: 0.3, sh: 0.7 }); p.rect(1, 1, 6, 3, GOLD[3]); p.rect(1, 20, 6, 3, GOLD[2]); p.outline({ k: -0.85 }); B.bsCap = p.toCanvas(); }
    // PERNA (7×11): pilar com sapata
    {
      const p = P(7, 11);
      p.curPart = 1; cyl(p, inRR(3, 0, 8, 16, 2), ST, [2, 0, 11, 16], { hi: 0.3, sh: 0.68 });
      p.curPart = 2; p.litMask(inRR(0, 14, 14, 8, 3), { ramp: ST, radius: 3, ambient: 0.35 }, [0, 13, 13, 22]);
      p.innerLines({ k: -0.5 }); p.outline({ k: -0.85 }); B.bsLeg = p.toCanvas();
    }
    // CÚPULA de latão com a lente do observatório (12×6)
    { const p = P(12, 6), gl = new G.Paint(p.w, p.h); p.ell(12, 12, 11, 10.5, { ramp: ['#4a2a0a', '#8a5a1a', '#c08a2a', '#e8b84a', '#fff0a0'], ambient: 0.4 }); p.ell(12, 6.5, 3.4, 3.4, '#0a1030'); p.ell(12, 6.5, 2.4, 2.4, (nx, ny) => (nx + ny < -0.3 ? '#bff0ff' : '#3a8ae8')); gl.ell(12, 6.5, 3, 3, '#ffffff'); p.outline({ k: -0.85 }); B.bsDome = p.toCanvas(); B.bsDomeGlow = gl.toCanvas(); }
    G.spr.boxsentinela_icon = composite(44, 40, [[B.bsLeg, 9, 29], [B.bsLeg, 28, 29], [B.bsHalfL, 7, 12], [B.bsHalfR, 22, 12], [B.bsMedian, 20, 10], [B.bsDome, 16, 5]]);
  }
  G.buildBossArt = function () { golem(); spider(); scorpion(); dragon(); yeti(); vies(); reiDado(); histoColosso(); boxSentinela(); };
})(window.G);
