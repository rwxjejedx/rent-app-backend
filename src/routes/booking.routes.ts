import { Router } from 'express';
import * as bookingController from '../controllers/booking.controller.js';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createBookingSchema, createReviewSchema } from '../validations/booking.validation.js';

const router = Router();

// User
router.post('/', authenticateToken, authorizeRole('USER'), validate(createBookingSchema), bookingController.createBooking);
router.get('/my', authenticateToken, authorizeRole('USER'), bookingController.getUserBookings);
router.patch('/:id/cancel', authenticateToken, authorizeRole('USER'), bookingController.cancelBooking);
router.post('/:bookingId/review', authenticateToken, authorizeRole('USER'), validate(createReviewSchema), bookingController.createReview);

// Tenant (pemilik properti)
router.get('/tenant', authenticateToken, authorizeRole('TENANT'), bookingController.getTenantBookings);
router.patch('/:id/status', authenticateToken, authorizeRole('TENANT'), bookingController.updateBookingStatus);

export default router;
