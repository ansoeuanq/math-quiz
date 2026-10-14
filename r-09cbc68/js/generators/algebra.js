// 대수 템플릿. app/lib/generators/algebra.dart와 한 줄씩 대응한다.
// 정수 연산만 쓰고 %, / 대신 mod, fdiv를 쓴다.
import { frac, tfrac, poly, lincomb, pmat, paren, ipow, gcd, lcm, numDivisors, fdiv } from '../mathutil.js';

const D = 'algebra';

const add = (digits, rating) => ({
  id: `algebra-add.${digits}`, domain: D, rating,
  gen(rng) {
    const lo = digits === 1 ? 1 : ipow(10, digits - 1);
    const hi = ipow(10, digits) - 1;
    let a = rng.range(lo, hi);
    let b = rng.range(lo, hi);
    const op = rng.pick(['+', '-']);
    if (op === '-' && a < b) {
      const t = a;
      a = b;
      b = t;
    }
    const c = op === '+' ? a + b : a - b;
    return {
      text: `$${a} ${op} ${b}$의 값을 구하시오.`,
      answer: `${c}`,
      explain: `$${a} ${op} ${b} = ${c}$`,
      params: { a, b, op },
    };
  },
});

const mul = (level, rating) => ({
  id: `algebra-mul.${level}`, domain: D, rating,
  gen(rng) {
    const a = level === 1 ? rng.range(2, 9) : rng.range(11, 99);
    const b = rng.range(2, 9);
    const op = rng.pick(['×', '÷']);
    if (op === '×') {
      return {
        text: `$${a} \\times ${b}$의 값을 구하시오.`,
        answer: `${a * b}`,
        explain: `$${a} \\times ${b} = ${a * b}$`,
        params: { x: a, y: b, op },
      };
    }
    return {
      text: `$${a * b} \\div ${b}$의 값을 구하시오.`,
      answer: `${a}`,
      explain: `$${b} \\times ${a} = ${a * b}$이므로 $${a * b} \\div ${b} = ${a}$`,
      params: { x: a * b, y: b, op },
    };
  },
});

const fracOp = (level, rating) => ({
  id: `algebra-frac.${level}`, domain: D, rating,
  gen(rng) {
    let b = rng.range(2, 9);
    let a = rng.range(1, b - 1);
    let d = rng.range(2, 9);
    let c = rng.range(1, d - 1);
    const op = level === 1 ? rng.pick(['+', '-']) : rng.pick(['×', '÷']);
    if (op === '-' && a * d < c * b) {
      let t = a;
      a = c;
      c = t;
      t = b;
      b = d;
      d = t;
    }
    let n;
    let m;
    let tex;
    if (op === '+') {
      n = a * d + c * b;
      m = b * d;
      tex = '+';
    } else if (op === '-') {
      n = a * d - c * b;
      m = b * d;
      tex = '-';
    } else if (op === '×') {
      n = a * c;
      m = b * d;
      tex = '\\times';
    } else {
      n = a * d;
      m = b * c;
      tex = '\\div';
    }
    const expr = `\\frac{${a}}{${b}} ${tex} \\frac{${c}}{${d}}`;
    return {
      text: `$${expr}$의 값을 기약분수로 구하시오.`,
      answer: frac(n, m),
      explain: `$${expr} = ${tfrac(n, m)}$`,
      params: { a, b, c, d, op },
    };
  },
});

const linear = (level, rating) => ({
  id: `algebra-linear.${level}`, domain: D, rating,
  gen(rng) {
    const x = rng.range(-9, 9);
    const a = rng.range(2, 9);
    const b = rng.range(-20, 20);
    if (level === 1) {
      const c = a * x + b;
      return {
        text: `방정식 $${poly([a, b], 'x')} = ${c}$의 해 $x$를 구하시오.`,
        answer: `${x}`,
        explain: `$${a}x = ${c - b}$이므로 $x = ${x}$`,
        params: { a, b, c: 0, d: c },
      };
    }
    let c = rng.range(1, 9);
    if (c === a) c = a + 1;
    const d = (a - c) * x + b;
    return {
      text: `방정식 $${poly([a, b], 'x')} = ${poly([c, d], 'x')}$의 해 $x$를 구하시오.`,
      answer: `${x}`,
      explain: `$${poly([a - c, 0], 'x')} = ${d - b}$이므로 $x = ${x}$`,
      params: { a, b, c, d },
    };
  },
});

