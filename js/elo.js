// ELO 계산과 영역·단계 상수.

export const DOMAINS = [
  { id: 'algebra', name: '대수' },
  { id: 'analysis', name: '해석' },
  { id: 'geometry', name: '기하' },
  { id: 'number', name: '정수론' },
  { id: 'discrete', name: '확률·이산' },
  { id: 'logic', name: '논리·기초론' },
  { id: 'misc', name: '기타' },
];

export const LEVELS = [
  { key: 'elementary', name: '초등', rating: 600 },
  { key: 'middle', name: '중등', rating: 1000 },
  { key: 'high', name: '고등', rating: 1400 },
  { key: 'university', name: '대학', rating: 1900 },
  { key: 'graduate', name: '대학원', rating: 2300 },
];

// 보기 4개 중 찍어서 맞힐 확률
export const GUESS_PROOF = 0.25;

const MIN_RATING = 100;

export function expected(player, problem, guess = 0) {
  return guess + (1 - guess) / (1 + 10 ** ((problem - player) / 400));
}

// n은 해당 영역에서 지금까지 푼 문제 수
export function kFactor(n) {
  return n < 20 ? 40 : 24;
}

export function update(player, problem, correct, n, guess = 0) {
  const raw = player + kFactor(n) * ((correct ? 1 : 0) - expected(player, problem, guess));
  const rating = Math.max(MIN_RATING, Math.round(raw));
  return { rating, delta: rating - player };
}
