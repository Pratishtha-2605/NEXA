// =========================================================
//  NEXA backend connection
//  Every page talks to the backend ONLY through this file.
//  Matches: backend/routes/experiments.js + backend/routes/response.js
// =========================================================

// 👉 Change this to your deployed backend (e.g. "https://nexa-api.onrender.com")
const API_URL = "http://localhost:5000";
const API_BASE = API_URL + "/api";

// Until login exists, every experiment belongs to this researcher
const RESEARCHER_ID = "researcher-123";

const DEFAULT_CONSENT =
  "By continuing, you agree to participate in this study anonymously. " +
  "Your responses and reaction times will be recorded for research purposes only.";

// =========================================================
//  The 5 experiment types (keys = backend "paradigm" enum)
// =========================================================
const PARADIGMS = {
  stroop: {
    label: "Stroop",
    icon: "🎨",
    trialType: "color-word", // backend Trial.type enum: text | image | color-word | custom
    about: "Name the ink color, ignore the word",
    stimulusLabel: "Word",
    hasColor: true,
    optionPool: ["red", "green", "blue", "yellow", "purple", "orange"],
    defaultOptions: ["red", "green", "blue", "yellow"],
    example: { content: "BLUE", displayColor: "red", correctResponse: "red", durationMs: 2000 },
    instructions: "A color word will appear. Respond to the INK COLOR it is printed in, not the word itself.",
  },
  "simple-reaction-time": {
    label: "Simple Reaction Time",
    icon: "⚡",
    trialType: "text",
    about: "Respond as fast as possible",
    stimulusLabel: "Stimulus",
    optionPool: ["click"],
    defaultOptions: ["click"],
    example: { content: "CLICK NOW", correctResponse: "click", durationMs: 3000 },
    instructions: "Wait for the stimulus to appear, then press SPACE or click the button as fast as you can.",
  },
  "go-no-go": {
    label: "Go/No-Go",
    icon: "🚦",
    trialType: "text",
    about: "Respond to some stimuli, hold back on others",
    stimulusLabel: "Stimulus",
    optionPool: ["respond", "withhold"],
    defaultOptions: ["respond", "withhold"],
    example: { content: "GREEN X", correctResponse: "respond", durationMs: 800 },
    instructions: "Press SPACE when you should respond. When you should hold back, don't press anything and wait.",
  },
  flanker: {
    label: "Flanker",
    icon: "➡️",
    trialType: "text",
    about: "Which way does the middle arrow point?",
    stimulusLabel: "Stimulus",
    optionPool: ["left", "right"],
    defaultOptions: ["left", "right"],
    example: { content: "<<><<", correctResponse: "right", durationMs: 2000 },
    instructions: "Look only at the MIDDLE arrow. Press ← if it points left and → if it points right.",
  },
  "lexical-decision": {
    label: "Lexical Decision",
    icon: "🔤",
    trialType: "text",
    about: "Is it a real word or not?",
    stimulusLabel: "Word",
    optionPool: ["word", "non-word"],
    defaultOptions: ["word", "non-word"],
    example: { content: "COMPUTER", correctResponse: "word", durationMs: 2500 },
    instructions: "A letter string will appear. Decide as quickly as possible whether it is a real English word.",
  },
};

// Ink colors that look good on a dark background
const INK_HEX = {
  red: "#ff6b6b",
  green: "#51cf66",
  blue: "#4dabf7",
  yellow: "#fcc419",
  purple: "#b197fc",
  orange: "#ff922b",
};

// =========================================================
//  Small helpers used everywhere
// =========================================================

// Full experiment uses _id, the list endpoint returns id
function expId(exp) {
  return exp._id || exp.id || exp.experimentId;
}

function isPublished(exp) {
  return exp.status === "published" || exp.status === "closed";
}

// List endpoint gives trialCount, full experiment gives trials[]
function trialCountOf(exp) {
  return exp.trials ? exp.trials.length : exp.trialCount || 0;
}

