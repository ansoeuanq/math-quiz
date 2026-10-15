// 기하 템플릿. app/lib/generators/geometry.dart와 한 줄씩 대응한다.
// 정수 연산만 쓰고 %, / 대신 mod, fdiv를 쓴다.
import { frac, tfrac, poly, lincomb, ipow, binom, fdiv, mod } from '../mathutil.js';

const D = 'geometry';
const TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]];

const rect = {
  id: 'geometry-rect.1', domain: D, rating: 450,
  gen(rng) {
    const w = rng.range(2, 12);
    const h = rng.range(2, 12);
    const kind = rng.pick(['area', 'perimeter']);
    const value = kind === 'area' ? w * h : 2 * (w + h);
    const what = kind === 'area' ? '넓이' : '둘레의 길이';
    return {
      text: `가로의 길이가 $${w}$, 세로의 길이가 $${h}$인 직사각형의 ${what}를 구하시오.`,
      answer: `${value}`,
      explain: kind === 'area' ? `$${w} \\times ${h} = ${value}$` : `$2 \\times (${w} + ${h}) = ${value}$`,
      params: { kind, w, h },
    };
  },
};

const triangleArea = {
  id: 'geometry-rect.2', domain: D, rating: 550,
  gen(rng) {
    const w = rng.range(2, 12);
    const h = 2 * rng.range(1, 8);
    const value = w * fdiv(h, 2);
    return {
      text: `밑변의 길이가 $${w}$, 높이가 $${h}$인 삼각형의 넓이를 구하시오.`,
      answer: `${value}`,
      explain: `$${w} \\times ${h} \\div 2 = ${value}$`,
      params: { kind: 'triangle', w, h },
    };
  },
};

const angleTriangle = {
  id: 'geometry-angle.1', domain: D, rating: 600,
  gen(rng) {
    const a = rng.range(20, 100);
    const b = rng.range(20, 160 - a);
    const c = 180 - a - b;
    return {
      text: `삼각형의 두 각의 크기가 $${a}^\\circ$, $${b}^\\circ$일 때, 나머지 한 각의 크기는 몇 도인지 구하시오.`,
      answer: `${c}`,
      explain: `세 각의 크기의 합은 $180^\\circ$이므로 $180 - ${a} - ${b} = ${c}$`,
      params: { kind: 'triangle', a, b, n: 0 },
    };
  },
};

const anglePolygon = {
  id: 'geometry-angle.2', domain: D, rating: 800,
  gen(rng) {
    const n = rng.range(5, 12);
    const sum = 180 * (n - 2);
    return {
      text: `$${n}$각형의 내각의 크기의 합은 몇 도인지 구하시오.`,
      answer: `${sum}`,
      explain: `$180 \\times (${n} - 2) = ${sum}$`,
      params: { kind: 'polygon', a: 0, b: 0, n },
    };
  },
};

const volume = {
  id: 'geometry-volume', domain: D, rating: 700,
  gen(rng) {
    const a = rng.range(2, 9);
    const b = rng.range(2, 9);
    const c = rng.range(2, 9);
    const kind = rng.pick(['volume', 'surface']);
    const value = kind === 'volume' ? a * b * c : 2 * (a * b + b * c + c * a);
    return {
      text: `가로 $${a}$, 세로 $${b}$, 높이 $${c}$인 직육면체의 ${kind === 'volume' ? '부피' : '겉넓이'}를 구하시오.`,
      answer: `${value}`,
      explain: kind === 'volume'
        ? `$${a} \\times ${b} \\times ${c} = ${value}$`
        : `$2 \\times (${a * b} + ${b * c} + ${c * a}) = ${value}$`,
      params: { kind, a, b, c },
    };
  },
};

