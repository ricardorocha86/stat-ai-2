'use strict';
// =====================================================================
//  NPCs: falas, missões, lojas. Cada script é uma função async.
// =====================================================================
(function (G) {
  const say = (n, t, o) => G.ui.say(n, t, o);
  const ask = (n, t, opts, o) => G.ui.ask(n, t, opts, o);
  const P = () => G.P;

  G.nextHint = function () {
    const p = P(), c = p.crystals;
    if (!p.items.sword) return 'Fale com o Mestre Gauss na vila.';
    if (!c.includes('media')) return 'Vá ao ^gTemplo da Média^0, a nordeste da vila. Lá dentro você aprenderá sobre a MÉDIA.';
    if (!c.includes('mediana')) return 'Com as ^yBotas de Salto^0 (tecla Z), pule o riacho a OESTE da vila e encontre o ^gBosque da Mediana^0.';
    if (!c.includes('dispersao')) return 'Exploda as ^yrochas rachadas^0 com bombas para chegar ao ^yDeserto^0 (ao sul do Lago ou a leste dos Campos de Pascal).';
    if (!c.includes('prob')) return 'Atire com o ^cRaio Amostral^0 na barreira de cristal ao NORTE do Lago Bernoulli para chegar ao ^rVulcão^0.';
    if (!c.includes('distrib')) return 'Com o ^oTraje Térmico^0, suba aos ^cPicos Gaussianos^0, ao norte do Bosque Sombrio. A Torre das Distribuições te espera.';
    return 'O selo do ^pCastelo do Viés^0 se rompeu! Vá ao norte da vila (quebre a barreira de cristal) e derrote Viés!';
  };

  async function shop(name, portrait, items) {
    await say(name, 'O que vai querer?', { portrait });
    for (;;) {
      const avail = items.filter(it => !it.cond || it.cond());
      const opts = avail.map(it => it.label() + '  ' + it.price + 'm').concat(['Sair']);
      const i = await G.ui.choose(opts, { cancel: avail.length, showCoins: true, desc: k => (k < avail.length ? avail[k].desc : 'Até a próxima!'), x: 160 });
      if (i >= avail.length || i < 0) break;
      const it = avail[i];
      if (it.full && it.full()) { await say(name, it.fullMsg || 'Você já tem o máximo disso!', { portrait }); continue; }
      if (P().coins < it.price) { G.sfx('wrong'); await say(name, 'Você não tem moedas suficientes... Golpeie blocos ? e derrote monstros!', { portrait }); continue; }
      P().coins -= it.price; G.sfx('coin');
      await it.buy();
    }
    await say(name, 'Volte sempre!', { portrait });
  }
  const SHOP_COMMON = () => [
    { label: () => 'Poção Vermelha', price: 30, desc: 'Restaura 4 corações. Use pelo menu (Enter).', full: () => P().potions >= 5, fullMsg: 'Você já carrega 5 poções!', buy: () => G.give('potion') },
    { label: () => 'Bombas x5', price: 20, desc: 'Cinco bombas para sua bolsa.', cond: () => P().items.bombs, full: () => P().bombs >= P().bombMax, buy: async () => { G.give('bombs', 5); } },
    { label: () => 'Bolsa Grande de Bombas', price: 120, desc: 'Carregue até 20 bombas!', cond: () => P().items.bombs && P().bombMax < 20, buy: async () => { P().bombMax = 20; P().bombs = 20; await G.ui.banner('bomb', 'BOLSA GRANDE', 'Agora você carrega até 20 bombas.'); } }
  ];

  const N = G.NPCS = {
    generic: async (n) => { await say(n.name, 'Que dia bonito, não acha?'); },

    // ---------------- VILA GAUSS ----------------
    gauss: async (n) => {
      const p = P(), por = 'gauss_down0';
      if (!p.flags.talkGauss) {
        await say('Mestre Gauss', 'Ah, Sigma, {meu melhor|minha melhor} aprendiz! Que bom que você acordou. Temos um problema TERRÍVEL.', { portrait: por });
        await say('Mestre Gauss', 'O feiticeiro ^rViés, o Distorcedor^0, roubou os seis ^pCristais da Razão^0 e os escondeu em templos pelo reino de Datália.', { portrait: por });
        await say('Mestre Gauss', 'Sem os cristais, o povo esqueceu como entender os números. Acreditam em boatos, fazem contas erradas, tomam decisões ruins...', { portrait: por });
        await say('Mestre Gauss', 'Só alguém que domina a ^yEstatística^0 pode recuperá-los. E esse alguém é VOCÊ! É perigoso ir desarmado. Tome isto!', { portrait: por });
        await G.give('sword');
        p.flags.talkGauss = true;
        if (!p.lessons.includes('intro')) p.lessons.push('intro');
        await say('Mestre Gauss', 'Mas uma espada não basta. Primeiro, uma lição rápida sobre o que é a Estatística.', { portrait: por });
        await G.ui.lesson('intro');
        await say('Mestre Gauss', 'O primeiro cristal está no ^gTemplo da Média^0, a nordeste daqui. Fale comigo sempre que estiver {perdido|perdida}. Boa sorte, Sigma!', { portrait: por });
        await say(null, 'Controles: ^ySETAS^0 movem · ^yX^0 ataca e conversa · ^yZ^0 pula (com as botas) · ^yEnter^0 abre o menu (status, mapa, missões, Grimório) · ^yM^0 mapa. Explore o reino à vontade!');
        await say(null, 'Dica: quem tem um ^y!^0 amarelo sobre a cabeça tem um pedido para você. Missões rendem tesouros e lições novas!');
        G.ui.toast('Objetivo: Templo da Média (nordeste da vila)', '#ffd84a');
        return;
      }
      const r = await ask('Mestre Gauss', 'Precisa de ajuda, Sigma?', ['Para onde devo ir?', 'Desafio do Mestre (XP)', 'Quem é o senhor?', 'Nada, {obrigado|obrigada}'], { cancel: 3, portrait: por });
      if (r === 0) await say('Mestre Gauss', G.nextHint(), { portrait: por });
      else if (r === 1) {
        const ok = await G.ui.quiz(G.Q.genUnlocked(2), { title: 'DESAFIO DO MESTRE' });
        if (ok) { G.addXP(10); await say('Mestre Gauss', 'Excelente! Você está ficando {afiado|afiada}. (+10 XP)', { portrait: por }); }
        else await say('Mestre Gauss', 'Errar faz parte de aprender. Releia o Grimório e tente de novo!', { portrait: por });
      } else if (r === 2) {
        await say('Mestre Gauss', 'Me inspiro em ^yCarl Friedrich Gauss^0 (1777-1855), o "príncipe dos matemáticos". Ele estudou a famosa ^ccurva normal^0, em forma de sino.', { portrait: por });
        await say('Mestre Gauss', 'Dizem que, ainda criança, ele somou 1+2+...+100 em segundos: 50 pares que somam 101 = 5050! Truques assim também ajudam a calcular médias.', { portrait: por });
      }
    },
    mendel: async (n) => {
      const p = P(), por = 'mendel_down0';
      if (!p.flags.metMendel) {
        p.flags.metMendel = true;
        await say('Seu Mendel', 'Bem-{vindo|vinda} à minha loja! Sabia que o monge ^yGregor Mendel^0 descobriu as leis da hereditariedade contando ervilhas? Estatística pura!', { portrait: por });
      }
      await shop('Seu Mendel', por, SHOP_COMMON().concat([
        { label: () => 'Espada de Ferro (ATQ+1)', price: 100, desc: 'Uma espada mais forte. Aumenta seu ataque em 1.', cond: () => G.equip.melhorEspada() === 0, buy: async () => { G.equip.ganhar('espada', 1); G.sfx('fanfare'); await G.ui.banner('swordIcon', 'ESPADA DE FERRO', 'Ataque aumentado! Veja seu novo dano no Diário de Dados.'); } },
        { label: () => 'Couraça de Couro (DEF+1)', price: 90, desc: 'Reduz o dano recebido em 1/4 de coração.', cond: () => G.equip.melhorArmadura() === 0, buy: async () => { G.equip.ganhar('armadura', 1); G.sfx('fanfare'); await G.ui.banner('armorIcon', 'COURAÇA DE COURO', 'Defesa aumentada!'); } },
        { label: () => 'Fragmento de Coração', price: 300, desc: 'Um raro fragmento. 4 fragmentos = 1 coração.', cond: () => !p.flags.shopHP1, buy: async () => { p.flags.shopHP1 = true; await G.give('heartPiece'); } }
      ]));
    },
    florence: async (n) => {
      const p = P(), por = 'florence_down0';
      if (!p.flags.metFlorence) {
        p.flags.metFlorence = true;
        await say('Florence', 'Olá! Sou enfermeira, como a grande ^yFlorence Nightingale^0. Ela salvou milhares de vidas usando ESTATÍSTICA e gráficos!', { portrait: por });
        if (!p.lessons.includes('graficos')) p.lessons.push('graficos');
        await G.ui.lesson('graficos');
        await say('Florence', 'Leve esta poção. E sempre que se machucar, volte aqui: eu curo de graça!', { portrait: por });
        await G.give('potion');
      }
      p.hp = p.maxHp; G.sfx('heal');
      await say('Florence', 'Pronto, vida totalmente restaurada! Cuide-se lá fora.', { portrait: por });
    },
    kid1: async (n) => {
      const p = P();
      if (p.flags.kid1Done) { await say('Tico', 'Agora eu sei calcular a média das minhas bolinhas! Valeu!'); return; }
      await say('Tico', 'Ei, você é {o|a} aprendiz do Mestre Gauss? Me ajuda com a lição de casa?');
      const ok = await G.ui.quiz(G.Q.gen('media', 1), { title: 'LIÇÃO DO TICO' });
      if (ok) { p.flags.kid1Done = true; await say('Tico', 'Uau, isso mesmo! Toma, guardei essas moedas pra você.'); G.give('coin', 15); }
      else await say('Tico', 'Hmm, acho que não... Vamos tentar de novo depois?');
    },
    kid2: async (n) => {
      const p = P();
      if (p.flags.kid2Done) { await say('Lia', 'Minha cor favorita é a MODA da turma: todo mundo gosta de azul!'); return; }
      await say('Lia', 'Fiz uma pesquisa na minha turma! Você consegue descobrir a resposta?');
      const ok = await G.ui.quiz(G.Q.gen('moda', 1), { title: 'PESQUISA DA LIA' });
      if (ok) { p.flags.kid2Done = true; await say('Lia', 'Acertou! A moda é o valor que mais aparece. Toma uma poção da minha mãe!'); await G.give('potion'); }
      else await say('Lia', 'Não é bem isso... A moda é o que mais se repete, sabia?');
    },
    villager1: async (n) => {
      const p = P();
      const lines = [
        'Ouvi dizer que TODO MUNDO na vila odeia segunda-feira. Como sei? Perguntei aos meus 3 amigos! ...Isso conta como pesquisa, né?',
        'Dizem que o Viés distorce os números escolhendo só os dados que lhe convêm. Que absurdo!',
        'Antes do roubo dos cristais, as pessoas sabiam que uma média pode enganar quando há valores extremos.'
      ];
      await say('Seu Quirino', lines[(p.stats.talks = (p.stats.talks || 0) + 1) % lines.length]);
    },
    villager2: async (n) => {
      await say('Dona Amélia', G.pick([
        'Blocos com "?" guardam moedas e tesouros. Bata neles com a espada! Alguns têm até cogumelos mágicos.',
        'Os ^gCanos de Dobra^0 verdes levam você rapidinho para outros canos que já visitou. Muito prático!',
        'Viu as ^cestações de salvamento^0? Pise no círculo azul para salvar e recuperar a vida.',
        'Meu marido diz que a altura média dos homens daqui é 1,75 m. Mas ele só mediu os jogadores de basquete...'
      ]));
    },

    // ---------------- LAGO ----------------
    bernoulli: async (z) => {
      const p = P();
      if (!p.lessons.includes('lgn')) {
        await say(null, 'Uma enorme moeda de ouro. Há uma inscrição: ^y"Jacob Bernoulli, 1713: com muitas repetições, a frequência se aproxima da probabilidade."^0');
        p.lessons.push('lgn'); G.sfx('secret'); G.addXP(10);
        await say(null, 'Nova lição no Grimório: ^cLei dos Grandes Números^0!');
        await G.ui.lesson('lgn');
      }
      const r = await ask('Estátua de Bernoulli', 'A moeda pode ser lançada muitas vezes. Aposte 10 moedas que a proporção de CARAS ficará entre 45% e 55%!', ['Jogar o Desafio de Bernoulli', 'Sair'], { cancel: 1 });
      if (r === 0) await G.mini.run('lln');
    },
    neyman: async (n) => {
      const p = P();
      if (!p.flags.metNeyman) {
        p.flags.metNeyman = true;
        await say('Pescador Neyman', 'Olá! Me chamo Neyman, como o estatístico ^yJerzy Neyman^0, mestre da amostragem. Neste lago vivem centenas de peixes: azuis e dourados.');
        await say('Pescador Neyman', 'Ninguém consegue contar TODOS os peixes. Mas pescando uma AMOSTRA, dá para ^gestimar^0 a proporção de dourados! Quer tentar?');
      }
      const r = await ask('Pescador Neyman', 'Vamos pescar uma amostra?', ['Pescar (estimar dourados)', 'Como funciona?', 'Agora não'], { cancel: 2 });
      if (r === 0) await G.mini.run('fishing');
      else if (r === 1) await say('Pescador Neyman', 'Cada peixe pescado é observado e devolvido. Depois você estima a % de dourados no lago todo. Quanto ^gmaior a amostra^0, mais confiável a estimativa!');
    },
    traveler_lago: async () => {
      const p = P();
      if (!p.items.boots) await say('Viajante', 'Vejo uma tumba antiga naquela ilhota no meio do lago... O píer termina perto dela. Se eu pulasse mais longe...');
      else await say('Viajante', 'Com essas botas você chega na ilhota! Pule do fim do píer.');
    },

    // ---------------- CAMPOS DE PASCAL ----------------
    fisher: async (n) => {
      const p = P(), c = p.flags.sheep;
      if (p.flags.fisherDone) { await say('Fazendeiro Fisher', 'Graças a você meu censo das ovelhas está completo! ^yRonald Fisher^0, o pai da estatística moderna, ficaria orgulhoso.'); return; }
      if (!p.flags.metFisher) {
        p.flags.metFisher = true;
        await say('Fazendeiro Fisher', 'Preciso fazer o CENSO das minhas ovelhas, mas elas não param quietas! Você pode observar o cercado e me dizer os números?');
        await say('Fazendeiro Fisher', 'Um ^yCENSO^0 conta TODA a população (diferente de uma amostra). Observe bem antes de responder!');
      }
      const r = await ask('Fazendeiro Fisher', 'Já contou as ovelhas do cercado?', ['Sim, vou responder', 'Ainda não'], { cancel: 1 });
      if (r !== 0) return;
      const cores = ['branca', 'preta', 'marrom'];
      const mode = cores.reduce((b, k) => (c[k] > c[b] ? k : b), 'branca');
      const q1 = { topic: 'moda', text: 'Qual é a cor MODA (mais comum) das ovelhas no cercado?', options: ['Branca', 'Preta', 'Marrom'], correct: cores.indexOf(mode), explain: 'Contagem: ' + c.branca + ' brancas, ' + c.preta + ' pretas e ' + c.marrom + ' marrons. A moda é a mais frequente: ^g' + mode + '^0.', fig: null };
      const ok1 = await G.ui.quiz(q1, { title: 'CENSO DAS OVELHAS' });
      if (!ok1) { await say('Fazendeiro Fisher', 'Hmm, não bate com minhas anotações. Conte de novo com calma!'); return; }
      const tot = c.branca + c.preta + c.marrom;
      const opts = G.shuffle([tot, tot + 1, tot - 1, tot + 2]);
      const q2 = { topic: 'freq', text: 'E quantas ovelhas há NO TOTAL no cercado?', options: opts.map(String), correct: opts.indexOf(tot), explain: c.branca + ' + ' + c.preta + ' + ' + c.marrom + ' = ^g' + tot + '^0 ovelhas.', fig: null };
      const ok2 = await G.ui.quiz(q2, { title: 'CENSO DAS OVELHAS' });
      if (!ok2) { await say('Fazendeiro Fisher', 'Quase! Conte cada cor e some tudo.'); return; }
      p.flags.fisherDone = true;
      await say('Fazendeiro Fisher', 'Perfeito! A proporção de brancas é ' + c.branca + '/' + tot + ' ≈ ' + Math.round(c.branca / tot * 100) + '%. Tome, encontrei isto no pasto!');
      await G.give('heartPiece');
    },
    pascal: async (n) => {
      const p = P(), por = 'pascal_down0';
      if (!p.flags.metPascal) {
        p.flags.metPascal = true;
        await say('Pascal', 'Bem-{vindo|vinda} ao meu cassino! Sou fã de ^yBlaise Pascal^0, que junto com Fermat inventou a teoria da probabilidade... para resolver uma briga de apostadores!', { portrait: por });
        if (!p.lessons.includes('esperanca')) p.lessons.push('esperanca');
        await say('Pascal', 'Antes de apostar, aprenda sobre o ^yVALOR ESPERADO^0. Ele diz quanto você ganha ou perde EM MÉDIA.', { portrait: por });
        await G.ui.lesson('esperanca');
      }
      const r = await ask('Pascal', 'Quer jogar os Dados de Pascal?', ['Jogar (aposta 5 moedas)', 'Desafio do Valor Esperado', 'Sair'], { cancel: 2, portrait: por });
      if (r === 0) await G.mini.run('dice');
      else if (r === 1) {
        if (p.flags.pascalHP) { await say('Pascal', 'Você já provou que entende de valor esperado! Mas pode treinar mais:', { portrait: por }); }
        const ok = await G.ui.quiz(G.Q.gen('esperanca', 2), { title: 'DESAFIO DE PASCAL' });
        if (ok && !p.flags.pascalHP) { p.flags.pascalHP = true; await say('Pascal', 'Brilhante! Quem entende o valor esperado não cai em apostas ruins. Tome seu prêmio!', { portrait: por }); await G.give('heartPiece'); }
        else if (ok) { G.give('coin', 10); await say('Pascal', 'Correto de novo! 10 moedas para você.', { portrait: por }); }
        else await say('Pascal', 'Errado! Lembre: E = soma de (valor × probabilidade).', { portrait: por });
      }
    },

    // ---------------- BOSQUE / PÂNTANO ----------------
    laplace: async () => {
      const p = P(), por = 'laplace_down0';
      if (!p.flags.metLaplace) {
        p.flags.metLaplace = true;
        await say('Eremita Laplace', 'Hum... {um|uma} visitante. Pierre-Simon ^yLaplace^0 dizia: "a teoria da probabilidade é o bom senso reduzido a cálculo".', { portrait: por });
        await say('Eremita Laplace', 'Você vai precisar disto no templo do bosque. Lá dentro, lembre-se: a MEDIANA fica no meio dos dados ORDENADOS.', { portrait: por });
        await G.give('potion');
        return;
      }
      await say('Eremita Laplace', G.pick([
        'Se o sol nasceu todos os dias que você viveu, qual a chance de nascer amanhã? Laplace calculou: (n+1)/(n+2). Quase certeza!',
        'A moda é a única medida que serve para cores e nomes. Não dá para tirar a média de "azul" e "verde"!',
        'Valores extremos enganam a média, mas não a mediana. Guarde isso no coração.'
      ]), { portrait: por });
    },
    bayes: async () => {
      const p = P(), por = 'bayes_down0';
      if (!p.flags.metBayes) {
        p.flags.metBayes = true;
        await say('Sábio Bayes', 'Croac! Sou o sapo sábio deste pântano, homenagem ao reverendo ^yThomas Bayes^0. Ele ensinou a ATUALIZAR crenças com novas evidências.', { portrait: por });
        await say('Sábio Bayes', 'Exemplo: se 1 em 100 sapos é dourado, e você vê algo brilhar no lago, a chance de ser um sapo dourado aumenta — mas talvez seja só o sol na água!', { portrait: por });
      }
      const r = await ask('Sábio Bayes', 'Encare minha Prova dos Três Desafios! Acerte os três seguidos.', ['Aceitar', 'Agora não'], { cancel: 1, portrait: por });
      if (r !== 0) return;
      for (let i = 0; i < 3; i++) {
        const ok = await G.ui.quiz(G.Q.genUnlocked(2), { title: 'PROVA DE BAYES ' + (i + 1) + '/3' });
        if (!ok) { await say('Sábio Bayes', 'Croac... Atualize seu conhecimento e volte!', { portrait: por }); return; }
      }
      if (!p.flags.bayesHP) { p.flags.bayesHP = true; await say('Sábio Bayes', 'Três de três! Sua crença na própria sabedoria deve aumentar. Tome!', { portrait: por }); await G.give('heartPiece'); }
      else { G.give('coin', 30); await say('Sábio Bayes', 'Impressionante de novo! 30 moedas.', { portrait: por }); }
    },

    // ---------------- DESERTO ----------------
    quetelet: async () => {
      const p = P(), por = 'quetelet_down0';
      if (!p.flags.metQuetelet) {
        p.flags.metQuetelet = true;
        await say('Mercador Quetelet', 'Saudações, viajante! Meu nome vem de ^yAdolphe Quetelet^0, que estudou o "homem médio" e criou o índice de massa corporal.', { portrait: por });
      }
      await shop('Mercador Quetelet', por, SHOP_COMMON().concat([
        { label: () => 'Espada de Prata (ATQ+1)', price: 260, desc: 'Lâmina brilhante. Exige a Espada de Ferro.', cond: () => G.equip.melhorEspada() === 1, buy: async () => { G.equip.ganhar('espada', 2); G.sfx('fanfare'); await G.ui.banner('swordIcon', 'ESPADA DE PRATA', 'Ataque aumentado!'); } },
        { label: () => 'Cota de Malha (DEF+1)', price: 240, desc: 'Armadura resistente. Exige a Couraça de Couro.', cond: () => G.equip.melhorArmadura() === 1, buy: async () => { G.equip.ganhar('armadura', 2); G.sfx('fanfare'); await G.ui.banner('armorIcon', 'COTA DE MALHA', 'Defesa aumentada!'); } },
        { label: () => 'Fragmento de Coração', price: 350, desc: 'Raríssimo no deserto.', cond: () => !p.flags.shopHP2, buy: async () => { p.flags.shopHP2 = true; await G.give('heartPiece'); } }
      ]));
    },

    // ---------------- MONTANHA ----------------
    galton: async () => {
      const p = P(), por = 'galton_down0';
      if (!p.lessons.includes('normal')) {
        await say('Professor Galton', 'Brrr! Bem-{vindo|vinda}, jovem. Sou fã de ^yFrancis Galton^0, que criou este tabuleiro para mostrar como o ACASO forma um SINO.', { portrait: por });
        p.lessons.push('normal'); G.sfx('secret'); G.addXP(10);
        await say(null, 'Nova lição no Grimório: ^cDistribuição Normal^0!');
        await G.ui.lesson('normal');
      }
      const r = await ask('Professor Galton', 'Quer usar o Tabuleiro de Galton? Aposte em qual casa cairão MAIS bolinhas!', ['Usar o tabuleiro', 'Sair'], { cancel: 1, portrait: por });
      if (r === 0) await G.mini.run('galton');
    },
    galtonBoard: async () => N.galton(),
    mountaineer: async () => {
      const p = P();
      if (!p.items.suit) await say('Montanhês', 'Você está tremendo! Sem proteção térmica ninguém sobrevive muito tempo aqui em cima. Dizem que no ^rVulcão^0 existe um traje que protege do calor E do frio.');
      else await say('Montanhês', 'Que traje incrível! A Torre das Distribuições fica ao norte. Cuidado com o Yeti lá no topo.');
    },

    // ---------------- CASTELO ----------------
    sentinel: async () => {
      const p = P(), n = p.crystals.length;
      if (n < 5) await say('Sentinela', 'Alto! O portão do castelo está selado pela magia de Viés. Só a luz de ^p5 Cristais da Razão^0 pode quebrar o selo. Você tem ' + n + '.');
      else await say('Sentinela', 'Os cristais brilham! O selo se rompeu. Viés está lá dentro com o último cristal, o ^pCristal da Amostra^0. Que a estatística esteja com você!');
    }
  };

  // ---------------- Canos de Dobra ----------------
  G.pipeMenu = async function (pipe) {
    const p = P();
    const list = G.world.ow.objects.filter(o => o.type === 'pipe' && p.pipes.includes(o.id) && o.id !== pipe.pid);
    if (!list.length) { await say(null, 'Um ^gCano de Dobra^0! Descubra outros canos pelo reino para viajar entre eles.'); return; }
    const i = await G.ui.choose(list.map(o => o.name).concat(['Cancelar']), { prompt: 'Viajar pelo Cano de Dobra para:', cancel: list.length });
    if (i < 0 || i >= list.length) return;
    const dest = list[i], pl = G.player;
    pl.state = 'pipe'; G.sfx('pipe');
    pl.x = pipe.x + 11; pl.y = pipe.y - 12; pl.dir = 0;
    for (let k = 0; k < 14; k++) { pl.z -= 1.5; await G.wait(0.035); }
    await G.ui.fade(1, 0.3);
    pl.x = dest.x + 11; pl.y = dest.y + 36; pl.z = 0; pl.state = 'normal'; pl.dir = 0; pl.lastSafe = { x: pl.x, y: pl.y };
    G.cam.x = G.clamp(pl.cx - G.W / 2, 0, G.world.MW * 16 - G.W); G.cam.y = G.clamp(pl.cy - G.H / 2, 0, G.world.MH * 16 - G.H);
    for (const s of G.spawners) { if (s.ent) { s.ent.dead = true; s.ent = null; } }
    await G.ui.fade(0, 0.3);
    G.sfx('pipe');
  };
})(window.G);
