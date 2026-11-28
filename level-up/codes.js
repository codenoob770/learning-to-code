/* =============================================================
   codes.js: secret codes between Level Up and Kickoff
   -------------------------------------------------------------
   1. Making and reading codes (how a challenge fits in 5 letters!)
   2. Challenge Codes: dare your sister (or brother) to a challenge
   3. Secret Message Machine: write messages in secret code
   4. Pet Playdate: your pet visits their pet
   5. Plugging in (XP, badges, saved data: see hooks.js)

   Kickoff loads this file too (from ../level-up/), so a code made
   on one page works on the other. No internet or accounts needed:
   everything is IN the code.

   This file loads before app.js, so it only uses app.js's
   functions inside its own functions, never right away.
   ============================================================= */


/* 1. MAKING AND READING CODES ------------------------------------------------
   A code like "LU-4K9PZ" holds a few small numbers, packed into BITS
   (ones and zeros), like this for a challenge:

     kind (2 bits) | move (5 bits) | how many (8 bits) | time (2 bits) | check (5 bits)

   Then every 5 bits becomes one letter from a 32-letter alphabet. It
   skips I, L, O and U, so nobody mixes up 1 and I, or 0 and O.

   The "check" bits are worked out from the rest. If someone types a
   letter wrong, the check won't match, and we can say "Oops!"
   instead of starting the wrong challenge. Real codes do this too,
   like the last digit of a credit card number.                       */

const CODE_LETTERS = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const CODE_SITE = document.title === "Kickoff" ? "KO" : "LU"; // which page made it
const CODE_SITE_NAMES = { LU: "Level Up", KO: "Kickoff" };
const CODE_KINDS = { challenge: 0, playdate: 1 };
// Who you send codes to: on Level Up it's your sister, and on Kickoff it's your brother or sister
const CODE_FRIEND = CODE_SITE === "LU" ? "your sister" : "your brother or sister";

function codeCheck(data, site) {
  const siteNumber = site === "KO" ? 11 : 7;
  return ((data * 7 + siteNumber * 13) ^ (data >>> 5) ^ (data >>> 10) ^ (data >>> 15)) & 31;
}

// fields: [[value, bits], ...] -> "LU-4K9PZ"
function makeCode(fields) {
  let data = 0;
  for (const [value, bits] of fields) data = data * 2 ** bits + (value & (2 ** bits - 1));
  let number = data * 32 + codeCheck(data, CODE_SITE);
  let letters = "";
  for (let i = 0; i < 5; i++) {
    letters = CODE_LETTERS[number % 32] + letters;
    number = Math.floor(number / 32);
  }
  return `${CODE_SITE}-${letters}`;
}

// "lu-4k9pz" -> { site: "LU", data } (or null if it isn't a real code)
function readCode(text) {
  const clean = String(text).toUpperCase().replace(/[^0-9A-Z]/g, "");
  const site = { LU: "LU", KO: "KO", K0: "KO" }[clean.slice(0, 2)];
  // After the 2-letter start, O is really 0, and I or L is really 1
  const letters = clean.slice(2).replace(/O/g, "0").replace(/[IL]/g, "1");
  if (!site || letters.length !== 5) return null;
  let number = 0;
  for (const letter of letters) {
    const value = CODE_LETTERS.indexOf(letter);
    if (value < 0) return null;
    number = number * 32 + value;
  }
  const data = Math.floor(number / 32);
  if (number % 32 !== codeCheck(data, site)) return null;
  return { site, data };
}

// Splits the data back into its fields (the same sizes, read from the right)
function unpackCode(data, sizes) {
  const values = [];
  for (let i = sizes.length - 1; i >= 0; i--) {
    values[i] = data % 2 ** sizes[i];
    data = Math.floor(data / 2 ** sizes[i]);
  }
  return values;
}

