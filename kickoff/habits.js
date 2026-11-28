/* =============================================================
   habits.js: water and sleep
   -------------------------------------------------------------
   Tap a glass for each glass of water you drink, and log how many
   hours you slept last night. Both are huge for sports! Saved for
   each day like the rest of your progress, so it syncs, and both
   earn XP (see trophies.js).
   ============================================================= */

const WATER_GOAL = 8;
const SLEEP_CHOICES = [6, 7, 8, 9, 10, 11];

function habitsFor(date) {
  return habits[toKey(date)] || { water: 0, sleep: null };
}

function saveHabits(date, changes) {
  habits[toKey(date)] = { ...habitsFor(date), ...changes };
  save("kickoff.habits", JSON.stringify(habits));
  render();
  checkAchievements(true);
}

function renderHabits() {
  const day = habitsFor(selected);
  const future = selected > today;

  // Water: one button per glass. Tapping glass 5 means "I've had 5".
  let glasses = "";
  for (let i = 1; i <= WATER_GOAL; i++) {
    const full = i <= day.water;
    glasses += `<button class="glass ${full ? "is-full" : ""}" type="button" data-glass="${i}" aria-pressed="${full}" aria-label="${i} ${i === 1 ? "glass" : "glasses"}" ${future ? "disabled" : ""}>
      <svg viewBox="0 0 24 30" aria-hidden="true"><path class="glass__water" d="M5.6 12 H18.4 L17 27 H7 Z"/><path class="glass__cup" d="M3 3 H21 L18.5 28 H5.5 Z"/></svg>
    </button>`;
  }
  document.querySelector("#water-glasses").innerHTML = glasses;
  document.querySelector("#water-count").textContent = future
    ? "You can fill these in on the day."
    : `${day.water} of ${WATER_GOAL} glasses${day.water >= WATER_GOAL ? " 🎉 Goal reached!" : ""}`;

  // Sleep: pick the hours
  document.querySelector("#sleep-choices").innerHTML = SLEEP_CHOICES.map((hours) => {
    const label = hours === 11 ? "11+" : String(hours);
    return `<button class="sleep-choice" type="button" data-sleep="${hours}" aria-pressed="${day.sleep === hours}" ${future ? "disabled" : ""}>${label}</button>`;
  }).join("");
  let sleepNote = "Growing athletes need lots of sleep. Aim for 9 hours or more.";
  if (day.sleep !== null) {
    sleepNote = day.sleep >= 9
      ? `${day.sleep} hours. Great sleep! Your muscles thank you.`
      : `${day.sleep} hours. Try going to bed a little earlier tonight.`;
  }
  document.querySelector("#sleep-note").textContent = sleepNote;
}

document.querySelector("#water-glasses").addEventListener("click", (event) => {
  const glass = event.target.closest("[data-glass]");
  if (!glass) return;
  const number = Number(glass.dataset.glass);
  // Tapping the last full glass again empties it (in case you tapped too many)
  const water = habitsFor(selected).water === number ? number - 1 : number;
  saveHabits(selected, { water });
  if (water > 0) sounds.rate(water + 2);
  document.querySelector(`[data-glass="${number}"]`).focus();
});

document.querySelector("#sleep-choices").addEventListener("click", (event) => {
  const choice = event.target.closest("[data-sleep]");
  if (!choice) return;
  const hours = Number(choice.dataset.sleep);
  // Tapping the chosen one again clears it
  saveHabits(selected, { sleep: habitsFor(selected).sleep === hours ? null : hours });
  document.querySelector(`[data-sleep="${hours}"]`).focus();
});
