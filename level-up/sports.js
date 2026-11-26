/* =============================================================
   sports.js: the Sports tab
   -------------------------------------------------------------
   1. Taekwondo belt tracker (and counting in Korean)
   2. Swim log: laps, race times and personal bests
   3. Soccer journal: your games, goals and assists
   4. Build your own workout (the voice coach runs it)

   Swims, race times, soccer games and your own workouts go in the
   activity log (app.js), so they earn XP and hit the weekly boss.

   This file loads before app.js, so it only uses app.js's
   functions inside its own functions, never right away.
   ============================================================= */


/* 1. TAEKWONDO BELT TRACKER ------------------------------------------
   Belt colors are different at every school. Pick the one closest
   to yours! "colors" can have two colors for a striped belt.      */

const BELTS = [
  { name: "White", colors: ["#f4f4f4"] },
  { name: "Yellow", colors: ["#f7d531"] },
  { name: "Orange", colors: ["#f39a2b"] },
  { name: "Green", colors: ["#3aa655"] },
  { name: "Purple", colors: ["#8a5cc9"] },
  { name: "Blue", colors: ["#3f7fe0"] },
  { name: "Brown", colors: ["#8a5a32"] },
  { name: "Red", colors: ["#d93838"] },
  { name: "Red-black", colors: ["#d93838", "#151515"] },
  { name: "Black", colors: ["#151515"] },
];

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
  const [main, stripe] = belt.colors;
  return `
    <svg class="belt" viewBox="0 0 160 70" aria-hidden="true">
      <path d="M8 22 H152 V38 H8 Z" style="fill: ${main}"/>
      ${stripe ? `<path d="M8 28 H152 V32 H8 Z" style="fill: ${stripe}"/>` : ""}
      <path d="M70 18 H90 V42 H70 Z" style="fill: ${main}" class="belt__knot"/>
      <path d="M74 40 L62 66 L72 66 L80 44 Z" style="fill: ${main}" class="belt__knot"/>
      <path d="M86 40 L98 66 L88 66 L80 44 Z" style="fill: ${main}" class="belt__knot"/>
    </svg>`;
}

function renderBelt() {
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
  const history = beltData.history.map((h) => `<li>${BELTS[h.belt].name} belt · ${shortDate(fromKey(h.d))}</li>`).join("");

  area.innerHTML = `
    <div class="belt-now">
      ${beltSVG(belt)}
      <div>
        <label class="field-label" for="belt-pick">My belt</label>
        <select class="select" id="belt-pick">
          ${BELTS.map((b, i) => `<option value="${i}" ${i === beltData.belt ? "selected" : ""}>${b.name}</option>`).join("")}
        </select>
      </div>
    </div>
    ${next ? `
      <div class="belt-next">
        <p class="belt-next__title">Next: <strong>${next.name} belt</strong></p>
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
      <button class="button" type="button" data-belt="passed">🎉 I passed! I'm a ${next.name.toLowerCase()} belt</button>`
    : `<p class="belt-countdown">🥋 Black belt! That's amazing. Keep training and teaching others.</p>`}
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
    showToast(`${BELTS[beltData.belt].name} belt! 🥋`);
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
    showToast(`Congratulations, ${BELTS[beltData.belt].name.toLowerCase()} belt! +${XP_RULES.beltUp} XP 🥋`);
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


/* 2. SWIM LOG ---------------------------------------------------------- */

const SWIM_EVENTS = [
  "25 free", "50 free", "100 free", "25 back", "50 back",
  "25 breast", "50 breast", "25 fly", "50 fly", "100 IM",
];

let swimEvent = "50 free"; // the event the chart shows

// "1:05.2" or "38.45" or "38" -> seconds (a number), or null if it can't be read
function readSwimTime(text) {
  const match = String(text).trim().match(/^(?:(\d{1,2}):)?(\d{1,2}(?:\.\d{1,2})?)$/);
  if (!match) return null;
  const seconds = (Number(match[1]) || 0) * 60 + Number(match[2]);
  return seconds > 0 ? Math.round(seconds * 100) / 100 : null;
}

// 65.2 -> "1:05.20", 38.5 -> "38.50"
function swimTimeText(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = (seconds - minutes * 60).toFixed(2).padStart(5, "0");
  return minutes ? `${minutes}:${rest}` : (seconds).toFixed(2);
}

function swimBest(event) {
  const times = logOf("swimTime").filter((e) => e.event === event).map((e) => e.secs);
  return times.length ? Math.min(...times) : null;
}

