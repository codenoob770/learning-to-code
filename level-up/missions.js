/* =============================================================
   missions.js: daily missions and the monthly challenge
   -------------------------------------------------------------
   1. Daily missions: 3 small tasks, new every day. Some check
      themselves (like "drink 6 glasses of water"), and some you
      check off yourself.
   2. The monthly challenge: one big goal for the whole month.

   This file loads before app.js, so it only uses app.js's
   functions inside its own functions, never right away.
   ============================================================= */


/* 1. DAILY MISSIONS -------------------------------------------------
   "auto" missions check themselves: auto(day) says if it's done.
   "go" is the tab with the thing you need for that mission.        */

const MISSIONS = [
  // These check themselves
  { id: "water6", icon: "💧", text: "Drink 6 glasses of water (tap them in Water & sleep)", auto: (key) => ((habits[key] || {}).water || 0) >= 6 },
  { id: "sleepLog", icon: "😴", text: "Log how long you slept last night", auto: (key) => typeof (habits[key] || {}).sleep === "number" },
  { id: "workout", icon: "🏋️", text: "Finish today's workout (or rest day)", auto: (key) => doneDays.has(key) },
  { id: "quiz", icon: "🧠", text: "Play a quiz round", auto: (key) => logOf("quiz").some((e) => e.d === key), go: "quiz" },
  { id: "quiz8", icon: "🎓", text: "Get 8 or more right in a quiz round", auto: (key) => logOf("quiz").some((e) => e.d === key && e.r >= 8), go: "quiz" },
  { id: "rate", icon: "🥤", text: "Rate today's drink (or tap \"Did not try it\")", auto: (key) => drinkSkips.has(key) || Object.values(drinkRatings).some((r) => r.date === key) },
  { id: "energy", icon: "⚡", text: "Do your energy check-in (in Water & sleep)", auto: (key) => key in energyLog },
  { id: "deck", icon: "🃏", text: "Play the card deck workout", auto: (key) => logOf("deck").some((e) => e.d === key), go: "arcade" },
  { id: "kicks", icon: "🥋", text: "Play a round of Kick Caller", auto: (key) => logOf("kicks").some((e) => e.d === key), go: "arcade" },
  { id: "spin", icon: "🎡", text: "Spin the wheel and do the challenge", auto: (key) => Boolean((spinData[key] || {}).done), go: "arcade" },
  { id: "training", icon: "🎓", text: "Practice a skill with the coach in Training", auto: (key) => logOf("drill").some((e) => e.d === key), go: "training" },

  // You check these off yourself
  { id: "jacks20", icon: "⭐", text: "Do 20 jumping jacks during a break from homework or TV" },
  { id: "stretch", icon: "🧘", text: "Stretch for 5 minutes before bed" },
  { id: "veggie", icon: "🥦", text: "Eat a fruit or veggie at every meal" },
  { id: "outside", icon: "🌳", text: "Play outside for 30 minutes" },
  { id: "helpCook", icon: "🍳", text: "Help cook dinner or pack your lunch" },
  { id: "pushups10", icon: "💪", text: "Do 10 push-ups before breakfast" },
  { id: "kicks20", icon: "🥋", text: "Practice 20 taekwondo kicks (any kind)" },
  { id: "touches", icon: "⚽", text: "50 soccer ball touches (inside, outside and sole of your foot)" },
  { id: "plankMax", icon: "⏱️", text: "Hold a plank as long as you can" },
  { id: "balance", icon: "🦩", text: "Balance on one foot for 30 seconds, each foot" },
  { id: "noScreens", icon: "📵", text: "No screens for 30 minutes before bed" },
  { id: "squatWait", icon: "🦵", text: "Do 15 squats while you wait for something (like the microwave)" },
  { id: "read", icon: "📚", text: "Read for 20 minutes" },
  { id: "thanks", icon: "🙌", text: "Say thanks to a coach, teacher or parent" },
  { id: "breakfast", icon: "🥣", text: "Eat a real breakfast" },
  { id: "curlups10", icon: "🛡️", text: "Do 10 curl-ups after school" },
  { id: "newFood", icon: "🍽️", text: "Try a food you've never had before" },
  { id: "teach", icon: "🧑‍🏫", text: "Teach someone a move from your workout" },
  { id: "flutter", icon: "🏊", text: "Do 30 flutter kicks (lying on your back)" },
  { id: "walk", icon: "🚶", text: "Go for a 15-minute walk" },
];

