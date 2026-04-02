"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

export function AddMemberForm({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingName, setPendingName] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setPendingName(name.trim());
  }

  async function handleConfirm() {
    if (!pendingName) return;

    setLoading(true);
    setPendingName(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: pendingName }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to add member");
        return;
      }

      setName("");
      router.refresh();
    } catch {
      toast.error("Failed to add member");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          placeholder="Guest name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="max-w-xs"
        />
        <Button type="submit" variant="outline" disabled={loading || !name.trim()}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Guest
        </Button>
      </form>

      <AlertDialog
        open={!!pendingName}
        onOpenChange={(open) => {
          if (!open) setPendingName(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add Guest</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a guest named &ldquo;{pendingName}&rdquo; in your
              group.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Add Guest
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
