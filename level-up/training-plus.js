/* =============================================================
   training-plus.js: more for the Training tab
   -------------------------------------------------------------
   1. Game Day Warm-Up (before a game, swim lesson or belt test)
   2. Monthly Fitness Test and its report card
   3. My Goals
   4. The body picture (used by the next two)
   5. Muscle Map (what you worked this week)
   6. Sore Muscle Helper
   7. Demo controls: slow motion and mirror
   8. Plugging in (XP, badges, saved data: see hooks.js)

   This file loads before app.js, so it only uses app.js's
   functions inside its own functions, never right away.
   ============================================================= */


/* 1. GAME DAY WARM-UP -------------------------------------------------
   A warm-up made for the thing you're about to do. Moving warm-ups
   (not long stretches) get your muscles ready to go fast.          */

const GAME_DAYS = [
  {
    id: "soccer", icon: "⚽", name: "Soccer game", when: "Start about 15 minutes before kickoff.",
    tips: [
      "Eat a snack 1 to 2 hours before, like a banana, toast or a granola bar.",
      "Drink water before the game, at halftime and after.",
      "Shin guards on, and double-knot your cleats!",
    ],
    moves: [
      { name: "Easy jog", amount: 60, unit: "sec", demo: "jog", how: "Nice and easy. Get your blood moving." },
      { name: "High knees", amount: 20, unit: "sec", demo: "highKnees", how: "Knees up to your hips, quick feet." },
      { name: "Leg swings", amount: 10, unit: "reps", each: "leg", demo: "legSwings", how: "Hold something for balance. Swing forward and back, loose and easy." },
      { name: "Hip circles", amount: 10, unit: "reps", each: "way", demo: "hipCircles", how: "Hands on your hips, big slow circles." },
      { name: "Side shuffles", amount: 20, unit: "sec", demo: "lateralShuffle", how: "Stay low like you're marking a player. Don't cross your feet." },
      { name: "Ball toe taps", amount: 20, unit: "sec", demo: "toeTaps", how: "Tap the top of the ball: left, right, left. Quick and light." },
      { name: "Quick feet", amount: 15, unit: "sec", demo: "jog", how: "Tiny, super-fast steps on the balls of your feet." },
      { name: "Short sprints", amount: 3, unit: "sprints", demo: "run", how: "Sprint about 10 steps at almost full speed, then walk back." },
    ],
  },
  {
    id: "swim", icon: "🏊", name: "Swim lesson", when: "Do it at home before you leave, or on the pool deck.",
    tips: [
      "Goggles, swimsuit, cap and towel. Check!",
      "Drink some water. You sweat in the pool too!",
      "Skip a big meal right before. A small snack is fine.",
    ],
    moves: [
      { name: "Arm circles", amount: 20, unit: "sec", demo: "armCircles", how: "Small circles that get bigger. Forward, then backward." },
      { name: "Jumping jacks", amount: 30, unit: "sec", demo: "jacks", how: "Get your heart pumping." },
      { name: "Streamline stretch", amount: 15, unit: "sec", demo: "streamlineHold", how: "Arms squeezed behind your ears, one hand on the other. Reach tall!" },
      { name: "Leg swings", amount: 10, unit: "reps", each: "leg", demo: "legSwings", how: "Loose hips make better kicks." },
      { name: "Flutter kicks", amount: 20, unit: "sec", demo: "flutterKicks", how: "On your back, small fast kicks. Practice for the pool!" },
      { name: "Bubble breathing", amount: 20, unit: "sec", demo: null, how: "Breathe in through your mouth, then out slowly through your nose, like blowing bubbles underwater." },
    ],
  },
  {
    id: "tkd", icon: "🥋", name: "Taekwondo class", when: "Do it before class starts, or while you wait.",
    tips: [
      "Clean dobok and your belt tied right. Looking sharp!",
      "Bring your water bottle.",
      "Take off jewelry and trim your nails (you'll thank yourself in sparring).",
    ],
    moves: [
      { name: "Easy jog", amount: 45, unit: "sec", demo: "jog", how: "Get warm all over." },
      { name: "Fighting-stance bounce", amount: 30, unit: "sec", demo: "stanceBounce", how: "Light bounces on the balls of your feet. Switch stance halfway." },
      { name: "Leg swings", amount: 10, unit: "reps", each: "leg", demo: "legSwings", how: "Forward and back, then side to side. Higher each time, but never forced." },
      { name: "Hip circles", amount: 10, unit: "reps", each: "way", demo: "hipCircles", how: "Loose hips for high kicks." },
      { name: "Slow front kicks", amount: 5, unit: "reps", each: "leg", demo: "slowKicks", how: "Chamber, kick slowly, pull back slowly." },
      { name: "Chamber holds", amount: 10, unit: "sec", each: "leg", demo: "chamberHold", how: "Knee up in your kick chamber. Hold steady." },
    ],
  },
  {
    id: "test", icon: "🎖️", name: "Belt test", when: "Do it about 20 minutes before your test.",
    tips: [
      "You've practiced for this. Trust your training!",
      "Nervous? That's normal, even for black belts. Take 3 slow, deep breaths.",
      "Eyes forward, sharp moves and a BIG kihap!",
    ],
    moves: [
      { name: "Easy jog", amount: 60, unit: "sec", demo: "jog", how: "Get warm all over." },
      { name: "Fighting-stance bounce", amount: 30, unit: "sec", demo: "stanceBounce", how: "Stay light and ready." },
      { name: "Leg swings", amount: 10, unit: "reps", each: "leg", demo: "legSwings", how: "Forward and back. Loose and easy." },
      { name: "Hip circles", amount: 10, unit: "reps", each: "way", demo: "hipCircles", how: "Big slow circles." },
      { name: "Slow front kicks", amount: 5, unit: "reps", each: "leg", demo: "slowKicks", how: "Perfect form, nice and slow." },
      { name: "Kick combos", amount: 3, unit: "combos", each: "leg", demo: "kickCombo", how: "Front kick, then roundhouse. Snap them back!" },
      { name: "Practice your form (poomsae)", amount: 1, unit: "time", demo: null, how: "Go through it once, slowly, thinking about every move." },
      { name: "Calm breathing", amount: 20, unit: "sec", demo: null, how: "In through your nose for 4, out through your mouth for 4. You've got this!" },
    ],
  },
];

let gameDayPick = "soccer";

