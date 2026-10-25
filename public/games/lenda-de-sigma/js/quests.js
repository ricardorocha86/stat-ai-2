'use strict';
// =====================================================================
//  Missões paralelas: diário de missões, marcadores "!" e "?", NPCs novos
//  e as cinco Lentes da Inferência — o chá da Dona Muriel (teste de
//  hipótese), a forja do Tukey (boxplot), a pesquisa do Neyman (intervalo
//  de confiança), o detector do Bayes (prob. condicional) e a máquina do
//  Laplace (Teorema Central do Limite). As lentes abrem o Observatório.
// =====================================================================
(function (G) {
  const say = (n, t, o) => G.ui.say(n, t, o);
  const ask = (n, t, opts, o) => G.ui.ask(n, t, opts, o);
  const P = () => G.P;
  const I = G.input, W = G.W, H = G.H, st = G.st, F = G.fmt;
  const C = G.col, R5 = c => C.ramp(c, 5);
  const N = G.NPCS;

  // ------------------------------------------------------------------
  //  Personagens novos
  // ------------------------------------------------------------------
  const SK = { claro: G.CAST.hero.skin, medio: G.CAST.mendel.skin, moreno: G.CAST.fisher.skin, escuro: G.CAST.villager2.skin };
  Object.assign(G.CAST, {
    muriel: { skin: SK.claro, hair: '#d4d0dc', hairStyle: 'bun', tunic: '#b05a8a', trim: '#f4e4f0', robe: true, belt: '#f4e4f0', boots: '#5a2a4a', glasses: true, apron: '#fff4fa' },
    tukey: { skin: SK.moreno, hair: '#2a1a10', hairStyle: 'short', beard: '#2a1a10', tunic: '#6a5040', trim: '#e0902a', apron: '#5a3a24', pants: '#3a2a20', boots: '#2a1a10', build: 'stout', sleeves: 'short' },
    gertrude: { skin: SK.claro, hair: '#8a4a2a', hairStyle: 'bob', tunic: '#2a3a8a', trim: '#ffd84a', robe: true, belt: '#ffd84a', boots: '#1a1a3a', glasses: true, hat: { type: 'wizard', color: '#1a2a6a', color2: '#ffd84a' }, build: 'tall' },
    eleitor1: { skin: SK.escuro, hair: '#1a1a1a', hairStyle: 'short', tunic: '#d8a03a', trim: '#6a2a1a', pants: '#3a3a5a', boots: '#2a1a10', mustache: true },
    eleitor2: { skin: SK.claro, hair: '#e0b040', hairStyle: 'ponytail', tunic: '#5aa0d8', trim: '#ffffff', robe: true, boots: '#2a3a5a' },
    eleitor3: { skin: SK.medio, hair: '#6a3a1a', hairStyle: 'bun', tunic: '#8a5ac8', trim: '#f0e0b0', robe: true, boots: '#3a2a4a', apron: '#f4ecd8' },
    eleitor4: { skin: SK.moreno, hair: '#3a2010', hairStyle: 'spiky', tunic: '#4ab06a', trim: '#ffe060', pants: '#4a3a2a', boots: '#3a2418', build: 'kid', sleeves: 'short' },
    eleitor5: { skin: SK.claro, hair: '#c03a1a', hairStyle: 'long', tunic: '#e06a5a', trim: '#ffffff', robe: true, boots: '#5a2a1a' },
    eleitor6: { skin: SK.escuro, hair: '#d8d8d8', hairStyle: 'short', beard: '#d8d8d8', tunic: '#3a6a5a', trim: '#c8b070', pants: '#2a3a3a', boots: '#1a1a1a', build: 'stout' }
  });

  // ------------------------------------------------------------------
  //  Registro das missões
  // ------------------------------------------------------------------
  const Q = G.QUESTS = {
    lentes: { title: 'As Lentes da Inferência', giver: 'Professora Gertrude', region: 'Campos de Pascal', icon: 'lens', steps: ['Recupere as 5 Lentes da Inferência ajudando o povo do reino.', 'Leve as 5 lentes à Professora Gertrude.'], reward: 'O Observatório da Inferência se abre' },
    cha: { title: 'O Chá da Dona Muriel', giver: 'Dona Muriel', region: 'Vila Gauss', topic: 'hipotese', lens: 'cha', steps: ['Faça o teste do chá com a Dona Muriel.'], reward: 'Lente da Hipótese e um Fragmento de Coração' },
    forja: { title: 'Controle de Qualidade', giver: 'Ferreiro Tukey', region: 'Deserto da Dispersão', topic: 'quartis', lens: 'forja', steps: ['Pese as 9 espadas da forja: golpeie cada uma.', 'Mostre o boxplot ao Ferreiro Tukey.'], reward: 'Lente dos Quartis e uma Têmpera (ATQ+1)' },
    pesquisa: { title: 'A Grande Pesquisa', giver: 'Pescador Neyman', region: 'Lago Bernoulli', topic: 'confianca', lens: 'pesquisa', steps: ['Entreviste os 10 moradores sorteados (Vila, Lago e Campos).', 'Leve as respostas ao Pescador Neyman.'], reward: 'Lente da Confiança e um Fragmento de Coração' },
    detector: { title: 'O Detector de Tesouros', giver: 'Sábio Bayes', region: 'Pântano de Bayes', topic: 'condicional', lens: 'detector', steps: ['Use o detector nos 8 montes de lama e cave onde ele apitar.', 'Conte ao Sábio Bayes o que descobriu.'], reward: 'Lente de Bayes e tesouros enterrados' },
    medias: { title: 'As Médias de Laplace', giver: 'Eremita Laplace', region: 'Bosque Sombrio', topic: 'tcl', lens: 'medias', steps: ['Use a Máquina das Médias ao lado da cabana.', 'Conte ao Eremita Laplace o que viu.'], reward: 'Lente do Limite e um Fragmento de Coração' }
  };
  const ORDER = G.QUEST_ORDER = ['lentes', 'cha', 'forja', 'pesquisa', 'detector', 'medias'];
  const LENSES = ['cha', 'forja', 'pesquisa', 'detector', 'medias'];
  const LENS_INFO = { cha: ['DA HIPÓTESE', '#ff8ac8'], forja: ['DOS QUARTIS', '#ffa24a'], pesquisa: ['DA CONFIANÇA', '#5ab0ff'], detector: ['DE BAYES', '#6aff8a'], medias: ['DO LIMITE', '#c88aff'] };

  const QS = G.quest = {
    st(id) { const q = P() && P().quests; return (q && q[id]) || null; },
    active(id) { const s = this.st(id); return !!s && !s.done; },
    done(id) { const s = this.st(id); return !!s && s.done; },
    step(id) { const s = this.st(id); return s ? s.s : -1; },
    start(id) {
      if (this.st(id)) return;
      P().quests[id] = { s: 0, done: false };
      G.sfx('secret'); G.ui.toast('NOVA MISSÃO: ' + Q[id].title, '#ffd84a');
    },
    setStep(id, n) { const s = this.st(id); if (s && !s.done && n > s.s) { s.s = n; G.ui.toast('Missão: ' + Q[id].steps[n], '#9ad8ff'); } },
    async finish(id) {
      const s = this.st(id); if (!s || s.done) return;
      s.done = true; s.s = Q[id].steps.length - 1;
      G.sfx('fanfare'); G.flash('#fff6c0', 0.3, 0.3);
      if (G.player) G.fx.ring(G.player.cx, G.player.cy - 6, 30, '#7aff8a', 0.5, 2.5);
      await G.ui.banner('questDone', 'MISSÃO CONCLUÍDA!', Q[id].title + '. Recompensa: ' + Q[id].reward + '.', { color: '#7aff8a' });
      G.saveGame();
    },
    lenses() { return LENSES.filter(id => this.done(id)).length; },
    hint(id) {
      const s = this.st(id);
      return {
        cha: 'A ^yDona Muriel^0, aqui na Vila Gauss, jura que distingue o chá pelo gosto.',
        forja: 'O ^yFerreiro Tukey^0, no Deserto, desconfia de uma das suas espadas.',
        pesquisa: 'O ^yPescador Neyman^0, no Lago, está organizando uma pesquisa.',
        detector: 'O ^ySábio Bayes^0, no Pântano, perdeu os tesouros que enterrou.',
        medias: 'O ^yEremita Laplace^0, no Bosque, construiu uma máquina curiosa.',
        lentes: 'A ^yProfessora Gertrude^0, nos Campos de Pascal, cuida de um observatório misterioso.'
      }[id] + (s && !s.done ? ' ^c(' + Q[id].steps[s.s] + ')^0' : '');
    }
  };

  // recompensas especiais
  const give0 = G.give;
  G.give = async function (kind, n, o) {
    if (kind !== 'lens' && kind !== 'tempera') return give0.call(this, kind, n, o);
    const p = G.player;
    if (p) { p.state = 'hold'; p.holdItem = kind === 'lens' ? 'lens_' + n : 'swordIcon'; }
    G.cutscene++;
    try {
      G.sfx('fanfare'); await G.wait(0.3);
      if (kind === 'lens') await G.ui.banner('lens_' + n, 'LENTE ' + LENS_INFO[n][0] + '!', 'Você tem ' + QS.lenses() + ' de 5 Lentes da Inferência. ' + (QS.lenses() >= 5 ? 'Leve-as à Professora Gertrude, nos Campos de Pascal!' : 'Procure quem precisa de ajuda: um "!" amarelo marca quem tem um pedido.'), { color: LENS_INFO[n][1] });
      else {
        const P0 = P(), names = ['ESPADA DE MADEIRA', 'ESPADA DE FERRO', 'ESPADA DE PRATA', 'ESPADA GAUSSIANA'];
        const nv = G.equip.melhorEspada() + 1;
        if (nv <= 3) { G.equip.ganhar('espada', nv); await G.ui.banner('swordIcon', 'TÊMPERA: ' + names[nv] + '!', 'O Ferreiro Tukey aprimorou sua lâmina. Ataque +1!', { color: '#ffa24a' }); }
        else { P0.coins = Math.min(999, P0.coins + 100); await G.ui.banner('coinRed', 'PAGAMENTO DO FERREIRO', 'Sua espada já é perfeita! Tukey pagou 100 moedas pelo serviço.', { color: '#ffa24a' }); }
      }
    } finally {
      G.cutscene--;
      if (p && p.state === 'hold') { p.state = 'normal'; p.holdItem = null; }
    }
  };

  // ------------------------------------------------------------------
  //  Marcadores sobre os NPCs e no mapa
  // ------------------------------------------------------------------
  const VOTERS = [
    ['vila', 21, 12, 'eleitor1', 'Seu Ademir'], ['vila', 35, 15, 'eleitor2', 'Dona Cida'], ['vila', 27, 21, 'eleitor3', 'Dona Lurdes'], ['vila', 11, 18, 'eleitor4', 'Juca'],
    ['lago', 19, 4, 'eleitor5', 'Pescadora Bia'], ['lago', 33, 4, 'eleitor6', 'Seu Tonho'], ['lago', 6, 12, 'eleitor3', 'Dona Zefa'],
    ['planicie', 24, 21, 'eleitor4', 'Zé Pequeno'], ['planicie', 33, 17, 'eleitor1', 'Seu Lauro'], ['planicie', 25, 13, 'eleitor5', 'Dona Nena']
  ];
  const voted = () => (P().flags.voted = P().flags.voted || []);
  function marker(id) {
    if (!P() || !P().items.sword) return null;
    if (id && id.startsWith('voter')) { const i = +id.slice(5); return QS.active('pesquisa') && QS.step('pesquisa') === 0 && !voted().includes(i) ? 'markerBang' : null; }
    switch (id) {
      case 'muriel': return QS.done('cha') ? null : QS.st('cha') ? 'markerQ' : 'markerBang';
      case 'tukey': return QS.done('forja') ? null : !QS.st('forja') ? 'markerBang' : QS.step('forja') === 1 ? 'markerQ' : null;
      case 'neyman': return !P().flags.metNeyman || QS.done('pesquisa') ? null : !QS.st('pesquisa') ? 'markerBang' : QS.step('pesquisa') === 1 ? 'markerQ' : null;
      case 'bayes': return !P().flags.metBayes || QS.done('detector') ? null : !QS.st('detector') ? 'markerBang' : QS.step('detector') === 1 ? 'markerQ' : null;
      case 'laplace': return !P().flags.metLaplace || QS.done('medias') ? null : !QS.st('medias') ? 'markerBang' : QS.step('medias') === 1 ? 'markerQ' : null;
      case 'gertrude': return QS.done('lentes') ? null : !QS.st('lentes') ? 'markerBang' : QS.lenses() >= 5 ? 'markerQ' : null;
    }
    return null;
  }
  G.npcMarker = n => marker(n.scriptId);
  G.drawMapExtra = (ctx, ox, oy, sc, seenAt) => {
    if (!P() || Math.floor(G.time * 3) % 3 === 0) return;
    const dg = P().flags.dig;
    for (const o of G.world.ow.objects) {
      let mk = null;
      if (o.type === 'npc') mk = marker(o.script);
      else if (o.type === 'swordRack' && o.i === 4 && QS.active('forja') && QS.step('forja') === 0) mk = 'markerBang';
      else if (o.type === 'digSpot' && QS.active('detector') && QS.step('detector') === 0 && dg && !dg.dug.includes(o.i) && !(dg.scanned.includes(o.i) && !dg.beep.includes(o.i))) mk = 'markerBang';
      else if (o.type === 'cltMachine' && QS.active('medias') && QS.step('medias') === 0) mk = 'markerBang';
      if (!mk || !seenAt(o.x / 16, o.y / 16)) continue;
      const px = Math.round(ox + o.x / 16 * sc), py = Math.round(oy + o.y / 16 * sc);
      G.text(mk === 'markerQ' ? '?' : '!', px + 1, py - 7, mk === 'markerQ' ? '#7aff8a' : '#ffd84a', { align: 'center', outline: '#1a1028' });
    }
  };

  // ------------------------------------------------------------------
  //  Aba MISSÕES do menu
  // ------------------------------------------------------------------
  G.questTabUpdate = (m, inp) => {
    const n = ORDER.length; m.qi = m.qi || 0;
    if (inp.pressed('up')) { m.qi = (m.qi + n - 1) % n; G.sfx('select'); }
    if (inp.pressed('down')) { m.qi = (m.qi + 1) % n; G.sfx('select'); }
  };
  G.drawQuestTab = (ctx, x, y, w, h, m) => {
    const sel = m.qi || 0, nd = ORDER.filter(id => QS.done(id)).length;
    G.text('DIÁRIO DE MISSÕES · ' + nd + '/' + ORDER.length + ' concluídas', x, y, '#ffd84a');
    // lentes
    G.text('Lentes:', x + w - 82, y, '#9a98b0');
    LENSES.forEach((id, i) => G.draw(ctx, 'lens_' + id, x + w - 46 + i * 9, y - 1, QS.done(id) ? undefined : { tint: 'rgba(16,14,40,0.85)' }));
    ORDER.forEach((id, i) => {
      const s = QS.st(id), yy = y + 14 + i * 17, isSel = i === sel;
      if (isSel) G.selBar(ctx, x, yy - 3, 168, 15, G.time);
      G.draw(ctx, id === 'lentes' ? 'lens' : 'lens_' + id, x + 3, yy - 1, s ? undefined : { tint: 'rgba(16,14,40,0.85)' });
      G.text(s ? Q[id].title : '? ? ?', x + 16, yy + 1, s ? (isSel ? '#ffe27a' : '#ffffff') : '#5a5670');
      if (s) G.text(s.done ? '✓' : '•', x + 160, yy + 1, s.done ? '#7aff8a' : '#ffd84a', { align: 'right' });
    });
    const id = ORDER[sel], q = Q[id], s = QS.st(id), px = x + 174, pw = w - 174;
    G.panel(ctx, px, y + 10, pw, h - 12, { r: 4, thin: true, corners: false });
    if (!s) {
      G.wrap('Missão ainda não descoberta. Converse com o povo do reino: quem tem um pedido mostra um ^y!^0 amarelo sobre a cabeça.', pw - 14).forEach((l, i) => G.text(l, px + 7, y + 18 + i * 10, '#8a88a0'));
      G.wrap('Pista: ' + QS.hint(id), pw - 14).forEach((l, i) => G.text(l, px + 7, y + 62 + i * 10, '#c8c8e0'));
      return;
    }
    let yy = y + 17;
    G.wrap(q.title, pw - 14).forEach(l => { G.text(l, px + 7, yy, '#ffd84a'); yy += 10; });
    G.text('Com: ' + q.giver, px + 7, yy + 2, '#9ac8ff'); G.text('Onde: ' + q.region, px + 7, yy + 12, '#9ac8ff'); yy += 26;
    G.text(s.done ? 'CONCLUÍDA!' : 'OBJETIVO:', px + 7, yy, s.done ? '#7aff8a' : '#ffe27a'); yy += 10;
    if (!s.done) G.wrap(q.steps[s.s] + (id === 'pesquisa' && s.s === 0 ? ' (' + voted().length + '/10)' : id === 'forja' && s.s === 0 && P().flags.forja ? ' (' + P().flags.forja.seen.length + '/9)' : id === 'lentes' ? ' (' + QS.lenses() + '/5)' : ''), pw - 14).forEach(l => { G.text(l, px + 7, yy, '#ffffff'); yy += 10; });
    yy += 4;
    G.text('RECOMPENSA:', px + 7, yy, '#ffe27a'); yy += 10;
    G.wrap(q.reward, pw - 14).forEach(l => { G.text(l, px + 7, yy, '#c8c8e0'); yy += 10; });
    if (q.topic) G.text('Assunto: ' + G.TOPICS[q.topic], px + 7, y + h - 14, '#7aff8a');
  };

  // ------------------------------------------------------------------
  //  Arte (sprites próprios das missões)
  // ------------------------------------------------------------------
  const { cyl, bevel, inEll, inRR, inPoly, bboxOf } = G.artTools;
  G.artHooks = G.artHooks || [];
  G.artHooks.push(() => {
    const SPR = G.spr;
    { // marcador "?"
      const p = new G.Paint(12, 18), c = (x) => (x < 5 ? '#d8ffe0' : '#7aff8a');
      p.rrect(2, 0, 8, 4, 2, c); p.rrect(7, 1, 4, 6, 2, c); p.rrect(4, 6, 5, 4, 1.5, c); p.rrect(4, 9, 4, 3, 1, c);
      p.rrect(4, 13, 4, 5, 2, c); p.outline({ color: '#104a20' }); SPR.markerQ = p.toCanvas();
    }
    // lentes (genérica + uma por missão)
    const lensArt = (glass) => {
      const p = new G.Paint(20, 20), gl = R5(glass);
      p.ell(10, 10, 9, 9, { ramp: ['#5a3a10', '#a8742a', '#e0b048', '#ffe08a', '#fff6c8'], ambient: 0.45, contrast: 1.2 });
      p.ell(10, 10, 6.5, 6.5, (nx, ny) => (nx + ny < -0.6 ? gl[4] : nx + ny < 0.2 ? gl[3] : gl[2]));
      p.line(6, 8, 8.5, 5.5, '#ffffff', 1.2); p.px(12, 13, gl[4]);
      p.outline({ k: -0.8 }); return p.toCanvas();
    };
    SPR.lens = lensArt('#7ae4ff');
    for (const id of LENSES) SPR['lens_' + id] = lensArt(LENS_INFO[id][1]);
    { // missão concluída: pergaminho com visto
      const p = new G.Paint(32, 32);
      cyl(p, inRR(5, 4, 22, 24, 3), R5('#e8d8a8'), [4, 3, 28, 29]);
      p.rect(4, 3, 24, 3, '#b89860'); p.rect(4, 26, 24, 3, '#b89860');
      for (let i = 0; i < 4; i++) p.rect(9, 10 + i * 4, 14, 1, '#a89060');
      p.line(10, 17, 15, 23, '#2aa84a', 3); p.line(15, 23, 25, 9, '#2aa84a', 3);
      p.outline({ k: -0.8 }); SPR.questDone = p.toCanvas();
    }
    { // mesa de chá com xícaras
      const p = new G.Paint(48, 40);
      cyl(p, inRR(21, 22, 6, 16, 1), R5('#7a4a2a'), [20, 21, 28, 39]);
      p.ell(24, 20, 22, 9, { ramp: R5('#f4e8f0'), ambient: 0.55 });
      for (let x = 3; x < 46; x++) if ((x % 6) < 3 && p.alphaAt(x, 26)) p.px(x, 27, '#d888b0');
      for (const [cx, cy] of [[10, 17], [17, 21], [31, 21], [38, 17]]) { p.ell(cx, cy, 3.5, 2.6, { ramp: R5('#ffffff'), ambient: 0.6 }); p.ell(cx, cy - 0.6, 2.4, 1.3, '#a0602a'); p.px(cx + 3.5, cy, '#e8e8f0'); }
      cyl(p, inEll(24, 13, 6, 6), R5('#ff8ac8'), [17, 6, 31, 20]); p.line(29, 12, 35, 8, '#e868a8', 2); p.ell(24, 7, 2, 1.5, '#ffd84a');
      p.outline({ k: -0.8 }); SPR.teaTable = p.toCanvas();
    }
    { // espada fincada numa pedra (forja)
      const p = new G.Paint(32, 40);
      cyl(p, inRR(4, 26, 24, 12, 3), R5('#8a7a6a'), [3, 25, 29, 39]);
      for (let y = 4; y < 30; y++) for (let x = 14; x < 18; x++) p.px(x, y, x < 15 ? '#ffffff' : x < 17 ? '#c8d0e0' : '#7a8098');
      p.poly([[14, 4], [18, 4], [16, 0]], '#e8ecf8');
      p.rect(9, 30, 14, 3, '#c08a3a'); p.rect(10, 30, 12, 1, '#ffd88a');
      p.outline({ k: -0.8 }); SPR.swordRack = p.toCanvas();
    }
    { // monte de lama / buraco cavado
      const p = new G.Paint(32, 22);
      p.ell(16, 13, 14, 8, { ramp: ['#2a2014', '#4a3a24', '#6a5636', '#8a7450', '#a8946a'], ambient: 0.4, dither: 0.5 });
      for (let i = 0; i < 6; i++) p.ell(8 + i * 3.4, 10 + (i % 2) * 3, 1.5, 1, '#9a8a60');
      p.outline({ k: -0.8 }); SPR.mound = p.toCanvas();
      const q = new G.Paint(32, 22);
      q.ell(16, 13, 14, 8, { ramp: ['#2a2014', '#4a3a24', '#6a5636', '#8a7450', '#a8946a'], ambient: 0.4 });
      q.ell(16, 13, 9, 5, '#140c06'); q.ell(16, 14, 7, 3.5, '#0a0604');
      q.outline({ k: -0.8 }); SPR.moundDug = q.toCanvas();
    }
    { // máquina das médias
      const p = new G.Paint(48, 64);
      cyl(p, inRR(4, 22, 40, 40, 4), R5('#5a6aa0'), [3, 21, 45, 63]);
      p.poly([[10, 22], [38, 22], [32, 6], [16, 6]], (x, y) => (x < 24 ? '#c8a050' : '#9a7a3a'));
      for (const [dx, dy] of [[19, 3], [26, 1], [22, -1]]) { p.rrect(dx, dy, 6, 6, 1.5, '#ffffff'); p.px(dx + 3, dy + 3, '#c02a3a'); }
      p.rrect(9, 28, 30, 18, 2, '#0a1428');
      const hb = [2, 4, 7, 10, 7, 4, 2]; hb.forEach((h, i) => p.rect(12 + i * 3.6, 44 - h * 1.4, 2.6, h * 1.4, i === 3 ? '#7aff8a' : '#5ad8ff'));
      p.ell(16, 54, 3, 3, { ramp: R5('#ff5a5a'), ambient: 0.5 }); p.ell(32, 54, 3, 3, { ramp: R5('#ffd84a'), ambient: 0.5 });
      p.outline({ k: -0.8 }); SPR.cltMachine = p.toCanvas();
    }
  });
  // estrutura: forja do Tukey
  G.EXTRA_STRUCTS = Object.assign(G.EXTRA_STRUCTS || {}, { forge: [4, 3] });
  G.structHooks = G.structHooks || [];
  G.structHooks.push(() => {
    const p = new G.Paint(128, 96), S = R5('#9a7a5a'), Rf = R5('#5a3a2a');
    cyl(p, inRR(6, 34, 116, 60, 2), S, [5, 33, 123, 95]);
    for (let y = 40; y < 92; y += 9) for (let x = 6 + ((y / 9) % 2) * 7; x < 120; x += 15) p.rect(x, y, 1, 8, S[1]);
    for (let y = 40; y < 92; y += 9) for (let x = 7; x < 121; x++) p.px(x, y, S[1]);
    p.poly([[0, 38], [128, 38], [112, 10], [16, 10]], (x, y) => (y < 18 ? Rf[3] : y < 28 ? Rf[2] : Rf[1]));
    for (let x = 2; x < 126; x++) p.px(x, 38, Rf[0]);
    cyl(p, inRR(94, 0, 16, 26, 1), R5('#7a6a5a'), [93, 0, 111, 27]);
    // fornalha acesa
    for (let y = 56; y < 92; y++) for (let x = 22; x < 62; x++) { const inA = y > 66 || Math.hypot(x + 0.5 - 42, y - 66) < 20; if (inA) { const d = Math.hypot(x + 0.5 - 42, y - 84) / 30; p.px(x, y, d < 0.35 ? '#fff0a0' : d < 0.6 ? '#ffb040' : d < 0.85 ? '#e0501a' : '#5a1a0a'); } }
    // bigorna e placa com boxplot
    cyl(p, inRR(76, 72, 30, 8, 2), R5('#4a4a5a'), [75, 71, 107, 81]); cyl(p, inRR(84, 80, 14, 12, 1), R5('#3a3a48'), [83, 79, 99, 93]);
    cyl(p, inRR(70, 44, 44, 20, 2), R5('#3a2418'), [69, 43, 115, 65]);
    p.rect(76, 54, 32, 1, '#ffd88a'); p.rect(84, 50, 14, 8, '#5aa8ff'); p.rect(90, 50, 1, 8, '#ffd84a'); p.rect(78, 52, 1, 4, '#ffd88a'); p.rect(106, 52, 1, 4, '#ffd88a');
    p.outline({ color: '#1a1020' });
    G.structs.forge = p.toCanvas();
    if (G.DECO_LIGHTS) G.DECO_LIGHTS.forge = [[21, 41, 46, '#ff9a3a']];
  });

  // ------------------------------------------------------------------
  //  Entidades das missões
  // ------------------------------------------------------------------
  class TeaTable extends G.Ent {
    constructor(x, y) { super(x - 3, y + 6, 22, 9); this.solid = true; this.room = -1; }
    interBox() { return { x: this.x - 3, y: this.y - 8, w: this.w + 6, h: this.h + 12 }; }
    interact() { const f = N.muriel; if (f) G.runScript(() => f(this)); }
    update(dt) { this.t += dt; if (Math.random() < 0.05) G.fx.spawn({ x: this.cx + G.rf(-1, 1), y: this.y - 10, vy: -12, vx: G.rf(-3, 3), life: 0.9, color: 'rgba(255,255,255,0.6)', size: 1, drag: 0.5 }); }
    draw(ctx, cam) { const s = G.spr.teaTable; G.shadow(ctx, this.cx - cam.x, this.y + this.h - cam.y, 22, 0.3); G.draw(ctx, s, this.cx - G.lw(s) / 2 - cam.x, this.y + this.h - G.lh(s) - cam.y + 1); }
  }
  class SwordRack extends G.Ent {
    constructor(x, y, i) { super(x + 3, y + 7, 10, 8); this.i = i; this.solid = true; this.room = -1; this.flash = 0; }
    get data() { return P().flags.forja; }
    onHit() {
      if (this.flash > 0) return false;
      this.flash = 0.35;
      if (!QS.active('forja')) {
        G.sfx('tink'); G.fx.spark(this.cx, this.y - 8, '#ffffff', 5);
        if (!QS.st('forja') && (!G._rackT || G.time - G._rackT > 8)) { G._rackT = G.time; G.ui.toast('Espadas recém-forjadas. O ferreiro deve saber algo sobre elas.', '#ffd84a'); }
        return false;
      }
      const D = this.data;
      if (QS.step('forja') === 0 && !D.seen.includes(this.i)) {
        D.seen.push(this.i); G.sfx('itemget');
        G.fx.text(this.cx, this.y - 22, D.w[this.i] + ' kg', '#ffe27a', true); G.fx.ring(this.cx, this.y - 6, 14, '#ffd84a', 0.3, 1.5);
        if (D.seen.length >= 9) { QS.setStep('forja', 1); G.ui.toast('Todas pesadas! O boxplot está pronto. Fale com o Ferreiro Tukey.', '#7aff8a'); }
        else G.ui.toast('Espadas pesadas: ' + D.seen.length + '/9', '#ffd84a');
      } else { G.sfx('tink'); G.fx.spark(this.cx, this.y - 8, '#ffffff', 5); }
      return false;
    }
    update(dt) { this.t += dt; if (this.flash > 0) this.flash -= dt; }
    draw(ctx, cam) {
      const s = G.spr.swordRack, x = this.cx - G.lw(s) / 2 - cam.x, y = this.y + this.h - G.lh(s) - cam.y + 1;
      G.shadow(ctx, this.cx - cam.x, this.y + this.h - cam.y, 14, 0.3);
      G.draw(ctx, s, x + (this.flash > 0 ? Math.sin(this.t * 80) : 0), y, this.flash > 0.2 ? { white: true } : undefined);
    }
    drawLate(ctx, cam) {
      const D = P().flags.forja; if (!D || !D.seen.includes(this.i)) return;
      const out = D.out === this.i && QS.step('forja') >= 1;
      G.puzTag(ctx, this.cx - cam.x, this.y - 30 - cam.y, String(D.w[this.i]), out ? '#ff8a9a' : '#ffe27a');
    }
  }
  class BoxBoard extends G.Ent {
    constructor(x, y) { super(x - 8, y + 18, 40, 10); this.solid = true; this.room = -1; }
    get by() { return this.y + this.h; }
    draw(ctx, cam) {
      const x = this.x - 4 - cam.x, y = this.y - 34 - cam.y, w = 48, h = 38;
      G.shadow(ctx, this.cx - cam.x, this.y + this.h - cam.y, 30, 0.3);
      G.rect(ctx, x + 6, y + h - 2, 3, 12, '#4a2a14'); G.rect(ctx, x + w - 9, y + h - 2, 3, 12, '#4a2a14');
      ctx.save(); ctx.fillStyle = '#3a2418'; G.rrPath(ctx, x - 1, y - 1, w + 2, h + 2, 3); ctx.fill();
      ctx.fillStyle = '#0e1426'; G.rrPath(ctx, x + 1, y + 1, w - 2, h - 2, 2); ctx.fill(); ctx.restore();
      G.text('BOXPLOT', x + w / 2, y + 2, '#ffd84a', { align: 'center', shadow: false });
      const D = P().flags.forja;
      const vals = D ? D.seen.map(i => D.w[i]) : [];
      const lo = 0, hi = 22, x0 = x + 4, x1 = x + w - 4, px = v => x0 + (v - lo) / (hi - lo) * (x1 - x0);
      G.rect(ctx, x0, y + h - 7, x1 - x0, 0.5, '#9a98b0');
      const cnt = {};
      for (const v of vals) { const k = cnt[v] = (cnt[v] || 0) + 1; ctx.fillStyle = '#7ae4ff'; ctx.fillRect(px(v) - 0.75, y + h - 9 - (k - 1) * 1.6, 1.5, 1.5); }
      if (vals.length >= 9) G.drawBox(ctx, vals, x0, x1, y + 19, px, { h: 7, labels: false });
      else G.text(vals.length + '/9', x + w / 2, y + 15, '#9a98b0', { align: 'center', shadow: false });
      G.light.add(x + w / 2, y + h / 2, 30, '#7ae4ff', 0.4);
    }
  }
  class DigSpot extends G.Ent {
    constructor(x, y, i) { super(x + 1, y + 5, 14, 10); this.i = i; this.room = -1; }
    get data() { return P().flags.dig; }
    interBox() { return { x: this.x - 3, y: this.y - 6, w: this.w + 6, h: this.h + 10 }; }
    interact() { G.runScript(() => digScript(this)); }
    draw(ctx, cam) {
      const D = this.data, dug = D && D.dug.includes(this.i);
      G.draw(ctx, dug ? 'moundDug' : 'mound', this.cx - 8 - cam.x, this.y + this.h - 11 - cam.y);
    }
    drawLate(ctx, cam) {
      const D = this.data; if (!D || !D.scanned.includes(this.i) || D.dug.includes(this.i)) return;
      const beep = D.beep.includes(this.i);
      G.puzTag(ctx, this.cx - cam.x, this.y - 14 - cam.y + (beep ? Math.sin(G.time * 8) : 0), beep ? 'BIP!' : '...', beep ? '#7aff8a' : '#8a88a0');
    }
  }
  class CltMachine extends G.Ent {
    constructor(x, y) { super(x + 1, y + 14, 22, 9); this.solid = true; this.room = -1; }
    interBox() { return { x: this.x - 3, y: this.y - 8, w: this.w + 6, h: this.h + 14 }; }
    interact() {
      G.runScript(async () => {
        if (!QS.st('medias')) { await say(null, 'Uma máquina cheia de dados e engrenagens, com uma telinha de barras. O eremita da cabana deve saber como funciona.'); return; }
        await G.mini.run('clt');
        const r = G.mini.last;
        if (r && r.rounds >= 2 && QS.active('medias') && QS.step('medias') === 0) { P().flags.cltRun = true; QS.setStep('medias', 1); }
      });
    }
    update(dt) { this.t += dt; }
    draw(ctx, cam) {
      const s = G.spr.cltMachine, x = this.cx - G.lw(s) / 2 - cam.x, y = this.y + this.h - G.lh(s) - cam.y + 1;
      G.shadow(ctx, this.cx - cam.x, this.y + this.h - cam.y, 22, 0.3);
      G.draw(ctx, s, x, y + (Math.floor(this.t * 6) % 8 === 0 ? -0.5 : 0));
      G.light.add(this.cx - cam.x, y + 18, 26, '#5ad8ff', 0.5);
    }
  }
  G.SPAWN = G.SPAWN || {};
  Object.assign(G.SPAWN, {
    teaTable: o => new TeaTable(o.x, o.y),
    swordRack: o => new SwordRack(o.x, o.y, o.i),
    boxBoard: o => new BoxBoard(o.x, o.y),
    digSpot: o => new DigSpot(o.x, o.y, o.i),
    cltMachine: o => new CltMachine(o.x, o.y)
  });
  G.spawnExtra = o => (G.SPAWN[o.type] ? G.SPAWN[o.type](o) : null);

  // ------------------------------------------------------------------
  //  Posições no mundo
  // ------------------------------------------------------------------
  const DIG = [[13, 9], [32, 8], [17, 21], [33, 18], [11, 15], [29, 25], [40, 13], [19, 5]];
  G.worldExtras = G.worldExtras || [];
  G.worldExtras.push(h => {
    const { struct, obj, nodes, regionOf } = h;
    // Vila: Dona Muriel e a mesa de chá
    obj('vila', 15, 20, { type: 'npc', spr: 'muriel', name: 'Dona Muriel', script: 'muriel' });
    obj('vila', 13, 20, { type: 'teaTable' });
    VOTERS.forEach(([reg, lx, ly, spr, name], i) => obj(reg, lx, ly, { type: 'npc', spr, name, script: 'voter' + i, wander: true }));
    // Deserto: forja do Tukey
    struct('deserto', 'forge', 29, 18);
    obj('deserto', 34, 21, { type: 'npc', spr: 'tukey', name: 'Ferreiro Tukey', script: 'tukey' });
    for (let i = 0; i < 9; i++) obj('deserto', 26 + i, 25, { type: 'swordRack', i });
    obj('deserto', 23, 24, { type: 'boxBoard' });
    { const R = regionOf('deserto'); nodes.deserto.push([R.ox + 30, R.oy + 24]); }
    // Pântano: montes de lama
    const R = regionOf('pantano');
    DIG.forEach(([lx, ly], i) => { obj('pantano', lx, ly, { type: 'digSpot', i }); nodes.pantano.push([R.ox + lx, R.oy + ly + 1]); });
    // Bosque: máquina das médias, ao lado da cabana do Laplace
    obj('floresta', 34, 21, { type: 'cltMachine' });
  });

  // ------------------------------------------------------------------
  //  Quadro genérico dos minijogos
  // ------------------------------------------------------------------
  function frame(ctx, title) {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0e0a24'); g.addColorStop(1, '#1c0e32');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(122,160,255,0.05)'; for (let x = 0; x < W; x += 8) ctx.fillRect(x, 0, 0.5, H); for (let y = 0; y < H; y += 8) ctx.fillRect(0, y, W, 0.5);
    G.panel(ctx, 4, 4, W - 8, H - 8, { r: 5 });
    G.headerBar(ctx, 8, 8, W - 16, 13, '#4a3a9a');
    G.text(title, 14, 11, '#ffe27a', { outline: '#1a0a30' });
  }
  const bubble = (ctx, x, y, w, lines, col = '#ffffff') => {
    const h = lines.length * 10 + 6;
    G.panel(ctx, x, y, w, h, { r: 4, thin: true, corners: false, bgTop: '#f4eefc', bg: '#dcd4ec', border: '#5a4a8a' });
    lines.forEach((l, i) => G.text(l, x + 6, y + 4 + i * 10, '#2a1a40', { shadow: false }));
  };

  // ------------------------------------------------------------------
  //  MINIJOGO: A PROVA DO CHÁ (teste de hipótese)
  // ------------------------------------------------------------------
  class Tea {
    constructor(res) { this.res = res; this.t = 0; this.st = 'prep'; this.cups = 'LLLLCCCC'.split(''); this.sel = 0; this.msg = ''; this.idx = -1; this.guess = []; }
    pattern() { const s = this.cups.join(''); return ['LLLLCCCC', 'CCCCLLLL', 'LCLCLCLC', 'CLCLCLCL', 'LLCCLLCC', 'CCLLCCLL'].includes(s); }
    update(dt) {
      this.t += dt;
      if (this.st === 'prep') {
        if (I.pressed('left')) { this.sel = (this.sel + 9) % 10; G.sfx('select'); }
        if (I.pressed('right')) { this.sel = (this.sel + 1) % 10; G.sfx('select'); }
        if (I.pressed('cancel')) { G.mini.last = { aborted: true }; this.done = true; this.res(); return; }
        if (I.pressed('confirm')) {
          if (this.sel < 8) { this.cups[this.sel] = this.cups[this.sel] === 'L' ? 'C' : 'L'; G.sfx('pot'); this.msg = ''; }
          else if (this.sel === 8) { this.cups = G.shuffle('LLLLCCCC'.split('')); G.sfx('flip'); this.msg = 'Ordem sorteada! Ninguém consegue prever.'; }
          else {
            const nl = this.cups.filter(c => c === 'L').length;
            if (nl !== 4) { G.sfx('wrong'); this.msg = 'Precisa de exatamente 4 com LEITE primeiro (agora há ' + nl + ').'; return; }
            this.patterned = this.pattern();
            // Dona Muriel realmente sabe... quase sempre
            this.guess = this.cups.slice();
            if (Math.random() < 0.15) { const iL = this.cups.indexOf('L'), iC = this.cups.indexOf('C'); this.guess[iL] = 'C'; this.guess[iC] = 'L'; }
            this.st = 'taste'; this.idx = 0; this.tT = 0; G.sfx('confirm');
          }
        }
      } else if (this.st === 'taste') {
        this.tT += dt;
        if (this.tT > 1.0) { this.tT = 0; G.sfx(this.guess[this.idx] === this.cups[this.idx] ? 'coin' : 'tink'); this.idx++; if (this.idx >= 8) { this.st = 'result'; this.t = 0; this.hits = this.guess.filter((g, i) => g === this.cups[i]).length; G.sfx(this.hits === 8 ? 'fanfare' : 'wrong'); } }
      } else if (this.st === 'result') {
        if (this.t > 0.6 && (I.pressed('confirm') || I.pressed('cancel'))) { G.mini.last = { hits: this.hits, patterned: this.patterned }; this.done = true; this.res(); }
      }
    }
    draw(ctx) {
      frame(ctx, 'A PROVA DO CHÁ · Teste de Hipótese');
      // Dona Muriel
      const ms = G.spr['muriel_down' + (this.st === 'taste' && Math.floor(this.t * 4) % 2 ? '1' : '0')] || G.spr.muriel_down0;
      if (ms) G.drawFit(ctx, ms, 14, 34, 52, 52);
      // mesa com 8 xícaras
      const tx = 82, ty = 104, cw = 34;
      ctx.save(); const g = ctx.createLinearGradient(0, ty - 8, 0, ty + 40); g.addColorStop(0, '#f4e8f0'); g.addColorStop(1, '#c8a8c0');
      ctx.fillStyle = g; G.rrPath(ctx, tx - 10, ty - 6, 8 * cw + 16, 40, 6); ctx.fill();
      ctx.fillStyle = 'rgba(216,136,176,0.5)'; for (let i = 0; i < 46; i++) ctx.fillRect(tx - 8 + i * 6, ty + 32, 3, 2); ctx.restore();
      for (let i = 0; i < 8; i++) {
        const cx = tx + i * cw + cw / 2 - 4, cy = ty + 8, sel = this.st === 'prep' && this.sel === i, tasting = this.st === 'taste' && this.idx === i;
        if (sel) G.selBar(ctx, cx - 14, cy - 12, 28, 40, this.t);
        const up = tasting ? -6 - Math.sin(this.tT * Math.PI) * 4 : 0;
        ctx.save(); ctx.fillStyle = '#1b1428'; ctx.beginPath(); ctx.ellipse(cx, cy + 6 + up, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff'; G.rrPath(ctx, cx - 8, cy - 6 + up, 16, 13, 4); ctx.fill();
        ctx.fillStyle = '#e0dcec'; ctx.fillRect(cx - 8, cy + 3 + up, 16, 4);
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx + 9, cy + up, 3.5, -1.4, 1.4); ctx.stroke();
        ctx.fillStyle = '#b0703a'; ctx.beginPath(); ctx.ellipse(cx, cy - 5 + up, 6.5, 2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        const lab = this.cups[i];
        G.text(lab === 'L' ? 'leite' : 'chá', cx, cy + 14, lab === 'L' ? '#ffffff' : '#ffb060', { align: 'center', outline: '#3a1a30' });
        if (this.st !== 'prep' && (i < this.idx || this.st === 'result')) {
          const ok = this.guess[i] === lab;
          G.puzTag(ctx, cx, cy - 26, this.guess[i] === 'L' ? 'leite' : 'chá', ok ? '#7aff8a' : '#ff8a7a');
        }
      }
      if (this.st === 'prep') {
        const bx = [82, 210], labs = ['SORTEAR ORDEM', 'SERVIR!'];
        labs.forEach((l, k) => { const sel = this.sel === 8 + k, x = bx[k], w = 112; G.panel(ctx, x, 172, w, 16, { r: 4, thin: true, corners: false, bgTop: sel ? '#7a4ad0' : '#2e2860', bg: sel ? '#3a2a8a' : '#1a163a', border: sel ? '#ffd84a' : '#5a5690' }); G.text(l, x + w / 2, 176, sel ? '#ffe27a' : '#c8c8e0', { align: 'center' }); });
        bubble(ctx, 76, 26, 296, G.wrap('Prepare 8 xícaras: ^y4 com o LEITE primeiro^0 e 4 com o CHÁ primeiro. Eu não vou ver a ordem!', 284).map(l => l.replace(/\^./g, '')));
        G.text('Embaixo de cada xícara: o que foi servido PRIMEIRO.', W / 2, 150, '#c8c8e0', { align: 'center' });
        G.text('← → escolher   Z trocar/confirmar   X sair', W / 2, 194, '#9a98b0', { align: 'center' });
        if (this.msg) G.text(this.msg, W / 2, 160, '#ffd84a', { align: 'center' });
      } else if (this.st === 'taste') {
        bubble(ctx, 76, 26, 296, [this.idx < 3 ? 'Hum... deixa eu provar com calma...' : this.patterned && this.idx < 6 ? 'Hum... que ordem mais previsível!' : 'Esta aqui... tenho certeza!']);
      } else {
        const ok = this.hits === 8;
        bubble(ctx, 76, 26, 296, [ok ? 'Acertei as 8! Eu disse que sabia!' : 'Acertei ' + this.hits + ' de 8... ora essa!', ok ? 'Agora prove que não foi sorte!' : 'Será que foi só sorte?']);
        G.text('Acertos: ' + this.hits + ' de 8', W / 2, 160, ok ? '#7aff8a' : '#ffd84a', { align: 'center' });
        G.text('X: continuar', W / 2, 192, '#ffd84a', { align: 'center' });
      }
    }
  }

  // ------------------------------------------------------------------
  //  MINIJOGO: MÁQUINA DAS MÉDIAS (Teorema Central do Limite)
  // ------------------------------------------------------------------
  const SHAPES = ['Plano (barras iguais)', 'Sino (meio mais alto)', 'Em U (pontas altas)'];
  class Clt {
    constructor(res) { this.res = res; this.t = 0; this.round = 0; this.n = 1; this.st = 'predict'; this.sel = 0; this.samples = []; this.dice = [3]; this.preds = []; this.rate = 0; }
    bins() { return 5 * this.n + 1; }
    binOf(m) { return Math.round(m * this.n) - this.n; }
    roll() { const d = []; for (let i = 0; i < this.n; i++) d.push(G.ri(1, 6)); this.dice = d; this.samples.push(st.mean(d)); }
    update(dt) {
      this.t += dt;
      if (this.st === 'predict') {
        if (I.pressed('up')) { this.sel = (this.sel + 2) % 3; G.sfx('select'); }
        if (I.pressed('down')) { this.sel = (this.sel + 1) % 3; G.sfx('select'); }
        if (I.pressed('cancel')) { this.finish(); return; }
        if (I.pressed('confirm')) { this.preds.push(this.sel); this.st = 'roll'; this.samples = []; this.acc = 0; this.rate = 6; G.sfx('confirm'); }
      } else if (this.st === 'roll') {
        this.rate = Math.min(140, this.rate + dt * 60); this.acc += dt * this.rate;
        while (this.acc >= 1 && this.samples.length < 300) { this.acc -= 1; this.roll(); if (this.samples.length % 10 === 0) G.sfx('flip'); }
        if (this.samples.length >= 300) { this.st = 'show'; this.t = 0; const ok = this.preds[this.preds.length - 1] === (this.n === 1 ? 0 : 1); G.sfx(ok ? 'correct' : 'wrong'); this.lastOk = ok; }
      } else if (this.st === 'show') {
        if (this.t > 0.6 && (I.pressed('confirm') || I.pressed('cancel'))) {
          this.round++;
          if (this.round === 1) { this.n = 5; this.st = 'predict'; this.sel = 0; this.samples = []; this.dice = [3, 3, 3, 3, 3]; }
          else { this.st = 'free'; this.sel = 2; }
        }
      } else if (this.st === 'free') {
        const NS = [1, 2, 5, 10];
        if (I.pressed('left')) { this.sel = (this.sel + 3) % 4; G.sfx('select'); }
        if (I.pressed('right')) { this.sel = (this.sel + 1) % 4; G.sfx('select'); }
        if (I.pressed('cancel')) { this.finish(); return; }
        if (I.pressed('confirm')) { this.n = NS[this.sel]; this.samples = []; this.st = 'freeRoll'; this.acc = 0; this.rate = 10; G.sfx('confirm'); }
      } else if (this.st === 'freeRoll') {
        this.rate = Math.min(160, this.rate + dt * 70); this.acc += dt * this.rate;
        while (this.acc >= 1 && this.samples.length < 400) { this.acc -= 1; this.roll(); if (this.samples.length % 12 === 0) G.sfx('flip'); }
        if (this.samples.length >= 400) this.st = 'free';
      }
    }
    finish() { G.mini.last = { rounds: this.round, preds: this.preds }; this.done = true; this.res(); }
    draw(ctx) {
      frame(ctx, 'MÁQUINA DAS MÉDIAS · Teorema Central do Limite');
      // painel da máquina: dados da jogada atual
      G.panel(ctx, 12, 28, 120, 74, { r: 4, thin: true, corners: false });
      G.text('Jogada atual', 72, 32, '#9ac8ff', { align: 'center' });
      const nd = this.dice.length, s = nd > 5 ? 14 : 18, gap = 3, perRow = Math.min(5, nd), rows = Math.ceil(nd / perRow);
      this.dice.forEach((v, i) => { const r = Math.floor(i / perRow), c = i % perRow, rw = Math.min(perRow, nd - r * perRow); G.dieFace(ctx, 72 - (rw * (s + gap) - gap) / 2 + c * (s + gap), 44 + r * (s + gap), v, s); });
      const m = st.mean(this.dice);
      G.text('média = ' + F(m, 2), 72, 46 + rows * (s + gap) + 2, '#ffd84a', { align: 'center' });
      G.text(this.n + (this.n === 1 ? ' dado por jogada' : ' dados por jogada'), 72, 108, '#c8c8e0', { align: 'center' });
      G.text('amostras: ' + this.samples.length, 72, 119, '#9a98b0', { align: 'center' });
      // histograma das médias
      const gx = 146, gy = 30, gw = 222, gh = 104, nb = this.bins(), cnt = new Array(nb).fill(0);
      for (const v of this.samples) { const b = this.binOf(v); if (b >= 0 && b < nb) cnt[b]++; }
      ctx.save(); ctx.fillStyle = '#070612'; G.rrPath(ctx, gx - 1, gy - 1, gw + 2, gh + 2, 3); ctx.fill(); const bg = ctx.createLinearGradient(0, gy, 0, gy + gh); bg.addColorStop(0, '#16143c'); bg.addColorStop(1, '#0a0a1e'); ctx.fillStyle = bg; G.rrPath(ctx, gx, gy, gw, gh, 2.5); ctx.fill(); ctx.restore();
      const mx = Math.max(6, ...cnt), slot = (gw - 10) / nb, bw = Math.max(1, slot - (nb > 20 ? 0.6 : 2));
      cnt.forEach((c, i) => {
        const bh = c / mx * (gh - 28), bx = gx + 5 + i * slot + (slot - bw) / 2;
        ctx.save(); const g = ctx.createLinearGradient(bx, 0, bx + bw, 0); const col = this.n >= 5 ? '#7aff8a' : '#5ad8ff'; g.addColorStop(0, G.col.shade(col, 0.3)); g.addColorStop(1, G.col.shade(col, -0.25)); ctx.fillStyle = g; ctx.fillRect(bx, gy + gh - 12 - bh, bw, bh); ctx.restore();
      });
      for (let v = 1; v <= 6; v++) { const i = v * this.n - this.n; G.text(String(v), gx + 5 + i * slot + slot / 2, gy + gh - 9, v === 3 || v === 4 ? '#c8c8e0' : '#9a98b0', { align: 'center', shadow: false }); }
      G.text('histograma das MÉDIAS', gx + gw / 2, gy + 3, '#c8c8e0', { align: 'center', shadow: false });
      // instruções / estados
      const by = 142;
      if (this.st === 'predict') {
        G.text('Com ' + this.n + (this.n === 1 ? ' DADO' : ' DADOS') + ' por jogada, que forma terá o histograma das médias?', W / 2, by, '#ffe27a', { align: 'center' });
        SHAPES.forEach((l, i) => { const yy = by + 13 + i * 11, sel = i === this.sel; if (sel) G.selBar(ctx, 110, yy - 2, 164, 11, this.t); G.text(l, 124, yy, sel ? '#ffe27a' : '#e8e4f4'); });
      } else if (this.st === 'roll') G.text('Jogando e anotando médias...', W / 2, by + 10, '#9ac8ff', { align: 'center' });
      else if (this.st === 'show') {
        const n1 = this.n === 1;
        G.text(this.lastOk ? '★ VOCÊ ACERTOU! ★' : 'Não foi dessa vez!', W / 2, by, this.lastOk ? '#7aff8a' : '#ff8a7a', { align: 'center' });
        G.wrap(n1 ? 'Com 1 dado, cada face tem chance 1/6: o histograma fica PLANO.' : 'Com 5 dados, as médias se juntam perto de 3,5 e formam um SINO: é o Teorema Central do Limite!', 340).forEach((l, i) => G.text(l, W / 2, by + 13 + i * 10, '#e8e4f4', { align: 'center' }));
        G.text('X: continuar', W / 2, 192, '#ffd84a', { align: 'center' });
      } else {
        G.text('Experimente à vontade! Dados por jogada:', W / 2, by, '#c8c8e0', { align: 'center' });
        [1, 2, 5, 10].forEach((n, i) => { const sel = i === this.sel, x = 108 + i * 44; G.panel(ctx, x, by + 12, 36, 15, { r: 3, thin: true, corners: false, bgTop: sel ? '#7a4ad0' : '#2e2860', bg: sel ? '#3a2a8a' : '#1a163a', border: sel ? '#ffd84a' : '#5a5690' }); G.text(String(n), x + 18, by + 16, sel ? '#ffe27a' : '#c8c8e0', { align: 'center' }); });
        G.text('Quanto MAIS dados, mais ESTREITO o sino!   ← → escolher   Z jogar   X sair', W / 2, 192, '#9a98b0', { align: 'center' });
      }
    }
  }
  G.mini.MAP.tea = Tea;
  G.mini.MAP.clt = Clt;

  // ------------------------------------------------------------------
  //  Roteiros: Dona Muriel (chá)
  // ------------------------------------------------------------------
  const qz = G.Q.helpers;
  // pergunta de opções fixas (a primeira é a correta; embaralha na hora)
  const quizFixed = (topic, text, opts, explain, title, fig) => { const items = opts.map((t, i) => ({ t, ok: i === 0 })); G.shuffle(items); return G.ui.quiz({ topic, text, options: items.map(i => i.t), correct: items.findIndex(i => i.ok), explain, fig }, { title }); };
  G.quizFixed = quizFixed;
  N.muriel = async () => {
    const p = P(), por = 'muriel_down0', nm = 'Dona Muriel';
    if (QS.done('cha')) { await say(nm, G.pick(['Desde o teste, o Seu Quirino me trata com outro respeito! Hehe.', 'Lembre: primeiro a hipótese nula, depois os dados. Nada de conclusões apressadas!', 'Mais um chazinho? Desta vez eu não conto se o leite veio antes!']), { portrait: por }); return; }
    if (!QS.st('cha')) {
      await say(nm, 'Ah, {um jovem estatístico|uma jovem estatística}! Ninguém nesta vila acredita em mim...', { portrait: por });
      await say(nm, 'Eu sei dizer, só pelo gosto, se o ^yleite^0 foi servido ANTES ou DEPOIS do ^ychá^0 na xícara! O Seu Quirino jura que é pura sorte.', { portrait: por });
      await say(nm, 'Que tal um experimento de verdade? Você prepara ^y8 xícaras^0 — 4 com o leite primeiro e 4 com o chá primeiro — e eu provo sem ver.', { portrait: por });
      QS.start('cha');
    }
    if (!p.flags.chaTest) {
      const r = await ask(nm, 'Vamos fazer a prova do chá?', ['Vamos testar!', 'Depois'], { cancel: 1, portrait: por });
      if (r !== 0) { await say(nm, 'Quando quiser, é só voltar. A chaleira está sempre quente!', { portrait: por }); return; }
      await G.mini.run('tea');
      const res = G.mini.last;
      if (!res || res.aborted) return;
      if (res.patterned) await say(nm, 'Psiu... você serviu as xícaras numa ordem com PADRÃO. Eu poderia adivinhar pela sequência! Por isso os cientistas ^gsorteiam^0 a ordem.', { portrait: por });
      if (res.hits < 8) {
        await say(nm, 'Acertei ' + res.hits + ' de 8... Que vergonha!', { portrait: por });
        const ok = await quizFixed('hipotese', 'Chutando, a chance de acertar ^y6 ou mais^0 das 8 xícaras é 17/70 ≈ ^y24%^0. Esse resultado basta para rejeitar a hipótese "ela só chuta" (nível de 5%)?', ['Não: 24% é bem maior que 5%', 'Sim: ela acertou a maioria', 'Sim: qualquer acerto prova', 'Não: ela errou de propósito'], 'Com valor-p de 24%, resultados assim são comuns mesmo chutando. ^gNão rejeitamos H₀^0... ainda!', 'PROVA DO CHÁ');
        await say(nm, ok ? 'Exato. Os dados não bastam. Vamos repetir o teste com calma!' : 'Não, não... 24% acontece toda hora por sorte. Vamos repetir!', { portrait: por });
        return;
      }
      p.flags.chaTest = true;
      await say(nm, 'OITO DE OITO! Mas o Seu Quirino vai dizer que foi sorte... Prove que não foi!', { portrait: por });
    }
    const ok1 = await quizFixed('hipotese', 'Hipótese nula H₀: "ela só está chutando". Há ^y70 jeitos^0 de escolher quais 4 das 8 xícaras tiveram leite primeiro. Chutando, qual a chance de acertar TODAS?', ['1/70', '1/8', '1/2', '8/70'], 'Só 1 dos 70 jeitos está certo: ^g1/70 ≈ 1,4%^0. Esse é o ^yvalor-p^0 do experimento!', 'PROVA DO CHÁ', { type: 'pval', z: 2.4 });
    if (!ok1) { await say(nm, 'Pense assim: são 70 jeitos possíveis e só um está certo. Volte para conversarmos!', { portrait: por }); return; }
    const ok2 = await quizFixed('hipotese', 'O valor-p deu 1/70 ≈ ^y1,4%^0, menor que 5%. O que concluímos?', ['Rejeitamos H₀: ela não está só chutando', 'Ela está só chutando', 'O teste não serve para nada', 'Ela acerta 100% das vezes, para sempre'], 'Um resultado tão raro sob H₀ é evidência contra H₀: ^grejeitamos a hipótese de chute^0. (Mas nenhum teste é prova absoluta!)', 'PROVA DO CHÁ');
    if (!ok2) { await say(nm, 'Quase! Se o resultado seria raríssimo chutando, o chute fica difícil de acreditar... Volte quando quiser.', { portrait: por }); return; }
    await say(nm, 'Isso! Você fez um ^yTESTE DE HIPÓTESE^0 completo: hipótese nula, experimento sorteado, valor-p e conclusão. O grande Ronald Fisher contou essa história num livro famoso!', { portrait: por });
    if (!p.lessons.includes('hipotese')) { p.lessons.push('hipotese'); await say(null, 'Nova lição no Grimório: ^cTeste de Hipótese^0!'); await G.ui.lesson('hipotese'); }
    await QS.finish('cha');
    await say(nm, 'Tome, achei esta lente no fundo da caixa de chá. E um mimo da vovó!', { portrait: por });
    await G.give('lens', 'cha');
    await G.give('heartPiece');
  };

  // ------------------------------------------------------------------
  //  Ferreiro Tukey (boxplot)
  // ------------------------------------------------------------------
  function forgeData() {
    for (;;) {
      const w = G.shuffle([7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 14]).slice(0, 8);
      const out = G.chance(0.6) ? G.ri(18, 20) : G.ri(2, 3), at = G.ri(0, 8);
      w.splice(at, 0, out);
      const [q1, , q3] = st.quartiles(w), iqr = q3 - q1, lo = q1 - 1.5 * iqr, hi = q3 + 1.5 * iqr;
      if (w.filter(v => v < lo || v > hi).length === 1 && iqr >= 1) return { w, out: at, seen: [] };
    }
  }
  N.tukey = async () => {
    const p = P(), por = 'tukey_down0', nm = 'Ferreiro Tukey';
    if (QS.done('forja')) { await say(nm, G.pick(['O boxplot virou meu melhor ajudante: bateu o olho, achou o defeito!', 'Metade das espadas cabe dentro da caixa, entre Q1 e Q3. O resto são os bigodes!', 'John Tukey dizia: "um bom gráfico mostra o que você nem sabia procurar".']), { portrait: por }); return; }
    if (!QS.st('forja')) {
      await say(nm, 'Uff, que calor! Sou o Ferreiro Tukey. Forjei ^y9 espadas^0 que deviam pesar quase a mesma coisa...', { portrait: por });
      await say(nm, 'Mas o martelo escorregou numa delas. Uma saiu com DEFEITO: pesada demais ou leve demais! Não sei qual.', { portrait: por });
      await say(nm, 'Golpeie cada espada ali na frente: a balança mágica mostra o peso. O quadro ao lado vai montando um ^yBOXPLOT^0 com os pesos.', { portrait: por });
      await say(nm, 'Um ^ooutlier^0 — um valor muito longe dos outros — é a espada com defeito. Vamos ver se você acha!', { portrait: por });
      p.flags.forja = forgeData();
      QS.start('forja');
      return;
    }
    if (QS.step('forja') === 0) { await say(nm, 'Faltam ' + (9 - p.flags.forja.seen.length) + ' espadas para pesar. Golpeie as que estão sem número!', { portrait: por }); return; }
    const D = p.flags.forja, w = D.w, s = st.sorted(w), [q1, md, q3] = st.quartiles(w), iqr = q3 - q1;
    await say(nm, 'Todos os pesos anotados: ' + s.join(', ') + ' (já em ordem). Vamos ler o boxplot juntos.', { portrait: por });
    const ok1 = await G.ui.quiz(qz.q('quartis', 'Pesos em ordem: ^y' + s.join(', ') + '^0. A mediana é ' + F(md) + '. Qual é o ^yQ1^0 (mediana da metade de baixo)?', q1, [q3, md, s[0], s[1], q1 + 1], 'Metade de baixo: ' + s.slice(0, 4).join(', ') + ' → mediana = ^g' + F(q1) + '^0.', { type: 'box', values: w, mark: 'box' }), { title: 'CONTROLE DE QUALIDADE' });
    const ok2 = ok1 && await G.ui.quiz(qz.q('quartis', 'E o ^yQ3^0 é ' + F(q3) + '. Qual a AMPLITUDE INTERQUARTIL (IQR = Q3 - Q1)?', iqr, [q3 + q1, q3, md, iqr + 2], 'IQR = ' + F(q3) + ' - ' + F(q1) + ' = ^g' + F(iqr) + '^0.'), { title: 'CONTROLE DE QUALIDADE' });
    const out = w[D.out];
    const ok3 = ok2 && await quizFixed('quartis', 'Limites: Q1 - 1,5·IQR = ' + F(q1 - 1.5 * iqr) + ' e Q3 + 1,5·IQR = ' + F(q3 + 1.5 * iqr) + '. Qual espada é o ^oOUTLIER^0 (a defeituosa)?', ['A de ' + out + ' kg'].concat(G.shuffle(s.filter(v => v !== out)).slice(0, 3).map(v => 'A de ' + v + ' kg')), 'Só ' + out + ' kg fica fora dos limites: é o ^gpeso discrepante^0, a espada defeituosa!', 'CONTROLE DE QUALIDADE', { type: 'box', values: w });
    if (!ok3) { await say(nm, 'Hmm, não bate com minhas contas. Olhe o quadro do boxplot e tente de novo!', { portrait: por }); return; }
    await say(nm, 'É essa mesmo! Vou derreter e forjar de novo. Você tem olho de estatístico!', { portrait: por });
    if (!p.lessons.includes('quartis')) { p.lessons.push('quartis'); await say(null, 'Nova lição no Grimório: ^cQuartis e Boxplot^0!'); await G.ui.lesson('quartis'); }
    await QS.finish('forja');
    await say(nm, 'Achei esta lente presa no carvão da fornalha. E deixe-me temperar sua espada!', { portrait: por });
    await G.give('lens', 'forja');
    await G.give('tempera');
  };

  // ------------------------------------------------------------------
  //  Pescador Neyman (pesquisa e intervalo de confiança)
  // ------------------------------------------------------------------
  const ney0 = N.neyman;
  N.neyman = async (n) => {
    const p = P(), nm = 'Pescador Neyman';
    if (!p.flags.metNeyman || QS.done('pesquisa')) return ney0(n);
    if (!QS.st('pesquisa')) {
      await say(nm, 'Sigma! Preciso de ajuda com outra coisa: o reino vai decidir entre construir uma ^yPONTE^0 sobre o lago ou um ^cPOÇO^0 novo na vila.');
      await say(nm, 'Perguntar a TODO MUNDO é impossível. Então ^gsorteei 10 moradores^0 da Vila, do Lago e dos Campos. Eles estão marcados com um "!".');
      await say(nm, 'Entreviste os dez e me traga as respostas. Com a amostra vamos ESTIMAR a opinião do reino... e dizer o quanto dá para confiar!');
      if (!p.flags.votes) p.flags.votes = Array.from({ length: 10 }, () => (Math.random() < 0.6 ? 'P' : 'Q'));
      QS.start('pesquisa');
      return;
    }
    if (QS.step('pesquisa') === 0) { await say(nm, 'Você já entrevistou ' + voted().length + ' de 10. Procure os sorteados pela Vila, pelo Lago e pelos Campos!'); return ney0(n); }
    const k = p.flags.votes.filter(v => v === 'P').length, pc = k * 10;
    await say(nm, 'Vejamos as respostas: ^y' + k + ' de 10^0 preferem a PONTE. Nossa estimativa é ^y' + pc + '%^0.');
    const ok1 = await quizFixed('confianca', 'Pela regra prática, a margem de erro é cerca de ^y1 ÷ √n^0. Com n = 10 entrevistados (√10 ≈ 3,16), a margem é de aproximadamente...', ['±32%', '±10%', '±3%', '±50%'], '1 ÷ 3,16 ≈ 0,32 → ^g±32 pontos^0! Com só 10 pessoas, a estimativa é bem incerta.', 'A GRANDE PESQUISA', { type: 'ci', est: pc, m: 32 });
    if (!ok1) { await say(nm, 'Calma: divida 1 por √10, que é uns 3,16. Volte quando quiser recalcular!'); return; }
    await say(nm, 'Isso! Então o intervalo vai de ' + Math.max(0, pc - 32) + '% a ' + Math.min(100, pc + 32) + '%. ' + (pc - 32 > 50 ? 'Mesmo assim a ponte ganha!' : 'Ele inclui os dois lados de 50%: ainda NÃO dá para saber quem vence!'));
    const ok2 = await quizFixed('confianca', 'Quantas pessoas precisaríamos entrevistar para a margem cair para cerca de ^y±10%^0?', ['100', '20', '30', '1000'], '1 ÷ √100 = 1 ÷ 10 = ^g10%^0. Para cortar a margem, a amostra cresce bem rápido!', 'A GRANDE PESQUISA');
    if (!ok2) { await say(nm, 'Pense: qual número tem raiz quadrada 10? Volte para tentarmos de novo.'); return; }
    await say(nm, 'Perfeito! Vou sortear 100 pessoas para a pesquisa oficial. Você entendeu o segredo: ^gestimativa ± margem de erro^0, o tal ^yintervalo de confiança^0.');
    if (!p.lessons.includes('confianca')) { p.lessons.push('confianca'); await say(null, 'Nova lição no Grimório: ^cIntervalo de Confiança^0!'); await G.ui.lesson('confianca'); }
    await QS.finish('pesquisa');
    await say(nm, 'Pesquei esta lente outro dia, brilhando no fundo do lago. É sua! E leve isto também.');
    await G.give('lens', 'pesquisa');
    await G.give('heartPiece');
  };
  const VOTER_LINES = [
    'A média de peixes por dia aqui é 4. Mas tem dia de 0 e dia de 12!',
    'Dizem que a Professora Gertrude passa as noites olhando estrelas... e médias.',
    'Pesquisa boa é pesquisa sorteada. Senão só pergunta pros amigos!',
    'Meu avô dizia: "quem conta só os peixes grandes, mente sem querer".',
    'Choveu 3 dias seguidos. Isso NÃO quer dizer que amanhã fica seco, viu?',
    'Ouvi falar de um ferreiro no deserto que desenha caixinhas com bigodes...',
    'Já tentou a máquina do eremita no bosque? Os dados formam um sino!',
    'Correlação não é causalidade: meu galo canta e o sol nasce, mas um não causa o outro!'
  ];
  VOTERS.forEach(([, , , , name], i) => {
    N['voter' + i] = async () => {
      const p = P();
      if (QS.active('pesquisa') && QS.step('pesquisa') === 0 && !voted().includes(i)) {
        const ans = p.flags.votes[i];
        await say(name, G.pick(['Uma pesquisa do Neyman? Claro!', 'Fui sorteado? Que chique!', 'Ah, a famosa pesquisa! Deixa eu pensar...']) + ' Eu prefiro ' + (ans === 'P' ? 'a ^yPONTE^0 sobre o lago!' : 'o ^cPOÇO^0 novo na vila!'));
        voted().push(i); G.sfx('select');
        if (voted().length >= 10) QS.setStep('pesquisa', 1);
        else G.ui.toast('Entrevistados: ' + voted().length + '/10', '#9ad8ff');
        return;
      }
      await say(name, VOTER_LINES[(i + Math.floor(G.time / 20)) % VOTER_LINES.length]);
    };
  });

  // ------------------------------------------------------------------
  //  Sábio Bayes (detector de tesouros)
  // ------------------------------------------------------------------
  async function digScript(spot) {
    const D = P().flags.dig;
    if (!QS.active('detector') || !D) { await say(null, 'Um monte de lama fofa. Alguém andou cavando por aqui...'); return; }
    const i = spot.i;
    if (D.dug.includes(i)) { await say(null, 'Você já cavou aqui.'); return; }
    if (!D.scanned.includes(i)) {
      G.sfx('select'); await G.wait(0.25); G.sfx('select'); await G.wait(0.25);
      D.scanned.push(i);
      const beep = D.beep.includes(i);
      if (beep) { G.sfx('secret'); G.fx.ring(spot.cx, spot.cy, 18, '#7aff8a', 0.4, 2); }
      await say('Detector Bayesiano', beep ? '^gBIP! BIP! BIP!^0 O detector apitou!' : '... silêncio. O detector não apitou.');
      if (!beep) { checkDig(); return; }
    }
    const r = await G.ui.choose(['Cavar aqui', 'Agora não'], { prompt: D.beep.includes(i) ? 'O detector apitou neste monte. Cavar?' : 'O detector NÃO apitou aqui. Cavar mesmo assim?', cancel: 1 });
    if (r !== 0 || D.dug.includes(i)) return;
    D.dug.push(i);
    G.sfx('cut'); G.shake(1.5, 0.2);
    for (let k = 0; k < 8; k++) G.fx.burst(spot.cx, spot.cy, ['#6a5636', '#8a7450', '#4a3a24'], 3, 60, { grav: 200 });
    await G.wait(0.4);
    const t = D.t.indexOf(i);
    if (t === 0) { await say(null, 'Tesouro de verdade! Algo brilha na lama...'); await G.give('heartPiece'); }
    else if (t === 1) { await say(null, 'Tesouro de verdade! Um baú cheio de moedas!'); G.give('coin', 40); await G.wait(0.3); }
    else { G.sfx('wrong'); await say(null, 'Só lama e uma minhoca assustada. O detector apitou à toa: um ^oalarme falso^0!'); }
    checkDig();
  }
  function checkDig() {
    const D = P().flags.dig;
    const pending = D.beep.filter(i => !D.dug.includes(i)).length, unscanned = 8 - D.scanned.length;
    if (!pending && !unscanned && QS.step('detector') === 0) QS.setStep('detector', 1);
    else if (!pending && unscanned) G.ui.toast('Montes ainda não testados: ' + unscanned, '#9ad8ff');
  }
  const bay0 = N.bayes;
  N.bayes = async (z) => {
    const p = P(), por = 'bayes_down0', nm = 'Sábio Bayes';
    if (!p.flags.metBayes || QS.done('detector')) return bay0(z);
    if (!QS.st('detector')) {
      await say(nm, 'Croac! Anos atrás enterrei tesouros neste pântano... e esqueci onde! Tenho um ^yDetector Bayesiano^0, mas ele é meio fofoqueiro.', { portrait: por });
      await say(nm, 'Ele ^gapita^0 quando há tesouro, mas às vezes apita em lama pura. Teste os ^y8 montes de lama^0 do pântano e cave onde ele apitar.', { portrait: por });
      await say(nm, 'No fim, me diga: quando o detector apita, qual a chance de ter tesouro DE VERDADE? Croac!', { portrait: por });
      const idx = G.shuffle([0, 1, 2, 3, 4, 5, 6, 7]);
      p.flags.dig = { t: idx.slice(0, 2), beep: idx.slice(0, 4), scanned: [], dug: [] };
      QS.start('detector');
      G.ui.toast('Você recebeu o DETECTOR BAYESIANO.', '#7aff8a');
      return;
    }
    if (QS.step('detector') === 0) { const D = p.flags.dig; await say(nm, 'Montes testados: ' + D.scanned.length + ' de 8. Teste todos e cave onde apitar!', { portrait: por }); return; }
    await say(nm, 'Então? O detector apitou em ^y4^0 montes, mas só ^y2^0 tinham tesouro de verdade. Croac!', { portrait: por });
    const ok1 = await quizFixed('condicional', 'O detector apitou em 4 montes e 2 tinham tesouro. ^ySABENDO que apitou^0, qual a chance de haver tesouro?', ['2/4 = 1/2', '2/8 = 1/4', '4/8 = 1/2 de apitar', '1'], 'Só contamos os casos em que apitou (4). Destes, 2 tinham tesouro: P(tesouro | apitou) = ^g2/4 = 50%^0. O apito não garante nada!', 'O DETECTOR DE TESOUROS', { type: 'table2', rows: ['Tesouro', 'Lama'], cols: ['Apitou', 'Quieto'], v: [[2, 0], [2, 4]], hi: 0 });
    if (!ok1) { await say(nm, 'Croac... Olhe só a coluna "Apitou" da tabela. Volte e pense de novo!', { portrait: por }); return; }
    const ok2 = await G.ui.quiz(G.Q.gen('condicional', 2), { title: 'O DETECTOR DE TESOUROS' });
    if (!ok2) { await say(nm, 'Quase! Lembre: P(A|B) = casos com A e B ÷ casos com B. Tente de novo outra hora!', { portrait: por }); return; }
    await say(nm, 'Isso é ^yprobabilidade condicional^0! O reverendo Bayes ensinou a atualizar a chance quando chega uma evidência nova.', { portrait: por });
    if (!p.lessons.includes('condicional')) { p.lessons.push('condicional'); await say(null, 'Nova lição no Grimório: ^cProbabilidade Condicional^0!'); await G.ui.lesson('condicional'); }
    await QS.finish('detector');
    await say(nm, 'Esta lente estava no fundo do meu lago favorito. Leve-a, croac!', { portrait: por });
    await G.give('lens', 'detector');
  };

  // ------------------------------------------------------------------
  //  Eremita Laplace (máquina das médias)
  // ------------------------------------------------------------------
  const lap0 = N.laplace;
  N.laplace = async () => {
    const p = P(), por = 'laplace_down0', nm = 'Eremita Laplace';
    if (!p.flags.metLaplace || QS.done('medias')) return lap0();
    if (!QS.st('medias')) {
      await say(nm, 'Hum... você de novo. Pois bem: construí uma ^yMáquina das Médias^0 ali ao lado da cabana. Ela lança dados e anota a MÉDIA de cada jogada.', { portrait: por });
      await say(nm, 'Aposto que você não adivinha a FORMA do histograma dessas médias. Vá lá e tente. Depois volte e me conte.', { portrait: por });
      QS.start('medias');
      return;
    }
    if (QS.step('medias') === 0) { await say(nm, 'A máquina fica ao lado da cabana. Faça pelo menos as duas apostas!', { portrait: por }); return; }
    await say(nm, 'Viu? Um dado sozinho é plano... mas a MÉDIA de vários dados forma um sino. Eu demonstrei isso em 1810!', { portrait: por });
    const ok = await G.ui.quiz(G.Q.gen('tcl', 2), { title: 'AS MÉDIAS DE LAPLACE' });
    if (!ok) { await say(nm, 'Hum. Brinque mais com a máquina e volte.', { portrait: por }); return; }
    await say(nm, 'É o ^yTeorema Central do Limite^0: o motivo de a curva normal aparecer em todo canto do universo.', { portrait: por });
    if (!p.lessons.includes('tcl')) { p.lessons.push('tcl'); await say(null, 'Nova lição no Grimório: ^cTeorema Central do Limite^0!'); await G.ui.lesson('tcl'); }
    await QS.finish('medias');
    await say(nm, 'Uma lente caiu das estrelas no meu quintal. Fique com ela. E com isto.', { portrait: por });
    await G.give('lens', 'medias');
    await G.give('heartPiece');
  };

  // ------------------------------------------------------------------
  //  Professora Gertrude (observatório)
  // ------------------------------------------------------------------
  N.gertrude = async () => {
    const p = P(), por = 'gertrude_down0', nm = 'Professora Gertrude';
    if (!QS.st('lentes')) {
      await say(nm, 'Olá! Sou a Professora Gertrude, guardiã do ^cObservatório da Inferência^0. Meu nome homenageia ^yGertrude Cox^0, pioneira no planejamento de experimentos.', { portrait: por });
      await say(nm, 'Daqui os antigos estatísticos olhavam além das amostras e tiravam CONCLUSÕES sobre o mundo inteiro. É a arte da ^yinferência^0!', { portrait: por });
      await say(nm, 'Mas Viés quebrou a grande lente do telescópio em ^y5 Lentes da Inferência^0 e as espalhou pelo reino. Sem ela, o portão não abre.', { portrait: por });
      await say(nm, 'Quem resolver problemas de estatística de verdade vai encontrá-las. Procure quem tem um ^y"!"^0 sobre a cabeça. O menu de ^yMISSÕES^0 guarda as pistas.', { portrait: por });
      QS.start('lentes');
      return;
    }
    if (QS.active('lentes')) {
      const L = QS.lenses();
      if (L >= 5) {
        await say(nm, 'As cinco lentes! Deixe-me encaixá-las no telescópio...', { portrait: por });
        G.sfx('crystal'); G.flash('#bff4ff', 0.6, 0.6); G.shake(3, 0.5); await G.wait(0.8);
        p.flags.obsOpen = true;
        await QS.finish('lentes');
        await say(nm, 'O portão do observatório está ^gaberto^0! Lá dentro há desafios de inferência... e algo terrível que o Viés deixou de guarda. Cuidado, Sigma!', { portrait: por });
        return;
      }
      const miss = LENSES.filter(id => !QS.done(id));
      await say(nm, 'Você tem ' + L + ' de 5 lentes. ' + QS.hint(miss[0]), { portrait: por });
      return;
    }
    await say(nm, p.flags.boss_d7 ? 'Você venceu a Hipótese Nula! O céu de Datália nunca esteve tão claro.' : 'O observatório está aberto. Lá dentro, use tudo o que aprendeu: boxplots, binomial, intervalos, hipóteses...', { portrait: por });
  };

  // ------------------------------------------------------------------
  //  Mestre Gauss: novo item "Missões do reino"
  // ------------------------------------------------------------------
  const gauss0 = N.gauss;
  N.gauss = async (n) => {
    const p = P(), por = 'gauss_down0', nm = 'Mestre Gauss';
    if (!p.flags.talkGauss) return gauss0(n);
    const r = await ask(nm, 'Precisa de ajuda, Sigma?', ['Para onde devo ir?', 'Missões do reino', 'Desafio do Mestre (XP)', 'Quem é o senhor?', 'Nada, {obrigado|obrigada}'], { cancel: 4, portrait: por });
    if (r === 0) await say(nm, G.nextHint(), { portrait: por });
    else if (r === 1) {
      const open = ORDER.filter(id => !QS.done(id));
      if (!open.length) { await say(nm, 'Você ajudou o reino inteiro! Até eu aprendi umas coisas.', { portrait: por }); return; }
      await say(nm, 'O povo do reino tem problemas que só a estatística resolve. Ajudar rende ^yLentes da Inferência^0, tesouros... e muito aprendizado!', { portrait: por });
      for (const id of open.slice(0, 3)) await say(nm, QS.hint(id), { portrait: por });
    } else if (r === 2) {
      const ok = await G.ui.quiz(G.Q.genUnlocked(2), { title: 'DESAFIO DO MESTRE' });
      if (ok) { G.addXP(10); await say(nm, 'Excelente! Você está ficando {afiado|afiada}. (+10 XP)', { portrait: por }); }
      else await say(nm, 'Errar faz parte de aprender. Releia o Grimório e tente de novo!', { portrait: por });
    } else if (r === 3) {
      await say(nm, 'Me inspiro em ^yCarl Friedrich Gauss^0 (1777-1855), o "príncipe dos matemáticos". Ele estudou a famosa ^ccurva normal^0, em forma de sino.', { portrait: por });
      await say(nm, 'Dizem que, ainda criança, ele somou 1+2+...+100 em segundos: 50 pares que somam 101 = 5050! Truques assim também ajudam a calcular médias.', { portrait: por });
    }
  };
})(window.G);
