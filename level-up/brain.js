/* =============================================================
   brain.js: more brain games on the Quiz tab
   -------------------------------------------------------------
   The words, facts and Korean are in brain-data.js.

   1. Talking out loud (English and Korean)
   2. Fact of the Day
   3. Spelling Bee
   4. Times-Table Sprint
   5. Korean Flashcards
   6. Make Your Own Quiz
   7. Homework Timer
   8. Plugging in (XP, badges, saved data: see hooks.js)

   This file loads before app.js, so it only uses app.js's
   functions inside its own functions, never right away.
   ============================================================= */


/* 1. TALKING OUT LOUD -------------------------------------------------
   Like the coach's voice, but this one always talks: the spelling bee
   doesn't work without it! Each part can have its own speed.        */

function canTalk() {
  return "speechSynthesis" in window;
}

function brainSay(parts, lang = "en-US") {
  if (!canTalk()) return;
  try {
    window.speechSynthesis.cancel();
    const korean = lang.startsWith("ko")
      ? window.speechSynthesis.getVoices().find((voice) => voice.lang.toLowerCase().startsWith("ko"))
      : null;
    for (const part of parts) {
      const words = new SpeechSynthesisUtterance(part.text);
      words.lang = lang;
      words.rate = part.rate || 0.95;
      if (korean) words.voice = korean;
      window.speechSynthesis.speak(words);
    }
  } catch (error) {
    // No voice in this browser. The words are on the screen too.
  }
}

// Korean words: in a Korean voice if this device has one. If it doesn't,
// an English voice reads the English letters ("charyeot") instead, which
// sounds much closer than an English voice trying to read Korean letters.
function sayKoreanTerm(term) {
  let voices = [];
  try {
    voices = window.speechSynthesis.getVoices();
  } catch (error) {
    // No voices at all
  }
  const hasKorean = voices.length === 0 || voices.some((voice) => voice.lang.toLowerCase().startsWith("ko"));
  if (hasKorean) brainSay([{ text: term.korean, rate: 0.8 }], "ko-KR");
  else brainSay([{ text: term.say, rate: 0.8 }]);
}

// The penalty box (it looks just like the one in the quiz).
// "prefix" says which game's buttons these are, like data-bee="did".
function brainPenaltyHTML(fix, prefix, doneLabel = "I did it ✓") {
  const penalty = penaltyInfo(fix);
  return `
    <div class="penalty">
      ${penalty.demo ? `<button class="penalty__demo" type="button" data-${prefix}="demo" aria-label="Show me how to do it"><span data-penalty-demo="${penalty.demo}"></span></button>` : ""}
      <div class="penalty__body">
        <p class="penalty__label">Penalty time!</p>
        <p class="penalty__move">${escapeHTML(penalty.text)}</p>
        <div class="penalty__buttons">
          ${penalty.demo ? `<button class="text-button" type="button" data-${prefix}="demo">Show me how</button>` : ""}
          ${penalty.seconds ? `<button class="text-button" type="button" data-${prefix}="timer">⏱ Start ${penalty.seconds}s timer</button>` : ""}
          <button class="button" type="button" data-${prefix}="did">${doneLabel}</button>
        </div>
      </div>
    </div>`;
}

// Swaps the penalty's placeholder for a moving stick figure (demos.js)
function fillPenaltyDemos(area) {
  area.querySelectorAll("[data-penalty-demo]").forEach((spot) => {
    const svg = createDemo(spot.dataset.penaltyDemo, "");
    svg.setAttribute("aria-hidden", "true");
    spot.replaceWith(svg);
  });
  startDemoAnimation();
}

function penaltyButton(action, fix) {
  const penalty = penaltyInfo(fix);
  if (action === "demo") openDemo(penalty.demo, penalty.text, penalty.how);
  if (action === "timer") startTimer(penalty.text, penalty.seconds);
}

// The little dots that show how a round is going
function roundDotsHTML(results, length, index) {
  const dots = [];
  for (let i = 0; i < length; i++) {
    let state = "";
    if (results[i]) state = `is-${results[i]}`;
    else if (i === index) state = "is-now";
    dots.push(`<span class="quiz-dot ${state}"></span>`);
  }
  return `<div class="quiz-dots" aria-hidden="true">${dots.join("")}</div>`;
}

function plural(count, word, many = `${word}s`) {
  return `${count} ${count === 1 ? word : many}`;
}


/* 2. FACT OF THE DAY ------------------------------------------------- */

let factOffset = 0; // "Another fact" moves this along

function factIndex() {
  const day = Math.round(today.getTime() / 86400000); // days since 1970
  const count = FUN_FACTS.length;
  return (((day + factOffset) % count) + count) % count;
}

function drawFact() {
  document.querySelector("#fact-area").innerHTML = `
    <p class="fact__label">💡 ${factOffset === 0 ? "Fact of the day" : "Bonus fact"}</p>
    <p class="fact__text">${escapeHTML(FUN_FACTS[factIndex()])}</p>
    <div class="fact__buttons">
      ${canTalk() ? `<button class="text-button" type="button" data-fact="say">🔊 Read it to me</button>` : ""}
      <button class="text-button" type="button" data-fact="next">Another fact →</button>
    </div>`;
}

document.querySelector("#fact-area").addEventListener("click", (event) => {
  const button = event.target.closest("[data-fact]");
  if (!button) return;
  if (button.dataset.fact === "say") brainSay([{ text: FUN_FACTS[factIndex()], rate: 1 }]);
  if (button.dataset.fact === "next") {
    factOffset += 1;
    drawFact();
    document.querySelector("[data-fact='next']").focus();
  }
});

// The buttons at the top of the tab that jump down to each game
document.addEventListener("click", (event) => {
  const jump = event.target.closest("[data-brain-jump]");
  if (!jump) return;
  const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById(jump.dataset.brainJump)?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
});


/* 3. SPELLING BEE -----------------------------------------------------
   The voice says a word, uses it in a sentence, and says it again.
   Type it! Spell it wrong and you owe that word's exercise.         */

const BEE_LENGTH = 10; // words in a round
let bee = null;        // the round you're playing, or null
const beeArea = document.querySelector("#bee-area");

// 10 words, starting with up to 3 you missed lately (practice makes perfect!)
function pickBeeWords() {
  const recent = logOf("bee").slice(-10).flatMap((entry) => entry.m || []);
  const missed = quizShuffle([...new Set(recent)])
    .map((word) => SPELLING_WORDS.find((item) => item.word === word))
    .filter(Boolean)
    .slice(0, 3);
  const others = quizShuffle(SPELLING_WORDS.filter((item) => !missed.includes(item)));
  return quizShuffle([...missed, ...others.slice(0, BEE_LENGTH - missed.length)]);
}

function startBee() {
  bee = {
    words: pickBeeWords(),
    index: 0,
    results: [],      // "right" or "wrong" for each word so far
    typed: "",
    checked: false,   // have you checked this word yet?
    meaning: !canTalk(), // show the meaning? (always, if the voice can't talk)
    penaltyDone: false,
    penalties: 0,
    reps: 0,
    xpBefore: trophyStats().xp,
  };
  drawBee();
  sayBeeWord();
}

