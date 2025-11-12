import express from 'express';
import { login, studentLogin, register, studentSignup, getCurrentUser } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Signup routes
router.post('/register', register); // Admin/Teacher signup
router.post('/student-signup', studentSignup); // Student signup

// Login routes
router.post('/login', login); // Admin/Teacher login
router.post('/student-login', studentLogin); // Student login

// Protected routes
router.get('/me', authenticate, getCurrentUser);

export default router;
