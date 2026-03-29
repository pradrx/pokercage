import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createGameEvent } from "@/lib/game-events";
import { canEditGame } from "@/lib/auth-helpers";

export async function DELETE(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ gameId: string; playerId: string; buyinId: string }>;
  }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { gameId, buyinId } = await params;

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

  const buyin = await prisma.buyin.findUnique({
    where: { id: buyinId },
    include: { player: true },
  });

  await prisma.buyin.delete({ where: { id: buyinId } });

  if (buyin) {
    await createGameEvent({
      type: "BUYIN_REMOVED",
      gameId,
      actorId: session.user.id,
      actorName: session.user.name ?? undefined,
      playerName: buyin.player.name,
      detail: `${buyin.player.name}'s $${buyin.amount} buyin removed`,
      oldValue: String(buyin.amount),
    });
  }

  return NextResponse.json({ success: true });
}
