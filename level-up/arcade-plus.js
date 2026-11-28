/* =============================================================
   arcade-plus.js: games where YOU are the controller
   -------------------------------------------------------------
   1. Kihap Meter: how loud is your kihap? (uses the microphone)
   2. Beat Workout: do the moves to a drum beat
   3. Obstacle Course Maker: a random course, with a stopwatch
   4. Speed Lab (on the Sports tab): time your sprints
   5. Plugging in (XP, badges, saved data: see hooks.js)

   This file loads before app.js, so it only uses app.js's
   functions inside its own functions, never right away.
   ============================================================= */


/* 1. KIHAP METER ---------------------------------------------------------
   The microphone measures how LOUD your kihap is (it doesn't record
   anything or save any sound). Louder = more boards broken!

   How loud: the mic gives numbers between -1 and 1 for the sound wave.
   The "RMS" (root mean square) of those numbers is how strong the wave
   is. Then decibels (dB) turn that into a scale that works like ears. */

const KIHAP_LISTEN_MS = 2500;
const KIHAP_RANKS = [
  { from: 0, icon: "🤫", name: "Whisper" },
  { from: 20, icon: "🐣", name: "Little peep" },
  { from: 40, icon: "🥋", name: "Yellow belt yell" },
  { from: 60, icon: "🐯", name: "Tiger roar" },
  { from: 75, icon: "⚡", name: "Thunder kihap" },
  { from: 90, icon: "🔥", name: "BLACK BELT KIHAP" },
];

let kihap = { state: "idle", score: 0, problem: "" };
let kihapStop = null; // turns the microphone off

function kihapRank(score) {
  return [...KIHAP_RANKS].reverse().find((rank) => score >= rank.from);
}

// From the sound wave's strength to a 0-100 score
function kihapLevel(rms) {
  const decibels = 20 * Math.log10(Math.max(rms, 0.00001)); // about -50 is quiet, about -8 is VERY loud
  return Math.max(0, Math.min(100, ((decibels + 50) / 42) * 100));
}

function kihapBoardsSVG(broken) {
  const boards = [];
  for (let i = 0; i < 10; i++) {
    const y = 86 - (i + 1) * 7.2;
    boards.push(`
      <g class="board ${i >= 10 - broken ? "is-broken" : ""}" style="--i: ${9 - i}">
        <rect class="board__half board__half--left" x="22" y="${y}" width="98" height="6" rx="1.5"/>
        <rect class="board__half board__half--right" x="120" y="${y}" width="98" height="6" rx="1.5"/>
      </g>`);
  }
  return `
    <svg class="boards-scene" viewBox="0 0 240 130" role="img" aria-label="${broken ? `${broken} of 10 boards broken` : "10 boards stacked on two blocks"}">
      <rect class="boards-block" x="26" y="88" width="44" height="38" rx="3"/>
      <rect class="boards-block" x="170" y="88" width="44" height="38" rx="3"/>
      ${boards.join("")}
    </svg>`;
}

function drawKihap() {
  const area = document.querySelector("#kihap-area");
  const best = Math.max(0, ...logOf("kihap").map((entry) => entry.s));
  const bestRank = kihapRank(best);
  if (kihap.state === "count" || kihap.state === "listen" || kihap.state === "asking") {
    area.innerHTML = `
      <div class="game-play kihap-play">
        ${kihapBoardsSVG(0)}
        <p class="kihap-call" data-kihap="call">${kihap.state === "asking" ? "Tap Allow to let the page hear you 🎤" : "Get ready..."}</p>
        <div class="kihap-meter" aria-hidden="true"><span class="kihap-meter__fill" data-kihap="fill"></span><span class="kihap-meter__peak" data-kihap="peak"></span></div>
        <button class="text-button" type="button" data-kihap="stop">Stop</button>
      </div>`;
    return;
  }
  if (kihap.state === "done") {
    const rank = kihapRank(kihap.score);
    const broken = Math.floor(kihap.score / 10);
    area.innerHTML = `
      <div class="game-play kihap-play">
        ${kihapBoardsSVG(broken)}
        <p class="kihap-score">${kihap.score}<span>/100</span></p>
        <p class="kihap-rank">${rank.icon} ${rank.name}${kihap.best ? " · NEW BEST! 🎉" : ""}</p>
        <p class="game-help">${broken ? `${plural(broken, "board")} broken!` : "The boards didn't even wobble. LOUDER! 😄"}</p>
        <button class="button game-button" type="button" data-kihap="go">🎤 Again!</button>
      </div>`;
    return;
  }
  let note = "";
  if (kihap.state === "nomic") note = `<p class="kihap-problem">😕 This page can't use the microphone here. Try your Level Up on github.io in Safari.</p>`;
  if (kihap.state === "denied") note = `<p class="kihap-problem">🔇 The microphone isn't allowed here. Use your Level Up on github.io in Safari and tap Allow when it asks. (Said no before? Settings → Safari → Microphone → Allow, with a grown-up.)</p>`;
  if (kihap.state === "error") note = `<p class="kihap-problem">😕 The microphone didn't start${kihap.problem ? ` (${escapeHTML(kihap.problem)})` : ""}. Try again?</p>`;
  area.innerHTML = `
    <div class="brain-start">
      <p class="brain-start__text">Tap the button, wait for the countdown, then yell your loudest <strong>KIHAP!</strong> The louder you are, the more boards break.</p>
      ${note}
      <button class="button game-button" type="button" data-kihap="go">🎤 Ready... KIHAP!</button>
      <p class="quiz-total">${best ? `Your best: ${best}/100 ${bestRank.icon} ${bestRank.name}` : "It only measures how loud you are. Nothing is recorded!"}</p>
      <p class="game-help">Tip: hold the iPad about an arm's length away. And don't yell in someone's ear! 😄</p>
    </div>`;
}

