-- AlterTable
ALTER TABLE "Game" ADD COLUMN "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Game_slug_key" ON "Game"("slug");
