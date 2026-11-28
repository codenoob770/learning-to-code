/* =============================================================
   everyday.js: fun for every day of the week
   -------------------------------------------------------------
   1. Fitness Bingo: a new 5×5 card every week (Quests tab)
   2. Chore Quest: chores earn coins for the shop (Quests tab)
   3. Streak Shield: keep your streak safe on a sick day (Quests tab)
   4. Reading Log: books, minutes and a reading rank (Quiz tab)
   5. Plugging in (XP, badges, saved data: see hooks.js)

   This file loads after shop.js (it adds a prize to the shop),
   and before app.js, so it only uses app.js's functions inside its
   own functions, never right away.
   ============================================================= */


/* 1. FITNESS BINGO -------------------------------------------------------
   Every Monday there's a new card. Some squares check themselves when
   you do them on the page (like "Score 8+ on a quiz"). Tap the others
   when you've done them. 5 in a row = BINGO! Fill the whole card for
   a special prize.

   The card is "random", but the same all week: it shuffles with a
   seed (a starting number) made from Monday's date. Same seed, same
   shuffle, every time.                                                */

const BINGO_LINE_XP = 25;
const BINGO_ALL_XP = 100;
const BINGO_ALL_COINS = 50;

// "auto" squares check themselves: they get this week's first and last day
const BINGO_SQUARES = [
  { id: "work3", icon: "🏋️", text: "Finish 3 daily workouts", auto: (a, b) => [...doneDays].filter((key) => key >= a && key <= b).length >= 3 },
  { id: "water", icon: "💧", text: "8 glasses of water in one day", auto: (a, b) => Object.entries(habits).some(([key, day]) => key >= a && key <= b && (day.water || 0) >= 8) },
  { id: "sleep", icon: "😴", text: "Sleep 9 hours or more", auto: (a, b) => Object.entries(habits).some(([key, day]) => key >= a && key <= b && (day.sleep || 0) >= 9) },
  { id: "quiz8", icon: "🧠", text: "Score 8+ on a quiz", auto: (a, b) => weekLog("quiz", a, b).some((e) => e.r >= 8) },
  { id: "duel", icon: "🤝", text: "Play a Sister Duel", auto: (a, b) => weekLog("duel", a, b).length > 0 },
  { id: "lesson", icon: "🎓", text: "Practice a Training lesson", auto: (a, b) => weekLog("drill", a, b).length > 0 },
  { id: "rainbow", icon: "🌈", text: "Have a Rainbow Day", auto: (a, b) => weekLog("rainbow", a, b).length > 0 },
  { id: "passport", icon: "🌍", text: "Stamp your Food Passport", auto: (a, b) => weekLog("passport", a, b).length > 0 },
  { id: "kihap", icon: "🗣️", text: "Kihap 60+ on the Kihap Meter", auto: (a, b) => weekLog("kihap", a, b).some((e) => e.s >= 60) },
  { id: "beat", icon: "🥁", text: "Finish a Beat Workout song", auto: (a, b) => weekLog("beat", a, b).length > 0 },
  { id: "course", icon: "🏁", text: "Run an obstacle course", auto: (a, b) => weekLog("course", a, b).length > 0 },
  { id: "speed", icon: "💨", text: "Time a sprint in the Speed Lab", auto: (a, b) => weekLog("speed", a, b).length > 0 },
  { id: "read", icon: "📚", text: "Read for 20 minutes", auto: (a, b) => weekLog("read", a, b).some((e) => e.min >= 20) },
  { id: "chores", icon: "🧹", text: "Do 3 chores", auto: (a, b) => Object.entries(choreData.done).filter(([key]) => key >= a && key <= b).reduce((sum, [, day]) => sum + Object.keys(day).length, 0) >= 3 },
  { id: "plate", icon: "🍽️", text: "Build a 3-star plate", auto: (a, b) => weekLog("plate", a, b).length > 0 },
  { id: "shootout", icon: "⚽", text: "Play Penalty Shootout", auto: (a, b) => weekLog("shootout", a, b).length > 0 },
  { id: "extra", icon: "➕", text: "Do an Extra workout", auto: (a, b) => weekLog("extra", a, b).length > 0 },
  { id: "kicks", icon: "🥋", text: "Practice kicks for 5 minutes" },
  { id: "juggle", icon: "⚽", text: "Juggle a soccer ball (count your best!)" },
  { id: "swim", icon: "🏊", text: "Swim school or pool time" },
  { id: "outside", icon: "🌳", text: "Play outside for 30 minutes" },
  { id: "bike", icon: "🚲", text: "Ride a bike or scooter" },
  { id: "stretch", icon: "🧘", text: "Stretch before bed" },
  { id: "dinner", icon: "🍳", text: "Help make dinner" },
  { id: "highfive", icon: "🙌", text: "High five 3 people" },
  { id: "dance", icon: "💃", text: "Dance to a whole song" },
  { id: "plank", icon: "🧱", text: "Hold a plank for 30 seconds" },
  { id: "teach", icon: "👨‍🏫", text: "Teach someone a move" },
  { id: "poomsae", icon: "🥋", text: "Practice your poomsae (form)" },
  { id: "walk", icon: "🚶", text: "Go for a walk with family" },
  { id: "tidy", icon: "🛏️", text: "Tidy your room" },
  { id: "thanks", icon: "✉️", text: "Write a thank-you note" },
  { id: "noscreens", icon: "📵", text: "No screens 1 hour before bed" },
  { id: "burpees", icon: "🔥", text: "Do 10 burpees" },
  { id: "dribble", icon: "⚽", text: "Dribble a ball for 5 minutes" },
  { id: "rope", icon: "🪢", text: "Jump rope 50 times" },
  { id: "newsport", icon: "🏓", text: "Try a sport you don't usually play" },
];

