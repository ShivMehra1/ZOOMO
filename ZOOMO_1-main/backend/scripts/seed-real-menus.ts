import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type Item = {
  name: string;
  category: string;
  price?: number;
  sizes?: { label: string; price: number }[];
  note?: string;
  tag?: "SPICY" | "NEW" | "FEATURED";
  photo: string;
};

function desc(it: Item): string | undefined {
  const tagLabel = it.tag === "SPICY" ? "Spicy" : it.tag === "NEW" ? "New" : it.tag === "FEATURED" ? "Featured" : undefined;
  return [tagLabel, it.note].filter(Boolean).join(" · ") || undefined;
}

function basePrice(it: Item): number {
  if (it.sizes && it.sizes.length) return it.sizes[0].price;
  return it.price!;
}

async function seedRestaurant(restaurantId: string, items: Item[]) {
  for (const it of items) {
    const dish = await prisma.dish.create({
      data: {
        restaurantId,
        name: it.name,
        description: desc(it) ?? null,
        price: basePrice(it),
        imageUrl: it.photo,
        category: it.category,
        isVegetarian: true,
      },
    });
    if (it.sizes && it.sizes.length) {
      for (const s of it.sizes) {
        await prisma.dishSize.create({
          data: { dishId: dish.id, label: s.label, price: s.price },
        });
      }
    }
  }
  console.log(`Seeded ${items.length} dishes for ${restaurantId}`);
}

/* ============== I LOVE PIZZA ============== */

