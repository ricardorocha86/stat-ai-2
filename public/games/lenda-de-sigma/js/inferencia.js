'use strict';
// =====================================================================
//  Inferência: assuntos novos — quartis e boxplot, distribuição binomial,
//  Teorema Central do Limite, intervalo de confiança, teste de hipótese e
//  probabilidade condicional. Lições do Grimório, gerador de questões e
//  figuras novas (boxplot, binomial, médias, intervalos, valor-p, tabela).
// =====================================================================
(function (G) {
  const st = G.st, F = G.fmt, ri = G.ri, pick = G.pick;
  const list = a => a.join(', ');

  // ------------------------------------------------------------------
  //  Cálculos
  // ------------------------------------------------------------------
  // quartis pelo método das metades (a mediana fica de fora quando n é ímpar)
  st.quartiles = a => {
    const s = st.sorted(a), n = s.length, h = Math.floor(n / 2);
    return [st.median(s.slice(0, h)), st.median(s), st.median(s.slice(n % 2 ? h + 1 : h))];
  };
  st.comb = (n, k) => { if (k < 0 || k > n) return 0; let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return Math.round(r); };
  st.binom = (n, k, p) => st.comb(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
  // distribuição exata da média de n dados (lista de [média, prob])
  st.diceMeanDist = n => {
    let d = [1];
    for (let i = 0; i < n; i++) { const nd = new Array(d.length + 6).fill(0); d.forEach((v, s) => { for (let f = 1; f <= 6; f++) nd[s + f] += v / 6; }); d = nd; }
    const out = []; d.forEach((v, s) => { if (v > 0) out.push([s / n, v]); });
    return out;
  };
  const frac = G.frac;

  // ------------------------------------------------------------------
  //  Lições
  // ------------------------------------------------------------------
  Object.assign(G.LESSONS, {
    quartis: { title: 'Quartis e Boxplot', by: 'Ferreiro Tukey', pages: [
      { t: 'Os ^yQUARTIS^0 dividem os dados ordenados em ^gquatro partes iguais^0:\n\n• ^yQ1^0: 25% dos dados ficam abaixo dele\n• ^yQ2^0: é a própria mediana (50%)\n• ^yQ3^0: 75% dos dados ficam abaixo dele\n\nComo achar: ordene, ache a mediana (Q2). Q1 é a mediana da metade de baixo; Q3, a mediana da metade de cima.' },
      { t: 'Exemplo: 2, 4, 5, 7, 8, 9, 12\nMediana Q2 = ^g7^0\nMetade de baixo: 2, 4, 5 → Q1 = ^g4^0\nMetade de cima: 8, 9, 12 → Q3 = ^g9^0\n\nA ^yamplitude interquartil^0 (IQR) = Q3 - Q1 = ^g5^0: o tamanho da "metade do meio" dos dados.', fig: { type: 'box', values: [2, 4, 5, 7, 8, 9, 12] } },
      { t: 'O ^yBOXPLOT^0 (diagrama de caixa) foi popularizado por ^cJohn Tukey^0: uma caixa de Q1 a Q3, um traço na mediana e "bigodes" até os valores mais extremos que não são outliers.\n\n^oOutlier^0: valor abaixo de Q1 - 1,5·IQR ou acima de Q3 + 1,5·IQR. Ele aparece como um ponto solto!', fig: { type: 'box', values: [6, 8, 9, 10, 10, 11, 12, 13, 24] } }
    ] },
    binomial: { title: 'Distribuição Binomial', by: 'Tábua do Observatório', pages: [
      { t: 'Repita um experimento ^yn vezes^0. Cada vez só há dois resultados (^gsucesso^0 ou fracasso), com a mesma chance ^yp^0, e uma tentativa não afeta a outra.\n\nO número de sucessos segue a ^yDISTRIBUIÇÃO BINOMIAL^0.\nExemplo: lançar 4 moedas e contar as caras.' },
      { t: 'O ^yTriângulo de Pascal^0 conta os jeitos: cada número é a soma dos dois de cima. A linha 4 é ^g1 4 6 4 1^0:\n\n4 moedas → 16 resultados possíveis. Só 1 jeito de dar 0 caras, mas 6 jeitos de dar 2 caras!\nP(2 caras) = 6/16 = ^g3/8^0.', fig: { type: 'binom', n: 4, p: 0.5, hi: 2 } },
      { t: 'Fórmula: ^cP(k sucessos) = C(n,k) · pᵏ · (1-p)ⁿ⁻ᵏ^0\nonde C(n,k) vem do Triângulo de Pascal.\n\n^yValor esperado^0 = n · p.\n10 tentativas com p = 0,3 dão, em média, ^g3 sucessos^0 — mas às vezes saem 1, 2, 5...', fig: { type: 'binom', n: 10, p: 0.3, hi: 3 } }
    ] },
    tcl: { title: 'Teorema Central do Limite', by: 'Eremita Laplace', pages: [
      { t: 'Um dado é "plano": cada face tem chance 1/6. Nada de sino!\n\nMas faça assim: lance ^y5 dados^0, tire a ^yMÉDIA^0, anote. Repita muitas vezes...\n\nO histograma das médias forma um ^gSINO^0!', fig: { type: 'clt', n: 1 } },
      { t: 'Esse é o ^yTeorema Central do Limite^0 (Laplace, 1810):\n\n^gmédias de amostras grandes seguem, aproximadamente, uma distribuição normal^0 — qualquer que seja a forma dos dados originais (desde que a variância seja finita).\n\nPor isso a curva normal aparece em todo lugar!', fig: { type: 'clt', n: 5 } },
      { t: 'E tem mais: quanto ^ymaior a amostra^0, mais ^gestreito^0 fica o sino das médias.\n\nO desvio padrão das médias é ^cσ ÷ √n^0.\nCom n = 4, o espalhamento cai pela metade. Com n = 100, cai para um décimo!\n\nAmostras grandes dão médias mais confiáveis.' }
    ] },
    confianca: { title: 'Intervalo de Confiança', by: 'Pescador Neyman', pages: [
      { t: 'Uma amostra nunca acerta o valor EXATO da população. Por isso damos uma faixa:\n\n   ^cestimativa ± margem de erro^0\n\n"62% querem a ponte, com margem de 5 pontos" dá o intervalo de ^g57% a 67%^0: os valores plausíveis para a população, vindos de um método que costuma acertar.', fig: { type: 'ci', est: 62, m: 5 } },
      { t: '^cJerzy Neyman^0 criou o ^yintervalo de confiança^0 em 1937.\n\nUm intervalo de ^y95%^0 vem de um método que acerta em 95% das amostras: de 20 intervalos, em média ^g19 capturam^0 o valor verdadeiro (e 1 erra!).', fig: { type: 'ci', many: true } },
      { t: 'Regra prática para proporções (95%):\n\n   ^cmargem ≈ 1 ÷ √n^0\n\nn = 25 → ±20%   n = 100 → ±10%\nn = 400 → ±5%   n = 2500 → ±2%\n\nPara cortar a margem pela ^ymetade^0, é preciso ^g4 vezes^0 mais gente!' }
    ] },
    hipotese: { title: 'Teste de Hipótese', by: 'Dona Muriel', pages: [
      { t: 'Afirmação: "sei dizer se o leite foi servido antes do chá!". Como testar?\n\nSupomos o contrário: a ^yhipótese nula H₀^0 diz "ela só está chutando". Depois fazemos o experimento e vemos se os dados ^gcontradizem^0 H₀.' },
      { t: 'O ^yvalor-p^0 é a chance de obter um resultado tão extremo quanto o observado ^gSE H₀ for verdadeira^0.\n\nAcertar as 8 xícaras (4 de cada tipo) só chutando: existem 70 jeitos de escolher 4 xícaras de 8, e só 1 está certo.\nValor-p = 1/70 ≈ ^g1,4%^0.', fig: { type: 'pval', z: 2.2 } },
      { t: 'Regra comum: se ^yp < 0,05^0 (5%), ^grejeitamos H₀^0: o resultado é "estatisticamente significativo".\n\n^oCuidado^0: um valor-p grande NÃO prova que H₀ é verdadeira. Só diz que os dados não bastam para rejeitá-la.\n\nE nada de repetir o teste até dar p pequeno!' }
    ] },
    condicional: { title: 'Probabilidade Condicional', by: 'Sábio Bayes', pages: [
      { t: '^yP(A | B)^0 = chance de A ^gsabendo que B aconteceu^0.\n\nSaber B muda o universo: só contamos os casos em que B ocorreu.\n\n   ^cP(A|B) = casos com A e B ÷ casos com B^0', fig: { type: 'table2', rows: ['Tesouro', 'Vazio'], cols: ['Apitou', 'Quieto'], v: [[9, 1], [27, 63]], hi: 0 } },
      { t: 'Um detector apita em 90% dos tesouros, mas também em 30% dos lugares vazios. Só 10 de cada 100 lugares têm tesouro.\n\nApitos: 9 (tesouro) + 27 (vazio) = 36.\nP(tesouro | apitou) = 9/36 = ^g25%^0. Bem menos do que parece! Isso é a ^ytaxa-base^0.' },
      { t: 'O ^yTeorema de Bayes^0 ensina a ^gatualizar crenças^0: comece com a chance "a priori", observe uma evidência e calcule a chance "a posteriori".\n\n^oCuidado^0: P(A|B) ≠ P(B|A)!\nQuase todo pato sabe nadar, mas quase nada que nada é pato.' }
    ] }
  });
  const ord = G.LESSON_ORDER;
  for (const id of ['quartis', 'binomial', 'tcl', 'confianca', 'hipotese', 'condicional']) if (!ord.includes(id)) ord.push(id);

  Object.assign(G.TOPICS, { quartis: 'Quartis e Boxplot', binomial: 'Binomial', lgn: 'Grandes Números', tcl: 'Teorema Central', confianca: 'Intervalo de Confiança', hipotese: 'Teste de Hipótese', condicional: 'Prob. Condicional' });
  G.TOPIC_SETS.d7 = ['quartis', 'binomial', 'tcl', 'confianca', 'hipotese', 'condicional'];
  G.TOPIC_SETS.all = G.TOPIC_SETS.all.concat(['quartis', 'binomial', 'lgn', 'tcl', 'confianca', 'hipotese', 'condicional']);
  Object.assign(G.Q.LESSON_TOPICS, { lgn: ['esperanca', 'lgn'], quartis: ['quartis'], binomial: ['binomial'], tcl: ['tcl'], confianca: ['confianca'], hipotese: ['hipotese'], condicional: ['condicional'] });

  // ------------------------------------------------------------------
  //  Questões
  // ------------------------------------------------------------------
  const { q, qc } = G.Q.helpers, GEN = G.Q.GEN;

  GEN.quartis = (lv = 1) => {
    const kind = ri(0, 4);
    if (kind <= 1) {
      const n = pick([7, 7, 11]); let a;
      do { a = []; for (let i = 0; i < n; i++) a.push(ri(1, 30)); } while (new Set(a).size < n - 1);
      const s = st.sorted(a), [q1, md, q3] = st.quartiles(a), which = pick(['Q1', 'Q3']), ans = which === 'Q1' ? q1 : q3;
      return q('quartis', 'Dados: ^y' + list(a) + '^0. Qual é o ' + (which === 'Q1' ? '^y1º QUARTIL (Q1)^0' : '^y3º QUARTIL (Q3)^0') + '?', ans, [which === 'Q1' ? q3 : q1, md, s[0], s[n - 1], ans + 1],
        'Ordenando: ' + list(s) + '. Mediana = ' + F(md) + '. ' + (which === 'Q1' ? 'Q1 = mediana da metade de baixo = ^g' + F(q1) : 'Q3 = mediana da metade de cima = ^g' + F(q3)) + '^0.', { type: 'box', values: a, mark: 'box' });
    }
    if (kind === 2) {
      const q1 = ri(4, 20), iqr = ri(3, 12), q3 = q1 + iqr;
      return q('quartis', 'Um boxplot tem Q1 = ^y' + q1 + '^0 e Q3 = ^y' + q3 + '^0. Qual a AMPLITUDE INTERQUARTIL (IQR)?', iqr, [q3 + q1, Math.round((q1 + q3) / 2), q3, iqr * 2],
        'IQR = Q3 - Q1 = ' + q3 + ' - ' + q1 + ' = ^g' + iqr + '^0. É a largura da caixa: a metade central dos dados.');
    }
    if (kind === 3) {
      const q1 = pick([10, 12, 20, 30]), iqr = pick([4, 6, 8]), q3 = q1 + iqr, top = q3 + 1.5 * iqr;
      const out = top + ri(1, 4), safe = [Math.floor(top) - 1, q1 + 1, q1 - Math.floor(iqr / 2)];
      return qc('quartis', 'Q1 = ' + q1 + ' e Q3 = ' + q3 + '. Pela regra de 1,5·IQR, qual destes valores é um ^oOUTLIER^0?', [F(out)].concat(safe.map(F)), 0,
        'IQR = ' + iqr + '. Limite de cima = Q3 + 1,5·IQR = ' + q3 + ' + ' + F(1.5 * iqr) + ' = ' + F(top) + '. Só ^g' + F(out) + '^0 passa desse limite.');
    }
    return qc('quartis', 'Que porcentagem dos dados fica DENTRO da caixa de um boxplot (entre Q1 e Q3)?', ['Cerca de 50%', 'Cerca de 25%', 'Cerca de 75%', '100%'], 0,
      'Abaixo de Q1 ficam 25% e acima de Q3 mais 25%. Na caixa sobra a ^gmetade do meio: 50%^0.', { type: 'box', values: [3, 5, 6, 7, 8, 9, 11, 12, 14] });
  };

  GEN.binomial = (lv = 1) => {
    const kind = ri(0, 4);
    if (kind === 0) {
      const k = ri(0, 3), c = frac(st.comb(3, k), 8);
      return q('binomial', 'Lançando ^y3 moedas^0, qual a probabilidade de sair ^yexatamente ' + k + ' cara' + (k === 1 ? '' : 's') + '^0?', c, ['1/2', '1/3', '1/8', '3/8', '1/4'].filter(x => x !== c),
        'Há 8 resultados (2×2×2). Jeitos de ter ' + k + ' cara(s): ' + st.comb(3, k) + ' (linha 3 do Triângulo de Pascal: 1 3 3 1). P = ' + st.comb(3, k) + '/8 = ^g' + c + '^0.', { type: 'binom', n: 3, p: 0.5, hi: k }, x => x);
    }
    if (kind === 1) {
      const n = pick([4, 5]), k = ri(1, n - 1), w = st.comb(n, k);
      return q('binomial', 'Lançando ^y' + n + ' moedas^0, de QUANTOS JEITOS podem sair exatamente ' + k + ' caras?', w, [n, k, w + 1, Math.pow(2, n), n * k],
        'Linha ' + n + ' do Triângulo de Pascal: ' + Array.from({ length: n + 1 }, (_, i) => st.comb(n, i)).join(' ') + '. A posição ' + k + ' vale ^g' + w + '^0.', { type: 'triangle', n, hi: n, hk: k, mark: 'k' });
    }
    if (kind === 2) {
      const [n, pn, pd] = pick([[10, 1, 2], [20, 1, 4], [50, 1, 10], [30, 1, 3], [12, 1, 6], [40, 3, 10], [100, 1, 5]]);
      const e = n * pn / pd;
      return q('binomial', 'Uma tentativa dá certo com chance ' + frac(pn, pd) + '. Repetindo ^y' + n + ' vezes^0, quantos sucessos esperamos EM MÉDIA?', e, [n, e * 2, Math.round(e / 2), n - e, pd],
        'Valor esperado da binomial = n · p = ' + n + ' × ' + frac(pn, pd) + ' = ^g' + F(e) + '^0.');
    }
    if (kind === 3) {
      const n = ri(3, 5), c = frac(1, Math.pow(2, n));
      return q('binomial', 'Lançando uma moeda ^y' + n + ' vezes^0, qual a chance de dar CARA em TODAS?', c, ['1/' + n, '1/2', frac(1, n * 2), frac(n, Math.pow(2, n))].filter(x => x !== c),
        'Só existe 1 jeito (todas caras) entre 2^' + n + ' = ' + Math.pow(2, n) + ' resultados: ^g' + c + '^0.', null, x => x);
    }
    return qc('binomial', 'Qual destas situações segue uma distribuição ^yBINOMIAL^0?', ['Contar quantas caras saem em 10 lançamentos', 'Medir a altura de 10 pessoas', 'Anotar a cor favorita de cada aluno', 'Cronometrar uma corrida'], 0,
      'Binomial = número de ^gsucessos^0 em n tentativas independentes, cada uma com a mesma chance p. Contar caras é o exemplo clássico!');
  };

  GEN.lgn = () => {
    const kind = ri(0, 3);
    if (kind === 0) return qc('lgn', 'Uma moeda honesta deu CARA 5 vezes seguidas. Qual a chance de dar CARA no próximo lançamento?', ['1/2', 'Menor que 1/2', 'Maior que 1/2', 'Zero'], 0,
      'A moeda não tem memória: continua ^g1/2^0. Achar que "agora tem que dar coroa" é a ^ofalácia do apostador^0.');
    if (kind === 1) return qc('lgn', 'Em qual caso a proporção de caras deve ficar MAIS PERTO de 50%?', ['1000 lançamentos', '10 lançamentos', '3 lançamentos', 'Tanto faz'], 0,
      'Lei dos Grandes Números: quanto ^gmais repetições^0, mais a frequência se aproxima da probabilidade.');
    if (kind === 2) {
      const n = pick([600, 1200, 300, 1800]);
      return q('lgn', 'Um dado honesto foi lançado ^y' + n + '^0 vezes. Quantas vezes, aproximadamente, deve ter saído o número 4?', n / 6, [n / 2, n / 4, n / 3, 4],
        'Cada face tem chance 1/6. Com muitos lançamentos, a frequência fica perto de ' + n + ' ÷ 6 = ^g' + n / 6 + '^0.');
    }
    return qc('lgn', 'O que diz a ^yLei dos Grandes Números^0?', ['Com muitas repetições, a frequência se aproxima da probabilidade', 'Números grandes saem mais vezes', 'Depois de muitas coroas, vem cara', 'Amostras pequenas são mais precisas'], 0,
      'Jacob Bernoulli (1713): repetindo um experimento muitas vezes, a ^gfrequência relativa converge para a probabilidade^0.');
  };

  GEN.tcl = () => {
    const kind = ri(0, 3);
    if (kind === 0) return qc('tcl', 'Lance 30 dados e tire a MÉDIA. Repita isso muitas vezes. O histograma dessas médias tem forma de...', ['Sino (curva normal)', 'Reta plana', 'Letra U', 'Escada'], 0,
      'Teorema Central do Limite: ^gmédias de muitas amostras formam um sino^0, mesmo que um dado sozinho seja plano.', { type: 'clt', n: 5 });
    if (kind === 1) return qc('tcl', 'Quanto MAIOR o tamanho n de cada amostra, o sino das médias fica...', ['Mais estreito', 'Mais largo', 'Igual', 'Mais assimétrico'], 0,
      'O desvio padrão das médias é σ ÷ √n: n maior → sino ^gmais estreito^0 (médias mais precisas).');
    if (kind === 2) {
      const [sg, n] = pick([[10, 4], [12, 9], [20, 16], [30, 25], [12, 36], [50, 100], [18, 9], [40, 16]]), r = sg / Math.sqrt(n);
      return q('tcl', 'Os dados têm desvio padrão σ = ^y' + sg + '^0. Qual o desvio padrão das MÉDIAS de amostras com n = ^y' + n + '^0?', r, [sg, sg / n, sg * Math.sqrt(n), r * 2],
        'σ ÷ √n = ' + sg + ' ÷ √' + n + ' = ' + sg + ' ÷ ' + Math.sqrt(n) + ' = ^g' + F(r) + '^0.');
    }
    return qc('tcl', 'O Teorema Central do Limite vale mesmo se os dados originais NÃO forem normais?', ['Sim, com amostras grandes o suficiente', 'Não, nunca', 'Só com moedas', 'Só se n = 1'], 0,
      'Essa é a mágica do teorema: a forma original quase ^gnão importa^0 — as médias de amostras grandes ficam aproximadamente normais.');
  };

  GEN.confianca = () => {
    const kind = ri(0, 3);
    if (kind === 0) {
      const e = pick([40, 48, 52, 55, 60, 62, 70]), m = pick([3, 4, 5, 6]);
      const ok = (e - m) + '% a ' + (e + m) + '%';
      return qc('confianca', 'Uma pesquisa estima ^y' + e + '%^0 com margem de erro de ^y' + m + ' pontos^0. Qual é o intervalo?', [ok, e + '% a ' + (e + m) + '%', (e - 2 * m) + '% a ' + (e + 2 * m) + '%', (e - m) + '% a ' + e + '%'], 0,
        'Intervalo = estimativa ± margem = ' + e + ' ± ' + m + ' → ^g' + ok + '^0.', { type: 'ci', est: e, m });
    }
    if (kind === 1) {
      const [n, m] = pick([[25, 20], [100, 10], [400, 5], [2500, 2], [10000, 1]]);
      return q('confianca', 'Pela regra prática (margem ≈ 1 ÷ √n), qual a margem de erro de uma pesquisa com ^yn = ' + n + '^0 pessoas?', m + '%', [(m * 2) + '%', F(Math.max(1, m / 2)) + '%', '1%', '50%', (m + 5) + '%'].filter(x => x !== m + '%'),
        '1 ÷ √' + n + ' = 1 ÷ ' + Math.sqrt(n) + ' = ' + F(1 / Math.sqrt(n), 3) + ' → ^g±' + m + '%^0.', null, x => x);
    }
    if (kind === 2) return qc('confianca', 'Para reduzir a margem de erro pela METADE, a amostra precisa ser...', ['4 vezes maior', '2 vezes maior', 'Metade do tamanho', '10 vezes menor'], 0,
      'A margem cai com √n. Para dividir a margem por 2, √n precisa dobrar, ou seja, n fica ^g4 vezes maior^0.');
    return qc('confianca', 'Um intervalo de ^y95% de confiança^0 significa que...', ['O método acerta o valor verdadeiro em 95% das amostras', '95% das pessoas concordam', 'A estimativa está 95% certa, sempre', 'Sobraram 5% dos dados'], 0,
      'É sobre o ^gmétodo^0: de cada 20 amostras, cerca de 19 geram intervalos que contêm o valor verdadeiro.', { type: 'ci', many: true });
  };

  GEN.hipotese = () => {
    const kind = ri(0, 4);
    if (kind === 0) {
      const p = pick([0.01, 0.02, 0.03, 0.004, 0.08, 0.15, 0.3, 0.6]), rej = p < 0.05;
      return qc('hipotese', 'Um teste com nível de 5% deu ^yvalor-p = ' + F(p, 3) + '^0. O que fazemos?', ['Rejeitar H₀', 'Não rejeitar H₀', 'Provar que H₀ é verdadeira', 'Repetir até dar p menor'], rej ? 0 : 1,
        rej ? 'p = ' + F(p, 3) + ' < 0,05: o resultado seria muito raro se H₀ fosse verdade. ^gRejeitamos H₀^0.' : 'p = ' + F(p, 3) + ' ≥ 0,05: os dados não bastam para rejeitar H₀. (Isso não prova H₀!)', { type: 'pval', z: rej ? 2.3 : 0.9 });
    }
    if (kind === 1) return qc('hipotese', 'Um mágico diz que sua moeda dá CARA mais da metade das vezes. Qual é a ^yhipótese nula H₀^0?', ['A moeda é honesta: P(cara) = 1/2', 'A moeda dá mais caras', 'A moeda dá mais coroas', 'O mágico sempre mente'], 0,
      'H₀ é a hipótese "sem efeito", a do ceticismo: ^ga moeda é honesta^0. O teste procura evidências contra ela.');
    if (kind === 2) {
      const k = ri(3, 6), c = frac(1, Math.pow(2, k));
      return q('hipotese', 'Alguém diz que adivinha moedas e acertou ^y' + k + ' de ' + k + '^0 lançamentos. Se só estivesse chutando (H₀), qual seria a chance disso?', c, ['1/2', '1/' + k, frac(k, Math.pow(2, k)), frac(1, k * 2)].filter(x => x !== c),
        'Chutando, cada acerto tem chance 1/2: (1/2)^' + k + ' = ^g' + c + '^0. Esse é o valor-p do experimento!', null, x => x);
    }
    if (kind === 3) return qc('hipotese', 'O teste deu valor-p = 0,40. Isso PROVA que H₀ é verdadeira?', ['Não: só faltam evidências contra H₀', 'Sim, prova', 'Prova que H₀ é falsa', 'Prova que o teste está errado'], 0,
      '"Ausência de evidência não é evidência de ausência." Um p grande só diz que ^gnão dá para rejeitar H₀^0.');
    return qc('hipotese', 'O que é o ^yvalor-p^0?', ['A chance de um resultado tão extremo, se H₀ for verdadeira', 'A chance de H₀ ser verdadeira', 'O tamanho da amostra', 'A média dos dados'], 0,
      'Valor-p = P(resultado tão ou mais extremo | H₀ verdadeira). Pequeno → o resultado ^gcontradiz H₀^0.', { type: 'pval', z: 2.2 });
  };

  const CTX2 = [
    { rows: ['Tesouro', 'Vazio'], cols: ['Apitou', 'Quieto'], q: (r, c) => 'Dos lugares em que o detector ^yAPITOU^0, qual a chance de ter ^yTESOURO^0?' },
    { rows: ['Venceu', 'Perdeu'], cols: ['Treinou', 'Faltou'], q: () => 'Dos guerreiros que ^yTREINARAM^0, qual a chance de terem ^yVENCIDO^0?' },
    { rows: ['Choveu', 'Seco'], cols: ['Nublado', 'Limpo'], q: () => 'Nos dias ^yNUBLADOS^0, qual a chance de ter ^yCHOVIDO^0?' },
    { rows: ['Doente', 'Sadio'], cols: ['Positivo', 'Negativo'], q: () => 'Dos exames ^yPOSITIVOS^0, qual a chance de a pessoa estar ^yDOENTE^0?' }
  ];
  GEN.condicional = () => {
    const kind = ri(0, 3);
    if (kind <= 1) {
      const cx = pick(CTX2), a = ri(2, 9), c = ri(1, 9), b = ri(1, 5), d = ri(3, 14), ans = frac(a, a + c);
      const dis = [frac(a, a + b), frac(a, a + b + c + d), frac(c, a + c), frac(a + c, a + b + c + d)].filter(x => x !== ans);
      return q('condicional', cx.q() + ' (Veja a tabela.)', ans, dis,
        'Só olhamos a coluna "' + cx.cols[0] + '": ' + a + ' + ' + c + ' = ' + (a + c) + ' casos. Destes, ' + a + ' são "' + cx.rows[0] + '". P = ' + a + '/' + (a + c) + ' = ^g' + ans + '^0.',
        { type: 'table2', rows: cx.rows, cols: cx.cols, v: [[a, b], [c, d]], hi: 0 }, x => x);
    }
    if (kind === 2) {
      const s = ri(3, 6), ans = frac(1, s - 1);
      return q('condicional', 'Dois dados foram lançados e a SOMA deu ^y' + s + '^0. Sabendo disso, qual a chance de o PRIMEIRO dado ter dado 1?', ans, ['1/6', '1/36', frac(1, s), '1/2'].filter(x => x !== ans),
        'Somas ' + s + ': ' + Array.from({ length: s - 1 }, (_, i) => (i + 1) + '+' + (s - 1 - i)).join(', ') + ' → ' + (s - 1) + ' casos. Só 1 começa com 1: ^g' + ans + '^0.', null, x => x);
    }
    const r = ri(2, 5), b = ri(1, 4), ans = frac(r - 1, r + b - 1);
    return q('condicional', 'Um saco tem ^r' + r + ' bolas vermelhas^0 e ^b' + b + ' azuis^0. Tirei uma VERMELHA e não devolvi. Qual a chance de a próxima ser vermelha?', ans, [frac(r, r + b), frac(r - 1, r + b), frac(b, r + b - 1), '1/2'].filter(x => x !== ans),
      'Sobraram ' + (r - 1) + ' vermelhas em ' + (r + b - 1) + ' bolas: ^g' + ans + '^0. Sem devolver, a primeira retirada ^gmuda^0 a chance da segunda!', { type: 'urn', r: r - 1, b, y: 0 }, x => x);
  };

  // ------------------------------------------------------------------
  //  Figuras
  // ------------------------------------------------------------------
  const FIG = G.FIG;
  function range(vals) { let lo = Math.floor(Math.min(...vals)) - 1, hi = Math.ceil(Math.max(...vals)) + 1; while (hi - lo < 8) { lo--; hi++; } if (lo < 0 && Math.min(...vals) >= 0) { hi -= lo; lo = 0; } return [lo, hi]; }
  function axis(ctx, x0, x1, ay, lo, hi) {
    G.rect(ctx, x0, ay, x1 - x0, 1, '#9a98b0');
    const span = hi - lo, step = span <= 12 ? 1 : span <= 24 ? 2 : span <= 60 ? 5 : 10;
    for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) {
      const px = x0 + (v - lo) / span * (x1 - x0);
      G.rect(ctx, px, ay, 1, 3, '#9a98b0');
      if ((v / step) % (span / step > 12 ? 2 : 1) === 0) G.text(String(v), px + 1, ay + 5, '#9a98b0', { align: 'center', shadow: false });
    }
  }
  const ball = (ctx, x, y, r, c) => { ctx.fillStyle = '#05040c'; ctx.beginPath(); ctx.arc(x, y, r + 0.6, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(x - r * 0.5, y - r * 0.6, r * 0.5, r * 0.35); };
  // desenha um boxplot horizontal (também usado nos enigmas)
  G.drawBox = function (ctx, vals, x0, x1, cy, px, o = {}) {
    const [q1, md, q3] = st.quartiles(vals), iqr = q3 - q1, lo = q1 - 1.5 * iqr, hi = q3 + 1.5 * iqr;
    const inn = vals.filter(v => v >= lo && v <= hi), out = vals.filter(v => v < lo || v > hi);
    const wmin = Math.min(...inn), wmax = Math.max(...inn), bh = o.h || 12;
    ctx.save();
    ctx.strokeStyle = o.wcol || '#c8d8ff'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(px(wmin), cy); ctx.lineTo(px(q1), cy); ctx.moveTo(px(q3), cy); ctx.lineTo(px(wmax), cy);
    ctx.moveTo(px(wmin), cy - bh * 0.3); ctx.lineTo(px(wmin), cy + bh * 0.3); ctx.moveTo(px(wmax), cy - bh * 0.3); ctx.lineTo(px(wmax), cy + bh * 0.3); ctx.stroke();
    const g = ctx.createLinearGradient(0, cy - bh / 2, 0, cy + bh / 2); g.addColorStop(0, o.top || '#5aa8ff'); g.addColorStop(1, o.bot || '#2a5ab0');
    ctx.fillStyle = g; ctx.fillRect(px(q1), cy - bh / 2, px(q3) - px(q1), bh);
    ctx.strokeStyle = '#e8f4ff'; ctx.strokeRect(px(q1) + 0.5, cy - bh / 2 + 0.5, px(q3) - px(q1) - 1, bh - 1);
    ctx.fillStyle = '#ffd84a'; ctx.fillRect(px(md) - 0.75, cy - bh / 2, 1.5, bh);
    ctx.restore();
    for (const v of out) ball(ctx, px(v), cy, 2, '#ff5a6a');
    if (o.labels !== false) {
      G.text('Q1', px(q1), cy - bh / 2 - 9, '#9ac8ff', { align: 'center', shadow: false });
      G.text('Md', px(md), cy - bh / 2 - 9, '#ffd84a', { align: 'center', shadow: false });
      G.text('Q3', px(q3), cy - bh / 2 - 9, '#9ac8ff', { align: 'center', shadow: false });
      if (out.length) G.text('outlier', px(out[0]), cy + 5, '#ff8a9a', { align: 'center', shadow: false });
    }
    return { q1, md, q3, iqr, lo, hi, out };
  };
  FIG.box = (ctx, f, x, y, w, h) => {
    const v = f.values, [lo, hi] = range(v);
    const x0 = x + 8, x1 = x + w - 8, ay = y + h - 16, px = val => x0 + (val - lo) / (hi - lo) * (x1 - x0);
    axis(ctx, x0, x1, ay, lo, hi);
    const cnt = {};
    for (const val of v) { const k = cnt[val] = (cnt[val] || 0) + 1; ball(ctx, px(val), ay - 3 - (k - 1) * 4, 1.6, '#7ae4ff'); }
    if (f.mark !== null) G.drawBox(ctx, v, x0, x1, y + (ay - y) * 0.48 + 2, px, { h: Math.min(14, h * 0.18) });
    else G.text('?', x + w / 2, y + (ay - y) * 0.45, '#ffd84a', { align: 'center', shadow: false });
  };
  FIG.binom = (ctx, f, x, y, w, h) => {
    const n = f.n, p = f.p, vals = []; for (let k = 0; k <= n; k++) vals.push(st.binom(n, k, p));
    const mx = Math.max(...vals), top = y + 14, base = y + h - 14, slot = (w - 16) / (n + 1), bw = Math.max(2, slot - 2);
    G.rect(ctx, x + 8, base, w - 16, 1, '#9a98b0');
    vals.forEach((v, k) => {
      const bh = v / mx * (base - top), bx = x + 8 + k * slot + (slot - bw) / 2, c = k === f.hi ? '#ffd84a' : '#7ae4ff';
      G.rect(ctx, bx, base - bh, bw, bh, c); G.rect(ctx, bx, base - bh, bw, 1, '#ffffff');
      if (n <= 12) G.text(String(k), bx + bw / 2 + 0.5, base + 3, k === f.hi ? '#ffd84a' : '#9a98b0', { align: 'center', shadow: false });
    });
    G.text('n=' + n + '  p=' + (p === 0.5 ? '1/2' : F(p)), x + w - 6, y + 4, '#c8c8e0', { align: 'right', shadow: false });
  };
  FIG.clt = (ctx, f, x, y, w, h) => {
    const d = st.diceMeanDist(f.n), mx = Math.max(...d.map(e => e[1]));
    const top = y + 14, base = y + h - 14, x0 = x + 10, x1 = x + w - 10, slot = (x1 - x0) / d.length, bw = Math.max(1, slot - (d.length > 20 ? 0.5 : 2));
    G.rect(ctx, x0, base, x1 - x0, 1, '#9a98b0');
    d.forEach(([m, v], i) => { const bh = v / mx * (base - top) * (f.n === 1 ? 0.6 : 1), bx = x0 + i * slot + (slot - bw) / 2; G.rect(ctx, bx, base - bh, bw, bh, f.n >= 5 ? '#7aff8a' : '#7ae4ff'); G.rect(ctx, bx, base - bh, bw, 0.5, '#ffffff'); });
    G.text('1', x0, base + 3, '#9a98b0', { shadow: false }); G.text('6', x1 - 4, base + 3, '#9a98b0', { shadow: false }); G.text('3,5', (x0 + x1) / 2, base + 3, '#ffd84a', { align: 'center', shadow: false });
    G.text('média de ' + f.n + (f.n === 1 ? ' dado' : ' dados'), x + w - 6, y + 4, '#c8c8e0', { align: 'right', shadow: false });
  };
  FIG.ci = (ctx, f, x, y, w, h) => {
    if (f.many) {
      const truth = 50, x0 = x + 10, x1 = x + w - 10, px = v => x0 + (v - 30) / 40 * (x1 - x0);
      const r = G.mulberry32(7);
      ctx.save(); ctx.strokeStyle = '#ffd84a'; ctx.setLineDash([2, 2]); ctx.beginPath(); ctx.moveTo(px(truth), y + 4); ctx.lineTo(px(truth), y + h - 12); ctx.stroke(); ctx.restore();
      const rows = 20, rh = (h - 18) / rows;
      for (let i = 0; i < rows; i++) {
        let e = truth + (r() - 0.5) * 10.5; if (i === 13) e = truth + 9;
        const m = 6, hit = Math.abs(e - truth) <= m, yy = y + 5 + i * rh;
        G.rect(ctx, px(e - m), yy, px(e + m) - px(e - m), Math.max(1, rh * 0.45), hit ? '#7ae4ff' : '#ff5a6a');
        G.rect(ctx, px(e) - 0.5, yy - 0.5, 1, rh * 0.45 + 1, '#ffffff');
      }
      G.text('valor verdadeiro', px(truth), y + h - 9, '#ffd84a', { align: 'center', shadow: false });
      return;
    }
    const e = f.est, m = f.m, lo = e - m * 3, hi = e + m * 3, x0 = x + 12, x1 = x + w - 12, ay = y + h - 18, px = v => x0 + (v - lo) / (hi - lo) * (x1 - x0);
    axis(ctx, x0, x1, ay, Math.round(lo), Math.round(hi));
    const cy = y + (ay - y) * 0.55;
    ctx.save(); const g = ctx.createLinearGradient(px(e - m), 0, px(e + m), 0); g.addColorStop(0, 'rgba(122,228,255,0.25)'); g.addColorStop(0.5, 'rgba(122,228,255,0.7)'); g.addColorStop(1, 'rgba(122,228,255,0.25)');
    ctx.fillStyle = g; ctx.fillRect(px(e - m), cy - 5, px(e + m) - px(e - m), 10); ctx.restore();
    G.rect(ctx, px(e - m), cy - 7, 1, 14, '#7ae4ff'); G.rect(ctx, px(e + m), cy - 7, 1, 14, '#7ae4ff');
    ball(ctx, px(e), cy, 2.2, '#ffd84a');
    G.text(e + ' ± ' + m, px(e), cy - 17, '#ffd84a', { align: 'center', shadow: false });
    G.text(String(e - m), px(e - m), cy + 8, '#7ae4ff', { align: 'center', shadow: false }); G.text(String(e + m), px(e + m), cy + 8, '#7ae4ff', { align: 'center', shadow: false });
  };
  FIG.pval = (ctx, f, x, y, w, h) => {
    const base = y + h - 14, top = y + 10, x0 = x + 6, x1 = x + w - 6, sd = (x1 - x0) / 7, cx = (x0 + x1) / 2, z0 = f.z || 2;
    for (let px = x0; px <= x1; px++) {
      const z = (px - cx) / sd, v = Math.exp(-z * z / 2), ph = v * (base - top), tail = z >= z0;
      G.rect(ctx, px, base - ph, 1, ph, tail ? '#ff6a7a' : '#3a5a9a'); G.rect(ctx, px, base - ph, 1, 1, '#ffffff');
    }
    G.rect(ctx, x0, base, x1 - x0, 1, '#9a98b0');
    G.rect(ctx, cx + z0 * sd, top + 4, 1, base - top - 4, '#ffd84a');
    G.text('observado', cx + z0 * sd, top - 4, '#ffd84a', { align: 'center', shadow: false });
    G.text('H₀', cx, base + 3, '#c8c8e0', { align: 'center', shadow: false });
    G.text('valor-p', Math.min(x1 - 14, cx + z0 * sd + 14), base - 14, '#ff8a9a', { align: 'center', shadow: false });
  };
  FIG.table2 = (ctx, f, x, y, w, h) => {
    const v = f.v, cw = (w - 12) / 4, rh = Math.min(16, (h - 8) / 4), x0 = x + 6, y0 = y + 4 + (h - 8 - rh * 4) / 2;
    const tot = [[v[0][0] + v[0][1]], [v[1][0] + v[1][1]]], ct = [v[0][0] + v[1][0], v[0][1] + v[1][1]];
    const cell = (cx, cy, txt, col, bg) => { if (bg) { ctx.fillStyle = bg; ctx.fillRect(x0 + cx * cw + 0.5, y0 + cy * rh + 0.5, cw - 1, rh - 1); } G.text(txt, x0 + cx * cw + cw / 2, y0 + cy * rh + rh / 2 - 3.5, col, { align: 'center', shadow: false }); };
    ctx.save(); ctx.strokeStyle = 'rgba(154,152,176,0.5)'; ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(x0, y0 + i * rh); ctx.lineTo(x0 + cw * 4, y0 + i * rh); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x0 + i * cw, y0); ctx.lineTo(x0 + i * cw, y0 + rh * 4); ctx.stroke(); }
    ctx.restore();
    const hiC = f.hi;
    cell(1, 0, f.cols[0], '#ffe27a', hiC === 0 ? 'rgba(255,216,74,0.18)' : null); cell(2, 0, f.cols[1], '#ffe27a', hiC === 1 ? 'rgba(255,216,74,0.18)' : null); cell(3, 0, 'Total', '#9a98b0');
    for (let r = 0; r < 2; r++) {
      cell(0, r + 1, f.rows[r], '#9ac8ff');
      for (let c = 0; c < 2; c++) cell(c + 1, r + 1, String(v[r][c]), '#ffffff', hiC === c ? 'rgba(255,216,74,0.18)' : null);
      cell(3, r + 1, String(tot[r]), '#9a98b0');
    }
    cell(0, 3, 'Total', '#9a98b0'); cell(1, 3, String(ct[0]), hiC === 0 ? '#ffd84a' : '#9a98b0', hiC === 0 ? 'rgba(255,216,74,0.18)' : null); cell(2, 3, String(ct[1]), hiC === 1 ? '#ffd84a' : '#9a98b0', hiC === 1 ? 'rgba(255,216,74,0.18)' : null); cell(3, 3, String(ct[0] + ct[1]), '#9a98b0');
  };
  FIG.triangle = (ctx, f, x, y, w, h) => {
    const n = f.n, rh = (h - 8) / (n + 1), cw = Math.min(22, (w - 10) / (n + 1));
    for (let r = 0; r <= n; r++) for (let k = 0; k <= r; k++) {
      const cx = x + w / 2 + (k - r / 2) * cw, cy = y + 4 + r * rh + rh / 2, hi = r === f.hi && f.mark !== null && (f.hk === undefined || f.hk === k);
      ctx.fillStyle = hi ? 'rgba(255,216,74,0.3)' : r === f.hi ? 'rgba(122,228,255,0.15)' : 'rgba(255,255,255,0.05)';
      G.rrPath(ctx, cx - cw / 2 + 1, cy - rh / 2 + 0.5, cw - 2, rh - 1, 2); ctx.fill();
      G.text(String(st.comb(r, k)), cx, cy - 3.5, hi ? '#ffd84a' : r === f.hi ? '#9ad8ff' : '#e8e4f4', { align: 'center', shadow: false });
    }
  };
})(window.G);
