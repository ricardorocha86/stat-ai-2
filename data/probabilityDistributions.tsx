import React from 'react';
import * as M from '../services/probability/mathLib';
import { fmt, fmtPrecise } from '../services/probability/format';

// Catalog of the probability calculators, ported from the course's standalone calculators.
// The Normal has its own calculator (CALCULATORS lists it); the others share the generic one.

export type Params = Record<string, number>;
export type MomentValue = number | string;

export interface DistributionParam {
  id: string;
  label: string;
  def: number;
  min?: number;
  max?: number;
  integer?: boolean;
}

export interface Moments {
  mean: MomentValue;
  variance: MomentValue;
  mode: MomentValue;
  median: MomentValue;
  skewness: MomentValue;
  kurtosis: MomentValue;
}

interface DistributionBase {
  id: string;
  name: string;
  notation: string;
  description: string;
  params: DistributionParam[];
  cdf: (params: Params, x: number) => number;
  quantile: (params: Params, p: number) => number;
  moments: (params: Params) => Moments;
  relations: (params: Params) => React.ReactNode[];
  // Message shown instead of the results while the parameters do not define a distribution.
  validate?: (params: Params) => string | null;
}

export interface DiscreteDistribution extends DistributionBase {
  type: 'discrete';
  pmf: (params: Params, k: number) => number;
  support: (params: Params) => { kMin: number; kMax: number };
  plotRange: (params: Params) => { kMin: number; kMax: number };
}

export interface ContinuousDistribution extends DistributionBase {
  type: 'continuous';
  pdf: (params: Params, x: number) => number;
  support: (params: Params) => { xMin: number; xMax: number };
  plotRange: (params: Params) => { xMin: number; xMax: number };
}

export type Distribution = DiscreteDistribution | ContinuousDistribution;

const Ok: React.FC<{ children: React.ReactNode }> = ({ children }) => <span className="font-semibold text-green-700">✓ {children}</span>;
const No: React.FC<{ children: React.ReactNode }> = ({ children }) => <span className="font-semibold text-amber-700">✗ {children}</span>;
const Warn: React.FC<{ children: React.ReactNode }> = ({ children }) => <span className="font-semibold text-amber-700">{children}</span>;

/* ============================================================
   DISCRETAS
   ============================================================ */

const bernoulli: DiscreteDistribution = {
  id: 'bernoulli',
  type: 'discrete',
  name: 'Bernoulli',
  notation: 'X ~ Bern(p)',
  description: 'Um único ensaio com dois resultados possíveis. X = 1 representa sucesso (com prob. p) e X = 0 fracasso (com prob. 1−p).',
  params: [{ id: 'p', label: 'p — probabilidade de sucesso', def: 0.5, min: 0, max: 1 }],
  pmf: ({ p }, k) => M.bernoulliPMF(k, p),
  cdf: ({ p }, k) => M.bernoulliCDF(k, p),
  quantile: ({ p }, q) => M.bernoulliQuantile(q, p),
  support: () => ({ kMin: 0, kMax: 1 }),
  plotRange: () => ({ kMin: 0, kMax: 1 }),
  moments: ({ p }) => ({
    mean: p,
    variance: p * (1 - p),
    mode: p > 0.5 ? 1 : (p < 0.5 ? 0 : '0 ou 1'),
    median: p < 0.5 ? 0 : (p > 0.5 ? 1 : '0 ou 1'),
    skewness: p === 0 || p === 1 ? NaN : (1 - 2 * p) / Math.sqrt(p * (1 - p)),
    kurtosis: p === 0 || p === 1 ? NaN : (1 - 6 * p * (1 - p)) / (p * (1 - p)),
  }),
  relations: ({ p }) => [
    'Bern(p) = Bin(1, p) — caso especial da Binomial com n = 1.',
    'A soma X₁ + X₂ + … + Xₙ de Bernoullis i.i.d. com parâmetro p é Bin(n, p).',
    `Entropia: H(X) = −p log p − (1−p) log(1−p) = ${p === 0 || p === 1 ? '0' : fmtPrecise(-p * Math.log(p) - (1 - p) * Math.log(1 - p), 4)} nats.`,
  ],
};

