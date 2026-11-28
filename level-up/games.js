/* =============================================================
   games.js: more Arcade games
   -------------------------------------------------------------
   1. Shared bits
   2. Penalty Shootout
   3. Goalie Reflexes
   4. Board Break
   5. Memory Match
   6. The game list (what each game saves and how scores compare)
   7. Playing by yourself (the Arcade panels)
   8. Mystery Box
   9. Sister Duel (pass-and-play on one iPad)
   10. Plugging in (XP, badges, saved data: see hooks.js)

   Each game is a function like playShootout(box, options). It
   draws itself inside "box", and when the game is over it calls
   options.done(result). That way the same game works on its own
   AND in a Sister Duel. Each one gives back a stop() function, to
   end it early.

   This file loads before app.js, so it only uses app.js's
   functions inside its own functions, never right away.
   ============================================================= */


/* 1. SHARED BITS ---------------------------------------------------- */

// Goes 0 → 1 → 0 → 1... at a steady speed (for sliding arrows and meters)
function zigzag(t) {
  const part = t - Math.floor(t);
  return 1 - Math.abs(2 * part - 1);
}

function randomBetween(low, high) {
  return low + Math.random() * (high - low);
}

function noMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Workouts you finished this week (not rest days), for bonus shots
function workoutsThisWeek() {
  const monday = mondayOf(today);
  let count = 0;
  for (let i = 0; i < 7; i++) {
    const date = addDays(monday, i);
    if (doneDays.has(toKey(date)) && !isRestDay(date)) count += 1;
  }
  return count;
}


/* 2. PENALTY SHOOTOUT ------------------------------------------------
   First an arrow slides back and forth: tap to aim. Then the power
   bar slides: tap to shoot. Too soft and the goalie saves it easily.
   Too hard and it flies over the bar. The goalie dives a random way,
   but nobody can save a shot in the top corner!                    */

function playShootout(box, options) {
  const shots = options.shots || 5;
  const state = { shot: 0, goals: 0, marks: [], phase: "aim", t0: performance.now(), aim: 150, power: 0 };
  let frame = null;
  let stopped = false;
  const timers = [];

  const net = [];
  for (let x = 52; x < 260; x += 14) net.push(`M${x} 30 V128`);
  for (let y = 42; y < 128; y += 12) net.push(`M40 ${y} H260`);

  box.innerHTML = `
    <div class="game-play">
      <div class="quiz-top">
        <p class="quiz-where" data-shoot="where"></p>
        <p class="quiz-score" data-shoot="score"></p>
        ${options.quit || ""}
      </div>
      <div class="quiz-dots" data-shoot="dots" aria-hidden="true"></div>
      <svg class="shoot-field" viewBox="0 0 300 200" role="img" aria-label="A soccer goal with a goalie in front">
        <rect class="shoot-grass" x="0" y="128" width="300" height="72"/>
        <ellipse class="shoot-spot" cx="150" cy="186" rx="10" ry="3"/>
        <path class="shoot-net" d="${net.join(" ")}"/>
        <path class="shoot-frame" d="M40 129 V30 H260 V129"/>
        <g class="shoot-goalie" data-shoot="goalie">
          <circle cx="150" cy="74" r="8"/>
          <path d="M150 82 V106 M150 89 L128 78 M150 89 L172 78 M150 106 L139 127 M150 106 L161 127"/>
          <circle class="shoot-glove" cx="127" cy="77" r="4.5"/>
          <circle class="shoot-glove" cx="173" cy="77" r="4.5"/>
        </g>
        <line class="shoot-aim" data-shoot="aim" x1="150" y1="178" x2="150" y2="70"/>
        <circle class="shoot-ball" data-shoot="ball" cx="150" cy="182" r="8"/>
        <text class="shoot-call" data-shoot="call" x="150" y="112" text-anchor="middle"></text>
      </svg>
      <div class="power-meter" aria-hidden="true">
        <span class="power-meter__zone power-meter__zone--soft" style="left: 0; width: 30%"></span>
        <span class="power-meter__zone power-meter__zone--good" style="left: 30%; width: 58%"></span>
        <span class="power-meter__zone power-meter__zone--bad" style="left: 88%; width: 12%"></span>
        <span class="power-meter__needle" data-shoot="needle"></span>
      </div>
      <button class="button game-button" type="button" data-shoot="act"></button>
      <p class="game-help" data-shoot="help" aria-live="polite"></p>
    </div>`;

  const $ = (name) => box.querySelector(`[data-shoot="${name}"]`);

  function showTop() {
    $("where").textContent = `${options.who ? `${options.who} · ` : ""}Shot ${Math.min(state.shot + 1, shots)} of ${shots}`;
    $("score").textContent = `⚽ ${state.goals}`;
    $("dots").innerHTML = Array.from({ length: shots }, (_, i) => {
      const state2 = state.marks[i] ? `is-${state.marks[i]}` : i === state.shot ? "is-now" : "";
      return `<span class="quiz-dot ${state2}"></span>`;
    }).join("");
  }

  function getReady() {
    state.phase = "aim";
    state.t0 = performance.now();
    $("ball").setAttribute("cx", 150);
    $("ball").setAttribute("cy", 182);
    $("ball").setAttribute("r", 8);
    $("goalie").setAttribute("transform", "");
    $("call").textContent = "";
    $("call").setAttribute("class", "shoot-call");
    $("aim").style.display = "";
    $("needle").style.left = "0%";
    $("act").textContent = "🎯 Lock my aim";
    $("act").disabled = false;
    $("help").textContent = "Tap when the arrow points where you want to shoot.";
    showTop();
  }

  // Where the ball goes, and what happens
  function shotResult(x, y, power, dive) {
    if (power > 0.88) return { call: "Over the bar!", goal: false };
    if (x < 36 || x > 264) return { call: "Wide!", goal: false };
    if (x < 45 || x > 255) return { call: "Off the post! 😱", goal: false };
    const keeper = 150 + dive * 72; // where the goalie ends up
    const soft = power < 0.3;
    const topCorner = (x < 78 || x > 222) && y < 72;
    if (!topCorner && Math.abs(x - keeper) < (soft ? 75 : 42)) {
      return { call: soft ? "Too soft! Saved." : "SAVED!", goal: false };
    }
    return { call: topCorner ? "TOP CORNER! 🔥" : "GOAL!", goal: true };
  }

  function act() {
    if (stopped) return;
    if (state.phase === "aim") {
      state.phase = "power";
      state.t0 = performance.now();
      $("act").textContent = "⚡ Shoot!";
      $("help").textContent = "Tap to shoot! Green power is best. Red goes over the bar.";
    } else if (state.phase === "power") {
      kick();
    }
  }

  function kick() {
    state.phase = "flying";
    const roll = Math.random();
    const dive = roll < 0.38 ? -1 : roll < 0.62 ? 0 : 1;
    const x = state.aim;
    const y = 125 - state.power * 108;
    state.result = shotResult(x, y, state.power, dive);
    state.flight = {
      start: performance.now(),
      to: [x, state.power > 0.88 ? 8 : state.power < 0.3 ? 118 : y],
      dive,
      saved: !state.result.goal && /SAVED|soft/i.test(state.result.call),
    };
    $("aim").style.display = "none";
    $("act").disabled = true;
    $("help").textContent = "";
    startAudio();
    sounds.count();
  }

  function land() {
    const result = state.result;
    state.marks[state.shot] = result.goal ? "right" : "wrong";
    if (result.goal) {
      state.goals += 1;
      sounds.rate(10);
    } else {
      sounds.down();
    }
    $("call").textContent = result.call;
    $("call").setAttribute("class", `shoot-call ${result.goal ? "is-goal" : "is-miss"}`);
    state.phase = "result";
    state.shot += 1;
    showTop();
    timers.push(setTimeout(() => {
      if (stopped) return;
      if (state.shot >= shots) {
        state.phase = "over";
        cancelAnimationFrame(frame);
        options.done({ goals: state.goals, shots });
      } else {
        getReady();
      }
    }, 1300));
  }

  function loop(now) {
    if (stopped) return;
    const t = (now - state.t0) / 1000;
    if (state.phase === "aim") {
      state.aim = 15 + 270 * zigzag(t / 2.6); // a slow slide from side to side
      $("aim").setAttribute("x2", state.aim.toFixed(1));
    } else if (state.phase === "power") {
      state.power = zigzag(t / 1.5);
      $("needle").style.left = `${(state.power * 100).toFixed(1)}%`;
    } else if (state.phase === "flying") {
      const flight = state.flight;
      const p = Math.min(1, (now - flight.start) / 480);
      const ease = 1 - (1 - p) * (1 - p);
      const g = Math.min(1, (now - flight.start) / 380);
      $("ball").setAttribute("cx", (150 + (flight.to[0] - 150) * ease).toFixed(1));
      $("ball").setAttribute("cy", (182 + (flight.to[1] - 182) * ease).toFixed(1));
      $("ball").setAttribute("r", (8 - 3 * ease).toFixed(2));
      const dx = flight.dive * 72 * g;
      const dy = (flight.dive === 0 ? -10 : 8) * g;
      $("goalie").setAttribute("transform", `translate(${dx.toFixed(1)} ${dy.toFixed(1)}) rotate(${(flight.dive * 62 * g).toFixed(1)} 150 106)`);
      if (p >= 1) land();
    }
    frame = requestAnimationFrame(loop);
  }

  $("act").addEventListener("click", act);
  box.querySelector(".shoot-field").addEventListener("pointerdown", (event) => {
    event.preventDefault();
    act();
  });

  getReady();
  frame = requestAnimationFrame(loop);
  $("act").focus({ preventScroll: true });

  return () => {
    stopped = true;
    cancelAnimationFrame(frame);
    timers.forEach(clearTimeout);
  };
}


