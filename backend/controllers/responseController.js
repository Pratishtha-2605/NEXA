const mongoose = require('mongoose');
const Response = require('../models/Response');
const Experiment = require('../models/Experiment');

const badId = (id) => !mongoose.Types.ObjectId.isValid(id);

/**
 * POST /api/responses
 * Body: one response object, an array of them, or { responses: [...] }
 * {
 *   experimentId, participantId, trialId?, trialIndex,
 *   response, timedOut?, stimulusOnsetTimestamp, responseTimestamp
 * }
 * The server decides isCorrect from the trial's correctResponse,
 * because participants never receive the correct answers.
 */
exports.submitResponse = async (req, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : req.body.responses || [req.body];
    if (!items.length) return res.status(400).json({ error: 'No responses sent' });

    // Load each experiment once
    const experiments = {};
    for (const item of items) {
      const id = String(item.experimentId || '');
      if (badId(id)) return res.status(400).json({ error: 'Invalid experimentId' });
      if (!experiments[id]) {
        experiments[id] = await Experiment.findById(id);
        if (!experiments[id]) return res.status(404).json({ error: 'Experiment not found' });
      }
    }

    const saved = [];
    for (const item of items) {
      const experiment = experiments[String(item.experimentId)];

      // Find the trial by its _id, or by its order number
      const trial =
        (item.trialId && !badId(item.trialId) && experiment.trials.id(item.trialId)) ||
        experiment.trials.find((t) => t.order === Number(item.trialIndex));

      const response = new Response({
        experimentId: item.experimentId,
        participantId: item.participantId,
        trialId: trial ? trial._id : undefined,
        trialIndex: trial ? trial.order : item.trialIndex,
        stimulus: trial ? trial.stimulus.content : item.stimulus,
        response: item.response ?? null,
        timedOut: !!item.timedOut,
        stimulusOnsetTimestamp: item.stimulusOnsetTimestamp,
        responseTimestamp: item.responseTimestamp,
        isCorrect: trial ? item.response === trial.correctResponse : undefined,
      });

      await response.save();
      saved.push(response);
    }

    res.status(201).json(Array.isArray(req.body) || req.body.responses ? saved : saved[0]);
  } catch (err) {
    res.status(err.name === 'ValidationError' ? 400 : 500).json({ error: err.message });
  }
};

/**
 * GET /api/responses/:experimentId
 */
exports.getResponsesByExperiment = async (req, res) => {
  try {
    if (badId(req.params.experimentId)) return res.json([]);
    const responses = await Response.find({ experimentId: req.params.experimentId }).sort({ submittedAt: 1 });
    res.json(responses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/responses/:experimentId/stats
 * → { participants, trials, averageReactionTime, accuracy, perTrial: [{ trial, accuracy, avgRT }] }
 */
exports.getExperimentStats = async (req, res) => {
  try {
    const empty = { participants: 0, trials: 0, averageReactionTime: 0, accuracy: 0, perTrial: [] };
    if (badId(req.params.experimentId)) return res.json(empty);

    const responses = await Response.find({ experimentId: req.params.experimentId });
    if (responses.length === 0) return res.json(empty);

    // Timed-out trials (e.g. Go/No-Go "withhold") have no reaction time
    const avgRT = (list) => {
      const timed = list.filter((r) => typeof r.reactionTime === 'number');
      return timed.length ? timed.reduce((s, r) => s + r.reactionTime, 0) / timed.length : 0;
    };
    const accuracy = (list) => {
      const graded = list.filter((r) => typeof r.isCorrect === 'boolean');
      return graded.length ? (graded.filter((r) => r.isCorrect).length / graded.length) * 100 : 0;
    };

    // Group by trial
    const groups = {};
    responses.forEach((r) => {
      (groups[r.trialIndex] = groups[r.trialIndex] || []).push(r);
    });

    const perTrial = Object.keys(groups)
      .sort((a, b) => a - b)
      .map((trialIndex) => ({
        trial: Number(trialIndex),
        accuracy: Math.round(accuracy(groups[trialIndex]) * 10) / 10,
        avgRT: Math.round(avgRT(groups[trialIndex])),
      }));

    res.json({
      participants: new Set(responses.map((r) => r.participantId)).size,
      trials: responses.length,
      averageReactionTime: Math.round(avgRT(responses)),
      accuracy: Math.round(accuracy(responses) * 10) / 10,
      perTrial,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/responses/:experimentId/export  → CSV file
 */
exports.exportResponses = async (req, res) => {
  try {
    if (badId(req.params.experimentId)) return res.status(404).json({ error: 'Experiment not found' });

    const responses = await Response.find({ experimentId: req.params.experimentId })
      .sort({ participantId: 1, trialIndex: 1 })
      .lean();

    if (responses.length === 0) {
      return res.status(404).json({ error: 'No responses found for this experiment' });
    }

    const fields = [
      'participantId',
      'trialIndex',
      'stimulus',
      'response',
      'isCorrect',
      'reactionTime',
      'timedOut',
      'stimulusOnsetTimestamp',
      'responseTimestamp',
      'submittedAt',
    ];

    // Quote every value so commas / quotes inside stimuli don't break the CSV
    const cell = (v) => {
      if (v === null || v === undefined) return '';
      const s = v instanceof Date ? v.toISOString() : String(v);
      return '"' + s.replace(/"/g, '""') + '"';
    };
    const csv = [fields.join(','), ...responses.map((r) => fields.map((f) => cell(r[f])).join(','))].join('\n');

    res.header('Content-Type', 'text/csv');
    res.attachment(`results-${req.params.experimentId}.csv`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
