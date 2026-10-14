// 논리·기초론 템플릿. app/lib/generators/logic.dart와 한 줄씩 대응한다.
// 정수 연산만 쓰고 %, / 대신 mod, fdiv를 쓴다.
import { ipow, mod, fdiv, fact, binom, josa } from '../mathutil.js';

const D = 'logic';

const truth = {
  id: 'logic-truth', domain: D, rating: 600,
  gen(rng) {
    const n = rng.range(10, 60);
    const k = rng.range(3, 7);
    let m = rng.range(n - 10, n + 10);
    if (m === n) m += 1;
    let count = 0;
    if (mod(n, 2) === 0) count += 1;
    if (mod(n, k) === 0) count += 1;
    if (n > m) count += 1;
    const s = `$${n}$${josa(n, '은')}`;
    return {
      text: `다음 세 문장 중 참인 것의 개수를 구하시오. (가) ${s} 짝수이다. (나) ${s} $${k}$의 배수이다. (다) ${s} $${m}$보다 크다.`,
      answer: `${count}`,
      explain: `세 문장을 하나씩 확인하면 참인 것은 $${count}$개`,
      params: { n, k, m },
    };
  },
};

const setUnion = {
  id: 'logic-set.1', domain: D, rating: 900,
  gen(rng) {
    const nA = rng.range(5, 20);
    const nB = rng.range(5, 20);
    const nAB = rng.range(1, Math.min(nA, nB) - 1);
    const value = nA + nB - nAB;
    return {
      text: `두 집합 $A$, $B$에 대하여 $n(A) = ${nA}$, $n(B) = ${nB}$, $n(A \\cap B) = ${nAB}$일 때, $n(A \\cup B)$의 값을 구하시오.`,
      answer: `${value}`,
      explain: `$n(A \\cup B) = n(A) + n(B) - n(A \\cap B) = ${value}$`,
      params: { kind: 'union', nA, nB, nAB, n: 0 },
    };
  },
};

const powerSet = {
  id: 'logic-set.2', domain: D, rating: 1000,
  gen(rng) {
    const n = rng.range(3, 8);
    return {
      text: `원소가 $${n}$개인 집합의 부분집합의 개수를 구하시오.`,
      answer: `${ipow(2, n)}`,
      explain: `원소마다 넣거나 빼는 두 가지 선택이 있으므로 $2^{${n}} = ${ipow(2, n)}$`,
      params: { kind: 'power', nA: 0, nB: 0, nAB: 0, n },
    };
  },
};

const subsets = {
  id: 'logic-subsets', domain: D, rating: 1250,
  gen(rng) {
    const n = rng.range(5, 9);
    const a = rng.range(1, 2);
    const b = rng.range(0, 2);
    const all = [];
    for (let i = 1; i <= n; i++) all.push(i);
    const include = [];
    for (let i = 1; i <= a; i++) include.push(i);
    const exclude = [];
    for (let i = n - b + 1; i <= n; i++) exclude.push(i);
    const inc = include.map((e) => `$${e}$`).join(', ');
    const exc = exclude.map((e) => `$${e}$`).join(', ');
    const cond = b === 0
      ? `원소 ${inc}${josa(a, '을')} 포함하는`
      : `원소 ${inc}${josa(a, '은')} 포함하고 원소 ${exc}${josa(n, '은')} 포함하지 않는`;
    const value = ipow(2, n - a - b);
    return {
      text: `집합 $A = \\{${all.join(', ')}\\}$의 부분집합 중 ${cond} 것의 개수를 구하시오.`,
      answer: `${value}`,
      explain: `정해지지 않은 원소 $${n - a - b}$개만 자유롭게 고르므로 $2^{${n - a - b}} = ${value}$`,
      params: { n, include, exclude },
    };
  },
};

// [LaTeX, 진리 함수]. 순서는 테스트의 TRUE_ROWS와 맞춘다.
const FORMULAS = [
  ['(p \\land q) \\lor r', (p, q, r) => (p && q) || r],
  ['(p \\lor q) \\land r', (p, q, r) => (p || q) && r],
  ['p \\Rightarrow (q \\land r)', (p, q, r) => !p || (q && r)],
  ['(p \\Rightarrow q) \\land (q \\Rightarrow r)', (p, q, r) => (!p || q) && (!q || r)],
  ['(p \\Leftrightarrow q) \\lor r', (p, q, r) => p === q || r],
  ['\\neg p \\lor (q \\land r)', (p, q, r) => !p || (q && r)],
  ['(p \\land \\neg q) \\lor (q \\land r)', (p, q, r) => (p && !q) || (q && r)],
  ['p \\Leftrightarrow (q \\lor r)', (p, q, r) => p === (q || r)],
];

