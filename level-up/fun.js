/* =============================================================
   fun.js: stickers, your avatar, seasonal events and secrets
   -------------------------------------------------------------
   1. Sticker Album: 40 stickers to collect on 5 pages
   2. My Avatar: a character that's you, shown at the top
   3. Seasonal events (like the Winter Games in December)
   4. Secret Easter eggs 🤫

   This file loads before app.js, so it only uses app.js's
   functions inside its own functions, never right away.
   ============================================================= */


/* 1. STICKER ALBUM -------------------------------------------------------
   Each sticker has a little test: "got" gets your trophy stats (s)
   and says if you've earned it.                                    */

const STICKER_PAGES = [
  {
    name: "Sports", icon: "🏅", stickers: [
      { id: "soccer1", icon: "⚽", name: "First Game", how: "Log a soccer game", got: () => logOf("soccer").length >= 1 },
      { id: "goal1", icon: "🥅", name: "GOAL!", how: "Score a goal in a soccer game", got: () => logOf("soccer").some((e) => e.g >= 1) },
      { id: "belt1", icon: "🥋", name: "New Belt", how: "Earn a new taekwondo belt", got: (s) => s.belts >= 1 },
      { id: "swim1", icon: "🏊", name: "Swim Student", how: "Log a swim lesson", got: (s) => s.swimLessons >= 1 },
      { id: "skill1", icon: "🦋", name: "Skill Unlocked", how: "Learn a swim skill", got: () => (swimData.skills || []).length >= 1 },
      { id: "lesson1", icon: "🎓", name: "Lesson Learned", how: "Learn a Training lesson", got: (s) => s.lessons >= 1 },
      { id: "shoot3", icon: "🎯", name: "Sharp Shooter", how: "Score 3 goals in Penalty Shootout", got: () => logOf("shootout").some((e) => e.g >= 3) },
      { id: "boards3", icon: "🪵", name: "Crack!", how: "Break 3 boards in Board Break", got: () => logOf("boards").some((e) => e.lvl >= 3) },
    ],
  },
  {
    name: "Brain", icon: "🧠", stickers: [
      { id: "quiz1", icon: "🧠", name: "Quiz Whiz", how: "Play a quiz round", got: () => logOf("quiz").length >= 1 },
      { id: "quiz10", icon: "💯", name: "Perfect!", how: "Get 10 out of 10 in the quiz", got: (s) => s.quizPerfect >= 1 },
      { id: "bee1", icon: "🐝", name: "Busy Bee", how: "Finish a Spelling Bee", got: () => logOf("bee").length >= 1 },
      { id: "math15", icon: "✖️", name: "Number Ninja", how: "15 right in the Times-Table Sprint", got: () => logOf("math").some((e) => e.r >= 15) },
      { id: "korean5", icon: "🇰🇷", name: "Annyeong!", how: "Know 5 Korean words", got: () => koreanKnown.size >= 5 },
      { id: "myq1", icon: "✏️", name: "Question Writer", how: "Write your own quiz question", got: () => logOf("myq").length >= 1 },
      { id: "focus1", icon: "📚", name: "Homework Hero", how: "Finish a homework focus round", got: () => logOf("focus").length >= 1 },
      { id: "duel1", icon: "🤝", name: "Duelist", how: "Play a Sister Duel", got: () => logOf("duel").length >= 1 },
    ],
  },
  {
    name: "Fitness", icon: "💪", stickers: [
      { id: "first", icon: "👟", name: "First Step", how: "Finish your first workout", got: (s) => s.workouts >= 1 },
      { id: "streak3", icon: "🔥", name: "On Fire", how: "A 3-day streak", got: (s) => s.bestStreak >= 3 },
      { id: "streak7", icon: "⚡", name: "Lightning", how: "A 7-day streak", got: (s) => s.bestStreak >= 7 },
      { id: "expert", icon: "🌶️", name: "Spicy", how: "Finish a workout in expert mode", got: (s) => s.expertCount >= 1 },
      { id: "boss", icon: "👹", name: "Boss Slayer", how: "Beat a weekly boss", got: (s) => s.bossesBeaten >= 1 },
      { id: "fit", icon: "📋", name: "Tested", how: "Do a Monthly Fitness Test", got: () => logOf("fitTest").length >= 1 },
      { id: "goal", icon: "🎯", name: "Goal Getter", how: "Reach one of your goals", got: () => logOf("goalDone").length >= 1 },
      { id: "warm", icon: "🏟️", name: "Warmed Up", how: "Do a Game Day Warm-Up", got: () => logOf("gameDay").length >= 1 },
    ],
  },
  {
    name: "Healthy Habits", icon: "🍎", stickers: [
      { id: "drink", icon: "🥤", name: "Taste Test", how: "Rate a drink", got: (s) => s.ratings >= 1 },
      { id: "smoothie", icon: "🧪", name: "Mad Scientist", how: "Invent a smoothie", got: (s) => s.smoothies >= 1 },
      { id: "chef", icon: "👨‍🍳", name: "Chef", how: "Make a recipe", got: (s) => s.recipesMade >= 1 },
      { id: "snack", icon: "🥕", name: "Snack Smart", how: "Play Snack Swap", got: () => logOf("snack").length >= 1 },
      { id: "water", icon: "💧", name: "Hydrated", how: "Drink 8 glasses of water in a day", got: (s) => s.waterDays >= 1 },
      { id: "sleep", icon: "😴", name: "Well Rested", how: "Sleep 9+ hours", got: (s) => s.sleepDays >= 1 },
      { id: "energy", icon: "🔋", name: "Charged Up", how: "Do an energy check-in", got: (s) => s.checkIns >= 1 },
      { id: "extra", icon: "➕", name: "Above and Beyond", how: "Finish an extra workout", got: (s) => s.extras >= 1 },
    ],
  },
  {
    name: "Fun & Games", icon: "🎉", stickers: [
      { id: "deck", icon: "🃏", name: "Card Shark", how: "Finish a Card Deck Workout", got: () => logOf("deck").length >= 1 },
      { id: "spin", icon: "🎡", name: "Spinner", how: "Spin the wheel", got: (s) => s.spins >= 1 },
      { id: "kicks", icon: "📣", name: "Kick Caller", how: "Finish a Kick Caller round", got: () => logOf("kicks").length >= 1 },
      { id: "box", icon: "🎁", name: "Surprise!", how: "Open a Mystery Box", got: () => logOf("box").length >= 1 },
      { id: "memory", icon: "🧩", name: "Good Memory", how: "Finish Memory Match", got: () => logOf("memory").length >= 1 },
      { id: "hatch", icon: "🐣", name: "Hatched", how: "Hatch your pet", got: (s) => s.petStage >= 1 },
      { id: "room", icon: "🛋️", name: "Home Sweet Home", how: "Put something in your pet's room", got: () => roomPlaced().length >= 1 },
      { id: "egg", icon: "🥚", name: "Secret Finder", how: "Find a secret Easter egg", got: () => eggsFound.length >= 1 },
    ],
  },
];
const ALL_STICKERS = STICKER_PAGES.flatMap((page) => page.stickers);

