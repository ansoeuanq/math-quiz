// 확률·이산 템플릿. app/lib/generators/discrete.dart와 한 줄씩 대응한다.
// 정수 연산만 쓰고 %, / 대신 mod, fdiv를 쓴다.
import { frac, tfrac, poly, pmat, ipow, lcm, mod, fdiv, fact, binom, josa } from '../mathutil.js';

const D = 'discrete';

const SCENES = [
  ['티셔츠', '벌', '바지', '벌', '티셔츠와 바지를 하나씩 골라 입는'],
  ['빵', '종류', '음료', '종류', '빵과 음료를 하나씩 고르는'],
  ['연필', '자루', '공책', '권', '연필과 공책을 하나씩 고르는'],
];

const count = {
  id: 'discrete-count', domain: D, rating: 550,
  gen(rng) {
    const s = rng.pick(SCENES);
    const a = rng.range(2, 7);
    const b = rng.range(2, 7);
    return {
      text: `${s[0]} $${a}$${s[1]}, ${s[2]} $${b}$${s[3]} 중에서 ${s[4]} 방법은 모두 몇 가지인지 구하시오.`,
      answer: `${a * b}`,
      explain: `$${a} \\times ${b} = ${a * b}$`,
      params: { a, b },
    };
  },
};

const mean = {
  id: 'discrete-mean', domain: D, rating: 650,
  gen(rng) {
    const n = rng.range(3, 6);
    const values = [];
    let sum = 0;
    for (let i = 0; i < n; i++) {
      values.push(rng.range(1, 20));
      sum += values[i];
    }
    const fix = mod(n - mod(sum, n), n);
    values[n - 1] += fix;
    sum += fix;
    return {
      text: `다음 수들의 평균을 구하시오: $${values.join(', ')}$`,
      answer: `${fdiv(sum, n)}`,
      explain: `합 $${sum}$${josa(sum, '을')} 개수 $${n}$${josa(n, '로')} 나누면 $${fdiv(sum, n)}$`,
      params: { values },
    };
  },
};

const prob = {
  id: 'discrete-prob', domain: D, rating: 900,
  gen(rng) {
    const r = rng.range(1, 7);
    const b = rng.range(1, 7);
    return {
      text: `빨간 공 $${r}$개와 파란 공 $${b}$개가 들어 있는 주머니에서 공 하나를 꺼낼 때, 빨간 공이 나올 확률을 구하시오.`,
      answer: frac(r, r + b),
      explain: `전체 $${r + b}$개 중 빨간 공이 $${r}$개이므로 $${tfrac(r, r + b)}$`,
      params: { r, b },
    };
  },
};

const dice = {
  id: 'discrete-dice', domain: D, rating: 1100,
  gen(rng) {
    const kind = rng.pick(['eq', 'ge']);
    const s = kind === 'eq' ? rng.range(2, 12) : rng.range(4, 11);
    // 합이 t인 경우의 수는 6 - |t - 7|
    let ways = 0;
    for (let t = s; t <= (kind === 'eq' ? s : 12); t++) ways += 6 - Math.abs(t - 7);
    return {
      text: `주사위 두 개를 동시에 던질 때, 나온 눈의 수의 합이 $${s}$${kind === 'eq' ? '일' : ' 이상일'} 확률을 구하시오.`,
      answer: frac(ways, 36),
      explain: `전체 $36$가지 중 조건을 만족하는 경우가 $${ways}$가지이므로 $${tfrac(ways, 36)}$`,
      params: { kind, s },
    };
  },
};

const perm = {
  id: 'discrete-perm.1', domain: D, rating: 1250,
  gen(rng) {
    const n = rng.range(4, 9);
    const r = rng.range(2, 4);
    let value = 1;
    for (let i = 0; i < r; i++) value *= n - i;
    return {
      text: `서로 다른 $${n}$개에서 $${r}$개를 골라 일렬로 나열하는 방법의 수를 구하시오.`,
      answer: `${value}`,
      explain: `$${n}$부터 하나씩 줄여 가며 $${r}$개를 곱하면 $${value}$`,
      params: { kind: 'perm', n, r },
    };
  },
};

