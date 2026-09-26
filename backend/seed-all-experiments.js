/**
 * Creates ONE experiment per supported paradigm, fully populated with trials.
 * Run after your server + Atlas connection are live: node seed-all-experiments.js
 *
 * Each experiment is created -> trials added -> published -> verified as a
 * participant would see it (correctResponse must NOT appear).
 */

const BASE_URL = 'http://localhost:5000/api/experiments';
const RESEARCHER_ID = 'test-researcher-1';

// ---------------------------------------------------------------------------
// 1. STROOP — reading vs. color-naming interference
// type: 'color-word' | stimulus.content = the WORD, stimulus.displayColor = the INK color
// correctResponse = the ink color (not the word)
// ---------------------------------------------------------------------------
const stroop = {
  title: 'Stroop Color Test',
  description: 'Name the ink color, ignore the word.',
  settings: { randomizeTrialOrder: true, showConsentScreen: true },
  trials: [
    { type: 'color-word', stimulus: { content: 'RED', displayColor: 'blue' }, responseOptions: ['red','green','blue','yellow'], correctResponse: 'blue', order: 1 },
    { type: 'color-word', stimulus: { content: 'GREEN', displayColor: 'green' }, responseOptions: ['red','green','blue','yellow'], correctResponse: 'green', order: 2 },
    { type: 'color-word', stimulus: { content: 'BLUE', displayColor: 'red' }, responseOptions: ['red','green','blue','yellow'], correctResponse: 'red', order: 3 },
    { type: 'color-word', stimulus: { content: 'YELLOW', displayColor: 'yellow' }, responseOptions: ['red','green','blue','yellow'], correctResponse: 'yellow', order: 4 },
    { type: 'color-word', stimulus: { content: 'RED', displayColor: 'green' }, responseOptions: ['red','green','blue','yellow'], correctResponse: 'green', order: 5 },
    { type: 'color-word', stimulus: { content: 'BLUE', displayColor: 'blue' }, responseOptions: ['red','green','blue','yellow'], correctResponse: 'blue', order: 6 },
  ],
};

// ---------------------------------------------------------------------------
// 2. SIMPLE REACTION TIME — pure speed, no decision
// type: 'text' | single responseOption, always correct if they respond at all
// durationMs left null = waits indefinitely for the click/keypress
// ---------------------------------------------------------------------------
const simpleRT = {
  title: 'Simple Reaction Time',
  description: 'Click as soon as you see the stimulus.',
  settings: { randomizeTrialOrder: false, showConsentScreen: true },
  trials: [1,2,3,4,5,6].map((i) => ({
    type: 'text',
    stimulus: { content: 'CLICK NOW', durationMs: null },
    responseOptions: ['click'],
    correctResponse: 'click',
    order: i,
  })),
};

// ---------------------------------------------------------------------------
// 3. GO / NO-GO — response inhibition
// type: 'text' | durationMs IS set — stimulus auto-disappears
// If participant does nothing before durationMs elapses, frontend must submit
// response: 'withhold' automatically. This is the one type where "no click"
// is itself a valid, sometimes-correct answer.
// ---------------------------------------------------------------------------
const goNoGo = {
  title: 'Go/No-Go Task',
  description: 'Respond to green X, withhold on red O.',
  settings: { randomizeTrialOrder: true, showConsentScreen: true },
  trials: [
    { type: 'text', stimulus: { content: 'X', displayColor: 'green', durationMs: 800 }, responseOptions: ['respond','withhold'], correctResponse: 'respond', order: 1 },
    { type: 'text', stimulus: { content: 'O', displayColor: 'red', durationMs: 800 }, responseOptions: ['respond','withhold'], correctResponse: 'withhold', order: 2 },
    { type: 'text', stimulus: { content: 'X', displayColor: 'green', durationMs: 800 }, responseOptions: ['respond','withhold'], correctResponse: 'respond', order: 3 },
    { type: 'text', stimulus: { content: 'X', displayColor: 'green', durationMs: 800 }, responseOptions: ['respond','withhold'], correctResponse: 'respond', order: 4 },
    { type: 'text', stimulus: { content: 'O', displayColor: 'red', durationMs: 800 }, responseOptions: ['respond','withhold'], correctResponse: 'withhold', order: 5 },
    { type: 'text', stimulus: { content: 'O', displayColor: 'red', durationMs: 800 }, responseOptions: ['respond','withhold'], correctResponse: 'withhold', order: 6 },
  ],
};

