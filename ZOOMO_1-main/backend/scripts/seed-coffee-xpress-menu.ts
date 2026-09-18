/**
 * Live Coffee Xpress menu (Jourian). Unique real photos only.
 * Size variants (Regular/Large, 2 pcs/4 pcs) are DishSize rows on one dish.
 * Ice-tea flavors are separate dishes so strawberry ≠ blueberry ≠ passion fruit.
 */
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

const U = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&h=800&q=80`;
const P = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=800`;

type Item = {
  name: string;
  category: string;
  price?: number;
  sizes?: { label: string; price: number }[];
  note?: string;
  photo: string | null;
};

const MENU: Item[] = [
  // Hot beverages
  { name: "Cappuccino", category: "Hot beverages", price: 25, photo: P(2396220) },
  { name: "Cappuccino (Hazelnut / Caramel / Vanilla)", category: "Hot beverages", price: 35, note: "Hazelnut, caramel, or vanilla", photo: P(414630) },
  { name: "Café Tea", category: "Hot beverages", price: 25, photo: P(1695052) },
  { name: "Café Mocha", category: "Hot beverages", price: 25, photo: P(544113) },
  { name: "Hot Chocolate", category: "Hot beverages", price: 25, photo: U("1511381939415-c32b5c6c9b1c") },
  { name: "Black Coffee", category: "Hot beverages", price: 20, photo: P(324028) },
  { name: "Espresso", category: "Hot beverages", price: 15, photo: P(206763) },
  { name: "Nestea Cardamom", category: "Hot beverages", price: 15, photo: P(373888) },
  { name: "Nestea Masala", category: "Hot beverages", price: 15, photo: null },
  { name: "Nestea Lemon", category: "Hot beverages", price: 15, photo: P(338713) },
  { name: "Green Tea", category: "Hot beverages", price: 20, photo: P(1283219) },
  { name: "Nestea Bag", category: "Hot beverages", price: 15, photo: null },
  { name: "Tea Bags", category: "Hot beverages", price: 15, photo: null },

  // Cold beverages — Regular/Large as sizes, flavors split so photos stay accurate
  { name: "Frappe (cold coffee)", category: "Cold beverages", sizes: [{ label: "Regular", price: 50 }, { label: "Large", price: 90 }], photo: P(302899) },
  { name: "Frappe (Hazelnut / Caramel / Vanilla)", category: "Cold beverages", note: "Hazelnut, caramel, or vanilla", sizes: [{ label: "Regular", price: 60 }, { label: "Large", price: 110 }], photo: null },
  { name: "Ice Tea Lemon", category: "Cold beverages", sizes: [{ label: "Regular", price: 25 }, { label: "Large", price: 40 }], photo: U("1631067451074-27e2826ec83b") },
  { name: "Ice Tea Passion Fruit", category: "Cold beverages", sizes: [{ label: "Regular", price: 40 }, { label: "Large", price: 60 }], photo: null },
  { name: "Ice Tea Strawberry", category: "Cold beverages", sizes: [{ label: "Regular", price: 40 }, { label: "Large", price: 60 }], photo: U("1638176066666-ffb2f0091475") },
  { name: "Ice Tea Blueberry", category: "Cold beverages", sizes: [{ label: "Regular", price: 40 }, { label: "Large", price: 60 }], photo: U("1488900127500-7d8dd8aa99eb") },

  // Mocktails & shakes
  { name: "Classic Mojito", category: "Mocktails & shakes", price: 70, photo: P(1187766) },
  { name: "Blue Lagoon", category: "Mocktails & shakes", price: 70, photo: U("1679061583335-c8be1c6209f6") },
  { name: "Green Apple", category: "Mocktails & shakes", price: 70, photo: null },
  { name: "Watermelon Mojito", category: "Mocktails & shakes", price: 70, photo: null },
  { name: "Strawberry Mojito", category: "Mocktails & shakes", price: 70, photo: P(775032) },
  { name: "Paan Mojito", category: "Mocktails & shakes", price: 70, photo: null },
  { name: "Oreo Shake", category: "Mocktails & shakes", price: 80, photo: P(65882) },
  { name: "Kitkat Shake", category: "Mocktails & shakes", price: 80, photo: P(45202) },
  { name: "Butterscotch Shake", category: "Mocktails & shakes", price: 70, photo: null },
  { name: "Strawberry Shake", category: "Mocktails & shakes", price: 70, photo: P(1435735) },
  { name: "Chocolate Shake", category: "Mocktails & shakes", price: 70, photo: null },
  { name: "Vanilla Shake", category: "Mocktails & shakes", price: 70, photo: P(162523) },

  // Snacks
  { name: "Aloo patty", category: "Snacks", price: 20, photo: P(60616) },
  { name: "Grilled veg sandwich", category: "Snacks", price: 35, photo: null },
  { name: "Grilled cheese corn sandwich", category: "Snacks", price: 40, photo: null },
  { name: "Grilled paneer tikka sandwich", category: "Snacks", price: 40, photo: null },
  { name: "Aloo tikki hotdog", category: "Snacks", price: 35, photo: null },
  { name: "Veg burger", category: "Snacks", price: 50, photo: null },
  { name: "Cheese veg burger", category: "Snacks", price: 60, photo: null },
  { name: "Paneer patty burger", category: "Snacks", price: 90, photo: null },
  { name: "Bread cheese pizza", category: "Snacks", price: 45, photo: U("1458642849426-cfb7249ffea1") },
  { name: "Plain Maggi", category: "Snacks", price: 30, photo: P(803963) },
  { name: "Vegetable Maggi", category: "Snacks", price: 50, photo: P(1256875) },
  { name: "Red sauce pasta with veggies", category: "Snacks", price: 80, photo: P(4106483) },
  { name: "White sauce pasta with veggies", category: "Snacks", price: 90, photo: P(5419336) },
  { name: "Mix sauce pasta with veggies", category: "Snacks", price: 110, photo: P(1527603) },

  // Pizza — veg/cheese only, no pepperoni
  { name: "Margherita pizza", category: "Pizza", price: 99, photo: U("1574126154517-6d8cfcd5e96a") },
  { name: "Cheese corn pizza", category: "Pizza", price: 109, photo: U("1506354666786-959b6d38972e") },
  { name: "Onion & capsicum pizza", category: "Pizza", price: 109, photo: null },
  { name: "Farm house pizza", category: "Pizza", price: 150, photo: null },
  { name: "Paneer tikka pizza", category: "Pizza", price: 170, photo: null },
  { name: "Extra cheese for pizza", category: "Pizza", price: 50, photo: null },

  // Sides
  { name: "Cheese garlic bread", category: "Sides", sizes: [{ label: "2 pcs", price: 60 }, { label: "4 pcs", price: 120 }], photo: U("1549931319-a545dcf3d7a9") },
  { name: "Exotic cheese garlic bread (4 pcs)", category: "Sides", price: 140, photo: null },
  { name: "Plain French fries", category: "Sides", price: 70, photo: P(1583884) },
  { name: "Peri peri fries", category: "Sides", price: 90, photo: P(1893556) },
];