const system = {
  id: 'algebra-system', domain: D, rating: 1100,
  gen(rng) {
    const x = rng.range(-6, 6);
    const y = rng.range(-6, 6);
    const a1 = rng.range(1, 5);
    const b1 = rng.range(1, 5);
    const a2 = rng.range(1, 5);
    let b2 = rng.range(1, 5);
    if (a1 * b2 - a2 * b1 === 0) b2 += 1;
    const c1 = a1 * x + b1 * y;
    const c2 = a2 * x + b2 * y;
    const e1 = `${lincomb([a1, b1], ['x', 'y'])} = ${c1}`;
    const e2 = `${lincomb([a2, b2], ['x', 'y'])} = ${c2}`;
    return {
      text: `연립방정식 $\\begin{cases} ${e1} \\\\ ${e2} \\end{cases}$의 해에서 $x$의 값을 구하시오.`,
      answer: `${x}`,
      explain: `두 식을 연립하면 $x = ${x}$, $y = ${y}$`,
      params: { a1, b1, c1, a2, b2, c2 },
    };
  },
};

const quad = {
  id: 'algebra-quad', domain: D, rating: 1200,
  gen(rng) {
    const r1 = rng.range(-9, 8);
    const r2 = rng.range(r1 + 1, 9);
    const b = -(r1 + r2);
    const c = r1 * r2;
    return {
      text: `이차방정식 $${poly([1, b, c], 'x')} = 0$의 두 근 중 큰 근을 구하시오.`,
      answer: `${r2}`,
      explain: `$(x - ${paren(r1)})(x - ${paren(r2)}) = 0$이므로 두 근은 $${r1}$, $${r2}$`,
      params: { b, c },
    };
  },
};

const log = {
  id: 'algebra-log', domain: D, rating: 1300,
  gen(rng) {
    const a = rng.pick([2, 3, 5]);
    const m = rng.range(1, 4);
    const b = rng.pick([2, 3, 10]);
    const n = rng.range(1, 3);
    const A = ipow(a, m);
    const B = ipow(b, n);
    return {
      text: `$\\log_{${a}} ${A} + \\log_{${b}} ${B}$의 값을 구하시오.`,
      answer: `${m + n}`,
      explain: `$${A} = ${a}^{${m}}$, $${B} = ${b}^{${n}}$이므로 $${m} + ${n} = ${m + n}$`,
      params: { a, A, b, B },
    };
  },
};

const seqArith = {
  id: 'algebra-seq.1', domain: D, rating: 1250,
  gen(rng) {
    const a = rng.range(-10, 10);
    let d = rng.range(-5, 5);
    if (d === 0) d = 3;
    const n = rng.range(8, 20);
    const an = a + (n - 1) * d;
    return {
      text: `첫째항이 $${a}$, 공차가 $${d}$인 등차수열의 제$${n}$항을 구하시오.`,
      answer: `${an}`,
      explain: `$a_n = ${a} + (n - 1) \\cdot ${paren(d)}$이므로 $a_{${n}} = ${an}$`,
      params: { kind: 'arith', a, d, r: 0, n },
    };
  },
};

const seqGeom = {
  id: 'algebra-seq.2', domain: D, rating: 1450,
  gen(rng) {
    const a = rng.range(1, 5);
    const r = rng.pick([2, 3, -2]);
    const n = rng.range(4, 7);
    let sum = 0;
    let term = a;
    for (let i = 0; i < n; i++) {
      sum += term;
      term *= r;
    }
    return {
      text: `첫째항이 $${a}$, 공비가 $${r}$인 등비수열의 첫째항부터 제$${n}$항까지의 합을 구하시오.`,
      answer: `${sum}`,
      explain: `$S_n = \\frac{a(r^n - 1)}{r - 1}$에서 $a = ${a}$, $r = ${r}$, $n = ${n}$일 때 $${sum}$`,
      params: { kind: 'geom', a, d: 0, r, n },
    };
  },
};

const complexNorm = {
  id: 'algebra-complex.1', domain: D, rating: 1350,
  gen(rng) {
    const a = rng.range(-9, 9);
    let b = rng.range(-9, 9);
    if (b === 0) b = 1;
    const z = lincomb([a, b], ['', 'i']);
    return {
      text: `복소수 $z = ${z}$에 대하여 $|z|^2$의 값을 구하시오.`,
      answer: `${a * a + b * b}`,
      explain: `$|z|^2 = ${paren(a)}^2 + ${paren(b)}^2 = ${a * a + b * b}$`,
      params: { kind: 'norm', a, b, c: 0, d: 0 },
    };
  },
};

