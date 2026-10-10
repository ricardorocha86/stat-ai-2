import React from 'react';
import * as M from '../services/probability/mathLib';

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
  }),
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
  }),
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
  }),
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
  }),
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
  }),
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
  }),
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
    };
  },
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
  }),
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
  }),
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
  }),
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
    };
  },
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
    };
  },
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
    return { mean: lambda * g1, variance: lambda * lambda * (M.gamma(1 + 2 / k) - g1 * g1) };
  },
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
  }),
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
  }),
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
  }),
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

// Most used in introductory statistics first: the ones the course teaches, then the inference ones.
export const CALCULATORS: CalculatorCard[] = [
  { id: NORMAL_ID, kind: 'continuous', name: 'Normal', notation: 'X ~ N(μ, σ²)', summary: 'A mais célebre. Teorema Central do Limite, intervalos de confiança, testes z.', lessonNumbers: [19, 20], tag: '8 abas', preview: curve('M2,46 C20,46 28,8 50,8 C72,8 80,46 98,46') },
  { id: 'binomial', kind: 'discrete', name: 'Binomial', notation: 'X ~ Bin(n, p)', summary: 'Número de sucessos em n ensaios de Bernoulli independentes.', lessonNumbers: [16], preview: sticks([[14, 42], [28, 32], [42, 14], [56, 10], [70, 22], [84, 40]]) },
  { id: 'poisson', kind: 'discrete', name: 'Poisson', notation: 'X ~ Pois(λ)', summary: 'Número de eventos raros num intervalo fixo de tempo ou espaço.', lessonNumbers: [18], preview: sticks([[12, 26], [24, 10], [36, 14], [48, 22], [60, 32], [72, 40], [84, 44]]) },
  { id: 't', kind: 'continuous', name: 't de Student', notation: 'T ~ t(ν)', summary: 'Inferência sobre média quando σ é desconhecido. Caudas mais pesadas.', preview: curve('M2,44 C20,42 30,8 50,8 C70,8 80,42 98,44') },
  { id: 'chi2', kind: 'continuous', name: 'Qui-quadrado', notation: 'X ~ χ²(ν)', summary: 'Soma de Z² independentes. Testes de aderência e independência.', preview: curve('M2,46 C10,28 18,12 30,10 C50,12 70,38 98,46') },
  { id: 'exponencial', kind: 'continuous', name: 'Exponencial', notation: 'X ~ Exp(λ)', summary: 'Tempo entre eventos de Poisson. Propriedade da falta de memória.', preview: curve('M2,6 C12,18 22,32 40,40 C60,46 80,46 98,46') },
  { id: 'uniforme', kind: 'continuous', name: 'Uniforme Contínua', notation: 'X ~ U(a, b)', summary: 'Todos os valores no intervalo [a, b] são igualmente prováveis.', preview: curve('M2,46 L20,46 L20,12 L80,12 L80,46 L98,46') },
  { id: 'hipergeometrica', kind: 'discrete', name: 'Hipergeométrica', notation: 'X ~ HG(N, K, n)', summary: 'Amostragem sem reposição. Sucessos em n retiradas de uma população finita.', lessonNumbers: [17], preview: sticks([[14, 40], [28, 28], [42, 12], [56, 14], [70, 30], [84, 42]]) },
  { id: 'bernoulli', kind: 'discrete', name: 'Bernoulli', notation: 'X ~ Bern(p)', summary: 'Um único ensaio com dois resultados (0 = fracasso, 1 = sucesso).', preview: sticks([[30, 22], [70, 14]]) },
  { id: 'f', kind: 'continuous', name: 'F de Snedecor', notation: 'F ~ F(ν₁, ν₂)', summary: 'Razão de variâncias. Estatística-chave da ANOVA.', preview: curve('M2,46 C10,30 16,10 22,8 C40,12 64,40 98,46') },
  { id: 'geometrica', kind: 'discrete', name: 'Geométrica', notation: 'X ~ Geom(p)', summary: 'Número de tentativas até o primeiro sucesso. Também sem memória.', preview: sticks([[14, 8], [28, 20], [42, 28], [56, 34], [70, 40], [84, 43]]) },
  { id: 'uniformedisc', kind: 'discrete', name: 'Uniforme Discreta', notation: 'X ~ U{a, …, b}', summary: 'Cada inteiro entre a e b tem a mesma probabilidade 1/(b−a+1).', preview: sticks([[18, 14], [34, 14], [50, 14], [66, 14], [82, 14]]) },
  { id: 'lognormal', kind: 'continuous', name: 'Lognormal', notation: 'X ~ LogN(μ, σ²)', summary: 'log(X) é Normal. Modelos multiplicativos: finanças, biologia, rendas.', preview: curve('M2,46 C12,40 18,14 26,10 C40,8 58,38 98,46') },
  { id: 'gama', kind: 'continuous', name: 'Gama', notation: 'X ~ Γ(α, β)', summary: 'Soma de α exponenciais. Tempos de espera, modelagem de filas.', preview: curve('M2,46 C12,30 20,12 35,8 C55,4 70,30 98,46') },
  { id: 'binomialneg', kind: 'discrete', name: 'Binomial Negativa', notation: 'X ~ NB(r, p)', summary: 'Tentativas até obter r sucessos. Generaliza a Geométrica.', preview: sticks([[12, 36], [24, 22], [36, 10], [48, 12], [60, 20], [72, 30], [84, 40]]) },
  { id: 'beta', kind: 'continuous', name: 'Beta', notation: 'X ~ Beta(α, β)', summary: 'Suporte em [0, 1]. Distribuição de probabilidades; uso em Bayes.', preview: curve('M2,46 C10,40 20,10 50,8 C80,10 90,40 98,46') },
  { id: 'weibull', kind: 'continuous', name: 'Weibull', notation: 'X ~ Weibull(k, λ)', summary: 'Análise de confiabilidade e tempo até falha em engenharia.', preview: curve('M2,46 C14,40 24,16 36,10 C50,10 68,36 98,46') },
];
