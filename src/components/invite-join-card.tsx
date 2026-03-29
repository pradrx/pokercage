"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export function InviteJoinCard({
  code,
  groupName,
}: {
  code: string;
  groupName: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    setLoading(true);
    try {
      const res = await fetch(`/api/invite/${code}/join`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Failed to join group");
        return;
      }

      if (data.alreadyMember) {
        router.push(`/groups/${data.groupId}`);
        return;
      }

      toast.success(`Joined ${groupName}`);
      router.push(`/groups/${data.groupId}`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Join group?</CardTitle>
        <p className="text-muted-foreground">
          You&apos;ve been invited to{" "}
          <span className="font-semibold text-foreground">{groupName}</span>
        </p>
      </CardHeader>
      <CardContent className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => router.push("/dashboard")}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          className="flex-1"
          onClick={handleJoin}
          disabled={loading}
        >
          {loading ? "Joining..." : "Join"}
        </Button>
      </CardContent>
    </Card>
  );
}
