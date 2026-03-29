-- CreateEnum
CREATE TYPE "GameEventType" AS ENUM ('GAME_CREATED', 'GAME_COMPLETED', 'PLAYER_ADDED', 'PLAYER_REMOVED', 'BUYIN_ADDED', 'BUYIN_REMOVED', 'CASHOUT_SET', 'CASHOUT_CHANGED', 'CASHOUT_CLEARED');

-- CreateTable
CREATE TABLE "GameEvent" (
    "id" TEXT NOT NULL,
    "type" "GameEventType" NOT NULL,
    "gameId" TEXT NOT NULL,
    "playerName" TEXT,
    "detail" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GameEvent_gameId_createdAt_idx" ON "GameEvent"("gameId", "createdAt");

-- AddForeignKey
ALTER TABLE "GameEvent" ADD CONSTRAINT "GameEvent_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