// The coach's steps (coach.js) for a warm-up. Timed moves on each side become two steps.
function gameDayPlan(event) {
  const steps = [];
  for (const move of event.moves) {
    const timed = isTimed(move.unit);
    const seconds = timed ? toSeconds(move.amount, move.unit) : null;
    const section = `${event.icon} ${event.name} warm-up`;
    if (timed && move.each) {
      for (const side of [1, 2]) {
        steps.push({ section, name: move.name, how: move.how, label: `${move.each} ${side} of 2`, seconds, demo: move.demo });
      }
    } else {
      steps.push({ section, name: move.name, how: move.how, label: amountText(move.amount, move.unit, move.each), seconds, demo: move.demo });
    }
  }
  return {
    title: `${event.name} warm-up`,
    steps,
    expert: false,
    reps: 30,
    logType: "gameDay",
    logExtra: { e: event.id },
    finishTitle: "Warmed up and ready!",
    finishText: `You're ready for your ${event.name.toLowerCase()}. Go have fun and do your best! 🔥`,
  };
}

function drawGameDay() {
  const area = document.querySelector("#gameday-area");
  const event = GAME_DAYS.find((item) => item.id === gameDayPick);
  const picks = GAME_DAYS.map((item) => `
    <button class="lab-chip" type="button" data-gameday="${item.id}" aria-pressed="${item.id === gameDayPick}">${item.icon} ${item.name}</button>`).join("");
  const done = logOf("gameDay").filter((entry) => entry.e === event.id).length;
  area.innerHTML = `
    <div class="lab-chips" role="group" aria-label="What are you getting ready for?">${picks}</div>
    <p class="gameday-when">⏰ ${event.when}</p>
    <ol class="gameday-moves">${event.moves.map((move) => `
      <li><span>${move.name}</span><span class="gameday-amount">${amountText(move.amount, move.unit, move.each)}</span></li>`).join("")}
    </ol>
    <div class="brain-start__buttons">
      <button class="button" type="button" data-gameday-start>▶ Warm up with the coach</button>
      <span class="quiz-total">${done ? `Done ${plural(done, "time")}` : "About 5 minutes"}</span>
    </div>
    <details class="extra gameday-tips">
      <summary>Game day tips</summary>
      <ul>${event.tips.map((tip) => `<li>${tip}</li>`).join("")}</ul>
    </details>`;
}

document.querySelector("#gameday-area").addEventListener("click", (event) => {
  const pick = event.target.closest("[data-gameday]");
  if (pick) {
    gameDayPick = pick.dataset.gameday;
    drawGameDay();
    document.querySelector(`[data-gameday="${gameDayPick}"]`).focus();
    return;
  }
  if (event.target.closest("[data-gameday-start]")) {
    openCoach(today, gameDayPlan(GAME_DAYS.find((item) => item.id === gameDayPick))); // in coach.js
  }
});


/* 2. MONTHLY FITNESS TEST ------------------------------------------------
   Once a month: 5 quick tests. Your report card compares this month
   with last month, so you can see yourself getting stronger.       */

const FIT_TESTS = [
  { id: "pushups", icon: "💪", name: "Push-ups", how: "As many as you can in a row with good form. Stop when your form breaks. Knees down is OK, as long as you do it the same way every month.", unit: "push-ups", demo: "pushup" },
  { id: "curlups", icon: "🛡️", name: "Curl-ups in 1 minute", how: "Knees bent, feet flat, curl up slowly. Count how many you do before the timer ends.", unit: "curl-ups", demo: "curlup", timer: 60 },
  { id: "plank", icon: "🧱", name: "Plank hold", how: "Hold a plank on your forearms as long as you can. Stop when your hips sag or lift. Use the stopwatch!", unit: "seconds", demo: "plank", stopwatch: true },
  { id: "jacks", icon: "⭐", name: "Jumping jacks in 30 seconds", how: "Count every jumping jack you finish before the timer ends.", unit: "jumping jacks", demo: "jacks", timer: 30 },
  { id: "reach", icon: "🙆", name: "Toe-touch reach", how: "Sit with your legs straight out. Reach forward slowly (no bouncing!) and pick how far you got.", demo: "hamstringStretch", scale: ["Knees", "Shins", "Ankles", "Toes", "Past my toes!"] },
];

let fitData = {};      // results by month, like { "2026-11": { pushups: 12, ..., d: "2026-11-27" } } (saved)
let fitDraft = null;   // what you've typed in this month's test, before saving
let fitWatch = null;   // the plank stopwatch: { startedAt, interval }

function monthKey(date) {
  return toKey(date).slice(0, 7);
}

function monthName(key) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function fitMonths() {
  return Object.keys(fitData).sort();
}

// Your result for a test in the most recent month before "key" (or null)
function fitBefore(testId, key) {
  const earlier = fitMonths().filter((month) => month < key && fitData[month][testId] !== undefined);
  return earlier.length ? fitData[earlier[earlier.length - 1]][testId] : null;
}

function fitText(test, value) {
  if (value === null || value === undefined) return "–";
  if (test.scale) return test.scale[value - 1] || "–";
  return String(value);
}

function drawFitTest() {
  const area = document.querySelector("#fit-area");
  if (area.contains(document.activeElement) && document.activeElement.matches("input")) return; // don't redraw while you type
  if (fitWatch) return; // or while the stopwatch is running
  const key = monthKey(today);
  const saved = fitData[key];
  if (!fitDraft || fitDraft.month !== key) fitDraft = { month: key, ...(saved || {}) };

  const cards = FIT_TESTS.map((test) => {
    const last = fitBefore(test.id, key);
    const value = fitDraft[test.id];
    const input = test.scale
      ? `<div class="lab-chips fit-scale" role="group" aria-label="${test.name}">${test.scale.map((name, i) => `
          <button class="lab-chip" type="button" data-fit-scale="${test.id}:${i + 1}" aria-pressed="${value === i + 1}">${i + 1}. ${name}</button>`).join("")}</div>`
      : `<label class="fit-input">
          <input class="input input--number" type="number" inputmode="numeric" min="0" max="999" data-fit-input="${test.id}" value="${value ?? ""}" aria-label="${test.name}: how many ${test.unit}">
          <span>${test.unit}</span>
        </label>`;
    return `
      <div class="fit-card">
        <p class="fit-card__name"><span aria-hidden="true">${test.icon}</span> ${test.name}</p>
        <p class="fit-card__how">${test.how}</p>
        <div class="fit-card__tools">
          <button class="text-button" type="button" data-fit-demo="${test.id}">Show me how</button>
          ${test.timer ? `<button class="text-button" type="button" data-fit-timer="${test.id}">⏱ ${test.timer === 60 ? "1-minute" : `${test.timer}-second`} timer</button>` : ""}
          ${test.stopwatch ? `<button class="text-button" type="button" data-fit-watch>⏱ Start the stopwatch</button>` : ""}
        </div>
        ${input}
        <p class="fit-card__last">${last !== null ? `Last time: ${fitText(test, last)}${test.scale ? "" : ` ${test.unit}`}` : "First time! This is your starting point."}</p>
      </div>`;
  }).join("");

  area.innerHTML = `
    <p class="fit-status">${saved
      ? `✅ ${monthName(key)} test saved on ${fromKey(saved.d).toLocaleDateString("en-US", { month: "short", day: "numeric" })}. You can change it any time this month.`
      : `📅 ${monthName(key)}: not done yet. Do all 5 (or as many as you can), then save!`}</p>
    <div class="fit-cards">${cards}</div>
    <div class="brain-start__buttons">
      <button class="button" type="button" data-fit-save>${saved ? "Update my results" : `Save my ${monthName(key).split(" ")[0]} results`}</button>
      <span class="form-note" id="fit-note" aria-live="polite"></span>
    </div>
    ${fitReportHTML(key)}`;
}

