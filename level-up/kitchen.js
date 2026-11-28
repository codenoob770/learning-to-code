/* =============================================================
   kitchen.js: the Kitchen tab
   -------------------------------------------------------------
   1. Smoothie Lab: pick a base, fruits and boosters, and it
      invents a name, a color and a recipe for your creation.
   2. Recipe Book: every drink, meal and snack in Level Up (plus
      your smoothies), with search, favorites and "I made this!"
   3. Snack Swap: a game where you pick the snack that gives your
      body more fuel.

   This file loads before app.js, so it only uses app.js's
   functions inside its own functions, never right away.
   ============================================================= */


/* 1. SMOOTHIE LAB ------------------------------------------------------
   color: the color it adds to the smoothie (red, green, blue: 0 to 255)
   weight: how strongly that color shows
   amount: how much goes in the recipe
   good: what it's good for                                          */

const LAB = {
  base: [
    { id: "milk", icon: "🥛", name: "Milk", color: [245, 244, 238], weight: 1, amount: "1 cup milk (any kind)", good: "Milk has protein and calcium" },
    { id: "yogurt", icon: "🥄", name: "Yogurt", color: [248, 246, 240], weight: 1, amount: "¾ cup yogurt and a splash of milk", good: "Yogurt is packed with protein" },
    { id: "coconut", icon: "🥥", name: "Coconut water", color: [240, 236, 222], weight: 0.6, amount: "1 cup coconut water", good: "Coconut water helps you rehydrate after sports" },
    { id: "oj", icon: "🍊", name: "Orange juice", color: [255, 168, 40], weight: 1, amount: "1 cup orange juice", good: "Orange juice has vitamin C" },
    { id: "oatmilk", icon: "🌾", name: "Oat milk", color: [236, 222, 192], weight: 1, amount: "1 cup oat milk", good: "Oat milk is creamy and dairy-free" },
  ],
  fruits: [
    { id: "banana", icon: "🍌", name: "Banana", color: [250, 228, 140], weight: 1, amount: "1 banana (frozen makes it thick!)", good: "bananas have potassium for your muscles" },
    { id: "strawberry", icon: "🍓", name: "Strawberry", color: [232, 58, 82], weight: 1.4, amount: "½ cup strawberries", good: "strawberries have tons of vitamin C" },
    { id: "blueberry", icon: "🫐", name: "Blueberry", color: [84, 70, 160], weight: 1.5, amount: "½ cup blueberries", good: "blueberries have antioxidants that help your body recover" },
    { id: "mango", icon: "🥭", name: "Mango", color: [255, 182, 48], weight: 1.3, amount: "½ cup mango chunks", good: "mangoes have vitamin A for your eyes" },
    { id: "pineapple", icon: "🍍", name: "Pineapple", color: [250, 212, 70], weight: 1.1, amount: "½ cup pineapple chunks", good: "pineapple has vitamin C" },
    { id: "peach", icon: "🍑", name: "Peach", color: [255, 176, 120], weight: 1.1, amount: "½ cup peach slices", good: "peaches have vitamins A and C" },
    { id: "cherry", icon: "🍒", name: "Cherry", color: [168, 22, 52], weight: 1.5, amount: "½ cup pitted cherries", good: "cherries may help sore muscles feel better" },
    { id: "watermelon", icon: "🍉", name: "Watermelon", color: [248, 92, 104], weight: 1.2, amount: "1 cup watermelon chunks", good: "watermelon is about 92% water" },
    { id: "kiwi", icon: "🥝", name: "Kiwi", color: [150, 190, 60], weight: 1.2, amount: "1 kiwi, peeled", good: "kiwis have even more vitamin C than oranges" },
    { id: "apple", icon: "🍏", name: "Apple", color: [196, 222, 124], weight: 0.8, amount: "½ apple, chopped", good: "apples have fiber" },
  ],
  boosters: [
    { id: "spinach", icon: "🥬", name: "Spinach", color: [58, 150, 60], weight: 1.6, amount: "1 big handful of spinach", good: "spinach has iron (and you can't even taste it!)" },
    { id: "pb", icon: "🥜", name: "Peanut butter", color: [196, 146, 88], weight: 0.6, amount: "1 tbsp peanut butter", good: "peanut butter adds protein" },
    { id: "oats", icon: "🥣", name: "Oats", color: [222, 204, 170], weight: 0.3, amount: "2 tbsp oats", good: "oats give long-lasting energy" },
    { id: "honey", icon: "🍯", name: "Honey", color: [240, 190, 60], weight: 0.2, amount: "1 tsp honey", good: "a little honey makes it sweeter" },
    { id: "chia", icon: "🌱", name: "Chia seeds", color: [90, 90, 90], weight: 0.15, amount: "1 tsp chia seeds", good: "chia seeds have fiber and healthy fats" },
    { id: "cocoa", icon: "🍫", name: "Cocoa", color: [104, 66, 40], weight: 1.6, amount: "1 tbsp cocoa powder", good: "cocoa makes it chocolatey" },
    { id: "cinnamon", icon: "✨", name: "Cinnamon", color: [170, 100, 50], weight: 0.1, amount: "a pinch of cinnamon", good: "cinnamon adds flavor without sugar" },
    { id: "ice", icon: "🧊", name: "Ice", color: [255, 255, 255], weight: 0, amount: "a handful of ice", good: "ice makes it frosty" },
  ],
};

