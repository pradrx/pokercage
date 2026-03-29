import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createGameEvent } from "@/lib/game-events";
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

  if (!name || !date) {
    return NextResponse.json(
      { error: "Name and date are required" },
      { status: 400 }
    );
  }

  // If creating within a group, verify caller is owner or admin
  if (groupId) {
    try {
      await requireGroupAdmin(groupId, session.user.id);
    } catch (e) {
      if (e instanceof AuthError) {
        return NextResponse.json({ error: e.message }, { status: e.status });
      }
      throw e;
    }
  }

  // Build player data from group member IDs if provided
  let playersCreate: { name: string; groupMemberId: string }[] = [];
  if (groupId && playerMemberIds?.length > 0) {
    const groupMembers = await prisma.groupMember.findMany({
      where: {
        id: { in: playerMemberIds },
        groupId,
      },
    });
    playersCreate = groupMembers.map((m) => ({
      name: m.name,
      groupMemberId: m.id,
    }));
  }

  const game = await prisma.game.create({
    data: {
      name,
      date: new Date(date),
      userId: session.user.id,
      groupId: groupId || undefined,
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

  await createGameEvent({
    type: "GAME_CREATED",
    gameId: game.id,
    detail: `Game "${name}" created`,
    newValue: name,
  });

  // Log player additions for group games
  for (const player of game.players) {
    await createGameEvent({
      type: "PLAYER_ADDED",
      gameId: game.id,
      playerName: player.name,
      detail: `${player.name} joined the game`,
      newValue: player.name,
    });
  }

  return NextResponse.json(game, { status: 201 });
}
