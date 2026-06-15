import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  email: z.string().email('Email inválido'),
  // MED-3: Requisitos de contraseña más fuertes
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(100)
    .regex(/[A-Z]/, 'La contraseña debe contener al menos una letra mayúscula')
    .regex(/[0-9]/, 'La contraseña debe contener al menos un número'),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const onboardClienteSchema = z.object({
  choice: z.literal('CLIENTE'),
});

export const onboardKioskSchema = z.object({
  choice: z.literal('KIOSK'),
  kioskName: z.string().min(2, 'El nombre del kiosco debe tener al menos 2 caracteres').max(100),
  kioskAddress: z.string().min(5, 'La dirección debe tener al menos 5 caracteres'),
  kioskLat: z.number().min(-90).max(90),
  kioskLng: z.number().min(-180).max(180),
  branches: z.array(z.object({
    name: z.string().min(2).max(100),
    address: z.string().min(5),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  })).optional().default([]),
});

export const onboardSchema = z.discriminatedUnion('choice', [
  onboardClienteSchema,
  onboardKioskSchema,
]);

export const joinKioskSchema = z.object({
  code: z.string().min(1, 'El código es requerido'),
});

export const generateInviteCodeSchema = z.object({
  branchId: z.number().int().positive('Debés seleccionar una sucursal'),
});

// Password recovery
export const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

export const verifyResetCodeSchema = z.object({
  email: z.string().email('Email inválido'),
  code: z.string().length(6, 'El código debe tener 6 dígitos'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
  code: z.string().length(6, 'El código debe tener 6 dígitos'),
  newPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').max(100),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type OnboardInput = z.infer<typeof onboardSchema>;
export type JoinKioskInput = z.infer<typeof joinKioskSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type VerifyResetCodeInput = z.infer<typeof verifyResetCodeSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
