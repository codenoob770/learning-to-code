/* =============================================================
   pet-plus.js: more for your pet
   -------------------------------------------------------------
   1. Sport forms: your pet dresses like the sport you do most
   2. Treats (from the Mystery Box in the Arcade)
   3. Tricks: unlocked by your best streak
   4. The pet room: furniture you buy with coins

   This file loads before app.js, so it only uses app.js's
   functions inside its own functions, never right away.
   ============================================================= */


/* 1. SPORT FORMS --------------------------------------------------------
   Points for each sport from the last 30 days. Whichever sport has
   the most is your pet's look! (It needs at least 3 points.)       */

const PET_FORMS = {
  soccer: { name: "Soccer Star", icon: "⚽" },
  tkd: { name: "Taekwondo Warrior", icon: "🥋" },
  swim: { name: "Swim Champ", icon: "🏊" },
};
const FORM_POINTS_NEEDED = 3;

function sportPoints() {
  const since = toKey(addDays(today, -29));
  const points = { soccer: 0, tkd: 0, swim: 0 };
  for (const entry of activityLog) {
    if (entry.d < since) continue;
    if (entry.t === "soccer") points.soccer += 3;
    if (entry.t === "shootout" || entry.t === "reflex") points.soccer += 1;
    if (entry.t === "swimLesson") points.swim += 3;
    if (entry.t === "boards" || entry.t === "kicks" || entry.t === "korean") points.tkd += 1;
    if (entry.t === "gameDay") points[entry.e === "test" ? "tkd" : entry.e] += 2;
    if (entry.t === "drill") {
      const found = findLesson(entry.lesson); // training.js
      if (found) points[found.sport.id] += 2;
    }
  }
  for (const belt of beltData.history || []) {
    if (belt.d && belt.d >= since) points.tkd += 5;
  }
  return points;
}

function petForm() {
  const points = sportPoints();
  const [best, score] = Object.entries(points).sort((a, b) => b[1] - a[1])[0];
  return score >= FORM_POINTS_NEEDED ? best : null;
}

// Drawn on your pet's body (pet.js puts it under the eyes and the hat)
function petFormSVG() {
  const form = petForm();
  if (form === "soccer") {
    return `
      <path d="M43 132 C46 162 70 174 100 174 C130 174 154 162 157 132 Q100 146 43 132 Z" fill="#e2443b"/>
      <path d="M43 132 Q100 146 157 132" stroke="#fff" stroke-width="4" fill="none"/>
      <text x="100" y="166" text-anchor="middle" class="pet__number">10</text>
      <circle cx="160" cy="170" r="12" fill="#fff" stroke="#1c2233" stroke-width="2.5"/>
      <path d="M160 163 L166 167 L164 174 L156 174 L154 167 Z" fill="#1c2233"/>`;
  }
  if (form === "tkd") {
    const belt = BELTS[beltData.belt] || BELTS[0];
    const stripe = belt.colors[1] ? `<path d="M42 146 Q100 158 158 146" stroke="${belt.colors[1]}" stroke-width="3" fill="none"/>` : "";
    return `
      <path d="M42 120 C42 160 68 174 100 174 C132 174 158 160 158 120 L130 116 L100 146 L70 116 Z" fill="#f4f4f4"/>
      <path d="M70 116 L100 146 L130 116" stroke="#d4d4d4" stroke-width="4" fill="none"/>
      <path d="M41 140 Q100 154 159 140 L159 152 Q100 166 41 152 Z" fill="${belt.colors[0]}"/>
      ${stripe}
      <path d="M96 152 L86 172 L94 172 L100 158 L106 172 L114 172 L104 152 Z" fill="${belt.colors[0]}"/>`;
  }
  if (form === "swim") {
    return `
      <ellipse cx="100" cy="150" rx="64" ry="15" fill="none" stroke="#ff6b6b" stroke-width="11"/>
      <ellipse cx="100" cy="150" rx="64" ry="15" fill="none" stroke="#fff" stroke-width="11" stroke-dasharray="18 22"/>
      <path d="M30 96 q4 -10 8 0 a4 4 0 1 1 -8 0 Z M166 84 q4 -10 8 0 a4 4 0 1 1 -8 0 Z" fill="#6fb7ff"/>`;
  }
  return "";
}


/* 2. TREATS ----------------------------------------------------------- */

