import { Router } from 'express';
import { getStockByBranch, updateStock } from '../controllers/stock.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleMiddleware } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { updateStockSchema } from '../schemas/stock.schema';

const router = Router();

router.get('/:branchId/stock', getStockByBranch); // público
router.put('/:branchId/stock/:productId', authMiddleware, roleMiddleware('ADMIN', 'EMPLEADO'), validate(updateStockSchema), updateStock);

export default router;