function stopKihap() {
  if (kihapStop) kihapStop();
  kihapStop = null;
}

async function startKihap() {
  stopKihap();
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    kihap = { state: "nomic", score: 0 };
    drawKihap();
    return;
  }
  startAudio();
  kihap = { state: "asking", score: 0 };
  drawKihap();
  let stream;
  try {
    // Turn off the iPad's "make it all the same loudness" helper, or every kihap would score the same
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
  } catch (error) {
    kihap = { state: error.name === "NotAllowedError" || error.name === "SecurityError" ? "denied" : "error", score: 0, problem: error.name };
    drawKihap();
    return;
  }
  if (!audio) {
    stream.getTracks().forEach((track) => track.stop());
    kihap = { state: "error", score: 0, problem: "no sound system" };
    drawKihap();
    return;
  }
  if (audio.state === "suspended") audio.resume();
  const source = audio.createMediaStreamSource(stream);
  const analyser = audio.createAnalyser();
  analyser.fftSize = 2048;
  source.connect(analyser); // NOT connected to the speakers, so there's no echo
  const wave = new Uint8Array(analyser.fftSize);
  let frame = null;
  const timers = [];
  kihapStop = () => {
    cancelAnimationFrame(frame);
    timers.forEach(clearTimeout);
    source.disconnect();
    stream.getTracks().forEach((track) => track.stop()); // the microphone turns off
  };

  kihap = { state: "count", score: 0 };
  drawKihap();
  const call = (text) => {
    const spot = document.querySelector('[data-kihap="call"]');
    if (spot) spot.textContent = text;
  };
  [3, 2, 1].forEach((n, i) => timers.push(setTimeout(() => {
    call(`${n}...`);
    sounds.count();
  }, i * 700)));

  let peak = 0;
  let listenStart = 0;
  timers.push(setTimeout(() => {
    kihap.state = "listen";
    call("KIHAP! 🗣️");
    sounds.up();
    listenStart = performance.now() + 150; // skip the "go" beep itself
    const listen = (now) => {
      analyser.getByteTimeDomainData(wave);
      let sum = 0;
      for (const value of wave) {
        const x = (value - 128) / 128;
        sum += x * x;
      }
      const level = kihapLevel(Math.sqrt(sum / wave.length));
      if (now > listenStart) peak = Math.max(peak, level);
      const fill = document.querySelector('[data-kihap="fill"]');
      const mark = document.querySelector('[data-kihap="peak"]');
      if (fill) fill.style.width = `${level.toFixed(1)}%`;
      if (mark) mark.style.left = `${peak.toFixed(1)}%`;
      if (now - listenStart < KIHAP_LISTEN_MS) {
        frame = requestAnimationFrame(listen);
      } else {
        finishKihap(Math.round(peak));
      }
    };
    frame = requestAnimationFrame(listen);
  }, 2100));
}

function finishKihap(score) {
  stopKihap();
  const best = Math.max(0, ...logOf("kihap").map((entry) => entry.s));
  logActivity("kihap", { s: score });
  kihap = { state: "done", score, best: score > best && best > 0 };
  if (score >= 60) sounds.fanfare();
  else sounds.finish();
  render();
  drawKihap();
  checkAchievements(true);
  document.querySelector('[data-kihap="go"]')?.focus();
}

document.querySelector("#kihap-area").addEventListener("click", (event) => {
  const button = event.target.closest("[data-kihap]");
  if (!button) return;
  if (button.dataset.kihap === "go") startKihap();
  if (button.dataset.kihap === "stop") {
    stopKihap();
    kihap = { state: "idle", score: 0 };
    drawKihap();
  }
});


/* 2. BEAT WORKOUT --------------------------------------------------------
   A drum beat plays, and you do one move on every beat. 8 moves, 16
   beats each. Every level is 10 beats per minute (BPM) faster.

   The drums are made with the Web Audio API, like the beeps in app.js:
   a "kick" is a low note that slides down, a "snare" and a "hi-hat"
   are bursts of noise (random numbers!) with the low sounds cut out. */

