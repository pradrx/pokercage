import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { GameList } from "@/components/game-list";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { GameWithPlayers } from "@/lib/types";

export default async function CompletedGamesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const userId = session.user.id;

  const games = (await prisma.game.findMany({
    where: {
      status: "COMPLETED",
      OR: [
        { userId },
        { players: { some: { groupMember: { userId } } } },
      ],
    },
    include: {
      players: {
        include: { buyins: true },
      },
      group: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  })) as GameWithPlayers[];

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        <h1 className="text-2xl font-bold mb-6">Completed Games</h1>

        <GameList games={games} />
      </div>
    </>
  );
}
