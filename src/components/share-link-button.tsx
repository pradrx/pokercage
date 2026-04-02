"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link2 } from "lucide-react";

export function ShareLinkButton({ shareToken, slug }: { shareToken: string; slug?: string | null }) {
  function handleCopy() {
    const url = `${window.location.origin}/share/${slug ?? shareToken}`;
    navigator.clipboard.writeText(url);
    toast.success("Share link copied to clipboard");
  }

  return (
    <Button variant="outline" size="sm" onClick={handleCopy}>
      <Link2 className="mr-2 h-4 w-4" />
      Share
    </Button>
  );
}
