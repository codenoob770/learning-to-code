/* =============================================================
   maker.js: the Bug Bash Level Maker
   -------------------------------------------------------------
   Design your own level: pick the bugs, how fast they go, the goal
   and how many tests you get. Then play it, save it, or share it
   with a code (like "BB-4K9P-ZQ2M") so someone else can play it too!

   A level here is the same kind of object as the World Map levels
   in levels.js (with "mix", "version", "goal" or "boss"), plus
   "custom: true", so the game plays it the same way.

   This file loads after game.js and levels.js and uses their functions.
   ============================================================= */

const MAKER_KEY = "bugBashMyLevels"; // saved: your levels
const MAKER_MAX = 10;
const MAKER_ICONS = ["🐛", "🔥", "🌈", "🍕", "🦖", "🧪", "⚡", "🌋", "🎃", "🤖", "🦄", "💀", "🥋", "⚽", "🏊", "🚀"];
const MAKER_KINDS = [
  { kind: "bug", name: "Bug" },
  { kind: "golden", name: "Golden" },
  { kind: "feature", name: "Feature" },
  { kind: "splitter", name: "Splitter" },
  { kind: "ghost", name: "Ghost" },
  { kind: "armored", name: "Armored" },
];
const MAKER_SPEEDS = [
  { version: 0, name: "🐢 Slow" },
  { version: 2, name: "🚶 Medium" },
  { version: 4, name: "🏃 Fast" },
  { version: 6, name: "🚀 Super fast" },
];
const MAKER_GOALS = [
  { goal: 10, name: "Squash 10" },
  { goal: 20, name: "Squash 20" },
  { goal: 30, name: "Squash 30" },
  { goal: 40, name: "Squash 40" },
  { goal: 50, name: "Squash 50" },
  { boss: { kind: "boss", hp: 12 }, name: "👾 Small boss" },
  { boss: { kind: "boss", hp: 25 }, name: "👾 Big boss" },
  { boss: { kind: "mega", hp: 45 }, name: "👑 Mega Bug" },
];
const MAKER_SPAWNS = [
  { spawn: 1.6, name: "Chill" },
  { spawn: 1, name: "Normal" },
  { spawn: 0.7, name: "Swarm!" },
];

screens.maker = document.querySelector("#screen-maker"); // so showScreen() knows about it (game.js)

let makerDraft = blankLevel();

function blankLevel() {
  return { name: "", icon: 0, mix: { bug: 3, golden: 1, feature: 0, splitter: 0, ghost: 0, armored: 0 }, speed: 1, goal: 1, tests: 3, spawn: 1 };
}

function myLevels() {
  try {
    const saved = JSON.parse(load(MAKER_KEY, "[]"));
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    return [];
  }
}

// A design (the numbers you picked) -> a level the game can play
function playableLevel(design) {
  const goal = MAKER_GOALS[design.goal];
  const mix = {};
  for (const { kind } of MAKER_KINDS) if (design.mix[kind] > 0) mix[kind] = design.mix[kind];
  return {
    custom: true,
    design,
    icon: MAKER_ICONS[design.icon] || "🐛",
    name: design.name || "My level",
    version: MAKER_SPEEDS[design.speed].version,
    mix,
    goal: goal.goal,
    boss: goal.boss,
    tests: design.tests,
    spawn: MAKER_SPAWNS[design.spawn].spawn,
    intro: "A level made with the Level Maker!",
  };
}

// Can the level be won? It needs at least one bug you can squash.
function makerProblem(design) {
  const squashable = ["bug", "golden", "splitter", "ghost", "armored"].some((kind) => design.mix[kind] > 0);
  if (!squashable && !MAKER_GOALS[design.goal].boss) return "Add at least one kind of bug you can squash (not just features)!";
  if (!Object.values(design.mix).some((n) => n > 0)) return "Add some bugs first!";
  return "";
}


/* SHARING CODES -------------------------------------------------------------
   Every choice is a small number. They get packed into bits, then every
   5 bits becomes one letter (no I, L, O or U, so they can't get mixed
   up). The last letter is a check, to catch typos.                    */

const MAKER_LETTERS = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const MAKER_FIELDS = [
  ...MAKER_KINDS.map((item) => [`mix.${item.kind}`, 3]), // 0 to 7 of each bug
  ["speed", 2], ["goal", 3], ["tests", 3], ["spawn", 2], ["icon", 4],
];

// Each letter gets multiplied by an ODD number (1, 3, 5...). With odd numbers,
// changing any one letter always changes the check, so every typo gets caught.
function makerCheck(chunks) {
  return chunks.reduce((sum, value, i) => sum + value * (2 * i + 1), 5) % 32;
}

function levelCode(design) {
  let number = 0;
  for (const [field, bits] of MAKER_FIELDS) {
    const value = field.startsWith("mix.") ? design.mix[field.slice(4)] : design[field];
    number = number * 2 ** bits + Math.max(0, Math.min(2 ** bits - 1, value));
  }
  // 32 bits of choices -> 7 letters (35 bits), then 1 check letter
  const chunks = [];
  for (let i = 0; i < 7; i++) {
    chunks.unshift(number % 32);
    number = Math.floor(number / 32);
  }
  chunks.push(makerCheck(chunks));
  const letters = chunks.map((n) => MAKER_LETTERS[n]).join("");
  return `BB-${letters.slice(0, 4)}-${letters.slice(4)}`;
}

