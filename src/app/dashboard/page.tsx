import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { GameList } from "@/components/game-list";
import { CreateGameDialog } from "@/components/create-game-dialog";
import { Separator } from "@/components/ui/separator";
import { DashboardGroupList } from "@/components/dashboard-group-list";
import { RecentCompletedGames } from "@/components/recent-completed-games";
import { CreateGroupDialog } from "@/components/create-group-dialog";
import type { GameWithPlayers } from "@/lib/types";

const MAX_COMPLETED_GAMES = 5;

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const userId = session.user.id;

  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    include: {
      group: {
        include: {
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const groups = memberships.map((m) => ({
    ...m.group,
    _count: m.group._count,
    myRole: m.role,
  }));

  const games = (await prisma.game.findMany({
    where: {
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

  // Group active games by their groupId for nesting under group cards
  const gamesByGroup: Record<string, GameWithPlayers[]> = {};
  const standaloneActiveGames: GameWithPlayers[] = [];

  for (const game of games) {
    if (game.status !== "ACTIVE") continue;
    if (game.groupId) {
      if (!gamesByGroup[game.groupId]) {
        gamesByGroup[game.groupId] = [];
      }
      gamesByGroup[game.groupId].push(game);
    } else {
      standaloneActiveGames.push(game);
    }
  }

  const completedGames = games.filter((g) => g.status === "COMPLETED");
  const recentCompletedGames = completedGames.slice(0, MAX_COMPLETED_GAMES);
  const totalCompletedCount = completedGames.length;

  const adminGroups = groups
    .filter((g) => g.myRole === "OWNER" || g.myRole === "ADMIN")
    .map((g) => ({ id: g.id, name: g.name }));

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Left Column: Groups with nested active games */}
          <div>
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Your Groups</h1>
              <CreateGroupDialog />
            </div>
            <section className="mt-6">
              <DashboardGroupList
                groups={groups}
                gamesByGroup={gamesByGroup}
              />
            </section>
          </div>

          {/* Right Column: Standalone games + recent completed */}
          <div>
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Your Games</h1>
              <CreateGameDialog groups={adminGroups} />
            </div>

            {standaloneActiveGames.length > 0 && (
              <section className="mt-6">
                <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Active
                </h2>
                <GameList games={standaloneActiveGames} />
              </section>
            )}

            {standaloneActiveGames.length > 0 &&
              recentCompletedGames.length > 0 && (
                <Separator className="my-6" />
              )}

            {recentCompletedGames.length > 0 && (
              <section
                className={
                  standaloneActiveGames.length === 0 ? "mt-6" : ""
                }
              >
                <RecentCompletedGames
                  games={recentCompletedGames}
                  totalCount={totalCompletedCount}
                />
              </section>
            )}

            {standaloneActiveGames.length === 0 &&
              recentCompletedGames.length === 0 && (
                <section className="mt-6">
                  <GameList games={[]} />
                </section>
              )}
          </div>
        </div>
      </div>
    </>
  );
}
