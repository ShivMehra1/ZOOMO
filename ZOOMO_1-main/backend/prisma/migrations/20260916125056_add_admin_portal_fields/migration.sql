-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "refundAmount" DOUBLE PRECISION,
ADD COLUMN     "refundedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "isApproved" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isSuspended" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mustResetPassword" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "suspendedReason" TEXT;

