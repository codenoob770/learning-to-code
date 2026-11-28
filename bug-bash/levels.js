/* =============================================================
   levels.js: the Bug Bash World Map
   -------------------------------------------------------------
   10 levels in 3 worlds. Each level has its own mix of bugs and a
   goal, like "squash 20 bugs" or "squash the boss". Beat a level
   to unlock the next one, and get up to 3 stars (lose fewer tests
   for more stars). Level 10 is the final boss: the MEGA BUG!

   New kinds of bugs (they're drawn in game.js):
     splitter: splits into two little fast bugs when you squash it
     ghost:    fades in and out, so it's hard to see
     armored:  needs 2 taps (the first one cracks its armor)
     mega:     the final boss. It calls for help and turns into a ghost!

   This file loads after game.js and uses its functions.
   ============================================================= */

const WORLDS = [
  { name: "Frontend Forest", icon: "🌲", lead: "Where every coder starts." },
  { name: "Backend Bay", icon: "🌊", lead: "Strange new bugs live down here..." },
  { name: "Cloud Castle", icon: "☁️", lead: "The Mega Bug's home. Good luck!" },
];

// "mix" says how often each kind of bug shows up (bigger = more often).
// "version" is how fast the bugs are (like v1.0, v1.1... in the normal game).
// "spawn" above 1 sends bugs less often.
const LEVELS = [
  { id: 1, world: 0, icon: "👋", name: "Hello, World", goal: 15, version: 0, mix: { bug: 1 },
    intro: "Your first job: squash 15 bugs before they reach production." },
  { id: 2, world: 0, icon: "✨", name: "Golden Hour", goal: 20, version: 1, mix: { bug: 4, golden: 1 },
    intro: "Golden bugs are fast and worth 50 points. Catch them!" },
  { id: 3, world: 0, icon: "🚀", name: "Ship It", goal: 20, version: 1, mix: { bug: 3, feature: 1 },
    intro: "Features are NOT bugs. Let them reach production!" },
  { id: 4, world: 1, icon: "✂️", name: "Splitting Headache", goal: 24, version: 1, mix: { bug: 3, splitter: 2 }, newBug: "splitter",
    intro: "NEW BUG: Splitters! Squash one and it splits into two little fast bugs." },
  { id: 5, world: 1, icon: "👻", name: "Ghost in the Code", goal: 20, version: 2, mix: { bug: 3, ghost: 2 }, newBug: "ghost",
    intro: "NEW BUG: Ghosts! They fade in and out. Watch closely!" },
  { id: 6, world: 1, icon: "🛡️", name: "Heavy Metal", goal: 20, version: 2, mix: { bug: 3, armored: 2, feature: 1 }, newBug: "armored",
    intro: "NEW BUG: Armored bugs! The first tap cracks the armor. The second one squashes it." },
  { id: 7, world: 2, icon: "🐝", name: "The Swarm", goal: 30, version: 3, mix: { bug: 4, golden: 1, splitter: 1, ghost: 1, armored: 1 },
    intro: "Every kind of bug, all at once. Stay sharp!" },
  { id: 8, world: 2, icon: "💜", name: "Boss Battle", version: 3, mix: { bug: 3, splitter: 1, feature: 1 }, spawn: 1.5, boss: { kind: "boss", hp: 16 },
    intro: "A boss bug is coming! Squash it (16 taps) while the other bugs keep crawling." },
  { id: 9, world: 2, icon: "🌪️", name: "Chaos Mode", goal: 35, version: 4, mix: { bug: 3, golden: 1, splitter: 2, ghost: 2, armored: 2, feature: 1 },
    intro: "The last stop before the Mega Bug. Fast and wild!" },
  { id: 10, world: 2, icon: "👑", name: "The Mega Bug", version: 3, mix: { bug: 2, splitter: 1, ghost: 1 }, spawn: 1.8, boss: { kind: "mega", hp: 45 }, newBug: "mega",
    intro: "THE FINAL BOSS! The Mega Bug takes 45 taps. It calls for help, and when it's hurt, it turns into a GHOST. Don't let it reach production!" },
];

const MAP_KEY = "bugBashMap"; // saved: { stars: { 1: 3, 2: 2, ... } }

function mapProgress() {
  try {
    const saved = JSON.parse(load(MAP_KEY, "null"));
    return saved && saved.stars ? saved : { stars: {} };
  } catch (error) {
    return { stars: {} };
  }
}

function levelUnlocked(level) {
  return level.id === 1 || (mapProgress().stars[level.id - 1] || 0) > 0;
}