const pyth = {
  id: 'geometry-pyth', domain: D, rating: 900,
  gen(rng) {
    const t = rng.pick(TRIPLES);
    const k = rng.range(1, 3);
    const a = t[0] * k;
    const b = t[1] * k;
    const c = t[2] * k;
    return {
      text: `직각을 낀 두 변의 길이가 $${a}$, $${b}$인 직각삼각형의 빗변의 길이를 구하시오.`,
      answer: `${c}`,
      explain: `$${a}^2 + ${b}^2 = ${a * a + b * b} = ${c}^2$`,
      params: { a, b },
    };
  },
};

const similar = {
  id: 'geometry-similar', domain: D, rating: 1050,
  gen(rng) {
    const m = rng.range(1, 4);
    const n = rng.range(m + 1, 6);
    const t = rng.range(1, 5);
    const S = m * m * t;
    const big = n * n * t;
    return {
      text: `닮음비가 $${m} : ${n}$인 두 도형 중 작은 도형의 넓이가 $${S}$일 때, 큰 도형의 넓이를 구하시오.`,
      answer: `${big}`,
      explain: `넓이의 비는 닮음비의 제곱인 $${m * m} : ${n * n}$이므로 $${big}$`,
      params: { m, n, S },
    };
  },
};

const circleAngle = {
  id: 'geometry-circle.1', domain: D, rating: 950,
  gen(rng) {
    const inscribed = rng.range(10, 85);
    const central = 2 * inscribed;
    const kind = rng.pick(['central', 'inscribed']);
    if (kind === 'central') {
      return {
        text: `한 원에서 어떤 호에 대한 원주각의 크기가 $${inscribed}^\\circ$일 때, 같은 호에 대한 중심각의 크기는 몇 도인지 구하시오.`,
        answer: `${central}`,
        explain: `중심각은 원주각의 두 배이므로 $${central}$`,
        params: { kind, inscribed, central, r: 0, d: 0 },
      };
    }
    return {
      text: `한 원에서 어떤 호에 대한 중심각의 크기가 $${central}^\\circ$일 때, 같은 호에 대한 원주각의 크기는 몇 도인지 구하시오.`,
      answer: `${inscribed}`,
      explain: `원주각은 중심각의 절반이므로 $${inscribed}$`,
      params: { kind, inscribed, central, r: 0, d: 0 },
    };
  },
};

const tangent = {
  id: 'geometry-circle.2', domain: D, rating: 1150,
  gen(rng) {
    const t = rng.pick(TRIPLES);
    const swap = rng.range(0, 1);
    const r = t[swap];
    const len = t[1 - swap];
    const d = t[2];
    return {
      text: `반지름의 길이가 $${r}$인 원의 중심에서 거리가 $${d}$인 점 $P$에서 이 원에 그은 접선의 길이를 구하시오.`,
      answer: `${len}`,
      explain: `접선은 반지름과 수직이므로 $${d}^2 - ${r}^2 = ${len * len} = ${len}^2$`,
      params: { kind: 'tangent', inscribed: 0, central: 0, r, d },
    };
  },
};

const distSquared = {
  id: 'geometry-dist.1', domain: D, rating: 1200,
  gen(rng) {
    const p = [rng.range(-9, 9), rng.range(-9, 9)];
    const q = [rng.range(-9, 9), rng.range(-9, 9)];
    if (p[0] === q[0] && p[1] === q[1]) q[0] += 3;
    const dx = q[0] - p[0];
    const dy = q[1] - p[1];
    return {
      text: `두 점 $A(${p[0]}, ${p[1]})$, $B(${q[0]}, ${q[1]})$ 사이의 거리를 $d$라 할 때, $d^2$의 값을 구하시오.`,
      answer: `${dx * dx + dy * dy}`,
      explain: `$d^2 = (${dx})^2 + (${dy})^2 = ${dx * dx + dy * dy}$`,
      params: { kind: 'squared', p, q, line: [] },
    };
  },
};

