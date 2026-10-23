'use strict';
// =====================================================================
//  Sprites em alta resolução (pixels de arte = 1/2 pixel lógico):
//  "boneco" parametrizado para herói e NPCs (3 direções × caminhada de
//  4 quadros + ataque + segurar item + retrato).
// =====================================================================
(function (G) {
  const SPR = G.spr;
  const C = G.col;
  const R5 = (c, s) => C.ramp(c, 5, s || 1);

  // ------------------------------------------------------------------
  //  Ferramentas de sombreamento de partes
  // ------------------------------------------------------------------
  // sombreia uma máscara como cilindro vertical (luz à esquerda/topo)
  function cyl(p, mask, ramp, bbox, o = {}) {
    const [x0, y0, x1, y1] = bbox;
    for (let y = Math.max(0, y0); y <= Math.min(p.h - 1, y1); y++) {
      let xl = -1, xr = -1;
      for (let x = x0; x <= x1; x++) if (mask(x, y)) { if (xl < 0) xl = x; xr = x; }
      if (xl < 0) continue;
      const span = Math.max(1, xr - xl);
      for (let x = xl; x <= xr; x++) {
        if (!mask(x, y)) continue;
        const u = (x - xl) / span;
        let i = 2;
        if (u < (o.hi || 0.22)) i = 3;
        if (u > (o.sh || 0.66)) i = 1;
        if (u > (o.sh2 || 0.9) && span > 3) i = 0;
        if (!mask(x, y - 1) && i >= 2 && !o.noTop) i = Math.min(4, i + 1);
        if (!mask(x, y + 1) && !o.noBottom) i = Math.max(0, i - 1);
        if (o.vgrad && y > y0 + (y1 - y0) * o.vgrad) i = Math.max(0, i - 1);
        p.px(x, y, ramp[Math.max(0, Math.min(ramp.length - 1, i))]);
      }
    }
  }
  // bisel simples: borda superior-esquerda clara, inferior-direita escura
  function bevel(p, mask, ramp, bbox) {
    const [x0, y0, x1, y1] = bbox;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (!mask(x, y)) continue;
      let i = 2;
      if (!mask(x - 1, y) || !mask(x, y - 1)) i = 3;
      if (!mask(x + 1, y) || !mask(x, y + 1)) i = 1;
      if (!mask(x + 1, y) && !mask(x, y + 1)) i = 0;
      p.px(x, y, ramp[i]);
    }
  }
  const inEll = (cx, cy, rx, ry) => (x, y) => { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; return dx * dx + dy * dy <= 1; };
  const inRR = (x0, y0, w, h, r) => (px, py) => {
    const qx = Math.max(x0 + r - (px + 0.5), 0, px + 0.5 - (x0 + w - r)), qy = Math.max(y0 + r - (py + 0.5), 0, py + 0.5 - (y0 + h - r));
    return qx * qx + qy * qy <= r * r + 0.01;
  };
  const inPoly = pts => (px, py) => {
    px += 0.5; py += 0.5; let c = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) c = !c;
    }
    return c;
  };
  const bboxOf = pts => { let a = 1e9, b = 1e9, c = -1e9, d = -1e9; for (const [x, y] of pts) { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); d = Math.max(d, y); } return [Math.floor(a) - 1, Math.floor(b) - 1, Math.ceil(c) + 1, Math.ceil(d) + 1]; };
  G.artTools = { cyl, bevel, inEll, inRR, inPoly, bboxOf };

  // ------------------------------------------------------------------
  //  BONECO
  // ------------------------------------------------------------------
  const DW = 48, DH = 56; // pixels de arte (24×28 lógicos)
  const SKIN = { claro: '#f6c9a0', medio: '#d9a072', moreno: '#a8693f', escuro: '#7a4a2c', osso: '#e8e2d0', verde: '#8ad07a', lilas: '#c8b0e0' };
  const SKIN_RAMP = {
    '#f6c9a0': ['#8a4a40', '#d68c6c', '#f6c9a0', '#ffe2c6', '#fff4e6'],
    '#d9a072': ['#6a3a2a', '#b47250', '#d9a072', '#eec29a', '#fadcc0'],
    '#a8693f': ['#4a2618', '#7e482a', '#a8693f', '#c88a5c', '#e2ac80'],
    '#7a4a2c': ['#2c160e', '#52301e', '#7a4a2c', '#9a6644', '#b88460'],
    '#e8e2d0': ['#5a5448', '#a8a090', '#e8e2d0', '#f8f4e8', '#ffffff']
  };

  // parâmetros de corpo por porte
  const BUILD = {
    adult: { headY: 21, headRx: 11, headRy: 10.5, torsoTop: 32, torsoBot: 46, shoulder: 7, hip: 9, legTop: 45, armLen: 9, s: 1 },
    kid: { headY: 25, headRx: 11, headRy: 10.5, torsoTop: 35, torsoBot: 47, shoulder: 6, hip: 7.5, legTop: 46, armLen: 7, s: 0.9 },
    stout: { headY: 21, headRx: 11, headRy: 10.5, torsoTop: 32, torsoBot: 47, shoulder: 8.5, hip: 11, legTop: 46, armLen: 9, s: 1 },
    tall: { headY: 17, headRx: 10.5, headRy: 10, torsoTop: 28, torsoBot: 45, shoulder: 7, hip: 8.5, legTop: 44, armLen: 11, s: 1 }
  };

  function doll(spec, view, frame, pose) {
    const p = new G.Paint(DW, DH);
    const B = BUILD[spec.build || 'adult'];
    const skinR = SKIN_RAMP[spec.skin || SKIN.claro] || R5(spec.skin || SKIN.claro, 0.8);
    const hairR = R5(spec.hair || '#7a4420');
    const tunR = R5(spec.tunic || '#2f7fe0');
    const trimR = R5(spec.trim || spec.tunic2 || C.shade(spec.tunic || '#2f7fe0', -0.4));
    const pantR = R5(spec.pants || '#3a2f5a');
    const bootR = R5(spec.boots || '#6b3d22');
    const beltR = R5(spec.belt || '#7a4a2a');
    const capeR = spec.cape ? R5(spec.cape) : null;
    const eyeC = spec.eyes || '#2a1e3a';
    const robe = !!spec.robe;
    // animação: a caminhada é uma fase contínua (4 quadros nos NPCs, 8 no herói)
    const walk = pose === 'walk' ? frame : -1, N = spec.walkN || 4;
    const sn = walk >= 0 ? Math.round(Math.sin(walk / N * Math.PI * 2 + Math.PI / 2) * 1000) / 1000 : 0; // 1 no quadro 0
    const cs = walk >= 0 ? Math.round(Math.cos(walk / N * Math.PI * 2 + Math.PI / 2) * 1000) / 1000 : 0;
    const bob = walk >= 0 ? (Math.abs(sn) < 0.5 ? -1 : 0) : (pose === 'idle' && frame === 1 ? -1 : 0);
    const atk = pose === 'atk', hold = pose === 'hold', hurt = pose === 'hurt';
    const atkF = atk ? frame : 1; // golpe em 3 tempos: 0 preparo, 1 golpe, 2 continuação
    const closedEyes = pose === 'blink' || hurt, talking = pose === 'talk';
    let part = 1;
    const next = () => (p.curPart = part++);
    const cx = 24;
    const Y = v => v + bob;

    // ---------- pernas e botas ----------
    function legsFront(back) {
      const lift = [Math.round(2 * Math.max(0, sn)), Math.round(2 * Math.max(0, -sn))];
      for (let s = 0; s < 2; s++) {
        const lx = s === 0 ? cx - 6 : cx + 2, up = lift[s];
        if (!robe) {
          next();
          const m = inRR(lx, Y(B.legTop), 5, 51 - B.legTop - up + (bob ? 1 : 0), 1.5);
          cyl(p, m, pantR, [lx - 1, Y(B.legTop) - 1, lx + 6, 56]);
        }
        next();
        const by = 50 - up;
        const m2 = inRR(lx - 1 + (s === 0 ? 0 : 0), by, 6, 6, 2.2);
        cyl(p, (x, y) => m2(x, y) && y <= 55, bootR, [lx - 2, by - 1, lx + 6, 56], { hi: 0.3 });
        if (!back) { p.px(lx + 1, by + 1, bootR[4]); }
      }
    }
    function legsSide() {
      // passada: perna próxima (direita da tela) e distante
      const st = sn;
      const legs = [{ off: -st * 3, far: true, k: -1 }, { off: st * 3, far: false, k: 1 }];
      for (const L of legs) {
        // no ciclo de 8 quadros, a perna que avança sobe um pouco
        const lx = cx - 3 + L.off, up = N > 4 ? Math.round(1.5 * Math.max(0, L.k * cs)) : 0;
        const rp = L.far ? pantR.map(c => C.shade(c, -0.25)) : pantR;
        const rb = L.far ? bootR.map(c => C.shade(c, -0.25)) : bootR;
        if (!robe) {
          next();
          const m = inRR(lx, Y(B.legTop), 5, 51 - B.legTop - up + (bob ? 1 : 0), 1.5);
          cyl(p, m, rp, [lx - 1, Y(B.legTop) - 1, lx + 6, 56]);
        }
        next();
        const by = 50 - up;
        const m2 = inRR(lx - 1, by, 8, 6, 2.2);
        cyl(p, (x, y) => m2(x, y) && y <= 55, rb, [lx - 2, by - 1, lx + 8, 56], { hi: 0.3 });
      }
    }

    // ---------- tronco ----------
    function torso(viewSide) {
      next();
      const t = Y(B.torsoTop), b = Y(B.torsoBot) + (robe ? 0 : 0);
      const sh = viewSide ? B.shoulder - 1.5 : B.shoulder, hp = viewSide ? B.hip - 2 : B.hip;
      const bottom = robe ? 53 : b;
      const flare = robe ? hp + 2 : hp;
      const pts = [[cx - sh + 1, t], [cx + sh - 1, t], [cx + sh, t + 2], [cx + flare, bottom], [cx - flare, bottom], [cx - sh, t + 2]];
      const m = inPoly(pts);
      cyl(p, m, tunR, bboxOf(pts), { hi: 0.25, sh: 0.62 });
      // barra/gola
      next();
      if (!viewSide && view === 'down') {
        // gola em V
        for (let y = t; y < t + 4; y++) for (let x = cx - 3 + (y - t); x <= cx + 3 - (y - t); x++) if (m(x, y)) p.px(x, y, trimR[3]);
      }
      for (let x = cx - flare - 1; x <= cx + flare + 1; x++) for (let y = bottom - 2; y <= bottom; y++) if (m(x, y)) p.px(x, y, ((x + y) & 1) && y === bottom - 2 ? trimR[3] : trimR[2]);
      // cinto
      if (!spec.noBelt) {
        next();
        const by = Y(B.torsoBot) - 5;
        for (let y = by; y < by + 2; y++) for (let x = cx - flare - 1; x <= cx + flare + 1; x++) if (m(x, y)) p.px(x, y, y === by ? beltR[3] : beltR[1]);
      }
      return { m, t, b: bottom, sh, flare };
    }
    // avental, faixa etc
    function apron(T) {
      if (!spec.apron) return;
      next();
      const ar = R5(spec.apron);
      for (let y = T.t + 4; y <= T.b - 1; y++) for (let x = cx - 4; x <= cx + 4; x++) if (T.m(x, y)) p.px(x, y, x < cx - 2 ? ar[3] : x > cx + 2 ? ar[1] : ar[2]);
    }

    // ---------- braços ----------
    function armFront(side, swing) {
      // side: -1 esquerda, +1 direita
      next();
      const sx = cx + side * (B.shoulder + 1.5);
      const top = Y(B.torsoTop) + 1;
      let hx = sx + side * 1, hy = top + B.armLen + swing;
      // golpe: a mão da espada atravessa o corpo (preparo → golpe → continuação)
      if (atk && view === 'down') [hx, hy] = side > 0 ? [[cx + 9, top + 3], [cx + 4, Y(B.torsoBot) + 1], [cx - 5, Y(B.torsoBot)]][atkF] : [[cx - 7, top + B.armLen - 1], [cx - 4, Y(B.torsoBot) + 1], [cx - 9, top + B.armLen - 3]][atkF];
      if (atk && view === 'up') [hx, hy] = side < 0 ? [[cx + 3, top - 5], [cx - 5, top - 3], [cx - 10, top + 2]][atkF] : [[cx + 7, top - 1], [cx + 5, top - 3], [cx + 6, top + 3]][atkF];
      if (hurt) { hx = cx + side * (B.shoulder + 6); hy = top + 2; }
      if (hold) { hx = cx + side * 9; hy = Y(B.headY) - 9; }
      const sleeve = spec.sleeves === 'short' ? skinR : (robe ? tunR : tunR);
      // manga como cápsula do ombro até o cotovelo/mão
      const pts = []; const n = 10;
      const ax = sx, ay = top + 1;
      const mask = (x, y) => {
        const px = x + 0.5, py = y + 0.5;
        const vx = hx - ax, vy = hy - ay, L2 = vx * vx + vy * vy;
        let t = L2 ? ((px - ax) * vx + (py - ay) * vy) / L2 : 0; t = Math.max(0, Math.min(1, t));
        const dx = px - (ax + vx * t), dy = py - (ay + vy * t);
        return dx * dx + dy * dy <= 2.6 * 2.6 && t < 0.86;
      };
      cyl(p, mask, spec.sleeves === 'short' ? skinR : sleeve, [Math.floor(Math.min(ax, hx)) - 4, Math.floor(Math.min(ay, hy)) - 4, Math.ceil(Math.max(ax, hx)) + 4, Math.ceil(Math.max(ay, hy)) + 4]);
      if (spec.bracer) bracer(mask, ax, ay, hx, hy, R5(spec.bracer));
      if (spec.sleeves === 'short') { // manga curta
        for (let y = ay - 2; y < ay + 3; y++) for (let x = ax - 3; x <= ax + 3; x++) if (mask(x, y)) p.px(x, y, tunR[x < ax ? 3 : 1]);
      }
      // mão
      next();
      p.ell(hx, hy, 2.4, 2.4, { ramp: skinR, ambient: 0.4 });
      return { hx, hy };
    }
    function armSide(near, swing) {
      next();
      const sx = cx + (near ? 0 : -1), top = Y(B.torsoTop) + 1;
      let hx = sx + swing, hy = top + B.armLen;
      if (atk) [hx, hy] = near ? [[cx + 3, top - 5], [cx + 10, top + 4], [cx + 9, top + 10]][atkF] : [[cx - 3, top + 2], [cx + 4, top + 4], [cx + 5, top + 8]][atkF];
      if (hurt) { hx = cx + (near ? -5 : -8); hy = top + 3; }
      if (hold) { hx = cx + (near ? 4 : -3); hy = Y(B.headY) - 9; }
      const ramp = near ? (spec.sleeves === 'short' ? skinR : tunR) : (spec.sleeves === 'short' ? skinR : tunR).map(c => C.shade(c, -0.3));
      const ax = sx, ay = top + 1;
      const mask = (x, y) => {
        const px = x + 0.5, py = y + 0.5;
        const vx = hx - ax, vy = hy - ay, L2 = vx * vx + vy * vy;
        let t = L2 ? ((px - ax) * vx + (py - ay) * vy) / L2 : 0; t = Math.max(0, Math.min(1, t));
        const dx = px - (ax + vx * t), dy = py - (ay + vy * t);
        return dx * dx + dy * dy <= 2.6 * 2.6 && t < 0.86;
      };
      cyl(p, mask, ramp, [Math.floor(Math.min(ax, hx)) - 4, Math.floor(Math.min(ay, hy)) - 4, Math.ceil(Math.max(ax, hx)) + 4, Math.ceil(Math.max(ay, hy)) + 4]);
      if (spec.bracer) bracer(mask, ax, ay, hx, hy, near ? R5(spec.bracer) : R5(spec.bracer).map(c => C.shade(c, -0.3)));
      next();
      p.ell(hx, hy, 2.4, 2.4, { ramp: near ? skinR : skinR.map(c => C.shade(c, -0.25)), ambient: 0.4 });
      return { hx, hy };
    }

    // bracelete (antebraço, perto da mão)
    function bracer(mask, ax, ay, hx, hy, br) {
      const vx = hx - ax, vy = hy - ay, L2 = vx * vx + vy * vy || 1;
      for (let y = Math.floor(Math.min(ay, hy)) - 4; y <= Math.ceil(Math.max(ay, hy)) + 4; y++) for (let x = Math.floor(Math.min(ax, hx)) - 4; x <= Math.ceil(Math.max(ax, hx)) + 4; x++) {
        if (!mask(x, y)) continue;
        const L = Math.sqrt(L2), d = 0.86 * L - ((x + 0.5 - ax) * vx + (y + 0.5 - ay) * vy) / L;
        if (d > 3.2 || d < 0) continue;
        const u = ((x + 0.5 - ax) * -vy + (y + 0.5 - ay) * vx) / L;
        p.px(x, y, d < 1 ? br[1] : u < -0.8 ? br[3] : br[2]);
      }
    }
    // glifo de pixels (ex.: Σ no peito/capa), com sombra 1px
    function glyph(rows, x0, y0, col, hi, shadow) {
      const on = (r, c) => rows[r] && rows[r][c] === '#';
      for (let r = 0; r <= rows.length; r++) for (let c = 0; c <= rows[0].length; c++) if (!on(r, c) && (on(r - 1, c) || on(r, c - 1) || on(r - 1, c - 1))) p.px(x0 + c, y0 + r, shadow);
      for (let r = 0; r < rows.length; r++) for (let c = 0; c < rows[r].length; c++) if (on(r, c)) p.px(x0 + c, y0 + r, r === 0 && hi ? hi : col);
    }
    // ---------- capa ----------
    function capeBack(T, wide) {
      if (!capeR) return;
      next();
      const t = Y(B.torsoTop), w = wide ? B.shoulder + 3 : B.shoulder;
      const sway = sn;
      const pts = [[cx - w + 1, t], [cx + w - 1, t], [cx + w + 2 + sway, 51], [cx - w - 2 + sway, 51]];
      cyl(p, inPoly(pts), capeR, bboxOf(pts), { hi: 0.2, sh: 0.6 });
    }

    // ---------- cabeça ----------
    const hcx = view === 'side' ? cx + 1 : cx, hcy = Y(B.headY);
    const hrx = B.headRx, hry = B.headRy;
    function head() {
      next();
      const shadeFace = (nx, ny) => {
        if (ny > 0.82 || nx > 0.72 || (nx > 0.5 && ny > 0.35)) return skinR[1];
        if (nx < -0.45 && ny < 0.1 && ny > -0.6) return skinR[3];
        return skinR[2];
      };
      if (view === 'down') {
        p.ell(hcx, hcy + 0.5, hrx - 0.5, hry - 0.5, shadeFace);
        if (!spec.noEars) { p.ell(hcx - hrx + 0.5, hcy + 2.5, 2, 2.6, skinR[2]); p.ell(hcx + hrx - 0.5, hcy + 2.5, 2, 2.6, skinR[1]); }
      } else if (view === 'side') {
        p.ell(hcx, hcy + 0.5, hrx - 0.5, hry - 0.5, (nx, ny) => (ny > 0.82 || (nx < -0.2 && ny > 0.4) ? skinR[1] : (nx > 0.3 && ny < 0 && ny > -0.6 ? skinR[3] : skinR[2])));
        if (!spec.noEars) p.ell(hcx - 3, hcy + 2.5, 2.2, 2.8, skinR[1]);
      } else {
        p.ell(hcx, hcy + 0.5, hrx - 0.5, hry - 0.5, skinR[1]);
      }
    }
    const tri = u => { const f = u - Math.floor(u); return 1 - Math.abs(2 * f - 1); };
    function hair() {
      const style = spec.hairStyle || 'short';
      const top = hcy - hry;
      if (style === 'bald') {
        if (view !== 'down') { next(); for (let y = hcy - 2; y <= hcy + 6; y++) for (let x = hcx - hrx; x <= hcx + hrx; x++) { const dx = (x + 0.5 - hcx) / hrx, dy = (y + 0.5 - hcy) / hry; if (dx * dx + dy * dy <= 1 && dx * dx + dy * dy > 0.55 && (view === 'up' || x < hcx - 2)) p.px(x, y, hairR[1]); } }
        return;
      }
      next();
      const inCap = (x, y, grow = 1) => { const dx = (x + 0.5 - hcx) / (hrx + grow), dy = (y + 0.5 - hcy + 0.5) / (hry + grow); return dx * dx + dy * dy <= 1; };
      // mechas extras (espetos) acima da cabeça
      const spikes = [];
      if (style === 'spiky') {
        if (view === 'down') spikes.push([[hcx - 10, hcy - 3], [hcx - 6, top + 1], [hcx - 13, top + 2]], [[hcx - 6, top + 2], [hcx + 1, top], [hcx - 5, top - 5]], [[hcx - 1, top + 1], [hcx + 6, top + 2], [hcx + 4, top - 5]], [[hcx + 5, top + 2], [hcx + 10, hcy - 3], [hcx + 13, top + 1]]);
        else if (view === 'up') spikes.push([[hcx - 10, hcy - 2], [hcx - 6, top + 1], [hcx - 13, top + 2]], [[hcx - 6, top + 2], [hcx + 1, top], [hcx - 4, top - 5]], [[hcx, top + 1], [hcx + 6, top + 2], [hcx + 5, top - 5]], [[hcx + 5, top + 2], [hcx + 10, hcy - 2], [hcx + 13, top + 1]], [[hcx - 6, hcy + 4], [hcx + 6, hcy + 4], [hcx, hcy + 9]], [[hcx - 10, hcy + 1], [hcx - 4, hcy + 5], [hcx - 9, hcy + 7]], [[hcx + 10, hcy + 1], [hcx + 4, hcy + 5], [hcx + 9, hcy + 7]]);
        else spikes.push([[hcx - 4, top + 1], [hcx + 3, top], [hcx - 3, top - 5]], [[hcx - 9, top + 3], [hcx - 3, top + 1], [hcx - 12, top - 1]], [[hcx - 11, hcy - 3], [hcx - 8, top + 3], [hcx - 15, top + 4]], [[hcx - 11, hcy + 1], [hcx - 9, hcy - 4], [hcx - 15, hcy - 1]], [[hcx + 2, top + 1], [hcx + 8, top + 3], [hcx + 7, top - 3]]);
      }
      const inSpike = (x, y) => spikes.some(s => inPoly(s)(x, y));
      let mask;
      if (view === 'down') {
        const fringe = x => {
          const ux = x + 0.5 - hcx;
          if (style === 'spiky') return hcy - 5 + 5 * tri((ux + 1.5) / 5.5) - Math.abs(ux) * 0.05;
          if (style === 'curly') return hcy - 4 + 2 * tri(ux / 4);
          if (style === 'long' || style === 'bob') return hcy - 3 + (Math.abs(ux) > hrx - 4 ? 6 : 0);
          // curto com risca lateral
          return hcy - 4 + (ux > 2 ? 1.5 * tri((ux - 2) / 4) : (ux < -6 ? 2 : 0));
        };
        const sideLen = style === 'long' ? hcy + 15 : style === 'bob' ? hcy + 7 : style === 'curly' ? hcy + 4 : hcy + 2;
        mask = (x, y) => {
          if (inSpike(x, y)) return true;
          const ax = Math.abs(x + 0.5 - hcx);
          if (inCap(x, y, style === 'curly' ? 2 : 1) && y + 0.5 < fringe(x)) return true;
          if (ax > hrx - 2.6 && ax <= hrx + 1.2 && y >= hcy - 5 && y <= sideLen) {
            // costeleta afinando
            if (style !== 'long' && style !== 'bob' && y > hcy - 1 && ax < hrx - 1.2) return false;
            return true;
          }
          if ((style === 'long') && ax > hrx - 1 && ax <= hrx + 2 && y > hcy && y <= sideLen) return true;
          return false;
        };
      } else if (view === 'up') {
        const len = style === 'long' ? hcy + 17 : style === 'bob' ? hcy + 9 : style === 'ponytail' ? hcy + 7 : hcy + 6;
        mask = (x, y) => {
          if (inSpike(x, y)) return true;
          const ax = Math.abs(x + 0.5 - hcx);
          if (inCap(x, y, style === 'curly' ? 2 : 1) && y <= len) return true;
          if (style === 'long' && ax <= hrx + 1 && y > hcy && y <= len) return true;
          return false;
        };
      } else {
        const len = style === 'long' ? hcy + 15 : style === 'bob' ? hcy + 8 : hcy + 4;
        mask = (x, y) => {
          if (inSpike(x, y)) return true;
          const ux = x + 0.5 - hcx;
          if (!inCap(x, y, style === 'curly' ? 2 : 1) && !(ux < -1 && y <= len && y >= hcy - 4 && ux >= -(hrx + 1))) return false;
          // franja na frente (direita)
          const fr = style === 'spiky' ? hcy - 5 + 5 * tri((ux + 1) / 5) : style === 'long' || style === 'bob' ? hcy - 3 : hcy - 4 + (ux > 6 ? 2 : 0);
          if (ux > 1.5) return y + 0.5 < fr;
          if (ux > -2.5) return y + 0.5 < hcy - 1;
          return y <= len;
        };
      }
      const bb = [Math.floor(hcx - hrx - 6), Math.floor(top - 7), Math.ceil(hcx + hrx + 6), Math.ceil(hcy + 19)];
      for (let y = bb[1]; y <= bb[3]; y++) for (let x = bb[0]; x <= bb[2]; x++) {
        if (!mask(x, y)) continue;
        const nx = Math.max(-1, Math.min(1, (x + 0.5 - hcx) / (hrx + 2))), ny = Math.max(-1, Math.min(1, (y + 0.5 - hcy) / (hry + 2)));
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
        let c = p.lit({ ramp: hairR, ambient: 0.35, contrast: 1.2, bias: 0.05 }, nx, ny, nz, x, y);
        // brilho em faixa (estilo 16-bit)
        const band = view === 'side' ? (Math.abs(ny + 0.5) < 0.08 && nx > -0.5 && nx < 0.35) : (Math.abs(ny + 0.5 - nx * 0.15) < 0.075 && nx > -0.62 && nx < 0.25);
        if (band && style !== 'curly') c = hairR[4];
        // fios: linhas escuras sutis
        if (style !== 'curly' && view === 'up' && ((x - hcx + 40) % 4 === 0) && y > hcy - 5) c = hairR[Math.max(0, hairR.indexOf(c) - 1)] || c;
        if (style === 'curly' && (((x * 7 + y * 5) % 9) === 0)) c = hairR[3];
        if (style === 'curly' && (((x * 3 + y * 11) % 13) === 0)) c = hairR[1];
        if (!mask(x, y + 1) && !mask(x + 1, y)) c = hairR[1];
        p.px(x, y, c);
      }
      // rabo de cavalo / coque
      if (style === 'ponytail' && view !== 'down') { next(); const px0 = view === 'side' ? hcx - hrx - 1 : hcx; p.ell(px0, hcy + 7, 3, 6.5, { ramp: hairR, ambient: 0.35 }); p.ell(px0, hcy + 1, 2.5, 2, hairR[0]); }
      if (style === 'bun') { next(); p.ell(hcx + (view === 'side' ? -6 : 0), top + 0.5, 4.5, 4, { ramp: hairR, ambient: 0.35 }); }
    }
    function face() {
      // detalhes do rosto (depois dos contornos)
      if (spec.skeleton && view !== 'up') {
        const so = '#2a2030', gl = spec.eyeGlow || '#ff3030';
        if (view === 'down') {
          for (const s of [-1, 1]) { const ex = hcx + s * 4 - 1; p.rect(ex - 1, hcy, 4, 4, so); p.px(ex + (s < 0 ? 1 : 0), hcy + 1, gl); p.px(ex + (s < 0 ? 1 : 0), hcy + 2, C.shade(gl, -0.3)); }
          p.px(hcx - 1, hcy + 5, so); p.px(hcx, hcy + 5, so);
          for (let i = -3; i <= 2; i++) p.px(hcx + i, hcy + 8, (i & 1) ? so : '#c8c2b0');
        } else {
          const ex = hcx + 4; p.rect(ex, hcy, 4, 4, so); p.px(ex + 2, hcy + 1, gl); p.px(hcx + 9, hcy + 5, so);
          for (let i = 3; i <= 8; i++) p.px(hcx + i, hcy + 8, (i & 1) ? so : '#c8c2b0');
        }
        return;
      }
      if (view === 'down') {
        const ey = hcy + 1;
        for (const s of [-1, 1]) {
          const ex = hcx + s * 4 - (s > 0 ? 1 : 0);
          if (hurt) { const o = s < 0 ? 0 : 1; p.px(ex + o, ey + 1, eyeC); p.px(ex + 1 - o, ey + 2, eyeC); p.px(ex + o, ey + 3, eyeC); continue; } // > <
          if (spec.eyeStyle === 'closed' || closedEyes) { p.px(ex - 1, ey + 2, eyeC); p.px(ex, ey + 2, eyeC); p.px(ex + 1, ey + 2, eyeC); continue; }
          p.rect(ex, ey, 2, 4, eyeC);
          p.px(ex + (s < 0 ? 0 : 1), ey, '#ffffff');
          if (spec.eyeGlow) { p.px(ex, ey + 1, spec.eyeGlow); p.px(ex + 1, ey + 1, spec.eyeGlow); }
          // sobrancelha
          if (spec.brows !== false) { const bc = spec.browColor || hairR[0]; p.px(ex - (s < 0 ? 1 : 0), ey - 2, bc); p.px(ex + (s < 0 ? 1 : 1), ey - 2, bc); p.px(ex + (s < 0 ? 2 : -1), ey - 2 + (spec.angry ? 1 : 0), bc); }
        }
        // bochechas
        if (!spec.noBlush) { p.px(hcx - 7, hcy + 6, C.mix(skinR[2], '#ff6a6a', 0.45)); p.px(hcx - 6, hcy + 6, C.mix(skinR[2], '#ff6a6a', 0.3)); p.px(hcx + 6, hcy + 6, C.mix(skinR[2], '#ff6a6a', 0.45)); p.px(hcx + 5, hcy + 6, C.mix(skinR[2], '#ff6a6a', 0.3)); }
        // boca (aberta nos retratos falando)
        if (talking) { for (const dx of [-2, -1, 0, 1]) { p.px(hcx + dx, hcy + 7, dx === -2 || dx === 1 ? C.shade(skinR[1], -0.3) : '#3a1018'); if (dx > -2 && dx < 1) p.px(hcx + dx, hcy + 8, '#c85a6a'); } }
        else { p.px(hcx - 1, hcy + 7, C.shade(skinR[1], -0.4)); p.px(hcx, hcy + 7, C.shade(skinR[1], -0.4)); }
        if (spec.mustache) { const mc = hairR[1]; for (let i = -3; i <= 2; i++) p.px(hcx + i, hcy + 6, mc); p.px(hcx - 4, hcy + 7, mc); p.px(hcx + 3, hcy + 7, mc); }
        if (spec.glasses) { const gc = spec.glasses === true ? '#2a2a3a' : spec.glasses; for (const s of [-1, 1]) { const ex = hcx + s * 4 - (s > 0 ? 1 : 0); for (let i = -1; i <= 2; i++) { p.px(ex + i, hcy - 0, gc); p.px(ex + i, hcy + 5, gc); } p.px(ex - 2, hcy + 1, gc); p.px(ex - 2, hcy + 4, gc); p.px(ex + 3, hcy + 1, gc); p.px(ex + 3, hcy + 4, gc); } p.px(hcx - 1, hcy + 1, gc); p.px(hcx, hcy + 1, gc); }
      } else if (view === 'side') {
        const ex = hcx + 5, ey = hcy + 1;
        if (spec.eyeStyle === 'closed' || closedEyes) { p.px(ex, ey + 2, eyeC); p.px(ex + 1, ey + 2, eyeC); }
        else { p.rect(ex, ey, 2, 4, eyeC); p.px(ex + 1, ey, '#ffffff'); if (spec.eyeGlow) p.px(ex, ey + 1, spec.eyeGlow); }
        if (spec.brows !== false) { const bc = spec.browColor || hairR[0]; p.px(ex, ey - 2, bc); p.px(ex + 1, ey - 2, bc); p.px(ex + 2, ey - 2 + (spec.angry ? 1 : 0), bc); }
        // nariz
        p.px(hcx + hrx - 0.5, hcy + 4, skinR[2]); p.px(hcx + hrx - 0.5, hcy + 5, skinR[1]);
        if (!spec.noBlush) p.px(hcx + 4, hcy + 6, C.mix(skinR[2], '#ff6a6a', 0.45));
        p.px(hcx + 7, hcy + 8, C.shade(skinR[1], -0.4));
        if (spec.glasses) { const gc = spec.glasses === true ? '#2a2a3a' : spec.glasses; for (let i = -1; i <= 2; i++) { p.px(ex + i, hcy, gc); p.px(ex + i, hcy + 5, gc); } p.px(ex - 2, hcy + 2, gc); p.px(ex - 4, hcy + 2, gc); p.px(ex - 3, hcy + 2, gc); }
      }
    }
    // ---------- barba ----------
    function beard() {
      if (!spec.beard) return;
      next();
      const br = R5(spec.beard);
      if (view === 'down') {
        const pts = [[hcx - 7, hcy + 3], [hcx + 7, hcy + 3], [hcx + 6, hcy + 10], [hcx + 2, hcy + 15 + (spec.longBeard ? 5 : 0)], [hcx - 2, hcy + 15 + (spec.longBeard ? 5 : 0)], [hcx - 6, hcy + 10]];
        const m = inPoly(pts);
        bevel(p, (x, y) => m(x, y) && !(y >= hcy + 6 && y <= hcy + 7 && Math.abs(x + 0.5 - hcx) < 2.5), br, bboxOf(pts));
      } else if (view === 'side') {
        const pts = [[hcx + 1, hcy + 3], [hcx + 9, hcy + 5], [hcx + 7, hcy + 12 + (spec.longBeard ? 4 : 0)], [hcx + 2, hcy + 10]];
        bevel(p, inPoly(pts), br, bboxOf(pts));
      }
    }
    // ---------- chapéus ----------
    function hat() {
      const H = spec.hat; if (!H) return;
      next();
      const hr = R5(H.color || '#4a2a8a'), h2 = R5(H.color2 || C.shade(H.color || '#4a2a8a', 0.5));
      const top = hcy - hry;
      const side = view === 'side';
      const ox = side ? -1 : 0;
      if (H.type === 'wizard') {
        const tip = view === 'side' ? [hcx - 8, top - 13] : [hcx + 3, top - 14];
        const pts = [[hcx - hrx - 1 + ox, hcy - 4], [hcx + hrx + 1 + ox, hcy - 4], tip];
        cyl(p, inPoly(pts), hr, bboxOf(pts), { hi: 0.3 });
        next();
        cyl(p, inRR(hcx - hrx - 4 + ox, hcy - 6, hrx * 2 + 8, 4, 2), hr.map(c => C.shade(c, -0.1)), [hcx - hrx - 6, hcy - 8, hcx + hrx + 6, hcy]);
        p.ell(hcx + 2 + ox, hcy - 10, 2, 2, h2[4]);
      } else if (H.type === 'tophat') {
        cyl(p, inRR(hcx - 7 + ox, top - 9, 14, 12, 1), hr, [hcx - 9, top - 11, hcx + 9, top + 4]);
        for (let x = hcx - 7 + ox; x < hcx + 7 + ox; x++) for (let y = top - 1; y < top + 1; y++) p.px(x, y, h2[2]);
        next();
        cyl(p, inRR(hcx - hrx - 2 + ox, top + 2, hrx * 2 + 4, 3, 1.5), hr, [hcx - hrx - 4, top, hcx + hrx + 4, top + 6]);
      } else if (H.type === 'cap') {
        { const m = inEll(hcx + ox, hcy - 3, hrx + 1, hry - 1); for (let y = hcy - hry - 3; y < hcy - 3; y++) for (let x = hcx - hrx - 3; x <= hcx + hrx + 3; x++) if (m(x, y)) { const nx = (x + 0.5 - hcx) / (hrx + 1), ny = (y + 0.5 - hcy + 3) / (hry - 1); p.px(x, y, p.lit({ ramp: hr, ambient: 0.35 }, nx, ny, Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)), x, y)); } }
        // aba
        next();
        if (view === 'down') cyl(p, inRR(hcx - hrx - 1, hcy - 4, hrx * 2 + 2, 3, 1.5), hr.map(c => C.shade(c, -0.2)), [hcx - hrx - 3, hcy - 6, hcx + hrx + 3, hcy]);
        else if (side) cyl(p, inRR(hcx + 2, hcy - 4, hrx + 3, 3, 1.5), hr.map(c => C.shade(c, -0.2)), [hcx, hcy - 6, hcx + hrx + 6, hcy]);
      } else if (H.type === 'straw') {
        p.ell(hcx + ox, top + 3, hrx - 1, 5, { ramp: hr, ambient: 0.3 });
        next();
        p.ell(hcx + ox, top + 6, hrx + 6, 3.2, { ramp: hr, ambient: 0.3 });
        next();
        for (let x = hcx - hrx + 1; x <= hcx + hrx - 1; x++) p.px(x + ox, top + 4, h2[1]);
      } else if (H.type === 'hood') {
        const m = (x, y) => { const dx = (x + 0.5 - hcx - ox) / (hrx + 2.5), dy = (y + 0.5 - hcy + 1) / (hry + 2.5); return dx * dx + dy * dy <= 1 && y < hcy + 9; };
        const face = view === 'up' ? () => false : (x, y) => { const dx = (x + 0.5 - hcx - (side ? 3 : 0)) / (hrx - 2.5), dy = (y + 0.5 - hcy - 2) / (hry - 3.5); return dx * dx + dy * dy <= 1; };
        for (let y = hcy - hry - 4; y < hcy + 10; y++) for (let x = hcx - hrx - 4; x <= hcx + hrx + 4; x++) {
          if (!m(x, y) || face(x, y)) continue;
          const nx = (x + 0.5 - hcx) / (hrx + 2.5), ny = (y + 0.5 - hcy) / (hry + 2.5);
          p.px(x, y, p.lit({ ramp: hr, ambient: 0.35 }, nx, ny, Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)), x, y));
        }
        if (view !== 'up') for (let y = hcy - hry; y < hcy + 9; y++) for (let x = hcx - hrx - 2; x <= hcx + hrx + 2; x++) if (face(x, y) && !face(x, y - 1) && m(x, y - 1)) p.px(x, y, hr[0]);
      } else if (H.type === 'helmet') {
        const m = (x, y) => { const dx = (x + 0.5 - hcx - ox) / (hrx + 1.5), dy = (y + 0.5 - hcy + 1) / (hry + 1.5); return dx * dx + dy * dy <= 1 && y < hcy + (view === 'up' ? 9 : 2); };
        for (let y = hcy - hry - 3; y < hcy + 10; y++) for (let x = hcx - hrx - 3; x <= hcx + hrx + 3; x++) {
          if (!m(x, y)) continue;
          const nx = (x + 0.5 - hcx) / (hrx + 1.5), ny = (y + 0.5 - hcy) / (hry + 1.5);
          let c = p.lit({ ramp: hr, ambient: 0.3, contrast: 1.3 }, nx, ny, Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)), x, y);
          if (Math.abs(x + 0.5 - hcx - ox) < 1 && view !== 'side') c = h2[3];
          p.px(x, y, c);
        }
        if (view !== 'up') { // viseira / proteção do nariz
          next();
          if (H.visor) { for (let y = hcy - 1; y <= hcy + 6; y++) for (let x = hcx - hrx + 1; x <= hcx + hrx - 1; x++) { const dx = (x + 0.5 - hcx) / hrx, dy = (y + 0.5 - hcy) / hry; if (dx * dx + dy * dy <= 1 && (!side || x > hcx - 3)) p.px(x, y, (y === hcy + 2 || y === hcy + 3) && Math.abs(x + 0.5 - hcx - (side ? 4 : 0)) < 7 && (Math.abs(x + 0.5 - hcx) > 1 || side) ? '#140c20' : hr[(x < hcx) ? 3 : 2]); } }
          else for (let y = hcy + 1; y <= hcy + 5; y++) p.px(side ? hcx + hrx - 2 : hcx - 0.5, y, hr[3]);
        }
        if (H.plume) { next(); const pr = R5(H.plume); p.ell(hcx + (side ? -4 : 0), hcy - hry - 3, 3, 4, { ramp: pr, ambient: 0.4 }); p.ell(hcx + (side ? -7 : 0), hcy - hry - 1 + (side ? 2 : -2), 2.5, 3.5, { ramp: pr, ambient: 0.4 }); }
      } else if (H.type === 'nurse') {
        cyl(p, inRR(hcx - 6 + ox, top - 2, 12, 6, 1.5), hr, [hcx - 8, top - 4, hcx + 8, top + 6]);
        if (view !== 'up') { next(); p.rect(hcx - 1 + ox, top - 1, 2, 4, h2[2]); p.rect(hcx - 2 + ox, top, 4, 2, h2[2]); }
      } else if (H.type === 'turban') {
        const m = (x, y) => { const dx = (x + 0.5 - hcx - ox) / (hrx + 1.5), dy = (y + 0.5 - hcy + 3) / (hry - 1); return dx * dx + dy * dy <= 1 && y < hcy - 1; };
        for (let y = hcy - hry - 4; y < hcy; y++) for (let x = hcx - hrx - 3; x <= hcx + hrx + 3; x++) {
          if (!m(x, y)) continue;
          const band = ((y + Math.floor((x - hcx) / 3)) & 3) === 0;
          const nx = (x + 0.5 - hcx) / (hrx + 1.5), ny = (y + 0.5 - hcy + 3) / (hry - 1);
          p.px(x, y, band ? hr[1] : p.lit({ ramp: hr, ambient: 0.35 }, nx, ny, Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)), x, y));
        }
        if (view !== 'up') { next(); p.ell(hcx + ox + (side ? 4 : 0), hcy - 5, 2, 2, { ramp: h2, ambient: 0.4 }); }
      } else if (H.type === 'bandana') {
        for (let y = hcy - 4; y <= hcy - 2; y++) for (let x = hcx - hrx - 1; x <= hcx + hrx + 1; x++) { const dx = (x + 0.5 - hcx) / (hrx + 1), dy = (y + 0.5 - hcy + 0.5) / (hry + 1); if (dx * dx + dy * dy <= 1) p.px(x, y, hr[y === hcy - 4 ? 3 : 2]); }
        if (view !== 'down') { next(); const kx = view === 'side' ? hcx - hrx - 1 : hcx; p.rect(kx - 1, hcy - 3, 3, 2, hr[1]); p.line(kx, hcy - 2, kx - 3, hcy + 4, hr[1], 2); }
      } else if (H.type === 'crown') {
        for (let x = hcx - 6; x <= hcx + 6; x++) { const sp = ((x - hcx + 6) % 4 === 0) ? 4 : 0; for (let y = top - 3 - sp; y <= top + 1; y++) p.px(x + ox, y, y === top + 1 ? hr[1] : x < hcx ? hr[3] : hr[2]); }
        next(); p.px(hcx + ox, top - 1, '#ff3a5a'); p.px(hcx - 4 + ox, top - 1, '#3a8aff');
      } else if (H.type === 'beret') {
        p.ell(hcx - 1 + ox, top + 2, hrx + 1.5, 5, { ramp: hr, ambient: 0.35 });
        next(); p.px(hcx + ox, top - 3, hr[1]); p.px(hcx + ox, top - 4, hr[1]);
      }
    }

    // ================= composição por vista =================
    let hand = { hx: 0, hy: 0 }, hand2;
    if (view === 'down') {
      const sw = sn * (N > 4 ? 1.4 : 1);
      if (capeR) capeBack(null, true);
      legsFront(false);
      const T = torso(false);
      apron(T);
      if (!hold) { hand2 = armFront(-1, -sw); hand = armFront(1, sw); }
      head(); hair(); beard(); hat();
      if (hold) { hand2 = armFront(-1, 0); hand = armFront(1, 0); }
    } else if (view === 'up') {
      const sw = sn * (N > 4 ? 1.4 : 1);
      hand2 = armFront(1, -sw);
      hand = armFront(-1, sw);
      legsFront(true);
      const T = torso(false);
      if (capeR) capeBack(T, false);
      head(); hair(); hat();
    } else {
      const sw = sn * 3;
      if (capeR) { next(); const t = Y(B.torsoTop); const sway = sn; const pts = [[cx - 2, t], [cx + 2, t], [cx - 4 + sway, 52], [cx - 11 + sway, 50]]; cyl(p, inPoly(pts), capeR, bboxOf(pts)); }
      hand2 = armSide(false, -sw);
      legsSide();
      const T = torso(true);
      apron(T);
      head(); hair(); beard(); hat();
      hand = armSide(true, sw);
    }
    // contornos
    p.innerLines({ front: true, kf: -0.6 });
    p.outline({ k: -0.78 });
    face();
    if (spec.emblem) {
      const er = R5(spec.emblem);
      if (view === 'down') glyph(['#####', '.#...', '..#..', '.#...', '#####'], cx - 2, Y(B.torsoTop) + 4, er[2], er[4], tunR[0]);
      if (view === 'up' && capeR) glyph(['#######', '.#.....', '..#....', '...#...', '..#....', '.#.....', '#######'], cx - 3, Y(B.torsoTop) + 6, spec.emblem2 ? R5(spec.emblem2)[2] : er[2], spec.emblem2 ? R5(spec.emblem2)[4] : er[4], capeR[0]);
    }
    return { p, hand, hand2 };
  }

  // gera todas as poses de um personagem
  const HAND = {};
  G.makeDoll = function (name, spec) {
    const views = ['down', 'up', 'side'];
    for (const v of views) {
      for (let f = 0; f < (spec.walkN || 4); f++) {
        const r = doll(spec, v, f, 'walk');
        SPR[name + '_' + v + f] = r.p.toCanvas();
      }
      const a = doll(spec, v, 1, 'atk');
      SPR[name + '_' + v + '_atk'] = a.p.toCanvas();
      HAND[name + '_' + v] = { x: a.hand.hx / 2, y: a.hand.hy / 2 };
      const s = doll(spec, v, 0, 'stand');
      SPR[name + '_' + v + '_stand'] = s.p.toCanvas();
      if (!spec.anims) continue;
      // herói e heroína: golpe em 3 tempos, respiração, piscada e dano
      for (const f of [0, 2]) {
        const r = doll(spec, v, f, 'atk');
        SPR[name + '_' + v + '_atk' + f] = r.p.toCanvas();
        HAND[name + '_' + v + '_atk' + f] = { x: r.hand.hx / 2, y: r.hand.hy / 2 };
      }
      SPR[name + '_' + v + '_atk1'] = SPR[name + '_' + v + '_atk'];
      HAND[name + '_' + v + '_atk1'] = HAND[name + '_' + v];
      SPR[name + '_' + v + '_idle0'] = SPR[name + '_' + v + '_stand'];
      SPR[name + '_' + v + '_idle1'] = doll(spec, v, 1, 'idle').p.toCanvas();
      SPR[name + '_' + v + '_blink'] = v === 'up' ? SPR[name + '_' + v + '_stand'] : doll(spec, v, 0, 'blink').p.toCanvas();
      SPR[name + '_' + v + '_hurt'] = doll(spec, v, 0, 'hurt').p.toCanvas();
    }
    SPR[name + '_hold'] = doll(spec, 'down', 0, 'hold').p.toCanvas();
    // retrato: cabeça ampliada (recorte)
    SPR[name + '_portrait'] = cropPortrait(SPR[name + '_down_stand'], spec);
    DOLLS[name] = spec;
    SPR[name + '_down0'] = SPR[name + '_down0'];
  };
  // retrato: recorte da cabeça ampliada
  const DOLLS = {};
  function cropPortrait(src, spec) {
    const top = Math.max(0, Math.round(BUILD[spec.build || 'adult'].headY - 15));
    const pc = G.canvas(36, 36); pc.getContext('2d').drawImage(src, 6, top, 36, 36, 0, 0, 36, 36); pc.lw = 18; pc.lh = 18; return pc;
  }
  // retratos dos diálogos com boca aberta (fala) e olhos fechados (piscada), gerados na primeira fala
  G.portraitVariants = name => {
    const spec = DOLLS[name]; if (!spec || SPR[name + '_portraitTalk']) return;
    SPR[name + '_portraitTalk'] = cropPortrait(doll(spec, 'down', 0, 'talk').p.toCanvas(), spec);
    SPR[name + '_portraitBlink'] = cropPortrait(SPR[name + '_down_blink'] || doll(spec, 'down', 0, 'blink').p.toCanvas(), spec);
  };
  G.dollHand = (name, view, atkF) => (atkF !== undefined && HAND[name + '_' + view + '_atk' + atkF]) || HAND[name + '_' + view] || { x: 12, y: 20 };
  G.DOLL_SKIN = SKIN;

  // ------------------------------------------------------------------
  //  Elenco
  // ------------------------------------------------------------------
  G.CAST = {
    hero: { walkN: 8, anims: true, skin: SKIN.claro, hair: '#8a4a1e', hairStyle: 'spiky', tunic: '#2f7fe0', trim: '#e8c04a', belt: '#8a5a2a', pants: '#3e3466', boots: '#7a4422', cape: '#d8343e', emblem: '#ffd84a', bracer: '#2ec8b8', eyes: '#1a3a5a' },
    hero_suit: { walkN: 8, anims: true, skin: SKIN.claro, hair: '#8a4a1e', hairStyle: 'spiky', tunic: '#ff8a2a', trim: '#5aff8a', belt: '#5a3a1a', pants: '#c05a1a', boots: '#7a3a1a', cape: '#ffd23a', emblem: '#fff4e0', emblem2: '#c0401a', bracer: '#5aff8a', eyes: '#1a3a5a' },
    // heroína: mesma família e equipamento do herói, cabelo longo com faixa
    heroina: { walkN: 8, anims: true, skin: SKIN.claro, hair: '#8a4a1e', hairStyle: 'long', tunic: '#2f7fe0', trim: '#e8c04a', belt: '#8a5a2a', pants: '#3e3466', boots: '#7a4422', cape: '#d8343e', emblem: '#ffd84a', bracer: '#2ec8b8', eyes: '#1a3a5a', hat: { type: 'bandana', color: '#d8343e' } },
    heroina_suit: { walkN: 8, anims: true, skin: SKIN.claro, hair: '#8a4a1e', hairStyle: 'long', tunic: '#ff8a2a', trim: '#5aff8a', belt: '#5a3a1a', pants: '#c05a1a', boots: '#7a3a1a', cape: '#ffd23a', emblem: '#fff4e0', emblem2: '#c0401a', bracer: '#5aff8a', eyes: '#1a3a5a', hat: { type: 'bandana', color: '#5aff8a' } },
    gauss: { skin: SKIN.claro, hair: '#ececf4', hairStyle: 'short', beard: '#ececf4', longBeard: true, tunic: '#6a3aa8', trim: '#ffd84a', robe: true, belt: '#ffd84a', boots: '#4a2a6a', hat: { type: 'wizard', color: '#4a2a8a', color2: '#ffd84a' }, build: 'adult', brows: true, browColor: '#c8c8d8' },
    florence: { skin: SKIN.claro, hair: '#5a3018', hairStyle: 'long', tunic: '#f4f0f0', trim: '#e03030', robe: true, belt: '#e03030', boots: '#7a5a4a', hat: { type: 'nurse', color: '#ffffff', color2: '#e03030' } },
    mendel: { skin: SKIN.medio, hair: '#2a1a10', hairStyle: 'short', tunic: '#3aaa4a', trim: '#2a6a2a', apron: '#e8dcc0', pants: '#4a3a2a', boots: '#3a2418', hat: { type: 'cap', color: '#2a8a3a' }, build: 'stout' },
    pascal: { skin: SKIN.claro, hair: '#3a2418', hairStyle: 'bob', tunic: '#8a1a2a', trim: '#ffd23a', pants: '#2a2030', boots: '#1a1420', hat: { type: 'tophat', color: '#1a1a24', color2: '#c02a3a' }, cape: '#2a1a2a' },
    bernoulli: { skin: SKIN.medio, hair: '#a06a3a', hairStyle: 'short', tunic: '#3a6a9a', trim: '#f0e0b0', pants: '#3a3a5a', boots: '#3a2418', hat: { type: 'straw', color: '#e8c868', color2: '#8a5a2a' } },
    galton: { skin: SKIN.claro, hair: '#d0d0d0', hairStyle: 'short', beard: '#d0d0d0', tunic: '#4a6a4a', trim: '#c03a3a', pants: '#3a3a3a', boots: '#2a2020', hat: { type: 'tophat', color: '#3a3a3a', color2: '#5a8a5a' }, glasses: true },
    laplace: { skin: SKIN.medio, hair: '#5a3a1a', hairStyle: 'short', tunic: '#5a7a3a', trim: '#8a6a3a', robe: true, boots: '#3a2418', hat: { type: 'hood', color: '#4a6a2a' } },
    fisher: { skin: SKIN.moreno, hair: '#c08040', hairStyle: 'short', beard: '#c08040', tunic: '#3a5aa0', trim: '#f0f0e0', pants: '#5a4a3a', boots: '#5a3a1a', hat: { type: 'straw', color: '#e8c868', color2: '#a06030' }, build: 'stout' },
    quetelet: { skin: SKIN.moreno, hair: '#3a2418', hairStyle: 'short', beard: '#3a2418', tunic: '#c08030', trim: '#c03a3a', robe: true, belt: '#c03a3a', boots: '#5a3a1a', hat: { type: 'turban', color: '#f0e0b0', color2: '#c03a3a' } },
    nightingale: { skin: SKIN.claro, hair: '#e0b040', hairStyle: 'long', tunic: '#8ab0e0', trim: '#ffffff', robe: true, boots: '#4a3a5a' },
    kid1: { skin: SKIN.moreno, hair: '#2a1a10', hairStyle: 'spiky', tunic: '#e05a2a', trim: '#ffd23a', pants: '#3a3a6a', boots: '#3a2418', build: 'kid', sleeves: 'short' },
    kid2: { skin: SKIN.claro, hair: '#e0a040', hairStyle: 'ponytail', tunic: '#c04ab0', trim: '#ffffff', robe: true, boots: '#4a2a3a', build: 'kid', sleeves: 'short' },
    villager1: { skin: SKIN.medio, hair: '#5a3a2a', hairStyle: 'short', tunic: '#a07a4a', trim: '#e8dcc0', pants: '#5a4a3a', boots: '#3a2418', mustache: true },
    villager2: { skin: SKIN.escuro, hair: '#1a1a1a', hairStyle: 'bun', tunic: '#4a8a8a', trim: '#e0e040', robe: true, boots: '#1a2a2a', apron: '#f0e8d0' },
    guard: { skin: SKIN.medio, hair: '#4a3a2a', hairStyle: 'short', tunic: '#3a5ad0', trim: '#ffd23a', pants: '#2a3a7a', boots: '#2a2a3a', hat: { type: 'helmet', color: '#a0a8c0', color2: '#ffffff', plume: '#e03a3a' }, cape: '#2a3a8a', build: 'tall' },
    hermit: { skin: SKIN.claro, hair: '#d0d0d0', hairStyle: 'long', beard: '#e0e0e0', longBeard: true, tunic: '#7a6a5a', trim: '#5a4a3a', robe: true, boots: '#3a2a1a', hat: { type: 'hood', color: '#6a5a4a' } },
    viesNPC: { skin: SKIN.lilas, hair: '#2a1040', hairStyle: 'long', tunic: '#3a1a5a', trim: '#ff3a3a', robe: true, belt: '#ffd23a', boots: '#1a0a2a', hat: { type: 'hood', color: '#2a1040' }, eyes: '#ff3a3a', eyeGlow: '#ff3a3a', cape: '#5a0a3a', angry: true },
    esqueleto: { walkN: 8, skin: SKIN.osso, hair: '#e8e2d0', hairStyle: 'bald', tunic: '#b8b2a2', trim: '#8a8476', pants: '#d8d2c2', boots: '#8a8476', eyes: '#ff3030', eyeGlow: '#ff3030', noBlush: true, noEars: true, brows: false, angry: true, skeleton: true, noBelt: true },
    cavaleiro: { walkN: 8, skin: '#3a3a50', hair: '#3a3a50', hairStyle: 'short', tunic: '#7a2aa0', trim: '#c0a040', belt: '#c0a040', pants: '#5a5a70', boots: '#3a3050', hat: { type: 'helmet', color: '#8a8aa8', color2: '#d0d0e8', visor: true, plume: '#a02ad0' }, cape: '#4a1a6a', build: 'tall', noBlush: true },
    guardiao: { skin: '#aaa6ba', hair: '#9a96ac', hairStyle: 'short', tunic: '#9894ac', trim: '#c8c4d8', belt: '#7a768e', pants: '#8a869e', boots: '#76728a', hat: { type: 'helmet', color: '#a8a4bc', color2: '#dcd8ec', visor: true, plume: '#8a869e' }, cape: '#86829a', build: 'tall', noBlush: true, eyes: '#4a4660', brows: false },
    sigmaMom: { skin: SKIN.claro, hair: '#8a4a1e', hairStyle: 'bob', tunic: '#5aa04a', trim: '#f0e0b0', robe: true, boots: '#5a3a1a' }
  };

  // ------------------------------------------------------------------
  //  Espadas (horizontais, apontando para a direita; cabo em x=0)
  // ------------------------------------------------------------------
  function sword(blade, guard, grip, glowC) {
    const p = new G.Paint(44, 12);
    const bl = R5(blade), gd = R5(guard), gr = R5(grip);
    // cabo
    for (let x = 1; x <= 7; x++) for (let y = 4; y <= 7; y++) p.px(x, y, ((x + (y > 5 ? 1 : 0)) % 3 === 0) ? gr[1] : y === 4 ? gr[3] : gr[2]);
    p.ell(1.5, 6, 2, 2.2, { ramp: gd, ambient: 0.4 });
    // guarda
    for (let x = 8; x <= 10; x++) for (let y = 1; y <= 10; y++) p.px(x, y, x === 8 ? gd[3] : x === 10 ? gd[1] : gd[2]);
    p.px(9, 5, '#ff4a5a'); p.px(9, 6, '#c02a3a');
    // lâmina
    for (let x = 11; x <= 41; x++) {
      const tip = x > 37 ? (x - 37) : 0;
      for (let y = 3 + tip; y <= 8 - tip; y++) {
        let c = bl[2];
        if (y === 3 + tip) c = bl[4];
        else if (y === 4 + tip && tip === 0) c = bl[3];
        else if (y === 8 - tip) c = bl[0];
        else if (y === 7 - tip) c = bl[1];
        if (y === 5 && x > 12 && x < 34 && tip === 0) c = bl[1]; // sulco
        // marcas de régua (a espada mede!)
        if (tip === 0 && x >= 13 && x <= 35 && (x - 13) % 3 === 0 && (y === 7 || (y === 6 && (x - 13) % 9 === 0))) c = bl[0];
        p.px(x, y, c);
      }
    }
    p.outline({ k: -0.8 });
    const c = p.toCanvas();
    return c;
  }
  G.buildSprites = function () {
    SPR.swordBlade = sword('#b07a44', '#8a5a2a', '#5a3a1a');
    SPR.swordBlade2 = sword('#b8c4d4', '#c0a040', '#6a3a1a');
    SPR.swordBlade3 = sword('#e4ecf8', '#d8d8f0', '#3a3a6a');
    SPR.swordBlade4 = sword('#9aeaff', '#ffd23a', '#5a2a8a');
    // marcador "!" acima de NPCs
    {
      const p = new G.Paint(12, 18);
      p.rrect(3, 0, 6, 11, 2.5, (x, y) => (x < 5 ? '#fff6b0' : '#ffd84a'));
      p.rrect(3, 13, 6, 5, 2.5, (x, y) => (x < 5 ? '#fff6b0' : '#ffd84a'));
      p.outline({ color: '#5a3a10' });
      SPR.markerBang = p.toCanvas();
    }
    if (G.buildMonsters) G.buildMonsters();
    if (G.buildFoes) G.buildFoes();
    if (G.buildItems) G.buildItems();
    if (G.buildFx) G.buildFx();
    if (G.buildPuzzle) G.buildPuzzle();
    if (G.buildBossArt) G.buildBossArt();
    for (const f of G.artHooks || []) f();
  };

  G.buildCast = function () {
    for (const name in G.CAST) G.makeDoll(name, G.CAST[name]);
    // esqueleto: costelas por cima do tronco
    for (const k in SPR) {
      if (!k.startsWith('esqueleto_down') && !k.startsWith('esqueleto_up')) continue;
      const c = SPR[k], x = c.getContext('2d');
      x.fillStyle = '#6a6458';
      const B = BUILD.adult;
      for (let i = 0; i < 4; i++) { x.fillRect(19, B.torsoTop + 3 + i * 3, 10, 1); }
      x.fillStyle = '#f4f0e4'; for (let i = 0; i < 4; i++) x.fillRect(20, B.torsoTop + 2 + i * 3, 8, 1);
      x.fillStyle = '#6a6458'; x.fillRect(23, B.torsoTop + 1, 2, 12);
    }
  };
})(window.G);

