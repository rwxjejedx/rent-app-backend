import { z } from 'zod';

export const createBookingSchema = z.object({
  roomTypeId: z.number().int().positive('Room type is required'),
  checkIn: z.string().min(1, 'Check-in date is required'),
  checkOut: z.string().min(1, 'Check-out date is required'),
  guestName: z.string().min(1, 'Guest name is required'),
  guestNik: z.string().min(16, 'NIK must be 16 digits').max(16, 'NIK must be 16 digits'),
  guestPhone: z.string().min(10, 'Phone number is required'),
  guestAddress: z.string().min(5, 'Address is required'),
}).refine((data) => new Date(data.checkOut) > new Date(data.checkIn), {
  message: 'Check-out must be after check-in',
  path: ['checkOut'],
});

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
  comment: z.string().min(10, 'Comment must be at least 10 characters'),
});
