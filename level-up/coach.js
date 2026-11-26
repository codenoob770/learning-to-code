/* =============================================================
   coach.js: guided workout mode
   -------------------------------------------------------------
   Press "Start guided workout" and the coach walks you through
   every step: warm-up, each move, the rests, sport skills and the
   cool-down. It says each step out loud and runs the timers, so you
   can prop up your iPad and never touch it mid-set.

   1. Turning a day's plan into a list of steps
   2. Opening, closing and finishing
   3. Showing a step
   4. Timers and buttons
   5. The voice

   This file loads before app.js, so it only uses app.js's
   functions inside its own functions, never right away.
   ============================================================= */

const coachBox = document.querySelector("#coach");
const coachTime = document.querySelector("#coach-time");
const coachMain = document.querySelector("#coach-main");

let coach = null; // the workout in progress, or null when the coach is closed

function coachIsOpen() {
  return coach !== null;
}


/* 1. TURNING A DAY'S PLAN INTO A LIST OF STEPS ---------------------- */

function coachSteps(plan) {
  const steps = [];

  function addMove(section, item) {
    const timed = isTimed(item.unit);
    const seconds = timed ? toSeconds(item.amount, item.unit) : null;
    if (timed && item.each) {
      // A timed move on each side becomes two steps, one per side
      for (const side of [1, 2]) {
        steps.push({ section, name: item.name, how: item.how || "", label: `${item.each} ${side} of 2`, seconds });
      }
    } else {
      steps.push({ section, name: item.name, how: item.how || "", label: amountText(item.amount, item.unit, item.each), seconds });
    }
  }

  function addRest(seconds, name) {
    steps.push({ section: "Rest", name, how: "Shake it out and breathe.", label: "", seconds, isRest: true });
  }

  if (plan.style !== "rest") WARM_UP.forEach((item) => addMove("Warm-up", item));

  for (let round = 1; round <= plan.rounds; round++) {
    const section = plan.rounds > 1 ? `Round ${round} of ${plan.rounds}` : plan.title;
    plan.moves.forEach((move, i) => {
      addMove(section, move);
      if (i < plan.moves.length - 1 && plan.rest > 0) addRest(plan.rest, "Rest");
    });
    if (round < plan.rounds) addRest(60, "Rest before the next round");
  }

  if (plan.sport) plan.sportMoves.forEach((move) => addMove(`Sport skills · ${plan.sport.name}`, move));
  if (plan.style !== "rest") COOL_DOWN.forEach((item) => addMove("Cool-down", item));
  return steps;
}


/* 2. OPENING, CLOSING AND FINISHING -------------------------------- */

function openCoach(date) {
  stopTimer(); // the little timer bar isn't needed in here
  const plan = planFor(date);
  coach = {
    date,
    plan,
    steps: coachSteps(plan),
    index: 0,
    startedAt: Date.now(),
    endsAt: 0,
    pausedLeft: null,
    lastSecond: null,
    readyUntil: 0,
    interval: null,
    finished: false,
  };
  coachVoiceOn = load("levelUp.voice", "on") === "on";
  showVoiceSetting();
  startAudio();
  keepScreenOn();
  coachBox.hidden = false;
  document.body.classList.add("coach-open");
  say(`Let's go! ${plan.title}. ${coach.steps.length} steps.`, () => showStep());
}

function closeCoach() {
  if (!coach) return;
  clearInterval(coach.interval);
  coach = null;
  coachBox.hidden = true;
  document.body.classList.remove("coach-open");
  stopTalking();
  letScreenSleep();
  document.querySelector("#start-coach")?.focus();
}

