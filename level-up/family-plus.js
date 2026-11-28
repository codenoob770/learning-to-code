/* =============================================================
   family-plus.js: more for the Family tab
   -------------------------------------------------------------
   1. Family Sports Day: silly events, scores and a medal ceremony
   2. Cheer Messages: your family hides a note for your next workout
   3. Plugging in (XP, badges, saved data: see hooks.js)

   (Challenge Codes and the Secret Message Machine are on the Family
   tab too: they're in codes.js, because Kickoff uses them as well.)

   This file loads before app.js, so it only uses app.js's
   functions inside its own functions, never right away.
   ============================================================= */


/* 1. FAMILY SPORTS DAY -------------------------------------------------------
   Pick the events and who's playing. Type in everyone's score for
   each event. 1st place gets 3 points, 2nd gets 2 and 3rd gets 1.
   Most points at the end wins the gold medal!                      */

const SPORTS_DAY_EVENTS = [
  { id: "sock", icon: "🧦", name: "Sock toss", how: "Toss 10 rolled-up socks into a basket from 3 big steps away.", unit: "socks in", better: "high" },
  { id: "plank", icon: "🧱", name: "Plank-off", how: "Everyone planks at once. Time how long each person lasts!", unit: "seconds", better: "high" },
  { id: "sprint", icon: "🏃", name: "Backyard sprint", how: "Race to the finish line, one at a time. Time each person.", unit: "seconds", better: "low" },
  { id: "jacks", icon: "⭐", name: "Jumping jack blitz", how: "Most jumping jacks in 30 seconds.", unit: "jacks", better: "high" },
  { id: "flamingo", icon: "🦩", name: "Flamingo balance", how: "Stand on one foot with your eyes closed. Time it!", unit: "seconds", better: "high" },
  { id: "jump", icon: "🐸", name: "Frog jump", how: "Jump as far as you can from a line. Count the shoe-lengths (heel to toe).", unit: "shoes", better: "high" },
  { id: "kicks", icon: "🥋", name: "Kick count", how: "Most front kicks in 30 seconds (switch legs whenever you want).", unit: "kicks", better: "high" },
  { id: "spoon", icon: "🥄", name: "Spoon race", how: "Carry a ball on a spoon to the finish. Drop it? Go back to the start!", unit: "seconds", better: "low" },
  { id: "keepy", icon: "⚽", name: "Keepy-uppy", how: "Most touches in a row before the ball hits the ground.", unit: "touches", better: "high" },
  { id: "wall", icon: "🧱", name: "Wall sit showdown", how: "Everyone wall sits. Last one standing wins!", unit: "seconds", better: "high" },
];
const SPORTS_DAY_POINTS = [3, 2, 1];
const SPORTS_DAY_XP = 40;

let sportsDay = { active: null, history: [] }; // active: { d, events, players, scores } (saved)
let sportsPicks = ["sock", "plank", "jacks"]; // the events picked in the setup
let sportsCeremony = null; // the results being shown

function sportsPlayers() {
  return [{ id: "me", name: "Me", emoji: "⭐" }, ...familyData.players];
}

function sportsPlayer(id) {
  return sportsPlayers().find((player) => player.id === id) || { id, name: "?", emoji: "🙂" };
}

// Points for one event: { playerId: points }. Ties get the same place.
function eventPoints(event, scores) {
  const entries = Object.entries(scores || {}).filter(([, value]) => value !== "" && value !== null && Number.isFinite(Number(value)));
  const sorted = entries.map(([id, value]) => [id, Number(value)]).sort((a, b) => (event.better === "low" ? a[1] - b[1] : b[1] - a[1]));
  const points = {};
  sorted.forEach(([id, value]) => {
    const place = sorted.findIndex(([, v]) => v === value); // ties share the better place
    points[id] = SPORTS_DAY_POINTS[place] || 0;
  });
  return points;
}

function sportsTotals(day) {
  const totals = Object.fromEntries(day.players.map((id) => [id, 0]));
  for (const id of day.events) {
    const event = SPORTS_DAY_EVENTS.find((item) => item.id === id);
    const points = eventPoints(event, day.scores[id]);
    for (const [player, value] of Object.entries(points)) totals[player] = (totals[player] || 0) + value;
  }
  return Object.entries(totals).sort((a, b) => b[1] - a[1]);
}