const comb = {
  id: 'discrete-perm.2', domain: D, rating: 1300,
  gen(rng) {
    const n = rng.range(5, 12);
    const r = rng.range(2, n - 2);
    return {
      text: `서로 다른 $${n}$개에서 순서를 생각하지 않고 $${r}$개를 고르는 방법의 수를 구하시오.`,
      answer: `${binom(n, r)}`,
      explain: `$\\binom{${n}}{${r}} = ${binom(n, r)}$`,
      params: { kind: 'comb', n, r },
    };
  },
};

const expectMean = {
  id: 'discrete-expect.1', domain: D, rating: 1400,
  gen(rng) {
    const start = rng.range(0, 2);
    const values = [];
    const weights = [];
    let total = 0;
    let weighted = 0;
    for (let i = 0; i < 4; i++) {
      values.push(start + i);
      weights.push(rng.range(1, 4));
      total += weights[i];
      weighted += values[i] * weights[i];
    }
    const table = values.map((v, i) => `P(X = ${v}) = ${tfrac(weights[i], total)}`).join('$, $');
    return {
      text: `확률변수 $X$의 확률분포가 $${table}$일 때, 기댓값 $E(X)$의 값을 구하시오.`,
      answer: frac(weighted, total),
      explain: `값과 확률을 곱해 모두 더하면 $${tfrac(weighted, total)}$`,
      params: { kind: 'mean', values, weights, n: 0, a: 0, b: 1 },
    };
  },
};

const binomialVar = {
  id: 'discrete-expect.2', domain: D, rating: 1500,
  gen(rng) {
    const n = rng.range(4, 40);
    const b = rng.pick([2, 3, 4, 5]);
    const a = rng.range(1, b - 1);
    return {
      text: `확률변수 $X$가 이항분포 $\\mathrm{B}\\left(${n}, ${tfrac(a, b)}\\right)$를 따를 때, 분산 $V(X)$의 값을 구하시오.`,
      answer: frac(n * a * (b - a), b * b),
      explain: `$V(X) = np(1 - p) = ${n} \\cdot ${tfrac(a, b)} \\cdot ${tfrac(b - a, b)} = ${tfrac(n * a * (b - a), b * b)}$`,
      params: { kind: 'var', values: [], weights: [], n, a, b },
    };
  },
};

const binomCoeff = {
  id: 'discrete-binom', domain: D, rating: 1450,
  gen(rng) {
    let a = rng.range(-3, 3);
    if (a === 0) a = 2;
    const n = rng.range(4, 7);
    const k = rng.range(1, n - 1);
    const value = binom(n, k) * ipow(a, n - k);
    return {
      text: `$(${poly([1, a], 'x')})^{${n}}$의 전개식에서 $${k === 1 ? 'x' : `x^{${k}}`}$의 계수를 구하시오.`,
      answer: `${value}`,
      explain: `$\\binom{${n}}{${k}} \\cdot (${a})^{${n - k}} = ${value}$`,
      params: { a, n, k },
    };
  },
};

const multiples = {
  id: 'discrete-inclexcl.1', domain: D, rating: 1700,
  gen(rng) {
    const N = rng.range(50, 300);
    const pair = rng.pick([[2, 3], [2, 5], [3, 5], [2, 7], [3, 4], [4, 6], [6, 10], [6, 9]]);
    const a = pair[0];
    const b = pair[1];
    const l = lcm(a, b);
    const value = fdiv(N, a) + fdiv(N, b) - fdiv(N, l);
    return {
      text: `$1$부터 $${N}$까지의 자연수 중 $${a}$의 배수이거나 $${b}$의 배수인 것의 개수를 구하시오.`,
      answer: `${value}`,
      explain: `포함-배제 원리로 $${fdiv(N, a)} + ${fdiv(N, b)} - ${fdiv(N, l)} = ${value}$ (공배수는 $${l}$의 배수)`,
      params: { kind: 'multiples', N, a, b, n: 0 },
    };
  },
};

