import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import * as bookingService from '../services/booking.service.js';

export const createBooking = async (req: AuthRequest, res: Response) => {
  try {
    const booking = await bookingService.createBooking(req.userId!, {
      ...req.body,
      roomTypeId: Number(req.body.roomTypeId),
    });
    res.status(201).json(booking);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getUserBookings = async (req: AuthRequest, res: Response) => {
  try {
    const bookings = await bookingService.getUserBookings(req.userId!);
    res.json(bookings);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getTenantBookings = async (req: AuthRequest, res: Response) => {
  try {
    const bookings = await bookingService.getTenantBookings(req.userId!);
    res.json(bookings);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateBookingStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!['CONFIRMED', 'CANCELLED'].includes(status)) {
      res.status(400).json({ message: 'Status must be CONFIRMED or CANCELLED' });
      return;
    }
    const booking = await bookingService.updateBookingStatus(Number(req.params.id), status, req.userId!);
    res.json(booking);
  } catch (error: any) {
    res.status(error.message === 'Forbidden' ? 403 : 400).json({ message: error.message });
  }
};

export const cancelBooking = async (req: AuthRequest, res: Response) => {
  try {
    const booking = await bookingService.cancelBooking(Number(req.params.id), req.userId!);
    res.json(booking);
  } catch (error: any) {
    res.status(error.message === 'Forbidden' ? 403 : 400).json({ message: error.message });
  }
};

export const createReview = async (req: AuthRequest, res: Response) => {
  try {
    const review = await bookingService.createReview(Number(req.params.bookingId), req.userId!, req.body);
    res.status(201).json(review);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
