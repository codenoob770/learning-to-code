/* =============================================================
   stats.js: the Stats tab (and the energy check-in)
   -------------------------------------------------------------
   1. Energy check-in: how do you feel today, 1 to 5? (It's in the
      Water & sleep box on the Today tab.) The Stats tab charts it
      and finds patterns, like "you feel better after 9+ hours of
      sleep".
   2. Calendar heat map: every day of the year, lit up when you
      worked out
   3. Personal records
   4. Year in review: your whole year, in big numbers
   5. Stats card: a picture of your stats you can save and show

   This file loads before app.js, so it only uses app.js's
   functions inside its own functions, never right away.
   ============================================================= */


/* 1. ENERGY CHECK-IN ---------------------------------------------------- */

const ENERGY = [
  { value: 1, face: "😫", name: "Wiped out" },
  { value: 2, face: "😕", name: "Low" },
  { value: 3, face: "🙂", name: "Okay" },
  { value: 4, face: "😀", name: "Good" },
  { value: 5, face: "🤩", name: "Amazing" },
];

function renderEnergyCheckIn() {
  const key = toKey(today);
  const now = energyLog[key];
  document.querySelector("#energy-choices").innerHTML = ENERGY.map((e) => `
    <button class="energy" type="button" data-energy="${e.value}" aria-pressed="${now === e.value}" title="${e.name}">
      <span aria-hidden="true">${e.face}</span><span class="visually-hidden">${e.name}</span>
    </button>`).join("");
  document.querySelector("#energy-note").textContent = now
    ? `Today: ${ENERGY[now - 1].name}. See your patterns on the Stats tab!`
    : "Tap how you feel today.";
}

document.querySelector("#energy-choices").addEventListener("click", (event) => {
  const button = event.target.closest("[data-energy]");
  if (!button) return;
  const key = toKey(today);
  const value = Number(button.dataset.energy);
  const first = !(key in energyLog);
  energyLog[key] = value;
  saveJSON("levelUp.energy", energyLog);
  sounds.rate(value * 2);
  render();
  showToast(first ? `Thanks for checking in! +${XP_RULES.energy} XP` : "Updated!");
  checkAchievements(true);
  document.querySelector(`[data-energy="${value}"]`).focus();
});

// Average energy on days that match a test, like "slept 9+ hours"
function averageEnergy(test) {
  const values = Object.entries(energyLog).filter(([key]) => test(key)).map(([, value]) => value);
  return values.length >= 3 ? { average: values.reduce((a, b) => a + b, 0) / values.length, days: values.length } : null;
}

// Little discoveries about what makes you feel good
function energyInsights() {
  const facts = [];
  const sleptWell = averageEnergy((key) => ((habits[key] || {}).sleep || 0) >= 9);
  const sleptLess = averageEnergy((key) => typeof (habits[key] || {}).sleep === "number" && habits[key].sleep < 9);
  if (sleptWell && sleptLess) {
    const diff = sleptWell.average - sleptLess.average;
    if (Math.abs(diff) >= 0.3) {
      facts.push(diff > 0
        ? `😴 You feel better after 9+ hours of sleep (${sleptWell.average.toFixed(1)} vs ${sleptLess.average.toFixed(1)}).`
        : "😴 Interesting: sleep doesn't seem to change your energy much yet. Keep logging!");
    }
  }
  const worked = averageEnergy((key) => doneDays.has(key));
  const rested = averageEnergy((key) => !doneDays.has(key));
  if (worked && rested && Math.abs(worked.average - rested.average) >= 0.3) {
    facts.push(worked.average > rested.average
      ? `💪 You feel better on days you work out (${worked.average.toFixed(1)} vs ${rested.average.toFixed(1)}).`
      : `🛌 You feel a bit lower on workout days (${worked.average.toFixed(1)} vs ${rested.average.toFixed(1)}). Sleep and food help with that!`);
  }
  const hydrated = averageEnergy((key) => ((habits[key] || {}).water || 0) >= 6);
  const thirsty = averageEnergy((key) => ((habits[key] || {}).water || 0) < 6);
  if (hydrated && thirsty && hydrated.average - thirsty.average >= 0.3) {
    facts.push(`💧 You feel better on days you drink 6+ glasses of water (${hydrated.average.toFixed(1)} vs ${thirsty.average.toFixed(1)}).`);
  }
  return facts;
}

