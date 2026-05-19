import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

// ============ НАСТРОЙКА MULTER ДЛЯ ЗАГРУЗКИ ИЗОБРАЖЕНИЙ ============

// Создаем папку uploads если её нет
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('📁 Created uploads directory');
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
        cb(null, true);
    } else {
        cb(new Error('Only images are allowed'));
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter
});

// Статические файлы для загруженных изображений
app.use('/uploads', express.static(uploadsDir));

// ============ ХРАНИЛИЩА ============

// Хранилище пользователей (в памяти)
const users = [];

// Хранилище администраторов
const admins = [
    {
        id: 1,
        email: 'admin@bank.com',
        passwordHash: '$2a$10$rQw5x5x5x5x5x5x5x5x5xO',
        fullName: 'Главный администратор',
        role: 'admin',
        createdAt: new Date().toISOString()
    }
];

// Хранилище для контента
let interestBlocks = [];

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());

// Логирование
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// ============ MIDDLEWARE ДЛЯ АДМИН ПРОВЕРКИ ============
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Требуется авторизация администратора' 
        });
    }
    
    try {
        const decoded = jwt.verify(token, 'secret_key_12345');
        if (!decoded.isAdmin) {
            return res.status(403).json({ 
                success: false, 
                message: 'Недостаточно прав' 
            });
        }
        req.admin = decoded;
        next();
    } catch (error) {
        res.status(403).json({ 
            success: false, 
            message: 'Недействительный токен' 
        });
    }
};

// ============ МАРШРУТЫ ПОЛЬЗОВАТЕЛЕЙ ============

// Health check
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Server is running!' });
});

// Регистрация
app.post('/api/auth/register', async (req, res) => {
    console.log('📝 Register:', req.body);
    
    try {
        const { email, phone, password, fullName } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email и пароль обязательны' 
            });
        }
        
        const existing = users.find(u => u.email === email);
        if (existing) {
            return res.status(400).json({ 
                success: false, 
                message: 'Пользователь уже существует' 
            });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = {
            id: users.length + 1,
            email,
            phone: phone || '',
            fullName: fullName || 'Пользователь',
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        console.log('✅ User created:', { id: newUser.id, email: newUser.email });
        
        const token = jwt.sign(
            { id: newUser.id, email: newUser.email },
            'secret_key_12345',
            { expiresIn: '7d' }
        );
        
        res.status(201).json({
            success: true,
            message: 'Регистрация успешна!',
            user: {
                id: newUser.id,
                email: newUser.email,
                phone: newUser.phone,
                fullName: newUser.fullName,
                createdAt: newUser.createdAt
            },
            accessToken: token
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
});

// Логин пользователя
app.post('/api/auth/login', async (req, res) => {
    console.log('🔐 Login request:', req.body);
    
    try {
        const { identifier, password } = req.body;
        
        if (!identifier || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email и пароль обязательны' 
            });
        }
        
        const user = users.find(u => u.email === identifier || u.phone === identifier);
        
        if (!user) {
            console.log('❌ User not found:', identifier);
            return res.status(401).json({ 
                success: false, 
                message: 'Неверный email или пароль' 
            });
        }
        
        const isValid = await bcrypt.compare(password, user.password);
        
        if (!isValid) {
            console.log('❌ Invalid password for:', identifier);
            return res.status(401).json({ 
                success: false, 
                message: 'Неверный email или пароль' 
            });
        }
        
        const token = jwt.sign(
            { id: user.id, email: user.email },
            'secret_key_12345',
            { expiresIn: '7d' }
        );
        
        console.log('✅ Login successful:', user.email);
        
        res.json({
            success: true,
            message: 'Вход выполнен успешно!',
            user: {
                id: user.id,
                email: user.email,
                phone: user.phone,
                fullName: user.fullName,
                createdAt: user.createdAt
            },
            accessToken: token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
});

// Получение текущего пользователя
app.get('/api/auth/me', (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ success: false, message: 'Нет токена' });
    }
    
    try {
        const decoded = jwt.verify(token, 'secret_key_12345');
        const user = users.find(u => u.id === decoded.id);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'Пользователь не найден' });
        }
        
        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                phone: user.phone,
                fullName: user.fullName,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        res.status(401).json({ success: false, message: 'Недействительный токен' });
    }
});

// ============ АДМИН МАРШРУТЫ ============