const LAB_LIMITS = { base: 1, fruits: 3, boosters: 2 };
let labPicks = { base: ["milk"], fruits: ["banana", "strawberry"], boosters: [] };

function labItem(id) {
  return [...LAB.base, ...LAB.fruits, ...LAB.boosters].find((item) => item.id === id);
}

// Mixes the colors of everything in it, like paint
function smoothieColor(ids) {
  let r = 0;
  let g = 0;
  let b = 0;
  let total = 0;
  for (const item of ids.map(labItem)) {
    r += item.color[0] * item.weight;
    g += item.color[1] * item.weight;
    b += item.color[2] * item.weight;
    total += item.weight;
  }
  if (total === 0) return "rgb(240, 240, 240)";
  return `rgb(${Math.round(r / total)}, ${Math.round(g / total)}, ${Math.round(b / total)})`;
}

// Makes up a name. The same mix always gets the same name.
function smoothieName(picks) {
  const all = [...picks.base, ...picks.fruits, ...picks.boosters];
  const luck = Math.floor(luckyNumber(all.slice().sort().join("+")) * 1000000); // a whole number from 0 to 999,999
  const adjectives = ["Turbo", "Mega", "Rocket", "Thunder", "Galaxy", "Ninja", "Champion", "Lightning", "Jungle", "Volcano"];
  const nouns = ["Blast", "Splash", "Power-Up", "Booster", "Smash", "Storm", "Fuel", "Kick", "Shake", "Wave"];
  let adjective = adjectives[luck % adjectives.length];
  const noun = nouns[Math.floor(luck / 7) % nouns.length];
  const tropical = all.filter((id) => ["mango", "pineapple", "coconut", "kiwi"].includes(id)).length;
  if (all.includes("spinach")) adjective = "Green Ninja";
  else if (all.includes("cocoa")) adjective = "Choco";
  else if (tropical >= 2) adjective = "Tropical";
  const fruit = picks.fruits.length ? labItem(picks.fruits[0]).name : "Mystery";
  return `${adjective} ${fruit} ${noun}`;
}

// A full recipe (like the ones in plan.js) for a mix
function smoothieRecipe(picks) {
  const items = [...picks.base, ...picks.fruits, ...picks.boosters].map(labItem);
  // Like "Milk has protein and calcium, bananas have potassium for your muscles."
  const why = `${items.map((item) => item.good).join(", ")}.`;
  return {
    name: smoothieName(picks),
    minutes: 5,
    ingredients: items.map((item) => item.amount),
    steps: ["Put everything in a blender (ask an adult to help).", "Blend until smooth. Too thick? Add a splash more liquid."],
    why,
    color: smoothieColor(items.map((item) => item.id)),
  };
}

function cupSVG(color) {
  return `
    <svg class="cup" viewBox="0 0 80 110" aria-hidden="true">
      <path class="cup__straw" d="M50 4 L44 40"/>
      <path class="cup__drink" d="M14 34 L66 34 L59 102 L21 102 Z" style="fill: ${color}"/>
      <path class="cup__glass" d="M10 26 L70 26 L61 106 L19 106 Z"/>
      <path class="cup__shine" d="M22 42 L26 92"/>
    </svg>`;
}

