import { Router } from 'express';
import { createPreference, paymentSuccess, paymentFailure } from '../controllers/payment.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createPaymentSchema } from '../schemas/payment.schema';

const router = Router();

router.post('/create-preference', authMiddleware, validate(createPaymentSchema), createPreference);
router.get('/success', paymentSuccess);
router.get('/failure', paymentFailure);

export default router;
