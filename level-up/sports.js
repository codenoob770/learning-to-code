/* =============================================================
   sports.js: the Sports tab
   -------------------------------------------------------------
   1. Taekwondo belt tracker (and counting in Korean)
   2. Swim School: the skills you learn in lessons, and a lesson log
   3. Soccer journal: your games, goals and assists
   4. Build your own workout (the voice coach runs it)

   Swim lessons, soccer games and your own workouts go in the
   activity log (app.js), so they earn XP and hit the weekly boss.

   This file loads before app.js, so it only uses app.js's
   functions inside its own functions, never right away.
   ============================================================= */


/* 1. TAEKWONDO BELT TRACKER ------------------------------------------
   The belts in the same order as MY school. "colors" has two colors
   for a striped belt (the second color is the stripe), and "split"
   means half and half, like the red and black junior black belt.  */

const BELTS = [
  { name: "White", colors: ["#f4f4f4"] },
  { name: "Yellow", colors: ["#f7d531"] },
  { name: "Purple", colors: ["#8a5cc9"] },
  { name: "Orange", colors: ["#f39a2b"] },
  { name: "Green", colors: ["#3aa655"] },
  { name: "Blue", colors: ["#3f7fe0"] },
  { name: "Brown", colors: ["#8a5a32"] },
  { name: "Brown-white", colors: ["#8a5a32", "#f4f4f4"], hint: "brown with a white stripe" },
  { name: "Red", colors: ["#d93838"] },
  { name: "Red-white", colors: ["#d93838", "#f4f4f4"], hint: "red with a white stripe" },
  { name: "Junior black belt", colors: ["#d93838", "#151515"], split: true, hint: "red and black" },
];

// "Green belt", but "Junior black belt" (it already says belt)
function beltName(index) {
  const name = BELTS[index].name;
  return /belt$/i.test(name) ? name : `${name} belt`;
}

// The belt list used to be in a different order. This moves an old save
// to the new list (once), so nobody's belt changes color by accident.
function upgradeBeltData() {
  if (beltData.v === 2) return;
  const oldToNew = [0, 1, 3, 4, 2, 5, 6, 8, 10, 10]; // old White, Yellow, Orange, Green, Purple, Blue, Brown, Red, Red-black, Black
  beltData.belt = oldToNew[beltData.belt] ?? 0;
  beltData.history = (beltData.history || []).map((h) => ({ ...h, belt: oldToNew[h.belt] ?? h.belt }));
  beltData.v = 2;
  saveJSON("levelUp.belt", beltData);
}

// What most schools test for. You can add your own too!
const BELT_CHECKLIST = [
  { id: "form", text: "Know my form (poomsae) for the next belt" },
  { id: "kicks", text: "Front, roundhouse and side kicks with good technique" },
  { id: "count", text: "Count to 10 in Korean (practice below!)" },
  { id: "break", text: "Board break" },
  { id: "spar", text: "Sparring (kyorugi) basics" },
  { id: "defense", text: "Self-defense moves" },
];

// Counting in Korean, the way it's done in taekwondo class
const KOREAN_NUMBERS = [
  ["하나", "hana"], ["둘", "dul"], ["셋", "set"], ["넷", "net"], ["다섯", "daseot"],
  ["여섯", "yeoseot"], ["일곱", "ilgop"], ["여덟", "yeodeol"], ["아홉", "ahop"], ["열", "yeol"],
];

function beltSVG(belt) {
  const [main, second] = belt.colors;
  // A split belt is half one color (top) and half the other (bottom).
  // A striped belt has a stripe of the second color down the middle.
  const body = belt.split
    ? `<path d="M8 22 H152 V30 H8 Z" style="fill: ${main}"/><path d="M8 30 H152 V38 H8 Z" style="fill: ${second}"/>`
    : `<path d="M8 22 H152 V38 H8 Z" style="fill: ${main}"/>${second ? `<path d="M8 28 H152 V32 H8 Z" style="fill: ${second}"/>` : ""}`;
  const rightTail = belt.split ? second : main;
  return `
    <svg class="belt" viewBox="0 0 160 70" aria-hidden="true">
      ${body}
      <path d="M70 18 H90 V42 H70 Z" style="fill: ${main}" class="belt__knot"/>
      <path d="M74 40 L62 66 L72 66 L80 44 Z" style="fill: ${main}" class="belt__knot"/>
      <path d="M86 40 L98 66 L88 66 L80 44 Z" style="fill: ${rightTail}" class="belt__knot"/>
      ${second && !belt.split ? `<path d="M68.5 52 L77.1 52 L75.3 57 L66.2 57 Z M82.9 52 L91.5 52 L93.8 57 L84.7 57 Z" style="fill: ${second}"/>` : ""}
    </svg>`;
}

