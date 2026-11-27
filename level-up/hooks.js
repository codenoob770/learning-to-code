/* =============================================================
   hooks.js: how each feature plugs itself into the page
   -------------------------------------------------------------
   Lots of features are in their own files (spelling.js, games.js
   and more). Instead of changing app.js for every new feature,
   each file "plugs in" with these little helpers:

     addPagePart(tab, draw)      draw() runs whenever the page is
                                 redrawn, but only while that tab
                                 is showing (null = always)
     addSavedData(key, load)     the key syncs like your other
                                 progress, and load() reads it
     addXP(type, xp, perDay)     XP for an activity log entry, like
                                 addXP("bee", (e) => e.r * 10, 5)
     addBadge(badge)             one more badge for the trophy case
     addXPRule(what, xp)         a line in the "How to earn XP" list
     addQuizSubject(get)         one more subject in the quiz picker.
                                 get() gives back the subject, or null
                                 to hide it (like when it's empty)

   This file loads right after plan.js, before everything else.
   ============================================================= */

const PAGE_PARTS = []; // { tab, draw }
const SAVED_KEYS = []; // extra progress keys that sync (app.js adds them to PROGRESS_KEYS)
const LOADERS = [];    // functions that read saved progress (app.js calls them in loadProgress)
const MORE_XP = {};    // activity log type -> { xp: function, perDay: number }
const MORE_XP_RULES = [];
const MORE_QUIZ_SUBJECTS = []; // functions that give back a quiz subject (or null)

function addPagePart(tab, draw) {
  PAGE_PARTS.push({ tab, draw });
}

function addSavedData(key, load) {
  SAVED_KEYS.push(key);
  LOADERS.push(load);
}

function addXP(type, xp, perDay = Infinity) {
  MORE_XP[type] = { xp, perDay };
}

// Badges go straight into the BADGES list in trophies.js (it loads before the
// feature files, so the list is there by the time they call this)
function addBadge(badge) {
  BADGES.push(badge);
}

function addXPRule(what, xp) {
  MORE_XP_RULES.push([what, xp]);
}

function addQuizSubject(get) {
  MORE_QUIZ_SUBJECTS.push(get);
}

// Draws every plugged-in part for a tab (used by render() and showTab())
function drawPageParts(tab) {
  for (const part of PAGE_PARTS) {
    if (part.tab === null || part.tab === tab) part.draw();
  }
}
