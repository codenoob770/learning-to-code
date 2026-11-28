/* =============================================================
   training.js: the Training tab
   -------------------------------------------------------------
   Taekwondo and soccer lessons (they're in training-lessons.js),
   on 3 pages per sport that get harder and harder. Pick a lesson
   to read how to do it, or tap "Teach me" and the voice coach
   (coach.js) walks you through every step out loud, then runs the
   practice drill with timers.

   Tap "I learned this!" when you've got a lesson down, or "I
   already know all of these" to learn a whole page at once. When
   every lesson on a page is learned, the next page unlocks.

   This file loads before app.js, so it only uses app.js's
   functions inside its own functions, never right away.
   ============================================================= */

let trainingSport = "tkd"; // the sport you're looking at (this device only)
let trainingPage = {};     // the page you're on for each sport, like { tkd: 1 } (0 = page 1)
let openLessonId = null;   // the lesson that's open

function sportById(id) {
  return TRAINING.find((sport) => sport.id === id);
}

// A sport's pages: page 1 is "lessons", and the harder pages come after
function sportPages(sport) {
  return [{ name: "Basics", lessons: sport.lessons }, ...(sport.harder || [])];
}

// Every lesson of a sport, on every page
function sportLessons(sport) {
  return sportPages(sport).flatMap((page) => page.lessons);
}

function pageDone(page) {
  return page.lessons.every((lesson) => trainingLearned.has(lesson.id));
}

// A page is unlocked when every page before it is done
function pageUnlocked(sport, index) {
  return sportPages(sport).slice(0, index).every(pageDone);
}

// The page to show: the one you picked, or the first unlocked page with something left to learn
function currentPage(sport) {
  const pages = sportPages(sport);
  const picked = trainingPage[sport.id];
  if (picked !== undefined && pageUnlocked(sport, picked)) return picked;
  let index = 0;
  while (index < pages.length - 1 && pageDone(pages[index])) index += 1;
  return index;
}

