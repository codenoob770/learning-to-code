/* =============================================================
   tools.js: the Tools tab
   -------------------------------------------------------------
   1. My Calendar: practices, games, belt tests and school tests
   2. Today's plan (a little box at the top of the Today tab)
   3. Packing Checklist
   4. Bedtime Routine
   5. Weekly Report Card
   6. Backup and restore
   7. Add Level Up to your home screen
   8. Plugging in (XP, badges, saved data: see hooks.js)

   This file loads before app.js, so it only uses app.js's
   functions inside its own functions, never right away.
   ============================================================= */


/* 1. MY CALENDAR ----------------------------------------------------------
   Events you add, plus your gym test and belt test dates (from the
   Today and Sports tabs). "weekly" events repeat on the same day
   every week, like taekwondo class every Tuesday.                  */

const CAL_TYPES = [
  { id: "tkd", icon: "🥋", name: "Taekwondo class", pack: "tkd", warmUp: "tkd" },
  { id: "belt", icon: "🎖️", name: "Belt test", pack: "tkd", warmUp: "test" },
  { id: "practice", icon: "⚽", name: "Soccer practice", pack: "soccer", warmUp: "soccer" },
  { id: "game", icon: "🏆", name: "Soccer game", pack: "soccer", warmUp: "soccer" },
  { id: "swim", icon: "🏊", name: "Swim lesson", pack: "swim", warmUp: "swim" },
  { id: "school", icon: "📝", name: "School test", pack: "school" },
  { id: "other", icon: "📌", name: "Something else" },
];
const CAL_MAX = 200;

let calendarData = []; // { id, date, time, type, title, weekly } (saved)
let calMonth = null;   // the month you're looking at: a Date on its 1st
let calPick = null;    // the day you tapped, like "2026-12-03"

function calType(id) {
  return CAL_TYPES.find((type) => type.id === id) || CAL_TYPES[CAL_TYPES.length - 1];
}

// "17:30" -> "5:30 PM"
function timeText(time) {
  if (!time) return "";
  const [hours, minutes] = time.split(":").map(Number);
  return `${((hours + 11) % 12) + 1}:${String(minutes).padStart(2, "0")} ${hours < 12 ? "AM" : "PM"}`;
}

// Everything happening on one day, sorted by time
function eventsOn(key) {
  const weekday = dayIndex(fromKey(key));
  const list = calendarData.filter((event) => event.date === key || (event.weekly && event.date <= key && dayIndex(fromKey(event.date)) === weekday));
  if (testDate && toKey(testDate) === key) list.push({ id: "gymTest", type: "school", title: "Gym test (push-ups and curl-ups)", fixed: true, icon: "🏅" });
  if (beltData.test === key) list.push({ id: "beltTest", type: "belt", title: "Belt test", fixed: true });
  return list.sort((a, b) => (a.time || "99").localeCompare(b.time || "99"));
}

function eventTitle(event) {
  return event.title || calType(event.type).name;
}

function eventIcon(event) {
  return event.icon || calType(event.type).icon;
}

