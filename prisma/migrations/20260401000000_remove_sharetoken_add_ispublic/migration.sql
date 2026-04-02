-- DropIndex
DROP INDEX "Game_shareToken_idx";

-- DropIndex
DROP INDEX "Game_shareToken_key";

-- AlterTable
ALTER TABLE "Game" DROP COLUMN "shareToken",
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;
