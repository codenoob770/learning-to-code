/* =============================================================
   arcade.js: the Arcade games
   -------------------------------------------------------------
   1. Card deck workout: flip a card, do the move. The suit picks
      the move and the number picks how many.
   2. Kick Caller: the coach shouts kicks at random times, and you
      do them as fast as you can.
   3. Spin the wheel: one spin a day, for a surprise challenge.

   Finished games go in the activity log (app.js), so they earn XP
   and hit the weekly boss.

   This file loads before app.js, so it only uses app.js's
   functions inside its own functions, never right away.
   ============================================================= */


/* 1. CARD DECK WORKOUT ------------------------------------------------ */

const DECK_SUITS = [
  { suit: "♥", move: "jumping jacks", demo: "jacks", red: true },
  { suit: "♦", move: "squats", demo: "squat", red: true },
  { suit: "♣", move: "curl-ups", demo: "curlup", red: false },
  { suit: "♠", move: "push-ups", demo: "pushup", red: false },
];

// Number cards are worth their number, face cards 10, and aces 11!
const DECK_RANKS = [["A", 11], ["2", 2], ["3", 3], ["4", 4], ["5", 5], ["6", 6], ["7", 7], ["8", 8], ["9", 9], ["10", 10], ["J", 10], ["Q", 10], ["K", 10]];

const DECK_SIZES = {
  mini: { name: "Mini", cards: 12, xp: 40 },
  half: { name: "Half deck", cards: 26, xp: 80 },
  full: { name: "Full deck", cards: 52, xp: 160 },
};

let deckSize = "mini"; // the size you picked
let deck = null;       // the game you're playing, or null
let deckEnd = null;    // the "Deck done!" screen, until you tap Play again
let deckClock = null;  // updates the time every second

function deckArea() {
  return document.querySelector("#deck-area");
}

function bestDeckTime(size) {
  const times = logOf("deck").filter((e) => e.size === size).map((e) => e.secs);
  return times.length ? Math.min(...times) : null;
}

function renderDeck() {
  if (deck) return; // don't interrupt a game
  if (deckEnd) {
    deckArea().innerHTML = deckEnd;
    return;
  }
  const bests = Object.entries(DECK_SIZES).map(([size, info]) => {
    const best = bestDeckTime(size);
    return `${info.name}: ${best ? formatTime(best) : "–"}`;
  }).join(" · ");

  deckArea().innerHTML = `
    <p class="panel__lead">Flip a card, do the move. Race the clock to the bottom of the deck!</p>
    <ul class="deck-key">
      ${DECK_SUITS.map((s) => `<li><span class="deck-key__suit ${s.red ? "is-red" : ""}">${s.suit}</span> ${s.move}</li>`).join("")}
    </ul>
    <p class="deck-note">The number on the card is how many. Face cards are 10, and aces are 11!</p>
    <div class="picker" role="group" aria-label="Deck size">
      ${Object.entries(DECK_SIZES).map(([size, info]) => `
        <button class="pick" type="button" data-deck-size="${size}" aria-pressed="${size === deckSize}">${info.name} (${info.cards})</button>`).join("")}
    </div>
    <button class="button" type="button" data-deck="start">🃏 Shuffle and start</button>
    <p class="deck-best">Best times: ${bests}</p>`;
}

function startDeck() {
  // Make all 52 cards, shuffle them, and take as many as this size needs
  const cards = [];
  for (const suit of DECK_SUITS) {
    for (const [rank, value] of DECK_RANKS) cards.push({ ...suit, rank, value });
  }
  deck = {
    size: deckSize,
    cards: quizShuffle(cards).slice(0, DECK_SIZES[deckSize].cards), // quizShuffle is in quiz.js
    index: 0,
    reps: 0,
    started: Date.now(),
  };
  startAudio();
  keepScreenOn();
  drawDeckCard();
  clearInterval(deckClock);
  deckClock = setInterval(() => {
    const clock = deckArea().querySelector(".deck-time");
    if (clock && deck) clock.textContent = formatTime(Math.floor((Date.now() - deck.started) / 1000));
  }, 1000);
}

