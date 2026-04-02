import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatUsername } from "@/lib/username";
import { InviteSignInCard } from "@/components/invite-sign-in-card";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const invite = await prisma.groupInvite.findUnique({
    where: { code },
    include: { group: { select: { id: true, name: true } } },
  });

  if (!invite || invite.revokedAt || invite.expiresAt < new Date()) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Invalid invite</h1>
          <p className="mt-2 text-muted-foreground">
            This invite link is invalid or has expired.
          </p>
        </div>
      </div>
    );
  }

  const session = await auth();

  if (!session?.user?.id) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <InviteSignInCard code={code} groupName={invite.group.name} />
      </div>
    );
  }

  const existing = await prisma.groupMember.findFirst({
    where: { groupId: invite.groupId, userId: session.user.id },
  });

  if (!existing) {
    const name = session.user.username
      ? formatUsername(session.user.username)
      : (session.user.name ?? session.user.email?.split("@")[0] ?? "Unknown");

    try {
      await prisma.groupMember.create({
        data: {
          name,
          groupId: invite.groupId,
          userId: session.user.id,
          role: "MEMBER",
        },
      });
    } catch (e: unknown) {
      // Ignore unique constraint (race condition — already a member)
      if (!(e instanceof Error && e.message.includes("Unique constraint"))) {
        throw e;
      }
    }
  }

  redirect(`/groups/${invite.groupId}`);
}
