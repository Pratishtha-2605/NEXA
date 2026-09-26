const mongoose = require('mongoose');

/**
 * ONE document per trial a participant answers.
 * Timestamps come from the browser's performance.now() clock, so the
 * reaction time is never affected by network delay.
 */
const responseSchema = new mongoose.Schema({
  experimentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Experiment', required: true },
  participantId: { type: String, required: true },

  trialId: { type: mongoose.Schema.Types.ObjectId }, // the trial's _id inside the experiment
  trialIndex: { type: Number }, // the trial's "order"
  stimulus: { type: String }, // copy of what was shown, handy in the CSV

  response: { type: String, default: null }, // e.g. 'red', 'left', 'withhold'
  timedOut: { type: Boolean, default: false }, // no key pressed before durationMs

  stimulusOnsetTimestamp: { type: Number, required: true },
  responseTimestamp: { type: Number, required: true },
  reactionTime: { type: Number, default: null }, // ms, null when timed out

  isCorrect: { type: Boolean }, // set by the server from the trial's correctResponse
  submittedAt: { type: Date, default: Date.now },
});

responseSchema.pre('save', function () {
  this.reactionTime = this.timedOut
    ? null
    : Math.round(this.responseTimestamp - this.stimulusOnsetTimestamp);
});

module.exports = mongoose.model('Response', responseSchema);
