# learning-to-code

My personal website, where I keep track of learning to code. It's made of
plain HTML, CSS and JavaScript, with no frameworks and no build tools, so
every line can be opened, read and changed.

## What's in this folder

| File          | What it does                                                         |
| ------------- | -------------------------------------------------------------------- |
| `index.html`  | The **content**: every heading, paragraph, link and list on the page |
| `style.css`   | The **look**: colors, fonts, spacing and layout                      |
| `script.js`   | The **behavior**: the theme button, the Run button, the roadmap      |
| `playground.js` | The **Code Playground**: HTML + JavaScript, with coding challenges |
| `favicon.svg` | The little icon in the browser tab                                   |
| `bug-bash/`   | **Bug Bash**, a little game (see below)                              |
| `level-up/`   | **Level Up**, my workouts, games, quiz and healthy food (see below)  |
| `kickoff/`    | **Kickoff**, my sister's soccer version of Level Up (see below)      |

Every file is full of comments that explain what each part does. Reading them
from top to bottom is a good way to learn how the site works.

## The Code Playground

At the bottom of the main page. Type HTML in `index.html` and the preview
updates as you type. Switch to `script.js` to write JavaScript, then press
**Run** (or Ctrl + Enter). Whatever `console.log` prints shows up in the
**console** under the preview, and so do errors (with the line number).

There are 12 **coding challenges**, from "make a heading" to FizzBuzz. Press
**Check my code** to see if you did it. Your code runs in a sandboxed
`<iframe>`, so it can't break the rest of the site, and a loop guard stops
infinite loops before they freeze the page.

## Bug Bash: the game

Open `bug-bash/index.html` to play. Bugs crawl down a code editor, and you
squash them before they reach production. Golden bugs are worth extra points.
Don't squash the features! Every 20 seconds a new "version" comes out and
the bugs get faster.

Every few versions a big purple **boss bug** shows up. Tap it lots! Catch
**power-ups** as they float down: ❄️ freeze, ⭐ double points and 🛡️ shield.
The **daily challenge** has a special rule each day, like Golden Day or
Boss Rush, with its own best score.

The **🗺️ World Map** has 10 levels in 3 worlds (`bug-bash/levels.js`). Each
level has a goal, like "squash 20 bugs", and up to 3 stars. New bugs show
up along the way: **splitters** split into two little bugs, **ghosts** fade
in and out, and **armored** bugs need 2 taps. Level 10 is the final boss:
the **👑 Mega Bug**, which calls for help and turns into a ghost when it's hurt!

The game is drawn on a `<canvas>` by `bug-bash/game.js`. The easiest thing to
change is the `RULES` list near the top of that file: give yourself more tests,
make golden bugs worth more, or make new versions come out faster. Save,
refresh, and see how the game feels.

## Level Up: workouts, games and healthy food

Open `level-up/index.html`. It's split into **tabs** along the top. A link
like `level-up/#quiz` opens straight to one tab.

- **🏠 Today:** the day's no-equipment workout (it gets a little harder
  every week for 12 weeks), a healthy drink and meals, water, sleep and an
  energy check-in, 3 **daily missions**, the **weekly boss** (every rep you
  do hits it) and **Ask Coach** (Claude answers, on the Claude version).
  Today's plan from your calendar shows at the top, and so do **seasonal
  events**: Spring Training (April), Summer Splash (July), Spooky Sprint
  (October) and the **Winter Games** (December), each with challenges,
  a badge and something falling down the page.
  - **Expert mode** (the flame button) turns the page red and makes
    workouts way harder. **Did not do workout** and **Did not try it**
    buttons, drink ratings from 1 to 10, gym test prep with the beat
    trainer, and a **guided workout** with a voice coach.
- **➕ Extra:** 19 bonus workouts for any time, sorted by goal (energy,
  abs, strength, legs, speed, my sports, test prep, stretching, quick).
  Each one says what it works. They match your week's level, and in
  expert mode they get way harder. The voice coach can run any of them.
- **🗺️ Quests:** the monthly challenge, and the **Quest Board**: Backflip
  (the real flip only with a coach!), Splits, Handstand, 100 Push-ups,
  Juggling and **Code Quest**, which teaches you to change this website.
- **🎮 Arcade:** the **Mystery Box** (one surprise a day: coins, XP, a
  bonus challenge, pet treats or a rare hat), **Penalty Shootout** (aim,
  time the power, beat the goalie; workouts give bonus shots), **Goalie
  Reflexes** (your reaction time in milliseconds), **Board Break**, **Memory
  Match** (match the moves, then do them!), **Sister Duel** (pass-and-play
  battles on one iPad), card deck workout, Kick Caller, a daily
  spin-the-wheel challenge, and Bug Bash power-ups.