const derange = {
  id: 'discrete-inclexcl.2', domain: D, rating: 1800,
  gen(rng) {
    const n = rng.range(4, 8);
    let prev = 1; // D_0
    let cur = 0; // D_1
    for (let i = 2; i <= n; i++) {
      const next = (i - 1) * (cur + prev);
      prev = cur;
      cur = next;
    }
    return {
      text: `$${n}$명이 각자 모자를 하나씩 벗어 섞은 뒤 다시 하나씩 쓸 때, 아무도 자기 모자를 쓰지 않는 방법의 수를 구하시오.`,
      answer: `${cur}`,
      explain: `교란순열의 수는 $D_n = (n - 1)(D_{n-1} + D_{n-2})$로 구하며 $D_{${n}} = ${cur}$`,
      params: { kind: 'derange', N: 0, a: 1, b: 1, n },
    };
  },
};

const graphEdges = {
  id: 'discrete-graph.1', domain: D, rating: 1700,
  gen(rng) {
    const n = rng.range(5, 7);
    const degrees = [];
    for (let i = 0; i < n; i++) degrees.push(0);
    let edges = 0;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (rng.range(0, 1) === 1 || (i === 0 && j === 1)) {
          degrees[i] += 1;
          degrees[j] += 1;
          edges += 1;
        }
      }
    }
    return {
      text: `꼭짓점이 $${n}$개인 단순 그래프에서 각 꼭짓점의 차수가 $${degrees.join(', ')}$일 때, 변의 개수를 구하시오.`,
      answer: `${edges}`,
      explain: `악수 정리에 의해 차수의 합은 변의 개수의 두 배이므로 $${2 * edges} \\div 2 = ${edges}$`,
      params: { kind: 'edges', degrees, m: 0, n },
    };
  },
};

const treesComplete = {
  id: 'discrete-graph.2', domain: D, rating: 1950,
  gen(rng) {
    const n = rng.range(3, 7);
    return {
      text: `완전그래프 $K_{${n}}$의 신장트리의 개수를 구하시오.`,
      answer: `${ipow(n, n - 2)}`,
      explain: `케일리 공식 $n^{n-2}$에 의해 $${n}^{${n - 2}} = ${ipow(n, n - 2)}$`,
      params: { kind: 'complete', degrees: [], m: 0, n },
    };
  },
};

const treesBipartite = {
  id: 'discrete-graph.3', domain: D, rating: 2100,
  gen(rng) {
    const m = rng.range(2, 4);
    const n = rng.range(2, 4);
    const value = ipow(m, n - 1) * ipow(n, m - 1);
    return {
      text: `완전이분그래프 $K_{${m},${n}}$의 신장트리의 개수를 구하시오.`,
      answer: `${value}`,
      explain: `$K_{m,n}$의 신장트리는 $m^{n-1} n^{m-1}$개이므로 $${m}^{${n - 1}} \\cdot ${n}^{${m - 1}} = ${value}$`,
      params: { kind: 'bipartite', degrees: [], m, n },
    };
  },
};

const markov = {
  id: 'discrete-markov', domain: D, rating: 2000,
  gen(rng) {
    const q = rng.pick([2, 3, 4, 5, 10]);
    const p1 = rng.range(1, q - 1);
    const p2 = rng.range(1, q - 1);
    const which = rng.range(1, 2);
    // 행렬 안의 분수는 한 줄(1/2)로 쓴다: 세로 분수는 앱의 행렬에서 줄이 겹친다.
    const P = pmat([[frac(q - p1, q), frac(p1, q)], [frac(p2, q), frac(q - p2, q)]]);
    const num = which === 1 ? p2 : p1;
    return {
      text: `전이행렬이 $P = ${P}$인 마르코프 연쇄의 정상분포 $\\pi = (\\pi_1, \\pi_2)$에서 $\\pi_${which}$의 값을 구하시오.`,
      answer: frac(num, p1 + p2),
      explain: `$\\pi P = \\pi$에서 $\\pi_1 \\cdot ${tfrac(p1, q)} = \\pi_2 \\cdot ${tfrac(p2, q)}$이고 $\\pi_1 + \\pi_2 = 1$이므로 $\\pi_${which} = ${tfrac(num, p1 + p2)}$`,
      params: { p1, p2, which },
    };
  },
};

