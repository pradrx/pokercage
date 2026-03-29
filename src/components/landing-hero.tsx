"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const DEV_USERS = [
  { name: "Alice", email: "alice@test.com" },
  { name: "Bob", email: "bob@test.com" },
  { name: "Charlie", email: "charlie@test.com" },
  { name: "Diana", email: "diana@test.com" },
];

export function LandingHero() {
  const isDevAuth = process.env.NEXT_PUBLIC_DEV_AUTH === "true";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

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

      {isDevAuth && (
        <>
          <Separator />
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-base">Dev Login</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {DEV_USERS.map((u) => (
                  <Button
                    key={u.email}
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      signIn("credentials", {
                        name: u.name,
                        email: u.email,
                        callbackUrl: "/dashboard",
                      })
                    }
                  >
                    {u.name}
                  </Button>
                ))}
              </div>
              <Separator />
              <div className="space-y-2 text-left">
                <Label htmlFor="dev-name">Name</Label>
                <Input
                  id="dev-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Test User"
                />
              </div>
              <div className="space-y-2 text-left">
                <Label htmlFor="dev-email">Email</Label>
                <Input
                  id="dev-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="test@test.com"
                />
              </div>
              <Button
                className="w-full"
                onClick={() =>
                  signIn("credentials", {
                    name,
                    email,
                    callbackUrl: "/dashboard",
                  })
                }
                disabled={!name || !email}
              >
                Sign in as dev user
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
