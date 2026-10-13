// 해석 템플릿. app/lib/generators/analysis.dart와 한 줄씩 대응한다.
// 정수 연산만 쓰고 %, / 대신 mod, fdiv를 쓴다.
import { frac, tfrac, poly, lincomb, paren, ipow } from '../mathutil.js';

const D = 'analysis';

const patternArith = {
  id: 'analysis-pattern.1', domain: D, rating: 500,
  gen(rng) {
    const a = rng.range(1, 20);
    const d = rng.range(2, 9);
    const terms = [a, a + d, a + 2 * d, a + 3 * d];
    return {
      text: `규칙에 따라 수를 늘어놓았습니다: $${terms.join(', ')}$. 다음에 올 수를 구하시오.`,
      answer: `${a + 4 * d}`,
      explain: `$${d}$씩 커지는 규칙이므로 다음 수는 $${a + 4 * d}$`,
      params: { kind: 'arith', terms },
    };
  },
};

const patternOther = {
  id: 'analysis-pattern.2', domain: D, rating: 700,
  gen(rng) {
    const kind = rng.pick(['geom', 'diff']);
    if (kind === 'geom') {
      const a = rng.range(1, 5);
      const r = rng.range(2, 3);
      const terms = [a, a * r, a * r * r, a * r * r * r];
      return {
        text: `규칙에 따라 수를 늘어놓았습니다: $${terms.join(', ')}$. 다음에 올 수를 구하시오.`,
        answer: `${terms[3] * r}`,
        explain: `앞의 수에 $${r}$씩 곱하는 규칙이므로 다음 수는 $${terms[3] * r}$`,
        params: { kind, terms },
      };
    }
    const a = rng.range(1, 10);
    const d = rng.range(1, 5);
    const s = rng.range(1, 3);
    const terms = [a, a + d, a + 2 * d + s, a + 3 * d + 3 * s];
    const next = a + 4 * d + 6 * s;
    return {
      text: `규칙에 따라 수를 늘어놓았습니다: $${terms.join(', ')}$. 다음에 올 수를 구하시오.`,
      answer: `${next}`,
      explain: `이웃한 수의 차가 $${d}, ${d + s}, ${d + 2 * s}$로 $${s}$씩 커지므로 다음 차는 $${d + 3 * s}$, 다음 수는 $${next}$`,
      params: { kind, terms },
    };
  },
};

const ratio = {
  id: 'analysis-ratio', domain: D, rating: 750,
  gen(rng) {
    const a = rng.range(2, 9);
    const b = rng.range(2, 9);
    const k = rng.range(2, 9);
    return {
      text: `비례식 $${a} : ${b} = ${a * k} : x$에서 $x$의 값을 구하시오.`,
      answer: `${b * k}`,
      explain: `$${a} \\times x = ${b} \\times ${a * k}$이므로 $x = ${b * k}$`,
      params: { a, b, c: a * k },
    };
  },
};

const lineValue = {
  id: 'analysis-lineval.1', domain: D, rating: 850,
  gen(rng) {
    let a = rng.range(-9, 9);
    if (a === 0) a = 2;
    const b = rng.range(-10, 10);
    const k = rng.range(-5, 5);
    return {
      text: `일차함수 $f(x) = ${poly([a, b], 'x')}$에 대하여 $f(${k})$의 값을 구하시오.`,
      answer: `${a * k + b}`,
      explain: `$f(${k}) = ${paren(a)} \\cdot ${paren(k)} + ${paren(b)} = ${a * k + b}$`,
      params: { kind: 'value', a, b, k, x1: 0, y1: 0, x2: 0, y2: 0 },
    };
  },
};