let stickerPage = 0;

function stickersGot() {
  const stats = trophyStats();
  return new Set(ALL_STICKERS.filter((sticker) => sticker.got(stats)).map((sticker) => sticker.id));
}

function drawStickers() {
  const area = document.querySelector("#sticker-area");
  const got = stickersGot();
  const seen = new Set(loadJSON("levelUp.stickersSeen", []));
  const page = STICKER_PAGES[stickerPage];
  const pageGot = page.stickers.filter((sticker) => got.has(sticker.id)).length;

  const tabs = STICKER_PAGES.map((item, i) => {
    const done = item.stickers.every((sticker) => got.has(sticker.id));
    return `<button class="lab-chip" type="button" data-sticker-page="${i}" aria-pressed="${i === stickerPage}">${item.icon} ${item.name}${done ? " ⭐" : ""}</button>`;
  }).join("");
  const slots = page.stickers.map((sticker) => (got.has(sticker.id) ? `
    <li class="sticker is-got ${seen.has(sticker.id) ? "" : "is-new"}">
      <span class="sticker__art" aria-hidden="true">${sticker.icon}</span>
      <span class="sticker__name">${sticker.name}</span>
      ${seen.has(sticker.id) ? "" : `<span class="sticker__new">NEW!</span>`}
    </li>` : `
    <li class="sticker">
      <span class="sticker__art sticker__art--empty" aria-hidden="true">?</span>
      <span class="sticker__how">${sticker.how}</span>
    </li>`)).join("");

  area.innerHTML = `
    <p class="sticker-count"><strong>${got.size}</strong> of ${ALL_STICKERS.length} stickers</p>
    <div class="xpbar" aria-hidden="true"><div class="xpbar__fill" style="width: ${(got.size / ALL_STICKERS.length) * 100}%"></div></div>
    <div class="lab-chips sticker-tabs" role="group" aria-label="Album pages">${tabs}</div>
    <div class="sticker-page">
      <p class="sticker-page__title">${page.icon} ${page.name} · ${pageGot}/${page.stickers.length}${pageGot === page.stickers.length ? " · ⭐ Page complete!" : ""}</p>
      <ul class="stickers">${slots}</ul>
    </div>`;

  // Everything you've got now counts as seen next time (the NEW! shows once)
  const all = [...got];
  if (all.some((id) => !seen.has(id))) save("levelUp.stickersSeen", JSON.stringify(all));
}

