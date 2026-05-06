import { z } from 'zod';

export const createKioskSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  address: z.string().min(5, 'La dirección debe tener al menos 5 caracteres'),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const updateKioskSchema = createKioskSchema.partial();

export type CreateKioskInput = z.infer<typeof createKioskSchema>;
export type UpdateKioskInput = z.infer<typeof updateKioskSchema>;
