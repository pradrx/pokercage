import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = await params;

  const callerMembership = await prisma.groupMember.findFirst({
    where: { groupId, userId: session.user.id },
  });

  if (!callerMembership || callerMembership.role !== "OWNER") {
    return NextResponse.json(
      { error: "Only the group owner can transfer ownership" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { memberId } = body;

  if (!memberId) {
    return NextResponse.json(
      { error: "memberId is required" },
      { status: 400 }
    );
  }

  const target = await prisma.groupMember.findFirst({
    where: { id: memberId, groupId },
  });

  if (!target) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (!target.userId) {
    return NextResponse.json(
      { error: "Cannot transfer ownership to a guest member" },
      { status: 400 }
    );
  }

  if (target.userId === session.user.id) {
    return NextResponse.json(
      { error: "Cannot transfer ownership to yourself" },
      { status: 400 }
    );
  }

  const [updated] = await prisma.$transaction([
    prisma.groupMember.update({
      where: { id: target.id },
      data: { role: "OWNER" },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    }),
    prisma.groupMember.update({
      where: { id: callerMembership.id },
      data: { role: "ADMIN" },
    }),
  ]);

  return NextResponse.json(updated);
}
