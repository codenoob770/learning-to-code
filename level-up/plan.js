/* =============================================================
   plan.js: everything IN the plan
   -------------------------------------------------------------
   This file is just information: the exercises, the weekly
   schedule and all the recipes. app.js reads it and builds the
   page from it. Want a new recipe or a different exercise?
   Change it here!

   1. Exercises, and how they get harder
   2. The weekly schedule
   3. Warm-up and cool-down
   4. My gym test
   5. Expert mode
   6. Recipes: drinks, breakfasts, lunches, dinners and snacks
   7. Side quest: the backflip
   8. More quests (splits, handstand, push-ups, juggling and code)
   ============================================================= */


/* 1. EXERCISES ---------------------------------------------------
   Every week of the plan is one level, from 1 up to 12.

   Each exercise has one or more versions. "from" is the level where
   that version starts. When you reach it, you switch to the harder
   version (and the numbers start a little lower again).

   The amount for a level is worked out like this:
     start + step × (levels since this version started)
   but never more than "max".

   unit:  "reps", "sec" or "min" (or a word like "taps" or "sprints")
   each:  "leg" or "side" if you do the amount on each side
   pace:  roughly how many seconds one rep takes (used to guess
          how long the workout is). If it's missing, we guess 3.     */

const EXERCISES = {
  // --- Upper body ---
  pushup: [
    { from: 1, name: "Incline push-ups", how: "Hands on a couch or sturdy chair, body in a straight line. Lower your chest to it, then push back up.", start: 8, step: 2, max: 14, unit: "reps" },
    { from: 4, name: "Push-ups", how: "Hands under your shoulders, body straight like a plank. Lower until your chest is a fist away from the floor.", start: 6, step: 1, max: 12, unit: "reps" },
    { from: 9, name: "Slow push-ups", how: "Regular push-ups, but take 3 seconds to lower down. Harder than it sounds!", start: 6, step: 1, max: 10, unit: "reps", pace: 5 },
  ],
  dips: [
    { from: 1, name: "Chair dips (knees bent)", how: "Hands on the edge of a sturdy chair, feet flat, knees bent. Bend your elbows to lower, then press back up.", start: 6, step: 1, max: 10, unit: "reps" },
    { from: 5, name: "Chair dips (legs straight)", how: "Same move with your legs out straight. Keep your back close to the chair.", start: 6, step: 1, max: 12, unit: "reps" },
  ],
  shoulderTaps: [
    { from: 1, name: "Plank shoulder taps", how: "In a high plank, tap your left shoulder with your right hand, then switch. Keep your hips still.", start: 10, step: 2, max: 24, unit: "taps", pace: 1.5 },
  ],
  superman: [
    { from: 1, name: "Superman hold", how: "Lie on your stomach. Lift your arms, chest and legs a little off the floor and hold.", start: 15, step: 3, max: 40, unit: "sec" },
  ],
  inchworm: [
    { from: 1, name: "Inchworms", how: "Stand tall, bend down, walk your hands out to a plank, then walk them back and stand up.", start: 4, step: 1, max: 10, unit: "reps", pace: 6 },
  ],

  // --- Legs ---
  squat: [
    { from: 1, name: "Squats", how: "Feet shoulder-width apart. Sit back like there's a chair behind you, chest up, then stand.", start: 12, step: 2, max: 20, unit: "reps" },
    { from: 5, name: "Jump squats", how: "Squat down, then jump straight up. Land softly with bent knees.", start: 8, step: 1, max: 14, unit: "reps" },
  ],
  lunge: [
    { from: 1, name: "Reverse lunges", how: "Step one foot back and lower until both knees bend about 90°. Push back up, then switch legs.", start: 6, step: 1, max: 10, unit: "reps", each: "leg" },
    { from: 7, name: "Split squats (back foot on a chair)", how: "Back foot up on a chair or couch behind you. Lower straight down, then stand. Do all reps, then switch legs.", start: 6, step: 1, max: 10, unit: "reps", each: "leg" },
  ],
  wallSit: [
    { from: 1, name: "Wall sit", how: "Back flat against a wall, slide down until your knees bend about 90°. Hold it!", start: 20, step: 5, max: 60, unit: "sec" },
  ],
  bridge: [
    { from: 1, name: "Glute bridges", how: "Lie on your back, knees bent. Squeeze your glutes, lift your hips, then lower slowly.", start: 12, step: 2, max: 20, unit: "reps" },
    { from: 6, name: "Single-leg glute bridges", how: "Same move with one foot lifted off the floor. Do all reps, then switch.", start: 6, step: 1, max: 12, unit: "reps", each: "leg" },
  ],
  calfRaise: [
    { from: 1, name: "Calf raises", how: "Stand on the edge of a step, holding a wall for balance. Rise up on your toes, then lower slowly.", start: 15, step: 2, max: 30, unit: "reps", pace: 2 },
  ],

  // --- Core ---
  curlup: [
    { from: 1, name: "Curl-ups", how: "On your back, knees bent, feet flat, arms straight with palms on the floor. Curl up slowly so your fingers slide forward about 3 inches, then lower until your head touches the floor. Just like the gym test!", start: 10, step: 2, max: 25, unit: "reps" },
  ],
  plank: [
    { from: 1, name: "Plank", how: "Forearms on the floor, body straight from head to heels. Don't let your hips sag.", start: 20, step: 5, max: 60, unit: "sec" },
  ],
  bicycle: [
    { from: 1, name: "Bicycle crunches", how: "On your back, bring your right elbow toward your left knee as the other leg straightens. Switch, nice and slow.", start: 8, step: 2, max: 16, unit: "reps", each: "side", pace: 2 },
  ],
  deadBug: [
    { from: 1, name: "Dead bugs", how: "On your back, arms up, knees bent in the air. Lower one arm and the opposite leg, then switch. Keep your lower back on the floor.", start: 6, step: 1, max: 10, unit: "reps", each: "side" },
  ],
  sidePlank: [
    { from: 1, name: "Side plank", how: "Lie on your side, prop yourself up on your forearm and lift your hips. Hold, then switch sides.", start: 15, step: 3, max: 40, unit: "sec", each: "side" },
  ],

  // --- Speed and cardio ---
  jacks: [
    { from: 1, name: "Jumping jacks", how: "Jump your feet out as your arms go up, then jump back in.", start: 30, step: 5, max: 60, unit: "sec" },
  ],
  highKnees: [
    { from: 1, name: "High knees", how: "Run in place and drive your knees up to hip height. Pump your arms!", start: 20, step: 5, max: 45, unit: "sec" },
  ],
  skaters: [
    { from: 1, name: "Skater hops", how: "Hop sideways from one foot to the other like a speed skater. Land softly.", start: 20, step: 5, max: 45, unit: "sec" },
  ],
  mountainClimbers: [
    { from: 1, name: "Mountain climbers", how: "In a high plank, drive your knees toward your chest one at a time, fast.", start: 20, step: 5, max: 45, unit: "sec" },
  ],
  burpee: [
    { from: 1, name: "Step-back burpees", how: "Squat, hands on the floor, step your feet back to a plank, step them back in and stand up.", start: 5, step: 1, max: 8, unit: "reps", pace: 5 },
    { from: 5, name: "Burpees", how: "Squat, jump your feet back to a plank, jump them in, then jump up with your arms overhead.", start: 5, step: 1, max: 12, unit: "reps", pace: 4 },
  ],
  lineHops: [
    { from: 1, name: "Line hops", how: "Put a piece of tape or a sock on the floor. Hop side to side over it with both feet, quick and light.", start: 20, step: 5, max: 45, unit: "sec" },
  ],

  // --- Play day ---
  play: [
    { from: 1, name: "Play your sport", how: "Shoot hoops, kick a ball, swim, bike or play tag. Anything that gets you moving counts!", start: 30, step: 5, max: 60, unit: "min" },
  ],
  sprints: [
    { from: 1, name: "Sprints", how: "Mark out about 20 big steps. Sprint there, then walk back slowly to rest. That's one.", start: 4, step: 1, max: 10, unit: "sprints", pace: 25 },
  ],
  quickFeet: [
    { from: 1, name: "Quick feet", how: "Tiny, super-fast steps in place on the balls of your feet. Great for any sport.", start: 15, step: 5, max: 30, unit: "sec" },
  ],

  // --- Swimming (dry-land training: exercises out of the pool) ---
  ytw: [
    { from: 1, name: "Y-T-W raises", how: "Lie face down. Lift your arms off the floor in a Y shape, then a T, then a W, holding each for 2 seconds. That's one rep. Strong shoulders for every stroke.", start: 4, step: 1, max: 10, unit: "reps", pace: 7 },
  ],
  streamlineHold: [
    { from: 1, name: "Streamline hold", how: "Stand tall on your toes, arms squeezed behind your ears, one hand on top of the other, just like pushing off the wall.", start: 20, step: 5, max: 45, unit: "sec" },
  ],
  flutterKicks: [
    { from: 1, name: "Flutter kicks", how: "On your back, legs straight and a little off the floor. Small, fast kicks like freestyle. Keep your lower back pressed down.", start: 20, step: 5, max: 45, unit: "sec" },
  ],
  streamlineJumps: [
    { from: 1, name: "Streamline jumps", how: "Arms in a tight streamline overhead. Squat, then jump straight up as high as you can, like a start off the blocks. Land softly.", start: 6, step: 1, max: 12, unit: "reps", pace: 4 },
  ],

  // --- Soccer ---
  balanceReach: [
    { from: 1, name: "Single-leg balance reach", how: "Stand on one leg. Reach your other foot forward, out to the side and back without touching down. Strong ankles help stop sprains.", start: 5, step: 1, max: 10, unit: "reps", each: "leg", pace: 4 },
  ],
  lateralShuffle: [
    { from: 1, name: "Defensive shuffles", how: "Stay low like you're marking a player. Shuffle 5 quick steps to the side and back without crossing your feet.", start: 20, step: 5, max: 40, unit: "sec" },
  ],
  toeTaps: [
    { from: 1, name: "Ball toe taps", how: "Tap the top of a soccer ball with one foot, then the other, as fast as you can. No ball? Tap a step or a shoe.", start: 20, step: 5, max: 45, unit: "sec" },
  ],
  sprintTurn: [
    { from: 1, name: "Sprint, stop and turn", how: "Sprint 5 big steps, plant your foot, turn and sprint back. Changing direction fast is how you beat defenders.", start: 4, step: 1, max: 8, unit: "reps", pace: 8 },
  ],

  // --- Taekwondo ---
  chamberHold: [
    { from: 1, name: "Chamber holds", how: "In fighting stance, lift your knee into your kick chamber and hold it still. Builds the balance and hip strength behind every kick.", start: 10, step: 3, max: 30, unit: "sec", each: "leg" },
  ],
  slowKicks: [
    { from: 1, name: "Slow-motion front kicks", how: "Chamber, kick out over 3 seconds, pull back over 3 seconds, then step down. Slow kicks build control and power.", start: 4, step: 1, max: 10, unit: "reps", each: "leg", pace: 7 },
  ],
  stanceBounce: [
    { from: 1, name: "Fighting-stance bounce", how: "Bounce lightly on the balls of your feet in fighting stance. Switch your stance every 10 seconds.", start: 30, step: 5, max: 60, unit: "sec" },
  ],
  kickCombo: [
    { from: 1, name: "Kick combos", how: "Front kick, then roundhouse kick with the same leg. Snap each kick back fast. That's one combo.", start: 5, step: 1, max: 12, unit: "combos", each: "leg", pace: 4 },
  ],

  // --- Rest and stretch (these stay the same every week) ---
  catCow: [
    { from: 1, name: "Cat-cow", how: "On hands and knees, round your back up like a cat, then let it dip and look up. Move slowly with your breathing.", start: 8, step: 0, max: 8, unit: "reps", pace: 4 },
  ],
  childsPose: [
    { from: 1, name: "Child's pose", how: "Kneel, sit back on your heels and reach your arms forward along the floor. Breathe slowly.", start: 45, step: 0, max: 45, unit: "sec" },
  ],
  hamstring: [
    { from: 1, name: "Hamstring stretch", how: "Sit with one leg straight and gently reach toward your toes. No bouncing.", start: 30, step: 0, max: 30, unit: "sec", each: "leg" },
  ],
  quad: [
    { from: 1, name: "Quad stretch", how: "Stand and hold one foot behind you, gently pulling your heel toward your glutes. Hold a wall for balance.", start: 30, step: 0, max: 30, unit: "sec", each: "leg" },
  ],
  figure4: [
    { from: 1, name: "Figure-4 stretch", how: "On your back, cross one ankle over the other knee and gently pull that leg toward you.", start: 30, step: 0, max: 30, unit: "sec", each: "side" },
  ],
  butterfly: [
    { from: 1, name: "Butterfly stretch", how: "Sit with the soles of your feet together and gently press your knees toward the floor. Helps with higher kicks.", start: 45, step: 0, max: 45, unit: "sec" },
  ],
  sideLunge: [
    { from: 1, name: "Side lunge stretch", how: "Wide stance. Shift your weight to one side and bend that knee, keeping the other leg straight. Hold, then switch.", start: 30, step: 0, max: 30, unit: "sec", each: "side" },
  ],
  walk: [
    { from: 1, name: "Easy walk", how: "A relaxed walk outside. Great for sore muscles and for clearing your head.", start: 20, step: 0, max: 20, unit: "min" },
  ],
};


