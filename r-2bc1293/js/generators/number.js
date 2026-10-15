// 정수론 템플릿. app/lib/generators/number.dart와 한 줄씩 대응한다.
// 정수 연산만 쓰고 %, / 대신 mod, fdiv를 쓴다.
import {
  frac, tfrac, poly, lincomb, ipow, gcd, lcm, mod, fdiv, modpow,
  factorize, numDivisors, sumDivisors, phi, josa, toBase,
} from '../mathutil.js';

const D = 'number';

const remainder = {
  id: 'number-remainder', domain: D, rating: 500,
  gen(rng) {
    const a = rng.range(20, 99);
    const b = rng.range(3, 9);
    const r = mod(a, b);
    return {
      text: `$${a}$${josa(a, '을')} $${b}$${josa(b, '로')} 나눈 나머지를 구하시오.`,
      answer: `${r}`,
      explain: `$${a} = ${b} \\times ${fdiv(a, b)} + ${r}$`,
      params: { a, b },
    };
  },
};

const gcdT = {
  id: 'number-gcd.1', domain: D, rating: 600,
  gen(rng) {
    const g = rng.range(2, 12);
    const a = g * rng.range(2, 9);
    const b = g * rng.range(2, 9);
    return {
      text: `두 수 $${a}$, $${b}$의 최대공약수를 구하시오.`,
      answer: `${gcd(a, b)}`,
      explain: `두 수를 함께 나누는 가장 큰 수는 $${gcd(a, b)}$`,
      params: { kind: 'gcd', a, b },
    };
  },
};

const lcmT = {
  id: 'number-gcd.2', domain: D, rating: 700,
  gen(rng) {
    const a = rng.range(4, 20);
    let b = rng.range(4, 20);
    if (b === a) b += 1;
    return {
      text: `두 수 $${a}$, $${b}$의 최소공배수를 구하시오.`,
      answer: `${lcm(a, b)}`,
      explain: `최대공약수가 $${gcd(a, b)}$이므로 $${a} \\times ${b} \\div ${gcd(a, b)} = ${lcm(a, b)}$`,
      params: { kind: 'lcm', a, b },
    };
  },
};

const divisors = {
  id: 'number-divisors', domain: D, rating: 650,
  gen(rng) {
    const n = rng.range(12, 100);
    return {
      text: `$${n}$의 약수의 개수를 구하시오.`,
      answer: `${numDivisors(n)}`,
      explain: `약수를 모두 찾으면 $${numDivisors(n)}$개`,
      params: { n },
    };
  },
};

const factorTex = (n) => factorize(n).map((f) => (f[1] === 1 ? `${f[0]}` : `${f[0]}^{${f[1]}}`)).join(' \\times ');

const largestPrime = {
  id: 'number-factor.1', domain: D, rating: 850,
  gen(rng) {
    const n = rng.range(30, 300);
    const f = factorize(n);
    const p = f[f.length - 1][0];
    return {
      text: `$${n}$의 소인수 중 가장 큰 것을 구하시오.`,
      answer: `${p}`,
      explain: `$${n} = ${factorTex(n)}$이므로 가장 큰 소인수는 $${p}$`,
      params: { kind: 'largest', n },
    };
  },
};

const divisorCount = {
  id: 'number-factor.2', domain: D, rating: 1000,
  gen(rng) {
    const n = ipow(2, rng.range(2, 4)) * ipow(3, rng.range(1, 3)) * ipow(5, rng.range(0, 2));
    return {
      text: `$${n}$의 약수의 개수를 구하시오.`,
      answer: `${numDivisors(n)}`,
      explain: `$${n} = ${factorTex(n)}$이고 각 지수에 $1$을 더해 곱하면 $${numDivisors(n)}$`,
      params: { kind: 'count', n },
    };
  },
};

const divsum = {
  id: 'number-divsum', domain: D, rating: 1100,
  gen(rng) {
    const n = rng.range(12, 200);
    return {
      text: `$${n}$의 모든 양의 약수의 합을 구하시오.`,
      answer: `${sumDivisors(n)}`,
      explain: `$${n} = ${factorTex(n)}$이므로 소인수별 거듭제곱의 합을 곱하면 $${sumDivisors(n)}$`,
      params: { n },
    };
  },
};

const baseFrom = {
  id: 'number-base.1', domain: D, rating: 1200,
  gen(rng) {
    const n = rng.range(17, 255);
    const digits = toBase(n, 2);
    return {
      text: `이진법으로 나타낸 수 $${digits}_{(2)}$의 값을 십진법으로 나타내시오.`,
      answer: `${n}`,
      explain: `자리마다 $2$의 거듭제곱을 곱해 더하면 $${n}$`,
      params: { kind: 'from', digits, n, base: 2 },
    };
  },
};

