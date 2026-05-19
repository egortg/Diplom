import pool from '../db/index.js';
import {
    generateTokens,
    hashPassword,
    comparePassword,
    asyncHandler,
    AppError
} from '../utils/helpers.js';
import { jwtConfig } from '../config/jwt.js';
import jwt from 'jsonwebtoken';

// =============================================
// 1. РЕГИСТРАЦИЯ ПОЛЬЗОВАТЕЛЯ
// =============================================
export const register = asyncHandler(async (req, res) => {
    const { email, phone, password, fullName } = req.body;

    // Проверка существующего пользователя
    const existingUser = await pool.query(
        'SELECT * FROM users WHERE email = $1 OR phone = $2',
        [email, phone]
    );

    if (existingUser.rows.length > 0) {
        throw new AppError('Пользователь с таким email или телефоном уже существует', 400);
    }

    // Хеширование пароля и создание пользователя
    const passwordHash = await hashPassword(password);
    
    const result = await pool.query(
        `INSERT INTO users (email, phone, password_hash, full_name) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id, email, phone, full_name, created_at, is_verified`,
        [email, phone, passwordHash, fullName]
    );

    const user = result.rows[0];
    const { accessToken, refreshToken } = generateTokens(user.id, user.email);

    // Сохранение refresh токена
    await pool.query(
        'UPDATE users SET refresh_token = $1 WHERE id = $2',
        [refreshToken, user.id]
    );

    res.status(201).json({
        success: true,
        user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            fullName: user.full_name,
            createdAt: user.created_at,
            isVerified: user.is_verified
        },
        accessToken,
        refreshToken
    });
});

// =============================================
// 2. ВХОД ПОЛЬЗОВАТЕЛЯ
// =============================================
export const login = asyncHandler(async (req, res) => {
    const { identifier, password } = req.body;

    // Поиск пользователя по email или телефону
    const result = await pool.query(
        'SELECT * FROM users WHERE email = $1 OR phone = $1',
        [identifier]
    );

    if (result.rows.length === 0) {
        throw new AppError('Неверный email/телефон или пароль', 401);
    }

    const user = result.rows[0];
    const isValidPassword = await comparePassword(password, user.password_hash);

    if (!isValidPassword) {
        throw new AppError('Неверный email/телефон или пароль', 401);
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.email);

    await pool.query(
        'UPDATE users SET refresh_token = $1, last_login = CURRENT_TIMESTAMP WHERE id = $2',
        [refreshToken, user.id]
    );

    res.json({
        success: true,
        user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            fullName: user.full_name,
            createdAt: user.created_at,
            isVerified: user.is_verified
        },
        accessToken,
        refreshToken
    });
});

// =============================================
// 3. ОБНОВЛЕНИЕ ТОКЕНА
// =============================================
export const refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        throw new AppError('Refresh token required', 401);
    }

    const result = await pool.query(
        'SELECT * FROM users WHERE refresh_token = $1',
        [refreshToken]
    );

    if (result.rows.length === 0) {
        throw new AppError('Invalid refresh token', 403);
    }

    const user = result.rows[0];
    
    jwt.verify(refreshToken, jwtConfig.secret);

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id, user.email);

    await pool.query(
        'UPDATE users SET refresh_token = $1 WHERE id = $2',
        [newRefreshToken, user.id]
    );

    res.json({
        success: true,
        accessToken,
        refreshToken: newRefreshToken
    });
});

// =============================================
// 4. ВЫХОД ИЗ СИСТЕМЫ
// =============================================
export const logout = asyncHandler(async (req, res) => {
    const { userId } = req.user;

    await pool.query(
        'UPDATE users SET refresh_token = NULL WHERE id = $1',
        [userId]
    );

    res.json({ success: true, message: 'Выход выполнен успешно' });
});

// =============================================
// 5. ПОЛУЧЕНИЕ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ
// =============================================
export const getCurrentUser = asyncHandler(async (req, res) => {
    const result = await pool.query(
        `SELECT id, email, phone, full_name, created_at, is_verified 
         FROM users WHERE id = $1`,
        [req.user.userId]
    );

    if (result.rows.length === 0) {
        throw new AppError('Пользователь не найден', 404);
    }

    res.json({
        success: true,
        user: {
            id: result.rows[0].id,
            email: result.rows[0].email,
            phone: result.rows[0].phone,
            fullName: result.rows[0].full_name,
            createdAt: result.rows[0].created_at,
            isVerified: result.rows[0].is_verified
        }
    });
});