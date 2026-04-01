import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createGameEvent, actorDisplayName } from "@/lib/game-events";
import { formatUsername } from "@/lib/username";
import { requireGroupAdmin, AuthError } from "@/lib/auth-helpers";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const games = await prisma.game.findMany({
    where: { userId: session.user.id },
    include: {
      players: {
        include: { buyins: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(games);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, date, groupId, playerMemberIds } = body;

  if (!name || !date || !groupId) {
    return NextResponse.json(
      { error: "Name, date, and groupId are required" },
      { status: 400 }
    );
  }

  // Verify caller is owner or admin of the group
  try {
    await requireGroupAdmin(groupId, session.user.id);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  // Build player data from group member IDs if provided
  let playersCreate: { name: string; groupMemberId: string }[] = [];
  const memberDisplayNames = new Map<string, string>();
  if (playerMemberIds?.length > 0) {
    const groupMembers = await prisma.groupMember.findMany({
      where: {
        id: { in: playerMemberIds },
        groupId,
      },
      include: { user: { select: { username: true } } },
    });
    playersCreate = groupMembers.map((m) => ({
      name: m.name,
      groupMemberId: m.id,
    }));
    // Build display name lookup for event logging
    for (const m of groupMembers) {
      memberDisplayNames.set(m.id, m.user?.username ? formatUsername(m.user.username) : m.name);
    }
  }

  const game = await prisma.game.create({
    data: {
      name,
      date: new Date(date),
      userId: session.user.id,
      groupId,
      players: playersCreate.length > 0
        ? { create: playersCreate }
        : undefined,
    },
    include: {
      players: {
        include: { buyins: true },
      },
    },
  });

  const actor = actorDisplayName(session);

  await createGameEvent({
    type: "GAME_CREATED",
    gameId: game.id,
    actorId: session.user.id,
    actorName: actor,
    detail: `Game "${name}" created`,
    newValue: name,
  });

  // Log player additions for group games
  for (const player of game.players) {
    const pName = (player.groupMemberId && memberDisplayNames.get(player.groupMemberId)) || player.name;
    await createGameEvent({
      type: "PLAYER_ADDED",
      gameId: game.id,
      actorId: session.user.id,
      actorName: actor,
      playerName: pName,
      detail: `${pName} joined the game`,
      newValue: pName,
    });
  }

  return NextResponse.json(game, { status: 201 });
}
