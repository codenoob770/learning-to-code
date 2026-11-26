/* =============================================================
   quiz.js: the Brain + Body Quiz
   -------------------------------------------------------------
   Pick a subject and answer 10 questions (they're all in
   quiz-questions.js). Get one right: +10 XP. Get one wrong: you
   owe that question's exercise, like "10 squats"! Tap "I did
   them" when you're done, and you still get a little XP for the
   work.

   1. Penalties: which demo to show, and how many reps they are
   2. Starting a round
   3. Drawing the quiz (subject picker, question, results)
   4. Buttons and keys

   This file loads before app.js, so it only uses app.js's
   functions inside its own functions, never right away.
   ============================================================= */

const QUIZ_LENGTH = 10;   // questions in a round
let quiz = null;          // the round you're playing, or null when you're picking a subject


/* 1. PENALTIES ------------------------------------------------------ */

// Which stick-figure demo (demos.js) goes with each kind of penalty, and how to do it
const PENALTY_MOVES = [
  { match: /push-up/, demo: "pushup", how: "Hands under your shoulders, body straight like a plank. Lower your chest, then push back up. Knees on the floor is OK!" },
  { match: /curl-up/, demo: "curlup", how: "Lie on your back, knees bent, feet flat. Curl your shoulders up slowly, then back down." },
  { match: /squat/, demo: "squat", how: "Feet shoulder-width apart. Sit back like there's a chair behind you, chest up, then stand." },
  { match: /jumping jack/, demo: "jacks", how: "Jump your feet out while your arms go up, then jump back in." },
  { match: /lunge/, demo: "lunge", how: "Step forward and bend both knees until your back knee almost touches the floor. Push back up, then switch legs." },
  { match: /plank/, demo: "plank", how: "Forearms on the floor, body in a straight line from head to heels. Don't let your hips sag!" },
  { match: /wall sit/, demo: "wallSit", how: "Back flat against a wall, slide down until your knees are bent like you're sitting in a chair. Hold it!" },
  { match: /high knee/, demo: "highKnees", how: "Run in place, bringing your knees up to your hips. Count each knee." },
  { match: /mountain climber/, demo: "mountainClimbers", how: "In a high plank, drive one knee toward your chest, then switch fast. Count each knee." },
  { match: /burpee/, demo: "burpee", how: "Squat, put your hands down, jump your feet back to a plank, jump them back in, then jump up high!" },
  { match: /calf raise/, demo: "calfRaise", how: "Stand tall and rise up onto your toes, then lower down slowly." },
];

// Works out a penalty from its text, like "8 lunges each leg" or "20-second plank"
function penaltyInfo(fix) {
  const number = parseInt(fix, 10) || 0;
  const seconds = /second/.test(fix) ? number : 0;
  const bothSides = /each (leg|side)/.test(fix);
  const move = PENALTY_MOVES.find((m) => m.match.test(fix));
  return {
    text: fix,
    seconds,
    // For the weekly boss: a rep is a rep, and holding counts 1 for every 2 seconds
    reps: seconds ? Math.round(seconds / 2) : number * (bothSides ? 2 : 1),
    demo: move ? move.demo : null,
    how: move ? move.how : "",
  };
}


/* 2. STARTING A ROUND ------------------------------------------------ */

// A copy of a list in a random order (the "Fisher-Yates shuffle")
function quizShuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function quizSubject(id) {
  if (id === "mix") return { id: "mix", name: "Mix it up", icon: "🎲" };
  return QUIZ_SUBJECTS.find((subject) => subject.id === id);
}

function startQuiz(subjectId) {
  const subject = quizSubject(subjectId);
  const pool = subjectId === "mix"
    ? QUIZ_SUBJECTS.filter((s) => s.school).flatMap((s) => s.questions)
    : subject.questions;

  const questions = quizShuffle(pool).slice(0, QUIZ_LENGTH).map((question) => {
    // The right answer is always first in quiz-questions.js, so mix the answers up
    const order = quizShuffle([0, 1, 2, 3]);
    return { ...question, choices: order.map((i) => question.a[i]), right: order.indexOf(0) };
  });

  quiz = {
    subject,
    questions,
    index: 0,
    results: [],        // "right" or "wrong" for each question so far
    picked: null,       // the answer you tapped for this question
    penaltyDone: false, // did you do this question's penalty?
    penalties: 0,       // penalties done this round
    reps: 0,            // penalty reps done this round
    xpBefore: trophyStats().xp,
  };
  drawQuiz();
  document.querySelector(".quiz-answer")?.focus();
}


