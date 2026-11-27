/* =============================================================
   kitchen-plus.js: more for the Kitchen tab
   -------------------------------------------------------------
   1. Build-a-Plate: make a balanced plate (like MyPlate)
   2. Eat the Rainbow: fruits and veggies of every color
   3. Kitchen Skills: cooking lessons (with a grown-up!)
   4. Sugar Detective: how much sugar is in that?
   5. Kitchen Math: fractions in recipes (5th-grade math)
   6. Food Passport: try foods from around the world
   7. Game Day Fuel: what to eat before, during and after sports
   8. Plugging in (XP, badges, saved data: see hooks.js)

   This file loads before app.js, so it only uses app.js's
   functions inside its own functions, never right away.
   ============================================================= */


/* 1. BUILD-A-PLATE -------------------------------------------------------
   MyPlate (from the U.S. Department of Agriculture) says: make half
   your plate fruits and vegetables, add grains and protein, and have
   some dairy on the side. "Sometimes foods" are treats.             */

const PLATE_GROUPS = {
  fruit: { name: "Fruits", color: "#e2443b" },
  veg: { name: "Veggies", color: "#3aa655" },
  grain: { name: "Grains", color: "#f39a2b" },
  protein: { name: "Protein", color: "#8a5cc9" },
  dairy: { name: "Dairy", color: "#3f7fe0" },
  treat: { name: "Sometimes foods", color: "#8792b2" },
};

const PLATE_FOODS = [
  { id: "apple", icon: "🍎", name: "Apple slices", group: "fruit" },
  { id: "banana", icon: "🍌", name: "Banana", group: "fruit" },
  { id: "berries", icon: "🍓", name: "Strawberries", group: "fruit" },
  { id: "orange", icon: "🍊", name: "Orange", group: "fruit" },
  { id: "grapes", icon: "🍇", name: "Grapes", group: "fruit" },
  { id: "broccoli", icon: "🥦", name: "Broccoli", group: "veg" },
  { id: "carrots", icon: "🥕", name: "Carrots", group: "veg" },
  { id: "salad", icon: "🥗", name: "Salad", group: "veg" },
  { id: "corn", icon: "🌽", name: "Corn", group: "veg" },
  { id: "peppers", icon: "🫑", name: "Peppers", group: "veg" },
  { id: "brownRice", icon: "🍚", name: "Brown rice", group: "grain", whole: true },
  { id: "pasta", icon: "🍝", name: "Whole-wheat pasta", group: "grain", whole: true },
  { id: "oatmeal", icon: "🥣", name: "Oatmeal", group: "grain", whole: true },
  { id: "whiteBread", icon: "🍞", name: "White bread", group: "grain" },
  { id: "chicken", icon: "🍗", name: "Chicken", group: "protein" },
  { id: "fish", icon: "🐟", name: "Fish", group: "protein" },
  { id: "eggs", icon: "🥚", name: "Eggs", group: "protein" },
  { id: "beans", icon: "🫘", name: "Beans", group: "protein" },
  { id: "pb", icon: "🥜", name: "Peanut butter", group: "protein" },
  { id: "milk", icon: "🥛", name: "Milk", group: "dairy" },
  { id: "cheese", icon: "🧀", name: "Cheese", group: "dairy" },
  { id: "yogurt", icon: "🥄", name: "Yogurt", group: "dairy" },
  { id: "fries", icon: "🍟", name: "Fries", group: "treat" },
  { id: "donut", icon: "🍩", name: "Donut", group: "treat" },
  { id: "soda", icon: "🥤", name: "Soda", group: "treat" },
  { id: "cookies", icon: "🍪", name: "Cookies", group: "treat" },
  { id: "candy", icon: "🍬", name: "Candy", group: "treat" },
];
const PLATE_MEALS = ["breakfast", "lunch before a soccer game", "dinner after practice", "a weekend lunch"];
const PLATE_MAX = 8;

let plate = { foods: [], checked: null, meal: 0 };

function plateFood(id) {
  return PLATE_FOODS.find((food) => food.id === id);
}

// Grades your plate: a list of checks, and 1 to 3 stars
function gradePlate(ids) {
  const foods = ids.map(plateFood);
  const has = (group) => foods.some((food) => food.group === group);
  const count = (group) => foods.filter((food) => food.group === group).length;
  const treats = count("treat");
  const checks = [
    { ok: has("fruit"), text: has("fruit") ? "Fruit ✓" : "Add a fruit" },
    { ok: has("veg"), text: has("veg") ? "Veggies ✓" : "Add a vegetable" },
    { ok: has("grain"), text: has("grain") ? "Grains ✓" : "Add a grain (rice, pasta, bread or oatmeal)" },
    { ok: has("protein"), text: has("protein") ? "Protein ✓" : "Add a protein, for your muscles" },
    { ok: has("dairy"), text: has("dairy") ? "Dairy ✓" : "Add some dairy, like milk or yogurt, for strong bones" },
    { ok: count("fruit") + count("veg") >= count("grain") + count("protein") && count("fruit") + count("veg") > 0, text: "Half your plate fruits and veggies" },
    { ok: treats <= 1, text: treats === 0 ? "No sometimes foods. Nice!" : treats === 1 ? "One sometimes food is OK once in a while" : "Too many sometimes foods" },
  ];
  const groups = ["fruit", "veg", "grain", "protein", "dairy"].filter(has).length;
  let stars = 1;
  if (groups >= 4) stars = 2;
  if (checks.every((check) => check.ok)) stars = 3;
  const wholeTip = has("grain") && !foods.some((food) => food.whole)
    ? "💡 Tip: whole grains (like brown rice or oatmeal) keep you full longer than white bread."
    : "";
  return { checks, stars, wholeTip };
}

function plateSVG() {
  // Where foods sit in each section of the plate
  const spots = {
    fruit: [[-52, -40], [-30, -66], [-74, -14]],
    veg: [[-52, 40], [-30, 66], [-74, 14]],
    grain: [[52, -40], [30, -66], [74, -14]],
    protein: [[52, 40], [30, 66], [74, 14]],
    dairy: [[150, -18], [150, 18], [150, 50]],
    treat: [[-150, -30], [-150, 10], [-150, 50]],
  };
  const placed = {};
  const items = plate.foods.map((id) => {
    const food = plateFood(id);
    const n = placed[food.group] || 0;
    placed[food.group] = n + 1;
    const spot = spots[food.group][n % 3];
    return `<text x="${spot[0]}" y="${spot[1] + 8}" text-anchor="middle" class="plate-food">${food.icon}</text>`;
  }).join("");
  const label = (x, y, group) => `<text x="${x}" y="${y}" text-anchor="middle" class="plate-label" fill="${PLATE_GROUPS[group].color}">${PLATE_GROUPS[group].name}</text>`;
  return `
    <svg class="plate-svg" viewBox="-185 -110 370 220" role="img" aria-label="Your plate">
      <circle r="100" class="plate-rim"/>
      <path d="M0 -92 V92 M-92 0 H92" class="plate-lines"/>
      ${label(-46, -8, "fruit")}${label(-46, 18, "veg")}${label(46, -8, "grain")}${label(46, 18, "protein")}
      <rect x="126" y="-50" width="48" height="110" rx="12" class="plate-cup"/>
      ${label(150, -60, "dairy")}
      <text x="-150" y="-62" text-anchor="middle" class="plate-label" fill="${PLATE_GROUPS.treat.color}">Sometimes</text>
      ${items}
    </svg>`;
}