function drawCalendar() {
  const area = document.querySelector("#calendar-area");
  if (area.contains(document.activeElement) && document.activeElement.matches("input, select")) return; // you're typing
  if (!calMonth) calMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  if (!calPick) calPick = toKey(today);

  const first = calMonth;
  const start = addDays(first, -dayIndex(first)); // the Monday on or before the 1st
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const weeks = Math.ceil((dayIndex(first) + daysInMonth) / 7); // 4, 5 or 6 rows
  const cells = [];
  for (let i = 0; i < weeks * 7; i++) {
    const date = addDays(start, i);
    const key = toKey(date);
    const events = eventsOn(key);
    const classes = [
      date.getMonth() !== first.getMonth() ? "is-other" : "",
      key === toKey(today) ? "is-today" : "",
      key === calPick ? "is-picked" : "",
    ].join(" ");
    cells.push(`
      <button class="cal-day ${classes}" type="button" data-cal-day="${key}" aria-pressed="${key === calPick}"
        aria-label="${date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}${events.length ? `: ${events.map(eventTitle).join(", ")}` : ""}">
        <span class="cal-day__num">${date.getDate()}</span>
        <span class="cal-day__icons" aria-hidden="true">${events.slice(0, 3).map(eventIcon).join("")}${events.length > 3 ? "+" : ""}</span>
      </button>`);
  }

  const picked = fromKey(calPick);
  const dayEvents = eventsOn(calPick);
  const upcoming = [];
  for (let i = 0; i < 7; i++) {
    const key = toKey(addDays(today, i));
    eventsOn(key).forEach((event) => upcoming.push({ key, event }));
  }

  area.innerHTML = `
    <div class="cal">
      <div class="cal-head">
        <button class="icon-button" type="button" data-cal-month="-1" aria-label="Last month">‹</button>
        <p class="cal-head__month">${first.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
        <button class="icon-button" type="button" data-cal-month="1" aria-label="Next month">›</button>
        <button class="text-button" type="button" data-cal-today>Today</button>
      </div>
      <div class="cal-grid" role="group" aria-label="Days">
        ${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((name) => `<span class="cal-weekday" aria-hidden="true">${name}</span>`).join("")}
        ${cells.join("")}
      </div>
    </div>
    <div class="cal-side">
      <h3 class="cal-side__title">${picked.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</h3>
      ${dayEvents.length ? `<ul class="cal-events">${dayEvents.map((event) => `
        <li class="cal-event">
          <span class="cal-event__icon" aria-hidden="true">${eventIcon(event)}</span>
          <span class="cal-event__text"><strong>${escapeHTML(eventTitle(event))}</strong>${event.time ? ` · ${timeText(event.time)}` : ""}${event.weekly ? ` <span class="cal-tag">every ${fromKey(event.date).toLocaleDateString("en-US", { weekday: "long" })}</span>` : ""}${event.fixed ? ` <span class="cal-tag">from ${event.id === "gymTest" ? "Today" : "Sports"}</span>` : ""}</span>
          ${event.fixed ? "" : `<button class="text-button" type="button" data-cal-delete="${event.id}" aria-label="Delete ${escapeHTML(eventTitle(event))}">✕</button>`}
        </li>`).join("")}</ul>` : `<p class="empty-note">Nothing yet. Add something below!</p>`}
      <form class="form cal-form" id="cal-form" novalidate>
        <div class="form-row">
          <div class="field">
            <label class="field-label" for="cal-type">What</label>
            <select class="select" id="cal-type">${CAL_TYPES.map((type) => `<option value="${type.id}">${type.icon} ${type.name}</option>`).join("")}</select>
          </div>
          <div class="field cal-form__time">
            <label class="field-label" for="cal-time">Time (optional)</label>
            <input class="input" id="cal-time" type="time">
          </div>
        </div>
        <div class="field">
          <label class="field-label" for="cal-title">Name (optional)</label>
          <input class="input" id="cal-title" type="text" maxlength="40" placeholder="Like &quot;Math test&quot; or &quot;Game vs. Tigers&quot;" autocomplete="off">
        </div>
        <label class="check-row"><input type="checkbox" id="cal-weekly"> Every ${picked.toLocaleDateString("en-US", { weekday: "long" })}</label>
        <button class="button" type="submit">Add to ${picked.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</button>
      </form>
      <h3 class="cal-side__title">Next 7 days</h3>
      ${upcoming.length ? `<ul class="cal-upcoming">${upcoming.map(({ key, event }) => `
        <li><span class="cal-upcoming__day">${key === toKey(today) ? "Today" : fromKey(key).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span> ${eventIcon(event)} ${escapeHTML(eventTitle(event))}${event.time ? ` · ${timeText(event.time)}` : ""}</li>`).join("")}</ul>` : `<p class="empty-note">Nothing coming up this week.</p>`}
    </div>`;
}

document.querySelector("#calendar-area").addEventListener("click", (event) => {
  const day = event.target.closest("[data-cal-day]");
  if (day) {
    calPick = day.dataset.calDay;
    const date = fromKey(calPick);
    if (date.getMonth() !== calMonth.getMonth()) calMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    drawCalendar();
    document.querySelector(`[data-cal-day="${calPick}"]`)?.focus();
    return;
  }
  const month = event.target.closest("[data-cal-month]");
  if (month) {
    calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + Number(month.dataset.calMonth), 1);
    drawCalendar();
    document.querySelector(`[data-cal-month="${month.dataset.calMonth}"]`).focus();
    return;
  }
  if (event.target.closest("[data-cal-today]")) {
    calMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    calPick = toKey(today);
    drawCalendar();
    return;
  }
  const remove = event.target.closest("[data-cal-delete]");
  if (remove) {
    const item = calendarData.find((thing) => thing.id === remove.dataset.calDelete);
    if (!item) return;
    const message = item.weekly ? `Delete "${eventTitle(item)}" from every week?` : `Delete "${eventTitle(item)}"?`;
    if (!confirm(message)) return;
    calendarData = calendarData.filter((thing) => thing !== item);
    saveJSON("levelUp.calendar", calendarData);
    render();
  }
});