- **🧠 Quiz:** the Brain + Body Quiz: 5th-grade Math, Reading & Writing,
  Science and Social Studies, plus Sports and Food & Health. Get one
  wrong and you owe that question's exercise, like "10 squats"! Also: a
  **Spelling Bee** (the voice says the word), a 60-second **Times-Table
  Sprint**, **Korean Flashcards** for taekwondo words, **Make Your Own
  Quiz**, a **Homework Timer** with move breaks and a **fact of the day**.
- **🥋 Sports:** taekwondo belt tracker in my school's belt order (with
  counting in Korean), Swim School (check off the skills from my swim
  lessons and log each lesson), soccer journal, a workout builder the
  voice coach can run, and your practice days.
- **🎓 Training:** 64 taekwondo and soccer lessons on 3 pages per sport
  that get harder (Basics, then Combos & spins or Skills & moves, then
  Black belt path or Pro moves). Each has steps, mistakes to watch out
  for, a practice drill and a pro tip. Tap **Teach me** and the voice
  coach teaches it out loud. Already know a page? Tap **I already know
  all of these** to unlock the next one. Plus a **Game Day Warm-Up**
  (before a game, swim lesson or belt test), the **Monthly Fitness Test**
  with a report card, **My Goals**, a **Muscle Map** of what you worked
  this week, and a **Sore Muscle Helper**. The "Show me" pop-up has
  **slow motion** and **mirror** buttons.
- **🍓 Kitchen:** Smoothie Lab (it invents a name and recipe), a Recipe
  Book with search and favorites, Snack Swap and the grocery list.
- **📊 Stats:** XP, levels and 80 badges, a 40-sticker **Sticker Album**,
  progress charts, a year-long workout calendar, personal records, energy
  patterns, a "year in review" and a stats card picture to save.
- **🐾 Pet & Shop:** a pet that hatches after your first workout and
  grows as you train. It dresses like the sport you do most, learns
  **tricks** from your streaks, eats Mystery Box treats and has a **room**
  you can decorate. Make your own **avatar** (it shows at the top of the
  page). 10 XP = 1 coin: buy page themes, pet hats, pet colors and
  stick-figure colors. And there are 6 **secret Easter eggs** to find... 🤫
- **👪 Family:** a weekly family challenge. Add your family and race!
- **🧰 Tools:** **My Calendar** (practices, games and tests, even ones that
  repeat every week), a **Packing Checklist**, a **Bedtime Routine**, a
  **Weekly Report Card**, **Backup** (save your progress to a file) and the
  **App Icon**: put Level Up on your iPad's home screen like a real app.

Each feature has its own file, so they're easy to find:

| File | What it does |
| --- | --- |
| `plan.js` | Exercises, the weekly plan, recipes and all the quests (just information) |
| `quiz-questions.js` | Every quiz question. Add your own! (The right answer goes first.) |
| `app.js` | Builds each day's page, saving, syncing, the timer and the beat trainer |
| `tabs.js` | The tabs along the top |
| `trophies.js` | XP, levels and badges. Change `XP_RULES` to give more or less XP |
| `coach.js` | The guided workout with the voice coach |
| `demos.js` | The animated stick figures ("Show me" buttons) |
| `extra.js` | The Extra tab's bonus workouts. Add your own! |
| `quest.js` | The Quest Board |
| `missions.js` | Daily missions and the monthly challenge |
| `boss.js` | The weekly boss. Add your own boss to `BOSSES`! |
| `hooks.js` | How the newer feature files plug into the page (pages, XP, badges, saved data) |
| `quiz.js` | The Brain + Body Quiz |
| `brain.js`, `brain-data.js` | Spelling Bee, Times-Table Sprint, Korean Flashcards, Make Your Own Quiz, Homework Timer and the fact of the day (words and facts in `brain-data.js`) |
| `games.js` | Penalty Shootout, Goalie Reflexes, Board Break, Memory Match, Mystery Box and Sister Duel |
| `training-plus.js` | Game Day Warm-Up, Monthly Fitness Test, My Goals, Muscle Map, Sore Muscle Helper and demo controls |
| `pet-plus.js` | Pet sport forms, tricks, treats and the pet room |
| `fun.js` | Sticker Album, My Avatar, seasonal events and secret Easter eggs |
| `tools.js` | The Tools tab: calendar, packing, bedtime, report card, backup and the app icon |
| `manifest.webmanifest`, `icons/` | What makes Level Up work as a home screen app |
| `training-lessons.js`, `training.js` | The Training lessons (add your own!) and the Training tab |
| `arcade.js` | Card deck workout, Kick Caller and spin the wheel |
| `kitchen.js` | Smoothie Lab, Recipe Book and Snack Swap |
| `sports.js` | Belt tracker, Swim School, soccer journal and workout builder |
| `stats.js` | Energy check-in, calendar, records, year in review and stats card |
| `family.js` | The family challenge |
| `pet.js`, `shop.js` | Your pet and the coin shop |
| `practice.js`, `habits.js`, `charts.js`, `grocery.js`, `ai-coach.js` | Practice days, water and sleep, charts, the grocery list and Ask Coach |