function photoKey(url: string): string {
  const u = url.split("?")[0];
  const uns = u.match(/photo-([0-9]{10,}-[a-zA-Z0-9]+)/);
  if (uns) return uns[1];
  const pex = u.match(/\/photos\/(\d+)\//);
  if (pex) return pex[1];
  return u;
}

async function main() {
  const restaurant = await prisma.restaurant.findUnique({ where: { id: "coffee-xpress" } });
  if (!restaurant) throw new Error("coffee-xpress restaurant missing");

  await prisma.restaurant.update({
    where: { id: "coffee-xpress" },
    data: {
      name: "Coffee Xpress",
      description: "Cafe drinks, shakes, snacks and pizza from Jourian.",
      cuisineType: "Cafe",
      openingHours: "10:00 AM – 11:00 PM",
      priceRange: "$",
      costForTwo: 250,
      etaMin: 18,
      isActive: true,
      isApproved: true,
      lat: restaurant.lat ?? 32.834,
      lng: restaurant.lng ?? 74.577,
      address: restaurant.address || "Ward No 6, Jourian, Jammu 181202",
      imageUrl: restaurant.imageUrl || U("1501339848184-5f5d84d901ca"),
    },
  });

  const existing = await prisma.dish.findMany({
    where: { restaurantId: "coffee-xpress" },
    select: { id: true },
  });
  if (existing.length) {
    await prisma.dishSize.deleteMany({ where: { dish: { restaurantId: "coffee-xpress" } } });
    await prisma.dish.deleteMany({ where: { restaurantId: "coffee-xpress" } });
    console.log(`Cleared ${existing.length} old Coffee Xpress dishes`);
  }

  const taken = new Set<string>();
  const others = await prisma.dish.findMany({ select: { imageUrl: true } });
  const covers = await prisma.restaurant.findMany({ select: { imageUrl: true } });
  for (const row of [...others, ...covers]) {
    if (row.imageUrl) taken.add(photoKey(row.imageUrl));
  }
  // Chrome reserved (hero poster is the old burger still)
  taken.add("1568901346375-23c9450c58cd");
  taken.add("1501339848184-5f5d84d901ca");

  const missing: string[] = [];
  let created = 0;
  const registry: string[] = [];

  for (const it of MENU) {
    let photo = it.photo;
    if (photo && taken.has(photoKey(photo))) {
      photo = null;
    }
    if (!photo) {
      missing.push(`[NEEDS UNIQUE PHOTO: ${it.name}]`);
    } else {
      taken.add(photoKey(photo));
    }

    const dish = await prisma.dish.create({
      data: {
        restaurantId: "coffee-xpress",
        name: it.name,
        description: it.note ?? null,
        price: it.sizes?.length ? it.sizes[0].price : it.price!,
        imageUrl: photo,
        category: it.category,
        isVegetarian: true,
        isAvailable: true,
      },
    });
    if (it.sizes?.length) {
      for (const s of it.sizes) {
        await prisma.dishSize.create({ data: { dishId: dish.id, label: s.label, price: s.price } });
      }
    }
    created++;
    registry.push(
      `| ${dish.id} | ${it.name.replace(/\|/g, "/")} | Coffee Xpress | ${it.category} | ${photo || `[NEEDS UNIQUE PHOTO: ${it.name}]`} | ${photo?.includes("pexels") ? "Pexels" : photo?.includes("unsplash") ? "Unsplash" : ""} | ${photo ? photoKey(photo) : ""} | menu card, item detail, cart, checkout | ${photo ? "ok" : "missing"} |`,
    );
  }

  const mdPath = path.join(__dirname, "..", "..", "IMAGE_REGISTRY.md");
  if (fs.existsSync(mdPath)) {
    let md = fs.readFileSync(mdPath, "utf8");
    md = md.replace(/\n## Missing unique real photos[\s\S]*$/, "");
    md += registry.join("\n") + "\n";
    const allMissing = [...(md.match(/- \[NEEDS UNIQUE PHOTO:[^\]]+\]/g) || []), ...missing];
    // rebuild missing from table rows instead
    const missRows = [...md.split("\n").filter((l) => l.includes("NEEDS UNIQUE PHOTO") && l.startsWith("|"))];
    md += "\n## Missing unique real photos\n\n";
    if (!missRows.length && !missing.length) md += "None.\n";
    else {
      for (const row of missRows) {
        const cols = row.split("|").map((c) => c.trim());
        md += `- [NEEDS UNIQUE PHOTO: ${cols[3]} / ${cols[2]}]\n`;
      }
    }
    fs.writeFileSync(mdPath, md.endsWith("\n") ? md : md + "\n");
  }

  console.log(`Seeded ${created} Coffee Xpress dishes`);
  console.log("Missing photos:", missing.length);
  for (const m of missing) console.log(" ", m);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
