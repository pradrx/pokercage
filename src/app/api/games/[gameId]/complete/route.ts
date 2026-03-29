import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
  if (game.userId !== session.user.id) {
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

  const totalBuyins = game.players.reduce(
    (sum, p) => sum + p.buyins.reduce((s, b) => s + b.amount, 0),
    0
  );
  const totalCashouts = game.players.reduce(
    (sum, p) => sum + (p.cashout ?? 0),
    0
  );

  if (Math.abs(totalBuyins - totalCashouts) >= 0.01) {
    return NextResponse.json(
      { error: "Ledger is not balanced. Total buyins must equal total cashouts." },
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

  return NextResponse.json(updatedGame);
}