const distLine = {
  id: 'geometry-dist.2', domain: D, rating: 1400,
  gen(rng) {
    const t = rng.pick(TRIPLES);
    const swap = rng.range(0, 1);
    const a = t[swap] * rng.pick([1, -1]);
    const b = t[1 - swap] * rng.pick([1, -1]);
    const c = rng.range(-20, 20);
    const p = [rng.range(-6, 6), rng.range(-6, 6)];
    const value = Math.abs(a * p[0] + b * p[1] + c);
    return {
      text: `점 $P(${p[0]}, ${p[1]})$에서 직선 $${lincomb([a, b, c], ['x', 'y', ''])} = 0$까지의 거리를 구하시오.`,
      answer: frac(value, t[2]),
      explain: `$\\frac{|ax_0 + by_0 + c|}{\\sqrt{a^2 + b^2}}$에서 분자는 $${value}$, 분모는 $${t[2]}$이므로 $${tfrac(value, t[2])}$`,
      params: { kind: 'line', p, q: [], line: [a, b, c] },
    };
  },
};

const vec3 = (rng, lo, hi) => [rng.range(lo, hi), rng.range(lo, hi), rng.range(lo, hi)];

const dot = {
  id: 'geometry-dot.1', domain: D, rating: 1300,
  gen(rng) {
    const u = vec3(rng, -6, 6);
    const v = vec3(rng, -6, 6);
    const value = u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
    return {
      text: `두 벡터 $\\mathbf{a} = (${u.join(', ')})$, $\\mathbf{b} = (${v.join(', ')})$의 내적 $\\mathbf{a} \\cdot \\mathbf{b}$의 값을 구하시오.`,
      answer: `${value}`,
      explain: `성분끼리 곱해 더하면 $${value}$`,
      params: { kind: 'dot', u, v },
    };
  },
};

const cross = {
  id: 'geometry-dot.2', domain: D, rating: 1500,
  gen(rng) {
    const u = vec3(rng, -3, 3);
    const v = vec3(rng, -3, 3);
    const w = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const value = w[0] * w[0] + w[1] * w[1] + w[2] * w[2];
    return {
      text: `두 벡터 $\\mathbf{a} = (${u.join(', ')})$, $\\mathbf{b} = (${v.join(', ')})$에 대하여 $|\\mathbf{a} \\times \\mathbf{b}|^2$의 값을 구하시오.`,
      answer: `${value}`,
      explain: `$\\mathbf{a} \\times \\mathbf{b} = (${w.join(', ')})$이므로 크기의 제곱은 $${value}$`,
      params: { kind: 'cross', u, v },
    };
  },
};

const parabola = {
  id: 'geometry-conic.1', domain: D, rating: 1450,
  gen(rng) {
    const k = rng.range(1, 12) * rng.pick([1, -1]);
    return {
      text: `포물선 $y^2 = ${poly([k, 0], 'x')}$의 초점의 $x$좌표를 구하시오.`,
      answer: frac(k, 4),
      explain: `$y^2 = 4px$에서 $4p = ${k}$이므로 초점은 $(${tfrac(k, 4)}, 0)$`,
      params: { kind: 'parabola', k, a2: 0, b2: 0 },
    };
  },
};

const ellipse = {
  id: 'geometry-conic.2', domain: D, rating: 1600,
  gen(rng) {
    const t = rng.pick(TRIPLES);
    const swap = rng.range(0, 1);
    const big = t[2] * t[2];
    const small = t[swap] * t[swap];
    const c = t[1 - swap];
    const flip = rng.range(0, 1);
    const a2 = flip === 0 ? big : small;
    const b2 = flip === 0 ? small : big;
    return {
      text: `타원 $\\frac{x^2}{${a2}} + \\frac{y^2}{${b2}} = 1$의 두 초점 사이의 거리를 구하시오.`,
      answer: `${2 * c}`,
      explain: `$c^2 = ${big} - ${small} = ${c * c}$이므로 $c = ${c}$, 초점 사이의 거리는 $2c = ${2 * c}$`,
      params: { kind: 'ellipse', k: 0, a2, b2 },
    };
  },
};

