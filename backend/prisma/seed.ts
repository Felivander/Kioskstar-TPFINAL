import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Concordia, Entre Ríos — coordenadas centro y calles reales
const CONCORDIA_CENTER = { lat: -31.3929, lng: -58.0207 };

// Calles reales de Concordia para generar direcciones
const calles = [
  'Av. San Martín', 'Urquiza', 'Pellegrini', 'Entre Ríos', 'Corrientes',
  'Mitre', 'Sarmiento', 'Belgrano', 'Rivadavia', '25 de Mayo',
  'La Rioja', 'Catamarca', 'Tucumán', 'Mendoza', 'San Luis',
  'Colón', 'Hipólito Yrigoyen', 'Buenos Aires', '9 de Julio', 'San Juan',
  'Alberdi', 'Bv. San Lorenzo', 'Laprida', 'Alsina', 'Alem',
  'Güemes', 'Moreno', 'Pueyrredón', 'Av. Monseñor Rösch', 'Espejo',
];

const nombresKioscos = [
  'Don', 'Doña', 'El', 'La', 'Los', 'Kiosco', 'Mini', 'Super',
];
const apellidos = [
  'Carlos', 'María', 'Pedro', 'Rosa', 'José', 'Ana', 'Luis', 'Marta',
  'Jorge', 'Silvia', 'Miguel', 'Laura', 'Roberto', 'Elena', 'Daniel',
  'Patricia', 'Oscar', 'Norma', 'Raúl', 'Graciela', 'Hugo', 'Susana',
  'Alfredo', 'Nora', 'Ricardo', 'Teresa', 'Mario', 'Cristina', 'Alberto', 'Claudia',
];
const sufijos = [
  '', ' Express', ' 24hs', ' Market', '', ' Central', '', ' Shop', '', ' Maxi',
];