// ---------------------------------------------------------------------
//  Efeitos e objetos de cenário com luz (tochas, chamas, braseiros)
// ---------------------------------------------------------------------
(function (G) {
  const SPR = G.spr, C = G.col;
  function flameFrames(prefix, cols, w, h) {
    for (let f = 0; f < 4; f++) {
      const p = new G.Paint(w, h);
      const cx = w / 2, base = h - 1;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const t = (base - y) / (h - 1); // 0 base, 1 topo
        const sway = Math.sin(t * 5 + f * 1.6) * t * 1.6;
        const half = (w / 2 - 0.5) * Math.sin(Math.min(1, (1 - t) * 1.25) * Math.PI * 0.75 + 0.3) * (1 - t * 0.55);
        const dx = x + 0.5 - (cx + sway);
        if (Math.abs(dx) > half || t > 0.98 - (f % 2) * 0.1) continue;
        const u = Math.abs(dx) / Math.max(0.5, half);
        let c = cols[1];
        if (u < 0.75 && t < 0.8) c = cols[2];
        if (u < 0.4 && t < 0.55) c = cols[3];
        if (t > 0.75) c = cols[0];
        p.px(x, y, c);
      }
      SPR[prefix + f] = p.toCanvas();
    }
  }
  G.buildFx = function () {
    flameFrames('flame', ['#d8301a', '#ff7a1a', '#ffc040', '#fff8c0'], 12, 18);
    flameFrames('flameBlue', ['#2a3ab0', '#3a8aff', '#8ad8ff', '#ffffff'], 12, 18);
    flameFrames('flameBig', ['#d8301a', '#ff7a1a', '#ffc040', '#fff8c0'], 20, 26);
    // suporte de tocha na parede
    {
      const p = new G.Paint(16, 22);
      const iron = ['#14101a', '#2a2430', '#4a4252', '#7a7084', '#a89eb4'];
      G.artTools.cyl(p, G.artTools.inRR(4, 2, 8, 6, 2), iron, [3, 1, 13, 9]);
      for (let y = 8; y < 18; y++) for (let x = 7; x < 9; x++) p.px(x, y, x === 7 ? iron[3] : iron[1]);
      G.artTools.cyl(p, G.artTools.inRR(5, 16, 6, 4, 1.5), iron, [4, 15, 12, 21]);
      p.outline({ k: -0.7 });
      SPR.torchSconce = p.toCanvas();
    }
    // braseiro de chão
    {
      const p = new G.Paint(24, 24);
      const st = ['#1e1a22', '#3a3440', '#5a5262', '#847a8e', '#b0a6ba'];
      p.ell(12, 22, 10, 2.5, 'rgba(10,8,20,0.4)');
      G.artTools.cyl(p, (x, y) => { const w = y < 12 ? 10 : 10 - (y - 12) * 0.6; return y >= 8 && y <= 21 && Math.abs(x + 0.5 - 12) <= w; }, st, [1, 7, 23, 22]);
      for (let x = 3; x < 21; x++) p.px(x, 8, st[4]);
      for (let x = 4; x < 20; x++) p.px(x, 9, '#2a0a06');
      p.outline({ k: -0.7 });
      SPR.brazier = p.toCanvas();
      const q = new G.Paint(24, 24); q.blit(p);
      for (let x = 4; x < 20; x++) q.px(x, 9, '#4a4252');
      SPR.brazierOff = q.toCanvas();
    }
  };
})(window.G);
