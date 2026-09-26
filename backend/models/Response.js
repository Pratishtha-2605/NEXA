const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
  experimentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Experiment', required: true },
  participantId: { type: String, required: true },
  trialIndex: { type: Number },
  stimulusOnsetTimestamp: { type: Number, required: true },
  responseTimestamp: { type: Number, required: true },
  reactionTime: { type: Number },
  isCorrect: { type: Boolean },
  submittedAt: { type: Date, default: Date.now }
});

responseSchema.pre('save', function () {
  this.reactionTime =
    this.responseTimestamp - this.stimulusOnsetTimestamp;
});

module.exports = mongoose.model('Response', responseSchema);