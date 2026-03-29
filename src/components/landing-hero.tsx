"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function LandingHero() {
  return (
    <div className="flex max-w-xl flex-col items-center gap-8 text-center">
      <div className="flex flex-col gap-3">
        <h1 className="text-5xl font-bold tracking-tight">Poker Cage</h1>
        <p className="text-lg text-muted-foreground">
          Track buyins, cashouts, and settlements for your poker home games.
          Create a game, add players, and let us figure out who owes whom.
        </p>
      </div>
      <Button
        size="lg"
        className="text-base"
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
      >
        Sign in with Google
      </Button>
    </div>
  );
}
