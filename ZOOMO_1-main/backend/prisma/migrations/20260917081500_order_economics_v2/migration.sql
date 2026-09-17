-- AlterEnum
ALTER TYPE "OrderType" ADD VALUE 'DINE_IN';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "kmSlab" TEXT;
