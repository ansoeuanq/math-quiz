// 수학 올림피아드 템플릿: 직접 만든 경시 유형 10개와 국제수학올림피아드(IMO) 기출 5개.
// app/lib/generators/olympiad.dart와 한 줄씩 대응한다. 정수 연산만 쓰고 %, / 대신 mod, fdiv를 쓴다.
import { frac, tfrac, fdiv, mod, ipow, numDivisors } from '../mathutil.js';

const D = 'olympiad';

const digitsum = {
  id: 'olympiad-digitsum', domain: D, rating: 1100,
  gen(rng) {
    const s = rng.range(3, 12);
    let count = 0;
    for (let n = 1; n <= 999; n++) {
      if (fdiv(n, 100) + mod(fdiv(n, 10), 10) + mod(n, 10) === s) count++;
    }
    const over = s >= 10 ? ` 중 한 자리가 $10$ 이상인 $3\\binom{${s - 8}}{2}$개를 빼면` : '이므로';
    return {
      text: `$1$ 이상 $999$ 이하의 자연수 중 각 자리 숫자의 합이 $${s}$인 것의 개수를 구하시오.`,
      answer: `${count}`,
      explain: `세 자리 숫자를 $a, b, c$라 하면 $a + b + c = ${s}$의 음이 아닌 정수해 $\\binom{${s + 2}}{2}$개${over} $${count}$`,
      params: { s },
    };
  },
};

const pairsum = {
  id: 'olympiad-pairsum', domain: D, rating: 1200,
  gen(rng) {
    const n = rng.range(5, 30);
    const N = 2 * n;
    return {
      text: `$1$부터 $${N}$까지의 자연수 중에서 몇 개를 고른다. 어떻게 고르더라도 합이 $${N + 1}$인 두 수가 반드시 들어 있도록 하려면 최소 몇 개를 골라야 하는지 구하시오.`,
      answer: `${n + 1}`,
      explain: `합이 $${N + 1}$인 짝 $(1, ${N}), (2, ${N - 1}), \\ldots$은 $${n}$개이다. $${n + 1}$개를 고르면 비둘기집 원리로 한 짝이 모두 들어가고, $1$부터 $${n}$까지 $${n}$개만 고르면 그런 두 수가 없다.`,
      params: { n },
    };
  },
};

const unitfrac = {
  id: 'olympiad-unitfrac', domain: D, rating: 1300,
  gen(rng) {
    const n = rng.pick([4, 6, 8, 9, 10, 12, 14, 15, 18, 20]);
    const count = numDivisors(n * n);
    return {
      text: `$\\frac{1}{x} + \\frac{1}{y} = \\frac{1}{${n}}$을 만족하는 양의 정수의 순서쌍 $(x, y)$의 개수를 구하시오.`,
      answer: `${count}`,
      explain: `식을 정리하면 $(x - ${n})(y - ${n}) = ${n * n}$이고 $x, y > ${n}$이므로, $${n * n}$의 양의 약수의 개수인 $${count}$`,
      params: { n },
    };
  },
};

const telescope = {
  id: 'olympiad-telescope', domain: D, rating: 1400,
  gen(rng) {
    const n = rng.range(3, 20);
    const num = n * (3 * n + 5);
    const den = 4 * (n + 1) * (n + 2);
    return {
      text: `$\\frac{1}{1 \\cdot 3} + \\frac{1}{2 \\cdot 4} + \\frac{1}{3 \\cdot 5} + \\cdots + \\frac{1}{${n} \\cdot ${n + 2}}$의 값을 구하시오.`,
      answer: frac(num, den),
      explain: `$\\frac{1}{k(k+2)} = \\frac{1}{2}\\left(\\frac{1}{k} - \\frac{1}{k+2}\\right)$이므로 합은 $\\frac{1}{2}\\left(1 + \\frac{1}{2} - \\frac{1}{${n + 1}} - \\frac{1}{${n + 2}}\\right) = ${tfrac(num, den)}$`,
      params: { n },
    };
  },
};

const funceq = {
  id: 'olympiad-funceq', domain: D, rating: 1500,
  gen(rng) {
    const a = rng.range(1, 9);
    const N = rng.range(10, 40);
    const value = a * N + fdiv(N * (N - 1), 2);
    return {
      text: `모든 자연수 $m$, $n$에 대하여 $f(m + n) = f(m) + f(n) + mn$이고 $f(1) = ${a}$인 함수 $f$에 대하여 $f(${N})$의 값을 구하시오.`,
      answer: `${value}`,
      explain: `$f(n + 1) = f(n) + ${a} + n$을 거듭 쓰면 $f(n) = ${a}n + \\frac{n(n-1)}{2}$이므로 $f(${N}) = ${value}$`,
      params: { a, N },
    };
  },
};

