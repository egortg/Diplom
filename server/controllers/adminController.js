import pool from '../db/index.js';
import { asyncHandler, AppError } from '../utils/helpers.js';
import { generateAdminToken, comparePassword } from '../utils/helpers.js';

// =============================================
// 1. ВХОД АДМИНИСТРАТОРА
// =============================================
export const adminLogin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const result = await pool.query(
        'SELECT * FROM admins WHERE email = $1',
        [email]
    );

    if (result.rows.length === 0) {
        throw new AppError('Неверный email или пароль', 401);
    }

    const admin = result.rows[0];
    const isValidPassword = await comparePassword(password, admin.password_hash);

    if (!isValidPassword) {
        throw new AppError('Неверный email или пароль', 401);
    }

    await pool.query(
        'UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [admin.id]
    );

    const token = generateAdminToken(admin.id, admin.email, admin.role);

    res.json({
        success: true,
        token,
        admin: {
            id: admin.id,
            email: admin.email,
            fullName: admin.full_name,
            role: admin.role
        }
    });
});

// =============================================
// 2. СТАТИСТИКА ДАШБОРДА
// =============================================
export const getDashboardStats = asyncHandler(async (req, res) => {
    const [usersCount, bannersCount, benefitsCount, applicationsCount] = await Promise.all([
        pool.query('SELECT COUNT(*) FROM users'),
        pool.query('SELECT COUNT(*) FROM banners'),
        pool.query('SELECT COUNT(*) FROM benefits'),
        pool.query('SELECT COUNT(*) FROM credit_applications')
    ]);

    res.json({
        users: parseInt(usersCount.rows[0].count),
        banners: parseInt(bannersCount.rows[0].count),
        benefits: parseInt(benefitsCount.rows[0].count),
        applications: parseInt(applicationsCount.rows[0].count)
    });
});

// =============================================
// 3. CRUD ДЛЯ БАННЕРОВ
// =============================================
export const getBanners = asyncHandler(async (req, res) => {
    const result = await pool.query(
        'SELECT * FROM banners ORDER BY order_position ASC'
    );
    res.json(result.rows);
});

export const createBanner = asyncHandler(async (req, res) => {
    const { name, title, subtitle, description, button_text, button_link, image_url, background_image_url, order_position, is_active } = req.body;

    const result = await pool.query(
        `INSERT INTO banners (name, title, subtitle, description, button_text, button_link, image_url, background_image_url, order_position, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [name, title, subtitle, description, button_text, button_link, image_url, background_image_url, order_position || 0, is_active !== false]
    );

    res.status(201).json(result.rows[0]);
});

export const updateBanner = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, title, subtitle, description, button_text, button_link, image_url, background_image_url, order_position, is_active } = req.body;

    const result = await pool.query(
        `UPDATE banners SET 
            name = $1, title = $2, subtitle = $3, description = $4, 
            button_text = $5, button_link = $6, image_url = $7, 
            background_image_url = $8, order_position = $9, is_active = $10, updated_at = CURRENT_TIMESTAMP
         WHERE id = $11
         RETURNING *`,
        [name, title, subtitle, description, button_text, button_link, image_url, background_image_url, order_position, is_active, id]
    );

    if (result.rows.length === 0) {
        throw new AppError('Баннер не найден', 404);
    }

    res.json(result.rows[0]);
});

export const deleteBanner = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM banners WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
        throw new AppError('Баннер не найден', 404);
    }

    res.json({ success: true, message: 'Баннер удален' });
});

// =============================================
// 4. CRUD ДЛЯ ПРЕИМУЩЕСТВ
// =============================================
export const getBenefits = asyncHandler(async (req, res) => {
    const { section } = req.query;
    let query = 'SELECT * FROM benefits ORDER BY order_position ASC';
    let params = [];

    if (section) {
        query = 'SELECT * FROM benefits WHERE section = $1 ORDER BY order_position ASC';
        params = [section];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
});

export const createBenefit = asyncHandler(async (req, res) => {
    const { section, title, description, icon_url, order_position, is_active } = req.body;

    const result = await pool.query(
        `INSERT INTO benefits (section, title, description, icon_url, order_position, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [section, title, description, icon_url, order_position || 0, is_active !== false]
    );

    res.status(201).json(result.rows[0]);
});

export const updateBenefit = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { section, title, description, icon_url, order_position, is_active } = req.body;

    const result = await pool.query(
        `UPDATE benefits SET 
            section = $1, title = $2, description = $3, icon_url = $4, 
            order_position = $5, is_active = $6, updated_at = CURRENT_TIMESTAMP
         WHERE id = $7
         RETURNING *`,
        [section, title, description, icon_url, order_position, is_active, id]
    );

    if (result.rows.length === 0) {
        throw new AppError('Преимущество не найдено', 404);
    }

    res.json(result.rows[0]);
});

export const deleteBenefit = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM benefits WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
        throw new AppError('Преимущество не найдено', 404);
    }

    res.json({ success: true, message: 'Преимущество удалено' });
});

// =============================================
// 5. CRUD ДЛЯ БЛОКОВ ИНТЕРЕСОВ
// =============================================
export const getInterestBlocks = asyncHandler(async (req, res) => {
    const result = await pool.query(
        'SELECT * FROM interest_blocks ORDER BY order_position ASC'
    );
    res.json(result.rows);
});

export const createInterestBlock = asyncHandler(async (req, res) => {
    const { title, description, image_url, link, block_type, order_position, is_active } = req.body;

    const result = await pool.query(
        `INSERT INTO interest_blocks (title, description, image_url, link, block_type, order_position, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [title, description, image_url, link, block_type, order_position || 0, is_active !== false]
    );

    res.status(201).json(result.rows[0]);
});

export const updateInterestBlock = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description, image_url, link, block_type, order_position, is_active } = req.body;

    const result = await pool.query(
        `UPDATE interest_blocks SET 
            title = $1, description = $2, image_url = $3, link = $4, 
            block_type = $5, order_position = $6, is_active = $7, updated_at = CURRENT_TIMESTAMP
         WHERE id = $8
         RETURNING *`,
        [title, description, image_url, link, block_type, order_position, is_active, id]
    );

    if (result.rows.length === 0) {
        throw new AppError('Блок не найден', 404);
    }

    res.json(result.rows[0]);
});

export const deleteInterestBlock = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM interest_blocks WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
        throw new AppError('Блок не найден', 404);
    }

    res.json({ success: true, message: 'Блок удален' });
});