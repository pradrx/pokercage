"use client";

import { useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import {
  ChevronDown,
  Plus,
  CheckCircle2,
  RotateCcw,
  UserPlus,
  Trash2,
  X,
  DollarSign,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GameEvent, GameEventType } from "@/generated/prisma/client";

const eventConfig: Record<
  GameEventType,
  { icon: typeof Plus; color: string }
> = {
  GAME_CREATED: { icon: Plus, color: "bg-green-500" },
  GAME_COMPLETED: { icon: CheckCircle2, color: "bg-green-500" },
  GAME_REOPENED: { icon: RotateCcw, color: "bg-yellow-500" },
  PLAYER_ADDED: { icon: UserPlus, color: "bg-blue-500" },
  PLAYER_REMOVED: { icon: Trash2, color: "bg-red-500" },
  BUYIN_ADDED: { icon: Plus, color: "bg-blue-500" },
  BUYIN_REMOVED: { icon: X, color: "bg-red-500" },
  CASHOUT_SET: { icon: DollarSign, color: "bg-green-500" },
  CASHOUT_CHANGED: { icon: DollarSign, color: "bg-yellow-500" },
  CASHOUT_CLEARED: { icon: X, color: "bg-red-500" },
};

export function GameHistory({ events }: { events: GameEvent[] }) {
  const [open, setOpen] = useState(false);

  if (events.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <button
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-between"
        >
          <CardTitle className="text-base">
            Activity Log ({events.length})
          </CardTitle>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
      </CardHeader>
      {open && (
        <CardContent>
          <ol className="relative ml-3 border-l border-border">
            {events.map((event) => {
              const config = eventConfig[event.type];
              const Icon = config.icon;
              return (
                <li key={event.id} className="mb-4 ml-4 last:mb-0">
                  <div
                    className={`absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full ${config.color}`}
                  />
                  <div className="flex items-start gap-2">
                    <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-sm">{event.detail}</p>
                      <div className="flex items-center gap-1.5">
                        {event.actorName && (
                          <span className="text-xs text-muted-foreground">
                            by {event.actorName}
                          </span>
                        )}
                        {event.actorName && (
                          <span className="text-xs text-muted-foreground">·</span>
                        )}
                        <time
                          suppressHydrationWarning
                          className="text-xs text-muted-foreground"
                          title={format(
                            new Date(event.createdAt),
                            "MMM d, yyyy h:mm a"
                          )}
                        >
                          {formatDistanceToNow(new Date(event.createdAt), {
                            addSuffix: true,
                          })}
                        </time>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </CardContent>
      )}
    </Card>
  );
}
