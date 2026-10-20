'use strict';
// =====================================================================
//  Kit de arte: tudo é desenhado em "pixels de arte" com o DOBRO da
//  resolução lógica (G.AR = 2). Cores com rampas de sombra (matiz
//  deslocado), pintor com sombreamento, contorno seletivo e Scale2x.
// =====================================================================
(function (G) {
  const AR = G.AR = 2;

  function canvas(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, w | 0); c.height = Math.max(1, h | 0); return c; }
  G.canvas = canvas;
  // canvas de sprite: tamanho lógico lw×lh, resolução AR×
  G.acanvas = (lw, lh) => { const c = canvas(lw * AR, lh * AR); c.lw = lw; c.lh = lh; return c; };
  G.setLogical = (c, lw, lh) => { c.lw = lw; c.lh = lh; return c; };
  G.lw = c => (c.lw !== undefined ? c.lw : c.width);
  G.lh = c => (c.lh !== undefined ? c.lh : c.height);

  // ------------------------------------------------------------------
  //  Cores
  // ------------------------------------------------------------------
  const cache = new Map();
  function parse(c) {
    if (typeof c === 'number') return [c & 255, (c >>> 8) & 255, (c >>> 16) & 255, (c >>> 24) & 255];
    let r = cache.get(c);
    if (r) return r;
    if (c[0] === '#') {
      let h = c.slice(1);
      if (h.length === 3 || h.length === 4) h = h.split('').map(x => x + x).join('');
      r = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), h.length >= 8 ? parseInt(h.slice(6, 8), 16) : 255];
    } else {
      const m = c.match(/rgba?\(([^)]+)\)/);
      if (m) { const p = m[1].split(',').map(s => parseFloat(s)); r = [p[0], p[1], p[2], p[3] === undefined ? 255 : Math.round(p[3] * 255)]; }
      else r = [255, 0, 255, 255];
    }
    cache.set(c, r);
    return r;
  }
  const hex2 = v => { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); };
  function toHex(r, g, b, a) { return '#' + hex2(r) + hex2(g) + hex2(b) + (a !== undefined && a < 255 ? hex2(a) : ''); }
  function rgb2hsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2;
    if (mx !== mn) {
      const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      if (mx === r) h = (g - b) / d + (g < b ? 6 : 0); else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4;
      h /= 6;
    }
    return [h * 360, s, l];
  }
  function hsl2rgb(h, s, l) {
    h = ((h % 360) + 360) % 360 / 360;
    if (s === 0) return [l * 255, l * 255, l * 255];
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    const f = t => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; };
    return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
  }
  // desloca a matiz em direção a um alvo (graus) por uma fração, limitado a maxDeg
  function hueToward(h, target, k, maxDeg) { let d = ((target - h + 540) % 360) - 180; let s = d * k; if (maxDeg !== undefined) s = Math.max(-maxDeg, Math.min(maxDeg, s)); return h + s; }
  // sombra/luz "pixel art": escuro puxa para azul-violeta (quentes: levemente para o magenta) e satura; claro puxa para amarelo
  function shade(c, k) {
    const [r, g, b, a] = parse(c);
    let [h, s, l] = rgb2hsl(r, g, b);
    if (k < 0) {
      const t = -k, warm = h < 50 || h > 320;
      h = hueToward(h, warm ? 345 : 245, 0.3 * t, warm ? 10 * t : 22 * t);
      s = Math.min(1, s * (1 + 0.12 * t) + (s > 0.08 ? 0.04 * t : 0)); l = l * (1 - 0.6 * t);
    } else if (k > 0) { const t = k; h = hueToward(h, 55, 0.25 * t, 14 * t); s = s * (1 - 0.15 * t); l = l + (1 - l) * 0.6 * t; }
    const [rr, gg, bb] = hsl2rgb(h, s, l);
    return toHex(rr, gg, bb, a);
  }
  function mix(a, b, t) { const A = parse(a), B = parse(b); return toHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t, A[3] + (B[3] - A[3]) * t); }
  function alpha(c, a) { const [r, g, b] = parse(c); return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')'; }
  // rampa de n tons (0 = mais escuro ... n-1 = mais claro), base no meio
  function ramp(c, n = 5, spread = 1) {
    const out = [], mid = (n - 1) / 2;
    for (let i = 0; i < n; i++) { const k = (i - mid) / Math.max(1, mid) * spread; out.push(k === 0 ? (typeof c === 'string' ? c : toHex(...parse(c))) : shade(c, k * (k < 0 ? 0.85 : 0.7))); }
    return out;
  }
  G.col = { parse, toHex, shade, mix, alpha, ramp, rgb2hsl, hsl2rgb };
  const pack = c => { if (typeof c === 'number') return c; const [r, g, b, a] = parse(c); return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0; };
  G.col.pack = pack;

  // matriz de Bayer 4x4 (pontilhado ordenado)
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
  G.bayer = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];

  // ------------------------------------------------------------------
  //  Pintor (buffer de pixels de arte)
  // ------------------------------------------------------------------
  const LIGHT = (() => { const l = [-0.55, -0.75, 0.62]; const n = Math.hypot(...l); return l.map(v => v / n); })();
  class Paint {
    constructor(w, h) { this.w = w; this.h = h; this.d = new Uint32Array(w * h); this.part = new Uint8Array(w * h); this.curPart = 1; }
    in(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
    px(x, y, c, part) {
      x |= 0; y |= 0; if (!this.in(x, y)) return;
      const v = pack(c), a = v >>> 24;
      if (a === 0) return;
      const i = y * this.w + x;
      if (a < 255) { // mistura alfa
        const o = this.d[i], oa = o >>> 24;
        if (oa === 0) { this.d[i] = v; }
        else {
          const t = a / 255, mixc = (s) => (((o >>> s) & 255) * (1 - t) + ((v >>> s) & 255) * t) & 255;
          this.d[i] = ((Math.max(oa, a) << 24) | (mixc(16) << 16) | (mixc(8) << 8) | mixc(0)) >>> 0;
        }
      } else this.d[i] = v;
      this.part[i] = part !== undefined ? part : this.curPart;
    }
    get(x, y) { x |= 0; y |= 0; if (!this.in(x, y)) return 0; return this.d[y * this.w + x]; }
    alphaAt(x, y) { return this.get(x, y) >>> 24; }
    erase(x, y) { x |= 0; y |= 0; if (this.in(x, y)) { this.d[y * this.w + x] = 0; this.part[y * this.w + x] = 0; } }
    rect(x, y, w, h, c) { for (let yy = Math.round(y); yy < Math.round(y + h); yy++) for (let xx = Math.round(x); xx < Math.round(x + w); xx++) this.px(xx, yy, c); return this; }
    // preenche máscara; fill pode ser cor ou função (x,y)=>cor
    mask(fn, fill, bbox) {
      const [x0, y0, x1, y1] = bbox || [0, 0, this.w - 1, this.h - 1];
      for (let y = Math.max(0, y0 | 0); y <= Math.min(this.h - 1, y1 | 0); y++) for (let x = Math.max(0, x0 | 0); x <= Math.min(this.w - 1, x1 | 0); x++) {
        if (!fn(x, y)) continue;
        const c = typeof fill === 'function' ? fill(x, y) : fill;
        if (c) this.px(x, y, c);
      }
      return this;
    }
    // elipse; fill = cor | função(nx,ny,x,y) | {ramp, light, dither, bands}
    ell(cx, cy, rx, ry, fill) {
      const bbox = [Math.floor(cx - rx - 1), Math.floor(cy - ry - 1), Math.ceil(cx + rx + 1), Math.ceil(cy + ry + 1)];
      const sh = (fill && fill.ramp) ? fill : null;
      return this.mask((x, y) => { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; return dx * dx + dy * dy <= 1; },
        (x, y) => {
          const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry;
          if (sh) return this.lit(sh, nx, ny, Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)), x, y);
          return typeof fill === 'function' ? fill(nx, ny, x, y) : fill;
        }, bbox);
    }
    // cor iluminada a partir de uma normal
    lit(o, nx, ny, nz, x, y) {
      const L = o.light || LIGHT;
      let v = nx * L[0] + ny * L[1] + nz * L[2];
      v = (v + (o.ambient !== undefined ? o.ambient : 0.25)) / (1 + (o.ambient !== undefined ? o.ambient : 0.25));
      v = Math.max(0, Math.min(0.999, v * (o.contrast || 1) + (o.bias || 0)));
      const r = o.ramp, n = r.length;
      let f = v * n;
      if (o.dither) f += (G.bayer(x, y) - 0.5) * o.dither;
      const i = Math.max(0, Math.min(n - 1, Math.floor(f)));
      return r[i];
    }
    // retângulo arredondado
    rrect(x, y, w, h, rad, fill) {
      return this.mask((px, py) => {
        const qx = Math.max(x + rad - (px + 0.5), 0, px + 0.5 - (x + w - rad)), qy = Math.max(y + rad - (py + 0.5), 0, py + 0.5 - (y + h - rad));
        return qx * qx + qy * qy <= rad * rad + 0.01;
      }, fill, [x - 1, y - 1, x + w + 1, y + h + 1]);
    }
    // polígono (lista [[x,y],...]) por regra par-ímpar
    poly(pts, fill) {
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
      const inside = (px, py) => {
        let c = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const [xi, yi] = pts[i], [xj, yj] = pts[j];
          if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) c = !c;
        }
        return c;
      };
      return this.mask((x, y) => inside(x + 0.5, y + 0.5), fill, [Math.floor(x0), Math.floor(y0), Math.ceil(x1), Math.ceil(y1)]);
    }
    line(x0, y0, x1, y1, c, w = 1) {
      const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 1.5));
      for (let i = 0; i <= n; i++) {
        const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n;
        if (w <= 1) this.px(Math.round(x - 0.5), Math.round(y - 0.5), c);
        else for (let yy = Math.round(y - w / 2); yy < Math.round(y + w / 2); yy++) for (let xx = Math.round(x - w / 2); xx < Math.round(x + w / 2); xx++) this.px(xx, yy, c);
      }
      return this;
    }
    // máscara sombreada genérica: altura = distância à borda (forma arredondada)
    litMask(fn, o, bbox) {
      const [x0, y0, x1, y1] = bbox || [0, 0, this.w - 1, this.h - 1];
      const W = x1 - x0 + 3, H = y1 - y0 + 3, R = o.radius || 4;
      const m = new Uint8Array(W * H), d = new Float32Array(W * H);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const v = fn(x + x0 - 1, y + y0 - 1) ? 1 : 0; m[y * W + x] = v; d[y * W + x] = v ? 1e6 : 0; }
      // chanfro 2 passadas
      for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const i = y * W + x; if (!m[i]) continue; d[i] = Math.min(d[i], d[i - 1] + 1, d[i - W] + 1, d[i - W - 1] + 1.414, d[i - W + 1] + 1.414); }
      for (let y = H - 2; y > 0; y--) for (let x = W - 2; x > 0; x--) { const i = y * W + x; if (!m[i]) continue; d[i] = Math.min(d[i], d[i + 1] + 1, d[i + W] + 1, d[i + W + 1] + 1.414, d[i + W - 1] + 1.414); }
      const hgt = i => { const t = Math.min(1, d[i] / R); return Math.sqrt(1 - (1 - t) * (1 - t)); };
      for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
        const i = y * W + x; if (!m[i]) continue;
        const gx = (hgt(i + 1) - hgt(i - 1)) * R * 0.5, gy = (hgt(i + W) - hgt(i - W)) * R * 0.5;
        let nx = -gx, ny = -gy, nz = 1.2; const nn = Math.hypot(nx, ny, nz); nx /= nn; ny /= nn; nz /= nn;
        const px = x + x0 - 1, py = y + y0 - 1;
        this.px(px, py, this.lit(o, nx, ny, nz, px, py));
      }
      return this;
    }
    // contorno seletivo: pixel vazio vizinho de pixel cheio recebe versão escura da cor vizinha
    outline(o = {}) {
      const w = this.w, h = this.h, src = this.d.slice();
      const k = o.k !== undefined ? o.k : -0.72;
      const memo = new Map();
      const dark = v => { let r = memo.get(v); if (r === undefined) { r = pack(o.color || shade(toHex(v & 255, (v >>> 8) & 255, (v >>> 16) & 255), k)); memo.set(v, r); } return r; };
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x; if (src[i] >>> 24) continue;
        let best = 0, cnt = 0;
        const nb = o.diag ? [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]] : [[1, 0], [-1, 0], [0, 1], [0, -1]];
        for (const [dx, dy] of nb) {
          const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
          const v = src[yy * w + xx]; if ((v >>> 24) > 128) { if (!best || dy < 0) best = v; cnt++; }
        }
        if (best) this.d[i] = dark(best);
      }
      return this;
    }
    // linhas internas entre partes diferentes (escurece o pixel da parte "de baixo")
    innerLines(o = {}) {
      const w = this.w, h = this.h, src = this.d.slice(), pt = this.part;
      const k = o.k !== undefined ? o.k : -0.45;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x; if (!(src[i] >>> 24)) continue;
        const p = pt[i];
        for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0]]) {
          const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
          const j = yy * w + xx;
          if ((src[j] >>> 24) && pt[j] !== p && pt[j] > p && !(o.skip && o.skip(p, pt[j]))) { const v = o.front ? src[j] : src[i]; this.d[i] = pack(shade(toHex(v & 255, (v >>> 8) & 255, (v >>> 16) & 255), o.front ? (o.kf !== undefined ? o.kf : -0.62) : k)); break; }
        }
      }
      return this;
    }
    flipX() { const p = new Paint(this.w, this.h); for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { p.d[y * this.w + x] = this.d[y * this.w + (this.w - 1 - x)]; p.part[y * this.w + x] = this.part[y * this.w + (this.w - 1 - x)]; } return p; }
    clone() { const p = new Paint(this.w, this.h); p.d.set(this.d); p.part.set(this.part); return p; }
    // copia outro pintor (com deslocamento)
    blit(o, ox = 0, oy = 0) { for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) { const v = o.d[y * o.w + x]; if (v >>> 24) this.px(x + ox, y + oy, v, o.part[y * o.w + x]); } return this; }
    toCanvas(lw, lh) {
      const c = canvas(this.w, this.h), x = c.getContext('2d');
      const img = x.createImageData(this.w, this.h);
      new Uint32Array(img.data.buffer).set(this.d);
      x.putImageData(img, 0, 0);
      c.lw = lw !== undefined ? lw : this.w / AR; c.lh = lh !== undefined ? lh : this.h / AR;
      return c;
    }
    // carrega um canvas existente
    static from(c) {
      const p = new Paint(c.width, c.height), x = c.getContext('2d');
      p.d.set(new Uint32Array(x.getImageData(0, 0, c.width, c.height).data.buffer));
      for (let i = 0; i < p.d.length; i++) if (p.d[i] >>> 24) p.part[i] = 1;
      return p;
    }
  }
  G.Paint = Paint;
  G.paint = (lw, lh) => new Paint(Math.round(lw * AR), Math.round(lh * AR));

  // ------------------------------------------------------------------
  //  Efeitos desenhados direto no contexto (suaves, em alta resolução)
  // ------------------------------------------------------------------
  const glowCache = new Map();
  // brilho radial (use com globalCompositeOperation = 'lighter' para luz)
  G.glow = function (ctx, x, y, r, color, a = 1) {
    if (r <= 0) return;
    let g = glowCache.get(color);
    if (!g) {
      g = canvas(64, 64); const c = g.getContext('2d');
      const grd = c.createRadialGradient(32, 32, 0, 32, 32, 32);
      grd.addColorStop(0, alpha(color, 1)); grd.addColorStop(0.35, alpha(color, 0.55)); grd.addColorStop(1, alpha(color, 0));
      c.fillStyle = grd; c.fillRect(0, 0, 64, 64); glowCache.set(color, g);
    }
    const pa = ctx.globalAlpha, ps = ctx.imageSmoothingEnabled;
    ctx.globalAlpha = pa * a; ctx.imageSmoothingEnabled = true;
    ctx.drawImage(g, x - r, y - r, r * 2, r * 2);
    ctx.globalAlpha = pa; ctx.imageSmoothingEnabled = ps;
  };
  // rastro "smear" de espada: crescente que engrossa até a ponta, fio branco
  // e brilho na extremidade. a0 → a1 (sentido do golpe), raios rIn..rOut
  G.smear = function (ctx, cx, cy, a0, a1, rIn, rOut, o = {}) {
    const span = a1 - a0; if (Math.abs(span) < 0.04) return;
    const al = o.alpha === undefined ? 1 : Math.max(0, o.alpha);
    if (al <= 0) return;
    const n = Math.max(10, Math.ceil(Math.abs(span) * 8)), dir = span > 0 ? 1 : -1;
    const frac = Math.min(0.999, Math.abs(span) / (Math.PI * 2));
    const body = o.body || '#dff4ff', edge = o.edge || '#6ac8ff';
    // gradiente cônico: transparente na cauda, opaco na ponta
    const grad = (c, aMax) => {
      const g = ctx.createConicGradient(dir > 0 ? a0 : a1, cx, cy);
      const st = dir > 0 ? [[0, 0], [frac * 0.45, 0.25], [frac, 1]] : [[0, 1], [frac * 0.55, 0.25], [frac, 0]];
      for (const [f, k] of st) g.addColorStop(f, G.col.alpha(c, k * aMax));
      g.addColorStop(Math.min(1, frac + 0.0005), G.col.alpha(c, 0));
      return g;
    };
    const rAt = t => rOut - (rOut - rIn) * Math.pow(t, 0.7);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, rOut, a0, a1, dir < 0);
    for (let i = n; i >= 0; i--) { const t = i / n, b2 = a0 + span * t, r = rAt(t); ctx.lineTo(cx + Math.cos(b2) * r, cy + Math.sin(b2) * r); }
    ctx.closePath();
    ctx.globalAlpha = al; ctx.fillStyle = grad(body, 0.9); ctx.fill();
    // borda interna colorida
    ctx.strokeStyle = grad(edge, 1); ctx.lineWidth = 1.1;
    ctx.beginPath();
    for (let i = 0; i <= n; i++) { const t = i / n, b2 = a0 + span * t, r = rAt(t) + 0.4; if (i) ctx.lineTo(cx + Math.cos(b2) * r, cy + Math.sin(b2) * r); else ctx.moveTo(cx + Math.cos(b2) * r, cy + Math.sin(b2) * r); }
    ctx.stroke();
    // fio branco na borda externa
    ctx.strokeStyle = grad(o.core || '#ffffff', 1); ctx.lineWidth = o.w || 1.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(cx, cy, rOut - 0.7, a0, a1, dir < 0); ctx.stroke();
    // brilho aditivo na ponta
    ctx.globalCompositeOperation = 'lighter';
    G.glow(ctx, cx + Math.cos(a1) * (rOut - 3), cy + Math.sin(a1) * (rOut - 3), o.tip || 7, edge, al * 0.9);
    ctx.restore();
  };
  // arco de golpe de espada (rastro), de a0 até a1
  G.slashArc = function (ctx, cx, cy, a0, a1, r0, r1, alphaMax, color, sgn) {
    const n = 12, ccw = a1 < a0;
    ctx.save();
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 1) / n;
      const b0 = a0 + (a1 - a0) * t0, b1 = a0 + (a1 - a0) * t1;
      const k = t1 * t1;
      ctx.globalAlpha = alphaMax * k;
      ctx.fillStyle = color;
      const rin = r0 + (r1 - r0) * 0.55 * (1 - k);
      ctx.beginPath(); ctx.arc(cx, cy, r1, b0, b1, ccw); ctx.arc(cx, cy, rin, b1, b0, !ccw); ctx.closePath(); ctx.fill();
    }
    // borda brilhante
    ctx.globalAlpha = alphaMax; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 0.75;
    ctx.beginPath(); ctx.arc(cx, cy, r1 - 0.4, a0 + (a1 - a0) * 0.45, a1, ccw); ctx.stroke();
    ctx.restore();
  };

  // ------------------------------------------------------------------
  //  Scale2x (EPX): amplia arte antiga suavizando diagonais
  // ------------------------------------------------------------------
  G.scale2x = function (src) {
    const w = src.width, h = src.height;
    const sx = src.getContext('2d').getImageData(0, 0, w, h);
    const s = new Uint32Array(sx.data.buffer);
    const out = canvas(w * 2, h * 2), ox = out.getContext('2d');
    const img = ox.createImageData(w * 2, h * 2), d = new Uint32Array(img.data.buffer);
    const at = (x, y) => s[Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const P = at(x, y), A = at(x, y - 1), B = at(x + 1, y), C = at(x - 1, y), D = at(x, y + 1);
      let e0 = P, e1 = P, e2 = P, e3 = P;
      if (C === A && C !== D && A !== B) e0 = A;
      if (A === B && A !== C && B !== D) e1 = B;
      if (D === C && D !== B && C !== A) e2 = C;
      if (B === D && B !== A && D !== C) e3 = D;
      const o = (y * 2) * (w * 2) + x * 2;
      d[o] = e0; d[o + 1] = e1; d[o + w * 2] = e2; d[o + w * 2 + 1] = e3;
    }
    ox.putImageData(img, 0, 0);
    out.lw = w; out.lh = h;
    return out;
  };
  // ampliação simples (vizinho mais próximo) para AR×
  G.upNearest = function (src) {
    const c = canvas(src.width * AR, src.height * AR), x = c.getContext('2d');
    x.imageSmoothingEnabled = false; x.drawImage(src, 0, 0, c.width, c.height);
    c.lw = src.width; c.lh = src.height;
    return c;
  };
})(window.G);

