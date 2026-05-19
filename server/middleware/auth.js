import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.js';

// =============================================
// 1. АУТЕНТИФИКАЦИЯ ПОЛЬЗОВАТЕЛЯ
// =============================================
export const authenticateUser = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Требуется авторизация'
        });
    }

    try {
        const decoded = jwt.verify(token, jwtConfig.secret);
        
        // Проверка, что это не админ
        if (decoded.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Доступ запрещен'
            });
        }
        
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Сессия истекла, войдите снова'
            });
        }
        return res.status(403).json({
            success: false,
            message: 'Недействительный токен'
        });
    }
};

// =============================================
// 2. АУТЕНТИФИКАЦИЯ АДМИНИСТРАТОРА
// =============================================
export const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Требуется авторизация администратора'
        });
    }

    try {
        const decoded = jwt.verify(token, jwtConfig.secret);
        
        // Проверка прав администратора
        if (!decoded.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Недостаточно прав'
            });
        }
        
        req.admin = decoded;
        next();
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: 'Недействительный токен администратора'
        });
    }
};

// =============================================
// 3. ОПЦИОНАЛЬНАЯ АУТЕНТИФИКАЦИЯ
// =============================================
export const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        try {
            const decoded = jwt.verify(token, jwtConfig.secret);
            req.user = decoded;
        } catch (error) {
            // Игнорируем ошибки валидации
        }
    }
    next();
};

// =============================================
// 4. ВАЛИДАЦИЯ РОЛЕЙ
// =============================================
export const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.admin) {
            return res.status(401).json({
                success: false,
                message: 'Не авторизован'
            });
        }
        
        if (!roles.includes(req.admin.role)) {
            return res.status(403).json({
                success: false,
                message: 'Недостаточно прав для этого действия'
            });
        }
        
        next();
    };
};

// =============================================
// 5. ОГРАНИЧЕНИЕ ЗАПРОСОВ (RATE LIMIT)
// =============================================
const requestCounts = new Map();

export const rateLimit = (maxRequests, windowMs) => {
    return (req, res, next) => {
        const ip = req.ip;
        const now = Date.now();
        const windowStart = now - windowMs;
        
        const requests = requestCounts.get(ip) || [];
        const validRequests = requests.filter(timestamp => timestamp > windowStart);
        
        if (validRequests.length >= maxRequests) {
            return res.status(429).json({
                success: false,
                message: 'Слишком много запросов, попробуйте позже'
            });
        }
        
        validRequests.push(now);
        requestCounts.set(ip, validRequests);
        next();
    };
};