const binomial: DiscreteDistribution = {
  id: 'binomial',
  type: 'discrete',
  name: 'Binomial',
  notation: 'X ~ Bin(n, p)',
  description: 'Número de sucessos em n ensaios de Bernoulli independentes, cada um com probabilidade p de sucesso.',
  params: [
    { id: 'n', label: 'n — número de ensaios', def: 10, min: 1, integer: true },
    { id: 'p', label: 'p — probabilidade de sucesso', def: 0.5, min: 0, max: 1 },
  ],
  pmf: ({ n, p }, k) => M.binomialPMF(k, n, p),
  cdf: ({ n, p }, k) => M.binomialCDF(k, n, p),
  quantile: ({ n, p }, q) => M.binomialQuantile(q, n, p),
  support: ({ n }) => ({ kMin: 0, kMax: n }),
  plotRange: ({ n }) => ({ kMin: 0, kMax: n }),
  moments: ({ n, p }) => ({
    mean: n * p,
    variance: n * p * (1 - p),
    mode: Math.floor((n + 1) * p),
    median: '≈ ⌊np⌋ ou ⌈np⌉',
    skewness: n * p * (1 - p) > 0 ? (1 - 2 * p) / Math.sqrt(n * p * (1 - p)) : NaN,
    kurtosis: n * p * (1 - p) > 0 ? (1 - 6 * p * (1 - p)) / (n * p * (1 - p)) : NaN,
  }),
  relations: ({ n, p }) => {
    const np = n * p;
    const nq = n * (1 - p);
    return [
      <><b>Aproximação Normal:</b> Bin(n, p) ≈ N(np, np(1−p)) = N({fmtPrecise(np, 2)}; {fmtPrecise(np * (1 - p), 2)}) quando np ≥ 5 e n(1−p) ≥ 5.{' '}
        {np >= 5 && nq >= 5
          ? <Ok>Aplicável (np = {fmtPrecise(np, 1)}; n(1−p) = {fmtPrecise(nq, 1)})</Ok>
          : <No>Não recomendável (np = {fmtPrecise(np, 2)}; n(1−p) = {fmtPrecise(nq, 2)})</No>}</>,
      <><b>Aproximação de Poisson:</b> Bin(n, p) ≈ Pois(np) = Pois({fmtPrecise(np, 2)}) quando n grande e p pequeno (regra prática: n ≥ 30 e p ≤ 0,05).{' '}
        {n >= 30 && p <= 0.05 ? <Ok>Aplicável</Ok> : <No>Não recomendável</No>}</>,
      'Soma de Bernoullis: se X₁, …, Xₙ são Bern(p) i.i.d., então ΣXᵢ ~ Bin(n, p).',
      'Soma de Binomiais: Bin(n₁, p) + Bin(n₂, p) = Bin(n₁ + n₂, p) (mesmo p).',
    ];
  },
};

const poisson: DiscreteDistribution = {
  id: 'poisson',
  type: 'discrete',
  name: 'Poisson',
  notation: 'X ~ Pois(λ)',
  description: 'Número de eventos que ocorrem em um intervalo fixo de tempo (ou espaço), quando os eventos são raros, independentes e ocorrem a uma taxa média λ.',
  params: [{ id: 'lambda', label: 'λ — taxa média de eventos', def: 4, min: 0 }],
  validate: ({ lambda }) => lambda > 0 ? null : 'λ precisa ser maior que zero.',
  pmf: ({ lambda }, k) => M.poissonPMF(k, lambda),
  cdf: ({ lambda }, k) => M.poissonCDF(k, lambda),
  quantile: ({ lambda }, q) => M.poissonQuantile(q, lambda),
  support: () => ({ kMin: 0, kMax: Infinity }),
  plotRange: ({ lambda }) => ({ kMin: 0, kMax: Math.max(10, Math.ceil(lambda + 5 * Math.sqrt(Math.max(lambda, 1)))) }),
  moments: ({ lambda }) => ({
    mean: lambda,
    variance: lambda,
    mode: lambda >= 1 ? Math.floor(lambda) : 0,
    median: '≈ ⌊λ + 1/3 − 0,02/λ⌋',
    skewness: 1 / Math.sqrt(lambda),
    kurtosis: 1 / lambda,
  }),
  relations: ({ lambda }) => [
    <><b>Aproximação Normal:</b> Pois(λ) ≈ N(λ, λ) quando λ ≥ 10 (regra prática). {lambda >= 10 ? <Ok>Aplicável</Ok> : <No>Use λ ≥ 10</No>}</>,
    <><b>Relação com a Exponencial:</b> se o número de eventos num intervalo é Pois(λt), o tempo entre eventos é Exp(λ).</>,
    'Soma: Pois(λ₁) + Pois(λ₂) = Pois(λ₁ + λ₂) (variáveis independentes).',
    'Limite da Binomial: Bin(n, p) → Pois(λ) quando n → ∞ e p → 0 com np = λ.',
  ],
};

const geometrica: DiscreteDistribution = {
  id: 'geometrica',
  type: 'discrete',
  name: 'Geométrica',
  notation: 'X ~ Geom(p), X ∈ {1, 2, 3, …}',
  description: 'Número de tentativas até obter o primeiro sucesso em uma sequência de ensaios de Bernoulli independentes com probabilidade p de sucesso. Convenção: X conta o ensaio do sucesso.',
  params: [{ id: 'p', label: 'p — probabilidade de sucesso', def: 0.3, min: 0.001, max: 1 }],
  pmf: ({ p }, k) => M.geomPMF(k, p),
  cdf: ({ p }, k) => M.geomCDF(k, p),
  quantile: ({ p }, q) => M.geomQuantile(q, p),
  support: () => ({ kMin: 1, kMax: Infinity }),
  plotRange: ({ p }) => ({ kMin: 1, kMax: Math.max(10, Math.ceil(M.geomQuantile(0.995, p) + 1)) }),
  moments: ({ p }) => ({
    mean: 1 / p,
    variance: (1 - p) / (p * p),
    mode: 1,
    median: Math.ceil(-Math.log(2) / Math.log(1 - p)),
    skewness: (2 - p) / Math.sqrt(1 - p),
    kurtosis: 6 + (p * p) / (1 - p),
  }),
  relations: () => [
    <><b>Falta de memória:</b> P(X &gt; a + b | X &gt; a) = P(X &gt; b). Única distribuição discreta com essa propriedade.</>,
    'Caso particular da Binomial Negativa: Geom(p) = NB(r = 1, p).',
    'Análogo discreto da Exponencial: Exp(λ) é a versão contínua da Geom.',
    'Tem outra convenção comum (Y = X − 1, k ∈ {0, 1, 2, …} = falhas antes do sucesso). Aqui usamos X ∈ {1, 2, …}.',
  ],
};