const lineSlope = {
  id: 'analysis-lineval.2', domain: D, rating: 1000,
  gen(rng) {
    const x1 = rng.range(-6, 6);
    const y1 = rng.range(-6, 6);
    let x2 = rng.range(-6, 6);
    const y2 = rng.range(-6, 6);
    if (x2 === x1) x2 = x1 + 3;
    return {
      text: `두 점 $A(${x1}, ${y1})$, $B(${x2}, ${y2})$에 대하여 직선 $AB$의 기울기를 구하시오.`,
      answer: frac(y2 - y1, x2 - x1),
      explain: `기울기는 $\\frac{${y2} - ${paren(y1)}}{${x2} - ${paren(x1)}} = ${tfrac(y2 - y1, x2 - x1)}$`,
      params: { kind: 'slope', a: 0, b: 0, k: 0, x1, y1, x2, y2 },
    };
  },
};

const intercept = {
  id: 'analysis-intercept', domain: D, rating: 950,
  gen(rng) {
    let a = rng.range(-6, 6);
    if (a === 0) a = 4;
    let b = rng.range(-12, 12);
    if (b === 0) b = 5;
    return {
      text: `일차함수 $y = ${poly([a, b], 'x')}$의 그래프의 $x$절편을 구하시오.`,
      answer: frac(-b, a),
      explain: `$y = 0$일 때 $${poly([a, 0], 'x')} = ${-b}$이므로 $x = ${tfrac(-b, a)}$`,
      params: { a, b },
    };
  },
};

const vertex = {
  id: 'analysis-vertex', domain: D, rating: 1200,
  gen(rng) {
    const a = rng.pick([1, 2, 3, -1, -2]);
    const p = rng.range(-5, 5);
    const q = rng.range(-9, 9);
    const coeffs = [a, -2 * a * p, a * p * p + q];
    const what = a > 0 ? '최솟값' : '최댓값';
    return {
      text: `이차함수 $y = ${poly(coeffs, 'x')}$의 ${what}을 구하시오.`,
      answer: `${q}`,
      explain: `$y = ${a === 1 ? '' : a === -1 ? '-' : a}(${poly([1, -p], 'x')})^2 ${q < 0 ? '-' : '+'} ${Math.abs(q)}$이므로 ${what}은 $${q}$`,
      params: { coeffs },
    };
  },
};

const limitPoint = {
  id: 'analysis-limit.1', domain: D, rating: 1300,
  gen(rng) {
    const a = rng.range(-5, 5);
    let b = rng.range(-6, 6);
    if (b === a) b = a + 1;
    const num = [1, -(a + b), a * b];
    const den = [1, -a];
    return {
      text: `$\\lim_{x \\to ${a}} \\frac{${poly(num, 'x')}}{${poly(den, 'x')}}$의 값을 구하시오.`,
      answer: `${a - b}`,
      explain: `분자를 $(${poly([1, -a], 'x')})(${poly([1, -b], 'x')})$로 인수분해해 약분하면 $${a} - ${paren(b)} = ${a - b}$`,
      params: { kind: 'point', num, den, at: a },
    };
  },
};

const limitInfinity = {
  id: 'analysis-limit.2', domain: D, rating: 1350,
  gen(rng) {
    let a = rng.range(-6, 6);
    if (a === 0) a = 3;
    const b = rng.range(-9, 9);
    const c = rng.range(-9, 9);
    let d = rng.range(-6, 6);
    if (d === 0) d = 2;
    const e = rng.range(-9, 9);
    const f = rng.range(-9, 9);
    const num = [a, b, c];
    const den = [d, e, f];
    return {
      text: `$\\lim_{x \\to \\infty} \\frac{${poly(num, 'x')}}{${poly(den, 'x')}}$의 값을 구하시오.`,
      answer: frac(a, d),
      explain: `분자와 분모의 차수가 같으므로 최고차항 계수의 비 $${tfrac(a, d)}$`,
      params: { kind: 'infinity', num, den, at: 0 },
    };
  },
};

const TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]];

