// 화면. 계산과 저장 규칙은 다른 모듈에 있고 여기서는 그리기와 입력 처리만 한다.
import { DOMAINS, LEVELS } from './elo.js';
import { TEMPLATES } from './generators/index.js';
import { buildPool, openDomains, pickDomain, pickProblem, ratedPool, unseen } from './pick.js';
import { applyAnswer, grade, toProblem } from './quiz.js';
import { addProfile, currentProfile, decodeBook, encodeBook, newKey, normalizeName, renameProfile, selectProfile, updateProfile } from './profiles.js';
import { loadRemote, loginRemote, postResult, registerRemote, rememberRating, resetRemote, saveStateRemote } from './server.js';
import { STORAGE_KEY, newState, overall, parseState } from './store.js';

const $ = (id) => document.getElementById(id);
const SCREENS = ['who', 'start', 'home', 'quiz', 'history'];
const DOMAIN_NAME = Object.fromEntries(DOMAINS.map((d) => [d.id, d.name]));

// 정답은 동그라미, 오답은 빗금(빨간펜 채점)
const MARK = {
  true: '<svg viewBox="0 0 120 120"><path d="M64 14 C96 12 112 40 106 68 C100 98 62 112 36 100 C10 88 6 48 26 28 C40 14 60 10 74 16"/></svg>',
  false: '<svg viewBox="0 0 120 120"><path d="M20 102 L100 16"/></svg>',
};

// 사생활 보호 모드에서는 localStorage에 접근만 해도 예외가 날 수 있다.
const storage = (() => {
  try {
    return window.localStorage;
  } catch {
    return { getItem: () => null, setItem() { throw new Error('저장 불가'); }, removeItem() {} };
  }
})();

// 이 기기의 이름 목록과 지금 이름의 풀이 상태(state는 book 안 지금 이름의 state와 같게 유지한다)
let book = decodeBook(readRaw());
let state = currentProfile(book)?.state ?? null;
let pool = buildPool(TEMPLATES, []);
let proofsById = new Map();
let session = null; // { filter, problem, order, done }
// 서버에서 받은 문제 ELO. url이 null이면 서버 기능이 꺼져 있고 원래 ELO를 쓴다.
let remote = { url: null, ratings: {} };
let mode = 'new'; // 누가 풀까요: 'new' 새 이름, 'load' 내 이름 불러오기
let renaming = false; // 이름 지키기: 서버에 같은 이름이 있어 새 이름을 받는 중
const later = new Set(); // 이번 실행 동안 이름 지키기를 미룬 이름(키)
let flashNext = ''; // 다음 화면 맨 위에 한 번 보일 알림
const api = () => ({ fetch: window.fetch.bind(window), url: remote.url });