document.querySelector("#sticker-area").addEventListener("click", (event) => {
  const tab = event.target.closest("[data-sticker-page]");
  if (!tab) return;
  stickerPage = Number(tab.dataset.stickerPage);
  drawStickers();
  document.querySelector(`[data-sticker-page="${stickerPage}"]`).focus();
});


/* 2. MY AVATAR ------------------------------------------------------------
   Pick your outfit, hair and face. The dobok's belt is always the
   belt you have right now (from the Sports tab)!                   */

const AVATAR_CHOICES = {
  outfit: [["dobok", "🥋 Dobok"], ["jersey", "⚽ Jersey"], ["swim", "🏊 Swim"]],
  skin: ["#f9d7b5", "#eec29b", "#d7a274", "#a8714a", "#6e4426"],
  hair: [["short", "Short"], ["spiky", "Spiky"], ["curly", "Curly"], ["long", "Long"], ["buzz", "Buzz cut"]],
  hairColor: ["#2b1d14", "#5a3825", "#a86b3c", "#e3c16f", "#c4522c", "#111111"],
  face: [["smile", "🙂 Smile"], ["grin", "😁 Grin"], ["wink", "😉 Wink"], ["cool", "😎 Cool"]],
  extra: [["none", "Nothing"], ["headband", "Headband"], ["glasses", "Glasses"]],
  color: ["#e2443b", "#3f7fe0", "#3aa655", "#f39a2b", "#8a5cc9", "#151515"],
};
const AVATAR_START = { outfit: "dobok", skin: "#eec29b", hair: "short", hairColor: "#2b1d14", face: "smile", extra: "none", color: "#3f7fe0", number: 10 };

let avatarData = { ...AVATAR_START }; // saved
let avatarCount = 0; // so every avatar on the page gets its own clip id