function drawDeckCard() {
  const card = deck.cards[deck.index];
  const seconds = Math.floor((Date.now() - deck.started) / 1000);
  deckArea().innerHTML = `
    <div class="deck-play">
      <div class="playing-card ${card.red ? "is-red" : ""}" aria-hidden="true">
        <span class="playing-card__corner">${card.rank}<br>${card.suit}</span>
        <span class="playing-card__suit">${card.suit}</span>
        <span class="playing-card__corner playing-card__corner--bottom">${card.rank}<br>${card.suit}</span>
      </div>
      <div class="deck-info">
        <p class="deck-count">Card ${deck.index + 1} of ${deck.cards.length} · ⏱ <span class="deck-time">${formatTime(seconds)}</span></p>
        <p class="deck-move" aria-live="polite">${card.value} ${card.move}</p>
        <span class="deck-demo" data-deck-demo="${card.demo}"></span>
        <div class="deck-buttons">
          <button class="button" type="button" data-deck="next">${deck.index === deck.cards.length - 1 ? "Done! Finish" : "Done! Next card →"}</button>
          <button class="text-button" type="button" data-deck="quit">Quit</button>
        </div>
      </div>
    </div>`;
  const spot = deckArea().querySelector("[data-deck-demo]");
  const svg = createDemo(card.demo, "");
  svg.setAttribute("aria-hidden", "true");
  spot.replaceWith(svg);
  startDemoAnimation();
  deckArea().querySelector("[data-deck='next']").focus();
}

function finishDeck() {
  clearInterval(deckClock);
  const secs = Math.max(1, Math.round((Date.now() - deck.started) / 1000));
  const best = bestDeckTime(deck.size);
  const xpBefore = trophyStats().xp;
  logActivity("deck", { size: deck.size, reps: deck.reps, secs });
  const xpGained = trophyStats().xp - xpBefore;
  const info = DECK_SIZES[deck.size];

  deckEnd = `
    <div class="arcade-end">
      <p class="arcade-end__big">🃏 Deck done!</p>
      <p>${info.name}: ${deck.cards.length} cards, ${deck.reps} reps in <strong>${formatTime(secs)}</strong>.</p>
      ${best === null || secs < best ? `<p class="arcade-end__best">🏆 New best time!</p>` : `<p>Your best is ${formatTime(best)}.</p>`}
      <p class="arcade-end__xp">${xpGained > 0 ? `+${xpGained} XP` : "No more deck XP today (3 games a day), but great workout!"}</p>
      <button class="button" type="button" data-deck="again">Play again</button>
    </div>`;
  deck = null;
  letScreenSleep();
  sounds.finish();
  render(); // redraws everything, including the "Deck done!" screen
  deckArea().querySelector("[data-deck='again']").focus();
  checkAchievements(true);
}

document.querySelector("#deck-area").addEventListener("click", (event) => {
  const sizeButton = event.target.closest("[data-deck-size]");
  if (sizeButton) {
    deckSize = sizeButton.dataset.deckSize;
    renderDeck();
    deckArea().querySelector(`[data-deck-size="${deckSize}"]`).focus();
    return;
  }
  const button = event.target.closest("[data-deck]");
  if (!button) return;
  const action = button.dataset.deck;
  if (action === "start") startDeck();
  if (action === "next" && deck) {
    deck.reps += deck.cards[deck.index].value;
    deck.index += 1;
    sounds.count();
    if (deck.index >= deck.cards.length) finishDeck();
    else drawDeckCard();
  }
  if (action === "quit") {
    clearInterval(deckClock);
    deck = null;
    letScreenSleep();
    renderDeck();
    showToast("Deck put away. Come back anytime!");
  }
  if (action === "again") {
    deckEnd = null;
    renderDeck();
    deckArea().querySelector("[data-deck='start']").focus();
  }
});


/* 2. KICK CALLER ------------------------------------------------------- */

const KICK_CALLS = [
  { text: "Front kick", sided: true },
  { text: "Roundhouse", sided: true },
  { text: "Side kick", sided: true },
  { text: "Back kick", sided: true },
  { text: "Axe kick", sided: true },
  { text: "Crescent kick", sided: true },
  { text: "Double roundhouse", sided: true },
  { text: "Push kick", sided: true },
  { text: "Knee strike", sided: true },
  { text: "Jab, cross!", sided: false },
  { text: "Block!", sided: false },
  { text: "Switch stance!", sided: false },
];