/* 2. THE WEEKLY SCHEDULE -----------------------------------------
   One entry per day, Monday first. "moves" lists exercises from above,
   in order. "style" decides how the day works:
     circuit: do every move, rest, then repeat for a few rounds
     play:    one round, outside if you can
     rest:    gentle stretching, no warm-up needed

   "sport" adds a few skills for one of my sports at the end.       */

const WEEK = [
  { day: "Monday", title: "Upper body power", focus: "Strong arms, chest and shoulders for swimming, blocking and throw-ins.", style: "circuit", moves: ["pushup", "dips", "shoulderTaps", "superman", "inchworm"], sport: { name: "Swimming", moves: ["ytw", "streamlineHold"] } },
  { day: "Tuesday", title: "Leg day", focus: "Strong legs mean faster sprints, harder shots and higher kicks.", style: "circuit", moves: ["squat", "lunge", "wallSit", "bridge", "calfRaise"], sport: { name: "Soccer", moves: ["balanceReach", "lateralShuffle"] } },
  { day: "Wednesday", title: "Core crusher", focus: "A strong core helps with every sport: kicks, shots and every swim stroke.", style: "circuit", moves: ["curlup", "plank", "bicycle", "deadBug", "sidePlank"], sport: { name: "Swimming", moves: ["flutterKicks", "streamlineJumps"] } },
  { day: "Thursday", title: "Speed & cardio", focus: "Get your heart pumping and your feet fast.", style: "circuit", moves: ["jacks", "highKnees", "skaters", "mountainClimbers", "burpee", "lineHops"], sport: { name: "Soccer", moves: ["toeTaps", "sprintTurn"] } },
  { day: "Friday", title: "Full-body challenge", focus: "A bit of everything from this week, back to back.", style: "circuit", moves: ["squat", "pushup", "lunge", "mountainClimbers", "plank"], sport: { name: "Taekwondo", moves: ["chamberHold", "slowKicks"] } },
  { day: "Saturday", title: "Play day", focus: "Get outside and have fun. Moving is moving!", style: "play", moves: ["play", "sprints", "quickFeet"], sport: { name: "Taekwondo", moves: ["stanceBounce", "kickCombo"] } },
  { day: "Sunday", title: "Rest & stretch", focus: "Rest days are when your muscles rebuild and get stronger. Take it easy.", style: "rest", moves: ["catCow", "childsPose", "hamstring", "quad", "figure4", "butterfly", "sideLunge", "walk"] },
];


