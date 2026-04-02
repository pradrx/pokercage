"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import type { GameWithPlayers } from "@/lib/types";

export function GameList({ games }: { games: GameWithPlayers[] }) {
  if (games.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-12">
        No games yet. Create your first game to get started.
      </p>
    );
  }

  return (
    <div className="grid gap-4">
      {games.map((game) => {
        return (
          <Link key={game.id} href={`/games/${game.slug ?? game.id}`}>
            <Card className="transition-colors hover:border-primary/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">{game.name}</CardTitle>
                <Badge
                  variant={
                    game.status === "ACTIVE" ? "default" : "secondary"
                  }
                >
                  {game.status === "ACTIVE" ? "Active" : "Completed"}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span suppressHydrationWarning>
                    {new Date(game.date).toLocaleDateString()}
                  </span>
                  <span>{game.players.length} players</span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {game.group.name}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