/* 3. GOALIE REFLEXES ----------------------------------------------------
   The ball shows up somewhere in the goal. Tap it as fast as you can!
   It measures your reaction time in milliseconds (1000 ms = 1 second). */

const REFLEX_ROUNDS = 10;
const REFLEX_TOO_SLOW = 1500; // ms

function reflexRating(ms) {
  if (ms < 300) return "⚡ Lightning hands!";
  if (ms < 400) return "🧤 Super quick!";
  if (ms < 550) return "👍 Good save!";
  return "🐢 Keep practicing!";
}

function playReflex(box, options) {
  const times = [];
  let shownAt = 0;
  let waiting = null;
  let tooSlow = null;
  let stopped = false;
  let ballUp = false;

  box.innerHTML = `
    <div class="game-play">
      <div class="quiz-top">
        <p class="quiz-where" data-reflex="where"></p>
        <p class="quiz-score" data-reflex="last"></p>
        ${options.quit || ""}
      </div>
      <div class="quiz-dots" data-reflex="dots" aria-hidden="true"></div>
      <div class="reflex-goal" data-reflex="goal" tabindex="0" aria-label="The goal. When the ball shows up, tap it, or press the space bar!">
        <p class="reflex-msg" data-reflex="msg" aria-live="polite">Get ready...</p>
        <span class="reflex-ball" data-reflex="ball" hidden>⚽</span>
      </div>
      <p class="game-help">Tap the ball the moment you see it. Don't tap too early!</p>
    </div>`;

  const $ = (name) => box.querySelector(`[data-reflex="${name}"]`);

  function showTop() {
    $("where").textContent = `${options.who ? `${options.who} · ` : ""}Save ${Math.min(times.length + 1, REFLEX_ROUNDS)} of ${REFLEX_ROUNDS}`;
    $("dots").innerHTML = Array.from({ length: REFLEX_ROUNDS }, (_, i) => {
      let mark = i === times.length ? "is-now" : "";
      if (i < times.length) mark = times[i] < REFLEX_TOO_SLOW ? "is-right" : "is-wrong";
      return `<span class="quiz-dot ${mark}"></span>`;
    }).join("");
  }

  function waitForBall() {
    clearTimeout(waiting);
    waiting = setTimeout(showBall, randomBetween(900, 2600));
  }

  function showBall() {
    if (stopped) return;
    const ball = $("ball");
    ball.style.left = `${randomBetween(10, 90).toFixed(1)}%`;
    ball.style.top = `${randomBetween(16, 84).toFixed(1)}%`;
    ball.hidden = false;
    ballUp = true;
    $("msg").textContent = "";
    shownAt = performance.now();
    tooSlow = setTimeout(() => saved(REFLEX_TOO_SLOW), REFLEX_TOO_SLOW);
  }

  function saved(ms) {
    clearTimeout(tooSlow);
    ballUp = false;
    $("ball").hidden = true;
    times.push(ms);
    if (ms >= REFLEX_TOO_SLOW) {
      $("msg").textContent = "⚽ Goal! Too slow.";
      sounds.down();
    } else {
      $("msg").textContent = `${ms} ms · ${reflexRating(ms)}`;
      sounds.count();
    }
    $("last").textContent = `🧤 ${ms >= REFLEX_TOO_SLOW ? "–" : `${ms} ms`}`;
    showTop();
    if (times.length >= REFLEX_ROUNDS) {
      const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      waiting = setTimeout(() => {
        if (!stopped) options.done({ avg, best: Math.min(...times), times });
      }, 900);
      return;
    }
    waitForBall();
  }

  function tap() {
    if (stopped || times.length >= REFLEX_ROUNDS) return;
    if (ballUp) {
      saved(Math.round(performance.now() - shownAt));
    } else {
      $("msg").textContent = "😅 Too early! Wait for the ball...";
      sounds.down();
      waitForBall(); // start the wait over
    }
  }

  $("goal").addEventListener("pointerdown", (event) => {
    event.preventDefault();
    tap();
  });
  $("goal").addEventListener("keydown", (event) => {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      if (!event.repeat) tap();
    }
  });

  showTop();
  $("goal").focus({ preventScroll: true });
  waitForBall();

  return () => {
    stopped = true;
    clearTimeout(waiting);
    clearTimeout(tooSlow);
  };
}


