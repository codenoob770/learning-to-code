/* =============================================================
   app.js: how Level Up WORKS
   -------------------------------------------------------------
   1. Dates: which day and which week of the plan it is
   2. Saving your progress
   3. Working out a day's plan (using plan.js)
   4. Building the page
   5. The gym test panel
   6. Buttons: next day, done, harder, easier
   7. The workout timer
   8. The beat trainer
   9. Sounds
   10. Start!
   ============================================================= */

const MAX_LEVEL = 12; // the plan gets harder for 12 weeks, then stays at the top level


/* 1. DATES ------------------------------------------------------
   JavaScript counts days of the week from Sunday (0) to Saturday (6).
   This plan starts on Monday, so we shift it: Monday = 0 ... Sunday = 6. */

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function dayIndex(date) {
  return (date.getDay() + 6) % 7;
}

function mondayOf(date) {
  return addDays(date, -dayIndex(date));
}

function daysBetween(from, to) {
  return Math.round((to - from) / (24 * 60 * 60 * 1000));
}

function sameDay(a, b) {
  return daysBetween(a, b) === 0;
}

// Turns a date into text like "2026-11-26", so it can be saved
function toKey(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function fromKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// "Sat, Nov 28"
function shortDate(date) {
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

const today = startOfDay(new Date());

// The gym test date from plan.js, or null if there's no test
const testDate = typeof TEST !== "undefined" && TEST && TEST.date ? fromKey(TEST.date) : null;

// How many days from a date until the test (0 = test day, 1 = the day before...)
function daysUntilTest(date) {
  return testDate ? daysBetween(date, testDate) : null;
}


/* 2. SAVING YOUR PROGRESS ----------------------------------------
   localStorage keeps small bits of text in this browser, even after
   you close it. try/catch keeps the page working if it's blocked.  */

function load(key, fallback) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch (error) {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    // Couldn't save. The page still works, it just won't remember.
  }
}

// Reads saved JSON (lists and objects), or gives back the fallback
function loadJSON(key, fallback) {
  try {
    return JSON.parse(load(key, "null")) ?? fallback;
  } catch (error) {
    return fallback;
  }
}

// The Monday your plan started. The first time you visit, that's this week's Monday.
let planStart = load("levelUp.start", null) ? fromKey(load("levelUp.start")) : mondayOf(today);
if (planStart > mondayOf(today)) planStart = mondayOf(today);
save("levelUp.start", toKey(planStart));

// The days you marked as done, kept in a Set (a list with no repeats)
const doneDays = new Set(loadJSON("levelUp.done", []));

function saveDoneDays() {
  save("levelUp.done", JSON.stringify([...doneDays]));
}

// Best scores from the beat trainer, like { pushups: { count: 14, date: "2026-11-28" } }
const bests = loadJSON("levelUp.bests", {});

// Scores from the real test, saved by test date
const testScores = loadJSON("levelUp.testScores", {});

// Expert mode: on or off, and which days you finished in expert mode
let isExpert = load("levelUp.expert", "off") === "on";
const expertDays = new Set(loadJSON("levelUp.expertDays", []));

// The day you're looking at right now. It starts on today.
let selected = today;


/* 3. WORKING OUT A DAY'S PLAN ------------------------------------- */

// Week 1, week 2... of the plan, for any date
function weekOf(date) {
  return Math.floor(daysBetween(planStart, mondayOf(date)) / 7) + 1;
}

function levelOf(date) {
  return Math.min(MAX_LEVEL, Math.max(1, weekOf(date)));
}

// More rounds as you get stronger
function roundsFor(level) {
  if (level <= 3) return 2;
  if (level <= 8) return 3;
  return 4;
}

// Shorter rests as you get fitter
function restFor(level) {
  if (level <= 4) return 30;
  if (level <= 8) return 25;
  return 20;
}

// Picks the right version of an exercise for a level, and how much to do
function moveFor(id, level) {
  const versions = EXERCISES[id];
  // The last version whose "from" level we've reached
  const version = versions.filter((v) => v.from <= level).pop();
  const amount = Math.min(version.max, version.start + version.step * (level - version.from));
  return { ...version, amount };
}

// Text like "12 reps", "30 sec each side" or "6 sprints"
function amountText(amount, unit, each) {
  let text = `${amount} ${unit}`;
  if (each) text += ` each ${each}`;
  return text;
}

function isTimed(unit) {
  return unit === "sec" || unit === "min";
}

function toSeconds(amount, unit) {
  return unit === "min" ? amount * 60 : amount;
}

// Roughly how many seconds a list of moves takes, done once
function secondsFor(moves) {
  let seconds = 0;
  for (const move of moves) {
    let moveSeconds = isTimed(move.unit) ? toSeconds(move.amount, move.unit) : move.amount * (move.pace || 3);
    if (move.each) moveSeconds *= 2;
    seconds += moveSeconds;
  }
  return seconds;
}

// A rough guess at how long the whole workout takes, in minutes
function estimateMinutes(plan) {
  let seconds = secondsFor(plan.moves) * plan.rounds;
  seconds += plan.rest * (plan.moves.length - 1) * plan.rounds + 60 * (plan.rounds - 1);
  seconds += secondsFor(plan.sportMoves);
  if (plan.style !== "rest") seconds += 4 * 60; // warm-up and cool-down
  return Math.max(5, Math.round(seconds / 60));
}

// Everything for one day: the workout and the food
function planFor(date) {
  let template = WEEK[dayIndex(date)];
  const untilTest = daysUntilTest(date);

  // The day before the test is a rest day, so your arms and abs are fresh
  if (untilTest === 1) {
    template = {
      ...WEEK[6], // Sunday's rest and stretch
      day: template.day,
      title: "Rest before your test",
      focus: "No push-ups or curl-ups today, so your muscles are fresh tomorrow. Stretch, eat a good dinner and get a full night's sleep.",
    };
  }

  // Expert mode jumps ahead a few levels (but rest days stay restful)
  const expert = isExpert && template.style !== "rest";
  const level = expert ? Math.min(MAX_LEVEL, levelOf(date) + EXPERT.levelBoost) : levelOf(date);

  let rounds = template.style === "circuit" ? roundsFor(level) : 1;
  let rest = template.style === "circuit" ? restFor(level) : 0;
  if (expert && template.style === "circuit") {
    rounds = Math.min(EXPERT.maxRounds, rounds + EXPERT.extraRounds);
    rest = Math.max(EXPERT.minRest, rest - EXPERT.restCut);
  }

  const plan = {
    ...template,
    level,
    expert,
    rounds,
    rest,
    moves: template.moves.map((id) => moveFor(id, level)),
    sportMoves: template.sport ? template.sport.moves.map((id) => moveFor(id, level)) : [],
    isTestDay: untilTest === 0,
    isPracticeDay: testDate !== null && TEST.practiceDaysBefore.includes(untilTest),
  };
  plan.minutes = estimateMinutes(plan);

  // Food changes every day. "n" counts days since the plan started, and
  // each list starts at a different spot so the meals mix differently.
  const n = (weekOf(date) - 1) * 7 + dayIndex(date);
  const pick = (list, offset) => list[(n + offset) % list.length];
  plan.drink = pick(DRINKS, 0);
  plan.breakfast = pick(BREAKFASTS, 2);
  plan.lunch = pick(LUNCHES, 5);
  plan.dinner = pick(DINNERS, 3);
  plan.snack = pick(SNACKS, 1);

  return plan;
}


/* 4. BUILDING THE PAGE ---------------------------------------------
   These functions write HTML into the empty boxes in index.html.
   The `backtick strings` let us mix HTML with ${values}.           */

const playIcon = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12-7.5z"/></svg>`;
const flameIcon = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c1 3.5 4.5 5.5 4.5 10a4.5 4.5 0 0 1-9 0c0-2 1-3.5 2-4.5.3 1.8 1.3 3 2.5 3.5-.5-3 0-6 0-9z"/></svg>`;
const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function render() {
  const plan = planFor(selected);
  renderDay(plan);
  renderStrip();
  if (plan.isTestDay) {
    renderTestDay(plan);
  } else {
    renderWorkout(plan);
  }
  renderDrink(plan.drink);
  renderMeals(plan);
  renderStats();
  renderTestPanel();
}

function renderDay(plan) {
  const week = weekOf(selected);
  document.querySelector("#day-eyebrow").textContent = `// week ${week} · day ${dayIndex(selected) + 1} of 7`;
  document.querySelector("#day-name").textContent = plan.day;
  document.querySelector("#day-date").textContent = selected.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  document.querySelector("#today-pill").hidden = !sameDay(selected, today);
  document.querySelector("#back-today").hidden = sameDay(selected, today);
  document.querySelector("#prev-day").disabled = selected <= planStart;
}

function renderStrip() {
  const monday = mondayOf(selected);
  let html = "";
  for (let i = 0; i < 7; i++) {
    const date = addDays(monday, i);
    const classes = ["chip"];
    if (sameDay(date, today)) classes.push("is-today");
    if (daysUntilTest(date) === 0) classes.push("is-test");
    const done = doneDays.has(toKey(date));
    let mark = done ? "✓" : "";
    if (!done && daysUntilTest(date) === 0) mark = "TEST";
    const markClass = done && expertDays.has(toKey(date)) ? "chip__mark is-expert" : "chip__mark";
    html += `
      <button class="${classes.join(" ")}" type="button" data-date="${toKey(date)}"
        aria-pressed="${sameDay(date, selected)}" ${date < planStart ? "disabled" : ""}
        aria-label="${WEEK[i].day} ${date.getDate()}${done ? ", done" : ""}${daysUntilTest(date) === 0 ? ", test day" : ""}">
        <span class="chip__day">${DAY_SHORT[i]}</span>
        <span class="chip__date">${date.getDate()}</span>
        <span class="${markClass}" aria-hidden="true">${mark}</span>
      </button>`;
  }
  document.querySelector("#day-strip").innerHTML = html;
}

function amountHTML(name, amount, unit, each) {
  const text = amountText(amount, unit, each);
  if (!isTimed(unit)) return `<span class="amount">${text}</span>`;
  // Timed moves get a button that starts the timer
  return `<button class="amount amount--timed" type="button" data-seconds="${toSeconds(amount, unit)}" data-name="${name}">${playIcon}${text}</button>`;
}

function movesHTML(moves, extraClass = "") {
  const items = moves.map((move) => `
    <li class="move">
      <div>
        <span class="move__name">${move.name}</span>
        <span class="move__how">${move.how}</span>
      </div>
      ${amountHTML(move.name, move.amount, move.unit, move.each)}
    </li>`).join("");
  return `<ol class="moves ${extraClass}">${items}</ol>`;
}

function extraHTML(title, items) {
  const rows = items.map((item) => `<li><span>${item.name}</span><span>${amountText(item.amount, item.unit, item.each)}</span></li>`).join("");
  return `
    <details class="extra">
      <summary>${title}</summary>
      <ul>${rows}</ul>
    </details>`;
}

// The bottom of the workout card: the done button and the harder/easier buttons
function footHTML(plan, doneLabel) {
  const isDone = doneDays.has(toKey(selected));
  let doneButton;
  if (selected > today) {
    doneButton = `<button class="button" type="button" disabled>Come back on ${plan.day}!</button>`;
  } else if (isDone) {
    doneButton = `<button class="button button--done" id="done-button" type="button">✓ Done! Nice work</button>`;
  } else {
    doneButton = `<button class="button" id="done-button" type="button">${doneLabel}</button>`;
  }
  return `
    <div class="workout__foot">
      ${doneButton}
      <div class="adjust">
        <button class="text-button" id="easier" type="button" ${weekOf(today) <= 1 ? "disabled" : ""}>Too hard? Go back a week</button>
        <button class="text-button" id="harder" type="button">Too easy? Skip ahead a week</button>
      </div>
    </div>`;
}

function renderWorkout(plan) {
  const isRest = plan.style === "rest";
  let levelText = weekOf(selected) > MAX_LEVEL ? "Max level" : `Level ${plan.level} of ${MAX_LEVEL}`;
  if (plan.expert) levelText = `Expert · level ${plan.level}`;

  const expertNote = plan.expert ? `
    <p class="expert-note">
      ${flameIcon}
      <span><strong>Expert mode is on:</strong> ${EXPERT.levelBoost} levels ahead, an extra round and shorter rests.
      Good form comes first. If your form breaks down, take a breather or switch expert mode off.</span>
    </p>` : "";

  let howItWorks = "Do each move once, top to bottom. Take your time and focus on good form.";
  if (plan.style === "circuit") {
    howItWorks = `Do every move with a short rest between them. That's one round. Rest a minute, then go again: <strong>${plan.rounds} rounds</strong> in total.`;
  }

  const practice = plan.isPracticeDay ? `
    <div class="practice">
      <p class="practice__title">Practice test today!</p>
      <p>Before your workout, use the beat trainer at the top of the page: push-ups until you can't keep up, rest 5 minutes, then curl-ups. Your best scores get saved. Then do the workout below, but go easy.</p>
      <button class="text-button" type="button" id="go-trainer">Go to the beat trainer &uarr;</button>
    </div>` : "";

  const restRow = plan.style === "circuit" ? `
    <div class="rest-row">
      <span>Rest timer:</span>
      <button class="rest-button" type="button" data-seconds="${plan.rest}" data-name="Rest between moves">${playIcon}${plan.rest} sec</button>
      <button class="rest-button" type="button" data-seconds="60" data-name="Rest between rounds">${playIcon}60 sec</button>
    </div>` : "";

  const sport = plan.sport ? `
    <div class="sport">
      <div class="sport__head">
        <p class="eyebrow">// sport skills</p>
        <span class="sport__name">${plan.sport.name}</span>
      </div>
      <p class="how-it-works">After your rounds, do these once.</p>
      ${movesHTML(plan.sportMoves, "moves--sport")}
    </div>` : "";

  const practiceTip = isRest ? "" : `
    <p class="tip"><strong>Swim, soccer or taekwondo today?</strong> Practice counts as a workout! Do the warm-up and sport skills, or just stretch.</p>`;

  document.querySelector("#workout").innerHTML = `
    <div class="panel__head">
      <p class="eyebrow">// workout</p>
      <span class="level-pill">${levelText}</span>
    </div>
    <h2 class="panel__title">${plan.title}</h2>
    <p class="panel__lead">${plan.focus}</p>

    <ul class="meta" aria-label="Workout details">
      <li>About <strong>${plan.minutes} min</strong></li>
      ${plan.style === "circuit" ? `<li><strong>${plan.rounds}</strong> rounds</li><li>Rest <strong>${plan.rest} sec</strong> between moves</li>` : ""}
      <li>No equipment</li>
    </ul>

    ${expertNote}
    ${practice}
    ${isRest ? "" : extraHTML("Warm-up first · about 2 min", WARM_UP)}

    <p class="how-it-works">${howItWorks}</p>
    ${movesHTML(plan.moves)}
    ${restRow}
    ${sport}

    ${isRest ? "" : extraHTML("Cool-down after · about 2 min", COOL_DOWN)}
    ${practiceTip}
    ${footHTML(plan, isRest ? "Mark rest day done" : "Mark workout done")}`;
}

// Test day gets its own card instead of a workout
function renderTestDay(plan) {
  const scores = testScores[TEST.date] || {};
  const bestPush = bests.pushups ? bests.pushups.count : null;
  const bestCurl = bests.curlups ? bests.curlups.count : null;
  const practiceLine = bestPush !== null || bestCurl !== null
    ? `<p class="how-it-works">Your best practice scores: <strong>${bestPush ?? "–"} push-ups</strong> and <strong>${bestCurl ?? "–"} curl-ups</strong>. Go beat them!</p>`
    : "";

  const testWarmUp = [
    { name: "Jumping jacks", amount: 30, unit: "sec" },
    { name: "Arm circles (forward, then back)", amount: 20, unit: "sec" },
    { name: "Easy push-ups, nice and slow", amount: 3, unit: "reps" },
    { name: "Easy curl-ups, nice and slow", amount: 3, unit: "reps" },
  ];

  document.querySelector("#workout").innerHTML = `
    <div class="panel__head">
      <p class="eyebrow">// test day</p>
      <span class="level-pill level-pill--test">Good luck!</span>
    </div>
    <h2 class="panel__title">${TEST.name}</h2>
    <p class="panel__lead">You practiced for this. Here's how to do your best.</p>
    ${practiceLine}

    <ol class="tips">
      <li><strong>Fuel up.</strong> Eat a normal breakfast and drink water, but nothing huge right before gym.</li>
      <li><strong>Warm up</strong> before the test if you get the chance (the list is below).</li>
      <li><strong>Push-ups:</strong> body straight as a board, lower until your elbows bend to 90°, then push all the way up.</li>
      <li><strong>Curl-ups:</strong> keep your feet flat, curl up slowly, and let your head touch the floor between reps.</li>
      <li><strong>Stay with the beat.</strong> Going faster doesn't get you more points, it just tires you out.</li>
      <li><strong>Breathe out</strong> every time you push up or curl up.</li>
      <li><strong>Whatever your score, it's your starting point.</strong> You'll beat it next time.</li>
    </ol>

    ${extraHTML("Quick test warm-up · about 2 min", testWarmUp)}

    <form class="scores" id="score-form">
      <p class="scores__title">How did it go? Save your scores</p>
      <div class="scores__fields">
        <label for="score-pushups">Push-ups</label>
        <input id="score-pushups" name="pushups" type="number" min="0" max="300" inputmode="numeric" value="${scores.pushups ?? ""}">
        <label for="score-curlups">Curl-ups</label>
        <input id="score-curlups" name="curlups" type="number" min="0" max="300" inputmode="numeric" value="${scores.curlups ?? ""}">
      </div>
      <button class="button button--quiet" type="submit">Save my scores</button>
    </form>

    ${footHTML(plan, "Mark test day done")}`;
}

function recipeHTML(label, recipe, showSteps) {
  const ingredients = recipe.ingredients.map((item) => `<li>${item}</li>`).join("");
  const steps = recipe.steps.map((step) => `<li>${step}</li>`).join("");
  return `
    <article class="recipe">
      <p class="recipe__label">${label}</p>
      <div class="recipe__top">
        <h3>${recipe.name}</h3>
        <span class="recipe__time">${recipe.minutes} min</span>
      </div>
      <ul>${ingredients}</ul>
      ${showSteps
        ? `<ol>${steps}</ol>`
        : `<details class="recipe__steps"><summary>How to make it</summary><ol>${steps}</ol></details>`}
      <p class="recipe__why"><strong>Why it's good:</strong> ${recipe.why}</p>
    </article>`;
}

function renderDrink(drink) {
  document.querySelector("#drink").innerHTML = `
    <p class="eyebrow">// drink of the day</p>
    ${recipeHTML("Blend it, shake it, sip it", drink, true)}`;
}

function renderMeals(plan) {
  document.querySelector("#meals").innerHTML = `
    <div class="panel__head">
      <p class="eyebrow">// fuel</p>
    </div>
    <h2 class="panel__title">Eat like an athlete</h2>
    <p class="panel__lead">Real food that powers your workouts. Swap anything you're allergic to or don't like.</p>
    ${recipeHTML("Breakfast", plan.breakfast, false)}
    ${recipeHTML("Lunch", plan.lunch, false)}
    ${recipeHTML("Dinner", plan.dinner, false)}
    <div class="snack">
      <p class="recipe__label">Snack</p>
      <h3>${plan.snack.name}</h3>
      <p>${plan.snack.what}</p>
      <p class="recipe__why">${plan.snack.why}</p>
    </div>
    <p class="water"><strong>Don't forget water!</strong> Keep a bottle with you and sip all day, especially before, during and after workouts and practice.</p>`;
}

let lastStats = {};

function renderStats() {
  // Days done in this calendar week (Monday to Sunday)
  const monday = mondayOf(today);
  let thisWeek = 0;
  for (let i = 0; i < 7; i++) {
    if (doneDays.has(toKey(addDays(monday, i)))) thisWeek += 1;
  }

  // Streak: days in a row you've marked done, counting back from today
  // (or from yesterday, if you haven't done today yet)
  let day = doneDays.has(toKey(today)) ? today : addDays(today, -1);
  let streak = 0;
  while (doneDays.has(toKey(day))) {
    streak += 1;
    day = addDays(day, -1);
  }

  const stats = {
    "#stat-week": String(weekOf(today)),
    "#stat-this-week": `${thisWeek}/7`,
    "#stat-streak": streak === 1 ? "1 day" : `${streak} days`,
    "#stat-total": String(doneDays.size),
  };

  for (const [selector, value] of Object.entries(stats)) {
    const element = document.querySelector(selector);
    element.textContent = value;
    // Bump the number if it changed (but not on the first load)
    if (lastStats[selector] !== undefined && lastStats[selector] !== value) {
      element.classList.remove("bump");
      void element.offsetWidth; // makes the browser notice, so the animation restarts
      element.classList.add("bump");
    }
  }
  lastStats = stats;
}


/* 5. THE GYM TEST PANEL ------------------------------------------
   Shows up from now until the end of test day.                      */

const testPanel = document.querySelector("#test");

function renderTestPanel() {
  const untilTest = daysUntilTest(today);
  if (untilTest === null || untilTest < 0) {
    testPanel.hidden = true;
    return;
  }
  testPanel.hidden = false;

  let countdown = `${untilTest} days to go`;
  if (untilTest === 1) countdown = "Tomorrow!";
  if (untilTest === 0) countdown = "Today! You got this";
  document.querySelector("#test-countdown").textContent = countdown;
  document.querySelector("#test-title").textContent = TEST.name;
  document.querySelector("#test-date").textContent =
    `${testDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}. Here's your plan to get ready:`;

  // The practice plan: practice tests, a rest day, then the test
  const steps = TEST.practiceDaysBefore.map((daysBefore, i) => ({ daysBefore, label: `Practice test ${i + 1}` }));
  steps.push({ daysBefore: 1, label: "Rest day" }, { daysBefore: 0, label: "Test day!" });

  document.querySelector("#test-prep").innerHTML = steps.map((step) => {
    const date = addDays(testDate, -step.daysBefore);
    const classes = ["prep__item"];
    if (date < today) classes.push("is-past");
    if (sameDay(date, today)) classes.push("is-today");
    return `
      <li>
        <button class="${classes.join(" ")}" type="button" data-date="${toKey(date)}">
          <span class="prep__date">${sameDay(date, today) ? "Today" : shortDate(date)}</span>
          <span class="prep__label">${step.label}</span>
        </button>
      </li>`;
  }).join("");

  renderBests();
}

// Tapping a step in the practice plan jumps to that day
document.querySelector("#test-prep").addEventListener("click", (event) => {
  const step = event.target.closest("[data-date]");
  if (!step) return;
  goTo(fromKey(step.dataset.date));
  document.querySelector("#workout").scrollIntoView({ behavior: "smooth", block: "start" });
});


/* 6. BUTTONS ---------------------------------------------------- */

function goTo(date) {
  selected = date < planStart ? planStart : date;
  render();
}

document.querySelector("#next-day").addEventListener("click", () => goTo(addDays(selected, 1)));
document.querySelector("#prev-day").addEventListener("click", () => goTo(addDays(selected, -1)));
document.querySelector("#back-today").addEventListener("click", () => goTo(today));

// Left and right arrow keys move between days too (but not while typing)
document.addEventListener("keydown", (event) => {
  if (event.target.closest && event.target.closest("input, textarea")) return;
  if (event.key === "ArrowRight") goTo(addDays(selected, 1));
  if (event.key === "ArrowLeft" && selected > planStart) goTo(addDays(selected, -1));
});

// Clicking a day in the strip. One listener on the whole strip handles all
// seven buttons: this is called "event delegation".
document.querySelector("#day-strip").addEventListener("click", (event) => {
  const chip = event.target.closest("[data-date]");
  if (chip && !chip.disabled) goTo(fromKey(chip.dataset.date));
});

const CHEERS = [
  "Nice work!",
  "Stronger than yesterday!",
  "You showed up. That's the hardest part.",
  "Level up!",
  "Another one done!",
  "Future you says thanks.",
];

document.querySelector("#workout").addEventListener("click", (event) => {
  // Timer buttons (timed moves and rest)
  const timerButton = event.target.closest("[data-seconds]");
  if (timerButton) {
    startTimer(timerButton.dataset.name, Number(timerButton.dataset.seconds));
    return;
  }

  const button = event.target.closest("button");
  if (!button) return;

  if (button.id === "done-button") {
    const key = toKey(selected);
    if (doneDays.has(key)) {
      doneDays.delete(key);
      expertDays.delete(key);
      showToast("Unmarked. No worries!");
    } else {
      doneDays.add(key);
      // Remember days you beat in expert mode (rest days don't count)
      if (planFor(selected).expert) {
        expertDays.add(key);
        showToast("Expert workout crushed! 🔥");
      } else {
        showToast(CHEERS[Math.floor(Math.random() * CHEERS.length)]);
      }
      sounds.done();
    }
    saveDoneDays();
    save("levelUp.expertDays", JSON.stringify([...expertDays]));
    render();
    document.querySelector("#done-button").focus(); // keep keyboard users in the same spot
  }

  if (button.id === "go-trainer") {
    testPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // "Harder" moves the plan's start a week earlier, so you're a week further in
  if (button.id === "harder") {
    planStart = addDays(planStart, -7);
    save("levelUp.start", toKey(planStart));
    render();
    showToast(`Now on week ${weekOf(selected)}. Let's go!`);
  }

  // "Easier" moves the start a week later. Not allowed in week 1: there's no week 0!
  if (button.id === "easier" && weekOf(today) > 1) {
    planStart = addDays(planStart, 7);
    save("levelUp.start", toKey(planStart));
    if (selected < planStart) selected = planStart;
    render();
    showToast(`Back to week ${weekOf(selected)}. Smart move.`);
  }
});

// Saving the real test scores
document.querySelector("#workout").addEventListener("submit", (event) => {
  event.preventDefault(); // stop the page from reloading
  const form = event.target;
  const pushups = form.elements.pushups.value;
  const curlups = form.elements.curlups.value;
  testScores[TEST.date] = {
    pushups: pushups === "" ? null : Number(pushups),
    curlups: curlups === "" ? null : Number(curlups),
  };
  save("levelUp.testScores", JSON.stringify(testScores));
  showToast("Scores saved. Proud of you!");
  sounds.done();
});

// The expert mode button. Turning it on adds data-mode="expert" to the
// <html> element, which makes style.css switch every color to red.
const expertButton = document.querySelector("#expert-button");

function showExpertMode() {
  if (isExpert) {
    document.documentElement.dataset.mode = "expert";
  } else {
    delete document.documentElement.dataset.mode;
  }
  expertButton.setAttribute("aria-pressed", String(isExpert));
}

expertButton.addEventListener("click", () => {
  isExpert = !isExpert;
  save("levelUp.expert", isExpert ? "on" : "off");
  showExpertMode();
  render();

  if (isExpert) {
    showToast("Expert mode ON. Way harder. Let's go!");
    sounds.expertOn();
    // Restart the red flash animation
    document.body.classList.remove("expert-flash");
    void document.body.offsetWidth;
    document.body.classList.add("expert-flash");
  } else {
    showToast("Expert mode off. Back to normal.");
    sounds.expertOff();
  }
});

let toastTimer = null;

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2400);
}