// The next bug for the level you're playing, picked from its mix
function levelKind() {
  const mix = Object.entries(game.level.mix).filter(([kind]) => kind !== "feature" || game.time - game.level.version * RULES.secondsPerVersion > 3);
  const total = mix.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = rand() * total;
  for (const [kind, weight] of mix) {
    roll -= weight;
    if (roll < 0) return kind;
  }
  return "bug";
}

// What the scoreboard shows instead of the version, like "12/20"
function levelProgress() {
  if (game.level.boss) return game.levelBoss ? "✓" : "BOSS";
  return `${Math.min(game.squashed, game.level.goal)}/${game.level.goal}`;
}

function spawnLevelBoss() {
  if (!game.level || !game.level.boss || game.mode === "over" || game.mode === "won") return;
  const boss = makeBug(game.level.boss.kind, width / 2, -80, Math.PI / 2);
  boss.hp = game.level.boss.hp;
  boss.maxHp = boss.hp;
  bugs.push(boss);
  game.bosses += 1;
  showToast(boss.kind === "mega" ? "👑 THE MEGA BUG IS HERE!" : "⚠️ A BOSS BUG appeared! Tap it lots!", "bad");
  sounds.ouch();
}

// Called every frame during a level (from game.js)
function checkLevelGoal() {
  const level = game.level;
  const won = level.boss ? game.levelBoss : game.squashed >= level.goal;
  if (won) winLevel();
}


/* WINNING A LEVEL ------------------------------------------------------- */

function starsFor() {
  const lost = game.totalTests - game.tests;
  if (lost === 0) return 3;
  return lost === 1 ? 2 : 1;
}

function winLevel() {
  const level = game.level;
  game.mode = "won";
  game.spawnTimer = 1;
  drops = [];
  updateEffects();
  if (level.custom) {
    winMyLevel(level);
    return;
  }
  document.querySelector("#won-map").textContent = "World map";

  const stars = starsFor();
  const progress = mapProgress();
  const before = progress.stars[level.id] || 0;
  progress.stars[level.id] = Math.max(before, stars);
  save(MAP_KEY, JSON.stringify(progress));
  updateMapButton();

  // A big goo party for the win
  for (let i = 0; i < 8; i++) addBurst(Math.random() * width, Math.random() * height * 0.6, ["#ffe24d", "#7fdcc8", "#ff7a5c", "#a98bff"][i % 4]);
  sounds.levelUp();

  const final = level.id === LEVELS.length;
  const next = LEVELS[level.id]; // (the list starts at 0, so this is the next level)
  document.querySelector("#won-eyebrow").textContent = `// ${WORLDS[level.world].icon} ${WORLDS[level.world].name} · level ${level.id}`;
  document.querySelector("#won-heading").textContent = final ? "YOU BEAT THE MEGA BUG!" : "Level complete!";
  document.querySelector("#won-stars").textContent = "⭐".repeat(stars) + "☆".repeat(3 - stars);
  document.querySelector("#won-stars").setAttribute("aria-label", `${stars} of 3 stars`);
  document.querySelector("#won-lead").textContent = final
    ? "You saved the whole codebase. You're officially a Senior Bug Basher! 🏆"
    : stars === 3 ? "Perfect! Not a single test broke." : "Nice work! Lose fewer tests for more stars.";
  document.querySelector("#won-score").textContent = game.score.toLocaleString();
  document.querySelector("#won-squashed").textContent = game.squashed;
  document.querySelector("#won-tests").textContent = `${game.tests}/${game.totalTests}`;
  const nextButton = document.querySelector("#won-next");
  nextButton.hidden = !next;
  if (next) nextButton.textContent = `Next: ${next.icon} ${next.name}`;
  showScreen("won");
  (next ? nextButton : document.querySelector("#won-map")).focus();
}


// Winning a level from the Level Maker (maker.js): no map stars, and it goes back to the maker
function winMyLevel(level) {
  for (let i = 0; i < 8; i++) addBurst(Math.random() * width, Math.random() * height * 0.6, ["#ffe24d", "#7fdcc8", "#ff7a5c", "#a98bff"][i % 4]);
  sounds.levelUp();
  const stars = starsFor();
  document.querySelector("#won-eyebrow").textContent = "// level maker";
  document.querySelector("#won-heading").textContent = `You beat ${level.icon} ${level.name}!`;
  document.querySelector("#won-stars").textContent = "⭐".repeat(stars) + "☆".repeat(3 - stars);
  document.querySelector("#won-stars").setAttribute("aria-label", `${stars} of 3 stars`);
  document.querySelector("#won-lead").textContent = stars === 3 ? "Perfect! Make it harder next time? 😈" : "Nice! Can you beat it without losing a test?";
  document.querySelector("#won-score").textContent = game.score.toLocaleString();
  document.querySelector("#won-squashed").textContent = game.squashed;
  document.querySelector("#won-tests").textContent = `${game.tests}/${game.totalTests}`;
  document.querySelector("#won-next").hidden = true;
  document.querySelector("#won-map").textContent = "Level Maker";
  showScreen("won");
  document.querySelector("#won-again").focus();
}