/* 3. DRAWING THE QUIZ ----------------------------------------------- */

const quizArea = document.querySelector("#quiz-area");

// Called by render() in app.js. It only redraws the subject picker,
// so a round you're in the middle of never gets reset.
function renderQuiz() {
  if (!quiz) drawQuiz();
}

function drawQuiz() {
  if (!quiz) {
    quizArea.innerHTML = quizPickerHTML();
  } else if (quiz.index >= quiz.questions.length) {
    quizArea.innerHTML = quizEndHTML();
  } else {
    quizArea.innerHTML = quizQuestionHTML();
    // The penalty's stick figure, moving (demos.js)
    quizArea.querySelectorAll("[data-penalty-demo]").forEach((spot) => {
      const svg = createDemo(spot.dataset.penaltyDemo, "");
      svg.setAttribute("aria-hidden", "true");
      spot.replaceWith(svg);
    });
    startDemoAnimation();
  }
}

// Your best score in a subject, like "8/10"
function quizBest(subjectId) {
  const rounds = logOf("quiz").filter((entry) => entry.s === subjectId);
  if (rounds.length === 0) return null;
  const best = rounds.reduce((a, b) => (b.r / b.n > a.r / a.n ? b : a));
  return `${best.r}/${best.n}`;
}

function quizPickerHTML() {
  const subjects = [...QUIZ_SUBJECTS, { id: "mix", name: "Mix it up", icon: "🎲", mix: true }];
  const buttons = subjects.map((subject) => {
    const best = quizBest(subject.id);
    const count = subject.mix
      ? "All 4 school subjects"
      : `${subject.questions.length} questions${subject.school ? "" : " · bonus"}`;
    return `
      <button class="quiz-subject ${subject.mix ? "quiz-subject--mix" : ""}" type="button" data-subject="${subject.id}">
        <span class="quiz-subject__icon" aria-hidden="true">${subject.icon}</span>
        <span class="quiz-subject__name">${subject.name}</span>
        <span class="quiz-subject__info">${count}</span>
        <span class="quiz-subject__best">${best ? `Best: ${best}` : "Not played yet"}</span>
      </button>`;
  }).join("");

  const rounds = logOf("quiz");
  const right = rounds.reduce((sum, entry) => sum + entry.r, 0);
  const reps = rounds.reduce((sum, entry) => sum + (entry.reps || 0), 0);
  return `
    <div class="quiz-subjects">${buttons}</div>
    <p class="quiz-total">${rounds.length === 0
      ? "Pick a subject to start. Good luck!"
      : `So far: ${rounds.length} ${rounds.length === 1 ? "round" : "rounds"}, ${right} right ${right === 1 ? "answer" : "answers"}, and ${reps} penalty ${reps === 1 ? "rep" : "reps"} done.`}</p>`;
}