// Админ логин
app.post('/api/admin/login', async (req, res) => {
    console.log('🔐 Admin login request:', req.body);
    
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email и пароль обязательны' 
        });
    }
    
    const admin = admins.find(a => a.email === email);
    
    if (!admin) {
        console.log('❌ Admin not found:', email);
        return res.status(401).json({ 
            success: false, 
            message: 'Неверный email или пароль' 
        });
    }
    
    const isValid = password === 'admin123';
    
    if (!isValid) {
        console.log('❌ Invalid password for admin:', email);
        return res.status(401).json({ 
            success: false, 
            message: 'Неверный email или пароль' 
        });
    }
    
    const token = jwt.sign(
        { 
            id: admin.id, 
            email: admin.email, 
            role: admin.role, 
            isAdmin: true 
        },
        'secret_key_12345',
        { expiresIn: '1d' }
    );
    
    console.log('✅ Admin login successful:', admin.email);
    
    res.json({
        success: true,
        token,
        admin: {
            id: admin.id,
            email: admin.email,
            fullName: admin.fullName,
            role: admin.role
        }
    });
});

// Получение статистики дашборда
app.get('/api/admin/dashboard', authenticateAdmin, (req, res) => {
    res.json({
        users: users.length,
        admins: admins.length,
        interestBlocks: interestBlocks.length
    });
});

// ============ МАРШРУТ ДЛЯ ЗАГРУЗКИ ИЗОБРАЖЕНИЙ (ВОЗВРАЩАЕТ ПОЛНЫЙ URL) ============
app.post('/api/admin/upload', authenticateAdmin, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    // Возвращаем полный URL для доступа к изображению
    const baseUrl = `http://localhost:${PORT}`;
    const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
    
    console.log('✅ File uploaded:', imageUrl);
    
    res.json({ 
        success: true, 
        url: imageUrl,
        filename: req.file.filename
    });
});

// ============ УПРАВЛЕНИЕ БЛОКАМИ ИНТЕРЕСОВ ============

// Получить все блоки (для админ-панели)
app.get('/api/admin/interest-blocks', authenticateAdmin, (req, res) => {
    res.json(interestBlocks);
});

// Получить один блок по ID
app.get('/api/admin/interest-blocks/:id', authenticateAdmin, (req, res) => {
    const { id } = req.params;
    const block = interestBlocks.find(b => b.id === parseInt(id));
    
    if (!block) {
        return res.status(404).json({ success: false, message: 'Блок не найден' });
    }
    
    res.json(block);
});

// Создать блок
app.post('/api/admin/interest-blocks', authenticateAdmin, (req, res) => {
    const { title, description, image_url, link, block_type, order_position } = req.body;
    
    const newBlock = {
        id: interestBlocks.length + 1,
        title,
        description,
        image_url: image_url || '',
        link: link || '',
        block_type: block_type || 'debit_card',
        order_position: order_position || 0,
        is_active: true,
        created_at: new Date().toISOString()
    };
    
    interestBlocks.push(newBlock);
    res.status(201).json(newBlock);
});

// Обновить блок
app.put('/api/admin/interest-blocks/:id', authenticateAdmin, (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    
    const index = interestBlocks.findIndex(b => b.id === parseInt(id));
    if (index === -1) {
        return res.status(404).json({ success: false, message: 'Блок не найден' });
    }
    
    interestBlocks[index] = { 
        ...interestBlocks[index], 
        ...updates, 
        updated_at: new Date().toISOString() 
    };
    res.json(interestBlocks[index]);
});

// Удалить блок
app.delete('/api/admin/interest-blocks/:id', authenticateAdmin, (req, res) => {
    const { id } = req.params;
    const index = interestBlocks.findIndex(b => b.id === parseInt(id));
    
    if (index === -1) {
        return res.status(404).json({ success: false, message: 'Блок не найден' });
    }
    
    interestBlocks.splice(index, 1);
    res.json({ success: true, message: 'Блок удален' });
});

// Публичный маршрут для получения активных блоков
app.get('/api/content/interest-blocks', (req, res) => {
    const activeBlocks = interestBlocks
        .filter(b => b.is_active !== false)
        .sort((a, b) => (a.order_position || 0) - (b.order_position || 0));
    res.json(activeBlocks);
});

// ============ УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ (АДМИН) ============

// Получить всех пользователей
app.get('/api/admin/users', authenticateAdmin, (req, res) => {
    const safeUsers = users.map(u => ({
        id: u.id,
        email: u.email,
        phone: u.phone,
        fullName: u.fullName,
        createdAt: u.createdAt
    }));
    res.json(safeUsers);
});

// Получить пользователя по ID
app.get('/api/admin/users/:id', authenticateAdmin, (req, res) => {
    const { id } = req.params;
    const user = users.find(u => u.id === parseInt(id));
    
    if (!user) {
        return res.status(404).json({ success: false, message: 'Пользователь не найден' });
    }
    
    res.json({
        id: user.id,
        email: user.email,
        phone: user.phone,
        fullName: user.fullName,
        createdAt: user.createdAt
    });
});

// ============ УПРАВЛЕНИЕ ADV BLOCK ============

