/* =============================================================
   charts.js: progress charts
   -------------------------------------------------------------
   Charts, drawn as SVG (shapes the browser draws for us):
   1. Push-ups and curl-ups over time, from the beat trainer
      (and your real test scores, drawn as diamonds)
   2. How many days you finished each week
   3. A chart with one line, used by the swim log and energy check-in

   Hover or tap a chart to see the exact numbers. Each chart also
   has a "Show as a table" view.
   ============================================================= */

const CHART_HEIGHT = 220;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function chartDate(key) {
  const date = fromKey(key);
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

// Picks tidy whole-number steps for the left side, like 0, 5, 10, 15, 20,
// with room above the highest score
function niceScale(value) {
  for (const step of [2, 5, 10, 20, 25, 50, 100]) {
    const steps = Math.max(2, Math.ceil((value * 1.1) / step));
    if (steps <= 5) return { top: step * steps, step };
  }
  return { top: Math.ceil(value / 100) * 100, step: 100 };
}

function renderCharts() {
  renderRepsChart();
  renderWeeksChart();
}

// Redraw when the screen size changes (the charts fit their box)
let chartResizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(chartResizeTimer);
  chartResizeTimer = setTimeout(() => {
    if (typeof planStart !== "undefined") renderCharts();
  }, 150);
});


/* 1. PUSH-UPS AND CURL-UPS OVER TIME --------------------------------- */

