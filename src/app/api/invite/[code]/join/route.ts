import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code } = await params;

  const invite = await prisma.groupInvite.findUnique({
    where: { code },
  });

  if (!invite || invite.revokedAt || invite.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "This invite link is invalid or has expired" },
      { status: 410 }
    );
  }

  const existing = await prisma.groupMember.findFirst({
    where: { groupId: invite.groupId, userId: session.user.id },
  });

  if (existing) {
    return NextResponse.json({
      alreadyMember: true,
      groupId: invite.groupId,
    });
  }

  const name =
    session.user.name ??
    session.user.email?.split("@")[0] ??
    "Unknown";

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
    if (
      e instanceof Error &&
      e.message.includes("Unique constraint")
    ) {
      return NextResponse.json({
        alreadyMember: true,
        groupId: invite.groupId,
      });
    }
    throw e;
  }

  return NextResponse.json({ joined: true, groupId: invite.groupId });
}
