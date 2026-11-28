/* =============================================================
   family.js: the Family tab
   -------------------------------------------------------------
   A weekly family challenge! Add your family (like your sister,
   mom or dad), and everyone races for the same goal all week.
   Some challenges count your score by themselves (like glasses of
   water). For the others, tap + to add points. Everyone can play
   on your device, or tell you their number.

   A new challenge starts every Monday.

   This file loads before app.js, so it only uses app.js's
   functions inside its own functions, never right away.
   ============================================================= */

// "auto" counts YOUR score from your progress (from and to are days, like "2026-12-01").
// Everyone else's points get added with the + buttons.
const FAMILY_CHALLENGES = [
  { icon: "💧", name: "Water Week", what: "glasses of water", auto: (from, to) => Object.entries(habits).filter(([k]) => k >= from && k <= to).reduce((sum, [, day]) => sum + (day.water || 0), 0) },
  { icon: "💪", name: "Push-up Party", what: "push-ups (count them!)" },
  { icon: "🏋️", name: "Workout Week", what: "workouts", auto: (from, to) => COUNT.workouts(from, to) },
  { icon: "🦵", name: "Squat Squad", what: "squats" },
  { icon: "🎯", name: "Mission Week", what: "daily missions", auto: (from, to) => COUNT.missions(from, to) },
  { icon: "🥦", name: "Veggie Week", what: "fruits and veggies eaten" },
  { icon: "🚶", name: "Walk & Talk", what: "minutes of walking" },
  { icon: "⭐", name: "Jumping Jack Jam", what: "jumping jacks" },
];

const FAMILY_EMOJIS = ["🦁", "🐯", "🐼", "🦊", "🐸", "🐵", "🦄", "🐙"];
let familyEmoji = FAMILY_EMOJIS[0]; // the emoji picked in the "add someone" form
let familyRemoving = null;           // someone you tapped "Remove" on once

function familyChallengeFor(monday) {
  const weekNumber = Math.floor(daysBetween(new Date(2024, 0, 1), monday) / 7);
  return FAMILY_CHALLENGES[((weekNumber % FAMILY_CHALLENGES.length) + FAMILY_CHALLENGES.length) % FAMILY_CHALLENGES.length];
}

// Everyone's score for the week starting on "monday", best first
function familyScores(monday) {
  const from = toKey(monday);
  const to = toKey(addDays(monday, 6));
  const challenge = familyChallengeFor(monday);
  const saved = (familyData.scores || {})[from] || {};
  const players = [{ id: "me", name: "Me", emoji: "⭐" }, ...familyData.players];
  return players.map((player) => ({
    ...player,
    score: player.id === "me" && challenge.auto ? challenge.auto(from, to) : saved[player.id] || 0,
    auto: player.id === "me" && Boolean(challenge.auto),
  })).sort((a, b) => b.score - a.score);
}

// The winner of a week: the one top score (no winner if it's a tie or nobody scored)
function familyWinner(monday) {
  const [first, second] = familyScores(monday);
  if (!first || first.score === 0 || (second && second.score === first.score)) return null;
  return first;
}

// Weeks YOU won (only weeks that are over), for XP and a badge
function familyWins() {
  if (familyData.players.length === 0) return 0;
  let wins = 0;
  for (let monday = mondayOf(planStart); addDays(monday, 6) < today; monday = addDays(monday, 7)) {
    const winner = familyWinner(monday);
    if (winner && winner.id === "me") wins += 1;
  }
  return wins;
}

