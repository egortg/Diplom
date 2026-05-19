import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import {
    submitCreditApplication,
    submitCreditCardApplication,
    submitDebitCardApplication,
    getUserApplications
} from '../controllers/applicationController.js';
import { validateCreditApplication } from '../utils/validation.js';

const router = express.Router();

// Все маршруты требуют авторизации
router.use(authenticateUser);

// Заявки
router.post('/credit', validateCreditApplication, submitCreditApplication);
router.post('/credit-card', submitCreditCardApplication);
router.post('/debit-card', submitDebitCardApplication);
router.get('/my', getUserApplications);

export default router;