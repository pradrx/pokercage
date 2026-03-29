import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { GameList } from "@/components/game-list";
import { CreateGameDialog } from "@/components/create-game-dialog";
import { Separator } from "@/components/ui/separator";
import type { GameWithPlayers } from "@/lib/types";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const games = (await prisma.game.findMany({
    where: { userId: session.user.id },
    include: {
      players: {
        include: { buyins: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })) as GameWithPlayers[];

  const activeGames = games.filter((g) => g.status === "ACTIVE");
  const completedGames = games.filter((g) => g.status === "COMPLETED");

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Your Games</h1>
          <CreateGameDialog />
        </div>

        {activeGames.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Active
            </h2>
            <GameList games={activeGames} />
          </section>
        )}

        {activeGames.length > 0 && completedGames.length > 0 && (
          <Separator className="my-6" />
        )}

        {completedGames.length > 0 && (
          <section className={activeGames.length === 0 ? "mt-6" : ""}>
            <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Completed
            </h2>
            <GameList games={completedGames} />
          </section>
        )}

        {games.length === 0 && (
          <GameList games={[]} />
        )}
      </div>
    </>
  );
}