// The report card: this month next to last month and your very first test
function fitReportHTML(key) {
  const months = fitMonths();
  if (!fitData[key] && months.length === 0) return "";
  const show = fitData[key] ? key : months[months.length - 1];
  const first = months[0];
  let improved = 0;
  let compared = 0;
  const rows = FIT_TESTS.map((test) => {
    const now = fitData[show][test.id];
    const before = fitBefore(test.id, show);
    const start = fitData[first][test.id];
    let change = "<span class=\"fit-change\">New!</span>";
    if (now !== undefined && before !== null) {
      compared += 1;
      const diff = now - before;
      if (diff > 0) {
        improved += 1;
        change = `<span class="fit-change is-up">⬆️ +${test.scale ? diff : `${diff}`}</span>`;
      } else if (diff === 0) {
        change = `<span class="fit-change">➡️ Same</span>`;
      } else {
        change = `<span class="fit-change is-down">⬇️ ${diff}</span>`;
      }
    }
    return `
      <tr>
        <th scope="row">${test.icon} ${test.name}</th>
        <td>${first !== show ? fitText(test, start) : "–"}</td>
        <td>${fitText(test, before)}</td>
        <td class="fit-now">${fitText(test, now)}</td>
        <td>${now === undefined ? "–" : change}</td>
      </tr>`;
  }).join("");

  let summary = "Your first report card! Next month you'll see how much you improved.";
  if (compared) {
    summary = improved >= 3
      ? `🌟 You improved in ${improved} of ${compared} tests! You're getting STRONGER!`
      : improved >= 1
        ? `💪 You improved in ${improved} of ${compared} tests. Keep it up!`
        : "Not better this time, and that's OK! Everyone has off days. Keep training and try again next month.";
  }
  return `
    <div class="fit-report">
      <h3 class="fit-report__title">📋 Report card · ${monthName(show)}</h3>
      <p class="fit-report__summary">${summary}</p>
      <div class="table-scroll">
        <table class="fit-table">
          <thead><tr><th scope="col">Test</th><th scope="col">First test</th><th scope="col">Last month</th><th scope="col">${show === key ? "This month" : monthName(show).split(" ")[0]}</th><th scope="col">Change</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

function stopFitWatch(fill) {
  if (!fitWatch) return;
  clearInterval(fitWatch.interval);
  const seconds = Math.round((Date.now() - fitWatch.startedAt) / 1000);
  fitWatch = null;
  if (fill) fitDraft.plank = seconds;
  drawFitTest();
}

document.querySelector("#fit-area").addEventListener("input", (event) => {
  const input = event.target.closest("[data-fit-input]");
  if (!input) return;
  const value = parseInt(input.value, 10);
  if (Number.isFinite(value) && value >= 0) fitDraft[input.dataset.fitInput] = Math.min(999, value);
  else delete fitDraft[input.dataset.fitInput];
});

document.querySelector("#fit-area").addEventListener("click", (event) => {
  const scale = event.target.closest("[data-fit-scale]");
  if (scale) {
    const [id, value] = scale.dataset.fitScale.split(":");
    fitDraft[id] = Number(value);
    drawFitTest();
    document.querySelector(`[data-fit-scale="${id}:${value}"]`).focus();
    return;
  }
  const demo = event.target.closest("[data-fit-demo]");
  if (demo) {
    const test = FIT_TESTS.find((item) => item.id === demo.dataset.fitDemo);
    openDemo(test.demo, test.name, test.how);
    return;
  }
  const timer = event.target.closest("[data-fit-timer]");
  if (timer) {
    const test = FIT_TESTS.find((item) => item.id === timer.dataset.fitTimer);
    startTimer(test.name, test.timer); // the timer bar in app.js
    return;
  }
  const watch = event.target.closest("[data-fit-watch]");
  if (watch) {
    startAudio();
    if (fitWatch) {
      stopFitWatch(true);
      sounds.done();
      document.querySelector("[data-fit-watch]")?.focus();
      return;
    }
    fitWatch = { startedAt: Date.now() };
    sounds.up();
    watch.classList.add("is-running");
    const show = () => {
      watch.textContent = `⏹ Stop at ${Math.floor((Date.now() - fitWatch.startedAt) / 1000)} seconds`;
    };
    show();
    fitWatch.interval = setInterval(show, 250);
    return;
  }
  if (event.target.closest("[data-fit-save]")) saveFitTest();
});

function saveFitTest() {
  const key = monthKey(today);
  const results = {};
  FIT_TESTS.forEach((test) => {
    if (fitDraft[test.id] !== undefined) results[test.id] = fitDraft[test.id];
  });
  if (Object.keys(results).length === 0) {
    document.querySelector("#fit-note").textContent = "Fill in at least one test first!";
    return;
  }
  const first = !fitData[key];
  fitData[key] = { ...results, d: toKey(today) };
  saveJSON("levelUp.fitTest", fitData);
  if (first) logActivity("fitTest", { m: key });
  // Goals that match a test move forward too (like "25 push-ups")
  let goalsMoved = false;
  for (const goal of goalsData) {
    const kind = GOAL_KINDS.find((item) => item.id === goal.kind);
    if (!goal.done && kind && kind.fit && results[kind.fit] > goal.now) {
      goal.now = results[kind.fit];
      goalsMoved = true;
    }
  }
  if (goalsMoved) {
    finishReachedGoals();
    saveGoals();
  }
  sounds.fanfare();
  if (first) confetti();
  render();
  drawFitTest();
  checkAchievements(true);
  document.querySelector("#fit-note").textContent = first ? "Saved! Check out your report card. 📋" : "Updated! ✓";
  document.querySelector(".fit-report")?.scrollIntoView({ behavior: noMotion() ? "auto" : "smooth", block: "nearest" });
}


/* 3. MY GOALS ------------------------------------------------------------
   Set your own goals, like "25 push-ups by January 1". Update your
   progress whenever you get better. The fitness test updates the
   ones it can by itself!                                           */

const GOAL_KINDS = [
  { id: "pushups", name: "Push-ups in a row", unit: "push-ups", fit: "pushups" },
  { id: "curlups", name: "Curl-ups in 1 minute", unit: "curl-ups", fit: "curlups" },
  { id: "plank", name: "Plank hold", unit: "seconds", fit: "plank" },
  { id: "jacks", name: "Jumping jacks in 30 seconds", unit: "jumping jacks", fit: "jacks" },
  { id: "juggles", name: "Soccer juggles in a row", unit: "juggles" },
  { id: "custom", name: "Something else...", unit: "" },
];
const GOALS_MAX = 6; // goals you're working on at once
const GOAL_XP = 100;

let goalsData = []; // { id, kind, text, unit, target, now, due, made, done } (saved)

function saveGoals() {
  saveJSON("levelUp.goals", goalsData);
}

function goalTitle(goal) {
  const kind = GOAL_KINDS.find((item) => item.id === goal.kind);
  if (goal.kind === "custom") return `${goal.text}: ${goal.target}${goal.unit ? ` ${goal.unit}` : ""}`;
  return `${goal.target} ${kind.unit}${kind.id === "plank" ? " of plank" : ""}${kind.id === "curlups" ? " in 1 minute" : ""}${kind.id === "jacks" ? " in 30 seconds" : ""}${kind.id === "pushups" || kind.id === "juggles" ? " in a row" : ""}`;
}

function daysLeft(goal) {
  return Math.round((fromKey(goal.due) - today) / 86400000);
}

// Any goal whose progress reached its target is done!
function finishReachedGoals() {
  for (const goal of goalsData) {
    if (!goal.done && goal.now >= goal.target) {
      goal.done = toKey(today);
      logActivity("goalDone", { g: goal.id });
      setTimeout(() => showToast(`🎯 GOAL REACHED: ${goalTitle(goal)}! +${GOAL_XP} XP`), 400);
      confetti();
      sounds.fanfare();
    }
  }
}

function drawGoals() {
  const list = document.querySelector("#goals-list");
  if (list.contains(document.activeElement) && document.activeElement.matches("input")) return; // you're typing
  const active = goalsData.filter((goal) => !goal.done);
  const reached = goalsData.filter((goal) => goal.done);
  const cards = active.map((goal) => {
    const left = daysLeft(goal);
    const percent = Math.min(100, Math.round((goal.now / goal.target) * 100));
    let when = `${plural(left, "day")} left`;
    if (left === 0) when = "Due today! 💥";
    if (left < 0) when = "The date passed. Keep going, or pick a new date!";
    return `
      <li class="goal">
        <p class="goal__title">🎯 ${escapeHTML(goalTitle(goal))}</p>
        <p class="goal__when">by ${fromKey(goal.due).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · ${when}</p>
        <div class="xpbar goal__bar" aria-hidden="true"><div class="xpbar__fill" style="width: ${percent}%"></div></div>
        <form class="goal__update" data-goal-form="${goal.id}">
          <label class="field-label" for="goal-now-${goal.id}">My best so far</label>
          <input class="input input--number" id="goal-now-${goal.id}" type="number" inputmode="numeric" min="0" max="99999" value="${goal.now}">
          <span class="goal__of">of ${goal.target}</span>
          <button class="button button--quiet" type="submit">Update</button>
          <button class="text-button" type="button" data-goal-delete="${goal.id}">Delete</button>
        </form>
      </li>`;
  }).join("");

  list.innerHTML = `
    ${active.length ? `<ul class="goals">${cards}</ul>` : `<p class="empty-note">No goals yet. What do you want to be able to do? Set your first goal!</p>`}
    ${reached.length ? `
      <details class="extra">
        <summary>🏆 Goals reached (${reached.length})</summary>
        <ul class="goals-reached">${reached.map((goal) => `<li>✅ ${escapeHTML(goalTitle(goal))} <span class="quiz-total">${fromKey(goal.done).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span></li>`).join("")}</ul>
      </details>` : ""}`;
  document.querySelector("#goal-add").disabled = active.length >= GOALS_MAX;
}

function setUpGoalForm() {
  document.querySelector("#goal-kind").innerHTML = GOAL_KINDS.map((kind) => `<option value="${kind.id}">${kind.name}</option>`).join("");
  const due = document.querySelector("#goal-due");
  due.min = toKey(addDays(today, 1));
  if (!due.value) due.value = toKey(addDays(today, 30));
  document.querySelector("#goal-custom").hidden = document.querySelector("#goal-kind").value !== "custom";
}

document.querySelector("#goal-kind").addEventListener("change", (event) => {
  document.querySelector("#goal-custom").hidden = event.target.value !== "custom";
});

document.querySelector("#goal-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const note = document.querySelector("#goal-note");
  const kind = document.querySelector("#goal-kind").value;
  const target = parseInt(document.querySelector("#goal-target").value, 10);
  const due = document.querySelector("#goal-due").value;
  const text = document.querySelector("#goal-text").value.trim();
  const unit = document.querySelector("#goal-unit").value.trim();
  if (goalsData.filter((goal) => !goal.done).length >= GOALS_MAX) {
    note.textContent = `You're working on ${GOALS_MAX} goals already. Finish one first!`;
    return;
  }
  if (kind === "custom" && !text) {
    note.textContent = "What's your goal? Type it in.";
    document.querySelector("#goal-text").focus();
    return;
  }
  if (!Number.isFinite(target) || target < 1) {
    note.textContent = "Pick a number to aim for.";
    document.querySelector("#goal-target").focus();
    return;
  }
  if (!due || due <= toKey(today)) {
    note.textContent = "Pick a date in the future.";
    document.querySelector("#goal-due").focus();
    return;
  }
  // Start from your latest fitness test, if it has this one
  const fit = (GOAL_KINDS.find((item) => item.id === kind) || {}).fit;
  const months = fitMonths();
  const start = fit && months.length ? fitData[months[months.length - 1]][fit] || 0 : 0;
  goalsData.push({ id: makeId(), kind, text: text.slice(0, 60), unit: unit.slice(0, 20), target: Math.min(target, 99999), now: start, due, made: toKey(today), done: null });
  finishReachedGoals();
  saveGoals();
  note.textContent = "Goal set! You've got this. 🎯";
  document.querySelector("#goal-target").value = "";
  document.querySelector("#goal-text").value = "";
  sounds.done();
  render();
  checkAchievements(true);
});

