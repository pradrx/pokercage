import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createGameEvent, actorDisplayName } from "@/lib/game-events";
import { canEditGame } from "@/lib/auth-helpers";
import { buildPlayerBalances, canAdjustBalances } from "@/lib/payout";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { gameId } = await params;

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      players: {
        include: { buyins: true },
      },
    },
  });

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const hasEditAccess = await canEditGame(game, session.user.id);
  if (!hasEditAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (game.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "Game is already completed" },
      { status: 400 }
    );
  }

  if (game.players.length === 0) {
    return NextResponse.json(
      { error: "Game has no players" },
      { status: 422 }
    );
  }

  const allCashedOut = game.players.every((p) => p.cashout !== null);
  if (!allCashedOut) {
    return NextResponse.json(
      { error: "Not all players have cashed out" },
      { status: 422 }
    );
  }

  const balances = buildPlayerBalances(game.players);
  const delta = Math.round(balances.reduce((s, p) => s + p.balance, 0) * 100) / 100;

  if (Math.abs(delta) >= 0.01 && !canAdjustBalances(balances)) {
    return NextResponse.json(
      { error: "Ledger is not balanced and all players are on the same side. Cannot auto-adjust." },
      { status: 422 }
    );
  }

  const updatedGame = await prisma.game.update({
    where: { id: gameId },
    data: { status: "COMPLETED" },
    include: {
      players: {
        include: { buyins: true },
      },
    },
  });

  const detail =
    Math.abs(delta) < 0.01
      ? "Game marked as completed"
      : `Game marked as completed (ledger adjusted by ${delta > 0 ? "+" : ""}${delta})`;

  await createGameEvent({
    type: "GAME_COMPLETED",
    gameId,
    actorId: session.user.id,
    actorName: actorDisplayName(session),
    detail,
    oldValue: "ACTIVE",
    newValue: "COMPLETED",
  });

  return NextResponse.json(updatedGame);
}
