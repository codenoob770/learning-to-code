/* =============================================================
   stats-plus.js: more for the Stats tab
   -------------------------------------------------------------
   1. Badge Maker: invent your own badges for the trophy case
   2. Certificates: print one for a new belt, a swim stroke, a
      level and more
   3. Time Capsule: a note to future you that stays locked
   4. Plugging in (XP, badges, saved data: see hooks.js)

   This file loads before app.js, so it only uses app.js's
   functions inside its own functions, never right away.
   ============================================================= */


/* 1. BADGE MAKER -----------------------------------------------------------
   Pick an icon, a name and a goal. Your badge goes in the trophy case
   with all the others, and unlocks when you reach the goal!          */

const MY_BADGE_ICONS = ["🦁", "🐉", "🦈", "🚀", "⚡", "🌋", "💎", "🏆", "🎯", "🧨", "🦅", "🐺", "🌪️", "👑", "🛸", "🍕"];
const MY_BADGE_MAX = 12;

// Things a badge can count. value() gives back where you are now.
const MY_BADGE_GOALS = [
  { id: "workouts", text: (n) => `Finish ${n} workouts`, value: () => trophyStats().workouts, suggest: 50 },
  { id: "streak", text: (n) => `Get a ${n}-day streak`, value: () => trophyStats().bestStreak, suggest: 14 },
  { id: "level", text: (n) => `Reach level ${n}`, value: () => levelFor(trophyStats().xp), suggest: 15 },
  { id: "xp", text: (n) => `Earn ${n} XP`, value: () => trophyStats().xp, suggest: 5000 },
  { id: "pushups", text: (n) => `Do ${n} push-ups in a row (beat trainer)`, value: () => trophyStats().pushups || 0, suggest: 20 },
  { id: "quizzes", text: (n) => `Play ${n} quizzes`, value: () => logOf("quiz").length, suggest: 20 },
  { id: "games", text: (n) => `Play ${n} Arcade games`, value: () => ["shootout", "reflex", "boards", "memory", "duel", "deck", "kicks", "kihap", "beat", "course"].reduce((sum, type) => sum + logOf(type).length, 0), suggest: 30 },
  { id: "kihap", text: (n) => `Score ${n} on the Kihap Meter`, value: () => Math.max(0, ...logOf("kihap").map((e) => e.s)), suggest: 95 },
  { id: "goals", text: (n) => `Score ${n} soccer goals (Soccer Journal)`, value: () => logOf("soccer").reduce((sum, e) => sum + (e.g || 0), 0), suggest: 10 },
  { id: "read", text: (n) => `Read for ${n} minutes`, value: () => (typeof readTotal === "function" ? readTotal() : 0), suggest: 600 },
  { id: "chores", text: (n) => `Do ${n} chores`, value: () => (typeof choresDone === "function" ? choresDone() : 0), suggest: 50 },
  { id: "bingos", text: (n) => `Get ${n} bingos`, value: () => logOf("bingo").length, suggest: 10 },
  { id: "water", text: (n) => `Drink 8 glasses of water on ${n} days`, value: () => trophyStats().waterDays, suggest: 30 },
];

let myBadges = []; // [{ id, icon, name, goal, target }] (saved)
let badgeDraft = { icon: MY_BADGE_ICONS[0], goal: MY_BADGE_GOALS[0].id };

function myBadgeGoal(badge) {
  return MY_BADGE_GOALS.find((goal) => goal.id === badge.goal);
}

// Puts your badges in the trophy case (trophies.js reads BADGES)
function syncMyBadges() {
  for (let i = BADGES.length - 1; i >= 0; i--) {
    if (BADGES[i].mine) BADGES.splice(i, 1);
  }
  for (const badge of myBadges) {
    const goal = myBadgeGoal(badge);
    if (!goal) continue;
    BADGES.push({
      id: `my-${badge.id}`,
      icon: badge.icon,
      name: badge.name,
      how: `${goal.text(badge.target)} (you made this one!)`,
      earned: () => goal.value() >= badge.target,
      mine: true,
    });
  }
}