/* THE MAP AND THE LEVEL INTRO -------------------------------------------- */

function totalStars() {
  return Object.values(mapProgress().stars).reduce((sum, stars) => sum + stars, 0);
}

function openMap() {
  game.mode = "title"; // bugs wander around behind the map
  game.level = null;
  updateScoreboard();
  const progress = mapProgress();
  document.querySelector("#map-stars").textContent = `⭐ ${totalStars()} of ${LEVELS.length * 3} stars`;
  document.querySelector("#map-worlds").innerHTML = WORLDS.map((world, w) => `
    <section class="map-world">
      <h3 class="map-world__name">${world.icon} ${world.name}</h3>
      <p class="map-world__lead">${world.lead}</p>
      <ol class="map-levels">${LEVELS.filter((level) => level.world === w).map((level) => {
        const open = levelUnlocked(level);
        const stars = progress.stars[level.id] || 0;
        return `
          <li>
            <button class="map-level ${stars ? "is-done" : ""} ${level.boss ? "is-boss" : ""}" type="button" data-level="${level.id}" ${open ? "" : "disabled"}
              aria-label="Level ${level.id}: ${level.name}${open ? `, ${stars} of 3 stars` : ", locked"}">
              <span class="map-level__icon" aria-hidden="true">${open ? level.icon : "🔒"}</span>
              <span class="map-level__text">
                <span class="map-level__name">${level.id}. ${level.name}</span>
                <span class="map-level__stars" aria-hidden="true">${open ? "⭐".repeat(stars) + "☆".repeat(3 - stars) : "Beat the level before"}</span>
              </span>
            </button>
          </li>`;
      }).join("")}</ol>
    </section>`).join("");
  showScreen("map");
  const first = [...document.querySelectorAll("[data-level]:not(:disabled)")];
  (first.find((button) => !button.classList.contains("is-done")) || first[0])?.focus();
}

let introLevel = null;

function openIntro(level) {
  introLevel = level;
  document.querySelector("#intro-eyebrow").textContent = `// ${WORLDS[level.world].icon} ${WORLDS[level.world].name} · level ${level.id} of ${LEVELS.length}`;
  document.querySelector("#intro-heading").textContent = `${level.icon} ${level.name}`;
  document.querySelector("#intro-lead").textContent = level.intro;
  document.querySelector("#intro-goal").textContent = level.boss
    ? `Goal: squash the ${level.boss.kind === "mega" ? "Mega Bug" : "boss bug"}!`
    : `Goal: squash ${level.goal} bugs.`;
  const picture = document.querySelector("#intro-bug");
  picture.hidden = !level.newBug;
  if (level.newBug) {
    const size = 88;
    picture.width = size * pixelRatio;
    picture.height = size * pixelRatio;
    const c = picture.getContext("2d");
    c.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    c.clearRect(0, 0, size, size);
    drawBug(c, { kind: level.newBug, x: size / 2, y: size / 2 + 4, size: level.newBug === "mega" ? 30 : 32, angle: -Math.PI / 2, legs: 0.8, hp: 2, alpha: level.newBug === "ghost" ? 0.55 : 1 });
  }
  showScreen("intro");
  document.querySelector("#intro-start").focus();
}

document.querySelector("#map-button").addEventListener("click", openMap);
document.querySelector("#map-back").addEventListener("click", () => {
  showScreen("title");
  document.querySelector("#map-button").focus();
});
document.querySelector("#map-worlds").addEventListener("click", (event) => {
  const button = event.target.closest("[data-level]");
  if (!button || button.disabled) return;
  openIntro(LEVELS.find((level) => level.id === Number(button.dataset.level)));
});
document.querySelector("#intro-start").addEventListener("click", () => startGame(false, introLevel));
document.querySelector("#intro-back").addEventListener("click", openMap);
document.querySelector("#won-next").addEventListener("click", () => openIntro(LEVELS[game.level.id]));
document.querySelector("#won-map").addEventListener("click", () => backToMakerOrMap()); // maker.js
document.querySelector("#won-again").addEventListener("click", () => startGame(false, game.level));
document.querySelector("#over-map").addEventListener("click", () => backToMakerOrMap()); // maker.js

// The map button on the title screen shows your stars
function updateMapButton() {
  document.querySelector("#map-button-stars").textContent = `⭐ ${totalStars()}/${LEVELS.length * 3}`;
}
updateMapButton();