function quizQuestionHTML() {
  const question = quiz.questions[quiz.index];
  const answered = quiz.picked !== null;
  const gotIt = answered && quiz.picked === question.right;
  const rightCount = quiz.results.filter((r) => r === "right").length;

  const dots = quiz.questions.map((_, i) => {
    let state = "";
    if (quiz.results[i]) state = `is-${quiz.results[i]}`;
    else if (i === quiz.index) state = "is-now";
    return `<span class="quiz-dot ${state}"></span>`;
  }).join("");

  const answers = question.choices.map((choice, i) => {
    let state = "";
    if (answered && i === question.right) state = "is-right";
    else if (answered && i === quiz.picked) state = "is-wrong";
    return `
      <button class="quiz-answer ${state}" type="button" data-answer="${i}" ${answered ? "disabled" : ""}>
        <span class="quiz-answer__letter" aria-hidden="true">${"ABCD"[i]}</span>
        <span>${choice}</span>
      </button>`;
  }).join("");

  let feedback = "";
  if (answered && gotIt) {
    feedback = `
      <div class="quiz-result is-right">
        <p class="quiz-result__title">✅ Correct! +${XP_RULES.quizRight} XP</p>
        <p>${question.why}</p>
      </div>
      ${nextButtonHTML()}`;
  } else if (answered) {
    const penalty = penaltyInfo(question.fix);
    feedback = `
      <div class="quiz-result is-wrong">
        <p class="quiz-result__title">❌ Not quite! The answer is: <strong>${question.choices[question.right]}</strong></p>
        <p>${question.why}</p>
      </div>
      ${quiz.penaltyDone
        ? `<p class="penalty-done">💪 Penalty done! +${XP_RULES.penaltyDone} XP for the hard work.</p>${nextButtonHTML()}`
        : `<div class="penalty">
            ${penalty.demo ? `<button class="penalty__demo" type="button" data-quiz="demo" aria-label="Show me how to do it"><span data-penalty-demo="${penalty.demo}"></span></button>` : ""}
            <div class="penalty__body">
              <p class="penalty__label">Penalty time!</p>
              <p class="penalty__move">${penalty.text}</p>
              <div class="penalty__buttons">
                ${penalty.demo ? `<button class="text-button" type="button" data-quiz="demo">Show me how</button>` : ""}
                ${penalty.seconds ? `<button class="text-button" type="button" data-quiz="timer">⏱ Start ${penalty.seconds}s timer</button>` : ""}
                <button class="button" type="button" data-quiz="did">I did it ✓</button>
              </div>
            </div>
          </div>`}`;
  }

  return `
    <div class="quiz-play">
      <div class="quiz-top">
        <p class="quiz-where">${quiz.subject.icon} ${quiz.subject.name} · Question ${quiz.index + 1} of ${quiz.questions.length}</p>
        <p class="quiz-score" aria-label="${rightCount} right so far">✓ ${rightCount}</p>
        <button class="text-button" type="button" data-quiz="quit">Quit</button>
      </div>
      <div class="quiz-dots" aria-hidden="true">${dots}</div>
      <h3 class="quiz-question">${question.q}</h3>
      <div class="quiz-answers">${answers}</div>
      <div class="quiz-feedback" aria-live="polite">${feedback}</div>
    </div>`;
}

function nextButtonHTML() {
  const last = quiz.index === quiz.questions.length - 1;
  return `<button class="button quiz-next" type="button" data-quiz="next">${last ? "See my score" : "Next question →"}</button>`;
}

function quizEndHTML() {
  const right = quiz.results.filter((r) => r === "right").length;
  const total = quiz.questions.length;
  const xpGained = trophyStats().xp - quiz.xpBefore;
  const missed = quiz.questions.filter((_, i) => quiz.results[i] === "wrong");

  let stars = "⭐";
  let message = "Every question you miss is one you'll know next time. Keep going!";
  if (right === total) {
    stars = "🌟🌟🌟";
    message = "PERFECT ROUND! Your brain is as strong as your muscles!";
  } else if (right >= 8) {
    stars = "⭐⭐⭐";
    message = "Awesome! You really know your stuff.";
  } else if (right >= 5) {
    stars = "⭐⭐";
    message = "Nice work! Try again and beat your score.";
  }

  const review = missed.map((q) => `
    <li><span class="quiz-review__q">${q.q}</span> <strong>${q.choices[q.right]}</strong></li>`).join("");

  return `
    <div class="quiz-end">
      <p class="eyebrow">// round complete · ${quiz.subject.icon} ${quiz.subject.name}</p>
      <p class="quiz-end__score">${right}<span>/${total}</span></p>
      <p class="quiz-end__stars" aria-hidden="true">${stars}</p>
      <p class="quiz-end__message">${message}</p>
      <ul class="quiz-end__facts">
        <li>${xpGained > 0 ? `+${xpGained} XP` : "No more quiz XP today (5 rounds a day), but your brain still grew!"}</li>
        ${quiz.penalties ? `<li>${quiz.penalties} ${quiz.penalties === 1 ? "penalty" : "penalties"} done: ${quiz.reps} reps for the weekly boss!</li>` : ""}
      </ul>
      ${missed.length ? `<details class="extra quiz-review"><summary>Review the ones you missed</summary><ul>${review}</ul></details>` : ""}
      <div class="quiz-end__buttons">
        <button class="button" type="button" data-quiz="again">Play ${quiz.subject.name} again</button>
        <button class="button button--quiet" type="button" data-quiz="pick">Pick a subject</button>
      </div>
    </div>`;
}