function copyCode(text, button) {
  const done = () => {
    if (button) {
      const old = button.textContent;
      button.textContent = "✓ Copied!";
      setTimeout(() => { button.textContent = old; }, 1500);
    }
  };
  try {
    navigator.clipboard.writeText(text).then(done, () => showToast("Couldn't copy. Write it down instead!"));
  } catch (error) {
    showToast("Couldn't copy. Write it down instead!");
  }
}


/* 2. CHALLENGE CODES -----------------------------------------------------------
   Pick a move and a number. You get a code to tell your sister. She
   types it into Kickoff, and the challenge is on! (It works the
   other way too.)                                                   */

const CHALLENGE_MOVES = [
  { name: "push-ups", demo: "pushup" },
  { name: "squats", demo: "squat" },
  { name: "jumping jacks", demo: "jacks" },
  { name: "burpees", demo: "burpee" },
  { name: "curl-ups", demo: "curlup" },
  { name: "lunges", demo: "lunge" },
  { name: "high knees", demo: "highKnees" },
  { name: "mountain climbers", demo: "mountainClimbers" },
  { name: "calf raises", demo: "calfRaise" },
  { name: "tuck jumps", demo: "tuckJump" },
  { name: "skaters", demo: "skaters" },
  { name: "front kicks", demo: "frontKick" },
  { name: "roundhouse kicks", demo: "roundhouseKick" },
  { name: "juggling touches in a row", demo: "juggle" },
  { name: "toe taps", demo: "toeTaps" },
  { name: "jump squats", demo: "jumpSquat" },
  { name: "inchworms", demo: "inchworm" },
  { name: "seconds of plank", demo: "plank", hold: true },
  { name: "seconds of wall sit", demo: "wallSit", hold: true },
  { name: "seconds of hollow hold", demo: "hollowHold", hold: true },
];
const CHALLENGE_TIMES = [0, 30, 60, 120]; // seconds (0 = no time limit)

let challengeData = { sent: [], got: [] }; // (saved)
let challengeDraft = { move: 0, count: 20, time: 0 };
let challengeMade = null; // the code you just made
let challengeOpen = null; // the challenge you just typed in: { code, move, count, time, site }
let challengeProblem = "";

function challengeText(move, count, time) {
  const item = CHALLENGE_MOVES[move];
  return `${count} ${item.name}${!item.hold && CHALLENGE_TIMES[time] ? ` in ${CHALLENGE_TIMES[time]} seconds` : ""}`;
}