function finishCoach() {
  clearInterval(coach.interval);
  coach.finished = true;
  const minutes = Math.max(1, Math.round((Date.now() - coach.startedAt) / 60000));
  const key = toKey(coach.date);
  const canMark = coach.date <= today;
  const xpBefore = trophyStats().xp;

  // Finishing counts as marking the workout done
  if (canMark && !doneDays.has(key)) {
    doneDays.add(key);
    missedDays.delete(key);
    if (coach.plan.expert) expertDays.add(key);
    saveDoneDays();
    saveMissedDays();
    save("levelUp.expertDays", JSON.stringify([...expertDays]));
    render();
  }
  const xpGained = trophyStats().xp - xpBefore;

  document.querySelector("#coach-section").textContent = "All done!";
  document.querySelector("#coach-count").textContent = `${coach.steps.length} of ${coach.steps.length}`;
  document.querySelector("#coach-fill").style.width = "100%";
  document.querySelector("#coach-name").textContent = "Workout complete!";
  document.querySelector("#coach-how").textContent = canMark
    ? `${minutes} min of hard work. It's marked as done.`
    : `${minutes} min of hard work. (It's a future day, so it isn't marked done.)`;
  document.querySelector("#coach-label").textContent = xpGained > 0 ? `+${xpGained} XP` : "";
  coachTime.textContent = "🎉";
  document.querySelector("#coach-next").textContent = "";
  coachBox.classList.remove("is-rest", "is-ready");
  coachMain.textContent = "Close";
  document.querySelector("#coach-back").disabled = true;
  document.querySelector("#coach-skip").disabled = true;
  sounds.finish();
  say("Workout complete! Awesome job!");
  checkAchievements(true);
}


/* 3. SHOWING A STEP --------------------------------------------------- */

function showStep() {
  if (!coach || coach.finished) return;
  clearInterval(coach.interval);
  const step = coach.steps[coach.index];
  const next = coach.steps.slice(coach.index + 1).find((s) => !s.isRest);

  document.querySelector("#coach-section").textContent = step.section;
  document.querySelector("#coach-count").textContent = `Step ${coach.index + 1} of ${coach.steps.length}`;
  document.querySelector("#coach-fill").style.width = `${(coach.index / coach.steps.length) * 100}%`;
  document.querySelector("#coach-name").textContent = step.name;
  document.querySelector("#coach-how").textContent = step.how;
  document.querySelector("#coach-label").textContent = step.label;
  document.querySelector("#coach-next").textContent = next ? `Up next: ${next.name}` : "Last one!";
  document.querySelector("#coach-back").disabled = coach.index === 0;
  document.querySelector("#coach-skip").disabled = false;
  coachBox.classList.toggle("is-rest", Boolean(step.isRest));

  if (step.seconds === null) {
    // A rep move: do it at your own pace, then tap Done
    coachBox.classList.remove("is-ready");
    coachTime.textContent = step.label.split(" ")[0]; // the number, like "12"
    document.querySelector("#coach-label").textContent = step.label.replace(/^\d+\s*/, "");
    coachMain.textContent = "Done ✓";
    say(`${step.name}. ${step.label}. Tap done when you finish.`);
    return;
  }

  // A timed step. Moves get a 3-second "get ready" first; rests start right away.
  coach.pausedLeft = null;
  coach.lastSecond = null;
  coach.readyUntil = step.isRest ? 0 : Date.now() + 3000;
  coach.endsAt = (step.isRest ? Date.now() : coach.readyUntil) + step.seconds * 1000;
  coachMain.textContent = "Pause";
  if (step.isRest) {
    say(`Rest ${formatSpoken(step.seconds)}. ${next ? `Up next: ${next.name}.` : ""}`);
  } else {
    say(`${step.name}. ${formatSpoken(step.seconds)}${step.label ? `, ${step.label}` : ""}. Get ready.`);
  }
  coach.interval = setInterval(coachTick, 200);
  coachTick();
}


/* 4. TIMERS AND BUTTONS ------------------------------------------------ */

function coachTick() {
  if (!coach || coach.pausedLeft !== null) return;
  const now = Date.now();

  // The "get ready" countdown before a timed move
  if (now < coach.readyUntil) {
    coachBox.classList.add("is-ready");
    const ready = Math.ceil((coach.readyUntil - now) / 1000);
    coachTime.textContent = ready;
    if (ready !== coach.lastSecond) {
      coach.lastSecond = ready;
      sounds.count();
    }
    return;
  }
  if (coachBox.classList.contains("is-ready")) {
    coachBox.classList.remove("is-ready");
    sounds.up();
  }

  const msLeft = Math.max(0, coach.endsAt - now);
  const secondsLeft = Math.ceil(msLeft / 1000);
  coachTime.textContent = formatTime(secondsLeft);
  if (secondsLeft !== coach.lastSecond) {
    coach.lastSecond = secondsLeft;
    if (secondsLeft > 0 && secondsLeft <= 3) sounds.count();
  }
  if (msLeft <= 0) {
    clearInterval(coach.interval);
    sounds.finish();
    setTimeout(goToNextStep, 700);
  }
}