function drawPlate() {
  const area = document.querySelector("#plate-area");
  const tray = PLATE_FOODS.map((food) => `
    <button class="plate-chip ${plate.foods.includes(food.id) ? "is-on" : ""}" type="button" data-plate-food="${food.id}" aria-pressed="${plate.foods.includes(food.id)}">
      <span aria-hidden="true">${food.icon}</span> ${food.name}
    </button>`).join("");
  let result = "";
  if (plate.checked) {
    const grade = gradePlate(plate.foods);
    result = `
      <div class="plate-result">
        <p class="plate-stars" aria-label="${grade.stars} of 3 stars">${"⭐".repeat(grade.stars)}${"☆".repeat(3 - grade.stars)}</p>
        <ul class="plate-checks">${grade.checks.map((check) => `<li class="${check.ok ? "is-ok" : "is-miss"}">${check.ok ? "✅" : "➕"} ${check.text}</li>`).join("")}</ul>
        ${grade.wholeTip ? `<p class="quiz-total">${grade.wholeTip}</p>` : ""}
      </div>`;
  }
  area.innerHTML = `
    <p class="plate-task">Make a healthy plate for <strong>${PLATE_MEALS[plate.meal]}</strong>. Tap foods to add them (up to ${PLATE_MAX}).</p>
    <div class="plate-layout">
      <div class="plate-picture">${plateSVG()}</div>
      <div class="plate-side">
        <div class="brain-start__buttons">
          <button class="button" type="button" data-plate="check" ${plate.foods.length ? "" : "disabled"}>Check my plate</button>
          <button class="button button--quiet" type="button" data-plate="clear">Clear</button>
          <button class="text-button" type="button" data-plate="meal">🎲 New meal</button>
        </div>
        ${result}
      </div>
    </div>
    <div class="plate-tray" role="group" aria-label="Foods">${tray}</div>`;
}

document.querySelector("#plate-area").addEventListener("click", (event) => {
  const chip = event.target.closest("[data-plate-food]");
  if (chip) {
    const id = chip.dataset.plateFood;
    if (plate.foods.includes(id)) plate.foods = plate.foods.filter((food) => food !== id);
    else if (plate.foods.length >= PLATE_MAX) {
      showToast(`Your plate is full! (${PLATE_MAX} foods max)`);
      return;
    } else plate.foods.push(id);
    plate.checked = null;
    sounds.count();
    drawPlate();
    document.querySelector(`[data-plate-food="${id}"]`)?.focus();
    return;
  }
  const button = event.target.closest("[data-plate]");
  if (!button) return;
  const action = button.dataset.plate;
  if (action === "check") {
    plate.checked = true;
    const grade = gradePlate(plate.foods);
    if (grade.stars === 3) {
      logActivity("plate", { m: plate.meal, n: plate.foods.length });
      sounds.fanfare();
      confetti();
      render();
      checkAchievements(true);
    } else {
      sounds.up();
    }
  }
  if (action === "clear") {
    plate.foods = [];
    plate.checked = null;
  }
  if (action === "meal") {
    plate = { foods: [], checked: null, meal: (plate.meal + 1) % PLATE_MEALS.length };
  }
  drawPlate();
});


/* 2. EAT THE RAINBOW ------------------------------------------------------
   Different colors of fruits and veggies have different vitamins, so
   eating lots of colors gives your body a little of everything. Tap a
   color each time you eat one today. 5 colors = a Rainbow Day!      */

const RAINBOW = [
  { id: "red", name: "Red", icon: "🍓", color: "#e2443b", foods: "strawberries, tomatoes, cherries, watermelon, red peppers" },
  { id: "orange", name: "Orange", icon: "🥕", color: "#f39a2b", foods: "carrots, oranges, mango, sweet potatoes, cantaloupe" },
  { id: "yellow", name: "Yellow", icon: "🍌", color: "#f7d531", foods: "bananas, corn, pineapple, yellow peppers, lemons" },
  { id: "green", name: "Green", icon: "🥦", color: "#3aa655", foods: "broccoli, kiwi, spinach, peas, cucumbers, green apples" },
  { id: "purple", name: "Blue & purple", icon: "🫐", color: "#8a5cc9", foods: "blueberries, grapes, blackberries, eggplant, purple cabbage" },
  { id: "white", name: "White & brown", icon: "🍄", color: "#c9b79c", foods: "cauliflower, mushrooms, onions, potatoes, pears" },
];
const RAINBOW_GOAL = 5;

let rainbowData = {}; // { "2026-11-27": ["red", "green"] } (saved)

function rainbowOn(key) {
  return Array.isArray(rainbowData[key]) ? rainbowData[key] : [];
}

function drawRainbow() {
  const area = document.querySelector("#rainbow-area");
  const todayKey = toKey(today);
  const eaten = rainbowOn(todayKey);
  const arcs = RAINBOW.map((color, i) => {
    const r = 90 - i * 12;
    return `<path d="M${-r} 0 A${r} ${r} 0 0 1 ${r} 0" class="rainbow-arc" stroke="${color.color}" style="opacity: ${eaten.includes(color.id) ? 1 : 0.15}"/>`;
  }).join("");
  const week = [];
  for (let i = 6; i >= 0; i--) {
    const date = addDays(today, -i);
    const count = rainbowOn(toKey(date)).length;
    week.push(`<li class="rainbow-day ${count >= RAINBOW_GOAL ? "is-rainbow" : ""}"><span>${date.toLocaleDateString("en-US", { weekday: "short" })}</span><strong>${count >= RAINBOW_GOAL ? "🌈" : count}</strong></li>`);
  }
  area.innerHTML = `
    <svg class="rainbow-svg" viewBox="-100 -100 200 108" aria-hidden="true">${arcs}</svg>
    <p class="rainbow-count">${eaten.length >= RAINBOW_GOAL ? "🌈 RAINBOW DAY! Amazing eating!" : `${eaten.length} of ${RAINBOW_GOAL} colors today`}</p>
    <div class="rainbow-colors">${RAINBOW.map((color) => `
      <button class="rainbow-color ${eaten.includes(color.id) ? "is-on" : ""}" type="button" data-rainbow="${color.id}" aria-pressed="${eaten.includes(color.id)}" style="--swatch: ${color.color}">
        <span class="rainbow-color__icon" aria-hidden="true">${color.icon}</span>
        <span class="rainbow-color__name">${color.name}</span>
        <span class="rainbow-color__foods">${color.foods}</span>
      </button>`).join("")}
    </div>
    <ul class="rainbow-week" aria-label="Colors each day this week">${week.join("")}</ul>`;
}