const ILP: Item[] = [
  // PIZZA
  { name: "Margherita Double Cheese", category: "Pizza", sizes: [{ label: "Small", price: 89 }, { label: "Medium", price: 169 }, { label: "Large", price: 350 }], photo: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1200&q=80" },
  { name: "Cheese Corn", category: "Pizza", sizes: [{ label: "Small", price: 119 }, { label: "Medium", price: 229 }, { label: "Large", price: 379 }], photo: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=1200&q=80" },
  { name: "Veg. Delight Pizza", category: "Pizza", sizes: [{ label: "Small", price: 129 }, { label: "Medium", price: 249 }, { label: "Large", price: 430 }], photo: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=1200&q=80" },
  { name: "Paneer Tikka", category: "Pizza", sizes: [{ label: "Small", price: 159 }, { label: "Medium", price: 279 }, { label: "Large", price: 469 }], photo: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80" },
  { name: "Teekha Paneer", category: "Pizza", tag: "SPICY", sizes: [{ label: "Small", price: 159 }, { label: "Medium", price: 279 }, { label: "Large", price: 469 }], photo: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80" },
  { name: "Paneer Makhani (New)", category: "Pizza", tag: "NEW", sizes: [{ label: "Small", price: 159 }, { label: "Medium", price: 279 }, { label: "Large", price: 469 }], photo: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80" },
  { name: "Deluxe Veggie", category: "Pizza", sizes: [{ label: "Small", price: 169 }, { label: "Medium", price: 299 }, { label: "Large", price: 489 }], photo: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=1200&q=80" },
  { name: "Mushroom Corn", category: "Pizza", sizes: [{ label: "Small", price: 169 }, { label: "Medium", price: 299 }, { label: "Large", price: 489 }], photo: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=1200&q=80" },
  { name: "Veg. Extra Veganza", category: "Pizza", sizes: [{ label: "Small", price: 179 }, { label: "Medium", price: 349 }, { label: "Large", price: 529 }], photo: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=1200&q=80" },
  { name: "Farm House", category: "Pizza", sizes: [{ label: "Small", price: 199 }, { label: "Medium", price: 369 }, { label: "Large", price: 559 }], photo: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=1200&q=80" },
  { name: "Cheese Burst", category: "Pizza", sizes: [{ label: "Small", price: 229 }, { label: "Medium", price: 399 }, { label: "Large", price: 599 }], photo: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80" },
  { name: "I Love Pizza Spl.", category: "Pizza", tag: "FEATURED", sizes: [{ label: "Small", price: 249 }, { label: "Medium", price: 449 }, { label: "Large", price: 649 }], photo: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80" },
  // EXTRAS
  { name: "Extra Cheese", category: "Extras", sizes: [{ label: "Small", price: 39 }, { label: "Medium", price: 69 }, { label: "Large", price: 99 }], photo: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80" },
  { name: "Extra Topping", category: "Extras", price: 30, photo: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80" },
  // DIP
  { name: "Cheese Dip", category: "Dip", price: 30, photo: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80" },
  { name: "Chilli Garlic", category: "Dip", tag: "SPICY", price: 30, photo: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80" },
  { name: "American Barbecue", category: "Dip", price: 30, photo: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80" },
  { name: "Tandoori", category: "Dip", price: 30, photo: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80" },
  // CHAAP
  { name: "Kurkure Chaap", category: "Chaap", price: 99, photo: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=1200&q=80" },
  { name: "Malai Chaap", category: "Chaap", price: 129, photo: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=1200&q=80" },
  { name: "Chilly Chaap", category: "Chaap", tag: "SPICY", price: 129, photo: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=1200&q=80" },
  // SPRING ROLL
  { name: "Veg. Spring Roll", category: "Spring Roll", price: 79, photo: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=1200&q=80" },
  { name: "Veg. Kurkure Spring Roll", category: "Spring Roll", price: 99, photo: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=1200&q=80" },
  { name: "Chilli Potato", category: "Spring Roll", tag: "SPICY", price: 129, photo: "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=1200&q=80" },
  { name: "Honey Chilli Potato", category: "Spring Roll", tag: "SPICY", price: 149, photo: "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=1200&q=80" },
  // GRILLED BURGER
  { name: "Allo Tikki", category: "Grilled Burger", price: 39, photo: "https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=1200&q=80" },
  { name: "Veg. Burger", category: "Grilled Burger", price: 49, photo: "https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=1200&q=80" },
  { name: "Veg. Tandoori", category: "Grilled Burger", price: 69, photo: "https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=1200&q=80" },
  { name: "Chilli Lava", category: "Grilled Burger", tag: "SPICY", price: 79, photo: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80" },
  { name: "Crispy Cheese Corn Burger", category: "Grilled Burger", price: 89, photo: "https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=1200&q=80" },
  { name: "Double Decku Burger", category: "Grilled Burger", price: 109, photo: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80" },
  { name: "Crispy Paneer Burger", category: "Grilled Burger", price: 119, photo: "https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=1200&q=80" },
  { name: "Crispy Paneer Makhani", category: "Grilled Burger", price: 119, photo: "https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=1200&q=80" },
  { name: "Crispy Tandoori Makhani", category: "Grilled Burger", price: 119, photo: "https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=1200&q=80" },
  // WRAP
  { name: "Crispy Allo Tikki Wrap", category: "Wrap", price: 89, photo: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=1200&q=80" },
  { name: "Deluxe Veggie Wrap", category: "Wrap", price: 99, photo: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=1200&q=80" },
  { name: "Crispy Paneer Wrap", category: "Wrap", price: 119, photo: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=1200&q=80" },
  { name: "Crispy Tandoori Paneer Wrap", category: "Wrap", price: 119, photo: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=1200&q=80" },
  { name: "Crispy Makhani Paneer Wrap", category: "Wrap", price: 119, photo: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=1200&q=80" },
  // SANDWICH
  { name: "Veg. Grilled", category: "Sandwich", note: "Extra cheese Rs 20", price: 69, photo: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1200&q=80" },
  { name: "Cheese Corn", category: "Sandwich", note: "Extra cheese Rs 20", price: 79, photo: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1200&q=80" },
  { name: "Tandoori Paneer", category: "Sandwich", note: "Extra cheese Rs 20", price: 99, photo: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1200&q=80" },
  { name: "Makhani Paneer", category: "Sandwich", note: "Extra cheese Rs 20", price: 99, photo: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1200&q=80" },
  { name: "Farm House", category: "Sandwich", note: "Extra cheese Rs 20", price: 119, photo: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1200&q=80" },
  // SPECIAL MOMOS
  { name: "Fried Momos", category: "Special Momos", price: 69, photo: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=1200&q=80" },
  { name: "Kurkure Momos", category: "Special Momos", price: 99, photo: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=1200&q=80" },
  { name: "Chilly Momos", category: "Special Momos", tag: "SPICY", price: 119, photo: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=1200&q=80" },
  { name: "Malai Momos", category: "Special Momos", price: 129, photo: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=1200&q=80" },
  { name: "Cheesy Momos", category: "Special Momos", price: 149, photo: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=1200&q=80" },
  { name: "Fried Paneer Momos", category: "Special Momos", price: 99, photo: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=1200&q=80" },
  { name: "Kurkure Paneer Momos", category: "Special Momos", price: 119, photo: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=1200&q=80" },
  { name: "Chilly Paneer Momos", category: "Special Momos", tag: "SPICY", price: 129, photo: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=1200&q=80" },
  { name: "Malai Paneer Momos", category: "Special Momos", price: 149, photo: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=1200&q=80" },
  { name: "Cheesy Paneer Momos", category: "Special Momos", price: 149, photo: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=1200&q=80" },
  // SNACKS
  { name: "Fries", category: "Snacks", price: 89, photo: "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=1200&q=80" },
  { name: "Peri Peri", category: "Snacks", tag: "SPICY", price: 99, photo: "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=1200&q=80" },
  { name: "Tandoori", category: "Snacks", price: 99, photo: "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=1200&q=80" },
  { name: "Cheesy Peri Peri Fries", category: "Snacks", price: 119, photo: "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=1200&q=80" },
  { name: "Paneer Pops (12 pcs)", category: "Snacks", price: 149, photo: "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=1200&q=80" },
  { name: "Paneer Finger (8 pcs)", category: "Snacks", price: 149, photo: "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=1200&q=80" },
  { name: "Paneer Nuggets (8 pcs)", category: "Snacks", price: 149, photo: "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=1200&q=80" },
  { name: "Paneer Cheese Balls (8 pcs)", category: "Snacks", price: 149, photo: "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=1200&q=80" },
  // MANCHURIAN
  { name: "Veg. Manchurian", category: "Manchurian", price: 99, photo: "https://images.unsplash.com/photo-1626776876729-bab4369a5a5a?auto=format&fit=crop&w=1200&q=80" },
  { name: "Gobi Manchurian", category: "Manchurian", price: 99, photo: "https://images.unsplash.com/photo-1626776876729-bab4369a5a5a?auto=format&fit=crop&w=1200&q=80" },
  { name: "Paneer Manchurian", category: "Manchurian", price: 129, photo: "https://images.unsplash.com/photo-1626776876729-bab4369a5a5a?auto=format&fit=crop&w=1200&q=80" },
  // PASTA
  { name: "Veg. Red Sauce Pasta", category: "Pasta", price: 99, photo: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=1200&q=80" },
  { name: "Veg. Mix Sauce Pasta", category: "Pasta", price: 119, photo: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=1200&q=80" },
  { name: "Veg. White Sauce Pasta", category: "Pasta", price: 129, photo: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=1200&q=80" },
  { name: "Veg. Tandoori Sauce Pasta", category: "Pasta", price: 129, photo: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=1200&q=80" },
  { name: "Veg. Cheesy Pasta", category: "Pasta", price: 149, photo: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=1200&q=80" },
  // DESSERT
  { name: "Ice Cream", category: "Dessert", price: 50, photo: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=1200&q=80" },
  { name: "Choco Lava", category: "Dessert", price: 50, photo: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80" },
  { name: "Cup Cake", category: "Dessert", price: 40, photo: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80" },
  { name: "Brownie", category: "Dessert", price: 60, photo: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=1200&q=80" },
  // SHAKES
  { name: "Vanilla Shake", category: "Shakes", note: "Extra ice cream Rs 20", price: 99, photo: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=1200&q=80" },
  { name: "Strawberry Shake", category: "Shakes", note: "Extra ice cream Rs 20", price: 99, photo: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=1200&q=80" },
  { name: "Butter Scotch Shake", category: "Shakes", note: "Extra ice cream Rs 20", price: 99, photo: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=1200&q=80" },
  { name: "Chocolate Shake", category: "Shakes", note: "Extra ice cream Rs 20", price: 99, photo: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=1200&q=80" },
  { name: "Oreo Shake", category: "Shakes", note: "Extra ice cream Rs 20", price: 119, photo: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=1200&q=80" },
  { name: "Kit Kat Shake", category: "Shakes", note: "Extra ice cream Rs 20", price: 119, photo: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=1200&q=80" },
  // GARLIC BREAD
  { name: "Cheese Garlic Bread", category: "Garlic Bread", note: "Extra cheese Rs 20", price: 79, photo: "https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?auto=format&fit=crop&w=1200&q=80" },
  { name: "Supreme Garlic Bread", category: "Garlic Bread", note: "Extra cheese Rs 20", price: 89, photo: "https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?auto=format&fit=crop&w=1200&q=80" },
  { name: "Cheese Corn Garlic Bread", category: "Garlic Bread", note: "Extra cheese Rs 20", price: 99, photo: "https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?auto=format&fit=crop&w=1200&q=80" },
  { name: "Farm House Garlic Bread", category: "Garlic Bread", note: "Extra cheese Rs 20", price: 119, photo: "https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?auto=format&fit=crop&w=1200&q=80" },
  // SOUP
  { name: "Veg. Soup", category: "Soup", price: 50, photo: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1200&q=80" },
  // COMBO SPECIAL
  { name: "Combo 1 — Small feast", category: "Combo Special", note: "Includes: 1 Veg Small Pizza, 1 Fries, 2 Aloo Tikki Burger, 2 Coco", price: 399, photo: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=1200&q=80" },
  { name: "Combo 2 — Medium feast", category: "Combo Special", note: "Includes: 1 Veg Medium Pizza, 2 Veg Burger, 1 Plate Momos, 2 Coco", price: 549, photo: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=1200&q=80" },
  { name: "Combo 3 — Large feast", category: "Combo Special", note: "Includes: 1 Veg Large Pizza, 2 Veg Burger, 1 Garlic Bread, 1 Fries, 1000ml Coco", price: 899, photo: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=1200&q=80" },
  { name: "5 Pan Pizza", category: "Combo Special", note: "5 pan pizzas for ₹399 only", price: 399, photo: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80" },
];

/* ============== IN THE HOOD CAFE ============== */

const HOOD: Item[] = [
  // COLD COFFEE
  { name: "Plain Cold Coffee", category: "Cold Coffee", note: "Sugar free +Rs 5 | Ice cream add-on +Rs 10", price: 80, photo: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=1200&q=80" },
  { name: "Choco Cold Coffee", category: "Cold Coffee", note: "Sugar free +Rs 5 | Ice cream add-on +Rs 10", price: 90, photo: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=1200&q=80" },
  { name: "Strong Cold Coffee", category: "Cold Coffee", note: "Sugar free +Rs 5 | Ice cream add-on +Rs 10", price: 90, photo: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=1200&q=80" },
  { name: "Cold Coffee with Ice Cream", category: "Cold Coffee", price: 100, photo: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=1200&q=80" },
  { name: "Brownie Cold Coffee", category: "Cold Coffee", price: 100, photo: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=1200&q=80" },
  { name: "Hood's Special Coffee", category: "Cold Coffee", tag: "FEATURED", price: 120, photo: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=1200&q=80" },
  { name: "Rum Cold Coffee", category: "Cold Coffee", note: "Flavour only (not alcohol)", price: 90, photo: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=1200&q=80" },
  { name: "Whiskey Cold Coffee", category: "Cold Coffee", note: "Flavour only (not alcohol)", price: 90, photo: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=1200&q=80" },
  { name: "Vodka Cold Coffee", category: "Cold Coffee", note: "Flavour only (not alcohol)", price: 90, photo: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=1200&q=80" },
  { name: "Beer Cold Coffee", category: "Cold Coffee", note: "Flavour only (not alcohol)", price: 90, photo: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=1200&q=80" },
  // HOT COFFEE
  { name: "Black Coffee", category: "Hot Coffee", note: "Sugar free +Rs 5", sizes: [{ label: "Small", price: 25 }, { label: "Medium", price: 50 }, { label: "Large", price: 75 }], photo: "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=1200&q=80" },
  { name: "Strong Coffee", category: "Hot Coffee", note: "Sugar free +Rs 5", sizes: [{ label: "Small", price: 30 }, { label: "Medium", price: 60 }, { label: "Large", price: 80 }], photo: "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=1200&q=80" },
  { name: "Chocolate Coffee", category: "Hot Coffee", note: "Sugar free +Rs 5", sizes: [{ label: "Small", price: 30 }, { label: "Medium", price: 60 }, { label: "Large", price: 80 }], photo: "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=1200&q=80" },
  { name: "Strong Choco Coffee", category: "Hot Coffee", note: "Sugar free +Rs 5", sizes: [{ label: "Small", price: 35 }, { label: "Medium", price: 70 }, { label: "Large", price: 90 }], photo: "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=1200&q=80" },
  { name: "Hot Coffee", category: "Hot Coffee", note: "Sugar free +Rs 5", sizes: [{ label: "Small", price: 25 }, { label: "Medium", price: 50 }, { label: "Large", price: 75 }], photo: "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=1200&q=80" },
  { name: "Rum Coffee", category: "Hot Coffee", note: "Sugar free +Rs 5 | Flavour only (not alcohol)", sizes: [{ label: "Small", price: 30 }, { label: "Medium", price: 60 }, { label: "Large", price: 90 }], photo: "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=1200&q=80" },
  { name: "Whiskey Coffee", category: "Hot Coffee", note: "Sugar free +Rs 5 | Flavour only (not alcohol)", sizes: [{ label: "Small", price: 30 }, { label: "Medium", price: 60 }, { label: "Large", price: 90 }], photo: "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=1200&q=80" },
  { name: "Vodka Coffee", category: "Hot Coffee", note: "Sugar free +Rs 5 | Flavour only (not alcohol)", sizes: [{ label: "Small", price: 30 }, { label: "Medium", price: 60 }, { label: "Large", price: 90 }], photo: "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=1200&q=80" },
  { name: "Beer Coffee", category: "Hot Coffee", note: "Sugar free +Rs 5 | Flavour only (not alcohol)", sizes: [{ label: "Small", price: 30 }, { label: "Medium", price: 60 }, { label: "Large", price: 90 }], photo: "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=1200&q=80" },
  // HOT CHOCOLATE
  { name: "Dark Chocolate", category: "Hot Chocolate", price: 80, photo: "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=1200&q=80" },
  { name: "Jaggery", category: "Hot Chocolate", price: 80, photo: "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=1200&q=80" },
  // CHAI
  { name: "Adrak", category: "Chai", sizes: [{ label: "Regular", price: 25 }, { label: "Medium", price: 50 }, { label: "Large", price: 75 }], photo: "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?auto=format&fit=crop&w=1200&q=80" },
  { name: "Chocolate", category: "Chai", sizes: [{ label: "Regular", price: 25 }, { label: "Medium", price: 50 }, { label: "Large", price: 75 }], photo: "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?auto=format&fit=crop&w=1200&q=80" },
  { name: "Rose", category: "Chai", sizes: [{ label: "Regular", price: 25 }, { label: "Medium", price: 50 }, { label: "Large", price: 75 }], photo: "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?auto=format&fit=crop&w=1200&q=80" },
  { name: "Paan", category: "Chai", sizes: [{ label: "Regular", price: 25 }, { label: "Medium", price: 50 }, { label: "Large", price: 75 }], photo: "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?auto=format&fit=crop&w=1200&q=80" },
  { name: "Elaichi", category: "Chai", sizes: [{ label: "Regular", price: 30 }, { label: "Medium", price: 60 }, { label: "Large", price: 80 }], photo: "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?auto=format&fit=crop&w=1200&q=80" },
  { name: "Kesar", category: "Chai", sizes: [{ label: "Regular", price: 30 }, { label: "Medium", price: 60 }, { label: "Large", price: 80 }], photo: "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?auto=format&fit=crop&w=1200&q=80" },
  { name: "Masala", category: "Chai", sizes: [{ label: "Regular", price: 30 }, { label: "Medium", price: 60 }, { label: "Large", price: 80 }], photo: "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?auto=format&fit=crop&w=1200&q=80" },
  { name: "Hood's Sp. Tea", category: "Chai", tag: "FEATURED", sizes: [{ label: "Regular", price: 30 }, { label: "Medium", price: 60 }, { label: "Large", price: 90 }], photo: "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?auto=format&fit=crop&w=1200&q=80" },
  { name: "Lemon Tea", category: "Chai", sizes: [{ label: "Medium", price: 50 }, { label: "Large", price: 80 }], photo: "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?auto=format&fit=crop&w=1200&q=80" },
  // CHINESE BITES
  { name: "Veg Dim Sim Steam", category: "Chinese Bites", sizes: [{ label: "Half", price: 50 }, { label: "Full", price: 80 }], photo: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=1200&q=80" },
  { name: "Veg Dim Sim Fried", category: "Chinese Bites", sizes: [{ label: "Half", price: 50 }, { label: "Full", price: 80 }], photo: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=1200&q=80" },
  { name: "Paneer Dim Sum Steam", category: "Chinese Bites", sizes: [{ label: "Half", price: 70 }, { label: "Full", price: 120 }], photo: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=1200&q=80" },
  { name: "Paneer Dim Sum Fried", category: "Chinese Bites", sizes: [{ label: "Half", price: 80 }, { label: "Full", price: 130 }], photo: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=1200&q=80" },
  { name: "Veg Spring Rolls", category: "Chinese Bites", sizes: [{ label: "Half", price: 80 }, { label: "Full", price: 130 }], photo: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=1200&q=80" },
  // WRAP
  { name: "Veg Mexican Wrap", category: "Wrap", note: "Extra cheese/slice Rs 20", price: 100, photo: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=1200&q=80" },
  { name: "Tandoori Paneer Wrap", category: "Wrap", note: "Extra cheese/slice Rs 20", price: 110, photo: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=1200&q=80" },
  // KULHAD PIZZA
  { name: "Kulhad Pizza", category: "Kulhad Pizza", note: "Extra cheese Rs 20", sizes: [{ label: "Small", price: 40 }, { label: "Medium", price: 80 }, { label: "Large", price: 120 }], photo: "https://images.unsplash.com/photo-1597318181409-cf64d0b5d6a8?auto=format&fit=crop&w=1200&q=80" },
  // TACOS
  { name: "Veg Mexican Tacos", category: "Tacos", price: 99, photo: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=1200&q=80" },
  { name: "Tandoori Paneer Tacos", category: "Tacos", price: 120, photo: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=1200&q=80" },
  // PAV BHAJI
  { name: "Pav Bhaji", category: "Pav Bhaji", price: 80, photo: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=1200&q=80" },
  // DESSERT
  { name: "Kulhad Ice Cream", category: "Dessert", price: 50, photo: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=1200&q=80" },
  { name: "Hot Chocolate Brownie", category: "Dessert", price: 90, photo: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=1200&q=80" },
  { name: "Chocolava Cake", category: "Dessert", price: 80, photo: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80" },
  { name: "Gulab Jamun", category: "Dessert", price: 40, photo: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80" },
  { name: "Gulab Jamun with Ice Cream", category: "Dessert", price: 50, photo: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=1200&q=80" },
  { name: "Hot Chocolate Brownie with Ice Cream", category: "Dessert", price: 100, photo: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=1200&q=80" },
  // HEALTHY FEAST
  { name: "Corn Chat", category: "Healthy Feast", price: 50, photo: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80" },
  { name: "Roasted Makhane", category: "Healthy Feast", sizes: [{ label: "Small", price: 40 }, { label: "Large", price: 100 }], photo: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80" },
  { name: "Peri Peri Makhane", category: "Healthy Feast", tag: "SPICY", sizes: [{ label: "Small", price: 60 }, { label: "Large", price: 120 }], photo: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80" },
  { name: "Peanut Butter Sandwich", category: "Healthy Feast", price: 150, photo: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1200&q=80" },
  { name: "Paneer Loaded Sandwich", category: "Healthy Feast", price: 150, photo: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1200&q=80" },
  // BURGER
  { name: "Veg Burger", category: "Burger", note: "Extra cheese/slice Rs 20", price: 50, photo: "https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=1200&q=80" },
  { name: "Veg Cheese Burger", category: "Burger", note: "Extra cheese/slice Rs 20", price: 70, photo: "https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=1200&q=80" },
  { name: "Veg Paneer Burger", category: "Burger", note: "Extra cheese/slice Rs 20", price: 80, photo: "https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=1200&q=80" },
  { name: "Veg Salsa Burger", category: "Burger", note: "Extra cheese/slice Rs 20", price: 90, photo: "https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=1200&q=80" },
  { name: "Veg Mexican Burger", category: "Burger", note: "Extra cheese/slice Rs 20", price: 90, photo: "https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=1200&q=80" },
  { name: "Veg Cheese Paneer Burger", category: "Burger", note: "Extra cheese/slice Rs 20", price: 95, photo: "https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=1200&q=80" },
  { name: "Double Decker Burger", category: "Burger", note: "Extra cheese/slice Rs 20", price: 110, photo: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80" },
  // PIZZA
  { name: "Margerita", category: "Pizza", sizes: [{ label: "Small", price: 99 }, { label: "Medium", price: 199 }, { label: "Large", price: 299 }], photo: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1200&q=80" },
  { name: "Single Topping (Onion / Corn / Capsicum)", category: "Pizza", sizes: [{ label: "Small", price: 119 }, { label: "Medium", price: 219 }, { label: "Large", price: 319 }], photo: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=1200&q=80" },
  { name: "Premium Topping (Mushroom / Paneer / Olives)", category: "Pizza", sizes: [{ label: "Small", price: 129 }, { label: "Medium", price: 239 }, { label: "Large", price: 339 }], photo: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=1200&q=80" },
  { name: "Veggie Delight", category: "Pizza", sizes: [{ label: "Small", price: 129 }, { label: "Medium", price: 249 }, { label: "Large", price: 349 }], photo: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=1200&q=80" },
  { name: "Extra Cheese Loaded", category: "Pizza", sizes: [{ label: "Small", price: 149 }, { label: "Medium", price: 269 }, { label: "Large", price: 369 }], photo: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80" },
  { name: "Farmfresh", category: "Pizza", sizes: [{ label: "Small", price: 149 }, { label: "Medium", price: 289 }, { label: "Large", price: 389 }], photo: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=1200&q=80" },
  { name: "Veg Paradise", category: "Pizza", sizes: [{ label: "Small", price: 159 }, { label: "Medium", price: 299 }, { label: "Large", price: 399 }], photo: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=1200&q=80" },
  { name: "Tandoori", category: "Pizza", sizes: [{ label: "Small", price: 159 }, { label: "Medium", price: 299 }, { label: "Large", price: 399 }], photo: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80" },
  { name: "Achari", category: "Pizza", tag: "SPICY", sizes: [{ label: "Small", price: 159 }, { label: "Medium", price: 299 }, { label: "Large", price: 399 }], photo: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80" },
  { name: "Chipotle", category: "Pizza", tag: "SPICY", sizes: [{ label: "Small", price: 189 }, { label: "Medium", price: 349 }, { label: "Large", price: 449 }], photo: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=1200&q=80" },
  { name: "Paneer Tikka", category: "Pizza", note: "Extra cheese burst Rs 40", sizes: [{ label: "Small", price: 189 }, { label: "Medium", price: 349 }, { label: "Large", price: 449 }], photo: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80" },
  // PASTA
  { name: "Red Sauce Pasta", category: "Pasta", note: "Extra cheese/slice Rs 20", price: 100, photo: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=1200&q=80" },
  { name: "White Sauce Pasta", category: "Pasta", note: "Extra cheese/slice Rs 20", price: 129, photo: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=1200&q=80" },
  { name: "Mushroom Cheese Pasta", category: "Pasta", note: "Extra cheese/slice Rs 20", price: 149, photo: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=1200&q=80" },
  { name: "Pink Sauce Pasta", category: "Pasta", note: "Extra cheese/slice Rs 20", price: 149, photo: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=1200&q=80" },
  { name: "Tandoori Pasta", category: "Pasta", note: "Extra cheese/slice Rs 20", price: 149, photo: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=1200&q=80" },
  // BITES
  { name: "Maska Bun", category: "Bites", price: 25, photo: "https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?auto=format&fit=crop&w=1200&q=80" },
  { name: "Butter Toast Sandwich", category: "Bites", price: 30, photo: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1200&q=80" },
  { name: "Cheese Shots", category: "Bites", price: 120, photo: "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=1200&q=80" },
  { name: "Onion Rings", category: "Bites", sizes: [{ label: "Small", price: 80 }, { label: "Large", price: 120 }], photo: "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=1200&q=80" },
  // FRIES
  { name: "French Fries", category: "Fries", note: "Extra cheese Rs 20", price: 80, photo: "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=1200&q=80" },
  { name: "Masala Fries", category: "Fries", note: "Extra cheese Rs 20", price: 100, photo: "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=1200&q=80" },
  { name: "Peri Peri Fries", category: "Fries", tag: "SPICY", note: "Extra cheese Rs 20", price: 100, photo: "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=1200&q=80" },
  { name: "Veg Loaded Fries", category: "Fries", note: "Extra cheese Rs 20", price: 149, photo: "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=1200&q=80" },
  // GARLIC
  { name: "Garlic Bun", category: "Garlic", price: 30, photo: "https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?auto=format&fit=crop&w=1200&q=80" },
  { name: "Garlic Shots", category: "Garlic", price: 90, photo: "https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?auto=format&fit=crop&w=1200&q=80" },
  { name: "Plain Garlic Bread", category: "Garlic", price: 110, photo: "https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?auto=format&fit=crop&w=1200&q=80" },
  { name: "Stuffed Garlic Bread", category: "Garlic", price: 140, photo: "https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?auto=format&fit=crop&w=1200&q=80" },
  // SANDWICHES
  { name: "Corn Masala Sandwich", category: "Sandwiches", note: "Extra cheese/slice Rs 20", price: 60, photo: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1200&q=80" },
  { name: "Bombay Kaccha Sandwich", category: "Sandwiches", note: "Extra cheese/slice Rs 20", price: 60, photo: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1200&q=80" },
  { name: "Jam Grilled Sandwich", category: "Sandwiches", note: "Extra cheese/slice Rs 20", price: 60, photo: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1200&q=80" },
  { name: "Sev Onion Sandwich", category: "Sandwiches", note: "Extra cheese/slice Rs 20", price: 70, photo: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1200&q=80" },
  { name: "Chilli Chatpata Sandwich", category: "Sandwiches", tag: "SPICY", note: "Extra cheese/slice Rs 20", price: 75, photo: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1200&q=80" },
  { name: "Veggie Grill Sandwich", category: "Sandwiches", note: "Extra cheese/slice Rs 20", price: 80, photo: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1200&q=80" },
  { name: "Grilled Cheese Sandwich", category: "Sandwiches", note: "Extra cheese/slice Rs 20", price: 85, photo: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1200&q=80" },
  { name: "Corn Mayo Sandwich", category: "Sandwiches", note: "Extra cheese/slice Rs 20", price: 85, photo: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1200&q=80" },
  { name: "Paneer Takatak Sandwich", category: "Sandwiches", note: "Extra cheese/slice Rs 20", price: 90, photo: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1200&q=80" },
  { name: "Paneer Special Sandwich", category: "Sandwiches", note: "Extra cheese/slice Rs 20", price: 100, photo: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1200&q=80" },
  // MAGGIE
  { name: "Plain Maggie", category: "Maggie", note: "Extra cheese/slice Rs 20", price: 50, photo: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=1200&q=80" },
  { name: "Double Masala", category: "Maggie", note: "Extra cheese/slice Rs 20", price: 70, photo: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=1200&q=80" },
  { name: "Shezwan", category: "Maggie", tag: "SPICY", note: "Extra cheese/slice Rs 20", price: 75, photo: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=1200&q=80" },
  { name: "Corn Cheese Maggie", category: "Maggie", note: "Extra cheese/slice Rs 20", price: 80, photo: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=1200&q=80" },
  { name: "Vegetable Maggie", category: "Maggie", note: "Extra cheese/slice Rs 20", price: 80, photo: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=1200&q=80" },
  { name: "Cheese & Butter Maggie", category: "Maggie", note: "Extra cheese/slice Rs 20", price: 85, photo: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=1200&q=80" },
  { name: "Tandoori Maggie", category: "Maggie", note: "Extra cheese/slice Rs 20", price: 85, photo: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=1200&q=80" },
  { name: "Hood's Special Maggie", category: "Maggie", tag: "FEATURED", note: "Extra cheese/slice Rs 20", price: 90, photo: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=1200&q=80" },
  { name: "Paneer Maggie", category: "Maggie", note: "Extra cheese/slice Rs 20", price: 90, photo: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=1200&q=80" },
  // MILK SHAKES
  { name: "Milky Cola", category: "Milk Shakes", note: "Sugar free +Rs 5 | Ice cream add-on +Rs 10", price: 60, photo: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=1200&q=80" },
  { name: "Vanilla Shake", category: "Milk Shakes", note: "Sugar free +Rs 5 | Ice cream add-on +Rs 10", price: 90, photo: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=1200&q=80" },
  { name: "Strawberry Shake", category: "Milk Shakes", note: "Sugar free +Rs 5 | Ice cream add-on +Rs 10", price: 90, photo: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=1200&q=80" },
  { name: "Mango Milk Shake", category: "Milk Shakes", note: "Sugar free +Rs 5 | Ice cream add-on +Rs 10", price: 90, photo: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=1200&q=80" },
  { name: "Butter Scotch Shake", category: "Milk Shakes", note: "Sugar free +Rs 5 | Ice cream add-on +Rs 10", price: 100, photo: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=1200&q=80" },
  { name: "Dairy Milk Shake", category: "Milk Shakes", note: "Sugar free +Rs 5 | Ice cream add-on +Rs 10", price: 100, photo: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=1200&q=80" },
  { name: "Romance Candy", category: "Milk Shakes", note: "Sugar free +Rs 5 | Ice cream add-on +Rs 10", price: 110, photo: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=1200&q=80" },
  { name: "Black Currant", category: "Milk Shakes", note: "Sugar free +Rs 5 | Ice cream add-on +Rs 10", price: 110, photo: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=1200&q=80" },
  { name: "Bubble Gum", category: "Milk Shakes", note: "Sugar free +Rs 5 | Ice cream add-on +Rs 10", price: 110, photo: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=1200&q=80" },
  { name: "Brownie Shake", category: "Milk Shakes", note: "Sugar free +Rs 5 | Ice cream add-on +Rs 10", price: 120, photo: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=1200&q=80" },
  { name: "Oreo Shake", category: "Milk Shakes", note: "Sugar free +Rs 5 | Ice cream add-on +Rs 10", price: 120, photo: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=1200&q=80" },
  { name: "KitKat Shake", category: "Milk Shakes", note: "Sugar free +Rs 5 | Ice cream add-on +Rs 10", price: 120, photo: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=1200&q=80" },
  { name: "Kesar Badam", category: "Milk Shakes", note: "Sugar free +Rs 5 | Ice cream add-on +Rs 10", price: 120, photo: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=1200&q=80" },
  { name: "Nutella", category: "Milk Shakes", note: "Sugar free +Rs 5 | Ice cream add-on +Rs 10", price: 140, photo: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=1200&q=80" },
  { name: "Biscoff", category: "Milk Shakes", note: "Sugar free +Rs 5 | Ice cream add-on +Rs 10", price: 140, photo: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=1200&q=80" },
  // MOJITO
  { name: "Classic Mojito", category: "Mojito", price: 70, photo: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=1200&q=80" },
  { name: "Black Currant Mojito", category: "Mojito", price: 80, photo: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=1200&q=80" },
  { name: "Black Cobra", category: "Mojito", price: 80, photo: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=1200&q=80" },
  { name: "Raspberry Mojito", category: "Mojito", price: 80, photo: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=1200&q=80" },
  { name: "Blue Lagoon", category: "Mojito", price: 80, photo: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=1200&q=80" },
  { name: "Strawberry Mojito", category: "Mojito", price: 99, photo: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=1200&q=80" },
  { name: "Kiwi Mojito", category: "Mojito", price: 99, photo: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=1200&q=80" },
  { name: "Pineapple Mojito", category: "Mojito", price: 99, photo: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=1200&q=80" },
  { name: "Orange Mojito", category: "Mojito", price: 99, photo: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=1200&q=80" },
  { name: "Green Apple Mojito", category: "Mojito", price: 99, photo: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=1200&q=80" },
  { name: "Spicy Mango Mojito", category: "Mojito", tag: "SPICY", price: 99, photo: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=1200&q=80" },
  // LASSI
  { name: "Mango Lassi", category: "Lassi", price: 60, photo: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=1200&q=80" },
  { name: "Litchi Lassi", category: "Lassi", price: 60, photo: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=1200&q=80" },
  { name: "Strawberry Lassi", category: "Lassi", price: 60, photo: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=1200&q=80" },
  { name: "Orange Lassi", category: "Lassi", price: 60, photo: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=1200&q=80" },
  { name: "Paan Lassi", category: "Lassi", price: 60, photo: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=1200&q=80" },
  { name: "Salted Lassi", category: "Lassi", price: 60, photo: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=1200&q=80" },
  // COLD DRINK
  { name: "Coke", category: "Cold Drink", price: 35, photo: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80" },
  { name: "Sprite", category: "Cold Drink", price: 35, photo: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80" },
  { name: "Diet Coke", category: "Cold Drink", price: 35, photo: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80" },
  // MASALA LEMONADE
  { name: "Strawberry Masala Lemonade", category: "Masala Lemonade", price: 70, photo: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=1200&q=80" },
  { name: "Green Mint Masala Lemonade", category: "Masala Lemonade", price: 70, photo: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=1200&q=80" },
  { name: "Litchi Masala Lemonade", category: "Masala Lemonade", price: 70, photo: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=1200&q=80" },
  { name: "Orange Masala Lemonade", category: "Masala Lemonade", price: 70, photo: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=1200&q=80" },
  { name: "Pineapple Masala Lemonade", category: "Masala Lemonade", price: 70, photo: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=1200&q=80" },
  { name: "Kiwi Masala Lemonade", category: "Masala Lemonade", price: 70, photo: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=1200&q=80" },
  // ICE CRUSHER
  { name: "Strawberry Ice Crusher", category: "Ice Crusher", price: 70, photo: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=1200&q=80" },
  { name: "Kiwi Ice Crusher", category: "Ice Crusher", price: 70, photo: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=1200&q=80" },
  { name: "Mango Ice Crusher", category: "Ice Crusher", price: 70, photo: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=1200&q=80" },
  { name: "Blue Berry Ice Crusher", category: "Ice Crusher", price: 70, photo: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=1200&q=80" },
  // ICE TEA
  { name: "Plain Ice Tea", category: "Ice Tea", price: 50, photo: "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?auto=format&fit=crop&w=1200&q=80" },
  { name: "Lemon Ice Tea", category: "Ice Tea", price: 70, photo: "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?auto=format&fit=crop&w=1200&q=80" },
  { name: "Peach Ice Tea", category: "Ice Tea", price: 80, photo: "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?auto=format&fit=crop&w=1200&q=80" },
];

async function main() {
  console.log(`I Love Pizza: ${ILP.length} items, In The Hood Cafe: ${HOOD.length} items`);

  // Replace I Love Pizza's placeholder menu with the real one
  await prisma.dishSize.deleteMany({ where: { dish: { restaurantId: "pizza-palace" } } });
  await prisma.dish.deleteMany({ where: { restaurantId: "pizza-palace" } });
  await prisma.restaurant.update({
    where: { id: "pizza-palace" },
    data: { phone: "9469833125", cuisineType: "Pizza" },
  });
  await seedRestaurant("pizza-palace", ILP);

  // Rename Moonlight Cafe -> In The Hood Cafe, seed its real menu
  await prisma.restaurant.update({
    where: { id: "moonlight-cafe" },
    data: {
      name: "In The Hood Cafe",
      phone: "7051305706",
      cuisineType: "Cafe",
      description: "Love the kulhad? Take it home!",
    },
  });
  await seedRestaurant("moonlight-cafe", HOOD);

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
