"use client";

import Link from "next/link";
import { GameList } from "@/components/game-list";
import type { GameWithPlayers } from "@/lib/types";

type RecentCompletedGamesProps = {
  games: GameWithPlayers[];
  totalCount: number;
};

export function RecentCompletedGames({
  games,
  totalCount,
}: RecentCompletedGamesProps) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wide">
        Completed
      </h2>
      <GameList games={games} />
      {totalCount > games.length && (
        <Link
          href="/dashboard/completed"
          className="mt-4 block text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          View all {totalCount}{" "}completed games &rarr;
        </Link>
      )}
    </div>
  );
}
