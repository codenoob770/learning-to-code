/* =============================================================
   pet.js: your virtual pet
   -------------------------------------------------------------
   Your pet starts as an egg. Finish your first workout and it
   hatches! It grows as you finish more workouts, and it's happy
   when you've been working out, drinking water and sleeping well
   in the last 3 days. Skip a few days and it gets sleepy.

   Hats and colors for your pet come from the shop (shop.js).

   This file loads before app.js, so it only uses app.js's
   functions inside its own functions, never right away.
   ============================================================= */

const PET_STAGES = [
  { from: 0, name: "Egg", size: 0 },
  { from: 1, name: "Baby", size: 0.68 },
  { from: 5, name: "Kid", size: 0.8 },
  { from: 15, name: "Teen", size: 0.9 },
  { from: 30, name: "Champion", size: 1 },
  { from: 60, name: "Legend", size: 1.05 },
];

const PET_LINES = [
  "High five! ✋",
  "You're my favorite human!",
  "Strong body, strong brain! 💪🧠",
  "Did you know? Muscles grow while you SLEEP.",
  "Let's beat this week's boss together!",
  "I believe in you!",
  "Water break? I'm thirsty just watching you!",
  "One more rep! You've got this!",
];

let lastPetStage = null; // to celebrate when your pet hatches or grows

function petWorkouts() {
  return [...doneDays].filter((key) => !isRestDay(fromKey(key))).length;
}

function petStage() {
  const workouts = petWorkouts();
  let index = 0;
  PET_STAGES.forEach((stage, i) => {
    if (workouts >= stage.from) index = i;
  });
  return index;
}

// How happy your pet is, from the last 3 days: workouts, water and sleep
function petMood() {
  let points = 0;
  for (let i = 0; i < 3; i++) {
    const key = toKey(addDays(today, -i));
    if (doneDays.has(key)) points += 1;
    if (((habits[key] || {}).water || 0) >= 6) points += 1;
    if (((habits[key] || {}).sleep || 0) >= 9) points += 1;
  }
  if (points >= 4) return { id: "happy", face: "😄", text: "SO happy! We're on fire! 🔥" };
  if (points >= 2) return { id: "okay", face: "🙂", text: "Doing okay! A workout or some water would make me even happier." };
  return { id: "sleepy", face: "😴", text: "Sleepy... Let's do a workout and drink some water together!" };
}

// The pet, drawn as an SVG. "look" has the hat and color from the shop.
function petSVG(stageIndex, mood, look) {
  const color = look.color;
  const defs = color === "rainbow"
    ? `<defs><linearGradient id="pet-rainbow" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#ff6b6b"/><stop offset="0.3" stop-color="#ffd34d"/>
        <stop offset="0.6" stop-color="#7fdcc8"/><stop offset="1" stop-color="#a98bff"/></linearGradient></defs>`
    : "";
  const fill = color === "rainbow" ? "url(#pet-rainbow)" : color;

  if (stageIndex === 0) {
    // The egg, with spots in your pet's color
    return `
      <svg class="pet pet--egg" viewBox="0 0 200 200" aria-hidden="true">${defs}
        <ellipse class="pet__shadow" cx="100" cy="182" rx="46" ry="8"/>
        <g class="pet__wobble">
          <ellipse cx="100" cy="118" rx="48" ry="62" fill="#f4efe1"/>
          <circle cx="82" cy="96" r="9" fill="${fill}"/>
          <circle cx="118" cy="128" r="12" fill="${fill}"/>
          <circle cx="92" cy="150" r="7" fill="${fill}"/>
          <circle cx="122" cy="88" r="6" fill="${fill}"/>
        </g>
      </svg>`;
  }

  const size = PET_STAGES[stageIndex].size;
  const eyes = mood.id === "sleepy"
    ? `<path class="pet__line" d="M72 104 H88 M112 104 H128"/>`
    : `<circle cx="80" cy="104" r="10" fill="#fff"/><circle cx="120" cy="104" r="10" fill="#fff"/>
       <circle cx="82" cy="106" r="5.5" fill="#1c2233"/><circle cx="122" cy="106" r="5.5" fill="#1c2233"/>
       <circle cx="84" cy="103" r="1.8" fill="#fff"/><circle cx="124" cy="103" r="1.8" fill="#fff"/>`;
  const mouths = {
    happy: `<path class="pet__line" d="M84 126 Q100 142 116 126"/>`,
    okay: `<path class="pet__line" d="M88 131 H112"/>`,
    sleepy: `<ellipse cx="100" cy="132" rx="5" ry="6" fill="#1c2233"/><text class="pet__zzz" x="138" y="70">z</text><text class="pet__zzz" x="150" y="54">z</text>`,
  };
  const arms = stageIndex >= 2 ? `<path class="pet__arm" d="M44 124 Q30 120 26 108" style="stroke: ${fill}"/><path class="pet__arm" d="M156 124 Q170 120 174 108" style="stroke: ${fill}"/>` : "";
  const cape = stageIndex >= 4 ? `<path d="M58 92 Q100 70 142 92 L156 168 Q100 180 44 168 Z" fill="#e2443b"/>` : "";
  const glow = stageIndex >= 5 ? `<circle cx="100" cy="112" r="92" class="pet__glow"/>` : "";

  return `
    <svg class="pet pet--${mood.id}" viewBox="0 0 200 200" aria-hidden="true">${defs}
      ${glow}
      <ellipse class="pet__shadow" cx="100" cy="182" rx="${48 * size}" ry="8"/>
      <g class="pet__body" transform="translate(100 176) scale(${size}) translate(-100 -176)">
        ${cape}
        ${arms}
        <ellipse cx="78" cy="174" rx="15" ry="8" fill="${fill}"/>
        <ellipse cx="122" cy="174" rx="15" ry="8" fill="${fill}"/>
        <path d="M40 122 C40 72 68 50 100 50 C132 50 160 72 160 122 C160 160 134 174 100 174 C66 174 40 160 40 122 Z" fill="${fill}"/>
        <ellipse cx="100" cy="142" rx="34" ry="24" fill="#fff" opacity="0.22"/>
        <ellipse cx="66" cy="122" rx="8" ry="5" fill="#ff8fa3" opacity="0.6"/>
        <ellipse cx="134" cy="122" rx="8" ry="5" fill="#ff8fa3" opacity="0.6"/>
        ${eyes}
        ${mouths[mood.id]}
        ${petHatSVG(look.hat)}
      </g>
    </svg>`;
}