function drawChallenges() {
  const area = document.querySelector("#codes-area");
  if (!area) return;
  const other = CODE_SITE === "LU" ? "Kickoff" : "Level Up";
  const draft = CHALLENGE_MOVES[challengeDraft.move];
  let opened = "";
  if (challengeOpen) {
    const item = CHALLENGE_MOVES[challengeOpen.move];
    const seconds = item.hold ? challengeOpen.count : CHALLENGE_TIMES[challengeOpen.time];
    opened = `
      <div class="challenge-card">
        <p class="eyebrow">// challenge from ${CODE_SITE_NAMES[challengeOpen.site]}</p>
        <p class="challenge-card__text">⚔️ ${challengeText(challengeOpen.move, challengeOpen.count, challengeOpen.time)}!</p>
        <div class="challenge-card__demo" data-challenge-demo="${item.demo}"></div>
        <div class="brain-start__buttons">
          ${seconds ? `<button class="text-button" type="button" data-challenge="timer">⏱ Start a ${seconds}-second timer</button>` : ""}
          <button class="button" type="button" data-challenge="did">💪 I did it!</button>
          <button class="button button--quiet" type="button" data-challenge="nope">Not this time</button>
        </div>
      </div>`;
  }
  const history = challengeData.got.slice(-4).reverse().map((entry) => `
    <li>${entry.result === "did" ? "✅" : entry.result === "nope" ? "😅" : "⏳"} ${escapeHTML(entry.text)} <span>${typeof chartDate === "function" ? chartDate(entry.d) : entry.d}</span></li>`).join("");
  area.innerHTML = `
    <div class="codes-columns">
      <form class="codes-make" id="challenge-form">
        <p class="field-label">⚔️ Make a challenge</p>
        <div class="form-row form-row--tight">
          <label class="visually-hidden" for="challenge-count">How many</label>
          <input class="input challenge-count" id="challenge-count" type="number" min="1" max="255" inputmode="numeric" value="${challengeDraft.count}">
          <label class="visually-hidden" for="challenge-move">Move</label>
          <select class="select" id="challenge-move">${CHALLENGE_MOVES.map((item, i) => `<option value="${i}" ${i === challengeDraft.move ? "selected" : ""}>${item.name}</option>`).join("")}</select>
        </div>
        ${draft.hold ? "" : `<div class="lab-chips" role="group" aria-label="Time limit">${CHALLENGE_TIMES.map((t, i) => `
          <button class="lab-chip" type="button" data-challenge-time="${i}" aria-pressed="${i === challengeDraft.time}">${t ? `in ${t} sec` : "no time limit"}</button>`).join("")}</div>`}
        <button class="button" type="submit">🔐 Make the code</button>
        ${challengeMade ? `
          <div class="code-show">
            <p class="code-show__code" aria-label="Code: ${challengeMade.code.split("").join(" ")}">${challengeMade.code}</p>
            <p class="code-show__what">${escapeHTML(challengeMade.text)}</p>
            <button class="text-button" type="button" data-copy="${challengeMade.code}">📋 Copy</button>
            <p class="game-help">Tell this code to ${CODE_FRIEND}! They type it into ${other}.</p>
          </div>` : ""}
      </form>
      <form class="codes-enter" id="challenge-enter">
        <label class="field-label" for="challenge-code">📨 Got a code? Type it here</label>
        <div class="form-row form-row--tight">
          <input class="input code-input" id="challenge-code" type="text" maxlength="12" placeholder="Like KO-4K9PZ" autocomplete="off" autocapitalize="characters" spellcheck="false">
          <button class="button" type="submit">Open</button>
        </div>
        <p class="form-note code-problem" aria-live="polite">${challengeProblem}</p>
        ${opened}
        ${history ? `<p class="field-label">Challenges I got</p><ul class="code-history">${history}</ul>` : ""}
      </form>
    </div>`;
  const demo = area.querySelector("[data-challenge-demo]");
  if (demo && typeof createDemo === "function" && DEMOS[demo.dataset.challengeDemo]) {
    demo.replaceChildren(createDemo(demo.dataset.challengeDemo, "How to do this move"));
    startDemoAnimation();
  }
}

document.addEventListener("submit", (event) => {
  if (event.target.id === "challenge-form") {
    event.preventDefault();
    const count = Math.round(Number(document.querySelector("#challenge-count").value));
    if (!(count >= 1 && count <= 255)) {
      showToast("Pick a number from 1 to 255!");
      return;
    }
    const move = Number(document.querySelector("#challenge-move").value);
    const time = CHALLENGE_MOVES[move].hold ? 0 : challengeDraft.time;
    challengeDraft = { move, count, time };
    const code = makeCode([[CODE_KINDS.challenge, 2], [move, 5], [count, 8], [time, 2]]);
    challengeMade = { code, text: challengeText(move, count, time) };
    challengeData = { ...challengeData, sent: [...challengeData.sent, { code, text: challengeMade.text, d: toKey(today) }].slice(-30) };
    saveJSON("levelUp.challenges", challengeData);
    startAudio();
    sounds.done();
    drawChallenges();
    return;
  }
  if (event.target.id === "challenge-enter") {
    event.preventDefault();
    const typed = document.querySelector("#challenge-code").value;
    const code = readCode(typed);
    challengeOpen = null;
    challengeProblem = "";
    if (!code) {
      challengeProblem = "🤔 Hmm, that code doesn't work. Check each letter and try again!";
    } else {
      const [kind, move, count, time] = unpackCode(code.data, [2, 5, 8, 2]);
      if (kind !== CODE_KINDS.challenge) {
        challengeProblem = "🐾 That's a Pet Playdate code! Type it on the Pet tab.";
      } else if (code.site === CODE_SITE) {
        challengeProblem = `That code was made on ${CODE_SITE_NAMES[CODE_SITE]}. Send it to ${CODE_FRIEND}, and ask for one back!`;
      } else if (!CHALLENGE_MOVES[move] || count < 1) {
        challengeProblem = "🤔 Hmm, that code doesn't work. Check each letter and try again!";
      } else {
        challengeOpen = { site: code.site, move, count, time, code: typed.toUpperCase().trim() };
        startAudio();
        sounds.fanfare();
      }
    }
    if (challengeProblem) sounds.down();
    drawChallenges();
    if (challengeOpen) document.querySelector('[data-challenge="did"]')?.focus();
  }
});