// The 3 missions for a day: 1 that checks itself and 2 you check off.
// They're picked with "lucky numbers" (app.js), so every device picks the same ones.
function missionsFor(key) {
  const byLuck = [...MISSIONS].sort((a, b) => luckyNumber(`${key} mission ${a.id}`) - luckyNumber(`${key} mission ${b.id}`));
  const auto = byLuck.filter((m) => m.auto).slice(0, 1);
  const manual = byLuck.filter((m) => !m.auto).slice(0, 2);
  return [...auto, ...manual];
}

function missionsDoneOn(key) {
  return missionChecks[key] || [];
}

function renderMissions() {
  const key = toKey(today);
  const missions = missionsFor(key);

  // Missions that check themselves: keep today's list up to date
  let done = missionsDoneOn(key).filter((id) => missions.some((m) => m.id === id));
  for (const mission of missions.filter((m) => m.auto)) {
    const isDone = mission.auto(key);
    if (isDone && !done.includes(mission.id)) done.push(mission.id);
    if (!isDone) done = done.filter((id) => id !== mission.id);
  }
  if (JSON.stringify(done) !== JSON.stringify(missionsDoneOn(key))) {
    missionChecks[key] = done;
    saveJSON("levelUp.missions", missionChecks);
  }

  const count = done.length;
  document.querySelector("#missions-count").textContent = count === 3 ? "All 3 done! 🎉" : `${count} of 3 done`;
  document.querySelector("#missions-list").innerHTML = missions.map((mission) => {
    const isDone = done.includes(mission.id);
    const control = mission.auto
      ? `<span class="mission__auto">${isDone ? "✓ Done" : "Checks itself"}</span>`
      : `<input type="checkbox" id="mission-${mission.id}" data-mission="${mission.id}" ${isDone ? "checked" : ""}>`;
    const text = mission.auto
      ? `<span class="mission__text">${mission.text}</span>`
      : `<label class="mission__text" for="mission-${mission.id}">${mission.text}</label>`;
    return `
      <li class="mission ${isDone ? "is-done" : ""}">
        <span class="mission__icon" aria-hidden="true">${mission.icon}</span>
        ${text}
        ${mission.go && !isDone ? `<button class="text-button" type="button" data-go-tab="${mission.go}">Go</button>` : ""}
        ${control}
      </li>`;
  }).join("");
}

document.querySelector("#missions-list").addEventListener("change", (event) => {
  const box = event.target.closest("[data-mission]");
  if (!box) return;
  const key = toKey(today);
  const before = missionsDoneOn(key).length;
  let done = missionsDoneOn(key).filter((id) => id !== box.dataset.mission);
  if (box.checked) done.push(box.dataset.mission);
  missionChecks[key] = done;
  saveJSON("levelUp.missions", missionChecks);
  render();
  if (box.checked && done.length === 3 && before < 3) {
    showToast(`All 3 missions done! +${XP_RULES.missionSweep} bonus XP 🎯`);
    sounds.fanfare();
  } else if (box.checked) {
    showToast(`Mission complete! +${XP_RULES.mission} XP`);
    sounds.done();
  }
  checkAchievements(true);
  document.querySelector(`#mission-${box.dataset.mission}`)?.focus();
});


/* 2. THE MONTHLY CHALLENGE ------------------------------------------
   One per month. "count" works out your number between two days
   (written like "2026-12-01"). If you started partway through a
   month, that month's goal is smaller, so it's still fair.          */