document.querySelector("#rainbow-area").addEventListener("click", (event) => {
  const button = event.target.closest("[data-rainbow]");
  if (!button) return;
  const key = toKey(today);
  const id = button.dataset.rainbow;
  const eaten = new Set(rainbowOn(key));
  if (eaten.has(id)) eaten.delete(id);
  else eaten.add(id);
  rainbowData = { ...rainbowData, [key]: [...eaten] };
  saveJSON("levelUp.rainbow", rainbowData);
  if (eaten.size >= RAINBOW_GOAL && !logOf("rainbow").some((entry) => entry.d === key)) {
    logActivity("rainbow");
    sounds.fanfare();
    confetti();
  } else if (eaten.has(id)) {
    sounds.count();
  }
  render();
  checkAchievements(true);
  document.querySelector(`[data-rainbow="${id}"]`)?.focus();
});


/* 3. KITCHEN SKILLS --------------------------------------------------------
   Cooking lessons, like the Training tab's. "Teach me" has the voice
   coach read the steps. 👨‍🍳 = do this one with a grown-up.          */

const KITCHEN_SKILLS = [
  { id: "wash-hands", icon: "🧼", name: "Wash your hands like a chef", level: "Easy",
    steps: ["Wet your hands with warm water.", "Add soap and scrub everywhere: palms, backs, between your fingers and under your nails.", "Scrub for 20 seconds. That's singing Happy Birthday twice!", "Rinse, then dry with a clean towel."],
    tip: "Wash again after touching raw meat or eggs, so germs don't spread." },
  { id: "wash-produce", icon: "🥕", name: "Wash fruits and veggies", level: "Easy",
    steps: ["Rinse each fruit or veggie under cool running water.", "Rub it with your hands while you rinse. No soap needed!", "Use a vegetable brush for firm things like potatoes and carrots.", "Dry it with a clean towel."],
    tip: "Wash even the ones you peel, like oranges, because your knife or fingers carry dirt from the outside in." },
  { id: "measure", icon: "🥄", name: "Measure like a pro", level: "Easy",
    steps: ["For flour or sugar, spoon it into the measuring cup until it's heaped up.", "Slide the back of a butter knife across the top to make it flat. That's called leveling.", "For milk or water, use a clear measuring cup with lines.", "Set it on the counter and bend down so your eyes are level with the line."],
    tip: "There are 16 tablespoons in 1 cup, and 3 teaspoons in 1 tablespoon." },
  { id: "crack-egg", icon: "🥚", name: "Crack an egg", level: "Easy",
    steps: ["Tap the middle of the egg firmly on the flat counter (not the bowl edge).", "Put your thumbs in the crack and gently pull the shell apart over a small bowl.", "Got shell in it? Scoop it out with a bigger piece of shell. It works like a magnet!", "Wash your hands after touching raw egg."],
    tip: "Crack eggs into a small bowl first, so a bad crack doesn't ruin the whole recipe." },
  { id: "peel", icon: "🥒", name: "Use a peeler", level: "Medium", grownUp: true,
    steps: ["Hold the veggie on a cutting board, with your fingers away from the end you're peeling.", "Peel AWAY from your body, in long smooth strokes.", "Turn the veggie and keep going until it's all peeled.", "Peel the last bit flat on the board instead of holding it in your hand."],
    tip: "Peelers are sharp! Go slowly, and keep your fingers out of the way." },
  { id: "butter-knife", icon: "🍌", name: "Cut soft foods safely", level: "Medium", grownUp: true,
    steps: ["Use a butter knife and soft foods first: bananas, strawberries or cooked potatoes.", "Put the food on a cutting board. A damp towel underneath stops the board from sliding.", "Make a \"claw\" with your other hand: tuck your fingertips in, so your knuckles guide the knife.", "Cut slowly, moving your claw hand back a little after each slice."],
    tip: "Never try to catch a falling knife. Just step back and let it drop." },
  { id: "parfait", icon: "🍨", name: "Build a yogurt parfait", level: "Easy",
    steps: ["Spoon some yogurt into the bottom of a glass.", "Add a layer of berries or chopped fruit.", "Add a sprinkle of granola or oats.", "Repeat the layers until the glass is full. Top it with fruit!"],
    tip: "Greek yogurt has about twice the protein of regular yogurt, which is great after a workout." },
  { id: "overnight-oats", icon: "🫙", name: "Make overnight oats", level: "Easy",
    steps: ["In a jar, mix ½ cup oats with ½ cup milk.", "Add 2 tablespoons of yogurt and a little cinnamon.", "Stir, put the lid on, and put it in the fridge overnight.", "In the morning, top it with fruit or a spoon of peanut butter. Breakfast is ready!"],
    tip: "Make 3 jars on Sunday, and breakfast is done for half the week." },
  { id: "wrap", icon: "🌯", name: "Roll a wrap", level: "Easy",
    steps: ["Lay a tortilla flat on a plate.", "Put your fillings in a line in the middle: turkey or beans, cheese, lettuce and veggies. Don't overfill it!", "Fold the bottom up over the fillings, then fold in both sides.", "Roll it up tight, then cut it in half (a grown-up can help)."],
    tip: "A whole-wheat tortilla adds fiber, so it keeps you full until practice." },
  { id: "scrambled-eggs", icon: "🍳", name: "Scramble eggs", level: "Hard", grownUp: true,
    steps: ["Crack 2 eggs into a bowl, add a splash of milk, and whisk with a fork until it's all yellow.", "With a grown-up, heat a pan on medium-low with a little butter or oil.", "Pour in the eggs. Wait a few seconds, then gently push them across the pan with a spatula.", "Keep pushing slowly until there's no runny egg left, then turn off the stove and serve!"],
    tip: "Low heat makes soft, fluffy eggs. High heat makes them rubbery." },
];

let kitchenSkills = new Set(); // the skills you've learned (saved)
let skillOpen = KITCHEN_SKILLS[0].id;

function skillPlan(skill) {
  const steps = [{ section: "Kitchen Skills", name: skill.name, how: skill.grownUp ? "Do this one with a grown-up!" : "Let's learn it!", label: "", big: "", small: "", seconds: null, demo: null, say: `${skill.name}. ${skill.grownUp ? "Do this one with a grown-up. " : ""}Tap done when you're ready.` }];
  skill.steps.forEach((text, i) => {
    steps.push({ section: "Steps", name: `Step ${i + 1} of ${skill.steps.length}`, how: text, label: "", big: "", small: "", seconds: null, demo: null, say: `Step ${i + 1}. ${text}` });
  });
  steps.push({ section: "Chef's tip", name: "💡 Chef's tip", how: skill.tip, label: "", big: "", small: "", seconds: null, demo: null, say: `Chef's tip. ${skill.tip}` });
  return {
    title: skill.name,
    steps,
    expert: false,
    reps: 0,
    logType: "kitchenPractice",
    logExtra: { skill: skill.id },
    finishTitle: "Lesson done!",
    finishText: "Now try it for real. When you can do it, tap \"I learned this!\" 👨‍🍳",
  };
}