const binomialneg: DiscreteDistribution = {
  id: 'binomialneg',
  type: 'discrete',
  name: 'Binomial Negativa',
  notation: 'X ~ NB(r, p), X ∈ {r, r+1, …}',
  description: 'Número de tentativas necessárias para obter exatamente r sucessos em uma sequência de ensaios de Bernoulli independentes com probabilidade p de sucesso.',
  params: [
    { id: 'r', label: 'r — número de sucessos desejados', def: 3, min: 1, integer: true },
    { id: 'p', label: 'p — probabilidade de sucesso', def: 0.4, min: 0.001, max: 1 },
  ],
  pmf: ({ r, p }, k) => M.negbinPMF(k, r, p),
  cdf: ({ r, p }, k) => M.negbinCDF(k, r, p),
  quantile: ({ r, p }, q) => M.negbinQuantile(q, r, p),
  support: ({ r }) => ({ kMin: r, kMax: Infinity }),
  plotRange: ({ r, p }) => ({ kMin: r, kMax: Math.max(r + 10, Math.ceil(M.negbinQuantile(0.995, r, p) + 1)) }),
  moments: ({ r, p }) => ({
    mean: r / p,
    variance: r * (1 - p) / (p * p),
    mode: r >= 1 ? Math.floor(r + (r - 1) * (1 - p) / p) : '—',
    median: '—',
    skewness: (2 - p) / Math.sqrt(r * (1 - p)),
    kurtosis: 6 / r + (p * p) / (r * (1 - p)),
  }),
  relations: () => [
    'Caso especial: NB(1, p) = Geom(p) — primeiro sucesso.',
    'Soma de Geométricas: a soma de r Geom(p) independentes é NB(r, p).',
    'CDF via Beta regularizada: P(X ≤ k) = I_p(r, k − r + 1).',
    'Existe convenção alternativa contando apenas os fracassos (Y = X − r, k ∈ {0, 1, 2, …}). Aqui contamos o número total de tentativas.',
  ],
};

const hipergeometrica: DiscreteDistribution = {
  id: 'hipergeometrica',
  type: 'discrete',
  name: 'Hipergeométrica',
  notation: 'X ~ HG(N, K, n)',
  description: 'Número de sucessos em n retiradas SEM reposição de uma população finita com N itens dos quais K são sucessos.',
  params: [
    { id: 'N', label: 'N — tamanho da população', def: 50, min: 1, integer: true },
    { id: 'K', label: 'K — sucessos na população', def: 20, min: 0, integer: true },
    { id: 'n', label: 'n — tamanho da amostra', def: 10, min: 1, integer: true },
  ],
  validate: ({ N, K, n }) => K > N ? 'K não pode ser maior que N.' : (n > N ? 'n não pode ser maior que N.' : null),
  pmf: ({ N, K, n }, k) => M.hyperPMF(k, N, K, n),
  cdf: ({ N, K, n }, k) => M.hyperCDF(k, N, K, n),
  quantile: ({ N, K, n }, q) => M.hyperQuantile(q, N, K, n),
  support: ({ N, K, n }) => ({ kMin: Math.max(0, n - (N - K)), kMax: Math.min(n, K) }),
  plotRange: ({ N, K, n }) => ({ kMin: Math.max(0, n - (N - K)), kMax: Math.min(n, K) }),
  moments: ({ N, K, n }) => ({
    mean: n * K / N,
    variance: N > 1 ? n * (K / N) * ((N - K) / N) * ((N - n) / (N - 1)) : 0,
    mode: Math.floor((n + 1) * (K + 1) / (N + 2)),
    median: '—',
    skewness: '—',
    kurtosis: '—',
  }),
  relations: ({ N, K, n }) => [
    <><b>Aproximação Binomial:</b> HG(N, K, n) ≈ Bin(n, K/N) = Bin(n; {fmtPrecise(K / N, 3)}) quando n/N ≤ 0,05.{' '}
      {n / N <= 0.05
        ? <Ok>Aplicável (n/N = {fmtPrecise(n / N, 3)})</Ok>
        : <No>Razão n/N = {fmtPrecise(n / N, 3)} alta — sem reposição importa</No>}</>,
    'Fator de correção populacional finita: Var(HG) = Var(Bin) · (N − n)/(N − 1).',
    'Modela amostragem sem reposição: cartas, controle de qualidade em lotes pequenos, captura-recaptura.',
  ],
};

const uniformedisc: DiscreteDistribution = {
  id: 'uniformedisc',
  type: 'discrete',
  name: 'Uniforme Discreta',
  notation: 'X ~ U{a, a+1, …, b}',
  description: 'Cada inteiro entre a e b (inclusive) tem a mesma probabilidade 1/(b − a + 1) de ocorrer.',
  params: [
    { id: 'a', label: 'a — limite inferior', def: 1, integer: true },
    { id: 'b', label: 'b — limite superior', def: 6, integer: true },
  ],
  validate: ({ a, b }) => a <= b ? null : 'a não pode ser maior que b.',
  pmf: ({ a, b }, k) => M.discUnifPMF(k, a, b),
  cdf: ({ a, b }, k) => M.discUnifCDF(k, a, b),
  quantile: ({ a, b }, q) => M.discUnifQuantile(q, a, b),
  support: ({ a, b }) => ({ kMin: a, kMax: b }),
  plotRange: ({ a, b }) => ({ kMin: a, kMax: b }),
  moments: ({ a, b }) => {
    const n = b - a + 1;
    return {
      mean: (a + b) / 2,
      variance: (n * n - 1) / 12,
      mode: 'todos os valores',
      median: (a + b) / 2,
      skewness: 0,
      kurtosis: -(6 * (n * n + 1)) / (5 * (n * n - 1)),
    };
  },
  relations: () => [
    'Exemplo clássico: lançamento de um dado justo (a = 1, b = 6).',
    'Análogo discreto da Uniforme Contínua U(a, b).',
    'Soma de Uniformes Discretas tende à Normal pelo TCL.',
  ],
};

