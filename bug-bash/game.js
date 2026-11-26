/* =============================================================
   game.js: Bug Bash
   -------------------------------------------------------------
   How a browser game works: about 60 times every second, the
   game does the same three things:
     1. UPDATE: move everything a tiny bit
     2. DRAW:   paint everything on the canvas in its new place
     3. Ask the browser to do it all again for the next frame
   This is called the "game loop". It's at the very bottom of this file.

   Parts of this file:
   1. Setup: the canvas, the rules and the colors
   2. Game state: score, tests and the lists of things on screen
   3. Sounds
   4. Making bugs and moving them
   5. Squashing (clicks and taps)
   6. Updating every frame
   7. Drawing every frame
   8. Scoreboard and screens
   9. Starting everything up, and the game loop
   ============================================================= */


/* 1. SETUP ------------------------------------------------------ */

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d"); // "ctx" is the paintbrush for the canvas
const arena = document.querySelector(".arena");

// The rules of the game. Change these numbers to make it easier or harder!
const RULES = {
  startingTests: 3,       // how many bugs can get through before the game ends
  bugPoints: 10,
  goldenPoints: 50,
  featurePoints: 25,      // for letting a feature reach production
  maxCombo: 5,            // the highest combo multiplier
  squashesPerCombo: 4,    // squashes in a row needed for each +1 to the combo
  secondsPerVersion: 20,  // a new "version" (a harder level) comes out this often
  productionHeight: 46,   // height of the red zone at the bottom, in pixels
};

// The canvas can't use CSS variables, so the game's colors live here.
// They match the colors in style.css.
const COLORS = {
  background: "#0e1424",
  lineNumber: "#4a5677",
  code: "#c3cbe0",
  comment: "#6f7b9d",
  keyword: "#a3b4ff",
  string: "#ffe24d",
  danger: "#ff6b6b",
  text: "#e3e8f5",
};

// What each kind of bug looks like
const LOOKS = {
  bug:     { shell: "#ff7a5c", dark: "#9c3324", legs: "#ffb48a", goo: "#b9e65c" },
  golden:  { shell: "#ffe24d", dark: "#a8820a", legs: "#fff0a8", goo: "#ffe24d" },
  feature: { shell: "#7fdcc8", dark: "#2e8c78", legs: "#c4f1e7", goo: "#7fdcc8" },
};

// The code the bugs crawl over. Just for fun: none of it is real!
const BACKGROUND_CODE = [
  "// bugs.js",
  "// Please don't look too closely at this file.",
  "",
  "const coffee = Infinity;",
  "let bugsFixed = 0;",
  "",
  "function shipIt(code) {",
  "  if (code.works) {",
  "    return deploy(code);",
  "  }",
  "  // TODO: figure out why this works",
  "  return tryAgain(code);",
  "}",
  "",
  "function fixBug(bug) {",
  "  bugsFixed = bugsFixed + 1;",
  "  return makeTwoNewBugs();",
  "}",
  "",
  "while (true) {",
  "  writeCode();",
  "  findBugs(); // it works on my machine",
  "}",
  "",
  "// Do not touch. Nobody knows why it works.",
  "if (isMonday) {",
  "  panic(\"gently\");",
  "}",
  "",
];

// Some people turn on "reduce motion" in their settings. We skip screen shake for them.
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

// Size of the game area, in CSS pixels
let width = 0;
let height = 0;
let pixelRatio = 1;

// The background code is painted once onto a hidden canvas, then copied
// onto the real one every frame. That's much faster than writing all that
// text 60 times a second.
const codeLayer = document.createElement("canvas");

function resize() {
  const box = arena.getBoundingClientRect();
  width = box.width;
  height = box.height;

  // A canvas has two sizes: how big it looks on the page, and how many
  // pixels it holds. Sharp (retina) screens need extra pixels to look crisp.
  pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  drawCodeLayer();
}


/* 2. GAME STATE ------------------------------------------------- */

const game = {
  mode: "title",   // "title", "playing", "paused" or "over"
  score: 0,
  best: 0,
  tests: RULES.startingTests,
  streak: 0,       // squashes in a row without a miss
  squashed: 0,
  clicks: 0,
  time: 0,         // seconds played so far
  version: 0,      // 0 means v1.0, 1 means v1.1, and so on
  spawnTimer: 0,   // seconds until the next bug appears
  shake: 0,        // how much the screen is shaking right now
};

// Lists ("arrays") of everything on screen
let bugs = [];
let splats = [];
let particles = [];
let popups = [];
let ripples = [];

// Small helpers for saving things in the browser. try/catch keeps the
// game working even if the browser blocks storage.
function load(key, fallback) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch (error) {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    // Couldn't save. That's OK.
  }
}

game.best = Number(load("bugBashBest", 0)) || 0;