function drawSkills() {
  const area = document.querySelector("#skills-area");
  const skill = KITCHEN_SKILLS.find((item) => item.id === skillOpen);
  const cards = KITCHEN_SKILLS.map((item) => `
    <button class="skill-card ${kitchenSkills.has(item.id) ? "is-learned" : ""} ${item.id === skillOpen ? "is-open" : ""}" type="button" data-skill="${item.id}" aria-pressed="${item.id === skillOpen}">
      <span class="skill-card__icon" aria-hidden="true">${item.icon}</span>
      <span class="skill-card__name">${item.name}</span>
      <span class="skill-card__meta">${kitchenSkills.has(item.id) ? "✓ Learned" : item.level}${item.grownUp ? " · 👨‍🍳" : ""}</span>
    </button>`).join("");
  area.innerHTML = `
    <p class="quiz-total">${kitchenSkills.size} of ${KITCHEN_SKILLS.length} skills learned · 👨‍🍳 = do it with a grown-up</p>
    <div class="skill-cards">${cards}</div>
    <div class="skill-detail">
      <h3 class="skill-detail__title">${skill.icon} ${skill.name}</h3>
      ${skill.grownUp ? `<p class="skill-warning">👨‍🍳 Do this one with a grown-up${skill.id === "scrambled-eggs" ? ": the stove gets hot!" : "."}</p>` : ""}
      <ol class="skill-steps">${skill.steps.map((step) => `<li>${step}</li>`).join("")}</ol>
      <p class="skill-tip">💡 ${skill.tip}</p>
      <div class="brain-start__buttons">
        <button class="button" type="button" data-skill-teach>🔊 Teach me (voice coach)</button>
        ${kitchenSkills.has(skill.id)
          ? `<span class="penalty-done">✓ You learned this!</span>`
          : `<button class="button button--quiet" type="button" data-skill-learn>✓ I learned this! (+20 XP)</button>`}
      </div>
    </div>`;
}

document.querySelector("#skills-area").addEventListener("click", (event) => {
  const card = event.target.closest("[data-skill]");
  if (card) {
    skillOpen = card.dataset.skill;
    drawSkills();
    document.querySelector(`[data-skill="${skillOpen}"]`)?.focus();
    return;
  }
  const skill = KITCHEN_SKILLS.find((item) => item.id === skillOpen);
  if (event.target.closest("[data-skill-teach]")) {
    openCoach(today, skillPlan(skill)); // in coach.js
    return;
  }
  if (event.target.closest("[data-skill-learn]") && !kitchenSkills.has(skill.id)) {
    kitchenSkills.add(skill.id);
    saveJSON("levelUp.kitchenSkills", [...kitchenSkills]);
    logActivity("kskill", { skill: skill.id });
    sounds.fanfare();
    showToast(`👨‍🍳 New kitchen skill: ${skill.name}! +20 XP`);
    // On to the next one you haven't learned
    const next = KITCHEN_SKILLS.find((item) => !kitchenSkills.has(item.id));
    if (next) skillOpen = next.id;
    render();
    checkAchievements(true);
  }
});


/* 4. SUGAR DETECTIVE ---------------------------------------------------------
   How many teaspoons of sugar? (1 teaspoon of sugar weighs about 4
   grams.) The American Heart Association says kids should have less
   than 6 teaspoons (25 grams) of ADDED sugar a day. The sugar in
   fruit and plain milk is natural, not added.                      */

const SUGAR_FOODS = [
  { icon: "🥤", name: "A can of soda (12 oz)", tsp: 10, grams: 39, note: "All of it is added sugar. That's more than a whole day's limit in one can!" },
  { icon: "🧃", name: "A bottle of sports drink (20 oz)", tsp: 9, grams: 34, note: "Sports drinks are made for long, sweaty games, not for lunch." },
  { icon: "🥛", name: "A cup of chocolate milk", tsp: 6, grams: 24, note: "About half is natural milk sugar. It also has protein, so it's a good after-game drink." },
  { icon: "🥛", name: "A cup of plain milk", tsp: 3, grams: 12, note: "It's all natural milk sugar, not added sugar." },
  { icon: "🍊", name: "A cup of orange juice", tsp: 5, grams: 21, note: "Natural fruit sugar, but without the fiber of a real orange. A whole orange fills you up more." },
  { icon: "🍎", name: "A medium apple", tsp: 5, grams: 19, note: "Natural sugar packed with fiber and water. A great snack!" },
  { icon: "🍫", name: "A milk chocolate bar (1.55 oz)", tsp: 6, grams: 24, note: "All added sugar. A whole day's worth in one bar!" },
  { icon: "🍬", name: "A pouch of fruit snacks", tsp: 3, grams: 11, note: "Almost all added sugar, even though they say \"fruit.\"" },
  { icon: "🍩", name: "A glazed donut", tsp: 3, grams: 12, note: "Plus lots of fat. A sometimes food!" },
  { icon: "🍅", name: "A tablespoon of ketchup", tsp: 1, grams: 4, note: "Ketchup has more sugar than you'd think!" },
  { icon: "💧", name: "A glass of water", tsp: 0, grams: 0, note: "Zero! The best drink there is." },
  { icon: "🍿", name: "A bowl of plain popcorn (3 cups)", tsp: 0, grams: 0, note: "Zero, unless you add some. Plain popcorn is a whole grain!" },
];
const SUGAR_ROUNDS = 8;

let sugarGame = null; // { foods, index, choices, picked, right }

function sugarChoices(answer) {
  const options = new Set([answer]);
  while (options.size < 4) {
    const guess = Math.max(0, answer + Math.round((Math.random() - 0.5) * 10));
    options.add(guess);
  }
  return [...options].sort((a, b) => a - b);
}

function sugarCubes(count) {
  if (count === 0) return `<span class="sugar-zero">0 cubes</span>`;
  return Array.from({ length: count }, () => `<span class="sugar-cube" aria-hidden="true"></span>`).join("");
}