function drawSportsDay() {
  const area = document.querySelector("#sportsday-area");
  if (sportsCeremony) {
    const podium = sportsCeremony.slice(0, 3);
    const medal = ["🥇", "🥈", "🥉"];
    // A tie shares the place (and the medal)
    const place = (i) => sportsCeremony.findIndex(([, points]) => points === podium[i][1]);
    const order = [1, 0, 2].filter((i) => podium[i]); // 2nd, 1st, 3rd, like a real podium
    const winners = sportsCeremony.filter(([, points]) => points === podium[0][1]).map(([id]) => escapeHTML(sportsPlayer(id).name));
    area.innerHTML = `
      <div class="ceremony">
        <p class="eyebrow">// medal ceremony</p>
        <div class="podium">${order.map((i) => {
          const [id, points] = podium[i];
          const player = sportsPlayer(id);
          return `<div class="podium__spot podium__spot--${place(i) + 1}">
            <span class="podium__medal" aria-hidden="true">${medal[place(i)]}</span>
            <span class="podium__who">${player.emoji} ${escapeHTML(player.name)}</span>
            <span class="podium__points">${plural(points, "point")}</span>
            <span class="podium__block">${place(i) + 1}</span>
          </div>`;
        }).join("")}</div>
        <p class="ceremony__line">🎉 Congratulations, ${winners.join(" and ")}!${winners.length > 1 ? " It's a tie for gold!" : ""} Everyone did awesome! 🎉</p>
        <button class="button" type="button" data-sports="done">Done</button>
      </div>`;
    return;
  }
  const day = sportsDay.active;
  if (!day) {
    const people = sportsPlayers();
    const past = sportsDay.history.slice(-3).reverse().map((entry) => `<li><span>${chartDate(entry.d)}</span><span>🥇 ${escapeHTML(entry.winner)}</span></li>`).join("");
    area.innerHTML = `
      <p class="field-label">1. Pick 3 to 6 events</p>
      <div class="sports-events">${SPORTS_DAY_EVENTS.map((event) => `
        <button class="sports-event ${sportsPicks.includes(event.id) ? "is-on" : ""}" type="button" data-sports-pick="${event.id}" aria-pressed="${sportsPicks.includes(event.id)}">
          <span aria-hidden="true">${event.icon}</span> <strong>${event.name}</strong><span>${event.how}</span>
        </button>`).join("")}
      </div>
      <p class="field-label">2. Who's playing?</p>
      ${people.length > 1
        ? `<div class="lab-chips" role="group" aria-label="Players">${people.map((player) => `<label class="lab-chip sports-who"><input type="checkbox" data-sports-player="${player.id}" checked> ${player.emoji} ${escapeHTML(player.name)}</label>`).join("")}</div>`
        : `<p class="empty-note">Add your family in the Family Challenge above first. Then they can play too!</p>`}
      <button class="button" type="button" data-sports="start" ${people.length > 1 ? "" : "disabled"}>🏁 Start Sports Day!</button>
      ${past ? `<p class="field-label">Past champions</p><ul class="recent">${past}</ul>` : ""}`;
    return;
  }
  const totals = sportsTotals(day);
  const allScored = day.events.every((id) => day.players.every((p) => day.scores[id] && day.scores[id][p] !== undefined && day.scores[id][p] !== ""));
  area.innerHTML = `
    <div class="sports-board">
      <p class="field-label">🏆 Points so far</p>
      <ol class="sports-totals">${totals.map(([id, points], i) => {
        const player = sportsPlayer(id);
        return `<li class="${i === 0 && points > 0 ? "is-leader" : ""}"><span>${player.emoji} ${escapeHTML(player.name)}</span><strong>${points}</strong></li>`;
      }).join("")}</ol>
    </div>
    <div class="sports-cards">${day.events.map((id) => {
      const event = SPORTS_DAY_EVENTS.find((item) => item.id === id);
      const points = eventPoints(event, day.scores[id]);
      return `<div class="sports-card">
        <p class="sports-card__title">${event.icon} ${event.name}</p>
        <p class="sports-card__how">${event.how} <em>(${event.better === "low" ? "lowest" : "highest"} wins)</em></p>
        ${day.players.map((pid) => {
          const player = sportsPlayer(pid);
          const value = (day.scores[id] || {})[pid];
          const got = points[pid];
          return `<label class="sports-score">
            <span>${player.emoji} ${escapeHTML(player.name)}</span>
            <input class="input" type="number" min="0" step="any" inputmode="decimal" data-sports-score="${id}" data-player="${pid}" value="${value ?? ""}" aria-label="${escapeHTML(player.name)}'s ${event.name} score, in ${event.unit}">
            <span class="sports-score__unit">${event.unit}</span>
            <span class="sports-score__medal" aria-hidden="true">${got === 3 ? "🥇" : got === 2 ? "🥈" : got === 1 ? "🥉" : ""}</span>
          </label>`;
        }).join("")}
      </div>`;
    }).join("")}</div>
    <div class="brain-start__buttons">
      <button class="button" type="button" data-sports="finish" ${allScored ? "" : "disabled"}>🏅 Medal ceremony!</button>
      <button class="text-button" type="button" data-sports="cancel">Stop Sports Day</button>
      ${allScored ? "" : `<p class="game-help">Type in everyone's score for every event to get to the medal ceremony.</p>`}
    </div>`;
}

const sportsArea = document.querySelector("#sportsday-area");

sportsArea.addEventListener("click", (event) => {
  const pick = event.target.closest("[data-sports-pick]");
  if (pick) {
    const id = pick.dataset.sportsPick;
    if (sportsPicks.includes(id)) sportsPicks = sportsPicks.filter((item) => item !== id);
    else if (sportsPicks.length < 6) sportsPicks = [...sportsPicks, id];
    else showToast("6 events is the most!");
    drawSportsDay();
    document.querySelector(`[data-sports-pick="${id}"]`)?.focus();
    return;
  }
  const button = event.target.closest("[data-sports]");
  if (!button) return;
  const action = button.dataset.sports;
  if (action === "start") {
    const players = [...sportsArea.querySelectorAll("[data-sports-player]:checked")].map((box) => box.dataset.sportsPlayer);
    if (sportsPicks.length < 3) {
      showToast("Pick at least 3 events!");
      return;
    }
    if (players.length < 2) {
      showToast("Sports Day needs at least 2 players!");
      return;
    }
    sportsDay = { ...sportsDay, active: { d: toKey(today), events: [...sportsPicks], players, scores: {} } };
    startAudio();
    sounds.fanfare();
  }
  if (action === "cancel") sportsDay = { ...sportsDay, active: null };
  if (action === "finish" && sportsDay.active) {
    const totals = sportsTotals(sportsDay.active);
    sportsCeremony = totals;
    const golds = totals.filter(([, points]) => points === totals[0][1]).map(([id]) => id);
    const winner = golds.map((id) => sportsPlayer(id).name).join(" & ");
    sportsDay = { active: null, history: [...sportsDay.history, { d: toKey(today), winner, totals }].slice(-20) };
    if (!logOf("sportsDay").some((entry) => entry.d === toKey(today))) logActivity("sportsDay", { won: golds.includes("me") });
    startAudio();
    sounds.fanfare();
    confetti();
    render();
    checkAchievements(true);
  }
  if (action === "done") sportsCeremony = null;
  saveJSON("levelUp.sportsDay", sportsDay);
  drawSportsDay();
  sportsArea.scrollIntoView({ block: "nearest" });
});

// Typing a score: save it, and update the medals and points (without redrawing the box you're typing in)
sportsArea.addEventListener("change", (event) => {
  const input = event.target.closest("[data-sports-score]");
  if (!input || !sportsDay.active) return;
  const id = input.dataset.sportsScore;
  const scores = { ...(sportsDay.active.scores[id] || {}), [input.dataset.player]: input.value === "" ? "" : Number(input.value) };
  sportsDay = { ...sportsDay, active: { ...sportsDay.active, scores: { ...sportsDay.active.scores, [id]: scores } } };
  saveJSON("levelUp.sportsDay", sportsDay);
  const focused = document.activeElement && document.activeElement.dataset ? [document.activeElement.dataset.sportsScore, document.activeElement.dataset.player] : null;
  drawSportsDay();
  if (focused && focused[0]) document.querySelector(`[data-sports-score="${focused[0]}"][data-player="${focused[1]}"]`)?.focus();
});


/* 2. CHEER MESSAGES ----------------------------------------------------------------
   Someone in your family writes a cheer and hides it. It pops up the
   next time you finish a workout! (No peeking: it stays hidden until
   then.)                                                             */

let cheers = []; // [{ id, from, text, after, shown }] (saved)
let cheerShowing = false;

function cheersWaiting() {
  return cheers.filter((cheer) => !cheer.shown);
}

function drawCheers() {
  const area = document.querySelector("#cheers-area");
  const waiting = cheersWaiting().length;
  const wall = cheers.filter((cheer) => cheer.shown).slice(-6).reverse().map((cheer) => `
    <li class="cheer-note"><p>${escapeHTML(cheer.text)}</p><span>💌 ${escapeHTML(cheer.from)} · ${chartDate(cheer.shown)}</span></li>`).join("");
  area.innerHTML = `
    ${waiting ? `<p class="cheer-waiting">🎁 ${waiting === 1 ? "A surprise cheer is" : `${waiting} surprise cheers are`} waiting! Finish a workout to open ${waiting === 1 ? "it" : "one"}.</p>` : ""}
    <form class="cheer-form" id="cheer-form">
      <p class="game-help">👀 For grown-ups (and sisters): write a cheer while nobody's looking! It stays hidden, then pops up after the next workout.</p>
      <div class="form-row form-row--tight">
        <label class="visually-hidden" for="cheer-from">From</label>
        <input class="input cheer-from" id="cheer-from" type="text" maxlength="20" placeholder="From (like Mom)" autocomplete="off">
      </div>
      <label class="visually-hidden" for="cheer-text">Cheer message</label>
      <textarea class="input cheer-text" id="cheer-text" rows="2" maxlength="200" placeholder="You've got this, champ! So proud of you! 💪"></textarea>
      <button class="button" type="submit">🎁 Hide my cheer</button>
    </form>
    ${wall ? `<p class="field-label">💌 Cheer wall</p><ul class="cheer-wall">${wall}</ul>` : ""}`;
}

function showCheer(cheer) {
  let box = document.querySelector("#cheer-box");
  if (!box) {
    box = document.createElement("div");
    box.className = "modal cheer-box";
    box.id = "cheer-box";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-labelledby", "cheer-title");
    document.body.append(box);
    box.addEventListener("click", (event) => {
      if (event.target === box || event.target.closest("[data-cheer-close]")) {
        box.hidden = true;
        cheerShowing = false;
      }
    });
  }
  box.innerHTML = `
    <div class="modal__card cheer-card">
      <p class="cheer-card__icon" aria-hidden="true">💌</p>
      <h2 id="cheer-title">A cheer from ${escapeHTML(cheer.from)}!</h2>
      <p class="cheer-card__text">${escapeHTML(cheer.text)}</p>
      <button class="button" type="button" data-cheer-close>Thanks! ❤️</button>
    </div>`;
  box.hidden = false;
  startAudio();
  sounds.fanfare();
  box.querySelector("[data-cheer-close]").focus();
}

// After a workout, wait for the "Level up!" box (if there is one) to close, then show the cheer
function revealCheer() {
  const next = cheersWaiting().find((cheer) => doneDays.size > cheer.after);
  if (!next || cheerShowing) return;
  cheerShowing = true;
  cheers = cheers.map((cheer) => (cheer.id === next.id ? { ...cheer, shown: toKey(today) } : cheer));
  saveJSON("levelUp.cheers", cheers);
  drawCheers(); // it moves from "waiting" to the cheer wall
  let tries = 0;
  const wait = () => {
    const busy = !document.querySelector("#celebrate").hidden || !document.querySelector("#coach").hidden;
    if (busy && tries++ < 600) {
      setTimeout(wait, 500);
      return;
    }
    showCheer(next);
  };
  setTimeout(wait, 900);
}

const cheersArea = document.querySelector("#cheers-area");

cheersArea.addEventListener("submit", (event) => {
  if (event.target.id !== "cheer-form") return;
  event.preventDefault();
  const from = document.querySelector("#cheer-from").value.trim() || "Someone who loves you";
  const text = document.querySelector("#cheer-text").value.trim();
  if (!text) {
    document.querySelector("#cheer-text").focus();
    return;
  }
  cheers = [...cheers, { id: Date.now().toString(36), from, text, after: doneDays.size, shown: null }].slice(-40);
  saveJSON("levelUp.cheers", cheers);
  startAudio();
  sounds.done();
  showToast("🎁 Hidden! It'll pop up after the next workout.");
  drawCheers();
});


/* 3. PLUGGING IN (see hooks.js) ---------------------------------------------------- */

addPagePart("family", () => {
  const typing = (area) => area.contains(document.activeElement) && /INPUT|TEXTAREA/.test(document.activeElement.tagName);
  if (!typing(sportsArea)) drawSportsDay();
  if (!typing(cheersArea)) drawCheers();
});
addPagePart(null, revealCheer);

addSavedData("levelUp.sportsDay", () => {
  const saved = loadJSON("levelUp.sportsDay", null);
  sportsDay = saved && Array.isArray(saved.history) ? saved : { active: null, history: [] };
});
addSavedData("levelUp.cheers", () => {
  const saved = loadJSON("levelUp.cheers", []);
  cheers = Array.isArray(saved) ? saved.filter((cheer) => cheer && cheer.id && cheer.text) : [];
});

addXP("sportsDay", () => SPORTS_DAY_XP, 1);
addXPRule("Family Sports Day", `+${SPORTS_DAY_XP}`);

addBadge({ id: "sportsDay", icon: "🏅", name: "Sports Day Host", how: "Finish a Family Sports Day", earned: () => logOf("sportsDay").length >= 1 });
addBadge({ id: "familyChamp", icon: "🥇", name: "Family Champion", how: "Win gold at a Family Sports Day", earned: () => logOf("sportsDay").some((e) => e.won) });
addBadge({ id: "cheered", icon: "💌", name: "Cheered On", how: "Get 3 cheer messages from your family", earned: () => cheers.filter((cheer) => cheer.shown).length >= 3 });
