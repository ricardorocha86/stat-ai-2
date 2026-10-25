'use strict';
// =====================================================================
//  Só no localhost, para testar: index.html?teste=pos-vies começa com o
//  save de quem acabou de vencer o Viés (seis cristais e o da Inferência,
//  todos os itens até o Gancho, antes da formatura), parado na frente do
//  castelo. Acrescente &heroina para jogar com a heroína. Fora do
//  localhost (e sem o parâmetro) este arquivo não faz nada.
// =====================================================================
(function (G) {
  if (!/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) return;
  const q = new URLSearchParams(location.search);
  if (q.get('teste') !== 'pos-vies') return;
  G.saveDeTeste = () => {
    const P = G.newProgress(), ow = G.world.ensure(), F = P.flags;
    P.personagem = q.has('heroina') ? 'heroina' : 'heroi';
    Object.assign(P.items, { sword: true, boots: true, bombs: true, beam: true, suit: true, spin: true, hook: true });
    P.sub = 'hook'; P.bombs = 10;
    P.swordLv = 3; P.espadas = [0, 1, 2, 3]; P.armorLv = 2; P.armaduras = [0, 1, 2];
    // 6 contêineres (d1 a d5 e d7) e 12 fragmentos = 9 corações a mais
    P.heartPieces = 12; P.maxHp = 12 + 6 * 4 + 3 * 4; P.hp = P.maxHp;
    P.level = 14; P.sab = 32; P.coins = 420; P.potions = 3;
    P.crystals = ['media', 'mediana', 'dispersao', 'prob', 'distrib', 'amostra'];
    P.lessons = G.LESSON_ORDER.slice();
    P.regions = G.world.REG.flat();
    P.seen = P.seen.map(() => 1);
    P.pipes = P.regions.slice();
    for (const d of ['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7']) { F['boss_' + d] = true; F[d + '_crystalGot'] = true; F[d + '_entered'] = true; if (d !== 'd6') F[d + '_hc'] = true; }
    Object.assign(F, { won: true, vicente: true, inferencia: true, obsOpen: true, talkGauss: true, metMendel: true, metFlorence: true, metBayes: true, gotBoots: true, coldWarn: true });
    // passagens entre regiões já abertas (rachaduras e barreiras quebradas na jornada)
    const quebrados = P.broken.overworld = [];
    for (const p of ow.passages) {
      if (p.kind !== 'bomb' && p.kind !== 'beam') continue;
      const tiles = p.vertical ? [0, 1, 2].map(k => [p.bx, p.y0 + k]) : [0, 1, 2].map(k => [p.x0 + k, p.by]);
      for (const [x, y] of tiles) quebrados.push(y * ow.map.w + x);
    }
    P.playTime = 4 * 3600 + 21 * 60; F.endTime = P.playTime;
    // como depois dos créditos: o jogo continua na porta do castelo
    const o = ow.objects.find(ob => ob.type === 'warp' && ob.to === 'd6');
    P.lastDungeon = 'd6'; P.lastPos = { x: o.x + o.w / 2 - 5, y: o.y + 22 };
    const save = ow.objects.find(ob => ob.type === 'save' && ob.id === 'castelo');
    if (save) P.savePoint = { map: 'overworld', x: save.x + 8, y: save.y + 24 };
    return JSON.stringify(P);
  };
})(window.G);
