const Experiment = require('../models/Experiment');

exports.createExperiment = async (req, res) => {
  try {
    const experiment = new Experiment(req.body);
    await experiment.save();
    res.status(201).json(experiment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getExperiment = async (req, res) => {
  try {
    const experiment = await Experiment.findById(req.params.id);
    if (!experiment) return res.status(404).json({ error: 'Not found' });
    res.json(experiment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllExperiments = async (req, res) => {
  try {
    const experiments = await Experiment.find().select('title trials createdAt');
    res.json(experiments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};