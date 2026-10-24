'use strict';
// =====================================================================
//  GRIMÓRIO: as lições de estatística que o herói aprende na jornada.
// =====================================================================
(function (G) {
  G.LESSONS = {
    intro: { title: 'O que é Estatística?', by: 'Mestre Gauss', pages: [
      { t: '^yEstatística^0 é a ciência de ^gcoletar, organizar, resumir e interpretar dados^0 para tomar boas decisões.\n\nDados estão em todo lugar: as moedas que você junta, o dano dos seus golpes, a altura das árvores, o tempo que você leva para vencer um chefe...' },
      { t: 'Nesta jornada você vai aprender a:\n\n• Resumir dados (^ymédia, mediana, moda^0)\n• Medir variação (^yamplitude, desvio padrão^0)\n• Calcular chances (^yprobabilidade^0)\n• Ler distribuições (^yhistograma, curva normal^0)\n• Evitar enganos (^yamostragem e viés^0)\n• Tirar conclusões (^yinferência^0: boxplot, intervalos, testes)\n\nReveja as lições no ^yGRIMÓRIO^0 (menu: Enter).' },
      { t: 'Dica: o seu próprio jogo gera dados! Na aba ^cDADOS^0 do menu você verá as estatísticas dos seus golpes: média, mediana, moda e desvio padrão do dano que você causa.\n\nUm bom estatístico observa tudo...' }
    ] },
    media: { title: 'Média Aritmética', by: 'Tábua da Média', pages: [
      { t: 'A ^yMÉDIA^0 é o valor que "equilibra" um conjunto de dados.\n\nPara calcular:\n  1) ^gsome todos os valores^0\n  2) ^gdivida pela quantidade^0 de valores\n\n     ^cMédia = soma ÷ quantidade^0' },
      { t: 'Exemplo: o herói juntou 2, 4, 6 e 8 moedas em quatro dias.\n\nSoma = 2 + 4 + 6 + 8 = 20\nQuantidade = 4\nMédia = 20 ÷ 4 = ^g5 moedas por dia^0.', fig: { type: 'dots', values: [2, 4, 6, 8], mark: 'mean' } },
      { t: 'Pense nos valores como pesos numa gangorra: a média é o ponto onde ela ^yfica equilibrada^0.\n\nCuidado: valores muito extremos (^ooutliers^0) puxam a média para perto deles!', fig: { type: 'dots', values: [3, 4, 4, 5, 19], mark: 'mean' } },
      { t: 'Truques de mestre:\n\n• Somar o mesmo número a TODOS os valores soma esse número à média.\n• Multiplicar todos por 2 dobra a média.\n• Se você sabe a média e a quantidade, sabe a soma:\n     ^csoma = média × quantidade^0' }
    ] },
    mediana: { title: 'Mediana', by: 'Tábua do Bosque', pages: [
      { t: 'A ^yMEDIANA^0 é o valor do MEIO quando os dados estão ^gem ordem^0.\n\n  1) Ordene do menor para o maior.\n  2) Pegue o valor central.\n\nMetade dos dados fica abaixo dela e metade acima.' },
      { t: 'Quantidade ÍMPAR: 7, 2, 9, 4, 5\nOrdenando: 2, 4, ^g5^0, 7, 9 → mediana = 5\n\nQuantidade PAR: 3, 8, 1, 6\nOrdenando: 1, ^g3, 6^0, 8\nMediana = (3 + 6) ÷ 2 = ^g4,5^0', fig: { type: 'dots', values: [7, 2, 9, 4, 5], mark: 'median' } },
      { t: 'A mediana é ^gresistente a outliers^0.\nEm 2, 3, 4, 5, 30 a média é 8,8, mas a mediana é 4 — bem mais representativa!\n\nPor isso usamos a mediana para salários e preços de casas.', fig: { type: 'dots', values: [2, 3, 4, 5, 30], mark: 'both' } }
    ] },
    moda: { title: 'Moda', by: 'Tábua do Bosque', pages: [
      { t: 'A ^yMODA^0 é o valor que ^gmais se repete^0.\n\nEm 3, 5, 5, 7, 5, 2 a moda é ^g5^0 (aparece 3 vezes).\n\nPode haver duas modas (^cbimodal^0) ou nenhuma, se nada se repetir.', fig: { type: 'dots', values: [3, 5, 5, 7, 5, 2], mark: 'mode' } },
      { t: 'A moda é a única medida que funciona com dados que ^gnão são números^0: cores, nomes, tipos de monstro...\n\nCor favorita: azul, verde, azul, vermelho, azul\n→ moda = ^gazul^0', fig: { type: 'bars', labels: ['Azul', 'Verd', 'Verm'], values: [3, 1, 1], colors: ['#5a8aff', '#5aff7a', '#ff5a5a'] } }
    ] },
    dispersao: { title: 'Amplitude e Desvio Padrão', by: 'Tábua das Ruínas', pages: [
      { t: 'Dois arqueiros têm a MESMA média, mas um é bem mais consistente. Como medir isso? Com medidas de ^yDISPERSÃO^0!\n\n^gAmplitude^0 = maior valor - menor valor\n(simples, mas só olha os extremos)', fig: { type: 'twodots', a: [5, 6, 5, 4, 5], b: [1, 9, 3, 8, 4] } },
      { t: '^yDesvio^0 de um valor = valor - média\n^yVariância^0 = média dos desvios ao quadrado\n^yDesvio padrão (σ)^0 = √variância\n\nQuanto maior o σ, mais ^gespalhados^0 estão os dados em torno da média. σ = 0 quer dizer que todos são iguais.' },
      { t: 'Exemplo: 4, 8, 4, 8 → média = 6\nDesvios: -2, +2, -2, +2\nQuadrados: 4, 4, 4, 4 → variância = 4\nσ = √4 = ^g2^0\n\nCada valor está, "tipicamente", a 2 unidades da média.', fig: { type: 'dots', values: [4, 8, 4, 8], mark: 'mean' } }
    ] },
    prob: { title: 'Probabilidade', by: 'Tábua do Abismo', pages: [
      { t: '^yProbabilidade^0 mede a chance de algo acontecer:\nde ^g0 (impossível)^0 até ^g1 (certeza)^0.\n\n   ^cP = casos favoráveis ÷ casos possíveis^0\n\nDado: P(sair 6) = 1/6\nP(sair par) = 3/6 = 1/2', fig: { type: 'dice', hi: [2, 4, 6] } },
      { t: 'Saco com 3 bolas vermelhas e 1 azul:\nP(vermelha) = 3/4 = 0,75 = 75%\n\n^yComplemento^0: P(não A) = 1 - P(A)\nP(não vermelha) = 1 - 3/4 = ^g1/4^0', fig: { type: 'urn', r: 3, b: 1, y: 0 } }
    ] },
    combinada: { title: 'Eventos Combinados', by: 'Tábua do Abismo', pages: [
      { t: 'Eventos ^yindependentes^0: um não afeta o outro.\nRegra do "E": ^gmultiplique^0.\n  P(cara E 6) = 1/2 × 1/6 = 1/12\n\nEventos que não acontecem juntos.\nRegra do "OU": ^gsome^0.\n  P(1 OU 2 no dado) = 1/6 + 1/6 = 1/3' },
      { t: 'Com dois dados existem 6 × 6 = 36 combinações.\nA soma 7 aparece de 6 jeitos:\n1+6, 2+5, 3+4, 4+3, 5+2, 6+1\nP(soma 7) = 6/36 = ^g1/6^0 — a soma mais provável!', fig: { type: 'sums' } }
    ] },
    lgn: { title: 'Lei dos Grandes Números', by: 'Estátua de Bernoulli', pages: [
      { t: 'Jogue uma moeda 10 vezes: pode sair 7 caras (70%)!\nJogue 1000 vezes: a proporção fica ^gbem perto de 50%^0.\n\nIsso é a ^yLei dos Grandes Números^0 (Jacob Bernoulli, 1713): com muitas repetições, a frequência observada se aproxima da probabilidade.' },
      { t: 'Cuidado com a ^ofalácia do apostador^0:\ndepois de 5 caras seguidas, a próxima NÃO fica mais provável de ser coroa.\n\nA moeda não tem memória! Cada lançamento continua sendo 1/2.' }
    ] },
    esperanca: { title: 'Valor Esperado', by: 'Cassino de Pascal', pages: [
      { t: 'O ^yvalor esperado^0 (esperança) é a média de longo prazo de um jogo ou experimento.\n\n   ^cE = Σ (valor × probabilidade)^0\n\nDado: E = (1+2+3+4+5+6) × 1/6 = ^g3,5^0' },
      { t: 'Aposta: paga 30 moedas se a soma de 2 dados for 12 (P = 1/36). Custa 1 moeda.\n\nE(prêmio) = 30 × 1/36 ≈ 0,83 < 1\n\nEm média ^oo jogador perde^0 0,17 por rodada.\nÉ assim que os cassinos lucram!' }
    ] },
    freq: { title: 'Frequência e Histograma', by: 'Tábua da Torre', pages: [
      { t: '^yFrequência absoluta^0: quantas vezes um valor aparece.\n^yFrequência relativa^0: frequência ÷ total (vira %).\n\nUm ^yHISTOGRAMA^0 agrupa dados numéricos em faixas (classes) e desenha uma barra por faixa.', fig: { type: 'bars', labels: ['0-9', '10-19', '20-29', '30-39'], values: [2, 5, 7, 3] } },
      { t: 'Lendo um histograma:\n\n• A barra mais alta é a ^gclasse modal^0.\n• A soma das alturas é o total de dados.\n• O formato mostra se os dados são ^csimétricos^0 ou ^cassimétricos^0 (com uma "cauda" maior de um lado).' }
    ] },
    normal: { title: 'Distribuição Normal', by: 'Professor Galton', pages: [
      { t: 'Muitas medidas naturais (altura, erros de medida, notas) formam um ^ysino^0: a ^yDistribuição Normal^0, estudada por Gauss.\n\nÉ simétrica: ^gmédia = mediana = moda^0, todas no centro.', fig: { type: 'normal' } },
      { t: '^yRegra 68-95-99,7^0:\n\n• ~68% dos dados ficam a 1σ da média\n• ~95% ficam a 2σ\n• ~99,7% ficam a 3σ\n\nUm valor a mais de 3σ da média é muito raro!', fig: { type: 'normal', band: 2 } },
      { t: '^yAssimetria^0: com uma cauda longa à direita (poucos valores muito altos, como salários), a ^gmédia fica maior que a mediana^0.', fig: { type: 'skew' } }
    ] },
    amostra: { title: 'População e Amostra', by: 'Tábua do Castelo', pages: [
      { t: '^yPopulação^0: todo o grupo que queremos estudar.\n^yAmostra^0: a parte que realmente observamos.\n\nNem sempre dá para perguntar a todos, então pegamos uma amostra e ^gestimamos^0 como é a população.' },
      { t: 'Uma boa amostra é ^galeatória^0: todos têm a mesma chance de ser escolhidos.\n\nAmostras ^gmaiores^0 dão estimativas mais precisas (menos variação de uma amostra para outra).\n\nMas uma amostra GRANDE e enviesada continua errada!' }
    ] },
    vies: { title: 'Viés e Correlação', by: 'Tábua do Castelo', pages: [
      { t: '^yViés^0 é um erro sistemático que distorce os resultados:\n\n• ^oSeleção^0: amostra não representativa\n• ^oPergunta tendenciosa^0: induz a resposta\n• ^oSobrevivência^0: só vemos quem "sobreviveu"\n• ^oGráfico enganoso^0: eixos cortados ou distorcidos' },
      { t: '^yCorrelação^0: duas variáveis variam juntas (positiva: sobem juntas; negativa: uma sobe, a outra desce).\n\nMas ^gcorrelação NÃO é causalidade^0! Sorvete e afogamentos sobem juntos no verão... porque o calor causa os dois.', fig: { type: 'scatter', pts: [[0.1, 0.15], [0.2, 0.3], [0.3, 0.28], [0.4, 0.45], [0.5, 0.5], [0.6, 0.62], [0.7, 0.66], [0.8, 0.8], [0.9, 0.86]] } }
    ] },
    graficos: { title: 'Gráficos que Salvam Vidas', by: 'Enfermeira Florence', pages: [
      { t: 'Florence Nightingale (1820-1910) foi enfermeira e estatística. Ela usou gráficos para mostrar que a maioria das mortes nos hospitais de guerra vinha de ^gdoenças evitáveis^0, não de ferimentos.\n\nSeus gráficos convenceram o governo e ^gsalvaram milhares de vidas^0!' },
      { t: '^yBarras^0: comparam categorias.\n^yLinhas^0: mostram evolução no tempo.\n^ySetores (pizza)^0: partes de um todo.\n^yDispersão^0: relação entre duas variáveis.\n\nSempre confira os eixos: um eixo cortado pode enganar!', fig: { type: 'bars', labels: ['Doen', 'Feri', 'Outr'], values: [8, 2, 1], colors: ['#7ae4ff', '#ff5a5a', '#9a98b0'] } }
    ] }
  };
  G.LESSON_ORDER = ['intro', 'media', 'mediana', 'moda', 'dispersao', 'prob', 'combinada', 'lgn', 'esperanca', 'freq', 'normal', 'graficos', 'amostra', 'vies'];
})(window.G);