function drawSugar() {
  const area = document.querySelector("#sugar-area");
  if (!sugarGame) {
    const best = Math.max(0, ...logOf("sugar").map((entry) => entry.r));
    area.innerHTML = `
      <div class="brain-start">
        <p class="brain-start__text">Guess how many <strong>teaspoons of sugar</strong> are in each food or drink. Some will surprise you!</p>
        <button class="button" type="button" data-sugar="start">🔍 Start (${SUGAR_ROUNDS} rounds)</button>
        <p class="quiz-total">${best ? `Best: ${best}/${SUGAR_ROUNDS}` : "Kids should have less than 6 teaspoons of added sugar a day."}</p>
      </div>`;
    return;
  }
  if (sugarGame.index >= sugarGame.foods.length) {
    area.innerHTML = `
      <div class="quiz-end">
        <p class="eyebrow">// case closed 🔍</p>
        <p class="quiz-end__score">${sugarGame.right}<span>/${sugarGame.foods.length}</span></p>
        <p class="quiz-end__message">${sugarGame.right === sugarGame.foods.length ? "Master detective! 🕵️" : "Nice detective work! Now you know where sugar hides."}</p>
        <p class="quiz-total">Remember: less than 6 teaspoons of <strong>added</strong> sugar a day. The sugar in fruit and plain milk is natural.</p>
        <div class="quiz-end__buttons">
          <button class="button" type="button" data-sugar="start">Play again</button>
          <button class="button button--quiet" type="button" data-sugar="close">Done</button>
        </div>
      </div>`;
    return;
  }
  const food = sugarGame.foods[sugarGame.index];
  const answered = sugarGame.picked !== null;
  area.innerHTML = `
    <div class="quiz-play">
      <div class="quiz-top">
        <p class="quiz-where">🔍 Case ${sugarGame.index + 1} of ${sugarGame.foods.length}</p>
        <p class="quiz-score">✓ ${sugarGame.right}</p>
        <button class="text-button" type="button" data-sugar="close">Quit</button>
      </div>
      <p class="sugar-food"><span class="sugar-food__icon" aria-hidden="true">${food.icon}</span> ${food.name}</p>
      <p class="quiz-total">How many teaspoons of sugar?</p>
      <div class="quiz-answers sugar-answers">${sugarGame.choices.map((choice) => {
        let state = "";
        if (answered && choice === food.tsp) state = "is-right";
        else if (answered && choice === sugarGame.picked) state = "is-wrong";
        return `<button class="quiz-answer ${state}" type="button" data-sugar-pick="${choice}" ${answered ? "disabled" : ""}><span>${choice} ${choice === 1 ? "teaspoon" : "teaspoons"}</span></button>`;
      }).join("")}</div>
      <div class="quiz-feedback" aria-live="polite">${answered ? `
        <div class="quiz-result ${sugarGame.picked === food.tsp ? "is-right" : "is-wrong"}">
          <p class="quiz-result__title">${sugarGame.picked === food.tsp ? "✅ Right!" : "❌ Not quite!"} About ${food.tsp} ${food.tsp === 1 ? "teaspoon" : "teaspoons"} (${food.grams} grams)</p>
          <div class="sugar-cubes">${sugarCubes(food.tsp)}</div>
          <p>${food.note}</p>
        </div>
        <button class="button quiz-next" type="button" data-sugar="next">${sugarGame.index === sugarGame.foods.length - 1 ? "See my score" : "Next case →"}</button>` : ""}
      </div>
    </div>`;
}

document.querySelector("#sugar-area").addEventListener("click", (event) => {
  const pick = event.target.closest("[data-sugar-pick]");
  if (pick && sugarGame && sugarGame.picked === null) {
    const food = sugarGame.foods[sugarGame.index];
    sugarGame.picked = Number(pick.dataset.sugarPick);
    if (sugarGame.picked === food.tsp) {
      sugarGame.right += 1;
      sounds.rate(10);
    } else {
      sounds.down();
    }
    drawSugar();
    document.querySelector("[data-sugar='next']")?.focus();
    return;
  }
  const button = event.target.closest("[data-sugar]");
  if (!button) return;
  const action = button.dataset.sugar;
  if (action === "start") {
    startAudio();
    const foods = quizShuffle(SUGAR_FOODS).slice(0, SUGAR_ROUNDS);
    sugarGame = { foods, index: 0, choices: sugarChoices(foods[0].tsp), picked: null, right: 0 };
  }
  if (action === "next" && sugarGame) {
    sugarGame.index += 1;
    sugarGame.picked = null;
    if (sugarGame.index >= sugarGame.foods.length) {
      logActivity("sugar", { r: sugarGame.right, n: sugarGame.foods.length });
      sounds.finish();
      render();
      checkAchievements(true);
    } else {
      sugarGame.choices = sugarChoices(sugarGame.foods[sugarGame.index].tsp);
    }
  }
  if (action === "close") sugarGame = null;
  drawSugar();
  document.querySelector("#sugar-area .quiz-answer, #sugar-area .button")?.focus();
});


/* 5. KITCHEN MATH ---------------------------------------------------------------
   Real recipe math with fractions, just like 5th grade. Get one wrong
   and you owe some exercise, like in the quiz!                     */

const KMATH_ROUNDS = 8;
const KMATH_FIXES = ["10 squats", "15 jumping jacks", "8 push-ups", "10 curl-ups", "20 high knees", "15 calf raises"];
const FRACTION_SYMBOLS = { "1/2": "½", "1/3": "⅓", "2/3": "⅔", "1/4": "¼", "3/4": "¾", "1/8": "⅛", "3/8": "⅜", "5/8": "⅝", "7/8": "⅞" };

function gcd(a, b) {
  return b === 0 ? Math.abs(a) : gcd(b, a % b);
}

// A fraction like { n: 3, d: 4 }, always simplified
function frac(n, d = 1) {
  const g = gcd(n, d) || 1;
  return { n: n / g, d: d / g };
}

function fracText(f) {
  const whole = Math.floor(f.n / f.d);
  const rest = f.n % f.d;
  if (rest === 0) return String(whole);
  const part = FRACTION_SYMBOLS[`${rest}/${f.d}`] || `${rest}/${f.d}`;
  return whole ? `${whole} ${part}` : part;
}

function fracValue(f) {
  return f.n / f.d;
}

function kmathQuestion() {
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const foods = ["oats", "flour", "milk", "yogurt", "blueberries", "rice", "water"];
  const food = pick(foods);
  const kind = pick(["double", "triple", "half", "add", "left", "tbsp"]);
  // Amounts you can really scoop with measuring cups
  const a = pick([frac(1, 4), frac(1, 3), frac(1, 2), frac(2, 3), frac(3, 4)]);
  let text = "";
  let answer = null;
  let why = "";
  const mistakes = []; // wrong answers that come from real mistakes
  if (kind === "double" || kind === "triple") {
    const times = kind === "double" ? 2 : 3;
    text = `A recipe needs ${fracText(a)} cup of ${food}. You're making ${times} batches. How much do you need?`;
    answer = frac(a.n * times, a.d);
    why = `${fracText(a)} × ${times} = ${a.n * times}/${a.d} = ${fracText(answer)}`;
    mistakes.push(frac(a.n, a.d * times)); // multiplied the bottom number instead
    mistakes.push(frac(a.n + times, a.d)); // added instead of multiplying
  } else if (kind === "half") {
    text = `A recipe needs ${fracText(a)} cup of ${food}. You're making half a batch. How much do you need?`;
    answer = frac(a.n, a.d * 2);
    why = `Half of ${fracText(a)} is ${fracText(a)} × ½ = ${fracText(answer)}`;
    mistakes.push(frac(a.n * 2, a.d)); // doubled it by mistake
  } else if (kind === "add") {
    const b = pick([frac(1, 4), frac(1, 2), frac(1, 8)]);
    text = `You pour ${fracText(a)} cup of milk and ${fracText(b)} cup of yogurt into the blender. How much is that altogether?`;
    const d = a.d * b.d;
    answer = frac(a.n * b.d + b.n * a.d, d);
    const top = a.n * b.d + b.n * a.d;
    why = `Use the same bottom number: ${a.n * b.d}/${d} + ${b.n * a.d}/${d} = ${top}/${d}${fracText(answer) === `${top}/${d}` ? "" : ` = ${fracText(answer)}`}`;
    mistakes.push(frac(a.n + b.n, a.d + b.d)); // added the tops AND the bottoms
  } else if (kind === "left") {
    text = `You have 2 cups of ${food}. The recipe uses ${fracText(a)} cup. How much is left?`;
    answer = frac(2 * a.d - a.n, a.d);
    why = `2 = ${2 * a.d}/${a.d}, and ${2 * a.d}/${a.d} − ${a.n}/${a.d} = ${fracText(answer)}`;
    mistakes.push(frac(a.d - a.n, a.d)); // forgot the other whole cup
    mistakes.push(frac(2 * a.d + a.n, a.d)); // added instead of taking away
  } else {
    const cups = pick([frac(1, 4), frac(1, 2), frac(3, 4), frac(1, 8)]);
    text = `There are 16 tablespoons in 1 cup. How many tablespoons are in ${fracText(cups)} cup?`;
    answer = frac(16 * cups.n, cups.d);
    why = `16 × ${fracText(cups)} = ${fracText(answer)} tablespoons`;
    if (cups.n > 1) mistakes.push(frac(16, cups.d)); // forgot the top number
    mistakes.push(frac(16 * cups.d, cups.n)); // divided the wrong way
  }
  // Then a few more that are close
  const close = [frac(answer.n + 1, answer.d), frac(Math.max(1, answer.n - 1), answer.d), frac(answer.n * 2, answer.d), frac(answer.n, answer.d * 2)];
  const value = fracValue(answer);
  const choices = [answer];
  for (const option of [...quizShuffle(mistakes), ...quizShuffle(close)]) {
    if (choices.length >= 4) break;
    if (fracValue(option) > 0 && !choices.some((c) => Math.abs(fracValue(c) - fracValue(option)) < 1e-9)) choices.push(option);
  }
  const unit = (c) => kind === "tbsp"
    ? (fracValue(c) === 1 ? "tablespoon" : "tablespoons")
    : (fracValue(c) <= 1 ? "cup" : "cups");
  return {
    text,
    why,
    fix: pick(KMATH_FIXES),
    choices: quizShuffle(choices).map((c) => ({ label: `${fracText(c)} ${unit(c)}`, right: Math.abs(fracValue(c) - value) < 1e-9 })),
  };
}

