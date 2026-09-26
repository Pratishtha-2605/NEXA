const mongoose = require('mongoose');

/**
 * Trial is NOT its own collection — it's an embedded sub-document inside
 * Experiment.trials[]. A full experiment (all its trials) is a single read,
 * which is what the participant-facing "load experiment" endpoint needs.
 */
const TrialSchema = new mongoose.Schema(
  {
    // Stroop uses 'color-word', the other paradigms use 'text'
    type: {
      type: String,
      required: true,
      enum: ['text', 'image', 'color-word', 'custom'],
      default: 'text',
    },

    // What the participant sees
    stimulus: {
      content: { type: String, required: true }, // text, image URL, color word, arrows...
      displayColor: { type: String }, // e.g. Stroop: word "RED" shown in blue
      durationMs: { type: Number, default: null }, // null = wait for response
    },

    // Valid responses for this trial, e.g. ['red', 'green', 'blue', 'yellow']
    responseOptions: [{ type: String }],

    // The option that counts as correct (never sent to participants)
    correctResponse: { type: String, required: true },

    order: { type: Number, required: true },

    // Per-trial override; if false, this trial is excluded from randomization
    randomizable: { type: Boolean, default: true },
  },
  { _id: true }
);

module.exports = TrialSchema;
