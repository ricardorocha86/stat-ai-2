'use strict';
// =====================================================================
//  Interface: diálogos, escolhas, quiz, banners, lições, HUD, menu,
//  figuras estatísticas (pontos, barras, curva normal, dispersão...).
// =====================================================================
(function (G) {
  const I = G.input;
  const W = G.W, H = G.H;

  // ------------------------------------------------------------------
  //  FIGURAS
  // ------------------------------------------------------------------
  function dot(ctx, x, y, c) { const cx = x + 2, cy = y + 2; ctx.fillStyle = '#05040c'; ctx.beginPath(); ctx.arc(cx, cy, 2.6, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = G.col.shade(c, -0.3); ctx.beginPath(); ctx.arc(cx, cy, 2.1, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = c; ctx.beginPath(); ctx.arc(cx - 0.35, cy - 0.35, 1.6, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffffffb0'; ctx.fillRect(cx - 1.25, cy - 1.5, 1, 0.5); }
  function tri(ctx, x, y, c, up) { ctx.fillStyle = c; for (let i = 0; i < 4; i++) ctx.fillRect(x - i, up ? y + i : y - i, i * 2 + 1, 1); }
  function axisRange(vals) {
    let lo = Math.floor(Math.min(...vals)) - 1, hi = Math.ceil(Math.max(...vals)) + 1;
    while (hi - lo < 8) { lo--; hi++; }
    if (lo < 0 && Math.min(...vals) >= 0) { hi -= lo; lo = 0; }
    return [lo, hi];
  }
  function numberAxis(ctx, x0, x1, ay, lo, hi) {
    G.rect(ctx, x0, ay, x1 - x0, 1, '#9a98b0');
    const span = hi - lo, step = span <= 12 ? 1 : span <= 24 ? 2 : span <= 60 ? 5 : 10;
    for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) {
      const px = x0 + (v - lo) / span * (x1 - x0);
      G.rect(ctx, px, ay, 1, 3, '#9a98b0');
      if ((v / step) % (span / step > 12 ? 2 : 1) === 0) G.text(String(v), px + 1, ay + 5, '#9a98b0', { align: 'center', shadow: false });
    }
  }
  const FIG = {
    dots(ctx, f, x, y, w, h) {
      const v = f.values, [lo, hi] = axisRange(v);
      const x0 = x + 8, x1 = x + w - 8, ay = y + h - 16;
      const px = val => Math.round(x0 + (val - lo) / (hi - lo) * (x1 - x0));
      numberAxis(ctx, x0, x1, ay, lo, hi);
      const cnt = {}, modes = G.st.modes(v);
      for (const val of v) { const k = cnt[val] = (cnt[val] || 0) + 1; dot(ctx, px(val) - 2, ay - 2 - k * 5, (f.mark === 'mode' && modes.includes(val) && modes.length < v.length) ? '#ffd84a' : '#7ae4ff'); }
      const mean = G.st.mean(v), med = G.st.median(v);
      if (f.mark === 'mean' || f.mark === 'both') { tri(ctx, px(mean), ay + 2, '#7aff8a', true); G.text('média ' + G.fmt(mean, 1), x + 4, y + 4, '#7aff8a', { shadow: false }); }
      if (f.mark === 'median' || f.mark === 'both') { G.rect(ctx, px(med), y + 14, 1, ay - y - 14, '#7ae4ff60'); G.text('mediana ' + G.fmt(med, 1), x + w - 4, y + 4, '#7ae4ff', { align: 'right', shadow: false }); }
      if (f.mark === 'mode') G.text('moda', x + 4, y + 4, '#ffd84a', { shadow: false });
      if (f.mark === 'range') {
        const a = px(Math.min(...v)), b = px(Math.max(...v));
        G.rect(ctx, a, y + 16, b - a + 1, 1, '#ffa040'); G.rect(ctx, a, y + 16, 1, 4, '#ffa040'); G.rect(ctx, b, y + 16, 1, 4, '#ffa040');
        G.text('amplitude', (a + b) / 2, y + 6, '#ffa040', { align: 'center', shadow: false });
      }
    },
    twodots(ctx, f, x, y, w, h) {
      const all = f.a.concat(f.b), [lo, hi] = axisRange(all);
      const x0 = x + 14, x1 = x + w - 8, ay = y + h - 16;
      const px = val => Math.round(x0 + (val - lo) / (hi - lo) * (x1 - x0));
      numberAxis(ctx, x0, x1, ay, lo, hi);
      const rowA = y + 14, rowB = y + Math.floor((ay - y) / 2) + 8;
      G.text('A', x + 3, rowA - 1, '#7ae4ff', { shadow: false }); G.text('B', x + 3, rowB - 1, '#ffa040', { shadow: false });
      const ca = {}, cb = {};
      for (const val of f.a) { const k = ca[val] = (ca[val] || 0) + 1; dot(ctx, px(val) - 2, rowA + (k - 1) * -5 + 4, '#7ae4ff'); }
      for (const val of f.b) { const k = cb[val] = (cb[val] || 0) + 1; dot(ctx, px(val) - 2, rowB + (k - 1) * -5 + 4, '#ffa040'); }
    },
    bars(ctx, f, x, y, w, h) {
      const n = f.values.length, mx = Math.max(1, ...f.values);
      const top = y + 12, base = y + h - 22, slot = (w - 12) / n, bw = Math.max(4, Math.floor(slot - 4));
      G.rect(ctx, x + 6, base, w - 12, 1, '#9a98b0');
      f.values.forEach((v, i) => {
        const bh = Math.round(v / mx * (base - top));
        const bx = Math.round(x + 6 + i * slot + (slot - bw) / 2);
        const col = (f.colors && f.colors[i]) || (f.hi === i ? '#ffd84a' : '#7ae4ff');
        G.rect(ctx, bx, base - bh, bw, bh, col);
        G.rect(ctx, bx, base - bh, bw, 1, '#ffffff');
        G.rect(ctx, bx + bw - 1, base - bh, 1, bh, '#00000060');
        G.text(String(v), bx + bw / 2 + 1, base - bh - 9, '#ffffff', { align: 'center', shadow: false });
        if (f.labels) G.text(f.labels[i], bx + bw / 2 + 1, base + 4 + (n > 4 && i % 2 ? 9 : 0), '#9a98b0', { align: 'center', shadow: false });
      });
    },
    urn(ctx, f, x, y, w, h) {
      const cx = x + w / 2, top = y + 10, bot = y + h - 8, jw = Math.min(w - 20, 70);
      G.rect(ctx, cx - jw / 2, top + 10, jw, bot - top - 10, '#2a2a4a');
      G.strokeRect(ctx, cx - jw / 2, top + 10, jw, bot - top - 10, '#c0c0e0');
      G.rect(ctx, cx - jw / 2 + 6, top + 4, jw - 12, 7, '#c0c0e0');
      const balls = []; for (let i = 0; i < f.r; i++) balls.push('#ff5a5a'); for (let i = 0; i < f.b; i++) balls.push('#5a8aff'); for (let i = 0; i < (f.y || 0); i++) balls.push('#ffd84a');
      const per = Math.max(1, Math.floor((jw - 6) / 9));
      balls.forEach((c, i) => {
        const bx = cx - jw / 2 + 4 + (i % per) * 9, by = bot - 10 - Math.floor(i / per) * 9;
        ctx.fillStyle = '#000'; ctx.fillRect(bx - 1, by, 9, 7); ctx.fillRect(bx, by - 1, 7, 9);
        ctx.fillStyle = c; ctx.fillRect(bx, by, 7, 7); ctx.fillStyle = '#ffffff90'; ctx.fillRect(bx + 1, by + 1, 2, 2);
      });
    },
    dice(ctx, f, x, y, w, h) {
      const pips = { 1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [2, 0], [0, 2], [2, 2]], 5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]] };
      const s = 18, gap = 6, cols = 3, ox = x + (w - (cols * s + (cols - 1) * gap)) / 2, oy = y + (h - (2 * s + gap)) / 2;
      for (let n = 1; n <= 6; n++) {
        const dx = ox + ((n - 1) % 3) * (s + gap), dy = oy + Math.floor((n - 1) / 3) * (s + gap);
        const hi = f.hi && f.hi.includes(n);
        G.rect(ctx, dx - 1, dy - 1, s + 2, s + 2, hi ? '#ffd84a' : '#5a5670');
        G.rect(ctx, dx, dy, s, s, '#f4f0f8');
        for (const [a, b] of pips[n]) G.rect(ctx, dx + 3 + a * 5, dy + 3 + b * 5, 3, 3, hi ? '#e03a3a' : '#1b1428');
      }
    },
    coins(ctx, f, x, y, w, h) {
      const combos = ['CC', 'CK', 'KC', 'KK'];
      combos.forEach((c, i) => {
        const bx = x + 10 + i * ((w - 20) / 4), by = y + h / 2 - 10;
        for (let j = 0; j < 2; j++) {
          const cx = bx + j * 12, cy = by + 6;
          ctx.fillStyle = '#5a3a10'; ctx.fillRect(cx - 1, cy - 5, 12, 12);
          ctx.fillStyle = c[j] === 'C' ? '#ffd23a' : '#c0c0d0'; ctx.fillRect(cx, cy - 4, 10, 10);
          G.text(c[j] === 'C' ? 'C' : 'K', cx + 2, cy - 2, '#1b1428', { shadow: false });
        }
        if (i === 0) G.strokeRect(ctx, bx - 3, by - 2, 28, 18, '#7aff8a');
      });
      G.text('C = cara   K = coroa', x + w / 2, y + h - 12, '#9a98b0', { align: 'center', shadow: false });
    },
    sums(ctx, f, x, y, w, h) {
      const vals = [1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];
      FIG.bars(ctx, { values: vals, labels: ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'], hi: 5 }, x, y, w, h);
    },
    normal(ctx, f, x, y, w, h) {
      const base = y + h - 14, top = y + 10, x0 = x + 6, x1 = x + w - 6, sd = (x1 - x0) / 7;
      for (let px = x0; px <= x1; px++) {
        const z = (px - (x0 + x1) / 2) / sd, v = Math.exp(-z * z / 2);
        const ph = Math.round(v * (base - top));
        const inBand = f.band && Math.abs(z) <= f.band;
        G.rect(ctx, px, base - ph, 1, ph, inBand ? '#7aff8a' : '#3a5a9a');
        G.rect(ctx, px, base - ph, 1, 1, '#ffffff');
      }
      G.rect(ctx, x0, base, x1 - x0, 1, '#9a98b0');
      const cx = (x0 + x1) / 2;
      for (let k = -3; k <= 3; k++) { G.rect(ctx, cx + k * sd, base, 1, 3, '#9a98b0'); }
      G.text('μ', cx + 1, base + 4, '#ffd84a', { align: 'center', shadow: false });
      G.text('+σ', cx + sd + 1, base + 4, '#9a98b0', { align: 'center', shadow: false });
      G.text('-σ', cx - sd + 1, base + 4, '#9a98b0', { align: 'center', shadow: false });
      if (f.band) G.text(f.band === 1 ? '68%' : f.band === 2 ? '95%' : '99,7%', cx, y + h / 2 - 4, '#1b1428', { align: 'center', shadow: false });
    },
    skew(ctx, f, x, y, w, h) {
      const base = y + h - 14, top = y + 10, x0 = x + 6, x1 = x + w - 6;
      const fn = t => t * t * Math.exp(-t * 1.6);
      let mx = 0; for (let i = 0; i <= 100; i++) mx = Math.max(mx, fn(i / 100 * 6));
      for (let px = x0; px <= x1; px++) {
        const t = (px - x0) / (x1 - x0) * 6, ph = Math.round(fn(t) / mx * (base - top));
        G.rect(ctx, px, base - ph, 1, ph, '#3a5a9a'); G.rect(ctx, px, base - ph, 1, 1, '#ffffff');
      }
      G.rect(ctx, x0, base, x1 - x0, 1, '#9a98b0');
      const medX = x0 + (1.67 / 6) * (x1 - x0), meanX = x0 + (1.875 / 6) * (x1 - x0) + 6;
      G.rect(ctx, medX, top, 1, base - top, '#7ae4ff'); G.rect(ctx, meanX, top, 1, base - top, '#7aff8a');
      G.text('mediana', medX - 2, top - 2, '#7ae4ff', { align: 'right', shadow: false });
      G.text('média', meanX + 3, top + 8, '#7aff8a', { shadow: false });
      G.text('cauda →', x1 - 2, base - 14, '#ffa040', { align: 'right', shadow: false });
    },
    scatter(ctx, f, x, y, w, h) {
      const x0 = x + 10, y0 = y + h - 10, x1 = x + w - 6, y1 = y + 6;
      G.rect(ctx, x0, y1, 1, y0 - y1, '#9a98b0'); G.rect(ctx, x0, y0, x1 - x0, 1, '#9a98b0');
      for (const [a, b] of f.pts) dot(ctx, Math.round(x0 + 3 + a * (x1 - x0 - 8)) - 2, Math.round(y0 - 4 - b * (y0 - y1 - 8)) - 2, '#ff9ae6');
    }
  };
  G.FIG = FIG;
  function drawFig(ctx, f, x, y, w, h) {
    ctx.save(); const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#0e0c24'); g.addColorStop(1, '#06050f'); ctx.fillStyle = g; G.rrPath(ctx, x, y, w, h, 3); ctx.fill(); ctx.strokeStyle = '#4a4a8a'; ctx.lineWidth = 0.5; G.rrPath(ctx, x + 0.25, y + 0.25, w - 0.5, h - 0.5, 3); ctx.stroke();
    ctx.globalAlpha = 0.07; ctx.fillStyle = '#7ae4ff'; for (let gx = x + 8; gx < x + w - 4; gx += 8) ctx.fillRect(gx, y + 3, 0.5, h - 6); ctx.restore();
    if (FIG[f.type]) FIG[f.type](ctx, f, x, y, w, h);
  }

  // ------------------------------------------------------------------
  //  OVERLAYS
  // ------------------------------------------------------------------
  function box(ctx, x, y, w, h, o) { G.panel(ctx, x, y, w, h, o); }
  // seta piscante "continuar"
  function moreArrow(ctx, x, y, t) { const b = Math.sin(t * 6) * 1.2; ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.moveTo(x - 3, y + b); ctx.lineTo(x + 3, y + b); ctx.lineTo(x, y + 3.5 + b); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#7a4a10'; ctx.fillRect(x - 3, y + b - 0.5, 6, 0.5); }
  G.moreArrow = moreArrow;

  class Dialog {
    constructor(name, text, o, res) {
      this.name = name; this.portrait = o.portrait; this.res = res;
      const tw = this.portrait ? 304 : 352;
      const lines = G.wrap(text, tw);
      this.pages = [];
      for (let i = 0; i < lines.length; i += 4) this.pages.push(lines.slice(i, i + 4));
      if (!this.pages.length) this.pages.push(['']);
      this.page = 0; this.shown = 0; this.t = 0; this.speed = o.speed || 70;
      this.keep = o.keep; // mantém visível (usado com escolhas)
      this.y = o.top ? 6 : 148;
      // a caixa só "surge" se não houver outra fala logo antes (conversas seguidas não piscam)
      this.pop = G.time - (UI._lastDlg || -9) < 0.25 ? 1 : 0;
    }
    pageLen() { return this.pages[this.page].reduce((s, l) => s + G.visLen(l), 0); }
    update(dt) {
      this.t += dt;
      const len = this.pageLen();
      if (this.shown < len) {
        const prev = Math.floor(this.shown);
        this.shown = Math.min(len, this.shown + this.speed * dt);
        if (Math.floor(this.shown) !== prev && prev % 3 === 0) G.sfx('text');
        if (I.pressed('confirm') || I.pressed('cancel')) this.shown = len;
      } else if (I.pressed('confirm') || I.pressed('cancel')) {
        if (this.page < this.pages.length - 1) { this.page++; this.shown = 0; G.sfx('select'); }
        else { this.done = true; UI._lastDlg = G.time; this.res(); }
      }
    }
    draw(ctx) {
      const k = this.pop ? 1 : Math.min(1, this.t / 0.12);
      if (k >= 1) { drawDialogBox(ctx, this); return; }
      ctx.save(); ctx.globalAlpha *= k; ctx.translate(0, (1 - k) * 8); drawDialogBox(ctx, this); ctx.restore();
    }
  }
  function drawDialogBox(ctx, d, full) {
    const x = 8, y = d.y, w = 368, h = 62;
    box(ctx, x, y, w, h);
    let tx = x + 10;
    if (d.portrait) {
      G.panel(ctx, x + 5, y + 6, 40, 40, { r: 2, bgTop: '#3a3470', bg: '#1a1640', corners: false, thin: true });
      // retrato falante: abre a boca enquanto o texto corre e pisca de vez em quando
      const base = String(d.portrait).replace(/_down0$/, '_portrait'), typing = !full && d.shown < d.pageLen();
      if (G.portraitVariants && !G.spr[base + 'Talk']) G.portraitVariants(base.replace(/_portrait$/, ''));
      let key = base;
      if (typing && Math.floor(d.shown / 2.5) % 2 === 0 && G.spr[base + 'Talk']) key = base + 'Talk';
      else if (!typing && d.t > 0.5 && (d.t % 3.3) < 0.13 && G.spr[base + 'Blink']) key = base + 'Blink';
      const spr = G.spr[key] || G.spr[base] || G.spr[d.portrait];
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, x + 25, y + 26, 18, '#7a6ad8', typing ? 0.35 : 0.2); ctx.restore();
      if (spr) G.drawFit(ctx, spr, x + 9, y + 10 + (typing ? Math.round(Math.sin(d.t * 14)) * 0.5 : 0), 32, 32);
      tx = x + 52;
    }
    if (d.name) {
      const nw = G.textW(d.name) + 14;
      G.panel(ctx, x + 8, y - 10, nw, 14, { r: 2, bgTop: '#5a3aa0', bg: '#2a1a5a', corners: false, thin: true });
      G.text(d.name, x + 15, y - 6, '#ffe27a');
    }
    const lines = d.pages[d.page];
    let rem = full ? 9999 : d.shown;
    lines.forEach((l, i) => {
      G.text(l, tx, y + 10 + i * 11, '#ffffff', { max: Math.max(0, Math.floor(rem)) });
      rem -= G.visLen(l);
    });
    if (!full && d.shown >= d.pageLen()) moreArrow(ctx, x + w - 11, y + h - 10, d.t);
  }

  class Choice {
    constructor(options, o, res) {
      this.options = options; this.i = o.def || 0; this.res = res; this.o = o;
      this.cancel = o.cancel; this.t = 0;
      if (o.prompt) {
        const lines = G.wrap(o.prompt, o.portrait ? 304 : 352);
        this.dlg = { name: o.name, portrait: o.portrait, pages: [lines.slice(0, 4)], page: 0, shown: 999, t: 0, y: 148, pageLen: () => 0 };
      }
    }
    update(dt) {
      this.t += dt;
      const n = this.options.length;
      if (I.pressed('up')) { this.i = (this.i + n - 1) % n; G.sfx('select'); }
      if (I.pressed('down')) { this.i = (this.i + 1) % n; G.sfx('select'); }
      if (this.o.onMove) this.o.onMove(this.i);
      if (I.pressed('confirm')) { if (this.o.disabled && this.o.disabled(this.i)) { G.sfx('wrong'); return; } G.sfx('confirm'); this.done = true; this.res(this.i); }
      else if (I.pressed('cancel') && this.cancel !== undefined) { G.sfx('cancel'); this.done = true; this.res(this.cancel); }
    }
    draw(ctx) {
      if (this.dlg) drawDialogBox(ctx, this.dlg, true);
      const lw = Math.max(...this.options.map(o => G.textW(o))) + 30;
      const w = Math.min(368, Math.max(80, lw)), h = this.options.length * 12 + 10;
      const x = this.o.x !== undefined ? this.o.x : 376 - w, y = this.o.y !== undefined ? this.o.y : (this.dlg ? 144 - h : (H - h) / 2);
      box(ctx, x, y, w, h);
      this.options.forEach((op, i) => {
        const dis = this.o.disabled && this.o.disabled(i);
        const sel = i === this.i;
        if (sel) G.selBar(ctx, x + 4, y + 5 + i * 12, w - 8, 11, this.t);
        G.text(op, x + 16, y + 7 + i * 12, dis ? '#6a6880' : sel ? '#ffe27a' : '#ffffff');
        if (sel) G.draw(ctx, 'cursor', x + 6 + Math.sin(this.t * 8) * 0.8, y + 7 + i * 12);
      });
      if (this.o.desc) {
        const d = this.o.desc(this.i);
        if (d) {
          const dw = Math.max(90, Math.min(210, x - 14));
          const lines = G.wrap(d, dw - 12);
          const bh = lines.length * 10 + 10;
          box(ctx, 8, y, dw, bh);
          lines.forEach((l, k) => G.text(l, 14, y + 6 + k * 10, '#c8c8e0'));
        }
      }
      if (this.o.showCoins) {
        box(ctx, 8, 8, 88, 18);
        G.draw(ctx, 'iconCoin', 14, 13);
        G.text(String(G.P.coins), 26, 13, '#ffd84a');
      }
    }
  }

  class Quiz {
    constructor(q, o, res) {
      this.q = q; this.o = o; this.res = res; this.i = 0; this.t = 0; this.state = 'ask';
      this.qLines = G.wrap(q.text, q.fig ? 200 : 350);
      this.optLines = q.options.map(op => G.wrap(op, 320));
    }
    update(dt) {
      this.t += dt;
      const n = this.q.options.length;
      if (this.state === 'ask') {
        if (this.t < 0.25) return;
        if (I.pressed('up')) { this.i = (this.i + n - 1) % n; G.sfx('select'); }
        if (I.pressed('down')) { this.i = (this.i + 1) % n; G.sfx('select'); }
        if (I.pressed('confirm')) {
          this.ok = this.i === this.q.correct;
          this.state = 'result'; this.t = 0;
          G.sfx(this.ok ? 'correct' : 'wrong');
          this.expLines = G.wrap(this.q.explain || '', 344);
          G.recordQuiz(this.q.topic, this.ok);
        }
      } else if (this.t > 0.4 && (I.pressed('confirm') || I.pressed('cancel'))) {
        this.done = true; this.res(this.ok);
      }
    }
    draw(ctx) {
      ctx.fillStyle = 'rgba(5,4,15,0.72)'; ctx.fillRect(0, 0, W, H);
      const x = 6, y = 6, w = 372, h = 204;
      box(ctx, x, y, w, h);
      const head = (this.o.title || 'DESAFIO') + ' · ' + (G.TOPICS[this.q.topic] || '');
      G.headerBar(ctx, x + 3, y + 3, w - 6, 14);
      G.text(head, x + 9, y + 6.5, '#ffe27a');
      if (this.o.subtitle) G.text(this.o.subtitle, x + w - 8, y + 6, '#ff9ae6', { align: 'right' });
      this.qLines.forEach((l, i) => G.text(l, x + 10, y + 22 + i * 10, '#ffffff'));
      if (this.q.fig) drawFig(ctx, this.state === 'ask' && this.q.fig.mark ? Object.assign({}, this.q.fig, { mark: null }) : this.q.fig, x + 216, y + 20, 148, 92);
      const oy = y + 118;
      if (this.state === 'ask' || this.t < 0.5) {
        let yy = oy;
        this.q.options.forEach((op, i) => {
          const sel = i === this.i;
          let col = sel ? '#ffd84a' : '#ffffff';
          if (this.state === 'result') col = i === this.q.correct ? '#7aff8a' : (i === this.i ? '#ff6a5a' : '#6a6880');
          const lines = this.optLines[i];
          if (sel) G.selBar(ctx, x + 6, yy - 2, w - 12, lines.length * 10 + 2, this.t, this.state === 'result' ? (this.ok ? '#2a8a4a' : '#8a2a3a') : null);
          G.text('ABCD'[i] + ')', x + 12, yy, col);
          lines.forEach((l, k) => G.text(l, x + 30, yy + k * 10, col));
          yy += lines.length * 10 + 4;
        });
      } else {
        G.panel(ctx, x + 6, oy - 5, w - 12, 84, { r: 3, bgTop: this.ok ? '#1e5a30' : '#5a1e2e', bg: this.ok ? '#0e2a18' : '#2a0e18', corners: false, thin: true, border: this.ok ? '#7aff8a' : '#ff8a7a' });
        G.text(this.ok ? '★ CORRETO! ★' : 'NÃO FOI DESSA VEZ...', x + w / 2, oy, this.ok ? '#7aff8a' : '#ff8a7a', { align: 'center' });
        if (!this.ok) G.text('Resposta: ' + this.q.options[this.q.correct], x + w / 2, oy + 11, '#ffd84a', { align: 'center' });
        this.expLines.slice(0, 5).forEach((l, i) => G.text(l, x + 12, oy + (this.ok ? 14 : 24) + i * 10, '#e8e8ff'));
        moreArrow(ctx, x + w - 13, y + h - 11, this.t);
      }
    }
  }

  class Banner {
    constructor(icon, title, text, res, o = {}) {
      this.icon = icon; this.title = title; this.lines = G.wrap(text || '', 250); this.res = res; this.t = 0; this.o = o;
    }
    update(dt) { this.t += dt; if (this.t > 0.6 && (I.pressed('confirm') || I.pressed('cancel'))) { this.done = true; this.res(); } }
    draw(ctx) {
      const h = 44 + this.lines.length * 10, w = 320, x = (W - w) / 2, y = 30;
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 0, W, H);
      const k = Math.min(1, this.t * 4), e = 1 - (1 - k) * (1 - k);
      ctx.save(); ctx.translate(W / 2, y + h / 2); ctx.scale(0.85 + 0.15 * e, 0.85 + 0.15 * e); ctx.translate(-W / 2, -(y + h / 2)); ctx.globalAlpha = e;
      G.panel(ctx, x, y, w, h, { border: this.o.color || '#ffd84a' });
      const spr = G.spr[this.icon];
      if (spr) {
        // raios de luz girando atrás do ícone
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const cx = x + 28, cy = y + 28;
        ctx.translate(cx, cy); ctx.rotate(this.t * 0.8);
        for (let i = 0; i < 8; i++) { ctx.rotate(Math.PI / 4); ctx.fillStyle = 'rgba(255,230,140,0.18)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-3, -24); ctx.lineTo(3, -24); ctx.closePath(); ctx.fill(); }
        ctx.restore();
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, x + 28, y + 28, 22, '#ffe8a0', 0.5 + 0.2 * Math.sin(this.t * 5)); ctx.restore();
        G.drawFit(ctx, spr, x + 12, y + 12 + Math.sin(this.t * 3) * 1, 32, 32);
      }
      G.text(this.title, x + 56, y + 12, '#ffe27a');
      ctx.fillStyle = 'rgba(255,216,74,0.45)'; ctx.fillRect(x + 56, y + 22, w - 66, 0.5);
      this.lines.forEach((l, i) => G.text(l, x + 56, y + 28 + i * 10, '#ffffff'));
      ctx.restore();
      if (this.t > 0.6) moreArrow(ctx, x + w - 12, y + h - 10, this.t);
    }
  }

  class LessonView {
    constructor(id, res) {
      this.L = G.LESSONS[id]; this.page = 0; this.res = res; this.t = 0;
      this.prep();
    }
    prep() { const p = this.L.pages[this.page]; this.lines = G.wrap(p.t, 346); }
    update(dt) {
      this.t += dt;
      if (this.t < 0.2) return;
      const n = this.L.pages.length;
      if (I.pressed('left') && this.page > 0) { this.page--; this.prep(); G.sfx('select'); }
      else if ((I.pressed('right') || I.pressed('confirm')) && this.page < n - 1) { this.page++; this.prep(); G.sfx('select'); }
      else if ((I.pressed('confirm') && this.page === n - 1) || I.pressed('cancel')) { this.done = true; G.sfx('cancel'); this.res(); }
    }
    draw(ctx) {
      ctx.fillStyle = 'rgba(5,4,15,0.75)'; ctx.fillRect(0, 0, W, H);
      const x = 6, y = 6, w = 372, h = 204;
      G.panel(ctx, x, y, w, h, { bgTop: '#2a2048', bg: '#14102a', border: '#e8d8a8' });
      G.headerBar(ctx, x + 3, y + 3, w - 6, 14, '#5a3a8a');
      G.text('GRIMÓRIO · ' + this.L.title, x + 9, y + 7, '#ffe27a');
      G.text((this.page + 1) + '/' + this.L.pages.length, x + w - 8, y + 7, '#c8c8e0', { align: 'right' });
      const p = this.L.pages[this.page];
      const maxLines = p.fig ? 9 : 16;
      this.lines.slice(0, maxLines).forEach((l, i) => G.text(l, x + 12, y + 24 + i * 10, '#ffffff'));
      if (p.fig) drawFig(ctx, p.fig, x + 70, y + 116, 232, 76);
      G.text(this.L.by, x + 10, y + h - 11, '#9a98b0');
      const nav = (this.page > 0 ? '← ' : '  ') + (this.page < this.L.pages.length - 1 ? 'próxima →' : 'fechar (X)');
      G.text(nav, x + w - 10, y + h - 11, '#ffd84a', { align: 'right' });
    }
  }

  // ------------------------------------------------------------------
  //  MENU DE PAUSA
  // ------------------------------------------------------------------
  const TABS = ['STATUS', 'MAPA', 'MISSÕES', 'GRIMÓRIO', 'DADOS', 'SISTEMA'];
  class PauseMenu {
    constructor(res, tab = 0) { this.res = res; this.tab = tab; this.i = 0; this.t = 0; this.sub = 0; this.isPause = true; }
    update(dt) {
      this.t += dt;
      if (this.busy) return;
      if (I.pressed('start') || I.pressed('cancel') || (this.tab === 1 && I.pressed('map'))) { G.sfx('cancel'); this.done = true; this.res(); return; }
      if (I.pressed('left')) { this.tab = (this.tab + TABS.length - 1) % TABS.length; this.i = 0; G.sfx('select'); }
      if (I.pressed('right')) { this.tab = (this.tab + 1) % TABS.length; this.i = 0; G.sfx('select'); }
      const P = G.P;
      if (this.healT > 0) this.healT -= dt;
      if (this.tab === 0) {
        if (I.pressed('confirm') && P.potions > 0) {
          if (P.hp < P.maxHp) {
            const antes = P.hp; P.potions--; G.healPlayer(16); G.sfx('heal');
            this.healT = 1; this.healed = P.hp - antes; // brilho e "+vida" no próprio menu
            G.ui.toast('Você bebeu uma poção! +' + this.healed + ' de vida', '#7aff8a');
          } else { G.sfx('wrong'); G.ui.toast('Sua vida já está cheia: guarde a poção para depois.'); }
        }
      } else if (this.tab === 2) {
        if (G.questTabUpdate) G.questTabUpdate(this, I);
      } else if (this.tab === 4) {
        if (I.pressed('up') || I.pressed('down') || I.pressed('confirm')) { this.page = this.page ? 0 : 1; G.sfx('select'); }
      } else if (this.tab === 3) {
        const list = G.LESSON_ORDER;
        if (I.pressed('up')) { this.i = (this.i + list.length - 1) % list.length; G.sfx('select'); }
        if (I.pressed('down')) { this.i = (this.i + 1) % list.length; G.sfx('select'); }
        if (I.pressed('confirm')) {
          const id = list[this.i];
          if (P.lessons.includes(id)) { this.busy = true; G.ui.lesson(id).then(() => { this.busy = false; }); }
          else G.sfx('wrong');
        }
      } else if (this.tab === 5) {
        const opts = this.sysOpts();
        if (I.pressed('up')) { this.i = (this.i + opts.length - 1) % opts.length; G.sfx('select'); }
        if (I.pressed('down')) { this.i = (this.i + 1) % opts.length; G.sfx('select'); }
        const o = opts[this.i];
        if (o.adj && (I.pressed('left') || I.pressed('right'))) { /* tratado abaixo */ }
        if (o.adj) {
          // left/right já trocaram de aba; desfaz e ajusta
        }
        if (I.pressed('confirm') && o.act) o.act(this);
      }
    }
    sysOpts() {
      const A = G.audio;
      return [
        { label: 'Salvar jogo', act: m => { if (G.canSaveHere()) { G.saveGame(); G.sfx('save'); G.ui.toast('Jogo salvo!'); } else { G.sfx('wrong'); G.ui.toast('Não é possível salvar aqui. Use uma estação de salvamento.'); } } },
        { label: 'Música: ' + Math.round(A.musicVol * 10) + '/10', act: () => { A.setVol(((Math.round(A.musicVol * 10) + 2) % 12) / 10, A.sfxVol); G.saveSettings(); } },
        { label: 'Efeitos: ' + Math.round(A.sfxVol * 10) + '/10', act: () => { A.setVol(A.musicVol, ((Math.round(A.sfxVol * 10) + 2) % 12) / 10); G.saveSettings(); G.sfx('coin'); } },
        { label: 'Controles', act: m => { m.busy = true; G.ui.controls().then(() => { m.busy = false; }); } },
        { label: 'Controles de toque: ' + (G.touch ? G.touch.modeLabel() : '-'), act: () => { if (G.touch) { G.touch.cycle(); G.saveSettings(); G.sfx('select'); } } },
        { label: 'Voltar ao título', act: m => { m.busy = true; G.ui.choose(['Continuar jogando', 'Sair (progresso não salvo será perdido)'], { cancel: 0 }).then(r => { m.busy = false; if (r === 1) { m.done = true; m.res(); G.toTitle(); } }); } }
      ];
    }
    draw(ctx) {
      // entra com o fundo escurecendo e o painel subindo um pouco
      const k = Math.min(1, this.t / 0.14), e = 1 - (1 - k) * (1 - k);
      ctx.fillStyle = 'rgba(5,4,15,' + (0.82 * e) + ')'; ctx.fillRect(0, 0, W, H);
      if (k < 1) { ctx.save(); ctx.globalAlpha *= e; ctx.translate(0, (1 - e) * 10); this.drawPanel(ctx); ctx.restore(); return; }
      this.drawPanel(ctx);
    }
    drawPanel(ctx) {
      const x = 4, y = 4, w = 376, h = 208;
      G.panel(ctx, x, y, w, h);
      // abas
      let tx = x + 6;
      TABS.forEach((t, i) => {
        const tw = G.textW(t) + 12;
        G.panel(ctx, tx, y + 4, tw, 14, { r: 3, bgTop: i === this.tab ? '#7a4ad0' : '#2e2860', bg: i === this.tab ? '#3a2a8a' : '#1a163a', corners: false, thin: true, border: i === this.tab ? '#ffd84a' : '#5a5690' });
        G.text(t, tx + 6, y + 8, i === this.tab ? '#ffe27a' : '#9a98b0');
        tx += tw + 3;
      });
      G.text('◀ ▶', x + w - 8, y + 7, '#5a5670', { align: 'right' });
      G.rect(ctx, x + 4, y + 19, w - 8, 1, '#5a5690');
      const cx = x + 8, cy = y + 24;
      [this.drawStatus, this.drawMap, this.drawQuests, this.drawGrimoire, this.drawData, this.drawSystem][this.tab].call(this, ctx, cx, cy, w - 16, h - 30);
    }
    drawStatus(ctx, x, y, w, h) {
      const P = G.P;
      G.rect(ctx, x, y, 52, 52, '#0a0918'); G.strokeRect(ctx, x, y, 52, 52, '#5a5690');
      const hs = G.spr[G.spriteHeroi() + '_down0'];
      if (hs) G.drawFit(ctx, hs, x + 2, y + 2, 48, 48);
      G.text('SIGMA', x + 60, y + 2, '#ffd84a');
      G.text('Nível ' + P.level, x + 60, y + 14, '#ffffff');
      const need = G.xpNeeded(P.level);
      G.rect(ctx, x + 60, y + 25, 80, 4, '#2a2a4a'); G.rect(ctx, x + 60, y + 25, Math.round(80 * Math.min(1, P.xp / need)), 4, '#7ae4ff');
      G.text('XP ' + P.xp + '/' + need, x + 146, y + 24, '#9a98b0');
      const heal = this.healT > 0 ? this.healT : 0;
      G.text('Vida ' + P.hp + '/' + P.maxHp, x + 60, y + 34, heal > 0 && Math.floor(heal * 12) % 2 ? '#7aff8a' : '#ff8a9a');
      if (heal > 0) {
        // poção: brilho verde no retrato e "+vida" subindo
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, x + 26, y + 26, 30, '#5aff8a', heal * 0.8); ctx.restore();
        for (let i = 0; i < 5; i++) { const a = (1 - heal) * 22, px = x + 10 + i * 8, py = y + 44 - a - (i % 2) * 6; ctx.globalAlpha = heal; G.draw(ctx, 'sparkle', px, py); }
        ctx.globalAlpha = heal; G.text('+' + this.healed, x + 120 + (1 - heal) * 4, y + 34 - (1 - heal) * 8, '#7aff8a', { outline: '#0a2a10' }); ctx.globalAlpha = 1;
      }
      const swords = ['Espada de Madeira', 'Espada de Ferro', 'Espada de Prata', 'Espada Gaussiana'];
      const armors = ['Túnica', 'Couraça de Couro', 'Cota de Malha'];
      G.text('ATQ ' + G.atk() + '   DEF ' + G.def() + '   SAB ' + P.sab, x + 60, y + 44, '#ffffff');
      G.text(swords[P.swordLv] + ' · ' + armors[P.armorLv], x, y + 58, '#c8c8e0');
      // itens
      G.text('ITENS', x, y + 72, '#ffd84a');
      const items = [['swordIcon', 'Espada', P.items.sword], ['boots', 'Botas de Salto (Z)', P.items.boots], ['bomb', 'Bombas ' + P.bombs + '/' + P.bombMax, P.items.bombs], ['beamItem', 'Raio Amostral', P.items.beam], ['suit', 'Traje Térmico', P.items.suit], ['scroll', 'Golpe Giratório', P.items.spin], ['hookItem', 'Gancho da Regressão', P.items.hook]];
      items.forEach(([ic, name, has], i) => {
        const ix = x + (i % 2) * 118, iy = y + 81 + Math.floor(i / 2) * 19;
        G.rect(ctx, ix, iy, 18, 18, '#0a0918');
        if (has) { G.draw(ctx, ic, ix + 1, iy + 1); G.text(name, ix + 22, iy + 6, '#ffffff'); }
        else G.text('???', ix + 22, iy + 6, '#5a5670');
      });
      // cristais
      const cx = x + 238;
      G.text('CRISTAIS', cx, y + 2, '#ffd84a');
      ['media', 'mediana', 'dispersao', 'prob', 'distrib', 'amostra'].forEach((c, i) => {
        const has = P.crystals.includes(c);
        const sx = cx + (i % 3) * 22, sy = y + 12 + Math.floor(i / 3) * 20;
        if (has) G.draw(ctx, 'crystal_' + c, sx, sy); else G.draw(ctx, 'crystal_' + c, sx, sy, { tint: 'rgba(20,20,40,0.85)' });
      });
      G.text('Fragmentos de', cx, y + 56, '#c8c8e0'); G.text('coração: ' + (P.heartPieces % 4) + '/4', cx, y + 66, '#ff8a9a');
      G.draw(ctx, 'iconPotion', cx, y + 82); G.text('Poções: ' + P.potions, cx + 12, y + 82, '#ffffff');
      if (P.potions > 0) G.text(P.hp < P.maxHp ? 'X: beber poção' : 'Vida cheia', cx, y + 94, P.hp < P.maxHp ? '#7aff8a' : '#5a5670');
      G.draw(ctx, 'iconCoin', cx, y + 108); G.text('Moedas: ' + P.coins, cx + 12, y + 108, '#ffd84a');
      G.text('Tempo: ' + G.fmtTime(P.playTime), cx, y + 122, '#9a98b0');
      if (G.quest) { G.draw(ctx, 'lens', cx - 1, y + 133); G.text('Lentes: ' + G.quest.lenses() + '/5', cx + 12, y + 135, '#7ae4ff'); }
      if (P.flags.inferencia) G.draw(ctx, 'crystal_inferencia', cx + 68, y + 22);
      G.text('Progresso total: ' + G.completion() + '%', cx, y + 150, '#9a98b0');
    }
    drawMap(ctx, x, y, w, h) { if (G.drawMapTab) G.drawMapTab(ctx, x, y, w, h); }
    drawQuests(ctx, x, y, w, h) { if (G.drawQuestTab) G.drawQuestTab(ctx, x, y, w, h, this); }
    drawGrimoire(ctx, x, y, w, h) {
      const P = G.P, list = G.LESSON_ORDER;
      G.text('Lições aprendidas: ' + P.lessons.length + '/' + list.length, x, y, '#ffd84a');
      const per = 14, start = Math.max(0, Math.min(this.i - 6, list.length - per));
      list.slice(start, start + per).forEach((id, k) => {
        const i = start + k, has = P.lessons.includes(id), sel = i === this.i;
        const yy = y + 12 + k * 11;
        if (sel) G.rect(ctx, x, yy - 2, 190, 11, '#3a3a8a');
        G.text((has ? '■ ' : '□ ') + (has ? G.LESSONS[id].title : '? ? ?'), x + 4, yy, has ? (sel ? '#ffd84a' : '#ffffff') : '#5a5670');
      });
      const id = list[this.i];
      G.panel(ctx, x + 198, y, w - 198, 150, { bg2: false });
      if (P.lessons.includes(id)) {
        const L = G.LESSONS[id];
        G.wrap(L.title, w - 214).forEach((l, i) => G.text(l, x + 206, y + 8 + i * 10, '#ffd84a'));
        G.text('Fonte: ' + L.by, x + 206, y + 32, '#9a98b0');
        G.wrap(L.pages[0].t.split('\n')[0], w - 214).slice(0, 7).forEach((l, i) => G.text(l, x + 206, y + 48 + i * 10, '#c8c8e0'));
        G.text('X: ler lição', x + 206, y + 136, '#7aff8a');
      } else {
        G.wrap('Esta lição ainda não foi encontrada. Explore o reino, leia tábuas e converse com os sábios!', w - 214).forEach((l, i) => G.text(l, x + 206, y + 8 + i * 10, '#6a6880'));
      }
    }
    drawData(ctx, x, y, w, h) {
      const P = G.P, d = P.stats.dmg;
      G.text(this.page ? '▲▼ página 2/2' : '▲▼ página 1/2', x + w, y, '#5a5670', { align: 'right' });
      if (this.page) { G.drawReport(ctx, x, y, w, h); return; }
      G.text('DIÁRIO DE DADOS · o dano dos seus golpes', x, y, '#ffd84a');
      if (d.length < 2) {
        G.wrap('Golpeie alguns inimigos! Cada golpe é um DADO. Aqui você verá a média, a mediana, a moda e o desvio padrão do seu dano.', w).forEach((l, i) => G.text(l, x, y + 16 + i * 10, '#c8c8e0'));
      } else {
        const st = G.st, r = d.slice(-200);
        const lines = [
          ['Golpes registrados (n)', String(r.length)],
          ['Média  (soma ÷ n)', G.fmt(st.mean(r), 2)],
          ['Mediana (valor do meio)', G.fmt(st.median(r), 1)],
          ['Moda (mais frequente)', st.modes(r).slice(0, 3).join(', ')],
          ['Amplitude (máx - mín)', st.range(r) + '  (' + Math.min(...r) + ' a ' + Math.max(...r) + ')'],
          ['Desvio padrão (σ)', G.fmt(st.std(r), 2)]
        ];
        lines.forEach(([a, b], i) => { G.text(a, x, y + 14 + i * 11, '#c8c8e0'); G.text(b, x + 150, y + 14 + i * 11, '#7aff8a'); });
        const fq = st.freq(r); const keys = Object.keys(fq).map(Number).sort((a, b) => a - b).slice(0, 9);
        drawFig(ctx, { type: 'bars', labels: keys.map(String), values: keys.map(k => fq[k]) }, x + 228, y + 12, w - 228, 76);
        G.text('histograma do dano', x + 228 + (w - 228) / 2, y + 90, '#9a98b0', { align: 'center' });
      }
      // acertos por tema
      G.text('DESAFIOS RESPONDIDOS', x, y + 100, '#ffd84a');
      const qz = P.stats.quiz; const keys = Object.keys(qz);
      let tc = 0, tt = 0; keys.forEach(k => { tc += qz[k].c; tt += qz[k].t; });
      G.text('Total: ' + tc + '/' + tt + (tt ? ' (' + Math.round(tc / tt * 100) + '%)' : ''), x + 150, y + 100, '#ffffff');
      keys.slice(0, 8).forEach((k, i) => {
        const yy = y + 112 + (i % 4) * 11, xx = x + Math.floor(i / 4) * 180;
        const pc = qz[k].t ? qz[k].c / qz[k].t : 0;
        G.text((G.TOPICS[k] || k).slice(0, 14), xx, yy, '#c8c8e0');
        G.rect(ctx, xx + 90, yy + 1, 50, 5, '#2a2a4a'); G.rect(ctx, xx + 90, yy + 1, Math.round(50 * pc), 5, pc >= 0.7 ? '#7aff8a' : pc >= 0.4 ? '#ffd84a' : '#ff6a5a');
        G.text(Math.round(pc * 100) + '%', xx + 144, yy, '#9a98b0');
      });
      G.text('Inimigos derrotados: ' + P.stats.kills + '   Moedas coletadas: ' + P.stats.coinsTotal, x, y + 160, '#9a98b0');
    }
    drawSystem(ctx, x, y, w, h) {
      const opts = this.sysOpts();
      opts.forEach((o, i) => {
        const sel = i === this.i, yy = y + 6 + i * 14;
        if (sel) G.rect(ctx, x, yy - 3, 220, 13, '#3a3a8a');
        G.text(o.label, x + 8, yy, sel ? '#ffd84a' : '#ffffff');
      });
      G.wrap('Dica: o jogo também salva sozinho ao tocar numa ^cEstação de Salvamento^0 (círculo azul brilhante).', 140).forEach((l, i) => G.text(l, x + 226, y + 6 + i * 10, '#9a98b0'));
      G.text('A Lenda de Sigma v1.1', x, y + h - 14, '#5a5670');
    }
  }

  // relatório por assunto: barras de acerto, pontos fortes e o que revisar
  G.topicReport = () => {
    const qz = G.P.stats.quiz, rows = [];
    for (const k in qz) if (qz[k].t > 0) rows.push({ k, name: G.TOPICS[k] || k, c: qz[k].c, t: qz[k].t, p: qz[k].c / qz[k].t });
    rows.sort((a, b) => b.p - a.p || b.t - a.t);
    const strong = rows.filter(r => r.t >= 2 && r.p >= 0.75).slice(0, 3), weak = rows.filter(r => r.p < 0.6).sort((a, b) => a.p - b.p).slice(0, 3);
    return { rows, strong, weak };
  };
  G.drawReport = function (ctx, x, y, w, h) {
    const R = G.topicReport();
    G.text('RELATÓRIO DO ESTATÍSTICO · acertos por assunto', x, y, '#ffd84a');
    if (!R.rows.length) { G.wrap('Responda desafios, oráculos e enigmas para montar seu relatório. Cada resposta vira um dado!', w).forEach((l, i) => G.text(l, x, y + 16 + i * 10, '#c8c8e0')); return; }
    const per = 10, colW = Math.floor((w - 8) / 2);
    R.rows.slice(0, per * 2).forEach((r, i) => {
      const xx = x + Math.floor(i / per) * (colW + 8), yy = y + 13 + (i % per) * 11;
      G.text(r.name.length > 17 ? r.name.slice(0, 16) + '.' : r.name, xx, yy, '#c8c8e0');
      const bw = 52, bx = xx + colW - bw - 30, c = r.p >= 0.75 ? '#7aff8a' : r.p >= 0.5 ? '#ffd84a' : '#ff6a5a';
      G.rect(ctx, bx, yy + 1, bw, 5, '#2a2a4a'); G.rect(ctx, bx, yy + 1, Math.round(bw * r.p), 5, c);
      G.text(r.c + '/' + r.t, xx + colW - 2, yy, '#9a98b0', { align: 'right' });
    });
    const by = y + 13 + per * 11 + 4;
    G.text('Pontos fortes: ', x, by, '#7aff8a'); G.text(R.strong.length ? R.strong.map(r => r.name).join(', ') : '(responda mais desafios)', x + 76, by, '#e8e4f4');
    G.text('Para revisar: ', x, by + 11, '#ff8a7a'); G.text(R.weak.length ? R.weak.map(r => r.name).join(', ') : 'nada! Excelente trabalho.', x + 76, by + 11, '#e8e4f4');
  };

  class Controls {
    constructor(res) { this.res = res; this.t = 0; }
    update(dt) { this.t += dt; if (this.t > 0.3 && (I.pressed('confirm') || I.pressed('cancel') || I.pressed('start'))) { this.done = true; this.res(); } }
    draw(ctx) {
      ctx.fillStyle = 'rgba(5,4,15,0.85)'; ctx.fillRect(0, 0, W, H);
      G.panel(ctx, 30, 14, 324, 188);
      G.text('CONTROLES', W / 2, 22, '#ffd84a', { align: 'center' });
      const L = [
        ['Setas / WASD', 'Mover'],
        ['X / J / Espaço', 'Espada · Falar · Confirmar'],
        ['X frente a bloco', 'Puxar uma casa (recua junto)'],
        ['   (segurar X)', 'Golpe giratório (quando aprender)'],
        ['Z / K', 'Pular (com as Botas) · Cancelar'],
        ['C / L', 'Usar item (bomba / raio / gancho)'],
        ['  (segurar C)', 'Carregar o Raio Amostral'],
        ['Q / Shift / Tab', 'Trocar item'],
        ['Enter / Esc', 'Menu (status, mapa, missões, grimório)'],
        ['M', 'Mapa'],
        ['F / V', 'Tela cheia / Silenciar ou ativar som'],
        ['Controle', 'A=espada B=pular X=item Y=trocar'],
        ['Celular', 'toque: arraste à esquerda, botões X Z C Q']
      ];
      L.forEach(([a, b], i) => { G.text(a, 44, 40 + i * 12, '#7ae4ff'); G.text(b, 150, 40 + i * 12, '#ffffff'); });
    }
  }

  // ------------------------------------------------------------------
  //  API
  // ------------------------------------------------------------------
  const UI = G.ui = {
    stack: [], toasts: [], region: null, fadeA: 0, fadeTarget: 0, fadeSpeed: 0, fadeRes: null, lowT: 0,
    push(o) { this.stack.push(o); I.consume(); return o; },
    top() { return this.stack[this.stack.length - 1]; },
    blocking() { return this.stack.length > 0; },
    clear() { this.stack.length = 0; this.toasts.length = 0; this.region = null; },
    say(name, text, o = {}) {
      if (Array.isArray(text)) return text.reduce((p, t) => p.then(() => UI.say(name, t, o)), Promise.resolve());
      return new Promise(res => this.push(new Dialog(name, G.genero(text), o, res)));
    },
    choose(options, o = {}) {
      if (o.prompt) o = Object.assign({}, o, { prompt: G.genero(o.prompt) });
      return new Promise(res => this.push(new Choice(options.map(G.genero), o, res)));
    },
    ask(name, text, options, o = {}) { return this.choose(options, Object.assign({ prompt: text, name, portrait: o.portrait }, o)); },
    quiz(q, o = {}) { return new Promise(res => this.push(new Quiz(q, o, res))); },
    banner(icon, title, text, o) { return new Promise(res => this.push(new Banner(icon, G.genero(title), G.genero(text), res, o))); },
    lesson(id) { return new Promise(res => this.push(new LessonView(id, res))); },
    controls() { return new Promise(res => this.push(new Controls(res))); },
    pause(tab = 0) { return new Promise(res => this.push(new PauseMenu(res, tab))); },
    // cartão do bestiário (não bloqueia): ícone, nome e explicação
    card(o) { this.cards = this.cards || []; this.cards.push(Object.assign({ t: 0, life: 8 }, o)); G.sfx('menu'); },
    toast(text, color = '#ffffff') { this.toasts.push({ text: G.genero(text), color, t: 3 }); if (this.toasts.length > 3) this.toasts.shift(); },
    regionBanner(name, sub) { this.region = { name, sub, t: 0 }; },
    // entrada de chefe: faixas de cinema, nome grande e subtítulo
    bossCard(name, sub, color = '#ffd84a') { this.bossIntro = { name, sub, color, t: 0 }; },
    fade(to, dur = 0.4) {
      return new Promise(res => { this.fadeTarget = to; this.fadeSpeed = Math.abs(to - this.fadeA) / Math.max(0.01, dur); this.fadeRes = res; if (this.fadeA === to) { this.fadeRes = null; res(); } });
    },
    update(dt) {
      const t = this.top();
      if (t) { t.update(dt); }
      for (let i = this.stack.length - 1; i >= 0; i--) if (this.stack[i].done) this.stack.splice(i, 1);
      for (let i = this.toasts.length - 1; i >= 0; i--) { this.toasts[i].t -= dt; if (this.toasts[i].t <= 0) this.toasts.splice(i, 1); }
      if (this.cards && this.cards.length && !this.blocking()) { const c = this.cards[0]; c.t += dt; if (c.t > c.life) this.cards.shift(); }
      if (this.region) { this.region.t += dt; if (this.region.t > 3.5) this.region = null; }
      if (this.bossIntro) { this.bossIntro.t += dt; if (this.bossIntro.t > 2.9) this.bossIntro = null; }
      if (this.fadeA !== this.fadeTarget) {
        this.fadeA = G.approach(this.fadeA, this.fadeTarget, this.fadeSpeed * dt);
        if (this.fadeA === this.fadeTarget && this.fadeRes) { const r = this.fadeRes; this.fadeRes = null; r(); }
      }
    },
    draw(ctx) {
      if (this.bossIntro) {
        const b = this.bossIntro, t = b.t, out = t > 2.3 ? Math.max(0, 1 - (t - 2.3) / 0.6) : 1, k = Math.min(1, t / 0.4) * out;
        const bar = Math.round(24 * (1 - Math.pow(1 - k, 3)) * 2) / 2;
        ctx.fillStyle = '#05030a'; ctx.fillRect(0, 0, W, bar); ctx.fillRect(0, H - bar, W, bar);
        ctx.globalAlpha = 0.8 * k; ctx.fillStyle = b.color; ctx.fillRect(0, bar, W, 0.5); ctx.fillRect(0, H - bar - 0.5, W, 0.5);
        // véu escuro atrás do nome
        const g = ctx.createLinearGradient(0, H - bar - 46, 0, H - bar); g.addColorStop(0, 'rgba(5,3,10,0)'); g.addColorStop(1, 'rgba(5,3,10,0.7)');
        ctx.globalAlpha = k; ctx.fillStyle = g; ctx.fillRect(0, H - bar - 46, W, 46);
        // subtítulo e nome deslizam da esquerda; um brilho atravessa o nome
        const ta = G.clamp((t - 0.3) / 0.35, 0, 1) * out, e = 1 - Math.pow(1 - ta, 3), x0 = 26 - (1 - e) * 40;
        ctx.globalAlpha = ta;
        G.text(b.sub, x0, H - bar - 38, b.color, { outline: '#05030a' });
        ctx.fillStyle = b.color; ctx.fillRect(x0, H - bar - 28, (G.textW(b.sub) + 30) * e, 0.5);
        G.textBig(b.name, x0, H - bar - 24, '#ffffff', { scale: 2, gradient: ['#ffffff', '#ffd0a8'], outline: '#2a0a14', shadowColor: 'rgba(0,0,0,0.85)' });
        const sw = (t - 0.7) / 0.5;
        if (sw > 0 && sw < 1) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const sx = x0 + sw * (G.textW(b.name) * 2 + 20); const gr = ctx.createLinearGradient(sx - 12, 0, sx + 12, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gr; ctx.fillRect(sx - 12, H - bar - 26, 24, 20); ctx.restore(); }
        ctx.globalAlpha = 1;
      }
      if (this.region) {
        const r = this.region, a = r.t < 0.5 ? r.t / 0.5 : r.t > 2.8 ? Math.max(0, (3.5 - r.t) / 0.7) : 1;
        ctx.globalAlpha = a;
        const w = Math.max(G.textW(r.name) * 2, G.textW(r.sub || '')) + 60;
        const x0 = (W - w) / 2, hh = r.sub ? 42 : 32, slide = r.t < 0.5 ? (1 - r.t / 0.5) * 10 : 0;
        const g = ctx.createLinearGradient(x0, 0, x0 + w, 0);
        g.addColorStop(0, 'rgba(10,8,24,0)'); g.addColorStop(0.18, 'rgba(10,8,24,0.72)'); g.addColorStop(0.82, 'rgba(10,8,24,0.72)'); g.addColorStop(1, 'rgba(10,8,24,0)');
        ctx.fillStyle = g; ctx.fillRect(x0, 50, w, hh);
        const g2 = ctx.createLinearGradient(x0, 0, x0 + w, 0);
        g2.addColorStop(0, 'rgba(255,216,74,0)'); g2.addColorStop(0.5, 'rgba(255,216,74,1)'); g2.addColorStop(1, 'rgba(255,216,74,0)');
        ctx.fillStyle = g2; ctx.fillRect(x0, 50, w, 0.5); ctx.fillRect(x0, 50 + hh, w, 0.5);
        G.textBig(r.name, W / 2 - slide, 58, '#ffffff', { align: 'center', gradient: ['#ffffff', '#c8d0ff'], shadowColor: 'rgba(0,0,0,0.9)' });
        if (r.sub) G.text(r.sub, W / 2 + slide, 80, '#ffd84a', { align: 'center' });
        ctx.globalAlpha = 1;
      }
      const dlgOpen = this.stack.some(o => o instanceof Dialog || o instanceof Choice);
      if (this.cards && this.cards.length && !dlgOpen && G.state === 'play') this.drawCard(ctx, this.cards[0]);
      for (const o of this.stack) o.draw(ctx);
      // avisos por cima de tudo (antes ficavam escondidos atrás do menu de pausa)
      const menu = this.stack.some(o => o instanceof PauseMenu);
      this.toasts.forEach((t, i) => {
        const w = Math.min(W - 8, G.textW(t.text) + 16), x = (W - w) / 2, y = (dlgOpen ? 28 : menu ? 196 : (G.boss && !G.boss.dead && G.state === 'play' ? 160 : 186)) - (this.toasts.length - 1 - i) * 15;
        ctx.globalAlpha = Math.min(1, t.t * 2);
        G.pill(ctx, x, y - 1, w, 13, t.color);
        G.text(t.text, x + 8, y + 2, t.color);
        ctx.globalAlpha = 1;
      });
      if (this.fadeA > 0) { ctx.fillStyle = 'rgba(0,0,0,' + this.fadeA + ')'; ctx.fillRect(0, 0, W, H); }
    },
    drawCard(ctx, c) {
      const w = 196, lines = G.wrap(c.text, w - 42), h = 20 + lines.length * 9;
      const k = Math.min(1, c.t / 0.3), out = Math.max(0, (c.t - (c.life - 0.4)) / 0.4);
      const x = W - w - 6 + (1 - k) * (1 - k) * 60 + out * out * 70, y = 30;
      ctx.save(); ctx.globalAlpha = Math.min(k, 1 - out);
      G.panel(ctx, x, y, w, h, { r: 4, thin: true, border: c.color || '#ffd84a' });
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; G.rrPath(ctx, x + 5, y + 5, 28, 28, 3); ctx.fill();
      if (c.icon) G.drawFit(ctx, c.icon, x + 6, y + 6, 26, 26);
      G.pill(ctx, x + 38, y + 4, G.textW('NOVO INIMIGO') + 10, 10, '#ff9ae6');
      G.text('NOVO INIMIGO', x + 43, y + 5.5, '#ff9ae6', { shadow: false });
      G.text(c.title, x + 44 + G.textW('NOVO INIMIGO') + 8, y + 5.5, c.color || '#ffd84a');
      lines.forEach((l, i) => G.text(l, x + 38, y + 17 + i * 9, '#e8e4f4'));
      // barra de tempo
      ctx.fillStyle = G.col.alpha(c.color || '#ffd84a', 0.6); ctx.fillRect(x + 6, y + h - 3, (w - 12) * Math.max(0, 1 - c.t / c.life), 1);
      ctx.restore();
    },
    drawFig,
    // ---------------- HUD ----------------
    drawHUD(ctx) {
      const P = G.P; if (!P) return;
      const grd = ctx.createLinearGradient(0, 0, 0, 30);
      grd.addColorStop(0, 'rgba(6,4,16,0.6)'); grd.addColorStop(1, 'rgba(6,4,16,0)');
      ctx.fillStyle = grd; ctx.fillRect(0, 0, W, 30);
      // corações (o último cheio pulsa com vida baixa)
      const hearts = Math.ceil(P.maxHp / 4), low = P.hp <= Math.max(2, P.maxHp * 0.25);
      for (let i = 0; i < hearts; i++) {
        const hx = 5 + (i % 10) * 10, hy = 4 + Math.floor(i / 10) * 9;
        const fill = G.clamp(P.hp - i * 4, 0, 4) / 4;
        G.draw(ctx, 'heartEmpty', hx, hy);
        if (fill > 0) {
          const s = G.spr.heartFull, cw = Math.ceil(9 * fill);
          const pulse = low && fill > 0 && P.hp - i * 4 <= 4 ? 1 + 0.12 * Math.max(0, Math.sin(G.time * 9)) : 1;
          if (pulse > 1) { ctx.save(); ctx.translate(hx + 4.5, hy + 4); ctx.scale(pulse, pulse); ctx.drawImage(s, 0, 0, cw * G.AR, 8 * G.AR, -4.5, -4, cw, 8); ctx.restore(); }
          else ctx.drawImage(s, 0, 0, cw * G.AR, 8 * G.AR, hx, hy, cw, 8);
        }
      }
      // nível e XP
      const hy2 = 5 + Math.ceil(hearts / 10) * 9;
      G.panel(ctx, 4, hy2, 22, 10, { r: 2, bgTop: '#2a5a8a', bg: '#14304a', corners: false, thin: true, border: '#7ae4ff' });
      G.text('Nv' + P.level, 7, hy2 + 2, '#ffffff', { shadow: false });
      const need = G.xpNeeded(P.level), k = Math.min(1, P.xp / need);
      G.bar(ctx, 28, hy2 + 3, 40, 4, k, '#7ae4ff', '#2a8ad0');
      // item secundário
      const bx = 296, by = 4;
      if (P.items.bombs || P.items.beam || P.items.hook) {
        G.panel(ctx, bx, by, 20, 20, { r: 3, bgTop: '#2e2860', bg: '#120e30', corners: false, thin: true });
        G.panel(ctx, bx - 5, by + 12, 9, 9, { r: 2, bgTop: '#ffe27a', bg: '#c08a1a', corners: false, thin: true, border: '#7a4a10' });
        G.text('C', bx - 3, by + 14, '#3a2008', { shadow: false });
      }
      if (P.sub === 'bomb') { G.draw(ctx, 'bomb', bx + 2, by + 2); G.text(String(P.bombs), bx + 19, by + 13, '#ffffff', { align: 'right', outline: '#1a1028' }); }
      else if (P.sub === 'hook') G.draw(ctx, 'hookItem', bx + 2, by + 2);
      else if (P.sub === 'beam') {
        G.draw(ctx, 'beamItem', bx + 2, by + 2);
        if (G.player && G.player.charge > 0) { const c = Math.min(1, G.player.charge / 0.9); G.bar(ctx, bx + 2, by + 17, 16, 2, c, c >= 1 ? '#ffffff' : '#7ae4ff', '#2a8ad0'); }
      }
      // moedas / chaves
      G.draw(ctx, 'iconCoin', 322, 5); G.text(String(P.coins).padStart(3, '0'), 333, 5.5, '#ffe27a', { outline: '#2a1a08' });
      if (G.map && G.map.kind === 'dungeon') {
        const did = G.map.id;
        G.draw(ctx, 'iconKey', 356, 5); G.text(String(P.keys[did] || 0), 366, 5.5, '#ffffff', { outline: '#1a1028' });
        if (P.bossKey[did]) G.draw(ctx, 'bossKey', 360, 13, { scale: 0.7 });
      }
      if (G.player) {
        const pl = G.player;
        if (pl.starT > 0) { G.text('★ INVENCÍVEL', W / 2, 5, ['#ffd84a', '#ff6aa0', '#7ae4ff', '#7aff8a'][Math.floor(G.time * 10) % 4], { align: 'center', outline: '#1a1028' }); }
        else if (pl.cold && Math.floor(G.time * 3) % 2 === 0) G.text('* FRIO! *', W / 2, 5, '#c8f0ff', { align: 'center', outline: '#1a2a4a' });
        if (pl.superT > 0) G.text('SUPER!', W / 2, 14, '#ff8a5a', { align: 'center', outline: '#3a1008' });
      }
    },
    updateHUD(dt) {
      const P = G.P; if (!P) return;
      if (P.hp > 0 && P.hp <= Math.max(2, P.maxHp * 0.25)) { this.lowT -= dt; if (this.lowT <= 0) { this.lowT = 1.1; G.sfx('lowhp'); } }
    }
  };
})(window.G);
