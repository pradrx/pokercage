import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const invite = await prisma.groupInvite.findUnique({
    where: { code },
    include: { group: { select: { name: true } } },
  });

  if (!invite) {
    return NextResponse.json({ valid: false, reason: "not_found" });
  }

  if (invite.revokedAt) {
    return NextResponse.json({ valid: false, reason: "revoked" });
  }

  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ valid: false, reason: "expired" });
  }

  return NextResponse.json({
    valid: true,
    groupName: invite.group.name,
    groupId: invite.groupId,
  });
}
