import { Router } from 'express';
import { register, login, getMe, updateUser, onboard, generateInviteCode, joinKiosk } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleMiddleware } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { registerSchema, loginSchema, onboardSchema, joinKioskSchema } from '../schemas/auth.schema';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', authMiddleware, getMe);
router.put('/users/:id', authMiddleware, updateUser);

// Onboarding — después del registro
router.post('/onboard', authMiddleware, validate(onboardSchema), onboard);

// Invite codes — empleados
router.post('/kiosks/:kioskId/invite-code', authMiddleware, roleMiddleware('ADMIN'), generateInviteCode);
router.post('/join-kiosk', authMiddleware, validate(joinKioskSchema), joinKiosk);

export default router;
