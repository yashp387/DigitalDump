// src/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/authMiddleware');


// --- Existing Routes ---
router.post('/signup', adminController.signUp);
router.post('/signin', adminController.signIn);
router.get('/protected', authenticate, authorize(['admin']), adminController.adminProtected);
// --- End Existing Routes ---


// --- NEW ROUTES FOR FORGOT PASSWORD CODE ---

// POST to request a password reset email (logic changes to send a code)
// Body: { email: 'admin@example.com' }
router.post('/forgot-password', adminController.forgotPassword);

// POST to verify the code and reset the password
// Body: { email: 'admin@example.com', code: '123456', newPassword: 'newpassword' }
router.post('/reset-password-code', adminController.resetPasswordWithCode); // This function will be created next

// Note: The old /reset-password/:token route is no longer needed if you only use the code method.
// router.put('/reset-password/:token', adminController.resetPassword); // <-- Remove or comment out if only using code method

// --- END NEW ROUTES ---


module.exports = router;