/* 7. THE WORKOUT TIMER -------------------------------------------
   Instead of counting down by itself, the timer remembers when it
   should end and checks the clock 4 times a second. That way it
   stays accurate even if the browser slows it down.               */

const timerBar = document.querySelector("#timer");
const timerTime = document.querySelector("#timer-time");
const timerFill = document.querySelector("#timer-fill");
const timerPause = document.querySelector("#timer-pause");

let timer = null;
let wakeLock = null;

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

function startTimer(name, seconds) {
  stopTimer();
  startAudio();
  timer = {
    name,
    total: seconds,
    endsAt: Date.now() + seconds * 1000,
    pausedLeft: null,   // milliseconds left, while paused
    lastSecond: seconds,
    interval: setInterval(tick, 250),
  };
  document.querySelector("#timer-label").textContent = name.startsWith("Rest") ? "Rest" : "Go!";
  document.querySelector("#timer-name").textContent = name;
  timerBar.classList.remove("is-done");
  timerBar.hidden = false;
  showPauseIcon(true);
  keepScreenOn();
  tick();
}

function tick() {
  if (!timer || timer.pausedLeft !== null) return;
  const msLeft = Math.max(0, timer.endsAt - Date.now());
  const secondsLeft = Math.ceil(msLeft / 1000);

  // Beep at 3, 2, 1
  if (secondsLeft !== timer.lastSecond) {
    timer.lastSecond = secondsLeft;
    if (secondsLeft > 0 && secondsLeft <= 3) sounds.count();
  }

  timerTime.textContent = formatTime(secondsLeft);
  timerFill.style.width = `${100 - (msLeft / (timer.total * 1000)) * 100}%`;

  if (msLeft <= 0) finishTimer();
}

