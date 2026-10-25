'use strict';
// =====================================================================
//  Manuscritos dos Mestres: sete tumbas escondidas pelo reino. Empurrar
//  ou puxar a tumba do jeito certo (cada uma tem a sua regra, lida na
//  lápide) revela uma escadinha para uma cripta. Lá embaixo, o fantasma
//  do autor conta a sua grande ideia, faz uma pergunta e entrega o
//  manuscrito numa cerimônia. A Florence, na Vila Gauss, monta o acervo
//  e dá a Pena dos Mestres a quem juntar os sete.
// =====================================================================
(function (G) {
  const T = G.T, TS = 16, TAU = Math.PI * 2;
  const P = () => G.P;
  const say = (n, t, o) => G.ui.say(n, t, o), ask = (n, t, op, o) => G.ui.ask(n, t, op, o);
  const virgula = (v, c = 1) => v.toFixed(c).replace('.', ',');

  // ------------------------------------------------------------------
  //  Os sete mestres (em ordem cronológica)
  //  falas: [índice do fantasma, texto]; a pergunta é feita pelo fantasma 0
  // ------------------------------------------------------------------
  const MESTRES = [
    {
      id: 'pascal', autor: 'Pascal e Fermat', curto: 'Pascal e Fermat', ano: 1654, cor: '#ffb84a',
      obra: 'Cartas sobre o problema dos pontos',
      ideia: 'Para dividir com justiça as apostas de um jogo interrompido, contaram todos os jeitos de o jogo terminar. Nasceu o cálculo de probabilidades.',
      fantasmas: [{ nome: 'Blaise Pascal', doll: 'pascal' }, { nome: 'Pierre de Fermat', doll: 'fermat' }],
      falas: [
        [0, 'Boa noite! Sou ^yBlaise Pascal^0. E este aqui é o meu amigo de cartas, ^yPierre de Fermat^0.'],
        [1, 'Em 1654, um jogador fez a Pascal uma pergunta: se uma partida é interrompida no meio, como dividir o prêmio com justiça?'],
        [0, 'Discutimos por cartas, eu em Paris, ele em Toulouse. O segredo foi não olhar só o placar, mas ^ccontar todos os jeitos^0 de o jogo terminar.'],
        [1, 'Dessas cartas nasceu o cálculo de probabilidades. Vamos ver se você entendeu?']
      ],
      pergunta: {
        texto: 'Partida de 3 pontos, 64 moedas na mesa. O jogo parou em 2 a 1. Quanto é justo dar a quem tem 2 pontos?',
        opcoes: ['32 moedas: metade para cada', '48 moedas', '43 moedas: proporcional ao placar'], certa: 1,
        explica: 'Pense no que ainda pode acontecer: quem tem 1 ponto precisa vencer as DUAS próximas rodadas, uma chance de 1/2 × 1/2 = 1/4.'
      },
      acerto: [[1, 'Isso! 48 moedas para o líder e 16 para o outro: 3/4 e 1/4. Foi exatamente a conta da carta de Pascal.']],
      despedida: [[0, 'Leve as nossas cartas. Ah, e aquele Pascal do cassino é só um xará: eu prefiro calcular a aposta a fazê-la.']],
      lapide: 'Aqui descansam ^yPASCAL^0 e ^yFERMAT^0, que se escreviam cartas.\n"Leve um até o outro, mas deixe espaço para uma carta entre nós."',
      dica: 'Dois amigos que se escreviam cartas descansam no calor do ^rVulcão do Acaso^0, atrás de uma parede rachada.'
    },
    {
      id: 'bernoulli', autor: 'Jacob Bernoulli', curto: 'Jacob Bernoulli', ano: 1713, cor: '#7ae4ff',
      obra: 'Ars Conjectandi (A Arte de Conjecturar)',
      ideia: 'Lei dos Grandes Números: com muitas repetições, a frequência observada se aproxima da probabilidade verdadeira.',
      fantasmas: [{ nome: 'Jacob Bernoulli', doll: 'bernoulli' }],
      falas: [
        [0, 'Ah, visita! Sou ^yJacob Bernoulli^0. Passei uns vinte anos provando uma coisa de que todo mundo já desconfiava.'],
        [0, 'Lance uma moeda poucas vezes e o resultado pula de um lado para o outro. Lance MUITAS vezes e a proporção de caras se acomoda perto da probabilidade verdadeira.'],
        [0, 'É a ^cLei dos Grandes Números^0. Meu livro, a ^yArs Conjectandi^0, só saiu em 1713, oito anos depois que eu parti.']
      ],
      pergunta: {
        texto: 'Uma moeda honesta. Em qual caso a proporção de caras tende a ficar mais perto de 50%?',
        opcoes: ['Em 10 lançamentos', 'Em 1000 lançamentos', 'Tanto faz: a moeda é a mesma'], certa: 1,
        explica: 'Com poucas jogadas o acaso pesa muito: 7 caras em 10 acontece bastante. Com mil jogadas, um desvio desses fica raríssimo.'
      },
      acerto: [[0, 'Exato! Lá fora, a minha tumba só cedeu depois de mil lances. Viu como a porcentagem foi se acalmando?']],
      despedida: [[0, 'A estátua do lago leva o nome da minha família. Somos muitos Bernoulli, e quase todos matemáticos!']],
      lapide: 'Aqui descansa ^yJACOB BERNOULLI^0.\n"Um lance não prova nada. Insista, e a verdade aparece."',
      dica: 'Um deles dorme na ilhota do ^cLago Bernoulli^0, depois do fim do píer. Com ele, insistir é tudo.'
    },
    {
      id: 'bayes', autor: 'Thomas Bayes', curto: 'Thomas Bayes', ano: 1763, cor: '#8affc0',
      obra: 'Ensaio sobre um problema da doutrina das chances',
      ideia: 'Atualizar uma crença com evidências: o que se pensava antes, combinado com o que se observa, vira uma crença nova e melhor.',
      fantasmas: [{ nome: 'Thomas Bayes', doll: 'bayes' }],
      falas: [
        [0, 'Seja {bem-vindo|bem-vinda} à minha cripta úmida. Sou ^yThomas Bayes^0, pastor numa cidadezinha inglesa e matemático por gosto.'],
        [0, 'Eu pensava num problema ao contrário: depois de ver um resultado, o que dá para dizer sobre a causa?'],
        [0, 'A ideia é começar com uma crença e ^cajustá-la a cada nova evidência^0. Meu amigo Richard Price achou o ensaio nos meus papéis e o publicou em 1763, dois anos depois que eu parti.']
      ],
      pergunta: {
        texto: 'Numa caixa há duas moedas: uma honesta e uma com CARA dos dois lados. Você pega uma ao acaso, lança e sai cara. Qual a chance de ser a de duas caras?',
        opcoes: ['1/2', '2/3', '3/4'], certa: 1,
        explica: 'Antes de lançar, era 1/2 para cada. Mas a de duas caras SEMPRE dá cara, e a honesta só metade das vezes. Das caras possíveis, quantas vêm de cada moeda?'
      },
      acerto: [[0, 'Muito bem! Das caras possíveis, 2 em cada 3 vêm da moeda de duas caras. A evidência mudou a sua crença: de 1/2 para 2/3.']],
      despedida: [[0, 'Dizem que um sábio deste pântano usa o meu nome. Espero que ele atualize as crenças dele com frequência!']],
      lapide: 'Aqui descansa ^yTHOMAS BAYES^0. Esta tumba só desliza para o lado MAIS PROVÁVEL.\nQuem a construiu fez 3 de cada 4 tumbas deslizarem para o ^cNORTE^0. As que deslizam para o ^cSUL^0 sempre criam musgo; das que deslizam para o norte, só 1 em cada 6.\nOlhe bem a tumba... e atualize a sua crença.',
      dica: 'No norte do ^gPântano de Bayes^0 há uma tumba coberta de musgo. Leia a lápide com calma: a evidência muda tudo.'
    },
    {
      id: 'laplace', autor: 'Pierre-Simon Laplace', curto: 'Laplace', ano: 1812, cor: '#bfd8ff',
      obra: 'Teoria Analítica das Probabilidades',
      ideia: 'Somas de muitos efeitos pequenos e independentes tendem a desenhar um sino: é o Teorema Central do Limite.',
      fantasmas: [{ nome: 'Pierre-Simon Laplace', doll: 'laplace' }],
      falas: [
        [0, 'Bonsoir! Sou ^yPierre-Simon Laplace^0. Passei a vida calculando o movimento dos planetas... e os erros de quem os media.'],
        [0, 'Toda medida vem com pequenos erros, por mil motivos independentes. Somados, esses erros desenham sempre o mesmo formato: um ^ysino^0.'],
        [0, 'Mostrei isso na minha ^yTeoria Analítica das Probabilidades^0, de 1812. Hoje chamam de ^cTeorema Central do Limite^0.']
      ],
      pergunta: {
        texto: 'Você soma os pontos de 100 dados e repete isso muitas vezes. Como os totais se espalham?',
        opcoes: ['Num sino, concentrados perto de 350', 'Por igual, de 100 a 600', 'Quase sempre perto de 600'], certa: 0,
        explica: 'Cada dado vale 3,5 em média. Um total extremo exige quase todos os dados altos (ou baixos) ao mesmo tempo, o que é raríssimo.'
      },
      acerto: [[0, 'Parfait! 100 dados dão 350 em média, e os totais se amontoam ali, num sino. Lá fora, com só dois dados, o 7 já ganhava de todos.']],
      despedida: [[0, 'O eremita do bosque tem o meu nome? Que honra. Diga a ele que até o acaso obedece a leis.']],
      lapide: 'Aqui descansa ^yPIERRE-SIMON LAPLACE^0.\n"Some dois dados. Leve-me ao total que aparece de MAIS jeitos."',
      dica: 'No oeste dos ^cPicos Gaussianos^0, onze placas numeradas esperam uma soma de dados. Vá com o Traje Térmico!'
    },
    {
      id: 'pearson', autor: 'Karl Pearson', curto: 'Karl Pearson', ano: 1900, cor: '#ffd08a',
      obra: 'O critério do qui-quadrado (χ²)',
      ideia: 'O teste qui-quadrado mede o quanto o observado se afasta do esperado e diz se a diferença é grande demais para ser só acaso.',
      fantasmas: [{ nome: 'Karl Pearson', doll: 'pearson' }],
      falas: [
        [0, 'Bem-{vindo|vinda} ao deserto, onde tudo se espalha. Sou ^yKarl Pearson^0.'],
        [0, 'Em 1900, publiquei um jeito de comparar o que se ^cOBSERVA^0 com o que se ^cESPERA^0: o teste ^yqui-quadrado^0, o χ².'],
        [0, 'Para cada categoria, faça (observado − esperado)² e divida pelo esperado. Some tudo: quanto maior o χ², menos o acaso explica a diferença.'],
        [0, 'Em 1911, fundei em Londres o primeiro departamento universitário de estatística do mundo.']
      ],
      pergunta: {
        texto: 'Um dado foi lançado 60 vezes; esperamos 10 de cada face. O seis saiu 16 vezes. Quanto ele soma no χ²?',
        opcoes: ['0,6', '3,6', '6'], certa: 1,
        explica: 'Primeiro a diferença: 16 − 10 = 6. Eleve ao quadrado e divida pelo esperado.'
      },
      acerto: [[0, 'Correto: (16 − 10)² = 36, e 36 ÷ 10 = 3,6. Lá fora, a tumba ia para a face que mais fugia do esperado, não para a que mais saiu.']],
      despedida: [[0, 'Leve o meu artigo. E desconfie sempre de quem só mostra o observado sem dizer o esperado!']],
      lapide: 'Aqui descansa ^yKARL PEARSON^0.\nUm dado de 4 faces foi lançado 40 vezes: o esperado é ^y10^0 por face. Cada pilar mostra quantas vezes a sua saiu.\n"Empurre-me para a face que MAIS FOGE do esperado."',
      dica: 'No sudeste do ^yDeserto da Dispersão^0, quatro pilares contam lançamentos atrás de uma barreira de cristal.'
    },
    {
      id: 'fisher', autor: 'Ronald Fisher', curto: 'Ronald Fisher', ano: 1935, cor: '#ffe27a',
      obra: 'O Planejamento de Experimentos',
      ideia: 'Planejar antes de medir: sortear quem recebe cada tratamento (randomização), repetir e só então comparar.',
      fantasmas: [{ nome: 'Ronald Fisher', doll: 'fisher' }],
      falas: [
        [0, 'Olá! Sou ^yRonald Fisher^0. Trabalhei anos numa estação agrícola inglesa, testando adubos em canteiros.'],
        [0, 'Aprendi que o planejamento vem ANTES da coleta: ^csortear^0 qual canteiro recebe cada adubo, repetir o teste e só então comparar.'],
        [0, 'Contei isso em ^yO Planejamento de Experimentos^0, de 1935. O livro começa com uma senhora que dizia perceber, pelo gosto, se o leite foi posto antes ou depois do chá.']
      ],
      pergunta: {
        texto: 'São 8 xícaras em ordem sorteada: 4 com leite primeiro e 4 com chá primeiro. Se ela só chutasse quais são as 4 de leite primeiro, qual a chance de acertar todas?',
        opcoes: ['1 em 2', '1 em 8', '1 em 70'], certa: 2,
        explica: 'Conte de quantos jeitos dá para escolher 4 xícaras entre 8. Só um desses jeitos está certo.'
      },
      acerto: [[0, 'Isso: há 70 jeitos de escolher 4 xícaras entre 8, e só um é o certo. Acertar tudo no chute seria muito improvável, e é por isso que o teste convence.']],
      despedida: [[0, 'O fazendeiro aqui do lado tem o meu nome e capricha nos canteiros. Bom sinal!']],
      lapide: 'Aqui descansa ^yRONALD FISHER^0. "Na minha horta, cada planta aparece uma vez em cada linha e em cada coluna: é o ^cquadrado latino^0.\nPlante-me onde falta o trigo."',
      dica: 'Nos ^gCampos de Pascal^0, perto do Fazendeiro Fisher, há uma horta cercada onde nenhuma planta se repete.'
    },
    {
      id: 'breiman', autor: 'Leo Breiman', curto: 'Leo Breiman', ano: 2001, cor: '#8aff8a',
      obra: 'Florestas Aleatórias',
      ideia: 'Muitas árvores de decisão, cada uma treinada numa amostra sorteada dos dados, votam juntas e erram menos que qualquer árvore sozinha.',
      fantasmas: [{ nome: 'Leo Breiman', doll: 'breiman' }],
      falas: [
        [0, 'Ei, você chegou longe! Sou ^yLeo Breiman^0, professor de estatística em Berkeley.'],
        [0, 'Uma árvore de decisão sozinha é instável: mude um pouco os dados e ela muda inteira. Então pensei: e se fossem ^ccentenas de árvores^0?'],
        [0, 'Cada árvore aprende com uma amostra sorteada dos dados e sorteia as variáveis que vai olhar. No fim, todas ^yvotam^0. Publiquei as ^yFlorestas Aleatórias^0 em 2001.']
      ],
      pergunta: {
        texto: 'Por que a floresta costuma errar menos que uma árvore sozinha?',
        opcoes: ['Cada árvore erra de um jeito, e o voto cancela parte dos erros', 'Porque usa só a árvore mais alta', 'Porque decora os dados de treino'], certa: 0,
        explica: 'Pense nas árvores lá fora: cada uma apontava para um lado, mas a maioria acertou.'
      },
      acerto: [[0, 'Exato! Árvores treinadas em amostras diferentes erram em lugares diferentes, e no voto os erros de umas são corrigidos pelas outras.']],
      despedida: [[0, 'No mesmo ano, escrevi sobre as duas culturas da modelagem: explicar os dados ou prever bem. Nas Terras do Amanhã você viu muito da segunda!']],
      lapide: 'Aqui descansa ^yLEO BREIMAN^0.\n"Uma árvore sozinha erra. Pergunte a todas as árvores da clareira e siga a maioria."',
      dica: 'No nordeste do ^gBosque Sombrio^0, uma clareira de árvores que votam fica além de uma ponte levadiça. Algo que voe e volte talvez acione a alavanca.'
    }
  ];
  const POR_ID = {}; for (const m of MESTRES) POR_ID[m.id] = m;
  G.MESTRES = MESTRES;
  // ordem das pistas da Florence: das mais fáceis de alcançar às que pedem itens do fim do jogo
  const ORDEM_PISTA = ['fisher', 'bernoulli', 'bayes', 'pascal', 'pearson', 'laplace', 'breiman'];

  const lista = () => { const p = P(); if (!p.manuscritos) p.manuscritos = []; return p.manuscritos; };
  const tem = id => !!(P() && P().manuscritos && P().manuscritos.includes(id));
  const nMan = () => (P() && P().manuscritos ? P().manuscritos.length : 0);
  const estado = id => (P() && P().flags.tumbas && P().flags.tumbas[id]) || null;
  G.temManuscrito = tem;

  // pontuação do progresso (G.completion)
  G.progressoExtra = G.progressoExtra || [];
  G.progressoExtra.push(() => [nMan(), MESTRES.length]);
  G.HEART_PIECES_TOTAL = (G.HEART_PIECES_TOTAL || 44) - 4; // ilha do lago, bosque, deserto e vulcão viraram tumbas

  // ------------------------------------------------------------------
  //  Som e música
  // ------------------------------------------------------------------
  const A = G.audio;
  G.SFX.fantasma = () => { A.tone({ f: 660, f2: 440, d: 1.1, type: 'sine', v: 0.08, a: 0.25 }); A.tone({ f: 990, f2: 660, d: 1.0, type: 'sine', v: 0.05, a: 0.3, delay: 0.12 }); };
  G.SFX.pergaminho = () => { A.noise({ d: 0.35, v: 0.06, ft: 'bandpass', f: 2600, f2: 1200 }); };
  G.SFX.selo = () => { A.tone({ f: 130, f2: 60, d: 0.2, type: 'sine', v: 0.22 }); A.noise({ d: 0.08, v: 0.1, ft: 'lowpass', f: 700 }); };
  G.SFX.rangido = () => { A.noise({ d: 0.5, v: 0.08, ft: 'lowpass', f: 420, f2: 180 }); A.tone({ f: 72, f2: 55, d: 0.5, type: 'sawtooth', v: 0.03 }); };
  {
    const TR = A.TRACKS;
    TR.cripta = { bpm: 66, spb: 2, ch: [
      { w: 'sine', v: 0.11, s: 'A4:4 C5:4 B4:4 E4:4 F4:4 E4:4 D4:4 E4:4 A4:4 C5:4 D5:4 E5:4 F5:4 E5:4 D5:4 C5:2 B4:2' },
      { w: 'triangle', v: 0.1, s: 'A2:8 E2:8 F2:8 E2:8 A2:8 D2:8 F2:8 E2:8' },
      { w: 'noise', v: 0.006, s: 'x:16 x:16 x:16 x:16' }
    ] };
    for (const c of TR.cripta.ch) c.notes = A.parse(c.s);
  }

  // ------------------------------------------------------------------
  //  Arte: fantasmas dos autores, manuscrito e a Pena dos Mestres
  // ------------------------------------------------------------------
  G.artHooks = G.artHooks || [];
  G.artHooks.push(() => {
    const SPR = G.spr, S = G.DOLL_SKIN;
    const ESPECTROS = {
      pascal: { skin: S.claro, hair: '#3a2418', hairStyle: 'long', tunic: '#26262e', trim: '#f0f0f0', robe: true, belt: '#26262e', boots: '#14141c' },
      fermat: { skin: S.claro, hair: '#4a3020', hairStyle: 'long', tunic: '#7a1a24', trim: '#f0f0f0', robe: true, belt: '#3a0a10', boots: '#1a1010', build: 'stout' },
      bernoulli: { skin: S.claro, hair: '#e8e4dc', hairStyle: 'long', tunic: '#2a3a5a', trim: '#d8c890', robe: true, belt: '#1a2440', boots: '#1a1a24' },
      bayes: { skin: S.claro, hair: '#c8c8d0', hairStyle: 'short', tunic: '#1a1a22', trim: '#ffffff', robe: true, belt: '#1a1a22', boots: '#101016' },
      laplace: { skin: S.claro, hair: '#d8d8e0', hairStyle: 'bob', tunic: '#2a4a8a', trim: '#ffd84a', robe: true, belt: '#ffd84a', boots: '#1a2440', build: 'tall' },
      pearson: { skin: S.claro, hair: '#6a5a4a', hairStyle: 'short', mustache: true, tunic: '#3a3a44', trim: '#e8e8f0', pants: '#2a2a34', boots: '#1a1a20', build: 'tall' },
      fisher: { skin: S.claro, hair: '#c8b8a0', hairStyle: 'short', beard: '#c8b8a0', glasses: true, tunic: '#5a5a48', trim: '#e8e0c8', pants: '#3a3a30', boots: '#2a2018' },
      breiman: { skin: S.claro, hair: '#b0b0b8', hairStyle: 'short', tunic: '#4a6a8a', trim: '#e8e8f0', pants: '#3a3a4a', boots: '#2a2a30' }
    };
    // espectro: a figura em tons de azul-claro, sumindo da cintura para baixo
    const espectro = src => {
      const c = G.canvas(src.width, src.height), x = c.getContext('2d');
      x.drawImage(src, 0, 0);
      x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(176,232,255,0.55)'; x.fillRect(0, 0, c.width, c.height);
      x.globalCompositeOperation = 'destination-out';
      const g = x.createLinearGradient(0, c.height * 0.55, 0, c.height); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)');
      x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
      c.lw = G.lw(src); c.lh = G.lh(src); return c;
    };
    for (const k in ESPECTROS) {
      G.makeDoll('fant_' + k, ESPECTROS[k]);
      SPR['espectro_' + k] = espectro(SPR['fant_' + k + '_down_stand']);
      SPR['espectroRet_' + k] = G.tint(SPR['fant_' + k + '_portrait'], 'rgba(176,232,255,0.45)');
    }
    { // manuscrito enrolado com selo de cera
      const c = G.canvas(32, 32), x = c.getContext('2d');
      x.save(); x.translate(16, 15); x.rotate(-0.55);
      x.fillStyle = '#4a2a10'; x.fillRect(-14, -7, 28, 14);
      x.fillStyle = '#f2e2b8'; x.fillRect(-13, -6, 26, 12);
      x.fillStyle = '#dcc48e'; x.fillRect(-13, 2, 26, 4);
      x.fillStyle = '#fff6dc'; x.fillRect(-13, -5, 26, 2);
      for (const s of [-1, 1]) { x.fillStyle = '#6a3a14'; x.fillRect(s * 13 - 2, -8, 4, 16); x.fillStyle = '#ffd84a'; x.fillRect(s * 13 - 2, -9, 4, 2); x.fillRect(s * 13 - 2, 7, 4, 2); }
      x.fillStyle = '#c02a3a'; x.fillRect(-1, -6, 3, 12);
      x.restore();
      x.fillStyle = '#5a0a14'; x.beginPath(); x.arc(21, 21, 6, 0, TAU); x.fill();
      x.fillStyle = '#d0303e'; x.beginPath(); x.arc(21, 21, 5, 0, TAU); x.fill();
      x.fillStyle = '#ff8a94'; x.fillRect(18, 18, 2, 2);
      c.lw = 16; c.lh = 16; SPR.manuscrito = c;
    }
    { // Pena dos Mestres: pena de escrever com bico de ouro (aponta para a direita, cabo em x=0)
      const c = G.canvas(44, 12), x = c.getContext('2d');
      x.fillStyle = '#2a3a6a';
      x.beginPath(); x.moveTo(4, 6); x.quadraticCurveTo(16, -1.5, 33, 4.6); x.lineTo(33, 7.4); x.quadraticCurveTo(16, 13.5, 4, 6); x.fill();
      x.fillStyle = '#f6f2ff';
      x.beginPath(); x.moveTo(5.5, 6); x.quadraticCurveTo(16, 0.4, 32, 5.2); x.lineTo(32, 6.8); x.quadraticCurveTo(16, 11.6, 5.5, 6); x.fill();
      x.strokeStyle = '#9ab4ec'; x.lineWidth = 0.7;
      for (let i = 9; i < 31; i += 3) { x.beginPath(); x.moveTo(i, 6); x.lineTo(i - 2.5, 2.6); x.moveTo(i, 6); x.lineTo(i - 2.5, 9.4); x.stroke(); }
      x.fillStyle = '#c8a040'; x.fillRect(0, 5, 34, 2);
      x.fillStyle = '#fff0c0'; x.fillRect(0, 5, 34, 0.8);
      x.fillStyle = '#6a4a10'; x.beginPath(); x.moveTo(31, 3.2); x.lineTo(44, 6); x.lineTo(31, 8.8); x.fill();
      x.fillStyle = '#ffd84a'; x.beginPath(); x.moveTo(32, 4.1); x.lineTo(42.6, 6); x.lineTo(32, 7.9); x.fill();
      x.fillStyle = '#fff6c0'; x.fillRect(33, 4.8, 6, 0.6);
      x.fillStyle = '#2a2aa0'; x.fillRect(35, 5.7, 7, 0.6);
      c.lw = 22; c.lh = 6; SPR.swordBlade6 = c;
      const ic = G.canvas(32, 32), y = ic.getContext('2d');
      y.translate(5, 27); y.rotate(-Math.PI / 4); y.drawImage(c, 0, -6, 34, 9.3);
      ic.lw = 16; ic.lh = 16; SPR.espIcon5 = ic; SPR.penaMestresIcon = ic;
    }
  });

  // ------------------------------------------------------------------
  //  Emblemas gravados nas tumbas (7×7)
  // ------------------------------------------------------------------
  const EMB = {
    carta: ['#######', '##...##', '#.#.#.#', '#..#..#', '#.....#', '#######'],
    moeda: ['..###..', '.#...#.', '#..#..#', '#.###.#', '#..#..#', '.#...#.', '..###..'],
    balanca: ['...#...', '#######', '.#.#.#.', '#.##.#.', '...#...', '...#...', '.#####.'],
    sino: ['.......', '...#...', '..#.#..', '..#.#..', '.#...#.', '#.....#', '#######'],
    trigo: ['.#.#.#.', '..###..', '.#.#.#.', '..###..', '.#.#.#.', '...#...', '...#...'],
    arvore: ['..###..', '.#####.', '#######', '.#####.', '...#...', '...#...', '..###..']
  };
  function glifo(ctx, g, x, y, cor, px = 1) {
    ctx.fillStyle = cor;
    g.forEach((l, j) => { for (let i = 0; i < l.length; i++) if (l[i] === '#') ctx.fillRect(x + i * px, y + j * px, px, px); });
  }
  const EMBLEMA = { pascal: 'carta', bernoulli: 'moeda', bayes: 'balanca', laplace: 'sino', fisher: 'trigo', breiman: 'arvore' };
  // desenha o emblema (ou a letra/sinal) centrado em (cx, cy)
  function emblema(ctx, id, letra, cx, cy, cor, px = 1) {
    if (letra) { G.text(letra, cx, cy - 3 * px, cor, { align: 'center', shadow: false }); return; }
    const g = EMB[EMBLEMA[id]]; if (!g) return;
    glifo(ctx, g, cx - 3.5 * px, cy - g.length / 2 * px, cor, px);
  }

  // tumba de pedra (pegada de 16×16; a tampa sobe um pouco acima)
  function desenhaTumba(ctx, sx, sy, id, o = {}) {
    ctx.fillStyle = '#1e1a24'; ctx.fillRect(sx, sy - 5, 16, 21);
    ctx.fillStyle = '#5e5868'; ctx.fillRect(sx + 0.5, sy + 1.5, 15, 14);
    ctx.fillStyle = '#4a4454'; ctx.fillRect(sx + 0.5, sy + 13, 15, 2.5);
    ctx.fillStyle = '#8a8496'; ctx.fillRect(sx + 0.5, sy - 4.5, 15, 6.5);
    ctx.fillStyle = '#aea8ba'; ctx.fillRect(sx + 1, sy - 4, 14, 1);
    ctx.fillStyle = '#3c3646'; ctx.fillRect(sx + 0.5, sy + 1.5, 15, 1);
    ctx.fillStyle = '#6e6878'; ctx.fillRect(sx + 3, sy - 2.5, 10, 2.5);
    if (o.musgo) {
      ctx.fillStyle = '#3a7a3a'; for (const [a, b, w, h] of [[0.5, -4.5, 5, 2], [11, -4.5, 4.5, 3], [0.5, 9, 3, 5], [12.5, 6, 3, 8], [5, 13.5, 6, 2]]) ctx.fillRect(sx + a, sy + b, w, h);
      ctx.fillStyle = '#5aa84a'; for (const [a, b] of [[1, -4], [12, -4], [1, 10], [13, 7], [6, 14]]) ctx.fillRect(sx + a, sy + b, 2, 1);
    }
    ctx.fillStyle = '#3a3444'; ctx.fillRect(sx + 3, sy + 11, 2, 0.6); ctx.fillRect(sx + 4.5, sy + 11.5, 0.6, 1.5);
    const brilho = o.aceso ? '#ffe27a' : '#c8a040';
    if (o.aceso) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, sx + 8, sy + 8, 9, '#ffd84a', 0.25); ctx.restore(); }
    if (id === 'pearson') G.text('χ²', sx + 8, sy + 5, brilho, { align: 'center', shadow: false });
    else emblema(ctx, id, o.letra, sx + 8, sy + 8, brilho);
  }

  // ------------------------------------------------------------------
  //  Entidades do mundo: tumba, escada, árvores que votam, horta,
  //  placas das somas, pilares das contagens, alavanca e ponte levadiça
  // ------------------------------------------------------------------
  class Tumba extends G.PushBlock {
    constructor(o) {
      super(o.x, o.y, null, {});
      this.o.onMoved = () => this.parou();
      this.cfg = o; this.m = POR_ID[o.mestre]; this.nome = o.nome; this.room = -1;
      this.treme = 0; this.recusaT = 0; this.lances = 0; this.caras = 0;
      if (o.limites) this.bounds = { x: o.limites[0] * TS, y: o.limites[1] * TS, w: o.limites[2] * TS, h: o.limites[3] * TS };
      const st = estado(this.m.id);
      if (st) {
        const pos = st.pos && st.pos[this.nome];
        if (pos) { this.x = this.tx = pos[0]; this.y = this.ty = pos[1]; }
        this.o.locked = true;
      }
    }
    get darkGlow() { return 16; }
    push(dir, puller = null) {
      if (this.moving || this.o.locked) { if (!this.moving && this.o.locked && this.recusaT <= 0) { this.recusaT = 1; this.treme = 0.25; G.sfx('bump'); } return; }
      const r = this.cfg.regra;
      if (r === 'direcao' && dir !== this.cfg.certa) { this.recusar(); return; }
      if (r === 'insistir') { this.insistir(dir, puller); return; }
      super.push(dir, puller);
    }
    // direção errada: a tumba range, não cede e um arrepio atravessa o herói
    recusar() {
      if (this.recusaT > 0) return;
      this.recusaT = 1.4; this.treme = 0.5;
      G.sfx('rangido'); G.shake(1.5, 0.3);
      G.fx.burst(this.cx, this.y - 2, ['#bfe8ff', '#ffffff'], 10, 50);
      G.hurtPlayer(2, this.cx, this.cy, { force: true });
      G.ui.toast('A tumba não cede para esse lado... e um arrepio gelado atravessa você. Releia a lápide!', '#bfe8ff');
    }
    // Bernoulli: cada empurrão lança 100 moedas; depois de mil lances, a tumba cede
    insistir(dir, puller) {
      if (this.recusaT > 0) return;
      this.recusaT = 0.25; this.treme = 0.3; this.lances++;
      let c = 0; for (let i = 0; i < 100; i++) if (Math.random() < 0.5) c++;
      this.caras += c;
      const n = this.lances * 100, pct = this.caras / n * 100;
      G.sfx('flip');
      for (let i = 0; i < 4; i++) G.fx.glow(this.cx + G.rf(-6, 6), this.y - 4, { size: 2, color: G.pick(['#ffd84a', '#fff4c0']), vy: -G.rf(30, 60), vx: G.rf(-20, 20), life: 0.5 });
      G.fx.text(this.cx, this.y - 12, n + ' lances: ' + virgula(pct) + '% caras', '#ffd84a');
      if (this.lances < 10) return;
      G.ui.toast('Mil lances: ' + virgula(pct) + '% de caras, bem perto de 1/2. A Lei dos Grandes Números!', '#ffd84a');
      for (const d of [dir, 3, 2, 0, 1]) {
        const v = G.DIRS[d];
        if (this.canGo(this.x + v.x * TS, this.y + v.y * TS, puller)) { super.push(d, d === dir ? puller : null); return; }
      }
    }
    parou() {
      if (estado(this.m.id)) return;
      const tx = Math.round(this.x / TS), ty = Math.round(this.y / TS), r = this.cfg.regra;
      if (r === 'direcao' || r === 'insistir') { abrir(this.m, [Math.round(this.home.x / TS), Math.round(this.home.y / TS)], [this]); return; }
      if (r === 'alvo') {
        if (this.cfg.somas !== undefined) { // Laplace: placas das somas de dois dados
          const s = tx - this.cfg.somas + 2, k = 6 - Math.abs(s - 7);
          G.ui.toast('Soma ' + s + ': ' + k + (k === 1 ? ' jeito' : ' jeitos') + ' em 36.', '#bfd8ff');
        }
        for (const [ex, ey, msg] of this.cfg.errado || []) if (tx === ex && ty === ey) { G.sfx('wrong'); this.treme = 0.4; G.ui.toast(msg, '#ffe27a'); }
        if (tx === this.cfg.alvo[0] && ty === this.cfg.alvo[1]) abrir(this.m, [Math.round(this.home.x / TS), Math.round(this.home.y / TS)], [this]);
        return;
      }
      if (r === 'juntar') { // Pascal e Fermat: alinhados, com uma casa livre entre os dois
        const par = G.ents.filter(e => e instanceof Tumba && !e.dead && e.m === this.m);
        if (par.length < 2 || par.some(e => e.moving)) return;
        const [a, b] = par.map(e => [Math.round(e.x / TS), Math.round(e.y / TS)]);
        const dx = Math.abs(a[0] - b[0]), dy = Math.abs(a[1] - b[1]);
        if ((dx === 2 && dy === 0) || (dy === 2 && dx === 0)) abrir(this.m, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], par);
      }
    }
    update(dt) {
      super.update(dt);
      if (this.treme > 0) this.treme -= dt;
      if (this.recusaT > 0) this.recusaT -= dt;
    }
    draw(ctx, cam) {
      const tr = this.treme > 0 ? Math.sin(this.t * 60) * 1.2 : 0;
      const sx = Math.round(this.x - cam.x) + tr, sy = Math.round(this.y - cam.y);
      G.shadow(ctx, sx + 8, sy + 15, 17, 0.3);
      desenhaTumba(ctx, sx, sy, this.m.id, { musgo: this.cfg.musgo, letra: this.cfg.letra, aceso: !!estado(this.m.id) });
    }
  }

  // revela a escada e grava a solução (posição das tumbas e da escada)
  function abrir(m, [ex, ey], tumbas) {
    const p = P(); p.flags.tumbas = p.flags.tumbas || {};
    const pos = {}; for (const t of tumbas) { pos[t.nome] = [t.x, t.y]; t.o.locked = true; }
    p.flags.tumbas[m.id] = { escada: [ex, ey], pos };
    const esc = G.addEnt(new Escada(ex, ey, m, true)); esc.room = -1;
    const primeira = !p.flags.tumbaVista; p.flags.tumbaVista = true;
    G.runScript(async () => {
      G.sfx('rangido'); G.shake(2.5, 0.7);
      G.fx.smoke(esc.cx, esc.cy, 14, '#c8c0b0', 40);
      await G.wait(0.9);
      G.sfx('secret');
      if (primeira) await say(null, 'A tumba deslizou com um rangido... e revelou uma ^yescadinha de pedra^0 descendo para o escuro.');
      G.saveGame();
    });
  }

  class Escada extends G.Ent {
    constructor(tx, ty, m, revelar) { super(tx * TS, ty * TS, 16, 16); this.m = m; this.room = -1; this.armada = false; this.surge = revelar ? 0 : 1; }
    get by() { return this.y - 1000; }
    get darkGlow() { return 20; }
    update(dt) {
      this.t += dt;
      if (this.surge < 1) { this.surge = Math.min(1, this.surge + dt / 0.9); if (Math.random() < 0.5) G.fx.spawn({ x: this.x + G.rf(2, 14), y: this.y + G.rf(2, 14), vy: -10, life: 0.5, color: '#b8b0a0', size: 1.4, kind: 'puff' }); }
      const p = G.player; if (!p) return;
      const pe = p.y + p.h, dentro = p.cx > this.x + 3 && p.cx < this.x + 13 && pe > this.y + 4 && pe < this.y + 16;
      if (!dentro) { this.armada = true; return; }
      if (this.armada && this.surge >= 1 && p.state === 'normal' && p.z <= 0 && !G.cutscene && !G.trans) { this.armada = false; G.runScript(() => entrarCripta(this.m)); }
    }
    draw(ctx, cam) {
      const x = Math.round(this.x - cam.x), y = Math.round(this.y - cam.y), k = this.surge;
      ctx.save(); ctx.globalAlpha = k;
      ctx.fillStyle = '#7a7266'; ctx.fillRect(x, y, 16, 16);
      ctx.fillStyle = '#05040a'; ctx.fillRect(x + 1.5, y + 1.5, 13, 13);
      const deg = ['#8a8274', '#5e584e', '#3c3832', '#22201c'];
      for (let i = 0; i < 4; i++) { ctx.fillStyle = deg[i]; ctx.fillRect(x + 2, y + 2 + i * 3.2, 12, 2.2); }
      ctx.fillStyle = '#a8a090'; ctx.fillRect(x, y, 16, 1);
      ctx.restore();
      G.light.add(x + 8, y + 10, 18, '#9adcff', 0.25 * k);
    }
  }

  class ArvoreVoto extends G.Ent {
    constructor(x, y, dir) { super(x + 2, y + 6, 12, 10); this.solid = true; this.dir = dir; this.room = -1; }
    draw(ctx, cam) {
      const x = Math.round(this.x - 2 - cam.x), y = Math.round(this.y - 6 - cam.y);
      G.shadow(ctx, x + 8, y + 15, 15, 0.3);
      ctx.fillStyle = '#2a1608'; ctx.fillRect(x + 5.5, y + 1, 5, 15);
      ctx.fillStyle = '#6a4424'; ctx.fillRect(x + 6, y + 1, 4, 15);
      ctx.fillStyle = '#8a5a30'; ctx.fillRect(x + 6, y + 1, 1, 15);
      for (const [cx, cy, r, c] of [[8, -4, 9, '#0c2e18'], [7, -5, 7.8, '#1e5a30'], [6, -7, 5, '#2e7a40'], [5, -8, 2.5, '#4a9a52']]) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + cx, y + cy, r, 0, TAU); ctx.fill(); }
      // tabuleta com a seta do voto
      ctx.fillStyle = '#3a2410'; ctx.fillRect(x + 2.5, y + 6, 11, 7);
      ctx.fillStyle = '#d8b070'; ctx.fillRect(x + 3, y + 6.5, 10, 6);
      G.text(['↓', '↑', '←', '→'][this.dir], x + 8, y + 7, '#3a1a08', { align: 'center', shadow: false });
    }
  }

  const PLANTA_COR = { trigo: '#ffd84a', milho: '#7ad84a', abobora: '#ff8a2a' };
  class Plantio extends G.Ent {
    constructor(x, y, tipo) { super(x + 1, y + 4, 14, 11); this.solid = !!tipo; this.tipo = tipo; this.room = -1; }
    get by() { return this.tipo ? this.y + this.h : this.y - 1000; }
    draw(ctx, cam) {
      const x = Math.round(this.x - 1 - cam.x), y = Math.round(this.y - 4 - cam.y);
      ctx.fillStyle = '#4a2c14'; ctx.fillRect(x + 1, y + 2, 14, 13);
      ctx.fillStyle = '#6a4224'; for (let i = 0; i < 4; i++) ctx.fillRect(x + 1.5, y + 3 + i * 3.2, 13, 1.6);
      if (!this.tipo) return;
      if (this.tipo === 'trigo') for (let i = 0; i < 5; i++) {
        const bx = x + 3 + i * 2.5, h = 8 + (i % 2) * 2;
        ctx.fillStyle = '#b8902a'; ctx.fillRect(bx, y + 12 - h, 0.8, h);
        ctx.fillStyle = '#ffd84a'; ctx.fillRect(bx - 0.8, y + 10 - h, 2.4, 4);
        ctx.fillStyle = '#fff0a0'; ctx.fillRect(bx - 0.4, y + 10 - h, 0.8, 1.5);
      } else if (this.tipo === 'milho') for (let i = 0; i < 3; i++) {
        const bx = x + 3.5 + i * 4;
        ctx.fillStyle = '#2a7a2a'; ctx.fillRect(bx, y - 4, 1.4, 16);
        ctx.fillStyle = '#4aa83a'; ctx.fillRect(bx - 2.5, y + 2, 3, 1); ctx.fillRect(bx + 1, y - 1, 3, 1);
        ctx.fillStyle = '#ffd84a'; ctx.fillRect(bx + 1.4, y + 3, 2, 4);
        ctx.fillStyle = '#7ad84a'; ctx.fillRect(bx + 1.4, y + 6.5, 2, 1.2);
      } else {
        ctx.fillStyle = '#2a6a2a'; ctx.fillRect(x + 3, y + 4, 4, 3); ctx.fillRect(x + 10, y + 3, 3, 3);
        ctx.fillStyle = '#7a2a08'; ctx.beginPath(); ctx.ellipse(x + 8, y + 10, 6.5, 4.5, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#ff8a2a'; ctx.beginPath(); ctx.ellipse(x + 8, y + 9.6, 5.8, 4, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#d8601a'; ctx.fillRect(x + 5.5, y + 6.5, 0.8, 6.5); ctx.fillRect(x + 10, y + 6.5, 0.8, 6.5);
        ctx.fillStyle = '#ffc070'; ctx.fillRect(x + 4, y + 7.5, 2, 1);
        ctx.fillStyle = '#3a6a1a'; ctx.fillRect(x + 7.5, y + 4, 1.5, 2.5);
      }
    }
  }

  class PainelSomas extends G.Ent {
    constructor(x, y) { super(x, y, 11 * TS, TS); this.room = -1; }
    get by() { return this.y - 1000; }
    draw(ctx, cam) {
      const x0 = Math.round(this.x - cam.x), y0 = Math.round(this.y - cam.y);
      for (let i = 0; i < 11; i++) {
        const s = i + 2, k = 6 - Math.abs(s - 7), x = x0 + i * TS;
        ctx.fillStyle = '#2a3448'; ctx.fillRect(x + 1, y0 + 1, 14, 14);
        ctx.fillStyle = s === 7 ? '#6a86b0' : '#4e6080'; ctx.fillRect(x + 1.5, y0 + 1.5, 13, 13);
        ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(x + 1.5, y0 + 1.5, 13, 1);
        G.text(String(s), x + 8, y0 + 5, '#e8f4ff', { align: 'center', shadow: false });
        // histograma em relevo na rocha atrás: uma pedra por jeito de somar
        for (let j = 0; j < k; j++) { ctx.fillStyle = '#1a2234'; ctx.fillRect(x + 2.5, y0 - 5 - j * 4.5, 11, 4); ctx.fillStyle = j === k - 1 ? '#e8f0ff' : '#a8bcd8'; ctx.fillRect(x + 3, y0 - 4.5 - j * 4.5, 10, 3); }
      }
    }
  }

  class PilarContagem extends G.Ent {
    constructor(x, y, n) { super(x + 1, y + 2, 14, 14); this.solid = true; this.n = n; this.room = -1; }
    draw(ctx, cam) {
      const x = Math.round(this.x - 1 - cam.x), y = Math.round(this.y - 2 - cam.y);
      G.shadow(ctx, x + 8, y + 15, 15, 0.3);
      ctx.fillStyle = '#4a2a10'; ctx.fillRect(x + 2, y - 15, 12, 30);
      ctx.fillStyle = '#d0a060'; ctx.fillRect(x + 2.5, y - 14, 11, 28);
      ctx.fillStyle = '#ecc488'; ctx.fillRect(x + 2.5, y - 14, 3, 28);
      ctx.fillStyle = '#a87838'; ctx.fillRect(x + 11, y - 14, 2.5, 28);
      ctx.fillStyle = '#4a2a10'; ctx.fillRect(x + 0.5, y - 17.5, 15, 4.5); ctx.fillRect(x + 0.5, y + 11, 15, 4.5);
      ctx.fillStyle = '#b88848'; ctx.fillRect(x + 1, y - 17, 14, 3.5); ctx.fillRect(x + 1, y + 11.5, 14, 3.5);
      ctx.fillStyle = '#2a1608'; ctx.fillRect(x + 3, y - 8, 10, 9);
      G.text(String(this.n), x + 8, y - 6, '#ffd84a', { align: 'center', shadow: false });
    }
  }

  // ponte levadiça da clareira de Breiman: a alavanca fica do outro lado do fosso
  class Ponte extends G.Ent {
    constructor(x, y, n) { super(x, y, TS, n * TS); this.n = n; this.room = -1; this.k = G.flag('ponteBreiman') ? 1 : 0; if (this.k) this.assentar(); }
    get by() { return this.y - 1000; }
    assentar() { const tx = Math.round(this.x / TS), ty = Math.round(this.y / TS); for (let i = 0; i < this.n; i++) G.map.set(tx, ty + i, T.BRIDGE); }
    async baixar() {
      G.setFlag('ponteBreiman');
      G.sfx('reel'); G.shake(1.5, 1);
      for (let i = 0; i <= 30; i++) { this.k = i / 30; await G.wait(1 / 30); }
      this.assentar(); G.sfx('land'); G.shake(2, 0.2);
      G.fx.smoke(this.cx, this.y + this.h, 8, '#c8b090', 30);
    }
    draw(ctx, cam) {
      if (this.k >= 1) return;
      const x = Math.round(this.x - cam.x), y = Math.round(this.y - cam.y), comp = this.n * TS * this.k;
      // tábuas descendo sobre o fosso
      if (comp > 0) { ctx.fillStyle = '#3a2410'; ctx.fillRect(x + 1, y, 14, comp); ctx.fillStyle = '#9a6a3a'; for (let j = 0; j < comp - 1; j += 4) ctx.fillRect(x + 1.5, y + j, 13, 3); }
      // a parte ainda erguida, vista de cima: um painel de tábuas de pé na margem
      const alt = 22 * (1 - this.k);
      ctx.fillStyle = '#3a2410'; ctx.fillRect(x + 1, y - alt, 14, alt);
      ctx.fillStyle = '#b07a44'; for (let j = 0; j < alt - 1; j += 4) ctx.fillRect(x + 1.5, y - alt + j + 0.5, 13, 3);
      ctx.fillStyle = '#8a8a96'; ctx.fillRect(x - 1, y - alt, 1, alt); ctx.fillRect(x + 16, y - alt, 1, alt);
    }
  }
  class Alavanca extends G.Ent {
    constructor(x, y, ponte) { super(x + 3, y + 8, 10, 7); this.solid = true; this.ponte = ponte; this.room = -1; this.puxada = G.flag('ponteBreiman'); }
    capeloBox() { return { x: this.x - 5, y: this.y - 16, w: this.w + 10, h: this.h + 20 }; }
    get darkGlow() { return 14; }
    onCapelo() {
      if (this.puxada) return;
      this.puxada = true; G.sfx('switch');
      const ponte = G.ents.find(e => e instanceof Ponte && !e.dead);
      if (ponte) G.runScript(async () => { await ponte.baixar(); await say(null, 'A alavanca virou e a ^yponte levadiça^0 desceu sobre o fosso!'); G.saveGame(); });
    }
    interact() { if (!this.puxada) this.onCapelo(); }
    draw(ctx, cam) {
      const x = Math.round(this.x - 3 - cam.x), y = Math.round(this.y - 8 - cam.y);
      G.shadow(ctx, x + 8, y + 15, 12, 0.3);
      ctx.fillStyle = '#2a2a34'; ctx.fillRect(x + 3, y + 9, 10, 6);
      ctx.fillStyle = '#6a6a7a'; ctx.fillRect(x + 3.5, y + 9.5, 9, 5);
      ctx.save(); ctx.translate(x + 8, y + 11); ctx.rotate(this.puxada ? 0.7 : -0.7);
      ctx.fillStyle = '#3a2410'; ctx.fillRect(-1, -11, 2, 11);
      ctx.fillStyle = '#c03a3a'; ctx.beginPath(); ctx.arc(0, -11, 2.4, 0, TAU); ctx.fill();
      ctx.restore();
    }
  }

  // ------------------------------------------------------------------
  //  Onde ficam as tumbas (coordenadas locais de cada região)
  //  planta: '#' rocha, 'T' árvore, '~' água, '.' chão, 'f' cerca,
  //  'C' parede rachada (bombas), 'X' barreira de cristal (raio)
  // ------------------------------------------------------------------
  const SITIOS = [
    { m: 'pascal', reg: 'vulcao', x0: 35, y0: 18, planta: [
      '#########',
      '#.......#',
      '#.......#',
      '#.......#',
      '####C####',
      ' ....... '],
      no: [39, 24], lapide: [36, 23],
      tumbas: [{ nome: 'pascal', at: [37, 20], regra: 'juntar', letra: 'P', primeira: true }, { nome: 'fermat', at: [41, 20], regra: 'juntar', letra: 'F' }] },
    { m: 'bernoulli', reg: 'lago', lapide: [33, 15],
      tumbas: [{ at: [32, 16], regra: 'insistir', primeira: true }] },
    // clareira aberta: as árvores altas em volta esconderiam a tumba
    { m: 'bayes', reg: 'pantano', x0: 29, y0: 2, planta: [
      '.......',
      '.......',
      '.......',
      '.......',
      '.......',
      ' ..... '],
      no: [30, 8], lapide: [34, 6],
      tumbas: [{ at: [32, 4], regra: 'direcao', certa: 0, musgo: true, primeira: true }] },
    { m: 'laplace', reg: 'montanha', x0: 2, y0: 19, planta: [
      '###############',
      '###############',
      '#.............#',
      '#.............#',
      '#.#############',
      ' .....'],
      no: [3, 25], lapide: [6, 24],
      tumbas: [{ at: [4, 21], regra: 'alvo', alvo: [9, 21], limites: [4, 21, 11, 1], somas: 4, primeira: true }],
      extras: [{ type: 'painelSomas', at: [4, 21] }] },
    // o pilar do sul fica uma casa mais longe: os pilares são altos e cobririam a tumba empurrada
    { m: 'pearson', reg: 'deserto', x0: 37, y0: 20, planta: [
      '#######',
      '#.....#',
      '#.....#',
      '#.....#',
      '#.....#',
      '#.....#',
      '#.....#',
      '##X####',
      ' ..... '],
      no: [39, 28], lapide: [41, 28],
      tumbas: [{ at: [40, 23], regra: 'direcao', certa: 0, primeira: true }],
      extras: [{ type: 'pilarContagem', at: [40, 21], n: 12 }, { type: 'pilarContagem', at: [42, 23], n: 9 }, { type: 'pilarContagem', at: [40, 26], n: 3 }, { type: 'pilarContagem', at: [38, 23], n: 16 }] },
    { m: 'fisher', reg: 'planicie', x0: 2, y0: 21, planta: [
      '         ..',
      'fffffffff.f',
      'f.........f',
      'f.........f',
      'f.........f',
      'f.........f',
      'f.........f',
      'fffffffffff'],
      no: [11, 20], lapide: [12, 21],
      tumbas: [{ at: [9, 24], regra: 'alvo', alvo: [7, 25], limites: [3, 23, 9, 5], primeira: true,
        errado: [[7, 24, 'Trigo de novo na mesma linha? No quadrado latino, cada planta aparece uma só vez em cada linha e em cada coluna.']] }],
      extras: [['trigo', 5, 24], ['milho', 6, 24], [null, 7, 24], ['milho', 5, 25], ['abobora', 6, 25], [null, 7, 25], ['abobora', 5, 26], ['trigo', 6, 26], ['milho', 7, 26]].map(([tipo, x, y]) => ({ type: 'plantio', tipo, at: [x, y] })) },
    { m: 'breiman', reg: 'floresta', x0: 36, y0: 2, planta: [
      'TTTTTTTTTT',
      'T........T',
      'T........T',
      'T........T',
      'T........T',
      'T~~~~~~~~T',
      'T~~~~~~~~T',
      'T~~~~~~~~T',
      'T~~~~~~~~T',
      '..........'],
      no: [40, 12], lapide: [37, 6],
      placas: [[38, 11, '^gCLAREIRA DAS ÁRVORES QUE VOTAM^0\nA ponte levadiça só desce quando alguém vira a alavanca do outro lado do fosso.']],
      tumbas: [{ at: [40, 5], regra: 'direcao', certa: 3, primeira: true }],
      extras: [[38, 3, 3], [40, 3, 1], [42, 3, 3], [44, 3, 0], [44, 5, 3]].map(([x, y, dir]) => ({ type: 'arvoreVoto', dir, at: [x, y] }))
        .concat([{ type: 'ponteBreiman', at: [40, 7], n: 4 }, { type: 'alavancaBreiman', at: [43, 6] }]) }
  ];
  G.SITIOS_MESTRES = SITIOS;

  G.worldExtras = G.worldExtras || [];
  G.worldExtras.push(h => {
    const LEG = { '#': T.CLIFF, 'T': T.TREE, '~': T.WATER, '.': T.GROUND, 'f': T.FENCE, 'C': T.CRACKED, 'X': T.BARRIER };
    for (const s of SITIOS) {
      const R = h.regionOf(s.reg), A = (lx, ly) => [R.ox + lx, R.oy + ly];
      if (s.planta) s.planta.forEach((linha, j) => {
        for (let i = 0; i < linha.length; i++) {
          const c = linha[i]; if (c === ' ') continue;
          const [X, Y] = A(s.x0 + i, s.y0 + j), k = h.idx(X, Y);
          h.wall[k] = 0; h.prot[k] = 1; h.block[k] = 1; h.setT(X, Y, LEG[c]);
        }
      });
      if (s.no) h.nodes[s.reg].push(A(...s.no));
      const chao = (X, Y) => { const k = h.idx(X, Y); h.wall[k] = 0; h.prot[k] = 1; if (h.map.get(X, Y) !== T.PATH) h.setT(X, Y, T.GROUND); };
      const placas = (s.placas || []).slice(); if (s.lapide) placas.unshift([...s.lapide, POR_ID[s.m].lapide, 'Lápide']);
      for (const [lx, ly, text, nome] of placas) { const [X, Y] = A(lx, ly); chao(X, Y); h.objects.push({ type: 'lapide', x: X * TS, y: Y * TS, text, nome: nome || 'Placa' }); }
      for (const t of s.tumbas) {
        const [X, Y] = A(...t.at);
        h.objects.push(Object.assign({}, t, {
          type: 'tumba', mestre: s.m, nome: t.nome || s.m, x: X * TS, y: Y * TS,
          alvo: t.alvo && A(...t.alvo), errado: t.errado && t.errado.map(([x, y, msg]) => [...A(x, y), msg]),
          limites: t.limites && [R.ox + t.limites[0], R.oy + t.limites[1], t.limites[2], t.limites[3]], somas: t.somas !== undefined ? R.ox + t.somas : undefined
        }));
      }
      for (const e of s.extras || []) { const [X, Y] = A(...e.at); h.objects.push(Object.assign({}, e, { x: X * TS, y: Y * TS })); }
    }
  });

  G.SPAWN = G.SPAWN || {};
  G.SPAWN.lapide = o => new G.Sign(o.x, o.y, o.text, { name: o.nome });
  G.SPAWN.tumba = o => {
    const t = new Tumba(o), st = estado(o.mestre);
    if (st && o.primeira) { const e = G.addEnt(new Escada(st.escada[0], st.escada[1], POR_ID[o.mestre], false)); e.room = -1; }
    return t;
  };
  G.SPAWN.arvoreVoto = o => new ArvoreVoto(o.x, o.y, o.dir);
  G.SPAWN.plantio = o => new Plantio(o.x, o.y, o.tipo);
  G.SPAWN.painelSomas = o => new PainelSomas(o.x, o.y);
  G.SPAWN.pilarContagem = o => new PilarContagem(o.x, o.y, o.n);
  G.SPAWN.ponteBreiman = o => new Ponte(o.x, o.y, o.n);
  G.SPAWN.alavancaBreiman = o => new Alavanca(o.x, o.y);

  // ------------------------------------------------------------------
  //  Criptas: uma sala de masmorra só, com a escada de volta embaixo
  // ------------------------------------------------------------------
  const tema = (base, o) => Object.assign({}, G.THEMES[base], { dun: true }, o);
  Object.assign(G.THEMES, {
    cr_pascal: tema('d4', { floor: 'checker', wall: 'bricks', f: ['#1e1410', '#2e2018', '#40301e', '#56422a', '#72583a'], wl: ['#0a0604', '#1e120c', '#301e14', '#462c1e', '#62402a'], acc: '#ffb84a', moss: '#4a2a1a', ca: ['#7a1a1a', '#ffd84a'], amb: '#5a4a42' }),
    cr_bernoulli: tema('d1', { floor: 'tiles', wall: 'blocks', f: ['#1a2230', '#26324a', '#34445e', '#465a78', '#64789a'], wl: ['#080a12', '#141a28', '#20283c', '#303a52', '#4a5672'], acc: '#bfe8ff', moss: '#3a5a6a', ca: ['#2a4a8a', '#e8f4ff'], amb: '#46506a' }),
    cr_bayes: tema('d1', { floor: 'tiles', wall: 'bricks', f: ['#18241c', '#223428', '#2e4434', '#3e5a44', '#587a5e'], wl: ['#060c08', '#122016', '#1e3022', '#2c4430', '#46624a'], acc: '#8affc0', moss: '#4a9a4a', ca: ['#2a6a3a', '#c8ffd8'], amb: '#46584c' }),
    cr_laplace: tema('d5', { floor: 'tiles', wall: 'blocks', f: ['#141a30', '#1e2644', '#2a345a', '#3a4874', '#56689a'], wl: ['#05070f', '#0e1222', '#181e36', '#262e4e', '#3e4a72'], acc: '#e8f0ff', moss: '#3a4a7a', ca: ['#2a3a8a', '#ffffff'], amb: '#3e4668' }),
    cr_pearson: tema('d3', { floor: 'sand', wall: 'blocks', f: ['#5a3e24', '#74522e', '#90683c', '#ac844e', '#c8a066'], wl: ['#22140a', '#3e2616', '#5a3a20', '#7a522e', '#9c6e40'], acc: '#ffd08a', moss: '#a88a50', ca: ['#8a4a1a', '#ffd84a'], amb: '#6a5848' }),
    cr_fisher: tema('d2', { floor: 'planks', wall: 'bricks', f: ['#3a2a1a', '#523c26', '#6a5032', '#866a42', '#a88a58'], wl: ['#120c06', '#2a1c10', '#3e2c1a', '#564026', '#745a38'], acc: '#ffe27a', moss: '#6a8a3a', ca: ['#5a6a2a', '#ffe27a'], amb: '#5e5444' }),
    cr_breiman: tema('d2', { floor: 'planks', wall: 'roots', f: ['#1e2a18', '#2a3a20', '#384c2a', '#4a6236', '#647e48'], wl: ['#080c06', '#16200e', '#243218', '#344824', '#4c6436'], acc: '#8aff8a', moss: '#3a8a3a', ca: ['#2a6a2a', '#c8ffb0'], amb: '#46543e' })
  });
  for (const m of MESTRES) G.DUNGEONS['cr_' + m.id] = { name: 'Cripta de ' + m.curto, theme: 'cr_' + m.id, music: 'cripta', topic: 'media', grid: [1, 1], rooms: { S: { at: [0, 0], type: 'cripta', opt: { mestre: m.id } } }, doors: [] };

  class Decor extends G.Ent {
    constructor(x, y, w, h, desenho, o = {}) { super(x, y, w, h); this.solid = !!o.solido; this.desenho = desenho; this.plano = !!o.plano; this.luz = o.luz; }
    get by() { return this.plano ? this.y - 1000 : this.y + this.h; }
    update(dt) { this.t += dt; }
    draw(ctx, cam) {
      const x = Math.round(this.x - cam.x), y = Math.round(this.y - cam.y);
      this.desenho(ctx, x, y, this.t);
      if (this.luz) G.light.add(x + this.w / 2, y + this.h / 2 - 6, this.luz[0], this.luz[1], this.luz[2] || 0.5);
    }
  }

  // sarcófago no fundo da cripta, com o nome na tampa
  class Sarcofago extends G.Ent {
    constructor(x, y, w, m, rotulo, letra) { super(x, y + 6, w, 16); this.solid = true; this.m = m; this.rotulo = rotulo; this.letra = letra; }
    interact() { G.runScript(() => encontro(this)); }
    update(dt) { this.t += dt; }
    draw(ctx, cam) {
      const x = Math.round(this.x - cam.x), y = Math.round(this.y - 6 - cam.y), w = this.w, cx = x + w / 2;
      G.shadow(ctx, cx, y + 22, w + 4, 0.35);
      ctx.fillStyle = '#16121c'; ctx.fillRect(x - 1, y - 3, w + 2, 26); ctx.fillRect(x - 2, y + 20, w + 4, 4);
      ctx.fillStyle = '#5a5464'; ctx.fillRect(x, y + 6, w, 16);
      ctx.fillStyle = '#46404e'; ctx.fillRect(x, y + 19, w, 3);
      ctx.fillStyle = '#6e687a'; ctx.fillRect(x - 1.5, y + 20.5, w + 3, 3); // rodapé
      ctx.fillStyle = '#8c8698'; ctx.fillRect(x - 0.5, y - 2.5, w + 1, 9);
      ctx.fillStyle = '#b2acbe'; ctx.fillRect(x, y - 2, w, 1);
      ctx.fillStyle = '#3a3444'; ctx.fillRect(x, y + 6, w, 1);
      // moldura entalhada na frente
      ctx.strokeStyle = '#3e3848'; ctx.lineWidth = 1; ctx.strokeRect(x + 3.5, y + 8.5, w - 7, 10);
      ctx.strokeStyle = '#7a7486'; ctx.lineWidth = 0.5; ctx.strokeRect(x + 4.5, y + 9.5, w - 9, 8);
      // plaquinha com o nome
      const tw = G.textW(this.rotulo) + 6;
      ctx.fillStyle = '#c8a040'; ctx.fillRect(cx - tw / 2, y - 1, tw, 7);
      ctx.fillStyle = '#efd480'; ctx.fillRect(cx - tw / 2 + 0.5, y - 0.5, tw - 1, 6);
      G.text(this.rotulo, cx, y + 0.5, '#4a2a10', { align: 'center', shadow: false });
      const aceso = tem(this.m.id);
      if (aceso) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, cx, y + 14, 12, '#ffd84a', 0.2); ctx.restore(); }
      if (this.m.id === 'pearson') G.text('χ²', cx, y + 10, '#c8a040', { align: 'center', shadow: false });
      else emblema(ctx, this.m.id, this.letra, cx, y + 14, aceso ? '#ffe27a' : '#c8a040');
      G.light.add(cx, y + 8, 40, this.m.cor, 0.35);
    }
  }

  class Fantasma extends G.Ent {
    // flutua na frente do próprio sarcófago, um pouco maior que os vivos
    constructor(sar, f, dx) { super(sar.cx - 6 + dx, sar.y + sar.h + 15, 12, 8); this.f = f; this.room = sar.room; this.fase = 'surgir'; this.k = 0; this.alwaysUpdate = true; }
    get by() { return this.y + 400; }
    partir() { this.fase = 'partir'; this.k = 0; }
    update(dt) {
      this.t += dt;
      if (this.fase === 'surgir') { this.k = Math.min(1, this.k + dt / 1.4); if (this.k >= 1) this.fase = 'parado'; }
      else if (this.fase === 'partir') { this.k += dt / 1.6; if (this.k >= 1) this.dead = true; }
      if (Math.random() < 0.35) G.fx.glow(this.cx + G.rf(-6, 6), this.y + G.rf(-4, 6), { size: G.rf(1, 2), color: G.pick(['#bfe8ff', '#ffffff', '#9adcff']), vy: -G.rf(10, 25), vx: G.rf(-6, 6), life: G.rf(0.5, 0.9) });
    }
    draw(ctx, cam) {
      const s = G.spr['espectro_' + this.f.doll]; if (!s) return;
      let a = 0.85, dy = 0;
      if (this.fase === 'surgir') { a = 0.85 * this.k; dy = (1 - this.k) * 14; }
      else if (this.fase === 'partir') { a = 0.85 * (1 - this.k); dy = -this.k * 30; }
      const x = this.cx - cam.x, chao = this.y + this.h - cam.y, base = chao - 5 + dy + Math.sin(this.t * 2.2) * 1.5, E = 1.25;
      ctx.save(); ctx.globalAlpha = 0.25 * a; ctx.fillStyle = '#9adcff'; ctx.beginPath(); ctx.ellipse(x, chao, 9, 3, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, x, base - 18, 26, '#9adcff', 0.3 * a); ctx.restore();
      ctx.save(); ctx.translate(Math.round(x), Math.round(base)); ctx.scale(E, E);
      G.draw(ctx, s, -G.lw(s) / 2, -G.lh(s), { alpha: a });
      ctx.restore();
      G.light.add(x, base - 18, 56, '#9adcff', 0.8 * a);
    }
  }

  // decoração de cada cripta (desenhada à mão, em coordenadas da sala)
  const caixa = (ctx, x, y, w, h, c1, c2) => { ctx.fillStyle = c1; ctx.fillRect(x, y, w, h); ctx.fillStyle = c2; ctx.fillRect(x + 0.5, y + 0.5, w - 1, h - 1); };
  const vela = (ctx, x, y, t) => {
    caixa(ctx, x - 1.5, y - 6, 3, 7, '#8a7a5a', '#f0e6c8');
    const f = 1 + Math.sin(t * 13 + x) * 0.3;
    ctx.fillStyle = '#ff9a2a'; ctx.fillRect(x - 1, y - 9 * f, 2, 3 * f); ctx.fillStyle = '#fff0a0'; ctx.fillRect(x - 0.5, y - 8 * f, 1, 2);
  };
  const DECOR = {
    pascal(add, L) {
      // escrivaninha com cartas e tinteiro; dados espalhados; envelopes no chão
      add(new Decor(...L(4.5, 5), 40, 16, (c, x, y, t) => {
        caixa(c, x, y + 2, 40, 12, '#2a160a', '#6a3e1e'); c.fillStyle = '#8a5a2e'; c.fillRect(x + 0.5, y + 2.5, 39, 2);
        for (const [a, b] of [[4, 4], [12, 5], [20, 4.5]]) { caixa(c, x + a, y + b - 4, 8, 6, '#a89470', '#f4ead0'); c.fillStyle = '#c04a3a'; c.fillRect(x + a + 3, y + b - 2, 2, 2); }
        caixa(c, x + 31, y - 1, 5, 5, '#101018', '#2a2a4a'); c.fillStyle = '#f0f0f0'; c.fillRect(x + 33, y - 9, 0.8, 8);
        vela(c, x + 37, y + 3, t);
      }, { solido: true, luz: [40, '#ffb84a', 0.5] }));
      for (const [lx, ly, n] of [[16.5, 6, 6], [17.6, 7.2, 3], [16.8, 8.4, 5]]) add(new Decor(...L(lx, ly), 6, 6, (c, x, y) => {
        caixa(c, x, y, 6, 6, '#8a8a96', '#f4f4f8'); c.fillStyle = '#c02a3a';
        const pts = { 3: [[1, 1], [2.5, 2.5], [4, 4]], 5: [[1, 1], [4, 1], [2.5, 2.5], [1, 4], [4, 4]], 6: [[1, 1], [4, 1], [1, 2.5], [4, 2.5], [1, 4], [4, 4]] }[n];
        for (const [a, b] of pts) c.fillRect(x + a, y + b, 1, 1);
      }, { plano: true }));
      for (const [lx, ly] of [[6, 9.5], [15.5, 10], [8.4, 10.6]]) add(new Decor(...L(lx, ly), 9, 6, (c, x, y) => { caixa(c, x, y, 9, 6, '#a89470', '#f4ead0'); c.fillStyle = '#c8b890'; c.fillRect(x + 1, y + 1, 7, 0.6); c.fillRect(x + 1, y + 2.5, 5, 0.6); }, { plano: true }));
    },
    bernoulli(add, L) {
      // pilhas de moedas e a urna de pedrinhas brancas e pretas
      for (const [lx, ly, n] of [[4.5, 4, 6], [5.8, 5, 4], [17.8, 4, 5], [18, 8, 7], [4.6, 8.6, 3]]) add(new Decor(...L(lx, ly), 10, 10, (c, x, y, t) => {
        for (let i = 0; i < n; i++) { c.fillStyle = '#8a6a10'; c.fillRect(x + 1, y + 7 - i * 2, 8, 2); c.fillStyle = i === n - 1 ? '#ffe27a' : '#e8c040'; c.fillRect(x + 1.5, y + 7 - i * 2, 7, 1.2); }
        if (Math.floor(t * 2 + x) % 5 === 0) { c.fillStyle = '#ffffff'; c.fillRect(x + 6, y + 6 - n * 2, 1, 1); }
      }, { luz: [16, '#ffd84a', 0.3] }));
      add(new Decor(...L(15.8, 6), 14, 14, (c, x, y) => {
        c.fillStyle = '#2a1a3a'; c.beginPath(); c.ellipse(x + 7, y + 7, 7, 7.5, 0, 0, TAU); c.fill();
        c.fillStyle = '#5a3a7a'; c.beginPath(); c.ellipse(x + 7, y + 7, 6, 6.5, 0, 0, TAU); c.fill();
        c.fillStyle = '#2a1a3a'; c.fillRect(x + 3, y - 1, 8, 3);
        for (let i = 0; i < 9; i++) { c.fillStyle = i % 3 === 2 ? '#1a1a1a' : '#f4f4f4'; c.beginPath(); c.arc(x + 3.5 + (i % 3) * 3.5, y - 1.5 - Math.floor(i / 3) * 1.6, 1.4, 0, TAU); c.fill(); }
      }, { solido: true }));
    },
    bayes(add, L) {
      // balança (crença antes × evidência), velas e livros
      add(new Decor(...L(4.4, 5), 24, 20, (c, x, y, t) => {
        const a = Math.sin(t * 0.9) * 0.18;
        caixa(c, x + 9, y + 12, 6, 8, '#2a2a20', '#7a6a4a');
        c.fillStyle = '#c8a040'; c.fillRect(x + 11.5, y - 2, 1, 15);
        c.save(); c.translate(x + 12, y - 1); c.rotate(a); c.fillStyle = '#e8c860'; c.fillRect(-11, -0.6, 22, 1.2);
        for (const s of [-1, 1]) { c.fillStyle = '#b89030'; c.fillRect(s * 10 - 0.3, 0, 0.6, 6); c.fillStyle = '#e8c860'; c.beginPath(); c.ellipse(s * 10, 6.5, 4, 1.5, 0, 0, TAU); c.fill(); }
        c.fillStyle = '#c03a3a'; c.beginPath(); c.arc(-10, 4.6, 1.6, 0, TAU); c.fill();
        c.fillStyle = '#4a9aff'; c.beginPath(); c.arc(10, 4.2, 2, 0, TAU); c.fill();
        c.restore();
      }, { solido: true, luz: [30, '#8affc0', 0.35] }));
      for (const lx of [8, 15.6]) add(new Decor(...L(lx, 4.4), 4, 4, (c, x, y, t) => vela(c, x + 2, y + 3, t), { luz: [24, '#ffb84a', 0.5] }));
      add(new Decor(...L(17, 7), 16, 12, (c, x, y) => { for (const [a, b, col] of [[0, 6, '#6a1a2a'], [1, 3, '#1a3a6a'], [0, 0, '#2a5a2a']]) caixa(c, x + a, y + b, 14, 3.5, '#120a0a', col); }, { solido: true }));
      for (const [lx, ly] of [[5, 9.5], [6, 3.5], [16, 10], [17.5, 3.5], [13, 9]]) add(new Decor(...L(lx, ly), 12, 6, (c, x, y) => { c.fillStyle = 'rgba(70,140,70,0.55)'; c.beginPath(); c.ellipse(x + 6, y + 3, 6, 2.5, 0, 0, TAU); c.fill(); }, { plano: true }));
    },
    laplace(add, L) {
      // planetário girando e um sino em mosaico no chão
      add(new Decor(...L(4.2, 4.5), 26, 24, (c, x, y, t) => {
        caixa(c, x + 10, y + 16, 6, 8, '#1a1a2a', '#4a4a6a');
        const cx = x + 13, cy = y + 8;
        c.strokeStyle = 'rgba(190,216,255,0.35)'; c.lineWidth = 0.6;
        for (const r of [5, 8.5, 12]) { c.beginPath(); c.ellipse(cx, cy, r, r * 0.45, 0, 0, TAU); c.stroke(); }
        c.fillStyle = '#ffd84a'; c.beginPath(); c.arc(cx, cy, 2.6, 0, TAU); c.fill();
        [[5, 1.6, '#c8c8d8', 1.1], [8.5, 1.0, '#4a9aff', 1.4], [12, 0.6, '#ff8a5a', 1.2]].forEach(([r, w, col, s]) => { const a = t * w; c.fillStyle = col; c.beginPath(); c.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.45, s, 0, TAU); c.fill(); });
      }, { solido: true, luz: [34, '#ffd84a', 0.45] }));
      add(new Decor(...L(8, 6.5), 128, 40, (c, x, y) => {
        c.fillStyle = 'rgba(232,240,255,0.08)'; c.fillRect(x, y, 128, 40);
        c.fillStyle = 'rgba(232,240,255,0.55)';
        for (let i = 0; i <= 64; i++) { const u = (i - 32) / 11, hgt = 30 * Math.exp(-u * u / 2); c.fillRect(x + i * 2, y + 36 - hgt, 1.6, 1.6); }
        c.fillStyle = 'rgba(232,240,255,0.35)'; c.fillRect(x, y + 37, 128, 1);
      }, { plano: true }));
      for (let i = 0; i < 28; i++) { const lx = 4 + G.hash2(i, 3, 77) * 15.5, ly = 1.2 + G.hash2(i, 5, 77) * 0.8; add(new Decor(...L(lx, ly), 2, 2, (c, x, y, t) => { c.fillStyle = 'rgba(255,255,255,' + (0.4 + 0.5 * Math.abs(Math.sin(t * 1.3 + i))) + ')'; c.fillRect(x, y, 1, 1); }, { plano: true })); }
    },
    pearson(add, L) {
      // quadro na parede: observado × esperado, e um χ² grande no chão
      add(new Decor(...L(4.2, 4), 48, 30, (c, x, y) => {
        caixa(c, x, y, 48, 26, '#2a1608', '#f0dcae');
        c.fillStyle = '#7a4a1a'; c.fillRect(x + 3, y + 22, 42, 0.8);
        // barras (observado) e a linha vermelha do esperado; a última foge muito
        [8, 11, 9, 7, 9, 16].forEach((o, i) => { c.fillStyle = '#4a7ab8'; c.fillRect(x + 5 + i * 7, y + 22 - o, 4, o); });
        c.fillStyle = '#c02a3a'; for (let i = 0; i < 42; i += 3) c.fillRect(x + 3 + i, y + 12, 2, 0.8);
        G.text('esperado', x + 3, y + 2, '#c02a3a', { shadow: false });
        caixa(c, x + 20, y + 26, 8, 4, '#2a1608', '#6a3a14');
      }, { solido: true }));
      add(new Decor(...L(10, 6), 64, 32, (c, x, y) => {
        c.fillStyle = 'rgba(255,216,140,0.18)'; c.fillRect(x, y, 64, 32);
        c.save(); c.translate(x + 32, y + 9); c.scale(3, 3); G.text('χ²', 0, 0, 'rgba(255,224,160,0.6)', { align: 'center', shadow: false }); c.restore();
      }, { plano: true }));
      for (const [lx, ly] of [[16.5, 4], [16.8, 8.5], [4.5, 10], [14.6, 10.5]]) add(new Decor(...L(lx, ly), 18, 8, (c, x, y) => { c.fillStyle = 'rgba(200,160,100,0.5)'; c.beginPath(); c.ellipse(x + 9, y + 5, 9, 3, 0, Math.PI, TAU); c.fill(); }, { plano: true }));
    },
    fisher(add, L) {
      // mesinha com 8 xícaras (4 de leite primeiro, 4 de chá primeiro) e canteiros
      add(new Decor(...L(15.6, 5), 48, 18, (c, x, y) => {
        caixa(c, x, y + 4, 48, 12, '#2a160a', '#8a5a2e'); c.fillStyle = '#f0e8d8'; c.fillRect(x + 1, y + 4.5, 46, 2.5);
        [1, 0, 0, 1, 0, 1, 1, 0].forEach((leite, i) => { const cx = x + 4 + i * 5.6; caixa(c, cx - 2, y + 1, 4, 4, '#6a5a4a', '#ffffff'); c.fillStyle = leite ? '#e8d8c0' : '#9a5a2a'; c.fillRect(cx - 1.4, y + 1.6, 2.8, 1.2); });
      }, { solido: true }));
      for (const [lx, ly, tipo] of [[4.2, 4, 'trigo'], [4.2, 7, 'milho'], [5.6, 4, 'abobora'], [5.6, 7, 'trigo']]) add(new Plantio(...L(lx, ly), tipo));
      for (const lx of [8, 15.6]) add(new Decor(...L(lx, 4.4), 4, 4, (c, x, y, t) => vela(c, x + 2, y + 3, t), { luz: [24, '#ffb84a', 0.5] }));
    },
    breiman(add, L) {
      // mudinhas em vasos (uma floresta inteira) e a urna da votação
      for (const [lx, ly] of [[4.2, 4], [5.8, 4.6], [4.4, 7.2], [6, 7.8], [16.6, 4], [18, 4.6], [16.8, 7.4], [18.2, 8]]) add(new Decor(...L(lx, ly), 12, 12, (c, x, y, t) => {
        caixa(c, x + 3, y + 7, 6, 5, '#3a1a0a', '#a8542a');
        c.fillStyle = '#5a3a1a'; c.fillRect(x + 5.5, y + 3, 1, 5);
        const sw = Math.sin(t * 1.5 + x) * 0.6;
        for (const [a, b, r, col] of [[6, 1.5, 4.5, '#1e5a30'], [5.5, 0.8, 3.2, '#3a8a46'], [5, 0, 1.5, '#6ab85a']]) { c.fillStyle = col; c.beginPath(); c.arc(x + a + sw, y + b, r, 0, TAU); c.fill(); }
      }, { solido: true }));
      add(new Decor(...L(14.5, 8.8), 12, 12, (c, x, y) => {
        caixa(c, x, y + 2, 12, 10, '#1a2a3a', '#3a5a7a'); c.fillStyle = '#0a1018'; c.fillRect(x + 3, y + 3, 6, 1);
        caixa(c, x + 4, y - 2, 4, 5, '#a89470', '#f4ead0'); G.text('✓', x + 6, y - 1.5, '#2a6a2a', { align: 'center', shadow: false });
      }, { solido: true }));
      add(new Decor(...L(4, 1), 256, 14, (c, x, y, t) => {
        c.strokeStyle = '#3a2410'; c.lineWidth = 1.2;
        for (let i = 0; i < 7; i++) { const bx = x + 8 + i * 36 + G.hash2(i, 1, 9) * 10; c.beginPath(); c.moveTo(bx, y); c.quadraticCurveTo(bx + 4, y + 6, bx - 2 + Math.sin(t * 0.8 + i) * 1.5, y + 10 + (i % 3) * 2); c.stroke(); }
      }, { plano: true }));
    }
  };

  G.PUZ.cripta = (ctx) => {
    const { r, add, L, setL } = ctx, m = POR_ID[ctx.opt.mestre];
    // escada de volta, como na entrada das masmorras
    setL(11, 12, T.STAIRS); setL(12, 12, T.STAIRS);
    add(new G.Trigger(r.px + 11 * TS, r.py + 12 * TS + 6, 32, 10, () => G.exitDungeon(), { room: r.idx }), r.idx);
    // uma cripta pequena: paredes grossas dos lados deixam um salão de 16 casas
    for (let ly = 1; ly <= 11; ly++) for (const lx of [1, 2, 3, 20, 21, 22]) setL(lx, ly, T.WALL);
    for (let ly = 5; ly <= 11; ly++) for (const lx of [11, 12]) setL(lx, ly, T.CARPET);
    for (const [lx, ly] of [[6, 2], [17, 2]]) setL(lx, ly, T.PILLAR);
    const sars = m.fantasmas.length > 1
      ? [add(new Sarcofago(r.px + 8.5 * TS, r.py + 2 * TS, 48, m, 'PASCAL', 'P'), r.idx), add(new Sarcofago(r.px + 12.5 * TS, r.py + 2 * TS, 48, m, 'FERMAT', 'F'), r.idx)]
      : [add(new Sarcofago(r.px + 9.5 * TS, r.py + 2 * TS, 80, m, m.curto.toUpperCase()), r.idx)];
    // velas em volta do sarcófago
    for (const [lx, ly] of [[8, 2.4], [15.75, 2.4], [8.6, 4.4], [15.2, 4.4]]) add(new Decor(...L(lx, ly), 4, 4, (c, x, y, t) => vela(c, x + 2, y + 3, t), { luz: [26, '#ffb84a', 0.55] }), r.idx);
    DECOR[m.id]((e) => add(e, r.idx), L);
    // o encontro começa sozinho quando o herói se aproxima do sarcófago
    let disparou = false;
    add(new Decor(r.px + 8 * TS, r.py + 4 * TS, 8 * TS, 3 * TS, () => {}, {}), r.idx).update = function () {
      const p = G.player;
      if (disparou || !p || G.cutscene || tem(m.id) || p.y > this.y + this.h || p.cx < this.x || p.cx > this.x + this.w) return;
      disparou = true; G.runScript(() => encontro(sars[0]));
    };
    return { noAutoEnemies: true };
  };

  async function entrarCripta(m) {
    const st = estado(m.id); if (!st) return;
    G.sfx('door');
    P().lastPos = saidaDaCripta(m);
    await G.ui.fade(1, 0.4);
    G.dun.load('cr_' + m.id);
    P().lastDungeon = 'cr_' + m.id;
    G.saveGame();
    await G.ui.fade(0, 0.4);
    if (!P().flags['cr_' + m.id + '_visto']) {
      P().flags['cr_' + m.id + '_visto'] = true;
      await say(null, tem(m.id) ? 'A cripta está em silêncio.' : 'Uma cripta fria e silenciosa. No fundo, um sarcófago com o nome ^y' + m.autor + '^0.');
    }
  }
  // ao sair, o herói volta para uma casa livre ao lado da escada
  function saidaDaCripta(m) {
    const st = estado(m.id), [ex, ey] = st.escada, ow = G.world.ensure().map;
    const ocupado = (x, y) => Object.values(st.pos).some(([px, py]) => Math.round(px / TS) === x && Math.round(py / TS) === y);
    for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1]]) {
      const x = ex + dx, y = ey + dy, tp = G.TP[ow.get(x, y)];
      if (!tp.solid && !tp.hazard && !ocupado(x, y)) return { x: x * TS + 3, y: y * TS + 2 };
    }
    return { x: ex * TS + 3, y: (ey + 1) * TS + 2 };
  }
  const sair0 = G.exitDungeon;
  G.exitDungeon = () => {
    const id = G.map && G.map.id;
    if (!id || !/^cr_/.test(id)) { sair0(); return; }
    const m = POR_ID[id.slice(3)];
    G.runScript(async () => {
      await G.ui.fade(1, 0.35);
      const s = saidaDaCripta(m);
      G.world.loadOverworld(s.x, s.y);
      G.player.dir = 0; P().lastDungeon = null; P().lastPos = { x: s.x, y: s.y };
      G.saveGame();
      await G.ui.fade(0, 0.35);
    });
  };
  const carregar0 = G.dun.load;
  G.dun.load = function (did) {
    carregar0.call(this, did);
    if (/^cr_/.test(did)) { const m = POR_ID[did.slice(3)]; G.ui.regionBanner('Cripta de ' + m.curto, 'Manuscrito de ' + m.ano); }
  };

  // ------------------------------------------------------------------
  //  O encontro com o fantasma
  // ------------------------------------------------------------------
  async function encontro(sar) {
    const m = sar.m;
    if (tem(m.id) || G.ents.some(e => e instanceof Fantasma && !e.dead)) { await say('Lápide', m.lapide); return; }
    const p = G.player;
    G.music(null); G.sfx('fantasma');
    const sars = G.ents.filter(e => e instanceof Sarcofago && e.m === m);
    const fs = m.fantasmas.map((f, i) => G.addEnt(new Fantasma(sars[i] || sars[0], f, 0)));
    if (p) p.dir = 1;
    await G.wait(1.6);
    G.music('cripta');
    const fala = async ([i, txt]) => say(m.fantasmas[i].nome, txt, { portrait: 'espectroRet_' + m.fantasmas[i].doll });
    for (const f of m.falas) await fala(f);
    const q = m.pergunta, quem = m.fantasmas[0], qo = { portrait: 'espectroRet_' + quem.doll };
    for (;;) {
      const r = await ask(quem.nome, q.texto, q.opcoes, qo);
      if (r === q.certa) { G.sfx('correct'); G.recordQuiz('mestres', true); break; }
      G.sfx('wrong'); G.recordQuiz('mestres', false);
      await say(quem.nome, q.explica + ' Pense mais um pouco e responda de novo.', qo);
    }
    for (const f of m.acerto) await fala(f);
    await cerimonia(m);
    for (const f of m.despedida) await fala(f);
    for (const f of fs) f.partir();
    G.sfx('fantasma');
    await G.wait(1.7);
    G.saveGame();
    G.restoreMusic();
  }

  async function cerimonia(m) {
    G.music(null); G.sfx('fanfare');
    await new Promise(res => G.ui.push(new CenaManuscrito(m, res)));
    if (!lista().includes(m.id)) lista().push(m.id);
    const p = G.player;
    if (p) {
      p.state = 'hold'; p.holdItem = 'manuscrito'; G.sfx('itemget');
      for (let i = 0; i < 14; i++) G.fx.glow(p.cx + G.rf(-10, 10), p.y - G.rf(0, 22), { size: 2, color: G.pick(['#ffe27a', '#ffffff', m.cor]), vy: -G.rf(20, 50), life: G.rf(0.6, 1) });
      await G.wait(1.1);
      if (p.state === 'hold') { p.state = 'normal'; p.holdItem = null; }
    }
    G.ui.toast('Manuscritos dos Mestres: ' + nMan() + ' de 7. Mostre à Florence, na Vila Gauss!', '#ffe27a');
    G.music('cripta');
  }

  // ------------------------------------------------------------------
  //  Cerimônia do manuscrito: o rolo desce numa coluna de luz, se abre,
  //  a ideia é escrita à pena e o selo de cera fecha o documento
  // ------------------------------------------------------------------
  const PW = 272, PH = 136;
  const ease = k => 1 - Math.pow(1 - Math.max(0, Math.min(1, k)), 3);
  const semCodigos = s => s.replace(/\^./g, '');
  class CenaManuscrito {
    constructor(m, res) {
      this.m = m; this.res = res; this.t = 0; this.isPause = true; this.fase = 'abre'; this.k = 0; this.chars = 0; this.seloT = -1;
      this.linhas = G.wrap(m.ideia, PW - 44); this.total = this.linhas.reduce((s, l) => s + l.length, 0);
      this.tituloL = G.wrap(m.obra, PW - 44);
    }
    update(dt) {
      this.t += dt;
      const I = G.input;
      if (this.fase === 'abre') {
        const antes = this.t - dt;
        if (antes < 1.0 && this.t >= 1.0) G.sfx('pergaminho');
        if (this.t > 1.9) {
          const c0 = Math.floor(this.chars); this.chars = Math.min(this.total, this.chars + dt * 40);
          if (Math.floor(this.chars) !== c0 && Math.floor(this.chars) % 3 === 0) G.sfx('text');
        }
        if (this.chars >= this.total && this.seloT < 0) this.seloT = 0;
        if (this.seloT >= 0) { const s0 = this.seloT; this.seloT += dt; if (s0 < 0.35 && this.seloT >= 0.35) { G.sfx('selo'); G.shake(1.5, 0.15); } }
        if (I.pressed('confirm') && this.t > 1.2) {
          if (this.chars < this.total) { this.chars = this.total; }
          else if (this.seloT > 0.6) { this.fase = 'fecha'; this.k = 0; G.sfx('pergaminho'); }
        }
      } else { this.k += dt; if (this.k > 1.2) { this.done = true; this.res(); } }
    }
    draw(ctx) {
      const W = G.W, H = G.H, t = this.t, m = this.m, cx = W / 2, cy = H / 2 + 2;
      const fecha = this.fase === 'fecha', fa = fecha ? Math.max(0, 1 - this.k / 1.2) : Math.min(1, t / 0.4);
      ctx.fillStyle = 'rgba(6,4,16,' + (0.88 * fa) + ')'; ctx.fillRect(0, 0, W, H);
      G.lightRays(ctx, cx, cy, 170, 0.45 * fa, t * 0.5, m.cor, 14);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, cx, cy, 120, m.cor, 0.18 * fa); ctx.restore();
      // largura aberta e posição do rolo
      let aberto = ease((t - 1.0) / 0.7), px = cx, py = cy, esc = 1;
      if (t < 1.0) py = -40 + (cy + 40) * ease(t / 1.0);
      if (fecha) {
        aberto = 1 - ease(this.k / 0.45);
        const v = ease((this.k - 0.45) / 0.65); px = cx + (W - 30 - cx) * v; py = cy + (18 - cy) * v; esc = 1 - 0.75 * v;
      }
      ctx.save(); ctx.translate(px, py); ctx.scale(esc, esc);
      const w = 14 + (PW - 14) * aberto, h = PH;
      {
        ctx.fillStyle = '#5a3a1a'; ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.fillStyle = '#f2e2b8'; ctx.fillRect(-w / 2 + 1, -h / 2 + 1, w - 2, h - 2);
        ctx.fillStyle = '#e4cc98'; ctx.fillRect(-w / 2 + 1, h / 2 - 7, w - 2, 6); ctx.fillRect(-w / 2 + 1, -h / 2 + 1, w - 2, 3);
        for (let i = 0; i < 6; i++) { ctx.fillStyle = 'rgba(150,110,60,0.08)'; ctx.fillRect(-w / 2 + 1, -h / 2 + 12 + i * 20, w - 2, 1); }
      }
      // os dois rolos de madeira com pontas de ouro
      for (const s of [-1, 1]) {
        const rx = s * w / 2;
        ctx.fillStyle = '#2a1608'; ctx.fillRect(rx - 4.5, -h / 2 - 7, 9, h + 14);
        ctx.fillStyle = '#7a4a22'; ctx.fillRect(rx - 3.5, -h / 2 - 6, 7, h + 12);
        ctx.fillStyle = '#a8703a'; ctx.fillRect(rx - 2.5, -h / 2 - 6, 2, h + 12);
        for (const e of [-1, 1]) { ctx.fillStyle = '#c8a040'; ctx.beginPath(); ctx.arc(rx, e * (h / 2 + 8), 4, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffe27a'; ctx.beginPath(); ctx.arc(rx - 1, e * (h / 2 + 8) - 1, 1.6, 0, TAU); ctx.fill(); }
      }
      if (aberto > 0.98 && !fecha) this.texto(ctx, t);
      ctx.restore();
      if (!fecha && t < 1.0) for (let i = 0; i < 3; i++) { ctx.fillStyle = 'rgba(255,240,180,0.8)'; ctx.fillRect(cx + G.rf(-30, 30), py + G.rf(-50, 50), 1, 1); }
      if (fecha && this.k > 0.45) G.text('MANUSCRITOS DOS MESTRES · ' + (nMan() + (tem(m.id) ? 0 : 1)) + '/7', W / 2, 30, '#ffe27a', { align: 'center', outline: '#1a1028' });
      if (!fecha && this.seloT > 0.6 && Math.floor(t * 2.5) % 2 === 0) G.text('X: guardar no acervo', W / 2, H - 14, '#ffe27a', { align: 'center', outline: '#1a1028' });
    }
    // conteúdo do pergaminho (coordenadas relativas ao centro)
    texto(ctx, t) {
      const m = this.m, x0 = -PW / 2 + 22, a = Math.min(1, (t - 1.7) / 0.3);
      ctx.save(); ctx.globalAlpha = Math.max(0, a);
      G.text('MANUSCRITO DOS MESTRES', 0, -PH / 2 + 7, '#9a6a3a', { align: 'center', shadow: false });
      ctx.save(); ctx.translate(0, -PH / 2 + 17); ctx.scale(2, 2); G.text(String(m.ano), 0, 0, '#7a2a14', { align: 'center', shadow: false }); ctx.restore();
      let y = -PH / 2 + 35;
      for (const l of this.tituloL) { G.text(l, 0, y, '#3a2414', { align: 'center', shadow: false }); y += 10; }
      G.text(m.autor, 0, y + 1, '#8a5a2a', { align: 'center', shadow: false }); y += 13;
      ctx.fillStyle = 'rgba(122,74,26,0.5)'; ctx.fillRect(-PW / 2 + 40, y - 2, PW - 80, 0.8);
      y += 4;
      let resto = Math.floor(this.chars), qx = x0, qy = y;
      for (const l of this.linhas) {
        if (resto <= 0) break;
        const parte = l.slice(0, resto); resto -= l.length;
        G.text(semCodigos(parte), x0, y, '#2a1a0a', { shadow: false });
        qx = x0 + G.textW(parte); qy = y; y += 10;
      }
      // a pena que escreve
      if (this.chars < this.total) {
        ctx.save(); ctx.translate(qx + 2, qy + 4); ctx.rotate(-0.8);
        ctx.fillStyle = '#f6f2ff'; ctx.beginPath(); ctx.ellipse(6, 0, 7, 2.2, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#ffd84a'; ctx.fillRect(-2, -0.6, 3, 1.2);
        ctx.restore();
      }
      ctx.restore();
      // selo de cera com Σ, que cai com um baque
      if (this.seloT >= 0) {
        const k = Math.min(1, this.seloT / 0.35), s = 2.6 - 1.6 * ease(k), sx = PW / 2 - 30, sy = PH / 2 - 22;
        ctx.save(); ctx.translate(sx, sy); ctx.scale(s, s); ctx.globalAlpha = Math.min(1, k * 2);
        ctx.fillStyle = '#5a0a14'; ctx.beginPath(); ctx.arc(0, 0, 10, 0, TAU); ctx.fill();
        ctx.fillStyle = '#c8283a'; ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); ctx.fill();
        ctx.fillStyle = '#e8485a'; ctx.beginPath(); ctx.arc(-2, -2, 5, 0, TAU); ctx.fill();
        G.text('Σ', 0, -3, '#5a0a14', { align: 'center', shadow: false });
        ctx.restore();
        if (k >= 1 && this.seloT < 0.9) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; G.glow(ctx, sx, sy, 22, '#ffb0b0', 0.9 - this.seloT); ctx.restore(); }
      }
    }
  }

  // ------------------------------------------------------------------
  //  Itens: o manuscrito e a Pena dos Mestres
  // ------------------------------------------------------------------
  const give0 = G.give;
  G.give = async function (kind, n, o) {
    if (kind === 'manuscrito') { if (!lista().includes(n)) lista().push(n); return; }
    if (kind === 'penaMestres') {
      const p = G.player;
      if (p) { p.state = 'hold'; p.holdItem = 'penaMestresIcon'; }
      G.cutscene++;
      try {
        G.equip.ganhar('espada', 5); G.sfx('fanfare'); await G.wait(0.3);
        await G.ui.banner('penaMestresIcon', 'PENA DOS MESTRES!', 'Uma pena de escrever com bico de ouro, molhada na tinta dos sete manuscritos: a arma mais forte do reino.', { color: '#7ae4ff' });
      } finally { G.cutscene--; if (p && p.state === 'hold') { p.state = 'normal'; p.holdItem = null; } }
      return;
    }
    return give0.call(this, kind, n, o);
  };
  if (G.SWORD_FX) G.SWORD_FX[5] = { body: '#eef0ff', edge: '#4a4aff' };

  // ------------------------------------------------------------------
  //  Florence: o acervo e o prêmio dos sete
  // ------------------------------------------------------------------
  const N = G.NPCS, flo0 = N.florence;
  N.florence = async (n) => {
    const p = P(), o = { portrait: 'florence_down0' }, k = nMan();
    if (!p.flags.metFlorence) return flo0(n);
    if (!p.flags.florenceAcervo && (k > 0 || p.crystals.length >= 2)) {
      p.flags.florenceAcervo = true;
      await say('Florence', 'Sabia que a Florence Nightingale, a minha inspiração, também foi uma grande estatística? Ela adorava os livros dos grandes mestres.', o);
      await say('Florence', 'Dizem que ^ysete mestres^0 da estatística descansam em tumbas espalhadas pelo reino. Quem desce até elas encontra o fantasma do autor... e um ^ymanuscrito^0.', o);
      await say('Florence', 'As tumbas cedem quando a gente empurra ou puxa do jeito certo: leia as lápides! Traga os manuscritos e eu monto um ^cacervo^0 aqui na enfermaria. Para quem juntar os sete, tenho um presente.', o);
    }
    if (p.flags.florenceAcervo && !p.flags.penaMestres) {
      if (k >= MESTRES.length) {
        await say('Florence', 'Os SETE! Pascal e Fermat, Bernoulli, Bayes, Laplace, Pearson, Fisher e Breiman. O acervo está completo!', o);
        await say('Florence', 'A Florence Nightingale mudou hospitais inteiros com relatórios e gráficos. Dizem que a pena é mais poderosa que a espada...', o);
        await say('Florence', 'Então tome a ^yPena dos Mestres^0: molhei a ponta na tinta dos sete manuscritos.', o);
        p.flags.penaMestres = true;
        await G.give('penaMestres');
        await say('Florence', 'Cada golpe dela carrega quase trezentos e cinquenta anos de ideias. Use bem!', o);
        G.saveGame();
      } else {
        const novos = k - (p.flags.florenceViu || 0);
        if (novos > 0) { p.flags.florenceViu = k; await say('Florence', (novos === 1 ? 'Um manuscrito novo!' : novos + ' manuscritos novos!') + ' O acervo já tem ^y' + k + ' de 7^0.', o); }
        const r = await ask('Florence', 'Quer uma pista de onde procurar um manuscrito?', ['Quero uma pista', 'Agora não'], { cancel: 1, portrait: 'florence_down0' });
        if (r === 0) {
          const faltam = ORDEM_PISTA.filter(id => !tem(id)), i = (p.flags.florencePista || 0) % faltam.length;
          p.flags.florencePista = i + 1;
          await say('Florence', POR_ID[faltam[i]].dica, o);
        }
      }
    }
    return flo0(n);
  };

  // ------------------------------------------------------------------
  //  Menu: aba MESTRES e marcas no mapa
  // ------------------------------------------------------------------
  G.mestresTabUpdate = (m, I) => {
    m.mi = m.mi || 0;
    if (I.pressed('up')) { m.mi = (m.mi + MESTRES.length - 1) % MESTRES.length; G.sfx('select'); }
    if (I.pressed('down')) { m.mi = (m.mi + 1) % MESTRES.length; G.sfx('select'); }
  };
  G.drawMestresTab = (ctx, x, y, w, h, menu) => {
    const sel = menu.mi || 0, k = nMan(), p = P();
    G.text('MANUSCRITOS DOS MESTRES · ' + k + '/7', x, y, '#ffd84a');
    MESTRES.forEach((m, i) => {
      const yy = y + 14 + i * 20, ok = tem(m.id);
      if (i === sel) G.selBar(ctx, x - 2, yy - 3, 150, 18, G.time);
      G.rect(ctx, x, yy - 1, 14, 14, '#0a0918');
      if (ok) G.draw(ctx, 'manuscrito', x - 1, yy - 2); else G.text('?', x + 7, yy + 2, '#3a3858', { align: 'center' });
      G.text(ok ? m.curto : '? ? ?', x + 18, yy, ok ? (i === sel ? '#ffe27a' : '#ffffff') : '#5a5670');
      G.text(ok ? String(m.ano) : '', x + 146, yy + 6, '#9a98b0', { align: 'right' });
    });
    const m = MESTRES[sel], px = x + 156, pw = w - 156;
    G.panel(ctx, px, y + 10, pw, h - 12, { r: 4, thin: true, corners: false });
    let yy = y + 18;
    const escreve = (txt, cor) => { for (const l of G.wrap(txt, pw - 14)) { G.text(l, px + 7, yy, cor); yy += 10; } };
    if (tem(m.id)) {
      escreve(m.obra, '#ffd84a'); yy += 1;
      escreve(m.autor + ' · ' + m.ano, '#9ac8ff'); yy += 4;
      escreve(m.ideia, '#ffffff');
    } else {
      escreve('Manuscrito ainda não encontrado.', '#8a88a0'); yy += 4;
      if (p.flags.florenceAcervo) escreve('Peça uma pista à Florence, na enfermaria da Vila Gauss.', '#c8c8e0');
      else escreve('Converse com a Florence, na Vila Gauss, quando tiver alguns cristais.', '#c8c8e0');
    }
    const premio = p.flags.penaMestres ? 'Pena dos Mestres: recebida!' : 'Junte os sete: a Florence tem um presente.';
    G.text(premio, px + 7, y + h - 14, p.flags.penaMestres ? '#7aff8a' : '#9a98b0');
  };
  const mapa0 = G.drawMapExtra;
  G.drawMapExtra = (ctx, ox, oy, sc, seenAt) => {
    if (mapa0) mapa0(ctx, ox, oy, sc, seenAt);
    const ow = G.world.ow; if (!ow) return;
    for (const o of ow.objects) {
      if (o.type !== 'tumba' || !o.primeira) continue;
      const tx = o.x / TS, ty = o.y / TS; if (!seenAt(tx, ty)) continue;
      const x = Math.round(ox + tx * sc), y = Math.round(oy + ty * sc), ok = tem(o.mestre);
      G.rect(ctx, x - 2, y - 3, 5, 6, '#1b1428'); G.rect(ctx, x - 1, y - 2, 3, 4, ok ? '#ffd84a' : '#9a98b0');
    }
  };
})(window.G);
