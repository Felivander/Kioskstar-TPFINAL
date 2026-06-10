import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getKiosksNearby = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lat, lng, radius } = req.query;
    const userLat = parseFloat(lat as string) || 0;
    const userLng = parseFloat(lng as string) || 0;
    const searchRadius = parseFloat(radius as string) || 10; // km

    const branches = await prisma.branch.findMany({
      include: {
        kiosk: { select: { id: true, name: true, address: true, imageUrl: true } },
      },
    });

    // Filtrar por distancia (fórmula Haversine simplificada)
    const nearby = branches.filter((b) => {
      const dLat = ((b.lat - userLat) * Math.PI) / 180;
      const dLng = ((b.lng - userLng) * Math.PI) / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos((userLat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = 6371 * c;
      return distance <= searchRadius;
    });

    res.json(nearby);
  } catch (error) {
    console.error('Error en getKiosksNearby:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const searchProductInMap = async (req: Request, res: Response): Promise<void> => {
  try {
    const { product, lat, lng } = req.query;
    const productName = (product as string) || '';
    const userLat = parseFloat(lat as string) || 0;
    const userLng = parseFloat(lng as string) || 0;

    const stockEntries = await prisma.stock.findMany({
      where: {
        quantity: { gt: 0 },
        product: { name: { contains: productName, mode: 'insensitive' } },
      },
      include: {
        product: true,
        branch: { include: { kiosk: { select: { id: true, name: true, imageUrl: true } } } },
      },
    });

    // Ordenar por distancia
    const results = stockEntries.map((s) => {
      const dLat = ((s.branch.lat - userLat) * Math.PI) / 180;
      const dLng = ((s.branch.lng - userLng) * Math.PI) / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos((userLat * Math.PI) / 180) * Math.cos((s.branch.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return { ...s, distance: 6371 * c };
    }).sort((a, b) => a.distance - b.distance);

    res.json(results);
  } catch (error) {
    console.error('Error en searchProductInMap:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