function beeWord() {
  return bee.words[bee.index];
}

// "because. I drank water because I was thirsty. because."
function sayBeeWord(slow = false) {
  const item = beeWord();
  brainSay([
    { text: item.word, rate: slow ? 0.5 : 0.85 },
    { text: item.sentence, rate: slow ? 0.75 : 0.95 },
    { text: item.word, rate: slow ? 0.5 : 0.85 },
  ]);
}

// "b, e, c, a, u, s, e"
function spellBeeWord() {
  const item = beeWord();
  brainSay([
    { text: `${item.word} is spelled`, rate: 0.95 },
    { text: item.word.split("").join(", "), rate: 0.7 },
  ]);
}

// The sentence with the word hidden, like "I drank water _____ I was thirsty."
function beeClue(item) {
  return escapeHTML(item.sentence).replace(new RegExp(item.word, "gi"), "_____");
}

function beeBest() {
  const rounds = logOf("bee");
  return rounds.length ? Math.max(...rounds.map((entry) => entry.r)) : null;
}

function drawBee() {
  if (!bee) beeArea.innerHTML = beeStartHTML();
  else if (bee.index >= bee.words.length) beeArea.innerHTML = beeEndHTML();
  else {
    beeArea.innerHTML = beeWordHTML();
    fillPenaltyDemos(beeArea);
  }
}

function beeStartHTML() {
  const rounds = logOf("bee");
  const best = beeBest();
  return `
    <div class="brain-start">
      <p class="brain-start__text">${canTalk()
        ? "🔊 Turn your sound on! The voice says each word, uses it in a sentence, then says it again. Then you type it."
        : "This browser can't talk, so you'll get a sentence and the meaning as clues instead."}</p>
      <button class="button" type="button" data-bee="start">Start a round (${BEE_LENGTH} words)</button>
      <p class="quiz-total">${rounds.length
        ? `Best: ${best}/${BEE_LENGTH} · ${plural(rounds.length, "round")} played · ${SPELLING_WORDS.length} words to learn`
        : `${SPELLING_WORDS.length} fifth-grade words to learn. Words you miss come back later for practice!`}</p>
    </div>`;
}

function beeWordHTML() {
  const item = beeWord();
  const right = bee.results.filter((r) => r === "right").length;
  const gotIt = bee.checked && bee.results[bee.index] === "right";

  let feedback = "";
  if (bee.checked && gotIt) {
    feedback = `
      <div class="quiz-result is-right">
        <p class="quiz-result__title">✅ Correct! +${XP_RULES.quizRight} XP</p>
        <p><strong>${escapeHTML(item.word)}</strong> means ${escapeHTML(item.meaning)}.</p>
      </div>
      ${beeNextHTML()}`;
  } else if (bee.checked) {
    feedback = `
      <div class="quiz-result is-wrong">
        <p class="quiz-result__title">❌ Not quite! It's spelled:</p>
        <p class="bee-spelled" aria-label="${escapeHTML(item.word)}">${item.word.split("").map((letter) => `<span>${escapeHTML(letter)}</span>`).join("")}</p>
        <p>You wrote: <span class="bee-typed">${escapeHTML(bee.typed)}</span></p>
        ${canTalk() ? `<button class="text-button" type="button" data-bee="spell">🔊 Spell it for me</button>` : ""}
      </div>
      ${bee.penaltyDone
        ? `<p class="penalty-done">💪 Penalty done! +${XP_RULES.penaltyDone} XP for the hard work.</p>${beeNextHTML()}`
        : brainPenaltyHTML(item.fix, "bee")}`;
  }

  return `
    <div class="quiz-play">
      <div class="quiz-top">
        <p class="quiz-where">🐝 Word ${bee.index + 1} of ${bee.words.length}</p>
        <p class="quiz-score" aria-label="${right} right so far">✓ ${right}</p>
        <button class="text-button" type="button" data-bee="quit">Quit</button>
      </div>
      ${roundDotsHTML(bee.results, bee.words.length, bee.index)}
      ${canTalk() ? `
        <div class="bee-listen">
          <button class="button" type="button" data-bee="hear">🔊 Hear the word</button>
          <button class="text-button" type="button" data-bee="slow">🐢 Say it slowly</button>
        </div>` : ""}
      <p class="bee-clue"><span class="bee-clue__label">Sentence:</span> ${beeClue(item)}</p>
      ${bee.meaning || bee.checked ? "" : `<button class="text-button" type="button" data-bee="meaning">📖 What does it mean?</button>`}
      ${bee.meaning && !bee.checked ? `<p class="bee-clue"><span class="bee-clue__label">Meaning:</span> ${escapeHTML(item.meaning)}</p>` : ""}
      <form class="bee-form" data-bee-form>
        <label class="field-label" for="bee-input">Type the word</label>
        <div class="bee-form__row">
          <input class="input bee-input" id="bee-input" type="text" maxlength="30" value="${escapeHTML(bee.typed)}"
            autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" ${bee.checked ? "disabled" : ""}>
          <button class="button" type="submit" ${bee.checked ? "disabled" : ""}>Check</button>
        </div>
      </form>
      <div class="quiz-feedback" aria-live="polite">${feedback}</div>
    </div>`;
}

function beeNextHTML() {
  const last = bee.index === bee.words.length - 1;
  return `<button class="button quiz-next" type="button" data-bee="next">${last ? "See my score" : "Next word →"}</button>`;
}

function beeEndHTML() {
  const right = bee.results.filter((r) => r === "right").length;
  const total = bee.words.length;
  const xpGained = trophyStats().xp - bee.xpBefore;
  const missed = bee.words.filter((_, i) => bee.results[i] === "wrong");
  let message = "Every word you miss comes back later, so you'll get it next time!";
  if (right === total) message = "PERFECT! You're a spelling champion! 🏆";
  else if (right >= 8) message = "Awesome spelling!";
  else if (right >= 5) message = "Nice work! Play again to beat your score.";

  return `
    <div class="quiz-end">
      <p class="eyebrow">// spelling bee complete</p>
      <p class="quiz-end__score">${right}<span>/${total}</span></p>
      <p class="quiz-end__message">${message}</p>
      <ul class="quiz-end__facts">
        <li>${xpGained > 0 ? `+${xpGained} XP` : "No more Spelling Bee XP today (3 rounds a day), but you still got smarter!"}</li>
        ${bee.penalties ? `<li>${plural(bee.penalties, "penalty", "penalties")} done: ${bee.reps} reps for the weekly boss!</li>` : ""}
      </ul>
      ${missed.length ? `
        <details class="extra quiz-review">
          <summary>Words to practice</summary>
          <ul>${missed.map((item) => `<li><strong>${escapeHTML(item.word)}</strong>: ${escapeHTML(item.meaning)}</li>`).join("")}</ul>
        </details>` : ""}
      <div class="quiz-end__buttons">
        <button class="button" type="button" data-bee="start">Play again</button>
        <button class="button button--quiet" type="button" data-bee="close">Done</button>
      </div>
    </div>`;
}