function avatarSVG(look = avatarData, label = "My avatar") {
  avatarCount += 1;
  const clip = `avatar-clip-${avatarCount}`;
  const skin = look.skin;
  const hairColor = look.hairColor;
  const belt = (BELTS[beltData.belt] || BELTS[0]).colors;

  let body = "";
  if (look.outfit === "dobok") {
    body = `
      <path d="M12 104 C14 80 30 71 50 71 C70 71 86 80 88 104 Z" fill="#f4f4f4"/>
      <path d="M40 72 L50 88 L60 72" stroke="#c9c9c9" stroke-width="3" fill="none"/>
      <path d="M50 88 L58 100" stroke="#c9c9c9" stroke-width="3"/>
      <rect x="10" y="93" width="80" height="8" fill="${belt[0]}"/>
      ${belt[1] ? `<rect x="10" y="96" width="80" height="2" fill="${belt[1]}"/>` : ""}`;
  } else if (look.outfit === "jersey") {
    body = `
      <path d="M12 104 C14 80 30 71 50 71 C70 71 86 80 88 104 Z" fill="${look.color}"/>
      <path d="M42 71 L50 80 L58 71" stroke="#fff" stroke-width="3" fill="none"/>
      <text x="50" y="98" text-anchor="middle" class="avatar__number">${Number(look.number) || 0}</text>`;
  } else {
    body = `
      <path d="M12 104 C14 80 30 71 50 71 C70 71 86 80 88 104 Z" fill="${skin}"/>
      <path d="M30 76 C40 84 60 84 70 76 L74 90 C60 98 40 98 26 90 Z" fill="#6fb7ff"/>`;
  }

  const hairs = {
    short: `<path d="M31 41 C30 22 42 16 50 16 C60 16 71 22 69 41 C66 30 58 27 50 27 C42 27 34 30 31 41 Z" fill="${hairColor}"/>`,
    spiky: `<path d="M31 39 L32 24 L38 29 L40 15 L46 25 L50 12 L54 25 L60 15 L62 29 L68 24 L69 39 C64 30 57 28 50 28 C43 28 36 30 31 39 Z" fill="${hairColor}"/>`,
    curly: `<g fill="${hairColor}">${[[34, 32], [38, 23], [45, 18], [53, 17], [60, 20], [66, 27], [68, 35], [32, 40], [50, 23]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7"/>`).join("")}</g>`,
    long: `<path d="M30 46 C27 20 42 15 50 15 C60 15 73 20 70 46 L72 66 C67 62 67 52 67 41 C62 31 38 31 33 41 C33 52 33 62 28 66 Z" fill="${hairColor}"/>`,
    buzz: `<path d="M32 37 C33 23 43 19 50 19 C58 19 67 23 68 37 C62 31 38 31 32 37 Z" fill="${hairColor}" opacity="0.85"/>`,
  };
  const hair = look.outfit === "swim"
    ? `<path d="M30 41 C29 20 42 14 50 14 C59 14 71 20 70 41 C62 34 38 34 30 41 Z" fill="${look.color}"/>
       <circle cx="42" cy="31" r="5" fill="#9fe3ff" stroke="#1c2233" stroke-width="2"/><circle cx="58" cy="31" r="5" fill="#9fe3ff" stroke="#1c2233" stroke-width="2"/>
       <path d="M47 31 H53" stroke="#1c2233" stroke-width="2"/>`
    : hairs[look.hair] || hairs.short;

  const eye = (x) => `<circle cx="${x}" cy="44" r="2.6" fill="#1c2233"/>`;
  const faces = {
    smile: `${eye(43)}${eye(57)}<path d="M43 53 Q50 59 57 53" stroke="#1c2233" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
    grin: `${eye(43)}${eye(57)}<path d="M42 51 Q50 62 58 51 Z" fill="#fff" stroke="#1c2233" stroke-width="2" stroke-linejoin="round"/>`,
    wink: `<path d="M40 44 Q43 41 46 44" stroke="#1c2233" stroke-width="2.2" fill="none" stroke-linecap="round"/>${eye(57)}<path d="M43 53 Q50 59 57 53" stroke="#1c2233" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
    cool: `<rect x="36" y="39" width="12" height="8" rx="3" fill="#111"/><rect x="52" y="39" width="12" height="8" rx="3" fill="#111"/><path d="M48 42 H52" stroke="#111" stroke-width="2"/><path d="M44 54 Q51 57 57 52" stroke="#1c2233" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
  };
  const extras = {
    none: "",
    headband: `<path d="M31 33 Q50 27 69 33 L69 38 Q50 32 31 38 Z" fill="#e2443b"/><path d="M68 35 L78 31 L76 38 Z" fill="#e2443b"/>`,
    glasses: look.face === "cool" ? "" : `<circle cx="43" cy="44" r="6" fill="none" stroke="#1c2233" stroke-width="1.8"/><circle cx="57" cy="44" r="6" fill="none" stroke="#1c2233" stroke-width="1.8"/><path d="M49 44 H51" stroke="#1c2233" stroke-width="1.8"/>`,
  };

  return `
    <svg class="avatar" viewBox="0 0 100 100" role="img" aria-label="${label}">
      <defs><clipPath id="${clip}"><circle cx="50" cy="50" r="50"/></clipPath></defs>
      <g clip-path="url(#${clip})">
        <rect width="100" height="100" class="avatar__bg"/>
        ${body}
        <rect x="44" y="58" width="12" height="15" fill="${skin}"/>
        <rect x="44" y="58" width="12" height="6" fill="#000" opacity="0.12"/>
        <circle cx="31" cy="45" r="4.5" fill="${skin}"/><circle cx="69" cy="45" r="4.5" fill="${skin}"/>
        <ellipse cx="50" cy="43" rx="19" ry="21" fill="${skin}"/>
        <ellipse cx="38" cy="50" rx="3.5" ry="2" fill="#ff8fa3" opacity="0.45"/><ellipse cx="62" cy="50" rx="3.5" ry="2" fill="#ff8fa3" opacity="0.45"/>
        ${faces[look.face] || faces.smile}
        ${hair}
        ${look.outfit === "swim" ? "" : extras[look.extra] || ""}
      </g>
    </svg>`;
}

function saveAvatar() {
  saveJSON("levelUp.avatar", avatarData);
}

function drawAvatarSpots() {
  document.querySelector("#hud-avatar").innerHTML = avatarSVG(avatarData, "");
  const player = document.querySelector("#player-avatar");
  if (player) player.innerHTML = avatarSVG(avatarData, "My avatar");
}

