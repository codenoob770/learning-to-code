/* =============================================================
   training.js: the Training tab
   -------------------------------------------------------------
   Taekwondo and soccer lessons (they're in training-lessons.js).
   Pick a lesson to read how to do it, or tap "Teach me" and the
   voice coach (coach.js) walks you through every step out loud,
   then runs the practice drill with timers.

   Tap "I learned this!" when you've got it down. Each lesson you
   learn is worth XP, and so is practicing with the coach.

   This file loads before app.js, so it only uses app.js's
   functions inside its own functions, never right away.
   ============================================================= */

let trainingSport = "tkd"; // the sport you're looking at (this device only)
let openLessonId = null;   // the lesson that's open

function sportById(id) {
  return TRAINING.find((sport) => sport.id === id);
}

function findLesson(id) {
  for (const sport of TRAINING) {
    const lesson = sport.lessons.find((l) => l.id === id);
    if (lesson) return { sport, lesson };
  }
  return null;
}

// "10 each leg", "3 rounds of 30 seconds"
function drillAmount(drill) {
  if (drill.seconds) return `${drill.rounds} ${drill.rounds === 1 ? "round" : "rounds"} of ${drill.seconds} seconds`;
  return `${drill.reps}${drill.each ? ` each ${drill.each}` : ""}`;
}

// About how many reps a drill is, for the weekly boss (boss.js)
function drillReps(drill) {
  if (drill.seconds) return Math.round((drill.rounds * drill.seconds) / 2);
  return drill.reps * (drill.each ? 2 : 1);
}

// Turns a lesson into steps for the voice coach (coach.js)
function lessonPlan(sport, lesson) {
  const steps = [];
  const demo = lesson.demo || null;
  // "big" and "small" replace the big number on the coach's screen, so the
  // instructions are the big thing to read
  steps.push({ section: `${sport.name} · ${lesson.level}`, name: lesson.title, how: lesson.why, label: "", big: "", small: "", seconds: null, demo, say: `${lesson.title}. ${lesson.why} Tap done when you're ready.` });
  lesson.steps.forEach((text, i) => {
    steps.push({ section: "Learn it", name: `Step ${i + 1} of ${lesson.steps.length}`, how: text, label: "", big: "", small: "", seconds: null, demo, say: `Step ${i + 1}. ${text}` });
  });
  steps.push({ section: "Watch out", name: "⚠️ Watch out for", how: lesson.mistakes.join(" · "), label: "", big: "", small: "", seconds: null, demo, say: `Watch out for these mistakes. ${lesson.mistakes.join(". ")}.` });

  const drill = lesson.drill;
  if (drill.seconds) {
    for (let round = 1; round <= drill.rounds; round++) {
      steps.push({ section: "Practice", name: drill.text, how: lesson.title, label: `Round ${round} of ${drill.rounds}`, seconds: drill.seconds, demo });
      if (round < drill.rounds) steps.push({ section: "Rest", name: "Rest", how: "Shake it out and breathe.", label: "", seconds: drill.rest || 15, isRest: true });
    }
  } else {
    steps.push({ section: "Practice", name: drill.text, how: "Use your best form. Tap done when you finish.", label: drillAmount(drill), seconds: null, demo, say: `Practice time! ${drill.text}. ${drillAmount(drill)}. Tap done when you finish.` });
  }
  steps.push({ section: "Pro tip", name: "💡 Coach's tip", how: lesson.tip, label: "", big: "", small: "", seconds: null, demo: null, say: `Here's a pro tip. ${lesson.tip}` });

  return {
    title: lesson.title,
    steps,
    expert: false,
    reps: drillReps(drill),
    logType: "drill",                       // goes in the activity log as practice
    logExtra: { lesson: lesson.id },
    finishTitle: "Lesson complete!",
    finishText: "Great practice! When you've got it down, tap \"I learned this!\"",
  };
}

function renderTraining() {
  const sport = sportById(trainingSport);
  if (!openLessonId || !sport.lessons.some((l) => l.id === openLessonId)) {
    // Open the first lesson you haven't learned yet
    openLessonId = (sport.lessons.find((l) => !trainingLearned.has(l.id)) || sport.lessons[0]).id;
  }

  // The coach's tip of the day (a different one every day)
  const allLessons = TRAINING.flatMap((s) => s.lessons.map((lesson) => ({ sport: s, lesson })));
  const pick = allLessons[Math.floor(luckyNumber(`${toKey(today)} tip`) * allLessons.length)];
  document.querySelector("#tip-of-day").innerHTML = `
    <span class="tip-of-day__label">${pick.sport.icon} Coach's tip of the day</span>
    <span>${pick.lesson.tip}</span>
    <button class="text-button" type="button" data-lesson-open="${pick.lesson.id}">Learn: ${pick.lesson.title} →</button>`;

  // Sport picker, with how many lessons you've learned
  document.querySelector("#training-sports").innerHTML = TRAINING.map((s) => {
    const learned = s.lessons.filter((l) => trainingLearned.has(l.id)).length;
    return `<button class="pick" type="button" data-training-sport="${s.id}" aria-pressed="${s.id === trainingSport}">${s.icon} ${s.name} <span class="pick__count">${learned}/${s.lessons.length}</span></button>`;
  }).join("");

  // The lesson cards, grouped by level
  const levels = ["Beginner", "Intermediate", "Advanced"];
  document.querySelector("#lesson-cards").innerHTML = levels.map((level) => {
    const lessons = sport.lessons.filter((l) => l.level === level);
    if (!lessons.length) return "";
    return `
      <p class="lesson-level lesson-level--${level.toLowerCase()}">${level}</p>
      <div class="lesson-cards__row">
        ${lessons.map((lesson) => `
          <button class="lesson-card ${trainingLearned.has(lesson.id) ? "is-learned" : ""}" type="button" data-lesson-open="${lesson.id}" aria-pressed="${lesson.id === openLessonId}">
            <span class="lesson-card__title">${lesson.title}</span>
            <span class="lesson-card__state">${trainingLearned.has(lesson.id) ? "✓ Learned" : lesson.demo ? "▶ Has a demo" : "Read & practice"}</span>
          </button>`).join("")}
      </div>`;
  }).join("");

  renderLesson();
}

