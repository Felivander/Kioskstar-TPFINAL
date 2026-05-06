import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';

export const createPreference = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, amount } = req.body;
    // TODO: Integrar con MercadoPago SDK
    res.json({
      message: 'Preferencia de pago creada (placeholder)',
      preference: { id: 'mp-placeholder-id', init_point: 'https://www.mercadopago.com.ar/checkout/v1/redirect', title, description, amount },
    });
  } catch (error) {
    console.error('Error en createPreference:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const paymentSuccess = async (req: Request, res: Response): Promise<void> => {
  const { payment_id, status, merchant_order_id } = req.query;
  res.json({ message: 'Pago exitoso', paymentId: payment_id, status, merchantOrderId: merchant_order_id });
};

export const paymentFailure = async (req: Request, res: Response): Promise<void> => {
  res.json({ message: 'El pago no pudo ser procesado', status: 'failure' });
};
