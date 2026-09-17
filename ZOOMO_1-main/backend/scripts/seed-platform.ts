/**
 * Non-destructive. Restores the staff + customer accounts wiped on 2026-09-17
 * and seeds platform promo codes into Postgres (the source of truth — not the
 * hardcoded maps in promo-codes.ts / zoomo-data.ts).
 *
 * Does NOT touch restaurants, dishes, or existing orders.
 *
 *   cd backend && npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-platform.ts
 */
import { PrismaClient, UserRole } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const JOURIAN = {
  street: "Ward No 6",
  city: "Jourian",
  state: "Jammu & Kashmir",
  zipCode: "181202",
  country: "India",
  lat: 32.834,
  lng: 74.577,
};

async function upsertUser(email: string, data: {
  password: string;
  name: string;
  role: UserRole;
  phone: string;
}) {
  return prisma.user.upsert({
    where: { email },
    update: { name: data.name, role: data.role, phone: data.phone },
    create: { email, ...data },
  });
}

async function main() {
  const adminPass = await bcrypt.hash("admin123", 10);
  const driverPass = await bcrypt.hash("driver123", 10);
  const customerPass = await bcrypt.hash("customer123", 10);

  const admin = await upsertUser("admin@zoomoeats.com", {
    password: adminPass,
    name: "Zoomo Admin",
    role: UserRole.ADMIN,
    phone: "+919876540001",
  });

  const driverUser = await upsertUser("driver@zoomoeats.com", {
    password: driverPass,
    name: "Ravi Rider",
    role: UserRole.DRIVER,
    phone: "+919876540002",
  });
  await prisma.driver.upsert({
    where: { userId: driverUser.id },
    update: { isAvailable: true, currentLat: JOURIAN.lat, currentLng: JOURIAN.lng },
    create: {
      userId: driverUser.id,
      isAvailable: true,
      currentLat: JOURIAN.lat,
      currentLng: JOURIAN.lng,
      vehicleType: "Bike",
      vehiclePlate: "JK02Z 4421",
    },
  });

  const customer = await upsertUser("customer@zoomoeats.com", {
    password: customerPass,
    name: "Aman Jourian",
    role: UserRole.USER,
    phone: "+919876540003",
  });
  const existingAddr = await prisma.address.findFirst({
    where: { userId: customer.id, isDefault: true },
  });
  if (!existingAddr) {
    await prisma.address.create({
      data: {
        ...JOURIAN,
        isDefault: true,
        userId: customer.id,
      },
    });
  }

  const platformPromos = [
    {
      code: "ZOOMO50",
      description: "50% off your first bag",
      discountType: "PERCENT",
      value: 50,
      maxDiscount: 120,
      minOrderValue: null as number | null,
    },
    {
      code: "FREESHIP",
      description: "Ride on us — delivery fee waived",
      discountType: "FREE_DELIVERY",
      value: 0,
      maxDiscount: null,
      minOrderValue: null,
    },
    {
      code: "NEWUSER",
      description: "₹80 off your first order",
      discountType: "FLAT",
      value: 80,
      maxDiscount: null,
      minOrderValue: null,
    },
  ];

  for (const p of platformPromos) {
    const existing = await prisma.promotion.findFirst({
      where: { code: p.code, restaurantId: null },
    });
    if (existing) {
      await prisma.promotion.update({
        where: { id: existing.id },
        data: {
          description: p.description,
          discountType: p.discountType,
          value: p.value,
          maxDiscount: p.maxDiscount,
          isActive: true,
        },
      });
    } else {
      await prisma.promotion.create({
        data: { ...p, restaurantId: null, isActive: true },
      });
    }
  }

  const pizza = await prisma.restaurant.findUnique({ where: { id: "pizza-palace" } });
  if (pizza) {
    await prisma.promotion.upsert({
      where: { restaurantId_code: { restaurantId: pizza.id, code: "BOGO" } },
      update: {
        description: "₹80 off any pizza order",
        discountType: "FLAT",
        value: 80,
        isActive: true,
      },
      create: {
        restaurantId: pizza.id,
        code: "BOGO",
        description: "₹80 off any pizza order",
        discountType: "FLAT",
        value: 80,
        isActive: true,
      },
    });
  }

  console.log("Staff restored:");
  console.log("  Admin    admin@zoomoeats.com / admin123");
  console.log("  Driver   driver@zoomoeats.com / driver123");
  console.log("  Customer customer@zoomoeats.com / customer123");
  console.log("Promos in Postgres: ZOOMO50, FREESHIP, NEWUSER" + (pizza ? ", BOGO (I Love Pizza)" : ""));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
