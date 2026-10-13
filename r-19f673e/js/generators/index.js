import { makeRng } from '../rng.js';
import algebra from './algebra.js';
import analysis from './analysis.js';
import geometry from './geometry.js';
import number from './number.js';
import discrete from './discrete.js';
import logic from './logic.js';
import olympiad from './olympiad.js';
import misc from './misc.js';

export const TEMPLATES = [...algebra, ...analysis, ...geometry, ...number, ...discrete, ...logic, ...olympiad, ...misc];

const byId = new Map(TEMPLATES.map((t) => [t.id, t]));

// 같은 id와 시드는 항상 같은 문제를 만든다(Dart 구현과도 같다).
export function generate(id, seed) {
  const t = byId.get(id);
  if (!t) throw new Error(`모르는 템플릿: ${id}`);
  const { text, answer, explain } = t.gen(makeRng(seed));
  return { id: t.id, domain: t.domain, type: 'numeric', rating: t.rating, text, answer, explain };
}