document.querySelector("#goals-list").addEventListener("submit", (event) => {
  const form = event.target.closest("[data-goal-form]");
  if (!form) return;
  event.preventDefault();
  const goal = goalsData.find((item) => item.id === form.dataset.goalForm);
  const value = parseInt(form.querySelector("input").value, 10);
  if (!goal || !Number.isFinite(value) || value < 0) return;
  const better = value > goal.now;
  goal.now = Math.min(value, 99999);
  form.querySelector("input").blur();
  finishReachedGoals();
  saveGoals();
  if (better && !goal.done) {
    sounds.up();
    showToast(`Nice! ${goal.target - goal.now} to go! 💪`);
  }
  render();
  checkAchievements(true);
});

document.querySelector("#goals-list").addEventListener("click", (event) => {
  const remove = event.target.closest("[data-goal-delete]");
  if (!remove) return;
  const goal = goalsData.find((item) => item.id === remove.dataset.goalDelete);
  if (!goal || !confirm(`Delete the goal "${goalTitle(goal)}"?`)) return;
  goalsData = goalsData.filter((item) => item !== goal);
  saveGoals();
  render();
});


/* 4. THE BODY PICTURE ------------------------------------------------------
   Two simple bodies, front and back, made of shapes. Each shape has a
   "part", like "quads". The Muscle Map colors them in, and the Sore
   Muscle Helper lets you tap them.                                 */

