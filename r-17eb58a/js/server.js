// 문제 ELO 서버와의 연결: 서버 주소(server.json) 읽기, 문제 ELO 받기, 풀이 결과 보내기, 캐시.
// 어느 단계든 실패하면 예외를 내지 않고 캐시나 빈 값을 돌려준다. 빈 값이면 화면은 원래(고정) 문제 ELO를 쓴다.
// 설계: docs/superpowers/specs/2026-10-14-shared-problem-elo-design.md 7장

export const APP_VERSION = '1.6.1';
export const CACHE_KEY = 'mathquiz.ratings.v1';
const NONE = { url: null, ratings: {} };
const HEADERS = { 'content-type': 'application/json', 'x-app-version': APP_VERSION };

// 업데이트 잠금: 서버가 503 { lock: 'maintenance' }(업데이트 중)이나 426 { lock: 'update' }(새 버전 필요)로 답하면 알린다.
// 처리기를 달기 전에 온 잠금은 기억했다가 달 때 바로 알린다.
let lockHandler = null;
let lastLock = null;
export function onLock(fn) {
  lockHandler = fn;
  if (lastLock) fn(lastLock);
}
function noteLock(body) {
  if (body?.lock !== 'maintenance' && body?.lock !== 'update') return;
  lastLock = body.lock;
  lockHandler?.(body.lock);
}

// 암호를 보내므로 https 서버만 쓴다.
const secure = (url) => typeof url === 'string' && url.startsWith('https://');

async function getJson(fetch, url, timeoutMs, init = {}) {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: HEADERS, ...init, signal: abort.signal });
    if (!res.ok) {
      noteLock(await res.json().catch(() => null));
      throw new Error(`HTTP ${res.status}`);
    }
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
    if (secure(raw?.url) && ratings) return { url: raw.url, ratings };
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
    if (!secure(url)) return NONE;
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
      headers: HEADERS,
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
      headers: HEADERS,
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

// ── 이름 계정 (설계: docs/superpowers/specs/2026-10-15-name-accounts-design.md 5장) ──

// 응답 코드와 JSON 본문(읽지 못하면 null). 연결 실패·시간 초과는 예외.
async function request(fetch, url, timeoutMs, method, body) {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method, headers: HEADERS, body: JSON.stringify(body), signal: abort.signal });
    let json = null;
    try {
      json = await res.json();
    } catch {
      // 오류 페이지 등
    }
    noteLock(json);
    return { status: res.status, body: json };
  } finally {
    clearTimeout(timer);
  }
}

// 새 이름 등록. { ok: true, name } | { error: 'taken' } | { error: 'offline' }(서버 없음·그 밖의 실패)
export async function registerRemote({ fetch, url, name, password, key, state, timeoutMs = 3000 }) {
  try {
    const res = await request(fetch, `${url}/v1/register`, timeoutMs, 'POST', { name, password, key, state });
    if (res.status === 200 && typeof res.body?.name === 'string') return { ok: true, name: res.body.name };
    if (res.status === 409) return { error: 'taken' };
  } catch {
    // 연결 실패
  }
  return { error: 'offline' };
}

// 이름 + 암호로 불러오기. { ok: true, name, state } | { error: 'wrong' } | { error: 'locked', retryAfter } | { error: 'offline' }
export async function loginRemote({ fetch, url, name, password, key, timeoutMs = 3000 }) {
  try {
    const res = await request(fetch, `${url}/v1/login`, timeoutMs, 'POST', { name, password, key });
    if (res.status === 200 && typeof res.body?.name === 'string') return { ok: true, name: res.body.name, state: res.body.state ?? null };
    if (res.status === 401) return { error: 'wrong' };
    if (res.status === 423) return { error: 'locked', retryAfter: Number(res.body?.retryAfter) || 900 };
  } catch {
    // 연결 실패
  }
  return { error: 'offline' };
}

// 등록된 이름의 상태 저장. 'ok' | 'unknown'(서버가 이 키를 모름: 등록이 풀림) | 'failed'(다음에 다시)
export async function saveStateRemote({ fetch, url, key, state, timeoutMs = 3000 }) {
  try {
    const res = await request(fetch, `${url}/v1/state`, timeoutMs, 'PUT', { key, state });
    if (res.status === 200) return 'ok';
    if (res.status === 404) return 'unknown';
  } catch {
    // 연결 실패
  }
  return 'failed';
}
