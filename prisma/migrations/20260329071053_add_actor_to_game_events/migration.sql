-- AlterTable
ALTER TABLE "GameEvent" ADD COLUMN     "actorId" TEXT,
ADD COLUMN     "actorName" TEXT;

-- CreateIndex
CREATE INDEX "GameEvent_actorId_idx" ON "GameEvent"("actorId");

-- AddForeignKey
ALTER TABLE "GameEvent" ADD CONSTRAINT "GameEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
