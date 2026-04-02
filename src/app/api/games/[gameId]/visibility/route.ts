import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditGame } from "@/lib/auth-helpers";
import { createGameEvent, actorDisplayName } from "@/lib/game-events";

export async function PATCH(
  request: Request,
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

  const body = await request.json();
  const { isPublic } = body;

  if (typeof isPublic !== "boolean") {
    return NextResponse.json(
      { error: "isPublic must be a boolean" },
      { status: 400 }
    );
  }

  const updated = await prisma.game.update({
    where: { id: gameId },
    data: { isPublic },
  });

  await createGameEvent({
    type: "VISIBILITY_CHANGED",
    gameId,
    actorId: session.user.id,
    actorName: actorDisplayName(session),
    detail: `Game visibility changed to ${isPublic ? "public" : "private"}`,
    oldValue: String(!isPublic),
    newValue: String(isPublic),
  });

  return NextResponse.json(updated);
}
