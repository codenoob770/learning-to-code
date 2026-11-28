/* =============================================================
   grocery.js: the week's grocery list
   -------------------------------------------------------------
   Looks at every drink, meal and snack in the week you're viewing,
   works out what you need to buy, and sorts it by the section of
   the store. Tick things off as you shop, or copy the whole list
   to send to whoever does the shopping.

   GROCERY_ITEMS matches words in the recipes to things you buy.
   The more specific words come first, so "sweet potato" is found
   before plain "potato". Water and ice are left out on purpose.
   ============================================================= */

const GROCERY_SECTIONS = ["Fruits & veggies", "Fridge: dairy, eggs & more", "Meat & fish", "Bread & grains", "Pantry (you may already have these)"];

const GROCERY_ITEMS = [
  // [words to look for, what to buy, store section]
  [/sweet potato/, "Sweet potatoes", 0],
  [/potato/, "Potatoes", 0],
  [/frozen peas and carrots/, "Frozen peas and carrots", 0],
  [/banana/, "Bananas", 0],
  [/strawberr/, "Strawberries", 0],
  [/blueberr/, "Blueberries", 0],
  [/berries/, "Mixed berries (fresh or frozen)", 0],
  [/watermelon/, "Watermelon", 0],
  [/pineapple/, "Pineapple", 0],
  [/mango/, "Mango", 0],
  [/orange juice/, "Orange juice", 1],
  [/orange/, "Oranges", 0],
  [/apple/, "Apples", 0],
  [/grapes/, "Grapes", 0],
  [/raisins|nuts|chocolate chips/, "Nuts, raisins & chocolate chips", 4],
  [/lemon/, "Lemons", 0],
  [/lime/, "Limes", 0],
  [/avocado/, "Avocados", 0],
  [/spinach/, "Spinach", 0],
  [/romaine|lettuce|side salad/, "Lettuce or salad greens", 0],
  [/cherry tomato/, "Cherry tomatoes", 0],
  [/diced tomatoes/, "Canned diced tomatoes", 4],
  [/tomato sauce/, "Tomato sauce", 4],
  [/tomato/, "Tomatoes", 0],
  [/cucumber/, "Cucumbers", 0],
  [/carrots/, "Baby carrots", 0],
  [/bell pepper|peppers/, "Bell peppers", 0],
  [/mushroom/, "Mushrooms", 0],
  [/broccoli/, "Broccoli", 0],
  [/green beans/, "Green beans", 0],
  [/celery/, "Celery", 0],
  [/corn tortilla/, "Corn tortillas", 3],
  [/corn/, "Corn", 0],
  [/garlic powder/, "Garlic powder", 4],
  [/garlic/, "Garlic", 0],
  [/mint/, "Fresh mint", 0],
  [/coconut water/, "Coconut water", 1],
  [/milk/, "Milk", 1],
  [/yogurt/, "Yogurt (plain, Greek or vanilla)", 1],
  [/mozzarella/, "Mozzarella", 1],
  [/parmesan/, "Parmesan", 1],
  [/cheese stick/, "Cheese sticks", 1],
  [/cheese/, "Cheese (sliced or shredded)", 1],
  [/egg/, "Eggs", 1],
  [/hummus/, "Hummus", 1],
  [/salsa/, "Salsa", 1],
  [/tuna/, "Canned tuna", 2],
  [/salmon/, "Salmon", 2],
  [/turkey burger/, "Turkey burger patties", 2],
  [/turkey pepperoni/, "Turkey pepperoni", 2],
  [/ground turkey or beef/, "Ground turkey or beef", 2],
  [/sliced beef/, "Beef for stir-fry", 2],
  [/turkey/, "Sliced turkey", 2],
  [/chicken/, "Chicken", 2],
  [/naan|pita/, "Naan or pita bread", 3],
  [/tortilla/, "Whole-wheat tortillas", 3],
  [/\bbun\b/, "Whole-wheat buns", 3],
  [/bread|toast/, "Whole-grain bread", 3],
  [/crackers/, "Whole-grain crackers", 3],
  [/oats/, "Oats", 3],
  [/granola/, "Granola", 3],
  [/rice/, "Rice", 3],
  [/spaghetti|pasta/, "Whole-wheat pasta", 3],
  [/peanut butter|sunflower seed butter/, "Peanut butter (or sunflower seed butter)", 4],
  [/honey/, "Honey", 4],
  [/cocoa/, "Cocoa powder", 4],
  [/chia/, "Chia seeds", 4],
  [/black beans/, "Black beans", 4],
  [/kidney beans/, "Kidney beans", 4],
  [/soy sauce/, "Soy sauce", 4],
  [/caesar dressing/, "Caesar dressing", 4],
  [/italian dressing/, "Italian dressing", 4],
  [/mayo/, "Mayo", 4],
  [/\boil\b/, "Olive oil", 4],
  [/cinnamon/, "Cinnamon", 4],
  [/paprika/, "Paprika", 4],
  [/chili powder/, "Chili powder", 4],
  [/cumin/, "Cumin", 4],
  [/italian seasoning/, "Italian seasoning", 4],
  [/taco seasoning/, "Taco seasoning", 4],
  [/salt/, "Salt", 4],
  [/pepper/, "Black pepper", 4],
];

