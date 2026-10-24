'use strict';
// =====================================================================
//  Tiles: tipos e propriedades + renderizador de cenário em "pedaços"
//  (chunks) pintados pixel a pixel em coordenadas do mundo: texturas
//  contínuas, bordas orgânicas, espuma na água, oclusão junto às
//  paredes. Água/lava animadas por baixo; árvores e colunas altas
//  são desenhadas junto com as entidades (ordenadas pela base).
// =====================================================================
(function (G) {
  const T = G.T = {
    VOID: 0, GROUND: 1, GROUND2: 2, PATH: 3, TREE: 4, BUSH: 5, ROCK: 6, CRACKED: 7, BARRIER: 8, WATER: 9,
    LAVA: 10, ICE: 11, BRIDGE: 12, TALLGRASS: 13, FENCE: 14, CLIFF: 15, BLOCK: 16, SEAL: 17, PIT: 18,
    FLOOR: 19, FLOOR2: 20, WALL: 21, PILLAR: 22, CARPET: 23, STAIRS: 24, PLAZA: 25
  };
  const TP = G.TP = [];
  for (let i = 0; i <= 25; i++) TP[i] = {};
  Object.assign(TP[T.VOID], { solid: 1 });
  Object.assign(TP[T.TREE], { solid: 1 });
  Object.assign(TP[T.BUSH], { solid: 1, low: 1, cut: 1 });
  Object.assign(TP[T.ROCK], { solid: 1, low: 1 });
  Object.assign(TP[T.CRACKED], { solid: 1, bomb: 1 });
  Object.assign(TP[T.BARRIER], { solid: 1, beam: 1 });
  Object.assign(TP[T.WATER], { water: 1, hazard: 1 });
  Object.assign(TP[T.LAVA], { lava: 1, hazard: 1 });
  Object.assign(TP[T.ICE], { ice: 1 });
  Object.assign(TP[T.TALLGRASS], { cut: 1, grass: 1 });
  Object.assign(TP[T.FENCE], { solid: 1, low: 1 });
  Object.assign(TP[T.CLIFF], { solid: 1 });
  Object.assign(TP[T.BLOCK], { solid: 1 });
  Object.assign(TP[T.SEAL], { solid: 1 });
  Object.assign(TP[T.PIT], { pit: 1, hazard: 1 });
  Object.assign(TP[T.WALL], { solid: 1 });
  Object.assign(TP[T.PILLAR], { solid: 1 });

  // ------------------------- paletas (escuro → claro) -------------------------
  const TH = G.THEMES = {
    vila: { base: 'grass', g: ['#2c7a34', '#3f9a3e', '#58b84a', '#78d05a', '#a6e676'], deco: ['#ff6a8a', '#ffe060', '#ffffff', '#8ad0ff'], p: ['#7a5a38', '#a07a4c', '#c09a64', '#dcbc84', '#eed6a6'], w: ['#2a5ab8', '#3a8ae8', '#6ab8f4', '#d8f4ff'], tree: 'oak', tc: ['#14401e', '#235e2a', '#357e34', '#4ea03e', '#78c454'], trunk: ['#3a2010', '#5a3418', '#7a4a24'], cl: ['#4a3a30', '#6a5444', '#8a7058', '#a88c6c', '#7ab04a'], bu: ['#1a5424', '#2a7a30', '#3e9a3a', '#5cb848', '#8ad866'], ro: ['#3e3a40', '#5e5a62', '#827c84', '#a8a2aa', '#d0ccd2'], cob: ['#6a5a4a', '#8a7660', '#a89478', '#c4b090', '#ddcaa8'] },
    lago: { base: 'grass', g: ['#2a7a3a', '#3a9446', '#52b056', '#70c866', '#a0e080'], deco: ['#ffffff', '#8ad0ff', '#ffe060', '#ff9ae6'], p: ['#7a6040', '#a08458', '#c0a470', '#dcc290', '#eed8b0'], w: ['#2a60b8', '#3a90e8', '#70c0f4', '#e0f8ff'], tree: 'oak', tc: ['#123e22', '#1e5c2e', '#2e7c3a', '#46a046', '#72c45e'], trunk: ['#3a2010', '#5a3418', '#7a4a24'], cl: ['#4a3a30', '#6a5444', '#8a7058', '#a88c6c', '#7ab04a'], bu: ['#185226', '#287834', '#3a983e', '#58b64c', '#86d66a'], ro: ['#3e3e44', '#5e5e66', '#828088', '#a8a6ae', '#d0cfd6'], cob: ['#6a5a4a', '#8a7660', '#a89478', '#c4b090', '#ddcaa8'] },
    planicie: { base: 'grass', g: ['#4a7a2a', '#629436', '#7cb244', '#9aca54', '#c4e27a'], deco: ['#ffe060', '#ff8a3a', '#ffffff', '#ff6a8a'], p: ['#7e5e38', '#a4804c', '#c4a066', '#dec088', '#f0d8a8'], w: ['#2a5ab8', '#3a8ae8', '#6ab8f4', '#d8f4ff'], tree: 'oak', tc: ['#24401a', '#365e24', '#4c7e2e', '#68a03a', '#94c454'], trunk: ['#3a2010', '#5a3418', '#7a4a24'], cl: ['#4e3e2e', '#6e5842', '#8e7456', '#ae906a', '#9aba4a'], bu: ['#2a501c', '#3c7428', '#529634', '#6eb442', '#9ad462'], ro: ['#44403a', '#64605a', '#888278', '#aca698', '#d4cec0'], cob: ['#6a5a4a', '#8a7660', '#a89478', '#c4b090', '#ddcaa8'] },
    floresta: { base: 'grass', g: ['#16502a', '#226a32', '#30843c', '#44a04a', '#6cc064'], deco: ['#c08aff', '#ffffff', '#ff6a6a', '#ffd23a'], p: ['#5a4228', '#7a5a38', '#9a744a', '#b8905e', '#d0ac7a'], w: ['#1a4a88', '#2a7ab8', '#5aa8dc', '#c8ecff'], tree: 'dark', tc: ['#08281a', '#103c24', '#1a5430', '#2a7040', '#4a9456'], trunk: ['#2a1810', '#422818', '#5a3a22'], cl: ['#3a3428', '#5a5040', '#7a6c56', '#968a70', '#4a8a4a'], bu: ['#0e3e1e', '#1a5a2a', '#2a7834', '#3e9442', '#64b45a'], ro: ['#36383a', '#525558', '#727578', '#94979a', '#bcbfc2'], cob: ['#5a4e40', '#786a58', '#968670', '#b0a088', '#c8b8a0'] },
    pantano: { base: 'grass', g: ['#3a5228', '#4c6a34', '#607e40', '#7a9a50', '#a0b870'], deco: ['#d8e070', '#a0d0a0', '#ffffff', '#c890ff'], p: ['#4a4028', '#625636', '#7a6c48', '#948860', '#b0a47c'], w: ['#2e5e48', '#4a8a6a', '#78b090', '#c8e8c0'], tree: 'willow', tc: ['#1a3018', '#2a4626', '#3c5e34', '#527a46', '#749a62'], trunk: ['#2a2014', '#40321e', '#584628'], cl: ['#383828', '#56563e', '#747458', '#8e8e70', '#6a8a4a'], bu: ['#24401c', '#365a28', '#4a7434', '#609042', '#86b060'], ro: ['#3a3a34', '#56564e', '#76766c', '#96968a', '#bcbcae'], cob: ['#4e4a3a', '#6a6450', '#868068', '#a09a80', '#bab49a'] },
    deserto: { base: 'sand', g: ['#b88a50', '#d4a868', '#e8c47e', '#f4d898', '#fff0c0'], deco: ['#c8a060', '#a07a40', '#ffffff', '#7a6a5a'], p: ['#8a6a40', '#a8845a', '#c49e70', '#dab688', '#ecd0a4'], w: ['#2a70b8', '#3aa0e8', '#72ccf4', '#e0fcff'], tree: 'cactus', tc: ['#1e4a24', '#2e6a30', '#42883c', '#5aa84a', '#88cc6a'], trunk: ['#1e4a24', '#2e6a30', '#42883c'], cl: ['#6a4428', '#8a5e38', '#ac7c4c', '#c89a62', '#e8c884'], bu: ['#6a5a2a', '#8a7a3a', '#a8964c', '#c4b264', '#e0d088'], ro: ['#6a4a30', '#8a6646', '#ac865e', '#c8a478', '#e4c49a'], cob: ['#8a6a48', '#a88660', '#c4a278', '#dcbc92', '#f0d6ae'] },
    vulcao: { base: 'ash', g: ['#2a2224', '#3e3436', '#544848', '#6a5c5a', '#8a7a76'], deco: ['#ff7a3a', '#8a7a78', '#ffd040', '#3a2a2a'], p: ['#2e2628', '#443a3a', '#5a4e4c', '#706260', '#8a7a76'], w: ['#c03a1a', '#ff7a2a', '#ffd040', '#ffffa0'], tree: 'dead', tc: ['#1a1010', '#2e2220', '#46342e', '#5e4a40', '#7a6252'], trunk: ['#1a1010', '#2e2220', '#46342e'], cl: ['#140c0e', '#261a1c', '#3a2a2a', '#52403c', '#9a8478'], bu: ['#2a2018', '#3e3024', '#544232', '#6a5642', '#86705a'], ro: ['#241c1e', '#3a2e30', '#544446', '#6e5c5c', '#8e7a78'], cob: ['#2e2628', '#443a3a', '#5a4e4c', '#706260', '#8a7a76'] },
    montanha: { base: 'snow', g: ['#9ab0d4', '#bccce6', '#d8e4f4', '#eef4fc', '#ffffff'], deco: ['#a8c8f0', '#ffffff', '#d8e8ff', '#7aa0d0'], p: ['#7e90b0', '#98a8c6', '#b2c0d8', '#c8d4e8', '#dee6f4'], w: ['#4a88c0', '#7ac0ec', '#b0e0ff', '#ffffff'], tree: 'pine', tc: ['#0e2a24', '#18403a', '#245a4c', '#367860', '#ffffff'], trunk: ['#2a1a12', '#42281a', '#5a3a24'], cl: ['#26304a', '#3c4866', '#58688a', '#7c8cae', '#f4f8ff'], bu: ['#6a8aa8', '#8aa8c4', '#a8c4dc', '#c8dcf0', '#ffffff'], ro: ['#465068', '#646e88', '#848ea8', '#a6aec6', '#ccd2e4'], cob: ['#7e90b0', '#98a8c6', '#b2c0d8', '#c8d4e8', '#dee6f4'] },
    // Planalto do Viés: terra "distorcida", de grama violeta-acinzentada, estradas de pedra escura e penhascos roxos
    castelo: { base: 'grass', g: ['#241e30', '#352c48', '#4a3e62', '#62547e', '#8a78a8'], deco: ['#c86aff', '#ff5a8a', '#e8d0ff', '#7ae4ff'], p: ['#2a2632', '#3c3846', '#504c5c', '#666274', '#82808e'], w: ['#24306a', '#3a4a8a', '#6a7ac0', '#b0c0f0'], tree: 'dead', tc: ['#120c18', '#241a2e', '#382a44', '#4e3c5c', '#6a5478'], trunk: ['#120c18', '#241a2e', '#382a44'], cl: ['#140e1c', '#261c32', '#3a2e4a', '#544466', '#9a86b8'], bu: ['#24182e', '#362442', '#4a3458', '#60466e', '#7e6090'], ro: ['#26202e', '#3c3446', '#544a60', '#6e647c', '#948aa2'], cob: ['#2e2a36', '#423e4c', '#585464', '#6e6a7c', '#8c8898'] },
    // masmorras: f = piso (escuro→claro), wl = parede (contorno, escuro, médio, claro, brilho)
    d1: { dun: true, floor: 'tiles', wall: 'bricks', f: ['#26383a', '#3a524e', '#4c665e', '#62806e', '#88a68e'], wl: ['#0c1616', '#1e322e', '#30483e', '#466454', '#6e8c76'], acc: '#ffd23a', moss: '#5a8a3a', ca: ['#a82a3a', '#ffd23a'], w: ['#2a5ab8', '#3a8ae8', '#6ab8f4', '#d8f4ff'], amb: '#8e9cac' },
    d2: { dun: true, floor: 'planks', wall: 'roots', f: ['#4a3020', '#644430', '#7e5a3e', '#9a744e', '#b89066'], wl: ['#1a1008', '#3a2614', '#56381e', '#74502c', '#94703e'], acc: '#7aff8a', moss: '#3a7a2a', ca: ['#2a6a2a', '#d8c060'], w: ['#1a4a88', '#2a7ab8', '#5aa8dc', '#c8ecff'], amb: '#86967e' },
    d3: { dun: true, floor: 'sand', wall: 'blocks', f: ['#8a6440', '#a87e54', '#c49a6a', '#dab682', '#ecd0a0'], wl: ['#3a2410', '#6a4626', '#906238', '#b4844e', '#d8aa6c'], acc: '#5a8aff', moss: '#d8c080', ca: ['#2a4ab0', '#ffd23a'], w: ['#2a70b8', '#3aa0e8', '#72ccf4', '#e0fcff'], amb: '#c0a890' },
    d4: { dun: true, floor: 'cave', wall: 'cave', f: ['#1e1416', '#2e2022', '#3e2c2c', '#523a38', '#6a4c46'], wl: ['#08040a', '#1e1214', '#30201e', '#46302c', '#60443c'], acc: '#ff7a2a', moss: '#5a2a1a', ca: ['#7a1a1a', '#ff9a2a'], w: ['#c03a1a', '#ff7a2a', '#ffd040', '#ffffa0'], amb: '#74504a' },
    d5: { dun: true, floor: 'ice', wall: 'ice', f: ['#6a88b8', '#88a6d0', '#a8c2e4', '#c6dcf4', '#e8f4ff'], wl: ['#1a2a4a', '#3a5482', '#5a7cb0', '#86a8d8', '#c0dcff'], acc: '#e0f0ff', moss: '#ffffff', ca: ['#4a3ab0', '#e0f0ff'], w: ['#4a88c0', '#7ac0ec', '#b0e0ff', '#ffffff'], amb: '#a0b4d4' },
    d6: { dun: true, floor: 'checker', wall: 'castle', f: ['#24182e', '#34243e', '#463252', '#5c4468', '#7a5c88'], wl: ['#0a0612', '#1e1430', '#302248', '#463462', '#644c84'], acc: '#ff3a6a', moss: '#5a2a4a', ca: ['#8a1a3a', '#ffd23a'], w: ['#24306a', '#3a4a8a', '#6a7ac0', '#b0c0f0'], amb: '#6e5e8e' },
    interior: { dun: true, floor: 'planks', wall: 'bricks', f: ['#6a4a30', '#8a6440', '#a88056', '#c49c6c', '#dcb886'], wl: ['#2a1810', '#5a4030', '#7a5a44', '#9a785a', '#bc9c78'], acc: '#ffd23a', moss: '#6a8a3a', ca: ['#c03a3a', '#ffd23a'], w: ['#2a5ab8', '#3a8ae8', '#6ab8f4', '#d8f4ff'], amb: '#e8d0b0' }
  };
  // cores empacotadas por tema (cache)
  const pk = G.col.pack;
  const PC = new Map();
  function pal(th) {
    let p = PC.get(th); if (p) return p;
    const t = TH[th] || TH.vila; p = {};
    for (const k in t) if (Array.isArray(t[k])) p[k] = t[k].map(c => pk(c));
    if (t.moss) p.moss = pk(t.moss);
    PC.set(th, p);
    return p;
  }
  const mixP = (a, b, t) => { // mistura duas cores empacotadas
    const r = ((a & 255) * (1 - t) + (b & 255) * t) | 0, g = (((a >>> 8) & 255) * (1 - t) + ((b >>> 8) & 255) * t) | 0, bb = (((a >>> 16) & 255) * (1 - t) + ((b >>> 16) & 255) * t) | 0;
    return ((255 << 24) | (bb << 16) | (g << 8) | r) >>> 0;
  };
  const darkP = (a, t) => mixP(a, 0xff140a0a, Math.max(0, Math.min(1, t)));
  const withA = (c, a) => (((a & 255) << 24) | (c & 0xffffff)) >>> 0;

  // ------------------------- ruído rápido -------------------------
  const NT = 256, ntab = new Float32Array(NT * NT);
  { const r = G.mulberry32(777); for (let i = 0; i < ntab.length; i++) ntab[i] = r(); }
  function nz(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const x0 = xi & 255, y0 = yi & 255, x1 = (x0 + 1) & 255, y1 = (y0 + 1) & 255;
    const a = ntab[y0 * NT + x0], b = ntab[y0 * NT + x1], c = ntab[y1 * NT + x0], d = ntab[y1 * NT + x1];
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  const fbm = (x, y) => nz(x, y) * 0.55 + nz(x * 2.03 + 17, y * 2.03 + 31) * 0.3 + nz(x * 4.1 + 5, y * 4.1 + 9) * 0.15;
  const hsh = (x, y) => { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  G.fastNoise = nz; G.fastFbm = fbm; G.hsh = hsh;

  // ------------------------------------------------------------------
  //  Pintura de pixels por tipo de terreno (X,Y = pixel de arte no mundo)
  // ------------------------------------------------------------------
  // chão base do bioma (grama, areia, neve, cinza)
  function baseGround(th, P, X, Y, deco) {
    const t = TH[th] || TH.vila, g = P.g;
    const m = fbm(X * 0.022, Y * 0.022);
    if (t.base === 'sand') {
      const rip = Math.sin(X * 0.16 + Y * 0.05 + fbm(X * 0.025, Y * 0.025) * 7);
      let i = rip > 0.93 ? 3 : rip < -0.96 ? 1 : 2;
      const mb = m + G.bayer(X, Y) * 0.06 - 0.03;
      if (mb > 0.7) i = Math.min(3, i + 1); if (mb < 0.3) i = Math.max(1, i - 1);
      const r = hsh(X, Y);
      if (r > 0.992) i = 4; else if (r < 0.006) i = 0;
      if (deco) { const c = decoPx(th, P, X, Y); if (c) return c; }
      return g[i];
    }
    if (t.base === 'snow') {
      const mb = m + G.bayer(X, Y) * 0.05 - 0.025;
      let i = mb > 0.7 ? 4 : mb > 0.3 ? 3 : 2;
      const s = nz(X * 0.11, Y * 0.11); if (s < 0.18 && i > 2) i--;
      if (hsh(X, Y) > 0.994) i = 4;
      if (deco) { const c = decoPx(th, P, X, Y); if (c) return c; }
      return g[i];
    }
    if (t.base === 'ash') {
      let i = m > 0.6 ? 3 : m < 0.38 ? 1 : 2;
      const cr = Math.abs(fbm(X * 0.035 + 40, Y * 0.035) - 0.5);
      if (cr < 0.006) return g[0];
      const r = hsh(X, Y);
      if (r > 0.996) return P.deco[0]; if (r > 0.985) i = 4; else if (r < 0.01) i = 0;
      if (deco) { const c = decoPx(th, P, X, Y); if (c) return c; }
      return g[i];
    }
    // Planalto do Viés: fendas violeta finas e brilhantes na terra "distorcida"
    if (th === 'castelo') { const f = Math.abs(fbm(X * 0.028 + 71, Y * 0.028) - 0.5); if (f < 0.005) return pk(f < 0.002 ? '#d08aff' : '#7a3aa8'); }
    // grama: manchas suaves com pontilhado na transição
    const bd = G.bayer(X, Y) * 0.06 - 0.03;
    let i = m + bd > 0.66 ? 3 : m + bd < 0.3 ? 1 : 2;
    const fine = nz(X * 0.15, Y * 0.15);
    if (fine > 0.8 && i < 3) i++;
    // tufos em V
    const cx = Math.floor(X / 9), cy = Math.floor(Y / 8), r = hsh(cx, cy);
    if (r < 0.55) {
      const bx = cx * 9 + 2 + Math.floor(hsh(cx + 7, cy) * 5), by = cy * 8 + 5;
      const dx = X - bx, dy = Y - by;
      if (dy === 0 && dx === 0) return g[Math.max(0, i - 2)];
      if (dy === -1 && (dx === -1 || dx === 1)) return g[Math.max(0, i - 1)];
      if (dy === -2 && (dx === -2 || dx === 2)) return g[Math.min(4, i + 1)];
    }
    const s = hsh(X, Y);
    if (s > 0.993) i = 4; else if (s < 0.007) i = 0;
    if (deco) { const c = decoPx(th, P, X, Y); if (c) return c; }
    return g[i];
  }
  // flores, pedrinhas e afins (variação GROUND2)
  function decoPx(th, P, X, Y) {
    const cx = Math.floor(X / 11), cy = Math.floor(Y / 11), r = hsh(cx * 3 + 1, cy * 5 + 2);
    if (r > 0.45) return 0;
    const fx = cx * 11 + 3 + Math.floor(hsh(cx, cy + 9) * 5), fy = cy * 11 + 3 + Math.floor(hsh(cx + 4, cy) * 5);
    const dx = X - fx, dy = Y - fy, t = TH[th] || TH.vila;
    const col = P.deco[Math.floor(hsh(cx + 2, cy + 3) * P.deco.length)];
    if (t.base === 'grass' && th !== 'castelo') { // flor de 5 pétalas
      if (dx === 0 && dy === 0) return pk('#ffe24a');
      if ((Math.abs(dx) === 1 && dy === 0) || (Math.abs(dy) === 1 && dx === 0)) return col;
      if (dy === 2 && dx === 0) return P.g[0];
      return 0;
    }
    // pedrinha / cristal / osso
    if (dy === 0 && (dx === 0 || dx === 1)) return P.deco[1];
    if (dy === -1 && dx === 0) return P.deco[0];
    if (dy === 1 && (dx === 0 || dx === 1)) return darkP(P.g[1], 0.3);
    return 0;
  }
  // terra / estrada
  function dirtPx(th, P, X, Y) {
    const p = P.p, m = fbm(X * 0.04 + 90, Y * 0.04) + G.bayer(X, Y) * 0.06 - 0.03;
    let i = m > 0.68 ? 3 : m < 0.3 ? 1 : 2;
    const r = hsh(X, Y); if (r > 0.985) i = 4; else if (r < 0.015) i = 0;
    // pedrinhas
    const cx = Math.floor(X / 7), cy = Math.floor(Y / 7), q = hsh(cx + 11, cy + 13);
    if (q < 0.16) {
      const bx = cx * 7 + 2 + Math.floor(hsh(cx, cy) * 3), by = cy * 7 + 2 + Math.floor(hsh(cy, cx) * 3);
      const dx = X - bx, dy = Y - by;
      if (dx >= 0 && dx <= 1 && dy >= 0 && dy <= 1) return dx + dy === 0 ? p[4] : dx + dy === 2 ? p[0] : p[3];
      if (dy === 2 && (dx === 0 || dx === 1)) return p[0];
    }
    return p[i];
  }
  // paralelepípedos (praça)
  function cobblePx(th, P, X, Y) {
    const c = P.cob;
    const row = Math.floor(Y / 11), off = (row & 1) ? 7 : 0;
    const col = Math.floor((X + off) / 14);
    const lx = (X + off) - col * 14, ly = Y - row * 11;
    if (lx === 0 || ly === 0) return c[0];
    const tone = hsh(col, row);
    let i = tone > 0.66 ? 3 : tone < 0.25 ? 1 : 2;
    if (lx === 1 || ly === 1) i = Math.min(4, i + 1);
    if (lx === 13 || ly === 10) i = Math.max(0, i - 1);
    if ((lx === 1 && ly === 1) || (lx === 13 && ly === 10) || (lx === 1 && ly === 10) || (lx === 13 && ly === 1)) return c[0];
    if (hsh(X, Y) > 0.985) i = Math.max(0, i - 1);
    return c[i];
  }
  // gelo
  function icePx(X, Y, base) {
    const d = ((X - Y * 0.6) % 46 + 46) % 46;
    const m = nz(X * 0.05, Y * 0.05);
    let c = base || pk('#c4e2f4');
    if (m > 0.62) c = pk('#d6ecfa');
    if (d < 1.2 || (d > 4 && d < 4.8)) c = pk('#f4fbff');
    const cr = Math.abs(fbm(X * 0.04 + 7, Y * 0.04) - 0.5);
    if (cr < 0.008) c = pk('#9ac4e0');
    if (hsh(X, Y) > 0.996) c = 0xffffffff;
    return c;
  }

  // ------------------------------------------------------------------
  //  Distâncias às bordas (para transições)
  // ------------------------------------------------------------------
  // vizinhos: [N, NE, E, SE, S, SW, W, NW]; diff[i] = vizinho "diferente"
  function edgeDist(lx, ly, diff) {
    let d = 99;
    if (diff[0]) d = Math.min(d, ly + 0.5);
    if (diff[4]) d = Math.min(d, 31.5 - ly);
    if (diff[6]) d = Math.min(d, lx + 0.5);
    if (diff[2]) d = Math.min(d, 31.5 - lx);
    if (diff[7]) d = Math.min(d, Math.hypot(lx + 0.5, ly + 0.5));
    if (diff[1]) d = Math.min(d, Math.hypot(31.5 - lx, ly + 0.5));
    if (diff[3]) d = Math.min(d, Math.hypot(31.5 - lx, 31.5 - ly));
    if (diff[5]) d = Math.min(d, Math.hypot(lx + 0.5, 31.5 - ly));
    return d;
  }
  const NB = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
  // chão cujas quinas viram curva quando a água as cerca (cantos internos de lagos e rios)
  const CARVE = new Set([T.GROUND, T.GROUND2, T.PATH, T.TREE]);
  const RC = 18;
  // vértices do tile: posição e os 3 vizinhos que o tocam (diagonal, ortogonal, ortogonal)
  const VTX = [[0, 0, 7, 0, 6], [32, 0, 1, 0, 2], [32, 32, 3, 2, 4], [0, 32, 5, 4, 6]];
  // distância de (x, y) a um tile vizinho deslocado (ox, oy), com raio por quina [NW, NE, SE, SW]
  function sdTile(x, y, ox, oy, rad) {
    const px = x - 16 - 32 * ox, py = y - 16 - 32 * oy;
    const r = px < 0 ? (py < 0 ? rad[0] : rad[3]) : (py < 0 ? rad[1] : rad[2]);
    const qx = Math.abs(px) - 16 + r, qy = Math.abs(py) - 16 + r;
    return Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - r;
  }
  // a quina de terra no vértice v está recortada? (só ela é terra ali e os outros dois tiles são água)
  function cutAt(n, isLand, v) {
    const [, , a, b, c] = VTX[v], land = [a, b, c].filter(k => isLand(n[k]));
    return land.length === 1 && CARVE.has(n[land[0]]) && [a, b, c].every(k => k === land[0] || n[k] === T.WATER) ? land[0] : -1;
  }
  // distância à margem: cantos convexos da água arredondados (raio R) e quinas de terra recortadas (raio Rc).
  // O que só depende dos vizinhos é montado uma vez por tile; devolve d(lx, ly) para cada pixel.
  function shoreFn(n, isLand, R = 13, Rc = 0) {
    const diff = n.map(isLand), land = [];
    for (let k = 0; k < 8; k++) if (diff[k]) land.push({ k, ox: NB[k][0], oy: NB[k][1], rad: [0, 0, 0, 0] });
    if (Rc) for (let v = 0; v < 4; v++) {
      const k = cutAt(n, isLand, v); if (k < 0) continue;
      const [vx, vy] = VTX[v], [ox, oy] = NB[k], sx = vx > 16 + 32 * ox, sy = vy > 16 + 32 * oy;
      land.find(l => l.k === k).rad[sx ? (sy ? 2 : 1) : (sy ? 3 : 0)] = Rc;
    }
    const cNW = diff[0] && diff[6], cNE = diff[0] && diff[2], cSE = diff[4] && diff[2], cSW = diff[4] && diff[6];
    return (lx, ly) => {
      const x = lx + 0.5, y = ly + 0.5, x2 = 32 - x, y2 = 32 - y;
      let d = 99;
      for (const l of land) { const s = sdTile(x, y, l.ox, l.oy, l.rad); if (s < d) d = s; }
      if (cNW && x < R && y < R) d = Math.min(d, R - Math.hypot(R - x, R - y));
      if (cNE && x2 < R && y < R) d = Math.min(d, R - Math.hypot(R - x2, R - y));
      if (cSE && x2 < R && y2 < R) d = Math.min(d, R - Math.hypot(R - x2, R - y2));
      if (cSW && x < R && y2 < R) d = Math.min(d, R - Math.hypot(R - x, R - y2));
      return d;
    };
  }
  // tile de terra com quinas recortadas pela água: raios [NW, NE, SE, SW] ou null
  function landCuts(id, n) {
    if (!CARVE.has(id)) return null;
    const rad = [0, 1, 2, 3].map(v => VTX[v].slice(2).every(k => n[k] === T.WATER) ? RC : 0);
    return rad.some(r => r) ? rad : null;
  }
  const isShoreLand = v => !isWaterish(v) && v !== T.BRIDGE;
  // margem irregular: quanto a terra avança sobre a água
  const bankW = (X, Y) => 1.2 + fbm(X * 0.07 + 3, Y * 0.07) * 5;
  // faixas da margem (de dentro da terra para o fundo): chão, barranco molhado, espuma, raso claro, raso
  function shoreBand(d, th, P, X, Y, ground) {
    if (d >= 19.4) return 0; // além da faixa mais larga possível (banco 6,2 + raso 11 + onda 2,2): água funda, sem ruído
    const b = bankW(X, Y), w = nz(X * 0.12, Y * 0.12) * 2.2;
    if (d < b) return ground || baseGround(th, P, X, Y);
    if (d < b + 1.3) return darkP(ground || baseGround(th, P, X, Y), 0.42);
    if (d < b + 2.3 + w * 0.3) return withA(pk('#ffffff'), 200);
    if (d < b + 4.5 + w) return withA(pk('#e8fbff'), 95);
    if (d < b + 11 + w) return withA(P.w[2], 58);
    return 0;
  }
  // o ponto (px lógicos) está na parte funda da água? (a queda acompanha o desenho da margem)
  G.inDeepWater = (px, py) => {
    const m = G.map; if (!m) return true;
    const tx = Math.floor(px / 16), ty = Math.floor(py / 16), id = m.get(tx, ty);
    if (id !== T.WATER) return true;
    const n = NB.map(([dx, dy]) => m.get(tx + dx, ty + dy)), dun = m.kind === 'dungeon';
    const lx = Math.floor((px - tx * 16) * 2), ly = Math.floor((py - ty * 16) * 2);
    const d = (dun ? shoreFn(n, v => !isWaterish(v), 9) : shoreFn(n, isShoreLand, 16, RC))(lx, ly);
    return dun ? d >= 1.5 : d >= bankW(tx * 32 + lx, ty * 32 + ly) + 1.3;
  };

  const isPathLike = id => id === T.PATH || id === T.BRIDGE || id === T.SEAL;
  const isWaterish = id => id === T.WATER || id === T.LAVA;

  // ------------------------------------------------------------------
  //  Renderização de um tile para o buffer do chunk
  // ------------------------------------------------------------------
  function renderTile(buf, bw, ox, oy, map, tx, ty) {
    const id = map.get(tx, ty);
    const th = map.themeAt(tx, ty), t = TH[th] || TH.vila, P = pal(th);
    const n = NB.map(([dx, dy]) => map.get(tx + dx, ty + dy));
    const X0 = tx * 32, Y0 = ty * 32;
    const put = (lx, ly, c) => {
      if (!c) return;
      const i = (oy + ly) * bw + ox + lx, a = c >>> 24, d = buf[i];
      if (a === 255 || !(d >>> 24)) { buf[i] = c; return; }
      const k = a / 255, r = ((c & 255) * k + (d & 255) * (1 - k)) | 0, g = (((c >>> 8) & 255) * k + ((d >>> 8) & 255) * (1 - k)) | 0, b = (((c >>> 16) & 255) * k + ((d >>> 16) & 255) * (1 - k)) | 0;
      buf[i] = ((Math.max(a, d >>> 24) << 24) | (b << 16) | (g << 8) | r) >>> 0;
    };
    if (t.dun) return renderDunTile(map, tx, ty, id, th, t, P, n, put);
    if (id === T.VOID) { for (let ly = 0; ly < 32; ly++) for (let lx = 0; lx < 32; lx++) put(lx, ly, 0xff0a0608); return; }
    const plaza = id === T.PLAZA || (id === T.BLOCK && n.some(v => v === T.PLAZA));
    const cuts = landCuts(id, n);
    // água/lava: vizinhança calculada uma vez por tile
    const lavaDiff = id === T.LAVA ? n.map(v => !isWaterish(v) && v !== T.BRIDGE) : null, shore = id === T.WATER ? shoreFn(n, isShoreLand, 16, RC) : null;
    for (let ly = 0; ly < 32; ly++) for (let lx = 0; lx < 32; lx++) {
      const X = X0 + lx, Y = Y0 + ly;
      let c;
      if (isWaterish(id)) {
        // água/lava: transparente, com margem, espuma e faixa rasa
        if (lavaDiff) {
          const d = edgeDist(lx, ly, lavaDiff), w = nz(X * 0.12, Y * 0.12) * 2.2;
          if (d < 1.4 + w * 0.6) c = pk('#0e0808');
          else if (d < 2.6 + w * 0.7) c = withA(pk('#ff6a1a'), 150);
          else if (d < 4 + w) c = withA(pk('#c03a10'), 70);
          else c = 0;
        } else c = shoreBand(shore(lx, ly), th, P, X, Y); // margem orgânica
        if (c) put(lx, ly, c);
        continue;
      }
      if (id === T.PIT) { c = ly < 6 && !TP[n[0]].pit ? darkP(P.cl[1], ly / 7) : 0xff050308; put(lx, ly, c); continue; }
      if (plaza) c = cobblePx(th, P, X, Y);
      else if (isPathLike(id)) {
        // grama invade a terra com borda irregular
        const diff = n.map(v => !(isPathLike(v) || v === T.PLAZA || isWaterish(v)));
        const d = edgeDist(lx, ly, diff);
        const thr = 2.2 + fbm(X * 0.13, Y * 0.13) * 4.5;
        if (d < thr) { c = baseGround(th, P, X, Y); if (d > thr - 1.3) c = darkP(c, 0.18); }
        else if (d < thr + 1.6) c = darkP(dirtPx(th, P, X, Y), 0.22);
        else c = dirtPx(th, P, X, Y);
      } else if (id === T.ICE) {
        // lago congelado: borda orgânica de neve, aro claro e gelo mais fundo no meio
        const d = edgeDist(lx, ly, n.map(v => v !== T.ICE)), thr = 1.5 + fbm(X * 0.11 + 4, Y * 0.11) * 4;
        if (d < thr) c = baseGround(th, P, X, Y);
        else if (d < thr + 1.5) c = pk('#f2faff');
        else if (d < thr + 3) c = pk('#d4ecfa');
        else c = icePx(X, Y, d > thr + 9 ? pk('#a6cceb') : pk('#bcdcf2'));
      } else c = baseGround(th, P, X, Y, id === T.GROUND2);
      // grama perto da praça: meio-fio
      if (!plaza && !isPathLike(id) && n.some(v => v === T.PLAZA)) {
        const d = edgeDist(lx, ly, n.map(v => v === T.PLAZA));
        if (d < 1.5) c = P.cob[0]; else if (d < 3) c = darkP(c, 0.2);
      }
      if (id !== T.CLIFF) c = cliffShadow(c, n, lx, ly);
      // quina recortada: a água (desenhada por baixo) entra em curva
      if (cuts) { const s = sdTile(lx + 0.5, ly + 0.5, 0, 0, cuts); if (s > 0) c = shoreBand(s, th, P, X, Y, c); }
      put(lx, ly, c);
    }
    // objetos baixos pintados no chão
    switch (id) {
      case T.TREE: treeShadow(put); break;
      case T.BUSH: bushPx(put, th, tx, ty); break;
      case T.ROCK: rockPx(put, P, tx, ty, false); break;
      case T.CRACKED: rockPx(put, P, tx, ty, true); break;
      case T.BARRIER: crystalPx(put); break;
      case T.TALLGRASS: tallGrassPx(put, P, tx, ty); break;
      case T.FENCE: fencePx(put, n); break;
      case T.CLIFF: cliffPx(put, th, P, X0, Y0, n); break;
      case T.BRIDGE: bridgePx(put, tx, ty, n); break;
    }
  }

  function treeShadow(put) {
    for (let ly = 14; ly < 32; ly++) for (let lx = 0; lx < 32; lx++) {
      const dx = (lx + 0.5 - 16) / 15, dy = (ly + 0.5 - 25) / 7;
      if (dx * dx + dy * dy <= 1) put(lx, ly, withA(0x00140a0a, 90));
    }
  }
  // blit de um Paint 32x32 cacheado (com mistura alfa sobre o que já está no buffer)
  function blitP(put, p, getBuf) {
    for (let ly = 0; ly < 32; ly++) for (let lx = 0; lx < 32; lx++) { const c = p.d[ly * 32 + lx]; if (c >>> 24) put(lx, ly, c); }
  }
  const bushCache = new Map();
  function bushPx(put, th, tx, ty) {
    const v = (hsh(tx, ty) * 3) | 0, key = th + v;
    let p = bushCache.get(key);
    if (!p) {
      p = new G.Paint(32, 32);
      const B = (TH[th] || TH.vila).bu;
      const blobs = [[10, 17, 7.5], [22, 17, 7.5], [16, 12, 8], [16, 20, 9]];
      const r2 = G.mulberry32(v * 31 + 7);
      for (const [x, y, r] of blobs) p.ell(x + r2() * 2 - 1, y + r2() * 2 - 1, r, r * 0.92, { ramp: B, ambient: 0.35, dither: 0.6 });
      for (let i = 0; i < 26; i++) { const x = 5 + r2() * 22, y = 6 + r2() * 20; if (p.alphaAt(x | 0, y | 0) > 200) p.px(x, y, r2() < 0.5 ? B[4] : B[1]); }
      p.outline({ k: -0.7 });
      bushCache.set(key, p);
    }
    shadowEll(put, 16, 27, 13, 4.5);
    blitP(put, p);
  }
  function shadowEll(put, cx, cy, rx, ry) { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy <= 1 && x >= 0 && y >= 0 && x < 32 && y < 32) put(x, y, SHADOWPX); } }
  const SHADOWPX = 0x50140a0a;
  const rockCache = new Map();
  function rockPx(put, P, tx, ty, cracked) {
    const v = (hsh(tx + 3, ty) * 3) | 0, key = P.ro.join() + v + cracked;
    let p = rockCache.get(key);
    if (!p) {
      p = new G.Paint(32, 32);
      const ro = cracked ? ['#4a3a2e', '#6e5a48', '#927a62', '#b49c80', '#d4c0a4'] : P.ro.map(c => G.col.toHex(c & 255, (c >>> 8) & 255, (c >>> 16) & 255));
      const r2 = G.mulberry32(v * 13 + 5);
      const pts = []; for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; const rr = 11 + r2() * 2.5; pts.push([16 + Math.cos(a) * rr, 17 + Math.sin(a) * rr * 0.82]); }
      p.litMask(G.artTools.inPoly(pts), { ramp: ro, radius: 7, ambient: 0.3 }, [2, 3, 30, 30]);
      if (cracked) {
        const cr = '#2a1a10';
        p.line(15, 8, 13, 14, cr); p.line(13, 14, 17, 19, cr); p.line(17, 19, 14, 25, cr); p.line(17, 19, 22, 21, cr); p.line(13, 14, 9, 15, cr);
      } else { p.px(11, 10, ro[4]); p.px(12, 10, ro[4]); p.px(11, 11, ro[4]); }
      p.outline({ k: -0.72 });
      rockCache.set(key, p);
    }
    shadowEll(put, 16, 27, 13, 4);
    blitP(put, p);
  }
  let crystalP = null;
  function crystalPx(put) {
    if (!crystalP) {
      const p = new G.Paint(32, 32);
      const R = ['#1a3a6a', '#3a8ac0', '#7ae4ff', '#c8f4ff', '#ffffff'];
      const shard = (cx, by, w, h, lean) => {
        const pts = [[cx - w, by], [cx + w, by], [cx + w * 0.6 + lean, by - h * 0.75], [cx + lean, by - h], [cx - w * 0.6 + lean, by - h * 0.75]];
        const m = G.artTools.inPoly(pts);
        p.mask(m, (x, y) => { const u = (x + 0.5 - (cx + lean * (by - y) / h)) / w; return u < -0.25 ? R[3] : u < 0.15 ? R[2] : u < 0.6 ? R[1] : R[0]; }, G.artTools.bboxOf(pts));
      };
      shard(8, 28, 4, 17, -2); shard(24, 28, 4, 15, 2); shard(16, 29, 5.5, 25, 0); shard(12, 30, 3, 10, -1); shard(21, 30, 3, 9, 1);
      p.px(15, 9, '#ffffff'); p.px(15, 10, '#ffffff'); p.px(7, 15, '#ffffff'); p.px(23, 17, '#ffffff');
      p.outline({ color: '#0e1e3a' });
      crystalP = p;
    }
    shadowEll(put, 16, 28, 14, 3.5);
    blitP(put, crystalP);
  }
  function tallGrassPx(put, P, tx, ty) {
    const g = P.g;
    for (let i = 0; i < 9; i++) {
      const bx = 2 + ((i * 3.4 + hsh(tx + i, ty) * 3) | 0), h = 7 + ((hsh(tx, ty + i) * 6) | 0), by = 20 + ((i * 5) % 11);
      for (let k = 0; k < h; k++) {
        const x = bx + Math.round(Math.sin(k * 0.35 + i) * (k / h) * 2), y = by - k;
        if (y < 0 || y > 31 || x < 0 || x > 31) continue;
        put(x, y, k > h - 3 ? g[4] : k > h / 2 ? g[3] : g[1]);
        if (k < 3) put(Math.min(31, x + 1), y, g[0]);
      }
    }
  }
  const WOOD = ['#3a2410', '#6a4020', '#9a6434', '#c8904a', '#e8b870'].map(c => G.col.pack(c));
  function fencePx(put, n) {
    const wood = WOOD;
    const h = n[2] === T.FENCE || n[6] === T.FENCE, v = n[0] === T.FENCE || n[4] === T.FENCE;
    const post = (x0) => { for (let y = 6; y < 30; y++) for (let x = x0; x < x0 + 6; x++) put(x, y, x === x0 || y === 6 ? wood[0] : x === x0 + 1 ? wood[4] : x === x0 + 5 ? wood[1] : wood[3]); for (let x = x0 + 1; x < x0 + 5; x++) put(x, 29, wood[1]); };
    if (h || !v) {
      for (const ry of [10, 19]) for (let y = ry; y < ry + 5; y++) for (let x = 0; x < 32; x++) put(x, y, y === ry ? wood[0] : y === ry + 1 ? wood[4] : y === ry + 4 ? wood[0] : wood[2]);
      post(3); post(23);
    }
    if (v) {
      for (let y = 0; y < 32; y++) for (let x = 12; x < 20; x++) put(x, y, x === 12 || x === 19 ? wood[0] : x === 13 ? wood[4] : wood[2]);
      post(13);
    }
  }
  // penhasco: topo (planalto) ou face (paredão). O paredão ocupa quase o tile inteiro, com
  // estratos, rachaduras e base escura; a beirada de cima é clara (neve no gelo) e as laterais
  // têm luz à esquerda e sombra à direita, para o relevo ser lido de longe.
  function cliffPx(put, th, P, X0, Y0, n) {
    const cl = P.cl, t = TH[th] || TH.vila, snow = t.base === 'snow', magma = th === 'vulcao';
    const face = n[4] !== T.CLIFF, l = n[6] !== T.CLIFF, r = n[2] !== T.CLIFF, top = n[0] !== T.CLIFF;
    const F0 = 5; // primeira linha do paredão
    for (let ly = 0; ly < 32; ly++) for (let lx = 0; lx < 32; lx++) {
      const X = X0 + lx, Y = Y0 + ly;
      let c;
      if (face && ly >= F0) {
        const s = fbm(X * 0.07, Y * 0.22);
        let i = s > 0.6 ? 3 : s < 0.38 ? 1 : 2;
        if (((Y + Math.floor(nz(X * 0.05, 3) * 6)) % 8) === 0) i = Math.max(0, i - 1); // estratos
        if (Math.abs(nz(X * 0.18 + 3, Y * 0.03) - 0.5) < 0.035) i = 0; // rachaduras verticais
        const v = (ly - F0) / (32 - F0); if (v > 0.72) i = Math.max(0, i - 1); if (v > 0.9) i = 0; // base na sombra
        c = cl[i];
        if (i >= 2 && hsh(X, Y) > 0.97) c = cl[3];
        // beirada: neve que escorre (gelo) ou rocha clara
        const drip = snow ? 3 + nz(X * 0.35, 7) * 5 + (hsh(X, 1) > 0.9 ? 4 : 0) : 1.5 + nz(X * 0.3, 7) * 1.5;
        if (ly - F0 < drip) c = ly - F0 < drip - 1 ? cl[4] : snow ? pk('#b8c8e0') : cl[3];
        // vulcão: veios de magma no paredão
        if (magma && Math.abs(nz(X * 0.11 + 5, Y * 0.09) - 0.5) < 0.018 && ly > F0 + 3) c = Math.abs(nz(X * 0.11 + 5, Y * 0.09) - 0.5) < 0.008 ? pk('#ffb040') : pk('#c8401a');
      } else {
        const rockT = () => { const rr = fbm(X * 0.08, Y * 0.08) + G.bayer(X, Y) * 0.08 - 0.04; let k = rr > 0.62 ? cl[3] : rr < 0.38 ? cl[1] : cl[2]; if (Math.abs(nz(X * 0.1 + 9, Y * 0.1) - 0.5) < 0.025) k = cl[0]; if (hsh(X, Y) > 0.98) k = cl[3]; return k; };
        if (t.base === 'grass' || snow) {
          // topo do planalto: rocha com manchas de neve/grama, para não se confundir com o chão
          const cov = fbm(X * 0.07 + 13, Y * 0.07) + (snow ? 0.14 : 0.04);
          c = cov > 0.52 ? baseGround(th, P, X, Y) : rockT();
          if (cov > 0.5 && cov <= 0.55) c = darkP(c, 0.18);
        } else c = rockT();
        if (face && ly >= F0 - 2) c = mixP(c, cl[4], 0.55); // aresta da frente iluminada
      }
      const inFace = face && ly >= F0;
      // laterais: luz à esquerda, sombra à direita (3 px), com contorno
      if (r && lx > 28) c = darkP(c, (inFace ? 0.25 : 0.2) + (lx - 28) * 0.08);
      if (l && lx < 3 && !inFace) c = mixP(c, cl[4], 0.25 - lx * 0.07);
      if (l && lx < 1) c = cl[0]; if (r && lx > 30) c = cl[0];
      // borda de trás do planalto: contorno escuro com brilho logo abaixo
      if (top && !inFace) { if (ly < 1) c = cl[0]; else if (ly < 3) c = mixP(c, cl[4], 0.35); }
      put(lx, ly, c);
    }
  }
  // sombra que o penhasco projeta no chão logo abaixo e dos lados
  function cliffShadow(c, n, lx, ly) {
    if (n[0] === T.CLIFF && ly < 10) c = darkP(c, 0.42 * (1 - ly / 10));
    if (n[6] === T.CLIFF && lx < 5) c = darkP(c, 0.18 * (1 - lx / 5));
    if (n[2] === T.CLIFF && lx > 26) c = darkP(c, 0.26 * ((lx - 26) / 5));
    return c;
  }
  function bridgePx(put, tx, ty, n) {
    const wv = TP[n[0]].water || TP[n[4]].water, wh = TP[n[6]].water || TP[n[2]].water;
    const horiz = wv && !wh; // atravessa leste-oeste
    const wood = ['#2a1808', '#5a3818', '#8a5a2a', '#b07a3a', '#d0a060'].map(pk);
    for (let ly = 0; ly < 32; ly++) for (let lx = 0; lx < 32; lx++) {
      const a = horiz ? lx : ly, b = horiz ? ly : lx;
      let c;
      if (b < 3 || b > 28) c = (b === 0 || b === 31) ? wood[0] : (b === 1 || b === 30) ? wood[3] : wood[1];
      else {
        const plank = Math.floor((horiz ? tx * 32 + a : ty * 32 + a) / 6), la = (horiz ? tx * 32 + a : ty * 32 + a) % 6;
        const tone = hsh(plank, 3);
        c = la === 5 ? wood[0] : la === 0 ? wood[4] : tone > 0.6 ? wood[3] : wood[2];
        if (la > 0 && la < 5 && ((b + plank * 5) % 11 === 0)) c = wood[1];
        if ((b === 6 || b === 25) && la === 2) c = wood[0];
      }
      put(lx, ly, c);
    }
  }

  // ------------------------------------------------------------------
  //  Masmorras
  // ------------------------------------------------------------------
  const RWt = 24, RHt = 13;
  const isWallT = v => v === T.WALL || v === T.CRACKED || v === T.VOID;
  function renderDunTile(map, tx, ty, id, th, t, P, n, put) {
    const X0 = tx * 32, Y0 = ty * 32;
    const f = P.f, wl = P.wl;
    const lxR = tx % RWt, lyR = ty % RHt;
    if (id === T.VOID) { for (let ly = 0; ly < 32; ly++) for (let lx = 0; lx < 32; lx++) put(lx, ly, 0xff050308); return; }
    if (id === T.WALL || id === T.CRACKED) {
      const face = !isWallT(n[4]);
      const floorUp = !isWallT(n[0]), floorL = !isWallT(n[6]), floorR = !isWallT(n[2]);
      for (let ly = 0; ly < 32; ly++) for (let lx = 0; lx < 32; lx++) {
        const X = X0 + lx, Y = Y0 + ly;
        let c;
        if (face) c = wallFacePx(t, P, X, Y, lx, ly, tx);
        else {
          c = wl[1];
          if (t.wall !== 'cave') { const bx = X & 15, by = Y & 15, tn = hsh(X >> 4, Y >> 4); c = tn > 0.5 ? wl[1] : mixP(wl[1], wl[2], 0.35); if (bx === 0 || by === 0) c = wl[0]; else if (bx === 1 || by === 1) c = mixP(c, wl[2], 0.5); }
          if (t.wall === 'cave') { const s = fbm(X * 0.1, Y * 0.1); c = s > 0.6 ? wl[2] : s < 0.35 ? wl[0] : wl[1]; }
          if (floorUp && ly < 3) c = ly === 0 ? wl[0] : wl[3];
          if (floorL && lx < 3) c = lx === 0 ? wl[0] : wl[3];
          if (floorR && lx > 28) c = lx === 31 ? wl[0] : wl[2];
        }
        put(lx, ly, c);
      }
      if (id === T.CRACKED) {
        const cr = 0xff0a0606;
        const segs = [[[16, 6], [14, 11]], [[14, 11], [18, 15]], [[18, 15], [13, 20]], [[13, 20], [17, 26]], [[18, 15], [24, 17]], [[14, 11], [8, 13]], [[13, 20], [9, 22]]];
        for (const [a, b] of segs) lineBuf(put, a, b, cr);
      }
      return;
    }
    const lavaDiff = id === T.LAVA ? n.map(v => !isWaterish(v)) : null, shore = id === T.WATER ? shoreFn(n, v => !isWaterish(v), 9) : null;
    for (let ly = 0; ly < 32; ly++) for (let lx = 0; lx < 32; lx++) {
      const X = X0 + lx, Y = Y0 + ly;
      let c = floorPx(t, P, X, Y, id, lx, ly, n);
      if (id === T.ICE) c = icePx(X, Y, f[3]);
      if (id === T.PIT) c = ly < 7 && !TP[n[0]].pit ? darkP(wl[2], ly / 8) : 0xff030206;
      if (isWaterish(id)) {
        const d = lavaDiff ? edgeDist(lx, ly, lavaDiff) : shore(lx, ly);
        const w = nz(X * 0.12, Y * 0.12) * 2;
        const lava = id === T.LAVA;
        if (d < 1.5 + w * 0.5) c = lava ? 0xff080a0e : darkP(f[1], 0.4);
        else if (d < 2.6 + w * 0.6) c = lava ? withA(pk('#ff6a1a'), 150) : withA(0xffffffff, 170);
        else if (d < 6 + w) c = lava ? withA(pk('#c03a10'), 50) : withA(P.w[2], 60);
        else c = 0;
        put(lx, ly, c);
        continue;
      }
      if (id !== T.PIT) {
        const wn = isWallT(n[0]), ww = isWallT(n[6]), we = isWallT(n[2]);
        if (wn && ly < 10) c = darkP(c, (10 - ly) / 10 * 0.5);
        if (ww && lx < 5) c = darkP(c, (5 - lx) / 5 * 0.3);
        if (we && lx > 26) c = darkP(c, (lx - 26) / 5 * 0.3);
        if (lyR === 0 || lyR === RHt - 1 || lxR === 0 || lxR === RWt - 1) {
          const k = lyR === 0 ? 1 - ly / 32 : lyR === RHt - 1 ? ly / 32 : lxR === 0 ? 1 - lx / 32 : lx / 32;
          c = darkP(c, 0.15 + k * 0.55);
        }
      }
      put(lx, ly, c);
    }
    if (id === T.STAIRS) stairsPx(put, P);
    if (id === T.BARRIER) crystalPx(put);
  }
  function lineBuf(put, a, b, c) { const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1])); for (let i = 0; i <= n; i++) { const x = Math.round(a[0] + (b[0] - a[0]) * i / n), y = Math.round(a[1] + (b[1] - a[1]) * i / n); if (x >= 0 && y >= 0 && x < 32 && y < 32) { put(x, y, c); if (x + 1 < 32) put(x + 1, y, c); } } }
  function stairsPx(put, P) {
    const f = P.f;
    for (let ly = 0; ly < 32; ly++) for (let lx = 0; lx < 32; lx++) {
      const step = Math.floor(ly / 6);
      let c = darkP(f[2], 0.15 + step * 0.17);
      if (ly % 6 === 0) c = darkP(f[3], step * 0.12);
      if (ly % 6 === 5) c = darkP(f[0], 0.3 + step * 0.1);
      put(lx, ly, c);
    }
  }
  function wallFacePx(t, P, X, Y, lx, ly, tx) {
    const wl = P.wl;
    if (ly < 5) return ly === 0 ? wl[0] : ly < 3 ? wl[2] : wl[3];
    if (ly > 28) return ly === 31 ? wl[0] : wl[1];
    const style = t.wall;
    if (style === 'cave') {
      const s = fbm(X * 0.09, Y * 0.12);
      let c = s > 0.62 ? wl[3] : s > 0.48 ? wl[2] : s > 0.34 ? wl[1] : wl[0];
      if (Math.abs(nz(X * 0.2, Y * 0.05) - 0.5) < 0.04) c = wl[0];
      return c;
    }
    if (style === 'roots') {
      const plank = Math.floor(X / 10), la = X % 10;
      let c = la === 0 ? wl[0] : la === 1 ? wl[3] : (hsh(plank, 3) > 0.5 ? wl[2] : mixP(wl[2], wl[1], 0.5));
      if (((Y + plank * 7) % 13) === 0 && la > 1) c = wl[1];
      const root = Math.abs(Math.sin(X * 0.11 + Math.sin(Y * 0.2) * 1.5) * 18 - ((Y % 32) - 5)) < 1.4 && nz(X * 0.03, 1) > 0.45;
      if (root) c = pk('#4a6a24');
      return c;
    }
    let bw = 16, bh = 8;
    if (style === 'blocks') { bw = 32; bh = 12; }
    if (style === 'ice') { bw = 12; bh = 8; }
    if (style === 'castle') { bw = 14; bh = 7; }
    const yy = ly - 5;
    const row = Math.floor(yy / bh), off = (row & 1) ? bw / 2 : 0;
    const col = Math.floor((X + off) / bw), bx = (X + off) - col * bw, by = yy - row * bh;
    if (by === 0 || bx === 0) return wl[0];
    const tone = hsh(col, row);
    let i = tone > 0.65 ? 3 : tone < 0.3 ? 1 : 2;
    if (by === 1) i = Math.min(4, i + 1);
    if (by === bh - 1) i = Math.max(0, i - 1);
    let c = wl[i];
    if (style === 'bricks' && nz(X * 0.07, Y * 0.07) > 0.68 && by > 2) c = mixP(c, P.moss, 0.55);
    if (style === 'blocks' && by > 3 && by < 9 && bx > 6 && bx < 26 && hsh(col, row + 50) > 0.7) { if (((bx * 3 + by * 7) % 11) < 2) c = wl[0]; }
    if (style === 'ice') { if (((bx + by) % 9) === 0) c = wl[4]; if (by > bh - 3 && hsh(X, 9) > 0.7) c = wl[4]; }
    if (style === 'castle') {
      const bpos = ((X % 192) + 192) % 192;
      if (bpos >= 80 && bpos < 100 && ly > 6 && ly < 28) {
        const u = bpos - 80;
        const tip = ly > 22 && Math.abs(u - 9.5) > (28 - ly) * 2;
        if (!tip) c = (u < 2 || u > 17) ? pk('#5a0a1a') : (ly < 9 ? pk('#ffd23a') : (u > 7 && u < 12 && ly > 12 && ly < 19 ? pk('#ffd23a') : pk('#a81a3a')));
      }
    }
    return c;
  }
  function floorPx(t, P, X, Y, id, lx, ly, n) {
    const f = P.f;
    const style = t.floor;
    if (id === T.CARPET) return carpetPx(P, lx, ly, n);
    let c;
    if (style === 'planks') {
      const row = Math.floor(Y / 8), ly8 = Y % 8;
      const len = 24 + Math.floor(hsh(row, 1) * 24), off = Math.floor(hsh(row, 2) * len);
      const col = Math.floor((X + off) / len), lx8 = (X + off) % len;
      const tone = hsh(col, row);
      c = ly8 === 0 ? f[0] : ly8 === 1 ? f[3] : tone > 0.6 ? f[2] : mixP(f[2], f[1], 0.5);
      if (lx8 === 0) c = f[0];
      if (ly8 > 1 && ((X * 3 + row * 11) % 17 === 0)) c = f[1];
      if (hsh(col, row + 9) > 0.93 && ly8 === 4 && lx8 > 8 && lx8 < 11) c = f[0];
    } else if (style === 'cave') {
      const s = fbm(X * 0.05, Y * 0.05), s2 = nz(X * 0.2, Y * 0.2);
      c = s > 0.6 ? f[3] : s > 0.45 ? f[2] : f[1];
      if (s2 > 0.82) c = f[3]; if (s2 < 0.12) c = f[0];
      if (Math.abs(fbm(X * 0.04 + 9, Y * 0.04) - 0.5) < 0.01) c = pk('#6a2a10');
    } else if (style === 'sand') {
      const lx16 = X % 32, ly16 = Y % 32;
      const tone = hsh(Math.floor(X / 32), Math.floor(Y / 32));
      c = tone > 0.5 ? f[2] : mixP(f[2], f[3], 0.4);
      if (lx16 === 0 || ly16 === 0) c = f[0];
      else if (lx16 === 1 || ly16 === 1) c = f[3];
      const sand = fbm(X * 0.03, Y * 0.03);
      if (sand > 0.6) c = mixP(c, f[4], Math.min(1, (sand - 0.6) * 4));
      if (Math.abs(nz(X * 0.07, Y * 0.07) - 0.5) < 0.008 && lx16 > 1 && ly16 > 1) c = f[1];
    } else if (style === 'checker') {
      const cx = Math.floor(X / 16), cy = Math.floor(Y / 16), lx16 = X % 16, ly16 = Y % 16;
      const dark = (cx + cy) & 1;
      c = dark ? f[1] : f[3];
      if (lx16 === 0 || ly16 === 0) c = f[0];
      if (((lx16 - ly16 + 32) % 16) < 2 && !dark && lx16 > 2 && ly16 > 2) c = f[4];
      if (nz(X * 0.03, Y * 0.03) > 0.7) c = mixP(c, f[2], 0.3);
    } else if (style === 'ice') {
      const lx16 = X % 16, ly16 = Y % 16;
      c = (lx16 === 0 || ly16 === 0) ? f[1] : f[3];
      if (((X - Y) % 23 + 23) % 23 < 2) c = f[4];
      if (nz(X * 0.06, Y * 0.06) > 0.66) c = mixP(c, f[4], 0.4);
    } else {
      const lx16 = X & 31, ly16 = Y & 31, sx = X >> 5, sy = Y >> 5;
      const tone = hsh(sx, sy);
      c = tone > 0.75 ? mixP(f[2], f[3], 0.5) : tone < 0.25 ? mixP(f[2], f[1], 0.5) : f[2];
      const sm = nz(X * 0.09, Y * 0.09); if (sm > 0.7) c = mixP(c, f[3], 0.35); else if (sm < 0.25) c = mixP(c, f[1], 0.35);
      if (lx16 === 0 || ly16 === 0) c = f[0];
      else if (lx16 === 1 || ly16 === 1) c = f[3];
      else if (lx16 === 31 || ly16 === 31) c = f[1];
      // placa rachada ocasional
      if (tone > 0.9 && lx16 > 2 && ly16 > 2 && Math.abs((lx16 - 4) * 0.7 - ly16 + 6 + Math.sin(lx16 * 0.6) * 2) < 0.6) c = f[0];
      // musgo só em manchas pequenas
      if (nz(X * 0.05 + 50, Y * 0.05) > 0.8 && hsh(X, Y) > 0.35) c = mixP(c, P.moss, 0.45);
    }
    if (id === T.FLOOR2) {
      const d = Math.abs(lx + 0.5 - 16) + Math.abs(ly + 0.5 - 16);
      if (d < 5) c = d < 3 ? pk(t.acc) : f[4];
      else if (d < 6) c = f[0];
      else if (d > 10 && d < 12) c = f[4];
      else if (d >= 12 && d < 13) c = f[0];
    }
    if (hsh(X, Y) > 0.992) c = f[4];
    return c;
  }
  function carpetPx(P, lx, ly, n) {
    const ca = P.ca;
    const m = (n[0] !== T.CARPET ? 1 : 0) | (n[4] !== T.CARPET ? 2 : 0) | (n[6] !== T.CARPET ? 4 : 0) | (n[2] !== T.CARPET ? 8 : 0);
    if (((m & 4) && lx === 0) || ((m & 8) && lx === 31) || ((m & 1) && ly === 0) || ((m & 2) && ly === 31)) return darkP(ca[0], 0.5);
    const edge = ((m & 4) && lx < 4) || ((m & 8) && lx > 27) || ((m & 1) && ly < 4) || ((m & 2) && ly > 27);
    const edge2 = ((m & 4) && lx < 6) || ((m & 8) && lx > 25) || ((m & 1) && ly < 6) || ((m & 2) && ly > 25);
    if (edge) return ((lx + ly) & 3) === 0 ? darkP(ca[1], 0.3) : ca[1];
    if (edge2) return darkP(ca[0], 0.35);
    const pat = Math.abs((lx % 16) - 8) + Math.abs((ly % 16) - 8);
    if (pat === 5) return mixP(ca[0], ca[1], 0.45);
    return ((lx + ly) % 2 === 0) ? ca[0] : darkP(ca[0], 0.08);
  }

  // ------------------------------------------------------------------
  //  Gerenciador de chunks
  // ------------------------------------------------------------------
  const CHT = 16, CPX = CHT * 32; // tiles por chunk, pixels de arte por chunk
  G.ground = {
    map: null, chunks: new Map(), animTiles: new Map(),
    reset(map) { this.map = map; this.chunks.clear(); this.job = null; this.scanAnim(); },
    scanAnim() {
      const m = this.map; this.animTiles = new Map();
      for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) { const a = this.animId(tx, ty); if (a) this.animTiles.set(ty * m.w + tx, a); }
    },
    // textura animada sob o tile: água/lava/selo, ou água sob a quina de terra recortada
    animId(tx, ty) {
      const m = this.map, id = m.get(tx, ty);
      if (id === T.WATER || id === T.LAVA || id === T.SEAL) return id;
      if (!CARVE.has(id) || (TH[m.themeAt(tx, ty)] || TH.vila).dun) return 0;
      return landCuts(id, NB.map(([dx, dy]) => m.get(tx + dx, ty + dy))) ? T.WATER : 0;
    },
    key(cx, cy) { return cy * 1000 + cx; },
    // um chunk em montagem: os tiles são pintados um a um no buffer e o canvas só é preenchido no fim
    makeJob(cx, cy) {
      const c = G.canvas(CPX, CPX), x = c.getContext('2d'), img = x.createImageData(CPX, CPX);
      return { cx, cy, c, x, img, buf: new Uint32Array(img.data.buffer), i: 0 };
    },
    // pinta tiles do job até acabar (ou até o prazo, em ms de performance.now); devolve true quando completo
    runJob(j, until) {
      const m = this.map, tx0 = j.cx * CHT, ty0 = j.cy * CHT;
      while (j.i < CHT * CHT) {
        if (until && performance.now() >= until) return false;
        const tx = tx0 + (j.i % CHT), ty = ty0 + ((j.i / CHT) | 0); j.i++;
        if (tx < m.w && ty < m.h) renderTile(j.buf, CPX, (tx - tx0) * 32, (ty - ty0) * 32, m, tx, ty);
      }
      return true;
    },
    finishJob(j) {
      j.x.putImageData(j.img, 0, 0);
      const ch = { c: j.c, x: j.x, cx: j.cx, cy: j.cy };
      this.chunks.set(this.key(j.cx, j.cy), ch);
      if (this.chunks.size > 48) { const first = this.chunks.keys().next().value; this.chunks.delete(first); }
      return ch;
    },
    // montagem imediata (chunk já visível); aproveita o que a pré-montagem já pintou
    build(cx, cy) {
      let j = this.job;
      if (j && j.cx === cx && j.cy === cy) this.job = null; else j = this.makeJob(cx, cy);
      this.runJob(j);
      return this.finishJob(j);
    },
    get(cx, cy) { return this.chunks.get(this.key(cx, cy)) || this.build(cx, cy); },
    retile(tx, ty) {
      if (!this.map) return;
      this.job = null; // a pré-montagem em curso pode ter pintado o tile antigo: recomeça depois
      for (let y = ty - 1; y <= ty + 1; y++) for (let x = tx - 1; x <= tx + 1; x++) {
        if (x < 0 || y < 0 || x >= this.map.w || y >= this.map.h) continue;
        const ch = this.chunks.get(this.key(Math.floor(x / CHT), Math.floor(y / CHT)));
        if (!ch) continue;
        const img = ch.x.createImageData(32, 32), buf = new Uint32Array(img.data.buffer);
        renderTile(buf, 32, 0, 0, this.map, x, y);
        ch.x.putImageData(img, (x - ch.cx * CHT) * 32, (y - ch.cy * CHT) * 32);
      }
      for (let y = ty - 1; y <= ty + 1; y++) for (let x = tx - 1; x <= tx + 1; x++) {
        if (x < 0 || y < 0 || x >= this.map.w || y >= this.map.h) continue;
        const a = this.animId(x, y), k = y * this.map.w + x;
        if (a) this.animTiles.set(k, a); else this.animTiles.delete(k);
      }
    },
    // pré-monta os chunks vizinhos aos poucos: no máximo ~budget ms por quadro, sem travar o jogo
    idle(budget = 2.5) {
      if (!this.map || !G.player) return;
      const until = performance.now() + budget;
      while (performance.now() < until) {
        if (!this.job) {
          const next = this.nextMissing(); if (!next) return;
          this.job = this.makeJob(next[0], next[1]);
        }
        if (!this.runJob(this.job, until)) return;
        const j = this.job; this.job = null;
        if (!this.chunks.has(this.key(j.cx, j.cy))) this.finishJob(j);
      }
    },
    // próximo chunk ainda não montado perto do herói (anel de raio 1, depois 2)
    nextMissing() {
      const m = this.map, nx = Math.ceil(m.w / CHT), ny = Math.ceil(m.h / CHT);
      const pcx = Math.floor(G.player.cx / 256), pcy = Math.floor(G.player.cy / 256);
      for (let r = 1; r <= 2; r++) for (let cy = pcy - r; cy <= pcy + r; cy++) for (let cx = pcx - r; cx <= pcx + r; cx++) {
        if (cx < 0 || cy < 0 || cx >= nx || cy >= ny) continue;
        if (!this.chunks.has(this.key(cx, cy))) return [cx, cy];
      }
      return null;
    },
    draw(ctx, camx, camy) {
      const m = this.map; if (!m) return;
      const tx0 = Math.floor(camx / 16), ty0 = Math.floor(camy / 16), tx1 = tx0 + Math.ceil(G.W / 16) + 1, ty1 = ty0 + Math.ceil(G.H / 16) + 1;
      const wf = Math.floor(G.time * 6) % 8, lf = Math.floor(G.time * 5) % 8;
      const seals = [];
      for (let ty = Math.max(0, ty0); ty <= Math.min(m.h - 1, ty1); ty++) for (let tx = Math.max(0, tx0); tx <= Math.min(m.w - 1, tx1); tx++) {
        const id = this.animTiles.get(ty * m.w + tx);
        if (!id) continue;
        if (id === T.SEAL) { seals.push([tx, ty]); continue; }
        const tex = id === T.LAVA ? lavaFrames()[lf] : waterFrames(m.themeAt(tx, ty))[wf];
        ctx.drawImage(tex, (tx * 32) % 64, (ty * 32) % 64, 32, 32, tx * 16 - camx, ty * 16 - camy, 16, 16);
      }
      const c0x = Math.floor(camx / 256), c0y = Math.floor(camy / 256), c1x = Math.floor((camx + G.W) / 256), c1y = Math.floor((camy + G.H) / 256);
      for (let cy = Math.max(0, c0y); cy <= c1y; cy++) for (let cx = Math.max(0, c0x); cx <= c1x; cx++) {
        if (cx * CHT >= m.w || cy * CHT >= m.h) continue;
        const ch = this.get(cx, cy);
        ctx.drawImage(ch.c, cx * 256 - camx, cy * 256 - camy, 256, 256);
      }
      for (const [tx, ty] of seals) drawSeal(ctx, tx * 16 - camx, ty * 16 - camy, tx);
    }
  };

  // texturas animadas de água (64x64 contínuas)
  const WCACHE = new Map();
  function waterFrames(th) {
    let fr = WCACHE.get(th);
    if (fr) return fr;
    const w = (TH[th] && TH[th].w) || TH.vila.w;
    const cols = [G.col.shade(w[0], -0.15), w[0], w[1], w[2], w[3]].map(pk);
    fr = [];
    for (let f = 0; f < 8; f++) {
      const p = new G.Paint(64, 64);
      const ph = f / 8 * Math.PI * 2;
      for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
        const a = Math.sin((x / 64) * Math.PI * 4 + ph * 0.5 + Math.sin((y / 64) * Math.PI * 2) * 1.6);
        const b = Math.sin((y / 64) * Math.PI * 4 - ph * 0.5 + Math.sin((x / 64) * Math.PI * 2 + ph * 0.5) * 1.2);
        const v = a * 0.5 + b * 0.5;
        let c = cols[2];
        if (v < -0.55) c = cols[1];
        if (v > 0.72 && ((x + y) & 1)) c = mixP(cols[2], cols[3], 0.5);
        p.d[y * 64 + x] = c;
      }
      // ondinhas: traços horizontais que piscam e deslizam
      for (let k = 0; k < 14; k++) {
        const cx0 = (k * 23 + 7) % 64, cy0 = (k * 37 + 11) % 64, phase = k * 0.9;
        const vis = Math.sin(ph + phase);
        if (vis < 0.1) continue;
        const len = vis > 0.7 ? 6 : 4, xs = cx0 + Math.round(Math.sin(ph * 0.5 + phase) * 2);
        for (let i = 0; i < len; i++) {
          const x = (xs + i + 64) % 64;
          p.d[cy0 * 64 + x] = (i > 0 && i < len - 1 && vis > 0.6) ? cols[4] : cols[3];
          p.d[((cy0 + 1) % 64) * 64 + x] = cols[1];
        }
      }
      fr.push(p.toCanvas(32, 32));
    }
    WCACHE.set(th, fr);
    return fr;
  }
  // "lava" = campo de crosta de magma: placas de basalto escuras e rachaduras incandescentes
  // que pulsam devagar (dá para andar por cima com o Traje Térmico; sem ele, o calor queima)
  let LAVA = null;
  function lavaFrames() {
    if (LAVA) return LAVA;
    const rock = ['#140c0c', '#22161a', '#2e2024', '#3c2a2c', '#4e3834'].map(pk), glow = ['#5a1206', '#9a2a0a', '#e0561a', '#ff9a3a', '#ffe08a'].map(pk);
    // células de Voronoi que se repetem a cada 64 pixels (sementes fixas)
    const r = G.mulberry32(4242), S = []; for (let i = 0; i < 9; i++) S.push([r() * 64, r() * 64, r()]);
    const cell = new Float32Array(64 * 64 * 3);
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
      let d1 = 1e9, d2 = 1e9, id = 0;
      for (const [sx, sy, sh] of S) for (let oy = -64; oy <= 64; oy += 64) for (let ox = -64; ox <= 64; ox += 64) {
        const d = Math.hypot(x + 0.5 - sx - ox, y + 0.5 - sy - oy);
        if (d < d1) { d2 = d1; d1 = d; id = sh; } else if (d < d2) d2 = d;
      }
      const k = (y * 64 + x) * 3; cell[k] = d2 - d1; cell[k + 1] = id; cell[k + 2] = d1;
    }
    LAVA = [];
    for (let f = 0; f < 8; f++) {
      const p = new G.Paint(64, 64), ph = f / 8 * Math.PI * 2;
      for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
        const k = (y * 64 + x) * 3, seam = cell[k], id = cell[k + 1], d1 = cell[k + 2];
        const pulse = 0.5 + 0.5 * Math.sin(ph + id * 6.28 + (x + y) * 0.09);
        let c;
        if (seam < 1.6) c = glow[Math.min(4, 2 + Math.round(pulse * 2 - seam * 0.6))]; // fenda acesa
        else if (seam < 3) c = glow[seam < 2.3 ? 1 : 0]; // brilho na borda da placa
        else {
          // placa: mais clara no alto à esquerda (relevo), textura de rocha porosa
          let i = 2 + (id > 0.6 ? 1 : id < 0.3 ? -1 : 0);
          if (seam < 4.2) i = Math.max(0, i - 1);
          if (d1 < 6 && seam > 5) i = Math.min(4, i + 1);
          const n = hsh(x * 7 + 1, y * 13 + 5); if (n > 0.93) i = Math.max(0, i - 1); else if (n < 0.04) i = Math.min(4, i + 1);
          c = rock[i];
          // poros que brilham fraco
          if (n > 0.985 && pulse > 0.6) c = glow[1];
        }
        p.d[y * 64 + x] = c;
      }
      LAVA.push(p.toCanvas(32, 32));
    }
    return LAVA;
  }
  G.waterFrames = waterFrames; G.lavaFrames = lavaFrames;
  function drawSeal(ctx, x, y, tx) {
    const t = G.time;
    ctx.fillStyle = '#2a0a4a'; ctx.fillRect(x, y, 16, 16);
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = 'rgba(200,110,255,' + (0.35 + 0.25 * Math.sin(t * 3 + i + tx)).toFixed(2) + ')';
      ctx.fillRect(x, y + ((t * 10 + i * 4) % 16), 16, 1);
    }
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    G.glow(ctx, x + 8, y + 8, 12, '#b060ff', 0.35 + 0.15 * Math.sin(t * 4 + tx));
    ctx.restore();
    ctx.fillStyle = 'rgba(255,220,255,0.8)';
    ctx.fillRect(x + 7, y + 2 + ((t * 2 + tx * 0.7) % 1) * 10, 1, 1);
  }

  // ------------------------------------------------------------------
  //  Objetos altos (árvores, colunas): ordenados com as entidades
  // ------------------------------------------------------------------
  const TALL = new Map();
  function treeSprite(th, v) {
    const key = th + v; let s = TALL.get(key);
    if (s) return s;
    const t = TH[th] || TH.vila, style = t.tree, R = t.tc, Tk = t.trunk;
    const p = new G.Paint(64, 72);
    const rnd = G.mulberry32(v * 977 + th.length * 31);
    const base = 70, cx = 32;
    if (style === 'pine') {
      p.ell(cx, base - 2, 16, 4, 'rgba(10,8,24,0.32)');
      for (let y = base - 10; y < base; y++) for (let x = cx - 3; x <= cx + 3; x++) p.px(x, y, x < cx ? Tk[2] : Tk[1]);
      const tiers = [[base - 8, 20, 18], [base - 22, 16, 16], [base - 34, 12, 14], [base - 44, 7, 11]];
      for (const [by, hw, h] of tiers) {
        const pts = [[cx - hw - rnd() * 2, by], [cx + hw + rnd() * 2, by], [cx + 1, by - h - 4], [cx - 1, by - h - 4]];
        p.mask(G.artTools.inPoly(pts), (x, y) => {
          const u = (x + 0.5 - cx) / hw, vv = (by - y) / h;
          if (vv > 0.62 - Math.abs(u) * 0.3 || (y > by - 3 && ((x + y) % 5 < 2))) return '#f4f8ff';
          return u < -0.35 ? R[3] : u < 0.25 ? R[2] : R[1];
        }, G.artTools.bboxOf(pts));
      }
      p.outline({ k: -0.75 });
    } else if (style === 'cactus') {
      p.ell(cx, base - 2, 12, 3.5, 'rgba(10,8,24,0.3)');
      const arm = (x0, y0, x1, y1, w) => { for (let i = 0; i <= 20; i++) { const x = x0 + (x1 - x0) * i / 20, y = y0 + (y1 - y0) * i / 20; p.ell(x, y, w, w, { ramp: R, ambient: 0.4 }); } };
      arm(cx, base - 2, cx, base - 44, 6);
      arm(cx - 6, base - 22, cx - 14, base - 22, 3.5); arm(cx - 14, base - 22, cx - 14, base - 36, 3.5);
      arm(cx + 6, base - 28, cx + 13, base - 28, 3.5); arm(cx + 13, base - 28, cx + 13, base - 40, 3.5);
      for (let i = 0; i < 18; i++) { const y = base - 6 - i * 2.3, x = cx + (i % 2 ? -3 : 2); p.px(x, y, R[4]); }
      p.outline({ k: -0.75 });
      p.px(cx - 1, base - 51, '#ff6a9a'); p.px(cx, base - 52, '#ff6a9a'); p.px(cx + 1, base - 51, '#ff6a9a');
    } else if (style === 'dead') {
      p.ell(cx, base - 2, 14, 3.5, 'rgba(10,8,24,0.32)');
      const br = (x0, y0, a, len, w, d) => {
        const x1 = x0 + Math.cos(a) * len, y1 = y0 + Math.sin(a) * len;
        for (let i = 0; i <= len; i++) { const x = x0 + (x1 - x0) * i / len, y = y0 + (y1 - y0) * i / len; const ww = w * (1 - i / len * 0.5); for (let k = -ww; k <= ww; k++) p.px(x + k, y, k < -ww * 0.3 ? R[3] : k > ww * 0.4 ? R[1] : R[2]); }
        if (d > 0) { br(x1, y1, a - 0.5 - rnd() * 0.3, len * 0.65, w * 0.6, d - 1); br(x1, y1, a + 0.45 + rnd() * 0.3, len * 0.6, w * 0.6, d - 1); }
      };
      br(cx, base - 2, -Math.PI / 2, 24, 4, 2);
      p.outline({ k: -0.7 });
    } else {
      p.ell(cx, base - 3, 22, 6, 'rgba(10,8,24,0.32)');
      for (let y = base - 18; y < base; y++) for (let x = cx - 5; x <= cx + 5; x++) {
        const u = (x - cx + 5) / 10;
        if (y > base - 4 && (x === cx - 5 || x === cx + 5)) continue;
        let c = u < 0.3 ? Tk[2] : u > 0.7 ? Tk[0] : Tk[1];
        if (((y * 3 + x) % 7) === 0) c = Tk[0];
        p.px(x, y, c);
      }
      p.px(cx - 7, base - 1, Tk[1]); p.px(cx - 6, base - 2, Tk[1]); p.px(cx + 6, base - 1, Tk[0]); p.px(cx + 7, base - 1, Tk[0]);
      const blobs = [];
      const cy0 = base - 34;
      const nB = style === 'willow' ? 6 : 7;
      for (let i = 0; i < nB; i++) {
        const a = i / nB * Math.PI * 2 + rnd() * 0.5;
        blobs.push([cx + Math.cos(a) * (14 + rnd() * 3), cy0 + Math.sin(a) * (10 + rnd() * 3), 10 + rnd() * 3]);
      }
      blobs.push([cx, cy0 - 2, 14]);
      blobs.sort((a, b) => a[1] - b[1]);
      for (const [bx, by, r] of blobs) p.ell(bx, by, r, r * 0.9, { ramp: R, ambient: 0.32, dither: 0.7, contrast: 1.1 });
      for (let i = 0; i < 70; i++) {
        const x = cx + (rnd() * 2 - 1) * 26, y = cy0 + (rnd() * 2 - 1) * 22;
        if (p.alphaAt(x | 0, y | 0) > 200) { const k = rnd(); p.px(x, y, k < 0.35 ? R[4] : k < 0.7 ? R[3] : R[1]); }
      }
      if (style === 'willow') {
        for (let i = 0; i < 12; i++) { const x = cx - 22 + i * 4 + rnd() * 2, y0 = cy0 + 6 + rnd() * 6, len = 12 + rnd() * 10; for (let k = 0; k < len; k++) p.px(x + Math.sin(k * 0.3) * 0.8, y0 + k, k > len - 3 ? R[1] : R[2]); }
      }
      if (style === 'dark') { for (let i = 0; i < 3; i++) p.px(cx - 8 + i * 8, cy0 + 14, '#c080ff'); }
      p.outline({ k: -0.78 });
    }
    s = p.toCanvas();
    TALL.set(key, s);
    return s;
  }
  function pillarSprite(th) {
    const key = 'pil' + th; let s = TALL.get(key);
    if (s) return s;
    const t = TH[th] || TH.d1, wl = t.wl, acc = t.acc || '#ffd23a';
    const p = new G.Paint(32, 64);
    p.ell(16, 61, 14, 3, 'rgba(10,8,20,0.4)');
    G.artTools.cyl(p, G.artTools.inRR(3, 52, 26, 10, 2), wl.slice(0, 5), [2, 51, 30, 63]);
    const shaft = (x, y) => x >= 7 && x <= 24 && y >= 12 && y <= 52;
    G.artTools.cyl(p, shaft, wl.slice(0, 5), [6, 11, 25, 53], { hi: 0.25, sh: 0.6 });
    for (let y = 14; y < 52; y++) for (const x of [11, 16, 21]) if (p.alphaAt(x, y)) p.px(x, y, G.col.shade(wl[1], -0.2));
    G.artTools.cyl(p, G.artTools.inRR(3, 4, 26, 9, 2), wl.slice(0, 5), [2, 3, 30, 14]);
    for (let x = 6; x < 26; x += 3) p.px(x, 8, acc);
    p.outline({ k: -0.7 });
    s = p.toCanvas();
    TALL.set(key, s);
    return s;
  }
  G.tiles = {
    // objetos altos visíveis: [{by, spr, x, y, flip}]
    tallList(m, camx, camy, out) {
      const tx0 = Math.floor(camx / 16) - 1, ty0 = Math.floor(camy / 16) - 1, tx1 = tx0 + Math.ceil(G.W / 16) + 3, ty1 = ty0 + Math.ceil(G.H / 16) + 4;
      for (let ty = Math.max(0, ty0); ty <= Math.min(m.h - 1, ty1); ty++) for (let tx = Math.max(0, tx0); tx <= Math.min(m.w - 1, tx1); tx++) {
        const id = m.get(tx, ty);
        if (id === T.TREE) {
          const th = m.themeAt(tx, ty);
          const s = treeSprite(th, (hsh(tx * 3, ty * 7) * 3) | 0);
          const jx = (hsh(tx, ty + 99) - 0.5) * 3;
          out.push({ tall: true, by: ty * 16 + 16, spr: s, x: tx * 16 + 8 - G.lw(s) / 2 + jx, y: ty * 16 + 16 - G.lh(s) + 1, flip: hsh(ty, tx) > 0.5 });
        } else if (id === T.PILLAR) {
          const s = pillarSprite(m.themeAt(tx, ty));
          out.push({ tall: true, by: ty * 16 + 15, spr: s, x: tx * 16, y: ty * 16 + 16 - G.lh(s) + 2 });
        }
      }
      return out;
    },
    treeSprite, pillarSprite
  };
  G.onTileChanged = (map, tx, ty) => { if (G.ground.map === map) G.ground.retile(tx, ty); };
})(window.G);
