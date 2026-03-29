import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateUsername } from "@/lib/username";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { username: true },
  });

  if (user?.username) {
    return NextResponse.json(
      { error: "Username has already been set and cannot be changed" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const rawUsername = (body.username ?? "").trim();

  const validation = validateUsername(rawUsername);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const lower = rawUsername.toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { usernameLower: lower },
  });
  if (existing) {
    return NextResponse.json(
      { error: "This username is already taken" },
      { status: 409 }
    );
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { username: rawUsername, usernameLower: lower },
    });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json(
        { error: "This username is already taken" },
        { status: 409 }
      );
    }
    throw e;
  }

  const response = NextResponse.json({ username: rawUsername });
  response.cookies.set("has_username", "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