function checkBeeWord() {
  const input = beeArea.querySelector("#bee-input");
  const typed = input.value.trim().replace(/\s+/g, " ");
  if (!typed) {
    showToast("Type the word first!");
    input.focus();
    return;
  }
  bee.typed = typed;
  bee.checked = true;
  bee.penaltyDone = false;
  const right = typed.toLowerCase() === beeWord().word.toLowerCase();
  bee.results[bee.index] = right ? "right" : "wrong";
  if (right) sounds.rate(10);
  else {
    sounds.down();
    spellBeeWord();
  }
  drawBee();
  beeArea.querySelector(".quiz-next, [data-bee='did']")?.focus();
}

function nextBeeWord() {
  bee.index += 1;
  bee.typed = "";
  bee.checked = false;
  bee.meaning = !canTalk();
  bee.penaltyDone = false;

  if (bee.index >= bee.words.length) {
    const right = bee.results.filter((r) => r === "right").length;
    const missed = bee.words.filter((_, i) => bee.results[i] === "wrong").map((item) => item.word);
    logActivity("bee", { r: right, n: bee.words.length, p: bee.penalties, reps: bee.reps, m: missed });
    render();
    drawBee();
    if (right === bee.words.length) {
      sounds.fanfare();
      confetti();
    } else {
      sounds.finish();
    }
    checkAchievements(true);
    beeArea.querySelector("[data-bee='start']")?.focus();
    return;
  }
  drawBee();
  sayBeeWord();
  beeArea.querySelector("#bee-input")?.focus();
}

beeArea.addEventListener("submit", (event) => {
  event.preventDefault();
  if (bee && !bee.checked) checkBeeWord();
});

beeArea.addEventListener("click", (event) => {
  const button = event.target.closest("[data-bee]");
  if (!button) return;
  const action = button.dataset.bee;

  if (action === "start") {
    startAudio();
    startBee();
    beeArea.querySelector("#bee-input")?.focus();
    return;
  }
  if (action === "close") {
    bee = null;
    drawBee();
    return;
  }
  if (!bee) return;
  const input = beeArea.querySelector("#bee-input");
  if (input && !bee.checked) bee.typed = input.value; // keep what you typed when the box is redrawn

  if (action === "hear") sayBeeWord();
  if (action === "slow") sayBeeWord(true);
  if (action === "spell") spellBeeWord();
  if (action === "meaning") {
    bee.meaning = true;
    drawBee();
    beeArea.querySelector("#bee-input")?.focus();
  }
  if (action === "demo" || action === "timer") penaltyButton(action, beeWord().fix);
  if (action === "did") {
    bee.penaltyDone = true;
    bee.penalties += 1;
    bee.reps += penaltyInfo(beeWord().fix).reps;
    stopTimer();
    sounds.done();
    drawBee();
    beeArea.querySelector(".quiz-next")?.focus();
  }
  if (action === "next") nextBeeWord();
  if (action === "quit") {
    bee = null;
    window.speechSynthesis?.cancel();
    drawBee();
    showToast("Spelling Bee stopped. Come back anytime!");
  }
});


/* 4. TIMES-TABLE SPRINT ------------------------------------------------
   60 seconds: how many can you answer? A right answer jumps straight
   to the next one. Press ✓ (or Enter) to give up on one: that's a
   miss, and every miss is 3 jumping jacks at the end.               */

const SPRINT_SECONDS = 60;
const SPRINT_MISS_JACKS = 3;  // jumping jacks for each miss
const SPRINT_MOST_JACKS = 30; // never more than this
const SPRINT_MODES = [
  { id: "times", name: "× Times" },
  { id: "divide", name: "÷ Divide" },
  { id: "mixed", name: "🎲 Mixed" },
];

let sprintMode = "times";
let sprint = null;       // the sprint you're playing, or null
let sprintTicker = null; // the clock
const sprintArea = document.querySelector("#sprint-area");

function sprintQuestion(last) {
  for (let tries = 0; tries < 20; tries++) {
    const a = 2 + Math.floor(Math.random() * 11); // 2 to 12
    const b = 2 + Math.floor(Math.random() * 11);
    const divide = sprintMode === "divide" || (sprintMode === "mixed" && Math.random() < 0.5);
    const question = divide ? { text: `${a * b} ÷ ${a}`, answer: b } : { text: `${a} × ${b}`, answer: a * b };
    if (!last || question.text !== last.text) return question;
  }
  return { text: "6 × 7", answer: 42 };
}

function sprintBest(mode) {
  const rounds = logOf("math").filter((entry) => entry.m === mode);
  return rounds.length ? Math.max(...rounds.map((entry) => entry.r)) : null;
}

function startSprint() {
  const startsAt = Date.now() + 3000; // "3, 2, 1, go!"
  sprint = {
    mode: sprintMode,
    startsAt,
    endsAt: startsAt + SPRINT_SECONDS * 1000,
    question: sprintQuestion(null),
    typed: "",
    right: 0,
    wrong: 0,
    missed: [],       // the ones you missed, like "7 × 8 = 56"
    done: false,
    entry: null,      // its activity log entry, once it's over
    penaltyDone: false,
    lastBeep: 4,
    xpBefore: trophyStats().xp,
  };
  drawSprint();
  clearInterval(sprintTicker);
  sprintTicker = setInterval(tickSprint, 100);
  tickSprint();
}

function drawSprint() {
  if (!sprint) sprintArea.innerHTML = sprintStartHTML();
  else if (sprint.done) {
    sprintArea.innerHTML = sprintEndHTML();
    fillPenaltyDemos(sprintArea);
  } else {
    sprintArea.innerHTML = sprintPlayHTML();
    showSprint();
  }
}

function sprintStartHTML() {
  const modes = SPRINT_MODES.map((mode) => `
    <button class="lab-chip" type="button" data-sprint-mode="${mode.id}" aria-pressed="${mode.id === sprintMode}">${mode.name}</button>`).join("");
  const bests = SPRINT_MODES.map((mode) => {
    const best = sprintBest(mode.id);
    return `<div class="tile"><span class="tile__value">${best ?? "–"}</span><span class="tile__name">${mode.name} best</span></div>`;
  }).join("");
  return `
    <div class="brain-start">
      <div class="lab-chips" role="group" aria-label="Which kind of questions?">${modes}</div>
      <div class="tiles tiles--three">${bests}</div>
      <button class="button" type="button" data-sprint="start">Start the 60-second sprint</button>
      <p class="quiz-total">Tables 2 to 12. Type the answer: right ones jump to the next question. Every miss = ${SPRINT_MISS_JACKS} jumping jacks!</p>
    </div>`;
}

function sprintPlayHTML() {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "back", "0", "enter"].map((key) => {
    const label = key === "back" ? "⌫" : key === "enter" ? "✓" : key;
    const name = key === "back" ? "Delete" : key === "enter" ? "Check (skip this one)" : key;
    return `<button class="sprint-key ${key === "enter" ? "sprint-key--enter" : ""}" type="button" data-sprint-key="${key}" aria-label="${name}">${label}</button>`;
  }).join("");
  return `
    <div class="sprint-play">
      <div class="sprint-top">
        <p class="sprint-time" id="sprint-time" aria-label="Seconds left">60</p>
        <p class="sprint-score"><span class="sprint-score__right">✓ <span id="sprint-right">0</span></span> <span class="sprint-score__wrong">✗ <span id="sprint-wrong">0</span></span></p>
        <button class="text-button" type="button" data-sprint="quit">Quit</button>
      </div>
      <div class="sprint-bar" aria-hidden="true"><span id="sprint-bar"></span></div>
      <p class="sprint-question" id="sprint-question" aria-live="polite"></p>
      <div class="sprint-pad">${keys}</div>
    </div>`;
}

