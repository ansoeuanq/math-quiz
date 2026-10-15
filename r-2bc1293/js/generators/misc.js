// 기타(수치해석, 최적화, 동역학계, 범주론, 호몰로지 대수) 템플릿.
// app/lib/generators/misc.dart와 한 줄씩 대응한다. 정수 연산만 쓰고 %, / 대신 mod, fdiv를 쓴다.
import { frac, tfrac, poly, lincomb, ipow, gcd, fdiv, josa } from '../mathutil.js';

const D = 'misc';

const newton = {
  id: 'misc-newton', domain: D, rating: 1750,
  gen(rng) {
    const a = rng.range(2, 30);
    const x0 = rng.range(1, 6);
    return {
      text: `방정식 $x^2 - ${a} = 0$에 초깃값 $x_0 = ${x0}$에서 뉴턴 방법을 한 번 적용하여 얻는 $x_1$의 값을 구하시오.`,
      answer: frac(x0 * x0 + a, 2 * x0),
      explain: `$x_1 = x_0 - \\frac{f(x_0)}{f'(x_0)} = ${x0} - \\frac{${x0 * x0 - a}}{${2 * x0}} = ${tfrac(x0 * x0 + a, 2 * x0)}$`,
      params: { a, x0 },
    };
  },
};

const trapezoid = {
  id: 'misc-trapezoid', domain: D, rating: 1800,
  gen(rng) {
    const a = rng.range(1, 3);
    const c = rng.range(0, 5);
    const N = rng.range(2, 4);
    let twice = 0;
    for (let i = 0; i < N; i++) twice += a * i * i + c + a * (i + 1) * (i + 1) + c;
    return {
      text: `구간 $[0, ${N}]$${josa(N, '을')} $${N}$등분하여 사다리꼴 공식으로 구한 $\\int_{0}^{${N}} (${poly([a, 0, c], 'x')}) \\, dx$의 근삿값을 구하시오.`,
      answer: frac(twice, 2),
      explain: `폭이 $1$인 사다리꼴 $${N}$개의 넓이를 더하면 $${tfrac(twice, 2)}$`,
      params: { a, c, N },
    };
  },
};

const lp = {
  id: 'misc-lp', domain: D, rating: 1900,
  gen(rng) {
    const a = rng.range(1, 6);
    const b = rng.range(1, 6);
    const c = rng.range(6, 12);
    const d = rng.range(2, c - 1);
    const e = rng.range(c - d + 1, c - 1);
    // 꼭짓점 (d, 0), (d, c - d), (c - e, e), (0, e)에서의 값 중 최대
    const best = Math.max(Math.max(a * d, a * d + b * (c - d)), Math.max(a * (c - e) + b * e, b * e));
    return {
      text: `제약조건 $x + y \\le ${c}$, $0 \\le x \\le ${d}$, $0 \\le y \\le ${e}$ 아래에서 $${lincomb([a, b], ['x', 'y'])}$의 최댓값을 구하시오.`,
      answer: `${best}`,
      explain: `선형계획 문제의 최댓값은 실행가능 영역의 꼭짓점에서 나오며, 꼭짓점들의 값을 비교하면 $${best}$`,
      params: { a, b, c, d, e },
    };
  },
};

const lagrange = {
  id: 'misc-lagrange', domain: D, rating: 2000,
  gen(rng) {
    const a = rng.range(1, 5);
    const b = rng.range(1, 5);
    const c = rng.range(1, 12);
    return {
      text: `조건 $${lincomb([a, b], ['x', 'y'])} = ${c}$ 아래에서 $x^2 + y^2$의 최솟값을 구하시오.`,
      answer: frac(c * c, a * a + b * b),
      explain: `라그랑주 승수법으로 $(x, y) = \\lambda(${a}, ${b})$이고 원점에서 직선까지 거리의 제곱이므로 $${tfrac(c * c, a * a + b * b)}$`,
      params: { a, b, c },
    };
  },
};

const fixedLinear = {
  id: 'misc-fixedpoint.1', domain: D, rating: 1750,
  gen(rng) {
    const a = rng.range(2, 6) * rng.pick([1, -1]);
    let b = rng.range(-9, 9);
    if (b === 0) b = 4;
    return {
      text: `사상 $f(x) = ${poly([a, b], 'x')}$의 고정점, 즉 $f(x) = x$를 만족하는 $x$의 값을 구하시오.`,
      answer: frac(b, 1 - a),
      explain: `$${poly([a, b], 'x')} = x$를 풀면 $x = ${tfrac(b, 1 - a)}$`,
      params: { kind: 'linear', a, b, p: 0, q: 1 },
    };
  },
};

