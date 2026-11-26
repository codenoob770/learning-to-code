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
  questTask: 25,    // each quest task (quest.js)
  codeTask: 50,     // each Code Quest task (they're more work!)
  mission: 15,      // each daily mission (missions.js)
  missionSweep: 25, // extra for doing all 3 missions in a day
  monthly: 300,     // each monthly challenge you complete
  bossWin: 150,     // each weekly boss you beat (boss.js)
  kickRound: 20,    // each Kick Caller round, plus 1 per move (arcade.js)
  spin: 25,         // the daily spin-the-wheel challenge
  smoothie: 10,     // each smoothie you invent (kitchen.js)
  made: 15,         // each recipe you make ("I made this!")
  snackRight: 3,    // each right answer in Snack Swap
  beltUp: 250,      // each new taekwondo belt (sports.js)
  swim: 10,         // each swim you log
  swimTime: 10,     // each race or practice time you log
  soccerGame: 15,   // each soccer game in your journal
  goal: 5,          // extra for each goal you scored
  custom: 60,       // each workout you built and finished with the coach
  quizRight: 10,    // each right answer in the quiz (quiz.js)
  quizPerfect: 25,  // extra for a perfect 10/10 round
  penaltyDone: 5,   // each quiz penalty you do (you still did the work!)
};

// XP for things in the activity log (see logActivity in app.js).
// Each one is a little function: give it a log entry, get back the XP.
const LOG_XP = {
  quiz: (e) => e.r * XP_RULES.quizRight + (e.r === e.n && e.n >= 10 ? XP_RULES.quizPerfect : 0) + (e.p || 0) * XP_RULES.penaltyDone,
  deck: (e) => DECK_SIZES[e.size].xp, // 40, 80 or 160 (arcade.js)
  kicks: (e) => XP_RULES.kickRound + e.n,
  spin: () => XP_RULES.spin,
  smoothie: () => XP_RULES.smoothie,
  made: () => XP_RULES.made,
  snack: (e) => e.r * XP_RULES.snackRight,
  swim: () => XP_RULES.swim,
  swimTime: () => XP_RULES.swimTime,
  soccer: (e) => XP_RULES.soccerGame + e.g * XP_RULES.goal,
  custom: () => XP_RULES.custom,
};

// Some things only earn XP a few times a day, so nobody can farm
// XP (and shop coins) by tapping the same thing all day long
const LOG_DAILY_LIMIT = {
  quiz: 5,
  deck: 3,
  kicks: 3,
  spin: 1,
  smoothie: 3,
  made: 3,
  snack: 3,
  swim: 2,
  swimTime: 3,
  soccer: 2,
  custom: 2,
};

