'use strict';
// =====================================================================
//  Jogo: laço principal, estados (título, introdução, jogo, game over,
//  final), salvar/carregar, transições e renderização.
// =====================================================================
(function (G) {
  const W = G.W, H = G.H;
  const SAVE_KEY = 'lendaSigma_save_v1', SET_KEY = 'lendaSigma_settings_v1';
  G.cutscene = 0;
  G.trans = null;
  G.state = 'boot';

  // ------------------------------------------------------------------
  //  Progresso
  // ------------------------------------------------------------------
  G.newProgress = () => ({
    hp: 12, maxHp: 12, coins: 0, level: 1, xp: 0, sab: 0, swordLv: 0, armorLv: 0,
    bombs: 0, bombMax: 10, potions: 0, sub: null, heartPieces: 0,
    items: { sword: false, boots: false, bombs: false, beam: false, suit: false, spin: false, hook: false },
    quests: {},
    crystals: [], keys: {}, bossKey: {}, flags: {}, lessons: [], pipes: [], regions: [], broken: {}, dunSeen: {},
    seen: new Array((G.world.MW / 8) * (G.world.MH / 8)).fill(0),
    stats: { dmg: [], quiz: {}, kills: 0, coinsTotal: 0 }, playTime: 0,
    savePoint: null, personagem: 'heroi'
  });
  // personagem escolhido no Novo Jogo ('heroi' ou 'heroina'); saves antigos ficam com o herói
  G.personagem = 'heroi';
  G.ehHeroina = () => G.personagem === 'heroina';
  G.spriteHeroi = (traje = G.P && G.P.items.suit) => (G.ehHeroina() ? 'heroina' : 'hero') + (traje ? '_suit' : '');
  // textos com '{masculino|feminino}' concordam com o personagem
  G.genero = s => (typeof s === 'string' && s.includes('{') ? s.replace(/\{([^{}|]*)\|([^{}|]*)\}/g, (_, m, f) => (G.ehHeroina() ? f : m)) : s);
  G.fmtTime = s => { s = Math.floor(s); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, ss = s % 60; return (h ? h + 'h ' : '') + String(m).padStart(2, '0') + 'm ' + String(ss).padStart(2, '0') + 's'; };
  G.completion = () => {
    const P = G.P; let got = 0, tot = 0;
    for (const k in P.items) { tot++; if (P.items[k]) got++; }
    tot += 6; got += P.crystals.length;
    const HP = G.HEART_PIECES_TOTAL || 24; tot += HP; got += Math.min(HP, P.heartPieces);
    if (G.quest) { tot += G.QUEST_ORDER.length; got += G.QUEST_ORDER.filter(id => G.quest.done(id)).length; }
    tot += 1; if (P.flags.boss_d7) got++;
    tot += G.LESSON_ORDER.length; got += P.lessons.length;
    return Math.round(got / tot * 100);
  };

  // ------------------------------------------------------------------
  //  Scripts
  // ------------------------------------------------------------------
  G.runScript = function (fn) {
    G.cutscene++;
    let p;
    try { p = Promise.resolve(fn()); } catch (e) { console.error(e); p = Promise.resolve(); }
    return p.catch(e => console.error(e)).finally(() => { G.cutscene = Math.max(0, G.cutscene - 1); G.input.consume(); });
  };
  G.openPause = (tab = 0) => { G.sfx('menu'); G.runScript(() => G.ui.pause(tab)); };
  G.restoreMusic = () => {
    if (G.map && G.map.kind === 'dungeon') { if (G.boss && !G.boss.dead) G.music(G.bossMusic ? G.bossMusic(G.boss) : 'boss'); else G.music(G.map.spec.music); }
    else if (G.map) { const info = G.REGION_INFO[G.world.regionAt(G.player.cx, G.player.cy)]; G.music(info.music); }
  };

  // ------------------------------------------------------------------
  //  Salvar / carregar
  // ------------------------------------------------------------------
  G.setSavePoint = (pad) => {
    G.P.savePoint = { map: G.map.id, x: pad.cx - 5, y: pad.y + 16, room: G.curRoom };
  };
  G.canSaveHere = () => G.map && G.map.kind === 'overworld' && !G.trans;
  G.saveGame = () => {
    const P = G.P; if (!P) return;
    if (G.map && G.map.kind === 'overworld' && G.player) P.lastPos = { x: G.player.x, y: G.player.y };
    if (G.map && G.player && !G.trans && P.hp > 0) {
      const pos = G.player.lastSafe || G.player;
      P.resume = { map: G.map.id, room: G.curRoom, x: pos.x, y: pos.y, dir: G.player.dir };
    }
    try { G.storage.setItem(SAVE_KEY, JSON.stringify(P)); } catch (e) { }
  };
  G.hasSave = () => { try { return !!G.storage.getItem(SAVE_KEY); } catch (e) { return false; } };
  G.loadSave = () => {
    try {
      const s = JSON.parse(G.storage.getItem(SAVE_KEY));
      const base = G.newProgress();
      for (const k in base) if (s[k] === undefined) s[k] = base[k];
      for (const k in base.items) if (s.items[k] === undefined) s.items[k] = false;
      for (const k in base.stats) if (s.stats[k] === undefined) s.stats[k] = base.stats[k];
      return s;
    } catch (e) { return null; }
  };
  G.saveSettings = () => { try { G.storage.setItem(SET_KEY, JSON.stringify({ m: G.audio.musicVol, s: G.audio.sfxVol, t: G.touch ? G.touch.mode : 'auto', muted: G.audio.muted })); } catch (e) { } };
  function loadSettings() { try { const s = JSON.parse(G.storage.getItem(SET_KEY)); if (s) { G.audio.setVol(s.m, s.s); G.audio.setMuted(s.muted); } if (s && s.t && G.touch) G.touch.mode = s.t; } catch (e) { } }

  // posição inicial (na frente da casa do Mestre Gauss)
  function startPos() { const ox = 48, oy = 32; return { x: (ox + 18) * 16 + 3, y: (oy + 11) * 16 + 2 }; }
  function dungeonExitPos(did) {
    const o = G.world.ensure().objects.find(ob => ob.type === 'warp' && ob.to === did);
    return { x: o.x + o.w / 2 - 5, y: o.y + 22 };
  }

  // ------------------------------------------------------------------
  //  Transições de mapa
  // ------------------------------------------------------------------
  G.enterDungeon = (did) => {
    const P = G.P;
    if (did === 'd5' && !P.items.suit) { G.runScript(async () => { await G.ui.say(null, 'A porta da torre está ^ccongelada^0. O frio aqui é extremo... Você precisa de proteção térmica.'); G.player.y += 8; }); return; }
    if (G.dungeonGate && G.dungeonGate(did)) return;
    if (did === 'd6' && P.crystals.length < 5) { G.runScript(async () => { await G.ui.say(null, 'O portão está selado. Faltam cristais.'); G.player.y += 8; }); return; }
    G.runScript(async () => {
      G.sfx('door');
      P.lastPos = dungeonExitPos(did);
      await G.ui.fade(1, 0.35);
      G.dun.load(did);
      P.lastDungeon = did;
      G.saveGame();
      await G.ui.fade(0, 0.35);
    });
  };
  G.exitDungeon = () => {
    G.runScript(async () => {
      const did = G.map.id;
      await G.ui.fade(1, 0.35);
      const p = dungeonExitPos(did);
      G.world.loadOverworld(p.x, p.y);
      G.player.dir = 0;
      G.P.lastDungeon = null; G.P.lastPos = { x: p.x, y: p.y };
      G.saveGame();
      await G.ui.fade(0, 0.35);
    });
  };
  G.playerDie = () => {
    const p = G.player;
    if (p.state === 'dead') return;
    p.state = 'dead';
    G.music(null);
    G.runScript(async () => {
      G.sfx('hurt'); G.hitStop = 0.25; G.flash('#ff2040', 0.4, 0.5);
      for (let i = 0; i < 12; i++) { p.dir = [0, 3, 1, 2][i % 4]; await G.wait(0.06); }
      G.sfx('fall'); G.flash('#ffffff', 0.3, 0.6);
      G.fx.ring(p.cx, p.cy - 6, 30, '#ffffff', 0.5, 3);
      for (let i = 0; i < 16; i++) G.fx.glow(p.cx + G.rf(-6, 6), p.cy - G.rf(0, 14), { size: 3, color: G.pick(['#ffffff', '#ff8aa0', '#7ae4ff']), vy: -G.rf(20, 60), vx: G.rf(-20, 20), life: G.rf(0.6, 1.2) });
      await G.wait(0.5);
      await G.ui.fade(1, 0.6);
      G.state = 'gameover'; G.goT = 0; G.goSel = 0;
      G.music('gameover');
      await G.ui.fade(0, 0.4);
    });
  };
  function respawn() {
    const P = G.P;
    P.hp = P.maxHp;
    const sp = P.savePoint;
    if (sp && sp.map !== 'overworld') {
      G.dun.load(sp.map);
      if (sp.room !== undefined) {
        const r = G.map.rooms.find(rr => rr.idx === sp.room);
        if (r) { G.player.x = sp.x; G.player.y = sp.y; G.dun.enterRoom(r.idx, true); }
      }
    } else if (sp) G.world.loadOverworld(sp.x, sp.y);
    else { const s = startPos(); G.world.loadOverworld(s.x, s.y); }
    G.state = 'play';
    G.restoreMusic();
  }

  // ------------------------------------------------------------------
  //  Novo jogo / continuar / título
  // ------------------------------------------------------------------
  function newGame() {
    G.P = G.newProgress();
    G.P.personagem = G.personagem;
    const s = startPos();
    G.world.loadOverworld(s.x, s.y);
    G.player.dir = 1;
    G.state = 'play';
    G.ui.clear();
    G.runScript(async () => {
      await G.wait(0.6);
      await G.ui.say('???', 'Sigma... Sigma! Acorde!');
      await G.wait(0.2);
      await G.NPCS.gauss({ name: 'Mestre Gauss' });
    });
  }
  function continueGame() {
    const s = G.loadSave();
    if (!s) { newGame(); return; }
    G.P = s;
    G.personagem = s.personagem === 'heroina' ? 'heroina' : 'heroi';
    G.ui.clear();
    const wasDead = s.hp <= 0;
    if (wasDead) s.hp = s.maxHp;
    const r = wasDead ? s.savePoint : s.resume;
    if (r && Number.isFinite(r.x) && Number.isFinite(r.y) && s.hp > 0
      && (r.map === 'overworld' || (G.DUNGEONS[r.map] && !(r.map === 'd6' && s.flags.won)))) {
      if (r.map === 'overworld') G.world.loadOverworld(r.x, r.y);
      else {
        G.dun.load(r.map);
        const room = G.map.rooms.find(room => room.idx === r.room);
        if (room) {
          G.player.x = r.x; G.player.y = r.y;
          G.player.lastSafe = { x: r.x, y: r.y };
          G.dun.enterRoom(room.idx, true);
          // A reset puzzle may put a block back where the player had stopped.
          const p = G.player;
          if (G.rectBlocked(p.x, p.y, p.w, p.h, p, { avoidHazard: true })) {
            let safe = null;
            for (let radius = 1; radius <= 24 && !safe; radius++) {
              for (let dy = -radius; dy <= radius && !safe; dy++) for (let dx = -radius; dx <= radius; dx++) {
                if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue;
                const x = r.x + dx * 8, y = r.y + dy * 8;
                if (G.dun.roomAt(x + p.w / 2, y + p.h / 2) !== room) continue;
                if (!G.rectBlocked(x, y, p.w, p.h, p, { avoidHazard: true })) { safe = { x, y }; break; }
              }
            }
            if (safe) { p.x = safe.x; p.y = safe.y; p.lastSafe = safe; }
          }
        }
      }
      G.player.dir = r.dir || 0;
    } else if (s.lastDungeon && G.DUNGEONS[s.lastDungeon] && !(s.lastDungeon === 'd6' && s.flags.won)) {
      G.dun.load(s.lastDungeon);
      const sp = s.savePoint;
      if (sp && sp.map === s.lastDungeon) { G.player.x = sp.x; G.player.y = sp.y; G.player.lastSafe = { x: sp.x, y: sp.y }; }
    } else {
      const pos = s.lastPos || (s.savePoint && s.savePoint.map === 'overworld' ? s.savePoint : startPos());
      G.world.loadOverworld(pos.x, pos.y);
    }
    G.state = 'play';
    G.saveGame();
    G.ui.toast('Jogo carregado. Bem-{vindo|vinda} de volta, Sigma!', '#7ae4ff');
  }
  // o título mostra o personagem do jogo salvo
  function personagemDoSave() { const s = G.hasSave() && G.loadSave(); G.personagem = s && s.personagem === 'heroina' ? 'heroina' : 'heroi'; }
  G.toTitle = () => { G.state = 'title'; G.titleT = 0; G.titleSel = 0; G.ui.clear(); G.cutscene = 0; G.music('title'); personagemDoSave(); };

  // ------------------------------------------------------------------
  //  Introdução (história)
  // ------------------------------------------------------------------
  const INTRO = [
    { t: 'Há muito tempo, o reino de ^yDatália^0 vivia em harmonia.\nSeis ^pCristais da Razão^0 guiavam seu povo: Média, Mediana, Dispersão, Acaso, Distribuição e Amostra.', art: 'crystals' },
    { t: 'Com eles, as pessoas entendiam os números do mundo: dividiam colheitas com justiça, previam as chuvas e não caíam em boatos.', art: 'village' },
    { t: 'Até que o feiticeiro ^rViés, o Distorcedor^0, roubou os cristais e os escondeu em templos guardados por monstros.', art: 'vies' },
    { t: '^r"Os números dizem o que EU quiser!"^0, gargalhou Viés, mostrando ao povo só os dados que lhe convinham e escondendo todo o resto.', art: 'vies2' },
    { t: 'Sem os cristais, a confusão tomou conta. "Todo mundo pensa assim!", gritavam, depois de perguntar a três amigos...', art: 'confusion' },
    { t: 'Agora, só {um|uma} jovem aprendiz do sábio ^yMestre Gauss^0 pode restaurar o equilíbrio.\nSeu nome é ^cSIGMA^0.', art: 'hero' }
  ];
  function drawIntroArt(ctx, art, t) {
    const cx = W / 2, cy = 70;
    if (art === 'crystals') {
      ['media', 'mediana', 'dispersao', 'prob', 'distrib', 'amostra'].forEach((c, i) => {
        const a = t * 0.6 + i * Math.PI / 3;
        const x = cx + Math.cos(a) * 60, y = cy + Math.sin(a) * 22;
        ctx.fillStyle = 'rgba(255,255,255,' + (0.06 + 0.05 * Math.sin(t * 4 + i)) + ')'; G.ell(ctx, x, y, 11, 11, ctx.fillStyle);
        G.draw(ctx, 'crystal_' + c, x - 8, y - 8);
      });
    } else if (art === 'village') {
      G.draw(ctx, G.structs.house_red, cx - 90, cy - 30); G.draw(ctx, G.structs.house_gauss, cx - 32, cy - 34); G.draw(ctx, G.structs.house_blue, cx + 42, cy - 30);
      G.draw(ctx, 'villager1_down' + (Math.floor(t * 2) % 2), cx - 50, cy + 18); G.draw(ctx, 'kid2_down' + (Math.floor(t * 2) % 2), cx + 20, cy + 18);
    } else if (art === 'vies') {
      ctx.fillStyle = 'rgba(160,40,200,' + (0.2 + 0.1 * Math.sin(t * 4)) + ')'; ctx.fillRect(cx - 40, cy - 50, 80, 90);
      G.drawVies(ctx, cx, cy + 34, t, false, true, 1);
      ['media', 'mediana', 'dispersao'].forEach((c, i) => G.draw(ctx, 'crystal_' + c, cx - 70 + i * 10 + Math.sin(t * 3 + i) * 3, cy - 20 + i * 12, { alpha: 0.7 }));
      ['prob', 'distrib', 'amostra'].forEach((c, i) => G.draw(ctx, 'crystal_' + c, cx + 50 + i * 10 + Math.sin(t * 3 + i) * 3, cy - 20 + i * 12, { alpha: 0.7 }));
    } else if (art === 'confusion') {
      for (let i = 0; i < 5; i++) {
        const x = cx - 100 + i * 50, y = cy + 10 + Math.sin(t * 3 + i) * 3;
        G.draw(ctx, ['villager1', 'villager2', 'kid1', 'mendel', 'kid2'][i] + '_down0', x - 8, y);
        G.text(['?', '!?', '50%?', '??', 'média?'][i], x, y - 12, '#ffd84a', { align: 'center' });
      }
    } else if (art === 'vies2' && G.introArt) { G.introArt.vies2(ctx, cx, cy, t);
    } else if (art === 'hero') {
      ctx.fillStyle = 'rgba(122,228,255,0.15)'; ctx.fillRect(cx - 30, cy - 30, 60, 70);
      const s = G.spr[G.spriteHeroi(false) + '_down' + (Math.floor(t * 10) % 8)];
      G.drawFit(ctx, s, cx - 24, cy - 24, 48, 48);
      G.draw(ctx, 'gauss_down0', cx + 40, cy + 8);
    }
  }

  // ------------------------------------------------------------------
  //  Final
  // ------------------------------------------------------------------
  G.finalVictory = async () => {
    const P = G.P;
    G.music(null);
    await G.wait(1);
    await G.ui.say('Viés', 'Impossível... Uma amostra tão pequena quanto você... derrotou o grande Viés...', { portrait: 'viesNPC_down0' });
    await G.ui.say('Viés', 'Talvez... os dados sejam mais fortes do que as distorções...', { portrait: 'viesNPC_down0' });
    if (!P.crystals.includes('amostra')) P.crystals.push('amostra');
    G.sfx('crystal');
    await G.ui.banner('crystal_amostra', 'CRISTAL DA AMOSTRA!', 'Os seis Cristais da Razão foram recuperados! O equilíbrio volta ao reino de Datália.', { color: '#ff9ae6' });
    P.flags.won = true;
    P.flags.endTime = P.playTime;
    G.saveGame();
    await G.ui.fade(1, 1.2);
    G.state = 'ending'; G.endT = 0;
    G.music('ending');
    await G.ui.fade(0, 1);
  };
  // relatório do estatístico nos créditos: pontos fortes e o que revisar
  function reportLines() {
    if (!G.topicReport) return [];
    const R = G.topicReport(); if (!R.rows.length) return [];
    const L = [['^cRELATÓRIO DO ESTATÍSTICO^0', 1]];
    for (const r of R.rows.slice(0, 8)) L.push([r.name + ': ' + r.c + '/' + r.t + ' (' + Math.round(r.p * 100) + '%)', 0]);
    if (R.strong.length) L.push(['Pontos fortes: ' + R.strong.map(r => r.name).join(', '), 0]);
    L.push([R.weak.length ? 'Para revisar: ' + R.weak.map(r => r.name).join(', ') : 'Nenhum assunto fraco. Que estatístico!', 0]);
    L.push(['', 1]);
    return L;
  }
  function endingLines() {
    const P = G.P, d = P.stats.dmg, st = G.st;
    const qz = P.stats.quiz; let c = 0, t = 0; for (const k in qz) { c += qz[k].c; t += qz[k].t; }
    const L = [
      ['^yA LENDA DE SIGMA^0', 2], ['O Reino dos Dados', 1], ['', 1],
      ['Com os seis Cristais da Razão de volta,', 0], ['o povo de Datália voltou a entender os números.', 0], ['', 0],
      ['Os mercadores calcularam médias justas.', 0], ['Os fazendeiros mediram a variação das colheitas.', 0], ['As pesquisas passaram a usar amostras aleatórias.', 0], ['E ninguém mais confundiu correlação com causalidade!', 0]].concat(P.flags.vicente ? [['', 0], ['Vicente voltou a estudar com o Mestre Gauss,', 0], ['desta vez olhando TODOS os dados.', 0]] : []).concat(P.flags.boss_d7 ? [['O Observatório da Inferência voltou a brilhar', 0], ['e o reino aprendeu a tirar conclusões dos dados.', 0]] : []).concat([['', 1],
      ['^cSUAS ESTATÍSTICAS FINAIS^0', 1],
      ['Tempo de jogo: ' + G.fmtTime(P.playTime), 0],
      ['Nível alcançado: ' + P.level, 0],
      ['Inimigos derrotados: ' + P.stats.kills, 0],
      ['Moedas coletadas: ' + P.stats.coinsTotal, 0],
      ['Desafios acertados: ' + c + ' de ' + t + (t ? ' (' + Math.round(c / t * 100) + '%)' : ''), 0],
      ['Golpes (n): ' + d.length + '   dano médio: ' + (d.length ? G.fmt(st.mean(d), 2) : '-'), 0],
      ['Mediana do dano: ' + (d.length ? G.fmt(st.median(d), 1) : '-') + '   desvio padrão: ' + (d.length ? G.fmt(st.std(d), 2) : '-'), 0],
      ['Lições aprendidas: ' + P.lessons.length + '/' + G.LESSON_ORDER.length, 0],
      ['Missões concluídas: ' + (G.QUEST_ORDER ? G.QUEST_ORDER.filter(id => G.quest.done(id)).length + '/' + G.QUEST_ORDER.length : '-'), 0],
      ['Itens e segredos: ' + G.completion() + '%', 0], ['', 1]]).concat(reportLines()).concat([
      ['^yHOMENAGENS^0', 1],
      ['Gauss · Pascal · Bernoulli · Bayes · Laplace', 0], ['Galton · Fisher · Neyman · Quetelet', 0], ['Florence Nightingale · Gregor Mendel', 0], ['John Tukey · Gertrude Cox · Muriel Bristol', 0], ['', 1],
      ['Inspirado nas grandes aventuras de', 0], ['exploração, plataforma e ação dos anos 90.', 0], ['', 0],
      ['Toda a arte, música e código foram', 0], ['gerados proceduralmente para este jogo.', 0], ['', 1],
      ['^gOBRIGADO POR JOGAR!^0', 2], ['', 0], ['Continue praticando: a Estatística está em todo lugar.', 0]
    ]);
    return L;
  }

  // ------------------------------------------------------------------
  //  Atualização
  // ------------------------------------------------------------------
  function updatePlay(dt) {
    const P = G.P;
    P.playTime += dt;
    if (G.ground) G.ground.idle(); // pré-monta o chão vizinho em fatias de ~2,5 ms
    if (G.trans) { G.dun.updateTrans(dt); G.fx.update(dt); return; }
    if (G.hitStop > 0) { G.hitStop -= dt; G.fx.update(dt * 0.25); return; }
    const frozen = G.ui.blocking() || G.cutscene > 0;
    if (!frozen) {
      for (let i = 0; i < G.ents.length; i++) {
        const e = G.ents[i];
        if (e.dead) continue;
        if (!G.sameRoom(e) && e !== G.player) continue;
        e.update(dt);
      }
      for (let i = G.ents.length - 1; i >= 0; i--) if (G.ents[i].dead) G.ents.splice(i, 1);
      if (G.map.kind === 'overworld') G.world.update(dt); else G.dun.update(dt);
      // câmera
      const p = G.player;
      if (G.map.kind === 'overworld') {
        const tx = G.clamp(p.cx - W / 2, 0, G.map.w * 16 - W), ty = G.clamp(p.cy - 8 - H / 2, 0, G.map.h * 16 - H);
        G.cam.x = tx; G.cam.y = ty;
      }
      G.ui.updateHUD(dt);
      if (G.player) G.weather.update(dt, G.map.kind === 'dungeon' ? G.map.theme : G.world.regionAt(G.player.cx, G.player.cy), G.cam);
    } else {
      // animações leves durante cenas
      for (const e of G.ents) if (e instanceof G.Pickup || e instanceof G.PopCoin || e.alwaysUpdate) { if (!G.ui.blocking()) e.update(dt); }
      if (G.player && (G.player.state === 'hold' || G.player.state === 'pipe')) G.player.t += dt;
    }
    G.fx.update(dt);
    if (G.shakeT > 0) { G.shakeT -= dt; if (G.shakeT <= 0) G.shakeMag = 0; }
    if (G.flashT > 0) G.flashT -= dt;
  }
  function update(dt) {
    G.time += dt; G.frame++;
    G.updateWaits(dt);
    G.input.poll();
    switch (G.state) {
      case 'boot':
        if (G.input.anyHit) { G.audio.init(); G.toTitle(); }
        break;
      case 'title': {
        G.titleT += dt;
        const has = G.hasSave();
        const opts = has ? ['Continuar', 'Novo Jogo', 'Controles'] : ['Novo Jogo', 'Controles'];
        if (G.ui.blocking()) { G.ui.update(dt); break; }
        if (G.input.pressed('up')) { G.titleSel = (G.titleSel + opts.length - 1) % opts.length; G.sfx('select'); }
        if (G.input.pressed('down')) { G.titleSel = (G.titleSel + 1) % opts.length; G.sfx('select'); }
        if (G.input.pressed('confirm') && G.titleT > 0.4) {
          const o = opts[G.titleSel];
          G.sfx('confirm');
          if (o === 'Continuar') { G.ui.fade(1, 0.4).then(() => { continueGame(); G.ui.fade(0, 0.5); }); G.state = 'loading'; }
          else if (o === 'Novo Jogo') {
            if (has) { G.ui.choose(['Não, voltar', 'Sim, apagar o jogo salvo'], { prompt: 'Começar um NOVO jogo apaga o progresso salvo. Tem certeza?', cancel: 0 }).then(r => { if (r === 1) abrirEscolha(true); }); }
            else abrirEscolha(false);
          } else G.ui.controls();
        }
        G.ui.update(dt);
        break;
      }
      case 'escolha': {
        G.escolhaT += dt;
        if (G.input.pressed('left') || G.input.pressed('right')) { G.escolhaSel = 1 - G.escolhaSel; G.sfx('select'); }
        if (G.input.pressed('confirm') && G.escolhaT > 0.3) {
          G.sfx('confirm');
          G.personagem = G.escolhaSel ? 'heroina' : 'heroi';
          // o save só é apagado aqui: voltar desta tela ainda preserva o jogo salvo
          if (G.escolhaApagar) { try { G.storage.removeItem(SAVE_KEY); } catch (e) { } }
          startIntro();
        } else if (G.input.pressed('cancel')) { G.sfx('cancel'); G.toTitle(); G.titleSel = G.hasSave() ? 1 : 0; }
        G.ui.update(dt);
        break;
      }
      case 'loading': G.ui.update(dt); break;
      case 'intro': {
        G.introT += dt;
        const pg = INTRO[G.introPage];
        const len = G.visLen(G.genero(pg.t));
        if (G.input.pressed('start')) { G.introPage = INTRO.length; }
        else if (G.input.pressed('confirm')) {
          if (G.introT * 50 < len) G.introT = len / 50 + 0.01;
          else { G.introPage++; G.introT = 0; G.sfx('select'); }
        }
        if (G.introPage >= INTRO.length) { G.state = 'loading'; G.ui.fade(1, 0.5).then(() => { newGame(); G.ui.fade(0, 0.6); }); }
        G.ui.update(dt);
        break;
      }
      case 'play':
        updatePlay(dt);
        G.ui.update(dt);
        break;
      case 'gameover': {
        G.goT += dt;
        if (G.input.pressed('up') || G.input.pressed('down')) { G.goSel = 1 - G.goSel; G.sfx('select'); }
        if (G.input.pressed('confirm') && G.goT > 1) {
          G.sfx('confirm');
          if (G.goSel === 0) { G.state = 'loading'; G.ui.fade(1, 0.3).then(() => { respawn(); G.ui.fade(0, 0.5); }); }
          else { G.saveGame(); G.toTitle(); }
        }
        G.ui.update(dt);
        break;
      }
      case 'ending':
        G.endT += dt;
        // depois dos créditos vem a cena do gancho para "A Lenda de Sigma 2" (js/amanha.js)
        if (G.endT > 8 && G.input.pressed('confirm') && G.endT > G.endLen) { if (G.ganchoInicio) G.ganchoInicio(); else G.toTitle(); }
        if (G.input.pressed('start')) G.endT += 6;
        G.ui.update(dt);
        break;
      case 'gancho':
        if (G.ganchoUpdate) G.ganchoUpdate(dt);
        G.ui.update(dt);
        break;
    }
    G.audio.tick();
    G.input.endFrame();
  }
  function startIntro() { G.state = 'intro'; G.introPage = 0; G.introT = 0; G.music('title'); }
  function abrirEscolha(apagarSave) { G.state = 'escolha'; G.escolhaT = 0; G.escolhaSel = 0; G.escolhaApagar = apagarSave; }

  // ------------------------------------------------------------------
  //  Renderização
  // ------------------------------------------------------------------
  function drawWorld(ctx) {
    const cam = G.cam;
    let sx = 0, sy = 0;
    if (G.shakeT > 0) { sx = G.rf(-G.shakeMag, G.shakeMag) | 0; sy = G.rf(-G.shakeMag, G.shakeMag) | 0; }
    const cx = Math.round(cam.x) + sx, cy = Math.round(cam.y) + sy;
    const c = { x: cx, y: cy };
    G.light.begin();
    ctx.fillStyle = '#050308'; ctx.fillRect(0, 0, W, H);
    const m = G.map;
    if (G.ground.map !== m) G.ground.reset(m);
    G.ground.draw(ctx, cx, cy);
    // entidades e objetos altos (árvores, colunas) ordenados pela base
    const list = [];
    for (const e of G.ents) {
      if (e.dead) continue;
      if (!G.sameRoom(e) && e !== G.player && !G.trans) continue;
      if (e.x > cx + W + 64 || e.x + e.w < cx - 64 || e.y > cy + H + 96 || e.y + e.h < cy - 64) continue;
      list.push(e);
    }
    G.tiles.tallList(m, cx, cy, list);
    list.sort((a, b) => a.by - b.by);
    const late = [];
    for (const e of list) { if (e.tall) drawTall(ctx, e, e.x - cx, e.y - cy); else if (e.late) late.push(e); else { e.draw(ctx, c); if (e.drawLate) late.push(e); } }
    G.fx.draw(ctx, c);
    if (m.kind === 'overworld') cloudShadows(ctx, c);
    // luz e clima
    sceneLighting(m, cx, cy);
    G.weather.addLights(c);
    G.light.render(ctx);
    for (const e of late) { if (e.late) e.draw(ctx, c); else e.drawLate(ctx, c); }
    G.weather.draw(ctx, c);
    if (G.player && G.player.cold) { ctx.fillStyle = 'rgba(200,230,255,' + (0.08 + 0.04 * Math.sin(G.time * 2)) + ')'; ctx.fillRect(0, 0, W, H); }
    G.light.vignette(ctx, m.kind === 'dungeon' ? 1 : 0.7);
    if (m.kind === 'dungeon') { ctx.fillStyle = '#050308'; ctx.fillRect(0, 0, W, 8); }
    if (G.P && G.player && G.P.hp > 0 && G.P.hp <= Math.max(2, G.P.maxHp * 0.25) && G.player.state !== 'dead') {
      const a = 0.22 + 0.14 * Math.sin(G.time * 6);
      const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.62); g.addColorStop(0, 'rgba(255,0,40,0)'); g.addColorStop(1, 'rgba(200,0,30,' + a + ')');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    if (G.flashT > 0) { ctx.globalAlpha = (G.flashA || 0.8) * G.flashT / G.flashMax; ctx.fillStyle = G.flashColor; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
    // barra do chefe
    const B = G.boss;
    if (B && !B.dead && G.sameRoom(B) && !G.ui.bossIntro) {
      const bw = 220, bx = (W - bw) / 2, by = H - 18;
      G.panel(ctx, bx - 6, by - 12, bw + 12, 24, { r: 4, thin: true, corners: false, bgTop: '#3a1a2a', bg: '#140810', border: B.enrage > 0 ? '#ff6a5a' : '#c8a060' });
      G.text((B.isMini ? 'MINI-CHEFE · ' : '') + B.name + (B.enrage > 0 ? ' · ENFURECIDO' : ''), W / 2, by - 8.5, B.enrage > 0 ? '#ff8a7a' : '#ffffff', { align: 'center', shadow: false });
      const k = Math.max(0, B.hp) / B.maxHp;
      B._shownHp = B._shownHp === undefined ? k : G.approach(B._shownHp, k, 0.006);
      ctx.save(); ctx.fillStyle = '#0a0408'; G.rrPath(ctx, bx - 0.5, by + 1.5, bw + 1, 6, 3); ctx.fill();
      ctx.fillStyle = '#ffe0a0'; G.rrPath(ctx, bx, by + 2, bw * B._shownHp, 5, 2.5); ctx.fill();
      const gr = ctx.createLinearGradient(0, by + 2, 0, by + 7); gr.addColorStop(0, '#ff7a8a'); gr.addColorStop(1, '#c01a3a');
      ctx.fillStyle = gr; G.rrPath(ctx, bx, by + 2, Math.max(5, bw * k), 5, 2.5); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(bx + 2, by + 2.5, Math.max(0, bw * k - 4), 0.5);
      for (const th of (B.thresholds || [])) { ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.moveTo(bx + bw * th, by + 0.5); ctx.lineTo(bx + bw * th + 2, by + 4.5); ctx.lineTo(bx + bw * th, by + 8.5); ctx.lineTo(bx + bw * th - 2, by + 4.5); ctx.closePath(); ctx.fill(); }
      ctx.restore();
    }
  }
  // árvores do mapa aberto: a copa balança com o vento (fatias deslocadas; o tronco fica parado)
  function drawTall(ctx, e, x, y) {
    const s = typeof e.spr === 'string' ? G.spr[e.spr] : e.spr;
    if (!s) return;
    const w = G.lw(s), h = G.lh(s);
    if (h < 24 || G.map.kind !== 'overworld') { G.draw(ctx, s, x, y, e.flip ? { flip: true } : undefined); return; }
    const ph = G.time * 1.6 + e.x * 0.05 + e.y * 0.03, amp = 0.8 + 0.5 * Math.sin(G.time * 0.4 + e.x * 0.01), k = s.width / w;
    const top = Math.round(h * 0.6), N = 4, bh = top / N;
    ctx.save();
    if (e.flip) { ctx.translate(G.snap(x) + w, G.snap(y)); ctx.scale(-1, 1); x = 0; y = 0; } else { x = G.snap(x); y = G.snap(y); }
    for (let i = 0; i < N; i++) { const off = Math.round(Math.sin(ph) * amp * (1 - i / N) * 2) / 2 * (e.flip ? -1 : 1); ctx.drawImage(s, 0, i * bh * k, s.width, bh * k + 1, x + off, y + i * bh, w, bh + 0.5); }
    ctx.drawImage(s, 0, top * k, s.width, (h - top) * k, x, y + top, w, h - top);
    ctx.restore();
  }
  // sombras de nuvens atravessando o mapa aberto (presas ao mundo, andam com o vento)
  function cloudShadows(ctx, c) {
    ctx.save();
    for (let i = 0; i < 4; i++) {
      const sx = ((i * 173 + G.time * 7 - c.x) % (W + 260) + W + 260) % (W + 260) - 130, sy = ((i * 97 + G.time * 2.5 - c.y) % (H + 180) + H + 180) % (H + 180) - 90;
      ctx.save(); ctx.translate(sx, sy); ctx.scale(1, 0.55); G.glow(ctx, 0, 0, 70 + (i % 2) * 25, '#0a1020', 0.16); ctx.restore();
    }
    ctx.restore();
  }
  // ambiente de luz por região/sala
  const REGION_AMB = { floresta: '#c4d4bc', pantano: '#a8b8a4', vulcao: '#d8a890', castelo: '#9a8ab4' };
  let ambCur = null;
  function sceneLighting(m, cx, cy) {
    let target = null;
    const p = G.player;
    if (m.kind === 'dungeon') {
      const r = m.rooms && m.rooms.find(rr => rr.idx === G.curRoom);
      const th = G.THEMES[m.theme] || {};
      target = r && r.dark ? '#0c0a18' : r && r.shrine ? G.col.mix(th.amb || '#c0c0d0', '#1a1430', 0.5) : (th.amb || '#c0c0d0');
      if (p) G.light.add(p.cx - cx, p.cy - 8 - cy - p.z, r && r.dark ? 74 + Math.sin(G.time * 8) * 2 : 58, '#fff0d8', r && r.dark ? 1 : 0.35);
      if (r && r.dark) {
        for (const e of G.ents) {
          if (e.dead || !G.sameRoom(e)) continue;
          if (e.darkGlow) G.light.add(e.cx - cx, e.cy - 8 - cy, e.darkGlow, '#c8d8ff', 0.75);
        }
      }
    } else if (p) {
      target = REGION_AMB[G.world.regionAt(p.cx, p.cy)] || null;
    }
    // transição suave do ambiente
    if (target === null && ambCur === null) G.light.ambient = null;
    else {
      const t0 = ambCur || '#ffffff', t1 = target || '#ffffff';
      ambCur = G.col.mix(t0, t1, 0.08);
      if (!target && G.col.parse(ambCur)[0] > 250 && G.col.parse(ambCur)[1] > 250 && G.col.parse(ambCur)[2] > 250) ambCur = null;
      G.light.ambient = ambCur;
    }
    // lava brilha
    const at = G.ground.animTiles; let n = 0;
    if (at && at.size) {
      const tx0 = Math.floor(cx / 16) - 2, ty0 = Math.floor(cy / 16) - 2, tx1 = tx0 + 28, ty1 = ty0 + 18;
      for (let ty = ty0; ty <= ty1 && n < 90; ty++) for (let tx = tx0; tx <= tx1 && n < 90; tx++) {
        if (at.get(ty * m.w + tx) === G.T.LAVA && ((tx + ty) & 1) === 0) { n++; G.light.add(tx * 16 + 8 - cx, ty * 16 + 8 - cy, 40, '#ff7a2a', 0.6 + 0.12 * Math.sin(G.time * 3 + tx)); }
      }
    }
  }
  G.resetAmbient = () => { ambCur = null; };

  // camadas do fundo do título (pré-renderizadas)
  let titleLayers = null;
  function buildTitleLayers() {
    const mk = (draw) => { const c = G.canvas(W * 2, H * 2), x = c.getContext('2d'); x.scale(2, 2); draw(x); c.lw = W; c.lh = H; return c; };
    const L = {};
    // montanhas distantes em forma de sino
    L.far = mk(x => {
      for (const [cx, sd, hh, col] of [[90, 46, 92, '#3a2a6a'], [270, 60, 110, '#34266a'], [380, 40, 70, '#3a2a6a']]) {
        x.fillStyle = col; x.beginPath(); x.moveTo(0, H);
        for (let px = 0; px <= W; px += 2) { const z = (px - cx) / sd; x.lineTo(px, H - 60 - hh * Math.exp(-z * z / 2)); }
        x.lineTo(W, H); x.closePath(); x.fill();
      }
      x.fillStyle = 'rgba(255,200,255,0.10)';
      for (let px = 0; px <= W; px += 2) { const z = (px - 270) / 60; const y = H - 60 - 110 * Math.exp(-z * z / 2); x.fillRect(px, y, 2, 1); }
      // castelo
      x.fillStyle = '#24185a';
      x.fillRect(304, 96, 30, 24); x.fillRect(300, 88, 7, 32); x.fillRect(331, 88, 7, 32); x.fillRect(314, 80, 10, 40);
      x.beginPath(); x.moveTo(312, 80); x.lineTo(319, 68); x.lineTo(326, 80); x.fill();
      x.beginPath(); x.moveTo(299, 88); x.lineTo(303.5, 81); x.lineTo(308, 88); x.fill(); x.beginPath(); x.moveTo(330, 88); x.lineTo(334.5, 81); x.lineTo(339, 88); x.fill();
      for (let i = 0; i < 4; i++) x.fillRect(305 + i * 8, 93, 4, 3);
      x.fillStyle = '#ff7ab8'; x.fillRect(318, 86, 2, 3); x.fillRect(302.5, 96, 1.5, 2); x.fillRect(334, 96, 1.5, 2);
    });
    // colinas com árvores
    L.mid = mk(x => {
      x.fillStyle = '#1c3a3a'; x.beginPath(); x.moveTo(0, H);
      for (let px = 0; px <= W; px += 2) x.lineTo(px, H - 50 - Math.sin(px * 0.018) * 10 - Math.sin(px * 0.05 + 1) * 4);
      x.lineTo(W, H); x.closePath(); x.fill();
      for (let i = 0; i < 22; i++) {
        const px = i * 18 + (i % 3) * 5, py = H - 50 - Math.sin(px * 0.018) * 10 - Math.sin(px * 0.05 + 1) * 4;
        const s = G.tiles.treeSprite(i % 4 === 0 ? 'floresta' : 'vila', i % 3);
        x.save(); x.globalAlpha = 0.85; x.filter = 'brightness(0.45) saturate(0.7) hue-rotate(20deg)'; x.drawImage(s, px - 16, py - 30, 32, 36); x.restore();
      }
    });
    L.near = mk(x => {
      const gr = x.createLinearGradient(0, H - 40, 0, H);
      gr.addColorStop(0, '#2a5a3a'); gr.addColorStop(1, '#14301e');
      x.fillStyle = gr; x.beginPath(); x.moveTo(0, H);
      for (let px = 0; px <= W; px += 2) x.lineTo(px, H - 30 - Math.sin(px * 0.012 + 2) * 8);
      x.lineTo(W, H); x.closePath(); x.fill();
      for (let i = 0; i < 160; i++) { const px = G.hsh(i, 5) * W, py = H - 28 - Math.sin(px * 0.012 + 2) * 8 + G.hsh(i, 6) * 26; x.fillStyle = G.hsh(i, 7) > 0.5 ? '#3a7a4a' : '#20482c'; x.fillRect(px, py, 1, 2.5); }
      for (let i = 0; i < 14; i++) { const px = G.hsh(i, 8) * W, py = H - 18 + G.hsh(i, 9) * 14; x.fillStyle = ['#ff8ab0', '#ffe07a', '#ffffff'][i % 3]; x.fillRect(px, py, 1.5, 1.5); }
    });
    return L;
  }
  function drawTitle(ctx) {
    const t = G.titleT || 0;
    drawTitleBg(ctx, t);
    // cristais orbitando o título
    ['media', 'mediana', 'dispersao', 'prob', 'distrib', 'amostra'].forEach((c, i) => {
      const an = t * 0.5 + i * Math.PI / 3, depth = Math.sin(an);
      const x = W / 2 + Math.cos(an) * 150, y = 58 + depth * 14;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, x, y, 12, '#ffffff', 0.2 + 0.15 * (depth + 1)); ctx.restore();
      G.draw(ctx, 'crystal_' + c, x - 8, y - 8, { alpha: 0.55 + 0.45 * (depth + 1) / 2 });
    });
    // logo
    G.textBig('A LENDA DE', W / 2, 22, '#d8d8ff', { align: 'center', scale: 2, gradient: ['#ffffff', '#a8a8f0'], outline: '#1a0a3a' });
    const sh = (t * 0.6) % 3;
    G.textBig('SIGMA', W / 2, 40, '#ffd84a', { align: 'center', scale: 4, gradient: ['#fff6c0', '#e89a20'], outline: '#5a2a08', shadowColor: 'rgba(0,0,0,0.7)' });
    if (sh < 1) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const sx = W / 2 - 70 + sh * 140; const gr = ctx.createLinearGradient(sx - 10, 0, sx + 10, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gr; ctx.fillRect(sx - 10, 36, 20, 34); ctx.restore(); }
    G.text('— O REINO DOS DADOS —', W / 2, 79, '#ff9ae6', { align: 'center', outline: '#2a0a2a' });
    G.text('Uma aventura para aprender Estatística', W / 2, 91, '#c8c0e8', { align: 'center' });
    // personagem do jogo salvo no morro
    const hs = G.spr[G.spriteHeroi(false) + ((t % 3.6) < 0.12 ? '_down_blink' : '_down_idle' + (Math.floor(t * 1.4) % 2))] || G.spr[G.spriteHeroi(false) + '_down_stand']; // respira e pisca
    G.shadow(ctx, 70, H - 32, 20, 0.35);
    if (hs) G.drawFit(ctx, hs, 46, H - 86, 48, 56);
    if (G.state === 'boot') {
      if (Math.floor(t * 2) % 2 === 0) G.text(G.touch && G.touch.on ? 'TOQUE NA TELA PARA COMEÇAR' : 'PRESSIONE QUALQUER TECLA', W / 2, 128, '#ffffff', { align: 'center', outline: '#1a0a3a' });
    } else {
      const opts = G.hasSave() ? ['Continuar', 'Novo Jogo', 'Controles'] : ['Novo Jogo', 'Controles'];
      const pw = 120, ph = opts.length * 13 + 10, px = W / 2 - pw / 2, py = 106;
      G.panel(ctx, px, py, pw, ph, { r: 4 });
      opts.forEach((o, i) => {
        const sel = i === G.titleSel, y = py + 6 + i * 13;
        if (sel) { G.selBar(ctx, px + 5, y - 1.5, pw - 10, 11, t); G.draw(ctx, 'cursor', px + 9 + Math.sin(t * 8) * 0.8, y); }
        G.text(o, W / 2 + 4, y, sel ? '#ffe27a' : '#e0e0f0', { align: 'center' });
      });
    }
    G.text('X: confirmar   Setas: mover   F: tela cheia', W / 2, H - 10, '#c8c0d8', { align: 'center', outline: '#14301e' });
  }
  // tela de escolha do personagem (depois de Novo Jogo)
  const ESCOLHAS = [{ id: 'heroi', nome: 'HERÓI', cor: '#7ae4ff' }, { id: 'heroina', nome: 'HEROÍNA', cor: '#ff9ae6' }];
  function drawEscolha(ctx) {
    const t = G.escolhaT || 0;
    drawTitleBg(ctx, G.titleT + t);
    ctx.fillStyle = 'rgba(8,4,24,0.45)'; ctx.fillRect(0, 0, W, H);
    G.textBig('ESCOLHA SEU PERSONAGEM', W / 2, 14, '#ffd84a', { align: 'center', scale: 2, gradient: ['#fff6c0', '#e89a20'], outline: '#5a2a08', shadowColor: 'rgba(0,0,0,0.7)' });
    G.text('Quem vai recuperar os Cristais da Razão?', W / 2, 36, '#c8c0e8', { align: 'center', outline: '#1a0a3a' });
    ESCOLHAS.forEach((e, i) => {
      const sel = i === G.escolhaSel, cw = 112, ch = 128, cx = W / 2 + (i ? 66 : -66), x = cx - cw / 2, y = 50;
      ctx.globalAlpha = sel ? 1 : 0.7;
      if (sel) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, cx, y + 58, 62, e.cor, 0.22 + 0.06 * Math.sin(t * 4)); ctx.restore(); }
      G.panel(ctx, x, y + (sel ? -2 : 0), cw, ch, { r: 5, border: sel ? '#ffd84a' : '#5a5690' });
      // personagem: o escolhido caminha, o outro fica parado
      const base = e.id === 'heroina' ? 'heroina' : 'hero';
      const s = G.spr[base + (sel ? '_down' + (Math.floor(t * 12) % 8) : '_down_idle' + (Math.floor(t * 1.4) % 2))];
      G.shadow(ctx, cx, y + 92, 22, 0.4);
      if (s) G.drawFit(ctx, s, cx - 24, y + 30 + (sel ? -2 : 0), 48, 56);
      G.text(e.nome, cx, y + 102, sel ? '#ffe27a' : '#e0e0f0', { align: 'center' });
      G.text('Sigma', cx, y + 113, sel ? e.cor : '#9a98b0', { align: 'center' });
      if (sel) G.draw(ctx, 'cursor', x + 8 + Math.sin(t * 8) * 0.8, y + 100);
      ctx.globalAlpha = 1;
    });
    G.text(G.touch && G.touch.on ? 'Direcional: escolher   Toque: confirmar' : '← →: escolher   X: confirmar   Z: voltar', W / 2, H - 10, '#c8c0d8', { align: 'center', outline: '#14301e' });
  }
  // céu, montanhas, colinas e vaga-lumes do título (também usados na escolha)
  function drawTitleBg(ctx, t) {
    if (!titleLayers) titleLayers = buildTitleLayers();
    // céu
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#070420'); g.addColorStop(0.45, '#22145a'); g.addColorStop(0.75, '#6a2a7a'); g.addColorStop(1, '#c86a7a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 90; i++) {
      const x = (G.hash2(i, 1, 3) * W + t * (1 + i % 3) * 0.5) % W, y = G.hash2(i, 2, 3) * 120;
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * (1 + i % 5) * 0.7 + i));
      ctx.globalAlpha = tw; ctx.fillStyle = i % 9 ? '#ffffff' : '#ffd84a'; ctx.fillRect(G.snap(x), G.snap(y), i % 13 ? 0.5 : 1, i % 13 ? 0.5 : 1);
    }
    ctx.globalAlpha = 1;
    // estrela cadente a cada poucos segundos
    { const per = 4.5, k = (t % per) / 0.7, n = Math.floor(t / per); if (k < 1) { const sx = 120 + G.hash2(n, 3, 1) * 220, sy = 8 + G.hash2(n, 4, 1) * 40, ex = sx - 60 * k, ey = sy + 26 * k; const g2 = ctx.createLinearGradient(ex, ey, ex + 18, ey - 8); g2.addColorStop(0, 'rgba(255,255,255,' + (1 - k) + ')'); g2.addColorStop(1, 'rgba(255,255,255,0)'); ctx.strokeStyle = g2; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex + 18, ey - 8); ctx.stroke(); } }
    // lua
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, 70, 44, 40, '#ffe8c0', 0.35); ctx.restore();
    ctx.fillStyle = '#fff4dc'; ctx.beginPath(); ctx.arc(70, 44, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8d8c0'; ctx.beginPath(); ctx.arc(66, 41, 2.5, 0, Math.PI * 2); ctx.arc(74, 48, 1.8, 0, Math.PI * 2); ctx.fill();
    // nuvens
    ctx.fillStyle = 'rgba(255,200,230,0.16)';
    for (let i = 0; i < 6; i++) { const cx = ((i * 97 + t * (4 + i)) % (W + 120)) - 60, cy = 30 + i * 13; ctx.beginPath(); ctx.ellipse(cx, cy, 34, 6, 0, 0, Math.PI * 2); ctx.ellipse(cx + 18, cy - 3, 20, 5, 0, 0, Math.PI * 2); ctx.fill(); }
    const par = (img, k) => { const ox = (Math.sin(t * 0.15) * 6) * k; ctx.drawImage(img, ox - 4, 0, W + 8, H); };
    par(titleLayers.far, 0.3); par(titleLayers.mid, 0.6); par(titleLayers.near, 1);
    // vaga-lumes
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 12; i++) { const x = (G.hash2(i, 7, 1) * W + Math.sin(t * 0.7 + i) * 14), y = H - 40 + Math.cos(t * 0.9 + i * 2) * 14 - G.hash2(i, 8, 1) * 20; G.glow(ctx, x, y, 4, '#d8ff7a', 0.6 + 0.4 * Math.sin(t * 3 + i)); }
    ctx.restore();
  }
  function drawIntro(ctx) {
    ctx.fillStyle = '#05030c'; ctx.fillRect(0, 0, W, H);
    const pg = INTRO[Math.min(G.introPage, INTRO.length - 1)];
    drawIntroArt(ctx, pg.art, G.time);
    const lines = G.wrap(G.genero(pg.t), 340);
    let rem = Math.floor(G.introT * 50);
    lines.forEach((l, i) => { G.text(l, 22, 130 + i * 11, '#ffffff', { max: Math.max(0, rem) }); rem -= G.visLen(l); });
    G.text((G.introPage + 1) + '/' + INTRO.length + '   X: avançar   Enter: pular', W - 10, H - 10, '#5a5670', { align: 'right' });
  }
  function drawGameOver(ctx) {
    const t = G.goT || 0, k = Math.min(1, t / 1.2);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0a0418'); g.addColorStop(0.6, '#1a0a24'); g.addColorStop(1, '#2a0a1a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // curva normal "quebrada" ao fundo
    ctx.save(); ctx.globalAlpha = 0.25 * k; ctx.strokeStyle = '#ff5a7a'; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let px = 0; px <= W; px += 2) { const z = (px - W / 2) / 48, br = px > W / 2 + 6 && px < W / 2 + 20 ? 30 : 0; const y = 150 - 70 * Math.exp(-z * z / 2) + br + Math.sin(px * 0.3 + t * 3) * 0.6; if (px) ctx.lineTo(px, y); else ctx.moveTo(px, y); }
    ctx.stroke(); ctx.restore();
    // pontos de dados caindo
    for (let i = 0; i < 40; i++) { const x = G.hash2(i, 3, 9) * W, y = (G.hash2(i, 4, 9) * H + t * (10 + (i % 5) * 6)) % (H + 10) - 5; ctx.globalAlpha = 0.35 * k; ctx.fillStyle = i % 3 ? '#ff8aa0' : '#7ae4ff'; ctx.fillRect(x, y, 1, 1); }
    ctx.globalAlpha = 1;
    // herói caído sob um foco de luz
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, W / 2, 112, 46, '#ff6a8a', 0.25 * k); ctx.restore();
    G.shadow(ctx, W / 2, 118, 22, 0.4 * k);
    const hs = G.spr[G.spriteHeroi(false) + '_down_stand'];
    if (hs) { ctx.save(); ctx.globalAlpha = k; ctx.translate(W / 2, 112); ctx.rotate(Math.PI / 2); ctx.drawImage(G.tint(hs, 'rgba(80,40,90,0.35)'), -G.lw(hs) / 2, -G.lh(hs) / 2, G.lw(hs), G.lh(hs)); ctx.restore(); }
    const ty = 26 + (1 - k) * -14;
    ctx.globalAlpha = k;
    G.textBig('FIM DE JOGO', W / 2, ty, '#ff5a6a', { align: 'center', scale: 3, gradient: ['#ffb0b8', '#d81a3a'], outline: '#2a0410', shadowColor: 'rgba(0,0,0,0.8)' });
    G.text('Você perdeu o equilíbrio... mas todo estatístico aprende com os erros!', W / 2, ty + 40, '#e8d8ec', { align: 'center' });
    const tips = ['Florence, na vila, cura de graça.', 'Compre poções e use pelo menu (Enter).', 'Suba de nível derrotando monstros e acertando desafios.', 'O Golpe Crítico nos chefes vem de responder certo!', 'Círculos vermelhos no chão avisam onde o ataque vai cair.', 'Inimigos tremem e mostram "!" antes de atacar.'];
    const tip = 'Dica: ' + tips[Math.floor(G.P.playTime) % tips.length];
    const tw = G.textW(tip) + 16;
    G.pill(ctx, W / 2 - tw / 2, ty + 54, tw, 13, '#7ae4ff');
    G.text(tip, W / 2, ty + 57, '#bff4ff', { align: 'center' });
    ctx.globalAlpha = 1;
    if (t > 0.8) {
      const opts = ['Continuar (última estação de salvamento)', 'Salvar e voltar ao título'];
      const pw = 210, ph = 36, px = W / 2 - pw / 2, py = 146;
      ctx.globalAlpha = Math.min(1, (t - 0.8) * 3);
      G.panel(ctx, px, py, pw, ph, { r: 4, border: '#ff8aa0' });
      opts.forEach((o, i) => {
        const sel = G.goSel === i, y = py + 6 + i * 13;
        if (sel) { G.selBar(ctx, px + 5, y - 1.5, pw - 10, 11, t); G.draw(ctx, 'cursor', px + 9 + Math.sin(t * 8) * 0.8, y); }
        G.text(o, W / 2 + 4, y, sel ? '#ffe27a' : '#e0e0f0', { align: 'center' });
      });
      ctx.globalAlpha = 1;
    }
  }
  function drawEnding(ctx) {
    const t = G.endT;
    if (!titleLayers) titleLayers = buildTitleLayers();
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#04020e'); g.addColorStop(0.5, '#1a1050'); g.addColorStop(0.8, '#5a2a6a'); g.addColorStop(1, '#e8a07a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 90; i++) { const x = G.hash2(i, 1, 4) * W, y = G.hash2(i, 2, 4) * 120; ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * (1 + i % 4) * 0.6 + i)); ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, 0.5, 0.5); }
    ctx.globalAlpha = 1;
    // amanhecer: o sol nasce aos poucos
    const sunY = H - 40 - Math.min(40, t * 0.8);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, W / 2, sunY, 90, '#ffc88a', 0.5); ctx.restore();
    ctx.fillStyle = '#fff0c8'; ctx.beginPath(); ctx.arc(W / 2, sunY, 14, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.85; ctx.drawImage(titleLayers.far, 0, 0, W, H); ctx.drawImage(titleLayers.mid, 0, 0, W, H); ctx.globalAlpha = 1; ctx.drawImage(titleLayers.near, 0, 0, W, H);
    // cristais girando acima do reino
    const cl = ['media', 'mediana', 'dispersao', 'prob', 'distrib', 'amostra'].concat(G.P && G.P.flags.inferencia ? ['inferencia'] : []);
    cl.forEach((c, i) => {
      const an = t * 0.4 + i * Math.PI * 2 / cl.length, d = Math.sin(an);
      const x = W / 2 + Math.cos(an) * 160, y = 54 + d * 16;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, x, y, 12, '#ffffff', 0.25 + 0.15 * (d + 1)); ctx.restore();
      G.draw(ctx, 'crystal_' + c, x - 8, y - 8, { alpha: 0.5 + 0.4 * (d + 1) / 2 });
    });
    const L = endingLines();
    let y = H - t * 16, total = 0;
    // faixa translúcida atrás dos créditos
    const cg = ctx.createLinearGradient(W / 2 - 130, 0, W / 2 + 130, 0);
    cg.addColorStop(0, 'rgba(6,4,20,0)'); cg.addColorStop(0.2, 'rgba(6,4,20,0.55)'); cg.addColorStop(0.8, 'rgba(6,4,20,0.55)'); cg.addColorStop(1, 'rgba(6,4,20,0)');
    ctx.fillStyle = cg; ctx.fillRect(W / 2 - 130, 0, 260, H);
    const credA = G.endLen ? Math.max(0, 1 - (t - G.endLen) / 1.2) : 1;
    for (const [l, big] of L) {
      if (y > -20 && y < H + 10 && credA > 0) {
        const fade = Math.min(1, Math.min(y + 10, H - y) / 30) * credA;
        ctx.globalAlpha = Math.max(0, fade);
        if (big === 2) G.textBig(l, W / 2, y, '#ffffff', { align: 'center', gradient: ['#ffffff', '#ffd88a'], outline: '#1a0a2a' });
        else G.text(l, W / 2, y, big === 1 ? '#ffd84a' : '#ffffff', { align: 'center', outline: '#0a0618' });
        ctx.globalAlpha = 1;
      }
      const dy = big === 2 ? 24 : 12; y += dy; total += dy;
    }
    G.endLen = (total + H) / 16 - 6;
    if (t > G.endLen) {
      const k = Math.min(1, (t - G.endLen) / 1.5);
      ctx.globalAlpha = k;
      G.shadow(ctx, W / 2 - 14, H - 28, 16, 0.4); G.shadow(ctx, W / 2 + 18, H - 28, 16, 0.4);
      const s = G.spr[G.spriteHeroi(false) + '_down' + (Math.floor(t * 3) % 2 ? '_stand' : '1')];
      if (s) G.draw(ctx, s, W / 2 - 14 - G.lw(s) / 2, H - 28 - G.lh(s) + 2);
      const gs = G.spr.gauss_down_stand || G.spr.gauss_down0;
      if (gs) G.draw(ctx, gs, W / 2 + 18 - G.lw(gs) / 2, H - 28 - G.lh(gs) + 2);
      const vs = G.spr.vicente_down_stand || G.spr.vicente_down0;
      if (vs && G.P && G.P.flags.vicente) { G.shadow(ctx, W / 2 + 48, H - 28, 16, 0.4); G.draw(ctx, vs, W / 2 + 48 - G.lw(vs) / 2, H - 28 - G.lh(vs) + 2); }
      G.textBig('OBRIGADO POR JOGAR!', W / 2, 92, '#ffffff', { align: 'center', scale: 2, gradient: ['#ffffff', '#ffd84a'], outline: '#2a1040' });
      if (Math.floor(t * 2) % 2 === 0) G.text(G.touch && G.touch.on ? 'Toque em X para voltar ao título' : 'Pressione X para voltar ao título', W / 2, 120, '#e8e0f8', { align: 'center', outline: '#1a0a2a' });
      ctx.globalAlpha = 1;
    }
  }
  function render() {
    const ctx = G.ctx;
    ctx.setTransform(G.RS, 0, 0, G.RS, 0, 0);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.imageSmoothingEnabled = false;
    switch (G.state) {
      case 'boot': case 'title': drawTitle(ctx); break;
      case 'escolha': drawEscolha(ctx); break;
      case 'intro': drawIntro(ctx); break;
      case 'play': case 'loading':
        if (G.map) { drawWorld(ctx); if (G.state === 'play') G.ui.drawHUD(ctx); if (G.cineDraw) G.cineDraw(ctx); }
        else { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); }
        break;
      case 'gameover': drawGameOver(ctx); break;
      case 'ending': drawEnding(ctx); break;
      case 'gancho': if (G.ganchoDraw) G.ganchoDraw(ctx); break;
    }
    G.ui.draw(ctx);
  }

  // ------------------------------------------------------------------
  //  Inicialização
  // ------------------------------------------------------------------
  // resolução interna: múltiplo PAR da resolução lógica (pixel de arte = 1/2 pixel lógico),
  // escolhido pelo tamanho físico da janela; o resto da escala é feito pelo navegador.
  function fit() {
    const cv = G.canvasEl;
    // com o jogo girado 90° (celular em pé no modo deitado), largura e altura trocam
    const vw = G.rotated ? window.innerHeight : window.innerWidth, vh = G.rotated ? window.innerWidth : window.innerHeight;
    const s = Math.max(0.1, Math.min(vw / W, vh / H));
    const dpr = window.devicePixelRatio || 1;
    const phys = s * dpr;
    const k = Math.min(8, Math.max(2, 2 * Math.floor(phys / 2)));
    if (cv.width !== W * k) { cv.width = W * k; cv.height = H * k; }
    G.RS = k;
    cv.style.width = Math.floor(W * s) + 'px'; cv.style.height = Math.floor(H * s) + 'px';
    cv.style.imageRendering = Math.abs(phys - k) < 0.01 ? 'pixelated' : 'auto';
  }
  G.toggleFullscreen = () => {
    const el = document.documentElement;
    if (!document.fullscreenElement) { (el.requestFullscreen || el.webkitRequestFullscreen || (() => { })).call(el); }
    else (document.exitFullscreen || (() => { })).call(document);
  };
  G.boot = function () {
    G.canvasEl = document.getElementById('game');
    G.ctx = G.canvasEl.getContext('2d');
    G.font.init();
    G.gfx.init();
    G.buildStructs();
    for (const f of G.structHooks || []) f();
    G.input.init();
    loadSettings();
    window.addEventListener('resize', fit); fit();
    G.titleT = 0; G.titleSel = 0;
    G.world.ensure();
    personagemDoSave();
    let last = performance.now(), acc = 0;
    function loop(now) {
      let d = (now - last) / 1000; last = now;
      if (d > 0.25) d = 0.25;
      acc += d;
      let steps = 0;
      if (G._freeze) acc = 0; // gancho de teste: congela a simulação
      while (acc >= G.DT && steps < 5) {
        try { update(G.DT); } catch (e) { console.error(e); G.lastError = e; }
        acc -= G.DT; steps++;
      }
      if (steps >= 5) acc = 0;
      try { render(); } catch (e) { console.error(e); G.lastError = e; }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
    // Stat AI: save in both maps, away from transitions and unfinished dialogs.
    setInterval(() => { if (G.state === 'play' && G.P && G.map && !G.trans && !G.cutscene) G.saveGame(); }, 15000);
  };
  G._update = update; G._render = render; G._newGame = newGame; G._respawn = respawn;
  window.addEventListener('load', () => G.boot());
})(window.G);
