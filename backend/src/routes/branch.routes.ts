import { Router } from 'express';
import { updateBranch, deleteBranch } from '../controllers/kiosk.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleMiddleware } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { updateBranchSchema } from '../schemas/branch.schema';

const router = Router();

router.put('/:id', authMiddleware, roleMiddleware('ADMIN'), validate(updateBranchSchema), updateBranch);
router.delete('/:id', authMiddleware, roleMiddleware('ADMIN'), deleteBranch);

export default router;
