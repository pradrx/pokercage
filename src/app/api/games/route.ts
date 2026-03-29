import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createGameEvent } from "@/lib/game-events";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const games = await prisma.game.findMany({
    where: { userId: session.user.id },
    include: {
      players: {
        include: { buyins: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(games);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, date } = body;

  if (!name || !date) {
    return NextResponse.json(
      { error: "Name and date are required" },
      { status: 400 }
    );
  }

  const game = await prisma.game.create({
    data: {
      name,
      date: new Date(date),
      userId: session.user.id,
    },
    include: {
      players: {
        include: { buyins: true },
      },
    },
  });

  await createGameEvent({
    type: "GAME_CREATED",
    gameId: game.id,
    detail: `Game "${name}" created`,
    newValue: name,
  });

  return NextResponse.json(game, { status: 201 });
}
