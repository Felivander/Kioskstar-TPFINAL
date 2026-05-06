import { Router } from 'express';
import { getAllKiosks, getKioskById, createKiosk, updateKiosk, deleteKiosk, getBranches, createBranch, updateBranch, deleteBranch } from '../controllers/kiosk.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleMiddleware } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createKioskSchema, updateKioskSchema } from '../schemas/kiosk.schema';
import { createBranchSchema, updateBranchSchema } from '../schemas/branch.schema';

const router = Router();

// Kiosks
router.get('/', getAllKiosks);
router.get('/:id', getKioskById);
router.post('/', authMiddleware, roleMiddleware('ADMIN'), validate(createKioskSchema), createKiosk);
router.put('/:id', authMiddleware, roleMiddleware('ADMIN'), validate(updateKioskSchema), updateKiosk);
router.delete('/:id', authMiddleware, roleMiddleware('ADMIN'), deleteKiosk);

// Branches
router.get('/:kioskId/branches', getBranches);
router.post('/:kioskId/branches', authMiddleware, roleMiddleware('ADMIN'), validate(createBranchSchema), createBranch);

export default router;