// Nombres de sucursales
const nombresSucursales = [
  'Principal', 'Centro', 'Norte', 'Sur', 'Este', 'Oeste',
  'Costanera', 'Terminal', 'Hospital', 'Parque', 'Barrio Nuevo',
  'Villa Adela', 'La Bianca', 'Nebel', 'Villa Zorraquín',
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateKioskName(i: number): string {
  const prefix = randomItem(nombresKioscos);
  const name = randomItem(apellidos);
  const suffix = randomItem(sufijos);
  return `${prefix} ${name}${suffix}`.trim();
}

function generateAddress(): string {
  const calle = randomItem(calles);
  const numero = Math.floor(Math.random() * 2000) + 100;
  return `${calle} ${numero}`;
}

// Spread kiosks around Concordia (roughly 5km radius)
function randomConcordiaCoords(): { lat: number; lng: number } {
  const latOffset = (Math.random() - 0.5) * 0.06; // ~3.3km each direction
  const lngOffset = (Math.random() - 0.5) * 0.06;
  return {
    lat: CONCORDIA_CENTER.lat + latOffset,
    lng: CONCORDIA_CENTER.lng + lngOffset,
  };
}

async function main() {
  console.log('🌱 Seeding database — 100 kioscos en Concordia, Entre Ríos...');
  console.log('🗑️  Limpiando datos anteriores...');

  // Clean in correct order (foreign keys)
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.inviteCode.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.kiosk.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // ── Users ──
  const adminPassword = await bcrypt.hash('admin123', 10);
  const empleadoPassword = await bcrypt.hash('empleado123', 10);
  const clientePassword = await bcrypt.hash('cliente123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin KioskStar',
      email: 'admin@kioskstar.com',
      password: adminPassword,
      role: 'ADMIN',
      onboarded: true,
    },
  });

  const empleado = await prisma.user.create({
    data: {
      name: 'Juan Empleado',
      email: 'empleado@kioskstar.com',
      password: empleadoPassword,
      role: 'EMPLEADO',
      onboarded: true,
    },
  });

  await prisma.user.create({
    data: {
      name: 'María Cliente',
      email: 'cliente@kioskstar.com',
      password: clientePassword,
      role: 'CLIENTE',
      onboarded: true,
    },
  });

  // Also create a test user with known email
  await prisma.user.create({
    data: {
      name: 'Feli Test',
      email: 'feli.vander@gmail.com',
      password: await bcrypt.hash('test123', 10),
      role: 'ADMIN',
      onboarded: true,
    },
  });

  console.log('👤 4 usuarios creados');

  // ── Categories ──
  const cats = await Promise.all([
    prisma.category.create({ data: { name: 'Bebidas', description: 'Gaseosas, aguas, jugos, cervezas' } }),
    prisma.category.create({ data: { name: 'Snacks', description: 'Papas fritas, galletitas, nachos' } }),
    prisma.category.create({ data: { name: 'Golosinas', description: 'Chocolates, caramelos, chicles' } }),
    prisma.category.create({ data: { name: 'Cigarrillos', description: 'Cigarrillos y tabaco' } }),
    prisma.category.create({ data: { name: 'Lácteos', description: 'Leche, yogur, queso' } }),
    prisma.category.create({ data: { name: 'Fiambrería', description: 'Jamón, queso, salame' } }),
    prisma.category.create({ data: { name: 'Limpieza', description: 'Jabón, detergente, lavandina' } }),
    prisma.category.create({ data: { name: 'Panadería', description: 'Pan, facturas, tortas' } }),
    prisma.category.create({ data: { name: 'Helados', description: 'Helados y paletas' } }),
    prisma.category.create({ data: { name: 'Varios', description: 'Pilas, encendedores, cargadores' } }),
  ]);
  console.log(`📂 ${cats.length} categorías creadas`);

  // ── Products (50 productos) ──
  const productData = [
    // Bebidas (0)
    { name: 'Coca-Cola 500ml', barcode: '7790895000058', catIdx: 0, price: 1500 },
    { name: 'Coca-Cola 1.5L', barcode: '7790895001150', catIdx: 0, price: 2800 },
    { name: 'Sprite 500ml', barcode: '7790895001505', catIdx: 0, price: 1400 },
    { name: 'Fanta Naranja 500ml', barcode: '7790895002500', catIdx: 0, price: 1400 },
    { name: 'Agua Mineral 500ml', barcode: '7790895006001', catIdx: 0, price: 800 },
    { name: 'Agua Saborizada Levité', barcode: '7790895007001', catIdx: 0, price: 1200 },
    { name: 'Cerveza Quilmes 473ml', barcode: '7791813420101', catIdx: 0, price: 2000 },
    { name: 'Cerveza Brahma 473ml', barcode: '7891149101009', catIdx: 0, price: 1800 },
    { name: 'Powerade 500ml', barcode: '7790895003500', catIdx: 0, price: 1600 },
    { name: 'Speed Max 250ml', barcode: '7798068380010', catIdx: 0, price: 2500 },
    // Snacks (1)
    { name: 'Papas Lays Clásicas', barcode: '7790310981603', catIdx: 1, price: 2200 },
    { name: 'Papas Lays Cheddar', barcode: '7790310981604', catIdx: 1, price: 2200 },
    { name: 'Doritos Queso', barcode: '7790310990001', catIdx: 1, price: 2500 },
    { name: 'Cheetos', barcode: '7790310991001', catIdx: 1, price: 1900 },
    { name: 'Oreo Original', barcode: '7622300489434', catIdx: 1, price: 1800 },
    { name: 'Toddy Rellenas', barcode: '7790040001001', catIdx: 1, price: 1600 },
    { name: 'Galletitas Traviata', barcode: '7790040002001', catIdx: 1, price: 900 },
    { name: 'Galletitas Criollitas', barcode: '7790040003001', catIdx: 1, price: 850 },
    // Golosinas (2)
    { name: 'Milka Almendras 150g', barcode: '7622300512156', catIdx: 2, price: 3500 },
    { name: 'Bon o Bon', barcode: '7790580001001', catIdx: 2, price: 400 },
    { name: 'Sugus Frutales', barcode: '7790903001001', catIdx: 2, price: 500 },
    { name: 'Chicles Beldent', barcode: '7790580010001', catIdx: 2, price: 600 },
    { name: 'Alfajor Havanna', barcode: '7790580020001', catIdx: 2, price: 2800 },
    { name: 'Alfajor Cachafaz', barcode: '7790580030001', catIdx: 2, price: 2200 },
    { name: 'Alfajor Jorgito', barcode: '7790580040001', catIdx: 2, price: 1200 },
    { name: 'Turron Arcor', barcode: '7790580050001', catIdx: 2, price: 800 },
    // Cigarrillos (3)
    { name: 'Marlboro Box 20', barcode: '7791813100101', catIdx: 3, price: 4500 },
    { name: 'Camel Box 20', barcode: '7791813200101', catIdx: 3, price: 4200 },
    { name: 'Lucky Strike 20', barcode: '7791813300101', catIdx: 3, price: 3800 },
    // Lácteos (4)
    { name: 'Yogur La Serenísima', barcode: '7791337000011', catIdx: 4, price: 1200 },
    { name: 'Leche Entera 1L', barcode: '7791337000021', catIdx: 4, price: 1500 },
    { name: 'Queso Cremoso 500g', barcode: '7791337000031', catIdx: 4, price: 3200 },
    { name: 'Dulce de Leche 400g', barcode: '7791337000041', catIdx: 4, price: 2800 },
    // Fiambrería (5)
    { name: 'Jamón Cocido 200g', barcode: '7791100001001', catIdx: 5, price: 2500 },
    { name: 'Salame 200g', barcode: '7791100002001', catIdx: 5, price: 3000 },
    { name: 'Queso Tybo 200g', barcode: '7791100003001', catIdx: 5, price: 2800 },
    // Limpieza (6)
    { name: 'Detergente Magistral', barcode: '7791200001001', catIdx: 6, price: 2200 },
    { name: 'Lavandina Ayudín 1L', barcode: '7791200002001', catIdx: 6, price: 1500 },
    { name: 'Jabón Skip Líquido', barcode: '7791200003001', catIdx: 6, price: 4500 },
    // Panadería (7)
    { name: 'Pan Lactal Bimbo', barcode: '7791300001001', catIdx: 7, price: 2200 },
    { name: 'Medialunas x6', barcode: '7791300002001', catIdx: 7, price: 1800 },
    { name: 'Bizcochos Canale', barcode: '7791300003001', catIdx: 7, price: 1600 },
    // Helados (8)
    { name: 'Helado Frigor Paleta', barcode: '7791400001001', catIdx: 8, price: 1800 },
    { name: 'Helado Häagen-Dazs 100ml', barcode: '7791400002001', catIdx: 8, price: 4500 },
    { name: 'Helado Popsicle', barcode: '7791400003001', catIdx: 8, price: 1200 },
    // Varios (9)
    { name: 'Pilas Duracell AA x2', barcode: '7791500001001', catIdx: 9, price: 2800 },
    { name: 'Encendedor BIC', barcode: '7791500002001', catIdx: 9, price: 1000 },
    { name: 'Cargador USB-C', barcode: '7791500003001', catIdx: 9, price: 8500 },
    { name: 'Auriculares In-Ear', barcode: '7791500004001', catIdx: 9, price: 5500 },
    { name: 'Preservativos Prime x3', barcode: '7791500005001', catIdx: 9, price: 3200 },
  ];

  const products = await Promise.all(
    productData.map((p) =>
      prisma.product.create({
        data: {
          name: p.name,
          barcode: p.barcode,
          categoryId: cats[p.catIdx].id,
          price: p.price,
          description: p.name,
        },
      })
    )
  );
  console.log(`📦 ${products.length} productos creados`);

  // ── 100 Kioscos en Concordia ──
  const usedNames = new Set<string>();
  const allBranches: { id: number; kioskId: number }[] = [];

  for (let i = 0; i < 100; i++) {
    // Generate unique name
    let name = '';
    do {
      name = generateKioskName(i);
    } while (usedNames.has(name));
    usedNames.add(name);

    const coords = randomConcordiaCoords();
    const address = generateAddress();

    const kiosk = await prisma.kiosk.create({
      data: {
        name,
        ownerId: admin.id,
        address,
        city: 'Concordia',
        postalCode: '3200',
        province: 'Entre Ríos',
        lat: coords.lat,
        lng: coords.lng,
      },
    });

    // 1-3 sucursales por kiosco
    const numBranches = Math.random() < 0.6 ? 1 : Math.random() < 0.7 ? 2 : 3;

    for (let j = 0; j < numBranches; j++) {
      const branchCoords = j === 0 ? coords : randomConcordiaCoords();
      const branchName = j === 0 ? 'Sucursal Principal' : `Sucursal ${randomItem(nombresSucursales)}`;

      const branch = await prisma.branch.create({
        data: {
          kioskId: kiosk.id,
          name: branchName,
          address: j === 0 ? address : generateAddress(),
          lat: branchCoords.lat,
          lng: branchCoords.lng,
        },
      });
      allBranches.push({ id: branch.id, kioskId: kiosk.id });
    }

    if ((i + 1) % 20 === 0) console.log(`   🏪 ${i + 1}/100 kioscos...`);
  }

  console.log(`🏪 100 kioscos creados con ${allBranches.length} sucursales`);

  // Assign empleado to first branch
  await prisma.user.update({
    where: { id: empleado.id },
    data: { branchId: allBranches[0].id },
  });

  // ── Stock: each branch gets 10-30 random products ──
  console.log('📊 Cargando stock...');
  let stockCount = 0;
  for (const branch of allBranches) {
    const numProducts = Math.floor(Math.random() * 21) + 10; // 10-30
    const shuffled = [...products].sort(() => Math.random() - 0.5).slice(0, numProducts);

    for (const product of shuffled) {
      await prisma.stock.create({
        data: {
          branchId: branch.id,
          productId: product.id,
          quantity: Math.floor(Math.random() * 80) + 5,
        },
      });
      stockCount++;
    }
  }
  console.log(`📊 ${stockCount} registros de stock creados`);

  // ── Sales: generate some sample sales for trending ──
  console.log('💰 Generando ventas de ejemplo...');
  let saleCount = 0;
  const paymentMethods = ['EFECTIVO', 'DEBITO', 'CREDITO', 'MERCADOPAGO'] as const;

  // Generate sales for the first 20 branches (random dates in last 30 days)
  for (let bi = 0; bi < Math.min(20, allBranches.length); bi++) {
    const branch = allBranches[bi];
    const branchStock = await prisma.stock.findMany({
      where: { branchId: branch.id, quantity: { gt: 0 } },
      include: { product: true },
    });

    if (branchStock.length === 0) continue;

    // 5-20 sales per branch
    const numSales = Math.floor(Math.random() * 16) + 5;
    for (let s = 0; s < numSales; s++) {
      // Random date in last 30 days
      const daysAgo = Math.floor(Math.random() * 30);
      const saleDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

      // 1-4 items per sale
      const numItems = Math.floor(Math.random() * 4) + 1;
      const saleItems = [...branchStock]
        .sort(() => Math.random() - 0.5)
        .slice(0, numItems)
        .map((si) => ({
          productId: si.productId,
          quantity: Math.floor(Math.random() * 3) + 1,
          unitPrice: si.product.price,
        }));

      const total = saleItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);

      await prisma.sale.create({
        data: {
          branchId: branch.id,
          userId: admin.id,
          total,
          paymentMethod: randomItem(paymentMethods),
          createdAt: saleDate,
          items: { create: saleItems },
        },
      });
      saleCount++;
    }
  }
  console.log(`💰 ${saleCount} ventas creadas`);

  console.log('\n✅ Seed completado!');
  console.log('   👤 4 usuarios (admin/empleado/cliente + feli.vander@gmail.com)');
  console.log(`   📂 ${cats.length} categorías`);
  console.log(`   📦 ${products.length} productos`);
  console.log(`   🏪 100 kioscos en Concordia, Entre Ríos`);
  console.log(`   📍 ${allBranches.length} sucursales`);
  console.log(`   📊 ${stockCount} registros de stock`);
  console.log(`   💰 ${saleCount} ventas con items`);
  console.log('\n   Login: admin@kioskstar.com / admin123');
  console.log('   Login: empleado@kioskstar.com / empleado123');
  console.log('   Login: feli.vander@gmail.com / test123');
}

main()
  .catch((e) => {
    console.error('Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
