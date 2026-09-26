// =========================================================
//  Participant page: runs any of the 5 paradigms
//    run.html?slug=abc123   → real participant (via share link)
//    run.html?preview=<id>  → scientist preview (nothing is saved)
// =========================================================

const params = new URLSearchParams(window.location.search);
const slug = params.get("slug");
const previewId = params.get("preview");
const isPreview = !!previewId;

const participantId = getMyParticipantId();

let experiment = null;
let paradigm = null;
let trials = [];
let current = 0;
let startTime = 0;
let accepting = false; // only true while a stimulus is on screen
let timeoutTimer = null;
let keyMap = {}; // key → response for the current trial
const results = [];
let startedAt = null;

const $ = (id) => document.getElementById(id);

// Show exactly one screen
function showScreen(id) {
  document.querySelectorAll(".exp-screen").forEach((s) => s.classList.add("hidden"));
  $(id).classList.remove("hidden");
}

// =========================================================
//  Load the experiment
// =========================================================
async function load() {
  $("participantTag").textContent = "Participant " + participantId;
  if (isPreview) $("previewBanner").classList.remove("hidden");

  try {
    if (!slug && !previewId) throw new Error("This link is missing the experiment code.");
    experiment = isPreview ? await getExperimentById(previewId) : await getRunExperiment(slug);
  } catch (err) {
    $("errorText").textContent = err.message;
    showScreen("errorScreen");
    return;
  }

  paradigm = paradigmOf(experiment);
  document.title = "CognitiveLab — " + experiment.title;

  // Trial order: randomized or by "order"
  // (the backend's participant endpoint already sorts or shuffles them)
  trials = (experiment.trials || []).slice();
  if (!experiment.alreadyOrdered) {
    trials.sort((a, b) => a.order - b.order);
    if (experiment.settings?.randomizeTrialOrder) shuffle(trials);
  }

  const typeText = paradigm.icon + " " + paradigm.label;
  $("consentType").textContent = typeText;
  $("introType").textContent = typeText;
  $("consentTitle").textContent = experiment.title;
  $("introTitle").textContent = experiment.title;
  $("consentDesc").textContent = experiment.description || "";
  $("consentText").textContent = experiment.settings?.consentText || DEFAULT_CONSENT;
  $("introText").textContent = paradigm.instructions || "Respond as quickly and accurately as you can.";
  $("introKeys").textContent = keyHelpText();

  if (experiment.settings?.showConsentScreen === false) showScreen("introScreen");
  else showScreen("consentScreen");
}

function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
}

function keyHelpText() {
  switch (experiment.paradigm) {
    case "simple-reaction-time":
    case "go-no-go":
      return "Keyboard: SPACE to respond. You can also tap the button.";
    case "flanker":
      return "Keyboard: ← and → arrow keys. You can also tap the buttons.";
    default:
      return "Keyboard: number keys 1, 2, 3… match the buttons. You can also click them.";
  }
}

// =========================================================
//  Consent → Instructions → Start
// =========================================================
$("consentCheck").addEventListener("change", () => {
  $("consentBtn").disabled = !$("consentCheck").checked;
});
$("consentBtn").addEventListener("click", () => showScreen("introScreen"));
$("startBtn").addEventListener("click", () => {
  startedAt = new Date().toISOString();
  showScreen("trialScreen");
  showTrial();
});

// =========================================================
//  One trial
// =========================================================
function showTrial() {
  const trial = trials[current];
  const options = trial.responseOptions || [];

  $("trialCounter").textContent = `Trial ${current + 1} of ${trials.length}`;
  $("progressBar").style.width = (current / trials.length) * 100 + "%";

  // "withhold" means: don't press anything. No button for it.
  const pressable = options.filter((o) => o !== "withhold");
  buildButtons(pressable);

  // Fixation cross for 500 ms
  const stim = $("stimulus");
  accepting = false;
  stim.className = "stimulus fixation";
  stim.style.color = "";
  stim.textContent = "+";

  setTimeout(() => {
    stim.className = "stimulus" + (experiment.paradigm === "flanker" ? " mono" : "");
    stim.textContent = trial.stimulus?.content || "";
    const color = trial.stimulus?.displayColor;
    stim.style.color = color ? INK_HEX[color] || color : "var(--text)";

    // Start the clock on the frame the stimulus is actually drawn
    requestAnimationFrame(() => {
      startTime = performance.now();
      accepting = true;
    });

    // Time limit: the duration, or 2 s for Go/No-Go so "withhold" can happen
    const limit = trial.stimulus?.durationMs || (options.includes("withhold") ? 2000 : 0);
    if (limit) timeoutTimer = setTimeout(() => record(null, true), limit);
  }, 500);
}

