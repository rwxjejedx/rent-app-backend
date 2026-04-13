import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/index.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  const hashedPassword = await bcrypt.hash('123456', 10);

  const tenant = await prisma.user.upsert({
    where: { email: 'tenant@test.com' },
    update: {},
    create: {
      email: 'tenant@test.com',
      password: hashedPassword,
      name: 'Pak Budi',
      role: 'TENANT',
      isVerified: true,
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@test.com' },
    update: {},
    create: {
      email: 'user@test.com',
      password: hashedPassword,
      name: 'Andi',
      role: 'USER',
      isVerified: true,
    },
  });

  console.log(`✅ Users created: ${tenant.email}, ${user.email}`);

  const villaCategory = await prisma.category.upsert({
    where: { name_tenantId: { name: 'Villa', tenantId: tenant.id } },
    update: {},
    create: { name: 'Villa', tenantId: tenant.id },
  });

  const hotelCategory = await prisma.category.upsert({
    where: { name_tenantId: { name: 'Hotel', tenantId: tenant.id } },
    update: {},
    create: { name: 'Hotel', tenantId: tenant.id },
  });

  const kosCategory = await prisma.category.upsert({
    where: { name_tenantId: { name: 'Kos', tenantId: tenant.id } },
    update: {},
    create: { name: 'Kos', tenantId: tenant.id },
  });

  console.log(`✅ Categories created: Villa, Hotel, Kos`);

  const property1 = await prisma.property.create({
    data: {
      name: 'Villa Bukit Indah',
      description: 'Villa mewah dengan pemandangan gunung yang indah, cocok untuk keluarga',
      location: 'Jl. Bukit Raya No. 12',
      city: 'Bandung',
      categoryId: villaCategory.id,
      ownerId: tenant.id,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800' },
          { url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800' },
        ],
      },
    },
  });

  const property2 = await prisma.property.create({
    data: {
      name: 'Hotel Santika Bandung',
      description: 'Hotel bintang 4 di pusat kota Bandung dengan fasilitas lengkap',
      location: 'Jl. Sumatra No. 52',
      city: 'Bandung',
      categoryId: hotelCategory.id,
      ownerId: tenant.id,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800' },
        ],
      },
    },
  });

  const property3 = await prisma.property.create({
    data: {
      name: 'Kos Melati Jogja',
      description: 'Kos nyaman dekat kampus UGM, fasilitas lengkap',
      location: 'Jl. Kaliurang KM 5',
      city: 'Yogyakarta',
      categoryId: kosCategory.id,
      ownerId: tenant.id,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800' },
        ],
      },
    },
  });

  console.log(`✅ Properties created`);

  const deluxeRoom = await prisma.roomType.create({
    data: {
      name: 'Deluxe Room',
      description: 'Kamar deluxe dengan view gunung dan fasilitas premium',
      basePrice: 750000,
      capacity: 2,
      propertyId: property1.id,
      images: {
        create: [{ url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800' }],
      },
      rooms: {
        create: [{ number: '101' }, { number: '102' }, { number: '103' }],
      },
    },
  });

  const suiteRoom = await prisma.roomType.create({
    data: {
      name: 'Suite Room',
      description: 'Kamar suite mewah dengan private pool dan butler service',
      basePrice: 1500000,
      capacity: 4,
      propertyId: property1.id,
      images: {
        create: [{ url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800' }],
      },
      rooms: {
        create: [{ number: '201' }, { number: '202' }],
      },
    },
  });

  await prisma.roomType.create({
    data: {
      name: 'Standard Room',
      description: 'Kamar standard dengan fasilitas lengkap',
      basePrice: 450000,
      capacity: 2,
      propertyId: property2.id,
      rooms: {
        create: [{ number: '101' }, { number: '102' }, { number: '103' }, { number: '104' }],
      },
    },
  });

  await prisma.roomType.create({
    data: {
      name: 'Kamar Reguler',
      description: 'Kamar kos dengan AC, WiFi, dan kamar mandi dalam',
      basePrice: 1200000,
      capacity: 1,
      propertyId: property3.id,
      rooms: {
        create: [{ number: 'A1' }, { number: 'A2' }, { number: 'A3' }],
      },
    },
  });

  console.log(`✅ Room types created`);

  await prisma.peakRate.create({
    data: {
      startDate: new Date('2026-04-18'),
      endDate: new Date('2026-04-20'),
      rateType: 'PERCENTAGE',
      rateValue: 20,
      roomTypeId: deluxeRoom.id,
    },
  });

  await prisma.peakRate.create({
    data: {
      startDate: new Date('2026-12-24'),
      endDate: new Date('2026-12-26'),
      rateType: 'NOMINAL',
      rateValue: 300000,
      roomTypeId: suiteRoom.id,
    },
  });

  console.log(`✅ Peak rates created`);
  console.log('\n🎉 Seeding complete!');
  console.log('\n📋 Test accounts:');
  console.log('   Tenant: tenant@test.com / 123456');
  console.log('   User:   user@test.com / 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });