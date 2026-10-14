// 생성기가 쓰는 정수 보조 함수. app/lib/mathutil.dart에 같은 이름으로 있다.
// JS와 Dart의 %, / 결과가 음수에서 다르므로 생성기는 mod, fdiv만 쓴다.

export function mod(a, m) {
  const r = a % m;
  return r < 0 ? r + m : r;
}

export function fdiv(a, b) {
  return Math.floor(a / b);
}

export function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    const t = a % b;
    a = b;
    b = t;
  }
  return a;
}

export function lcm(a, b) {
  return Math.abs(a * b) / gcd(a, b);
}

export function modpow(b, e, m) {
  let result = 1;
  b = mod(b, m);
  while (e > 0) {
    if (e % 2 === 1) result = (result * b) % m;
    b = (b * b) % m;
    e = fdiv(e, 2);
  }
  return result;
}

export function fact(n) {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

export function binom(n, k) {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return r;
}

// 기약분수 문자열. 분모가 1이면 정수, 부호는 분자에 둔다.
export function frac(n, d) {
  if (d === 0) throw new Error('분모가 0');
  if (d < 0) {
    n = -n;
    d = -d;
  }
  const g = gcd(n, d);
  if (g === 0) return '0';
  n /= g;
  d /= g;
  return d === 1 ? `${n}` : `${n}/${d}`;
}

// frac과 같은 값을 LaTeX로. 예: -\frac{3}{4}
export function tfrac(n, d) {
  const s = frac(n, d);
  const i = s.indexOf('/');
  if (i < 0) return s;
  const neg = s.startsWith('-');
  return `${neg ? '-' : ''}\\frac{${s.slice(neg ? 1 : 0, i)}}{${s.slice(i + 1)}}`;
}

// 수 n 뒤에 붙일 조사. kind는 '을' | '은' | '이' | '과' | '로'.
// 끝자리 읽기의 받침: 0(십·백·천·영) 1(일) 3(삼) 6(육) 7(칠) 8(팔)은 받침 있음, 1·7·8은 ㄹ받침.
export function josa(n, kind) {
  const last = mod(Math.abs(n), 10);
  const batchim = last === 0 || last === 1 || last === 3 || last === 6 || last === 7 || last === 8;
  if (kind === '로') return batchim && last !== 1 && last !== 7 && last !== 8 ? '으로' : '로';
  if (kind === '을') return batchim ? '을' : '를';
  if (kind === '은') return batchim ? '은' : '는';
  if (kind === '이') return batchim ? '이' : '가';
  return batchim ? '과' : '와';
}

// 0 이상의 정수 n을 b진법 숫자열로 (b ≤ 10)
export function toBase(n, b) {
  if (n === 0) return '0';
  let out = '';
  while (n > 0) {
    out = `${mod(n, b)}${out}`;
    n = fdiv(n, b);
  }
  return out;
}

export function ipow(b, e) {
  let r = 1;
  for (let i = 0; i < e; i++) r *= b;
  return r;
}

// 음수만 괄호로 감싼다.
export function paren(n) {
  return n < 0 ? `(${n})` : `${n}`;
}

// 계수와 문자 목록으로 일차 결합을 만든다. 문자가 ''이면 상수항. 예: [2, -3], ['x', 'y'] → 2x - 3y
export function lincomb(coeffs, vars) {
  let out = '';
  for (let i = 0; i < coeffs.length; i++) {
    const c = coeffs[i];
    if (c === 0) continue;
    const a = Math.abs(c);
    const term = (vars[i] === '' || a !== 1 ? `${a}` : '') + vars[i];
    if (out === '') out = (c < 0 ? '-' : '') + term;
    else out += (c < 0 ? ' - ' : ' + ') + term;
  }
  return out === '' ? '0' : out;
}

export function pmat(rows) {
  return `\\begin{pmatrix} ${rows.map((r) => r.join(' & ')).join(' \\\\ ')} \\end{pmatrix}`;
}

// [[소수, 지수], ...] 오름차순
export function factorize(n) {
  const out = [];
  for (let p = 2; p * p <= n; p++) {
    if (n % p !== 0) continue;
    let e = 0;
    while (n % p === 0) {
      n = fdiv(n, p);
      e++;
    }
    out.push([p, e]);
  }
  if (n > 1) out.push([n, 1]);
  return out;
}

export function numDivisors(n) {
  let r = 1;
  for (const [, e] of factorize(n)) r *= e + 1;
  return r;
}

export function sumDivisors(n) {
  let r = 1;
  for (const [p, e] of factorize(n)) r *= fdiv(ipow(p, e + 1) - 1, p - 1);
  return r;
}

export function phi(n) {
  let r = n;
  for (const [p] of factorize(n)) r = fdiv(r, p) * (p - 1);
  return r;
}

export function isPrime(n) {
  if (n < 2) return false;
  for (let p = 2; p * p <= n; p++) if (n % p === 0) return false;
  return true;
}

// 최고차항부터 준 계수로 LaTeX 다항식을 만든다. 예: [1, -3, 0, 2] → x^3 - 3x^2 + 2
export function poly(coeffs, v) {
  const n = coeffs.length - 1;
  let out = '';
  for (let i = 0; i <= n; i++) {
    const c = coeffs[i];
    if (c === 0) continue;
    const deg = n - i;
    const a = Math.abs(c);
    let term = deg === 0 ? `${a}` : a === 1 ? '' : `${a}`;
    if (deg === 1) term += v;
    if (deg > 1) term += `${v}^${deg}`;
    if (out === '') out = (c < 0 ? '-' : '') + term;
    else out += (c < 0 ? ' - ' : ' + ') + term;
  }
  return out === '' ? '0' : out;
}
