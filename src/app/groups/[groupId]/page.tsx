import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { MemberList } from "@/components/member-list";
import { AddMemberForm } from "@/components/add-member-form";
import { GameList } from "@/components/game-list";
import { CreateGroupGameDialog } from "@/components/create-group-game-dialog";
import { InviteLinkManager } from "@/components/invite-link-manager";
import { LeaveGroupButton } from "@/components/leave-group-button";
import { Separator } from "@/components/ui/separator";
import type { GameWithPlayers, GroupMemberWithUser } from "@/lib/types";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const { groupId } = await params;

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true, username: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!group) {
    notFound();
  }

  const myMembership = group.members.find(
    (m) => m.userId === session.user?.id
  );

  if (!myMembership) {
    notFound();
  }

  const games = (await prisma.game.findMany({
    where: { groupId },
    include: {
      players: {
        include: { buyins: true },
      },
      group: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  })) as GameWithPlayers[];

  const activeGames = games.filter((g) => g.status === "ACTIVE");
  const completedGames = games.filter((g) => g.status === "COMPLETED");

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold">{group.name}</h1>

        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Members</h2>
            <div className="flex items-center gap-2">
              <LeaveGroupButton
                groupId={groupId}
                groupName={group.name}
                myRole={myMembership.role}
                memberCount={group.members.length}
              />
              {(myMembership.role === "OWNER" || myMembership.role === "ADMIN") && (
                <InviteLinkManager groupId={groupId} />
              )}
            </div>
          </div>
          <AddMemberForm groupId={groupId} />
          <div className="mt-4">
            <MemberList
              members={group.members as GroupMemberWithUser[]}
              groupId={groupId}
              myRole={myMembership.role}
              myMemberId={myMembership.id}
            />
          </div>
        </section>

        <Separator className="my-8" />

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Games</h2>
            {(myMembership.role === "OWNER" || myMembership.role === "ADMIN") && (
              <CreateGroupGameDialog
                groupId={groupId}
                members={group.members as GroupMemberWithUser[]}
              />
            )}
          </div>

          {activeGames.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Active
              </h3>
              <GameList games={activeGames} />
            </div>
          )}

          {completedGames.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Completed
              </h3>
              <GameList games={completedGames} />
            </div>
          )}

          {games.length === 0 && (
            <p className="text-center text-muted-foreground py-12">
              No games yet. Create your first group game to get started.
            </p>
          )}
        </section>
      </div>
    </>
  );
}
