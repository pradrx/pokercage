"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { GroupRole } from "@/generated/prisma/client";
import type { GameWithPlayers } from "@/lib/types";

type GroupItem = {
  id: string;
  name: string;
  myRole: GroupRole;
  _count: { members: number };
};

type DashboardGroupListProps = {
  groups: GroupItem[];
  gamesByGroup: Record<string, GameWithPlayers[]>;
};

const roleBadgeVariant: Record<GroupRole, "default" | "secondary" | "outline"> =
  {
    OWNER: "default",
    ADMIN: "secondary",
    MEMBER: "outline",
  };

export function DashboardGroupList({
  groups,
  gamesByGroup,
}: DashboardGroupListProps) {
  if (groups.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-12">
        No groups yet. Create your first group to get started.
      </p>
    );
  }

  return (
    <div className="grid gap-4">
      {groups.map((group) => {
        const activeGames = gamesByGroup[group.id] ?? [];

        return (
          <Card key={group.id} className="transition-colors hover:border-primary/50">
            <Link href={`/groups/${group.id}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">{group.name}</CardTitle>
                <Badge variant={roleBadgeVariant[group.myRole]}>
                  {group.myRole.charAt(0) + group.myRole.slice(1).toLowerCase()}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  {group._count.members}{" "}
                  {group._count.members === 1 ? "member" : "members"}
                </div>
              </CardContent>
            </Link>

            {activeGames.length > 0 && (
              <CardContent className="pt-0">
                <div className="border-t border-border pt-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Active Games
                  </p>
                  <div className="grid gap-2">
                    {activeGames.map((game) => (
                      <Link key={game.id} href={`/games/${game.id}`}>
                        <Card
                          size="sm"
                          className="transition-colors hover:border-primary/50"
                        >
                          <CardHeader className="flex flex-row items-center justify-between pb-0">
                            <CardTitle>{game.name}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex gap-3 text-xs text-muted-foreground">
                              <span suppressHydrationWarning>
                                {new Date(game.date).toLocaleDateString()}
                              </span>
                              <span>{game.players.length} players</span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