// ---------------------------------------------------------------------------
// 4. FLANKER — selective attention, ignore distractors
// type: 'text' | stimulus.content = full 5-character string
// The MIDDLE character is the actual target; outer ones are distractors
// correctResponse is based on the CENTER arrow's direction only
// ---------------------------------------------------------------------------
const flanker = {
  title: 'Flanker Task',
  description: 'Respond to the direction of the MIDDLE arrow only.',
  settings: { randomizeTrialOrder: true, showConsentScreen: true },
  trials: [
    { type: 'text', stimulus: { content: '< < < < <' }, responseOptions: ['left','right'], correctResponse: 'left', order: 1 },  // congruent
    { type: 'text', stimulus: { content: '> > > > >' }, responseOptions: ['left','right'], correctResponse: 'right', order: 2 }, // congruent
    { type: 'text', stimulus: { content: '< < > < <' }, responseOptions: ['left','right'], correctResponse: 'right', order: 3 }, // incongruent
    { type: 'text', stimulus: { content: '> > < > >' }, responseOptions: ['left','right'], correctResponse: 'left', order: 4 },  // incongruent
    { type: 'text', stimulus: { content: '< < < < <' }, responseOptions: ['left','right'], correctResponse: 'left', order: 5 },
    { type: 'text', stimulus: { content: '> > < > >' }, responseOptions: ['left','right'], correctResponse: 'left', order: 6 },
  ],
};

// ---------------------------------------------------------------------------
// 5. LEXICAL DECISION — real word vs. non-word
// type: 'text' | plain word list, correctResponse is 'word' or 'nonword'
// ---------------------------------------------------------------------------
const lexicalDecision = {
  title: 'Lexical Decision Task',
  description: 'Decide if the letter string is a real word.',
  settings: { randomizeTrialOrder: true, showConsentScreen: true },
  trials: [
    { type: 'text', stimulus: { content: 'GARDEN' }, responseOptions: ['word','nonword'], correctResponse: 'word', order: 1 },
    { type: 'text', stimulus: { content: 'FLIRTAGE' }, responseOptions: ['word','nonword'], correctResponse: 'nonword', order: 2 },
    { type: 'text', stimulus: { content: 'WINDOW' }, responseOptions: ['word','nonword'], correctResponse: 'word', order: 3 },
    { type: 'text', stimulus: { content: 'BLINTER' }, responseOptions: ['word','nonword'], correctResponse: 'nonword', order: 4 },
    { type: 'text', stimulus: { content: 'PENCIL' }, responseOptions: ['word','nonword'], correctResponse: 'word', order: 5 },
    { type: 'text', stimulus: { content: 'CROMBLE' }, responseOptions: ['word','nonword'], correctResponse: 'nonword', order: 6 },
  ],
};

const ALL_EXPERIMENTS = [stroop, simpleRT, goNoGo, flanker, lexicalDecision];

async function createAndPublish(def) {
  const createRes = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: def.title, description: def.description, researcherId: RESEARCHER_ID }),
  });
  const experiment = await createRes.json();
  if (!createRes.ok) throw new Error(`${def.title}: ${JSON.stringify(experiment)}`);

  const updateRes = await fetch(`${BASE_URL}/${experiment._id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trials: def.trials, settings: def.settings }),
  });
  if (!updateRes.ok) throw new Error(`${def.title} trials: ${JSON.stringify(await updateRes.json())}`);

  const publishRes = await fetch(`${BASE_URL}/${experiment._id}/publish`, { method: 'PUT' });
  const published = await publishRes.json();
  if (!publishRes.ok) throw new Error(`${def.title} publish: ${JSON.stringify(published)}`);

  const shareSlug = published.shareUrl.split('/').pop();
  const participantRes = await fetch(`${BASE_URL}/run/${shareSlug}`);
  const participantView = await participantRes.json();
  const leaked = participantView.trials?.some((t) => 'correctResponse' in t);

  console.log(`✅ ${def.title}`);
  console.log(`   id: ${experiment._id} | slug: ${shareSlug} | trials: ${def.trials.length}`);
  console.log(`   correctResponse hidden from participant: ${!leaked}`);
}

async function main() {
  for (const def of ALL_EXPERIMENTS) {
    await createAndPublish(def);
  }
  console.log('\nAll 5 experiment types seeded and verified.');
}

main().catch((err) => {
  console.error('Seed script failed:', err.message);
  process.exit(1);
});