function drawBadgeMaker() {
  const area = document.querySelector("#maker-area");
  const goal = MY_BADGE_GOALS.find((item) => item.id === badgeDraft.goal);
  const list = myBadges.map((badge) => {
    const g = myBadgeGoal(badge);
    if (!g) return "";
    const now = Math.min(g.value(), badge.target);
    const done = now >= badge.target;
    return `<li class="my-badge ${done ? "is-earned" : ""}">
      <span class="my-badge__icon" aria-hidden="true">${badge.icon}</span>
      <span class="my-badge__text">
        <strong>${escapeHTML(badge.name)}</strong>
        <span>${g.text(badge.target)}</span>
        <span class="my-badge__bar" aria-hidden="true"><span style="width: ${Math.round((now / badge.target) * 100)}%"></span></span>
        <span class="my-badge__count">${done ? "✓ Unlocked!" : `${now} / ${badge.target}`}</span>
      </span>
      <button class="text-button" type="button" data-my-badge-delete="${badge.id}" aria-label="Delete the ${escapeHTML(badge.name)} badge">Delete</button>
    </li>`;
  }).join("");
  area.innerHTML = `
    <form class="maker-form" id="maker-form">
      <p class="field-label">1. Pick an icon</p>
      <div class="lab-chips maker-icons" role="group" aria-label="Badge icon">${MY_BADGE_ICONS.map((icon) => `
        <button class="lab-chip" type="button" data-maker-icon="${icon}" aria-pressed="${icon === badgeDraft.icon}" aria-label="${icon}">${icon}</button>`).join("")}
      </div>
      <div class="form-row">
        <div class="field">
          <label class="field-label" for="maker-name">2. Name it</label>
          <input class="input" id="maker-name" type="text" maxlength="24" placeholder="Like &quot;Push-up Dragon&quot;" autocomplete="off" value="${escapeHTML(badgeDraft.name || "")}">
        </div>
        <div class="field">
          <label class="field-label" for="maker-goal">3. The goal</label>
          <select class="select" id="maker-goal">${MY_BADGE_GOALS.map((item) => `<option value="${item.id}" ${item.id === badgeDraft.goal ? "selected" : ""}>${item.text("___")}</option>`).join("")}</select>
        </div>
        <div class="field">
          <label class="field-label" for="maker-target">How many?</label>
          <input class="input maker-target" id="maker-target" type="number" min="1" max="100000" inputmode="numeric" value="${badgeDraft.target || goal.suggest}">
        </div>
      </div>
      <p class="form-note">Right now you're at <strong>${goal.value()}</strong>. Pick a goal that's a little hard!</p>
      <div class="form-row form-row--tight">
        <button class="button" type="submit" ${myBadges.length >= MY_BADGE_MAX ? "disabled" : ""}>✨ Make my badge</button>
        <p class="form-note" id="maker-note" aria-live="polite">${myBadges.length >= MY_BADGE_MAX ? `That's the most (${MY_BADGE_MAX}). Delete one to make another.` : ""}</p>
      </div>
    </form>
    ${list ? `<p class="field-label">My badges</p><ul class="my-badges">${list}</ul>` : ""}`;
}

const makerArea = document.querySelector("#maker-area");

// Remember what you typed, so a redraw doesn't wipe it
makerArea.addEventListener("input", () => {
  badgeDraft = {
    ...badgeDraft,
    name: document.querySelector("#maker-name").value,
    target: Number(document.querySelector("#maker-target").value) || undefined,
  };
});

makerArea.addEventListener("change", (event) => {
  if (event.target.id !== "maker-goal") return;
  badgeDraft = { ...badgeDraft, goal: event.target.value, target: undefined };
  drawBadgeMaker();
  document.querySelector("#maker-goal").focus();
});

makerArea.addEventListener("click", (event) => {
  const icon = event.target.closest("[data-maker-icon]");
  if (icon) {
    badgeDraft = { ...badgeDraft, icon: icon.dataset.makerIcon };
    drawBadgeMaker();
    document.querySelector(`[data-maker-icon="${badgeDraft.icon}"]`)?.focus();
    return;
  }
  const remove = event.target.closest("[data-my-badge-delete]");
  if (remove) {
    myBadges = myBadges.filter((badge) => badge.id !== remove.dataset.myBadgeDelete);
    saveJSON("levelUp.myBadges", myBadges);
    syncMyBadges();
    render();
  }
});

makerArea.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = document.querySelector("#maker-name").value.trim();
  const target = Math.round(Number(document.querySelector("#maker-target").value));
  const note = document.querySelector("#maker-note");
  if (!name) {
    note.textContent = "Give your badge a name first!";
    document.querySelector("#maker-name").focus();
    return;
  }
  if (!(target >= 1 && target <= 100000)) {
    note.textContent = "Pick a number from 1 to 100,000.";
    document.querySelector("#maker-target").focus();
    return;
  }
  if (myBadges.length >= MY_BADGE_MAX) return;
  myBadges = [...myBadges, { id: Date.now().toString(36), icon: badgeDraft.icon, name, goal: badgeDraft.goal, target }];
  saveJSON("levelUp.myBadges", myBadges);
  syncMyBadges();
  badgeDraft = { icon: badgeDraft.icon, goal: badgeDraft.goal };
  startAudio();
  sounds.done();
  showToast(`✨ Your "${name}" badge is in the trophy case!`);
  render();
  checkAchievements(true); // you might have already earned it!
});


/* 2. CERTIFICATES -------------------------------------------------------------
   Everything you've earned a certificate for. Tap one to see it, then
   print it for the fridge! (Printing only shows the certificate: see
   the @media print part of style.css.)                                */

let certName = ""; // the name to put on certificates (saved)

function certificateList() {
  const list = [];
  const level = levelFor(trophyStats().xp);
  for (const step of beltData.history || []) {
    if (!BELTS[step.belt]) continue;
    list.push({ id: `belt-${step.belt}`, icon: "🥋", kind: "Belt Promotion", title: beltName(step.belt), line: `for earning the rank of ${beltName(step.belt)} in taekwondo`, date: step.d, color: BELTS[step.belt].colors[0] });
  }
  for (const group of SWIM_SKILLS) {
    if (group.skills.every((skill) => swimSkillsLearned().includes(skill.id))) {
      list.push({ id: `swim-${group.stroke}`, icon: group.icon, kind: "Swim School", title: group.stroke, line: `for learning every ${group.stroke.toLowerCase()} skill at swim school`, date: null, color: "#4fd1ff" });
    }
  }
  for (const milestone of [5, 10, 15, 20, 25, 30, 40, 50]) {
    if (level >= milestone) list.push({ id: `level-${milestone}`, icon: "⭐", kind: "Level Up", title: `Level ${milestone}`, line: `for reaching level ${milestone} (${rankFor(milestone)}) on Level Up`, date: null, color: "#ffe24d" });
  }
  const streak = trophyStats().bestStreak;
  for (const days of [7, 30, 100]) {
    if (streak >= days) list.push({ id: `streak-${days}`, icon: "🔥", kind: "Streak", title: `${days} Days in a Row`, line: `for working out ${days} days in a row`, date: null, color: "#ff7a5c" });
  }
  for (const book of (typeof books !== "undefined" ? books : []).filter((item) => item.done)) {
    list.push({ id: `book-${book.id}`, icon: "📚", kind: "Reading", title: book.title, line: `for reading the whole book "${book.title}"`, date: book.done, color: "#a3b4ff" });
  }
  for (const entry of logOf("bingoAll")) {
    list.push({ id: `bingo-${entry.w}`, icon: "🌟", kind: "Fitness Bingo", title: "Blackout!", line: "for filling a whole Fitness Bingo card", date: entry.d, color: "#ffe24d" });
  }
  return list;
}

function certificateHTML(cert) {
  const name = certName.trim() || "________________";
  const date = cert.date ? fromKey(cert.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "________________";
  return `
    <div class="certificate" style="--cert: ${cert.color}">
      <div class="certificate__inner">
        <p class="certificate__kind">${cert.icon} ${escapeHTML(cert.kind)} ${cert.icon}</p>
        <p class="certificate__top">Certificate of Achievement</p>
        <p class="certificate__small">This certifies that</p>
        <p class="certificate__name">${escapeHTML(name)}</p>
        <p class="certificate__small">${escapeHTML(cert.line)}</p>
        <p class="certificate__title">${escapeHTML(cert.title)}</p>
        <div class="certificate__sign">
          <p><span>${escapeHTML(date)}</span>Date</p>
          <p class="certificate__seal" aria-hidden="true">🏅</p>
          <p><span>&nbsp;</span>Coach or grown-up</p>
        </div>
        <p class="certificate__from">Level Up · Hard work pays off!</p>
      </div>
    </div>`;
}

function drawCertificates() {
  const area = document.querySelector("#cert-area");
  const list = certificateList();
  area.innerHTML = `
    <div class="form-row form-row--tight cert-name-row">
      <label class="field-label" for="cert-name">Name on certificates</label>
      <input class="input" id="cert-name" type="text" maxlength="40" placeholder="Your name" autocomplete="off" value="${escapeHTML(certName)}">
    </div>
    ${list.length ? `<div class="cert-list">${list.map((cert) => `
      <button class="cert-chip" type="button" data-cert="${escapeHTML(cert.id)}" style="--cert: ${cert.color}">
        <span class="cert-chip__icon" aria-hidden="true">${cert.icon}</span>
        <span><strong>${escapeHTML(cert.title)}</strong><span>${escapeHTML(cert.kind)}</span></span>
      </button>`).join("")}</div>`
      : `<p class="empty-note">No certificates yet! You get one for a new belt, learning a whole swim stroke, reaching level 5, a 7-day streak, finishing a book and a Bingo blackout.</p>`}`;
}

function openCertificate(cert) {
  let box = document.querySelector("#cert-box");
  if (!box) {
    box = document.createElement("div");
    box.className = "modal cert-box";
    box.id = "cert-box";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", "Certificate");
    document.body.append(box);
    box.addEventListener("click", (event) => {
      if (event.target === box || event.target.closest("[data-cert-close]")) closeCertificate();
      if (event.target.closest("[data-cert-print]")) {
        document.body.classList.add("is-printing-cert");
        try {
          window.print();
        } catch (error) {
          showToast("This page can't print here. Take a screenshot instead!");
        }
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !box.hidden) closeCertificate();
    });
    window.addEventListener("afterprint", () => document.body.classList.remove("is-printing-cert"));
  }
  box.innerHTML = `
    <div class="cert-box__card">
      ${certificateHTML(cert)}
      <div class="cert-box__buttons">
        <button class="button" type="button" data-cert-print>🖨️ Print it</button>
        <button class="button button--quiet" type="button" data-cert-close>Close</button>
      </div>
      <p class="game-help">Can't print? Take a screenshot and show it off!</p>
    </div>`;
  box.hidden = false;
  box.querySelector("[data-cert-print]").focus();
}

function closeCertificate() {
  const box = document.querySelector("#cert-box");
  if (box) box.hidden = true;
  document.body.classList.remove("is-printing-cert");
}

const certArea = document.querySelector("#cert-area");

certArea.addEventListener("input", (event) => {
  if (event.target.id !== "cert-name") return;
  certName = event.target.value;
  save("levelUp.certName", certName);
});

certArea.addEventListener("click", (event) => {
  const chip = event.target.closest("[data-cert]");
  if (!chip) return;
  const cert = certificateList().find((item) => item.id === chip.dataset.cert);
  if (cert) {
    startAudio();
    sounds.up();
    openCertificate(cert);
  }
});


/* 3. TIME CAPSULE ------------------------------------------------------------------
   Write a note to future you and lock it up. It also saves a snapshot
   of your stats, so when it opens you can see how much you've grown!  */

const CAPSULE_LOCKS = [
  { months: 1, name: "1 month" },
  { months: 3, name: "3 months" },
  { months: 6, name: "6 months" },
  { months: 12, name: "1 year" },
];
const CAPSULE_MAX = 6;
const CAPSULE_XP = 50;

let capsules = []; // [{ id, written, opens, note, then: {...}, opened }] (saved)
let capsuleLock = 3;
let capsuleOpen = null; // the capsule you're reading
let capsuleTrash = null; // asked "throw it away?"

// The numbers saved in a capsule (and compared when it opens)
function capsuleSnapshot() {
  const stats = trophyStats();
  return {
    level: levelFor(stats.xp),
    workouts: stats.workouts,
    streak: stats.bestStreak,
    pushups: stats.pushups || 0,
    curlups: stats.curlups || 0,
    belt: beltData.belt,
    read: typeof readTotal === "function" ? readTotal() : 0,
    badges: BADGES.filter((badge) => badge.earned(stats)).length,
  };
}

const CAPSULE_ROWS = [
  ["level", "⭐", "Level", (v) => v],
  ["workouts", "🏋️", "Workouts", (v) => v],
  ["streak", "🔥", "Best streak", (v) => `${v} days`],
  ["pushups", "💪", "Most push-ups", (v) => v || "–"],
  ["curlups", "🛡️", "Most curl-ups", (v) => v || "–"],
  ["belt", "🥋", "Belt", (v) => (BELTS[v] ? BELTS[v].name : "–")],
  ["read", "📚", "Minutes read", (v) => v],
  ["badges", "🏅", "Badges", (v) => v],
];

function addMonths(date, months) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function longDate(key) {
  return fromKey(key).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function drawCapsules() {
  const area = document.querySelector("#capsule-area");
  const todayKey = toKey(today);
  const reading = capsules.find((capsule) => capsule.id === capsuleOpen);
  if (reading) {
    const now = capsuleSnapshot();
    const rows = CAPSULE_ROWS.map(([key, icon, name, show]) => {
      const before = reading.then[key] ?? 0;
      const after = now[key] ?? 0;
      const up = after > before;
      return `<tr><th scope="row">${icon} ${name}</th><td>${show(before)}</td><td class="${up ? "is-up" : ""}">${show(after)}${up ? " ⬆️" : ""}</td></tr>`;
    }).join("");
    area.innerHTML = `
      <div class="capsule-letter">
        <p class="eyebrow">// written ${longDate(reading.written)}</p>
        <p class="capsule-letter__note">${escapeHTML(reading.note).replace(/\n/g, "<br>")}</p>
      </div>
      <p class="field-label">Then vs. now</p>
      <table class="capsule-table">
        <thead><tr><th scope="col"></th><th scope="col">Then</th><th scope="col">Now</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <button class="button button--quiet" type="button" data-capsule="back">← All my capsules</button>`;
    return;
  }
  const list = capsules.map((capsule) => {
    const ready = capsule.opens <= todayKey;
    const days = daysBetween(today, fromKey(capsule.opens));
    let button;
    if (capsuleTrash === capsule.id) {
      button = `<span class="capsule__ask">Throw it away? <button class="text-button" type="button" data-capsule-trash-yes="${capsule.id}">Yes</button> <button class="text-button" type="button" data-capsule="keep">No</button></span>`;
    } else if (ready) {
      button = `<button class="button" type="button" data-capsule-open="${capsule.id}">${capsule.opened ? "📖 Read it again" : "📬 Open it!"}</button>`;
    } else {
      button = `<button class="text-button" type="button" data-capsule-trash="${capsule.id}">Throw away</button>`;
    }
    return `<li class="capsule ${ready ? "is-ready" : ""}">
      <span class="capsule__icon" aria-hidden="true">${ready ? (capsule.opened ? "📖" : "📬") : "🔒"}</span>
      <span class="capsule__text">
        <strong>${ready ? (capsule.opened ? "Opened" : "Ready to open!") : `Opens ${longDate(capsule.opens)}`}</strong>
        <span>${ready ? `Written ${longDate(capsule.written)}` : `in ${plural(days, "day")} · written ${longDate(capsule.written)}`}</span>
      </span>
      ${button}
    </li>`;
  }).join("");
  area.innerHTML = `
    ${list ? `<ul class="capsules">${list}</ul>` : ""}
    ${capsules.filter((capsule) => capsule.opens > todayKey).length < CAPSULE_MAX ? `
      <form class="capsule-form" id="capsule-form">
        <label class="field-label" for="capsule-note">Dear future me...</label>
        <textarea class="input capsule-note" id="capsule-note" maxlength="600" rows="4" placeholder="What do you want to tell future you? What are you working on? What do you hope you can do by then?"></textarea>
        <p class="field-label">Keep it locked for</p>
        <div class="lab-chips" role="group" aria-label="How long">${CAPSULE_LOCKS.map((lock) => `<button class="lab-chip" type="button" data-capsule-lock="${lock.months}" aria-pressed="${lock.months === capsuleLock}">${lock.name}</button>`).join("")}</div>
        <div class="form-row form-row--tight">
          <button class="button" type="submit">🔒 Lock it up!</button>
          <p class="form-note" id="capsule-msg" aria-live="polite">It saves your stats too, so you can see how much you grew.</p>
        </div>
      </form>` : `<p class="empty-note">That's a lot of capsules! Wait for one to open before writing another.</p>`}`;
}

const capsuleArea = document.querySelector("#capsule-area");

capsuleArea.addEventListener("click", (event) => {
  const lock = event.target.closest("[data-capsule-lock]");
  if (lock) {
    capsuleLock = Number(lock.dataset.capsuleLock);
    const note = document.querySelector("#capsule-note").value;
    drawCapsules();
    document.querySelector("#capsule-note").value = note;
    document.querySelector(`[data-capsule-lock="${capsuleLock}"]`).focus();
    return;
  }
  const open = event.target.closest("[data-capsule-open]");
  if (open) {
    const capsule = capsules.find((item) => item.id === open.dataset.capsuleOpen);
    capsuleOpen = capsule.id;
    if (!capsule.opened) {
      capsules = capsules.map((item) => (item.id === capsule.id ? { ...item, opened: toKey(today) } : item));
      saveJSON("levelUp.capsules", capsules);
      logActivity("capsule", { c: capsule.id });
      startAudio();
      sounds.fanfare();
      confetti();
      render();
      checkAchievements(true);
    }
    drawCapsules();
    capsuleArea.scrollIntoView({ block: "nearest" });
    return;
  }
  const trash = event.target.closest("[data-capsule-trash]");
  if (trash) {
    capsuleTrash = trash.dataset.capsuleTrash;
    drawCapsules();
    return;
  }
  const yes = event.target.closest("[data-capsule-trash-yes]");
  if (yes) {
    capsules = capsules.filter((item) => item.id !== yes.dataset.capsuleTrashYes);
    saveJSON("levelUp.capsules", capsules);
    capsuleTrash = null;
    drawCapsules();
    return;
  }
  const action = event.target.closest("[data-capsule]");
  if (action) {
    capsuleOpen = null;
    capsuleTrash = null;
    drawCapsules();
  }
});

capsuleArea.addEventListener("submit", (event) => {
  if (event.target.id !== "capsule-form") return;
  event.preventDefault();
  const note = document.querySelector("#capsule-note").value.trim();
  if (note.length < 3) {
    document.querySelector("#capsule-msg").textContent = "Write a little something first!";
    document.querySelector("#capsule-note").focus();
    return;
  }
  const opens = toKey(addMonths(today, capsuleLock));
  capsules = [...capsules, { id: Date.now().toString(36), written: toKey(today), opens, note, then: capsuleSnapshot(), opened: null }];
  saveJSON("levelUp.capsules", capsules);
  startAudio();
  sounds.done();
  showToast(`🔒 Locked! It opens on ${longDate(opens)}. No peeking!`);
  drawCapsules();
});


/* 4. PLUGGING IN (see hooks.js) ------------------------------------------------- */

addPagePart("stats", () => {
  // Don't redraw a form while you're typing in it
  const typing = (area) => area.contains(document.activeElement) && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
  if (!typing(makerArea)) drawBadgeMaker();
  if (!typing(certArea)) drawCertificates();
  if (!typing(capsuleArea)) drawCapsules();
});

addSavedData("levelUp.myBadges", () => {
  const saved = loadJSON("levelUp.myBadges", []);
  myBadges = Array.isArray(saved) ? saved.filter((badge) => badge && badge.id && badge.name && badge.target > 0) : [];
  syncMyBadges();
});
addSavedData("levelUp.certName", () => {
  certName = load("levelUp.certName", "");
});
addSavedData("levelUp.capsules", () => {
  const saved = loadJSON("levelUp.capsules", []);
  capsules = Array.isArray(saved) ? saved.filter((capsule) => capsule && capsule.id && capsule.opens && capsule.then) : [];
});

addXP("capsule", () => CAPSULE_XP);
addXPRule("Open a Time Capsule", `+${CAPSULE_XP}`);

addBadge({ id: "badgeDesigner", icon: "✏️", name: "Badge Designer", how: "Make your own badge in the Badge Maker", earned: () => myBadges.length >= 1 });
addBadge({ id: "fromThePast", icon: "📬", name: "Message From the Past", how: "Open a Time Capsule", earned: () => logOf("capsule").length >= 1 });