// How long between calls, in milliseconds: [shortest, longest]
const KICK_SPEEDS = {
  slow: { name: "Slow", gap: [3000, 4200] },
  medium: { name: "Medium", gap: [2000, 3000] },
  fast: { name: "Fast", gap: [1300, 2000] },
};

let kickLength = 60;     // seconds in a round
let kickSpeed = "medium";
let kicks = null;        // the round you're in, or null
let kicksEnd = null;     // the "Time!" screen, until you tap Play again

function kicksArea() {
  return document.querySelector("#kicks-area");
}

function renderKicks() {
  if (kicks) return; // don't interrupt a round
  if (kicksEnd) {
    kicksArea().innerHTML = kicksEnd;
    return;
  }
  const best = Math.max(0, ...logOf("kicks").map((e) => e.n));
  kicksArea().innerHTML = `
    <p class="panel__lead">The coach calls out kicks at random times. Do each one as fast as you can, with good form!</p>
    <p class="deck-note">⚠️ Clear lots of space around you, and kick the air, not people or walls!</p>
    <div class="picker" role="group" aria-label="Round length">
      ${[30, 60, 90].map((s) => `<button class="pick" type="button" data-kick-length="${s}" aria-pressed="${s === kickLength}">${s} sec</button>`).join("")}
    </div>
    <div class="picker" role="group" aria-label="Speed">
      ${Object.entries(KICK_SPEEDS).map(([id, speed]) => `<button class="pick" type="button" data-kick-speed="${id}" aria-pressed="${id === kickSpeed}">${speed.name}</button>`).join("")}
    </div>
    <button class="button" type="button" data-kicks="start">🥋 Start</button>
    <p class="deck-best">${best ? `Most moves in a round: ${best}` : "Turn your sound on: the coach says each kick out loud!"}</p>`;
}

function startKicks() {
  startAudio();
  keepScreenOn();
  coachVoiceOn = load("levelUp.voice", "on") === "on"; // the coach's voice (coach.js) calls the kicks
  kicks = { calls: 0, lastCall: null, countdown: 3, endsAt: 0, nextAt: 0, interval: null };
  kicksArea().innerHTML = `
    <div class="kick-play">
      <p class="kick-call" aria-live="assertive">Get ready...</p>
      <p class="kick-side"></p>
      <div class="kick-bar"><div class="kick-bar__fill"></div></div>
      <p class="kick-status"><span class="kick-time">${formatTime(kickLength)}</span> · Moves: <span class="kick-count">0</span></p>
      <button class="button button--quiet" type="button" data-kicks="stop">Stop</button>
    </div>`;
  kicksArea().querySelector("[data-kicks='stop']").focus();

  // 3, 2, 1, go!
  sounds.count();
  kicksArea().querySelector(".kick-call").textContent = "3";
  let count = 3;
  kicks.interval = setInterval(() => {
    count -= 1;
    if (!kicks) return;
    if (count > 0) {
      kicksArea().querySelector(".kick-call").textContent = String(count);
      sounds.count();
      return;
    }
    clearInterval(kicks.interval);
    kicks.endsAt = Date.now() + kickLength * 1000;
    kicks.nextAt = Date.now();
    kicks.interval = setInterval(kickTick, 100);
  }, 1000);
}

function kickTick() {
  if (!kicks) return;
  const now = Date.now();
  const left = Math.max(0, kicks.endsAt - now);
  kicksArea().querySelector(".kick-time").textContent = formatTime(Math.ceil(left / 1000));
  kicksArea().querySelector(".kick-bar__fill").style.width = `${(left / (kickLength * 1000)) * 100}%`;

  if (left <= 0) {
    finishKicks();
    return;
  }
  if (now >= kicks.nextAt) {
    // Pick a call (never the same one twice in a row)
    let call;
    do call = KICK_CALLS[Math.floor(Math.random() * KICK_CALLS.length)]; while (call === kicks.lastCall);
    kicks.lastCall = call;
    const side = call.sided ? (Math.random() < 0.5 ? "Left" : "Right") : "";
    kicks.calls += 1;

    const callBox = kicksArea().querySelector(".kick-call");
    callBox.textContent = call.text;
    callBox.classList.remove("is-new");
    void callBox.offsetWidth; // restart the pop animation
    callBox.classList.add("is-new");
    kicksArea().querySelector(".kick-side").textContent = side ? `${side} leg` : "";
    kicksArea().querySelector(".kick-side").dataset.side = side.toLowerCase();
    kicksArea().querySelector(".kick-count").textContent = kicks.calls;
    sounds.up();
    say(side ? `${call.text}, ${side.toLowerCase()}` : call.text); // in coach.js

    const [shortest, longest] = KICK_SPEEDS[kickSpeed].gap;
    kicks.nextAt = now + shortest + Math.random() * (longest - shortest);
  }
}

