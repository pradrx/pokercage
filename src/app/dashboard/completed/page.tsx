import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { GameList } from "@/components/game-list";
import { Pagination } from "@/components/pagination";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { GameWithPlayers } from "@/lib/types";

const PAGE_SIZE = 10;

export default async function CompletedGamesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const userId = session.user.id;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(typeof pageParam === "string" ? pageParam : "1", 10) || 1);

  const where = {
    status: "COMPLETED" as const,
    OR: [
      { userId },
      { players: { some: { groupMember: { userId } } } },
    ],
  };

  const [games, totalCount] = await Promise.all([
    prisma.game.findMany({
      where,
      include: {
        players: {
          include: { buyins: true },
        },
        group: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }) as Promise<GameWithPlayers[]>,
    prisma.game.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

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

        <h1 className="text-2xl font-bold mb-6">
          Completed Games
          <span className="text-base font-normal text-muted-foreground ml-2">
            ({totalCount})
          </span>
        </h1>

        <GameList games={games} />

        <Pagination page={page} totalPages={totalPages} baseHref="/dashboard/completed" />
      </div>
    </>
  );
}
