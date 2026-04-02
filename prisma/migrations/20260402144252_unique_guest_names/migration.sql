-- Deduplicate existing guest names (append " (2)", " (3)", etc.)
WITH dupes AS (
  SELECT id, "groupId", lower("name") AS lname,
         ROW_NUMBER() OVER (PARTITION BY "groupId", lower("name") ORDER BY "createdAt") AS rn
  FROM "GroupMember"
  WHERE "userId" IS NULL
)
UPDATE "GroupMember" SET "name" = "GroupMember"."name" || ' (' || dupes.rn || ')'
FROM dupes
WHERE "GroupMember".id = dupes.id AND dupes.rn > 1;

-- Partial unique index: only guests (userId IS NULL), case-insensitive
CREATE UNIQUE INDEX "GroupMember_guest_name_unique"
ON "GroupMember" ("groupId", lower("name"))
WHERE "userId" IS NULL;
