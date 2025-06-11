const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/authMiddleware');
// Sign-up route
router.post('/signup', userController.signUp);

// Sign-in route
router.post('/signin', userController.signIn);

router.get('/protected', authMiddleware.authenticate, authMiddleware.authorize(['user']), userController.userProtected);

module.exports = router;