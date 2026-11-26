/* =============================================================
   trophies.js: XP, levels and badges
   -------------------------------------------------------------
   Everything here is worked out from your progress (done days,
   streaks, scores and ratings), so it never needs saving on its
   own, and it syncs across devices by itself.

   1. How you earn XP
   2. Levels and ranks
   3. Badges
   4. The trophy case
   5. Celebrations (with confetti!)

   This file loads before app.js, so it only uses app.js's
   functions inside its own functions, never right away.
   ============================================================= */


/* 1. HOW YOU EARN XP ---------------------------------------------- */

const XP_RULES = {
  workout: 100,     // each workout day you mark done
  restDay: 50,      // each rest day you mark done
  expertBonus: 100, // extra for a workout done in expert mode
  streakBonus: 10,  // extra for every day of your streak so far (up to 10 days)
  drinkRating: 10,  // each drink you rate
  trainerRep: 5,    // each rep of your best push-ups and best curl-ups
  testScores: 200,  // saving your real gym test scores
  water: 5,         // each glass of water (up to 8 a day)
  sleepLogged: 10,  // logging how long you slept
  goodSleep: 10,    // extra for 9 hours or more
  questTask: 25,    // each Backflip Quest task (quest.js)
};

function isRestDay(date) {
  return WEEK[dayIndex(date)].style === "rest" || daysUntilTest(date) === 1;
}

// Facts about your progress that XP and badges are worked out from
function trophyStats() {
  const days = [...doneDays].sort();
  let xp = 0;
  let workouts = 0;
  let bestStreak = 0;
  let comeback = false;

  for (const key of days) {
    const date = fromKey(key);
    if (isRestDay(date)) {
      xp += XP_RULES.restDay;
    } else {
      xp += XP_RULES.workout;
      workouts += 1;
    }
    if (expertDays.has(key)) xp += XP_RULES.expertBonus;

    // How long was the streak on this day?
    let streak = 1;
    while (doneDays.has(toKey(addDays(date, -streak)))) streak += 1;
    xp += XP_RULES.streakBonus * Math.min(streak - 1, 10);
    bestStreak = Math.max(bestStreak, streak);

    // Did you bounce back the day after missing one?
    if (missedDays.has(toKey(addDays(date, -1)))) comeback = true;
  }

  // A perfect week: every day from Monday to Sunday done
  let perfectWeek = false;
  for (const key of days) {
    const monday = mondayOf(fromKey(key));
    let all = true;
    for (let i = 0; i < 7; i++) {
      if (!doneDays.has(toKey(addDays(monday, i)))) all = false;
    }
    if (all) perfectWeek = true;
  }

  // Water and sleep (habits.js)
  let waterDays = 0;
  let sleepDays = 0;
  for (const day of Object.values(habits)) {
    xp += Math.min(day.water || 0, 8) * XP_RULES.water;
    if ((day.water || 0) >= 8) waterDays += 1;
    if (typeof day.sleep === "number") {
      xp += XP_RULES.sleepLogged;
      if (day.sleep >= 9) {
        xp += XP_RULES.goodSleep;
        sleepDays += 1;
      }
    }
  }

  // Backflip Quest (quest.js): XP for each task, and how many stages are done
  // in order (stage 3 only counts once stages 1 and 2 are done too)
  const questTaskIds = SIDE_QUEST.stages.flatMap((stage) => stage.tasks.map((task) => task.id));
  xp += questTaskIds.filter((id) => questTasks.has(id)).length * XP_RULES.questTask;
  const firstOpenStage = SIDE_QUEST.stages.findIndex((stage) => !stage.tasks.every((task) => questTasks.has(task.id)));
  const questStages = firstOpenStage === -1 ? SIDE_QUEST.stages.length : firstOpenStage;

  const ratings = Object.keys(drinkRatings).length;
  const pushups = bests.pushups ? bests.pushups.count : 0;
  const curlups = bests.curlups ? bests.curlups.count : 0;
  const testDone = Object.values(testScores).some((s) => s && (s.pushups !== null || s.curlups !== null));

  xp += ratings * XP_RULES.drinkRating;
  xp += (pushups + curlups) * XP_RULES.trainerRep;
  if (testDone) xp += XP_RULES.testScores;

  return { xp, workouts, bestStreak, comeback, perfectWeek, ratings, pushups, curlups, testDone, waterDays, sleepDays, questStages, expertCount: expertDays.size };
}


