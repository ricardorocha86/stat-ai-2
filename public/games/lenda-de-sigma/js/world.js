'use strict';
// =====================================================================
//  Mundo: mapa, colisão, geração do reino aberto (9 regiões), câmera,
//  mapa estilo Metroid com névoa de guerra.
// =====================================================================
(function (G) {
  const T = G.T, TP = G.TP;
  const RW = 48, RH = 32, COLS = 3, ROWS = 3, MW = RW * COLS, MH = RH * ROWS;
  const REG = [['montanha', 'castelo', 'vulcao'], ['floresta', 'vila', 'lago'], ['pantano', 'planicie', 'deserto']];
  const REGION_INFO = {
    vila: { name: 'Vila Gauss', sub: 'onde tudo começa', music: 'village' },
    lago: { name: 'Lago Bernoulli', sub: 'águas da lei dos grandes números', music: 'field' },
    planicie: { name: 'Campos de Pascal', sub: 'terra das chances', music: 'field' },
    floresta: { name: 'Bosque Sombrio', sub: 'lar da Mediana', music: 'forest' },
    pantano: { name: 'Pântano de Bayes', sub: 'névoa e incerteza', music: 'forest' },
    deserto: { name: 'Deserto da Dispersão', sub: 'areias espalhadas', music: 'desert' },
    vulcao: { name: 'Vulcão do Acaso', sub: 'o fogo dos dados', music: 'volcano' },
    montanha: { name: 'Picos Gaussianos', sub: 'frio de congelar', music: 'snow' },
    castelo: { name: 'Planalto do Viés', sub: 'onde a verdade se distorce', music: 'castle' }
  };
  G.REGION_INFO = REGION_INFO;

  // ------------------------------------------------------------------
  //  Mapa
  // ------------------------------------------------------------------
  class GameMap {
    constructor(id, kind, w, h, fill = T.GROUND) {
      this.id = id; this.kind = kind; this.w = w; this.h = h;
      this.tiles = new Uint8Array(w * h).fill(fill); this.theme = null;
    }
    get(tx, ty) { if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) return T.VOID; return this.tiles[ty * this.w + tx]; }
    set(tx, ty, id) { if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) return; const i = ty * this.w + tx; if (this.tiles[i] === id) return; this.tiles[i] = id; if (G.onTileChanged) G.onTileChanged(this, tx, ty); }
    tileAtPx(px, py) { return this.get(Math.floor(px / 16), Math.floor(py / 16)); }
    themeAt(tx, ty) { return this.kind === 'overworld' ? G.world.biomeAt(tx, ty) : this.theme; }
    markBroken(tx, ty) {
      const P = G.P; if (!P) return;
      const L = P.broken[this.id] = P.broken[this.id] || [];
      const k = ty * this.w + tx; if (!L.includes(k)) L.push(k);
    }
    applyBroken() {
      const L = G.P && G.P.broken[this.id]; if (!L) return;
      for (const k of L) this.tiles[k] = this.kind === 'dungeon' ? T.FLOOR : T.GROUND;
    }
  }
  G.GameMap = GameMap;

  // ------------------------------------------------------------------
  //  Colisão
  // ------------------------------------------------------------------
  G.rectBlocked = (x, y, w, h, ent, o = {}) => {
    const m = G.map;
    const tx0 = Math.floor(x / 16), tx1 = Math.floor((x + w - 0.001) / 16), ty0 = Math.floor(y / 16), ty1 = Math.floor((y + h - 0.001) / 16);
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      const tp = TP[m.get(tx, ty)];
      if (tp.solid) { if (o.low && tp.low) continue; return true; }
      if (o.avoidHazard && tp.hazard) return true;
    }
    if (!o.ghostEnts) {
      for (const e of G.ents) {
        if (e === ent || !e.solid || e.dead || !G.sameRoom(e)) continue;
        if (x < e.x + e.w && x + w > e.x && y < e.y + e.h && y + h > e.y) return true;
      }
    }
    return false;
  };
  G.moveEnt = (e, dx, dy, o = {}) => {
    const res = { hitX: false, hitY: false };
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 4));
    const sx = dx / n, sy = dy / n;
    for (let i = 0; i < n; i++) {
      if (sx) {
        if (!G.rectBlocked(e.x + sx, e.y, e.w, e.h, e, o)) e.x += sx;
        else {
          res.hitX = true;
          if (o.nudge && !sy) for (let k = 1; k <= 6; k++) {
            let done = false;
            for (const s of [-1, 1]) if (!G.rectBlocked(e.x, e.y + s * k, e.w, e.h, e, o) && !G.rectBlocked(e.x + sx, e.y + s * k, e.w, e.h, e, o)) { e.y += s * Math.min(1, k); done = true; break; }
            if (done) break;
          }
        }
      }
      if (sy) {
        if (!G.rectBlocked(e.x, e.y + sy, e.w, e.h, e, o)) e.y += sy;
        else {
          res.hitY = true;
          if (o.nudge && !sx) for (let k = 1; k <= 6; k++) {
            let done = false;
            for (const s of [-1, 1]) if (!G.rectBlocked(e.x + s * k, e.y, e.w, e.h, e, o) && !G.rectBlocked(e.x + s * k, e.y + sy, e.w, e.h, e, o)) { e.x += s * Math.min(1, k); done = true; break; }
            if (done) break;
          }
        }
      }
    }
    return res;
  };

  // ------------------------------------------------------------------
  //  Geração do overworld
  // ------------------------------------------------------------------
  const CONNS = [
    ['vila', 'lago', 'open'], ['vila', 'planicie', 'open'], ['vila', 'floresta', 'jump'], ['vila', 'castelo', 'beam'],
    ['lago', 'vulcao', 'beam'], ['lago', 'deserto', 'bomb'], ['planicie', 'deserto', 'bomb'], ['planicie', 'pantano', 'jump'],
    ['floresta', 'pantano', 'open'], ['floresta', 'montanha', 'open'], ['castelo', 'vulcao', 'open']
  ];
  const WALLSTYLE = { vila: T.TREE, lago: T.TREE, planicie: T.TREE, floresta: T.TREE, pantano: T.TREE, deserto: T.CLIFF, vulcao: T.CLIFF, montanha: T.CLIFF, castelo: T.CLIFF };
  const ENEMIES = {
    vila: [['gosma', {}], ['cogumau', {}]],
    lago: [['gosma', {}], ['cuspidor', {}], ['cogumau', {}], ['moeda', {}]],
    planicie: [['cogumau', {}], ['gosma', {}], ['cuspidor', {}], ['dado', {}]],
    floresta: [['cogumau', { tier: 1.3 }], ['morcego', {}], ['gosma', { tier: 1.3 }], ['aranha', {}], ['outlier', {}]],
    pantano: [['gosma', { variant: '_swamp', tier: 1.5 }], ['morcego', { tier: 1.3 }], ['aranha', { tier: 1.3 }], ['ruido', { tier: 1.3 }]],
    deserto: [['escorpiao', {}], ['gosma', { variant: '_sand', tier: 1.6 }], ['cuspidor', { tier: 1.6 }], ['dado', { tier: 1.5 }]],
    vulcao: [['chama', {}], ['morcego', { tier: 2 }], ['esqueleto', { tier: 1.5 }], ['moeda', { tier: 2 }]],
    montanha: [['lobo', {}], ['gosma', { variant: '_ice', tier: 2.2 }], ['morcego', { tier: 2.2 }], ['barras', { tier: 2 }]],
    castelo: [['esqueleto', { tier: 2 }], ['fantasma', {}], ['cavaleiro', {}], ['pizza', { tier: 2 }], ['outlier', { tier: 2 }]]
  };

  function regionOf(name) { for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (REG[r][c] === name) return { c, r, ox: c * RW, oy: r * RH }; return null; }

  function generate() {
    const rnd = G.mulberry32(20261016);
    const map = new GameMap('overworld', 'overworld', MW, MH, T.GROUND);
    const N = MW * MH, idx = (x, y) => y * MW + x;
    const wall = new Uint8Array(N), block = new Uint8Array(N), prot = new Uint8Array(N);
    const objects = [], nodes = {}; // nodes[regionName] = [[tx,ty], ...]
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) nodes[REG[r][c]] = [];
    const inMap = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH;
    const protect = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (inMap(x, y)) prot[idx(x, y)] = 1; };
    const setT = (x, y, t) => map.set(x, y, t);

    // 1) bordas do mapa e entre regiões (com espessura orgânica)
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      const lx = x % RW, ly = y % RH;
      let d = Math.min(lx, RW - 1 - lx, ly, RH - 1 - ly);
      if (x < 2 || y < 2 || x >= MW - 2 || y >= MH - 2) { wall[idx(x, y)] = 1; continue; }
      const extra = Math.floor(G.fbm(x * 0.2, y * 0.2, 5) * 4);
      if (d <= extra) wall[idx(x, y)] = 1;
    }
    // 2) lago (região lago)
    {
      const R = regionOf('lago');
      const cx = R.ox + 27, cy = R.oy + 16;
      for (let y = R.oy + 3; y < R.oy + RH - 3; y++) for (let x = R.ox + 8; x < R.ox + RW - 3; x++) {
        const n = G.fbm(x * 0.25, y * 0.25, 9) * 0.35;
        const dx = (x - cx) / 13, dy = (y - cy) / 8.5;
        if (dx * dx + dy * dy < 1 + n - 0.15 && !wall[idx(x, y)]) setT(x, y, T.WATER);
      }
      // ilha com segredo (precisa pular)
      for (let y = cy - 1; y <= cy + 1; y++) for (let x = cx + 4; x <= cx + 6; x++) { setT(x, y, T.GROUND); prot[idx(x, y)] = 1; }
      // (a ilha guarda a tumba de Jacob Bernoulli: manuscritos.js)
      // píer: de oeste até 2 tiles da ilha
      let px = cx + 1;
      while (px > R.ox + 8 && map.get(px, cy) === T.WATER) px--;
      for (let x = px; x <= cx + 1; x++) { setT(x, cy, T.BRIDGE); prot[idx(x, cy)] = 1; }
      nodes.lago.push([px - 1, cy]);
    }
    // 3) passagens
    const passages = [];
    for (const [a, b, kind] of CONNS) {
      const A = regionOf(a), B = regionOf(b);
      let p;
      if (A.r === B.r) { // borda vertical
        const left = A.c < B.c ? A : B, right = left === A ? B : A;
        const bx = right.ox; // primeira coluna da região da direita
        const y0 = left.oy + 11 + Math.floor(rnd() * 9);
        for (let y = y0; y <= y0 + 2; y++) for (let x = bx - 7; x <= bx + 6; x++) { wall[idx(x, y)] = 0; }
        for (let y = y0; y <= y0 + 2; y++) for (let x = bx - 7; x <= bx + 6; x++) { setT(x, y, T.PATH); prot[idx(x, y)] = 1; }
        p = { kind, vertical: true, bx, y0 };
        nodes[REG[left.r][left.c]].push([bx - 7, y0 + 1]);
        nodes[REG[right.r][right.c]].push([bx + 6, y0 + 1]);
      } else {
        const top = A.r < B.r ? A : B, bot = top === A ? B : A;
        const by = bot.oy;
        const x0 = top.ox + 16 + Math.floor(rnd() * 14);
        for (let y = by - 7; y <= by + 6; y++) for (let x = x0; x <= x0 + 2; x++) { wall[idx(x, y)] = 0; setT(x, y, T.PATH); prot[idx(x, y)] = 1; }
        p = { kind, vertical: false, by, x0 };
        nodes[REG[top.r][top.c]].push([x0 + 1, by - 7]);
        nodes[REG[bot.r][bot.c]].push([x0 + 1, by + 6]);
      }
      passages.push(p);
    }

    // 4) estruturas e pontos de interesse
    const ST = Object.assign({ house_red: [3, 3], house_blue: [3, 3], house_green: [3, 3], house_gauss: [4, 3], shop: [4, 3], clinic: [4, 3], casino: [4, 3], barn: [4, 3], hut: [3, 3], tent: [3, 3], igloo: [3, 3], well: [2, 2], temple_d1: [4, 3], temple_d2: [4, 3], temple_d3: [4, 3], cave: [4, 3], tower: [3, 5], castle: [8, 6], galton: [2, 2], coinStatue: [2, 2], snowman: [1, 2], grave: [1, 1], lamp: [1, 2], dock: [3, 1] }, G.EXTRA_STRUCTS || {});
    function struct(reg, name, lx, ly, o = {}) {
      const R = regionOf(reg), tx = R.ox + lx, ty = R.oy + ly, [w, h] = ST[name];
      for (let y = ty; y < ty + h; y++) for (let x = tx; x < tx + w; x++) { block[idx(x, y)] = 1; wall[idx(x, y)] = 0; setT(x, y, T.BLOCK); }
      const m = o.margin !== undefined ? o.margin : 1;
      protect(tx - m, ty - m, tx + w - 1 + m, ty + h + m);
      objects.push({ type: 'deco', name, x: tx * 16, y: ty * 16 });
      const doorX = tx + Math.floor((w - 1) / 2);
      if (o.door) {
        const dcols = w === 4 ? [tx + 1, tx + 2] : w === 8 ? [tx + 3, tx + 4] : [tx + Math.floor(w / 2)];
        for (const x of dcols) { block[idx(x, ty + h - 1)] = 0; setT(x, ty + h - 1, T.PATH); }
        objects.push({ type: 'warp', x: dcols[0] * 16, y: (ty + h - 1) * 16, w: dcols.length * 16, h: 10, to: o.door });
      }
      if (o.node !== false) nodes[reg].push([doorX, ty + h + 1]);
      return { tx, ty, w, h, doorX, front: [doorX, ty + h] };
    }
    function clearing(reg, lx, ly, w, h, tile = null, node = true) {
      const R = regionOf(reg), tx = R.ox + lx, ty = R.oy + ly;
      for (let y = ty; y < ty + h; y++) for (let x = tx; x < tx + w; x++) { prot[idx(x, y)] = 1; wall[idx(x, y)] = 0; if (tile !== null) setT(x, y, tile); }
      if (node) nodes[reg].push([tx + Math.floor(w / 2), ty + Math.floor(h / 2)]);
    }
    const at = (reg, lx, ly) => { const R = regionOf(reg); return [(R.ox + lx) * 16, (R.oy + ly) * 16]; };
    const obj = (reg, lx, ly, o) => {
      const [x, y] = at(reg, lx, ly); objects.push(Object.assign({ x, y }, o));
      const tx = x / 16, ty = y / 16;
      if (o.type !== 'chest' && o.type !== 'qblock') {
        const big = o.type === 'pipe' || o.type === 'save' || o.type === 'zone';
        for (let yy = ty - 1; yy <= ty + (big ? 2 : 1); yy++) for (let xx = tx - 1; xx <= tx + (big ? 2 : 1); xx++) if (inMap(xx, yy) && !block[idx(xx, yy)]) { prot[idx(xx, yy)] = 1; wall[idx(xx, yy)] = 0; if (map.get(xx, yy) !== T.PLAZA && map.get(xx, yy) !== T.BRIDGE && map.get(xx, yy) !== T.WATER) setT(xx, yy, T.GROUND); }
        if (o.type === 'npc' || o.type === 'save' || o.type === 'pipe' || o.type === 'oracle' || o.type === 'zone') nodes[reg].push([tx, ty + 1]);
      }
    };
    // recinto secreto: anel de pedras com uma entrada especial
    function enclosure(reg, lx, ly, gateTile, contents, flag) {
      const R = regionOf(reg), cx = R.ox + lx, cy = R.oy + ly;
      if (gateTile === T.LAVA) {
        for (let y = cy - 4; y <= cy + 4; y++) for (let x = cx - 4; x <= cx + 4; x++) {
          wall[idx(x, y)] = 0; prot[idx(x, y)] = 1; block[idx(x, y)] = 1;
          setT(x, y, Math.max(Math.abs(x - cx), Math.abs(y - cy)) >= 2 ? T.LAVA : T.GROUND);
        }
        nodes[reg].push([cx, cy + 5]); protect(cx - 1, cy + 5, cx + 1, cy + 6);
        objects.push({ type: 'chest', x: cx * 16, y: cy * 16, flag, contents });
        return;
      }
      for (let y = cy - 2; y <= cy + 2; y++) for (let x = cx - 2; x <= cx + 2; x++) {
        wall[idx(x, y)] = 0; prot[idx(x, y)] = 1;
        const ring = Math.abs(x - cx) === 2 || Math.abs(y - cy) === 2;
        if (ring) { block[idx(x, y)] = 1; setT(x, y, T.CLIFF); } else setT(x, y, T.GROUND);
      }
      {
        setT(cx, cy + 2, gateTile); // entrada (rachada, cristal...)
        nodes[reg].push([cx, cy + 3]); protect(cx - 1, cy + 3, cx + 1, cy + 4);
      }
      objects.push({ type: 'chest', x: cx * 16, y: cy * 16, flag, contents });
    }
    const qrow = (reg, lx, ly, list, prefix) => list.forEach((c, i) => obj(reg, lx + i, ly, { type: 'qblock', flag: prefix + i, contents: c }));

    // ---------------- VILA GAUSS ----------------
    clearing('vila', 11, 10, 26, 13, T.PLAZA);
    struct('vila', 'house_red', 12, 6, { node: false });
    const gHouse = struct('vila', 'house_gauss', 17, 6, { node: false });
    struct('vila', 'shop', 23, 6, { node: false });
    struct('vila', 'clinic', 30, 6, { node: false });
    struct('vila', 'well', 23, 15, { node: false, margin: 0 });
    struct('vila', 'house_blue', 13, 23, { node: false });
    struct('vila', 'house_green', 31, 23, { node: false });
    obj('vila', 18, 9, { type: 'npc', spr: 'gauss', name: 'Mestre Gauss', script: 'gauss', marker: 'talkGauss' });
    obj('vila', 24, 9, { type: 'npc', spr: 'mendel', name: 'Seu Mendel', script: 'mendel' });
    obj('vila', 31, 9, { type: 'npc', spr: 'florence', name: 'Florence', script: 'florence' });
    obj('vila', 15, 16, { type: 'npc', spr: 'kid1', name: 'Tico', script: 'kid1', wander: true });
    obj('vila', 30, 18, { type: 'npc', spr: 'kid2', name: 'Lia', script: 'kid2', wander: true });
    obj('vila', 27, 13, { type: 'npc', spr: 'villager1', name: 'Seu Quirino', script: 'villager1' });
    obj('vila', 13, 13, { type: 'npc', spr: 'villager2', name: 'Dona Amélia', script: 'villager2', wander: true });
    obj('vila', 20, 19, { type: 'save', id: 'vila' });
    obj('vila', 34, 19, { type: 'pipe', id: 'vila', name: 'Vila Gauss' });
    obj('vila', 26, 9, { type: 'sign', text: '^yLOJA DO MENDEL^0\nPoções, bombas e equipamentos. Pague com moedas!' });
    obj('vila', 29, 9, { type: 'sign', text: '^yENFERMARIA DA FLORENCE^0\nCura gratuita e aulas sobre gráficos.' });
    struct('vila', 'temple_d1', 37, 4, { door: 'd1' });
    obj('vila', 36, 8, { type: 'sign', text: '^gTEMPLO DA MÉDIA^0\n"Onde os números encontram seu equilíbrio."' });
    clearing('vila', 5, 26, 9, 3, null);
    qrow('vila', 6, 27, ['coin', 'coins', 'mushroom', 'coins', 'coin'], 'ow_vila_q');
    enclosure('vila', 6, 6, T.CRACKED, { type: 'heartPiece' }, 'ow_vila_hp');
    obj('vila', 41, 17, { type: 'oracle', flag: 'ow_vila_oracle', topic: 'media', lv: 1, reward: 'potion' });
    obj('vila', 9, 13, { type: 'sign', text: 'Oeste: ^gBosque Sombrio^0. O riacho é largo demais para atravessar andando...' });
    obj('vila', 28, 8, { type: 'sign', text: 'Norte: ^pPlanalto do Viés^0. Uma barreira de cristal bloqueia o caminho.' });

    // ---------------- LAGO BERNOULLI ----------------
    struct('lago', 'coinStatue', 10, 5);
    obj('lago', 10, 7, { type: 'zone', w: 32, h: 8, script: 'bernoulli' });
    obj('lago', 12, 8, { type: 'sign', text: '^yESTÁTUA DE BERNOULLI^0\n"Lance a moeda muitas vezes e verás a verdade."' });
    clearing('lago', 4, 18, 5, 4, null);
    obj('lago', 5, 19, { type: 'npc', spr: 'bernoulli', name: 'Pescador Neyman', script: 'neyman' });
    obj('lago', 7, 26, { type: 'save', id: 'lago' });
    obj('lago', 36, 27, { type: 'pipe', id: 'lago', name: 'Lago Bernoulli' });
    obj('lago', 40, 4, { type: 'npc', spr: 'villager1', name: 'Viajante', script: 'traveler_lago' });

    // ---------------- CAMPOS DE PASCAL ----------------
    struct('planicie', 'barn', 6, 4);
    { // cercado das ovelhas
      const R = regionOf('planicie'); const x0 = R.ox + 5, y0 = R.oy + 10, x1 = R.ox + 19, y1 = R.oy + 19;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        wall[idx(x, y)] = 0; prot[idx(x, y)] = 1;
        const edge = x === x0 || x === x1 || y === y0 || y === y1;
        if (edge && !(y === y1 && x >= x0 + 6 && x <= x0 + 8)) { setT(x, y, T.FENCE); block[idx(x, y)] = 1; } else setT(x, y, T.GROUND);
      }
      nodes.planicie.push([x0 + 7, y1 + 2]);
      objects.push({ type: 'sheepPen', x: (x0 + 1) * 16, y: (y0 + 1) * 16, w: (x1 - x0 - 1) * 16, h: (y1 - y0 - 1) * 16 });
    }
    obj('planicie', 14, 21, { type: 'npc', spr: 'fisher', name: 'Fazendeiro Fisher', script: 'fisher' });
    struct('planicie', 'casino', 30, 6);
    obj('planicie', 31, 9, { type: 'npc', spr: 'pascal', name: 'Pascal', script: 'pascal' });
    obj('planicie', 29, 9, { type: 'sign', text: '^pCASSINO DE PASCAL^0\nJogos de dados! Aprenda sobre o ^yvalor esperado^0... ou perca suas moedas.' });
    clearing('planicie', 20, 24, 10, 3, null);
    qrow('planicie', 21, 25, ['coin', 'coins', 'star', 'coins', 'coin', 'coin', 'bombs', 'coin'], 'ow_plan_q');
    obj('planicie', 38, 20, { type: 'save', id: 'planicie' });
    obj('planicie', 40, 14, { type: 'pipe', id: 'planicie', name: 'Campos de Pascal' });

    // ---------------- BOSQUE SOMBRIO ----------------
    struct('floresta', 'temple_d2', 10, 5, { door: 'd2' });
    obj('floresta', 9, 9, { type: 'sign', text: '^gBOSQUE DA MEDIANA^0\n"No meio de tudo, encontra-se o caminho."' });
    struct('floresta', 'hut', 30, 19);
    obj('floresta', 31, 22, { type: 'npc', spr: 'laplace', name: 'Eremita Laplace', script: 'laplace' });
    clearing('floresta', 17, 25, 7, 4, T.GROUND2);
    obj('floresta', 20, 26, { type: 'qblock', flag: 'ow_flor_q', contents: 'star' });
    obj('floresta', 6, 24, { type: 'save', id: 'floresta' });
    obj('floresta', 24, 13, { type: 'pipe', id: 'floresta', name: 'Bosque Sombrio' });
    obj('floresta', 36, 13, { type: 'sign', text: 'Norte: ^cPicos Gaussianos^0. ^rPERIGO: frio extremo!^0 Não vá sem proteção.' });

    // ---------------- PÂNTANO DE BAYES ----------------
    clearing('pantano', 21, 12, 7, 5, T.GROUND2);
    obj('pantano', 24, 13, { type: 'npc', spr: 'bayes', name: 'Sábio Bayes', script: 'bayes' });
    { // ilhota com fragmento (pular)
      const R = regionOf('pantano'), cx = R.ox + 9, cy = R.oy + 23;
      for (let y = cy - 3; y <= cy + 3; y++) for (let x = cx - 3; x <= cx + 3; x++) { wall[idx(x, y)] = 0; prot[idx(x, y)] = 1; block[idx(x, y)] = 1; setT(x, y, (Math.abs(x - cx) <= 1 && Math.abs(y - cy) <= 1) ? T.GROUND : T.WATER); }
      objects.push({ type: 'chest', x: cx * 16, y: cy * 16, flag: 'ow_pant_hp', contents: { type: 'heartPiece' } });
      protect(cx - 1, cy - 6, cx + 1, cy - 4); nodes.pantano.push([cx, cy - 5]);
      setT(cx, cy - 4, T.GROUND);
      for (let x = cx - 1; x <= cx + 1; x++) setT(x, cy - 4, T.GROUND);
    }
    obj('pantano', 38, 8, { type: 'save', id: 'pantano' });
    obj('pantano', 36, 24, { type: 'pipe', id: 'pantano', name: 'Pântano de Bayes' });

    // ---------------- DESERTO ----------------
    struct('deserto', 'temple_d3', 24, 7, { door: 'd3' });
    obj('deserto', 23, 11, { type: 'sign', text: '^yRUÍNAS DA DISPERSÃO^0\n"Nem todos os caminhos ficam perto da média."' });
    struct('deserto', 'tent', 7, 18);
    obj('deserto', 8, 21, { type: 'npc', spr: 'quetelet', name: 'Mercador Quetelet', script: 'quetelet' });
    obj('deserto', 14, 8, { type: 'oracle', flag: 'ow_des_oracle', topic: 'all', lv: 2, repeatable: true, coins: 15 });
    obj('deserto', 34, 16, { type: 'save', id: 'deserto' });
    obj('deserto', 18, 26, { type: 'pipe', id: 'deserto', name: 'Deserto da Dispersão' });

    // ---------------- VULCÃO ----------------
    struct('vulcao', 'cave', 22, 5, { door: 'd4' });
    obj('vulcao', 21, 9, { type: 'sign', text: '^rABISMO DO ACASO^0\n"Aqui, tudo depende da sorte... ou será da probabilidade?"' });
    obj('vulcao', 8, 24, { type: 'save', id: 'vulcao' });
    obj('vulcao', 12, 12, { type: 'pipe', id: 'vulcao', name: 'Vulcão do Acaso' });

    // ---------------- PICOS GAUSSIANOS ----------------
    struct('montanha', 'tower', 22, 3, { door: 'd5' });
    obj('montanha', 21, 9, { type: 'sign', text: '^cTORRE DAS DISTRIBUIÇÕES^0\n"O sino de Gauss ressoa no topo."' });
    struct('montanha', 'galton', 8, 14);
    obj('montanha', 8, 16, { type: 'zone', w: 32, h: 8, script: 'galtonBoard' });
    obj('montanha', 11, 15, { type: 'npc', spr: 'galton', name: 'Professor Galton', script: 'galton' });
    struct('montanha', 'igloo', 33, 17);
    obj('montanha', 34, 21, { type: 'npc', spr: 'hermit', name: 'Montanhês', script: 'mountaineer' });
    struct('montanha', 'snowman', 30, 12, { node: false, margin: 0 }); struct('montanha', 'snowman', 39, 12, { node: false, margin: 0 });
    clearing('montanha', 34, 26, 6, 3, null);
    qrow('montanha', 35, 27, ['coins', 'heartPiece', 'coins'], 'ow_mont_q');
    obj('montanha', 14, 26, { type: 'save', id: 'montanha' });
    obj('montanha', 4, 6, { type: 'pipe', id: 'montanha', name: 'Picos Gaussianos' });

    // ---------------- PLANALTO DO VIÉS ----------------
    struct('castelo', 'castle', 20, 2, { door: 'd6' });
    { const R = regionOf('castelo'); for (let x = R.ox + 23; x <= R.ox + 24; x++) objects.push({ type: 'seal', tx: x, ty: R.oy + 7 }); protect(R.ox + 20, R.oy + 8, R.ox + 27, R.oy + 11); }
    obj('castelo', 19, 10, { type: 'npc', spr: 'guard', name: 'Sentinela', script: 'sentinel' });
    for (const [gx, gy] of [[8, 6], [10, 6], [12, 6], [8, 9], [10, 9], [12, 9]]) struct('castelo', 'grave', gx, gy, { node: false, margin: 0 });
    for (const [lx2, ly2] of [[17, 12], [30, 12], [17, 20], [30, 20]]) struct('castelo', 'lamp', lx2, ly2, { node: false, margin: 0 });
    obj('castelo', 38, 22, { type: 'oracle', flag: 'ow_cast_oracle', topic: 'all', lv: 2, reward: 'heartPiece' });
    obj('castelo', 10, 22, { type: 'save', id: 'castelo' });
    obj('castelo', 40, 8, { type: 'pipe', id: 'castelo', name: 'Planalto do Viés' });

    // conteúdo extra (missões, observatório...)
    if (G.worldExtras) for (const f of G.worldExtras) f({ struct, obj, clearing, enclosure, regionOf, at, setT, protect, objects, nodes, map, prot, wall, block, idx, inMap, T });
    // 5) caminhos (A* + árvore geradora mínima por região)
    const HUB = { vila: [24, 12], lago: [6, 16], planicie: [24, 22], floresta: [24, 16], pantano: [24, 19], deserto: [22, 16], vulcao: [22, 16], montanha: [22, 14], castelo: [24, 14] };
    for (const reg in nodes) {
      const R = regionOf(reg), list = nodes[reg];
      let hx = R.ox + HUB[reg][0], hy = R.oy + HUB[reg][1];
      while (block[idx(hx, hy)] && hy < R.oy + RH - 4) hy++;
      list.unshift([hx, hy]); protect(hx - 1, hy - 1, hx + 1, hy + 1);
      // MST (Prim)
      const inT = [0], edges = [];
      while (inT.length < list.length) {
        let best = null;
        for (const i of inT) for (let j = 0; j < list.length; j++) if (!inT.includes(j)) {
          const d = Math.abs(list[i][0] - list[j][0]) + Math.abs(list[i][1] - list[j][1]);
          if (!best || d < best.d) best = { i, j, d };
        }
        inT.push(best.j); edges.push([list[best.i], list[best.j]]);
      }
      for (const [a, b] of edges) carvePath(a, b, R);
    }
    function carvePath(a, b, R) {
      const x0 = R.ox + 2, y0 = R.oy + 2, x1 = R.ox + RW - 3, y1 = R.oy + RH - 3;
      const ww = x1 - x0 + 1, hh = y1 - y0 + 1;
      const clampP = p => [G.clamp(p[0], x0, x1), G.clamp(p[1], y0, y1)];
      const [sx, sy] = clampP(a), [ex, ey] = clampP(b);
      const li = (x, y) => (y - y0) * ww + (x - x0);
      const g = new Float32Array(ww * hh).fill(1e9), from = new Int32Array(ww * hh).fill(-1), closed = new Uint8Array(ww * hh);
      const heap = [];
      const push = (f, i) => { heap.push([f, i]); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
      const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
      const si = li(sx, sy), ei = li(ex, ey);
      g[si] = 0; push(0, si);
      while (heap.length) {
        const [, ci] = pop();
        if (closed[ci]) continue; closed[ci] = 1;
        if (ci === ei) break;
        const cx = x0 + ci % ww, cy = y0 + Math.floor(ci / ww);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = cx + dx, ny = cy + dy;
          if (nx < x0 || ny < y0 || nx > x1 || ny > y1) continue;
          const gi = idx(nx, ny);
          if (block[gi] && !(nx === ex && ny === ey)) continue;
          let c = 1 + G.hash2(nx, ny, 31) * 1.6;
          if (wall[gi]) c += 30;
          if (map.get(nx, ny) === T.WATER) c += 5;
          if (map.get(nx, ny) === T.PATH) c -= 0.7;
          const ni = li(nx, ny), ng = g[ci] + c;
          if (ng < g[ni]) { g[ni] = ng; from[ni] = ci; push(ng + (Math.abs(nx - ex) + Math.abs(ny - ey)) * 1.0, ni); }
        }
      }
      if (from[ei] < 0 && ei !== si) return;
      let ci = ei;
      while (ci >= 0) {
        const cx = x0 + ci % ww, cy = y0 + Math.floor(ci / ww);
        for (const [dx, dy] of [[0, 0], [1, 0], [0, 1]]) {
          const px = cx + dx, py = cy + dy, gi = idx(px, py);
          if (block[gi]) continue;
          const cur = map.get(px, py);
          if (cur === T.WATER) setT(px, py, T.BRIDGE);
          else if (cur === T.GROUND || cur === T.GROUND2) setT(px, py, T.PATH);
          prot[gi] = 1; wall[gi] = 0;
        }
        ci = from[ci];
      }
    }

    // 6) obstáculos, decoração e perigos por bioma
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      const i = idx(x, y);
      if (wall[i]) { setT(x, y, WALLSTYLE[biomeAt(x, y)]); continue; }
      if (prot[i] || block[i] || map.get(x, y) !== T.GROUND) continue;
      const b = biomeAt(x, y);
      const n = G.fbm(x * 0.13, y * 0.13, 101), n2 = G.fbm(x * 0.17 + 50, y * 0.17, 202), r = G.hash2(x, y, 303);
      const TH = { vila: 0.66, lago: 0.64, planicie: 0.7, floresta: 0.5, pantano: 0.6, deserto: 0.66, vulcao: 0.62, montanha: 0.6, castelo: 0.63 }[b];
      if (n > TH) { setT(x, y, (b === 'deserto' || b === 'vulcao') && n2 > 0.5 ? T.CLIFF : (b === 'montanha' && n2 > 0.55 ? T.CLIFF : T.TREE)); continue; }
      if (b === 'pantano' && n2 > 0.6) { setT(x, y, T.WATER); continue; }
      if (b === 'vulcao' && n2 > 0.63) { setT(x, y, T.LAVA); continue; }
      if ((b === 'vila' || b === 'planicie' || b === 'floresta') && n2 > 0.74) { setT(x, y, T.WATER); continue; }
      if (b === 'montanha' && n2 > 0.68) { setT(x, y, T.ICE); continue; }
      if (r < 0.025) { setT(x, y, T.BUSH); continue; }
      if (r < 0.035) { setT(x, y, T.ROCK); continue; }
      if ((b === 'vila' || b === 'lago' || b === 'planicie' || b === 'floresta' || b === 'pantano') && n2 < 0.3 && r < 0.5) { setT(x, y, T.TALLGRASS); continue; }
      if (r > 0.93) setT(x, y, T.GROUND2);
    }
    // arbustos ao lado dos caminhos (para cortar)
    for (let y = 2; y < MH - 2; y++) for (let x = 2; x < MW - 2; x++) {
      if (map.get(x, y) !== T.GROUND || prot[idx(x, y)]) continue;
      const nearPath = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => map.get(x + dx, y + dy) === T.PATH);
      if (nearPath && G.hash2(x, y, 404) < 0.12) setT(x, y, T.BUSH);
    }
    // 7) portões das passagens
    for (const p of passages) {
      if (p.kind === 'open') continue;
      const gateT = p.kind === 'jump' ? T.WATER : p.kind === 'bomb' ? T.CRACKED : T.BARRIER;
      if (p.vertical) {
        const cols = p.kind === 'jump' ? [p.bx - 1, p.bx] : [p.bx];
        for (const x of cols) for (let y = p.y0 - (p.kind === 'jump' ? 4 : 0); y <= p.y0 + 2 + (p.kind === 'jump' ? 4 : 0); y++) {
          if (p.kind === 'jump' && (y < p.y0 || y > p.y0 + 2) && !TP[map.get(x, y)].solid) continue;
          setT(x, y, gateT);
        }
      } else {
        const rows = p.kind === 'jump' ? [p.by - 1, p.by] : [p.by];
        for (const y of rows) for (let x = p.x0 - (p.kind === 'jump' ? 4 : 0); x <= p.x0 + 2 + (p.kind === 'jump' ? 4 : 0); x++) {
          if (p.kind === 'jump' && (x < p.x0 || x > p.x0 + 2) && !TP[map.get(x, y)].solid) continue;
          setT(x, y, gateT);
        }
      }
    }
    // 8) inimigos
    const spawners = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const b = REG[r][c], ox = c * RW, oy = r * RH, list = ENEMIES[b];
      const want = b === 'vila' ? 6 : 11;
      let tries = 0, made = [];
      while (made.length < want && tries++ < 500) {
        const x = ox + 4 + Math.floor(rnd() * (RW - 8)), y = oy + 4 + Math.floor(rnd() * (RH - 8));
        const t = map.get(x, y);
        if (!(t === T.GROUND || t === T.GROUND2 || t === T.PATH || t === T.TALLGRASS)) continue;
        if (b === 'vila' && x > ox + 9 && x < ox + 39 && y > oy + 4 && y < oy + 28) continue;
        if (made.some(([mx, my]) => Math.abs(mx - x) + Math.abs(my - y) < 7)) continue;
        if (objects.some(o => o.x !== undefined && Math.abs(o.x / 16 - x) + Math.abs(o.y / 16 - y) < 5)) continue;
        made.push([x, y]);
        const [type, o] = list[Math.floor(rnd() * list.length)];
        spawners.push({ x: x * 16 + 8, y: y * 16 + 8, type, o });
      }
    }
    return { map, objects, spawners, passages };
  }

  function biomeAt(tx, ty) {
    const c = G.clamp(Math.floor(tx / RW), 0, COLS - 1), r = G.clamp(Math.floor(ty / RH), 0, ROWS - 1);
    return REG[r][c];
  }

  // ------------------------------------------------------------------
  //  Objetos -> entidades
  // ------------------------------------------------------------------
  class Zone extends G.Ent { // área interativa invisível (estátuas, tabuleiros...)
    constructor(x, y, w, h, script) { super(x, y, w, h); this.solid = false; this.script = script; this.room = -1; }
    interBox() { return { x: this.x - 4, y: this.y - 12, w: this.w + 8, h: this.h + 16 }; }
    interact() { const f = G.NPCS[this.script]; if (f) G.runScript(() => f(this)); }
  }
  G.Zone = Zone;
  function spawnObjects(objects) {
    for (const o of objects) {
      let e = null;
      switch (o.type) {
        case 'deco': e = new G.Deco(o.x, o.y, o.name); break;
        case 'npc': e = new G.NPC(o.x, o.y, o.spr, o.name, (n) => (G.NPCS[o.script] || G.NPCS.generic)(n), { wander: o.wander, marker: o.marker, room: -1 }); e.scriptId = o.script; break;
        case 'sign': e = new G.Sign(o.x, o.y, o.text); break;
        case 'chest': e = new G.Chest(o.x, o.y, o.flag, o.contents); break;
        case 'qblock': e = new G.QBlock(o.x, o.y, o.flag, o.contents); break;
        case 'pipe': e = new G.Pipe(o.x, o.y, o.id, o.name); break;
        case 'save': e = new G.SavePad(o.x, o.y, o.id); break;
        case 'oracle': {
          const reward = o.reward;
          e = new G.Oracle(o.x, o.y, o.flag, { topic: o.topic, lv: o.lv, repeatable: o.repeatable, coins: o.coins,
            onWin: reward ? async () => { await G.ui.say('Pedra Oráculo', 'Sua sabedoria brilha! Receba minha bênção.'); await G.give(reward); } : null });
          break;
        }
        case 'warp': e = new G.Trigger(o.x, o.y, o.w, o.h, () => G.enterDungeon(o.to), { room: -1 }); break;
        case 'zone': e = new Zone(o.x, o.y, o.w, o.h, o.script); break;
        case 'seal': if (G.P.crystals.length < 5) G.map.set(o.tx, o.ty, T.SEAL); break;
        case 'sheepPen': {
          const P = G.P;
          if (!P.flags.sheep) { const c = { branca: G.ri(5, 8), preta: G.ri(2, 4), marrom: G.ri(1, 4) }; if (c.preta === c.branca) c.preta--; P.flags.sheep = c; }
          const c = P.flags.sheep, b = { x: o.x, y: o.y, w: o.w, h: o.h };
          for (const col in c) for (let i = 0; i < c[col]; i++) { const s = new G.Sheep(o.x + G.rf(8, o.w - 24), o.y + G.rf(8, o.h - 16), col, b); s.room = -1; G.addEnt(s); }
          break;
        }
        default: if (G.spawnExtra) e = G.spawnExtra(o);
      }
      if (e) { e.room = -1; G.addEnt(e); }
    }
  }

  // ------------------------------------------------------------------
  //  API do mundo
  // ------------------------------------------------------------------
  const W = G.world = {
    ow: null, RW, RH, MW, MH, REG,
    biomeAt,
    regionAt(px, py) { return biomeAt(Math.floor(px / 16), Math.floor(py / 16)); },
    ensure() { if (!this.ow) this.ow = generate(); return this.ow; },
    loadOverworld(px, py) {
      const ow = this.ensure();
      const map = new GameMap('overworld', 'overworld', MW, MH);
      map.tiles.set(ow.map.tiles);
      G.map = map; map.applyBroken(); G.boss = null; G.trans = null;
      // arbustos e grama voltam a crescer quando recarrega (como em Zelda)
      G.ents = []; G.curRoom = -1; G.fx.clear();
      G.spawners = ow.spawners.map(s => new G.Spawner(s.x, s.y, s.type, s.o));
      spawnObjects(ow.objects);
      const p = G.player = new G.Player(px, py);
      G.addEnt(p);
      this.curRegion = null;
      G.cam.x = G.clamp(p.cx - G.W / 2, 0, MW * 16 - G.W); G.cam.y = G.clamp(p.cy - G.H / 2, 0, MH * 16 - G.H);
    },
    update(dt) {
      if (G.map.kind !== 'overworld') return;
      for (const s of G.spawners) s.update(dt);
      const p = G.player; if (!p) return;
      const reg = this.regionAt(p.cx, p.cy);
      if (reg !== this.curRegion) {
        this.curRegion = reg;
        const info = REGION_INFO[reg];
        G.ui.regionBanner(info.name, info.sub);
        if (!(p.starT > 0)) G.music(info.music);
        const P = G.P; if (!P.regions.includes(reg)) { P.regions.push(reg); }
      }
      // revelar mapa
      const cx = Math.floor(p.cx / 128), cy = Math.floor(p.cy / 128);
      for (let y = cy - 1; y <= cy + 1; y++) for (let x = cx - 2; x <= cx + 2; x++) if (x >= 0 && y >= 0 && x < MW / 8 && y < MH / 8) G.P.seen[y * (MW / 8) + x] = 1;
    },
    // minimapa (1 px por tile)
    minimap() {
      if (this._mini) return this._mini;
      const ow = this.ensure();
      const c = G.canvas(MW, MH), x = c.getContext('2d');
      const img = x.createImageData(MW, MH);
      for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) {
        const id = ow.map.get(tx, ty), b = biomeAt(tx, ty), th = G.THEMES[b];
        let col;
        if (id === T.WATER) col = th.w[1]; else if (id === T.LAVA) col = '#ff7a1a';
        else if (id === T.TREE || id === T.CLIFF) col = th.tc ? (id === T.TREE ? th.tc[2] : th.cl[2]) : '#333';
        else if (id === T.PATH || id === T.BRIDGE || id === T.PLAZA) col = th.p[0];
        else if (id === T.BLOCK) col = '#e8e0d0';
        else col = th.g[1];
        const v = parseInt(col.slice(1), 16), k = (ty * MW + tx) * 4;
        img.data[k] = v >> 16; img.data[k + 1] = (v >> 8) & 255; img.data[k + 2] = v & 255; img.data[k + 3] = 255;
      }
      x.putImageData(img, 0, 0);
      this._mini = c; return c;
    },
    drawMap(ctx, x, y, w, h) {
      const P = G.P, mini = this.minimap();
      const sc = Math.min((w - 4) / MW, (h - 30) / MH);
      const mw = Math.floor(MW * sc), mh = Math.floor(MH * sc);
      const ox = Math.round(x + (w - mw) / 2), oy = y + 10;
      G.text('MAPA DO REINO DE DATÁLIA', x + w / 2, y, '#ffd84a', { align: 'center' });
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(mini, ox, oy, mw, mh);
      const cw = 8 * sc;
      ctx.fillStyle = '#0a0918';
      for (let cy = 0; cy < MH / 8; cy++) for (let cx = 0; cx < MW / 8; cx++) if (!P.seen[cy * (MW / 8) + cx]) ctx.fillRect(Math.floor(ox + cx * cw), Math.floor(oy + cy * cw), Math.ceil(cw), Math.ceil(cw));
      // grade estilo Metroid
      ctx.fillStyle = 'rgba(122,228,255,0.12)';
      for (let i = 1; i < COLS; i++) ctx.fillRect(Math.round(ox + i * RW * sc), oy, 1, mh);
      for (let i = 1; i < ROWS; i++) ctx.fillRect(ox, Math.round(oy + i * RH * sc), mw, 1);
      G.strokeRect(ctx, ox - 1, oy - 1, mw + 2, mh + 2, '#5a5690');
      const seenAt = (tx, ty) => P.seen[Math.floor(ty / 8) * (MW / 8) + Math.floor(tx / 8)];
      // ícones
      for (const o of this.ow.objects) {
        const tx = o.x / 16, ty = o.y / 16;
        if (o.x === undefined || !seenAt(tx, ty)) continue;
        const px = Math.round(ox + tx * sc), py = Math.round(oy + ty * sc);
        if (o.type === 'warp') { const n = o.to.slice(1); const done = P.flags['boss_' + o.to]; G.rect(ctx, px - 1, py - 3, 9, 9, '#1b1428'); G.text(n === '6' ? 'X' : n, px + 1, py - 2, done ? '#7aff8a' : '#ff6aa0', { shadow: false }); }
        else if (o.type === 'save') G.rect(ctx, px, py, 3, 3, '#7ae4ff');
        else if (o.type === 'pipe' && P.pipes.includes(o.id)) G.rect(ctx, px, py, 3, 3, '#3ad04a');
      }
      // nomes das regiões vistas
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const name = REG[r][c]; if (!P.regions.includes(name)) continue;
        const short = { vila: 'Vila', lago: 'Lago', planicie: 'Campos', floresta: 'Bosque', pantano: 'Pântano', deserto: 'Deserto', vulcao: 'Vulcão', montanha: 'Picos', castelo: 'Planalto' }[name];
        G.text(short, ox + (c * RW + RW / 2) * sc, oy + (r * RH + 2) * sc, '#ffffff', { align: 'center' });
      }
      if (G.drawMapExtra) G.drawMapExtra(ctx, ox, oy, sc, seenAt);
      const p = G.player;
      if (p && G.map.kind === 'overworld' && Math.floor(G.time * 4) % 2 === 0) { const px = Math.round(ox + p.cx / 16 * sc), py = Math.round(oy + p.cy / 16 * sc); G.rect(ctx, px - 2, py - 2, 5, 5, '#ffffff'); G.rect(ctx, px - 1, py - 1, 3, 3, '#ff3a3a'); }
      const leg = '■ salvar   ■ cano   nº masmorra   ! missão   ■ tumba', lx0 = x + w / 2 - Math.floor(G.textW(leg) / 2);
      G.text(leg, x + w / 2, oy + mh + 4, '#9a98b0', { align: 'center' });
      G.rect(ctx, lx0, oy + mh + 5, 5, 5, '#7ae4ff'); G.rect(ctx, lx0 + G.textW('■ salvar   '), oy + mh + 5, 5, 5, '#3ad04a');
      G.text('!', lx0 + G.textW('■ salvar   ■ cano   nº masmorra   '), oy + mh + 4, '#ffd84a');
      const tx0 = lx0 + G.textW('■ salvar   ■ cano   nº masmorra   ! missão   ');
      G.rect(ctx, tx0, oy + mh + 4, 5, 6, '#1b1428'); G.rect(ctx, tx0 + 1, oy + mh + 5, 3, 4, '#ffd84a');
    }
  };
  G.cam = { x: 0, y: 0 };
  G.drawMapTab = (ctx, x, y, w, h) => { if (G.map.kind === 'dungeon') G.dun.drawMap(ctx, x, y, w, h); else W.drawMap(ctx, x, y, w, h); };
})(window.G);