const BODY_PARTS = {
  neck: "Neck", shoulders: "Shoulders", chest: "Chest", arms: "Arms", abs: "Stomach (abs)",
  upperBack: "Upper back", lowerBack: "Lower back", glutes: "Glutes (bottom)", hips: "Hips",
  quads: "Front of thighs (quads)", hamstrings: "Back of thighs (hamstrings)", calves: "Lower legs (calves and shins)",
  knees: "Knees", ankles: "Ankles and feet",
};

// [part, shape, ...numbers] for each shape. Both bodies are 120 wide.
const BODY_FRONT = [
  ["neck", "rect", 54, 31, 12, 12, 3],
  ["shoulders", "circle", 39, 51, 9], ["shoulders", "circle", 81, 51, 9],
  ["chest", "rect", 45, 43, 30, 34, 9],
  ["arms", "ellipse", 31, 78, 7, 18], ["arms", "ellipse", 89, 78, 7, 18],
  ["arms", "ellipse", 27, 114, 6, 17], ["arms", "ellipse", 93, 114, 6, 17],
  ["abs", "rect", 47, 78, 26, 42, 7],
  ["hips", "rect", 45, 121, 30, 15, 6],
  ["quads", "ellipse", 51, 162, 10, 25], ["quads", "ellipse", 69, 162, 10, 25],
  ["knees", "circle", 51, 192, 6], ["knees", "circle", 69, 192, 6],
  ["calves", "ellipse", 51, 218, 7, 18], ["calves", "ellipse", 69, 218, 7, 18],
  ["ankles", "ellipse", 49, 244, 8, 5], ["ankles", "ellipse", 71, 244, 8, 5],
];
const BODY_BACK = [
  ["neck", "rect", 54, 31, 12, 12, 3],
  ["shoulders", "circle", 39, 51, 9], ["shoulders", "circle", 81, 51, 9],
  ["upperBack", "rect", 45, 43, 30, 41, 9],
  ["lowerBack", "rect", 47, 85, 26, 35, 7],
  ["arms", "ellipse", 31, 78, 7, 18], ["arms", "ellipse", 89, 78, 7, 18],
  ["arms", "ellipse", 27, 114, 6, 17], ["arms", "ellipse", 93, 114, 6, 17],
  ["glutes", "ellipse", 52, 131, 9.5, 11], ["glutes", "ellipse", 68, 131, 9.5, 11],
  ["hamstrings", "ellipse", 51, 166, 10, 23], ["hamstrings", "ellipse", 69, 166, 10, 23],
  ["calves", "ellipse", 51, 214, 8, 20], ["calves", "ellipse", 69, 214, 8, 20],
  ["ankles", "ellipse", 49, 244, 8, 5], ["ankles", "ellipse", 71, 244, 8, 5],
];

function bodyShapeSVG([part, shape, ...n], className, extra) {
  const common = `class="body-part ${className(part)}" data-part="${part}" ${extra(part)}`;
  if (shape === "circle") return `<circle ${common} cx="${n[0]}" cy="${n[1]}" r="${n[2]}"/>`;
  if (shape === "ellipse") return `<ellipse ${common} cx="${n[0]}" cy="${n[1]}" rx="${n[2]}" ry="${n[3]}"/>`;
  return `<rect ${common} x="${n[0]}" y="${n[1]}" width="${n[2]}" height="${n[3]}" rx="${n[4]}"/>`;
}

// className(part) and extra(part) let each picture style its own parts
function bodySVG(label, className, extra = () => "") {
  const figure = (shapes, x, name) => `
    <g transform="translate(${x} 0)">
      <circle class="body-head" cx="60" cy="17" r="13"/>
      <circle class="body-hand" cx="25" cy="135" r="5"/><circle class="body-hand" cx="95" cy="135" r="5"/>
      ${shapes.map((shape) => bodyShapeSVG(shape, className, extra)).join("")}
      <text class="body-label" x="60" y="262" text-anchor="middle">${name}</text>
    </g>`;
  return `
    <svg class="body-map" viewBox="0 0 250 268" role="img" aria-label="${label}">
      ${figure(BODY_FRONT, 0, "FRONT")}
      ${figure(BODY_BACK, 130, "BACK")}
    </svg>`;
}


/* 5. MUSCLE MAP --------------------------------------------------------------
   Every move works some muscles. Add up what you did this week, and
   color the body in: the brighter, the more you worked it.         */