let kmath = null; // { questions, index, picked, results, penaltyDone, penalties, reps }

function drawKmath() {
  const area = document.querySelector("#kmath-area");
  if (!kmath) {
    const best = Math.max(0, ...logOf("kmath").map((entry) => entry.r));
    area.innerHTML = `
      <div class="brain-start">
        <p class="brain-start__text">Doubling a recipe? Making half a batch? That's fraction math! Get one wrong and you owe some exercise.</p>
        <button class="button" type="button" data-kmath="start">🧮 Start (${KMATH_ROUNDS} problems)</button>
        <p class="quiz-total">${best ? `Best: ${best}/${KMATH_ROUNDS}` : "Real kitchen math, 5th-grade style."}</p>
      </div>`;
    return;
  }
  if (kmath.index >= kmath.questions.length) {
    const right = kmath.results.filter((r) => r === "right").length;
    area.innerHTML = `
      <div class="quiz-end">
        <p class="eyebrow">// kitchen math done</p>
        <p class="quiz-end__score">${right}<span>/${kmath.questions.length}</span></p>
        <p class="quiz-end__message">${right === kmath.questions.length ? "Fraction chef! 👨‍🍳" : "Every recipe makes you better at fractions!"}</p>
        ${kmath.penalties ? `<p class="quiz-total">${plural(kmath.penalties, "penalty", "penalties")} done: ${kmath.reps} reps for the weekly boss!</p>` : ""}
        <div class="quiz-end__buttons">
          <button class="button" type="button" data-kmath="start">Play again</button>
          <button class="button button--quiet" type="button" data-kmath="close">Done</button>
        </div>
      </div>`;
    return;
  }
  const question = kmath.questions[kmath.index];
  const answered = kmath.picked !== null;
  const gotIt = answered && question.choices[kmath.picked].right;
  let feedback = "";
  if (answered) {
    feedback = `
      <div class="quiz-result ${gotIt ? "is-right" : "is-wrong"}">
        <p class="quiz-result__title">${gotIt ? "✅ Correct!" : `❌ Not quite! It's ${question.choices.find((c) => c.right).label}`}</p>
        <p>${question.why}</p>
      </div>
      ${gotIt || kmath.penaltyDone
        ? `${kmath.penaltyDone ? `<p class="penalty-done">💪 Penalty done!</p>` : ""}<button class="button quiz-next" type="button" data-kmath="next">${kmath.index === kmath.questions.length - 1 ? "See my score" : "Next problem →"}</button>`
        : brainPenaltyHTML(question.fix, "kmath")}`;
  }
  area.innerHTML = `
    <div class="quiz-play">
      <div class="quiz-top">
        <p class="quiz-where">🧮 Problem ${kmath.index + 1} of ${kmath.questions.length}</p>
        <p class="quiz-score">✓ ${kmath.results.filter((r) => r === "right").length}</p>
        <button class="text-button" type="button" data-kmath="close">Quit</button>
      </div>
      ${roundDotsHTML(kmath.results, kmath.questions.length, kmath.index)}
      <h3 class="quiz-question kmath-question">${question.text}</h3>
      <div class="quiz-answers">${question.choices.map((choice, i) => {
        let state = "";
        if (answered && choice.right) state = "is-right";
        else if (answered && i === kmath.picked) state = "is-wrong";
        return `<button class="quiz-answer ${state}" type="button" data-kmath-pick="${i}" ${answered ? "disabled" : ""}><span class="quiz-answer__letter" aria-hidden="true">${"ABCD"[i]}</span><span>${choice.label}</span></button>`;
      }).join("")}</div>
      <div class="quiz-feedback" aria-live="polite">${feedback}</div>
    </div>`;
  fillPenaltyDemos(area);
}

document.querySelector("#kmath-area").addEventListener("click", (event) => {
  const pick = event.target.closest("[data-kmath-pick]");
  if (pick && kmath && kmath.picked === null) {
    kmath.picked = Number(pick.dataset.kmathPick);
    const right = kmath.questions[kmath.index].choices[kmath.picked].right;
    kmath.results[kmath.index] = right ? "right" : "wrong";
    if (right) sounds.rate(10);
    else sounds.down();
    drawKmath();
    document.querySelector("#kmath-area .quiz-next, [data-kmath='did']")?.focus();
    return;
  }
  const button = event.target.closest("[data-kmath]");
  if (!button) return;
  const action = button.dataset.kmath;
  if (action === "start") {
    startAudio();
    kmath = { questions: Array.from({ length: KMATH_ROUNDS }, kmathQuestion), index: 0, picked: null, results: [], penaltyDone: false, penalties: 0, reps: 0 };
  }
  if (!kmath) return;
  const question = kmath.questions[kmath.index];
  if (action === "demo" || action === "timer") {
    penaltyButton(action, question.fix); // brain.js
    return;
  }
  if (action === "did") {
    kmath.penaltyDone = true;
    kmath.penalties += 1;
    kmath.reps += penaltyInfo(question.fix).reps;
    sounds.done();
  }
  if (action === "next") {
    kmath.index += 1;
    kmath.picked = null;
    kmath.penaltyDone = false;
    if (kmath.index >= kmath.questions.length) {
      const right = kmath.results.filter((r) => r === "right").length;
      logActivity("kmath", { r: right, n: kmath.questions.length, p: kmath.penalties, reps: kmath.reps });
      right === kmath.questions.length ? sounds.fanfare() : sounds.finish();
      render();
      checkAchievements(true);
    }
  }
  if (action === "close") kmath = null;
  drawKmath();
  document.querySelector("#kmath-area .quiz-answer:not(:disabled), #kmath-area .quiz-next, #kmath-area .button")?.focus();
});


/* 6. FOOD PASSPORT -----------------------------------------------------------
   Try a food from another country, then get its stamp! Always ask a
   grown-up first, especially if you have food allergies.           */

const PASSPORT = [
  { id: "korea", flag: "🇰🇷", country: "Korea", food: "Bibimbap", about: "A bowl of rice topped with veggies, an egg and meat. Mix it all up! (Perfect for a taekwondo kid.)" },
  { id: "japan", flag: "🇯🇵", country: "Japan", food: "Edamame", about: "Young soybeans in the pod. Squeeze the beans right into your mouth!" },
  { id: "mexico", flag: "🇲🇽", country: "Mexico", food: "Guacamole", about: "Mashed avocado with lime, tomato and onion. Great with veggies or tortilla chips." },
  { id: "italy", flag: "🇮🇹", country: "Italy", food: "Minestrone", about: "A veggie and bean soup with little pasta in it." },
  { id: "india", flag: "🇮🇳", country: "India", food: "Dal", about: "A warm, mild lentil stew, usually eaten with rice. Lentils are full of protein!" },
  { id: "greece", flag: "🇬🇷", country: "Greece", food: "Tzatziki", about: "A cool yogurt and cucumber dip." },
  { id: "lebanon", flag: "🇱🇧", country: "Lebanon", food: "Hummus", about: "A creamy chickpea dip. Try it with carrots or pita bread." },
  { id: "china", flag: "🇨🇳", country: "China", food: "Dumplings", about: "Little dough pockets filled with meat and veggies, steamed or pan-fried." },
  { id: "vietnam", flag: "🇻🇳", country: "Vietnam", food: "Pho", about: "A noodle soup with herbs. Slurping is allowed!" },
  { id: "spain", flag: "🇪🇸", country: "Spain", food: "Gazpacho", about: "A cold tomato and veggie soup, perfect on a hot day." },
  { id: "brazil", flag: "🇧🇷", country: "Brazil", food: "Açaí bowl", about: "A thick frozen berry smoothie in a bowl, topped with fruit and granola." },
  { id: "ethiopia", flag: "🇪🇹", country: "Ethiopia", food: "Injera", about: "A spongy flatbread you use to scoop up stews. No fork needed!" },
  { id: "peru", flag: "🇵🇪", country: "Peru", food: "Quinoa", about: "A tiny seed that cooks like rice and is packed with protein." },
  { id: "france", flag: "🇫🇷", country: "France", food: "Ratatouille", about: "A stew of zucchini, eggplant, tomatoes and peppers." },
  { id: "thailand", flag: "🇹🇭", country: "Thailand", food: "Pad Thai", about: "Stir-fried rice noodles with egg, peanuts and lime." },
  { id: "jamaica", flag: "🇯🇲", country: "Jamaica", food: "Rice and peas", about: "Rice cooked with kidney beans and coconut milk. (In Jamaica, beans are called peas!)" },
];
const PASSPORT_RATINGS = { love: "😋 Loved it", ok: "🙂 It was OK", no: "😝 Not for me" };

let passportData = {}; // { korea: { d: "2026-11-27", r: "love" } } (saved)
let passportOpen = null; // the stamp you're looking at

function drawPassport() {
  const area = document.querySelector("#passport-area");
  const stamps = PASSPORT.map((place) => {
    const got = passportData[place.id];
    return `
      <button class="stamp ${got ? "is-stamped" : ""} ${place.id === passportOpen ? "is-open" : ""}" type="button" data-passport="${place.id}" aria-pressed="${place.id === passportOpen}">
        <span class="stamp__flag" aria-hidden="true">${place.flag}</span>
        <span class="stamp__food">${place.food}</span>
        <span class="stamp__mark">${got ? PASSPORT_RATINGS[got.r].split(" ")[0] : "?"}</span>
      </button>`;
  }).join("");
  const place = PASSPORT.find((item) => item.id === passportOpen);
  const got = place && passportData[place.id];
  area.innerHTML = `
    <p class="quiz-total">${Object.keys(passportData).length} of ${PASSPORT.length} stamps · Ask a grown-up first, especially if you have food allergies!</p>
    <div class="stamps">${stamps}</div>
    ${place ? `
      <div class="stamp-detail">
        <p class="stamp-detail__title">${place.flag} ${place.food} <span class="quiz-total">from ${place.country}</span></p>
        <p>${place.about}</p>
        ${got
          ? `<p class="penalty-done">Stamped! You said: ${PASSPORT_RATINGS[got.r]}</p>`
          : `<p class="field-label">Tried it? How was it?</p>
             <div class="lab-chips">${Object.entries(PASSPORT_RATINGS).map(([id, name]) => `<button class="lab-chip" type="button" data-passport-rate="${id}">${name}</button>`).join("")}</div>`}
      </div>` : `<p class="empty-note">Tap a stamp to see the food.</p>`}`;
}

document.querySelector("#passport-area").addEventListener("click", (event) => {
  const stamp = event.target.closest("[data-passport]");
  if (stamp) {
    passportOpen = stamp.dataset.passport;
    drawPassport();
    document.querySelector(`[data-passport="${passportOpen}"]`)?.focus();
    return;
  }
  const rate = event.target.closest("[data-passport-rate]");
  if (rate && passportOpen && !passportData[passportOpen]) {
    passportData = { ...passportData, [passportOpen]: { d: toKey(today), r: rate.dataset.passportRate } };
    saveJSON("levelUp.passport", passportData);
    logActivity("passport", { f: passportOpen });
    const place = PASSPORT.find((item) => item.id === passportOpen);
    sounds.fanfare();
    showToast(`${place.flag} Stamped: ${place.food} from ${place.country}! +15 XP`);
    render();
    checkAchievements(true);
  }
});


/* 7. GAME DAY FUEL --------------------------------------------------------------
   What to eat and drink before, during and after a game or practice.
   (If your calendar on the Tools tab has a game today, it picks the
   right time for you.)                                              */

const FUEL_TIMES = [
  { id: "meal", name: "3 to 4 hours before", icon: "🍝",
    eat: ["A full meal with carbs, some protein and veggies", "Like: pasta with chicken, rice and beans, or a turkey sandwich with fruit"],
    drink: "Water with your meal",
    why: "Carbs are your muscles' favorite fuel. Eating a few hours early gives your body time to digest." },
  { id: "snack", name: "1 to 2 hours before", icon: "🍌",
    eat: ["A light snack that's mostly carbs", "Like: a banana, yogurt, crackers, or toast with a little peanut butter"],
    drink: "Water, a cup or two",
    why: "A small snack tops up your energy without making your tummy feel heavy." },
  { id: "close", name: "Right before (30 minutes)", icon: "🍊",
    eat: ["Only if you're hungry: something tiny and easy", "Like: half a banana, a few orange slices, or an applesauce pouch"],
    drink: "A few sips of water",
    why: "Anything big right before you run can give you a side ache." },
  { id: "during", name: "During the game", icon: "💧",
    eat: ["At halftime: orange slices or a few crackers"],
    drink: "Sips of water every 15 to 20 minutes. A sports drink is only for long, hot, sweaty games over an hour.",
    why: "You lose water when you sweat, even in cold weather. Thirsty legs are slow legs!" },
  { id: "after", name: "After the game", icon: "🥛",
    eat: ["Carbs + protein within an hour, to help your muscles recover", "Like: chocolate milk, yogurt with fruit, a turkey wrap, or a PB&J"],
    drink: "Water, and keep drinking until your pee is light yellow",
    why: "Protein repairs your muscles, and carbs refill your energy for next time." },
];
const FUEL_SKIP = ["🍟 Greasy, fried food", "🥤 Soda and energy drinks", "🍬 Candy right before", "🆕 Brand-new foods (try new things on practice days, not game days)"];

let fuelPick = null;

// Picks the right time from today's calendar (tools.js), if there's a game or practice
function fuelFromCalendar() {
  if (typeof eventsOn !== "function") return null;
  const sporty = eventsOn(toKey(today)).filter((event) => ["game", "practice", "tkd", "belt", "swim"].includes(event.type) && event.time);
  const now = new Date();
  for (const event of sporty) {
    const [hours, minutes] = event.time.split(":").map(Number);
    const start = new Date(now);
    start.setHours(hours, minutes, 0, 0);
    const mins = Math.round((start - now) / 60000);
    let time = null;
    if (mins >= 150) time = "meal";
    else if (mins >= 50) time = "snack";
    else if (mins >= 0) time = "close";
    else if (mins > -90) time = "during";
    else if (mins > -240) time = "after";
    if (time) return { event, mins, time };
  }
  return null;
}

function drawFuel() {
  const area = document.querySelector("#fuel-area");
  const plan = fuelFromCalendar();
  if (!fuelPick) fuelPick = plan ? plan.time : "snack";
  const time = FUEL_TIMES.find((item) => item.id === fuelPick);
  let note = "";
  if (plan) {
    const icon = eventIcon(plan.event); // tools.js
    note = plan.mins >= 0
      ? `📅 Your ${icon} ${escapeHTML(eventTitle(plan.event))} is at ${timeText(plan.event.time)}: that's in ${plan.mins >= 60 ? `${Math.floor(plan.mins / 60)} h ` : ""}${plan.mins % 60} min.`
      : `📅 Your ${icon} ${escapeHTML(eventTitle(plan.event))} started at ${timeText(plan.event.time)}.`;
  }
  area.innerHTML = `
    ${note ? `<p class="fuel-note">${note}</p>` : ""}
    <div class="lab-chips" role="group" aria-label="When">${FUEL_TIMES.map((item) => `
      <button class="lab-chip" type="button" data-fuel="${item.id}" aria-pressed="${item.id === fuelPick}">${item.icon} ${item.name}</button>`).join("")}
    </div>
    <div class="fuel-card">
      <p class="fuel-card__title">${time.icon} ${time.name}</p>
      <p class="fuel-card__label">🍽️ Eat</p>
      <ul class="fuel-list">${time.eat.map((item) => `<li>${item}</li>`).join("")}</ul>
      <p class="fuel-card__label">💧 Drink</p>
      <p>${time.drink}</p>
      <p class="fuel-why">💡 ${time.why}</p>
    </div>
    <details class="extra">
      <summary>🚫 Skip these on game day</summary>
      <ul class="fuel-list">${FUEL_SKIP.map((item) => `<li>${item}</li>`).join("")}</ul>
    </details>`;
}