document.querySelector("#calendar-area").addEventListener("submit", (event) => {
  if (event.target.id !== "cal-form") return;
  event.preventDefault();
  if (calendarData.length >= CAL_MAX) {
    showToast("Your calendar is full! Delete some old things first.");
    return;
  }
  const type = document.querySelector("#cal-type").value;
  calendarData.push({
    id: makeId(),
    date: calPick,
    time: document.querySelector("#cal-time").value || "",
    type: CAL_TYPES.some((item) => item.id === type) ? type : "other",
    title: document.querySelector("#cal-title").value.trim().slice(0, 40),
    weekly: document.querySelector("#cal-weekly").checked,
  });
  saveJSON("levelUp.calendar", calendarData);
  document.activeElement.blur();
  sounds.done();
  showToast(`${calType(type).icon} Added to your calendar!`);
  render();
  checkAchievements(true);
});


/* 2. TODAY'S PLAN (on the Today tab) -----------------------------------------
   What's on the calendar today and tomorrow, with handy buttons.   */

function drawTodayAgenda() {
  const box = document.querySelector("#today-agenda");
  const todayKey = toKey(today);
  const todays = eventsOn(todayKey);
  const tomorrows = eventsOn(toKey(addDays(today, 1)));
  const isSunday = dayIndex(today) === 6;
  if (!todays.length && !tomorrows.length && !isSunday) {
    box.hidden = true;
    return;
  }
  const warmUp = todays.map((event) => calType(event.type).warmUp).find(Boolean);
  const pack = [...todays, ...tomorrows].map((event) => calType(event.type).pack).find(Boolean);
  const line = (events) => events.map((event) => `${eventIcon(event)} ${escapeHTML(eventTitle(event))}${event.time ? ` (${timeText(event.time)})` : ""}`).join(" · ");
  box.hidden = false;
  box.innerHTML = `
    ${todays.length ? `<p><strong>📅 Today:</strong> ${line(todays)}</p>` : ""}
    ${tomorrows.length ? `<p><strong>Tomorrow:</strong> ${line(tomorrows)}</p>` : ""}
    ${isSunday ? `<p>📬 <strong>Your weekly report card is ready!</strong></p>` : ""}
    <div class="today-agenda__buttons">
      ${warmUp ? `<button class="button button--quiet" type="button" data-agenda-warmup="${warmUp}">🏟️ Game Day Warm-Up</button>` : ""}
      ${pack ? `<button class="button button--quiet" type="button" data-agenda-pack="${pack}">🎒 Packing list</button>` : ""}
      ${isSunday ? `<button class="button button--quiet" type="button" data-agenda-report>📬 See my report card</button>` : ""}
    </div>`;
}

document.querySelector("#today-agenda").addEventListener("click", (event) => {
  const warmUp = event.target.closest("[data-agenda-warmup]");
  const pack = event.target.closest("[data-agenda-pack]");
  if (warmUp) {
    gameDayPick = warmUp.dataset.agendaWarmup; // training-plus.js
    showTab("training");
    document.querySelector("#gameday-panel").scrollIntoView({ block: "start" });
  }
  if (pack) {
    packList = pack.dataset.agendaPack;
    showTab("tools");
    document.querySelector("#pack-panel").scrollIntoView({ block: "start" });
  }
  if (event.target.closest("[data-agenda-report]")) {
    reportWeek = 0;
    showTab("tools");
    document.querySelector("#report-panel").scrollIntoView({ block: "start" });
  }
});


/* 3. PACKING CHECKLIST ---------------------------------------------------------
   Check things off as they go in your bag. The checks start fresh
   every day. Add your own things to any list.                      */

const PACK_LISTS = [
  { id: "soccer", icon: "⚽", name: "Soccer", items: ["Cleats", "Shin guards", "Soccer socks", "Jersey or practice shirt", "Water bottle", "Soccer ball", "A healthy snack"] },
  { id: "tkd", icon: "🥋", name: "Taekwondo", items: ["Dobok (uniform)", "Belt", "Water bottle", "Sparring gear (if it's a sparring day)", "Mouthguard", "Small towel"] },
  { id: "swim", icon: "🏊", name: "Swim", items: ["Swimsuit", "Goggles", "Swim cap", "Towel", "Flip-flops", "Dry clothes", "Bag for wet stuff", "Water bottle"] },
  { id: "school", icon: "🎒", name: "School", items: ["Homework", "Books and folders", "Pencil case", "Lunch or lunch money", "Water bottle", "PE clothes (on PE days)", "Jacket"] },
];

