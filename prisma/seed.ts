import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding test data...\n");

  // 1. Create test users
  const alice = await prisma.user.upsert({
    where: { email: "alice@test.com" },
    update: { name: "Alice" },
    create: { name: "Alice", email: "alice@test.com", venmo: "@alice-test" },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@test.com" },
    update: { name: "Bob" },
    create: { name: "Bob", email: "bob@test.com", venmo: "@bob-test" },
  });

  const charlie = await prisma.user.upsert({
    where: { email: "charlie@test.com" },
    update: { name: "Charlie" },
    create: { name: "Charlie", email: "charlie@test.com" },
  });

  const diana = await prisma.user.upsert({
    where: { email: "diana@test.com" },
    update: { name: "Diana" },
    create: { name: "Diana", email: "diana@test.com", cashapp: "$diana-test" },
  });

  console.log(
    "Users:",
    [alice, bob, charlie, diana].map((u) => u.name).join(", ")
  );

  // 2. Create "Friday Night Poker" group
  const existingGroup = await prisma.group.findFirst({
    where: { name: "Friday Night Poker" },
  });

  let group;
  if (existingGroup) {
    group = existingGroup;
    console.log("Group already exists:", group.name);
  } else {
    group = await prisma.group.create({
      data: {
        name: "Friday Night Poker",
        members: {
          create: [
            { name: "Alice", userId: alice.id, role: "OWNER" },
            { name: "Bob", userId: bob.id, role: "ADMIN" },
            { name: "Charlie", userId: charlie.id, role: "MEMBER" },
            { name: "Diana", userId: diana.id, role: "MEMBER" },
          ],
        },
      },
      include: { members: true },
    });
    console.log(
      "Created group:",
      group.name,
      "with",
      group.members.length,
      "members"
    );
  }

  // 3. Create a sample active game in the group
  const members = await prisma.groupMember.findMany({
    where: { groupId: group.id },
  });

  const existingGame = await prisma.game.findFirst({
    where: { name: "Saturday Session", groupId: group.id },
  });

  if (!existingGame) {
    const game = await prisma.game.create({
      data: {
        name: "Saturday Session",
        date: new Date(),
        userId: alice.id,
        groupId: group.id,
        players: {
          create: members.map((m) => ({
            name: m.name,
            groupMemberId: m.id,
          })),
        },
      },
      include: { players: true },
    });

    for (const player of game.players) {
      await prisma.buyin.create({
        data: { amount: 100, playerId: player.id },
      });
    }

    console.log(
      "Created game:",
      game.name,
      "with",
      game.players.length,
      "players (100 buy-in each)"
    );
  } else {
    console.log("Game already exists:", existingGame.name);
  }

  // 4. Create a second group with just Alice and Bob
  const existingGroup2 = await prisma.group.findFirst({
    where: { name: "Heads Up Club" },
  });

  if (!existingGroup2) {
    await prisma.group.create({
      data: {
        name: "Heads Up Club",
        members: {
          create: [
            { name: "Alice", userId: alice.id, role: "OWNER" },
            { name: "Bob", userId: bob.id, role: "MEMBER" },
          ],
        },
      },
    });
    console.log("Created group: Heads Up Club");
  } else {
    console.log("Group already exists: Heads Up Club");
  }

  console.log("\nSeeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