function drawAvatarMaker() {
  const area = document.querySelector("#avatar-area");
  const group = (key, title, options, swatch) => `
    <div class="avatar-group">
      <p class="field-label">${title}</p>
      <div class="lab-chips" role="group" aria-label="${title}">
        ${options.map((option) => {
          const value = Array.isArray(option) ? option[0] : option;
          const name = Array.isArray(option) ? option[1] : option;
          return swatch
            ? `<button class="avatar-swatch" type="button" data-avatar="${key}:${value}" aria-pressed="${avatarData[key] === value}" aria-label="${title} ${value}" style="background: ${value}"></button>`
            : `<button class="lab-chip" type="button" data-avatar="${key}:${value}" aria-pressed="${avatarData[key] === value}">${name}</button>`;
        }).join("")}
      </div>
    </div>`;
  if (area.contains(document.activeElement) && document.activeElement.matches("input")) return;
  area.innerHTML = `
    <div class="avatar-maker">
      <div class="avatar-preview">${avatarSVG(avatarData, "Your avatar")}</div>
      <div class="avatar-options">
        ${group("outfit", "Outfit", AVATAR_CHOICES.outfit)}
        ${avatarData.outfit === "dobok" ? `<p class="avatar-note">🥋 Your belt is your real belt: ${beltName(beltData.belt)}!</p>` : ""}
        ${avatarData.outfit !== "dobok" ? group("color", avatarData.outfit === "swim" ? "Swim cap color" : "Jersey color", AVATAR_CHOICES.color, true) : ""}
        ${avatarData.outfit === "jersey" ? `
          <div class="avatar-group">
            <label class="field-label" for="avatar-number">Jersey number</label>
            <input class="input input--number" id="avatar-number" type="number" min="0" max="99" value="${Number(avatarData.number) || 0}">
          </div>` : ""}
        ${group("skin", "Skin", AVATAR_CHOICES.skin, true)}
        ${avatarData.outfit === "swim" ? "" : group("hair", "Hair", AVATAR_CHOICES.hair)}
        ${avatarData.outfit === "swim" ? "" : group("hairColor", "Hair color", AVATAR_CHOICES.hairColor, true)}
        ${group("face", "Face", AVATAR_CHOICES.face)}
        ${avatarData.outfit === "swim" ? "" : group("extra", "Extra", AVATAR_CHOICES.extra)}
      </div>
    </div>`;
}

document.querySelector("#avatar-area").addEventListener("click", (event) => {
  const choice = event.target.closest("[data-avatar]");
  if (!choice) return;
  const [key, ...rest] = choice.dataset.avatar.split(":");
  avatarData[key] = rest.join(":");
  saveAvatar();
  sounds.count();
  drawAvatarMaker();
  drawAvatarSpots();
  document.querySelector(`[data-avatar="${choice.dataset.avatar}"]`)?.focus();
});

document.querySelector("#avatar-area").addEventListener("change", (event) => {
  if (event.target.id !== "avatar-number") return;
  avatarData.number = Math.max(0, Math.min(99, parseInt(event.target.value, 10) || 0));
  saveAvatar();
  event.target.blur();
  drawAvatarMaker();
  drawAvatarSpots();
});


/* 3. SEASONAL EVENTS -----------------------------------------------------------
   Four times a year, a month-long event with its own challenges, a
   badge and something falling down the page. "count" gets the first
   and last day of the event (like "2026-12-01" and "2026-12-31").  */

function workoutsBetween(start, end) {
  return [...doneDays].filter((key) => key >= start && key <= end && !isRestDay(fromKey(key))).length;
}

function logBetween(types, start, end) {
  return activityLog.filter((entry) => types.includes(entry.t) && entry.d >= start && entry.d <= end).length;
}

function waterDaysBetween(start, end) {
  return Object.entries(habits).filter(([key, day]) => key >= start && key <= end && (day.water || 0) >= 8).length;
}