function renderBelt() {
  upgradeBeltData();
  const belt = BELTS[beltData.belt] || BELTS[0];
  const next = BELTS[beltData.belt + 1];
  const area = document.querySelector("#belt-area");

  let countdown = "Ask your instructor when your next belt test is, and put the date here.";
  if (beltData.test) {
    const days = daysBetween(today, fromKey(beltData.test));
    if (days > 1) countdown = `🗓️ ${days} days until your belt test!`;
    if (days === 1) countdown = "🗓️ Your belt test is TOMORROW! Get a good night's sleep.";
    if (days === 0) countdown = "🥋 Belt test day! You've got this!";
    if (days < 0) countdown = "How did your test go? If you passed, tap the button below!";
  }

  const items = [...BELT_CHECKLIST, ...beltData.custom];
  const done = items.filter((item) => beltData.checks.includes(item.id)).length;
  const history = beltData.history.map((h) => `<li>${beltName(h.belt)} · ${shortDate(fromKey(h.d))}</li>`).join("");

  area.innerHTML = `
    <div class="belt-now">
      ${beltSVG(belt)}
      <div>
        <label class="field-label" for="belt-pick">My belt</label>
        <select class="select" id="belt-pick">
          ${BELTS.map((b, i) => `<option value="${i}" ${i === beltData.belt ? "selected" : ""}>${b.name}${b.hint ? ` (${b.hint})` : ""}</option>`).join("")}
        </select>
      </div>
    </div>
    ${next ? `
      <div class="belt-next">
        <p class="belt-next__title">Next: <strong>${beltName(beltData.belt + 1)}</strong>${next.hint ? ` (${next.hint})` : ""}</p>
        <label class="field-label" for="belt-test">Belt test date</label>
        <input class="input" id="belt-test" type="date" value="${beltData.test}">
        <p class="belt-countdown">${countdown}</p>
      </div>
      <p class="field-label">Get ready: ${done} of ${items.length}</p>
      <ul class="belt-list">
        ${items.map((item) => `
          <li class="belt-item">
            <input type="checkbox" id="belt-${item.id}" data-belt-check="${item.id}" ${beltData.checks.includes(item.id) ? "checked" : ""}>
            <label for="belt-${item.id}">${escapeHTML(item.text)}</label>
            ${item.custom ? `<button class="text-button" type="button" data-belt-remove="${item.id}" aria-label="Remove ${escapeHTML(item.text)}">✕</button>` : ""}
          </li>`).join("")}
      </ul>
      <form class="inline-form" id="belt-add">
        <label class="visually-hidden" for="belt-add-text">Add something to practice</label>
        <input class="input" id="belt-add-text" type="text" maxlength="80" placeholder="Add something your school tests...">
        <button class="text-button" type="submit">Add</button>
      </form>
      <button class="button" type="button" data-belt="passed">🎉 I passed! I'm a ${beltName(beltData.belt + 1).toLowerCase()}</button>`
    : `<p class="belt-countdown">🥋 ${beltName(beltData.belt)}! That's amazing. Keep training and helping others learn.</p>`}
    ${history ? `<details class="extra"><summary>My belt history</summary><ul>${history}</ul></details>` : ""}
    <div class="korean">
      <p class="field-label">Count in Korean (tap to hear it)</p>
      <div class="korean__numbers">
        ${KOREAN_NUMBERS.map(([hangul, sound], i) => `
          <button class="korean__number" type="button" data-korean="${i}">
            <span class="korean__digit">${i + 1}</span>
            <span class="korean__sound">${sound}</span>
          </button>`).join("")}
      </div>
    </div>`;
}

function saveBelt() {
  saveJSON("levelUp.belt", beltData);
}

const beltArea = document.querySelector("#belt-area");

beltArea.addEventListener("change", (event) => {
  if (event.target.id === "belt-pick") {
    beltData.belt = Number(event.target.value);
    beltData.checks = [];
    saveBelt();
    render();
    showToast(`${beltName(beltData.belt)}! 🥋`);
  }
  if (event.target.id === "belt-test") {
    beltData.test = event.target.value;
    saveBelt();
    render();
  }
  const check = event.target.closest("[data-belt-check]");
  if (check) {
    const id = check.dataset.beltCheck;
    beltData.checks = check.checked ? [...beltData.checks, id] : beltData.checks.filter((c) => c !== id);
    saveBelt();
    render();
    if (check.checked) sounds.done();
    document.querySelector(`#belt-${id}`)?.focus();
  }
});

