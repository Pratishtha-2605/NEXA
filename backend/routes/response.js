const express = require('express');
const router = express.Router();
const {
  submitResponse,
  getResponsesByExperiment,
  getExperimentStats,
  exportResponses,
} = require('../controllers/responseController');

router.post('/', submitResponse); // one response, or an array of them
router.get('/:experimentId', getResponsesByExperiment);
router.get('/:experimentId/stats', getExperimentStats);
router.get('/:experimentId/export', exportResponses);

module.exports = router;
