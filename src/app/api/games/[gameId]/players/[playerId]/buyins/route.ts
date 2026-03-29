import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  {
    params,
  }: { params: Promise<{ gameId: string; playerId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { gameId, playerId } = await params;

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game || game.userId !== session.user.id) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }
  if (game.status !== "ACTIVE") {
    return NextResponse.json({ error: "Game is completed" }, { status: 400 });
  }

  const body = await request.json();
  const amount = parseFloat(body.amount);

  if (isNaN(amount) || amount <= 0) {
    return NextResponse.json(
      { error: "Amount must be a positive number" },
      { status: 400 }
    );
  }

  const buyin = await prisma.buyin.create({
    data: {
      amount,
      playerId,
    },
  });

  return NextResponse.json(buyin, { status: 201 });
}