const baseTo = {
  id: 'number-base.2', domain: D, rating: 1250,
  gen(rng) {
    const n = rng.range(20, 200);
    const base = rng.pick([3, 4, 5, 6, 7]);
    const digits = toBase(n, base);
    return {
      text: `십진법의 수 $${n}$${josa(n, '을')} $${base}$진법으로 나타낼 때의 숫자열을 쓰시오. (예: $13_{(5)}$이면 13)`,
      answer: digits,
      explain: `$${base}$${josa(base, '로')} 거듭 나누어 나머지를 거꾸로 읽으면 $${digits}_{(${base})}$`,
      params: { kind: 'to', digits, n, base },
    };
  },
};

const lastDigit = {
  id: 'number-lastdigit.1', domain: D, rating: 1300,
  gen(rng) {
    const a = rng.range(2, 9);
    const n = rng.range(10, 99);
    const r = modpow(a, n, 10);
    return {
      text: `$${a}^{${n}}$의 일의 자리 숫자를 구하시오.`,
      answer: `${r}`,
      explain: `$${a}$의 거듭제곱의 일의 자리는 주기적으로 반복되고, $${n}$번째는 $${r}$`,
      params: { a, n, m: 10 },
    };
  },
};

const powerMod = {
  id: 'number-lastdigit.2', domain: D, rating: 1450,
  gen(rng) {
    let a = rng.range(2, 12);
    const n = rng.range(10, 60);
    const m = rng.pick([7, 11, 13]);
    if (mod(a, m) === 0) a += 1;
    const r = modpow(a, n, m);
    return {
      text: `$${a}^{${n}}$을 $${m}$${josa(m, '로')} 나눈 나머지를 구하시오.`,
      answer: `${r}`,
      explain: `$${a}^{${m - 1}} \\equiv 1 \\pmod{${m}}$을 이용해 지수를 줄이면 $${r}$`,
      params: { a, n, m },
    };
  },
};

const phiT = {
  id: 'number-phi.1', domain: D, rating: 1700,
  gen(rng) {
    const n = rng.range(10, 200);
    return {
      text: `오일러 피 함수의 값 $\\varphi(${n})$${josa(n, '을')} 구하시오.`,
      answer: `${phi(n)}`,
      explain: `$${n} = ${factorTex(n)}$이므로 $\\varphi(${n}) = ${phi(n)}$`,
      params: { kind: 'phi', n, a: 0, k: 0 },
    };
  },
};

const eulerPower = {
  id: 'number-phi.2', domain: D, rating: 1900,
  gen(rng) {
    const n = rng.pick([7, 9, 11, 13, 15, 16, 20, 21]);
    let a = rng.range(2, n - 1);
    while (gcd(a, n) !== 1) a += 1;
    const k = rng.range(100, 999);
    const r = modpow(a, k, n);
    return {
      text: `$${a}^{${k}}$을 $${n}$${josa(n, '로')} 나눈 나머지를 구하시오.`,
      answer: `${r}`,
      explain: `$\\varphi(${n}) = ${phi(n)}$이므로 $${a}^{${phi(n)}} \\equiv 1 \\pmod{${n}}$이고, 지수를 $${phi(n)}$${josa(phi(n), '로')} 나눈 나머지 $${mod(k, phi(n))}$만 남겨 계산하면 $${r}$`,
      params: { kind: 'power', n, a, k },
    };
  },
};

const crtGen = (id, rating, choices) => ({
  id, domain: D, rating,
  gen(rng) {
    const mods = rng.pick(choices);
    const rems = [];
    for (let i = 0; i < mods.length; i++) rems.push(rng.range(0, mods[i] - 1));
    let x = 1;
    for (;;) {
      let ok = true;
      for (let i = 0; i < mods.length; i++) if (mod(x, mods[i]) !== rems[i]) ok = false;
      if (ok) break;
      x += 1;
    }
    const conds = mods.map((m, i) => `x \\equiv ${rems[i]} \\pmod{${m}}`).join('$, $');
    return {
      text: `$${conds}$을 모두 만족하는 가장 작은 자연수 $x$를 구하시오.`,
      answer: `${x}`,
      explain: `법들이 쌍마다 서로소이므로 중국인의 나머지 정리에 의해 해가 법의 곱마다 하나씩 있고, 가장 작은 자연수 해는 $${x}$`,
      params: { mods, rems },
    };
  },
});

const legendre = {
  id: 'number-legendre', domain: D, rating: 1950,
  gen(rng) {
    const p = rng.pick([7, 11, 13, 17, 19, 23, 29, 31]);
    const a = rng.range(2, p - 1);
    const e = modpow(a, fdiv(p - 1, 2), p);
    const value = e === 1 ? 1 : -1;
    return {
      text: `르장드르 기호 $\\left(\\frac{${a}}{${p}}\\right)$의 값을 구하시오.`,
      answer: `${value}`,
      explain: `오일러 판정법으로 $${a}^{${fdiv(p - 1, 2)}} \\equiv ${value} \\pmod{${p}}$`,
      params: { a, p },
    };
  },
};

