/* =============================================================
   bridge.js: brings Level Up's newest features to Kickoff
   -------------------------------------------------------------
   Kickoff started as a copy of my Level Up page. Since then,
   Level Up got lots of new stuff: a quiz, training lessons, games,
   a pet and more. Instead of copying all that code here (and then
   fixing every bug twice!), Kickoff loads those files straight
   from the level-up folder. Look for "../level-up/" in index.html.

   Those files expect a few things that only Level Up's app.js has.
   This file adds them for Kickoff:
   1. Saved data the new features share (like the activity log)
   2. Helpers from Level Up's app.js
   3. XP and stats from the new features (trophies.js asks for them)
   4. Tabs along the top
   5. Drawing the new tabs whenever the page redraws

   Kickoff saves its own progress with "kickoff." names (see storeKey
   in app.js), so it never mixes with Level Up's.

   This file loads before app.js, so it only uses app.js's
   functions inside its own functions, never right away.
   ============================================================= */


/* 1. SAVED DATA THE NEW FEATURES SHARE ------------------------------------ */

let activityLog = [];          // everything you did: quiz rounds, games, lessons...
let petData = { name: "" };    // your pet's name (pet.js)
let shopData = { spent: 0, owned: [], wear: {} }; // coins spent and things you own (shop.js)
let trainingLearned = new Set(); // the Training lessons you've learned (training.js)

// Kickoff doesn't have Level Up's taekwondo belt tracker or swim school,
// but a few features ask about them, so here are empty stand-ins.
const BELTS = [{ name: "White", colors: ["#f4f4f4"] }];
let beltData = { belt: 0, test: "", checks: [], custom: [], history: [] };
let swimData = { skills: [] };
function beltName() {
  return "No belt yet";
}

// app.js calls this at the end of loadProgress()
function loadBridgeProgress() {
  activityLog = loadJSON("levelUp.log", []);
  petData = loadJSON("levelUp.pet", { name: "" });
  shopData = loadJSON("levelUp.shop", { spent: 0, owned: [], wear: {} });
  trainingLearned = new Set(loadJSON("levelUp.training", []));
  LOADERS.forEach((load) => load()); // features that plug in with addSavedData (hooks.js)
}

// Kickoff's soccer moves, for Level Up's stick figures (demos.js)
Object.assign(DEMO_FOR, {
  cutAndGo: "lateralShuffle", stepOvers: "stepOver", soleRolls: "toeTaps",
  wallPasses: "pass", juggling: "juggle", softLandings: "jumpSquat",
});

// Things that start a little differently for Kickoff
trainingSport = "soccer";      // the Training tab opens on soccer (training.js)
AVATAR_START.outfit = "jersey"; // a soccer jersey, not a dobok (fun.js)


/* 2. HELPERS FROM LEVEL UP'S app.js ------------------------------------------- */

function logActivity(type, details = {}) {
  const entry = { d: toKey(today), t: type, ...details };
  activityLog.push(entry);
  save("levelUp.log", JSON.stringify(activityLog));
  return entry;
}

function logOf(type) {
  return activityLog.filter((entry) => entry.t === type);
}

