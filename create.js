// =========================================================
//  Create / Edit Experiment page (the Trial Builder)
// =========================================================

// Everything the scientist has entered so far
const state = {
  id: null, // set after the first Save Draft
  paradigm: null, // "stroop", "flanker", ...
  trials: [], // [{ content, displayColor, responseOptions, correctResponse, durationMs, order }]
  locked: false, // true for published experiments
};

const trialList = document.getElementById("trialList");

// =========================================================
//  1. Experiment type cards
// =========================================================
function renderParadigmCards() {
  document.getElementById("paradigmGrid").innerHTML = Object.entries(PARADIGMS)
    .map(
      ([key, p]) => `
      <button type="button" class="paradigm-card ${state.paradigm === key ? "selected" : ""}" data-paradigm="${key}">
        <span class="paradigm-icon">${p.icon}</span>
        <span class="paradigm-name">${p.label}</span>
        <span class="paradigm-about">${p.about}</span>
      </button>`
    )
    .join("");
}

document.getElementById("paradigmGrid").addEventListener("click", (e) => {
  const card = e.target.closest(".paradigm-card");
  if (!card || state.locked) return;
  const key = card.dataset.paradigm;
  if (key === state.paradigm) return;

  // Switching type clears the trials, because the fields are different
  const hasWork = state.trials.some((t) => t.content.trim());
  if (hasWork && !confirm("Changing the experiment type will remove your current trials. Continue?")) return;

  selectParadigm(key);
});

function selectParadigm(key) {
  state.paradigm = key;
  state.trials = [];
  state.trials.push(newTrial({ ...PARADIGMS[key].example })); // first trial pre-filled with an example
  renderParadigmCards();
  renderTrials();
}

// =========================================================
//  2. Trials
// =========================================================
function newTrial(values = {}) {
  const p = PARADIGMS[state.paradigm];
  return {
    content: values.content || "",
    displayColor: values.displayColor || (p.hasColor ? p.optionPool[0] : ""),
    responseOptions: values.responseOptions ? [...values.responseOptions] : [...p.defaultOptions],
    correctResponse: values.correctResponse || p.defaultOptions[0],
    durationMs: values.durationMs ?? "",
    order: values.order ?? nextOrder(),
  };
}

function nextOrder() {
  return state.trials.reduce((max, t) => Math.max(max, Number(t.order) || 0), 0) + 1;
}

// Build one trial card. Fields depend on the chosen paradigm.
function trialCardHtml(t, i) {
  const p = PARADIGMS[state.paradigm];

  const colorField = p.hasColor
    ? `<div>
         <label>Display (ink) color</label>
         <select data-field="displayColor">
           ${p.optionPool.map((c) => `<option value="${c}" ${c === t.displayColor ? "selected" : ""}>${c}</option>`).join("")}
         </select>
       </div>`
    : "";

  const checkboxes = p.optionPool
    .map(
      (opt) => `
      <label class="check">
        <input type="checkbox" data-option="${opt}" ${t.responseOptions.includes(opt) ? "checked" : ""} />
        ${opt}
      </label>`
    )
    .join("");

  const correctOptions = t.responseOptions
    .map((opt) => `<option value="${opt}" ${opt === t.correctResponse ? "selected" : ""}>${opt}</option>`)
    .join("");

  // Little live preview of what the participant will see
  const previewColor = p.hasColor ? INK_HEX[t.displayColor] || t.displayColor : "var(--text)";

  return `
    <div class="trial-card" data-index="${i}">
      <div class="trial-card-head">
        <h3>Trial ${i + 1}</h3>
        <div class="trial-card-actions">
          <button type="button" class="btn-secondary btn-small-btn" data-action="duplicate">⧉ Duplicate</button>
          <button type="button" class="btn-danger btn-small-btn" data-action="delete">✕ Delete</button>
        </div>
      </div>

      <div class="trial-fields">
        <div class="field-wide">
          <label>${p.stimulusLabel}</label>
          <input type="text" data-field="content" value="${escapeHtml(t.content)}" placeholder="e.g. ${escapeHtml(p.example.content)}" />
        </div>
        ${colorField}
        <div>
          <label>Duration (ms) <span class="hint">optional</span></label>
          <input type="number" min="100" step="100" data-field="durationMs" value="${t.durationMs}" placeholder="e.g. ${p.example.durationMs}" />
        </div>
        <div>
          <label>Trial order</label>
          <input type="number" min="1" data-field="order" value="${t.order}" />
        </div>
      </div>

      <label>Response options</label>
      <div class="option-checks">${checkboxes}</div>

      <div class="trial-bottom">
        <div>
          <label>Correct response</label>
          <select data-field="correctResponse">${correctOptions}</select>
        </div>
        <div class="stim-preview-box">
          <span class="hint">Participant sees</span>
          <span class="stim-preview ${state.paradigm === "flanker" ? "mono" : ""}" style="color:${previewColor}">${escapeHtml(t.content) || "…"}</span>
        </div>
      </div>
    </div>`;
}

