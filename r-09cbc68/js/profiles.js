// 한 기기 안의 이름 목록. 이름마다 풀이 상태(store.js의 상태 JSON)와 서버용 비밀 키를 따로 둔다.
// 저장 형식(키 mathquiz.v1): { version: 2, current, profiles: [{ name, key, state, pendingReset, share }] }
// share는 기록을 지운 이름의 보내기 설정(단계를 다시 고를 때 이어받는다). 없으면 켬.
// version 1(1.4.1까지의 상태 하나)은 legacy로 읽고, 처음 만드는 이름이 이어받는다.
// 설계: docs/superpowers/specs/2026-10-14-named-players-design.md 3장
import { parseState } from './store.js';

const MAX_NAME = 20; // 글자(코드 포인트) 수
const KEY = /^[0-9a-f]{32}$/;

const sameName = (a, b) => a.toLowerCase() === b.toLowerCase();

// 앞뒤 공백을 지운 이름, 규칙(1–20자)에 맞지 않으면 null.
export function normalizeName(raw) {
  if (typeof raw !== 'string') return null;
  const name = raw.trim();
  const length = [...name].length;
  return length >= 1 && length <= MAX_NAME ? name : null;
}

// 서버에서 "이 이름이 보낸 결과"를 확인하는 비밀 키: 무작위 128비트, 16진수 32자.
export function newKey(getRandomValues = (bytes) => crypto.getRandomValues(bytes)) {
  return [...getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function decodeBook(raw) {
  const empty = { current: null, profiles: [], legacy: null };
  let json;
  try {
    json = JSON.parse(raw);
  } catch {
    return empty;
  }
  if (json === null || typeof json !== 'object') return empty;
  if (json.version === 1) return { ...empty, legacy: parseState(json) };
  if (json.version !== 2 || !Array.isArray(json.profiles)) return empty;
  const profiles = [];
  for (const p of json.profiles) {
    const name = normalizeName(p?.name);
    if (!name || typeof p.key !== 'string' || !KEY.test(p.key)) continue;
    if (profiles.some((q) => q.key === p.key || sameName(q.name, name))) continue;
    // 상태가 망가졌으면 그 이름만 단계 선택부터 다시 시작한다.
    profiles.push({
      name,
      key: p.key,
      state: p.state ? parseState(p.state) : null,
      pendingReset: p.pendingReset === true,
      share: p.share !== false,
    });
  }
  const current = profiles.some((p) => p.key === json.current) ? json.current : null;
  return { current, profiles, legacy: null };
}

export function encodeBook(book) {
  return JSON.stringify({ version: 2, current: book.current, profiles: book.profiles });
}

// 새 이름을 만들어 지금 이름으로 정한다. 1.4.1의 기록(legacy)이 있으면 이 이름이 이어받는다.
export function addProfile(book, rawName, key) {
  const name = normalizeName(rawName);
  if (!name) return { error: 'length' };
  if (book.profiles.some((p) => sameName(p.name, name))) return { error: 'duplicate' };
  const profile = { name, key, state: book.legacy, pendingReset: false, share: true };
  return { book: { current: key, profiles: [...book.profiles, profile], legacy: null } };
}

export const currentProfile = (book) => book.profiles.find((p) => p.key === book.current) ?? null;

export const selectProfile = (book, key) => ({ ...book, current: key });

export const updateProfile = (book, key, patch) => ({
  ...book,
  profiles: book.profiles.map((p) => (p.key === key ? { ...p, ...patch } : p)),
});