const SEASONS = [
  {
    id: "spring", month: 4, name: "Spring Training", icon: "🌱", falling: "🌸",
    lead: "New season, new skills! Train hard this April.",
    challenges: [
      { text: "Finish 12 workouts", goal: 12, count: (a, b) => workoutsBetween(a, b) },
      { text: "Practice 3 Training lessons with the coach", goal: 3, count: (a, b) => logBetween(["drill"], a, b) },
      { text: "Do your Monthly Fitness Test", goal: 1, count: (a, b) => logBetween(["fitTest"], a, b) },
      { text: "Play 5 brain games (quiz, spelling, sprint or Korean)", goal: 5, count: (a, b) => logBetween(["quiz", "bee", "math", "korean"], a, b) },
      { text: "Do 2 Game Day Warm-Ups or log 2 games", goal: 2, count: (a, b) => logBetween(["gameDay", "soccer"], a, b) },
    ],
  },
  {
    id: "summer", month: 7, name: "Summer Splash", icon: "☀️", falling: "🫧",
    lead: "Hot days, cool workouts. Don't forget your water!",
    challenges: [
      { text: "Finish 12 workouts", goal: 12, count: (a, b) => workoutsBetween(a, b) },
      { text: "Drink 8 glasses of water on 10 days", goal: 10, count: (a, b) => waterDaysBetween(a, b) },
      { text: "Log 2 swim lessons", goal: 2, count: (a, b) => logBetween(["swimLesson"], a, b) },
      { text: "Invent or make 3 smoothies or recipes", goal: 3, count: (a, b) => logBetween(["smoothie", "made"], a, b) },
      { text: "Do 3 extra workouts", goal: 3, count: (a, b) => logBetween(["extra"], a, b) },
    ],
  },
  {
    id: "spooky", month: 10, name: "Spooky Sprint", icon: "🎃", falling: "🍂",
    lead: "Scare away the bugs with some spooky-strong workouts!",
    challenges: [
      { text: "Finish 12 workouts", goal: 12, count: (a, b) => workoutsBetween(a, b) },
      { text: "Play 3 Penalty Shootouts", goal: 3, count: (a, b) => logBetween(["shootout"], a, b) },
      { text: "Open 5 Mystery Boxes", goal: 5, count: (a, b) => logBetween(["box"], a, b) },
      { text: "Play 5 Spelling Bee or Times-Table rounds", goal: 5, count: (a, b) => logBetween(["bee", "math"], a, b) },
      { text: "Play 2 Sister Duels", goal: 2, count: (a, b) => logBetween(["duel"], a, b) },
    ],
  },
  {
    id: "winter", month: 12, name: "Winter Games", icon: "❄️", falling: "❄️",
    lead: "Stay strong all through December, even on cold days!",
    challenges: [
      { text: "Finish 10 workouts", goal: 10, count: (a, b) => workoutsBetween(a, b) },
      { text: "Play 5 brain games (quiz, spelling, sprint or Korean)", goal: 5, count: (a, b) => logBetween(["quiz", "bee", "math", "korean"], a, b) },
      { text: "Do 3 extra workouts", goal: 3, count: (a, b) => logBetween(["extra"], a, b) },
      { text: "Drink 8 glasses of water on 5 days", goal: 5, count: (a, b) => waterDaysBetween(a, b) },
      { text: "Practice 2 lessons or do 2 Game Day Warm-Ups", goal: 2, count: (a, b) => logBetween(["drill", "gameDay"], a, b) },
      { text: "Open 7 Mystery Boxes", goal: 7, count: (a, b) => logBetween(["box"], a, b) },
      { text: "Challenge your family to a Sister Duel", goal: 1, count: (a, b) => logBetween(["duel"], a, b) },
    ],
  },
];
const EVENT_XP = 300;

// The first and last day of a month, as keys
function monthRange(year, month) {
  return [toKey(new Date(year, month - 1, 1)), toKey(new Date(year, month, 0))];
}

function activeEvent() {
  return SEASONS.find((season) => season.month === today.getMonth() + 1) || null;
}

// The next event that starts within a week (for the "coming soon" banner)
function comingEvent() {
  for (const season of SEASONS) {
    const year = today.getFullYear() + (season.month - 1 < today.getMonth() ? 1 : 0);
    const start = new Date(year, season.month - 1, 1);
    const days = Math.round((start - today) / 86400000);
    if (days > 0 && days <= 7) return { season, days };
  }
  return null;
}

function eventProgress(season) {
  const [start, end] = monthRange(today.getFullYear(), season.month);
  return season.challenges.map((challenge) => ({ ...challenge, now: Math.min(challenge.goal, challenge.count(start, end)) }));
}

function drawEvent() {
  const panel = document.querySelector("#event-panel");
  const season = activeEvent();
  const coming = comingEvent();
  drawSeasonFx(season);

  if (!season && !coming) {
    panel.hidden = true;
    return;
  }
  panel.hidden = false;
  if (!season) {
    panel.innerHTML = `
      <p class="event-teaser"><span aria-hidden="true">${coming.season.icon}</span> <strong>The ${coming.season.name} start in ${plural(coming.days, "day")}!</strong> Special challenges, a ${coming.season.icon} page and a new badge. Get ready!</p>`;
    return;
  }

  const progress = eventProgress(season);
  const done = progress.filter((challenge) => challenge.now >= challenge.goal).length;
  const won = logOf("event").some((entry) => entry.e === season.id && entry.y === today.getFullYear());
  const [, end] = monthRange(today.getFullYear(), season.month);
  const left = Math.round((fromKey(end) - today) / 86400000);
  const fxOn = load("levelUp.eventFx", "on") === "on";

  // All done? Celebrate (once a year)!
  if (done === progress.length && !won) {
    logActivity("event", { e: season.id, y: today.getFullYear() });
    setTimeout(() => {
      showToast(`${season.icon} YOU WON THE ${season.name.toUpperCase()}! +${EVENT_XP} XP`);
      sounds.fanfare();
      confetti();
      render();
      checkAchievements(true);
    }, 0);
  }

  panel.innerHTML = `
    <div class="panel__head">
      <p class="eyebrow">// special event · ${left === 0 ? "last day!" : `${plural(left, "day")} left`}</p>
      <button class="lab-chip" type="button" data-event-fx aria-pressed="${fxOn}">${season.falling} ${fxOn ? "On" : "Off"}</button>
    </div>
    <h2 class="panel__title">${season.icon} ${season.name}</h2>
    <p class="panel__lead">${season.lead} Finish every challenge for <strong>+${EVENT_XP} XP</strong> and a special badge!</p>
    <ul class="event-challenges">${progress.map((challenge) => `
      <li class="event-challenge ${challenge.now >= challenge.goal ? "is-done" : ""}">
        <span class="event-challenge__check" aria-hidden="true">${challenge.now >= challenge.goal ? "✅" : "⬜"}</span>
        <span class="event-challenge__text">${challenge.text}</span>
        <span class="event-challenge__count">${challenge.now}/${challenge.goal}</span>
        <span class="xpbar event-challenge__bar" aria-hidden="true"><span class="xpbar__fill" style="width: ${(challenge.now / challenge.goal) * 100}%"></span></span>
      </li>`).join("")}
    </ul>
    <p class="event-total">${won || done === progress.length ? `🏆 You won the ${season.name}! Amazing!` : `${done} of ${progress.length} challenges done`}</p>`;
}

