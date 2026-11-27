/* =============================================================
   extra.js: the Extra tab
   -------------------------------------------------------------
   Bonus workouts you can do any time, on top of the daily one.
   Pick one by what you want: energy, abs, strength, legs, speed,
   your sports, test prep, stretching or something quick.

   They use the same exercises as your plan (EXERCISES in plan.js),
   so they get a little harder every week. In expert mode they're
   way harder: 5 levels ahead, an extra round and shorter rests,
   just like the daily workout.

   Want your own? Copy a workout below and change it. The moves are
   the names from EXERCISES in plan.js.

   This file loads before app.js, so it only uses app.js's
   functions inside its own functions, never right away.
   ============================================================= */

const EXTRA_GOALS = [
  ["all", "All"],
  ["energy", "⚡ Energy"],
  ["abs", "🔥 Abs & core"],
  ["strength", "💪 Strength"],
  ["legs", "🦵 Legs"],
  ["speed", "🏃 Speed & cardio"],
  ["sport", "🥋 My sports"],
  ["test", "🏅 Test prep"],
  ["stretch", "🧘 Stretch"],
  ["quick", "⏱️ Quick"],
];

// style "rest" means a stretching session: no warm-up, and expert mode doesn't change it
const EXTRA_WORKOUTS = [
  {
    id: "energy-blast", name: "Wake-Up Energy Blast", icon: "⚡", goals: ["energy"],
    what: "Gets your heart pumping and wakes up your whole body. Great in the morning, or whenever you feel sleepy.",
    works: "Heart, lungs and whole body",
    rounds: 2, rest: 20, moves: ["jacks", "highKnees", "squat", "mountainClimbers", "skaters"],
  },
  {
    id: "homework-break", name: "Homework Break", icon: "📚", goals: ["energy", "quick"],
    what: "A quick reset when your brain feels foggy. Moving sends more blood (and oxygen) to your brain!",
    works: "Whole body",
    rounds: 1, rest: 15, moves: ["jacks", "squat", "shoulderTaps", "highKnees"],
  },
  {
    id: "cardio-crusher", name: "Cardio Crusher", icon: "❤️", goals: ["energy", "speed"],
    what: "Builds stamina, so you still have energy at the end of a game or a sparring round.",
    works: "Heart, lungs and whole body",
    rounds: 3, rest: 20, moves: ["burpee", "jacks", "mountainClimbers", "highKnees"],
  },
  {
    id: "ab-attack", name: "Ab Attack", icon: "🔥", goals: ["abs"],
    what: "Builds strong abs for powerful kicks, hard shots and fast swimming.",
    works: "Abs and obliques (the sides of your belly)",
    rounds: 2, rest: 20, moves: ["curlup", "bicycle", "plank", "deadBug", "flutterKicks"],
  },
  {
    id: "core-steel", name: "Core of Steel", icon: "🛡️", goals: ["abs"],
    what: "Strengthens your whole core, front AND back, for better balance and fewer injuries.",
    works: "Abs, lower back and sides",
    rounds: 2, rest: 25, moves: ["plank", "sidePlank", "mountainClimbers", "superman", "deadBug"],
  },
  {
    id: "pushup-power", name: "Push-up Power", icon: "💪", goals: ["strength", "test"],
    what: "Builds your chest, shoulders and arms. Great practice for the push-up test!",
    works: "Chest, shoulders and triceps (the back of your arms)",
    rounds: 3, rest: 30, moves: ["pushup", "shoulderTaps", "dips", "plank"],
  },
  {
    id: "upper-body", name: "Upper Body Builder", icon: "🏋️", goals: ["strength"],
    what: "Stronger arms, shoulders and back for blocks, throw-ins and swim strokes.",
    works: "Arms, shoulders and upper back",
    rounds: 2, rest: 30, moves: ["pushup", "ytw", "dips", "inchworm", "superman"],
  },
  {
    id: "quad-burner", name: "Quad Burner", icon: "🦵", goals: ["legs"],
    what: "Works the big muscles on the front of your thighs (your quads) for jumping, kicking and sprinting power.",
    works: "Quads, plus your glutes",
    rounds: 3, rest: 25, moves: ["squat", "lunge", "wallSit", "skaters"],
  },
  {
    id: "leg-day", name: "Leg Day", icon: "🍗", goals: ["legs", "strength"],
    what: "Strong legs from top to bottom, for every sport you play.",
    works: "Quads, hamstrings, glutes and calves",
    rounds: 2, rest: 30, moves: ["squat", "bridge", "lunge", "calfRaise", "wallSit"],
  },
  {
    id: "jump-higher", name: "Jump Higher", icon: "🚀", goals: ["legs", "speed"],
    what: "Explosive power for jumping kicks, fast starts and quick feet.",
    works: "Calves, quads and glutes",
    rounds: 2, rest: 30, moves: ["squat", "streamlineJumps", "lineHops", "calfRaise"],
  },
  {
    id: "speed-agility", name: "Speed & Agility", icon: "🏃", goals: ["speed", "sport"],
    what: "Quicker feet and faster changes of direction, for soccer and sparring.",
    works: "Legs, balance and reaction time",
    rounds: 2, rest: 25, moves: ["quickFeet", "lateralShuffle", "skaters", "sprintTurn", "highKnees"],
  },
  {
    id: "soccer-circuit", name: "Soccer Skills Circuit", icon: "⚽", goals: ["sport"],
    what: "Ball touches and quick feet. You'll need a ball!",
    works: "Ball control, footwork and agility",
    rounds: 2, rest: 20, moves: ["toeTaps", "quickFeet", "lateralShuffle", "sprintTurn"],
  },
  {
    id: "tkd-power", name: "Taekwondo Kick Power", icon: "🥋", goals: ["sport"],
    what: "Balance and power for higher, stronger kicks.",
    works: "Hips, legs, core and balance",
    rounds: 2, rest: 20, moves: ["stanceBounce", "chamberHold", "slowKicks", "kickCombo", "balanceReach"],
  },
  {
    id: "swim-strength", name: "Swim Strength", icon: "🏊", goals: ["sport", "strength"],
    what: "Strong shoulders and a tight core for better strokes (like butterfly!).",
    works: "Shoulders, upper back and core",
    rounds: 2, rest: 20, moves: ["streamlineHold", "ytw", "flutterKicks", "superman", "plank"],
  },
  {
    id: "test-prep", name: "Test Prep: Push-ups & Curl-ups", icon: "🏅", goals: ["test", "abs", "strength"],
    what: "Practice the exact moves from your gym test, plus helper moves that make them easier.",
    works: "Chest, arms and abs",
    rounds: 2, rest: 45, moves: ["pushup", "curlup", "plank", "shoulderTaps", "bicycle"],
  },
  {
    id: "full-body-5", name: "5-Minute Full Body", icon: "⏱️", goals: ["quick"],
    what: "Short on time? Hit every muscle in about 5 minutes.",
    works: "Whole body",
    rounds: 1, rest: 10, moves: ["jacks", "pushup", "squat", "plank"],
  },
  {
    id: "stretch-recover", name: "Stretch & Recover", icon: "🧘", goals: ["stretch"], style: "rest",
    what: "Helps sore muscles feel better and keeps you flexible. Perfect for rest days.",
    works: "Back, hips and legs",
    rounds: 1, rest: 0, moves: ["catCow", "childsPose", "hamstring", "quad", "figure4", "butterfly"],
  },
  {
    id: "kick-flex", name: "Flexibility for Kicks", icon: "🤸", goals: ["stretch", "sport"], style: "rest",
    what: "Loosens your hips and legs for higher kicks. Best after a workout, while you're warm.",
    works: "Hamstrings, hips and inner thighs",
    rounds: 1, rest: 0, moves: ["hamstring", "sideLunge", "butterfly", "quad", "figure4"],
  },
  {
    id: "bedtime", name: "Bedtime Wind-Down", icon: "🌙", goals: ["stretch", "quick"], style: "rest",
    what: "Slow, calm stretches to help you relax before bed. Breathe in and out slowly!",
    works: "Whole body (and your brain)",
    rounds: 1, rest: 0, moves: ["catCow", "childsPose", "butterfly", "figure4"],
  },
];

