// Probability functions for the calculators, ported from the course's standalone calculators.
// Marsaglia (Φ), Acklam + Newton (Φ⁻¹), Lanczos (log Γ), continued fractions (incomplete γ and β).

export const SQRT_2PI = Math.sqrt(2 * Math.PI);
const LN_SQRT_2PI = 0.91893853320467274178;

/* ---------- special functions ---------- */

// Lanczos approximation, |error| < 1e-15
export const logGamma = (x: number): number => {
  const g = 7;
  const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
  x -= 1;
  let a = c[0];
  const t = x + g + 0.5;
  for (let i = 1; i < g + 2; i++) a += c[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
};

export const gamma = (x: number) => Math.exp(logGamma(x));

export const logChoose = (n: number, k: number): number => {
  if (k < 0 || k > n) return -Infinity;
  if (k === 0 || k === n) return 0;
  return logGamma(n + 1) - logGamma(k + 1) - logGamma(n - k + 1);
};

export const logBeta = (a: number, b: number) => logGamma(a) + logGamma(b) - logGamma(a + b);

// Regularized incomplete beta I_x(a, b) (Numerical Recipes)
const betaCF = (x: number, a: number, b: number): number => {
  const MAXIT = 250, EPS = 3e-15;
  const qab = a + b, qap = a + 1, qam = a - 1;
  let c = 1, d = 1 - qab * x / qap;
  if (Math.abs(d) < 1e-30) d = 1e-30;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d; h *= d * c;
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const del = d * c; h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
};

export const regBetaI = (x: number, a: number, b: number): number => {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  if (x < (a + 1) / (a + b + 2)) return bt * betaCF(x, a, b) / a;
  return 1 - bt * betaCF(1 - x, b, a) / b;
};

// Regularized lower incomplete gamma P(a, x) = γ(a, x) / Γ(a)
const gser = (a: number, x: number): number => {
  if (x <= 0) return 0;
  const gln = logGamma(a);
  let ap = a, sum = 1 / a, del = sum;
  for (let n = 1; n < 500; n++) {
    ap += 1;
    del *= x / ap;
    sum += del;
    if (Math.abs(del) < Math.abs(sum) * 3e-16) break;
  }
  return sum * Math.exp(-x + a * Math.log(x) - gln);
};

const gcf = (a: number, x: number): number => {
  const gln = logGamma(a);
  const FPMIN = 1e-300;
  let b = x + 1 - a, c = 1 / FPMIN, d = 1 / b, h = d;
  for (let i = 1; i <= 500; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = b + an / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c; h *= del;
    if (Math.abs(del - 1) < 3e-16) break;
  }
  return h * Math.exp(-x + a * Math.log(x) - gln);
};

export const gammaP = (a: number, x: number): number => {
  if (x < 0 || a <= 0) return NaN;
  if (x === 0) return 0;
  if (x < a + 1) return gser(a, x);
  return 1 - gcf(a, x);
};
export const gammaQ = (a: number, x: number) => 1 - gammaP(a, x);

/* ---------- Normal ---------- */

export const phi = (z: number) => Math.exp(-0.5 * z * z) / SQRT_2PI;

export const Phi = (z: number): number => {
  if (z < -38) return 0;
  if (z > 38) return 1;
  // Marsaglia 2004
  let s = z, t = 0, b = z, i = 3;
  const q = z * z;
  while (s !== t && i < 5000) {
    t = s;
    b *= q / i;
    s += b;
    i += 2;
  }
  return 0.5 + s * Math.exp(-0.5 * q - LN_SQRT_2PI);
};

export const normalPDF = (x: number, mu: number, sigma: number) => phi((x - mu) / sigma) / sigma;
export const normalCDF = (x: number, mu: number, sigma: number) => Phi((x - mu) / sigma);

export const normalQuantile = (p: number, mu = 0, sigma = 1): number => {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.383577518672690e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
    -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
  const pLow = 0.02425, pHigh = 1 - pLow;
  let q: number, z: number;
  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    z = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (p <= pHigh) {
    q = p - 0.5;
    const r = q * q;
    z = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    z = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  // Newton refinement
  for (let i = 0; i < 4; i++) {
    const e = Phi(z) - p;
    const u = e * SQRT_2PI * Math.exp(0.5 * z * z);
    z = z - u / (1 + 0.5 * z * u);
  }
  return mu + sigma * z;
};

/* ---------- t de Student ---------- */

export const tPDF = (t: number, df: number) => Math.exp(logGamma((df + 1) / 2) - logGamma(df / 2))
  / Math.sqrt(df * Math.PI) * Math.pow(1 + t * t / df, -(df + 1) / 2);

export const tCDF = (t: number, df: number): number => {
  if (df <= 0) return NaN;
  const x = df / (df + t * t);
  const p = 0.5 * regBetaI(x, df / 2, 0.5);
  return t > 0 ? 1 - p : p;
};

export const tQuantile = (p: number, df: number): number => {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  let t = normalQuantile(p);
  if (df > 2) t *= Math.sqrt(df / (df - 2));
  for (let i = 0; i < 80; i++) {
    const pdf = tPDF(t, df);
    if (pdf < 1e-300) break;
    const step = (tCDF(t, df) - p) / pdf;
    t -= step;
    if (Math.abs(step) < 1e-12) break;
  }
  return t;
};

/* ---------- Gama (shape α, rate β) and Qui-quadrado ---------- */

export const gammaPDF = (x: number, shape: number, rate: number): number => {
  if (x <= 0) return 0;
  return Math.exp(shape * Math.log(rate) + (shape - 1) * Math.log(x) - rate * x - logGamma(shape));
};
export const gammaCDF = (x: number, shape: number, rate: number) => x <= 0 ? 0 : gammaP(shape, rate * x);
export const gammaQuantile = (p: number, shape: number, rate: number): number => {
  if (p <= 0) return 0;
  if (p >= 1) return Infinity;
  // Wilson-Hilferty initial guess, then Newton
  const z = normalQuantile(p);
  let x = shape * Math.pow(1 - 1 / (9 * shape) + z / (3 * Math.sqrt(shape)), 3);
  x = x <= 0 ? shape / rate : x / rate;
  for (let i = 0; i < 60; i++) {
    const pdf = gammaPDF(x, shape, rate);
    if (pdf < 1e-300) break;
    let step = (gammaCDF(x, shape, rate) - p) / pdf;
    if (step > x * 0.5) step = x * 0.5;
    if (step < -x * 0.5) step = -x * 0.5;
    x -= step;
    if (x <= 0) x = 1e-15;
    if (Math.abs(step) < Math.abs(x) * 1e-13) break;
  }
  return x;
};

export const chi2PDF = (x: number, df: number) => gammaPDF(x, df / 2, 0.5);
export const chi2CDF = (x: number, df: number) => gammaCDF(x, df / 2, 0.5);
export const chi2Quantile = (p: number, df: number) => gammaQuantile(p, df / 2, 0.5);

/* ---------- F de Snedecor ---------- */

export const fPDF = (x: number, df1: number, df2: number): number => {
  if (x <= 0) return 0;
  const a = df1 / 2, b = df2 / 2;
  return Math.exp(a * Math.log(df1) + b * Math.log(df2) + (a - 1) * Math.log(x)
    - (a + b) * Math.log(df1 * x + df2) - logBeta(a, b));
};
export const fCDF = (x: number, df1: number, df2: number) =>
  x <= 0 ? 0 : regBetaI(df1 * x / (df1 * x + df2), df1 / 2, df2 / 2);
export const fQuantile = (p: number, df1: number, df2: number): number => {
  if (p <= 0) return 0;
  if (p >= 1) return Infinity;
  let x = df1 > 4 && df2 > 4 ? 1 : 0.5;
  for (let i = 0; i < 80; i++) {
    const pdf = fPDF(x, df1, df2);
    if (pdf < 1e-300) break;
    let step = (fCDF(x, df1, df2) - p) / pdf;
    if (step > x * 0.5) step = x * 0.5;
    if (step < -x * 0.5) step = -x * 0.5;
    x -= step;
    if (x <= 0) x = 1e-10;
    if (Math.abs(step) < Math.abs(x) * 1e-12) break;
  }
  return x;
};

/* ---------- Beta ---------- */

export const betaPDF = (x: number, a: number, b: number) =>
  x <= 0 || x >= 1 ? 0 : Math.exp((a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x) - logBeta(a, b));
export const betaCDF = (x: number, a: number, b: number) => regBetaI(x, a, b);
export const betaQuantile = (p: number, a: number, b: number): number => {
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  let x = a > 1 && b > 1 ? (a - 1) / (a + b - 2) : 0.5;
  for (let i = 0; i < 80; i++) {
    const pdf = betaPDF(x, a, b);
    if (pdf < 1e-300) break;
    let next = x - (betaCDF(x, a, b) - p) / pdf;
    if (next <= 0) next = x / 2;
    if (next >= 1) next = (x + 1) / 2;
    if (Math.abs(next - x) < 1e-13) { x = next; break; }
    x = next;
  }
  return x;
};

/* ---------- Uniforme, Exponencial, Weibull, Lognormal ---------- */

export const uniformPDF = (x: number, a: number, b: number) => (x < a || x > b) ? 0 : 1 / (b - a);
export const uniformCDF = (x: number, a: number, b: number) => x <= a ? 0 : (x >= b ? 1 : (x - a) / (b - a));
export const uniformQuantile = (p: number, a: number, b: number) => a + p * (b - a);

export const expPDF = (x: number, lambda: number) => x < 0 ? 0 : lambda * Math.exp(-lambda * x);
export const expCDF = (x: number, lambda: number) => x < 0 ? 0 : 1 - Math.exp(-lambda * x);
export const expQuantile = (p: number, lambda: number) => -Math.log(1 - p) / lambda;

export const weibullPDF = (x: number, k: number, lambda: number): number => {
  if (x < 0) return 0;
  if (x === 0) return k === 1 ? 1 / lambda : 0;
  return (k / lambda) * Math.pow(x / lambda, k - 1) * Math.exp(-Math.pow(x / lambda, k));
};
export const weibullCDF = (x: number, k: number, lambda: number) => x < 0 ? 0 : 1 - Math.exp(-Math.pow(x / lambda, k));
export const weibullQuantile = (p: number, k: number, lambda: number) => lambda * Math.pow(-Math.log(1 - p), 1 / k);

export const lognormalPDF = (x: number, mu: number, sigma: number) =>
  x <= 0 ? 0 : phi((Math.log(x) - mu) / sigma) / (x * sigma);
export const lognormalCDF = (x: number, mu: number, sigma: number) => x <= 0 ? 0 : Phi((Math.log(x) - mu) / sigma);
export const lognormalQuantile = (p: number, mu: number, sigma: number) => Math.exp(mu + sigma * normalQuantile(p));

/* ---------- discrete ---------- */

// Smallest k with CDF(k) >= p
export const discreteQuantile = (p: number, cdf: (k: number) => number, kMin: number, kMaxCap: number): number => {
  if (p <= 0) return kMin;
  if (p >= 1) return kMaxCap;
  let lo = kMin, hi = kMin + 1;
  while (hi < kMaxCap && cdf(hi) < p) hi = Math.min(kMaxCap, hi * 2 + 1);
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (cdf(mid) < p) lo = mid + 1;
    else hi = mid;
  }
  return lo;
};

export const bernoulliPMF = (k: number, p: number) => k === 0 ? 1 - p : (k === 1 ? p : 0);
export const bernoulliCDF = (k: number, p: number) => k < 0 ? 0 : (k < 1 ? 1 - p : 1);
export const bernoulliQuantile = (q: number, p: number) => q <= 1 - p ? 0 : 1;

export const binomialPMF = (k: number, n: number, p: number): number => {
  if (k < 0 || k > n || !Number.isInteger(k)) return 0;
  if (p === 0) return k === 0 ? 1 : 0;
  if (p === 1) return k === n ? 1 : 0;
  return Math.exp(logChoose(n, k) + k * Math.log(p) + (n - k) * Math.log(1 - p));
};
// P(X ≤ k) = I_{1−p}(n − k, k + 1)
export const binomialCDF = (k: number, n: number, p: number): number => {
  if (k < 0) return 0;
  if (k >= n) return 1;
  k = Math.floor(k);
  if (p === 0) return 1;
  if (p === 1) return 0;
  return regBetaI(1 - p, n - k, k + 1);
};
export const binomialQuantile = (q: number, n: number, p: number) =>
  discreteQuantile(q, k => binomialCDF(k, n, p), 0, n);

export const poissonPMF = (k: number, lambda: number): number => {
  if (k < 0 || !Number.isInteger(k)) return 0;
  return Math.exp(-lambda + k * Math.log(lambda) - logGamma(k + 1));
};
// P(X ≤ k) = Q(k + 1, λ)
export const poissonCDF = (k: number, lambda: number) => k < 0 ? 0 : gammaQ(Math.floor(k) + 1, lambda);
export const poissonQuantile = (q: number, lambda: number) => {
  const cap = Math.max(100, Math.ceil(lambda + 10 * Math.sqrt(lambda) + 30));
  return discreteQuantile(q, k => poissonCDF(k, lambda), 0, cap * 10);
};

// Geometric: number of trials until the first success, X ∈ {1, 2, 3, …}
export const geomPMF = (k: number, p: number) => (k < 1 || !Number.isInteger(k)) ? 0 : Math.pow(1 - p, k - 1) * p;
export const geomCDF = (k: number, p: number) => k < 1 ? 0 : 1 - Math.pow(1 - p, Math.floor(k));
export const geomQuantile = (q: number, p: number): number => {
  if (q <= 0) return 1;
  if (q >= 1) return Infinity;
  return Math.ceil(Math.log(1 - q) / Math.log(1 - p));
};

// Negative binomial: number of trials until r successes, X ∈ {r, r + 1, …}
export const negbinPMF = (k: number, r: number, p: number): number => {
  if (k < r || !Number.isInteger(k)) return 0;
  return Math.exp(logChoose(k - 1, r - 1) + r * Math.log(p) + (k - r) * Math.log(1 - p));
};
// P(X ≤ k) = I_p(r, k − r + 1)
export const negbinCDF = (k: number, r: number, p: number) => k < r ? 0 : regBetaI(p, r, Math.floor(k) - r + 1);
export const negbinQuantile = (q: number, r: number, p: number) => {
  const cap = Math.max(200, Math.ceil(r / p + 10 * Math.sqrt(r * (1 - p)) / p + 50));
  return discreteQuantile(q, k => negbinCDF(k, r, p), r, cap * 10);
};

// Hypergeometric HG(N, K, n): population N with K successes, sample of n without replacement
export const hyperPMF = (k: number, N: number, K: number, n: number): number => {
  if (k < Math.max(0, n - (N - K)) || k > Math.min(n, K) || !Number.isInteger(k)) return 0;
  return Math.exp(logChoose(K, k) + logChoose(N - K, n - k) - logChoose(N, n));
};
export const hyperCDF = (k: number, N: number, K: number, n: number): number => {
  const kMin = Math.max(0, n - (N - K));
  const kMax = Math.min(n, K);
  if (k < kMin) return 0;
  if (k >= kMax) return 1;
  let s = 0;
  for (let i = kMin; i <= Math.floor(k); i++) s += hyperPMF(i, N, K, n);
  return s;
};
export const hyperQuantile = (q: number, N: number, K: number, n: number) =>
  discreteQuantile(q, k => hyperCDF(k, N, K, n), Math.max(0, n - (N - K)), Math.min(n, K));

export const discUnifPMF = (k: number, a: number, b: number) => (k < a || k > b || !Number.isInteger(k)) ? 0 : 1 / (b - a + 1);
export const discUnifCDF = (k: number, a: number, b: number) => k < a ? 0 : (k >= b ? 1 : (Math.floor(k) - a + 1) / (b - a + 1));
export const discUnifQuantile = (q: number, a: number, b: number): number => {
  if (q <= 0) return a;
  if (q >= 1) return b;
  return a + Math.ceil(q * (b - a + 1)) - 1;
};
