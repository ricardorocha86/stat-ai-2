'use strict';
// =====================================================================
//  Estatística: funções de cálculo e GERADOR DE QUESTÕES procedurais.
//  Cada questão: { topic, text, options[], correct, explain, fig? }
// =====================================================================
(function (G) {
  const st = G.st = {
    sum: a => a.reduce((s, v) => s + v, 0),
    mean: a => (a.length ? st.sum(a) / a.length : 0),
    sorted: a => a.slice().sort((x, y) => x - y),
    median: a => { const s = st.sorted(a), n = s.length; if (!n) return 0; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; },
    modes: a => { const c = {}; let best = 0; for (const v of a) { c[v] = (c[v] || 0) + 1; best = Math.max(best, c[v]); } return Object.keys(c).filter(k => c[k] === best).map(Number); },
    range: a => (a.length ? Math.max(...a) - Math.min(...a) : 0),
    variance: a => { const m = st.mean(a); return st.mean(a.map(v => (v - m) * (v - m))); },
    std: a => Math.sqrt(st.variance(a)),
    freq: a => { const c = {}; for (const v of a) c[v] = (c[v] || 0) + 1; return c; }
  };
  const F = G.fmt;
  const list = a => a.join(', ');
  const ri = G.ri, pick = G.pick;

  G.TOPICS = {
    media: 'Média', mediana: 'Mediana', moda: 'Moda', amplitude: 'Amplitude', desvio: 'Desvio Padrão',
    prob: 'Probabilidade', combinada: 'Eventos Combinados', esperanca: 'Valor Esperado', freq: 'Frequência',
    normal: 'Distribuição Normal', amostra: 'Amostragem', vies: 'Viés', correlacao: 'Correlação'
  };

  // monta opções com o valor correto + distratores únicos
  function opts(correct, distract, fmtFn = F) {
    const set = [];
    const push = v => { const s = typeof v === 'string' ? v : fmtFn(v); if (!set.includes(s)) set.push(s); };
    const cs = typeof correct === 'string' ? correct : fmtFn(correct);
    push(correct);
    for (const d of distract) { if (set.length >= 4) break; push(d); }
    let k = 1;
    while (set.length < 4 && typeof correct === 'number') { push(correct + k * (k % 2 ? 1 : -1)); k++; }
    const sh = G.shuffle(set.slice());
    return { options: sh, correct: sh.indexOf(cs) };
  }
  function q(topic, text, correct, distract, explain, fig, fmtFn) {
    const o = opts(correct, distract, fmtFn);
    return { topic, text, options: o.options, correct: o.correct, explain, fig };
  }
  function qc(topic, text, options, correctIdx, explain, fig) { // questão conceitual com opções fixas
    const items = options.map((t, i) => ({ t, ok: i === correctIdx }));
    G.shuffle(items);
    return { topic, text, options: items.map(i => i.t), correct: items.findIndex(i => i.ok), explain, fig };
  }
  // gera lista de n inteiros com média inteira m
  function listWithMean(n, m, spread) {
    for (let tries = 0; tries < 200; tries++) {
      const a = [];
      for (let i = 0; i < n - 1; i++) a.push(m + ri(-spread, spread));
      const last = m * n - st.sum(a);
      if (last >= 1 && last <= 99 && Math.abs(last - m) <= spread + 2) { a.push(last); return G.shuffle(a); }
    }
    return Array(n).fill(m);
  }

  const GEN = {};
  // ------------------------- MÉDIA -------------------------
  GEN.media = (lv = 1) => {
    const kind = ri(0, lv >= 2 ? 4 : 2);
    if (kind <= 1) {
      const n = ri(3, lv >= 2 ? 6 : 5), m = ri(3, 12);
      const a = listWithMean(n, m, Math.min(m - 1, 5));
      const s = st.sum(a);
      const ctx = pick(['O guerreiro coletou estas moedas em ' + n + ' dias: ', 'Pontos feitos por partida: ', 'Gosmas derrotadas por hora: ', 'Peso (kg) de ' + n + ' melancias: ']);
      return q('media', ctx + '^y' + list(a) + '^0. Qual é a MÉDIA?', m, [st.median(a) === m ? m + 2 : st.median(a), s, m + 1, m - 1, Math.max(...a)],
        'Some tudo e divida pela quantidade: (' + a.join('+') + ') = ' + s + '; ' + s + ' ÷ ' + n + ' = ^g' + m + '^0.', { type: 'dots', values: a, mark: 'mean' });
    }
    if (kind === 2) {
      const m = ri(5, 9), a = [m + ri(-3, 3), m + ri(-3, 3)]; const third = 3 * m - a[0] - a[1];
      // notas na escala de 0 a 10
      if (third < 0 || third > 10 || a.some(v => v > 10)) return GEN.media(lv);
      return q('media', 'A média de 3 provas é ^y' + m + '^0. Duas notas foram ^y' + a[0] + '^0 e ^y' + a[1] + '^0. Qual foi a terceira nota?', third, [m, third + 1, third - 2, 3 * m],
        'Média 3 provas = ' + m + ' → soma = 3 × ' + m + ' = ' + 3 * m + '. Terceira = ' + 3 * m + ' - ' + a[0] + ' - ' + a[1] + ' = ^g' + third + '^0.');
    }
    if (kind === 3) {
      const n = 4, m = ri(4, 9), a = listWithMean(n, m, 3), k = ri(2, 5);
      return q('media', 'A média de ^y' + list(a) + '^0 é ' + m + '. Se somarmos ^y' + k + '^0 a CADA valor, qual será a nova média?', m + k, [m, m * k, m + k * n, m + 1],
        'Somar o mesmo número a todos os valores desloca a média pelo mesmo tanto: ' + m + ' + ' + k + ' = ^g' + (m + k) + '^0.');
    }
    // outlier
    const base = listWithMean(4, ri(4, 7), 2), out = ri(30, 50), all = base.concat([out]);
    const mm = st.mean(all), md = st.median(all);
    return qc('media', 'Valores: ^y' + list(all) + '^0. Um valor é muito diferente dos outros (um ^ooutlier^0). O que acontece com a média?',
      ['A média é puxada para cima pelo outlier', 'A média não muda nada', 'A média fica igual à mediana', 'A média fica menor que o menor valor'], 0,
      'A média usa TODOS os valores, então o ' + out + ' puxa a média para ' + F(mm) + ', enquanto a mediana fica em ' + F(md) + '. A média é sensível a valores extremos!', { type: 'dots', values: all, mark: 'both' });
  };
  // ------------------------- MEDIANA -------------------------
  GEN.mediana = (lv = 1) => {
    const even = lv >= 2 && G.chance(0.45);
    const n = even ? pick([4, 6]) : pick([3, 5, 7]);
    let a;
    do { a = []; for (let i = 0; i < n; i++) a.push(ri(1, 20)); } while (even && (st.median(a) % 1 !== 0 && st.median(a) % 1 !== 0.5));
    const s = st.sorted(a), md = st.median(a), mn = st.mean(a);
    const expl = even
      ? 'Ordenando: ' + list(s) + '. Com ' + n + ' valores (par), a mediana é a média dos dois do meio: (' + s[n / 2 - 1] + ' + ' + s[n / 2] + ') ÷ 2 = ^g' + F(md) + '^0.'
      : 'Ordenando: ' + list(s) + '. O valor do meio (posição ' + (n + 1) / 2 + ') é ^g' + md + '^0.';
    return q('mediana', 'Qual a MEDIANA de ^y' + list(a) + '^0?', md, [a[Math.floor(n / 2)], Math.round(mn * 10) / 10, s[0], s[n - 1], md + 1], expl, { type: 'dots', values: a, mark: 'median' });
  };
  // ------------------------- MODA -------------------------
  GEN.moda = (lv = 1) => {
    if (G.chance(0.35)) {
      const cores = ['Vermelho', 'Azul', 'Verde', 'Amarelo'];
      const counts = G.shuffle([ri(5, 8), ri(1, 3), ri(2, 4), ri(0, 2)]);
      const mx = Math.max(...counts); if (counts.filter(c => c === mx).length > 1) return GEN.moda(lv);
      const mode = cores[counts.indexOf(mx)];
      return qc('moda', 'Na pesquisa "cor favorita", o gráfico mostra quantas pessoas escolheram cada cor. Qual é a MODA?', cores.slice(), cores.indexOf(mode),
        'A moda é a categoria mais frequente: ^g' + mode + '^0 com ' + mx + ' votos. A moda funciona até com dados que não são números!', { type: 'bars', labels: ['Verm', 'Azul', 'Verd', 'Amar'], values: counts, colors: ['#ff5a5a', '#5a8aff', '#5aff7a', '#ffd84a'] });
    }
    const m = ri(2, 9);
    const a = [m, m, m];
    while (a.length < ri(6, 8)) { const v = ri(1, 12); if (v !== m && a.filter(x => x === v).length < 2) a.push(v); }
    G.shuffle(a);
    return q('moda', 'Qual é a MODA de ^y' + list(a) + '^0?', m, [st.median(a), Math.round(st.mean(a)), Math.max(...a), a[0] !== m ? a[0] : a[1]],
      'A moda é o valor que mais se repete: o ^g' + m + '^0 aparece 3 vezes.', { type: 'dots', values: a, mark: 'mode' });
  };
  // ------------------------- AMPLITUDE -------------------------
  GEN.amplitude = () => {
    const n = ri(4, 6), a = []; for (let i = 0; i < n; i++) a.push(ri(2, 30));
    const r = st.range(a);
    return q('amplitude', 'Qual a AMPLITUDE de ^y' + list(a) + '^0?', r, [Math.max(...a), Math.max(...a) + Math.min(...a), r + 2, Math.min(...a), Math.round(st.mean(a))],
      'Amplitude = maior - menor = ' + Math.max(...a) + ' - ' + Math.min(...a) + ' = ^g' + r + '^0.', { type: 'dots', values: a, mark: 'range' });
  };
  // ------------------------- DESVIO PADRÃO -------------------------
  GEN.desvio = (lv = 1) => {
    const kind = ri(0, 3);
    if (kind <= 1) { // comparar dispersão
      const m = ri(8, 14);
      const A = [m - 1, m, m + 1, m, m - 1 + ri(0, 2)].map(v => v);
      const B = [m - 6, m + 5, m - 3, m + 6, m - 2];
      const swap = G.chance(0.5);
      const X = swap ? B : A, Y = swap ? A : B;
      const ansIdx = st.std(X) < st.std(Y) ? 0 : 1;
      return qc('desvio', 'Dois arqueiros atiraram. Distâncias do centro: ^cA: ' + list(X) + '^0 e ^oB: ' + list(Y) + '^0. Qual é o mais CONSISTENTE (menor desvio padrão)?',
        ['Arqueiro A', 'Arqueiro B', 'Os dois são iguais', 'Impossível saber'], ansIdx,
        'Desvio padrão mede o quanto os valores se espalham em torno da média. σA ≈ ' + F(st.std(X), 1) + ' e σB ≈ ' + F(st.std(Y), 1) + '. Menor σ = mais consistente!', { type: 'twodots', a: X, b: Y });
    }
    if (kind === 2) { // calcular desvio de conjunto simples
      const m = ri(4, 10), d = ri(1, 4);
      const a = G.shuffle([m - d, m + d, m - d, m + d]);
      return q('desvio', 'Calcule o DESVIO PADRÃO (populacional) de ^y' + list(a) + '^0.', d, [d * d, 2 * d, m, 0, d + 1],
        'Média = ' + m + '. Cada valor está a ' + d + ' da média. Variância = média dos quadrados dos desvios = ' + d * d + '. σ = √' + d * d + ' = ^g' + d + '^0.', { type: 'dots', values: a, mark: 'mean' });
    }
    const m = ri(5, 9), d = ri(1, 3);
    const a = G.shuffle([m - d, m + d, m - d, m + d]);
    return q('desvio', 'Qual a VARIÂNCIA (populacional) de ^y' + list(a) + '^0?', d * d, [d, 2 * d, m, d * d + 1, 0],
      'Média = ' + m + '. Desvios: ±' + d + '. Quadrados: ' + d * d + '. Variância = média dos quadrados = ^g' + d * d + '^0 (e σ = ' + d + ').', { type: 'dots', values: a, mark: 'mean' });
  };
  // ------------------------- PROBABILIDADE -------------------------
  function frac(a, b) { const g = gcd(a, b); return (a / g) + '/' + (b / g); }
  function gcd(a, b) { return b ? gcd(b, a % b) : Math.abs(a); }
  G.frac = frac;
  GEN.prob = (lv = 1) => {
    const kind = ri(0, 4);
    if (kind === 0) {
      const ev = pick([['um número PAR', [2, 4, 6]], ['um número maior que 4', [5, 6]], ['o número 3', [3]], ['um número menor que 3', [1, 2]], ['um múltiplo de 3', [3, 6]]]);
      const c = frac(ev[1].length, 6);
      return q('prob', 'Ao lançar um dado comum de 6 faces, qual a probabilidade de sair ' + ev[0] + '?', c, [frac(Math.max(1, 6 - ev[1].length), 6), '1/2', '1/6', '1/3', '2/3'].filter(x => x !== c),
        'Casos favoráveis: {' + ev[1].join(', ') + '} = ' + ev[1].length + '. Casos possíveis: 6. P = ' + ev[1].length + '/6 = ^g' + c + '^0.', { type: 'dice', hi: ev[1] }, x => x);
    }
    if (kind <= 2) {
      const r = ri(1, 6), b = ri(1, 6), y = lv >= 2 ? ri(0, 3) : 0, tot = r + b + y;
      const c = frac(r, tot);
      return q('prob', 'Um saco tem ^r' + r + ' bolas vermelhas^0, ^b' + b + ' azuis^0' + (y ? ' e ^y' + y + ' amarelas^0' : '') + '. Tirando uma ao acaso, qual a chance de ser VERMELHA?', c,
        [frac(b, tot), frac(r, Math.max(1, b)), '1/2', frac(r + 1, tot + 1), frac(Math.max(1, tot - r), tot)].filter(x => x !== c),
        'P(vermelha) = vermelhas ÷ total = ' + r + '/' + tot + ' = ^g' + c + '^0.', { type: 'urn', r, b, y }, x => x);
    }
    if (kind === 3) {
      const p = pick([[1, 4], [1, 5], [2, 5], [3, 10], [1, 3], [3, 8]]);
      const c = frac(p[1] - p[0], p[1]);
      return q('prob', 'A chance de chover amanhã é ' + frac(p[0], p[1]) + '. Qual a chance de NÃO chover?', c, [frac(p[0], p[1]), '1/2', '1', frac(1, p[1])].filter(x => x !== c),
        'Evento complementar: P(não A) = 1 - P(A) = 1 - ' + frac(p[0], p[1]) + ' = ^g' + c + '^0.', null, x => x);
    }
    return qc('prob', 'Qual destes valores NÃO pode ser uma probabilidade?', ['1,2', '0', '0,5', '1'], 0, 'Probabilidades vão de ^g0^0 (impossível) a ^g1^0 (certo). 1,2 é maior que 1, então não pode!');
  };
  // ------------------------- EVENTOS COMBINADOS -------------------------
  GEN.combinada = () => {
    const kind = ri(0, 3);
    if (kind === 0) return q('combinada', 'Lançando DUAS moedas, qual a probabilidade de sair CARA nas duas?', '1/4', ['1/2', '1/3', '3/4', '1/8'], 'Eventos independentes: multiplique! 1/2 × 1/2 = ^g1/4^0. (Possibilidades: CC, CK, KC, KK)', { type: 'coins' }, x => x);
    if (kind === 1) {
      const s = pick([7, 2, 12, 6, 8]);
      const ways = { 2: 1, 6: 5, 7: 6, 8: 5, 12: 1 }[s];
      return q('combinada', 'Lançando dois dados, qual a probabilidade de a SOMA ser ^y' + s + '^0?', frac(ways, 36), [frac(1, 6), frac(1, 12), frac(ways + 1, 36), frac(1, 36)].filter(x => x !== frac(ways, 36)),
        'Há 36 combinações. Somam ' + s + ': ' + ways + ' delas. P = ' + ways + '/36 = ^g' + frac(ways, 36) + '^0. (7 é a soma mais provável!)', { type: 'sums' }, x => x);
    }
    if (kind === 2) return q('combinada', 'Lançando uma moeda 3 vezes, qual a probabilidade de sair CARA nas três?', '1/8', ['1/3', '1/6', '3/8', '1/2'], '1/2 × 1/2 × 1/2 = ^g1/8^0.', null, x => x);
    return q('combinada', 'Qual a chance de tirar um número PAR no dado E cara na moeda?', '1/4', ['1/2', '1/3', '2/3', '1/12'], 'Independentes: P(par) × P(cara) = 1/2 × 1/2 = ^g1/4^0.', null, x => x);
  };
  // ------------------------- VALOR ESPERADO -------------------------
  GEN.esperanca = () => {
    const kind = ri(0, 2);
    if (kind === 0) return q('esperanca', 'Qual o VALOR ESPERADO (média a longo prazo) ao lançar um dado de 6 faces?', 3.5, [3, 4, 6, 1], '(1+2+3+4+5+6) ÷ 6 = 21 ÷ 6 = ^g3,5^0. Nunca sai 3,5, mas é a média de muitos lançamentos!');
    if (kind === 1) {
      const p = pick([2, 4, 5, 10]), prize = pick([10, 20, 40]);
      const ev = prize / p;
      return q('esperanca', 'Um jogo paga ^y' + prize + ' moedas^0 com probabilidade 1/' + p + ' e nada caso contrário. Qual o valor esperado do prêmio?', ev, [prize, prize / 2 === ev ? prize / 4 : prize / 2, p, ev * 2],
        'E = prêmio × probabilidade = ' + prize + ' × 1/' + p + ' = ^g' + F(ev) + '^0 moedas.');
    }
    return qc('esperanca', 'Uma aposta custa 10 moedas e o valor esperado do prêmio é 8 moedas. Jogando muitas vezes, o que tende a acontecer?', ['Você perde moedas em média', 'Você ganha moedas em média', 'Você sempre empata', 'Depende só da sorte, não dá pra prever'], 0,
      'Em média você paga 10 e recebe 8: perde 2 por jogada. É assim que cassinos lucram! A ^gLei dos Grandes Números^0 garante isso a longo prazo.');
  };
  // ------------------------- FREQUÊNCIA / HISTOGRAMA -------------------------
  GEN.freq = () => {
    const labels = ['0-9', '10-19', '20-29', '30-39', '40-49'];
    const vals = labels.map(() => ri(1, 9));
    const kind = ri(0, 2);
    if (kind === 0) {
      const mx = Math.max(...vals); if (vals.filter(v => v === mx).length > 1) return GEN.freq();
      const lab = labels[vals.indexOf(mx)];
      const optsArr = [lab].concat(G.shuffle(labels.filter(l => l !== lab)).slice(0, 3));
      return qc('freq', 'O histograma mostra a idade dos visitantes do castelo. Qual FAIXA tem mais visitantes?', optsArr, 0,
        'A barra mais alta é a da faixa ^g' + lab + '^0 (' + mx + ' pessoas). Ela é a classe modal.', { type: 'bars', labels, values: vals });
    }
    if (kind === 1) {
      const tot = st.sum(vals);
      return q('freq', 'Pelo histograma, quantas pessoas foram pesquisadas NO TOTAL?', tot, [tot - 3, tot + 5, Math.max(...vals), vals.length], 'Soma das alturas das barras: ' + vals.join('+') + ' = ^g' + tot + '^0.', { type: 'bars', labels, values: vals });
    }
    const tot = 20, a = ri(2, 8);
    return q('freq', 'Em ' + tot + ' lançamentos, saiu "6" em ^y' + a + '^0 deles. Qual a FREQUÊNCIA RELATIVA do 6?', F(a / tot) , [F(a / 6), String(a), F(1 / 6, 2), F((a + 2) / tot)], 'Frequência relativa = vezes ÷ total = ' + a + '/' + tot + ' = ^g' + F(a / tot) + '^0 (ou ' + Math.round(a / tot * 100) + '%).', null, x => x);
  };
  // ------------------------- NORMAL -------------------------
  GEN.normal = () => {
    const kind = ri(0, 3);
    const mu = pick([100, 50, 170, 60]), sg = pick([10, 5, 15]);
    if (kind === 0) return q('normal', 'Alturas seguem uma curva normal com média ' + mu + ' e desvio padrão ' + sg + '. Aproximadamente que % das pessoas está entre ' + (mu - sg) + ' e ' + (mu + sg) + '?', '68%', ['95%', '50%', '99,7%', '34%'],
      'Regra 68-95-99,7: entre μ-σ e μ+σ ficam cerca de ^g68%^0 dos dados.', { type: 'normal', band: 1 }, x => x);
    if (kind === 1) return q('normal', 'Numa distribuição normal (μ=' + mu + ', σ=' + sg + '), cerca de que % está entre ' + (mu - 2 * sg) + ' e ' + (mu + 2 * sg) + '?', '95%', ['68%', '50%', '100%', '75%'],
      'Entre μ-2σ e μ+2σ ficam cerca de ^g95%^0 dos dados.', { type: 'normal', band: 2 }, x => x);
    if (kind === 2) return qc('normal', 'Numa distribuição normal (formato de sino), como se comparam média, mediana e moda?', ['São todas iguais (no centro)', 'A média é sempre maior', 'A moda fica na ponta', 'Não existe mediana'], 0,
      'A curva normal é ^gsimétrica^0: média = mediana = moda, todas no pico central.', { type: 'normal' });
    return qc('normal', 'Uma distribuição tem uma "cauda" longa para a DIREITA (alguns valores muito altos, como salários). O que geralmente acontece?', ['Média > mediana', 'Média < mediana', 'Média = mediana sempre', 'Mediana = 0'], 0,
      'Valores altos extremos puxam a média para a direita: na assimetria à direita, ^gmédia > mediana^0.', { type: 'skew' });
  };
  // ------------------------- AMOSTRAGEM -------------------------
  const AMOSTRA = [
    ['Para saber a fruta favorita da vila, qual amostra é MELHOR?', ['Sortear 50 moradores de toda a vila', 'Perguntar só na feira de bananas', 'Perguntar só aos seus amigos', 'Perguntar a 1 pessoa'], 'Sorteio (amostra aleatória) dá a todos a mesma chance de participar, evitando ^gviés de seleção^0.'],
    ['O que é uma POPULAÇÃO em estatística?', ['Todo o grupo que queremos estudar', 'Só as pessoas de uma cidade', 'Uma parte escolhida do grupo', 'O resultado de uma pesquisa'], 'População = todos os elementos de interesse. ^gAmostra^0 = parte da população que observamos.'],
    ['Em geral, uma amostra aleatória MAIOR...', ['Dá estimativas mais precisas', 'Sempre tem mais viés', 'Não muda nada', 'Fica igual à população inteira'], 'Amostras maiores têm menos variação nas estimativas (erro menor), se forem aleatórias.'],
    ['Uma pesquisa online pergunta "Você gosta de internet?". Qual o problema?', ['Só responde quem usa internet: viés', 'Nenhum problema', 'A amostra é aleatória demais', 'Tem pessoas demais'], 'Quem está online já tende a gostar de internet: ^gviés de seleção^0!'],
    ['Para estimar a altura média dos 600 alunos, mediram 60 sorteados. Os 60 são a...', ['Amostra', 'População', 'Moda', 'Variância'], 'Os 60 sorteados formam a ^gamostra^0; os 600 são a população.']
  ];
  const VIES = [
    ['Uma marca diz: "9 de 10 dentistas recomendam!", mas só perguntou a 10 dentistas que ela patrocina. Isso é...', ['Viés de seleção', 'Amostra aleatória', 'Desvio padrão', 'Probabilidade'], 'A amostra foi escolhida a dedo: ^gviés^0. O resultado não representa todos os dentistas.'],
    ['Um gráfico de barras começa o eixo em 98 em vez de 0, fazendo 99 parecer o dobro de 98,5. Isso é um...', ['Gráfico enganoso', 'Gráfico perfeito', 'Histograma correto', 'Teste de hipótese'], 'Cortar o eixo exagera diferenças pequenas. Sempre confira a escala!'],
    ['Perguntar "Você não acha que o rei é ótimo?" é um exemplo de...', ['Pergunta tendenciosa', 'Pergunta neutra', 'Amostra grande', 'Média ponderada'], 'A pergunta induz a resposta: ^gviés de resposta^0.'],
    ['Só os aventureiros que VOLTARAM contam histórias da caverna. Concluir "a caverna é segura" é...', ['Viés de sobrevivência', 'Uma conclusão correta', 'Uma mediana', 'Um evento certo'], 'Quem não voltou não conta histórias: ^gviés de sobrevivência^0!']
  ];
  const CORR = [
    ['Cidades com mais sorveterias têm mais afogamentos. Sorvete causa afogamento?', ['Não: o calor causa os dois', 'Sim, com certeza', 'Sim, se for de chocolate', 'Afogamento causa sorvete'], '^gCorrelação não é causalidade!^0 Um terceiro fator (o calor do verão) aumenta os dois.'],
    ['Quanto mais horas de treino, mais vitórias. Isso é uma correlação...', ['Positiva', 'Negativa', 'Nula', 'Impossível'], 'As duas variáveis crescem juntas: correlação ^gpositiva^0.'],
    ['Quanto mais rápido o carro, menos tempo a viagem leva. Correlação...', ['Negativa', 'Positiva', 'Nula', 'Causal inversa'], 'Uma sobe enquanto a outra desce: correlação ^gnegativa^0.']
  ];
  GEN.amostra = () => { const it = pick(AMOSTRA); return qc('amostra', it[0], it[1], 0, it[2]); };
  GEN.vies = () => { const it = pick(VIES); return qc('vies', it[0], it[1], 0, it[2]); };
  GEN.correlacao = () => {
    if (G.chance(0.5)) {
      const sgn = pick([1, -1, 0]);
      const pts = [];
      for (let i = 0; i < 12; i++) { const x = G.rf(0, 1); const y = sgn === 0 ? G.rf(0, 1) : G.clamp(0.5 + sgn * (x - 0.5) * 0.9 + G.rf(-0.15, 0.15), 0, 1); pts.push([x, y]); }
      const names = ['Positiva', 'Negativa', 'Sem correlação'];
      const idx = sgn === 1 ? 0 : sgn === -1 ? 1 : 2;
      return qc('correlacao', 'Que tipo de correlação o gráfico de dispersão mostra?', names.concat(['Causal']), idx,
        sgn === 1 ? 'Os pontos sobem da esquerda para a direita: ^gpositiva^0.' : sgn === -1 ? 'Os pontos descem: ^gnegativa^0.' : 'Os pontos estão espalhados sem padrão: ^gsem correlação^0.', { type: 'scatter', pts });
    }
    const it = pick(CORR); return qc('correlacao', it[0], it[1], 0, it[2]);
  };

  // grupos de tópicos por região/masmorra
  G.TOPIC_SETS = {
    d1: ['media'], d2: ['mediana', 'moda'], d3: ['amplitude', 'desvio'], d4: ['prob', 'combinada'],
    d5: ['freq', 'normal'], d6: ['amostra', 'vies', 'correlacao'],
    all: ['media', 'mediana', 'moda', 'amplitude', 'desvio', 'prob', 'combinada', 'esperanca', 'freq', 'normal', 'amostra', 'vies', 'correlacao']
  };
  const LESSON_TOPICS = { media: ['media'], mediana: ['mediana'], moda: ['moda'], dispersao: ['amplitude', 'desvio'], prob: ['prob'], combinada: ['combinada'], lgn: ['esperanca'], esperanca: ['esperanca'], freq: ['freq'], normal: ['normal'], amostra: ['amostra'], vies: ['vies', 'correlacao'] };
  G.Q = {
    GEN, LESSON_TOPICS, helpers: { q, qc, opts },
    gen(topic, lv = 1) {
      if (G.TOPIC_SETS[topic]) topic = pick(G.TOPIC_SETS[topic]);
      const f = GEN[topic] || GEN.media;
      let qq;
      for (let i = 0; i < 6; i++) { try { qq = f(lv); } catch (e) { console.error(e); qq = null; } if (qq && qq.options.length >= 2 && qq.correct >= 0) break; }
      if (!qq || qq.correct < 0) qq = GEN.media(1);
      return qq;
    },
    // perguntas de tópicos que o jogador já desbloqueou
    genUnlocked(lv = 1) {
      const P = G.P; const L = (P && P.lessons) || [];
      const map = LESSON_TOPICS;
      let pool = [];
      for (const l of L) if (map[l]) pool = pool.concat(map[l]);
      if (!pool.length) pool = ['media'];
      return this.gen(pick(pool), lv);
    }
  };
})(window.G);
