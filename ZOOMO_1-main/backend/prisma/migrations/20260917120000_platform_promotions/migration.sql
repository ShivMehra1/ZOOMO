-- Platform-wide promo codes (ZOOMO50, FREESHIP, NEWUSER) live in the same
-- Promotion table as merchant codes. restaurantId is now optional.

ALTER TABLE "Promotion" ALTER COLUMN "restaurantId" DROP NOT NULL;

-- Postgres unique indexes allow duplicate NULLs, so without this you could
-- insert two platform rows with the same code.
CREATE UNIQUE INDEX "Promotion_platform_code_key" ON "Promotion" ("code") WHERE "restaurantId" IS NULL;