function renderEnergyStats() {
  const from = toKey(addDays(today, -29));
  const points = Object.entries(energyLog).filter(([key]) => key >= from).sort()
    .map(([date, value]) => ({ date, value }));
  lineChart(document.querySelector("#energy-chart"), document.querySelector("#energy-chart-table"), {
    points,
    min: 1,
    max: 5,
    ticks: [1, 2, 3, 4, 5],
    format: (v) => (Number.isInteger(v) ? `${ENERGY[v - 1].face} ${v}` : v.toFixed(1)),
    valueName: "Energy",
    label: "Line chart of how you felt each day for the last 30 days, from 1 (wiped out) to 5 (amazing)",
    empty: "No check-ins yet. Tap a face in Water & sleep on the Today tab!",
  });
  const facts = energyInsights();
  document.querySelector("#energy-insights").innerHTML = facts.length
    ? facts.map((f) => `<li>${f}</li>`).join("")
    : `<li>Check in for a week or two, and patterns will show up here, like whether sleep or workouts make you feel better.</li>`;
}


/* 2. CALENDAR HEAT MAP -----------------------------------------------------
   One square per day of this year. The brighter the square, the
   more you did: a rest day, a workout, or an expert workout.        */

function dayLevel(key) {
  if (!doneDays.has(key)) return 0;
  if (expertDays.has(key)) return 3;
  return isRestDay(fromKey(key)) ? 1 : 2;
}

const DAY_LEVELS = ["Nothing logged", "Rest day done", "Workout done", "Expert workout done"];

function renderHeatmap() {
  const year = today.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const start = mondayOf(jan1);
  const dec31 = new Date(year, 11, 31);
  const weeks = Math.ceil((daysBetween(start, dec31) + 1) / 7);
  const cell = 13;
  const gap = 3;
  const left = 30;
  const top = 18;
  const width = left + weeks * (cell + gap);
  const height = top + 7 * (cell + gap);

  let svg = "";
  // Day names on the left (Mon, Wed, Fri)
  ["Mon", "", "Wed", "", "Fri", "", ""].forEach((name, i) => {
    if (name) svg += `<text class="chart__tick" x="0" y="${top + i * (cell + gap) + 10}">${name}</text>`;
  });
  let lastMonth = -1;
  const counts = [0, 0, 0, 0];
  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < 7; d++) {
      const date = addDays(start, w * 7 + d);
      if (date.getFullYear() !== year) continue;
      // Month names along the top
      if (d === 0 || date.getDate() === 1) {
        if (date.getMonth() !== lastMonth && date.getDate() <= 7) {
          svg += `<text class="chart__tick" x="${left + w * (cell + gap)}" y="11">${MONTHS[date.getMonth()]}</text>`;
          lastMonth = date.getMonth();
        }
      }
      const key = toKey(date);
      const level = date > today ? -1 : dayLevel(key);
      if (level >= 0) counts[level] += 1;
      const missed = missedDays.has(key) && level === 0;
      svg += `<rect class="heat heat--${level < 0 ? "future" : level} ${missed ? "heat--missed" : ""} ${key === toKey(today) ? "heat--today" : ""}"
        x="${left + w * (cell + gap)}" y="${top + d * (cell + gap)}" width="${cell}" height="${cell}" rx="3" data-day="${key}"/>`;
    }
  }

  const box = document.querySelector("#heatmap");
  box.innerHTML = `<svg class="heatmap" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img"
    aria-label="Calendar of ${year}: ${counts[2] + counts[3]} workouts, ${counts[1]} rest days and ${counts[3]} expert workouts">${svg}</svg>`;
  document.querySelector("#heatmap-summary").textContent =
    `${year}: ${counts[2] + counts[3]} ${counts[2] + counts[3] === 1 ? "workout" : "workouts"} · ${counts[1]} rest ${counts[1] === 1 ? "day" : "days"} · ${counts[3]} expert · ${[...missedDays].filter((k) => k.startsWith(String(year))).length} missed`;

  // Start scrolled to today (on small screens the calendar scrolls sideways)
  const scroller = document.querySelector("#heatmap");
  const todayX = left + Math.floor(daysBetween(start, today) / 7) * (cell + gap);
  scroller.scrollLeft = Math.max(0, todayX - scroller.clientWidth + 60);
}