// Updates the numbers on the screen (without redrawing the buttons)
function showSprint() {
  const question = sprintArea.querySelector("#sprint-question");
  if (!question || !sprint) return;
  const now = Date.now();
  if (now < sprint.startsAt) {
    question.innerHTML = `<span class="sprint-ready">${Math.ceil((sprint.startsAt - now) / 1000)}</span>`;
  } else {
    question.innerHTML = `${sprint.question.text} = <span class="sprint-typed">${sprint.typed || "?"}</span>`;
  }
  sprintArea.querySelector("#sprint-right").textContent = sprint.right;
  sprintArea.querySelector("#sprint-wrong").textContent = sprint.wrong;
}

function tickSprint() {
  if (!sprint || sprint.done) return;
  const now = Date.now();
  const time = sprintArea.querySelector("#sprint-time");
  const bar = sprintArea.querySelector("#sprint-bar");

  if (now < sprint.startsAt) {
    const count = Math.ceil((sprint.startsAt - now) / 1000);
    if (count < sprint.lastBeep) {
      sprint.lastBeep = count;
      sounds.count();
    }
    if (time) time.textContent = SPRINT_SECONDS;
    showSprint();
    return;
  }
  if (sprint.lastBeep > 0) {
    sprint.lastBeep = 0;
    sounds.up(); // go!
    showSprint();
  }

  const left = Math.max(0, sprint.endsAt - now);
  if (time) {
    time.textContent = Math.ceil(left / 1000);
    time.classList.toggle("is-low", left <= 10000);
  }
  if (bar) bar.style.width = `${(left / (SPRINT_SECONDS * 1000)) * 100}%`;
  if (left <= 0) endSprint();
}

function sprintKey(key) {
  if (!sprint || sprint.done || Date.now() < sprint.startsAt) return;
  const answer = sprint.question.answer;

  if (key === "back") sprint.typed = sprint.typed.slice(0, -1);
  else if (key === "enter") {
    if (!sprint.typed) return;
    if (Number(sprint.typed) === answer) sprintRight();
    else {
      // A miss: show the answer for a moment, then move on
      sprint.wrong += 1;
      sprint.missed.push(`${sprint.question.text} = ${answer}`);
      sounds.down();
      flashSprint("is-wrong");
      sprint.question = sprintQuestion(sprint.question);
      sprint.typed = "";
    }
  } else if (sprint.typed.length < 3) {
    sprint.typed += key;
    if (Number(sprint.typed) === answer) sprintRight();
  }
  showSprint();
}

function sprintRight() {
  sprint.right += 1;
  sounds.count();
  flashSprint("is-right");
  sprint.question = sprintQuestion(sprint.question);
  sprint.typed = "";
}

function flashSprint(state) {
  const question = sprintArea.querySelector("#sprint-question");
  if (!question) return;
  question.classList.remove("is-right", "is-wrong");
  void question.offsetWidth; // restarts the animation
  question.classList.add(state);
}

function sprintOwed() {
  return Math.min(sprint.wrong * SPRINT_MISS_JACKS, SPRINT_MOST_JACKS);
}

function endSprint() {
  clearInterval(sprintTicker);
  sprintTicker = null;
  const bestBefore = sprintBest(sprint.mode);
  sprint.done = true;
  sprint.newBest = sprint.right > 0 && (bestBefore === null || sprint.right > bestBefore);
  sprint.entry = logActivity("math", { m: sprint.mode, r: sprint.right, w: sprint.wrong });
  render();
  drawSprint();
  if (sprint.newBest) {
    sounds.fanfare();
    if (bestBefore !== null) confetti();
  } else {
    sounds.finish();
  }
  checkAchievements(true);
  sprintArea.querySelector("[data-sprint='did'], [data-sprint='start']")?.focus();
}

function sprintEndHTML() {
  const owed = sprintOwed();
  const xpGained = trophyStats().xp - sprint.xpBefore;
  const best = sprintBest(sprint.mode);
  const mode = SPRINT_MODES.find((item) => item.id === sprint.mode);
  let penalty = `<p class="penalty-done">🙌 No misses, no penalty!</p>`;
  if (owed && sprint.penaltyDone) penalty = `<p class="penalty-done">💪 Penalty done! +${XP_RULES.penaltyDone} XP for the hard work.</p>`;
  else if (owed) penalty = brainPenaltyHTML(`${owed} jumping jacks`, "sprint", "I did them ✓");

  return `
    <div class="quiz-end">
      <p class="eyebrow">// time's up · ${mode.name}</p>
      <p class="quiz-end__score">${sprint.right}<span> right</span></p>
      <p class="quiz-end__message">${sprint.newBest ? "🎉 NEW BEST!" : `Your best: ${best}. So close!`}</p>
      <ul class="quiz-end__facts">
        <li>${xpGained > 0 ? `+${xpGained} XP` : sprint.right ? "No more sprint XP today (5 a day), but your brain got faster!" : "Get some right next time for XP!"}</li>
        <li>${plural(sprint.wrong, "miss", "misses")}</li>
      </ul>
      ${sprint.missed.length ? `
        <details class="extra quiz-review">
          <summary>The ones you missed</summary>
          <ul>${sprint.missed.map((item) => `<li><strong>${item}</strong></li>`).join("")}</ul>
        </details>` : ""}
      ${penalty}
      <div class="quiz-end__buttons">
        <button class="button" type="button" data-sprint="start">Go again</button>
        <button class="button button--quiet" type="button" data-sprint="close">Change mode</button>
      </div>
    </div>`;
}

sprintArea.addEventListener("click", (event) => {
  const key = event.target.closest("[data-sprint-key]");
  if (key) {
    sprintKey(key.dataset.sprintKey);
    return;
  }
  const mode = event.target.closest("[data-sprint-mode]");
  if (mode) {
    sprintMode = mode.dataset.sprintMode;
    drawSprint();
    sprintArea.querySelector(`[data-sprint-mode="${sprintMode}"]`).focus();
    return;
  }
  const button = event.target.closest("[data-sprint]");
  if (!button) return;
  const action = button.dataset.sprint;

  if (action === "start") {
    startAudio();
    startSprint();
    sprintArea.querySelector(".sprint-key")?.focus();
  }
  if (action === "quit" || action === "close") {
    clearInterval(sprintTicker);
    sprintTicker = null;
    sprint = null;
    drawSprint();
  }
  if (action === "demo" || action === "timer") penaltyButton(action, `${sprintOwed()} jumping jacks`);
  if (action === "did" && sprint && sprint.entry) {
    // Add the penalty to the sprint's log entry, so the reps hit the weekly boss
    sprint.penaltyDone = true;
    sprint.entry.p = 1;
    sprint.entry.reps = sprintOwed();
    save("levelUp.log", JSON.stringify(activityLog));
    stopTimer();
    sounds.done();
    render();
    drawSprint();
    sprintArea.querySelector("[data-sprint='start']")?.focus();
  }
});

