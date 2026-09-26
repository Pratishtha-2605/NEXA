// ===== Home page: everything on one scrolling page =====

// ---------- 1. Animated Stroop preview ----------
const inkHex = { red: "#ff6b6b", blue: "#4dabf7", green: "#51cf66", yellow: "#fcc419" };
const demoWord = document.getElementById("demoWord");
const demoRT = document.getElementById("demoRT");

setInterval(() => {
  const word = COLORS[Math.floor(Math.random() * 4)];
  const ink = COLORS[Math.floor(Math.random() * 4)];

  demoWord.classList.remove("pop");
  void demoWord.offsetWidth; // restart the animation
  demoWord.classList.add("pop");

  demoWord.textContent = word.toUpperCase();
  demoWord.style.color = inkHex[ink];

  // Preview only: mismatched word/ink is slower
  const base = word === ink ? 520 : 690;
  demoRT.textContent = base + Math.floor(Math.random() * 120) + " ms";
}, 1400);

// ---------- 2. Create: the 5 experiment types ----------
// Clicking a type opens the builder with that type already chosen
document.getElementById("homeParadigms").innerHTML = Object.entries(PARADIGMS)
  .map(
    ([key, p]) => `
    <a class="paradigm-card" href="create.html?paradigm=${key}">
      <span class="paradigm-icon">${p.icon}</span>
      <span class="paradigm-name">${p.label}</span>
      <span class="paradigm-about">${p.about}</span>
      <span class="paradigm-go">Create →</span>
    </a>`
  )
  .join("");

// ---------- Quick Stroop test (the original quick form) ----------
document.getElementById("quickCreateBtn").addEventListener("click", () => {
  const title = document.getElementById("quickTitle").value.trim();
  const description = document.getElementById("quickDesc").value.trim();
  const count = Number(document.getElementById("quickTrials").value);

  if (!title) {
    showToast("Please give your experiment a title.");
    return;
  }

  const experiments = getExperiments();
  experiments.push({
    id: "exp-" + Date.now(),
    title,
    description,
    status: "live",
    trials: makeStroopTrials(count),
  });
  saveExperiments(experiments);

  document.getElementById("quickTitle").value = "";
  document.getElementById("quickDesc").value = "";
  renderDemoExperiments();
  showToast("Quick test created! Scroll down to see it.");
  document.getElementById("demoList").scrollIntoView({ behavior: "smooth", block: "center" });
});

// ---------- 3 + 4. Totals + experiment cards ----------
// Builder experiments: renderExperimentCards() in cards.js (from the backend)

// Quick Stroop tests: Take test / Results / Share, with participant counts
function demoCard(exp) {
  const participants = getResponses(exp.id).length;
  const badge =
    exp.status === "draft"
      ? '<span class="badge badge-draft">Draft</span>'
      : '<span class="badge badge-live">Live</span>';

  return `
    <article class="card">
      <div class="card-top">
        <h3 class="card-title">${escapeHtml(exp.title)}</h3>
        ${badge}
      </div>
      <div class="type-pill">🎨 Stroop · quick</div>
      <p class="card-desc">${escapeHtml(exp.description || "No description")}</p>
      <div class="card-meta">${exp.trials.length} Trials • ${participants} Participants</div>
      <div class="card-actions">
        <a class="btn-secondary btn-link btn-small" href="experiment.html?id=${exp.id}">Take test</a>
        <a class="btn-secondary btn-link btn-small" href="results.html?id=${exp.id}">📊 Results</a>
        <button class="btn-secondary btn-small-btn" onclick="shareDemo('${exp.id}')">🔗 Share</button>
      </div>
    </article>`;
}

function renderDemoExperiments() {
  const experiments = getExperiments();
  document.getElementById("demoList").innerHTML = experiments.map(demoCard).join("");
  document.getElementById("statParticipants").textContent = getResponses().length;
}

function shareDemo(id) {
  const link = new URL("experiment.html?id=" + id, window.location.href).href;
  navigator.clipboard
    .writeText(link)
    .then(() => showToast("Link copied! Send it to your participants."))
    .catch(() => showToast(link));
}

// ---------- 5. My Progress ----------
const myId = getMyParticipantId();
document.getElementById("myIdTag").textContent = myId;

function renderProgress() {
  const attempts = getResponses()
    .filter((r) => r.participantId === myId)
    .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))
    .map((r) => ({ ...r, ...summarize(r) }));

  if (attempts.length === 0) {
    document.getElementById("progressEmpty").classList.remove("hidden");
    document.getElementById("progressContent").classList.add("hidden");
    return;
  }

  const first = attempts[0];
  const latest = attempts[attempts.length - 1];

  document.getElementById("statAttempts").textContent = attempts.length;
  document.getElementById("statLatest").textContent = latest.avgRT + " ms";
  document.getElementById("statBest").textContent = Math.min(...attempts.map((a) => a.avgRT)) + " ms";

  const improveEl = document.getElementById("statImprove");
  const noteEl = document.getElementById("statImproveNote");
  if (attempts.length < 2) {
    noteEl.textContent = "take one more test to compare";
  } else {
    const percent = Math.round(((first.avgRT - latest.avgRT) / first.avgRT) * 100);
    improveEl.textContent = (percent >= 0 ? "▲ " : "▼ ") + Math.abs(percent) + "%";
    improveEl.classList.add(percent >= 0 ? "good" : "bad");
    noteEl.textContent = percent >= 0 ? "faster than your first attempt" : "slower than your first attempt";
  }

  renderProgressChart(attempts);
  renderInsights(attempts);
}

function renderProgressChart(attempts) {
  if (typeof Chart === "undefined") return; // no internet → skip the chart

  new Chart(document.getElementById("progressChart"), {
    type: "line",
    data: {
      labels: attempts.map((a, i) => "#" + (i + 1)),
      datasets: [
        {
          label: "Avg reaction time (ms)",
          data: attempts.map((a) => a.avgRT),
          borderColor: "rgb(0, 153, 255)",
          backgroundColor: "rgba(0, 153, 255, 0.15)",
          fill: true,
          tension: 0.3,
          pointRadius: 5,
          yAxisID: "rt",
        },
        {
          label: "Accuracy (%)",
          data: attempts.map((a) => a.accuracy),
          borderColor: "#3fb950",
          borderDash: [6, 4],
          tension: 0.3,
          pointRadius: 4,
          yAxisID: "acc",
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: { legend: { labels: { color: "#8892a0" } } },
      scales: {
        x: { ticks: { color: "#8892a0" }, grid: { display: false } },
        rt: { position: "left", ticks: { color: "#8892a0" }, grid: { color: "#2d333b" } },
        acc: { position: "right", min: 0, max: 100, ticks: { color: "#8892a0" }, grid: { display: false } },
      },
    },
  });
}

function renderInsights(attempts) {
  const tips = [];
  const latest = attempts[attempts.length - 1];
  const avg = (list) => Math.round(list.reduce((s, t) => s + t.reactionTime, 0) / list.length);

  // The Stroop effect: mismatched trials minus matching trials
  // (only color-word trials that got a response count)
  const all = attempts
    .flatMap((a) => a.trials)
    .filter((t) => t.color && t.word && typeof t.reactionTime === "number");
  const match = all.filter((t) => t.word.toLowerCase() === t.color);
  const mismatch = all.filter((t) => t.word.toLowerCase() !== t.color);
  if (match.length && mismatch.length) {
    tips.push(
      `<b>Your Stroop effect: ${avg(mismatch) - avg(match)} ms.</b> Matching trials ` +
        `(RED in red) take you ${avg(match)} ms, mismatched ones ${avg(mismatch)} ms.`
    );
  }

  if (attempts.length >= 2) {
    const prev = attempts[attempts.length - 2];
    tips.push(
      latest.avgRT < prev.avgRT
        ? "🚀 Your last attempt was faster than the one before. Keep going!"
        : "🧘 Your last attempt was a bit slower. Try again when you're rested."
    );
  } else {
    tips.push("📊 Take the test a few more times to see your improvement trend.");
  }

  // Accuracy is only known for tests that include the answers
  if (latest.accuracy !== null) {
    tips.push(
      latest.accuracy < 80
        ? "🎯 Accuracy is below 80%. Slow down slightly and focus."
        : `🎯 Great accuracy (${latest.accuracy}%) on your latest attempt.`
    );
  }

  document.getElementById("insights").innerHTML = tips.map((t) => `<li>${t}</li>`).join("");
}

// ---------- 6. History (all submissions, newest first) ----------
function renderHistory() {
  const all = getResponses()
    .slice()
    .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));

  // Remember each participant's previous average, per experiment
  const lastRT = {};
  const rows = all.map((r) => {
    const s = summarize(r);
    const key = r.participantId + "|" + r.experimentId;
    let change = '<span class="hint">first try</span>';
    if (lastRT[key] !== undefined) {
      const diff = s.avgRT - lastRT[key];
      change =
        diff <= 0
          ? `<span class="good">▲ ${Math.abs(diff)} ms faster</span>`
          : `<span class="bad">▼ ${diff} ms slower</span>`;
    }
    lastRT[key] = s.avgRT;

    const exp = getExperiment(r.experimentId);
    const you = r.participantId === myId ? ' <span class="you-tag">You</span>' : "";
    return `
      <tr class="${exp ? "clickable" : ""}" onclick="${exp ? `location.href='results.html?id=${r.experimentId}'` : ""}">
        <td class="mono">${r.participantId}${you}</td>
        <td>${escapeHtml(exp ? exp.title : r.experimentTitle || "Deleted experiment")}</td>
        <td>${s.avgRT} ms</td>
        <td>${fmtAcc(s.accuracy)}</td>
        <td>${change}</td>
        <td class="hint">${formatDate(r.submittedAt)}</td>
      </tr>`;
  });

  document.getElementById("historyTable").innerHTML =
    rows.reverse().join("") || '<tr><td colspan="6" class="hint">No submissions yet.</td></tr>';
}