document.querySelector("#fuel-area").addEventListener("click", (event) => {
  const button = event.target.closest("[data-fuel]");
  if (!button) return;
  fuelPick = button.dataset.fuel;
  drawFuel();
  document.querySelector(`[data-fuel="${fuelPick}"]`)?.focus();
});


/* 8. PLUGGING IN (see hooks.js) ------------------------------------------------- */

function drawKitchenPlus() {
  drawPlate();
  drawRainbow();
  drawSkills();
  if (!sugarGame || sugarGame.index >= sugarGame.foods.length) drawSugar();
  if (!kmath || kmath.index >= kmath.questions.length) drawKmath();
  drawPassport();
  drawFuel();
}

addPagePart("kitchen", drawKitchenPlus);

addSavedData("levelUp.rainbow", () => {
  const saved = loadJSON("levelUp.rainbow", {});
  rainbowData = saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
});
addSavedData("levelUp.kitchenSkills", () => {
  const saved = loadJSON("levelUp.kitchenSkills", []);
  kitchenSkills = new Set(Array.isArray(saved) ? saved : []);
});
addSavedData("levelUp.passport", () => {
  const saved = loadJSON("levelUp.passport", {});
  passportData = saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
});

addXP("plate", () => 15, 3);
addXP("rainbow", () => 20, 1);
addXP("kskill", () => 20);
addXP("sugar", (e) => e.r * 3, 3);
addXP("kmath", (e) => e.r * 5 + (e.p || 0) * XP_RULES.penaltyDone, 3);
addXP("passport", () => 15);

