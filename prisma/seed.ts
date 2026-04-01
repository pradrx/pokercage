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

  // ── Bulk Games (stress-test volume) ───────────────────────────────

  const gameTemplates: {
    name: string;
    groupId: string;
    ownerId: string;
    ownerName: string;
    daysAgo: number;
    status: "ACTIVE" | "COMPLETED";
    buyin: number;
    playerCount: number;
  }[] = [
    // Friday Night Poker (group1) — 26 bulk games (~28 total with hand-crafted)
    { name: "New Year's Kickoff",         groupId: group1.id, ownerId: alice.id,   ownerName: "@alice",   daysAgo: 180, status: "COMPLETED", buyin: 100, playerCount: 5 },
    { name: "MLK Weekend Game",           groupId: group1.id, ownerId: bob.id,     ownerName: "@bob",     daysAgo: 170, status: "COMPLETED", buyin: 50,  playerCount: 6 },
    { name: "Blizzard Poker",             groupId: group1.id, ownerId: alice.id,   ownerName: "@alice",   daysAgo: 160, status: "COMPLETED", buyin: 75,  playerCount: 4 },
    { name: "Groundhog Day Special",      groupId: group1.id, ownerId: charlie.id, ownerName: "@charlie", daysAgo: 150, status: "COMPLETED", buyin: 100, playerCount: 7 },
    { name: "Pre-Super Bowl Warmup",      groupId: group1.id, ownerId: alice.id,   ownerName: "@alice",   daysAgo: 140, status: "COMPLETED", buyin: 100, playerCount: 5 },
    { name: "Super Bowl Sunday",          groupId: group1.id, ownerId: alice.id,   ownerName: "@alice",   daysAgo: 130, status: "COMPLETED", buyin: 75,  playerCount: 7 },
    { name: "Presidents' Day Game",       groupId: group1.id, ownerId: bob.id,     ownerName: "@bob",     daysAgo: 120, status: "COMPLETED", buyin: 100, playerCount: 5 },
    { name: "Leap Year Special",          groupId: group1.id, ownerId: alice.id,   ownerName: "@alice",   daysAgo: 110, status: "COMPLETED", buyin: 50,  playerCount: 6 },
    { name: "Valentine's Day Poker",      groupId: group1.id, ownerId: bob.id,     ownerName: "@bob",     daysAgo: 100, status: "COMPLETED", buyin: 50,  playerCount: 5 },
    { name: "March Madness Game",         groupId: group1.id, ownerId: alice.id,   ownerName: "@alice",   daysAgo: 90,  status: "COMPLETED", buyin: 100, playerCount: 6 },
    { name: "St. Patrick's Day Poker",    groupId: group1.id, ownerId: evan.id,    ownerName: "@evan_p",  daysAgo: 80,  status: "COMPLETED", buyin: 75,  playerCount: 5 },
    { name: "Spring Forward Game",        groupId: group1.id, ownerId: alice.id,   ownerName: "@alice",   daysAgo: 70,  status: "COMPLETED", buyin: 100, playerCount: 6 },
    { name: "April Fools Session",        groupId: group1.id, ownerId: charlie.id, ownerName: "@charlie", daysAgo: 60,  status: "COMPLETED", buyin: 100, playerCount: 5 },
    { name: "Tax Day Tilt",              groupId: group1.id, ownerId: alice.id,   ownerName: "@alice",   daysAgo: 55,  status: "COMPLETED", buyin: 50,  playerCount: 7 },
    { name: "Friday the 13th",           groupId: group1.id, ownerId: charlie.id, ownerName: "@charlie", daysAgo: 45,  status: "COMPLETED", buyin: 100, playerCount: 5 },
    { name: "Memorial Day Weekend",      groupId: group1.id, ownerId: bob.id,     ownerName: "@bob",     daysAgo: 40,  status: "COMPLETED", buyin: 100, playerCount: 6 },
    { name: "Summer Kickoff",            groupId: group1.id, ownerId: alice.id,   ownerName: "@alice",   daysAgo: 35,  status: "COMPLETED", buyin: 75,  playerCount: 5 },
    { name: "Turbo Tuesday",             groupId: group1.id, ownerId: alice.id,   ownerName: "@alice",   daysAgo: 28,  status: "COMPLETED", buyin: 50,  playerCount: 4 },
    { name: "Bounty Night",              groupId: group1.id, ownerId: bob.id,     ownerName: "@bob",     daysAgo: 21,  status: "COMPLETED", buyin: 100, playerCount: 6 },
    { name: "Fourth of July Bash",       groupId: group1.id, ownerId: alice.id,   ownerName: "@alice",   daysAgo: 16,  status: "COMPLETED", buyin: 100, playerCount: 7 },
    { name: "Mid-July Grind",            groupId: group1.id, ownerId: fiona.id,   ownerName: "@fiona",   daysAgo: 12,  status: "COMPLETED", buyin: 50,  playerCount: 5 },
    { name: "Late Night Grind",          groupId: group1.id, ownerId: alice.id,   ownerName: "@alice",   daysAgo: 8,   status: "COMPLETED", buyin: 100, playerCount: 5 },
    { name: "Weekend Warmup",            groupId: group1.id, ownerId: bob.id,     ownerName: "@bob",     daysAgo: 5,   status: "COMPLETED", buyin: 75,  playerCount: 6 },
    { name: "Midweek Madness",           groupId: group1.id, ownerId: alice.id,   ownerName: "@alice",   daysAgo: 3,   status: "ACTIVE",    buyin: 100, playerCount: 5 },
    { name: "Last Night's Game",         groupId: group1.id, ownerId: charlie.id, ownerName: "@charlie", daysAgo: 1,   status: "ACTIVE",    buyin: 100, playerCount: 6 },
    { name: "This Week's Game",          groupId: group1.id, ownerId: alice.id,   ownerName: "@alice",   daysAgo: 0,   status: "ACTIVE",    buyin: 100, playerCount: 6 },

    // Heads Up Club (group2) — 14 bulk games (~15 total)
    { name: "HU Match #2",              groupId: group2.id, ownerId: alice.id, ownerName: "@alice", daysAgo: 150, status: "COMPLETED", buyin: 50,  playerCount: 2 },
    { name: "HU Match #3",              groupId: group2.id, ownerId: bob.id,   ownerName: "@bob",   daysAgo: 140, status: "COMPLETED", buyin: 100, playerCount: 2 },
    { name: "HU Match #4",              groupId: group2.id, ownerId: alice.id, ownerName: "@alice", daysAgo: 125, status: "COMPLETED", buyin: 75,  playerCount: 2 },
    { name: "HU Match #5",              groupId: group2.id, ownerId: bob.id,   ownerName: "@bob",   daysAgo: 110, status: "COMPLETED", buyin: 50,  playerCount: 2 },
    { name: "HU Match #6",              groupId: group2.id, ownerId: alice.id, ownerName: "@alice", daysAgo: 95,  status: "COMPLETED", buyin: 100, playerCount: 2 },
    { name: "HU Match #7",              groupId: group2.id, ownerId: bob.id,   ownerName: "@bob",   daysAgo: 80,  status: "COMPLETED", buyin: 50,  playerCount: 2 },
    { name: "HU Match #8",              groupId: group2.id, ownerId: alice.id, ownerName: "@alice", daysAgo: 65,  status: "COMPLETED", buyin: 75,  playerCount: 2 },
    { name: "HU Match #9",              groupId: group2.id, ownerId: bob.id,   ownerName: "@bob",   daysAgo: 50,  status: "COMPLETED", buyin: 100, playerCount: 2 },
    { name: "HU Match #10",             groupId: group2.id, ownerId: alice.id, ownerName: "@alice", daysAgo: 38,  status: "COMPLETED", buyin: 50,  playerCount: 2 },
    { name: "HU Match #11",             groupId: group2.id, ownerId: bob.id,   ownerName: "@bob",   daysAgo: 28,  status: "COMPLETED", buyin: 100, playerCount: 2 },
    { name: "HU Match #12",             groupId: group2.id, ownerId: alice.id, ownerName: "@alice", daysAgo: 18,  status: "COMPLETED", buyin: 75,  playerCount: 2 },
    { name: "HU Match #13",             groupId: group2.id, ownerId: bob.id,   ownerName: "@bob",   daysAgo: 10,  status: "COMPLETED", buyin: 50,  playerCount: 2 },
    { name: "HU Match #14",             groupId: group2.id, ownerId: alice.id, ownerName: "@alice", daysAgo: 4,   status: "ACTIVE",    buyin: 100, playerCount: 2 },
    { name: "HU Match #15",             groupId: group2.id, ownerId: bob.id,   ownerName: "@bob",   daysAgo: 0,   status: "ACTIVE",    buyin: 50,  playerCount: 2 },

    // High Rollers (group3) — 21 bulk games (~22 total)
    { name: "PLO Night",                groupId: group3.id, ownerId: greg.id, ownerName: "@greg_n", daysAgo: 175, status: "COMPLETED", buyin: 500, playerCount: 5 },
    { name: "Nosebleed Session",         groupId: group3.id, ownerId: greg.id, ownerName: "@greg_n", daysAgo: 165, status: "COMPLETED", buyin: 300, playerCount: 4 },
    { name: "The Big Game",              groupId: group3.id, ownerId: hana.id, ownerName: "@hana",   daysAgo: 155, status: "COMPLETED", buyin: 500, playerCount: 6 },
    { name: "High Stakes Frenzy",        groupId: group3.id, ownerId: greg.id, ownerName: "@greg_n", daysAgo: 145, status: "COMPLETED", buyin: 400, playerCount: 5 },
    { name: "Sunday High Roller",        groupId: group3.id, ownerId: hana.id, ownerName: "@hana",   daysAgo: 135, status: "COMPLETED", buyin: 300, playerCount: 4 },
    { name: "PLO Night II",             groupId: group3.id, ownerId: greg.id, ownerName: "@greg_n", daysAgo: 125, status: "COMPLETED", buyin: 500, playerCount: 5 },
    { name: "Bankroll Builder",          groupId: group3.id, ownerId: hana.id, ownerName: "@hana",   daysAgo: 115, status: "COMPLETED", buyin: 200, playerCount: 6 },
    { name: "Shot Clock Poker",          groupId: group3.id, ownerId: greg.id, ownerName: "@greg_n", daysAgo: 105, status: "COMPLETED", buyin: 200, playerCount: 5 },
    { name: "Whale Watch",              groupId: group3.id, ownerId: hana.id, ownerName: "@hana",   daysAgo: 95,  status: "COMPLETED", buyin: 500, playerCount: 4 },
    { name: "Saturday Highstakes",       groupId: group3.id, ownerId: greg.id, ownerName: "@greg_n", daysAgo: 85,  status: "COMPLETED", buyin: 400, playerCount: 5 },
    { name: "The Gauntlet",             groupId: group3.id, ownerId: greg.id, ownerName: "@greg_n", daysAgo: 75,  status: "COMPLETED", buyin: 300, playerCount: 6 },
    { name: "PLO Night III",            groupId: group3.id, ownerId: hana.id, ownerName: "@hana",   daysAgo: 65,  status: "COMPLETED", buyin: 500, playerCount: 5 },
    { name: "Deep Stack Showdown",       groupId: group3.id, ownerId: greg.id, ownerName: "@greg_n", daysAgo: 55,  status: "COMPLETED", buyin: 200, playerCount: 4 },
    { name: "Nosebleed Session II",      groupId: group3.id, ownerId: hana.id, ownerName: "@hana",   daysAgo: 45,  status: "COMPLETED", buyin: 300, playerCount: 5 },
    { name: "The Big Game II",           groupId: group3.id, ownerId: greg.id, ownerName: "@greg_n", daysAgo: 38,  status: "COMPLETED", buyin: 500, playerCount: 6 },
    { name: "High Stakes Frenzy II",     groupId: group3.id, ownerId: hana.id, ownerName: "@hana",   daysAgo: 30,  status: "COMPLETED", buyin: 400, playerCount: 5 },
    { name: "Roller Coaster Night",      groupId: group3.id, ownerId: greg.id, ownerName: "@greg_n", daysAgo: 22,  status: "COMPLETED", buyin: 300, playerCount: 4 },
    { name: "PLO Night IV",             groupId: group3.id, ownerId: hana.id, ownerName: "@hana",   daysAgo: 15,  status: "COMPLETED", buyin: 500, playerCount: 5 },
    { name: "Saturday Highstakes II",    groupId: group3.id, ownerId: greg.id, ownerName: "@greg_n", daysAgo: 8,   status: "COMPLETED", buyin: 400, playerCount: 6 },
    { name: "Midweek Nosebleed",         groupId: group3.id, ownerId: hana.id, ownerName: "@hana",   daysAgo: 3,   status: "ACTIVE",    buyin: 300, playerCount: 5 },
    { name: "Wednesday Deepstack 2",     groupId: group3.id, ownerId: greg.id, ownerName: "@greg_n", daysAgo: 0,   status: "ACTIVE",    buyin: 200, playerCount: 5 },

    // Sunday Donkaments (group4) — 15 bulk games (~15 total)
    { name: "Donkament #1",             groupId: group4.id, ownerId: fiona.id,   ownerName: "@fiona",   daysAgo: 160, status: "COMPLETED", buyin: 25,  playerCount: 4 },
    { name: "Donkament #2",             groupId: group4.id, ownerId: charlie.id, ownerName: "@charlie", daysAgo: 148, status: "COMPLETED", buyin: 25,  playerCount: 3 },
    { name: "Donkament #3",             groupId: group4.id, ownerId: fiona.id,   ownerName: "@fiona",   daysAgo: 135, status: "COMPLETED", buyin: 50,  playerCount: 4 },
    { name: "Donkament #4",             groupId: group4.id, ownerId: charlie.id, ownerName: "@charlie", daysAgo: 122, status: "COMPLETED", buyin: 25,  playerCount: 3 },
    { name: "Donkament #5",             groupId: group4.id, ownerId: fiona.id,   ownerName: "@fiona",   daysAgo: 110, status: "COMPLETED", buyin: 25,  playerCount: 4 },
    { name: "Donkament #6",             groupId: group4.id, ownerId: alice.id,   ownerName: "@alice",   daysAgo: 98,  status: "COMPLETED", buyin: 50,  playerCount: 4 },
    { name: "Donkament #7",             groupId: group4.id, ownerId: charlie.id, ownerName: "@charlie", daysAgo: 85,  status: "COMPLETED", buyin: 25,  playerCount: 3 },
    { name: "Donkament #8",             groupId: group4.id, ownerId: fiona.id,   ownerName: "@fiona",   daysAgo: 72,  status: "COMPLETED", buyin: 25,  playerCount: 4 },
    { name: "Donkament #9",             groupId: group4.id, ownerId: hana.id,    ownerName: "@hana",    daysAgo: 60,  status: "COMPLETED", buyin: 50,  playerCount: 4 },
    { name: "Donkament #10",            groupId: group4.id, ownerId: fiona.id,   ownerName: "@fiona",   daysAgo: 48,  status: "COMPLETED", buyin: 25,  playerCount: 3 },
    { name: "Donkament #11",            groupId: group4.id, ownerId: charlie.id, ownerName: "@charlie", daysAgo: 35,  status: "COMPLETED", buyin: 25,  playerCount: 4 },
    { name: "Donkament #12",            groupId: group4.id, ownerId: fiona.id,   ownerName: "@fiona",   daysAgo: 22,  status: "COMPLETED", buyin: 50,  playerCount: 4 },
    { name: "Donkament #13",            groupId: group4.id, ownerId: alice.id,   ownerName: "@alice",   daysAgo: 12,  status: "COMPLETED", buyin: 25,  playerCount: 3 },
    { name: "Donkament #14",            groupId: group4.id, ownerId: fiona.id,   ownerName: "@fiona",   daysAgo: 5,   status: "ACTIVE",    buyin: 25,  playerCount: 4 },
    { name: "Donkament #15 - The Remix",groupId: group4.id, ownerId: charlie.id, ownerName: "@charlie", daysAgo: 0,   status: "ACTIVE",    buyin: 50,  playerCount: 3 },
  ];

  // Simple seeded PRNG so results are deterministic
  let rngState = 42;
  function seededRandom() {
    rngState = (rngState * 1664525 + 1013904223) & 0x7fffffff;
    return rngState / 0x7fffffff;
  }

  // Generate balanced cashouts: total cashout === total buyin
  function balancedCashouts(playerCount: number, buyinPerPlayer: number, rebuyChance: number): { buyins: number[]; cashout: number }[] {
    const results: { buyins: number[]; cashout: number }[] = [];
    let totalPool = 0;

    // Assign buyins (some players rebuy)
    for (let i = 0; i < playerCount; i++) {
      const buyins = [buyinPerPlayer];
      if (seededRandom() < rebuyChance) {
        buyins.push(buyinPerPlayer);
      }
      totalPool += buyins.reduce((a, b) => a + b, 0);
      results.push({ buyins, cashout: 0 });
    }

    // Distribute the pool randomly but keep it balanced
    let remaining = totalPool;
    for (let i = 0; i < playerCount - 1; i++) {
      const maxShare = remaining - (playerCount - 1 - i); // leave at least $1 for remaining
      const share = Math.max(1, Math.round(seededRandom() * maxShare * 0.6));
      results[i].cashout = share;
      remaining -= share;
    }
    results[playerCount - 1].cashout = remaining;

    return results;
  }

  // Cache group members
  const groupMemberCache: Record<string, Awaited<ReturnType<typeof prisma.groupMember.findMany>>> = {};
  async function getGroupMembers(groupId: string) {
    if (!groupMemberCache[groupId]) {
      groupMemberCache[groupId] = await prisma.groupMember.findMany({ where: { groupId } });
    }
    return groupMemberCache[groupId];
  }

  for (const tmpl of gameTemplates) {
    const exists = await prisma.game.findFirst({
      where: { name: tmpl.name, groupId: tmpl.groupId },
    });
    if (exists) {
      console.log(`Game already exists: ${tmpl.name}`);
      continue;
    }

    const members = await getGroupMembers(tmpl.groupId);
    // Shuffle members deterministically and take playerCount
    const shuffled = [...members].sort(() => seededRandom() - 0.5);
    const playerData = shuffled.slice(0, tmpl.playerCount).map((m) => ({
      name: m.name,
      groupMemberId: m.id,
    }));

    const gameDate = new Date(Date.now() - tmpl.daysAgo * 24 * 60 * 60 * 1000);

    const events: { type: "GAME_CREATED" | "GAME_COMPLETED"; actorId: string; actorName: string; detail: string }[] = [
      { type: "GAME_CREATED", actorId: tmpl.ownerId, actorName: tmpl.ownerName, detail: `Game "${tmpl.name}" created` },
    ];
    if (tmpl.status === "COMPLETED") {
      events.push({ type: "GAME_COMPLETED", actorId: tmpl.ownerId, actorName: tmpl.ownerName, detail: "Game marked as completed" });
    }

    const game = await prisma.game.create({
      data: {
        name: tmpl.name,
        date: gameDate,
        status: tmpl.status,
        userId: tmpl.ownerId,
        groupId: tmpl.groupId,
        players: {
          create: playerData.map((p) => ({
            name: p.name,
            ...(p.groupMemberId ? { groupMemberId: p.groupMemberId } : {}),
          })),
        },
        events: { create: events },
      },
      include: { players: true },
    });

    if (tmpl.status === "COMPLETED") {
      const cashouts = balancedCashouts(game.players.length, tmpl.buyin, 0.25);
      for (let i = 0; i < game.players.length; i++) {
        const p = game.players[i];
        const c = cashouts[i];
        for (const amt of c.buyins) {
          await prisma.buyin.create({ data: { amount: amt, playerId: p.id } });
        }
        await prisma.player.update({ where: { id: p.id }, data: { cashout: c.cashout } });
      }
    } else {
      // Active games: just give everyone the base buyin
      for (const p of game.players) {
        await prisma.buyin.create({ data: { amount: tmpl.buyin, playerId: p.id } });
      }
    }

    console.log(`Created game: ${tmpl.name} (${game.players.length} players, ${tmpl.status.toLowerCase()})`);
  }

  console.log("\nSeeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