function shareLink(exp) {
  return new URL("run.html?slug=" + exp.shareSlug, window.location.href).href;
}

function paradigmOf(exp) {
  return PARADIGMS[exp.paradigm] || { label: exp.paradigm || "Unknown", icon: "🧪", optionPool: [] };
}

// The participant endpoint doesn't send the paradigm, so work it out from the trials
function guessParadigm(trials) {
  const t = trials[0] || {};
  const opts = t.responseOptions || [];
  if (t.type === "color-word") return "stroop";
  if (opts.includes("withhold")) return "go-no-go";
  if (opts.includes("left") || opts.includes("right")) return "flanker";
  if (opts.includes("non-word")) return "lexical-decision";
  if (opts.length === 1) return "simple-reaction-time";
  return "custom";
}

// =========================================================
//  Talking to the backend
//  If the backend can't be reached, we switch to "offline demo
//  mode" and save everything in this browser instead.
// =========================================================
let backendOnline = null; // null = not checked yet

async function callApi(method, path, body) {
  if (backendOnline === false) return { offline: true };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000); // give up after 4 s

  let res;
  try {
    res = await fetch(API_BASE + path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    // Server not running / no internet → offline mode
    clearTimeout(timer);
    backendOnline = false;
    showModeBadge();
    return { offline: true };
  }
  clearTimeout(timer);
  backendOnline = true;
  showModeBadge();

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.message || "Server error (" + res.status + ")");
  }
  return { data };
}

// =========================================================
//  EXPERIMENTS  (backend/routes/experiments.js)
// =========================================================

// GET /api/experiments?researcherId=...
// → [{ id, title, paradigm, status, trialCount, shareSlug, updatedAt }]
async function listExperiments() {
  const r = await callApi("GET", "/experiments?researcherId=" + RESEARCHER_ID);
  return r.offline ? localStore().filter((e) => e.researcherId === RESEARCHER_ID) : r.data;
}

// GET /api/experiments/:id → full experiment (with correct answers)
async function getExperimentById(id) {
  const r = await callApi("GET", "/experiments/" + id);
  if (!r.offline) return r.data;
  const exp = localStore().find((e) => e._id === id);
  if (!exp) throw new Error("Experiment not found");
  return exp;
}

// POST /api/experiments → created experiment
async function createExperiment(payload) {
  const r = await callApi("POST", "/experiments", payload);
  if (!r.offline) return r.data;

  const exp = {
    ...payload,
    _id: "local-" + Date.now(),
    status: "draft",
    shareSlug: Math.random().toString(16).slice(2, 10),
    createdAt: new Date().toISOString(),
  };
  saveLocalStore([...localStore(), exp]);
  return exp;
}

// PUT /api/experiments/:id → updated experiment (drafts only)
async function updateExperiment(id, payload) {
  const r = await callApi("PUT", "/experiments/" + id, payload);
  if (!r.offline) return r.data;

  const list = localStore();
  const i = list.findIndex((e) => e._id === id);
  if (i === -1) throw new Error("Experiment not found");
  if (isPublished(list[i])) throw new Error("Cannot edit a published experiment");
  list[i] = { ...list[i], ...payload, updatedAt: new Date().toISOString() };
  saveLocalStore(list);
  return list[i];
}

// PUT /api/experiments/:id/publish → { message, shareUrl: "/run/<slug>" }
// We return { id, status, shareSlug } so the pages don't need to care.
async function publishExperiment(id) {
  const r = await callApi("PUT", "/experiments/" + id + "/publish");
  if (!r.offline) {
    const slug = r.data.shareSlug || (r.data.shareUrl || "").split("/").pop();
    return { ...r.data, _id: id, status: "published", shareSlug: slug };
  }

  const list = localStore();
  const exp = list.find((e) => e._id === id);
  if (!exp) throw new Error("Experiment not found");
  if (!exp.trials.length) throw new Error("Add at least one trial before publishing");
  exp.status = "published";
  saveLocalStore(list);
  return exp;
}