/* 3. SOUNDS -----------------------------------------------------
   No sound files! The Web Audio API makes beeps from scratch. An
   "oscillator" makes a tone, and we slide its pitch up or down.  */

let audio = null;
let soundOn = load("bugBashSound", "on") === "on";

// Browsers only allow sound after someone clicks, so we start the
// audio system when the Start button is pressed.
function startAudio() {
  if (!audio) {
    const AudioSystem = window.AudioContext || window.webkitAudioContext;
    if (AudioSystem) audio = new AudioSystem();
  }
  if (audio && audio.state === "suspended") audio.resume();
}

function beep(startPitch, endPitch, seconds, wave = "triangle", volume = 0.12, delay = 0) {
  if (!soundOn || !audio) return;
  const start = audio.currentTime + delay;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain(); // controls the volume

  oscillator.type = wave;
  oscillator.frequency.setValueAtTime(startPitch, start);
  oscillator.frequency.exponentialRampToValueAtTime(endPitch, start + seconds);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + seconds);

  oscillator.connect(gain).connect(audio.destination);
  oscillator.start(start);
  oscillator.stop(start + seconds + 0.02);
}

const sounds = {
  squash: () => beep(520, 90, 0.12, "square", 0.06),
  golden: () => {
    beep(880, 880, 0.08);
    beep(1320, 1320, 0.16, "triangle", 0.12, 0.08);
  },
  combo: () => {
    beep(660, 660, 0.06);
    beep(990, 990, 0.1, "triangle", 0.12, 0.06);
  },
  shipped: () => {
    beep(523, 523, 0.08);
    beep(784, 784, 0.14, "triangle", 0.12, 0.08);
  },
  levelUp: () => [523, 659, 784, 1047].forEach((pitch, i) => beep(pitch, pitch, 0.1, "triangle", 0.1, i * 0.08)),
  ouch: () => beep(200, 55, 0.35, "sawtooth", 0.09),
  miss: () => beep(260, 210, 0.05, "sine", 0.05),
};


/* 4. MAKING BUGS AND MOVING THEM -------------------------------- */

// Bugs get a little bigger on bigger screens
function bugSize() {
  return Math.max(20, Math.min(30, Math.min(width, height) / 22));
}

function makeBug(kind, x, y, angle) {
  return {
    kind,                                     // "bug", "golden" or "feature"
    x,
    y,
    angle,                                    // which way it faces (in radians)
    size: bugSize() * (kind === "golden" ? 0.85 : 1),
    speed: kind === "golden" ? 1.6 : 0.85 + Math.random() * 0.3,
    wobble: Math.random() * Math.PI * 2,      // where it is in its side-to-side wiggle
    legs: Math.random() * Math.PI * 2,        // where its legs are in their walk
  };
}

// Pick a random kind of bug. Features only show up after the first few seconds.
function randomKind() {
  const roll = Math.random(); // a random number from 0 to 1
  if (roll < 0.08) return "golden";
  if (game.time > 8 && roll < 0.2) return "feature";
  return "bug";
}

// During a game, new bugs appear just above the top of the screen, facing down.
function spawnBug() {
  if (width < 100) return;
  const margin = 40;
  const x = margin + Math.random() * (width - margin * 2);
  bugs.push(makeBug(randomKind(), x, -30, Math.PI / 2));
}

// On the title screen, bugs wander in from the left, right or top edge.
function spawnWanderer() {
  const kinds = ["bug", "bug", "bug", "bug", "golden", "feature"];
  const kind = kinds[Math.floor(Math.random() * kinds.length)];
  const side = Math.floor(Math.random() * 3);
  let x = Math.random() * width;
  let y = -30;
  if (side === 1) { x = -30; y = Math.random() * height * 0.7; }
  if (side === 2) { x = width + 30; y = Math.random() * height * 0.7; }
  const towardsMiddle = Math.atan2(height / 2 - y, width / 2 - x);
  bugs.push(makeBug(kind, x, y, towardsMiddle));
}

// How long a bug takes to crawl down the whole screen. Shorter in later versions.
function crossingTime() {
  return Math.max(2.8, 9 - game.version * 0.7);
}

// Seconds between new bugs. Shorter in later versions.
function spawnInterval() {
  return Math.max(0.32, 1.25 * Math.pow(0.86, game.version));
}

// Turn a bug a little towards an angle, the short way round.
function turnToward(bug, targetAngle, rate, dt) {
  let difference = targetAngle - bug.angle;
  difference = Math.atan2(Math.sin(difference), Math.cos(difference));
  bug.angle += difference * Math.min(1, rate * dt);
}