/* 3. WARM-UP AND COOL-DOWN ------------------------------------------
   The same every day. Warming up gets your muscles ready so you don't
   get hurt. Cooling down helps you feel less sore tomorrow.         */

const WARM_UP = [
  { name: "Jog in place", amount: 45, unit: "sec", demo: "jog" },
  { name: "Arm circles (forward, then back)", amount: 20, unit: "sec", demo: "armCircles" },
  { name: "Leg swings", amount: 10, unit: "reps", each: "leg", demo: "legSwings" },
  { name: "Hip circles", amount: 10, unit: "reps", each: "way", demo: "hipCircles" },
  { name: "Jumping jacks", amount: 30, unit: "sec", demo: "jacks" },
];

const COOL_DOWN = [
  { name: "Walk around and breathe slowly", amount: 30, unit: "sec", demo: "walk" },
  { name: "Hamstring stretch", amount: 30, unit: "sec", each: "leg", demo: "hamstringStretch" },
  { name: "Quad stretch", amount: 30, unit: "sec", each: "leg", demo: "quadStretch" },
  { name: "Child's pose", amount: 30, unit: "sec", demo: "childsPose" },
];


/* 4. MY GYM TEST ---------------------------------------------------
   The site counts down to the test, adds practice tests, makes the day
   before a rest day and turns test day into a test-day plan.
   Got a new test coming up? Change the date ("year-month-day").
   No test? Set date to null.

   secondsPerRep: lots of school tests (like FitnessGram) go to a beat
   of one rep every 3 seconds. If your teacher uses a different beat,
   change it here.                                                     */

const TEST = {
  date: "2026-12-03",
  name: "Push-up & curl-up test",
  secondsPerRep: 3,
  practiceDaysBefore: [5, 2], // practice tests this many days before the test
};


/* 5. EXPERT MODE ---------------------------------------------------
   When expert mode is on, every workout gets way harder. Change these
   numbers to make expert mode even harder (or a bit easier).
   Rest days and test days never change.                              */

const EXPERT = {
  levelBoost: 5,   // jump ahead this many levels (up to the top level)
  extraRounds: 1,  // one more round than normal...
  maxRounds: 5,    // ...but never more than this
  restCut: 10,     // this many fewer seconds of rest between moves...
  minRest: 10,     // ...but never less than this
};


/* 6. RECIPES -----------------------------------------------------
   Every recipe makes one serving. The plan picks a different mix
   each day, so it takes a while before the same day repeats.
   Allergic to something, or don't like it? Swap it for something
   similar. Using a knife, blender or stove? Get help if you need it. */