/* ============================================================
   CONTÍNUAS
   ============================================================ */

const uniforme: ContinuousDistribution = {
  id: 'uniforme',
  type: 'continuous',
  name: 'Uniforme Contínua',
  notation: 'X ~ U(a, b)',
  description: 'Todos os valores em [a, b] são igualmente prováveis. Densidade constante igual a 1/(b−a) no suporte.',
  params: [
    { id: 'a', label: 'a — limite inferior', def: 0 },
    { id: 'b', label: 'b — limite superior', def: 1 },
  ],
  validate: ({ a, b }) => a < b ? null : 'a precisa ser menor que b.',
  pdf: ({ a, b }, x) => M.uniformPDF(x, a, b),
  cdf: ({ a, b }, x) => M.uniformCDF(x, a, b),
  quantile: ({ a, b }, p) => M.uniformQuantile(p, a, b),
  support: ({ a, b }) => ({ xMin: a, xMax: b }),
  plotRange: ({ a, b }) => {
    const pad = (b - a) * 0.15;
    return { xMin: a - pad, xMax: b + pad };
  },
  moments: ({ a, b }) => ({
    mean: (a + b) / 2,
    variance: (b - a) * (b - a) / 12,
    mode: 'qualquer valor em [a, b]',
    median: (a + b) / 2,
    skewness: 0,
    kurtosis: -6 / 5,
  }),
  relations: () => [
    'Toda variável aleatória pode ser gerada de U(0, 1) usando F⁻¹(U) (método da transformação inversa).',
    'Soma de uniformes independentes tende à Normal pelo TCL — a soma de 12 U(0, 1) tem média 6 e variância 1.',
    'Caso especial: U(0, 1) é a Beta(1, 1).',
  ],
};

const exponencial: ContinuousDistribution = {
  id: 'exponencial',
  type: 'continuous',
  name: 'Exponencial',
  notation: 'X ~ Exp(λ)',
  description: 'Tempo entre eventos consecutivos em um processo de Poisson com taxa λ. Caracterizada pela propriedade da falta de memória.',
  params: [{ id: 'lambda', label: 'λ — taxa', def: 1, min: 0.001 }],
  pdf: ({ lambda }, x) => M.expPDF(x, lambda),
  cdf: ({ lambda }, x) => M.expCDF(x, lambda),
  quantile: ({ lambda }, p) => M.expQuantile(p, lambda),
  support: () => ({ xMin: 0, xMax: Infinity }),
  plotRange: ({ lambda }) => ({ xMin: 0, xMax: M.expQuantile(0.995, lambda) }),
  moments: ({ lambda }) => ({
    mean: 1 / lambda,
    variance: 1 / (lambda * lambda),
    mode: 0,
    median: Math.log(2) / lambda,
    skewness: 2,
    kurtosis: 6,
  }),
  relations: ({ lambda }) => [
    <><b>Falta de memória:</b> P(X &gt; s + t | X &gt; s) = P(X &gt; t). Única contínua com essa propriedade.</>,
    <><b>Relação com Poisson:</b> se o número de eventos é Pois(λt), o tempo entre eventos é Exp(λ).</>,
    'Soma de n Exp(λ) i.i.d. é Gama(n, λ) (Erlang).',
    `Função de hazard constante: h(x) = λ = ${fmt(lambda)}. Útil para modelar tempo até falha em sistemas sem envelhecimento.`,
  ],
};

const gama: ContinuousDistribution = {
  id: 'gama',
  type: 'continuous',
  name: 'Gama',
  notation: 'X ~ Γ(α, β)',
  description: 'Distribuição da soma de α exponenciais quando α é inteiro (Erlang). Em geral, modela tempos de espera, durações e quantidades positivas com diferentes formatos.',
  params: [
    { id: 'alpha', label: 'α — forma (shape)', def: 2, min: 0.01 },
    { id: 'beta', label: 'β — taxa (rate)', def: 1, min: 0.01 },
  ],
  pdf: ({ alpha, beta }, x) => M.gammaPDF(x, alpha, beta),
  cdf: ({ alpha, beta }, x) => M.gammaCDF(x, alpha, beta),
  quantile: ({ alpha, beta }, p) => M.gammaQuantile(p, alpha, beta),
  support: () => ({ xMin: 0, xMax: Infinity }),
  plotRange: ({ alpha, beta }) => ({ xMin: 0, xMax: M.gammaQuantile(0.995, alpha, beta) * 1.05 }),
  moments: ({ alpha, beta }) => ({
    mean: alpha / beta,
    variance: alpha / (beta * beta),
    mode: alpha >= 1 ? (alpha - 1) / beta : 0,
    median: '—',
    skewness: 2 / Math.sqrt(alpha),
    kurtosis: 6 / alpha,
  }),
  relations: ({ alpha }) => [
    <><b>Casos especiais:</b> Γ(1, β) = Exp(β); Γ(ν/2, 1/2) = χ²(ν); Γ(k, β) com k inteiro = Erlang.</>,
    <><b>Soma:</b> X₁ ~ Γ(α₁, β) e X₂ ~ Γ(α₂, β) ⇒ X₁ + X₂ ~ Γ(α₁ + α₂, β).</>,
    <><b>Escala:</b> se X ~ Γ(α, β), então cX ~ Γ(α, β/c).</>,
    <><b>Aproximação Normal:</b> Γ(α, β) ≈ N(α/β, α/β²) para α grande. {alpha >= 30 ? <Ok>Aplicável</Ok> : <No>Use α ≥ 30</No>}</>,
  ],
};

