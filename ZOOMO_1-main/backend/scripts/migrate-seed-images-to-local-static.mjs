// One-off migration: Restaurant.imageUrl / Dish.imageUrl in seed data are
// bare relative paths (e.g. "/cheese-pizza.webp") that only resolve on
// whichever single frontend origin happens to have that file in its own
// public/ folder — broken on every other portal (admin, merchant, driver),
// and broken in production entirely since each app deploys to its own
// domain. The actual image files were copied into backend/public/static/
// (served at BACKEND_PUBLIC_URL/static/<file> — see main.ts) — this
// rewrites every row to that absolute URL, which resolves identically from
// any origin. Cloudinary (the real production media host, already used for
// user uploads) wasn't usable here — .env only has placeholder credentials.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE = (process.env.BACKEND_PUBLIC_URL || "http://localhost:3000").replace(/\/$/, "");

function isLocalPath(url) {
  return !!url && !url.startsWith("http://") && !url.startsWith("https://");
}

async function migrate(model, label) {
  const rows = await prisma[model].findMany({ select: { id: true, imageUrl: true } });
  const localRows = rows.filter((r) => isLocalPath(r.imageUrl));
  console.log(`${label}: ${localRows.length} of ${rows.length} rows have a local imageUrl`);

  let updated = 0;
  for (const row of localRows) {
    const filename = row.imageUrl.replace(/^\//, "");
    const url = `${BASE}/static/${encodeURIComponent(filename)}`;
    await prisma[model].update({ where: { id: row.id }, data: { imageUrl: url } });
    updated++;
  }
  console.log(`${label}: updated ${updated} rows`);
}

async function main() {
  await migrate("restaurant", "Restaurant");
  await migrate("dish", "Dish");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
