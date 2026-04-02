import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { GameList } from "@/components/game-list";
import { CreateGameDialog } from "@/components/create-game-dialog";
import { DashboardGroupList } from "@/components/dashboard-group-list";
import { RecentCompletedGames } from "@/components/recent-completed-games";
import { CreateGroupDialog } from "@/components/create-group-dialog";
import type { GameWithPlayers } from "@/lib/types";

const MAX_COMPLETED_GAMES = 6;
const MAX_DASHBOARD_GROUPS = 4;

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
    orderBy: { date: "desc" },
  })) as GameWithPlayers[];

  // Fetch all active games in user's groups (regardless of participation)
  const groupIds = groups.map((g) => g.id);
  const groupActiveGames = groupIds.length > 0
    ? await prisma.game.findMany({
        where: { groupId: { in: groupIds }, status: "ACTIVE" },
        select: {
          id: true,
          slug: true,
          name: true,
          groupId: true,
          players: { select: { id: true } },
        },
        orderBy: { date: "desc" },
      })
    : [];

  const gamesByGroup: Record<string, typeof groupActiveGames> = {};
  for (const game of groupActiveGames) {
    if (!gamesByGroup[game.groupId]) gamesByGroup[game.groupId] = [];
    gamesByGroup[game.groupId].push(game);
  }

  // Sort groups: those with active games first, then by original order
  const sortedGroups = [...groups].sort((a, b) => {
    const aActive = gamesByGroup[a.id]?.length > 0 ? 1 : 0;
    const bActive = gamesByGroup[b.id]?.length > 0 ? 1 : 0;
    return bActive - aActive;
  });

  const visibleGroups = sortedGroups.slice(0, MAX_DASHBOARD_GROUPS);
  const hasMoreGroups = groups.length > MAX_DASHBOARD_GROUPS;

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
                groups={visibleGroups}
                gamesByGroup={gamesByGroup}
                hasMoreGroups={hasMoreGroups}
                totalGroupCount={groups.length}
              />
            </section>
          </div>

          {/* Right Column: Recent completed games */}
          <div>
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Recent Games</h1>
              <CreateGameDialog groups={adminGroups} />
            </div>

            {recentCompletedGames.length > 0 ? (
              <section className="mt-6">
                <RecentCompletedGames
                  games={recentCompletedGames}
                  totalCount={totalCompletedCount}
                />
              </section>
            ) : (
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