function renderLab() {
  const groups = [
    ["base", "1. Pick a base"],
    ["fruits", "2. Pick 1 to 3 fruits"],
    ["boosters", "3. Add up to 2 boosters (optional)"],
  ];
  document.querySelector("#lab-picks").innerHTML = groups.map(([group, title]) => `
    <div class="lab-group">
      <p class="lab-group__title">${title}</p>
      <div class="lab-chips" role="group" aria-label="${title}">
        ${LAB[group].map((item) => `
          <button class="lab-chip" type="button" data-lab-group="${group}" data-lab-id="${item.id}" aria-pressed="${labPicks[group].includes(item.id)}">
            <span aria-hidden="true">${item.icon}</span> ${item.name}
          </button>`).join("")}
      </div>
    </div>`).join("");

  const result = document.querySelector("#lab-result");
  if (labPicks.fruits.length === 0) {
    result.innerHTML = `${cupSVG("rgb(60, 70, 95)")}<p class="lab-name">Pick at least one fruit!</p>`;
    return;
  }
  const recipe = smoothieRecipe(labPicks);
  const saved = recipeBook.smoothies.some((s) => s.name === recipe.name);
  result.innerHTML = `
    ${cupSVG(recipe.color)}
    <p class="lab-name">${recipe.name}</p>
    <ul class="lab-recipe">${recipe.ingredients.map((i) => `<li>${i}</li>`).join("")}</ul>
    <p class="lab-why">${recipe.why}</p>
    <button class="button" type="button" data-lab-save ${saved ? "disabled" : ""}>${saved ? "✓ In your recipe book" : "📖 Save to my recipe book"}</button>`;
}

document.querySelector("#lab-picks").addEventListener("click", (event) => {
  const chip = event.target.closest("[data-lab-id]");
  if (!chip) return;
  const group = chip.dataset.labGroup;
  const id = chip.dataset.labId;
  const list = labPicks[group];
  if (group === "base") {
    labPicks.base = [id];
  } else if (list.includes(id)) {
    labPicks[group] = list.filter((x) => x !== id);
  } else if (list.length < LAB_LIMITS[group]) {
    list.push(id);
  } else {
    showToast(`That's the most ${group} you can add. Tap one to take it out first.`);
    return;
  }
  sounds.rate(5);
  renderLab();
  document.querySelector(`[data-lab-id="${id}"]`).focus();
});

document.querySelector("#lab-result").addEventListener("click", (event) => {
  if (!event.target.closest("[data-lab-save]")) return;
  const recipe = smoothieRecipe(labPicks);
  recipeBook.smoothies.push({ id: makeId(), name: recipe.name, picks: JSON.parse(JSON.stringify(labPicks)) });
  saveJSON("levelUp.recipes", recipeBook);
  logActivity("smoothie", { name: recipe.name });
  sounds.done();
  showToast(`${recipe.name} saved! Find it in your recipe book. 📖`);
  render();
  checkAchievements(true);
});


/* 2. RECIPE BOOK -------------------------------------------------------- */

let bookFilter = "all";

const BOOK_FILTERS = [
  ["all", "All"], ["drink", "Drinks"], ["breakfast", "Breakfast"], ["lunch", "Lunch"],
  ["dinner", "Dinner"], ["snack", "Snacks"], ["mine", "My smoothies"], ["fav", "⭐ Favorites"],
];

// Every recipe in one list
function bookRecipes() {
  const tag = (list, type, typeName) => list.map((recipe) => ({ ...recipe, type, typeName }));
  return [
    ...tag(DRINKS, "drink", "Drink"),
    ...tag(BREAKFASTS, "breakfast", "Breakfast"),
    ...tag(LUNCHES, "lunch", "Lunch"),
    ...tag(DINNERS, "dinner", "Dinner"),
    ...SNACKS.map((snack) => ({ name: snack.name, minutes: 5, ingredients: [snack.what], steps: [], why: snack.why, type: "snack", typeName: "Snack" })),
    ...recipeBook.smoothies.map((mine) => ({ ...smoothieRecipe(mine.picks), name: mine.name, type: "mine", typeName: "My smoothie", id: mine.id })),
  ];
}

function timesMade(name) {
  return logOf("made").filter((entry) => entry.name === name).length;
}

