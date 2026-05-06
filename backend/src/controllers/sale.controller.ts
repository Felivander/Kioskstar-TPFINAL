import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const createSale = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { branchId, paymentMethod, items } = req.body;

    // Calcular total
    const total = items.reduce(
      (sum: number, item: { quantity: number; unitPrice: number }) =>
        sum + item.quantity * item.unitPrice,
      0
    );

    // Crear venta con items en una transacción
    const sale = await prisma.$transaction(async (tx) => {
      // Crear la venta
      const newSale = await tx.sale.create({
        data: {
          branchId,
          userId: req.userId!,
          total,
          paymentMethod,
          items: {
            create: items.map((item: { productId: number; quantity: number; unitPrice: number }) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          },
        },
        include: {
          items: {
            include: { product: true },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
          branch: {
            select: { id: true, name: true },
          },
        },
      });

      // Actualizar stock (restar cantidad vendida)
      for (const item of items) {
        await tx.stock.updateMany({
          where: {
            branchId,
            productId: item.productId,
          },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      return newSale;
    });

    res.status(201).json(sale);
  } catch (error) {
    console.error('Error en createSale:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getSalesByBranch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { branchId } = req.params;

    const sales = await prisma.sale.findMany({
      where: { branchId: parseInt(branchId) },
      include: {
        items: {
          include: { product: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(sales);
  } catch (error) {
    console.error('Error en getSalesByBranch:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
