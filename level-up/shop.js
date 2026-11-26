/* =============================================================
   shop.js: the coin shop
   -------------------------------------------------------------
   Every 10 XP you earn is 1 coin. Spend coins on:
   - page themes (new colors for the whole page)
   - hats and colors for your pet (pet.js)
   - colors for the stick figures in the demos

   Coins are worked out from your XP, so they sync by themselves.
   The shop only saves what you spent, what you own and what
   you're wearing. Expert mode's red always wins over a theme.

   This file loads before app.js, so it only uses app.js's
   functions inside its own functions, never right away.
   ============================================================= */

const XP_PER_COIN = 10;

// "free: true" items you own from the start
const SHOP = [
  { group: "theme", id: "classic", name: "Classic", icon: "🌙", price: 0, free: true, swatch: "#ffe24d" },
  { group: "theme", id: "ocean", name: "Ocean", icon: "🌊", price: 150, swatch: "#4fd1ff" },
  { group: "theme", id: "forest", name: "Forest", icon: "🌲", price: 150, swatch: "#8be36a" },
  { group: "theme", id: "galaxy", name: "Galaxy", icon: "🌌", price: 200, swatch: "#c59bff" },
  { group: "theme", id: "candy", name: "Candy", icon: "🍭", price: 200, swatch: "#ff8fd0" },
  { group: "theme", id: "gold", name: "Gold", icon: "🏆", price: 600, swatch: "#ffcf40" },

  { group: "hat", id: "none", name: "No hat", icon: "🙂", price: 0, free: true },
  { group: "hat", id: "cap", name: "Ball cap", icon: "🧢", price: 60 },
  { group: "hat", id: "headband", name: "Taekwondo headband", icon: "🥋", price: 80 },
  { group: "hat", id: "goggles", name: "Swim goggles", icon: "🥽", price: 80 },
  { group: "hat", id: "party", name: "Party hat", icon: "🥳", price: 100 },
  { group: "hat", id: "wizard", name: "Wizard hat", icon: "🧙", price: 150 },
  { group: "hat", id: "crown", name: "Crown", icon: "👑", price: 400 },

  { group: "petColor", id: "#7fdcc8", name: "Mint", price: 0, free: true, swatch: "#7fdcc8" },
  { group: "petColor", id: "#ff9f5a", name: "Orange", price: 50, swatch: "#ff9f5a" },
  { group: "petColor", id: "#a98bff", name: "Purple", price: 50, swatch: "#a98bff" },
  { group: "petColor", id: "#ff8fc8", name: "Pink", price: 50, swatch: "#ff8fc8" },
  { group: "petColor", id: "#6fb7ff", name: "Sky blue", price: 50, swatch: "#6fb7ff" },
  { group: "petColor", id: "#ffd34d", name: "Gold", price: 250, swatch: "#ffd34d" },
  { group: "petColor", id: "rainbow", name: "Rainbow", price: 400, swatch: "linear-gradient(135deg, #ff6b6b, #ffd34d, #7fdcc8, #a98bff)" },

  { group: "figure", id: "white", name: "White", price: 0, free: true, swatch: "#e3e8f5" },
  { group: "figure", id: "gold", name: "Gold", price: 80, swatch: "#ffd34d" },
  { group: "figure", id: "neon", name: "Neon green", price: 80, swatch: "#7dff8a" },
  { group: "figure", id: "fire", name: "Fire", price: 80, swatch: "#ff7a3d" },
  { group: "figure", id: "ice", name: "Ice blue", price: 80, swatch: "#8fe3ff" },
];

const SHOP_GROUPS = [
  { id: "theme", name: "🎨 Page themes", lead: "New colors for the whole page." },
  { id: "hat", name: "🎩 Pet hats", lead: "Something stylish for your pet to wear." },
  { id: "petColor", name: "🖌️ Pet colors", lead: "Paint your pet a new color." },
  { id: "figure", name: "🕺 Stick figure colors", lead: "The color of the stick figures in the demos." },
];

