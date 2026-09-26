const crypto = require('crypto');
const mongoose = require('mongoose');
const Experiment = require('../models/Experiment');

const badId = (id) => !mongoose.Types.ObjectId.isValid(id);

/**
 * POST /api/experiments
 * Create a new experiment (draft by default).
 */
exports.createExperiment = async (req, res) => {
  try {
    const { title, description, paradigm, researcherId, trials, settings } = req.body;

    if (!title || !researcherId || !paradigm) {
      return res.status(400).json({ error: 'title, paradigm and researcherId are required' });
    }

    const experiment = await Experiment.create({
      title,
      description,
      paradigm,
      researcherId,
      trials: trials || [],
      settings,
    });

    res.status(201).json(experiment);
  } catch (err) {
    // Mongoose validation problems (bad paradigm, missing trial field...) are the client's fault
    res.status(err.name === 'ValidationError' ? 400 : 500).json({ error: err.message });
  }
};

/**
 * GET /api/experiments?researcherId=xxx
 */
exports.listExperiments = async (req, res) => {
  try {
    const { researcherId } = req.query;
    const filter = researcherId ? { researcherId } : {};

    const experiments = await Experiment.find(filter)
      .select('title description paradigm status trials shareSlug createdAt updatedAt')
      .sort({ updatedAt: -1 });

    res.json(
      experiments.map((e) => ({
        id: e._id,
        title: e.title,
        description: e.description,
        paradigm: e.paradigm,
        status: e.status,
        trialCount: e.trials.length,
        shareSlug: e.shareSlug,
        updatedAt: e.updatedAt,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/experiments/:id  (researcher view, includes correct answers)
 */
exports.getExperiment = async (req, res) => {
  try {
    if (badId(req.params.id)) return res.status(404).json({ error: 'Experiment not found' });

    const experiment = await Experiment.findById(req.params.id);
    if (!experiment) return res.status(404).json({ error: 'Experiment not found' });

    res.json(experiment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * PUT /api/experiments/:id
 * Update title/description/paradigm/trials/settings while in draft.
 */
exports.updateExperiment = async (req, res) => {
  try {
    if (badId(req.params.id)) return res.status(404).json({ error: 'Experiment not found' });

    const experiment = await Experiment.findById(req.params.id);
    if (!experiment) return res.status(404).json({ error: 'Experiment not found' });

    if (experiment.status !== 'draft') {
      return res.status(400).json({ error: 'Cannot edit a published experiment' });
    }

    const { title, description, paradigm, trials, settings } = req.body;

    if (title !== undefined) experiment.title = title;
    if (description !== undefined) experiment.description = description;
    if (paradigm !== undefined) experiment.paradigm = paradigm;
    if (trials !== undefined) experiment.trials = trials;
    if (settings !== undefined) {
      experiment.set('settings', { ...experiment.toObject().settings, ...settings });
    }

    await experiment.save();
    res.json(experiment);
  } catch (err) {
    res.status(err.name === 'ValidationError' ? 400 : 500).json({ error: err.message });
  }
};

/**
 * PUT /api/experiments/:id/publish
 */
exports.publishExperiment = async (req, res) => {
  try {
    if (badId(req.params.id)) return res.status(404).json({ error: 'Experiment not found' });

    const experiment = await Experiment.findById(req.params.id);
    if (!experiment) return res.status(404).json({ error: 'Experiment not found' });

    if (!experiment.trials.length) {
      return res.status(400).json({ error: 'Add at least one trial before publishing' });
    }

    experiment.status = 'published';
    await experiment.save();

    res.json({
      message: 'Experiment published',
      id: experiment._id,
      status: experiment.status,
      shareSlug: experiment.shareSlug,
      shareUrl: `/run/${experiment.shareSlug}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/experiments/run/:shareSlug
 * PARTICIPANT-FACING: never sends correctResponse.
 */
exports.getExperimentForParticipant = async (req, res) => {
  try {
    const experiment = await Experiment.findOne({
      shareSlug: req.params.shareSlug,
      status: 'published',
    });

    if (!experiment) {
      return res.status(404).json({ error: 'Experiment not found or not published' });
    }

    let trials = experiment.trials.map((t) => ({
      _id: t._id,
      type: t.type,
      stimulus: t.stimulus,
      responseOptions: t.responseOptions,
      order: t.order,
      // correctResponse intentionally omitted
    }));

    if (experiment.settings.randomizeTrialOrder) {
      trials = shuffle(trials);
    } else {
      trials.sort((a, b) => a.order - b.order);
    }

    res.json({
      experimentId: experiment._id,
      title: experiment.title,
      description: experiment.description,
      paradigm: experiment.paradigm,
      consent: {
        required: experiment.settings.showConsentScreen,
        text: experiment.settings.consentText,
      },
      participantId: crypto.randomUUID(),
      trials,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Fisher–Yates shuffle
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