function readRaw() {
  try {
    return storage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeBook() {
  try {
    storage.setItem(STORAGE_KEY, encodeBook(book));
    return true;
  } catch {
    return false;
  }
}

// 지금 이름의 상태를 이름 목록에 넣고 목록 전체를 저장한다. 저장하지 못하면 false.
// 등록된 이름이면 서버에도 저장한다(보낼 때까지 dirty로 표시해, 못 보내면 다음 시작 때 다시 보낸다).
function persist() {
  const profile = currentProfile(book);
  if (profile) book = updateProfile(book, profile.key, profile.registered ? { state, dirty: true } : { state });
  const saved = writeBook();
  if (profile?.registered) saveState(profile.key);
  return saved;
}

async function saveState(key) {
  const sent = book.profiles.find((p) => p.key === key);
  if (!remote.url || !sent) return;
  const result = await saveStateRemote({ ...api(), key, state: sent.state });
  const now = book.profiles.find((p) => p.key === key);
  if (!now) return;
  // 보내는 동안 상태가 또 바뀌었으면 그 뒤의 저장이 dirty를 푼다.
  if (result === 'ok' && now.state === sent.state) book = updateProfile(book, key, { dirty: false });
  else if (result === 'unknown') book = updateProfile(book, key, { registered: false, dirty: false }); // 서버가 이 기기를 모른다
  else return;
  writeBook();
  if (key === currentProfile(book)?.key) drawWhoNow();
}

function drawWhoNow() {
  const profile = currentProfile(book);
  $('who-now').replaceChildren(...(profile ? [profile.name, ...(profile.registered ? [] : [el('span', { className: 'tag', textContent: '미등록' })])] : []));
}

function hint(id, text) {
  $(id).textContent = text;
  $(id).hidden = false;
}

function clearHints(...ids) {
  for (const id of ids) $(id).hidden = true;
}

function fail(hintId, inputId, text) {
  hint(hintId, text);
  $(inputId).focus();
}

// 보내는 동안 버튼을 막고 진행 문구를 보인다.
function busy(button, on, text) {
  button.disabled = on;
  if (on) {
    button.dataset.label = button.textContent;
    button.textContent = text;
  } else if (button.dataset.label) {
    button.textContent = button.dataset.label;
  }
}

for (const button of document.querySelectorAll('.show-pass')) {
  button.addEventListener('click', () => {
    const input = $(button.getAttribute('aria-controls'));
    const shown = input.type === 'password';
    input.type = shown ? 'text' : 'password';
    button.setAttribute('aria-pressed', String(shown));
    button.textContent = shown ? '숨기기' : '보기';
  });
}

function show(screen) {
  $('boot').hidden = true;
  const profile = currentProfile(book);
  $('who-now').hidden = !profile || screen === 'who';
  drawWhoNow();
  $('flash').textContent = flashNext;
  $('flash').hidden = !flashNext;
  flashNext = '';
  for (const id of SCREENS) $(id).hidden = id !== screen;
  $('overall').textContent = (state && overall(state)) ?? '–';
  window.scrollTo(0, 0);
}

// 문장을 글자 그대로 넣은 뒤 $...$ 부분만 KaTeX로 그린다. 문제 문자열을 HTML로 해석하지 않는다.
function setMath(el, text) {
  el.textContent = text;
  if (window.renderMathInElement) {
    window.renderMathInElement(el, { delimiters: [{ left: '$', right: '$', display: false }], throwOnError: false });
  }
}

function el(tag, props = {}, children = []) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

// ── 누가 풀까요? ────────────────────────────────────────────

function renderWho() {
  $('people').replaceChildren(...book.profiles.map((p) => {
    const button = el('button', { type: 'button' }, [
      el('span', { className: 'level-name' }, [p.name, ...(p.registered ? [] : [el('span', { className: 'level-note', textContent: ' 미등록' })])]),
      el('span', { className: 'level-note', textContent: p.state ? `종합 ELO ${overall(p.state) ?? '–'}` : '단계를 아직 고르지 않음' }),
    ]);
    button.addEventListener('click', () => choose(selectProfile(book, p.key)));
    return el('li', {}, [button]);
  }));
  $('people').hidden = book.profiles.length === 0;
  $('who-name').value = '';
  $('who-pass').value = '';
  setMode('new');
  show('who');
  if (book.profiles.length === 0) $('who-name').focus();
}

function choose(next) {
  book = next;
  state = currentProfile(book).state;
  persist();
  if (state) renderHome();
  else renderStart();
}

function setMode(next) {
  mode = next;
  $('mode-new').setAttribute('aria-pressed', String(mode === 'new'));
  $('mode-load').setAttribute('aria-pressed', String(mode === 'load'));
  $('who-pass').autocomplete = mode === 'new' ? 'new-password' : 'current-password';
  $('who-submit').textContent = mode === 'new' ? '시작하기' : '불러오기';
  clearHints('who-hint', 'who-pass-hint', 'who-status');
}

$('mode-new').addEventListener('click', () => setMode('new'));
$('mode-load').addEventListener('click', () => setMode('load'));

const sameName = (a, b) => a.toLowerCase() === b.toLowerCase();

$('who-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  clearHints('who-hint', 'who-pass-hint', 'who-status');
  const name = normalizeName($('who-name').value);
  const password = $('who-pass').value;
  if (!name) return fail('who-hint', 'who-name', '이름은 1–20자로 입력해 주세요.');
  if ([...password].length < 6) return fail('who-pass-hint', 'who-pass', '암호는 6자 이상으로 입력해 주세요.');
  const button = $('who-submit');
  busy(button, true, mode === 'new' ? '등록 중…' : '불러오는 중…');
  try {
    if (mode === 'new') await createName(name, password);
    else await loadName(name, password);
  } finally {
    busy(button, false);
  }
});

// 새 이름: 서버가 있으면 등록하고, 없으면 이 기기에만 만든다(서버가 연결되면 이름 지키기로 등록).
async function createName(name, password) {
  if (book.profiles.some((p) => sameName(p.name, name))) return fail('who-hint', 'who-name', '이미 있는 이름입니다. 위에서 골라 주세요.');
  const key = newKey();
  const result = remote.url ? await registerRemote({ ...api(), name, password, key, state: book.legacy }) : { error: 'offline' };
  if (result.error === 'taken') return fail('who-hint', 'who-name', '이미 다른 사람이 쓰는 이름입니다.');
  const added = addProfile(book, result.ok ? result.name : name, key, { registered: result.ok === true });
  if (added.error) return fail('who-hint', 'who-name', '이미 있는 이름입니다. 위에서 골라 주세요.');
  if (!result.ok) {
    flashNext = '서버에 연결되지 않아 이 기기에만 만들었습니다. 연결되면 암호를 다시 정해 등록합니다.';
    later.add(key);
  }
  choose(added.book);
}

// 내 이름 불러오기: 이름 + 암호로 서버의 상태를 받아 이 기기에 만든다(같은 이름이 있으면 그 이름을 바꿔 쓴다).
async function loadName(name, password) {
  if (!remote.url) return hint('who-status', '서버에 연결할 수 없습니다.');
  const key = newKey();
  const result = await loginRemote({ ...api(), name, password, key });
  if (result.error === 'wrong') return fail('who-pass-hint', 'who-pass', '이름이나 암호가 틀립니다.');
  if (result.error === 'locked') {
    const minutes = Math.ceil(result.retryAfter / 60);
    return hint('who-pass-hint', `여러 번 틀려서 잠시 막혔습니다. ${minutes}분 뒤 다시 해 주세요.`);
  }
  if (result.error) return hint('who-status', '서버에 연결할 수 없습니다.');
  const rest = { ...book, profiles: book.profiles.filter((p) => !sameName(p.name, result.name)) };
  // 서버의 상태가 망가졌으면 그 이름은 단계 선택부터(이름은 등록된 채로).
  const loaded = result.state ? parseState(result.state) : null;
  choose(addProfile(rest, result.name, key, { registered: true, state: loaded }).book);
}

$('who-now').addEventListener('click', renderWho);

// ── 단계 고르기 ─────────────────────────────────────────────

function renderStart() {
  $('levels').replaceChildren(...LEVELS.map((level) => {
    const button = el('button', { type: 'button' }, [
      el('span', { className: 'level-name', textContent: level.name }),
      el('span', { className: 'level-note', textContent: `ELO ${level.rating}에서 시작` }),
    ]);
    button.addEventListener('click', () => {
      // 기록을 지운 이름은 그때의 보내기 설정을 이어받는다(끈 사람이 다시 켜지지 않게).
      state = newState(level.key, currentProfile(book).share);
      persist();
      renderHome();
    });
    return el('li', {}, [button]);
  }));
  $('share-note').hidden = !remote.url;
  show('start');
}

// ── 홈: 영역별 성적표 ───────────────────────────────────────

function renderHome() {
  const total = Object.values(state.ratings).reduce((s, x) => s + x.n, 0);
  const rows = [{ id: null, name: '전체', r: overall(state) ?? '–', n: total }];
  for (const id of openDomains(ratedPool(unseen(pool, state.seen), remote.ratings), state.ratings)) rows.push({ id, name: DOMAIN_NAME[id], r: state.ratings[id].r, n: state.ratings[id].n });
  $('domains').tBodies[0].replaceChildren(...rows.map((row) => {
    const button = el('button', { type: 'button', textContent: row.name });
    button.addEventListener('click', () => startQuiz(row.id));
    return el('tr', {}, [
      el('td', {}, [button]),
      el('td', { className: 'num', textContent: row.r }),
      el('td', { className: 'num', textContent: row.n }),
    ]);
  }));
  $('share-row').hidden = !remote.url;
  $('share-toggle').checked = state.share;
  const profile = currentProfile(book);
  const ask = Boolean(remote.url) && !profile.registered && !later.has(profile.key);
  if (ask !== !$('protect').hidden || !ask) resetProtect();
  $('protect').hidden = !ask;
  show('home');
}

// ── 이름 지키기(미등록 이름에 암호를 정해 등록) ──

function resetProtect() {
  renaming = false;
  $('protect-text').textContent = '이 이름을 지키려면 암호를 정하세요. 다시 깔아도 이 이름과 기록을 불러올 수 있습니다.';
  $('protect-name').hidden = true;
  $('protect-name-label').hidden = true;
  $('protect-pass').value = '';
  clearHints('protect-hint');
}

$('protect-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  clearHints('protect-hint');
  const profile = currentProfile(book);
  const name = renaming ? normalizeName($('protect-name').value) : profile.name;
  const password = $('protect-pass').value;
  if (!name) return fail('protect-hint', 'protect-name', '이름은 1–20자로 입력해 주세요.');
  if (book.profiles.some((p) => p.key !== profile.key && sameName(p.name, name))) return fail('protect-hint', 'protect-name', '이 기기에 이미 있는 이름입니다.');
  if ([...password].length < 6) return fail('protect-hint', 'protect-pass', '암호는 6자 이상으로 입력해 주세요.');
  const button = $('protect-submit');
  busy(button, true, '등록 중…');
  try {
    const result = await registerRemote({ ...api(), name, password, key: profile.key, state });
    if (result.error === 'taken') {
      renaming = true;
      $('protect-text').textContent = '다른 사람이 이미 쓰는 이름입니다. 새 이름을 정해 주세요.';
      $('protect-name').hidden = false;
      $('protect-name-label').hidden = false;
      $('protect-name').value = '';
      $('protect-name').focus();
      return;
    }
    if (result.error) return hint('protect-hint', '서버에 연결할 수 없습니다.');
    if (result.name !== profile.name) book = renameProfile(book, profile.key, result.name).book ?? book;
    book = updateProfile(book, profile.key, { registered: true, dirty: false });
    writeBook();
    renderHome();
  } finally {
    busy(button, false);
  }
});