// Typing numbers on a keyboard works too
document.addEventListener("keydown", (event) => {
  if (currentTab !== "quiz" || !sprint || sprint.done) return;
  if (event.target.closest && event.target.closest("input, textarea, select")) return;
  let key = null;
  if (/^[0-9]$/.test(event.key)) key = event.key;
  if (event.key === "Backspace") key = "back";
  if (event.key === "Enter") key = "enter";
  if (key) {
    event.preventDefault(); // so Enter doesn't also press a button
    sprintKey(key);
  }
});


/* 5. KOREAN FLASHCARDS --------------------------------------------------
   Flip a card, then say if you knew it. "Again" puts it back in the
   pile so it comes up again. Words you get right are saved as known. */

const FLASH_LENGTH = 10;     // cards in a round
let koreanKnown = new Set(); // the words you know (their Korean writing), saved
let koreanDirection = "ko";  // "ko": see Korean, guess the English. "en": the other way.
let flash = null;            // the round you're playing, or null
const flashArea = document.querySelector("#korean-area");

function saveKorean() {
  saveJSON("levelUp.korean", { known: [...koreanKnown] });
}

function startFlash(onlyNew) {
  const all = KOREAN_TERMS.map((_, i) => i);
  const unknown = quizShuffle(all.filter((i) => !koreanKnown.has(KOREAN_TERMS[i].korean)));
  const known = quizShuffle(all.filter((i) => koreanKnown.has(KOREAN_TERMS[i].korean)));
  // New words first, then some you know (so you don't forget them)
  const deck = onlyNew ? unknown.slice(0, FLASH_LENGTH) : [...unknown, ...known].slice(0, FLASH_LENGTH);
  flash = { deck: quizShuffle(deck), size: deck.length, flipped: false, got: 0, again: 0, learned: 0, xpBefore: trophyStats().xp };
  drawFlash();
  if (koreanDirection === "ko") sayKoreanTerm(KOREAN_TERMS[flash.deck[0]]);
}

function drawFlash() {
  if (!flash) flashArea.innerHTML = flashStartHTML();
  else if (flash.deck.length === 0) flashArea.innerHTML = flashEndHTML();
  else flashArea.innerHTML = flashCardHTML();
}

function flashProgressHTML() {
  const known = KOREAN_TERMS.filter((term) => koreanKnown.has(term.korean)).length;
  return `
    <div class="flash-progress" aria-hidden="true"><span style="width: ${(known / KOREAN_TERMS.length) * 100}%"></span></div>
    <p class="flash-known">You know <strong>${known}</strong> of ${KOREAN_TERMS.length} words.</p>`;
}

function flashStartHTML() {
  const allKnown = KOREAN_TERMS.every((term) => koreanKnown.has(term.korean));
  const directions = [["ko", "Korean → English"], ["en", "English → Korean"]].map(([id, name]) => `
    <button class="lab-chip" type="button" data-flash-direction="${id}" aria-pressed="${id === koreanDirection}">${name}</button>`).join("");
  const list = KOREAN_TERMS.map((term, i) => `
    <li class="flash-list__item">
      <button class="text-button" type="button" data-flash-say="${i}" aria-label="Hear ${escapeHTML(term.say)}">🔊</button>
      <span class="flash-list__korean" lang="ko">${term.korean}</span>
      <span class="flash-list__say">${escapeHTML(term.say)}</span>
      <span class="flash-list__english">${escapeHTML(term.english)}</span>
      <span class="flash-list__known">${koreanKnown.has(term.korean) ? "✓" : ""}</span>
    </li>`).join("");
  return `
    <div class="brain-start">
      ${flashProgressHTML()}
      <div class="lab-chips" role="group" aria-label="Which side do you see first?">${directions}</div>
      <div class="brain-start__buttons">
        <button class="button" type="button" data-flash="start">Start (${FLASH_LENGTH} cards)</button>
        ${allKnown ? "" : `<button class="button button--quiet" type="button" data-flash="new">Just new words</button>`}
      </div>
      <details class="extra flash-all">
        <summary>See all ${KOREAN_TERMS.length} words</summary>
        <ul class="flash-list">${list}</ul>
      </details>
      <p class="quiz-total">Your school might say some words a little differently. Your instructor is always right!</p>
    </div>`;
}

function flashCardHTML() {
  const term = KOREAN_TERMS[flash.deck[0]];
  const done = flash.size - flash.deck.length;
  const korean = `<span class="flash-card__big" lang="ko">${term.korean}</span><span class="flash-card__small">${escapeHTML(term.say)}</span>`;
  const english = `<span class="flash-card__big flash-card__big--english">${escapeHTML(term.english)}</span>`;
  const front = koreanDirection === "ko" ? korean : english;
  const back = koreanDirection === "ko" ? english : korean;
  return `
    <div class="flash-play">
      <div class="quiz-top">
        <p class="quiz-where">🇰🇷 ${plural(flash.deck.length, "card")} left</p>
        <p class="quiz-score" aria-label="${flash.got} known this round">✓ ${flash.got}</p>
        <button class="text-button" type="button" data-flash="quit">Quit</button>
      </div>
      <div class="flash-bar" aria-hidden="true"><span style="width: ${(done / flash.size) * 100}%"></span></div>
      <button class="flash-card ${flash.flipped ? "is-flipped" : ""}" type="button" data-flash="flip" aria-live="polite">
        <span class="flash-card__side">${flash.flipped ? "Answer" : koreanDirection === "ko" ? "What does it mean?" : "How do you say it in Korean?"}</span>
        ${flash.flipped ? `${back}<span class="flash-card__was">${koreanDirection === "ko" ? `${term.korean} · ${escapeHTML(term.say)}` : escapeHTML(term.english)}</span>` : front}
        ${flash.flipped ? "" : `<span class="flash-card__tap">Tap to flip</span>`}
      </button>
      <div class="flash-actions">
        <button class="text-button" type="button" data-flash="say">🔊 Hear it</button>
        ${flash.flipped
          ? `<button class="button button--quiet" type="button" data-flash="again">↺ Again</button>
             <button class="button" type="button" data-flash="got">Got it ✓</button>`
          : `<button class="button" type="button" data-flash="flip">Flip</button>`}
      </div>
    </div>`;
}