Your progress is saved in your browser. On the Claude version of the page,
it's also saved to your Claude account, so it's the same on every device.

## How to look at the site on your computer

1. Download this folder (on GitHub: the green **Code** button, then **Download ZIP**) and unzip it.
2. Double-click `index.html`. It opens in your web browser.
3. Change something in a file, save it, and refresh the browser to see the change.

A free code editor such as [Visual Studio Code](https://code.visualstudio.com/)
makes editing much nicer than Notepad or TextEdit: it colors the code and
catches typos.

## Good first changes to try

Start with these. Each one teaches something different.

1. **Update your roadmap** (HTML). In `index.html`, find the `ROADMAP` section.
   When you finish a step, change its label to
   `<span class="status" data-status="done">Done</span>`.
   The progress bar updates by itself, because `script.js` counts the "done" steps.
2. **Add a learning log entry** (HTML). In the `LEARNING LOG` section, copy a
   whole `<li class="log__entry"> ... </li>` block, paste it at the top of the
   list, and change the date and the words.
3. **Change the main color** (CSS). At the top of `style.css`, change
   `--accent: #2c46d1;` to another color, like `#d6336c` (pink) or `#0f8a6a` (green).
   Every link and button changes at once.
4. **Change the highlighter** (CSS). Change `--marker: #ffe24d;` to a new color.
5. **Change what the Run button prints** (HTML + a bit of JavaScript). In the hero
   section, edit the `learning` list in the code *and* the matching lines in
   the console below it, so the output still matches the program.
6. **Add a new idea** to "Ideas I want to build next", then build it!

If something breaks, don't panic. Press undo (Ctrl+Z / Cmd+Z) in your
editor, or look at the last version on GitHub.

## Putting the site online with GitHub Pages

GitHub can host this site for free at
`https://codenoob770.github.io/learning-to-code/`.

1. **Get the files onto the `main` branch.** Right now they're on a separate
   branch. Open a pull request on GitHub and merge it into `main`.
2. **Check the repo's visibility.** This repo is currently *private*. Free
   GitHub accounts can only use GitHub Pages with *public* repos. You have two options:
   - Make the repo public: **Settings → General →** scroll to **Danger Zone →
     Change visibility**. (This also makes the "See the source code" link on
     the site work for visitors.)
   - Or keep it private, which needs a paid GitHub plan (such as GitHub Pro).
3. **Turn on Pages:** **Settings → Pages →** under **Build and deployment**, set
   **Source** to **Deploy from a branch**, pick **main** and **/ (root)**, then **Save**.
4. Wait a minute or two, then visit `https://codenoob770.github.io/learning-to-code/`.

After that, every change you push to `main` updates the live site automatically.

## Free places to keep learning

- [MDN: Learn web development](https://developer.mozilla.org/en-US/docs/Learn_web_development): clear guides to HTML, CSS and JavaScript from the people who document the web
- [freeCodeCamp](https://www.freecodecamp.org/learn): interactive lessons right in the browser
- [The Odin Project](https://www.theodinproject.com/): a full path from beginner to building real projects
- [web.dev: Learn HTML](https://web.dev/learn/html) and [Learn CSS](https://web.dev/learn/css): short, well-made courses from Google

## Kickoff: my sister's soccer site

Open `kickoff/index.html`. It's a copy of Level Up, made just for soccer:

- Soccer workouts every day, plus skills inspired by Lamine Yamal and Neymar
  (cut-and-go, step-overs, sole rolls, wall passes, juggling)
- A soccer-pitch look, soccer badges and ranks, and a player card with her name
- A push-up and curl-up challenge with the beat trainer
- `DIFFICULTY` at the top of `kickoff/plan.js` sets how hard it is
  (0.75 means it starts a bit easier). The "Too easy?" button works too.
- Her progress is saved separately from Level Up's, even on the same device.
- **Tabs** along the top, with four tabs that come straight from Level Up:
  - **🧠 Brain:** the Brain + Body Quiz, Spelling Bee, Times-Table Sprint,
    Make Your Own Quiz, the Homework Timer and the fact of the day
  - **🎮 Games:** Penalty Shootout, Goalie Reflexes, Board Break, Memory
    Match, the Mystery Box and a Family Duel
  - **🎓 Training:** soccer (and taekwondo) lessons with the voice coach, Game
    Day Warm-Up, the Monthly Fitness Test, My Goals, the Muscle Map and
    the Sore Muscle Helper
  - **🐾 Pet & Shop:** her own pet (with sport forms, tricks and a room), an
    avatar, the coin shop, secret Easter eggs and the Sticker Album

Those four tabs load their files from `level-up/` (look for `../level-up/` in
`kickoff/index.html`), so both sites get every new feature and bug fix.
`kickoff/bridge.js` adds the few things those files need. Kickoff saves
everything with `kickoff.` names (see `storeKey` in `kickoff/app.js`).

It's a fan-made page, not connected to the players or their teams.
