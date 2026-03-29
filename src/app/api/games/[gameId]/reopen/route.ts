import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createGameEvent } from "@/lib/game-events";
import { canEditGame } from "@/lib/auth-helpers";

const REOPEN_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

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
  });

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const hasEditAccess = await canEditGame(game, session.user.id);
  if (!hasEditAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (game.status !== "COMPLETED") {
    return NextResponse.json(
      { error: "Game is not completed" },
      { status: 400 }
    );
  }

  const lastCompleted = await prisma.gameEvent.findFirst({
    where: { gameId, type: "GAME_COMPLETED" },
    orderBy: { createdAt: "desc" },
  });

  if (
    !lastCompleted ||
    Date.now() - lastCompleted.createdAt.getTime() > REOPEN_WINDOW_MS
  ) {
    return NextResponse.json(
      { error: "Reopen window has expired. Games can only be reopened within 7 days of completion." },
      { status: 422 }
    );
  }

  const updatedGame = await prisma.game.update({
    where: { id: gameId },
    data: { status: "ACTIVE" },
  });

  await createGameEvent({
    type: "GAME_REOPENED",
    gameId,
    actorId: session.user.id,
    actorName: session.user.name ?? undefined,
    detail: "Game reopened for editing",
    oldValue: "COMPLETED",
    newValue: "ACTIVE",
  });

  return NextResponse.json(updatedGame);
}
