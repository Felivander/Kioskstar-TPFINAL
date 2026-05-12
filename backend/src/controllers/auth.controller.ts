import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: 'El email ya está registrado' });
      return;
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario — siempre CLIENTE, sin onboarding completado
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'CLIENTE',
        onboarded: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        onboarded: true,
        createdAt: true,
      },
    });

    // Generar token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Buscar usuario
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    // Generar token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        onboarded: user.onboarded,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        onboarded: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Error en getMe:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;

    // Solo el propio usuario o un admin puede actualizar
    if (req.userId !== parseInt(id) && req.userRole !== 'ADMIN') {
      res.status(403).json({ error: 'No tienes permisos para editar este usuario' });
      return;
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        onboarded: true,
        createdAt: true,
      },
      data: updateData,
    });

    res.json(user);
  } catch (error) {
    console.error('Error en updateUser:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ---- Onboarding ----

export const onboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { choice } = req.body;

    // Verificar que no esté ya onboarded
    const existingUser = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!existingUser) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }
    if (existingUser.onboarded) {
      res.status(400).json({ error: 'El usuario ya completó el onboarding' });
      return;
    }

    if (choice === 'CLIENTE') {
      // Solo marcar como onboarded, sigue siendo CLIENTE
      const user = await prisma.user.update({
        where: { id: req.userId },
        data: { onboarded: true },
        select: { id: true, name: true, email: true, role: true, onboarded: true, createdAt: true },
      });

      // Regenerar token con rol actualizado
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET || 'default-secret',
        { expiresIn: '7d' }
      );

      res.json({ user, token });
      return;
    }

    // choice === 'KIOSK' — crear kiosco + sucursales + promover a ADMIN
    const { kioskName, kioskAddress, kioskLat, kioskLng, branches } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      // Promover usuario a ADMIN
      const user = await tx.user.update({
        where: { id: req.userId },
        data: { role: 'ADMIN', onboarded: true },
        select: { id: true, name: true, email: true, role: true, onboarded: true, createdAt: true },
      });

      // Crear kiosco
      const kiosk = await tx.kiosk.create({
        data: {
          name: kioskName,
          address: kioskAddress,
          lat: kioskLat,
          lng: kioskLng,
          ownerId: req.userId!,
        },
      });

      // Crear sucursal principal (misma dirección del kiosco)
      await tx.branch.create({
        data: {
          kioskId: kiosk.id,
          name: 'Sucursal Principal',
          address: kioskAddress,
          lat: kioskLat,
          lng: kioskLng,
        },
      });

      // Crear sucursales adicionales
      if (branches && branches.length > 0) {
        for (const branch of branches) {
          await tx.branch.create({
            data: {
              kioskId: kiosk.id,
              name: branch.name,
              address: branch.address,
              lat: branch.lat,
              lng: branch.lng,
            },
          });
        }
      }

      return { user, kiosk };
    });

    // Regenerar token con nuevo rol ADMIN
    const token = jwt.sign(
      { userId: result.user.id, role: result.user.role },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );

    res.json({ user: result.user, token, kiosk: result.kiosk });
  } catch (error) {
    console.error('Error en onboard:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ---- Invite Codes ----

export const generateInviteCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { kioskId } = req.params;
    const kioskIdNum = parseInt(kioskId);

    // Verificar que el kiosco pertenece al usuario
    const kiosk = await prisma.kiosk.findUnique({ where: { id: kioskIdNum } });
    if (!kiosk) {
      res.status(404).json({ error: 'Kiosco no encontrado' });
      return;
    }
    if (kiosk.ownerId !== req.userId && req.userRole !== 'ADMIN') {
      res.status(403).json({ error: 'No tienes permisos para este kiosco' });
      return;
    }

    // Generar código único de 8 caracteres
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();

    const inviteCode = await prisma.inviteCode.create({
      data: {
        code,
        kioskId: kioskIdNum,
        createdBy: req.userId!,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
      },
    });

    res.status(201).json({
      code: inviteCode.code,
      expiresAt: inviteCode.expiresAt,
      kioskName: kiosk.name,
    });
  } catch (error) {
    console.error('Error en generateInviteCode:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const joinKiosk = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code } = req.body;

    // Buscar código válido
    const inviteCode = await prisma.inviteCode.findUnique({
      where: { code },
      include: { kiosk: true },
    });

    if (!inviteCode) {
      res.status(404).json({ error: 'Código inválido' });
      return;
    }

    if (inviteCode.usedBy) {
      res.status(400).json({ error: 'Este código ya fue utilizado' });
      return;
    }

    if (new Date() > inviteCode.expiresAt) {
      res.status(400).json({ error: 'Este código ha expirado' });
      return;
    }

    // Promover usuario a EMPLEADO y marcar código como usado
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: req.userId },
        data: { role: 'EMPLEADO', onboarded: true },
        select: { id: true, name: true, email: true, role: true, onboarded: true, createdAt: true },
      });

      await tx.inviteCode.update({
        where: { id: inviteCode.id },
        data: { usedBy: req.userId, usedAt: new Date() },
      });

      return user;
    });

    // Regenerar token con nuevo rol
    const token = jwt.sign(
      { userId: result.id, role: result.role },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );

    res.json({
      user: result,
      token,
      kiosk: { id: inviteCode.kiosk.id, name: inviteCode.kiosk.name },
    });
  } catch (error) {
    console.error('Error en joinKiosk:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
