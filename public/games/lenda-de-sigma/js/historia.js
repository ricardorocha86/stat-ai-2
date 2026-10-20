'use strict';
// =====================================================================
//  História do Viés: aparições em holograma depois de cada cristal (cada
//  uma traz uma "mentira estatística" que o jogador desmascara), a chegada
//  ao Planalto, a entrada do castelo, a abertura da luta final, a fala da
//  fase de fúria e o desfecho, em que a máscara se quebra e revela
//  Vicente, o antigo aprendiz do Mestre Gauss.
// =====================================================================
(function (G) {
  const TS = 16, TAU = Math.PI * 2;
  const say = (n, t, o) => G.ui.say(n, t, o);
  const VP = { portrait: 'viesNPC_down0' }, HP = { portrait: 'hero_down0' }, GP = { portrait: 'gauss_down0' }, VC = { portrait: 'vicente_down0' };

  G.CAST.vicente = { skin: G.CAST.hero.skin, hair: '#2a1040', hairStyle: 'short', tunic: '#3a1a5a', trim: '#ffd23a', robe: true, belt: '#ffd23a', boots: '#1a0a2a', glasses: true, build: 'tall' };

  // ------------------------------------------------------------------
  //  Sons
  // ------------------------------------------------------------------
  const A = G.audio;
  G.SFX.glitch = () => { for (let i = 0; i < 5; i++) { A.noise({ d: 0.05, v: 0.12, ft: 'bandpass', f: 600 + i * 900, delay: i * 0.045 }); A.tone({ f: 120 + i * 260, d: 0.04, type: 'sawtooth', v: 0.05, delay: i * 0.05 }); } };
  G.SFX.laugh = () => { for (let i = 0; i < 4; i++) A.tone({ f: 320 - i * 30, f2: 200 - i * 25, d: 0.13, type: 'sawtooth', v: 0.08, delay: i * 0.17 }); };
  G.SFX.thunder = () => { A.noise({ d: 1.2, v: 0.4, f: 400, f2: 40 }); A.tone({ f: 60, f2: 30, d: 0.9, type: 'sawtooth', v: 0.12 }); };
  G.SFX.crackle = () => { A.noise({ d: 0.3, v: 0.25, ft: 'highpass', f: 3000 }); A.tone({ f: 900, f2: 120, d: 0.3, type: 'square', v: 0.06 }); };

  // ------------------------------------------------------------------
  //  Camada de cinema: faixas pretas e tom arroxeado
  // ------------------------------------------------------------------
  const CINE = G.cine = { k: 0, target: 0, tint: 0, tintT: 0, last: 0 };
  G.cineDraw = (ctx) => {
    const now = G.time, dt = Math.min(0.1, Math.max(0, now - CINE.last)); CINE.last = now;
    CINE.k = G.approach(CINE.k, CINE.target, dt * 2.5); CINE.tint = G.approach(CINE.tint, CINE.tintT, dt * 1.5);
    const W = G.W, H = G.H;
    if (CINE.tint > 0) {
      const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, W * 0.65);
      g.addColorStop(0, 'rgba(90,20,140,0)'); g.addColorStop(1, 'rgba(70,10,110,' + (0.55 * CINE.tint) + ')');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    if (CINE.k > 0) { const h = Math.round(20 * CINE.k); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, h); ctx.fillRect(0, H - h, W, h); }
  };
  const cine = (on, tint = on) => { CINE.target = on ? 1 : 0; CINE.tintT = tint ? 1 : 0; };
  G.cineSet = cine;

  // ------------------------------------------------------------------
  //  Holograma do Viés (com falhas de sinal)
  // ------------------------------------------------------------------
  class ViesHolo extends G.Ent {
    constructor(x, y, o = {}) { super(x - 8, y - 5, 16, 10); this.room = G.curRoom; this.appear = 0; this.leaving = -1; this.hurtT = 0; this.laughT = 0; this.big = !!o.big; this.alwaysUpdate = true; }
    leave() { this.leaving = 0; G.sfx('glitch'); }
    hurt() { this.hurtT = 0.9; G.sfx('crackle'); G.shake(3, 0.3); G.flash('#ff6a9a', 0.25, 0.35); }
    laugh() { this.laughT = 1.2; G.sfx('laugh'); }
    update(dt) {
      this.t += dt; this.appear = Math.min(1, this.appear + dt / 0.7);
      if (this.hurtT > 0) this.hurtT -= dt; if (this.laughT > 0) this.laughT -= dt;
      if (this.leaving >= 0) { this.leaving += dt; if (this.leaving > 0.7) { this.dead = true; G.fx.burst(this.cx, this.cy - 20, ['#c070ff', '#ffffff', '#7ae4ff'], 26, 90); } }
      if (Math.random() < 0.2) G.fx.spawn({ x: this.cx + G.rf(-10, 10), y: this.cy - G.rf(0, 36), vy: -14, life: 0.6, color: G.pick(['#c070ff', '#ff6aa0', '#7ae4ff']), size: 1 });
    }
    get by() { return this.y + this.h + 2; }
    draw(ctx, cam) {
      const x = this.cx - cam.x + (this.hurtT > 0 ? Math.sin(this.t * 70) * 1.5 : 0), base = this.y + this.h - cam.y - (this.laughT > 0 ? Math.abs(Math.sin(this.t * 18)) * 2 : 0);
      const k = this.leaving >= 0 ? Math.max(0, 1 - this.leaving / 0.7) : this.appear, ky = k * k * (3 - 2 * k);
      if (ky <= 0.01) return;
      G.shadow(ctx, x, this.y + this.h - cam.y, 18 * ky, 0.3);
      // coluna de luz da materialização
      if (k < 1) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (1 - k) * 0.8; ctx.fillStyle = '#e0b0ff'; ctx.fillRect(x - 2 - 10 * k, base - 70, 4 + 20 * k, 72); ctx.restore(); }
      ctx.save(); ctx.translate(x, base); ctx.scale(1 + (1 - ky) * 0.6, ky); ctx.translate(-x, -base);
      const fl = this.hurtT > 0 && Math.floor(this.t * 20) % 2 === 0;
      // cópias deslocadas (sinal falhando)
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      G.drawVies(ctx, x - 2 + Math.sin(this.t * 11) * 1.5, base, this.t, false, this.big, 0.25);
      G.drawVies(ctx, x + 2 - Math.sin(this.t * 13) * 1.5, base, this.t, false, this.big, 0.18);
      ctx.restore();
      G.drawVies(ctx, x, base, this.t, fl, this.big, 0.85 + 0.15 * Math.sin(this.t * 30));
      // faixa deslocada aleatória
      if (Math.random() < 0.12) { const by = base - G.rf(8, 46); ctx.save(); ctx.beginPath(); ctx.rect(x - 26, by, 52, G.rf(2, 5)); ctx.clip(); G.drawVies(ctx, x + G.rf(-6, 6), base, this.t, false, this.big, 1); ctx.restore(); }
      ctx.restore();
      // linhas de varredura
      ctx.save(); ctx.globalAlpha = 0.18 * ky; ctx.fillStyle = '#1a0a2a'; for (let y = base - 60; y < base; y += 2) ctx.fillRect(x - 24, y + ((this.t * 20) % 2), 48, 0.6); ctx.restore();
    }
  }
  G.ViesHolo = ViesHolo;

  // painel holográfico com a "mentira" do Viés
  class LiePanel extends G.Ent {
    constructor(x, y, lie, h = 66) { super(x, y, 112, h); this.lie = lie; this.room = G.curRoom; this.late = true; this.crackT = -1; this.appear = 0; this.alwaysUpdate = true; }
    crack() { this.crackT = 0; G.sfx('crackle'); }
    update(dt) {
      this.t += dt; this.appear = Math.min(1, this.appear + dt * 3);
      if (this.crackT >= 0) { this.crackT += dt; if (this.crackT > 0.9) { this.dead = true; G.fx.burst(this.cx, this.cy, ['#ff6aa0', '#ffffff', '#c070ff'], 30, 110); } }
    }
    get by() { return 99999; }
    draw(ctx, cam) {
      const L = this.lie, k = this.appear, jx = this.crackT >= 0 ? Math.sin(this.t * 80) * 2 : (Math.random() < 0.05 ? G.rf(-2, 2) : 0);
      const x = Math.round(this.x - cam.x + jx), y = Math.round(this.y - cam.y), w = this.w, h = this.h;
      ctx.save(); ctx.globalAlpha = k * (0.85 + 0.15 * Math.sin(this.t * 25));
      ctx.fillStyle = 'rgba(30,8,50,0.82)'; G.rrPath(ctx, x, y, w, h, 4); ctx.fill();
      ctx.strokeStyle = '#d070ff'; ctx.lineWidth = 1; ctx.setLineDash([5, 2]); ctx.lineDashOffset = -this.t * 12; G.rrPath(ctx, x + 0.5, y + 0.5, w - 1, h - 1, 4); ctx.stroke(); ctx.setLineDash([]);
      G.text(L.title, x + w / 2, y + 4, '#ff8ad8', { align: 'center', shadow: false });
      const gx = x + 8, gy = y + 16, gw = w - 16, gh = h - 26 - (L.note ? 9 : 0);
      if (L.kind === 'bars') {
        const mx = Math.max(...L.vals), n = L.vals.length, bw = gw / n;
        L.vals.forEach((v, i) => { const bh = Math.max(1.5, v / mx * gh); ctx.fillStyle = v === mx ? '#ff5aa8' : '#7a6aa8'; ctx.fillRect(gx + i * bw + 2, gy + gh - bh, bw - 4, bh); G.text(L.labels[i], gx + i * bw + bw / 2, gy + gh + 1, '#c8b8e8', { align: 'center', shadow: false }); });
      } else if (L.kind === 'target') {
        const cx = gx + gw / 2, cy = gy + gh / 2;
        for (let r = 3; r >= 1; r--) { ctx.fillStyle = r % 2 ? '#e8e0f0' : '#c05a8a'; ctx.beginPath(); ctx.ellipse(cx, cy, r * 7, r * 6, 0, 0, TAU); ctx.fill(); }
        for (const [a, b] of L.pts) { ctx.fillStyle = '#ffd84a'; ctx.fillRect(cx + a * 26 - 1, cy + b * 20 - 1, 2.5, 2.5); }
        ctx.strokeStyle = '#7aff8a'; ctx.beginPath(); ctx.moveTo(cx - 4, cy); ctx.lineTo(cx + 4, cy); ctx.moveTo(cx, cy - 4); ctx.lineTo(cx, cy + 4); ctx.stroke();
        G.text('média', cx + 14, cy - 3, '#7aff8a', { shadow: false });
      } else if (L.kind === 'coins') {
        const s = L.seq;
        for (let i = 0; i < s.length; i++) { const cx = gx + 8 + i * (gw - 16) / (s.length - 1), cy = gy + gh / 2; const q = s[i] === '?'; ctx.fillStyle = q ? (Math.floor(this.t * 3) % 2 ? '#ff5aa8' : '#7a6aa8') : '#ffd23a'; ctx.beginPath(); ctx.arc(cx, cy, 7, 0, TAU); ctx.fill(); G.text(q ? '?' : 'C', cx, cy - 3.5, '#2a1a08', { align: 'center', shadow: false }); }
      } else if (L.kind === 'scatter') {
        ctx.fillStyle = '#9a8ad8'; ctx.fillRect(gx, gy + gh, gw, 1); ctx.fillRect(gx, gy, 1, gh);
        for (let i = 0; i < 9; i++) { const u = (i + 0.5) / 9, v = Math.min(1, u * 0.85 + 0.12 * Math.sin(i * 2.3)); ctx.fillStyle = '#ffd84a'; ctx.fillRect(gx + 4 + u * (gw - 8) - 1, gy + gh - 3 - v * (gh - 6) - 1, 2.5, 2.5); }
        G.text(L.xl, gx + gw / 2, gy + gh + 1, '#c8b8e8', { align: 'center', shadow: false });
        G.text(L.yl, gx + 3, gy, '#c8b8e8', { shadow: false });
      } else if (L.kind === 'giant') {
        const base = gy + gh;
        ctx.strokeStyle = '#9a8ad8'; ctx.beginPath();
        for (let i = 0; i <= gw * 0.7; i++) { const z = (i - gw * 0.3) / (gw * 0.1), yy = base - Math.exp(-z * z / 2) * gh * 0.9; if (i) ctx.lineTo(gx + i, yy); else ctx.moveTo(gx + i, yy); }
        ctx.stroke(); ctx.fillStyle = '#ff5aa8'; ctx.beginPath(); ctx.arc(gx + gw - 6, base - 3, 3, 0, TAU); ctx.fill();
        G.text('3 m', gx + gw - 6, base - 14, '#ff8ad8', { align: 'center', shadow: false });
      }
      if (L.note) G.text(L.note, x + w / 2, y + h - 9, '#8a7aa8', { align: 'center', shadow: false });
      if (this.crackT >= 0) { ctx.strokeStyle = '#ff3a5a'; ctx.lineWidth = 2; const c = Math.min(1, this.crackT * 3); ctx.beginPath(); ctx.moveTo(x + 6, y + 6); ctx.lineTo(x + 6 + (w - 12) * c, y + 6 + (h - 12) * c); ctx.moveTo(x + w - 6, y + 6); ctx.lineTo(x + w - 6 - (w - 12) * c, y + 6 + (h - 12) * c); ctx.stroke(); }
      ctx.restore();
    }
  }
  G.LiePanel = LiePanel;

  // balão de fala (não bloqueia o jogo)
  class Bubble extends G.Ent {
    constructor(target, text, life, color) { super(target.cx, target.y, 1, 1); this.target = target; this.lines = G.wrap(text, 140); this.life = life; this.color = color || '#ff8ad8'; this.room = target.room; this.late = true; this.alwaysUpdate = true; }
    get by() { return 99999; }
    update(dt) { this.t += dt; this.life -= dt; if (this.life <= 0 || this.target.dead) this.dead = true; }
    draw(ctx, cam) {
      const w = Math.max(...this.lines.map(l => G.textW(l))) + 12, h = this.lines.length * 10 + 6;
      const x = Math.round(G.clamp(this.target.cx - cam.x - w / 2, 4, G.W - w - 4)), y = Math.round(Math.max(22, this.target.y - cam.y - 56 - h));
      ctx.save(); ctx.globalAlpha = Math.min(1, this.t * 5, this.life * 3);
      G.panel(ctx, x, y, w, h, { r: 4, thin: true, corners: false, bgTop: '#3a1a5a', bg: '#1a0a2a', border: this.color });
      this.lines.forEach((l, i) => G.text(l, x + 6, y + 4 + i * 10, '#ffe8ff', { shadow: false }));
      ctx.restore();
    }
  }
  G.bubble = (ent, text, life = 2.6, color) => G.addEnt(new Bubble(ent, text, life, color));

  // ------------------------------------------------------------------
  //  As mentiras do Viés (uma por cristal)
  // ------------------------------------------------------------------
  const SCENES = {
    d1: { topic: 'media',
      intro: ['Hahaha! Então você recuperou o Cristal da ^yMÉDIA^0... Que fofo.', 'Sabe quanto ganha, EM MÉDIA, um morador do meu planalto? ^y1000 moedas^0! Todos lá são ricos!'],
      lie: { title: 'RENDA MÉDIA: 1000!', kind: 'bars', vals: [5, 4, 6, 5, 980], labels: ['Ana', 'Beto', 'Caio', 'Duda', 'VIÉS'] },
      options: ['Um valor extremo (o seu!) puxa a média: a maioria é pobre.', 'Se a média é 1000, todo mundo ganha 1000.', 'A média nunca engana ninguém.'],
      hurt: 'Grr... Valores extremos... Quem te ensinou a olhar isso?!', laugh: 'Hahaha! Todos ricos... menos os quatro coitadinhos!',
      explain: 'Um único valor extremo (^ooutlier^0) puxa a média para cima. Nesses casos, a ^gmediana^0 representa melhor a maioria.',
      exit: 'Aproveite enquanto pode. No Bosque Sombrio, a verdade fica bem no MEIO... e lá ninguém vai te achar!' },
    d2: { topic: 'moda',
      intro: ['Mediana, moda... que coisa mais sem graça.', 'Fiz uma pesquisa: a cor favorita do reino é ^pROXO^0! É a MODA absoluta!'],
      lie: { title: 'COR FAVORITA: ROXO!', kind: 'bars', vals: [9, 2, 3, 1], labels: ['Roxo', 'Azul', 'Verde', 'Amar.'], note: 'pesquisa feita no castelo' },
      options: ['Você só perguntou aos seus guardas de roxo!', 'Se roxo saiu mais, o reino todo prefere roxo.', 'A moda é sempre a cor mais bonita.'],
      hurt: 'Hmpf! Então você reparou nas roupas dos meus guardas...', laugh: 'Hahaha! Roxo para sempre!',
      explain: 'A ^ymoda^0 só descreve os dados coletados. Se a pesquisa ouviu um único grupo, o resultado não vale para todo o reino.',
      exit: 'No Deserto da Dispersão, os dados se espalham tanto que você vai se perder... Hahaha!' },
    d3: { topic: 'desvio',
      intro: ['Então já sabe medir a DISPERSÃO? Olhe meus arqueiros:', 'Em MÉDIA, as flechas caem bem no centro do alvo. São PERFEITOS!'],
      lie: { title: 'MÉDIA = CENTRO!', kind: 'target', pts: [[-0.9, 0.1], [0.9, -0.15], [0.1, 0.9], [-0.1, -0.85], [0.8, 0.7], [-0.75, -0.7]] },
      options: ['A média no centro esconde a dispersão das flechas!', 'Média no centro: todas acertaram o centro.', 'Muita dispersão quer dizer pontaria perfeita.'],
      hurt: 'Argh! O desvio padrão... sempre o desvio padrão!', laugh: 'Hahaha! Perfeitos! Pelo menos em média!',
      explain: 'Média igual não quer dizer resultados iguais. O ^ydesvio padrão^0 mostra o quanto os valores se espalham em volta da média.',
      exit: 'No Vulcão, tudo depende da sorte. E a sorte, garoto, está do MEU lado!' },
    d4: { topic: 'prob',
      intro: ['Probabilidade? Ora, eu sou o mestre do acaso!', 'Esta moeda deu ^yCARA 5 vezes seguidas^0. Agora é CERTEZA que vem coroa! Aposte tudo comigo!'],
      lie: { title: 'AGORA VEM COROA!', kind: 'coins', seq: 'CCCCC?' },
      options: ['A moeda não tem memória: coroa continua com 1/2.', 'Depois de 5 caras, coroa fica garantida.', 'Agora a chance de cara é 6/6.'],
      hurt: 'Grrr... Ninguém mais cai na falácia do apostador?!', laugh: 'Hahaha! Mais um apostador para o meu cofre!',
      explain: 'Essa é a ^ofalácia do apostador^0: cada lançamento é independente. Depois de 5 caras, a próxima ainda tem chance 1/2.',
      exit: 'Nos Picos Gaussianos o frio congela até o pensamento. Duvido que você suba a Torre!' },
    d5: { topic: 'normal',
      intro: ['Cinco cristais... CINCO?! O selo do meu castelo está rachando!', 'Mas veja o que eu encontrei: um homem de ^y3 metros^0! Prova que todos em Datália são gigantes!'],
      lie: { title: 'TODOS SÃO GIGANTES!', kind: 'giant' },
      options: ['Algo a mais de 3σ da média é raríssimo: é 1 caso!', 'Se existe um gigante, todos são gigantes.', 'Na curva normal, todo mundo fica na cauda.'],
      hurt: 'NÃO! A regra 68-95-99,7... Maldita curva de Gauss!', laugh: 'Hahaha! Um caso basta para mim!',
      explain: 'Na curva normal, valores a mais de 3σ da média são raríssimos (0,3%). Um caso extremo não representa a distribuição inteira.',
      exit: 'Pois venha! O selo se rompeu. No meu castelo, cada sala mostra só METADE da verdade... e o último cristal é MEU!' }
  };
  async function choose3(prompt, options) {
    const items = options.map((t, i) => ({ t, ok: i === 0 })); G.shuffle(items);
    const k = await G.ui.ask('Sigma', prompt, items.map(i => i.t), HP);
    return items[k] ? items[k].ok : false;
  }
  async function crystalScene(did) {
    const S = SCENES[did], p = G.player, r = G.map.rooms.find(rr => rr.idx === G.curRoom);
    cine(true); G.music('vies'); G.sfx('glitch'); G.flash('#a040ff', 0.45, 0.55); G.shake(3, 0.5);
    await G.wait(0.5);
    const holo = G.addEnt(new ViesHolo(r.px + 12 * TS, r.py + 3.6 * TS)); holo.room = r.idx;
    p.dir = p.cy > holo.cy ? 1 : 0;
    await G.wait(0.9);
    holo.laugh();
    for (const l of S.intro) await say('Viés', l, VP);
    const panel = G.addEnt(new LiePanel(holo.cx + 22, holo.y - 40, S.lie)); panel.room = r.idx;
    G.sfx('glitch');
    await G.wait(0.4);
    const ok = await choose3('Como desmascarar essa mentira?', S.options);
    G.recordQuiz(S.topic, ok);
    if (ok) {
      G.sfx('correct'); panel.crack(); holo.hurt(); G.addXP(15);
      G.fx.text(holo.cx, holo.y - 50, 'MENTIRA DESMASCARADA!', '#7aff8a', true);
      await G.wait(0.6);
      await say('Viés', S.hurt, VP);
    } else {
      holo.laugh(); G.sfx('wrong');
      await say('Viés', S.laugh, VP);
      panel.crack();
      await say('Mestre Gauss (em pensamento)', 'Sigma, não caia nessa! ' + S.explain + ' Resposta certa: ^g' + S.options[0] + '^0', GP);
    }
    await say('Viés', S.exit, VP);
    holo.leave(); await G.wait(0.9);
    cine(false); G.music('village');
  }
  const ac0 = G.afterCrystal;
  G.afterCrystal = async (cd) => {
    const did = G.map.id;
    if (SCENES[did] && !G.flag('vies_cena_' + did)) { G.setFlag('vies_cena_' + did); await crystalScene(did); }
    return ac0(cd);
  };

  // ------------------------------------------------------------------
  //  Chegada ao Planalto do Viés
  // ------------------------------------------------------------------
  async function planaltoScene() {
    const p = G.player, n = G.P.crystals.length;
    cine(true); G.music(null); G.sfx('thunder'); G.flash('#ffffff', 0.5, 0.8); G.shake(5, 0.8);
    await G.wait(0.8);
    const holo = G.addEnt(new ViesHolo(p.cx, p.y - 46, { big: true })); holo.room = -1;
    G.music('vies'); p.dir = 1;
    await G.wait(0.9); holo.laugh();
    await say('Viés', 'Ora, ora... O aprendiz do velho Gauss chegou ao ^pPlanalto do Viés^0.', VP);
    await say('Viés', 'Daqui de cima eu decido o que o reino vê. Um gráfico aqui, um eixo cortado ali... e o povo acredita em TUDO.', VP);
    if (n < 5) await say('Viés', 'Você tem ' + n + (n === 1 ? ' cristal' : ' cristais') + '. Meu selo só se rompe com ^pcinco^0... e eu duvido que você chegue lá. Hahaha!', VP);
    else await say('Viés', 'Cinco cristais... O selo está quebrado. Então venha, se tiver coragem!', VP);
    const k = await G.ui.ask('Sigma', 'O que responder?', ['Os dados vão mostrar a verdade, Viés!', 'Por que você distorce os números?'], HP);
    if (k === 1) await say('Viés', 'Porque a verdade é teimosa demais! Eu prefiro números que concordam COMIGO.', VP);
    else await say('Viés', 'A verdade? A verdade é só a amostra que EU escolho!', VP);
    holo.laugh(); await G.wait(0.5);
    holo.leave(); await G.wait(0.9);
    cine(false); G.restoreMusic();
  }
  const wu = G.world.update;
  G.world.update = function (dt) {
    const before = this.curRegion;
    wu.call(this, dt);
    if (this.curRegion === 'castelo' && before !== 'castelo' && before !== null && G.P && G.P.items.sword && !G.flag('vies_planalto') && !G.cutscene) {
      G.setFlag('vies_planalto'); G.runScript(planaltoScene);
    }
  };

  // ------------------------------------------------------------------
  //  Entrada do castelo
  // ------------------------------------------------------------------
  async function castleScene() {
    const p = G.player, r = G.map.rooms.find(rr => rr.idx === G.curRoom);
    await G.wait(0.4);
    cine(true); G.music('vies'); G.sfx('glitch'); G.flash('#a040ff', 0.35, 0.45);
    const holo = G.addEnt(new ViesHolo(r.px + 12 * TS, r.py + 4 * TS)); holo.room = r.idx; p.dir = 1;
    await G.wait(0.9);
    await say('Viés', 'Bem-vindo ao meu castelo, Sigma. Aqui eu guardo o último cristal: o da ^pAMOSTRA^0.', VP);
    await say('Viés', 'Sem ele, ninguém sabe ESCOLHER quem ouvir. Meus guardas, por exemplo, foram escolhidos a dedo... como todos os meus dados.', VP);
    holo.laugh();
    await say('Viés', 'Suba até a sala do trono, se puder. Mas cuidado: aqui, cada sala conta só metade da história!', VP);
    holo.leave(); await G.wait(0.9);
    cine(false);
    await say(null, 'Leia a ^cTábua^0 da entrada para aprender sobre ^yamostragem^0: é a arma contra os truques do Viés!');
    G.restoreMusic();
  }
  const er0 = G.dun.enterRoom;
  G.dun.enterRoom = function (idx, instant) {
    const m = G.map, r = m && m.rooms && m.rooms.find(rr => rr.idx === idx);
    const play = m && m.id === 'd6' && r && r.type === 'start' && !G.flag('vies_castelo') && !(G.P.flags.boss_d6);
    if (play) { G.setFlag('vies_castelo'); G.setFlag('d6_entered'); }
    const res = er0.call(this, idx, instant);
    if (play) G.runScript(castleScene);
    return res;
  };

  // ------------------------------------------------------------------
  //  Abertura da luta final
  // ------------------------------------------------------------------
  const BOSS_LIES = [
    { title: 'EIXO CORTADO!', kind: 'bars', vals: [97, 98, 100], labels: ['Eles', 'Nós', 'EU'], note: 'o eixo começa em 96' },
    { title: 'SÓ OS MEUS DADOS', kind: 'bars', vals: [2, 1, 12], labels: ['Não', 'Talvez', 'Sim'], note: 'amostra: meus guardas' },
    { title: 'SORVETE AFOGA!', kind: 'scatter', xl: 'sorvetes vendidos', yl: 'afogamentos' }
  ];
  G.viesBossIntro = async (boss) => {
    const r = G.map.rooms.find(rr => rr.idx === boss.room), p = G.player;
    cine(true, false); G.music('vies');
    await say('Viés', 'Então você chegou até aqui... juntando cristais, aprendendo médias, medianas, probabilidades.', VP);
    await say('Viés', 'Mas eu conheço um segredo que o seu mestre nunca contou: os números não mentem... as PESSOAS é que escolhem quais números mostrar!', VP);
    const panels = BOSS_LIES.map((L, i) => { const pl = G.addEnt(new LiePanel(r.px + [22, 250, 136][i], r.py + [22, 22, 84][i], L, 60)); pl.room = r.idx; return pl; });
    G.sfx('glitch'); G.shake(2, 0.4);
    await G.wait(0.6);
    await say('Viés', 'Junte-se a mim, Sigma! Juntos mostraremos ao reino só os dados que NOS agradam.', VP);
    const k = await G.ui.ask('Sigma', 'O que responder?', ['Nunca! Dados escolhidos a dedo enganam as pessoas.', 'E se a verdade não me agradar?'], HP);
    if (k === 1) {
      await say('Viés', 'Então você a ESCONDE, como eu!', VP);
      await say('Sigma', 'Não. Um estatístico aceita os dados... mesmo quando eles o contrariam.', HP);
    } else await say('Viés', 'Hmpf. Igualzinho ao velho Gauss.', VP);
    await say('Viés', 'Então prove, se for capaz de distinguir o VERDADEIRO do FALSO!', VP);
    G.sfx('roar'); G.flash('#c050ff', 0.5, 0.6); G.shake(5, 0.6);
    for (const pl of panels) pl.crack();
    void p;
    await G.wait(0.6);
    cine(false); G.music('finalboss');
  };
  G.viesPhase2 = (boss) => {
    G.hitStop = Math.max(G.hitStop, 0.3); G.flash('#ff3a8a', 0.5, 0.6); G.shake(6, 0.6); G.sfx('laugh');
    G.bubble(boss, 'Chega de brincadeira! Agora veja a DISTORÇÃO TOTAL!', 3.2);
  };


  // ------------------------------------------------------------------
  //  Nova página da introdução: o Viés distorcendo os números
  // ------------------------------------------------------------------
  G.introArt = G.introArt || {};
  G.introArt.vies2 = (ctx, cx, cy, t) => {
    const base = cy + 40;
    for (let i = 0; i < 6; i++) {
      const side = i < 3 ? -1 : 1, bx = cx + side * (52 + (i % 3) * 18), h = 14 + 44 * Math.abs(Math.sin(t * (0.9 + i * 0.37) + i * 1.7));
      ctx.fillStyle = i === 4 ? 'rgba(255,90,168,0.75)' : 'rgba(122,106,168,0.55)'; ctx.fillRect(bx - 6, base - h, 12, h);
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(bx - 6, base - h, 12, 1);
    }
    ctx.strokeStyle = '#ff8ad8'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx - 120, base); ctx.lineTo(cx - 34, base);
    for (let k = 0; k < 4; k++) ctx.lineTo(cx - 30 + k * 4, base + (k % 2 ? -4 : 4)); ctx.moveTo(cx + 34, base); ctx.lineTo(cx + 120, base); ctx.stroke();
    G.text('eixo cortado!', cx + 76, base + 4, '#ff8ad8', { align: 'center', shadow: false });
    if ((t % 3.2) < 0.12) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(0, 0, G.W, G.H); }
    G.drawVies(ctx, cx, base, t, false, true, 1);
    const cs = ['media', 'mediana', 'dispersao', 'prob', 'distrib', 'amostra'];
    cs.forEach((c, i) => { const k = ((t * 0.35 + i / 6) % 1), a = t * 2.2 + i * TAU / 6, rr = 46 * (1 - k) + 6; G.draw(ctx, 'crystal_' + c, cx + 13 + Math.cos(a) * rr - 8, cy - 2 + Math.sin(a) * rr * 0.5 - 8, { alpha: 0.4 + 0.6 * (1 - k) }); });
  };

  // ------------------------------------------------------------------
  //  Desfecho: a máscara se quebra
  // ------------------------------------------------------------------
  class Fallen extends G.Ent {
    constructor(x, y) { super(x - 8, y - 5, 16, 10); this.room = G.curRoom; this.mask = 1; this.alwaysUpdate = true; this.crackT = 0; }
    unmask() { this.mask = 0; this.breaking = false; }
    update(dt) { this.t += dt; if (this.breaking) { this.crackT += dt; if (this.crackT > 0.8 && this.mask > 0) { this.mask = 0; G.fx.burst(this.cx, this.y - 24, ['#f0e8f8', '#b8a8d0', '#ff3a6a'], 30, 100, { grav: 200 }); G.sfx('brick'); G.flash('#ffffff', 0.5, 0.7); } } }
    draw(ctx, cam) {
      const x = this.cx - cam.x, base = this.y + this.h - cam.y;
      G.shadow(ctx, x, base, 16, 0.35);
      if (this.mask > 0) {
        const jx = this.breaking ? Math.sin(this.t * 60) * (1 + this.crackT * 2) : 0;
        ctx.save(); ctx.translate(x + jx, base); ctx.rotate(0.15); ctx.translate(-x - jx, -base);
        G.drawVies(ctx, x + jx, base + 4, this.t * 0.3, this.breaking && Math.floor(this.t * 20) % 2 === 0, false, 1);
        ctx.restore();
        if (this.breaking) { ctx.strokeStyle = '#1b1428'; ctx.lineWidth = 1; const c = Math.min(1, this.crackT / 0.7); ctx.beginPath(); ctx.moveTo(x, base - 34); ctx.lineTo(x - 3 * c, base - 30); ctx.lineTo(x + 2 * c, base - 26); ctx.lineTo(x - 2 * c, base - 22); ctx.stroke(); }
      } else {
        const s = G.spr[this.up ? 'vicente_down_stand' : 'vicente_down1'] || G.spr.vicente_down0;
        if (s && this.lying) { ctx.save(); ctx.translate(x, base - 4); ctx.rotate(-Math.PI / 2); ctx.globalAlpha = 0.95; ctx.drawImage(G.tint ? G.tint(s, 'rgba(60,30,90,0.25)') : s, -G.lh(s) / 2 + 4, -G.lw(s) / 2, G.lw(s), G.lh(s)); ctx.restore(); }
        else if (s) G.draw(ctx, s, x - G.lw(s) / 2, base - G.lh(s) + (this.up ? 1 : 4));
      }
    }
  }
  G.ViesFallen = Fallen;
  class GaussVisit extends G.Ent {
    constructor(x, y) { super(x - 5, y - 4, 10, 8); this.room = G.curRoom; this.appear = 0; this.alwaysUpdate = true; }
    update(dt) { this.t += dt; this.appear = Math.min(1, this.appear + dt * 1.5); }
    draw(ctx, cam) {
      const s = G.spr.gauss_down_stand || G.spr.gauss_down0; if (!s) return;
      const x = this.cx - cam.x, base = this.y + this.h - cam.y;
      if (this.appear < 1) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - this.appear; ctx.fillStyle = '#bff4ff'; ctx.fillRect(x - 6, base - 60, 12, 62); ctx.restore(); }
      G.shadow(ctx, x, base, 12, 0.3 * this.appear);
      G.draw(ctx, s, x - G.lw(s) / 2, base - G.lh(s) + 1, { alpha: this.appear });
      G.light.add(x, base - 14, 40, '#bff4ff', 0.5 * this.appear);
    }
  }
  G.finalVictory = async () => {
    const P = G.P, p = G.player, r = G.map.rooms.find(rr => rr.idx === G.curRoom);
    G.music(null); cine(true, false);
    for (const e of G.ents) if (e.isEnemy) e.dead = true;
    let fx = r.px + 12 * TS, fy = r.py + 5 * TS;
    let vies = G.ents.find(e => e instanceof Fallen && !e.dead && e.room === r.idx);
    if (P.flags.vies_f1) {
      // a Grande Distorção foi destruída: o corpo de Vicente desperta
      if (!vies) { vies = G.addEnt(new Fallen(fx, fy)); vies.room = r.idx; vies.unmask(); vies.lying = true; }
      fx = G.clamp(vies.cx, r.px + 5 * TS, r.px + 19 * TS); fy = G.clamp(vies.cy, r.py + 3 * TS, r.py + 7 * TS); vies.x = fx - 8; vies.y = fy - 5;
      p.x = fx - 5; p.y = fy + 2.2 * TS; p.dir = 1;
      await G.wait(1.4);
      await say('Sigma', 'A máscara se desfez em mil pedaços... E esse rapaz caído?', HP);
      G.sfx('heal'); vies.lying = false;
      G.fx.burst(vies.cx, vies.y - 10, ['#ffffff', '#bff4ff'], 14, 50);
      await G.wait(0.9);
      G.music('ending');
      await G.wait(0.6);
    } else {
      if (!vies) { vies = G.addEnt(new Fallen(fx, fy)); vies.room = r.idx; }
      p.x = fx - 5; p.y = fy + 2.2 * TS; p.dir = 1;
      await G.wait(1.2);
      await say('Viés', 'Impossível... Uma amostra tão pequena quanto você... derrotou o grande Viés...', VP);
      await say('Viés', 'Minha máscara... ela está... rachando...', VP);
      vies.breaking = true; G.sfx('crackle'); G.shake(3, 1);
      await G.wait(1.3);
      G.music('ending');
      await G.wait(0.8);
    }
    await say('Sigma', 'Você... é só um rapaz?', HP);
    const gauss = G.addEnt(new GaussVisit(fx - 3 * TS, fy + 1.5 * TS)); gauss.room = r.idx; G.sfx('warp');
    await G.wait(1.0);
    await say('Mestre Gauss', '^yVicente^0... Então era mesmo você.', GP);
    await say('Sigma', 'Vicente? O aprendiz que fugiu da vila anos atrás?', HP);
    vies.up = true;
    await say('Vicente', 'Mestre... Eu só queria estar CERTO. Toda vez que os dados me contrariavam, eu escolhia outros dados...', VC);
    await say('Vicente', '...até que só sobraram os que concordavam comigo. Aí eu roubei os cristais para o reino inteiro pensar como eu.', VC);
    await say('Mestre Gauss', 'Isso tem nome, Vicente: ^yviés de confirmação^0. Um estatístico não procura estar certo. Procura a ^gverdade^0, mesmo quando ela nos contraria.', GP);
    const k = await G.ui.ask('Sigma', 'O que dizer a Vicente?', ['Ainda dá tempo de aprender de novo!', 'Os dados não mentem: quem mente é quem os esconde.'], HP);
    if (k === 0) await say('Vicente', 'Aprender... de novo? Depois de tudo o que eu fiz? ...Obrigado, Sigma.', VC);
    else await say('Vicente', 'Você tem razão. Eu escondi a verdade até de mim mesmo.', VC);
    await say('Vicente', 'Tome. O ^pCristal da Amostra^0 é seu. E... me desculpe.', VC);
    if (!P.crystals.includes('amostra')) P.crystals.push('amostra');
    G.sfx('crystal'); p.state = 'hold'; p.holdItem = 'crystal_amostra';
    await G.ui.banner('crystal_amostra', 'CRISTAL DA AMOSTRA!', 'Os seis Cristais da Razão foram recuperados! O equilíbrio volta ao reino de Datália.', { color: '#ff9ae6' });
    p.state = 'normal'; p.holdItem = null;
    if (P.flags.inferencia) await say('Vicente', 'E esse sétimo cristal, o da Inferência... foi ele que me fez enxergar. Sem ele, eu nunca teria tirado a máscara.', VC);
    await say('Mestre Gauss', 'Venha, Vicente. Há muito o que reaprender... começando pela média, que tal?', GP);
    await say('Vicente', 'Pela média. E pela mediana. E pelo desvio padrão... de TODOS os dados.', VC);
    P.flags.vicente = true; P.flags.won = true; P.flags.endTime = P.playTime;
    G.saveGame();
    await G.ui.fade(1, 1.4);
    cine(false); CINE.k = 0;
    G.state = 'ending'; G.endT = 0;
    G.music('ending');
    await G.ui.fade(0, 1);
  };
})(window.G);