let advBlock = {
    id: 1,
    title: 'Наши клиенты получают повышенный кэшбэк у партнёров',
    description: 'Ежемесячно мы предлагаем выгодные условия от наших партнёров: кэшбэк на продукты, одежду, технику, развлечения и обучение. Присоединяйтесь и получайте кэшбэк!',
    button_text: 'Стать клиентом',
    button_link: '/debit-card',
    image_url: '/images/AdvBlockimg.svg',
    is_active: true,
    updated_at: new Date().toISOString()
};

app.get('/api/admin/adv-block', authenticateAdmin, (req, res) => {
    console.log('📦 Get adv block request');
    res.json(advBlock);
});

app.put('/api/admin/adv-block', authenticateAdmin, (req, res) => {
    console.log('✏️ Update adv block request:', req.body);
    
    const { title, description, button_text, button_link, image_url, is_active } = req.body;
    
    advBlock = {
        ...advBlock,
        title: title !== undefined ? title : advBlock.title,
        description: description !== undefined ? description : advBlock.description,
        button_text: button_text !== undefined ? button_text : advBlock.button_text,
        button_link: button_link !== undefined ? button_link : advBlock.button_link,
        image_url: image_url !== undefined ? image_url : advBlock.image_url,
        is_active: is_active !== undefined ? is_active : advBlock.is_active,
        updated_at: new Date().toISOString()
    };
    
    res.json({ success: true, data: advBlock });
});

app.get('/api/content/adv-block', (req, res) => {
    if (advBlock.is_active === false) {
        return res.json(null);
    }
    res.json(advBlock);
});

// ============ УПРАВЛЕНИЕ "О БАНКЕ" ============

let aboutBank = {
    id: 1,
    heading: 'О банке',
    bestservice: {
        title: 'Признание в обслуживании клиентов',
        description: 'В 2023 году получил награды в рамках международной премии Customer Centricity World Series за лучшую стратегию обслуживания клиентов и бизнес-трансформацию премиального обслуживания.',
        image_url: '/images/AboutSchema.svg',
        is_active: true
    },
    secondadv: {
        title: 'Крупнейший частный банк',
        description: '30 миллионов клиентов выбрали нас\n\n525+ офисов и доставка более чем в 1500 городов',
        image_url: '/images/AboutTerminal.svg',
        is_active: true
    },
    thirdadv: {
        title: 'Инновации в платежных технологиях',
        description: 'Лучший кейс в технологиях платежей и расчетов.',
        image_url: '/images/AboutAtm.svg',
        is_active: true
    },
    updated_at: new Date().toISOString()
};

app.get('/api/admin/about-bank', authenticateAdmin, (req, res) => {
    console.log('📦 Get about bank request');
    res.json(aboutBank);
});

app.put('/api/admin/about-bank', authenticateAdmin, (req, res) => {
    console.log('✏️ Update about bank request:', req.body);
    
    const { heading, bestservice, secondadv, thirdadv } = req.body;
    
    aboutBank = {
        ...aboutBank,
        heading: heading !== undefined ? heading : aboutBank.heading,
        bestservice: {
            ...aboutBank.bestservice,
            ...(bestservice || {})
        },
        secondadv: {
            ...aboutBank.secondadv,
            ...(secondadv || {})
        },
        thirdadv: {
            ...aboutBank.thirdadv,
            ...(thirdadv || {})
        },
        updated_at: new Date().toISOString()
    };
    
    res.json({ success: true, data: aboutBank });
});

app.get('/api/content/about-bank', (req, res) => {
    const publicData = {
        heading: aboutBank.heading,
        bestservice: aboutBank.bestservice.is_active !== false ? aboutBank.bestservice : null,
        secondadv: aboutBank.secondadv.is_active !== false ? aboutBank.secondadv : null,
        thirdadv: aboutBank.thirdadv.is_active !== false ? aboutBank.thirdadv : null
    };
    res.json(publicData);
});

// ============ УПРАВЛЕНИЕ ГЛАВНЫМ БАННЕРОМ ============

let mainBanner = {
    id: 1,
    title: 'Максимум возможностей: Дебетовая карта для активных и умных',
    description: 'Бесплатное обслуживание навсегда',
    button_text: 'Получить карту',
    button_link: '/debit-card',
    background_image_url: '/images/MainBannerImg.png',
    is_active: true,
    updated_at: new Date().toISOString()
};

app.get('/api/admin/main-banner', authenticateAdmin, (req, res) => {
    console.log('📦 Get main banner request');
    res.json(mainBanner);
});