function renderBook() {
  const list = document.querySelector("#book-list");
  const search = document.querySelector("#book-search").value.trim().toLowerCase();
  const openNames = [...list.querySelectorAll("details[open]")].map((d) => d.dataset.name);

  document.querySelector("#book-filters").innerHTML = BOOK_FILTERS.map(([id, name]) => `
    <button class="pick" type="button" data-book-filter="${id}" aria-pressed="${id === bookFilter}">${name}</button>`).join("");

  const recipes = bookRecipes().filter((recipe) => {
    if (bookFilter === "fav" && !recipeBook.fav.includes(recipe.name)) return false;
    if (bookFilter !== "all" && bookFilter !== "fav" && recipe.type !== bookFilter) return false;
    if (search && !`${recipe.name} ${recipe.ingredients.join(" ")}`.toLowerCase().includes(search)) return false;
    return true;
  });

  document.querySelector("#book-count").textContent = recipes.length === 1 ? "1 recipe" : `${recipes.length} recipes`;
  if (recipes.length === 0) {
    list.innerHTML = `<p class="book-empty">${bookFilter === "fav" ? "No favorites yet. Open a recipe and tap ⭐ to add one!" : bookFilter === "mine" ? "No smoothies yet. Invent one in the Smoothie Lab!" : "Nothing matches that search."}</p>`;
    return;
  }

  list.innerHTML = recipes.map((recipe) => {
    const fav = recipeBook.fav.includes(recipe.name);
    const made = timesMade(recipe.name);
    return `
      <details class="book-item" data-name="${escapeHTML(recipe.name)}" ${openNames.includes(recipe.name) ? "open" : ""}>
        <summary>
          <span class="book-item__type">${recipe.typeName}</span>
          <span class="book-item__name">${fav ? "⭐ " : ""}${escapeHTML(recipe.name)}</span>
          ${made ? `<span class="book-item__made">Made ${made}×</span>` : ""}
        </summary>
        <div class="book-item__body">
          <ul>${recipe.ingredients.map((i) => `<li>${i}</li>`).join("")}</ul>
          ${recipe.steps.length ? `<ol>${recipe.steps.map((s) => `<li>${s}</li>`).join("")}</ol>` : ""}
          <p class="recipe__why"><strong>Why it's good:</strong> ${recipe.why}</p>
          <div class="book-item__buttons">
            <button class="text-button" type="button" data-book-fav="${escapeHTML(recipe.name)}">${fav ? "★ Favorite" : "☆ Add to favorites"}</button>
            <button class="text-button" type="button" data-book-made="${escapeHTML(recipe.name)}">🍳 I made this! (+${XP_RULES.made} XP)</button>
            ${recipe.type === "mine" ? `<button class="text-button" type="button" data-book-delete="${recipe.id}">Delete</button>` : ""}
          </div>
        </div>
      </details>`;
  }).join("");
}

document.querySelector("#book-search").addEventListener("input", renderBook);

document.querySelector("#book").addEventListener("click", (event) => {
  const filter = event.target.closest("[data-book-filter]");
  if (filter) {
    bookFilter = filter.dataset.bookFilter;
    renderBook();
    document.querySelector(`[data-book-filter="${bookFilter}"]`).focus();
    return;
  }

  const fav = event.target.closest("[data-book-fav]");
  if (fav) {
    const name = fav.dataset.bookFav;
    recipeBook.fav = recipeBook.fav.includes(name) ? recipeBook.fav.filter((n) => n !== name) : [...recipeBook.fav, name];
    saveJSON("levelUp.recipes", recipeBook);
    renderBook();
    return;
  }

  const made = event.target.closest("[data-book-made]");
  if (made) {
    const xpBefore = trophyStats().xp;
    logActivity("made", { name: made.dataset.bookMade });
    const xpGained = trophyStats().xp - xpBefore;
    sounds.done();
    showToast(xpGained > 0 ? `Chef mode! +${xpGained} XP 🍳` : "Yum! (No more chef XP today, but nice cooking!)");
    render();
    checkAchievements(true);
    return;
  }

  const remove = event.target.closest("[data-book-delete]");
  if (remove) {
    recipeBook.smoothies = recipeBook.smoothies.filter((s) => s.id !== remove.dataset.bookDelete);
    saveJSON("levelUp.recipes", recipeBook);
    render();
    showToast("Smoothie deleted.");
  }
});