const beta: ContinuousDistribution = {
  id: 'beta',
  type: 'continuous',
  name: 'Beta',
  notation: 'X ~ Beta(α, β)',
  description: 'Distribuição em [0, 1]. Extremamente flexível: pode ser U-shaped, em sino, monotônica ou uniforme. Muito usada em estatística bayesiana como prior de proporções.',
  params: [
    { id: 'alpha', label: 'α — forma', def: 2, min: 0.01 },
    { id: 'beta', label: 'β — forma', def: 5, min: 0.01 },
  ],
  pdf: ({ alpha, beta: b }, x) => M.betaPDF(x, alpha, b),
  cdf: ({ alpha, beta: b }, x) => M.betaCDF(x, alpha, b),
  quantile: ({ alpha, beta: b }, p) => M.betaQuantile(p, alpha, b),
  support: () => ({ xMin: 0, xMax: 1 }),
  plotRange: () => ({ xMin: 0, xMax: 1 }),
  moments: ({ alpha, beta: b }) => {
    const sum = alpha + b;
    return {
      mean: alpha / sum,
      variance: alpha * b / (sum * sum * (sum + 1)),
      mode: alpha > 1 && b > 1 ? (alpha - 1) / (sum - 2) : (alpha < 1 && b < 1 ? 'bimodal em 0 e 1' : (alpha <= 1 ? '0' : '1')),
      median: alpha > 1 && b > 1 ? (alpha - 1 / 3) / (sum - 2 / 3) : '—',
      skewness: 2 * (b - alpha) * Math.sqrt(sum + 1) / ((sum + 2) * Math.sqrt(alpha * b)),
      kurtosis: 6 * ((alpha - b) ** 2 * (sum + 1) - alpha * b * (sum + 2)) / (alpha * b * (sum + 2) * (sum + 3)),
    };
  },
  relations: () => [
    'Caso especial: Beta(1, 1) = U(0, 1).',
    <><b>Conjugada da Binomial:</b> se a priori é Beta(α, β) e observamos x sucessos em n ensaios, a posteriori é Beta(α + x, β + n − x). Base do aprendizado bayesiano.</>,
    'Relação com Gama: se U ~ Γ(α, 1) e V ~ Γ(β, 1) independentes, então U/(U+V) ~ Beta(α, β).',
    <><b>Estatística de ordem:</b> em uma amostra de n U(0, 1), a k-ésima estatística de ordem segue Beta(k, n−k+1).</>,
  ],
};

const lognormal: ContinuousDistribution = {
  id: 'lognormal',
  type: 'continuous',
  name: 'Lognormal',
  notation: 'X ~ LogN(μ, σ²)',
  description: 'log(X) tem distribuição Normal com parâmetros μ e σ. Usada para quantidades positivas resultantes de produtos/efeitos multiplicativos: rendas, ativos financeiros, tamanhos biológicos.',
  params: [
    { id: 'mu', label: 'μ — média de log(X)', def: 0 },
    { id: 'sigma', label: 'σ — desvio padrão de log(X)', def: 0.5, min: 0.01 },
  ],
  pdf: ({ mu, sigma }, x) => M.lognormalPDF(x, mu, sigma),
  cdf: ({ mu, sigma }, x) => M.lognormalCDF(x, mu, sigma),
  quantile: ({ mu, sigma }, p) => M.lognormalQuantile(p, mu, sigma),
  support: () => ({ xMin: 0, xMax: Infinity }),
  plotRange: ({ mu, sigma }) => ({ xMin: 0, xMax: M.lognormalQuantile(0.995, mu, sigma) * 1.05 }),
  moments: ({ mu, sigma }) => {
    const s2 = sigma * sigma;
    return {
      mean: Math.exp(mu + s2 / 2),
      variance: (Math.exp(s2) - 1) * Math.exp(2 * mu + s2),
      mode: Math.exp(mu - s2),
      median: Math.exp(mu),
      skewness: (Math.exp(s2) + 2) * Math.sqrt(Math.exp(s2) - 1),
      kurtosis: Math.exp(4 * s2) + 2 * Math.exp(3 * s2) + 3 * Math.exp(2 * s2) - 6,
    };
  },
  relations: () => [
    <><b>Definição:</b> se Y ~ N(μ, σ²), então X = exp(Y) ~ LogN(μ, σ²).</>,
    'Produto de lognormais independentes é lognormal: LogN(μ₁, σ₁²) · LogN(μ₂, σ₂²) = LogN(μ₁+μ₂, σ₁²+σ₂²).',
    'Pelo TCL multiplicativo, produtos de muitas variáveis positivas independentes tendem à lognormal.',
    'Em finanças: o modelo de Black-Scholes assume preços lognormais (retornos log-normalmente distribuídos).',
  ],
};