function finishTimer() {
  clearInterval(timer.interval);
  sounds.finish();
  timerBar.classList.add("is-done");
  document.querySelector("#timer-label").textContent = "Done!";
  timerTime.textContent = "0:00";
  letScreenSleep();
  const finished = timer;
  // Hide the bar after a few seconds, unless another timer started
  setTimeout(() => {
    if (timer === finished) stopTimer();
  }, 4000);
}

function stopTimer() {
  if (timer) clearInterval(timer.interval);
  timer = null;
  timerBar.hidden = true;
  letScreenSleep();
}

function showPauseIcon(running) {
  timerPause.querySelector(".icon-pause").toggleAttribute("hidden", !running);
  timerPause.querySelector(".icon-play").toggleAttribute("hidden", running);
  timerPause.setAttribute("aria-label", running ? "Pause timer" : "Resume timer");
}

timerPause.addEventListener("click", () => {
  if (!timer || timerBar.classList.contains("is-done")) return;
  if (timer.pausedLeft === null) {
    timer.pausedLeft = timer.endsAt - Date.now();
    showPauseIcon(false);
  } else {
    timer.endsAt = Date.now() + timer.pausedLeft;
    timer.pausedLeft = null;
    showPauseIcon(true);
  }
});

document.querySelector("#timer-stop").addEventListener("click", stopTimer);

