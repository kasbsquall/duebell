import type { FunctionReturnType } from "convex/server";
import type { api } from "../../convex/_generated/api";

export type ClaimDetail = NonNullable<FunctionReturnType<typeof api.claims.get>>;
export type ClaimSummary = FunctionReturnType<typeof api.claims.list>[number];
export type ClaimEvent = ClaimDetail["events"][number];
export type ClaimStatus = ClaimDetail["status"];

export const STATUS_LABEL: Record<ClaimStatus, string> = {
  awaiting_response: "Waiting for the company",
  committed: "Company committed",
  stalling: "Company is stalling",
  overdue: "Deadline missed",
  resolved: "Resolved",
};

export function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function formatTime(ms: number): string {
  return new Date(ms).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Lima",
  });
}

export function isAlarm(status: ClaimStatus): boolean {
  return status === "stalling" || status === "overdue";
}
