# learning-to-code

My personal website, where I keep track of learning to code. It's made of
plain HTML, CSS and JavaScript, with no frameworks and no build tools, so
every line can be opened, read and changed.

## What's in this folder

| File          | What it does                                                         |
| ------------- | -------------------------------------------------------------------- |
| `index.html`  | The **content**: every heading, paragraph, link and list on the page |
| `style.css`   | The **look**: colors, fonts, spacing and layout                      |
| `script.js`   | The **behavior**: the theme button, the Run button, the playground   |
| `favicon.svg` | The little icon in the browser tab                                   |
| `bug-bash/`   | **Bug Bash**, a little game (see below)                              |
| `level-up/`   | **Level Up**, my daily workout and healthy food plan (see below)     |

Every file is full of comments that explain what each part does. Reading them
from top to bottom is a good way to learn how the site works.

## Bug Bash: the game

Open `bug-bash/index.html` to play. Bugs crawl down a code editor, and you
squash them before they reach production. Golden bugs are worth extra points.
Don't squash the features! Every 20 seconds a new "version" comes out and
the bugs get faster.

The game is drawn on a `<canvas>` by `bug-bash/game.js`. The easiest thing to
change is the `RULES` list near the top of that file: give yourself more tests,
make golden bugs worth more, or make new versions come out faster. Save,
refresh, and see how the game feels.

## Level Up: workouts and healthy food

Open `level-up/index.html`. Every day has a no-equipment workout, a healthy
drink and meals (breakfast, lunch, dinner and a snack). It opens on today, and
the **Next day** button moves through the week. The workouts get a little
harder every week for 12 weeks, and the food changes every day.

- `level-up/plan.js` holds all the exercises and recipes. Add your own
  favorite meal or change a workout there.
- Each day ends with **sport skills** for swimming, soccer or taekwondo.
- **Expert mode** (the flame button at the top) turns the whole page red and
  makes workouts way harder: 5 levels ahead, an extra round and shorter rests.
  The `EXPERT` setting in `plan.js` controls how much harder it gets.
- **Gym test prep:** the `TEST` setting in `plan.js` holds the date of my
  push-up and curl-up test. Until then, the page shows a countdown, a practice
  plan and a **beat trainer** that beeps one rep every 3 seconds (like the real
  test) and saves my best scores. For a new test, just change the date.
- `level-up/app.js` builds each day's page and runs the timer and buttons.

Your progress (which days you marked done, and your week) is saved in your
browser, so it stays on the computer or phone where you use it.

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