app.put('/api/admin/main-banner', authenticateAdmin, (req, res) => {
    console.log('✏️ Update main banner request:', req.body);
    
    const { title, description, button_text, button_link, background_image_url, is_active } = req.body;
    
    mainBanner = {
        ...mainBanner,
        title: title !== undefined ? title : mainBanner.title,
        description: description !== undefined ? description : mainBanner.description,
        button_text: button_text !== undefined ? button_text : mainBanner.button_text,
        button_link: button_link !== undefined ? button_link : mainBanner.button_link,
        background_image_url: background_image_url !== undefined ? background_image_url : mainBanner.background_image_url,
        is_active: is_active !== undefined ? is_active : mainBanner.is_active,
        updated_at: new Date().toISOString()
    };
    
    res.json({ success: true, data: mainBanner });
});

app.get('/api/content/main-banner', (req, res) => {
    if (mainBanner.is_active === false) {
        return res.json(null);
    }
    res.json(mainBanner);
});

// ============ УПРАВЛЕНИЕ СТРАНИЦЕЙ ДЕБЕТОВОЙ КАРТЫ ============

let debitCardBanner = {
    id: 1,
    title: 'Дебетовая карта от ЧБ Банка',
    description: 'Бесплатное обслуживание навсегда',
    button_text: 'Оформить карту',
    button_link: '#order-form',
    image_url: '/images/DebitCardimgBanner.png',
    is_active: true,
    updated_at: new Date().toISOString()
};

let debitCardBenefits = [
    {
        id: 1,
        title: 'Кэшбэк до 30%',
        image_url: '/images/BenefitOneimgWallet.svg',
        order_position: 1,
        is_active: true,
        created_at: new Date().toISOString()
    },
    {
        id: 2,
        title: 'Бесплатное снятие наличных',
        image_url: '/images/BenefittwoimgCoin.svg',
        order_position: 2,
        is_active: true,
        created_at: new Date().toISOString()
    },
    {
        id: 3,
        title: 'Бесплатное обслуживание',
        image_url: '/images/Benefitthreeimgshield.svg',
        order_position: 3,
        is_active: true,
        created_at: new Date().toISOString()
    }
];

let debitCardForm = {
    id: 1,
    title: 'Оформите Дебетовую карту за минуту',
    button_text: 'Продолжить',
    fields: [
        { name: 'fullName', label: 'Фамилия Имя Отчество', type: 'text', placeholder: 'Фамилия Имя Отчество', required: true, order_position: 1, is_active: true },
        { name: 'birthDate', label: 'Дата рождения', type: 'date', placeholder: 'Дата рождения', required: true, order_position: 2, is_active: true },
        { name: 'phone', label: 'Мобильный телефон', type: 'tel', placeholder: 'Мобильный телефон', required: true, order_position: 3, is_active: true },
        { name: 'email', label: 'Электронная почта', type: 'email', placeholder: 'Электронная почта', required: true, order_position: 4, is_active: true }
    ],
    is_active: true,
    updated_at: new Date().toISOString()
};

// Админ маршруты для дебетовой карты
app.get('/api/admin/debit-card-banner', authenticateAdmin, (req, res) => {
    res.json(debitCardBanner);
});

app.put('/api/admin/debit-card-banner', authenticateAdmin, (req, res) => {
    const { title, description, button_text, button_link, image_url, is_active } = req.body;
    debitCardBanner = {
        ...debitCardBanner,
        title: title !== undefined ? title : debitCardBanner.title,
        description: description !== undefined ? description : debitCardBanner.description,
        button_text: button_text !== undefined ? button_text : debitCardBanner.button_text,
        button_link: button_link !== undefined ? button_link : debitCardBanner.button_link,
        image_url: image_url !== undefined ? image_url : debitCardBanner.image_url,
        is_active: is_active !== undefined ? is_active : debitCardBanner.is_active,
        updated_at: new Date().toISOString()
    };
    res.json({ success: true, data: debitCardBanner });
});

app.get('/api/admin/debit-card-benefits', authenticateAdmin, (req, res) => {
    res.json(debitCardBenefits);
});

app.put('/api/admin/debit-card-benefits/:id', authenticateAdmin, (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const index = debitCardBenefits.findIndex(b => b.id === parseInt(id));
    if (index === -1) {
        return res.status(404).json({ success: false, message: 'Преимущество не найдено' });
    }
    debitCardBenefits[index] = { ...debitCardBenefits[index], ...updates, updated_at: new Date().toISOString() };
    res.json({ success: true, data: debitCardBenefits[index] });
});

app.post('/api/admin/debit-card-benefits', authenticateAdmin, (req, res) => {
    const { title, image_url, order_position, is_active } = req.body;
    const newBenefit = {
        id: debitCardBenefits.length + 1,
        title,
        image_url: image_url || '',
        order_position: order_position || debitCardBenefits.length + 1,
        is_active: is_active !== false,
        created_at: new Date().toISOString()
    };
    debitCardBenefits.push(newBenefit);
    res.status(201).json({ success: true, data: newBenefit });
});