function flashEndHTML() {
  const xpGained = trophyStats().xp - flash.xpBefore;
  return `
    <div class="quiz-end">
      <p class="eyebrow">// flashcards done · 잘했어요! (great job!)</p>
      <p class="quiz-end__score">${flash.got}<span> cards</span></p>
      ${flashProgressHTML()}
      <ul class="quiz-end__facts">
        <li>${xpGained > 0 ? `+${xpGained} XP` : "No more flashcard XP today (3 rounds a day), but you still learned!"}</li>
        ${flash.learned ? `<li>${plural(flash.learned, "new word")} learned!</li>` : ""}
        ${flash.again ? `<li>You tried ${plural(flash.again, "card")} again. That's how words stick!</li>` : ""}
      </ul>
      <div class="quiz-end__buttons">
        <button class="button" type="button" data-flash="start">Play again</button>
        <button class="button button--quiet" type="button" data-flash="close">Done</button>
      </div>
    </div>`;
}

flashArea.addEventListener("click", (event) => {
  const sayButton = event.target.closest("[data-flash-say]");
  if (sayButton) {
    sayKoreanTerm(KOREAN_TERMS[Number(sayButton.dataset.flashSay)]);
    return;
  }
  const direction = event.target.closest("[data-flash-direction]");
  if (direction) {
    koreanDirection = direction.dataset.flashDirection;
    drawFlash();
    flashArea.querySelector(`[data-flash-direction="${koreanDirection}"]`).focus();
    return;
  }
  const button = event.target.closest("[data-flash]");
  if (!button) return;
  const action = button.dataset.flash;

  if (action === "start" || action === "new") {
    startFlash(action === "new");
    flashArea.querySelector(".flash-card")?.focus();
    return;
  }
  if (action === "close") {
    flash = null;
    drawFlash();
    return;
  }
  if (!flash || flash.deck.length === 0) return;
  const term = KOREAN_TERMS[flash.deck[0]];

  if (action === "say") sayKoreanTerm(term);
  if (action === "flip") {
    flash.flipped = !flash.flipped;
    if (flash.flipped && koreanDirection === "en") sayKoreanTerm(term);
    drawFlash();
    flashArea.querySelector(flash.flipped ? "[data-flash='got']" : ".flash-card")?.focus();
  }
  if (action === "again" || action === "got") {
    const card = flash.deck.shift();
    flash.flipped = false;
    if (action === "again") {
      flash.again += 1;
      // Back into the pile, a few cards later
      flash.deck.splice(Math.min(3, flash.deck.length), 0, card);
      sounds.down();
    } else {
      flash.got += 1;
      if (!koreanKnown.has(term.korean)) {
        koreanKnown.add(term.korean);
        flash.learned += 1;
        saveKorean();
      }
      sounds.up();
    }

    if (flash.deck.length === 0) {
      logActivity("korean", { n: flash.got, learned: flash.learned });
      render();
      drawFlash();
      sounds.finish();
      checkAchievements(true);
      flashArea.querySelector("[data-flash='start']")?.focus();
      return;
    }
    drawFlash();
    if (koreanDirection === "ko") sayKoreanTerm(KOREAN_TERMS[flash.deck[0]]);
    flashArea.querySelector(".flash-card")?.focus();
  }
  if (action === "quit") {
    flash = null;
    drawFlash();
  }
});


/* 6. MAKE YOUR OWN QUIZ ---------------------------------------------------
   Write questions, then play them in the quiz (they show up as
   "⭐ My questions"). Great for quizzing your sister!               */

const MYQ_MAX = 50; // questions you can save
const MYQ_FIXES = [
  "10 squats", "15 jumping jacks", "8 push-ups", "10 curl-ups", "20-second plank",
  "8 lunges each leg", "20-second wall sit", "20 high knees", "15 calf raises",
  "10 mountain climbers", "5 burpees",
];
let myQuiz = [];          // your questions: { id, q, a: [right answer, wrong answers...], why, fix }
let myQuizEditing = null; // the id of the question you're changing, or null for a new one

const myqForm = document.querySelector("#myq-form");
const myqList = document.querySelector("#myq-list");
document.querySelector("#myq-fix").innerHTML = MYQ_FIXES.map((fix) => `<option>${fix}</option>`).join("");

function saveMyQuiz() {
  saveJSON("levelUp.myQuiz", myQuiz);
}

// Your questions as a quiz subject. Things you typed get made safe for HTML here.
addQuizSubject(() => (myQuiz.length === 0 ? null : {
  id: "mine",
  name: "My questions",
  icon: "⭐",
  info: `${plural(myQuiz.length, "question")} · made by you`,
  questions: myQuiz.map((item) => ({
    q: escapeHTML(item.q),
    a: item.a.map(escapeHTML),
    why: item.why ? escapeHTML(item.why) : "You wrote this one!",
    fix: item.fix,
  })),
}));

function drawMyQuizList() {
  if (myQuiz.length === 0) {
    myqList.innerHTML = `
      <p class="empty-note">No questions yet. Write your first one! Ideas: a question about your favorite animal, a math problem, a soccer rule or a taekwondo word.</p>`;
    return;
  }
  const items = myQuiz.map((item) => `
    <li class="myq-item ${item.id === myQuizEditing ? "is-editing" : ""}">
      <p class="myq-item__q">${escapeHTML(item.q)}</p>
      <p class="myq-item__a"><span class="myq-right">✓ ${escapeHTML(item.a[0])}</span>${item.a.slice(1).map((wrong) => ` <span class="myq-wrong">✗ ${escapeHTML(wrong)}</span>`).join("")}</p>
      <p class="myq-item__fix">If you get it wrong: ${escapeHTML(item.fix)}</p>
      <div class="myq-item__buttons">
        <button class="text-button" type="button" data-myq-edit="${item.id}">Edit</button>
        <button class="text-button" type="button" data-myq-delete="${item.id}">Delete</button>
      </div>
    </li>`).join("");
  myqList.innerHTML = `
    <div class="myq-head">
      <p class="myq-count">${myQuiz.length} of ${MYQ_MAX} questions</p>
      <button class="button" type="button" data-myq-play>▶ Play my quiz</button>
    </div>
    <ol class="myq-list">${items}</ol>`;
}

function myqField(id) {
  return document.querySelector(`#${id}`);
}

function fillMyQuizForm(item) {
  myqField("myq-q").value = item ? item.q : "";
  myqField("myq-right").value = item ? item.a[0] : "";
  ["myq-wrong1", "myq-wrong2", "myq-wrong3"].forEach((id, i) => {
    myqField(id).value = item && item.a[i + 1] ? item.a[i + 1] : "";
  });
  myqField("myq-why").value = item ? item.why || "" : "";
  myqField("myq-fix").value = item ? item.fix : MYQ_FIXES[0];
  myqForm.querySelector("[type='submit']").textContent = item ? "Save changes" : "Save question";
  document.querySelector("#myq-cancel").hidden = !item;
}

function myqNote(text) {
  document.querySelector("#myq-note").textContent = text;
}

myqForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const q = myqField("myq-q").value.trim();
  const right = myqField("myq-right").value.trim();
  const wrongs = ["myq-wrong1", "myq-wrong2", "myq-wrong3"].map((id) => myqField(id).value.trim()).filter(Boolean);
  const why = myqField("myq-why").value.trim();
  const fix = MYQ_FIXES.includes(myqField("myq-fix").value) ? myqField("myq-fix").value : MYQ_FIXES[0];

  if (!q || !right) {
    myqNote("Write a question and its right answer first.");
    myqField(q ? "myq-right" : "myq-q").focus();
    return;
  }
  if (wrongs.length === 0) {
    myqNote("Add at least one wrong answer, so there's something to pick from!");
    myqField("myq-wrong1").focus();
    return;
  }
  const answers = [right, ...wrongs].map((answer) => answer.toLowerCase());
  if (new Set(answers).size !== answers.length) {
    myqNote("Two of the answers are the same. Make each one different!");
    return;
  }

  const editing = myQuiz.find((item) => item.id === myQuizEditing);
  if (editing) {
    Object.assign(editing, { q, a: [right, ...wrongs], why, fix });
    myQuizEditing = null;
    myqNote("Changes saved! ✓");
  } else {
    if (myQuiz.length >= MYQ_MAX) {
      myqNote(`You have ${MYQ_MAX} questions, the most you can save. Delete one to add another.`);
      return;
    }
    myQuiz.push({ id: makeId(), q, a: [right, ...wrongs], why, fix });
    logActivity("myq");
    myqNote("Saved! ⭐ Play it in the quiz above: pick \"My questions\".");
  }
  saveMyQuiz();
  fillMyQuizForm(null);
  sounds.done();
  render();
  checkAchievements(true);
  myqField("myq-q").focus();
});

document.querySelector("#myq-cancel").addEventListener("click", () => {
  myQuizEditing = null;
  fillMyQuizForm(null);
  myqNote("");
  drawMyQuizList();
});

myqList.addEventListener("click", (event) => {
  const edit = event.target.closest("[data-myq-edit]");
  if (edit) {
    const item = myQuiz.find((question) => question.id === edit.dataset.myqEdit);
    if (!item) return;
    myQuizEditing = item.id;
    fillMyQuizForm(item);
    myqNote("Change anything you like, then save.");
    drawMyQuizList();
    myqField("myq-q").focus();
    return;
  }
  const remove = event.target.closest("[data-myq-delete]");
  if (remove) {
    const item = myQuiz.find((question) => question.id === remove.dataset.myqDelete);
    if (!item || !confirm(`Delete this question?\n\n"${item.q}"`)) return;
    myQuiz = myQuiz.filter((question) => question !== item);
    if (myQuizEditing === item.id) {
      myQuizEditing = null;
      fillMyQuizForm(null);
    }
    saveMyQuiz();
    myqNote("Deleted.");
    render();
    return;
  }
  if (event.target.closest("[data-myq-play]")) {
    startAudio();
    startQuiz("mine");
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.querySelector("#quiz-panel").scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
    document.querySelector(".quiz-answer")?.focus({ preventScroll: true });
  }
});


/* 7. HOMEWORK TIMER ---------------------------------------------------
   Focus for 15, 20 or 25 minutes, then take a 5-minute move break.
   It uses the real clock, so it keeps the right time even if you
   switch tabs (and it remembers where it was if you reload).       */

const FOCUS_CHOICES = [15, 20, 25]; // minutes
const FOCUS_BREAK = 5;              // minutes
const MOVE_BREAKS = [
  "20 jumping jacks, then 10 big arm circles",
  "Dance to your favorite song!",
  "10 squats and 10 calf raises",
  "Get a glass of water and drink it all 💧",
  "Touch your toes for 20 seconds, then reach for the sky",
  "5 front kicks (ap chagi!) with each leg",
  "Juggle a balloon or soccer ball for 1 minute",
  "Walk around your home 2 times",
  "10 high knees and 10 butt kicks, 2 times",
  "Hold a plank for 20 seconds, 2 times",
  "Wall sit for 30 seconds",
  "Shake out your arms and legs like wiggly spaghetti for 30 seconds",
  "Look out a window at something far away for 20 seconds (it rests your eyes)",
  "Practice your stance: 10 bounces in fighting stance",
];
const FOCUS_TIPS = [
  "Put your phone or tablet face down (unless it's running this timer!).",
  "Get a glass of water ready before you start.",
  "Do the hardest part first, while your brain is fresh.",
  "Stuck on a question? Circle it and come back later.",
  "Clear your desk so only your homework is on it.",
];
const PAGE_TITLE = document.title;
let focusMinutes = 25;
let focusTimer = null;   // { phase: "focus", "break" or "over", minutes, endsAt, pausedLeft, move }
let focusTicker = null;
let focusLoaded = false; // read the saved timer yet?
const focusArea = document.querySelector("#focus-area");

function saveFocusTimer() {
  save("levelUp.focusNow", JSON.stringify(focusTimer)); // just on this device
}

function focusTimerRunning() {
  return Boolean(focusTimer && focusTimer.phase !== "over" && !focusTimer.pausedLeft);
}

// Picks up a timer that was running when the page closed
function resumeFocusOnce() {
  if (focusLoaded) return;
  focusLoaded = true;
  focusTimer = loadJSON("levelUp.focusNow", null);
  if (!focusTimer || !focusTimer.phase) {
    focusTimer = null;
    return;
  }
  // Left over from hours ago? Start fresh.
  if (focusTimer.endsAt && Date.now() - focusTimer.endsAt > 2 * 60 * 60 * 1000) {
    focusTimer = null;
    saveFocusTimer();
    return;
  }
  focusMinutes = focusTimer.minutes || focusMinutes;
  startFocusTicker();
}

function startFocusTicker() {
  clearInterval(focusTicker);
  focusTicker = setInterval(tickFocus, 500);
  tickFocus();
}

function startFocus() {
  focusTimer = {
    phase: "focus",
    minutes: focusMinutes,
    endsAt: Date.now() + focusMinutes * 60 * 1000,
    pausedLeft: 0,
    tip: FOCUS_TIPS[Math.floor(Math.random() * FOCUS_TIPS.length)],
  };
  saveFocusTimer();
  keepScreenOn();
  say(`Focus time! ${focusMinutes} minutes. You've got this.`);
  drawFocus();
  startFocusTicker();
}

function stopFocus() {
  clearInterval(focusTicker);
  focusTicker = null;
  focusTimer = null;
  saveFocusTimer();
  document.title = PAGE_TITLE;
  letScreenSleep();
  drawFocus();
}

function tickFocus() {
  if (!focusTimer || focusTimer.phase === "over") return;
  if (focusTimer.pausedLeft) {
    showFocusTime(focusTimer.pausedLeft);
    return;
  }
  const left = focusTimer.endsAt - Date.now();
  if (left > 0) {
    showFocusTime(left);
    return;
  }

  if (focusTimer.phase === "focus") {
    // Focus done! Time to move.
    logActivity("focus", { m: focusTimer.minutes });
    focusTimer.phase = "break";
    focusTimer.endsAt += FOCUS_BREAK * 60 * 1000;
    focusTimer.move = MOVE_BREAKS[Math.floor(Math.random() * MOVE_BREAKS.length)];
    saveFocusTimer();
    sounds.fanfare();
    say(`Great focus! Move break: ${focusTimer.move}`);
    render();
    drawFocus();
    checkAchievements(true);
    tickFocus(); // in case the break is already over too (if the page was closed)
    return;
  }

  // The break is over
  focusTimer.phase = "over";
  saveFocusTimer();
  clearInterval(focusTicker);
  focusTicker = null;
  document.title = PAGE_TITLE;
  letScreenSleep();
  sounds.finish();
  say("Break's over! Ready for another round?");
  drawFocus();
}

