-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "returnReason" TEXT,
ADD COLUMN     "returnRequestedAt" TIMESTAMP(3),
ADD COLUMN     "returnStatus" TEXT;