function finishKicks() {
  clearInterval(kicks.interval);
  const moves = kicks.calls;
  const best = Math.max(0, ...logOf("kicks").map((e) => e.n));
  const xpBefore = trophyStats().xp;
  if (moves > 0) logActivity("kicks", { n: moves, secs: kickLength, reps: moves });
  const xpGained = trophyStats().xp - xpBefore;
  kicks = null;
  letScreenSleep();
  sounds.finish();
  say("Time! Great job!");

  kicksEnd = `
    <div class="arcade-end">
      <p class="arcade-end__big">🥋 Time!</p>
      <p><strong>${moves}</strong> ${moves === 1 ? "move" : "moves"} in ${kickLength} seconds (${KICK_SPEEDS[kickSpeed].name.toLowerCase()}).</p>
      ${moves > best ? `<p class="arcade-end__best">🏆 New record!</p>` : `<p>Your record is ${best}.</p>`}
      <p class="arcade-end__xp">${xpGained > 0 ? `+${xpGained} XP` : "No more Kick Caller XP today (3 rounds a day), but nice kicks!"}</p>
      <button class="button" type="button" data-kicks="again">Play again</button>
    </div>`;
  render(); // redraws everything, including the "Time!" screen
  kicksArea().querySelector("[data-kicks='again']").focus();
  checkAchievements(true);
}

document.querySelector("#kicks-area").addEventListener("click", (event) => {
  const lengthButton = event.target.closest("[data-kick-length]");
  const speedButton = event.target.closest("[data-kick-speed]");
  if (lengthButton) kickLength = Number(lengthButton.dataset.kickLength);
  if (speedButton) kickSpeed = speedButton.dataset.kickSpeed;
  if (lengthButton || speedButton) {
    renderKicks();
    const selector = lengthButton ? `[data-kick-length="${kickLength}"]` : `[data-kick-speed="${kickSpeed}"]`;
    kicksArea().querySelector(selector).focus();
    return;
  }
  const button = event.target.closest("[data-kicks]");
  if (!button) return;
  if (button.dataset.kicks === "start") startKicks();
  if (button.dataset.kicks === "stop" && kicks) {
    clearInterval(kicks.interval);
    kicks = null;
    stopTalking();
    letScreenSleep();
    renderKicks();
    showToast("Round stopped.");
  }
  if (button.dataset.kicks === "again") {
    kicksEnd = null;
    renderKicks();
    kicksArea().querySelector("[data-kicks='start']").focus();
  }
});


/* 3. SPIN THE WHEEL --------------------------------------------------- */

const WHEEL = [
  { icon: "⭐", text: "30 jumping jacks", reps: 30 },
  { icon: "🦵", text: "20 squats", reps: 20 },
  { icon: "🛡️", text: "15 curl-ups", reps: 15 },
  { icon: "💪", text: "10 push-ups", reps: 10 },
  { icon: "🔥", text: "30 high knees", reps: 30 },
  { icon: "🕺", text: "Dance party: dance through one whole song!", reps: 30 },
  { icon: "🦩", text: "Balance on one foot for 30 seconds, each foot", reps: 30 },
  { icon: "⏱️", text: "30-second plank", reps: 15 },
];

const WHEEL_COLORS = ["var(--bug)", "var(--teal)", "var(--accent)", "var(--marker)"];
let wheelSpinning = false;

