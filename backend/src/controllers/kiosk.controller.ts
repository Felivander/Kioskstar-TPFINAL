import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getAllKiosks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const kiosks = await prisma.kiosk.findMany({
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        branches: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(kiosks);
  } catch (error) {
    console.error('Error en getAllKiosks:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getKioskById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const kiosk = await prisma.kiosk.findUnique({
      where: { id: parseInt(id) },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        branches: true,
      },
    });

    if (!kiosk) {
      res.status(404).json({ error: 'Kiosco no encontrado' });
      return;
    }

    res.json(kiosk);
  } catch (error) {
    console.error('Error en getKioskById:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const createKiosk = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, address, city, postalCode, province, lat, lng } = req.body;

    // Restricción: 1 cuenta = 1 kiosco
    const existingKiosk = await prisma.kiosk.findFirst({ where: { ownerId: req.userId } });
    if (existingKiosk) {
      res.status(400).json({ error: 'Ya tenés un kiosco registrado. Solo podés agregar sucursales.' });
      return;
    }

    const kiosk = await prisma.kiosk.create({
      data: {
        name,
        address,
        city: city || '',
        postalCode: postalCode || '',
        province: province || '',
        lat,
        lng,
        ownerId: req.userId!,
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.status(201).json(kiosk);
  } catch (error) {
    console.error('Error en createKiosk:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const updateKiosk = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, address, city, postalCode, province, lat, lng } = req.body;

    const existingKiosk = await prisma.kiosk.findUnique({ where: { id: parseInt(id) } });
    if (!existingKiosk) {
      res.status(404).json({ error: 'Kiosco no encontrado' });
      return;
    }

    // Solo el dueño o admin puede editar
    if (existingKiosk.ownerId !== req.userId && req.userRole !== 'ADMIN') {
      res.status(403).json({ error: 'No tienes permisos para editar este kiosco' });
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (postalCode !== undefined) updateData.postalCode = postalCode;
    if (province !== undefined) updateData.province = province;
    if (lat !== undefined) updateData.lat = lat;
    if (lng !== undefined) updateData.lng = lng;

    const kiosk = await prisma.kiosk.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        branches: true,
      },
    });

    res.json(kiosk);
  } catch (error) {
    console.error('Error en updateKiosk:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const deleteKiosk = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existingKiosk = await prisma.kiosk.findUnique({ where: { id: parseInt(id) } });
    if (!existingKiosk) {
      res.status(404).json({ error: 'Kiosco no encontrado' });
      return;
    }

    if (existingKiosk.ownerId !== req.userId && req.userRole !== 'ADMIN') {
      res.status(403).json({ error: 'No tienes permisos para eliminar este kiosco' });
      return;
    }

    await prisma.kiosk.delete({ where: { id: parseInt(id) } });

    res.json({ message: 'Kiosco eliminado correctamente' });
  } catch (error) {
    console.error('Error en deleteKiosk:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ---- Branches ----

export const getBranches = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { kioskId } = req.params;

    const branches = await prisma.branch.findMany({
      where: { kioskId: parseInt(kioskId) },
      include: {
        kiosk: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(branches);
  } catch (error) {
    console.error('Error en getBranches:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const createBranch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { kioskId } = req.params;
    const { name, address, lat, lng } = req.body;

    // Verificar que el kiosco existe y pertenece al usuario
    const kiosk = await prisma.kiosk.findUnique({ where: { id: parseInt(kioskId) } });
    if (!kiosk) {
      res.status(404).json({ error: 'Kiosco no encontrado' });
      return;
    }

    if (kiosk.ownerId !== req.userId && req.userRole !== 'ADMIN') {
      res.status(403).json({ error: 'No tienes permisos para crear sucursales en este kiosco' });
      return;
    }

    const branch = await prisma.branch.create({
      data: {
        name,
        address,
        lat,
        lng,
        kioskId: parseInt(kioskId),
      },
    });

    res.status(201).json(branch);
  } catch (error) {
    console.error('Error en createBranch:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const updateBranch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, address, lat, lng } = req.body;

    const branch = await prisma.branch.update({
      where: { id: parseInt(id) },
      data: { name, address, lat, lng },
    });

    res.json(branch);
  } catch (error) {
    console.error('Error en updateBranch:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const deleteBranch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.branch.delete({ where: { id: parseInt(id) } });

    res.json({ message: 'Sucursal eliminada correctamente' });
  } catch (error) {
    console.error('Error en deleteBranch:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