// The 12 lines: 5 rows, 5 columns and 2 diagonals (square numbers 0 to 24)
const BINGO_LINES = [
  ...[0, 1, 2, 3, 4].map((row) => [0, 1, 2, 3, 4].map((col) => row * 5 + col)),
  ...[0, 1, 2, 3, 4].map((col) => [0, 1, 2, 3, 4].map((row) => row * 5 + col)),
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20],
];
const BINGO_FREE = 12; // the middle square

let bingoData = { week: "", marked: [] }; // the squares you tapped this week (saved)

function weekLog(type, start, end) {
  return logOf(type).filter((entry) => entry.d >= start && entry.d <= end);
}

function bingoWeek() {
  const monday = mondayOf(today);
  return { start: toKey(monday), end: toKey(addDays(monday, 6)) };
}

// A random-looking number maker that always gives the same numbers for the same seed
function seededRandom(text) {
  let seed = 0;
  for (const letter of text) seed = (seed * 31 + letter.charCodeAt(0)) >>> 0;
  return () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle(list, random) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// This week's card: 10 squares that check themselves and 14 you tap, all mixed up
function bingoCard() {
  const { start } = bingoWeek();
  const random = seededRandom(`bingo-${start}`);
  const autos = seededShuffle(BINGO_SQUARES.filter((square) => square.auto), random).slice(0, 10);
  const taps = seededShuffle(BINGO_SQUARES.filter((square) => !square.auto), random).slice(0, 14);
  const squares = seededShuffle([...autos, ...taps], random);
  squares.splice(BINGO_FREE, 0, { id: "free", icon: "⭐", text: "FREE" });
  return squares;
}

function bingoMarks() {
  const { start, end } = bingoWeek();
  const marked = bingoData.week === start ? bingoData.marked : [];
  return bingoCard().map((square, i) => i === BINGO_FREE || (square.auto ? square.auto(start, end) : marked.includes(square.id)));
}

function bingoLinesDone(marks) {
  return BINGO_LINES.map((line, i) => (line.every((n) => marks[n]) ? i : -1)).filter((i) => i >= 0);
}

// Hands out XP for new lines (and the prize for a full card)
function bingoRewards() {
  const { start } = bingoWeek();
  const marks = bingoMarks();
  const lines = bingoLinesDone(marks);
  const logged = weekLog("bingo", start, "9999").map((entry) => entry.line);
  const fresh = lines.filter((line) => !logged.includes(line));
  fresh.forEach((line) => logActivity("bingo", { w: start, line }));
  let blackout = false;
  if (marks.every(Boolean) && !logOf("bingoAll").some((entry) => entry.w === start)) {
    logActivity("bingoAll", { w: start });
    if (!shopData.owned.includes("hat:bingo")) {
      shopData.owned = [...shopData.owned, "hat:bingo"];
      saveJSON("levelUp.shop", shopData);
    }
    blackout = true;
  }
  return { fresh: fresh.length, blackout };
}

function drawBingo() {
  const area = document.querySelector("#bingo-area");
  const { start, end } = bingoWeek();
  const card = bingoCard();
  const marks = bingoMarks();
  const lines = bingoLinesDone(marks);
  const inLine = new Set(lines.flatMap((i) => BINGO_LINES[i]));
  const squares = card.map((square, i) => {
    const on = marks[i];
    const label = square.id === "free" ? "Free square" : `${square.text}${square.auto ? " (checks itself)" : ""}${on ? ", done" : ""}`;
    return `<button class="bingo-square ${on ? "is-on" : ""} ${inLine.has(i) ? "is-line" : ""} ${square.auto ? "is-auto" : ""}" type="button"
      data-bingo="${square.id}" aria-pressed="${on}" aria-label="${label}" ${square.auto || square.id === "free" ? "aria-disabled=\"true\"" : ""}>
      <span class="bingo-square__icon" aria-hidden="true">${on ? "✓" : square.icon}</span>
      <span class="bingo-square__text">${square.text}</span>
      ${square.auto && !on ? `<span class="bingo-square__auto" aria-hidden="true">auto</span>` : ""}
    </button>`;
  }).join("");
  const done = marks.filter(Boolean).length;
  const last = fromKey(end).toLocaleDateString("en-US", { weekday: "long" });
  area.innerHTML = `
    <div class="bingo-letters" aria-hidden="true"><span>B</span><span>I</span><span>N</span><span>G</span><span>O</span></div>
    <div class="bingo-card" role="group" aria-label="This week's bingo card">${squares}</div>
    <p class="bingo-status">${marks.every(Boolean)
      ? "🌟 BLACKOUT! You filled the whole card! 🌟"
      : `${plural(lines.length, "bingo")} · ${done} of 25 squares · New card on Monday (this one lasts until ${last})`}</p>
    <p class="game-help">Squares marked <span class="bingo-auto-key">auto</span> check themselves when you do them on Level Up. Tap the others when you've done them for real!</p>`;
  area.dataset.week = start;
}

document.querySelector("#bingo-area").addEventListener("click", (event) => {
  const square = event.target.closest("[data-bingo]");
  if (!square || square.getAttribute("aria-disabled") === "true") return;
  const { start } = bingoWeek();
  const id = square.dataset.bingo;
  const marked = bingoData.week === start ? [...bingoData.marked] : [];
  const index = marked.indexOf(id);
  if (index >= 0) marked.splice(index, 1);
  else marked.push(id);
  bingoData = { week: start, marked };
  saveJSON("levelUp.bingo", bingoData);
  startAudio();
  const reward = bingoRewards();
  if (reward.blackout) {
    sounds.fanfare();
    confetti();
    showToast(`🌟 BLACKOUT! +${BINGO_ALL_XP} XP, ${BINGO_ALL_COINS} coins and the Bingo Star hat for your pet!`);
  } else if (reward.fresh) {
    sounds.fanfare();
    confetti();
    showToast(`🎉 BINGO! +${BINGO_LINE_XP * reward.fresh} XP`);
  } else {
    index >= 0 ? sounds.down() : sounds.count();
  }
  render();
  checkAchievements(true);
  document.querySelector(`[data-bingo="${id}"]`)?.focus();
});


/* 2. CHORE QUEST --------------------------------------------------------------
   Check off a chore when it's done, and earn coins for the shop. A
   grown-up can change the chores and how many coins each one is worth. */

const CHORE_STARTERS = [
  { id: "bed", icon: "🛏️", name: "Make your bed", coins: 3 },
  { id: "table", icon: "🍽️", name: "Set or clear the table", coins: 3 },
  { id: "laundry", icon: "👕", name: "Put away your laundry", coins: 4 },
  { id: "room", icon: "🧸", name: "Clean up your room", coins: 4 },
  { id: "dishes", icon: "🧽", name: "Help with the dishes", coins: 4 },
  { id: "trash", icon: "🗑️", name: "Take out the trash", coins: 3 },
  { id: "pack", icon: "🎒", name: "Pack your bag for tomorrow", coins: 2 },
];
const CHORE_ICONS = ["🧹", "🧺", "🐶", "🐱", "🪴", "🚗", "🍂", "❄️", "🧼", "📦", "🛒", "🧽"];
const CHORE_MAX_COINS = 10;

let choreData = { list: CHORE_STARTERS, done: {} }; // done: { "2026-11-28": { bed: 3 } } (saved)

function choreCoins() {
  return Object.values(choreData.done).reduce((sum, day) => sum + Object.values(day).reduce((a, b) => a + b, 0), 0);
}

function choresDone() {
  return Object.values(choreData.done).reduce((sum, day) => sum + Object.keys(day).length, 0);
}

function saveChores() {
  saveJSON("levelUp.chores", choreData);
}

function drawChores() {
  const area = document.querySelector("#chores-area");
  const key = toKey(today);
  const todayDone = choreData.done[key] || {};
  const earnedToday = Object.values(todayDone).reduce((a, b) => a + b, 0);
  const list = choreData.list.map((chore) => {
    const on = chore.id in todayDone;
    return `<li><button class="chore ${on ? "is-on" : ""}" type="button" data-chore="${chore.id}" aria-pressed="${on}">
      <span class="chore__check" aria-hidden="true">${on ? "✓" : ""}</span>
      <span class="chore__icon" aria-hidden="true">${chore.icon}</span>
      <span class="chore__name">${escapeHTML(chore.name)}</span>
      <span class="chore__coins">+${chore.coins} 🪙</span>
    </button></li>`;
  }).join("");
  const edit = choreData.list.map((chore) => `
    <li class="chore-edit">
      <span aria-hidden="true">${chore.icon}</span>
      <span class="chore-edit__name">${escapeHTML(chore.name)}</span>
      <span class="stepper stepper--small">
        <button type="button" data-chore-coins="${chore.id}" data-step="-1" aria-label="One less coin for ${escapeHTML(chore.name)}">−</button>
        <span>${chore.coins} 🪙</span>
        <button type="button" data-chore-coins="${chore.id}" data-step="1" aria-label="One more coin for ${escapeHTML(chore.name)}">+</button>
      </span>
      <button class="text-button" type="button" data-chore-remove="${chore.id}">Remove</button>
    </li>`).join("");
  area.innerHTML = `
    <div class="tiles tiles--three">
      <div class="tile"><span class="tile__value">${earnedToday}</span><span class="tile__name">coins today</span></div>
      <div class="tile"><span class="tile__value">${choreCoins()}</span><span class="tile__name">chore coins</span></div>
      <div class="tile"><span class="tile__value">${choresDone()}</span><span class="tile__name">chores done</span></div>
    </div>
    <ul class="chore-list">${list || `<li class="empty-note">No chores yet. A grown-up can add some below.</li>`}</ul>
    <details class="extra chore-grownups">
      <summary>👨‍👩‍👧 Grown-ups: change the chores</summary>
      <ul class="chore-edit-list">${edit}</ul>
      <form class="form-row form-row--tight" id="chore-form">
        <label class="visually-hidden" for="chore-name">New chore</label>
        <input class="input" id="chore-name" type="text" maxlength="40" placeholder="Like &quot;Walk the dog&quot;" autocomplete="off">
        <button class="button" type="submit">+ Add</button>
      </form>
    </details>`;
}

const choresArea = document.querySelector("#chores-area");

choresArea.addEventListener("click", (event) => {
  const chore = event.target.closest("[data-chore]");
  if (chore) {
    const key = toKey(today);
    const item = choreData.list.find((c) => c.id === chore.dataset.chore);
    const day = { ...(choreData.done[key] || {}) };
    startAudio();
    if (item.id in day) {
      delete day[item.id];
      sounds.down();
    } else {
      day[item.id] = item.coins;
      sounds.rate(10);
      showToast(`${item.icon} ${item.name}: +${item.coins} coins!`);
    }
    choreData = { ...choreData, done: { ...choreData.done, [key]: day } };
    saveChores();
    render();
    checkAchievements(true);
    document.querySelector(`[data-chore="${item.id}"]`)?.focus();
    return;
  }
  const coins = event.target.closest("[data-chore-coins]");
  if (coins) {
    const list = choreData.list.map((c) => (c.id === coins.dataset.choreCoins
      ? { ...c, coins: Math.max(1, Math.min(CHORE_MAX_COINS, c.coins + Number(coins.dataset.step))) }
      : c));
    choreData = { ...choreData, list };
    saveChores();
    drawChores();
    choresArea.querySelector(".chore-grownups").open = true;
    return;
  }
  const remove = event.target.closest("[data-chore-remove]");
  if (remove) {
    choreData = { ...choreData, list: choreData.list.filter((c) => c.id !== remove.dataset.choreRemove) };
    saveChores();
    drawChores();
    choresArea.querySelector(".chore-grownups").open = true;
  }
});

choresArea.addEventListener("submit", (event) => {
  if (event.target.id !== "chore-form") return;
  event.preventDefault();
  const name = document.querySelector("#chore-name").value.trim();
  if (!name) return;
  const icon = CHORE_ICONS[choreData.list.length % CHORE_ICONS.length];
  choreData = { ...choreData, list: [...choreData.list, { id: `c${Date.now().toString(36)}`, icon, name, coins: 3 }] };
  saveChores();
  drawChores();
  choresArea.querySelector(".chore-grownups").open = true;
  document.querySelector("#chore-name").focus();
});


/* 3. STREAK SHIELD -----------------------------------------------------------
   Buy a shield with coins. If you miss a day (like when you're sick),
   use a shield on it, and your streak keeps going! It only works on
   yesterday, and you can hold 3 shields at a time.

   app.js (the streak on the scoreboard) and trophies.js (streak XP)
   ask isShielded() about each day.                                   */

const SHIELD_PRICE = 40;
const SHIELD_MAX = 3;

let shieldData = { have: 0, used: [] }; // used: the days you shielded (saved)

function isShielded(key) {
  return shieldData.used.includes(key);
}

// Your streak right now, counting shielded days as "kept going" (they don't add a day)
function streakNow() {
  let day = doneDays.has(toKey(today)) ? today : addDays(today, -1);
  let streak = 0;
  while (doneDays.has(toKey(day)) || isShielded(toKey(day))) {
    if (doneDays.has(toKey(day))) streak += 1;
    day = addDays(day, -1);
  }
  return streak;
}

// Can you shield yesterday? Only if you missed it, and there's a streak to save
function shieldableDay() {
  const yesterday = toKey(addDays(today, -1));
  const before = toKey(addDays(today, -2));
  if (doneDays.has(yesterday) || isShielded(yesterday)) return null;
  if (!doneDays.has(before) && !isShielded(before)) return null;
  return yesterday;
}

function drawShield() {
  const area = document.querySelector("#shield-area");
  const day = shieldableDay();
  // The streak you'd keep: from the day before yesterday, back
  let saveable = 0;
  if (day) {
    let back = addDays(today, -2);
    while (doneDays.has(toKey(back)) || isShielded(toKey(back))) {
      if (doneDays.has(toKey(back))) saveable += 1;
      back = addDays(back, -1);
    }
  }
  const shields = "🛡️".repeat(shieldData.have) + `<span class="shield-empty">${"🛡️".repeat(SHIELD_MAX - shieldData.have)}</span>`;
  let action = "";
  if (day && shieldData.have > 0) {
    action = `<div class="shield-alert">
      <p>😮 You missed yesterday! Use a shield to save your <strong>${saveable}-day</strong> streak?</p>
      <button class="button" type="button" data-shield="use">🛡️ Use a shield</button>
    </div>`;
  } else if (day) {
    action = `<p class="shield-alert">😮 You missed yesterday. ${coins() >= SHIELD_PRICE ? "Buy a shield and use it to save your streak!" : `A shield costs ${SHIELD_PRICE} coins.`}</p>`;
  }
  area.innerHTML = `
    <div class="shield-row">
      <p class="shield-streak">🔥 <strong>${plural(streakNow(), "day")}</strong> <span>streak</span></p>
      <p class="shield-have" aria-label="${shieldData.have} of ${SHIELD_MAX} shields">${shields}</p>
    </div>
    ${action}
    <div class="brain-start__buttons">
      <button class="button button--quiet" type="button" data-shield="buy" ${shieldData.have >= SHIELD_MAX || coins() < SHIELD_PRICE ? "disabled" : ""}>Buy a shield (${SHIELD_PRICE} 🪙)</button>
      <span class="quiz-total">You have ${coins()} coins</span>
    </div>
    <p class="game-help">A shield only works on yesterday, so use it the next day. Shielded days keep your streak alive but don't add to it.${shieldData.used.length ? ` Shields used: ${shieldData.used.length}.` : ""}</p>`;
}

document.querySelector("#shield-area").addEventListener("click", (event) => {
  const button = event.target.closest("[data-shield]");
  if (!button || button.disabled) return;
  startAudio();
  if (button.dataset.shield === "buy" && shieldData.have < SHIELD_MAX && coins() >= SHIELD_PRICE) {
    shopData.spent = (shopData.spent || 0) + SHIELD_PRICE;
    saveJSON("levelUp.shop", shopData);
    shieldData = { ...shieldData, have: shieldData.have + 1 };
    saveJSON("levelUp.shields", shieldData);
    sounds.done();
    showToast(`🛡️ You got a Streak Shield! (${shieldData.have} of ${SHIELD_MAX})`);
  }
  if (button.dataset.shield === "use") {
    const day = shieldableDay();
    if (day && shieldData.have > 0) {
      shieldData = { have: shieldData.have - 1, used: [...shieldData.used, day] };
      saveJSON("levelUp.shields", shieldData);
      sounds.fanfare();
      showToast(`🛡️ Shield up! Your streak is safe: ${plural(streakNow(), "day")} and counting.`);
    }
  }
  render();
  checkAchievements(true);
});


/* 4. READING LOG ---------------------------------------------------------------
   Add your books, log how long you read, and climb the reading ranks. */

const READ_MINUTES = [10, 15, 20, 30, 45, 60];
const READ_RANKS = [
  { from: 0, icon: "📄", name: "Page Turner" },
  { from: 120, icon: "🐛", name: "Bookworm" },
  { from: 400, icon: "🧭", name: "Story Explorer" },
  { from: 1000, icon: "🏛️", name: "Library Legend" },
  { from: 2500, icon: "🧙", name: "Word Wizard" },
];
const BOOK_DONE_XP = 50;

let books = []; // [{ id, title, pages, done }] (saved)
let readBook = null; // the book picked in the form
let readMinutes = 20;

function readTotal() {
  return logOf("read").reduce((sum, entry) => sum + (entry.min || 0), 0);
}

function readRank(minutes) {
  return [...READ_RANKS].reverse().find((rank) => minutes >= rank.from);
}

function bookPages(id) {
  return logOf("read").filter((entry) => entry.b === id).reduce((sum, entry) => sum + (entry.p || 0), 0);
}

function drawReading() {
  const area = document.querySelector("#read-area");
  const total = readTotal();
  const rank = readRank(total);
  const next = READ_RANKS.find((item) => item.from > total);
  const reading = books.filter((book) => !book.done);
  const finished = books.filter((book) => book.done);
  if (!reading.some((book) => book.id === readBook)) readBook = reading[0] ? reading[0].id : null;
  const recent = logOf("read").slice(-4).reverse().map((entry) => {
    const book = books.find((item) => item.id === entry.b);
    return `<li>${chartDate(entry.d)} · ${entry.min} min${entry.p ? ` · ${entry.p} pages` : ""}${book ? ` · <em>${escapeHTML(book.title)}</em>` : ""}</li>`;
  }).join("");
  area.innerHTML = `
    <div class="read-rank">
      <span class="read-rank__icon" aria-hidden="true">${rank.icon}</span>
      <div>
        <p class="read-rank__name">${rank.name}</p>
        <p class="quiz-total">${total} minutes read${next ? ` · ${next.from - total} more to ${next.icon} ${next.name}` : " · the top rank!"}</p>
      </div>
    </div>
    ${next ? `<div class="xpbar" aria-hidden="true"><div class="xpbar__fill" style="width: ${Math.round(((total - rank.from) / (next.from - rank.from)) * 100)}%"></div></div>` : ""}
    <div class="read-columns">
      <div>
        <p class="field-label">📖 Reading now</p>
        <div class="read-books">${reading.map((book) => `
          <div class="read-book ${book.id === readBook ? "is-picked" : ""}">
            <button class="read-book__pick" type="button" data-read-book="${book.id}" aria-pressed="${book.id === readBook}">
              <strong>${escapeHTML(book.title)}</strong>
              <span>${book.pages ? `${Math.min(bookPages(book.id), book.pages)} of ${book.pages} pages` : `${bookPages(book.id)} pages read`}</span>
            </button>
            <button class="text-button" type="button" data-read-finish="${book.id}">✓ Finished it!</button>
          </div>`).join("") || `<p class="empty-note">Add the book you're reading!</p>`}
        </div>
        <form class="form-row form-row--tight read-add" id="read-add">
          <label class="visually-hidden" for="read-title">Book title</label>
          <input class="input" id="read-title" type="text" maxlength="60" placeholder="Book title" autocomplete="off">
          <label class="visually-hidden" for="read-pages">Pages in the book (optional)</label>
          <input class="input read-pages" id="read-pages" type="number" min="1" max="3000" inputmode="numeric" placeholder="Pages">
          <button class="button button--quiet" type="submit">+ Add book</button>
        </form>
      </div>
      <div>
        <p class="field-label">⏱️ I just read for...</p>
        <div class="lab-chips" role="group" aria-label="Minutes">${READ_MINUTES.map((m) => `<button class="lab-chip" type="button" data-read-min="${m}" aria-pressed="${m === readMinutes}">${m} min</button>`).join("")}</div>
        <div class="form-row form-row--tight read-log">
          <label class="field-label" for="read-p">Pages (optional)</label>
          <input class="input read-pages" id="read-p" type="number" min="0" max="500" inputmode="numeric" placeholder="0">
          <button class="button" type="button" data-read="log">📚 Log it</button>
        </div>
        ${recent ? `<p class="field-label">Lately</p><ul class="read-recent">${recent}</ul>` : ""}
      </div>
    </div>
    ${finished.length ? `<details class="extra"><summary>🏆 Books I finished (${finished.length})</summary><ul>${finished.map((book) => `<li><span>${escapeHTML(book.title)}</span><span>${chartDate(book.done)}</span></li>`).join("")}</ul></details>` : ""}`;
}

const readArea = document.querySelector("#read-area");

readArea.addEventListener("click", (event) => {
  const pick = event.target.closest("[data-read-book]");
  if (pick) {
    readBook = pick.dataset.readBook;
    drawReading();
    return;
  }
  const minutes = event.target.closest("[data-read-min]");
  if (minutes) {
    readMinutes = Number(minutes.dataset.readMin);
    drawReading();
    document.querySelector(`[data-read-min="${readMinutes}"]`)?.focus();
    return;
  }
  const finish = event.target.closest("[data-read-finish]");
  if (finish) {
    const book = books.find((item) => item.id === finish.dataset.readFinish);
    books = books.map((item) => (item.id === book.id ? { ...item, done: toKey(today) } : item));
    saveJSON("levelUp.books", books);
    logActivity("bookDone", { b: book.id });
    startAudio();
    sounds.fanfare();
    confetti();
    showToast(`🏆 You finished "${book.title}"! +${BOOK_DONE_XP} XP`);
    render();
    checkAchievements(true);
    return;
  }
  if (event.target.closest("[data-read='log']")) {
    const pages = Math.max(0, Math.min(500, Math.round(Number(document.querySelector("#read-p").value) || 0)));
    const before = readRank(readTotal());
    logActivity("read", { b: readBook, min: readMinutes, p: pages });
    const after = readRank(readTotal());
    startAudio();
    if (after !== before) {
      sounds.fanfare();
      showToast(`${after.icon} New reading rank: ${after.name}!`);
    } else {
      sounds.done();
      showToast(`📚 ${readMinutes} minutes of reading logged!`);
    }
    render();
    checkAchievements(true);
  }
});

readArea.addEventListener("submit", (event) => {
  if (event.target.id !== "read-add") return;
  event.preventDefault();
  const title = document.querySelector("#read-title").value.trim();
  if (!title) return;
  const pages = Math.round(Number(document.querySelector("#read-pages").value) || 0);
  const book = { id: `b${Date.now().toString(36)}`, title, pages: pages > 0 ? Math.min(pages, 3000) : 0, done: null };
  books = [...books, book];
  readBook = book.id;
  saveJSON("levelUp.books", books);
  drawReading();
  document.querySelector("#read-title").focus();
});


/* 5. PLUGGING IN (see hooks.js) -------------------------------------------------- */

// The Bingo Star hat is a prize for filling a whole bingo card
SHOP.push({ group: "hat", id: "bingo", name: "Bingo Star", icon: "🌟", price: 0, secret: true });

addPagePart("quests", () => {
  drawBingo();
  drawChores();
  drawShield();
});
addPagePart("quiz", () => {
  // Don't redraw while you're typing in the form
  if (!readArea.contains(document.activeElement) || document.activeElement.tagName === "BUTTON") drawReading();
});

// Squares that check themselves can finish a line from anywhere on the page
addPagePart(null, () => {
  const reward = bingoRewards();
  if (!reward.fresh && !reward.blackout) return;
  // A moment later, so it doesn't cover up the toast for what you just did
  setTimeout(() => {
    showToast(reward.blackout ? `🌟 BINGO BLACKOUT! You filled your whole card! +${BINGO_ALL_XP} XP` : `🎉 BINGO on your Fitness Bingo card! +${BINGO_LINE_XP * reward.fresh} XP`);
    sounds.fanfare();
  }, 1800);
});

addSavedData("levelUp.bingo", () => {
  const saved = loadJSON("levelUp.bingo", null);
  bingoData = saved && typeof saved.week === "string" && Array.isArray(saved.marked) ? saved : { week: "", marked: [] };
});
addSavedData("levelUp.chores", () => {
  const saved = loadJSON("levelUp.chores", null);
  choreData = saved && Array.isArray(saved.list) && saved.done && typeof saved.done === "object"
    ? saved
    : { list: CHORE_STARTERS, done: {} };
});
addSavedData("levelUp.shields", () => {
  const saved = loadJSON("levelUp.shields", null);
  shieldData = saved && Array.isArray(saved.used) ? { have: Math.max(0, Math.min(SHIELD_MAX, Number(saved.have) || 0)), used: saved.used } : { have: 0, used: [] };
});
addSavedData("levelUp.books", () => {
  const saved = loadJSON("levelUp.books", []);
  books = Array.isArray(saved) ? saved.filter((book) => book && book.id && book.title) : [];
});

addCoins(choreCoins);
addCoins(() => logOf("bingoAll").length * BINGO_ALL_COINS);

addXP("bingo", () => BINGO_LINE_XP);
addXP("bingoAll", () => BINGO_ALL_XP);
addXP("read", (e) => Math.min(30, Math.round((e.min || 0) / 2)), 3);
addXP("bookDone", () => BOOK_DONE_XP);

addXPRule("Fitness Bingo line", `+${BINGO_LINE_XP}`);
addXPRule("Fill a whole Bingo card", `+${BINGO_ALL_XP} and ${BINGO_ALL_COINS} coins`);
addXPRule("Reading", "+1 per 2 minutes");
addXPRule("Finish a book", `+${BOOK_DONE_XP}`);

addBadge({ id: "bingo", icon: "🎱", name: "BINGO!", how: "Get 5 in a row on Fitness Bingo", earned: () => logOf("bingo").length >= 1 });
addBadge({ id: "blackout", icon: "🌟", name: "Blackout", how: "Fill a whole Fitness Bingo card", earned: () => logOf("bingoAll").length >= 1 });
addBadge({ id: "helpingHand", icon: "🧹", name: "Helping Hand", how: "Do 25 chores", earned: () => choresDone() >= 25 });
addBadge({ id: "shieldUp", icon: "🛡️", name: "Shield Up", how: "Save your streak with a Streak Shield", earned: () => shieldData.used.length >= 1 });
addBadge({ id: "bookworm", icon: "🐛", name: "Bookworm", how: "Read for 120 minutes", earned: () => readTotal() >= 120 });
addBadge({ id: "theEnd", icon: "📕", name: "The End", how: "Finish a book", earned: () => books.some((book) => book.done) });
