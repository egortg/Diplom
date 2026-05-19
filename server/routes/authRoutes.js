import express from 'express';
import {
    register,
    login,
    refreshToken,
    logout,
    getCurrentUser
} from '../controllers/authController.js';
import { authenticateUser, rateLimit } from '../middleware/auth.js';
import { validateRegistration } from '../utils/validation.js';

const router = express.Router();

// Публичные маршруты (с ограничением запросов)
router.post('/register', rateLimit(5, 60 * 1000), validateRegistration, register);
router.post('/login', rateLimit(10, 60 * 1000), login);
router.post('/refresh-token', refreshToken);

// Защищенные маршруты
router.post('/logout', authenticateUser, logout);
router.get('/me', authenticateUser, getCurrentUser);

export default router;