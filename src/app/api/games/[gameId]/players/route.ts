import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createGameEvent, actorDisplayName } from "@/lib/game-events";
import { formatUsername } from "@/lib/username";
import { canEditGame } from "@/lib/auth-helpers";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { gameId } = await params;

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const hasEditAccess = await canEditGame(game, session.user.id);
  if (!hasEditAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (game.status !== "ACTIVE") {
    return NextResponse.json({ error: "Game is completed" }, { status: 400 });
  }

  const body = await request.json();
  const { name, groupMemberId } = body;

  let playerName: string;
  let displayName: string;
  let linkedMemberId: string | undefined;

  if (groupMemberId) {
    // Adding an existing group member by ID
    const member = await prisma.groupMember.findFirst({
      where: { id: groupMemberId, groupId: game.groupId },
      include: { user: { select: { username: true } } },
    });
    if (!member) {
      return NextResponse.json(
        { error: "Group member not found" },
        { status: 404 }
      );
    }
    playerName = member.name;
    linkedMemberId = member.id;
    displayName = member.user?.username ? formatUsername(member.user.username) : member.name;
  } else if (name?.trim()) {
    playerName = name.trim();
    displayName = playerName;

    // Check for duplicate guest name in the group
    const existingGuest = await prisma.groupMember.findFirst({
      where: {
        groupId: game.groupId,
        userId: null,
        name: { equals: playerName, mode: "insensitive" },
      },
    });
    if (existingGuest) {
      return NextResponse.json(
        { error: `A guest named "${existingGuest.name}" already exists in this group` },
        { status: 409 }
      );
    }

    // Auto-create a guest member in the group
    const newMember = await prisma.groupMember.create({
      data: {
        name: playerName,
        groupId: game.groupId,
      },
    });
    linkedMemberId = newMember.id;
  } else {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const player = await prisma.player.create({
    data: {
      name: playerName,
      gameId,
      groupMemberId: linkedMemberId,
    },
    include: { buyins: true },
  });

  await createGameEvent({
    type: "PLAYER_ADDED",
    gameId,
    actorId: session.user.id,
    actorName: actorDisplayName(session),
    playerName: displayName,
    detail: `${displayName} joined the game`,
    newValue: displayName,
  });

  return NextResponse.json(player, { status: 201 });
}
