import { z } from 'zod';

export const createPropertySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  location: z.string().min(1, 'Location is required'),
  city: z.string().min(1, 'City is required'),
  images: z.array(z.string().url('Invalid image URL')).optional(),
});

export const updatePropertySchema = createPropertySchema.partial();