// Hover or tap a day to see what happened
function showHeatDay(event) {
  const rect = event.target.closest("[data-day]");
  if (!rect) return;
  const key = rect.dataset.day;
  const date = fromKey(key);
  let text = date > today ? "Still to come!" : DAY_LEVELS[dayLevel(key)];
  if (missedDays.has(key) && dayLevel(key) === 0) text = "Missed";
  document.querySelector("#heatmap-day").textContent = `${shortDate(date)}: ${text}`;
}
document.querySelector("#heatmap").addEventListener("pointerover", showHeatDay);
document.querySelector("#heatmap").addEventListener("pointerdown", showHeatDay);


/* 3. PERSONAL RECORDS --------------------------------------------------------- */

function renderRecords() {
  const stats = trophyStats();
  const quizBestRound = logOf("quiz").reduce((best, e) => (e.r > best ? e.r : best), 0);
  const kicksBest = Math.max(0, ...logOf("kicks").map((e) => e.n));
  const miniDeck = bestDeckTime("mini");
  const games = logOf("soccer");
  const mostGoals = Math.max(0, ...games.map((g) => g.g));
  const mostWater = Math.max(0, ...Object.values(habits).map((day) => day.water || 0));
  const skillsLearned = swimSkillsLearned().length;

  const records = [
    ["💪", "Most push-ups", stats.pushups || "–", "beat trainer"],
    ["🛡️", "Most curl-ups", stats.curlups || "–", "beat trainer"],
    ["🔥", "Longest streak", stats.bestStreak ? `${stats.bestStreak} ${stats.bestStreak === 1 ? "day" : "days"}` : "–", "in a row"],
    ["🏋️", "Workouts", stats.workouts, "all time"],
    ["🧠", "Best quiz round", quizBestRound ? `${quizBestRound}/10` : "–", "any subject"],
    ["🥋", "Most kicks", kicksBest || "–", "Kick Caller round"],
    ["🃏", "Fastest mini deck", miniDeck ? formatTime(miniDeck) : "–", "card deck"],
    ["⚽", "Most goals", mostGoals || "–", "in one game"],
    ["💧", "Most water", mostWater ? `${mostWater} glasses` : "–", "in one day"],
    ["🏊", "Swim skills", `${skillsLearned}/${allSwimSkills().length}`, "swim school"],
  ];
  document.querySelector("#records").innerHTML = records.map(([icon, name, value, note]) => `
    <div class="record">
      <span class="record__icon" aria-hidden="true">${icon}</span>
      <span class="record__value">${value}</span>
      <span class="record__name">${name}</span>
      <span class="record__note">${note}</span>
    </div>`).join("");
}


/* 4. YEAR IN REVIEW ------------------------------------------------------------ */

// Big numbers for the whole year so far
function yearNumbers() {
  const year = String(today.getFullYear());
  const stats = trophyStats();
  const done = [...doneDays].filter((k) => k.startsWith(year));
  let reps = 0;
  for (const key of done) reps += repsInWorkout(fromKey(key)); // boss.js
  for (const entry of activityLog) if (entry.d.startsWith(year)) reps += entry.reps || 0;
  const thisYear = (type) => logOf(type).filter((e) => e.d.startsWith(year));
  const favorite = Object.entries(drinkRatings).sort((a, b) => b[1].score - a[1].score)[0];
  const earned = BADGES.filter((badge) => badge.earned(stats)).length;
  return {
    year,
    workouts: done.filter((k) => !isRestDay(fromKey(k))).length,
    reps,
    level: levelFor(stats.xp),
    rank: rankFor(levelFor(stats.xp)),
    xp: stats.xp,
    streak: stats.bestStreak,
    badges: earned,
    quizRight: thisYear("quiz").reduce((sum, e) => sum + e.r, 0),
    bosses: bossHistory().filter((w) => w.beaten && w.to.startsWith(year)).length,
    missions: Object.entries(missionChecks).filter(([k]) => k.startsWith(year)).reduce((sum, [, ids]) => sum + ids.length, 0),
    goals: thisYear("soccer").reduce((sum, g) => sum + g.g, 0),
    lessons: thisYear("swimLesson").length,
    smoothies: recipeBook.smoothies.length,
    belts: beltData.history.filter((h) => h.d.startsWith(year)).length,
    favorite: favorite ? `${favorite[0]} (${favorite[1].score}/10)` : null,
  };
}

