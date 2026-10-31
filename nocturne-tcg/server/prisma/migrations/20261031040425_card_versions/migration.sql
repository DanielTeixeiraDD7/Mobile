-- AlterEnum
ALTER TYPE "Variant" ADD VALUE 'FULL_ART';

-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "baseCode" TEXT;

-- AlterTable
ALTER TABLE "PackType" ADD COLUMN     "reverseChance" INTEGER NOT NULL DEFAULT 15000;

-- AlterTable
ALTER TABLE "PullCard" ADD COLUMN     "reverse" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "UserCard" ADD COLUMN     "reverseQty" INTEGER NOT NULL DEFAULT 0;
