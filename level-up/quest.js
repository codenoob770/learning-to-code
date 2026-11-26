/* =============================================================
   quest.js: the Quest Board
   -------------------------------------------------------------
   All the quests live in plan.js (QUESTS): the Backflip Quest,
   splits, handstand, 100 push-ups, juggling and Code Quest.

   Pick a quest card to open it. Check off a task when you can do
   it, and the next stage unlocks when you've finished every task
   in the one before. Each task earns XP (see trophies.js), and your
   checks sync like the rest of your progress.

   The Backflip Quest's stage 4, the real flip, is only with a
   coach. Safety first!
   ============================================================= */

let openQuestId = null;   // the quest that's open on the board (this device only)
let questJustFinished = -1; // a stage you just finished folds shut

function questById(id) {
  return QUESTS.find((quest) => quest.id === id);
}

function questStageDone(stage) {
  return stage.tasks.every((task) => questTasks.has(task.id));
}

// A stage is unlocked when every stage before it is done
function questStageUnlocked(quest, index) {
  return quest.stages.slice(0, index).every(questStageDone);
}

// How far along a quest is
function questProgress(quest) {
  const tasks = quest.stages.flatMap((stage) => stage.tasks);
  const done = tasks.filter((task) => questTasks.has(task.id)).length;
  const current = quest.stages.findIndex((stage) => !questStageDone(stage)); // -1 = all done
  return { done, total: tasks.length, current, complete: current === -1 };
}

function questXP(quest) {
  return quest.code ? XP_RULES.codeTask : XP_RULES.questTask;
}

function renderQuest() {
  // The first time, open a quest you've started (or the first one)
  if (!openQuestId) {
    const started = QUESTS.find((quest) => {
      const progress = questProgress(quest);
      return progress.done > 0 && !progress.complete;
    });
    openQuestId = (started || QUESTS[0]).id;
  }
  renderQuestCards();
  renderQuestDetail(questById(openQuestId));
}

// The row of quest cards at the top of the board
function renderQuestCards() {
  document.querySelector("#quest-cards").innerHTML = QUESTS.map((quest) => {
    const progress = questProgress(quest);
    const stage = progress.complete ? "✓ Complete!" : `Stage ${progress.current + 1} of ${quest.stages.length}`;
    return `
      <button class="quest-card ${progress.complete ? "is-complete" : ""}" type="button" data-quest="${quest.id}" aria-pressed="${quest.id === openQuestId}">
        <span class="quest-card__icon" aria-hidden="true">${quest.icon}</span>
        <span class="quest-card__name">${quest.name}</span>
        <span class="quest-card__stage">${stage}</span>
        <span class="quest-card__bar" aria-hidden="true"><span style="width: ${(progress.done / progress.total) * 100}%"></span></span>
      </button>`;
  }).join("");
}

// One quest, opened up: its stages and tasks
function renderQuestDetail(quest) {
  const box = document.querySelector("#quest-stages");
  // Keep the stages you opened, unless the quest changed
  const wasOpen = box.dataset.quest === quest.id ? [...box.querySelectorAll(".quest-stage")].map((stage) => stage.open) : [];
  box.dataset.quest = quest.id;
  const progress = questProgress(quest);

  document.querySelector("#quest-detail-title").textContent = `${quest.icon} ${quest.name}`;
  document.querySelector("#quest-blurb").textContent = quest.blurb;
  document.querySelector("#quest-safety").innerHTML = `<strong>${quest.code ? "💡 Tip:" : "⚠️ Safety first:"}</strong> ${quest.safety}`;
  document.querySelector("#quest-xp").textContent = `+${questXP(quest)} XP per task`;
  document.querySelector("#quest-progress-text").textContent = progress.complete
    ? `Quest complete! ${progress.done} of ${progress.total} tasks. You did it! 🎉`
    : `Stage ${progress.current + 1} of ${quest.stages.length} · ${progress.done} of ${progress.total} tasks done`;
  document.querySelector("#quest-fill").style.width = `${(progress.done / progress.total) * 100}%`;

  box.innerHTML = quest.stages.map((stage, index) => {
    const unlocked = questStageUnlocked(quest, index);
    const done = questStageDone(stage);
    const open = index === progress.current || (wasOpen[index] && index !== questJustFinished);
    const tasksDone = stage.tasks.filter((task) => questTasks.has(task.id)).length;
    let status = `${tasksDone}/${stage.tasks.length}`;
    if (done) status = "✓ Done";
    if (!unlocked) status = "🔒 Locked";

    const tasks = stage.tasks.map((task) => `
      <li class="quest-task">
        <input type="checkbox" id="quest-${task.id}" data-task="${task.id}" ${questTasks.has(task.id) ? "checked" : ""} ${unlocked ? "" : "disabled"}>
        <label for="quest-${task.id}">${escapeHTML(task.text)}</label>
        ${task.demo ? `<button class="demo-button" type="button" data-quest-demo="${task.id}"><span data-demo-icon="${task.demo}"></span>Show me</button>` : ""}
        ${task.steps ? codeStepsHTML(task) : ""}
      </li>`).join("");

    return `
      <details class="quest-stage ${unlocked ? "" : "is-locked"} ${done ? "is-done" : ""} ${stage.coachOnly ? "is-coach" : ""}" ${open ? "open" : ""}>
        <summary>
          <span class="quest-stage__number">${index + 1}</span>
          <span class="quest-stage__title">${stage.title}</span>
          <span class="quest-stage__status">${status}</span>
        </summary>
        <div class="quest-stage__body">
          ${unlocked ? "" : `<p class="quest-stage__locked">Finish stage ${index} to unlock this one.</p>`}
          ${stage.coachOnly ? `<p class="quest-coach"><strong>Coach only:</strong> never try a backflip by yourself. Do this stage with a coach spotting you on mats.</p>` : ""}
          <p class="quest-stage__why">${stage.why}</p>
          ${stage.where ? `<p class="quest-stage__where"><strong>Where:</strong> ${stage.where}</p>` : ""}
          <ul class="quest-tasks">${tasks}</ul>
        </div>
      </details>`;
  }).join("");

  fillDemoIcons(box); // little pictures in the "Show me" buttons
  questJustFinished = -1;
}

