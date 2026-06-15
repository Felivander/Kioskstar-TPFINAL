import { Router } from 'express';
import { getActiveSession, openSession, closeSession, getHistoryByBranch } from '../controllers/cash-session.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleMiddleware } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { openCashSessionSchema, closeCashSessionSchema } from '../schemas/cash-session.schema';

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware('ADMIN', 'EMPLEADO'));

router.get('/active/:branchId', getActiveSession);
router.get('/branch/:branchId', getHistoryByBranch);
router.post('/open', validate(openCashSessionSchema), openSession);
router.post('/close', validate(closeCashSessionSchema), closeSession);

export default router;