let extraFilter = "all"; // the goal you picked (this device only)
let openExtraId = EXTRA_WORKOUTS[0].id;

// An extra workout at your level (and harder in expert mode), ready for the voice coach
function extraPlan(workout) {
  const style = workout.style || "circuit";
  const expert = isExpert && style !== "rest";
  const level = expert ? Math.min(MAX_LEVEL, levelOf(today) + EXPERT.levelBoost) : levelOf(today);
  let rounds = workout.rounds;
  let rest = workout.rest;
  if (expert) {
    rounds = Math.min(EXPERT.maxRounds, rounds + EXPERT.extraRounds);
    rest = Math.max(EXPERT.minRest, rest - EXPERT.restCut);
  }
  const moves = workout.moves.map((id) => moveFor(id, level)); // in app.js
  const plan = {
    title: workout.name, style, level, expert, rounds, rest, moves,
    sportMoves: [], sport: null,
    logType: "extra", logExtra: { workout: workout.id },
    finishTitle: "Extra workout complete!",
    finishText: "Bonus workout DONE! That's above and beyond. 💪",
  };
  plan.minutes = estimateMinutes(plan); // in app.js
  plan.reps = moves.reduce((sum, move) => sum + repsInMove(move), 0) * rounds; // for the boss (boss.js)
  return plan;
}

