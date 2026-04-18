import { z } from 'zod';

export const createRoomTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  basePrice: z.number().positive('Base price must be a positive number'),
  capacity: z.number().int().positive('Capacity must be a positive integer'),
  images: z.array(z.string().url('Invalid image URL')).optional(),
});

export const updateRoomTypeSchema = createRoomTypeSchema.partial();

export const createRoomSchema = z.object({
  number: z.string().min(1, 'Room number is required'),
});

// Accept both "2026-04-25" and "2026-04-25T00:00:00.000Z"
const dateOrDatetime = z.string().refine(
  (val) => !isNaN(Date.parse(val)),
  { message: 'Invalid date format' }
);

export const createPeakRateSchema = z.object({
  startDate: dateOrDatetime,
  endDate: dateOrDatetime,
  rateType: z.enum(['NOMINAL', 'PERCENTAGE']),
  rateValue: z.number().positive('Rate value must be positive'),
}).refine(
  (data) => new Date(data.endDate) >= new Date(data.startDate),
  { message: 'End date must be after or equal to start date', path: ['endDate'] }
);