// Ask the phone not to turn its screen off while a timer runs.
// Not every browser allows this, and that's OK.
async function keepScreenOn() {
  try {
    if (navigator.wakeLock && !wakeLock) wakeLock = await navigator.wakeLock.request("screen");
  } catch (error) {
    wakeLock = null;
  }
}

function letScreenSleep() {
  if (trainer.running) return; // the beat trainer still needs the screen
  if (wakeLock) wakeLock.release().catch(() => {});
  wakeLock = null;
}


/* 8. THE BEAT TRAINER ---------------------------------------------
   Practice for the test at the real speed. Every rep has two halves:
   a low beep means "go down", a high beep means "come up" (and counts
   the rep). There's a 3-second countdown before it starts.          */

const trainer = {
  exercise: "pushups",
  running: false,
  startsAt: 0,     // when the first "down" beep happens
  lastBeat: -1,
  count: 0,
  interval: null,
};

const trainerCount = document.querySelector("#trainer-count");
const trainerCue = document.querySelector("#trainer-cue");
const trainerStart = document.querySelector("#trainer-start");
const EXERCISE_NAMES = { pushups: "push-ups", curlups: "curl-ups" };

function renderBests() {
  const parts = ["pushups", "curlups"].map((exercise) => {
    const best = bests[exercise];
    const name = EXERCISE_NAMES[exercise];
    return best ? `${name}: <strong>${best.count}</strong> (${shortDate(fromKey(best.date))})` : `${name}: –`;
  });
  document.querySelector("#trainer-best").innerHTML = `Best ${parts.join(" · ")}`;
}

