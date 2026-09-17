import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

type Item = {
  name: string;
  category: string;
  price?: number;
  sizes?: { label: string; price: number }[];
  photo: string;
};

const PHOTO = {
  mocktail: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=1200&q=80",
  shake: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=1200&q=80",
  iceTea: "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?auto=format&fit=crop&w=1200&q=80",
  frappe: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=1200&q=80",
  coffee: "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=1200&q=80",
  tea: "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?auto=format&fit=crop&w=1200&q=80",
  pizza: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1200&q=80",
  burger: "https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=1200&q=80",
  sandwich: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1200&q=80",
  pasta: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=1200&q=80",
  wrap: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=1200&q=80",
  fries: "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=1200&q=80",
};

const MENU: Item[] = [
  // MOCKTAILS
  { name: "Mojito (Mint)", category: "Mocktails", price: 80, photo: PHOTO.mocktail },
  { name: "Watermelon Mocktail", category: "Mocktails", price: 80, photo: PHOTO.mocktail },
  { name: "Blueberry Mocktail", category: "Mocktails", price: 80, photo: PHOTO.mocktail },
  { name: "Green Apple Mocktail", category: "Mocktails", price: 80, photo: PHOTO.mocktail },
  // SHAKES
  { name: "Strawberry Shake", category: "Shakes", price: 70, photo: PHOTO.shake },
  { name: "Butter Scotch Shake", category: "Shakes", price: 70, photo: PHOTO.shake },
  { name: "Chocolate Shake", category: "Shakes", price: 70, photo: PHOTO.shake },
  { name: "Blueberry Shake", category: "Shakes", price: 70, photo: PHOTO.shake },
  { name: "Oreo Shake", category: "Shakes", price: 90, photo: PHOTO.shake },
  { name: "KitKat Shake", category: "Shakes", price: 90, photo: PHOTO.shake },
  // ICE TEA (Regular/Large sizing; plain + 3 flavours)
  { name: "Ice Tea", category: "Ice Tea", sizes: [{ label: "Regular", price: 25 }, { label: "Large", price: 40 }], photo: PHOTO.iceTea },
  { name: "Passion Fruit Ice Tea", category: "Ice Tea", sizes: [{ label: "Regular", price: 40 }, { label: "Large", price: 60 }], photo: PHOTO.iceTea },
  { name: "Strawberry Ice Tea", category: "Ice Tea", sizes: [{ label: "Regular", price: 40 }, { label: "Large", price: 60 }], photo: PHOTO.iceTea },
  { name: "Blueberry Ice Tea", category: "Ice Tea", sizes: [{ label: "Regular", price: 40 }, { label: "Large", price: 60 }], photo: PHOTO.iceTea },
  // FRAPPE (Regular/Large sizing; plain + 3 flavours)
  { name: "Frappe", category: "Frappe", sizes: [{ label: "Regular", price: 40 }, { label: "Large", price: 90 }], photo: PHOTO.frappe },
  { name: "Passion Fruit Frappe", category: "Frappe", sizes: [{ label: "Regular", price: 50 }, { label: "Large", price: 100 }], photo: PHOTO.frappe },
  { name: "Strawberry Frappe", category: "Frappe", sizes: [{ label: "Regular", price: 50 }, { label: "Large", price: 100 }], photo: PHOTO.frappe },
  { name: "Blueberry Frappe", category: "Frappe", sizes: [{ label: "Regular", price: 50 }, { label: "Large", price: 100 }], photo: PHOTO.frappe },
  // HOT DRINKS
  { name: "Coffee", category: "Hot Drinks", price: 25, photo: PHOTO.coffee },
  { name: "Tea", category: "Hot Drinks", price: 20, photo: PHOTO.tea },
  // PIZZA
  { name: "Single Cheese Pizza", category: "Pizza", price: 100, photo: PHOTO.pizza },
  { name: "Double Cheese Pizza", category: "Pizza", price: 120, photo: PHOTO.pizza },
  { name: "Cheese and Corn Pizza", category: "Pizza", price: 120, photo: PHOTO.pizza },
  { name: "Farm Fresh Pizza", category: "Pizza", price: 120, photo: PHOTO.pizza },
  { name: "Tandoori Pizza", category: "Pizza", price: 120, photo: PHOTO.pizza },
  { name: "Makhani Paneer Pizza", category: "Pizza", price: 120, photo: PHOTO.pizza },
  // BURGER
  { name: "Aloo Tikki Burger", category: "Burger", price: 40, photo: PHOTO.burger },
  { name: "Juicy Corn Burger", category: "Burger", price: 50, photo: PHOTO.burger },
  { name: "Cheesy Spicy Burger", category: "Burger", price: 60, photo: PHOTO.burger },
  { name: "Paneer Burger", category: "Burger", price: 70, photo: PHOTO.burger },
  // SANDWICH
  { name: "Grilled Sandwich", category: "Sandwich", price: 40, photo: PHOTO.sandwich },
  { name: "Cheesy Grilled Sandwich", category: "Sandwich", price: 60, photo: PHOTO.sandwich },
  { name: "Spicy Grilled Sandwich", category: "Sandwich", price: 70, photo: PHOTO.sandwich },
  { name: "Paneer Sandwich", category: "Sandwich", price: 90, photo: PHOTO.sandwich },
  // PASTA
  { name: "Red Sauce Pasta", category: "Pasta", price: 100, photo: PHOTO.pasta },
  { name: "White Sauce Pasta", category: "Pasta", price: 100, photo: PHOTO.pasta },
  { name: "Tandoori Pasta", category: "Pasta", price: 100, photo: PHOTO.pasta },
  { name: "Sweet and Spicy Pasta", category: "Pasta", price: 100, photo: PHOTO.pasta },
  // WRAPS
  { name: "Aloo Tikki Wrap", category: "Wraps", price: 80, photo: PHOTO.wrap },
  { name: "Veg Cheese Wrap", category: "Wraps", price: 100, photo: PHOTO.wrap },
  { name: "Paneer Wrap", category: "Wraps", price: 110, photo: PHOTO.wrap },
  // FRIES
  { name: "Fries", category: "Fries", price: 50, photo: PHOTO.fries },
  { name: "Peri-Peri Fries", category: "Fries", price: 60, photo: PHOTO.fries },
];

