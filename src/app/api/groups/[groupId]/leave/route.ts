import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = await params;

  const membership = await prisma.groupMember.findFirst({
    where: { groupId, userId: session.user.id },
  });

  if (!membership) {
    return NextResponse.json(
      { error: "Not a member of this group" },
      { status: 404 }
    );
  }

  if (membership.role === "OWNER") {
    const memberCount = await prisma.groupMember.count({
      where: { groupId },
    });

    if (memberCount > 1) {
      return NextResponse.json(
        {
          error:
            "You must transfer ownership to another member before leaving the group",
        },
        { status: 400 }
      );
    }

    // Sole owner — delete the entire group (cascades to members/invites)
    await prisma.group.delete({ where: { id: groupId } });
    return NextResponse.json({ success: true, groupDeleted: true });
  }

  // Non-owner — just remove own membership
  await prisma.groupMember.delete({ where: { id: membership.id } });
  return NextResponse.json({ success: true });
}
