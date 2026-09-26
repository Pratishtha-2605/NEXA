const express = require('express');
const router = express.Router();
const { submitResponse, getResponsesByExperiment, getExperimentStats, exportResponses } = require('../controllers/responseController');


router.get('/:experimentId', getResponsesByExperiment);
router.post('/', submitResponse);
router.get('/:experimentId/stats', getExperimentStats);
router.get('/:experimentId/export', exportResponses);
module.exports = router;
