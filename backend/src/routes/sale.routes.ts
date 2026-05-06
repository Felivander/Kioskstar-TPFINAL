import { Router } from 'express';
import { createSale, getSalesByBranch } from '../controllers/sale.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleMiddleware } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createSaleSchema } from '../schemas/sale.schema';

const router = Router();

router.post('/', authMiddleware, roleMiddleware('ADMIN', 'EMPLEADO'), validate(createSaleSchema), createSale);
router.get('/branch/:branchId', authMiddleware, roleMiddleware('ADMIN', 'EMPLEADO'), getSalesByBranch);

export default router;