const genfunc = {
  id: 'discrete-genfunc', domain: D, rating: 2050,
  gen(rng) {
    const a = rng.range(1, 3);
    const b = rng.range(a + 1, 4);
    const n = rng.range(3, 6);
    const value = fdiv(ipow(b, n + 1) - ipow(a, n + 1), b - a);
    const fa = a === 1 ? '(1 - x)' : `(1 - ${a}x)`;
    return {
      text: `$\\frac{1}{${fa}(1 - ${b}x)}$의 멱급수 전개에서 $x^{${n}}$의 계수를 구하시오.`,
      answer: `${value}`,
      explain: `두 등비급수의 곱이므로 계수는 $\\sum_{i=0}^{${n}} ${a}^{i} \\cdot ${b}^{${n} - i} = ${value}$`,
      params: { a, b, n },
    };
  },
};

const catalan = {
  id: 'discrete-catalan.1', domain: D, rating: 2250,
  gen(rng) {
    const n = rng.range(3, 10);
    const value = fdiv(binom(2 * n, n), n + 1);
    const kind = rng.range(0, 1);
    return {
      text: kind === 0
        ? `여는 괄호와 닫는 괄호 $${n}$쌍으로 만들 수 있는 올바른 괄호열의 개수를 구하시오.`
        : `볼록 $${n + 2}$각형을 서로 만나지 않는 대각선으로 삼각형들로 나누는 방법의 수를 구하시오.`,
      answer: `${value}`,
      explain: `카탈란 수 $C_n = \\frac{1}{n + 1}\\binom{2n}{n}$에서 $C_{${n}} = ${value}$`,
      params: { kind: 'catalan', n, k: 0 },
    };
  },
};

const stirling = {
  id: 'discrete-catalan.2', domain: D, rating: 2350,
  gen(rng) {
    const n = rng.range(4, 8);
    const k = rng.range(2, n - 1);
    // S(n, k) = (1/k!) Σ_j (-1)^j C(k, j) (k - j)^n
    let sum = 0;
    for (let j = 0; j <= k; j++) sum += (mod(j, 2) === 0 ? 1 : -1) * binom(k, j) * ipow(k - j, n);
    const value = fdiv(sum, fact(k));
    return {
      text: `원소가 $${n}$개인 집합을 공집합이 아닌 $${k}$개의 부분집합으로 분할하는 방법의 수 $S(${n}, ${k})$의 값을 구하시오.`,
      answer: `${value}`,
      explain: `제2종 스털링 수의 점화식 $S(n, k) = k\\,S(n - 1, k) + S(n - 1, k - 1)$로 구하면 $${value}$`,
      params: { kind: 'stirling', n, k },
    };
  },
};

const turanGen = (id, rating, rLo, rHi) => ({
  id, domain: D, rating,
  gen(rng) {
    const r = rng.range(rLo, rHi);
    const n = rng.range(r + 3, 30);
    const q = fdiv(n, r);
    const s = mod(n, r);
    // 크기 q+1인 부분이 s개, 크기 q인 부분이 r-s개
    const value = fdiv(n * n - s * (q + 1) * (q + 1) - (r - s) * q * q, 2);
    const forbidden = r === 2 ? '삼각형' : `완전그래프 $K_{${r + 1}}$`;
    return {
      text: `꼭짓점이 $${n}$개이고 ${forbidden}${r === 2 ? '을' : josa(r + 1, '을')} 부분그래프로 포함하지 않는 단순 그래프의 변의 개수의 최댓값을 구하시오.`,
      answer: `${value}`,
      explain: `투란 정리에 의해 꼭짓점을 $${r}$개의 부분으로 최대한 고르게 나눈 완전 다분할 그래프가 최대이며 변은 $${value}$개`,
      params: { n, r },
    };
  },
});

export default [
  count, mean, prob, dice, perm, comb, expectMean, binomialVar, binomCoeff,
  multiples, derange, graphEdges, treesComplete, treesBipartite, markov, genfunc,
  catalan, stirling,
  turanGen('discrete-turan.1', 2300, 2, 2),
  turanGen('discrete-turan.2', 2450, 3, 5),
];