const MUSCLES = [
  { id: "shoulders", name: "Shoulders", fix: "Plank shoulder taps or Y-T-W raises" },
  { id: "chest", name: "Chest", fix: "Push-ups" },
  { id: "arms", name: "Arms", fix: "Chair dips or push-ups" },
  { id: "abs", name: "Abs", fix: "Curl-ups or a plank" },
  { id: "back", name: "Back", fix: "Superman hold or Y-T-W raises" },
  { id: "glutes", name: "Glutes", fix: "Glute bridges" },
  { id: "quads", name: "Quads", fix: "Squats or a wall sit" },
  { id: "hamstrings", name: "Hamstrings", fix: "Glute bridges or inchworms" },
  { id: "calves", name: "Calves", fix: "Calf raises" },
  { id: "heart", name: "Heart and lungs", fix: "Jumping jacks, high knees or a game of tag" },
];

// The muscles each move in plan.js works
const MOVE_MUSCLES = {
  pushup: ["chest", "arms", "shoulders", "abs"], dips: ["arms", "chest", "shoulders"],
  shoulderTaps: ["shoulders", "abs", "arms"], superman: ["back", "glutes"], inchworm: ["hamstrings", "shoulders", "abs"],
  squat: ["quads", "glutes"], lunge: ["quads", "glutes", "hamstrings"], wallSit: ["quads"],
  bridge: ["glutes", "hamstrings", "back"], calfRaise: ["calves"],
  curlup: ["abs"], plank: ["abs", "shoulders"], bicycle: ["abs"], deadBug: ["abs"], sidePlank: ["abs", "shoulders"],
  jacks: ["heart", "calves", "shoulders"], highKnees: ["heart", "quads", "abs"], skaters: ["heart", "glutes", "quads"],
  mountainClimbers: ["heart", "abs", "shoulders"], burpee: ["heart", "chest", "quads"], lineHops: ["heart", "calves"],
  play: ["heart", "quads", "hamstrings"], sprints: ["heart", "hamstrings", "glutes", "calves"], quickFeet: ["heart", "calves"],
  ytw: ["back", "shoulders"], streamlineHold: ["shoulders", "abs"], flutterKicks: ["abs", "quads"],
  streamlineJumps: ["quads", "glutes", "calves"], balanceReach: ["calves", "glutes"], lateralShuffle: ["glutes", "quads", "heart"],
  toeTaps: ["heart", "calves", "quads"], sprintTurn: ["heart", "hamstrings", "quads"],
  chamberHold: ["quads", "abs", "glutes"], slowKicks: ["quads", "abs", "hamstrings"], stanceBounce: ["calves", "heart"],
  kickCombo: ["quads", "glutes", "abs", "heart"],
};
// What a whole activity works
const SPORT_MUSCLES = {
  soccer: ["heart", "quads", "hamstrings", "calves", "glutes"],
  swim: ["shoulders", "back", "arms", "abs", "heart"],
  tkd: ["quads", "glutes", "abs", "hamstrings", "heart"],
  test: ["quads", "glutes", "abs", "hamstrings", "heart"],
};
// Which muscle colors each body part
const PART_MUSCLE = {
  shoulders: "shoulders", chest: "chest", arms: "arms", abs: "abs", upperBack: "back", lowerBack: "back",
  glutes: "glutes", quads: "quads", hamstrings: "hamstrings", calves: "calves",
};

let muscleWeek = 0; // 0 = this week, -1 = last week

// How many times each muscle was worked in the week starting "monday"
function muscleCounts(monday) {
  const counts = Object.fromEntries(MUSCLES.map((muscle) => [muscle.id, 0]));
  const add = (list) => (list || []).forEach((id) => { counts[id] += 1; });
  const inWeek = (key) => key >= toKey(monday) && key <= toKey(addDays(monday, 6));

  for (let i = 0; i < 7; i++) {
    const date = addDays(monday, i);
    if (!doneDays.has(toKey(date)) || isRestDay(date)) continue;
    const template = WEEK[dayIndex(date)];
    template.moves.forEach((id) => add(MOVE_MUSCLES[id]));
    if (template.sport) template.sport.moves.forEach((id) => add(MOVE_MUSCLES[id]));
  }
  for (const entry of activityLog) {
    if (!inWeek(entry.d)) continue;
    if (entry.t === "extra") {
      const workout = EXTRA_WORKOUTS.find((item) => item.id === entry.workout);
      if (workout) workout.moves.forEach((id) => add(MOVE_MUSCLES[id]));
    }
    if (entry.t === "soccer") add(SPORT_MUSCLES.soccer);
    if (entry.t === "swimLesson") add(SPORT_MUSCLES.swim);
    if (entry.t === "gameDay") add(SPORT_MUSCLES[entry.e]);
    if (entry.t === "drill") {
      const found = findLesson(entry.lesson); // training.js
      if (found) add(SPORT_MUSCLES[found.sport.id]);
    }
  }
  return counts;
}

function drawMuscleMap() {
  const area = document.querySelector("#muscle-area");
  const monday = addDays(mondayOf(today), muscleWeek * 7);
  const counts = muscleCounts(monday);
  const level = (count) => (count === 0 ? 0 : count <= 2 ? 1 : count <= 5 ? 2 : 3);
  const picture = bodySVG(
    "Body picture: the brighter a muscle, the more you worked it",
    (part) => (PART_MUSCLE[part] ? `muscle-${level(counts[PART_MUSCLE[part]])}` : "body-neutral"),
  );
  const worked = MUSCLES.filter((muscle) => counts[muscle.id] > 0).sort((a, b) => counts[b.id] - counts[a.id]);
  const missing = MUSCLES.filter((muscle) => counts[muscle.id] === 0);
  const weeks = [[0, "This week"], [-1, "Last week"]].map(([value, name]) => `
    <button class="lab-chip" type="button" data-muscle-week="${value}" aria-pressed="${value === muscleWeek}">${name}</button>`).join("");

  area.innerHTML = `
    <div class="lab-chips" role="group" aria-label="Which week?">${weeks}</div>
    <div class="muscle-map">
      ${picture}
      <div class="muscle-info">
        <p class="muscle-heart" aria-label="Cardio: ${counts.heart} times">❤️ Cardio: <strong>${counts.heart}</strong></p>
        <div class="muscle-legend" aria-hidden="true">
          <span><i class="muscle-swatch muscle-0"></i>Not yet</span>
          <span><i class="muscle-swatch muscle-1"></i>A little</span>
          <span><i class="muscle-swatch muscle-2"></i>Lots</span>
          <span><i class="muscle-swatch muscle-3"></i>Tons!</span>
        </div>
        ${worked.length
          ? `<p><strong>Worked most:</strong> ${worked.slice(0, 3).map((muscle) => `${muscle.name} (${counts[muscle.id]}×)`).join(", ")}</p>`
          : `<p>${muscleWeek === 0 ? "Nothing yet this week. Finish a workout and watch your muscles light up!" : "Nothing logged that week."}</p>`}
        ${missing.length && worked.length ? `
          <p class="muscle-missing"><strong>Not worked ${muscleWeek === 0 ? "yet" : "that week"}:</strong></p>
          <ul class="muscle-tips">${missing.map((muscle) => `<li><strong>${muscle.name}</strong>: try ${muscle.fix}</li>`).join("")}</ul>` : ""}
        ${!missing.length ? `<p class="penalty-done">🏆 Every muscle worked! A total-body week!</p>` : ""}
      </div>
    </div>`;
}