beltArea.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.querySelector("#belt-add-text");
  const text = input.value.trim();
  if (!text) return;
  beltData.custom.push({ id: `c${makeId()}`, text, custom: true });
  saveBelt();
  render();
  document.querySelector("#belt-add-text").focus();
});

beltArea.addEventListener("click", (event) => {
  const remove = event.target.closest("[data-belt-remove]");
  if (remove) {
    beltData.custom = beltData.custom.filter((item) => item.id !== remove.dataset.beltRemove);
    saveBelt();
    render();
  }

  const korean = event.target.closest("[data-korean]");
  if (korean) sayKorean(Number(korean.dataset.korean));

  if (event.target.closest("[data-belt='passed']") && BELTS[beltData.belt + 1]) {
    beltData.belt += 1;
    beltData.history.push({ belt: beltData.belt, d: toKey(today) });
    beltData.checks = [];
    beltData.test = "";
    saveBelt();
    render();
    sounds.fanfare();
    confetti();
    showToast(`Congratulations, ${beltName(beltData.belt).toLowerCase()}! +${XP_RULES.beltUp} XP 🥋`);
    checkAchievements(true);
  }
});

// Says a Korean number out loud, with a Korean voice if this device has one
function sayKorean(i) {
  if (!("speechSynthesis" in window)) {
    showToast(`${i + 1} is "${KOREAN_NUMBERS[i][1]}"`);
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const words = new SpeechSynthesisUtterance(KOREAN_NUMBERS[i][0]);
    words.lang = "ko-KR";
    words.rate = 0.85;
    const korean = window.speechSynthesis.getVoices().find((voice) => voice.lang.startsWith("ko"));
    if (korean) words.voice = korean;
    window.speechSynthesis.speak(words);
  } catch (error) {
    showToast(`${i + 1} is "${KOREAN_NUMBERS[i][1]}"`);
  }
}


/* 2. SWIM SCHOOL ------------------------------------------------------
   For swim lessons: check off each skill when you can do it, and log
   your lessons ("today we worked on butterfly arms!"). Want to add a
   skill your swim school teaches? Add a line to a list below. Every
   id has to be different from all the others.                       */

const SWIM_SKILLS = [
  {
    stroke: "Basics",
    icon: "💧",
    skills: [
      { id: "sw-bubbles", text: "Blow bubbles: breathe out slowly underwater" },
      { id: "sw-float-back", text: "Float on my back for 10 seconds" },
      { id: "sw-float-front", text: "Starfish float on my front for 10 seconds" },
      { id: "sw-streamline", text: "Push off the wall in a tight streamline" },
      { id: "sw-tread", text: "Tread water for 30 seconds" },
    ],
  },
  {
    stroke: "Freestyle",
    icon: "🏊",
    skills: [
      { id: "sw-free-kick", text: "Flutter kick with long, straight legs" },
      { id: "sw-free-arms", text: "Freestyle arms: reach long, pull back to my hip" },
      { id: "sw-free-breath", text: "Side breathing (one goggle stays in the water)" },
      { id: "sw-free-both", text: "Breathe on both sides (every 3 strokes)" },
      { id: "sw-free-full", text: "Swim full freestyle for one length" },
    ],
  },
  {
    stroke: "Backstroke",
    icon: "🌊",
    skills: [
      { id: "sw-back-kick", text: "Flutter kick on my back, tummy up" },
      { id: "sw-back-arms", text: "Backstroke arms: pinky finger goes in first" },
      { id: "sw-back-head", text: "Keep my head still and look straight up" },
      { id: "sw-back-full", text: "Swim full backstroke for one length" },
    ],
  },
  {
    stroke: "Breaststroke",
    icon: "🐸",
    skills: [
      { id: "sw-breast-kick", text: "Frog kick: heels to my bottom, then kick out and around" },
      { id: "sw-breast-arms", text: "Breaststroke arms: pull, breathe, shoot forward" },
      { id: "sw-breast-timing", text: "Timing: pull, breathe, kick, glide" },
      { id: "sw-breast-full", text: "Swim full breaststroke for one length" },
    ],
  },
  {
    stroke: "Butterfly",
    icon: "🦋",
    skills: [
      { id: "sw-fly-kick", text: "Dolphin kick: legs together, kick from the hips" },
      { id: "sw-fly-arms", text: "Butterfly arms: both arms together, like a keyhole" },
      { id: "sw-fly-breath", text: "Breathe by pushing my chin forward, not up" },
      { id: "sw-fly-timing", text: "Two kicks for every arm pull" },
      { id: "sw-fly-full", text: "Swim full butterfly for one length" },
    ],
  },
  {
    stroke: "Turns & starts",
    icon: "🔄",
    skills: [
      { id: "sw-open-turn", text: "Open turn: touch with two hands (breaststroke and butterfly)" },
      { id: "sw-flip-turn", text: "Flip turn on freestyle" },
      { id: "sw-back-start", text: "Backstroke start from the wall" },
      { id: "sw-dive", text: "Dive in (only where my instructor says it's deep enough!)" },
    ],
  },
];

