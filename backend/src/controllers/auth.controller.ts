import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { sendPasswordResetEmail } from '../services/email.service';
import { geocodeAddress } from '../services/maps.service';

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
        branchId: true,
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
        branchId: user.branchId,
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
        branchId: true,
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
    if (req.userId !== parseInt(id as string) && req.userRole !== 'ADMIN') {
      res.status(403).json({ error: 'No tienes permisos para editar este usuario' });
      return;
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    const user = await prisma.user.update({
      where: { id: parseInt(id as string) },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        onboarded: true,
        createdAt: true,
        branchId: true,
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
        select: { id: true, name: true, email: true, role: true, onboarded: true, createdAt: true, branchId: true },
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
    const { kioskName, kioskAddress, kioskCity, kioskPostalCode, kioskProvince, kioskLat, kioskLng, branches } = req.body;

    // Restricción: 1 cuenta = 1 kiosco
    const existingKiosk = await prisma.kiosk.findFirst({ where: { ownerId: req.userId } });
    if (existingKiosk) {
      res.status(400).json({ error: 'Ya tenés un kiosco registrado. Solo podés agregar sucursales.' });
      return;
    }

    // Geocodificación antes de la transacción para no bloquear la base de datos
    let finalKioskLat = kioskLat;
    let finalKioskLng = kioskLng;

    const isDefaultCoords = (l: number, g: number) => {
      if (!l || !g) return true;
      if (Math.abs(l - (-34.6037)) < 0.01 && Math.abs(g - (-58.3816)) < 0.01) return true;
      if (Math.abs(l - (-34.6)) < 0.05 && Math.abs(g - (-58.38)) < 0.05) return true;
      return false;
    };

    if (isDefaultCoords(finalKioskLat, finalKioskLng)) {
      const fullAddress = `${kioskAddress}, ${kioskCity || ''}, ${kioskProvince || ''}, Argentina`;
      const coords = await geocodeAddress(fullAddress);
      if (coords) {
        finalKioskLat = coords.lat;
        finalKioskLng = coords.lng;
      }
    }

    const resolvedBranches: Array<{ name: string; address: string; lat: number; lng: number }> = [];
    if (branches && branches.length > 0) {
      for (const branch of branches) {
        let branchLat = branch.lat;
        let branchLng = branch.lng;
        if (isDefaultCoords(branchLat, branchLng)) {
          const fullAddress = `${branch.address}, ${kioskCity || ''}, ${kioskProvince || ''}, Argentina`;
          const coords = await geocodeAddress(fullAddress);
          if (coords) {
            branchLat = coords.lat;
            branchLng = coords.lng;
          }
        }
        resolvedBranches.push({
          name: branch.name,
          address: branch.address,
          lat: branchLat,
          lng: branchLng,
        });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // Promover usuario a ADMIN
      const user = await tx.user.update({
        where: { id: req.userId },
        data: { role: 'ADMIN', onboarded: true },
        select: { id: true, name: true, email: true, role: true, onboarded: true, createdAt: true, branchId: true },
      });

      // Crear kiosco
      const kiosk = await tx.kiosk.create({
        data: {
          name: kioskName,
          address: kioskAddress,
          city: kioskCity || '',
          postalCode: kioskPostalCode || '',
          province: kioskProvince || '',
          lat: finalKioskLat,
          lng: finalKioskLng,
          ownerId: req.userId!,
        },
      });

      // Crear sucursal principal (misma dirección del kiosco)
      await tx.branch.create({
        data: {
          kioskId: kiosk.id,
          name: 'Sucursal Principal',
          address: kioskAddress,
          lat: finalKioskLat,
          lng: finalKioskLng,
        },
      });

      // Crear sucursales adicionales
      for (const branch of resolvedBranches) {
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
    const { branchId } = req.body;
    const kioskIdNum = parseInt(kioskId as string);

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

    // Verificar que la sucursal pertenece al kiosco
    if (!branchId) {
      res.status(400).json({ error: 'Debés seleccionar una sucursal' });
      return;
    }
    const branch = await prisma.branch.findFirst({
      where: { id: branchId, kioskId: kioskIdNum },
    });
    if (!branch) {
      res.status(404).json({ error: 'Sucursal no encontrada en este kiosco' });
      return;
    }

    // Generar código único de 8 caracteres
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();

    const inviteCode = await prisma.inviteCode.create({
      data: {
        code,
        kioskId: kioskIdNum,
        branchId: branch.id,
        createdBy: req.userId!,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
      },
    });

    res.status(201).json({
      code: inviteCode.code,
      expiresAt: inviteCode.expiresAt,
      kioskName: kiosk.name,
      branchName: branch.name,
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
      include: { kiosk: true, branch: true },
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

    // Promover usuario a EMPLEADO, asignar branch, y marcar código como usado
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: req.userId },
        data: {
          role: 'EMPLEADO',
          onboarded: true,
          branchId: inviteCode.branchId,
        },
        select: { id: true, name: true, email: true, role: true, onboarded: true, createdAt: true, branchId: true },
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
      branch: { id: inviteCode.branch.id, name: inviteCode.branch.name },
    });
  } catch (error) {
    console.error('Error en joinKiosk:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ---- Password Reset ----

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log(`⚠️ forgot-password: usuario no encontrado para ${email}`);
      res.status(404).json({ error: 'No existe una cuenta con ese email' });
      return;
    }

    await prisma.passwordReset.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = crypto.randomBytes(32).toString('hex');
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    console.log(`📧 Enviando email de reset a ${user.email}...`);
    try {
      await sendPasswordResetEmail(user.email, token, user.name);
      console.log('✅ Email enviado correctamente');
    } catch (emailError) {
      console.error('❌ Error enviando email:', emailError);
    }

    res.json({ message: 'Si el email está registrado, recibirás un enlace de recuperación' });
  } catch (error) {
    console.error('Error en forgotPassword:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;

    const resetRecord = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetRecord) {
      res.status(400).json({ error: 'Token inválido' });
      return;
    }

    if (resetRecord.usedAt) {
      res.status(400).json({ error: 'Este enlace ya fue utilizado' });
      return;
    }

    if (new Date() > resetRecord.expiresAt) {
      res.status(400).json({ error: 'Este enlace ha expirado' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: resetRecord.userId },
        data: { password: hashedPassword },
      });

      await tx.passwordReset.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      });
    });

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error en resetPassword:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ---- My Kiosk (para Admin) ----

export const getMyKiosk = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const kiosk = await prisma.kiosk.findFirst({
      where: { ownerId: req.userId },
      include: {
        branches: {
          orderBy: { createdAt: 'asc' },
        },
        inviteCodes: {
          where: {
            expiresAt: { gt: new Date() },
            usedBy: null,
          },
          include: {
            branch: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!kiosk) {
      res.status(404).json({ error: 'No tenés un kiosco registrado' });
      return;
    }

    res.json(kiosk);
  } catch (error) {
    console.error('Error en getMyKiosk:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ---- My Branch (para Empleado) ----

export const getMyBranch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { branchId: true },
    });

    if (!user?.branchId) {
      res.status(404).json({ error: 'No tenés una sucursal asignada' });
      return;
    }

    const branch = await prisma.branch.findUnique({
      where: { id: user.branchId },
      include: {
        kiosk: { select: { id: true, name: true } },
      },
    });

    res.json(branch);
  } catch (error) {
    console.error('Error en getMyBranch:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = parseInt(id as string);

    // Solo el propio usuario o un admin puede borrar la cuenta
    if (req.userId !== userId && req.userRole !== 'ADMIN') {
      res.status(403).json({ error: 'No tienes permisos para eliminar este usuario' });
      return;
    }

    // 1. Borrar invite codes creados por el usuario
    await prisma.inviteCode.deleteMany({
      where: { createdBy: userId }
    });

    // 2. Borrar solicitudes de restablecimiento de contraseña
    await prisma.passwordReset.deleteMany({
      where: { userId }
    });

    // 3. Borrar detalles de venta de las ventas realizadas por el usuario
    await prisma.saleItem.deleteMany({
      where: {
        sale: { userId }
      }
    });

    // 4. Borrar ventas realizadas por el usuario
    await prisma.sale.deleteMany({
      where: { userId }
    });

    // 5. Obtener kioscos del usuario para limpiar sus ventas asociadas y dependencias
    const userKiosks = await prisma.kiosk.findMany({
      where: { ownerId: userId },
      select: { id: true }
    });
    const kioskIds = userKiosks.map((k) => k.id);

    const userBranches = await prisma.branch.findMany({
      where: { kioskId: { in: kioskIds } },
      select: { id: true }
    });
    const branchIds = userBranches.map((b) => b.id);

    // Borrar items de venta y ventas asociadas a las sucursales del usuario
    await prisma.saleItem.deleteMany({
      where: {
        sale: { branchId: { in: branchIds } }
      }
    });
    await prisma.sale.deleteMany({
      where: { branchId: { in: branchIds } }
    });

    // 6. Desasociar empleados de las sucursales a borrar (poner branchId a null)
    await prisma.user.updateMany({
      where: { branchId: { in: branchIds } },
      data: { branchId: null }
    });

    // 7. Borrar stock de esas sucursales
    await prisma.stock.deleteMany({
      where: { branchId: { in: branchIds } }
    });

    // 8. Borrar las sucursales directamente
    await prisma.branch.deleteMany({
      where: { kioskId: { in: kioskIds } }
    });

    // 9. Borrar los kioscos
    await prisma.kiosk.deleteMany({
      where: { ownerId: userId }
    });

    // 10. Finalmente borrar el usuario
    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({ message: 'Cuenta eliminada exitosamente' });
  } catch (error) {
    console.error('Error en deleteUser:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