// During a game, bugs head down the screen, wiggling side to side.
// "dt" is the time since the last frame, in seconds (about 0.016).
function moveBugDown(bug, dt) {
  bug.wobble += dt * 3;
  bug.legs += dt * 18 * bug.speed;

  let target = Math.PI / 2 + Math.sin(bug.wobble) * 0.6; // mostly down, a bit sideways
  if (bug.x < 30) target -= 0.7;          // too close to the left edge: steer right
  if (bug.x > width - 30) target += 0.7;  // too close to the right edge: steer left
  turnToward(bug, target, 4, dt);

  const pixelsPerSecond = (height / crossingTime()) * bug.speed;
  bug.x += Math.cos(bug.angle) * pixelsPerSecond * dt;
  bug.y += Math.sin(bug.angle) * pixelsPerSecond * dt;
}

// On the title and game-over screens, bugs just wander around.
function wander(bug, dt) {
  bug.wobble += dt * 1.3;
  bug.legs += dt * 14 * bug.speed;
  bug.angle += Math.sin(bug.wobble) * dt * 1.6; // lazy curves

  const pad = 50;
  const nearEdge =
    bug.x < pad || bug.x > width - pad ||
    bug.y < pad || bug.y > height - RULES.productionHeight - pad;
  if (nearEdge) {
    turnToward(bug, Math.atan2(height / 2 - bug.y, width / 2 - bug.x), 2.5, dt);
  }

  const pixelsPerSecond = 38 * bug.speed;
  bug.x += Math.cos(bug.angle) * pixelsPerSecond * dt;
  bug.y += Math.sin(bug.angle) * pixelsPerSecond * dt;
}


/* 5. SQUASHING ------------------------------------------------- */

// "pointerdown" works for mouse clicks AND finger taps
canvas.addEventListener("pointerdown", (event) => {
  if (event.button > 0) return;            // ignore right-clicks
  if (game.mode === "paused") return;

  const box = canvas.getBoundingClientRect();
  const x = event.clientX - box.left;
  const y = event.clientY - box.top;

  const bug = findBugAt(x, y);
  if (bug) {
    squash(bug);
  } else {
    missed(x, y);
  }
});

// Find the bug closest to a point, if one is close enough to hit.
// The hit area is a bit bigger than the bug so fingers can hit it too.
function findBugAt(x, y) {
  let closest = null;
  let closestDistance = Infinity;
  for (const bug of bugs) {
    const distance = Math.hypot(bug.x - x, bug.y - y);
    const reach = Math.max(bug.size * 1.15, 26);
    if (distance < reach && distance < closestDistance) {
      closest = bug;
      closestDistance = distance;
    }
  }
  return closest;
}

function comboMultiplier() {
  return Math.min(RULES.maxCombo, 1 + Math.floor(game.streak / RULES.squashesPerCombo));
}

function squash(bug) {
  bugs.splice(bugs.indexOf(bug), 1); // take it out of the list
  addSplat(bug);
  addBurst(bug.x, bug.y, LOOKS[bug.kind].goo);

  // Outside a game, squashing is just for fun
  if (game.mode !== "playing") {
    sounds.squash();
    return;
  }

  game.clicks += 1;

  if (bug.kind === "feature") {
    addPopup(bug.x, bug.y, "oops!", COLORS.danger);
    breakTest("That was a feature!");
    return;
  }

  game.squashed += 1;
  game.streak += 1;
  const combo = comboMultiplier();
  const points = (bug.kind === "golden" ? RULES.goldenPoints : RULES.bugPoints) * combo;
  game.score += points;
  addPopup(bug.x, bug.y, `+${points}`, bug.kind === "golden" ? LOOKS.golden.shell : COLORS.text);

  // Did this squash just unlock a bigger combo?
  const reachedNewCombo =
    game.streak % RULES.squashesPerCombo === 0 &&
    game.streak / RULES.squashesPerCombo < RULES.maxCombo;

  if (reachedNewCombo) {
    showToast(`Combo ×${combo}!`, "good");
    sounds.combo();
  } else if (bug.kind === "golden") {
    sounds.golden();
  } else {
    sounds.squash();
  }
  updateScoreboard();
}

function missed(x, y) {
  ripples.push({ x, y, life: 1 });
  if (game.mode !== "playing") return;

  game.clicks += 1;
  if (game.streak >= RULES.squashesPerCombo) showToast("Missed! Combo lost.", "bad");
  game.streak = 0;
  sounds.miss();
  updateScoreboard();
}

// A bug reached the red zone at the bottom
function reachedProduction(bug) {
  const y = height - RULES.productionHeight;

  if (bug.kind === "feature") {
    game.score += RULES.featurePoints;
    addPopup(bug.x, y, `+${RULES.featurePoints}`, LOOKS.feature.shell);
    showToast(`Feature shipped! +${RULES.featurePoints}`, "good");
    sounds.shipped();
    updateScoreboard();
    return;
  }

  addPopup(bug.x, y, "−1 test", COLORS.danger);
  addBurst(bug.x, y + 10, COLORS.danger);
  breakTest(bug.kind === "golden" ? "A golden bug got away!" : "A bug reached production!");
}

