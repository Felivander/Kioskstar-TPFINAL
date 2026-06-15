import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const createSale = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { branchId, paymentMethod, payments, items } = req.body;

    // Verificar si existe una caja abierta en esta sucursal
    const activeSession = await prisma.cashSession.findFirst({
      where: { branchId, status: 'OPEN' },
    });

    if (!activeSession) {
      res.status(400).json({ error: 'La caja está cerrada. Debe abrir la caja para poder registrar ventas.' });
      return;
    }

    const total = items.reduce(
      (sum: number, item: { quantity: number; unitPrice: number }) =>
        sum + item.quantity * item.unitPrice,
      0
    );

    const sale = await prisma.$transaction(async (tx) => {
      const newSale = await tx.sale.create({
        data: {
          branchId,
          userId: req.userId!,
          total,
          paymentMethod,
          payments: paymentMethod === 'MIXTO' ? payments : undefined,
          cashSessionId: activeSession.id,
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

      for (const item of items) {
        // MED-7: Verificar stock disponible antes de decrementar
        const stockRecord = await tx.stock.findFirst({
          where: { branchId, productId: item.productId },
        });

        if (!stockRecord || stockRecord.quantity < item.quantity) {
          throw new Error(
            `Stock insuficiente para el producto ID ${item.productId}. ` +
            `Disponible: ${stockRecord?.quantity ?? 0}, solicitado: ${item.quantity}`
          );
        }

        await tx.stock.updateMany({
          where: { branchId, productId: item.productId },
          data: { quantity: { decrement: item.quantity } },
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

export const getTopProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { branchId } = req.params;
    const branchIdNum = parseInt(branchId as string);

    // Top products by total quantity sold in this branch
    const topProducts = await prisma.saleItem.groupBy({
      by: ['productId'],
      where: { sale: { branchId: branchIdNum } },
      _sum: { quantity: true },
      _count: { _all: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10,
    });

    // Fetch product details
    const productIds = topProducts.map((t) => t.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { category: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Recent trending: most sold in the last 7 days
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const trending = await prisma.saleItem.groupBy({
      by: ['productId'],
      where: {
        sale: { branchId: branchIdNum, createdAt: { gte: weekAgo } },
      },
      _sum: { quantity: true },
      _count: { _all: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    const trendingIds = trending.map((t) => t.productId);
    const trendingProducts = await prisma.product.findMany({
      where: { id: { in: trendingIds } },
      include: { category: true },
    });
    const trendingMap = new Map(trendingProducts.map((p) => [p.id, p]));

    res.json({
      topProducts: topProducts.map((t) => ({
        product: productMap.get(t.productId),
        totalSold: t._sum.quantity || 0,
        salesCount: t._count._all,
      })),
      trending: trending.map((t) => ({
        product: trendingMap.get(t.productId),
        totalSold: t._sum.quantity || 0,
        salesCount: t._count._all,
      })),
    });
  } catch (error) {
    console.error('Error en getTopProducts:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getSalesByBranch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { branchId } = req.params;

    const sales = await prisma.sale.findMany({
      where: { branchId: parseInt(branchId as string) },
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