app.delete('/api/admin/debit-card-benefits/:id', authenticateAdmin, (req, res) => {
    const { id } = req.params;
    const index = debitCardBenefits.findIndex(b => b.id === parseInt(id));
    if (index === -1) {
        return res.status(404).json({ success: false, message: 'Преимущество не найдено' });
    }
    debitCardBenefits.splice(index, 1);
    res.json({ success: true, message: 'Преимущество удалено' });
});

app.get('/api/admin/debit-card-form', authenticateAdmin, (req, res) => {
    res.json(debitCardForm);
});

app.put('/api/admin/debit-card-form', authenticateAdmin, (req, res) => {
    const { title, button_text, fields, is_active } = req.body;
    debitCardForm = {
        ...debitCardForm,
        title: title !== undefined ? title : debitCardForm.title,
        button_text: button_text !== undefined ? button_text : debitCardForm.button_text,
        fields: fields !== undefined ? fields : debitCardForm.fields,
        is_active: is_active !== undefined ? is_active : debitCardForm.is_active,
        updated_at: new Date().toISOString()
    };
    res.json({ success: true, data: debitCardForm });
});

// Публичные маршруты для дебетовой карты
app.get('/api/content/debit-card-banner', (req, res) => {
    if (debitCardBanner.is_active === false) return res.json(null);
    res.json(debitCardBanner);
});

app.get('/api/content/debit-card-benefits', (req, res) => {
    const active = debitCardBenefits.filter(b => b.is_active !== false).sort((a, b) => (a.order_position || 0) - (b.order_position || 0));
    res.json(active);
});

app.get('/api/content/debit-card-form', (req, res) => {
    if (debitCardForm.is_active === false) return res.json(null);
    res.json(debitCardForm);
});

// ============ УПРАВЛЕНИЕ СТРАНИЦЕЙ КРЕДИТНОЙ КАРТЫ ============

let creditCardBanner = {
    id: 1,
    title: 'Кредитная Карта от ЧБ Банка',
    description: '100 дней без процентов на всё',
    button_text: 'Оформить карту',
    button_link: '#credit-order-form',
    image_url: '/images/CreditCardimgBanner.png',
    is_active: true,
    updated_at: new Date().toISOString()
};

let creditCardBenefits = [
    {
        id: 1,
        title: 'Кэшбэк до 30%',
        image_url: '/images/CreditCardBenefitdiscount.svg',
        order_position: 1,
        is_active: true,
        created_at: new Date().toISOString()
    },
    {
        id: 2,
        title: 'Бесплатное снятие наличных',
        image_url: '/images/BenefittwoimgCoin.svg',
        order_position: 2,
        is_active: true,
        created_at: new Date().toISOString()
    },
    {
        id: 3,
        title: 'Бесплатное обслуживание',
        image_url: '/images/Benefitthreeimgshield.svg',
        order_position: 3,
        is_active: true,
        created_at: new Date().toISOString()
    }
];

let creditCardSteps = [
    {
        id: 1,
        title: 'Заполните заявку',
        description: 'За 5 минут полностью онлайн',
        icon: '1',
        order_position: 1,
        is_active: true,
        created_at: new Date().toISOString()
    },
    {
        id: 2,
        title: 'Дождитесь решения',
        description: 'Одобрение за 2 минуты',
        icon: '2',
        order_position: 2,
        is_active: true,
        created_at: new Date().toISOString()
    },
    {
        id: 3,
        title: 'Получите карту',
        description: 'Доставка курьером',
        icon: '3',
        order_position: 3,
        is_active: true,
        created_at: new Date().toISOString()
    }
];

let creditCardForm = {
    id: 1,
    title: 'Заявка на Кредитную карту',
    button_text: 'Продолжить',
    fields: [
        { name: 'creditLimit', label: 'Желаемый кредитный лимит (не более 1 млн рублей)', type: 'text', placeholder: 'Желаемый кредитный лимит (не более 1 млн рублей)', required: true, order_position: 1, is_active: true },
        { name: 'fullName', label: 'Фамилия Имя Отчество', type: 'text', placeholder: 'Фамилия Имя Отчество', required: true, order_position: 2, is_active: true },
        { name: 'phone', label: 'Мобильный телефон', type: 'tel', placeholder: 'Мобильный телефон', required: true, order_position: 3, is_active: true },
        { name: 'email', label: 'Электронная почта', type: 'email', placeholder: 'Электронная почта', required: true, order_position: 4, is_active: true }
    ],
    agreements: [
        { id: 1, text: 'Я соглашаюсь с условиями и даю своё согласие на обработку и использование моих персональных данных, и разрешаю сделать запрос в бюро кредитных историй', required: true, is_active: true }
    ],
    is_active: true,
    updated_at: new Date().toISOString()
};

// Админ маршруты для кредитной карты
app.get('/api/admin/credit-card-banner', authenticateAdmin, (req, res) => {
    res.json(creditCardBanner);
});

