// =========================================================
//  Experiment cards: shared by the Dashboard and the Home page
//  Needs: <div id="experimentList"> on the page
//  Optional stat boxes: #statExperiments #statPublished #statDrafts #statTrials
// =========================================================

function experimentCard(exp) {
  const id = expId(exp);
  const p = paradigmOf(exp);
  const published = isPublished(exp);

  const badge = published
    ? '<span class="badge badge-live">Published</span>'
    : '<span class="badge badge-draft">Draft</span>';

  // Drafts: Edit / Preview / Publish     Published: View / Results / Share
  const actions = published
    ? `
      <a class="btn-secondary btn-link btn-small" href="run.html?preview=${id}">View</a>
      <a class="btn-secondary btn-link btn-small" href="results.html?exp=${id}">📊 Results</a>
      <button class="btn-secondary btn-small-btn" onclick="copyShareLink('${exp.shareSlug}')">🔗 Share</button>`
    : `
      <a class="btn-secondary btn-link btn-small" href="create.html?id=${id}">Edit</a>
      <a class="btn-secondary btn-link btn-small" href="run.html?preview=${id}" target="_blank">Preview</a>
      <button class="btn-small-btn" onclick="publishFromCard('${id}')">Publish</button>`;

  const link = published
    ? `<div class="share-line mono" title="Share link">run.html?slug=${escapeHtml(exp.shareSlug || "")}</div>`
    : "";

  return `
    <article class="card">
      <div class="card-top">
        <h3 class="card-title">${escapeHtml(exp.title || "Untitled")}</h3>
        ${badge}
      </div>
      <div class="type-pill">${p.icon} ${p.label}</div>
      <p class="card-desc">${escapeHtml(exp.description || "No description")}</p>
      <div class="card-meta">${trialCountOf(exp)} Trials</div>
      ${link}
      <div class="card-actions">${actions}</div>
    </article>`;
}

async function renderExperimentCards() {
  const list = document.getElementById("experimentList");
  list.innerHTML = '<p class="hint">Loading experiments…</p>';

  let experiments;
  try {
    experiments = await listExperiments();
  } catch (err) {
    list.innerHTML = `<p class="empty">Couldn't load experiments: ${escapeHtml(err.message)}</p>`;
    return;
  }

  if (experiments.length === 0) {
    list.innerHTML =
      '<div class="empty"><p>No experiments yet.</p><a class="btn-link btn-big" href="create.html">+ Create your first experiment</a></div>';
  } else {
    // Newest first
    list.innerHTML = experiments.slice().reverse().map(experimentCard).join("");
  }

  const published = experiments.filter(isPublished).length;
  const trials = experiments.reduce((sum, e) => sum + trialCountOf(e), 0);
  setText("statExperiments", experiments.length);
  setText("statPublished", published);
  setText("statDrafts", experiments.length - published);
  setText("statTrials", trials);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

async function publishFromCard(id) {
  if (!confirm("Publish this experiment?\n\nPublished experiments can no longer be edited.")) return;
  try {
    const exp = await publishExperiment(id);
    showToast("Published! Share link is ready.");
    if (exp && exp.shareSlug) copyShareLink(exp.shareSlug, true);
    renderExperimentCards();
  } catch (err) {
    showToast("Publish failed: " + err.message);
  }
}

function copyShareLink(slug, silent) {
  const link = new URL("run.html?slug=" + slug, window.location.href).href;
  navigator.clipboard
    .writeText(link)
    .then(() => !silent && showToast("Share link copied! Send it to your participants."))
    .catch(() => showToast(link));
}
