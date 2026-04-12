import { Router } from 'express';
import * as roomController from '../controllers/room.controller.js';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createRoomTypeSchema, updateRoomTypeSchema, createRoomSchema, createPeakRateSchema } from '../validations/room.validation.js';

const router = Router();

// ─── Room Type ────────────────────────────────────────────────────────────────
router.post('/properties/:propertyId/room-types', authenticateToken, authorizeRole('TENANT'), validate(createRoomTypeSchema), roomController.createRoomType);
router.put('/room-types/:id', authenticateToken, authorizeRole('TENANT'), validate(updateRoomTypeSchema), roomController.updateRoomType);
router.delete('/room-types/:id', authenticateToken, authorizeRole('TENANT'), roomController.deleteRoomType);

// ─── Room ─────────────────────────────────────────────────────────────────────
router.post('/room-types/:roomTypeId/rooms', authenticateToken, authorizeRole('TENANT'), validate(createRoomSchema), roomController.createRoom);
router.delete('/rooms/:id', authenticateToken, authorizeRole('TENANT'), roomController.deleteRoom);

// ─── Peak Rate ────────────────────────────────────────────────────────────────
router.get('/room-types/:roomTypeId/peak-rates', roomController.getPeakRates);
router.post('/room-types/:roomTypeId/peak-rates', authenticateToken, authorizeRole('TENANT'), validate(createPeakRateSchema), roomController.createPeakRate);
router.delete('/peak-rates/:id', authenticateToken, authorizeRole('TENANT'), roomController.deletePeakRate);

export default router;
