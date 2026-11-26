/* =============================================================
   boss.js: the weekly boss battle
   -------------------------------------------------------------
   Every week (Monday to Sunday) a new boss shows up. Every rep you
   do hits it:
   - each workout you finish hits it with all of that workout's reps
   - quiz penalties and arcade games add their reps too
   - each daily mission is worth 10 hits

   The boss has as much health (HP) as 70% of the week's workout
   reps, so finishing most of your workouts (or doing extra stuff)
   beats it. (In the week you started, only the days since you
   started count.) A held move, like a plank, counts 1 rep for every
   2 seconds, and long ones in minutes count 3 a minute.

   This file loads before app.js, so it only uses app.js's
   functions inside its own functions, never right away.
   ============================================================= */

// Want a new boss? Copy one line, change it, and it joins the rotation!
const BOSSES = [
  { name: "The Couch Goblin", emoji: "🛋️", line: "Wants you to sit around all day long." },
  { name: "Sugar Slime", emoji: "🍬", line: "Gets stronger every time you drink a soda." },
  { name: "The Screen Zombie", emoji: "🧟", line: "Hypnotizes you with endless videos." },
  { name: "King Snooze", emoji: "😴", line: "Hits the snooze button 47 times." },
  { name: "The Greasy Fry Dragon", emoji: "🐲", line: "Breathes french fry fire!" },
  { name: "The Excuse Tornado", emoji: "🌪️", line: "\"Too tired! Too busy! Tomorrow!\"" },
  { name: "Professor Slowpoke", emoji: "🐌", line: "Thinks fast is a bad word." },
  { name: "The Lazy Lava Golem", emoji: "🌋", line: "Melts into a puddle at the first push-up." },
];

const BOSS_SHARE = 0.7;      // HP = 70% of the week's workout reps
const MISSION_DAMAGE = 10;   // hits for each daily mission

// How many "reps" are in one move. Held moves count 1 for every 2 seconds,
// and long ones in minutes (like "play your sport, 30 min") count 3 a minute.
function repsInMove(move) {
  let reps = move.amount;
  if (move.unit === "sec") reps = move.amount / 2;
  if (move.unit === "min") reps = move.amount * 3;
  if (move.each) reps *= 2;
  return Math.round(reps);
}

// All the reps in one day's workout (rest days have none)
function repsInWorkout(date) {
  const workout = workoutFor(date); // in app.js
  if (workout.style === "rest") return 0;
  let reps = 0;
  for (const move of workout.moves) reps += repsInMove(move) * workout.rounds;
  for (const move of workout.sportMoves) reps += repsInMove(move);
  return reps;
}

// The boss for the week starting on "monday". Bosses take turns, in order.
function bossFor(monday) {
  const weekNumber = Math.floor(daysBetween(new Date(2024, 0, 1), monday) / 7);
  return BOSSES[((weekNumber % BOSSES.length) + BOSSES.length) % BOSSES.length];
}

// One week's fight: the boss, its HP, and how much damage you did
function bossWeek(monday) {
  const from = toKey(monday);
  const to = toKey(addDays(monday, 6));
  const started = startedOn(); // days before you started don't count (app.js)
  let hp = 0;
  let damage = 0;
  for (let i = 0; i < 7; i++) {
    const date = addDays(monday, i);
    const reps = repsInWorkout(date);
    if (date >= started) hp += reps;
    if (doneDays.has(toKey(date))) damage += reps;
  }
  hp = Math.max(100, Math.round(hp * BOSS_SHARE));

  for (const entry of activityLog) {
    if (entry.d >= from && entry.d <= to) damage += entry.reps || 0;
  }
  for (const [key, ids] of Object.entries(missionChecks)) {
    if (key >= from && key <= to) damage += ids.length * MISSION_DAMAGE;
  }
  return { boss: bossFor(monday), hp, damage, beaten: damage >= hp, from, to };
}

// Every week since you started, up to this week (remembered until your progress changes)
let bossCache = { version: -1, weeks: [] };

function bossHistory() {
  if (bossCache.version === dataVersion) return bossCache.weeks;
  const weeks = [];
  for (let monday = mondayOf(planStart); monday <= today; monday = addDays(monday, 7)) {
    weeks.push(bossWeek(monday));
  }
  bossCache = { version: dataVersion, weeks };
  return weeks;
}

let lastBossDamage = null; // to shake the boss when you hit it

function renderBoss() {
  const week = bossWeek(mondayOf(today));
  const left = Math.max(0, week.hp - week.damage);
  const daysLeft = 6 - dayIndex(today);
  const box = document.querySelector("#boss");

  document.querySelector("#boss-emoji").textContent = week.boss.emoji;
  document.querySelector("#boss-title").textContent = week.boss.name;
  document.querySelector("#boss-line").textContent = week.boss.line;
  document.querySelector("#boss-hp-fill").style.width = `${(left / week.hp) * 100}%`;
  document.querySelector("#boss-hp").setAttribute("aria-valuenow", String(left));
  document.querySelector("#boss-hp").setAttribute("aria-valuemax", String(week.hp));
  document.querySelector("#boss-text").textContent = week.beaten
    ? `💥 DEFEATED! You hit it ${week.damage} times. +${XP_RULES.bossWin} XP!`
    : `HP ${left} of ${week.hp} · ${daysLeft === 0 ? "Last day to beat it!" : `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`}`;
  box.classList.toggle("is-beaten", week.beaten);

  // Past bosses you beat
  const beaten = bossHistory().filter((w) => w.beaten);
  document.querySelector("#boss-shelf").textContent = beaten.length
    ? `Bosses beaten: ${beaten.map((w) => w.boss.emoji).join(" ")} (${beaten.length})`
    : "Bosses beaten: none yet. This could be the first!";

  // You hit it! Shake the boss (and cheer if that knocked it out)
  if (lastBossDamage !== null && week.damage > lastBossDamage) {
    const emoji = document.querySelector("#boss-emoji");
    emoji.classList.remove("is-hit");
    void emoji.offsetWidth; // restart the animation
    emoji.classList.add("is-hit");
    // (A moment later, so it doesn't cover up the message for what you just did)
    if (week.beaten && lastBossDamage < week.hp) setTimeout(() => showToast(`💥 You defeated ${week.boss.name}! +${XP_RULES.bossWin} XP`), 2600);
  }
  lastBossDamage = week.damage;
}
