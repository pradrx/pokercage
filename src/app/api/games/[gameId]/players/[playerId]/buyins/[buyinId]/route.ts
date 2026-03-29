import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createGameEvent } from "@/lib/game-events";

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
  if (!game || game.userId !== session.user.id) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
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
      playerName: buyin.player.name,
      detail: `${buyin.player.name}'s $${buyin.amount} buyin removed`,
      oldValue: String(buyin.amount),
    });
  }

  return NextResponse.json({ success: true });
}
