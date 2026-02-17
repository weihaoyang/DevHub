import type { SoftwareItem } from "../shared/types";

export function buildRetryQueue(failedIds: string[], catalog: SoftwareItem[]): SoftwareItem[] {
  const byId = new Map(catalog.map((item) => [item.id, item]));
  const visited = new Set<string>();
  const queue: SoftwareItem[] = [];

  for (const id of failedIds) {
    if (visited.has(id)) {
      continue;
    }
    visited.add(id);
    const item = byId.get(id);
    if (item) {
      queue.push(item);
    }
  }

  return queue;
}
