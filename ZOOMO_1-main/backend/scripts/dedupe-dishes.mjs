// One-off cleanup: the dish seed data got duplicated 2-3x per restaurant at
// some point before this session (46 duplicate groups, 101 total dish rows).
// For each (restaurantId, name) group, keep whichever row already has
// OrderItem/CartItem references (or the oldest one if none do), re-point any
// references on the other rows onto the keeper, then delete the duplicates.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const dishes = await prisma.dish.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, restaurantId: true, createdAt: true },
  });

  const groups = new Map();
  for (const d of dishes) {
    const key = `${d.restaurantId}::${d.name}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(d);
  }

  let deleted = 0;
  let reparented = 0;

  for (const [key, rows] of groups) {
    if (rows.length < 2) continue;

    const refCounts = await Promise.all(
      rows.map((r) =>
        Promise.all([
          prisma.orderItem.count({ where: { dishId: r.id } }),
          prisma.cartItem.count({ where: { dishId: r.id } }),
        ]).then(([oi, ci]) => oi + ci),
      ),
    );

    let keeperIdx = 0;
    const maxRefs = Math.max(...refCounts);
    if (maxRefs > 0) {
      keeperIdx = refCounts.indexOf(maxRefs);
    } // else keeperIdx stays 0 = oldest row (rows are ordered by createdAt asc)

    const keeper = rows[keeperIdx];
    const losers = rows.filter((_, i) => i !== keeperIdx);

    for (const loser of losers) {
      const oiRes = await prisma.orderItem.updateMany({
        where: { dishId: loser.id },
        data: { dishId: keeper.id },
      });
      const ciRes = await prisma.cartItem.updateMany({
        where: { dishId: loser.id },
        data: { dishId: keeper.id },
      });
      reparented += oiRes.count + ciRes.count;

      await prisma.dish.delete({ where: { id: loser.id } });
      deleted++;
    }

    console.log(`${key}: kept ${keeper.id}, deleted ${losers.length}`);
  }

  console.log(`\nDone. Deleted ${deleted} duplicate dish rows, re-parented ${reparented} order/cart item references.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
