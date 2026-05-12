import { z } from 'zod';

const paymentEntrySchema = z.object({
  method: z.enum(['EFECTIVO', 'DEBITO']),
  amount: z.number().positive('El monto debe ser mayor a 0'),
});

export const createSaleSchema = z.object({
  branchId: z.number().int().positive('La sucursal es requerida'),
  paymentMethod: z.enum(['EFECTIVO', 'MERCADOPAGO', 'DEBITO', 'CREDITO', 'MIXTO']).default('EFECTIVO'),
  payments: z.array(paymentEntrySchema).min(2).max(2).optional(),
  items: z.array(z.object({
    productId: z.number().int().positive('El producto es requerido'),
    quantity: z.number().int().positive('La cantidad debe ser mayor a 0'),
    unitPrice: z.number().min(0, 'El precio unitario debe ser mayor o igual a 0'),
  })).min(1, 'La venta debe tener al menos un producto'),
}).refine((data) => {
  if (data.paymentMethod === 'MIXTO' && !data.payments) {
    return false;
  }
  return true;
}, { message: 'Pago mixto requiere el detalle de pagos', path: ['payments'] });

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
