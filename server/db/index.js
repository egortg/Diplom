import pkg from 'pg';
import databaseConfig from '../config/database.js';

const { Pool } = pkg;

// Создание пула соединений
const pool = new Pool(databaseConfig);

// Логирование событий
pool.on('connect', () => {
    console.log('📦 Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('❌ Unexpected database error:', err);
    process.exit(-1);
});

// Проверка подключения
export const testConnection = async () => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        console.log('✅ Database connected at:', result.rows[0].now);
        client.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
};

// Вспомогательные функции для работы с БД
export const query = (text, params) => pool.query(text, params);
export const getClient = () => pool.connect();
export default pool;