import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { z } from "zod";

const pricingSchema = z.object({
  version: z.string().min(1),
  currency: z.literal("CNY"),
  locale: z.string().min(1),
  trial: z.object({
    enabled: z.boolean(),
    days: z.number().int().positive(),
    appliesToPlans: z.array(z.string().min(1)).min(1)
  }),
  plans: z
    .array(
      z.object({
        id: z.string().min(1),
        billing: z.object({
          mode: z.enum(["free", "annual"])
        }),
        entitlementTier: z.string().min(1),
        ads: z.object({
          enabled: z.boolean()
        })
      })
    )
    .min(2)
});

const entitlementsSchema = z.object({
  version: z.string().min(1),
  tiers: z
    .array(
      z.object({
        id: z.string().min(1),
        features: z.object({
          removeAds: z.boolean(),
          industryPresetPack: z.enum(["core", "full"]),
          batchRetryAdvanced: z.boolean(),
          silentInstallBatch: z.boolean(),
          offlineCachePack: z.boolean(),
          teamPolicyTemplate: z.boolean(),
          complianceAuditReport: z.enum(["basic", "standard", "advanced"]),
          prioritySupport: z.boolean()
        })
      })
    )
    .min(2),
  adSlots: z
    .array(
      z.object({
        id: z.string().min(1),
        maxCards: z.number().int().positive(),
        requiresDisclosure: z.boolean()
      })
    )
    .min(1)
});

function loadJson<T>(fileName: string): T {
  const filePath = path.resolve(process.cwd(), "config", fileName);
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

describe("monetization configuration", () => {
  it("pricing plan ids are unique and map to entitlement tiers", () => {
    const pricing = pricingSchema.parse(loadJson("pricing.json"));
    const entitlements = entitlementsSchema.parse(loadJson("entitlements.json"));

    const planIds = pricing.plans.map((plan) => plan.id);
    expect(new Set(planIds).size).toBe(planIds.length);

    const entitlementIds = new Set(entitlements.tiers.map((tier) => tier.id));
    for (const plan of pricing.plans) {
      expect(entitlementIds.has(plan.entitlementTier)).toBe(true);
    }
  });

  it("free plan is ad-enabled and all paid plans are ad-free", () => {
    const pricing = pricingSchema.parse(loadJson("pricing.json"));
    const freePlan = pricing.plans.find((plan) => plan.id === "free");
    expect(freePlan).toBeTruthy();
    expect(freePlan?.ads.enabled).toBe(true);

    const paidPlans = pricing.plans.filter((plan) => plan.id !== "free");
    expect(paidPlans.length).toBeGreaterThan(0);
    for (const plan of paidPlans) {
      expect(plan.billing.mode).toBe("annual");
      expect(plan.ads.enabled).toBe(false);
    }
  });
});
