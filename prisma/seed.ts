import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const isFresh = process.argv.includes("--fresh");

async function wipe() {
  console.log("Wiping all data...\n");
  await prisma.buyin.deleteMany();
  await prisma.gameEvent.deleteMany();
  await prisma.player.deleteMany();
  await prisma.game.deleteMany();
  await prisma.groupInvite.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  if (isFresh) {
    await wipe();
  }

  console.log("Seeding test data...\n");

  // ── Users ──────────────────────────────────────────────────────────

  const alice = await prisma.user.upsert({
    where: { email: "alice@test.com" },
    update: { name: "Alice Johnson", username: "alice", usernameLower: "alice" },
    create: {
      name: "Alice Johnson",
      email: "alice@test.com",
      username: "alice",
      usernameLower: "alice",
      venmo: "@alice-test",
      zelle: "alice@test.com",
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@test.com" },
    update: { name: "Bob Smith", username: "bob", usernameLower: "bob" },
    create: {
      name: "Bob Smith",
      email: "bob@test.com",
      username: "bob",
      usernameLower: "bob",
      venmo: "@bob-test",
    },
  });

  const charlie = await prisma.user.upsert({
    where: { email: "charlie@test.com" },
    update: { name: "Charlie Kim", username: "charlie", usernameLower: "charlie" },
    create: {
      name: "Charlie Kim",
      email: "charlie@test.com",
      username: "charlie",
      usernameLower: "charlie",
    },
  });

  const diana = await prisma.user.upsert({
    where: { email: "diana@test.com" },
    update: { name: "Diana Reyes", username: "diana", usernameLower: "diana" },
    create: {
      name: "Diana Reyes",
      email: "diana@test.com",
      username: "diana",
      usernameLower: "diana",
      cashapp: "$diana-test",
    },
  });

  const evan = await prisma.user.upsert({
    where: { email: "evan@test.com" },
    update: { name: "Evan Patel", username: "evan_p", usernameLower: "evan_p" },
    create: {
      name: "Evan Patel",
      email: "evan@test.com",
      username: "evan_p",
      usernameLower: "evan_p",
      venmo: "@evan-test",
      paypal: "evan@test.com",
    },
  });

  const fiona = await prisma.user.upsert({
    where: { email: "fiona@test.com" },
    update: { name: "Fiona Chen", username: "fiona", usernameLower: "fiona" },
    create: {
      name: "Fiona Chen",
      email: "fiona@test.com",
      username: "fiona",
      usernameLower: "fiona",
      zelle: "fiona@test.com",
    },
  });

  const greg = await prisma.user.upsert({
    where: { email: "greg@test.com" },
    update: { name: "Greg Novak", username: "greg_n", usernameLower: "greg_n" },
    create: {
      name: "Greg Novak",
      email: "greg@test.com",
      username: "greg_n",
      usernameLower: "greg_n",
    },
  });

  const hana = await prisma.user.upsert({
    where: { email: "hana@test.com" },
    update: { name: "Hana Okafor", username: "hana", usernameLower: "hana" },
    create: {
      name: "Hana Okafor",
      email: "hana@test.com",
      username: "hana",
      usernameLower: "hana",
      cashapp: "$hana-test",
      venmo: "@hana-test",
    },
  });

  const allUsers = [alice, bob, charlie, diana, evan, fiona, greg, hana];
  console.log("Users:", allUsers.map((u) => `${u.name} (@${u.username})`).join(", "));

  // ── Groups ─────────────────────────────────────────────────────────

  // Group 1: Friday Night Poker (6 members + 1 guest)
  let group1 = await prisma.group.findFirst({ where: { name: "Friday Night Poker" } });
  if (!group1) {
    group1 = await prisma.group.create({
      data: {
        name: "Friday Night Poker",
        members: {
          create: [
            { name: "@alice", userId: alice.id, role: "OWNER", venmo: "@alice-test" },
            { name: "@bob", userId: bob.id, role: "ADMIN", venmo: "@bob-test" },
            { name: "@charlie", userId: charlie.id, role: "MEMBER" },
            { name: "@diana", userId: diana.id, role: "MEMBER", cashapp: "$diana-test" },
            { name: "@evan_p", userId: evan.id, role: "MEMBER", venmo: "@evan-test" },
            { name: "@fiona", userId: fiona.id, role: "MEMBER", zelle: "fiona@test.com" },
            { name: "Mike (Guest)", role: "MEMBER" },
          ],
        },
      },
    });
    console.log("Created group: Friday Night Poker");
  } else {
    console.log("Group already exists: Friday Night Poker");
  }

  // Group 2: Heads Up Club (Alice + Bob)
  let group2 = await prisma.group.findFirst({ where: { name: "Heads Up Club" } });
  if (!group2) {
    group2 = await prisma.group.create({
      data: {
        name: "Heads Up Club",
        members: {
          create: [
            { name: "@alice", userId: alice.id, role: "OWNER" },
            { name: "@bob", userId: bob.id, role: "MEMBER" },
          ],
        },
      },
    });
    console.log("Created group: Heads Up Club");
  } else {
    console.log("Group already exists: Heads Up Club");
  }

  // Group 3: High Rollers (Greg owns, Hana + Evan + Diana)
  let group3 = await prisma.group.findFirst({ where: { name: "High Rollers" } });
  if (!group3) {
    group3 = await prisma.group.create({
      data: {
        name: "High Rollers",
        members: {
          create: [
            { name: "@greg_n", userId: greg.id, role: "OWNER" },
            { name: "@hana", userId: hana.id, role: "ADMIN", venmo: "@hana-test" },
            { name: "@evan_p", userId: evan.id, role: "MEMBER" },
            { name: "@diana", userId: diana.id, role: "MEMBER" },
            { name: "Tony (Guest)", role: "MEMBER" },
            { name: "Slim (Guest)", role: "MEMBER" },
          ],
        },
      },
    });
    console.log("Created group: High Rollers");
  } else {
    console.log("Group already exists: High Rollers");
  }

  // Group 4: Sunday Donkaments (Fiona owns, Charlie + Alice + Hana)
  let group4 = await prisma.group.findFirst({ where: { name: "Sunday Donkaments" } });
  if (!group4) {
    group4 = await prisma.group.create({
      data: {
        name: "Sunday Donkaments",
        members: {
          create: [
            { name: "@fiona", userId: fiona.id, role: "OWNER" },
            { name: "@charlie", userId: charlie.id, role: "ADMIN" },
            { name: "@alice", userId: alice.id, role: "MEMBER" },
            { name: "@hana", userId: hana.id, role: "MEMBER" },
          ],
        },
      },
    });
    console.log("Created group: Sunday Donkaments");
  } else {
    console.log("Group already exists: Sunday Donkaments");
  }

  // ── Games ──────────────────────────────────────────────────────────

  // Game 1: Active game in Friday Night Poker
  const g1Members = await prisma.groupMember.findMany({ where: { groupId: group1.id } });

  if (!(await prisma.game.findFirst({ where: { name: "Saturday Session", groupId: group1.id } }))) {
    const game1 = await prisma.game.create({
      data: {
        name: "Saturday Session",
        date: new Date(),
        userId: alice.id,
        groupId: group1.id,
        players: {
          create: g1Members.map((m) => ({
            name: m.name,
            groupMemberId: m.id,
          })),
        },
        events: {
          create: {
            type: "GAME_CREATED",
            actorId: alice.id,
            actorName: "@alice",
            detail: 'Game "Saturday Session" created',
          },
        },
      },
      include: { players: true },
    });

    // Give each player a $100 buyin
    for (const player of game1.players) {
      await prisma.buyin.create({ data: { amount: 100, playerId: player.id } });
    }
    console.log(`Created game: Saturday Session (${game1.players.length} players, active)`);
  } else {
    console.log("Game already exists: Saturday Session");
  }

  // Game 2: Completed game in Friday Night Poker (4 players, balanced ledger)
  if (!(await prisma.game.findFirst({ where: { name: "Last Friday", groupId: group1.id } }))) {
    const fourMembers = g1Members.filter((m) => m.userId !== null).slice(0, 4);
    const game2 = await prisma.game.create({
      data: {
        name: "Last Friday",
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        status: "COMPLETED",
        userId: alice.id,
        groupId: group1.id,
        players: {
          create: fourMembers.map((m) => ({
            name: m.name,
            groupMemberId: m.id,
          })),
        },
        events: {
          create: [
            { type: "GAME_CREATED", actorId: alice.id, actorName: "@alice", detail: 'Game "Last Friday" created' },
            { type: "GAME_COMPLETED", actorId: alice.id, actorName: "@alice", detail: "Game marked as completed" },
          ],
        },
      },
      include: { players: true },
    });

    // Buyins and cashouts that balance out
    const amounts = [
      { buyins: [100, 100], cashout: 250 },
      { buyins: [100], cashout: 40 },
      { buyins: [100, 50], cashout: 120 },
      { buyins: [100], cashout: 90 },
    ];
    for (let i = 0; i < game2.players.length; i++) {
      const p = game2.players[i];
      const a = amounts[i];
      for (const amt of a.buyins) {
        await prisma.buyin.create({ data: { amount: amt, playerId: p.id } });
      }
      await prisma.player.update({ where: { id: p.id }, data: { cashout: a.cashout } });
    }
    console.log("Created game: Last Friday (completed)");
  } else {
    console.log("Game already exists: Last Friday");
  }

  // Game 3: Active game in High Rollers
  const g3Members = await prisma.groupMember.findMany({ where: { groupId: group3.id } });

  if (!(await prisma.game.findFirst({ where: { name: "Wednesday Deep Stack", groupId: group3.id } }))) {
    const game3 = await prisma.game.create({
      data: {
        name: "Wednesday Deep Stack",
        date: new Date(),
        userId: greg.id,
        groupId: group3.id,
        players: {
          create: g3Members.map((m) => ({
            name: m.name,
            groupMemberId: m.id,
          })),
        },
        events: {
          create: {
            type: "GAME_CREATED",
            actorId: greg.id,
            actorName: "@greg_n",
            detail: 'Game "Wednesday Deep Stack" created',
          },
        },
      },
      include: { players: true },
    });

    // $200 buyins for the high rollers
    for (const player of game3.players) {
      await prisma.buyin.create({ data: { amount: 200, playerId: player.id } });
    }
    console.log(`Created game: Wednesday Deep Stack (${game3.players.length} players, active)`);
  } else {
    console.log("Game already exists: Wednesday Deep Stack");
  }

  // Game 4: Completed game in Heads Up Club
  const g2Members = await prisma.groupMember.findMany({ where: { groupId: group2.id } });

  if (!(await prisma.game.findFirst({ where: { name: "HU Match #1", groupId: group2.id } }))) {
    const game4 = await prisma.game.create({
      data: {
        name: "HU Match #1",
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        status: "COMPLETED",
        userId: alice.id,
        groupId: group2.id,
        players: {
          create: g2Members.map((m) => ({
            name: m.name,
            groupMemberId: m.id,
          })),
        },
        events: {
          create: [
            { type: "GAME_CREATED", actorId: alice.id, actorName: "@alice", detail: 'Game "HU Match #1" created' },
            { type: "GAME_COMPLETED", actorId: alice.id, actorName: "@alice", detail: "Game marked as completed" },
          ],
        },
      },
      include: { players: true },
    });

    // Alice wins, Bob loses
    await prisma.buyin.create({ data: { amount: 50, playerId: game4.players[0].id } });
    await prisma.player.update({ where: { id: game4.players[0].id }, data: { cashout: 80 } });
    await prisma.buyin.create({ data: { amount: 50, playerId: game4.players[1].id } });
    await prisma.player.update({ where: { id: game4.players[1].id }, data: { cashout: 20 } });
    console.log("Created game: HU Match #1 (completed)");
  } else {
    console.log("Game already exists: HU Match #1");
  }

  // Game 5: Alice's standalone game (no group)
  if (!(await prisma.game.findFirst({ where: { name: "Home Game", userId: alice.id, groupId: null } }))) {
    const game5 = await prisma.game.create({
      data: {
        name: "Home Game",
        date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        status: "COMPLETED",
        userId: alice.id,
        players: {
          create: [
            { name: "Alice" },
            { name: "Randall" },
            { name: "Steve" },
          ],
        },
        events: {
          create: {
            type: "GAME_CREATED",
            actorId: alice.id,
            actorName: "@alice",
            detail: 'Game "Home Game" created',
          },
        },
      },
      include: { players: true },
    });

    const standaloneAmounts = [
      { buyins: [50], cashout: 80 },
      { buyins: [50], cashout: 40 },
      { buyins: [50, 25], cashout: 55 },
    ];
    for (let i = 0; i < game5.players.length; i++) {
      const p = game5.players[i];
      const a = standaloneAmounts[i];
      for (const amt of a.buyins) {
        await prisma.buyin.create({ data: { amount: amt, playerId: p.id } });
      }
      await prisma.player.update({ where: { id: p.id }, data: { cashout: a.cashout } });
    }
    await prisma.game.update({ where: { id: game5.id }, data: { status: "COMPLETED" } });
    console.log("Created game: Home Game (standalone, completed)");
  } else {
    console.log("Game already exists: Home Game");
  }

  console.log("\nSeeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
