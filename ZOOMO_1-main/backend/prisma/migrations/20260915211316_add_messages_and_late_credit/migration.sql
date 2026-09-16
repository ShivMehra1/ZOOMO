-- CreateEnum
CREATE TYPE "MessageSender" AS ENUM ('CUSTOMER', 'DRIVER');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "lateCreditApplied" DOUBLE PRECISION,
ADD COLUMN     "promisedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "OrderMessage" (
    "id" TEXT NOT NULL,
    "sender" "MessageSender" NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orderId" TEXT NOT NULL,

    CONSTRAINT "OrderMessage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OrderMessage" ADD CONSTRAINT "OrderMessage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