// Picking push-ups or curl-ups
document.querySelector(".trainer__pick").addEventListener("click", (event) => {
  const pick = event.target.closest("[data-exercise]");
  if (!pick || trainer.running) return;
  trainer.exercise = pick.dataset.exercise;
  document.querySelectorAll(".pick").forEach((button) => {
    button.setAttribute("aria-pressed", String(button === pick));
  });
  trainerCount.textContent = "0";
});

trainerStart.addEventListener("click", () => {
  if (trainer.running) stopTrainer();
  else startTrainer();
});

function startTrainer() {
  startAudio();
  trainer.running = true;
  trainer.count = 0;
  trainer.lastBeat = -1;
  trainer.lastCountdown = null;
  trainer.startsAt = Date.now() + 3000;
  trainer.interval = setInterval(trainerTick, 50);
  trainerCount.textContent = "0";
  trainerStart.textContent = "Stop";
  testPanel.classList.add("is-running");
  document.querySelectorAll(".pick").forEach((button) => { button.disabled = true; });
  keepScreenOn();
}

function trainerTick() {
  const elapsed = (Date.now() - trainer.startsAt) / 1000;

  // The countdown: 3, 2, 1...
  if (elapsed < 0) {
    const number = Math.ceil(-elapsed);
    if (number !== trainer.lastCountdown) {
      trainer.lastCountdown = number;
      trainerCue.textContent = `Get in position... ${number}`;
      sounds.count();
    }
    return;
  }

  // Each half of a rep is one "beat"
  const beat = Math.floor(elapsed / (TEST.secondsPerRep / 2));
  if (beat === trainer.lastBeat) return;
  trainer.lastBeat = beat;

  if (beat % 2 === 0) {
    trainerCue.textContent = "Down...";
    trainerCue.className = "trainer__cue is-down";
    sounds.down();
  } else {
    trainer.count += 1;
    trainerCount.textContent = trainer.count;
    trainerCue.textContent = "Up!";
    trainerCue.className = "trainer__cue is-up";
    sounds.up();
  }
}