let lessonForm = { strokes: [], stars: 3 }; // the "log a lesson" form, before you save it

function swimSkillsLearned() {
  if (!Array.isArray(swimData.skills)) swimData.skills = [];
  return swimData.skills;
}

// Every swim skill, in one list
function allSwimSkills() {
  return SWIM_SKILLS.flatMap((group) => group.skills);
}

function renderSwim() {
  const learned = swimSkillsLearned();
  const lessons = logOf("swimLesson").sort((a, b) => (a.d < b.d ? -1 : 1));
  const total = allSwimSkills().length;
  const latest = lessons[lessons.length - 1];
  const workingOn = latest && latest.strokes.length ? ` · Working on: ${latest.strokes.join(", ")}` : "";
  document.querySelector("#swim-total").textContent =
    `${lessons.length} ${lessons.length === 1 ? "lesson" : "lessons"} logged · ${learned.length} of ${total} skills learned${workingOn}`;

  // The "log a lesson" form
  document.querySelector("#lesson-strokes").innerHTML = SWIM_SKILLS.map((group) => `
    <button class="lab-chip" type="button" data-lesson-stroke="${group.stroke}" aria-pressed="${lessonForm.strokes.includes(group.stroke)}">
      <span aria-hidden="true">${group.icon}</span> ${group.stroke}
    </button>`).join("");
  document.querySelectorAll("[data-lesson-stars]").forEach((b) => {
    b.setAttribute("aria-pressed", String(Number(b.dataset.lessonStars) === lessonForm.stars));
    b.classList.toggle("is-lit", Number(b.dataset.lessonStars) <= lessonForm.stars);
  });
  const dateInput = document.querySelector("#lesson-date");
  if (!dateInput.value) dateInput.value = toKey(today);

  // One card for each stroke, with its skills to check off
  const box = document.querySelector("#swim-skills");
  const openCards = [...box.querySelectorAll("details[open]")].map((d) => d.dataset.stroke);
  box.innerHTML = SWIM_SKILLS.map((group) => {
    const done = group.skills.filter((skill) => learned.includes(skill.id)).length;
    const open = openCards.length ? openCards.includes(group.stroke) : (latest ? latest.strokes.includes(group.stroke) : group.stroke === "Butterfly");
    return `
      <details class="stroke-card ${done === group.skills.length ? "is-done" : ""}" data-stroke="${group.stroke}" ${open ? "open" : ""}>
        <summary>
          <span class="stroke-card__icon" aria-hidden="true">${group.icon}</span>
          <span class="stroke-card__name">${group.stroke}</span>
          <span class="stroke-card__count">${done === group.skills.length ? "✓ All done!" : `${done}/${group.skills.length}`}</span>
        </summary>
        <ul class="belt-list">
          ${group.skills.map((skill) => `
            <li class="belt-item">
              <input type="checkbox" id="skill-${skill.id}" data-swim-skill="${skill.id}" ${learned.includes(skill.id) ? "checked" : ""}>
              <label for="skill-${skill.id}">${skill.text}</label>
            </li>`).join("")}
        </ul>
      </details>`;
  }).join("");

  // Recent lessons, newest first, with delete buttons
  document.querySelector("#swim-recent").innerHTML = lessons.slice(-6).reverse().map((lesson) => `
    <li class="game">
      <span class="game__text">${shortDate(fromKey(lesson.d))}: ${lesson.strokes.length ? lesson.strokes.join(", ") : "Swim lesson"} · ${"⭐".repeat(lesson.stars)}${lesson.note ? `<br><em>${escapeHTML(lesson.note)}</em>` : ""}</span>
      <button class="text-button" type="button" data-log-delete="${lesson.id}" aria-label="Delete this lesson">✕</button>
    </li>`).join("") || `<li class="swim-bests__empty">No lessons logged yet. Log your next one!</li>`;
}

