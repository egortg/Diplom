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

console.log('📦 Auth routes initializing...');

// =============================================
// ПУБЛИЧНЫЕ МАРШРУТЫ (без авторизации)
// =============================================

// Регистрация (с ограничением 5 запросов в минуту)
router.post('/register', 
    rateLimit(5, 60 * 1000), 
    validateRegistration, 
    register
);

// Вход (с ограничением 10 запросов в минуту)
router.post('/login', 
    rateLimit(10, 60 * 1000), 
    login
);

// Обновление токена
router.post('/refresh-token', refreshToken);

// =============================================
// ЗАЩИЩЕННЫЕ МАРШРУТЫ (требуют авторизации)
// =============================================

// Выход из системы
router.post('/logout', 
    authenticateUser, 
    logout
);

// Получение текущего пользователя
router.get('/me', 
    authenticateUser, 
    getCurrentUser
);

// =============================================
// ТЕСТОВЫЙ МАРШРУТ (для проверки авторизации)
// =============================================
router.get('/test', 
    authenticateUser, 
    (req, res) => {
        res.json({
            success: true,
            message: 'Вы авторизованы!',
            user: req.user
        });
    }
);

console.log('✅ Auth routes registered:');
console.log('  POST   /register      - Регистрация');
console.log('  POST   /login         - Вход');
console.log('  POST   /refresh-token - Обновление токена');
console.log('  POST   /logout        - Выход (защищенный)');
console.log('  GET    /me            - Текущий пользователь (защищенный)');
console.log('  GET    /test          - Тест авторизации (защищенный)');

export default router;