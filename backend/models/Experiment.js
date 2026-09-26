const mongoose = require('mongoose');
const crypto = require('crypto');
const TrialSchema = require('./Trial');

const ExperimentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },

    description: { type: String, default: '' },

    // Type of experiment being created
    paradigm: {
      type: String,
      enum: ['stroop', 'simple-reaction-time', 'go-no-go', 'flanker', 'lexical-decision'],
      required: true,
    },

    // Whoever created it
    researcherId: { type: String, required: true },

    // Trials belonging to this experiment
    trials: [TrialSchema],

    // Experiment-level settings the builder can toggle
    settings: {
      randomizeTrialOrder: { type: Boolean, default: false },
      showConsentScreen: { type: Boolean, default: true },
      consentText: {
        type: String,
        default:
          'By continuing, you agree to participate in this study anonymously. Your responses and reaction times will be recorded for research purposes only.',
      },
    },

    status: {
      type: String,
      enum: ['draft', 'published', 'closed'],
      default: 'draft',
    },

    // Short unique id used in the shareable participant link, e.g. run.html?slug=8f3a1c2b
    shareSlug: {
      type: String,
      unique: true,
      default: () => crypto.randomBytes(4).toString('hex'),
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Experiment', ExperimentSchema);
