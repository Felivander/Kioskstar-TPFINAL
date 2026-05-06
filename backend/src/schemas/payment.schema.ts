import { z } from 'zod';

export const createPaymentSchema = z.object({
  saleId: z.number().int().positive('El ID de venta es requerido'),
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().optional(),
  amount: z.number().positive('El monto debe ser mayor a 0'),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