function openYearReview() {
  const n = yearNumbers();
  const cards = [
    ["🏋️", n.workouts, n.workouts === 1 ? "workout" : "workouts"],
    ["💥", n.reps.toLocaleString(), "reps (about!)"],
    ["⭐", `Level ${n.level}`, n.rank],
    ["🔥", n.streak, "best streak (days)"],
    ["🏅", n.badges, n.badges === 1 ? "badge" : "badges"],
    ["🧠", n.quizRight, "quiz answers right"],
    ["⚔️", n.bosses, n.bosses === 1 ? "boss beaten" : "bosses beaten"],
    ["🎯", n.missions, "daily missions"],
    ["⚽", n.goals, n.goals === 1 ? "goal" : "goals"],
    ["🏊", n.lessons, n.lessons === 1 ? "swim lesson" : "swim lessons"],
    ["🧪", n.smoothies, n.smoothies === 1 ? "smoothie invented" : "smoothies invented"],
    ["🥋", n.belts, n.belts === 1 ? "new belt" : "new belts"],
  ];
  document.querySelector("#review-title").textContent = `My ${n.year} so far`;
  document.querySelector("#review-cards").innerHTML = cards.map(([icon, value, name]) => `
    <li class="review-card"><span aria-hidden="true">${icon}</span><strong>${value}</strong><span>${name}</span></li>`).join("");
  document.querySelector("#review-favorite").textContent = n.favorite ? `🥤 Favorite drink: ${n.favorite}` : "";
  document.querySelector("#review-box").hidden = false;
  document.querySelector("#review-close").focus();
  sounds.fanfare();
}


/* 5. STATS CARD ------------------------------------------------------------------
   Drawn on a <canvas>, then turned into a picture (a PNG) you can
   save. On an iPad: press and hold the picture, then Save to Photos. */

// A box with round corners (older iPads can't draw round corners, so they get square ones)
function roundBox(c, x, y, w, h, r) {
  c.beginPath();
  if (c.roundRect) c.roundRect(x, y, w, h, r);
  else c.rect(x, y, w, h);
  c.fill();
}

