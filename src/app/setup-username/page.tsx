import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SetupUsernameForm } from "@/components/setup-username-form";

export default async function SetupUsernamePage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { username: true },
  });

  if (user?.username) {
    redirect("/dashboard");
  }

  const { callbackUrl } = await searchParams;
  const redirectTo =
    callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/dashboard";

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Choose your username</CardTitle>
          <p className="text-sm text-muted-foreground">
            Pick a unique username for your Poker Cage account. This is how
            other players will identify you.
          </p>
        </CardHeader>
        <CardContent>
          <SetupUsernameForm redirectTo={redirectTo} />
        </CardContent>
      </Card>
    </div>
  );
}