const trig = {
  id: 'analysis-trig', domain: D, rating: 1350,
  gen(rng) {
    const t = rng.pick(TRIPLES);
    const swap = rng.range(0, 1);
    const opp = t[swap];
    const adj = t[1 - swap];
    const hyp = t[2];
    const ask = rng.pick(['cos', 'tan']);
    const n = ask === 'cos' ? adj : opp;
    const m = ask === 'cos' ? hyp : adj;
    return {
      text: `예각 $\\theta$에 대하여 $\\sin\\theta = \\frac{${opp}}{${hyp}}$일 때, $\\${ask}\\theta$의 값을 구하시오.`,
      answer: frac(n, m),
      explain: `빗변 $${hyp}$, 높이 $${opp}$인 직각삼각형의 밑변은 $${adj}$이므로 $\\${ask}\\theta = ${tfrac(n, m)}$`,
      params: { opp, hyp, ask },
    };
  },
};

const derivPoly = {
  id: 'analysis-deriv.1', domain: D, rating: 1400,
  gen(rng) {
    let a = rng.range(-4, 4);
    if (a === 0) a = 1;
    const b = rng.range(-4, 4);
    const c = rng.range(-4, 4);
    const d = rng.range(-4, 4);
    const k = rng.range(-3, 3);
    const value = 3 * a * k * k + 2 * b * k + c;
    return {
      text: `함수 $f(x) = ${poly([a, b, c, d], 'x')}$에 대하여 $f'(${k})$의 값을 구하시오.`,
      answer: `${value}`,
      explain: `$f'(x) = ${poly([3 * a, 2 * b, c], 'x')}$이므로 $f'(${k}) = ${value}$`,
      params: { factors: [[a, b, c, d]], k },
    };
  },
};

const derivProduct = {
  id: 'analysis-deriv.2', domain: D, rating: 1550,
  gen(rng) {
    let a = rng.range(-3, 3);
    if (a === 0) a = 2;
    const b = rng.range(-4, 4);
    let c = rng.range(-3, 3);
    if (c === 0) c = 1;
    const d = rng.range(-4, 4);
    const e = rng.range(-4, 4);
    const k = rng.range(-2, 2);
    const u = a * k + b;
    const v = c * k * k + d * k + e;
    const value = a * v + u * (2 * c * k + d);
    return {
      text: `함수 $f(x) = (${poly([a, b], 'x')})(${poly([c, d, e], 'x')})$에 대하여 $f'(${k})$의 값을 구하시오.`,
      answer: `${value}`,
      explain: `곱의 미분법으로 $f'(${k}) = ${paren(a)} \\cdot ${paren(v)} + ${paren(u)} \\cdot ${paren(2 * c * k + d)} = ${value}$`,
      params: { factors: [[a, b], [c, d, e]], k },
    };
  },
};

const integral = {
  id: 'analysis-integral', domain: D, rating: 1500,
  gen(rng) {
    let a = rng.range(-3, 3);
    if (a === 0) a = 1;
    const b = rng.range(-4, 4);
    const c = rng.range(-5, 5);
    const p = rng.range(-2, 1);
    const q = rng.range(p + 1, 3);
    const n = 2 * a * (ipow(q, 3) - ipow(p, 3)) + 3 * b * (q * q - p * p) + 6 * c * (q - p);
    return {
      text: `정적분 $\\int_{${p}}^{${q}} (${poly([a, b, c], 'x')}) \\, dx$의 값을 구하시오.`,
      answer: frac(n, 6),
      explain: `항별로 적분한 뒤 위끝과 아래끝을 대입해 빼면 $${tfrac(n, 6)}$`,
      params: { coeffs: [a, b, c], p, q },
    };
  },
};

const seriesGeom = {
  id: 'analysis-series.1', domain: D, rating: 1700,
  gen(rng) {
    const a = rng.range(2, 6);
    const q = rng.range(2, 6);
    const p = rng.range(1, q - 1) * rng.pick([1, -1]);
    return {
      text: `급수 $\\sum_{n=0}^{\\infty} ${a} \\left(${tfrac(p, q)}\\right)^n$의 합을 구하시오.`,
      answer: frac(a * q, q - p),
      explain: `첫째항 $${a}$, 공비 $${tfrac(p, q)}$인 등비급수이므로 합은 $\\frac{a}{1 - r} = ${tfrac(a * q, q - p)}$`,
      params: { kind: 'geom', a, p, q, k: 0, N: 0 },
    };
  },
};