app.put('/api/admin/credit-card-banner', authenticateAdmin, (req, res) => {
    const { title, description, button_text, button_link, image_url, is_active } = req.body;
    creditCardBanner = {
        ...creditCardBanner,
        title: title !== undefined ? title : creditCardBanner.title,
        description: description !== undefined ? description : creditCardBanner.description,
        button_text: button_text !== undefined ? button_text : creditCardBanner.button_text,
        button_link: button_link !== undefined ? button_link : creditCardBanner.button_link,
        image_url: image_url !== undefined ? image_url : creditCardBanner.image_url,
        is_active: is_active !== undefined ? is_active : creditCardBanner.is_active,
        updated_at: new Date().toISOString()
    };
    res.json({ success: true, data: creditCardBanner });
});

app.get('/api/admin/credit-card-benefits', authenticateAdmin, (req, res) => {
    res.json(creditCardBenefits);
});

app.put('/api/admin/credit-card-benefits/:id', authenticateAdmin, (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const index = creditCardBenefits.findIndex(b => b.id === parseInt(id));
    if (index === -1) {
        return res.status(404).json({ success: false, message: 'Преимущество не найдено' });
    }
    creditCardBenefits[index] = { ...creditCardBenefits[index], ...updates, updated_at: new Date().toISOString() };
    res.json({ success: true, data: creditCardBenefits[index] });
});

app.post('/api/admin/credit-card-benefits', authenticateAdmin, (req, res) => {
    const { title, image_url, order_position, is_active } = req.body;
    const newBenefit = {
        id: creditCardBenefits.length + 1,
        title,
        image_url: image_url || '',
        order_position: order_position || creditCardBenefits.length + 1,
        is_active: is_active !== false,
        created_at: new Date().toISOString()
    };
    creditCardBenefits.push(newBenefit);
    res.status(201).json({ success: true, data: newBenefit });
});

app.delete('/api/admin/credit-card-benefits/:id', authenticateAdmin, (req, res) => {
    const { id } = req.params;
    const index = creditCardBenefits.findIndex(b => b.id === parseInt(id));
    if (index === -1) {
        return res.status(404).json({ success: false, message: 'Преимущество не найдено' });
    }
    creditCardBenefits.splice(index, 1);
    res.json({ success: true, message: 'Преимущество удалено' });
});

app.get('/api/admin/credit-card-steps', authenticateAdmin, (req, res) => {
    res.json(creditCardSteps);
});

app.put('/api/admin/credit-card-steps/:id', authenticateAdmin, (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const index = creditCardSteps.findIndex(s => s.id === parseInt(id));
    if (index === -1) {
        return res.status(404).json({ success: false, message: 'Шаг не найден' });
    }
    creditCardSteps[index] = { ...creditCardSteps[index], ...updates, updated_at: new Date().toISOString() };
    res.json({ success: true, data: creditCardSteps[index] });
});

app.post('/api/admin/credit-card-steps', authenticateAdmin, (req, res) => {
    const { title, description, icon, order_position, is_active } = req.body;
    const newStep = {
        id: creditCardSteps.length + 1,
        title,
        description: description || '',
        icon: icon || String(creditCardSteps.length + 1),
        order_position: order_position || creditCardSteps.length + 1,
        is_active: is_active !== false,
        created_at: new Date().toISOString()
    };
    creditCardSteps.push(newStep);
    res.status(201).json({ success: true, data: newStep });
});

app.delete('/api/admin/credit-card-steps/:id', authenticateAdmin, (req, res) => {
    const { id } = req.params;
    const index = creditCardSteps.findIndex(s => s.id === parseInt(id));
    if (index === -1) {
        return res.status(404).json({ success: false, message: 'Шаг не найден' });
    }
    creditCardSteps.splice(index, 1);
    res.json({ success: true, message: 'Шаг удален' });
});

app.get('/api/admin/credit-card-form', authenticateAdmin, (req, res) => {
    res.json(creditCardForm);
});

app.put('/api/admin/credit-card-form', authenticateAdmin, (req, res) => {
    const { title, button_text, fields, agreements, is_active } = req.body;
    creditCardForm = {
        ...creditCardForm,
        title: title !== undefined ? title : creditCardForm.title,
        button_text: button_text !== undefined ? button_text : creditCardForm.button_text,
        fields: fields !== undefined ? fields : creditCardForm.fields,
        agreements: agreements !== undefined ? agreements : creditCardForm.agreements,
        is_active: is_active !== undefined ? is_active : creditCardForm.is_active,
        updated_at: new Date().toISOString()
    };
    res.json({ success: true, data: creditCardForm });
});

// Публичные маршруты для кредитной карты
app.get('/api/content/credit-card-banner', (req, res) => {
    if (creditCardBanner.is_active === false) return res.json(null);
    res.json(creditCardBanner);
});