// GET /api/experiments/run/:shareSlug  (participant view, no correct answers)
// Backend sends { experimentId, title, description, consent:{required,text}, participantId, trials }
// We turn it into the same shape as a normal experiment.
async function getRunExperiment(slug) {
  const r = await callApi("GET", "/experiments/run/" + slug);
  if (!r.offline) {
    const d = r.data;
    return {
      _id: d.experimentId,
      title: d.title,
      description: d.description,
      paradigm: d.paradigm || guessParadigm(d.trials || []),
      trials: d.trials || [],
      serverParticipantId: d.participantId,
      alreadyOrdered: true, // backend already sorted / shuffled them
      settings: {
        showConsentScreen: d.consent ? d.consent.required !== false : true,
        consentText: d.consent ? d.consent.text : DEFAULT_CONSENT,
        randomizeTrialOrder: false,
      },
    };
  }

  const exp = localStore().find((e) => e.shareSlug === slug && isPublished(e));
  if (!exp) throw new Error("Experiment not found or not published");
  // Same as the backend: hide the answers from participants
  return { ...exp, trials: exp.trials.map(({ correctResponse, ...rest }) => rest) };
}

// =========================================================
//  RESPONSES  (backend/routes/response.js)
//  The backend stores ONE document per trial:
//  { experimentId, participantId, trialIndex, stimulusOnsetTimestamp,
//    responseTimestamp, isCorrect }   (reactionTime is computed by the server)
// =========================================================

// POST /api/responses  (called once per trial)
async function submitResponse(data) {
  const r = await callApi("POST", "/responses", data);
  if (!r.offline) return r.data;

  // Offline: score it like the server would, using the locally stored answers
  const exp = localStore().find((e) => e._id === data.experimentId);
  const trial = exp && exp.trials.find((t) => t.order === data.trialIndex);

  const all = JSON.parse(localStorage.getItem("nexa_responses")) || [];
  all.push({
    ...data,
    reactionTime: data.timedOut ? null : Math.round(data.responseTimestamp - data.stimulusOnsetTimestamp),
    isCorrect: trial ? data.response === trial.correctResponse : undefined,
    submittedAt: new Date().toISOString(),
  });
  localStorage.setItem("nexa_responses", JSON.stringify(all));
  return data;
}

// Send every trial of one participant in ONE request
// (POST /api/responses accepts an array; the server works out isCorrect)
async function submitAllResponses(experimentId, participantId, trialResults) {
  const items = trialResults.map((t) => ({
    experimentId,
    participantId,
    trialId: t.trialId || undefined,
    trialIndex: t.trialIndex,
    stimulus: t.stimulus,
    response: t.response,
    timedOut: !!t.timedOut,
    stimulusOnsetTimestamp: t.stimulusOnsetTimestamp,
    responseTimestamp: t.responseTimestamp,
  }));

  const r = await callApi("POST", "/responses", items);
  if (!r.offline) return r.data;
  return Promise.all(items.map(submitResponse)); // offline: save each one locally
}

// GET /api/responses/:experimentId
async function getResponsesByExperiment(experimentId) {
  const r = await callApi("GET", "/responses/" + experimentId);
  if (!r.offline) return r.data;
  return (JSON.parse(localStorage.getItem("nexa_responses")) || []).filter((x) => x.experimentId === experimentId);
}

// GET /api/responses/:experimentId/stats
// → { participants, trials, averageReactionTime, accuracy, perTrial:[{trial, accuracy, avgRT}] }
async function getExperimentStats(experimentId) {
  const r = await callApi("GET", "/responses/" + experimentId + "/stats");
  if (!r.offline) return r.data;

  // Same calculation as the backend, done on local data
  const list = await getResponsesByExperiment(experimentId);
  if (list.length === 0) return { participants: 0, trials: 0, averageReactionTime: 0, accuracy: 0, perTrial: [] };
  const avg = (arr) => {
    const timed = arr.filter((x) => typeof x.reactionTime === "number");
    return timed.length ? timed.reduce((s, x) => s + x.reactionTime, 0) / timed.length : 0;
  };
  const acc = (arr) => (arr.filter((x) => x.isCorrect).length / arr.length) * 100;
  const groups = {};
  list.forEach((x) => (groups[x.trialIndex] = groups[x.trialIndex] || []).push(x));
  return {
    participants: new Set(list.map((x) => x.participantId)).size,
    trials: list.length,
    averageReactionTime: Math.round(avg(list)),
    accuracy: Math.round(acc(list) * 10) / 10,
    perTrial: Object.keys(groups)
      .sort((a, b) => a - b)
      .map((k) => ({ trial: Number(k), accuracy: Math.round(acc(groups[k]) * 10) / 10, avgRT: Math.round(avg(groups[k])) })),
  };
}

