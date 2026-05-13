import { Router } from 'express';
import {
  register, login, getMe, updateUser, onboard,
  generateInviteCode, joinKiosk,
  forgotPassword, resetPassword,
  getMyKiosk, getMyBranch,
} from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleMiddleware } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { registerSchema, loginSchema, onboardSchema, joinKioskSchema, generateInviteCodeSchema } from '../schemas/auth.schema';
import { forgotPasswordSchema, resetPasswordSchema } from '../schemas/password-reset.schema';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', authMiddleware, getMe);
router.put('/users/:id', authMiddleware, updateUser);

// Onboarding — después del registro
router.post('/onboard', authMiddleware, validate(onboardSchema), onboard);

// Invite codes — empleados
router.post('/kiosks/:kioskId/invite-code', authMiddleware, roleMiddleware('ADMIN'), validate(generateInviteCodeSchema), generateInviteCode);
router.post('/join-kiosk', authMiddleware, validate(joinKioskSchema), joinKiosk);

// Password reset — público
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

// My kiosk/branch — para dashboard
router.get('/my-kiosk', authMiddleware, roleMiddleware('ADMIN'), getMyKiosk);
router.get('/my-branch', authMiddleware, roleMiddleware('EMPLEADO'), getMyBranch);

export default router;