function stopTrainer() {
  clearInterval(trainer.interval);
  trainer.running = false;
  trainerStart.textContent = "Start again";
  testPanel.classList.remove("is-running");
  document.querySelectorAll(".pick").forEach((button) => { button.disabled = false; });
  letScreenSleep();

  const name = EXERCISE_NAMES[trainer.exercise];
  const best = bests[trainer.exercise];
  trainerCue.className = "trainer__cue";

  if (trainer.count === 0) {
    trainerCue.textContent = "Stopped. Press Start when you're ready.";
    return;
  }

  if (!best || trainer.count > best.count) {
    bests[trainer.exercise] = { count: trainer.count, date: toKey(today) };
    save("levelUp.bests", JSON.stringify(bests));
    trainerCue.textContent = `${trainer.count} ${name}! That's a new best!`;
    showToast(`New best: ${trainer.count} ${name}!`);
    sounds.done();
  } else {
    trainerCue.textContent = `${trainer.count} ${name}. Your best is ${best.count}. Keep at it!`;
  }
  renderBests();
}


/* 9. SOUNDS -------------------------------------------------------
   Same beeps as Bug Bash, made with the Web Audio API.             */

let audio = null;
let soundOn = load("levelUp.sound", "on") === "on";

function startAudio() {
  if (!audio) {
    const AudioSystem = window.AudioContext || window.webkitAudioContext;
    if (AudioSystem) audio = new AudioSystem();
  }
  if (audio && audio.state === "suspended") audio.resume();
}

