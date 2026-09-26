const express = require('express');
const router = express.Router();
const { createExperiment, getExperiment, getAllExperiments } = require('../controllers/experimentController');

router.post('/', createExperiment);
router.get('/', getAllExperiments);
router.get('/:id', getExperiment);

module.exports = router;