document.querySelector("#swim").addEventListener("click", (event) => {
  const stroke = event.target.closest("[data-lesson-stroke]");
  if (stroke) {
    const name = stroke.dataset.lessonStroke;
    lessonForm.strokes = lessonForm.strokes.includes(name) ? lessonForm.strokes.filter((s) => s !== name) : [...lessonForm.strokes, name];
    renderSwim();
    document.querySelector(`[data-lesson-stroke="${name}"]`).focus();
  }
  const stars = event.target.closest("[data-lesson-stars]");
  if (stars) {
    lessonForm.stars = Number(stars.dataset.lessonStars);
    renderSwim();
  }
});

// Checking off a skill
document.querySelector("#swim-skills").addEventListener("change", (event) => {
  const box = event.target.closest("[data-swim-skill]");
  if (!box) return;
  const id = box.dataset.swimSkill;
  const learned = swimSkillsLearned();
  swimData.skills = box.checked ? [...learned, id] : learned.filter((s) => s !== id);
  saveJSON("levelUp.swim", swimData);
  render();
  if (box.checked) {
    const group = SWIM_SKILLS.find((g) => g.skills.some((skill) => skill.id === id));
    if (group.skills.every((skill) => swimData.skills.includes(skill.id))) {
      sounds.fanfare();
      confetti();
      showToast(`You learned ALL of ${group.stroke}! ${group.icon}`);
    } else {
      sounds.done();
      showToast(`New skill! +${XP_RULES.swimSkill} XP ${group.icon}`);
    }
  }
  checkAchievements(true);
  document.querySelector(`#skill-${id}`)?.focus();
});

// Logging a lesson
document.querySelector("#lesson-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const date = document.querySelector("#lesson-date").value || toKey(today);
  const note = document.querySelector("#lesson-note").value.trim().slice(0, 120);
  logActivity("swimLesson", { id: makeId(), d: date, strokes: [...lessonForm.strokes], note, stars: lessonForm.stars, reps: 40 });
  lessonForm = { strokes: [], stars: 3 };
  document.querySelector("#lesson-note").value = "";
  sounds.done();
  showToast(`Lesson saved! +${XP_RULES.swimLesson} XP 🏊`);
  render();
  checkAchievements(true);
});


/* 3. SOCCER JOURNAL ----------------------------------------------------- */

let soccerForm = { g: 0, a: 0, res: "W", stars: 3 }; // the form, before you save it