/* 4. BOARD BREAK ----------------------------------------------------------
   The needle slides across the meter. Strike (KIHAP!) when it's in the
   green to break the boards. Every level adds a board, and the green
   gets smaller and the needle gets faster. 3 misses and you're done.  */

const BOARD_LIVES = 3;

function playBoards(box, options) {
  let level = 1;
  let best = 0;
  let misses = 0;
  let zone = null;
  let phase = "aim";
  let t0 = performance.now();
  let position = 0;
  let frame = null;
  let stopped = false;
  const timers = [];

  box.innerHTML = `
    <div class="game-play">
      <div class="quiz-top">
        <p class="quiz-where" data-boards="where"></p>
        <p class="quiz-score" data-boards="lives" aria-label="Tries left"></p>
        ${options.quit || ""}
      </div>
      <svg class="boards-scene" viewBox="0 0 240 130" role="img" aria-label="Boards stacked on two blocks" data-boards="scene"></svg>
      <p class="boards-call" data-boards="call" aria-live="polite"></p>
      <div class="power-meter" aria-hidden="true">
        <span class="power-meter__zone power-meter__zone--good" data-boards="zone"></span>
        <span class="power-meter__needle" data-boards="needle"></span>
      </div>
      <button class="button game-button" type="button" data-boards="strike">💥 KIHAP!</button>
      <p class="game-help">Strike when the needle is in the green. Yell "kihap!" for extra power! 😄</p>
    </div>`;

  const $ = (name) => box.querySelector(`[data-boards="${name}"]`);

  function drawStack(broken) {
    const shown = Math.min(level, 10);
    const boards = [];
    for (let i = 0; i < shown; i++) {
      const y = 86 - (i + 1) * 8.5;
      boards.push(`
        <g class="board ${broken ? "is-broken" : ""}" style="--i: ${i}">
          <rect class="board__half board__half--left" x="22" y="${y}" width="98" height="7" rx="1.5"/>
          <rect class="board__half board__half--right" x="120" y="${y}" width="98" height="7" rx="1.5"/>
        </g>`);
    }
    $("scene").innerHTML = `
      <rect class="boards-block" x="26" y="88" width="44" height="38" rx="3"/>
      <rect class="boards-block" x="170" y="88" width="44" height="38" rx="3"/>
      ${boards.join("")}
      ${level > 10 ? `<text class="boards-count" x="120" y="${86 - shown * 8.5 - 6}" text-anchor="middle">× ${level}</text>` : ""}`;
  }

  function setUpLevel() {
    const width = Math.max(7, 32 - level * 2.6); // the green part, in %
    zone = { from: randomBetween(8, 92 - width), width };
    $("zone").style.left = `${zone.from}%`;
    $("zone").style.width = `${width}%`;
    $("where").textContent = `${options.who ? `${options.who} · ` : ""}Level ${level}: ${plural(level, "board")}`;
    $("lives").textContent = "❤️".repeat(BOARD_LIVES - misses) + "🤍".repeat(misses);
    $("strike").disabled = false;
    drawStack(false);
    phase = "aim";
    t0 = performance.now();
  }

  function strike() {
    if (stopped || phase !== "aim") return;
    phase = "struck";
    $("strike").disabled = true;
    startAudio();
    const center = zone.from + zone.width / 2;
    const hit = position >= zone.from && position <= zone.from + zone.width;
    if (hit) {
      const perfect = Math.abs(position - center) < zone.width / 5;
      best = level;
      drawStack(true);
      $("call").textContent = perfect ? `PERFECT! 🔥 ${plural(level, "board")} broken!` : `CRACK! ${plural(level, "board")} broken! 💥`;
      $("call").className = "boards-call is-hit";
      sounds.rate(perfect ? 10 : 8);
      level += 1;
      timers.push(setTimeout(() => {
        if (!stopped) setUpLevel();
      }, 1200));
    } else {
      misses += 1;
      $("call").textContent = misses >= BOARD_LIVES ? "Ouch! That's the last try." : "Ouch! 😣 The boards held. Try again!";
      $("call").className = "boards-call is-miss";
      $("scene").classList.remove("is-wobbling");
      void $("scene").getBoundingClientRect();
      $("scene").classList.add("is-wobbling");
      $("lives").textContent = "❤️".repeat(BOARD_LIVES - misses) + "🤍".repeat(misses);
      sounds.down();
      timers.push(setTimeout(() => {
        if (stopped) return;
        if (misses >= BOARD_LIVES) {
          cancelAnimationFrame(frame);
          options.done({ level: best });
        } else {
          phase = "aim";
          t0 = performance.now();
          $("strike").disabled = false;
          $("strike").focus({ preventScroll: true });
        }
      }, 1100));
    }
  }

  function loop(now) {
    if (stopped) return;
    if (phase === "aim") {
      const speed = 0.45 + level * 0.09; // trips across the meter per second
      position = zigzag(((now - t0) / 1000) * speed / 2) * 100;
      $("needle").style.left = `${position.toFixed(1)}%`;
    }
    frame = requestAnimationFrame(loop);
  }

  $("strike").addEventListener("click", strike);
  setUpLevel();
  frame = requestAnimationFrame(loop);
  $("strike").focus({ preventScroll: true });

  return () => {
    stopped = true;
    cancelAnimationFrame(frame);
    timers.forEach(clearTimeout);
  };
}


/* 5. MEMORY MATCH ----------------------------------------------------------
   12 cards, 6 pairs of moves. Flip two at a time. When you find a
   pair, do that move for real before you flip again!               */