function findLesson(id) {
  for (const sport of TRAINING) {
    const pages = sportPages(sport);
    for (let index = 0; index < pages.length; index++) {
      const lesson = pages[index].lessons.find((l) => l.id === id);
      if (lesson) return { sport, lesson, page: index };
    }
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
  const pages = sportPages(sport);
  const pageIndex = currentPage(sport);
  trainingPage[sport.id] = pageIndex;
  const page = pages[pageIndex];
  if (!openLessonId || !page.lessons.some((l) => l.id === openLessonId)) {
    // Open the first lesson on this page you haven't learned yet
    openLessonId = (page.lessons.find((l) => !trainingLearned.has(l.id)) || page.lessons[0]).id;
  }

  // The coach's tip of the day (a different one every day)
  const allLessons = TRAINING.flatMap((s) => sportLessons(s).map((lesson) => ({ sport: s, lesson })));
  const pick = allLessons[Math.floor(luckyNumber(`${toKey(today)} tip`) * allLessons.length)];
  document.querySelector("#tip-of-day").innerHTML = `
    <span class="tip-of-day__label">${pick.sport.icon} Coach's tip of the day</span>
    <span>${pick.lesson.tip}</span>
    <button class="text-button" type="button" data-lesson-open="${pick.lesson.id}">Learn: ${pick.lesson.title} →</button>`;

  // Sport picker, with how many lessons you've learned
  document.querySelector("#training-sports").innerHTML = TRAINING.map((s) => {
    const all = sportLessons(s);
    const learned = all.filter((l) => trainingLearned.has(l.id)).length;
    return `<button class="pick" type="button" data-training-sport="${s.id}" aria-pressed="${s.id === trainingSport}">${s.icon} ${s.name} <span class="pick__count">${learned}/${all.length}</span></button>`;
  }).join("");

  // The pages (locked ones can't be opened yet)
  document.querySelector("#training-pages").innerHTML = pages.map((p, i) => {
    const unlocked = pageUnlocked(sport, i);
    const mark = pageDone(p) ? " ✓" : unlocked ? "" : " 🔒";
    return `
      <button class="page-tab ${pageDone(p) ? "is-done" : ""}" type="button" data-training-page="${i}" aria-pressed="${i === pageIndex}" ${unlocked ? "" : `disabled title="Learn everything on page ${i} to unlock this page"`}>
        <span class="page-tab__number">Page ${i + 1}${mark}</span>
        <span class="page-tab__name">${p.name}</span>
      </button>`;
  }).join("");

  // The lesson cards for this page, grouped by level
  const levels = [...new Set(page.lessons.map((l) => l.level))];
  document.querySelector("#lesson-cards").innerHTML = levels.map((level) => `
    <p class="lesson-level lesson-level--${level.toLowerCase()}">${level}</p>
    <div class="lesson-cards__row">
      ${page.lessons.filter((l) => l.level === level).map((lesson) => `
        <button class="lesson-card ${trainingLearned.has(lesson.id) ? "is-learned" : ""}" type="button" data-lesson-open="${lesson.id}" aria-pressed="${lesson.id === openLessonId}">
          <span class="lesson-card__title">${lesson.title}</span>
          <span class="lesson-card__state">${trainingLearned.has(lesson.id) ? "✓ Learned" : lesson.demo ? "▶ Has a demo" : "Read & practice"}</span>
        </button>`).join("")}
    </div>`).join("");

  // "I already know all of these", or a button to the next page
  const next = pages[pageIndex + 1];
  const box = document.querySelector("#page-actions");
  if (!pageDone(page)) {
    box.innerHTML = `
      <button class="button" type="button" data-learn-page>✅ I already know all of these</button>
      <span class="page-actions__note">${next ? `Unlocks page ${pageIndex + 2}: ${next.name}` : "Marks every lesson on this page as learned"}</span>`;
  } else if (next) {
    box.innerHTML = `
      <span class="page-actions__done">✓ You know everything on this page!</span>
      <button class="button" type="button" data-training-page="${pageIndex + 1}">Go to page ${pageIndex + 2}: ${next.name} →</button>`;
  } else {
    box.innerHTML = `<span class="page-actions__done">🏆 You know EVERY ${sport.name.toLowerCase()} lesson. That's pro level!</span>`;
  }

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

// After learning something: say so, and cheer if that unlocked a page
function afterLearning(sport, pageBefore, message) {
  save("levelUp.training", JSON.stringify([...trainingLearned]));
  const pages = sportPages(sport);
  const unlockedNow = pages.findIndex((p, i) => i > 0 && pageUnlocked(sport, i) && i > pageBefore);
  if (sportLessons(sport).every((l) => trainingLearned.has(l.id))) {
    sounds.fanfare();
    confetti();
    showToast(`You learned EVERY ${sport.name.toLowerCase()} lesson! ${sport.icon}`);
  } else if (unlockedNow !== -1) {
    trainingPage[sport.id] = unlockedNow;
    openLessonId = null;
    sounds.fanfare();
    confetti();
    showToast(`🔓 Page ${unlockedNow + 1} unlocked: ${pages[unlockedNow].name}!`);
  } else {
    sounds.done();
    showToast(message);
  }
  render();
  checkAchievements(true);
}

// The last unlocked page (to know when a new one unlocks)
function lastUnlockedPage(sport) {
  let last = 0;
  sportPages(sport).forEach((_, i) => {
    if (pageUnlocked(sport, i)) last = i;
  });
  return last;
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

  const pageButton = event.target.closest("[data-training-page]");
  if (pageButton && !pageButton.disabled) {
    trainingPage[trainingSport] = Number(pageButton.dataset.trainingPage);
    openLessonId = null;
    renderTraining();
    document.querySelector(`.page-tab[data-training-page="${trainingPage[trainingSport]}"]`).focus();
    return;
  }

  // "I already know all of these": learn every lesson on this page
  if (event.target.closest("[data-learn-page]")) {
    const sport = sportById(trainingSport);
    const page = sportPages(sport)[currentPage(sport)];
    const before = lastUnlockedPage(sport);
    page.lessons.forEach((lesson) => trainingLearned.add(lesson.id));
    afterLearning(sport, before, `All ${page.lessons.length} lessons learned! ${sport.icon}`);
    document.querySelector("#training-pages").scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  const open = event.target.closest("[data-lesson-open]");
  if (open) {
    const found = findLesson(open.dataset.lessonOpen);
    trainingSport = found.sport.id;
    trainingPage[found.sport.id] = found.page;
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
      save("levelUp.training", JSON.stringify([...trainingLearned]));
      showToast("Unmarked. Keep practicing!");
      render();
    } else {
      const before = lastUnlockedPage(sport);
      trainingLearned.add(lesson.id);
      afterLearning(sport, before, `Skill learned! +${XP_RULES.lessonLearned} XP ${sport.icon}`);
    }
    document.querySelector("[data-lesson-learned]")?.focus();
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
