// ===== Results page: builder experiments (from the backend) =====
// Opened as results.html?exp=<experimentId>
// Uses GET /api/responses/:id/stats, GET /api/responses/:id and /export

const apiExperimentId = new URLSearchParams(window.location.search).get("exp");
if (apiExperimentId) loadApiResults(apiExperimentId);

async function loadApiResults(id) {
  // Experiment details (for titles, stimuli and correct answers)
  let exp = { title: "Experiment", trials: [] };
  try {
    exp = await getExperimentById(id);
  } catch (err) {
    showToast("Couldn't load experiment: " + err.message);
  }

  const p = paradigmOf(exp);
  document.getElementById("resultsTitle").textContent = exp.title + " — Results";
  document.getElementById("resultsSub").textContent = p.icon + " " + p.label + " · all responses collected for this experiment.";
  document.title = "CognitiveLab — " + exp.title + " Results";

  let stats;
  try {
    stats = await getExperimentStats(id);
  } catch (err) {
    showToast("Couldn't load results: " + err.message);
    return;
  }

  // ----- Top 4 numbers -----
  document.getElementById("statParticipants").textContent = stats.participants;
  document.getElementById("statTrials").textContent = trialCountOf(exp);
  document.getElementById("statRT").textContent = stats.averageReactionTime + " ms";
  document.getElementById("statAcc").textContent = stats.accuracy + "%";

  if (!stats.trials) {
    document.getElementById("emptyMsg").classList.remove("hidden");
    document.getElementById("resultsContent").classList.add("hidden");
    document.getElementById("participantsCard").classList.add("hidden");
    return;
  }

  // ----- Per-trial table -----
  document.querySelector("#resultsContent thead tr").innerHTML =
    "<th>Trial</th><th>Stimulus</th><th>Correct</th><th>Accuracy</th><th>Avg RT</th>";

  document.getElementById("trialTable").innerHTML = stats.perTrial
    .map((row) => {
      const trial = (exp.trials || []).find((t) => t.order === row.trial) || {};
      const color = trial.stimulus?.displayColor;
      const style = color ? `style="color:${INK_HEX[color] || color}"` : "";
      return `
        <tr>
          <td>${row.trial}</td>
          <td class="mono" ${style}>${escapeHtml(trial.stimulus?.content || "—")}</td>
          <td>${escapeHtml(trial.correctResponse || "—")}</td>
          <td>${row.accuracy}%</td>
          <td>${row.avgRT} ms</td>
        </tr>`;
    })
    .join("");

  // ----- Chart: average reaction time per trial -----
  document.querySelector("#resultsContent h2").textContent = "Average Reaction Time per Trial";
  if (typeof Chart !== "undefined") {
    new Chart(document.getElementById("rtChart"), {
      type: "bar",
      data: {
        labels: stats.perTrial.map((r) => "Trial " + r.trial),
        datasets: [
          {
            label: "Avg RT (ms)",
            data: stats.perTrial.map((r) => r.avgRT),
            backgroundColor: "rgba(0, 153, 255, 0.7)",
            borderRadius: 4,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: "#8892a0" }, grid: { display: false } },
          y: {
            title: { display: true, text: "ms", color: "#8892a0" },
            ticks: { color: "#8892a0" },
            grid: { color: "#2d333b" },
          },
        },
      },
    });
  }

  // ----- Participants table (fastest first) -----
  const responses = await getResponsesByExperiment(id).catch(() => []);
  const byPerson = {};
  responses.forEach((r) => (byPerson[r.participantId] = byPerson[r.participantId] || []).push(r));
  const myId = localStorage.getItem("cl_my_id");

  const people = Object.entries(byPerson)
    .map(([pid, list]) => ({
      pid,
      avgRT: Math.round(list.reduce((s, r) => s + r.reactionTime, 0) / list.length),
      accuracy: Math.round((list.filter((r) => r.isCorrect).length / list.length) * 100),
      date: list[list.length - 1].submittedAt,
    }))
    .sort((a, b) => a.avgRT - b.avgRT);

  document.getElementById("participantTable").innerHTML = people
    .map((person, i) => {
      const medal = ["🥇", "🥈", "🥉"][i] || i + 1;
      const you = person.pid === myId ? ' <span class="you-tag">You</span>' : "";
      return `
        <tr class="${person.pid === myId ? "my-row" : ""}">
          <td>${medal}</td>
          <td class="mono">${escapeHtml(person.pid)}${you}</td>
          <td>${person.avgRT} ms</td>
          <td>${person.accuracy}%</td>
          <td class="hint">${person.date ? formatDate(person.date) : "—"}</td>
        </tr>`;
    })
    .join("");

  // ----- CSV: the backend makes the file; offline we build it here -----
  document.getElementById("csvBtn").addEventListener("click", () => {
    if (backendOnline) {
      window.location.href = getExportUrl(id);
      return;
    }
    const header = "participantId,trialIndex,stimulusOnsetTimestamp,responseTimestamp,reactionTime,isCorrect,submittedAt";
    const lines = responses.map((r) =>
      [r.participantId, r.trialIndex, r.stimulusOnsetTimestamp, r.responseTimestamp, r.reactionTime, r.isCorrect ?? "", r.submittedAt].join(",")
    );
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = (exp.title || "results").replace(/\s+/g, "_") + "_results.csv";
    link.click();
    showToast("CSV downloaded");
  });
}