let packList = "soccer";
let packData = { day: "", checked: {}, custom: {} }; // saved

function packItems(listId) {
  const list = PACK_LISTS.find((item) => item.id === listId);
  return [...list.items, ...((packData.custom || {})[listId] || [])];
}

// Checks are only for today
function packChecked(listId) {
  if (packData.day !== toKey(today)) return [];
  return (packData.checked || {})[listId] || [];
}

function savePacking() {
  saveJSON("levelUp.packing", packData);
}

// "force" redraws even while you're typing (like right after you add something)
function drawPacking(force = false) {
  const area = document.querySelector("#pack-area");
  if (!force && area.contains(document.activeElement) && document.activeElement.matches("input[type='text']")) return;
  const items = packItems(packList);
  const checked = packChecked(packList);
  const custom = (packData.custom || {})[packList] || [];
  const done = items.filter((item) => checked.includes(item)).length;
  const lists = PACK_LISTS.map((list) => `
    <button class="lab-chip" type="button" data-pack-list="${list.id}" aria-pressed="${list.id === packList}">${list.icon} ${list.name}</button>`).join("");

  area.innerHTML = `
    <div class="lab-chips" role="group" aria-label="Which bag?">${lists}</div>
    <p class="pack-count">${done === items.length && items.length ? "🎉 All packed! You're ready to go!" : `${done} of ${items.length} packed`}</p>
    <div class="xpbar" aria-hidden="true"><div class="xpbar__fill" style="width: ${items.length ? (done / items.length) * 100 : 0}%"></div></div>
    <ul class="pack-list">${items.map((item, i) => `
      <li class="pack-item ${checked.includes(item) ? "is-packed" : ""}">
        <label class="check-row"><input type="checkbox" data-pack-item="${i}" ${checked.includes(item) ? "checked" : ""}> ${escapeHTML(item)}</label>
        ${custom.includes(item) ? `<button class="text-button" type="button" data-pack-remove="${i}" aria-label="Remove ${escapeHTML(item)}">✕</button>` : ""}
      </li>`).join("")}
    </ul>
    <form class="inline-form pack-add" id="pack-add">
      <label class="visually-hidden" for="pack-new">Add something to this list</label>
      <input class="input" id="pack-new" type="text" maxlength="40" placeholder="Add something, like &quot;Hair tie&quot;" autocomplete="off">
      <button class="button button--quiet" type="submit">Add</button>
    </form>
    <button class="text-button" type="button" data-pack-reset>Uncheck everything</button>`;
}

document.querySelector("#pack-area").addEventListener("change", (event) => {
  const box = event.target.closest("[data-pack-item]");
  if (!box) return;
  const item = packItems(packList)[Number(box.dataset.packItem)];
  if (packData.day !== toKey(today)) packData = { ...packData, day: toKey(today), checked: {} };
  const checked = new Set(packChecked(packList));
  if (box.checked) checked.add(item);
  else checked.delete(item);
  packData.checked = { ...packData.checked, [packList]: [...checked] };
  savePacking();
  const all = packItems(packList).every((thing) => checked.has(thing));
  if (all) {
    const already = logOf("packed").some((entry) => entry.d === toKey(today) && entry.l === packList);
    if (!already) logActivity("packed", { l: packList });
    sounds.fanfare();
  } else if (box.checked) {
    sounds.count();
  }
  render();
  checkAchievements(true);
  document.querySelector(`[data-pack-item="${box.dataset.packItem}"]`)?.focus();
});

document.querySelector("#pack-area").addEventListener("click", (event) => {
  const list = event.target.closest("[data-pack-list]");
  if (list) {
    packList = list.dataset.packList;
    drawPacking();
    document.querySelector(`[data-pack-list="${packList}"]`).focus();
    return;
  }
  const remove = event.target.closest("[data-pack-remove]");
  if (remove) {
    const item = packItems(packList)[Number(remove.dataset.packRemove)];
    packData.custom = { ...packData.custom, [packList]: ((packData.custom || {})[packList] || []).filter((thing) => thing !== item) };
    savePacking();
    drawPacking();
    return;
  }
  if (event.target.closest("[data-pack-reset]")) {
    packData.checked = { ...(packData.checked || {}), [packList]: [] };
    savePacking();
    drawPacking();
  }
});

