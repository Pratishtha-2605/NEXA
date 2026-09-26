// ===== Dashboard page (My Experiments) =====
// The cards and buttons live in cards.js, the backend calls in api.js.

renderExperimentCards();

// ===== Recent Activity table (latest 10 submissions on this device) =====
function renderActivity() {
  const tbody = document.getElementById("activityTable");
  const myId = localStorage.getItem("cl_my_id");

  const latest = getResponses()
    .slice()
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    .slice(0, 10);

  if (latest.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="hint">No submissions yet.</td></tr>';
    return;
  }

  tbody.innerHTML = latest
    .map((r) => {
      const exp = getExperiment(r.experimentId); // quick Stroop tests have a results page
      const s = summarize(r);
      const you = r.participantId === myId ? ' <span class="you-tag">You</span>' : "";
      const click = exp ? `class="clickable" onclick="location.href='results.html?id=${r.experimentId}'"` : "";
      return `
        <tr ${click}>
          <td class="mono">${r.participantId}${you}</td>
          <td>${escapeHtml(exp ? exp.title : r.experimentTitle || "Experiment")}</td>
          <td>${r.trials.length}</td>
          <td>${s.avgRT} ms</td>
          <td>${fmtAcc(s.accuracy)}</td>
          <td class="hint">${formatDate(r.submittedAt)}</td>
        </tr>`;
    })
    .join("");
}

renderActivity();