const amgm = {
  id: 'olympiad-amgm', domain: D, rating: 1600,
  gen(rng) {
    const a = rng.range(1, 6);
    const b = rng.range(1, 6);
    const k = a * a;
    const m = b * b;
    const kx = k === 1 ? 'x' : `${k}x`;
    return {
      text: `$x > 0$일 때 $${kx} + \\frac{${m}}{x}$의 최솟값을 구하시오.`,
      answer: `${2 * a * b}`,
      explain: `산술-기하 평균 부등식에 의해 $${kx} + \\frac{${m}}{x} \\ge 2\\sqrt{${k * m}} = ${2 * a * b}$이고, 등호는 $x = ${tfrac(b, a)}$일 때 성립한다.`,
      params: { k, m },
    };
  },
};

const noconsec = {
  id: 'olympiad-noconsec', domain: D, rating: 1700,
  gen(rng) {
    const n = rng.range(6, 16);
    let prev = 2;
    let cur = 3;
    for (let i = 2; i < n; i++) [prev, cur] = [cur, prev + cur];
    return {
      text: `집합 $\\{1, 2, \\ldots, ${n}\\}$의 부분집합 중 연속한 두 정수를 함께 포함하지 않는 것의 개수를 구하시오. (공집합도 센다.)`,
      answer: `${cur}`,
      explain: `원소가 $n$개일 때의 개수를 $a_n$이라 하면, $n$을 포함하지 않는 경우와 포함하는 경우로 나누어 $a_n = a_{n-1} + a_{n-2}$ ($a_1 = 2$, $a_2 = 3$)이므로 $a_{${n}} = ${cur}$`,
      params: { n },
    };
  },
};

const imo1962 = {
  id: 'olympiad-imo1962', domain: D, rating: 1700,
  gen() {
    return {
      text: '(IMO 1962 1번) 일의 자리 숫자가 $6$이고, 이 $6$을 지워 맨 앞자리로 옮기면 원래 수의 $4$배가 되는 가장 작은 자연수를 구하시오.',
      answer: '153846',
      explain: '원래 수를 $10a + 6$ ($a$는 $k$자리)이라 하면 $6 \\cdot 10^k + a = 4(10a + 6)$에서 $13a = 2(10^k - 4)$이다. $10^k \\equiv 4 \\pmod{13}$인 가장 작은 $k$는 $5$이고 이때 $a = 15384$이다.',
      params: {},
    };
  },
};

const takeaway = {
  id: 'olympiad-takeaway', domain: D, rating: 1800,
  gen(rng) {
    const k = rng.range(2, 6);
    const N = rng.range(20, 99);
    const lose = fdiv(N, k + 1);
    return {
      text: `돌 $n$개가 놓여 있고 두 사람이 번갈아 $1$개 이상 $${k}$개 이하의 돌을 가져간다. 마지막 돌을 가져가는 사람이 이긴다. $1 \\le n \\le ${N}$인 자연수 $n$ 중 먼저 하는 사람이 반드시 이길 수 있는 것의 개수를 구하시오.`,
      answer: `${N - lose}`,
      explain: `$n$이 $${k + 1}$의 배수이면 상대가 가져간 개수와 합쳐 $${k + 1}$개가 되도록 받아치는 나중 사람이 이기고, 아니면 먼저 하는 사람이 $${k + 1}$의 배수를 남겨 이긴다. $${N}$ 이하의 $${k + 1}$의 배수는 $${lose}$개이므로 $${N} - ${lose} = ${N - lose}$`,
      params: { k, N },
    };
  },
};

const lte = {
  id: 'olympiad-lte', domain: D, rating: 2000,
  gen(rng) {
    const a = rng.range(1, 5);
    const m = rng.pick([1, 3, 5, 7]);
    const n = ipow(2, a) * m;
    return {
      text: `$3^{${n}} - 1$이 $2^k$으로 나누어떨어지도록 하는 자연수 $k$의 최댓값을 구하시오.`,
      answer: `${a + 2}`,
      explain: `$n$이 짝수일 때 지수 올림 보조정리(LTE)에 의해 $v_2(3^n - 1) = v_2(3 - 1) + v_2(3 + 1) + v_2(n) - 1 = v_2(n) + 2$이고, $v_2(${n}) = ${a}$이므로 $${a + 2}$`,
      params: { n },
    };
  },
};

