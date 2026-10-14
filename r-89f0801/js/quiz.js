// 한 문제의 흐름: 문제 만들기 → 채점 → ELO 갱신과 기록.
import { isCorrect } from './answer.js';
import { GUESS_PROOF, MIN_RATING, update } from './elo.js';
import { record } from './store.js';
import { generate } from './generators/index.js';

// 출제 항목을 풀 수 있는 문제로 만든다. 증명 문항은 proofsById(Map)에서 찾는다.
// 문제 ELO는 출제 항목의 값(풀이로 바뀐 값일 수 있다)을 쓴다.
export function toProblem(item, proofsById, seed) {
  if (item.type === 'numeric') return { ...generate(item.id, seed), rating: item.rating };
  const p = proofsById.get(item.id);
  return { ...p, type: 'proof', text: p.statement, rating: item.rating };
}

// 계산형: 입력 문자열을 값으로 비교(읽을 수 없으면 null). 증명형: 섞기 전 보기 번호를 비교.
export function grade(problem, input) {
  if (problem.type === 'numeric') return isCorrect(input, problem.answer);
  return input === problem.answer;
}

export function applyAnswer(state, problem, correct, t) {
  const { r, n } = state.ratings[problem.domain];
  const guess = problem.type === 'proof' ? GUESS_PROOF : 0;
  const { delta } = update(r, problem.rating, correct, n, guess);
  // 문제도 레이팅을 주고받는다: 내가 얻은 만큼 문제가 잃고, 내가 잃은 만큼 문제가 얻는다.
  const rating = Math.max(MIN_RATING, problem.rating - delta);
  const next = record(state, { id: problem.id, domain: problem.domain, correct, delta, t, rating });
  return { state: next, delta };
}
