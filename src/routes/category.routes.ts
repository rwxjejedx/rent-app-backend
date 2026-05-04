import { Router } from 'express';
import * as categoryController from '../controllers/category.controller.js';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * --- PUBLIC ROUTES ---
 * Rute ini bisa diakses tanpa login. 
 * Digunakan oleh halaman Home (Index) untuk menampilkan filter kategori.
 */
// Mengambil semua kategori yang tersedia di sistem
router.get('/all', categoryController.getAllCategories);

// Mengambil detail satu kategori (opsional, jika diperlukan)
router.get('/detail/:id', categoryController.getCategoryById);


/**
 * --- PRIVATE ROUTES ---
 * Membutuhkan 'Authorization: Bearer <token>'
 */

// Mengambil kategori yang khusus dibuat/dikelola oleh Tenant (Dashboard)
router.get('/my', authenticateToken, authorizeRole('TENANT'), categoryController.getMyCategories);

// Membuat kategori baru (Hanya Tenant/Admin)
router.post('/', authenticateToken, authorizeRole('TENANT'), categoryController.createCategory);

// Mengupdate kategori (Hanya Tenant/Admin)
router.put('/:id', authenticateToken, authorizeRole('TENANT'), categoryController.updateCategory);

// Menghapus kategori (Hanya Tenant/Admin)
router.delete('/:id', authenticateToken, authorizeRole('TENANT'), categoryController.deleteCategory);

export default router;