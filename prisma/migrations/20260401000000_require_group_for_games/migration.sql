-- Delete all standalone games (games without a group).
-- Players, buyins, and game events cascade-delete via existing FK constraints.
DELETE FROM "Game" WHERE "groupId" IS NULL;

-- Change groupId from optional to required and switch onDelete from SET NULL to CASCADE.
ALTER TABLE "Game" DROP CONSTRAINT "Game_groupId_fkey";
ALTER TABLE "Game" ALTER COLUMN "groupId" SET NOT NULL;
ALTER TABLE "Game" ADD CONSTRAINT "Game_groupId_fkey"
  FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
