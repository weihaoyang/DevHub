import type { InstallStatus } from "./types";

export function nextTaskState(current: InstallStatus, incoming: InstallStatus): InstallStatus {
  const order: InstallStatus[] = [
    "queued",
    "running",
    "manual_required",
    "success",
    "skipped_installed",
    "failed",
    "completed"
  ];
  const currentIndex = order.indexOf(current);
  const incomingIndex = order.indexOf(incoming);

  if (incomingIndex >= currentIndex) {
    return incoming;
  }
  return current;
}
