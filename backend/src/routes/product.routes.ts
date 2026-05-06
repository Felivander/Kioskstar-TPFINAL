import { Router } from 'express';
import { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, getAllCategories, createCategory, updateCategory, deleteCategory, scanProduct } from '../controllers/product.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleMiddleware } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createProductSchema, updateProductSchema, createCategorySchema, updateCategorySchema } from '../schemas/product.schema';

const router = Router();

// Products
router.get('/', getAllProducts);
router.get('/categories', getAllCategories);
router.get('/:id', getProductById);
router.post('/', authMiddleware, roleMiddleware('ADMIN', 'EMPLEADO'), validate(createProductSchema), createProduct);
router.post('/scan', authMiddleware, roleMiddleware('ADMIN', 'EMPLEADO'), scanProduct);
router.put('/:id', authMiddleware, roleMiddleware('ADMIN', 'EMPLEADO'), validate(updateProductSchema), updateProduct);
router.delete('/:id', authMiddleware, roleMiddleware('ADMIN', 'EMPLEADO'), deleteProduct);

// Categories
router.post('/categories', authMiddleware, roleMiddleware('ADMIN', 'EMPLEADO'), validate(createCategorySchema), createCategory);
router.put('/categories/:id', authMiddleware, roleMiddleware('ADMIN', 'EMPLEADO'), validate(updateCategorySchema), updateCategory);
router.delete('/categories/:id', authMiddleware, roleMiddleware('ADMIN', 'EMPLEADO'), deleteCategory);

export default router;
