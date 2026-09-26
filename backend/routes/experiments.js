const express = require('express');
const router = express.Router();
const experimentController = require('../controllers/experimentController');

// Researcher-facing
router.post('/', experimentController.createExperiment);
router.get('/', experimentController.listExperiments);
// Participant-facing (public, no auth — reached via shareSlug link)
router.get('/run/:shareSlug', experimentController.getExperimentForParticipant);
router.get('/:id', experimentController.getExperiment);
router.put('/:id', experimentController.updateExperiment);
router.put('/:id/publish', experimentController.publishExperiment);

// Participant-facing (public, no auth — reached via shareSlug link)
router.get('/run/:shareSlug', experimentController.getExperimentForParticipant);

module.exports = router;