function beep(pitch, seconds, delay = 0, volume = 0.14, wave = "triangle") {
  if (!soundOn || !audio) return;
  const start = audio.currentTime + delay;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = wave;
  oscillator.frequency.setValueAtTime(pitch, start);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + seconds);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start(start);
  oscillator.stop(start + seconds + 0.02);
}

const sounds = {
  count: () => beep(660, 0.15),
  down: () => beep(392, 0.14, 0, 0.16),
  up: () => beep(880, 0.14, 0, 0.16),
  finish: () => [784, 988, 1319].forEach((pitch, i) => beep(pitch, 0.18, i * 0.12)),
  done: () => {
    startAudio();
    [523, 659, 784, 1047].forEach((pitch, i) => beep(pitch, 0.12, i * 0.08, 0.1));
  },
  expertOn: () => {
    startAudio();
    [196, 262, 392, 523].forEach((pitch, i) => beep(pitch, 0.16, i * 0.07, 0.07, "sawtooth"));
  },
  expertOff: () => {
    startAudio();
    [523, 392, 262].forEach((pitch, i) => beep(pitch, 0.12, i * 0.07, 0.08));
  },
};

const soundButton = document.querySelector("#sound-button");

function showSoundSetting() {
  soundButton.setAttribute("aria-pressed", String(soundOn));
  soundButton.querySelector(".icon-sound-on").toggleAttribute("hidden", !soundOn);
  soundButton.querySelector(".icon-sound-off").toggleAttribute("hidden", soundOn);
}

soundButton.addEventListener("click", () => {
  soundOn = !soundOn;
  save("levelUp.sound", soundOn ? "on" : "off");
  showSoundSetting();
  if (soundOn) {
    startAudio();
    sounds.count();
  }
});


/* 10. START! ------------------------------------------------------ */

showSoundSetting();
showExpertMode();
render();
