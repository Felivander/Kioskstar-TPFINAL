import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getStockByBranch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { branchId } = req.params;

    const stock = await prisma.stock.findMany({
      where: { branchId: parseInt(branchId) },
      include: {
        product: {
          include: { category: true },
        },
      },
      orderBy: { product: { name: 'asc' } },
    });

    res.json(stock);
  } catch (error) {
    console.error('Error en getStockByBranch:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const updateStock = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { branchId, productId } = req.params;
    const { quantity } = req.body;

    const stock = await prisma.stock.upsert({
      where: {
        branchId_productId: {
          branchId: parseInt(branchId),
          productId: parseInt(productId),
        },
      },
      update: { quantity },
      create: {
        branchId: parseInt(branchId),
        productId: parseInt(productId),
        quantity,
      },
      include: {
        product: {
          include: { category: true },
        },
      },
    });

    res.json(stock);
  } catch (error) {
    console.error('Error en updateStock:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
