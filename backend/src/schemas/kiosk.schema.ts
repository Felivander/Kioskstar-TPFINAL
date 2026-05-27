import { z } from 'zod';

export const createKioskSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  address: z.string().min(5, 'La dirección debe tener al menos 5 caracteres'),
  city: z.string().min(2, 'La ciudad debe tener al menos 2 caracteres').max(100).optional(),
  postalCode: z.string().max(10).optional(),
  province: z.string().max(100).optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const updateKioskSchema = createKioskSchema.partial();

export type CreateKioskInput = z.infer<typeof createKioskSchema>;
export type UpdateKioskInput = z.infer<typeof updateKioskSchema>;