function breakTest(message) {
  game.tests -= 1;
  game.streak = 0;
  game.shake = 0.4;
  sounds.ouch();
  updateScoreboard();

  if (game.tests <= 0) {
    endGame();
  } else {
    showToast(`${message} −1 test`, "bad");
  }
}


/* 6. UPDATING EVERY FRAME --------------------------------------- */

function update(dt) {
  if (game.mode === "paused") return; // freeze everything

  updateEffects(dt);

  if (game.mode === "playing") {
    updateGame(dt);
  } else {
    updateWanderers(dt);
  }
}

function updateGame(dt) {
  game.time += dt;

  // Time for a new version?
  const version = Math.floor(game.time / RULES.secondsPerVersion);
  if (version > game.version) {
    game.version = version;
    showToast(`${versionName()} released! Bugs got faster.`, "good");
    sounds.levelUp();
    updateScoreboard();
  }

  // Time for a new bug?
  game.spawnTimer -= dt;
  if (game.spawnTimer <= 0) {
    spawnBug();
    game.spawnTimer = spawnInterval() * (0.7 + Math.random() * 0.6);
  }

  // Move every bug. [...bugs] makes a copy, so we can safely remove
  // bugs from the real list while going through it.
  const finishLine = height - RULES.productionHeight;
  for (const bug of [...bugs]) {
    moveBugDown(bug, dt);
    if (bug.y > finishLine && game.mode === "playing") {
      bugs.splice(bugs.indexOf(bug), 1);
      reachedProduction(bug);
    }
  }
}

function updateWanderers(dt) {
  for (const bug of bugs) wander(bug, dt);

  // Keep a few bugs around so the screen is never empty
  if (bugs.length < 7) {
    game.spawnTimer -= dt;
    if (game.spawnTimer <= 0) {
      spawnWanderer();
      game.spawnTimer = 1.2;
    }
  }
}

// Splats, flying bits, floating numbers and click ripples all fade away over time
function updateEffects(dt) {
  for (const splat of splats) splat.life -= dt / 5;
  for (const bit of particles) {
    bit.x += bit.vx * dt;
    bit.y += bit.vy * dt;
    bit.vy += 500 * dt; // gravity pulls them down
    bit.life -= dt * 2;
  }
  for (const popup of popups) {
    popup.y -= 40 * dt;
    popup.life -= dt * 1.1;
  }
  for (const ripple of ripples) ripple.life -= dt * 3;

  // .filter() keeps only the items that are still alive
  splats = splats.filter((item) => item.life > 0);
  particles = particles.filter((item) => item.life > 0);
  popups = popups.filter((item) => item.life > 0);
  ripples = ripples.filter((item) => item.life > 0);

  game.shake = Math.max(0, game.shake - dt);
}

function addSplat(bug) {
  const drops = [];
  for (let i = 0; i < 8; i++) {
    const direction = Math.random() * Math.PI * 2;
    const distance = bug.size * (0.5 + Math.random() * 0.6);
    drops.push({
      x: Math.cos(direction) * distance,
      y: Math.sin(direction) * distance,
      r: bug.size * (0.06 + Math.random() * 0.1),
    });
  }
  splats.push({ x: bug.x, y: bug.y, size: bug.size, drops, look: LOOKS[bug.kind], life: 1 });
  if (splats.length > 40) splats.shift(); // don't keep too many
}

function addBurst(x, y, color) {
  for (let i = 0; i < 12; i++) {
    const direction = Math.random() * Math.PI * 2;
    const speed = 80 + Math.random() * 180;
    particles.push({
      x,
      y,
      vx: Math.cos(direction) * speed,
      vy: Math.sin(direction) * speed - 80,
      size: 2 + Math.random() * 2.5,
      color,
      life: 1,
    });
  }
}

function addPopup(x, y, text, color) {
  popups.push({ x, y: y - 10, text, color, life: 1 });
}


/* 7. DRAWING EVERY FRAME ---------------------------------------- */

function draw() {
  // Start fresh: scale for sharp screens, then paint the background
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, width, height);

  // Shake the whole picture when a test breaks
  if (game.shake > 0 && !reducedMotion.matches) {
    const power = game.shake * 14;
    ctx.translate((Math.random() - 0.5) * power, (Math.random() - 0.5) * power);
  }

  ctx.drawImage(codeLayer, 0, 0, width, height);

  // A red flash over the production zone when a test breaks
  if (game.shake > 0) {
    ctx.fillStyle = `rgba(255, 107, 107, ${game.shake * 0.6})`;
    ctx.fillRect(0, height - RULES.productionHeight, width, RULES.productionHeight);
  }

  // Paint from back to front: things painted later appear on top
  splats.forEach(drawSplat);
  ripples.forEach(drawRipple);
  bugs.forEach((bug) => drawBug(ctx, bug));
  bugs.filter((bug) => bug.kind === "feature").forEach(drawFeatureTag);
  particles.forEach(drawParticle);
  popups.forEach(drawPopup);
  ctx.globalAlpha = 1;
}