async function makeStatsCard() {
  try {
    await document.fonts.ready; // wait for the page's fonts, so the card can use them
  } catch (error) {
    // Fonts aren't ready. The card uses backup fonts. That's fine.
  }
  const n = yearNumbers();
  const stats = trophyStats();
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const c = canvas.getContext("2d");
  const display = '"Bricolage Grotesque", "Segoe UI", sans-serif';
  const code = '"JetBrains Mono", Menlo, monospace';

  // Background, like the page
  const expert = document.documentElement.dataset.mode === "expert";
  c.fillStyle = expert ? "#160a0e" : "#0e1424";
  c.fillRect(0, 0, W, H);
  c.fillStyle = expert ? "#210f17" : "#141b2f";
  roundBox(c, 50, 50, W - 100, H - 100, 36);

  // Title: Level Up, with the yellow highlighter
  c.font = `800 92px ${display}`;
  c.fillStyle = "#e3e8f5";
  c.fillText("Level", 110, 200);
  const levelWidth = c.measureText("Level ").width;
  c.save();
  c.translate(110 + levelWidth, 200);
  c.rotate(-0.035);
  c.fillStyle = expert ? "#ff3b3b" : "#ffe24d";
  const upWidth = c.measureText("Up").width;
  c.fillRect(-10, -82, upWidth + 20, 102);
  c.fillStyle = expert ? "#160a0e" : "#0e1424";
  c.fillText("Up", 0, 0);
  c.restore();

  c.font = `400 34px ${code}`;
  c.fillStyle = "#8792b2";
  c.fillText(`// my stats · ${shortDate(today)}`, 110, 270);

  // Level and rank
  c.font = `800 220px ${display}`;
  c.fillStyle = expert ? "#ff9b9b" : "#7fdcc8";
  c.fillText(String(n.level), 104, 520);
  const bigWidth = c.measureText(String(n.level)).width;
  c.font = `700 40px ${code}`;
  c.fillStyle = "#8792b2";
  c.fillText("LEVEL", 120 + bigWidth, 360);
  c.font = `800 72px ${display}`;
  c.fillStyle = "#e3e8f5";
  c.fillText(n.rank, 120 + bigWidth, 450);
  c.font = `400 38px ${code}`;
  c.fillStyle = "#8792b2";
  c.fillText(`${n.xp.toLocaleString()} XP`, 124 + bigWidth, 510);

  // Six stat boxes
  const boxes = [
    [n.workouts, "workouts"], [stats.bestStreak, "best streak"], [n.badges, "badges"],
    [n.quizRight, "quiz answers right"], [n.bosses, "bosses beaten"], [n.reps.toLocaleString(), "reps"],
  ];
  boxes.forEach(([value, name], i) => {
    const x = 110 + (i % 2) * 440;
    const y = 590 + Math.floor(i / 2) * 190;
    c.fillStyle = expert ? "#160a0e" : "#0e1424";
    roundBox(c, x, y, 420, 165, 22);
    c.font = `800 76px ${display}`;
    c.fillStyle = "#e3e8f5";
    c.fillText(String(value), x + 34, y + 92);
    c.font = `400 30px ${code}`;
    c.fillStyle = "#8792b2";
    c.fillText(name, x + 36, y + 138);
  });

  // Up to 8 badges
  const earned = BADGES.filter((badge) => badge.earned(stats)).slice(0, 8);
  c.font = `64px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  earned.forEach((badge, i) => c.fillText(badge.icon, 112 + i * 108, 1220));
  if (earned.length === 0) {
    c.font = `400 32px ${code}`;
    c.fillStyle = "#8792b2";
    c.fillText("First badge coming soon!", 112, 1210);
  }

  const picture = document.querySelector("#card-picture");
  picture.src = canvas.toDataURL("image/png");
  document.querySelector("#card-download").href = picture.src;
  document.querySelector("#card-box").hidden = false;
  document.querySelector("#card-close").focus();
}


// Saving the picture. On claude.ai, pages can't download files by
// themselves, so the page asks Claude's "downloads" helper to offer the
// file (you get a box to say yes). On github.io, the link just works.
let cardDownloads = null;
if (window.claude && window.claude.use) {
  window.claude.use("downloads").then((downloads) => {
    cardDownloads = downloads;
  }).catch(() => {});
}

// "data:image/png;base64,..." -> the picture's bytes
function pictureBytes(dataUrl) {
  const text = atob(dataUrl.split(",")[1]);
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i);
  return bytes;
}

document.querySelector("#card-download").addEventListener("click", (event) => {
  if (!window.claude || !window.claude.use) return; // github.io: the normal download link
  event.preventDefault();
  if (!cardDownloads) {
    showToast("Press and hold the picture to save it.");
    return;
  }
  const data = pictureBytes(document.querySelector("#card-picture").src);
  cardDownloads.save({ filename: "level-up-stats.png", data }).then(() => {
    showToast("Saved! 🖼️");
  }).catch((error) => {
    if (error && error.code === "declined") return; // you said no, and that's fine
    showToast("Couldn't save it here. Press and hold the picture instead.");
  });
});


/* BUTTONS AND DRAWING -------------------------------------------------------------- */

document.querySelector("#open-review").addEventListener("click", openYearReview);
document.querySelector("#open-card").addEventListener("click", () => {
  makeStatsCard().catch(() => showToast("Couldn't make the picture on this device. Sorry!"));
});

for (const [boxId, closeId] of [["#review-box", "#review-close"], ["#card-box", "#card-close"]]) {
  const box = document.querySelector(boxId);
  document.querySelector(closeId).addEventListener("click", () => { box.hidden = true; });
  box.addEventListener("click", (event) => {
    if (event.target === box) box.hidden = true; // tapped outside the card
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !box.hidden) box.hidden = true;
  });
}

function renderStatsTab() {
  renderEnergyStats();
  renderHeatmap();
  renderRecords();
}
