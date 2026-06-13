"use client";

import { RadioTower } from "lucide-react";

import { cn } from "@/lib/utils";

import type { RealtimeStatus } from "./types";

export function RealtimeStatusBadge({ status }: { status: RealtimeStatus }) {
  return (
    <div
      className={cn(
        "inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
        status === "subscribed"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-amber-200 bg-amber-50 text-amber-700",
        status === "closed" && "border-slate-200 bg-slate-50 text-slate-500",
        status === "error" && "border-red-200 bg-red-50 text-red-700",
      )}
    >
      <RadioTower className="size-3.5" />
      Realtime {status}
    </div>
  );
}