function treatsLeft() {
  return Math.max(0, boxTreats() - logOf("treat").length); // boxTreats() is in games.js
}

function hadTreatToday() {
  return logOf("treat").some((entry) => entry.d === toKey(today));
}


/* 3. TRICKS -------------------------------------------------------------
   Your best streak ever unlocks tricks, so they never lock again.  */

const PET_TRICKS = [
  { id: "spin", name: "Spin", icon: "🌀", streak: 2, line: "Wheee! 🌀" },
  { id: "jump", name: "Super jump", icon: "⬆️", streak: 3, line: "Boing! How high was that?!" },
  { id: "flip", name: "Backflip", icon: "🤸", streak: 5, line: "A BACKFLIP! Just like you're training for!" },
  { id: "dance", name: "Dance", icon: "💃", streak: 7, line: "🎵 Dance party! 🎵" },
  { id: "kick", name: "Kihap kick", icon: "🥋", streak: 10, line: "KIHAP! 🥋" },
  { id: "juggle", name: "Juggle", icon: "⚽", streak: 14, line: "1, 2, 3... I'm a juggling pro!" },
  { id: "glow", name: "Rainbow glow", icon: "🌈", streak: 21, line: "I'm glowing with pride! 🌈" },
];

let petTaps = []; // when you tapped the pet (for a secret in fun.js)

function doTrick(trick) {
  const pet = document.querySelector("#pet-picture .pet");
  if (!pet) return;
  PET_TRICKS.forEach((item) => pet.classList.remove(`trick-${item.id}`));
  void pet.getBoundingClientRect(); // restarts the animation
  pet.classList.add(`trick-${trick.id}`);
  const bubble = document.querySelector("#pet-bubble");
  bubble.textContent = trick.line;
  bubble.hidden = false;
  sounds.up();
  if (trick.id === "juggle") {
    const ball = document.createElement("span");
    ball.className = "pet-juggle-ball";
    ball.textContent = "⚽";
    ball.setAttribute("aria-hidden", "true");
    document.querySelector(".pet-stage").append(ball);
    setTimeout(() => ball.remove(), 2200);
  }
}


/* 4. THE PET ROOM -----------------------------------------------------------
   Buy furniture with coins (the same coins as the shop). Everything
   you buy goes in the room, and you can put things away. "spot" is
   where it goes: left and top in %, and its size.                  */

const ROOM_ITEMS = [
  { id: "rug", name: "Comfy rug", icon: "🟣", price: 40, rug: true },
  { id: "bed", name: "Pet bed", icon: "🛏️", price: 60, spot: [16, 80, 2.6] },
  { id: "plant", name: "Plant", icon: "🪴", price: 30, spot: [88, 74, 2.2] },
  { id: "ball", name: "Soccer ball", icon: "⚽", price: 25, spot: [72, 88, 1.3] },
  { id: "teddy", name: "Teddy bear", icon: "🧸", price: 35, spot: [30, 88, 1.5] },
  { id: "window", name: "Window", icon: "🪟", price: 50, spot: [16, 24, 2.4] },
  { id: "poster", name: "Poster", icon: "🖼️", price: 40, spot: [84, 22, 2.1] },
  { id: "books", name: "Bookshelf", icon: "📚", price: 50, spot: [86, 48, 1.8] },
  { id: "bag", name: "Punching bag", icon: "🥊", price: 80, spot: [10, 52, 2] },
  { id: "fish", name: "Fish tank", icon: "🐠", price: 90, spot: [50, 12, 1.6] },
  { id: "rocket", name: "Toy rocket", icon: "🚀", price: 70, spot: [62, 70, 1.4] },
  { id: "trophy", name: "Golden trophy", icon: "🏆", price: 150, spot: [72, 40, 1.7] },
  { id: "disco", name: "Disco ball", icon: "🪩", price: 200, spot: [32, 8, 1.8] },
];
const ROOM_WALLS = [
  { id: "plain", name: "Plain wall", icon: "⬜", price: 0, color: null },
  { id: "sky", name: "Sky wallpaper", icon: "☁️", price: 60, color: "linear-gradient(#5aa7e8, #a8d8ff)" },
  { id: "space", name: "Space wallpaper", icon: "🌌", price: 100, color: "radial-gradient(circle at 30% 30%, #3b2d78, #0d0a24)" },
  { id: "jungle", name: "Jungle wallpaper", icon: "🌴", price: 100, color: "linear-gradient(#1f6b3a, #3c9a52)" },
  { id: "candy", name: "Candy wallpaper", icon: "🍬", price: 100, color: "repeating-linear-gradient(45deg, #ff9fd6 0 14px, #ffc8e8 14px 28px)" },
];