/* 2. LEVELS AND RANKS --------------------------------------------
   Each level needs a bit more XP than the last:
   level 2 at 100 XP, level 3 at 300, level 4 at 600, level 5 at 1,000... */

function xpForLevel(level) {
  return 50 * level * (level - 1);
}

function levelFor(xp) {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level += 1;
  return level;
}

const RANKS = [
  { from: 1, name: "Rookie" },
  { from: 3, name: "Rising Star" },
  { from: 5, name: "Athlete" },
  { from: 8, name: "All-Star" },
  { from: 11, name: "Champion" },
  { from: 15, name: "Legend" },
];

function rankFor(level) {
  return RANKS.filter((rank) => rank.from <= level).pop().name;
}


/* 3. BADGES ----------------------------------------------------- */

const BADGES = [
  { id: "first", icon: "👟", name: "First Step", how: "Finish your first workout", earned: (s) => s.workouts >= 1 },
  { id: "streak3", icon: "🔥", name: "On Fire", how: "3 days in a row", earned: (s) => s.bestStreak >= 3 },
  { id: "streak7", icon: "⚡", name: "Unstoppable", how: "7 days in a row", earned: (s) => s.bestStreak >= 7 },
  { id: "ten", icon: "🔟", name: "Double Digits", how: "Finish 10 workouts", earned: (s) => s.workouts >= 10 },
  { id: "week", icon: "📅", name: "Perfect Week", how: "Every day of one week done", earned: (s) => s.perfectWeek },
  { id: "expert", icon: "🌶️", name: "Expert Crusher", how: "Finish a workout in expert mode", earned: (s) => s.expertCount >= 1 },
  { id: "comeback", icon: "💪", name: "Comeback Kid", how: "Work out the day after missing one", earned: (s) => s.comeback },
  { id: "pushups", icon: "🏋️", name: "Push-up Pro", how: "20 push-ups on the beat trainer", earned: (s) => s.pushups >= 20 },
  { id: "curlups", icon: "🛡️", name: "Core of Steel", how: "30 curl-ups on the beat trainer", earned: (s) => s.curlups >= 30 },
  { id: "test", icon: "🏅", name: "Test Day Hero", how: "Save your gym test scores", earned: (s) => s.testDone },
  { id: "taster", icon: "🥤", name: "Taste Tester", how: "Rate 5 drinks", earned: (s) => s.ratings >= 5 },
  { id: "allDrinks", icon: "🌈", name: "Drink Explorer", how: "Rate every drink", earned: (s) => s.ratings >= DRINKS.length },
  { id: "water", icon: "💧", name: "Hydration Hero", how: "8 glasses of water on 5 days", earned: (s) => s.waterDays >= 5 },
  { id: "sleep", icon: "😴", name: "Sleep Champ", how: "9+ hours of sleep on 5 nights", earned: (s) => s.sleepDays >= 5 },
  { id: "flipReady", icon: "🦘", name: "Flip Ready", how: "Finish stages 1 to 3 of the Backflip Quest", earned: (s) => s.questStages >= 3 },
  { id: "backflip", icon: "🤸", name: "Backflip Legend", how: "Finish the whole Backflip Quest", earned: (s) => s.questStages >= SIDE_QUEST.stages.length },
];


/* 4. THE TROPHY CASE --------------------------------------------- */