const curvatureCircle = {
  id: 'geometry-curvature.1', domain: D, rating: 1750,
  gen(rng) {
    const r = rng.range(2, 12);
    return {
      text: `반지름의 길이가 $${r}$인 원의 곡률을 구하시오.`,
      answer: frac(1, r),
      explain: `원의 곡률은 반지름의 역수이므로 $${tfrac(1, r)}$`,
      params: { kind: 'circle', r, a: 0, c: 0 },
    };
  },
};

const curvatureParabola = {
  id: 'geometry-curvature.2', domain: D, rating: 1900,
  gen(rng) {
    let a = rng.range(-6, 6);
    if (a === 0) a = 1;
    const c = rng.range(-5, 5);
    return {
      text: `곡선 $y = ${poly([a, 0, c], 'x')}$의 $x = 0$에서의 곡률을 구하시오.`,
      answer: `${2 * Math.abs(a)}`,
      explain: `$\\kappa = \\frac{|y''|}{(1 + y'^2)^{3/2}}$에서 $y'(0) = 0$, $y''(0) = ${2 * a}$이므로 $${2 * Math.abs(a)}$`,
      params: { kind: 'parabola', r: 0, a, c },
    };
  },
};

const curvatureSphere = {
  id: 'geometry-curvature.3', domain: D, rating: 2000,
  gen(rng) {
    const r = rng.range(2, 9);
    return {
      text: `반지름의 길이가 $${r}$인 구면의 가우스 곡률을 구하시오.`,
      answer: frac(1, r * r),
      explain: `두 주곡률이 모두 $${tfrac(1, r)}$이므로 가우스 곡률은 그 곱인 $${tfrac(1, r * r)}$`,
      params: { kind: 'sphere', r, a: 0, c: 0 },
    };
  },
};

const eulerPolyhedron = {
  id: 'geometry-euler.1', domain: D, rating: 1700,
  gen(rng) {
    const n = rng.range(3, 12);
    const prism = rng.range(0, 1) === 0;
    const V = prism ? 2 * n : n + 1;
    const E = prism ? 3 * n : 2 * n;
    const F = prism ? n + 2 : n + 1;
    const hide = rng.pick(['V', 'E', 'F']);
    let text;
    let value;
    if (hide === 'V') {
      text = `모서리가 $${E}$개, 면이 $${F}$개인 볼록다면체의 꼭짓점의 개수를 구하시오.`;
      value = V;
    } else if (hide === 'E') {
      text = `꼭짓점이 $${V}$개, 면이 $${F}$개인 볼록다면체의 모서리의 개수를 구하시오.`;
      value = E;
    } else {
      text = `꼭짓점이 $${V}$개, 모서리가 $${E}$개인 볼록다면체의 면의 개수를 구하시오.`;
      value = F;
    }
    return {
      text,
      answer: `${value}`,
      explain: `오일러 공식 $V - E + F = 2$에 대입하면 $${value}$`,
      params: { kind: 'polyhedron', V, E, F, hide, g: 0, b: 0 },
    };
  },
};

const eulerSurface = {
  id: 'geometry-euler.2', domain: D, rating: 1950,
  gen(rng) {
    const g = rng.range(0, 8);
    const b = rng.range(0, 4);
    const chi = 2 - 2 * g - b;
    return {
      text: `종수가 $${g}$이고 경계 성분이 $${b}$개인 콤팩트 가향 곡면의 오일러 지표를 구하시오.`,
      answer: `${chi}`,
      explain: `$\\chi = 2 - 2g - b = 2 - ${2 * g} - ${b} = ${chi}$`,
      params: { kind: 'surface', V: 0, E: 0, F: 0, hide: '', g, b },
    };
  },
};

const projectiveCount = {
  id: 'geometry-projective.1', domain: D, rating: 2000,
  gen(rng) {
    const q = rng.pick([2, 3, 4, 5, 7, 8, 9]);
    const dim = rng.range(1, 3);
    let value = 0;
    for (let i = 0; i <= dim; i++) value += ipow(q, i);
    const space = dim === 1 ? '사영직선' : dim === 2 ? '사영평면' : '3차원 사영공간';
    return {
      text: `원소가 $${q}$개인 유한체 위의 ${space} $PG(${dim}, ${q})$의 점의 개수를 구하시오.`,
      answer: `${value}`,
      explain: `점의 개수는 $\\frac{q^{n+1} - 1}{q - 1} = ${value}$`,
      params: { kind: 'count', q, dim, pts: [] },
    };
  },
};

