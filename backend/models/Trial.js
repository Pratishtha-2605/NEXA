const mongoose = require('mongoose');

const trialSchema = new mongoose.Schema({
  type: { type: String, required: true }, // e.g. 'stroop', 'simple-rt'
  stimulus: { type: String },
  correctResponse: { type: String },
  durationMs: { type: Number, default: 1000 },
  isPractice: { type: Boolean, default: false },
  order: { type: Number }
});

module.exports = trialSchema;