const mongoose = require('mongoose');

/**
 * Trial is NOT its own collection — it's an embedded sub-document inside
 * Experiment.trials[]. This keeps a full experiment (all its trials) a
 * single read, which is what the participant-facing "load experiment"
 * endpoint needs.
 */
const TrialSchema = new mongoose.Schema(
  {
    // Free-form so the builder can support different trial "kinds"
    // (stroop word, image stimulus, text prompt, etc.) without a schema
    // migration every time a new type is added.
    type: {
      type: String,
      required: true,
      enum: ['text', 'image', 'color-word', 'custom'],
      default: 'text',
    },

    // What the participant sees
    stimulus: {
      content: { type: String, required: true }, // text, image URL, color name, etc.
      displayColor: { type: String }, // e.g. for stroop: word "RED" shown in blue
      durationMs: { type: Number, default: null }, // null = wait for response
    },

    // Valid responses for this trial, e.g. ['red', 'green', 'blue', 'yellow']
    responseOptions: [{ type: String }],

    // The option that counts as correct (used for accuracy %)
    correctResponse: { type: String, required: true },

    order: { type: Number, required: true }, // explicit order index

    // Per-trial override; if false, this trial is excluded from randomization
    randomizable: { type: Boolean, default: true },
  },
  { _id: true } // each trial still gets its own id for editing/reordering in the builder
);

module.exports = TrialSchema;