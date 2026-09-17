import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const ownerPassword = await bcrypt.hash('owner123', 10);
  const owner = await prisma.user.upsert({
    where: { email: 'owner-moonlight@zoomoeats.com' },
    update: {},
    create: {
      email: 'owner-moonlight@zoomoeats.com',
      password: ownerPassword,
      name: 'Moonlight Cafe Owner',
      role: UserRole.MERCHANT,
      phone: '+911234567895',
    },
  });

  const restaurant = await prisma.restaurant.upsert({
    where: { id: 'moonlight-cafe' },
    update: {},
    create: {
      id: 'moonlight-cafe',
      name: 'Moonlight Cafe',
      address: 'Jourian, Jammu 181202',
      cuisineType: 'Cafe',
      imageUrl: 'http://localhost:3000/static/moonlight.jpg',
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