app.get('/api/content/credit-card-benefits', (req, res) => {
    const active = creditCardBenefits.filter(b => b.is_active !== false).sort((a, b) => (a.order_position || 0) - (b.order_position || 0));
    res.json(active);
});

app.get('/api/content/credit-card-steps', (req, res) => {
    const active = creditCardSteps.filter(s => s.is_active !== false).sort((a, b) => (a.order_position || 0) - (b.order_position || 0));
    res.json(active);
});

app.get('/api/content/credit-card-form', (req, res) => {
    if (creditCardForm.is_active === false) return res.json(null);
    res.json(creditCardForm);
});



// ============ ХРАНИЛИЩЕ ДЛЯ СТРАНИЦЫ КРЕДИТА ============

// Баннер кредита
let creditBanner = {
    id: 1,
    title: 'Оформите кредит',
    description: 'Получите деньги уже сегодня',
    button_text: 'Получить деньги',
    button_link: '#credit-form',
    image_url: '/images/CreditBannerimg.png',
    is_active: true,
    updated_at: new Date().toISOString()
};

// Преимущества кредита
let creditBenefits = [
    {
        id: 1,
        title: 'До 15 млн ₽',
        description: 'Сумма кредита',
        image_url: '/images/CreditbenefitimgCash.svg',
        order_position: 1,
        is_active: true,
        created_at: new Date().toISOString()
    },
    {
        id: 2,
        title: 'От 1 до 15 лет',
        description: 'Срок кредита',
        image_url: '/images/CreditbenefitimgClock.svg',
        order_position: 2,
        is_active: true,
        created_at: new Date().toISOString()
    },
    {
        id: 3,
        title: 'Доставка Кредита',
        description: 'На дебетовую карту',
        image_url: '/images/CreditbenefitimgCalendar.svg',
        order_position: 3,
        is_active: true,
        created_at: new Date().toISOString()
    }
];

// Форма кредита
let creditForm = {
    id: 1,
    title: 'Заявка на Кредит',
    button_text: 'Отправить заявку',
    fields: [
        { name: 'creditLimit', label: 'Желаемый кредитный лимит (не более 1 млн рублей)', type: 'text', placeholder: 'Желаемый кредитный лимит (не более 1 млн рублей)', required: true, order_position: 1, is_active: true },
        { name: 'term', label: 'Срок', type: 'text', placeholder: 'Срок', required: true, order_position: 2, is_active: true },
        { name: 'creditPurpose', label: 'Цель Кредита', type: 'text', placeholder: 'Цель Кредита', required: true, order_position: 3, is_active: true },
        { name: 'fullName', label: 'Фамилия Имя Отчество', type: 'text', placeholder: 'Фамилия Имя Отчество', required: true, order_position: 4, is_active: true },
        { name: 'phone', label: 'Мобильный телефон', type: 'tel', placeholder: 'Мобильный телефон', required: true, order_position: 5, is_active: true },
        { name: 'email', label: 'Электронная почта', type: 'email', placeholder: 'Электронная почта', required: true, order_position: 6, is_active: true }
    ],
    agreements: [
        { id: 1, text: 'Я соглашаюсь с условиями и даю своё согласие на обработку и использование моих персональных данных, и разрешаю сделать запрос в бюро кредитных историй', required: true, is_active: true },
        { id: 2, text: 'Я даю согласие на получение рекламы, а также иной информации и предложений Банка и других рекламораспространителей по любым каналам связи', required: false, is_active: true }
    ],
    is_active: true,
    updated_at: new Date().toISOString()
};

// ============ УПРАВЛЕНИЕ СТРАНИЦЕЙ КРЕДИТА (АДМИН) ============

// Баннер
app.get('/api/admin/credit-banner', authenticateAdmin, (req, res) => {
    res.json(creditBanner);
});

app.put('/api/admin/credit-banner', authenticateAdmin, (req, res) => {
    const { title, description, button_text, button_link, image_url, is_active } = req.body;
    creditBanner = {
        ...creditBanner,
        title: title !== undefined ? title : creditBanner.title,
        description: description !== undefined ? description : creditBanner.description,
        button_text: button_text !== undefined ? button_text : creditBanner.button_text,
        button_link: button_link !== undefined ? button_link : creditBanner.button_link,
        image_url: image_url !== undefined ? image_url : creditBanner.image_url,
        is_active: is_active !== undefined ? is_active : creditBanner.is_active,
        updated_at: new Date().toISOString()
    };
    res.json({ success: true, data: creditBanner });
});

// Преимущества
app.get('/api/admin/credit-benefits', authenticateAdmin, (req, res) => {
    res.json(creditBenefits);
});

