import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LandingHero } from "@/components/landing-hero";

export default async function Home() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  const isDevAuth = process.env.DEV_AUTH === "true";
  let devUsers: { name: string; email: string }[] = [];
  if (isDevAuth) {
    const users = await prisma.user.findMany({
      where: { email: { not: null } },
      select: { name: true, email: true },
      orderBy: { createdAt: "asc" },
    });
    devUsers = users
      .filter((u): u is typeof u & { email: string } => u.email !== null)
      .map((u) => ({ name: u.name ?? u.email, email: u.email }));
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <LandingHero devUsers={devUsers} />
    </main>
  );
}
