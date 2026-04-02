"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Globe, Lock, Link2 } from "lucide-react";

export function VisibilityToggle({
  gameId,
  isPublic,
  slug,
}: {
  gameId: string;
  isPublic: boolean;
  slug: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/games/${gameId}/visibility`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !isPublic }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Failed to update visibility");
        return;
      }
      toast.success(isPublic ? "Game is now private" : "Game is now public");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  function handleCopyLink() {
    const url = `${window.location.origin}/games/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleToggle}
        disabled={loading}
      >
        {isPublic ? (
          <>
            <Globe className="mr-2 h-4 w-4" />
            Public
          </>
        ) : (
          <>
            <Lock className="mr-2 h-4 w-4" />
            Private
          </>
        )}
      </Button>
      {isPublic && slug && (
        <Button variant="outline" size="sm" onClick={handleCopyLink}>
          <Link2 className="mr-2 h-4 w-4" />
          Copy link
        </Button>
      )}
    </div>
  );
}
