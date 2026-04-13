import { Router } from 'express';
import * as categoryController from '../controllers/category.controller.js';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authenticateToken, authorizeRole('TENANT'), categoryController.getMyCategories);
router.post('/', authenticateToken, authorizeRole('TENANT'), categoryController.createCategory);
router.put('/:id', authenticateToken, authorizeRole('TENANT'), categoryController.updateCategory);
router.delete('/:id', authenticateToken, authorizeRole('TENANT'), categoryController.deleteCategory);

export default router;
