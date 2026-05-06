import { Router } from 'express';
import { getKiosksNearby, searchProductInMap } from '../controllers/map.controller';

const router = Router();

router.get('/kiosks', getKiosksNearby);
router.get('/search', searchProductInMap);

export default router;
