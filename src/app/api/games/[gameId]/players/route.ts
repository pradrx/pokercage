import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createGameEvent } from "@/lib/game-events";

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
  if (game.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (game.status !== "ACTIVE") {
    return NextResponse.json({ error: "Game is completed" }, { status: 400 });
  }

  const body = await request.json();
  const { name } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const player = await prisma.player.create({
    data: {
      name: name.trim(),
      gameId,
    },
    include: { buyins: true },
  });

  await createGameEvent({
    type: "PLAYER_ADDED",
    gameId,
    playerName: name.trim(),
    detail: `${name.trim()} joined the game`,
    newValue: name.trim(),
  });

  return NextResponse.json(player, { status: 201 });
}