const dioph = {
  id: 'number-dioph', domain: D, rating: 2000,
  gen(rng) {
    const a = rng.range(2, 7);
    let b = rng.range(2, 7);
    while (gcd(a, b) !== 1) b += 1;
    const c = rng.range(30, 80);
    let count = 0;
    for (let y = 1; b * y < c; y++) if (mod(c - b * y, a) === 0) count += 1;
    return {
      text: `방정식 $${lincomb([a, b], ['x', 'y'])} = ${c}$${josa(c, '을')} 만족하는 양의 정수의 순서쌍 $(x, y)$의 개수를 구하시오.`,
      answer: `${count}`,
      explain: `해 하나를 찾으면 나머지는 $x$가 $${b}$씩, $y$가 $${a}$씩 반대로 변하며, 둘 다 양수인 것은 $${count}$개`,
      params: { a, b, c },
    };
  },
};

const padicAbs = {
  id: 'number-padic.1', domain: D, rating: 2200,
  gen(rng) {
    const p = rng.pick([2, 3, 5, 7]);
    const e1 = rng.range(0, 3);
    const e2 = rng.range(0, 3);
    let u = rng.range(1, 6);
    let w = rng.range(1, 6);
    if (mod(u, p) === 0) u += 1;
    if (mod(w, p) === 0) w += 1;
    const num = ipow(p, e1) * u;
    const den = ipow(p, e2) * w;
    return {
      text: `$${p}$진 절댓값 $\\left|\\frac{${num}}{${den}}\\right|_{${p}}$의 값을 구하시오.`,
      answer: frac(ipow(p, e2), ipow(p, e1)),
      explain: `$v_{${p}}\\left(\\frac{${num}}{${den}}\\right) = ${e1} - ${e2} = ${e1 - e2}$이므로 절댓값은 $${p}^{${e2 - e1}} = ${tfrac(ipow(p, e2), ipow(p, e1))}$`,
      params: { kind: 'abs', p, num, den, n: 0 },
    };
  },
};

const padicFactorial = {
  id: 'number-padic.2', domain: D, rating: 2250,
  gen(rng) {
    const p = rng.pick([2, 3, 5, 7]);
    const n = rng.range(20, 200);
    let v = 0;
    for (let q = p; q <= n; q *= p) v += fdiv(n, q);
    return {
      text: `$${p}$진 값매김 $v_{${p}}(${n}!)$의 값을 구하시오.`,
      answer: `${v}`,
      explain: `르장드르 공식 $\\sum_{i \\ge 1} \\left\\lfloor \\frac{${n}}{${p}^i} \\right\\rfloor = ${v}$`,
      params: { kind: 'factorial', p, num: 0, den: 0, n },
    };
  },
};

const norm = {
  id: 'number-norm', domain: D, rating: 2250,
  gen(rng) {
    const d = rng.pick([2, 3, 5, 7, -1, -2, -5]);
    const a = rng.range(-9, 9);
    let b = rng.range(-9, 9);
    if (b === 0) b = 2;
    const root = `\\sqrt{${d}}`;
    const value = a * a - d * b * b;
    return {
      text: `$\\mathbb{Z}[${root}]$의 원소 $\\alpha = ${lincomb([a, b], ['', root])}$의 노름 $N(\\alpha)$의 값을 구하시오.`,
      answer: `${value}`,
      explain: `$N(a + b${root}) = a^2 - (${d})b^2 = ${value}$`,
      params: { a, b, d },
    };
  },
};

const ec = {
  id: 'number-ec', domain: D, rating: 2500,
  gen(rng) {
    const p = rng.pick([5, 7, 11, 13]);
    const a = rng.range(0, p - 1);
    let b = rng.range(0, p - 1);
    while (mod(4 * a * a * a + 27 * b * b, p) === 0) b = mod(b + 1, p);
    // 점의 개수 = 1 + Σ_x (1 + χ(x³ + ax + b)), χ는 르장드르 기호
    let count = 1;
    for (let x = 0; x < p; x++) {
      const rhs = mod(x * x * x + a * x + b, p);
      if (rhs === 0) count += 1;
      else if (modpow(rhs, fdiv(p - 1, 2), p) === 1) count += 2;
    }
    return {
      text: `유한체 $\\mathbb{F}_{${p}}$ 위의 타원곡선 $E: y^2 = ${poly([1, 0, a, b], 'x')}$의 점의 개수를 무한원점을 포함하여 구하시오.`,
      answer: `${count}`,
      explain: `각 $x$마다 우변이 $0$이면 한 점, $0$이 아닌 제곱잉여이면 두 점이고, 무한원점을 더하면 $${count}$`,
      params: { p, a, b },
    };
  },
};

export default [
  remainder, gcdT, lcmT, divisors, largestPrime, divisorCount, divsum, baseFrom, baseTo,
  lastDigit, powerMod, phiT, eulerPower,
  crtGen('number-crt.1', 1850, [[3, 5], [3, 7], [4, 5], [5, 7], [4, 9], [5, 8], [7, 9]]),
  crtGen('number-crt.2', 2000, [[2, 3, 5], [3, 4, 5], [2, 5, 7], [3, 5, 7], [4, 5, 7], [3, 5, 8]]),
  legendre, dioph, padicAbs, padicFactorial, norm, ec,
];
