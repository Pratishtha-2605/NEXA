const express = require('express');
const router = express.Router();
const experimentController = require('../controllers/experimentController');

// Participant-facing (public, reached via the share link).
// Must come before '/:id' so "run" isn't treated as an id.
router.get('/run/:shareSlug', experimentController.getExperimentForParticipant);

// Researcher-facing
router.post('/', experimentController.createExperiment);
router.get('/', experimentController.listExperiments);
router.get('/:id', experimentController.getExperiment);
router.put('/:id', experimentController.updateExperiment);
router.put('/:id/publish', experimentController.publishExperiment);

module.exports = router;
