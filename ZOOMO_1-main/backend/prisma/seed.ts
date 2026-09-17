/**
 * STALE — do not run `prisma db seed`.
 *
 * This file still creates the old San Francisco demo kitchens (Pizza Palace,
 * Burger Barn, Healthy Bites) and would resurrect them on top of the live
 * Jourian restaurants. Staff + platform promos: `scripts/seed-platform.ts`.
 * Real menus: `scripts/seed-real-menus.ts` (already applied).
 */
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@zoomoeats.com' },
    update: {},
    create: {
      email: 'admin@zoomoeats.com',
      password: adminPassword,
      name: 'Admin User',
      role: UserRole.ADMIN,
      phone: '+1234567890',
    },
  });

  // Create restaurant owners
  const ownerPassword = await bcrypt.hash('owner123', 10);
  const owner1 = await prisma.user.upsert({
    where: { email: 'owner1@zoomoeats.com' },
    update: {},
    create: {
      email: 'owner1@zoomoeats.com',
      password: ownerPassword,
      name: 'Pizza Palace Owner',
      role: UserRole.MERCHANT,
      phone: '+1234567891',
    },
  });

  const owner2 = await prisma.user.upsert({
    where: { email: 'owner2@zoomoeats.com' },
    update: {},
    create: {
      email: 'owner2@zoomoeats.com',
      password: ownerPassword,
      name: 'Burger Barn Owner',
      role: UserRole.MERCHANT,
      phone: '+1234567892',
    },
  });

  const owner3 = await prisma.user.upsert({
    where: { email: 'owner3@zoomoeats.com' },
    update: {},
    create: {
      email: 'owner3@zoomoeats.com',
      password: ownerPassword,
      name: 'Healthy Bites Owner',
      role: UserRole.MERCHANT,
      phone: '+1234567893',
    },
  });

  // Create test customer
  const customerPassword = await bcrypt.hash('customer123', 10);
  const customer = await prisma.user.upsert({
    where: { email: 'customer@zoomoeats.com' },
    update: {},
    create: {
      email: 'customer@zoomoeats.com',
      password: customerPassword,
      name: 'John Customer',
      role: UserRole.USER,
      phone: '+1234567894',
    },
  });

  // Create customer address
  await prisma.address.upsert({
    where: { id: 'customer-address-1' },
    update: {},
    create: {
      id: 'customer-address-1',
      street: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102',
      country: 'USA',
      isDefault: true,
      userId: customer.id,
    },
  });

  // Create driver
  const driverPassword = await bcrypt.hash('driver123', 10);
  const driver = await prisma.user.upsert({
    where: { email: 'driver@zoomoeats.com' },
    update: {},
    create: {
      email: 'driver@zoomoeats.com',
      password: driverPassword,
      name: 'Mike Driver',
      role: UserRole.DRIVER,
      phone: '+1234567895',
    },
  });

  // Create driver profile
  await prisma.driver.upsert({
    where: { userId: driver.id },
    update: {},
    create: {
      userId: driver.id,
      isAvailable: true,
      currentLat: 37.7749,
      currentLng: -122.4194,
      vehicleType: 'Car',
      vehiclePlate: 'ABC123',
    },
  });

  // Create restaurants
  const pizzaPalace = await prisma.restaurant.upsert({
    where: { id: 'pizza-palace' },
    update: {},
    create: {
      id: 'pizza-palace',
      name: 'Pizza Palace',
      description: 'Authentic Italian pizzas made with fresh ingredients',
      imageUrl: '/cheese-pizza.webp',
      address: '456 Pizza St, San Francisco, CA 94103',
      phone: '+1555123456',
      email: 'info@pizzapalace.com',
      openingHours: 'Mon-Sun: 11:00 AM - 11:00 PM',
      cuisineType: 'Italian',
      priceRange: '$$',
      rating: 4.5,
      ownerId: owner1.id,
    },
  });

  const burgerBarn = await prisma.restaurant.upsert({
    where: { id: 'burger-barn' },
    update: {},
    create: {
      id: 'burger-barn',
      name: 'Burger Barn',
      description: 'Gourmet burgers and crispy fries',
      imageUrl: '/eloteburgers6.jpg',
      address: '789 Burger Ave, San Francisco, CA 94104',
      phone: '+1555123457',
      email: 'info@burgerbarn.com',
      openingHours: 'Mon-Sun: 10:00 AM - 10:00 PM',
      cuisineType: 'American',
      priceRange: '$$',
      rating: 4.3,
      ownerId: owner2.id,
    },
  });

  const healthyBites = await prisma.restaurant.upsert({
    where: { id: 'healthy-bites' },
    update: {},
    create: {
      id: 'healthy-bites',
      name: 'Healthy Bites',
      description: 'Fresh salads, smoothies, and healthy meals',
      imageUrl: '/Blueberry-Smoothie-main.webp',
      address: '321 Health St, San Francisco, CA 94105',
      phone: '+1555123458',
      email: 'info@healthybites.com',
      openingHours: 'Mon-Sun: 8:00 AM - 9:00 PM',
      cuisineType: 'Healthy',
      priceRange: '$',
      rating: 4.7,
      ownerId: owner3.id,
    },
  });

  // Create dishes for Pizza Palace
  const pizzaDishes = [
    {
      id: 'margherita-pizza',
      name: 'Margherita Pizza',
      description: 'Classic pizza with tomato sauce, mozzarella, and fresh basil',
      price: 18.99,
      imageUrl: '/cheese-pizza.webp',
      ingredients: 'Tomato sauce, mozzarella cheese, fresh basil, olive oil',
      calories: 280,
      isVegetarian: true,
      preparationTime: 15,
      restaurantId: pizzaPalace.id,
    },
    {
      id: 'pepperoni-pizza',
      name: 'Pepperoni Pizza',
      description: 'Classic pepperoni pizza with mozzarella cheese',
      price: 21.99,
      imageUrl: '/cheese_burstpizza.png',
      ingredients: 'Tomato sauce, mozzarella cheese, pepperoni',
      calories: 320,
      preparationTime: 15,
      restaurantId: pizzaPalace.id,
    },
    {
      id: 'chicken-tandoori-pizza',
      name: 'Chicken Tandoori Pizza',
      description: 'Spicy tandoori chicken with onions and peppers',
      price: 24.99,
      imageUrl: '/chicken-tandoori-pizza.jpg',
      ingredients: 'Tandoori chicken, onions, bell peppers, mozzarella cheese',
      calories: 350,
      preparationTime: 18,
      restaurantId: pizzaPalace.id,
    },
  ];

  // Create dishes for Burger Barn
  const burgerDishes = [
    {
      id: 'classic-burger',
      name: 'Classic Burger',
      description: 'Juicy beef patty with lettuce, tomato, and special sauce',
      price: 14.99,
      imageUrl: '/eloteburgers6.jpg',
      ingredients: 'Beef patty, lettuce, tomato, onion, special sauce, brioche bun',
      calories: 520,
      preparationTime: 12,
      restaurantId: burgerBarn.id,
    },
    {
      id: 'cheese-burger',
      name: 'Cheese Burger',
      description: 'Classic burger with melted cheddar cheese',
      price: 16.99,
      imageUrl: '/AvoBaconGrilledCheese_0011-scaled-e1682914545487.jpg',
      ingredients: 'Beef patty, cheddar cheese, lettuce, tomato, onion, brioche bun',
      calories: 580,
      preparationTime: 12,
      restaurantId: burgerBarn.id,
    },
    {
      id: 'veggie-burger',
      name: 'Veggie Burger',
      description: 'Plant-based patty with fresh vegetables',
      price: 15.99,
      imageUrl: '/aloo-tikki-burger-recipe-9.jpg',
      ingredients: 'Plant-based patty, lettuce, tomato, avocado, vegan mayo',
      calories: 420,
      isVegetarian: true,
      isVegan: true,
      preparationTime: 10,
      restaurantId: burgerBarn.id,
    },
  ];

  // Create dishes for Healthy Bites
  const healthyDishes = [
    {
      id: 'green-smoothie',
      name: 'Green Power Smoothie',
      description: 'Spinach, kale, banana, apple, and coconut water',
      price: 8.99,
      imageUrl: '/Blueberry-Smoothie-main.webp',
      ingredients: 'Spinach, kale, banana, apple, coconut water, chia seeds',
      calories: 180,
      isVegetarian: true,
      isVegan: true,
      preparationTime: 5,
      restaurantId: healthyBites.id,
    },
    {
      id: 'quinoa-salad',
      name: 'Quinoa Power Salad',
      description: 'Quinoa with mixed greens, avocado, and tahini dressing',
      price: 12.99,
      imageUrl: '/Spicy-Macaroni-Salad-feature-800x556.jpg',
      ingredients: 'Quinoa, mixed greens, avocado, cherry tomatoes, tahini dressing',
      calories: 320,
      isVegetarian: true,
      isVegan: true,
      preparationTime: 8,
      restaurantId: healthyBites.id,
    },
    {
      id: 'acai-bowl',
      name: 'Acai Berry Bowl',
      description: 'Acai bowl topped with granola, berries, and honey',
      price: 11.99,
      imageUrl: '/Blueberry-Mocktail-SQUARE.jpg',
      ingredients: 'Acai puree, granola, blueberries, strawberries, honey',
      calories: 280,
      isVegetarian: true,
      preparationTime: 7,
      restaurantId: healthyBites.id,
    },
  ];

  // Insert all dishes
  const allDishes = [...pizzaDishes, ...burgerDishes, ...healthyDishes];
  for (const dish of allDishes) {
    await prisma.dish.upsert({
      where: { id: dish.id },
      update: {},
      create: dish,
    });
  }

  // Create customer cart
  const cart = await prisma.cart.upsert({
    where: { userId: customer.id },
    update: {},
    create: {
      userId: customer.id,
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log('📊 Created:');
  console.log('  - 5 users (admin, 3 owners, 1 customer, 1 driver)');
  console.log('  - 3 restaurants');
  console.log('  - 9 dishes');
  console.log('  - 1 customer address');
  console.log('  - 1 driver profile');
  console.log('  - 1 customer cart');
  console.log('');
  console.log('🔐 Test Credentials:');
  console.log('  Admin: admin@zoomoeats.com / admin123');
  console.log('  Customer: customer@zoomoeats.com / customer123');
  console.log('  Driver: driver@zoomoeats.com / driver123');
  console.log('  Owner 1: owner1@zoomoeats.com / owner123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
