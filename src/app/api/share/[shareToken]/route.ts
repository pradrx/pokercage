import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  const { shareToken } = await params;

  const game = await prisma.game.findUnique({
    where: { shareToken },
    include: {
      players: {
        include: { buyins: { orderBy: { createdAt: "asc" } } },
      },
      user: { select: { name: true } },
    },
  });

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  return NextResponse.json(game);
}
