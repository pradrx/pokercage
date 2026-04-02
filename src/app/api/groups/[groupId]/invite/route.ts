import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireGroupAdmin, AuthError } from "@/lib/auth-helpers";
import { generateUniqueInviteSlug } from "@/lib/slug";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = await params;

  try {
    await requireGroupAdmin(groupId, session.user.id);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  const invite = await prisma.groupInvite.findFirst({
    where: {
      groupId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invite);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = await params;

  try {
    await requireGroupAdmin(groupId, session.user.id);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  const body = await request.json().catch(() => ({}));
  const rawTtl = Number(body.ttlHours);
  const indefinite = rawTtl === 0;
  const ttlHours = indefinite ? 0 : Math.min(Math.max(rawTtl || 24, 1), 720);

  const expiresAt = indefinite
    ? new Date("9999-12-31T23:59:59.999Z")
    : new Date(Date.now() + ttlHours * 60 * 60 * 1000);

  const userId = session.user.id;

  const invite = await prisma.$transaction(async (tx) => {
    await tx.groupInvite.updateMany({
      where: { groupId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return tx.groupInvite.create({
      data: {
        code: await generateUniqueInviteSlug(),
        groupId,
        createdBy: userId,
        expiresAt,
      },
    });
  });

  return NextResponse.json(invite, { status: 201 });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = await params;

  try {
    await requireGroupAdmin(groupId, session.user.id);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  await prisma.groupInvite.updateMany({
    where: { groupId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