/* 3. SNACK SWAP --------------------------------------------------------- */

const SNACK_PAIRS = [
  { good: "🍎 Apple slices with peanut butter", other: "🍫 A candy bar", why: "The apple and peanut butter have fiber and protein, so they keep you full. The candy bar is mostly sugar." },
  { good: "💧 Water", other: "🥤 Soda", why: "A can of soda has about 9 teaspoons of sugar! Water hydrates you with none." },
  { good: "🍗 Grilled chicken", other: "🍟 Fried chicken nuggets", why: "Grilled chicken has the same protein with much less grease." },
  { good: "🫐 Yogurt with berries", other: "🍨 Ice cream", why: "Yogurt has protein, and the berries add vitamins, without all the extra sugar." },
  { good: "🍿 Plain popcorn", other: "🥔 Potato chips", why: "Popcorn is a whole grain with lots of fiber!" },
  { good: "🥣 Oatmeal", other: "🍭 Sugary cereal", why: "Oatmeal keeps you full all morning. Sugary cereal burns off fast and leaves you hungry." },
  { good: "🌾 Whole-grain bread", other: "🍞 White bread", why: "Whole grains keep all their fiber and vitamins." },
  { good: "🥕 Carrots with hummus", other: "🧀 Cheese puffs", why: "Carrots and hummus give you crunch plus vitamins, fiber and protein." },
  { good: "🍌 A banana", other: "🍬 Gummy fruit snacks", why: "Fruit snacks are mostly sugar. A banana is real fruit, with potassium for your muscles." },
  { good: "🥜 Trail mix (nuts and raisins)", other: "🍪 Cookies", why: "Nuts have protein and healthy fats for long-lasting energy." },
  { good: "🍠 Baked sweet potato fries", other: "🍟 Deep-fried french fries", why: "Baking uses way less oil, and sweet potatoes have lots of vitamin A." },
  { good: "🍇 Frozen grapes", other: "🍦 A sugary popsicle", why: "Frozen grapes are a cold, sweet treat that's real fruit!" },
  { good: "🥪 Turkey sandwich on whole wheat", other: "🌭 A hot dog", why: "Hot dogs are a processed meat with lots of salt. Turkey is a leaner protein." },
  { good: "🍋 Water with lemon", other: "🧃 A sports drink (when you're not playing)", why: "Sports drinks are for long, sweaty games. The rest of the time, water is best." },
  { good: "🍳 Scrambled eggs", other: "🍩 A donut", why: "Eggs give you protein for your muscles and keep you full until lunch." },
  { good: "🍊 An orange", other: "🥤 Orange soda", why: "A real orange has vitamin C and fiber. Orange soda is sugar water with no fruit!" },
  { good: "🍓 A homemade fruit smoothie", other: "🥤 A milkshake", why: "A homemade smoothie is mostly fruit. A milkshake is mostly ice cream and sugar." },
  { good: "🧀 A cheese stick", other: "🌮 Nachos with cheese sauce", why: "A cheese stick has protein and calcium, without the greasy chips." },
  { good: "🍏 A whole apple", other: "🧃 Apple juice", why: "The whole fruit has fiber that fills you up. Juice is mostly the sugar." },
  { good: "🥜 Peanuts", other: "🍬 Chocolate candies", why: "Peanuts have protein and healthy fats." },
  { good: "🌱 Edamame (soybeans)", other: "🥨 Pretzels", why: "Edamame is packed with protein and fiber." },
  { good: "🍚 Brown rice", other: "🍚 White rice", why: "Brown rice keeps its fiber, so it gives longer-lasting energy." },
];

const SNACK_ROUNDS = 10;
let snackGame = null; // the game you're playing, or null
let snackEnd = null;  // the score screen, until you tap Play again

function snackArea() {
  return document.querySelector("#snack-area");
}

function renderSnacks() {
  if (snackGame) return; // don't interrupt a game
  if (snackEnd) {
    snackArea().innerHTML = snackEnd;
    return;
  }
  const best = Math.max(0, ...logOf("snack").map((e) => e.r));
  snackArea().innerHTML = `
    <p class="panel__lead">Two snacks: tap the one that gives your body more fuel. Both are fine once in a while, but one is a better everyday pick!</p>
    <button class="button" type="button" data-snack="start">🥕 Play (${SNACK_ROUNDS} rounds)</button>
    ${best ? `<p class="deck-best">Best score: ${best}/${SNACK_ROUNDS}</p>` : ""}`;
}

