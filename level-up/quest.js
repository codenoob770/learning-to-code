/* =============================================================
   quest.js: side quest, the Backflip Quest
   -------------------------------------------------------------
   The stages and tasks live in plan.js (SIDE_QUEST). Check off a
   task when you can do it, and the next stage unlocks when you've
   finished every task in the one before. Each task earns XP (see
   trophies.js), and your checks sync like the rest of your progress.

   Stage 4, the real backflip, is only with a coach. Safety first!
   ============================================================= */

function questStageDone(stage) {
  return stage.tasks.every((task) => questTasks.has(task.id));
}

// A stage is unlocked when every stage before it is done
function questStageUnlocked(index) {
  return SIDE_QUEST.stages.slice(0, index).every(questStageDone);
}

let questJustFinished = -1; // a stage you just finished folds shut

function renderQuest() {
  const box = document.querySelector("#quest-stages");
  const wasOpen = [...box.querySelectorAll(".quest-stage")].map((stage) => stage.open); // keep stages you opened
  const stages = SIDE_QUEST.stages;
  const allTasks = stages.flatMap((stage) => stage.tasks);
  const doneCount = allTasks.filter((task) => questTasks.has(task.id)).length;
  const current = stages.findIndex((stage) => !questStageDone(stage)); // -1 = all done

  document.querySelector("#quest-progress-text").textContent = current === -1
    ? `Quest complete! ${doneCount} of ${allTasks.length} tasks. You did it! 🎉`
    : `Stage ${current + 1} of ${stages.length} · ${doneCount} of ${allTasks.length} tasks done`;
  document.querySelector("#quest-fill").style.width = `${(doneCount / allTasks.length) * 100}%`;

  box.innerHTML = stages.map((stage, index) => {
    const unlocked = questStageUnlocked(index);
    const done = questStageDone(stage);
    const open = index === current || (wasOpen[index] && index !== questJustFinished);
    const tasksDone = stage.tasks.filter((task) => questTasks.has(task.id)).length;
    let status = `${tasksDone}/${stage.tasks.length}`;
    if (done) status = "✓ Done";
    if (!unlocked) status = "🔒 Locked";

    const tasks = stage.tasks.map((task) => `
      <li class="quest-task">
        <input type="checkbox" id="quest-${task.id}" data-task="${task.id}" ${questTasks.has(task.id) ? "checked" : ""} ${unlocked ? "" : "disabled"}>
        <label for="quest-${task.id}">${task.text}</label>
        ${task.demo ? `<button class="demo-button" type="button" data-quest-demo="${task.id}"><span data-demo-icon="${task.demo}"></span>Show me</button>` : ""}
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

// Ticking a task
document.querySelector("#quest-stages").addEventListener("change", (event) => {
  const box = event.target.closest("[data-task]");
  if (!box) return;
  const stageBefore = SIDE_QUEST.stages.findIndex((stage) => !questStageDone(stage));
  if (box.checked) questTasks.add(box.dataset.task);
  else questTasks.delete(box.dataset.task);
  save("levelUp.quest", JSON.stringify([...questTasks]));

  const stageAfter = SIDE_QUEST.stages.findIndex((stage) => !questStageDone(stage));
  if (stageAfter === -1 || stageAfter > stageBefore) questJustFinished = stageBefore;
  render();
  if (stageAfter === -1 && stageBefore !== -1) {
    showToast("Backflip Quest complete! Legend! 🤸");
  } else if (stageAfter > stageBefore) {
    showToast(`Stage ${stageBefore + 1} done! Stage ${stageAfter + 1} unlocked! 🔓`);
  } else if (box.checked) {
    showToast(`+${XP_RULES.questTask} XP! Quest task done.`);
  }
  sounds.rate(box.checked ? 9 : 3);
  checkAchievements(true);
  document.querySelector(`#quest-${box.dataset.task}`).focus(); // keep keyboard users in place
});

// "Show me" buttons open the stick-figure demo (demos.js)
document.querySelector("#quest-stages").addEventListener("click", (event) => {
  const button = event.target.closest("[data-quest-demo]");
  if (!button) return;
  const task = SIDE_QUEST.stages.flatMap((stage) => stage.tasks).find((t) => t.id === button.dataset.questDemo);
  if (task) openDemo(task.demo, task.text.split(" (")[0].split(". ")[0], task.text);
});