document.addEventListener("click", (event) => {
  const copy = event.target.closest("[data-copy]");
  if (copy) {
    copyCode(copy.dataset.copy, copy);
    return;
  }
  const time = event.target.closest("[data-challenge-time]");
  if (time) {
    challengeDraft = { ...challengeDraft, time: Number(time.dataset.challengeTime), count: Number(document.querySelector("#challenge-count").value) || challengeDraft.count };
    drawChallenges();
    document.querySelector(`[data-challenge-time="${challengeDraft.time}"]`)?.focus();
    return;
  }
  const button = event.target.closest("[data-challenge]");
  if (!button || !challengeOpen) return;
  const item = CHALLENGE_MOVES[challengeOpen.move];
  if (button.dataset.challenge === "timer") {
    startTimer(challengeText(challengeOpen.move, challengeOpen.count, challengeOpen.time), item.hold ? challengeOpen.count : CHALLENGE_TIMES[challengeOpen.time]);
    return;
  }
  const result = button.dataset.challenge;
  const text = challengeText(challengeOpen.move, challengeOpen.count, challengeOpen.time);
  challengeData = { ...challengeData, got: [...challengeData.got, { code: challengeOpen.code, text, d: toKey(today), result }].slice(-30) };
  saveJSON("levelUp.challenges", challengeData);
  if (result === "did") {
    logActivity("challenge", { m: challengeOpen.move, n: challengeOpen.count, reps: item.hold ? Math.round(challengeOpen.count / 2) : challengeOpen.count });
    sounds.fanfare();
    if (typeof confetti === "function") confetti();
    showToast(`💪 Challenge complete! Tell ${CODE_FRIEND} you did it!`);
  } else {
    sounds.done();
    showToast("😅 That's OK! Send one back to her instead!");
  }
  challengeOpen = null;
  document.querySelector("#challenge-code").value = "";
  render();
  drawChallenges();
  checkAchievements(true);
});

document.addEventListener("change", (event) => {
  if (event.target.id !== "challenge-move") return;
  challengeDraft = { ...challengeDraft, move: Number(event.target.value), count: Number(document.querySelector("#challenge-count").value) || challengeDraft.count };
  drawChallenges();
  document.querySelector("#challenge-move").focus();
});


/* 3. SECRET MESSAGE MACHINE ------------------------------------------------------
   Level 1: a CAESAR CIPHER. Every letter moves forward in the alphabet
   by the "key". With key 3: A→D, B→E... and Z goes around to C. Julius
   Caesar wrote secret messages like this about 2,000 years ago!

   Level 2: a KEYWORD CIPHER (it's called a Vigenère cipher). Each
   letter of the keyword is a different key, so the same letter can
   turn into different letters. Way harder to crack!

   To decode, you move the letters BACKWARD by the same key.        */

let cipher = { mode: "caesar", key: 3, word: "KIHAP", decode: false, text: "" };

function shiftLetter(letter, by) {
  const code = letter.charCodeAt(0);
  const base = code >= 97 ? 97 : 65; // lowercase or capital
  return String.fromCharCode(base + ((((code - base + by) % 26) + 26) % 26));
}