function escapeHTML(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function saveJSON(key, value) {
  save(key, JSON.stringify(value));
}


/* 3. XP AND STATS ---------------------------------------------------------------
   trophies.js adds these to your XP and stats. Most of the new
   features bring their own XP rules (addXP in hooks.js); these are
   the ones Level Up keeps in its own trophies.js.                  */

for (const [rule, xp] of Object.entries({ quizRight: 10, quizPerfect: 25, penaltyDone: 5, drill: 10, lessonLearned: 20 })) {
  if (!(rule in XP_RULES)) XP_RULES[rule] = xp;
}

const BRIDGE_XP = {
  quiz: { xp: (e) => e.r * XP_RULES.quizRight + (e.r === e.n && e.n >= 10 ? XP_RULES.quizPerfect : 0) + (e.p || 0) * XP_RULES.penaltyDone, perDay: 5 },
  drill: { xp: () => XP_RULES.drill, perDay: 3 },
};

function bridgeStats() {
  let xp = trainingLearned.size * XP_RULES.lessonLearned;
  const counts = {};
  for (const entry of activityLog) {
    const rule = BRIDGE_XP[entry.t] || MORE_XP[entry.t];
    if (!rule) continue;
    const dayAndType = `${entry.d} ${entry.t}`;
    counts[dayAndType] = (counts[dayAndType] || 0) + 1;
    if (counts[dayAndType] > (rule.perDay ?? Infinity)) continue; // only a few count each day
    xp += rule.xp(entry);
  }
  const quizzes = logOf("quiz");
  return {
    xp,
    // Facts that badges and stickers look at
    petStage: petStage(),
    bought: shopData.owned.filter((key) => !SHOP.some((item) => (item.mystery || item.secret) && `${item.group}:${item.id}` === key)).length,
    spent: shopData.spent || 0,
    lessons: trainingLearned.size,
    quizRight: quizzes.reduce((sum, entry) => sum + entry.r, 0),
    quizPerfect: quizzes.filter((entry) => entry.n >= 10 && entry.r === entry.n).length,
  };
}


/* 4. TABS ------------------------------------------------------------------------
   Like Level Up's tabs (they use the same names, so the features
   know which tab is showing).                                      */

const TAB_NAMES = ["today", "quiz", "arcade", "training", "pet"];
let currentTab = "today";

function showTab(name, scrollUp = true) {
  if (!TAB_NAMES.includes(name)) name = "today";
  currentTab = name;
  document.querySelectorAll("[data-page]").forEach((page) => {
    page.hidden = page.dataset.page !== name;
  });
  document.querySelectorAll(".tab[data-tab]").forEach((tab) => {
    if (tab.dataset.tab === name) tab.setAttribute("aria-current", "page");
    else tab.removeAttribute("aria-current");
  });
  if (scrollUp) window.scrollTo(0, 0);
  try {
    history.replaceState(null, "", name === "today" ? location.pathname + location.search : `#${name}`);
  } catch (error) {
    // Some pages (like previews) don't allow this. That's fine.
  }
  renderBridge();
  if (name === "today") renderCharts(); // charts measure their box, so draw them once it shows
}

document.querySelector(".tabs").addEventListener("click", (event) => {
  const tab = event.target.closest("[data-tab]");
  if (tab) showTab(tab.dataset.tab);
});

// Any button with data-go-tab="pet" (for example) jumps to that tab
document.addEventListener("click", (event) => {
  const link = event.target.closest("[data-go-tab]");
  if (link) {
    event.preventDefault();
    showTab(link.dataset.goTab);
  }
});


/* 5. DRAWING THE NEW TABS ----------------------------------------------------------
   app.js calls this at the end of render(). Each part of the page
   is only drawn while its tab is showing, to keep things fast.     */

// Which plugged-in parts (hooks.js) go on which Kickoff tab
const TAB_PARTS = {
  today: ["today"],
  quiz: ["quiz"],
  arcade: ["arcade"],
  training: ["training"],
  pet: ["pet", "stats"], // the Sticker Album is on the Pet tab here
};

function renderBridge() {
  if (currentTab === "quiz") renderQuiz();             // quiz.js
  if (currentTab === "pet") renderPetAndShop();       // pet.js and shop.js
  if (currentTab === "training") renderTraining();    // training.js
  applyWear(); // page themes from the shop (shop.js)
  TAB_PARTS[currentTab].forEach(drawPageParts);       // hooks.js
}

// Opening the page with a tab in the address, like "#quiz"
document.addEventListener("DOMContentLoaded", () => {
  const name = location.hash.replace("#", "");
  if (TAB_NAMES.includes(name) && name !== "today") showTab(name, false);
});