function logXP() {
  let xp = 0;
  const counts = {};
  for (const entry of activityLog) {
    const rule = LOG_XP[entry.t];
    if (!rule) continue;
    const dayAndType = `${entry.d} ${entry.t}`;
    counts[dayAndType] = (counts[dayAndType] || 0) + 1;
    if (counts[dayAndType] > (LOG_DAILY_LIMIT[entry.t] ?? Infinity)) continue;
    xp += rule(entry);
  }
  return xp;
}

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

  // Quests (quest.js): XP for each task, and how many stages of each quest
  // are done in order (stage 3 only counts once stages 1 and 2 are done too)
  const questStagesDone = {};
  let questsComplete = 0;
  for (const quest of QUESTS) {
    const ids = quest.stages.flatMap((stage) => stage.tasks.map((task) => task.id));
    xp += ids.filter((id) => questTasks.has(id)).length * (quest.code ? XP_RULES.codeTask : XP_RULES.questTask);
    const firstOpen = quest.stages.findIndex((stage) => !stage.tasks.every((task) => questTasks.has(task.id)));
    questStagesDone[quest.id] = firstOpen === -1 ? quest.stages.length : firstOpen;
    if (firstOpen === -1) questsComplete += 1;
  }
  const questStages = questStagesDone.backflip;

  // Daily missions (missions.js), with a bonus for all 3 in a day
  let missionsDone = 0;
  let missionSweeps = 0;
  for (const ids of Object.values(missionChecks)) {
    missionsDone += ids.length;
    if (ids.length >= 3) missionSweeps += 1;
  }
  xp += missionsDone * XP_RULES.mission + missionSweeps * XP_RULES.missionSweep;

  // Monthly challenges (missions.js) and weekly bosses (boss.js)
  const monthlies = monthliesWon();
  const bossesBeaten = bossHistory().filter((week) => week.beaten).length;
  xp += monthlies * XP_RULES.monthly + bossesBeaten * XP_RULES.bossWin;

  // Everything in the activity log: quizzes, arcade games and more
  xp += logXP();
  const quizRounds = logOf("quiz");
  const quizRight = quizRounds.reduce((sum, e) => sum + e.r, 0);
  const quizPerfect = quizRounds.some((e) => e.r === e.n && e.n >= 10);
  const penaltyReps = quizRounds.reduce((sum, e) => sum + (e.reps || 0), 0);
  const fullDeck = logOf("deck").some((e) => e.size === "full");
  const bestKicks = Math.max(0, ...logOf("kicks").map((e) => e.n));
  const spins = logOf("spin").length;
  const smoothies = recipeBook.smoothies.length;
  const recipesMade = logOf("made").length;
  const snackPerfect = logOf("snack").some((e) => e.r === e.n);

  // Sports (sports.js)
  xp += beltData.history.length * XP_RULES.beltUp;
  const swims = logOf("swim").length;
  const games = logOf("soccer");
  const goals = games.reduce((sum, g) => sum + g.g, 0);
  const hatTrick = games.some((g) => g.g >= 3);
  const builtWorkouts = logOf("custom").length;
  // A new personal best: a time faster than every earlier time in that event
  let fasterTime = false;
  const firstTimes = {};
  for (const entry of logOf("swimTime")) {
    if (entry.event in firstTimes && entry.secs < firstTimes[entry.event]) fasterTime = true;
    firstTimes[entry.event] = Math.min(entry.secs, firstTimes[entry.event] ?? Infinity);
  }

  const ratings = Object.keys(drinkRatings).length;
  const pushups = bests.pushups ? bests.pushups.count : 0;
  const curlups = bests.curlups ? bests.curlups.count : 0;
  const testDone = Object.values(testScores).some((s) => s && (s.pushups !== null || s.curlups !== null));

  xp += ratings * XP_RULES.drinkRating;
  xp += (pushups + curlups) * XP_RULES.trainerRep;
  if (testDone) xp += XP_RULES.testScores;

  return { xp, workouts, bestStreak, comeback, perfectWeek, ratings, pushups, curlups, testDone, waterDays, sleepDays, questStages, questStagesDone, questsComplete,
    missionsDone, missionSweeps, monthlies, bossesBeaten, quizRight,
    fullDeck, bestKicks, spins, smoothies, recipesMade, snackPerfect,
    belts: beltData.history.length, swims, goals, hatTrick, builtWorkouts, fasterTime, quizPerfect, penaltyReps, expertCount: expertDays.size };
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
  { id: "quizWhiz", icon: "🧠", name: "Quiz Whiz", how: "Get a perfect 10/10 quiz round", earned: (s) => s.quizPerfect },
  { id: "brainiac", icon: "🎓", name: "Brainiac", how: "100 right quiz answers", earned: (s) => s.quizRight >= 100 },
  { id: "noExcuses", icon: "😤", name: "No Excuses", how: "Do 100 reps of quiz penalties", earned: (s) => s.penaltyReps >= 100 },
  { id: "bendy", icon: "🧘", name: "Bendy", how: "Finish the Splits Quest", earned: (s) => s.questStagesDone.splits >= SPLITS_QUEST.stages.length },
  { id: "upsideDown", icon: "🙃", name: "Upside Down", how: "Finish the Handstand Quest", earned: (s) => s.questStagesDone.handstand >= HANDSTAND_QUEST.stages.length },
  { id: "century", icon: "💯", name: "Century Club", how: "Finish the 100 Push-ups Quest", earned: (s) => s.questStagesDone.pushups >= PUSHUP_QUEST.stages.length },
  { id: "keepyUppy", icon: "⚽", name: "Keepy-Uppy King", how: "Finish the Juggling Quest", earned: (s) => s.questStagesDone.juggling >= JUGGLING_QUEST.stages.length },
  { id: "helloWorld", icon: "👋", name: "Hello, World!", how: "Finish stage 1 of Code Quest", earned: (s) => s.questStagesDone.code >= 1 },
  { id: "coder", icon: "💻", name: "Real Coder", how: "Finish the whole Code Quest", earned: (s) => s.questStagesDone.code >= CODE_QUEST.stages.length },
  { id: "questMaster", icon: "🗺️", name: "Quest Master", how: "Finish 3 whole quests", earned: (s) => s.questsComplete >= 3 },
  { id: "missions", icon: "🎯", name: "Mission Master", how: "All 3 daily missions on 7 days", earned: (s) => s.missionSweeps >= 7 },
  { id: "monthly", icon: "📆", name: "Monthly Champ", how: "Complete a monthly challenge", earned: (s) => s.monthlies >= 1 },
  { id: "bossSlayer", icon: "⚔️", name: "Boss Slayer", how: "Beat a weekly boss", earned: (s) => s.bossesBeaten >= 1 },
  { id: "bossHunter", icon: "🐉", name: "Boss Hunter", how: "Beat 5 weekly bosses", earned: (s) => s.bossesBeaten >= 5 },
  { id: "cardShark", icon: "🃏", name: "Card Shark", how: "Finish a full 52-card deck", earned: (s) => s.fullDeck },
  { id: "kickMachine", icon: "🥋", name: "Kick Machine", how: "40 moves in one Kick Caller round", earned: (s) => s.bestKicks >= 40 },
  { id: "luckySpin", icon: "🎡", name: "Lucky Spinner", how: "Finish 7 spin-the-wheel challenges", earned: (s) => s.spins >= 7 },
  { id: "scientist", icon: "🧪", name: "Smoothie Scientist", how: "Invent 5 smoothies", earned: (s) => s.smoothies >= 5 },
  { id: "chef", icon: "🧑‍🍳", name: "Junior Chef", how: "Make 5 recipes", earned: (s) => s.recipesMade >= 5 },
  { id: "snackPro", icon: "🥕", name: "Snack Pro", how: "Get 10/10 in Snack Swap", earned: (s) => s.snackPerfect },
  { id: "beltUp", icon: "🎽", name: "Belt Up", how: "Pass a taekwondo belt test", earned: (s) => s.belts >= 1 },
  { id: "swimTeam", icon: "🏊", name: "Swim Team", how: "Log 10 swims", earned: (s) => s.swims >= 10 },
  { id: "waterRocket", icon: "🚀", name: "Water Rocket", how: "Beat one of your swim times", earned: (s) => s.fasterTime },
  { id: "hatTrick", icon: "🎩", name: "Hat Trick", how: "Score 3 goals in one game", earned: (s) => s.hatTrick },
  { id: "golazo", icon: "🥅", name: "Golazo", how: "Score 10 goals in your journal", earned: (s) => s.goals >= 10 },
  { id: "designer", icon: "🛠️", name: "Workout Designer", how: "Finish a workout you built", earned: (s) => s.builtWorkouts >= 1 },
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
  ["Quest task", `+${XP_RULES.questTask}`],
  ["Code Quest task", `+${XP_RULES.codeTask}`],
  ["Daily mission", `+${XP_RULES.mission}`],
  ["All 3 missions in a day", `+${XP_RULES.missionSweep} more`],
  ["Beat the weekly boss", `+${XP_RULES.bossWin}`],
  ["Complete the monthly challenge", `+${XP_RULES.monthly}`],
  ["Card deck workout (3 a day)", "+40 to +160"],
  ["Kick Caller round (3 a day)", `+${XP_RULES.kickRound}, +1 per move`],
  ["Spin-the-wheel challenge", `+${XP_RULES.spin}`],
  ["Invent a smoothie (3 a day)", `+${XP_RULES.smoothie}`],
  ["Make a recipe (3 a day)", `+${XP_RULES.made}`],
  ["Snack Swap right answer", `+${XP_RULES.snackRight}`],
  ["Pass a belt test", `+${XP_RULES.beltUp}`],
  ["Log a swim or a swim time", `+${XP_RULES.swim}`],
  ["Log a soccer game", `+${XP_RULES.soccerGame}, +${XP_RULES.goal} per goal`],
  ["Finish a workout you built", `+${XP_RULES.custom}`],
  ["Right quiz answer (5 rounds a day)", `+${XP_RULES.quizRight}`],
  ["Perfect quiz round", `+${XP_RULES.quizPerfect} more`],
  ["Do a quiz penalty", `+${XP_RULES.penaltyDone}`],
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
