import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateUsername } from "@/lib/username";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username") ?? "";

  const validation = validateUsername(username.trim());
  if (!validation.valid) {
    return NextResponse.json({ available: false, error: validation.error });
  }

  const lower = username.trim().toLowerCase();
  const existing = await prisma.user.findUnique({
    where: { usernameLower: lower },
    select: { id: true },
  });

  const available = !existing || existing.id === session.user.id;
  return NextResponse.json({ available });
}