const MEMORY_MOVES = [
  { demo: "squat", name: "Squats", fix: "10 squats" },
  { demo: "jacks", name: "Jumping jacks", fix: "15 jumping jacks" },
  { demo: "pushup", name: "Push-ups", fix: "5 push-ups" },
  { demo: "curlup", name: "Curl-ups", fix: "10 curl-ups" },
  { demo: "lunge", name: "Lunges", fix: "5 lunges each leg" },
  { demo: "plank", name: "Plank", fix: "15-second plank" },
  { demo: "highKnees", name: "High knees", fix: "20 high knees" },
  { demo: "calfRaise", name: "Calf raises", fix: "15 calf raises" },
  { demo: "mountainClimbers", name: "Mountain climbers", fix: "10 mountain climbers" },
  { demo: "burpee", name: "Burpees", fix: "3 burpees" },
  { demo: "wallSit", name: "Wall sit", fix: "15-second wall sit" },
  { demo: "frontKick", name: "Front kicks", fix: "5 front kicks each leg" },
];
const MEMORY_PAIRS = 6;

function playMemory(box, options) {
  const moves = quizShuffle(MEMORY_MOVES).slice(0, MEMORY_PAIRS);
  const cards = quizShuffle([...moves, ...moves]);
  const matched = new Set(); // card numbers you've matched
  let open = [];             // the 1 or 2 cards turned over right now
  let turns = 0;
  let reps = 0;
  let todo = null;           // the move you matched and need to do
  let locked = false;
  let stopped = false;
  const started = Date.now();
  const timers = [];

  function draw() {
    const grid = cards.map((move, i) => {
      const up = matched.has(i) || open.includes(i);
      return `
        <button class="memory-card ${up ? "is-up" : ""} ${matched.has(i) ? "is-matched" : ""}" type="button" data-memory-card="${i}"
          aria-label="${up ? move.name : `Card ${i + 1}, face down`}" ${matched.has(i) ? "disabled" : ""}>
          ${up ? `<span data-memory-demo="${move.demo}"></span><span class="memory-card__name">${move.name}</span>` : `<span class="memory-card__back" aria-hidden="true">?</span>`}
        </button>`;
    }).join("");

    box.innerHTML = `
      <div class="game-play">
        <div class="quiz-top">
          <p class="quiz-where">${options.who ? `${options.who} · ` : ""}${matched.size / 2} of ${MEMORY_PAIRS} pairs</p>
          <p class="quiz-score">🔄 ${plural(turns, "turn")}</p>
          ${options.quit || ""}
        </div>
        <div class="memory-grid">${grid}</div>
        <div class="memory-todo" aria-live="polite">${todo
          ? brainPenaltyHTML(todo.fix, "memory", "Did it ✓", "🎉 Match! Now do:")
          : `<p class="game-help">Find the pairs! Each time you match one, you do that move.</p>`}</div>
      </div>`;
    box.querySelectorAll("[data-memory-demo]").forEach((spot) => {
      const svg = createDemo(spot.dataset.memoryDemo, "");
      svg.setAttribute("aria-hidden", "true");
      spot.replaceWith(svg);
    });
    fillPenaltyDemos(box);
  }

  function flip(i) {
    if (stopped || locked || todo || matched.has(i) || open.includes(i)) return;
    open.push(i);
    sounds.count();
    if (open.length === 2) {
      turns += 1;
      const [a, b] = open;
      if (cards[a].demo === cards[b].demo) {
        matched.add(a);
        matched.add(b);
        open = [];
        todo = cards[a];
        sounds.up();
      } else {
        locked = true;
        timers.push(setTimeout(() => {
          open = [];
          locked = false;
          if (!stopped) draw();
        }, 1000));
      }
    }
    draw();
    const focusOn = todo ? box.querySelector("[data-memory='did']") : box.querySelector(`[data-memory-card="${i}"]`);
    focusOn?.focus({ preventScroll: true });
  }

  box.addEventListener("click", onClick);
  function onClick(event) {
    if (stopped) return;
    const card = event.target.closest("[data-memory-card]");
    if (card) {
      flip(Number(card.dataset.memoryCard));
      return;
    }
    const button = event.target.closest("[data-memory]");
    if (!button || !todo) return;
    const action = button.dataset.memory;
    if (action === "demo" || action === "timer") penaltyButton(action, todo.fix);
    if (action === "did") {
      reps += penaltyInfo(todo.fix).reps;
      todo = null;
      stopTimer();
      sounds.done();
      if (matched.size === cards.length) {
        stopped = true;
        box.removeEventListener("click", onClick);
        options.done({ turns, reps, secs: Math.round((Date.now() - started) / 1000) });
        return;
      }
      draw();
      box.querySelector(".memory-card:not(:disabled)")?.focus({ preventScroll: true });
    }
  }

  draw();

  return () => {
    stopped = true;
    timers.forEach(clearTimeout);
    box.removeEventListener("click", onClick);
  };
}


/* 6. THE GAME LIST --------------------------------------------------------
   For each game: how to play it, what it saves in the activity log,
   and how two scores compare (for bests and duels).
     compare(a, b) is more than 0 when a is better than b           */