document.querySelector("#pack-area").addEventListener("submit", (event) => {
  if (event.target.id !== "pack-add") return;
  event.preventDefault();
  const input = document.querySelector("#pack-new");
  const item = input.value.trim().slice(0, 40);
  if (!item || packItems(packList).some((thing) => thing.toLowerCase() === item.toLowerCase())) {
    input.value = "";
    return;
  }
  const mine = (packData.custom || {})[packList] || [];
  if (mine.length >= 15) {
    showToast("That's a lot of stuff! Remove something first.");
    return;
  }
  packData.custom = { ...(packData.custom || {}), [packList]: [...mine, item] };
  savePacking();
  drawPacking(true);
  document.querySelector("#pack-new").focus();
});


/* 4. BEDTIME ROUTINE ---------------------------------------------------------------
   Kids your age need 9 to 12 hours of sleep. Tell it when you wake
   up, and it works out when lights go out. Then wind down, step by
   step. The checks start fresh every night.                        */

const BEDTIME_STEPS = [
  "📵 Screens off (30 minutes before lights out)",
  "🎒 Pack your bag for tomorrow",
  "👕 Lay out tomorrow's clothes",
  "🚿 Wash up or shower",
  "🪥 Brush your teeth (2 whole minutes!)",
  "💧 A few sips of water",
  "🧘 1 minute of slow, deep breaths",
  "📖 Read a book for 15 minutes",
  "💡 Lights out. Sweet dreams!",
];

let bedtimeData = { wake: "07:00", day: "", checked: [] }; // saved

// The "night" a check belongs to: before 5 AM still counts as last night
function bedtimeNight() {
  const now = new Date();
  return toKey(now.getHours() < 5 ? addDays(today, -1) : today);
}

