-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('DELIVERY', 'PICKUP');

-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "dishSizeId" TEXT;

-- AlterTable
ALTER TABLE "Dish" ADD COLUMN     "category" TEXT;

-- AlterTable
ALTER TABLE "Driver" ADD COLUMN     "rating" DOUBLE PRECISION DEFAULT 4.8;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "dropOffNote" TEXT,
ADD COLUMN     "dropOffPreference" TEXT DEFAULT 'MEET_DOOR',
ADD COLUMN     "gatePingAt" TIMESTAMP(3),
ADD COLUMN     "orderType" "OrderType" NOT NULL DEFAULT 'DELIVERY',
ADD COLUMN     "rating" INTEGER;

-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "costForTwo" INTEGER,
ADD COLUMN     "etaMin" INTEGER;

-- CreateTable
CREATE TABLE "DishSize" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "dishId" TEXT NOT NULL,

    CONSTRAINT "DishSize_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DishSize" ADD CONSTRAINT "DishSize_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "Dish"("id") ON DELETE CASCADE ON UPDATE CASCADE;

