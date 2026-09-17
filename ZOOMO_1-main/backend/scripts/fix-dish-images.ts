import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const U = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=80`;

// Pools gathered per food concept, all verified working (200). Each pool has
// enough entries that dishes in the same category, within the same
// restaurant, don't repeat a photo.
const POOL: Record<string, string[]> = {
  PIZZA: ["1513104890138-7c749659a591", "1565299624946-b28f40a0ae38", "1604382354936-07c5d9983bd3", "1593504049359-74330189a345", "1613564834361-9436948817d1", "1574071318508-1cdbab80d002", "1534308983496-4fabb1a015ee", "1579751626657-72bc17010498", "1593560708920-61dd98c46a4e", "1594007654729-407eedc4be65", "1571997478779-2adcbbe9ab2f", "1628840042765-356cda07504e", "1571066811602-716837d681de", "1611915365928-565c527a0590", "1555072956-7758afb20e8f"],
  BURGER: ["1568901346375-23c9450c58cd", "1520072959219-c595dc870360", "1586190848861-99aa4a171e90", "1572802419224-296b0aeee0d9", "1610440042657-612c34d95e9f", "1550547660-d9450f859349", "1571091718767-18b5b1457add", "1603064752734-4c48eff53d05", "1607013251379-e6eecfffe234", "1713330801172-03f8d1c0dde7", "1549611016-3a70d82b5040", "1551782450-a2132b4ba21d", "1633424234673-c8cd0f4df77b", "1625813506062-0aeb1d7a094b", "1667329829058-ac191ba4a905"],
  SANDWICH: ["1528735602780-2552fd46c7af", "1553909489-cd47e0907980", "1539252554453-80ab65ce3586", "1655279562015-047c3da9a271", "1509722747041-616f39b57569", "1587015566802-5dc157c901cf", "1481070414801-51fd732d7184", "1554433607-66b5efe9d304", "1496113269490-84ffe1a410cb", "1540713434306-58505cf1b6fc", "1528736235302-52922df5c122", "1619096252214-ef06c45683e3", "1559054663-e8d23213f55c", "1592415486689-125cbbfcbee2", "1559466273-d95e72debaf8"],
  PASTA: ["1621996346565-e3dbc646d9a9", "1611270629569-8b357cb88da9", "1556761223-4c4282c73f77", "1546549032-9571cd6b27df", "1598720290281-9f26ae6d6f81", "1600803907087-f56d462fd26b", "1551892374-ecf8754cf8b0", "1551462147-ff29053bfc14", "1627042633145-b780d842ba45", "1608897013039-887f21d8c804", "1516100882582-96c3a05fe590", "1598866594230-a7c12756260f", "1612966893103-790e549a2ab1", "1473093226795-af9932fe5856", "1587682725980-b9ac16626266"],
  MOJITO: ["1551538827-9c037cb4f32a", "1618130070080-91f4d55a2383", "1588908933351-eeb8cd4c4521", "1580716937776-6196d257ee3d", "1561407958-54aa9fa49a21", "1653542772393-71ffa417b1c4", "1609345265499-2133bbeb6ce5", "1659046842567-2787b5c9c2fe", "1632995561645-86a7777d3e7a", "1623593688280-a5aec8ac4ae7", "1513558161293-cdaf765ed2fd", "1631067451074-27e2826ec83b", "1679061583335-c8be1c6209f6", "1568608275764-7a16d7fdfc56", "1609486961058-cbfe79e35cbf"],
  MILKSHAKE: ["1572490122747-3968b75cc699", "1553787499-6f9133860278", "1577805947697-89e18249d767", "1579954115545-a95591f28bfc", "1611928237590-087afc90c6fd", "1568901839119-631418a3910d", "1594488506255-a8bbfdeedbaf", "1619158403521-ed9795026d47", "1641665271888-575e46923776", "1600718374662-0483d2b9da44", "1624781740834-fbfbf5fd221a", "1619158401201-8fa932695178", "1678712803863-6cd22f6b9dba", "1663721206074-02fb7b026da8", "1571328003758-4a3921661729"],
  ICED_TEA: ["1571934811356-5cc061b6821f", "1556679343-c7306c1976bc", "1533007716222-4b465613a984", "1499638673689-79a0b5115d87", "1544241907-f3f1f5ded15a", "1656936637945-571e3f0893f9", "1601390395693-364c0e22031a", "1499961024600-ad094db305cc", "1654923064639-834d2bf32716", "1470752354724-60a1d2b1907f", "1544418749-94b09b11e93f", "1656936632096-59fcacae533f", "1713949215254-9769b4ad8724", "1656936599916-c009ade6e7da", "1656936632107-0bfa69ea06de", "1656936611703-a1ede070073c"],
  COFFEE: ["1461023058943-07fcbe16d735", "1511920170033-f8396924c348", "1517701550927-30cf4ba1dba5", "1562447457-579fc34967fb", "1549652127-2e5e59e86a7a", "1578314675249-a6910f80cc4e", "1558122104-355edad709f6", "1642647391072-6a2416f048e5", "1527156231393-7023794f363c", "1641659736749-8bbae305e475", "1621221814951-fa755dd0c993", "1589985902809-39d25db22101", "1592663527359-cf6642f54cff", "1504753793650-d4a2b783c15e"],
  FRIES: ["1576107232684-1279f390859f", "1573080496219-bb080dd4f877", "1598679253544-2c97992403ea", "1630431341973-02e1b662ec35", "1688978181542-87a886a16fbe", "1606755456206-b25206cde27e", "1598998834333-c0b91bc9b2a3", "1630431341636-999a7e047f3b", "1550259114-ad7188f0a967", "1665117861973-fffa50c1afec", "1639744210631-209fce3e256c", "1630431341771-1ceb084d6607", "1647705195905-671a25be159d", "1630431343596-dadee2180ba1"],
  MOMOS: ["1534422298391-e4f8c172dddb", "1694923450868-b432a8ee52aa", "1625220194771-7ebdea0b70b9", "1589047133481-02b4a5327d89", "1496116218417-1a781b1c416c", "1638502338747-f7f368214cce", "1604632910985-5a738e3237d2", "1563245372-f21724e3856d", "1543198432-a20fa3055570", "1650977399594-504c2aa27b3b", "1626322751504-930506dd41ca", "1664138218128-2dcf791a9d27", "1664990035720-faac522df41f", "1647999019630-dabe1a837693"],
  WRAP: ["1626700051175-6818013e1d4f", "1646530208887-8a791bff4701", "1562059390-a761a084768e", "1666819615040-eff5e52c778a", "1585238342107-49a3cdace47f", "1611671310207-2374ec7b1889", "1584947897804-408958123f1d", "1584947897558-4ee278fbbddf", "1665469222949-3de88d37ee5a", "1632660346941-023cc64e1252", "1563282397-db1ac3a6bf86", "1631021967255-898a52176fea", "1592044903782-9836f74027c0"],
  KEBAB: ["1606491956689-2ea866880c84", "1666001120694-3ebe8fd207be", "1599487488170-d11ec9c172f0", "1605908580297-f3e1c02e64ff", "1696950171387-dc808171711e", "1588134431154-a2023e99103f", "1696950172070-f510bde7f60b", "1592036219795-8533b3c132af", "1562723856-f7c8a24f1eaf"],
  // Existing verified catalog entries, reused for categories without a fresh search pool
  MISC_SAVORY: ["1504674900247-0877df9cc836", "1567188040759-fb8a883dc6d8", "1585937421612-70a008356fbe", "1601050690597-df0568f70950", "1608039755401-742074f0548d", "1603133872878-684f208fb84b", "1585032226651-759b368d7246", "1512621776951-a57141f2eefd"],
  MISC_SWEET: ["1578985545062-69928b1d9587", "1606313564200-e75d5e30476c", "1497034825429-c343d7c6a68f", "1571877227200-a0d98ea607e9"],
  SOUP: ["1547592166-23ac45744acd", "1547592166-23ac45744acd"],
};

// Map each (restaurant, category) to a pool name.
const CATEGORY_POOL: Record<string, string> = {
  // I Love Pizza + Moonlight Cafe + In The Hood Cafe share these category names
  Pizza: "PIZZA",
  "Kulhad Pizza": "PIZZA",
  Burger: "BURGER",
  "Grilled Burger": "BURGER",
  Sandwich: "SANDWICH",
  Sandwiches: "SANDWICH",
  Bites: "SANDWICH",
  Pasta: "PASTA",
  Mocktails: "MOJITO",
  Mojito: "MOJITO",
  Shakes: "MILKSHAKE",
  "Milk Shakes": "MILKSHAKE",
  "Ice Tea": "ICED_TEA",
  "Ice Crusher": "ICED_TEA",
  Lassi: "ICED_TEA",
  "Cold Drink": "ICED_TEA",
  "Masala Lemonade": "MOJITO",
  Frappe: "COFFEE",
  "Cold Coffee": "COFFEE",
  "Hot Coffee": "COFFEE",
  "Hot Drinks": "COFFEE",
  "Hot Chocolate": "COFFEE",
  Chai: "ICED_TEA",
  Fries: "FRIES",
  Wrap: "WRAP",
  Wraps: "WRAP",
  "Special Momos": "MOMOS",
  "Chinese Bites": "MOMOS",
  Manchurian: "MOMOS",
  Chaap: "KEBAB",
  Tacos: "KEBAB",
  "Pav Bhaji": "KEBAB",
  "Spring Roll": "MISC_SAVORY",
  Dip: "MISC_SAVORY",
  Extras: "MISC_SAVORY",
  Snacks: "MISC_SAVORY",
  "Garlic Bread": "MISC_SAVORY",
  Garlic: "MISC_SAVORY",
  Maggie: "MISC_SAVORY",
  "Healthy Feast": "MISC_SAVORY",
  "Combo Special": "MISC_SAVORY",
  Dessert: "MISC_SWEET",
  Soup: "SOUP",
};

// All distinct photo ids, deduped, for the global fallback layer.
const ALL_IDS = Array.from(new Set(Object.values(POOL).flat()));

async function main() {
  const restaurants = await prisma.restaurant.findMany({
    include: { dishes: { orderBy: { id: "asc" } } },
  });

  let totalUpdated = 0;
  for (const r of restaurants) {
    const byCategory = new Map<string, typeof r.dishes>();
    for (const d of r.dishes) {
      const cat = d.category ?? "Uncategorized";
      if (!byCategory.has(cat)) byCategory.set(cat, []);
      byCategory.get(cat)!.push(d);
    }

    // Never reuse a photo within the same restaurant, even across categories.
    const usedInRestaurant = new Set<string>();
    const pickUnused = (preferred: string[]): string => {
      for (const id of preferred) if (!usedInRestaurant.has(id)) return id;
      for (const id of ALL_IDS) if (!usedInRestaurant.has(id)) return id;
      // Pool exhausted (restaurant has more dishes than we have distinct
      // photos for) — reuse is unavoidable at that point.
      return preferred[0] ?? ALL_IDS[0];
    };

    for (const [cat, dishes] of byCategory) {
      const poolName = CATEGORY_POOL[cat];
      const pool = poolName ? POOL[poolName] : ALL_IDS;
      if (!poolName) console.warn(`No pool for category "${cat}" in ${r.name} (${dishes.length} dishes) — using global pool`);
      for (const dish of dishes) {
        const id = pickUnused(pool);
        usedInRestaurant.add(id);
        await prisma.dish.update({ where: { id: dish.id }, data: { imageUrl: U(id) } });
        totalUpdated++;
      }
    }
  }
  console.log(`Updated ${totalUpdated} dish images`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
