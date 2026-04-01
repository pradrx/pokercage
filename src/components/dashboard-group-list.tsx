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

type GroupItem = {
  id: string;
  name: string;
  myRole: GroupRole;
  _count: { members: number };
};

type ActiveGameItem = {
  id: string;
  name: string;
  players: { id: string }[];
};

type DashboardGroupListProps = {
  groups: GroupItem[];
  gamesByGroup: Record<string, ActiveGameItem[]>;
  hasMoreGroups?: boolean;
  totalGroupCount?: number;
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
  hasMoreGroups,
  totalGroupCount,
}: DashboardGroupListProps) {
  if (groups.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-12">
        No groups yet. Create your first group to get started.
      </p>
    );
  }

  return (
    <div>
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
                    <div className="space-y-1.5">
                      {activeGames.map((game) => (
                        <Link key={game.id} href={`/games/${game.id}`} className="block">
                          <div className="flex items-center justify-between text-sm hover:text-foreground transition-colors">
                            <span>{game.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {game.players.length} {game.players.length === 1 ? "player" : "players"}
                            </span>
                          </div>
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
      {hasMoreGroups && (
        <Link
          href="/groups"
          className="mt-4 block text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          View all {totalGroupCount} groups &rarr;
        </Link>
      )}
    </div>
  );
}
