// 출제: 내 ELO에 맞는 문제 고르기.
import { DOMAINS } from './elo.js';

const WINDOW = 150;
const NEAREST = 5;

// 계산형 템플릿과 증명 문항을 { id, domain, rating, type } 목록으로 합친다.
export function buildPool(templates, proofs) {
  const item = (type) => ({ id, domain, rating }) => ({ id, domain, rating, type });
  return [...templates.map(item('numeric')), ...proofs.map(item('proof'))];
}

// "전체"로 풀 때 쓸 영역을 문제가 있는 영역 중에서 고른다.
export function pickDomain(pool, rnd) {
  const present = DOMAINS.map((d) => d.id).filter((id) => pool.some((p) => p.domain === id));
  return present[Math.floor(rnd() * present.length)];
}

// 영역 안에서 ELO ±150인 문제를 고르고 최근 문제는 뺀다.
// 그런 문제가 없으면 ELO 차이가 가장 작은 5개에서 고른다.
export function pickProblem(pool, domain, rating, recent, rnd) {
  const inDomain = pool.filter((p) => p.domain === domain);
  const fresh = inDomain.filter((p) => !recent.includes(p.id));
  const gap = (p) => Math.abs(p.rating - rating);
  let candidates = fresh.filter((p) => gap(p) <= WINDOW);
  if (candidates.length === 0) {
    const base = fresh.length > 0 ? fresh : inDomain;
    candidates = base
      .map((p, i) => ({ p, i }))
      .sort((a, b) => gap(a.p) - gap(b.p) || a.i - b.i)
      .slice(0, NEAREST)
      .map((x) => x.p);
  }
  return candidates[Math.floor(rnd() * candidates.length)];
}