const DRINKS = [
  {
    name: "Strawberry Banana Smoothie",
    minutes: 5,
    ingredients: ["1 cup strawberries (frozen works great)", "1 banana", "1 cup milk (any kind)", "½ cup yogurt"],
    steps: ["Put everything in a blender.", "Blend until smooth. Add a splash more milk if it's too thick."],
    why: "Fruit gives you quick energy, and the milk and yogurt have protein for your muscles.",
  },
  {
    name: "Green Machine Smoothie",
    minutes: 5,
    ingredients: ["1 big handful of spinach", "1 banana", "½ cup frozen pineapple", "1 cup milk or coconut water", "1 tbsp peanut butter (optional)"],
    steps: ["Blend the spinach with the milk first, so there are no leafy bits.", "Add everything else and blend until smooth. You can't taste the spinach, promise!"],
    why: "Spinach has iron, which helps carry oxygen to your muscles while you play.",
  },
  {
    name: "Chocolate Peanut Butter Recovery Shake",
    minutes: 5,
    ingredients: ["1 cup milk", "1 frozen banana", "1 tbsp peanut butter (or sunflower seed butter)", "1 tbsp cocoa powder", "A few ice cubes"],
    steps: ["Put everything in a blender.", "Blend until thick and creamy."],
    why: "Carbs plus protein right after a workout helps your muscles recover and refuel.",
  },
  {
    name: "Watermelon Mint Cooler",
    minutes: 5,
    ingredients: ["2 cups watermelon chunks", "Juice of ½ lime", "4 or 5 mint leaves", "A handful of ice"],
    steps: ["Blend the watermelon, lime juice and mint.", "Pour over ice. Strain it first if you don't like pulp."],
    why: "Watermelon is about 92% water, so it's perfect for staying hydrated on hot days.",
  },
  {
    name: "Mango Lassi",
    minutes: 5,
    ingredients: ["1 cup mango chunks (fresh or frozen)", "¾ cup plain yogurt", "½ cup milk", "1 tsp honey (optional)", "A pinch of cinnamon"],
    steps: ["Put everything in a blender.", "Blend until smooth and frothy."],
    why: "Yogurt has protein and good bacteria that keep your stomach happy.",
  },
  {
    name: "Berry Oat Smoothie",
    minutes: 5,
    ingredients: ["1 cup frozen mixed berries", "½ banana", "1 cup milk", "2 tbsp oats"],
    steps: ["Put everything in a blender.", "Blend for about a minute so the oats get smooth."],
    why: "Oats give you slow, steady energy, and berries are packed with vitamins.",
  },
  {
    name: "Homemade Sports Drink",
    minutes: 3,
    ingredients: ["2 cups cold water", "½ cup orange juice", "2 tbsp lemon juice", "1 tbsp honey", "A small pinch of salt"],
    steps: ["Stir everything together in a water bottle until the honey dissolves.", "Shake and chill. Great to sip during long practices."],
    why: "When you sweat, you lose water and a little salt. This puts both back, with less sugar than store-bought.",
  },
  {
    name: "Pineapple Coconut Cooler",
    minutes: 5,
    ingredients: ["1 cup pineapple chunks", "1 cup coconut water", "½ cup yogurt", "A handful of ice"],
    steps: ["Put everything in a blender.", "Blend until smooth. Tastes like a vacation."],
    why: "Coconut water has potassium, one of the minerals you lose when you sweat.",
  },
  {
    name: "Blueberry Vanilla Smoothie",
    minutes: 5,
    ingredients: ["1 cup frozen blueberries", "1 banana", "1 cup milk", "½ cup vanilla yogurt"],
    steps: ["Put everything in a blender.", "Blend until smooth and purple."],
    why: "Blueberries are packed with antioxidants, which help your body recover from hard workouts.",
  },
  {
    name: "Orange Creamsicle Smoothie",
    minutes: 5,
    ingredients: ["1 orange, peeled (or ½ cup orange juice)", "½ cup vanilla yogurt", "½ cup milk", "½ frozen banana", "A few ice cubes"],
    steps: ["Put everything in a blender.", "Blend until creamy. Tastes like the ice cream bar!"],
    why: "Oranges are full of vitamin C, which helps keep you from getting sick during the season.",
  },
  {
    name: "Cucumber Mint Water",
    minutes: 2,
    ingredients: ["1 big water bottle of cold water", "5 thin cucumber slices", "2 lime or lemon slices", "A few mint leaves"],
    steps: ["Drop everything into your water bottle.", "Let it sit in the fridge for 30 minutes so the flavor soaks in. Refill the water all day."],
    why: "Plain water is the best drink there is, and this makes it way more fun to keep sipping.",
  },
  {
    name: "Healthy Hot Cocoa",
    minutes: 5,
    ingredients: ["1 cup milk", "1 tbsp cocoa powder", "1 tsp honey", "A pinch of cinnamon"],
    steps: ["Warm the milk in a mug in the microwave for about 1 minute. Careful, it gets hot!", "Stir in the cocoa, honey and cinnamon until smooth."],
    why: "Warm, cozy and full of protein from the milk. Perfect after a cold soccer practice.",
  },
];

const BREAKFASTS = [
  {
    name: "Peanut Butter Banana Toast",
    minutes: 5,
    ingredients: ["2 slices whole-grain bread", "2 tbsp peanut butter (or sunflower seed butter)", "1 banana, sliced", "A drizzle of honey and a pinch of cinnamon"],
    steps: ["Toast the bread.", "Spread on the peanut butter, add the banana slices, then the honey and cinnamon."],
    why: "Whole grains and banana give lasting energy, and peanut butter adds protein.",
  },
  {
    name: "Overnight Oats",
    minutes: 5,
    ingredients: ["½ cup oats", "½ cup milk", "¼ cup yogurt", "1 tbsp chia seeds (optional)", "½ cup berries", "1 tsp honey"],
    steps: ["The night before, stir the oats, milk, yogurt and chia seeds together in a jar.", "Put it in the fridge overnight.", "In the morning, top it with berries and honey."],
    why: "It's ready the second you wake up, and oats keep you full until lunch.",
  },
  {
    name: "Veggie Scrambled Eggs",
    minutes: 10,
    ingredients: ["2 or 3 eggs", "A handful of spinach", "¼ cup diced bell pepper", "2 tbsp shredded cheese", "1 slice whole-grain toast"],
    steps: ["Whisk the eggs in a bowl.", "Cook the pepper and spinach in a pan with a little oil for 2 minutes.", "Pour in the eggs and stir gently until they're just set. Top with cheese and serve with toast."],
    why: "Eggs are one of the best protein foods for building muscle.",
  },
  {
    name: "Greek Yogurt Parfait",
    minutes: 3,
    ingredients: ["1 cup Greek yogurt", "½ cup granola", "½ cup berries", "1 tsp honey"],
    steps: ["Layer yogurt, granola and berries in a glass or bowl.", "Repeat the layers and finish with honey."],
    why: "Greek yogurt has about twice the protein of regular yogurt.",
  },
  {
    name: "Breakfast Burrito",
    minutes: 10,
    ingredients: ["1 whole-wheat tortilla", "2 eggs, scrambled", "¼ cup black beans", "2 tbsp shredded cheese", "Salsa"],
    steps: ["Scramble the eggs in a pan.", "Warm the beans.", "Fill the tortilla with eggs, beans, cheese and salsa, then roll it up."],
    why: "Protein, carbs and fiber all in one. You can eat it on the way to practice.",
  },
  {
    name: "Banana Oat Pancakes",
    minutes: 15,
    ingredients: ["1 ripe banana", "2 eggs", "½ cup oats", "Berries and yogurt for the top"],
    steps: ["Blend the banana, eggs and oats until smooth.", "Cook small pancakes in an oiled pan for about 2 minutes per side.", "Top with berries and a spoon of yogurt."],
    why: "Only three ingredients, and they give you a great mix of carbs and protein.",
  },
  {
    name: "Egg & Avocado Toast",
    minutes: 10,
    ingredients: ["2 slices whole-grain bread", "½ avocado", "2 eggs, fried or boiled", "Salt and pepper", "A few cherry tomatoes"],
    steps: ["Toast the bread and mash the avocado on top.", "Add the eggs, a pinch of salt and pepper, and the tomatoes on the side."],
    why: "Avocado has healthy fats that keep your energy steady.",
  },
  {
    name: "Apple Cinnamon Oatmeal",
    minutes: 5,
    ingredients: ["½ cup oats", "1 cup milk", "½ apple, diced", "1 tbsp peanut butter or chopped nuts", "Cinnamon"],
    steps: ["Mix the oats and milk in a big bowl and microwave for about 2 minutes. Watch so it doesn't bubble over.", "Stir in the apple, peanut butter and a shake of cinnamon."],
    why: "A warm, filling breakfast with slow energy for the whole morning.",
  },
];

