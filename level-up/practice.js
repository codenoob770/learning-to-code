/* =============================================================
   practice.js: my practice days
   -------------------------------------------------------------
   Pick which days you have swim, soccer or taekwondo practice.
   On those days the workout gets lighter (just one round, and
   never expert mode), because practice already counts as a
   workout. Saved like the rest of your progress, so it syncs.
   ============================================================= */

const SPORTS = [
  { id: "swim", name: "Swim", icon: "🏊" },
  { id: "soccer", name: "Soccer", icon: "⚽" },
  { id: "taekwondo", name: "Taekwondo", icon: "🥋" },
];

// The sports you have practice for on a date (an empty list if none)
function practiceFor(date) {
  const day = dayIndex(date);
  return SPORTS.filter((sport) => (practiceDays[sport.id] || []).includes(day));
}

function renderPractice() {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const fullDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  let html = `<div class="practice-grid__row practice-grid__row--head"><span></span>${days.map((d) => `<span>${d}</span>`).join("")}</div>`;
  for (const sport of SPORTS) {
    const on = practiceDays[sport.id] || [];
    html += `<div class="practice-grid__row"><span class="practice-grid__sport"><span aria-hidden="true">${sport.icon}</span> ${sport.name}</span>`;
    for (let day = 0; day < 7; day++) {
      const pressed = on.includes(day);
      html += `<button class="practice-day" type="button" data-sport="${sport.id}" data-day="${day}" aria-pressed="${pressed}" aria-label="${sport.name} on ${fullDays[day]}">${pressed ? sport.icon : ""}</button>`;
    }
    html += "</div>";
  }
  document.querySelector("#practice-grid").innerHTML = html;

  const count = SPORTS.reduce((sum, sport) => sum + (practiceDays[sport.id] || []).length, 0);
  document.querySelector("#practice-summary").textContent = count === 0
    ? "Tap the days you have practice. Those days get a lighter workout."
    : `${count} practice ${count === 1 ? "day" : "days"} a week. Those days get a lighter workout automatically.`;
}

document.querySelector("#practice-grid").addEventListener("click", (event) => {
  const button = event.target.closest("[data-sport]");
  if (!button) return;
  const sport = button.dataset.sport;
  const day = Number(button.dataset.day);
  const on = new Set(practiceDays[sport] || []);
  if (on.has(day)) on.delete(day);
  else on.add(day);
  practiceDays[sport] = [...on].sort();
  save("levelUp.practice", JSON.stringify(practiceDays));
  render();
  document.querySelector(`[data-sport="${sport}"][data-day="${day}"]`).focus(); // keep keyboard users in place
});