function renderFamily() {
  const monday = mondayOf(today);
  const challenge = familyChallengeFor(monday);
  const daysLeft = 6 - dayIndex(today);
  document.querySelector("#family-challenge").textContent = `${challenge.icon} ${challenge.name}`;
  document.querySelector("#family-goal").textContent = `Who gets the most ${challenge.what} this week? ${daysLeft === 0 ? "Last day!" : `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left.`}`;

  const scores = familyScores(monday);
  const leader = familyWinner(monday);
  document.querySelector("#family-board").innerHTML = scores.map((player, i) => `
    <li class="family-player ${leader && leader.id === player.id ? "is-leader" : ""}">
      <span class="family-player__rank">${leader && leader.id === player.id ? "👑" : i + 1}</span>
      <span class="family-player__emoji" aria-hidden="true">${player.emoji}</span>
      <span class="family-player__name">${escapeHTML(player.name)}</span>
      <span class="family-player__score">${player.score}</span>
      ${player.auto
        ? `<span class="family-player__auto">counts itself</span>`
        : `<span class="family-player__buttons">
            <button class="text-button" type="button" data-family-add="${player.id}:-1" aria-label="Take 1 point from ${escapeHTML(player.name)}">−1</button>
            <button class="text-button" type="button" data-family-add="${player.id}:1" aria-label="Give ${escapeHTML(player.name)} 1 point">+1</button>
            <button class="text-button" type="button" data-family-add="${player.id}:5" aria-label="Give ${escapeHTML(player.name)} 5 points">+5</button>
          </span>`}
    </li>`).join("");

  document.querySelector("#family-empty").hidden = familyData.players.length > 0;

  // Past winners (the last 4 weeks that are over)
  const past = [];
  for (let i = 1; i <= 4; i++) {
    const pastMonday = addDays(monday, -7 * i);
    if (pastMonday < mondayOf(planStart)) break;
    const winner = familyWinner(pastMonday);
    const pastChallenge = familyChallengeFor(pastMonday);
    past.push(`<li>${shortDate(pastMonday)} · ${pastChallenge.icon} ${pastChallenge.name}: ${winner ? `${winner.emoji} ${escapeHTML(winner.name)} won!` : "no winner"}</li>`);
  }
  document.querySelector("#family-past").innerHTML = past.join("") || "<li>Past winners show up here.</li>";

  // The people you can remove, and the emoji picker
  document.querySelector("#family-people").innerHTML = familyData.players.map((player) => `
    <li><span>${player.emoji} ${escapeHTML(player.name)}</span>
    <button class="text-button" type="button" data-family-remove="${player.id}">Remove</button></li>`).join("");
  document.querySelector("#family-emojis").innerHTML = FAMILY_EMOJIS.map((emoji) => `
    <button class="pick" type="button" data-family-emoji="${emoji}" aria-pressed="${emoji === familyEmoji}" aria-label="Pick ${emoji}">${emoji}</button>`).join("");
}

function saveFamily() {
  saveJSON("levelUp.family", familyData);
}

document.querySelector("#family").addEventListener("click", (event) => {
  const add = event.target.closest("[data-family-add]");
  if (add) {
    const [id, change] = add.dataset.familyAdd.split(":");
    const week = toKey(mondayOf(today));
    familyData.scores = familyData.scores || {};
    familyData.scores[week] = familyData.scores[week] || {};
    familyData.scores[week][id] = Math.max(0, (familyData.scores[week][id] || 0) + Number(change));
    saveFamily();
    sounds.count();
    render();
    document.querySelector(`[data-family-add="${id}:${change}"]`)?.focus();
    return;
  }
  const emoji = event.target.closest("[data-family-emoji]");
  if (emoji) {
    familyEmoji = emoji.dataset.familyEmoji;
    renderFamily();
    document.querySelector(`[data-family-emoji="${familyEmoji}"]`).focus();
    return;
  }
  // Removing someone takes two taps, so nobody gets removed by accident
  const remove = event.target.closest("[data-family-remove]");
  if (remove) {
    const id = remove.dataset.familyRemove;
    if (familyRemoving === id) {
      familyRemoving = null;
      familyData.players = familyData.players.filter((p) => p.id !== id);
      saveFamily();
      render();
      showToast("Removed from the family board.");
    } else {
      familyRemoving = id;
      remove.textContent = "Tap again to remove";
      setTimeout(() => {
        if (familyRemoving === id) {
          familyRemoving = null;
          renderFamily();
        }
      }, 3000);
    }
  }
});

document.querySelector("#family-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.querySelector("#family-name");
  const name = input.value.trim().slice(0, 20);
  if (!name) {
    showToast("Type a name first!");
    input.focus();
    return;
  }
  if (familyData.players.length >= 8) {
    showToast("That's a full team! (8 people max)");
    return;
  }
  familyData.players.push({ id: makeId(), name, emoji: familyEmoji });
  saveFamily();
  input.value = "";
  const added = familyEmoji;
  // Pick an emoji nobody has yet, for the next person
  familyEmoji = FAMILY_EMOJIS.find((e) => !familyData.players.some((p) => p.emoji === e)) || FAMILY_EMOJIS[0];
  sounds.done();
  showToast(`${added} ${name} joined the family challenge!`);
  render();
});