const fixedLogistic = {
  id: 'misc-fixedpoint.2', domain: D, rating: 1900,
  gen(rng) {
    const p = rng.range(3, 9);
    const q = rng.range(fdiv(p + 3, 4), p - 1);
    return {
      text: `로지스틱 사상 $f(x) = ${tfrac(p, q)}x(1 - x)$의 $0$이 아닌 고정점을 구하시오.`,
      answer: frac(p - q, p),
      explain: `$rx(1 - x) = x$에서 $x \\neq 0$이면 $x = 1 - \\frac{1}{r} = ${tfrac(p - q, p)}$`,
      params: { kind: 'logistic', a: 0, b: 0, p, q },
    };
  },
};

const period = {
  id: 'misc-period', domain: D, rating: 2100,
  gen(rng) {
    const n = rng.range(2, 10);
    const value = ipow(2, n) - 1;
    return {
      text: `구간 $[0, 1)$ 위의 배가 사상 $f(x) = 2x - \\lfloor 2x \\rfloor$에 대하여 $f^{${n}}(x) = x$를 만족하는 점 $x$의 개수를 구하시오. (단, $f^{${n}}$은 $f$를 $${n}$번 합성한 것이다.)`,
      answer: `${value}`,
      explain: `$f^n(x) = 2^n x - \\lfloor 2^n x \\rfloor$이므로 $(2^n - 1)x$가 정수인 $x = \\frac{k}{2^n - 1}$이고, 모두 $2^{${n}} - 1 = ${value}$개`,
      params: { n },
    };
  },
};

const category = {
  id: 'misc-category', domain: D, rating: 2250,
  gen(rng) {
    const kind = rng.pick(['chain', 'power']);
    if (kind === 'chain') {
      const n = rng.range(3, 12);
      const value = fdiv(n * (n + 1), 2);
      return {
        text: `원소가 $${n}$개인 전순서 집합을 범주로 볼 때(대상은 원소이고, $a \\le b$일 때 사상 $a \\to b$가 꼭 하나 있다), 항등 사상을 포함한 사상의 총 개수를 구하시오.`,
        answer: `${value}`,
        explain: `$a \\le b$인 순서쌍의 수이므로 $\\binom{${n}}{2} + ${n} = ${value}$`,
        params: { kind, n },
      };
    }
    const n = rng.range(2, 6);
    return {
      text: `원소가 $${n}$개인 집합의 멱집합을 포함 관계에 의한 범주로 볼 때(대상은 부분집합이고, $A \\subseteq B$일 때 사상 $A \\to B$가 꼭 하나 있다), 항등 사상을 포함한 사상의 총 개수를 구하시오.`,
      answer: `${ipow(3, n)}`,
      explain: `원소마다 $A$와 $B$ 모두에 속함, $B$에만 속함, 어디에도 속하지 않음의 세 가지이므로 $3^{${n}} = ${ipow(3, n)}$`,
      params: { kind, n },
    };
  },
};

const homGen = (id, rating, kind) => ({
  id, domain: D, rating,
  gen(rng) {
    const m = rng.range(4, 36);
    const n = rng.range(4, 36);
    const g = gcd(m, n);
    const object = kind === 'hom'
      ? `\\mathrm{Hom}_{\\mathbb{Z}}(\\mathbb{Z}_{${m}}, \\mathbb{Z}_{${n}})`
      : `\\mathbb{Z}_{${m}} \\otimes_{\\mathbb{Z}} \\mathbb{Z}_{${n}}`;
    return {
      text: `아벨 군 $${object}$의 위수를 구하시오.`,
      answer: `${g}`,
      explain: `$${object} \\cong \\mathbb{Z}_{\\gcd(${m}, ${n})} = \\mathbb{Z}_{${g}}$`,
      params: { kind, m, n },
    };
  },
});

export default [
  newton, trapezoid, lp, lagrange, fixedLinear, fixedLogistic, period, category,
  homGen('misc-hom.1', 2300, 'hom'),
  homGen('misc-hom.2', 2350, 'tensor'),
];
