// 화면. 계산과 저장 규칙은 다른 모듈에 있고 여기서는 그리기와 입력 처리만 한다.
import { DOMAINS, LEVELS } from './elo.js';
import { TEMPLATES } from './generators/index.js';
import { buildPool, pickDomain, pickProblem } from './pick.js';
import { applyAnswer, grade, toProblem } from './quiz.js';
import { STORAGE_KEY, load, newState, overall, save } from './store.js';

const $ = (id) => document.getElementById(id);
const SCREENS = ['start', 'home', 'quiz', 'history'];
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

let state = load(storage);
let pool = buildPool(TEMPLATES, []);
let proofsById = new Map();
let session = null; // { filter, problem, order, done }

function show(screen) {
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

// ── 단계 고르기 ─────────────────────────────────────────────

function renderStart() {
  $('levels').replaceChildren(...LEVELS.map((level) => {
    const button = el('button', { type: 'button' }, [
      el('span', { className: 'level-name', textContent: level.name }),
      el('span', { className: 'level-note', textContent: `ELO ${level.rating}에서 시작` }),
    ]);
    button.addEventListener('click', () => {
      state = newState(level.key);
      save(storage, state);
      renderHome();
    });
    return el('li', {}, [button]);
  }));
  show('start');
}

// ── 홈: 영역별 성적표 ───────────────────────────────────────

function renderHome() {
  const total = Object.values(state.ratings).reduce((s, x) => s + x.n, 0);
  const rows = [{ id: null, name: '전체', r: overall(state) ?? '–', n: total }];
  for (const d of DOMAINS) rows.push({ id: d.id, name: d.name, r: state.ratings[d.id].r, n: state.ratings[d.id].n });
  $('domains').tBodies[0].replaceChildren(...rows.map((row) => {
    const button = el('button', { type: 'button', textContent: row.name });
    button.addEventListener('click', () => startQuiz(row.id));
    return el('tr', {}, [
      el('td', {}, [button]),
      el('td', { className: 'num', textContent: row.r }),
      el('td', { className: 'num', textContent: row.n }),
    ]);
  }));
  show('home');
}

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
  const domain = session.filter ?? pickDomain(pool, Math.random);
  const item = pickProblem(pool, domain, state.ratings[domain].r, state.recent, Math.random);
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
  const saved = save(storage, state);
  renderResult(problem, input, correct, before, applied.delta, saved);
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
  if (!window.confirm('풀이 기록과 ELO를 모두 지우고 단계 선택부터 다시 시작할까요?')) return;
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // 저장소를 쓸 수 없는 브라우저에서는 메모리 상태만 지운다.
  }
  state = null;
  renderStart();
});

$('go-home').addEventListener('click', () => (state ? renderHome() : renderStart()));

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

await loadProofs();
if (state) renderHome();
else renderStart();
