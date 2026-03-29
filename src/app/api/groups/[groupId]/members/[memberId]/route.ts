import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireGroupAdmin, AuthError } from "@/lib/auth-helpers";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ groupId: string; memberId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId, memberId } = await params;

  const callerMembership = await prisma.groupMember.findFirst({
    where: { groupId, userId: session.user.id },
  });

  const target = await prisma.groupMember.findFirst({
    where: { id: memberId, groupId },
  });

  if (!target) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  const body = await request.json();
  const { role, name } = body;

  // Role changes require OWNER
  if (role !== undefined) {
    if (!callerMembership || callerMembership.role !== "OWNER") {
      return NextResponse.json(
        { error: "Only the group owner can change roles" },
        { status: 403 }
      );
    }

    // Cannot change own role (prevent owner from demoting themselves)
    if (target.userId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot change your own role" },
        { status: 400 }
      );
    }

    if (!["ADMIN", "MEMBER"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be ADMIN or MEMBER" },
        { status: 400 }
      );
    }
  }

  // Name changes on guests require OWNER or ADMIN
  if (name !== undefined) {
    try {
      await requireGroupAdmin(groupId, session.user.id);
    } catch (e) {
      if (e instanceof AuthError) {
        return NextResponse.json({ error: e.message }, { status: e.status });
      }
      throw e;
    }

    if (!name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
  }

  const data: Record<string, string> = {};
  if (role !== undefined) data.role = role;
  if (name !== undefined) data.name = name.trim();

  const updated = await prisma.groupMember.update({
    where: { id: memberId },
    data,
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ groupId: string; memberId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId, memberId } = await params;

  try {
    await requireGroupAdmin(groupId, session.user.id);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  const target = await prisma.groupMember.findFirst({
    where: { id: memberId, groupId },
  });

  if (!target) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  // Cannot remove the last OWNER
  if (target.role === "OWNER") {
    const ownerCount = await prisma.groupMember.count({
      where: { groupId, role: "OWNER" },
    });
    if (ownerCount <= 1) {
      return NextResponse.json(
        { error: "Cannot remove the last owner of the group" },
        { status: 400 }
      );
    }
  }

  await prisma.groupMember.delete({ where: { id: memberId } });

  return NextResponse.json({ success: true });
}
