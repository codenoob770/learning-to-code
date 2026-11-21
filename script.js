/* =============================================================
   script.js: how my website BEHAVES
   -------------------------------------------------------------
   Each numbered part below adds one feature:
   1. The light/dark theme button
   2. The "Run" button on the code editor
   3. The roadmap progress bar
   4. The HTML playground
   5. The year in the footer

   Quick vocabulary:
   - const              makes a named value (a "variable" that won't change)
   - document           the whole web page, as JavaScript sees it
   - querySelector()    finds the first element matching a CSS selector
   - addEventListener() runs some code when something happens (like a click)

   Each part starts with "if (...)" so the part only runs if its
   element is on the page. That way, deleting a section from
   index.html won't break the rest of the page.
   ============================================================= */


/* 1. LIGHT / DARK THEME BUTTON ------------------------------- */

const themeButton = document.querySelector("#theme-toggle");

if (themeButton) {
  const root = document.documentElement; // the <html> element
  const deviceWantsDark = window.matchMedia("(prefers-color-scheme: dark)");

  themeButton.addEventListener("click", () => {
    // Work out which theme is showing right now. If nobody has picked
    // one, <html> has no data-theme and we follow the device's setting.
    let currentTheme = root.dataset.theme;
    if (!currentTheme) {
      currentTheme = deviceWantsDark.matches ? "dark" : "light";
    }

    // Switch to the other one. The CSS does the rest: it has different
    // colors for :root[data-theme="dark"].
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    root.dataset.theme = newTheme;

    // Remember the choice for next time (index.html reads it back).
    try {
      localStorage.setItem("theme", newTheme);
    } catch (error) {
      // Storage can be blocked, for example in a private window. That's fine.
    }
  });
}


/* 2. "RUN" BUTTON ON THE CODE EDITOR ------------------------- */

const runButton = document.querySelector("#run-code");

if (runButton) {
  const runLabel = document.querySelector("#run-label");
  const consoleLines = document.querySelectorAll(".console__line");
  const wantsLessMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  runButton.addEventListener("click", () => {
    runButton.disabled = true;
    runLabel.textContent = "Running...";

    // Hide every output line first...
    consoleLines.forEach((line) => line.classList.add("is-waiting"));

    // ...then show them again one at a time, like a program printing.
    // setTimeout(code, milliseconds) runs code after a delay.
    const delay = wantsLessMotion.matches ? 0 : 350;

    consoleLines.forEach((line, index) => {
      setTimeout(() => {
        line.classList.remove("is-waiting");

        // After the last line, the button works again.
        if (index === consoleLines.length - 1) {
          runButton.disabled = false;
          runLabel.textContent = "Run again";
        }
      }, delay * (index + 1));
    });
  });
}


/* 3. ROADMAP PROGRESS BAR ------------------------------------ */

const progressBar = document.querySelector("#progress-bar");

if (progressBar) {
  const progressText = document.querySelector("#progress-text");

  // Count every step, then count the ones marked done.
  const allSteps = document.querySelectorAll(".step .status");
  const doneSteps = document.querySelectorAll('.step .status[data-status="done"]');

  progressBar.max = allSteps.length;
  progressBar.value = doneSteps.length;

  // The backticks make a "template literal": ${...} drops a value into
  // the text. It's the same trick the code in the hero section uses!
  progressText.textContent = `${doneSteps.length} of ${allSteps.length} steps done`;
}


/* 4. HTML PLAYGROUND ----------------------------------------- */

const playgroundInput = document.querySelector("#playground-input");
const playgroundPreview = document.querySelector("#playground-preview");

if (playgroundInput && playgroundPreview) {
  // Remember the example code so the Reset button can bring it back.
  const starterCode = playgroundInput.value;

  // Bits of HTML that the "Add" buttons put at the end of the editor.
  // The names match each button's data-snippet attribute in index.html.
  const snippets = {
    heading: "<h3>A brand new heading</h3>\n",
    link: '<a href="https://developer.mozilla.org/en-US/docs/Learn_web_development" target="_blank">Learn web development on MDN</a>\n',
    button: "<button>Click me</button>\n",
  };

  // A "shadow root" is a walled-off mini page inside an element.
  // Styles typed into the playground stay inside it and can't
  // accidentally restyle the rest of my website.
  const previewRoot = playgroundPreview.attachShadow({ mode: "open" });

  // Basic styles for the preview. The var(--...) tokens come from style.css.
  const previewStyles = `
    <style>
      :host { display: block; color: var(--ink); font-family: var(--font-body); line-height: 1.6; overflow-wrap: anywhere; }
      .output > :first-child { margin-top: 0; }
      h1, h2, h3, h4 { margin: 1rem 0 0.5rem; font-family: var(--font-display); line-height: 1.15; }
      p, ul, ol { margin: 0 0 0.85rem; }
      a { color: var(--accent); }
      button { padding: 0.55rem 1rem; border: 2px solid var(--accent); border-radius: 6px; background: var(--accent); color: var(--accent-ink); font: inherit; font-weight: 700; cursor: pointer; }
      img { max-width: 100%; }
    </style>
  `;

  // Draw whatever is in the editor into the preview.
  function updatePreview() {
    previewRoot.innerHTML = previewStyles + `<div class="output">${playgroundInput.value}</div>`;
  }

  // Add a snippet to the end of the editor, on its own line.
  function addSnippet(snippet) {
    let code = playgroundInput.value;
    if (code !== "" && !code.endsWith("\n")) {
      code += "\n";
    }
    playgroundInput.value = code + snippet;
    playgroundInput.scrollTop = playgroundInput.scrollHeight; // scroll to the new code
    updatePreview();
  }

  // Redraw the preview every time something is typed.
  playgroundInput.addEventListener("input", updatePreview);

  // Wire up every button that has a data-snippet attribute.
  document.querySelectorAll("[data-snippet]").forEach((button) => {
    button.addEventListener("click", () => {
      addSnippet(snippets[button.dataset.snippet]);
    });
  });

  const resetButton = document.querySelector("#playground-reset");
  if (resetButton) {
    resetButton.addEventListener("click", () => {
      playgroundInput.value = starterCode;
      updatePreview();
    });
  }

  // Draw the preview once when the page first loads.
  updatePreview();
}


/* 5. THE YEAR IN THE FOOTER ---------------------------------- */

const yearSpot = document.querySelector("#year");

if (yearSpot) {
  // new Date() is "right now". getFullYear() gives just the year,
  // so the footer stays correct without me ever editing it.
  yearSpot.textContent = new Date().getFullYear();
}