// Paints the background code and the production zone onto the hidden canvas
function drawCodeLayer() {
  codeLayer.width = canvas.width;
  codeLayer.height = canvas.height;
  const c = codeLayer.getContext("2d");
  c.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  c.fillStyle = COLORS.background;
  c.fillRect(0, 0, width, height);

  // Lines of code, with a line number on each
  c.font = '13px "JetBrains Mono", ui-monospace, monospace';
  c.textBaseline = "middle";
  c.globalAlpha = 0.45;
  const lineHeight = 24;
  const keywords = ["const", "let", "function", "return", "if", "while", "true"];

  for (let i = 0; i * lineHeight < height; i++) {
    const y = 18 + i * lineHeight;
    c.textAlign = "right";
    c.fillStyle = COLORS.lineNumber;
    c.fillText(String(i + 1), 40, y);

    // Split the line into pieces so each piece can get its own color
    c.textAlign = "left";
    const line = BACKGROUND_CODE[i % BACKGROUND_CODE.length];
    const pieces = line.split(/(\/\/.*$|"[^"]*"|\b(?:const|let|function|return|if|while|true)\b)/);
    let x = 58;
    for (const piece of pieces) {
      if (!piece) continue;
      if (piece.startsWith("//")) c.fillStyle = COLORS.comment;
      else if (piece.startsWith('"')) c.fillStyle = COLORS.string;
      else if (keywords.includes(piece)) c.fillStyle = COLORS.keyword;
      else c.fillStyle = COLORS.code;
      c.fillText(piece, x, y);
      x += c.measureText(piece).width;
    }
  }

  // The production zone: red warning stripes at the bottom
  const top = height - RULES.productionHeight;
  c.globalAlpha = 1;
  c.fillStyle = "rgba(255, 107, 107, 0.08)";
  c.fillRect(0, top, width, RULES.productionHeight);

  c.save();
  c.beginPath();
  c.rect(0, top, width, RULES.productionHeight);
  c.clip(); // only paint inside the zone
  c.strokeStyle = "rgba(255, 107, 107, 0.16)";
  c.lineWidth = 8;
  for (let x = -RULES.productionHeight; x < width + RULES.productionHeight; x += 24) {
    c.beginPath();
    c.moveTo(x, height);
    c.lineTo(x + RULES.productionHeight, top);
    c.stroke();
  }
  c.restore();

  c.strokeStyle = COLORS.danger;
  c.lineWidth = 2;
  c.setLineDash([8, 6]);
  c.beginPath();
  c.moveTo(0, top);
  c.lineTo(width, top);
  c.stroke();
  c.setLineDash([]);

  const label = "PRODUCTION · don't let bugs get here";
  c.font = '600 12px "JetBrains Mono", ui-monospace, monospace';
  const labelWidth = c.measureText(label).width;
  c.fillStyle = COLORS.background;
  c.fillRect(10, top + RULES.productionHeight / 2 - 11, labelWidth + 14, 22);
  c.fillStyle = COLORS.danger;
  c.fillText(label, 17, top + RULES.productionHeight / 2 + 1);
}

// Draws one bug. "c" is the paintbrush to use, so the same function
// can draw on the game canvas and on the little legend pictures.
function drawBug(c, bug) {
  const s = bug.size;
  const look = LOOKS[bug.kind];

  c.save();
  c.translate(bug.x, bug.y); // move the paintbrush to the bug...
  c.rotate(bug.angle);       // ...and turn it the way the bug faces
  // From here on, (0, 0) is the middle of the bug and its head points right.

  // Shadow
  c.fillStyle = "rgba(0, 0, 0, 0.35)";
  c.beginPath();
  c.ellipse(2, 3, s * 0.62, s * 0.46, 0, 0, Math.PI * 2);
  c.fill();

  // Six legs, three on each side, swinging back and forth
  c.strokeStyle = look.legs;
  c.lineWidth = Math.max(1.5, s * 0.08);
  c.lineCap = "round";
  c.lineJoin = "round";
  for (let i = 0; i < 3; i++) {
    const legX = (i - 1) * s * 0.3;
    for (const side of [-1, 1]) {
      const swing = Math.sin(bug.legs + i * 2.1 + (side > 0 ? Math.PI : 0)) * s * 0.14;
      c.beginPath();
      c.moveTo(legX, 0);
      c.lineTo(legX + swing, side * s * 0.55);
      c.lineTo(legX + swing * 1.4 + (i - 1) * s * 0.14, side * s * 0.8);
      c.stroke();
    }
  }

  // Antennae
  c.lineWidth = Math.max(1.2, s * 0.06);
  for (const side of [-1, 1]) {
    c.beginPath();
    c.moveTo(s * 0.62, side * s * 0.08);
    c.quadraticCurveTo(s * 0.95, side * s * 0.15, s * 1.05, side * s * 0.4);
    c.stroke();
  }

  // Head
  c.fillStyle = look.dark;
  c.beginPath();
  c.arc(s * 0.58, 0, s * 0.24, 0, Math.PI * 2);
  c.fill();

  // Shell (golden bugs glow)
  if (bug.kind === "golden") {
    c.shadowColor = look.shell;
    c.shadowBlur = 18;
  }
  c.fillStyle = look.shell;
  c.beginPath();
  c.ellipse(0, 0, s * 0.56, s * 0.43, 0, 0, Math.PI * 2);
  c.fill();
  c.shadowBlur = 0;

  // The line down the middle of the shell, and some spots
  c.strokeStyle = look.dark;
  c.lineWidth = Math.max(1, s * 0.05);
  c.beginPath();
  c.moveTo(-s * 0.52, 0);
  c.lineTo(s * 0.45, 0);
  c.stroke();

  c.fillStyle = look.dark;
  for (const [spotX, spotY, spotR] of [[-0.2, 0.2, 0.085], [0.14, 0.18, 0.07], [-0.2, -0.2, 0.085], [0.14, -0.18, 0.07]]) {
    c.beginPath();
    c.arc(spotX * s, spotY * s, spotR * s, 0, Math.PI * 2);
    c.fill();
  }

  // A shiny highlight
  c.fillStyle = "rgba(255, 255, 255, 0.35)";
  c.beginPath();
  c.ellipse(s * 0.15, -s * 0.24, s * 0.16, s * 0.06, 0, 0, Math.PI * 2);
  c.fill();

  c.restore();
}

// A little "feature" name tag floating above each feature
function drawFeatureTag(bug) {
  const label = "feature";
  ctx.font = '600 10px "JetBrains Mono", ui-monospace, monospace';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const tagWidth = ctx.measureText(label).width + 12;
  const tagTop = bug.y - bug.size - 22;
  ctx.fillStyle = LOOKS.feature.dark;
  ctx.fillRect(bug.x - tagWidth / 2, tagTop, tagWidth, 16);
  ctx.fillStyle = "#effcf8";
  ctx.fillText(label, bug.x, tagTop + 8.5);
}

function drawSplat(splat) {
  ctx.globalAlpha = Math.min(1, splat.life * 1.5) * 0.85;
  ctx.fillStyle = splat.look.goo;
  ctx.beginPath();
  ctx.arc(splat.x, splat.y, splat.size * 0.45, 0, Math.PI * 2);
  ctx.fill();
  for (const drop of splat.drops) {
    ctx.beginPath();
    ctx.arc(splat.x + drop.x, splat.y + drop.y, drop.r, 0, Math.PI * 2);
    ctx.fill();
  }
  // The flattened bug in the middle
  ctx.fillStyle = splat.look.dark;
  ctx.beginPath();
  ctx.ellipse(splat.x, splat.y, splat.size * 0.5, splat.size * 0.2, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawRipple(ripple) {
  ctx.globalAlpha = ripple.life * 0.6;
  ctx.strokeStyle = COLORS.text;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(ripple.x, ripple.y, 6 + (1 - ripple.life) * 22, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawParticle(bit) {
  ctx.globalAlpha = Math.max(0, bit.life);
  ctx.fillStyle = bit.color;
  ctx.beginPath();
  ctx.arc(bit.x, bit.y, bit.size, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawPopup(popup) {
  ctx.globalAlpha = Math.max(0, popup.life);
  ctx.font = '800 20px "Bricolage Grotesque", system-ui, sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 4;
  ctx.strokeStyle = COLORS.background; // dark outline so it's readable on anything
  ctx.strokeText(popup.text, popup.x, popup.y);
  ctx.fillStyle = popup.color;
  ctx.fillText(popup.text, popup.x, popup.y);
  ctx.globalAlpha = 1;
}


/* 8. SCOREBOARD AND SCREENS -------------------------------------- */

const scoreText = document.querySelector("#score");
const comboText = document.querySelector("#combo");
const versionText = document.querySelector("#version");
const testsBox = document.querySelector("#tests");
const testsText = document.querySelector("#tests-text");
const pauseButton = document.querySelector("#pause-button");
const soundButton = document.querySelector("#sound-button");
const toast = document.querySelector("#toast");

const screens = {
  title: document.querySelector("#screen-title"),
  paused: document.querySelector("#screen-paused"),
  over: document.querySelector("#screen-over"),
};

/* WORKOUT POWER-UPS (from my Level Up page)
   Level Up links here with "#powerups-3" or "#powerups-3-spray": that's
   3 extra tests, plus a can of bug spray. On my github.io site, both pages
   share the browser's storage, so this can also count Level Up's workouts
   from the last 7 days by itself.                                      */
function readPowerUps() {
  const match = location.hash.match(/^#powerups-(\d)(-spray)?$/);
  if (match) return { lives: Math.min(5, Number(match[1])), spray: Boolean(match[2]) };
  try {
    const done = JSON.parse(localStorage.getItem("levelUp.done") || "[]");
    let workouts = 0;
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
      if (done.includes(key) && day.getDay() !== 0) workouts += 1; // Sundays are rest days
    }
    return { lives: Math.min(5, workouts), spray: workouts >= 3 };
  } catch (error) {
    return { lives: 0, spray: false };
  }
}

const POWER = readPowerUps();
const TOTAL_TESTS = RULES.startingTests + POWER.lives;
game.tests = TOTAL_TESTS;

// One dot on the scoreboard for each test
const testDots = [];
if (TOTAL_TESTS > 4) testsBox.classList.add("tests--many"); // two neat rows
for (let i = 0; i < TOTAL_TESTS; i++) {
  const dot = document.createElement("span");
  dot.className = "test-dot";
  dot.setAttribute("aria-hidden", "true");
  testsBox.append(dot);
  testDots.push(dot);
}

function versionName() {
  return `v${1 + Math.floor(game.version / 10)}.${game.version % 10}`;
}

let shownScore = 0;

function updateScoreboard() {
  scoreText.textContent = game.score.toLocaleString();
  if (game.score !== shownScore) {
    // Restart the "bump" animation. Reading offsetWidth forces the browser
    // to notice the class was removed before we add it back.
    scoreText.classList.remove("bump");
    void scoreText.offsetWidth;
    scoreText.classList.add("bump");
    shownScore = game.score;
  }

  const combo = comboMultiplier();
  comboText.textContent = `×${combo}`;
  comboText.classList.toggle("is-hot", combo > 1);
  versionText.textContent = versionName();

  testDots.forEach((dot, i) => dot.classList.toggle("is-broken", i >= game.tests));
  testsText.textContent = `${game.tests} of ${TOTAL_TESTS} passing`;
}

// Show one screen (or none, with null) and hide the others
function showScreen(name) {
  for (const [key, screen] of Object.entries(screens)) {
    screen.hidden = key !== name;
  }
  pauseButton.disabled = game.mode !== "playing" && game.mode !== "paused";
  updateSprayButton();
}

let toastTimer = null;

function showToast(message, mood = "") {
  toast.textContent = message;
  toast.className = `toast is-visible ${mood ? "is-" + mood : ""}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 1800);
}

function startGame() {
  startAudio();
  game.mode = "playing";
  game.score = 0;
  game.tests = TOTAL_TESTS;
  game.sprayUsed = false;
  game.streak = 0;
  game.squashed = 0;
  game.clicks = 0;
  game.time = 0;
  game.version = 0;
  game.spawnTimer = 0.6;
  bugs = [];
  splats = [];
  showScreen(null);
  updateScoreboard();
  showToast("Squash the bugs! Leave the features alone.");
}

function pauseGame() {
  if (game.mode !== "playing") return;
  game.mode = "paused";
  pauseButton.setAttribute("aria-label", "Resume");
  showScreen("paused");
  document.querySelector("#resume-button").focus();
}

function resumeGame() {
  if (game.mode !== "paused") return;
  game.mode = "playing";
  pauseButton.setAttribute("aria-label", "Pause");
  showScreen(null);
}

function rankFor(score) {
  if (score >= 2000) return "10x engineer";
  if (score >= 1000) return "Bug whisperer";
  if (score >= 500) return "Senior developer";
  if (score >= 200) return "Junior developer";
  return "Intern";
}

function endGame() {
  game.mode = "over";
  game.spawnTimer = 1;

  const isNewBest = game.score > game.best;
  if (isNewBest) {
    game.best = game.score;
    save("bugBashBest", game.best);
  }

  const accuracy = game.clicks > 0 ? Math.round((game.squashed / game.clicks) * 100) : 0;
  document.querySelector("#final-score").textContent = game.score.toLocaleString();
  document.querySelector("#final-squashed").textContent = game.squashed;
  document.querySelector("#final-accuracy").textContent = `${accuracy}%`;
  document.querySelector("#final-version").textContent = versionName();
  document.querySelector("#final-rank").textContent = rankFor(game.score);
  document.querySelector("#new-best").hidden = !isNewBest;
  document.querySelector("#best-score").textContent = game.best.toLocaleString();

  showScreen("over");
  document.querySelector("#again-button").focus();
}

// Buttons
document.querySelector("#start-button").addEventListener("click", startGame);
document.querySelector("#again-button").addEventListener("click", startGame);
document.querySelector("#resume-button").addEventListener("click", resumeGame);

pauseButton.addEventListener("click", () => {
  if (game.mode === "playing") pauseGame();
  else resumeGame();
});

function showSoundSetting() {
  soundButton.setAttribute("aria-pressed", String(soundOn));
  // .toggleAttribute adds the attribute if the second value is true, removes it if false
  soundButton.querySelector(".icon-sound-on").toggleAttribute("hidden", !soundOn);
  soundButton.querySelector(".icon-sound-off").toggleAttribute("hidden", soundOn);
}

soundButton.addEventListener("click", () => {
  soundOn = !soundOn;
  save("bugBashSound", soundOn ? "on" : "off");
  showSoundSetting();
  if (soundOn) {
    startAudio();
    sounds.combo();
  }
});

// BUG SPRAY: a power-up from Level Up. Once a game, it squashes every
// bug on the screen, but never a feature (the spray knows they aren't bugs!)
const sprayButton = document.querySelector("#spray-button");

function updateSprayButton() {
  sprayButton.hidden = !POWER.spray;
  sprayButton.disabled = game.mode !== "playing" || Boolean(game.sprayUsed);
}

function useSpray() {
  if (!POWER.spray || game.mode !== "playing" || game.sprayUsed) return;
  game.sprayUsed = true;
  let count = 0;
  for (const bug of [...bugs]) {
    if (bug.kind === "feature") continue;
    bugs.splice(bugs.indexOf(bug), 1);
    addSplat(bug);
    addBurst(bug.x, bug.y, LOOKS[bug.kind].goo);
    game.score += bug.kind === "golden" ? RULES.goldenPoints : RULES.bugPoints;
    count += 1;
  }
  sounds.levelUp();
  showToast(count > 0 ? `Bug spray! ${count} ${count === 1 ? "bug" : "bugs"} squashed.` : "Bug spray! (No bugs around.)", "good");
  updateSprayButton();
  updateScoreboard();
}

sprayButton.addEventListener("click", useSpray);

// Keyboard shortcuts: P or Escape pauses, Enter starts a game, S sprays
document.addEventListener("keydown", (event) => {
  if (event.key === "s" || event.key === "S") useSpray();
  if (event.key === "p" || event.key === "P" || event.key === "Escape") {
    if (game.mode === "playing") pauseGame();
    else if (game.mode === "paused") resumeGame();
  }
  const onAButton = event.target.closest && event.target.closest("button, a");
  if (event.key === "Enter" && !onAButton && (game.mode === "title" || game.mode === "over")) {
    startGame();
  }
});

// Pause automatically if you switch to another tab mid-game
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pauseGame();
});


/* 9. STARTING EVERYTHING UP, AND THE GAME LOOP -------------------- */

// Draw a bug on each little legend picture on the title screen
function drawLegend() {
  document.querySelectorAll(".legend__icon").forEach((icon) => {
    const size = 44;
    icon.width = size * pixelRatio;
    icon.height = size * pixelRatio;
    const c = icon.getContext("2d");
    c.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    drawBug(c, { kind: icon.dataset.kind, x: 22, y: 25, size: 19, angle: -Math.PI / 2, legs: 0.8 });
  });
}

resize();
drawLegend();

// Redraw when the window changes size (or a phone turns sideways)
if (window.ResizeObserver) {
  new ResizeObserver(resize).observe(arena);
} else {
  window.addEventListener("resize", resize);
}

// Fonts load a moment after the page. Repaint the background code once they're ready.
if (document.fonts) document.fonts.ready.then(drawCodeLayer);

// Some bugs to wander around the title screen
for (let i = 0; i < 7; i++) {
  const kind = i === 2 ? "golden" : i === 5 ? "feature" : "bug";
  const x = 60 + Math.random() * Math.max(1, width - 120);
  const y = 60 + Math.random() * Math.max(1, height - 160);
  bugs.push(makeBug(kind, x, y, Math.random() * Math.PI * 2));
}

document.querySelector("#best-score").textContent = game.best.toLocaleString();
document.querySelector("#tests-total").textContent = TOTAL_TESTS;
if (POWER.lives > 0) {
  const note = document.querySelector("#powerup-note");
  note.textContent = `💪 Workout power-ups from Level Up: +${POWER.lives} extra ${POWER.lives === 1 ? "test" : "tests"}${POWER.spray ? ", plus bug spray (press S or tap 🧴, once a game)" : ""}!`;
  note.hidden = false;
}
showSoundSetting();
updateScoreboard();
showScreen("title");

// THE GAME LOOP. requestAnimationFrame asks the browser to call loop()
// right before it paints the next frame, about 60 times a second.
let lastTime = performance.now();

function loop(now) {
  // How many seconds since the last frame? (Capped, so a slow frame
  // doesn't make the bugs jump across the screen.)
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  update(dt);
  draw();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