function renderTrophies() {
  const stats = trophyStats();
  const level = levelFor(stats.xp);
  const thisLevel = xpForLevel(level);
  const nextLevel = xpForLevel(level + 1);

  document.querySelector("#player-level").textContent = level;
  document.querySelector("#player-rank").textContent = rankFor(level);
  document.querySelector("#player-xp").textContent = `${stats.xp.toLocaleString()} XP`;
  document.querySelector("#xp-fill").style.width = `${((stats.xp - thisLevel) / (nextLevel - thisLevel)) * 100}%`;
  document.querySelector("#xp-next").textContent = `${(nextLevel - stats.xp).toLocaleString()} XP to level ${level + 1}`;

  const earned = BADGES.filter((badge) => badge.earned(stats));
  document.querySelector("#badge-count").textContent = `${earned.length} of ${BADGES.length} badges`;
  renderPowerUps();

  document.querySelector("#badges").innerHTML = BADGES.map((badge) => {
    const got = earned.includes(badge);
    return `
      <li class="badge ${got ? "is-earned" : ""}">
        <span class="badge__icon" aria-hidden="true">${badge.icon}</span>
        <span class="badge__name">${badge.name}</span>
        <span class="badge__how">${got ? "Unlocked!" : badge.how}</span>
      </li>`;
  }).join("");
}

// The "How to earn XP" list
document.querySelector("#xp-rules").innerHTML = [
  ["Finish a workout", `+${XP_RULES.workout}`],
  ["Finish a rest day", `+${XP_RULES.restDay}`],
  ["Do it in expert mode", `+${XP_RULES.expertBonus} more`],
  ["Keep your streak going", `+${XP_RULES.streakBonus} per day`],
  ["Rate a drink", `+${XP_RULES.drinkRating}`],
  ["Beat trainer best", `+${XP_RULES.trainerRep} per rep`],
  ["Save your test scores", `+${XP_RULES.testScores}`],
  ["Drink a glass of water", `+${XP_RULES.water}`],
  ["Log your sleep", `+${XP_RULES.sleepLogged}`],
  ["Sleep 9 hours or more", `+${XP_RULES.goodSleep} more`],
  ["Backflip Quest task", `+${XP_RULES.questTask}`],
].map(([what, xp]) => `<li><span>${what}</span><span>${xp} XP</span></li>`).join("");


/* 4b. BUG BASH POWER-UPS ------------------------------------------
   Workouts in the last 7 days earn power-ups in Bug Bash:
   +1 extra test (life) per workout, up to 5, and a can of bug spray
   (squashes every bug on screen once a game) for 3 or more.
   They travel to Bug Bash in the link, like "#powerups-3-spray".   */

function bugBashPowerUps() {
  let workouts = 0;
  for (let i = 0; i < 7; i++) {
    const date = addDays(today, -i);
    if (doneDays.has(toKey(date)) && !isRestDay(date)) workouts += 1;
  }
  return { lives: Math.min(5, workouts), spray: workouts >= 3, workouts };
}

function renderPowerUps() {
  const power = bugBashPowerUps();
  // On claude.ai, link to the Claude version of Bug Bash; elsewhere to the folder next door
  const bugBash = window.claude && window.claude.use ? "https://claude.ai/artifact/MH6FXk37dqcHHrdg4Sjkrx" : "../bug-bash/";
  const hash = power.lives > 0 ? `#powerups-${power.lives}${power.spray ? "-spray" : ""}` : "";
  let text = "Finish workouts to earn Bug Bash power-ups: an extra life for each one this week, and bug spray for 3 or more!";
  if (power.lives > 0) {
    text = `${power.workouts} ${power.workouts === 1 ? "workout" : "workouts"} in the last 7 days: <strong>+${power.lives} extra ${power.lives === 1 ? "test" : "tests"}</strong>${power.spray ? " and <strong>bug spray</strong>" : ""} in Bug Bash!`;
    if (!power.spray) text += ` Do ${3 - power.workouts} more for bug spray.`;
  }
  document.querySelector("#powerups-text").innerHTML = text;
  document.querySelector("#powerups-link").href = bugBash + hash;
}


/* 5. CELEBRATIONS -------------------------------------------------
   "Seen" remembers the highest level and the badges you've already
   been shown, so each celebration only happens once (on every device). */