const weibull: ContinuousDistribution = {
  id: 'weibull',
  type: 'continuous',
  name: 'Weibull',
  notation: 'X ~ Weibull(k, λ)',
  description: 'Distribuição muito flexível para tempo até falha. O parâmetro k controla a forma do hazard: k<1 (falhas iniciais), k=1 (Exponencial, sem memória), k>1 (envelhecimento).',
  params: [
    { id: 'k', label: 'k — forma (shape)', def: 1.5, min: 0.01 },
    { id: 'lambda', label: 'λ — escala (scale)', def: 1, min: 0.01 },
  ],
  pdf: ({ k, lambda }, x) => M.weibullPDF(x, k, lambda),
  cdf: ({ k, lambda }, x) => M.weibullCDF(x, k, lambda),
  quantile: ({ k, lambda }, p) => M.weibullQuantile(p, k, lambda),
  support: () => ({ xMin: 0, xMax: Infinity }),
  plotRange: ({ k, lambda }) => ({ xMin: 0, xMax: M.weibullQuantile(0.995, k, lambda) * 1.05 }),
  moments: ({ k, lambda }) => {
    const g1 = M.gamma(1 + 1 / k);
    const g2 = M.gamma(1 + 2 / k);
    const g3 = M.gamma(1 + 3 / k);
    const g4 = M.gamma(1 + 4 / k);
    const mean = lambda * g1;
    const variance = lambda * lambda * (g2 - g1 * g1);
    const sigma = Math.sqrt(variance);
    return {
      mean,
      variance,
      mode: k > 1 ? lambda * Math.pow((k - 1) / k, 1 / k) : 0,
      median: lambda * Math.pow(Math.log(2), 1 / k),
      skewness: variance > 0 ? (g3 * lambda ** 3 - 3 * mean * variance - mean ** 3) / (sigma ** 3) : NaN,
      kurtosis: variance > 0 ? (lambda ** 4 * g4 - 4 * (lambda * g1) * (g3 * lambda ** 3) + 6 * (lambda * g1) ** 2 * (g2 * lambda ** 2) - 3 * (lambda * g1) ** 4) / (variance * variance) - 3 : NaN,
    };
  },
  relations: ({ k }) => [
    <><b>Casos especiais:</b> Weibull(1, λ) = Exp(1/λ); Weibull(2, λ) é a distribuição de Rayleigh com σ = λ/√2.</>,
    <><b>Hazard:</b> h(x) = (k/λ)·(x/λ)^(k−1). k = {fmtPrecise(k, 2)} ⇒{' '}
      {k < 1
        ? <><span className="font-semibold text-red-700">decrescente</span> (mortalidade infantil, falhas iniciais)</>
        : k > 1
          ? <><span className="font-semibold text-red-700">crescente</span> (envelhecimento, fadiga)</>
          : <><span className="font-semibold text-green-700">constante</span> (sem memória)</>}.</>,
    'Usada em análise de confiabilidade, distribuição de velocidade do vento, tamanho de partículas.',
    'Transformação: se X ~ Weibull(k, λ), então (X/λ)^k ~ Exp(1).',
  ],
};

const t: ContinuousDistribution = {
  id: 't',
  type: 'continuous',
  name: 't de Student',
  notation: 'T ~ t(ν)',
  description: 'Distribuição simétrica em torno de 0, mas com caudas mais pesadas que a Normal. Aparece em inferência sobre a média de uma população normal quando σ é desconhecido.',
  params: [{ id: 'df', label: 'ν — graus de liberdade', def: 10, min: 1, integer: true }],
  pdf: ({ df }, x) => M.tPDF(x, df),
  cdf: ({ df }, x) => M.tCDF(x, df),
  quantile: ({ df }, p) => M.tQuantile(p, df),
  support: () => ({ xMin: -Infinity, xMax: Infinity }),
  plotRange: ({ df }) => {
    const r = M.tQuantile(0.995, df);
    return { xMin: -r * 1.1, xMax: r * 1.1 };
  },
  moments: ({ df }) => ({
    mean: df > 1 ? 0 : 'indefinida',
    variance: df > 2 ? df / (df - 2) : (df > 1 ? '∞' : 'indefinida'),
    mode: 0,
    median: 0,
    skewness: df > 3 ? 0 : 'indefinida',
    kurtosis: df > 4 ? 6 / (df - 4) : (df > 2 ? '∞' : 'indefinida'),
  }),
  relations: ({ df }) => [
    <><b>Aproximação Normal:</b> t(ν) → N(0, 1) quando ν → ∞.{' '}
      {df >= 30
        ? <Ok>Para ν = {df}, praticamente indistinguível da Normal</Ok>
        : <Warn>Caudas notavelmente mais pesadas que a Normal para ν = {df}</Warn>}</>,
    <><b>Construção:</b> se Z ~ N(0, 1) e Y ~ χ²(ν) independentes, então T = Z/√(Y/ν) ~ t(ν).</>,
    <><b>Aplicações:</b> teste t para média (σ desconhecido), intervalo de confiança para média, comparação de duas amostras.</>,
    <><b>Caso especial:</b> t(1) = Cauchy padrão (sem média!). t(∞) = N(0, 1).</>,
  ],
};

