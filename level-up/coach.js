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
        steps.push({ section, name: item.name, how: item.how || "", label: `${item.each} ${side} of 2`, seconds, demo: demoKeyFor(item) });
      }
    } else {
      steps.push({ section, name: item.name, how: item.how || "", label: amountText(item.amount, item.unit, item.each), seconds, demo: demoKeyFor(item) });
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

// "custom" is a workout you built yourself (sports.js). Without it,
// the coach runs the day's workout.
function openCoach(date, custom = null) {
  stopTimer(); // the little timer bar isn't needed in here
  const plan = custom || planFor(date);
  coach = {
    date,
    plan,
    custom: Boolean(custom),
    steps: plan.steps || coachSteps(plan), // a Training lesson brings its own steps
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
  coachBox.classList.toggle("is-lesson", Boolean(plan.steps)); // Training lessons show big instructions
  document.body.classList.add("coach-open");
  say(`Let's go! ${plan.title}. ${coach.steps.length} steps.`, () => showStep());
}

function closeCoach() {
  if (!coach) return;
  clearInterval(coach.interval);
  coach = null;
  coachBox.hidden = true;
  document.querySelector("#coach-demo").replaceChildren(); // stops its animation
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

  if (coach.custom) {
    // A workout you built (or a Training lesson): it goes in the activity
    // log for XP and hits on the boss
    logActivity(coach.plan.logType || "custom", { name: coach.plan.title, reps: coach.plan.reps, ...(coach.plan.logExtra || {}) });
    render();
  } else if (canMark && !doneDays.has(key)) {
    // Finishing counts as marking the workout done
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
  document.querySelector("#coach-name").textContent = coach.plan.finishTitle || "Workout complete!";
  let how = `${minutes} min of hard work. It's marked as done.`;
  if (!canMark) how = `${minutes} min of hard work. (It's a future day, so it isn't marked done.)`;
  if (coach.custom) how = coach.plan.finishText || `${minutes} min of hard work, in a workout YOU designed!`;
  document.querySelector("#coach-how").textContent = how;
  document.querySelector("#coach-label").textContent = xpGained > 0 ? `+${xpGained} XP` : "";
  coachTime.textContent = "🎉";
  document.querySelector("#coach-demo").replaceChildren();
  document.querySelector("#coach-demo").hidden = true;
  document.querySelector("#coach-next").textContent = "";
  coachBox.classList.remove("is-rest", "is-ready");
  coachMain.textContent = "Close";
  document.querySelector("#coach-back").disabled = true;
  document.querySelector("#coach-skip").disabled = true;
  sounds.finish();
  say(`${coach.plan.finishTitle || "Workout complete!"} Awesome job!`);
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

  // The stick figure showing the move (demos.js). Rests show what's coming up next.
  const demoStep = step.isRest ? next : step;
  const demoSpot = document.querySelector("#coach-demo");
  if (demoStep && demoStep.demo) {
    demoSpot.replaceChildren(createDemo(demoStep.demo, `Animation showing how to do ${demoStep.name}`));
    demoSpot.hidden = false;
  } else {
    demoSpot.replaceChildren();
    demoSpot.hidden = true;
  }

  if (step.seconds === null) {
    // A rep move: do it at your own pace, then tap Done
    coachBox.classList.remove("is-ready");
    coachTime.textContent = step.big ?? step.label.split(" ")[0]; // the number, like "12"
    document.querySelector("#coach-label").textContent = step.small ?? step.label.replace(/^\d+\s*/, "");
    coachMain.textContent = "Done ✓";
    say(step.say || `${step.name}. ${step.label}. Tap done when you finish.`); // lessons have their own words
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
   speechSynthesis is built into browsers: it reads text out loud.
   EVERYTHING on the page that talks goes through speakParts(): the
   coach, the Spelling Bee, Korean words, the Homework Timer...

   iPads have a few voice quirks, so this part is extra careful:
   - It "resumes" the voice before talking. If you switch apps while
     the voice is talking, an iPad can leave it paused, and then
     nothing on the page ever talks again.
   - It only stops old talking if something IS talking, and then waits
     a moment. (Talking right after stopping can get skipped.)
   - It keeps each sentence in a list until it's done. Otherwise the
     browser can lose a sentence halfway, and the voice gets stuck.
   - It notices when the voice doesn't start, and offers the Voice
     Check (below) to help you fix it.                                  */

let coachVoiceOn = true;
const sentences = new Set(); // sentences waiting to be spoken or being spoken
const voiceStatus = { worked: false, error: "", warned: false };
let voiceTurn = 0; // counts up every time something new starts talking

function canSpeak() {
  return "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

// parts: a list of { text, rate }. Options:
//   lang and voice: which language and voice to use
//   then:    runs when it's done talking (or right away, if it can't talk)
//   onstart: runs when the voice really starts
//   onfail:  runs if the voice never starts (instead of the usual warning)
function speakParts(parts, { lang = "en-US", voice = null, then = null, onstart = null, onfail = null } = {}) {
  let finished = false;
  const done = () => {
    if (finished) return;
    finished = true;
    if (then) then();
  };
  if (!canSpeak() || parts.length === 0) {
    done();
    return;
  }
  const synth = window.speechSynthesis;
  const turn = ++voiceTurn;
  let started = false;

  const talk = () => {
    if (turn !== voiceTurn) return; // something newer wants to talk
    try {
      synth.resume();
      parts.forEach((part, i) => {
        const words = new SpeechSynthesisUtterance(part.text);
        words.lang = lang;
        words.rate = part.rate || 1;
        if (voice) words.voice = voice;
        words.onstart = () => {
          if (!started && onstart) onstart();
          started = true;
          voiceStatus.worked = true;
        };
        const end = (event) => {
          sentences.delete(words);
          if (event.type === "error" && !["interrupted", "canceled"].includes(event.error)) voiceStatus.error = event.error || "error";
          if (i === parts.length - 1) done();
        };
        words.onend = end;
        words.onerror = end;
        sentences.add(words);
        synth.speak(words);
      });
    } catch (error) {
      voiceStatus.error = error.message;
      done();
    }
    // Didn't start after 3 seconds (and nothing newer started talking)? Something's wrong.
    setTimeout(() => {
      if (started || turn !== voiceTurn || synth.speaking) return;
      if (onfail) onfail();
      else voiceDidNotStart();
    }, 3000);
  };

  // Just in case the browser never says it's done (about half a second a word)
  const wordCount = parts.reduce((count, part) => count + part.text.split(/\s+/).length, 0);
  setTimeout(done, Math.max(4000, wordCount * 500));

  if (synth.speaking || synth.pending) {
    synth.cancel();
    setTimeout(talk, 120);
  } else {
    talk(); // right away, so it counts as part of your tap (iPads need that the first time)
  }
}

function say(text, then) {
  if (!coachVoiceOn) {
    if (then) then();
    return;
  }
  speakParts([{ text, rate: 1.05 }], { then });
}

function stopTalking() {
  voiceTurn += 1;
  try {
    window.speechSynthesis.cancel();
  } catch (error) {
    // No voice in this browser. That's fine.
  }
  sentences.clear();
}

// Coming back to the page after switching apps: un-pause the voice
document.addEventListener("visibilitychange", () => {
  if (document.hidden || !canSpeak()) return;
  try {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      window.speechSynthesis.cancel();
    }
  } catch (error) {
    // That's OK.
  }
});

// The voice didn't start: say so (once), and point to the Voice Check
function voiceDidNotStart() {
  document.querySelectorAll("[data-voice-check]").forEach((button) => button.classList.add("is-alert"));
  if (voiceStatus.worked || voiceStatus.warned) return;
  voiceStatus.warned = true;
  showToast("🔇 Can't hear the voice? Tap 🔊 Voice check to fix it.");
}


/* THE VOICE CHECK -----------------------------------------------------
   A little box that tests the voice and explains how to fix it.
   Any button with data-voice-check opens it.                          */

function voiceHelpHTML(problem) {
  const inApp = window.navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
  let voices = 0;
  try {
    voices = window.speechSynthesis.getVoices().length;
  } catch (error) {
    voices = 0;
  }
  const voiceOff = load("levelUp.voice", "on") !== "on";
  return `
    <p class="voice-bad">❌ ${problem}</p>
    <p><strong>Try these, one at a time:</strong></p>
    <ol class="voice-fixes">
      ${inApp ? `<li class="is-likely"><strong>Open this page in Safari, not from the Home Screen icon.</strong> On some iPads, Home Screen apps can't talk.</li>` : ""}
      <li><strong>Turn off Silent Mode.</strong> Swipe down from the top-right corner to open Control Center. If the 🔔 bell is red or crossed out, tap it.</li>
      <li><strong>Turn the volume up</strong> with the buttons on the side.</li>
      <li><strong>Close this tab and open the page again.</strong> That un-sticks the voice if it got stuck.</li>
      ${inApp ? "" : `<li>Opened it from an app icon on your Home Screen? Try it in Safari instead.</li>`}
      ${voiceOff ? `<li>The coach's voice is switched off. In the guided workout, tap <strong>Voice off</strong> to turn it back on.</li>` : ""}
    </ol>
    <p class="voice-details">For a grown-up: speech ${canSpeak() ? "is supported" : "isn't supported"} · ${voices} voices · ${inApp ? "Home Screen app" : "in the browser"}${voiceStatus.error ? ` · last error: ${escapeHTML(voiceStatus.error)}` : ""}</p>`;
}

function runVoiceCheck() {
  const result = document.querySelector("#voice-result");
  if (!canSpeak()) {
    result.innerHTML = voiceHelpHTML("This browser can't talk at all.");
    return;
  }
  result.innerHTML = `<p class="voice-testing">🔊 Testing... listen!</p>`;
  speakParts([{ text: "Hi! I'm your coach. Can you hear me?" }], {
    onstart: () => {
      document.querySelectorAll("[data-voice-check]").forEach((button) => button.classList.remove("is-alert"));
      result.innerHTML = `
        <p class="voice-ok">✅ The voice is talking right now!</p>
        <p>Can't hear it? Turn the volume up, and make sure Silent Mode is off (the 🔔 bell in Control Center).</p>`;
    },
    onfail: () => {
      result.innerHTML = voiceHelpHTML("The voice didn't start.");
    },
  });
}

function openVoiceCheck() {
  let box = document.querySelector("#voice-box");
  if (!box) {
    box = document.createElement("div");
    box.className = "modal voice-box";
    box.id = "voice-box";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-labelledby", "voice-title");
    box.innerHTML = `
      <div class="modal__card">
        <div class="modal__head">
          <h2 id="voice-title">🔊 Voice check</h2>
          <button class="icon-button" id="voice-close" type="button" aria-label="Close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
        </div>
        <div class="voice-result" id="voice-result" aria-live="polite"></div>
        <button class="button" id="voice-again" type="button">🔊 Test again</button>
      </div>`;
    document.body.append(box);
    box.querySelector("#voice-close").addEventListener("click", () => { box.hidden = true; });
    box.querySelector("#voice-again").addEventListener("click", runVoiceCheck);
    box.addEventListener("click", (event) => {
      if (event.target === box) box.hidden = true; // tapped outside the card
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !box.hidden) box.hidden = true;
    });
  }
  box.hidden = false;
  runVoiceCheck(); // right away, while it still counts as your tap
  box.querySelector("#voice-again").focus();
}

document.addEventListener("click", (event) => {
  if (event.target.closest("[data-voice-check]")) openVoiceCheck();
});

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
