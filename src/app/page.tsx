import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LandingHero } from "@/components/landing-hero";

export default async function Home() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <LandingHero />
    </main>
  );
}