// What you're wearing in each group (the free item if you haven't picked)
function wearing(group) {
  const free = SHOP.find((item) => item.group === group && item.free);
  return (shopData.wear || {})[group] || free.id;
}

function owns(item) {
  return item.free || shopData.owned.includes(`${item.group}:${item.id}`);
}

function coins() {
  return Math.max(0, Math.floor(trophyStats().xp / XP_PER_COIN) - (shopData.spent || 0));
}

// Your pet's hat and color (for pet.js)
function petLook() {
  return { hat: wearing("hat"), color: wearing("petColor") };
}

// Puts the theme and figure color on the page (style.css does the rest)
function applyWear() {
  const theme = wearing("theme");
  const figure = wearing("figure");
  if (theme === "classic") delete document.documentElement.dataset.skin;
  else document.documentElement.dataset.skin = theme;
  if (figure === "white") delete document.documentElement.dataset.figure;
  else document.documentElement.dataset.figure = figure;
}

function renderShop() {
  applyWear();
  const wallet = coins();
  document.querySelector("#coin-count").textContent = wallet.toLocaleString();
  const xp = trophyStats().xp;
  document.querySelector("#coin-next").textContent = `Next coin in ${XP_PER_COIN - (xp % XP_PER_COIN)} XP · 10 XP = 1 coin`;

  document.querySelector("#shop-groups").innerHTML = SHOP_GROUPS.map((group) => {
    const items = SHOP.filter((item) => item.group === group.id).map((item) => {
      const owned = owns(item);
      const worn = wearing(item.group) === item.id;
      let button = `<button class="button" type="button" data-shop-buy="${item.group}:${item.id}" ${wallet < item.price ? "disabled" : ""}>🪙 ${item.price}</button>`;
      if (owned) button = `<button class="button button--quiet" type="button" data-shop-wear="${item.group}:${item.id}">Wear</button>`;
      if (worn) button = `<span class="shop-item__worn">✓ Wearing</span>`;
      const look = item.swatch ? `<span class="shop-item__swatch" style="background: ${item.swatch}"></span>` : `<span class="shop-item__icon">${item.icon}</span>`;
      return `
        <li class="shop-item ${worn ? "is-worn" : ""}">
          ${look}
          <span class="shop-item__name">${item.icon && item.swatch ? `${item.icon} ` : ""}${item.name}</span>
          ${button}
        </li>`;
    }).join("");
    return `
      <div class="shop-group">
        <h3>${group.name}</h3>
        <p class="shop-group__lead">${group.lead}</p>
        <ul class="shop-items">${items}</ul>
      </div>`;
  }).join("");
}

document.querySelector("#shop-groups").addEventListener("click", (event) => {
  const buy = event.target.closest("[data-shop-buy]");
  const wear = event.target.closest("[data-shop-wear]");
  const key = (buy || wear || {}).dataset;
  if (!key) return;
  const [group, ...rest] = (buy ? key.shopBuy : key.shopWear).split(":");
  const id = rest.join(":");
  const item = SHOP.find((i) => i.group === group && i.id === id);
  if (!item) return;

  if (buy) {
    if (coins() < item.price) {
      showToast(`You need ${item.price - coins()} more coins. Keep earning XP!`);
      return;
    }
    shopData.spent = (shopData.spent || 0) + item.price;
    shopData.owned = [...shopData.owned, `${group}:${id}`];
    showToast(`You bought ${item.name}! ${item.icon || "🎉"}`);
    sounds.fanfare();
  } else {
    sounds.done();
  }
  shopData.wear = { ...(shopData.wear || {}), [group]: id };
  saveJSON("levelUp.shop", shopData);
  render();
  checkAchievements(true);
  document.querySelector(`[data-shop-wear="${group}:${id}"], [data-shop-buy="${group}:${id}"]`)?.focus();
});

function renderPetAndShop() {
  renderShop(); // first, so the pet wears what you just picked
  renderPet();
}