addXPRule("Build a 3-star plate", "+15");
addXPRule("Rainbow Day (5 colors)", "+20");
addXPRule("Learn a kitchen skill", "+20");
addXPRule("Sugar Detective", "+3 per right guess");
addXPRule("Kitchen Math", "+5 per right answer");
addXPRule("Food Passport stamp", "+15");

addBadge({ id: "platePro", icon: "🍽️", name: "Plate Pro", how: "Build a 3-star plate", earned: () => logOf("plate").length >= 1 });
addBadge({ id: "rainbowWeek", icon: "🌈", name: "Rainbow Eater", how: "Have 5 Rainbow Days", earned: () => logOf("rainbow").length >= 5 });
addBadge({ id: "juniorChef", icon: "👨‍🍳", name: "Junior Chef", how: "Learn 5 kitchen skills", earned: () => kitchenSkills.size >= 5 });
addBadge({ id: "sugarDetective", icon: "🕵️", name: "Sugar Detective", how: `Get ${SUGAR_ROUNDS} out of ${SUGAR_ROUNDS} in Sugar Detective`, earned: () => logOf("sugar").some((e) => e.r >= e.n && e.n >= SUGAR_ROUNDS) });
addBadge({ id: "fractionChef", icon: "🧮", name: "Fraction Chef", how: `Get ${KMATH_ROUNDS} out of ${KMATH_ROUNDS} in Kitchen Math`, earned: () => logOf("kmath").some((e) => e.r >= e.n && e.n >= KMATH_ROUNDS) });
addBadge({ id: "worldTaster", icon: "🌍", name: "World Taster", how: "Collect 8 Food Passport stamps", earned: () => Object.keys(passportData).length >= 8 });
