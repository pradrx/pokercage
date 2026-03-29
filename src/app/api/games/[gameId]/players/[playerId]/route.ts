import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ gameId: string; playerId: string }> };

async function getAuthorizedActiveGame(gameId: string, userId: string) {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game || game.userId !== userId) return null;
  if (game.status !== "ACTIVE") return null;
  return game;
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { gameId, playerId } = await params;

  const game = await getAuthorizedActiveGame(gameId, session.user.id);
  if (!game) {
    return NextResponse.json(
      { error: "Game not found or not editable" },
      { status: 404 }
    );
  }

  const body = await request.json();
  const { cashout } = body;

  const player = await prisma.player.update({
    where: { id: playerId, gameId },
    data: { cashout: cashout === null ? null : parseFloat(cashout) },
    include: { buyins: true },
  });

  return NextResponse.json(player);
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { gameId, playerId } = await params;

  const game = await getAuthorizedActiveGame(gameId, session.user.id);
  if (!game) {
    return NextResponse.json(
      { error: "Game not found or not editable" },
      { status: 404 }
    );
  }

  await prisma.player.delete({
    where: { id: playerId, gameId },
  });

  return NextResponse.json({ success: true });
}
