// Number formatting for the calculators, in the Brazilian convention (decimal comma).
// Lists of numbers are separated by ";" so the decimal comma stays unambiguous.

const SUPERSCRIPT: Record<string, string> = {
  '-': '⁻', '+': '', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
};

const comma = (text: string) => text.replace('.', ',');

const notFinite = (n: number) => n === Infinity ? '∞' : (n === -Infinity ? '−∞' : 'indef.');

// 1,234 × 10⁻⁵
export const fmtSci = (n: number, digits = 6): string => {
  if (!Number.isFinite(n)) return notFinite(n);
  if (n === 0) return '0';
  const [mantissa, exponent] = n.toExponential(digits).split('e');
  return `${comma(mantissa)} × 10${[...exponent].map(char => SUPERSCRIPT[char] ?? char).join('')}`;
};

// Short value: up to `digits` decimals, trailing zeros dropped, scientific notation for extremes.
export const fmt = (n: number | string, digits = 4): string => {
  if (typeof n === 'string') return n;
  if (!Number.isFinite(n)) return notFinite(n);
  if (n === 0) return '0';
  const abs = Math.abs(n);
  if (abs < 1e-4 || abs >= 1e6) return fmtSci(n, 3);
  return comma(String(parseFloat(n.toFixed(digits))));
};

// Fixed decimals, as the "10 casas" fields show.
export const fmtPrecise = (n: number | string, digits = 10): string => {
  if (typeof n === 'string') return n;
  if (!Number.isFinite(n)) return notFinite(n);
  return comma(n.toFixed(digits));
};

export const fmtPct = (p: number): string => {
  if (!Number.isFinite(p)) return '—';
  if (p === 0) return '0%';
  if (p >= 1) return '100%';
  if (p < 1e-4) return `${fmtSci(p * 100, 3)}%`;
  return `${comma((p * 100).toFixed(4).replace(/\.?0+$/, ''))}%`;
};

export const fmtOdds = (p: number): string => {
  if (p <= 0) return '0';
  if (p >= 1) return '∞';
  return `${fmt(p / (1 - p), 4)} : 1`;
};

// What a number input shows for a value set by the calculator.
export const toInputText = (n: number) => Number.isFinite(n) ? comma(String(n)) : '';

// Accepts "0,5", "0.5", "-1,25" and "1e-3"; returns null while the text is not a number yet.
export const parseDecimal = (text: string): number | null => {
  const normalized = text.trim().replace(',', '.');
  if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
};
