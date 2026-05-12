-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'MIXTO';

-- AlterTable
ALTER TABLE "sales" ADD COLUMN "payments" JSONB;