function showFocusTime(left) {
  const time = formatTime(Math.ceil(left / 1000));
  const length = (focusTimer.phase === "focus" ? focusTimer.minutes : FOCUS_BREAK) * 60 * 1000;
  const label = focusTimer.phase === "focus" ? "Focus" : "Move break";
  document.title = `${time} · ${label} · Level Up`;
  const display = focusArea.querySelector("#focus-time");
  if (display) display.textContent = time;
  const ring = focusArea.querySelector(".focus-ring");
  if (ring) ring.style.setProperty("--done", String(Math.min(1, Math.max(0, 1 - left / length))));
}

function focusTodayHTML() {
  const sessions = logOf("focus");
  const todays = sessions.filter((entry) => entry.d === toKey(today));
  const minutes = sessions.reduce((sum, entry) => sum + (entry.m || 0), 0);
  if (sessions.length === 0) return "Finish a focus round for +25 XP.";
  return `Today: ${plural(todays.length, "focus round")} · All time: ${plural(sessions.length, "round")} (${minutes} minutes!)`;
}

function drawFocus() {
  if (!focusTimer) {
    const choices = FOCUS_CHOICES.map((minutes) => `
      <button class="lab-chip" type="button" data-focus-minutes="${minutes}" aria-pressed="${minutes === focusMinutes}">${minutes} min</button>`).join("");
    focusArea.innerHTML = `
      <div class="brain-start">
        <p class="brain-start__text">How long do you want to focus?</p>
        <div class="lab-chips" role="group" aria-label="Focus time">${choices}</div>
        <button class="button" type="button" data-focus="start">📚 Start focusing</button>
        <p class="quiz-total">${focusTodayHTML()}</p>
      </div>`;
    return;
  }

  if (focusTimer.phase === "over") {
    focusArea.innerHTML = `
      <div class="focus">
        <p class="focus__phase">✅ Round done!</p>
        <p class="focus__message">Nice work. Ready for another round, or all done?</p>
        <div class="brain-start__buttons">
          <button class="button" type="button" data-focus="again">Another ${focusTimer.minutes} minutes</button>
          <button class="button button--quiet" type="button" data-focus="stop">I'm all done 🎉</button>
        </div>
        <p class="quiz-total">${focusTodayHTML()}</p>
      </div>`;
    return;
  }

  const onBreak = focusTimer.phase === "break";
  focusArea.innerHTML = `
    <div class="focus ${onBreak ? "is-break" : ""}">
      <p class="focus__phase">${onBreak ? "🤸 Move break!" : "📚 Focus time"}</p>
      <div class="focus-ring" style="--done: 0"><p class="focus__time" id="focus-time" role="timer">--:--</p></div>
      <p class="focus__message">${onBreak ? `<strong>${escapeHTML(focusTimer.move)}</strong>` : escapeHTML(focusTimer.tip || FOCUS_TIPS[0])}</p>
      <div class="brain-start__buttons">
        <button class="button button--quiet" type="button" data-focus="pause">${focusTimer.pausedLeft ? "▶️ Keep going" : "⏸️ Pause"}</button>
        <button class="text-button" type="button" data-focus="${onBreak ? "skip" : "stop"}">${onBreak ? "Skip the break" : "Stop"}</button>
      </div>
    </div>`;
  tickFocus();
}

focusArea.addEventListener("click", (event) => {
  const choice = event.target.closest("[data-focus-minutes]");
  if (choice) {
    focusMinutes = Number(choice.dataset.focusMinutes);
    drawFocus();
    focusArea.querySelector(`[data-focus-minutes="${focusMinutes}"]`).focus();
    return;
  }
  const button = event.target.closest("[data-focus]");
  if (!button) return;
  const action = button.dataset.focus;

  if (action === "start" || action === "again") {
    startAudio();
    if (focusTimer) focusMinutes = focusTimer.minutes;
    startFocus();
  }
  if (action === "pause" && focusTimer) {
    if (focusTimer.pausedLeft) {
      focusTimer.endsAt = Date.now() + focusTimer.pausedLeft;
      focusTimer.pausedLeft = 0;
    } else {
      focusTimer.pausedLeft = Math.max(1000, focusTimer.endsAt - Date.now());
    }
    saveFocusTimer();
    drawFocus();
    focusArea.querySelector("[data-focus='pause']").focus();
  }
  if (action === "skip" && focusTimer) {
    focusTimer.endsAt = Date.now();
    focusTimer.pausedLeft = 0;
    tickFocus();
  }
  if (action === "stop") {
    if (focusTimer && focusTimer.phase === "focus" && !confirm("Stop this focus round? It won't count yet.")) return;
    stopFocus();
  }
});


/* 8. PLUGGING IN (see hooks.js) ---------------------------------------- */

function drawBrain() {
  drawFact();
  if (!bee || bee.index >= bee.words.length) drawBee(); // never in the middle of a word (you might be typing!)
  if (!sprint || sprint.done) drawSprint();
  if (!flash) drawFlash();
  drawMyQuizList();
  drawFocus();
}

addPagePart("quiz", drawBrain);
addPagePart(null, resumeFocusOnce);

addSavedData("levelUp.korean", () => {
  const saved = loadJSON("levelUp.korean", {});
  koreanKnown = new Set(Array.isArray(saved.known) ? saved.known : []);
});
addSavedData("levelUp.myQuiz", () => {
  const saved = loadJSON("levelUp.myQuiz", []);
  myQuiz = Array.isArray(saved)
    ? saved.filter((item) => item && item.id && item.q && Array.isArray(item.a) && item.a.length >= 2)
    : [];
});

addXP("bee", (e) => e.r * XP_RULES.quizRight + (e.p || 0) * XP_RULES.penaltyDone, 3);
addXP("math", (e) => Math.min(e.r * 2, 100) + (e.p ? XP_RULES.penaltyDone : 0), 5);
addXP("korean", (e) => 15 + (e.learned || 0) * 5, 3);
addXP("myq", () => 5, 3);
addXP("focus", () => 25, 4);

addXPRule("Spell a word right", `+${XP_RULES.quizRight}`);
addXPRule("Times-Table Sprint", "+2 per answer");
addXPRule("Korean flashcards", "+15, +5 per new word");
addXPRule("Write a quiz question", "+5");
addXPRule("Homework focus round", "+25");

addBadge({ id: "speller", icon: "🐝", name: "Spelling Champ", how: "Spell 10 out of 10 in the Spelling Bee", earned: () => logOf("bee").some((e) => e.n >= 10 && e.r === e.n) });
addBadge({ id: "mathMachine", icon: "🧮", name: "Math Machine", how: "25 right in one Times-Table Sprint", earned: () => logOf("math").some((e) => e.r >= 25) });
addBadge({ id: "korean", icon: "🇰🇷", name: "Korean Speaker", how: "Know 20 taekwondo words in Korean", earned: () => koreanKnown.size >= 20 });
addBadge({ id: "quizMaker", icon: "✏️", name: "Quiz Maker", how: "Write 5 of your own quiz questions", earned: () => logOf("myq").length >= 5 });
addBadge({ id: "focus", icon: "📚", name: "Focus Master", how: "Finish 10 homework focus rounds", earned: () => logOf("focus").length >= 10 });
