import { Router } from 'express';
import * as propertyController from '../controllers/property.controller.js';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createPropertySchema, updatePropertySchema } from '../validations/property.validation.js';

const router = Router();

// Public
router.get('/', propertyController.getAllProperties);
router.get('/calculate-price', propertyController.calculateBookingPrice);
router.get('/:id', propertyController.getPropertyById);
router.get('/:id/calendar', propertyController.getPropertyCalendar);

// Tenant only
router.post('/', authenticateToken, authorizeRole('TENANT'), validate(createPropertySchema), propertyController.createProperty);
router.get('/tenant/my-listings', authenticateToken, authorizeRole('TENANT'), propertyController.getMyProperties);
router.put('/:id', authenticateToken, authorizeRole('TENANT'), validate(updatePropertySchema), propertyController.updateProperty);
router.delete('/:id', authenticateToken, authorizeRole('TENANT'), propertyController.deleteProperty);

export default router;
