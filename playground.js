/* =============================================================
   playground.js: the Code Playground
   -------------------------------------------------------------
   Write HTML and JavaScript, then see them work right away.

   1. Code that the playground starts with, and the "Add" buttons
   2. Challenges: little coding missions to try
   3. Running your code (safely, in a sandbox)
   4. The console (what console.log prints)
   5. Buttons, tabs and typing

   HOW IT STAYS SAFE: your code runs inside an <iframe> with the
   "sandbox" attribute. That's a walled-off mini page. Code in there
   can't see or change the rest of my website. The frame sends
   messages back with postMessage (like what console.log printed).
   ============================================================= */

const playground = document.querySelector("#playground-frame");

if (playground) {
  /* 1. STARTER CODE AND THE "ADD" BUTTONS ------------------------------ */

  const STARTER_HTML = `<h2>Hello from the playground!</h2>
<p>Change this text and watch the preview update.</p>
<p>Try making a word <strong>bold</strong> or <em>italic</em>.</p>
<ul>
  <li>HTML</li>
  <li>CSS</li>
  <li style="color: tomato">JavaScript</li>
</ul>
<button>Click me</button>
`;

  const STARTER_JS = `// JavaScript makes the page DO things.
// Press ▶ Run to run it!
const name = "codenoob770";
console.log("Hello, " + name + "!");

const button = document.querySelector("button");
if (button) {
  button.addEventListener("click", () => {
    document.querySelector("h2").textContent = "You clicked the button! 🎉";
  });
}
`;

  const SNIPPETS = {
    html: {
      Heading: "<h3>A brand new heading</h3>\n",
      Link: '<a href="https://developer.mozilla.org/en-US/docs/Learn_web_development" target="_blank">Learn web development on MDN</a>\n',
      Button: "<button>Click me</button>\n",
      List: "<ul>\n  <li>One</li>\n  <li>Two</li>\n  <li>Three</li>\n</ul>\n",
    },
    js: {
      "console.log": 'console.log("Hello!");\n',
      "for loop": "for (let i = 1; i <= 5; i++) {\n  console.log(i);\n}\n",
      "On click": 'document.querySelector("button").addEventListener("click", () => {\n  console.log("Clicked!");\n});\n',
      "Random pick": 'const moves = ["squats", "push-ups", "jumping jacks"];\nconst pick = moves[Math.floor(Math.random() * moves.length)];\nconsole.log("Do 10 " + pick + "!");\n',
    },
  };


  /* 2. CHALLENGES ---------------------------------------------------------
     "check" is a little bit of JavaScript that runs inside the preview
     after your code. It can use "document", "logs" (everything
     console.log printed) and "code" (your JavaScript), and it gives
     back true when the challenge is done.                           */

  const CHALLENGES = [
    { id: "h1", type: "HTML", title: "My first heading", task: "Make an <h1> heading with your name in it.",
      hint: "Type <h1>, then your name, then </h1>.",
      html: "<!-- Write your heading on the next line -->\n", js: "",
      check: `const h = document.querySelector("h1"); return Boolean(h && h.textContent.trim());` },
    { id: "list", type: "HTML", title: "Sports list", task: "Make a list (<ul>) with at least 3 of your favorite sports.",
      hint: "<ul> starts the list, and each sport goes in its own <li>...</li>.",
      html: "<h2>My favorite sports</h2>\n", js: "",
      check: `return document.querySelectorAll("ul li").length >= 3;` },
    { id: "link", type: "HTML", title: "Link it up", task: "Add a link (<a>) to any website.",
      hint: 'Like this: <a href="https://example.com">Click here</a>. The href is where it goes!',
      html: "<p>Here's a website I like:</p>\n", js: "",
      check: `return [...document.querySelectorAll("a")].some((a) => a.getAttribute("href"));` },
    { id: "color", type: "HTML", title: "Colorful", task: "Make some text a color, like tomato, gold or royalblue.",
      hint: 'Add style="color: tomato" inside a tag, like <p style="color: tomato">Hi!</p>',
      html: "<p>Make me colorful!</p>\n", js: "",
      check: `return [...document.querySelectorAll("[style]")].some((el) => /color\\s*:/.test(el.getAttribute("style"))) || [...document.querySelectorAll("style")].some((s) => /color\\s*:/.test(s.textContent));` },
    { id: "bold", type: "HTML", title: "Bold and italic", task: "Use <strong> for bold AND <em> for italic.",
      hint: "<strong>like this</strong> and <em>like this</em>",
      html: "<p>Taekwondo is awesome.</p>\n", js: "",
      check: `return Boolean(document.querySelector("strong") && document.querySelector("em"));` },
    { id: "hello", type: "JavaScript", title: "Hello, console!", task: "Use console.log to say hello.",
      hint: 'console.log("Hello!"); then press ▶ Run.',
      html: "<p>Look at the console under the preview!</p>\n", js: "// Write your code below\n",
      check: `return logs.some((line) => /hello/i.test(line));` },
    { id: "math", type: "JavaScript", title: "Math whiz", task: "Use console.log to print 12 times 12. (In JavaScript, times is *)",
      hint: "console.log(12 * 12);",
      html: "", js: "// Let JavaScript do the math!\n",
      check: `return logs.some((line) => line.includes("144")) && /\\*/.test(code);` },
    { id: "count", type: "JavaScript", title: "Count to 10", task: "Use a for loop to print the numbers 1 to 10.",
      hint: "for (let i = 1; i <= 10; i++) { console.log(i); }",
      html: "", js: "// A loop runs the same code again and again\n",
      check: `const numbers = logs.map(Number); return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].every((n) => numbers.includes(n)) && /for|while/.test(code);` },
    { id: "title", type: "JavaScript", title: "Change the title", task: "Use JavaScript to change the title to anything else.",
      hint: 'document.querySelector("#title").textContent = "New title!";',
      html: '<h1 id="title">Old title</h1>\n', js: '// Find the title with document.querySelector("#title")\n',
      check: `const t = document.querySelector("#title"); return Boolean(t && t.textContent.trim() && t.textContent.trim() !== "Old title");` },
    { id: "click", type: "JavaScript", title: "Clicky button", task: "When the button is clicked, change the paragraph's text.",
      hint: 'document.querySelector("#go").addEventListener("click", () => { document.querySelector("#out").textContent = "Clicked!"; });',
      html: '<button id="go">Click me</button>\n<p id="out">Not clicked yet</p>\n', js: "// Listen for clicks on the button\n",
      check: `const button = document.querySelector("#go"); const out = document.querySelector("#out"); if (!button || !out) return false; button.click(); return out.textContent.trim() !== "Not clicked yet";` },
    { id: "random", type: "JavaScript", title: "Workout picker", task: "Make an array of exercises and print a random one.",
      hint: "Math.random() gives a number from 0 to 1. Try the \"Random pick\" button above!",
      html: "", js: "// An array is a list: [\"squats\", \"push-ups\"]\n",
      check: `return /Math\\.random/.test(code) && /\\[/.test(code) && logs.length > 0;` },
    { id: "fizz", type: "JavaScript", title: "FizzBuzz (hard!)", task: "Print 1 to 15, but print \"Fizz\" for multiples of 3, \"Buzz\" for multiples of 5, and \"FizzBuzz\" for both.",
      hint: "i % 3 === 0 means i divides by 3 with nothing left over. Check for 15 (both) first!",
      html: "", js: "for (let i = 1; i <= 15; i++) {\n  // Your code here\n}\n",
      check: `const want = ["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]; return logs.join("|").includes(want.join("|"));` },
  ];

  let doneChallenges = [];
  try {
    doneChallenges = JSON.parse(localStorage.getItem("playground.done") || "[]");
  } catch (error) {
    doneChallenges = []; // storage is blocked: progress just won't be remembered
  }
  let currentChallenge = null;


  /* 3. RUNNING YOUR CODE ----------------------------------------------------- */

  const htmlBox = document.querySelector("#playground-input");
  const jsBox = document.querySelector("#playground-js");
  const consoleBox = document.querySelector("#playground-console");
  let runNumber = 0;     // each run has a number, so old messages get ignored
  let typingTimer = null; // waits until you stop typing HTML for a moment
  let jsChanged = false; // edited the JavaScript since the last run?

  // An infinite loop would freeze the whole page! This puts a tiny
  // "loop guard" at the start of every loop. If a loop runs a million
  // times in one go, the guard stops it with an error message.
  function guardLoops(code) {
    let out = "";
    let i = 0;
    while (i < code.length) {
      const char = code[i];
      // Skip comments and strings: words like "for" in there aren't loops
      if (char === "/" && code[i + 1] === "/") {
        const end = code.indexOf("\n", i);
        const stop = end === -1 ? code.length : end;
        out += code.slice(i, stop);
        i = stop;
        continue;
      }
      if (char === "/" && code[i + 1] === "*") {
        const end = code.indexOf("*/", i + 2);
        const stop = end === -1 ? code.length : end + 2;
        out += code.slice(i, stop);
        i = stop;
        continue;
      }
      if (char === '"' || char === "'" || char === "`") {
        let j = i + 1;
        while (j < code.length && code[j] !== char) j += code[j] === "\\" ? 2 : 1;
        out += code.slice(i, j + 1);
        i = j + 1;
        continue;
      }
      const loop = /^(for|while|do)\b/.exec(code.slice(i, i + 6));
      if (loop && !/[\w$.]/.test(code[i - 1] || "")) {
        // Find the "{" that starts the loop's body
        let j = i + loop[1].length;
        if (loop[1] !== "do") {
          while (j < code.length && code[j] !== "(") j += 1;
          let depth = 0;
          for (; j < code.length; j++) {
            if (code[j] === "(") depth += 1;
            if (code[j] === ")") depth -= 1;
            if (depth === 0) break;
          }
          j += 1;
        }
        while (j < code.length && /\s/.test(code[j])) j += 1;
        if (code[j] === "{") {
          out += `${code.slice(i, j + 1)} __loopGuard();`;
          i = j + 1;
          continue;
        }
      }
      out += char;
      i += 1;
    }
    return out;
  }

  // Text inside a <script> can't contain "</script>", or the browser
  // would think the script ended early
  function safeScript(text) {
    return text.replace(/<\/script/gi, "<\\/script");
  }

  // Builds the mini page that runs inside the sandbox.
  // quiet = true turns pop-up boxes (alert) into console messages,
  // for the runs that happen by themselves while you type.
  function buildPage(quiet, check) {
    const helpers = `<script>
(function () {
  const run = ${runNumber};
  const send = (type, text) => parent.postMessage({ playground: true, run, type, text }, "*");
  const show = (value) => {
    if (typeof value === "string") return value;
    try { return JSON.stringify(value); } catch (error) { return String(value); }
  };
  window.__logs = [];
  for (const name of ["log", "info", "warn", "error"]) {
    console[name] = (...values) => {
      const text = values.map(show).join(" ");
      window.__logs.push(text);
      send(name === "error" || name === "warn" ? "error" : "log", text);
    };
  }
  ${quiet ? `window.alert = (text) => console.log("[alert] " + text); window.prompt = () => null; window.confirm = () => false;` : ""}
  window.addEventListener("error", (event) => {
    const line = event.lineno - __JS_START__;
    send("error", event.message + (line > 0 ? " (line " + line + ")" : ""));
  });
  let count = 0;
  window.__loopGuard = () => {
    if (count === 0) setTimeout(() => { count = 0; });
    count += 1;
    if (count > 1000000) throw new Error("A loop ran a million times! Is it an infinite loop?");
  };
  window.__send = send;
})();
<\/script>`;
    const style = `<style>
  body { margin: 0; padding: 14px 16px; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; line-height: 1.5; color: #151c2c; background: #ffffff; overflow-wrap: anywhere; }
  h1, h2, h3 { line-height: 1.15; margin: 0.6em 0 0.4em; }
  body > :first-child { margin-top: 0; }
  img { max-width: 100%; }
  button { padding: 0.5rem 1rem; border: 2px solid #2c46d1; border-radius: 6px; background: #2c46d1; color: #fff; font: inherit; font-weight: 700; cursor: pointer; }
</style>`;
    // Which line your JavaScript starts on, so error messages can say "line 3".
    // (__JS_START__ gets the real number once we've counted the lines.)
    const top = `<!DOCTYPE html><html><head><meta charset="utf-8">${style}${helpers}</head><body>
${htmlBox.value}
<script>
`;
    const jsStart = top.split("\n").length - 1;
    const checkScript = check
      ? `<script>
setTimeout(() => {
  let passed = false;
  try { passed = Boolean((function (logs, code) { ${check} })(window.__logs, ${safeScript(JSON.stringify(jsBox.value))})); } catch (error) { passed = false; }
  window.__send("result", passed ? "pass" : "fail");
}, 250);
<\/script>`
      : "";
    return `${top.replace("__JS_START__", String(jsStart))}${safeScript(guardLoops(jsBox.value))}
<\/script>${checkScript}</body></html>`;
  }

  function runCode({ quiet = false, check = null } = {}) {
    clearTimeout(typingTimer); // this run covers what you just typed
    runNumber += 1;
    consoleBox.innerHTML = "";
    jsChanged = false;
    document.querySelector("#playground-run").classList.remove("is-waiting");
    playground.srcdoc = buildPage(quiet, check);
  }


  /* 4. THE CONSOLE ------------------------------------------------------------ */

  function addConsoleLine(text, type) {
    const line = document.createElement("p");
    line.className = `console-line console-line--${type}`;
    line.textContent = type === "error" ? `⚠️ ${text}` : text;
    consoleBox.append(line);
    if (consoleBox.children.length > 200) consoleBox.firstElementChild.remove();
    consoleBox.scrollTop = consoleBox.scrollHeight;
  }

  window.addEventListener("message", (event) => {
    const data = event.data;
    if (event.source !== playground.contentWindow || !data || !data.playground || data.run !== runNumber) return;
    if (data.type === "result") {
      showResult(data.text === "pass");
      return;
    }
    addConsoleLine(String(data.text).slice(0, 500), data.type);
  });


  /* CHALLENGES: THE LIST AND CHECKING ---------------------------------------------- */

  function drawChallenges() {
    document.querySelector("#challenge-count").textContent = `${doneChallenges.length} of ${CHALLENGES.length} done`;
    document.querySelector("#challenge-list").innerHTML = CHALLENGES.map((challenge, i) => `
      <button class="challenge-chip ${doneChallenges.includes(challenge.id) ? "is-done" : ""} ${currentChallenge === challenge ? "is-current" : ""}" type="button" data-challenge="${i}" aria-pressed="${currentChallenge === challenge}">
        <span class="challenge-chip__type">${challenge.type}</span>
        <span>${doneChallenges.includes(challenge.id) ? "✅" : `${i + 1}.`} ${challenge.title}</span>
      </button>`).join("");
    const box = document.querySelector("#challenge-box");
    box.hidden = !currentChallenge;
    if (!currentChallenge) return;
    document.querySelector("#challenge-title").textContent = `${currentChallenge.title} (${currentChallenge.type})`;
    document.querySelector("#challenge-task").textContent = currentChallenge.task;
    document.querySelector("#challenge-hint").textContent = `💡 ${currentChallenge.hint}`;
  }

  function startChallenge(challenge) {
    const edited = htmlBox.value !== STARTER_HTML || jsBox.value !== STARTER_JS;
    if (edited && currentChallenge !== challenge && !confirm("Start this challenge? It replaces the code in the editor.")) return;
    currentChallenge = challenge;
    htmlBox.value = challenge.html;
    jsBox.value = challenge.js;
    document.querySelector("#challenge-result").textContent = "";
    document.querySelector("#challenge-hint").hidden = true;
    showTab(challenge.type === "HTML" ? "html" : "js");
    drawChallenges();
    runCode({ quiet: true });
    const box = challenge.type === "HTML" ? htmlBox : jsBox;
    box.focus();
    box.setSelectionRange(box.value.length, box.value.length);
  }

  function showResult(passed) {
    const result = document.querySelector("#challenge-result");
    if (!currentChallenge) return;
    if (passed) {
      result.textContent = "✅ Challenge complete! Awesome coding!";
      result.className = "challenge__result is-pass";
      if (!doneChallenges.includes(currentChallenge.id)) {
        doneChallenges.push(currentChallenge.id);
        try {
          localStorage.setItem("playground.done", JSON.stringify(doneChallenges));
        } catch (error) {
          // Couldn't save. That's OK.
        }
      }
      drawChallenges();
    } else {
      result.textContent = "Not yet! Check the hint and try again. You've got this.";
      result.className = "challenge__result is-fail";
      document.querySelector("#challenge-hint").hidden = false;
    }
  }

  document.querySelector("#challenge-list").addEventListener("click", (event) => {
    const chip = event.target.closest("[data-challenge]");
    if (chip) startChallenge(CHALLENGES[Number(chip.dataset.challenge)]);
  });

  document.querySelector("#challenge-check").addEventListener("click", () => {
    if (!currentChallenge) return;
    document.querySelector("#challenge-result").textContent = "Checking...";
    document.querySelector("#challenge-result").className = "challenge__result";
    runCode({ check: currentChallenge.check });
  });

  document.querySelector("#challenge-show-hint").addEventListener("click", () => {
    document.querySelector("#challenge-hint").hidden = false;
  });

  document.querySelector("#challenge-exit").addEventListener("click", () => {
    currentChallenge = null;
    htmlBox.value = STARTER_HTML;
    jsBox.value = STARTER_JS;
    showTab("html");
    drawChallenges();
    runCode({ quiet: true });
  });


  /* 5. BUTTONS, TABS AND TYPING -------------------------------------------------- */

  let currentTab = "html";

  function showTab(name) {
    currentTab = name;
    htmlBox.hidden = name !== "html";
    jsBox.hidden = name !== "js";
    document.querySelectorAll("[data-code-tab]").forEach((tab) => tab.setAttribute("aria-pressed", String(tab.dataset.codeTab === name)));
    document.querySelector("#playground-snippets").innerHTML = Object.keys(SNIPPETS[name]).map((label) => `
      <button class="chip" type="button" data-snippet="${label}">${label}</button>`).join("");
  }

  document.querySelectorAll("[data-code-tab]").forEach((tab) => {
    tab.addEventListener("click", () => {
      showTab(tab.dataset.codeTab);
      (tab.dataset.codeTab === "html" ? htmlBox : jsBox).focus();
    });
  });

  document.querySelector("#playground-snippets").addEventListener("click", (event) => {
    const button = event.target.closest("[data-snippet]");
    if (!button) return;
    const box = currentTab === "html" ? htmlBox : jsBox;
    let code = box.value;
    if (code !== "" && !code.endsWith("\n")) code += "\n";
    box.value = code + SNIPPETS[currentTab][button.dataset.snippet];
    box.scrollTop = box.scrollHeight;
    if (currentTab === "html") runCode({ quiet: true });
    else markJsChanged();
  });

  document.querySelector("#playground-reset").addEventListener("click", () => {
    if (currentChallenge) {
      htmlBox.value = currentChallenge.html;
      jsBox.value = currentChallenge.js;
    } else {
      htmlBox.value = STARTER_HTML;
      jsBox.value = STARTER_JS;
    }
    runCode({ quiet: true });
  });

  document.querySelector("#playground-run").addEventListener("click", () => runCode());

  // HTML updates the preview as you type (a moment after you stop)
  htmlBox.addEventListener("input", () => {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => runCode({ quiet: true }), 350);
  });

  // JavaScript waits for the Run button (half-typed code makes lots of errors!)
  function markJsChanged() {
    if (jsChanged) return;
    jsChanged = true;
    document.querySelector("#playground-run").classList.add("is-waiting");
  }
  jsBox.addEventListener("input", markJsChanged);

  // In the editors, Tab types 2 spaces (like a real code editor).
  // Press Esc first if you want Tab to move to the next button instead.
  let tabEscape = false;
  for (const box of [htmlBox, jsBox]) {
    box.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        tabEscape = true;
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        runCode();
        return;
      }
      if (event.key !== "Tab" || event.shiftKey || tabEscape) return;
      event.preventDefault();
      box.setRangeText("  ", box.selectionStart, box.selectionEnd, "end");
      box.dispatchEvent(new Event("input"));
    });
    box.addEventListener("blur", () => {
      tabEscape = false;
    });
  }

  // Start it all up
  htmlBox.value = STARTER_HTML;
  jsBox.value = STARTER_JS;
  showTab("html");
  drawChallenges();
  runCode({ quiet: true });
}