const seriesTelescope = {
  id: 'analysis-series.2', domain: D, rating: 1800,
  gen(rng) {
    const k = rng.range(1, 2);
    const N = rng.range(5, 30);
    let n;
    let m;
    if (k === 1) {
      n = N;
      m = N + 1;
    } else {
      n = 3 * (N + 1) * (N + 2) - 2 * (2 * N + 3);
      m = 4 * (N + 1) * (N + 2);
    }
    const term = k === 1 ? 'n(n + 1)' : 'n(n + 2)';
    const half = k === 1 ? '' : '\\frac{1}{2}';
    return {
      text: `$\\sum_{n=1}^{${N}} \\frac{1}{${term}}$의 값을 구하시오.`,
      answer: frac(n, m),
      explain: `$\\frac{1}{${term}} = ${half}\\left(\\frac{1}{n} - \\frac{1}{n + ${k}}\\right)$로 나누면 중간 항이 소거되어 $${tfrac(n, m)}$`,
      params: { kind: 'telescope', a: 0, p: 0, q: 1, k, N },
    };
  },
};

const partialDeriv = {
  id: 'analysis-partial.1', domain: D, rating: 1750,
  gen(rng) {
    let a = rng.range(-4, 4);
    if (a === 0) a = 2;
    const b = rng.range(-4, 4);
    const c = rng.range(-4, 4);
    const m = rng.range(2, 3);
    const n = rng.range(1, 2);
    const p = rng.range(-2, 2);
    const q = rng.range(-2, 2);
    const yn = n === 1 ? 'y' : `y^${n}`;
    const value = a * m * ipow(p, m - 1) * ipow(q, n) + b * q;
    return {
      text: `함수 $f(x, y) = ${lincomb([a, b, c], [`x^${m}${yn}`, 'xy', 'y^2'])}$에 대하여 $\\frac{\\partial f}{\\partial x}(${p}, ${q})$의 값을 구하시오.`,
      answer: `${value}`,
      explain: `$y$를 상수로 보고 $x$로 미분한 뒤 $(${p}, ${q})$를 대입하면 $${value}$`,
      params: { kind: 'deriv', a, b, c, m, n, p, q },
    };
  },
};

const doubleIntegral = {
  id: 'analysis-partial.2', domain: D, rating: 1900,
  gen(rng) {
    const a = rng.range(1, 3);
    const b = rng.range(1, 3);
    const m = rng.range(1, 3);
    const n = rng.range(0, 3);
    const xm = m === 1 ? 'x' : `x^${m}`;
    const yn = n === 0 ? '' : n === 1 ? 'y' : `y^${n}`;
    const num = ipow(a, m + 1) * ipow(b, n + 1);
    const den = (m + 1) * (n + 1);
    return {
      text: `이중적분 $\\int_{0}^{${a}} \\int_{0}^{${b}} ${xm}${yn} \\, dy \\, dx$의 값을 구하시오.`,
      answer: frac(num, den),
      explain: `변수별로 나누어 적분하면 $\\frac{${a}^{${m + 1}}}{${m + 1}} \\cdot \\frac{${b}^{${n + 1}}}{${n + 1}} = ${tfrac(num, den)}$`,
      params: { kind: 'integral', a, b, c: 0, m, n, p: 0, q: 0 },
    };
  },
};

