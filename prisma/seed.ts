import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import bcrypt from 'bcryptjs';

const url = process.env.DATABASE_URL ?? 'file:./prisma/dev.db';
const adapter = new PrismaLibSql({ url });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // ── Admin User ─────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin@1234', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@landbd.com' },
    update: {},
    create: {
      email: 'admin@landbd.com',
      password: adminHash,
      name: 'LandBD Admin',
      role: 'Admin',
      isVerified: true,
    },
  });
  console.log(`✅ Admin user: ${admin.email}`);

  // ── Basic User ─────────────────────────────────────────────────────────────
  const userHash = await bcrypt.hash('User@1234', 12);
  const basicUser = await prisma.user.upsert({
    where: { email: 'user@landbd.com' },
    update: {},
    create: {
      email: 'user@landbd.com',
      password: userHash,
      name: 'Test User',
      role: 'Basic User',
      isVerified: true,
    },
  });
  console.log(`✅ Basic user: ${basicUser.email}`);

  // ── Rajuk Plots ────────────────────────────────────────────────────────────
  await prisma.rajukPlot.upsert({
    where: { id: 'seed-plot-101' },
    update: {},
    create: {
      id: 'seed-plot-101',
      plotNo: '101',
      mouza: 'Gulshan',
      ownerName: 'Demo Owner',
      khatiyanNo: 'KH-101',
      landType: 'Residential',
      area: 5.0,
    },
  });

  await prisma.rajukPlot.upsert({
    where: { id: 'seed-plot-202' },
    update: {},
    create: {
      id: 'seed-plot-202',
      plotNo: '202',
      mouza: 'Banani',
      ownerName: 'Sample Corp',
      khatiyanNo: 'KH-202',
      landType: 'Commercial',
      area: 12.5,
    },
  });
  console.log('✅ Plots seeded');

  // ── Notifications ──────────────────────────────────────────────────────────
  await prisma.notification.upsert({
    where: { id: 'seed-notif-admin' },
    update: {},
    create: {
      id: 'seed-notif-admin',
      userId: admin.id,
      title: 'স্বাগতম!',
      message: 'LandBD অ্যাডমিন প্যানেলে আপনাকে স্বাগতম।',
      type: 'SUCCESS',
    },
  });

  await prisma.notification.upsert({
    where: { id: 'seed-notif-user' },
    update: {},
    create: {
      id: 'seed-notif-user',
      userId: basicUser.id,
      title: 'স্বাগতম!',
      message: 'LandBD-তে আপনাকে স্বাগতম। আপনার জমির তথ্য অনুসন্ধান শুরু করুন।',
      type: 'INFO',
    },
  });
  console.log('✅ Notifications seeded');

  console.log('\n🎉 Seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