// ---------- 7. Contact form ----------
document.getElementById("contactForm").addEventListener("submit", (e) => {
  e.preventDefault(); // stop the page from reloading

  const messages = JSON.parse(localStorage.getItem("cl_messages")) || [];
  messages.push({
    name: document.getElementById("contactName").value.trim(),
    email: document.getElementById("contactEmail").value.trim(),
    message: document.getElementById("contactMsg").value.trim(),
    sentAt: new Date().toISOString(),
  });
  localStorage.setItem("cl_messages", JSON.stringify(messages));

  e.target.reset();
  showToast("Thanks! Your message has been saved.");
});

// ---------- 8. Feedback with star rating ----------
let rating = 0;
const starButtons = document.querySelectorAll("#stars button");

starButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    rating = Number(btn.dataset.star);
    starButtons.forEach((b) => b.classList.toggle("on", Number(b.dataset.star) <= rating));
  });
});

document.getElementById("feedbackForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const text = document.getElementById("feedbackText").value.trim();

  if (rating === 0) {
    showToast("Please pick a star rating.");
    return;
  }

  const list = JSON.parse(localStorage.getItem("cl_feedback")) || [];
  list.push({ rating, text, by: myId, at: new Date().toISOString() });
  localStorage.setItem("cl_feedback", JSON.stringify(list));

  e.target.reset();
  rating = 0;
  starButtons.forEach((b) => b.classList.remove("on"));
  renderFeedback();
  showToast("Thanks for your feedback! 💙");
});

function renderFeedback() {
  const list = (JSON.parse(localStorage.getItem("cl_feedback")) || []).slice().reverse().slice(0, 5);
  const box = document.getElementById("feedbackList");

  if (list.length === 0) {
    box.innerHTML = '<p class="hint">No feedback yet. Be the first!</p>';
    return;
  }

  box.innerHTML = list
    .map(
      (f) => `
      <div class="feedback-item">
        <div class="feedback-top">
          <span class="feedback-stars">${"★".repeat(f.rating)}${"☆".repeat(5 - f.rating)}</span>
          <span class="hint">${f.by} · ${formatDate(f.at)}</span>
        </div>
        <p>${escapeHtml(f.text || "(no comment)")}</p>
      </div>`
    )
    .join("");
}

// ---------- Mobile menu + highlight current section ----------
document.getElementById("menuBtn").addEventListener("click", () => {
  document.getElementById("navLinks").classList.toggle("open");
});

document.querySelectorAll("#navLinks a").forEach((link) => {
  link.addEventListener("click", () => document.getElementById("navLinks").classList.remove("open"));
});

const navLinks = document.querySelectorAll('#navLinks a[href^="#"]');
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + entry.target.id));
    });
  },
  { rootMargin: "-45% 0px -50% 0px" }
);
document.querySelectorAll("section[id]").forEach((s) => observer.observe(s));

// ---------- Draw everything ----------
renderExperimentCards();
renderDemoExperiments();
renderProgress();
renderHistory();
renderFeedback();
