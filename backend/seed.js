/**
 * Adds ONE published demo experiment for each of the 5 paradigms.
 * They show up on the dashboard (researcher "researcher-123").
 *
 *   cd backend
 *   npm run seed
 *
 * Safe to run again: it deletes the old demo experiments first.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Experiment = require('./models/Experiment');

const RESEARCHER_ID = 'researcher-123';
const COLORS = ['red', 'green', 'blue', 'yellow'];

const trial = (type, order, content, options, correct, extra = {}) => ({
  type,
  stimulus: { content, ...extra },
  responseOptions: options,
  correctResponse: correct,
  order,
});

const experiments = [
  {
    title: 'Stroop Color Test',
    description: 'Name the ink color, ignore the word.',
    paradigm: 'stroop',
    settings: { randomizeTrialOrder: true },
    trials: [
      ['RED', 'blue'], ['GREEN', 'green'], ['BLUE', 'red'],
      ['YELLOW', 'yellow'], ['RED', 'green'], ['BLUE', 'blue'],
    ].map(([word, ink], i) =>
      trial('color-word', i + 1, word, COLORS, ink, { displayColor: ink, durationMs: 2000 })
    ),
  },
  {
    title: 'Simple Reaction Time',
    description: 'Click as soon as you see the stimulus.',
    paradigm: 'simple-reaction-time',
    trials: [1, 2, 3, 4, 5, 6].map((i) => trial('text', i, 'CLICK NOW', ['click'], 'click')),
  },
  {
    title: 'Go/No-Go Task',
    description: 'Respond to GO, hold back on STOP.',
    paradigm: 'go-no-go',
    settings: { randomizeTrialOrder: true },
    trials: ['GO', 'STOP', 'GO', 'GO', 'STOP', 'GO'].map((s, i) =>
      trial('text', i + 1, s, ['respond', 'withhold'], s === 'GO' ? 'respond' : 'withhold', { durationMs: 1000 })
    ),
  },
  {
    title: 'Arrow Flanker Task',
    description: 'Which way does the middle arrow point?',
    paradigm: 'flanker',
    settings: { randomizeTrialOrder: true },
    trials: ['<<<<<', '>>>>>', '<<><<', '>><>>', '<<<<<', '>><>>'].map((s, i) =>
      trial('text', i + 1, s, ['left', 'right'], s[2] === '<' ? 'left' : 'right', { durationMs: 2000 })
    ),
  },
  {
    title: 'Lexical Decision Task',
    description: 'Is it a real English word?',
    paradigm: 'lexical-decision',
    settings: { randomizeTrialOrder: true },
    trials: [
      ['COMPUTER', 'word'], ['BLORT', 'non-word'], ['GARDEN', 'word'],
      ['FLIMP', 'non-word'], ['WINDOW', 'word'], ['TRASK', 'non-word'],
    ].map(([w, answer], i) => trial('text', i + 1, w, ['word', 'non-word'], answer, { durationMs: 2500 })),
  },
];

async function main() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) throw new Error('Missing MONGO_URI in backend/.env');
  await mongoose.connect(uri);

  const titles = experiments.map((e) => e.title);
  await Experiment.deleteMany({ researcherId: RESEARCHER_ID, title: { $in: titles } });

  for (const def of experiments) {
    const exp = await Experiment.create({ ...def, researcherId: RESEARCHER_ID, status: 'published' });
    console.log(`✓ ${exp.title.padEnd(24)} run.html?slug=${exp.shareSlug}`);
  }

  await mongoose.disconnect();
  console.log('\nDone. Open the dashboard to see them.');
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