function lightsOut(hoursOfSleep) {
  const [hours, minutes] = (bedtimeData.wake || "07:00").split(":").map(Number);
  let total = hours * 60 + minutes - hoursOfSleep * 60;
  total = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function bedtimeCountdown() {
  const [hours, minutes] = lightsOut(10).split(":").map(Number);
  const now = new Date();
  const target = new Date(now);
  target.setHours(hours, minutes, 0, 0);
  let left = Math.round((target - now) / 60000);
  if (left < -6 * 60) left += 24 * 60; // after midnight, it's tonight's bedtime
  if (left > 18 * 60) left -= 24 * 60;
  if (left <= 0) return left > -180 ? "It's bedtime! 😴" : "";
  return `${Math.floor(left / 60) ? `${Math.floor(left / 60)} h ` : ""}${left % 60} min until lights out`;
}

function drawBedtime() {
  const area = document.querySelector("#bedtime-area");
  if (area.contains(document.activeElement) && document.activeElement.matches("input[type='time']")) return;
  const night = bedtimeNight();
  const checked = bedtimeData.day === night ? bedtimeData.checked || [] : [];
  const done = checked.length;
  const countdown = bedtimeCountdown();
  area.innerHTML = `
    <div class="bedtime-top">
      <div class="field bedtime-wake">
        <label class="field-label" for="bed-wake">I wake up at</label>
        <input class="input" id="bed-wake" type="time" value="${bedtimeData.wake || "07:00"}">
      </div>
      <div class="bedtime-times">
        <p>🌙 Lights out at <strong>${timeText(lightsOut(10))}</strong> for 10 hours of sleep (best!)</p>
        <p class="bedtime-latest">At the latest: ${timeText(lightsOut(9))} (9 hours)</p>
        ${countdown ? `<p class="bedtime-countdown">⏰ ${countdown}</p>` : ""}
      </div>
    </div>
    <p class="pack-count">${done === BEDTIME_STEPS.length ? "😴 All done! Sleep tight. Tomorrow, log your sleep on the Today tab!" : `${done} of ${BEDTIME_STEPS.length} done`}</p>
    <ul class="pack-list">${BEDTIME_STEPS.map((step, i) => `
      <li class="pack-item ${checked.includes(i) ? "is-packed" : ""}">
        <label class="check-row"><input type="checkbox" data-bed-step="${i}" ${checked.includes(i) ? "checked" : ""}> ${step}</label>
      </li>`).join("")}
    </ul>`;
}

document.querySelector("#bedtime-area").addEventListener("change", (event) => {
  if (event.target.id === "bed-wake") {
    if (/^\d{2}:\d{2}$/.test(event.target.value)) bedtimeData.wake = event.target.value;
    saveJSON("levelUp.bedtime", bedtimeData);
    event.target.blur();
    drawBedtime();
    return;
  }
  const box = event.target.closest("[data-bed-step]");
  if (!box) return;
  const night = bedtimeNight();
  if (bedtimeData.day !== night) bedtimeData = { ...bedtimeData, day: night, checked: [] };
  const step = Number(box.dataset.bedStep);
  bedtimeData.checked = box.checked ? [...new Set([...bedtimeData.checked, step])] : bedtimeData.checked.filter((item) => item !== step);
  saveJSON("levelUp.bedtime", bedtimeData);
  if (bedtimeData.checked.length === BEDTIME_STEPS.length) {
    if (!logOf("bedtime").some((entry) => entry.n === night)) logActivity("bedtime", { n: night });
    sounds.finish();
    showToast("😴 Bedtime routine done! Sleep tight!");
  } else if (box.checked) {
    sounds.count();
  }
  render();
  checkAchievements(true);
  document.querySelector(`[data-bed-step="${step}"]`)?.focus();
});


/* 5. WEEKLY REPORT CARD -------------------------------------------------------------
   Grades for your week (Monday to Sunday). The week you're in only
   counts the days so far, so you can check it any time.            */

let reportWeek = 0; // 0 = this week, -1 = last week...

function letterGrade(score) {
  if (score >= 0.95) return "A+";
  if (score >= 0.85) return "A";
  if (score >= 0.7) return "B";
  if (score >= 0.5) return "C";
  return "🌱";
}

function weekReport(weeksBack) {
  const monday = addDays(mondayOf(today), weeksBack * 7);
  const first = startedOn();
  const days = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(monday, i);
    if (date <= today && date >= first) days.push(toKey(date));
  }
  const start = toKey(monday);
  const end = toKey(addDays(monday, 6));
  const count = days.length;
  const fraction = (n) => (count ? Math.min(1, n / count) : 0);
  const brain = logBetween(["quiz", "bee", "math", "korean"], start, end);
  const brainGoal = Math.max(1, Math.round((5 * count) / 7));
  const extra = logBetween(["extra", "drill", "gameDay", "shootout", "reflex", "boards", "memory", "deck", "kicks", "duel", "focus"], start, end);

  const subjects = [
    { icon: "🏋️", name: "Workouts", score: fraction(days.filter((key) => doneDays.has(key)).length), detail: `${days.filter((key) => doneDays.has(key)).length} of ${count} days done`, good: "Crushed your workouts!", work: "Try to finish a few more workouts next week." },
    { icon: "💧", name: "Water", score: fraction(days.filter((key) => ((habits[key] || {}).water || 0) >= 6).length), detail: `${days.filter((key) => ((habits[key] || {}).water || 0) >= 6).length} days with 6+ glasses`, good: "Super hydrated!", work: "Keep a water bottle with you and log your glasses." },
    { icon: "😴", name: "Sleep", score: fraction(days.filter((key) => ((habits[key] || {}).sleep || 0) >= 9).length), detail: `${days.filter((key) => ((habits[key] || {}).sleep || 0) >= 9).length} nights with 9+ hours`, good: "Great sleeping! Your muscles thank you.", work: "Try the Bedtime Routine to get your 9+ hours." },
    { icon: "🧠", name: "Brain games", score: Math.min(1, brain / brainGoal), detail: `${plural(brain, "round")} of quiz, spelling, math or Korean`, good: "Your brain got a great workout too!", work: "Play a few more quiz or spelling rounds." },
  ];
  const average = subjects.reduce((sum, subject) => sum + subject.score, 0) / subjects.length;
  return { monday, count, subjects, average, extra };
}

