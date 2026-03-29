import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { GroupList } from "@/components/group-list";
import { CreateGroupDialog } from "@/components/create-group-dialog";

export default async function GroupsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const memberships = await prisma.groupMember.findMany({
    where: { userId: session.user.id },
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

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Your Groups</h1>
          <CreateGroupDialog />
        </div>
        <section className="mt-6">
          <GroupList groups={groups} />
        </section>
      </div>
    </>
  );
}