function renderSwim() {
  const unit = swimData.unit;
  document.querySelector("#swim-unit").innerHTML = ["yd", "m"].map((u) => `
    <button class="pick" type="button" data-swim-unit="${u}" aria-pressed="${u === unit}">${u === "yd" ? "Yards" : "Meters"}</button>`).join("");

  const swims = logOf("swim");
  const totalLaps = swims.reduce((sum, e) => sum + e.laps, 0);
  document.querySelector("#swim-total").textContent = swims.length
    ? `${swims.length} ${swims.length === 1 ? "swim" : "swims"} logged · ${totalLaps} laps · ${(totalLaps * swimData.pool).toLocaleString()} ${unit} in all`
    : "No swims logged yet.";

  // Personal bests for every event you've timed
  const bests = SWIM_EVENTS.filter((event) => swimBest(event) !== null);
  document.querySelector("#swim-bests").innerHTML = bests.length
    ? bests.map((event) => `<li><span>${event}</span><strong>${swimTimeText(swimBest(event))}</strong></li>`).join("")
    : `<li class="swim-bests__empty">Log a race or practice time to see your personal bests here.</li>`;

  // The event pickers and the chart
  const eventOptions = SWIM_EVENTS.map((event) => `<option ${event === swimEvent ? "selected" : ""}>${event}</option>`).join("");
  document.querySelector("#swim-event").innerHTML = eventOptions;
  document.querySelector("#swim-chart-event").innerHTML = eventOptions;
  const points = logOf("swimTime").filter((e) => e.event === swimEvent).sort((a, b) => (a.d < b.d ? -1 : 1))
    .map((e) => ({ date: e.d, value: e.secs, id: e.id }));
  lineChart(document.querySelector("#swim-chart"), document.querySelector("#swim-chart-table"), {
    points,
    lowerIsBetter: true,
    format: swimTimeText,
    valueName: "Time",
    label: `Line chart of your ${swimEvent} times. Lower is faster.`,
    empty: `No ${swimEvent} times yet. Log one above and your chart starts here!`,
  });

  // Recent entries, newest first, with delete buttons
  const recent = activityLog.filter((e) => e.t === "swim" || e.t === "swimTime").slice(-6).reverse();
  document.querySelector("#swim-recent").innerHTML = recent.map((e) => `
    <li><span>${shortDate(fromKey(e.d))}: ${e.t === "swim" ? `${e.laps} laps` : `${e.event} in ${swimTimeText(e.secs)}`}</span>
    <button class="text-button" type="button" data-log-delete="${e.id}" aria-label="Delete this entry">✕</button></li>`).join("");
}

document.querySelector("#swim").addEventListener("click", (event) => {
  const unitButton = event.target.closest("[data-swim-unit]");
  if (unitButton) {
    swimData.unit = unitButton.dataset.swimUnit;
    saveJSON("levelUp.swim", swimData);
    render();
  }
  const lapButton = event.target.closest("[data-laps]");
  if (lapButton) {
    const input = document.querySelector("#swim-laps");
    input.value = Math.max(0, (Number(input.value) || 0) + Number(lapButton.dataset.laps));
  }
});

document.querySelector("#swim-chart-event").addEventListener("change", (event) => {
  swimEvent = event.target.value;
  renderSwim();
});

document.querySelector("#swim-laps-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const laps = Math.round(Number(document.querySelector("#swim-laps").value));
  if (!(laps > 0 && laps <= 500)) {
    showToast("How many laps? Type a number first.");
    return;
  }
  logActivity("swim", { id: makeId(), laps, reps: laps * 5 });
  document.querySelector("#swim-laps").value = "";
  sounds.done();
  showToast(`${laps} laps logged! 🏊`);
  render();
  checkAchievements(true);
});

document.querySelector("#swim-time-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const eventName = document.querySelector("#swim-event").value;
  const secs = readSwimTime(document.querySelector("#swim-time").value);
  if (secs === null) {
    showToast("Type the time like 38.5 or 1:05.2");
    return;
  }
  const best = swimBest(eventName);
  logActivity("swimTime", { id: makeId(), event: eventName, secs });
  swimEvent = eventName;
  document.querySelector("#swim-time").value = "";
  if (best !== null && secs < best) {
    sounds.fanfare();
    showToast(`NEW PERSONAL BEST! ${(best - secs).toFixed(2)} seconds faster! 🚀`);
  } else {
    sounds.done();
    showToast("Time saved! ⏱️");
  }
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

// Deleting a swim, race time or game (they all live in the activity log)
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