$('protect-later').addEventListener('click', () => {
  later.add(currentProfile(book).key);
  $('protect').hidden = true;
});

$('share-toggle').addEventListener('change', (event) => {
  state = { ...state, share: event.target.checked };
  persist();
});

// ── 문제 ────────────────────────────────────────────────────

function startQuiz(filter) {
  session = { filter };
  nextProblem();
}

function shuffled(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function nextProblem() {
  const fresh = ratedPool(unseen(pool, state.seen), remote.ratings);
  const domain = session.filter ?? pickDomain(fresh, state.ratings, Math.random);
  const item = pickProblem(fresh, domain, state.ratings[domain].r, state.recent, Math.random);
  const problem = toProblem(item, proofsById, 1 + Math.floor(Math.random() * 0x7fffffff));
  session = { filter: session.filter, problem, order: shuffled([0, 1, 2, 3]), done: false };

  $('q-domain').textContent = DOMAIN_NAME[problem.domain];
  $('q-rating').textContent = `문제 ELO ${problem.rating}`;
  setMath($('q-text'), problem.text);
  $('q-result').hidden = true;
  $('q-next').hidden = true;
  $('q-hint').hidden = true;

  const numeric = problem.type === 'numeric';
  $('q-form').hidden = !numeric;
  $('q-steps').hidden = numeric;
  $('q-choices').hidden = numeric;
  if (numeric) {
    $('q-input').value = '';
    $('q-input').disabled = false;
    $('q-form').querySelector('button').disabled = false;
  } else {
    renderProof(problem);
  }
  show('quiz');
  if (numeric) $('q-input').focus();
}

function renderProof(problem) {
  $('q-steps').replaceChildren(...problem.steps.map((step, i) => {
    // 번호가 잘리지 않도록 가로 스크롤은 안쪽 상자에만 건다.
    const body = el('div', { className: 'scroll-x' });
    if (i === problem.blank) body.append(el('span', { className: 'blank', textContent: '빈칸' }));
    else setMath(body, step);
    return el('li', {}, [body]);
  }));
  $('q-choices').replaceChildren(...session.order.map((original) => {
    const label = el('span');
    setMath(label, problem.choices[original]);
    const button = el('button', { type: 'button' }, [label]);
    button.dataset.choice = original;
    button.addEventListener('click', () => answer(original));
    return el('li', {}, [button]);
  }));
}

$('q-form').addEventListener('submit', (event) => {
  event.preventDefault();
  if (session?.problem.type === 'numeric') answer($('q-input').value);
});

// 한 문제는 한 번만 채점한다. 결과가 나온 뒤의 제출·Enter·보기 누름은 무시한다.
function answer(input) {
  if (!session || session.done) return;
  const { problem } = session;
  const correct = grade(problem, input);
  if (correct === null) {
    $('q-hint').hidden = false;
    $('q-input').focus();
    return;
  }
  session.done = true;
  const before = state.ratings[problem.domain].r;
  const applied = applyAnswer(state, problem, correct, Date.now());
  state = applied.state;
  const saved = persist();
  renderResult(problem, input, correct, before, applied.delta, saved);
  // 결과를 이름·키와 함께 보내고, 서버가 돌려준 새 문제 ELO를 바로 쓴다. 실패하면 그냥 넘어간다.
  const profile = currentProfile(book);
  if (remote.url && state.share) {
    postResult({ fetch: window.fetch.bind(window), url: remote.url, id: problem.id, correct, player: before, name: profile.name, key: profile.key }).then((r) => {
      if (r === null) return;
      remote.ratings[problem.id] = r;
      rememberRating(storage, problem.id, r);
    });
  }
}

function renderResult(problem, input, correct, before, delta, saved) {
  $('q-hint').hidden = true;
  if (problem.type === 'numeric') {
    $('q-input').disabled = true;
    $('q-form').querySelector('button').disabled = true;
    setMath($('q-answer'), `정답: $${problem.answer}$`);
    $('q-theorem').hidden = true;
  } else {
    const blank = $('q-steps').children[problem.blank];
    setMath(blank.firstChild, problem.steps[problem.blank]);
    blank.className = 'filled';
    for (const button of $('q-choices').querySelectorAll('button')) {
      const original = Number(button.dataset.choice);
      button.disabled = true;
      if (original === problem.answer) button.classList.add('correct');
      if (original === input) button.classList.add('chosen', correct ? 'right' : 'wrong');
    }
    $('q-answer').textContent = correct ? '빈칸에 들어갈 단계를 맞게 골랐습니다.' : '색칠된 보기가 빈칸에 들어갈 단계입니다.';
    $('q-theorem').hidden = false;
    setMath($('q-theorem'), `근거: ${problem.theorem}`);
  }
  $('q-mark').innerHTML = MARK[correct];
  $('q-verdict').textContent = correct ? '정답입니다' : '오답입니다';
  setMath($('q-explain'), `풀이: ${problem.explain}`);
  $('q-elo').replaceChildren(
    `${DOMAIN_NAME[problem.domain]} ELO ${before} → ${before + delta}`,
    el('span', { className: 'pen', textContent: `${delta >= 0 ? '+' : '−'}${Math.abs(delta)}` }),
  );
  $('q-unsaved').hidden = saved;
  $('q-result').hidden = false;
  $('overall').textContent = overall(state) ?? '–';

  // Enter를 연달아 눌러 결과를 못 보고 넘어가지 않도록 잠깐 뒤에 연다.
  const next = $('q-next');
  next.hidden = false;
  next.disabled = true;
  setTimeout(() => {
    next.disabled = false;
    next.focus();
  }, 450);
}

$('q-next').addEventListener('click', nextProblem);
$('q-quit').addEventListener('click', renderHome);

// ── 풀이 기록 ───────────────────────────────────────────────

const when = new Intl.DateTimeFormat('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });

function renderHistory() {
  const entries = [...state.history].reverse();
  $('h-empty').hidden = entries.length > 0;
  $('h-table').hidden = entries.length === 0;
  $('h-reset').disabled = entries.length === 0;
  $('h-table').tBodies[0].replaceChildren(...entries.map((h) => el('tr', {}, [
    el('td', {}, [el('span', { className: 'tick', textContent: h.correct ? '○' : '／', title: h.correct ? '정답' : '오답' })]),
    el('td', { textContent: DOMAIN_NAME[h.domain] ?? h.domain }),
    el('td', { className: 'num', textContent: `${h.delta >= 0 ? '+' : '−'}${Math.abs(h.delta)}` }),
    el('td', { className: 'num', textContent: when.format(new Date(h.t)) }),
  ])));
  show('history');
}

$('open-history').addEventListener('click', renderHistory);
$('h-back').addEventListener('click', renderHome);
$('h-reset').addEventListener('click', () => {
  if (!window.confirm('이 이름의 풀이 기록과 ELO를 지우고, 서버에 보낸 이 이름의 결과와 저장된 기록도 지웁니다. 이름과 암호는 남습니다. 계속할까요?')) return;
  const { key } = currentProfile(book);
  book = updateProfile(book, key, { pendingReset: true, share: state.share });
  state = null;
  persist();
  renderStart();
  sendReset(key);
});

// 서버에 보낸 그 이름의 결과를 지운다. 실패하거나 서버 주소가 없으면 pendingReset이 남아 다음 시작 때 다시 보낸다.
// 보내기를 꺼 둔 이름도 끄기 전에 보낸 결과가 있을 수 있으므로 보낸다.
async function sendReset(key) {
  if (!remote.url) return;
  if (!(await resetRemote({ fetch: window.fetch.bind(window), url: remote.url, key }))) return;
  book = updateProfile(book, key, { pendingReset: false });
  persist();
}

$('go-home').addEventListener('click', () => {
  if (!currentProfile(book)) renderWho();
  else if (state) renderHome();
  else renderStart();
});

// ── 시작 ────────────────────────────────────────────────────

async function loadProofs() {
  try {
    const response = await fetch('proofs.json');
    if (!response.ok) throw new Error(response.status);
    const proofs = await response.json();
    proofsById = new Map(proofs.map((p) => [p.id, p]));
    pool = buildPool(TEMPLATES, proofs);
  } catch {
    $('notice').textContent = '증명 문제를 불러오지 못해 계산 문제만 냅니다. 새로 고치면 다시 시도합니다.';
    $('notice').hidden = false;
  }
}

// 증명 문항과 서버의 문제 ELO를 함께 받는다. 서버가 없으면 3초 안에 원래 ELO로 시작한다.
await Promise.all([
  loadProofs(),
  loadRemote({ fetch: window.fetch.bind(window), storage, configUrl: 'server.json' }).then((r) => {
    remote = r;
  }),
]);
for (const p of book.profiles.filter((x) => x.pendingReset)) sendReset(p.key);
for (const p of book.profiles.filter((x) => x.registered && x.dirty)) saveState(p.key);
if (!currentProfile(book)) renderWho();
else if (state) renderHome();
else renderStart();