const ARCADE_GAMES = {
  shootout: {
    name: "Penalty Shootout",
    icon: "⚽",
    play: playShootout,
    soloOptions: () => ({ shots: 5 + Math.min(3, workoutsThisWeek()) }),
    duelOptions: () => ({ shots: 5 }),
    howTo: "Tap to aim, then tap again to pick your power. Green power is best, and the top corners can't be saved!",
    extra: () => {
      const bonus = Math.min(3, workoutsThisWeek());
      return bonus
        ? `💪 Workout bonus: +${plural(bonus, "extra shot")} for your workouts this week!`
        : "💪 Each workout you finish this week = 1 extra shot (up to 3)!";
    },
    log: (r) => ({ g: r.goals, n: r.shots }),
    fromLog: (e) => ({ goals: e.g, shots: e.n }),
    compare: (a, b) => a.goals - b.goals,
    score: (r) => plural(r.goals, "goal"),
    big: (r) => `${r.goals}<span>/${r.shots}</span>`,
    message: (r) => (r.goals === r.shots ? "PERFECT! Every shot went in! 🏆" : r.goals >= r.shots * 0.6 ? "What a striker! ⚽" : "Keep shooting! Aim for the corners."),
  },
  reflex: {
    name: "Goalie Reflexes",
    icon: "🧤",
    play: playReflex,
    soloOptions: () => ({}),
    duelOptions: () => ({}),
    howTo: "Tap the ball the moment it shows up. Your time is in milliseconds: 1000 ms = 1 second, so smaller is faster!",
    extra: () => "Most grown-ups take about 250 to 350 ms on a screen. How fast are you?",
    log: (r) => ({ avg: r.avg, best: r.best }),
    fromLog: (e) => ({ avg: e.avg, best: e.best }),
    compare: (a, b) => b.avg - a.avg, // faster is better
    score: (r) => `${r.avg} ms`,
    big: (r) => `${r.avg}<span> ms</span>`,
    message: (r) => `${reflexRating(r.avg)} Your fastest save: ${r.best} ms.`,
  },
  boards: {
    name: "Board Break",
    icon: "🪵",
    play: playBoards,
    soloOptions: () => ({}),
    duelOptions: () => ({}),
    howTo: "Hit KIHAP! when the needle is in the green. Every level adds a board. You get 3 tries.",
    extra: () => "🥋 Real boards are only for the dojang, with your instructor watching!",
    log: (r) => ({ lvl: r.level }),
    fromLog: (e) => ({ level: e.lvl }),
    compare: (a, b) => a.level - b.level,
    score: (r) => plural(r.level, "board"),
    big: (r) => `${r.level}<span> ${r.level === 1 ? "board" : "boards"}</span>`,
    message: (r) => (r.level >= 8 ? "Black belt power! 🥋" : r.level >= 4 ? "Strong strikes! 💥" : "Keep training. Focus on the green!"),
  },
  memory: {
    name: "Memory Match",
    icon: "🃏",
    play: playMemory,
    soloOptions: () => ({}),
    duelOptions: () => ({}),
    howTo: "Flip two cards at a time to find the pairs. When you find one, do that move for real!",
    extra: () => "Fewer turns is better. The best you can do is 6!",
    log: (r) => ({ turns: r.turns, reps: r.reps, secs: r.secs }),
    fromLog: (e) => ({ turns: e.turns, reps: e.reps, secs: e.secs }),
    compare: (a, b) => b.turns - a.turns, // fewer turns is better
    score: (r) => plural(r.turns, "turn"),
    big: (r) => `${r.turns}<span> turns</span>`,
    message: (r) => `${r.turns <= 10 ? "Amazing memory! 🧠" : "All pairs found!"} You did ${r.reps} reps in ${formatTime(r.secs)}.`,
  },
};

// Your best ever result in a game, or null
function arcadeBest(id) {
  const game = ARCADE_GAMES[id];
  const results = logOf(id).map(game.fromLog);
  if (results.length === 0) return null;
  return results.reduce((best, result) => (game.compare(result, best) > 0 ? result : best));
}


/* 7. PLAYING BY YOURSELF ---------------------------------------------------- */

const soloGames = {}; // game id -> { stop, result, newBest, xpBefore }

function soloArea(id) {
  return document.querySelector(`#${id}-area`);
}

function drawSolo(id) {
  const game = ARCADE_GAMES[id];
  const solo = soloGames[id] || {};
  const area = soloArea(id);
  if (solo.stop) return; // a game is running: it draws itself

  if (solo.result) {
    const xpGained = trophyStats().xp - solo.xpBefore;
    const best = arcadeBest(id);
    area.innerHTML = `
      <div class="quiz-end">
        <p class="eyebrow">// game over · ${game.icon} ${game.name}</p>
        <p class="quiz-end__score">${game.big(solo.result)}</p>
        <p class="quiz-end__message">${solo.newBest ? "🎉 NEW BEST! " : ""}${game.message(solo.result)}</p>
        <ul class="quiz-end__facts">
          <li>${xpGained > 0 ? `+${xpGained} XP` : "No more XP from this game today (3 a day), but it still counts as practice!"}</li>
          ${!solo.newBest && best && logOf(id).length > 1 ? `<li>Your best: ${game.score(best)}</li>` : ""}
        </ul>
        <div class="quiz-end__buttons">
          <button class="button" type="button" data-solo-start="${id}">Play again</button>
          <button class="button button--quiet" type="button" data-solo-close="${id}">Done</button>
        </div>
      </div>`;
    return;
  }

  const best = arcadeBest(id);
  const played = logOf(id).length;
  area.innerHTML = `
    <div class="brain-start">
      <p class="brain-start__text">${game.howTo}</p>
      <p class="game-extra">${game.extra()}</p>
      <button class="button" type="button" data-solo-start="${id}">${game.icon} Play</button>
      <p class="quiz-total">${best ? `Best: ${game.score(best)} · played ${plural(played, "time")}` : "Not played yet. Good luck!"}</p>
    </div>`;
}

function startSolo(id) {
  const game = ARCADE_GAMES[id];
  const before = arcadeBest(id);
  const solo = { xpBefore: trophyStats().xp };
  soloGames[id] = solo;
  startAudio();
  solo.stop = game.play(soloArea(id), {
    ...game.soloOptions(),
    quit: `<button class="text-button" type="button" data-solo-quit="${id}">Quit</button>`,
    done: (result) => {
      solo.stop = null;
      solo.result = result;
      solo.newBest = Boolean(before) && game.compare(result, before) > 0; // (your first game is just your first score)
      logActivity(id, game.log(result));
      render();
      drawSolo(id);
      if (solo.newBest) {
        sounds.fanfare();
        confetti();
      } else {
        sounds.finish();
      }
      checkAchievements(true);
      soloArea(id).querySelector("[data-solo-start]")?.focus({ preventScroll: true });
    },
  });
}

document.addEventListener("click", (event) => {
  const start = event.target.closest("[data-solo-start]");
  if (start) {
    startSolo(start.dataset.soloStart);
    return;
  }
  const close = event.target.closest("[data-solo-close]");
  if (close) {
    soloGames[close.dataset.soloClose] = null;
    drawSolo(close.dataset.soloClose);
  }
});

// The Quit button under each game
document.addEventListener("click", (event) => {
  const quit = event.target.closest("[data-solo-quit]");
  if (!quit) return;
  const id = quit.dataset.soloQuit;
  const solo = soloGames[id];
  if (solo && solo.stop) {
    solo.stop();
    soloGames[id] = null;
    stopTimer();
    drawSolo(id);
  }
});


/* 8. MYSTERY BOX ---------------------------------------------------------------
   One box a day. What's inside is picked by the date, so opening
   it again (or reloading the page) can't change it!                */

const BOX_WORKOUTS = [
  { text: "25 jumping jacks + 10 squats", reps: 35 },
  { text: "20 high knees + 10 curl-ups", reps: 30 },
  { text: "3 rounds of 5 push-ups + 5 squats", reps: 30 },
  { text: "10 front kicks with each leg + 10 calf raises", reps: 30 },
  { text: "15 mountain climbers + a 20-second plank", reps: 25 },
  { text: "10 lunges with each leg", reps: 20 },
];
const BOX_RARE_HATS = ["tophat", "halo", "unicorn"]; // in shop.js
const BOX_WORKOUT_XP = 50;

