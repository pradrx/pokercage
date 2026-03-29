import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createGameEvent } from "@/lib/game-events";
import { canEditGame } from "@/lib/auth-helpers";

type Params = { params: Promise<{ gameId: string; playerId: string }> };

async function getAuthorizedActiveGame(gameId: string, userId: string) {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) return null;
  const hasAccess = await canEditGame(game, userId);
  if (!hasAccess) return null;
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
  const newCashout = body.cashout === null ? null : parseFloat(body.cashout);

  const existing = await prisma.player.findUnique({
    where: { id: playerId, gameId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  const oldCashout = existing.cashout;

  const player = await prisma.player.update({
    where: { id: playerId, gameId },
    data: { cashout: newCashout },
    include: { buyins: true },
  });

  let eventType: "CASHOUT_SET" | "CASHOUT_CHANGED" | "CASHOUT_CLEARED";
  let detail: string;
  if (oldCashout === null && newCashout !== null) {
    eventType = "CASHOUT_SET";
    detail = `${existing.name}'s cashout set to $${newCashout}`;
  } else if (oldCashout !== null && newCashout === null) {
    eventType = "CASHOUT_CLEARED";
    detail = `${existing.name}'s cashout cleared (was $${oldCashout})`;
  } else {
    eventType = "CASHOUT_CHANGED";
    detail = `${existing.name}'s cashout changed from $${oldCashout} to $${newCashout}`;
  }

  await createGameEvent({
    type: eventType,
    gameId,
    playerName: existing.name,
    detail,
    oldValue: oldCashout !== null ? String(oldCashout) : null,
    newValue: newCashout !== null ? String(newCashout) : null,
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

  const player = await prisma.player.findUnique({
    where: { id: playerId, gameId },
  });

  await prisma.player.delete({
    where: { id: playerId, gameId },
  });

  if (player) {
    await createGameEvent({
      type: "PLAYER_REMOVED",
      gameId,
      playerName: player.name,
      detail: `${player.name} removed from the game`,
      oldValue: player.name,
    });
  }

  return NextResponse.json({ success: true });
}