// Code Quest: "How to do it" steps, and code you can copy
function codeStepsHTML(task) {
  const steps = task.steps.map((step) => `<li>${escapeHTML(step)}</li>`).join("");
  return `
    <details class="code-steps">
      <summary>How to do it</summary>
      <ol>${steps}</ol>
      ${task.code ? `
        <div class="code-box">
          <pre><code>${escapeHTML(task.code)}</code></pre>
          <button class="text-button" type="button" data-copy-code>Copy</button>
        </div>` : ""}
    </details>`;
}

// Picking a quest card
document.querySelector("#quest-cards").addEventListener("click", (event) => {
  const card = event.target.closest("[data-quest]");
  if (!card) return;
  openQuestId = card.dataset.quest;
  renderQuest();
  document.querySelector("#quest-detail").scrollIntoView({ behavior: "smooth", block: "start" });
});

// Ticking a task
document.querySelector("#quest-stages").addEventListener("change", (event) => {
  const box = event.target.closest("[data-task]");
  if (!box) return;
  const quest = questById(openQuestId);
  const stageBefore = questProgress(quest).current;
  if (box.checked) questTasks.add(box.dataset.task);
  else questTasks.delete(box.dataset.task);
  save("levelUp.quest", JSON.stringify([...questTasks]));

  const stageAfter = questProgress(quest).current;
  if (stageAfter === -1 || stageAfter > stageBefore) questJustFinished = stageBefore;
  render();
  if (stageAfter === -1 && stageBefore !== -1) {
    showToast(`${quest.name} complete! Legend! ${quest.icon}`);
  } else if (stageAfter > stageBefore) {
    showToast(`Stage ${stageBefore + 1} done! Stage ${stageAfter + 1} unlocked! 🔓`);
  } else if (box.checked) {
    showToast(`+${questXP(quest)} XP! Quest task done.`);
  }
  sounds.rate(box.checked ? 9 : 3);
  checkAchievements(true);
  document.querySelector(`#quest-${box.dataset.task}`).focus(); // keep keyboard users in place
});

document.querySelector("#quest-stages").addEventListener("click", (event) => {
  // "Show me" buttons open the stick-figure demo (demos.js)
  const button = event.target.closest("[data-quest-demo]");
  if (button) {
    const task = QUESTS.flatMap((quest) => quest.stages.flatMap((stage) => stage.tasks)).find((t) => t.id === button.dataset.questDemo);
    if (task) openDemo(task.demo, task.text.split(" (")[0].split(". ")[0], task.text);
    return;
  }

  // "Copy" buttons copy a bit of code
  const copy = event.target.closest("[data-copy-code]");
  if (copy) {
    const code = copy.parentElement.querySelector("code");
    copyText(code.textContent, code).then((copied) => {
      showToast(copied ? "Copied! Now paste it in VS Code (Ctrl+V)." : "Selected! Press Ctrl+C to copy it.");
    });
  }
});

// Copies text. If the browser won't allow it, selects it instead so you can copy it yourself.
async function copyText(text, element) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    return false;
  }
}