function todaysBox() {
  return logOf("box").find((entry) => entry.d === toKey(today)) || null;
}

function boxTreats() {
  return logOf("box").reduce((sum, entry) => sum + (entry.p === "treat" ? entry.n : 0), 0);
}

// What's in today's box
function pickBoxPrize() {
  const day = toKey(today);
  const roll = luckyNumber(`box ${day}`);
  const second = luckyNumber(`box prize ${day}`);
  const hatsLeft = BOX_RARE_HATS.filter((id) => !shopData.owned.includes(`hat:${id}`));
  if (roll < 0.3) return { p: "coins", coins: 10 + Math.floor(second * 21) };
  if (roll < 0.55) return { p: "workout", w: Math.floor(second * BOX_WORKOUTS.length) };
  if (roll < 0.75) return { p: "treat", n: second < 0.6 ? 1 : 2 };
  if (roll < 0.9) return { p: "xp", xp: [25, 50, 75][Math.floor(second * 3)] };
  if (hatsLeft.length) return { p: "hat", hat: hatsLeft[Math.floor(second * hatsLeft.length)] };
  return { p: "coins", coins: 50 };
}

function boxPrizeHTML(entry) {
  const workoutDone = logOf("boxWorkout").some((done) => done.d === entry.d);
  if (entry.p === "coins") {
    return { icon: "🪙", title: `${entry.coins} coins!`, text: "Spend them in the shop on the Pet & Shop tab." };
  }
  if (entry.p === "treat") {
    return { icon: "🍪", title: `${plural(entry.n, "pet treat")}!`, text: `Treats are for your pet! You've found ${plural(boxTreats(), "treat")} so far.` };
  }
  if (entry.p === "xp") {
    return { icon: "⭐", title: `+${entry.xp} XP!`, text: "Free XP, just for opening the box. Lucky!" };
  }
  if (entry.p === "hat") {
    const hat = SHOP.find((item) => item.group === "hat" && item.id === entry.hat);
    return { icon: hat.icon, title: `RARE: ${hat.name}!`, text: "A super rare pet hat you can't buy in the shop. Put it on your pet!", hat: true };
  }
  const workout = BOX_WORKOUTS[entry.w] || BOX_WORKOUTS[0];
  return {
    icon: "🏋️",
    title: "Bonus challenge!",
    text: `${workout.text}. Do it today for +${BOX_WORKOUT_XP} XP!`,
    workout: !workoutDone,
    workoutDone,
  };
}