function readLevelCode(text) {
  const clean = String(text).toUpperCase().replace(/[^0-9A-Z]/g, "");
  if (!clean.startsWith("BB")) return null;
  const letters = clean.slice(2).replace(/O/g, "0").replace(/[IL]/g, "1");
  if (letters.length !== 8) return null;
  const chunks = [...letters].map((letter) => MAKER_LETTERS.indexOf(letter));
  if (chunks.some((n) => n < 0)) return null;
  if (makerCheck(chunks.slice(0, 7)) !== chunks[7]) return null;
  let number = chunks.slice(0, 7).reduce((sum, n) => sum * 32 + n, 0);
  const design = { name: "", mix: {} };
  for (const [field, bits] of [...MAKER_FIELDS].reverse()) {
    const value = number % 2 ** bits;
    number = Math.floor(number / 2 ** bits);
    if (field.startsWith("mix.")) design.mix[field.slice(4)] = value;
    else design[field] = value;
  }
  // Numbers that are too big for a list mean it's not a real code
  if (!MAKER_SPEEDS[design.speed] || !MAKER_SPAWNS[design.spawn] || design.tests < 1 || design.tests > 5) return null;
  return design;
}


/* THE MAKER SCREEN ------------------------------------------------------------ */

function drawMakerIcons() {
  document.querySelectorAll("[data-maker-bug]").forEach((icon) => {
    const size = 40;
    icon.width = size * pixelRatio;
    icon.height = size * pixelRatio;
    const c = icon.getContext("2d");
    c.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    c.clearRect(0, 0, size, size);
    drawBug(c, { kind: icon.dataset.makerBug, x: 20, y: 22, size: 17, angle: -Math.PI / 2, legs: 0.8, hp: 2, alpha: icon.dataset.makerBug === "ghost" ? 0.55 : 1 });
  });
}

function chips(list, current, field) {
  return list.map((item, i) => `<button class="maker-chip" type="button" data-maker-set="${field}" data-value="${i}" aria-pressed="${i === current}">${item.name}</button>`).join("");
}

function drawMaker(message = "") {
  const d = makerDraft;
  const saved = myLevels();
  const problem = makerProblem(d);
  document.querySelector("#maker-body").innerHTML = `
    <div class="maker-row">
      <label class="maker-label" for="maker-name">Name</label>
      <input class="maker-input" id="maker-name" type="text" maxlength="24" placeholder="Like &quot;Ghost Town&quot;" autocomplete="off" value="${escapeAttr(d.name)}">
    </div>
    <div class="maker-row maker-icons" role="group" aria-label="Icon">${MAKER_ICONS.map((icon, i) => `
      <button class="maker-chip maker-chip--icon" type="button" data-maker-set="icon" data-value="${i}" aria-pressed="${i === d.icon}" aria-label="${icon}">${icon}</button>`).join("")}
    </div>
    <p class="maker-label">Bugs <span>(more = they show up more often)</span></p>
    <div class="maker-bugs">${MAKER_KINDS.map(({ kind, name }) => `
      <div class="maker-bug ${d.mix[kind] ? "is-on" : ""}">
        <canvas class="maker-bug__icon" data-maker-bug="${kind}" aria-hidden="true"></canvas>
        <span class="maker-bug__name">${name}</span>
        <span class="maker-stepper">
          <button type="button" data-maker-mix="${kind}" data-step="-1" aria-label="Fewer ${name} bugs">−</button>
          <span aria-live="polite">${d.mix[kind]}</span>
          <button type="button" data-maker-mix="${kind}" data-step="1" aria-label="More ${name} bugs">+</button>
        </span>
      </div>`).join("")}
    </div>
    <p class="maker-label">Speed</p>
    <div class="maker-row">${chips(MAKER_SPEEDS, d.speed, "speed")}</div>
    <p class="maker-label">How many come at once</p>
    <div class="maker-row">${chips(MAKER_SPAWNS, d.spawn, "spawn")}</div>
    <p class="maker-label">Goal</p>
    <div class="maker-row">${chips(MAKER_GOALS, d.goal, "goal")}</div>
    <p class="maker-label">Tests (lives)</p>
    <div class="maker-row">${[1, 2, 3, 4, 5].map((n) => `<button class="maker-chip" type="button" data-maker-set="tests" data-value="${n}" aria-pressed="${n === d.tests}">${"🟢".repeat(n)}</button>`).join("")}</div>
    <p class="maker-message ${problem ? "is-bad" : ""}" aria-live="polite">${problem || message}</p>
    <div class="panel__actions">
      <button class="button" type="button" data-maker="play" ${problem ? "disabled" : ""}>▶ Play it!</button>
      <button class="button button--quiet" type="button" data-maker="save" ${problem || saved.length >= MAKER_MAX ? "disabled" : ""}>💾 Save</button>
      <button class="button button--quiet" type="button" data-maker="new">New</button>
    </div>
    ${saved.length ? `
      <p class="maker-label">My levels</p>
      <ul class="maker-saved">${saved.map((design, i) => `
        <li>
          <span class="maker-saved__name">${MAKER_ICONS[design.icon] || "🐛"} ${escapeAttr(design.name || "My level")}</span>
          <code class="maker-saved__code">${levelCode(design)}</code>
          <button class="maker-chip" type="button" data-maker-play="${i}">▶ Play</button>
          <button class="maker-chip" type="button" data-maker-edit="${i}">Edit</button>
          <button class="maker-chip" type="button" data-maker-delete="${i}">Delete</button>
        </li>`).join("")}
      </ul>
      <p class="maker-hint">Share a level: tell someone its code! They type it below on their Bug Bash.</p>` : ""}
    <form class="maker-row maker-code" id="maker-code-form">
      <label class="maker-label" for="maker-code">Play a friend's level</label>
      <input class="maker-input" id="maker-code" type="text" maxlength="14" placeholder="BB-XXXX-XXXX" autocomplete="off" autocapitalize="characters" spellcheck="false">
      <button class="button button--quiet" type="submit">Play</button>
    </form>`;
  drawMakerIcons();
}