// One lesson, opened up
function renderLesson() {
  const found = findLesson(openLessonId);
  if (!found) return;
  const { sport, lesson } = found;
  const learned = trainingLearned.has(lesson.id);
  const canAsk = Boolean(window.claude && window.claude.use); // Ask Coach works on the Claude version

  const box = document.querySelector("#lesson");
  box.innerHTML = `
    <div class="panel__head">
      <h3 class="lesson__title">${sport.icon} ${lesson.title}</h3>
      <span class="lesson-level lesson-level--${lesson.level.toLowerCase()}">${lesson.level}</span>
    </div>
    <p class="panel__lead">${lesson.why}</p>
    ${lesson.safety ? `<p class="quest-safety"><strong>⚠️ Safety first:</strong> ${lesson.safety}</p>` : ""}
    <div class="lesson__body">
      ${lesson.demo ? `<button class="lesson__demo" type="button" data-lesson-demo aria-label="Show the ${lesson.title} demo bigger"><span data-lesson-figure="${lesson.demo}"></span></button>` : ""}
      <ol class="lesson__steps">${lesson.steps.map((step) => `<li>${step}</li>`).join("")}</ol>
    </div>
    <div class="lesson__boxes">
      <div class="lesson-box lesson-box--watch">
        <p class="lesson-box__title">⚠️ Watch out for</p>
        <ul>${lesson.mistakes.map((m) => `<li>${m}</li>`).join("")}</ul>
      </div>
      <div class="lesson-box lesson-box--drill">
        <p class="lesson-box__title">🏋️ Practice drill</p>
        <p>${lesson.drill.text}</p>
        <p class="lesson-box__amount">${drillAmount(lesson.drill)}</p>
      </div>
      <div class="lesson-box lesson-box--tip">
        <p class="lesson-box__title">💡 Pro tip</p>
        <p>${lesson.tip}</p>
      </div>
    </div>
    <div class="lesson__buttons">
      <button class="button" type="button" data-lesson-teach>▶ Teach me (voice coach)</button>
      <button class="button ${learned ? "button--done" : "button--quiet"}" type="button" data-lesson-learned aria-pressed="${learned}">${learned ? "✓ Learned!" : `✓ I learned this! (+${XP_RULES.lessonLearned} XP)`}</button>
      ${canAsk ? `<button class="text-button" type="button" data-lesson-ask>💬 Ask Coach about it</button>` : ""}
    </div>`;

  // The stick figure, moving (demos.js)
  const spot = box.querySelector("[data-lesson-figure]");
  if (spot) {
    const svg = createDemo(spot.dataset.lessonFigure, "");
    svg.setAttribute("aria-hidden", "true");
    spot.replaceWith(svg);
    startDemoAnimation();
  }
}

document.querySelector("#training").addEventListener("click", (event) => {
  const sportButton = event.target.closest("[data-training-sport]");
  if (sportButton) {
    trainingSport = sportButton.dataset.trainingSport;
    openLessonId = null;
    renderTraining();
    document.querySelector(`[data-training-sport="${trainingSport}"]`).focus();
    return;
  }

  const open = event.target.closest("[data-lesson-open]");
  if (open) {
    const found = findLesson(open.dataset.lessonOpen);
    trainingSport = found.sport.id;
    openLessonId = found.lesson.id;
    renderTraining();
    document.querySelector("#lesson").scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  const { sport, lesson } = findLesson(openLessonId) || {};
  if (!lesson) return;

  if (event.target.closest("[data-lesson-teach]")) {
    openCoach(today, lessonPlan(sport, lesson)); // in coach.js
  }

  if (event.target.closest("[data-lesson-demo]")) {
    openDemo(lesson.demo, lesson.title, lesson.steps.join(" ")); // in demos.js
  }

  if (event.target.closest("[data-lesson-learned]")) {
    if (trainingLearned.has(lesson.id)) {
      trainingLearned.delete(lesson.id);
      showToast("Unmarked. Keep practicing!");
    } else {
      trainingLearned.add(lesson.id);
      const all = sport.lessons.every((l) => trainingLearned.has(l.id));
      if (all) {
        sounds.fanfare();
        confetti();
        showToast(`You learned EVERY ${sport.name.toLowerCase()} lesson! ${sport.icon}`);
      } else {
        sounds.done();
        showToast(`Skill learned! +${XP_RULES.lessonLearned} XP ${sport.icon}`);
      }
    }
    save("levelUp.training", JSON.stringify([...trainingLearned]));
    render();
    checkAchievements(true);
    document.querySelector("[data-lesson-learned]").focus();
  }

  // Ask Coach (on the Today tab) a question about this lesson
  if (event.target.closest("[data-lesson-ask]")) {
    showTab("today");
    const input = document.querySelector("#ai-question");
    input.value = `Can you give me more tips for the ${sport.name.toLowerCase()} skill "${lesson.title}"?`;
    input.scrollIntoView({ behavior: "smooth", block: "center" });
    input.focus();
  }
});