function runCipher(text, settings) {
  const direction = settings.decode ? -1 : 1;
  const word = settings.word.toUpperCase().replace(/[^A-Z]/g, "") || "A";
  let used = 0; // keyword letters only move along on letters, not spaces
  return text.replace(/[A-Za-z]/g, (letter) => {
    const by = settings.mode === "caesar" ? settings.key : word.charCodeAt(used++ % word.length) - 65;
    return shiftLetter(letter, by * direction);
  });
}

function drawCipher() {
  const area = document.querySelector("#cipher-area");
  if (!area) return;
  const abc = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const strip = cipher.mode === "caesar"
    ? `<div class="cipher-strip" aria-label="With key ${cipher.key}, A becomes ${shiftLetter("A", cipher.key)}">
        <div>${abc.split("").map((l) => `<span>${l}</span>`).join("")}</div>
        <div>${abc.split("").map((l) => `<span>${shiftLetter(l, cipher.key)}</span>`).join("")}</div>
      </div>`
    : "";
  area.innerHTML = `
    <div class="lab-chips" role="group" aria-label="Kind of code">
      <button class="lab-chip" type="button" data-cipher-mode="caesar" aria-pressed="${cipher.mode === "caesar"}">Level 1: Caesar</button>
      <button class="lab-chip" type="button" data-cipher-mode="word" aria-pressed="${cipher.mode === "word"}">Level 2: Keyword</button>
    </div>
    <div class="form-row form-row--tight">
      ${cipher.mode === "caesar" ? `
        <p class="field-label">Key</p>
        <span class="stepper">
          <button type="button" data-cipher-key="-1" aria-label="Key down">−</button>
          <span aria-live="polite">${cipher.key}</span>
          <button type="button" data-cipher-key="1" aria-label="Key up">+</button>
        </span>` : `
        <label class="field-label" for="cipher-word">Keyword</label>
        <input class="input cipher-word" id="cipher-word" type="text" maxlength="12" value="${escapeHTML(cipher.word)}" autocomplete="off" autocapitalize="characters" spellcheck="false">`}
      <div class="lab-chips" role="group" aria-label="Make or crack">
        <button class="lab-chip" type="button" data-cipher-decode="0" aria-pressed="${!cipher.decode}">🔒 Make a secret</button>
        <button class="lab-chip" type="button" data-cipher-decode="1" aria-pressed="${cipher.decode}">🔓 Crack a secret</button>
      </div>
    </div>
    ${strip}
    <label class="field-label" for="cipher-in">${cipher.decode ? "Type the secret message" : "Type your message"}</label>
    <textarea class="input cipher-in" id="cipher-in" rows="3" maxlength="400" placeholder="${cipher.decode ? "Like: Krz duh brx?" : "Like: Meet me at the trampoline!"}">${escapeHTML(cipher.text)}</textarea>
    <p class="field-label">${cipher.decode ? "🔓 It says:" : "🔒 Secret version:"}</p>
    <p class="cipher-out" id="cipher-out" aria-live="polite">${escapeHTML(runCipher(cipher.text, cipher)) || "&nbsp;"}</p>
    <div class="brain-start__buttons">
      <button class="text-button" type="button" data-cipher-copy>📋 Copy</button>
      <p class="game-help">${cipher.mode === "caesar"
        ? `Tell ${CODE_FRIEND} the key (${cipher.key}) in secret, so they can crack it!`
        : `Tell ${CODE_FRIEND} the keyword in secret. Without it, it's REALLY hard to crack!`}</p>
    </div>`;
}

const cipherArea = document.querySelector("#cipher-area");

if (cipherArea) {
  cipherArea.addEventListener("input", (event) => {
    if (event.target.id === "cipher-in") {
      cipher.text = event.target.value;
      document.querySelector("#cipher-out").innerHTML = escapeHTML(runCipher(cipher.text, cipher)) || "&nbsp;";
    }
    if (event.target.id === "cipher-word") {
      cipher.word = event.target.value;
      document.querySelector("#cipher-out").innerHTML = escapeHTML(runCipher(cipher.text, cipher)) || "&nbsp;";
    }
  });

  cipherArea.addEventListener("click", (event) => {
    const mode = event.target.closest("[data-cipher-mode]");
    const key = event.target.closest("[data-cipher-key]");
    const decode = event.target.closest("[data-cipher-decode]");
    if (mode) cipher.mode = mode.dataset.cipherMode;
    if (key) cipher.key = ((cipher.key - 1 + Number(key.dataset.cipherKey) + 25) % 25) + 1; // 1 to 25
    if (decode) {
      const wasDecode = cipher.decode;
      cipher.decode = decode.dataset.cipherDecode === "1";
      // Flip the message too, so you can see it both ways
      if (wasDecode !== cipher.decode) cipher.text = runCipher(cipher.text, { ...cipher, decode: wasDecode });
    }
    if (event.target.closest("[data-cipher-copy]")) {
      copyCode(runCipher(cipher.text, cipher), event.target.closest("[data-cipher-copy]"));
      if (cipher.text.trim() && !logOf("cipher").some((entry) => entry.d === toKey(today))) {
        logActivity("cipher", { m: cipher.mode });
        render();
        checkAchievements(true);
      }
      return;
    }
    if (mode || key || decode) {
      drawCipher();
      const again = mode ? `[data-cipher-mode="${cipher.mode}"]` : key ? `[data-cipher-key="${key.dataset.cipherKey}"]` : `[data-cipher-decode="${cipher.decode ? 1 : 0}"]`;
      document.querySelector(again)?.focus();
    }
  });
}


/* 4. PET PLAYDATE --------------------------------------------------------------------
   Your pet's code holds how it looks (its hat, color and how grown up
   it is). Type in your sister's pet's code, and her pet comes over to
   play!                                                              */

let playdates = []; // the pets that came over: [{ code, d }] (saved)
let playdateFriend = null; // the pet that's visiting right now
let playdateProblem = "";

function shopIndex(group, id) {
  return Math.max(0, SHOP.filter((item) => item.group === group).findIndex((item) => item.id === id));
}

function shopByIndex(group, index) {
  const items = SHOP.filter((item) => item.group === group);
  return (items[index] || items[0]).id;
}

function myPetCode() {
  const look = petLook();
  return makeCode([[CODE_KINDS.playdate, 2], [shopIndex("petColor", look.color), 5], [shopIndex("hat", look.hat), 5], [petStage(), 3]]);
}

function drawPlaydate() {
  const area = document.querySelector("#playdate-area");
  if (!area) return;
  const name = petData.name || "Your pet";
  let visit = "";
  if (playdateFriend) {
    const mood = { id: "happy" };
    visit = `
      <div class="playdate-scene" aria-label="${escapeHTML(name)} and a friend from ${CODE_SITE_NAMES[playdateFriend.site]} playing together">
        <div class="playdate-pet">${petSVG(petStage(), mood, petLook())}<p>${escapeHTML(name)}</p></div>
        <div class="playdate-hearts" aria-hidden="true"><span>💖</span><span>✨</span><span>💖</span></div>
        <div class="playdate-pet playdate-pet--friend">${petSVG(playdateFriend.stage, mood, playdateFriend.look)}<p>Friend from ${CODE_SITE_NAMES[playdateFriend.site]}</p></div>
      </div>
      <p class="playdate-line">🎉 ${petStage() === 0 && playdateFriend.stage === 0 ? "Two eggs, side by side. Wiggle wiggle!" : "They're playing tag! Best friends forever!"}</p>`;
  }
  area.innerHTML = `
    <div class="codes-columns">
      <div>
        <p class="field-label">${escapeHTML(name)}'s playdate code</p>
        <div class="code-show">
          <p class="code-show__code">${myPetCode()}</p>
          <button class="text-button" type="button" data-copy="${myPetCode()}">📋 Copy</button>
          <p class="game-help">Tell ${CODE_FRIEND} this code, so your pet can visit theirs! (It changes when your pet grows or gets a new hat.)</p>
        </div>
      </div>
      <form id="playdate-form">
        <label class="field-label" for="playdate-code">Friend's pet code</label>
        <div class="form-row form-row--tight">
          <input class="input code-input" id="playdate-code" type="text" maxlength="12" placeholder="Like KO-7Q4K2" autocomplete="off" autocapitalize="characters" spellcheck="false">
          <button class="button" type="submit">🐾 Invite</button>
        </div>
        <p class="form-note code-problem" aria-live="polite">${playdateProblem}</p>
        <p class="quiz-total">${playdates.length ? `Playdates so far: ${playdates.length}` : "No playdates yet!"}</p>
      </form>
    </div>
    ${visit}`;
}

document.addEventListener("submit", (event) => {
  if (event.target.id !== "playdate-form") return;
  event.preventDefault();
  const typed = document.querySelector("#playdate-code").value;
  const code = readCode(typed);
  playdateProblem = "";
  playdateFriend = null;
  if (!code) {
    playdateProblem = "🤔 That code doesn't work. Check each letter and try again!";
  } else {
    const [kind, color, hat, stage] = unpackCode(code.data, [2, 5, 5, 3]);
    if (kind !== CODE_KINDS.playdate) {
      playdateProblem = "⚔️ That's a challenge code! Type it in Challenge Codes.";
    } else if (code.site === CODE_SITE) {
      playdateProblem = `That's a pet from this page! Ask ${CODE_FRIEND} for their pet's code.`;
    } else {
      playdateFriend = { site: code.site, stage: Math.min(stage, PET_STAGES.length - 1), look: { color: shopByIndex("petColor", color), hat: shopByIndex("hat", hat) } };
      const clean = typed.toUpperCase().trim();
      const first = !playdates.some((visit) => visit.d === toKey(today));
      playdates = [...playdates, { code: clean, d: toKey(today) }].slice(-50);
      saveJSON("levelUp.playdates", playdates);
      if (first) logActivity("playdate", { c: clean });
      startAudio();
      sounds.fanfare();
      if (typeof confetti === "function") confetti();
      render();
      checkAchievements(true);
    }
  }
  if (playdateProblem) sounds.down();
  drawPlaydate();
});


/* 5. PLUGGING IN (see hooks.js) ------------------------------------------------ */

addPagePart("family", () => {
  const typing = (id) => {
    const area = document.querySelector(id);
    return area && area.contains(document.activeElement) && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
  };
  if (!typing("#codes-area")) drawChallenges();
  if (!typing("#cipher-area")) drawCipher();
});
addPagePart("pet", () => {
  const area = document.querySelector("#playdate-area");
  if (area && !(area.contains(document.activeElement) && document.activeElement.tagName === "INPUT")) drawPlaydate();
});

addSavedData("levelUp.challenges", () => {
  const saved = loadJSON("levelUp.challenges", null);
  challengeData = saved && Array.isArray(saved.sent) && Array.isArray(saved.got) ? saved : { sent: [], got: [] };
});
addSavedData("levelUp.playdates", () => {
  const saved = loadJSON("levelUp.playdates", []);
  playdates = Array.isArray(saved) ? saved : [];
});

addXP("challenge", () => 20, 3);
addXP("cipher", () => 10, 1);
addXP("playdate", () => 15, 1);

addXPRule("Finish a Challenge Code", "+20");
addXPRule("Send a secret message", "+10 (once a day)");
addXPRule("Pet Playdate", "+15 (once a day)");

addBadge({ id: "challengeAccepted", icon: "⚔️", name: "Challenge Accepted", how: "Finish 3 challenges from Challenge Codes", earned: () => logOf("challenge").length >= 3 });
addBadge({ id: "codeMaker", icon: "🔐", name: "Secret Agent", how: "Send a secret message with the Secret Message Machine", earned: () => logOf("cipher").length >= 1 });
addBadge({ id: "petPals", icon: "🐾", name: "Pet Pals", how: "Have 3 Pet Playdates", earned: () => logOf("playdate").length >= 3 });
