// ===== Shared data helpers (used by every page) =====
// Everything is saved in the browser's localStorage.
// Later this file is the only one that needs to change to talk to a real backend.

const COLORS = ["red", "blue", "green", "yellow"];

// Make random Stroop trials: a color WORD shown in an ink COLOR
function makeStroopTrials(count) {
  const trials = [];
  for (let i = 0; i < count; i++) {
    const word = COLORS[Math.floor(Math.random() * COLORS.length)];
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    trials.push({ word: word.toUpperCase(), color });
  }
  return trials;
}

// Experiments shown the very first time the site is opened
function defaultExperiments() {
  return [
    {
      id: "stroop",
      title: "Stroop Color Test",
      description: "Name the ink color of a word while ignoring what the word says.",
      status: "live",
      trials: makeStroopTrials(20),
    },
    {
      id: "stroop-quick",
      title: "Stroop Quick Demo",
      description: "A short 8-trial version for trying the flow in under a minute.",
      status: "live",
      trials: makeStroopTrials(8),
    },
    {
      id: "color-pilot",
      title: "Color Naming (Pilot)",
      description: "Pilot study, still being designed. Not shared yet.",
      status: "draft",
      trials: makeStroopTrials(5),
    },
  ];
}

// Sample responses so the results page has something to show in the demo
function sampleResponses(experiment) {
  const responses = [];
  for (let p = 1; p <= 12; p++) {
    const trials = experiment.trials.map((t, i) => {
      const correct = Math.random() < 0.88;
      const congruent = t.word.toLowerCase() === t.color;
      const base = congruent ? 560 : 720; // incongruent trials are slower
      return {
        trial: i + 1,
        word: t.word,
        color: t.color,
        response: correct ? t.color : COLORS.find((c) => c !== t.color),
        correct,
        reactionTime: Math.round(base + (Math.random() - 0.5) * 300),
      };
    });
    responses.push({
      experimentId: experiment.id,
      participantId: "SAMPLE-" + String(p).padStart(2, "0"),
      submittedAt: new Date().toISOString(),
      trials,
    });
  }
  return responses;
}

// ----- Experiments -----
function getExperiments() {
  let list = JSON.parse(localStorage.getItem("cl_experiments"));
  if (!list) {
    list = defaultExperiments();
    saveExperiments(list);
    saveResponses(sampleResponses(list[0]));
  }
  return list;
}

function saveExperiments(list) {
  localStorage.setItem("cl_experiments", JSON.stringify(list));
}

function getExperiment(id) {
  return getExperiments().find((exp) => exp.id === id);
}

// ----- Responses -----
function getResponses(experimentId) {
  const all = JSON.parse(localStorage.getItem("cl_responses")) || [];
  if (experimentId) {
    return all.filter((r) => r.experimentId === experimentId);
  }
  return all;
}

function saveResponses(list) {
  localStorage.setItem("cl_responses", JSON.stringify(list));
}

function addResponse(response) {
  const all = getResponses();
  all.push(response);
  saveResponses(all);
}

// ----- This browser's participant -----

// Same anonymous ID every time on this browser, so we can track progress
function getMyParticipantId() {
  let id = localStorage.getItem("cl_my_id");
  if (!id) {
    id = "P-" + Math.floor(1000 + Math.random() * 9000);
    localStorage.setItem("cl_my_id", id);
  }
  return id;
}

// Average reaction time and accuracy for one submission
// (skips trials with no reaction time, e.g. "withhold" on Go/No-Go)
// accuracy is null when the answers aren't known (participant view)
function summarize(response) {
  const timed = response.trials.filter((r) => typeof r.reactionTime === "number");
  const graded = response.trials.filter((r) => typeof r.correct === "boolean");
  const totalRT = timed.reduce((sum, r) => sum + r.reactionTime, 0);
  return {
    avgRT: timed.length ? Math.round(totalRT / timed.length) : 0,
    accuracy: graded.length ? Math.round((graded.filter((r) => r.correct).length / graded.length) * 100) : null,
  };
}

// 87 → "87%", null → "—"
function fmtAcc(accuracy) {
  return accuracy === null || accuracy === undefined ? "—" : accuracy + "%";
}

// "26 Sep, 14:05"
function formatDate(iso) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ----- Small helpers -----

// Read ?id=... from the page URL
function getIdFromUrl() {
  return new URLSearchParams(window.location.search).get("id");
}

// Stop typed text like <b> from being treated as HTML
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Small popup message at the bottom of the screen
function showToast(message) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => toast.classList.remove("show"), 2500);
}