// Call after you DO something. celebrate = false just remembers quietly
// (used when the page opens or another device syncs).
function checkAchievements(celebrate) {
  const stats = trophyStats();
  const level = levelFor(stats.xp);
  const earnedIds = BADGES.filter((badge) => badge.earned(stats)).map((badge) => badge.id);
  const seen = loadJSON("levelUp.seen", null);

  if (!seen) {
    save("levelUp.seen", JSON.stringify({ level, badges: earnedIds }));
    return;
  }

  const newBadges = BADGES.filter((badge) => earnedIds.includes(badge.id) && !seen.badges.includes(badge.id));
  const leveledUp = level > seen.level;
  if (!leveledUp && newBadges.length === 0) return;

  save("levelUp.seen", JSON.stringify({
    level: Math.max(level, seen.level),
    badges: [...new Set([...seen.badges, ...earnedIds])],
  }));
  if (celebrate) showCelebration(leveledUp ? level : null, newBadges, seen.level);
}

// What to say under "Level 4!": a new rank, or how far the next one is
function levelMessage(level, previousLevel) {
  const rank = rankFor(level);
  if (rank !== rankFor(previousLevel)) {
    return `You're now ${/^[AEIOU]/.test(rank) ? "an" : "a"} ${rank}!`;
  }
  const nextRank = RANKS.find((r) => r.from > level);
  if (!nextRank) return "You're a Legend. Keep it up!";
  const levelsLeft = nextRank.from - level;
  return `${levelsLeft} more level${levelsLeft === 1 ? "" : "s"} until ${nextRank.name}!`;
}

const celebrateBox = document.querySelector("#celebrate");

function showCelebration(level, newBadges, previousLevel) {
  document.querySelector("#celebrate-eyebrow").textContent = level ? "// level up!" : "// badge unlocked!";
  document.querySelector("#celebrate-title").textContent = level
    ? `Level ${level}!`
    : newBadges.length === 1 ? newBadges[0].name : `${newBadges.length} new badges!`;
  document.querySelector("#celebrate-text").textContent = level
    ? levelMessage(level, previousLevel)
    : "Nice work. Check out your trophy case!";
  document.querySelector("#celebrate-badges").innerHTML = newBadges.map((badge) => `
    <li class="badge is-earned">
      <span class="badge__icon" aria-hidden="true">${badge.icon}</span>
      <span class="badge__name">${badge.name}</span>
      <span class="badge__how">${badge.how}</span>
    </li>`).join("");

  celebrateBox.hidden = false;
  document.querySelector("#celebrate-close").focus();
  sounds.fanfare();
  confetti();
}

function closeCelebration() {
  celebrateBox.hidden = true;
}

document.querySelector("#celebrate-close").addEventListener("click", closeCelebration);
celebrateBox.addEventListener("click", (event) => {
  if (event.target === celebrateBox) closeCelebration(); // tapped outside the card
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !celebrateBox.hidden) closeCelebration();
});

// Confetti! Little colored rectangles that fall and spin on a canvas.
function confetti() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const canvas = document.querySelector("#confetti");
  const c = canvas.getContext("2d");
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * ratio;
  canvas.height = window.innerHeight * ratio;
  c.setTransform(ratio, 0, 0, ratio, 0, 0);

  const colors = ["#ffe24d", "#7fdcc8", "#ff7a5c", "#a3b4ff", "#ffffff", "#ff3b3b"];
  const pieces = [];
  for (let i = 0; i < 150; i++) {
    pieces.push({
      x: Math.random() * window.innerWidth,
      y: -20 - Math.random() * window.innerHeight * 0.5,
      vx: (Math.random() - 0.5) * 3,
      vy: 2 + Math.random() * 3,
      size: 6 + Math.random() * 6,
      spin: Math.random() * Math.PI,
      spinSpeed: (Math.random() - 0.5) * 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }

  const start = performance.now();
  function frame(now) {
    c.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (const p of pieces) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.04; // gravity
      p.spin += p.spinSpeed;
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.spin);
      c.fillStyle = p.color;
      c.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      c.restore();
    }
    if (now - start < 3500) requestAnimationFrame(frame);
    else c.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }
  requestAnimationFrame(frame);
}