function roomOwns(key) {
  return shopData.owned.includes(key);
}

function roomPlaced() {
  return Array.isArray(shopData.room) ? shopData.room : [];
}

function drawPetRoom() {
  const layer = document.querySelector("#pet-room");
  const owned = ROOM_ITEMS.filter((item) => roomOwns(`room:${item.id}`));
  const wall = ROOM_WALLS.find((item) => item.id === shopData.wall && roomOwns(`wall:${item.id}`));
  const placed = owned.filter((item) => roomPlaced().includes(item.id));
  const hasRoom = owned.length > 0 || wall;
  document.querySelector(".pet-stage").classList.toggle("has-room", Boolean(hasRoom));
  if (!hasRoom) {
    layer.innerHTML = "";
    return;
  }
  layer.innerHTML = `
    <div class="pet-room__wall" style="${wall && wall.color ? `background: ${wall.color}` : ""}"></div>
    <div class="pet-room__floor"></div>
    ${placed.some((item) => item.rug) ? `<div class="pet-room__rug"></div>` : ""}
    ${placed.filter((item) => item.spot).map((item) => `
      <span class="pet-room__item" style="left: ${item.spot[0]}%; top: ${item.spot[1]}%; font-size: ${item.spot[2]}rem">${item.icon}</span>`).join("")}`;
}

function drawRoomShop() {
  const area = document.querySelector("#room-area");
  const wallet = coins();
  const button = (group, item) => {
    const key = `${group}:${item.id}`;
    if (group === "wall") {
      if (item.price === 0 || roomOwns(key)) {
        const on = (shopData.wall || "plain") === item.id;
        return on ? `<span class="shop-item__worn">✓ On the wall</span>` : `<button class="button button--quiet" type="button" data-room-wall="${item.id}">Use it</button>`;
      }
    } else if (roomOwns(key)) {
      const placed = roomPlaced().includes(item.id);
      return `<button class="button button--quiet" type="button" data-room-place="${item.id}">${placed ? "Put away" : "Put in room"}</button>`;
    }
    return `<button class="button" type="button" data-room-buy="${key}" ${wallet < item.price ? "disabled" : ""}>🪙 ${item.price}</button>`;
  };
  const list = (group, items) => items.map((item) => `
    <li class="shop-item ${group === "room" && roomPlaced().includes(item.id) ? "is-worn" : ""}">
      <span class="shop-item__icon">${item.icon}</span>
      <span class="shop-item__name">${item.name}</span>
      ${button(group, item)}
    </li>`).join("");
  area.innerHTML = `
    <p class="coins room-coins"><span aria-hidden="true">🪙</span> <strong>${wallet.toLocaleString()}</strong> coins</p>
    <div class="shop-group">
      <h3>🛋️ Furniture and toys</h3>
      <ul class="shop-items">${list("room", ROOM_ITEMS)}</ul>
    </div>
    <div class="shop-group">
      <h3>🎨 Wallpaper</h3>
      <ul class="shop-items">${list("wall", ROOM_WALLS)}</ul>
    </div>`;
}

document.querySelector("#room-area").addEventListener("click", (event) => {
  const buy = event.target.closest("[data-room-buy]");
  const place = event.target.closest("[data-room-place]");
  const wall = event.target.closest("[data-room-wall]");
  if (buy) {
    const [group, id] = buy.dataset.roomBuy.split(":");
    const item = (group === "wall" ? ROOM_WALLS : ROOM_ITEMS).find((thing) => thing.id === id);
    if (!item || roomOwns(`${group}:${id}`)) return;
    if (coins() < item.price) {
      showToast(`You need ${item.price - coins()} more coins. Keep earning XP!`);
      return;
    }
    shopData.spent = (shopData.spent || 0) + item.price;
    shopData.owned = [...shopData.owned, `${group}:${id}`];
    if (group === "wall") shopData.wall = id;
    else shopData.room = [...roomPlaced(), id];
    showToast(`${item.icon} ${item.name} is in your pet's room!`);
    sounds.fanfare();
  } else if (place) {
    const id = place.dataset.roomPlace;
    shopData.room = roomPlaced().includes(id) ? roomPlaced().filter((thing) => thing !== id) : [...roomPlaced(), id];
    sounds.done();
  } else if (wall) {
    shopData.wall = wall.dataset.roomWall;
    sounds.done();
  } else {
    return;
  }
  saveJSON("levelUp.shop", shopData);
  render();
  checkAchievements(true);
  const key = (buy || place || wall).dataset;
  document.querySelector(`[data-room-place="${key.roomBuy ? key.roomBuy.split(":")[1] : key.roomPlace}"], [data-room-wall], [data-room-buy]`)?.focus();
});