// The wheel, drawn as an SVG: 8 slices, each with an emoji
function wheelSVG(rotation) {
  const slice = 360 / WHEEL.length;
  const point = (angle, radius) => {
    const radians = ((angle - 90) * Math.PI) / 180; // 0 degrees = straight up
    return [100 + radius * Math.cos(radians), 100 + radius * Math.sin(radians)];
  };
  const slices = WHEEL.map((item, i) => {
    const [x1, y1] = point(i * slice, 92);
    const [x2, y2] = point((i + 1) * slice, 92);
    const [tx, ty] = point((i + 0.5) * slice, 62);
    return `
      <path d="M100 100 L${x1.toFixed(1)} ${y1.toFixed(1)} A92 92 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z" style="fill: ${WHEEL_COLORS[i % WHEEL_COLORS.length]}" class="wheel__slice"/>
      <text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" class="wheel__icon">${item.icon}</text>`;
  }).join("");
  return `
    <div class="wheel">
      <svg class="wheel__pointer" viewBox="0 0 20 20" aria-hidden="true"><path d="M2 2 H18 L10 18 Z"/></svg>
      <svg class="wheel__disc" viewBox="0 0 200 200" aria-hidden="true" style="transform: rotate(${rotation}deg)">
        <circle cx="100" cy="100" r="96" class="wheel__rim"/>
        ${slices}
        <circle cx="100" cy="100" r="12" class="wheel__hub"/>
      </svg>
    </div>`;
}

// How far to turn the wheel so slice i ends up under the pointer
function wheelRotation(i, extraTurns = 0) {
  const slice = 360 / WHEEL.length;
  return extraTurns * 360 - (i + 0.5) * slice;
}

function renderSpin() {
  if (wheelSpinning) return;
  const spin = spinData[toKey(today)];
  const area = document.querySelector("#spin-area");
  if (!spin) {
    area.innerHTML = `
      ${wheelSVG(0)}
      <p class="spin-text">One spin a day for a surprise challenge!</p>
      <button class="button" type="button" data-spin="go">🎡 Spin!</button>`;
    return;
  }
  const item = WHEEL[spin.i];
  area.innerHTML = `
    ${wheelSVG(wheelRotation(spin.i))}
    <p class="spin-result">${item.icon} ${item.text}</p>
    ${spin.done
      ? `<p class="spin-text">✓ Done! New spin tomorrow.</p>`
      : `<button class="button" type="button" data-spin="did">I did it ✓</button>`}`;
}

document.querySelector("#spin-area").addEventListener("click", (event) => {
  const button = event.target.closest("[data-spin]");
  if (!button) return;
  const key = toKey(today);

  if (button.dataset.spin === "go" && !spinData[key] && !wheelSpinning) {
    const i = Math.floor(Math.random() * WHEEL.length);
    spinData[key] = { i, done: false };
    saveJSON("levelUp.spins", spinData);
    startAudio();

    // Spin! 5 full turns, landing on the slice (with a little wobble so it looks real)
    wheelSpinning = true;
    const disc = document.querySelector("#spin-area .wheel__disc");
    const wobble = (Math.random() - 0.5) * (360 / WHEEL.length) * 0.6;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    disc.style.transition = reduceMotion ? "none" : "transform 3.6s cubic-bezier(0.15, 0.85, 0.25, 1)";
    disc.style.transform = `rotate(${wheelRotation(i, 5) + wobble}deg)`;
    button.disabled = true;
    let ticks = 0;
    const clicker = setInterval(() => {
      sounds.count();
      ticks += 1;
      if (ticks > 14) clearInterval(clicker);
    }, 230);
    setTimeout(() => {
      clearInterval(clicker);
      wheelSpinning = false;
      sounds.finish();
      renderSpin();
      document.querySelector("#spin-area [data-spin='did']")?.focus();
    }, reduceMotion ? 300 : 3800);
  }

  if (button.dataset.spin === "did" && spinData[key] && !spinData[key].done) {
    spinData[key].done = true;
    saveJSON("levelUp.spins", spinData);
    logActivity("spin", { reps: WHEEL[spinData[key].i].reps });
    sounds.done();
    showToast(`Challenge complete! +${XP_RULES.spin} XP 🎡`);
    render();
    checkAchievements(true);
  }
});

function renderArcade() {
  renderDeck();
  renderKicks();
  renderSpin();
}