const complexMul = {
  id: 'algebra-complex.2', domain: D, rating: 1400,
  gen(rng) {
    let a = rng.range(-6, 6);
    let b = rng.range(-6, 6);
    let c = rng.range(-6, 6);
    let d = rng.range(-6, 6);
    if (a === 0) a = 2;
    if (b === 0) b = 1;
    if (c === 0) c = 3;
    if (d === 0) d = 1;
    const re = a * c - b * d;
    return {
      text: `$(${lincomb([a, b], ['', 'i'])})(${lincomb([c, d], ['', 'i'])})$의 실수부를 구하시오.`,
      answer: `${re}`,
      explain: `실수부는 $${paren(a)} \\cdot ${paren(c)} - ${paren(b)} \\cdot ${paren(d)} = ${re}$`,
      params: { kind: 'mul', a, b, c, d },
    };
  },
};

const det2 = {
  id: 'algebra-det.1', domain: D, rating: 1700,
  gen(rng) {
    const a = rng.range(-9, 9);
    const b = rng.range(-9, 9);
    const c = rng.range(-9, 9);
    const d = rng.range(-9, 9);
    const det = a * d - b * c;
    return {
      text: `행렬 $${pmat([[a, b], [c, d]])}$의 행렬식을 구하시오.`,
      answer: `${det}`,
      explain: `$${paren(a)} \\cdot ${paren(d)} - ${paren(b)} \\cdot ${paren(c)} = ${det}$`,
      params: { m: [[a, b], [c, d]] },
    };
  },
};

const det3 = {
  id: 'algebra-det.2', domain: D, rating: 1850,
  gen(rng) {
    const m = [];
    for (let i = 0; i < 3; i++) {
      const row = [];
      for (let j = 0; j < 3; j++) row.push(rng.range(-4, 4));
      m.push(row);
    }
    const det = m[0][0] * m[1][1] * m[2][2] + m[0][1] * m[1][2] * m[2][0] + m[0][2] * m[1][0] * m[2][1]
      - m[0][2] * m[1][1] * m[2][0] - m[0][1] * m[1][0] * m[2][2] - m[0][0] * m[1][2] * m[2][1];
    return {
      text: `행렬 $${pmat(m)}$의 행렬식을 구하시오.`,
      answer: `${det}`,
      explain: `사루스 법칙 또는 여인수 전개로 계산하면 $${det}$`,
      params: { m },
    };
  },
};

const eigen = {
  id: 'algebra-eigen', domain: D, rating: 1950,
  gen(rng) {
    const l1 = rng.range(-6, 5);
    const l2 = rng.range(l1 + 1, 6);
    const k = rng.range(1, 3);
    const s = rng.range(1, 2);
    // A = P diag(l1, l2) P^{-1}, P = [[1, k], [s, ks + 1]] (det P = 1)
    const q = k * s + 1;
    const m = [
      [l1 * q - k * s * l2, k * (l2 - l1)],
      [s * q * (l1 - l2), q * l2 - k * s * l1],
    ];
    return {
      text: `행렬 $${pmat(m)}$의 두 고윳값 중 큰 값을 구하시오.`,
      answer: `${l2}`,
      explain: `특성방정식 $${poly([1, -(l1 + l2), l1 * l2], '\\lambda')} = 0$의 근은 $${l1}$, $${l2}$`,
      params: { m },
    };
  },
};

const orderCyclic = {
  id: 'algebra-order.1', domain: D, rating: 1900,
  gen(rng) {
    const n = rng.range(6, 30);
    const k = rng.range(1, n - 1);
    const g = gcd(n, k);
    const ord = fdiv(n, g);
    return {
      text: `덧셈군 $\\mathbb{Z}_{${n}}$에서 원소 $${k}$의 위수를 구하시오.`,
      answer: `${ord}`,
      explain: `위수는 $\\frac{n}{\\gcd(n, k)} = \\frac{${n}}{${g}} = ${ord}$`,
      params: { kind: 'cyclic', n, k, lengths: [] },
    };
  },
};

