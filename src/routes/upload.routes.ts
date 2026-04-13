import { Router } from 'express';
import * as uploadController from '../controllers/upload.controller.js';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';

const router = Router();

// Property images
router.post('/properties/:propertyId/images', authenticateToken, authorizeRole('TENANT'), upload.array('images', 10), uploadController.uploadPropertyImages);
router.delete('/properties/images/:id', authenticateToken, authorizeRole('TENANT'), uploadController.deletePropertyImage);

// Room type images
router.post('/room-types/:roomTypeId/images', authenticateToken, authorizeRole('TENANT'), upload.array('images', 10), uploadController.uploadRoomTypeImages);
router.delete('/room-types/images/:id', authenticateToken, authorizeRole('TENANT'), uploadController.deleteRoomTypeImage);

// Avatar
router.post('/avatar', authenticateToken, upload.single('avatar'), uploadController.uploadAvatar);

export default router;