const LUNCHES = [
  {
    name: "Turkey & Cheese Wrap",
    minutes: 5,
    ingredients: ["1 whole-wheat tortilla", "3 or 4 slices turkey", "1 slice cheese", "Lettuce and tomato", "1 tbsp hummus", "Baby carrots on the side"],
    steps: ["Spread the hummus on the tortilla.", "Layer the turkey, cheese, lettuce and tomato, then roll it up tight."],
    why: "Lean protein and whole grains keep you going all afternoon.",
  },
  {
    name: "Chicken Rice Bowl",
    minutes: 10,
    ingredients: ["1 cup cooked rice", "½ cup cooked chicken (leftover or rotisserie)", "½ cup corn", "¼ cup black beans", "Salsa and a little cheese"],
    steps: ["Warm the rice, chicken, corn and beans.", "Put it all in a bowl and top with salsa and cheese."],
    why: "Rice is a top fuel for athletes, and chicken helps your muscles repair.",
  },
  {
    name: "Tuna Salad Sandwich",
    minutes: 10,
    ingredients: ["1 can tuna, drained", "1 tbsp mayo or Greek yogurt", "1 stalk celery, diced", "2 slices whole-grain bread", "Lettuce", "An apple on the side"],
    steps: ["Mix the tuna, mayo and celery in a bowl.", "Spread it on the bread and add lettuce."],
    why: "Tuna is full of protein and omega-3 fats, which are good for your heart and brain.",
  },
  {
    name: "Pasta Salad",
    minutes: 15,
    ingredients: ["1½ cups cooked whole-wheat pasta", "A handful of cherry tomatoes, halved", "½ cucumber, chopped", "¼ cup mozzarella cubes", "2 tbsp Italian dressing", "Chicken (optional)"],
    steps: ["Cook the pasta and rinse it with cold water.", "Toss everything together. It tastes even better cold the next day."],
    why: "Pasta stores energy in your muscles, which is great the day before a big game.",
  },
  {
    name: "Hummus Veggie Pita",
    minutes: 10,
    ingredients: ["1 whole-wheat pita", "3 tbsp hummus", "Cucumber, tomato and spinach", "2 hard-boiled eggs on the side"],
    steps: ["Cut the pita open and spread hummus inside.", "Stuff it with the veggies. Eat the eggs on the side."],
    why: "Hummus is made from chickpeas, which have both protein and fiber.",
  },
  {
    name: "Bean & Cheese Quesadilla",
    minutes: 10,
    ingredients: ["1 whole-wheat tortilla", "⅓ cup shredded cheese", "¼ cup black beans", "A few strips of bell pepper", "Salsa or yogurt for dipping"],
    steps: ["Put the cheese, beans and pepper on half the tortilla and fold it over.", "Cook in a pan for 2 to 3 minutes per side, until golden and melty.", "Cut into triangles and dip!"],
    why: "Beans and cheese team up to give you plenty of protein.",
  },
  {
    name: "Chicken Caesar Wrap",
    minutes: 5,
    ingredients: ["1 whole-wheat tortilla", "½ cup cooked chicken", "A big handful of chopped romaine", "1 tbsp parmesan", "1 tbsp Caesar dressing"],
    steps: ["Toss the chicken, lettuce, parmesan and dressing in a bowl.", "Pile it on the tortilla and roll it up."],
    why: "A classic salad turned into something you can actually hold.",
  },
  {
    name: "Egg Fried Rice",
    minutes: 15,
    ingredients: ["1 cup cooked rice (yesterday's rice works best)", "2 eggs", "½ cup frozen peas and carrots", "1 tbsp soy sauce", "1 tsp oil"],
    steps: ["Heat the oil in a pan and cook the peas and carrots for 2 minutes.", "Push them aside, scramble the eggs in the empty spot, then mix it all together.", "Add the rice and soy sauce and stir-fry until hot."],
    why: "Carbs, protein and veggies in one pan, and a great way to use leftover rice.",
  },
];

const DINNERS = [
  {
    name: "Sheet-Pan Chicken & Veggies",
    minutes: 35,
    ingredients: ["1 chicken breast or 2 thighs", "1 cup broccoli", "1 cup potatoes, cut into cubes", "1 tbsp olive oil", "Garlic powder, salt and pepper"],
    steps: ["Heat the oven to 425°F (220°C).", "Toss everything with the oil and seasoning on a baking sheet.", "Bake about 25 minutes, until the chicken is cooked through and the potatoes are crispy."],
    why: "Protein, carbs and veggies, and only one pan to wash.",
  },
  {
    name: "Spaghetti with Meat Sauce",
    minutes: 25,
    ingredients: ["1½ cups cooked whole-wheat spaghetti", "¼ lb ground turkey or beef", "½ cup tomato sauce", "Italian seasoning", "A side salad"],
    steps: ["Cook the spaghetti.", "Brown the meat in a pan, then stir in the sauce and seasoning and simmer 5 minutes.", "Spoon it over the pasta. Salad on the side."],
    why: "Classic athlete fuel: pasta for energy and meat for muscle repair.",
  },
  {
    name: "Salmon, Rice & Green Beans",
    minutes: 25,
    ingredients: ["1 salmon fillet", "1 cup cooked rice", "1 cup green beans", "1 lemon wedge", "Salt, pepper and a little olive oil"],
    steps: ["Heat the oven to 400°F (200°C).", "Put the salmon and green beans on a baking sheet, drizzle with oil and season.", "Bake 12 to 15 minutes. Squeeze lemon on top and serve with rice."],
    why: "Salmon has protein and omega-3 fats that help your body recover.",
  },
  {
    name: "Chicken Tacos",
    minutes: 20,
    ingredients: ["2 or 3 corn tortillas", "½ cup cooked chicken", "Taco seasoning", "Lettuce, tomato and cheese", "Salsa and avocado"],
    steps: ["Warm the chicken in a pan with a little taco seasoning and a splash of water.", "Warm the tortillas.", "Build your tacos with all the toppings."],
    why: "Fun to make, and every taco has protein, carbs and veggies.",
  },
  {
    name: "Beef & Broccoli Stir-Fry",
    minutes: 20,
    ingredients: ["¼ lb thinly sliced beef or chicken", "1½ cups broccoli", "1 tbsp soy sauce", "1 tsp honey", "1 clove garlic, minced", "1 cup cooked rice"],
    steps: ["Cook the meat in a hot pan with a little oil until browned. Take it out.", "Cook the broccoli and garlic for 3 to 4 minutes with a splash of water.", "Add the meat back with the soy sauce and honey. Serve over rice."],
    why: "Beef has iron and protein, and broccoli is loaded with vitamins.",
  },
  {
    name: "Homemade Naan Pizza",
    minutes: 15,
    ingredients: ["1 naan or pita", "¼ cup tomato sauce", "⅓ cup shredded mozzarella", "Toppings: peppers, mushrooms, chicken or turkey pepperoni", "A side salad"],
    steps: ["Heat the oven to 425°F (220°C).", "Spread sauce on the naan, add cheese and toppings.", "Bake 8 to 10 minutes, until the cheese bubbles."],
    why: "Pizza night, but with more protein and veggies than takeout.",
  },
  {
    name: "Turkey Burger & Sweet Potato Fries",
    minutes: 35,
    ingredients: ["1 turkey burger patty", "1 whole-wheat bun", "Lettuce and tomato", "1 sweet potato, cut into wedges", "1 tbsp olive oil, salt and paprika"],
    steps: ["Heat the oven to 425°F (220°C). Toss the wedges with oil and seasoning and bake about 25 minutes.", "Cook the patty in a pan about 5 minutes per side, until cooked all the way through.", "Build your burger and serve with the fries."],
    why: "Sweet potatoes have slow energy and vitamin A, and turkey is lean protein.",
  },
  {
    name: "Bean Chili",
    minutes: 30,
    ingredients: ["¼ lb ground turkey or beef", "½ can kidney beans, drained", "½ can diced tomatoes", "1 tsp chili powder and ½ tsp cumin", "Cheese and a spoon of yogurt on top"],
    steps: ["Brown the meat in a pot.", "Add the beans, tomatoes and spices. Simmer 20 minutes.", "Top with cheese and yogurt. Makes extra for tomorrow!"],
    why: "Beans and meat give you double protein, and it's perfect after a cold practice.",
  },
];

