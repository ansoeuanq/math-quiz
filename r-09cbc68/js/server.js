// 문제 ELO 서버와의 연결: 서버 주소(server.json) 읽기, 문제 ELO 받기, 풀이 결과 보내기, 캐시.
// 어느 단계든 실패하면 예외를 내지 않고 캐시나 빈 값을 돌려준다. 빈 값이면 화면은 원래(고정) 문제 ELO를 쓴다.
// 설계: docs/superpowers/specs/2026-10-14-shared-problem-elo-design.md 7장

export const APP_VERSION = '1.5.1';
export const CACHE_KEY = 'mathquiz.ratings.v1';
const NONE = { url: null, ratings: {} };

async function getJson(fetch, url, timeoutMs, init = {}) {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: abort.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// 정수 값만 남긴다(터널 오류 페이지나 낡은 서버의 이상한 값을 걸러 낸다).
function cleanRatings(ratings) {
  if (ratings === null || typeof ratings !== 'object' || Array.isArray(ratings)) return null;
  const out = {};
  for (const [id, r] of Object.entries(ratings)) if (Number.isInteger(r)) out[id] = r;
  return out;
}

function readCache(storage) {
  try {
    const raw = JSON.parse(storage.getItem(CACHE_KEY));
    const ratings = cleanRatings(raw?.ratings);
    if (typeof raw?.url === 'string' && raw.url && ratings) return { url: raw.url, ratings };
  } catch {
    // 망가진 캐시나 쓸 수 없는 저장소는 없는 것으로 본다.
  }
  return NONE;
}

function writeCache(storage, remote) {
  try {
    storage.setItem(CACHE_KEY, JSON.stringify(remote));
  } catch {
    // 저장할 수 없어도 이번 실행에는 받은 값을 쓴다.
  }
}

// 시작할 때 부른다: { url, ratings }. url이 null이면 서버 기능을 끈다.
export async function loadRemote({ fetch, storage, configUrl, timeoutMs = 3000 }) {
  try {
    const config = await getJson(fetch, configUrl, timeoutMs);
    const url = typeof config?.url === 'string' ? config.url.replace(/\/+$/, '') : '';
    if (!url) return NONE;
    const ratings = cleanRatings((await getJson(fetch, `${url}/v1/ratings`, timeoutMs))?.ratings);
    if (!ratings) throw new Error('ratings 형식이 아님');
    const remote = { url, ratings };
    writeCache(storage, remote);
    return remote;
  } catch {
    return readCache(storage);
  }
}

// 채점한 뒤 부른다. 새 문제 ELO, 실패하면 null. 다시 보내지 않는다.
// name과 key는 지금 이름과 그 비밀 키(서버가 이 이름의 결과를 지울 때 확인한다).
export async function postResult({ fetch, url, id, correct, player, name, key, timeoutMs = 3000 }) {
  try {
    const body = await getJson(fetch, `${url}/v1/results`, timeoutMs, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, correct, player, v: APP_VERSION, name, key }),
    });
    return Number.isInteger(body?.r) ? body.r : null;
  } catch {
    return null;
  }
}

// 기록을 지울 때 부른다: 이 키로 보낸 서버 결과를 지운다. 성공하면 true(실패하면 나중에 다시 보낸다).
export async function resetRemote({ fetch, url, key, timeoutMs = 3000 }) {
  try {
    const body = await getJson(fetch, `${url}/v1/reset`, timeoutMs, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key }),
    });
    return Number.isInteger(body?.deleted);
  } catch {
    return false;
  }
}

// 결과를 보내고 받은 새 값을 캐시에도 반영한다.
export function rememberRating(storage, id, r) {
  const cache = readCache(storage);
  if (cache.url) writeCache(storage, { url: cache.url, ratings: { ...cache.ratings, [id]: r } });
}