// Everything to buy for the week starting on "monday"
function groceryListFor(monday) {
  const items = new Map(); // name -> { name, section, uses }
  for (let i = 0; i < 7; i++) {
    const date = addDays(monday, i);
    if (date < planStart) continue;
    const plan = planFor(date);
    const lines = [plan.drink, plan.breakfast, plan.lunch, plan.dinner].flatMap((recipe) => recipe.ingredients);
    lines.push(plan.snack.what);

    for (const line of lines) {
      let text = line.toLowerCase();
      for (const [words, name, section] of GROCERY_ITEMS) {
        if (!words.test(text)) continue;
        text = text.replace(words, " "); // so "sweet potato" isn't found again as "potato"
        const item = items.get(name) || { name, section, uses: 0 };
        item.uses += 1;
        items.set(name, item);
      }
    }
  }
  return [...items.values()].sort((a, b) => a.section - b.section || a.name.localeCompare(b.name));
}

const groceryBox = document.querySelector("#grocery-box");
let groceryItems = [];
let groceryWeek = "";

function openGrocery() {
  groceryWeek = toKey(mondayOf(selected));
  groceryItems = groceryListFor(mondayOf(selected));
  renderGrocery();
  groceryBox.hidden = false;
  document.querySelector("#grocery-close").focus();
}

function closeGrocery() {
  groceryBox.hidden = true;
  document.querySelector("#open-grocery")?.focus();
}

// A safe id for each checkbox, like "g-bananas"
function groceryId(name) {
  return "g-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function renderGrocery() {
  const checked = new Set(groceryChecks[groceryWeek] || []);
  const sunday = addDays(fromKey(groceryWeek), 6);
  document.querySelector("#grocery-week").textContent =
    `For the week of ${chartDate(groceryWeek)} – ${chartDate(toKey(sunday))} · ${groceryItems.length} things · ${checked.size} in the cart`;

  document.querySelector("#grocery-list").innerHTML = GROCERY_SECTIONS.map((section, index) => {
    const inSection = groceryItems.filter((item) => item.section === index);
    if (inSection.length === 0) return "";
    return `
      <h3 class="grocery__section">${section}</h3>
      <ul class="grocery__items">
        ${inSection.map((item) => `
          <li>
            <input type="checkbox" id="${groceryId(item.name)}" data-item="${item.name}" ${checked.has(item.name) ? "checked" : ""}>
            <label for="${groceryId(item.name)}">${item.name}</label>
            <span class="grocery__uses">${item.uses === 1 ? "1 recipe" : `${item.uses} recipes`}</span>
          </li>`).join("")}
      </ul>`;
  }).join("");
}

// Ticking a box saves it
document.querySelector("#grocery-list").addEventListener("change", (event) => {
  const box = event.target.closest("[data-item]");
  if (!box) return;
  const checked = new Set(groceryChecks[groceryWeek] || []);
  if (box.checked) checked.add(box.dataset.item);
  else checked.delete(box.dataset.item);
  groceryChecks[groceryWeek] = [...checked];
  save("levelUp.grocery", JSON.stringify(groceryChecks));
  renderGrocery();
  document.querySelector(`#${groceryId(box.dataset.item)}`).focus();
});

// Copy the list as plain text
document.querySelector("#grocery-copy").addEventListener("click", async () => {
  const checked = new Set(groceryChecks[groceryWeek] || []);
  const text = GROCERY_SECTIONS.map((section, index) => {
    const inSection = groceryItems.filter((item) => item.section === index && !checked.has(item.name));
    if (inSection.length === 0) return "";
    return `${section}\n${inSection.map((item) => `- ${item.name}`).join("\n")}`;
  }).filter(Boolean).join("\n\n");
  const fullText = `Grocery list for the week of ${chartDate(groceryWeek)}\n\n${text}`;
  try {
    await navigator.clipboard.writeText(fullText);
    showToast("Grocery list copied!");
  } catch (error) {
    // Some browsers block copying: show the text so it can be copied by hand
    const area = document.querySelector("#grocery-text");
    area.value = fullText;
    area.hidden = false;
    area.select();
    showToast("Press and hold (or Ctrl+C) to copy the list.");
  }
});

document.querySelector("#grocery-close").addEventListener("click", closeGrocery);
groceryBox.addEventListener("click", (event) => {
  if (event.target === groceryBox) closeGrocery();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !groceryBox.hidden) closeGrocery();
});