function renderSoccer() {
  const games = logOf("soccer").sort((a, b) => (a.d < b.d ? -1 : 1));
  const goals = games.reduce((sum, g) => sum + g.g, 0);
  const assists = games.reduce((sum, g) => sum + g.a, 0);
  const wins = games.filter((g) => g.res === "W").length;
  const draws = games.filter((g) => g.res === "D").length;
  const losses = games.filter((g) => g.res === "L").length;

  document.querySelector("#soccer-stats").innerHTML = [
    ["Games", games.length],
    ["Goals", goals],
    ["Assists", assists],
    ["Record", `${wins}-${draws}-${losses}`],
  ].map(([name, value]) => `<div class="tile"><span class="tile__value">${value}</span><span class="tile__name">${name}</span></div>`).join("");

  const dateInput = document.querySelector("#soccer-date");
  if (!dateInput.value) dateInput.value = toKey(today);
  document.querySelector("#soccer-goals").textContent = soccerForm.g;
  document.querySelector("#soccer-assists").textContent = soccerForm.a;
  document.querySelectorAll("[data-soccer-res]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.soccerRes === soccerForm.res)));
  document.querySelectorAll("[data-soccer-stars]").forEach((b) => {
    b.setAttribute("aria-pressed", String(Number(b.dataset.soccerStars) === soccerForm.stars));
    b.classList.toggle("is-lit", Number(b.dataset.soccerStars) <= soccerForm.stars);
  });

  const results = { W: "Won", D: "Tied", L: "Lost" };
  document.querySelector("#soccer-games").innerHTML = games.slice(-8).reverse().map((g) => `
    <li class="game">
      <span class="game__result is-${g.res}">${results[g.res]}</span>
      <span class="game__text">${shortDate(fromKey(g.d))}${g.opp ? ` vs ${escapeHTML(g.opp)}` : ""}: ⚽ ${g.g} · 🅰️ ${g.a} · ${"⭐".repeat(g.stars)}${g.note ? `<br><em>${escapeHTML(g.note)}</em>` : ""}</span>
      <button class="text-button" type="button" data-log-delete="${g.id}" aria-label="Delete this game">✕</button>
    </li>`).join("") || `<li class="swim-bests__empty">No games yet. Log your next one!</li>`;
}

document.querySelector("#soccer").addEventListener("click", (event) => {
  const step = event.target.closest("[data-soccer-step]");
  if (step) {
    const [field, change] = step.dataset.soccerStep.split(":");
    soccerForm[field] = Math.max(0, Math.min(20, soccerForm[field] + Number(change)));
    renderSoccer();
  }
  const res = event.target.closest("[data-soccer-res]");
  if (res) {
    soccerForm.res = res.dataset.soccerRes;
    renderSoccer();
  }
  const stars = event.target.closest("[data-soccer-stars]");
  if (stars) {
    soccerForm.stars = Number(stars.dataset.soccerStars);
    renderSoccer();
  }
});

document.querySelector("#soccer-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const date = document.querySelector("#soccer-date").value || toKey(today);
  const opp = document.querySelector("#soccer-opp").value.trim().slice(0, 40);
  const note = document.querySelector("#soccer-note").value.trim().slice(0, 120);
  logActivity("soccer", { id: makeId(), d: date, opp, note, g: soccerForm.g, a: soccerForm.a, res: soccerForm.res, stars: soccerForm.stars, reps: 60 });
  const goals = soccerForm.g;
  soccerForm = { g: 0, a: 0, res: "W", stars: 3 };
  document.querySelector("#soccer-opp").value = "";
  document.querySelector("#soccer-note").value = "";
  if (goals >= 3) {
    sounds.fanfare();
    confetti();
    showToast("HAT TRICK! ⚽⚽⚽");
  } else {
    sounds.done();
    showToast(goals ? `Game saved! ${goals === 1 ? "GOAL!" : `${goals} goals!`} ⚽` : "Game saved! ⚽");
  }
  render();
  checkAchievements(true);
});

// Deleting a swim lesson or a game (they live in the activity log)
document.querySelector("[data-page='sports']").addEventListener("click", (event) => {
  const remove = event.target.closest("[data-log-delete]");
  if (!remove) return;
  activityLog = activityLog.filter((entry) => entry.id !== remove.dataset.logDelete);
  saveJSON("levelUp.log", activityLog);
  render();
  showToast("Deleted.");
});


/* 4. BUILD YOUR OWN WORKOUT ----------------------------------------------- */

let builderMoves = [];   // moves in the workout you're building: { id, amount }
let builderRounds = 2;
let builderRest = 30;

function builderMove(id, amount) {
  return { ...moveFor(id, levelOf(today)), amount: amount ?? moveFor(id, levelOf(today)).amount };
}