function renderTrials() {
  const hasType = !!state.paradigm;
  document.getElementById("trialHint").classList.toggle("hidden", hasType);
  document.getElementById("addTrialBottom").classList.toggle("hidden", !hasType || state.locked);
  document.getElementById("addTrialTop").disabled = !hasType;
  document.getElementById("trialCount").textContent = state.trials.length;

  trialList.innerHTML = hasType ? state.trials.map(trialCardHtml).join("") : "";
}

function addTrial() {
  state.trials.push(newTrial());
  renderTrials();
  trialList.lastElementChild.scrollIntoView({ behavior: "smooth", block: "center" });
  trialList.lastElementChild.querySelector('[data-field="content"]').focus();
}

document.getElementById("addTrialTop").addEventListener("click", addTrial);
document.getElementById("addTrialBottom").addEventListener("click", addTrial);

// Duplicate / Delete buttons (one listener for all cards)
trialList.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const i = Number(btn.closest(".trial-card").dataset.index);

  if (btn.dataset.action === "delete") {
    if (state.trials.length === 1) {
      showToast("An experiment needs at least one trial.");
      return;
    }
    state.trials.splice(i, 1);
  }

  if (btn.dataset.action === "duplicate") {
    const copy = { ...state.trials[i], responseOptions: [...state.trials[i].responseOptions] };
    state.trials.splice(i + 1, 0, copy);
  }

  // Keep order numbers tidy: 1, 2, 3, ...
  state.trials.forEach((t, n) => (t.order = n + 1));
  renderTrials();
});

// Typing in a field → update the state
trialList.addEventListener("input", (e) => {
  const card = e.target.closest(".trial-card");
  const field = e.target.dataset.field;
  if (!card || !field) return;

  const t = state.trials[Number(card.dataset.index)];
  t[field] = e.target.value;

  // Update the little preview without redrawing (so typing isn't interrupted)
  if (field === "content" || field === "displayColor") {
    const preview = card.querySelector(".stim-preview");
    preview.textContent = t.content || "…";
    if (t.displayColor) preview.style.color = INK_HEX[t.displayColor] || t.displayColor;
  }
});

// Ticking a response option → rebuild the "Correct response" list
trialList.addEventListener("change", (e) => {
  const opt = e.target.dataset.option;
  if (!opt) return;

  const t = state.trials[Number(e.target.closest(".trial-card").dataset.index)];
  const pool = PARADIGMS[state.paradigm].optionPool;

  if (e.target.checked) t.responseOptions.push(opt);
  else t.responseOptions = t.responseOptions.filter((o) => o !== opt);

  t.responseOptions.sort((a, b) => pool.indexOf(a) - pool.indexOf(b));
  if (!t.responseOptions.includes(t.correctResponse)) t.correctResponse = t.responseOptions[0] || "";
  renderTrials();
});

// =========================================================
//  3. Settings
// =========================================================
const consentCheck = document.getElementById("setConsent");
consentCheck.addEventListener("change", () => {
  document.getElementById("consentBox").classList.toggle("hidden", !consentCheck.checked);
});
document.getElementById("consentText").value = DEFAULT_CONSENT;

// =========================================================
//  4. Build the request body for the backend
// =========================================================
function buildPayload() {
  const p = PARADIGMS[state.paradigm];

  const trials = state.trials
    .slice()
    .sort((a, b) => Number(a.order) - Number(b.order))
    .map((t, i) => {
      const stimulus = { content: t.content.trim() };
      if (p.hasColor) stimulus.displayColor = t.displayColor;
      if (t.durationMs) stimulus.durationMs = Number(t.durationMs);
      return {
        type: p.trialType,
        stimulus,
        responseOptions: t.responseOptions,
        correctResponse: t.correctResponse,
        order: i + 1,
      };
    });

  return {
    title: document.getElementById("expTitle").value.trim(),
    description: document.getElementById("expDesc").value.trim(),
    paradigm: state.paradigm,
    researcherId: RESEARCHER_ID,
    trials,
    settings: {
      randomizeTrialOrder: document.getElementById("setRandomize").checked,
      showConsentScreen: consentCheck.checked,
      consentText: document.getElementById("consentText").value.trim() || DEFAULT_CONSENT,
    },
  };
}

// Check everything before sending. Returns true if OK.
function validate() {
  document.querySelectorAll(".error").forEach((c) => c.classList.remove("error"));

  if (!document.getElementById("expTitle").value.trim()) {
    return fail("Please give your experiment a name.", document.getElementById("expTitle"));
  }
  if (!state.paradigm) {
    return fail("Please choose an experiment type.", document.getElementById("paradigmGrid"));
  }

  const minOptions = state.paradigm === "simple-rt" ? 1 : 2;
  for (let i = 0; i < state.trials.length; i++) {
    const t = state.trials[i];
    const card = trialList.children[i];
    if (!t.content.trim()) return fail(`Trial ${i + 1}: enter a stimulus.`, card);
    if (t.responseOptions.length < minOptions)
      return fail(`Trial ${i + 1}: tick at least ${minOptions} response options.`, card);
    if (!t.responseOptions.includes(t.correctResponse))
      return fail(`Trial ${i + 1}: choose a correct response.`, card);
  }
  return true;
}

