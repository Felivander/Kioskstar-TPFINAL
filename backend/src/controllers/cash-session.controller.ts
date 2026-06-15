import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getActiveSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { branchId } = req.params;
    const bId = parseInt(branchId as string);

    // IDOR Check
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || (user.role !== 'ADMIN' && user.branchId !== bId)) {
      res.status(403).json({ error: 'No autorizado para acceder a esta sucursal' });
      return;
    }

    const active = await prisma.cashSession.findFirst({
      where: {
        branchId: bId,
        status: 'OPEN',
      },
      include: {
        openedBy: { select: { id: true, name: true, email: true } },
        sales: true,
      },
    });

    if (active) {
      let cashSalesTotal = 0;
      active.sales.forEach((sale) => {
        if (sale.paymentMethod === 'EFECTIVO') {
          cashSalesTotal += sale.total;
        } else if (sale.paymentMethod === 'MIXTO' && sale.payments) {
          try {
            const paymentsArray = sale.payments as any[];
            const cashPayment = paymentsArray.find((p) => p.method === 'EFECTIVO');
            if (cashPayment) {
              cashSalesTotal += cashPayment.amount || 0;
            }
          } catch (e) {
            console.error('Error parsing mixed payment JSON:', e);
          }
        }
      });
      const currentExpectedBalance = active.openingBalance + cashSalesTotal;
      const { sales, ...activeWithoutSales } = active;
      res.json({
        ...activeWithoutSales,
        currentExpectedBalance,
      });
    } else {
      res.json(null);
    }
  } catch (error) {
    console.error('Error en getActiveSession:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const openSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { branchId, openingBalance } = req.body;

    // IDOR Check
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || (user.role !== 'ADMIN' && user.branchId !== branchId)) {
      res.status(403).json({ error: 'No autorizado para abrir caja en esta sucursal' });
      return;
    }

    const existing = await prisma.cashSession.findFirst({
      where: { branchId, status: 'OPEN' },
    });
    if (existing) {
      res.status(400).json({ error: 'Ya existe una caja abierta para esta sucursal' });
      return;
    }

    const session = await prisma.cashSession.create({
      data: {
        branchId,
        openedById: req.userId!,
        openingBalance,
        status: 'OPEN',
      },
      include: {
        openedBy: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(201).json(session);
  } catch (error) {
    console.error('Error en openSession:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const closeSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sessionId, actualBalance, notes, cashCount } = req.body;

    const session = await prisma.cashSession.findUnique({
      where: { id: sessionId },
      include: { sales: true },
    });

    if (!session) {
      res.status(404).json({ error: 'Sesión de caja no encontrada' });
      return;
    }
    if (session.status === 'CLOSED') {
      res.status(400).json({ error: 'Esta caja ya está cerrada' });
      return;
    }

    // IDOR Check
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || (user.role !== 'ADMIN' && user.branchId !== session.branchId)) {
      res.status(403).json({ error: 'No autorizado para cerrar caja en esta sucursal' });
      return;
    }

    // Calcular el monto en efectivo esperado
    let cashSalesTotal = 0;
    session.sales.forEach((sale) => {
      if (sale.paymentMethod === 'EFECTIVO') {
        cashSalesTotal += sale.total;
      } else if (sale.paymentMethod === 'MIXTO' && sale.payments) {
        try {
          const paymentsArray = sale.payments as any[];
          const cashPayment = paymentsArray.find((p) => p.method === 'EFECTIVO');
          if (cashPayment) {
            cashSalesTotal += cashPayment.amount || 0;
          }
        } catch (e) {
          console.error('Error parsing mixed payment JSON:', e);
        }
      }
    });

    const expectedBalance = session.openingBalance + cashSalesTotal;

    const updated = await prisma.cashSession.update({
      where: { id: sessionId },
      data: {
        status: 'CLOSED',
        closedById: req.userId!,
        closedAt: new Date(),
        expectedBalance,
        actualBalance,
        cashCount,
        notes,
      },
      include: {
        openedBy: { select: { id: true, name: true } },
        closedBy: { select: { id: true, name: true } },
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Error en closeSession:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getHistoryByBranch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { branchId } = req.params;
    const bId = parseInt(branchId as string);

    // IDOR Check
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || (user.role !== 'ADMIN' && user.branchId !== bId)) {
      res.status(403).json({ error: 'No autorizado para acceder al historial de esta sucursal' });
      return;
    }

    const history = await prisma.cashSession.findMany({
      where: { branchId: bId },
      include: {
        openedBy: { select: { id: true, name: true } },
        closedBy: { select: { id: true, name: true } },
        _count: {
          select: { sales: true },
        },
      },
      orderBy: { openedAt: 'desc' },
    });
    res.json(history);
  } catch (error) {
    console.error('Error en getHistoryByBranch:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
