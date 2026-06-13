import type { SessionStatus } from "@/lib/db/types";

export function isSessionStatus(value: unknown): value is SessionStatus {
  return value === "active" || value === "completed";
}

export function cleanOptionalString(value: unknown) {
  if (value === undefined || value === null) {
    return null;
  }

  return typeof value === "string" ? value.trim() : undefined;
}
