"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { validateUsername } from "@/lib/username";
import { toast } from "sonner";
import { Check, X, Loader2 } from "lucide-react";

export function SetupUsernameForm() {
  const { update } = useSession();
  const [username, setUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const checkAvailability = useCallback(async (value: string) => {
    setChecking(true);
    try {
      const res = await fetch(
        `/api/user/username/check?username=${encodeURIComponent(value)}`
      );
      const data = await res.json();
      setAvailable(data.available);
    } catch {
      setAvailable(null);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    const trimmed = username.trim();
    if (!trimmed) {
      setValidationError(null);
      setAvailable(null);
      return;
    }

    const result = validateUsername(trimmed);
    if (!result.valid) {
      setValidationError(result.error);
      setAvailable(null);
      return;
    }

    setValidationError(null);
    setAvailable(null);

    const timer = setTimeout(() => {
      checkAvailability(trimmed);
    }, 400);

    return () => clearTimeout(timer);
  }, [username, checkAvailability]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = username.trim();

    const result = validateUsername(trimmed);
    if (!result.valid) {
      toast.error(result.error);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/user/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to set username");
        return;
      }

      await update();
      window.location.href = "/dashboard";
    } catch {
      toast.error("Failed to set username");
    } finally {
      setSubmitting(false);
    }
  }

  const trimmed = username.trim();
  const isValid = trimmed.length > 0 && !validationError && available === true;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            @
          </span>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="poker_king"
            className="pl-7"
            autoFocus
            autoComplete="off"
          />
          {trimmed && !validationError && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              {checking ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : available === true ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : available === false ? (
                <X className="h-4 w-4 text-red-500" />
              ) : null}
            </span>
          )}
        </div>
        {validationError && (
          <p className="text-sm text-destructive">{validationError}</p>
        )}
        {!validationError && available === false && (
          <p className="text-sm text-destructive">
            This username is already taken
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          3-16 characters. Letters, numbers, and underscores only.
        </p>
      </div>
      <Button type="submit" className="w-full" disabled={!isValid || submitting}>
        {submitting ? "Setting up..." : "Continue"}
      </Button>
    </form>
  );
}
