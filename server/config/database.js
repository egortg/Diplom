import dotenv from 'dotenv';
dotenv.config();

const databaseConfig = {
    development: {
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_DATABASE || 'bank_db',
        ssl: false,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    },
    production: {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_DATABASE,
        ssl: { rejectUnauthorized: false },
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    },
    test: {
        user: 'test_user',
        password: 'test_pass',
        host: 'localhost',
        port: 5432,
        database: 'bank_db_test',
        ssl: false,
    }
};

const env = process.env.NODE_ENV || 'development';
export default databaseConfig[env];