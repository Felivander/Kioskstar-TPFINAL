import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

// ---- Products ----

export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, categoryId } = req.query;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { barcode: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (categoryId) {
      where.categoryId = parseInt(categoryId as string);
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json(products);
  } catch (error) {
    console.error('Error en getAllProducts:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id as string) },
      include: { category: true },
    });

    if (!product) {
      res.status(404).json({ error: 'Producto no encontrado' });
      return;
    }

    res.json(product);
  } catch (error) {
    console.error('Error en getProductById:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, barcode, categoryId, imageUrl, description, price } = req.body;

    const product = await prisma.product.create({
      data: { name, barcode, categoryId, imageUrl, description, price },
      include: { category: true },
    });

    res.status(201).json(product);
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Ya existe un producto con ese código de barras' });
      return;
    }
    console.error('Error en createProduct:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    // HIGH-2: Desestructurar solo los campos permitidos (anti-mass-assignment)
    const { name, barcode, categoryId, imageUrl, description, price } = req.body;
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (barcode !== undefined) updateData.barcode = barcode;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;

    const product = await prisma.product.update({
      where: { id: parseInt(id as string, 10) },
      data: updateData,
      include: { category: true },
    });

    res.json(product);
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Producto no encontrado' });
      return;
    }
    console.error('Error en updateProduct:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.product.delete({ where: { id: parseInt(id as string) } });

    res.json({ message: 'Producto eliminado correctamente' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Producto no encontrado' });
      return;
    }
    console.error('Error en deleteProduct:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ---- Categories ----

export const getAllCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });

    res.json(categories);
  } catch (error) {
    console.error('Error en getAllCategories:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const createCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;

    const category = await prisma.category.create({
      data: { name, description },
    });

    res.status(201).json(category);
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Ya existe una categoría con ese nombre' });
      return;
    }
    console.error('Error en createCategory:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const updateCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    // HIGH-2: Desestructurar solo los campos permitidos (anti-mass-assignment)
    const { name, description } = req.body;
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    const category = await prisma.category.update({
      where: { id: parseInt(id as string, 10) },
      data: updateData,
    });

    res.json(category);
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Categoría no encontrada' });
      return;
    }
    console.error('Error en updateCategory:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.category.delete({ where: { id: parseInt(id as string) } });

    res.json({ message: 'Categoría eliminada correctamente' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Categoría no encontrada' });
      return;
    }
    console.error('Error en deleteCategory:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ---- Scan Product (IA placeholder) ----

export const scanProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // TODO: Integrar con Claude Vision o Google Vision API
    // Por ahora retorna un placeholder
    res.json({
      message: 'Funcionalidad de escaneo IA - pendiente de integración',
      suggestedProduct: {
        name: 'Producto detectado por IA',
        barcode: null,
        description: 'Descripción generada por IA',
        price: 0,
      },
    });
  } catch (error) {
    console.error('Error en scanProduct:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
