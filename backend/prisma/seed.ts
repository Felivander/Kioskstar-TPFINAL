import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Crear usuarios
  const adminPassword = await bcrypt.hash('admin123', 10);
  const empleadoPassword = await bcrypt.hash('empleado123', 10);
  const clientePassword = await bcrypt.hash('cliente123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@kioskstar.com' },
    update: {},
    create: {
      name: 'Admin KioskStar',
      email: 'admin@kioskstar.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const empleado = await prisma.user.upsert({
    where: { email: 'empleado@kioskstar.com' },
    update: {},
    create: {
      name: 'Juan Empleado',
      email: 'empleado@kioskstar.com',
      password: empleadoPassword,
      role: 'EMPLEADO',
    },
  });

  const cliente = await prisma.user.upsert({
    where: { email: 'cliente@kioskstar.com' },
    update: {},
    create: {
      name: 'María Cliente',
      email: 'cliente@kioskstar.com',
      password: clientePassword,
      role: 'CLIENTE',
    },
  });

  // Crear categorías
  const categorias = await Promise.all([
    prisma.category.upsert({ where: { name: 'Bebidas' }, update: {}, create: { name: 'Bebidas', description: 'Gaseosas, aguas, jugos' } }),
    prisma.category.upsert({ where: { name: 'Snacks' }, update: {}, create: { name: 'Snacks', description: 'Galletitas, papas fritas, chocolates' } }),
    prisma.category.upsert({ where: { name: 'Golosinas' }, update: {}, create: { name: 'Golosinas', description: 'Caramelos, chicles, chupetines' } }),
    prisma.category.upsert({ where: { name: 'Cigarrillos' }, update: {}, create: { name: 'Cigarrillos', description: 'Cigarrillos y tabaco' } }),
    prisma.category.upsert({ where: { name: 'Lácteos' }, update: {}, create: { name: 'Lácteos', description: 'Leche, yogur, queso' } }),
    prisma.category.upsert({ where: { name: 'Fiambrería' }, update: {}, create: { name: 'Fiambrería', description: 'Jamón, queso, salame' } }),
  ]);

  // Crear kiosco
  const kiosko = await prisma.kiosk.create({
    data: {
      name: 'Kiosco Don Carlos',
      ownerId: admin.id,
      address: 'Av. Corrientes 1234, CABA',
      lat: -34.6037,
      lng: -58.3816,
    },
  });

  // Crear sucursales
  const sucursal1 = await prisma.branch.create({
    data: {
      kioskId: kiosko.id,
      name: 'Sucursal Centro',
      address: 'Av. Corrientes 1234, CABA',
      lat: -34.6037,
      lng: -58.3816,
    },
  });

  const sucursal2 = await prisma.branch.create({
    data: {
      kioskId: kiosko.id,
      name: 'Sucursal Palermo',
      address: 'Av. Santa Fe 4500, CABA',
      lat: -34.5875,
      lng: -58.4266,
    },
  });

  // Crear productos
  const productos = await Promise.all([
    prisma.product.create({ data: { name: 'Coca-Cola 500ml', barcode: '7790895000058', categoryId: categorias[0].id, price: 1500, description: 'Gaseosa cola 500ml' } }),
    prisma.product.create({ data: { name: 'Sprite 500ml', barcode: '7790895001505', categoryId: categorias[0].id, price: 1400, description: 'Gaseosa lima-limón 500ml' } }),
    prisma.product.create({ data: { name: 'Agua Mineral 500ml', barcode: '7790895006001', categoryId: categorias[0].id, price: 800, description: 'Agua mineral sin gas' } }),
    prisma.product.create({ data: { name: 'Papas Lays Clásicas', barcode: '7790310981603', categoryId: categorias[1].id, price: 2200, description: 'Papas fritas sabor clásico' } }),
    prisma.product.create({ data: { name: 'Oreo Original', barcode: '7622300489434', categoryId: categorias[1].id, price: 1800, description: 'Galletitas Oreo rellenas' } }),
    prisma.product.create({ data: { name: 'Milka Almendras', barcode: '7622300512156', categoryId: categorias[2].id, price: 3500, description: 'Chocolate con almendras 150g' } }),
    prisma.product.create({ data: { name: 'Sugus Frutales', barcode: '77909030', categoryId: categorias[2].id, price: 500, description: 'Caramelos masticables frutales' } }),
    prisma.product.create({ data: { name: 'Yogur La Serenísima', barcode: '7791337000011', categoryId: categorias[4].id, price: 1200, description: 'Yogur bebible sabor frutilla' } }),
  ]);

  // Crear stock en sucursales
  for (const producto of productos) {
    await prisma.stock.create({
      data: {
        branchId: sucursal1.id,
        productId: producto.id,
        quantity: Math.floor(Math.random() * 50) + 10,
      },
    });
    await prisma.stock.create({
      data: {
        branchId: sucursal2.id,
        productId: producto.id,
        quantity: Math.floor(Math.random() * 30) + 5,
      },
    });
  }

  console.log('✅ Seed completado');
  console.log(`   - ${3} usuarios creados`);
  console.log(`   - ${categorias.length} categorías creadas`);
  console.log(`   - 1 kiosco con 2 sucursales creado`);
  console.log(`   - ${productos.length} productos creados`);
  console.log(`   - Stock cargado en ambas sucursales`);
}

main()
  .catch((e) => {
    console.error('Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
