import { z } from 'zod';

export const createBranchSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  address: z.string().min(5, 'La dirección debe tener al menos 5 caracteres'),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const updateBranchSchema = createBranchSchema.partial();

export type CreateBranchInput = z.infer<typeof createBranchSchema>;
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;