// Like escapeHTML: typed text can't become HTML
function escapeAttr(text) {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function openMaker() {
  game.mode = "title"; // bugs wander around behind the screen
  game.level = null;
  updateScoreboard();
  drawMaker();
  showScreen("maker");
  document.querySelector("#maker-name").focus();
}

function playDesign(design) {
  startGame(false, playableLevel(design));
}

document.querySelector("#maker-button").addEventListener("click", openMaker);
document.querySelector("#maker-back").addEventListener("click", () => {
  showScreen("title");
  document.querySelector("#maker-button").focus();
});

const makerBody = document.querySelector("#maker-body");

makerBody.addEventListener("input", (event) => {
  if (event.target.id === "maker-name") makerDraft = { ...makerDraft, name: event.target.value };
});

makerBody.addEventListener("click", (event) => {
  const set = event.target.closest("[data-maker-set]");
  if (set) {
    makerDraft = { ...makerDraft, [set.dataset.makerSet]: Number(set.dataset.value) };
    drawMaker();
    document.querySelector(`[data-maker-set="${set.dataset.makerSet}"][data-value="${set.dataset.value}"]`)?.focus();
    return;
  }
  const mix = event.target.closest("[data-maker-mix]");
  if (mix) {
    const kind = mix.dataset.makerMix;
    const value = Math.max(0, Math.min(5, makerDraft.mix[kind] + Number(mix.dataset.step)));
    makerDraft = { ...makerDraft, mix: { ...makerDraft.mix, [kind]: value } };
    drawMaker();
    document.querySelector(`[data-maker-mix="${kind}"][data-step="${mix.dataset.step}"]`)?.focus();
    return;
  }
  const play = event.target.closest("[data-maker-play]");
  if (play) {
    playDesign(myLevels()[Number(play.dataset.makerPlay)]);
    return;
  }
  const edit = event.target.closest("[data-maker-edit]");
  if (edit) {
    makerDraft = { ...myLevels()[Number(edit.dataset.makerEdit)], editing: Number(edit.dataset.makerEdit) };
    drawMaker("Editing your level. Save it again when you're done!");
    document.querySelector("#maker-name").focus();
    return;
  }
  const remove = event.target.closest("[data-maker-delete]");
  if (remove) {
    const list = myLevels();
    list.splice(Number(remove.dataset.makerDelete), 1);
    save(MAKER_KEY, JSON.stringify(list));
    drawMaker("Deleted.");
    return;
  }
  const button = event.target.closest("[data-maker]");
  if (!button || button.disabled) return;
  const action = button.dataset.maker;
  if (action === "play") playDesign(makerDraft);
  if (action === "new") {
    makerDraft = blankLevel();
    drawMaker();
  }
  if (action === "save") {
    const list = myLevels();
    const { editing, ...design } = makerDraft;
    design.name = design.name.trim() || `My level ${list.length + 1}`;
    if (editing !== undefined && list[editing]) list[editing] = design;
    else list.push(design);
    save(MAKER_KEY, JSON.stringify(list.slice(-MAKER_MAX)));
    makerDraft = { ...design, editing: editing !== undefined ? editing : list.length - 1 };
    sounds.levelUp();
    drawMaker(`Saved! Its code is ${levelCode(design)}`);
  }
});

makerBody.addEventListener("submit", (event) => {
  if (event.target.id !== "maker-code-form") return;
  event.preventDefault();
  const design = readLevelCode(document.querySelector("#maker-code").value);
  if (!design) {
    drawMaker("🤔 That code doesn't work. Check each letter and try again!");
    document.querySelector("#maker-code").focus();
    return;
  }
  design.name = "Friend's level";
  makerDraft = design;
  playDesign(design);
});

// After a custom level: the "World map" buttons go back to the maker instead
function backToMakerOrMap() {
  if (game.level && game.level.custom) openMaker();
  else openMap();
}