// =====================================================================
//  Kit de interface: painéis com borda dourada, barras e pílulas
//  (desenhados direto no contexto, em alta resolução).
// =====================================================================
(function (G) {
  const C = G.col;
  const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); else ctx.rect(x, y, w, h); };
  G.rrPath = rr;
  // G.panel(ctx, x, y, w, h, { border, bgTop, bg, r, corners, thin })
  G.panel = function (ctx, x, y, w, h, o = {}) {
    if (w <= 2 || h <= 2) return;
    const r = o.r !== undefined ? o.r : 4, border = o.border || '#e8c860';
    ctx.save();
    if (!o.thin) { ctx.fillStyle = 'rgba(4,2,12,0.45)'; rr(ctx, x + 1, y + 1.5, w, h, r); ctx.fill(); }
    ctx.fillStyle = '#0a0614'; rr(ctx, x, y, w, h, r); ctx.fill();
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, C.shade(border, 0.55)); g.addColorStop(0.45, border); g.addColorStop(1, C.shade(border, -0.45));
    ctx.fillStyle = g; rr(ctx, x + 0.5, y + 0.5, w - 1, h - 1, r - 0.5); ctx.fill();
    ctx.fillStyle = '#0a0614'; rr(ctx, x + (o.thin ? 1 : 1.5), y + (o.thin ? 1 : 1.5), w - (o.thin ? 2 : 3), h - (o.thin ? 2 : 3), r - 1); ctx.fill();
    const inset = o.thin ? 1.5 : 2;
    const bg = ctx.createLinearGradient(0, y, 0, y + h);
    bg.addColorStop(0, o.bgTop || '#2e2864'); bg.addColorStop(1, o.bg || '#110d2c');
    ctx.fillStyle = bg; rr(ctx, x + inset, y + inset, w - inset * 2, h - inset * 2, r - 1.5); ctx.fill();
    // brilho no topo e padrão sutil
    ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(x + r, y + inset + 0.5, w - r * 2, 0.5);
    if (!o.thin && h > 30) {
      ctx.globalAlpha = 0.035; ctx.fillStyle = '#ffffff';
      for (let i = x + 4; i < x + w - 4; i += 6) ctx.fillRect(i, y + inset + 1, 0.5, h - inset * 2 - 2);
      ctx.globalAlpha = 1;
    }
    if (o.corners !== false && w > 24 && h > 16) {
      for (const [cx, cy] of [[x + 3, y + 3], [x + w - 3, y + 3], [x + 3, y + h - 3], [x + w - 3, y + h - 3]]) {
        ctx.fillStyle = C.shade(border, -0.5); ctx.beginPath(); ctx.moveTo(cx, cy - 2.5); ctx.lineTo(cx + 2.5, cy); ctx.lineTo(cx, cy + 2.5); ctx.lineTo(cx - 2.5, cy); ctx.closePath(); ctx.fill();
        ctx.fillStyle = C.shade(border, 0.4); ctx.beginPath(); ctx.moveTo(cx, cy - 1.5); ctx.lineTo(cx + 1.5, cy); ctx.lineTo(cx, cy + 1.5); ctx.lineTo(cx - 1.5, cy); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.fillRect(cx - 0.5, cy - 1, 0.5, 0.5);
      }
    }
    ctx.restore();
  };
  // barra de seleção (menus)
  G.selBar = function (ctx, x, y, w, h, t = 0, tint) {
    ctx.save();
    const c = tint || '#4a4ab8';
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, C.shade(c, 0.35)); g.addColorStop(1, C.shade(c, -0.25));
    ctx.fillStyle = g; rr(ctx, x, y, w, h, 2); ctx.fill();
    ctx.globalAlpha = 0.25 + 0.15 * Math.sin(t * 6); ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 2, y + 0.5, w - 4, 0.5);
    ctx.globalAlpha = 1; ctx.strokeStyle = C.shade(c, 0.6); ctx.lineWidth = 0.5; rr(ctx, x + 0.25, y + 0.25, w - 0.5, h - 0.5, 2); ctx.stroke();
    ctx.restore();
  };
  // faixa de título
  G.headerBar = function (ctx, x, y, w, h, c = '#3a3a8a') {
    ctx.save();
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, C.shade(c, 0.3)); g.addColorStop(1, C.shade(c, -0.3));
    ctx.fillStyle = g; rr(ctx, x, y, w, h, 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,216,74,0.6)'; ctx.fillRect(x + 2, y + h - 0.5, w - 4, 0.5);
    ctx.restore();
  };
  // barra de progresso arredondada
  G.bar = function (ctx, x, y, w, h, k, c1 = '#7ae4ff', c2 = '#2a8ad0') {
    ctx.save();
    ctx.fillStyle = '#0a0614'; rr(ctx, x - 0.5, y - 0.5, w + 1, h + 1, h / 2 + 0.5); ctx.fill();
    ctx.fillStyle = '#1e1a3a'; rr(ctx, x, y, w, h, h / 2); ctx.fill();
    if (k > 0) {
      const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, c1); g.addColorStop(1, c2);
      ctx.fillStyle = g; rr(ctx, x, y, Math.max(h, w * Math.min(1, k)), h, h / 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(x + 1, y + 0.5, Math.max(0, w * Math.min(1, k) - 2), 0.5);
    }
    ctx.restore();
  };
  // pílula de aviso
  G.pill = function (ctx, x, y, w, h, accent = '#ffffff') {
    ctx.save();
    ctx.fillStyle = 'rgba(4,2,12,0.4)'; rr(ctx, x + 1, y + 1, w, h, h / 2); ctx.fill();
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, 'rgba(40,34,90,0.95)'); g.addColorStop(1, 'rgba(14,10,36,0.95)');
    ctx.fillStyle = g; rr(ctx, x, y, w, h, h / 2); ctx.fill();
    ctx.strokeStyle = C.alpha(accent, 0.7); ctx.lineWidth = 0.5; rr(ctx, x + 0.25, y + 0.25, w - 0.5, h - 0.5, h / 2); ctx.stroke();
    ctx.restore();
  };
})(window.G);
