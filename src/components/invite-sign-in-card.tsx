"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function InviteSignInCard({
  code,
  groupName,
}: {
  code: string;
  groupName: string;
}) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">You&apos;ve been invited</CardTitle>
        <p className="text-muted-foreground">
          Join <span className="font-semibold text-foreground">{groupName}</span>
        </p>
      </CardHeader>
      <CardContent>
        <Button
          className="w-full"
          size="lg"
          onClick={() => signIn("google", { callbackUrl: `/invite/${code}` })}
        >
          Sign in with Google
        </Button>
      </CardContent>
    </Card>
  );
}