const SNACKS = [
  { name: "Apple + peanut butter", what: "1 apple, sliced, with 2 tbsp peanut butter for dipping", why: "Fiber and protein keep you full until dinner." },
  { name: "Trail mix", what: "A handful of nuts, raisins and a few chocolate chips", why: "Quick energy you can carry in your bag." },
  { name: "Cheese stick + grapes", what: "1 cheese stick and a cup of grapes", why: "Protein plus natural sugar for a quick boost." },
  { name: "Hummus + veggies", what: "¼ cup hummus with carrots, cucumbers and bell peppers", why: "Crunchy, filling and full of vitamins." },
  { name: "Yogurt + honey", what: "A cup of Greek yogurt with a drizzle of honey", why: "Lots of protein in one little cup." },
  { name: "Pre-workout banana", what: "1 banana, 30 to 60 minutes before you exercise", why: "Fast fuel that's easy on your stomach." },
  { name: "Eggs + tomatoes", what: "2 hard-boiled eggs and a handful of cherry tomatoes", why: "Make a batch of eggs on Sunday for the whole week." },
  { name: "Crackers + turkey", what: "Whole-grain crackers with a few slices of turkey", why: "Like a homemade snack pack, but better for you." },
];


/* 7. SIDE QUEST: THE BACKFLIP --------------------------------------
   Stages unlock one at a time. Stages 1 to 3 build every skill a
   backflip needs, safely at home. Stage 4, the real flip, is ONLY
   with a coach spotting you on mats. "demo" names a stick-figure
   demo in demos.js.                                                  */

const SIDE_QUEST = {
  name: "Backflip Quest",
  stages: [
    {
      title: "Build your launch pad",
      why: "A backflip starts with a big, explosive jump and a tight core.",
      tasks: [
        { id: "tuck10", text: "10 tuck jumps in a row (knees to your chest, land softly)", demo: "tuckJump" },
        { id: "hollow30", text: "Hold a hollow body for 30 seconds", demo: "hollowHold" },
        { id: "squat20", text: "20 squats with good form", demo: "squat" },
        { id: "reach10", text: "Jump and touch something high, 10 times in a row", demo: "setJump" },
      ],
    },
    {
      title: "Get comfy going backward",
      why: "Your body needs to learn that going upside down backward is okay.",
      where: "On a soft mat or thick carpet, with an adult nearby.",
      tasks: [
        { id: "bridge10", text: "Push up into a bridge and hold it for 10 seconds", demo: "bridgeBackbend" },
        { id: "backroll5", text: "5 backward rolls on a soft mat. Push with your hands so your neck stays safe.", demo: "backwardRoll" },
        { id: "rocks20", text: "20 hollow body rocks", demo: "hollowRock" },
      ],
    },
    {
      title: "Power and tuck",
      why: "A great backflip is a big jump straight UP, then a fast, tight tuck.",
      tasks: [
        { id: "tuck15", text: "15 tuck jumps in a row, knees all the way up", demo: "tuckJump" },
        { id: "set10", text: "Practice the \"set\": swing your arms up and jump straight up tall, 10 times", demo: "setJump" },
        { id: "hollow45", text: "Hold a hollow body for 45 seconds", demo: "hollowHold" },
      ],
    },
    {
      title: "The backflip (with a coach!)",
      coachOnly: true,
      why: "You've built the skills. Now a coach teaches you the flip safely, with mats and spotting.",
      where: "A gymnastics or tumbling class, a trampoline park class with an instructor, or ask your taekwondo instructor. Lots of dojangs teach flips!",
      tasks: [
        { id: "coach", text: "Find a coach who can spot you" },
        { id: "spotted", text: "Do a backflip with your coach spotting you, on mats" },
        { id: "solo", text: "Land a backflip on your own, when your coach says you're ready 🎉" },
      ],
    },
  ],
};


/* 8. MORE QUESTS ----------------------------------------------------
   Same idea as the Backflip Quest: stages that unlock one at a time.
   Every task id must be different from all the others (that's how
   your check marks are saved), so each quest's ids start the same.

   Code Quest tasks also have "steps" (how to do it) and sometimes
   "code" (a piece of code to copy).                                 */

const SPLITS_QUEST = {
  id: "splits",
  name: "Splits Quest",
  icon: "🧘",
  blurb: "Get flexible for higher, faster taekwondo kicks.",
  safety: "Only stretch when you're warm (after a workout is perfect). Go slow, never bounce, and stop if it hurts: a stretch should feel like a pull, not pain. Everyone's hips are different, so take your time!",
  stages: [
    {
      title: "Loosen up",
      why: "Flexibility comes from stretching a little bit, a lot of days in a row.",
      tasks: [
        { id: "split-butterfly", text: "Butterfly stretch for 30 seconds", demo: "butterfly" },
        { id: "split-hamstring", text: "Hamstring stretch, 30 seconds each leg", demo: "hamstringStretch" },
        { id: "split-lunge", text: "Low lunge stretch (front knee bent, back knee down), 30 seconds each side", demo: "lunge" },
        { id: "split-swings", text: "Leg swings, 10 each leg", demo: "legSwings" },
      ],
    },
    {
      title: "Go deeper",
      why: "Now hold stretches a little longer, and do them most days.",
      tasks: [
        { id: "split-half", text: "Half splits (kneel, front leg straight, lean forward), 30 seconds each leg", demo: "hamstringStretch" },
        { id: "split-side", text: "Side lunge stretch, 20 seconds each side", demo: "sideLunge" },
        { id: "split-pancake", text: "Pancake: sit with your legs wide and lean forward, 30 seconds", demo: "butterfly" },
        { id: "split-week", text: "Stretch on 5 different days in one week" },
      ],
    },
    {
      title: "Almost there",
      why: "Use books or yoga blocks under your hands so you can go lower safely.",
      tasks: [
        { id: "split-blocks", text: "Front splits with your hands on books or blocks, 30 seconds each leg" },
        { id: "split-middle", text: "Middle splits halfway down, 30 seconds" },
        { id: "split-kicks", text: "10 slow kicks as high as your shoulder, each leg", demo: "slowKicks" },
      ],
    },
    {
      title: "Splits!",
      why: "Slow and steady wins. It can take months, and that's normal!",
      tasks: [
        { id: "split-front1", text: "Front splits all the way down, on your best leg" },
        { id: "split-front2", text: "Front splits on your other leg too" },
        { id: "split-head", text: "Kick higher than your head, with control, 5 times each leg", demo: "slowKicks" },
      ],
    },
  ],
};