// Snowflakes (or leaves, or petals...) falling behind the page
function drawSeasonFx(season) {
  const layer = document.querySelector("#season-fx");
  const want = season && load("levelUp.eventFx", "on") === "on" && !noMotion() ? season.falling : "";
  if (layer.dataset.falling === want) return;
  layer.dataset.falling = want;
  if (!want) {
    layer.innerHTML = "";
    return;
  }
  layer.innerHTML = Array.from({ length: 18 }, (_, i) => {
    const left = (i * 37 + 11) % 100;
    const size = 0.8 + ((i * 7) % 10) / 10;
    const time = 9 + ((i * 13) % 9);
    return `<span style="left: ${left}%; font-size: ${size}rem; animation-duration: ${time}s; animation-delay: -${(i * 1.7) % time}s">${want}</span>`;
  }).join("");
}

document.querySelector("#event-panel").addEventListener("click", (event) => {
  if (!event.target.closest("[data-event-fx]")) return;
  save("levelUp.eventFx", load("levelUp.eventFx", "on") === "on" ? "off" : "on"); // just this device
  drawEvent();
  document.querySelector("[data-event-fx]")?.focus();
});


/* 4. SECRET EASTER EGGS 🤫 -------------------------------------------------------
   Hidden around the site. Each one unlocks a secret item for the
   shop (they're the "secret: true" items in shop.js). Yes, the
   codes are right here in the code. Coders get to peek! 😉         */

const EGGS = [
  { id: "logo", name: "Logo Tapper", hint: "Our logo at the top is ticklish... tap it a bunch, super fast.", prize: "theme:rainbow" },
  { id: "kihap", name: "Spirit Yell", hint: "What do you yell when you strike in taekwondo? It's a secret code!", code: ["KIHAP"], prize: "hat:ninja" },
  { id: "console", name: "Console Coder", hint: "Coders have a secret window called the console. Something's waiting there (on a computer).", code: ["BUGSQUASHER"], prize: "theme:hacker" },
  { id: "source", name: "Source Reader", hint: "Every web page has hidden notes in its HTML. Read the source of this page!", code: ["VIEWSOURCE"], prize: "petColor:#39ff9f" },
  { id: "konami", name: "Retro Gamer", hint: "A famous video game cheat: ↑ ↑ ↓ ↓ ← → ← → B A (on a keyboard, or type UUDDLRLRBA as a code)", code: ["UUDDLRLRBA"], prize: "figure:pink" },
  { id: "tickle", name: "Pet Tickler", hint: "Your pet is SUPER ticklish.", prize: "hat:propeller" },
];
const EGG_XP = 50;

let eggsFound = []; // saved

function eggPrize(egg) {
  const [group, ...rest] = egg.prize.split(":");
  return SHOP.find((item) => item.group === group && item.id === rest.join(":"));
}

function findEgg(id) {
  const egg = EGGS.find((item) => item.id === id);
  if (!egg) return;
  const prize = eggPrize(egg);
  if (eggsFound.includes(id)) {
    showToast(`🥚 You already found "${egg.name}"!`);
    return;
  }
  eggsFound = [...eggsFound, id];
  saveJSON("levelUp.eggs", eggsFound);
  if (!shopData.owned.includes(egg.prize)) {
    shopData.owned = [...shopData.owned, egg.prize];
    saveJSON("levelUp.shop", shopData);
  }
  logActivity("egg", { e: id });
  startAudio();
  sounds.fanfare();
  confetti();
  showToast(`🥚 SECRET FOUND: ${egg.name}! You unlocked ${prize.icon || "✨"} ${prize.name} (in the shop). +${EGG_XP} XP`);
  render();
  checkAchievements(true);
}

