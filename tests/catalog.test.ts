import { describe, expect, it } from "vitest";
import { validateCatalog } from "../src/main/catalog-schema";

describe("catalog schema", () => {
  it("accepts a valid catalog", () => {
    const result = validateCatalog([
      {
        id: "git",
        name: { zh: "Git", en: "Git" },
        category: "dev",
        wingetId: "Git.Git",
        exact: true,
        requiresAdmin: true,
        enabledByDefault: true
      }
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("git");
  });

  it("rejects duplicate ids", () => {
    expect(() =>
      validateCatalog([
        {
          id: "git",
          name: { zh: "Git", en: "Git" },
          category: "dev",
          wingetId: "Git.Git",
          exact: true,
          requiresAdmin: true,
          enabledByDefault: true
        },
        {
          id: "git",
          name: { zh: "Git2", en: "Git2" },
          category: "dev",
          wingetId: "Git.Git",
          exact: true,
          requiresAdmin: true,
          enabledByDefault: true
        }
      ])
    ).toThrowError();
  });
});