function fail(message, element) {
  showToast(message);
  if (element) {
    element.classList.add("error");
    element.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  return false;
}

// =========================================================
//  5. Save Draft / Preview / Publish
// =========================================================
const saveStatus = document.getElementById("saveStatus");

// Returns the experiment id, or null if something went wrong
async function saveDraft() {
  if (!validate()) return null;
  saveStatus.textContent = "Saving…";

  try {
    const payload = buildPayload();
    const saved = state.id ? await updateExperiment(state.id, payload) : await createExperiment(payload);

    state.id = expId(saved) || state.id;
    history.replaceState(null, "", "create.html?id=" + state.id); // refreshing keeps your work
    document.getElementById("pageTitle").textContent = "Edit Experiment";
    saveStatus.textContent = "✓ Draft saved at " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return state.id;
  } catch (err) {
    saveStatus.textContent = "Save failed";
    showToast("Save failed: " + err.message);
    return null;
  }
}

document.getElementById("saveDraftBtn").addEventListener("click", async () => {
  if (await saveDraft()) showToast("Draft saved 💾");
});

document.getElementById("previewBtn").addEventListener("click", async () => {
  // Published: just open it. Draft: save first so the preview is up to date.
  const id = state.locked ? state.id : await saveDraft();
  if (id) window.open("run.html?preview=" + id, "_blank");
});

document.getElementById("publishBtn").addEventListener("click", async () => {
  if (!confirm("Publish this experiment?\n\nOnce published it can't be edited anymore.")) return;

  const id = await saveDraft();
  if (!id) return;

  try {
    const exp = await publishExperiment(id);
    lockBuilder(exp);
    document.getElementById("shareLinkInput").value = shareLink(exp);
    document.getElementById("publishModal").classList.remove("hidden");
  } catch (err) {
    showToast("Publish failed: " + err.message);
  }
});

document.getElementById("copyLinkBtn").addEventListener("click", () => {
  const input = document.getElementById("shareLinkInput");
  navigator.clipboard
    .writeText(input.value)
    .then(() => showToast("Link copied!"))
    .catch(() => input.select());
});

// Published experiments are read-only
function lockBuilder(exp) {
  state.locked = true;
  document.getElementById("builder").disabled = true;
  document.getElementById("lockedNote").classList.remove("hidden");
  document.getElementById("saveDraftBtn").classList.add("hidden");
  document.getElementById("publishBtn").classList.add("hidden");
  document.getElementById("addTrialBottom").classList.add("hidden");
  document.getElementById("pageTitle").textContent = "View Experiment";
  saveStatus.textContent = "Published";

  document.getElementById("lockedShare").onclick = (e) => {
    e.preventDefault();
    navigator.clipboard.writeText(shareLink(exp)).then(() => showToast("Link copied!"));
  };
}

// =========================================================
//  6. Opening an existing experiment (create.html?id=...)
// =========================================================
function fillForm(exp) {
  document.getElementById("expTitle").value = exp.title || "";
  document.getElementById("expDesc").value = exp.description || "";

  state.id = expId(exp);
  state.paradigm = exp.paradigm;
  state.trials = (exp.trials || [])
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((t) => ({
      content: t.stimulus?.content || "",
      displayColor: t.stimulus?.displayColor || "",
      responseOptions: [...(t.responseOptions || [])],
      correctResponse: t.correctResponse || "",
      durationMs: t.stimulus?.durationMs ?? "",
      order: t.order,
    }));

  const s = exp.settings || {};
  document.getElementById("setRandomize").checked = !!s.randomizeTrialOrder;
  consentCheck.checked = s.showConsentScreen !== false;
  document.getElementById("consentBox").classList.toggle("hidden", !consentCheck.checked);
  document.getElementById("consentText").value = s.consentText || DEFAULT_CONSENT;

  document.getElementById("pageTitle").textContent = "Edit Experiment";
  saveStatus.textContent = "Loaded";
}

async function init() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (id) {
    try {
      const exp = await getExperimentById(id);
      fillForm(exp);
      if (isPublished(exp)) lockBuilder(exp);
    } catch (err) {
      showToast("Couldn't load experiment: " + err.message);
    }
  } else if (PARADIGMS[params.get("paradigm")]) {
    // Coming from a type card on the home page
    selectParadigm(params.get("paradigm"));
  }

  renderParadigmCards();
  renderTrials();
  if (!id) listExperiments().catch(() => {}); // just to show the Connected/Offline badge
}

init();