function buildButtons(pressable) {
  keyMap = {};
  const box = $("responseButtons");
  box.style.gridTemplateColumns = `repeat(${Math.min(pressable.length, 4)}, 1fr)`;

  box.innerHTML = pressable
    .map((opt, i) => {
      let key = String(i + 1);
      if (pressable.length === 1) key = " ";
      if (opt === "left") key = "ArrowLeft";
      if (opt === "right") key = "ArrowRight";
      keyMap[key] = opt;
      if (pressable.length > 1) keyMap[String(i + 1)] = opt; // numbers always work too

      const keyLabel = key === " " ? "Space" : key === "ArrowLeft" ? "←" : key === "ArrowRight" ? "→" : key;
      const color = experiment.paradigm === "stroop" && INK_HEX[opt] ? `style="color:${INK_HEX[opt]}"` : "";
      return `<button class="color-btn" data-response="${opt}" ${color}>
                <span class="key-cap">${keyLabel}</span> ${opt}
              </button>`;
    })
    .join("");
}

$("responseButtons").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-response]");
  if (btn) record(btn.dataset.response, false);
});

document.addEventListener("keydown", (e) => {
  if ($("trialScreen").classList.contains("hidden")) return;
  const response = keyMap[e.key];
  if (response) {
    e.preventDefault(); // stop SPACE from scrolling the page
    record(response, false);
  }
});

// =========================================================
//  Save one response and go on
// =========================================================
function record(response, timedOut) {
  if (!accepting) return;
  accepting = false;
  clearTimeout(timeoutTimer);

  // Measured in the browser, so network speed never affects it
  const now = performance.now();
  const reactionTimeMs = timedOut ? null : Math.round(now - startTime);
  const trial = trials[current];

  // No press on a Go/No-Go trial = "withhold"
  if (timedOut && (trial.responseOptions || []).includes("withhold")) response = "withhold";

  results.push({
    trialId: trial._id || null,
    trialIndex: trial.order ?? current + 1,
    stimulus: trial.stimulus?.content,
    response,
    reactionTimeMs,
    timedOut,
    // High-resolution clock turned into real timestamps (ms since 1970, with decimals)
    stimulusOnsetTimestamp: performance.timeOrigin + startTime,
    responseTimestamp: performance.timeOrigin + now,
    // Only known in preview (participants never receive the answers)
    isCorrect: trial.correctResponse !== undefined ? response === trial.correctResponse : undefined,
  });

  current++;
  $("stimulus").textContent = "";
  if (current < trials.length) setTimeout(showTrial, 300);
  else finish();
}

// =========================================================
//  Finish: show summary, send to backend
// =========================================================
async function finish() {
  $("progressBar").style.width = "100%";
  showScreen("doneScreen");

  const timed = results.filter((r) => r.reactionTimeMs !== null);
  const avg = timed.length ? Math.round(timed.reduce((s, r) => s + r.reactionTimeMs, 0) / timed.length) : null;
  $("doneRT").textContent = avg === null ? "—" : avg + " ms";
  $("doneCount").textContent = results.length;

  if (isPreview) {
    $("doneText").textContent = "Preview finished. Nothing was saved.";
    showPreviewAnswers();
    return;
  }

  saveProgressCopy(); // for "My Progress" on this device
  await send();
}

async function send() {
  $("retryBtn").classList.add("hidden");
  $("doneText").textContent = "Saving your responses…";
  try {
    // One POST /api/responses per trial
    await submitAllResponses(expId(experiment), participantId, results);
    $("doneText").textContent = "Your responses have been recorded. You can close this tab now.";
  } catch (err) {
    $("doneText").textContent = "We couldn't save your responses: " + err.message;
    $("retryBtn").classList.remove("hidden");
  }
}
$("retryBtn").addEventListener("click", send);

// Scientist preview: show which answers were right
function showPreviewAnswers() {
  const rows = results
    .map((r, i) => {
      const trial = trials[i];
      const ok = r.response === trial.correctResponse;
      return `<tr>
        <td>${i + 1}</td>
        <td class="mono">${escapeHtml(r.stimulus || "")}</td>
        <td>${r.response ?? "—"}</td>
        <td>${trial.correctResponse ?? "—"}</td>
        <td class="${ok ? "good" : "bad"}">${ok ? "✓" : "✗"}</td>
        <td>${r.reactionTimeMs ?? "—"}${r.reactionTimeMs ? " ms" : ""}</td>
      </tr>`;
    })
    .join("");

  $("previewAnswers").innerHTML = `
    <div class="table-wrap">
      <table>
        <thead><tr><th>#</th><th>Stimulus</th><th>Your answer</th><th>Correct</th><th></th><th>RT</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

// Keep a copy on this device so the home page's "My Progress" can show it
function saveProgressCopy() {
  const all = getResponses();
  all.push({
    experimentId: expId(experiment),
    experimentTitle: experiment.title,
    paradigm: experiment.paradigm,
    participantId,
    submittedAt: new Date().toISOString(),
    trials: results.map((r, i) => ({
      trial: i + 1,
      word: r.stimulus,
      color: trials[i].stimulus?.displayColor || "",
      response: r.response,
      correct: null, // participants don't get the answers
      reactionTime: r.reactionTimeMs,
    })),
  });
  saveResponses(all);
}

load();
