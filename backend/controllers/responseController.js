const Response = require('../models/Response');

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

    res.json({
      participants: uniqueParticipants,
      trials: responses.length,
      averageReactionTime: Math.round(avgRT),
      accuracy: Math.round(accuracy * 10) / 10
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const { Parser } = require('json2csv');

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