const ode = {
  id: 'analysis-ode', domain: D, rating: 1850,
  gen(rng) {
    const r1 = rng.range(-5, 4);
    const r2 = rng.range(r1 + 1, 5);
    const s = r1 + r2;
    const p = r1 * r2;
    return {
      text: `미분방정식 $${lincomb([1, -s, p], ["y''", "y'", 'y'])} = 0$의 일반해가 $y = C_1 e^{\\alpha x} + C_2 e^{\\beta x}$ $(\\alpha < \\beta)$일 때, $\\beta$의 값을 구하시오.`,
      answer: `${r2}`,
      explain: `특성방정식 $${poly([1, -s, p], 'r')} = 0$의 근은 $${r1}$, $${r2}$`,
      params: { s, p },
    };
  },
};

const residue = {
  id: 'analysis-residue', domain: D, rating: 2100,
  gen(rng) {
    let a = rng.range(-5, 5);
    if (a === 0) a = 6;
    let b = rng.range(-5, 5);
    if (b === 0) b = -6;
    if (b === a) b = -a;
    let c = rng.range(-4, 4);
    if (c === 0) c = 1;
    let d = rng.range(-6, 6);
    if (c * a + d === 0) d += 1;
    return {
      text: `함수 $f(z) = \\frac{${poly([c, d], 'z')}}{(${poly([1, -a], 'z')})(${poly([1, -b], 'z')})}$의 $z = ${a}$에서의 유수를 구하시오.`,
      answer: frac(c * a + d, a - b),
      explain: `단순극이므로 $\\lim_{z \\to ${a}} (${poly([1, -a], 'z')}) f(z) = \\frac{${c * a + d}}{${a - b}} = ${tfrac(c * a + d, a - b)}$`,
      params: { a, b, c, d },
    };
  },
};

const measure = {
  id: 'analysis-measure', domain: D, rating: 2250,
  gen(rng) {
    const intervals = [];
    for (let i = 0; i < 3; i++) {
      const lo = rng.range(0, 15);
      intervals.push([lo, lo + rng.range(1, 6)]);
    }
    // 포함-배제: 구간의 교집합 길이는 max(0, min(끝) - max(시작))
    const cap = (list) => {
      let lo = list[0][0];
      let hi = list[0][1];
      for (let i = 1; i < list.length; i++) {
        lo = Math.max(lo, list[i][0]);
        hi = Math.min(hi, list[i][1]);
      }
      return Math.max(0, hi - lo);
    };
    const [A, B, C] = intervals;
    const total = cap([A]) + cap([B]) + cap([C]) - cap([A, B]) - cap([A, C]) - cap([B, C]) + cap([A, B, C]);
    const sets = intervals.map((v) => `[${v[0]}, ${v[1]}]`).join(' \\cup ');
    return {
      text: `집합 $${sets}$의 르베그 측도를 구하시오.`,
      answer: `${total}`,
      explain: `겹치는 부분을 한 번만 세어 구간의 길이를 더하면 $${total}$`,
      params: { intervals },
    };
  },
};

const variation = {
  id: 'analysis-variation', domain: D, rating: 2400,
  gen(rng) {
    const L = rng.range(1, 6);
    const a = rng.range(-5, 5);
    let b = rng.range(-5, 5);
    if (b === a) b = a + 2;
    const n = (b - a) * (b - a);
    return {
      text: `경계조건 $y(0) = ${a}$, $y(${L}) = ${b}$ 아래에서 범함수 $J[y] = \\int_{0}^{${L}} (y')^2 \\, dx$의 최솟값을 구하시오.`,
      answer: frac(n, L),
      explain: `오일러-라그랑주 방정식 $y'' = 0$의 해는 직선이고 $y' = ${tfrac(b - a, L)}$이므로 $J = ${tfrac(n, L)}$`,
      params: { L, a, b },
    };
  },
};

export default [
  patternArith, patternOther, ratio, lineValue, lineSlope, intercept, vertex,
  limitPoint, limitInfinity, trig, derivPoly, derivProduct, integral,
  seriesGeom, seriesTelescope, partialDeriv, doubleIntegral, ode, residue, measure, variation,
];