const BEAT_MOVES = [
  { name: "Jumping jacks", how: "One jack on every beat", demo: "jacks" },
  { name: "Punches", how: "Jab, cross, jab, cross: one punch every beat", demo: null },
  { name: "High knees", how: "One knee up on every beat", demo: "highKnees" },
  { name: "Squats", how: "Down on one beat, up on the next", demo: "squat" },
  { name: "Toe taps", how: "Tap one foot forward on every beat", demo: "toeTaps" },
  { name: "Front kicks", how: "Kick on one beat, put it down on the next. Switch legs!", demo: "frontKick" },
  { name: "Arm circles", how: "One big circle on every beat", demo: "armCircles" },
  { name: "Side shuffles", how: "Shuffle 4 beats one way, 4 beats back", demo: "lateralShuffle" },
  { name: "Skaters", how: "Hop side to side on every beat", demo: "skaters" },
  { name: "Mountain climbers", how: "One knee in on every beat", demo: "mountainClimbers" },
  { name: "Calf raises", how: "Up on one beat, down on the next", demo: "calfRaise" },
  { name: "Stance bounce", how: "Fighting stance! Bounce on every beat", demo: "stanceBounce" },
];
const BEAT_LEVELS = 8;
const BEAT_MOVES_PER_SONG = 8;
const BEAT_PER_MOVE = 16;
const BEAT_COUNT_IN = 4;

let beatGame = null; // { level, stop } while playing, or { level, finished: true }
let beatNoise = null;

function beatBpm(level) {
  return 80 + level * 10; // level 1 = 90 BPM, level 8 = 160 BPM
}

function beatUnlocked() {
  const kept = logOf("beat").filter((entry) => entry.kept).map((entry) => entry.lvl);
  return Math.min(BEAT_LEVELS, Math.max(0, ...kept) + 1);
}