// Little counters the challenges use (from and to are day keys, like "2026-12-01")
const COUNT = {
  workouts: (from, to) => [...doneDays].filter((k) => k >= from && k <= to && !isRestDay(fromKey(k))).length,
  quizRight: (from, to) => logOf("quiz").filter((e) => e.d >= from && e.d <= to).reduce((sum, e) => sum + e.r, 0),
  missions: (from, to) => Object.entries(missionChecks).filter(([k]) => k >= from && k <= to).reduce((sum, [, ids]) => sum + ids.length, 0),
  sleep9: (from, to) => Object.entries(habits).filter(([k, day]) => k >= from && k <= to && day.sleep >= 9).length,
  water8: (from, to) => Object.entries(habits).filter(([k, day]) => k >= from && k <= to && (day.water || 0) >= 8).length,
  extraReps: (from, to) => activityLog.filter((e) => e.d >= from && e.d <= to).reduce((sum, e) => sum + (e.reps || 0), 0),
  bosses: (from, to) => bossHistory().filter((week) => week.beaten && week.to >= from && week.to <= to).length,
};

const MONTHLY = [
  { name: "Fresh Start", icon: "🎆", goal: 15, what: "workouts", count: COUNT.workouts },
  { name: "Brain Freeze", icon: "🧊", goal: 100, what: "right quiz answers", count: COUNT.quizRight },
  { name: "March Madness", icon: "🏀", goal: 18, what: "workouts", count: COUNT.workouts },
  { name: "Mission Possible", icon: "🎯", goal: 40, what: "daily missions", count: COUNT.missions },
  { name: "Sleep Champion", icon: "😴", goal: 20, what: "nights of 9+ hours of sleep", count: COUNT.sleep9 },
  { name: "Summer Splash", icon: "💦", goal: 20, what: "days with 8 glasses of water", count: COUNT.water8 },
  { name: "Firecracker", icon: "🎇", goal: 500, what: "bonus reps (quiz penalties, arcade and more)", count: COUNT.extraReps },
  { name: "Back to School", icon: "🎒", goal: 150, what: "right quiz answers", count: COUNT.quizRight },
  { name: "Mission Month", icon: "🗺️", goal: 50, what: "daily missions", count: COUNT.missions },
  { name: "Monster Month", icon: "👹", goal: 3, what: "weekly bosses beaten", count: COUNT.bosses },
  { name: "Turkey Trot", icon: "🦃", goal: 15, what: "workouts", count: COUNT.workouts },
  { name: "Winter Warrior", icon: "❄️", goal: 18, what: "workouts", count: COUNT.workouts },
];

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// The challenge for the month that "date" is in, and how you're doing
function monthlyFor(date) {
  const challenge = MONTHLY[date.getMonth()];
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const daysInMonth = last.getDate();

  // Started this month? Then the goal shrinks to fit the days you had
  let goal = challenge.goal;
  const started = startedOn(); // in app.js
  if (started > first) {
    const daysYouHad = daysBetween(started, last) + 1;
    goal = Math.max(1, Math.ceil((challenge.goal * daysYouHad) / daysInMonth));
  }

  const value = challenge.count(toKey(first), toKey(last));
  return { ...challenge, month: MONTH_NAMES[date.getMonth()], goal, smaller: goal < challenge.goal, value, complete: value >= goal, last };
}

// How many monthly challenges you've completed, from your first month until now
function monthliesWon() {
  let won = 0;
  const started = startedOn();
  for (let month = new Date(started.getFullYear(), started.getMonth(), 1); month <= today; month = new Date(month.getFullYear(), month.getMonth() + 1, 1)) {
    if (monthlyFor(month).complete) won += 1;
  }
  return won;
}

function renderMonthly() {
  const m = monthlyFor(today);
  const daysLeft = daysBetween(today, m.last);
  const left = daysLeft === 0 ? "Last day!" : `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`;

  document.querySelector("#monthly-title").textContent = `${m.icon} ${m.name}`;
  document.querySelector("#monthly-month").textContent = `// ${m.month} challenge`;
  document.querySelector("#monthly-goal").textContent = `Goal: ${m.goal} ${m.what} in ${m.month}.${m.smaller ? " (Smaller this month, since you started partway through.)" : ""}`;
  document.querySelector("#monthly-fill").style.width = `${Math.min(100, (m.value / m.goal) * 100)}%`;
  document.querySelector("#monthly-text").textContent = m.complete
    ? `✓ Complete! ${m.value} of ${m.goal}. +${XP_RULES.monthly} XP!`
    : `${m.value} of ${m.goal} · ${left}`;
  document.querySelector("#monthly").classList.toggle("is-complete", m.complete);
}
