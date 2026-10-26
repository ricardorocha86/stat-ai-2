'use strict';
// =====================================================================
//  Ampulheta do Recomeço: depois de conquistar uma masmorra, uma ampulheta
//  dourada flutua na sala de entrada. Virá-la faz o tempo da masmorra
//  voltar: portas, chaves, enigmas, salas de combate e o guardião
//  recomeçam. Os tesouros já pegos não voltam, mas o guardião vencido de
//  novo paga moedas, numa chuva que cai direto na bolsa do herói.
// =====================================================================
(function (G) {
  const TS = 16, TAU = Math.PI * 2, A = G.audio;
  const say = (n, t, o) => G.ui.say(n, t, o);
  // moedas da revanche, crescendo com a dificuldade de cada guardião
  const PREMIO = { d1: 40, d2: 60, d3: 80, d4: 100, d5: 120, d7: 150, d6: 200, d9: 250 };
  const emRevanche = did => G.flag(did + '_revanche');
  G.emRevanche = emRevanche;
  G.PREMIO_REVANCHE = PREMIO;

  G.SFX.ampulheta = () => {
    A.tone({ f: 1568, d: 0.5, type: 'sine', v: 0.06 }); A.tone({ f: 2093, d: 0.7, type: 'sine', v: 0.04, delay: 0.09 });
    A.noise({ d: 1.0, v: 0.05, ft: 'bandpass', f: 400, f2: 2600 });
  };
  G.SFX.tempo = () => {
    [1047, 784, 659, 523, 392, 330, 262].forEach((f, i) => A.tone({ f, d: 0.4, type: 'triangle', v: 0.05, delay: i * 0.06 }));
    A.tone({ f: 131, f2: 98, d: 1.6, type: 'sine', v: 0.16, a: 0.02 });
    A.noise({ d: 1.2, v: 0.04, ft: 'bandpass', f: 3000, f2: 300 });
  };

  // ------------------------------------------------------------------
  //  O que volta e o que fica
  // ------------------------------------------------------------------
  // voltam: portas (chaves, oráculos, runas), enigmas, salas de combate, mini-chefes, as chaves e os
  // baús que guardam chaves; ficam: item da masmorra, contêiner, cristal, fragmentos, blocos e oráculos
  function reiniciar(did) {
    const P = G.P, spec = G.DUNGEONS[did], f = P.flags, chaves = new Set();
    const ehChave = c => c && (c.type === 'key' || c.type === 'bossKey');
    for (const k in spec.rooms) {
      const r = spec.rooms[k];
      if (ehChave(r.reward && r.reward.chest) || ehChave(r.clearReward)) chaves.add(did + '_chest_' + k);
      if (r.type === 'bigkey') chaves.add(did + '_bigkey');
    }
    chaves.add(did + '_chaveK'); // a chave do cofre do Núcleo, que o capelo busca
    const voltam = new RegExp('^' + did + '_(door|solved|cleared|read)_');
    for (const k of Object.keys(f)) if (voltam.test(k) || chaves.has(k) || chaves.has(k.replace(/_shown$/, ''))) delete f[k];
    P.keys[did] = 0; P.bossKey[did] = false;
    // o cristal já está com o herói: o salão do chefe não o oferece de novo
    if (spec.crystal && P.crystals.includes(spec.crystal)) f[did + '_crystalGot'] = true;
    if (did === 'd6') f.vies_f1 = true; // a revanche do castelo é contra a forma verdadeira
    f[did + '_revanche'] = true;
  }

  // ------------------------------------------------------------------
  //  Desenho da ampulheta (coordenadas locais: centro do vidro em 0,0)
  // ------------------------------------------------------------------
  const OURO = ['#5a3008', '#a8701a', '#e8b03a', '#ffe08a', '#fff6d0'];
  const AREIA = ['#b8742a', '#f0b04a', '#ffd88a'];
  const ease = k => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
  function bulbo(ctx, s) { // s = -1: bulbo de cima; 1: de baixo
    ctx.moveTo(-0.9, 0);
    ctx.quadraticCurveTo(-1.3, s * 2.4, -4.6, s * 4.4);
    ctx.quadraticCurveTo(-6.4, s * 7.2, -4.8, s * 9);
    ctx.lineTo(4.8, s * 9);
    ctx.quadraticCurveTo(6.4, s * 7.2, 4.6, s * 4.4);
    ctx.quadraticCurveTo(1.3, s * 2.4, 0.9, 0);
    ctx.closePath();
  }
  // a = fração da areia no bulbo de cima
  function areia(ctx, a, fluindo, t) {
    const b = 1 - a, hb = 0.6 + b * 7.6, pico = 9.2 - hb - (fluindo ? 1.4 : 0);
    if (a > 0.02) {
      ctx.save(); ctx.beginPath(); bulbo(ctx, -1); ctx.clip();
      const topo = -(1 + a * 7.6);
      ctx.fillStyle = AREIA[1]; ctx.beginPath(); ctx.moveTo(-7, 0.5); ctx.lineTo(-7, topo);
      if (fluindo) { ctx.lineTo(-1.8, topo); ctx.lineTo(0, topo + Math.min(-topo, 2.4)); ctx.lineTo(1.8, topo); }
      ctx.lineTo(7, topo); ctx.lineTo(7, 0.5); ctx.fill();
      ctx.fillStyle = AREIA[2]; ctx.fillRect(-7, topo, fluindo ? 5.2 : 14, 0.7);
      ctx.restore();
    }
    if (b > 0.02) {
      ctx.save(); ctx.beginPath(); bulbo(ctx, 1); ctx.clip();
      const lado = 9.2 - hb + 1.2;
      ctx.fillStyle = AREIA[1]; ctx.beginPath(); ctx.moveTo(-7, 9.2); ctx.lineTo(-7, lado); ctx.lineTo(0, pico); ctx.lineTo(7, lado); ctx.lineTo(7, 9.2); ctx.fill();
      ctx.fillStyle = 'rgba(120,60,10,0.35)'; ctx.beginPath(); ctx.moveTo(0, pico); ctx.lineTo(7, lado); ctx.lineTo(7, 9.2); ctx.lineTo(0, 9.2); ctx.fill();
      ctx.fillStyle = AREIA[2]; ctx.beginPath(); ctx.moveTo(-7, lado); ctx.lineTo(0, pico); ctx.lineTo(0, pico + 0.7); ctx.lineTo(-7, lado + 0.7); ctx.fill();
      ctx.restore();
    }
    if (fluindo && a > 0.02) { // fio de areia pelo gargalo, com grãos descendo
      ctx.fillStyle = AREIA[2]; ctx.fillRect(-0.35, -0.6, 0.7, pico + 0.6);
      ctx.fillStyle = '#fff2c0';
      for (let i = 0; i < 3; i++) ctx.fillRect(-0.5, (t * 20 + i * 3.1) % Math.max(1, pico), 1, 1);
    }
  }
  function vidro(ctx) {
    ctx.beginPath(); bulbo(ctx, -1); bulbo(ctx, 1);
    ctx.fillStyle = 'rgba(190,230,255,0.16)'; ctx.fill();
    ctx.strokeStyle = 'rgba(220,245,255,0.75)'; ctx.lineWidth = 0.6; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(-3.4, -7.8); ctx.quadraticCurveTo(-4.7, -6.2, -3.6, -4.8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-3.8, 5); ctx.quadraticCurveTo(-4.8, 6.4, -3.8, 7.9); ctx.stroke();
  }
  function moldura(ctx) {
    for (const s of [-1, 1]) {
      ctx.fillStyle = OURO[1]; ctx.fillRect(s * 7 - 0.6, -10, 1.2, 20);
      ctx.fillStyle = OURO[3]; ctx.fillRect(s * 7 - 0.6, -10, 0.5, 20);
      ctx.fillStyle = OURO[2]; ctx.beginPath(); ctx.arc(s * 7, 0, 1.1, 0, TAU); ctx.fill();
    }
    for (const y of [-12.2, 10]) {
      ctx.fillStyle = OURO[0]; ctx.fillRect(-8.6, y, 17.2, 2.2);
      ctx.fillStyle = OURO[2]; ctx.fillRect(-8.2, y + 0.3, 16.4, 1.1);
      ctx.fillStyle = OURO[4]; ctx.fillRect(-6, y + 0.4, 4, 0.5);
      ctx.fillStyle = '#7ae4ff'; ctx.fillRect(-0.7, y + 0.5, 1.4, 1.2);
    }
  }
  function pedestal(ctx, x, b, brilho) {
    ctx.fillStyle = '#241e30'; ctx.fillRect(x - 8.5, b - 7, 17, 7);
    ctx.fillStyle = '#3a3350'; ctx.fillRect(x - 8.5, b - 7, 3, 7);
    ctx.fillStyle = '#4a4260'; ctx.fillRect(x - 10, b - 9.5, 20, 2.8);
    ctx.fillStyle = '#6e6690'; ctx.fillRect(x - 10, b - 9.5, 20, 0.8);
    ctx.fillStyle = OURO[1]; ctx.fillRect(x - 8.5, b - 6.2, 17, 0.6); ctx.fillRect(x - 8.5, b - 1.4, 17, 0.6);
    // runa da ampulheta gravada na frente, acesa
    ctx.fillStyle = 'rgba(255,216,106,' + (0.45 + 0.45 * brilho) + ')';
    ctx.beginPath(); ctx.moveTo(x - 2, b - 5.2); ctx.lineTo(x + 2, b - 5.2); ctx.lineTo(x, b - 3.6); ctx.lineTo(x + 2, b - 2); ctx.lineTo(x - 2, b - 2); ctx.lineTo(x, b - 3.6); ctx.closePath(); ctx.fill();
  }

  // ------------------------------------------------------------------
  //  A ampulheta na sala de entrada
  // ------------------------------------------------------------------
  const lugar = S => (S.exit === 'N' ? [19, 9] : [19, 3]);
  class Ampulheta extends G.Ent {
    get darkGlow() { return 34; }
    constructor(x, y) {
      super(x - 9, y - 4, 18, 8); this.solid = true;
      this.lev = 0; this.ang = 0; this.orb = G.rf(0, TAU); this.virandoT = -1;
      this.tA = G.ampulhetaVirou ? 0 : 20; // tempo desde que a areia começou a cair
    }
    interBox() { return { x: this.x - 3, y: this.y - 8, w: this.w + 6, h: this.h + 12 }; }
    ativa() { return this.forcaAtiva || emRevanche(G.map.id); }
    interact() {
      if (this.virandoT >= 0 || this.forcaAtiva) return;
      const did = G.map.id, spec = G.DUNGEONS[did];
      G.runScript(async () => {
        const ja = emRevanche(did);
        const txt = ja
          ? 'A areia ainda está caindo: os desafios de ^y' + spec.name + '^0 já recomeçaram. Virar de novo devolve tudo ao início outra vez.'
          : 'Toda a areia está embaixo. Virar a ampulheta faz o tempo de ^y' + spec.name + '^0 voltar: portas, chaves, enigmas e o guardião recomeçam. O que você já ganhou continua seu, e o guardião paga ^y' + PREMIO[did] + ' moedas^0 a quem vencê-lo de novo.';
        const r = await G.ui.ask('Ampulheta do Recomeço', txt, [ja ? 'Virar de novo' : 'Virar a ampulheta', 'Agora não'], { cancel: 1 });
        if (r === 0) await this.virar(did);
      });
    }
    async virar(did) {
      const spec = G.DUNGEONS[did];
      G.player.dir = 1; this.virandoT = 0; this.alwaysUpdate = true;
      G.music(null); G.sfx('ampulheta');
      await G.wait(1.2);
      G.sfx('tempo'); G.shake(2, 0.5); G.flash('#ffe8a0', 0.35, 0.4);
      G.addEnt(new OndaTempo(this.cx, this.y - 20)).room = this.room;
      await G.wait(1.4);
      reiniciar(did);
      await G.ui.fade(1, 0.45);
      G.ampulhetaVirou = true; G.dun.load(did); G.ampulhetaVirou = false;
      const S = G.map.byKey.S, [lx, ly] = lugar(S), p = G.player;
      p.x = S.px + lx * TS + 3; p.y = S.py + (ly + 1) * TS + 6; p.dir = 1; p.lastSafe = { x: p.x, y: p.y };
      G.saveGame();
      await G.ui.fade(0, 0.45);
      await say('Ampulheta do Recomeço', 'O tempo de ^y' + spec.name + '^0 voltou ao início: portas trancadas, enigmas novos e o guardião de pé. O que você já ganhou continua seu, e a revanche vale ^y' + PREMIO[did] + ' moedas^0!');
    }
    update(dt) {
      this.t += dt;
      if (this.virandoT >= 0) {
        const v = this.virandoT += dt;
        this.lev = Math.min(1, v / 0.35);
        this.ang = Math.PI * ease(G.clamp((v - 0.35) / 0.8, 0, 1));
        this.orb += dt * (2 + 10 * this.lev);
        if (Math.random() < 0.7) G.fx.converge(this.cx, this.y - 22, G.rf(30, 60), G.pick(['#ffe8a0', '#ffffff', '#ffc85a']), 1, 0.4);
        if (v >= 1.15) { this.virandoT = -1; this.ang = 0; this.forcaAtiva = true; this.tA = 0; G.fx.ring(this.cx, this.y - 22, 26, '#fff2b0', 0.4, 2); }
        return;
      }
      this.lev = G.approach(this.lev, 0, dt * 0.8);
      const at = this.ativa();
      if (at) this.tA += dt;
      this.orb += dt * (at ? 1.6 : 0.8);
      if (Math.random() < dt * (at ? 5 : 2.5)) G.fx.glow(this.cx + G.rf(-8, 8), this.y - G.rf(6, 30), { size: 1.5, color: G.pick(['#ffe8a0', '#ffd06a']), vy: -G.rf(6, 16), life: 1.2 });
    }
    draw(ctx, cam) {
      const x = this.cx - cam.x, b = this.y + this.h - cam.y, at = this.ativa();
      const cy = b - 9.5 - 15 - this.lev * 7 + Math.sin(this.t * 2) * 1.2, pulso = 0.5 + 0.5 * Math.sin(this.t * 3);
      G.light.add(x, cy, 46 + this.lev * 30, '#ffd88a', 0.5 + this.lev * 0.4, 0.3);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      G.glow(ctx, x, b - 9, 12 + this.lev * 6, '#ffd884', 0.2 + 0.12 * pulso + this.lev * 0.3);
      G.glow(ctx, x, cy, 16 + this.lev * 8, '#ffe8a0', 0.12 + (at ? 0.1 : 0) + this.lev * 0.25);
      ctx.restore();
      pedestal(ctx, x, b, pulso);
      // três brilhos orbitam a ampulheta; os de trás são desenhados antes do vidro
      const orbita = atras => {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 3; k++) {
          const a = this.orb + k * TAU / 3, s = Math.sin(a);
          if ((s < 0) !== atras) continue;
          const ox = x + Math.cos(a) * (13 + this.lev * 4), oy = cy + s * 4.5, r = 1.3 + (atras ? 0 : 0.5);
          ctx.fillStyle = atras ? 'rgba(255,220,140,0.5)' : '#fff2c0';
          ctx.beginPath(); ctx.moveTo(ox, oy - r * 1.6); ctx.lineTo(ox + r, oy); ctx.lineTo(ox, oy + r * 1.6); ctx.lineTo(ox - r, oy); ctx.closePath(); ctx.fill();
          G.glow(ctx, ox, oy, 4, '#ffd88a', atras ? 0.2 : 0.4);
        }
        ctx.restore();
      };
      orbita(true);
      ctx.save(); ctx.translate(x, cy); ctx.rotate(this.ang);
      areia(ctx, at ? 0.1 + 0.9 * Math.exp(-this.tA / 45) : 0, at && this.virandoT < 0, this.t);
      vidro(ctx); moldura(ctx);
      ctx.restore();
      orbita(false);
    }
  }

  // onda do tempo: o mundo perde a cor e um mostrador de relógio gira ao contrário
  class OndaTempo extends G.Ent {
    constructor(x, y) { super(x - 2, y - 2, 4, 4); this.alwaysUpdate = true; }
    get by() { return 1e9; }
    update(dt) { this.t += dt; if (this.t < 1 && Math.random() < 0.9) G.fx.converge(this.cx, this.cy, G.rf(60, 180), G.pick(['#ffe8a0', '#ffffff', '#ffc85a']), 1, G.rf(0.4, 0.8)); }
    draw() {}
    drawLate(ctx, cam) {
      const t = this.t, x = this.cx - cam.x, y = this.cy - cam.y, sep = Math.min(1, t / 0.8);
      const k = Math.min(1, t / 1.1), R = 20 + (1 - Math.pow(1 - k, 3)) * 230, rot = -t * 2.4, ph = -t * 7;
      ctx.save();
      ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = 'rgba(128,128,128,' + 0.85 * sep + ')'; ctx.fillRect(0, 0, G.W, G.H);
      ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(255,214,150,' + 0.55 * sep + ')'; ctx.fillRect(0, 0, G.W, G.H);
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = 'rgba(255,226,140,' + 0.6 * (1 - k * 0.5) + ')'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.stroke();
      ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(x, y, R * 0.62, 0, TAU); ctx.stroke();
      for (let i = 0; i < 12; i++) {
        const a = rot + i * TAU / 12, l = i % 3 ? 5 : 11;
        ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * (R - l), y + Math.sin(a) * (R - l)); ctx.lineTo(x + Math.cos(a) * R, y + Math.sin(a) * R); ctx.stroke();
      }
      for (let j = 0; j < 14; j++) { // ponteiro varrendo para trás, com rastro
        const a = ph + j * 0.06;
        ctx.strokeStyle = 'rgba(255,240,190,' + 0.55 * (1 - j / 14) + ')'; ctx.lineWidth = 2 - j * 0.1;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * R * 0.95, y + Math.sin(a) * R * 0.95); ctx.stroke();
      }
      G.glow(ctx, x, y, 26, '#ffe8a0', 0.6);
      ctx.restore();
    }
  }

  // chuva de moedas: saltam do guardião, quicam e voam para o herói; cada uma cai na bolsa ao chegar
  class ChuvaMoedas extends G.Ent {
    constructor(x, y, total, fim) {
      super(x - 4, y - 4, 8, 8); this.alwaysUpdate = true; this.total = total; this.pago = 0; this.fim = fim;
      const n = Math.max(1, Math.min(24, Math.ceil(total / 5))), base = Math.floor(total / n), resto = total - base * n;
      this.moedas = [];
      for (let i = 0; i < n; i++) {
        const a = G.rf(0, TAU), v = G.rf(30, 100);
        this.moedas.push({ x, y: y + 8, z: 10, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.7, vz: G.rf(120, 210), valor: base + (i < resto ? 1 : 0), espera: 0.9 + i * 0.045, f: G.ri(0, 3), viva: true });
      }
      G.sfx('bigcoin');
    }
    get by() { return 1e9; }
    pagar(v) { const P = G.P; P.coins = Math.min(999, P.coins + v); P.stats.coinsTotal += v; this.pago += v; }
    update(dt) {
      this.t += dt;
      const p = G.player; let vivas = 0;
      for (const m of this.moedas) {
        if (!m.viva) continue;
        vivas++;
        if (this.t < m.espera || !p) {
          m.x += m.vx * dt; m.y += m.vy * dt; m.vz -= 520 * dt; m.z += m.vz * dt;
          if (m.z <= 0) { m.z = 0; if (m.vz < -40) { m.vz = -m.vz * 0.45; m.vx *= 0.6; m.vy *= 0.6; } else { m.vz = 0; m.vx = 0; m.vy = 0; } }
          continue;
        }
        m.ima = (m.ima || 0) + dt;
        const dx = p.cx - m.x, dy = p.y + p.h - 4 - m.y, d = Math.hypot(dx, dy), passo = (60 + m.ima * 420) * dt;
        if (d <= Math.max(5, passo)) { m.viva = false; this.pagar(m.valor); G.sfx('coin'); G.fx.spark(p.cx, p.y - 4, '#ffe27a', 3); continue; }
        m.x += dx / d * passo; m.y += dy / d * passo; m.z = G.approach(m.z, 8, 60 * dt);
        if (Math.random() < 0.35) G.fx.glow(m.x, m.y - m.z - 6, { size: 1.5, color: '#ffe27a', life: 0.3 });
      }
      if (vivas && this.t < 7) return;
      if (this.pago < this.total) this.pagar(this.total - this.pago);
      if (p) G.fx.text(p.cx, p.y - 20, '+' + this.total + ' MOEDAS', '#ffd84a', true);
      G.sfx('bigcoin');
      this.dead = true; this.fim();
    }
    draw(ctx, cam) {
      for (const m of this.moedas) {
        if (!m.viva) continue;
        const sx = m.x - cam.x, sy = m.y - cam.y;
        G.shadow(ctx, sx, sy, 6, 0.25);
        G.draw(ctx, 'coin' + (Math.floor(this.t * 10 + m.f) % 4), Math.round(sx - 5), Math.round(sy - 12 - m.z));
        G.light.add(sx, sy - 6 - m.z, 10, '#ffd84a', 0.5);
      }
    }
  }
  G.chuvaDeMoedas = (x, y, total) => new Promise(res => { const c = G.addEnt(new ChuvaMoedas(x, y, total, res)); c.room = G.curRoom; });

  // portal de volta que só se arma depois que o herói sai de cima dele (nascer sob os pés não teleporta)
  const PortalVolta = G.dunClasses && class extends G.dunClasses.Portal {
    update(dt) {
      const p = G.player;
      if (!this.livre) { if (p && G.overlap(p, this)) this.t = 0; else this.livre = true; }
      super.update(dt);
    }
  };

  // ------------------------------------------------------------------
  //  Integração com as masmorras
  // ------------------------------------------------------------------
  const DUN = G.dun;
  // a ampulheta aparece na sala de entrada de toda masmorra conquistada
  const load0 = DUN.load;
  DUN.load = function (did) {
    load0.call(this, did);
    if (!PREMIO[did] || G.map.id !== did || !G.P.flags['boss_' + did]) return;
    const S = G.map.byKey.S; if (!S) return;
    const [lx, ly] = lugar(S);
    G.addEnt(new Ampulheta(S.px + lx * TS + 8, S.py + ly * TS + 12)).room = S.idx;
    if (emRevanche(did)) G.ui.regionBanner(G.map.spec.name, 'revanche');
  };
  // na revanche, o salão do chefe chama o guardião de novo em vez de mostrar o portal
  const sala0 = DUN.bossRoom;
  DUN.bossRoom = function (r) {
    const did = G.map.id, f = G.P.flags;
    if (!emRevanche(did) || !f['boss_' + did]) return sala0.call(this, r);
    delete f['boss_' + did];
    try { sala0.call(this, r); } finally { f['boss_' + did] = true; }
    if (G.boss) { G.boss.revanche = true; G.boss.falou = true; } // o Viés 2.0 não repete a apresentação
    G.ui.toast('Revanche! Vença o guardião de novo e ganhe ' + PREMIO[did] + ' moedas.', '#ffd84a');
  };
  // o Viés Absoluto da revanche surge sem a cena da máscara
  const intro0 = G.viesBossIntro;
  G.viesBossIntro = async (boss) => {
    if (!(boss.revanche && boss.isAbsoluto)) return intro0(boss);
    boss.spawnK = 0; boss.roarT = 1.5; if (!boss.hands.length) boss.start();
    for (let i = 0; i < 30; i++) { boss.spawnK = Math.min(1, boss.spawnK + 0.035); await G.wait(0.04); }
    boss.spawnK = 1;
    await say('Viés Absoluto', 'A ampulheta virou e a distorção voltou com ela! Prove de novo que sabe me desmascarar!', { portrait: 'viesAbsPortrait' });
    G.music(G.bossMusic(boss));
  };
  // o Viés 2.0 foge na metade da vida; na revanche, a fuga vira vitória com prêmio
  if (G.Vies2) {
    const fugir0 = G.Vies2.prototype.fugir;
    G.Vies2.prototype.fugir = function () {
      if (!this.revanche) return fugir0.call(this);
      const self = this;
      this.fugindo = true; this.noContact = true; this.alwaysUpdate = true; this.escudo = true; this.stun = 0;
      for (const e of G.ents) if (e instanceof G.EShot || (e.isEnemy && !e.isBoss && e.room === self.room)) e.dead = true;
      G.music(null);
      G.runScript(async () => {
        G.shake(4, 1); G.sfx('zumbido');
        await G.wait(0.6);
        self.sumindo = 0.001; G.sfx('warp');
        await G.wait(2);
        self.dead = true; G.addXP(self.xp);
        await G.onBossDefeated(self);
      });
    };
  }
  // guardião vencido na revanche: chuva de moedas e portal de volta (sem final, cristal ou contêiner)
  const vitoria0 = G.onBossDefeated;
  G.onBossDefeated = async (boss) => {
    const did = G.map && G.map.id;
    if (!boss.revanche || !emRevanche(did)) return vitoria0(boss);
    const r = G.map.rooms.find(rr => rr.idx === boss.room);
    delete G.P.flags[did + '_revanche'];
    G.boss = null;
    for (const e of G.ents) if ((e.isEnemy && e.room === boss.room) || e instanceof G.EShot) e.dead = true;
    G.sfx('fanfare');
    await G.wait(0.4);
    const cheia = G.P.coins >= 999;
    await G.chuvaDeMoedas(boss.cx, boss.cy - 6, PREMIO[did]);
    G.ui.toast(cheia || G.P.coins >= 999 ? 'Revanche vencida! Sua bolsa está cheia (999 moedas).' : 'Revanche vencida! O guardião pagou ' + PREMIO[did] + ' moedas.', '#ffd84a');
    DUN.unlock(r);
    G.addEnt(new PortalVolta(r.px + 12 * TS, r.py + 9 * TS));
    G.music(G.map.spec.music);
    G.saveGame();
  };
})(window.G);