/* 4. BUTTONS AND KEYS ------------------------------------------------- */

function answerQuiz(choice) {
  if (!quiz || quiz.picked !== null || quiz.index >= quiz.questions.length) return;
  const question = quiz.questions[quiz.index];
  quiz.picked = choice;
  quiz.penaltyDone = false;
  if (choice === question.right) {
    quiz.results[quiz.index] = "right";
    sounds.rate(10);
  } else {
    quiz.results[quiz.index] = "wrong";
    sounds.down();
  }
  drawQuiz();
  quizArea.querySelector(".quiz-next, [data-quiz='did']")?.focus();
}

function nextQuizQuestion() {
  quiz.index += 1;
  quiz.picked = null;
  quiz.penaltyDone = false;

  if (quiz.index >= quiz.questions.length) {
    // Round over: save it, so it counts for XP, bests and the weekly boss
    const right = quiz.results.filter((r) => r === "right").length;
    logActivity("quiz", { s: quiz.subject.id, r: right, n: quiz.questions.length, p: quiz.penalties, reps: quiz.reps });
    render();
    drawQuiz();
    if (right === quiz.questions.length) {
      sounds.fanfare();
      confetti();
    } else {
      sounds.finish();
    }
    checkAchievements(true);
    quizArea.querySelector("[data-quiz='again']")?.focus();
    return;
  }
  drawQuiz();
  quizArea.querySelector(".quiz-answer")?.focus();
}

quizArea.addEventListener("click", (event) => {
  const subjectButton = event.target.closest("[data-subject]");
  if (subjectButton) {
    startAudio();
    startQuiz(subjectButton.dataset.subject);
    return;
  }

  const answerButton = event.target.closest("[data-answer]");
  if (answerButton) {
    answerQuiz(Number(answerButton.dataset.answer));
    return;
  }

  const button = event.target.closest("[data-quiz]");
  if (!button || !quiz) return;
  const action = button.dataset.quiz;
  const question = quiz.questions[quiz.index];

  if (action === "did") {
    const penalty = penaltyInfo(question.fix);
    quiz.penaltyDone = true;
    quiz.penalties += 1;
    quiz.reps += penalty.reps;
    stopTimer();
    sounds.done();
    drawQuiz();
    quizArea.querySelector(".quiz-next")?.focus();
  }

  if (action === "demo") {
    const penalty = penaltyInfo(question.fix);
    openDemo(penalty.demo, penalty.text, penalty.how);
  }

  if (action === "timer") {
    const penalty = penaltyInfo(question.fix);
    startTimer(penalty.text, penalty.seconds);
  }

  if (action === "next") nextQuizQuestion();

  if (action === "quit") {
    quiz = null;
    drawQuiz();
    showToast("Quiz stopped. Come back anytime!");
  }

  if (action === "again") startQuiz(quiz.subject.id);

  if (action === "pick") {
    quiz = null;
    drawQuiz();
    quizArea.querySelector(".quiz-subject")?.focus();
  }
});

// Keys 1 to 4 (or A to D) answer the question, on the Quiz tab
document.addEventListener("keydown", (event) => {
  if (currentTab !== "quiz" || !quiz || quiz.picked !== null || quiz.index >= quiz.questions.length) return;
  if (event.target.closest && event.target.closest("input, textarea, select")) return;
  const choice = "1234".indexOf(event.key) !== -1 ? "1234".indexOf(event.key) : "abcd".indexOf(event.key.toLowerCase());
  if (choice !== -1 && event.key.length === 1) answerQuiz(choice);
});
