const mongoose = require('mongoose');
const trialSchema = require('./Trial');

const experimentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  trials: [trialSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Experiment', experimentSchema);