const crossRatio = {
  id: 'geometry-projective.2', domain: D, rating: 2100,
  gen(rng) {
    const a = rng.range(-5, 0);
    let b = a + rng.range(1, 4);
    let c = b + rng.range(1, 4);
    const d = c + rng.range(1, 4);
    if (rng.range(0, 1) === 1) {
      const t = b;
      b = c;
      c = t;
    }
    const n = (c - a) * (d - b);
    const m = (c - b) * (d - a);
    return {
      text: `수직선 위의 네 점 $A(${a})$, $B(${b})$, $C(${c})$, $D(${d})$에 대하여 복비 $(A, B; C, D) = \\frac{AC \\cdot BD}{BC \\cdot AD}$의 값을 구하시오. (단, 선분의 길이는 부호를 붙여 $XY = y - x$로 계산한다.)`,
      answer: frac(n, m),
      explain: `$\\frac{(${c - a})(${d - b})}{(${c - b})(${d - a})} = ${tfrac(n, m)}$`,
      params: { kind: 'crossratio', q: 0, dim: 0, pts: [a, b, c, d] },
    };
  },
};

const chiSpheres = {
  id: 'geometry-betti.1', domain: D, rating: 2300,
  gen(rng) {
    const m = rng.range(1, 6);
    const n = rng.range(1, 6);
    const chi = (mod(m, 2) === 0 ? 2 : 0) * (mod(n, 2) === 0 ? 2 : 0);
    return {
      text: `곱공간 $S^{${m}} \\times S^{${n}}$의 오일러 지표를 구하시오.`,
      answer: `${chi}`,
      explain: `$\\chi(S^k)$는 $k$가 짝수이면 $2$, 홀수이면 $0$이고 곱공간의 오일러 지표는 곱이므로 $${chi}$`,
      params: { kind: 'spheres', m, n, k: 0 },
    };
  },
};

const chiProjective = {
  id: 'geometry-betti.2', domain: D, rating: 2350,
  gen(rng) {
    const m = rng.range(1, 6);
    const n = rng.range(1, 6);
    return {
      text: `곱공간 $\\mathbb{CP}^{${m}} \\times \\mathbb{CP}^{${n}}$의 오일러 지표를 구하시오.`,
      answer: `${(m + 1) * (n + 1)}`,
      explain: `$\\chi(\\mathbb{CP}^k) = k + 1$이므로 $${m + 1} \\times ${n + 1} = ${(m + 1) * (n + 1)}$`,
      params: { kind: 'cp', m, n, k: 0 },
    };
  },
};

const bettiTorus = {
  id: 'geometry-betti.3', domain: D, rating: 2400,
  gen(rng) {
    const n = rng.range(3, 8);
    const k = rng.range(1, n - 1);
    return {
      text: `$${n}$차원 원환면 $T^{${n}} = (S^1)^{${n}}$의 $${k}$번째 베티 수 $b_{${k}}$의 값을 구하시오.`,
      answer: `${binom(n, k)}`,
      explain: `퀴네트 공식에 의해 $b_k(T^n) = \\binom{n}{k}$이므로 $\\binom{${n}}{${k}} = ${binom(n, k)}$`,
      params: { kind: 'torus', m: 0, n, k },
    };
  },
};

export default [
  rect, triangleArea, angleTriangle, anglePolygon, volume, pyth, similar, circleAngle, tangent,
  distSquared, distLine, dot, cross, parabola, ellipse,
  curvatureCircle, curvatureParabola, curvatureSphere, eulerPolyhedron, eulerSurface,
  projectiveCount, crossRatio, chiSpheres, chiProjective, bettiTorus,
];