function drawBox() {
  const area = document.querySelector("#box-area");
  const entry = todaysBox();
  const opened = logOf("box").length;
  if (!entry) {
    area.innerHTML = `
      <div class="box-wrap">
        <button class="mystery-box" type="button" data-box="open" aria-label="Open today's Mystery Box">🎁</button>
        <p class="brain-start__text">Today's box is ready! Tap it to open.</p>
        <p class="quiz-total">${opened ? `You've opened ${plural(opened, "box", "boxes")}.` : "There's a new box every day."} Could be coins, XP, a bonus challenge, pet treats... or a RARE hat!</p>
      </div>`;
    return;
  }
  const prize = boxPrizeHTML(entry);
  area.innerHTML = `
    <div class="box-wrap">
      <p class="box-prize__icon" aria-hidden="true">${prize.icon}</p>
      <p class="box-prize__title">${prize.title}</p>
      <p class="brain-start__text">${prize.text}</p>
      ${prize.workout ? `<button class="button" type="button" data-box="workout">I did it! ✓</button>` : ""}
      ${prize.workoutDone ? `<p class="penalty-done">💪 Challenge done! +${BOX_WORKOUT_XP} XP</p>` : ""}
      ${prize.hat ? `<button class="button button--quiet" type="button" data-go-tab="pet">See it on your pet 🐾</button>` : ""}
      <p class="quiz-total">Come back tomorrow for a new box! ⏰ (${plural(opened, "box", "boxes")} opened)</p>
    </div>`;
}

document.querySelector("#box-area").addEventListener("click", (event) => {
  const button = event.target.closest("[data-box]");
  if (!button) return;

  if (button.dataset.box === "open" && !todaysBox()) {
    startAudio();
    button.disabled = true;
    button.classList.add("is-shaking");
    sounds.count();
    setTimeout(() => sounds.count(), 300);
    setTimeout(() => sounds.up(), 600);
    setTimeout(() => {
      if (todaysBox()) return;
      const prize = pickBoxPrize();
      logActivity("box", prize);
      if (prize.p === "hat") {
        shopData.owned = [...shopData.owned, `hat:${prize.hat}`];
        saveJSON("levelUp.shop", shopData);
      }
      sounds.fanfare();
      if (prize.p === "hat") confetti();
      render();
      drawBox();
      checkAchievements(true);
    }, noMotion() ? 100 : 950);
  }

  if (button.dataset.box === "workout") {
    const entry = todaysBox();
    if (!entry || logOf("boxWorkout").some((done) => done.d === entry.d)) return;
    logActivity("boxWorkout", { reps: (BOX_WORKOUTS[entry.w] || BOX_WORKOUTS[0]).reps });
    sounds.fanfare();
    render();
    drawBox();
    checkAchievements(true);
  }
});


/* 9. SISTER DUEL ------------------------------------------------------------------
   Two players, one iPad. Player 1 plays, then passes it to player 2.
   Higher score wins, and the loser does a silly penalty! The quiz
   battle takes turns question by question instead.                */

const DUEL_BATTLES = [
  { id: "quiz", icon: "🧠", name: "Quiz Battle", how: "5 school questions each, taking turns" },
  { id: "shootout", icon: "⚽", name: "Shootout", how: "5 shots each. Most goals wins" },
  { id: "reflex", icon: "🧤", name: "Reflexes", how: "10 saves each. Fastest wins" },
  { id: "boards", icon: "🪵", name: "Board Break", how: "Most boards broken wins" },
  { id: "memory", icon: "🃏", name: "Memory Match", how: "Fewest turns wins (with moves!)" },
];
const DUEL_PENALTIES = [
  "10 jumping jacks", "5 push-ups", "10 squats", "a 20-second plank", "the chicken dance for 10 seconds 🐔",
  "10 frog jumps 🐸", "a silly victory bow to the winner 🙇", "15 high knees", "walk like a crab for 10 seconds 🦀",
];
const DUEL_QUIZ_EACH = 5;

let duelData = { names: ["", ""], wins: [0, 0], ties: 0 }; // saved
let duel = null; // the battle you're in, or null
const duelArea = document.querySelector("#duel-area");

function duelName(i) {
  return escapeHTML(duelData.names[i] || `Player ${i + 1}`);
}

function saveDuel() {
  saveJSON("levelUp.duel", duelData);
}

function drawDuel() {
  if (!duel) {
    const battles = DUEL_BATTLES.map((battle) => `
      <button class="quiz-subject" type="button" data-duel-pick="${battle.id}">
        <span class="quiz-subject__icon" aria-hidden="true">${battle.icon}</span>
        <span class="quiz-subject__name">${battle.name}</span>
        <span class="quiz-subject__info">${battle.how}</span>
      </button>`).join("");
    const games = duelData.wins[0] + duelData.wins[1] + duelData.ties;
    duelArea.innerHTML = `
      <p class="duel-record">${games
        ? `<span class="duel-p0">${duelName(0)}: ${plural(duelData.wins[0], "win")}</span> <span class="duel-p1">${duelName(1)}: ${plural(duelData.wins[1], "win")}</span>${duelData.ties ? ` <span>${plural(duelData.ties, "tie")}</span>` : ""}`
        : "No battles yet. Pick one below!"}</p>
      <div class="quiz-subjects duel-battles">${battles}</div>`;
    return;
  }

  if (duel.phase === "ready" || duel.phase === "pass") {
    const player = duel.turn;
    const before = duel.phase === "pass"
      ? `<p class="duel-pass__score"><span class="duel-p0">${duelName(0)}</span> got <strong>${ARCADE_GAMES[duel.game].score(duel.results[0])}</strong>.</p>
         <p class="duel-pass__icon" aria-hidden="true">📲</p>
         <p class="brain-start__text">Pass the iPad to <strong class="duel-p1">${duelName(1)}</strong>! No peeking at their turn... 👀</p>`
      : `<p class="brain-start__text"><strong class="duel-p0">${duelName(0)}</strong> goes first. ${duel.game === "quiz"
        ? "You take turns: each of you gets 5 school questions. Most right answers wins!"
        : ARCADE_GAMES[duel.game].howTo}</p>`;
    duelArea.innerHTML = `
      <div class="duel-pass">
        ${before}
        <div class="brain-start__buttons">
          <button class="button" type="button" data-duel="go">I'm ${duelName(player)}. Let's go!</button>
          <button class="text-button" type="button" data-duel="quit">Quit battle</button>
        </div>
      </div>`;
    return;
  }

  if (duel.phase === "quiz") {
    duelArea.innerHTML = duelQuizHTML();
    return;
  }

  if (duel.phase === "over") {
    duelArea.innerHTML = duelOverHTML();
  }
  // "play": the game draws itself
}

function startDuel(battle) {
  duel = { game: battle, turn: 0, results: [], phase: "ready" };
  if (battle === "quiz") {
    const pool = QUIZ_SUBJECTS.filter((subject) => subject.school).flatMap((subject) => subject.questions);
    duel.questions = quizShuffle(pool).slice(0, DUEL_QUIZ_EACH * 2).map((question) => {
      const order = quizShuffle(question.a.map((_, i) => i));
      return { ...question, choices: order.map((i) => question.a[i]), right: order.indexOf(0) };
    });
    duel.index = 0;
    duel.picked = null;
    duel.scores = [0, 0];
  }
  drawDuel();
  duelArea.querySelector("[data-duel='go']")?.focus({ preventScroll: true });
}

function goDuel() {
  startAudio();
  if (duel.game === "quiz") {
    duel.phase = "quiz";
    drawDuel();
    duelArea.querySelector(".quiz-answer")?.focus({ preventScroll: true });
    return;
  }
  const game = ARCADE_GAMES[duel.game];
  duel.phase = "play";
  const player = duel.turn;
  duel.stop = game.play(duelArea, {
    ...game.duelOptions(),
    quit: `<button class="text-button" type="button" data-duel="quit">Quit</button>`,
    who: escapeHTML(duelData.names[player] || `Player ${player + 1}`),
    done: (result) => {
      duel.stop = null;
      duel.results[player] = result;
      if (player === 0) {
        duel.turn = 1;
        duel.phase = "pass";
        sounds.finish();
      } else {
        finishDuel();
      }
      drawDuel();
      duelArea.querySelector("[data-duel='go'], [data-duel='again']")?.focus({ preventScroll: true });
    },
  });
}

function duelQuizHTML() {
  const question = duel.questions[duel.index];
  const player = duel.index % 2;
  const answered = duel.picked !== null;
  const answers = question.choices.map((choice, i) => {
    let state = "";
    if (answered && i === question.right) state = "is-right";
    else if (answered && i === duel.picked) state = "is-wrong";
    return `
      <button class="quiz-answer ${state}" type="button" data-duel-answer="${i}" ${answered ? "disabled" : ""}>
        <span class="quiz-answer__letter" aria-hidden="true">${"ABCD"[i]}</span>
        <span>${choice}</span>
      </button>`;
  }).join("");
  const last = duel.index === duel.questions.length - 1;
  const next = last ? "See who won! 🏆" : `Next: ${duelName(1 - player)}'s turn →`;
  return `
    <div class="quiz-play">
      <div class="quiz-top">
        <p class="quiz-where"><strong class="duel-p${player}">${duelName(player)}'s question</strong> · ${duel.index + 1} of ${duel.questions.length}</p>
        <p class="quiz-score"><span class="duel-p0">${duel.scores[0]}</span> – <span class="duel-p1">${duel.scores[1]}</span></p>
        <button class="text-button" type="button" data-duel="quit">Quit</button>
      </div>
      <h3 class="quiz-question">${question.q}</h3>
      <div class="quiz-answers">${answers}</div>
      <div class="quiz-feedback" aria-live="polite">${answered ? `
        <div class="quiz-result ${duel.picked === question.right ? "is-right" : "is-wrong"}">
          <p class="quiz-result__title">${duel.picked === question.right ? "✅ Point for " + duelName(player) + "!" : `❌ Nope! It's: <strong>${question.choices[question.right]}</strong>`}</p>
          <p>${question.why}</p>
        </div>
        <button class="button quiz-next" type="button" data-duel="next">${next}</button>` : ""}</div>
    </div>`;
}

function finishDuel() {
  duel.phase = "over";
  let difference;
  if (duel.game === "quiz") {
    duel.results = [{ right: duel.scores[0] }, { right: duel.scores[1] }];
    difference = duel.scores[0] - duel.scores[1];
  } else {
    difference = ARCADE_GAMES[duel.game].compare(duel.results[0], duel.results[1]);
  }
  duel.winner = difference > 0 ? 0 : difference < 0 ? 1 : null;
  duel.penalty = DUEL_PENALTIES[Math.floor(Math.random() * DUEL_PENALTIES.length)];
  if (duel.winner === null) duelData.ties += 1;
  else duelData.wins[duel.winner] += 1;
  saveDuel();
  logActivity("duel", { g: duel.game, w: duel.winner });
  render();
  sounds.fanfare();
  confetti();
  checkAchievements(true);
}

function duelOverHTML() {
  const battle = DUEL_BATTLES.find((item) => item.id === duel.game);
  const score = (i) => (duel.game === "quiz" ? `${duel.results[i].right} right` : ARCADE_GAMES[duel.game].score(duel.results[i]));
  const loser = duel.winner === null ? null : 1 - duel.winner;
  return `
    <div class="quiz-end">
      <p class="eyebrow">// ${battle.icon} ${battle.name} · results</p>
      <p class="duel-winner">${duel.winner === null ? "🤝 It's a TIE!" : `🏆 <span class="duel-p${duel.winner}">${duelName(duel.winner)}</span> wins!`}</p>
      <ul class="duel-scores">
        <li class="${duel.winner === 0 ? "is-winner" : ""}"><span class="duel-p0">${duelName(0)}</span> <strong>${score(0)}</strong></li>
        <li class="${duel.winner === 1 ? "is-winner" : ""}"><span class="duel-p1">${duelName(1)}</span> <strong>${score(1)}</strong></li>
      </ul>
      <p class="duel-penalty">${loser === null
        ? `Tie breaker: you BOTH do ${duel.penalty}!`
        : `Loser's penalty: <span class="duel-p${loser}">${duelName(loser)}</span> does ${duel.penalty}! 😄`}</p>
      <div class="quiz-end__buttons">
        <button class="button" type="button" data-duel="again">Rematch!</button>
        <button class="button button--quiet" type="button" data-duel="quit">Pick another battle</button>
      </div>
    </div>`;
}

duelArea.addEventListener("click", (event) => {
  const pick = event.target.closest("[data-duel-pick]");
  if (pick) {
    startDuel(pick.dataset.duelPick);
    return;
  }
  const answer = event.target.closest("[data-duel-answer]");
  if (answer && duel && duel.phase === "quiz" && duel.picked === null) {
    const question = duel.questions[duel.index];
    duel.picked = Number(answer.dataset.duelAnswer);
    if (duel.picked === question.right) {
      duel.scores[duel.index % 2] += 1;
      sounds.rate(10);
    } else {
      sounds.down();
    }
    drawDuel();
    duelArea.querySelector("[data-duel='next']")?.focus({ preventScroll: true });
    return;
  }
  const button = event.target.closest("[data-duel]");
  if (!button || !duel) return;
  const action = button.dataset.duel;

  if (action === "go") goDuel();
  if (action === "next") {
    duel.index += 1;
    duel.picked = null;
    if (duel.index >= duel.questions.length) finishDuel();
    drawDuel();
    duelArea.querySelector(".quiz-answer, [data-duel='again']")?.focus({ preventScroll: true });
  }
  if (action === "again") startDuel(duel.game);
  if (action === "quit") {
    if (duel.stop) duel.stop();
    duel = null;
    stopTimer();
    drawDuel();
  }
});

// Names: saved when you leave the box
document.querySelector("#duel-names").addEventListener("change", (event) => {
  const input = event.target.closest("[data-duel-name]");
  if (!input) return;
  duelData.names[Number(input.dataset.duelName)] = input.value.trim().slice(0, 16);
  saveDuel();
  if (!duel || duel.phase === "ready" || duel.phase === "pass" || duel.phase === "over") drawDuel();
});

function fillDuelNames() {
  document.querySelectorAll("[data-duel-name]").forEach((input) => {
    if (document.activeElement !== input) input.value = duelData.names[Number(input.dataset.duelName)] || "";
  });
}


/* 10. PLUGGING IN (see hooks.js) ---------------------------------------------- */

function drawArcadeGames() {
  Object.keys(ARCADE_GAMES).forEach(drawSolo);
  drawBox();
  fillDuelNames();
  if (!duel || duel.phase === "ready" || duel.phase === "pass" || duel.phase === "over") drawDuel();
}

addPagePart("arcade", drawArcadeGames);

addSavedData("levelUp.duel", () => {
  const saved = loadJSON("levelUp.duel", {});
  duelData = {
    names: Array.isArray(saved.names) ? [saved.names[0] || "", saved.names[1] || ""] : ["", ""],
    wins: Array.isArray(saved.wins) ? [Number(saved.wins[0]) || 0, Number(saved.wins[1]) || 0] : [0, 0],
    ties: Number(saved.ties) || 0,
  };
});

addCoins(() => logOf("box").reduce((sum, entry) => sum + (entry.coins || 0), 0));

addXP("shootout", (e) => 10 + e.g * 5, 3);
addXP("reflex", () => 15, 3);
addXP("boards", (e) => 5 * e.lvl, 3);
addXP("memory", () => 30, 3);
addXP("box", (e) => e.xp || 0, 1);
addXP("boxWorkout", () => BOX_WORKOUT_XP, 1);
addXP("duel", () => 20, 3);

addXPRule("Penalty Shootout", "+10, +5 per goal");
addXPRule("Goalie Reflexes / Memory Match", "+15 / +30");
addXPRule("Board Break", "+5 per board");
addXPRule("Mystery Box bonus challenge", `+${BOX_WORKOUT_XP}`);
addXPRule("Sister Duel", "+20");

addBadge({ id: "hatTrick", icon: "⚽", name: "Sharpshooter", how: "Score 5 goals in one Penalty Shootout", earned: () => logOf("shootout").some((e) => e.g >= 5) });
addBadge({ id: "catReflex", icon: "🧤", name: "Cat Reflexes", how: "Average under 350 ms in Goalie Reflexes", earned: () => logOf("reflex").some((e) => e.avg < 350) });
addBadge({ id: "boardBreaker", icon: "🪵", name: "Board Breaker", how: "Break 8 boards in Board Break", earned: () => logOf("boards").some((e) => e.lvl >= 8) });
addBadge({ id: "memoryMaster", icon: "🃏", name: "Memory Master", how: "Finish Memory Match in 10 turns or less", earned: () => logOf("memory").some((e) => e.turns <= 10) });
addBadge({ id: "lucky", icon: "🎁", name: "Lucky Seven", how: "Open 7 Mystery Boxes", earned: () => logOf("box").length >= 7 });
addBadge({ id: "goodSport", icon: "🤝", name: "Good Sport", how: "Play 5 Sister Duels", earned: () => logOf("duel").length >= 5 });
