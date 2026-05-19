import express from 'express';
import { adminLogin } from '../controllers/authController.js';
import {
    getDashboardStats,
    getBanners,
    createBanner,
    updateBanner,
    deleteBanner,
    getBenefits,
    createBenefit,
    updateBenefit,
    deleteBenefit,
    getInterestBlocks,
    createInterestBlock,
    updateInterestBlock,
    deleteInterestBlock
} from '../controllers/adminController.js';
import { authenticateAdmin, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Публичный маршрут (админ логин)
router.post('/login', adminLogin);

// Все маршруты ниже защищены
router.use(authenticateAdmin);

// Статистика
router.get('/dashboard', getDashboardStats);

// Баннеры
router.route('/banners')
    .get(getBanners)
    .post(createBanner);

router.route('/banners/:id')
    .put(updateBanner)
    .delete(deleteBanner);

// Преимущества
router.route('/benefits')
    .get(getBenefits)
    .post(createBenefit);

router.route('/benefits/:id')
    .put(updateBenefit)
    .delete(deleteBenefit);

// Блоки интересов
router.route('/interest-blocks')
    .get(getInterestBlocks)
    .post(createInterestBlock);

router.route('/interest-blocks/:id')
    .put(updateInterestBlock)
    .delete(deleteInterestBlock);

export default router;