function renderBuilder() {
  const level = levelOf(today);
  const select = document.querySelector("#builder-move");
  if (!select.options.length) {
    select.innerHTML = Object.keys(EXERCISES).map((id) => `<option value="${id}">${moveFor(id, level).name}</option>`).join("");
  }
  document.querySelector("#builder-rounds").textContent = builderRounds;
  document.querySelectorAll("[data-builder-rest]").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.builderRest) === builderRest)));

  document.querySelector("#builder-list").innerHTML = builderMoves.length
    ? builderMoves.map((m, i) => {
      const move = builderMove(m.id, m.amount);
      return `
        <li class="builder-move">
          <span class="builder-move__name">${move.name}</span>
          <span class="stepper stepper--small">
            <button type="button" data-builder-amount="${i}:-1" aria-label="Less">−</button>
            <span>${amountText(move.amount, move.unit, move.each)}</span>
            <button type="button" data-builder-amount="${i}:1" aria-label="More">+</button>
          </span>
          <button class="text-button" type="button" data-builder-remove="${i}" aria-label="Remove ${move.name}">✕</button>
        </li>`;
    }).join("")
    : `<li class="swim-bests__empty">Pick a move and tap Add. Add as many as you want!</li>`;

  document.querySelector("#builder-saved").innerHTML = myWorkouts.map((w) => `
    <li class="builder-saved">
      <span><strong>${escapeHTML(w.name)}</strong> · ${w.moves.length} moves · ${w.rounds} ${w.rounds === 1 ? "round" : "rounds"}</span>
      <span class="builder-saved__buttons">
        <button class="button" type="button" data-builder-start="${w.id}">▶ Start</button>
        <button class="text-button" type="button" data-builder-delete="${w.id}">Delete</button>
      </span>
    </li>`).join("") || `<li class="swim-bests__empty">Your saved workouts show up here.</li>`;
}

// Turns a saved workout into a plan the voice coach (coach.js) can run
function customPlan(workout) {
  const moves = workout.moves.map((m) => builderMove(m.id, m.amount));
  const plan = { title: workout.name, style: "circuit", rounds: workout.rounds, rest: workout.rest, moves, sportMoves: [], sport: null, expert: false, custom: true };
  plan.reps = moves.reduce((sum, move) => sum + repsInMove(move), 0) * workout.rounds; // for the boss (boss.js)
  return plan;
}

document.querySelector("#builder").addEventListener("click", (event) => {
  if (event.target.closest("[data-builder='add']")) {
    const id = document.querySelector("#builder-move").value;
    builderMoves.push({ id, amount: moveFor(id, levelOf(today)).amount });
    renderBuilder();
  }
  const amount = event.target.closest("[data-builder-amount]");
  if (amount) {
    const [i, change] = amount.dataset.builderAmount.split(":").map(Number);
    const move = builderMove(builderMoves[i].id, builderMoves[i].amount);
    const stepSize = move.unit === "sec" ? 5 : 1;
    builderMoves[i].amount = Math.max(1, Math.min(300, move.amount + change * stepSize));
    renderBuilder();
  }
  const remove = event.target.closest("[data-builder-remove]");
  if (remove) {
    builderMoves.splice(Number(remove.dataset.builderRemove), 1);
    renderBuilder();
  }
  const rounds = event.target.closest("[data-builder-rounds]");
  if (rounds) {
    builderRounds = Math.max(1, Math.min(5, builderRounds + Number(rounds.dataset.builderRounds)));
    renderBuilder();
  }
  const rest = event.target.closest("[data-builder-rest]");
  if (rest) {
    builderRest = Number(rest.dataset.builderRest);
    renderBuilder();
  }
  const start = event.target.closest("[data-builder-start]");
  if (start) {
    const workout = myWorkouts.find((w) => w.id === start.dataset.builderStart);
    if (workout) openCoach(today, customPlan(workout)); // in coach.js
  }
  const remove2 = event.target.closest("[data-builder-delete]");
  if (remove2) {
    myWorkouts = myWorkouts.filter((w) => w.id !== remove2.dataset.builderDelete);
    saveJSON("levelUp.workouts", myWorkouts);
    render();
    showToast("Workout deleted.");
  }
});

document.querySelector("#builder-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const name = document.querySelector("#builder-name").value.trim().slice(0, 40);
  if (!name) {
    showToast("Give your workout a name first!");
    document.querySelector("#builder-name").focus();
    return;
  }
  if (builderMoves.length === 0) {
    showToast("Add at least one move first!");
    return;
  }
  myWorkouts.push({ id: makeId(), name, rounds: builderRounds, rest: builderRest, moves: builderMoves.map((m) => ({ ...m })) });
  saveJSON("levelUp.workouts", myWorkouts);
  builderMoves = [];
  document.querySelector("#builder-name").value = "";
  sounds.done();
  showToast(`"${name}" saved! Tap Start to do it with the coach.`);
  render();
});

function renderSports() {
  renderBelt();
  renderSwim();
  renderSoccer();
  renderBuilder();
}