const HANDSTAND_QUEST = {
  id: "handstand",
  name: "Handstand Quest",
  icon: "🙃",
  blurb: "Build strong shoulders and learn to balance upside down.",
  safety: "Practice on grass or a soft mat, away from furniture, with an adult nearby. Never kick up hard. If you start to tip over, turn sideways and step down (a \"cartwheel bail\").",
  stages: [
    {
      title: "Strong shoulders",
      why: "Your arms hold your whole body in a handstand, so they need to be strong.",
      tasks: [
        { id: "hand-plank", text: "Hold a high plank (straight arms) for 30 seconds", demo: "plank" },
        { id: "hand-pike", text: "8 pike push-ups (hips up high, head toward the floor)", demo: "inchworm" },
        { id: "hand-inchworm", text: "5 inchworms", demo: "inchworm" },
        { id: "hand-bear", text: "Bear crawl forward and back for 20 seconds" },
      ],
    },
    {
      title: "Upside down at the wall",
      why: "The wall holds you up while your body learns what upside down feels like.",
      tasks: [
        { id: "hand-bail", text: "Practice the cartwheel bail: from a lunge, hands down, turn sideways and step out", demo: "lunge" },
        { id: "hand-wallwalk", text: "Wall walk: feet on the wall, walk up halfway and hold 10 seconds" },
        { id: "hand-wallhold", text: "Chest-to-wall handstand hold, 20 seconds" },
      ],
    },
    {
      title: "Kick up",
      why: "Kick up gently, with straight arms and your eyes on your hands.",
      tasks: [
        { id: "hand-kick", text: "Kick up to a handstand with your back to the wall, hold 15 seconds" },
        { id: "hand-kick30", text: "Hold it against the wall for 30 seconds" },
        { id: "hand-tap", text: "Kick up, tap the wall with your heels and come down softly, 10 times" },
      ],
    },
    {
      title: "Free handstand",
      why: "No wall! Squeeze everything tight and push the floor away.",
      tasks: [
        { id: "hand-free3", text: "Balance for 3 seconds without the wall" },
        { id: "hand-free10", text: "Balance for 10 seconds" },
        { id: "hand-walk", text: "Walk 3 steps on your hands 🎉" },
      ],
    },
  ],
};

const PUSHUP_QUEST = {
  id: "pushups",
  name: "100 Push-ups Quest",
  icon: "💪",
  blurb: "From your first real push-up all the way to 100 in a day.",
  safety: "Good form beats more reps: body straight like a plank, elbows at an angle (not straight out to the sides). Rest a day between hard push-up days.",
  stages: [
    {
      title: "Perfect form",
      why: "Every great push-up starts with a straight body and slow, controlled reps.",
      tasks: [
        { id: "push-incline", text: "10 incline push-ups with a perfectly straight body", demo: "inclinePushup" },
        { id: "push-slow", text: "5 slow push-ups on your knees (3 seconds down)", demo: "pushup" },
        { id: "push-hold", text: "Hold the top of a push-up for 30 seconds", demo: "plank" },
        { id: "push-5", text: "5 real push-ups in a row", demo: "pushup" },
      ],
    },
    {
      title: "Building up",
      why: "Sets with short rests let you do more reps than you could all at once.",
      tasks: [
        { id: "push-10", text: "10 push-ups in a row", demo: "pushup" },
        { id: "push-sets", text: "3 sets of 8 push-ups, resting 1 minute between", demo: "pushup" },
        { id: "push-15", text: "15 push-ups in a row", demo: "pushup" },
      ],
    },
    {
      title: "Strong",
      why: "You're getting seriously strong. The beat trainer is great practice for this!",
      tasks: [
        { id: "push-20", text: "20 push-ups in a row", demo: "pushup" },
        { id: "push-50day", text: "50 push-ups in one day (as many sets as you need)", demo: "pushup" },
        { id: "push-25", text: "25 push-ups in a row", demo: "pushup" },
      ],
    },
    {
      title: "Century club",
      why: "100 push-ups in a day. Most grown-ups can't do that!",
      tasks: [
        { id: "push-30", text: "30 push-ups in a row", demo: "pushup" },
        { id: "push-100day", text: "100 push-ups in one day (as many sets as you need)", demo: "pushup" },
        { id: "push-40", text: "40 push-ups in a row 🎉", demo: "pushup" },
      ],
    },
  ],
};

const JUGGLING_QUEST = {
  id: "juggling",
  name: "Juggling Quest",
  icon: "⚽",
  blurb: "Keep the ball up! Great touch makes you better at every part of soccer.",
  safety: "Juggle outside or somewhere with lots of space, away from windows and anything breakable!",
  stages: [
    {
      title: "First touches",
      why: "Kick with your laces, ankle locked, and keep the ball low.",
      tasks: [
        { id: "jug-drop", text: "Drop the ball, kick it up once and catch it, 10 times (right foot)", demo: "juggle" },
        { id: "jug-left", text: "Same thing with your left foot, 10 times", demo: "juggle" },
        { id: "jug-5bounce", text: "5 touches in a row (one bounce allowed between touches)", demo: "juggle" },
      ],
    },
    {
      title: "Keep it up",
      why: "Now no bounces. Small, soft touches are the secret.",
      tasks: [
        { id: "jug-10", text: "10 juggles in a row", demo: "juggle" },
        { id: "jug-thigh", text: "10 thigh juggles in a row" },
        { id: "jug-both", text: "10 juggles in a row, switching feet each time", demo: "juggle" },
      ],
    },
    {
      title: "Show off",
      why: "Mix up your touches like a freestyler.",
      tasks: [
        { id: "jug-25", text: "25 juggles in a row", demo: "juggle" },
        { id: "jug-mix", text: "Foot, thigh, foot, thigh: 10 touches in a row" },
        { id: "jug-stall", text: "Catch the ball on top of your foot (a \"foot stall\") for 2 seconds" },
      ],
    },
    {
      title: "Freestyle master",
      why: "This takes lots of practice. Every day counts!",
      tasks: [
        { id: "jug-50", text: "50 juggles in a row", demo: "juggle" },
        { id: "jug-head", text: "10 juggles in a row using only your weaker foot" },
        { id: "jug-100", text: "100 juggles in a row 🎉", demo: "juggle" },
      ],
    },
  ],
};

