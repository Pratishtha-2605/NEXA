// ===== Results page: quick Stroop tests (browser data) =====
// (builder experiments opened with ?exp=<id> are handled by results-api.js)
if (!new URLSearchParams(window.location.search).get("exp")) {

const experiment = getExperiment(getIdFromUrl()) || getExperiment("stroop");
const responses = getResponses(experiment.id);

document.getElementById("resultsTitle").textContent = experiment.title + " — Results";
document.title = "CognitiveLab — " + experiment.title + " Results";

// Flatten: one row per (participant, trial)
const rows = [];
for (const r of responses) {
  for (const t of r.trials) {
    rows.push({ participantId: r.participantId, submittedAt: r.submittedAt, ...t });
  }
}

// ===== Top stat boxes =====
document.getElementById("statParticipants").textContent = responses.length;
document.getElementById("statTrials").textContent = experiment.trials.length;

if (rows.length === 0) {
  document.getElementById("emptyMsg").classList.remove("hidden");
  document.getElementById("resultsContent").classList.add("hidden");
  document.getElementById("participantsCard").classList.add("hidden");
} else {
  const avgRT = rows.reduce((sum, r) => sum + r.reactionTime, 0) / rows.length;
  const accuracy = (rows.filter((r) => r.correct).length / rows.length) * 100;
  document.getElementById("statRT").textContent = Math.round(avgRT) + " ms";
  document.getElementById("statAcc").textContent = accuracy.toFixed(1) + "%";

  renderTable();
  renderChart();
  renderParticipants();
}

// ===== Participants table (fastest average first) =====
function renderParticipants() {
  const myId = localStorage.getItem("cl_my_id");

  const list = responses
    .map((r) => ({ ...summarize(r), id: r.participantId, date: r.submittedAt }))
    .sort((a, b) => a.avgRT - b.avgRT);

  document.getElementById("participantTable").innerHTML = list
    .map((p, i) => {
      const medal = ["🥇", "🥈", "🥉"][i] || i + 1;
      const you = p.id === myId ? ' <span class="you-tag">You</span>' : "";
      return `
        <tr class="${p.id === myId ? "my-row" : ""}">
          <td>${medal}</td>
          <td class="mono">${p.id}${you}</td>
          <td>${p.avgRT} ms</td>
          <td>${fmtAcc(p.accuracy)}</td>
          <td class="hint">${formatDate(p.date)}</td>
        </tr>`;
    })
    .join("");
}

// ===== Per-trial table =====
function renderTable() {
  const tbody = document.getElementById("trialTable");

  experiment.trials.forEach((trial, i) => {
    const trialRows = rows.filter((r) => r.trial === i + 1);
    if (trialRows.length === 0) return;

    const acc = (trialRows.filter((r) => r.correct).length / trialRows.length) * 100;
    const rt = trialRows.reduce((sum, r) => sum + r.reactionTime, 0) / trialRows.length;

    tbody.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(trial.word)}</td>
        <td><span class="dot" style="background:${trial.color}"></span>${trial.color}</td>
        <td>${Math.round(acc)}%</td>
        <td>${Math.round(rt)} ms</td>
      </tr>`;
  });
}

// ===== Reaction time histogram (100 ms buckets) =====
function renderChart() {
  if (typeof Chart === "undefined") return; // no internet → skip the chart

  const bucketSize = 100;
  const counts = {};
  for (const r of rows) {
    const bucket = Math.floor(r.reactionTime / bucketSize) * bucketSize;
    counts[bucket] = (counts[bucket] || 0) + 1;
  }
  const buckets = Object.keys(counts).map(Number).sort((a, b) => a - b);

  new Chart(document.getElementById("rtChart"), {
    type: "bar",
    data: {
      labels: buckets.map((b) => `${b}–${b + bucketSize}`),
      datasets: [
        {
          label: "Responses",
          data: buckets.map((b) => counts[b]),
          backgroundColor: "rgba(0, 153, 255, 0.7)",
          borderRadius: 4,
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          title: { display: true, text: "Reaction time (ms)", color: "#8892a0" },
          ticks: { color: "#8892a0" },
          grid: { display: false },
        },
        y: {
          title: { display: true, text: "Responses", color: "#8892a0" },
          ticks: { color: "#8892a0", precision: 0 },
          grid: { color: "#2d333b" },
        },
      },
    },
  });
}

// ===== CSV download =====
document.getElementById("csvBtn").addEventListener("click", () => {
  if (rows.length === 0) {
    showToast("No responses to download yet.");
    return;
  }

  const header = "participant_id,submitted_at,trial,word,ink_color,response,correct,reaction_time_ms";
  const lines = rows.map((r) =>
    [r.participantId, r.submittedAt, r.trial, r.word, r.color, r.response, r.correct, r.reactionTime].join(",")
  );
  const csv = [header, ...lines].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = experiment.title.replace(/\s+/g, "_") + "_results.csv";
  link.click();
  showToast("CSV downloaded");
});
}