function drum(kind, when) {
  if (!soundOn || !audio) return;
  if (!beatNoise) {
    beatNoise = audio.createBuffer(1, Math.floor(audio.sampleRate * 0.3), audio.sampleRate);
    const data = beatNoise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const gain = audio.createGain();
  gain.connect(audio.destination);
  if (kind === "kick") {
    const osc = audio.createOscillator();
    osc.frequency.setValueAtTime(150, when);
    osc.frequency.exponentialRampToValueAtTime(45, when + 0.12);
    gain.gain.setValueAtTime(0.7, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + 0.28);
    osc.connect(gain);
    osc.start(when);
    osc.stop(when + 0.3);
    return;
  }
  if (kind === "cue") {
    const osc = audio.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(1047, when);
    gain.gain.setValueAtTime(0.12, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + 0.25);
    osc.connect(gain);
    osc.start(when);
    osc.stop(when + 0.3);
    return;
  }
  // Snare and hi-hat: noise with the low sounds filtered out
  const noise = audio.createBufferSource();
  noise.buffer = beatNoise;
  const filter = audio.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = kind === "snare" ? 1200 : 7000;
  const length = kind === "snare" ? 0.16 : 0.04;
  gain.gain.setValueAtTime(kind === "snare" ? 0.35 : 0.12, when);
  gain.gain.exponentialRampToValueAtTime(0.001, when + length);
  noise.connect(filter).connect(gain);
  noise.start(when);
  noise.stop(when + length + 0.02);
}

function drawBeat() {
  const area = document.querySelector("#beat-area");
  const unlocked = beatUnlocked();
  if (beatGame && beatGame.finished) {
    area.innerHTML = `
      <div class="quiz-end">
        <p class="eyebrow">// song over</p>
        <p class="quiz-end__score">Level ${beatGame.level}</p>
        <p class="quiz-end__message">${beatBpm(beatGame.level)} beats per minute! Did you keep up with the beat?</p>
        <div class="quiz-end__buttons">
          <button class="button" type="button" data-beat="kept">Yes! 💪</button>
          <button class="button button--quiet" type="button" data-beat="missed">Not quite</button>
        </div>
      </div>`;
    return;
  }
  const levels = [];
  for (let level = 1; level <= BEAT_LEVELS; level++) {
    const open = level <= unlocked;
    levels.push(`<button class="beat-level ${open ? "" : "is-locked"}" type="button" data-beat-level="${level}" ${open ? "" : "disabled"} aria-label="Level ${level}, ${beatBpm(level)} beats per minute${open ? "" : ", locked"}">
      <strong>${open ? level : "🔒"}</strong><span>${beatBpm(level)} BPM</span></button>`);
  }
  area.innerHTML = `
    <div class="brain-start">
      <p class="brain-start__text">A drum beat plays. Do one move on every beat! Keep up with a level to unlock a faster one.</p>
      <div class="beat-levels">${levels.join("")}</div>
      ${soundOn ? "" : `<p class="kihap-problem">🔇 Your sound is off. Turn it on (the speaker at the top) to hear the beat!</p>`}
      <p class="quiz-total">${unlocked > 1 ? `Fastest you've kept up with: level ${unlocked - 1}` : "Start with level 1. About a minute and a half per song."}</p>
    </div>`;
}

function playBeat(level) {
  startAudio();
  const area = document.querySelector("#beat-area");
  const secondsPerBeat = 60 / beatBpm(level);
  const moves = quizShuffle(BEAT_MOVES).slice(0, BEAT_MOVES_PER_SONG); // quizShuffle is in quiz.js
  const total = BEAT_COUNT_IN + moves.length * BEAT_PER_MOVE;
  const start = performance.now() + 400;
  let scheduled = 0;
  let shown = -1;
  let frame = null;

  area.innerHTML = `
    <div class="game-play beat-play">
      <div class="quiz-top">
        <p class="quiz-where">🥁 Level ${level} · ${beatBpm(level)} BPM</p>
        <button class="text-button" type="button" data-beat="quit">Stop</button>
      </div>
      <div class="beat-stage">
        <div class="beat-demo" data-beat="demo"></div>
        <div class="beat-ball" data-beat="ball"><span data-beat="count">4</span></div>
      </div>
      <p class="beat-move" data-beat="move">Get ready!</p>
      <p class="beat-how" data-beat="how">Listen to the beat...</p>
      <div class="beat-dots" aria-hidden="true">${Array.from({ length: 8 }, () => "<span></span>").join("")}</div>
      <p class="beat-next" data-beat="next">First: ${moves[0].name}</p>
      <div class="beat-progress" aria-hidden="true"><span data-beat="fill"></span></div>
    </div>`;
  const $ = (name) => area.querySelector(`[data-beat="${name}"]`);

  // Plan the drums a little ahead of time, so they're right on the beat
  const scheduler = setInterval(() => {
    if (!audio) return;
    const now = performance.now();
    while (scheduled < total && start + scheduled * secondsPerBeat * 1000 < now + 150) {
      const when = audio.currentTime + Math.max(0, (start + scheduled * secondsPerBeat * 1000 - now) / 1000);
      const n = scheduled;
      if (n < BEAT_COUNT_IN) {
        drum("hat", when);
        if (n === BEAT_COUNT_IN - 1) drum("snare", when);
      } else {
        const inBar = (n - BEAT_COUNT_IN) % 4;
        drum("hat", when);
        if (inBar === 0 || inBar === 2) drum("kick", when);
        if (inBar === 1 || inBar === 3) drum("snare", when);
        if ((n - BEAT_COUNT_IN) % BEAT_PER_MOVE === 0) drum("cue", when);
      }
      scheduled += 1;
    }
  }, 25);

  function showBeat(n) {
    const ball = $("ball");
    ball.classList.remove("is-pulse");
    void ball.offsetWidth; // restarts the pulse animation
    ball.classList.add("is-pulse");
    if (n < BEAT_COUNT_IN) {
      $("count").textContent = BEAT_COUNT_IN - n;
      $("how").textContent = `Starting in ${BEAT_COUNT_IN - n}...`;
      return;
    }
    const inSong = n - BEAT_COUNT_IN;
    const moveIndex = Math.floor(inSong / BEAT_PER_MOVE);
    const inMove = inSong % BEAT_PER_MOVE;
    const move = moves[moveIndex];
    $("count").textContent = (inMove % 8) + 1;
    area.querySelectorAll(".beat-dots span").forEach((dot, i) => dot.classList.toggle("is-on", i === inMove % 8));
    $("fill").style.width = `${(inSong / (total - BEAT_COUNT_IN)) * 100}%`;
    if (inMove === 0) {
      $("move").textContent = move.name;
      $("how").textContent = move.how;
      const spot = $("demo");
      if (move.demo && DEMOS[move.demo]) {
        spot.replaceChildren(createDemo(move.demo, `Animation showing ${move.name}`));
        startDemoAnimation();
      } else {
        spot.replaceChildren();
      }
    }
    const next = moves[moveIndex + 1];
    $("next").textContent = inMove >= BEAT_PER_MOVE - 4 ? (next ? `Next: ${next.name}` : "Last few beats!") : `${move.name}: ${BEAT_PER_MOVE - inMove} beats left`;
  }

  function loop(now) {
    const n = Math.floor((now - start) / (secondsPerBeat * 1000));
    if (n >= total) {
      stop();
      beatGame = { level, finished: true, beats: total - BEAT_COUNT_IN };
      sounds.finish();
      drawBeat();
      document.querySelector('[data-beat="kept"]')?.focus();
      return;
    }
    if (n >= 0 && n !== shown) {
      shown = n;
      showBeat(n);
    }
    frame = requestAnimationFrame(loop);
  }
  frame = requestAnimationFrame(loop);

  function stop() {
    clearInterval(scheduler);
    cancelAnimationFrame(frame);
  }
  beatGame = { level, stop };
}

function stopBeat() {
  if (beatGame && beatGame.stop) beatGame.stop();
  beatGame = null;
}

document.querySelector("#beat-area").addEventListener("click", (event) => {
  const pick = event.target.closest("[data-beat-level]");
  if (pick && !pick.disabled) {
    playBeat(Number(pick.dataset.beatLevel));
    return;
  }
  const button = event.target.closest("[data-beat]");
  if (!button) return;
  const action = button.dataset.beat;
  if (action === "quit") {
    stopBeat();
    drawBeat();
  }
  if ((action === "kept" || action === "missed") && beatGame && beatGame.finished) {
    const level = beatGame.level;
    const wasUnlocked = beatUnlocked();
    logActivity("beat", { lvl: level, kept: action === "kept", reps: Math.round(beatGame.beats / 2) });
    beatGame = null;
    if (action === "kept") {
      sounds.fanfare();
      showToast(beatUnlocked() > wasUnlocked ? `🥁 Level ${level + 1} unlocked: ${beatBpm(level + 1)} BPM!` : "🥁 Nice rhythm! +20 XP");
    } else {
      sounds.done();
      showToast("🥁 Good try! You still moved. +20 XP");
    }
    render();
    drawBeat();
    checkAchievements(true);
  }
});


/* 3. OBSTACLE COURSE MAKER -----------------------------------------------
   It picks random stations for a course, outside or inside. Then the
   stopwatch times you, station by station. Run the same course again
   to beat your time!                                                  */

const COURSE_STATIONS = {
  outside: [
    { icon: "🐻", name: "Bear crawl", how: "Hands and feet, bottom up, for 10 big steps" },
    { icon: "🐸", name: "Frog jumps", how: "5 big frog jumps forward" },
    { icon: "🦀", name: "Crab walk", how: "Belly up, walk 10 steps backward" },
    { icon: "〰️", name: "Zig-zag run", how: "Weave through 5 cones (or shoes!)" },
    { icon: "⚽", name: "Dribble", how: "Dribble a ball around a tree or chair and back" },
    { icon: "🦩", name: "Flamingo", how: "Balance on one foot and count to 10" },
    { icon: "🥋", name: "Kick station", how: "5 front kicks on each leg" },
    { icon: "🦘", name: "Kangaroo hops", how: "10 hops with your feet together" },
    { icon: "⭐", name: "Star jumps", how: "5 star jumps: arms and legs out wide!" },
    { icon: "🏃", name: "Sprint", how: "Sprint to the fence (or a tree) and back" },
    { icon: "🎯", name: "Target toss", how: "Toss a ball into a bucket. Keep trying until you make 2!" },
    { icon: "🐍", name: "Army crawl", how: "Crawl on your belly under a rope or stick, for 5 steps" },
    { icon: "🪵", name: "Log roll", how: "Roll sideways 3 times on the grass" },
    { icon: "🦵", name: "Lunge walk", how: "8 lunges walking forward" },
    { icon: "🧱", name: "Plank", how: "Hold a plank for 15 seconds" },
  ],
  inside: [
    { icon: "🛋️", name: "Pillow hops", how: "Jump over 3 pillows in a row (not on the stairs!)" },
    { icon: "🐻", name: "Bear crawl", how: "Bear crawl across the room" },
    { icon: "🦩", name: "Flamingo", how: "Balance on one foot and count to 10" },
    { icon: "🧦", name: "Sock basketball", how: "Throw rolled-up socks into a laundry basket. Make 3!" },
    { icon: "🥋", name: "Kick station", how: "5 front kicks on each leg (away from lamps!)" },
    { icon: "🦀", name: "Crab walk", how: "Crab walk across the room" },
    { icon: "🧱", name: "Plank", how: "Hold a plank for 15 seconds" },
    { icon: "🍳", name: "Spoon walk", how: "Carry a ball of socks on a spoon across the room" },
    { icon: "🪑", name: "Chair squats", how: "Sit down on a chair and stand back up 8 times" },
    { icon: "🎈", name: "Keep it up", how: "Keep a balloon in the air for 10 taps" },
    { icon: "🕷️", name: "Spider push-ups", how: "5 push-ups (on your knees is OK)" },
    { icon: "⭐", name: "Star jumps", how: "5 star jumps" },
    { icon: "🐛", name: "Inchworms", how: "3 inchworms: walk your hands out to a plank and back" },
  ],
};
const COURSE_SIZES = [4, 6, 8];

let course = null; // { where, ids, best } (saved)
let courseRun = null; // { start, splits, timer } while running
let courseWhere = "outside";
let courseSize = 6;

function courseStations(saved) {
  return saved.ids.map((id) => COURSE_STATIONS[saved.where][id]).filter(Boolean);
}

function makeCourse() {
  const list = COURSE_STATIONS[courseWhere];
  const ids = quizShuffle(list.map((_, i) => i)).slice(0, Math.min(courseSize, list.length));
  course = { where: courseWhere, ids, best: null };
  saveJSON("levelUp.course", course);
}

function stopwatchText(ms) {
  const tenths = Math.floor(ms / 100);
  const minutes = Math.floor(tenths / 600);
  const seconds = Math.floor((tenths % 600) / 10);
  return `${minutes}:${String(seconds).padStart(2, "0")}.${tenths % 10}`;
}

function drawCourse() {
  const area = document.querySelector("#course-area");
  const pickers = `
    <div class="course-pickers">
      <div class="lab-chips" role="group" aria-label="Where">
        <button class="lab-chip" type="button" data-course-where="outside" aria-pressed="${courseWhere === "outside"}">🌳 Outside</button>
        <button class="lab-chip" type="button" data-course-where="inside" aria-pressed="${courseWhere === "inside"}">🏠 Inside</button>
      </div>
      <div class="lab-chips" role="group" aria-label="How many stations">
        ${COURSE_SIZES.map((n) => `<button class="lab-chip" type="button" data-course-size="${n}" aria-pressed="${courseSize === n}">${n} stations</button>`).join("")}
      </div>
    </div>`;
  if (!course) {
    area.innerHTML = `
      <div class="brain-start">
        <p class="brain-start__text">It makes a random obstacle course for you. Then race the stopwatch!</p>
        ${pickers}
        <button class="button" type="button" data-course="make">🎲 Make my course</button>
        <p class="game-help">Clear some space first, and ask a grown-up where it's OK to set up.</p>
      </div>`;
    return;
  }
  const stations = courseStations(course);
  const running = Boolean(courseRun);
  const at = running ? courseRun.splits.length : -1;
  const list = stations.map((station, i) => {
    let state = "";
    let time = "";
    if (running && i < at) {
      state = "is-done";
      time = stopwatchText(courseRun.splits[i] - (i ? courseRun.splits[i - 1] : 0));
    }
    if (running && i === at) state = "is-now";
    return `<li class="course-station ${state}">
      <span class="course-station__n">${i + 1}</span>
      <span class="course-station__icon" aria-hidden="true">${station.icon}</span>
      <span class="course-station__text"><strong>${station.name}</strong> ${station.how}</span>
      <span class="course-station__time">${time}</span>
    </li>`;
  }).join("");
  area.innerHTML = `
    <p class="quiz-total">${course.where === "outside" ? "🌳 Outside" : "🏠 Inside"} course · ${plural(stations.length, "station")}${course.best ? ` · Best: ${stopwatchText(course.best)}` : ""}</p>
    <ol class="course-list">${list}</ol>
    ${running ? `
      <p class="course-clock" data-course="clock" aria-live="off">0:00.0</p>
      <div class="brain-start__buttons">
        <button class="button game-button" type="button" data-course="next">${at === stations.length - 1 ? "🏁 Finished!" : `✓ Station ${at + 1} done`}</button>
        <button class="text-button" type="button" data-course="cancel">Stop</button>
      </div>` : `
      ${course.last ? `<p class="course-result">${course.last.best ? "🏆 NEW BEST TIME! " : "🏁 "}${stopwatchText(course.last.time)}</p>` : ""}
      <div class="brain-start__buttons">
        <button class="button" type="button" data-course="go">▶ Start the stopwatch</button>
        <button class="button button--quiet" type="button" data-course="new">🎲 New course</button>
      </div>
      <details class="extra">
        <summary>Change the course</summary>
        ${pickers}
      </details>`}`;
  if (running) tickCourse();
}

function tickCourse() {
  if (!courseRun) return;
  const clock = document.querySelector('[data-course="clock"]');
  if (clock) clock.textContent = stopwatchText(Date.now() - courseRun.start);
}

document.querySelector("#course-area").addEventListener("click", (event) => {
  const where = event.target.closest("[data-course-where]");
  if (where) {
    courseWhere = where.dataset.courseWhere;
    if (course) makeCourse();
    drawCourse();
    return;
  }
  const size = event.target.closest("[data-course-size]");
  if (size) {
    courseSize = Number(size.dataset.courseSize);
    if (course) makeCourse();
    drawCourse();
    return;
  }
  const button = event.target.closest("[data-course]");
  if (!button) return;
  const action = button.dataset.course;
  if (action === "make" || action === "new") {
    makeCourse();
    sounds.up();
  }
  if (action === "go" && course) {
    startAudio();
    sounds.up();
    course.last = null;
    courseRun = { start: Date.now(), splits: [], timer: setInterval(tickCourse, 100) };
  }
  if (action === "next" && courseRun) {
    courseRun.splits.push(Date.now() - courseRun.start);
    sounds.count();
    if (courseRun.splits.length >= course.ids.length) {
      const time = courseRun.splits[courseRun.splits.length - 1];
      clearInterval(courseRun.timer);
      courseRun = null;
      const best = !course.best || time < course.best;
      if (best) course.best = time;
      course.last = { time, best: best && logOf("course").length > 0 };
      saveJSON("levelUp.course", { where: course.where, ids: course.ids, best: course.best });
      logActivity("course", { n: course.ids.length, ms: time, reps: course.ids.length * 8 });
      sounds.fanfare();
      confetti();
      render();
      checkAchievements(true);
    }
  }
  if (action === "cancel" && courseRun) {
    clearInterval(courseRun.timer);
    courseRun = null;
  }
  drawCourse();
  document.querySelector("#course-area [data-course='next'], #course-area [data-course='go'], #course-area [data-course='make']")?.focus();
});


/* 4. SPEED LAB (Sports tab) ----------------------------------------------------
   Time your sprints! A grown-up taps START (it counts down 3, 2, 1,
   GO!) and STOP when you cross the finish line. The chart shows if
   you're getting faster (lower is better).                          */

const SPEED_TESTS = [
  { id: "dash20", icon: "⚡", name: "20-yard dash", setup: "Mark a start line and a finish line 20 big steps apart (a grown-up's big step is about 1 yard). Run past the finish line as fast as you can!" },
  { id: "shuttle", icon: "↔️", name: "5-10-5 shuttle", setup: "Put 3 markers in a line, 5 big steps apart. Start at the middle one. Sprint to one end and touch the line, sprint all the way to the other end and touch it, then sprint back through the middle." },
  { id: "dash40", icon: "🚀", name: "40-yard dash", setup: "Like the 20-yard dash, but 40 big steps! This is the one pro football players do." },
];

let speedTest = SPEED_TESTS[0].id;
let speedRun = null; // { state: "count" | "go", start, timers }
let speedLast = null; // the last time, to show

function speedTimes(id) {
  return logOf("speed").filter((entry) => entry.k === id);
}

function speedText(ms) {
  return `${(ms / 1000).toFixed(2)}s`;
}

function drawSpeed() {
  const area = document.querySelector("#speed-area");
  const test = SPEED_TESTS.find((item) => item.id === speedTest);
  const times = speedTimes(test.id);
  const best = times.length ? Math.min(...times.map((entry) => entry.ms)) : null;
  const tabs = `<div class="lab-chips" role="group" aria-label="Which test">${SPEED_TESTS.map((item) => `
    <button class="lab-chip" type="button" data-speed-test="${item.id}" aria-pressed="${item.id === speedTest}" ${speedRun ? "disabled" : ""}>${item.icon} ${item.name}</button>`).join("")}</div>`;
  if (speedRun) {
    area.innerHTML = `
      ${tabs}
      <p class="speed-clock ${speedRun.state === "go" ? "is-go" : ""}" data-speed="clock" aria-live="off">${speedRun.state === "go" ? "0.00" : "Ready..."}</p>
      <button class="button speed-stop" type="button" data-speed="stop" ${speedRun.state === "go" ? "" : "disabled"}>STOP</button>
      <button class="text-button" type="button" data-speed="cancel">Cancel</button>`;
    return;
  }
  area.innerHTML = `
    ${tabs}
    <p class="speed-setup">${test.setup}</p>
    <div class="tiles speed-tiles">
      <div class="tile"><span class="tile__value">${best ? speedText(best) : "–"}</span><span class="tile__name">Best time</span></div>
      <div class="tile"><span class="tile__value">${times.length}</span><span class="tile__name">Runs</span></div>
    </div>
    ${speedLast ? `<p class="course-result">${speedLast.best ? "🏆 NEW PERSONAL BEST! " : "⏱️ "}${speedText(speedLast.ms)}
      <button class="text-button" type="button" data-speed="undo">That one didn't count</button></p>` : ""}
    <button class="button game-button" type="button" data-speed="start">▶ START (3, 2, 1, GO!)</button>
    <p class="game-help">A grown-up taps START, then STOP when you cross the finish line.</p>
    <div class="chart-box" id="speed-chart"></div>
    <div id="speed-chart-table"></div>`;
  // One dot a day: your best time that day
  const byDay = {};
  for (const entry of times) byDay[entry.d] = Math.min(byDay[entry.d] ?? Infinity, entry.ms / 1000);
  const points = Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).slice(-20).map(([date, value]) => ({ date, value }));
  lineChart(document.querySelector("#speed-chart"), document.querySelector("#speed-chart-table"), {
    points,
    format: (v) => `${v.toFixed(2)}s`,
    valueName: "Time",
    label: `Line chart of your best ${test.name} time each day. Lower is faster.`,
    empty: "Your times show up here. Lower is faster!",
    lowerIsBetter: true,
  });
}

function speedClock() {
  if (!speedRun || speedRun.state !== "go") return;
  const clock = document.querySelector('[data-speed="clock"]');
  if (clock) clock.textContent = ((performance.now() - speedRun.start) / 1000).toFixed(2);
  speedRun.frame = requestAnimationFrame(speedClock);
}

function cancelSpeed() {
  if (!speedRun) return;
  speedRun.timers.forEach(clearTimeout);
  cancelAnimationFrame(speedRun.frame);
  speedRun = null;
}

document.querySelector("#speed-area").addEventListener("click", (event) => {
  const pick = event.target.closest("[data-speed-test]");
  if (pick && !speedRun) {
    speedTest = pick.dataset.speedTest;
    speedLast = null;
    drawSpeed();
    return;
  }
  const button = event.target.closest("[data-speed]");
  if (!button) return;
  const action = button.dataset.speed;
  if (action === "start" && !speedRun) {
    startAudio();
    speedLast = null;
    speedRun = { state: "count", start: 0, timers: [], frame: null };
    drawSpeed();
    const clock = () => document.querySelector('[data-speed="clock"]');
    [3, 2, 1].forEach((n, i) => speedRun.timers.push(setTimeout(() => {
      if (clock()) clock().textContent = n;
      sounds.count();
    }, 600 + i * 1000)));
    speedRun.timers.push(setTimeout(() => {
      speedRun.state = "go";
      speedRun.start = performance.now();
      beep(1047, 0.4, 0, 0.2); // GO!
      drawSpeed();
      document.querySelector('[data-speed="stop"]')?.focus();
      speedClock();
    }, 3600));
    return;
  }
  if (action === "stop" && speedRun && speedRun.state === "go") {
    const ms = Math.round(performance.now() - speedRun.start);
    cancelSpeed();
    const before = speedTimes(speedTest);
    const best = before.length > 0 && ms < Math.min(...before.map((entry) => entry.ms));
    logActivity("speed", { k: speedTest, ms });
    speedLast = { ms, best };
    best ? sounds.fanfare() : sounds.finish();
    render();
    checkAchievements(true);
  }
  if (action === "cancel") cancelSpeed();
  if (action === "undo" && speedLast) {
    // Take the last run back out of the activity log (like a false start)
    let index = -1;
    activityLog.forEach((entry, i) => {
      if (entry.t === "speed" && entry.k === speedTest && entry.ms === speedLast.ms) index = i;
    });
    if (index >= 0) {
      activityLog.splice(index, 1);
      save("levelUp.log", JSON.stringify(activityLog));
    }
    speedLast = null;
    render();
  }
  drawSpeed();
  document.querySelector('#speed-area [data-speed="start"]')?.focus();
});


/* 5. PLUGGING IN (see hooks.js) ------------------------------------------------- */

addPagePart("arcade", () => {
  if (kihap.state === "idle" || kihap.state === "done" || ["nomic", "denied", "error"].includes(kihap.state)) drawKihap();
  if (!beatGame) drawBeat();
  if (!courseRun) drawCourse();
});
addPagePart("sports", () => {
  if (!speedRun) drawSpeed();
});

// Leaving the Arcade stops the microphone and the drums
document.addEventListener("tabshown", (event) => {
  if (event.detail === "arcade") return;
  if (kihapStop) {
    stopKihap();
    kihap = { state: "idle", score: 0 };
  }
  if (beatGame && beatGame.stop) stopBeat();
});

addSavedData("levelUp.course", () => {
  const saved = loadJSON("levelUp.course", null);
  course = saved && Array.isArray(saved.ids) && COURSE_STATIONS[saved.where] ? saved : null;
  if (course) courseWhere = course.where;
});

addXP("kihap", () => 10, 3);
addXP("beat", () => 20, 3);
addXP("course", (e) => 10 + e.n * 3, 2);
addXP("speed", () => 10, 3);

addXPRule("Kihap Meter", "+10");
addXPRule("Beat Workout song", "+20");
addXPRule("Obstacle course", "+10, +3 per station");
addXPRule("Speed Lab run", "+10");

addBadge({ id: "thunderVoice", icon: "🗣️", name: "Thunder Voice", how: "Score 90 or more on the Kihap Meter", earned: () => logOf("kihap").some((e) => e.s >= 90) });
addBadge({ id: "rhythmMaster", icon: "🥁", name: "Rhythm Master", how: `Keep up with Beat Workout level ${BEAT_LEVELS}`, earned: () => logOf("beat").some((e) => e.kept && e.lvl >= BEAT_LEVELS) });
addBadge({ id: "courseCrusher", icon: "🏁", name: "Course Crusher", how: "Finish 5 obstacle courses", earned: () => logOf("course").length >= 5 });
addBadge({
  id: "fasterNow", icon: "💨", name: "Faster Than Before", how: "Beat your own best time in the Speed Lab",
  earned: () => SPEED_TESTS.some((test) => {
    const times = speedTimes(test.id).map((e) => e.ms);
    return times.some((ms, i) => i > 0 && ms < Math.min(...times.slice(0, i)));
  }),
});
