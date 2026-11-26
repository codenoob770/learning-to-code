/* =============================================================
   tabs.js: the tabs along the top
   -------------------------------------------------------------
   The page is split into tabs: Today, Quests, Arcade, Quiz and
   more. Each tab is a <div class="tab-page" data-page="..."> in
   index.html. Showing a tab hides all the others.

   The tab you're on goes in the address too (like "#quiz"), so a
   link to level-up/#quiz opens straight to the quiz.

   This file loads before app.js, so it only uses app.js's
   functions inside its own functions, never right away.
   ============================================================= */

const TAB_NAMES = ["today", "quests", "arcade", "quiz", "sports", "kitchen", "stats", "pet", "family"];
let currentTab = "today";

function showTab(name, scrollUp = true) {
  if (!TAB_NAMES.includes(name)) name = "today";
  currentTab = name;

  document.querySelectorAll("[data-page]").forEach((page) => {
    page.hidden = page.dataset.page !== name;
  });
  document.querySelectorAll(".tab[data-tab]").forEach((tab) => {
    if (tab.dataset.tab === name) tab.setAttribute("aria-current", "page");
    else tab.removeAttribute("aria-current");
  });

  // Slide the tab row so the tab you picked is on screen (on phones it scrolls sideways)
  const row = document.querySelector(".tabs__inner");
  const tab = document.querySelector(`.tab[data-tab="${name}"]`);
  const left = tab.offsetLeft - row.offsetLeft;
  if (left < row.scrollLeft || left + tab.offsetWidth > row.scrollLeft + row.clientWidth) {
    row.scrollLeft = left - 16;
  }

  if (scrollUp) window.scrollTo(0, 0);

  // Put the tab in the address, without adding lots of "back" steps
  try {
    history.replaceState(null, "", name === "today" ? location.pathname + location.search : `#${name}`);
  } catch (error) {
    // Some pages (like previews) don't allow this. That's fine.
  }

  // Charts measure their box to fit it, and a hidden box has no size,
  // so redraw them when their tab shows up
  if (name === "stats") renderCharts();
  document.dispatchEvent(new CustomEvent("tabshown", { detail: name }));
}

// Clicking a tab
document.querySelector(".tabs").addEventListener("click", (event) => {
  const tab = event.target.closest("[data-tab]");
  if (tab) showTab(tab.dataset.tab);
});

// Any button with data-go-tab="kitchen" (for example) jumps to that tab
document.addEventListener("click", (event) => {
  const link = event.target.closest("[data-go-tab]");
  if (link) {
    event.preventDefault();
    showTab(link.dataset.goTab);
  }
});

// Opening the page with a tab in the address, like "#quiz"
function showStartingTab() {
  const name = location.hash.replace("#", "");
  if (TAB_NAMES.includes(name)) showTab(name, false);
}
