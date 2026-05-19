import dotenv from 'dotenv';
dotenv.config();

export const jwtConfig = {
    secret: process.env.JWT_SECRET || 'default_secret_key_change_me',
    accessTokenExpiry: process.env.JWT_EXPIRE || '7d',
    refreshTokenExpiry: '30d',
    adminTokenExpiry: '1d',
    
    // Типы токенов
    tokenTypes: {
        ACCESS: 'access',
        REFRESH: 'refresh',
        ADMIN: 'admin'
    }
};