const orderPerm = {
  id: 'algebra-order.2', domain: D, rating: 2000,
  gen(rng) {
    const a = rng.range(2, 6);
    const b = rng.range(2, 7);
    const c = rng.range(2, 5);
    const ord = lcm(lcm(a, b), c);
    return {
      text: `대칭군 $S_{${a + b + c}}$의 순열 $\\sigma$가 길이가 각각 $${a}$, $${b}$, $${c}$인 서로소인 순환 세 개의 곱일 때, $\\sigma$의 위수를 구하시오.`,
      answer: `${ord}`,
      explain: `서로소인 순환들의 곱의 위수는 길이들의 최소공배수이므로 $${ord}$`,
      params: { kind: 'perm', n: 0, k: 0, lengths: [a, b, c] },
    };
  },
};

const subgroups = {
  id: 'algebra-subgroups', domain: D, rating: 2050,
  gen(rng) {
    const n = rng.range(12, 120);
    const count = numDivisors(n);
    return {
      text: `순환군 $\\mathbb{Z}_{${n}}$의 부분군의 개수를 구하시오.`,
      answer: `${count}`,
      explain: `순환군의 부분군은 위수의 약수마다 하나씩 있으므로 $${n}$의 약수의 개수 $${count}$`,
      params: { n },
    };
  },
};

const galoisDegree = {
  id: 'algebra-galois.1', domain: D, rating: 2300,
  gen(rng) {
    const p = rng.pick([2, 3, 5, 7]);
    const m = rng.range(1, 4);
    const t = rng.range(2, 5);
    const n = m * t;
    return {
      text: `체의 확대 $\\mathbb{F}_{${p}^{${n}}} / \\mathbb{F}_{${p}^{${m}}}$의 갈루아 군의 위수를 구하시오.`,
      answer: `${t}`,
      explain: `유한체의 확대는 갈루아 확대이고 군의 위수는 확대 차수 $\\frac{${n}}{${m}} = ${t}$`,
      params: { kind: 'degree', n, m },
    };
  },
};

const galoisSubfields = {
  id: 'algebra-galois.2', domain: D, rating: 2400,
  gen(rng) {
    const p = rng.pick([2, 3, 5, 7]);
    const n = rng.range(6, 36);
    const count = numDivisors(n);
    return {
      text: `유한체 $\\mathbb{F}_{${p}^{${n}}}$의 부분체의 개수를 구하시오.`,
      answer: `${count}`,
      explain: `부분체는 $${n}$의 약수 $d$마다 $\\mathbb{F}_{${p}^{d}}$ 하나씩이므로 $${count}$개`,
      params: { kind: 'subfields', n, m: 0 },
    };
  },
};

// [군 이름, 위수, 기약표현 차원들]
const REP_GROUPS = [
  ['S_3', 6, [1, 1, 2]],
  ['D_4', 8, [1, 1, 1, 1, 2]],
  ['D_5', 10, [1, 1, 2, 2]],
  ['A_4', 12, [1, 1, 1, 3]],
  ['D_6', 12, [1, 1, 1, 1, 2, 2]],
  ['S_4', 24, [1, 1, 2, 3, 3]],
  ['A_5', 60, [1, 3, 3, 4, 5]],
  ['S_5', 120, [1, 1, 4, 4, 5, 5, 6]],
];

const rep = {
  id: 'algebra-rep', domain: D, rating: 2500,
  gen(rng) {
    const g = rng.pick(REP_GROUPS);
    const order = g[1];
    const dims = g[2];
    const hide = rng.range(0, dims.length - 1);
    const shown = [];
    for (let i = 0; i < dims.length; i++) if (i !== hide) shown.push(dims[i]);
    return {
      text: `위수가 $${order}$인 유한군 $G$의 복소 기약표현은 모두 $${dims.length}$개이고, 그중 $${shown.length}$개의 차원이 $${shown.join(', ')}$이다. 나머지 하나의 차원을 구하시오.`,
      answer: `${dims[hide]}`,
      explain: `기약표현 차원의 제곱의 합은 군의 위수와 같으므로 나머지 차원은 $${dims[hide]}$ (예: $${g[0]}$)`,
      params: { order, shown },
    };
  },
};

export default [
  add(1, 400), add(2, 500), add(3, 600),
  mul(1, 550), mul(2, 700),
  fracOp(1, 800), fracOp(2, 850),
  linear(1, 900), linear(2, 1000),
  system, quad, log, seqArith, seqGeom, complexNorm, complexMul,
  det2, det3, eigen, orderCyclic, orderPerm, subgroups,
  galoisDegree, galoisSubfields, rep,
];