const chi2: ContinuousDistribution = {
  id: 'chi2',
  type: 'continuous',
  name: 'Qui-quadrado',
  notation: 'X ~ χ²(ν)',
  description: 'Soma dos quadrados de ν Normais padrão independentes. Base dos testes de aderência, independência e estatísticas sobre variância.',
  params: [{ id: 'df', label: 'ν — graus de liberdade', def: 5, min: 1, integer: true }],
  pdf: ({ df }, x) => M.chi2PDF(x, df),
  cdf: ({ df }, x) => M.chi2CDF(x, df),
  quantile: ({ df }, p) => M.chi2Quantile(p, df),
  support: () => ({ xMin: 0, xMax: Infinity }),
  plotRange: ({ df }) => ({ xMin: 0, xMax: M.chi2Quantile(0.995, df) * 1.05 }),
  moments: ({ df }) => ({
    mean: df,
    variance: 2 * df,
    mode: Math.max(df - 2, 0),
    median: df * Math.pow(1 - 2 / (9 * df), 3),
    skewness: Math.sqrt(8 / df),
    kurtosis: 12 / df,
  }),
  relations: ({ df }) => [
    <><b>Caso especial da Gama:</b> χ²(ν) = Γ(ν/2, 1/2).</>,
    <><b>Construção:</b> se Z₁, …, Zᵥ ~ N(0, 1) i.i.d., então ΣZᵢ² ~ χ²(ν).</>,
    <><b>Aditividade:</b> χ²(ν₁) + χ²(ν₂) = χ²(ν₁ + ν₂) (independentes).</>,
    <><b>Aproximação Normal:</b> χ²(ν) ≈ N(ν, 2ν) para ν grande. {df >= 30 ? <Ok>Aplicável</Ok> : <Warn>Use ν ≥ 30 ou Wilson-Hilferty</Warn>}</>,
    <><b>Inferência:</b> (n−1)S²/σ² ~ χ²(n−1) para amostras de população normal.</>,
  ],
};

const f: ContinuousDistribution = {
  id: 'f',
  type: 'continuous',
  name: 'F de Snedecor',
  notation: 'F ~ F(ν₁, ν₂)',
  description: 'Razão entre duas qui-quadrados divididas pelos respectivos graus de liberdade. Estatística-chave para comparar variâncias e em ANOVA.',
  params: [
    { id: 'df1', label: 'ν₁ — graus de liberdade do numerador', def: 5, min: 1, integer: true },
    { id: 'df2', label: 'ν₂ — graus de liberdade do denominador', def: 10, min: 1, integer: true },
  ],
  pdf: ({ df1, df2 }, x) => M.fPDF(x, df1, df2),
  cdf: ({ df1, df2 }, x) => M.fCDF(x, df1, df2),
  quantile: ({ df1, df2 }, p) => M.fQuantile(p, df1, df2),
  support: () => ({ xMin: 0, xMax: Infinity }),
  plotRange: ({ df1, df2 }) => ({ xMin: 0, xMax: Math.max(3, M.fQuantile(0.995, df1, df2) * 1.05) }),
  moments: ({ df1, df2 }) => ({
    mean: df2 > 2 ? df2 / (df2 - 2) : 'indefinida',
    variance: df2 > 4 ? 2 * df2 * df2 * (df1 + df2 - 2) / (df1 * (df2 - 2) * (df2 - 2) * (df2 - 4)) : (df2 > 2 ? '∞' : 'indefinida'),
    mode: df1 > 2 ? ((df1 - 2) / df1) * (df2 / (df2 + 2)) : 0,
    median: '—',
    skewness: df2 > 6 ? ((2 * df1 + df2 - 2) * Math.sqrt(8 * (df2 - 4))) / ((df2 - 6) * Math.sqrt(df1 * (df1 + df2 - 2))) : 'indefinida',
    kurtosis: '—',
  }),
  relations: () => [
    <><b>Construção:</b> se U ~ χ²(ν₁) e V ~ χ²(ν₂) independentes, então F = (U/ν₁)/(V/ν₂) ~ F(ν₁, ν₂).</>,
    <><b>Reciprocidade:</b> se F ~ F(ν₁, ν₂), então 1/F ~ F(ν₂, ν₁). Logo F<sub>α</sub>(ν₁, ν₂) = 1/F<sub>1−α</sub>(ν₂, ν₁).</>,
    <><b>Relação com t:</b> se T ~ t(ν), então T² ~ F(1, ν).</>,
    <><b>ANOVA:</b> razão entre quadrados médios entre grupos / dentro de grupos.</>,
    'Quando ν₂ → ∞: ν₁ · F(ν₁, ν₂) → χ²(ν₁).',
  ],
};

export const DISTRIBUTIONS: Record<string, Distribution> = {
  bernoulli, binomial, poisson, geometrica, binomialneg, hipergeometrica, uniformedisc,
  uniforme, exponencial, gama, beta, lognormal, weibull, t, chi2, f,
};

/* ============================================================
   HUB CARDS
   ============================================================ */

export interface CalculatorCard {
  id: string;
  kind: 'discrete' | 'continuous';
  name: string;
  notation: string;
  summary: string;
  // Course lessons that teach this distribution.
  lessonNumbers?: number[];
  tag?: string;
  preview: React.ReactNode;
}

const curve = (d: string) => <path d={d} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />;
const sticks = (points: [number, number][]) => (
  <g stroke="currentColor" strokeWidth={2} fill="currentColor">
    {points.map(([x, y]) => (
      <React.Fragment key={x}>
        <line x1={x} y1={46} x2={x} y2={y} />
        <circle cx={x} cy={y} r={2.5} />
      </React.Fragment>
    ))}
  </g>
);

