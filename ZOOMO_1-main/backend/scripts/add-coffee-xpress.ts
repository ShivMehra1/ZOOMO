import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const ownerPassword = await bcrypt.hash('owner123', 10);
  const owner = await prisma.user.upsert({
    where: { email: 'owner-coffeexpress@zoomoeats.com' },
    update: {},
    create: {
      email: 'owner-coffeexpress@zoomoeats.com',
      password: ownerPassword,
      name: 'Coffee Xpress Owner',
      role: UserRole.MERCHANT,
      phone: '+911234567896',
    },
  });

  const restaurant = await prisma.restaurant.upsert({
    where: { id: 'coffee-xpress' },
    update: {},
    create: {
      id: 'coffee-xpress',
      name: 'Coffee Xpress',
      address: 'Ward No 6, Jourian, Jammu 181202',
      cuisineType: 'Cafe',
      rating: 4.0,
      ownerId: owner.id,
      isApproved: true,
      isActive: true,
    },
  });

  console.log('Created:', restaurant.name, restaurant.id, '- no dishes yet, owner:', owner.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
