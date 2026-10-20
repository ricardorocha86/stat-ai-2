'use strict';
// =====================================================================
//  Gráficos: toda a arte em pixel é gerada por código (strings de
//  pixels + funções procedurais). Nada de arquivos externos.
// =====================================================================
(function (G) {
  const SPR = G.spr = {};
  G.sprWarn = [];
  const canvas = G.canvas;

  // versões em resolução lógica (1x) — usadas por arte antiga e tiles; as
  // públicas devolvem a arte ampliada (Scale2x) com tamanho lógico.
  function mk(rows, pal, name) { return G.scale2x(mk1(rows, pal, name)); }
  function pix(w, h, fn) { return G.scale2x(pix1(w, h, fn)); }
  function shape(w, h, mask, color, outline) { return G.scale2x(shape1(w, h, mask, color, outline)); }

  // cria sprite a partir de strings e paleta ('.' = transparente)
  function mk1(rows, pal, name) {
    const h = rows.length, w = rows[0].length;
    for (let i = 0; i < h; i++) if (rows[i].length !== w) G.sprWarn.push((name || '?') + ' linha ' + i + ' tem ' + rows[i].length + ' (esperado ' + w + ')');
    const c = canvas(w, h), x = c.getContext('2d');
    for (let y = 0; y < h; y++) for (let i = 0; i < rows[y].length; i++) {
      const ch = rows[y][i];
      if (ch === '.' || ch === ' ') continue;
      const col = pal[ch];
      if (!col) { G.sprWarn.push((name || '?') + ' sem cor p/ ' + ch); continue; }
      x.fillStyle = col; x.fillRect(i, y, 1, 1);
    }
    return c;
  }
  // sprite procedural: fn(x,y) => cor ou null
  function pix1(w, h, fn) {
    const c = canvas(w, h), x = c.getContext('2d');
    for (let y = 0; y < h; y++) for (let i = 0; i < w; i++) { const col = fn(i, y); if (col) { x.fillStyle = col; x.fillRect(i, y, 1, 1); } }
    return c;
  }
  // forma com contorno automático: mask(x,y)=>bool, color(x,y)=>cor
  function shape1(w, h, mask, color, outline = '#1b1428') {
    const m = [];
    for (let y = 0; y < h; y++) { m[y] = []; for (let x = 0; x < w; x++) m[y][x] = !!mask(x, y); }
    return pix1(w, h, (x, y) => {
      if (m[y][x]) return color(x, y);
      if (!outline) return null;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const yy = y + dy, xx = x + dx; if (yy >= 0 && yy < h && xx >= 0 && xx < w && m[yy][xx]) return outline; }
      return null;
    });
  }
  G.mk = mk; G.pix = pix; G.shape = shape; G.mk1 = mk1; G.pix1 = pix1; G.shape1 = shape1;

  // sobrepõe linhas (overlay) em cima de linhas base
  function over(base, ov) {
    return base.map((row, y) => {
      if (!ov[y]) return row;
      let r = '';
      for (let i = 0; i < row.length; i++) r += (ov[y][i] && ov[y][i] !== '.') ? ov[y][i] : row[i];
      return r;
    });
  }

  // versão branca (piscar ao levar dano)
  const whiteCache = new Map();
  G.white = function (c) {
    let w = whiteCache.get(c);
    if (w) return w;
    w = canvas(c.width, c.height);
    const x = w.getContext('2d');
    x.drawImage(c, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#fff'; x.fillRect(0, 0, w.width, w.height);
    w.lw = G.lw(c); w.lh = G.lh(c);
    whiteCache.set(c, w);
    return w;
  };
  const tintCache = new Map();
  G.tint = function (c, color) {
    const key = color;
    let m = tintCache.get(c); if (!m) { m = {}; tintCache.set(c, m); }
    if (m[key]) return m[key];
    const w = canvas(c.width, c.height), x = w.getContext('2d');
    x.drawImage(c, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = color; x.fillRect(0, 0, w.width, w.height);
    w.lw = G.lw(c); w.lh = G.lh(c);
    m[key] = w; return w;
  };
  // silhueta de uma cor só (sombras projetadas, contornos de brilho)
  const silCache = new Map();
  G.silhouette = function (c, color) {
    let m = silCache.get(c); if (!m) { m = {}; silCache.set(c, m); }
    if (m[color]) return m[color];
    const w = canvas(c.width, c.height), x = w.getContext('2d');
    x.drawImage(c, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = color; x.fillRect(0, 0, w.width, w.height);
    w.lw = G.lw(c); w.lh = G.lh(c);
    m[color] = w; return w;
  };

  // posição em pixels de arte (meio pixel lógico): movimento mais suave
  const snap = v => Math.round(v * G.AR) / G.AR;
  G.snap = snap;
  // desenha sprite (x,y = canto superior esquerdo na tela, em unidades lógicas)
  G.draw = function (ctx, spr, x, y, o) {
    if (typeof spr === 'string') spr = SPR[spr];
    if (!spr) return;
    const w = G.lw(spr), h = G.lh(spr);
    x = snap(x); y = snap(y);
    let img = spr;
    if (o) {
      if (o.white) img = G.white(spr);
      else if (o.sil) img = G.silhouette(spr, o.sil);
      else if (o.tint) img = G.tint(spr, o.tint);
      const pa = ctx.globalAlpha; if (o.alpha !== undefined) ctx.globalAlpha = pa * o.alpha;
      if (o.rot) {
        ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.rotate(o.rot); if (o.flip) ctx.scale(-1, 1); ctx.drawImage(img, -w / 2, -h / 2, w, h); ctx.restore();
      } else if (o.flip || o.flipY) {
        ctx.save(); ctx.translate(x + (o.flip ? w : 0), y + (o.flipY ? h : 0)); ctx.scale(o.flip ? -1 : 1, o.flipY ? -1 : 1);
        const fsx = o.sx || o.scale || 1, fsy = o.sy || o.scale || 1;
        if (fsx !== 1 || fsy !== 1) ctx.drawImage(img, w * (1 - fsx) / 2, h * (1 - fsy), w * fsx, h * fsy); else ctx.drawImage(img, 0, 0, w, h);
        ctx.restore();
      } else if (o.sx || o.sy) { // estica (squash & stretch) ancorado na base
        const sx = o.sx || 1, sy = o.sy || 1;
        ctx.drawImage(img, snap(x + w * (1 - sx) / 2), snap(y + h * (1 - sy)), snap(w * sx), snap(h * sy));
      } else if (o.scale) {
        const s = o.scale; ctx.drawImage(img, snap(x + w * (1 - s) / 2), snap(y + h * (1 - s)), snap(w * s), snap(h * s));
      } else ctx.drawImage(img, x, y, w, h);
      ctx.globalAlpha = pa;
    } else ctx.drawImage(img, x, y, w, h);
  };
  // desenha sprite ampliado num retângulo (ícones, retratos)
  G.drawFit = function (ctx, spr, x, y, w, h) {
    if (typeof spr === 'string') spr = SPR[spr];
    if (!spr) return;
    const sw = G.lw(spr), sh = G.lh(spr), s = Math.min(w / sw, h / sh);
    const prev = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = false;
    ctx.drawImage(spr, snap(x + (w - sw * s) / 2), snap(y + (h - sh * s) / 2), snap(sw * s), snap(sh * s));
    ctx.imageSmoothingEnabled = prev;
  };
  // sombra suave elíptica (em pixels de arte)
  const shadowCache = new Map();
  G.shadow = function (ctx, cx, cy, w = 10, alpha = 0.3) {
    const k = Math.round(w) + '_' + Math.round(alpha * 20);
    let c = shadowCache.get(k);
    if (!c) {
      const pw = Math.max(4, Math.round(w * G.AR)), ph = Math.max(3, Math.round(w * G.AR * 0.42));
      const p = new G.Paint(pw, ph);
      p.ell(pw / 2, ph / 2, pw / 2, ph / 2, (nx, ny) => { const d = nx * nx + ny * ny; return 'rgba(10,6,24,' + (alpha * (d > 0.6 ? 0.65 : 1)).toFixed(3) + ')'; });
      c = p.toCanvas(); shadowCache.set(k, c);
    }
    ctx.drawImage(c, snap(cx - G.lw(c) / 2), snap(cy - G.lh(c) / 2), G.lw(c), G.lh(c));
  };

  // ------------------------------------------------------------------
  //  HUMANOIDES (herói e NPCs) — modelo com paleta trocável
  // ------------------------------------------------------------------
  const HUM = {
    down0: [
      '................',
      '.....kkkkkk.....',
      '....khhhhhhk....',
      '...khhhhhhhhk...',
      '...khHhhhhHhk...',
      '...khsssssshk...',
      '...kssessessk...',
      '...kSssssssSk...',
      '....kssssssk....',
      '...kaaaaaaaak...',
      '..kcccccccccck..',
      '..ksyyyyyyyysk..',
      '...kcccccccck...',
      '...kpppkkpppk...',
      '...kffk..kffk...',
      '...kkkk..kkkk...'],
    down1: [
      '................',
      '.....kkkkkk.....',
      '....khhhhhhk....',
      '...khhhhhhhhk...',
      '...khHhhhhHhk...',
      '...khsssssshk...',
      '...kssessessk...',
      '...kSssssssSk...',
      '....kssssssk....',
      '...kaaaaaaaak...',
      '..kcccccccccck..',
      '..ksyyyyyyyysk..',
      '...kcccccccck...',
      '...kpppkkpppk...',
      '....kffkkffk....',
      '....kkkkkkkk....'],
    up0: [
      '................',
      '.....kkkkkk.....',
      '....khhhhhhk....',
      '...khhhhhhhhk...',
      '...khhhhhhhhk...',
      '...khHhhhhHhk...',
      '...khhHhhHhhk...',
      '...kHhhhhhhHk...',
      '....kHHHHHHk....',
      '...kaaaaaaaak...',
      '..kccccaacccck..',
      '..ksyyyyyyyysk..',
      '...kcccccccck...',
      '...kpppkkpppk...',
      '...kffk..kffk...',
      '...kkkk..kkkk...'],
    up1: [
      '................',
      '.....kkkkkk.....',
      '....khhhhhhk....',
      '...khhhhhhhhk...',
      '...khhhhhhhhk...',
      '...khHhhhhHhk...',
      '...khhHhhHhhk...',
      '...kHhhhhhhHk...',
      '....kHHHHHHk....',
      '...kaaaaaaaak...',
      '..kcccccaaccck..',
      '..ksyyyyyyyysk..',
      '...kcccccccck...',
      '...kpppkkpppk...',
      '....kffkkffk....',
      '....kkkkkkkk....'],
    side0: [
      '................',
      '....kkkkkk......',
      '...khhhhhhk.....',
      '..khhhhhhhhk....',
      '..khhhhhhsssk...',
      '..khhhhhsssssk..',
      '..khhhhssessk...',
      '..khhhsssssssk..',
      '...khsssssk.....',
      '..akaaaaaak.....',
      '.a.kcccccccck...',
      '...kyyyysyyyk...',
      '...kcccccccck...',
      '....kpppppk.....',
      '....kffkkffk....',
      '....kkk..kkk....'],
    side1: [
      '................',
      '....kkkkkk......',
      '...khhhhhhk.....',
      '..khhhhhhhhk....',
      '..khhhhhhsssk...',
      '..khhhhhsssssk..',
      '..khhhhssessk...',
      '..khhhsssssssk..',
      '...khsssssk.....',
      '.aakaaaaaak.....',
      '...kcccccccck...',
      '...kyyyysyyyk...',
      '...kcccccccck...',
      '....kpppppk.....',
      '.....kffffk.....',
      '.....kkkkkk.....']
  };
  const OV = {
    beard: { 7: '....wwwwwwww....', 8: '....kwwwwwwk....', 9: '.....kwwwwk.....', 10: '......kwwk......' },
    beardSide: { 7: '.......wwwww....', 8: '...kwwwwwwk.....', 9: '....kwwwwk......' },
    hairLong: { 5: '..kh........hk..', 6: '..kh........hk..', 7: '..kh........hk..', 8: '..khh......hhk..', 9: '..khh......hhk..' },
    hairLongUp: { 8: '..khHHHHHHHHhk..', 9: '..khhaaaaaahhk..' },
    hat: { 0: '.......kk.......', 1: '......kmmk......', 2: '.....kmmmmk.....', 3: '..kmmmmmmmmmmk..', 4: '...kkkkkkkkkk...' },
    tophat: { 0: '....kkkkkkkk....', 1: '....kmmmmmmk....', 2: '....kmmmmmmk....', 3: '..kkmrrrrrrmkk..', 4: '..kmmmmmmmmmmk..' },
    cap: { 1: '.....kkkkkk.....', 2: '....kmmmmmmk....', 3: '...kmmmmmmmmk...', 4: '..kkkkkkkkkkkk..' },
    nurse: { 1: '.....kkkkkk.....', 2: '....kmmrrmmk....', 3: '...kmmmrrmmmk...' },
    turban: { 1: '....kkkkkkkk....', 2: '...kmmmmmmmmk...', 3: '..kmmMmmmmMmmk..', 4: '..kmmmmmmmmmmk..' },
    hood: { 1: '....kkkkkkkk....', 2: '...kmmmmmmmmk...', 3: '..kmmmmmmmmmmk..', 4: '..kmhhhhhhhhmk..', 5: '..km........mk..', 6: '..km........mk..', 7: '..km........mk..' },
    straw: { 2: '...kkkkkkkkkk...', 3: '.kmmmmmmmmmmmmk.', 4: '..kkkkkkkkkkkk..' },
    helmet: { 1: '.....kkkkkk.....', 2: '....kmmmmmmk....', 3: '...kmmmmmmmmk...', 4: '...kmMmmmmMmk...', 5: '...kmkkkkkkmk...', 6: '...kmseeeesmk...' }
  };
  function sideOv(ov) { // adapta overlays frontais para perfil (só os de topo)
    const r = {};
    for (const k in ov) if (+k <= 4) r[k] = ov[k];
    return r;
  }
  const BASEPAL = { k: '#1b1428', e: '#1b1428', w: '#ffffff', s: '#f6c79a', S: '#d89a6a' };
  function humanoid(name, pal, overlays = [], opt = {}) {
    const P = Object.assign({}, BASEPAL, pal);
    for (const fr of ['down0', 'down1', 'up0', 'up1', 'side0', 'side1']) {
      let rows = HUM[fr];
      for (const o of overlays) {
        let ov = OV[o];
        if (!ov) continue;
        if (fr.startsWith('side')) {
          if (o === 'beard') ov = OV.beardSide;
          else if (o === 'hairLong' || o === 'hood') ov = o === 'hood' ? sideOv(OV.hood) : {};
          else ov = sideOv(ov);
        } else if (fr.startsWith('up')) {
          if (o === 'beard') continue;
          if (o === 'hairLong') ov = OV.hairLongUp;
          if (o === 'helmet') ov = { 1: OV.helmet[1], 2: OV.helmet[2], 3: OV.helmet[3], 4: '...kmmmmmmmmk...', 5: '...kmmmmmmmmk...', 6: '...kmmmmmmmmk...' };
          if (o === 'hood') ov = Object.assign({}, OV.hood, { 4: '..kmmmmmmmmmmk..', 5: '..kmmmmmmmmmmk..', 6: '..kmmmmmmmmmmk..', 7: '..kmmmmmmmmmmk..' });
        }
        rows = over(rows, ov);
      }
      SPR[name + '_' + fr] = mk(rows, P, name + '_' + fr);
    }
  }
  G.humanoid = humanoid;

  // ------------------------------------------------------------------
  //  INIMIGOS
  // ------------------------------------------------------------------
  function slime(name, c1, c2, c3) {
    for (let f = 0; f < 2; f++) {
      const rx = f ? 7.2 : 6.2, ry = f ? 4.6 : 5.6, cx = 8, cy = 15 - ry - 0.5;
      SPR[name + f] = shape(16, 16, (x, y) => { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; return dx * dx + dy * dy <= 1 && y <= 15; },
        (x, y) => {
          const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
          if ((x === 5 || x === 10) && Math.abs(y - (cy - 0.5)) < 1.2) return '#1b1428';
          if (dx < -0.2 && dy < -0.3 && dx * dx + dy * dy < 0.55 && dx * dx + dy * dy > 0.15) return '#ffffff';
          if (dy > 0.45) return c3;
          if (dy < -0.2) return c1;
          return c2;
        });
    }
  }
  function enemies() {
    slime('gosma', '#9cff7a', '#4fcf4a', '#2a8a3a');
    slime('gosma_ice', '#d8f4ff', '#7ac8f0', '#3a7ab0');
    slime('gosma_sand', '#ffe89a', '#e0b84a', '#a07a2a');
    slime('gosma_swamp', '#d8a0ff', '#9a5ad0', '#5a2a8a');
    slime('gosma_lava', '#ffd07a', '#ff7a2a', '#b02a1a');
    slime('gosma_dark', '#c0a0ff', '#6a4ab0', '#3a2a6a');
    const cg = { k: '#1b1428', b: '#b0482a', B: '#7a2a1a', w: '#ffffff', t: '#f4d8a8', f: '#3a2418' };
    const cogBase = [
      '................',
      '................',
      '.....kkkkkk.....',
      '...kkbbbbbbkk...',
      '..kbbbbbbbbbbk..',
      '.kbbkkbbbbkkbbk.',
      '.kbbbwkbbkwbbbk.',
      'kbbbbwkbbkwbbbbk',
      'kbbbbbbbbbbbbbbk',
      '.kkkbbbbbbbbkkk.',
      '...kttttttttk...',
      '...kttkttkttk...',
      '...kttttttttk...'];
    SPR.cogumau0 = mk(cogBase.concat(['..kffk....kffk..', '.kffffk..kffffk.', '.kkkkkk..kkkkkk.']), cg, 'cog0');
    SPR.cogumau1 = mk(cogBase.concat(['...kffk..kffk...', '..kffffkkffffk..', '..kkkkkkkkkkkk..']), cg, 'cog1');
    SPR.cogumau_flat = mk(['................', '................', '................', '................', '................', '................', '................', '................', '................', '................',
      '.....kkkkkk.....', '..kkbbbbbbbbkk..', '.kbbkwkbbkwkbbk.', 'kbbbbbbbbbbbbbbk', '.kkkttttttttkkk.', '...kkkkkkkkkk...'], cg, 'cogf');
    // morcego
    const bt = { k: '#1b1428', b: '#5a3a8a', B: '#3a2460', r: '#ff4a4a', w: '#ffffff' };
    SPR.morcego0 = mk([
      '................',
      '.k............k.',
      '.kk..........kk.',
      '.kbk........kbk.',
      '.kbbk.k..k.kbbk.',
      '.kbbbkbkkbkbbbk.',
      '..kbbbbbbbbbbk..',
      '..kbBbrbbrbBbk..',
      '...kbbbbbbbbk...',
      '....kbwbbwbk....',
      '.....kbbbbk.....',
      '......kkkk......',
      '................',
      '................',
      '................',
      '................'], bt, 'bat0');
    SPR.morcego1 = mk([
      '................',
      '................',
      '................',
      '................',
      '......k..k......',
      '.....kbkkbk.....',
      '..kkkbbbbbbkkk..',
      '.kbbbbrbbrbbbbk.',
      'kbbBbbbbbbbbBbbk',
      'kbk.kbwbbwbk.kbk',
      'kk...kbbbbk...kk',
      'k.....kkkk.....k',
      '................',
      '................',
      '................',
      '................'], bt, 'bat1');
    // escorpião
    const sc = { k: '#1b1428', b: '#d0802a', B: '#8a4a1a', r: '#ff3030', y: '#ffd040' };
    SPR.escorpiao0 = mk([
      '................',
      '......kkk.......',
      '.....kyyBk......',
      '......kkBk......',
      '........kBk.....',
      '.........kBk....',
      '..kk......kBk...',
      '.kBBk.kkkkkBk...',
      '.kbBkkbbbbbbk...',
      '..kkbbbrbbrbbk..',
      '...kbbbbbbbbbk..',
      '..kBkbbbbbbbkBk.',
      '.kBk.kBBBBBk.kBk',
      '.kk..kBkkkBk..kk',
      '......k...k.....',
      '................'], sc, 'sc0');
    SPR.escorpiao1 = mk([
      '................',
      '.......kkk......',
      '......kyyBk.....',
      '.......kkBk.....',
      '........kBk.....',
      '.........kBk....',
      '.kk.......kBk...',
      'kBBk..kkkkkBk...',
      'kbBkkkbbbbbbk...',
      '.kkkbbbrbbrbbk..',
      '...kbbbbbbbbbk..',
      '...kBkbbbbbkBk..',
      '..kBk.kBBBk.kBk.',
      '..kk..kBkBk..kk.',
      '.......k.k......',
      '................'], sc, 'sc1');
    // lobo (perfil, olhando à direita)
    const lb = { k: '#1b1428', b: '#c8d0e0', B: '#8890a8', r: '#ff4040', w: '#ffffff', n: '#2a2030' };
    SPR.lobo0 = mk([
      '................',
      '................',
      '..........k.k...',
      '.........kbkbk..',
      '.........kbbbbk.',
      'k........kbrbbbk',
      'bk......kbbbbbnk',
      'kbk..kkkkbbbbkk.',
      '.kbkkbbbbbbbbk..',
      '..kbbbbbbbbbbk..',
      '..kBbbbbbbbbBk..',
      '..kBBkBBBBkBBk..',
      '..kBk.kBBk.kBk..',
      '..kBk..kk..kBk..',
      '..kkk......kkk..',
      '................'], lb, 'lobo0');
    SPR.lobo1 = mk([
      '................',
      '................',
      '..........k.k...',
      '.........kbkbk..',
      '.........kbbbbk.',
      '.........kbrbbbk',
      'kk......kbbbbbnk',
      'kbkkkkkkkbbbbkk.',
      '.kbbbbbbbbbbbk..',
      '..kbbbbbbbbbbk..',
      '..kBbbbbbbbbBk..',
      '.kBBkBBBBBkBBk..',
      'kBk..kBBBk..kBk.',
      'kk....kkk....kk.',
      '................',
      '................'], lb, 'lobo1');
    // chama
    for (let f = 0; f < 2; f++) {
      SPR['chama' + f] = shape(16, 16, (x, y) => {
        const cx = 8 + (f ? Math.sin(y * 0.8) * 0.8 : -Math.sin(y * 0.8) * 0.8);
        const top = 2 + (f ? 1 : 0);
        if (y < top) return false;
        const t = (y - top) / (15 - top);
        const half = t < 0.6 ? 1 + t * 9 : 6.4 - (t - 0.6) * 4;
        return Math.abs(x + 0.5 - cx) < half;
      }, (x, y) => {
        if ((x === 6 || x === 9) && y >= 9 && y <= 10) return '#1b1428';
        if (y > 11) return '#d8301a';
        if (Math.abs(x - 7.5) < 2.5 && y > 6) return '#ffe87a';
        return y < 7 ? '#ffb03a' : '#ff7a2a';
      }, '#5a1010');
    }
    // fantasma
    for (let f = 0; f < 2; f++) {
      SPR['fantasma' + f] = shape(16, 16, (x, y) => {
        const dx = x + 0.5 - 8;
        if (y < 7) return dx * dx + (y + 0.5 - 7) * (y + 0.5 - 7) <= 36;
        if (y > 13) return false;
        if (y === 13) return ((x + f) % 4) < 2 && x > 1 && x < 14;
        return Math.abs(dx) <= 6;
      }, (x, y) => {
        if ((x === 5 || x === 10) && (y === 6 || y === 7)) return '#2a1040';
        if (y === 10 && x >= 6 && x <= 9) return '#2a1040';
        return y < 4 ? '#ffffff' : (x > 11 ? '#b0a0d8' : '#e8e0ff');
      }, '#4a3a7a');
    }
    // aranha pequena
    for (let f = 0; f < 2; f++) {
      SPR['aranha' + f] = pix(16, 16, (x, y) => {
        const dx = x + 0.5 - 8, dy = y + 0.5 - 9;
        const body = dx * dx / 20 + dy * dy / 12 <= 1;
        if (body) { if ((x === 6 || x === 9) && y === 8) return '#ff3030'; return dy < -1 ? '#6a4a8a' : '#3a2a5a'; }
        // pernas
        const legs = f ? [[2, 6], [1, 9], [2, 12], [13, 6], [14, 9], [13, 12], [3, 7], [3, 11], [12, 7], [12, 11]] : [[2, 5], [1, 9], [2, 13], [13, 5], [14, 9], [13, 13], [3, 6], [3, 12], [12, 6], [12, 12]];
        for (const [lx, ly] of legs) if (x === lx && y === ly) return '#1b1428';
        if (y === 9 && (x === 2 || x === 13)) return '#1b1428';
        return null;
      });
    }
    // cuspidor (corpo redondo; focinho desenhado à parte)
    SPR.cuspidor = shape(16, 16, (x, y) => { const dx = x + 0.5 - 8, dy = y + 0.5 - 8.5; return dx * dx + dy * dy <= 36; },
      (x, y) => {
        const dx = x + 0.5 - 8, dy = y + 0.5 - 8.5;
        if ((x === 5 || x === 10) && y >= 6 && y <= 7) return '#1b1428';
        if ((x === 5 || x === 10) && y === 5) return '#ffffff';
        if (dx < -1 && dy < -1 && dx * dx + dy * dy < 14) return '#ff9a8a';
        return dy > 2.5 ? '#a02a3a' : '#e04a4a';
      });
    // esqueleto e cavaleiro usam modelo humanoide
    humanoid('esqueleto', { h: '#ece8dc', H: '#b8b2a2', s: '#ece8dc', S: '#b8b2a2', e: '#ff3030', a: '#b8b2a2', c: '#d8d2c2', y: '#8a8476', p: '#d8d2c2', f: '#8a8476' });
    humanoid('cavaleiro', { h: '#8a8aa0', H: '#5a5a70', s: '#3a3a50', S: '#2a2a40', e: '#ff4040', a: '#7a2aa0', c: '#5a4a8a', y: '#c0a040', p: '#4a3a6a', f: '#3a3050', m: '#9a9ab8', M: '#6a6a88' }, ['helmet']);
    // peixe (minigame)
    SPR.peixe = mk([
      '................',
      '................',
      '................',
      '.....kkkkk......',
      '...kkbbbbbkk..k.',
      '..kbbwbbbbbbkkbk',
      '.kbbkbbbbbbbbbbk',
      '.kbbbbbbbbbbkkbk',
      '..kbBBBBBBBk..k.',
      '...kkkkkkkk.....',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................'], { k: '#1b1428', b: '#7ab0e0', B: '#4a7ab0', w: '#ffffff' }, 'peixe');
    SPR.peixe_ouro = G.tint(SPR.peixe, 'rgba(255,200,40,0.65)');
    // ovelha
    const ov = { k: '#1b1428', w: '#f4f0e8', W: '#c8c0b0', f: '#2a2030', e: '#ffffff' };
    SPR.ovelha0 = mk([
      '................',
      '................',
      '................',
      '....kkkkkk......',
      '..kkwwwwwwkk....',
      '.kwwwwwwwwwwkkk.',
      'kwwwwwwwwwwkfffk',
      'kwwWwwwwwwwkfefk',
      'kwwwwwwwWwwkfffk',
      '.kwwWwwwwwwk.kk.',
      '..kWWWWWWWk.....',
      '..kfk..kfk......',
      '..kfk..kfk......',
      '..kkk..kkk......',
      '................',
      '................'], ov, 'ovelha0');
    SPR.ovelha1 = mk([
      '................',
      '................',
      '................',
      '....kkkkkk......',
      '..kkwwwwwwkk....',
      '.kwwwwwwwwwwkkk.',
      'kwwwwwwwwwwkfffk',
      'kwwWwwwwwwwkfefk',
      'kwwwwwwwWwwkfffk',
      '.kwwWwwwwwwk.kk.',
      '..kWWWWWWWk.....',
      '.kfk....kfk.....',
      '.kfk....kfk.....',
      '.kkk....kkk.....',
      '................',
      '................'], ov, 'ovelha1');
  }

  // ------------------------------------------------------------------
  //  ITENS E OBJETOS
  // ------------------------------------------------------------------
  function items() {
    // moeda (4 quadros girando)
    [1, 0.62, 0.18, 0.62].forEach((wf, f) => {
      SPR['coin' + f] = shape(10, 12, (x, y) => { const dx = (x + 0.5 - 5) / Math.max(0.6, 3.8 * wf), dy = (y + 0.5 - 6) / 5; return dx * dx + dy * dy <= 1; },
        (x, y) => { const dx = (x + 0.5 - 5) / Math.max(0.6, 3.8 * wf); if (wf < 0.3) return '#c08a1a'; if (dx < -0.35) return '#fff6b0'; if (dx > 0.45) return '#d0901a'; return (y > 3 && y < 9 && Math.abs(dx) < 0.2) ? '#e0a020' : '#ffd23a'; }, '#5a3a10');
    });
    SPR.coinBlue = G.tint(SPR.coin0, 'rgba(90,160,255,0.75)');
    SPR.coinRed = G.tint(SPR.coin0, 'rgba(255,80,80,0.7)');
    // corações HUD
    const hp = { k: '#1b1428', r: '#ff3a4a', W: '#ffd0d8', d: '#4a2030' };
    const hrows = ['.kkk.kkk.', 'kWrrkrrrk', 'kWrrrrrrk', 'krrrrrrrk', '.krrrrrk.', '..krrrk..', '...krk...', '....k....'];
    SPR.heartFull = mk(hrows, hp, 'heart');
    SPR.heartEmpty = mk(hrows.map(r => r.replace(/[rW]/g, 'd')), hp, 'heartE');
    SPR.heartPick = SPR.heartFull;
    // container de coração
    SPR.heartContainer = shape(16, 16, (x, y) => {
      const X = (x + 0.5 - 8) / 7, Y = (y + 0.5 - 7) / 7;
      const a = X * X + Y * Y - 0.6; return a * a * a - X * X * Y * Y * Y * 1.2 <= 0;
    }, (x, y) => (x < 6 && y < 6 ? '#ffd0d8' : y > 10 ? '#c01a3a' : '#ff3a5a'), '#fff0a0');
    SPR.heartPiece = shape(16, 16, (x, y) => {
      if (x > 8 || y > 8) { const X = (x + 0.5 - 8) / 7, Y = (y + 0.5 - 7) / 7; const a = X * X + Y * Y - 0.6; if (!(a * a * a - X * X * Y * Y * Y * 1.2 <= 0)) return false; return x <= 8 && y <= 9; }
      const X = (x + 0.5 - 8) / 7, Y = (y + 0.5 - 7) / 7; const a = X * X + Y * Y - 0.6; return a * a * a - X * X * Y * Y * Y * 1.2 <= 0;
    }, (x, y) => (x < 5 && y < 5 ? '#ffd0d8' : '#ff3a5a'), '#fff0a0');
    // chave pequena
    SPR.key = mk([
      '................',
      '.....kkkk.......',
      '....kyyyyk......',
      '...kyykkyyk.....',
      '...kyk..kyk.....',
      '...kyykkyyk.....',
      '....kyyyyk......',
      '.....kyyk.......',
      '.....kyyk.......',
      '.....kyykk......',
      '.....kyyyyk.....',
      '.....kyykk......',
      '.....kyyyk......',
      '.....kyykk......',
      '......kk........',
      '................'], { k: '#3a2410', y: '#ffd23a' }, 'key');
    SPR.bossKey = mk([
      '................',
      '....kkkkkkk.....',
      '...kpppppppk....',
      '..kppkkkkkppk...',
      '..kpk.yyy.kpk...',
      '..kppkkkkkppk...',
      '...kpppppppk....',
      '.....kpppk......',
      '.....kpyyk......',
      '.....kpppkkk....',
      '.....kpyyyyyk...',
      '.....kpppkkk....',
      '.....kpyyyyk....',
      '.....kpppkk.....',
      '......kkk.......',
      '................'], { k: '#2a1040', p: '#c060ff', y: '#ffd23a' }, 'bkey');
    // bomba
    SPR.bomb = shape(16, 16, (x, y) => { const dx = x + 0.5 - 8, dy = y + 0.5 - 9.5; return dx * dx + dy * dy <= 30 || (x >= 7 && x <= 8 && y >= 2 && y <= 4); },
      (x, y) => { if (y <= 4) return y <= 2 ? '#ffd23a' : '#8a7a6a'; const dx = x + 0.5 - 8, dy = y + 0.5 - 9.5; if (dx < -1 && dy < -1 && dx * dx + dy * dy < 9) return '#8a8ab0'; return '#2a2a48'; });
    SPR.bombRed = G.tint(SPR.bomb, 'rgba(255,60,40,0.6)');
    // poção
    SPR.potion = mk([
      '................',
      '......kkkk......',
      '......kwwk......',
      '.......kk.......',
      '......kssk......',
      '.....kwrrrk.....',
      '....kwrrrrrk....',
      '...kwrrrrrrrk...',
      '...kwrrRrrrrk...',
      '...krrrRRrrrk...',
      '...krrrrrrrrk...',
      '...krrrrrrrRk...',
      '....krrrrrRk....',
      '.....kkkkkk.....',
      '................',
      '................'], { k: '#1b1428', w: '#ffffff', r: '#ff3a5a', R: '#b01a3a', s: '#a07a4a' }, 'potion');
    // cogumelo super
    SPR.mushroom = mk([
      '................',
      '.....kkkkkk.....',
      '...kkrrwwrrkk...',
      '..krrrwwwwrrrk..',
      '.kwwrrwwwwrrwwk.',
      '.kwwwrrrrrrwwwk.',
      'krwwrrrrrrrrwwrk',
      'krrrrrwwwwrrrrrk',
      'krrrrwwwwwwrrrrk',
      '.kkrrwwwwwwrrkk.',
      '...kkttttttkk...',
      '...kttkttkttk...',
      '...kttkttkttk...',
      '...kttttttttk...',
      '....kkkkkkkk....',
      '................'], { k: '#1b1428', r: '#e83a2a', w: '#ffffff', t: '#f8e0b0' }, 'mush');
    SPR.mushroomG = mk([
      '................',
      '.....kkkkkk.....',
      '...kkggwwggkk...',
      '..kgggwwwwgggk..',
      '.kwwggwwwwggwwk.',
      '.kwwwggggggwwwk.',
      'kgwwggggggggwwgk',
      'kgggggwwwwgggggk',
      'kggggwwwwwwggggk',
      '.kkggwwwwwwggkk.',
      '...kkttttttkk...',
      '...kttkttkttk...',
      '...kttkttkttk...',
      '...kttttttttk...',
      '....kkkkkkkk....',
      '................'], { k: '#1b1428', g: '#3ac04a', w: '#ffffff', t: '#f8e0b0' }, 'mushg');
    // estrela
    const starMask = (x, y) => {
      const px = x + 0.5 - 8, py = y + 0.5 - 8.5;
      const ang = Math.atan2(py, px) + Math.PI / 2, r = Math.hypot(px, py);
      const k = (ang / (Math.PI * 2 / 5)) % 1; const t = Math.abs(k - 0.5) * 2;
      const lim = 3.2 + t * 4.4; return r <= lim;
    };
    SPR.star = shape(16, 16, starMask, (x, y) => ((x === 6 || x === 9) && (y === 7 || y === 8) ? '#1b1428' : (x < 7 && y < 7 ? '#fffbd0' : '#ffd23a')), '#a05a10');
    // botas de salto
    SPR.boots = mk([
      '................',
      '..ww............',
      '.wwwk...........',
      '.wwwwk...kkkk...',
      '..wwwwk.kbbbbk..',
      '...wwwk.kbbbbk..',
      '.....kk.kbbbbk..',
      '........kbbbbk..',
      '........kbyybk..',
      '........kbbbbk..',
      '.......kbbbbbk..',
      '.....kkbbbbbbk..',
      '....kbbbbbbbbk..',
      '....kBBBBBBBBk..',
      '....kkkkkkkkkk..',
      '................'], { k: '#1b1428', b: '#c0602a', B: '#7a3a1a', y: '#ffd23a', w: '#ffffff' }, 'boots');
    // canhão de raio (braço)
    SPR.beamItem = mk([
      '................',
      '................',
      '.....kkkkkk.....',
      '...kkoooooOkk...',
      '..koooooooooOk..',
      '.kooYYooooooOOk.',
      '.koYYoookkkkkkk.',
      '.kooooook.c.c.k.',
      '.koooooookkkkkkk',
      '.kOooooooooooOk.',
      '..kOOooooooOOk..',
      '...kkOOOOOOkk...',
      '.....kkkkkk.....',
      '................',
      '................',
      '................'], { k: '#1b1428', o: '#ff9a2a', O: '#c05a1a', Y: '#fff0a0', c: '#7ae4ff' }, 'beam');
    // traje térmico
    SPR.suit = mk([
      '................',
      '....kkkkkkkk....',
      '...kooooooook...',
      '..kooggggggook..',
      '..kogGGGGGGgok..',
      '..kogGggggGgok..',
      'kkkooggggggookkk',
      'kyykooooooookyyk',
      'kyyykoooooookyyk',
      'kyyykoorroookyyk',
      '.kkkkooooooookk.',
      '....kooooooook..',
      '....kookkkkook..',
      '....kook..kook..',
      '....kkkk..kkkk..',
      '................'], { k: '#1b1428', o: '#ff9a2a', g: '#5aff8a', G: '#c0ffd0', y: '#ffd23a', r: '#ff3a3a' }, 'suit');
    // pergaminho (giro)
    SPR.scroll = mk([
      '................',
      '................',
      '..kkkkkkkkkkkk..',
      '.kWwwwwwwwwwwWk.',
      '.kWkkkkkkkkkkWk.',
      '..kwwwwwwwwwwk..',
      '..kwrrwwrrrwwk..',
      '..kwwwwwwwwwwk..',
      '..kwrrrwwrrwwk..',
      '..kwwwwwwwwwwk..',
      '..kwrrwrrrwwwk..',
      '.kWkkkkkkkkkkWk.',
      '.kWwwwwwwwwwwWk.',
      '..kkkkkkkkkkkk..',
      '................',
      '................'], { k: '#3a2410', w: '#f8ecc8', W: '#c0a070', r: '#7a5a3a' }, 'scroll');
    // espada (ícone)
    SPR.swordIcon = mk([
      '..............kk',
      '.............kwk',
      '............kwck',
      '...........kwck.',
      '..........kwck..',
      '.........kwck...',
      '........kwck....',
      '...kk..kwck.....',
      '...kykkwck......',
      '....kyyck.......',
      '.....kyyk.......',
      '....kbkyyk......',
      '...kbk.kyyk.....',
      '..kbk...kk......',
      '..kk............',
      '................'], { k: '#1b1428', w: '#ffffff', c: '#a0b0c8', y: '#ffd23a', b: '#7a4a2a' }, 'sword');
    SPR.armorIcon = mk([
      '................',
      '..kkk......kkk..',
      '.kbbbkkkkkkbbbk.',
      '.kbbbbwwwwbbbbk.',
      '.kbbbbbwwbbbbbk.',
      '..kkbbbbbbbbkk..',
      '...kbbbbbbbbk...',
      '...kbbbyybbbk...',
      '...kbbbyybbbk...',
      '...kbbbbbbbbk...',
      '...kBbbbbbbBk...',
      '....kBBBBBBk....',
      '.....kkkkkk.....',
      '................',
      '................',
      '................'], { k: '#1b1428', b: '#a0a8c0', B: '#6a7090', w: '#ffffff', y: '#ffd23a' }, 'armor');
    SPR.bagIcon = mk([
      '................',
      '......kkkk......',
      '.....kyyyyk.....',
      '......kkkk......',
      '.....kbbbbk.....',
      '....kbbbbbbk....',
      '...kbbbbbbbbk...',
      '...kbbbkkbbbk...',
      '..kbbbkbbkbbbk..',
      '..kbbbkbbbbbbk..',
      '..kbbbbkkbbbbk..',
      '..kbbbbbbkbbbk..',
      '..kbbbkbbkbbbk..',
      '...kbbbkkbbbk...',
      '....kkkkkkkk....',
      '................'], { k: '#1b1428', b: '#a07a4a', y: '#ffd23a' }, 'bag');
    // cristais (6 cores)
    const cc = { media: ['#7aff8a', '#2ab04a'], mediana: ['#7ae4ff', '#2a8ab0'], dispersao: ['#ffe07a', '#c0901a'], prob: ['#ff8a7a', '#c03a2a'], distrib: ['#e0e8ff', '#7a8ac0'], amostra: ['#e09aff', '#8a3ac0'] };
    for (const k in cc) {
      const [c1, c2] = cc[k];
      SPR['crystal_' + k] = shape(16, 16, (x, y) => { const dx = Math.abs(x + 0.5 - 8), dy = y + 0.5; if (dy < 1 || dy > 15) return false; return dy < 6 ? dx <= (dy - 0.5) * 0.9 + 1 : dx <= (15 - dy) * 0.6 + 0.5; },
        (x, y) => { const dx = x + 0.5 - 8; if (y < 6 && dx < 0) return '#ffffff'; if (dx < -1) return c1; if (dx > 1.5) return c2; return y < 7 ? c1 : c2; }, '#1b1428');
    }
    // baú
    const ch = { k: '#2a1408', b: '#a0602a', B: '#6a3a1a', y: '#ffd23a', Y: '#b08a1a', d: '#1b1010' };
    SPR.chest = mk([
      '................',
      '................',
      '..kkkkkkkkkkkk..',
      '.kbbbbbyybbbbbk.',
      '.kbBBBByyBBBBbk.',
      '.kbbbbbyybbbbbk.',
      '.kyyyyyyyyyyyyk.',
      '.kbbbbkyykbbbbk.',
      '.kbBBBkYYkBBBbk.',
      '.kbbbbbkkbbbbbk.',
      '.kbBBBByyBBBBbk.',
      '.kbbbbbyybbbbbk.',
      '.kyyyyyyyyyyyyk.',
      '.kkkkkkkkkkkkkk.',
      '................',
      '................'], ch, 'chest');
    SPR.chestOpen = mk([
      '................',
      '..kkkkkkkkkkkk..',
      '.kbBBBByyBBBBbk.',
      '.kyyyyyyyyyyyyk.',
      '.kddddddddddddk.',
      '.kddddddddddddk.',
      '.kyyyyyyyyyyyyk.',
      '.kbbbbbbbbbbbbk.',
      '.kbBBBBBBBBBBbk.',
      '.kbbbbbbbbbbbbk.',
      '.kbBBBByyBBBBbk.',
      '.kbbbbbyybbbbbk.',
      '.kyyyyyyyyyyyyk.',
      '.kkkkkkkkkkkkkk.',
      '................',
      '................'], ch, 'chestO');
    // bloco ?
    const qb = { k: '#3a2008', y: '#ffc02a', Y: '#ffe89a', o: '#c07a10', w: '#ffffff', d: '#7a4a10' };
    SPR.qblock0 = mk([
      'kkkkkkkkkkkkkkkk',
      'kYYYYYYYYYYYYYok',
      'kYdyyyyyyyyyydok',
      'kYyyyywwwwyyyyok',
      'kYyyywwddwwyyyok',
      'kYyyywwdywwdyyok',
      'kYyyyyddywwdyyok',
      'kYyyyyyywwddyyok',
      'kYyyyyywwddyyyok',
      'kYyyyyywwdyyyyok',
      'kYyyyyyyddyyyyok',
      'kYyyyyywwyyyyyok',
      'kYyyyyywwdyyyyok',
      'kYdyyyyyddyyydok',
      'kooooooooooooook',
      'kkkkkkkkkkkkkkkk'], qb, 'qb0');
    SPR.qblock1 = G.tint(SPR.qblock0, 'rgba(255,255,255,0.25)');
    SPR.qused = mk([
      'kkkkkkkkkkkkkkkk',
      'kbbbbbbbbbbbbbBk',
      'kbdbbbbbbbbbbdBk',
      'kbbbbbbbbbbbbbBk',
      'kbbbbbbbbbbbbbBk',
      'kbbbbbbbbbbbbbBk',
      'kbbbbbbbbbbbbbBk',
      'kbbbbbbbbbbbbbBk',
      'kbbbbbbbbbbbbbBk',
      'kbbbbbbbbbbbbbBk',
      'kbbbbbbbbbbbbbBk',
      'kbbbbbbbbbbbbbBk',
      'kbbbbbbbbbbbbbBk',
      'kbdbbbbbbbbbbdBk',
      'kBBBBBBBBBBBBBBk',
      'kkkkkkkkkkkkkkkk'], { k: '#2a1408', b: '#a0703a', B: '#6a4020', d: '#4a2a10' }, 'qused');
    SPR.brick = mk([
      'kkkkkkkkkkkkkkkk',
      'kbbbbbbkbbbbbbbk',
      'kbBBBBBkbBBBBBBk',
      'kkkkkkkkkkkkkkkk',
      'kbbbkbbbbbbkbbbk',
      'kBBBkbBBBBBkbBBk',
      'kkkkkkkkkkkkkkkk',
      'kbbbbbbkbbbbbbbk',
      'kbBBBBBkbBBBBBBk',
      'kkkkkkkkkkkkkkkk',
      'kbbbkbbbbbbkbbbk',
      'kBBBkbBBBBBkbBBk',
      'kkkkkkkkkkkkkkkk',
      'kbbbbbbkbbbbbbbk',
      'kbBBBBBkbBBBBBBk',
      'kkkkkkkkkkkkkkkk'], { k: '#3a1408', b: '#e0703a', B: '#a04a20' }, 'brick');
    // pote
    SPR.pot = mk([
      '................',
      '................',
      '.....kkkkkk.....',
      '....kbbbbbbk....',
      '.....kkkkkk.....',
      '....kbbbbbbk....',
      '...kbwbbbbbbk...',
      '..kbwbbbbbbbbk..',
      '..kbwbbBBbbbbk..',
      '..kbbbBbbBbbbk..',
      '..kbbbbbbbbbBk..',
      '..kbbbbbbbbBBk..',
      '...kbbbbbbBBk...',
      '....kkkkkkkk....',
      '................',
      '................'], { k: '#2a1408', b: '#c8784a', B: '#8a4a2a', w: '#f0b890' }, 'pot');
    // placa
    SPR.sign = mk([
      '................',
      '................',
      '.kkkkkkkkkkkkkk.',
      'kbbbbbbbbbbbbbbk',
      'kbddddbbdddddbBk',
      'kbbbbbbbbbbbbbBk',
      'kbdddbddddbddbBk',
      'kbbbbbbbbbbbbbBk',
      'kBBBBBBBBBBBBBBk',
      '.kkkkkkttkkkkkk.',
      '.......tt.......',
      '.......tt.......',
      '.......tt.......',
      '......kttk......',
      '.....kkkkkk.....',
      '................'], { k: '#2a1408', b: '#c8904a', B: '#8a5a2a', d: '#6a4020', t: '#7a4a20' }, 'sign');
    // tábua de lição
    SPR.tablet = mk([
      '................',
      '....kkkkkkkk....',
      '...kgggggggGk...',
      '..kgwwwwwwwwGk..',
      '..kgwkkwkwkwGk..',
      '..kgwwwwwwwwGk..',
      '..kgwkwkkwkwGk..',
      '..kgwwwwwwwwGk..',
      '..kgwkkkwkkwGk..',
      '..kgwwwwwwwwGk..',
      '..kgwkwkkkwwGk..',
      '..kgwwwwwwwwGk..',
      '..kGGGGGGGGGGk..',
      '.kkddddddddddkk.',
      'kddddddddddddddk',
      'kkkkkkkkkkkkkkkk'], { k: '#1b1428', g: '#a8b0c8', G: '#6a7090', w: '#d8f0ff', d: '#5a5a70' }, 'tablet');
    // pedra oráculo
    SPR.oracle = mk([
      '......kkkk......',
      '.....kggggk.....',
      '....kgggggGk....',
      '....kgwwwwGk....',
      '....kgwccwGk....',
      '...kgwcCCcwGk...',
      '...kgwcCCcwGk...',
      '...kggwccwgGk...',
      '...kgggwwggGk...',
      '...kgggggggGk...',
      '...kgcgggcgGk...',
      '...kggcgcggGk...',
      '...kgggcgggGk...',
      '...kgggggggGk...',
      '..kgggggggggGk..',
      '..kGGGGGGGGGGk..',
      '.kddddddddddddk.',
      'kddddddddddddddk',
      'kkkkkkkkkkkkkkkk'], { k: '#1b1428', g: '#8a8ab0', G: '#5a5a80', w: '#3a2a6a', c: '#7ae4ff', C: '#ffffff', d: '#4a4a60' }, 'oracle');
    // estátua sábia (guardiã de item)
    SPR.statue = mk([
      '.....kkkkkk.....',
      '....kggggggk....',
      '...kgggggggGk...',
      '...kgkkggkkGk...',
      '...kgcggggcGk...',
      '...kggggyyyGk...',
      '....kgggyyGk....',
      '..kkkgggggGkkk..',
      '.kgggggggggggGk.',
      'kgggkggggggkgggk',
      'kggk.kggggk.kggk',
      'kggk.kggggk.kggk',
      'kgggkggggggkgggk',
      '.kggggggggggggk.',
      '..kgggggggggGk..',
      '.kgggGkkkkGgggk.',
      '.kggGk....kGggk.',
      'kggggk....kggggk',
      'kddddddddddddddk',
      'kddddddddddddddk',
      'kkkkkkkkkkkkkkkk'], { k: '#1b1428', g: '#a89878', G: '#6a5a40', c: '#ff5a5a', y: '#e0c060', d: '#5a4a38' }, 'statue');
    // bloco empurrável
    SPR.block = mk([
      'kkkkkkkkkkkkkkkk',
      'kwwwwwwwwwwwwwgk',
      'kwggggggggggggGk',
      'kwgwwwwwwwwwwgGk',
      'kwgw........wgGk',
      'kwgw........wgGk',
      'kwgw........wgGk',
      'kwgw........wgGk',
      'kwgw........wgGk',
      'kwgw........wgGk',
      'kwgw........wgGk',
      'kwgw........wgGk',
      'kwgwwwwwwwwwwgGk',
      'kwggggggggggggGk',
      'kgGGGGGGGGGGGGGk',
      'kkkkkkkkkkkkkkkk'].map(r => r.replace(/\./g, 'm')), { k: '#1b1428', w: '#d8d0c0', g: '#a8a090', G: '#6a6458', m: '#8a8274' }, 'block');
    // placa de pressão
    SPR.plate = mk([
      '................',
      '..kkkkkkkkkkkk..',
      '.kggggggggggggk.',
      '.kgwwwwwwwwwwGk.',
      '.kgw........wGk.',
      '.kgw........wGk.',
      '.kgw........wGk.',
      '.kgw........wGk.',
      '.kgw........wGk.',
      '.kgw........wGk.',
      '.kgw........wGk.',
      '.kgw........wGk.',
      '.kgwwwwwwwwwwGk.',
      '.kGGGGGGGGGGGGk.',
      '..kkkkkkkkkkkk..',
      '................'].map(r => r.replace(/\./g, '.')), { k: '#1b1428', g: '#8a6a3a', G: '#5a4020', w: '#c09a5a' }, 'plate');
    SPR.plateOn = G.tint(SPR.plate, 'rgba(255,230,90,0.45)');
    // estação de salvamento (32x16)
    SPR.savepad = pix(32, 16, (x, y) => {
      const dx = (x + 0.5 - 16) / 15, dy = (y + 0.5 - 8) / 7; const r = dx * dx + dy * dy;
      if (r > 1) return null;
      if (r > 0.82) return '#1b1428';
      if (r > 0.62) return '#4a5a8a';
      if (r > 0.45) return '#7ae4ff';
      if (r > 0.3) return '#2a3a6a';
      return '#5ab0ff';
    });
    // sombra de buraco/abertura
    SPR.shadowBig = pix(32, 12, (x, y) => { const dx = (x + 0.5 - 16) / 15, dy = (y + 0.5 - 6) / 5; return dx * dx + dy * dy <= 1 ? 'rgba(0,0,0,0.35)' : null; });
    // cano (warp) 32x32
    SPR.pipe = pix(32, 32, (x, y) => {
      if (y < 12) { // borda
        if (x < 0 || x > 31) return null;
        if (y === 0 || y === 11 || x === 0 || x === 31) return '#0a2a10';
        if (y >= 3 && y <= 8 && x >= 4 && x <= 27) return y === 3 ? '#062010' : '#0a1408';
        if (x < 6) return '#9aff7a';
        if (x > 26) return '#1a7a2a';
        return '#3ad04a';
      }
      if (x < 2 || x > 29) return null;
      if (x === 2 || x === 29 || y === 31) return '#0a2a10';
      if (x < 7) return '#8af06a';
      if (x > 24) return '#1a7a2a';
      if (x > 9 && x < 12) return '#c0ffa0';
      return '#2ac03a';
    });
    // porta de templo, poço etc. são feitos em tiles.js (estruturas)
    // seta / cursor
    SPR.cursor = mk(['k.....', 'kyk...', 'kyyk..', 'kyyyk.', 'kyyk..', 'kyk...', 'k.....'], { k: '#1b1428', y: '#ffd84a' }, 'cursor');
    // ícones HUD pequenos (8x8)
    SPR.iconCoin = shape(8, 8, (x, y) => { const dx = (x + 0.5 - 4) / 3.2, dy = (y + 0.5 - 4) / 3.6; return dx * dx + dy * dy <= 1; }, (x) => (x < 3 ? '#fff6b0' : x > 4 ? '#d0901a' : '#ffd23a'), '#5a3a10');
    SPR.iconKey = mk(['..kkk...', '.kyyyk..', '.kykyk..', '.kyyyk..', '..kyk...', '..kyyk..', '..kyk...', '..kyyk..'], { k: '#3a2410', y: '#ffd23a' }, 'ikey');
    SPR.iconBomb = shape(8, 8, (x, y) => { const dx = x + 0.5 - 4, dy = y + 0.5 - 4.8; return dx * dx + dy * dy <= 8 || (x === 4 && y <= 1); }, (x, y) => (y <= 1 ? '#ffd23a' : x < 3 && y < 4 ? '#8a8ab0' : '#2a2a48'));
    SPR.iconPotion = mk(['..kkk...', '..kwk...', '..kkk...', '.krrrk..', 'krrrrrk.', 'krRrrrk.', 'krrrrRk.', '.kkkkk..'], { k: '#1b1428', w: '#fff', r: '#ff3a5a', R: '#b01a3a' }, 'ipot');
  }

  // explosões, faíscas
  function effects() {
    for (let f = 0; f < 4; f++) {
      const r = 6 + f * 4;
      SPR['boom' + f] = pix(40, 40, (x, y) => {
        const d = Math.hypot(x + 0.5 - 20, y + 0.5 - 20);
        const n = G.hash2(x, y, f) * 3;
        if (d > r + n) return null;
        if (f === 3 && d < r - 3) return null;
        if (d < r * 0.45) return f < 2 ? '#ffffff' : '#ffe87a';
        if (d < r * 0.75) return f < 2 ? '#ffe87a' : '#ff9a2a';
        return f < 3 ? '#ff6a2a' : '#7a6a6a';
      });
    }
    SPR.shot = shape(8, 8, (x, y) => Math.hypot(x + 0.5 - 4, y + 0.5 - 4) <= 3, (x, y) => (Math.hypot(x + 0.5 - 4, y + 0.5 - 4) < 1.6 ? '#ffffff' : '#ffd23a'), '#ff7a1a');
    SPR.bigshot = shape(14, 14, (x, y) => Math.hypot(x + 0.5 - 7, y + 0.5 - 7) <= 5.5, (x, y) => { const d = Math.hypot(x + 0.5 - 7, y + 0.5 - 7); return d < 2.5 ? '#ffffff' : d < 4 ? '#c0f0ff' : '#5ab0ff'; }, '#2a4aa0');
    SPR.rock = shape(8, 8, (x, y) => Math.hypot(x + 0.5 - 4, y + 0.5 - 4) <= 3.2, (x, y) => (x < 4 && y < 4 ? '#c0b0a0' : '#7a6a5a'), '#2a2020');
    SPR.fireball = shape(10, 10, (x, y) => Math.hypot(x + 0.5 - 5, y + 0.5 - 5) <= 4, (x, y) => { const d = Math.hypot(x + 0.5 - 5, y + 0.5 - 5); return d < 1.8 ? '#ffffff' : d < 3 ? '#ffe07a' : '#ff6a2a'; }, '#a01a10');
    SPR.orb = shape(10, 10, (x, y) => Math.hypot(x + 0.5 - 5, y + 0.5 - 5) <= 4, (x, y) => { const d = Math.hypot(x + 0.5 - 5, y + 0.5 - 5); return d < 1.8 ? '#ffffff' : d < 3 ? '#f0a0ff' : '#a03ad0'; }, '#3a0a5a');
    SPR.snowball = shape(10, 10, (x, y) => Math.hypot(x + 0.5 - 5, y + 0.5 - 5) <= 4, (x, y) => (x < 5 && y < 5 ? '#ffffff' : '#c8e0f0'), '#4a6a8a');
    SPR.web = shape(10, 10, (x, y) => Math.hypot(x + 0.5 - 5, y + 0.5 - 5) <= 4, (x, y) => ((x + y) % 3 === 0 ? '#ffffff' : '#c0c0d0'), '#6a6a80');
    SPR.sparkle = mk(['..w..', '..w..', 'wwyww', '..w..', '..w..'], { w: '#ffffff', y: '#ffd84a' }, 'spark');
  }

  G.gfx = {
    init() {
      // herói Sigma
      humanoid('hero', { h: '#7a4420', H: '#4f2a14', a: '#e0303a', c: '#2f7fe0', C: '#1d4c9a', y: '#f0c040', p: '#3a2f5a', f: '#6b3d22' });
      humanoid('hero_suit', { h: '#7a4420', H: '#4f2a14', a: '#ffd23a', c: '#ff8a2a', C: '#c05a1a', y: '#5aff8a', p: '#c05a1a', f: '#7a3a1a' });
      // NPCs
      humanoid('gauss', { h: '#e8e8f0', H: '#b0b0c0', a: '#ffd84a', c: '#6a3aa8', y: '#ffd84a', p: '#6a3aa8', f: '#4a2a6a', m: '#4a2a8a' }, ['beard', 'hat']);
      humanoid('florence', { h: '#4a2a18', H: '#2a1408', a: '#e03030', c: '#f4f0f0', y: '#e03030', p: '#f4f0f0', f: '#5a3a2a', m: '#ffffff', r: '#e03030' }, ['hairLong', 'nurse']);
      humanoid('mendel', { h: '#2a1a10', H: '#1a0a04', a: '#2a8a3a', c: '#3aaa4a', y: '#8a5a2a', p: '#4a3a2a', f: '#3a2418', m: '#2a8a3a' }, ['cap']);
      humanoid('pascal', { h: '#3a2418', H: '#1a0a04', a: '#f4f0f0', c: '#8a1a2a', y: '#ffd23a', p: '#2a2030', f: '#1a1420', m: '#1a1a24', r: '#c02a3a' }, ['tophat']);
      humanoid('bernoulli', { h: '#a06a3a', H: '#6a4020', a: '#f0e0b0', c: '#3a6a9a', y: '#8a5a2a', p: '#3a3a5a', f: '#3a2418', m: '#e0c060' }, ['straw']);
      humanoid('galton', { h: '#c8c8c8', H: '#8a8a8a', a: '#c03a3a', c: '#4a6a4a', y: '#2a2a2a', p: '#3a3a3a', f: '#2a2020', m: '#3a3a3a', r: '#5a8a5a' }, ['beard', 'tophat']);
      humanoid('laplace', { h: '#5a3a1a', H: '#3a2410', a: '#8a6a3a', c: '#5a7a3a', y: '#3a2a1a', p: '#4a5a2a', f: '#3a2418', m: '#4a6a2a' }, ['hood']);
      humanoid('fisher', { h: '#c08040', H: '#8a5020', a: '#f0f0e0', c: '#3a5aa0', y: '#a06030', p: '#3a5aa0', f: '#5a3a1a', m: '#e8c868' }, ['straw', 'beard']);
      humanoid('quetelet', { h: '#3a2418', H: '#1a0a04', a: '#c03a3a', c: '#c08030', y: '#5a3a1a', p: '#8a5a2a', f: '#5a3a1a', m: '#f0e0b0', M: '#c03a3a' }, ['turban']);
      humanoid('nightingale', { h: '#e0b040', H: '#a07a20', a: '#5a8ad0', c: '#8ab0e0', y: '#ffffff', p: '#8ab0e0', f: '#4a3a5a' }, ['hairLong']);
      humanoid('kid1', { h: '#2a1a10', H: '#1a0a04', a: '#ffd23a', c: '#e05a2a', y: '#3a2a1a', p: '#3a3a6a', f: '#3a2418' });
      humanoid('kid2', { h: '#e0a040', H: '#a07020', a: '#ff9ae6', c: '#c04ab0', y: '#ffffff', p: '#c04ab0', f: '#4a2a3a' }, ['hairLong']);
      humanoid('villager1', { h: '#5a3a2a', H: '#3a2418', a: '#ffffff', c: '#a07a4a', y: '#5a3a1a', p: '#5a4a3a', f: '#3a2418' });
      humanoid('villager2', { h: '#1a1a1a', H: '#0a0a0a', a: '#e0e040', c: '#4a8a8a', y: '#2a4a4a', p: '#2a4a4a', f: '#1a2a2a' }, ['hairLong']);
      humanoid('guard', { h: '#6a6a80', H: '#4a4a60', a: '#3a5ad0', c: '#3a5ad0', y: '#ffd23a', p: '#2a3a7a', f: '#2a2a3a', m: '#a0a0b8', M: '#6a6a88' }, ['helmet']);
      humanoid('hermit', { h: '#d0d0d0', H: '#9a9a9a', a: '#7a5a3a', c: '#7a6a5a', y: '#5a4a3a', p: '#5a4a3a', f: '#3a2a1a', m: '#6a5a4a' }, ['beard', 'hood']);
      humanoid('viesNPC', { h: '#2a1040', H: '#1a0a2a', s: '#c8b0e0', S: '#9a80b8', e: '#ff3a3a', a: '#ff3a3a', c: '#3a1a5a', y: '#ffd23a', p: '#2a1040', f: '#1a0a2a', m: '#2a1040' }, ['hood']);
      enemies();
      items();
      effects();
      if (G.buildCast) G.buildCast();
      if (G.buildSprites) G.buildSprites();
      // sapo Bayes (NPC especial)
      SPR.bayes_down0 = mk([
        '................',
        '................',
        '..kkk....kkk....',
        '.kwwwk..kwwwk...',
        '.kwkkwkkwkkwk...',
        '.kgwwggggwwgk...',
        'kggggggggggggk..',
        'kgggkkkkkkgggk..',
        'kggggrrrrggggk..',
        '.kgggggggggGk...',
        '.kggyyyyyygGk...',
        'kggyyyyyyyygGk..',
        'kgGyyyyyyyyGGk..',
        '.kgGGkkkkGGGk...',
        'kggk......kggk..',
        'kkkk......kkkk..'].map(r => r.slice(0, 14) + '..'), { k: '#1b1428', w: '#ffffff', g: '#5aba4a', G: '#2a7a2a', y: '#e8e0a0', r: '#c03a3a' }, 'bayes');
      SPR.bayes_down1 = SPR.bayes_down0;
      if (G.sprWarn.length) console.warn('Sprites:', G.sprWarn);
    }
  };
})(window.G);
