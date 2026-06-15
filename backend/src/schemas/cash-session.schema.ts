import { z } from 'zod';

export const openCashSessionSchema = z.object({
  branchId: z.number().int().positive('La sucursal es requerida'),
  openingBalance: z.number().nonnegative('El saldo inicial debe ser mayor o igual a 0'),
});

export const closeCashSessionSchema = z.object({
  sessionId: z.number().int().positive('ID de sesión inválido'),
  actualBalance: z.number().nonnegative('El saldo final debe ser mayor o igual a 0'),
  notes: z.string().max(500, 'Las notas no pueden superar los 500 caracteres').optional(),
  cashCount: z.record(z.string(), z.number().int().nonnegative()).optional(),
});
