import { z } from 'zod';

export const updateStockSchema = z.object({
  quantity: z.number().int().min(0, 'La cantidad debe ser mayor o igual a 0'),
});

export type UpdateStockInput = z.infer<typeof updateStockSchema>;
