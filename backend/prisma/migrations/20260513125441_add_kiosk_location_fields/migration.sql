-- AlterTable
ALTER TABLE "kiosks" ADD COLUMN     "city" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "postal_code" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "province" TEXT NOT NULL DEFAULT '';