function basePrice(it: Item): number {
  return it.sizes?.length ? it.sizes[0].price : it.price!;
}

async function main() {
  const ownerPassword = await bcrypt.hash("owner123", 10);
  const owner = await prisma.user.upsert({
    where: { email: "owner-mlmoonlight@zoomoeats.com" },
    update: {},
    create: {
      email: "owner-mlmoonlight@zoomoeats.com",
      password: ownerPassword,
      name: "Moonlight Cafe Owner",
      role: UserRole.MERCHANT,
      phone: null,
    },
  });

  const restaurant = await prisma.restaurant.upsert({
    where: { id: "ml-moonlight" },
    update: {},
    create: {
      id: "ml-moonlight",
      name: "Moonlight Cafe",
      address: "Jourian, Jammu & Kashmir 181202",
      cuisineType: "Cafe",
      rating: 4.5,
      openingHours: "From 10:00 am",
      lat: 32.834,
      lng: 74.577,
      imageUrl: PHOTO.mocktail,
      ownerId: owner.id,
      isApproved: true,
      isActive: true,
    },
  });

  for (const it of MENU) {
    const dish = await prisma.dish.create({
      data: {
        restaurantId: restaurant.id,
        name: it.name,
        price: basePrice(it),
        imageUrl: it.photo,
        category: it.category,
        isVegetarian: true,
      },
    });
    if (it.sizes) {
      for (const s of it.sizes) {
        await prisma.dishSize.create({ data: { dishId: dish.id, label: s.label, price: s.price } });
      }
    }
  }

  console.log(`Seeded ${MENU.length} dishes for ${restaurant.name} (${restaurant.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
