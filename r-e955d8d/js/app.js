// 화면. 계산과 저장 규칙은 다른 모듈에 있고 여기서는 그리기와 입력 처리만 한다.
import { DOMAINS, LEVELS } from './elo.js';
import { TEMPLATES } from './generators/index.js';
import { buildPool, openDomains, pickDomain, pickProblem, ratedPool, unseen } from './pick.js';
import { applyAnswer, grade, toProblem } from './quiz.js';
import { addProfile, currentProfile, decodeBook, encodeBook, newKey, selectProfile, updateProfile } from './profiles.js';
import { loadRemote, postResult, rememberRating, resetRemote } from './server.js';
import { STORAGE_KEY, newState, overall } from './store.js';

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
// 기록을 지운 뒤 새로 시작할 때 이어받을 보내기 설정(끈 사용자가 다시 켜지지 않게)
let keepShare = true;

function readRaw() {
  try {
    return storage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

// 지금 이름의 상태를 이름 목록에 넣고 목록 전체를 저장한다. 저장하지 못하면 false.
function persist() {
  const profile = currentProfile(book);
  if (profile) book = updateProfile(book, profile.key, { state });
  try {
    storage.setItem(STORAGE_KEY, encodeBook(book));
    return true;
  } catch {
    return false;
  }
}

function show(screen) {
  $('boot').hidden = true;
  const profile = currentProfile(book);
  $('who-now').hidden = !profile || screen === 'who';
  $('who-now').textContent = profile?.name ?? '';
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
      el('span', { className: 'level-name', textContent: p.name }),
      el('span', { className: 'level-note', textContent: p.state ? `종합 ELO ${overall(p.state) ?? '–'}` : '단계를 아직 고르지 않음' }),
    ]);
    button.addEventListener('click', () => choose(selectProfile(book, p.key)));
    return el('li', {}, [button]);
  }));
  $('people').hidden = book.profiles.length === 0;
  $('who-name').value = '';
  $('who-hint').hidden = true;
  show('who');
  if (book.profiles.length === 0) $('who-name').focus();
}

function choose(next) {
  book = next;
  state = currentProfile(book).state;
  keepShare = true;
  persist();
  if (state) renderHome();
  else renderStart();
}

$('who-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const added = addProfile(book, $('who-name').value, newKey());
  if (added.error) {
    $('who-hint').textContent = added.error === 'length' ? '이름은 1–20자로 입력해 주세요.' : '이미 있는 이름입니다. 위에서 골라 주세요.';
    $('who-hint').hidden = false;
    $('who-name').focus();
    return;
  }
  choose(added.book);
});

$('who-now').addEventListener('click', renderWho);

// ── 단계 고르기 ─────────────────────────────────────────────

function renderStart() {
  $('levels').replaceChildren(...LEVELS.map((level) => {
    const button = el('button', { type: 'button' }, [
      el('span', { className: 'level-name', textContent: level.name }),
      el('span', { className: 'level-note', textContent: `ELO ${level.rating}에서 시작` }),
    ]);
    button.addEventListener('click', () => {
      state = newState(level.key, keepShare);
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
  show('home');
}

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
  if (!window.confirm('이 이름의 풀이 기록과 ELO를 지우고, 서버에 보낸 이 이름의 결과도 지웁니다. 계속할까요?')) return;
  const { key } = currentProfile(book);
  keepShare = state.share;
  state = null;
  book = updateProfile(book, key, { pendingReset: true });
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
if (!currentProfile(book)) renderWho();
else if (state) renderHome();
else renderStart();