// Hats sit on top of your pet's head (the top of its head is at y = 50)
function petHatSVG(hat) {
  const hats = {
    cap: `<path d="M62 64 Q100 18 138 64 Z" fill="#e2443b"/><path d="M118 62 Q150 58 162 68 L120 70 Z" fill="#b8322b"/><circle cx="100" cy="38" r="4" fill="#b8322b"/>`,
    headband: `<path d="M44 78 Q100 62 156 78 L156 90 Q100 74 44 90 Z" fill="#f4f4f4"/><path d="M152 82 L176 74 L170 94 Z" fill="#e2443b"/><circle cx="100" cy="76" r="5" fill="#e2443b"/>`,
    goggles: `<path d="M44 84 Q100 70 156 84" class="pet__strap"/><circle cx="80" cy="78" r="13" fill="#4fd1ff" stroke="#1c2233" stroke-width="4"/><circle cx="120" cy="78" r="13" fill="#4fd1ff" stroke="#1c2233" stroke-width="4"/>`,
    party: `<path d="M78 56 L100 6 L122 56 Z" fill="#a98bff"/><path d="M86 38 L114 38 M92 24 L108 24" stroke="#ffd34d" stroke-width="5"/><circle cx="100" cy="6" r="7" fill="#ff8fc8"/>`,
    wizard: `<path d="M62 58 Q100 50 138 58 L106 -6 Q96 -10 98 4 Z" fill="#4b3aa8"/><path d="M52 58 Q100 46 148 58 Q100 68 52 58 Z" fill="#3a2c86"/><text x="96" y="38" class="pet__star">★</text>`,
    crown: `<path d="M64 58 L64 22 L82 40 L100 14 L118 40 L136 22 L136 58 Z" fill="#ffd34d" stroke="#c99a1a" stroke-width="3" stroke-linejoin="round"/><circle cx="100" cy="44" r="5" fill="#e2443b"/><circle cx="78" cy="48" r="4" fill="#4fd1ff"/><circle cx="122" cy="48" r="4" fill="#4fd1ff"/>`,
  };
  return hats[hat] || "";
}

function renderPet() {
  const stageIndex = petStage();
  const stage = PET_STAGES[stageIndex];
  const mood = petMood();
  const look = petLook(); // in shop.js
  const name = petData.name || "your pet";
  const workouts = petWorkouts();
  const next = PET_STAGES[stageIndex + 1];

  document.querySelector("#pet-picture").innerHTML = petSVG(stageIndex, mood, look);
  document.querySelector("#pet-name-title").textContent = petData.name ? `${petData.name} the ${stage.name}` : `Your pet (${stage.name})`;
  document.querySelector("#pet-mood").textContent = stageIndex === 0
    ? "🥚 Finish a workout to hatch your egg!"
    : `${mood.face} ${mood.text}`;
  document.querySelector("#pet-grow").textContent = next
    ? `${next.from - workouts} more ${next.from - workouts === 1 ? "workout" : "workouts"} until ${name} becomes a ${next.name}!`
    : `${name} is a LEGEND. Just like you!`;
  document.querySelector("#pet-grow-fill").style.width = next
    ? `${((workouts - stage.from) / (next.from - stage.from)) * 100}%`
    : "100%";
  const nameInput = document.querySelector("#pet-name");
  if (document.activeElement !== nameInput) nameInput.value = petData.name || "";

  // It hatched or grew while you were here!
  if (lastPetStage !== null && stageIndex > lastPetStage) {
    setTimeout(() => showToast(stageIndex === 1 ? "🐣 Your egg HATCHED! Go see your pet!" : `🎉 ${name} grew into a ${stage.name}!`), 2600);
  }
  lastPetStage = stageIndex;
}

document.querySelector("#pet-high-five").addEventListener("click", () => {
  const stageIndex = petStage();
  const bubble = document.querySelector("#pet-bubble");
  let line = PET_LINES[Math.floor(Math.random() * PET_LINES.length)];
  if (stageIndex === 0) line = "*wobble wobble* (I'll hatch after your first workout!)";
  else if (!doneDays.has(toKey(today)) && !isRestDay(today) && Math.random() < 0.5) line = "Want to do today's workout? I'll cheer you on!";
  else if (((habits[toKey(today)] || {}).water || 0) < 4 && Math.random() < 0.4) line = "Glug glug! Drink some water with me! 💧";
  bubble.textContent = line;
  bubble.hidden = false;
  const pet = document.querySelector("#pet-picture .pet");
  pet.classList.remove("is-jumping");
  void pet.offsetWidth; // restart the jump
  pet.classList.add("is-jumping");
  sounds.done();
});

document.querySelector("#pet-name-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const name = document.querySelector("#pet-name").value.trim().slice(0, 20);
  petData.name = name;
  saveJSON("levelUp.pet", petData);
  document.querySelector("#pet-name").blur();
  render();
  showToast(name ? `Say hi to ${name}! 🐾` : "Name cleared.");
});