function drawReport() {
  const area = document.querySelector("#report-area");
  const report = weekReport(reportWeek);
  const weeks = [[0, "This week"], [-1, "Last week"], [-2, "2 weeks ago"], [-3, "3 weeks ago"]].map(([value, name]) => `
    <button class="lab-chip" type="button" data-report-week="${value}" aria-pressed="${value === reportWeek}">${name}</button>`).join("");
  const end = addDays(report.monday, 6);
  const range = `${report.monday.toLocaleDateString("en-US", { month: "short", day: "numeric" })} to ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

  if (report.count === 0) {
    area.innerHTML = `<div class="lab-chips" role="group" aria-label="Which week?">${weeks}</div><p class="empty-note report-empty">No report card for that week. You hadn't started Level Up yet!</p>`;
    return;
  }
  const best = [...report.subjects].sort((a, b) => b.score - a.score)[0];
  const worst = [...report.subjects].sort((a, b) => a.score - b.score)[0];
  area.innerHTML = `
    <div class="lab-chips" role="group" aria-label="Which week?">${weeks}</div>
    <div class="report-card">
      <div class="report-card__head">
        <div>
          <p class="eyebrow">// report card · ${range}${reportWeek === 0 && report.count < 7 ? " (so far)" : ""}</p>
          <p class="report-card__name">Level Up Academy</p>
        </div>
        <p class="report-card__overall" aria-label="Overall grade ${letterGrade(report.average)}">${letterGrade(report.average)}</p>
      </div>
      <table class="report-table">
        <tbody>${report.subjects.map((subject) => `
          <tr>
            <th scope="row">${subject.icon} ${subject.name}</th>
            <td class="report-table__detail">${subject.detail}</td>
            <td class="report-grade grade-${letterGrade(subject.score).replace("+", "plus").replace("🌱", "grow")}">${letterGrade(subject.score)}</td>
          </tr>`).join("")}
          <tr>
            <th scope="row">⭐ Extra credit</th>
            <td class="report-table__detail">${plural(report.extra, "bonus activity", "bonus activities")} (extras, lessons, games...)</td>
            <td class="report-grade">${report.extra ? `+${report.extra}` : "–"}</td>
          </tr>
        </tbody>
      </table>
      <p class="report-card__note"><strong>Coach's note:</strong> ${best.score > 0 ? `${best.name}: ${best.good}` : "Every week is a fresh start!"} ${worst.score < 0.85 && worst !== best ? `${worst.name}: ${worst.work}` : "Keep it up!"}</p>
      <p class="quiz-total">🌱 means "room to grow." Grades are just for fun and to help you see what to work on!</p>
    </div>`;
}

document.querySelector("#report-area").addEventListener("click", (event) => {
  const week = event.target.closest("[data-report-week]");
  if (!week) return;
  reportWeek = Number(week.dataset.reportWeek);
  drawReport();
  document.querySelector(`[data-report-week="${reportWeek}"]`).focus();
});


/* 6. BACKUP AND RESTORE ------------------------------------------------------------------
   Saves all your progress into a file, just in case. Restoring puts
   it all back (and replaces what's here now).                       */

let backupDownloads = null;
if (window.claude && window.claude.use) {
  window.claude.use("downloads").then((downloads) => {
    backupDownloads = downloads;
  }).catch(() => {});
}

function backupText() {
  const data = {};
  for (const key of PROGRESS_KEYS) {
    const value = load(key, null);
    if (value !== null) data[key] = value;
  }
  return JSON.stringify({ app: "level-up", version: 1, saved: new Date().toISOString(), data }, null, 1);
}

function downloadBackup() {
  const filename = `level-up-backup-${toKey(today)}.json`;
  const text = backupText();
  const done = () => {
    save("levelUp.lastBackup", toKey(today)); // just on this device
    showToast("💾 Backup saved! Keep the file somewhere safe.");
    drawBackup();
  };
  if (window.claude && window.claude.use) {
    if (!backupDownloads) {
      showToast("Saving files isn't ready yet. Try again in a second!");
      return;
    }
    backupDownloads.save({ filename, data: new TextEncoder().encode(text) }).then(done).catch((error) => {
      if (error && error.code === "declined") return;
      showToast("Couldn't save the file here. Sorry!");
    });
    return;
  }
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  done();
}

function restoreBackup(file) {
  const note = document.querySelector("#backup-note");
  const reader = new FileReader();
  reader.onload = () => {
    let backup = null;
    try {
      backup = JSON.parse(reader.result);
    } catch (error) {
      backup = null;
    }
    if (!backup || backup.app !== "level-up" || !backup.data || typeof backup.data !== "object") {
      note.textContent = "That file isn't a Level Up backup. 🤔";
      return;
    }
    const keys = Object.keys(backup.data).filter((key) => PROGRESS_KEYS.includes(key) && typeof backup.data[key] === "string");
    const when = new Date(backup.saved).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    if (!confirm(`Put back your progress from ${when}?\n\nThis REPLACES the progress on this page right now.`)) return;
    keys.forEach((key) => save(key, backup.data[key]));
    loadProgress(); // in app.js: reads everything again
    render();
    note.textContent = `✅ Restored your backup from ${when}!`;
    sounds.fanfare();
  };
  reader.readAsText(file);
}

function drawBackup() {
  const last = load("levelUp.lastBackup", "");
  document.querySelector("#backup-last").textContent = last
    ? `Last backup from this device: ${fromKey(last).toLocaleDateString("en-US", { month: "long", day: "numeric" })}`
    : "You haven't made a backup on this device yet.";
  document.querySelector("#backup-cloud").hidden = !(window.claude && window.claude.use);
}

