import { z } from 'zod';

export const createSaleSchema = z.object({
  branchId: z.number().int().positive('La sucursal es requerida'),
  paymentMethod: z.enum(['EFECTIVO', 'MERCADOPAGO', 'DEBITO', 'CREDITO']).default('EFECTIVO'),
  items: z.array(z.object({
    productId: z.number().int().positive('El producto es requerido'),
    quantity: z.number().int().positive('La cantidad debe ser mayor a 0'),
    unitPrice: z.number().min(0, 'El precio unitario debe ser mayor o igual a 0'),
  })).min(1, 'La venta debe tener al menos un producto'),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
