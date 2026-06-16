import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const createSale = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { branchId, paymentMethod, payments, items } = req.body;

    // IDOR Check
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || (user.role !== 'ADMIN' && user.branchId !== branchId)) {
      res.status(403).json({ error: 'No autorizado para registrar ventas en esta sucursal' });
      return;
    }

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
        // Concurrency Stock update
        const updateResult = await tx.stock.updateMany({
          where: {
            branchId,
            productId: item.productId,
            quantity: { gte: item.quantity },
          },
          data: {
            quantity: { decrement: item.quantity },
          },
        });

        if (updateResult.count === 0) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { name: true },
          });
          throw new Error(
            `Stock insuficiente para el producto "${product?.name || item.productId}".`
          );
        }
      }

      return newSale;
    });

    res.status(201).json(sale);
  } catch (error: any) {
    console.error('Error en createSale:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

export const getTopProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { branchId } = req.params;
    const branchIdNum = parseInt(branchId as string);

    // IDOR Check
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || (user.role !== 'ADMIN' && user.branchId !== branchIdNum)) {
      res.status(403).json({ error: 'No autorizado para ver estadísticas de esta sucursal' });
      return;
    }

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
    const branchIdNum = parseInt(branchId as string);

    // IDOR Check
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || (user.role !== 'ADMIN' && user.branchId !== branchIdNum)) {
      res.status(403).json({ error: 'No autorizado para ver ventas de esta sucursal' });
      return;
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const sales = await prisma.sale.findMany({
      where: { 
        branchId: branchIdNum,
        createdAt: {
          gte: todayStart,
        },
      },
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