/* THE EXTRAS UNDER YOUR PET'S NAME --------------------------------------------- */

function drawPetExtras() {
  const area = document.querySelector("#pet-extras");
  const hatched = petStage() >= 1;
  const form = petForm();
  const points = sportPoints();
  const best = trophyStats().bestStreak;
  const treats = treatsLeft();

  const tricks = PET_TRICKS.map((trick) => {
    const unlocked = hatched && best >= trick.streak;
    return unlocked
      ? `<button class="lab-chip" type="button" data-pet-trick="${trick.id}">${trick.icon} ${trick.name}</button>`
      : `<span class="lab-chip is-locked" title="Unlocks with a ${trick.streak}-day streak">🔒 ${trick.streak}-day streak</span>`;
  }).join("");

  area.innerHTML = `
    <div class="pet-extra">
      <p class="pet-extra__title">${form ? `${PET_FORMS[form].icon} Sport form: <strong>${PET_FORMS[form].name}</strong>` : "🏅 Sport form: not yet"}</p>
      <p class="pet-extra__text">Your pet dresses like the sport you do most. Last 30 days: ⚽ ${points.soccer} · 🥋 ${points.tkd} · 🏊 ${points.swim} points${form ? "" : ` (${FORM_POINTS_NEEDED} points unlocks a look!)`}</p>
    </div>
    <div class="pet-extra">
      <p class="pet-extra__title">🎪 Tricks <span class="pet-extra__small">(your best streak: ${plural(best, "day")})</span></p>
      ${hatched ? "" : `<p class="pet-extra__text">Hatch your egg first!</p>`}
      <div class="lab-chips">${tricks}</div>
    </div>
    <div class="pet-extra">
      <p class="pet-extra__title">🍪 Treats: ${treats}</p>
      ${treats && hatched
        ? `<button class="button button--quiet" type="button" data-pet-treat>Give a treat</button>`
        : `<p class="pet-extra__text">${hadTreatToday() ? "Yum! Your pet had a treat today. 😋" : "Find treats in the Mystery Box on the Arcade tab!"}</p>`}
    </div>`;
}

document.querySelector("#pet-extras").addEventListener("click", (event) => {
  const trickButton = event.target.closest("[data-pet-trick]");
  if (trickButton) {
    doTrick(PET_TRICKS.find((trick) => trick.id === trickButton.dataset.petTrick));
    return;
  }
  if (event.target.closest("[data-pet-treat]") && treatsLeft() > 0) {
    logActivity("treat");
    render();
    const bubble = document.querySelector("#pet-bubble");
    bubble.textContent = "Yum yum! Thank you! 😋🍪";
    bubble.hidden = false;
    sounds.fanfare();
    doTrick(PET_TRICKS[1]); // a happy jump
    bubble.textContent = "Yum yum! Thank you! 😋🍪";
  }
});

// Tapping the pet (fun.js looks at this for a secret)
document.querySelector("#pet-picture").addEventListener("click", () => {
  const now = Date.now();
  petTaps = [...petTaps.filter((time) => now - time < 4000), now];
});


/* PLUGGING IN (see hooks.js) ------------------------------------------------------ */

addPagePart("pet", () => {
  drawPetRoom();
  drawPetExtras();
  drawRoomShop();
});

addBadge({ id: "decorator", icon: "🛋️", name: "Decorator", how: "Put 5 things in your pet's room", earned: () => roomPlaced().length >= 5 });
addBadge({ id: "trickster", icon: "🎪", name: "Trick Master", how: "Unlock 4 pet tricks (a 7-day streak)", earned: (s) => s.bestStreak >= 7 && s.petStage >= 1 });
