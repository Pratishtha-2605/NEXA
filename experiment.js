// ===== Participant experiment page =====

// Which experiment? (from ?id=... in the link). Falls back to the Stroop test.
const experiment = getExperiment(getIdFromUrl()) || getExperiment("stroop");
const trials = experiment.trials;

// Anonymous participant ID like P-4821 (stays the same on this browser)
const participantId = getMyParticipantId();

// ===== State =====
let currentTrial = 0;
let trialStartTime = 0;
let waitingForResponse = false; // ignore key presses during the "+" pause
const responses = [];

// ===== Screen elements =====
const consentScreen = document.getElementById("consentScreen");
const trialScreen = document.getElementById("trialScreen");
const doneScreen = document.getElementById("doneScreen");
const stimulusWord = document.getElementById("stimulusWord");
const trialCounter = document.getElementById("trialCounter");
const progressBar = document.getElementById("progressBar");

// ===== Fill in the consent screen =====
document.getElementById("expTitle").textContent = experiment.title;
document.getElementById("expDesc").textContent = experiment.description;
document.getElementById("participantTag").textContent = "Participant " + participantId;
document.title = "CognitiveLab — " + experiment.title;

// Start button only works after ticking the consent checkbox
const consentCheck = document.getElementById("consentCheck");
const consentBtn = document.getElementById("consentBtn");
consentCheck.addEventListener("change", () => {
  consentBtn.disabled = !consentCheck.checked;
});

consentBtn.addEventListener("click", () => {
  consentScreen.classList.add("hidden");
  trialScreen.classList.remove("hidden");
  showTrial();
});

// ===== Color buttons (for mouse / phone users) =====
const buttonBox = document.getElementById("responseButtons");
for (const color of COLORS) {
  const btn = document.createElement("button");
  btn.className = "color-btn key-" + color;
  btn.textContent = color[0].toUpperCase() + " · " + color;
  btn.addEventListener("click", () => recordResponse(color));
  buttonBox.appendChild(btn);
}

// ===== Show a "+" for 500 ms, then the word =====
function showTrial() {
  const trial = trials[currentTrial];

  trialCounter.textContent = `Trial ${currentTrial + 1} of ${trials.length}`;
  progressBar.style.width = (currentTrial / trials.length) * 100 + "%";

  waitingForResponse = false;
  stimulusWord.textContent = "+";
  stimulusWord.style.color = "var(--text-muted)";

  setTimeout(() => {
    stimulusWord.textContent = trial.word;
    stimulusWord.style.color = trial.color;

    // Start the timer on the next screen paint, when the word is actually visible
    requestAnimationFrame(() => {
      trialStartTime = performance.now();
      waitingForResponse = true;
    });
  }, 500);
}

// ===== Keyboard: R / B / G / Y =====
document.addEventListener("keydown", (e) => {
  const color = COLORS.find((c) => c[0] === e.key.toLowerCase());
  if (color) recordResponse(color);
});

// ===== Save one answer and move on =====
function recordResponse(pressedColor) {
  if (!waitingForResponse) return;
  waitingForResponse = false;

  // Reaction time measured in the browser, so network speed doesn't matter
  const reactionTime = Math.round(performance.now() - trialStartTime);
  const trial = trials[currentTrial];

  responses.push({
    trial: currentTrial + 1,
    word: trial.word,
    color: trial.color,
    response: pressedColor,
    correct: pressedColor === trial.color,
    reactionTime,
  });

  currentTrial++;
  if (currentTrial < trials.length) {
    showTrial();
  } else {
    finishExperiment();
  }
}

// ===== Wrap up: save and show the thank-you screen =====
function finishExperiment() {
  trialScreen.classList.add("hidden");
  doneScreen.classList.remove("hidden");

  addResponse({
    experimentId: experiment.id,
    participantId,
    submittedAt: new Date().toISOString(),
    trials: responses,
  });

  const totalRT = responses.reduce((sum, r) => sum + r.reactionTime, 0);
  const correct = responses.filter((r) => r.correct).length;
  document.getElementById("doneRT").textContent = Math.round(totalRT / responses.length) + " ms";
  document.getElementById("doneAcc").textContent = Math.round((correct / responses.length) * 100) + "%";
}
