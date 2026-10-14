// 숫자 입력 해석과 채점.

const INT = /^[+-]?\d+$/;
const FRAC = /^([+-]?\d+)\/(\d+)$/;
const DEC = /^[+-]?(\d+\.\d*|\.\d+)$/;

// 정수, a/b, 소수를 실수로 읽는다. 읽을 수 없으면 null.
export function parseAnswer(input) {
  const s = input.replace(/−/g, '-').replace(/\s+/g, '');
  if (INT.test(s) || DEC.test(s)) return Number(s);
  const m = FRAC.exec(s);
  if (m && Number(m[2]) !== 0) return Number(m[1]) / Number(m[2]);
  return null;
}

// 입력이 정답과 같은 값이면 true. 입력을 읽을 수 없으면 null.
export function isCorrect(input, answer) {
  const v = parseAnswer(input);
  if (v === null) return null;
  return Math.abs(v - parseAnswer(answer)) < 1e-9;
}