const imo1978 = {
  id: 'olympiad-imo1978', domain: D, rating: 2100,
  gen() {
    return {
      text: '(IMO 1978 1번) 자연수 $m$, $n$ ($1 \\le m < n$)에 대하여 $1978^m$과 $1978^n$의 마지막 세 자리가 같다. $m + n$의 최솟값을 구하시오.',
      answer: '106',
      explain: '$1978^m(1978^{n-m} - 1)$이 $1000 = 8 \\cdot 125$의 배수여야 한다. 괄호 안은 홀수이므로 $8 \\mid 1978^m$에서 $m \\ge 3$이고, 법 $125$에서 $1978$의 위수가 $100$이므로 $n - m$은 $100$의 배수이다. 따라서 $m = 3$, $n = 103$일 때 최소이다.',
      params: {},
    };
  },
};

const sumsq = {
  id: 'olympiad-sumsq', domain: D, rating: 2200,
  gen(rng) {
    const p = rng.pick([5, 7, 11, 13, 17, 19, 23, 29, 31, 37]);
    const one = mod(p, 4) === 1;
    return {
      text: `$0 \\le x, y < ${p}$인 정수의 순서쌍 $(x, y)$ 중 $x^2 + y^2$이 $${p}$의 배수인 것의 개수를 구하시오.`,
      answer: `${one ? 2 * p - 1 : 1}`,
      explain: one
        ? `$${p} \\equiv 1 \\pmod 4$이므로 $-1$은 법 $${p}$에서 이차잉여이다. $y \\neq 0$마다 $x^2 \\equiv -y^2$의 해가 $2$개이고 $y = 0$이면 $x = 0$뿐이므로 $2(${p} - 1) + 1 = ${2 * p - 1}$`
        : `$${p} \\equiv 3 \\pmod 4$이므로 $-1$은 법 $${p}$에서 이차비잉여이다. $y \\neq 0$이면 $(x/y)^2 \\equiv -1$이 되어 해가 없으므로 $(0, 0)$ 하나뿐이다.`,
      params: { p },
    };
  },
};

const imo1975 = {
  id: 'olympiad-imo1975', domain: D, rating: 2200,
  gen() {
    return {
      text: '(IMO 1975 4번) $4444^{4444}$을 십진법으로 쓴 수의 각 자리 숫자의 합을 $A$, $A$의 각 자리 숫자의 합을 $B$라 할 때, $B$의 각 자리 숫자의 합을 구하시오.',
      answer: '7',
      explain: '$4444^{4444} < 10^{17776}$이므로 $A \\le 9 \\cdot 17776 = 159984$, $B \\le 1 + 9 \\cdot 5 = 46$이고 $B$의 자릿수 합은 $12$ 이하이다. 자릿수 합은 법 $9$에서 원래 수와 합동이고 $4444^{4444} \\equiv 7^{4444} \\equiv 7 \\pmod 9$이므로 답은 $7$이다.',
      params: {},
    };
  },
};

const imo1981 = {
  id: 'olympiad-imo1981', domain: D, rating: 2300,
  gen() {
    return {
      text: '(IMO 1981 3번) $m$, $n$이 $1$ 이상 $1981$ 이하의 정수이고 $(n^2 - mn - m^2)^2 = 1$을 만족할 때, $m^2 + n^2$의 최댓값을 구하시오.',
      answer: '3524578',
      explain: '$(m, n)$이 해이고 $m < n$이면 $(n - m, m)$도 해이므로, 거슬러 내려가면 해는 이웃한 피보나치 수의 쌍이다. $1981$ 이하에서 가장 큰 쌍은 $(987, 1597)$이므로 $987^2 + 1597^2 = 3524578$',
      params: {},
    };
  },
};

const imo1977 = {
  id: 'olympiad-imo1977', domain: D, rating: 2500,
  gen() {
    return {
      text: '(IMO 1977 2번) 실수로 이루어진 유한 수열에서 연속한 $7$개 항의 합은 항상 음수이고 연속한 $11$개 항의 합은 항상 양수이다. 이 수열의 항의 개수의 최댓값을 구하시오.',
      answer: '16',
      explain: '$17$항이면 $a_{i+j-1}$을 $i$행 $j$열에 놓은 $11 \\times 7$ 배열에서 행의 합은 모두 음수, 열의 합은 모두 양수여서 전체 합이 모순이다. $16$항은 $5, 5, -13, 5, 5, 5, -13, 5, 5, -13, 5, 5, 5, -13, 5, 5$로 가능하다.',
      params: {},
    };
  },
};

export default [
  digitsum, pairsum, unitfrac, telescope, funceq, amgm, noconsec, imo1962,
  takeaway, lte, imo1978, sumsq, imo1975, imo1981, imo1977,
];