function goToNextStep() {
  if (!coach || coach.finished) return;
  if (coach.index >= coach.steps.length - 1) {
    finishCoach();
  } else {
    coach.index += 1;
    showStep();
  }
}

// The big button: Done, Pause, Resume or Close
coachMain.addEventListener("click", () => {
  if (!coach) return;
  if (coach.finished) {
    closeCoach();
    return;
  }
  const step = coach.steps[coach.index];
  if (step.seconds === null) {
    goToNextStep();
    return;
  }
  if (coach.pausedLeft === null) {
    // Pause: remember how much time was left (and the get-ready time)
    coach.pausedLeft = coach.endsAt - Date.now();
    coach.readyLeft = Math.max(0, coach.readyUntil - Date.now());
    coachMain.textContent = "Resume";
    stopTalking();
  } else {
    coach.endsAt = Date.now() + coach.pausedLeft;
    coach.readyUntil = Date.now() + coach.readyLeft;
    coach.pausedLeft = null;
    coachMain.textContent = "Pause";
  }
});

document.querySelector("#coach-skip").addEventListener("click", () => {
  if (coach && !coach.finished) goToNextStep();
});

document.querySelector("#coach-back").addEventListener("click", () => {
  if (coach && !coach.finished && coach.index > 0) {
    coach.index -= 1;
    showStep();
  }
});

document.querySelector("#coach-close").addEventListener("click", closeCoach);

// Keyboard: Escape closes, space presses the big button
document.addEventListener("keydown", (event) => {
  if (!coach) return;
  if (event.key === "Escape") closeCoach();
  if (event.key === " " && event.target === document.body) {
    event.preventDefault();
    coachMain.click();
  }
});

// If the screen turns off or you switch apps, pause the timer
document.addEventListener("visibilitychange", () => {
  if (document.hidden && coach && !coach.finished && coach.pausedLeft === null && coach.steps[coach.index].seconds !== null) {
    coachMain.click();
  }
});


/* 5. THE VOICE ---------------------------------------------------------
   speechSynthesis is built into browsers: it reads text out loud.    */

let coachVoiceOn = true;

function say(text, then) {
  if (!coachVoiceOn || !("speechSynthesis" in window)) {
    if (then) then();
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const words = new SpeechSynthesisUtterance(text);
    words.rate = 1.05;
    let done = false;
    const next = () => {
      if (!done && then) {
        done = true;
        then();
      }
    };
    words.onend = next;
    words.onerror = next;
    setTimeout(next, 4000); // just in case the browser never says it's done
    window.speechSynthesis.speak(words);
  } catch (error) {
    if (then) then();
  }
}

function stopTalking() {
  try {
    window.speechSynthesis.cancel();
  } catch (error) {
    // No voice in this browser. That's fine.
  }
}

// "45 seconds", "1 minute 30 seconds"
function formatSpoken(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  const parts = [];
  if (minutes) parts.push(`${minutes} minute${minutes === 1 ? "" : "s"}`);
  if (rest) parts.push(`${rest} seconds`);
  return parts.join(" ");
}

const voiceButton = document.querySelector("#coach-voice");

function showVoiceSetting() {
  voiceButton.setAttribute("aria-pressed", String(coachVoiceOn));
  voiceButton.textContent = coachVoiceOn ? "Voice on" : "Voice off";
}

voiceButton.addEventListener("click", () => {
  coachVoiceOn = !coachVoiceOn;
  save("levelUp.voice", coachVoiceOn ? "on" : "off");
  showVoiceSetting();
  if (!coachVoiceOn) stopTalking();
});