export const NORMAL_ID = 'normal';

export const CALCULATORS: CalculatorCard[] = [
  { id: 'bernoulli', kind: 'discrete', name: 'Bernoulli', notation: 'X ~ Bern(p)', summary: 'Um único ensaio com dois resultados (0 = fracasso, 1 = sucesso).', preview: sticks([[30, 22], [70, 14]]) },
  { id: 'binomial', kind: 'discrete', name: 'Binomial', notation: 'X ~ Bin(n, p)', summary: 'Número de sucessos em n ensaios de Bernoulli independentes.', lessonNumbers: [16], preview: sticks([[14, 42], [28, 32], [42, 14], [56, 10], [70, 22], [84, 40]]) },
  { id: 'poisson', kind: 'discrete', name: 'Poisson', notation: 'X ~ Pois(λ)', summary: 'Número de eventos raros num intervalo fixo de tempo ou espaço.', lessonNumbers: [18], preview: sticks([[12, 26], [24, 10], [36, 14], [48, 22], [60, 32], [72, 40], [84, 44]]) },
  { id: 'geometrica', kind: 'discrete', name: 'Geométrica', notation: 'X ~ Geom(p)', summary: 'Número de tentativas até o primeiro sucesso. Também sem memória.', preview: sticks([[14, 8], [28, 20], [42, 28], [56, 34], [70, 40], [84, 43]]) },
  { id: 'binomialneg', kind: 'discrete', name: 'Binomial Negativa', notation: 'X ~ NB(r, p)', summary: 'Tentativas até obter r sucessos. Generaliza a Geométrica.', preview: sticks([[12, 36], [24, 22], [36, 10], [48, 12], [60, 20], [72, 30], [84, 40]]) },
  { id: 'hipergeometrica', kind: 'discrete', name: 'Hipergeométrica', notation: 'X ~ HG(N, K, n)', summary: 'Amostragem sem reposição. Sucessos em n retiradas de uma população finita.', lessonNumbers: [17], preview: sticks([[14, 40], [28, 28], [42, 12], [56, 14], [70, 30], [84, 42]]) },
  { id: 'uniformedisc', kind: 'discrete', name: 'Uniforme Discreta', notation: 'X ~ U{a, …, b}', summary: 'Cada inteiro entre a e b tem a mesma probabilidade 1/(b−a+1).', preview: sticks([[18, 14], [34, 14], [50, 14], [66, 14], [82, 14]]) },
  { id: NORMAL_ID, kind: 'continuous', name: 'Normal', notation: 'X ~ N(μ, σ²)', summary: 'A mais célebre. Teorema Central do Limite, intervalos de confiança, testes z.', lessonNumbers: [19, 20], tag: '8 abas', preview: curve('M2,46 C20,46 28,8 50,8 C72,8 80,46 98,46') },
  { id: 'uniforme', kind: 'continuous', name: 'Uniforme Contínua', notation: 'X ~ U(a, b)', summary: 'Todos os valores no intervalo [a, b] são igualmente prováveis.', preview: curve('M2,46 L20,46 L20,12 L80,12 L80,46 L98,46') },
  { id: 'exponencial', kind: 'continuous', name: 'Exponencial', notation: 'X ~ Exp(λ)', summary: 'Tempo entre eventos de Poisson. Propriedade da falta de memória.', preview: curve('M2,6 C12,18 22,32 40,40 C60,46 80,46 98,46') },
  { id: 'gama', kind: 'continuous', name: 'Gama', notation: 'X ~ Γ(α, β)', summary: 'Soma de α exponenciais. Tempos de espera, modelagem de filas.', preview: curve('M2,46 C12,30 20,12 35,8 C55,4 70,30 98,46') },
  { id: 'beta', kind: 'continuous', name: 'Beta', notation: 'X ~ Beta(α, β)', summary: 'Suporte em [0, 1]. Distribuição de probabilidades; uso em Bayes.', preview: curve('M2,46 C10,40 20,10 50,8 C80,10 90,40 98,46') },
  { id: 'lognormal', kind: 'continuous', name: 'Lognormal', notation: 'X ~ LogN(μ, σ²)', summary: 'log(X) é Normal. Modelos multiplicativos: finanças, biologia, rendas.', preview: curve('M2,46 C12,40 18,14 26,10 C40,8 58,38 98,46') },
  { id: 'weibull', kind: 'continuous', name: 'Weibull', notation: 'X ~ Weibull(k, λ)', summary: 'Análise de confiabilidade e tempo até falha em engenharia.', preview: curve('M2,46 C14,40 24,16 36,10 C50,10 68,36 98,46') },
  { id: 't', kind: 'continuous', name: 't de Student', notation: 'T ~ t(ν)', summary: 'Inferência sobre média quando σ é desconhecido. Caudas mais pesadas.', preview: curve('M2,44 C20,42 30,8 50,8 C70,8 80,42 98,44') },
  { id: 'chi2', kind: 'continuous', name: 'Qui-quadrado', notation: 'X ~ χ²(ν)', summary: 'Soma de Z² independentes. Testes de aderência e independência.', preview: curve('M2,46 C10,28 18,12 30,10 C50,12 70,38 98,46') },
  { id: 'f', kind: 'continuous', name: 'F de Snedecor', notation: 'F ~ F(ν₁, ν₂)', summary: 'Razão de variâncias. Estatística-chave da ANOVA.', preview: curve('M2,46 C10,30 16,10 22,8 C40,12 64,40 98,46') },
];