const CODE_QUEST = {
  id: "code",
  name: "Code Quest",
  icon: "💻",
  code: true, // tasks are worth more XP, and they have "How to" steps
  blurb: "Change your own website with real code. Every task makes the site more YOURS.",
  safety: "If something breaks, don't panic! Press Ctrl+Z (undo) in VS Code, or ask Claude for help. Breaking things and fixing them is how every coder learns.",
  stages: [
    {
      title: "Your first changes",
      why: "Open your learning-to-code folder in VS Code, and start Live Server so you can see your changes.",
      tasks: [
        {
          id: "code-color",
          text: "Change your website's main color",
          steps: [
            "In VS Code, open style.css (the one in the main folder, not in level-up).",
            "Near the top, find the line that starts with --accent.",
            "Change the color code to a new one, like #d6336c (pink) or #0f8a6a (green).",
            "Save (Ctrl+S) and look at your page. Every link and button changed!",
          ],
          code: "--accent: #d6336c;",
        },
        {
          id: "code-log",
          text: "Add an entry to the learning log on your website",
          steps: [
            "Open index.html (in the main folder).",
            "Find the LEARNING LOG section.",
            "Copy one whole <li class=\"log__entry\"> ... </li> block and paste it at the top of the list.",
            "Change the date and write what you learned. Save and check your page.",
          ],
        },
        {
          id: "code-push",
          text: "Put your change online with GitHub Desktop",
          steps: [
            "Open GitHub Desktop. It shows the files you changed.",
            "At the top, check that the branch is claude/modest-thompson-kgizz2 (that's the one your website uses).",
            "Bottom left: type a short summary, like \"Changed my colors\", and click Commit.",
            "Click Push origin. In a few minutes, your real website shows the change!",
          ],
        },
      ],
    },
    {
      title: "Make Level Up yours",
      why: "Level Up is built from lists of information. Add to a list, and the page grows!",
      tasks: [
        {
          id: "code-drink",
          text: "Add your own drink recipe",
          steps: [
            "Open level-up/plan.js and find: const DRINKS = [",
            "Copy one whole recipe, from its { to its },",
            "Paste it right after, then change the name, ingredients, steps and why.",
            "Save. Your drink now shows up in the drink of the day mix!",
          ],
        },
        {
          id: "code-question",
          text: "Add your own quiz question",
          steps: [
            "Open level-up/quiz-questions.js and pick a subject.",
            "Copy one question line (from { to },) and paste it below.",
            "Change the question, answers, why and fix. The RIGHT answer goes first!",
            "Save, then play that subject until your question shows up.",
          ],
          code: '{ q: "What is my favorite sport?", a: ["Soccer", "Golf", "Chess", "Bowling"], why: "Obviously!", fix: "10 squats" },',
        },
        {
          id: "code-badge",
          text: "Make your own badge",
          steps: [
            "Open level-up/trophies.js and find: const BADGES = [",
            "Copy one badge line and paste it at the end of the list.",
            "Give it a new id, icon, name and how. The \"earned\" part is the rule.",
            "Example: earned when you have 2,000 XP. Save and check your trophy case!",
          ],
          code: '{ id: "myBadge", icon: "🦁", name: "Lion Heart", how: "Get 2,000 XP", earned: (s) => s.xp >= 2000 },',
        },
      ],
    },
    {
      title: "Game designer",
      why: "Games are just rules written in code. Change the rules, change the game!",
      tasks: [
        {
          id: "code-bugbash",
          text: "Change a Bug Bash rule",
          steps: [
            "Open bug-bash/game.js and find RULES near the top.",
            "Try changing startingTests (your lives) or how many points a golden bug is worth.",
            "Save, refresh the game and see how it feels.",
          ],
        },
        {
          id: "code-boss",
          text: "Invent a new weekly boss",
          steps: [
            "Open level-up/boss.js and find: const BOSSES = [",
            "Copy one boss and paste it at the end of the list.",
            "Give it a name, an emoji and a funny line. It joins the weekly rotation!",
          ],
          code: '{ name: "The Homework Hydra", emoji: "🐉", line: "Grows two new worksheets for every one you finish!" },',
        },
        {
          id: "code-xp",
          text: "Change how much XP something gives",
          steps: [
            "Open level-up/trophies.js and find XP_RULES.",
            "Change a number, like water: 5 to water: 10.",
            "Save and refresh. Watch your XP jump! (Change it back if it feels like cheating 😄)",
          ],
        },
      ],
    },
    {
      title: "Real coder",
      why: "Now you're writing code from scratch, like a pro.",
      tasks: [
        {
          id: "code-console",
          text: "Write your first function in the browser console",
          steps: [
            "Open any page of your website in Chrome or Edge and press F12. Click the Console tab.",
            "Type the code below and press Enter.",
            "Then type double(21) and press Enter. It answers 42!",
            "Try making a function that triples a number.",
          ],
          code: "function double(n) {\n  return n * 2;\n}",
        },
        {
          id: "code-page",
          text: "Build a brand-new page: an \"About me\" page",
          steps: [
            "In VS Code, make a new file in the main folder called about.html.",
            "Copy the code below into it, then change the words to be about you.",
            "Open it with Live Server. Then add a link to it from index.html: <a href=\"about.html\">About me</a>",
          ],
          code: "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>About me</title>\n  <link rel=\"stylesheet\" href=\"style.css\">\n</head>\n<body>\n  <h1>About me</h1>\n  <p>I like soccer, swimming and taekwondo!</p>\n</body>\n</html>",
        },
        {
          id: "code-idea",
          text: "Build a new feature of your own idea with Claude",
          steps: [
            "Think of something you wish your website had.",
            "Tell Claude your idea, and ask it to explain each step so you can type some of it yourself.",
            "Test it, commit it and push it. You built a feature!",
          ],
        },
      ],
    },
  ],
};

// Every quest on the Quest Board, in order
const QUESTS = [
  { id: "backflip", icon: "🤸", blurb: "Learn every skill a backflip needs, then flip with a coach.", safety: "Never try a backflip alone, on a hard floor, or on a bed or trampoline without a coach. Stages 1 to 3 are safe to practice at home. The real flip happens only in stage 4, with a coach spotting you on mats.", ...SIDE_QUEST },
  SPLITS_QUEST,
  HANDSTAND_QUEST,
  PUSHUP_QUEST,
  JUGGLING_QUEST,
  CODE_QUEST,
];
