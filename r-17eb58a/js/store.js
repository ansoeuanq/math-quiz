// 풀이 상태(영역별 ELO, 최근 문제, 기록)의 생성·읽기·쓰기. 화면과 저장소에 의존하지 않는다.
import { DOMAINS, LEVELS } from './elo.js';

export const STORAGE_KEY = 'mathquiz.v1';
const MAX_HISTORY = 200;
const MAX_RECENT = 5;

const levelRating = (levelKey) => LEVELS.find((l) => l.key === levelKey)?.rating;

// share는 결과 보내기 설정. 기록을 지우고 다시 시작할 때 끈 설정을 이어받는다.
export function newState(levelKey, share = true) {
  const r = levelRating(levelKey);
  const ratings = {};
  for (const d of DOMAINS) ratings[d.id] = { r, n: 0 };
  // seen: 이미 푼, 내용이 고정된 문제(증명 빈칸·IMO 기출)의 id. 다시 내지 않는다.
  // share: 풀이 결과를 서버로 보낼지(기본 켬, 홈에서 끈다).
  return { version: 1, level: levelKey, ratings, recent: [], history: [], seen: [], share };
}

// 저장값이 없거나 읽을 수 없으면 null. 빠진 영역은 저장된 단계의 초기 ELO로 채운다.
export function load(storage) {
  let raw;
  try {
    raw = JSON.parse(storage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
  return parseState(raw);
}

// 이미 JSON에서 읽은 상태 객체를 확인해 상태로 만든다. 읽을 수 없으면 null(이름 목록의 각 상태에도 쓴다).
export function parseState(raw) {
  if (raw === null || typeof raw !== 'object' || raw.version !== 1 || levelRating(raw.level) === undefined) return null;
  const state = newState(raw.level);
  for (const d of DOMAINS) {
    const saved = raw.ratings?.[d.id];
    if (Number.isFinite(saved?.r) && Number.isInteger(saved?.n)) state.ratings[d.id] = { r: saved.r, n: saved.n };
  }
  if (Array.isArray(raw.recent)) state.recent = raw.recent.slice(-MAX_RECENT);
  state.share = raw.share !== false;
  if (Array.isArray(raw.seen)) state.seen = raw.seen.filter((id) => typeof id === 'string');
  if (Array.isArray(raw.history)) state.history = raw.history.slice(-MAX_HISTORY);
  return state;
}

// 저장에 실패해도(사생활 보호 모드 등) 예외를 내지 않고 false를 돌려준다.
export function save(storage, state) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

// 한 문제의 결과를 반영한 새 상태를 돌려준다. fixed는 내용이 고정된 문제인지(그러면 seen에 남긴다).
export function record(state, { id, domain, correct, delta, t, fixed = false }) {
  const { r, n } = state.ratings[domain];
  return {
    ...state,
    ratings: { ...state.ratings, [domain]: { r: r + delta, n: n + 1 } },
    recent: [...state.recent, id].slice(-MAX_RECENT),
    history: [...state.history, { t, id, domain, correct, delta }].slice(-MAX_HISTORY),
    seen: fixed && !state.seen.includes(id) ? [...state.seen, id] : state.seen,
  };
}

// 한 문제 이상 푼 영역의 평균 ELO. 없으면 null.
export function overall(state) {
  const played = Object.values(state.ratings).filter((x) => x.n >= 1);
  if (played.length === 0) return null;
  return Math.round(played.reduce((s, x) => s + x.r, 0) / played.length);
}
