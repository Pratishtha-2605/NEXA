const BASE_URL = "http://localhost:5000/api/experiments";

const experiments = [
  {
    title: "Stroop Color Test",
    description: "Measures response inhibition and cognitive interference.",
    researcherId: "seed-researcher",
    trials: [
      { type: "color-word", stimulus: { content: "RED", displayColor: "blue" }, responseOptions: ["RED","BLUE","GREEN","YELLOW"], correctResponse: "BLUE", order: 1 },
      { type: "color-word", stimulus: { content: "BLUE", displayColor: "green" }, responseOptions: ["RED","BLUE","GREEN","YELLOW"], correctResponse: "GREEN", order: 2 },
      { type: "color-word", stimulus: { content: "GREEN", displayColor: "green" }, responseOptions: ["RED","BLUE","GREEN","YELLOW"], correctResponse: "GREEN", order: 3 },
    ],
  },
  {
    title: "Simple Reaction Time",
    description: "Measures how quickly a participant responds to a stimulus.",
    researcherId: "seed-researcher",
    trials: [
      { type: "text", stimulus: { content: "CLICK" }, responseOptions: ["CLICK"], correctResponse: "CLICK", order: 1 },
      { type: "text", stimulus: { content: "CLICK" }, responseOptions: ["CLICK"], correctResponse: "CLICK", order: 2 },
      { type: "text", stimulus: { content: "CLICK" }, responseOptions: ["CLICK"], correctResponse: "CLICK", order: 3 },
    ],
  },
  {
    title: "Go/No-Go",
    description: "Measures response inhibition.",
    researcherId: "seed-researcher",
    trials: [
      { type: "text", stimulus: { content: "X", displayColor: "green", durationMs: 800 }, responseOptions: ["GO","NO-GO"], correctResponse: "GO", order: 1 },
      { type: "text", stimulus: { content: "O", displayColor: "red", durationMs: 800 }, responseOptions: ["GO","NO-GO"], correctResponse: "NO-GO", order: 2 },
      { type: "text", stimulus: { content: "X", displayColor: "green", durationMs: 800 }, responseOptions: ["GO","NO-GO"], correctResponse: "GO", order: 3 },
    ],
  },
  {
    title: "Flanker Task",
    description: "Measures selective attention and response inhibition.",
    researcherId: "seed-researcher",
    trials: [
      { type: "text", stimulus: { content: "<<<<<" }, responseOptions: ["LEFT","RIGHT"], correctResponse: "LEFT", order: 1 },
      { type: "text", stimulus: { content: ">>>>>" }, responseOptions: ["LEFT","RIGHT"], correctResponse: "RIGHT", order: 2 },
      { type: "text", stimulus: { content: "<<><<" }, responseOptions: ["LEFT","RIGHT"], correctResponse: "RIGHT", order: 3 },
    ],
  },
  {
    title: "Lexical Decision Task",
    description: "Measures the ability to distinguish words from non-words.",
    researcherId: "seed-researcher",
    trials: [
      { type: "text", stimulus: { content: "APPLE" }, responseOptions: ["WORD","NON-WORD"], correctResponse: "WORD", order: 1 },
      { type: "text", stimulus: { content: "BLORP" }, responseOptions: ["WORD","NON-WORD"], correctResponse: "NON-WORD", order: 2 },
      { type: "text", stimulus: { content: "HOUSE" }, responseOptions: ["WORD","NON-WORD"], correctResponse: "WORD", order: 3 },
    ],
  },
];

async function seedExperiments() {
  for (const experiment of experiments) {
    try {
      // 1. Create
      const createRes = await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(experiment),
      });
      const created = await createRes.json();
      if (!createRes.ok) {
        console.error(`❌ Create failed: ${experiment.title}`, created);
        continue;
      }

      // 2. Publish (required — participant link only works once published)
      const publishRes = await fetch(`${BASE_URL}/${created._id}/publish`, { method: "PUT" });
      const published = await publishRes.json();
      if (!publishRes.ok) {
        console.error(`❌ Publish failed: ${experiment.title}`, published);
        continue;
      }
      const shareSlug = published.shareUrl.split("/").pop();

      // 3. Verify participant view hides correctResponse
      const participantRes = await fetch(`${BASE_URL}/run/${shareSlug}`);
      const participantView = await participantRes.json();
      const leaked = participantView.trials?.some((t) => "correctResponse" in t);

      console.log(`✅ ${experiment.title} | slug: ${shareSlug} | correctResponse hidden: ${!leaked}`);
    } catch (error) {
      console.error(`Error creating ${experiment.title}:`, error.message);
    }
  }
}

seedExperiments();