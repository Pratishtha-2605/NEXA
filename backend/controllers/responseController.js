const Response = require('../models/Response');
const { Parser } = require('json2csv');

exports.submitResponse = async (req, res) => {
  try {
    const response = new Response(req.body);
    await response.save();
    res.status(201).json(response);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getResponsesByExperiment = async (req, res) => {
  try {
    const responses = await Response.find({ experimentId: req.params.experimentId });
    res.json(responses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getExperimentStats = async (req, res) => {
  try {
    const responses = await Response.find({ experimentId: req.params.experimentId });

    if (responses.length === 0) {
      return res.json({ participants: 0, trials: 0, averageReactionTime: 0, accuracy: 0, perTrial: [] });
    }

    const uniqueParticipants = new Set(responses.map(r => r.participantId)).size;
    const avgRT = responses.reduce((sum, r) => sum + r.reactionTime, 0) / responses.length;
    const correctCount = responses.filter(r => r.isCorrect).length;
    const accuracy = (correctCount / responses.length) * 100;

    // Group by trialIndex
    const trialGroups = {};
    responses.forEach(r => {
      if (!trialGroups[r.trialIndex]) trialGroups[r.trialIndex] = [];
      trialGroups[r.trialIndex].push(r);
    });

    const perTrial = Object.keys(trialGroups)
      .sort((a, b) => a - b)
      .map(trialIndex => {
        const group = trialGroups[trialIndex];
        const trialAvgRT = group.reduce((sum, r) => sum + r.reactionTime, 0) / group.length;
        const trialCorrect = group.filter(r => r.isCorrect).length;
        const trialAccuracy = (trialCorrect / group.length) * 100;
        return {
          trial: Number(trialIndex),
          accuracy: Math.round(trialAccuracy * 10) / 10,
          avgRT: Math.round(trialAvgRT)
        };
      });

    res.json({
      participants: uniqueParticipants,
      trials: responses.length,
      averageReactionTime: Math.round(avgRT),
      accuracy: Math.round(accuracy * 10) / 10,
      perTrial
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.exportResponses = async (req, res) => {
  try {
    const responses = await Response.find({ experimentId: req.params.experimentId }).lean();

    if (responses.length === 0) {
      return res.status(404).json({ error: 'No responses found for this experiment' });
    }

    const fields = ['participantId', 'trialIndex', 'stimulusOnsetTimestamp', 'responseTimestamp', 'reactionTime', 'isCorrect', 'submittedAt'];
    const parser = new Parser({ fields });
    const csv = parser.parse(responses);

    res.header('Content-Type', 'text/csv');
    res.attachment('results.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