// GET /api/responses/:experimentId/export  (CSV file)
function getExportUrl(experimentId) {
  return API_BASE + "/responses/" + experimentId + "/export";
}

// =========================================================
//  Offline demo store (browser localStorage)
// =========================================================
function localStore() {
  let list = JSON.parse(localStorage.getItem("nexa_experiments_v2"));
  if (!list) {
    list = demoExperiments();
    saveLocalStore(list);
  }
  return list;
}

function saveLocalStore(list) {
  localStorage.setItem("nexa_experiments_v2", JSON.stringify(list));
}

function demoTrial(paradigm, order, content, correctResponse, displayColor) {
  const p = PARADIGMS[paradigm];
  const stimulus = { content, durationMs: p.example.durationMs };
  if (p.hasColor) stimulus.displayColor = displayColor;
  return { type: p.trialType, stimulus, responseOptions: [...p.defaultOptions], correctResponse, order };
}

function demoExperiments() {
  const settings = { randomizeTrialOrder: false, showConsentScreen: true, consentText: DEFAULT_CONSENT };
  return [
    {
      _id: "local-demo-stroop",
      title: "My Stroop Study",
      description: "Classic color-word interference task.",
      paradigm: "stroop",
      researcherId: RESEARCHER_ID,
      status: "draft",
      shareSlug: "a1b2c3d4",
      settings,
      trials: [
        demoTrial("stroop", 1, "BLUE", "red", "red"),
        demoTrial("stroop", 2, "RED", "red", "red"),
        demoTrial("stroop", 3, "GREEN", "yellow", "yellow"),
        demoTrial("stroop", 4, "YELLOW", "yellow", "yellow"),
        demoTrial("stroop", 5, "RED", "blue", "blue"),
        demoTrial("stroop", 6, "BLUE", "blue", "blue"),
      ],
    },
    {
      _id: "local-demo-flanker",
      title: "Arrow Flanker Study",
      description: "Attention and response conflict with arrows.",
      paradigm: "flanker",
      researcherId: RESEARCHER_ID,
      status: "published",
      shareSlug: "f3cbbc8e",
      settings: { ...settings, randomizeTrialOrder: true },
      trials: [
        demoTrial("flanker", 1, "<<<<<", "left"),
        demoTrial("flanker", 2, ">>>>>", "right"),
        demoTrial("flanker", 3, "<<><<", "right"),
        demoTrial("flanker", 4, ">><>>", "left"),
        demoTrial("flanker", 5, "<<<<<", "left"),
        demoTrial("flanker", 6, ">><>>", "left"),
      ],
    },
  ];
}

// =========================================================
//  Little pill in the corner: "Connected" vs "Offline demo mode"
// =========================================================
function showModeBadge() {
  let badge = document.getElementById("modeBadge");
  if (!badge) {
    badge = document.createElement("div");
    badge.id = "modeBadge";
    badge.className = "mode-badge";
    document.body.appendChild(badge);
  }
  if (backendOnline) {
    badge.textContent = "● Connected to backend";
    badge.classList.remove("offline");
    badge.title = API_BASE;
  } else {
    badge.textContent = "● Offline demo mode";
    badge.classList.add("offline");
    badge.title = "Backend not reachable at " + API_BASE + ". Data is saved in this browser.";
  }
}
