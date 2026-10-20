'use strict';
// =====================================================================
//  Luz e atmosfera: mapa de luz (ambiente multiplicado + luzes somadas),
//  halos aditivos, vinheta e partículas de clima por região.
// =====================================================================
(function (G) {
  const W = G.W, H = G.H;
  let lm = null, lx = null, vig = null;
  const lights = [];

  const L = G.light = {
    ambient: null, // cor multiplicada (null = sem escurecer)
    begin() { lights.length = 0; },
    // x,y em coordenadas de tela lógicas
    add(x, y, r, color = '#ffd8a0', a = 1, glow = 0) { if (x < -r || y < -r || x > W + r || y > H + r) return; lights.push({ x, y, r, color, a, glow }); },
    render(ctx) {
      if (!lm) { lm = G.canvas(W, H); lx = lm.getContext('2d'); }
      if (this.ambient) {
        lx.globalCompositeOperation = 'source-over';
        lx.fillStyle = this.ambient; lx.fillRect(0, 0, W, H);
        lx.globalCompositeOperation = 'lighter';
        for (const l of lights) G.glow(lx, l.x, l.y, l.r, l.color, l.a);
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(lm, 0, 0, W, H);
        ctx.restore();
      }
      // halos aditivos (brilho das fontes de luz)
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const l of lights) if (l.glow > 0) G.glow(ctx, l.x, l.y, l.r * 0.45, l.color, l.glow);
      ctx.restore();
    },
    vignette(ctx, k = 1) {
      if (!vig) {
        vig = G.canvas(W, H); const c = vig.getContext('2d');
        const g = c.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, W * 0.62);
        g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(6,4,16,0.55)');
        c.fillStyle = g; c.fillRect(0, 0, W, H);
      }
      ctx.save(); ctx.globalAlpha = k; ctx.imageSmoothingEnabled = true; ctx.drawImage(vig, 0, 0, W, H); ctx.restore();
    }
  };

  // ------------------------------------------------------------------
  //  Clima / partículas de ambiente (em coordenadas do mundo)
  // ------------------------------------------------------------------
  const amb = [];
  const WEATHER = {
    floresta: { kind: 'leaf', n: 14, cols: ['#4a9a3a', '#7ac04a', '#c8a03a'] },
    pantano: { kind: 'firefly', n: 16, cols: ['#e8ff7a', '#a0ff9a'] },
    montanha: { kind: 'snow', n: 70, cols: ['#ffffff', '#e0ecff'] },
    vulcao: { kind: 'ember', n: 30, cols: ['#ffb040', '#ff6a2a', '#ffe07a'] },
    deserto: { kind: 'dust', n: 26, cols: ['#f4dca0', '#e8c888'] },
    castelo: { kind: 'mist', n: 10, cols: ['#c8a8e8'] },
    vila: { kind: 'petal', n: 8, cols: ['#ffc8e0', '#ffffff'] },
    lago: { kind: 'sparkle', n: 10, cols: ['#ffffff'] },
    planicie: { kind: 'petal', n: 6, cols: ['#ffe07a', '#ffffff'] },
    d4: { kind: 'ember', n: 18, cols: ['#ffb040', '#ff6a2a'] },
    d5: { kind: 'snow', n: 26, cols: ['#ffffff'] },
    d6: { kind: 'mist', n: 8, cols: ['#b080d0'] },
    d2: { kind: 'firefly', n: 8, cols: ['#c8ff7a'] },
    d1: { kind: 'dust', n: 14, cols: ['#e8f0d8'] },
    d3: { kind: 'dust', n: 18, cols: ['#f4dca0'] }
  };
  G.weather = {
    key: null,
    update(dt, key, cam) {
      const wd = WEATHER[key];
      if (key !== this.key) { amb.length = 0; this.key = key; }
      if (!wd) return;
      while (amb.length < wd.n) amb.push(spawn(wd, cam, amb.length < wd.n / 2));
      for (let i = amb.length - 1; i >= 0; i--) {
        const p = amb[i]; p.t += dt;
        switch (wd.kind) {
          case 'snow': p.x += (Math.sin(p.t * 1.3 + p.s) * 10 - 6) * dt; p.y += p.v * dt; break;
          case 'leaf': p.x += (Math.sin(p.t * 2 + p.s) * 18 + 8) * dt; p.y += p.v * 0.6 * dt; break;
          case 'ember': p.x += Math.sin(p.t * 3 + p.s) * 12 * dt; p.y -= p.v * dt; break;
          case 'dust': p.x += (p.v + 10) * dt; p.y += Math.sin(p.t * 2 + p.s) * 6 * dt; break;
          case 'firefly': p.x += Math.sin(p.t * 0.9 + p.s) * 14 * dt; p.y += Math.cos(p.t * 1.1 + p.s * 2) * 12 * dt; break;
          case 'mist': p.x += 6 * dt; break;
          case 'petal': p.x += (Math.sin(p.t * 2 + p.s) * 14 + 10) * dt; p.y += p.v * 0.4 * dt; break;
          case 'sparkle': break;
        }
        const out = p.x < cam.x - 40 || p.x > cam.x + W + 40 || p.y < cam.y - 40 || p.y > cam.y + H + 40;
        if (out || p.t > p.life) amb[i] = spawn(wd, cam, false);
      }
    },
    addLights(cam) {
      const wd = WEATHER[this.key]; if (!wd || (wd.kind !== 'firefly' && wd.kind !== 'ember')) return;
      for (const p of amb) { const f = Math.min(1, p.t * 2, (p.life - p.t) * 2); if (f > 0) G.light.add(p.x - cam.x, p.y - cam.y, 14, p.c, 0.45 * f); }
    },
    draw(ctx, cam) {
      const wd = WEATHER[this.key]; if (!wd) return;
      for (const p of amb) {
        const x = p.x - cam.x, y = p.y - cam.y;
        const fade = Math.min(1, p.t * 2, (p.life - p.t) * 2);
        if (fade <= 0) continue;
        if (wd.kind === 'firefly' || wd.kind === 'ember' || wd.kind === 'sparkle') {
          const tw = wd.kind === 'sparkle' ? Math.max(0, Math.sin(p.t * 4 + p.s)) : (0.6 + 0.4 * Math.sin(p.t * 6 + p.s));
          ctx.save(); ctx.globalCompositeOperation = 'lighter';
          G.glow(ctx, x, y, wd.kind === 'sparkle' ? 3 : 5, p.c, fade * tw * 0.8);
          ctx.restore();
          ctx.globalAlpha = fade * tw; ctx.fillStyle = p.c; ctx.fillRect(G.snap(x), G.snap(y), 0.5, 0.5); ctx.globalAlpha = 1;
        } else if (wd.kind === 'mist') {
          ctx.save(); ctx.globalAlpha = 0.07 * fade; ctx.fillStyle = p.c;
          ctx.beginPath(); ctx.ellipse(x, y, 60, 14, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        } else {
          ctx.globalAlpha = fade * (wd.kind === 'dust' ? 0.5 : 0.9); ctx.fillStyle = p.c;
          const s = wd.kind === 'snow' ? (p.s > 3 ? 1 : 0.5) : wd.kind === 'leaf' || wd.kind === 'petal' ? 1 : 0.5;
          if (wd.kind === 'leaf' || wd.kind === 'petal') { const w = Math.abs(Math.sin(p.t * 4 + p.s)) * 1.5 + 0.5; ctx.fillRect(G.snap(x), G.snap(y), w, 1); }
          else ctx.fillRect(G.snap(x), G.snap(y), s, s);
          ctx.globalAlpha = 1;
        }
      }
    }
  };
  function spawn(wd, cam, anywhere) {
    const p = { t: 0, s: Math.random() * 6.28, life: G.rf(4, 9), c: G.pick(wd.cols), v: G.rf(10, 26) };
    p.x = cam.x + G.rf(-20, W + 20); p.y = cam.y + G.rf(-20, H + 20);
    if (!anywhere) {
      if (wd.kind === 'snow' || wd.kind === 'leaf' || wd.kind === 'petal') p.y = cam.y - 8;
      else if (wd.kind === 'ember') p.y = cam.y + H + 8;
      else if (wd.kind === 'dust' || wd.kind === 'mist') p.x = cam.x - 30;
    }
    if (wd.kind === 'firefly' || wd.kind === 'sparkle') p.life = G.rf(3, 6);
    return p;
  }
})(window.G);
