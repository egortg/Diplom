import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.js';

// =============================================
// 1. ГЕНЕРАЦИЯ ТОКЕНОВ
// =============================================
export const generateTokens = (userId, email, role = 'user') => {
    const accessToken = jwt.sign(
        { userId, email, role, isAdmin: false },
        jwtConfig.secret,
        { expiresIn: jwtConfig.accessTokenExpiry }
    );
    
    const refreshToken = jwt.sign(
        { userId, email, role, isAdmin: false },
        jwtConfig.secret,
        { expiresIn: jwtConfig.refreshTokenExpiry }
    );
    
    return { accessToken, refreshToken };
};

export const generateAdminToken = (adminId, email, role) => {
    return jwt.sign(
        { id: adminId, email, role, isAdmin: true },
        jwtConfig.secret,
        { expiresIn: jwtConfig.adminTokenExpiry }
    );
};

// =============================================
// 2. ХЕШИРОВАНИЕ ПАРОЛЕЙ
// =============================================
export const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

export const comparePassword = async (password, hash) => {
    return bcrypt.compare(password, hash);
};

// =============================================
// 3. ФОРМАТИРОВАНИЕ ДАННЫХ
// =============================================
export const formatPhoneNumber = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
        return cleaned.replace(/(\d{1})(\d{3})(\d{3})(\d{2})(\d{2})/, '+$1 ($2) $3-$4-$5');
    }
    return phone;
};

export const formatDate = (date) => {
    return new Date(date).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// =============================================
// 4. ВАЛИДАЦИЯ
// =============================================
export const isValidEmail = (email) => {
    const regex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
    return regex.test(email);
};

export const isValidPhone = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 12;
};

export const isValidPassword = (password) => {
    return password.length >= 6;
};

// =============================================
// 5. ОБРАБОТКА ОШИБОК
// =============================================
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

export class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
    }
}