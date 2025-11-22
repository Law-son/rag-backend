import express from 'express';
import { login, register, getProfile, updateProfile } from '../controllers/authController.js';
import { authenticate, adminOnly } from '../middleware/auth.js';
import { validateLogin, validateUser, handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.post('/login', validateLogin, handleValidationErrors, login);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);

// Admin only routes
router.post('/register', authenticate, adminOnly, validateUser, handleValidationErrors, register);

export default router;