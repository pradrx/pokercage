"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const DEV_USERS = [
  { name: "Alice", email: "alice@test.com" },
  { name: "Bob", email: "bob@test.com" },
  { name: "Charlie", email: "charlie@test.com" },
  { name: "Diana", email: "diana@test.com" },
];

export function InviteSignInCard({
  code,
  groupName,
}: {
  code: string;
  groupName: string;
}) {
  const isDevAuth = process.env.NEXT_PUBLIC_DEV_AUTH === "true";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const callbackUrl = `/invite/${code}`;

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">You&apos;ve been invited</CardTitle>
        <p className="text-muted-foreground">
          Join <span className="font-semibold text-foreground">{groupName}</span>
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          className="w-full"
          size="lg"
          onClick={() => signIn("google", { callbackUrl })}
        >
          Sign in with Google
        </Button>

        {isDevAuth && (
          <>
            <Separator />
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
                      callbackUrl,
                    })
                  }
                >
                  {u.name}
                </Button>
              ))}
            </div>
            <Separator />
            <div className="space-y-2 text-left">
              <Label htmlFor="invite-dev-name">Name</Label>
              <Input
                id="invite-dev-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Test User"
              />
            </div>
            <div className="space-y-2 text-left">
              <Label htmlFor="invite-dev-email">Email</Label>
              <Input
                id="invite-dev-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="test@test.com"
              />
            </div>
            <Button
              className="w-full"
              onClick={() =>
                signIn("credentials", { name, email, callbackUrl })
              }
              disabled={!name || !email}
            >
              Sign in as dev user
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
