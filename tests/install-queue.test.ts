import { describe, expect, it } from "vitest";
import { buildRetryQueue } from "../src/main/install-queue";
import { nextTaskState } from "../src/shared/task-state";

describe("install queue helpers", () => {
  it("builds retry queue from unique failed ids", () => {
    const catalog = [
      {
        id: "a",
        name: { zh: "A", en: "A" },
        category: "dev",
        wingetId: "A.A",
        exact: true,
        requiresAdmin: true,
        enabledByDefault: true
      },
      {
        id: "b",
        name: { zh: "B", en: "B" },
        category: "dev",
        wingetId: "B.B",
        exact: true,
        requiresAdmin: true,
        enabledByDefault: true
      }
    ] as const;

    const queue = buildRetryQueue(["a", "a", "b", "missing"], [...catalog]);
    expect(queue.map((item) => item.id)).toEqual(["a", "b"]);
  });

  it("advances state in forward direction only", () => {
    expect(nextTaskState("queued", "running")).toBe("running");
    expect(nextTaskState("success", "running")).toBe("success");
  });
});