document.querySelector("#muscle-area").addEventListener("click", (event) => {
  const week = event.target.closest("[data-muscle-week]");
  if (!week) return;
  muscleWeek = Number(week.dataset.muscleWeek);
  drawMuscleMap();
  document.querySelector(`[data-muscle-week="${muscleWeek}"]`).focus();
});


/* 6. SORE MUSCLE HELPER -----------------------------------------------------
   Tap where you're sore to get gentle stretches. Joints (knees and
   ankles) get a different message: joint pain isn't the same as sore
   muscles, so tell a grown-up!                                     */

const SORE_HELP = {
  neck: [
    { name: "Ear to shoulder", how: "Slowly tilt your ear toward your shoulder. Hold 15 seconds, then switch sides." },
    { name: "Chin to chest", how: "Gently look down at your belly button. Hold 15 seconds." },
  ],
  shoulders: [
    { name: "Arm circles", demo: "armCircles", how: "Small, slow circles forward, then backward. 20 seconds." },
    { name: "Cross-body stretch", how: "Pull one arm across your chest with your other hand. Hold 20 seconds each side." },
    { name: "Child's pose", demo: "childsPose", how: "Kneel, sit back on your heels and reach your arms far forward. Breathe slowly." },
  ],
  chest: [
    { name: "Doorway stretch", how: "Forearms on each side of a door frame. Lean through gently until you feel a stretch. Hold 20 seconds." },
    { name: "Hands behind your back", how: "Hold your hands behind you, squeeze your shoulder blades and lift your chest. Hold 15 seconds." },
  ],
  arms: [
    { name: "Triceps stretch", how: "Reach one hand down your back. Gently press that elbow with your other hand. Hold 20 seconds each side." },
    { name: "Wrist stretch", how: "Arm straight out, palm up. Gently pull your fingers back. Hold 15 seconds each side." },
    { name: "Arm circles", demo: "armCircles", how: "Slow and easy, forward then backward." },
  ],
  abs: [
    { name: "Cobra stretch", how: "Lie on your stomach, hands under your shoulders. Gently push your chest up, hips stay down. Hold 15 seconds." },
    { name: "Cat-cow", demo: "catCow", how: "On hands and knees, round your back up, then let it dip. Slow, with your breathing." },
    { name: "Easy walk", demo: "walk", how: "A relaxed 10-minute walk helps sore muscles feel better." },
  ],
  upperBack: [
    { name: "Cat-cow", demo: "catCow", how: "On hands and knees, round your back up, then let it dip. Slow, with your breathing." },
    { name: "Child's pose", demo: "childsPose", how: "Sit back on your heels and reach your arms far forward." },
    { name: "Big hug", how: "Hug yourself tight and round your upper back. Hold 20 seconds." },
  ],
  lowerBack: [
    { name: "Child's pose", demo: "childsPose", how: "Sit back on your heels and reach your arms forward. Breathe slowly." },
    { name: "Knees to chest", how: "Lie on your back and gently hug both knees. Hold 20 seconds." },
    { name: "Cat-cow", demo: "catCow", how: "Slow and gentle, with your breathing." },
  ],
  glutes: [
    { name: "Figure-4 stretch", how: "On your back, cross one ankle over the other knee and gently pull that leg toward you. 20 seconds each side." },
    { name: "Butterfly stretch", demo: "butterfly", how: "Soles of your feet together, gently press your knees down." },
    { name: "Hip circles", demo: "hipCircles", how: "Hands on hips, slow circles both ways." },
  ],
  hips: [
    { name: "Butterfly stretch", demo: "butterfly", how: "Soles of your feet together, gently press your knees down." },
    { name: "Kneeling hip stretch", how: "One knee down, other foot forward. Gently push your hips forward. Hold 20 seconds each side." },
    { name: "Side lunge stretch", demo: "sideLunge", how: "Wide stance, shift to one side. Hold, then switch." },
  ],
  quads: [
    { name: "Quad stretch", demo: "quadStretch", how: "Hold one foot behind you and gently pull your heel toward your bottom. Hold a wall for balance." },
    { name: "Easy walk", demo: "walk", how: "Gentle moving helps your legs recover faster than sitting still." },
  ],
  hamstrings: [
    { name: "Hamstring stretch", demo: "hamstringStretch", how: "Sit with one leg straight and gently reach toward your toes. No bouncing!" },
    { name: "Leg swings", demo: "legSwings", how: "Gentle, small swings forward and back." },
  ],
  calves: [
    { name: "Wall calf stretch", how: "Hands on a wall, one foot back with the heel down and the leg straight. Hold 20 seconds each side." },
    { name: "Ankle circles", how: "Lift one foot and draw slow circles with your toes, both ways." },
    { name: "Easy walk", demo: "walk", how: "A relaxed walk keeps your calves loose." },
  ],
};
const JOINT_PARTS = ["knees", "ankles"];

let sorePick = null;

