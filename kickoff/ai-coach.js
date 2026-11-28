/* =============================================================
   ai-coach.js: ask Claude
   -------------------------------------------------------------
   On the Claude version of this page, you can ask Claude questions
   about workouts, food and sleep, or have it invent a drink from
   what's in your kitchen. Claude asks your permission the first
   time. On other copies (like github.io) this part shows a link to
   the Claude version instead.

   Everything Claude writes is shown as plain text (textContent),
   never as HTML, so it can't change the page.
   ============================================================= */

let askClaude = null;
let coachAnswering = null; // lets us stop an answer that's still coming in

const aiForm = document.querySelector("#ai-form");
const aiInput = document.querySelector("#ai-question");
const aiAnswer = document.querySelector("#ai-answer");
const aiAsk = document.querySelector("#ai-ask");

async function setUpAiCoach() {
  if (!window.claude || !window.claude.use) {
    document.querySelector("#ai-offline").hidden = false;
    aiForm.hidden = true;
    return;
  }
  askClaude = await window.claude.use("sample");
  if (!askClaude) {
    document.querySelector("#ai-offline").hidden = false;
    document.querySelector("#ai-offline").textContent = "The AI coach isn't available here right now.";
    aiForm.hidden = true;
  }
}

// What Claude is told before your question
function coachInstructions(question) {
  const plan = planFor(today);
  return `You are "Coach", a friendly, upbeat soccer fitness and food coach inside a training website called Kickoff.
You're talking with a young soccer player whose favorite players are Lamine Yamal and Neymar. You can use their playing styles as fun examples (like Yamal's cut inside or Neymar's step-overs), but never pretend to be them or make up things they said.

Rules:
- Keep answers short: at most 120 words, simple words, an encouraging tone. Use a short list when it helps.
- Be safe. Never suggest dieting, counting calories, losing weight, supplements, energy drinks or caffeine.
- Never tell them to push through pain. For pain, an injury, dizziness or feeling sick, tell them to stop and talk to a parent, coach or doctor.
- Recipes should be simple, healthy and kid-friendly, with ingredients and steps. Mention getting an adult's help with the stove, the oven or sharp knives.
- If the question isn't about soccer, exercise, food, drinks, sleep or healthy habits, kindly say you can only help with those.
- Write plain text only: no markdown symbols like ** or #.

About today: it's ${plan.day}, week ${weekOf(today)} of their plan. Today's workout is "${plan.title}" (level ${plan.level} of 12).

Their question: ${question}`;
}

aiForm.addEventListener("submit", async (event) => {
  event.preventDefault(); // stop the page from reloading
  const question = aiInput.value.trim();
  if (!question || !askClaude) return;

  if (coachAnswering) coachAnswering.abort(); // stop an older answer still coming in
  const controller = new AbortController();
  coachAnswering = controller;
  aiAnswer.hidden = false;
  aiAnswer.classList.remove("is-error");
  aiAnswer.textContent = "Thinking...";
  aiAsk.disabled = true;

  try {
    const result = await askClaude(coachInstructions(question), {
      signal: controller.signal,
      cache: false,
      onText: ({ text }) => {
        aiAnswer.textContent = text; // the answer appears as it's written
      },
    });
    aiAnswer.textContent = result.text;
  } catch (error) {
    if (controller.signal.aborted) return; // we stopped it on purpose
    aiAnswer.classList.add("is-error");
    if (error && error.code === "not_granted") {
      aiAnswer.textContent = "The coach needs your permission to answer. You can turn it on in this page's permissions.";
    } else if (error && error.code === "rate_limited") {
      aiAnswer.textContent = "The coach needs a short break. Try again in a minute!";
    } else {
      aiAnswer.textContent = "The coach couldn't answer right now. Try again in a moment.";
    }
  } finally {
    aiAsk.disabled = false;
  }
});

// The quick-start buttons fill in a question for you
document.querySelector("#ai-starters").addEventListener("click", (event) => {
  const starter = event.target.closest("[data-question]");
  if (!starter) return;
  aiInput.value = starter.dataset.question;
  aiInput.focus();
  // Questions that end in ":" need you to finish them, like listing ingredients
  if (!starter.dataset.question.endsWith(": ")) aiForm.requestSubmit();
});

setUpAiCoach();