document.querySelector("#backup-save").addEventListener("click", downloadBackup);
document.querySelector("#backup-file").addEventListener("change", (event) => {
  const file = event.target.files && event.target.files[0];
  if (file) restoreBackup(file);
  event.target.value = "";
});


/* 7. ADD LEVEL UP TO YOUR HOME SCREEN ---------------------------------------------------
   On an iPad, Safari adds it from the Share button. Chrome can show
   its own "Install" button. Once it's on your home screen, it opens
   full screen like a real app, with its own icon!                  */

let installPrompt = null;
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  drawInstall();
});

function isInstalled() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function drawInstall() {
  const area = document.querySelector("#install-area");
  const apple = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  let steps = "";
  if (isInstalled()) {
    steps = `<p class="penalty-done">✅ You're using Level Up as an app! Nice.</p>`;
  } else if (window.claude && window.claude.use) {
    steps = `<p>To get the app icon, open Level Up on your <strong>github.io</strong> website in Safari, then come back to this box there.</p>`;
  } else if (installPrompt) {
    steps = `<button class="button" type="button" data-install>📲 Install Level Up</button>`;
  } else if (apple) {
    steps = `
      <ol class="install-steps">
        <li>Tap the <strong>Share</strong> button (a square with an arrow pointing up ⬆️) at the top of Safari.</li>
        <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
        <li>Tap <strong>Add</strong>. Done! Find the Level Up icon on your home screen.</li>
      </ol>`;
  } else {
    steps = `
      <ol class="install-steps">
        <li><strong>iPad or iPhone:</strong> open this page in Safari, tap <strong>Share ⬆️</strong>, then <strong>Add to Home Screen</strong>.</li>
        <li><strong>Android or Chrome:</strong> tap the <strong>⋮</strong> menu, then <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
      </ol>`;
  }
  area.innerHTML = `
    <div class="install">
      <img class="install__icon" src="icons/icon-192.png" alt="The Level Up app icon" width="96" height="96">
      <div class="install__steps">${steps}</div>
    </div>
    <p class="install-note">🔊 Heads up: on some iPads, the voice coach and the Spelling Bee can't talk in the Home Screen app. If you can't hear them there, open Level Up in Safari instead (or try the <button class="text-button" type="button" data-voice-check>Voice check</button>).</p>`;
}

document.querySelector("#install-area").addEventListener("click", (event) => {
  if (!event.target.closest("[data-install]") || !installPrompt) return;
  installPrompt.prompt();
  installPrompt.userChoice.finally(() => {
    installPrompt = null;
    drawInstall();
  });
});


/* 8. PLUGGING IN (see hooks.js) ---------------------------------------------------------- */

function drawTools() {
  drawCalendar();
  drawPacking();
  drawBedtime();
  drawReport();
  drawBackup();
  drawInstall();
}

addPagePart("tools", drawTools);
addPagePart("today", drawTodayAgenda);

addSavedData("levelUp.calendar", () => {
  const saved = loadJSON("levelUp.calendar", []);
  calendarData = Array.isArray(saved) ? saved.filter((event) => event && event.id && /^\d{4}-\d{2}-\d{2}$/.test(event.date)) : [];
});
addSavedData("levelUp.packing", () => {
  const saved = loadJSON("levelUp.packing", {});
  packData = { day: saved.day || "", checked: saved.checked || {}, custom: saved.custom || {} };
});
addSavedData("levelUp.bedtime", () => {
  const saved = loadJSON("levelUp.bedtime", {});
  bedtimeData = { wake: saved.wake || "07:00", day: saved.day || "", checked: Array.isArray(saved.checked) ? saved.checked : [] };
});

addXP("packed", () => 10, 2);
addXP("bedtime", () => 15, 1);

addXPRule("Pack your whole bag", "+10");
addXPRule("Finish your bedtime routine", "+15");

addBadge({ id: "planner", icon: "📅", name: "Planner", how: "Put 5 things on your calendar", earned: () => calendarData.length >= 5 });
addBadge({ id: "packer", icon: "🎒", name: "Never Forget", how: "Pack your whole bag 5 times", earned: () => logOf("packed").length >= 5 });
addBadge({ id: "sleepyhead", icon: "🌙", name: "Bedtime Boss", how: "Finish your bedtime routine 7 times", earned: () => logOf("bedtime").length >= 7 });
