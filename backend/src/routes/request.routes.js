const express = require('express');
const router = express.Router();
const requestController = require('../controllers/request.controller');
const authMiddleware = require('../../src/middleware/authMiddleware');

router.post('/create', authMiddleware.authenticate, requestController.createRequest);
router.get('/user/:userId', authMiddleware.authenticate, requestController.getUserRequests);
router.get('/:requestId', authMiddleware.authenticate, requestController.getRequestById);
router.put('/:requestId/cancel', authMiddleware.authenticate, requestController.cancelRequest);

module.exports = router;