import { body, validationResult } from 'express-validator';

// =============================================
// 1. ПРАВИЛА ВАЛИДАЦИИ ДЛЯ РЕГИСТРАЦИИ
// =============================================
export const validateRegistration = [
    body('email')
        .isEmail()
        .withMessage('Некорректный email')
        .normalizeEmail(),
    
    body('phone')
        .matches(/^\+?[\d\s-]{10,}$/)
        .withMessage('Некорректный номер телефона'),
    
    body('password')
        .isLength({ min: 6 })
        .withMessage('Пароль должен содержать минимум 6 символов'),
    
    body('fullName')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('Имя должно содержать от 2 до 100 символов'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        next();
    }
];

// =============================================
// 2. ПРАВИЛА ВАЛИДАЦИИ ДЛЯ ЗАЯВОК
// =============================================
export const validateCreditApplication = [
    body('creditLimit')
        .notEmpty()
        .withMessage('Укажите желаемый лимит'),
    
    body('term')
        .notEmpty()
        .withMessage('Укажите срок кредита'),
    
    body('fullName')
        .notEmpty()
        .withMessage('Укажите ФИО'),
    
    body('phone')
        .notEmpty()
        .withMessage('Укажите телефон'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        next();
    }
];