// One point per day: your best beat-trainer score that day, or your
// real test score (a test score wins, and is marked as a test)
function repsPoints(exercise) {
  const byDate = new Map();
  for (const entry of trainerLog) {
    if (entry.exercise !== exercise) continue;
    const old = byDate.get(entry.date);
    if (!old || entry.count > old.value) byDate.set(entry.date, { date: entry.date, value: entry.count, test: false });
  }
  // Best scores saved before the log existed still count
  const best = bests[exercise];
  if (best && !byDate.has(best.date)) byDate.set(best.date, { date: best.date, value: best.count, test: false });
  for (const [date, scores] of Object.entries(testScores)) {
    if (scores && typeof scores[exercise] === "number") byDate.set(date, { date, value: scores[exercise], test: true });
  }
  return [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
}

const REPS_SERIES = [
  { id: "pushups", name: "Push-ups", className: "series-1" },
  { id: "curlups", name: "Curl-ups", className: "series-2" },
];

function renderRepsChart() {
  const box = document.querySelector("#chart-reps");
  const series = REPS_SERIES.map((s) => ({ ...s, points: repsPoints(s.id) }));
  const allPoints = series.flatMap((s) => s.points);

  if (allPoints.length === 0) {
    box.innerHTML = `<p class="chart-empty">No scores yet. Use the beat trainer to practice push-ups and curl-ups, and your chart will start here!</p>`;
    document.querySelector("#chart-reps-table").innerHTML = "";
    return;
  }

  const width = box.clientWidth || 600;
  const margin = { top: 14, right: 92, bottom: 28, left: 36 };
  const plotW = width - margin.left - margin.right;
  const plotH = CHART_HEIGHT - margin.top - margin.bottom;

  const dates = [...new Set(allPoints.map((p) => p.date))].sort();
  const first = fromKey(dates[0]);
  const span = Math.max(1, daysBetween(first, fromKey(dates[dates.length - 1])));
  const x = (key) => margin.left + (dates.length === 1 ? plotW / 2 : (daysBetween(first, fromKey(key)) / span) * plotW);
  const { top, step } = niceScale(Math.max(...allPoints.map((p) => p.value)));
  const y = (value) => margin.top + plotH - (value / top) * plotH;

  let svg = "";
  // Recessive grid lines and numbers on the left
  for (let value = 0; value <= top; value += step) {
    svg += `<line class="chart__grid" x1="${margin.left}" x2="${width - margin.right}" y1="${y(value)}" y2="${y(value)}"/>`;
    svg += `<text class="chart__tick" x="${margin.left - 8}" y="${y(value) + 4}" text-anchor="end">${value}</text>`;
  }
  // Dates along the bottom: first, last, and one in the middle if there's room
  const shown = dates.length <= 2 ? dates : [dates[0], dates[Math.floor(dates.length / 2)], dates[dates.length - 1]];
  for (const key of shown) {
    svg += `<text class="chart__tick" x="${x(key)}" y="${CHART_HEIGHT - 8}" text-anchor="middle">${chartDate(key)}</text>`;
  }

  // The lines, the dots, and a label at the end of each line
  const endLabels = [];
  for (const s of series) {
    if (s.points.length === 0) continue;
    if (s.points.length > 1) {
      svg += `<path class="chart__line ${s.className}" d="${s.points.map((p, i) => `${i ? "L" : "M"}${x(p.date).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ")}"/>`;
    }
    for (const p of s.points) {
      const cx = x(p.date).toFixed(1);
      const cy = y(p.value).toFixed(1);
      svg += p.test
        ? `<rect class="chart__dot chart__dot--test ${s.className}" x="${cx - 5}" y="${cy - 5}" width="10" height="10" transform="rotate(45 ${cx} ${cy})"/>`
        : `<circle class="chart__dot ${s.className}" cx="${cx}" cy="${cy}" r="4"/>`;
    }
    const last = s.points[s.points.length - 1];
    endLabels.push({ text: `${s.name} ${last.value}`, x: x(last.date) + 10, y: y(last.value) + 4 });
  }
  // Keep the two end labels from sitting on top of each other
  if (endLabels.length === 2 && Math.abs(endLabels[0].y - endLabels[1].y) < 14) {
    const [upper, lower] = endLabels[0].y < endLabels[1].y ? endLabels : [endLabels[1], endLabels[0]];
    const middle = (upper.y + lower.y) / 2;
    upper.y = middle - 7;
    lower.y = middle + 7;
  }
  for (const label of endLabels) {
    svg += `<text class="chart__label" x="${label.x}" y="${label.y}">${label.text}</text>`;
  }

  // The hover line (moved by the pointer code below)
  svg += `<line class="chart__crosshair" x1="0" x2="0" y1="${margin.top}" y2="${margin.top + plotH}" visibility="hidden"/>`;
  svg += `<rect class="chart__hit" x="${margin.left}" y="0" width="${plotW}" height="${CHART_HEIGHT}"/>`;

  box.innerHTML = `<svg class="chart" viewBox="0 0 ${width} ${CHART_HEIGHT}" width="${width}" height="${CHART_HEIGHT}" role="img" aria-label="Line chart of your push-up and curl-up scores over time">${svg}</svg><div class="chart__tooltip" hidden></div>`;

  // Hover: find the nearest day and show both scores
  const svgEl = box.querySelector("svg");
  const crosshair = svgEl.querySelector(".chart__crosshair");
  const tooltip = box.querySelector(".chart__tooltip");
  function showNearest(event) {
    const rect = svgEl.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * width;
    const nearest = dates.reduce((best, key) => (Math.abs(x(key) - px) < Math.abs(x(best) - px) ? key : best), dates[0]);
    crosshair.setAttribute("x1", x(nearest));
    crosshair.setAttribute("x2", x(nearest));
    crosshair.setAttribute("visibility", "visible");
    const lines = series.map((s) => {
      const point = s.points.find((p) => p.date === nearest);
      return point ? `<span><i class="swatch ${s.className}"></i>${s.name}: <strong>${point.value}</strong>${point.test ? " (gym test)" : ""}</span>` : "";
    }).join("");
    tooltip.innerHTML = `<b>${chartDate(nearest)}</b>${lines}`;
    tooltip.hidden = false;
    const left = (x(nearest) / width) * rect.width;
    tooltip.style.left = `${Math.min(Math.max(left, 70), rect.width - 70)}px`;
  }
  svgEl.addEventListener("pointermove", showNearest);
  svgEl.addEventListener("pointerdown", showNearest);
  svgEl.addEventListener("pointerleave", () => {
    crosshair.setAttribute("visibility", "hidden");
    tooltip.hidden = true;
  });

  // The table view
  const rows = dates.map((key) => {
    const cells = series.map((s) => {
      const point = s.points.find((p) => p.date === key);
      return `<td>${point ? point.value + (point.test ? " (test)" : "") : "–"}</td>`;
    }).join("");
    return `<tr><td>${chartDate(key)}</td>${cells}</tr>`;
  }).join("");
  document.querySelector("#chart-reps-table").innerHTML = `
    <details class="extra chart-table">
      <summary>Show as a table</summary>
      <table><thead><tr><th>Day</th><th>Push-ups</th><th>Curl-ups</th></tr></thead><tbody>${rows}</tbody></table>
    </details>`;
}


/* 2. DAYS FINISHED EACH WEEK ----------------------------------------- */

function renderWeeksChart() {
  const box = document.querySelector("#chart-weeks");
  const thisWeek = weekOf(today);
  const firstWeek = Math.max(1, thisWeek - 7); // up to 8 weeks
  const weeks = [];
  for (let week = firstWeek; week <= thisWeek; week++) {
    const monday = addDays(planStart, (week - 1) * 7);
    let done = 0;
    for (let i = 0; i < 7; i++) {
      if (doneDays.has(toKey(addDays(monday, i)))) done += 1;
    }
    weeks.push({ week, monday, done, current: week === thisWeek });
  }

  const width = box.clientWidth || 600;
  const margin = { top: 22, right: 12, bottom: 28, left: 36 };
  const plotW = width - margin.left - margin.right;
  const plotH = CHART_HEIGHT - margin.top - margin.bottom;
  const y = (value) => margin.top + plotH - (value / 7) * plotH;
  const slot = plotW / Math.max(weeks.length, 4);
  const barW = Math.min(48, slot * 0.6);

  let svg = "";
  for (const value of [0, 2, 4, 6]) {
    svg += `<line class="chart__grid" x1="${margin.left}" x2="${width - margin.right}" y1="${y(value)}" y2="${y(value)}"/>`;
    svg += `<text class="chart__tick" x="${margin.left - 8}" y="${y(value) + 4}" text-anchor="end">${value}</text>`;
  }
  weeks.forEach((w, i) => {
    const cx = margin.left + slot * i + slot / 2;
    const x0 = cx - barW / 2;
    const top = y(w.done);
    const base = y(0);
    if (w.done > 0) {
      // A bar with rounded top corners (4px), sitting on the baseline
      const r = Math.min(4, base - top);
      svg += `<path class="chart__bar" d="M${x0},${base} V${top + r} Q${x0},${top} ${x0 + r},${top} H${x0 + barW - r} Q${x0 + barW},${top} ${x0 + barW},${top + r} V${base} Z"/>`;
    }
    svg += `<text class="chart__tick" x="${cx}" y="${CHART_HEIGHT - 8}" text-anchor="middle">${w.current ? "This week" : `Wk ${w.week}`}</text>`;
    if (w.current) svg += `<text class="chart__label" x="${cx}" y="${top - 6}" text-anchor="middle">${w.done}/7</text>`;
    svg += `<rect class="chart__hit" data-week="${i}" x="${cx - slot / 2}" y="0" width="${slot}" height="${CHART_HEIGHT}"/>`;
  });

  box.innerHTML = `<svg class="chart" viewBox="0 0 ${width} ${CHART_HEIGHT}" width="${width}" height="${CHART_HEIGHT}" role="img" aria-label="Bar chart of how many days you finished each week">${svg}</svg><div class="chart__tooltip" hidden></div>`;

  const svgEl = box.querySelector("svg");
  const tooltip = box.querySelector(".chart__tooltip");
  function showWeek(event) {
    const hit = event.target.closest("[data-week]");
    if (!hit) return;
    const w = weeks[Number(hit.dataset.week)];
    const sunday = addDays(w.monday, 6);
    tooltip.innerHTML = `<b>Week ${w.week}</b><span>${chartDate(toKey(w.monday))} – ${chartDate(toKey(sunday))}</span><span><strong>${w.done}</strong> of 7 days done</span>`;
    tooltip.hidden = false;
    const rect = svgEl.getBoundingClientRect();
    const cx = (margin.left + slot * Number(hit.dataset.week) + slot / 2) * (rect.width / width);
    tooltip.style.left = `${Math.min(Math.max(cx, 70), rect.width - 70)}px`;
  }
  svgEl.addEventListener("pointermove", showWeek);
  svgEl.addEventListener("pointerdown", showWeek);
  svgEl.addEventListener("pointerleave", () => {
    tooltip.hidden = true;
  });

  document.querySelector("#chart-weeks-table").innerHTML = `
    <details class="extra chart-table">
      <summary>Show as a table</summary>
      <table><thead><tr><th>Week</th><th>Days done</th></tr></thead>
      <tbody>${weeks.map((w) => `<tr><td>Week ${w.week}${w.current ? " (this week)" : ""}</td><td>${w.done} of 7</td></tr>`).join("")}</tbody></table>
    </details>`;
}


/* 3. A CHART WITH ONE LINE ---------------------------------------------
   Used by the swim log (sports.js) and the energy check-in (stats.js).
   options:
     points: [{ date: "2026-11-27", value: 38.5 }], oldest first
     format: turns a value into text, like 38.5 -> "38.50"
     valueName: what the values are, like "Time" (for the table)
     label: what the chart shows, for screen readers
     empty: what to say when there are no points yet
     lowerIsBetter: true for times (the best one gets a ring)
     min, max, ticks: a fixed scale (optional), like 1 to 5          */

function lineChart(box, tableBox, options) {
  const points = options.points;
  const format = options.format || String;
  if (points.length === 0) {
    box.innerHTML = `<p class="chart-empty">${options.empty}</p>`;
    tableBox.innerHTML = "";
    return;
  }

  const width = box.clientWidth || 600;
  const height = 200;
  // Room on the right for the "Latest 43.85" label (about 7 pixels a letter)
  const lastLabel = `Latest ${format(points[points.length - 1].value)}`;
  const margin = { top: 16, right: lastLabel.length * 7 + 18, bottom: 28, left: 52 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;

  // The scale: fixed, or fitted around the values with tidy steps
  const values = points.map((p) => p.value);
  let low = options.min;
  let high = options.max;
  let ticks = options.ticks;
  if (low === undefined) {
    const spread = Math.max(...values) - Math.min(...values) || Math.max(1, Math.max(...values) * 0.1);
    const step = [0.5, 1, 2, 5, 10, 15, 30, 60, 120].find((s) => (spread * 1.4) / s <= 4) || 300;
    low = Math.max(0, Math.floor((Math.min(...values) - spread * 0.2) / step) * step);
    high = Math.ceil((Math.max(...values) + spread * 0.2) / step) * step;
    if (high === low) high = low + step;
    ticks = [];
    for (let v = low; v <= high + 0.0001; v += step) ticks.push(Math.round(v * 100) / 100);
  }
  const y = (value) => margin.top + plotH - ((value - low) / (high - low)) * plotH;

  const dates = points.map((p) => p.date);
  const first = fromKey(dates[0]);
  const span = Math.max(1, daysBetween(first, fromKey(dates[dates.length - 1])));
  const x = (key) => margin.left + (points.length === 1 ? plotW / 2 : (daysBetween(first, fromKey(key)) / span) * plotW);

  let svg = "";
  for (const value of ticks) {
    svg += `<line class="chart__grid" x1="${margin.left}" x2="${width - margin.right}" y1="${y(value)}" y2="${y(value)}"/>`;
    svg += `<text class="chart__tick" x="${margin.left - 8}" y="${y(value) + 4}" text-anchor="end">${format(value)}</text>`;
  }
  const uniqueDates = [...new Set(dates)];
  const shown = uniqueDates.length <= 2 ? uniqueDates : [uniqueDates[0], uniqueDates[Math.floor(uniqueDates.length / 2)], uniqueDates[uniqueDates.length - 1]];
  for (const key of shown) {
    svg += `<text class="chart__tick" x="${x(key)}" y="${height - 8}" text-anchor="middle">${chartDate(key)}</text>`;
  }

  if (points.length > 1) {
    svg += `<path class="chart__line series-2" d="${points.map((p, i) => `${i ? "L" : "M"}${x(p.date).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ")}"/>`;
  }
  for (const p of points) {
    svg += `<circle class="chart__dot series-2" cx="${x(p.date).toFixed(1)}" cy="${y(p.value).toFixed(1)}" r="4"/>`;
  }

  // Label the latest value, and ring the best one (for times)
  const last = points[points.length - 1];
  svg += `<text class="chart__label" x="${x(last.date) + 12}" y="${y(last.value) + 4}">${lastLabel}</text>`;
  if (options.lowerIsBetter && points.length > 1) {
    const best = points.reduce((a, b) => (b.value < a.value ? b : a));
    svg += `<circle class="chart__best" cx="${x(best.date).toFixed(1)}" cy="${y(best.value).toFixed(1)}" r="8"/>`;
    if (best !== last) svg += `<text class="chart__label" x="${x(best.date)}" y="${y(best.value) + 22}" text-anchor="middle">Best</text>`;
  }

  svg += `<line class="chart__crosshair" x1="0" x2="0" y1="${margin.top}" y2="${margin.top + plotH}" visibility="hidden"/>`;
  svg += `<rect class="chart__hit" x="${margin.left}" y="0" width="${plotW}" height="${height}"/>`;
  box.innerHTML = `<svg class="chart" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${options.label}">${svg}</svg><div class="chart__tooltip" hidden></div>`;

  // Hover or tap: show the nearest point
  const svgEl = box.querySelector("svg");
  const crosshair = svgEl.querySelector(".chart__crosshair");
  const tooltip = box.querySelector(".chart__tooltip");
  function showNearest(event) {
    const rect = svgEl.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * width;
    const nearest = points.reduce((a, b) => (Math.abs(x(b.date) - px) < Math.abs(x(a.date) - px) ? b : a));
    crosshair.setAttribute("x1", x(nearest.date));
    crosshair.setAttribute("x2", x(nearest.date));
    crosshair.setAttribute("visibility", "visible");
    const sameDay = points.filter((p) => p.date === nearest.date);
    tooltip.innerHTML = `<b>${chartDate(nearest.date)}</b>${sameDay.map((p) => `<span>${options.valueName}: <strong>${format(p.value)}</strong></span>`).join("")}`;
    tooltip.hidden = false;
    tooltip.style.left = `${Math.min(Math.max((x(nearest.date) / width) * rect.width, 70), rect.width - 70)}px`;
  }
  svgEl.addEventListener("pointermove", showNearest);
  svgEl.addEventListener("pointerdown", showNearest);
  svgEl.addEventListener("pointerleave", () => {
    crosshair.setAttribute("visibility", "hidden");
    tooltip.hidden = true;
  });

  tableBox.innerHTML = `
    <details class="extra chart-table">
      <summary>Show as a table</summary>
      <table><thead><tr><th>Day</th><th>${options.valueName}</th></tr></thead>
      <tbody>${points.map((p) => `<tr><td>${chartDate(p.date)}</td><td>${format(p.value)}</td></tr>`).join("")}</tbody></table>
    </details>`;
}