app.put('/api/admin/credit-benefits/:id', authenticateAdmin, (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const index = creditBenefits.findIndex(b => b.id === parseInt(id));
    if (index === -1) {
        return res.status(404).json({ success: false, message: 'Преимущество не найдено' });
    }
    creditBenefits[index] = { ...creditBenefits[index], ...updates, updated_at: new Date().toISOString() };
    res.json({ success: true, data: creditBenefits[index] });
});

app.post('/api/admin/credit-benefits', authenticateAdmin, (req, res) => {
    const { title, description, image_url, order_position, is_active } = req.body;
    const newBenefit = {
        id: creditBenefits.length + 1,
        title,
        description: description || '',
        image_url: image_url || '',
        order_position: order_position || creditBenefits.length + 1,
        is_active: is_active !== false,
        created_at: new Date().toISOString()
    };
    creditBenefits.push(newBenefit);
    res.status(201).json({ success: true, data: newBenefit });
});

app.delete('/api/admin/credit-benefits/:id', authenticateAdmin, (req, res) => {
    const { id } = req.params;
    const index = creditBenefits.findIndex(b => b.id === parseInt(id));
    if (index === -1) {
        return res.status(404).json({ success: false, message: 'Преимущество не найдено' });
    }
    creditBenefits.splice(index, 1);
    res.json({ success: true, message: 'Преимущество удалено' });
});

// Форма
app.get('/api/admin/credit-form', authenticateAdmin, (req, res) => {
    res.json(creditForm);
});

app.put('/api/admin/credit-form', authenticateAdmin, (req, res) => {
    const { title, button_text, fields, agreements, is_active } = req.body;
    creditForm = {
        ...creditForm,
        title: title !== undefined ? title : creditForm.title,
        button_text: button_text !== undefined ? button_text : creditForm.button_text,
        fields: fields !== undefined ? fields : creditForm.fields,
        agreements: agreements !== undefined ? agreements : creditForm.agreements,
        is_active: is_active !== undefined ? is_active : creditForm.is_active,
        updated_at: new Date().toISOString()
    };
    res.json({ success: true, data: creditForm });
});

// ============ ПУБЛИЧНЫЕ МАРШРУТЫ ============

app.get('/api/content/credit-banner', (req, res) => {
    if (creditBanner.is_active === false) return res.json(null);
    res.json(creditBanner);
});

app.get('/api/content/credit-benefits', (req, res) => {
    const active = creditBenefits.filter(b => b.is_active !== false).sort((a, b) => (a.order_position || 0) - (b.order_position || 0));
    res.json(active);
});

app.get('/api/content/credit-form', (req, res) => {
    if (creditForm.is_active === false) return res.json(null);
    res.json(creditForm);
});

// ============ ТЕСТОВЫЕ ДАННЫЕ ============

const initTestData = () => {
    if (interestBlocks.length === 0) {
        interestBlocks.push(
            {
                id: 1,
                title: 'Дебетовая карта',
                description: 'Кэшбэк до 30%',
                image_url: '/images/BlockoneimgCard.png',
                link: '/debit-card',
                block_type: 'debit_card',
                order_position: 1,
                is_active: true,
                created_at: new Date().toISOString()
            },
            {
                id: 2,
                title: 'Кредитная карта',
                description: 'Обслуживание 0 ₽',
                image_url: '/images/BlocktwoimgCard.png',
                link: '/credit-card',
                block_type: 'credit_card',
                order_position: 2,
                is_active: true,
                created_at: new Date().toISOString()
            },
            {
                id: 3,
                title: 'Кредит',
                description: 'Оформление онлайн',
                image_url: '/images/BlockthreeimgMoney.png',
                link: '/credit',
                block_type: 'credit',
                order_position: 3,
                is_active: true,
                created_at: new Date().toISOString()
            },
            {
                id: 4,
                title: 'Сберегательный вклад',
                description: 'До 14,5% годовых',
                image_url: '/images/Blockfourimgvault.png',
                link: '/deposit',
                block_type: 'deposit',
                order_position: 4,
                is_active: true,
                created_at: new Date().toISOString()
            }
        );
    }
};

initTestData();

// ============ 404 ОБРАБОТЧИК ============
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Маршрут ${req.url} не найден` });
});

// ============ ЗАПУСК СЕРВЕРА ============
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║   ✅ СЕРВЕР ЗАПУЩЕН!                                                      ║
║                                                                           ║
║   📡 Порт: ${PORT}                                                         ║
║   🔗 http://localhost:${PORT}                                              ║
║                                                                           ║
║   📤 Загрузка изображений: /api/admin/upload                              ║
║   📁 Статическая папка: /uploads                                          ║
║                                                                           ║
║   🔑 Данные для входа админа:                                             ║
║   📧 Email: admin@bank.com                                                ║
║   🔒 Пароль: admin123                                                     ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
    `);
});