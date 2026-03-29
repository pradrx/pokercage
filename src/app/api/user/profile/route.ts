import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PAYMENT_FIELDS = ["venmo", "zelle", "cashapp", "paypal"] as const;

function sanitize(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { venmo: true, zelle: true, cashapp: true, paypal: true },
  });

  return NextResponse.json(user);
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const data: Record<string, string | null> = {};

  for (const field of PAYMENT_FIELDS) {
    if (field in body) {
      data[field] = sanitize(body[field]);
    }
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: { venmo: true, zelle: true, cashapp: true, paypal: true },
  });

  return NextResponse.json(updated);
}
