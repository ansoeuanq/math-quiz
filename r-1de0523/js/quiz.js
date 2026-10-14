// 한 문제의 흐름: 문제 만들기 → 채점 → ELO 갱신과 기록.
import { isCorrect } from './answer.js';
import { GUESS_PROOF, update } from './elo.js';
import { record } from './store.js';
import { generate, isFixed } from './generators/index.js';

// 출제 항목을 풀 수 있는 문제로 만든다. 증명 문항은 proofsById(Map)에서 찾는다.
export function toProblem(item, proofsById, seed) {
  if (item.type === 'numeric') return generate(item.id, seed);
  const p = proofsById.get(item.id);
  return { ...p, type: 'proof', text: p.statement };
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
  const fixed = problem.type === 'proof' || isFixed(problem.id);
  const next = record(state, { id: problem.id, domain: problem.domain, correct, delta, t, fixed });
  return { state: next, delta };
}
