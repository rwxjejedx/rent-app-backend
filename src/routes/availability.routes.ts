import { Router } from 'express';
import * as availabilityController from '../controllers/availability.controller.js';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware.js';

const router = Router();

// Public — user bisa lihat availability sebelum booking
router.get('/room-types/:roomTypeId', availabilityController.getRoomAvailability);

// Tenant only
router.post('/room-types/:roomTypeId', authenticateToken, authorizeRole('TENANT'), availabilityController.setRoomAvailability);
router.delete('/:id', authenticateToken, authorizeRole('TENANT'), availabilityController.deleteRoomAvailability);

export default router;