function startSnacks() {
  snackEnd = null;
  snackGame = {
    rounds: quizShuffle(SNACK_PAIRS).slice(0, SNACK_ROUNDS).map((pair) => ({ ...pair, goodFirst: Math.random() < 0.5 })),
    index: 0,
    right: 0,
    picked: null,
  };
  drawSnackRound();
}

function drawSnackRound() {
  const round = snackGame.rounds[snackGame.index];
  const options = round.goodFirst ? [round.good, round.other] : [round.other, round.good];
  const answered = snackGame.picked !== null;
  const buttons = options.map((option) => {
    let state = "";
    if (answered && option === round.good) state = "is-right";
    else if (answered && option === snackGame.picked) state = "is-wrong";
    const [icon, ...words] = option.split(" ");
    return `
      <button class="snack-choice ${state}" type="button" data-snack-pick="${escapeHTML(option)}" ${answered ? "disabled" : ""}>
        <span class="snack-choice__icon" aria-hidden="true">${icon}</span>
        <span>${words.join(" ")}</span>
      </button>`;
  }).join(`<span class="snack-vs" aria-hidden="true">vs</span>`);

  const last = snackGame.index === snackGame.rounds.length - 1;
  snackArea().innerHTML = `
    <p class="quiz-where">Round ${snackGame.index + 1} of ${snackGame.rounds.length} · ✓ ${snackGame.right}</p>
    <div class="snack-choices">${buttons}</div>
    <div class="quiz-feedback" aria-live="polite">${answered ? `
      <div class="quiz-result ${snackGame.picked === round.good ? "is-right" : "is-wrong"}">
        <p class="quiz-result__title">${snackGame.picked === round.good ? "✅ Good pick!" : "❌ The better pick is the other one."}</p>
        <p>${round.why}</p>
      </div>
      <button class="button quiz-next" type="button" data-snack="next">${last ? "See my score" : "Next →"}</button>` : ""}
    </div>`;
}

document.querySelector("#snack-area").addEventListener("click", (event) => {
  const pick = event.target.closest("[data-snack-pick]");
  if (pick && snackGame && snackGame.picked === null) {
    const round = snackGame.rounds[snackGame.index];
    snackGame.picked = pick.dataset.snackPick;
    if (snackGame.picked === round.good) {
      snackGame.right += 1;
      sounds.rate(10);
    } else {
      sounds.down();
    }
    drawSnackRound();
    snackArea().querySelector(".quiz-next").focus();
    return;
  }

  const button = event.target.closest("[data-snack]");
  if (!button) return;
  if (button.dataset.snack === "start") startSnacks();
  if (button.dataset.snack === "next" && snackGame) {
    snackGame.index += 1;
    snackGame.picked = null;
    if (snackGame.index < snackGame.rounds.length) {
      drawSnackRound();
      snackArea().querySelector(".snack-choice").focus();
      return;
    }
    // Game over
    const right = snackGame.right;
    const xpBefore = trophyStats().xp;
    logActivity("snack", { r: right, n: SNACK_ROUNDS });
    const xpGained = trophyStats().xp - xpBefore;
    snackGame = null;
    snackEnd = `
      <div class="arcade-end">
        <p class="arcade-end__big">🥕 ${right}/${SNACK_ROUNDS}</p>
        <p>${right === SNACK_ROUNDS ? "Perfect! You're a nutrition pro!" : right >= 7 ? "Great choices!" : "Now you know a few new swaps. Try again!"}</p>
        <p class="arcade-end__xp">${xpGained > 0 ? `+${xpGained} XP` : "No more Snack Swap XP today (3 games a day)."}</p>
        <button class="button" type="button" data-snack="again">Play again</button>
      </div>`;
    sounds.finish();
    render();
    snackArea().querySelector("[data-snack='again']").focus();
    checkAchievements(true);
  }
  if (button.dataset.snack === "again") {
    snackEnd = null;
    renderSnacks();
    snackArea().querySelector("[data-snack='start']").focus();
  }
});

function renderKitchen() {
  renderLab();
  renderBook();
  renderSnacks();
}
