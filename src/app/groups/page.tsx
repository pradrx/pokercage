import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { GroupList } from "@/components/group-list";
import { CreateGroupDialog } from "@/components/create-group-dialog";
import { Pagination } from "@/components/pagination";

const PAGE_SIZE = 12;

export default async function GroupsPage({
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

  const where = { userId };

  const [memberships, totalCount] = await Promise.all([
    prisma.groupMember.findMany({
      where,
      include: {
        group: {
          include: {
            _count: { select: { members: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.groupMember.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const groups = memberships.map((m) => ({
    ...m.group,
    _count: m.group._count,
    myRole: m.role,
  }));

  // Fetch active games for the current page's groups
  const groupIds = groups.map((g) => g.id);
  const activeGames = groupIds.length > 0
    ? await prisma.game.findMany({
        where: { groupId: { in: groupIds }, status: "ACTIVE" },
        select: {
          id: true,
          name: true,
          groupId: true,
          players: { select: { id: true } },
        },
        orderBy: { date: "desc" },
      })
    : [];

  const gamesByGroup: Record<string, typeof activeGames> = {};
  for (const game of activeGames) {
    if (!gamesByGroup[game.groupId]) gamesByGroup[game.groupId] = [];
    gamesByGroup[game.groupId].push(game);
  }

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Your Groups</h1>
          <CreateGroupDialog />
        </div>
        <section className="mt-6">
          <GroupList groups={groups} gamesByGroup={gamesByGroup} />
          <Pagination page={page} totalPages={totalPages} baseHref="/groups" />
        </section>
      </div>
    </>
  );
}