function drawSoreHelper() {
  const area = document.querySelector("#sore-area");
  const picture = bodySVG(
    "Tap the part of your body that's sore",
    (part) => `is-tappable ${part === sorePick ? "is-picked" : ""}`,
    (part) => `role="button" tabindex="0" aria-label="${BODY_PARTS[part]}" aria-pressed="${part === sorePick}"`,
  );
  const chips = Object.entries(BODY_PARTS).map(([part, name]) => `
    <button class="lab-chip" type="button" data-sore="${part}" aria-pressed="${part === sorePick}">${name}</button>`).join("");

  let help = `<p class="sore-hint">👆 Tap the part of your body that's sore.</p>`;
  if (sorePick && JOINT_PARTS.includes(sorePick)) {
    help = `
      <div class="sore-warning">
        <p class="sore-warning__title">🛑 ${BODY_PARTS[sorePick]}: tell a grown-up</p>
        <p>Pain in a joint isn't the same as sore muscles, so don't stretch it. Rest it, and tell a grown-up how it happened. If it's swollen, ice wrapped in a towel can help.</p>
      </div>`;
  } else if (sorePick) {
    help = `
      <p class="sore-title">${BODY_PARTS[sorePick]}: gentle stretches</p>
      <ul class="sore-list">${SORE_HELP[sorePick].map((stretch, i) => `
        <li class="sore-item">
          ${stretch.demo ? `<button class="demo-button" type="button" data-sore-demo="${i}" aria-label="Show ${stretch.name}"><span data-demo-icon="${stretch.demo}"></span></button>` : `<span class="sore-item__dot" aria-hidden="true">🧘</span>`}
          <span><strong>${stretch.name}</strong><br>${stretch.how}</span>
        </li>`).join("")}</ul>
      <p class="quiz-total">Stretch slowly. It should feel like a gentle pull, never pain. Breathe!</p>`;
  }

  area.innerHTML = `
    <div class="sore-layout">
      <div class="sore-picture">${picture}</div>
      <div class="sore-help" aria-live="polite">${help}</div>
    </div>
    <details class="extra sore-parts">
      <summary>Pick from a list instead</summary>
      <div class="lab-chips">${chips}</div>
    </details>
    <div class="sore-facts">
      <p>💡 <strong>Sore a day or two after a workout?</strong> That's normal! It's called DOMS: your muscles are repairing themselves and getting stronger. Water, sleep and gentle moving help it go away in 2 to 3 days.</p>
      <p>🚨 <strong>Tell a grown-up right away if:</strong> the pain is sharp or stabbing, it's in a joint, something is swollen or bruised, it hurts even when you're resting, you can't move it normally, or it lasts more than 3 days.</p>
    </div>`;
  fillDemoIcons(area);
}

function pickSore(part) {
  sorePick = part === sorePick ? null : part;
  drawSoreHelper();
  const again = document.querySelector(`#sore-area .body-part[data-part="${part}"]`) || document.querySelector(`[data-sore="${part}"]`);
  again?.focus();
}

document.querySelector("#sore-area").addEventListener("click", (event) => {
  const shape = event.target.closest(".body-part[data-part]");
  if (shape) {
    pickSore(shape.dataset.part);
    return;
  }
  const chip = event.target.closest("[data-sore]");
  if (chip) {
    sorePick = chip.dataset.sore;
    drawSoreHelper();
    return;
  }
  const demo = event.target.closest("[data-sore-demo]");
  if (demo && sorePick) {
    const stretch = SORE_HELP[sorePick][Number(demo.dataset.soreDemo)];
    openDemo(stretch.demo, stretch.name, stretch.how);
  }
});

document.querySelector("#sore-area").addEventListener("keydown", (event) => {
  const shape = event.target.closest(".body-part[data-part]");
  if (shape && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    pickSore(shape.dataset.part);
  }
});


/* 7. DEMO CONTROLS: SLOW MOTION AND MIRROR ------------------------------------
   For the big stick figures (the "Show me" pop-up and the coach).
   Mirror flips the figure, like watching yourself in a mirror. Saved
   just on this device.                                             */

function applyDemoView() {
  const view = loadJSON("levelUp.demoView", {});
  demoSlow = Boolean(view.slow); // in demos.js
  if (view.mirror) document.documentElement.dataset.demoMirror = "on";
  else delete document.documentElement.dataset.demoMirror;
  document.querySelectorAll("[data-demo-view]").forEach((button) => {
    button.setAttribute("aria-pressed", String(Boolean(view[button.dataset.demoView])));
  });
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-demo-view]");
  if (!button) return;
  const view = loadJSON("levelUp.demoView", {});
  view[button.dataset.demoView] = !view[button.dataset.demoView];
  save("levelUp.demoView", JSON.stringify(view)); // just on this device
  applyDemoView();
});


/* 8. PLUGGING IN (see hooks.js) -------------------------------------------------- */

let trainingPlusReady = false;

function drawTrainingPlus() {
  if (!trainingPlusReady) {
    trainingPlusReady = true;
    setUpGoalForm();
  }
  drawGameDay();
  drawFitTest();
  drawGoals();
  drawMuscleMap();
  drawSoreHelper();
}

addPagePart("training", drawTrainingPlus);
addPagePart(null, () => {
  if (demoSlow === null) applyDemoView(); // once, when the page first draws
});

addSavedData("levelUp.fitTest", () => {
  const saved = loadJSON("levelUp.fitTest", {});
  fitData = saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
  fitDraft = null;
});
addSavedData("levelUp.goals", () => {
  const saved = loadJSON("levelUp.goals", []);
  goalsData = Array.isArray(saved) ? saved.filter((goal) => goal && goal.id && goal.target > 0 && goal.due) : [];
});

addXP("gameDay", () => 30, 2);
addXP("fitTest", () => 150, 1);
addXP("goalDone", () => GOAL_XP, 3);

addXPRule("Game Day Warm-Up", "+30");
addXPRule("Monthly Fitness Test", "+150");
addXPRule("Reach one of your goals", `+${GOAL_XP}`);

addBadge({ id: "gameReady", icon: "🏟️", name: "Game Ready", how: "Do 5 Game Day Warm-Ups", earned: () => logOf("gameDay").length >= 5 });
addBadge({ id: "tester", icon: "📋", name: "Report Card", how: "Finish your first Monthly Fitness Test", earned: () => logOf("fitTest").length >= 1 });
addBadge({
  id: "stronger", icon: "📈", name: "Getting Stronger", how: "Improve in 3 fitness tests in one month",
  earned: () => fitMonths().some((month) => FIT_TESTS.filter((test) => {
    const before = fitBefore(test.id, month);
    return before !== null && fitData[month][test.id] > before;
  }).length >= 3),
});
addBadge({ id: "goalGetter", icon: "🎯", name: "Goal Getter", how: "Reach one of your own goals", earned: () => logOf("goalDone").length >= 1 });