function renderExtra() {
  // The banner: are these harder right now?
  document.querySelector("#extra-mode").innerHTML = isExpert
    ? `<strong>🔥 Expert mode is ON:</strong> every workout here is way harder (5 levels ahead, an extra round and shorter rests).`
    : `These match your level (week ${weekOf(today)}). Turn on <strong>Expert mode</strong> (the flame at the top) to make them way harder!`;
  document.querySelector("#extra-mode").classList.toggle("is-expert", isExpert);

  document.querySelector("#extra-goals").innerHTML = EXTRA_GOALS.map(([id, name]) => `
    <button class="lab-chip" type="button" data-extra-goal="${id}" aria-pressed="${id === extraFilter}">${name}</button>`).join("");

  const done = logOf("extra");
  const list = EXTRA_WORKOUTS.filter((w) => extraFilter === "all" || w.goals.includes(extraFilter));
  if (!list.some((w) => w.id === openExtraId)) openExtraId = list[0].id;

  document.querySelector("#extra-cards").innerHTML = list.map((workout) => {
    const plan = extraPlan(workout);
    const times = done.filter((e) => e.workout === workout.id).length;
    const goal = EXTRA_GOALS.find(([id]) => id === workout.goals[0])[1];
    return `
      <button class="extra-card" type="button" data-extra-open="${workout.id}" aria-pressed="${workout.id === openExtraId}">
        <span class="extra-card__top"><span class="extra-card__icon" aria-hidden="true">${workout.icon}</span><span class="extra-card__goal">${goal}</span></span>
        <span class="extra-card__name">${workout.name}</span>
        <span class="extra-card__meta">About ${plan.minutes} min · ${plan.moves.length} moves${times ? ` · done ${times}×` : ""}</span>
      </button>`;
  }).join("");

  renderExtraDetail();
}

// The workout you opened: what it does, and every move
function renderExtraDetail() {
  const workout = EXTRA_WORKOUTS.find((w) => w.id === openExtraId);
  const plan = extraPlan(workout);
  const roundsText = plan.style === "rest"
    ? "Go slow and breathe"
    : `${plan.rounds} ${plan.rounds === 1 ? "round" : "rounds"} · ${plan.rest} sec rest between moves`;

  document.querySelector("#extra-detail").innerHTML = `
    <div class="panel__head">
      <h3 class="lesson__title">${workout.icon} ${workout.name}</h3>
      ${plan.expert ? `<span class="expert-tag">🔥 Expert</span>` : ""}
    </div>
    <p class="panel__lead">${workout.what}</p>
    <p class="extra-works"><strong>Works:</strong> ${workout.works}</p>
    <p class="extra-meta">About ${plan.minutes} min · ${roundsText}</p>
    <ol class="extra-moves">
      ${plan.moves.map((move, i) => {
        const demo = demoKeyFor(move); // in demos.js
        return `
          <li class="extra-move">
            <div class="extra-move__top">
              <span class="extra-move__name">${move.name}</span>
              <span class="extra-move__amount">${amountText(move.amount, move.unit, move.each)}</span>
            </div>
            <p class="extra-move__how">${move.how}</p>
            ${demo ? `<button class="demo-button" type="button" data-extra-demo="${i}"><span data-demo-icon="${demo}"></span>Show me</button>` : ""}
          </li>`;
      }).join("")}
    </ol>
    <div class="lesson__buttons">
      <button class="button" type="button" data-extra-start>▶ Start with the voice coach</button>
      <span class="page-actions__note">+${XP_RULES.extra} XP when you finish (2 a day)</span>
    </div>`;
  fillDemoIcons(document.querySelector("#extra-detail"));
}

document.querySelector("#extra").addEventListener("click", (event) => {
  const goal = event.target.closest("[data-extra-goal]");
  if (goal) {
    extraFilter = goal.dataset.extraGoal;
    renderExtra();
    document.querySelector(`[data-extra-goal="${extraFilter}"]`).focus();
    return;
  }

  const open = event.target.closest("[data-extra-open]");
  if (open) {
    openExtraId = open.dataset.extraOpen;
    renderExtra();
    document.querySelector("#extra-detail").scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  const workout = EXTRA_WORKOUTS.find((w) => w.id === openExtraId);
  const demoButton = event.target.closest("[data-extra-demo]");
  if (demoButton) {
    const move = extraPlan(workout).moves[Number(demoButton.dataset.extraDemo)];
    openDemo(demoKeyFor(move), move.name, move.how);
  }

  if (event.target.closest("[data-extra-start]")) {
    openCoach(today, extraPlan(workout)); // in coach.js: warm-up, the rounds, then a cool-down
  }
});