function drawSecrets() {
  const area = document.querySelector("#secret-list");
  area.innerHTML = `
    <p class="secret-count">🥚 Secrets found: <strong>${eggsFound.length}</strong> of ${EGGS.length}</p>
    <ul class="secrets">${EGGS.map((egg) => {
      const found = eggsFound.includes(egg.id);
      const prize = eggPrize(egg);
      return `
        <li class="secret ${found ? "is-found" : ""}">
          <span class="secret__icon" aria-hidden="true">${found ? "🐣" : "🥚"}</span>
          <span><strong>${found ? egg.name : "???"}</strong><br><span class="secret__hint">${found ? `Unlocked: ${prize.icon || "🎨"} ${prize.name}` : egg.hint}</span></span>
        </li>`;
    }).join("")}</ul>`;
}

document.querySelector("#secret-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.querySelector("#secret-code");
  const code = input.value.trim().toUpperCase().replace(/[^A-Z]/g, "");
  const note = document.querySelector("#secret-note");
  if (!code) return;
  const egg = EGGS.find((item) => (item.code || []).includes(code));
  input.value = "";
  if (!egg) {
    note.textContent = "Hmm, that's not a secret code. Keep looking! 🔍";
    sounds.down();
    return;
  }
  note.textContent = "";
  findEgg(egg.id);
});

// Egg: tap the logo 7 times in 3 seconds
let logoTaps = [];
document.querySelector(".hud__title").addEventListener("click", () => {
  const now = Date.now();
  logoTaps = [...logoTaps.filter((time) => now - time < 3000), now];
  if (logoTaps.length >= 7) {
    logoTaps = [];
    findEgg("logo");
  }
});

// Egg: tickle your pet (10 taps in 4 seconds, counted in pet-plus.js)
document.querySelector("#pet-picture").addEventListener("click", () => {
  if (petTaps.length >= 10 && petStage() >= 1) {
    petTaps = [];
    findEgg("tickle");
  }
});

// Egg: the famous cheat code, on a keyboard
const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
let konamiAt = 0;
document.addEventListener("keydown", (event) => {
  if (event.target.closest && event.target.closest("input, textarea, select")) return;
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  konamiAt = key === KONAMI[konamiAt] ? konamiAt + 1 : key === KONAMI[0] ? 1 : 0;
  if (konamiAt === KONAMI.length) {
    konamiAt = 0;
    findEgg("konami");
  }
});

// Egg: a message for coders who open the console 👋
console.log(
  "%c👋 Hey, coder!%c\nYou found the console. Nice!\nSecret code: BUGSQUASHER\nType it in the Secret Code box on the Pet & Shop tab.",
  "font-size: 18px; font-weight: bold; color: #ffe24d;",
  "font-size: 13px; color: #7fdcc8;",
);


/* PLUGGING IN (see hooks.js) ------------------------------------------------------- */

addPagePart(null, drawAvatarSpots);
addPagePart("today", drawEvent);
addPagePart("pet", () => {
  drawAvatarMaker();
  drawSecrets();
});
addPagePart("stats", drawStickers);

addSavedData("levelUp.avatar", () => {
  const saved = loadJSON("levelUp.avatar", {});
  avatarData = { ...AVATAR_START, ...(saved && typeof saved === "object" ? saved : {}) };
});
addSavedData("levelUp.eggs", () => {
  const saved = loadJSON("levelUp.eggs", []);
  eggsFound = Array.isArray(saved) ? saved.filter((id) => EGGS.some((egg) => egg.id === id)) : [];
});

addXP("event", () => EVENT_XP, 1);
addXP("egg", () => EGG_XP);

addXPRule("Win a seasonal event", `+${EVENT_XP}`);
addXPRule("Find a secret Easter egg", `+${EGG_XP}`);

addBadge({ id: "stickerPage", icon: "📒", name: "Sticker Collector", how: "Fill a whole page of your Sticker Album", earned: () => {
  const got = stickersGot();
  return STICKER_PAGES.some((page) => page.stickers.every((sticker) => got.has(sticker.id)));
} });
addBadge({ id: "stickerAll", icon: "📚", name: "Complete Album", how: `Collect all ${ALL_STICKERS.length} stickers`, earned: () => stickersGot().size === ALL_STICKERS.length });
addBadge({ id: "eggHunter", icon: "🥚", name: "Egg Hunter", how: "Find 3 secret Easter eggs", earned: () => eggsFound.length >= 3 });
addBadge({ id: "detective", icon: "🕵️", name: "Master Detective", how: "Find every secret Easter egg", earned: () => eggsFound.length >= EGGS.length });
SEASONS.forEach((season) => {
  addBadge({ id: `event-${season.id}`, icon: season.icon, name: `${season.name} Champion`, how: `Win the ${season.name} (every ${monthName(`2000-${String(season.month).padStart(2, "0")}`).split(" ")[0]})`, earned: () => logOf("event").some((entry) => entry.e === season.id) });
});
