-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "distanceKm" DOUBLE PRECISION,
ADD COLUMN     "driverCommission" DOUBLE PRECISION,
ADD COLUMN     "platformFee" DOUBLE PRECISION,
ADD COLUMN     "restaurantEarning" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "recipientType" TEXT NOT NULL,
    "note" TEXT,
    "payoutDetail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "restaurantId" TEXT,
    "driverId" TEXT,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;