const truthTable = {
  id: 'logic-truthtable', domain: D, rating: 1500,
  gen(rng) {
    const formula = rng.range(0, FORMULAS.length - 1);
    const want = rng.range(0, 1) === 1;
    const f = FORMULAS[formula];
    let count = 0;
    for (let row = 0; row < 8; row++) {
      const p = fdiv(row, 4) === 1;
      const q = mod(fdiv(row, 2), 2) === 1;
      const r = mod(row, 2) === 1;
      if (f[1](p, q, r) === want) count += 1;
    }
    return {
      text: `명제 $p$, $q$, $r$의 진리값을 정하는 $8$가지 경우 중 명제식 $${f[0]}$의 진리값이 ${want ? '참' : '거짓'}인 경우의 수를 구하시오.`,
      answer: `${count}`,
      explain: `진리표의 $8$행을 모두 확인하면 ${want ? '참' : '거짓'}인 행은 $${count}$개`,
      params: { formula, want },
    };
  },
};

const injections = {
  id: 'logic-functions.1', domain: D, rating: 1750,
  gen(rng) {
    const m = rng.range(2, 4);
    const n = rng.range(m, 6);
    let value = 1;
    for (let i = 0; i < m; i++) value *= n - i;
    return {
      text: `원소가 $${m}$개인 집합 $A$에서 원소가 $${n}$개인 집합 $B$로 가는 단사함수의 개수를 구하시오.`,
      answer: `${value}`,
      explain: `$A$의 원소마다 서로 다른 값을 차례로 고르면 $${value}$`,
      params: { kind: 'injective', m, n },
    };
  },
};

const surjections = {
  id: 'logic-functions.2', domain: D, rating: 1950,
  gen(rng) {
    const m = rng.range(3, 6);
    const n = rng.range(2, m - 1);
    let value = 0;
    for (let j = 0; j <= n; j++) value += (mod(j, 2) === 0 ? 1 : -1) * binom(n, j) * ipow(n - j, m);
    return {
      text: `원소가 $${m}$개인 집합 $A$에서 원소가 $${n}$개인 집합 $B$로 가는 전사함수의 개수를 구하시오.`,
      answer: `${value}`,
      explain: `포함-배제 원리 $\\sum_{j=0}^{${n}} (-1)^j \\binom{${n}}{j} (${n} - j)^{${m}} = ${value}$`,
      params: { kind: 'surjective', m, n },
    };
  },
};

const reflexive = {
  id: 'logic-relations.1', domain: D, rating: 1850,
  gen(rng) {
    const n = rng.range(2, 4);
    const value = ipow(2, n * n - n);
    return {
      text: `원소가 $${n}$개인 집합 위의 반사적 이항관계의 개수를 구하시오.`,
      answer: `${value}`,
      explain: `대각선 쌍 $${n}$개는 반드시 포함하고 나머지 $${n * n - n}$개는 자유이므로 $2^{${n * n - n}} = ${value}$`,
      params: { kind: 'reflexive', n },
    };
  },
};

const symmetric = {
  id: 'logic-relations.2', domain: D, rating: 1900,
  gen(rng) {
    const n = rng.range(2, 4);
    const e = fdiv(n * (n + 1), 2);
    return {
      text: `원소가 $${n}$개인 집합 위의 대칭적 이항관계의 개수를 구하시오.`,
      answer: `${ipow(2, e)}`,
      explain: `대각선 쌍과 순서 없는 쌍을 합친 $${e}$개를 자유롭게 고르므로 $2^{${e}} = ${ipow(2, e)}$`,
      params: { kind: 'symmetric', n },
    };
  },
};

const equivalence = {
  id: 'logic-relations.3', domain: D, rating: 2050,
  gen(rng) {
    const n = rng.range(3, 7);
    // 벨 삼각형
    let row = [1];
    for (let i = 1; i < n; i++) {
      const next = [row[row.length - 1]];
      for (let j = 0; j < row.length; j++) next.push(next[j] + row[j]);
      row = next;
    }
    const value = row[row.length - 1];
    return {
      text: `원소가 $${n}$개인 집합 위의 동치관계의 개수를 구하시오.`,
      answer: `${value}`,
      explain: `동치관계는 집합의 분할과 일대일 대응하므로 벨 수 $B_{${n}} = ${value}$`,
      params: { kind: 'equivalence', n },
    };
  },
};

const godel = {
  id: 'logic-godel', domain: D, rating: 2250,
  gen(rng) {
    const a = rng.range(1, 4);
    const b = rng.range(1, 3);
    const c = rng.range(1, 3);
    const value = ipow(2, a) * ipow(3, b) * ipow(5, c);
    return {
      text: `유한 수열 $(a_1, a_2, a_3)$을 자연수 $2^{a_1} \\cdot 3^{a_2} \\cdot 5^{a_3}$으로 부호화하는 괴델 수 매김에서 수열 $(${a}, ${b}, ${c})$의 괴델 수를 구하시오.`,
      answer: `${value}`,
      explain: `$2^{${a}} \\cdot 3^{${b}} \\cdot 5^{${c}} = ${value}$`,
      params: { a, b, c },
    };
  },
};

export default [
  truth, setUnion, powerSet, subsets, truthTable, injections, surjections,
  reflexive, symmetric, equivalence, godel,
];
