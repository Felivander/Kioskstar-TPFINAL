import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(200),
  barcode: z.string().optional().nullable(),
  categoryId: z.number().int().positive('La categoría es requerida'),
  imageUrl: z.string().url('URL de imagen inválida').optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  price: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
});

export const updateProductSchema = createProductSchema.partial();

export const createCategorySchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  description: z.string().max(300).optional().nullable(),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
