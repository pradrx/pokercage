"use client";

import Link from "next/link";
import { GameList } from "@/components/game-list";
import type { GameWithPlayers } from "@/lib/types";

type RecentCompletedGamesProps = {
  games: GameWithPlayers[];
  totalCount: number;
  viewAllHref?: string;
};

export function RecentCompletedGames({
  games,
  totalCount,
  viewAllHref = "/dashboard/completed",
}: RecentCompletedGamesProps) {
  return (
    <div>
      <GameList games={games} />
      {totalCount > games.length && (
        <Link
          href={viewAllHref}
          className="mt-4 block text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          View all {totalCount}{" "}completed games &rarr;
        </Link>
      )}
    </div>
  );
}
